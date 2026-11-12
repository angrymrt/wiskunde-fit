// Controleert dat bij elk scherm één adres hoort en dat adressen die niet bestaan ook niets tonen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPPINGS } from '../src/js/mappings/index.js';
import { crumbsFor, pathFor, sectionFor, titleFor, viewFor } from '../src/js/routes.js';
import { DOMAINS, TOPICS } from '../src/js/topics/index.js';

const open = (address) => {
  const { pathname, search } = new URL(address, 'https://wiskundefit.nl');
  return viewFor(pathname, search);
};
const [topic] = TOPICS;
const soort = topic.skills[0].id;

test('elk scherm heeft het adres uit de navigatie in README.md', () => {
  const screens = [
    ['/', { name: 'home' }],
    ['/methode-indeling', { name: 'kies' }],
    ['/mijn-stof', { name: 'stof' }],
    ['/mijn-stof/oefenen', { name: 'stofoefen', slug: 'mijn-stof' }],
    ['/proeftoets', { name: 'toets' }],
    ['/proeftoets/uitslag', { name: 'toetsres' }],
    ['/over', { name: 'over' }],
    ['/privacy', { name: 'privacy' }],
    ['/contact', { name: 'contact' }],
    ['/methode-indeling/getal-en-ruimte-13-havo-3', { name: 'mapping', id: 'gr13-havo3' }],
    ['/snijpunten-van-lijnen', { name: 'topic', slug: 'snijpunten-van-lijnen' }],
    [
      '/snijpunten-van-lijnen/oefenen',
      { name: 'topic', slug: 'snijpunten-van-lijnen', oefen: true },
    ],
  ];
  for (const [address, view] of screens) {
    assert.deepEqual(open(address), view, address);
    assert.equal(pathFor(view), address);
  }
});

test('elk onderwerp en elke methode-indeling heen en terug', () => {
  for (const t of TOPICS) {
    for (const view of [
      { name: 'topic', slug: t.slug },
      { name: 'topic', slug: t.slug, oefen: true },
      { name: 'topic', slug: t.slug, oefen: true, soort: t.skills.at(-1).id },
    ]) {
      assert.deepEqual(open(pathFor(view)), view);
      assert.match(titleFor(view), /\| Wiskundefit$/);
    }
  }
  for (const m of MAPPINGS) {
    const view = { name: 'mapping', id: m.id };
    assert.deepEqual(open(pathFor(view)), view);
    assert.ok(titleFor(view).includes(m.method));
  }
});

test('soort kiest alleen een vraagsoort van dit onderwerp', () => {
  const path = `/${topic.slug}/oefenen`;
  const other = TOPICS[1].skills[0].id;
  assert.equal(open(`${path}?soort=${soort}`).soort, soort);
  for (const bad of [other, 99999, 'abc', '']) {
    assert.equal(pathFor(open(`${path}?soort=${bad}`)), path, `soort=${bad}`);
  }
});

test('soort en seed wijzen samen naar precies één vraag', () => {
  const path = `/${topic.slug}/oefenen`;
  const view = open(`${path}?seed=k3x9q&soort=${soort}`);
  assert.deepEqual(view, { name: 'topic', slug: topic.slug, oefen: true, soort, seed: 33775406 });
  assert.equal(pathFor(view), `${path}?soort=${soort}&seed=k3x9q`);
  assert.deepEqual(open(`${path}?soort=${soort}&seed=0`).seed, 0);
  // Zonder vraagsoort zegt een seed niets, en een seed die niet kan, negeren we.
  assert.equal(pathFor(open(`${path}?seed=k3x9q`)), path);
  for (const bad of ['K3X9Q', '12345678', '']) {
    assert.equal(pathFor(open(`${path}?soort=${soort}&seed=${bad}`)), `${path}?soort=${soort}`);
  }
});

test('een adres dat niet bestaat toont geen ander scherm', () => {
  for (const address of [
    '/onzin',
    '/constructor',
    '/__proto__',
    '/constructor/oefenen',
    '/methode-indeling/onzin',
    '/proeftoets/onzin',
    `/${topic.slug}/onzin`,
    `/${topic.slug}/oefenen/onzin`,
    '/Over',
  ]) {
    const view = open(address);
    assert.equal(view.name, 'missing', address);
    assert.equal(pathFor(view), address, 'het adres blijft staan');
  }
});

test('een streep aan het eind maakt niet uit', () => {
  assert.deepEqual(open('/over/'), { name: 'over' });
  assert.deepEqual(open(`/${topic.slug}/`), { name: 'topic', slug: topic.slug });
  assert.deepEqual(open('/index.html'), { name: 'home' });
});

test('de filters van Kies uit je boek staan in het adres, in een vaste volgorde', () => {
  const view = open('/methode-indeling?leerjaar=9,3&niveau=vwo,havo,mbo&x=1');
  assert.deepEqual(view, { name: 'kies', filters: { niveau: ['havo', 'vwo'], leerjaar: ['3'] } });
  assert.equal(pathFor(view), '/methode-indeling?niveau=havo,vwo&leerjaar=3');
  assert.deepEqual(open(pathFor(view)), view, 'heen en terug');
  assert.deepEqual(open('/methode-indeling?niveau=mbo&methode='), { name: 'kies' });
  assert.deepEqual(open('/methode-indeling?methode=getal-en-ruimte&editie=13'), {
    name: 'kies',
    filters: { methode: ['getal-en-ruimte'], editie: ['13'] },
  });
});

test('Azure toont Home ook op /index, en dan gaat het adres naar /', () => {
  for (const address of ['/index', '/index/', '/index.html']) {
    assert.deepEqual(open(address), { name: 'home' }, address);
    assert.equal(pathFor(open(address)), '/', address);
  }
});

test('elk scherm hoort bij een deel van het menu en het kruimelpad eindigt bij het scherm', () => {
  const t = TOPICS.find((x) => x.slug === 'gelijkvormige-driehoeken');
  const crumbs = (address) =>
    crumbsFor(open(address)).map((c) => (c.path ? `${c.text} ${c.path}` : c.text));
  assert.deepEqual(crumbs('/'), [], 'Home heeft geen kruimelpad');
  assert.deepEqual(crumbs('/meetkunde'), ['Home /', 'Meetkunde']);
  assert.deepEqual(crumbs(`/${t.slug}`), ['Home /', 'Meetkunde /meetkunde', t.title]);
  assert.deepEqual(crumbs(`/${t.slug}/oefenen`), [
    'Home /',
    'Meetkunde /meetkunde',
    `${t.title} /${t.slug}`,
    'Oefenen',
  ]);
  assert.deepEqual(crumbs('/methode-indeling/getal-en-ruimte-13-havo-3'), [
    'Home /',
    'Mijn stof /mijn-stof',
    'Kies uit je boek /methode-indeling',
    'Getal & Ruimte, 13e editie, havo 3',
  ]);
  assert.deepEqual(crumbs('/mijn-stof/oefenen'), ['Home /', 'Mijn stof /mijn-stof', 'Oefenen']);
  assert.deepEqual(crumbs('/proeftoets/uitslag'), [
    'Home /',
    'Proeftoets /proeftoets',
    'Je resultaat',
  ]);
  assert.deepEqual(crumbs('/privacy'), ['Home /', 'Privacy']);
  assert.deepEqual(crumbs('/onzin'), ['Home /', 'Pagina niet gevonden']);
  // Elke link in een kruimelpad gaat naar een adres dat bestaat.
  const views = [
    ...TOPICS.map((x) => ({ name: 'topic', slug: x.slug, oefen: true })),
    ...MAPPINGS.map((m) => ({ name: 'mapping', id: m.id })),
    { name: 'toetsres' },
    { name: 'stofoefen', slug: 'mijn-stof' },
  ];
  for (const view of views) {
    const list = crumbsFor(view);
    assert.equal(list.at(-1).path, undefined, 'het scherm zelf is geen link');
    for (const c of list.slice(0, -1)) assert.notEqual(open(c.path).name, 'missing', c.path);
  }
  const sections = {
    '/': 'home',
    '/meetkunde': 'home',
    [`/${t.slug}/oefenen`]: 'home',
    '/methode-indeling': 'stof',
    '/mijn-stof/oefenen': 'stof',
    '/proeftoets/uitslag': 'toets',
    '/over': null,
    '/onzin': null,
  };
  for (const [address, section] of Object.entries(sections)) {
    assert.equal(sectionFor(open(address)), section, address);
  }
});

test('elk domein heeft een eigen adres', () => {
  for (const d of DOMAINS) {
    const view = { name: 'domain', slug: d.slug };
    assert.equal(pathFor(view), `/${d.slug}`);
    assert.deepEqual(open(`/${d.slug}`), view);
    assert.equal(titleFor(view), `${d.name} | Wiskundefit`);
    assert.equal(open(`/${d.slug}/oefenen`).name, 'missing');
  }
});
