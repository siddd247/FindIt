import { config } from './config.ts';
export type Stock = 'in_stock' | 'low_stock' | 'out_of_stock';
export type Listing = { id: string; shop_id: string; product_id: string; status_reported: Stock; last_confirmed_at: string; price_min: number; price_max: number | null; currency: string; negotiable: number; quantity?: number | null; confirmed_by: string; sample: number; };
export type Report = { id?: string; listing_id: string; kind: string; device_hash: string; ip_hash: string; created_at: string; };
export function hoursSince(date: string, now = Date.now()) { const stamp=date?Date.parse(date):NaN;return !Number.isFinite(stamp)||stamp>now+60000?Infinity:Math.max(0,(now-stamp)/3600000); }
export function ago(date: string, now = Date.now()) { const h = hoursSince(date, now); return h < 1 ? `${Math.max(0, Math.floor(h * 60))} min ago` : h < 24 ? `${Math.floor(h)} hr ago` : `${Math.floor(h / 24)} days ago`; }
export function availability(l: Listing, reports: Report[] = [], now = Date.now()) {
  const age = hoursSince(l.last_confirmed_at, now), known=Number.isFinite(age);
  const eligible = reports.filter(r => r.listing_id === l.id && Date.parse(r.created_at) > Date.parse(l.last_confirmed_at) && hoursSince(r.created_at, now) <= 48);
  // An IP or device can contribute at most once, even with a new cookie.
  const devices = new Set<string>(), ips = new Set<string>();
  const negatives = eligible.filter(r => r.kind === 'out_of_stock').sort((a,b)=>a.created_at.localeCompare(b.created_at)).filter(r => { if (devices.has(r.device_hash) || ips.has(r.ip_hash)) return false; devices.add(r.device_hash); ips.add(r.ip_hash); return true; });
  const positive = reports.filter(r=>r.listing_id===l.id && r.kind==='available').sort((a,b)=>b.created_at.localeCompare(a.created_at))[0];
  const stale = age > config.freshness.staleDays * 24;
  const disputed = negatives.length >= 2;
  const key = disputed ? 'community_out' : stale ? 'stale' : l.status_reported;
  const labels: Record<string,string> = { in_stock:'In stock', low_stock:'Low stock', out_of_stock:'Out of stock', community_out:'Reported out of stock by customers', stale:'Not recently confirmed' };
  return { key, label: labels[key], ageHours: age, hidden: known && age > config.freshness.hiddenDays*24, stale, disputed,
    caution: age > config.freshness.freshHours, confirmation: known ? `Confirmed ${ago(l.last_confirmed_at,now)}` : 'Confirmation time: Not available',
    community: positive ? `Customer confirmed ${ago(positive.created_at,now)}` : null,
    lastReported: l.status_reported.replaceAll('_',' '), tier: disputed || l.status_reported==='out_of_stock' ? 0 : stale ? 1 : l.status_reported==='low_stock' ? 2 : 3 };
}
export function distanceKm(a: {lat:number;lng:number}, b:{lat:number;lng:number}) { const r=Math.PI/180; const x=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lng-a.lng)*r/2)**2; return 6371*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)); }
export function rank(l:Listing,distance:number,rating:number|null,count:number,reports:Report[]=[],now=Date.now()) {
  const a=availability(l,reports,now), w=config.weights;
  const bayes=((count*(rating??config.bayesian.mean))+(config.bayesian.minimumReviews*config.bayesian.mean))/(count+config.bayesian.minimumReviews);
  const parts={distance:Math.max(0,1-distance/50)*w.distance,freshness:Math.max(0,1-a.ageHours/(24*7))*w.freshness,rating:bayes/5*w.rating,availability:(a.tier===3?1:a.tier===2?.6:0)*w.availability};
  return { score: Math.round(Object.values(parts).reduce((s,n)=>s+n,0)*10)/10,parts,bayesianRating:bayes,tier:a.tier };
}
export function compareBest(a:{rank:{tier:number;score:number}},b:{rank:{tier:number;score:number}}) { return b.rank.tier-a.rank.tier || b.rank.score-a.rank.score; }
export function isOpen(hours:string,now=new Date()) { try {const h=JSON.parse(hours), parts=new Intl.DateTimeFormat('en-US',{timeZone:config.timezone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now); const get=(t:string)=>parts.find(p=>p.type===t)?.value??''; const day=get('weekday'); if(h.closed?.includes(day))return false; const time=get('hour')+':'+get('minute'); return time>=h.open && time<h.close;} catch{return false;} }
function normalize(s:string){return s.toLowerCase().replace(/[^a-z0-9]/g,'');}
export function editDistance(a:string,b:string){const d=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const old=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;}}return d[b.length];}
export function matchProduct(p:any,q:string){if(!q.trim())return 1;const words=[...p.name.toLowerCase().split(/\s+/),...JSON.parse(p.aliases||'[]')],hay=[p.name,p.brand,p.model,...JSON.parse(p.aliases||'[]')].map(normalize),n=normalize(q);const tokens=q.toLowerCase().split(/\s+/).filter(Boolean);if(!tokens.filter(t=>/^\d+$/.test(t)).every(t=>words.some((s:string)=>normalize(s)===t||normalize(s)===t+'inch')))return 0;if(hay.some(s=>s.includes(n)))return 100;return tokens.every(t=>/^\d+$/.test(t)?words.some((s:string)=>(normalize(s)===t||normalize(s)===t+'inch')):hay.some(h=>h.includes(normalize(t)))||(!/\d/.test(t)&&words.some((s:string)=>editDistance(normalize(t),normalize(s))<=Math.max(1,Math.floor(t.length*.3)))))?60:0;}
