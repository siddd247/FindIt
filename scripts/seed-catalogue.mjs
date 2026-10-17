import {DatabaseSync} from 'node:sqlite';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {seedCatalog,wipeCatalogSeed} from '../local/catalog-seed.mjs';
const apply=process.argv.includes('--apply'),wipe=process.argv.includes('--wipe'),reroll=process.argv.includes('--reroll');
const seed=process.argv.find(v=>v.startsWith('--seed='))?.slice('--seed='.length);
if(apply){const backup=spawnSync(process.execPath,['scripts/backup-db.mjs'],{encoding:'utf8',windowsHide:true});if(backup.status!==0)throw Error('Backup failed; seed not changed.');console.log('Backup:',JSON.parse(backup.stdout).backup);}
const db=new DatabaseSync(path.resolve(process.env.LOCAL_DATA_DIR||'.local','stock.sqlite'),{readOnly:!apply});
try{if(apply)db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');if(apply&&reroll)db.exec('BEGIN IMMEDIATE');if(wipe||reroll)console.log(JSON.stringify({wipe:wipeCatalogSeed(db,{apply})},null,2));if(!wipe||reroll)console.log(JSON.stringify(seedCatalog(db,{apply,...(seed?{seed}:{})}),null,2));if(apply&&reroll)db.exec('COMMIT');}catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}finally{db.close();}
