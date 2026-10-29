import test from 'node:test';
import assert from 'node:assert/strict';
import { mountShopModels } from '../web/shop-model-ui.mjs';

function browser() {
  const saved = Object.fromEntries(['document', 'window', 'FormData', 'confirm'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const documentEvents = new Map(), windowEvents = new Map(), elements = new Map(); let html = '';
  const events = map => ({
    addEventListener(type, fn) { if (!map.has(type)) map.set(type, new Set()); map.get(type).add(fn); },
    removeEventListener(type, fn) { map.get(type)?.delete(fn); },
  });
  globalThis.document = { ...events(documentEvents), hidden: false,
    querySelector(selector) {
      if (selector === '#app') return { set innerHTML(value) { html = value; } };
      if (selector === '.shop-approval') return { set outerHTML(value) { html = html.replace(/<section class="panel shop-approval"[\s\S]*?<\/section>/, value); } };
      return null;
    },
    getElementById(id) { if (!elements.has(id)) elements.set(id, { innerHTML: '', textContent: '', disabled: false }); return elements.get(id); },
  };
  globalThis.window = { ...events(windowEvents) };
  globalThis.confirm = () => true;
  globalThis.FormData = class {
    constructor(form) { this.values = form.pairs; }
    [Symbol.iterator]() { return this.values[Symbol.iterator](); }
    get(name) { return this.values.find(([key]) => key === name)?.[1] ?? null; }
    getAll(name) { return this.values.filter(([key]) => key === name).map(([, value]) => value); }
  };
  const fire = async (scope, type, event = {}) => { for (const fn of [...((scope === 'window' ? windowEvents : documentEvents).get(type) || [])]) await fn(event); };
  return { html: () => html, fire, elements,
    async restore() { await fire('window', 'pagehide', { persisted: false }); for (const [key, descriptor] of Object.entries(saved)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } },
  };
}
function form(id, values) {
  const error = { textContent: '', focus() {} }, button = { disabled: false };
  return { id, pairs: values, elements: { photo: { files: [] } }, dataset: {}, attributes: {}, error, button,
    setAttribute(name, value) { this.attributes[name] = value; }, querySelector(selector) { return selector === '.form-error' ? error : button; },
  };
}
const click = (ui, attribute, value = '') => {
  const button = { disabled: false, dataset: {}, hasAttribute: name => name === attribute };
  if (attribute === 'data-shop-page') button.dataset.shopPage = value;
  return ui.fire('document', 'click', { target: { closest: selector => selector === 'button' ? button : null } });
};

test('actual owner UI handlers register pending shops, save offers, filter locally and refresh status without discarding edits', async () => {
  const ui = browser();
  try {
    const calls = [], data = { shops: [], offers: [], models: [{ id: 'model', brand: 'Fixture', model_name: 'Widget' }], categories: [{ id: 'generic', name: 'Generic' }] };
    let failSave = false;
    const api = async (route, body) => {
      calls.push({ route, body });
      if (route === 'shop/catalog') return structuredClone(data);
      if (route === 'shops') { const shop = { ...body, id: 'shop', status: 'pending', categories: JSON.stringify(body.categories) }; data.shops = [shop]; return { shop }; }
      if (route.startsWith('shop/status?')) return { shop: structuredClone(data.shops[0]) };
      if (route.startsWith('shop/variants?')) return { variants: [{ id: 'variant', options: { storage: '128 GB' }, specs: {} }] };
      if (route === 'shop/offer') {
        if (failSave) throw Error('The shop is now on hold.');
        data.offers = [{ ...body, id: 'offer', product_id: 'model', brand: 'Fixture', model_name: 'Widget', category_id: 'generic', options: { storage: '128 GB' }, price_rank: 'Not publicly listed' }]; return { ok: true };
      }
      throw Error('Unexpected API route: ' + route);
    };
    await mountShopModels({ api, nav: () => '', footer: () => '' });
    assert.match(ui.html(), /shop-model-register/);
    const registration = form('shop-model-register', [['name', 'Fixture Shop'], ['address', 'Fixture street'], ['area', 'Fixture area'], ['categories', 'generic']]);
    await ui.fire('document', 'submit', { target: registration, preventDefault() {} });
    assert.deepEqual(calls.find(c => c.route === 'shops').body.categories, ['generic']);
    assert.match(ui.html(), /Pending approval/); assert.match(ui.html(), /shop-model-add-offer/);
    await ui.fire('document', 'change', { target: { id: 'shop-model-product', value: 'model', closest: () => ({ id: 'shop-model-add-offer' }) } });
    assert.match(ui.elements.get('shop-model-variant').innerHTML, /128 GB/);
    assert.equal(ui.elements.get('shop-model-variant').disabled, false);
    const offer = form('shop-model-add-offer', [['variant_id', 'variant'], ['price', '990'], ['stock_status', 'available']]);
    await ui.fire('document', 'submit', { target: offer, preventDefault() {} });
    assert.equal(calls.find(c => c.route === 'shop/offer').body.shop_id, 'shop');
    assert.match(ui.html(), /Price and stock saved/);
    const unsaved = { value: '1111', closest: () => ({ id: 'shop-model-offer-offer' }) };
    await ui.fire('document', 'input', { target: unsaved });
    data.shops[0].status = 'active'; await ui.fire('window', 'focus');
    assert.match(ui.html(), />Approved</); assert.equal(unsaved.value, '1111');
    // bfcache navigation must retain controls when this page is restored.
    await ui.fire('window', 'pagehide', { persisted: true });
    await click(ui, 'data-shop-refresh');
    assert.match(ui.html(), /View product/);
    const count = calls.length, filter = form('shop-model-filter', [['q', 'no matching product'], ['category', '']]);
    await ui.fire('document', 'submit', { target: filter, preventDefault() {} });
    assert.match(ui.html(), /No inventory matches/); assert.equal(calls.length, count);
    await click(ui, 'data-shop-filter-reset'); assert.match(ui.html(), /Fixture Widget/);
    failSave = true;
    await ui.fire('document', 'submit', { target: offer, preventDefault() {} });
    assert.equal(offer.error.textContent, 'The shop is now on hold.'); assert.equal(offer.button.disabled, false); assert.equal(offer.attributes['aria-busy'], 'false');
  } finally { await ui.restore(); }
});

test('variant selector ignores late responses from a previously selected model', async () => {
  const ui = browser();
  try {
    let resolveFirst;
    const data = { shops: [{ id: 's', name: 'Fixture', status: 'pending' }], offers: [], models: [], categories: [] };
    await mountShopModels({ nav: () => '', footer: () => '', api: async route => {
      if (route === 'shop/catalog') return data;
      if (route.endsWith('product=first')) return new Promise(resolve => { resolveFirst = resolve; });
      return { variants: [{ id: 'second-variant', options: { color: 'Blue' }, specs: {} }] };
    } });
    const first = ui.fire('document', 'change', { target: { id: 'shop-model-product', value: 'first', closest: () => null } });
    await Promise.resolve();
    await ui.fire('document', 'change', { target: { id: 'shop-model-product', value: 'second', closest: () => null } });
    resolveFirst({ variants: [{ id: 'first-variant', options: { color: 'Red' }, specs: {} }] }); await first;
    assert.match(ui.elements.get('shop-model-variant').innerHTML, /second-variant/); assert.doesNotMatch(ui.elements.get('shop-model-variant').innerHTML, /first-variant/);
  } finally { await ui.restore(); }
});
