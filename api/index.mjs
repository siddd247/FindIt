import { applicationHandler } from '../local/server.mjs';
import { createVercelNodeHandler } from '../local/vercel-handler.mjs';

const handle = createVercelNodeHandler(applicationHandler, { nodeHandler: true });
export default function vercelRootFunction(req, res) {
  const host = req.headers.host || 'localhost';
  const current = new URL(req.url || '/', `https://${host}`);
  const pathname = req.headers['x-matched-path'] || '/';
  req.url = pathname + current.search;
  return handle(req, res);
}
