// Blocking head script: select attributes before stylesheets or application rendering.
(() => {
 const root=document.documentElement;
 const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
 const write=(key,value)=>{try{localStorage.setItem(key,value);}catch{}};
 const validMode=value=>['light','dark'].includes(value)?value:'light';
 const accent='blue-0755db';
 let mode=validMode(read('theme'));
 function apply(){
  root.dataset.theme=mode;
  root.dataset.themeMode=mode;root.dataset.accent=accent;
  if(root.style)root.style.colorScheme=root.dataset.theme;
 }
 function sync(){
  for(const button of document.querySelectorAll?.('[data-theme-toggle]')||[]){const next=mode==='dark'?'light':'dark';button.setAttribute('aria-label','Switch to '+next+' mode');button.setAttribute('title','Switch to '+next+' mode');}
  // Resolve through an actual property: custom properties can still contain var().
  if(document.body&&globalThis.getComputedStyle){const color=getComputedStyle(document.body).backgroundColor;if(color)document.querySelector('meta[name=theme-color]')?.setAttribute('content',color);}
 }
 function set(next={}){
  if(next.mode!==undefined){mode=validMode(next.mode);write('theme',mode);}
  else {mode=mode==='dark'?'light':'dark';write('theme',mode);}
  apply();sync();
 }
 function control(icon=''){
  return '<button type="button" class="theme-picker" data-theme-toggle aria-label="Switch to '+(mode==='dark'?'light':'dark')+' mode" title="Switch to '+(mode==='dark'?'light':'dark')+' mode">'+icon+'<span class="theme-picker-label">Appearance</span></button>';
 }
 apply();
 globalThis.NearbyTheme=Object.freeze({set,control,get:()=>({mode,accent,resolved:root.dataset.theme})});
 document.addEventListener('DOMContentLoaded',()=>{apply();sync();});
 document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-theme-toggle]'))set();
 });
 globalThis.addEventListener?.('storage',e=>{if(e.key!==null&&e.key!=='theme')return;mode=validMode(read('theme'));apply();sync();});
})();
