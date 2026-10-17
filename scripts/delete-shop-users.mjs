import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
const apply=process.argv.includes('--apply'),count=process.argv.find(v=>v.startsWith('--approved-count='))?.split('=')[1],approvedHash=process.argv.find(v=>v.startsWith('--approved-hash='))?.split('=')[1];
const db=new DatabaseSync(path.resolve(process.env.LOCAL_DATA_DIR||'.local','stock.sqlite'),{readOnly:!apply});
try{
 const accounts=db.prepare("SELECT id,email,role FROM users WHERE role IN ('owner','shop') ORDER BY id").all();
 const hash=createHash('sha256').update(JSON.stringify(accounts)).digest('hex');
 const report={dryRun:!apply,accounts,count:accounts.length,approvalHash:hash,deleted:0};
 if(apply){
  if(count===undefined||Number(count)!==accounts.length||approvedHash!==hash)throw Error('Review the dry run and supply both its approved count and exact approval hash.');
  if(accounts.length){
   const backup=spawnSync(process.execPath,['scripts/backup-db.mjs'],{encoding:'utf8',windowsHide:true});if(backup.status!==0)throw Error('Backup failed; accounts preserved.');
   db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; BEGIN IMMEDIATE;');
   try{const current=db.prepare("SELECT id,email,role FROM users WHERE role IN ('owner','shop') ORDER BY id").all();if(JSON.stringify(current)!==JSON.stringify(accounts))throw Error('Account list changed; repeat the dry run.');for(const account of accounts){db.prepare('UPDATE shops SET owner_id=NULL WHERE owner_id=?').run(account.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(account.id);report.deleted+=db.prepare('DELETE FROM users WHERE id=? AND role IN (\'owner\',\'shop\')').run(account.id).changes;}db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
  }
 }
 console.log(JSON.stringify(report,null,2));
}finally{db.close();}
