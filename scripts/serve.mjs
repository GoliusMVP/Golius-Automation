import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const port = Number(process.env.PORT || 4173);
const base = path.resolve(process.env.SITE_DIRECTORY || '.');
const types = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.txt':'text/plain; charset=utf-8' };
const server = http.createServer(async (req, res) => {
  try {
    if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405,{Allow:'GET, HEAD'});return res.end();}
    const parsed = new URL(req.url, 'http://localhost');
    const requested = decodeURIComponent(parsed.pathname);
    const target = path.resolve(base, '.' + (requested.endsWith('/') ? requested + 'index.html' : requested));
    const relative = path.relative(base, target);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(segment=>segment.startsWith('.')) || relative.startsWith('node_modules/')) {res.writeHead(404);return res.end('Not found');}
    if (!(await stat(target)).isFile()) throw new Error('Not a file');
    const body = await readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Golius preview: http://127.0.0.1:${port}`));
