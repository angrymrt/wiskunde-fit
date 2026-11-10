// Onderwerp: Snijpunten van lijnen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, nz, pick, coin, Q, qv, near, d, fr, lin, dlin, sg } from '../math.js';
import { F } from './shared.js';
import { T } from '../typeset.js';

// Een punt met kommagetallen krijgt een puntkomma, zodat de komma niet tussen de coördinaten verdwijnt.
const point = (name, x, y) =>
  `${name}(${d(x)}${Number.isInteger(x) && Number.isInteger(y) ? ',' : ';'} ${d(y)})`;

function s14axes() {
  const line = pick(['k', 'l', 'm', 'p']),
    [P, R] = pick([
      ['A', 'B'],
      ['P', 'Q'],
      ['C', 'D'],
      ['K', 'L'],
    ]),
    a = pick([-6, -5, -4, -3, -2, -1, 2, 3, 4, 5, 6]),
    z = coin() ? nz(-6, 6) : null,
    b = z !== null ? -a * z : nz(-12, 12),
    xs = Q(-b, a);
  return {
    q: T(
      `De lijn ${line}: y = ${lin(a, b)} snijdt de x-as in het punt ${P} en de y-as in het punt ${R}. Bereken de coördinaten van ${P} en ${R}.`,
    ),
    fields: [F(`x_${P} =`, xs), F(`y_${R} =`, b)],
    hint: T(`${P} ligt op de x-as, dus y_${P} = 0. ${R} ligt op de y-as, dus x_${R} = 0.`),
    steps: [
      `y = 0 geeft ${lin(a, b)} = 0`,
      `${lin(a, 0)} = ${-b}`,
      `x = ${fr(xs)}`,
      `Dus ${P}(${fr(xs)}, 0).`,
      `x = 0 geeft y = ${a}*0${sg(b)} = ${b}, dus ${R}(0, ${b}).`,
    ],
    traps: [
      {
        id: 'assen-omgewisseld',
        f: (v) => near(v[0], b) && near(v[1], qv(xs)) && !near(b, qv(xs)),
        m: 'Je hebt de twee omgewisseld. Op de x-as is y gelijk aan 0, op de y-as is x gelijk aan 0.',
      },
    ],
    v: () => near(a * qv(xs) + b, 0),
  };
}
function s14cut() {
  const slopes = [-3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3];
  let a, c, x, y, b, e;
  do {
    a = pick(slopes);
    c = pick(slopes);
    x = nz(-6, 6);
    y = ri(-12, 12) / 2;
    b = y - a * x;
    e = y - c * x;
  } while (a === c || !b || !e || Math.abs(b) > 15 || Math.abs(e) > 15);
  const [l1, l2] = pick([
    ['l', 'm'],
    ['k', 'l'],
    ['m', 'n'],
  ]);
  return {
    q: T(
      `De lijnen ${l1}: y = ${dlin(a, b)} en ${l2}: y = ${dlin(c, e)} snijden elkaar in het punt S. Bereken de coördinaten van S.`,
    ),
    fields: [F('x_S =', x), F('y_S =', y)],
    hint: T('In het snijpunt zijn de twee formules gelijk. Los die vergelijking op en vul x in.'),
    steps: [
      `${dlin(a, b)} = ${dlin(c, e)}`,
      `${dlin(a - c, 0)} = ${d(e - b)}`,
      `x = ${x}`,
      `x = ${x} invullen bij y = ${dlin(a, b)} geeft`,
      `y = ${d(a)}*${x}${sg(b)} = ${d(y)}`,
      `Dus ${point('S', x, y)}.`,
    ],
    v: () => near(a * x + b, y) && near(c * x + e, y),
  };
}
function s14compare() {
  const a2 = pick([14, 16, 22, 25, 35]),
    da = pick([4, 5, 6, 10, 12]),
    a1 = a2 + da,
    t = pick([5, 10, 15, 20, 25, 30]),
    b1 = pick([300, 600, 1000, 1500, 2400]),
    b2 = b1 + da * t,
    n = a1 * t + b1;
  return {
    q: T(
      `Voor het aantal volgers van twee kanalen geldt V_A = ${lin(a1, b1, 't')} en V_B = ${lin(a2, b2, 't')}, met t in weken. Na hoeveel weken hebben de kanalen evenveel volgers, en hoeveel zijn dat er dan?`,
    ),
    fields: [F('t =', t), F('aantal volgers =', n)],
    hint: T(`Evenveel betekent V_A = V_B. Zet de twee formules aan elkaar gelijk.`),
    steps: [
      `V_A = V_B geeft ${lin(a1, b1, 't')} = ${lin(a2, b2, 't')}`,
      `${da}t = ${b2 - b1}`,
      `t = ${t}`,
      `t = ${t} invullen bij V_A geeft V_A = ${a1}*${t} + ${b1} = ${n}`,
    ],
    v: () => a1 * t + b1 === a2 * t + b2,
  };
}

export default {
  slug: 'snijpunten-van-lijnen',
  title: 'Snijpunten van lijnen',
  intro:
    'Twee lijnen kunnen elkaar snijden, en een lijn snijdt ook de assen. Hier leer je uitrekenen waar dat gebeurt. Zo kun je ook bepalen wanneer twee hoeveelheden even groot zijn.',
  description:
    'Bereken het snijpunt van twee lijnen en de snijpunten met de x-as en de y-as. Gratis uitleg en oefenvragen met uitwerkingen.',
  videos: {
    menno: [
      ['Snijpunten met de x-as en de y-as', 'tdHnhUP7sgQ'],
      ['Snijpunten van grafieken van functies', 'aE6hAgajF0A'],
      ['Lineaire formules vergelijken', 'Zlneq6od-BM'],
    ],
    bob: [
      ['Snijpunten met de x-as en de y-as', '2NIdNlJIDrM'],
      ['Snijpunten van grafieken van functies', 'Q4JkCIf48nQ'],
      ['Lineaire formules vergelijken', '2KAxh0NF8zU'],
    ],
  },
  skills: [
    [23, 'Snijpunten met de assen', s14axes],
    [24, 'Snijpunt van twee lijnen', s14cut],
    [25, 'Formules vergelijken', s14compare],
  ],
  learn: [
    {
      t: 'Snijpunten met de assen',
      p: [
        T(
          'Een punt op de x-as heeft y-coördinaat 0. Een punt op de y-as heeft x-coördinaat 0. Ligt A op de x-as, dan schrijf je y_A = 0.',
        ),
      ],
      ex: {
        q: T('De lijn l: y = 3x - 9 snijdt de x-as in A en de y-as in B.'),
        steps: [
          'y = 0 geeft 3x - 9 = 0',
          '3x = 9',
          'x = 3',
          'Dus A(3, 0).',
          'x = 0 geeft y = 3*0 - 9 = -9, dus B(0, -9).',
        ],
      },
    },
    {
      t: 'Snijpunt van twee lijnen',
      how: [
        'Zet de twee formules aan elkaar gelijk en los de vergelijking op. Dat geeft x.',
        'Vul x in een van de formules in. Dat geeft y.',
        T('Schrijf het punt op. Staat er een kommagetal in, gebruik dan een puntkomma: S(3; 5,5).'),
      ],
      ex: {
        q: T('De lijnen k: y = 2,5x - 2 en l: y = -0,5x + 7 snijden elkaar in S.'),
        steps: [
          '2,5x - 2 = -0,5x + 7',
          '3x = 9',
          'x = 3',
          'x = 3 invullen bij y = 2,5x - 2 geeft',
          'y = 2,5*3 - 2 = 5,5',
          'Dus S(3; 5,5).',
        ],
      },
    },
    {
      t: 'Formules vergelijken',
      p: [
        'Wil je weten wanneer twee hoeveelheden even groot zijn? Dan zet je de twee formules aan elkaar gelijk. Vul de uitkomst in een van de formules in om de hoeveelheid zelf te vinden.',
      ],
    },
  ],
};
