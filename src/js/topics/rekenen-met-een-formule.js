// Onderwerp: Rekenen met een formule. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, nz, pick, coin, Q, qv, qAdd, qMul, near, d, fr, lin, sg } from '../math.js';
import { F, MC, plug, LV } from './shared.js';
import { T } from '../typeset.js';

// Schrijft a maal x uit zoals het boek: -x met x = -2 wordt --2, en een breuk blijft een breuk.
const times = (aq, x) => {
  if (aq.d === 1 && aq.n === 1) return String(x);
  if (aq.d === 1 && aq.n === -1) return x ? `-${x}` : '0';
  return `${lin(aq, 0, '')}*${x}`;
};
function svValue() {
  const half = coin() && coin(),
    aq = half ? Q(pick([-1, 1]), 2) : Q(pick([-5, -4, -3, -2, -1, 2, 3, 4, 5])),
    b = nz(-12, 12),
    x = half ? 2 * nz(-5, 5) : nz(-9, 9),
    ax = (aq.n * x) / aq.d,
    y = ax + b;
  return {
    q: T(`Gegeven is de formule y = ${lin(aq, b)}. Bereken y voor x = ${x}.`),
    fields: [F('y =', y)],
    hint: T(`Vul x = ${x} in. Reken eerst de vermenigvuldiging uit.`),
    steps: [`x = ${x} geeft y = ${times(aq, x)}${sg(b)} = ${ax}${sg(b)} = ${y}`],
    v: () => near(y - b, qv(aq) * x),
  };
}
function svTable() {
  const a = nz(-5, 5),
    b = nz(-9, 9),
    x = ri(-3, 3),
    y0 = a * x + b,
    y1 = a * (x + 1) + b,
    dir = a > 0 ? 'toe' : 'af',
    size = Math.abs(a);
  return {
    q: T(`Gegeven is de formule y = ${lin(a, b)}. Vul de tabel en de zin in.`),
    fields: [
      F(`x = ${x} geeft y =`, y0),
      F(`x = ${x + 1} geeft y =`, y1),
      F('Als x met 1 toeneemt, dan neemt y met', size),
      { sel: ['toe', 'af'], a: dir, label: 'Kies toe of af' },
    ],
    hint: T('Vul allebei de waarden van x in en kijk hoeveel y verandert.'),
    steps: [
      `x = ${x} geeft y = ${times(Q(a), x)}${sg(b)} = ${y0}`,
      `x = ${x + 1} geeft y = ${times(Q(a), x + 1)}${sg(b)} = ${y1}`,
      `Van ${y0} naar ${y1} is ${size} ${a > 0 ? 'erbij' : 'eraf'}. Als x met 1 toeneemt, dan neemt y met ${size} ${dir}.`,
    ],
    traps: [
      {
        id: 'richting-toename',
        f: (v) => near(v[0], y0) && near(v[1], y1) && near(v[2], size) && v[3] !== dir,
        m: 'De getallen kloppen. Kijk nog eens of y groter of kleiner wordt.',
      },
    ],
    v: () => y1 - y0 === a,
  };
}
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
        id: 'minteken',
        f: (v) => near(v[0], -x) && x !== 0,
        m: 'Het getal klopt bijna. Kijk nog eens naar het minteken.',
      },
    ],
    v: () => a * x + b === y,
  };
}
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

export default {
  slug: 'rekenen-met-een-formule',
  title: 'Rekenen met een formule',
  intro:
    'Met een formule reken je uit welke y bij een x hoort, of andersom. Hier leer je invullen, een tabel maken en nagaan of een punt op een lijn ligt.',
  description:
    'Oefen rekenen met een formule: y berekenen bij een x, een tabel maken en nagaan of een punt op een lijn ligt. Gratis, met uitleg en uitwerkingen.',
  videos: {
    menno: [['Formules met andere letters dan x en y', 'rFEA-kT63qQ']],
    bob: [['Formules met andere letters dan x en y', 'g8s5J0GeRJQ']],
  },
  skills: [
    [1, 'y berekenen', svValue],
    [2, 'Tabel en toename', svTable],
    [3, 'Punt op een lijn', s11point],
    [4, 'Coördinaat berekenen', s11coord],
    [11, 'Formule met andere letters', s12value],
    [14, 'Wanneer is het leeg?', s12empty],
  ],
  learn: [
    {
      t: 'Rekenen met een lineaire formule',
      p: ['Bij elke x hoort één y. Vul x in de formule in en reken uit. Doe de keer eerst.'],
      ex: {
        q: T('Gegeven is de formule y = -2x + 6.'),
        steps: [
          'x = 4 geeft y = -2*4 + 6 = -8 + 6 = -2',
          'x = -3 geeft y = -2*-3 + 6 = 6 + 6 = 12',
        ],
      },
      watch: T('Vul je een negatief getal in, gebruik dan: min maal min is plus.'),
    },
    {
      t: 'Een tabel invullen',
      p: [
        T(
          'Maak je x steeds 1 groter, dan verandert y steeds met hetzelfde getal. Dat is het getal voor x. Bij y = -2x + 6 neemt y met 2 af als x met 1 toeneemt.',
        ),
      ],
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
      t: 'Andere letters dan x en y',
      p: [
        T(
          'Een formule als N = {2/3}t - 1 werkt precies hetzelfde als y = ax + b. De letter die op de horizontale as staat vervangt x, de letter op de verticale as vervangt y.',
        ),
      ],
    },
    {
      t: 'Terugrekenen',
      p: [T('Soms is y gegeven en zoek je x. Vul y in de formule in en los de vergelijking op.')],
      ex: {
        q: T('Gegeven is de formule y = 3x + 2. Voor welke x is y = 14?'),
        steps: ['3x + 2 = 14', '3x = 12', 'x = 4'],
      },
    },
    {
      t: 'Tabel, formule of grafiek?',
      p: [
        'Een waarde opzoeken die er al staat: gebruik de tabel. Een waarde voorspellen: gebruik de formule. Het verloop bekijken: gebruik de grafiek.',
      ],
    },
  ],
};
