import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openLocalDatabase } from '../local/database.mjs';
import { migrateAsync } from '../local/migrate.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

test('isolated async SQLite database applies the existing schema migrations without source data', async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'nearbuy-migration-phase1-'));
  const db = openLocalDatabase(path.join(dir, 'isolated.sqlite'));
  try {
    await db.exec(readFileSync(path.join(root, 'local', 'schema.sql'), 'utf8'));
    assert.equal(await migrateAsync(db), true);
    assert.equal(await migrateAsync(db), false, 'migration rerun should be idempotent');
    const versions = await db.prepare('SELECT version FROM schema_migrations ORDER BY version').all();
    assert.deepEqual(versions, [{ version: 1 }, { version: 2 }, { version: 3 }, { version: 4 }, { version: 5 }]);
    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('catalog_products','catalog_variants','offers','sessions') ORDER BY name").all();
    assert.deepEqual(tables.map(row => row.name), ['catalog_products', 'catalog_variants', 'offers', 'sessions']);
    assert.deepEqual(await db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.equal((await db.prepare('SELECT count(*) AS n FROM products').get()).n, 0, 'isolated schema contains no production records');
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
