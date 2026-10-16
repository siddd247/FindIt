import App from '../../ui';
import { data,enriched } from '../../../lib/server';
import { notFound } from 'next/navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;const d=await data(),s=d.shops.find(s=>s.id===id&&s.status==='verified');return {title:s?.name??'Shop',description:s?`${s.name}, ${s.address}. Check electronics availability and confirmation times.`:'Shops in Jammu.'};}
export default async function Shop({params}:{params:Promise<{id:string}>}){const {id}=await params,d=await data(),s=d.shops.find(s=>s.id===id&&s.status==='verified');if(!s)notFound();return <App page="shop" entity={s} initial={enriched(d).filter((l:any)=>l.shop_id===id)}/>;}
