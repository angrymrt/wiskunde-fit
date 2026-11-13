// Hulpmiddelen die de vraaggeneratoren van meerdere paragrafen delen.
import { geo, graph } from '../figures.js';
import { shuffle, Q, qv, isNice, sg, near, fr, d, rd, lin, dlin } from '../math.js';
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
    // Voor een letter staat een breuk nooit als gemengd getal: {9/2}x en niet 4½x, want dat lees
    // je als 4 · ½x.
    const q = typeof k[p] === 'object' ? Q(Math.abs(k[p].n), k[p].d) : null,
      n = q ? (p && q.d !== 1 ? `{${q.n}/${q.d}}` : fr(q)) : d(Math.abs(x)),
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
// De laatste stappen van het werkschema vanaf de ontbinding, zoals in het boek:
// (x + 2)(x − 9) = 0, dan x + 2 = 0 ∨ x − 9 = 0, dan x = −2 ∨ x = 9.
function solveSteps(fs, v = 'x') {
  const sol = ([m, n]) => `${v} = ${fr(Q(-n, m))}`;
  const out = [`${factors(fs, v)} = 0`, fs.map(([m, n]) => `${lin(m, n, v)} = 0`).join(' ∨ ')];
  if (fs.some(([m, n]) => m !== 1 && n))
    out.push(fs.map(([m, n]) => (m === 1 ? sol([m, n]) : `${lin(m, 0, v)} = ${-n}`)).join(' ∨ '));
  out.push(fs.map(sol).join(' ∨ '));
  return out;
}
// De zin bij delen of vermenigvuldigen, zodat er x² komt te staan. k is een breuk uit Q.
const scaleText = (k) =>
  k.d === 1 && k.n !== -1
    ? `Deel alle termen door ${k.n}.`
    : `Vermenigvuldig alle termen met ${fr(Q(k.d, k.n))}.`;

// Een kwadratische functie [a, b, c] is f(x) = ax² + bx + c. De functiewaarde term voor term,
// zoals in de uitwerking.
const quadValue = ([a, b, c], x) => rd(a * x * x + b * x + c, 6);
// De invulling zoals in het boek: f(-1) = -2*(-1)^2 + 5*-1 + 1 = -2 - 5 + 1 = -6. Een negatief
// getal staat in het kwadraat tussen haakjes, maar niet in de term met x.
function fillQuad(n, abc, x) {
  const [a, b, c] = abc;
  if (!x) return `${n}(0) = ${d(c)}`;
  const sq = x < 0 ? `(${d(x)})^2` : `${d(x)}^2`;
  let s = a === 1 ? sq : a === -1 ? `-${sq}` : `${d(a)}*${sq}`;
  if (b) s += ` ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? d(x) : `${d(Math.abs(b))}*${d(x)}`}`;
  if (c) s += sg(c);
  const parts = [rd(a * x * x, 6), ...(b ? [rd(b * x, 6)] : []), ...(c ? [c] : [])],
    mid = parts.map((p, i) => (i ? sg(p) : d(p))).join('');
  return `${n}(${d(x)}) = ${s}${parts.length > 1 ? ` = ${mid}` : ''} = ${d(quadValue(abc, x))}`;
}
// Bekende fouten bij het invullen, als het verschil met de goede functiewaarde.
function slips([a, b], x) {
  const out = {};
  // (-3)^2 als -9, of -3^2 als 9: de term met x² krijgt het verkeerde teken.
  if (x && (x < 0 || a < 0)) out['kwadraat-teken'] = -2 * a * x * x;
  // Het teken van b · x omgedraaid.
  if (x && b) out['teken-bx'] = -2 * b * x;
  // x² uitgerekend als 2x.
  if (x && x !== 2) out['kwadraat-keer-twee'] = 2 * a * x - a * x * x;
  return out;
}
// Elke fout geeft een ander getal, zodat de gerichte feedback over de goede fout gaat.
const fairSlips = (abc, x) => {
  const offs = Object.values(slips(abc, x)).map((o) => rd(o, 6));
  return offs.every((o) => o !== 0) && new Set(offs).size === offs.length;
};
const SLIP_MSG = {
  'kwadraat-teken':
    'Let op het teken van de term met x². Een negatief getal kwadrateer je tussen haakjes: (−3)² = 9. Maar bij −x² blijft de min staan: −3² = −9.',
  'teken-bx': 'Let op het teken van de term met x. Min maal min is plus, en min maal plus is min.',
  'kwadraat-keer-twee':
    'Een kwadraat is een getal keer zichzelf: 5² = 5 · 5 = 25, en niet 2 · 5 = 10.',
};
// De valkuilen bij het invullen. entries noemt per veld de x: [[0, -2], [1, 4]].
function valueTraps(abc, entries) {
  return Object.keys(SLIP_MSG)
    .map((id) => {
      const hits = entries
        .map(([i, x]) => [i, slips(abc, x)[id]])
        .filter(([, o]) => o !== undefined)
        .map(([i, o]) => [i, rd(quadValue(abc, entries.find((e) => e[0] === i)[1]) + o, 6)]);
      return hits.length
        ? { id, f: (v) => hits.some(([i, w]) => near(v[i], w, 1e-6)), m: SLIP_MSG[id] }
        : null;
    })
    .filter(Boolean);
}

// Een onbekend getal p in ax² + bx + c, op plek k: 0 is a, 1 is b en 2 is c. De andere getallen
// staan in abc, en het getal op plek k doet niet mee. quadP([2, 0, 10], 1) geeft 2x^2 + px + 10.
const POW = ['x^2', 'x', ''];
function quadP(abc, k) {
  let s = '';
  for (const i of [0, 1, 2]) {
    const t = i === k ? `p${POW[i]}` : quad(abc.map((c, j) => (j === i ? c : 0)));
    if (t) s += !s ? t : t[0] === '-' ? ` - ${t.slice(1)}` : ` + ${t}`;
  }
  return s;
}
// Wat x invullen geeft bij een onbekend getal op plek k, als [m, K] voor m · p + K. sq is wat
// de leerling voor x² neemt en sx wat voor x in de term met x, zodat een valkuil hetzelfde
// rekent met een fout erin.
function linP(abc, k, x, sq = x * x, sx = x) {
  const w = [sq, sx, 1];
  let m = 0,
    K = 0;
  w.forEach((t, i) => (i === k ? (m = t) : (K += abc[i] * t)));
  return [rd(m, 6), rd(K, 6)];
}
const solveP = ([m, K], y) => (m ? rd((y - K) / m, 6) : NaN);
// De uitwerking als het punt (x, y) op de grafiek ligt, zoals in het boek: eerst invullen, dan
// de vergelijking oplossen, elke stap op een eigen regel.
// 2*(-3)^2 + p*-3 + 1 = 10, dan 18 - 3p + 1 = 10, dan -3p + 19 = 10, dan -3p = -9, dan p = 3.
function unknownSteps(abc, k, x, y) {
  const [m, K] = linP(abc, k, x),
    sq = x < 0 ? `(${d(x)})^2` : `${d(x)}^2`,
    w = [x * x, x, 1];
  let s = '',
    e = '';
  const add = (str, t, neg) => (str ? `${str} ${neg ? '-' : '+'} ${t}` : (neg ? '-' : '') + t);
  for (const i of [0, 1, 2]) {
    if (i === k) {
      s = add(s, ['p*' + sq, `p*${d(x)}`, 'p'][i], false);
      e = add(e, dlin(Math.abs(w[i]), 0, 'p'), w[i] < 0);
    } else if (abc[i]) {
      const A = Math.abs(abc[i]),
        t = rd(abc[i] * w[i], 6);
      s = add(s, [A === 1 ? sq : `${d(A)}*${sq}`, `${d(A)}*${d(x)}`, d(A)][i], abc[i] < 0);
      e = add(e, d(Math.abs(t)), t < 0);
    }
  }
  const out = [`${s} = ${d(y)}`];
  if (e !== s) out.push(`${e} = ${d(y)}`);
  // Staan er twee getallen zonder p, dan tel je die eerst op.
  if (abc.filter((c, i) => i !== k && c).length > 1) out.push(`${dlin(m, K, 'p')} = ${d(y)}`);
  if (K) out.push(`${dlin(m, 0, 'p')} = ${d(rd(y - K, 6))}`);
  if (m !== 1) out.push(`p = ${d(solveP([m, K], y))}`);
  return out;
}
// Een melding na een valkuil is gewone tekst, dus met een echt minteken.
const mn = (x) => d(x).replace('-', '−');
// De valkuilen bij een onbekend getal: wat p wordt met een bekende fout. i is het veld voor p.
// Met point, zoals 'A', komt er ook een valkuil bij voor x en y verwisselen.
function unknownTraps(abc, k, x, y, i, point) {
  const p = solveP(linP(abc, k, x), y),
    K = linP(abc, k, x)[1],
    sign = (t) => (t < 0 ? `− ${mn(-t)}` : `+ ${mn(t)}`),
    all = [
      x < 0 && [
        'kwadraat-teken',
        solveP(linP(abc, k, x, -x * x), y),
        `Zet een negatief getal tussen haakjes als je het kwadrateert: (${mn(x)})² = ${mn(x * x)}, en niet ${mn(-x * x)}.`,
      ],
      x !== 2 && [
        'kwadraat-keer-twee',
        solveP(linP(abc, k, x, 2 * x), y),
        `Een kwadraat is een getal keer zichzelf: ${mn(x)}² = ${mn(x)} · ${mn(x)} = ${mn(x * x)}, en niet 2 · ${mn(x)}.`,
      ],
      // Bij een negatieve x, of een negatieve b: min maal min is plus.
      (x < 0 ? k === 1 || abc[1] : k !== 1 && abc[1] < 0) && [
        'teken-bx',
        solveP(linP(abc, k, x, x * x, -x), y),
        'Let op het teken van de term met x. Min maal min is plus, en min maal plus is min.',
      ],
      K && [
        'teken-overbrengen',
        solveP(linP(abc, k, x), rd(y + 2 * K, 6)),
        `Breng je een getal naar de andere kant van het isgelijkteken, dan verandert het teken. Van ${sign(K)} maak je ${sign(-K)}.`,
      ],
      point &&
        !near(x, y) && [
          'x-en-y-verwisseld',
          solveP(linP(abc, k, y), x),
          `In ${point}(${mn(x)}, ${mn(y)}) staat eerst de x-coördinaat. Vul dus x = ${mn(x)} in, en de uitkomst is ${mn(y)}.`,
        ],
    ],
    seen = [p],
    out = [];
  // Elke fout geeft een ander getal dan het goede antwoord en dan de andere fouten.
  for (const t of all) {
    if (!t || !isNice(t[1], 2) || Math.abs(t[1]) > 999 || seen.some((s) => near(s, t[1]))) continue;
    const [id, wrong, m] = t;
    seen.push(wrong);
    out.push({ id, f: (v) => near(v[i], wrong, 1e-6), m });
  }
  return out;
}

// Het getal voor de haakjes of voor x²: niets bij 1, alleen een min bij −1. a mag een breuk uit Q
// zijn, zoals {1/2}.
// Een negatieve breuk krijgt de min ervoor, zoals in quad: -{1/2}(x - 4)^2.
const coef = (a) =>
  val(a) === 1
    ? ''
    : val(a) === -1
      ? '-'
      : typeof a === 'object'
        ? `${a.n < 0 ? '-' : ''}${fr(Q(Math.abs(a.n), a.d))}`
        : d(a);
// a(x − p)² + q als tekst voor T. Bij p = 0 staat er ax², en bij q = 0 valt + q weg.
const vertexForm = (a, p, q, v = 'x') =>
  `${coef(a)}${p ? `(${dlin(1, -p, v)})^2` : `${v}^2`}${q ? sg(q) : ''}`;
// a(x − d)(x − e) als tekst voor T. Een factor x staat zonder haakjes vooraan, zoals 3x(x − 5).
function factorForm(a, r, s, v = 'x') {
  const f = (t) => (t ? `(${dlin(1, -t, v)})` : v);
  return `${coef(a)}${s ? f(r) + f(s) : f(s) + f(r)}`;
}
// Een punt zoals in het boek: (3, −5), maar met kommagetallen een puntkomma: (2,5; 19,25).
const pt = (x, y) =>
  Number.isInteger(x) && Number.isInteger(y) ? `(${d(x)}, ${d(y)})` : `(${d(x)}; ${d(y)})`;

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
  solveSteps,
  scaleText,
  quadValue,
  fillQuad,
  slips,
  fairSlips,
  valueTraps,
  quadP,
  linP,
  unknownSteps,
  unknownTraps,
  coef,
  vertexForm,
  factorForm,
  pt,
  euro,
  TRP,
  nestedPts,
  nestedFig,
  drawLine,
  inGrid,
  lineTable,
  fillIn,
};
