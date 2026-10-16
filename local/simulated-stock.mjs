import {createHash,randomBytes} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {matchProduct} from '../lib/rules.ts';

export const simulationNotice='Simulated inventory: randomly generated assignments, not confirmed shop stock. Do not rely on this page to plan a purchase or shop visit.';
export function simulationInputs(db){
 return {products:db.prepare('SELECT id,name,brand,model,aliases,category_id,launch_year,reference_price,reference_currency FROM products WHERE deleted_at IS NULL AND canonical_id IS NULL AND sample=0 ORDER BY id').all(),shops:db.prepare("SELECT id,name,area FROM shops WHERE deleted_at IS NULL AND status='active' AND sample=0 ORDER BY id").all()};
}
export function simulationFingerprint(products,shops){
 return createHash('sha256').update(JSON.stringify({products:[...products].sort((a,b)=>a.id.localeCompare(b.id)),shops:[...shops].sort((a,b)=>a.id.localeCompare(b.id))})).digest('hex');
}
export function generateSimulatedStock(products,shops,{seed=randomBytes(16).toString('hex'),year=new Date().getUTCFullYear()}={}){
 if(!products.length||!shops.length)throw Error('An active product catalogue and at least one active shop are required.');
 if(new Set(products.map(p=>p.id)).size!==products.length||new Set(shops.map(s=>s.id)).size!==shops.length)throw Error('Product and shop IDs must be unique.');
 let counter=0;const random=()=>createHash('sha256').update(seed+'|'+counter++).digest().readUInt32BE()/4294967296;
 const assignments=[],coverage=[],orderedProducts=[...products].sort((a,b)=>a.id.localeCompare(b.id)),orderedShops=[...shops].sort((a,b)=>a.id.localeCompare(b.id));
 for(const p of orderedProducts){
  const recent=Number.isInteger(p.launch_year)&&p.launch_year>=year-2&&p.launch_year<=year;
  const low=Math.max(1,Math.ceil(shops.length*(recent ? 0.8 : 0.1))),high=Math.max(low,Math.floor(shops.length*(recent ? 0.95 : 0.3)));
  const count=low+Math.floor(random()*(high-low+1)),shuffled=[...orderedShops];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  for(const shop of shuffled.slice(0,count))assignments.push({product_id:p.id,shop_id:shop.id,simulated:true});
  coverage.push({product_id:p.id,recent,shops:count});
 }
 const recent=coverage.filter(c=>c.recent),older=coverage.filter(c=>!c.recent);
 return {version:1,simulated:true,notice:simulationNotice,seed,generated_at:new Date().toISOString(),source_fingerprint:simulationFingerprint(products,shops),recent_years:[year-2,year-1,year],summary:{products:products.length,shops:shops.length,assignments:assignments.length,recent_products:recent.length,older_products:older.length,recent_shops_per_product:{min:recent.length?Math.min(...recent.map(c=>c.shops)):0,max:recent.length?Math.max(...recent.map(c=>c.shops)):0},older_shops_per_product:{min:older.length?Math.min(...older.map(c=>c.shops)):0,max:older.length?Math.max(...older.map(c=>c.shops)):0}},assignments};
}

export function querySimulatedStock(db,dataDir,params){
 const file=path.join(dataDir,'simulated-stock.json');
 const empty={available:false,simulated:true,notice:simulationNotice,rows:[],total:0,page:1,pages:0,shops:[],categories:[]};
 if(!existsSync(file))return {...empty,message:'No simulation has been generated yet.'};
 const data=JSON.parse(readFileSync(file,'utf8'));
 if(data.version!==1||data.simulated!==true||!Array.isArray(data.assignments))throw Error('Invalid simulation file.');
 const {products,shops}=simulationInputs(db);
 if(data.source_fingerprint!==simulationFingerprint(products,shops))return {...empty,message:'The catalogue or shop directory has changed. Regenerate the simulation.'};
 const query=(params.get('q')||'').slice(0,150),category=params.get('category')||'',shop=params.get('shop')||'',product=params.get('product')||'';
 const matching=new Map(products.filter(p=>(!category||p.category_id===category)&&(!product||p.id===product)&&matchProduct(p,query)>0).map(p=>[p.id,p]));
 const shopMap=new Map(shops.map(s=>[s.id,s]));
 const rows=data.assignments.filter(a=>matching.has(a.product_id)&&shopMap.has(a.shop_id)&&(!shop||a.shop_id===shop));
 const size=40,pages=Math.ceil(rows.length/size),page=Math.min(Math.max(1,parseInt(params.get('page'),10)||1),Math.max(1,pages));
 return {available:true,simulated:true,notice:simulationNotice,summary:data.summary,generated_at:data.generated_at,recent_years:data.recent_years,total:rows.length,page,pages,shops,categories:[...new Set(products.map(p=>p.category_id))].sort(),rows:rows.slice((page-1)*size,page*size).map(a=>({simulated:true,status:'simulated_available',confirmation:null,product:matching.get(a.product_id),shop:shopMap.get(a.shop_id)}))};
}
