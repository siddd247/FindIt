import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { openTursoDatabase } from '../local/database.mjs';
import { createCloudinaryStorage } from '../local/image-storage.mjs';
import { makeTestDirectory, freePort, stopServer } from './helpers/runtime.mjs';
import { cleanupCloudIntegrationFixtures } from './helpers/cloud-fixture-cleanup.mjs';
import { validJpeg, validJpegBase64 } from './helpers/valid-jpeg.mjs';

const enabled=process.env.NEARBY_RUN_CLOUD_INTEGRATION==='1';
const confirm='nearby-phase2-dev';

test('real Turso and Cloudinary support buyer, owner, admin, and restart-persistent workflows',{skip:!enabled},async t=>{
 assert.equal(process.env.NEARBY_CLOUD_TEST_CONFIRM,confirm,`Set NEARBY_CLOUD_TEST_CONFIRM=${confirm} only after creating the dedicated disposable Turso database.`);
 const databaseUrl=new URL(process.env.TURSO_DATABASE_URL||'');
 assert.equal(databaseUrl.protocol,'libsql:','Cloud integration must use the dedicated Turso libsql URL.');
 assert.match(databaseUrl.hostname,/nearby-phase2-dev/i,'Refusing cloud writes unless the Turso host is the dedicated nearby-phase2-dev database.');
 for(const name of ['TURSO_AUTH_TOKEN','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET'])assert.ok(process.env[name],`${name} must be configured in the local environment.`);

 const dataDir=makeTestDirectory(path.resolve('.local/nearby-cloud-integration-'));
 const ports=[await freePort(),await freePort()];
 const setupToken=`integration-${randomUUID()}-not-production`;
 const children=[];
 const env={...process.env,NEARBY_DATABASE:'turso',IMAGE_STORAGE:'cloudinary',CLOUDINARY_PUBLIC_ID_PREFIX:'nearbuy-phase2-test',LOCAL_DATA_DIR:dataDir,OWNER_AUTO_APPROVAL:'1',ADMIN_SETUP_TOKEN:setupToken,ALLOWED_HOSTS:ports.map(p=>`127.0.0.1:${p}`).join(','),SEED_SAMPLE_DATA:'0',COOKIE_SECURE:''};
 const start=index=>{
  const child=spawn(process.execPath,['tests/helpers/vercel-function-process.mjs'],{cwd:process.cwd(),windowsHide:true,stdio:['ignore','pipe','pipe','ipc'],env:{...env,PORT:String(ports[index]),HOST:'127.0.0.1'}});
  children[index]=child;
  return new Promise((resolve,reject)=>{let logs='';const timer=setTimeout(()=>reject(new Error(`Cloud integration app did not start: ${logs}`)),30000);child.stdout.on('data',chunk=>{logs+=chunk;if(logs.includes('harness ready')){clearTimeout(timer);resolve();}});child.stderr.on('data',chunk=>{logs+=chunk;});child.once('exit',code=>{clearTimeout(timer);reject(new Error(`Cloud integration app exited (${code}): ${logs}`));});});
 };
 t.after(async()=>{for(const child of children)if(child&&child.exitCode===null)await stopServer(child);});
 await start(0);
 const base=index=>`http://127.0.0.1:${ports[index]}`;
 const request=async(index,url,{body,cookie}={})=>{
  const response=await fetch(base(index)+url,body===undefined?{headers:cookie?{Cookie:cookie}:{}}:{method:'POST',headers:{'Content-Type':'application/json',Origin:base(index),...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
  const payload=response.headers.get('content-type')?.includes('json')?await response.json():null;
  return {response,payload,cookie:response.headers.get('set-cookie')?.split(';')[0]};
 };
 const db=openTursoDatabase();
 let userId,shopId;
 const productId=randomUUID(),adminId=randomUUID(),ownerEmail=`owner-${randomUUID()}@phase2.invalid`;
 let listingId;
 let imageUrl;
 try{
  // Remove only marker-matched leftovers from an earlier interrupted run.
  await cleanupCloudIntegrationFixtures(db);
  const signup=await request(0,'/api/auth/signup',{body:{email:ownerEmail,password:'phase2-owner-password-42'}});
  assert.equal(signup.response.status,200,JSON.stringify(signup.payload));
  userId=(await db.prepare('SELECT id FROM users WHERE email=?').get(ownerEmail)).id;
  const shop=await request(0,'/api/shops',{cookie:signup.cookie,body:{name:`Phase 2 Shop ${userId.slice(0,8)}`,address:'Synthetic integration address',area:'Gandhi Nagar',pincode:'180001',phone:'+911234567890'}});
  assert.equal(shop.response.status,200,JSON.stringify(shop.payload));
  assert.equal(shop.payload.shop.status,'active');
  shopId=shop.payload.shop.id;

  await db.prepare('INSERT INTO products(id,brand,model,name,specs,category_id,aliases,sample) VALUES (?,?,?,?,?,?,?,0)').run(productId,'Phase2Synthetic','Persistence Widget',`Phase2Synthetic Persistence Widget ${productId.slice(0,8)}`,JSON.stringify({summary:'Synthetic integration fixture'}),'phones','[]');
  const listing=await request(0,'/api/listings',{cookie:signup.cookie,body:{shop_id:shopId,product_id:productId,price_min:25999,currency:'INR',negotiable:false,quantity:4,status_reported:'in_stock'}});
  assert.equal(listing.response.status,200,JSON.stringify(listing.payload));
  const created=await db.prepare('SELECT id FROM listings WHERE shop_id=? AND product_id=? AND deleted_at IS NULL').get(shopId,productId);
  assert.ok(created);listingId=created.id;
  const stock=await request(0,'/api/confirm',{cookie:signup.cookie,body:{shop_id:shop.payload.shop.id,listing_id:listingId,status:'low_stock'}});
  assert.equal(stock.response.status,200,JSON.stringify(stock.payload));
  const search=await request(0,`/api/search?q=${encodeURIComponent('Phase2Synthetic Persistence Widget')}`);
  assert.equal(search.response.status,200);assert.ok(JSON.stringify(search.payload).includes(productId),'Buyer search should find the synthetic product.');
  const stored=await db.prepare('SELECT status_reported,price_min FROM listings WHERE id=?').get(listingId);
  assert.equal(stored.status_reported,'low_stock');assert.equal(stored.price_min,25999);

  const uploaded=await request(0,'/api/upload',{cookie:signup.cookie,body:{image:`data:image/jpeg;base64,${validJpegBase64}`}});
  assert.equal(uploaded.response.status,200,JSON.stringify(uploaded.payload));imageUrl=uploaded.payload.url;
  const image=await request(0,imageUrl);assert.equal(image.response.status,200);assert.deepEqual(Buffer.from(await image.response.arrayBuffer()),validJpeg);

  const adminPassword='phase2-admin-password-42';
  const {passwordHash}=await import('../local/admin-auth.mjs');
  await db.prepare('INSERT INTO admins(id,email,password_hash,created_at) VALUES (?,?,?,?)').run(adminId,`admin-${adminId}@phase2.invalid`,passwordHash(adminPassword),new Date().toISOString());
  const adminLogin=await request(0,'/api/admin/login',{body:{email:`admin-${adminId}@phase2.invalid`,password:adminPassword}});
  assert.equal(adminLogin.response.status,200,JSON.stringify(adminLogin.payload));
  const dashboard=await request(0,'/api/admin/dashboard',{cookie:adminLogin.cookie});assert.equal(dashboard.response.status,200,JSON.stringify(dashboard.payload));

  await start(1);
  const ownerSession=await request(1,'/api/session',{cookie:signup.cookie});assert.equal(ownerSession.response.status,200);assert.equal(ownerSession.payload.user.email,ownerEmail);
  const adminSession=await request(1,'/api/admin/dashboard',{cookie:adminLogin.cookie});assert.equal(adminSession.response.status,200,JSON.stringify(adminSession.payload));
  const persistentImage=await request(1,imageUrl);assert.equal(persistentImage.response.status,200);assert.deepEqual(Buffer.from(await persistentImage.response.arrayBuffer()),validJpeg);
  assert.equal((await db.prepare('SELECT status_reported FROM listings WHERE id=?').get(listingId)).status_reported,'low_stock');
 } finally {
  try{
   if(imageUrl)await createCloudinaryStorage({publicIdPrefix:'nearbuy-phase2-test'}).delete(imageUrl.split('/').at(-1));
   await cleanupCloudIntegrationFixtures(db);
  } finally { await db.close(); }
 }
});
