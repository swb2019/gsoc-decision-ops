import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('apps/web/out');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wasm': 'application/wasm',
};
http
  .createServer(async (req, res) => {
    try {
      let path = resolve(
        root,
        '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      );
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
  .listen(4181, '127.0.0.1', () => console.log('QA static server ready'));
