import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const migration = fileURLToPath(new URL('./migrations/001_sourced_shops.', import.meta.url));
function execute(db, sql) {
  db.exec('PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE;');
  try {
    db.exec(sql);
    const errors = db.prepare('PRAGMA foreign_key_check').all();
    if (errors.length) throw new Error('Migration would break foreign keys.');
    db.exec('COMMIT;');
  } catch (error) { db.exec('ROLLBACK;'); throw error; }
  finally { db.exec('PRAGMA foreign_keys=ON;'); }
}
export function migrate(db) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL)');
  if (db.prepare('SELECT version FROM schema_migrations WHERE version=1').get()) return false;
  execute(db, readFileSync(migration + 'up.sql','utf8') + "\nINSERT INTO schema_migrations VALUES (1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));");
  return true;
}
export function rollback(db) {
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version=1').get()) return false;
  for (const table of ['admins','admin_sessions','import_batches','shop_counts']) if (db.prepare('SELECT count(*) AS n FROM '+table).get().n) throw new Error('Rollback refused: new records must be preserved. Restore a reviewed backup instead.');
  if (db.prepare('SELECT id FROM shops WHERE lat IS NULL OR lng IS NULL OR address IS NULL OR phone IS NULL OR hours IS NULL LIMIT 1').get()) throw new Error('Rollback refused: old schema cannot represent missing shop data.');
  for (const field of ['series','variant','launch_year','official_url','compatible_with','image_license']) if (db.prepare('SELECT id FROM products WHERE '+field+' IS NOT NULL LIMIT 1').get()) throw new Error('Rollback refused: product source data must be preserved.');
  execute(db, readFileSync(migration + 'down.sql','utf8') + '\nDELETE FROM schema_migrations WHERE version=1;');
  return true;
}
