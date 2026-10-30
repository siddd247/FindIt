import { applicationHandler } from '../local/server.mjs';
import { createVercelNodeHandler } from '../local/vercel-handler.mjs';

const handle = createVercelNodeHandler(applicationHandler, { nodeHandler: true });

export default function vercelRootFunction(req, res) {
  const host = req.headers.host || 'localhost';
  const rawUrl = new URL(req.url || '/', `https://${host}`);
  const searchParams = new URLSearchParams(rawUrl.search);
  searchParams.delete('path');
  const search = searchParams.toString() ? '?' + searchParams.toString() : '';
  req.url = '/' + search;
  return handle(req, res);
}
