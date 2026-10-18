import { applicationHandler } from '../local/server.mjs';
import { createVercelNodeHandler } from '../local/vercel-handler.mjs';

const handle = createVercelNodeHandler(applicationHandler, { nodeHandler: true });

export default async function vercelFunction(req, res) {
  // vercel.json rewrites the original URL through /api; restore that original
  // path before handing it to the unchanged application router.
  const url = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) url.pathname = url.pathname.slice(4) || '/';
  else if (url.pathname === '/api') url.pathname = '/';
  req.url = url.pathname + url.search;
  return handle(req, res);
}
