import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {browserStore,parseJSON,featuredProducts,catalogueCards} from '../web/public-content.mjs';
import {simulationSearchMatches,shopAssignmentContent} from '../web/simulation.mjs';

test('featured models prefer recent launches, cover categories and avoid repeated configurations',()=>{
 const products=[
  {id:'old',brand:'A',model:'Phone',name:'Old phone',category_id:'phones',launch_year:2020},
  {id:'new',brand:'A',model:'Phone',name:'New phone',category_id:'phones',launch_year:2026},
  {id:'laptop',brand:'A',model:'Laptop',name:'Laptop',category_id:'laptops',launch_year:2025},
  {id:'audio',brand:'B',model:'Buds',name:'Buds',category_id:'audio',launch_year:2024}
 ];
 assert.deepEqual(featuredProducts(products,3).map(p=>p.id),['new','laptop','audio']);
 assert.equal(products[0].id,'old');
 assert.equal(featuredProducts(products,2).length,2);
});

test('blocked storage and malformed saved JSON cannot stop public rendering',()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 try{
  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Blocked');}});
  assert.equal(browserStore.getItem('recent'),null);
  assert.doesNotThrow(()=>browserStore.setItem('theme','dark'));
  assert.doesNotThrow(()=>browserStore.removeItem('recent'));
  assert.deepEqual(parseJSON('{broken',[]),[]);
  assert.doesNotThrow(()=>catalogueCards([{id:'p',name:'Phone',specs:'{broken'}],()=>''));
 }finally{if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage;}
});

const product={id:'phone',name:'Fixture Phone',brand:'Fixture',model:'Phone',category_id:'phones',specs:'{}',launch_year:2026,reference_price:50000,reference_currency:'INR'};
const assignment={available:true,total:32,summary:{approval:{status:'admin_approved',scope:'all_products_all_active_shops',stock_confirmed:false}},rows:Array.from({length:32},(_,i)=>({product,shop:{id:'shop-'+i,name:'Fixture shop '+i,area:'Jammu'}}))};

test('shop matches expand without duplicate stores and shop pages retain stock evidence',()=>{
 const query=new URLSearchParams({q:'Fixture Phone'});
 const compact=simulationSearchMatches(assignment,query,{limit:12});
 assert.equal((compact.match(/class="panel simulated-shop-card"/g)||[]).length,12);
 assert.match(compact,/Show all 32 shops/);
 const expanded=simulationSearchMatches(assignment,query,{limit:64});
 assert.equal((expanded.match(/class="panel simulated-shop-card"/g)||[]).length,32);
 assert.match(expanded,/\/shops\/shop-0\?q=Fixture%20Phone/);
 const shop=shopAssignmentContent(assignment,new URLSearchParams({shop:'shop-0'}));
 assert.equal((shop.match(/class="panel shop-catalogue-card"/g)||[]).length,1);
 assert.match(shop,/Stock remains unconfirmed|not confirmed stock/i);
 assert.match(shop,/not a shop quote/);
});

test('actual search module separates assigned shops, confirmed stock and product views',()=>{
 for(const view of ['shops','confirmed','products']){
  const code=`
   const product=${JSON.stringify(product)},assignment=${JSON.stringify(assignment)};
   globalThis.location=new URL('/search?q=Fixture&view=${view}','http://127.0.0.1:3001');
   globalThis.fetch=async u=>({ok:true,json:async()=>String(u).includes('/session')?{user:null}:String(u).includes('/catalogue')?[product]:String(u).includes('/simulation')?assignment:{products:[product],listings:[],shops:[]}});
   Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
   globalThis.window={addEventListener(){}};
   const app={innerHTML:''};globalThis.document={documentElement:{dataset:{}},querySelector:s=>s==='#app'?app:null,addEventListener(){}};
   await import('./web/app.js');await new Promise(r=>setTimeout(r,150));console.log(app.innerHTML);
  `;
  const result=spawnSync(process.execPath,['--input-type=module','-e',code],{encoding:'utf8',windowsHide:true,timeout:5000});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/data-results-view="shops"/);
  assert.match(result.stdout,/data-results-view="confirmed"/);
  assert.match(result.stdout,/data-results-view="products"/);
  if(view==='shops'){assert.match(result.stdout,/Fixture shop \d+/);assert.doesNotMatch(result.stdout,/No confirmed stock listings/);}
  if(view==='confirmed'){assert.match(result.stdout,/No confirmed stock listings/);assert.doesNotMatch(result.stdout,/class="panel simulated-shop-card"/);}
  if(view==='products'){assert.match(result.stdout,/class="panel catalogue-card"/);assert.doesNotMatch(result.stdout,/No confirmed stock listings/);}
 }
});
