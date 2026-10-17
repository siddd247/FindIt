import {createHash,randomUUID} from 'node:crypto';
import {CATALOG_CONFIG as config} from '../web/shop-pricing-config.mjs?v=20261017-final';
import {getShopPrices} from '../web/shop-pricing.mjs';
import {catalogIntegrity,stableId} from './catalog-model.mjs';

const unit=(...parts)=>createHash('sha256').update(JSON.stringify(parts)).digest().readUInt32BE()/4294967296;
const queues=[
 {name:'shops',table:'shops',field:'status',where:"deleted_at IS NULL AND status='pending'",approved:'active'},
 {name:'shop_users',table:'users',field:'status',where:"role IN ('owner','shop') AND deleted_at IS NULL AND status='pending'",approved:'active'},
 {name:'product_requests',table:'catalog_requests',field:'status',where:"kind='product' AND status='pending'",approved:'approved'},
 {name:'variant_requests',table:'catalog_requests',field:'status',where:"kind='variant' AND status='pending'",approved:'approved'},
 {name:'products',table:'catalog_products',field:'approval_status',where:"deleted_at IS NULL AND approval_status='pending'",approved:'approved'},
 {name:'variants',table:'catalog_variants',field:'approval_status',where:"deleted_at IS NULL AND approval_status='pending'",approved:'approved'},
 {name:'offers',table:'offers',field:'approval_status',where:"approval_status='pending'",approved:'approved'}
];
export function pendingQueues(db){return Object.fromEntries(queues.map(queue=>[queue.name,db.prepare('SELECT count(*) AS n FROM '+queue.table+' WHERE '+queue.where).get().n]));}
export function seededStock(variantId,shops,seed=config.seed){
 const distribution=Object.entries(config.stockDistribution),total=distribution.reduce((sum,[,weight])=>sum+weight,0);
 if(Math.abs(total-1)>Number.EPSILON*distribution.length||distribution.some(([,weight])=>!Number.isFinite(weight)||weight<0))throw Error('Stock distribution must contain nonnegative weights summing to one.');
 const ordered=[...shops].sort((a,b)=>a.id.localeCompare(b.id));
 const rows=ordered.map(shop=>{const random=unit(seed,variantId,shop.id);let threshold=0,status=distribution.at(-1)[0];for(const [name,weight]of distribution){threshold+=weight;if(random<threshold){status=name;break;}}return {shop,status};});
 // The rescue is also seeded; it never varies on refresh or input order.
 if(rows.length&&!rows.some(row=>row.status==='available'))[...rows].sort((a,b)=>unit(seed,'rescue',variantId,a.shop.id)-unit(seed,'rescue',variantId,b.shop.id))[0].status='available';
 if(rows.length>1&&rows.every(row=>row.status==='available'))rows.at(-1).status=distribution.find(([name,weight])=>name!=='available'&&weight>0)?.[0]||'available';
 return rows;
}
function approveQueues(db,runId){
 const result={};
 for(const queue of queues){
  const rows=db.prepare('SELECT * FROM '+queue.table+' WHERE '+queue.where).all();result[queue.name]=rows.length;
  for(const row of rows){
   db.prepare('UPDATE '+queue.table+' SET '+queue.field+'=? WHERE id=?').run(queue.approved,row.id);
   db.prepare('INSERT INTO catalog_seed_effects(id,seed_run_id,queue,target_id,before_status,after_status) VALUES (?,?,?,?,?,?)').run(randomUUID(),runId,queue.name,row.id,row[queue.field],queue.approved);
  }
 }
 return result;
}
export function wipeCatalogSeed(db,{apply=false}={}){
 const report={dryRun:!apply,offers:db.prepare('SELECT count(*) AS n FROM offers WHERE is_seed=1').get().n,restoredApprovals:0,preservedChangedApprovals:0};
 if(!apply)return report;
 const ownTransaction=!db.isTransaction;if(ownTransaction)db.exec('BEGIN IMMEDIATE');try{
  // Ownership edits must promote their offers to source=shop/is_seed=0.
  db.prepare('DELETE FROM offer_history WHERE is_seed=1').run();
  db.prepare('DELETE FROM offers WHERE is_seed=1').run();
  const effects=db.prepare('SELECT e.* FROM catalog_seed_effects e JOIN catalog_seed_runs r ON r.id=e.seed_run_id WHERE r.wiped_at IS NULL ORDER BY r.created_at DESC').all();
  for(const effect of effects){const queue=queues.find(q=>q.name===effect.queue);const row=db.prepare('SELECT '+queue.field+' AS status FROM '+queue.table+' WHERE id=?').get(effect.target_id);if(row?.status===effect.after_status){db.prepare('UPDATE '+queue.table+' SET '+queue.field+'=? WHERE id=?').run(effect.before_status,effect.target_id);report.restoredApprovals++;}else report.preservedChangedApprovals++;}
  db.prepare('UPDATE catalog_seed_runs SET wiped_at=? WHERE wiped_at IS NULL').run(new Date().toISOString());
  if(ownTransaction)db.exec('COMMIT');return report;
 }catch(error){if(ownTransaction)db.exec('ROLLBACK');throw error;}
}
export function seedCatalog(db,{apply=false,seed=config.seed}={}){
 const variants=db.prepare('SELECT v.*,p.category_id FROM catalog_variants v JOIN catalog_products p ON p.id=v.product_id WHERE v.deleted_at IS NULL AND p.deleted_at IS NULL ORDER BY v.id').all();
 const shops=db.prepare("SELECT id,name,area FROM shops WHERE deleted_at IS NULL AND sample=0 AND status IN ('active','pending') ORDER BY id").all();
 const report={dryRun:!apply,seed,variants:variants.length,shops:shops.length,pairs:variants.length*shops.length,approvedPerQueue:pendingQueues(db),stockCounts:Object.fromEntries(Object.keys(config.stockDistribution).map(key=>[key,0])),createdOffers:0,updatedSeedOffers:0,preservedShopOffers:0};
 if(!apply)return report;
 if(!variants.length||!shops.length)throw Error('Migrate the catalog and supply shops before seeding.');
 const runId=randomUUID(),now=new Date().toISOString(),ownTransaction=!db.isTransaction;if(ownTransaction)db.exec('BEGIN IMMEDIATE');
 try{
  db.prepare('INSERT INTO catalog_seed_runs(id,seed,distribution,created_at) VALUES (?,?,?,?)').run(runId,seed,JSON.stringify(config.stockDistribution),now);
  report.approvedPerQueue=approveQueues(db,runId);
  for(const variant of variants){
   const stock=new Map(seededStock(variant.id,shops,seed).map(row=>[row.shop.id,row.status]));
   for(const row of getShopPrices({...variant,category_id:variant.category_id},shops)){
    const previous=db.prepare('SELECT * FROM offers WHERE variant_id=? AND shop_id=?').get(variant.id,row.shop.id);
    if(previous&&!previous.is_seed){report.preservedShopOffers++;continue;}
    if(row.price===null)throw Error('Cannot seed a variant without a valid base price: '+variant.id);
    const status=stock.get(row.shop.id),id=previous?.id||stableId('offer',[variant.id,row.shop.id]);
    db.prepare('INSERT INTO offers(id,variant_id,shop_id,price,currency,stock_status,in_stock,shop_product_url,approval_status,source,seed_run_id,is_seed,updated_at) VALUES (?,?,?,?,?,?,?,NULL,\'approved\',\'seed\',?,1,?) ON CONFLICT(variant_id,shop_id) DO UPDATE SET price=excluded.price,currency=excluded.currency,stock_status=excluded.stock_status,in_stock=excluded.in_stock,approval_status=excluded.approval_status,seed_run_id=excluded.seed_run_id,updated_at=excluded.updated_at').run(id,variant.id,row.shop.id,row.price,variant.currency,status,['available','low_stock'].includes(status)?1:0,runId,now);
    report.stockCounts[status]++;if(previous)report.updatedSeedOffers++;else report.createdOffers++;
   }
  }
  report.integrity=catalogIntegrity(db);if(Object.values(report.integrity).some(rows=>rows.length))throw Error('Seed integrity checks failed.');
  report.seedRunId=runId;db.prepare('UPDATE catalog_seed_runs SET report=? WHERE id=?').run(JSON.stringify(report),runId);if(ownTransaction)db.exec('COMMIT');return report;
 }catch(error){if(ownTransaction)db.exec('ROLLBACK');throw error;}
}
