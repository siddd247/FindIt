import {DatabaseSync} from 'node:sqlite';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {migrate} from '../local/migrate.mjs';
import {migrateCatalog} from '../local/catalog-model.mjs';
const apply=process.argv.includes('--apply'),dbPath=path.resolve(process.env.LOCAL_DATA_DIR||'.local','stock.sqlite');
if(apply){const backup=spawnSync(process.execPath,['scripts/backup-db.mjs'],{encoding:'utf8',windowsHide:true});if(backup.status!==0)throw Error('Backup failed; migration not started.');console.log('Backup:',JSON.parse(backup.stdout).backup);}
const db=new DatabaseSync(dbPath,{readOnly:!apply});
try{if(apply){db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');migrate(db);}console.log(JSON.stringify(migrateCatalog(db,{apply}),null,2));}finally{db.close();}
