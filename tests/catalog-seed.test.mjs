import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import {migrate} from '../local/migrate.mjs';
import {migrateCatalog} from '../local/catalog-model.mjs';import {seedCatalog,seededStock,wipeCatalogSeed} from '../local/catalog-seed.mjs';
test('stock seed varies by pair, is repeatable, guarantees availability, and wipes only seed offers',()=>{
 const db=new DatabaseSync(':memory:');db.exec(readFileSync('local/schema.sql','utf8'));migrate(db);
 try{
  db.prepare("INSERT INTO categories(id,name) VALUES ('any','Any')").run();
  for(let i=0;i<20;i++)db.prepare('INSERT INTO products(id,brand,model,name,category_id,specs,reference_price,reference_currency) VALUES (?,?,?,?,?,?,?,?)').run('v-'+i,'Fixture','Model '+i,'Model '+i,'any',JSON.stringify({supplied_specs:{custom:String(i)},slug:'v-'+i}),10000,'INR');
  for(let i=0;i<32;i++)db.prepare('INSERT INTO shops(id,name,area,city,status) VALUES (?,?,?,?,?)').run('s-'+i,'Retailer '+i,'Area','Jammu',i===0?'pending':'active');
  migrateCatalog(db,{apply:true});const shops=db.prepare('SELECT * FROM shops ORDER BY id').all();
  assert.deepEqual(seededStock('v-1',shops,'seed'),seededStock('v-1',[...shops].reverse(),'seed'));
  const report=seedCatalog(db,{apply:true,seed:'seed'});assert.equal(report.createdOffers,640);assert.equal(report.approvedPerQueue.shops,1);
  assert.equal(db.prepare("SELECT count(*) AS n FROM offers WHERE stock_status='available'").get().n>0,true);
  for(let i=0;i<20;i++){const states=db.prepare('SELECT stock_status FROM offers WHERE variant_id=?').all('v-'+i).map(r=>r.stock_status);assert.ok(states.includes('available'));assert.ok(new Set(states).size>1);}
  const snapshot=db.prepare('SELECT variant_id,shop_id,price,stock_status FROM offers ORDER BY id').all();seedCatalog(db,{apply:true,seed:'seed'});assert.deepEqual(db.prepare('SELECT variant_id,shop_id,price,stock_status FROM offers ORDER BY id').all(),snapshot);
  db.prepare("UPDATE offers SET source='shop',is_seed=0,seed_run_id=NULL WHERE id=(SELECT id FROM offers LIMIT 1)").run();wipeCatalogSeed(db,{apply:true});assert.equal(db.prepare('SELECT count(*) AS n FROM offers').get().n,1);assert.equal(db.prepare("SELECT status FROM shops WHERE id='s-0'").get().status,'pending');
 }finally{db.close();}
});
