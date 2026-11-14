// De vergelijking van scripts/lighthouse.js: de middelste meting en de tabel, zonder Lighthouse zelf.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaan, meetMediaan, tabel, opmerking, PAGINAS } from '../scripts/lighthouse.js';

const meting = (p, a, b, lcp = 2000, tbt = 100, cls = 0) => ({
  performance: p,
  accessibility: a,
  'best-practices': b,
  'largest-contentful-paint': lcp,
  'total-blocking-time': tbt,
  'cumulative-layout-shift': cls,
});

test('de middelste van de metingen telt', () => {
  assert.equal(mediaan([90, 70, 95]), 90);
  const reeks = [meting(80, 100, 100), meting(99, 100, 100), meting(95, 100, 100)];
  let i = 0;
  assert.equal(meetMediaan('x', 3, () => reeks[i++]).performance, 95);
});

test('een score die 3 punten of meer lager is dan live krijgt een waarschuwing', () => {
  const t = tabel(PAGINAS[0], meting(98, 100, 100), meting(94, 100, 99));
  assert.match(t, /\| Prestaties \| 98 \| 94 \| -4 ⚠️ \|/);
  assert.match(t, /\| Beste werkwijzen \| 100 \| 99 \| -1 \|/);
  assert.match(t, /\| LCP \(s\) \| 2,0 \| 2,0 \| 0,0 \|/);
});

test('de opmerking begint met de markering waarmee de workflow hem terugvindt', () => {
  const l = { ...meting(98, 100, 100), metingen: 3 };
  const tekst = opmerking(
    'https://p',
    'https://l',
    [{ pagina: PAGINAS[0], live: l, preview: l }],
    3,
  );
  assert.ok(tekst.startsWith('<!-- lighthouse -->'));
});

test('een mislukte meting wordt overgeslagen en het aantal klopt', () => {
  const origineel = console.error;
  console.error = () => {};
  try {
    let i = 0;
    const r = meetMediaan('x', 3, () => {
      if (i++ === 1) throw new Error('mislukt');
      return meting(90, 100, 100);
    });
    assert.equal(r.metingen, 2);
    assert.throws(
      () =>
        meetMediaan('x', 2, () => {
          throw new Error('mislukt');
        }),
      /mislukt/,
    );
  } finally {
    console.error = origineel;
  }
});

test('een verschil rekent met de getoonde getallen en toont geen -0', () => {
  const t = tabel(PAGINAS[0], meting(100, 100, 100, 2000, 5.4), meting(100, 100, 100, 2000, 10.4));
  assert.match(t, /\| TBT \(ms\) \| 5 \| 10 \| \+5 \|/);
  assert.match(t, /\| CLS \| 0,000 \| 0,000 \| 0,000 \|/);
});
