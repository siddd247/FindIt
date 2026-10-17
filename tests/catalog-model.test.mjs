import test from 'node:test';import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';
import {migrate} from '../local/migrate.mjs';
import {migrateCatalog,planCatalog,catalogIntegrity} from '../local/catalog-model.mjs';
export function catalogFixture(){const db=new DatabaseSync(':memory:');db.exec(readFileSync('local/schema.sql','utf8'));migrate(db);db.prepare("INSERT INTO categories(id,name) VALUES ('arbitrary','Arbitrary')").run();return db;}
export function addVariant(db,id,options,price=1000,model='Example'){
 db.prepare('INSERT INTO products(id,brand,model,name,category_id,specs,reference_price,reference_currency) VALUES (?,?,?,?,?,?,?,?)').run(id,'Fixture',model,'Fixture '+model+' '+id,'arbitrary',JSON.stringify({supplied_specs:options,slug:'variant-'+id,subcategory:'Generic'}),price,'INR');
}
test('parent migration is additive, dry by default, idempotent and accepts later variants',()=>{
 const db=catalogFixture();try{
  addVariant(db,'a',{storage:'128',ram:'8',color:'Black',fixed:'same'},1000);addVariant(db,'b',{storage:'256',ram:'16',color:'Black',fixed:'same'},1500);addVariant(db,'c',{storage:'128',ram:'8',color:'White',fixed:'same'},1100);addVariant(db,'d',{storage:'256',ram:'16',color:'White',fixed:'same'},1600);
  const originals=db.prepare('SELECT * FROM products ORDER BY id').all(),plan=planCatalog(db);
  assert.equal(migrateCatalog(db).products,1);assert.equal(db.prepare('SELECT count(*) AS n FROM catalog_products').get().n,0);
  assert.equal(plan.parents[0].option_axes[0].label,'Configuration');assert.equal(plan.parents[0].option_axes.at(-1).key,'color');assert.equal(plan.parents[0].specs.fixed,'same');
  assert.equal(migrateCatalog(db,{apply:true}).createdVariants,4);
  const before=db.prepare('SELECT * FROM catalog_products').all();assert.equal(migrateCatalog(db,{apply:true}).createdVariants,0);assert.deepEqual(db.prepare('SELECT * FROM catalog_products').all(),before);
  assert.deepEqual(db.prepare('SELECT * FROM products ORDER BY id').all(),originals);
  addVariant(db,'e',{storage:'512',ram:'32',color:'White',fixed:'same'},2000);assert.equal(migrateCatalog(db,{apply:true}).createdVariants,1);
  assert.ok(Object.values(catalogIntegrity(db)).every(rows=>rows.length===0));
 }finally{db.close();}
});
test('single-variant parents have no selectors and archived records never enter grouping',()=>{
 const db=catalogFixture();try{addVariant(db,'a',{custom:'value'},1000);addVariant(db,'archived',{custom:'old'},2000);db.prepare("UPDATE products SET deleted_at='2026-01-01' WHERE id='archived'").run();const report=migrateCatalog(db,{apply:true});assert.equal(report.singleVariantProducts,1);const p=db.prepare('SELECT * FROM catalog_products').get();assert.equal(p.option_axes,'[]');assert.equal(p.default_variant_id,'a');assert.equal(db.prepare('SELECT count(*) AS n FROM products').get().n,2);}finally{db.close();}
});
