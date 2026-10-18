/**
 * Adapt an async Fetch-style application handler to Vercel's Node request/response
 * signature. The application dispatcher must be supplied after its services have
 * been moved to the async database interface; this module never opens a database.
 */
export function createVercelNodeHandler(dispatch, { nodeHandler = false } = {}) {
  if (typeof dispatch !== 'function') throw new TypeError('An async request dispatcher is required.');

  // The application already speaks Node's request/response contract. This mode
  // is the Vercel Function boundary and deliberately avoids starting a server.
  if (nodeHandler) return (req, res) => dispatch(req, res);

  return async function vercelNodeHandler(req, res) {
    try {
      const host = req.headers.host;
      if (!host) {
        res.statusCode = 400;
        res.end('Invalid request.');
        return;
      }

      const method = String(req.method || 'GET').toUpperCase();
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : String(value));
      }
      const protocol = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const url = new URL(req.url || '/', `${protocol}://${host}`);
      const hasBody = !['GET', 'HEAD'].includes(method);
      const body = hasBody ? await readBody(req, 1_000_000) : undefined;
      const request = new Request(url, { method, headers, ...(body ? { body } : {}) });
      const response = await dispatch(request);
      if (!(response instanceof Response)) throw new TypeError('The request dispatcher must return a Response.');

      res.statusCode = response.status;
      response.headers.forEach((value, key) => res.setHeader(key, value));
      if (method === 'HEAD' || response.status === 204 || response.status === 304) {
        res.end();
        return;
      }
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) {
      if (res.headersSent) {
        res.end();
        return;
      }
      const status = error?.status === 413 ? 413 : 500;
      res.statusCode = status;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ error: status === 413 ? 'Request too large.' : 'Something went wrong. Please retry.' }));
    }
  };
}

async function readBody(stream, maxBytes) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('Request too large.'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
