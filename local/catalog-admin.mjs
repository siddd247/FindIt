import {randomUUID,randomBytes,scryptSync} from 'node:crypto';
import {deriveAxes,stableId,catalogIntegrity} from './catalog-model.mjs';
import {auditAdmin} from './admin-auth.mjs';import {safeHttps} from './csv.mjs';
import {CATALOG_CONFIG as config} from '../web/shop-pricing-config.mjs?v=20261017-final';
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
const text=(v,max=config.catalogTextLimit)=>{if(typeof v!=='string'||!v.trim()||v.length>max)fail('Enter a valid text value.');return v.trim();};
const jsonObject=v=>{try{const value=typeof v==='string'?JSON.parse(v):v;if(!value||typeof value!=='object'||Array.isArray(value))fail('Specifications must be an object.');return value;}catch{fail('Enter valid specification details.');}};
const specsOf=v=>{const values=jsonObject(v);if(Object.entries(values).some(([k,value])=>k.length>config.catalogTextLimit||typeof value!=='string'||!value.trim()||value.length>config.catalogTextLimit))fail('Specification names and values must be bounded nonempty text.');return values;};
const imagesOf=value=>{const images=Array.isArray(value)?value:String(value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(images.length>config.imageLimit||images.some(url=>typeof url!=='string'||!safeHttps(url)&&!/^\/uploads\/[a-f0-9-]+\.jpg$/.test(url)))fail('Images must be supplied HTTPS URLs or existing uploaded JPG paths.');return images;};
const modelYear=value=>{if(value==null||value==='')return null;const year=Number(value);if(!Number.isSafeInteger(year)||year<=0)fail('Enter a valid release year.');return year;};
const activeParent=(db,id)=>{const p=db.prepare('SELECT * FROM catalog_products WHERE id=? AND deleted_at IS NULL').get(id);if(!p)fail('Choose an active product.',404);return p;};
function parentSeed(db,body){
 const brand=text(body.brand),model=text(body.model_name),category=text(body.category_id);if(!db.prepare('SELECT id FROM categories WHERE id=? AND deleted_at IS NULL').get(category))fail('Choose a category.');
 const key=JSON.stringify([category,brand,model].map(value=>value.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase())),id=stableId('model',key);
 if(db.prepare('SELECT id FROM catalog_products WHERE group_key=?').get(key))fail('This model already exists. Add a variant or merge the products.',409);
 const slug=(brand+' '+model).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'')+'-'+id.slice(-config.slugSignatureLength),now=new Date().toISOString();
 db.prepare('INSERT INTO catalog_products(id,slug,group_key,brand,category_id,subcategory,model_name,release_year,images,customized,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,1,?,?)').run(id,slug,key,brand,category,body.subcategory?text(body.subcategory):null,model,modelYear(body.release_year),JSON.stringify(imagesOf(body.images)),now,now);return id;
}
function addVariant(db,parentId,body){
 activeParent(db,parentId);const specs=specsOf(body.specs),price=body.base_price===''||body.base_price==null?null:Number(body.base_price);if(price!==null&&(!Number.isFinite(price)||price<=0||price>config.maximumOfferPrice))fail('Enter a valid base price.');
 const id='variant-'+randomUUID(),slug='variant-'+id.slice(-config.signatureLength),now=new Date().toISOString();
 db.prepare('INSERT INTO catalog_variants(id,product_id,slug,options,specs,base_price,currency,images,created_at,updated_at) VALUES (?,?,?,\'{}\',?,?,\'INR\',?,?,?)').run(id,parentId,slug,JSON.stringify(specs),price,JSON.stringify(imagesOf(body.images)),now,now);return id;
}
export function rebuildProduct(db,id,{axisOrder,defaultVariant,lockDefault}={}){
 const p=db.prepare('SELECT * FROM catalog_products WHERE id=?').get(id),variants=db.prepare('SELECT * FROM catalog_variants WHERE product_id=? AND deleted_at IS NULL ORDER BY id').all(id);
 if(!variants.length)fail('Every active product must keep at least one variant.');
 const {axes,common}=deriveAxes(variants.map(v=>({specs:JSON.parse(v.specs)})));
 if(axisOrder){const order=axisOrder.map(s=>s.trim()).filter(Boolean);if(order.length!==axes.length||new Set(order).size!==axes.length||order.some(key=>!axes.some(a=>a.key===key)))fail('Axis order must include every current selector once.');axes.sort((a,b)=>order.indexOf(a.key)-order.indexOf(b.key));}
 const signatures=new Set();
 for(const v of variants){const specs=JSON.parse(v.specs),options=Object.fromEntries(axes.map(axis=>[axis.key,axis.keys.length>1?JSON.stringify(axis.keys.map(k=>specs[k]??null)):specs[axis.key]??null])),signature=JSON.stringify(options);if(signatures.has(signature))fail('Duplicate variant configuration. Correct its specifications before saving.');signatures.add(signature);db.prepare('UPDATE catalog_variants SET options=? WHERE id=?').run(signature,v.id);}
 const locked=lockDefault===undefined?p.default_locked:Number(lockDefault),preferred=defaultVariant||p.default_variant_id;
 const chosen=locked?variants.find(v=>v.id===preferred):[...variants].sort((a,b)=>(a.base_price??Infinity)-(b.base_price??Infinity)||a.id.localeCompare(b.id))[0];if(!chosen)fail('The default variant must belong to this product.');
 db.prepare('UPDATE catalog_products SET option_axes=?,specs=?,default_variant_id=?,default_locked=?,customized=1,updated_at=? WHERE id=?').run(JSON.stringify(axes),JSON.stringify(common),chosen.id,locked,new Date().toISOString(),id);
 db.prepare('UPDATE catalog_legacy_map SET product_id=? WHERE variant_id IN (SELECT id FROM catalog_variants WHERE product_id=?)').run(id,id);
}
export function qualityReport(db){
 const products=db.prepare('SELECT * FROM catalog_products WHERE deleted_at IS NULL').all(),variants=db.prepare('SELECT * FROM catalog_variants WHERE deleted_at IS NULL').all();const duplicates=[],missingValues=[];
 for(const product of products){const seen=new Map(),rows=variants.filter(v=>v.product_id===product.id);for(const v of rows){const signature=JSON.stringify(Object.entries(JSON.parse(v.options)).sort(([a],[b])=>a.localeCompare(b)));if(seen.has(signature))duplicates.push([seen.get(signature),v.id]);seen.set(signature,v.id);}const keys=[...new Set(rows.flatMap(v=>Object.keys(JSON.parse(v.specs))))];if(keys.some(key=>rows.some(v=>JSON.parse(v.specs)[key]==null)))missingValues.push(product.id);}
 return {integrity:catalogIntegrity(db),singleVariantProducts:products.filter(p=>variants.filter(v=>v.product_id===p.id).length===1).map(p=>({id:p.id,name:p.brand+' '+p.model_name})),missingImages:products.filter(p=>!JSON.parse(p.images).length).map(p=>({id:p.id,name:p.brand+' '+p.model_name})),duplicates,missingSpecValues:missingValues,missingBasePrices:variants.filter(v=>v.base_price==null).map(v=>v.id),priceOutliers:db.prepare('SELECT o.id,o.price,v.base_price,o.shop_id,o.variant_id FROM offers o JOIN catalog_variants v ON v.id=o.variant_id WHERE v.base_price IS NOT NULL AND (o.price<v.base_price*? OR o.price>v.base_price*?)').all(config.priceSanity.min,config.priceSanity.max)};
}
export function catalogAdminApi({db,req,res,url,body,user,json}){
 const action=url.pathname.slice('/api/admin/catalog/'.length);
 if(req.method==='GET'&&action==='data'){
  json(res,{products:db.prepare('SELECT * FROM catalog_products WHERE deleted_at IS NULL ORDER BY brand,model_name').all(),variants:db.prepare('SELECT * FROM catalog_variants WHERE deleted_at IS NULL ORDER BY product_id,base_price').all(),categories:db.prepare('SELECT id,name FROM categories WHERE deleted_at IS NULL').all(),shops:db.prepare('SELECT id,name,owner_id,status FROM shops WHERE deleted_at IS NULL AND sample=0 ORDER BY name').all(),users:db.prepare("SELECT id,email,role,status FROM users WHERE role IN ('shop','owner') ORDER BY email").all(),requests:db.prepare('SELECT * FROM catalog_requests ORDER BY created_at DESC').all(),quality:qualityReport(db),audit:db.prepare("SELECT kind,target_id,created_at,actor_id FROM admin_actions ORDER BY created_at DESC LIMIT ?").all(config.offerHistoryLimit)});return;
 }
 if(req.method!=='POST')fail('Catalogue endpoint not found.',404);
 db.exec('BEGIN IMMEDIATE');try{
  let target=body.id||body.product_id||'',before=null,result={ok:true};
  if(action==='create-product'){target=parentSeed(db,body);const id=addVariant(db,target,body);rebuildProduct(db,target);result={ok:true,id:target,variant_id:id};}
  else if(action==='add-variant'){target=body.product_id;const id=addVariant(db,target,body);rebuildProduct(db,target);result={ok:true,id};}
  else if(action==='save-product'){
   before=activeParent(db,target);const brand=text(body.brand),model=text(body.model_name),category=text(body.category_id);if(!db.prepare('SELECT id FROM categories WHERE id=?').get(category))fail('Choose a category.');
   db.prepare('UPDATE catalog_products SET brand=?,model_name=?,category_id=?,subcategory=?,release_year=?,images=? WHERE id=?').run(brand,model,category,body.subcategory?text(body.subcategory):null,modelYear(body.release_year),JSON.stringify(imagesOf(body.images)),target);
   rebuildProduct(db,target,{axisOrder:String(body.axis_order||'').split(',').map(s=>s.trim()).filter(Boolean),defaultVariant:body.default_variant_id||undefined,lockDefault:!!body.default_variant_id});
  }else if(action==='save-variant'){
   before=db.prepare('SELECT * FROM catalog_variants WHERE id=? AND deleted_at IS NULL').get(target);if(!before)fail('Variant not found.',404);const specs=specsOf(body.specs),price=body.base_price===''||body.base_price==null?null:Number(body.base_price);if(price!==null&&(!Number.isFinite(price)||price<=0||price>config.maximumOfferPrice))fail('Enter a valid base price.');const images=imagesOf(body.images);
   db.prepare('UPDATE catalog_variants SET specs=?,base_price=?,images=?,updated_at=? WHERE id=?').run(JSON.stringify(specs),price,JSON.stringify(images),new Date().toISOString(),target);
   if(body.apply_color){const key=config.lastAxes.find(key=>specs[key]!=null);if(!key)fail('This variant has no colour specification.');for(const other of db.prepare('SELECT id,specs FROM catalog_variants WHERE product_id=? AND deleted_at IS NULL').all(before.product_id))if(JSON.parse(other.specs)[key]===specs[key])db.prepare('UPDATE catalog_variants SET images=? WHERE id=?').run(JSON.stringify(images),other.id);}
   rebuildProduct(db,before.product_id);
  }else if(action==='merge'){
   const source=activeParent(db,body.source),targetParent=activeParent(db,body.target);if(source.id===targetParent.id)fail('Choose different products.');before=source;
   db.prepare('UPDATE catalog_variants SET product_id=? WHERE product_id=?').run(targetParent.id,source.id);db.prepare('UPDATE catalog_products SET default_variant_id=NULL,deleted_at=?,redirect_to=?,customized=1 WHERE id=?').run(new Date().toISOString(),targetParent.id,source.id);rebuildProduct(db,targetParent.id);target=targetParent.id;
  }else if(action==='move-variant'){
   const v=db.prepare('SELECT * FROM catalog_variants WHERE id=? AND deleted_at IS NULL').get(body.variant_id);if(!v)fail('Choose a variant.');const to=activeParent(db,body.target);if(v.product_id===to.id)fail('Choose another target product.');before=v;
   db.prepare('UPDATE catalog_variants SET product_id=? WHERE id=?').run(to.id,v.id);if(db.prepare('SELECT id FROM catalog_variants WHERE product_id=? AND deleted_at IS NULL LIMIT 1').get(v.product_id))rebuildProduct(db,v.product_id);else db.prepare('UPDATE catalog_products SET default_variant_id=NULL,deleted_at=?,redirect_to=?,customized=1 WHERE id=?').run(new Date().toISOString(),to.id,v.product_id);rebuildProduct(db,to.id);target=v.id;
  }else if(action==='split'){
   const source=activeParent(db,body.product_id),ids=Array.isArray(body.variant_ids)?body.variant_ids:[];const variants=db.prepare('SELECT id FROM catalog_variants WHERE product_id=? AND deleted_at IS NULL').all(source.id);if(!ids.length||ids.length>=variants.length||ids.some(id=>!variants.some(v=>v.id===id)))fail('Choose variants to split and leave at least one in the original product.');
   target=parentSeed(db,{...source,images:JSON.parse(source.images),model_name:text(body.model_name)});for(const id of ids)db.prepare('UPDATE catalog_variants SET product_id=? WHERE id=?').run(target,id);rebuildProduct(db,source.id);rebuildProduct(db,target);result={ok:true,id:target};
  }else if(action==='create-shop-user'){
   const email=text(body.email).toLowerCase(),password=String(body.password||''),shop=db.prepare('SELECT id,owner_id FROM shops WHERE id=? AND deleted_at IS NULL AND sample=0').get(body.shop_id);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<config.shopPasswordMin||password.length>config.shopPasswordMax)fail('Enter an email and a password within the configured limits.');if(!shop)fail('Choose a shop.');if(shop.owner_id)fail('That shop already has an account. Reassign it explicitly.');if(db.prepare('SELECT id FROM users WHERE email=?').get(email))fail('That email already exists. Link its existing account instead.',409);const salt=randomBytes(16).toString('hex'),id=randomUUID();
   db.prepare('INSERT INTO users(id,email,password_hash,role,status,created_at) VALUES (?,?,?,\'shop\',\'active\',?)').run(id,email,salt+':'+scryptSync(password,salt,64).toString('hex'),new Date().toISOString());db.prepare('UPDATE shops SET owner_id=? WHERE id=?').run(id,shop.id);target=id;result={ok:true,id};
  }else if(action==='link-shop-user'){
   const account=db.prepare("SELECT id FROM users WHERE id=? AND role IN ('shop','owner') AND deleted_at IS NULL").get(body.user_id),shop=db.prepare('SELECT id FROM shops WHERE id=? AND deleted_at IS NULL').get(body.shop_id);if(!account||!shop)fail('Choose a shop-user account and shop.');before=db.prepare('SELECT owner_id FROM shops WHERE id=?').get(shop.id);db.prepare('UPDATE shops SET owner_id=? WHERE id=?').run(account.id,shop.id);target=shop.id;
  }else if(action==='user-status'){
   if(!['active','suspended'].includes(body.status))fail('Choose active or suspended.');const account=db.prepare("SELECT id,status FROM users WHERE id=? AND role IN ('shop','owner')").get(body.id);if(!account)fail('Shop user not found.',404);before=account;db.prepare('UPDATE users SET status=? WHERE id=?').run(body.status,body.id);if(body.status==='suspended')db.prepare('DELETE FROM sessions WHERE user_id=?').run(body.id);
  }else if(action==='review-request'){
   const request=db.prepare('SELECT * FROM catalog_requests WHERE id=?').get(body.id);if(!request)fail('Request not found.',404);if(request.result_variant_id||request.status==='rejected')fail('This request has already been reviewed.',409);before=request;
   if(body.decision==='rejected')db.prepare("UPDATE catalog_requests SET status='rejected',reviewed_at=?,review_note=? WHERE id=?").run(new Date().toISOString(),String(body.note||''),request.id);
   else if(body.decision==='approved'){const payload=JSON.parse(request.payload),productId=request.kind==='product'?parentSeed(db,payload):activeParent(db,payload.product_id).id,variantId=addVariant(db,productId,payload);rebuildProduct(db,productId);db.prepare("UPDATE catalog_requests SET status='approved',reviewed_at=?,review_note=?,result_product_id=?,result_variant_id=? WHERE id=?").run(new Date().toISOString(),String(body.note||''),productId,variantId,request.id);result={ok:true,product_id:productId,variant_id:variantId};}else fail('Choose approve or reject.');
  }else fail('Catalogue action not found.',404);
  const integrity=catalogIntegrity(db);if(Object.values(integrity).some(rows=>rows.length))fail('The change would break catalogue relationships.');
  auditAdmin(db,user.id,'catalog_'+action,target,body.password?{email:body.email,shop_id:body.shop_id}:body,before,result);db.exec('COMMIT');json(res,result);
 }catch(error){db.exec('ROLLBACK');throw error;}
}
