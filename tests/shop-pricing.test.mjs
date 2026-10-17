import test from 'node:test';
import assert from 'node:assert/strict';
import {getShopPrices} from '../web/shop-pricing.mjs';
import {SHOP_PRICING_CONFIG as config} from '../web/shop-pricing-config.mjs?v=20261017-shop-prices';
import {simulationSearchMatches,shopAssignmentContent} from '../web/simulation.mjs';

const shops=Array.from({length:32},(_,i)=>({id:'shop-'+i,name:'Shop '+i,area:'Jammu'}));
const product={id:'product-001',category_id:'phones',base_price:80000,reference_price:80000,reference_currency:'INR',name:'Fixture variant'};

test('same input and reordered shops give identical prices without changing base records',()=>{
 const original=structuredClone(product),directory=structuredClone(shops);
 const first=getShopPrices(product,shops);
 assert.deepEqual(first,getShopPrices(product,shops));
 assert.deepEqual(first,getShopPrices(product,[...shops].reverse()));
 assert.deepEqual(product,original);assert.deepEqual(shops,directory);
 assert.equal(config.drift.enabled,false);assert.equal(config.outOfStockRate,0);
});

test('different shops get distinct sorted estimates and one best-price badge for the same exact variant',()=>{
 const rows=getShopPrices(product,shops);
 assert.equal(new Set(rows.map(row=>row.price)).size,shops.length);
 assert.equal(rows.filter(row=>row.isBestPrice).length,1);
 assert.equal(rows[0].isBestPrice,true);
 assert.ok(rows.every((row,i)=>!i||row.price>=rows[i-1].price));
 const data={available:true,total:32,shops,summary:{approval:{status:'admin_approved',stock_confirmed:false}},rows:shops.map(shop=>({shop,product}))};
 const html=simulationSearchMatches(data,new URLSearchParams({product:product.id}),{limit:32});
 assert.match(html,/Lowest estimated price/);assert.match(html,/Best price/);
 assert.equal((html.match(/class="badge best-price"/g)||[]).length,1);
 assert.equal((html.match(/class="panel simulated-shop-card"/g)||[]).length,32);
 const bestShop=rows[0].shop.id;
 const detail=shopAssignmentContent({...data,rows:[{shop:rows[0].shop,product}]},new URLSearchParams({shop:bestShop}));
 assert.match(detail,/Best price/);
 const formatted=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(rows[0].price);
 assert.ok(detail.includes(formatted));assert.ok(html.includes(formatted));
});

test('all prices stay within configured clamps across categories and cheap/expensive bases',()=>{
 for(const category of [...Object.keys(config.categorySpreads),'unknown-category']){
  for(const base of [10,99,499,1000,19999,80000,500000,1399.75]){
   const result=getShopPrices({id:'p-'+base,category,base_price:base},shops);
   assert.ok(result.every(row=>Number.isInteger(row.price)&&row.price>=base*config.clamp.min&&row.price<=base*config.clamp.max));
  }
 }
 for(const base of [null,undefined,NaN,Infinity,0,-10,'1000'])assert.ok(getShopPrices({id:'invalid',base_price:base},shops).every(row=>row.price===null&&!row.isBestPrice));
 const old=config.outOfStockRate;try{config.outOfStockRate=1;assert.ok(getShopPrices(product,shops).every(row=>!row.inStock&&!row.isBestPrice));}finally{config.outOfStockRate=old;}
});
