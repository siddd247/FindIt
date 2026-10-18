import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';import {spawn} from 'node:child_process';import path from 'node:path';
import {migrate} from '../local/migrate.mjs';import {migrateCatalog} from '../local/catalog-model.mjs';import {seedCatalog} from '../local/catalog-seed.mjs';
import {getModel,listModels} from '../local/catalog-read.mjs';import {selectVariant,initialSelection,compareOffers} from '../web/variant-selection.mjs';
import {makeTestDirectory,freePort,stopServer} from './helpers/runtime.mjs';
function fixture(filename=':memory:'){
 const db=new DatabaseSync(filename);db.exec(readFileSync('local/schema.sql','utf8'));migrate(db);db.prepare("INSERT INTO categories(id,name) VALUES ('generic','Generic')").run();
 for(const [id,size,color,price]of [['v1','Small','Black',1000],['v2','Large','Black',2000],['v3','Small','White',1100]])db.prepare('INSERT INTO products(id,brand,model,name,category_id,specs,aliases,reference_price,reference_currency) VALUES (?,?,?,?,?,?,?,?,?)').run(id,'Fixture','Model','Fixture '+size+' '+color,'generic',JSON.stringify({supplied_specs:{size,color},slug:id+'-slug'}),JSON.stringify([size,color]),price,'INR');
 db.prepare("INSERT INTO products(id,brand,model,name,category_id,specs,deleted_at) VALUES ('archived','Fixture','Old model','Old model','generic','{}','2020-01-01')").run();
 for(let i=0;i<4;i++)db.prepare('INSERT INTO shops(id,name,area,city,status) VALUES (?,?,?,?,?)').run('s'+i,'Retailer '+i,'Jammu','Jammu','active');
 migrateCatalog(db,{apply:true});seedCatalog(db,{apply:true});return db;
}
test('model search matches child values once and every option combination resolves to a real variant',async()=>{
 const db=fixture();try{
  assert.equal((await listModels(db,new URLSearchParams({q:'Large'}))).total,1);assert.equal((await listModels(db)).models[0].variants_count,3);
  const data=await getModel(db,(await listModels(db)).models[0].id),{product,variants}=data;
  for(const size of ['Small','Large'])for(const color of ['Black','White']){const chosen=selectVariant(product,variants,{size,color},'size');assert.ok(variants.some(v=>v.id===chosen.id));}
  const initial=initialSelection(product,variants,new URLSearchParams());assert.equal(initial.chosen.id,'v1');
  assert.equal(initialSelection(product,variants,new URLSearchParams({variant:'v2'})).chosen.id,'v2');
  const offers=compareOffers([{shop_id:'a',price:1,stock_status:'out_of_stock'},{shop_id:'b',price:10,stock_status:'low_stock'},{shop_id:'c',price:20,stock_status:'available'}]);assert.equal(offers[0].shop_id,'b');assert.equal(offers.filter(o=>o.isBestPrice).length,1);assert.equal(offers.at(-1).isBestPrice,false);
 }finally{db.close();}
});
test('HTTP active legacy IDs redirect with selection, archived IDs are 410/noindex, admin entry is /control',async t=>{
 const dir=makeTestDirectory(path.resolve('.local/buyer-test-')),db=fixture(path.join(dir,'stock.sqlite'));const parent=(await listModels(db)).models[0];db.close();
 writeFileSync(path.join(dir,'security.json'),JSON.stringify({adminPath:'/control-previous',setupToken:'fixture-token',createdAt:new Date().toISOString()}));
 const port=await freePort(),base='http://127.0.0.1:'+port,proc=spawn(process.execPath,['local/server.mjs'],{env:{...process.env,LOCAL_DATA_DIR:dir,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});t.after(()=>stopServer(proc));
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timed out')),10000);proc.stdout.on('data',chunk=>{if(String(chunk).includes('running at')){clearTimeout(timer);resolve();}});proc.once('error',reject);});
 const old=await fetch(base+'/products/v2?shop=s1',{redirect:'manual'});assert.equal(old.status,301);const target=new URL(old.headers.get('location'),base);assert.equal(target.pathname,'/products/'+parent.slug);assert.equal(target.searchParams.get('variant'),'v2');assert.equal(target.searchParams.get('shop'),'s1');
 const page=await fetch(target);assert.equal(page.status,200);const html=await page.text();assert.match(html,/rel="canonical"/);assert.match(html,/AggregateOffer/);
 const archived=await fetch(base+'/products/archived',{redirect:'manual'});assert.equal(archived.status,410);assert.match(archived.headers.get('x-robots-tag'),/noindex/);assert.match(await archived.text(),/No longer listed/);
 const control=await fetch(base+'/control-previous',{redirect:'manual'});assert.equal(control.status,301);assert.equal(control.headers.get('location'),'/control');assert.equal((await fetch(base+'/control')).status,200);
 const shop=await(await fetch(base+'/api/catalog-shops/s1?category=generic')).json();assert.equal(shop.models.length,1);assert.equal(shop.categories.length,1);
});
