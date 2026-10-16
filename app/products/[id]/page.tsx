import App from '../../ui';
import { rows, data, enriched } from '../../../lib/server';
import { notFound } from 'next/navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;const p=(await rows('products')).find(p=>p.id===id);return {title:p?.name??'Product',description:p?`Find ${p.name} in Jammu. Check prices and stock confirmation times before visiting.`:'Product availability in Jammu.',alternates:{canonical:`/products/${id}`}};}
export default async function Product({params}:{params:Promise<{id:string}>}){const {id}=await params,d=await data(),p=d.products.find(p=>p.id===id);if(!p)notFound();const listings=enriched(d).filter((l:any)=>l.product_id===id&&l.shop.status==='verified'&&!l.availability.hidden);return <App page="product" entity={p} initial={listings}/>;}
