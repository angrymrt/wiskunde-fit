// Webserver voor npm run dev en de browsertest. Volgt de regels die Azure Static Web Apps leest uit
// staticwebapp.config.json in de map zelf, zodat een adres hier hetzelfde werkt als online:
// - een map toont index.html, en met trailingSlash "never" gaat /over/ met een 301 naar /over;
// - routes worden op volgorde gelezen en de eerste die past telt: een doorverwijzing of headers;
// - wat niet bestaat, krijgt de pagina uit responseOverrides, met status 404;
// - zonder eigen header mag de browser een bestand 30 seconden bewaren, en tekst gaat met brotli.
// Hoofdletters tellen, net als bij Azure. Controleer na een wijziging ook de preview, met
// scripts/controleer-site.js.
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';

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

function startServer(dir, port) {
  const server = createServer(async (req, res) => {
    // Lees de regels bij elk verzoek, want npm run dev bouwt steeds opnieuw.
    const config = JSON.parse(await readFile(join(dir, 'staticwebapp.config.json'), 'utf8'));
    const url = new URL(req.url, 'http://localhost');
    const path = decodeURIComponent(url.pathname);
    const redirect = (to, code = 301) => res.writeHead(code, { Location: to + url.search }).end();
    if (config.trailingSlash === 'never') {
      if (/\/index\.html$/.test(path)) return redirect(path.replace(/\/index\.html$/, '') || '/');
      if (path.length > 1 && path.endsWith('/')) return redirect(path.replace(/\/+$/, ''));
    }
    const rule = (config.routes || []).find((r) => routeRegex(r.route).test(path));
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
    const file = normalize(join(dir, path));
    if (file.startsWith(dir + sep) || file === dir) {
      for (const candidate of [file, join(file, 'index.html')]) {
        if (await isFile(dir, candidate)) return send(candidate, 200, rule?.headers);
      }
    }
    const missing = config.responseOverrides?.['404'];
    if (missing) return send(join(dir, missing.rewrite), missing.statusCode || 404);
    res.writeHead(404).end('Niet gevonden');
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

export { startServer };
