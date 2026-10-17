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
  let changed=false;
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version=1').get()) { execute(db, readFileSync(migration + 'up.sql','utf8') + "\nINSERT INTO schema_migrations VALUES (1,strftime('%Y-%m-%dT%H:%M:%fZ','now'));"); changed=true; }
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version=2').get()) { execute(db, readFileSync(fileURLToPath(new URL('./migrations/002_evidence.up.sql',import.meta.url)),'utf8') + "\nINSERT INTO schema_migrations VALUES (2,strftime('%Y-%m-%dT%H:%M:%fZ','now'));"); changed=true; }
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version=3').get()) { execute(db, readFileSync(fileURLToPath(new URL('./migrations/003_release_indexes.up.sql',import.meta.url)),'utf8') + "\nINSERT INTO schema_migrations VALUES (3,strftime('%Y-%m-%dT%H:%M:%fZ','now'));"); changed=true; }
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version=4').get()) { execute(db, readFileSync(fileURLToPath(new URL('./migrations/004_parent_catalog.up.sql',import.meta.url)),'utf8') + "\nINSERT INTO schema_migrations VALUES (4,strftime('%Y-%m-%dT%H:%M:%fZ','now'));"); changed=true; }
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version=5').get()) { execute(db, readFileSync(fileURLToPath(new URL('./migrations/005_catalog_admin.up.sql',import.meta.url)),'utf8') + "\nINSERT INTO schema_migrations VALUES (5,strftime('%Y-%m-%dT%H:%M:%fZ','now'));"); changed=true; }
  return changed;
}
export function rollback(db) {
  if(db.prepare('SELECT version FROM schema_migrations WHERE version=4').get()&&db.prepare('SELECT id FROM catalog_products LIMIT 1').get())throw Error('Rollback refused: catalog records must be preserved.');
  if(db.prepare('SELECT version FROM schema_migrations WHERE version=5').get())execute(db,'ALTER TABLE catalog_requests DROP COLUMN result_variant_id; ALTER TABLE catalog_requests DROP COLUMN result_product_id; ALTER TABLE catalog_products DROP COLUMN default_locked; ALTER TABLE catalog_products DROP COLUMN redirect_to; DELETE FROM schema_migrations WHERE version=5;');
  if (db.prepare('SELECT version FROM schema_migrations WHERE version=4').get()) {
    for(const table of ['catalog_products','catalog_variants','offers','catalog_requests','catalog_seed_runs'])if(db.prepare('SELECT count(*) AS n FROM '+table).get().n)throw Error('Rollback refused: catalog records must be preserved.');
    execute(db,'DROP TABLE offer_history; DROP TABLE catalog_seed_effects; DROP TABLE catalog_requests; DROP TABLE offers; DROP TABLE catalog_legacy_map; DROP TABLE catalog_variants; DROP TABLE catalog_products; DROP TABLE catalog_seed_runs; ALTER TABLE users DROP COLUMN status; DELETE FROM schema_migrations WHERE version=4;');
  }
  if (db.prepare('SELECT version FROM schema_migrations WHERE version=3').get()) execute(db,'DROP INDEX IF EXISTS sessions_active_owner; DROP INDEX IF EXISTS listings_shop_product_active; DROP INDEX IF EXISTS products_category_active; DROP INDEX IF EXISTS reports_listing_created; DROP INDEX IF EXISTS shops_active_area; DELETE FROM schema_migrations WHERE version=3;');
  if (db.prepare('SELECT version FROM schema_migrations WHERE version=2').get()) {
    if(db.prepare('SELECT count(*) AS n FROM source_checks').get().n)throw new Error('Rollback refused: source evidence must be preserved.');
    execute(db,readFileSync(fileURLToPath(new URL('./migrations/002_evidence.down.sql',import.meta.url)),'utf8')+'\nDELETE FROM schema_migrations WHERE version=2;');
  }
  if (!db.prepare('SELECT version FROM schema_migrations WHERE version=1').get()) return false;
  for (const table of ['admins','admin_sessions','import_batches','shop_counts']) if (db.prepare('SELECT count(*) AS n FROM '+table).get().n) throw new Error('Rollback refused: new records must be preserved. Restore a reviewed backup instead.');
  if (db.prepare('SELECT id FROM shops WHERE lat IS NULL OR lng IS NULL OR address IS NULL OR phone IS NULL OR hours IS NULL LIMIT 1').get()) throw new Error('Rollback refused: old schema cannot represent missing shop data.');
  for (const field of ['series','variant','launch_year','official_url','compatible_with','image_license']) if (db.prepare('SELECT id FROM products WHERE '+field+' IS NOT NULL LIMIT 1').get()) throw new Error('Rollback refused: product source data must be preserved.');
  execute(db, readFileSync(migration + 'down.sql','utf8') + '\nDELETE FROM schema_migrations WHERE version=1;');
  return true;
}
