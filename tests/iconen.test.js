// De plaatjes bij 5 goede antwoorden achter elkaar: elk id is uniek, de tekeningen zijn
// geldige SVG-stukken, en de kansen kloppen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GROEPEN, ICONEN, kansVan, kiesIcoon, totaal } from '../src/js/iconen.js';

test('elk plaatje heeft een uniek id, een naam en een tekening', () => {
  assert.ok(ICONEN.length >= 10);
  assert.equal(new Set(ICONEN.map((i) => i.id)).size, ICONEN.length);
  for (const i of ICONEN) {
    assert.match(i.id, /^[a-z][a-z0-9-]*$/, i.id);
    assert.ok(i.naam, i.id);
    assert.match(i.svg, /^<(path|g|ellipse|circle)/, i.id);
    // Alleen tekenvormen: geen scripts, geen verwijzingen en geen gebeurtenissen.
    assert.doesNotMatch(i.svg, /<script|<foreignObject|<image|href=|\son[a-z]+=/i, i.id);
    // Elke tag is gesloten en de aanhalingstekens kloppen.
    assert.equal((i.svg.match(/"/g) || []).length % 2, 0, i.id);
    assert.equal((i.svg.match(/</g) || []).length, (i.svg.match(/>/g) || []).length, i.id);
    if (i.g) assert.ok(i.g in GROEPEN, `${i.id}: onbekende groep`);
    else assert.ok(i.w > 0, `${i.id}: gewicht`);
  }
});

test('de kansen tellen op tot 100 procent en de ster komt het vaakst', () => {
  const som = ICONEN.reduce((t, i) => t + kansVan(i), 0);
  assert.ok(Math.abs(som - 100) < 1e-9, String(som));
  const ster = ICONEN.find((i) => i.id === 'ster');
  assert.ok(ICONEN.every((i) => i === ster || kansVan(i) < kansVan(ster)));
  assert.ok(totaal() > 0);
});

test('kiesIcoon geeft bij elk getal een plaatje en vindt ze allemaal', () => {
  const gezien = new Set();
  for (let a = 0; a < 1; a += 0.001)
    for (const b of [0, 0.34, 0.67, 0.999]) gezien.add(kiesIcoon(a, b).id);
  assert.deepEqual([...gezien].sort(), ICONEN.map((i) => i.id).sort());
  // De uiterste waarden vallen niet buiten de lijst.
  for (const r of [0, 0.999999999]) assert.ok(ICONEN.includes(kiesIcoon(r, r)));
});

test('de verdeling volgt de kansen', () => {
  const telling = new Map();
  const n = 200000;
  // Een vaste reeks getallen (mulberry32), zodat de test niet van toeval afhangt.
  let x = 12345;
  const volgende = () => {
    x = (x + 0x6d2b79f5) | 0;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let k = 0; k < n; k++) {
    const i = kiesIcoon(volgende(), volgende());
    telling.set(i.id, (telling.get(i.id) || 0) + 1);
  }
  for (const i of ICONEN) {
    const gemeten = ((telling.get(i.id) || 0) / n) * 100;
    assert.ok(
      Math.abs(gemeten - kansVan(i)) < 0.6,
      `${i.id}: ${gemeten.toFixed(2)} tegen ${kansVan(i).toFixed(2)}`,
    );
  }
});
