// Termen met uitleg (#39): de markering in T, de knoppen en de woordenlijst.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { T } from '../src/js/typeset.js';
import { termen } from '../src/js/ui/termen.js';
import { WOORDEN, termenIn, termenLijstHTML } from '../src/js/woorden.js';
import { MARKERING, metTermenLijst } from '../scripts/termenlijst.js';
import { TOPIC } from '../src/js/topics/index.js';

test('T zet {{id|woord}} om naar een term en laat de rest staan', () => {
  assert.equal(
    T('Het {{snijpunt|snijpunt}} met x'),
    'Het <span class="term" data-term="snijpunt">snijpunt</span> met <span class="v">x</span>',
  );
  assert.equal(T('{3/4}'), '<span class="f"><span>3</span><span>4</span></span>');
});

test('een term wordt één keer een knop, de rest gewone tekst', () => {
  const html = T('{{snijpunt|snijpunt}} en nog een {{snijpunt|snijpunt}}');
  const uit = termen(html);
  assert.equal(uit.match(/<span class="term"/g).length, 1);
  assert.equal(uit.replace(/<[^>]+>/g, ''), 'snijpunt en nog een snijpunt');
});

test('{{=id|woord}} markeert de plek waar de term wordt uitgelegd', () => {
  assert.equal(
    T('{{=snijpunt|snijpunt}}'),
    '<span class="term" data-term="snijpunt" id="snijpunt">snijpunt</span>',
  );
});

test('de plek waar een term wordt uitgelegd houdt zijn id, ook als de term er al stond', () => {
  const uit = termen(`${T('{{snijpunt|snijpunt}}')} en ${T('{{=snijpunt|snijpunt}}')}`);
  assert.match(uit, /id="snijpunt">snijpunt<\/span>/);
  assert.equal(uit.match(/<span class="term"/g).length, 1);
});

test('in de proeftoets zijn termen gewone tekst', () => {
  const uit = termen(T('Het {{snijpunt|snijpunt}}'), false);
  assert.equal(uit, 'Het snijpunt');
});

const TOPIC_VAN_BESTAND = Object.fromEntries(
  Object.values(TOPIC).map((t) => [`${t.slug}.js`, t.slug]),
);

test('elke term in de stof staat in de woordenlijst, en elke term heeft een uitleg', () => {
  const dir = new URL('../src/js/topics/', import.meta.url);
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    for (const m of src.matchAll(/\{\{(=?)([a-z-]+)\|/g)) {
      assert.ok(WOORDEN[m[2]], `${f}: de term ${m[2]} staat niet in woorden.js`);
      if (m[1])
        assert.equal(
          WOORDEN[m[2]].onderwerp,
          TOPIC_VAN_BESTAND[f],
          `${f}: {{=${m[2]}|...}} hoort in het onderwerp ${WOORDEN[m[2]].onderwerp}`,
        );
    }
  }
  for (const [id, w] of Object.entries(WOORDEN)) {
    assert.match(id, /^[a-z-]+$/);
    assert.ok(w.naam && w.uitleg, `${id} heeft een naam en een uitleg nodig`);
    if (w.onderwerp) assert.ok(TOPIC[w.onderwerp], `${id}: onderwerp ${w.onderwerp} bestaat niet`);
  }
});

test('de lijst met woorden heeft elke term één keer, in de volgorde van de tekst', () => {
  const html = `${T('{{snijpunt|snijpunt}}')} ${T('{{richtingscoefficient|rc}}')} ${T('{{snijpunt|snijpunt}}')}`;
  assert.deepEqual(termenIn(html), ['snijpunt', 'richtingscoefficient', 'snijpunt']);
  const lijst = termenLijstHTML(termenIn(html));
  assert.equal(lijst.match(/<dt>/g).length, 2);
  assert.ok(lijst.indexOf('snijpunt') < lijst.indexOf('richtingscoëfficiënt'));
  assert.equal(termenLijstHTML([]), '');
  assert.equal(termenLijstHTML(['bestaat-niet']), '');
});

test('de build zet de lijst op de markering, met alleen de termen uit de uitleg', () => {
  const rc = T('{{richtingscoefficient|rc}}'),
    sp = T('{{snijpunt|snijpunt}}');
  const html = `<p>${rc}</p><div class="topic-body">${sp}${MARKERING}</div><div class="practice-bar">`;
  const uit = metTermenLijst(html);
  assert.equal(uit.match(/class="block termen"/g).length, 1);
  assert.ok(uit.includes(`</dl></div>${MARKERING}</div>`), 'de lijst staat vlak voor de markering');
  assert.ok(
    !uit.includes('<dt>richtingscoëfficiënt'),
    'een term buiten de uitleg staat niet in de lijst',
  );
  assert.ok(uit.includes('<dt>snijpunt'));
});

test('zonder termen blijft de markering staan, en een pagina zonder uitleg verandert niet', () => {
  const zonder = `<div class="topic-body">tekst${MARKERING}</div>`;
  assert.equal(metTermenLijst(zonder), zonder);
  assert.equal(metTermenLijst('<main>Home</main>'), '<main>Home</main>');
});

test('een uitleg zonder markering geeft een fout in de build', () => {
  assert.throws(() => metTermenLijst('<div class="topic-body">tekst</div>'), /markering/);
});

test('de lijst komt er letterlijk in, zonder dat tekens als patroon gelden', () => {
  const lijst = termenLijstHTML(['snijpunt']);
  const html = `<div class="topic-body">${T('{{snijpunt|snijpunt}}')}${MARKERING}</div>`;
  assert.ok(metTermenLijst(html).includes(lijst));
});
