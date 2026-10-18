import http from 'node:http';
import rootFunction from '../../api/index.mjs';
import wildcardFunction from '../../api/[...path].mjs';

const server = http.createServer((req, res) => {
  const original = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (original.pathname === '/') {
    req.url = '/api/index' + original.search;
    return rootFunction(req, res);
  }
  req.url = (original.pathname.startsWith('/api/') ? '/api/api' + original.pathname.slice(4) : '/api' + original.pathname) + original.search;
  return wildcardFunction(req, res);
});

server.listen(Number(process.env.PORT || 3217), process.env.HOST || '127.0.0.1');
server.on('listening', () => console.log('Vercel function harness ready'));
function shutdown() { server.close(() => process.exit(0)); }
process.on('message', message => { if (message?.type === 'shutdown') shutdown(); });
process.on('SIGTERM', shutdown);
