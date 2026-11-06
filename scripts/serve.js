// Kleine webserver om te ontwikkelen: toont src/ zonder bouwstap. Wijzig een bestand en herlaad.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../src', import.meta.url));
const port = Number(process.env.PORT) || 5173;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, 'http://localhost');
    const file = normalize(
      join(src, decodeURIComponent(pathname === '/' ? '/index.html' : pathname)),
    );
    if (!file.startsWith(src + sep)) throw new Error('buiten src/');
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('Niet gevonden');
  }
}).listen(port, '127.0.0.1', () => console.log(`Open http://localhost:${port}`));
