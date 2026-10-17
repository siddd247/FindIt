// Static install branding uses the same default light/Indigo tokens as the interface.
export function themeAssetColors(css){
 const literal=name=>{const value=css.match(new RegExp('--'+name+':\\s*(#[a-fA-F0-9]{6})\\s*;'))?.[1];if(!value)throw Error('Missing branding token: '+name);return value;};
 return {BACKGROUND:literal('background'),ACCENT:literal('accent-light'),ACCENT_CONTRAST:literal('accent-contrast-light')};
}
export function renderThemeAsset(template,colors){return template.replace(/\{\{(BACKGROUND|ACCENT|ACCENT_CONTRAST)\}\}/g,(_,name)=>colors[name]);}
