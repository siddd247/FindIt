import {DatabaseSync} from 'node:sqlite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getShopPrices} from '../web/shop-pricing.mjs';
import {SHOP_PRICING_CONFIG as pricing} from '../web/shop-pricing-config.mjs?v=20261017-final';

export function auditDatabase(filename=path.resolve(process.env.LOCAL_DATA_DIR||'.local','stock.sqlite')){
 const db=new DatabaseSync(filename,{readOnly:true});
 try{
  const products=db.prepare('SELECT * FROM products WHERE deleted_at IS NULL AND canonical_id IS NULL AND sample=0').all();
  const shops=db.prepare("SELECT * FROM shops WHERE deleted_at IS NULL AND status='active' AND sample=0").all();
  const categories={phones:'Phones',audio:'Audio',laptops:'Laptops',chargers:'Chargers & Cables',appliances:'Appliances',tablets:'Tablets',watches:'Watches',desktops:'Desktops',monitors:'Monitors',tv:'TV & Home',accessories:'Accessories'};
  const duplicateVariants=[],duplicateSlugs=[],invalidCategories=[],invalidPrices=[],seen=new Map(),slugs=new Map();
  let minDistinctPrices=Infinity;
  for(const p of products){
   const specs=JSON.parse(p.specs||'{}'),details=specs.supplied_specs||{};
   const signature=JSON.stringify([p.brand.toLowerCase(),p.model.toLowerCase(),Object.entries(details).sort(([a],[b])=>a.localeCompare(b))]);
   if(Object.keys(details).length&&seen.has(signature))duplicateVariants.push([seen.get(signature),p.id]);else seen.set(signature,p.id);
   if(specs.slug){if(slugs.has(specs.slug))duplicateSlugs.push([slugs.get(specs.slug),p.id]);else slugs.set(specs.slug,p.id);}
   if(!Object.hasOwn(categories,p.category_id))invalidCategories.push(p.id);
   const rows=getShopPrices(p,shops),base=p.reference_price;
   if(rows.some(row=>row.price===null||row.price<base*pricing.clamp.min||row.price>base*pricing.clamp.max)||rows.filter(row=>row.isBestPrice).length!==(rows.length?1:0))invalidPrices.push(p.id);
   minDistinctPrices=Math.min(minDistinctPrices,new Set(rows.map(row=>row.price)).size);
  }
  return {
   integrity:db.prepare('PRAGMA integrity_check').get().integrity_check,
   foreignKeyViolations:db.prepare('PRAGMA foreign_key_check').all(),
   products:products.length,models:new Set(products.map(p=>p.brand+'|'+p.model)).size,shops:shops.length,
   categories:Object.entries(categories).map(([id,name])=>({id,name,variants:products.filter(p=>p.category_id===id).length})),
   duplicateVariants,duplicateSlugs,invalidCategories,invalidPrices,minDistinctPrices:Number.isFinite(minDistinctPrices)?minDistinctPrices:0,
   missingShopDetails:{area:shops.filter(s=>!s.area).map(s=>s.id),pincode:shops.filter(s=>!s.pincode).map(s=>s.id),hours:shops.filter(s=>!s.hours).map(s=>s.id),phone:shops.filter(s=>!s.phone).map(s=>s.id)},
   postcodesOutsideRequestedRange:shops.filter(s=>s.pincode&&(Number(s.pincode)<180001||Number(s.pincode)>180020)).map(s=>({id:s.id,area:s.area,pincode:s.pincode})),
   actualInventoryRows:db.prepare('SELECT count(*) AS n FROM listings WHERE deleted_at IS NULL AND sample=0').get().n,
   legacyAdminRoleUsers:db.prepare("SELECT count(*) AS n FROM users WHERE role!='owner' AND deleted_at IS NULL").get().n,
   migrations:db.prepare('SELECT version FROM schema_migrations ORDER BY version').all().map(row=>row.version)
  };
 }finally{db.close();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=auditDatabase();console.log(JSON.stringify(report,null,2));
 if(report.integrity!=='ok'||report.foreignKeyViolations.length||report.duplicateVariants.length||report.duplicateSlugs.length||report.invalidCategories.length||report.invalidPrices.length)process.exitCode=1;
}
