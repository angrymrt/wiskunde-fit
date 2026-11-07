// Paragraaf 1.1: De formule y = ax + b. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { graph } from '../figures.js';
import { ri, nz, pick, coin, gcd, Q, qv, qSub, qMul, near, fr, lin } from '../math.js';
import { F, MC, plug, drawLine, inGrid, lineTable, fillIn, H } from './shared.js';
import { T, dt } from '../typeset.js';

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
      `x = ${x} geeft y = ${plug(a, x, b)} = ${y}${on ? '' : ` ≠ ${gy}`}`,
      on ? `Dus ${P} ligt op ${l}.` : `Dus ${P} ligt niet op ${l}.`,
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
    hint: T(
      'Lees b af waar de lijn de y-as snijdt. Kies daarna nog een roosterpunt op de lijn. Dan is a = {verticaal/horizontaal}.',
    ),
    steps: [
      `Door (0, ${b}), dus b = ${b}.`,
      `a = {verticaal/horizontaal} = {${rise}/${run}}${a.d === run ? '' : ' = ' + fr(a)}`,
      `Dus ${l}: y = ${lin(a, b)}.`,
    ],
    traps: [
      {
        f: (v) => near(v[0], -qv(a)),
        m: 'Kijk naar de richting: gaat de lijn naar rechts omlaag, dan is a negatief. Gaat hij omhoog, dan is a positief.',
      },
      {
        f: (v) => near(v[0], run / rise),
        m: 'Je hebt de breuk omgedraaid. Reken a uit als verticaal gedeeld door horizontaal.',
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
    first = `l // k, dus a = rc_l = rc_k = ${fr(a)}.`;
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
    first = `l // k, dus a = rc_l = rc_k = ${fr(a)}.`;
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
function s11draw() {
  let b, run, rise, a;
  do {
    b = ri(-4, 4);
    run = pick([1, 1, 2, 3]);
    rise = nz(-4, 4);
    a = Q(rise, run);
  } while (!inGrid(a.d, b + a.n));
  const l = pick('klmn'),
    p = [0, b],
    q = [a.d, b + a.n];
  return {
    q: T(
      `Teken de lijn ${l}: y = ${lin(a, b)}. Tik in het rooster twee punten van de lijn aan, of vul de coördinaten in.`,
    ),
    ...drawLine(qv(a), b, p, q),
    hint: T(
      `Maak een tabel met twee punten. Neem x = 0 en een x waarbij y geen breuk wordt, bijvoorbeeld x = ${a.d}.`,
    ),
    steps: [fillIn(a, b, 0), fillIn(a, b, a.d), ...lineTable(p, q, { a: qv(a), b, name: l })],
    v: () => [p, q].every(([x, y]) => near((rise * x) / run + b, y)),
  };
}
// Met de richtingscoëfficiënt en een punt bereken je b. De lijn is niet altijd evenwijdig met een andere.
function s11rc() {
  const a = pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]),
    x = nz(-8, 8),
    y = ri(-20, 24),
    b = y - a * x,
    l = pick('kmpq');
  return {
    q: T(
      coin()
        ? `Het punt P(${x}, ${y}) ligt op de lijn ${l}: y = ${lin(a, 0)} + b. Stel de formule van ${l} op.`
        : `Van de lijn ${l}: y = ax + b is rc_${l} = ${a}. Lijn ${l} gaat door het punt P(${x}, ${y}). Stel de formule van ${l} op.`,
    ),
    fields: [F('a =', a), F('b =', b)],
    hint: T(`Je weet a al. Vul x = ${x} en y = ${y} in de formule in en bereken b.`),
    steps: [
      `y = ${lin(a, 0)} + b door P(${x}, ${y}) geeft ${a}*${x} + b = ${y}`,
      `${a * x} + b = ${y}`,
      `b = ${b}`,
      `Dus ${l}: y = ${lin(a, b)}.`,
    ],
    traps: [
      {
        f: (v) => near(v[1], y + a * x),
        m: 'Let op het teken: het getal bij b gaat naar de andere kant van het is-gelijkteken.',
      },
    ],
    v: () => a * x + b === y,
  };
}
// Twee bijzondere lijnen: horizontaal (a = 0) en door de oorsprong (b = 0).
function s11special() {
  const l = pick('klmn');
  if (coin()) {
    const x = nz(-6, 6),
      y = nz(-9, 9);
    return {
      q: T(
        `De lijn ${l} hoort bij een constant verband en gaat door het punt (${x}, ${y}). Geef de formule van ${l} in de vorm y = ax + b.`,
      ),
      fields: [F('a =', 0), F('b =', y)],
      hint: 'Bij een constant verband is a = 0. De grafiek is een horizontale lijn, dus y is overal hetzelfde.',
      steps: [`Constant verband, dus a = 0.`, `Door (${x}, ${y}), dus ${l}: y = ${y}.`],
      traps: [
        {
          f: (v) => near(v[1], x) && x !== y,
          m: 'Bij een horizontale lijn is b de y-coördinaat van het punt, niet de x-coördinaat.',
        },
      ],
      v: () => [-3, x, 7].every((t) => 0 * t + y === y),
    };
  }
  const x = pick([-4, -3, -2, 2, 3, 4, 5, 6]),
    y = nz(-12, 12),
    a = Q(y, x);
  return {
    q: T(
      `De lijn ${l} hoort bij een recht evenredig verband en gaat door het punt (${x}, ${y}). Geef de formule van ${l} in de vorm y = ax + b.`,
    ),
    fields: [F('a =', a), F('b =', 0)],
    hint: 'Bij een recht evenredig verband gaat de lijn door de oorsprong, dus b = 0.',
    steps: [
      'Recht evenredig verband, dus b = 0.',
      `y = ax door (${x}, ${y}) geeft a*${x} = ${y}`,
      `a = {${y}/${x}}${a.d === x && a.n === y ? '' : ' = ' + fr(a)}`,
      `Dus ${l}: y = ${lin(a, 0)}.`,
    ],
    traps: [
      {
        f: (v) => near(v[0], x / y) && !near(x / y, y / x),
        m: 'Je hebt de breuk omgedraaid. Deel de y-coördinaat door de x-coördinaat.',
      },
    ],
    v: () => near(qv(a) * x, y),
  };
}

export default {
  id: '1.1',
  ch: 1,
  num: '1.1',
  title: 'De formule y = ax + b',
  videos: {
    menno: [
      ['De grafiek van een lineaire formule', '67AA66Z_hIw'],
      ['De formule y = ax + b', 'RpDZhdELvFY'],
      ['Evenwijdige lijnen', 'PvmOG5SswVw'],
    ],
    bob: [
      ['De grafiek van een lineaire formule', 'ZS_74Ceblcc'],
      ['De formule y = ax + b', 'FCfyW3WxE0c'],
      ['Evenwijdige lijnen', 'gqdacQ_meW4'],
    ],
  },
  skills: [
    [3, 'Punt op een lijn', s11point],
    [4, 'Coördinaat berekenen', s11coord],
    [5, 'Formule uit grafiek', s11read],
    [6, 'Formule door twee punten', s11two],
    [7, 'Evenwijdige lijnen', s11par],
    [8, 'Een lijn tekenen', s11draw],
    [9, 'Formule met een punt', s11rc],
    [10, 'Constant en recht evenredig', s11special],
  ],
  learn: [
    {
      t: 'Wat betekenen a en b?',
      p: [
        T(
          'In y = ax + b is b de y-coördinaat van het snijpunt met de y-as. De lijn gaat dus door (0, b).',
        ),
        T(
          'a is de richtingscoëfficiënt, ook wel de helling genoemd: ga je 1 naar rechts, dan ga je a omhoog. Is a negatief, dan ga je omlaag. De richtingscoëfficiënt van lijn l schrijf je als rc_l.',
        ),
      ],
      widget: 'slope',
    },
    {
      t: 'Een lijn tekenen',
      p: [
        T(
          'Voor een lijn heb je twee punten nodig. Maak daarom een tabel met twee x-waarden. Neem x = 0 en een x waarbij y geen breuk wordt. Teken de punten en trek de lijn erdoor. Zet de letter van de lijn erbij.',
        ),
      ],
      ex: {
        q: T('Teken de lijn y = {3/2}x - 2.'),
        steps: [
          'x = 0 geeft y = {3/2}*0 - 2 = -2',
          'x = 2 geeft y = {3/2}*2 - 2 = 1',
          H(
            dt([
              ['x', '0', '2'],
              ['y', '-2', '1'],
            ]),
          ),
          'Dus de lijn gaat door de punten (0, -2) en (2, 1).',
        ],
      },
    },
    {
      t: 'Ligt een punt op de lijn?',
      p: [
        'Vul de x-coördinaat in de formule in. Komt de y-coördinaat eruit, dan ligt het punt op de lijn.',
      ],
      ex: {
        q: T('Ligt A(6, 30) op l: y = 5x - 1?'),
        steps: ['x = 6 geeft y = 5*6 - 1 = 29 ≠ 30', 'Dus A ligt niet op l.'],
      },
    },
    {
      t: 'De formule opstellen uit een grafiek',
      how: [
        'Ga uit van y = ax + b.',
        'Lees het snijpunt met de y-as af. Daaruit volgt b.',
        T('Kies nog een roosterpunt op de lijn. Dan is a = {verticaal/horizontaal}.'),
        'Schrijf de formule op.',
      ],
      ex: {
        q: T('Een lijn gaat door (0, 2) en door het roosterpunt (3, 0).'),
        steps: ['Door (0, 2), dus b = 2.', 'a = {-2/3} = -{2/3}', 'Dus y = -{2/3}x + 2.'],
      },
    },
    {
      t: 'Twee bijzondere lijnen',
      p: [
        T(
          'Bij a = 0 hoort de formule y = b. De grafiek is een horizontale lijn. Je spreekt dan van een constant verband.',
        ),
        T(
          'Bij b = 0 hoort de formule y = ax. De grafiek gaat door de oorsprong. Je spreekt dan van een recht evenredig verband.',
        ),
      ],
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
          'l // k, dus a = rc_l = rc_k = 3.',
          'y = 3x + b door P(-5, 3) geeft 3*-5 + b = 3',
          '-15 + b = 3',
          'b = 18',
          'Dus l: y = 3x + 18.',
        ],
      },
    },
  ],
};
