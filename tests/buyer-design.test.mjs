import test from 'node:test';
import assert from 'node:assert/strict';
import {mountCatalogue} from '../web/catalog-ui.mjs';
import {modelCards} from '../web/public-content.mjs';

function browser(path,{wide=true}={}){
 const saved=Object.fromEntries(['document','location','history','matchMedia','FormData'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)])),events={};let html='';
 globalThis.location=new URL(path,'http://fixture.test');globalThis.history={replaceState:(_a,_b,url)=>globalThis.location=new URL(url,location)};globalThis.matchMedia=()=>({matches:wide});
 globalThis.FormData=class{constructor(form){this.pairs=form.pairs;}[Symbol.iterator](){return this.pairs[Symbol.iterator]();}};
 globalThis.document={querySelector:s=>s==='#app'?{set innerHTML(v){html=v;}}:null,querySelectorAll:()=>[],addEventListener:(type,fn)=>(events[type]??=[]).push(fn)};
 return {html:()=>html,submit:pairs=>{for(const fn of events.submit)fn({target:{id:'catalog-search',pairs},preventDefault(){}});},click:(selector,dataset={})=>{for(const fn of events.click)fn({target:{closest:s=>s===selector?{dataset}:null}});},restore(){for(const [key,d]of Object.entries(saved)){if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key];}}};
}
const tick=()=>new Promise(r=>setTimeout(r,0));
function productData(){
 const variants=[['v1','Small','Black',1000],['v2','Large','Black',2000],['v3','Small','White',1100]].map(([id,size,color,base_price])=>({id,options:{size,color},specs:{size,color},base_price,images:color==='White'?['https://fixture.test/white.jpg']:[]}));
 const product={id:'p',slug:'model',brand:'Fixture',model_name:'Model',category_id:'generic',release_year:2025,default_variant_id:'v1',images:[],option_axes:['size','color'].map(key=>({key,keys:[key],label:key,values:[...new Set(variants.map(v=>v.options[key]))].map(value=>({value,label:value}))}))};
 const offers=variants.flatMap(v=>['available','low_stock','out_of_stock','unavailable'].map((stock_status,i)=>({variant_id:v.id,shop_id:'shop-'+i,shop_name:'Retailer '+i,area:'Jammu',price:v.base_price+[0,50,-100,-200][i],stock_status,is_seed:1,updated_at:'2026-10-17T10:00:00Z'})));
 return {product,variants,offers};
}
test('buyer comparison preserves partial ranges, valid selections, images and eligible Best price',async()=>{
 const b=browser('/products/model?size=Small');try{
  await mountCatalogue({api:async()=>productData(),nav:()=>'',footer:()=>'',page:'products',entityId:'model'});
  assert.match(b.html(),/<aside class="comparison-panel" aria-labelledby="comparison-title">/);assert.match(b.html(),/Price range/);assert.ok(b.html().includes('1,150'));assert.match(b.html(),/role="region" aria-label="Shop price comparison" tabindex="0"/);
  b.click('[data-axis][data-value]',{axis:'color',value:'White'});assert.equal(location.searchParams.get('color'),'White');assert.equal(location.searchParams.get('size'),'Small');assert.ok(b.html().includes('https://fixture.test/white.jpg'));
  b.click('[data-axis][data-value]',{axis:'size',value:'Large'});assert.equal(location.searchParams.get('size'),'Large');assert.equal(location.searchParams.get('color'),'Black');assert.ok(!b.html().includes('white.jpg'));assert.match(b.html(),/Lowest price/);
  assert.equal((b.html().match(/Best price/g)||[]).length,1);assert.ok(b.html().indexOf('Retailer 0')<b.html().indexOf('Retailer 2'));assert.ok(b.html().includes('Seed/demo stock'));assert.doesNotMatch(b.html(),/\\u[\da-f]{4}/i);
 }finally{b.restore();}
});
test('single-variant and shop-specific product views retain their own offers and internal navigation',async()=>{
 for(const single of [false,true]){const b=browser('/products/model?shop=shop-0');try{
  const data=productData();data.shop={id:'shop-0',name:'Retailer 0'};data.offers=data.offers.filter(o=>o.shop_id==='shop-0');if(single){data.variants=[data.variants[0]];data.product.option_axes=[];}
  const routes=[];await mountCatalogue({api:async route=>{routes.push(route);return data;},nav:()=>'',footer:()=>'',page:'products',entityId:'model'});
  assert.equal(routes[0],'models/model?shop=shop-0');assert.equal((b.html().match(/class="panel model-offer"/g)||[]).length,1);assert.ok(b.html().includes('/shops/shop-0?category=generic'));assert.match(b.html(),/Price and stock at Retailer 0/);
  if(single)assert.ok(!b.html().includes('Choose your configuration'));else{b.click('[data-axis][data-value]',{axis:'size',value:'Large'});assert.equal(location.searchParams.get('shop'),'shop-0');}
 }finally{b.restore();}}
});
const model=name=>({id:name,slug:name,name:'Fixture '+name,model_name:name,brand:'Fixture',category_id:'generic',images:[],shop_count:3,variants_count:2,from_price:1000});
const results=(name='')=>({models:name?[model(name)]:[],total:name?1:0,facets:{brands:['Fixture','Other'],categories:[{id:'generic',name:'Generic'}],axes:{color:['Black','White']}}});
test('mobile filters submit every criterion, ignore stale responses, and remove/reset without reloading',async()=>{
 const b=browser('/search',{wide:false}),pending=[];let initial=true;try{
  await mountCatalogue({api:route=>{if(initial){initial=false;return Promise.resolve(results());}return new Promise(resolve=>pending.push({route,resolve}));},nav:()=>'',footer:()=>'',page:'search'});
  assert.match(b.html(),/<details class="catalog-filter-panel" >/);
  b.submit([['q','Earlier'],['brand','Fixture'],['min','100'],['max','5000'],['spec.color','White']]);
  let query=new URLSearchParams(pending[0].route.split('?')[1]);assert.equal(query.get('spec.color'),'White');assert.equal(query.get('min'),'100');assert.equal(query.get('max'),'5000');
  b.submit([['q','Latest'],['brand','Other'],['spec.color','Black']]);pending[1].resolve(results('Latest'));await tick();assert.match(b.html(),/>Latest<\/a>/);
  pending[0].resolve(results('Earlier'));await tick();assert.doesNotMatch(b.html(),/>Earlier<\/a>/);
  b.click('[data-remove-filter]',{removeFilter:'brand'});query=new URLSearchParams(pending[2].route.split('?')[1]);assert.equal(query.has('brand'),false);assert.equal(query.get('q'),'Latest');assert.equal(query.get('spec.color'),'Black');pending[2].resolve(results('Latest'));await tick();
  b.click('[data-catalog-reset]');assert.equal(location.pathname,'/search');assert.equal(location.search,'');assert.equal(pending[3].route,'models?');pending[3].resolve(results('Reset'));await tick();assert.match(b.html(),/>Reset<\/a>/);
 }finally{b.restore();}
});
test('shop/category and archived views keep sourced details, missing values and real model suggestions',async()=>{
 for(const archived of [false,true]){const b=browser(archived?'/products/legacy':'/shops/retailer?category=generic');try{
  const data=archived?{archived:true,name:'Legacy model',category:'generic',similar:[model('Related')]}:{shop:{id:'retailer',name:'Fixture retailer',area:'Jammu',address:'Supplied address',city:'Jammu',phone:null,hours:null,verification_status:'listing_found'},categories:[{id:'generic',name:'Generic',count:1}],models:[model('Listed')],categoryName:'Generic'};
  const routes=[];await mountCatalogue({api:async route=>{routes.push(route);return data;},nav:()=>'',footer:()=>'',page:archived?'products':'shops',entityId:archived?'legacy':'retailer'});
  if(archived){assert.match(b.html(),/No longer listed/);assert.ok(b.html().includes('/products/Related'));assert.ok(b.html().includes('/search?category=generic'));}
  else{assert.equal(routes[0],'catalog-shops/retailer?category=generic');assert.ok(b.html().includes('Hours: Not available'));assert.ok(b.html().includes('Phone: Not available'));assert.ok(b.html().includes('data-direction="retailer"'));assert.ok(b.html().includes('/products/Listed?shop=retailer'));assert.ok(b.html().includes('aria-current="page">Generic'));}
 }finally{b.restore();}}
});
test('discovery cards show one model with honest art fallback, shop count and options',()=>{
 const html=modelCards([model('Distinct')],'retailer');assert.equal((html.match(/class="panel catalogue-card"/g)||[]).length,1);assert.ok(html.includes('/products/Distinct?shop=retailer'));assert.ok(html.includes('3 shops'));assert.ok(html.includes('2 options'));assert.ok(html.includes('1,000'));assert.doesNotMatch(html,/<img|checkout|payment|cart/i);
});
