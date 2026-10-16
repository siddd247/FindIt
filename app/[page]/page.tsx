import App from '../ui';
import { notFound } from 'next/navigation';
const pages=['search','owner','join','admin','about','availability','privacy','terms','contact','for-shops','design-system'];
export async function generateMetadata({params}:{params:Promise<{page:string}>}){const {page}=await params;return {title:page.replaceAll('-',' ').replace(/^./,s=>s.toUpperCase())};}
export default async function Page({params}:{params:Promise<{page:string}>}){const {page}=await params;if(!pages.includes(page))notFound();return <App page={page}/>;}
