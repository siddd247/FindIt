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
function runtime({stored={},blocked=false}={}){
 const events={},windowEvents={},storage=new Map(Object.entries(stored)),root={dataset:{},style:{}},toggle={attrs:{},setAttribute(k,v){this.attrs[k]=v;}},meta={setAttribute(k,v){meta[k]=v;}};
 const document={documentElement:root,body:{},styleSheets:[],querySelector:()=>meta,querySelectorAll:selector=>selector==='[data-theme-toggle]'?[toggle]:[],addEventListener:(type,fn)=>{events[type]=fn;}};
 const ctx={document,getComputedStyle:()=>({backgroundColor:'computed-background'}),addEventListener:(type,fn)=>{windowEvents[type]=fn;},localStorage:{getItem:key=>{if(blocked)throw Error('Blocked');return storage.get(key)??null;},setItem:(key,value)=>{if(blocked)throw Error('Blocked');storage.set(key,value);}}};
 runInNewContext(source,ctx);return {ctx,events,windowEvents,storage,root,toggle,meta};
}
test('appearance is a persistent light/dark toggle with one fixed blue accent',()=>{
 for(const mode of ['light','dark']){const r=runtime({stored:{theme:mode,'nearby-accent':'aqua-9df4f4'}});assert.equal(r.root.dataset.theme,mode);assert.equal(r.root.dataset.accent,'blue-0755db');r.events.DOMContentLoaded();assert.equal(r.toggle.attrs['aria-label'],'Switch to '+(mode==='dark'?'light':'dark')+' mode');r.events.click({target:{closest:selector=>selector==='[data-theme-toggle]'?r.toggle:null}});assert.equal(r.root.dataset.theme,mode==='dark'?'light':'dark');assert.equal(r.storage.get('theme'),mode==='dark'?'light':'dark');}
 for(const stored of [{},{theme:'invalid'}]){const r=runtime({stored,blocked:true});assert.doesNotThrow(()=>r.events.DOMContentLoaded());assert.doesNotThrow(()=>r.ctx.NearbyTheme.set({mode:'dark'}));assert.equal(r.root.dataset.theme,'dark');}
});
test('appearance renders a single toggle and syncs cross-tab mode changes',()=>{
 const r=runtime();r.events.DOMContentLoaded();const markup=r.ctx.NearbyTheme.control('<svg></svg>');assert.match(markup,/data-theme-toggle/);assert.doesNotMatch(markup,/data-theme-accent|data-theme-mode|<select/);
 r.storage.set('theme','dark');r.storage.set('nearby-accent','aqua-9df4f4');r.windowEvents.storage({key:'theme'});assert.equal(r.root.dataset.theme,'dark');assert.equal(r.root.dataset.accent,'blue-0755db');
});const luminance=color=>{let rgb,alpha=1;if(color.startsWith('#'))rgb=color.slice(1).match(/../g).map(v=>parseInt(v,16));else{const values=color.match(/[\d.]+/g).map(Number);rgb=values.slice(0,3);alpha=values[3]??1;}const channels=rgb.map(v=>(v*alpha+119*(1-alpha))/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
test('all mode/accent palettes meet AA text and control contrast; colors have a single source',()=>{
 const light=blocks.find(b=>b.selector===':root').values,dark=blocks.find(b=>b.selector===':root[data-theme=dark]').values;
 assert.match(readFileSync('web/styles.css','utf8'),/#app>main\{background:var\(--content-shader\)\}/);assert.match(readFileSync('web/buyer.css','utf8'),/\.discovery-hero\{background:transparent/);assert.match(readFileSync('web/buyer.css','utf8'),/\.topbar\{background:linear-gradient\(180deg,var\(--navbar-bg\) 0%,var\(--content-shader\) 100%\)/);
 for(const mode of ['light','dark'])for(const a of accentBlocks){const p={...light,...(mode==='dark'?dark:{}),...a.values};const resolve=key=>p[key].replace(/var\((--[\w-]+)\)/g,(_,v)=>resolve(v));
  for(const surface of ['--background','--surface','--surface-raised','--surface-muted'])for(const fg of ['--text','--text-muted'])assert.ok(contrast(resolve(fg),resolve(surface))>=4.5,mode+' '+fg+'/'+surface);
  for(const state of ['success','warning','danger','unavailable']){assert.ok(contrast(resolve('--'+state),resolve('--'+state+'-surface'))>=4.5,mode+' '+state);assert.ok(contrast(resolve('--'+state+'-border'),resolve('--'+state+'-surface'))>=3,mode+' '+state+' border');}
  for(const state of ['accent','accent-hover'])assert.ok(contrast(resolve('--accent-contrast'),resolve('--'+state))>=4.5,mode+' '+state);
  for(const surface of ['--surface','--surface-raised','--background'])assert.ok(contrast(resolve('--accent'),resolve(surface))>=4.5,mode+' accent text');
  assert.ok(contrast(resolve('--accent'),resolve('--accent-surface'))>=4.5,mode+' accent selected');assert.ok(contrast(resolve('--control-border'),resolve('--surface'))>=3,mode+' control border');
  assert.notEqual(resolve('--danger-surface'),resolve('--unavailable-surface'));
 }
 for(const file of ['web/styles.css','web/components.css','web/buyer.css','web/workspace.css','web/admin.css','web/theme.js','web/app.js','web/admin.mjs','web/catalog-ui.mjs','web/index.html','web/manifest.webmanifest'])assert.doesNotMatch(readFileSync(file,'utf8'),/#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(/i,file);
 const assets=themeAssetColors(css);assert.equal(JSON.parse(renderThemeAsset(readFileSync('web/manifest.webmanifest','utf8'),assets)).theme_color,assets.ACCENT);
 const logo=renderThemeAsset(readFileSync('web/icon.svg','utf8'),assets);assert.match(logo,/<svg[^>]+width="1254"[^>]+height="1254"/);assert.equal((logo.match(/<path\b/g)||[]).length,69);
});
test('self-hosted Inter, theme assets and public/admin pages are served by the local runtime',async t=>{
 const dir=makeTestDirectory(path.resolve('.local/theme-test-')),port=await freePort(),base='http://127.0.0.1:'+port,proc=spawn(process.execPath,['local/server.mjs'],{env:{...process.env,LOCAL_DATA_DIR:dir,PORT:String(port)},windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});let errors='';proc.stderr.on('data',chunk=>{errors+=chunk;});t.after(async()=>{await stopServer(proc);assert.equal(errors,'');});
 await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Startup')),10000);proc.stdout.on('data',chunk=>{if(String(chunk).includes('running at')){clearTimeout(timeout);resolve();}});proc.once('error',reject);});
 for(const page of ['/','/search','/shops','/owner','/join','/control','/about']){const r=await fetch(base+page);assert.equal(r.status,200);const html=await r.text();assert.ok(html.indexOf('/theme.js')<html.indexOf('/tokens.css'));assert.ok(html.includes('/tokens.css'));assert.ok(html.includes('/workspace.css?v=20261017-workspace-4'));assert.ok(html.includes('/admin.css?v=20261017-bg-contrast-1'));assert.match(html,/<title>[^<]*Nearbuy/);assert.match(html,/<meta property="og:site_name" content="Nearbuy">/);assert.doesNotMatch(html,/\{\{BACKGROUND\}\}/);}
 for(const asset of ['/workspace.css','/admin.css']){const response=await fetch(base+asset);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/css/);}
 for(const face of ['Regular','SemiBold','Bold']){const r=await fetch(base+'/fonts/Inter-'+face+'.ttf');assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/font\/ttf/);const b=Buffer.from(await r.arrayBuffer()),original=readFileSync('web/fonts/Inter-'+face+'.ttf');assert.equal(b.readUInt32BE(0),0x10000);assert.equal(createHash('sha256').update(b).digest('hex'),createHash('sha256').update(original).digest('hex'));}
 const png=await fetch(base+'/logo.png');assert.equal(png.status,200);assert.match(png.headers.get('content-type'),/image\/png/);assert.deepEqual(Buffer.from(await png.arrayBuffer()),readFileSync('web/logo.png'));
 const backdrop=await fetch(base+'/dark-background.png');assert.equal(backdrop.status,200);assert.match(backdrop.headers.get('content-type'),/image\/png/);assert.deepEqual(Buffer.from(await backdrop.arrayBuffer()),readFileSync('web/dark-background.png'));assert.match(css,/:root\[data-theme=dark\][\s\S]*--page-background-image:[^;]*url\('\/dark-background\.png'\)/);
 const lightBackdrop=await fetch(base+'/light-background-2.png');assert.equal(lightBackdrop.status,200);assert.match(lightBackdrop.headers.get('content-type'),/image\/png/);assert.deepEqual(Buffer.from(await lightBackdrop.arrayBuffer()),readFileSync('web/light-background-2.png'));assert.match(css,/:root\s*\{[\s\S]*--page-background-image:[^;]*url\('\/light-background-2\.png'\)/);
 const servedTokens=await(await fetch(base+'/tokens.css')).text();assert.ok(servedTokens.includes('--theme-label:"#0755db"')&&servedTokens.includes('--theme-swatch:#0755db;'));assert.equal(accentBlocks.length,1);
 const servedLogo=await(await fetch(base+'/icon.svg')).text(),manifest=await(await fetch(base+'/manifest.webmanifest')).json();assert.match(servedLogo,/<svg[^>]+width="1254"/);assert.equal(manifest.name,'Nearbuy');assert.equal(manifest.short_name,'Nearbuy');assert.equal(manifest.theme_color,themeAssetColors(css).ACCENT);
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
