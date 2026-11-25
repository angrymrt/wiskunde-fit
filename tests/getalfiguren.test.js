// Breukfiguren en getallenlijnen: breukFig() en getallenlijn() in src/js/getalfiguren.js. De tests
// rekenen na wat er getekend is (oppervlaktes, plekken van streepjes en punten) en kijken of de
// beschrijving voor een schermlezer alles noemt wat er staat, zonder het antwoord voor te zeggen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { breukFig, getallenlijn } from '../src/js/getalfiguren.js';

const label = (svg) => svg.match(/aria-label="([^"]*)"/)[1];
const texts = (svg) => [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1]);
const attrs = (tag) =>
  Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

// Geldige SVG: elke tag gaat dicht in de goede volgorde, de maten kloppen met de viewBox, er staan
// geen id's in (dan is dezelfde figuur niet steeds dezelfde tekst) en geen NaN of undefined.
function assertSvg(svg) {
  assert.match(
    svg,
    /^<svg class="fig" role="img" aria-label="[^"]+" width="(\d+)" height="(\d+)" viewBox="0 0 \1 \2">/,
  );
  assert.doesNotMatch(svg, / id="|NaN|undefined|Infinity/);
  const open = [];
  for (const [, close, name, self] of svg.matchAll(/<(\/?)(\w+)[^>]*?(\/?)>/g)) {
    if (close) assert.equal(open.pop(), name, `</${name}> sluit niet`);
    else if (!self) open.push(name);
  }
  assert.deepEqual(open, [], 'alles gaat dicht');
}

const BREUKEN = [
  { kind: 'cirkel', n: 8, on: [0, 1, 4] },
  { kind: 'cirkel', n: 3, on: 1 },
  { kind: 'cirkel', n: 1, on: 1 },
  { kind: 'vierkant', n: 4, on: [1] },
  { kind: 'rechthoek', n: 5, on: [0, 2, 3, 4], flat: true },
  { kind: 'strook', n: 10, on: 3 },
  { kind: 'rooster', rows: 3, cols: 4, on: [0, 1, 2, 3, 4, 6, 9] },
  { kind: 'rooster', rows: 10, cols: 10, on: 37 },
  { kind: 'rooster', rows: 4, cols: 4, on: [] },
];
const parts = (svg) => [...svg.matchAll(/<(rect|path|circle) class="bd( aan)?"[^>]*>/g)];

test('een breukfiguur tekent n gelijke delen, waarvan de gekleurde delen op hun plek', () => {
  for (const o of BREUKEN) {
    const svg = breukFig(o),
      n = o.kind === 'rooster' ? o.rows * o.cols : o.n,
      on = typeof o.on === 'number' ? [...Array(o.on).keys()] : o.on;
    assertSvg(svg);
    assert.equal(breukFig(o), svg, 'twee keer dezelfde tekst');
    const ps = parts(svg);
    assert.equal(ps.length, n, `${o.kind}: aantal delen`);
    assert.deepEqual(
      ps.map((m, k) => (m[2] ? k : -1)).filter((k) => k >= 0),
      [...on].sort((a, b) => a - b),
      `${o.kind}: de gekleurde delen`,
    );
    // Bij rechthoeken: de oppervlaktes samen zijn de hele vorm, en elk deel is even groot.
    if (o.kind !== 'cirkel') {
      const area = ps.map((m) => {
        const a = attrs(m[0]);
        return +a.width * +a.height;
      });
      const all = attrs(svg.match(/<rect class="s"[^>]*>/)[0]);
      assert.ok(Math.abs(area.reduce((s, x) => s + x, 0) - all.width * all.height) < n, o.kind);
      assert.ok(Math.max(...area) - Math.min(...area) < 0.5 * Math.max(...area) ** 0.5, o.kind);
    }
  }
  // Een cirkel begint boven en gaat met de klok mee: het eerste stuk ligt rechtsboven.
  const [first] = parts(breukFig({ kind: 'cirkel', n: 4, on: [0] }));
  assert.match(first[0], /d="M78 78L78 3A75 75 0 0 1 153 78Z"/);
});

test('de beschrijving van een breukfiguur noemt de delen, maar niet de breuk', () => {
  const desc = (o) => label(breukFig(o));
  assert.equal(
    desc(BREUKEN[0]),
    'Een cirkel in 8 gelijke stukken, zoals een taart. Met de klok mee vanaf boven: de stukken 1, 2 en 5 zijn gekleurd.',
  );
  assert.equal(
    desc(BREUKEN[4]),
    'Een rechthoek in 5 gelijke stroken onder elkaar. Van boven naar beneden: de stroken 1 en 3 tot en met 5 zijn gekleurd.',
  );
  assert.equal(
    desc(BREUKEN[6]),
    'Een rooster van 3 rijen met elk 4 gelijke hokjes. De rijen tellen van boven naar beneden en de hokjes in een rij van links naar rechts. Gekleurd: rij 1 helemaal; in rij 2 de hokjes 1 en 3; in rij 3 hokje 2.',
  );
  assert.match(
    desc(BREUKEN[7]),
    /Gekleurd: de rijen 1 tot en met 3 helemaal; in rij 4 de hokjes 1 tot en met 7\.$/,
  );
  assert.match(desc(BREUKEN[8]), /Geen enkel hokje is gekleurd\./);
  for (const o of BREUKEN) {
    const d = desc(o);
    // Geen breuk, geen "3 van de 8" en bij een rooster niet het totaal aantal hokjes.
    assert.doesNotMatch(d, /\d\/\d|van de \d|waarvan/, d);
    if (o.kind === 'rooster') assert.doesNotMatch(d, new RegExp(`\\b${o.rows * o.cols}\\b`), d);
  }
  // Met count staat alleen hoeveel delen gekleurd zijn, voor een figuur die geen vraag is.
  assert.equal(
    desc({ ...BREUKEN[0], count: true }),
    'Een cirkel in 8 gelijke stukken, zoals een taart. 3 stukken zijn gekleurd.',
  );
  assert.equal(desc({ ...BREUKEN[0], desc: 'Eigen tekst' }), 'Eigen tekst');
  assert.throws(() => breukFig({ kind: 'cirkel', n: 4, on: [4] }));
  assert.throws(() => breukFig({ kind: 'zeshoek', n: 4 }));
});

const LIJNEN = [
  {
    xr: [-5, 5],
    pts: [
      { x: -2.5, label: 'A' },
      { x: 3, label: 'B' },
    ],
  },
  {
    xr: [-10, 10],
    arrows: [
      { from: 3, to: 7, t: '+4' },
      { from: 7, to: -2, t: '-9' },
    ],
  },
  { xr: [-3, 3], step: 0.5, pts: [{ x: -2.5, label: 'P', t: '−2 1/2' }] },
  { xr: [0, 2], step: 1 / 3, pts: [{ x: 1 / 3, label: 'C' }, { x: 5 / 3 }] },
  { xr: [-100, 100], step: 10 },
  { xr: [-6, 6], pts: [{ x: -4, label: 'K' }], arrows: [{ from: -4, to: 1 }] },
];
// Waar een streepje of punt staat, in pixels, en welk getal eronder staat.
const ticksOf = (svg) =>
  [...svg.matchAll(/<path class="ax" d="M([\d.]+) [\d.]+v/g)].map((m) => +m[1]);
const numbersOf = (svg) =>
  [...svg.matchAll(/<text class="tn" text-anchor="middle" x="([\d.]+)"[^>]*>([^<]+)</g)].map(
    (m) => [+m[1], m[2]],
  );
const value = (s) => +s.replace('−', '-').replace(',', '.');

test('een getallenlijn heeft een streepje per stap en de getallen op hun plek', () => {
  for (const o of LIJNEN) {
    const svg = getallenlijn(o),
      [lo, hi] = o.xr,
      step = o.step || 1,
      t = ticksOf(svg);
    assertSvg(svg);
    assert.equal(getallenlijn(o), svg, 'twee keer dezelfde tekst');
    assert.equal(t.length, Math.round((hi - lo) / step) + 1, 'een streepje per stap');
    const u = t[1] - t[0];
    t.forEach((x, k) => assert.ok(Math.abs(x - t[0] - k * u) < 0.11, 'gelijke afstanden'));
    // Elk getal staat onder het streepje dat erbij hoort, met het minteken −, en ze raken elkaar niet.
    const ns = numbersOf(svg);
    assert.ok(ns.length >= 3, 'genoeg getallen');
    for (const [x, s] of ns) {
      assert.doesNotMatch(s, /-/);
      assert.ok(Math.abs(t[0] + ((value(s) - lo) / step) * u - x) < 0.11, `${s} staat goed`);
    }
    for (let k = 1; k < ns.length; k++)
      assert.ok(
        ns[k][0] - ns[k - 1][0] >= 4 * Math.max(ns[k][1].length, ns[k - 1][1].length) + 6,
        'ruimte',
      );
    // Een punt staat op zijn getal, ook tussen twee streepjes.
    const dots = [...svg.matchAll(/<circle class="dot" cx="([\d.]+)"/g)].map((m) => +m[1]);
    (o.pts || []).forEach((p, k) =>
      assert.ok(Math.abs(t[0] + ((p.x - lo) / step) * u - dots[k]) < 0.11),
    );
    // Op een telefoon van 320 pixels breed is er ongeveer 230 pixels ruimte; meer dan een beetje
    // kleiner wordt de lijn standaard niet.
    assert.ok(+svg.match(/width="(\d+)"/)[1] <= 250, 'smal genoeg');
    // Alles wat er staat, staat ook in de beschrijving.
    // Staat onder elk streepje een getal, dan zegt de beschrijving dat, met het begin en het eind.
    const d = label(svg),
      every = d.includes('Onder elk streepje staat het getal.');
    for (const w of texts(svg).filter((w) => !every || !ns.some(([, s]) => s === w)))
      assert.ok(d.includes(w.replace('-', '−')), `"${w}" in de beschrijving`);
  }
});

test('de beschrijving van een getallenlijn noemt punten en pijlen, of alleen de volgorde', () => {
  const desc = (o) => label(getallenlijn(o));
  assert.equal(
    desc(LIJNEN[0]),
    'Een getallenlijn van −5 tot 5, met een streepje bij elk geheel getal. Onder elk streepje staat het getal. Punt A staat bij −2,5 en punt B staat bij 3.',
  );
  assert.equal(
    desc(LIJNEN[1]),
    'Een getallenlijn van −10 tot 10, met een streepje bij elk geheel getal. Getallen staan alleen onder −10, −5, 0, 5 en 10. Boven de lijn staan 2 pijlen boven elkaar; de eerste staat het laagst. De eerste pijl gaat van 3 naar 7, naar rechts, met +4 erboven. De tweede pijl gaat van 7 naar −2, naar links, met −9 erboven.',
  );
  assert.match(desc(LIJNEN[2]), /Punt P staat bij −2 1\/2\./);
  assert.match(
    desc(LIJNEN[3]),
    /streepje bij elke 1\/3\. .*Punt C staat bij 1\/3\. Een stip staat bij 1 2\/3\./,
  );
  // Met coords: false alleen de volgorde en de richting: bij aflezen zijn de getallen het antwoord.
  const zonder = desc({ ...LIJNEN[0], pts: [...LIJNEN[0].pts].reverse(), coords: false });
  assert.match(zonder, /Op de lijn staan van links naar rechts de punten A en B\.$/);
  assert.doesNotMatch(zonder, /2,5|bij 3/);
  assert.match(
    desc({ ...LIJNEN[1], coords: false }),
    /De eerste pijl wijst naar rechts, met \+4 erboven\. De tweede pijl wijst naar links, met −9 erboven\.$/,
  );
  assert.match(
    desc({ xr: [-5, 5], arrows: [{ from: -2, to: 3, t: '+5' }], coords: false }),
    /Boven de lijn staat een pijl die naar rechts wijst, met \+5 erboven\.$/,
  );
  // De pijl wijst naar to: de punt staat bij het eind, aan de goede kant.
  const svg = getallenlijn(LIJNEN[5]),
    t = ticksOf(svg),
    arrow = svg.match(/<path class="l2" d="M([\d.]+) [\d.]+v10M[\d.]+ [\d.]+H([\d.]+)m-7 -5l7 5/);
  assert.ok(arrow, 'punt naar rechts');
  assert.ok(
    Math.abs(+arrow[1] - t[2]) < 0.11 && Math.abs(+arrow[2] - t[7]) < 0.11,
    'van −4 naar 1',
  );
  assert.throws(() => getallenlijn({ xr: [-5, 5], pts: [{ x: 6, label: 'Z' }] }));
  assert.throws(() => getallenlijn({ xr: [0, 1], step: 0.3 }));
});
