import {matchProduct} from '../lib/rules.ts';
import {CATALOG_CONFIG as config} from '../web/shop-pricing-config.mjs?v=20261017-final';
const decode=row=>row?{...row,option_axes:JSON.parse(row.option_axes),specs:JSON.parse(row.specs),images:JSON.parse(row.images)}:null;
const variant=row=>({...row,options:JSON.parse(row.options),specs:JSON.parse(row.specs),images:JSON.parse(row.images)});
export function modelOffers(db,productId,shopId=''){
 const offers=db.prepare("SELECT o.*,s.name AS shop_name,s.area,s.pincode FROM offers o JOIN catalog_variants v ON v.id=o.variant_id JOIN shops s ON s.id=o.shop_id WHERE v.product_id=? AND v.deleted_at IS NULL AND s.status='active' AND s.deleted_at IS NULL AND o.approval_status='approved'").all(productId).filter(o=>!shopId||o.shop_id===shopId);
 offers.sort((a,b)=>Number(!['available','low_stock'].includes(a.stock_status))-Number(!['available','low_stock'].includes(b.stock_status))||a.price-b.price||a.shop_id.localeCompare(b.shop_id));
 return offers;
}
export function listModels(db,params=new URLSearchParams()){
 const parents=db.prepare("SELECT * FROM catalog_products WHERE deleted_at IS NULL AND approval_status='approved' ORDER BY brand,model_name").all(),allVariants=db.prepare("SELECT v.*,p.aliases,p.name,p.model,p.brand FROM catalog_variants v LEFT JOIN products p ON p.id=v.legacy_product_id WHERE v.deleted_at IS NULL AND v.approval_status='approved'").all();
 const q=(params.get('q')||'').slice(0,150),brand=params.get('brand')||'',category=params.get('category')||'',shop=params.get('shop')||'',min=params.get('min'),max=params.get('max');
 if([min,max].some(v=>v!==null&&v!==''&&(!Number.isFinite(Number(v))||Number(v)<0))||min&&max&&Number(min)>Number(max))throw Object.assign(Error('Enter a valid price range.'),{status:400});
 const selections=[...params].filter(([key,value])=>key.startsWith('spec.')&&value).map(([key,value])=>[key.slice(5),value]);
 const facets={brands:[...new Set(parents.map(p=>p.brand))].sort(),categories:db.prepare('SELECT id,name FROM categories WHERE deleted_at IS NULL ORDER BY name').all(),axes:{}};
 const models=[];
 for(const raw of parents){
  const p=decode(raw),variants=allVariants.filter(v=>v.product_id===p.id);
  if(!category||p.category_id===category)for(const v of variants)for(const [key,value]of Object.entries(JSON.parse(v.specs)))if(p.option_axes.some(axis=>axis.keys.includes(key))){(facets.axes[key]??=[]).push(String(value));}
  if(category&&p.category_id!==category||brand&&p.brand.toLowerCase()!==brand.toLowerCase())continue;
  const matching=variants.filter(v=>(!q||matchProduct({name:v.name||p.brand+' '+p.model_name,brand:p.brand,model:p.model_name,aliases:v.aliases||'[]'},q)>0)&&selections.every(([key,value])=>String(JSON.parse(v.specs)[key])===value));
  if(!matching.length)continue;
  const offers=modelOffers(db,p.id,shop),ids=new Set(matching.map(v=>v.id)),eligible=offers.filter(o=>ids.has(o.variant_id));if(shop&&!eligible.length)continue;
  const active=eligible.filter(o=>['available','low_stock'].includes(o.stock_status)),prices=(active.length?active:eligible).map(o=>o.price);
  const from=prices.length?Math.min(...prices):null,to=prices.length?Math.max(...prices):null;
  if(min&&(!from||from<Number(min))||max&&(!from||from>Number(max)))continue;
  models.push({...p,kind:'model',name:p.brand+' '+p.model_name,model:p.model_name,launch_year:p.release_year,variants_count:variants.length,options_count:variants.length,shop_count:new Set(eligible.map(o=>o.shop_id)).size,from_price:from,to_price:to,reference_price:from,reference_currency:'INR',aliases:JSON.stringify([...new Set(variants.flatMap(v=>[v.name,...JSON.parse(v.aliases||'[]')]).filter(Boolean))])});
 }
 for(const key of Object.keys(facets.axes))facets.axes[key]=[...new Set(facets.axes[key])].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 models.sort((a,b)=>(a.from_price??Infinity)-(b.from_price??Infinity)||a.name.localeCompare(b.name));
 return {models,facets,total:models.length};
}
export function getModel(db,idOrSlug,shopId=''){
 let raw=db.prepare('SELECT * FROM catalog_products WHERE id=? OR slug=?').get(idOrSlug,idOrSlug);const visited=new Set();while(raw?.redirect_to){if(visited.has(raw.id))throw Error('Circular product redirect.');visited.add(raw.id);raw=db.prepare('SELECT * FROM catalog_products WHERE id=?').get(raw.redirect_to);}const p=raw&&!raw.deleted_at&&raw.approval_status==='approved'?decode(raw):null;
 if(!p)return null;
 return {product:p,variants:db.prepare("SELECT * FROM catalog_variants WHERE product_id=? AND deleted_at IS NULL AND approval_status='approved' ORDER BY base_price,id").all(p.id).map(variant),offers:modelOffers(db,p.id,shopId),shop:shopId?db.prepare("SELECT id,name,area FROM shops WHERE id=? AND status='active' AND deleted_at IS NULL").get(shopId)||null:null};
}
export function archivedModel(db,id){
 const p=db.prepare('SELECT * FROM products WHERE id=? AND deleted_at IS NOT NULL').get(id);if(!p)return null;
 const similar=listModels(db,new URLSearchParams({category:p.category_id||''})).models.filter(model=>model.brand.toLowerCase()===p.brand.toLowerCase()||model.model_name.toLowerCase().includes(String(p.model).split(' ')[0].toLowerCase()));
 similar.sort((a,b)=>Math.abs((a.from_price??Infinity)-(p.reference_price??0))-Math.abs((b.from_price??Infinity)-(p.reference_price??0))||a.name.localeCompare(b.name));
 return {archived:true,name:p.name,category:p.category_id,similar:similar.slice(0,config.similarProductLimit)};
}
