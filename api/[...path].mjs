import { applicationHandler } from '../local/server.mjs';
import { createVercelNodeHandler } from '../local/vercel-handler.mjs';

const handle = createVercelNodeHandler(applicationHandler, { nodeHandler: true });

export default async function vercelFunction(req, res) {
  if (req.url && req.url.includes('debug')) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ url: req.url, headers: req.headers }, null, 2));
  }
  const host = req.headers.host || 'localhost';
  const rawUrl = new URL(req.url || '/', `https://${host}`);
  let pathname;
  if (req.headers['x-matched-path']) {
    pathname = req.headers['x-matched-path'];
  } else if (rawUrl.pathname.startsWith('/api/api/')) {
    pathname = rawUrl.pathname.slice(4);
  } else if (rawUrl.pathname.startsWith('/api/')) {
    pathname = rawUrl.pathname.slice(4) || '/';
  } else {
    pathname = rawUrl.pathname;
  }
  req.url = pathname + rawUrl.search;
  return handle(req, res);
}
