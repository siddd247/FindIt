const CACHE='nearby-shell-v6';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/styles.css','/app.js','/public-content.mjs','/simulation.mjs','/icons.mjs','/maps.mjs','/admin.mjs','/icon.svg']))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(u.origin!==location.origin||u.pathname.startsWith('/api/')||u.pathname.startsWith('/uploads/'))return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('/'):Response.error()))));});
