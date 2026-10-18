import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { openLocalDatabase } from '../local/database.mjs';
import { migrateAsync } from '../local/migrate.mjs';
import { cleanupCloudIntegrationFixtures } from './helpers/cloud-fixture-cleanup.mjs';

test('phase 2 fixture cleanup removes child shop counts before deleting only marked synthetic parents',async()=>{
 const db=openLocalDatabase(':memory:');
 try{
  await db.exec(readFileSync(new URL('../local/schema.sql',import.meta.url),'utf8'));
  await migrateAsync(db);
  const owner=randomUUID(),admin=randomUUID(),shop=randomUUID(),product=randomUUID(),listing=randomUUID(),unrelatedShop=randomUUID();
  await db.prepare('INSERT INTO categories(id,name) VALUES (?,?)').run('phones','Phones');
  await db.prepare('INSERT INTO users(id,email,password_hash,created_at) VALUES (?,?,?,?)').run(owner,`owner-${owner}@phase2.invalid`,'synthetic-hash',new Date().toISOString());
  await db.prepare('INSERT INTO admins(id,email,password_hash,created_at) VALUES (?,?,?,?)').run(admin,`admin-${admin}@phase2.invalid`,'synthetic-hash',new Date().toISOString());
  await db.prepare('INSERT INTO shops(id,owner_id,name,address,area,city,status,verification_status) VALUES (?,?,?,?,?,?,?,?)').run(shop,owner,'Phase 2 Shop regression','Synthetic address','Test area','Jammu','active','not_verified');
  await db.prepare('INSERT INTO shops(id,name,address,area,city,status,verification_status) VALUES (?,?,?,?,?,?,?)').run(unrelatedShop,'Unrelated shop','Unrelated address','Other area','Jammu','active','not_verified');
  await db.prepare('INSERT INTO products(id,brand,model,name,specs,category_id,sample) VALUES (?,?,?,?,?,?,0)').run(product,'Phase2Synthetic','Persistence Widget','Synthetic regression product','{}','phones');
  await db.prepare('INSERT INTO listings(id,shop_id,product_id,price_min,status_reported,last_confirmed_at,confirmed_by) VALUES (?,?,?,?,?,?,?)').run(listing,shop,product,100,'in_stock',new Date().toISOString(),'phase2-test');
  await db.prepare('INSERT INTO shop_counts(shop_id,day,kind,count) VALUES (?,?,?,?)').run(shop,'2026-10-19','views',1);
  const cleaned=await cleanupCloudIntegrationFixtures(db);
  assert.deepEqual(cleaned,{owners:1,admins:1,shops:1,products:1,listings:1});
  assert.equal(await db.prepare('SELECT id FROM shops WHERE id=?').get(shop),undefined);
  assert.equal(await db.prepare('SELECT shop_id FROM shop_counts WHERE shop_id=?').get(shop),undefined);
  assert.equal((await db.prepare('SELECT id FROM shops WHERE id=?').get(unrelatedShop)).id,unrelatedShop);
  assert.equal(await db.prepare('SELECT id FROM products WHERE id=?').get(product),undefined);
  assert.equal(await db.prepare('SELECT id FROM users WHERE id=?').get(owner),undefined);
  assert.equal(await db.prepare('SELECT id FROM admins WHERE id=?').get(admin),undefined);
 }finally{await db.close();}
});
