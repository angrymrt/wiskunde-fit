// Onderwerp: Kwadratische functies. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, nz, pick, coin, near, d, rd, sg, isNice } from '../math.js';
import {
  F,
  H,
  MC,
  quad,
  quadValue as value,
  fillQuad as fill,
  slips,
  fairSlips as distinct,
  valueTraps,
  quadP,
  unknownSteps,
  unknownTraps,
} from './shared.js';
import { graph } from '../figures.js';
import { T, dt } from '../typeset.js';

// Een kwadratische functie staat als [a, b, c] voor f(x) = ax² + bx + c. De functiewaarde, de
// invulling en de valkuilen daarbij staan in shared.js, want Top en snijpunten gebruikt ze ook.
// Dezelfde functiewaarde op een andere manier, voor de controle v: f(x) = (ax + b)x + c.
const horner = ([a, b, c], x) => rd((a * x + b) * x + c, 6);
// Waar de grafiek de x-as snijdt, met de abc-formule. Voor de controle bij een verhaal.
function roots([a, b, c]) {
  const D = b * b - 4 * a * c;
  if (D < 0) return [];
  return [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((p, q) => p - q);
}

// Leest [a, b, c] terug uit de tekst van quad. Voor de controle: zo klopt het antwoord met de
// formule zoals die in de vraag staat, ook als de termen in een andere volgorde staan.
function readQuad(s) {
  const k = [0, 0, 0];
  for (const [, sign, num, x] of s.replace(/ /g, '').matchAll(/([+-]?)([\d,]*)(x\^2|x)?/g)) {
    if (!num && !x) continue;
    k[x === 'x^2' ? 0 : x ? 1 : 2] +=
      (sign === '-' ? -1 : 1) * (num ? Number(num.replace(',', '.')) : 1);
  }
  return k;
}
const NAMES = ['f', 'g', 'h'];
// Voor b geen 1 of -1: dan zou er bij een negatieve x iets als + -3 staan.
const B = [-8, -7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7, 8];
function fillHint(a, x) {
  if (x < 0) return `Vervang elke x door ${x}. Zet ${x} tussen haakjes bij het kwadraat: (${x})^2.`;
  if (a < 0)
    return `Vervang elke x door ${x}. Reken eerst ${x}^2 uit en vermenigvuldig dat met ${a}.`;
  return `Vervang elke x door ${x}. Reken eerst het kwadraat uit.`;
}

function s31value() {
  let abc, x;
  do {
    const a = pick([-3, -2, -1, -1, 1, 1, 2, 3]),
      b = coin() && coin() ? 0 : pick(B),
      c = b && coin() && coin() ? 0 : nz(-9, 9);
    abc = [a, b, c];
    x = coin() || coin() ? -ri(1, 5) : ri(1, 5);
  } while (!distinct(abc, x) || Math.abs(value(abc, x)) > 99);
  const n = pick(NAMES),
    y = value(abc, x);
  return {
    q: T(`Gegeven is de functie ${n}(x) = ${quad(abc)}. Bereken ${n}(${x}).`),
    fields: [F(`${n}(${x}) =`, y)],
    hint: T(fillHint(abc[0], x)),
    steps: [fill(n, abc, x)],
    traps: valueTraps(abc, [[0, x]]),
    v: () => near(horner(abc, x), y),
  };
}

// Volgordes van de termen anders dan ax² + bx + c, met de macht van x.
const ORDERS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 2, 0],
  [1, 0, 2],
  [2, 0, 1],
];
function s31abc() {
  const kind = pick(['gewoon', 'zonder-b', 'zonder-c', 'volgorde', 'volgorde']),
    a = coin()
      ? pick([-1, 1])
      : coin() && coin()
        ? pick([-0.5, 0.5, -1.5, 2.5])
        : pick([-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]),
    b = kind === 'zonder-b' ? 0 : nz(-9, 9),
    c = kind === 'zonder-c' ? 0 : nz(-12, 12),
    abc = [a, b, c],
    order =
      kind === 'volgorde'
        ? pick(ORDERS)
        : kind === 'gewoon'
          ? [2, 1, 0]
          : pick([[2, 1, 0], ...ORDERS]),
    n = pick(NAMES),
    f = quad(abc, order),
    k = { 2: a, 1: b, 0: c };
  // De getallen in de volgorde waarin ze staan, als je die voor a, b en c zou nemen.
  const written = order.map((p) => k[p]);
  const traps = [];
  if (kind === 'volgorde' && written.some((w, i) => w !== abc[i]))
    traps.push({
      id: 'volgorde-termen',
      f: (v) => written.every((w, i) => near(v[i], w)),
      m: 'a is het getal voor x², b het getal voor x en c het getal zonder x. Het maakt niet uit in welke volgorde de termen staan.',
    });
  if (kind === 'zonder-b' || kind === 'zonder-c')
    traps.push({
      id: 'ontbrekende-term',
      f: (v) => (b ? near(v[1], 0) && near(v[2], b) : near(v[1], c) && near(v[2], 0)),
      m: 'Ontbreekt een term, dan is dat getal 0. Staat er geen term met x, dan is b = 0. Staat er geen getal zonder x, dan is c = 0.',
    });
  if (Math.abs(a) === 1)
    traps.push({
      id: 'a-is-een',
      f: (v) => near(v[0], 0),
      m: 'Staat er geen getal voor x², dan is a = 1. Bij −x² is a = −1.',
    });
  traps.push({
    id: 'teken-vergeten',
    f: (v) => abc.some((r, i) => r !== 0 && near(v[i], -r)),
    m: 'Het teken hoort bij het getal. Bij f(x) = x² − 3x is b = −3.',
  });
  const steps = [];
  if (f !== quad(abc)) steps.push(`Op volgorde: ${n}(x) = ${quad(abc)}`);
  if (Math.abs(a) === 1)
    steps.push(
      a > 0
        ? 'Voor x^2 staat geen getal, dus a = 1.'
        : 'Voor x^2 staat alleen een min, dus a = -1.',
    );
  if (!b) steps.push('Er staat geen term met x, dus b = 0.');
  if (!c) steps.push('Er staat geen getal zonder x, dus c = 0.');
  steps.push(`a = ${d(a)}, b = ${d(b)} en c = ${d(c)}`);
  return {
    q: T(`Gegeven is de functie ${n}(x) = ${f}. Wat zijn a, b en c?`),
    fields: [F('a =', a), F('b =', b), F('c =', c)],
    compact: true,
    hint: T(
      'a is het getal voor x^2, b het getal voor x en c het getal zonder x. Ontbreekt een term, dan is dat getal 0.',
    ),
    steps,
    traps,
    v: () => readQuad(f).every((r, i) => near(r, abc[i])),
  };
}

function s31dalberg() {
  const a = pick([-5, -4, -3, -2, -1, -1, -0.5, 0.5, 1, 1, 2, 3, 4, 5]),
    b = coin() && coin() ? 0 : nz(-9, 9),
    c = nz(-12, 12),
    abc = [a, b, c],
    order = coin() ? [2, 1, 0] : pick(ORDERS),
    n = pick(NAMES),
    f = quad(abc, order),
    k = { 2: a, 1: b, 0: c },
    first = k[order.find((p) => k[p])],
    opts = [T('een dalparabool'), T('een bergparabool')],
    right = a > 0 ? 0 : 1;
  return {
    q: T(`Is de grafiek van ${n}(x) = ${f} een dalparabool of een bergparabool?`),
    // De keuzes staan altijd in dezelfde volgorde.
    mc: { opts, a: right },
    hint: T('Kijk naar a, het getal voor x^2. Is a positief of negatief?'),
    steps: [
      ...(f !== quad(abc) ? [`Op volgorde: ${n}(x) = ${quad(abc)}`] : []),
      `a = ${d(a)}, dus a ${a > 0 ? '>' : '<'} 0.`,
      `Dus de grafiek is een ${a > 0 ? 'dal' : 'berg'}parabool.`,
    ],
    traps:
      first !== a && first > 0 !== a > 0
        ? [
            {
              id: 'eerste-term',
              f: (v) => v[0] === opts[1 - right],
              m: 'Kijk naar het getal voor x². Dat is a, ook als de term met x² niet vooraan staat.',
            },
          ]
        : [],
    v: () => readQuad(f)[0] > 0 === (right === 0),
  };
}

function s31point() {
  let abc, x;
  do {
    const a = pick([-3, -2, -1, 1, 2, 3]),
      b = coin() && coin() ? 0 : pick(B);
    abc = [a, b, nz(-9, 9)];
    x = coin() || coin() ? -ri(1, 4) : ri(1, 4);
  } while (!distinct(abc, x) || Math.abs(value(abc, x)) > 60);
  const n = pick(NAMES),
    P = pick(['A', 'B', 'C', 'P']),
    y = value(abc, x),
    on = coin(),
    // Ligt het punt er niet op, dan is de y-coördinaat vaak wat je krijgt met een bekende fout.
    yP = on ? y : rd(y + pick([...Object.values(slips(abc, x)), pick([-2, -1, 1, 2])]), 6),
    sel = on ? 'ja' : 'nee';
  return {
    q: T(
      `Gegeven is de functie ${n}(x) = ${quad(abc)}. Ligt het punt ${P}(${x}, ${d(yP)}) op de grafiek van ${n}?`,
    ),
    fields: [
      F(`${n}(${x}) =`, y),
      {
        sel: ['ja', 'nee'],
        a: sel,
        pre: `Ligt ${P} op de grafiek?`,
        label: `Ligt ${P} op de grafiek van ${n}?`,
        br: true,
      },
    ],
    hint: T(`Bereken ${n}(${x}) en vergelijk de uitkomst met de y-coördinaat van ${P}.`),
    steps: [
      fill(n, abc, x) + (on ? '' : ` ≠ ${d(yP)}`),
      on
        ? `Dit is gelijk aan y_${P} = ${d(yP)}, dus ${P} ligt op de grafiek van ${n}.`
        : `Dus ${P} ligt niet op de grafiek van ${n}.`,
    ],
    traps: [
      ...valueTraps(abc, [[0, x]]),
      {
        id: 'conclusie-omgedraaid',
        f: (v) => near(v[0], y) && !!v[1] && v[1] !== sel,
        m: `Je functiewaarde klopt. Vergelijk die met de y-coördinaat van ${P}. Zijn ze gelijk, dan ligt ${P} op de grafiek. Anders niet.`,
      },
    ],
    v: () => near(horner(abc, x), y) && near(horner(abc, x), yP) === on,
  };
}

// Een onbekend getal p in de formule, en de grafiek gaat door een gegeven punt. p staat op de
// plek van a, b of c. Vul het punt in en los de vergelijking op.
function s31unknown() {
  let abc, k, x, y;
  do {
    k = pick([0, 1, 1, 2]);
    abc = [pick([-3, -2, -1, 1, 2, 3]), k === 1 ? nz(-8, 8) : pick(B), nz(-9, 9)];
    x = coin() ? -ri(1, 4) : ri(1, 4);
    y = value(abc, x);
  } while (Math.abs(y) > 60);
  const n = pick(NAMES),
    P = pick(['A', 'B', 'C', 'D']),
    p = abc[k],
    f = quadP(abc, k);
  return {
    q: T(
      `Gegeven is de functie ${n}(x) = ${f}. De grafiek van ${n} gaat door het punt ${P}(${x}, ${y}). Bereken p.`,
    ),
    fields: [F('p =', p)],
    hint: T(
      `${P} ligt op de grafiek, dus ${n}(${x}) = ${y}. Vul x = ${x} in en los de vergelijking met p op.` +
        (x < 0 ? ` Zet ${x} tussen haakjes bij het kwadraat: (${x})^2.` : ''),
    ),
    steps: [
      `${P}(${x}, ${y}) ligt op de grafiek van ${n}, dus ${n}(${x}) = ${y}.`,
      ...unknownSteps(abc, k, x, y),
    ],
    traps: unknownTraps(abc, k, x, y, 0, P),
    // Vul p in de formule zoals die in de vraag staat in, en reken de functiewaarde na.
    v: () => {
      const g = readQuad(f.replace('p', String(p)));
      return g[0] !== 0 && near(horner(g, x), y);
    },
  };
}

// x_top uit twee gelijke functiewaarden: f(p) = f(q) geeft x_top = (p + q)/2.
function symPair() {
  let abc, p, q, h2;
  do {
    const a = pick([-2, -1, 1, 2]);
    h2 = ri(-3, 7); // twee keer x_top, zodat x_top ook 1,5 kan zijn
    const k2 = pick(h2 % 2 ? [1, 3, 5] : [2, 4, 6]);
    p = (h2 - k2) / 2;
    q = (h2 + k2) / 2;
    abc = [a, -a * h2, nz(-9, 9)];
  } while (
    h2 === 0 ||
    Math.abs(abc[1]) === 1 ||
    p < -4 ||
    q > 7 ||
    Math.abs(value(abc, p)) > 40 ||
    !distinct(abc, p) ||
    !distinct(abc, q)
  );
  const n = pick(NAMES),
    fp = value(abc, p),
    xt = h2 / 2,
    traps = [
      ...valueTraps(abc, [
        [0, p],
        [1, q],
      ]),
      {
        id: 'midden-vergeten',
        f: (v) => near(v[2], p + q),
        m: 'x_top ligt precies in het midden. Tel de twee x-waarden op en deel door 2.',
      },
    ];
  // Alleen bij p = 0 is de halve afstand gelijk aan x_top.
  if (p)
    traps.push({
      id: 'halve-afstand',
      f: (v) => near(v[2], (q - p) / 2),
      m: 'Je hebt de halve afstand tussen de twee x-waarden berekend. x_top is het midden: tel de twee x-waarden op en deel door 2.',
    });
  return {
    q: T(
      `Gegeven is de functie ${n}(x) = ${quad(abc)}. Bereken ${n}(${p}) en ${n}(${q}). Gebruik je antwoorden om x_top te berekenen.`,
    ),
    fields: [F(`${n}(${p}) =`, fp), F(`${n}(${q}) =`, fp), F('x_top =', xt)],
    hint: T(
      `Bereken eerst de twee functiewaarden. Zijn ze gelijk, dan ligt x_top precies in het midden van ${p} en ${q}.`,
    ),
    steps: [
      fill(n, abc, p),
      fill(n, abc, q),
      `${n}(${p}) = ${n}(${q}), dus x_top = {${p}${sg(q)}/2} = ${d(xt)}`,
    ],
    traps,
    // De top ook met de regel x_top = -b/(2a), die later komt.
    v: () => near(horner(abc, p), horner(abc, q)) && near(-abc[1] / (2 * abc[0]), xt),
  };
}
// Een tabel met zeven punten en x_top in het midden. Twee gelijke waarden verraden de top.
function symTable() {
  let abc, h;
  do {
    const a = pick([-2, -1, 1, 2]);
    h = ri(-2, 3);
    abc = [a, -2 * a * h, nz(-8, 8)];
  } while (
    [-3, -2, -1, 0, 1, 2, 3].some((i) => Math.abs(value(abc, h + i)) > 20) ||
    !distinct(abc, h)
  );
  const n = pick(NAMES),
    // De naam van de tabel voor een schermlezer, uniek genoeg voor een proeftoets met meer vragen.
    label = `${n}(x) = ${quad(abc).replace('^2', '²').replace(/-/g, '−')}`,
    xs = [-3, -2, -1, 0, 1, 2, 3].map((i) => h + i),
    ys = xs.map((x) => value(abc, x)),
    shown = ys.map((y, i) => ([0, 1, 2, 4].includes(i) ? d(y) : '…')),
    traps = [
      ...valueTraps(abc, [[1, h]]),
      {
        id: 'spiegel-verkeerd',
        f: (v) => near(v[2], ys[0]) || near(v[3], ys[1]),
        m: 'Spiegel in x_top: twee x-waarden die even ver links en rechts van x_top liggen, hebben dezelfde functiewaarde.',
      },
    ];
  if (h)
    traps.push({
      id: 'midden-vergeten',
      f: (v) => near(v[0], 2 * h),
      m: 'x_top ligt precies in het midden. Tel de twee x-waarden op en deel door 2.',
    });
  return {
    q:
      T(
        `De tabel hoort bij de functie ${n}(x) = ${quad(abc)}. Bereken x_top met de symmetrie, en vul de tabel aan.`,
      ) +
      dt(
        [
          ['x', ...xs.map(String)],
          [`${n}(x)`, ...shown],
        ],
        `Tabel bij ${label}`,
      ),
    fields: [
      F('x_top =', h),
      F(`${n}(${h}) =`, ys[3]),
      F(`${n}(${h + 2}) =`, ys[5]),
      F(`${n}(${h + 3}) =`, ys[6]),
    ],
    hint: T(
      `Zoek in de tabel twee gelijke functiewaarden. x_top ligt daar precies tussenin. Gebruik daarna de symmetrie.`,
    ),
    steps: [
      `${n}(${h - 1}) = ${n}(${h + 1}) = ${d(ys[2])}, dus x_top = {${h - 1}${sg(h + 1)}/2} = ${h}`,
      fill(n, abc, h),
      `Door de symmetrie is ${n}(${h + 2}) = ${n}(${h - 2}) = ${d(ys[1])} en ${n}(${h + 3}) = ${n}(${h - 3}) = ${d(ys[0])}.`,
      H(
        dt(
          [
            ['x', ...xs.map(String)],
            [`${n}(x)`, ...ys.map(d)],
          ],
          `Ingevulde tabel bij ${label}`,
        ),
      ),
    ],
    traps,
    v: () =>
      near(-abc[1] / (2 * abc[0]), h) &&
      near(horner(abc, h + 2), horner(abc, h - 2)) &&
      near(horner(abc, h + 3), horner(abc, h - 3)),
  };
}
function s31sym() {
  return coin() ? symPair() : symTable();
}

// Het beeld van de grafieken bij Grafiek bij een formule.
const PICK = { xr: [-5, 5], yr: [-7, 7], u: 16, lx: 2, ly: 2 };
const pickFig = (abc) => graph({ ...PICK, curves: [{ abc }], label: 'Grafiek' });
// De top en het snijpunt met de y-as liggen in beeld, zodat je ze kunt zien.
// Nog een punt om na te rekenen, het liefst dicht bij de y-as en in beeld.
const checkX = (abc) => [1, -1, 2, -2].find((x) => Math.abs(value(abc, x)) <= 6);
const inView = (abc) => {
  const xt = -abc[1] / (2 * abc[0]),
    yt = value(abc, xt);
  return Math.abs(xt) <= 4 && Math.abs(yt) <= 6 && Math.abs(abc[2]) <= 6;
};
function s31pick() {
  let abc, wrong;
  do {
    const a = pick([-2, -1, -1, 1, 1, 2]),
      h = pick([-2, -1, 1, 2]),
      c = a * h * h + ri(-5, 5);
    abc = [a, -2 * a * h, c];
    // Elke andere grafiek heeft één ander getal: a, b of c.
    wrong = [
      [-a, abc[1], c],
      [a, -abc[1], c],
      [a, abc[1], c + pick([-3, -2, 2, 3])],
    ];
  } while (![abc, ...wrong].every(inView) || checkX(abc) === undefined);
  const n = pick(NAMES),
    [a, , c] = abc,
    figs = [abc, ...wrong].map(pickFig),
    x1 = checkX(abc),
    y1 = value(abc, x1),
    mc = MC(figs, 0);
  return {
    q: T(`Welke grafiek hoort bij ${n}(x) = ${quad(abc)}?`),
    mc,
    hint: T(
      'Kijk of het een dalparabool of een bergparabool is, en waar de grafiek de y-as snijdt. Reken daarna nog een punt uit.',
    ),
    steps: [
      `a = ${a}, dus a ${a > 0 ? '>' : '<'} 0. De grafiek is een ${a > 0 ? 'dal' : 'berg'}parabool.`,
      `${n}(0) = ${c}, dus de grafiek snijdt de y-as in (0, ${c}).`,
      `${fill(n, abc, x1)}, dus de grafiek gaat door (${x1}, ${y1}).`,
      'Alleen deze grafiek past bij alle drie:',
      H(
        graph({
          ...PICK,
          // De naam staat een eind van de y-as, zodat hij niet over de y bij de as valt.
          curves: [
            {
              abc,
              name: n,
              at: [3, -3, 3.5, -3.5, 2.5, -2.5, 4, -4].find((x) => Math.abs(value(abc, x)) <= 5.5),
            },
          ],
          pts: [
            { x: 0, y: c },
            { x: x1, y: y1 },
          ],
          label: `De grafiek van ${n}`,
        }),
      ),
    ],
    traps: [
      {
        id: 'dal-berg-omgedraaid',
        f: (v) => v[0] === figs[1],
        m: 'Kijk naar a. Bij a > 0 hoort een dalparabool en bij a < 0 een bergparabool.',
      },
      {
        id: 'gespiegeld',
        f: (v) => v[0] === figs[2],
        m: 'Deze grafiek snijdt de y-as op de goede plek, maar de top ligt aan de verkeerde kant. Reken nog een punt uit, zoals f(1), en kijk of het op de grafiek ligt.',
      },
      {
        id: 'snijpunt-y-as',
        f: (v) => v[0] === figs[3],
        m: 'Kijk waar de grafiek de y-as snijdt. Dat is bij f(0), en f(0) is gelijk aan c.',
      },
    ],
    // De gekozen figuur hoort bij de formule zoals die in de vraag staat.
    v: () => mc.opts[mc.a] === pickFig(readQuad(quad(abc))),
  };
}

// Eigen verhalen over iets dat door de lucht gaat. x is de afstand en f(x) de hoogte, allebei in
// meter. a, b en c zijn lijsten waaruit de vraag kiest. Zonder start is c = 0, en dan past de
// vraag naar de starthoogte niet.
const STORIES = [
  {
    t: 'Bij een opslag slaat Noor de volleybal schuin omhoog.',
    wat: 'de bal',
    Wat: 'De bal',
    van: 'de plek waar Noor de bal raakt',
    boven: 'de grond',
    neer: 'op de grond',
    start: 'Op welke hoogte raakt Noor de bal?',
    a: [-0.04, -0.05, -0.06],
    b: [0.4, 0.5, 0.6],
    c: [2.2, 2.4, 2.5],
  },
  {
    t: 'Een fontein in een vijver spuit een straal water schuin omhoog.',
    wat: 'het water',
    Wat: 'Het water',
    van: 'de spuitmond',
    boven: 'het water van de vijver',
    neer: 'in de vijver',
    start: 'Hoe hoog boven het water zit de spuitmond?',
    a: [-0.2, -0.25, -0.3],
    b: [1, 1.2, 1.5],
    c: [0.4, 0.5, 0.8],
  },
  {
    t: 'Jesse gooit vanaf een steiger een steen in een meer.',
    wat: 'de steen',
    Wat: 'De steen',
    van: 'de rand van de steiger',
    boven: 'het water',
    neer: 'in het water',
    start: 'Op welke hoogte boven het water laat Jesse de steen los?',
    a: [-0.08, -0.1, -0.12],
    b: [0.6, 0.8, 1],
    c: [1.4, 1.6, 1.8],
  },
  {
    t: 'Een handballer gooit de bal naar een teamgenoot.',
    wat: 'de bal',
    Wat: 'De bal',
    van: 'de plek waar de bal wordt losgelaten',
    boven: 'de grond',
    neer: 'op de grond',
    start: 'Op welke hoogte laat de handballer de bal los?',
    a: [-0.05, -0.06, -0.08],
    b: [0.4, 0.5, 0.6],
    c: [1.6, 1.8, 2],
  },
  {
    t: 'Een sproeier in een tuin spuit water over het gras.',
    wat: 'het water',
    Wat: 'Het water',
    van: 'de sproeier',
    boven: 'het gras',
    neer: 'op het gras',
    start: 'Hoe hoog boven het gras komt het water uit de sproeier?',
    a: [-0.15, -0.2, -0.25],
    b: [0.8, 1, 1.2],
    c: [0.2, 0.3, 0.4],
  },
  {
    t: 'Een keeper neemt een doeltrap.',
    wat: 'de bal',
    Wat: 'De bal',
    van: 'de plek waar de keeper de bal trapt',
    boven: 'de grond',
    neer: 'op de grond',
    a: [-0.02, -0.03],
    b: [0.6, 0.8, 0.9],
    c: [0],
  },
];
const storyText = (s, n, abc, f = quad(abc)) =>
  `${s.t} Voor de hoogte van ${s.wat} geldt ${n}(x) = ${f}. Hierin is x de afstand in meter vanaf ${s.van} en ${n}(x) de hoogte in meter boven ${s.boven}.`;
// Waar het voorwerp neerkomt: het rechter snijpunt met de x-as.
const landing = (abc) => Math.max(...roots(abc));

function s32height() {
  const s = pick(STORIES.filter((x) => x.start)),
    n = pick(NAMES);
  let abc, x;
  do {
    abc = [pick(s.a), pick(s.b), pick(s.c)];
    const far = Math.floor(landing(abc));
    x = far >= 4 ? ri(2, far - 1) : 0;
  } while (!x || near(value(abc, x), abc[2]));
  const [a, b, c] = abc,
    y = value(abc, x);
  return {
    q: T(`${storyText(s, n, abc)} ${s.start} Hoe hoog is ${s.wat} op ${x} meter vanaf ${s.van}?`),
    fields: [F('starthoogte:', c, 'meter'), F(`hoogte bij x = ${x}:`, y, 'meter')],
    hint: T(`De starthoogte is de hoogte bij x = 0. Vul daarna x = ${x} in.`),
    steps: [
      `De starthoogte is de hoogte bij x = 0: ${n}(0) = ${d(c)}`,
      `Dus de starthoogte is ${d(c)} meter.`,
      fill(n, abc, x),
      `Dus op ${x} meter vanaf ${s.van} is ${s.wat} ${d(y)} meter hoog.`,
    ],
    traps: [
      {
        id: 'starthoogte-nul',
        f: (v) => near(v[0], 0),
        m: 'De starthoogte is de hoogte bij x = 0. Vul x = 0 in: dan blijft alleen het getal zonder x over.',
      },
      {
        id: 'kwadraat-vergeten',
        f: (v) => near(v[1], rd(a * x + b * x + c, 6)),
        m: 'Vergeet het kwadraat niet. Reken eerst x² uit en vermenigvuldig dat met het getal ervoor.',
      },
    ],
    v: () => near(horner(abc, 0), c) && near(horner(abc, x), y) && y > 0,
  };
}

function s32further() {
  const s = pick(STORIES),
    n = pick(NAMES),
    far = coin();
  let abc, e, y;
  do {
    abc = [pick(s.a), pick(s.b), pick(s.c)];
    const L = landing(abc);
    // Komt het verder, dan ligt e net voor het neerkomen. Anders net erna.
    e = far ? Math.floor(L) - ri(0, 1) : Math.ceil(L) + ri(0, 1);
    y = value(abc, e);
  } while (Math.abs(y) < 0.05 || e < 3 || e < -abc[1] / (2 * abc[0]) + 1);
  const [a, b, c] = abc,
    yes = `verder dan ${e} meter`,
    no = `niet verder dan ${e} meter`,
    sel = y > 0 ? yes : no;
  return {
    q: T(
      `${storyText(s, n, abc)} Onderzoek of ${s.wat} verder komt dan ${e} meter vanaf ${s.van}.`,
    ),
    fields: [
      F(`${n}(${e}) =`, y),
      {
        sel: [yes, no],
        a: sel,
        pre: `${s.Wat} komt`,
        label: `Komt ${s.wat} verder dan ${e} meter?`,
        br: true,
      },
    ],
    hint: T(
      `Bereken de hoogte bij x = ${e}. Is die positief, dan is ${s.wat} daar nog niet ${s.neer}.`,
    ),
    steps: [
      fill(n, abc, e),
      y > 0
        ? `${n}(${e}) > 0, dus bij x = ${e} is ${s.wat} nog boven ${s.boven}.`
        : `${n}(${e}) < 0, dus ${s.wat} is al eerder ${s.neer} gekomen.`,
      `Dus ${s.wat} komt ${y > 0 ? '' : 'niet '}verder dan ${e} meter.`,
    ],
    traps: [
      {
        id: 'conclusie-omgedraaid',
        f: (v) => near(v[0], y) && !!v[1] && v[1] !== sel,
        m: `Je hoogte klopt. Is die positief, dan is ${s.wat} daar nog boven ${s.boven} en komt ${s.wat} dus verder. Is die negatief, dan niet.`,
      },
      {
        id: 'kwadraat-vergeten',
        f: (v) => near(v[0], rd(a * e + b * e + c, 6)),
        m: 'Vergeet het kwadraat niet. Reken eerst x² uit en vermenigvuldig dat met het getal ervoor.',
      },
    ],
    // Met de abc-formule: komt het verder dan e, dan ligt het neerkomen voorbij e.
    v: () => near(horner(abc, e), y) && landing(abc) > e === (sel === yes),
  };
}

// Een onbekend getal b in een verhaal. Je weet waar het voorwerp neerkomt, of hoe hoog het op een
// afstand is. Bereken eerst p en daarna de hoogte op een andere afstand.
function s32unknown() {
  const s = pick(STORIES),
    n = pick(NAMES),
    land = !s.c.some((c) => c) && coin();
  let abc, x, y, e, L;
  do {
    abc = [pick(s.a), pick(s.b), pick(s.c)];
    L = landing(abc);
    x = land ? L : ri(2, Math.floor(L) - 1);
    y = land ? 0 : value(abc, x);
    e = ri(2, Math.floor(L) - 1);
  } while (
    Math.floor(L) < 4 ||
    !isNice(x, 0) ||
    !isNice(y, 2) ||
    (!land && y <= 0) ||
    e === Math.round(x) ||
    value(abc, e) <= 0
  );
  x = Math.round(x);
  const [a, p, c] = abc,
    f = quadP(abc, 1),
    h = value(abc, e),
    noSq = rd(a * e + p * e + c, 6),
    traps = unknownTraps(abc, 1, x, y, 0);
  if (!near(noSq, h))
    traps.push({
      id: 'kwadraat-vergeten',
      f: (v) => near(v[1], noSq),
      m: 'Vergeet het kwadraat niet. Reken eerst x² uit en vermenigvuldig dat met het getal ervoor.',
    });
  return {
    q: T(
      `${storyText(s, n, abc, f)} ${
        land
          ? `Op ${x} meter vanaf ${s.van} komt ${s.wat} ${s.neer} terecht.`
          : `Op ${x} meter vanaf ${s.van} is ${s.wat} ${d(y)} meter hoog.`
      } Bereken p. Hoe hoog is ${s.wat} op ${e} meter vanaf ${s.van}?`,
    ),
    fields: [F('p =', p), F(`hoogte bij x = ${e}:`, h, 'meter')],
    hint: T(
      land
        ? `Komt ${s.wat} bij x = ${x} ${s.neer} terecht, dan is de hoogte daar 0. Dus ${n}(${x}) = 0. Los die vergelijking op. Vul daarna p en x = ${e} in.`
        : `Bij x = ${x} is de hoogte ${d(y)}, dus ${n}(${x}) = ${d(y)}. Los die vergelijking op. Vul daarna p en x = ${e} in.`,
    ),
    steps: [
      land
        ? `${s.Wat} komt bij x = ${x} ${s.neer} terecht, dus ${n}(${x}) = 0.`
        : `Bij x = ${x} is de hoogte ${d(y)} meter, dus ${n}(${x}) = ${d(y)}.`,
      ...unknownSteps(abc, 1, x, y),
      `Dus ${n}(x) = ${quad(abc)}.`,
      fill(n, abc, e),
      `Dus op ${e} meter vanaf ${s.van} is ${s.wat} ${d(h)} meter hoog.`,
    ],
    traps,
    // Vul p in de formule zoals die in de vraag staat in, en reken beide hoogtes na.
    v: () => {
      const k = readQuad(f.replace('p', d(p)));
      return near(horner(k, x), y) && near(horner(k, e), h) && h > 0 && (!land || near(L, x));
    },
  };
}

export default {
  slug: 'kwadratische-functies',
  title: 'Kwadratische functies',
  intro:
    'Een functie als f(x) = ax^2 + bx + c heet een kwadratische functie. De grafiek is een parabool. Hier leer je functiewaarden berekenen, de symmetrie van een parabool gebruiken en rekenen aan de baan van een bal.',
  description:
    'Oefen kwadratische functies: functiewaarden berekenen, a, b en c aflezen, dalparabool of bergparabool, symmetrie en de baan van een bal. Met uitleg.',
  videos: {
    menno: [['Functiewaarden berekenen', 'fiS4kcrhq5g']],
  },
  skills: [
    [66, 'Functiewaarde berekenen', s31value],
    [67, 'a, b en c aflezen', s31abc],
    [68, 'Dalparabool of bergparabool', s31dalberg],
    [69, 'Ligt het punt op de grafiek?', s31point],
    [70, 'Symmetrie en de top', s31sym],
    [71, 'Grafiek bij een formule', s31pick],
    [72, 'Hoogte in een verhaal', s32height],
    [73, 'Verder dan een afstand?', s32further],
    [100, 'Onbekend getal met een punt', s31unknown],
    [102, 'Onbekend getal in een verhaal', s32unknown],
  ],
  learn: [
    {
      t: 'Functiewaarden berekenen',
      p: [
        T(
          'Bij een functie hoort bij elke x één uitkomst. Bij f(x) = x^2 - 4x + 1 is f(5) de functiewaarde bij x = 5. Je vervangt dan elke x door 5.',
        ),
      ],
      ex: {
        q: T('Gegeven is de functie f(x) = -3x^2 + 4x + 2. Bereken f(2) en f(-1).'),
        steps: [
          'f(2) = -3*2^2 + 4*2 + 2 = -12 + 8 + 2 = -2',
          'f(-1) = -3*(-1)^2 + 4*-1 + 2 = -3 - 4 + 2 = -5',
        ],
      },
      watch: T(
        'Zet een negatief getal tussen haakjes als je het kwadrateert: (-4)^2 = 16, maar -4^2 = -16. In de term met x zijn geen haakjes nodig: 4*-1 = -4.',
      ),
    },
    {
      t: 'De functie f(x) = ax^2 + bx + c',
      p: [
        T(
          'Een functie f(x) = ax^2 + bx + c met a ≠ 0 heet een kwadratische functie. a is het getal voor x^2, b het getal voor x en c het getal zonder x.',
        ),
        T(
          'Ontbreekt een term, dan is dat getal 0. Bij f(x) = 5 - x^2 is a = -1, b = 0 en c = 5. De volgorde van de termen maakt niet uit.',
        ),
        T(
          'De grafiek is een parabool. Is a > 0, dan is het een dalparabool. Is a < 0, dan is het een bergparabool.',
        ),
      ],
      ex: {
        q: T('Gegeven zijn f(x) = x^2 - 2x - 3 en g(x) = 4 - x^2.'),
        steps: [
          'Bij f is a = 1, dus a > 0. De grafiek van f is een dalparabool.',
          'Bij g is a = -1, dus a < 0. De grafiek van g is een bergparabool.',
          H(
            graph({
              xr: [-4, 5],
              yr: [-5, 5],
              u: 24,
              curves: [
                { abc: [1, -2, -3], name: 'f', at: 3.7 },
                { abc: [-1, 0, 4], name: 'g', at: -1.6 },
              ],
            }),
          ),
        ],
      },
    },
    {
      t: 'Ligt een punt op de grafiek?',
      p: [
        T(
          'Vul de x-coördinaat van het punt in de functie in. Komt de y-coördinaat eruit, dan ligt het punt op de grafiek. Anders niet.',
        ),
      ],
      ex: {
        q: T('Ligt het punt A(-2, 15) op de grafiek van f(x) = 2x^2 - 3x + 1?'),
        steps: [
          'f(-2) = 2*(-2)^2 - 3*-2 + 1 = 8 + 6 + 1 = 15',
          'Dit is gelijk aan y_A = 15, dus A ligt op de grafiek van f.',
        ],
      },
    },
    {
      t: 'Een onbekend getal berekenen',
      p: [
        T(
          'Soms staat er een letter in de formule in plaats van een getal, zoals p in f(x) = x^2 + px - 4. Weet je een punt op de grafiek, dan kun je p berekenen.',
        ),
      ],
      how: [
        T(
          'Het punt ligt op de grafiek, dus vul de x-coördinaat in en zet de uitkomst gelijk aan de y-coördinaat.',
        ),
        'Reken alles uit wat je kunt uitrekenen. Er blijft een vergelijking met p over.',
        'Los die vergelijking op.',
      ],
      ex: {
        q: T('De grafiek van f(x) = x^2 + px - 4 gaat door het punt A(-2, 6). Bereken p.'),
        steps: [
          'A(-2, 6) ligt op de grafiek van f, dus f(-2) = 6.',
          '(-2)^2 + p*-2 - 4 = 6',
          '4 - 2p - 4 = 6',
          '-2p = 6',
          'p = -3',
        ],
      },
      watch: T(
        'Een negatief getal kwadrateer je tussen haakjes: (-2)^2 = 4. Breng je een getal naar de andere kant van het isgelijkteken, dan verandert het teken.',
      ),
    },
    {
      t: 'De top en de symmetrie',
      p: [
        T(
          'Een parabool is symmetrisch. De symmetrieas is een verticale lijn door de top. De top is het laagste punt van een dalparabool en het hoogste punt van een bergparabool.',
        ),
        T(
          'Zijn twee functiewaarden gelijk, zoals f(p) = f(q), dan ligt x_top precies in het midden: x_top = {p + q/2}.',
        ),
      ],
      how: [
        'Zoek twee x-waarden met dezelfde functiewaarde.',
        T('Het midden daarvan is x_top.'),
        T(
          'Maak een tabel met zeven x-waarden, met x_top in het midden. Door de symmetrie hoef je maar de helft uit te rekenen.',
        ),
      ],
      ex: {
        q: T('Gegeven is de functie f(x) = x^2 - 4x + 1.'),
        steps: [
          'f(1) = 1^2 - 4*1 + 1 = 1 - 4 + 1 = -2',
          'f(3) = 3^2 - 4*3 + 1 = 9 - 12 + 1 = -2',
          'f(1) = f(3), dus x_top = {1 + 3/2} = 2',
          'f(2) = 2^2 - 4*2 + 1 = 4 - 8 + 1 = -3',
          H(
            dt(
              [
                ['x', '-1', '0', '1', '2', '3', '4', '5'],
                ['f(x)', '6', '1', '-2', '-3', '-2', '1', '6'],
              ],
              'Tabel met zeven punten',
            ),
          ),
          H(
            graph({
              xr: [-2, 6],
              yr: [-4, 7],
              u: 24,
              curves: [{ abc: [1, -4, 1], name: 'f', at: 4.6 }],
              pts: [-1, 0, 1, 2, 3, 4, 5].map((x) => ({ x, y: x * x - 4 * x + 1 })),
              label: 'Grafiek met de symmetrieas x = 2 als stippellijn',
              extra: (X, Y) =>
                `<line class="s d" x1="${X(2)}" x2="${X(2)}" y1="${Y(7)}" y2="${Y(-4)}"/>`,
            }),
          ),
        ],
      },
    },
    {
      t: 'Kwadratische functies in een verhaal',
      p: [
        T(
          'Bij een bal die door de lucht gaat, is x vaak de afstand en f(x) de hoogte. De starthoogte is de hoogte bij x = 0, dus f(0).',
        ),
        T(
          'Wil je weten of de bal verder komt dan een bepaalde afstand? Bereken dan de hoogte bij die afstand. Is die positief, dan is de bal daar nog in de lucht en komt hij verder. Is die negatief, dan was de bal al eerder op de grond.',
        ),
      ],
      ex: {
        q: T(
          'Voor de hoogte van een bal geldt f(x) = -0,05x^2 + 0,8x + 1,2. Hierin zijn x de afstand en f(x) de hoogte, allebei in meter. Bereken de starthoogte en onderzoek of de bal verder komt dan 18 meter.',
        ),
        steps: [
          'f(0) = 1,2, dus de starthoogte is 1,2 meter.',
          'f(18) = -0,05*18^2 + 0,8*18 + 1,2 = -16,2 + 14,4 + 1,2 = -0,6',
          'f(18) < 0, dus de bal is al eerder op de grond gekomen.',
          'Dus de bal komt niet verder dan 18 meter.',
        ],
      },
      watch: 'Een negatieve hoogte betekent dat de bal al op de grond is gekomen.',
    },
  ],
};
