// All editable pricing behavior lives here. These are generated estimates, not shop quotes.
export const SHOP_PRICING_CONFIG = {
 seed: 'nearby-shop-prices-v1',
 personalities: {
  discount: [0.96, 0.99],
  average: [0.99, 1.02],
  premium: [1.02, 1.06]
 },
 categorySpreads: {
  phones: 0.02, laptops: 0.015, tv: 0.025, desktops: 0.02,
  tablets: 0.025, monitors: 0.03, appliances: 0.03, watches: 0.03,
  audio: 0.04, chargers: 0.075, accessories: 0.08, cables: 0.08
 },
 defaultSpread: 0.02,
 clamp: {min: 0.85, max: 1.15},
 drift: {enabled: false, spread: 0.01},
 outOfStockRate: 0,
 currencyUnit: 1,
 tieStep: 1,
 endings: [{step: 100, offset: 99}, {step: 100, offset: 0}, {step: 100, offset: 50}]
};

// Catalog structure, selection and seed controls share the pricing configuration.
export const CATALOG_CONFIG = {
 axisOrder: ['storage','ram','connectivity','size','screen_size','chipset','gpu'],
 lastAxes: ['color','colour'],
 configurationKey: 'configuration',
 configurationLabel: 'Configuration',
 defaultVariant: 'cheapest_base_price',
 selectorDropdownThreshold: 8,
 similarProductLimit: 6,
 priceSanity: SHOP_PRICING_CONFIG.clamp,
 seed: 'nearby-college-stock-v1',
 stockDistribution: {available:0.55,low_stock:0.20,out_of_stock:0.15,unavailable:0.10},
 stockOrder: ['available','low_stock','out_of_stock','unavailable','unknown'],
 signatureLength: 24,
 slugSignatureLength: 8
};
