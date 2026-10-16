import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import path from 'node:path';import {importResearch} from '../local/import-research.mjs';
const data=JSON.parse(readFileSync('docs/catalogue-expansion-2026-10.json','utf8')),db=new DatabaseSync(path.resolve(process.env.LOCAL_DATA_DIR||'.local','stock.sqlite'));
try{const result=importResearch(db,data,{dryRun:!process.argv.includes('--apply')});console.log(JSON.stringify(result,null,2));if(result.errors.length)process.exitCode=1;}finally{db.close();}
