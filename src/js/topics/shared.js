// Hulpmiddelen die de vraaggeneratoren van meerdere paragrafen delen.
import { geo, graph } from '../figures.js';
import { shuffle, Q, qv, isNice, sg, near, fr, d, lin } from '../math.js';
import { dt } from '../typeset.js';

// Letterparen voor een formule met andere letters dan x en y.
const LV = [
  ['N', 't'],
  ['K', 'q'],
  ['B', 'k'],
  ['R', 'p'],
  ['W', 's'],
  ['V', 'u'],
];
const H = (html) => ({ h: html });
const F = (pre, a, post = '') => ({ pre, a: qv(a), post });
const RF = (pre, x, n = 1, post = '') =>
  isNice(x, n) ? { pre, a: x, post } : { pre, a: x, post, round: n };
// De velden voor de oplossingen van een vergelijking, zoals x = −2 ∨ x = 9. Ze horen bij één groep
// (grp), dus de leerling mag ze in elke volgorde invullen. Met n rondt elk veld af op n decimalen,
// net als bij RF. xn is de letter van de onbekende.
const ORD = ['eerste', 'tweede', 'derde', 'vierde'];
const orFields = (answers, { n, xn = 'x' } = {}) =>
  answers.map((a, i) => {
    const pre = `${i ? '∨ ' : ''}${xn} =`;
    return {
      ...(n === undefined ? F(pre, a) : RF(pre, a, n)),
      grp: xn,
      label: `${xn}, ${ORD[i]} oplossing`,
    };
  });
// De valkuil voor een omgedraaide verhouding. wrong geeft per veld het getal dat je dan krijgt,
// zoals { 0: c * m / a }. Een afgerond fout getal telt ook mee. Valt het foute getal samen met het
// goede, dan geldt de valkuil niet.
const FLIP =
  'Je hebt de verhouding omgedraaid. Zet lengtes die bij elkaar horen in dezelfde kolom van de tabel.';
const flipTrap = (fields, wrong, m = FLIP) => ({
  id: 'verhouding-omgedraaid',
  f: (v) =>
    Object.entries(wrong).some(([i, w]) => {
      const f = fields[i];
      if (near(w, f.a, 1e-6) || !Number.isFinite(v[i])) return false;
      // Komt het foute getal niet mooi uit, dan rondt een leerling het zelf af, zoals 4,7 bij 4,666…
      const tol = f.round ? 0.5 * 10 ** -f.round : isNice(w, 4) ? 0 : 0.051;
      return Math.abs(v[i] - w) <= tol + 1e-9;
    }),
  m,
});
const needRound = (fs) =>
  fs.some((f) => f.round)
    ? ` Rond af op ${fs.find((f) => f.round).round === 1 ? '1 decimaal' : fs.find((f) => f.round).round + ' decimalen'}.`
    : '';
const MC = (opts, a) => {
  const idx = shuffle(opts.map((_, i) => i));
  return { opts: idx.map((i) => opts[i]), a: idx.indexOf(a) };
};
const plug = (a, x, b) => `${a}*${x}${sg(b)}`;

// ax² + bx + c als tekst voor T. order zegt in welke volgorde de termen staan, met de macht van x:
// [0, 1, 2] geeft c + bx + ax². Een term met 0 valt weg, en 1x² wordt x². Een getal mag ook een
// breuk uit Q zijn, zoals {1/3}x². v is de letter, zoals p in p² + p − 20.
const val = (k) => (typeof k === 'object' ? k.n / k.d : k);
function quad([a, b, c], order = [2, 1, 0], v = 'x') {
  const k = { 2: a, 1: b, 0: c };
  let s = '';
  for (const p of order) {
    const x = val(k[p]);
    if (!x) continue;
    const n = typeof k[p] === 'object' ? fr(Q(Math.abs(k[p].n), k[p].d)) : d(Math.abs(x)),
      t = p ? `${n === '1' ? '' : n}${v}${p === 2 ? '^2' : ''}` : n;
    s += s ? ` ${x < 0 ? '-' : '+'} ${t}` : `${x < 0 ? '-' : ''}${t}`;
  }
  return s;
}
// Een ontbinding als tekst voor T. Een factor [m, n] is mx + n, en [1, 0] is de factor x zonder
// haakjes. Zoals in het boek staat x vooraan, en verder de factor met het kleinste getal: (x + 2)(x − 9).
const byFactor = (f, g) => !!f[1] - !!g[1] || Math.abs(f[1]) - Math.abs(g[1]) || g[1] - f[1];
const factors = (fs, v = 'x') =>
  [...fs]
    .sort(byFactor)
    .map(([m, n]) => (m === 1 && !n ? v : `(${lin(m, n, v)})`))
    .join('');
// Of de ingevulde getallen precies deze getallen zijn, in welke volgorde ook. Voor een valkuil bij
// een groep velden, zoals x = −2 ∨ x = 9.
// Een getal dat niet mooi uitkomt, zoals 5/3, mag ook afgerond zijn, zoals 1,67: net als bij het
// nakijken in answers.js.
const close = (x, w) => near(x, w) || (!isNice(w, 4) && Math.abs(x - w) < 0.0051);
const sameSet = (v, want) => {
  const a = [...v].sort((p, q) => p - q),
    b = want.map(qv).sort((p, q) => p - q);
  return a.length === b.length && a.every((x, i) => close(x, b[i]));
};
// Een valkuil voor een groep velden: de leerling vult precies de getallen uit wrong in. Zijn dat
// ook de goede getallen, dan geldt de valkuil niet.
const setTrap = (id, wrong, right, m) =>
  wrong && !sameSet(wrong.map(qv), right) ? { id, f: (v) => sameSet(v, wrong), m } : null;
// De twee verschillende gehele oplossingen van ax² + bx + c = 0, of null. Voor een valkuil: welke
// oplossingen krijg je met een bekende fout?
function intRoots([a, b, c]) {
  [a, b, c] = [a, b, c].map(val);
  const D = b * b - 4 * a * c;
  if (D <= 0) return null;
  const r = [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)];
  return r.every((x) => isNice(x, 0) && Math.abs(x) <= 99) ? r.map(Math.round) : null;
}
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
// De uitwerking zoals in het boek: de invulling, een tabel met twee punten en de lijn door die punten.
const fillIn = (a, b, x, xn = 'x', yn = 'y') => {
  const q = Q(a);
  return `${xn} = ${x} geeft ${yn} = ${fr(q)}*${x}${b ? sg(b) : ''} = ${(q.n * x) / q.d + b}`;
};
const lineTable = (p, q, line, xn = 'x', yn = 'y') => [
  H(
    dt([
      [xn, String(p[0]), String(q[0])],
      [yn, String(p[1]), String(q[1])],
    ]),
  ),
  `Dus ${line.name ? `lijn ${line.name}` : 'de grafiek'} gaat door de punten (${p[0]}, ${p[1]}) en (${q[0]}, ${q[1]}).`,
  H(
    graph({
      xr: DRAW_X,
      yr: DRAW_Y,
      xn,
      yn,
      lines: [line],
      pts: [
        { x: p[0], y: p[1] },
        { x: q[0], y: q[1] },
      ],
    }),
  ),
];
function drawLine(a, b, p, q, xn = 'x', yn = 'y') {
  const on = (x, y) => near(a * x + b, y),
    same = (v) => near(v[0], v[2]) && near(v[1], v[3]);
  return {
    fig: graph({
      xr: DRAW_X,
      yr: DRAW_Y,
      u: 28,
      xn,
      yn,
      draw: true,
      label:
        'Leeg rooster om de lijn in te tekenen. Je kunt ook de coördinaten in de velden typen.',
    }),
    compact: true,
    fields: [
      { ...F(`Punt 1: ${xn} =`, p[0]), label: `Punt 1, ${xn}-coördinaat` },
      { ...F(`${yn} =`, p[1]), label: `Punt 1, ${yn}-coördinaat` },
      { ...F(`Punt 2: ${xn} =`, q[0]), label: `Punt 2, ${xn}-coördinaat`, br: true },
      { ...F(`${yn} =`, q[1]), label: `Punt 2, ${yn}-coördinaat` },
    ],
    // Gegevens en geen functie, want een lopende proeftoets wordt in de browser bewaard.
    line: { a, b },
    traps: [
      {
        id: 'zelfde-punt',
        f: same,
        m: 'Je hebt twee keer hetzelfde punt gekozen. Voor een lijn heb je twee verschillende punten nodig.',
      },
      {
        id: 'lijn-verschoven',
        // De goede helling, maar het eerste punt ligt niet op de lijn.
        f: (v) => near((v[3] - v[1]) / (v[2] - v[0]), a) && !near(a * v[0] + b, v[1]),
        m: 'De lijn loopt de goede kant op, maar hij ligt te hoog of te laag.',
      },
      {
        id: 'een-punt-fout',
        f: (v) => on(v[0], v[1]) !== on(v[2], v[3]),
        m: `Eén van je punten ligt op de lijn, de andere niet. Vul de ${xn}-coördinaat in en reken de ${yn}-coördinaat na.`,
      },
    ],
  };
}

export {
  LV,
  H,
  F,
  RF,
  needRound,
  orFields,
  flipTrap,
  MC,
  plug,
  quad,
  factors,
  byFactor,
  close,
  setTrap,
  intRoots,
  euro,
  TRP,
  nestedPts,
  nestedFig,
  drawLine,
  inGrid,
  lineTable,
  fillIn,
};
