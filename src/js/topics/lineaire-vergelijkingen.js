// Onderwerp: Lineaire vergelijkingen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, nz, pick, coin, until, lcm, Q, qv, near, fr, lin, sg } from '../math.js';
import { F } from './shared.js';
import { T } from '../typeset.js';

// De laatste stappen: 4x = 24, x = 6. Staat er al x = ..., dan is delen niet nodig.
const solved = (co, rhs, x, v = 'x') => [
  ...(co === 1 ? [] : [`${lin(co, 0, v)} = ${rhs}`]),
  `${v} = ${x}`,
];
function s13basic() {
  const x = nz(-9, 9),
    a = nz(-9, 9);
  const c = until(
    () => nz(-9, 9),
    (c) => c !== a,
  );
  const b = nz(-12, 12),
    dd = (a - c) * x + b;
  return {
    q: T(`Los op: ${lin(a, b)} = ${lin(c, dd)}`),
    fields: [F('x =', x)],
    hint: 'Breng de termen met x naar één kant en de getallen naar de andere kant. Doe links en rechts hetzelfde.',
    steps: [`${lin(a, b)} = ${lin(c, dd)}`, ...solved(a - c, dd - b, x)],
    traps: [
      {
        id: 'minteken',
        f: (v) => near(v[0], -x),
        m: 'Je bent er bijna. Controleer het minteken in de laatste stap.',
      },
    ],
    v: () => a * x + b === c * x + dd,
  };
}
function s13brackets() {
  return until(
    () => {
      const x = nz(-9, 9),
        form = ri(1, 4),
        p = pick([2, 3, 4, 5, 6, 7]),
        q = nz(-8, 8),
        r = pick([-3, -2, 2, 3, 4, 5, 6, 7, 8]),
        t = nz(-9, 9);
      const lq = (k, v) => `${k}(x${sg(v)})`;
      if (form === 1) {
        if (p === r) return null;
        const ss = p * (x + q) - r * x;
        return {
          q: T(`Los op: ${lq(p, q)} = ${lin(r, ss)}`),
          fields: [F('x =', x)],
          hint: 'Werk eerst de haakjes weg. Vermenigvuldig allebei de termen tussen de haakjes.',
          steps: [
            `${lq(p, q)} = ${lin(r, ss)}`,
            `${lin(p, p * q)} = ${lin(r, ss)}`,
            ...solved(p - r, ss - p * q, x),
          ],
          traps: [
            {
              id: 'haakjes-half-uitgewerkt',
              f: (v) => near(v[0], (ss - q) / (p - r)) && !near(v[0], x),
              m: 'Vermenigvuldig ook het tweede getal tussen de haakjes met het getal ervoor.',
            },
          ],
          v: () => p * (x + q) === r * x + ss,
        };
      }
      if (form === 2) {
        if (p === r || r < 0) return null;
        const val = p * (x + q);
        if (val % r) return null;
        const u = val / r - x;
        if (u === 0) return null;
        return {
          q: T(`Los op: ${lq(p, q)} = ${lq(r, u)}`),
          fields: [F('x =', x)],
          hint: 'Werk links en rechts de haakjes weg.',
          steps: [`${lin(p, p * q)} = ${lin(r, r * u)}`, ...solved(p - r, r * u - p * q, x)],
          v: () => p * (x + q) === r * (x + u),
        };
      }
      if (form === 3) {
        if (p === r || r < 0) return null;
        const val = t + p * (x + q);
        if (val % r) return null;
        const u = val / r - x;
        if (u === 0) return null;
        return {
          q: T(`Los op: ${t} + ${lq(p, q)} = ${lq(r, u)}`),
          fields: [F('x =', x)],
          hint: 'Werk de haakjes weg en tel daarna de losse getallen links bij elkaar op.',
          steps: [
            `${t} + ${lin(p, p * q)} = ${lin(r, r * u)}`,
            `${lin(p, t + p * q)} = ${lin(r, r * u)}`,
            ...solved(p - r, r * u - t - p * q, x),
          ],
          v: () => t + p * (x + q) === r * (x + u),
        };
      }
      if (form === 4) {
        if (-p === r) return null;
        const ss = t - p * (x + q) - r * x;
        const wrong = (ss - t + p * q) / (-p - r);
        return {
          q: T(`Los op: ${t} - ${lq(p, q)} = ${lin(r, ss)}`),
          fields: [F('x =', x)],
          hint: T(`Let op het minteken voor de haakjes: je vermenigvuldigt met -${p}.`),
          steps: [
            `${t} - ${p}x${q > 0 ? ' - ' : ' + '}${Math.abs(p * q)} = ${lin(r, ss)}`,
            `${lin(-p, t - p * q)} = ${lin(r, ss)}`,
            ...solved(-p - r, ss - t + p * q, x),
          ],
          traps: [
            {
              id: 'min-voor-haakjes',
              f: (v) => near(v[0], wrong) && !near(wrong, x),
              m: `Let op: door de min voor de haakjes verandert ook het teken van het tweede getal.`,
            },
          ],
          v: () => t - p * (x + q) === r * x + ss,
        };
      }
    },
    (r) => r !== null,
  );
}
function s13expand() {
  const t = nz(-6, 6),
    p = pick([-7, -6, -5, -4, -3, -2, 2, 3, 4, 5]),
    q = nz(-8, 8),
    A = t + p,
    B = p * q;
  if (A === 0) return s13expand();
  return {
    q: T(
      `Werk de haakjes weg en herleid: ${lin(t, 0)} ${p < 0 ? '-' : '+'} ${Math.abs(p)}(x${sg(q)})`,
    ),
    fields: [
      { pre: '', a: A, post: 'x' },
      { pre: '+', a: B, post: '' },
    ],
    hint: T(
      `Vermenigvuldig x en ${q} met ${p}. Tel daarna de termen met x bij elkaar op. Is het tweede getal negatief, vul dan bijvoorbeeld -5 in.`,
    ),
    steps: [
      `${lin(t, 0)} ${p < 0 ? '-' : '+'} ${Math.abs(p)}(x${sg(q)}) = ${lin(t, 0)} ${p < 0 ? '-' : '+'} ${Math.abs(p)}x ${B < 0 ? '-' : '+'} ${Math.abs(B)}`,
      `= ${lin(A, B)}`,
    ],
    traps: [
      {
        id: 'teken-bij-vermenigvuldigen',
        f: (v) => near(v[1], -B),
        m: 'Kijk naar het teken: min maal min is plus, en min maal plus is min.',
      },
    ],
    v: () => t * 3 + p * (3 + q) === A * 3 + B,
  };
}
function s13frac() {
  const pairs = [
    [2, 3],
    [3, 4],
    [2, 5],
    [4, 6],
    [5, 2],
    [3, 8],
    [2, 6],
    [4, 3],
    [6, 8],
  ];
  const { d1, d2, L, a, c, b, e, A, C, K1, K2, x } = until(
    () => {
      const [d1, d2] = pick(pairs),
        L = lcm(d1, d2),
        n1 = ri(1, d1 * 2 - 1),
        n2 = ri(1, d2 * 2 - 1),
        a = Q(n1, d1),
        c = Q(n2, d2);
      if (a.d === 1 || c.d === 1 || near(qv(a), qv(c))) return null;
      const b = coin() ? Q(nz(-9, 9)) : Q(nz(-L * 2, L * 2), L),
        e = nz(-9, 9),
        A = qv(a) * L,
        C = qv(c) * L,
        K1 = qv(b) * L,
        K2 = e * L;
      if (!Number.isInteger(K1) || A === C) return null;
      const x = Q(K2 - K1, A - C);
      if (x.d > 6 || Math.abs(qv(x)) > 60) return null;
      return { d1, d2, L, a, c, b, e, A, C, K1, K2, x };
    },
    (r) => r !== null,
  );
  return {
    q: T(`Los op: ${lin(a, b)} = ${lin(c, e)}`),
    fields: [F('x =', x)],
    hint: T(
      `Vermenigvuldig alle termen links en rechts met ${L}, het kleinste veelvoud van de noemers.`,
    ),
    steps: [
      `Het kleinste veelvoud van de noemers is ${L}.`,
      `${L}*${fr(a)}x ${qv(b) < 0 ? '-' : '+'} ${L}*${fr(Q(Math.abs(b.n), b.d))} = ${L}*${fr(c)}x ${e < 0 ? '-' : '+'} ${L}*${Math.abs(e)}`,
      `${lin(A, K1)} = ${lin(C, K2)}`,
      ...solved(A - C, K2 - K1, fr(x)),
    ],
    traps: [
      {
        id: 'niet-alle-termen',
        f: (v) => near(v[0], (e - qv(b)) / (A - C)) && !near((e - qv(b)) / (A - C), qv(x)),
        m: 'Vermenigvuldig álle termen, ook de getallen zonder breuk.',
      },
    ],
    v: () => near(qv(a) * qv(x) + qv(b), qv(c) * qv(x) + e),
  };
}
function s13kgv() {
  const [d1, d2] = pick([
      [2, 3],
      [3, 4],
      [4, 6],
      [2, 5],
      [6, 8],
      [4, 10],
      [3, 5],
      [6, 9],
      [8, 12],
      [5, 10],
    ]),
    L = lcm(d1, d2);
  return {
    q:
      T(
        `Met welk getal vermenigvuldig je om de breuken weg te werken? Neem het kleinste veelvoud van de noemers.`,
      ) + `<div>${T(`{1/${d1}}x + 1 = {1/${d2}}x + 3`)}</div>`,
    fields: [F('', L)],
    hint: T(`Schrijf de tafels van ${d1} en ${d2} op. Welk getal komt het eerst in allebei voor?`),
    steps: [
      `Tafel van ${d1} en tafel van ${d2}: het eerste getal dat in allebei voorkomt is ${L}.`,
    ],
    traps: [
      {
        id: 'niet-kleinste-veelvoud',
        f: (v) => near(v[0], d1 * d2) && d1 * d2 !== L,
        m: 'Daarmee lukt het ook, maar het is niet het kleinste getal. Zo krijg je grotere getallen dan nodig.',
      },
    ],
    // Een veelvoud van allebei, en geen kleiner getal is dat ook.
    v: () => {
      const both = (n) => n % d1 === 0 && n % d2 === 0;
      return both(L) && Array.from({ length: L - 1 }, (_, i) => i + 1).every((n) => !both(n));
    },
  };
}
function s13param() {
  const { x, a, b, c, p } = until(
    () => {
      const x = nz(-5, 5),
        a = pick([2, 3, 4, 5]),
        b = nz(-6, 6),
        c = nz(-5, 5);
      if (a === b) return null;
      const num = (c - a) * x,
        den = a - b;
      if (num % den || num === 0) return null;
      return { x, a, b, c, p: num / den };
    },
    (r) => r !== null,
  );
  return {
    q: T(
      `De vergelijking ${a}(x + p) = ${lin(b, 0, 'p')} ${c < 0 ? '-' : '+'} ${c === 1 || c === -1 ? '' : Math.abs(c)}x heeft de oplossing x = ${x}. Bereken p.`,
    ),
    fields: [F('p =', p)],
    hint: T(`Vul x = ${x} in. Dan blijft een vergelijking met p over.`),
    steps: [
      `x = ${x} invullen geeft ${a}(${x} + p) = ${lin(b, c * x, 'p')}`,
      `${lin(a, a * x, 'p')} = ${lin(b, c * x, 'p')}`,
      ...solved(a - b, c * x - a * x, p, 'p'),
    ],
    v: () => a * (x + p) === b * p + c * x,
  };
}

export default {
  slug: 'lineaire-vergelijkingen',
  title: 'Lineaire vergelijkingen',
  intro:
    'Bij een vergelijking zoek je de x waarvoor links en rechts hetzelfde uitkomt. Hier leer je dat met een vast stappenplan, ook als er haakjes of breuken in staan.',
  description:
    'Lineaire vergelijkingen oplossen oefenen, ook met haakjes en breuken, met een vast stappenplan. Havo 3, gratis met uitleg, hints en uitwerkingen.',
  videos: {
    menno: [
      ['Lineaire vergelijkingen oplossen', '-yl6BWQ3ZQM'],
      ['Lineaire vergelijkingen met haakjes', '1hKmkRoXBAo'],
      ['Lineaire vergelijkingen met breuken', 'LRgqvIRdjw0'],
    ],
    bob: [
      ['Lineaire vergelijkingen', 'SZHO7hYFrZA'],
      ['Lineaire vergelijkingen oplossen', '8xrYbLuUy1U'],
      ['Lineaire vergelijkingen met haakjes', '2oUrlUVE0fs'],
      ['Lineaire vergelijkingen met breuken', 'w1Dvc4nHdRo'],
    ],
  },
  skills: [
    [17, 'Termen links en rechts', s13basic],
    [18, 'Haakjes wegwerken', s13expand],
    [19, 'Vergelijking met haakjes', s13brackets],
    [20, 'Kleinste veelvoud', s13kgv],
    [21, 'Vergelijking met breuken', s13frac],
    [22, 'Uitdaging: p berekenen', s13param],
  ],
  learn: [
    {
      t: 'Het stappenplan',
      how: [
        'Staan er breuken? Werk die eerst weg: vermenigvuldig alle termen met het kleinste veelvoud van de noemers.',
        'Werk de haakjes weg.',
        'Reken beide kanten zo ver mogelijk uit.',
        'Zorg dat links alleen een term met x staat en rechts alleen een getal.',
        'Deel beide kanten door het getal voor x.',
      ],
      ex: { q: T('6x - 4 = 2x + 8'), steps: ['4x = 12', 'x = 3'] },
      watch: T(
        'Je hoeft niet elke tussenstap op te schrijven. Links en rechts 2x aftrekken én links en rechts 4 optellen doe je in één keer. Zo ga je direct naar 4x = 12.',
      ),
    },
    {
      t: 'Haakjes',
      p: [T('Vermenigvuldig het getal voor de haakjes met allebei de termen: 4(x - 3) = 4x - 12.')],
      watch: T('Min voor de haakjes: 3x - 5(x - 2) = 3x - 5x + 10. Min maal min is plus.'),
      ex: { q: T('4(x - 2) = x + 7'), steps: ['4x - 8 = x + 7', '3x = 15', 'x = 5'] },
    },
    {
      t: 'Breuken',
      p: [
        'Zoek het kleinste getal waar alle noemers in passen. Vermenigvuldig daarmee elke term, ook de getallen zonder breuk.',
      ],
      ex: {
        q: T('{1/4}x + 1 = {3/8}x + 3'),
        steps: [
          'Het kleinste veelvoud van 4 en 8 is 8.',
          '8*{1/4}x + 8*1 = 8*{3/8}x + 8*3',
          '2x + 8 = 3x + 24',
          '-x = 16',
          'x = -16',
        ],
      },
    },
  ],
};
