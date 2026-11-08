// Controleert dat de schermen in Node te maken zijn, zonder DOM. Zo kan de build de pagina's vooraf
// maken met dezelfde code als de browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { MAPPINGS } from '../src/js/mappings/index.js';
import { prog } from '../src/js/progress.js';
import { ALL_IDS } from '../src/js/stof.js';
import { DOMAINS, TOPICS } from '../src/js/topics/index.js';

const ui = new URL('../src/js/ui/', import.meta.url);

test('elk bestand in ui/ is te importeren zonder document', async () => {
  assert.equal(typeof document, 'undefined');
  for (const file of await readdir(ui)) {
    await assert.doesNotReject(import(new URL(file, ui)), file);
  }
});

// Alles wat straks een eigen, vooraf gebouwde pagina krijgt.
const PAGES = [
  { name: 'home' },
  { name: 'kies' },
  { name: 'over' },
  { name: 'privacy' },
  { name: 'contact' },
  { name: 'missing', path: '/bestaat-niet' },
  ...DOMAINS.map((d) => ({ name: 'domain', slug: d.slug })),
  ...TOPICS.map((t) => ({ name: 'topic', slug: t.slug })),
  ...MAPPINGS.map((m) => ({ name: 'mapping', id: m.id })),
];

test('elk scherm heeft precies één kop, en een vooraf gebouwde pagina is steeds gelijk', async () => {
  const { screenHTML } = await import(new URL('screens.js', ui));
  const { state } = await import(new URL('state.js', ui));
  const show = (view) => {
    state.view = view;
    return screenHTML();
  };
  for (const view of PAGES) {
    const html = show(view);
    const where = JSON.stringify(view);
    assert.equal(html.match(/<h1[\s>]/g)?.length, 1, where);
    assert.match(html, /<main class="screen" id="inhoud">/, where);
    assert.equal(show(view), html, `${where} geeft twee keer dezelfde HTML`);
  }
  // De schermen die afhangen van de browser, kunnen ook zonder DOM.
  prog.stof = ALL_IDS;
  try {
    for (const view of [
      { name: 'stof' },
      { name: 'stofoefen', slug: 'mijn-stof' },
      { name: 'toets' },
      { name: 'toetsres' },
      ...TOPICS.map((t) => ({ name: 'topic', slug: t.slug, oefen: true })),
    ]) {
      assert.equal(show(view).match(/<h1[\s>]/g)?.length, 1, JSON.stringify(view));
    }
  } finally {
    prog.stof = null;
  }
});

test('een rooster heeft geen id, en een oude proeftoets toont nog de getekende lijn', async () => {
  const { drawnResult, graph } = await import('../src/js/figures.js');
  const fig = graph({ xr: [-5, 5], yr: [-5, 5], draw: true });
  assert.equal(graph({ xr: [-5, 5], yr: [-5, 5], draw: true }), fig, 'twee keer dezelfde tekst');
  assert.doesNotMatch(fig, / id="/);
  // Zo zag een rooster eruit in versie 1.6.0. Een proeftoets van toen kan nog in de browser staan.
  const old = fig.replace(
    /<svg class="drawn"[^>]*><\/svg>/,
    '<g class="drawn" clip-path="url(#c7)"></g>',
  );
  for (const [f, tag] of [
    [fig, 'svg'],
    [old, 'g'],
  ]) {
    const result = drawnResult(
      f,
      [
        [0, 1],
        [2, 5],
      ],
      { a: 2, b: 1 },
      true,
    );
    assert.match(
      result,
      new RegExp(`class="drawn"[^>]*><line class="l1"[^]*</${tag}></svg>$`),
      tag,
    );
  }
});

test('een widget staat al getekend in de uitleg', async () => {
  const { vTopic } = await import(new URL('topic.js', ui));
  const { state } = await import(new URL('state.js', ui));
  const withWidget = TOPICS.filter((t) => t.learn.some((b) => b.widget));
  assert.ok(withWidget.length > 0);
  for (const t of withWidget) {
    state.view = { name: 'topic', slug: t.slug };
    const found = [...vTopic(t).matchAll(/<div data-widget="\w+">([^]*?)<\/div><\/div>/g)];
    assert.equal(found.length, t.learn.filter((b) => b.widget).length, t.slug);
    for (const [, inner] of found) assert.match(inner, /<svg/, t.slug);
  }
});
