import {createHash,randomUUID} from 'node:crypto';

const categories={'Phones':'phones','Audio':'audio','Laptops':'laptops','Chargers & Cables':'chargers','Appliances':'appliances','Tablets':'tablets','Watches':'watches','Desktops':'desktops','Monitors':'monitors','TV & Home':'tv','Accessories':'accessories'};
export const estimateRate=Object.freeze({usdInr:94.9245,date:'2026-10-16',source:'https://www.xe.com/en-gb/currencyconverter/convert/?Amount=1&From=USD&To=INR',roundTo:100});

export function validateCatalogue(rows){
 const errors=[],products=[],ids=new Set(),titles=new Set();
 if(!Array.isArray(rows)||!rows.length||rows.length>10000)return {products,errors:[{row:0,error:'Supply a non-empty JSON array with at most 10,000 products.'}]};
 for(const [i,row] of rows.entries()){
  const issues=[];
  if(!row||typeof row!=='object'||Array.isArray(row)){errors.push({row:i+1,error:'Expected a product object.'});continue;}
  for(const [key,max] of Object.entries({id:100,brand:100,model_name:200,variant_title:400,slug:400}))if(typeof row[key]!=='string'||!row[key].trim()||row[key].length>max)issues.push('Invalid '+key);
  if(!Object.hasOwn(categories,row.category))issues.push('Unknown category');
  if(row.release_year!=null&&(!Number.isInteger(row.release_year)||row.release_year<1970||row.release_year>new Date().getUTCFullYear()))issues.push('Invalid release year');
  if(row.approx_price_usd!=null&&(typeof row.approx_price_usd!=='number'||!Number.isFinite(row.approx_price_usd)||row.approx_price_usd<=0||row.approx_price_usd>1000000))issues.push('Invalid approximate USD price');
  if(!row.specs||typeof row.specs!=='object'||Array.isArray(row.specs)||Object.keys(row.specs).length>100||Object.entries(row.specs).some(([k,v])=>k.length>100||typeof v!=='string'||v.length>2000))issues.push('Specifications must be a bounded object of text values');
  if(row.search_keywords!=null&&(!Array.isArray(row.search_keywords)||row.search_keywords.length>100||row.search_keywords.some(v=>typeof v!=='string'||v.length>200)))issues.push('Invalid search keywords');
  for(const field of ['stock','shop_id','status_reported','quantity'])if(field in row)issues.push('Product catalogue cannot assign shop inventory: '+field);
  if(typeof row.id==='string'&&ids.has(row.id))issues.push('Duplicate product ID');
  if(typeof row.variant_title==='string'&&titles.has(row.variant_title.trim().toLowerCase()))issues.push('Duplicate variant title');
  if(issues.length){errors.push({row:i+1,error:issues.join('; ')});continue;}
  ids.add(row.id);titles.add(row.variant_title.trim().toLowerCase());
  products.push({...row,category_id:categories[row.category],database_id:'uploaded-'+createHash('sha256').update(row.id).digest('hex').slice(0,24)});
 }
 return {products,errors};
}

export function replaceCatalogue(db,rows,{apply=false,sourceName='products_catalog.json',sourceHash=createHash('sha256').update(JSON.stringify(rows)).digest('hex'),backupPath=null}={}){
 const {products,errors}=validateCatalogue(rows);
 const active=db.prepare('SELECT id FROM products WHERE deleted_at IS NULL').all();
 const report={source:sourceName,sourceHash,dryRun:!apply,total:Array.isArray(rows)?rows.length:0,valid:products.length,errors,oldActiveProducts:active.length,archivedProducts:0,archivedListings:0,importedProducts:0,unchanged:false,categories:{},estimateRate,backupPath};
 for(const p of products)report.categories[p.category_id]=(report.categories[p.category_id]||0)+1;
 if(errors.length||!apply)return report;
 const signatures=()=>Object.fromEntries(['shops','users','admins'].map(t=>[t,JSON.stringify(db.prepare('SELECT * FROM '+t+' ORDER BY id').all())]));
 const when=new Date().toISOString(),batch=randomUUID();
 db.exec('BEGIN IMMEDIATE');
 try{
  const previous=signatures();
  const live=db.prepare('SELECT id,specs FROM products WHERE deleted_at IS NULL').all();
  if(live.length===products.length&&live.every(p=>JSON.parse(p.specs).dataset_hash===sourceHash)){
   report.unchanged=true;db.exec('COMMIT');return report;
  }
  // Archive old products and their listings together. Foreign keys and history survive.
  report.archivedListings=db.prepare('UPDATE listings SET deleted_at=? WHERE deleted_at IS NULL AND product_id IN (SELECT id FROM products WHERE deleted_at IS NULL)').run(when).changes;
  report.archivedProducts=db.prepare('UPDATE products SET deleted_at=? WHERE deleted_at IS NULL').run(when).changes;
  const insert=db.prepare(`INSERT INTO products(id,brand,model,name,category_id,specs,variant,launch_year,aliases,sample,deleted_at,official_url,source_checked_at,catalogue_status,reference_price,reference_currency,reference_price_source,reference_checked_at,canonical_id)
   VALUES (?,?,?,?,?,?,?,?,?,0,NULL,NULL,NULL,'user_supplied_unverified',?,'INR',?,NULL,NULL)
   ON CONFLICT(id) DO UPDATE SET brand=excluded.brand,model=excluded.model,name=excluded.name,category_id=excluded.category_id,specs=excluded.specs,variant=excluded.variant,launch_year=excluded.launch_year,aliases=excluded.aliases,sample=0,deleted_at=NULL,official_url=NULL,source_checked_at=NULL,catalogue_status=excluded.catalogue_status,reference_price=excluded.reference_price,reference_currency='INR',reference_price_source=excluded.reference_price_source,reference_checked_at=NULL,canonical_id=NULL`);
  for(const p of products){
   db.prepare('INSERT INTO categories(id,name) VALUES (?,?) ON CONFLICT(id) DO UPDATE SET deleted_at=NULL').run(p.category_id,p.category);
   const estimate=p.approx_price_usd==null?null:Math.max(estimateRate.roundTo,Math.round(p.approx_price_usd*estimateRate.usdInr/estimateRate.roundTo)*estimateRate.roundTo);
   const summary=Object.entries(p.specs).slice(0,6).map(([key,value])=>key.replaceAll('_',' ')+': '+value).join(' | ');
   const specs={summary,supplied_specs:p.specs,subcategory:p.subcategory||null,dataset_source:sourceName,dataset_hash:sourceHash,dataset_record_id:p.id,slug:p.slug,granularity:'user_supplied_variant',configuration_note:'Imported from a user-supplied dataset. Specifications and variants are unverified; confirm the exact configuration with the shop.',price_estimate:{original_usd:p.approx_price_usd??null,...estimateRate,method:'Dataset USD estimate converted to INR; not a current Indian retail or shop quote.'}};
   const prefix=p.brand+' '+p.model_name;
   const variant=p.variant_title.startsWith(prefix)?p.variant_title.slice(prefix.length).trim().replace(/^\(|\)$/g,''):p.variant_title;
   insert.run(p.database_id,p.brand,p.model_name,p.variant_title,p.category_id,JSON.stringify(specs),variant||null,p.release_year??null,JSON.stringify([...new Set([p.model_name,p.variant_title,p.slug,...p.search_keywords||[]])]),estimate,estimate==null?null:'User-supplied USD estimate converted at '+estimateRate.usdInr+' INR/USD; rounded to nearest INR '+estimateRate.roundTo);
   report.importedProducts++;
  }
  if(JSON.stringify(previous)!==JSON.stringify(signatures()))throw Error('Shop or account records changed during catalogue replacement.');
  if(db.prepare('SELECT count(*) AS n FROM products WHERE deleted_at IS NULL').get().n!==products.length)throw Error('Active catalogue count mismatch.');
  if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Catalogue replacement would break foreign keys.');
  report.batchId=batch;report.preservedShopsAndAccounts=true;
  db.prepare('INSERT INTO import_batches(id,type,source_name,source_hash,dry_run,actor_id,created_at,total_rows,inserted_count,duplicate_count,error_count,report_json) VALUES (?,?,?,?,0,?,?,?,?,0,0,?)').run(batch,'products',sourceName,sourceHash,'authorized-dataset-replacement',when,rows.length,products.length,JSON.stringify(report));
  db.prepare('INSERT INTO admin_actions(id,actor_id,kind,target_id,details,created_at) VALUES (?,?,?,?,?,?)').run(randomUUID(),'authorized-dataset-replacement','replace_product_catalogue',batch,JSON.stringify(report),when);
  db.exec('COMMIT');return report;
 }catch(error){db.exec('ROLLBACK');throw error;}
}
