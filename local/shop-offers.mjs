import {randomUUID} from 'node:crypto';
import {parseCSV,safeHttps} from './csv.mjs';
import {stableId} from './catalog-model.mjs';
import {CATALOG_CONFIG as config} from '../web/shop-pricing-config.mjs?v=20261017-final';
import {withTransaction} from './db-utils.mjs';
const fail=(message,status=400)=>{throw Object.assign(Error(message),{status});};
async function shopOwned(db,user,id){const shop=await db.prepare("SELECT * FROM shops WHERE id=? AND owner_id=? AND status='active' AND deleted_at IS NULL").get(String(id),user.id);if(!shop)fail('You can only manage your assigned active shop.',403);return shop;}
async function normalizedOffer(db,body,shop){
 const variant=await db.prepare('SELECT v.* FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id WHERE v.id=? AND v.deleted_at IS NULL AND p.deleted_at IS NULL').get(String(body.variant_id));if(!variant)fail('Choose an existing variant.');
 if(body.shop_id&&body.shop_id!==shop.id)fail('CSV rows must belong to your selected shop.',403);
 const price=Number(body.price);if(!Number.isFinite(price)||price<=0||price>config.maximumOfferPrice)fail('Enter a valid positive price.');
 if(!Object.hasOwn(config.stockDistribution,body.stock_status))fail('Choose a stock status.');
 const url=String(body.shop_product_url||'').trim();if(url&&!safeHttps(url))fail('Use a valid HTTPS shop product URL or leave it empty.');
 return {variant_id:variant.id,shop_id:shop.id,price,currency:variant.currency,stock_status:body.stock_status,shop_product_url:url||null};
}
async function writeOffer(db,user,value){
 const existing=await db.prepare('SELECT * FROM offers WHERE variant_id=? AND shop_id=?').get(value.variant_id,value.shop_id),id=existing?.id||stableId('offer',[value.variant_id,value.shop_id]),now=new Date().toISOString();
 if(existing&&!await db.prepare('SELECT id FROM offer_history WHERE offer_id=? LIMIT 1').get(id))await db.prepare('INSERT INTO offer_history(id,offer_id,price,stock_status,actor_id,is_seed,created_at) VALUES (?,?,?,?,?,?,?)').run(randomUUID(),id,existing.price,existing.stock_status,existing.is_seed?'seed':'previous',existing.is_seed,existing.updated_at);
 await db.prepare("INSERT INTO offers(id,variant_id,shop_id,price,currency,stock_status,in_stock,shop_product_url,approval_status,source,is_seed,updated_at) VALUES (?,?,?,?,?,?,?,?,'approved','shop',0,?) ON CONFLICT(variant_id,shop_id) DO UPDATE SET price=excluded.price,stock_status=excluded.stock_status,in_stock=excluded.in_stock,shop_product_url=excluded.shop_product_url,source='shop',seed_run_id=NULL,is_seed=0,approval_status='approved',updated_at=excluded.updated_at").run(id,value.variant_id,value.shop_id,value.price,value.currency,value.stock_status,['available','low_stock'].includes(value.stock_status)?1:0,value.shop_product_url,now);
 await db.prepare('INSERT INTO offer_history(id,offer_id,price,stock_status,actor_id,is_seed,created_at) VALUES (?,?,?,?,?,0,?)').run(randomUUID(),id,value.price,value.stock_status,user.id,now);
 await db.prepare('INSERT INTO admin_actions(id,actor_id,kind,target_id,details,created_at,before_json,after_json) VALUES (?,?,?,?,?,?,?,?)').run(randomUUID(),user.id,'shop_offer_saved',id,'{}',now,existing?JSON.stringify(existing):null,JSON.stringify(value));
 return id;
}
export async function shopOfferApi({db,req,res,url,body,user,json}){
 const action=url.pathname.slice('/api/shop/'.length);
 const owned=()=>shopOwned(db,user,body.shop_id||url.searchParams.get('shop'));
 if(req.method==='GET'&&action==='catalog'){
  const [shops,offerRows,categories,models]=await Promise.all([db.prepare("SELECT id,name,status FROM shops WHERE owner_id=? AND status='active' AND deleted_at IS NULL ORDER BY name").all(user.id),db.prepare("SELECT o.*,v.product_id,v.options,v.specs,p.slug,p.brand,p.model_name,p.category_id FROM offers o JOIN shops s ON s.id=o.shop_id JOIN catalog_variants v ON v.id=o.variant_id JOIN catalog_products p ON p.id=v.product_id WHERE s.owner_id=? AND s.status='active' AND s.deleted_at IS NULL AND v.deleted_at IS NULL AND p.deleted_at IS NULL ORDER BY p.brand,p.model_name,v.base_price").all(user.id),db.prepare('SELECT id,name FROM categories WHERE deleted_at IS NULL').all(),db.prepare('SELECT id,brand,model_name FROM catalog_products WHERE deleted_at IS NULL ORDER BY brand,model_name').all()]);
  const offers=await Promise.all(offerRows.map(async o=>{
   const prices=(await db.prepare("SELECT o.price FROM offers o JOIN shops s ON s.id=o.shop_id WHERE o.variant_id=? AND o.approval_status='approved' AND o.stock_status IN ('available','low_stock') AND s.status='active' AND s.deleted_at IS NULL ORDER BY o.price").all(o.variant_id)).map(r=>r.price);
   return {...o,options:JSON.parse(o.options),specs:JSON.parse(o.specs),price_rank:!o.in_stock?'Not available':!prices.length?'Unranked':o.price<=prices[0]?'Cheapest':o.price>=prices.at(-1)?'Highest':'Mid',rank:1+prices.filter(p=>p<o.price).length,competing_shops:prices.length};
  }));
  json(res,{shops,offers,categories,models});return;
 }
 if(req.method==='GET'&&action==='history'){
  const offer=await db.prepare('SELECT * FROM offers WHERE id=?').get(url.searchParams.get('offer'));if(!offer)fail('Offer not found.',404);await shopOwned(db,user,offer.shop_id);
  json(res,{offer,history:await db.prepare('SELECT price,stock_status,is_seed,created_at FROM offer_history WHERE offer_id=? ORDER BY created_at DESC LIMIT ?').all(offer.id,config.offerHistoryLimit)});return;
 }
 if(req.method==='GET'&&action==='offers.csv'){
  const shop=await owned(),rows=await db.prepare('SELECT variant_id,price,stock_status,shop_product_url FROM offers WHERE shop_id=? ORDER BY variant_id').all(shop.id),keys=['variant_id','price','stock_status','shop_product_url'];
  const quote=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"';
  res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="shop-offers.csv"','Cache-Control':'no-store'});res.end(keys.join(',')+'\r\n'+rows.map(row=>keys.map(key=>quote(row[key])).join(',')).join('\r\n'));return;
 }
 if(req.method!=='POST')fail('Shop endpoint not found.',404);
 if(action==='offer'){
  const shop=await owned(),value=await normalizedOffer(db,body,shop);const id=await withTransaction(db,tx=>writeOffer(tx,user,value));json(res,{ok:true,id});return;
 }
 if(action==='import'){
  const shop=await owned();if(typeof body.csv!=='string')fail('Select a CSV file.');let rows;try{rows=parseCSV(body.csv);}catch(error){fail(error.message);}if(!rows.length||rows.length>config.bulkOfferLimit)fail('CSV row count is outside the configured limit.');
  const values=await Promise.all(rows.map(async(row,index)=>{try{return await normalizedOffer(db,row,shop);}catch(error){fail('CSV row '+(index+2)+': '+error.message,error.status);}}));
  if(new Set(values.map(v=>v.variant_id)).size!==values.length)fail('CSV contains duplicate variant IDs.');
  await withTransaction(db,async tx=>{for(const value of values)await writeOffer(tx,user,value);});json(res,{ok:true,imported:values.length});return;
 }
 if(action==='request'){
  const shop=await owned();if(!['product','variant'].includes(body.kind))fail('Choose a product or variant request.');let payload;try{payload=typeof body.payload==='string'?JSON.parse(body.payload):body.payload;}catch{fail('Request details must be valid JSON.');}
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||JSON.stringify(payload).length>config.requestSizeLimit)fail('Enter bounded request details.');
  const id=randomUUID();await db.prepare('INSERT INTO catalog_requests(id,user_id,shop_id,kind,payload,status,created_at) VALUES (?,?,?,?,?,\'pending\',?)').run(id,user.id,shop.id,body.kind,JSON.stringify(payload),new Date().toISOString());json(res,{ok:true,id,status:'pending'});return;
 }
 fail('Shop endpoint not found.',404);
}
