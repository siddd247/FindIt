// Local SVG artwork. All symbols share a 24px grid and the same optical weight.
// Decorative graphics are paired with text or a labelled interactive wrapper.
const artwork={
 pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.75"/>',
 search:'<circle cx="10.75" cy="10.75" r="7.25"/><path d="m16 16 5 5"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
 up:'<path d="M6 18 18 6M6 6h12v12"/>',
 back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
 check:'<path d="m5 12 4.5 4.5L19 7"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
 shield:'<path d="M12 3 4.5 6v5.5c0 4.5 4 7.7 7.5 9.5 3.5-1.8 7.5-5 7.5-9.5V6Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
 store:'<path d="m3 8 2-5h14l2 5v1a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V8ZM4 12v9h16v-9M9 21v-7h6v7M3 8h18"/>',
 phone:'<path d="m8 3 2 4-2.5 2.5a15 15 0 0 0 7 7L17 14l4 2v3a2 2 0 0 1-2.2 2C10.4 20.1 3.9 13.6 3 5.2A2 2 0 0 1 5 3Z"/>',
 phones:'<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10 5h4M11 18.5h2"/>',
 audio:'<path d="M4 13v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="11" width="4.5" height="9" rx="2"/><rect x="16.5" y="11" width="4.5" height="9" rx="2"/>',
 laptops:'<rect x="4" y="3.5" width="16" height="12" rx="1.5"/><path d="m4 15.5-2.5 4a1 1 0 0 0 .9 1.5h19.2a1 1 0 0 0 .9-1.5l-2.5-4M9 18h6"/>',
 chargers:'<path d="M9 2.5V7m6-4.5V7M7 7h10v5a5 5 0 0 1-10 0ZM12 17v2a2.5 2.5 0 0 0 5 0v-1.5"/>',
 appliances:'<rect x="3.5" y="2.5" width="17" height="19" rx="2"/><path d="M3.5 7.5h17M7 5h.01M10 5h.01"/><circle cx="12" cy="14.5" r="4.5"/><path d="M8 13.5c2.5-2 5.5 2 8 0"/>',
 tablets:'<rect x="4" y="2.5" width="16" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
 watches:'<rect x="6" y="6" width="12" height="12" rx="3"/><path d="m8 6 1-4h6l1 4m-8 12 1 4h6l1-4M12 9v3l2 1m4-3h1"/>',
 desktops:'<rect x="2" y="4" width="13" height="11" rx="1.5"/><path d="M8.5 15v5M5 20h7"/><rect x="18" y="3" width="4" height="18" rx="1"/><path d="M20 7h.01m0 3h.01"/>',
 monitors:'<rect x="2.5" y="3.5" width="19" height="13" rx="2"/><path d="M12 16.5V21m-4 0h8"/>',
 tv:'<rect x="2.5" y="6" width="19" height="14" rx="2"/><path d="m8 2 4 4 4-4M8 22h8"/>',
 accessories:'<path d="M8 8H6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-2M9 5h6v6H9Z M11 2v3m2-3v3M6 14h.01m3 0h.01m3 0h.01m3 0h.01m3 0h.01M8 17h8"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
 moon:'<path d="M20.5 13a8.5 8.5 0 0 1-9.5-9.5A8.5 8.5 0 1 0 20.5 13Z"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
 nav:'<path d="m3 10 18-7-7 18-3-8Z"/>',
 list:'<path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01"/>',
 map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16m6-14v16"/>',
 filter:'<path d="M3 6h4m4 0h10M3 12h10m4 0h4M3 18h4m4 0h10"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
 x:'<path d="m6 6 12 12M6 18 18 6"/>',
 refresh:'<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5m-4 8a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 minus:'<path d="M5 12h14"/>',
 locate:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>',
 alert:'<path d="m10.3 4-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z M12 9v4m0 4h.01"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 package:'<path d="m12 3 9 5v9l-9 5-9-5V8ZM3 8l9 5 9-5M12 13v9M7.5 5.5l9 5"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
 download:'<path d="M12 3v13m-5-5 5 5 5-5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
 logout:'<path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4M9 12h12m-5-5 5 5-5 5"/>',
 external:'<path d="M14 3h7v7m-10 3L21 3M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
 edit:'<path d="m15 5 4 4M4 20l4-1 13-13a2.8 2.8 0 0 0-4-4L4 15ZM13 20h8"/>',
 trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
 top:'<path d="M12 20V4m-6 6 6-6 6 6"/>',
 chevron:'<path d="m6 9 6 6 6-6"/>'
};
export const iconNames=Object.freeze(Object.keys(artwork));
export function Icon(name,size=20){
 const key=Object.hasOwn(artwork,name)?name:'info';
 const pixels=typeof size==='number'&&Number.isFinite(size)?Math.max(12,Math.min(64,size)):20;
 return `<svg class="icon" data-icon="${key}" focusable="false" aria-hidden="true" width="${pixels}" height="${pixels}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${artwork[key]}</svg>`;
}
