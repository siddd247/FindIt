import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudinaryStorage } from '../local/image-storage.mjs';
import { validJpeg } from './helpers/valid-jpeg.mjs';

const id='d6e1b925-a01c-4ed1-9e2e-34f61582aa91';
const config={cloudName:'nearbuy-test',apiKey:'test-key',apiSecret:'test-secret',clock:()=>1700000000};

test('Cloudinary adapter signs uploads, reads by opaque app URL and deletes the same asset',async()=>{
 const calls=[];
 const storage=createCloudinaryStorage({...config,fetchImpl:async(url,options={})=>{
  calls.push({url:String(url),options});
  if(String(url).endsWith('/image/upload')){
   assert.equal(options.method,'POST');assert.equal(options.body.get('public_id'),id);assert.equal(options.body.get('folder'),'nearbuy');assert.equal(options.body.get('overwrite'),'false');assert.equal(options.body.get('api_key'),'test-key');assert.match(options.body.get('signature'),/^[a-f0-9]{40}$/);
   const file=options.body.get('file');assert.equal(file.type,'image/jpeg');assert.equal(file.size,validJpeg.length);assert.deepEqual(Buffer.from(await file.arrayBuffer()),validJpeg);
   return Response.json({asset_id:'asset-1',public_id:`nearbuy/${id}`,secure_url:`https://res.cloudinary.com/nearbuy-test/image/upload/v1/nearbuy/${id}.jpg`});
  }
  if(String(url).includes('/resources/image/upload/'))return Response.json({public_id:`nearbuy/${id}`,secure_url:`https://res.cloudinary.com/nearbuy-test/image/upload/v1/nearbuy/${id}.jpg`});
  if(String(url).includes('/image/destroy')){assert.equal(options.headers.Authorization.startsWith('Basic '),true);assert.equal(new URLSearchParams(options.body).get('public_id'),`nearbuy/${id}`);assert.match(new URLSearchParams(options.body).get('signature'),/^[a-f0-9]{40}$/);return Response.json({result:'ok'});}
  if(String(url).startsWith('https://res.cloudinary.com/'))return new Response(validJpeg,{headers:{'content-type':'image/jpeg'}});
  throw new Error(`Unexpected Cloudinary request: ${url}`);
 }});
 const uploaded=await storage.upload(validJpeg,`${id}.jpg`);
 assert.equal(uploaded.url,`/uploads/${id}.jpg`);assert.equal(uploaded.public_id,`nearbuy/${id}`);
 assert.deepEqual(await storage.read(`${id}.jpg`),validJpeg);
 assert.equal(await storage.delete(`${id}.jpg`),true);assert.equal(calls.length,4);
});

test('Cloudinary adapter rejects invalid identifiers and unexpected provider URLs',async()=>{
 const storage=createCloudinaryStorage({...config,fetchImpl:async()=>Response.json({public_id:'other',secure_url:'https://attacker.example/image.jpg'})});
 await assert.rejects(storage.upload(Buffer.from('x'),'../other.jpg'),/Invalid image identifier/);
 await assert.rejects(storage.read(`${id}.jpg`),/unexpected asset/);
 assert.equal(await storage.read('../other.jpg'),null);
 assert.equal(await storage.delete('../other.jpg'),false);
});

test('Cloudinary adapter requires all server-only credentials',()=>{
 assert.throws(()=>createCloudinaryStorage({cloudName:'name',apiKey:'key',apiSecret:''}),/required/);
});

test('Cloudinary errors expose the provider reason while redacting credentials and signatures',async()=>{
 const storage=createCloudinaryStorage({...config,apiKey:'secret-api-key',apiSecret:'secret-api-value',fetchImpl:async()=>Response.json({error:{message:'Invalid image file; api_key=secret-api-key signature=abc123 Authorization: Basic value'}} ,{status:400})});
 await assert.rejects(storage.upload(validJpeg,`${id}.jpg`),error=>{
  assert.match(error.message,/Cloudinary upload failed \(400\): Invalid image file/);
  assert.doesNotMatch(error.message,/secret-api-key|secret-api-value|abc123|Basic value/);
  assert.match(error.message,/api_key=\[redacted\]/i);
  assert.equal(error.status,400);
  return true;
 });
});
