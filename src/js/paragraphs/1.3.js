// Paragraaf 1.3: Lineaire vergelijkingen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { ri, nz, pick, coin, lcm, Q, qv, near, fr, lin, sg } from '../math.js';
import { F } from './shared.js';
import { T } from '../typeset.js';

function s13basic() {
  const x = nz(-9, 9),
    a = nz(-9, 9);
  let c;
  do {
    c = nz(-9, 9);
  } while (c === a);
  const b = nz(-12, 12),
    dd = (a - c) * x + b;
  return {
    q: T(`Los op: ${lin(a, b)} = ${lin(c, dd)}`),
    fields: [F('x =', x)],
    hint: 'Breng de termen met x naar één kant en de getallen naar de andere kant. Doe links en rechts hetzelfde.',
    steps: [
      `${lin(a, b)} = ${lin(c, dd)}`,
      `${lin(a - c, b)} = ${dd}`,
      `${lin(a - c, 0)} = ${dd - b}`,
      `x = ${x}`,
    ],
    traps: [
      {
        f: (v) => near(v[0], -x),
        m: 'Je bent er bijna. Controleer het minteken in de laatste stap.',
      },
    ],
    v: () => a * x + b === c * x + dd,
  };
}
function s13brackets() {
  for (let i = 0; i < 80; i++) {
    const x = nz(-9, 9),
      form = ri(1, 4),
      p = pick([2, 3, 4, 5, 6, 7]),
      q = nz(-8, 8),
      r = pick([-3, -2, 2, 3, 4, 5, 6, 7, 8]),
      t = nz(-9, 9);
    const lq = (k, v) => `${k}(x${sg(v)})`;
    if (form === 1) {
      if (p === r) continue;
      const ss = p * (x + q) - r * x;
      return {
        q: T(`Los op: ${lq(p, q)} = ${lin(r, ss)}`),
        fields: [F('x =', x)],
        hint: 'Werk eerst de haakjes weg. Vermenigvuldig allebei de termen tussen de haakjes.',
        steps: [
          `${lq(p, q)} = ${lin(r, ss)}`,
          `${lin(p, p * q)} = ${lin(r, ss)}`,
          `${lin(p - r, 0)} = ${ss - p * q}`,
          `x = ${x}`,
        ],
        traps: [
          {
            f: (v) => near(v[0], (ss - q) / (p - r)) && !near(v[0], x),
            m: 'Vermenigvuldig ook het tweede getal tussen de haakjes met het getal ervoor.',
          },
        ],
        v: () => p * (x + q) === r * x + ss,
      };
    }
    if (form === 2) {
      if (p === r || r < 0) continue;
      const val = p * (x + q);
      if (val % r) continue;
      const u = val / r - x;
      if (u === 0) continue;
      return {
        q: T(`Los op: ${lq(p, q)} = ${lq(r, u)}`),
        fields: [F('x =', x)],
        hint: 'Werk links en rechts de haakjes weg.',
        steps: [
          `${lin(p, p * q)} = ${lin(r, r * u)}`,
          `${lin(p - r, 0)} = ${r * u - p * q}`,
          `x = ${x}`,
        ],
        v: () => p * (x + q) === r * (x + u),
      };
    }
    if (form === 3) {
      if (p === r || r < 0) continue;
      const val = t + p * (x + q);
      if (val % r) continue;
      const u = val / r - x;
      if (u === 0) continue;
      return {
        q: T(`Los op: ${t} + ${lq(p, q)} = ${lq(r, u)}`),
        fields: [F('x =', x)],
        hint: 'Werk de haakjes weg en tel daarna de losse getallen links bij elkaar op.',
        steps: [
          `${t} + ${lin(p, p * q)} = ${lin(r, r * u)}`,
          `${lin(p, t + p * q)} = ${lin(r, r * u)}`,
          `${lin(p - r, 0)} = ${r * u - t - p * q}`,
          `x = ${x}`,
        ],
        v: () => t + p * (x + q) === r * (x + u),
      };
    }
    if (form === 4) {
      if (-p === r) continue;
      const ss = t - p * (x + q) - r * x;
      const wrong = (ss - t + p * q) / (-p - r);
      return {
        q: T(`Los op: ${t} - ${lq(p, q)} = ${lin(r, ss)}`),
        fields: [F('x =', x)],
        hint: T(`Let op het minteken voor de haakjes: je vermenigvuldigt met -${p}.`),
        steps: [
          `${t} - ${p}x${q > 0 ? ' - ' : ' + '}${Math.abs(p * q)} = ${lin(r, ss)}`,
          `${lin(-p, t - p * q)} = ${lin(r, ss)}`,
          `${lin(-p - r, 0)} = ${ss - t + p * q}`,
          `x = ${x}`,
        ],
        traps: [
          {
            f: (v) => near(v[0], wrong) && !near(wrong, x),
            m: `Let op: door de min voor de haakjes verandert ook het teken van het tweede getal.`,
          },
        ],
        v: () => t - p * (x + q) === r * x + ss,
      };
    }
  }
  return s13basic();
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
  for (let i = 0; i < 200; i++) {
    const [d1, d2] = pick(pairs),
      L = lcm(d1, d2),
      n1 = ri(1, d1 * 2 - 1),
      n2 = ri(1, d2 * 2 - 1),
      a = Q(n1, d1),
      c = Q(n2, d2);
    if (a.d === 1 || c.d === 1 || near(qv(a), qv(c))) continue;
    const b = coin() ? Q(nz(-9, 9)) : Q(nz(-L * 2, L * 2), L),
      e = nz(-9, 9),
      A = qv(a) * L,
      C = qv(c) * L,
      K1 = qv(b) * L,
      K2 = e * L;
    if (!Number.isInteger(K1) || A === C) continue;
    const x = Q(K2 - K1, A - C);
    if (x.d > 6 || Math.abs(qv(x)) > 60) continue;
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
        `${lin(A - C, K1)} = ${K2}`,
        `${lin(A - C, 0)} = ${K2 - K1}`,
        `x = ${fr(x)}`,
      ],
      traps: [
        {
          f: (v) => near(v[0], (e - qv(b)) / (A - C)),
          m: 'Vermenigvuldig álle termen, ook de getallen zonder breuk.',
        },
      ],
      v: () => near(qv(a) * qv(x) + qv(b), qv(c) * qv(x) + e),
    };
  }
  return s13basic();
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
        f: (v) => near(v[0], d1 * d2) && d1 * d2 !== L,
        m: 'Daarmee lukt het ook, maar het is niet het kleinste getal. Zo krijg je grotere getallen dan nodig.',
      },
    ],
    v: () => L % d1 === 0 && L % d2 === 0,
  };
}
function s13compare() {
  const a2 = pick([14, 16, 22, 25, 35]),
    da = pick([4, 5, 6, 10, 12]),
    a1 = a2 + da,
    t = pick([5, 10, 15, 20, 25, 30]),
    b1 = pick([300, 600, 1000, 1500, 2400]),
    b2 = b1 + da * t;
  return {
    q: T(
      `Voor het aantal volgers van twee kanalen geldt V_A = ${lin(a1, b1, 't')} en V_B = ${lin(a2, b2, 't')}, met t in weken. Na hoeveel weken hebben de kanalen evenveel volgers?`,
    ),
    fields: [F('t =', t)],
    hint: T(`Evenveel betekent V_A = V_B. Zet de twee formules aan elkaar gelijk.`),
    steps: [
      `V_A = V_B geeft ${lin(a1, b1, 't')} = ${lin(a2, b2, 't')}`,
      `${da}t = ${b2 - b1}`,
      `t = ${t}`,
    ],
    v: () => a1 * t + b1 === a2 * t + b2,
  };
}
function s13param() {
  for (let i = 0; i < 200; i++) {
    const x = nz(-5, 5),
      a = pick([2, 3, 4, 5]),
      b = nz(-6, 6),
      c = nz(-5, 5);
    if (a === b) continue;
    const num = (c - a) * x,
      den = a - b;
    if (num % den || num === 0) continue;
    const p = num / den;
    return {
      q: T(
        `De vergelijking ${a}(x + p) = ${lin(b, 0, 'p')} ${c < 0 ? '-' : '+'} ${c === 1 || c === -1 ? '' : Math.abs(c)}x heeft de oplossing x = ${x}. Bereken p.`,
      ),
      fields: [F('p =', p)],
      hint: T(`Vul x = ${x} in. Dan blijft een vergelijking met p over.`),
      steps: [
        `x = ${x} invullen geeft ${a}(${x} + p) = ${lin(b, c * x, 'p')}`,
        `${lin(a, a * x, 'p')} = ${lin(b, c * x, 'p')}`,
        `${lin(a - b, 0, 'p')} = ${c * x - a * x}`,
        `p = ${p}`,
      ],
      v: () => a * (x + p) === b * p + c * x,
    };
  }
  return s13basic();
}

export default {
  id: '1.3',
  ch: 1,
  num: '1.3',
  title: 'Lineaire vergelijkingen',
  core: true,
  videos: [
    ['1.3 A Lineaire vergelijkingen', 'SZHO7hYFrZA'],
    ['1.3 B Lineaire vergelijkingen oplossen', '8xrYbLuUy1U'],
    ['1.3 C Lineaire vergelijkingen met haakjes', '2oUrlUVE0fs'],
    ['1.3 D Lineaire vergelijkingen met breuken', 'w1Dvc4nHdRo'],
    ['1.3 E Lineaire formules vergelijken', '2KAxh0NF8zU'],
  ],
  skills: [
    ['Termen links en rechts', s13basic],
    ['Haakjes wegwerken', s13expand],
    ['Vergelijking met haakjes', s13brackets],
    ['Kleinste veelvoud', s13kgv],
    ['Vergelijking met breuken', s13frac],
    ['Formules vergelijken', s13compare],
    ['Uitdaging: p berekenen', s13param],
  ],
  learn: [
    {
      t: 'Het stappenplan',
      how: [
        'Haakjes weg.',
        'Breuken weg: vermenigvuldig alle termen met het kleinste veelvoud van de noemers.',
        'Termen met x naar links, losse getallen naar rechts.',
        'Deel door het getal voor x.',
      ],
      ex: { q: T('6x - 4 = 2x + 8'), steps: ['4x - 4 = 8', '4x = 12', 'x = 3'] },
    },
    {
      t: 'Haakjes',
      p: [T('Vermenigvuldig het getal voor de haakjes met allebei de termen: 4(x - 3) = 4x - 12.')],
      watch: T('Min voor de haakjes: 3x - 5(x - 2) = 3x - 5x + 10. Min maal min is plus.'),
      ex: { q: T('4(x - 2) = x + 7'), steps: ['4x - 8 = x + 7', '3x - 8 = 7', '3x = 15', 'x = 5'] },
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
