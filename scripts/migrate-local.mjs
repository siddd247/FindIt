import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { migrate,rollback } from '../local/migrate.mjs';
const db = new DatabaseSync(path.resolve(process.env.LOCAL_DATA_DIR||'.local','stock.sqlite'));
try { console.log(JSON.stringify({changed:process.argv.includes('--down')?rollback(db):migrate(db)})); }
finally { db.close(); }
