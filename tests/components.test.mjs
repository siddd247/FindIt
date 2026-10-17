import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {UI} from '../web/public-content.mjs';
import {Icon,iconNames,iconSources,lucideVersion} from '../web/icons.mjs';
import {mountCatalogue} from '../web/catalog-ui.mjs';
import {mountShopModels} from '../web/shop-model-ui.mjs';

test('Lucide renders the licensed snapshot with safe fallbacks, semantic aliases and consistent strokes',()=>{
 const snapshot=JSON.parse(readFileSync('web/vendor/lucide/icon-nodes.json','utf8'));assert.equal(lucideVersion,snapshot.version);
 for(const name of iconNames){const svg=Icon(name,24);assert.match(svg,/aria-hidden="true"/);assert.match(svg,/stroke-width="2"/);assert.ok(svg.includes('data-lucide="'+iconSources[name]+'"'));assert.doesNotMatch(svg,/\bkey="|<script|\bon\w+=/);for(const [,attrs]of snapshot.icons[iconSources[name]])for(const [key,value]of Object.entries(attrs))if(key!=='key')assert.ok(svg.includes(key+'="'+value+'"'));}
 const categoryIcons=['phones','audio','laptops','chargers','appliances','tablets','watches','desktops','monitors','tv','accessories'];assert.equal(new Set(categoryIcons.map(name=>iconSources[name])).size,11);
 for(const name of ['__proto__','constructor','<img onerror=alert(1)>'])assert.equal(Icon(name),Icon('info'));
 assert.match(Icon('search',NaN),/width="20"/);assert.match(Icon('search',Infinity),/width="20"/);assert.match(Icon('search',-1),/width="12"/);assert.match(Icon('search',100),/width="100"/);
});

test('shared fields preserve submitted values and accessible semantics while escaping text',()=>{
 const value='" autofocus onfocus="bad <script>&';
 for(const html of [UI.input(value,'quoted-name',{value}),UI.textarea(value,'notes',{value}),UI.select(value,'stock',[{value,label:value}],{value}),UI.badge(value),UI.chip(value),UI.button(value)]){assert.doesNotMatch(html,/<script>|value="" autofocus/);assert.ok(html.includes('&lt;script&gt;'));}
 const field=UI.input('Price','price',{value:1234,type:'number',attributes:'required min="0.01" step="0.01"'});assert.match(field,/name="price"/);assert.match(field,/value="1234"/);assert.match(field,/required min="0.01" step="0.01"/);
 const password=UI.input('Password','password',{type:'password',id:'secure-field',passwordToggle:true});assert.match(password,/for="secure-field"/);assert.match(password,/aria-controls="secure-field"/);assert.match(password,/data-password-toggle="secure-field"/);
 assert.match(UI.button('Apply',{type:'submit'}),/type="submit"/);assert.match(UI.button('Reset'),/type="button"/);
 assert.match(UI.table(['Store','Price'],'<tr><td>Fixture</td><td>123</td></tr>',{caption:'Shop prices'}),/<th scope="col">Store/);
 assert.match(UI.skeleton(2),/role="status" aria-busy="true"/);assert.equal((UI.skeleton(2).match(/aria-hidden="true"/g)||[]).length,2);
 assert.match(UI.dialog('<h2>Report</h2>'),/data-action="close-modal"/);assert.match(UI.empty('Nothing found','Try another search'),/<h2>Nothing found<\/h2>/);
});

function browser(){
 const saved=Object.fromEntries(['document','location','history'].map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)])),events={};let html='';
 globalThis.location=new URL('http://fixture.test/products/model');globalThis.history={replaceState:(_a,_b,url)=>{globalThis.location=new URL(url,globalThis.location);}};
 globalThis.document={querySelector:selector=>selector==='#app'?{set innerHTML(value){html=value;}}:{focus(){}},addEventListener:(type,fn)=>{(events[type]??=[]).push(fn);}};
 return {events,html:()=>html,restore(){for(const [key,value]of Object.entries(saved)){if(value)Object.defineProperty(globalThis,key,value);else delete globalThis[key];}}};
}
test('shared buyer chips still select valid variants, retain URLs and show four stock states',async()=>{
 const b=browser();try{
  const variants=[{id:'v1',options:{size:'Small',color:'Black'},base_price:1000},{id:'v2',options:{size:'Large',color:'Black'},base_price:2000},{id:'v3',options:{size:'Small',color:'White'},base_price:1100}].map(v=>({...v,specs:v.options,images:[]}));
  const product={id:'p',slug:'model',brand:'Fixture',model_name:'Model',category_id:'generic',default_variant_id:'v1',images:[],option_axes:['size','color'].map(key=>({key,keys:[key],label:key,values:[...new Set(variants.map(v=>v.options[key]))].map(value=>({value,label:value}))}))};
  const data={product,variants,offers:variants.flatMap(v=>['available','low_stock','out_of_stock','unavailable'].map((stock_status,i)=>({variant_id:v.id,shop_id:'s'+i,shop_name:'Shop '+i,area:'Jammu',price:v.base_price+i,stock_status,updated_at:new Date().toISOString()})))};
  await mountCatalogue({api:async()=>data,nav:()=>'',footer:()=>'',page:'products',entityId:'model'});
  const click=(axis,value)=>{for(const fn of b.events.click)fn({target:{closest:selector=>selector==='[data-axis][data-value]'?{dataset:{axis,value}}:null}});};
  click('color','White');click('size','Large');assert.equal(location.searchParams.get('size'),'Large');assert.equal(location.searchParams.get('color'),'Black');
  assert.match(b.html(),/class="chip/);assert.match(b.html(),/data-axis="size" data-value="Large"/);assert.match(b.html(),/aria-pressed="true"/);
  for(const state of ['in_stock','low_stock','out_of_stock','unavailable'])assert.ok(b.html().includes('class="badge '+state+'"'));
  assert.equal((b.html().match(/Best price/g)||[]).length,1);assert.equal((b.html().match(/class="panel model-offer"/g)||[]).length,4);
 }finally{b.restore();}
});
test('shop dashboard shared fields retain offer names and CSV/history actions',async()=>{
 const b=browser();try{
  const data={shops:[{id:'s',name:'Fixture shop'}],models:[{id:'p',brand:'Fixture',model_name:'Model'}],categories:[{id:'generic',name:'Generic'}],offers:[{id:'o',shop_id:'s',variant_id:'v',product_id:'p',brand:'Fixture',model_name:'Model',slug:'model',options:{size:'Small'},price:1234,stock_status:'low_stock',price_rank:'Cheapest',rank:1,competing_shops:1,is_seed:0,shop_product_url:''}]};
  await mountShopModels({api:async()=>data,nav:()=>'',footer:()=>''});const html=b.html();assert.match(html,/class="ui-field"/);assert.match(html,/name="price"[^>]+value="1234"/);assert.match(html,/name="stock_status"/);assert.match(html,/value="low_stock" selected/);assert.match(html,/name="shop_product_url"/);assert.match(html,/data-offer-history="o"/);assert.match(html,/\/api\/shop\/offers.csv\?shop=s/);
 }finally{b.restore();}
});
