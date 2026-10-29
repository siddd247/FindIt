import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { migrate } from '../local/migrate.mjs';
import { migrateCatalog } from '../local/catalog-model.mjs';
import { makeTestDirectory, freePort, stopServer } from './helpers/runtime.mjs';
import { shopReviewSummary, adminTaskLinks, shopUsersView } from '../web/admin-shop-tools.mjs';
import { mountAdmin } from '../web/admin.mjs';

test('admin review, owner search, assignment removal and reassignment preserve approval and inventory', async t => {
  const dir = makeTestDirectory(path.resolve('.local/admin-operations-'));
  const db = new DatabaseSync(path.join(dir, 'stock.sqlite'));
  t.after(() => db.close());
  db.exec(readFileSync('local/schema.sql', 'utf8')); migrate(db);
  for (const [id, status] of [['pending-shop', 'pending'], ['active-shop', 'active'], ['rejected-shop', 'rejected']]) db.prepare('INSERT INTO shops(id,name,area,city,status) VALUES (?,?,?,?,?)').run(id, 'Fixture ' + id, 'Fixture area', 'Jammu', status);
  db.prepare("INSERT INTO categories(id,name) VALUES ('generic','Generic')").run();
  db.prepare("INSERT INTO products(id,brand,model,name,category_id,specs) VALUES ('fixture-product','Fixture','Model','Fixture Model','generic','{}')").run();
  db.prepare("INSERT INTO listings(id,shop_id,product_id,price_min,currency,status_reported,last_confirmed_at,confirmed_by) VALUES ('fixture-listing','pending-shop','fixture-product',1000,'INR','in_stock',?,'owner')").run(new Date().toISOString());
  migrateCatalog(db, { apply: true });
  const port = await freePort(), base = 'http://127.0.0.1:' + port;
  const proc = spawn(process.execPath, ['local/server.mjs'], { env: { ...process.env, LOCAL_DATA_DIR: dir, PORT: String(port), VERCEL: '0', NEARBY_DATABASE: 'sqlite', IMAGE_STORAGE: 'mock-cloudinary' }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe', 'ipc'] });
  t.after(() => stopServer(proc));
  await new Promise((resolve, reject) => { let output = ''; const timer = setTimeout(() => reject(Error(output)), 12000); proc.stdout.on('data', c => { output += c; if (output.includes('running at')) { clearTimeout(timer); resolve(); } }); proc.stderr.on('data', c => { output += c; }); proc.once('error', reject); });
  const call = async (route, body, cookie = '') => {
    const res = await fetch(base + '/api/' + route, { ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}), headers: { 'Content-Type': 'application/json', Origin: base, Cookie: cookie } });
    return { status: res.status, data: await res.json(), cookie: res.headers.get('set-cookie')?.split(';')[0] };
  };
  const settings = JSON.parse(readFileSync(path.join(dir, 'security.json'), 'utf8'));
  const credentials = { email: 'admin@operations.invalid', password: 'admin-operations-password' };
  assert.equal((await call('admin/setup', { ...credentials, token: settings.setupToken })).status, 200);
  const admin = (await call('admin/login', credentials)).cookie;
  const owner = await call('auth/signup', { email: 'owner@operations.invalid', password: 'owner-operations-password' });
  const ownerId = db.prepare('SELECT id FROM users WHERE email=?').get('owner@operations.invalid').id;
  assert.equal((await call('admin/catalog/unlink-shop-user', { shop_id: 'pending-shop' }, owner.cookie)).status, 401);
  let result = await call('admin/catalog/link-shop-user', { user_id: ownerId, shop_id: 'pending-shop', expected_owner_id: null }, admin);
  assert.equal(result.status, 200, JSON.stringify(result.data));
  assert.equal(db.prepare("SELECT status FROM shops WHERE id='pending-shop'").get().status, 'pending');
  const shops = await call('admin/shops?q=owner%40operations.invalid&assignment=assigned&size=1.9&page=1', null, admin);
  assert.equal(shops.status, 200); assert.equal(shops.data.total, 1); assert.equal(shops.data.size, 1);
  assert.equal(shops.data.shops[0].owner_email, 'owner@operations.invalid');
  assert.ok(!JSON.stringify(shops.data).includes('password_hash'));
  assert.equal((await call('admin/shops?status=invalid', null, admin)).status, 400);
  assert.equal((await call('admin/shop-status', { id: 'pending-shop', status: 'rejected' }, admin)).status, 400);
  assert.equal((await call('admin/shop-status', { id: 'pending-shop', status: 'rejected', reason: 'Supply a street address.' }, admin)).status, 200);
  const rejected = await call('admin/shops?status=rejected', null, admin);
  assert.equal(rejected.data.total, 2);
  assert.equal(rejected.data.shops.find(s => s.id === 'pending-shop').rejection_reason, 'Supply a street address.');
  assert.equal((await call('admin/catalog/unlink-shop-user', { shop_id: 'pending-shop', expected_owner_id: 'stale-owner' }, admin)).status, 409);
  assert.equal((await call('admin/catalog/unlink-shop-user', { shop_id: 'pending-shop', expected_owner_id: ownerId }, admin)).status, 200);
  assert.equal(db.prepare("SELECT owner_id,status FROM shops WHERE id='pending-shop'").get().owner_id, null);
  assert.equal(db.prepare("SELECT status FROM shops WHERE id='pending-shop'").get().status, 'rejected');
  assert.equal((await call('owner', null, owner.cookie)).data.shops.length, 0);
  assert.ok(db.prepare("SELECT id FROM listings WHERE id='fixture-listing'").get());
  const assigned = await call('admin/catalog/create-shop-user', { email: 'second@operations.invalid', password: 'another-shop-password', shop_id: 'pending-shop' }, admin);
  assert.equal(assigned.status, 200);
  assert.equal((await call('admin/catalog/link-shop-user', { user_id: ownerId, shop_id: 'pending-shop', expected_owner_id: null }, admin)).status, 409);
  assert.equal((await call('admin/catalog/link-shop-user', { user_id: ownerId, shop_id: 'pending-shop', expected_owner_id: assigned.data.id }, admin)).status, 200);
  assert.equal((await call('admin/shop-status', { id: 'pending-shop', status: 'active' }, admin)).status, 200);
  assert.equal((await call('shops')).data.shops.some(s => s.id === 'pending-shop'), true);
  const dashboard = await call('admin/dashboard', null, admin);
  assert.equal(dashboard.data.stats.pending, 0); assert.equal(dashboard.data.stats.unassignedShops, 2);
  assert.ok(dashboard.data.actions.some(a => a.kind === 'catalog_unlink-shop-user'));
  assert.equal(db.prepare('SELECT count(*) AS n FROM shops').get().n, 3);
});

test('admin review views distinguish approval, assignment and verification and escape owner data', () => {
  const shop = { id: 'shop', name: 'Retail shop', status: 'pending', owner_id: 'user', owner_email: '<owner>', rejection_reason: '<reason>' };
  const summary = shopReviewSummary(shop);
  assert.match(summary, /Pending approval/); assert.match(summary, /&lt;owner&gt;/); assert.match(summary, /&lt;reason&gt;/);
  assert.match(adminTaskLinks({ pendingRequests: 3 }), /Catalogue requests <strong>3/);
  const view = shopUsersView({ catalog: { shops: [shop], users: [{ id: 'user', email: '<owner>', status: 'active' }] } });
  assert.match(view, /Remove assignment/); assert.match(view, /&lt;owner&gt;/); assert.match(view, /Pending approval/);
  const unavailable = shopUsersView({ catalog: { shops: [shop], users: [] } });
  assert.match(unavailable, /Unavailable account/); assert.match(unavailable, /data-owner-id="user"/);
});

test('actual admin handlers confirm approval, synchronize counts, open owner assignments and handle session expiry', async () => {
  const names = ['document', 'location', 'fetch', 'setInterval', 'confirm', 'prompt'];
  const saved = Object.fromEntries(names.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  let html = '', poll, approved = false, rejectSession = false; const events = {}, writes = [];
  const shop = { id: 'shop', name: 'Fixture Store', status: 'pending', owner_id: 'owner', owner_email: 'owner@fixture.invalid', area: 'Fixture area', verification_status: 'unverified' };
  const stats = () => ({ products: 1, listings: 1, pending: shop.status === 'pending' ? 1 : 0, searches: 0, directionTaps: 0, ownerConfirmationsThisWeek: 0, shopsByStatus: [] });
  globalThis.location = new URL('http://fixture.invalid/control');
  globalThis.confirm = () => approved;
  globalThis.setInterval = fn => { poll = fn; return 1; };
  globalThis.document = { querySelector: selector => selector === '#app' ? { set innerHTML(value) { html = value; } } : null, addEventListener: (name, fn) => { (events[name] ??= []).push(fn); } };
  globalThis.fetch = async (url, options = {}) => {
    const route = String(url).slice('/api/admin/'.length);
    if (route === 'session') return Response.json({ user: { email: 'admin@fixture.invalid' }, needsSetup: false });
    if (route === 'dashboard') return rejectSession ? Response.json({ error: 'Expired' }, { status: 401 }) : Response.json({ stats: stats(), actions: [], zeroSearches: [], stale: [] });
    if (route.startsWith('shops?')) return Response.json({ shops: [shop], total: 1, page: 1, size: 20, areas: [{ area: shop.area }], types: [], pending: stats().pending });
    if (route === 'shop-status') { const body = JSON.parse(options.body); writes.push(body); shop.status = body.status; return Response.json({ ok: true }); }
    if (route === 'catalog/data') return Response.json({ shops: [shop], users: [{ id: 'owner', email: shop.owner_email, status: 'active' }] });
    throw Error('Unexpected admin route: ' + route);
  };
  const click = async dataset => {
    const button = { dataset, disabled: false };
    for (const fn of events.click) await fn({ target: { closest: selector => selector === 'button' ? button : null } });
  };
  try {
    await mountAdmin(); assert.match(html, /Needs attention/);
    await click({ adminTab: 'pending' }); assert.match(html, /owner@fixture.invalid/); assert.match(html, /Pending approval/);
    await click({ quickApprove: 'shop' }); assert.equal(writes.length, 0);
    approved = true; await click({ quickApprove: 'shop' }); assert.deepEqual(writes, [{ id: 'shop', status: 'active' }]); assert.match(html, />Approved</);
    await click({ editShop: 'shop' }); assert.match(html, /Assigned owner/); assert.match(html, /Approval controls public visibility/);
    await click({ manageOwner: 'shop' }); assert.match(html, /Remove assignment/);
    rejectSession = true; await poll(); assert.match(html, /Your admin session expired/); assert.match(html, /Administrator sign-in/);
  } finally {
    for (const [key, descriptor] of Object.entries(saved)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
});
