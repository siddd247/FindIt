import { withTransaction } from '../../local/db-utils.mjs';

/** Remove only records carrying the integration test's explicit synthetic markers. */
export async function cleanupCloudIntegrationFixtures(db) {
 const owners=await db.prepare("SELECT id FROM users WHERE email LIKE 'owner-%@phase2.invalid'").all();
 const admins=await db.prepare("SELECT id FROM admins WHERE email LIKE 'admin-%@phase2.invalid'").all();
 const products=await db.prepare("SELECT id FROM products WHERE brand='Phase2Synthetic' AND model='Persistence Widget' AND sample=0").all();
 const ownerIds=owners.map(row=>row.id),adminIds=admins.map(row=>row.id),productIds=products.map(row=>row.id);
 const shops=ownerIds.length?await db.prepare(`SELECT id FROM shops WHERE owner_id IN (${ownerIds.map(()=>'?').join(',')})`).all(...ownerIds):[];
 const shopIds=shops.map(row=>row.id);
 const listingConditions=[],listingArgs=[];
 if(shopIds.length){listingConditions.push(`shop_id IN (${shopIds.map(()=>'?').join(',')})`);listingArgs.push(...shopIds);}
 if(productIds.length){listingConditions.push(`product_id IN (${productIds.map(()=>'?').join(',')})`);listingArgs.push(...productIds);}
 const listings=listingConditions.length?await db.prepare(`SELECT id FROM listings WHERE ${listingConditions.join(' OR ')}`).all(...listingArgs):[];
 const listingIds=listings.map(row=>row.id);
 const allIds=[...ownerIds,...adminIds,...shopIds,...productIds,...listingIds];
 return withTransaction(db,async tx=>{
  // Child rows must be cleared before their parent shop/product/user rows.
  if(listingIds.length){await tx.prepare(`DELETE FROM listing_events WHERE listing_id IN (${listingIds.map(()=>'?').join(',')})`).run(...listingIds);await tx.prepare(`DELETE FROM reports WHERE listing_id IN (${listingIds.map(()=>'?').join(',')})`).run(...listingIds);}
  if(shopIds.length){
   await tx.prepare(`DELETE FROM offer_history WHERE offer_id IN (SELECT id FROM offers WHERE shop_id IN (${shopIds.map(()=>'?').join(',')}))`).run(...shopIds);
   await tx.prepare(`DELETE FROM offers WHERE shop_id IN (${shopIds.map(()=>'?').join(',')})`).run(...shopIds);
   await tx.prepare(`DELETE FROM catalog_requests WHERE shop_id IN (${shopIds.map(()=>'?').join(',')})`).run(...shopIds);
   await tx.prepare(`DELETE FROM reviews WHERE shop_id IN (${shopIds.map(()=>'?').join(',')})`).run(...shopIds);
   await tx.prepare(`DELETE FROM shop_counts WHERE shop_id IN (${shopIds.map(()=>'?').join(',')})`).run(...shopIds);
  }
  if(ownerIds.length)await tx.prepare(`DELETE FROM catalog_requests WHERE user_id IN (${ownerIds.map(()=>'?').join(',')})`).run(...ownerIds);
  if(listingIds.length)await tx.prepare(`DELETE FROM listings WHERE id IN (${listingIds.map(()=>'?').join(',')})`).run(...listingIds);
  if(shopIds.length)await tx.prepare(`DELETE FROM shops WHERE id IN (${shopIds.map(()=>'?').join(',')})`).run(...shopIds);
  if(productIds.length)await tx.prepare(`DELETE FROM products WHERE id IN (${productIds.map(()=>'?').join(',')})`).run(...productIds);
  if(ownerIds.length){await tx.prepare(`DELETE FROM sessions WHERE user_id IN (${ownerIds.map(()=>'?').join(',')})`).run(...ownerIds);await tx.prepare(`DELETE FROM users WHERE id IN (${ownerIds.map(()=>'?').join(',')})`).run(...ownerIds);}
  if(adminIds.length){await tx.prepare(`DELETE FROM admin_sessions WHERE admin_id IN (${adminIds.map(()=>'?').join(',')})`).run(...adminIds);await tx.prepare(`DELETE FROM admins WHERE id IN (${adminIds.map(()=>'?').join(',')})`).run(...adminIds);}
  if(allIds.length){
   const ownersAndAdmins=[...ownerIds,...adminIds],targetIds=[...ownerIds,...adminIds,...shopIds,...productIds,...listingIds];
   const clauses=[],args=[];
   if(ownersAndAdmins.length){clauses.push(`actor_id IN (${ownersAndAdmins.map(()=>'?').join(',')})`);args.push(...ownersAndAdmins);}
   if(targetIds.length){clauses.push(`target_id IN (${targetIds.map(()=>'?').join(',')})`);args.push(...targetIds);}
   if(clauses.length)await tx.prepare(`DELETE FROM admin_actions WHERE ${clauses.join(' OR ')}`).run(...args);
  }
  await tx.prepare("DELETE FROM search_logs WHERE query='Phase2Synthetic Persistence Widget'").run();
  return {owners:ownerIds.length,admins:adminIds.length,shops:shopIds.length,products:productIds.length,listings:listingIds.length};
 });
}
