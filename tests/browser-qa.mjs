import {spawn} from 'node:child_process';
import {writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const edge='C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const profile=path.resolve('.local/browser-qa-'+Date.now());mkdirSync(profile,{recursive:true});
const proc=spawn(edge,['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9224','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;
try{
 let pages;for(let i=0;i<80;i++){try{pages=await (await fetch('http://127.0.0.1:9224/json')).json();if(pages.length)break;}catch{}await new Promise(r=>setTimeout(r,150));}if(!pages?.length)throw new Error('Installed Edge could not start with browser automation.');
 ws=new WebSocket(pages.find(p=>p.type==='page').webSocketDebuggerUrl);await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});let seq=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const v=JSON.parse(e.data);if(v.id){const p=pending.get(v.id);if(p){pending.delete(v.id);v.error?p.reject(new Error(JSON.stringify(v.error))):p.resolve(v.result);}}if(v.method==='Runtime.exceptionThrown')errors.push(v.params.exceptionDetails.text);};
 function cdp(method,params={}){return new Promise((resolve,reject)=>{const id=++seq;const timeout=setTimeout(()=>{pending.delete(id);reject(new Error('Browser command timed out: '+method));},10000);pending.set(id,{resolve:v=>{clearTimeout(timeout);resolve(v);},reject:e=>{clearTimeout(timeout);reject(e);}});ws.send(JSON.stringify({id,method,params}));});}
 const evaluate=async expression=>(await cdp('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})).result.value;
 await cdp('Page.enable');await cdp('Runtime.enable');
 async function waitFor(expr){for(let i=0;i<80;i++){if(await evaluate(expr))return;await new Promise(r=>setTimeout(r,100));}throw new Error('Page wait timed out: '+expr);}
 for(const width of [320,360,390,768,1024,1366,1440]){
  await cdp('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<781});
  await cdp('Page.navigate',{url:'http://127.0.0.1:3000/'});
  await waitFor('document.querySelectorAll(".category-card").length===11');
  for(const theme of ['light','dark']){
   if(await evaluate('document.documentElement.dataset.theme')!==theme)await evaluate('document.querySelector("[data-action=theme]").click()');
   const checks=await evaluate(`(()=>{const visible=e=>!!(e.offsetWidth||e.offsetHeight);const targets=[...document.querySelectorAll('.nav-actions button,.site-menu summary,.popular button,.searchbox button')].filter(visible);return {width:innerWidth,body:document.documentElement.scrollWidth,categories:[...document.querySelectorAll('.category-art svg')].map(e=>e.dataset.icon),targets:targets.map(e=>({label:e.getAttribute('aria-label')||e.textContent.trim(),width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),inputSize:parseFloat(getComputedStyle(document.querySelector('#product-search')).fontSize),menu:visible(document.querySelector('.site-menu'))};})()`);
   assert.ok(checks.body<=checks.width+1,JSON.stringify(checks));assert.equal(new Set(checks.categories).size,11);assert.ok(checks.targets.every(t=>t.width>=43.5&&t.height>=43.5),JSON.stringify(checks.targets));if(width<=780)assert.ok(checks.inputSize>=16);
   if(width<=1050){assert.ok(checks.menu);await evaluate('document.querySelector(".site-menu summary").click()');assert.equal(await evaluate('document.querySelector(".site-menu").open'),true);assert.equal(await evaluate('[...document.querySelectorAll(".menu-panel a")].length'),5);assert.ok(await evaluate('document.querySelector(".menu-panel").getBoundingClientRect().left>=0'));await evaluate('document.querySelector(".site-menu summary").click()');}
   if(width===360||width===1366){const shot=await cdp('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});writeFileSync(path.resolve(`.local/home-${width}-${theme}.png`),Buffer.from(shot.data,'base64'));}
   console.log('Home: '+width+'px '+theme+', no overflow, distinct categories, accessible touch controls.');
  }
 }
 await cdp('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});await cdp('Page.navigate',{url:'http://127.0.0.1:3000/search?q=iPhone%2018%20Pro'});await waitFor('document.querySelectorAll(".catalogue-card").length>0');assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));assert.ok(await evaluate('[...document.querySelectorAll(".stock-row")].every(r=>r.textContent.includes("Confirmed"))'));if(await evaluate('!!document.querySelector("[data-report]")')){await evaluate('document.querySelector("[data-report]").click()');await waitFor('document.querySelector("dialog").open');assert.equal(await evaluate('document.activeElement.closest("dialog")!==null'),true);await cdp('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await cdp('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});assert.equal(await evaluate('document.querySelector("dialog").open'),false);}const shot=await cdp('Page.captureScreenshot',{format:'png'});writeFileSync(path.resolve('.local/results-360.png'),Buffer.from(shot.data,'base64'));assert.deepEqual(errors,[]);console.log('Catalogue results rendered. Report-dialog focus/Escape checked only when a real listing exists. No browser exceptions.');
}finally{ws?.close();proc.kill();}
