// Onderwerp: Haakjes wegwerken. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { nz, pick, coin, near, sg, Q, qv, qAdd, qMul, fr, dlin, until } from '../math.js';
import { F, quad, coef, vertexForm, factorForm } from './shared.js';
import { T } from '../typeset.js';

const NAMES = ['f', 'g', 'h'];
// Een melding na een valkuil is gewone tekst, dus met een echt minteken.
const minus = (s) => String(s).replace(/-/g, '−');
// Getallen voor a. Een half staat als breuk, zoals in het boek.
const A_FORM = [-4, -3, -2, -1, -1, 1, 1, 2, 3, 4, 5, Q(1, 2), Q(-1, 2)];

// Eén term met het teken ervoor: + 6x, − x of − 12.
const xTerm = (k) => `${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}x`;
const cTerm = (k) => `${k < 0 ? '-' : '+'} ${Math.abs(k)}`;
// (x − u)(x − w) term voor term, zoals in het boek: (x + 1)(x − 6) = x² − 6x + x − 6. Elke term van
// de eerste haakjes keer elke term van de tweede. Een factor x zonder haakjes geeft x² − wx.
const fourTerms = (u, w) =>
  u ? `x^2 ${xTerm(-w)} ${xTerm(-u)} ${cTerm(u * w)}` : `x^2 ${xTerm(-w)}`;

// De uitleg bij a, en bij een getal in de haakjes: x + 7 = x − −7, dus e = −7.
function aText(a) {
  const A = qv(a);
  if (A === 1) return 'Er staat geen getal vooraan, dus a = 1.';
  if (A === -1) return 'Vooraan staat alleen een min, dus a = -1.';
  return `Vooraan staat ${fr(Q(a))}, dus a = ${fr(Q(a))}.`;
}
const rootText = (t, name) =>
  !t
    ? `De factor x is hetzelfde als x - 0, dus ${name} = 0.`
    : t < 0
      ? `x + ${-t} = x - -${-t}, dus ${name} = ${t}.`
      : `In de haakjes staat x - ${t}, dus ${name} = ${t}.`;

// Twee verschillende getallen voor d en e. Met zero is een van de twee soms 0, zoals in 3x(x − 5).
// De factor x staat dan vooraan, dus d = 0.
function roots(zero) {
  const [r, s] = until(
    () => [zero && coin() && coin() ? 0 : nz(-9, 9), nz(-9, 9)],
    ([r, s]) => r !== s,
  );
  return r && coin() ? [s, r] : [r, s];
}

function s34ade() {
  const a = pick(A_FORM),
    [dd, ee] = roots(true),
    n = pick(NAMES),
    f = factorForm(a, dd, ee),
    traps = [];
  if (dd + ee !== 0)
    traps.push({
      id: 'teken-omgedraaid',
      f: (v) => near(v[1] + v[2], -(dd + ee)) && near(v[1] * v[2], dd * ee),
      m: minus(
        `Let op het teken. In a(x − d)(x − e) staat een min voor d en e. Bij (${dlin(1, -(ee || dd))}) hoort dus ${ee || dd}.`,
      ),
    });
  if (Math.abs(qv(a)) === 1)
    traps.push({
      id: 'a-is-een',
      // Ook a = 1 bij −(x + 8)(x + 4): de min vergeten.
      f: (v) => near(v[0], 0) || near(v[0], -qv(a)),
      m: 'Staat er geen getal vooraan, dan is a = 1. Staat er alleen een min, dan is a = −1.',
    });
  return {
    q: T(
      `Gegeven is de functie ${n}(x) = ${f}. Schrijf die als a(x - d)(x - e). Wat zijn a, d en e?`,
    ),
    fields: [
      F('a =', a),
      { ...F('d =', dd), grp: 'de', label: 'd' },
      { ...F('e =', ee), grp: 'de', label: 'e' },
    ],
    compact: true,
    hint: T(
      'a is het getal vooraan. In de haakjes staat een min voor d en e: bij (x + 3) hoort -3. Een losse factor x is x - 0.',
    ),
    steps: [
      aText(a),
      rootText(dd, 'd'),
      rootText(ee, 'e'),
      `a = ${fr(Q(a))}, d = ${dd} en e = ${ee}`,
    ],
    traps,
    // Bij x = d en x = e is de functie 0, en het getal voor x² is a.
    v: () => {
      const g = (x) => qv(a) * (x - dd) * (x - ee);
      return near(g(dd), 0) && near(g(ee), 0) && near((g(1) + g(-1) - 2 * g(0)) / 2, qv(a));
    },
  };
}

function s34expand() {
  const a = pick(A_FORM),
    [u, w] = roots(true),
    n = pick(NAMES),
    A = Q(a),
    abc = [A, qMul(A, -(u + w)), qMul(A, u * w)],
    f = factorForm(a, u, w),
    four = fourTerms(u, w),
    inner = quad([1, -(u + w), u * w]),
    steps = [`${n}(x) = ${f}`];
  if (qv(A) === 1) steps.push(`= ${four}`, ...(four !== inner ? [`= ${inner}`] : []));
  else
    steps.push(
      `= ${coef(a)}(${four})`,
      ...(four !== inner ? [`= ${coef(a)}(${inner})`] : []),
      `= ${quad(abc)}`,
    );
  const [, B, C] = abc.map(qv),
    traps = [];
  if (C)
    traps.push({
      id: 'teken-product',
      f: (v) => near(v[2], -C),
      m: 'Let op het teken van c. Min maal min is plus, en min maal plus is min.',
    });
  if (qv(A) !== 1)
    traps.push({
      id: 'haakjes-vergeten',
      f: (v) => near(v[1], -(u + w)) && near(v[2], u * w),
      m: minus(`Denk aan de haakjes: vermenigvuldig elke term tussen de haakjes met ${fr(A)}.`),
    });
  if (u && B !== 0)
    traps.push({
      id: 'middelste-termen-vergeten',
      f: (v) => near(v[1], 0),
      m: 'Vermenigvuldig elke term van de eerste haakjes met elke term van de tweede. Dan krijg je ook twee termen met x.',
    });
  steps.push(`Dus a = ${fr(A)}, b = ${fr(abc[1])} en c = ${fr(abc[2])}.`);
  return {
    q: T(`Schrijf ${n}(x) = ${f} in de vorm ax^2 + bx + c. Wat zijn a, b en c?`),
    fields: [F('a =', abc[0]), F('b =', abc[1]), F('c =', abc[2])],
    compact: true,
    hint: T(
      'Werk eerst de twee haakjes weg: elke term keer elke term. Vermenigvuldig daarna alle termen met het getal vooraan.',
    ),
    steps,
    traps,
    // De formule in de vraag en ax² + bx + c geven bij elke x hetzelfde.
    v: () =>
      [-3, -1, 0, 2, 5].every((x) =>
        near(qv(a) * (x - u) * (x - w), qv(abc[0]) * x * x + B * x + C),
      ),
  };
}

function s35expand() {
  const a = pick(A_FORM),
    p = nz(-6, 6),
    q = coin() || coin() ? nz(-9, 9) : 0,
    n = pick(NAMES),
    A = Q(a),
    abc = [A, qMul(A, -2 * p), qAdd(qMul(A, p * p), q)],
    f = vertexForm(a, p, q),
    L = dlin(1, -p),
    qp = q ? sg(q) : '',
    four = fourTerms(p, p),
    inner = quad([1, -2 * p, p * p]),
    steps = [`${n}(x) = ${f}`, `= ${coef(a)}(${L})(${L})${qp}`];
  if (qv(A) === 1) steps.push(`= ${four}${qp}`, `= ${quad(abc)}`);
  else {
    steps.push(`= ${coef(a)}(${four})${qp}`, `= ${coef(a)}(${inner})${qp}`);
    if (q) steps.push(`= ${quad([A, abc[1], qMul(A, p * p)])}${qp}`);
    steps.push(`= ${quad(abc)}`);
  }
  steps.push(`Dus a = ${fr(A)}, b = ${fr(abc[1])} en c = ${fr(abc[2])}.`);
  const traps = [
    {
      id: 'kwadraat-per-term',
      f: (v) => near(v[1], 0) && near(v[2], qv(A) * p * p + q),
      m: minus(
        `(${L})² is niet x² + ${p * p}. Schrijf het kwadraat als (${L})(${L}) en werk de haakjes weg.`,
      ),
    },
  ];
  if (qv(A) !== 1)
    traps.push({
      id: 'haakjes-vergeten',
      f: (v) => near(v[1], -2 * p) && near(v[2], p * p + q),
      m: minus(`Denk aan de haakjes: vermenigvuldig elke term tussen de haakjes met ${fr(A)}.`),
    });
  return {
    q: T(`Schrijf ${n}(x) = ${f} in de vorm ax^2 + bx + c. Wat zijn a, b en c?`),
    fields: [F('a =', abc[0]), F('b =', abc[1]), F('c =', abc[2])],
    compact: true,
    hint: T(
      `Schrijf het kwadraat als twee gelijke haakjes: (${L})^2 = (${L})(${L}). Werk die weg, en vermenigvuldig daarna met het getal vooraan.`,
    ),
    steps,
    traps,
    v: () =>
      [-3, -1, 0, 2, 5].every((x) =>
        near(qv(a) * (x - p) ** 2 + q, qv(abc[0]) * x * x + qv(abc[1]) * x + qv(abc[2])),
      ),
  };
}

export default {
  slug: 'haakjes-wegwerken',
  title: 'Haakjes wegwerken',
  intro:
    'Haakjes wegwerken is het omgekeerde van ontbinden in factoren. Hier leer je een formule als a(x - d)(x - e) of a(x - p)^2 + q schrijven als ax^2 + bx + c, en de getallen a, d en e aflezen.',
  description:
    'Haakjes wegwerken oefenen: a(x − d)(x − e) en a(x − p)² + q schrijven als ax² + bx + c. Havo 3, gratis met uitleg, hints en uitwerkingen.',
  videos: {
    menno: [['De functie f(x) = a(x − d)(x − e)', 'N38oiZcNq3Q']],
  },
  skills: [
    [93, 'a, d en e aflezen', s34ade],
    [94, 'a(x − d)(x − e) uitwerken', s34expand],
    [95, 'a(x − p)² + q uitwerken', s35expand],
  ],
  learn: [
    {
      t: 'De functie f(x) = a(x - d)(x - e)',
      p: [
        T(
          'Een functie als f(x) = a(x - d)(x - e) met a ≠ 0 is een kwadratische functie. a is het getal vooraan, en in de haakjes staat een min voor d en e.',
        ),
      ],
      ex: {
        q: T('Wat zijn a, d en e bij f(x) = 3(x - 2)(x + 5)?'),
        steps: [
          'a = 3',
          'In de eerste haakjes staat x - 2, dus d = 2.',
          'x + 5 = x - -5, dus e = -5.',
        ],
      },
      watch: T(
        'Bij (x + 5) hoort e = -5. Een losse factor x is x - 0: bij 4x(x - 1) is a = 4, d = 0 en e = 1.',
      ),
    },
    {
      t: 'a(x - d)(x - e) uitwerken',
      how: [
        'Werk eerst de twee haakjes weg: vermenigvuldig elke term van de eerste haakjes met elke term van de tweede.',
        'Neem de termen met x samen.',
        'Vermenigvuldig elke term met het getal vooraan.',
      ],
      ex: {
        q: T('Schrijf f(x) = -2(x + 3)(x - 4) in de vorm ax^2 + bx + c.'),
        steps: [
          'f(x) = -2(x + 3)(x - 4)',
          '= -2(x^2 - 4x + 3x - 12)',
          '= -2(x^2 - x - 12)',
          '= -2x^2 + 2x + 24',
          'Dus a = -2, b = 2 en c = 24.',
        ],
      },
      watch: T(
        'Denk aan de haakjes. Het getal vooraan vermenigvuldig je met álle termen, dus ook met -12.',
      ),
    },
    {
      t: 'a(x - p)^2 + q uitwerken',
      p: [
        T(
          'Bij a(x - p)^2 + q is a het getal vooraan, staat p met een min in de haakjes en staat q achter het kwadraat. Schrijf het kwadraat als twee gelijke haakjes: (x - 2)^2 = (x - 2)(x - 2). Werk die weg en vermenigvuldig met a. Tel q er pas daarna bij op.',
        ),
      ],
      ex: {
        q: T('Schrijf f(x) = 3(x - 2)^2 - 5 in de vorm ax^2 + bx + c.'),
        steps: [
          'f(x) = 3(x - 2)^2 - 5',
          '= 3(x - 2)(x - 2) - 5',
          '= 3(x^2 - 2x - 2x + 4) - 5',
          '= 3(x^2 - 4x + 4) - 5',
          '= 3x^2 - 12x + 12 - 5',
          '= 3x^2 - 12x + 7',
          'Dus a = 3, b = -12 en c = 7.',
        ],
      },
      watch: T('(x - 2)^2 is niet x^2 + 4 en ook niet x^2 - 4. Er komt ook een term met x bij.'),
    },
  ],
};
