import {createHash,randomBytes} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {matchProduct,distanceKm,isOpen} from '../lib/rules.ts';

export const simulationNotice='Store catalogue. Market indicative prices are not a shop quote; contact the store to confirm stock.';
export const approvedAssignmentNotice='Admin-approved catalogue assignments. Shops have not confirmed product availability. INR amounts are estimates, not shop quotes.';
export async function simulationInputs(db){
 const [products,shops]=await Promise.all([db.prepare('SELECT id,name,brand,model,aliases,category_id,launch_year,reference_price,reference_currency FROM products WHERE deleted_at IS NULL AND canonical_id IS NULL AND sample=0 ORDER BY id').all(),db.prepare("SELECT id,name,area FROM shops WHERE deleted_at IS NULL AND status='active' AND sample=0 ORDER BY id").all()]);
 return {products,shops};
}
export function simulationFingerprint(products,shops){
 return createHash('sha256').update(JSON.stringify({products:[...products].sort((a,b)=>a.id.localeCompare(b.id)),shops:[...shops].sort((a,b)=>a.id.localeCompare(b.id))})).digest('hex');
}
export function generateSimulatedStock(products,shops,{seed=randomBytes(16).toString('hex'),year=new Date().getUTCFullYear(),approveAll=false}={}){
 if(!products.length||!shops.length)throw Error('An active product catalogue and at least one active shop are required.');
 if(new Set(products.map(p=>p.id)).size!==products.length||new Set(shops.map(s=>s.id)).size!==shops.length)throw Error('Product and shop IDs must be unique.');
 let counter=0;const random=()=>createHash('sha256').update(seed+'|'+counter++).digest().readUInt32BE()/4294967296;
 const assignments=[],coverage=[],orderedProducts=[...products].sort((a,b)=>a.id.localeCompare(b.id)),orderedShops=[...shops].sort((a,b)=>a.id.localeCompare(b.id));
 for(const p of orderedProducts){
  const recent=Number.isInteger(p.launch_year)&&p.launch_year>=year-2&&p.launch_year<=year;
  const low=Math.max(1,Math.ceil(shops.length*(recent ? 0.8 : 0.1))),high=Math.max(low,Math.floor(shops.length*(recent ? 0.95 : 0.3)));
  const count=approveAll?shops.length:low+Math.floor(random()*(high-low+1)),shuffled=[...orderedShops];
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  for(const shop of shuffled.slice(0,count))assignments.push({product_id:p.id,shop_id:shop.id,simulated:true,...(approveAll?{catalogue_approved:true}:{})});
  coverage.push({product_id:p.id,recent,shops:count});
 }
 const recent=coverage.filter(c=>c.recent),older=coverage.filter(c=>!c.recent);
 const approval=approveAll?{status:'admin_approved',scope:'all_products_all_active_shops',approved_at:new Date().toISOString(),actor:'workspace_user_instruction',stock_confirmed:false}:null;
 return {version:1,simulated:true,notice:approveAll?approvedAssignmentNotice:simulationNotice,seed,generated_at:new Date().toISOString(),source_fingerprint:simulationFingerprint(products,shops),recent_years:[year-2,year-1,year],summary:{products:products.length,shops:shops.length,assignments:assignments.length,recent_products:recent.length,older_products:older.length,...(approval?{approval}:{}),recent_shops_per_product:{min:recent.length?Math.min(...recent.map(c=>c.shops)):0,max:recent.length?Math.max(...recent.map(c=>c.shops)):0},older_shops_per_product:{min:older.length?Math.min(...older.map(c=>c.shops)):0,max:older.length?Math.max(...older.map(c=>c.shops)):0}},assignments};
}

export async function querySimulatedStock(db,dataDir,params){
 const file=path.join(dataDir,'simulated-stock.json');
 const empty={available:false,simulated:true,notice:simulationNotice,rows:[],total:0,page:1,pages:0,shops:[],categories:[]};
 if(!existsSync(file))return {...empty,message:'Store catalogues are not available yet.'};
 const data=JSON.parse(readFileSync(file,'utf8'));
 if(data.version!==1||data.simulated!==true||!Array.isArray(data.assignments))throw Error('Invalid catalogue assignment file.');
 const {products,shops}=await simulationInputs(db);
 if(data.source_fingerprint!==simulationFingerprint(products,shops))return {...empty,message:'The catalogue or shop directory has changed. Refresh the store catalogue index.'};
 const query=(params.get('q')||'').slice(0,150),category=params.get('category')||'',shop=params.get('shop')||'',product=params.get('product')||'';
 const matching=new Map(products.filter(p=>(!category||p.category_id===category)&&(!product||p.id===product)&&matchProduct(p,query)>0).map(p=>[p.id,p]));
 const directory=await db.prepare("SELECT id,name,area,pincode,lat,lng,hours FROM shops WHERE deleted_at IS NULL AND status='active' AND sample=0 ORDER BY id").all();
 const area=String(params.get('area')||params.get('pincode')||'').trim().toLowerCase();
 const lat=params.has('lat')?Number(params.get('lat')):null,lng=params.has('lng')?Number(params.get('lng')):null;
 if((lat===null)!==(lng===null)||lat!==null&&(!Number.isFinite(lat)||!Number.isFinite(lng)||Math.abs(lat)>90||Math.abs(lng)>180))throw Object.assign(new Error('Invalid search coordinates.'),{status:400});
 const radius=Math.min(50,Math.max(1,Number(params.get('radius'))||5));
 const eligible=directory.filter(s=>(!area||String(s.area||'').toLowerCase().includes(area)||s.pincode===area)&&(!params.has('lat')||s.lat!==null&&s.lng!==null&&distanceKm({lat,lng},s)<=radius)&&(!['1','true'].includes(params.get('open'))||s.hours&&isOpen(s.hours)));
 const eligibleIds=new Set(eligible.map(s=>s.id)),shopMap=new Map(directory.map(s=>[s.id,s]));
 const rows=data.assignments.filter(a=>matching.has(a.product_id)&&eligibleIds.has(a.shop_id)&&(!shop||a.shop_id===shop));
 const size=40,pages=Math.ceil(rows.length/size),page=Math.min(Math.max(1,parseInt(params.get('page'),10)||1),Math.max(1,pages));
 const approved=data.summary.approval?.status==='admin_approved'&&data.summary.approval.stock_confirmed===false;
 return {available:true,simulated:true,notice:approved?approvedAssignmentNotice:simulationNotice,summary:data.summary,generated_at:data.generated_at,recent_years:data.recent_years,total:rows.length,page,pages,shops:directory,matching_shop_ids:eligible.map(s=>s.id),categories:[...new Set(products.map(p=>p.category_id))].sort(),rows:rows.slice((page-1)*size,page*size).map(a=>({simulated:true,status:approved?'admin_approved_stock_unconfirmed':'simulated_available',confirmation:null,product:matching.get(a.product_id),shop:shopMap.get(a.shop_id)}))};
}
