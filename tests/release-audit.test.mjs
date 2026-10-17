import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
import {makeTestDirectory,freePort,stopServer} from './helpers/runtime.mjs';
import {getShopPrices} from '../web/shop-pricing.mjs';
import {simulationSearchMatches} from '../web/simulation.mjs';

test('release startup, separate sessions, active owner registration, filters and graceful SQLite shutdown',async t=>{
 const directory=makeTestDirectory(path.resolve('.local/release-test-')),port=await freePort(),base='http://127.0.0.1:'+port;
 const proc=spawn(process.execPath,['scripts/start-local.mjs'],{env:{...process.env,SEED_SAMPLE_DATA:'0',OWNER_AUTO_APPROVAL:'1',PORT:String(port),LOCAL_DATA_DIR:directory},windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
 let errors='';proc.stderr.on('data',chunk=>errors+=chunk);
 t.after(async()=>{await stopServer(proc);assert.equal(errors,'');assert.equal(existsSync(path.join(directory,'stock.sqlite-wal')),false);assert.equal(existsSync(path.join(directory,'stock.sqlite-shm')),false);});
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Startup timed out: '+errors)),10000);proc.stdout.on('data',chunk=>{if(String(chunk).includes('running at')){clearTimeout(timer);resolve();}});proc.once('error',reject);});
 async function call(route,body,cookie=''){
  const response=await fetch(base+'/api/'+route,{...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie}});
  return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]};
 }
 assert.equal((await call('runtime')).data.release,'20261017-final');
 const settings=JSON.parse(readFileSync(path.join(directory,'security.json'),'utf8'));
 const credentials={email:'admin@fixture.example',password:'secure-fixture-admin-123'};
 assert.equal((await call('admin/setup',{...credentials,token:settings.setupToken})).status,200);
 const admin=await call('admin/login',credentials),owner=await call('auth/signup',{email:'owner@fixture.example',password:'secure-fixture-owner-123'});
 assert.equal((await call('owner',null,admin.cookie)).status,401);
 assert.equal((await call('admin/dashboard',null,owner.cookie)).status,401);
 const both=owner.cookie+'; '+admin.cookie;
 assert.equal((await call('session',null,both)).data.user.role,'owner');
 assert.equal((await call('admin/session',null,both)).data.user.role,'admin');
 assert.equal((await call('admin/session',{},both)).status,405);
 const registration=await call('shops',{name:'Fixture retailer',address:'Fixture address',area:'Gandhi Nagar',pincode:'180004',open:'10:00',close:'20:00'},owner.cookie);
 assert.equal(registration.data.shop.status,'active');
 assert.equal((await call('admin/shop-edit',{id:registration.data.shop.id,open:'25:00',close:'20:00'},admin.cookie)).status,400);
 assert.equal((await call('admin/shop-edit',{id:registration.data.shop.id,open:'09:30',close:'20:00'},admin.cookie)).status,200);
 assert.equal(JSON.parse((await call('shops/'+registration.data.shop.id)).data.shop.hours).open,'09:30');
 const suggestion=await call('shops',{name:'Suggested retailer',address:'Fixture address',area:'Gandhi Nagar'});
 assert.equal(suggestion.data.shop.status,'pending');
 const db=new DatabaseSync(path.join(directory,'stock.sqlite'));
 try{
  db.prepare("INSERT INTO products(id,brand,model,name,category_id,specs,aliases) VALUES ('release-product','Fixture','Model','Fixture Model','phones','{}','[]')").run();
  const account=db.prepare("SELECT * FROM users WHERE email='owner@fixture.example'").get();
  const legacy=randomUUID(),token='legacy-session-token';
  db.prepare('INSERT INTO users(id,email,password_hash,role,created_at) VALUES (?,?,?,?,?)').run(legacy,'legacy@fixture.example',account.password_hash,'admin',new Date().toISOString());
  db.prepare('INSERT INTO sessions(id,user_id,expires_at) VALUES (?,?,?)').run(createHash('sha256').update(token).digest('hex'),legacy,new Date(Date.now()+60000).toISOString());
  assert.equal((await call('owner',null,'nearby_session='+token)).status,401);
  assert.equal((await call('auth/login',{email:'legacy@fixture.example',password:'secure-fixture-owner-123'})).status,403);
 }finally{db.close();}
 const listing={shop_id:registration.data.shop.id,product_id:'release-product',price_min:10000,currency:'INR',status_reported:'in_stock',negotiable:true};
 assert.equal((await call('listings',listing,owner.cookie)).status,200);
 assert.equal((await call('search?q=Fixture&area=180004&min=9000&max=11000&stock=true&negotiable=true')).data.listings.length,1);
 assert.equal((await call('search?q=Fixture&area=WrongArea')).data.listings.length,0);
 assert.equal((await call('search?q=Fixture&min=11000')).data.listings.length,0);
 assert.equal((await call('search?q=Fixture&min=11000&max=9000')).status,400);
 assert.equal((await call('search?q=Fixture&lat=32.7&lng=74.8&radius=5')).data.listings.length,0);
 assert.equal((await call('search?q=Fixture&stock=false')).data.listings.length,1);
 const html=await(await fetch(base+'/')).text();
 assert.ok(html.indexOf('/theme.js')<html.indexOf('/styles.css'));
 assert.equal((await fetch(base+'/theme.js')).status,200);
 assert.equal((await fetch(base+'/design-system')).status,404);
 const catalogues=await(await fetch(base+'/catalogues')).text();
 assert.doesNotMatch(catalogues,/(?:simulated|mock|fake data|demo price|generated estimate)/i);
 const oldRoute=await fetch(base+'/simulation',{redirect:'manual'});assert.equal(oldRoute.status,302);assert.equal(oldRoute.headers.get('location'),'/catalogues');
});

test('filtered comparisons keep stable pair prices and select one eligible best price',()=>{
 const shops=Array.from({length:8},(_,i)=>({id:'s-'+i,name:'Retailer '+i,area:i%2?'North':'South'}));
 const product={id:'generic',name:'Variant',category_id:'constructor',reference_price:10000};
 const prices=getShopPrices(product,shops);assert.ok(prices.every(row=>Number.isFinite(row.price)));
 const eligible=prices.slice(2,5).map(row=>row.shop.id);
 const data={available:true,total:eligible.length,shops,matching_shop_ids:eligible,summary:{approval:{status:'admin_approved',stock_confirmed:false}},rows:shops.filter(s=>eligible.includes(s.id)).map(shop=>({shop,product}))};
 const html=simulationSearchMatches(data,new URLSearchParams(),{limit:8});
 assert.equal((html.match(/class="panel simulated-shop-card"/g)||[]).length,3);
 assert.equal((html.match(/class="badge best-price"/g)||[]).length,1);
 for(const row of prices.filter(row=>eligible.includes(row.shop.id)))assert.ok(html.includes(new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(row.price)));
});

test('actual UI handlers preserve theme, close suggestions and support arrow navigation and password visibility',async()=>{
 const keys=['fetch','location','document','window','navigator','localStorage'];
 const saved=Object.fromEntries(keys.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 try{
  const listeners={},attributes=new Map(),stored=new Map([['theme','dark']]);
  const input={id:'product-search',value:'Fixture',setAttribute:(k,v)=>attributes.set(k,v),removeAttribute:k=>attributes.delete(k)};
  const options=[0,1].map(i=>({id:'suggestion-'+i,dataset:{product:'p-'+i},setAttribute(){},scrollIntoView(){}}));
  const box={hidden:true,innerHTML:'',querySelectorAll:()=>options},app={innerHTML:''},password={type:'password'};
  const directory=[0,1].map(i=>({id:'p-'+i,name:'Fixture '+i,brand:'Fixture',model:String(i),category_id:'phones',aliases:'[]',specs:'{}'}));
  Object.defineProperty(globalThis,'location',{value:new URL('https://fixture.example/search'),configurable:true});
  Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
  globalThis.localStorage={getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v),removeItem:k=>stored.delete(k)};
  globalThis.window={addEventListener(){}};
  globalThis.document={documentElement:{dataset:{}},getElementById:()=>password,querySelector:s=>s==='#app'?app:s==='#product-search'?input:s==='#suggestions'?box:null,addEventListener:(type,handler)=>{(listeners[type]??=[]).push(handler);}};
  globalThis.fetch=async route=>Response.json(String(route).includes('/session')?{user:null}:String(route).includes('/catalogue')?directory:String(route).includes('/simulation')?{available:false}:{products:directory,listings:[],shops:[]});
  await import('../web/app.js?keyboard-release-check');await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(document.documentElement.dataset.theme,'dark');
  listeners.input[0]({target:input});assert.equal(box.hidden,false);
  listeners.keydown[0]({target:input,key:'ArrowUp',preventDefault(){}});
  assert.equal(attributes.get('aria-activedescendant'),'suggestion-1');
  listeners.keydown[0]({target:input,key:'Escape'});assert.equal(box.hidden,true);assert.equal(attributes.get('aria-expanded'),'false');
  listeners.input[0]({target:input});listeners.focusout[0]({target:input,relatedTarget:null});assert.equal(box.hidden,true);
  const button={dataset:{passwordToggle:'password'},setAttribute:(k,v)=>attributes.set(k,v),closest:selector=>selector==='button,a'?button:null};
  await listeners.click[0]({target:button});assert.equal(password.type,'text');assert.equal(attributes.get('aria-pressed'),'true');
  await listeners.click[0]({target:button});assert.equal(password.type,'password');
 }finally{for(const [key,descriptor]of Object.entries(saved)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
