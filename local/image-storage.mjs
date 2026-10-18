import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const assetName = /^[a-f0-9-]{36}\.jpg$/i;
const safeId = filename => {
  if (typeof filename !== 'string' || !assetName.test(filename)) throw new Error('Invalid image identifier.');
  return filename.slice(0, -4).toLowerCase();
};

/** Local, isolated Cloudinary stand-in for Phase 1. It never talks to Cloudinary. */
export function createMockCloudinaryStorage({ directory }) {
  if (!directory) throw new Error('A test-only image directory is required.');
  const root = path.resolve(directory);
  mkdirSync(root, { recursive: true });
  return {
    provider: 'mock-cloudinary',
    async upload(bytes, filename) {
      if (!Buffer.isBuffer(bytes)) throw new TypeError('Image data must be a Buffer.');
      safeId(filename);
      const target = path.join(root, filename);
      // Exclusive creation ensures tests cannot silently replace an existing asset.
      writeFileSync(target, bytes, { flag: 'wx' });
      return {
        asset_id: filename.slice(0, -4),
        public_id: filename.slice(0, -4),
        secure_url: `/uploads/${filename}`,
        url: `/uploads/${filename}`,
      };
    },
    async read(filename) {
      if (!assetName.test(filename)) return null;
      try { return readFileSync(path.join(root, filename)); } catch (error) {
        if (error.code === 'ENOENT') return null;
        throw error;
      }
    },
    async delete(filename) {
      if (!assetName.test(filename)) return false;
      const { unlinkSync } = await import('node:fs');
      try { unlinkSync(path.join(root, filename)); return true; }
      catch (error) { if (error.code === 'ENOENT') return false; throw error; }
    },
  };
}

/**
 * Cloudinary adapter using signed server-side upload/destroy requests and the
 * authenticated Admin API for reads. The app keeps its existing /uploads/:id
 * URLs; public_id is deterministically derived from that opaque UUID.
 */
export function createCloudinaryStorage({
  cloudName = process.env.CLOUDINARY_CLOUD_NAME,
  apiKey = process.env.CLOUDINARY_API_KEY,
  apiSecret = process.env.CLOUDINARY_API_SECRET,
  publicIdPrefix = process.env.CLOUDINARY_PUBLIC_ID_PREFIX || 'nearbuy',
  fetchImpl = globalThis.fetch,
  clock = () => Math.floor(Date.now() / 1000),
  timeoutMs = 15000,
} = {}) {
  if (!cloudName || !apiKey || !apiSecret) throw new Error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required for Cloudinary storage.');
  if (!/^[a-z0-9-]+$/i.test(cloudName)) throw new Error('Invalid Cloudinary cloud name.');
  if (typeof publicIdPrefix !== 'string' || !/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)*$/i.test(publicIdPrefix)) throw new Error('Invalid Cloudinary public ID prefix.');
  if (typeof fetchImpl !== 'function') throw new Error('A Fetch implementation is required for Cloudinary storage.');
  const api = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}`;
  const basic = `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`;
  const request = (url, options = {}) => fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeoutMs) });
  const signature = params => createHash('sha1').update(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '').sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('&') + apiSecret).digest('hex');
  const publicId = id => `${publicIdPrefix}/${id}`;
  const secureAssetUrl = value => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' && parsed.hostname === 'res.cloudinary.com' && parsed.pathname.startsWith(`/${cloudName}/image/upload/`);
    } catch { return false; }
  };

  async function responseJson(response, action) {
    let payload;
    try { payload = await response.json(); } catch { throw new Error(`Cloudinary ${action} returned an unreadable response.`); }
    if (!response.ok) {
      // Provider messages help diagnose rejected uploads. Keep them bounded and
      // redact credential-like values in case an upstream error echoes inputs.
      let detail = typeof payload?.error?.message === 'string' ? payload.error.message : '';
      detail = detail.replace(/[\u0000-\u001f\u007f]/g, ' ').trim();
      for (const secret of [apiKey, apiSecret]) if (secret) detail = detail.split(secret).join('[redacted]');
      detail = detail.replace(/\bauthorization\s*[:=].*$/i, 'authorization=[redacted]');
      detail = detail.replace(/\b(signature|api_key|authorization)\s*[:=]\s*[^\s,;]+/gi, '$1=[redacted]').slice(0, 240);
      const error = new Error(`Cloudinary ${action} failed (${response.status})${detail ? `: ${detail}` : '.'}`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  return {
    provider: 'cloudinary',
    async upload(bytes, filename) {
      if (!Buffer.isBuffer(bytes)) throw new TypeError('Image data must be a Buffer.');
      const id = safeId(filename), timestamp = clock(), params = { folder: publicIdPrefix, overwrite: 'false', public_id: id, timestamp };
      const form = new FormData();
      form.set('file', new Blob([bytes], { type: 'image/jpeg' }), filename);
      for (const [key, value] of Object.entries(params)) form.set(key, String(value));
      form.set('signature', signature(params));
      form.set('api_key', apiKey);
      const result = await responseJson(await request(`${api}/image/upload`, { method: 'POST', body: form }), 'upload');
      if (result.public_id !== publicId(id) || !secureAssetUrl(result.secure_url)) throw new Error('Cloudinary returned an unexpected asset identifier or URL.');
      return { asset_id: result.asset_id, public_id: result.public_id, secure_url: result.secure_url, url: `/uploads/${id}.jpg` };
    },
    async read(filename) {
      if (!assetName.test(filename)) return null;
      const id = safeId(filename), encoded = publicId(id).split('/').map(encodeURIComponent).join('/');
      const metadata = await request(`${api}/resources/image/upload/${encoded}`, { headers: { Authorization: basic } });
      if (metadata.status === 404) return null;
      const asset = await responseJson(metadata, 'read');
      if (asset.public_id !== publicId(id) || !secureAssetUrl(asset.secure_url)) throw new Error('Cloudinary returned an unexpected asset during read.');
      const image = await request(asset.secure_url);
      if (image.status === 404) return null;
      if (!image.ok) throw new Error(`Cloudinary image delivery failed (${image.status}).`);
      const type = image.headers.get('content-type') || '';
      if (!type.toLowerCase().startsWith('image/jpeg')) throw new Error('Cloudinary returned a non-JPEG asset.');
      const bytes = Buffer.from(await image.arrayBuffer());
      if (bytes.length > 650000 || bytes[0] !== 255 || bytes[1] !== 216) throw new Error('Cloudinary returned an invalid or oversized JPEG.');
      return bytes;
    },
    async delete(filename) {
      if (!assetName.test(filename)) return false;
      const id = safeId(filename), timestamp = clock(), params = { public_id: publicId(id), timestamp };
      const form = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])), signature: signature(params), api_key: apiKey });
      const result = await responseJson(await request(`${api}/image/destroy`, { method: 'POST', headers: { Authorization: basic, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form }), 'delete');
      return result.result === 'ok';
    },
  };
}

