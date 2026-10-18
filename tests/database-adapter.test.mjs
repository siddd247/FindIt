import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openLocalDatabase, openTursoDatabase, openApplicationDatabase } from '../local/database.mjs';

test('async SQLite adapter retains prepared queries, transactions and rollback', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'nearbuy-db-adapter-'));
  const db = openLocalDatabase(path.join(dir, 'test.sqlite'));
  try {
    await db.exec('CREATE TABLE rows (id TEXT PRIMARY KEY, value TEXT NOT NULL)');
    await db.prepare('INSERT INTO rows VALUES (?, ?)').run('a', 'first');
    assert.deepEqual(await db.prepare('SELECT * FROM rows WHERE id=?').get('a'), { id: 'a', value: 'first' });
    await assert.rejects(db.transaction(async tx => {
      await tx.prepare('INSERT INTO rows VALUES (?, ?)').run('b', 'rollback');
      throw new Error('abort');
    }), /abort/);
    assert.deepEqual(await db.prepare('SELECT id FROM rows ORDER BY id').all(), [{ id: 'a' }]);
    await db.transaction(async tx => {
      await tx.prepare('INSERT INTO rows VALUES (?, ?)').run('b', 'commit');
    });
    assert.deepEqual(await db.prepare('SELECT id FROM rows ORDER BY id').all(), [{ id: 'a' }, { id: 'b' }]);
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('Turso adapter maps asynchronous execute results and transaction boundaries', async () => {
  const calls = [];
  const executor = {
    async execute(statement) {
      calls.push(statement);
      if (statement.sql.startsWith('SELECT')) return { rows: [Object.assign(['t', 'remote'], { id: 't', value: 'remote' })], columns: ['id', 'value'], rowsAffected: 0 };
      return { rows: [], columns: [], rowsAffected: 1, lastInsertRowid: 1 };
    },
    async executeMultiple(sql) { calls.push({ multiple: sql }); },
  };
  const tx = { ...executor, async commit() { calls.push({ commit: true }); }, async rollback() { calls.push({ rollback: true }); } };
  const client = { ...executor, async transaction(mode) { calls.push({ transaction: mode }); return tx; }, close() {} };
  const db = openTursoDatabase({ client });
  assert.deepEqual(await db.prepare('SELECT * FROM rows WHERE id=?').get('t'), { id: 't', value: 'remote' });
  await db.transaction(async connection => {
    const result = await connection.prepare('INSERT INTO rows VALUES (?, ?)').run('t', 'remote');
    assert.equal(result.changes, 1);
  });
  assert.ok(calls.some(call => call.transaction === 'write'));
  assert.ok(calls.some(call => call.commit));
  assert.equal(calls.find(call => call.sql?.startsWith('SELECT')).args[0], 't');
});

test('Vercel storage selection requires Turso credentials and cannot fall back to local disk', () => {
  assert.throws(() => openApplicationDatabase({ dataDir: '.local/test', env: { VERCEL: '1' } }), /TURSO_DATABASE_URL/);
});

