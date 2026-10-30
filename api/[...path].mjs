import { applicationHandler } from '../local/server.mjs';
import { createVercelNodeHandler } from '../local/vercel-handler.mjs';

const handle = createVercelNodeHandler(applicationHandler, { nodeHandler: true });

export default async function vercelFunction(req, res) {
  const host = req.headers.host || 'localhost';
  const rawUrl = new URL(req.url || '/', `https://${host}`);
  let pathname = rawUrl.pathname;

  if (process.env.VERCEL !== '1') {
    if (pathname.startsWith('/api/api/')) {
      pathname = pathname.slice(4);
    } else if (pathname.startsWith('/api/')) {
      pathname = pathname.slice(4) || '/';
    }
  }

  const searchParams = new URLSearchParams(rawUrl.search);
  searchParams.delete('path');
  const search = searchParams.toString() ? '?' + searchParams.toString() : '';

  req.url = pathname + search;
  return handle(req, res);
}
