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

test('Kies uit je boek toont de boeken die bij de filters passen, met je boek bovenaan', async () => {
  const { vPick } = await import(new URL('stof.js', ui));
  const { state } = await import(new URL('state.js', ui));
  const { FILTERS } = await import('../src/js/mappings/index.js');
  const books = (filters) => {
    state.view = filters ? { name: 'kies', filters } : { name: 'kies' };
    const html = vPick();
    return {
      html,
      ids: [...html.matchAll(/data-act="kiesgo" data-id="([^"]+)"/g)].map((m) => m[1]),
      status: html.match(/<p role="status">([^<]*)<\/p>/)[1],
    };
  };
  assert.deepEqual(
    FILTERS.map((f) => [f.key, f.options]),
    [
      ['niveau', ['havo', 'vwo']],
      ['leerjaar', ['1', '2', '3']],
      ['methode', ['getal-en-ruimte']],
      ['editie', ['13']],
    ],
  );
  // Zonder filters de hele lijst, zoals zonder JavaScript.
  const all = books();
  assert.deepEqual(all.ids, ['gr13-hv1', 'gr13-hv2', 'gr13-havo3']);
  assert.equal(all.status, '3 boeken');
  assert.doesNotMatch(all.html, /Mijn boek/);
  assert.match(all.html, /10 van de 46 paragrafen kun je hier oefenen\./);
  assert.match(all.html, /9 van de 39 paragrafen kun je hier deels oefenen\./);
  assert.match(all.html, /Deel 1 en deel 2, leerboek of FLEX-boek/);
  // Een boek voor havo/vwo hoort bij havo en bij vwo.
  assert.deepEqual(books({ niveau: ['vwo'] }).ids, ['gr13-hv1', 'gr13-hv2']);
  assert.deepEqual(books({ niveau: ['havo'] }).ids, ['gr13-hv1', 'gr13-hv2', 'gr13-havo3']);
  // Binnen een filter is één keuze genoeg, tussen de filters moet alles passen.
  assert.deepEqual(books({ leerjaar: ['1', '3'] }).ids, ['gr13-hv1', 'gr13-havo3']);
  const one = books({ niveau: ['vwo'], leerjaar: ['2'] });
  assert.deepEqual(one.ids, ['gr13-hv2']);
  assert.equal(one.status, '1 boek past bij je filters');
  // Het getal achter een keuze telt de andere filters mee, maar niet de eigen keuzes.
  assert.match(one.html, /data-id="niveau:havo">[^]*?\(1\)/);
  assert.match(one.html, /data-id="leerjaar:3">[^]*?\(0\)/);
  const none = books({ niveau: ['vwo'], leerjaar: ['3'] });
  assert.deepEqual(none.ids, []);
  assert.equal(none.status, 'Geen boek past bij je filters');
  assert.match(none.html, /data-act="boekfilterclear"/);
  // Mijn boek staat bovenaan, maar alleen als het bij de filters past.
  prog.mapping = 'gr13-havo3';
  try {
    const mine = books();
    assert.deepEqual(mine.ids, ['gr13-havo3', 'gr13-hv1', 'gr13-hv2']);
    assert.equal(mine.html.match(/Mijn boek/g).length, 1);
    assert.doesNotMatch(books({ niveau: ['vwo'] }).html, /Mijn boek/);
  } finally {
    prog.mapping = null;
  }
});

test('de knop Deel wijst naar precies deze vraag, en alleen als die een seed heeft', async () => {
  const { shareHTML } = await import(new URL('question-form.js', ui));
  const { state } = await import(new URL('state.js', ui));
  const { makeQuestion } = await import('../src/js/topics/index.js');
  const topic = TOPICS.at(-1);
  const skill = topic.skills.at(-1);
  const q = makeQuestion(skill, 33775406);
  const link = `/${topic.slug}/oefenen?soort=${skill.id}&amp;seed=k3x9q`;
  const share = shareHTML(skill, q);
  assert.match(
    share.button,
    new RegExp(`data-act="share" data-id="${link.replace(/\?/g, '\\?')}"`),
  );
  assert.match(share.note, /^<p class="small share-note" role="status"><\/p>$/);
  // Een vraag uit een proeftoets van voor de seed kun je niet delen.
  const { seed, ...old } = q;
  assert.equal(seed, 33775406);
  assert.deepEqual(shareHTML(skill, old), { button: '', note: '' });
  // Na het delen staat de melding bij die ene vraag, en lukte kopiëren niet, dan ook de link.
  const path = link.replace('&amp;', '&');
  try {
    state.shared = { path, url: `https://wiskundefit.nl${path}`, copied: true };
    assert.match(
      shareHTML(skill, q).note,
      /class="small share-note sr" role="status">Link gekopieerd\./,
    );
    assert.match(
      shareHTML(skill, q).button,
      /class="btn quiet share copied"[^]*>Gekopieerd<\/button>$/,
    );
    assert.match(shareHTML(skill, makeQuestion(skill, 1)).button, />Deel</);
    assert.doesNotMatch(shareHTML(skill, makeQuestion(skill, 1)).note, /gekopieerd/);
    state.shared.copied = false;
    assert.match(
      shareHTML(skill, q).note,
      /Kopiëren lukte niet[^]*readonly value="https:\/\/wiskundefit\.nl\//,
    );
  } finally {
    state.shared = null;
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
