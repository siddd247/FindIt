import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {replaceCatalogue} from '../local/replace-catalogue.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arg=key=>process.argv.find(v=>v.startsWith('--'+key+'='))?.slice(key.length+3);
const input=arg('file');if(!input)throw Error('Supply --file=<products JSON path>. Default is validation only; --apply replaces the active catalogue after backup.');
let file=path.resolve(input);if(statSync(file).isDirectory())file=path.join(file,'products_catalog.json');
if(statSync(file).size>20000000)throw Error('Dataset exceeds the 20 MB limit.');
const raw=readFileSync(file),rows=JSON.parse(raw.toString('utf8').replace(/^\uFEFF/,''));
const sourceHash=createHash('sha256').update(raw).digest('hex'),sourceName=path.basename(file);
const dbPath=path.resolve(root,process.env.LOCAL_DATA_DIR||'.local','stock.sqlite');
if(!existsSync(dbPath))throw Error('Existing database not found. Start the project first.');
const db=new DatabaseSync(dbPath);db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
try{
 const dry=replaceCatalogue(db,rows,{sourceHash,sourceName});
 if(dry.errors.length||!process.argv.includes('--apply')){console.log(JSON.stringify(dry,null,2));if(dry.errors.length)process.exitCode=1;}
 else{
  // The verified full snapshot includes accounts but is never served or committed.
  const backup=spawnSync(process.execPath,['scripts/backup-db.mjs'],{cwd:root,env:process.env,encoding:'utf8',windowsHide:true});
  if(backup.status!==0)throw Error('Backup failed; no data changed. '+backup.stderr);
  const saved=JSON.parse(backup.stdout);if(saved.integrity!=='ok')throw Error('Backup integrity failed.');
  const dir=path.join(path.dirname(dbPath),'datasets');mkdirSync(dir,{recursive:true});
  const snapshot=path.join(dir,sourceHash+'.json');
  if(!existsSync(snapshot))writeFileSync(snapshot,raw,{flag:'wx'});
  const report=replaceCatalogue(db,rows,{apply:true,sourceHash,sourceName,backupPath:saved.backup});
  report.datasetSnapshot=snapshot;
  writeFileSync(path.join(dir,'replacement-'+sourceHash+'.report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
 }
}finally{db.close();}
