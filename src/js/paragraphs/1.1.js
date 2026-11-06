// Paragraaf 1.1: De formule y = ax + b. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { graph } from '../figures.js';
import { ri, nz, pick, coin, gcd, Q, qv, qSub, qMul, near, fr, lin } from '../math.js';
import { F, MC, plug } from './shared.js';
import { T } from '../typeset.js';

function s11point() {
  const a = pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 8]),
    b = nz(-13, 13),
    x = nz(-10, 10),
    y = a * x + b,
    on = coin(),
    gy = on ? y : y + pick([-10, -2, -1, 1, 2, 10]),
    P = pick('ABCDEFG'),
    l = pick('klmn');
  return {
    q: T(`Ligt het punt ${P}(${x}, ${gy}) op de lijn ${l}: y = ${lin(a, b)}?`),
    mc: MC([T(`Ja, ${P} ligt op ${l}`), T(`Nee, ${P} ligt niet op ${l}`)], on ? 0 : 1),
    hint: T(`Vul x = ${x} in de formule in en vergelijk de uitkomst met ${gy}.`),
    steps: [
      `x = ${x} geeft y = ${plug(a, x, b)} = ${y}`,
      on ? `Dus ${P} ligt op ${l}.` : `${y} is niet gelijk aan ${gy}, dus ${P} ligt niet op ${l}.`,
    ],
    v: () => (a * x + b === gy) === on,
  };
}
function s11coord() {
  const a = pick([-5, -4, -3, -2, 2, 3, 4, 5, 8]),
    b = nz(-13, 13),
    x = nz(-9, 9),
    y = a * x + b,
    l = pick('klmn');
  if (coin())
    return {
      q: T(`Het punt A(${x}, c) ligt op de lijn ${l}: y = ${lin(a, b)}. Bereken c.`),
      fields: [F('c =', y)],
      hint: T(`Vul x = ${x} in de formule in.`),
      steps: [`x = ${x} en y = c geeft c = ${plug(a, x, b)} = ${y}`],
      v: () => a * x + b === y,
    };
  return {
    q: T(`Het punt B(d, ${y}) ligt op de lijn ${l}: y = ${lin(a, b)}. Bereken d.`),
    fields: [F('d =', x)],
    hint: T(`Vul y = ${y} in. Je krijgt dan een vergelijking met d.`),
    steps: [`x = d en y = ${y} geeft ${lin(a, b, 'd')} = ${y}`, `${a}d = ${y - b}`, `d = ${x}`],
    traps: [
      {
        f: (v) => near(v[0], -x) && x !== 0,
        m: 'Het getal klopt bijna. Kijk nog eens naar het minteken.',
      },
    ],
    v: () => a * x + b === y,
  };
}
function s11read() {
  let b, run, rise;
  do {
    b = ri(-3, 4);
    run = pick([1, 1, 2, 2, 3, 4]);
    rise = nz(-4, 4);
  } while (b + rise < -5 || b + rise > 6 || (gcd(rise, run) > 1 && run > 2));
  const a = Q(rise, run),
    l = pick('klmn');
  return {
    q: T(`Stel de formule op van lijn ${l}. Schrijf hem als y = ax + b. Vul a en b in.`),
    fig: graph({
      lines: [{ a: qv(a), b, name: l }],
      pts: [
        { x: 0, y: b },
        { x: run, y: b + rise },
      ],
    }),
    fields: [F('a =', a), F('b =', b)],
    hint: 'Lees b af waar de lijn de y-as snijdt. Tel daarna vanaf dat punt hoeveel de lijn stijgt of daalt als je naar rechts gaat.',
    steps: [
      `Door (0, ${b}), dus b = ${b}.`,
      `De lijn gaat ${run} naar rechts en ${Math.abs(rise)} ${rise > 0 ? 'omhoog' : 'omlaag'}, dus a = {${rise}/${run}}${a.d === run ? '' : ' = ' + fr(a)}.`,
      `Dus ${l}: y = ${lin(a, b)}.`,
    ],
    traps: [
      {
        f: (v) => near(v[0], -qv(a)),
        m: 'Kijk naar de richting: gaat de lijn naar rechts omlaag, dan is a negatief. Gaat hij omhoog, dan is a positief.',
      },
      {
        f: (v) => near(v[0], run / rise),
        m: 'Je hebt de breuk omgedraaid. Reken a uit als omhoog gedeeld door naar rechts.',
      },
    ],
    v: () => near(qv(a) * run + b, b + rise),
  };
}
function s11two() {
  const px = nz(-6, 6),
    py = ri(-8, 8);
  let run, rise, qx;
  do {
    run = pick([1, 2, 3, 4, 5, 6]);
    rise = nz(-12, 12);
    qx = px + run;
  } while (qx === 0);
  const a = Q(rise, run),
    qy = py + rise,
    b = qSub(py, qMul(a, px)),
    l = pick('klmn');
  return {
    q: T(
      `De lijn ${l} gaat door P(${px}, ${py}) en Q(${qx}, ${qy}). Stel de formule op: y = ax + b.`,
    ),
    fields: [F('a =', a), F('b =', b)],
    hint: T(`a = {verschil in y/verschil in x}. Vul daarna P in de formule in om b te vinden.`),
    steps: [
      `a = {${qy} - ${py < 0 ? '-' + -py : py}/${qx} - ${px < 0 ? '-' + -px : px}} = {${rise}/${run}}${a.d === run ? '' : ' = ' + fr(a)}`,
      `y = ${lin(a, 0)} + b door P(${px}, ${py}) geeft ${fr(a)}*${px} + b = ${py}`,
      `${fr(qMul(a, px))} + b = ${py}`,
      `b = ${fr(b)}`,
      `Dus ${l}: y = ${lin(a, b)}.`,
    ],
    traps: [
      {
        f: (v) => near(v[0], -qv(a)),
        m: 'Let op de volgorde. Trek bij y en bij x de coördinaten in dezelfde volgorde af.',
      },
      {
        f: (v) => near(v[0], run / rise),
        m: 'Je hebt de breuk omgedraaid. Het is verschil in y gedeeld door verschil in x.',
      },
    ],
    v: () => near(qv(a) * px + qv(b), py) && near(qv(a) * qx + qv(b), qy),
  };
}
function s11par() {
  const e = coin();
  let a, px, py, intro, first;
  if (e) {
    a = Q(pick([-5, -4, -3, -2, 2, 3, 4, 5]));
    px = nz(-8, 8);
    py = ri(-16, 20);
    const c = nz(-9, 9);
    intro = `De lijn l is evenwijdig met k: y = ${lin(a, c)} en gaat door P(${px}, ${py}).`;
    first = `l // k, dus a = rc_k = ${fr(a)}.`;
  } else {
    const den = pick([2, 3, 4]),
      num = nz(-5, 5);
    a = Q(num, den);
    px = a.d * nz(-3, 3);
    py = ri(-9, 9);
    const c = nz(-6, 6);
    if (a.d === 1) {
      const k = nz(-4, 4);
      px = k;
    }
    intro = `De lijn l is evenwijdig met k: y = ${lin(a, c)} en gaat door P(${px}, ${py}).`;
    first = `l // k, dus a = rc_k = ${fr(a)}.`;
  }
  const b = qSub(py, qMul(a, px));
  return {
    q: T(`${intro} Stel de formule van l op: y = ax + b.`),
    fields: [F('a =', a), F('b =', b)],
    hint: 'Evenwijdige lijnen hebben dezelfde a. Vul daarna P in om b te vinden.',
    steps: [
      first,
      `y = ${lin(a, 0)} + b door P(${px}, ${py}) geeft ${fr(a)}*${px} + b = ${py}`,
      `${fr(qMul(a, px))} + b = ${py}`,
      `b = ${fr(b)}`,
      `Dus l: y = ${lin(a, b)}.`,
    ],
    traps: [
      {
        f: (v) => !near(v[0], qv(a)),
        m: 'Evenwijdige lijnen stijgen even hard. Neem dezelfde a als lijn k.',
      },
    ],
    v: () => near(qv(a) * px + qv(b), py),
  };
}

export default {
  id: '1.1',
  ch: 1,
  num: '1.1',
  title: 'De formule y = ax + b',
  core: true,
  videos: [
    ['1.1 A De grafiek van een lineaire formule', 'ZS_74Ceblcc'],
    ['1.1 B De formule y = ax + b', 'FCfyW3WxE0c'],
    ['1.1 C Evenwijdige lijnen', 'gqdacQ_meW4'],
  ],
  skills: [
    ['Punt op een lijn', s11point],
    ['Coördinaat berekenen', s11coord],
    ['Formule uit grafiek', s11read],
    ['Formule door twee punten', s11two],
    ['Evenwijdige lijnen', s11par],
  ],
  learn: [
    {
      t: 'Wat betekenen a en b?',
      p: [
        T(
          'In y = ax + b is b de y-coördinaat van het snijpunt met de y-as. De lijn gaat dus door (0, b).',
        ),
        T(
          'a is de richtingscoëfficiënt: ga je 1 naar rechts, dan ga je a omhoog. Is a negatief, dan ga je omlaag.',
        ),
      ],
      widget: 'slope',
    },
    {
      t: 'Ligt een punt op de lijn?',
      p: [
        'Vul de x-coördinaat in de formule in. Komt de y-coördinaat eruit, dan ligt het punt op de lijn.',
      ],
      ex: {
        q: T('Ligt A(6, 29) op l: y = 5x - 1?'),
        steps: ['x = 6 geeft y = 5*6 - 1 = 29', 'Dus A ligt op l.'],
      },
    },
    {
      t: 'Formule opstellen door twee punten',
      how: [
        T('Bereken a = {verschil in y/verschil in x}.'),
        'Vul een van de punten in de formule in.',
        'Los op: zo vind je b.',
      ],
      ex: {
        q: T('Stel de formule op van de lijn door P(2, 7) en Q(6, -1).'),
        steps: [
          'a = {-1 - 7/6 - 2} = {-8/4} = -2',
          'y = -2x + b door P(2, 7) geeft -2*2 + b = 7',
          '-4 + b = 7',
          'b = 11',
          'Dus y = -2x + 11.',
        ],
      },
    },
    {
      t: 'Evenwijdige lijnen',
      p: [
        T(
          'Evenwijdige lijnen hebben dezelfde richtingscoëfficiënt. Je schrijft k // l, dus rc_k = rc_l.',
        ),
      ],
      ex: {
        q: T('l is evenwijdig met k: y = 3x + 1 en gaat door P(-5, 3).'),
        steps: [
          'l // k, dus a = 3.',
          'y = 3x + b door P(-5, 3) geeft 3*-5 + b = 3',
          '-15 + b = 3',
          'b = 18',
          'Dus l: y = 3x + 18.',
        ],
      },
    },
  ],
};
