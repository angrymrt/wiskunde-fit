// Grafieken bij een verhaal (#286): contextGraph() en tijd() in src/js/grafiekfiguren.js. De tests kijken of de
// punten op de goede plek staan, of de vloeiende kromme tussen twee punten niet te hoog of te laag komt, en of de
// beschrijving voor een schermlezer het antwoord niet voorzegt als je moet aflezen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { bezier, contextGraph, grafiekDelen, tijd } from '../src/js/grafiekfiguren.js';

const label = (svg) => svg.match(/aria-label="([^"]*)"/)[1];
const texts = (svg) => [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1]);

// Geldige SVG: elke tag gaat dicht, de maten kloppen met de viewBox, geen id's en geen NaN.
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

const FIETS = {
  titel: 'Fietstocht',
  x: { naam: 'tijd in uren', van: 9, tot: 14, stap: 1, eenheid: 'uur' },
  y: { naam: 'afstand in km', van: 0, tot: 40, stap: 5, eenheid: 'km' },
  grafieken: [
    {
      naam: 'Mila',
      punten: [
        [9, 0],
        [10, 15],
        [11, 15],
        [13, 40],
      ],
    },
    {
      naam: 'Ravi',
      vorm: 'kromme',
      punten: [
        [9, 0],
        [11, 20],
        [12, 22],
        [14, 35],
      ],
    },
  ],
};
const WARMTE = {
  x: { naam: 'tijd in uren', van: 0, tot: 12, stap: 2 },
  y: { naam: 'temperatuur in °C', van: 14, tot: 26, stap: 1 },
  grafieken: [
    {
      vorm: 'kromme',
      stippen: true,
      punten: [
        [0, 16],
        [2, 19],
        [4, 24],
        [6, 24],
        [8, 20],
        [12, 15],
      ],
    },
  ],
};
const SCHETS = {
  schets: true,
  x: { naam: 'tijd', van: 0, tot: 8, stap: 1 },
  y: { naam: 'snelheid', van: 0, tot: 4, stap: 1 },
  grafieken: [
    {
      punten: [
        [0, 0],
        [2, 3],
        [5, 3],
        [8, 0],
      ],
      stukken: ['a', 'b', 'c'],
    },
  ],
};

test('een grafiek bij een verhaal is geldige SVG, en dezelfde invoer geeft dezelfde tekst', () => {
  for (const o of [
    FIETS,
    WARMTE,
    SCHETS,
    { ...WARMTE, zeg: 'vorm' },
    { ...SCHETS, zeg: 'assen' },
  ]) {
    const svg = contextGraph(o);
    assertSvg(svg);
    assert.equal(svg, contextGraph(JSON.parse(JSON.stringify(o))));
  }
});

test('de assen: namen, getallen per hokje, een begin bij 9 uur en een scheurlijn', () => {
  const svg = contextGraph(FIETS),
    t = texts(svg);
  for (const s of ['Fietstocht', 'tijd in uren', 'afstand in km', 'Mila', 'Ravi'])
    assert.ok(t.includes(s), s);
  assert.deepEqual(
    t.filter((s) => /^\d+$/.test(s)).map(Number),
    [9, 10, 11, 12, 13, 14, 0, 5, 10, 15, 20, 25, 30, 35, 40],
  );
  assert.ok(!t.includes('x') && !t.includes('y'), 'geen letters x en y');
  // Begint de verticale as bij 0, dan geen scheurlijn; bij 14 °C wel, met 0 onderaan.
  assert.doesNotMatch(svg, /l5 3l-10 6l10 6l-5 2/);
  const warm = contextGraph(WARMTE);
  assert.match(warm, /l5 3l-10 6l10 6l-5 2/);
  assert.match(label(warm), /van 14 tot 26, met een scheurlijn/);
  assert.match(label(svg), /Eén hokje is 1 uur\. .*Eén hokje is 5 km\./);
  // Stappen van 2 uur: het getal staat bij elke lijn, op de goede plek.
  const { X, Y, px0, py1, u } = grafiekDelen(WARMTE);
  assert.equal(X(0), px0);
  assert.equal(X(4), px0 + 2 * u);
  assert.equal(Y(14), py1);
  assert.equal(Y(20), py1 - 6 * u);
});

test('de punten van een grafiek staan op de goede plek', () => {
  const { X, Y } = grafiekDelen(WARMTE),
    svg = contextGraph(WARMTE),
    stippen = [...svg.matchAll(/<circle class="mk c1" cx="([\d.]+)" cy="([\d.]+)"/g)].map((m) => [
      +m[1],
      +m[2],
    ]);
  assert.deepEqual(
    stippen,
    WARMTE.grafieken[0].punten.map(([a, b]) => [+X(a).toFixed(1), +Y(b).toFixed(1)]),
  );
  // Rechte stukken gaan van punt naar punt.
  const { X: Xf, Y: Yf } = grafiekDelen(FIETS);
  assert.ok(
    contextGraph(FIETS).includes(
      `d="M${FIETS.grafieken[0].punten.map(([a, b]) => `${Xf(a)} ${Yf(b)}`).join('L')}"`,
    ),
  );
});

test('de vloeiende kromme komt tussen twee punten niet hoger of lager dan die punten', () => {
  const sets = [
    WARMTE.grafieken[0].punten,
    [
      [0, 0],
      [1, 10],
      [2, 10.5],
      [3, 30],
      [4, 0],
      [5, 0],
      [6, 2],
    ],
    [
      [0, 5],
      [3, 40],
      [4, 41],
      [10, 0],
    ],
  ];
  for (const ps of sets)
    bezier(ps).forEach(([a, b, c, e], k) => {
      const lo = Math.min(a[1], e[1]) - 1e-9,
        hi = Math.max(a[1], e[1]) + 1e-9;
      for (let i = 0; i <= 50; i++) {
        const s = i / 50,
          B = (j) =>
            (1 - s) ** 3 * a[j] +
            3 * (1 - s) ** 2 * s * b[j] +
            3 * (1 - s) * s * s * c[j] +
            s ** 3 * e[j];
        assert.ok(B(1) >= lo && B(1) <= hi, `stuk ${k} bij ${s}`);
        assert.ok(B(0) >= a[0] - 1e-9 && B(0) <= e[0] + 1e-9, 'x loopt van punt naar punt');
      }
      // Een horizontaal stuk blijft horizontaal.
      if (a[1] === e[1]) assert.ok(b[1] === a[1] && c[1] === a[1]);
    });
});

test('een globale grafiek heeft geen getallen en geen rooster, wel letters bij de stukken', () => {
  const svg = contextGraph(SCHETS),
    t = texts(svg);
  assert.doesNotMatch(svg, /class="gl"/);
  assert.ok(!t.some((s) => /\d/.test(s)), 'geen getallen');
  assert.deepEqual(t.filter((s) => s.length === 1).sort(), ['a', 'b', 'c']);
  assert.ok(t.includes('tijd') && t.includes('snelheid'));
  assert.match(label(svg), /^Globale grafiek\. .*geen getallen/);
});

test('de beschrijving zegt alleen wat zeg toestaat', () => {
  const punten = label(contextGraph(FIETS)),
    vorm = label(contextGraph({ ...FIETS, zeg: 'vorm' })),
    assen = label(contextGraph({ ...FIETS, zeg: 'assen' }));
  assert.match(punten, /9 en 0; 10 en 15; 11 en 15; 13 en 40/);
  assert.match(
    vorm,
    /Mila bestaat uit rechte stukken\. Hij stijgt eerst, loopt daarna horizontaal en stijgt dan\./,
  );
  assert.match(vorm, /Ravi is een vloeiende kromme\. Hij stijgt\./);
  // Bij vorm en assen staat geen enkel punt in de beschrijving: alleen de getallen van de assen.
  for (const l of [vorm, assen]) assert.doesNotMatch(l, /\d+ en \d+|; /);
  assert.doesNotMatch(assen, /stijgt|daalt|horizontaal/);
  // Bij een schets met letters: per stuk de vorm, of alleen de letters.
  assert.match(
    label(contextGraph({ ...SCHETS, zeg: 'vorm' })),
    /Stuk a stijgt, stuk b loopt horizontaal en stuk c daalt\./,
  );
  const kaal = label(contextGraph({ ...SCHETS, zeg: 'assen' }));
  assert.match(kaal, /de stukken a, b en c/);
  assert.doesNotMatch(kaal, /stijgt|daalt|horizontaal/);
});

test('tijd schrijft een tijdstip zoals op een klok', () => {
  assert.equal(tijd(9), '9 uur');
  assert.equal(tijd(9.5), '9.30 uur');
  assert.equal(tijd(14.25), '14.15 uur');
  assert.equal(tijd(7 + 5 / 60), '7.05 uur');
  assert.equal(tijd(23.999), '0 uur');
});
