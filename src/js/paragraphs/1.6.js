// Paragraaf 1.6: Vergelijkingen met twee variabelen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { nz, pick, coin, Q, qv, near, fr, lin } from '../math.js';
import { F } from './shared.js';
import { T } from '../typeset.js';

const lin2 = (A, B) =>
  `${lin(A, 0, 'x')} ${B < 0 ? '-' : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}y`;
function s16pair() {
  const A = pick([1, 2, 3, 4, 5]),
    B = pick([-3, -2, -1, 1, 2, 3, 4]),
    x = nz(-6, 6),
    y = nz(-6, 6),
    C = A * x + B * y;
  if (coin())
    return {
      q: T(`Gegeven is de vergelijking ${lin2(A, B)} = ${C}. Bereken y als x = ${x}.`),
      fields: [F('y =', y)],
      hint: T(`Vul x = ${x} in. Dan houd je een vergelijking met alleen y over.`),
      steps: [
        `${A}*${x} ${B < 0 ? '-' : '+'} ${Math.abs(B)}y = ${C}`,
        `${A * x} ${B < 0 ? '-' : '+'} ${Math.abs(B)}y = ${C}`,
        `${B}y = ${C - A * x}`,
        `y = ${y}`,
      ],
      v: () => A * x + B * y === C,
    };
  return {
    q: T(`Gegeven is de vergelijking ${lin2(A, B)} = ${C}. Bereken x als y = ${y}.`),
    fields: [F('x =', x)],
    hint: T(`Vul y = ${y} in. Dan houd je een vergelijking met alleen x over.`),
    steps: [
      `${lin(A, 0)} ${B < 0 ? '-' : '+'} ${Math.abs(B)}*${y} = ${C}`,
      `${lin(A, B * y)} = ${C}`,
      `${lin(A, 0)} = ${C - B * y}`,
      `x = ${x}`,
    ],
    v: () => A * x + B * y === C,
  };
}
function s16iso() {
  const A = pick([1, 2, 3, 4, 5, 6]),
    B = pick([-4, -3, -2, 2, 3, 4, 5]),
    C = B * nz(-5, 6) + (coin() ? 0 : nz(-3, 3));
  const a = Q(-A, B),
    b = Q(C, B);
  return {
    q: T(`Schrijf ${lin2(A, B)} = ${C} in de vorm y = ax + b.`),
    fields: [F('a =', a), F('b =', b)],
    hint: T(
      `Zet eerst de term met y alleen aan de linkerkant. Deel daarna links en rechts door ${B}.`,
    ),
    steps: [`${lin2(A, B)} = ${C}`, `${B}y = ${lin(-A, C)}`, `y = ${lin(a, b)}`],
    traps: [
      {
        f: (v) => near(v[0], A / B),
        m: 'Let op het teken: als je een term naar de andere kant brengt, verandert het teken.',
      },
    ],
    v: () => near(A * 1 + B * (qv(a) + qv(b)), C),
  };
}
function s16ax() {
  const A = pick([2, 3, 4, 5, 6]),
    B = pick([2, 3, 4, 5, -2, -3, -4]),
    C = A * Math.abs(B) * pick([1, 2, -1, 3]);
  const xi = Q(C, A),
    yi = Q(C, B);
  return {
    q: T(`Bereken de snijpunten van de lijn ${lin2(A, B)} = ${C} met de assen.`),
    fields: [
      { pre: 'x-as: (', a: qv(xi), post: ', 0)' },
      { pre: 'y-as: (0,', a: qv(yi), post: ')' },
    ],
    hint: 'Op de x-as is y = 0. Op de y-as is x = 0.',
    steps: [
      `y = 0 geeft ${A}x = ${C}, dus x = ${fr(xi)}. Dat geeft (${fr(xi)}, 0).`,
      `x = 0 geeft ${B}y = ${C}, dus y = ${fr(yi)}. Dat geeft (0, ${fr(yi)}).`,
    ],
    v: () => near(A * qv(xi), C) && near(B * qv(yi), C),
  };
}

export default {
  id: '1.6',
  ch: 1,
  num: '1.6',
  title: 'Vergelijkingen met twee variabelen',
  core: false,
  videos: {
    menno: [
      ['Getallenparen', 'fr2kg8fWaBU'],
      ['De vergelijking px + qy = r', 'ao0c11rk_lE'],
      ['Herleiden tot de vorm y = ax + b', 'yPUP3-Yajw8'],
    ],
    bob: [['Vergelijkingen met twee variabelen', 'yuGhiBebZfU']],
  },
  skills: [
    ['Getallenparen', s16pair],
    ['Schrijven als y = ax + b', s16iso],
    ['Snijpunten met de assen', s16ax],
  ],
  learn: [
    {
      t: 'Getallenparen',
      p: [
        T(
          'Bij 2x + 3y = 12 hoort niet één oplossing. x = 3 en y = 2 is een oplossing, want 2*3 + 3*2 = 12. Elk paar dat klopt is een punt op een rechte lijn.',
        ),
      ],
    },
    {
      t: 'Schrijven als y = ax + b',
      ex: { q: T('2x + 3y = 12'), steps: ['3y = -2x + 12', 'y = {-2/3}x + 4'] },
    },
    {
      t: 'Snel tekenen',
      p: [
        T(
          'Op de x-as is y = 0, op de y-as is x = 0. Bij 2x + 3y = 12 geeft dat (6, 0) en (0, 4). Teken de lijn door die twee punten.',
        ),
      ],
    },
  ],
};
