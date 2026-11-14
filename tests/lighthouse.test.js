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
  const l = meting(98, 100, 100);
  const tekst = opmerking(
    'https://p',
    'https://l',
    [{ pagina: PAGINAS[0], live: l, preview: l }],
    3,
  );
  assert.ok(tekst.startsWith('<!-- lighthouse -->'));
});
