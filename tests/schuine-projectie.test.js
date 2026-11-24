// Ruimtefiguren in schuine projectie: solid() en solidFacts() in src/js/figures.js. De tests rekenen
// de aantallen na met de formules, en de gestippelde ribben met een eigen manier: een punt van de
// ribbe ligt achter een zijvlak dat ervoor staat.
import test from 'node:test';
import assert from 'node:assert/strict';
import { solid, solidFacts } from '../src/js/figures.js';

const label = (svg) => svg.match(/aria-label="([^"]*)"/)[1];
const textsOf = (svg, re) => [...svg.matchAll(re)].map((m) => m[1]);
// Alles wat in de figuur geschreven staat: de letters (class ti) en de lengtes (class tv).
const written = (svg) => textsOf(svg, /<text class="t[iv][^"]*"[^>]*>([^<]+)<\/text>/g);

const SHAPES = [
  { kind: 'kubus' },
  { kind: 'kubus', l: 4, grid: true },
  { kind: 'balk', l: 5, b: 2, h: 3 },
  ...[3, 4, 5, 6, 7, 8].flatMap((n) => [
    { kind: 'prisma', n },
    { kind: 'prisma', n, lying: true, h: 4 },
    { kind: 'prisma', n, cw: true, grid: true },
    { kind: 'piramide', n, h: 4 },
  ]),
  {
    kind: 'prisma',
    base: [
      [0, 0],
      [4, 0],
      [3, 2],
      [1, 3],
    ],
  },
  {
    kind: 'prisma',
    lying: true,
    base: [
      [0, 0],
      [4, 0],
      [2, 3],
    ],
    h: 4,
  },
  {
    kind: 'piramide',
    base: [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ],
    top: [1, 1],
    h: 3,
  },
  {
    kind: 'piramide',
    base: [
      [0, 0],
      [4, 0],
      [4, 3],
      [0, 3],
    ],
    top: [0, 0],
    h: 4,
  },
];

// De richting waarin een punt in de tekening niet verschuift: naar achteren, naar links en omlaag.
const BACK = [-0.5, 1, -0.5];
const proj = ([x, y, z]) => [x + y / 2, z + y / 2];
const sub = (p, q) => p.map((c, i) => c - q[i]);
const dot = (p, q) => p.reduce((t, c, i) => t + c * q[i], 0);
const cross = (p, q) => [
  p[1] * q[2] - p[2] * q[1],
  p[2] * q[0] - p[0] * q[2],
  p[0] * q[1] - p[1] * q[0],
];
// Ligt het punt in de tekening strikt binnen de convexe veelhoek?
function inside([x, y], poly) {
  const s = poly.map((p, i) => {
    const q = poly[(i + 1) % poly.length];
    return (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]);
  });
  return s.every((v) => v > 1e-6) || s.every((v) => v < -1e-6);
}
// Staat er een zijvlak vóór dit punt, zodat je het punt niet ziet?
function covered(p, facts) {
  return facts.faces.some((f) => {
    const pts = [...f].map((k) => facts.pts[k]),
      n = cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])),
      along = dot(n, BACK);
    if (Math.abs(along) < 1e-9) return false;
    // Het punt van het zijvlak dat in de tekening op p valt: p + t·BACK. Bij t < 0 ligt het ervoor.
    const t = dot(n, sub(pts[0], p)) / along;
    return t < -1e-6 && inside(proj(p), pts.map(proj));
  });
}

test('de aantallen kloppen met de formules', () => {
  for (const n of [3, 4, 5, 6, 7, 8]) {
    for (const lying of [false, true]) {
      const f = solidFacts({ kind: 'prisma', n, lying });
      assert.equal(f.vertices.length, 2 * n, `hoekpunten prisma ${n}`);
      assert.equal(f.edges.length, 3 * n, `ribben prisma ${n}`);
      assert.equal(f.faces.length, n + 2, `zijvlakken prisma ${n}`);
    }
    const p = solidFacts({ kind: 'piramide', n });
    assert.equal(p.vertices.length, n + 1, `hoekpunten piramide ${n}`);
    assert.equal(p.edges.length, 2 * n, `ribben piramide ${n}`);
    assert.equal(p.faces.length, n + 1, `zijvlakken piramide ${n}`);
  }
  for (const kind of ['kubus', 'balk']) {
    const f = solidFacts({ kind });
    assert.deepEqual([f.vertices.length, f.edges.length, f.faces.length], [8, 12, 6], kind);
  }
});

test('elke ribbe hoort bij precies twee zijvlakken, en de letters volgen het boek', () => {
  for (const opts of SHAPES) {
    const f = solidFacts(opts),
      name = JSON.stringify(opts);
    // Euler: hoekpunten − ribben + zijvlakken = 2.
    assert.equal(f.vertices.length - f.edges.length + f.faces.length, 2, name);
    assert.equal(new Set(f.edges).size, f.edges.length, `dubbele ribbe: ${name}`);
    for (const e of f.edges) {
      const around = f.faces.filter((face) =>
        [...face].some((k, i) => {
          const q = face[(i + 1) % face.length];
          return (k === e[0] && q === e[1]) || (k === e[1] && q === e[0]);
        }),
      );
      assert.equal(around.length, 2, `ribbe ${e} in ${around.length} zijvlakken: ${name}`);
    }
  }
  assert.equal(solidFacts({ kind: 'kubus' }).vertices.join(''), 'ABCDEFGH');
  const p5 = solidFacts({ kind: 'prisma', n: 5 });
  assert.equal(p5.base, 'ABCDE');
  assert.equal(p5.top, 'FGHIJ');
  const t5 = solidFacts({ kind: 'piramide', n: 5 });
  assert.equal(t5.vertices.join(''), 'TABCDE');
  assert.equal(t5.top, 'T');
  assert.ok(t5.edges.includes('TA'));
});

test('de letters gaan tegen de klok in, of met cw met de klok mee', () => {
  const ccw = solidFacts({ kind: 'kubus' }).pts;
  // Van bovenaf: A linksvoor, B rechtsvoor, C rechtsachter, D linksachter. E boven A.
  assert.deepEqual(
    [ccw.A, ccw.B, ccw.C, ccw.D, ccw.E],
    [
      [0, 0, 0],
      [3, 0, 0],
      [3, 3, 0],
      [0, 3, 0],
      [0, 0, 3],
    ],
  );
  const cw = solidFacts({ kind: 'kubus', cw: true }).pts;
  assert.deepEqual(
    [cw.A, cw.B, cw.D],
    [
      [0, 0, 0],
      [0, 3, 0],
      [3, 0, 0],
    ],
  );
  // Een eigen grondvlak met de klok mee wordt omgedraaid, en A blijft het eerste punt.
  const own = solidFacts({
    kind: 'prisma',
    base: [
      [0, 0],
      [0, 3],
      [4, 0],
    ],
  }).pts;
  assert.deepEqual(
    [own.A, own.B, own.C],
    [
      [0, 0, 0],
      [4, 0, 0],
      [0, 3, 0],
    ],
  );
});

test('een gestippelde ribbe zie je echt niet, en een volle wel', () => {
  for (const opts of SHAPES) {
    const svg = solid(opts),
      f = solidFacts(opts),
      name = JSON.stringify(opts),
      dashed = (svg.match(/<line class="s d"/g) ?? []).length,
      full = (svg.match(/<line class="s"/g) ?? []).length;
    assert.equal(dashed + full, f.edges.length, `elke ribbe één keer getekend: ${name}`);
    assert.equal(dashed, f.hidden.length, name);
    // De beschrijving noemt dezelfde gestippelde ribben.
    const said = label(svg).match(/Gestippeld: ([^.]*)\./)?.[1] ?? '';
    assert.deepEqual(
      said
        .split(/, | en /)
        .filter(Boolean)
        .sort(),
      [...f.hidden].sort(),
      name,
    );
    for (const e of f.edges) {
      const [p, q] = [f.pts[e[0]], f.pts[e[1]]],
        on = [0.2, 0.35, 0.5, 0.65, 0.8].map((t) => p.map((c, i) => c + t * (q[i] - c))),
        hits = on.filter((x) => covered(x, f)).length;
      if (f.hidden.includes(e)) assert.ok(hits > 0, `${e} is gestippeld maar zichtbaar: ${name}`);
      else assert.equal(hits, 0, `${e} is vol maar onzichtbaar: ${name}`);
    }
  }
});

test('de bekende gestippelde ribben van kubus, prisma en piramide', () => {
  assert.deepEqual(solidFacts({ kind: 'kubus' }).hidden, ['AD', 'CD', 'DH']);
  assert.deepEqual(solidFacts({ kind: 'balk', l: 6, b: 4, h: 2 }).hidden, ['AD', 'CD', 'DH']);
  assert.deepEqual(solidFacts({ kind: 'piramide', n: 4 }).hidden, ['TD', 'AD', 'CD']);
  // Een liggend driezijdig prisma: het grondvlak ABC vooraan, op ware grootte.
  const lying = solidFacts({
    kind: 'prisma',
    lying: true,
    base: [
      [0, 0],
      [4, 0],
      [2, 3],
    ],
    h: 4,
  });
  assert.deepEqual(lying.hidden, ['AD', 'DE', 'DF']);
  assert.deepEqual(lying.pts.C, [2, 0, 3]);
});

test('de beschrijving noemt alles wat in de figuur staat', () => {
  const opts = [
    ...SHAPES,
    { kind: 'balk', l: 4, b: 2, h: 3, len: { AB: 4, BC: 2, AE: 3 }, fill: 'BCGF' },
    { kind: 'prisma', n: 5, len: { AF: 3.5, AB: 'x' }, fill: 'FGHIJ' },
    { kind: 'piramide', n: 4, len: { TA: 5 }, hide: 'C' },
    { kind: 'kubus', letters: 'PQRSTUVW', len: { PQ: 3 } },
  ];
  for (const o of opts) {
    const svg = solid(o),
      text = label(svg),
      name = JSON.stringify(o);
    assert.ok(text.length > 40, `te korte beschrijving: ${name}`);
    for (const w of written(svg)) assert.ok(text.includes(w), `"${w}" niet beschreven: ${name}`);
    for (const bad of ['NaN', 'undefined', 'Infinity', 'null', '[object'])
      assert.ok(!svg.includes(bad), `${bad} in ${name}`);
  }
  const balk = label(
    solid({ kind: 'balk', l: 4, b: 2, h: 3, len: { AB: 4, BC: 2, AE: 3 }, fill: 'BCGF' }),
  );
  for (const w of [
    'Balk',
    'grondvlak ABCD',
    'bovenvlak EFGH',
    'A ligt linksvoor',
    'C rechtsachter',
    'G boven C',
    '6 zijvlakken',
    'Gestippeld: AD, CD en DH',
    'AB = 4 cm, BC = 2 cm en AE = 3 cm',
    'Zijvlak BCGF is gekleurd',
  ])
    assert.ok(balk.includes(w), `"${w}" ontbreekt: ${balk}`);
  const prisma = label(solid({ kind: 'prisma', n: 5, len: { AF: 3.5 } }));
  assert.ok(prisma.startsWith('Vijfzijdig prisma met grondvlak ABCDE en bovenvlak FGHIJ.'));
  assert.ok(prisma.includes('AF = 3,5 cm'), prisma);
  const pir = label(solid({ kind: 'piramide', n: 6 }));
  assert.ok(pir.startsWith('Zeszijdige piramide met grondvlak ABCDEF en top T.'), pir);
  assert.ok(pir.includes('boven het midden'), pir);
  assert.ok(label(solid({ kind: 'kubus', counts: false })).indexOf('zijvlakken') < 0);
  assert.ok(label(solid({ kind: 'kubus', label: 'Ruimtefiguur' })).startsWith('Ruimtefiguur met'));
});

test('letters verbergen of weglaten', () => {
  const hid = solid({ kind: 'kubus', hide: 'G' }),
    text = label(hid);
  assert.ok(!written(hid).includes('G'), 'G staat nog in de figuur');
  assert.ok(written(hid).includes('?'));
  assert.ok(text.includes('bovenvlak EF?H') && !/\bG\b/.test(text), text);
  const none = solid({ kind: 'balk', letters: false, len: { AB: 4, BC: 2, AE: 3 }, fill: 'EFGH' }),
    t2 = label(none);
  assert.deepEqual(textsOf(none, /<text class="ti"[^>]*>([^<]+)<\/text>/g), []);
  assert.ok(!/\b[A-H]{2,}\b/.test(t2.replace('Balk', '')), t2);
  for (const w of [
    'zonder letters',
    '3 ribben zijn gestippeld',
    'De lengte is 4 cm, de breedte is 2 cm en de hoogte is 3 cm',
    'Het bovenvlak is gekleurd',
  ])
    assert.ok(t2.includes(w), `"${w}" ontbreekt: ${t2}`);
});

test('dezelfde invoer geeft dezelfde figuur', () => {
  for (const o of SHAPES) assert.equal(solid(o), solid({ ...o }), JSON.stringify(o));
});

test('de figuur heeft de vorm van de andere figuren', () => {
  for (const o of SHAPES) {
    const svg = solid(o),
      name = JSON.stringify(o);
    assert.match(
      svg,
      /^<svg class="fig" role="img" aria-label="[^"]+" width="\d+" height="\d+" viewBox="0 0 \d+ \d+">/,
      name,
    );
    assert.ok(svg.endsWith('</svg>'), name);
    const [w, h] = svg
      .match(/viewBox="0 0 (\d+) (\d+)"/)
      .slice(1)
      .map(Number);
    // Alle lijnen en teksten vallen binnen de figuur.
    for (const [, x, y] of svg.matchAll(/x="(-?[\d.]+)" y="(-?[\d.]+)"/g))
      assert.ok(+x >= 0 && +x <= w && +y >= 0 && +y <= h, `tekst buiten de figuur: ${name}`);
    for (const m of svg.matchAll(/x1="([\d.-]+)" y1="([\d.-]+)" x2="([\d.-]+)" y2="([\d.-]+)"/g))
      assert.ok(m.slice(1).every((c) => +c >= -0.1) && +m[1] <= w + 0.1 && +m[3] <= w + 0.1, name);
    assert.equal(
      textsOf(svg, /<text class="ti"[^>]*>([^<]+)<\/text>/g).length,
      solidFacts(o).vertices.length,
      `een letter bij elk hoekpunt: ${name}`,
    );
  }
  const grid = solid({ kind: 'kubus', grid: true });
  assert.ok(grid.includes('<line class="gl"'));
  assert.ok(!solid({ kind: 'kubus' }).includes('class="gl"'));
  assert.ok(solid({ kind: 'kubus', fill: 'BCGF' }).includes('<polygon class="sf"'));
});

test('een fout in de opties geeft een duidelijke fout', () => {
  assert.throws(() => solid({ kind: 'bol' }), /Onbekende ruimtefiguur/);
  assert.throws(() => solid({ kind: 'prisma', n: 9 }), /3 tot en met 8/);
  assert.throws(
    () =>
      solid({
        kind: 'prisma',
        base: [
          [0, 0],
          [4, 0],
          [1, 1],
          [0, 4],
        ],
      }),
    /convex/,
  );
  assert.throws(() => solid({ kind: 'kubus', len: { AG: 3 } }), /geen ribbe/);
  assert.throws(() => solid({ kind: 'kubus', fill: 'ABGH' }), /geen zijvlak/);
  assert.throws(() => solid({ kind: 'piramide', lying: true }), /niet liggen/);
  assert.throws(() => solid({ kind: 'kubus', letters: 'ABC' }), /Verkeerde letters/);
});
