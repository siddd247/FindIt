import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {importShops} from '../local/import-shops.mjs';
const input=process.argv.find(x=>x.startsWith('--file='))?.slice(7)||'docs/jammu_shops_seed.csv';
const db=new DatabaseSync(path.resolve(process.env.LOCAL_DATA_DIR||'.local','stock.sqlite'));
try{const report=importShops(db,readFileSync(input,'utf8'),{dryRun:!process.argv.includes('--apply'),sourceName:path.basename(input)});if(process.argv.includes('--report'))writeFileSync('docs/SHOPS-IMPORT-REPORT.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));if(report.errors.length)process.exitCode=1;}finally{db.close();}
