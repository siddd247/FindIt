import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {migrate} from '../local/migrate.mjs';
import {sampleData} from '../lib/seed.ts';
import {replaceCatalogue,validateCatalogue,estimateRate} from '../local/replace-catalogue.mjs';

const row=(changes={})=>({id:'provided-1',category:'Phones',subcategory:'Smartphones',brand:'Fixture',model_name:'Model 1',variant_title:'Fixture Model 1 (128GB - Black)',slug:'fixture-model-1-black',release_year:2024,approx_price_usd:749,specs:{storage:'128GB',color:'Black'},search_keywords:['model 1','black'],...changes});
function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync('local/schema.sql','utf8'));
 for(const [table,entries] of Object.entries(sampleData()))for(const entry of entries){const keys=Object.keys(entry);db.prepare('INSERT INTO '+table+' ('+keys.join(',')+') VALUES ('+keys.map(()=>'?').join(',')+')').run(...Object.values(entry));}
 migrate(db);
 db.prepare('INSERT INTO users(id,email,password_hash,role,created_at) VALUES (?,?,?,?,?)').run('fixture-user','owner@example.test','unchanged-password-hash','owner','2026-01-01');
 db.prepare('INSERT INTO admins(id,email,password_hash,created_at) VALUES (?,?,?,?)').run('fixture-admin','admin@example.test','unchanged-admin-hash','2026-01-01');
 return db;
}
const tables=db=>Object.fromEntries(['shops','users','admins'].map(t=>[t,db.prepare('SELECT * FROM '+t+' ORDER BY id').all()]));

test('catalogue replacement is dry by default; apply preserves shops/accounts and archives related listings',()=>{
 const db=fixture();try{
  const before=tables(db),old=db.prepare('SELECT count(*) AS n FROM products WHERE deleted_at IS NULL').get().n;
  const activeListings=db.prepare('SELECT count(*) AS n FROM listings WHERE deleted_at IS NULL').get().n;
  const dry=replaceCatalogue(db,[row()]);assert.equal(dry.dryRun,true);assert.deepEqual(dry.errors,[]);assert.equal(db.prepare('SELECT count(*) AS n FROM products WHERE deleted_at IS NULL').get().n,old);assert.equal(db.prepare('SELECT count(*) AS n FROM import_batches').get().n,0);
  const report=replaceCatalogue(db,[row()],{apply:true,backupPath:'fixture-backup.sqlite'});
  assert.equal(report.importedProducts,1);assert.equal(report.archivedProducts,old);assert.equal(report.archivedListings,activeListings);assert.deepEqual(tables(db),before);
  const product=db.prepare('SELECT * FROM products WHERE deleted_at IS NULL').get();assert.equal(product.name,row().variant_title);assert.equal(product.variant,'128GB - Black');assert.equal(product.reference_currency,'INR');assert.equal(product.reference_price,Math.round(749*estimateRate.usdInr/100)*100);assert.equal(product.official_url,null);assert.equal(product.source_checked_at,null);assert.equal(product.catalogue_status,'user_supplied_unverified');
  const specs=JSON.parse(product.specs);assert.deepEqual(specs.supplied_specs,row().specs);assert.equal(specs.price_estimate.original_usd,749);assert.equal(specs.price_estimate.usdInr,estimateRate.usdInr);assert.match(specs.configuration_note,/unverified/);
  assert.equal(db.prepare('SELECT count(*) AS n FROM listings WHERE deleted_at IS NULL').get().n,0);assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(),[]);
  const again=replaceCatalogue(db,[row()],{apply:true});assert.equal(again.unchanged,true);assert.equal(again.importedProducts,0);assert.equal(db.prepare('SELECT count(*) AS n FROM import_batches').get().n,1);
 }finally{db.close();}
});

test('malformed, empty, duplicate or inventory-bearing replacements cannot remove the old catalogue',()=>{
 const cases=[[],{},[null],[row({brand:''})],[row({category:'Unknown'})],[row({release_year:2100})],[row({approx_price_usd:-1})],[row({approx_price_usd:'749'})],[row({specs:[]})],[row({specs:{nested:{value:1}}})],[row({search_keywords:'text'})],[row({shop_id:'fixture-shop'})],[row(),row()], [row(),row({id:'different'})]];
 const db=fixture();try{
  const before=db.prepare('SELECT * FROM products ORDER BY id').all();
  for(const input of cases){const report=replaceCatalogue(db,input,{apply:true});assert.ok(report.errors.length>0);assert.deepEqual(db.prepare('SELECT * FROM products ORDER BY id').all(),before);}
 }finally{db.close();}
});

test('insertion failure rolls back product/listing archival and leaves the previous catalogue usable',()=>{
 const db=fixture();try{
  const beforeProducts=db.prepare('SELECT * FROM products ORDER BY id').all(),beforeListings=db.prepare('SELECT * FROM listings ORDER BY id').all();
  db.exec("CREATE TRIGGER reject_fixture BEFORE INSERT ON products WHEN NEW.brand='Fail' BEGIN SELECT RAISE(ABORT,'fixture insert failed'); END;");
  assert.throws(()=>replaceCatalogue(db,[row(),row({id:'bad',brand:'Fail',variant_title:'Fail Model'})],{apply:true}),/fixture insert failed/);
  assert.deepEqual(db.prepare('SELECT * FROM products ORDER BY id').all(),beforeProducts);assert.deepEqual(db.prepare('SELECT * FROM listings ORDER BY id').all(),beforeListings);assert.equal(db.prepare('SELECT count(*) AS n FROM import_batches').get().n,0);
 }finally{db.close();}
});

test('unverified uploaded specs and INR estimates render escaped and never become stock prices',async()=>{
 const {productFacts,catalogueCards}=await import('../web/public-content.mjs');
 const {Icon}=await import('../web/icons.mjs');
 const db=fixture();try{
  replaceCatalogue(db,[row({specs:{color:'<script>alert(1)</script>'}})],{apply:true});const p=db.prepare('SELECT * FROM products WHERE deleted_at IS NULL').get();
  const facts=productFacts(p),cards=catalogueCards([p],Icon);
  assert.match(facts,/User-supplied/);assert.match(facts,/Estimated INR price/);assert.match(facts,/&lt;script&gt;/);assert.doesNotMatch(facts,/<script>/);assert.match(cards,/Imported product catalogue/);assert.match(cards,/Estimated INR price/);assert.match(cards,/not a shop quote/);assert.doesNotMatch(cards,/MANUFACTURER CATALOGUE/);
 }finally{db.close();}
});
