import {UI} from './public-content.mjs?v=20261017-components-2';
import {ownerWorkspaceView} from './shop-workspace-view.mjs';
import {shopApprovalNotice} from './shop-status.mjs';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let disposePrevious;
export async function mountShopModels({api,nav,footer,register=false,compressImage}){
 disposePrevious?.();const root=document.querySelector('#app');let data,shopId='',message='',errorMessage='',addingShop=register,query='',category='',page=1,saving=false,dirty=false,variantRequest=0,loading=false;const listeners=[];const on=(target,type,fn)=>{target.addEventListener(type,fn);listeners.push(()=>target.removeEventListener?.(type,fn));};
 const shell=html=>root.innerHTML=nav()+'<main id="main"><section class="shell section workspace shop-model-workspace">'+html+'</section></main>'+footer();
 function render(){shell(ownerWorkspaceView(data,{shopId,message,error:errorMessage,addingShop,query,category,page}));}
 async function load(){if(loading)return;loading=true;shell(UI.skeleton(2,'Loading your shop offers'));try{data=await api('shop/catalog');if(!data.shops.some(s=>s.id===shopId))shopId=data.shops[0]?.id||'';errorMessage='';dirty=false;render();}catch(error){shell('<h1>Could not load your shop</h1><p role="alert">'+h(error.message)+'</p><button data-shop-refresh>Try again</button><a class="button" href="/owner">Sign in again</a>');}finally{loading=false;}}
 async function syncStatus(){if(!shopId||saving||loading||document.hidden)return;try{const result=await api('shop/status?shop='+encodeURIComponent(shopId)),old=data.shops.find(s=>s.id===shopId);if(!old)return;if(old.status!==result.shop.status||old.review_reason!==result.shop.review_reason||old.rejection_reason!==result.shop.rejection_reason){Object.assign(old,result.shop);if(dirty){const notice=document.querySelector('.shop-approval');if(notice)notice.outerHTML=shopApprovalNotice(old);}else await load();}}catch{if(!dirty)await load();}}
 const markDirty=e=>{const form=e.target.closest?.('form[id^="shop-model-"]');if(form&&form.id!=='shop-model-filter')dirty=true;};on(document,'input',markDirty);on(document,'change',markDirty);
 on(document,'change',async e=>{
  if(e.target.id==='shop-model-select'){if(dirty&&!confirm('Discard unsaved edits and switch shops?')){e.target.value=shopId;return;}shopId=e.target.value;variantRequest++;query='';category='';page=1;dirty=false;render();}
  if(e.target.id==='shop-model-product'){
   const version=++variantRequest,product=e.target.value,variant=document.getElementById('shop-model-variant'),status=document.getElementById('shop-model-variant-status');variant.disabled=true;variant.innerHTML='<option value="">Loading variants...</option>';status.textContent='';if(!product){variant.innerHTML='<option value="">Choose a model first</option>';return;}
   try{const result=await api('shop/variants?shop='+encodeURIComponent(shopId)+'&product='+encodeURIComponent(product));if(version!==variantRequest)return;variant.innerHTML=result.variants.map(v=>'<option value="'+h(v.id)+'">'+h(Object.values(v.options).join(' / ')||Object.values(v.specs).join(' / ')||'Standard configuration')+'</option>').join('');variant.disabled=!result.variants.length;if(!result.variants.length)status.textContent='This product has no approved variants yet.';}catch(error){if(version!==variantRequest)return;variant.innerHTML='<option value="">Unable to load variants</option>';status.textContent=error.message;}
  }
 });
 on(document,'click',async e=>{
  const button=e.target.closest('button');if(!button)return;
  try{
   if(button.hasAttribute('data-shop-refresh')){if(dirty&&!confirm('Refresh and discard unsaved edits?'))return;await load();return;}
   if(button.hasAttribute('data-shop-add')){if(dirty&&!confirm('Discard unsaved edits and register another shop?'))return;dirty=false;addingShop=true;render();return;}
   if(button.hasAttribute('data-shop-cancel-register')){if(dirty&&!confirm('Discard this unfinished registration?'))return;addingShop=false;dirty=false;render();return;}
   if(button.hasAttribute('data-shop-filter-reset')){if(dirty&&!confirm('Discard unsaved edits and reset filters?'))return;dirty=false;query='';category='';page=1;render();return;}
   if(button.dataset.shopPage){if(dirty&&!confirm('Discard unsaved edits and change page?'))return;dirty=false;page=Math.max(1,Number(button.dataset.shopPage)||1);render();return;}
   if(button.hasAttribute('data-shop-resubmit')){if(!confirm('Submit your corrected listing for another review? It will remain hidden until approved.'))return;button.disabled=true;await api('shop-resubmit',{shop_id:shopId});message='Your shop is back in the review queue. Inventory remains saved.';await load();return;}
   if(button.dataset.offerHistory){button.disabled=true;const d=await api('shop/history?offer='+encodeURIComponent(button.dataset.offerHistory));document.getElementById('history-'+button.dataset.offerHistory).innerHTML='<p>Current price: INR '+h(d.offer.price)+'</p>'+d.history.map(r=>'<p>INR '+h(r.price)+' ? '+h(r.stock_status)+' ? '+h(new Date(r.created_at).toLocaleString('en-IN'))+(r.is_seed?' ? Seed/demo':'')+'</p>').join('');}
  }catch(error){errorMessage=error.message;render();}finally{button.disabled=false;}
 });
 on(document,'submit',async e=>{
  const form=e.target;if(!form.id.startsWith('shop-model-'))return;e.preventDefault();
  if(form.id==='shop-model-filter'){if(dirty&&!confirm('Discard unsaved edits and apply filters?'))return;const values=new FormData(form);query=values.get('q')||'';category=values.get('category')||'';page=1;dirty=false;render();return;}
  if(saving)return;saving=true;message='';errorMessage='';const button=form.querySelector('button:not([type]),button[type=submit]');if(button)button.disabled=true;form.setAttribute('aria-busy','true');
  try{
   const fields=new FormData(form),values=Object.fromEntries(fields);
   if(form.id==='shop-model-register'||form.id==='shop-model-details'){
    delete values.photo;values.categories=fields.getAll('categories');const file=form.elements.photo?.files?.[0];
    if(file){if(!compressImage)throw Error('Image processing is unavailable. Reload and try again.');const asset=await api('upload',{image:await compressImage(file)});const previous=data.shops.find(s=>s.id===shopId);let photos=[];try{photos=JSON.parse(previous?.photos||'[]');}catch{}values.photos=[asset.url,...photos].slice(0,4);}
    const result=await api(form.id==='shop-model-register'?'shops':'shop-details',{...values,...(form.id==='shop-model-details'?{shop_id:shopId}:{})});shopId=result.shop.id;addingShop=false;message=form.id==='shop-model-register'?'Shop submitted for review. You can add inventory immediately.':'Shop details saved.';
   }
   if(form.id.startsWith('shop-model-offer-')||form.id==='shop-model-add-offer'){await api('shop/offer',{...values,shop_id:shopId,variant_id:form.dataset.variant||values.variant_id});message='Price and stock saved.';}
   if(form.id==='shop-model-import'){const file=form.elements.csv.files[0];if(!file)throw Error('Select a CSV file.');const result=await api('shop/import',{shop_id:shopId,csv:await file.text()});message=result.imported+' offers imported.';}
   if(form.id==='shop-model-request'){const specs={};for(const line of values.specs.split('\n').filter(line=>line.trim())){const at=line.indexOf(':');if(at<1)throw Error('Enter each specification as name: value.');specs[line.slice(0,at).trim().toLowerCase().replaceAll(' ','_')]=line.slice(at+1).trim();}await api('shop/request',{kind:values.kind,shop_id:shopId,payload:{brand:values.brand,model_name:values.model_name,category_id:values.category_id,product_id:values.product_id,base_price:values.base_price?Number(values.base_price):null,specs}});message='Request sent for administrator review.';}
   dirty=false;await load();
  }catch(error){const target=form.querySelector('.form-error');if(target){target.textContent=error.message;target.tabIndex=-1;target.focus();}else{errorMessage=error.message;render();}}finally{saving=false;form.setAttribute('aria-busy','false');if(button)button.disabled=false;}
 });
 let timer;if(typeof window!=='undefined'){on(window,'focus',syncStatus);on(document,'visibilitychange',()=>{if(!document.hidden)void syncStatus();});timer=setInterval(syncStatus,15000);}
 disposePrevious=()=>{for(const remove of listeners)remove();if(timer)clearInterval(timer);};
 if(typeof window!=='undefined')on(window,'pagehide',event=>{if(!event.persisted)disposePrevious();});
 await load();
}
