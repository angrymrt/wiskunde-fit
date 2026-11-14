// data/vragen-tellen.json hoort bij de generatoren. Verandert een generator zo dat het aantal
// verschillende vragen anders kan zijn, dan faalt deze test tot npm run vragen-tellen is gedraaid
// (#22). Dat duurt een paar minuten en telt alles opnieuw.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import TELLEN from '../data/vragen-tellen.json' with { type: 'json' };
import { TOPICS } from '../src/js/topics/index.js';
import { controles, sleutel, tel } from '../scripts/vragen-tellen.js';

const skills = TOPICS.flatMap((t) => t.skills);

test('elke soort vraag heeft een aantal, en een soort die stopte niet meer', () => {
  assert.deepEqual(
    Object.keys(TELLEN.soorten)
      .map(Number)
      .sort((a, b) => a - b),
    skills.map((k) => k.id).sort((a, b) => a - b),
  );
  assert.equal(TELLEN.voorbeeld, undefined, 'dit zijn nog voorbeeldcijfers');
});

test('de aantallen kloppen nog met de generatoren (draai npm run vragen-tellen)', () => {
  const nu = controles(skills);
  const oud = skills.filter((k) => TELLEN.soorten[k.id]?.controle !== nu[k.id]);
  assert.deepEqual(
    oud.map((k) => k.id),
    [],
    'Deze soorten zijn veranderd sinds het laatste tellen: draai npm run vragen-tellen.',
  );
});

test('een exact aantal is een geheel getal van minstens 1, een schatting ook', () => {
  for (const [id, s] of Object.entries(TELLEN.soorten)) {
    assert.ok(Number.isFinite(s.aantal) && s.aantal >= 1, `soort ${id}: ${s.aantal}`);
    assert.equal(typeof s.exact, 'boolean');
  }
});

test('tel geeft een klein voorbeeld precies', () => {
  const schuin = skills.find((k) => k.name === 'Schuine zijde');
  assert.deepEqual(tel(schuin), { aantal: 5776, exact: true });
});

test('twee antwoordvolgordes van meerkeuze zijn dezelfde vraag', () => {
  const a = { q: 'x', mc: { opts: ['1', '2', '3'], a: 0 } };
  const b = { q: 'x', mc: { opts: ['3', '1', '2'], a: 1 } };
  const c = { q: 'x', mc: { opts: ['1', '2', '3'], a: 1 } };
  assert.equal(sleutel(a), sleutel(b));
  assert.notEqual(sleutel(a), sleutel(c));
});
