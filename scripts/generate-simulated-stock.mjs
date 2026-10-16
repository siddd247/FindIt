import {DatabaseSync} from 'node:sqlite';
import {writeFileSync,renameSync,copyFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {generateSimulatedStock,simulationInputs} from '../local/simulated-stock.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dir=path.resolve(root,process.env.LOCAL_DATA_DIR||'.local');
const db=new DatabaseSync(path.join(dir,'stock.sqlite'),{readOnly:true});
try{
 const {products,shops}=simulationInputs(db),seed=process.argv.find(v=>v.startsWith('--seed='))?.slice(7),data=generateSimulatedStock(products,shops,{seed,approveAll:process.argv.includes('--approve-all')});
 const file=path.join(dir,'simulated-stock.json');
 if(existsSync(file))copyFileSync(file,path.join(dir,'simulated-stock-before-'+Date.now()+'.json'));
 writeFileSync(file+'.tmp',JSON.stringify(data));renameSync(file+'.tmp',file);
 console.log(JSON.stringify({file,simulated:true,notice:data.notice,seed:data.seed,years:data.recent_years,...data.summary,realInventoryChanged:false},null,2));
}finally{db.close();}
