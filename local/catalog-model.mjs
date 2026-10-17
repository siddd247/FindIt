import {createHash} from 'node:crypto';
import {CATALOG_CONFIG as config} from '../web/shop-pricing-config.mjs?v=20261017-final';

const normalize=value=>String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
const parse=value=>typeof value==='string'?JSON.parse(value):value;
export const stableId=(prefix,value)=>prefix+'-'+createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0,config.signatureLength);
const slug=value=>normalize(value).replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'')||'product';
const label=key=>key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const unique=values=>[...new Set(values)];
function orderAxes(keys){
 const rank=key=>config.lastAxes.includes(key)?config.axisOrder.length+keys.length+config.lastAxes.indexOf(key):config.axisOrder.includes(key)?config.axisOrder.indexOf(key):config.axisOrder.length;
 return [...keys].sort((a,b)=>rank(a)-rank(b)||a.localeCompare(b));
}
export function deriveAxes(records){
 const keys=orderAxes(unique(records.flatMap(r=>Object.keys(r.specs))));
 const varying=keys.filter(key=>unique(records.map(r=>r.specs[key]??null)).length>1),common={};
 for(const key of keys)if(!varying.includes(key))common[key]=records[0].specs[key];
 const remaining=new Set(varying),components=[];
 const linked=(a,b)=>{const aValues=unique(records.map(r=>r.specs[a]??null)),bValues=unique(records.map(r=>r.specs[b]??null));return aValues.length===bValues.length&&unique(records.map(r=>JSON.stringify([r.specs[a]??null,r.specs[b]??null]))).length===aValues.length;};
 for(const key of varying){
  if(!remaining.has(key))continue;
  const component=varying.filter(other=>remaining.has(other)&&(key===other||linked(key,other)));
  for(const item of component)remaining.delete(item);components.push(component);
 }
 let configurationIndex=0;
 const axes=components.map(keys=>{
  const composite=keys.length>1,key=composite?config.configurationKey+(configurationIndex++?'_'+configurationIndex:''):keys[0];
  const values=[];
  for(const record of records){const options=Object.fromEntries(keys.map(k=>[k,record.specs[k]??null]));const value=composite?JSON.stringify(keys.map(k=>options[k])):options[key];if(!values.some(v=>v.value===value))values.push({value,label:keys.map(k=>options[k]??'Not specified').join(' / '),options});}
  return {key,label:composite?config.configurationLabel:label(key),keys,values};
 });
 return {axes,common,varying};
}

export function planCatalog(db){
 const source=db.prepare('SELECT * FROM products WHERE deleted_at IS NULL AND canonical_id IS NULL AND sample=0 ORDER BY id').all(),groups=new Map();
 const report={sourceVariants:source.length,products:0,singleVariantProducts:0,suspiciousGroups:[],orphans:[],missingImages:0};
 for(const row of source){
  let metadata;try{metadata=parse(row.specs||'{}');}catch{report.orphans.push({id:row.id,reason:'Invalid specifications JSON'});continue;}
  if(!row.category_id||!normalize(row.brand)||!normalize(row.model)){report.orphans.push({id:row.id,reason:'Missing category, brand or model'});continue;}
  const groupKey=JSON.stringify([normalize(row.category_id),normalize(row.brand),normalize(row.model)]);
  if(!groups.has(groupKey))groups.set(groupKey,[]);
  groups.get(groupKey).push({row,metadata,specs:metadata.supplied_specs||{}});
 }
 const parents=[];
 for(const [groupKey,records]of groups){
  const first=records[0].row,{axes,common,varying}=deriveAxes(records),id=stableId('model',groupKey);
  const variants=records.map(record=>{
   const options={};for(const axis of axes)options[axis.key]=axis.keys.length>1?JSON.stringify(axis.keys.map(key=>record.specs[key]??null)):record.specs[axis.key]??null;
   const {row,metadata,specs}=record;
   return {id:row.id,product_id:id,legacy_product_id:row.id,slug:metadata.slug||slug(row.name)+'-'+stableId('v',row.id).slice(-config.slugSignatureLength),options,specs,base_price:row.reference_price??null,currency:row.reference_currency||'INR',images:row.photo?[row.photo]:[],legacy_metadata:metadata};
  });
  const issues=[];
  if(varying.some(key=>records.some(r=>r.specs[key]==null)))issues.push('Varying specifications have missing values');
  if(unique(records.map(r=>r.row.launch_year)).length>1)issues.push('Release years disagree');
  if(unique(records.map(r=>r.metadata.subcategory??null)).length>1)issues.push('Subcategories disagree');
  if(unique(variants.map(v=>JSON.stringify(v.options))).length!==variants.length)issues.push('Duplicate option combinations');
  if(variants.some(v=>v.base_price!==null&&(!Number.isFinite(v.base_price)||v.base_price<=0)))issues.push('Invalid base price');
  if(issues.length)report.suspiciousGroups.push({product_id:id,source_ids:variants.map(v=>v.id),issues});
  const cheapest=[...variants].sort((a,b)=>(a.base_price??Infinity)-(b.base_price??Infinity)||a.id.localeCompare(b.id))[0];
  const images=unique(variants.flatMap(v=>v.images));report.missingImages+=images.length?0:1;
  parents.push({id,slug:slug(first.brand+' '+first.model)+'-'+id.slice(-config.slugSignatureLength),group_key:groupKey,brand:first.brand,category_id:first.category_id,subcategory:records[0].metadata.subcategory??null,model_name:first.model,release_year:first.launch_year??null,option_axes:axes,specs:common,default_variant_id:cheapest.id,images,variants});
 }
 report.products=parents.length;report.singleVariantProducts=parents.filter(p=>p.variants.length===1).length;
 return {parents,report};
}

export function catalogIntegrity(db){
 return {
  unmappedActiveVariants:db.prepare('SELECT p.id FROM products p LEFT JOIN catalog_legacy_map m ON m.legacy_id=p.id WHERE p.deleted_at IS NULL AND p.canonical_id IS NULL AND p.sample=0 AND m.legacy_id IS NULL').all(),
  invalidDefaults:db.prepare('SELECT p.id FROM catalog_products p LEFT JOIN catalog_variants v ON v.id=p.default_variant_id AND v.product_id=p.id AND v.deleted_at IS NULL WHERE p.deleted_at IS NULL AND v.id IS NULL').all(),
  emptyProducts:db.prepare('SELECT p.id FROM catalog_products p LEFT JOIN catalog_variants v ON v.product_id=p.id AND v.deleted_at IS NULL WHERE p.deleted_at IS NULL GROUP BY p.id HAVING count(v.id)=0').all(),
  invalidMappings:db.prepare('SELECT m.legacy_id FROM catalog_legacy_map m JOIN catalog_variants v ON v.id=m.variant_id WHERE m.product_id!=v.product_id').all(),
  orphanOffers:db.prepare('SELECT o.id FROM offers o LEFT JOIN catalog_variants v ON v.id=o.variant_id LEFT JOIN shops s ON s.id=o.shop_id WHERE v.id IS NULL OR s.id IS NULL').all(),
  foreignKeyViolations:db.prepare('PRAGMA foreign_key_check').all()
 };
}

export function migrateCatalog(db,{apply=false}={}){
 const plan=planCatalog(db),report={...plan.report,dryRun:!apply,createdProducts:0,createdVariants:0,unchanged:0,skippedCustomized:0};
 if(!apply)return report;
 if(report.orphans.length||report.suspiciousGroups.some(g=>g.issues.includes('Duplicate option combinations')||g.issues.includes('Invalid base price')))throw Error('Catalog migration needs review; no records changed.');
 const now=new Date().toISOString();
 db.exec('BEGIN IMMEDIATE');
 try{
  for(const parent of plan.parents){
   const existing=db.prepare('SELECT * FROM catalog_products WHERE group_key=?').get(parent.group_key);
   if(existing?.customized){report.skippedCustomized++;continue;}
   if(existing)report.unchanged++;
   if(!existing)db.prepare('INSERT INTO catalog_products(id,slug,group_key,brand,category_id,subcategory,model_name,release_year,option_axes,specs,images,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(parent.id,parent.slug,parent.group_key,parent.brand,parent.category_id,parent.subcategory,parent.model_name,parent.release_year,JSON.stringify(parent.option_axes),JSON.stringify(parent.specs),JSON.stringify(parent.images),now,now);
   if(!existing)report.createdProducts++;
   for(const v of parent.variants){
    const prior=db.prepare('SELECT * FROM catalog_variants WHERE id=?').get(v.id);
    if(!prior)db.prepare('INSERT INTO catalog_variants(id,product_id,legacy_product_id,slug,options,specs,base_price,currency,images,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(v.id,parent.id,v.legacy_product_id,v.slug,JSON.stringify(v.options),JSON.stringify(v.specs),v.base_price,v.currency,JSON.stringify(v.images),now,now);
    if(prior&&prior.product_id===parent.id&&prior.options!==JSON.stringify(v.options))db.prepare('UPDATE catalog_variants SET options=?,updated_at=? WHERE id=?').run(JSON.stringify(v.options),now,v.id);
    db.prepare('INSERT OR IGNORE INTO catalog_legacy_map(legacy_id,variant_id,product_id,legacy_slug) VALUES (?,?,?,?)').run(v.legacy_product_id,v.id,parent.id,v.slug);if(!prior)report.createdVariants++;
   }
   if(!existing||existing.default_variant_id!==parent.default_variant_id||existing.option_axes!==JSON.stringify(parent.option_axes))db.prepare('UPDATE catalog_products SET default_variant_id=?,option_axes=?,specs=?,updated_at=? WHERE id=?').run(parent.default_variant_id,JSON.stringify(parent.option_axes),JSON.stringify(parent.specs),now,parent.id);
  }
  report.integrity=catalogIntegrity(db);if(Object.values(report.integrity).some(rows=>rows.length))throw Error('Catalog integrity checks failed.');
  db.exec('COMMIT');return report;
 }catch(error){db.exec('ROLLBACK');throw error;}
}
