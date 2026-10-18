import { applicationHandler } from '../local/server.mjs';
import { createVercelNodeHandler } from '../local/vercel-handler.mjs';

const handle = createVercelNodeHandler(applicationHandler, { nodeHandler: true });
export default function vercelRootFunction(req, res) {
  const current = new URL(req.url || '/', `https://${req.headers.host || 'localhost'}`);
  req.url = '/' + current.search;
  return handle(req, res);
}
