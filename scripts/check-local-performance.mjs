import {writeFileSync} from 'node:fs';
const base='http://127.0.0.1:'+(process.env.PORT||3000),results=[];
for(const route of ['/','/app.js','/api/catalogue','/api/shops','/api/search?category=phones']){
 const times=[];let bytes=0;for(let i=0;i<20;i++){const start=performance.now(),r=await fetch(base+route);if(!r.ok)throw Error(route+' '+r.status);bytes=(await r.arrayBuffer()).byteLength;times.push(performance.now()-start);}times.sort((a,b)=>a-b);results.push({route,requests:times.length,p50_ms:+times[9].toFixed(2),p95_ms:+times[18].toFixed(2),bytes});
}
const report={checked_at:new Date().toISOString(),environment:'Local loopback HTTP, Node 24, warm requests; not browser paint, physical 4G or Lighthouse. Category search has no query and does not create search-log rows.',results};writeFileSync('.local/performance.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
