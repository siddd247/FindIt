import {makeTestDirectory as mkdtempSync} from './helpers/runtime.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {migrate} from '../local/migrate.mjs';
import {discover} from '../local/discovery.mjs';
import {generateSimulatedStock,simulationInputs,querySimulatedStock} from '../local/simulated-stock.mjs';
import {simulationContent,simulationSearchMatches} from '../web/simulation.mjs';

function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync('local/schema.sql','utf8'));migrate(db);
 db.prepare('INSERT INTO categories(id,name) VALUES (?,?)').run('phones','Phones');
 for(let i=0;i<10;i++)db.prepare("INSERT INTO shops(id,name,area,city,status,sample) VALUES (?,?,?,'Jammu','active',0)").run('shop-'+i,'Fixture shop '+i,'Fixture area');
 db.prepare("INSERT INTO shops(id,name,area,city,status,sample) VALUES ('pending','Not public','Fixture','Jammu','pending',0)").run();
 for(const [i,year] of [2024,2025,2026,2023,2018,null,2027].entries())db.prepare('INSERT INTO products(id,name,brand,model,specs,category_id,launch_year,reference_price,reference_currency) VALUES (?,?,?,?,?,?,?,?,?)').run('p-'+i,'Fixture Phone '+i,'Fixture','Phone '+i,'{}','phones',year,10000,'INR');
 return db;
}

test('simulation assigns recent launches to most shops, older items sparsely, and each pair only once',()=>{
 const db=fixture();try{
  const {products,shops}=simulationInputs(db);assert.equal(shops.length,10);
  const first=generateSimulatedStock(products,shops,{year:2026,seed:'fixture-seed'}),again=generateSimulatedStock([...products].reverse(),[...shops].reverse(),{year:2026,seed:'fixture-seed'});
  assert.deepEqual(first.assignments,again.assignments);assert.equal(first.summary.recent_products,3);assert.equal(first.summary.older_products,4);
  for(const p of products){const count=first.assignments.filter(a=>a.product_id===p.id).length;const recent=p.launch_year>=2024&&p.launch_year<=2026;assert.ok(recent?count>=8&&count<=9:count>=1&&count<=3);}
  assert.equal(new Set(first.assignments.map(a=>a.product_id+'|'+a.shop_id)).size,first.assignments.length);assert.equal(new Set(first.assignments.map(a=>a.shop_id)).size,10);assert.ok(first.assignments.every(a=>a.simulated===true));
  assert.notDeepEqual(first.assignments,generateSimulatedStock(products,shops,{year:2026,seed:'other-seed'}).assignments);assert.throws(()=>generateSimulatedStock([],shops),/required/);
 }finally{db.close();}
});

test('simulation filtering and pagination never write real inventory and hide stale/removed shops',()=>{
 const db=fixture(),dir=mkdtempSync(path.resolve('.local/simulation-test-'));try{
  assert.equal(querySimulatedStock(db,dir,new URLSearchParams()).available,false);
  const before=db.prepare('SELECT * FROM shops ORDER BY id').all(),{products,shops}=simulationInputs(db),data=generateSimulatedStock(products,shops,{year:2026,seed:'fixture'});
  writeFileSync(path.join(dir,'simulated-stock.json'),JSON.stringify(data));
  const page=querySimulatedStock(db,dir,new URLSearchParams());assert.equal(page.available,true);assert.equal(page.simulated,true);assert.ok(page.rows.length<=40);assert.ok(page.rows.every(r=>r.confirmation===null&&r.status==='simulated_available'));
  const shop=querySimulatedStock(db,dir,new URLSearchParams({shop:'shop-1',q:'Phone 0'}));assert.ok(shop.rows.length);assert.ok(shop.rows.every(r=>r.shop.id==='shop-1'&&r.product.id==='p-0'));
  const none=querySimulatedStock(db,dir,new URLSearchParams({q:'NoSuchModel999'}));assert.equal(none.total,0);assert.equal(none.page,1);
  assert.equal(db.prepare('SELECT count(*) AS n FROM listings').get().n,0);assert.deepEqual(discover(db,new URLSearchParams()).listings,[]);assert.deepEqual(db.prepare('SELECT * FROM shops ORDER BY id').all(),before);
  db.prepare("UPDATE shops SET status='on_hold' WHERE id='shop-1'").run();assert.equal(querySimulatedStock(db,dir,new URLSearchParams()).available,false);
 }finally{db.close();}
});

test('simulation page labels generated availability, escapes content, and carries filters through pagination',()=>{
 const db=fixture(),dir=mkdtempSync(path.resolve('.local/simulation-test-'));try{
  db.prepare("UPDATE products SET name='<script>Phone</script>' WHERE id='p-0'").run();const {products,shops}=simulationInputs(db);const data=generateSimulatedStock(products,shops,{year:2026,seed:'fixture'});writeFileSync(path.join(dir,'simulated-stock.json'),JSON.stringify(data));
  const result=querySimulatedStock(db,dir,new URLSearchParams());const html=simulationContent(result,new URLSearchParams({q:'<input>',shop:'shop-1'}));
  assert.match(html,/STORE CATALOGUE/);assert.match(html,/confirm stock/);assert.match(html,/confirm availability/);assert.match(html,/not a shop quote/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/&lt;input&gt;/);assert.doesNotMatch(html,/data-confirm|data-report|tel:/);
 }finally{db.close();}
});

test('ordinary search preview groups shop matches, preserves the query, and distinguishes simulated inventory',()=>{
 const db=fixture(),dir=mkdtempSync(path.resolve('.local/simulation-test-'));try{
  const {products,shops}=simulationInputs(db);const data=generateSimulatedStock(products,shops,{year:2026,seed:'search-preview'});writeFileSync(path.join(dir,'simulated-stock.json'),JSON.stringify(data));
  const params=new URLSearchParams({q:'Fixture'}),result=querySimulatedStock(db,dir,params),html=simulationSearchMatches(result,params);
  assert.match(html,/Store catalogue matches/);assert.match(html,/not confirmed stock/);assert.match(html,/not a shop quote/);assert.match(html,/catalogues\?q=Fixture/);assert.match(html,/href="\/shops\/shop-\d+\?q=Fixture"/);assert.doesNotMatch(html,/data-confirm|data-report/);
  const displayed=[...html.matchAll(/<h3>.*?Fixture shop (\d+)/g)].map(m=>m[1]);assert.equal(displayed.length,new Set(displayed).size);assert.ok(displayed.length>0&&displayed.length<=8);
  assert.equal(simulationSearchMatches({available:false},params),'');assert.equal(simulationSearchMatches({available:true,rows:[]},params),'');
 }finally{db.close();}
});

test('admin approval covers every product/shop pair while retaining unconfirmed stock and estimate labels',()=>{
 const db=fixture(),dir=mkdtempSync(path.resolve('.local/simulation-test-'));try{
  const {products,shops}=simulationInputs(db),before=db.prepare('SELECT * FROM shops ORDER BY id').all();
  const data=generateSimulatedStock(products,shops,{year:2026,seed:'approved-all',approveAll:true});
  assert.equal(data.assignments.length,products.length*shops.length);assert.ok(data.assignments.every(a=>a.catalogue_approved===true&&a.simulated===true));assert.equal(data.summary.approval.status,'admin_approved');assert.equal(data.summary.approval.stock_confirmed,false);
  for(const p of products)assert.equal(data.assignments.filter(a=>a.product_id===p.id).length,shops.length);
  writeFileSync(path.join(dir,'simulated-stock.json'),JSON.stringify(data));const params=new URLSearchParams({q:'Phone 0'}),result=querySimulatedStock(db,dir,params);
  assert.equal(result.total,shops.length);assert.ok(result.rows.every(r=>r.status==='admin_approved_stock_unconfirmed'&&r.confirmation===null));
  for(const html of [simulationContent(result,params),simulationSearchMatches(result,params)]){assert.match(html,/Admin-approved/);assert.match(html,/stock unconfirmed/);assert.match(html,/not a shop quote/);assert.doesNotMatch(html,/Simulated available|data-confirm|data-report/);}
  assert.deepEqual(db.prepare('SELECT * FROM shops ORDER BY id').all(),before);assert.equal(db.prepare('SELECT count(*) AS n FROM listings').get().n,0);assert.deepEqual(discover(db,new URLSearchParams()).listings,[]);
 }finally{db.close();}
});
