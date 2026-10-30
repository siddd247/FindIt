import {UI,modelCards,categoryLabel,verificationLabel} from './public-content.mjs?v=20261017-buyer-3';
import {shopMapLinks} from './maps.mjs';
import {Icon} from './icons.mjs';
import {selectVariant,initialSelection,compareOffers} from './variant-selection.mjs?v=20261017-buyer-3';
import {CATALOG_CONFIG as config} from './shop-pricing-config.mjs?v=20261017-buyer-3';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n==null?'Price not listed':new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const label=key=>key.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
const active=o=>['available','low_stock'].includes(o.stock_status);
const date=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleDateString('en-IN'):'Not available';
const breadcrumb=items=>'<div class="breadcrumb" role="navigation" aria-label="Breadcrumb">'+items.map(([text,url],i)=>(i?'<span aria-hidden="true">'+Icon('chevron',14)+'</span>':'')+(url?'<a href="'+h(url)+'">'+h(text)+'</a>':'<span aria-current="page">'+h(text)+'</span>')).join('')+'</div>';
export async function mountCatalogue({api,nav,footer,page,entityId}){
 const app=document.querySelector('#app');let data,selection={},chosen,params=new URLSearchParams(location.search),requestId=0;
 const shell=html=>{const main=app.querySelector?.('main.buyer-main'),sec=main?.querySelector?.('section.buyer-page');if(sec){sec.innerHTML=html;}else{app.innerHTML=nav()+'<main id="main" class="buyer-main"><section class="shell buyer-page">'+html+'</section></main>'+footer();}};
 const error=message=>shell('<div role="alert">'+UI.empty('Could not load this page',message,UI.button('Browse products',{href:'/search'}),'alert')+'</div>');
 function selectors(){return data.product.option_axes.map(axis=>{
  const values=axis.values.map(value=>({...value,compatible:data.variants.some(v=>String(v.options[axis.key])===String(value.value)&&Object.entries(selection).filter(([key])=>key!==axis.key).every(([key,selected])=>String(v.options[key])===String(selected)))}));
  const selected=values.find(v=>String(v.value)===String(selection[axis.key]));
  return '<fieldset class="variant-axis"><legend>'+h(axis.label)+(selected?'<span>'+h(selected.label)+'</span>':'')+'</legend>'+(values.length>config.selectorDropdownThreshold?'<select aria-label="'+h(axis.label)+'" data-axis="'+h(axis.key)+'"><option value="">Choose '+h(axis.label)+'</option>'+values.map(v=>'<option value="'+h(String(v.value))+'" '+(String(selection[axis.key])===String(v.value)?'selected':'')+'>'+h(v.label)+'</option>').join('')+'</select>':'<div class="variant-chips">'+values.map(v=>UI.chip(v.label,{selected:String(selection[axis.key])===String(v.value),className:!v.compatible?'adjusts-options':'',attributes:'data-axis="'+h(axis.key)+'" data-value="'+h(String(v.value))+'" '+(!v.compatible?'title="Selecting this option adjusts the other options to an existing configuration"':''),content:config.lastAxes.includes(axis.key)?'<span class="color-swatch" style="background:'+h(globalThis.CSS?.supports?.('color',String(v.value))?v.value:'var(--border)')+'"></span>':''})).join('')+'</div>')+'</fieldset>';
 }).join('');}
 function offerRow(o){
  return '<article class="panel model-offer" data-active="'+active(o)+'"><div class="offer-store"><h3><a href="/shops/'+h(o.shop_id)+'">'+h(o.shop_name)+'</a></h3><p>'+h(o.area||'Area not listed')+'</p>'+UI.stockBadge(o.stock_status)+'</div><div class="offer-quote"><strong class="offer-price">'+h(money(o.price))+'</strong>'+(o.isBestPrice?UI.badge('Best price','best-price'):'')+'</div><div class="offer-actions">'+UI.button('Go to shop',{href:'/shops/'+o.shop_id+'?category='+data.product.category_id,kind:o.isBestPrice?'primary':'',icon:Icon('arrow',16)})+(o.shop_product_url?'<a class="button text-button" href="'+h(o.shop_product_url)+'" target="_blank" rel="noopener noreferrer">Visit shop website '+Icon('external',14)+'</a>':'<button type="button" class="text-button" disabled title="No external shop website has been supplied">Visit shop website</button>')+'</div><div class="offer-detail"><small>Updated '+h(date(o.updated_at))+'</small><small>'+(o.is_seed?'Indicative price \u00b7 Seed/demo stock':'Shop-entered offer')+'</small></div></article>';
 }
 function productPage(){
  const p=data.product;if(!chosen){error('No active configuration is listed for this product.');return;}
  const complete=p.option_axes.every(axis=>Object.hasOwn(selection,axis.key)),matching=data.variants.filter(v=>Object.entries(selection).every(([key,value])=>String(v.options[key])===String(value)));
  const shown=complete?[chosen]:matching.length?matching:data.variants,ids=new Set(shown.map(v=>v.id)),prices=data.offers.filter(o=>ids.has(o.variant_id)&&active(o)).map(o=>o.price),rows=compareOffers(data.offers.filter(o=>o.variant_id===chosen.id));
  const price=prices.length?(complete?money(Math.min(...prices)):money(Math.min(...prices))+' \u2013 '+money(Math.max(...prices))):'No available price listed';
  const variantTitle=p.option_axes.map(axis=>axis.values.find(v=>String(v.value)===String(chosen.options[axis.key]))?.label).filter(Boolean).join(' / ')||'Standard configuration';
  const image=chosen.images?.[0]||p.images?.[0],seed=rows.some(o=>o.is_seed),count=new Set(rows.map(o=>o.shop_id)).size;
  shell(breadcrumb([['Home','/'],[categoryLabel(p.category_id),'/search?category='+p.category_id],...(data.shop?[[data.shop.name,'/shops/'+data.shop.id]]:[]),[p.model_name]])+
   '<div class="product-layout"><header class="product-intro"><span class="eyebrow">'+h(p.brand)+'</span><h1>'+h(p.brand+' '+p.model_name)+'</h1><p class="product-subtitle">'+h(categoryLabel(p.category_id))+(p.release_year?' \u00b7 Released '+h(p.release_year):'')+' \u00b7 '+data.variants.length+' '+(data.variants.length===1?'configuration':'configurations')+'</p><p class="mobile-model-price" aria-live="polite">'+h(price)+'</p></header>'+
   '<div class="model-art">'+(image?'<img src="'+h(image)+'" alt="'+h(p.brand+' '+p.model_name)+'">':'<div class="product-category-art">'+Icon(p.category_id,112)+'<span>'+h(categoryLabel(p.category_id))+'</span></div>')+'</div>'+
   (p.option_axes.length?'<section class="variant-options" aria-label="Product options"><div class="section-heading"><h2>Choose your configuration</h2></div>'+selectors()+'<p class="selection-help">'+Icon('info',16)+'Unavailable combinations adjust to the closest listed configuration.</p></section>':'')+
   '<aside class="comparison-panel" aria-labelledby="comparison-title"><header class="comparison-heading"><span class="eyebrow">'+(data.shop?'AT THIS SHOP':'LOCAL PRICE COMPARISON')+'</span><h2 id="comparison-title">'+(data.shop?'Price and stock at '+h(data.shop.name):'Compare shops')+'</h2><p class="price-caption">'+(complete?'Lowest price':'Price range')+'</p><p class="model-price" aria-live="polite">'+h(price)+'</p><p class="comparison-meta">'+count+' '+(count===1?'shop':'shops')+' \u00b7 '+rows.filter(active).length+' showing available or low stock</p><p class="compared-variant">'+h(variantTitle)+'</p></header><div class="comparison-note">'+Icon('info',16)+'<p>'+(seed?'Seed/demo stock and indicative prices are included. Contact the shop to confirm.':'Shop prices and availability can change. Confirm with the shop before visiting.')+'</p></div><div class="model-offers" role="region" aria-label="Shop price comparison" tabindex="0">'+rows.map(offerRow).join('')+(!rows.length?UI.empty('No offers for this configuration','This shop has not listed this configuration.',UI.button('Compare all shops',{href:'/products/'+p.slug})):'')+'</div></aside>'+
   '<section class="product-specs" aria-labelledby="specs-title"><div class="section-heading"><h2 id="specs-title">Specifications</h2><span class="muted">Selected configuration</span></div><dl>'+Object.entries(chosen.specs).map(([key,value])=>'<div><dt>'+h(label(key))+'</dt><dd>'+h(value??'Not available')+'</dd></div>').join('')+'</dl></section></div>');
 }
 function update(axis,value){
  chosen=selectVariant(data.product,data.variants,{...selection,[axis]:value},axis);if(!chosen)return;selection={...chosen.options};
  const url=new URL(location.href);url.searchParams.delete('variant');for(const item of data.product.option_axes){for(const key of item.keys)url.searchParams.delete(key);url.searchParams.set(item.key,selection[item.key]);}history.replaceState(null,'',url);productPage();
  [...(document.querySelectorAll?.('[data-axis]')||[])].find(el=>el.dataset.axis===axis&&(el.tagName==='SELECT'||String(el.dataset.value)===String(selection[axis])))?.focus({preventScroll:true});
 }
 function shopPage(){
  const s=data.shop,maps=shopMapLinks(s),category=params.get('category')||'';let hours=null;try{hours=typeof s.hours==='string'?JSON.parse(s.hours):s.hours;}catch{}
  const mapButtons=(maps.open?'<a class="button" target="_blank" rel="noopener noreferrer" href="'+h(maps.open)+'">'+Icon('map',17)+'Open in Google Maps</a>':'<button disabled title="Location not available">Open in Google Maps</button>')+(maps.directions?'<a class="button" target="_blank" rel="noopener noreferrer" data-direction="'+h(s.id)+'" href="'+h(maps.directions)+'">'+Icon('nav',17)+'Get directions</a>':'');
  shell(breadcrumb([['All shops','/shops'],[s.name]])+'<header class="retailer-header"><div class="retailer-identity"><span class="retailer-mark">'+Icon('store',36)+'</span><div><span class="eyebrow">STORE CATALOGUE</span><h1>'+h(s.name)+'</h1><p>'+h([s.area,s.pincode].filter(Boolean).join(' \u00b7 '))+'</p></div></div><div class="retailer-actions">'+mapButtons+'</div></header><div class="retailer-facts"><p>'+Icon('pin',18)+'<span>'+h(s.address||'Address not available')+'</span></p><p>'+Icon('clock',18)+'<span>'+(hours?.open&&hours?.close?h(hours.open+' - '+hours.close):'Hours: Not available')+'</span></p><p>'+Icon('phone',18)+'<span>'+(s.phone?'<a href="tel:'+h(s.phone.replace(/[^\d+]/g,''))+'">'+h(s.phone)+'</a>':'Phone: Not available')+'</span></p></div><p class="retailer-evidence">'+Icon('shield',16)+h(verificationLabel(s))+(s.source_url&&/^https:\/\//i.test(s.source_url)?' \u00b7 <a href="'+h(s.source_url)+'" target="_blank" rel="noopener noreferrer">Published source '+Icon('external',14)+'</a>':'')+'</p><div class="retailer-categories" role="navigation" aria-label="Shop categories"><a class="button" href="/shops/'+h(entityId)+'" '+(!category?'aria-current="page"':'')+'>All categories</a>'+data.categories.map(c=>'<a class="button" href="/shops/'+h(entityId)+'?category='+h(c.id)+'" '+(category===c.id?'aria-current="page"':'')+'>'+h(c.name)+'<span>'+c.count+'</span></a>').join('')+'</div><div class="buyer-results-heading"><h2>'+h(data.categoryName||'Products at this shop')+'</h2><span>'+data.models.length+' models</span></div>'+modelCards(data.models,entityId)+(!data.models.length?UI.empty('No products in this category','Choose another category or view all products at this shop.'):'') );
 }
 function searchPage(){
  const select=(name,title,options,all)=>UI.select(title,name,[{value:'',label:all},...options],{value:params.get(name)||''});
  const filters=[...params].filter(([key,value])=>value&&['brand','category','min','max'].includes(key)||value&&key.startsWith('spec.'));
  const wide=globalThis.matchMedia?.('(min-width:1025px)').matches??true;
  shell('<header class="buyer-page-heading"><div><span class="eyebrow">JAMMU ELECTRONICS</span><h1>'+(params.get('q')?'Results for \u201c'+h(params.get('q'))+'\u201d':'Discover electronics')+'</h1><p>Find a model. Choose a configuration. Compare local shops.</p></div>'+UI.button('Browse shops',{href:'/shops',icon:Icon('store',18)})+'</header><form id="catalog-search"><div class="catalog-query">'+Icon('search',22)+UI.input('Search products','q',{value:params.get('q')||'',attributes:'placeholder="Product, brand or configuration" autocomplete="off"'})+UI.button('Search',{type:'submit',kind:'primary'})+'</div><div class="catalog-results-layout"><details class="catalog-filter-panel" '+(wide?'open':'')+'><summary>'+Icon('filter',18)+'Filters'+(filters.length?'<span>'+filters.length+'</span>':'')+Icon('chevron',16)+'</summary><div class="catalog-filter-body">'+select('brand','Brand',data.facets.brands.map(value=>({value,label:value})),'All brands')+select('category','Category',data.facets.categories.map(c=>({value:c.id,label:c.name})),'All categories')+'<fieldset class="price-filter"><legend>Price range (INR)</legend>'+UI.input('Minimum','min',{value:params.get('min')||'',type:'number',attributes:'min="0" placeholder="Any"'})+UI.input('Maximum','max',{value:params.get('max')||'',type:'number',attributes:'min="0" placeholder="Any"'})+'</fieldset>'+Object.entries(data.facets.axes).map(([key,values])=>select('spec.'+key,label(key),values.map(value=>({value,label:value})),'All options')).join('')+'<div class="filter-actions">'+UI.button('Apply filters',{type:'submit',kind:'primary'})+UI.button('Reset filters',{attributes:'data-catalog-reset'})+'</div></div></details><section class="catalog-resultset" aria-label="Product results"><div class="buyer-results-heading"><p role="status"><strong>'+data.total+'</strong> '+(data.total===1?'product':'products')+'</p><span>Lowest price first</span></div>'+(filters.length?'<div class="active-filters">'+filters.map(([key,value])=>UI.button((key==='category'?categoryLabel(value):label(key.replace('spec.',''))+': '+value),{attributes:'data-remove-filter="'+h(key)+'" aria-label="Remove '+h(label(key.replace('spec.','')))+' filter"',icon:Icon('x',14)})).join('')+'</div>':'')+modelCards(data.models)+(data.hasMore?'<div class="load-more-container"><button type="button" id="loadMoreBtn" class="button btn-load-more" data-load-more>Show More Products</button></div>':'')+(!data.total?UI.empty('No products match','Reset the filters or try another model.',UI.button('Reset filters',{attributes:'data-catalog-reset'})):'')+'</section></div></form>');
 }
 async function load(){
  const request=++requestId;shell(UI.skeleton(3,'Loading products'));
  try{
   const route=page==='products'?'models/'+encodeURIComponent(entityId)+(params.get('shop')?'?shop='+encodeURIComponent(params.get('shop')):''):page==='shops'?'catalog-shops/'+encodeURIComponent(entityId)+(params.get('category')?'?category='+encodeURIComponent(params.get('category')):''):'models?'+params;
   const response=await api(route);if(request!==requestId)return;data=response;
   if(page==='products'){
    if(data.archived){shell(breadcrumb([['Home','/'],['No longer listed']])+UI.empty('No longer listed',data.name+' is no longer in the active catalogue.',UI.button('Browse category',{href:'/search?category='+data.category}),'package')+'<div class="buyer-results-heading"><h2>Similar products</h2></div>'+modelCards(data.similar));return;}
    ({chosen,selection}=initialSelection(data.product,data.variants,params));productPage();
   }else if(page==='shops')shopPage();else searchPage();
  }catch(e){if(request===requestId)error(e.message);}
 }
 document.addEventListener('click',e=>{
  const choice=e.target.closest('[data-axis][data-value]');if(choice&&data?.product)update(choice.dataset.axis,choice.dataset.value);
  const remove=e.target.closest('[data-remove-filter]');if(remove){params.delete(remove.dataset.removeFilter);history.replaceState(null,'','/search?'+params);load();}
  if(e.target.closest('[data-load-more]')){
   const btn=e.target.closest('[data-load-more]');
   btn.disabled=true;btn.textContent='Loading...';
   const nextParams=new URLSearchParams(params);
   const nextPage=(data.page||1)+1;
   nextParams.set('page',nextPage);
   nextParams.set('limit',data.limit||12);
   api('models?'+nextParams).then(res=>{
    data.page=res.page;data.hasMore=res.hasMore;data.models.push(...res.models);
    const grid=document.querySelector('.catalog-resultset .catalogue-grid');
    if(grid){
     const temp=document.createElement('div');
     temp.innerHTML=modelCards(res.models);
     grid.append(...temp.firstElementChild.children);
    }
    if(res.hasMore){btn.disabled=false;btn.textContent='Show More Products';}
    else{btn.parentElement?.remove();}
   }).catch(err=>{btn.disabled=false;btn.textContent='Error - Try Again';});
   return;
  }
  if(e.target.closest('[data-catalog-reset]')){params=new URLSearchParams();history.replaceState(null,'','/search');load();}
 });
 document.addEventListener('change',e=>{if(e.target.matches('[data-axis]')&&e.target.value&&data?.product)update(e.target.dataset.axis,e.target.value);});
 document.addEventListener('submit',e=>{if(e.target.id!=='catalog-search')return;e.preventDefault();params=new URLSearchParams([...new FormData(e.target)].filter(([,value])=>value));history.replaceState(null,'','/search?'+params);load();});
 await load();
}
