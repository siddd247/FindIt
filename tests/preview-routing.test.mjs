import test from 'node:test';
import assert from 'node:assert/strict';

test('legacy preview forwards to the working port, while updated and deployed previews stay on their origin',async()=>{
 const saved=Object.fromEntries(['fetch','location','localStorage','window','document','navigator'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 try{
  let index=0;
  for(const [origin,missing,redirect] of [['http://127.0.0.1:3000',true,true],['http://localhost:3000',true,true],['http://127.0.0.1:3000',false,false],['http://127.0.0.1:3001',false,false],['http://localhost:3001',true,true],['http://127.0.0.1:3002',false,false],['http://localhost:3002',true,true],['http://127.0.0.1:3005',false,false],['http://127.0.0.1:3006',true,true],['http://127.0.0.1:3006',false,false],['http://127.0.0.1:3007',true,true],['http://127.0.0.1:3007',false,false],['http://127.0.0.1:3008',true,true],['http://127.0.0.1:3008',false,false],['https://preview.example.test',true,false]]){
   const app={innerHTML:''},calls=[];let destination=null;
   const location=new URL(origin+'/search?q=MacBook%20M4&category=laptops#matches');location.replace=value=>{destination=value;};
   Object.defineProperty(globalThis,'location',{value:location,writable:true,configurable:true});
   Object.defineProperty(globalThis,'navigator',{value:{onLine:true},configurable:true});
   globalThis.localStorage={getItem:()=>null,setItem(){},removeItem(){}};globalThis.window={addEventListener(){}};
   globalThis.document={documentElement:{dataset:{}},querySelector:s=>s==='#app'?app:null,addEventListener(){}};
   globalThis.fetch=async route=>{calls.push(String(route));const path=String(route).split('?')[0];if(path==='/api/runtime')return Response.json({release:'20261017-final',features:{groupedCatalog:false,themeTokens:true,componentSystem:true,buyerDesign:true}},{status:missing?404:200});if(path==='/api/simulation')return Response.json(missing?{error:'Endpoint not found.'}:{available:false,rows:[]},{status:missing?404:200});if(path==='/shop-pricing.mjs')return new Response(missing?'Not found':'export {};',{status:missing?404:200,headers:{'Content-Type':missing?'text/html':'text/javascript'}});if(path==='/api/session')return Response.json({user:null});if(path==='/api/catalogue')return Response.json([]);if(path==='/api/search')return Response.json({products:[],listings:[],shops:[]});throw Error('Unexpected request '+route);};
   await import('../web/app.js?routing-fixture='+index++);await new Promise(resolve=>setTimeout(resolve,20));
   if(redirect){const expected=new URL(location.href);expected.port='3009';assert.equal(destination,expected.href);assert.deepEqual(calls,['/api/runtime']);assert.equal(app.innerHTML,'');}
   else{assert.equal(destination,null);assert.match(app.innerHTML,/MacBook M4/);assert.ok(calls.some(c=>c.startsWith('/api/search?')));}
  }
 }finally{for(const [key,descriptor] of Object.entries(saved)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
