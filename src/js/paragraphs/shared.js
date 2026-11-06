// Hulpmiddelen die de vraaggeneratoren van meerdere paragrafen delen.
import { geo, graph } from '../figures.js';
import { shuffle, qv, isNice, sg, near } from '../math.js';

const H = (html) => ({ h: html });
const F = (pre, a, post = '') => ({ pre, a: qv(a), post });
const RF = (pre, x, n = 1, post = '') =>
  isNice(x, n) ? { pre, a: x, post } : { pre, a: x, post, round: n };
const needRound = (fs) =>
  fs.some((f) => f.round)
    ? ` Rond af op ${fs.find((f) => f.round).round === 1 ? '1 decimaal' : fs.find((f) => f.round).round + ' decimalen'}.`
    : '';
const MC = (opts, a) => {
  const idx = shuffle(opts.map((_, i) => i));
  return { opts: idx.map((i) => opts[i]), a: idx.indexOf(a) };
};
const plug = (a, x, b) => `${a}*${x}${sg(b)}`;
// Een bedrag zoals op een prijskaartje: 3 of 2,50.
const euro = (x) => x.toFixed(Number.isInteger(x) ? 0 : 2).replace('.', ',');
const TRP = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [8, 15, 17],
  [9, 12, 15],
  [18, 24, 30],
  [10, 24, 26],
  [7, 24, 25],
];
function nestedPts(ab, bc, ac, ad) {
  /* B(0,0), C(bc,0), A boven */ const B = [0, 0],
    C = [bc, 0],
    A = [
      (bc * bc + ab * ab - ac * ac) / (2 * bc),
      Math.sqrt(Math.max(ab * ab - ((bc * bc + ab * ab - ac * ac) / (2 * bc)) ** 2, 0)),
    ];
  const r = ad / ab,
    D = [A[0] + (B[0] - A[0]) * r, A[1] + (B[1] - A[1]) * r],
    E = [A[0] + (C[0] - A[0]) * r, A[1] + (C[1] - A[1]) * r];
  return { A, B, C, D, E };
}
function nestedFig(ab, bc, ac, ad, opts) {
  return geo({
    pts: nestedPts(ab, bc, ac, ad),
    segs: ['AB', 'AC', 'BC', 'DE'],
    w: 320,
    maxH: 270,
    ...opts,
  });
}
// Een lijn tekenen in een rooster. Elk paar verschillende punten op de lijn is goed, dus de velden
// bevatten alleen een voorbeeld en de vraag kijkt zelf na. p en q zijn dat voorbeeld.
const DRAW_X = [-5, 5];
const DRAW_Y = [-6, 6];
const inGrid = (x, y) => x >= DRAW_X[0] && x <= DRAW_X[1] && y >= DRAW_Y[0] && y <= DRAW_Y[1];
const answerGraph = (lines, pts) => graph({ xr: DRAW_X, yr: DRAW_Y, lines, pts });
function drawLine(a, b, p, q) {
  const on = (x, y) => near(a * x + b, y),
    same = (v) => near(v[0], v[2]) && near(v[1], v[3]);
  return {
    fig: graph({
      xr: DRAW_X,
      yr: DRAW_Y,
      u: 28,
      draw: true,
      label:
        'Leeg rooster om de lijn in te tekenen. Je kunt ook de coördinaten in de velden typen.',
    }),
    compact: true,
    fields: [
      { ...F('Punt 1: x =', p[0]), label: 'Punt 1, x-coördinaat' },
      { ...F('y =', p[1]), label: 'Punt 1, y-coördinaat' },
      { ...F('Punt 2: x =', q[0]), label: 'Punt 2, x-coördinaat', br: true },
      { ...F('y =', q[1]), label: 'Punt 2, y-coördinaat' },
    ],
    check: (v) => {
      const first = on(v[0], v[1]),
        second = on(v[2], v[3]) && !same(v);
      return [first, first, second, second];
    },
    traps: [
      {
        f: same,
        m: 'Je hebt twee keer hetzelfde punt gekozen. Voor een lijn heb je twee verschillende punten nodig.',
      },
      {
        f: (v) => near((v[3] - v[1]) / (v[2] - v[0]), a),
        m: 'De lijn loopt de goede kant op, maar hij ligt te hoog of te laag.',
      },
      {
        f: (v) => on(v[0], v[1]) !== on(v[2], v[3]),
        m: 'Eén van je punten ligt op de lijn, de andere niet. Vul de x-coördinaat in en reken de y-coördinaat na.',
      },
    ],
  };
}

export {
  H,
  F,
  RF,
  needRound,
  MC,
  plug,
  euro,
  TRP,
  nestedPts,
  nestedFig,
  drawLine,
  inGrid,
  answerGraph,
};
