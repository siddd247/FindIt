import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';import {spawn} from 'node:child_process';import path from 'node:path';
import {migrate} from '../local/migrate.mjs';import {migrateCatalog,catalogIntegrity} from '../local/catalog-model.mjs';import {seedCatalog,wipeCatalogSeed} from '../local/catalog-seed.mjs';
import {makeTestDirectory,freePort,stopServer} from './helpers/runtime.mjs';
test('shop offers enforce ownership, atomic CSV imports, history and account suspension',async t=>{
 const dir=makeTestDirectory(path.resolve('.local/shop-offer-test-')),db=new DatabaseSync(path.join(dir,'stock.sqlite'));db.exec(readFileSync('local/schema.sql','utf8'));migrate(db);
 db.prepare("INSERT INTO categories(id,name) VALUES ('generic','Generic')").run();db.prepare("INSERT INTO products(id,brand,model,name,category_id,specs,reference_price,reference_currency) VALUES ('v','Fixture','Model','Fixture Model','generic','{\"supplied_specs\":{\"size\":\"Standard\"},\"slug\":\"v\"}',1000,'INR')").run();
 for(const id of ['a','b'])db.prepare('INSERT INTO shops(id,name,area,city,status) VALUES (?,?,?,?,?)').run(id,'Retailer '+id,'Jammu','Jammu','active');migrateCatalog(db,{apply:true});seedCatalog(db,{apply:true});
 const port=await freePort(),base='http://127.0.0.1:'+port,proc=spawn(process.execPath,['local/server.mjs'],{env:{...process.env,LOCAL_DATA_DIR:dir,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});t.after(async()=>{await stopServer(proc);db.close();});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup')),10000);proc.stdout.on('data',c=>{if(String(c).includes('running at')){clearTimeout(timer);resolve();}});});
 async function call(route,body,cookie=''){const r=await fetch(base+'/api/'+route,{...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie}});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 const ownerA=await call('auth/signup',{email:'a@fixture.test',password:'password-for-owner-a'}),ownerB=await call('auth/signup',{email:'b@fixture.test',password:'password-for-owner-b'});
 for(const id of ['a','b'])db.prepare('UPDATE shops SET owner_id=(SELECT id FROM users WHERE email=?) WHERE id=?').run(id+'@fixture.test',id);
 const dashboard=await call('shop/catalog',null,ownerA.cookie);assert.equal(dashboard.data.shops.length,1);assert.equal(dashboard.data.shops[0].id,'a');assert.ok(dashboard.data.offers.every(o=>o.shop_id==='a'));
 const body={shop_id:'a',variant_id:'v',price:1050,stock_status:'available',shop_product_url:''};
 assert.equal((await call('shop/offer',{...body,shop_id:'b'},ownerA.cookie)).status,403);
 const saved=await call('shop/offer',body,ownerA.cookie);assert.equal(saved.status,200);const history=await call('shop/history?offer='+saved.data.id,null,ownerA.cookie);assert.equal(history.data.offer.is_seed,0);assert.equal(history.data.history.length,2);
 assert.equal((await call('shop/history?offer='+saved.data.id,null,ownerB.cookie)).status,403);
 assert.equal((await fetch(base+'/api/shop/offers.csv?shop=b',{headers:{Cookie:ownerA.cookie}})).status,403);
 const invalid='variant_id,price,stock_status,shop_product_url\nv,999,available,\nmissing,100,available,';assert.equal((await call('shop/import',{shop_id:'a',csv:invalid},ownerA.cookie)).status,400);assert.equal(db.prepare("SELECT price FROM offers WHERE shop_id='a'").get().price,1050);
 const valid='variant_id,price,stock_status,shop_product_url\nv,1040,low_stock,https://retailer.example/product';assert.equal((await call('shop/import',{shop_id:'a',csv:valid},ownerA.cookie)).data.imported,1);
 const exportResponse=await fetch(base+'/api/shop/offers.csv?shop=a',{headers:{Cookie:ownerA.cookie}});assert.equal(exportResponse.status,200);assert.match(await exportResponse.text(),/1040/);
 assert.equal((await call('shop/request',{shop_id:'a',kind:'variant',payload:{product_id:dashboard.data.models[0].id,specs:{size:'Large'}}},ownerA.cookie)).data.status,'pending');
 db.prepare("UPDATE users SET status='suspended' WHERE email='a@fixture.test'").run();assert.equal((await call('shop/catalog',null,ownerA.cookie)).status,401);
 wipeCatalogSeed(db,{apply:true});assert.equal(db.prepare('SELECT count(*) AS n FROM offers').get().n,1);assert.equal(db.prepare('SELECT source FROM offers').get().source,'shop');assert.ok(Object.values(catalogIntegrity(db)).every(rows=>!rows.length));
});
