import {temporaryDirectory,removeTemporaryDirectory,stopServer,freePort} from './runtime-checks.mjs';
import { stripTypeScriptTypes } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist', 'local');
const files = [];
function collect(folder) {
  if (!existsSync(path.join(root, folder))) return;
  for (const entry of readdirSync(path.join(root, folder), { withFileTypes: true })) {
    const name = folder + '/' + entry.name;
    if (entry.isDirectory()) collect(name);
    else if (name==='web/vendor/lucide/icon-nodes.json'||/\.(mjs|js|css|html|svg|webmanifest|sql|ttf|txt|md|png|webp)$/.test(name)) files.push(name);
  }
}
collect('local'); collect('web'); files.push('scripts/start-local.mjs');
for (const file of ['lib/config.ts', 'lib/rules.ts', 'lib/seed.ts']) files.push(file);
const manifest = [];
for (const source of files) {
  let content = readFileSync(path.join(root, source), source.endsWith('.ttf') ? undefined : 'utf8');
  const target = source.replace(/\.ts$/, '.mjs');
  if (source.endsWith('.ts')) content = stripTypeScriptTypes(content, { mode: 'strip' });
  if (/\.(mjs|ts|js)$/.test(source)) content = content.replace(/(['"])([^'"\n]+)\.ts\1/g, '$1$2.mjs$1');
  const destination = path.join(out, target);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, content);
  if (/\.(mjs|js)$/.test(target)) {
    const result = spawnSync(process.execPath, ['--check', destination], { encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) throw new Error('Generated module invalid: ' + target + '\n' + result.stderr);
  }
  manifest.push({ file: target, sha256: createHash('sha256').update(content).digest('hex') });
}
writeFileSync(path.join(out, 'package.json'), JSON.stringify({ name: 'nearby-stock-finder-runtime', private: true, type: 'module', engines: { node: '>=24.16.0 <25' }, scripts: { start: 'node scripts/start-local.mjs' } }, null, 2));
writeFileSync(path.join(out, 'BUILD-MANIFEST.json'), JSON.stringify({ builtAt: new Date().toISOString(), node: process.version, files: manifest }, null, 2));
mkdirSync(path.join(root, '.local'), { recursive: true });
const data = temporaryDirectory(path.join(root, '.local', 'build-smoke-'));
const port=await freePort();
const deployHost='nearbuy-deploy-test.onrender.com';
const hostedRequest=(route,method='GET',headers={},body)=>new Promise((resolve,reject)=>{const request=http.request({hostname:'127.0.0.1',port,path:route,method,headers},response=>{const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>resolve({status:response.statusCode,body:Buffer.concat(chunks).toString()}));});request.on('error',reject);if(body)request.write(body);request.end();});
const proc = spawn(process.execPath, [path.join(out, 'local', 'server.mjs')], { cwd: out, env: { ...process.env, PORT: String(port), HOST: '0.0.0.0', RENDER_EXTERNAL_HOSTNAME: deployHost, NODE_ENV: 'production', LOCAL_DATA_DIR: data }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
try {
  await new Promise((resolve, reject) => {
    let log = '';
    const timeout = setTimeout(() => reject(new Error('Built server startup timed out: ' + log)), 10000);
    proc.stdout.on('data', c => { log += c; if (log.includes('running at')) { clearTimeout(timeout); resolve(); } });
    proc.stderr.on('data', c => { log += c; });
    proc.once('exit', code => { clearTimeout(timeout); reject(new Error('Built server exited ' + code + ': ' + log)); });
  });
  const hostedHeaders={host:deployHost,'x-forwarded-proto':'https'};
  const health=await hostedRequest('/healthz','GET',hostedHeaders);
  if(health.status!==200||health.body!=='ok')throw new Error('Hosted health check failed: '+health.status+' '+health.body);
  const session=await hostedRequest('/api/session','GET',hostedHeaders);
  if(session.status!==200)throw new Error('Hosted API host check failed: '+session.status+' '+session.body);
  const logout=await hostedRequest('/api/auth/logout','POST',{...hostedHeaders,origin:'https://'+deployHost,'content-type':'application/json'},'{}');
  if(logout.status!==200)throw new Error('Hosted HTTPS write check failed: '+logout.status+' '+logout.body);
  const blocked=await hostedRequest('/api/session','GET',{host:'not-allowed.example'});
  if(blocked.status!==403)throw new Error('Unknown Host header was not rejected.');
  for (const route of ['/', '/buyer.css', '/workspace.css', '/admin.css', '/components.css', '/tokens.css', '/fonts/Inter-Regular.ttf', '/fonts/Inter-SemiBold.ttf', '/fonts/Inter-Bold.ttf', '/manifest.webmanifest', '/icon.svg', '/dark-background.png', '/light-background.png', '/light-background-2.png', '/images/owner-shop-light.png', '/images/owner-shop-dark.png', '/catalogues', '/simulation.mjs', '/shop-pricing.mjs', '/shop-pricing-config.mjs', '/api/simulation', '/theme.js', '/app.js', '/admin.mjs', '/public-content.mjs', '/icons.mjs', '/maps.mjs', '/styles.css', '/api/session', '/api/catalogue', '/api/search?q=iphn%2015']) {
    const response = await fetch('http://127.0.0.1:'+port + route);
    if (route.endsWith('.mjs') && !response.headers.get('content-type')?.includes('javascript')) throw new Error('Module is not served as JavaScript: '+route);
    if (!response.ok) throw new Error('Built route failed: ' + route + ' ' + response.status);
    if (route.includes('search')) {
      const result = await response.json();
      if (!Array.isArray(result.listings)) throw new Error('Built search response invalid.');
    } else await response.arrayBuffer();
  }
  console.log('Build passed: ' + out + '\nCompiled shared TypeScript; checked modules; smoke-tested built HTTP server and search.\nNo live database, accounts, uploads, or secrets included.');
} finally { await stopServer(proc); removeTemporaryDirectory(data); }
