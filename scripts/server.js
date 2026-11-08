// Webserver voor npm run dev en de browsertest. Volgt de terugvalregel die Azure gebruikt, zodat een
// adres als /over hier hetzelfde werkt als online.
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';

const { navigationFallback } = JSON.parse(
  readFileSync(new URL('../staticwebapp.config.json', import.meta.url), 'utf8'),
);
const excluded = new RegExp(
  `\\.(${navigationFallback.exclude[0].match(/\{(.+)\}/)[1].replace(/,/g, '|')})$`,
);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function startServer(dir, port) {
  const server = createServer(async (req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    const send = (file, body) => {
      res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    };
    try {
      const file = normalize(join(dir, decodeURIComponent(pathname)));
      if (!file.startsWith(dir + sep)) throw new Error(`buiten ${dir}`);
      send(file, await readFile(file));
    } catch {
      if (excluded.test(pathname)) return res.writeHead(404).end('Niet gevonden');
      send('index.html', await readFile(join(dir, navigationFallback.rewrite)));
    }
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

export { startServer };
