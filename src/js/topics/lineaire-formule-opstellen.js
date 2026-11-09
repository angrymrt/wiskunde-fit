// Onderwerp: Lineaire formule opstellen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { graph } from '../figures.js';
import { ri, nz, pick, coin, gcd, Q, qv, qSub, qMul, near, fr, lin } from '../math.js';
import { F, plug, LV } from './shared.js';
import { T, dt } from '../typeset.js';

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
        id: 'teken-van-a',
        f: (v) => near(v[0], -qv(a)),
        m: 'Kijk naar de richting: gaat de lijn naar rechts omlaag, dan is a negatief. Gaat hij omhoog, dan is a positief.',
      },
      {
        id: 'breuk-omgedraaid',
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
        id: 'volgorde-aftrekken',
        f: (v) => near(v[0], -qv(a)),
        m: 'Let op de volgorde. Trek bij y en bij x de coördinaten in dezelfde volgorde af.',
      },
      {
        id: 'breuk-omgedraaid',
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
        id: 'andere-a-dan-evenwijdige-lijn',
        f: (v) => !near(v[0], qv(a)),
        m: 'Evenwijdige lijnen stijgen even hard. Neem dezelfde a als lijn k.',
      },
    ],
    v: () => near(qv(a) * px + qv(b), py),
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
        id: 'teken-van-b',
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
          id: 'x-als-b',
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
        id: 'breuk-omgedraaid',
        f: (v) => near(v[0], x / y) && !near(x / y, y / x),
        m: 'Je hebt de breuk omgedraaid. Deel de y-coördinaat door de x-coördinaat.',
      },
    ],
    v: () => near(qv(a) * x, y),
  };
}
function s12scale() {
  const xs = pick([25, 50, 100, 250]),
    ys = pick([10, 20, 50, 100, 500]);
  let b0, r0, c0;
  do {
    b0 = ri(0, 3);
    r0 = ri(2, 5);
    c0 = nz(-3, 3);
  } while (b0 + c0 < 0 || b0 + c0 > 6);
  const b = b0 * ys,
    run = r0 * xs,
    rise = c0 * ys,
    a = Q(rise, run),
    [y, x] = pick(LV);
  return {
    q: T(`Stel de formule op bij de grafiek: ${y} = a​${x} + b. Let op de schaal op de assen.`),
    fig: graph({
      xr: [0, 6],
      yr: [0, 6],
      xs,
      ys,
      xn: x,
      yn: y,
      u: 40,
      lines: [{ a: qv(a), b }],
      pts: [
        { x: 0, y: b },
        { x: run, y: b + rise },
      ],
    }),
    fields: [F('a =', a), F('b =', b)],
    hint: 'Lees twee punten af met de getallen op de assen, niet met het aantal hokjes.',
    steps: [
      `Door (0, ${b}), dus b = ${b}.`,
      `a = {${rise}/${run}}${a.d === run && a.n === rise ? '' : ' = ' + fr(a)}`,
      `Dus ${y} = ${lin(a, b, x)}.`,
    ],
    traps: [
      {
        id: 'hokjes-geteld',
        f: (v) => near(v[0], c0 / r0) && !near(c0 / r0, qv(a)),
        m: 'Je hebt hokjes geteld. Reken met de getallen die bij de assen staan.',
      },
    ],
    v: () => near(qv(a) * run + b, b + rise),
  };
}
const STORIES = [
  () => {
    const a = pick([2, 3, 4, 5, 6, 8]),
      b = pick([5, 8, 10, 12]);
    return {
      t: `Een fietsverhuur rekent €${b} vast en €${a} per uur. P is de prijs in euro bij n uur huren.`,
      y: 'P',
      x: 'n',
      a,
      b,
      why: [
        `Per uur komt er €${a} bij, dus a = ${a}.`,
        `De vaste kosten zijn €${b}, dus b = ${b}.`,
      ],
    };
  },
  () => {
    const a = pick([10, 15, 20, 25, 30]),
      b = a * pick([6, 8, 10, 12]);
    return {
      t: `In een regenton zit ${b} liter water. Per dag gebruik je ${a} liter voor de tuin. W is het aantal liter na d dagen.`,
      y: 'W',
      x: 'd',
      a: -a,
      b,
      why: [
        `Per dag gaat er ${a} liter af, dus a = -${a}.`,
        `Op d = 0 zit er ${b} liter in, dus b = ${b}.`,
      ],
    };
  },
  () => {
    const a = pick([250, 350, 400, 450, 500]),
      b = pick([1800, 2200, 2400, 2600, 3000]);
    return {
      t: `Een wandelaar begint op ${b} meter hoogte in de bergen en daalt ${a} meter per uur. H is de hoogte in meter na u uur.`,
      y: 'H',
      x: 'u',
      a: -a,
      b,
      why: [
        `Per uur daalt de wandelaar ${a} meter, dus a = -${a}.`,
        `De beginhoogte is ${b} meter, dus b = ${b}.`,
      ],
    };
  },
  () => {
    const a = pick([5, 10, 12, 15, 20]),
      b = pick([60, 80, 120, 150, 200]);
    return {
      t: `Mila heeft €${b} gespaard en spaart er elke week €${a} bij. S is het bedrag in euro na t weken.`,
      y: 'S',
      x: 't',
      a,
      b,
      why: [`Elke week komt er €${a} bij, dus a = ${a}.`, `Ze begint met €${b}, dus b = ${b}.`],
    };
  },
  () => {
    const a = pick([250, 350, 450, 600]),
      b = pick([12000, 15000, 18000, 24000]);
    return {
      t: `Een app heeft ${b} gebruikers en er komen elke dag ${a} gebruikers bij. G is het aantal gebruikers na d dagen.`,
      y: 'G',
      x: 'd',
      a,
      b,
      why: [`Per dag komen er ${a} bij, dus a = ${a}.`, `Het startgetal is ${b}, dus b = ${b}.`],
    };
  },
];
// Leest het startgetal, de stap en de richting uit de tekst en loopt het verhaal na met de formule.
function storyFits(s) {
  const [start, step] = s.t.match(/\d+/g).map(Number);
  const change = /gebruik je|daalt/.test(s.t) ? -step : step;
  let y = start;
  for (let x = 0; x <= 3; x++) {
    if (s.a * x + s.b !== y) return false;
    y += change;
  }
  return s.t.includes(`${s.y} is`) && s.t.includes(` ${s.x} `);
}
function s12story() {
  const s = pick(STORIES)();
  return {
    q: T(`${s.t} Stel de formule op: ${s.y} = a​${s.x} + b.`),
    fields: [F('a =', s.a), F('b =', s.b)],
    hint: 'b is het startgetal. a is wat er per stap bij komt of af gaat. Gaat er iets af, dan is a negatief.',
    steps: [...s.why, `Dus ${s.y} = ${lin(s.a, s.b, s.x)}.`],
    traps: [
      {
        id: 'teken-van-a',
        f: (v) => near(v[0], -s.a),
        m: 'Kijk of de hoeveelheid toeneemt of afneemt. Bij afnemen is a negatief.',
      },
    ],
    v: () => storyFits(s),
  };
}
function s12table() {
  const stap = 10,
    a = pick([12, 16, 22, 25, 40]),
    b = pick([400, 650, 800, 1100, 1500]),
    // Niet 20 of 30, want die staan al in de tabel.
    t = pick([...Array(29)].map((_, i) => 11 + i).filter((x) => x % stap));
  const rows = [
    ['t', 0, 10, 20, 30],
    ['L', b, b + a * 10, b + a * 20, b + a * 30],
  ].map((r) => r.map(String));
  return {
    q:
      T(
        `De tabel hoort bij een lineair verband. L is het aantal leden van een sportclub, t is de tijd in jaren.`,
      ) +
      dt(rows) +
      T(`Stel de formule op en bereken L voor t = ${t}.`),
    fields: [F('a =', a), F('b =', b), F('L =', a * t + b)],
    hint: T(
      `De tabel gaat met stappen van ${stap} jaar. Deel de toename door ${stap} om de toename per jaar te krijgen.`,
    ),
    steps: [
      `Per ${stap} jaar komen er ${a * stap} leden bij, dus per jaar ${a}. Dus a = ${a}.`,
      `Op t = 0 zijn er ${b} leden, dus b = ${b}.`,
      `L = ${lin(a, b, 't')}`,
      `t = ${t} geeft L = ${plug(a, t, b)} = ${a * t + b}`,
    ],
    traps: [
      {
        id: 'toename-per-stap',
        f: (v) => near(v[0], a * stap),
        m: 'Dat is de toename per 10 jaar. Je zoekt de toename per jaar.',
      },
    ],
    // Reken de formule na met het eerste en het laatste punt uit de tabel, en kijk of t niet al
    // in de tabel staat.
    v: () => {
      const ts = rows[0].slice(1).map(Number),
        ls = rows[1].slice(1).map(Number),
        slope = (ls.at(-1) - ls[0]) / (ts.at(-1) - ts[0]);
      return (
        slope === a &&
        ls[0] - slope * ts[0] === b &&
        ls[0] + slope * (t - ts[0]) === a * t + b &&
        !ts.includes(t)
      );
    },
  };
}

export default {
  slug: 'lineaire-formule-opstellen',
  title: 'Lineaire formule opstellen',
  intro:
    'Soms heb je een grafiek, twee punten of een verhaal en zoek je de formule die daarbij hoort. Hier leer je hoe je a en b vindt.',
  description:
    'Stel een lineaire formule op uit een grafiek, twee punten, een tabel of een verhaal. Bereken a en b en oefen gratis met steeds nieuwe vragen.',
  videos: {
    menno: [
      ['De formule y = ax + b', 'RpDZhdELvFY'],
      ['Evenwijdige lijnen', 'PvmOG5SswVw'],
    ],
    bob: [
      ['De formule y = ax + b', 'FCfyW3WxE0c'],
      ['Evenwijdige lijnen', 'gqdacQ_meW4'],
    ],
  },
  skills: [
    [5, 'Formule uit grafiek', s11read],
    [6, 'Formule door twee punten', s11two],
    [7, 'Evenwijdige lijnen', s11par],
    [9, 'Formule met een punt', s11rc],
    [10, 'Constant en recht evenredig', s11special],
    [12, 'Formule bij een schaal', s12scale],
    [13, 'Formule uit een verhaal', s12story],
    [15, 'Formule uit een tabel', s12table],
  ],
  learn: [
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
    {
      t: 'Verhaal naar formule',
      p: [
        'In een verhaal is b het startgetal (vaste kosten, beginhoeveelheid). a is wat er per stap bij komt of af gaat.',
      ],
      ex: {
        q: T('Een regenton bevat 640 liter. Per dag gebruik je 40 liter.'),
        steps: [
          'Het startgetal is 640, dus b = 640.',
          'Per dag gaat er 40 af, dus a = -40.',
          'W = -40d + 640',
        ],
      },
      watch:
        'Een tabel met stappen van 10 jaar? Deel de toename eerst door 10. Dan heb je de toename per jaar.',
    },
    {
      t: 'Let op de schaal',
      p: [
        T(
          'Bij een grafiek reken je met de getallen op de assen. Gaat de grafiek door (0, 100) en (60, 180), dan is a = {80/60} = {1 1/3}.',
        ),
      ],
    },
  ],
};
