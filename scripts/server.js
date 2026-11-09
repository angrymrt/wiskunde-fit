// Webserver voor npm run dev en de browsertest. Volgt de regels die Azure Static Web Apps leest uit
// staticwebapp.config.json in de map zelf, zodat een adres hier hetzelfde werkt als online:
// - routes worden op volgorde gelezen en de eerste die past telt: een doorverwijzing of headers;
// - /over toont over/index.html en /404 toont 404.html. Bestaat het bestand, dan gaan /over/,
//   /over/index en /over/index.html met een 301 naar /over, en /404.html naar /404. Home staat op
//   / en op /index, en /index.html gaat naar /index. Zo deed de preview het in november 2026;
// - wat niet bestaat, krijgt de pagina uit responseOverrides, met status 404, ook /over.html;
// - zonder eigen header mag de browser een bestand 30 seconden bewaren, en tekst gaat met brotli.
// Hoofdletters tellen, net als bij Azure. Controleer na een wijziging ook de preview, met
// scripts/controleer-site.js.
// /api/tel is de echte functie uit api/tel.js, maar de tellen komen in server.tellen in plaats van
// in een tabel. Zo kan de browsertest zien wat er over het netwerk gaat.
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';
import { corsHeaders, handleTel } from '../api/tel.js';
import { TOPICS } from '../src/js/topics/index.js';

const soorten = new Set(TOPICS.flatMap((t) => t.skills.map((k) => k.id)));
async function api(req, res, tellen) {
  let body = '';
  for await (const chunk of req) body += chunk;
  const status = await handleTel(
    { method: req.method, origin: req.headers.origin, userAgent: req.headers['user-agent'], body },
    { env: { TELLERS_DEV_TABEL: 'geheugen' }, soorten, store: (_, row) => tellen.push(row) },
  );
  res.writeHead(status, corsHeaders(req.headers.origin)).end();
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};
const compressible = /^(text\/|image\/svg|application\/(json|xml))/;

// Een routepatroon van Azure: een * aan het eind, en {png,svg} voor meer extensies.
const routeRegex = (route) =>
  new RegExp(
    `^${route
      .replace(/[.+?^$()|[\]\\]/g, '\\$&')
      .replace(/\{([^}]+)\}/g, (_, list) => `(${list.split(',').join('|')})`)
      .replace(/\*/g, '.*')}$`,
  );
// Op Windows en macOS maakt het bestandssysteem geen verschil tussen hoofdletters en kleine letters.
// Vergelijk daarom ook de echte naam van het bestand.
async function isFile(dir, path) {
  if (!(await stat(path).catch(() => null))?.isFile()) return false;
  return (await realpath(path)).endsWith(path.slice(dir.length));
}
// Zoekt het bestand bij een adres zonder streep aan het eind: het bestand zelf, met .html erachter,
// of index.html in die map.
async function findFile(dir, path) {
  for (const candidate of [path, `${path}.html`, `${path}/index.html`]) {
    const file = normalize(join(dir, candidate));
    if (!file.startsWith(dir + sep)) continue;
    if (await isFile(dir, file)) return file;
  }
  return null;
}
// Het adres waarop Azure een bestand toont: zonder .html en zonder /index, behalve bij Home.
function addressOf(dir, file) {
  const path = file
    .slice(dir.length)
    .split(sep)
    .join('/')
    .replace(/\.html$/, '');
  return path === '/index' ? path : path.replace(/\/index$/, '');
}

function startServer(dir, port) {
  const tellen = [];
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/tel') return api(req, res, tellen);
    // Lees de regels bij elk verzoek, want npm run dev bouwt steeds opnieuw.
    const config = JSON.parse(await readFile(join(dir, 'staticwebapp.config.json'), 'utf8'));
    const path = decodeURIComponent(url.pathname);
    const redirect = (to, code = 301) => res.writeHead(code, { Location: to + url.search }).end();
    const bare = path.replace(/\/+$/, '') || '/';
    const rule = (config.routes || []).find((r) => routeRegex(r.route).test(bare));
    if (rule?.redirect) return redirect(rule.redirect, rule.statusCode || 302);

    const send = async (file, status, extra = {}) => {
      let body = await readFile(file);
      const type = types[extname(file)] ?? 'application/octet-stream';
      const headers = {
        'Content-Type': type,
        'Cache-Control': 'public, must-revalidate, max-age=30',
        ...extra,
      };
      // Azure comprimeert tekst met brotli, ongeveer op niveau 4. Zo kloppen ook de metingen.
      if (compressible.test(type) && /\bbr\b/.test(req.headers['accept-encoding'])) {
        body = brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } });
        Object.assign(headers, { 'Content-Encoding': 'br', Vary: 'Accept-Encoding' });
      }
      res.writeHead(status, headers);
      res.end(req.method === 'HEAD' ? undefined : body);
    };
    const file = await findFile(dir, bare);
    if (file) {
      const address = addressOf(dir, file);
      const home = address === '/index' && path === '/';
      if (config.trailingSlash === 'never' && path !== address && !home) return redirect(address);
      return send(file, 200, rule?.headers);
    }
    const missing = config.responseOverrides?.['404'];
    if (missing) return send(join(dir, missing.rewrite), missing.statusCode || 404);
    res.writeHead(404).end('Niet gevonden');
  });
  server.tellen = tellen;
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

export { startServer };
