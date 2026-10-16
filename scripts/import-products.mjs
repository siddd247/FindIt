import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import path from 'node:path';import {importProducts} from '../local/import-products.mjs';
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3),file=arg('file')||'docs/products_template.csv',brand=arg('brand'),host=arg('official-host');
if(process.argv.includes('--apply')&&(!brand||!host))throw new Error('Applying a reviewed brand requires --brand and --official-host. Supply a real brand CSV; the template contains headers only.');
const db=new DatabaseSync(path.resolve(process.env.LOCAL_DATA_DIR||'.local','stock.sqlite'));
try{const r=importProducts(db,readFileSync(file,'utf8'),{dryRun:!process.argv.includes('--apply'),sourceName:path.basename(file),brand,approvedHosts:brand&&host?{[brand]:[host]}:{}});console.log(JSON.stringify(r,null,2));if(r.errors.length)process.exitCode=1;}finally{db.close();}
