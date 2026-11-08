// Controleert de pagina's die de build vooraf maakt: elk scherm heeft er een, met een eigen titel en
// beschrijving, elke link gaat naar een pagina die bestaat, en oude adressen worden doorverwezen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPPINGS } from '../src/js/mappings/index.js';
import { PAGES, redirects } from '../src/js/pages.js';
import { viewFor } from '../src/js/routes.js';
import { DOMAINS, TOPICS } from '../src/js/topics/index.js';
import { screenHTML, shellHTML } from '../src/js/ui/screens.js';
import { state } from '../src/js/ui/state.js';

const addressed = PAGES.filter((p) => p.path !== null);
// Bestanden die de build los naast de pagina's zet.
const FILES = ['/og.png', '/apple-touch-icon.png', '/favicon.svg', '/sitemap.xml', '/robots.txt'];

test('elk scherm heeft een pagina, en die opent weer hetzelfde scherm', () => {
  const unique = (list, what) => assert.equal(new Set(list).size, list.length, what);
  unique(
    addressed.map((p) => p.path),
    'adressen',
  );
  unique(
    PAGES.map((p) => p.file),
    'bestanden',
  );
  unique(
    PAGES.map((p) => p.title),
    'titels',
  );
  for (const page of addressed) assert.deepEqual(viewFor(page.path), page.view, page.path);
  const paths = new Set(addressed.map((p) => p.path));
  for (const path of [
    '/',
    '/methode-indeling',
    '/mijn-stof',
    '/mijn-stof/oefenen',
    '/proeftoets',
    '/proeftoets/uitslag',
    '/over',
    '/privacy',
    '/contact',
    ...DOMAINS.map((d) => `/${d.slug}`),
    ...TOPICS.flatMap((t) => [`/${t.slug}`, `/${t.slug}/oefenen`]),
    ...MAPPINGS.map((m) => `/methode-indeling/${m.slug}`),
  ]) {
    assert.ok(paths.has(path), `geen pagina voor ${path}`);
  }
  assert.equal(PAGES.filter((p) => p.file === '404.html').length, 1);
});

test('elke pagina heeft een korte beschrijving in gewone tekst', () => {
  for (const page of PAGES) {
    assert.ok(page.description?.length >= 20, `${page.file} heeft geen beschrijving`);
    // Google toont ongeveer 155 tekens en kapt de rest af.
    assert.ok(page.description.length <= 160, `${page.file} heeft een te lange beschrijving`);
    assert.doesNotMatch(page.description, /[<>{}]/, page.file);
  }
  const indexed = PAGES.filter((p) => p.index).map((p) => p.description);
  assert.equal(new Set(indexed).size, indexed.length, 'twee pagina’s met dezelfde beschrijving');
  // Een schil hangt af van de browser en komt dus niet in zoekmachines.
  for (const page of PAGES) assert.equal(page.index, !page.shell && page.path !== null, page.file);
});

test('elke link op een pagina gaat naar een pagina of bestand dat bestaat', () => {
  const known = new Set([...addressed.map((p) => p.path), ...FILES]);
  for (const page of PAGES) {
    state.view = page.view;
    const html = page.shell ? shellHTML(page.title) : screenHTML();
    for (const [, href] of html.matchAll(/href="(\/[^"#?]*)/g)) {
      assert.ok(known.has(href), `${page.file} linkt naar ${href}`);
    }
  }
});

test('een oud adres wordt doorverwezen naar het nieuwe, ook bij oefenen', () => {
  const topic = { slug: 'nieuw-onderwerp', oldSlugs: ['oud-onderwerp'] };
  const domain = { slug: 'nieuw-domein', oldSlugs: ['oud-domein'] };
  const mapping = { slug: 'nieuw-boek', oldSlugs: ['oud-boek'] };
  assert.deepEqual(redirects({ topics: [topic], domains: [domain], mappings: [mapping] }), [
    ['/oud-onderwerp', '/nieuw-onderwerp'],
    ['/oud-onderwerp/oefenen', '/nieuw-onderwerp/oefenen'],
    ['/oud-domein', '/nieuw-domein'],
    ['/methode-indeling/oud-boek', '/methode-indeling/nieuw-boek'],
  ]);
  // Een oud adres mag geen pagina zijn, anders wint de doorverwijzing en is de pagina weg.
  const paths = new Set(addressed.map((p) => p.path));
  for (const [from, to] of redirects()) {
    assert.ok(!paths.has(from), `${from} is ook een pagina`);
    assert.ok(paths.has(to), `${to} bestaat niet`);
  }
});
