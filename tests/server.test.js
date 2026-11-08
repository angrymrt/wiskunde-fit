// Controleert dat scripts/server.js adressen behandelt zoals Azure Static Web Apps, met een kleine
// site in een tijdelijke map. Zo hoeft er niets gebouwd te worden. scripts/controleer-site.js
// controleert hetzelfde op de echte site.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from '../scripts/server.js';

const dir = await mkdtemp(join(tmpdir(), 'wiskundefit-'));
const files = {
  'staticwebapp.config.json': JSON.stringify({
    trailingSlash: 'never',
    routes: [
      { route: '/oud', redirect: '/over', statusCode: 301 },
      { route: '/assets/*', headers: { 'Cache-Control': 'immutable' } },
    ],
    responseOverrides: { 404: { rewrite: '/404.html', statusCode: 404 } },
  }),
  'index.html': 'home',
  '404.html': 'bestaat niet',
  'over/index.html': 'over',
  'mijn-stof/oefenen/index.html': 'oefenen',
  'sitemap.xml': 'sitemap',
  'assets/code.js': 'code',
};
for (const [name, text] of Object.entries(files)) {
  await mkdir(join(dir, name, '..'), { recursive: true });
  await writeFile(join(dir, name), text);
}
const server = await startServer(dir, 0);
test.after(async () => {
  server.close();
  await rm(dir, { recursive: true });
});
const get = (path) =>
  fetch(`http://127.0.0.1:${server.address().port}${path}`, { redirect: 'manual' });

test('een adres toont het bestand, met .html of index.html erachter', async () => {
  for (const [path, text] of [
    ['/', 'home'],
    ['/index', 'home'],
    ['/over', 'over'],
    ['/over?soort=3', 'over'],
    ['/mijn-stof/oefenen', 'oefenen'],
    ['/404', 'bestaat niet'],
    ['/sitemap.xml', 'sitemap'],
  ]) {
    const res = await get(path);
    assert.equal(res.status, 200, path);
    assert.equal(await res.text(), text, path);
  }
});

test('een streep, .html of /index gaat met een 301 naar het adres zonder', async () => {
  for (const [from, to] of [
    ['/over/', '/over'],
    ['/over/?soort=3', '/over?soort=3'],
    ['/over/index', '/over'],
    ['/over/index/', '/over'],
    ['/over/index.html?soort=3', '/over?soort=3'],
    ['/mijn-stof/oefenen/index', '/mijn-stof/oefenen'],
    ['/index.html', '/index'],
    ['/index.html?a=1', '/index?a=1'],
    ['/index/', '/index'],
    ['/404.html', '/404'],
    ['/sitemap.xml/', '/sitemap.xml'],
    ['/oud', '/over'],
    ['/oud/', '/over'],
  ]) {
    const res = await get(from);
    assert.equal(res.status, 301, from);
    assert.equal(res.headers.get('location'), to, from);
  }
});

test('wat niet bestaat, geeft de 404-pagina, ook zonder doorverwijzing', async () => {
  for (const path of [
    '/Over',
    '/Over/',
    '/over.html',
    '/bestaat-niet',
    '/bestaat-niet/',
    '/bestaat-niet/index',
    '/404/index',
    '/assets',
    '/assets/code',
    '/../package.json',
  ]) {
    const res = await get(path);
    assert.equal(res.status, 404, path);
    assert.equal(await res.text(), 'bestaat niet', path);
  }
});

test('een route geeft headers aan de bestanden die erbij passen', async () => {
  assert.equal((await get('/assets/code.js')).headers.get('cache-control'), 'immutable');
  assert.match((await get('/over')).headers.get('cache-control'), /max-age=30/);
});
