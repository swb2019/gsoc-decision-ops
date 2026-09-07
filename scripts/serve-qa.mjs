import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('apps/web/out');
const port = Number(process.env.HOURGLASS_QA_PORT || 4181);
const manifest = await readFile(resolve(root, 'glasshouse-offline-manifest.json'), 'utf8')
  .then(JSON.parse)
  .catch(() => ({ scope: '/' }));
const scope = manifest.scope || '/';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm',
};
http
  .createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url, 'http://localhost');
      const requested = decodeURIComponent(requestUrl.pathname);
      // Exercise the published service-worker scope even when a journey starts
      // with a root-relative route. Never serve duplicate out-of-scope pages.
      if (scope !== '/' && !requested.startsWith(scope)) {
        const suffix = requested === scope.slice(0, -1) ? '' : requested.slice(1);
        res.writeHead(302, { Location: scope + suffix + requestUrl.search }).end();
        return;
      }
      const pathname =
        scope !== '/' && requested.startsWith(scope)
          ? '/' + requested.slice(scope.length)
          : requested;
      let path = resolve(root, '.' + pathname);
      if (path !== root && !path.startsWith(root + sep)) {
        res.writeHead(403).end();
        return;
      }
      if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
      const data = await readFile(path);
      res
        .writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream' })
        .end(data);
    } catch {
      res.writeHead(404).end('Not found');
    }
  })
  .listen(port, '127.0.0.1', () => console.log(`QA static server ready on ${port}`));
