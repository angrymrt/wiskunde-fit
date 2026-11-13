// Onderwerp: Top en snijpunten van een parabool. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, nz, pick, coin, near, d, rd, sg, Q, qv, qMul, fr, isNice, dlin } from '../math.js';
import {
  F,
  RF,
  H,
  MC,
  needRound,
  quad,
  byFactor,
  quadValue as value,
  fillQuad as fill,
  fairSlips,
  valueTraps,
  coef,
  vertexForm,
  factorForm,
  pt,
  solveSteps,
  scaleText,
} from './shared.js';
import { graph } from '../figures.js';
import { T } from '../typeset.js';

const NAMES = ['f', 'g', 'h'];
// Een melding na een valkuil is gewone tekst, dus met een echt minteken.
const minus = (s) => String(s).replace(/-/g, '−');
const cap = (s) => s[0].toUpperCase() + s.slice(1);
// De functiewaarde op een andere manier dan in de uitwerking, voor de controle v.
const horner = ([a, b, c], x) => (a * x + b) * x + c;
// Waar de grafiek de x-as snijdt, met de abc-formule. Voor de controle v.
function roots([a, b, c]) {
  const D = b * b - 4 * a * c;
  if (D < 0) return [];
  return [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((p, q) => p - q);
}
// a(x − d)(x − e) en a(x − p)² + q als [a, b, c], met gewone getallen.
const fromFactors = (a, r, s) => [qv(a), -qv(a) * (r + s), qv(a) * r * s];
const fromVertex = (a, p, q) => [qv(a), -2 * qv(a) * p, qv(a) * p * p + q];
// [a, b, c] terug uit drie functiewaarden, voor de controle v: zo volgt de parabool uit de formule
// zelf en niet uit hoe de vraag is gemaakt.
const fromValues = (f) => [(f(1) + f(-1) - 2 * f(0)) / 2, (f(1) - f(-1)) / 2, f(0)];
const sameAbc = (k, m) => k.every((x, i) => near(x, m[i], 1e-6));
// Een afgerond getal met precies n decimalen, zoals 2,0 of 7,63.
const fixed = (x, n) => rd(x, n).toFixed(n).replace('.', ',');

// De invulling in a(x − d)(x − e), zoals in het boek: f(2) = (2 + 1)(2 − 5) = 3 · −3 = −9.
// d en e zijn hier nooit 0.
function fillFactors(n, a, r, s, x) {
  const A = qv(a),
    m = rd(x - r, 6),
    k = rd(x - s, 6),
    part = (t) => `(${d(x)}${sg(-t)})`,
    num = typeof a === 'object' ? fr(a) : d(A),
    // Bij a = −1 staat de min voor het product, zoals −(−1 · 1), en niet −1 · −1 · 1.
    prod = A === 1 ? `${d(m)}*${d(k)}` : A === -1 ? `-(${d(m)}*${d(k)})` : `${num}*${d(m)}*${d(k)}`;
  return `${n}(${d(x)}) = ${coef(a)}${part(r)}${part(s)} = ${prod} = ${d(rd(A * m * k, 6))}`;
}
// x_top = −b/(2a) met de getallen ingevuld, zoals in het boek: {-(-6)/2*1}.
const xtopText = (a, b) => `x_top = {-b/2a} = {${b < 0 ? `-(${d(b)})` : `-${d(b)}`}/2*${d(a)}}`;

// Een schets zoals in de figuren van het boek: de parabool met de gemarkeerde punten, zonder
// getallen. De punten staan aan de kant waar de grafiek niet loopt.
const topY = (abc) => horner(abc, -abc[1] / (2 * abc[0]));
// Of de schets duidelijk is: de top ligt niet vlak bij de x-as vergeleken met de hoogte van de
// hele schets. Anders vallen A, B en T op elkaar.
function clear(abc) {
  const ys = [0, abc[2], topY(abc)],
    span = Math.max(...ys) - Math.min(...ys);
  return Math.abs(topY(abc)) * 4 >= span;
}
function sketchFig(abc, marks, label) {
  const xs = marks.map((p) => p.x),
    ys = [0, topY(abc), ...marks.map((p) => p.y)],
    x0 = Math.floor(Math.min(0, ...xs)) - 2,
    x1 = Math.ceil(Math.max(0, ...xs)) + 2,
    lo = Math.min(...ys),
    hi = Math.max(...ys),
    // Eén hokje op de y-as is zo veel, dat de schets ongeveer 0,8 keer zo hoog als breed is.
    ys1 = (hi - lo || 1) / ((x1 - x0) * 0.8),
    below = abc[0] > 0,
    off = {
      A: [-16, below ? 16 : -7],
      B: [6, below ? 16 : -7],
      C: [6, below ? -6 : 16],
      T: [6, below ? 16 : -8],
    };
  return graph({
    xr: [x0, x1],
    yr: [lo / ys1 - 1.2, hi / ys1 + 1.2],
    u: 220 / (x1 - x0),
    ys: ys1,
    sketch: true,
    curves: [{ abc }],
    pts: marks.map((p) => ({ ...p, off: off[p.label] })),
    label,
  });
}

// Getallen voor a: meestal geheel, soms een kommagetal zoals in het boek.
const A_INT = [-3, -2, -1, 1, 2, 3];
const A_DEC = [-1.8, -1.5, -1.2, -0.6, -0.5, -0.4, 0.4, 0.5, 0.6, 1.2, 1.5];
function s31top() {
  let abc, h;
  do {
    const kind = pick(['geheel', 'geheel', 'half', 'komma']),
      a = pick(kind === 'komma' ? A_DEC : A_INT);
    h =
      kind === 'geheel'
        ? nz(-4, 4)
        : kind === 'half'
          ? pick([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5])
          : pick([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5, -2, -1, 1, 2, 3]);
    abc = [a, rd(-2 * a * h, 6), nz(-9, 12)];
  } while (
    !isNice(abc[1], 2) ||
    !isNice(value(abc, h), 2) ||
    Math.abs(value(abc, h)) > 40 ||
    !fairSlips(abc, h)
  );
  const [a, b] = abc,
    n = pick(NAMES),
    yt = value(abc, h);
  return {
    q: T(`Gegeven is de functie ${n}(x) = ${quad(abc)}. Bereken de coördinaten van de top.`),
    fields: [F('x_top =', h), F('y_top =', yt)],
    compact: true,
    hint: T(
      'Bereken eerst x_top = {-b/2a}. Vul x_top daarna in de formule in, dan krijg je y_top.',
    ),
    steps: [
      `a = ${d(a)} en b = ${d(b)}`,
      `${xtopText(a, b)} = ${d(h)}`,
      `y_top = ${fill(n, abc, h)}`,
      `Dus de top is ${pt(h, yt)}.`,
    ],
    traps: [
      {
        id: 'teken-xtop',
        f: (v) => near(v[0], -h),
        m: 'Let op de min in x_top = −b/(2a). Is b negatief, dan is −b positief.',
      },
      {
        id: 'twee-vergeten',
        f: (v) => near(v[0], 2 * h),
        m: 'Deel door 2a en niet alleen door a: x_top = −b/(2a).',
      },
      ...valueTraps(abc, [[1, h]]),
    ],
    // De top ligt midden tussen twee punten met dezelfde functiewaarde.
    v: () =>
      near(horner(abc, h - 1), horner(abc, h + 1)) &&
      near(horner(abc, h), yt) &&
      horner(abc, h + 0.1) * Math.sign(a) > yt * Math.sign(a),
  };
}

// Getallen voor a in a(x − p)² + q en a(x − d)(x − e). Een half staat als breuk, zoals in het boek.
const A_FORM = [-3, -2, -1, -1, 1, 1, 2, 3, Q(1, 2), Q(-1, 2)];
function s35top() {
  const a = pick(A_FORM),
    kind = pick(['pq', 'pq', 'pq', 'p', 'q']),
    p = kind === 'q' ? 0 : nz(-6, 6),
    q = kind === 'p' ? 0 : nz(-9, 9),
    n = pick(NAMES),
    f = vertexForm(a, p, q),
    traps = [];
  if (p)
    traps.push({
      id: 'teken-p',
      f: (v) => near(v[0], -p),
      m: minus(
        `Let op het teken van p. In a(x − p)² + q staat een min voor p. Bij (x ${p < 0 ? `+ ${-p}` : `- ${p}`}) is p = ${p}.`,
      ),
    });
  if (p !== q)
    traps.push({
      id: 'p-en-q-omgedraaid',
      f: (v) => near(v[0], q) && near(v[1], p),
      m: 'De top is (p, q): eerst het getal in de haakjes, dan het getal erachter.',
    });
  return {
    q: T(`Gegeven is de functie ${n}(x) = ${f}. Wat zijn de coördinaten van de top?`),
    fields: [F('x_top =', p), F('y_top =', q)],
    compact: true,
    hint: T('De top van f(x) = a(x - p)^2 + q is (p, q). Let op het teken van p.'),
    steps: [
      p
        ? p < 0
          ? `x + ${-p} = x - -${-p}, dus p = ${p}.`
          : `In de haakjes staat x - ${p}, dus p = ${p}.`
        : `Er staan geen haakjes: x^2 = (x - 0)^2, dus p = 0.`,
      q
        ? `Achter het kwadraat staat ${q}, dus q = ${q}.`
        : 'Er staat geen getal achter het kwadraat, dus q = 0.',
      `De top van a(x - p)^2 + q is (p, q). Dus de top is (${p}, ${q}).`,
    ],
    traps,
    // De top ook met x_top = −b/(2a), na de haakjes wegwerken.
    v: () => {
      const abc = fromValues((x) => qv(a) * (x - p) ** 2 + q),
        xt = -abc[1] / (2 * abc[0]);
      return near(xt, p) && near(horner(abc, xt), q);
    },
  };
}

function s34top() {
  let a, r, s, c, xt, yt;
  do {
    a = pick(A_FORM);
    r = nz(-8, 8);
    s = nz(-8, 8);
    xt = (r + s) / 2;
    yt = qv(a) * (xt - r) * (xt - s);
    c = qv(a) * r * s;
  } while (
    r >= s ||
    (s - r) % 2 ||
    !xt ||
    !Number.isInteger(yt) ||
    !Number.isInteger(c) ||
    Math.abs(yt) > 50 ||
    !clear(fromFactors(a, r, s)) ||
    Math.abs(c) > 50
  );
  const n = pick(NAMES),
    // In de formule staan d en e in willekeurige volgorde. A ligt links van B.
    [dd, ee] = coin() ? [r, s] : [s, r],
    f = factorForm(a, dd, ee),
    abc = fromFactors(a, r, s),
    A = qv(a),
    traps = [
      {
        id: 'teken-snijpunten',
        f: (v) => near(v[0] + v[1], -(r + s)) && near(v[0] * v[1], r * s),
        m: minus(
          `De grafiek van a(x − d)(x − e) snijdt de x-as in (d, 0) en (e, 0). Let op het teken: bij (${dlin(1, -r)}) hoort het snijpunt (${r}, 0).`,
        ),
      },
      {
        id: 'volgorde-a-b',
        f: (v) => near(v[0], s) && near(v[1], r),
        m: 'A ligt links van B, dus A heeft de kleinste x-coördinaat.',
      },
    ];
  if (A !== 1)
    traps.push({
      id: 'factor-a-vergeten',
      f: (v) => near(v[2], r * s) || near(v[4], (xt - r) * (xt - s)),
      m: 'Vergeet het getal voor de haakjes niet. Vermenigvuldig ook met a.',
    });
  return {
    q: T(
      `Gegeven is de functie ${n}(x) = ${f}. De grafiek snijdt de x-as in A en B, met A links van B, en de y-as in C. T is de top. Bereken de coördinaten van A, B, C en T.`,
    ),
    fig: sketchFig(
      abc,
      [
        { x: r, y: 0, label: 'A' },
        { x: s, y: 0, label: 'B' },
        { x: 0, y: c, label: 'C' },
        { x: xt, y: yt, label: 'T' },
      ],
      `Schets van de grafiek van ${n} met de punten A, B, C en T`,
    ),
    fields: [
      { ...F('A(', r, ', 0)'), label: 'x-coördinaat van A' },
      { ...F('B(', s, ', 0)'), label: 'x-coördinaat van B' },
      { ...F('C(0,', c, ')'), label: 'y-coördinaat van C' },
      { ...F('T(', xt, ','), label: 'x-coördinaat van de top T', br: true },
      { ...F('', yt, ')'), label: 'y-coördinaat van de top T' },
    ],
    compact: true,
    hint: T(
      'De grafiek van a(x - d)(x - e) snijdt de x-as in (d, 0) en (e, 0). Het snijpunt met de y-as is (0, f(0)). x_top ligt midden tussen d en e.',
    ),
    steps: [
      `d = ${dd} en e = ${ee}, dus A(${r}, 0) en B(${s}, 0).`,
      `${fillFactors(n, a, dd, ee, 0)}, dus C(0, ${c}).`,
      `x_top = {d + e/2} = {${dd}${sg(ee)}/2} = ${xt}`,
      `y_top = ${fillFactors(n, a, dd, ee, xt)}`,
      `Dus T(${xt}, ${yt}).`,
    ],
    traps,
    // De snijpunten met de abc-formule, na de haakjes wegwerken.
    v: () => {
      const k = fromValues((x) => A * (x - dd) * (x - ee)),
        [x1, x2] = roots(k);
      return (
        near(x1, r) &&
        near(x2, s) &&
        near(k[2], c) &&
        near(-k[1] / (2 * k[0]), xt) &&
        near(horner(k, xt), yt)
      );
    },
  };
}

// x = 0 invullen in ax² + bx + c, zoals in het boek: f(0) = 0² − 2 · 0 − 8 = −8. De getallen zijn
// breuken uit Q.
function atZero(n, abc) {
  const [A, B, C] = abc.map(qv),
    abs = (k) => Q(Math.abs(k.n), k.d);
  let s = A === 1 ? '0^2' : A === -1 ? '-0^2' : `${fr(abc[0])}*0^2`;
  if (B)
    s += ` ${B < 0 ? '-' : '+'} ${Math.abs(B) === 1 ? '0' : `${abs(abc[1]).d === 1 ? fr(abs(abc[1])) : `{${abs(abc[1]).n}/${abs(abc[1]).d}}`}*0`}`;
  if (C) s += ` ${C < 0 ? '-' : '+'} ${fr(abs(abc[2]))}`;
  return `${n}(0) = ${s} = ${fr(abc[2])}`;
}
// Het getal voor x² bij Snijpunten met de assen: 1, −1 of een getal waardoor je eerst deelt of
// vermenigvuldigt.
const SCALE = [1, 1, 1, -1, -1, 2, 3, -2, -3, [1, 2], [-1, 2], [-1, 3]];
function s33axes() {
  const sc = pick(SCALE),
    k = Array.isArray(sc) ? Q(sc[0], sc[1]) : Q(sc);
  let p, q;
  do {
    p = nz(-9, 9);
    q = nz(-9, 9);
  } while (
    p >= q ||
    p === -q ||
    Math.abs(p * q) > 40 ||
    // Het snijpunt met de y-as is een geheel getal, en niet te groot.
    !Number.isInteger(qv(qMul(k, p * q))) ||
    Math.abs(qv(k) * p * q) > 60 ||
    !clear([1, -(p + q), p * q].map((x) => x * qv(k)))
  );
  const n = pick(NAMES),
    N = [1, -(p + q), p * q],
    abc = N.map((x) => qMul(k, x)),
    num = abc.map(qv),
    c = num[2],
    fs = [
      [1, -p],
      [1, -q],
    ].sort(byFactor),
    traps = [
      {
        id: 'teken-omgedraaid',
        f: (v) => near(v[0] + v[1], -(p + q)) && near(v[0] * v[1], p * q),
        m: 'Let op het teken: x + 3 = 0 geeft x = −3, want −3 + 3 = 0.',
      },
      {
        id: 'volgorde-a-b',
        f: (v) => near(v[0], q) && near(v[1], p),
        m: 'A ligt links van B, dus A heeft de kleinste x-coördinaat.',
      },
    ];
  if (qv(k) !== 1)
    traps.push({
      id: 'y-as-na-delen',
      f: (v) => near(v[2], p * q),
      m: `Het snijpunt met de y-as is ${n}(0). Vul x = 0 in de functie zelf in, en niet in de vergelijking na het ${k.d === 1 && k.n !== -1 ? 'delen' : 'vermenigvuldigen'}.`,
    });
  return {
    q: T(
      `Gegeven is de functie ${n}(x) = ${quad(abc)}. De grafiek snijdt de x-as in A en B, met A links van B, en de y-as in C. Bereken de coördinaten van A, B en C.`,
    ),
    fig: sketchFig(
      num,
      [
        { x: p, y: 0, label: 'A' },
        { x: q, y: 0, label: 'B' },
        { x: 0, y: c, label: 'C' },
      ],
      `Schets van de grafiek van ${n} met de punten A, B en C`,
    ),
    fields: [
      { ...F('A(', p, ', 0)'), label: 'x-coördinaat van A' },
      { ...F('B(', q, ', 0)'), label: 'x-coördinaat van B' },
      { ...F('C(0,', c, ')'), label: 'y-coördinaat van C' },
    ],
    compact: true,
    hint: T(
      `Op de x-as is y = 0, dus los ${n}(x) = 0 op. Op de y-as is x = 0, dus bereken ${n}(0).`,
    ),
    steps: [
      `${n}(x) = 0 geeft ${quad(abc)} = 0`,
      ...(qv(k) !== 1 ? [scaleText(k), `${quad(N)} = 0`] : []),
      ...solveSteps(fs),
      `Dus A(${p}, 0) en B(${q}, 0).`,
      `${atZero(n, abc)}, dus C(0, ${c}).`,
    ],
    traps,
    v: () => {
      const [x1, x2] = roots(num);
      return near(x1, p) && near(x2, q) && near(horner(num, 0), c);
    },
  };
}

// Schets bij een formule: de vier schetsen verschillen in dal of berg en in de plek van de top.
const SK = { xr: [-5, 5], yr: [-6, 6], u: 14, sketch: true };
const sk = (abc) => graph({ ...SK, curves: [{ abc }], label: 'Schets' });
function s35sketch() {
  const a = pick([-2, -1, -1, -0.5, 0.5, 1, 1, 2]),
    p = nz(-3, 3),
    // De top ligt niet vlak bij de x-as, zodat je in de schets ziet aan welke kant hij ligt.
    q = pick([-4, -3, -2, 2, 3, 4]),
    n = pick(NAMES),
    abc = fromVertex(a, p, q),
    figs = [abc, fromVertex(-a, p, q), fromVertex(a, -p, q), fromVertex(a, p, -q)].map(sk),
    mc = MC(figs, 0),
    side = `${p > 0 ? 'rechts' : 'links'} van de y-as en ${q > 0 ? 'boven' : 'onder'} de x-as`;
  return {
    q: T(`Welke schets hoort bij ${n}(x) = ${vertexForm(a, p, q)}?`),
    mc,
    hint: T('Kijk naar a: dalparabool of bergparabool? De top van a(x - p)^2 + q is (p, q).'),
    steps: [
      `a = ${d(a)}, dus a ${a > 0 ? '>' : '<'} 0. De grafiek is een ${a > 0 ? 'dal' : 'berg'}parabool.`,
      `De top is (${p}, ${q}). Die ligt ${side}.`,
      H(
        graph({
          ...SK,
          u: 18,
          // De naam staat een eind van de top, en binnen het beeld.
          curves: [
            {
              abc,
              name: n,
              at: [1.5, -1.5, 1, -1, 2, -2]
                .map((t) => p + t)
                .find(
                  (x) => Math.abs(horner(abc, x)) <= 5 && Math.abs(x) <= 4.5 && Math.abs(x) > 0.6,
                ),
            },
          ],
          pts: [{ x: p, y: q, label: minus(`T(${p}, ${q})`), off: [-22, a > 0 ? 18 : -9] }],
          label: `Schets van de grafiek van ${n}`,
        }),
      ),
    ],
    traps: [
      {
        id: 'dal-berg-omgedraaid',
        f: (v) => v[0] === figs[1],
        m: 'Kijk naar a. Bij a > 0 hoort een dalparabool en bij a < 0 een bergparabool.',
      },
      {
        id: 'teken-p',
        f: (v) => v[0] === figs[2],
        m: 'De top ligt aan de verkeerde kant van de y-as. Let op het teken van p: bij (x + 2) is p = −2.',
      },
      {
        id: 'teken-q',
        f: (v) => v[0] === figs[3],
        m: 'De top ligt aan de verkeerde kant van de x-as. Het getal achter het kwadraat is q, met het teken ervoor.',
      },
    ],
    // De goede schets hoort bij de parabool die uit de formule zelf volgt.
    v: () => {
      const k = fromValues((x) => a * (x - p) ** 2 + q);
      return sameAbc(k, abc) && mc.opts[mc.a] === sk(k);
    },
  };
}

// Eigen verhalen over iets dat door de lucht gaat, met x de afstand en f(x) de hoogte in meter.
// a, h (x_top) en c zijn lijsten waaruit de vraag kiest.
const FLIGHTS = [
  {
    t: 'In een dolfinarium springt een dolfijn uit het water.',
    wat: 'de dolfijn',
    van: 'de plek waar de dolfijn uit het water komt',
    boven: 'het water',
    a: [-0.4, -0.5, -0.6],
    h: [1.5, 2, 2.5],
    c: [0],
  },
  {
    t: 'Een brandweerman spuit met een slang water over een schuur.',
    wat: 'het water',
    van: 'de slang',
    boven: 'de grond',
    a: [-0.02, -0.025, -0.04],
    h: [8, 10, 12, 15],
    c: [1, 1.2, 1.5],
  },
  {
    t: 'Een kikker springt van een blad naar de kant van de sloot.',
    wat: 'de kikker',
    van: 'het blad',
    boven: 'het water',
    a: [-2, -2.5, -3],
    h: [0.3, 0.4, 0.5],
    c: [0],
  },
  {
    t: 'Bij volleybal speelt Lotte de bal met een bovenhandse pass naar een teamgenoot.',
    wat: 'de bal',
    van: 'Lotte',
    boven: 'de grond',
    a: [-0.2, -0.25, -0.3],
    h: [1.5, 2, 2.5, 3],
    c: [1.8, 2, 2.2],
  },
  {
    t: 'Een stuntrijder springt met zijn motor van een schans.',
    wat: 'de motor',
    van: 'het eind van de schans',
    boven: 'de grond',
    a: [-0.02, -0.025],
    h: [8, 10, 12],
    c: [1.5, 2, 2.5],
  },
];
function s32max() {
  const s = pick(FLIGHTS),
    n = pick(NAMES),
    a = pick(s.a),
    h = pick(s.h),
    c = pick(s.c),
    abc = [a, rd(-2 * a * h, 6), c],
    b = abc[1],
    y = value(abc, h),
    fields = [F('afstand:', h, 'meter'), RF('maximale hoogte:', y, 2, 'meter')],
    traps = [
      {
        id: 'teken-xtop',
        f: (v) => near(v[0], -h),
        m: 'Let op de min in x_top = −b/(2a). Een afstand is hier positief.',
      },
    ];
  if (Math.abs(rd(y, 2) - h) > 0.05)
    traps.push({
      id: 'x-top-als-hoogte',
      f: (v) => near(v[1], h),
      m: 'x_top is de afstand waarop het hoogste punt ligt. De maximale hoogte is y_top: vul x_top in de formule in.',
    });
  if (Math.abs(rd(y, 2) - c) > 0.05)
    traps.push({
      id: 'starthoogte',
      f: (v) => near(v[1], c),
      m: 'Dat is de hoogte bij x = 0. De maximale hoogte is y_top, de hoogte bij x_top.',
    });
  return {
    q:
      T(
        `${s.t} Voor de hoogte van ${s.wat} geldt ${n}(x) = ${quad(abc)}. Hierin is x de afstand in meter vanaf ${s.van} en ${n}(x) de hoogte in meter boven ${s.boven}. Op welke afstand is ${s.wat} het hoogst, en hoe hoog is dat?`,
      ) + T(needRound(fields)),
    fields,
    hint: T('Het hoogste punt is de top. Bereken x_top = {-b/2a} en daarna y_top.'),
    steps: [
      `a = ${d(a)} en b = ${d(b)}`,
      `${xtopText(a, b)} = ${d(h)}`,
      `y_top = ${fill(n, abc, h)}`,
      `Dus ${s.wat} is het hoogst op ${d(h)} meter vanaf ${s.van}. De maximale hoogte is ${isNice(y, 2) ? d(y) : `ongeveer ${fixed(y, 2)}`} meter.`,
    ],
    traps,
    // Het hoogste punt ligt midden tussen twee punten even hoog, en hoger dan de punten ernaast.
    v: () =>
      near(horner(abc, h - 1), horner(abc, h + 1)) &&
      [-0.1, 0.1].every((e) => horner(abc, h + e) < y) &&
      near(horner(abc, h), y),
  };
}

// Eigen verhalen over een boog die op de grond staat.
const ARCHES = [
  { t: 'Een fietstunnel onder een dijk heeft een gebogen plafond.', wat: 'de tunnel' },
  { t: 'Een poort in een oude stadsmuur heeft een boog als bovenkant.', wat: 'de poort' },
  { t: 'Een kas heeft een rond dak dat tot op de grond loopt.', wat: 'de kas' },
];
function s34tunnel() {
  const s = pick(ARCHES),
    n = pick(NAMES),
    kind = coin() ? 'de' : 'abc';
  let a, r, w;
  do {
    if (kind === 'de') {
      a = pick([-0.1, -0.15, -0.2, -0.25, -0.3, -0.4, -0.5]);
      r = pick([0.6, 0.8, 1, 1.2, 1.4, 1.5, 1.8, 2, 2.4]);
      w = pick([4, 4.4, 4.8, 5, 5.2, 5.6, 6, 6.4, 7, 7.2, 7.8, 8]);
    } else {
      a = pick([-0.125, -0.2, -0.25, -0.5]);
      r = ri(1, 4);
      w = ri(4, 10);
    }
  } while (-a * (w / 2) ** 2 < 2 || -a * (w / 2) ** 2 > 6);
  const e = rd(r + w, 6),
    xt = rd((r + e) / 2, 6),
    abc = [a, rd(-a * (r + e), 6), rd(a * r * e, 6)],
    top = rd(-a * (w / 2) ** 2, 6),
    fields = [F('breedte:', w, 'meter'), RF('hoogte:', top, 1, 'meter')],
    formula = kind === 'de' ? factorForm(a, r, e) : quad(abc),
    k = Q(-1, Math.round(-1 / a)),
    traps = [
      {
        id: 'som-in-plaats-van-verschil',
        f: (v) => near(v[0], r + e),
        m: 'De breedte is de afstand tussen de twee snijpunten met de x-as. Trek de x-coördinaten van elkaar af.',
      },
      {
        id: 'halve-breedte',
        f: (v) => near(v[0], w / 2),
        m: 'Dat is de afstand van het midden tot de rand. De breedte is de hele afstand tussen de twee snijpunten met de x-as.',
      },
    ];
  if (Math.abs(rd(top, 1) - xt) > 0.05)
    traps.push({
      id: 'x-top-als-hoogte',
      f: (v) => Math.abs(v[1] - xt) < 0.051,
      m: 'x_top zegt waar het hoogste punt ligt. De hoogte is y_top: vul x_top in de formule in.',
    });
  const ground =
    kind === 'de'
      ? [`De grafiek snijdt de x-as bij x = ${d(r)} en x = ${d(e)}.`]
      : [
          `${n}(x) = 0 geeft ${quad(abc)} = 0`,
          scaleText(k),
          `${quad([1, -(r + e), r * e])} = 0`,
          ...solveSteps([
            [1, -r],
            [1, -e],
          ]),
        ];
  return {
    q:
      T(
        `${s.t} Voor de bovenkant geldt ${n}(x) = ${formula}. De grond ligt op de x-as, en x en ${n}(x) zijn in meter. Bereken hoe breed en hoe hoog ${s.wat} is.`,
      ) + T(needRound(fields)),
    fields,
    hint: T(
      `De breedte is de afstand tussen de snijpunten met de x-as. De hoogte is y_top.${kind === 'abc' ? ` Los dus eerst ${n}(x) = 0 op.` : ''}`,
    ),
    steps: [
      ...ground,
      `Dus de breedte is ${d(e)} - ${d(r)} = ${d(w)} meter.`,
      kind === 'de'
        ? `x_top = {d + e/2} = {${d(r)} + ${d(e)}/2} = ${d(xt)}`
        : `${xtopText(a, abc[1])} = ${d(xt)}`,
      `y_top = ${kind === 'de' ? fillFactors(n, a, r, e, xt) : fill(n, abc, xt)}`,
      `Dus ${s.wat} is ${isNice(top, 1) ? d(top) : `ongeveer ${fixed(top, 1)}`} meter hoog.`,
    ],
    traps,
    v: () => {
      const [x1, x2] = roots(abc);
      return (
        near(x2 - x1, w) &&
        near(horner(abc, xt - 1), horner(abc, xt + 1)) &&
        near(horner(abc, xt), top)
      );
    },
  };
}

// Een boog voor de vragen over de hoogte op een afstand van het midden. Met kind 'de' staat de
// formule als a(x − d)(x − e), anders als ax² + bx + c. r en e zijn de x van de linker- en de
// rechterkant, xt is het midden en top de hoogte. half is de halve breedte die minstens nodig is.
function makeArch(kind, half) {
  let a, r, e, xt, top, abc;
  do {
    if (kind === 'de') {
      a = pick([-0.1, -0.15, -0.2, -0.25, -0.3, -0.4, -0.5]);
      r = pick([0.5, 0.8, 1, 1.2, 1.5, 2, 2.5, 3]);
      const w = pick([4, 4.4, 5, 5.6, 6, 6.4, 7, 7.2, 8, 9, 10]);
      e = rd(r + w, 6);
      xt = rd((r + e) / 2, 6);
      top = rd(-a * (w / 2) ** 2, 6);
      abc = [a, rd(-a * (r + e), 6), rd(a * r * e, 6)];
    } else {
      // Eerst de top, dan de formule: zo komen b en c mooi uit. De kanten hoeven dat niet.
      a = pick([-0.2, -0.25, -0.3, -0.4, -0.5, -0.6]);
      xt = pick([3, 3.5, 4, 4.5, 5, 5.5, 6]);
      top = ri(25, 60) / 10;
      abc = [a, rd(-2 * a * xt, 6), rd(a * xt * xt + top, 6)];
      const h = Math.sqrt(top / -a);
      r = xt - h;
      e = xt + h;
    }
  } while (
    top < 2 ||
    top > 6 ||
    r < 0.3 ||
    (e - r) / 2 < half ||
    (kind !== 'de' && (!isNice(abc[1], 2) || !isNice(abc[2], 2)))
  );
  return { a, r, e, xt, top, abc };
}
// Een schets van de boog op de x-as, zonder getallen. Met getallen zou de beschrijving voor een
// schermlezer de top verklappen.
function archFig(abc, e, top, n, label) {
  const x1 = e + 1,
    y1 = top + 1,
    u = Math.min(260 / (x1 + 0.5), 170 / y1);
  return graph({
    xr: [-0.5, x1],
    yr: [0, y1],
    u,
    sketch: true,
    curves: [{ abc, name: n }],
    label,
  });
}
// Een afgerond getal mag ook: een fout getal geldt als het daar hoogstens 0,05 van af ligt.
const hit = (v, w) => Math.abs(v - w) < 0.051;
// Valkuilen voor één veld met een hoogte. Een fout getal telt alleen mee als het duidelijk verschilt
// van het goede getal en van de fouten ervoor, zodat de melding over de goede fout gaat.
function heightTraps(y, list) {
  const used = [y];
  return list.filter(([, w]) => {
    if (!Number.isFinite(w) || used.some((t) => Math.abs(t - w) < 0.15)) return false;
    used.push(w);
    return true;
  });
}

// kind is 'abc' voor f(x) = ax² + bx + c, zoals in paragraaf 3.2, of 'de' voor
// f(x) = a(x − d)(x − e), zoals in paragraaf 3.4.
function wall(kind) {
  const s = pick(ARCHES),
    n = pick(NAMES),
    // Vanaf de kant kan alleen als je de kanten zo uit de formule afleest.
    from = kind === 'de' && coin() ? 'kant' : 'midden',
    side = pick(['links', 'rechts']),
    { a, r, e, xt, top, abc } = makeArch(kind, 1.8),
    half = (e - r) / 2,
    u = pick([0.5, 1, 1.5, 2, 2.5, 3, 3.5].filter((t) => t <= half - 0.6)),
    right = side === 'rechts',
    edge = right ? e : r,
    x = rd(from === 'midden' ? xt + (right ? u : -u) : edge + (right ? -u : u), 6),
    at = (t) => rd(value(abc, t), 6),
    y = at(x),
    fields = [RF('hoogte:', y, 1, 'meter')],
    formula = kind === 'de' ? factorForm(a, r, e) : quad(abc),
    plus = (p, q) => `${d(p)} ${q < 0 ? '-' : '+'} ${d(Math.abs(q))}`,
    where =
      from === 'midden'
        ? `${d(u)} meter ${side} van het midden`
        : `${d(u)} meter van de ${right ? 'rechter' : 'linker'}kant`,
    list =
      from === 'midden'
        ? [
            [
              'hoogte-top',
              top,
              'Dat is de hoogte in het midden, y_top. Ga vanaf x_top de afstand naar links of rechts, en vul die x in de formule in.',
            ],
            [
              'afstand-als-x',
              at(u),
              'Je hebt de afstand zelf als x ingevuld. Maar het midden ligt bij x_top en niet bij x = 0. Tel de afstand op bij x_top, of trek hem ervan af.',
            ],
            ...(kind === 'de'
              ? [
                  [
                    'afstand-vanaf-kant',
                    at(r + u),
                    'Je bent vanaf de kant gaan meten. De afstand is vanaf het midden, dus begin bij x_top.',
                  ],
                ]
              : []),
          ]
        : [
            [
              'afstand-vanaf-midden',
              at(xt + u),
              'De afstand is vanaf de kant en niet vanaf het midden. De kant staat waar de grafiek de x-as snijdt.',
            ],
            [
              'afstand-als-x',
              at(u),
              'Je hebt de afstand zelf als x ingevuld. Maar de kant staat niet bij x = 0. Begin bij het snijpunt met de x-as.',
            ],
          ];
  return {
    q:
      T(
        `${s.t} Voor de bovenkant geldt ${n}(x) = ${formula}. De grond ligt op de x-as, en x en ${n}(x) zijn in meter. Hoe hoog is ${s.wat} ${where}?`,
      ) + T(needRound(fields)),
    fig: archFig(abc, e, top, n, `Schets van de bovenkant van ${s.wat}, de grafiek van ${n}`),
    fields,
    hint: T(
      from === 'midden'
        ? `Het midden ligt bij x_top. Bereken eerst x_top, ga dan ${d(u)} meter naar ${side} en vul die x in.`
        : `De kanten staan waar de grafiek de x-as snijdt. Ga vanaf de ${right ? 'rechter' : 'linker'}kant ${d(u)} meter naar binnen en vul die x in.`,
    ),
    steps: [
      ...(from === 'kant'
        ? [
            `De grafiek snijdt de x-as bij x = ${d(r)} en x = ${d(e)}.`,
            `De ${right ? 'rechter' : 'linker'}kant staat bij x = ${d(edge)}. ${cap(where)} is x = ${plus(edge, right ? -u : u)} = ${d(x)}.`,
          ]
        : [
            ...(kind === 'de'
              ? [`x_top = {d + e/2} = {${d(r)} + ${d(e)}/2} = ${d(xt)}`]
              : [`a = ${d(a)} en b = ${d(abc[1])}`, `${xtopText(a, abc[1])} = ${d(xt)}`]),
            `${cap(where)} is x = ${plus(xt, right ? u : -u)} = ${d(x)}.`,
          ]),
      kind === 'de' ? fillFactors(n, a, r, e, x) : fill(n, abc, x),
      `Dus ${s.wat} is daar ${isNice(y, 1) ? d(y) : `ongeveer ${fixed(y, 1)}`} meter hoog.`,
    ],
    traps: heightTraps(y, list).map(([id, w, m]) => ({ id, f: (v) => hit(v[0], w), m })),
    // Met de snijpunten uit de abc-formule: de hoogte als a(x − x1)(x − x2), en de afstand tot
    // het midden of tot de kant.
    v: () => {
      const [x1, x2] = roots(abc),
        base = from === 'midden' ? (x1 + x2) / 2 : right ? x2 : x1;
      return near(Math.abs(x - base), u, 1e-6) && near(a * (x - x1) * (x - x2), y, 1e-6);
    },
  };
}

// Eigen verhalen over iets dat precies door het midden van een boog gaat.
const PASS = [
  {
    t: 'Een vrachtwagen wil door een tunnel onder een spoorlijn.',
    boog: 'de bovenkant van de tunnel',
    de: 'de tunnel',
    wie: 'de vrachtwagen',
    gaat: 'rijdt',
    grond: 'De weg',
    W: [2.2, 2.4, 2.5, 2.6],
  },
  {
    t: 'Een rondvaartboot vaart onder een stenen brug door. De onderkant van de brug is een boog.',
    boog: 'de boog',
    de: 'de boog',
    wie: 'de boot',
    gaat: 'vaart',
    grond: 'Het water',
    W: [1.6, 1.8, 2, 2.4, 3],
  },
  {
    t: 'Een boer rijdt met een kar vol hooi een schuur in. De deur van de schuur heeft een boog als bovenkant.',
    boog: 'de bovenkant van de deur',
    de: 'de deur',
    wie: 'de kar',
    gaat: 'rijdt',
    grond: 'De grond',
    W: [1.8, 2, 2.2, 2.5],
  },
];
function fit(kind) {
  const s = pick(PASS),
    n = pick(NAMES),
    W = pick(s.W);
  let arch, xs, y, H;
  // Bij de zijkant is de boog nog minstens 1,2 meter hoog, anders past er nooit iets door.
  do {
    arch = makeArch(kind, W / 2 + 0.5);
    xs = rd(arch.xt + W / 2, 6);
    y = rd(value(arch.abc, xs), 6);
  } while (y < 1.2);
  const { a, r, e, xt, top, abc } = arch,
    at = (t) => rd(value(abc, t), 6);
  // Wat erdoor moet, is lager dan de top. Anders zie je het antwoord zonder te rekenen.
  do H = rd(y + pick([-0.5, -0.4, -0.3, -0.2, 0.2, 0.3, 0.4, 0.5]), 1);
  while (Math.abs(H - y) < 0.15 || H < 1 || H > top - 0.15);
  const fits = y > H,
    yes = 'past erdoor',
    no = 'past er niet door',
    sel = fits ? yes : no,
    Wie = cap(s.wie),
    fields = [
      RF('hoogte bij de zijkant:', y, 1, 'meter'),
      { sel: [yes, no], a: sel, pre: Wie, label: `Past ${s.wie} erdoor?`, br: true },
    ],
    formula = kind === 'de' ? factorForm(a, r, e) : quad(abc),
    list = [
      [
        'hele-breedte',
        at(xt + W),
        `${Wie} ${s.gaat} door het midden, dus aan elke kant van het midden zit de helft van de breedte. Ga vanaf x_top de halve breedte opzij.`,
      ],
      [
        'hoogte-top',
        top,
        `Dat is de hoogte in het midden. Maar de zijkant van ${s.wie} zit niet in het midden, en daar is ${s.de} lager.`,
      ],
      [
        'afstand-als-x',
        at(W / 2),
        'Je hebt de halve breedte zelf als x ingevuld. Maar het midden ligt bij x_top en niet bij x = 0. Tel de halve breedte op bij x_top.',
      ],
      ...(kind === 'de'
        ? [
            [
              'afstand-vanaf-kant',
              at(r + W / 2),
              `Je bent vanaf de kant gaan meten. ${Wie} ${s.gaat} door het midden, dus begin bij x_top.`,
            ],
          ]
        : []),
    ];
  return {
    q:
      T(
        `${s.t} Voor ${s.boog} geldt ${n}(x) = ${formula}. ${s.grond} ligt op de x-as, en x en ${n}(x) zijn in meter. ${Wie} is ${d(W)} meter breed en ${d(H)} meter hoog, en ${s.gaat} precies door het midden. Onderzoek of ${s.wie} erdoor past.`,
      ) + T(needRound(fields)),
    fig: archFig(abc, e, top, n, `Schets van ${s.boog}, de grafiek van ${n}`),
    fields,
    hint: T(
      `Het midden ligt bij x_top. De zijkant van ${s.wie} zit de halve breedte van het midden af. Bereken de hoogte van ${s.de} daar en vergelijk die met ${d(H)} meter.`,
    ),
    steps: [
      ...(kind === 'de'
        ? [`x_top = {d + e/2} = {${d(r)} + ${d(e)}/2} = ${d(xt)}`]
        : [`a = ${d(a)} en b = ${d(abc[1])}`, `${xtopText(a, abc[1])} = ${d(xt)}`]),
      `${Wie} ${s.gaat} door het midden. De helft van ${d(W)} meter is ${d(W / 2)} meter.`,
      `De zijkant van ${s.wie} is bij x = ${d(xt)} + ${d(W / 2)} = ${d(xs)}.`,
      kind === 'de' ? fillFactors(n, a, r, e, xs) : fill(n, abc, xs),
      `Daar is ${s.de} ${isNice(y, 1) ? d(y) : `ongeveer ${fixed(y, 1)}`} meter hoog. Dat is ${fits ? 'meer' : 'minder'} dan ${d(H)} meter, dus ${s.wie} ${fits ? yes : no}.`,
    ],
    traps: [
      ...heightTraps(y, list).map(([id, w, m]) => ({ id, f: (v) => hit(v[0], w), m })),
      {
        id: 'conclusie-omgedraaid',
        f: (v) => hit(v[0], y) && !!v[1] && v[1] !== sel,
        m: `Je hoogte klopt. Is ${s.de} bij de zijkant hoger dan ${s.wie}, dan past ${s.wie} erdoor. Is ${s.de} daar lager, dan niet.`,
      },
    ],
    // Andersom: hoe breed is de boog op de hoogte H? Uit a(x − x_top)² + y_top = H. Past het
    // erdoor, dan is de boog daar breder dan W.
    v: () => {
      const [x1, x2] = roots(abc),
        mid = (x1 + x2) / 2,
        yt = horner(abc, mid),
        wide = 2 * Math.sqrt((H - yt) / a);
      return near(a * (xs - x1) * (xs - x2), y, 1e-6) && wide > W === fits;
    },
  };
}

const s32wall = () => wall('abc');
const s34wall = () => wall('de');
const s32fit = () => fit('abc');
const s34fit = () => fit('de');

export default {
  slug: 'top-en-snijpunten-van-een-parabool',
  title: 'Top en snijpunten van een parabool',
  intro:
    'De top is het hoogste of laagste punt van een parabool. Hier leer je de top berekenen, en de punten waar de grafiek de x-as en de y-as snijdt. Daarmee bereken je ook hoe hoog een bal komt, hoe breed een tunnel is en of iets erdoor past.',
  description:
    'Bereken de top van een parabool met x_top = −b/(2a), de snijpunten met de assen, en de top van a(x − p)² + q en a(x − d)(x − e). Met uitleg.',
  videos: {
    menno: [
      ['De top berekenen', '1_misRbQ9CU'],
      ['De top in een verhaal', 'QtWMWwmNfAA'],
      ['Snijpunten met de assen', '8KZGXD5e6pk'],
      ['De top van a(x − p)² + q', '49WgyboXTDI'],
    ],
  },
  skills: [
    [83, 'Top van ax² + bx + c', s31top],
    [84, 'Top van a(x − p)² + q', s35top],
    [85, 'Snijpunten en top van a(x − d)(x − e)', s34top],
    [86, 'Snijpunten met de assen', s33axes],
    [87, 'Schets bij een formule', s35sketch],
    [88, 'Maximale hoogte', s32max],
    [89, 'Hoogte en breedte van een boog', s34tunnel],
    [96, 'Hoogte op een afstand bij ax² + bx + c', s32wall],
    [97, 'Past het erdoor bij ax² + bx + c?', s32fit],
    [98, 'Hoogte op een afstand bij a(x − d)(x − e)', s34wall],
    [99, 'Past het erdoor bij a(x − d)(x − e)?', s34fit],
  ],
  learn: [
    {
      t: 'De top van f(x) = ax^2 + bx + c',
      p: [
        T(
          'De top is het laagste punt van een dalparabool en het hoogste punt van een bergparabool. Voor elke parabool geldt x_top = {-b/2a}. Daarna is y_top = f(x_top).',
        ),
      ],
      how: [
        'Schrijf a en b op.',
        T('Bereken x_top = {-b/2a}.'),
        T('Vul x_top in de formule in. Zo krijg je y_top.'),
        'Schrijf de top op als punt.',
      ],
      ex: {
        q: T('Bereken de coördinaten van de top van f(x) = 2x^2 - 12x + 7.'),
        steps: [
          'a = 2 en b = -12',
          'x_top = {-b/2a} = {-(-12)/2*2} = 3',
          'y_top = f(3) = 2*3^2 - 12*3 + 7 = 18 - 36 + 7 = -11',
          'Dus de top is (3, -11).',
        ],
      },
      watch: T(
        'Komt er een kommagetal in de top, zet dan een puntkomma tussen de coördinaten, zoals (1,5; 6,75). Anders zie je niet waar het ene getal ophoudt.',
      ),
    },
    {
      t: 'De top van f(x) = a(x - p)^2 + q',
      p: [
        T(
          'Bij f(x) = a(x - p)^2 + q is de top het punt (p, q). Je kunt de top dus meteen aflezen.',
        ),
      ],
      ex: {
        q: T('Wat is de top van f(x) = -3(x + 4)^2 + 6?'),
        steps: ['x + 4 = x - -4, dus p = -4. En q = 6.', 'Dus de top is (-4, 6).'],
      },
      watch: T('Bij (x + 4) is p = -4, en bij (x - 4) is p = 4.'),
    },
    {
      t: 'Snijpunten met de assen',
      p: [
        T(
          'Op de x-as is y = 0. De x-coördinaten van de snijpunten met de x-as vind je dus door f(x) = 0 op te lossen.',
        ),
        T('Op de y-as is x = 0. Het snijpunt met de y-as is dus (0, f(0)).'),
        'Staat er "A links van B", dan heeft A de kleinste x-coördinaat.',
      ],
      ex: {
        q: T(
          'De grafiek van f(x) = x^2 + 3x - 10 snijdt de x-as in A en B, met A links van B, en de y-as in C. Bereken de coördinaten van A, B en C.',
        ),
        steps: [
          'f(x) = 0 geeft x^2 + 3x - 10 = 0',
          '(x - 2)(x + 5) = 0',
          'x - 2 = 0 ∨ x + 5 = 0',
          'x = 2 ∨ x = -5',
          'Dus A(-5, 0) en B(2, 0).',
          'f(0) = 0^2 + 3*0 - 10 = -10, dus C(0, -10).',
          H(
            graph({
              xr: [-6, 4],
              yr: [-13, 3],
              u: 18,
              ly: 5,
              curves: [{ abc: [1, 3, -10], name: 'f', at: 2.6 }],
              pts: [
                { x: -5, y: 0, label: 'A', off: [-16, -7] },
                { x: 2, y: 0, label: 'B', off: [-16, -7] },
                { x: 0, y: -10, label: 'C', off: [6, 16] },
              ],
              label: 'De grafiek van f met de snijpunten A, B en C',
            }),
          ),
        ],
      },
      watch:
        'Staat er een ander getal dan 1 voor x², deel dan eerst alle termen door dat getal. Het snijpunt met de y-as reken je wel uit met de functie zelf.',
    },
    {
      t: 'De functie f(x) = a(x - d)(x - e)',
      p: [
        T(
          'De grafiek van f(x) = a(x - d)(x - e) snijdt de x-as in (d, 0) en (e, 0). Vul maar in: bij x = d is de eerste factor 0, dus is f(d) = 0.',
        ),
        T(
          'De top ligt midden tussen de snijpunten: x_top = {d + e/2}. Verder is y_top = f(x_top).',
        ),
      ],
      ex: {
        q: T(
          'Gegeven is f(x) = 2(x + 3)(x - 1). Bereken de snijpunten A en B met de x-as, het snijpunt C met de y-as en de top T.',
        ),
        steps: [
          'd = -3 en e = 1, dus A(-3, 0) en B(1, 0).',
          'f(0) = 2(0 + 3)(0 - 1) = 2*3*-1 = -6, dus C(0, -6).',
          'x_top = {d + e/2} = {-3 + 1/2} = -1',
          'y_top = f(-1) = 2(-1 + 3)(-1 - 1) = 2*2*-2 = -8',
          'Dus T(-1, -8).',
        ],
      },
      watch: T('Bij (x + 3) hoort het snijpunt (-3, 0), niet (3, 0).'),
    },
    {
      t: 'Een parabool schetsen',
      p: [
        T(
          'Bij een schets teken je geen tabel. Je laat zien of het een dalparabool of een bergparabool is, en je zet de top met zijn coördinaten erbij.',
        ),
      ],
      ex: {
        q: T('Schets de grafiek van f(x) = -(x - 2)^2 + 3.'),
        steps: [
          'a = -1, dus a < 0. De grafiek is een bergparabool.',
          'De top is (2, 3).',
          H(
            graph({
              ...SK,
              u: 18,
              curves: [{ abc: fromVertex(-1, 2, 3), name: 'f', at: 4.3 }],
              pts: [{ x: 2, y: 3, label: 'T(2, 3)', off: [-22, -9] }],
              label: 'Schets van de grafiek van f',
            }),
          ),
        ],
      },
    },
    {
      t: 'De top in een verhaal',
      p: [
        T(
          'Is f(x) de hoogte van een bal, dan is y_top de maximale hoogte. x_top is de afstand waarop de bal het hoogst is.',
        ),
        T(
          'Staat een tunnel of boog op de x-as, dan is de breedte de afstand tussen de twee snijpunten met de x-as. De hoogte is y_top.',
        ),
      ],
      ex: {
        q: T(
          'Voor een tunnel geldt f(x) = -0,5(x - 1)(x - 7). De grond ligt op de x-as, en x en f(x) zijn in meter. Bereken de breedte en de hoogte van de tunnel.',
        ),
        steps: [
          'De grafiek snijdt de x-as bij x = 1 en x = 7.',
          'Dus de breedte is 7 - 1 = 6 meter.',
          'x_top = {1 + 7/2} = 4',
          'y_top = f(4) = -0,5(4 - 1)(4 - 7) = -0,5*3*-3 = 4,5',
          'Dus de tunnel is 4,5 meter hoog.',
        ],
      },
    },
    {
      t: 'Hoogte op een afstand van het midden',
      p: [
        T(
          'Het midden van een tunnel of boog ligt bij x_top. Wil je weten hoe hoog de tunnel 1,5 meter rechts van het midden is, bereken dan eerst x_top. Vul daarna x = x_top + 1,5 in de formule in.',
        ),
        'Past iets van een bepaalde breedte erdoor? Laat het precies door het midden gaan. De zijkant zit dan de halve breedte van het midden af. Vergelijk de hoogte van de tunnel daar met de hoogte van wat erdoor moet.',
      ],
      ex: {
        q: T(
          'Voor een tunnel geldt f(x) = -0,4x^2 + 3,2x - 2,4. De grond ligt op de x-as, en x en f(x) zijn in meter. Een busje van 2 meter breed en 3,5 meter hoog rijdt precies door het midden. Onderzoek of het busje erdoor past.',
        ),
        steps: [
          'a = -0,4 en b = 3,2',
          'x_top = {-b/2a} = {-3,2/2*-0,4} = 4',
          'Het busje rijdt door het midden. De helft van 2 meter is 1 meter.',
          'De zijkant van het busje is bij x = 4 + 1 = 5.',
          'f(5) = -0,4*5^2 + 3,2*5 - 2,4 = -10 + 16 - 2,4 = 3,6',
          'Daar is de tunnel 3,6 meter hoog. Dat is meer dan 3,5 meter, dus het busje past erdoor.',
        ],
      },
      watch:
        'Ga vanaf het midden opzij, en niet vanaf de y-as of vanaf de kant van de tunnel. En neem de halve breedte, want aan elke kant van het midden zit de helft.',
    },
  ],
};
