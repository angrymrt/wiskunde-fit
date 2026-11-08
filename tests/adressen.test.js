// Controleert dat bij elk scherm één adres hoort en dat adressen die niet bestaan ook niets tonen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPPINGS } from '../src/js/mappings/index.js';
import { pathFor, titleFor, viewFor } from '../src/js/routes.js';
import { TOPICS } from '../src/js/topics/index.js';

const open = (address) => {
  const { pathname, search } = new URL(address, 'https://wiskundefit.nl');
  return viewFor(pathname, search);
};
const [topic] = TOPICS;
const soort = topic.skills[0].id;

test('elk scherm heeft het adres uit de roadmap', () => {
  const screens = [
    ['/', { name: 'home' }],
    ['/methode-indeling', { name: 'kies' }],
    ['/jouw-stof', { name: 'stof' }],
    ['/jouw-stof/oefenen', { name: 'stofoefen', slug: 'jouw-stof' }],
    ['/proeftoets', { name: 'toets' }],
    ['/proeftoets/uitslag', { name: 'toetsres' }],
    ['/over', { name: 'over' }],
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
