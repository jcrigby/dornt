// Lightweight dev server for UI iteration — no dependencies
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const port = 3000;
const siteDir = resolve(import.meta.dirname, '.');
const apiDir = resolve(import.meta.dirname, '../pipeline/.local-storage/dornt-public');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp',
};

createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // Try local-storage API data first, then site directory
  const candidates = [
    resolve(apiDir, urlPath.slice(1)),
    resolve(siteDir, urlPath.slice(1)),
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath) && !filePath.includes('..')) {
      const ext = extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(readFileSync(filePath));
      return;
    }
  }

  res.writeHead(404);
  res.end('Not found');
}).listen(port, () => {
  console.log(`Dev server: http://localhost:${port}/stories.html`);
});
