const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const own = (value, key) => Object.hasOwn(value, key);
const authorityFields = ['status', 'approval_status', 'verification_status', 'owner_id', 'user_id', 'deleted_at', 'verified_at', 'sample'];
export async function ownerShop(db, user, id, { editable = false } = {}) {
  const shop = await db.prepare("SELECT s.* FROM shops s JOIN users u ON u.id=s.owner_id WHERE s.id=? AND s.owner_id=? AND s.deleted_at IS NULL AND u.deleted_at IS NULL AND u.status='active' AND u.role IN ('owner','shop')").get(String(id), user.id);
  if (!shop) fail('You can only manage your own shop.', 403);
  if (editable && !['pending', 'active', 'rejected'].includes(shop.status)) fail('Shop editing is paused. Contact your administrator.', 403);
  return shop;
}
export function rejectShopAuthorityFields(body) {
  if (authorityFields.some(key => own(body, key))) fail('Only an administrator can change approval, verification or ownership.', 403);
}
/** Validate only editable shop fields; never spread request data into database rows. */
export async function shopDetails(db, body, existing = null) {
  rejectShopAuthorityFields(body);
  const values = {};
  for (const [key, max, required] of [['name', 100, true], ['address', 250, true], ['area', 100, true], ['phone', 24, false], ['pincode', 6, false], ['google_maps_place_url', 1500, false]]) {
    if (existing && !own(body, key)) continue;
    const value = body[key];
    if (required && (typeof value !== 'string' || !value.trim())) fail('Please enter a shop ' + key + '.');
    if (value != null && typeof value !== 'string' || typeof value === 'string' && value.length > max) fail('Enter a valid ' + key + '.');
    values[key] = typeof value === 'string' && value.trim() ? value.trim() : null;
  }
  if (values.phone && !/^\+?[\d ()-]{8,20}$/.test(values.phone)) fail('Enter a valid phone or leave it empty.');
  if (values.pincode && !/^\d{6}$/.test(values.pincode)) fail('Enter a six digit pincode.');
  if (values.google_maps_place_url) {
    const { validMapsUrl } = await import('../web/maps.mjs');
    if (!validMapsUrl(values.google_maps_place_url)) fail('Enter a valid Google Maps URL.');
  }
  if (own(body, 'lat') || own(body, 'lng')) {
    const lat = body.lat === '' || body.lat == null ? null : Number(body.lat), lng = body.lng === '' || body.lng == null ? null : Number(body.lng);
    if ((lat === null) !== (lng === null) || lat !== null && (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)) fail('Enter valid coordinates together or leave both empty.');
    Object.assign(values, { lat, lng });
  }
  if (own(body, 'open') || own(body, 'close')) {
    if (!body.open && !body.close) values.hours = null;
    else {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(body.open) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.close) || body.open >= body.close) fail('Use valid same-day opening and closing times.');
      values.hours = JSON.stringify({ open: body.open, close: body.close, closed: [] });
    }
  }
  if (own(body, 'categories')) {
    if (!Array.isArray(body.categories) || body.categories.some(c => typeof c !== 'string')) fail('Choose valid categories.');
    const categories = [...new Set(body.categories)];
    const valid = new Set((await db.prepare('SELECT id FROM categories WHERE deleted_at IS NULL').all()).map(c => c.id));
    if (categories.some(c => !valid.has(c))) fail('Choose valid categories.');
    values.categories = JSON.stringify(categories);
  }
  if (own(body, 'photos')) {
    if (!Array.isArray(body.photos) || body.photos.length > 4 || body.photos.some(p => typeof p !== 'string' || !/^\/uploads\/[a-f0-9-]{36}\.jpg$/i.test(p))) fail('Use up to four uploaded shop photos.');
    values.photos = JSON.stringify(body.photos);
  }
  return values;
}
