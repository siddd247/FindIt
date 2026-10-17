// Blocking head script: select attributes before stylesheets or application rendering.
(() => {
 const root=document.documentElement;
 const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
 const write=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const media=globalThis.matchMedia?.('(prefers-color-scheme: dark)');
 const validMode=value=>['light','dark','system'].includes(value)?value:'system';
 let mode=validMode(read('theme')),accent=read('nearby-accent')||'indigo',accents=[];
 if(!/^[a-z][a-z0-9-]*$/.test(accent))accent='indigo';
 function apply(){
  root.dataset.theme=mode==='system'?(media?.matches?'dark':'light'):mode;
  root.dataset.themeMode=mode;root.dataset.accent=accent;
  if(root.style)root.style.colorScheme=root.dataset.theme;
 }
 function discover(){
  accents=[];
  for(const sheet of document.styleSheets||[]){
   if(!sheet.href?.split('?')[0].endsWith('/tokens.css'))continue;
   try{for(const rule of sheet.cssRules){const key=rule.selectorText?.match(/\[data-accent="([a-z][a-z0-9-]*)"\]/)?.[1],label=rule.style?.getPropertyValue('--theme-label').trim().replace(/^['"]|['"]$/g,'');if(key&&label)accents.push({key,label});}}catch{}
  }
  if(accents.length&&!accents.some(item=>item.key===accent))accent='indigo';
 }
 function sync(){
  for(const select of document.querySelectorAll?.('[data-theme-mode]')||[])select.value=mode;
  for(const button of document.querySelectorAll?.('[data-theme-accent]')||[])button.setAttribute('aria-pressed',String(button.dataset.themeAccent===accent));
  // Resolve through an actual property: custom properties can still contain var().
  if(document.body&&globalThis.getComputedStyle){const color=getComputedStyle(document.body).backgroundColor;if(color)document.querySelector('meta[name=theme-color]')?.setAttribute('content',color);}
 }
 function set(next={}){
  if(next.mode!==undefined){mode=validMode(next.mode);write('theme',mode);}
  if(next.accent!==undefined&&accents.some(item=>item.key===next.accent)){accent=next.accent;write('nearby-accent',accent);}
  apply();sync();
 }
 function control(icon=''){
  if(!accents.length)discover();
  const choices=accents.length?accents:[{key:'indigo',label:'Indigo'}];
  return '<details class="theme-picker"><summary aria-label="Appearance settings">'+icon+'<span class="theme-picker-label">Appearance</span></summary><div class="theme-picker-panel"><strong>Appearance</strong><label>Color mode<select data-theme-mode aria-label="Color mode">'+[['light','Light'],['dark','Dark'],['system','System']].map(([key,label])=>'<option value="'+key+'" '+(mode===key?'selected':'')+'>'+label+'</option>').join('')+'</select></label><div class="theme-accent-group" role="group" aria-label="Accent color">'+choices.map(item=>'<button type="button" data-theme-accent="'+escape(item.key)+'" data-accent="'+escape(item.key)+'" aria-pressed="'+(accent===item.key)+'"><span class="theme-accent-dot" aria-hidden="true"></span>'+escape(item.label)+'</button>').join('')+'</div><small>Saved on this browser. System follows your device.</small></div></details>';
 }
 apply();
 globalThis.NearbyTheme=Object.freeze({set,control,get:()=>({mode,accent,resolved:root.dataset.theme})});
 document.addEventListener('DOMContentLoaded',()=>{discover();apply();sync();});
 document.addEventListener('change',e=>{if(e.target.matches?.('[data-theme-mode]'))set({mode:e.target.value});});
 document.addEventListener('click',e=>{
  const choice=e.target.closest?.('[data-theme-accent]');if(choice)set({accent:choice.dataset.themeAccent});
  for(const picker of document.querySelectorAll?.('.theme-picker[open]')||[])if(!picker.contains(e.target))picker.open=false;
 });
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;for(const picker of document.querySelectorAll?.('.theme-picker[open]')||[]){picker.open=false;picker.querySelector('summary')?.focus();}});
 media?.addEventListener?.('change',()=>{if(mode==='system'){apply();sync();}});
 globalThis.addEventListener?.('storage',e=>{if(e.key!==null&&!['theme','nearby-accent'].includes(e.key))return;mode=validMode(read('theme'));accent=read('nearby-accent')||'indigo';discover();apply();sync();});
})();
