import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@libsql/client/web';
import path from 'node:path';

function rowsAsObjects(rows, columns = []) {
  return rows.map(row => columns.length
    ? Object.fromEntries(columns.map((name, index) => [name, row[name] ?? row[index]]))
    : Object.fromEntries(Object.keys(row).map(key => [key, row[key]])));
}

function localConnection(raw) {
  const adapter = {
    kind: 'sqlite',
    prepare(sql) {
      const statement = raw.prepare(sql);
      return {
        all: (...args) => Promise.resolve(statement.all(...args).map(row => ({ ...row }))),
        get: (...args) => Promise.resolve(statement.get(...args)).then(row => row && ({ ...row })),
        run: (...args) => Promise.resolve(statement.run(...args)),
      };
    },
    exec(sql) { raw.exec(sql); return Promise.resolve(); },
    async transaction(callback) {
      raw.exec('BEGIN IMMEDIATE');
      try {
        const result = await callback(adapter);
        raw.exec('COMMIT');
        return result;
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
    close() { raw.close(); },
    raw,
  };
  return adapter;
}

function remoteConnection(client) {
  const wrap = executor => ({
    prepare(sql) {
      return {
        async all(...args) {
          const result = await executor.execute({ sql, args });
          return rowsAsObjects(result.rows, result.columns);
        },
        async get(...args) {
          const result = await executor.execute({ sql, args });
          return rowsAsObjects(result.rows, result.columns)[0];
        },
        async run(...args) {
          const result = await executor.execute({ sql, args });
          return { changes: Number(result.rowsAffected ?? 0), lastInsertRowid: result.lastInsertRowid };
        },
      };
    },
    async exec(sql) { await executor.executeMultiple(sql); },
  });

  const adapter = {
    kind: 'turso',
    ...wrap(client),
    async transaction(callback) {
      const tx = await client.transaction('write');
      try {
        const result = await callback(wrap(tx));
        await tx.commit();
        return result;
      } catch (error) {
        await tx.rollback();
        throw error;
      }
    },
    close() { return client.close(); },
    client,
  };
  return adapter;
}

/** Open the existing on-disk SQLite database for local development and tests. */
export function openLocalDatabase(filename, { busyTimeout = 5000 } = {}) {
  const raw = new DatabaseSync(filename);
  raw.exec(`PRAGMA busy_timeout=${Math.max(0, Math.trunc(busyTimeout))};`);
  return localConnection(raw);
}

/** Create a remote Turso connection from server-only environment variables. */
export function openTursoDatabase({ url = process.env.TURSO_DATABASE_URL, authToken = process.env.TURSO_AUTH_TOKEN, client } = {}) {
  if (!client && (!url || !authToken)) throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required for Turso storage.');
  return remoteConnection(client || createClient({ url, authToken }));
}

/** Select persistence explicitly. Never silently fall back to ephemeral disk in Vercel. */
export function openApplicationDatabase({ dataDir, env = process.env, client } = {}) {
  if (env.VERCEL === '1' || env.NEARBY_DATABASE === 'turso') {
    return openTursoDatabase({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN, client });
  }
  if (!dataDir) throw new Error('dataDir is required for local SQLite storage.');
  return openLocalDatabase(path.join(dataDir, 'stock.sqlite'));
}

