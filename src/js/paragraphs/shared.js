// Hulpmiddelen die de vraaggeneratoren van meerdere paragrafen delen.
import { geo } from '../figures.js';
import { shuffle, qv, isNice, sg } from '../math.js';

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
function nestedFig(ab, bc, ac, ad, opts) {
  /* B(0,0), C(bc,0), A boven */ const B = [0, 0],
    C = [bc, 0],
    A = [
      (bc * bc + ab * ab - ac * ac) / (2 * bc),
      Math.sqrt(Math.max(ab * ab - ((bc * bc + ab * ab - ac * ac) / (2 * bc)) ** 2, 0)),
    ];
  const r = ad / ab,
    D = [A[0] + (B[0] - A[0]) * r, A[1] + (B[1] - A[1]) * r],
    E = [A[0] + (C[0] - A[0]) * r, A[1] + (C[1] - A[1]) * r];
  return geo({
    pts: { A, B, C, D, E },
    segs: ['AB', 'AC', 'BC', 'DE'],
    w: 320,
    maxH: 270,
    ...opts,
  });
}

export { H, F, RF, needRound, MC, plug, TRP, nestedFig };
