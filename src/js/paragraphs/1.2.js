// Paragraaf 1.2: Lineaire verbanden. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { graph } from '../figures.js';
import { ri, nz, pick, coin, Q, qv, qAdd, qMul, near, d, fr, lin, sg } from '../math.js';
import { F, plug, drawLine, inGrid, lineTable } from './shared.js';
import { T, dt } from '../typeset.js';

const LV = [
  ['N', 't'],
  ['K', 'q'],
  ['B', 'k'],
  ['R', 'p'],
  ['W', 's'],
  ['V', 'u'],
];
function s12value() {
  const [y, x] = pick(LV);
  if (coin()) {
    const a = Q(nz(-5, 5), pick([2, 3, 4, 1])),
      t = a.d * nz(-5, 6),
      b = nz(-20, 20),
      val = qAdd(qMul(a, t), b);
    return {
      q: T(`Gegeven is de formule ${y} = ${lin(a, b, x)}. Bereken ${y} voor ${x} = ${t}.`),
      fields: [F(`${y} =`, val)],
      hint: T(`Vul ${x} = ${t} in.`),
      steps: [
        `${x} = ${t} geeft ${y} = ${fr(a)}*${t}${sg(b)} = ${fr(qMul(a, t))}${sg(b)} = ${fr(val)}`,
      ],
      v: () => near(qv(a) * t + b, qv(val)),
    };
  }
  const a = pick([-5, -4, -3, -2, 2, 3, 4, 5, 10]),
    t = ri(-6, 12),
    b = nz(-30, 50),
    v2 = a * t + b;
  return {
    q: T(`Gegeven is de formule ${y} = ${lin(a, b, x)}. Voor welke ${x} is ${y} = ${v2}?`),
    fields: [F(`${x} =`, t)],
    hint: T(`Vul ${y} = ${v2} in en los de vergelijking op.`),
    steps: [`${lin(a, b, x)} = ${v2}`, `${a}${x} = ${v2 - b}`, `${x} = ${t}`],
    v: () => a * t + b === v2,
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
        f: (v) => near(v[0], -s.a),
        m: 'Kijk of de hoeveelheid toeneemt of afneemt. Bij afnemen is a negatief.',
      },
    ],
    v: () => storyFits(s),
  };
}
function s12empty() {
  const a = pick([0.1, 0.2, 0.25, 0.4, 0.5]),
    n = pick([20, 30, 40, 50, 80, 100]),
    b = (n * (a * 20)) / (a * 20),
    t = b / a;
  const ctx = pick([
    {
      t: `Voor de hoeveelheid benzine B in liter in de tank van een boot na u uur varen geldt B = -${d(a)}u + ${b}.`,
      y: 'B',
      x: 'u',
      ask: 'Na hoeveel uur is de tank leeg?',
      u: 'uur',
    },
    {
      t: `Voor de hoogte h in cm van het water in een bak na t minuten geldt h = -${d(a)}t + ${b}.`,
      y: 'h',
      x: 't',
      ask: 'Na hoeveel minuten is de bak leeg?',
      u: 'minuten',
    },
  ]);
  return {
    q: T(`${ctx.t} ${ctx.ask}`),
    fields: [F(`${ctx.x} =`, t, ctx.u)],
    hint: T(`Leeg betekent ${ctx.y} = 0. Los die vergelijking op.`),
    steps: [
      `${ctx.y} = 0 geeft -${d(a)}${ctx.x} + ${b} = 0`,
      `-${d(a)}${ctx.x} = -${b}`,
      `${ctx.x} = ${d(t)}`,
    ],
    v: () => near(-a * t + b, 0),
  };
}
function s12table() {
  const stap = 10,
    a = pick([12, 16, 22, 25, 40]),
    b = pick([400, 650, 800, 1100, 1500]),
    t = ri(11, 39);
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
        f: (v) => near(v[0], a * stap),
        m: 'Dat is de toename per 10 jaar. Je zoekt de toename per jaar.',
      },
    ],
    v: () => b + a * 10 === +rows[1][2],
  };
}
// Een grafiek tekenen met andere letters: de letter achter a staat op de horizontale as.
function s12draw() {
  let b, a;
  do {
    b = ri(-4, 4);
    a = Q(nz(-4, 4), pick([1, 1, 2, 3, 4]));
  } while (!inGrid(a.d, b + a.n));
  const [y, x] = pick(LV),
    p = [0, b],
    q = [a.d, b + a.n];
  return {
    q: T(
      `Teken de grafiek van ${y} = ${lin(a, b, x)}. Tik in het rooster twee punten aan, of vul de coördinaten in.`,
    ),
    ...drawLine(qv(a), b, p, q, x, y),
    hint: T(
      `Maak een tabel met twee punten. Neem ${x} = 0 en ${x} = ${a.d}. De ${x}-as is horizontaal en de ${y}-as is verticaal.`,
    ),
    steps: [
      `${x} = 0 geeft ${y} = ${b}`,
      `${x} = ${a.d} geeft ${y} = ${fr(a)}*${a.d}${b ? sg(b) : ''} = ${q[1]}`,
      ...lineTable(p, q, { a: qv(a), b }, x, y),
    ],
    v: () => [p, q].every(([s, t]) => near((a.n * s) / a.d + b, t)),
  };
}

export default {
  id: '1.2',
  ch: 1,
  num: '1.2',
  title: 'Lineaire verbanden',
  videos: {
    menno: [['Formules met andere letters dan x en y', 'rFEA-kT63qQ']],
    bob: [['Formules met andere letters dan x en y', 'g8s5J0GeRJQ']],
  },
  skills: [
    ['Rekenen met een formule', s12value],
    ['Formule bij een schaal', s12scale],
    ['Formule uit een verhaal', s12story],
    ['Wanneer is het leeg?', s12empty],
    ['Formule uit een tabel', s12table],
    ['Een grafiek tekenen', s12draw],
  ],
  learn: [
    {
      t: 'Andere letters dan x en y',
      p: [
        T(
          'Een formule als N = {2/3}t - 1 werkt precies hetzelfde als y = ax + b. De letter die op de horizontale as staat vervangt x, de letter op de verticale as vervangt y.',
        ),
        T(
          'Om de grafiek te tekenen, maak je eerst een tabel. Hier is dat bijvoorbeeld t = 0 met N = -1, en t = 3 met N = 1. Met die twee punten teken je de lijn.',
        ),
      ],
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
    {
      t: 'Tabel, formule of grafiek?',
      p: [
        'Een waarde opzoeken die er al staat: gebruik de tabel. Een waarde voorspellen: gebruik de formule. Het verloop bekijken: gebruik de grafiek.',
      ],
    },
  ],
};
