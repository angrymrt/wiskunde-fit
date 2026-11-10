// Onderwerp: Gelijkvormige driehoeken. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { triFromSides, xf, geo } from '../figures.js';
import { ri, pick, coin, shuffle, near, rd, d, ap } from '../math.js';
import { H, F, RF, needRound, MC, TRP, nestedFig, flipTrap } from './shared.js';
import { T, vt } from '../typeset.js';

const NICE_TRI = [
  [5, 6, 7],
  [6, 7, 9],
  [4, 6, 7],
  [8, 9, 12],
  [10, 12, 15],
  [7, 8, 11],
  [5, 7, 10],
  [9, 11, 13],
  [12, 16, 19],
];
const PERM3 = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];
const twoLetters = () => pick(['DEF', 'PQR', 'KLM', 'RST', 'XYZ', 'GHJ']);
function simPts(ab, bc, ac, L, k) {
  const t = triFromSides(ab, bc, ac),
    A = t.A,
    B = t.B,
    C = t.C,
    sp = Math.max(ab, bc, ac) * 1.25;
  const o = { s: k, r: pick([0.5, 1.2, 2.4, 3.6, -0.7]), fx: coin() };
  const P = [A, B, C].map((p) => xf(p, o));
  const mx = Math.min(...P.map((p) => p[0])),
    my = Math.min(...P.map((p) => p[1]));
  const res = { A, B, C };
  L.forEach((n, i) => {
    res[n] = [P[i][0] - mx + sp, P[i][1] - my];
  });
  return res;
}
// De hoek bij punt n in een driehoek, uit de coördinaten.
function angleAt(pts, n, p, q) {
  const u = [pts[p][0] - pts[n][0], pts[p][1] - pts[n][1]],
    w = [pts[q][0] - pts[n][0], pts[q][1] - pts[n][1]];
  return Math.acos((u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w)));
}
// Of △ABC ∼ △name klopt: elke hoek van ABC is even groot als de hoek op dezelfde plek in name.
function sameAngles(pts, name) {
  const at = (t, i) => angleAt(pts, t[i], t[(i + 1) % 3], t[(i + 2) % 3]);
  return [0, 1, 2].every((i) => near(at('ABC', i), at(name, i), 1e-6));
}
// Of in een verhoudingstabel met AB, BC en AC bovenaan elke kolom dezelfde verhouding heeft.
function sameRatio(pts, bottom) {
  const len = (s) => Math.hypot(pts[s[0]][0] - pts[s[1]][0], pts[s[0]][1] - pts[s[1]][1]);
  const r = ['AB', 'BC', 'AC'].map((s, i) => len(bottom[i]) / len(s));
  return near(r[0], r[1], 1e-9) && near(r[1], r[2], 1e-9);
}
function s22factor() {
  const [s1, s2] = shuffle(pick(NICE_TRI)),
    k = pick([1.5, 2, 2.5, 3, 0.5, 1.2]);
  return {
    q: T(
      `△DEF is een vergroting van △ABC. Er geldt AB = ${s1}, BC = ${s2}, DE = ${d(s1 * k)}. Bereken de vergrotingsfactor en EF.`,
    ),
    fields: [F('factor =', k), F('EF =', s2 * k)],
    hint: T(`De factor is DE gedeeld door AB. Vermenigvuldig BC met de factor om EF te krijgen.`),
    steps: [
      `{DE/AB} = {${d(s1 * k)}/${s1}} = ${d(k)}, dus de vergrotingsfactor is ${d(k)}.`,
      `EF = ${d(k)}*${s2} = ${d(s2 * k)}`,
    ],
    traps: [
      {
        id: 'breuk-omgedraaid',
        f: (v) => near(v[0], 1 / k),
        m: 'Je hebt de breuk omgedraaid. Deel de nieuwe lengte door de oude lengte.',
      },
    ],
    v: () => near((s1 * k) / s1, k),
  };
}
function s22note() {
  const L = shuffle([...twoLetters()]),
    [a, b, c] = pick(NICE_TRI),
    o = ['A', 'B', 'C'],
    pts = simPts(a, b, c, L, 0.9);
  const text = shuffle(o.map((n, i) => `∠${n} = ∠${L[i]}`)).join(', ');
  const others = [
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ].map((p) => p.map((i) => L[i]).join(''));
  const names = [L.join(''), ...shuffle(others).slice(0, 3)];
  const opts = names.map((s) => T(`△ABC ∼ △${s}`));
  const showFig = coin();
  const seg = (x, y) => x + y,
    fig = geo({
      pts,
      segs: ['AB', 'BC', 'CA', seg(L[0], L[1]), seg(L[1], L[2]), seg(L[2], L[0])],
      tris: ['ABC', L.join('')],
      arcs: [
        { at: 'A', p: 'B', q: 'C', n: 1, c: 1 },
        { at: 'B', p: 'A', q: 'C', n: 2, c: 2 },
        { at: 'C', p: 'A', q: 'B', n: 3, c: 3 },
        { at: L[0], p: L[1], q: L[2], n: 1, c: 1 },
        { at: L[1], p: L[0], q: L[2], n: 2, c: 2 },
        { at: L[2], p: L[0], q: L[1], n: 3, c: 3 },
      ],
      w: 420,
      maxH: 230,
    });
  const mc = MC(opts, 0);
  return {
    q: showFig
      ? T(
          `In de figuur zijn gelijke hoeken met dezelfde boogjes aangegeven. Welke schrijfwijze is goed?`,
        )
      : T(`Gegeven: ${text}. Welke schrijfwijze is goed?`),
    fig: showFig ? fig : undefined,
    mc,
    traps: [
      {
        id: 'hoeken-verkeerd-gekoppeld',
        f: (v) => v[0] !== opts[0],
        m: 'Gelijke hoeken staan op dezelfde plek in de naam. Zoek bij A, B en C steeds de hoek die even groot is.',
      },
    ],
    hint: 'Bij gelijkvormigheid staan gelijke hoeken op dezelfde plek in de naam. De eerste letter hoort bij de eerste letter, enzovoort.',
    steps: [`∠A = ∠${L[0]}, ∠B = ∠${L[1]} en ∠C = ∠${L[2]}.`, `Dus △ABC ∼ △${L.join('')}.`],
    // Narekenen met de hoeken in de figuur: alleen bij de keuze die goed is, zijn alle hoeken gelijk.
    v: () => mc.opts.every((o, i) => sameAngles(pts, names[opts.indexOf(o)]) === (i === mc.a)),
  };
}
function s22tab() {
  const L = [...twoLetters()],
    p = pick(PERM3.slice(1)),
    M = p.map((i) => L[i]).join(''),
    [X, Y, Z] = [M[0], M[1], M[2]];
  const tables = [
      [X + Y, Y + Z, X + Z],
      [Y + Z, X + Y, X + Z],
      [X + Z, Y + Z, X + Y],
      [Y + Z, X + Z, X + Y],
    ],
    [good, ...bad] = tables.map((t) => vt(['AB', 'BC', 'AC'], t));
  // Een echte driehoek ABC en een twee keer zo grote driehoek met de letters in de volgorde van
  // de vraag, zoals △ABC ∼ △PQR zegt. Alleen in de goede tabel heeft elke kolom dezelfde verhouding.
  const abc = triFromSides(5, 6, 7),
    pts = { ...abc };
  ['A', 'B', 'C'].forEach((n, i) => (pts[M[i]] = abc[n].map((x) => 2 * x)));
  const mc = MC([good, ...bad], 0);
  return {
    q: T(`Gegeven is △ABC ∼ △${M}. Welke verhoudingstabel is goed?`),
    mc,
    traps: [
      {
        id: 'zijden-verkeerd-gekoppeld',
        f: (v) => v[0] !== good,
        m: 'AB bestaat uit de eerste en tweede letter. Pak in de andere driehoek ook de eerste en tweede letter.',
      },
    ],
    hint: T(
      `AB bestaat uit de eerste twee letters van △ABC. Pak dan ook de eerste twee letters van △${M}.`,
    ),
    steps: [
      `AB hoort bij ${X + Y}: de eerste en tweede letter.`,
      `BC hoort bij ${Y + Z}: de tweede en derde letter.`,
      `AC hoort bij ${X + Z}: de eerste en derde letter.`,
      H(vt(['AB', 'BC', 'AC'], [X + Y, Y + Z, X + Z])),
    ],
    v: () =>
      mc.opts.every((o, i) => sameRatio(pts, tables[[good, ...bad].indexOf(o)]) === (i === mc.a)),
  };
}
function s22sides() {
  const L = shuffle([...twoLetters()]),
    [ab, bc, ac] = shuffle(pick(NICE_TRI)),
    k = pick([0.5, 0.75, 1.5, 2, 2.5, 0.6, 1.2, 0.4]),
    s1 = L[0] + L[1],
    s2 = L[1] + L[2],
    s3 = L[0] + L[2],
    kn = rd(ab * k, 1),
    x2 = (bc * kn) / ab,
    x3 = (ac * kn) / ab;
  const pts = simPts(ab, bc, ac, L, k);
  const f = [RF(s2 + ' =', x2), RF(s3 + ' =', x3)];
  return {
    q: T(`△ABC ∼ △${L.join('')}. Bereken ${s2} en ${s3}.${needRound(f)}`),
    fig: geo({
      pts,
      segs: ['AB', 'BC', 'CA', s1, s2, L[2] + L[0]],
      tris: ['ABC', L.join('')],
      sides: [
        { a: 'A', b: 'B', t: ab },
        { a: 'B', b: 'C', t: bc },
        { a: 'A', b: 'C', t: ac },
        { a: L[0], b: L[1], t: d(kn) },
      ],
      arcs: [
        { at: 'A', p: 'B', q: 'C', n: 1, c: 1 },
        { at: L[0], p: L[1], q: L[2], n: 1, c: 1 },
        { at: 'B', p: 'A', q: 'C', n: 2, c: 2 },
        { at: L[1], p: L[0], q: L[2], n: 2, c: 2 },
      ],
      w: 440,
      maxH: 240,
    }),
    fields: f,
    hint: 'Schrijf eerst de verhoudingstabel op met de letters in de goede volgorde. Vul daarna de getallen in.',
    steps: [
      H(
        vt(['AB', 'BC', 'AC'], [s1, s2, s3]) +
          T(' geeft ') +
          vt([String(ab), String(bc), String(ac)], [d(kn), s2, s3]),
      ),
      H(
        vt([String(ab), String(bc)], [d(kn), s2]) +
          T(` geeft ${s2} = {${d(kn)}*${bc}/${ab}} ${ap(x2)}`),
      ),
      H(
        vt([String(ab), String(ac)], [d(kn), s3]) +
          T(` geeft ${s3} = {${d(kn)}*${ac}/${ab}} ${ap(x3)}`),
      ),
    ],
    traps: [flipTrap(f, { 0: (ab * bc) / kn, 1: (ab * ac) / kn })],
    v: () => near(ab * x2, bc * kn, 1e-6) && near(ab * x3, ac * kn, 1e-6),
  };
}
function s22comm() {
  const [ad, ae, de] = pick([
      [6, 8, 7],
      [5, 6, 4],
      [9, 12, 10],
      [4, 5, 6],
      [10, 12, 8],
      [14, 20, 11],
      [8, 10, 9],
    ]),
    K = pick([1.5, 2, 2.5, 1.6, 1.25]),
    ab = ad * K,
    ac = ae * K,
    bc = de * K,
    bd = ab - ad;
  return {
    q: T(
      `In △ABC ligt D op AB en E op AC. Lijnstuk DE is evenwijdig met BC. Gegeven is AD = ${ad}, AE = ${ae}, AC = ${d(ac)} en BC = ${d(bc)}. Bereken DE en BD.`,
    ),
    fig: nestedFig(ab, bc, ac, ad, {
      sides: [
        { a: 'A', b: 'D', t: ad },
        { a: 'A', b: 'E', t: ae },
        { a: 'B', b: 'C', t: d(bc) },
      ],
    }),
    fields: [F('DE =', de), F('BD =', bd)],
    hint: '△ABC en △ADE hebben hoek A gemeenschappelijk en door de evenwijdige lijnen zijn ook de andere hoeken gelijk. Bereken eerst AB om daarna BD te vinden.',
    steps: [
      '∠A (in △ABC) = ∠A (in △ADE)',
      '∠B = ∠D (F-hoeken)',
      'Dus △ABC ∼ △ADE.',
      H(
        vt(['AB', 'BC', 'AC'], ['AD', 'DE', 'AE']) +
          T(' geeft ') +
          vt(['AB', d(bc), d(ac)], [String(ad), 'DE', String(ae)]),
      ),
      H(
        vt([d(bc), d(ac)], ['DE', String(ae)]) +
          T(` geeft DE = {${ae}*${d(bc)}/${d(ac)}} = ${d(de)}`),
      ),
      H(
        vt(['AB', d(ac)], [String(ad), String(ae)]) +
          T(
            ` geeft AB = {${ad}*${d(ac)}/${ae}} = ${d(ab)}, dus BD = AB - AD = ${d(ab)} - ${ad} = ${d(bd)}`,
          ),
      ),
    ],
    traps: [
      {
        id: 'hele-zijde-in-plaats-van-deel',
        f: (v) => near(v[1], ab),
        m: 'Dat is de lengte van AB. BD is het stuk dat overblijft als je AD eraf haalt.',
      },
    ],
    v: () => near(ad / ab, ae / ac) && near(de / bc, ad / ab),
  };
}
function s22py() {
  const [a, b, c] = pick(TRP),
    dg = ri(2, Math.max(2, Math.floor(b * 0.7))),
    gh = (dg * a) / b,
    dh = (dg * c) / b,
    f = [F('KL =', b), RF('PQ =', gh)];
  return {
    q: T(
      `In △KLM is ∠L = 90°, LM = ${a} en KM = ${c}. P ligt op KL en Q op KM, met PQ evenwijdig aan LM en KP = ${dg}. Bereken KL en PQ.${needRound(f)}`,
    ),
    fig: geo({
      pts: { K: [0, b], L: [0, 0], M: [a, 0], P: [0, b - dg], Q: [(dg * a) / b, b - dg] },
      segs: ['KL', 'LM', 'MK', 'PQ'],
      rights: [
        { at: 'L', p: 'K', q: 'M' },
        { at: 'P', p: 'K', q: 'Q' },
      ],
      sides: [
        { a: 'L', b: 'M', t: a },
        { a: 'K', b: 'M', t: c },
        { a: 'K', b: 'P', t: dg },
      ],
      w: 320,
      maxH: 270,
    }),
    fields: f,
    hint: 'Bereken KL eerst met de stelling van Pythagoras. Daarna gebruik je △KLM ∼ △KPQ.',
    steps: [
      `In △KLM is ∠L = 90°, dus KL^2 + LM^2 = KM^2`,
      `KL^2 + ${a}^2 = ${c}^2`,
      `KL^2 = ${c * c - a * a}`,
      `KL = √${c * c - a * a} = ${b}`,
      '∠K (in △KLM) = ∠K (in △KPQ)',
      '∠L = ∠P (= 90°)',
      'Dus △KLM ∼ △KPQ.',
      H(
        vt(['KL', 'LM'], ['KP', 'PQ']) +
          T(' geeft ') +
          vt([String(b), String(a)], [String(dg), 'PQ']) +
          T(` geeft PQ = {${dg}*${a}/${b}} ${ap(gh)}`),
      ),
    ],
    traps: [flipTrap(f, { 1: (b * a) / dg })],
    v: () => a * a + b * b === c * c && near(gh / a, dg / b) && near(dh / c, dg / b),
  };
}

export default {
  slug: 'gelijkvormige-driehoeken',
  title: 'Gelijkvormige driehoeken',
  intro:
    'Is de ene driehoek een vergroting of verkleining van de andere, dan heten ze gelijkvormig. Hier leer je hoe je daarmee de lengte van een zijde berekent die niet gegeven is.',
  description:
    'Bereken zijden van gelijkvormige driehoeken met de vergrotingsfactor en een verhoudingstabel. Gratis uitleg en oefenvragen met uitwerkingen.',
  videos: {
    menno: [
      ['Gelijkvormigheid', 'cVu2DqhSueY'],
      ['Zijden berekenen bij gelijkvormigheid', 'AUG0yTp8s3c'],
      ['Gelijkvormige driehoeken en gelijke hoeken', 'Nu3EUket9G0'],
    ],
    bob: [
      ['Gelijkvormigheid en verhoudingstabellen', 'bkPR3r5A0pc'],
      ['Zijden berekenen bij gelijkvormigheid', 'gQxkRZxO5lU'],
      ['Gelijkvormige driehoeken en gelijke hoeken', 'Kn5RV8Tyb30'],
    ],
  },
  skills: [
    [47, 'Vergrotingsfactor', s22factor],
    [48, 'Letters in de goede volgorde', s22note],
    [49, 'De goede tabel kiezen', s22tab],
    [50, 'Zijden berekenen', s22sides],
    [51, 'Gemeenschappelijke hoek', s22comm],
    [52, 'Eerst Pythagoras', s22py],
  ],
  learn: [
    {
      t: 'Wat is gelijkvormig?',
      p: [
        T(
          'Twee driehoeken zijn gelijkvormig als de een een vergroting of verkleining is van de ander. De hoeken zijn gelijk en de zijden passen in een verhoudingstabel. Je schrijft △ABC ∼ △DEF.',
        ),
      ],
      widget: 'scale',
    },
    {
      t: 'De volgorde van de letters',
      p: [
        T(
          'Uit de gelijke hoeken volgt de volgorde. Is ∠A = ∠E, ∠B = ∠F en ∠C = ∠D, dan schrijf je △ABC ∼ △EFD.',
        ),
      ],
      ex: {
        q: T('Uit △ABC ∼ △EFD volgt de tabel:'),
        steps: [H(vt(['AB', 'BC', 'AC'], ['EF', 'FD', 'ED']))],
      },
    },
    {
      t: 'Zijden berekenen',
      how: [
        'Schrijf de gelijkvormige driehoeken op, letters in de goede volgorde.',
        'Maak de verhoudingstabel met letters.',
        'Vul de getallen in.',
        'Vermenigvuldig kruislings.',
      ],
      watch:
        'Zit de ene driehoek in de andere? Haal ze in gedachten uit elkaar en teken ze los. Een stuk als BD reken je daarna uit met AB - AD.',
    },
  ],
};

export { s22comm };
