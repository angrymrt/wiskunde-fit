// Paragraaf 1.6: Vergelijkingen met twee variabelen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { nz, pick, coin, Q, qv, near, fr, lin } from '../math.js';
import { F, MC } from './shared.js';
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
      q: T(`Gegeven is de vergelijking ${lin2(A, B)} = ${C}. Bereken de oplossing met x = ${x}.`),
      fields: [F('y =', y)],
      hint: T(`Vul x = ${x} in. Dan houd je een vergelijking met alleen y over.`),
      steps: [
        `x = ${x} geeft ${A}*${x} ${B < 0 ? '-' : '+'} ${Math.abs(B)}y = ${C}`,
        `${A * x} ${B < 0 ? '-' : '+'} ${Math.abs(B)}y = ${C}`,
        `${lin(B, 0, 'y')} = ${C - A * x}`,
        `y = ${y}`,
        `Dus (${x}, ${y}).`,
      ],
      v: () => A * x + B * y === C,
    };
  return {
    q: T(`Gegeven is de vergelijking ${lin2(A, B)} = ${C}. Bereken de oplossing met y = ${y}.`),
    fields: [F('x =', x)],
    hint: T(`Vul y = ${y} in. Dan houd je een vergelijking met alleen x over.`),
    steps: [
      `y = ${y} geeft ${lin(A, 0)} ${B < 0 ? '-' : '+'} ${Math.abs(B)}*${y} = ${C}`,
      `${lin(A, B * y)} = ${C}`,
      `${lin(A, 0)} = ${C - B * y}`,
      `x = ${x}`,
      `Dus (${x}, ${y}).`,
    ],
    v: () => A * x + B * y === C,
  };
}
function s16check() {
  const A = pick([2, 3, 4, 5, 6]),
    B = pick([-5, -4, -3, -2, -1, 1, 2, 3, 4]),
    x = nz(-6, 6),
    y = nz(-6, 6),
    good = coin(),
    worth = A * x + B * y,
    C = good ? worth : worth + nz(-4, 4);
  return {
    q: T(
      `Gegeven is de vergelijking ${lin2(A, B)} = ${C}. Is het getallenpaar (${x}, ${y}) een oplossing van de vergelijking?`,
    ),
    mc: MC(good ? ['Ja', 'Nee'] : ['Nee', 'Ja'], 0),
    hint: T(`Vul x = ${x} en y = ${y} in en kijk of er ${C} uitkomt.`),
    steps: [
      `x = ${x} en y = ${y} geeft ${A}*${x} ${B < 0 ? '-' : '+'} ${Math.abs(B)}*${y} = ${worth}${good ? '' : ` ≠ ${C}`}`,
      `Dus (${x}, ${y}) is ${good ? 'een' : 'geen'} oplossing.`,
    ],
    v: () => (A * x + B * y === C) === good,
  };
}
function s16iso() {
  const A = pick([1, 2, 3, 4, 5, 6]),
    B = pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]),
    C = B * nz(-5, 6) + (coin() ? 0 : nz(-3, 3));
  const a = Q(-A, B),
    b = Q(C, B);
  return {
    q: T(`Herleid ${lin2(A, B)} = ${C} tot de vorm y = ax + b.`),
    fields: [F('a =', a), F('b =', b)],
    hint: T(
      B === 1
        ? `Breng ${lin(A, 0)} over naar het rechterlid. Daarbij verandert + in -.`
        : `Breng ${lin(A, 0)} over naar het rechterlid. Daarbij verandert + in -. Deel daarna alle termen door ${B}.`,
    ),
    steps: [
      `${lin2(A, B)} = ${C}`,
      `${lin(B, 0, 'y')} = ${lin(-A, C)}`,
      ...(B === 1 ? [] : [`y = ${lin(a, b)}`]),
    ],
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
    ['Herleiden tot y = ax + b', s16iso],
    ['Snijpunten met de assen', s16ax],
    ['Is het een oplossing?', s16check],
  ],
  learn: [
    {
      t: 'Getallenparen',
      p: [
        T(
          'Een oplossing van een vergelijking met x en y is een getallenpaar (x, y) waarvoor de vergelijking klopt. Bij 4x + 3y = 12 is (-3, 8) een oplossing, want 4*-3 + 3*8 = 12. Maar (8, -3) is geen oplossing, want 4*8 + 3*-3 = 23 ≠ 12.',
        ),
      ],
    },
    {
      t: 'De grafiek tekenen',
      p: [
        T(
          'De grafiek van p​x + q​y = r is een lijn. Daarvoor heb je twee punten nodig. Meestal is rekenen met x = 0 en y = 0 het makkelijkst. Bij 4x + 3y = 12 geeft x = 0 het punt (0, 4) en y = 0 het punt (3, 0).',
        ),
      ],
    },
    {
      t: 'Herleiden tot y = ax + b',
      p: [
        'Breng de term met x over naar het rechterlid. Daarbij verandert + in - en - in +. Staat er nog een getal voor y, deel dan alle termen door dat getal.',
      ],
      ex: { q: T('4x + 3y = 12'), steps: ['3y = -4x + 12', 'y = -{4/3}x + 4'] },
    },
  ],
};
