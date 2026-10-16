import { stripTypeScriptTypes } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, mkdtempSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist', 'local');
const files = [];
function collect(folder) {
  if (!existsSync(path.join(root, folder))) return;
  for (const entry of readdirSync(path.join(root, folder), { withFileTypes: true })) {
    const name = folder + '/' + entry.name;
    if (entry.isDirectory()) collect(name);
    else if (/\.(mjs|js|css|html|svg|webmanifest|sql)$/.test(name)) files.push(name);
  }
}
collect('local'); collect('web');
for (const file of ['lib/config.ts', 'lib/rules.ts', 'lib/seed.ts']) files.push(file);
const manifest = [];
for (const source of files) {
  let content = readFileSync(path.join(root, source), 'utf8');
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
writeFileSync(path.join(out, 'package.json'), JSON.stringify({ name: 'nearby-stock-finder-runtime', private: true, type: 'module', engines: { node: '>=24.16.0' }, scripts: { start: 'node local/server.mjs' } }, null, 2));
writeFileSync(path.join(out, 'BUILD-MANIFEST.json'), JSON.stringify({ builtAt: new Date().toISOString(), node: process.version, files: manifest }, null, 2));
mkdirSync(path.join(root, '.local'), { recursive: true });
const data = mkdtempSync(path.join(root, '.local', 'build-smoke-'));
const proc = spawn(process.execPath, [path.join(out, 'local', 'server.mjs')], { cwd: out, env: { ...process.env, PORT: '3099', LOCAL_DATA_DIR: data }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
try {
  await new Promise((resolve, reject) => {
    let log = '';
    const timeout = setTimeout(() => reject(new Error('Built server startup timed out: ' + log)), 10000);
    proc.stdout.on('data', c => { log += c; if (log.includes('running at')) { clearTimeout(timeout); resolve(); } });
    proc.stderr.on('data', c => { log += c; });
    proc.once('exit', code => { clearTimeout(timeout); reject(new Error('Built server exited ' + code + ': ' + log)); });
  });
  for (const route of ['/', '/app.js', '/styles.css', '/api/session', '/api/catalogue', '/api/search?q=iphn%2015']) {
    const response = await fetch('http://127.0.0.1:3099' + route);
    if (!response.ok) throw new Error('Built route failed: ' + route + ' ' + response.status);
    if (route.includes('search')) {
      const result = await response.json();
      if (!Array.isArray(result.listings)) throw new Error('Built search response invalid.');
    } else await response.arrayBuffer();
  }
  console.log('Build passed: ' + out + '\nCompiled shared TypeScript; checked modules; smoke-tested built HTTP server and search.\nNo live database, accounts, uploads, or secrets included.');
} finally { proc.kill(); }
