import {SHOP_PRICING_CONFIG as config} from './shop-pricing-config.mjs?v=20261017-final';

// FNV-1a seed followed by Mulberry32. Constants below belong to the PRNG,
// not to pricing policy. Length-delimited JSON avoids ambiguous pair IDs.
function seeded(...parts) {
 let hash = 2166136261;
 for (const char of JSON.stringify([config.seed, ...parts])) {
  hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
 }
 let value = hash + 0x6D2B79F5;
 value = Math.imul(value ^ value >>> 15, value | 1);
 value ^= value + Math.imul(value ^ value >>> 7, value | 61);
 return ((value ^ value >>> 14) >>> 0) / 4294967296;
}

/** Pure read-time estimates. Input records and their base prices are never mutated.
 * Pass the complete shop universe for consistent tie resolution across views.
 * inStock describes optional simulation only, never observed inventory.
 */
export function getShopPrices(product, shops) {
 const base = product.base_price ?? product.reference_price;
 const valid = typeof base === 'number' && Number.isFinite(base) && base > 0;
 const lower = valid ? Math.ceil(base * config.clamp.min / config.currencyUnit) * config.currencyUnit : 0;
 const upper = valid ? Math.floor(base * config.clamp.max / config.currencyUnit) * config.currencyUnit : 0;
 const category = product.category_id ?? product.category;
 const spread = Object.hasOwn(config.categorySpreads,category) ? config.categorySpreads[category] : config.defaultSpread;
 const personalities = Object.values(config.personalities);
 const day = config.drift.enabled ? new Date().toISOString().slice(0, 10) : '';
 const used = new Set();
 const ordered = [...new Map(shops.map(shop => [String(shop.id), shop])).values()]
  .sort((a, b) => String(a.id).localeCompare(String(b.id)));
 const results = ordered.map(shop => {
  if (!valid || lower > upper) return {shop, price: null, inStock: false, isBestPrice: false};
  const range = personalities[Math.floor(seeded('personality', shop.id) * personalities.length)];
  const shopFactor = range[0] + seeded('factor', shop.id) * (range[1] - range[0]);
  const jitter = 1 + (seeded('pair', product.id, shop.id) * 2 - 1) * spread;
  const drift = config.drift.enabled ? 1 + (seeded('day', product.id, shop.id, day) * 2 - 1) * config.drift.spread : 1;
  const ending = config.endings[Math.floor(seeded('ending', shop.id) * config.endings.length)];
  const whole = Math.round(base * shopFactor * jitter * drift / config.currencyUnit) * config.currencyUnit;
  let price = Math.round((whole - ending.offset) / ending.step) * ending.step + ending.offset;
  price = Math.max(lower, Math.min(upper, price));
  // Prefer the smallest possible nudge. Bounds take precedence over ending style.
  if (used.has(price)) {
   for (let distance = config.tieStep; distance <= upper - lower; distance += config.tieStep) {
    const candidate = [price + distance, price - distance].find(n => n >= lower && n <= upper && !used.has(n));
    if (candidate !== undefined) {price = candidate; break;}
   }
  }
  used.add(price);
  return {shop, price, inStock: seeded('stock', product.id, shop.id) >= config.outOfStockRate, isBestPrice: false};
 });
 results.sort((a, b) => Number(b.inStock) - Number(a.inStock) || (a.price ?? Infinity) - (b.price ?? Infinity) || String(a.shop.id).localeCompare(String(b.shop.id)));
 const cheapest = results.find(row => row.inStock && row.price !== null);
 if (cheapest) cheapest.isBestPrice = true;
 return results;
}
