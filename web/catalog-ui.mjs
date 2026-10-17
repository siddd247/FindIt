import {modelCards} from './public-content.mjs?v=20261017-models';
import {shopMapLinks} from './maps.mjs';
import {Icon} from './icons.mjs';
import {selectVariant,initialSelection,compareOffers} from './variant-selection.mjs?v=20261017-models';
import {CATALOG_CONFIG as config} from './shop-pricing-config.mjs?v=20261017-models';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n==null?'Price not listed':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const label=key=>key.replaceAll('_',' ');
const statusLabel={available:'Available',low_stock:'Low stock',out_of_stock:'Out of stock',unavailable:'Unavailable',unknown:'Check with shop'};
export async function mountCatalogue({api,nav,footer,page,entityId}){
 const app=document.querySelector('#app');let data,selection={},chosen,params=new URLSearchParams(location.search),busy=false;
 const shell=html=>{app.innerHTML=nav()+'<main id="main"><section class="shell section model-page">'+html+'</section></main>'+footer();};
 const error=message=>shell('<h1>Could not load this page</h1><p role="alert">'+h(message)+'</p><a class="button" href="/search">Browse products</a>');
 function productPage(){
  const p=data.product,complete=p.option_axes.every(axis=>Object.hasOwn(selection,axis.key));
  const matching=data.variants.filter(v=>Object.entries(selection).every(([key,value])=>String(v.options[key])===String(value)));
  const shown=complete?[chosen]:matching.length?matching:data.variants,ids=new Set(shown.map(v=>v.id));
  const prices=data.offers.filter(o=>ids.has(o.variant_id)&&['available','low_stock'].includes(o.stock_status)).map(o=>o.price);
  const rows=compareOffers(data.offers.filter(o=>o.variant_id===chosen.id));
  const price=prices.length?(complete?money(Math.min(...prices)):money(Math.min(...prices))+' – '+money(Math.max(...prices))):'No available price listed';
  shell('<div class="breadcrumb"><a href="/">Home</a><span>›</span><a href="/search?category='+h(p.category_id)+'">'+h(label(p.category_id))+'</a>'+(data.shop?'<span>›</span><a href="/shops/'+h(data.shop.id)+'">'+h(data.shop.name)+'</a>':'')+'</div><div class="model-detail"><div class="model-art">'+((chosen.images?.[0]||p.images?.[0])?'<img src="'+h(chosen.images?.[0]||p.images[0])+'" alt="'+h(p.brand+' '+p.model_name)+'">':Icon(p.category_id,100))+'</div><div><span class="eyebrow">'+h(p.brand)+'</span><h1>'+h(p.brand+' '+p.model_name)+'</h1><p class="model-price" aria-live="polite">'+(complete?'Lowest price: ':'Price range: ')+h(price)+'</p><p class="muted">'+data.variants.length+' '+(data.variants.length===1?'configuration':'configurations')+(data.shop?' · Prices at '+h(data.shop.name):'')+'</p>'+p.option_axes.map(axis=>{
   const values=axis.values.map(value=>{const compatible=data.variants.some(v=>String(v.options[axis.key])===String(value.value)&&Object.entries(selection).filter(([key])=>key!==axis.key).every(([key,selected])=>String(v.options[key])===String(selected)));return {...value,compatible};});
   return '<fieldset class="variant-axis"><legend>'+h(axis.label)+'</legend>'+(axis.values.length>config.selectorDropdownThreshold?'<select aria-label="'+h(axis.label)+'" data-axis="'+h(axis.key)+'"><option value="">Choose '+h(axis.label)+'</option>'+values.map(v=>'<option value="'+h(v.value)+'" '+(String(selection[axis.key])===String(v.value)?'selected':'')+'>'+h(v.label)+'</option>').join('')+'</select>':'<div class="variant-chips">'+values.map(v=>'<button type="button" data-axis="'+h(axis.key)+'" data-value="'+h(v.value)+'" aria-pressed="'+(String(selection[axis.key])===String(v.value))+'" class="'+(!v.compatible?'adjusts-options':'')+'" '+(!v.compatible?'title="Selecting this option adjusts the other options to an existing configuration"':'')+'>'+(config.lastAxes.includes(axis.key)?'<span class="color-swatch" style="background:'+h(globalThis.CSS?.supports?.('color',String(v.value))?v.value:'var(--line)')+'"></span>':'')+h(v.label)+'</button>').join('')+'</div>')+'</fieldset>';
  }).join('')+'</div></div><section class="section"><h2>'+(data.shop?'Price and stock at '+h(data.shop.name):'Compare shops')+'</h2><p class="muted">'+h(Object.values(chosen.specs).slice(0,4).join(' · '))+'</p><div class="model-offers">'+rows.map(o=>'<article class="panel model-offer"><div><h3><a href="/shops/'+h(o.shop_id)+'">'+h(o.shop_name)+'</a></h3><p class="muted">'+h(o.area)+'</p><span class="badge '+(o.stock_status==='available'?'in_stock':o.stock_status==='low_stock'?'low_stock':'stale')+'">'+h(statusLabel[o.stock_status])+'</span></div><div><strong class="offer-price">'+h(money(o.price))+'</strong>'+(o.isBestPrice?'<span class="badge best-price">Best price</span>':'')+'<small>Last updated '+h(new Date(o.updated_at).toLocaleDateString('en-IN'))+'</small><small>'+(o.is_seed?'Seed/demo stock · indicative price':'Shop-entered offer')+'</small></div><div><a class="button primary" href="/shops/'+h(o.shop_id)+'?category='+h(p.category_id)+'">Go to shop '+Icon('arrow',17)+'</a><button disabled title="No external shop website has been supplied">Visit shop website</button></div></article>').join('')+(!rows.length?'<p>No offers for this configuration at the selected shop. <a href="/products/'+h(p.slug)+'">Compare all shops</a></p>':'')+'</div></section><section class="panel"><h2>Specifications</h2><dl>'+Object.entries(chosen.specs).map(([key,value])=>'<dt>'+h(label(key))+'</dt><dd>'+h(value)+'</dd>').join('')+'</dl></section>');
 }
 function update(axis,value){
  const requested={...selection,[axis]:value};chosen=selectVariant(data.product,data.variants,requested,axis);selection={...chosen.options};
  const url=new URL(location.href);url.searchParams.delete('variant');for(const item of data.product.option_axes){for(const key of item.keys)url.searchParams.delete(key);url.searchParams.set(item.key,selection[item.key]);}history.replaceState(null,'',url);productPage();document.querySelector('[data-axis="'+axis+'"]')?.focus();
 }
 async function load(){
  busy=true;shell('<p role="status">Loading products…</p>');
  try{
   if(page==='products'){
    data=await api('models/'+encodeURIComponent(entityId)+(params.get('shop')?'?shop='+encodeURIComponent(params.get('shop')):''));
    if(data.archived){shell('<h1>No longer listed</h1><p>'+h(data.name)+' is no longer in the active catalogue.</p><h2>Similar products</h2>'+modelCards(data.similar)+'<a class="button" href="/search?category='+h(data.category)+'">Browse category</a>');return;}
    ({chosen,selection}=initialSelection(data.product,data.variants,params));productPage();
   }else if(page==='shops'){
    data=await api('catalog-shops/'+encodeURIComponent(entityId)+(params.get('category')?'?category='+encodeURIComponent(params.get('category')):''));
    shell('<div class="breadcrumb"><a href="/shops">All shops</a><span>›</span><span>'+h(data.shop.name)+'</span></div><h1>'+h(data.shop.name)+'</h1><p>'+h(data.shop.address||data.shop.area)+'</p><div class="chips"><a class="button" href="/shops/'+h(entityId)+'">All categories</a>'+data.categories.map(c=>'<a class="button" href="/shops/'+h(entityId)+'?category='+h(c.id)+'">'+h(c.name)+' ('+c.count+')</a>').join('')+'</div><h2>'+h(data.categoryName||'Products at this shop')+'</h2>'+modelCards(data.models,entityId));
   }else{
    data=await api('models?'+params);
    shell('<h1>Find your next product</h1><form id="catalog-search" class="panel catalog-filters"><label>Search products<input name="q" value="'+h(params.get('q')||'')+'" placeholder="Product, brand or configuration"></label><label>Brand<select name="brand"><option value="">All brands</option>'+data.facets.brands.map(b=>'<option '+(params.get('brand')===b?'selected':'')+'>'+h(b)+'</option>').join('')+'</select></label><label>Category<select name="category"><option value="">All categories</option>'+data.facets.categories.map(c=>'<option value="'+h(c.id)+'" '+(params.get('category')===c.id?'selected':'')+'>'+h(c.name)+'</option>').join('')+'</select></label><label>Minimum price<input name="min" type="number" min="0" value="'+h(params.get('min')||'')+'"></label><label>Maximum price<input name="max" type="number" min="0" value="'+h(params.get('max')||'')+'"></label>'+Object.entries(data.facets.axes).map(([key,values])=>'<label>'+h(label(key))+'<select name="spec.'+h(key)+'"><option value="">All options</option>'+values.map(v=>'<option '+(params.get('spec.'+key)===v?'selected':'')+'>'+h(v)+'</option>').join('')+'</select></label>').join('')+'<button class="primary">Apply filters</button><button type="button" data-catalog-reset>Reset filters</button></form><p role="status">'+data.total+' products</p>'+modelCards(data.models)+(!data.total?'<p>No products match. Reset the filters or try another model.</p>':''));
   }
  }catch(e){error(e.message);}finally{busy=false;}
 }
 document.addEventListener('click',e=>{const choice=e.target.closest('[data-axis][data-value]');if(choice&&data?.product)update(choice.dataset.axis,choice.dataset.value);if(e.target.closest('[data-catalog-reset]')){params=new URLSearchParams();history.replaceState(null,'','/search');load();}});
 document.addEventListener('change',e=>{if(e.target.matches('[data-axis]')&&e.target.value&&data?.product)update(e.target.dataset.axis,e.target.value);});
 document.addEventListener('submit',e=>{if(e.target.id!=='catalog-search')return;e.preventDefault();params=new URLSearchParams([...new FormData(e.target)].filter(([,value])=>value));history.replaceState(null,'','/search?'+params);if(!busy)load();});
 await load();
}
