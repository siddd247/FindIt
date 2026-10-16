export function validMapsUrl(value) {
  try { const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password&&(url.hostname==='maps.app.goo.gl'||(['www.google.com','google.com','maps.google.com'].includes(url.hostname)&&url.pathname.startsWith('/maps')))?url.href:null; }
  catch {return null;}
}
export function shopMapLinks(shop) {
  if(shop.sample)return {open:null,directions:null,reason:'Sample location — do not visit'};
  const place=validMapsUrl(shop.google_maps_place_url);
  const address=typeof shop.address==='string'?shop.address.trim():'';
  const query=[shop.name,address,shop.city||'Jammu',shop.pincode].filter(Boolean).join(' ');
  return {open:place||(address?(validMapsUrl(shop.google_maps_url)||'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query)):null),directions:address?'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent([shop.name,address,shop.pincode].filter(Boolean).join(' ')):null,reason:address||place?'':'Location not available'};
}
