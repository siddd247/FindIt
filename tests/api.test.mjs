import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
const base='http://127.0.0.1:3001',dir=mkdtempSync(path.resolve('.local/api-test-'));
test('local API: authentication, approval, listings, confirmations, reports, and audit',async t=>{
 const proc=spawn(process.execPath,['local/server.mjs'],{cwd:process.cwd(),env:{...process.env,SEED_SAMPLE_DATA:'1',PORT:'3001',LOCAL_DATA_DIR:dir},windowsHide:true,stdio:['ignore','pipe','pipe']});t.after(()=>proc.kill());
 await new Promise((resolve,reject)=>{let output='';const timeout=setTimeout(()=>reject(new Error('Server startup timed out: '+output)),12000);proc.stdout.on('data',c=>{output+=c;if(output.includes('running at')){clearTimeout(timeout);resolve();}});proc.stderr.on('data',c=>output+=c);proc.on('exit',code=>{clearTimeout(timeout);reject(new Error('Server exited '+code+': '+output));});});
 async function call(route,body,cookie='',origin=base){const r=await fetch(base+'/api/'+route,body?{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)}:{headers:cookie?{Cookie:cookie}:{}});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 for(const asset of ['/icons.mjs','/maps.mjs']){const r=await fetch(base+asset);assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/javascript/);}
 const search=await call('search?q=iphn%2015');assert.equal(search.status,200);assert.deepEqual(search.data.products.map(p=>p.model),['iPhone 15']);assert.ok(search.data.listings.every(l=>!l.availability.hidden));
 assert.equal((await call('owner')).status,401);assert.equal((await call('admin')).status,401);
 const a=await call('auth/signup',{email:'admin@example.test',password:'strong-test-password-1'});assert.equal(a.status,200);assert.equal(a.data.role,'admin');assert.match(a.cookie,/nearby_session=/);
 const o=await call('auth/signup',{email:'owner@example.test',password:'strong-test-password-2'});assert.equal(o.data.role,'owner');assert.equal((await call('admin',null,o.cookie)).status,403);
 const sh=await call('shops',{name:'QA Electronics',address:'Test address, Jammu',area:'Gandhi Nagar',phone:'+919999999999',lat:32.7266,lng:74.857,open:'10:00',close:'20:00'},o.cookie);assert.equal(sh.status,200);const shopId=sh.data.shop.id;assert.equal(sh.data.shop.status,'pending');
 const listing={shop_id:shopId,product_id:'p-phones-1',price_min:42000,currency:'INR',status_reported:'in_stock',negotiable:true};assert.equal((await call('listings',listing,a.cookie)).status,403);assert.equal((await call('listings',listing,o.cookie)).status,200);assert.equal((await call('search?q=iPhone%2015')).data.listings.some(l=>l.shop_id===shopId),false);
 assert.equal((await call('admin/shop',{id:shopId,status:'verified'},o.cookie)).status,403);assert.equal((await call('admin/shop',{id:shopId,status:'verified'},a.cookie)).status,200);let hit=(await call('search?q=iPhone%2015')).data.listings.find(l=>l.shop_id===shopId);assert.ok(hit);assert.equal(hit.price_min,42000);
 assert.equal((await call('listings',listing,o.cookie)).status,409);assert.equal((await call('listing-edit',{...listing,id:hit.id,price_min:-1},o.cookie)).status,400);
 assert.equal((await call('confirm',{shop_id:shopId,listing_id:hit.id,status:'low_stock'},o.cookie)).status,200);hit=(await call('shops/'+shopId)).data.listings[0];assert.equal(hit.status_reported,'low_stock');assert.match(hit.availability.confirmation,/Confirmed/);
 const r1=await call('reports',{listing_id:hit.id,kind:'out_of_stock'});assert.equal(r1.status,200);assert.equal((await call('reports',{listing_id:hit.id,kind:'out_of_stock'},r1.cookie)).status,409);
 assert.equal((await call('confirm',{shop_id:shopId},o.cookie,'https://evil.example')).status,403);
 const imported=await call('admin/import',{type:'listings',rows:[{...listing,product_id:'missing'}]},a.cookie);assert.equal(imported.status,422);assert.equal(imported.data.imported,0);assert.equal(imported.data.errors[0].row,2);
 const usd=await call('search?q=iPhone%2015&currency=USD');assert.equal(usd.data.listings.length,0);
 const db=new DatabaseSync(path.join(dir,'stock.sqlite'));assert.ok(db.prepare('SELECT count(*) AS n FROM listing_events WHERE listing_id=?').get(hit.id).n>=2);assert.ok(!db.prepare('SELECT password_hash FROM users WHERE email=?').get('owner@example.test').password_hash.includes('strong-test-password'));db.close();
 assert.equal((await fetch(base+'/products/p-phones-1')).status,200);assert.match(await (await fetch(base+'/products/p-phones-1')).text(),/Apple iPhone 15/);
 assert.equal((await call('auth/logout',{},o.cookie)).status,200);assert.equal((await call('owner',null,o.cookie)).status,401);
});
