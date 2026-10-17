export function selectVariant(product,variants,requested={},changedKey=null){
 if(!variants.length)return null;
 const direct=variants.find(v=>v.id===requested.variant);if(direct)return direct;
 const axes=product.option_axes;
 const matches=(v,key)=>{if(Object.hasOwn(requested,key))return String(v.options[key])===String(requested[key]);const axis=axes.find(a=>a.key===key);return axis&&axis.keys.every(k=>!Object.hasOwn(requested,k)||String(v.specs[k])===String(requested[k]));};
 let candidates=changedKey?variants.filter(v=>matches(v,changedKey)):variants;
 if(!candidates.length)candidates=variants;
 const score=v=>axes.reduce((sum,axis)=>sum+Number(matches(v,axis.key)),0);
 return [...candidates].sort((a,b)=>score(b)-score(a)||(a.base_price??Infinity)-(b.base_price??Infinity)||a.id.localeCompare(b.id))[0];
}
export function initialSelection(product,variants,params){
 const requested=Object.fromEntries(params),hasSelection=params.has('variant')||product.option_axes.some(axis=>params.has(axis.key)||axis.keys.some(key=>params.has(key)));
 const chosen=hasSelection?selectVariant(product,variants,requested):variants.find(v=>v.id===product.default_variant_id)||variants[0];
 let selection=hasSelection&&!params.has('variant')?Object.fromEntries(product.option_axes.filter(axis=>params.has(axis.key)).map(axis=>[axis.key,params.get(axis.key)])):{...chosen.options};
 for(const axis of product.option_axes)if(!Object.hasOwn(selection,axis.key)&&axis.keys.every(key=>params.has(key)))selection[axis.key]=chosen.options[axis.key];
 if(!variants.some(v=>Object.entries(selection).every(([key,value])=>String(v.options[key])===String(value))))selection={...chosen.options};
 return {chosen,selection};
}
export function compareOffers(offers){
 const rows=offers.map(o=>({...o,isBestPrice:false}));
 const active=o=>['available','low_stock'].includes(o.stock_status);
 rows.sort((a,b)=>Number(!active(a))-Number(!active(b))||a.price-b.price||a.shop_id.localeCompare(b.shop_id));
 const best=rows.find(active);if(best)best.isBestPrice=true;return rows;
}
