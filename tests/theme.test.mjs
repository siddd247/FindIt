import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {themeAssetColors,renderThemeAsset} from '../local/theme-assets.mjs';
import {makeTestDirectory,freePort,stopServer} from './helpers/runtime.mjs';

const css=readFileSync('web/tokens.css','utf8'),source=readFileSync('web/theme.js','utf8');
const blocks=[...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].map(m=>({selector:m[1].trim(),values:Object.fromEntries([...m[2].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(v=>[v[1],v[2].trim()]))}));
const accentBlocks=blocks.filter(b=>b.values['--theme-label']);
function runtime({stored={},dark=false,blocked=false,extra=[]}={}){
 const events={},mediaEvents={},windowEvents={},storage=new Map(Object.entries(stored)),root={dataset:{},style:{}},select={value:''},buttons=[],picker={open:true,contains:t=>t?.inside,querySelector:()=>({focus(){picker.focused=true;}})},meta={setAttribute(k,v){meta[k]=v;}};
 const media={matches:dark,addEventListener:(type,fn)=>{mediaEvents[type]=fn;}};
 const document={documentElement:root,body:{},styleSheets:[{href:'http://fixture.test/tokens.css?v=1',cssRules:[...accentBlocks.map(b=>({selectorText:b.selector,style:{getPropertyValue:key=>b.values[key]||''}})),...extra]}],querySelector:()=>meta,querySelectorAll:selector=>selector==='[data-theme-mode]'?[select]:selector==='[data-theme-accent]'?buttons:selector==='.theme-picker[open]'&&picker.open?[picker]:[],addEventListener:(type,fn)=>{events[type]=fn;}};
 const ctx={document,matchMedia:()=>media,getComputedStyle:()=>({backgroundColor:'computed-background'}),addEventListener:(type,fn)=>{windowEvents[type]=fn;},localStorage:{getItem:key=>{if(blocked)throw Error('Blocked');return storage.get(key)??null;},setItem:(key,value)=>{if(blocked)throw Error('Blocked');storage.set(key,value);}}};
 runInNewContext(source,ctx);return {ctx,events,mediaEvents,windowEvents,storage,root,select,buttons,picker,meta,media};
}
test('appearance initializes before CSS, persists all six combinations and follows System only',()=>{
 for(const mode of ['light','dark'])for(const accent of ['indigo','emerald','amber']){
  const r=runtime({stored:{theme:mode,'nearby-accent':accent},dark:mode!=='dark'});assert.equal(r.root.dataset.theme,mode);assert.equal(r.root.dataset.accent,accent);r.events.DOMContentLoaded();assert.equal(r.ctx.NearbyTheme.get().mode,mode);
  r.ctx.NearbyTheme.set({mode,accent});assert.equal(r.storage.get('theme'),mode);assert.equal(r.storage.get('nearby-accent'),accent);
 }
 const r=runtime({dark:true});assert.equal(r.root.dataset.theme,'dark');assert.equal(r.root.dataset.themeMode,'system');r.events.DOMContentLoaded();r.media.matches=false;r.mediaEvents.change();assert.equal(r.root.dataset.theme,'light');r.ctx.NearbyTheme.set({mode:'dark'});r.mediaEvents.change();assert.equal(r.root.dataset.theme,'dark');
 for(const stored of [{},{theme:'invalid','nearby-accent':'invalid theme'}]){const r=runtime({stored,blocked:true});assert.doesNotThrow(()=>r.events.DOMContentLoaded());assert.doesNotThrow(()=>r.ctx.NearbyTheme.set({mode:'dark',accent:'emerald'}));assert.equal(r.root.dataset.theme,'dark');}
});
test('appearance controls share handlers, support new token blocks, Escape and cross-tab preferences',()=>{
 const extra={selectorText:':root[data-accent="ocean"]',style:{getPropertyValue:key=>key==='--theme-label'?'"Ocean"':''}},r=runtime({extra:[extra]});r.events.DOMContentLoaded();assert.match(r.ctx.NearbyTheme.control(),/Ocean/);
 r.events.change({target:{matches:()=>true,value:'dark'}});assert.equal(r.select.value,'dark');
 const choice={dataset:{themeAccent:'ocean'},inside:true};r.events.click({target:{inside:true,closest:()=>choice}});assert.equal(r.storage.get('nearby-accent'),'ocean');assert.equal(r.meta.content,'computed-background');
 r.events.keydown({key:'Escape'});assert.equal(r.picker.open,false);assert.equal(r.picker.focused,true);
 r.picker.open=true;r.events.click({target:{closest:()=>null}});assert.equal(r.picker.open,false);
 r.storage.set('theme','light');r.storage.set('nearby-accent','amber');r.windowEvents.storage({key:'theme'});assert.equal(r.root.dataset.theme,'light');assert.equal(r.root.dataset.accent,'amber');
});
const luminance=hex=>{const channels=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('all mode/accent palettes meet AA text and control contrast; colors have a single source',()=>{
 const light=blocks.find(b=>b.selector===':root').values,dark=blocks.find(b=>b.selector===':root[data-theme=dark]').values;
 for(const mode of ['light','dark'])for(const a of accentBlocks){const p={...light,...(mode==='dark'?dark:{}),...a.values};const resolve=key=>p[key].replace(/var\((--[\w-]+)\)/g,(_,v)=>resolve(v));
  for(const surface of ['--background','--surface','--surface-raised','--surface-muted'])for(const fg of ['--text','--text-muted'])assert.ok(contrast(resolve(fg),resolve(surface))>=4.5,mode+' '+fg+'/'+surface);
  for(const state of ['success','warning','danger','unavailable']){assert.ok(contrast(resolve('--'+state),resolve('--'+state+'-surface'))>=4.5,mode+' '+state);assert.ok(contrast(resolve('--'+state+'-border'),resolve('--'+state+'-surface'))>=3,mode+' '+state+' border');}
  for(const state of ['accent','accent-hover'])assert.ok(contrast(resolve('--accent-contrast'),resolve('--'+state))>=4.5,mode+' '+state);
  for(const surface of ['--surface','--surface-raised','--background'])assert.ok(contrast(resolve('--accent'),resolve(surface))>=4.5,mode+' accent text');
  assert.ok(contrast(resolve('--accent'),resolve('--accent-surface'))>=4.5,mode+' accent selected');assert.ok(contrast(resolve('--control-border'),resolve('--surface'))>=3,mode+' control border');
  assert.notEqual(resolve('--danger-surface'),resolve('--unavailable-surface'));
 }
 for(const file of ['web/styles.css','web/components.css','web/buyer.css','web/workspace.css','web/admin.css','web/theme.js','web/app.js','web/admin.mjs','web/catalog-ui.mjs','web/index.html','web/icon.svg','web/manifest.webmanifest'])assert.doesNotMatch(readFileSync(file,'utf8'),/#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i,file);
 const assets=themeAssetColors(css);assert.equal(JSON.parse(renderThemeAsset(readFileSync('web/manifest.webmanifest','utf8'),assets)).theme_color,assets.ACCENT);
 assert.match(renderThemeAsset(readFileSync('web/icon.svg','utf8'),assets),new RegExp(assets.ACCENT));
});
test('self-hosted Inter, theme assets and public/admin pages are served by the local runtime',async t=>{
 const dir=makeTestDirectory(path.resolve('.local/theme-test-')),port=await freePort(),base='http://127.0.0.1:'+port,proc=spawn(process.execPath,['local/server.mjs'],{env:{...process.env,LOCAL_DATA_DIR:dir,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});let errors='';proc.stderr.on('data',chunk=>{errors+=chunk;});t.after(async()=>{await stopServer(proc);assert.equal(errors,'');});
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Startup')),10000);proc.stdout.on('data',chunk=>{if(String(chunk).includes('running at')){clearTimeout(timeout);resolve();}});proc.once('error',reject);});
 for(const page of ['/','/search','/shops','/owner','/join','/control','/about']){const r=await fetch(base+page);assert.equal(r.status,200);const html=await r.text();assert.ok(html.indexOf('/theme.js')<html.indexOf('/tokens.css'));assert.ok(html.includes('/tokens.css'));assert.ok(html.includes('/workspace.css?v=20261017-workspace-4'));assert.ok(html.includes('/admin.css?v=20261017-admin-5'));assert.doesNotMatch(html,/\{\{BACKGROUND\}\}/);}
 for(const asset of ['/workspace.css','/admin.css']){const response=await fetch(base+asset);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/css/);}
 for(const face of ['Regular','SemiBold','Bold']){const r=await fetch(base+'/fonts/Inter-'+face+'.ttf');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/font\/ttf/);const b=Buffer.from(await r.arrayBuffer()),original=readFileSync('web/fonts/Inter-'+face+'.ttf');assert.equal(b.readUInt32BE(0),0x10000);assert.equal(createHash('sha256').update(b).digest('hex'),createHash('sha256').update(original).digest('hex'));}
 assert.match(await(await fetch(base+'/tokens.css')).text(),/--theme-label:"Amber"/);
 assert.doesNotMatch(await(await fetch(base+'/icon.svg')).text(),/\{\{/);assert.equal((await(await fetch(base+'/manifest.webmanifest')).json()).theme_color,themeAssetColors(css).ACCENT);
 assert.equal((await(await fetch(base+'/api/runtime')).json()).features.themeTokens,true);
 assert.equal((await(await fetch(base+'/api/runtime')).json()).features.adminDesign,true);
});
test('buyer offers render four distinct stock states and exclude inactive shops from Best price',async()=>{
 const saved=Object.fromEntries(['document','location'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
 try{
  let html='';globalThis.document={querySelector:()=>({set innerHTML(value){html=value;}}),addEventListener(){}};globalThis.location=new URL('http://fixture.test/products/model');
  const {mountCatalogue}=await import('../web/catalog-ui.mjs');
  const data={product:{id:'p',slug:'model',brand:'Fixture',model_name:'Model',category_id:'generic',option_axes:[],default_variant_id:'v',images:[]},variants:[{id:'v',options:{},specs:{},images:[]}],offers:['out_of_stock','unavailable','low_stock','available'].map((stock_status,i)=>({variant_id:'v',shop_id:'s'+i,shop_name:'Fixture '+i,area:'Jammu',price:100+i,stock_status,updated_at:new Date().toISOString(),is_seed:1}))};
  await mountCatalogue({api:async()=>data,nav:()=>'',footer:()=>'',page:'products',entityId:'model'});
  for(const state of ['out_of_stock','unavailable','low_stock','in_stock'])assert.ok(html.includes('class="badge '+state+'"'),state);
  assert.equal((html.match(/Best price/g)||[]).length,1);assert.ok(html.indexOf('Fixture 2')<html.indexOf('Fixture 0'));
 }finally{for(const [key,descriptor]of Object.entries(saved)){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
});
