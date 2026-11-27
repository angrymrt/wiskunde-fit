// Onderwerp: Coördinaten en assenstelsels. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, nz, pick, coin, shuffle, until, Q, qv, fr, near } from '../math.js';
import { F, H, MC } from './shared.js';
import { graph, and, cap } from '../figures.js';
import { SOORTEN, tekenAf, tekenFig } from '../tekenvragen.js';
import { T } from '../typeset.js';

// T zet I en II cursief, als een variabele. Een kwadrant heeft een Romeins cijfer, dus dat staat
// los in een span. De rest van de tekst gaat gewoon door T.
const TK = (s) =>
  s
    .split(/\b(I{1,3}|IV)\b/)
    .map((p, i) => (i % 2 ? `<span>${p}</span>` : T(p)))
    .join('');
const ROMAN = ['I', 'II', 'III', 'IV'];
// Een melding is gewone tekst, dus met een echt minteken.
const mn = (x) => String(x).replace('-', '−');
const is = (v, [a, b]) => v[0] === a && v[1] === b;
const links = (x) => (x < 0 ? 'naar links' : 'naar rechts');
const omhoog = (y) => (y < 0 ? 'omlaag' : 'omhoog');
// De velden voor de coördinaten van een punt: L( x , y ).
const pointFields = (L, x, y, name = L) => [
  { ...F(`${L}(`, x, ','), label: `x-coördinaat van ${name}` },
  { ...F('', y, ')'), label: `y-coördinaat van ${name}` },
];
const SWAP =
  'Je hebt x en y omgewisseld. Eerst staat de x-coördinaat: hoeveel je naar links of rechts gaat. Daarna de y-coördinaat: hoeveel je omhoog of omlaag gaat.';

// Waar een punt in de figuur staat, teruggerekend uit de plek van zijn naam en van de O. Zo
// controleert v wat er echt getekend is. Zie graph in figures.js: de naam staat 7 rechts en 7
// boven het punt, en de O 11 links en 14 onder de oorsprong.
function drawnAt(fig, L, u) {
  const num = (re) => fig.match(re).slice(1).map(Number),
    [ox, oy] = num(/<text class="ti tk" x="([-\d.]+)" y="([-\d.]+)">O<\/text>/),
    [lx, ly] = num(new RegExp(`<text class="ti" x="([-\\d.]+)" y="([-\\d.]+)">${L}</text>`));
  return [(lx - 7 - (ox + 11)) / u, (oy - 14 - (ly + 7)) / u];
}

// Een punt aflezen uit een figuur, of het punt bij gegeven coördinaten kiezen. Tussen de punten
// staan ook (y, x) en het punt met één teken anders, want dat zijn de bekende fouten.
function s31read() {
  const [x, y] = until(
      () => [nz(-5, 5), nz(-5, 5)],
      ([x, y]) => Math.abs(x) !== Math.abs(y),
    ),
    swap = [y, x],
    sign = coin() ? [-x, y] : [x, -y],
    same = (p, q) => p[0] === q[0] && p[1] === q[1],
    other = until(
      () => [nz(-5, 5), nz(-5, 5)],
      (p) => ![[x, y], swap, sign].some((q) => same(p, q)),
    ),
    letters = pick(['ABCD', 'KLMN', 'PQRS', 'EFGH']),
    pts = shuffle([[x, y], swap, sign, other]),
    name = (p) => letters[pts.findIndex((q) => same(p, q))],
    L = name([x, y]),
    u = 26,
    fig = graph({
      xr: [-6, 6],
      yr: [-6, 6],
      u,
      coords: false,
      pts: pts.map(([px, py], i) => ({ x: px, y: py, label: letters[i] })),
      label: `Assenstelsel met de punten ${[...letters].join(', ').replace(/, (\w)$/, ' en $1')}`,
    }),
    walk = `Vanuit O ga je ${Math.abs(x)} ${links(x)} en ${Math.abs(y)} ${omhoog(y)}.`,
    signMsg =
      'Let op de tekens. Links van de y-as is de x-coördinaat negatief, en onder de x-as is de y-coördinaat negatief.';
  if (coin())
    return {
      q: T(`In de figuur zie je vier punten. Lees de coördinaten van punt ${L} af.`),
      fig,
      fields: pointFields(L, x, y),
      compact: true,
      hint: T(
        'Begin in de {{oorsprong|oorsprong}} O. Tel eerst hoeveel hokjes je naar links of rechts gaat: dat is de x-coördinaat. Tel daarna hoeveel hokjes omhoog of omlaag: dat is de y-coördinaat.',
      ),
      steps: [walk, `Dus ${L}(${x}, ${y}).`],
      traps: [
        { id: 'x-en-y-verwisseld', f: (v) => is(v, swap), m: SWAP },
        {
          id: 'teken-verkeerd',
          f: (v) =>
            !is(v, [x, y]) && Math.abs(v[0]) === Math.abs(x) && Math.abs(v[1]) === Math.abs(y),
          m: signMsg,
        },
        {
          id: 'ander-punt',
          f: (v) => is(v, other),
          m: `Dat zijn de coördinaten van een ander punt. Kijk goed welk punt ${L} heet.`,
        },
      ],
      v: () => same(drawnAt(fig, L, u), [x, y]),
    };
  const opts = [...letters].map((l) => T(l));
  return {
    q: T(`In de figuur zie je vier punten. Welk punt heeft de coördinaten (${x}, ${y})?`),
    fig,
    mc: MC(opts, letters.indexOf(L)),
    hint: T(
      `De eerste coördinaat is x: ga vanuit O ${Math.abs(x)} ${links(x)}. De tweede is y: ga dan ${Math.abs(y)} ${omhoog(y)}.`,
    ),
    steps: [walk, `Daar ligt punt ${L}.`],
    traps: [
      { id: 'x-en-y-verwisseld', f: (v) => v[0] === T(name(swap)), m: SWAP },
      { id: 'teken-verkeerd', f: (v) => v[0] === T(name(sign)), m: signMsg },
    ],
    v: () => same(drawnAt(fig, L, u), [x, y]),
  };
}

// Een punt verschuiven, zonder tekenen: naar links en omlaag haal je eraf, naar rechts en omhoog
// tel je erbij op.
function s31shift() {
  const fromO = coin() && coin(),
    [x0, y0] = fromO ? [0, 0] : [nz(-6, 6), nz(-6, 6)],
    [h, k] = until(
      () => [nz(-7, 7), nz(-7, 7)],
      ([h, k]) => Math.abs(x0 + h) <= 9 && Math.abs(y0 + k) <= 9 && x0 + h !== y0 + k,
    ),
    X = x0 + h,
    Y = y0 + k,
    [S, E] = pick([
      ['A', 'B'],
      ['K', 'L'],
      ['P', 'Q'],
      ['S', 'T'],
    ]),
    moveX = `${Math.abs(h)} ${links(h)}`,
    moveY = `${Math.abs(k)} ${omhoog(k)}`,
    moves = coin() ? `${moveX} en ${moveY}` : `eerst ${moveY} en dan ${moveX}`,
    start = fromO
      ? 'Vanuit de {{oorsprong|oorsprong}} O'
      : `Je begint in ${S}(${x0}, ${y0}). Vanuit ${S}`;
  const op = (a, b) => `${a} ${b < 0 ? '-' : '+'} ${Math.abs(b)} = ${a + b}`;
  return {
    q: T(
      `${start} ga je ${moves}. Zo kom je in punt ${E}. Wat zijn de coördinaten van ${E}? Je hoeft niet te tekenen.`,
    ),
    fields: pointFields(E, X, Y),
    compact: true,
    hint: T(
      'Naar links of rechts verandert de x-coördinaat, omhoog of omlaag de y-coördinaat. Naar rechts en omhoog tel je erbij op, naar links en omlaag haal je eraf.',
    ),
    steps: fromO
      ? [`${moveX}, dus x = ${X}`, `${moveY}, dus y = ${Y}`, `Dus ${E}(${X}, ${Y}).`]
      : [`${moveX}: x = ${op(x0, h)}`, `${moveY}: y = ${op(y0, k)}`, `Dus ${E}(${X}, ${Y}).`],
    traps: [
      { id: 'x-en-y-verwisseld', f: (v) => is(v, [Y, X]), m: SWAP },
      ...(fromO
        ? []
        : [
            {
              id: 'beginpunt-vergeten',
              f: (v) => is(v, [h, k]),
              m: `Je bent vanuit O gegaan, maar je begint in ${S}(${mn(x0)}, ${mn(y0)}). Tel de stappen op bij de coördinaten van ${S}.`,
            },
          ]),
      {
        id: 'links-rechts-verwisseld',
        f: (v) => v[0] === x0 - h,
        m: 'Kijk nog eens naar de x-coördinaat. Naar rechts tel je erbij op, naar links haal je eraf.',
      },
      {
        id: 'omhoog-omlaag-verwisseld',
        f: (v) => v[1] === y0 - k,
        m: 'Kijk nog eens naar de y-coördinaat. Omhoog tel je erbij op, omlaag haal je eraf.',
      },
    ],
    // Terug naar het begin: de afstand en de richting kloppen.
    v: () =>
      Math.abs(X - x0) === Math.abs(h) &&
      Math.abs(Y - y0) === Math.abs(k) &&
      X > x0 === links(h).endsWith('rechts') &&
      Y > y0 === (omhoog(k) === 'omhoog'),
  };
}

// Punten op de x-as en de y-as: op de x-as is y = 0, op de y-as is x = 0.
function s31axes() {
  const onX = coin(),
    as = onX ? 'x-as' : 'y-as';
  if (coin()) {
    const [a, b] = until(
        () => [nz(-9, 9), nz(-9, 9)],
        ([a, b]) => Math.abs(a) !== Math.abs(b),
      ),
      right = onX ? [a, 0] : [0, a],
      wrong = onX ? [0, a] : [a, 0],
      pts = [right, wrong, [a, b], [b, a]],
      opts = pts.map(([p, q]) => T(`(${p}, ${q})`));
    return {
      q: T(`Welk punt ligt op de ${as}?`),
      mc: MC(opts, 0),
      hint: T(`Op de x-as is de y-coördinaat 0. Op de y-as is de x-coördinaat 0.`),
      steps: [
        onX
          ? 'Op de x-as is de y-coördinaat 0, dus het tweede getal is 0.'
          : 'Op de y-as is de x-coördinaat 0, dus het eerste getal is 0.',
        `Dus (${right[0]}, ${right[1]}) ligt op de ${as}.`,
      ],
      traps: [
        {
          id: 'x-as-en-y-as-verwisseld',
          f: (v) => v[0] === opts[1],
          m: onX
            ? 'Dit punt ligt op de y-as. Op de x-as is de y-coördinaat 0, dus het tweede getal is 0.'
            : 'Dit punt ligt op de x-as. Op de y-as is de x-coördinaat 0, dus het eerste getal is 0.',
        },
        {
          id: 'niet-op-een-as',
          f: (v) => v[0] === opts[2] || v[0] === opts[3],
          m: 'Dit punt ligt op geen van de assen. Bij een punt op een as is een van de coördinaten 0.',
        },
      ],
      // Precies één keuze heeft een 0 op de plek van de as, en dat is de goede.
      v: () => {
        const k = onX ? 1 : 0,
          hits = pts.map((p, i) => [p, i]).filter(([p]) => p[k] === 0 && p[1 - k] !== 0);
        return hits.length === 1 && hits[0][1] === 0;
      },
    };
  }
  const n = ri(1, 9),
    neg = coin(),
    L = pick('ABCDEFGHKLMNPRSTUVW'),
    where = onX ? (neg ? 'links van' : 'rechts van') : neg ? 'onder' : 'boven',
    s = neg ? -n : n,
    [X, Y] = onX ? [s, 0] : [0, s];
  return {
    q: T(
      `Punt ${L} ligt op de ${as}, ${n} ${where} de {{oorsprong|oorsprong}} O. Wat zijn de {{coordinaat|coördinaten}} van ${L}?`,
    ),
    fields: pointFields(L, X, Y),
    compact: true,
    hint: T(
      `Op de ${as} is de ${onX ? 'y' : 'x'}-coördinaat 0. ${onX ? 'Links van O is x negatief.' : 'Onder O is y negatief.'}`,
    ),
    steps: [
      `${L} ligt op de ${as}, dus ${onX ? 'y' : 'x'} = 0.`,
      `${n} ${where} O geeft ${onX ? 'x' : 'y'} = ${s}.`,
      `Dus ${L}(${X}, ${Y}).`,
    ],
    traps: [
      {
        id: 'x-en-y-verwisseld',
        f: (v) => is(v, [Y, X]),
        m: onX
          ? 'Dit punt ligt op de y-as. Op de x-as is de y-coördinaat 0, dus het tweede getal is 0.'
          : 'Dit punt ligt op de x-as. Op de y-as is de x-coördinaat 0, dus het eerste getal is 0.',
      },
      {
        id: 'teken-verkeerd',
        f: (v) => is(v, [-X, -Y]),
        m: onX
          ? 'Let op het teken. Links van O is x negatief, rechts van O positief.'
          : 'Let op het teken. Onder O is y negatief, boven O positief.',
      },
    ],
    // Op de as, op afstand n van O, aan de goede kant.
    v: () => (onX ? Y : X) === 0 && Math.abs(X) + Math.abs(Y) === n && X + Y < 0 === neg,
  };
}

// Het ontbrekende hoekpunt van een rechthoek of vierkant met horizontale en verticale zijden.
function s31rect() {
  const square = coin(),
    [w, hh] = until(
      () => {
        const w = ri(2, 7);
        return [w, square ? w : ri(2, 7)];
      },
      ([w, hh]) => square || w !== hh,
    ),
    x1 = ri(-6, 6 - w),
    y1 = ri(-6, 6 - hh),
    // De hoekpunten tegen de klok in, linksonder eerst.
    corners = [
      [x1, y1],
      [x1 + w, y1],
      [x1 + w, y1 + hh],
      [x1, y1 + hh],
    ],
    first = ri(0, 3),
    dir = coin() ? 1 : 3,
    names = pick(['ABCD', 'PQRS', 'KLMN', 'EFGH']),
    // P[i] is het hoekpunt met de i-de letter: zo staan de letters op volgorde rond de figuur.
    P = [0, 1, 2, 3].map((i) => corners[(first + dir * i) % 4]),
    m = pick([0, 1, 2, 3, 3]),
    M = names[m],
    [X, Y] = P[m],
    given = [0, 1, 2, 3].filter((i) => i !== m),
    list = (f) => given.map((i) => f(P[i])),
    and = (a) => `${a.slice(0, -1).join(', ')} en ${a[a.length - 1]}`,
    once = (vals) => vals.find((x) => vals.filter((y) => y === x).length === 1),
    givenText = and(given.map((i) => `${names[i]}(${P[i][0]}, ${P[i][1]})`)),
    letters = and(given.map((i) => names[i])),
    xs = list((p) => p[0]),
    ys = list((p) => p[1]),
    fig = graph({
      xr: [-7, 7],
      yr: [-7, 7],
      u: 20,
      pts: P.map(([x, y], i) => ({ x, y, label: names[i] })),
      extra: (Xp, Yp) =>
        `<path class="l2" d="M${P.map(([x, y]) => `${Xp(x)} ${Yp(y)}`).join('L')}Z"/>`,
      label: `${square ? 'Vierkant' : 'Rechthoek'} ${names} in een assenstelsel`,
    });
  return {
    q: T(
      `${names} is een ${square ? 'vierkant' : 'rechthoek'}. De zijden zijn horizontaal en verticaal. Je weet ${givenText}. Wat zijn de coördinaten van ${M}?`,
    ),
    fields: pointFields(M, X, Y),
    compact: true,
    hint: T(
      `Bij horizontale en verticale zijden komt elke x-coördinaat van de hoekpunten twee keer voor, en elke y-coördinaat ook. Je kunt de punten ook op roosterpapier tekenen.`,
    ),
    steps: [
      'De zijden zijn horizontaal en verticaal. Dan komt elke x-coördinaat twee keer voor, en elke y-coördinaat ook.',
      `De x-coördinaten van ${letters} zijn ${and(xs)}. Alleen ${once(xs)} komt één keer voor, dus ${M} heeft x = ${X}.`,
      `De y-coördinaten zijn ${and(ys)}. Alleen ${once(ys)} komt één keer voor, dus ${M} heeft y = ${Y}.`,
      `Dus ${M}(${X}, ${Y}).`,
      H(fig),
    ],
    traps: [
      { id: 'x-en-y-verwisseld', f: (v) => X !== Y && is(v, [Y, X]), m: SWAP },
      {
        id: 'hoekpunt-al-gegeven',
        f: (v) => given.some((i) => is(v, P[i])),
        m: `Dat is een hoekpunt dat je al weet. ${M} ligt op een andere plek.`,
      },
    ],
    // In een parallellogram is een hoekpunt de som van zijn twee buren min het overstaande punt.
    // Bij een vierkant zijn twee zijden naast elkaar ook even lang.
    v: () => {
      const [a, b, c] = [P[(m + 3) % 4], P[(m + 1) % 4], P[(m + 2) % 4]],
        len = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]);
      return (
        a[0] + b[0] - c[0] === X &&
        a[1] + b[1] - c[1] === Y &&
        (!square || len(P[0], P[1]) === len(P[1], P[2]))
      );
    },
  };
}

// Het kwadrant van een punt, of de tekens van de coördinaten in een kwadrant.
const QUAD = ['Kwadrant I', 'Kwadrant II', 'Kwadrant III', 'Kwadrant IV', 'In geen kwadrant'];
const SIGNS = [
  'x is positief en y is positief',
  'x is negatief en y is positief',
  'x is negatief en y is negatief',
  'x is positief en y is negatief',
];
const SIDE = [
  'rechts van de y-as en boven de x-as',
  'links van de y-as en boven de x-as',
  'links van de y-as en onder de x-as',
  'rechts van de y-as en onder de x-as',
];
const CLOCK =
  'Je nummert de kwadranten tegen de klok in. Rechtsboven is I, linksboven II, linksonder III en rechtsonder IV.';
// Het kwadrant uit de hoek met de positieve x-as: 1 tot en met 4, of 0 op een as.
const byAngle = (x, y) =>
  x * y === 0 ? 0 : (Math.floor((Math.atan2(y, x) + 2 * Math.PI) / (Math.PI / 2)) % 4) + 1;
function s31quadrant() {
  if (coin() && coin()) {
    const k = ri(1, 4),
      L = pick('ABCDEFGHKLMNPRSTUVW'),
      opts = SIGNS.map((s) => T(s));
    return {
      q: TK(
        `Punt ${L} ligt in {{kwadrant|kwadrant}} ${ROMAN[k - 1]}. Wat weet je van de {{coordinaat|coördinaten}} van ${L}?`,
      ),
      mc: MC(opts, k - 1),
      hint: TK(
        'Rechtsboven is {{kwadrant|kwadrant}} I, linksboven II, linksonder III en rechtsonder IV. Links van de y-as is x negatief, onder de x-as is y negatief.',
      ),
      steps: [
        H(TK(`{{kwadrant|Kwadrant}} ${ROMAN[k - 1]} ligt ${SIDE[k - 1]}.`)),
        `Dus ${SIGNS[k - 1]}.`,
      ],
      traps: [
        ...(k % 2 === 0
          ? [{ id: 'kwadrant-met-de-klok-mee', f: (v) => v[0] === opts[5 - k], m: CLOCK }]
          : []),
        {
          id: 'teken-verkeerd',
          f: (v) => v[0] !== opts[k - 1],
          m: `Kwadrant ${ROMAN[k - 1]} ligt ${SIDE[k - 1]}. Links van de y-as is x negatief, en onder de x-as is y negatief.`,
        },
      ],
      // Een punt met deze tekens ligt in kwadrant k.
      v: () => {
        const [sx, sy] = SIGNS[k - 1]
          .match(/positief|negatief/g)
          .map((s) => (s === 'positief' ? 1 : -1));
        return byAngle(3 * sx, 5 * sy) === k;
      },
    };
  }
  const L = pick('ABCDEFGHKLMNPRSTUVW'),
    onAxis = pick([0, 0, 0, 0, 1]),
    [x, y] = onAxis ? (coin() ? [0, nz(-12, 12)] : [nz(-12, 12), 0]) : [nz(-12, 12), nz(-12, 12)],
    k = x > 0 && y > 0 ? 1 : x < 0 && y > 0 ? 2 : x < 0 && y < 0 ? 3 : x > 0 && y < 0 ? 4 : 0,
    word = (c, n, neg, pos) => `${c} = ${n}, dus ${L} ligt ${n < 0 ? neg : pos}.`;
  return {
    q: T(`In welk {{kwadrant|kwadrant}} ligt het punt ${L}(${x}, ${y})?`),
    mc: MC(QUAD, k ? k - 1 : 4),
    hint: TK(
      'Kijk naar de tekens van x en y. Rechtsboven is {{kwadrant|kwadrant}} I, en je nummert tegen de klok in. Een punt op een as ligt in geen kwadrant.',
    ),
    steps: k
      ? [
          word('x', x, 'links van de y-as', 'rechts van de y-as'),
          word('y', y, 'onder de x-as', 'boven de x-as'),
          H(
            TK(
              `${SIDE[k - 1][0].toUpperCase()}${SIDE[k - 1].slice(1)} is {{kwadrant|kwadrant}} ${ROMAN[k - 1]}.`,
            ),
          ),
          H(TK(`Dus ${L} ligt in {{kwadrant|kwadrant}} ${ROMAN[k - 1]}.`)),
        ]
      : [
          `${x ? 'y' : 'x'} = 0, dus ${L} ligt op de ${x ? 'x' : 'y'}-as.`,
          `Een punt op een as ligt in geen {{kwadrant|kwadrant}}.`,
        ],
    traps: k
      ? [
          ...(k % 2 === 0
            ? [{ id: 'kwadrant-met-de-klok-mee', f: (v) => v[0] === QUAD[5 - k], m: CLOCK }]
            : []),
          {
            id: 'niet-op-een-as',
            f: (v) => v[0] === QUAD[4],
            m: 'Geen van de coördinaten is 0, dus het punt ligt niet op een as. Kijk naar de tekens van x en y.',
          },
          {
            id: 'teken-verkeerd',
            f: (v) => v[0] !== QUAD[k - 1],
            m: 'Kijk naar de tekens. Is x negatief, dan ligt het punt links van de y-as. Is y negatief, dan ligt het punt onder de x-as.',
          },
        ]
      : [
          {
            id: 'punt-op-as-in-kwadrant',
            f: (v) => v[0] !== QUAD[4],
            m: 'Een van de coördinaten is 0, dus het punt ligt op een as. De assen horen bij geen kwadrant.',
          },
        ],
    v: () => byAngle(x, y) === k,
  };
}

// Regelmaat: een rij punten met een vaste stap in x en in y. Bereken het volgende of een ver punt.
function s32pattern() {
  const x1 = ri(-6, 6),
    y1 = ri(-6, 6),
    sx = nz(-4, 4),
    sy = nz(-4, 4),
    far = coin() || coin(),
    n = far ? pick([10, 10, 12, 15, 20]) : 5,
    p = (i) => [x1 + (i - 1) * sx, y1 + (i - 1) * sy],
    [X, Y] = p(n),
    shown = [1, 2, 3, 4].map((i) => `P_${i}(${p(i)[0]}, ${p(i)[1]})`),
    change = (s) => `met ${Math.abs(s)} ${s > 0 ? 'toe' : 'af'}`,
    // Van punt i naar punt n, zoals x = 2 + 9*3 = 2 + 27 = 29.
    calc = (c, from, s, i) => {
      const k = n - i,
        add = `${from} ${s < 0 ? '-' : '+'}`;
      return k === 1
        ? `${c} = ${add} ${Math.abs(s)} = ${from + s}`
        : `${c} = ${add} ${k}*${Math.abs(s)} = ${add} ${k * Math.abs(s)} = ${from + k * s}`;
    },
    start = far ? 1 : 4;
  return {
    q: T(
      `De punten ${shown.slice(0, 3).join(', ')} en ${shown[3]} horen bij een rij met een vaste regelmaat. Bereken de coördinaten van ${far ? `P_${n}` : 'het volgende punt P_5'}.`,
    ),
    fields: pointFields(`P_${n}`, X, Y, `P${n}`),
    compact: true,
    hint: T(
      far
        ? `Kijk hoeveel x en y bij elke stap veranderen. Tel daarna hoeveel stappen het zijn van P_1 naar P_${n}.`
        : 'Kijk hoeveel x en y bij elke stap veranderen.',
    ),
    steps: [
      `Van punt naar punt neemt x steeds ${change(sx)} en y steeds ${change(sy)}.`,
      ...(far ? [`Van P_1 naar P_${n} zijn ${n - 1} stappen.`] : []),
      calc('x', p(start)[0], sx, start),
      calc('y', p(start)[1], sy, start),
      `Dus P_${n}(${X}, ${Y}).`,
    ],
    traps: [
      { id: 'x-en-y-verwisseld', f: (v) => X !== Y && is(v, [Y, X]), m: SWAP },
      ...(far
        ? [
            {
              id: 'stappen-een-te-veel',
              f: (v) => is(v, [x1 + n * sx, y1 + n * sy]),
              m: `Van het eerste punt naar punt ${n} zet je ${n - 1} stappen, en niet ${n}.`,
            },
          ]
        : []),
      {
        id: 'stap-verkeerd-teken',
        f: (v) =>
          v[0] === p(start)[0] - (n - start) * sx || v[1] === p(start)[1] - (n - start) * sy,
        m: 'Kijk of x en y steeds groter of kleiner worden. Wordt een coördinaat kleiner, dan haal je de stappen eraf.',
      },
    ],
    // Stap voor stap verder vanaf het eerste punt.
    v: () => {
      let [a, b] = [x1, y1];
      for (let i = 1; i < n; i++) [a, b] = [a + sx, b + sy];
      return a === X && b === Y;
    },
  };
}

// --- 230 Roosterpunten met een voorwaarde (#289) ---

const ROOSTER =
  'Een roosterpunt is een punt waarvan de x-coördinaat en de y-coördinaat allebei hele getallen zijn.';
const TIK = 'Tik op een plek om er een punt te zetten, en nog een keer om het weg te halen.';
// De hele getallen tussen lo en hi, zonder de grenzen zelf.
const tussen = (lo, hi) => Array.from({ length: hi - lo - 1 }, (_, i) => lo + 1 + i);
const rij = (xs) => and(xs.map(String));

// Alle roosterpunten die aan een voorwaarde voldoen: op een verticale of horizontale lijn met de andere
// coördinaat tussen twee grenzen, aan één kant van een as, met dezelfde coördinaat als een gegeven punt, of in
// een rechthoek. De grenzen tellen niet mee. Hoogstens 12 punten.
function s31rooster() {
  const soort = pick(['x', 'y', 'kant', 'zelfde', 'blok', 'blok']),
    G = SOORTEN.roosterpunten;
  // Per as: een vaste waarde, of een open interval [lo, hi] zonder de grenzen.
  let X, Y, cond, geg, uitleg, grensMsg, hoort;
  const lijn = () => {
    const n = ri(4, 9),
      lo = ri(-6, 6 - n);
    return [lo, lo + n];
  };
  if (soort === 'x' || soort === 'y') {
    const c = nz(-5, 5),
      [lo, hi] = lijn(),
      a = soort,
      b = a === 'x' ? 'y' : 'x';
    [X, Y] = a === 'x' ? [c, [lo, hi]] : [[lo, hi], c];
    cond = `${a} = ${c} en ${b} tussen ${lo} en ${hi}`;
    uitleg = [
      `${a} = ${c}: alle punten liggen op de ${a === 'x' ? 'verticale' : 'horizontale'} lijn door (${a === 'x' ? `${c}, 0` : `0, ${c}`}).`,
      `${b} tussen ${lo} en ${hi}: de grenzen ${lo} en ${hi} tellen niet mee. Dus ${b} = ${rij(tussen(lo, hi))}.`,
    ];
    grensMsg = `Tussen ${mn(lo)} en ${mn(hi)} betekent zonder ${mn(lo)} en ${mn(hi)} zelf. Haal de punten met ${b} = ${mn(lo)} en ${b} = ${mn(hi)} weg.`;
    hoort = (p) =>
      p[a === 'x' ? 0 : 1] === c && p[a === 'x' ? 1 : 0] > lo && p[a === 'x' ? 1 : 0] < hi;
  } else if (soort === 'kant') {
    // Aan één kant van een as, tot een grens: onder de x-as met y groter dan −4, enzovoort.
    const kant = pick(['onder', 'boven', 'links', 'rechts']),
      k = ri(3, 6),
      c = nz(-5, 5),
      opX = kant === 'onder' || kant === 'boven',
      neg = kant === 'onder' || kant === 'links',
      [lo, hi] = neg ? [-k, 0] : [0, k],
      a = opX ? 'x' : 'y',
      b = opX ? 'y' : 'x',
      as = opX ? 'x-as' : 'y-as',
      waar = { onder: 'onder', boven: 'boven', links: 'links van', rechts: 'rechts van' }[kant],
      eind = neg ? -k : k;
    [X, Y] = opX ? [c, [lo, hi]] : [[lo, hi], c];
    cond = `${a} = ${c} die ${waar} de ${as} liggen, met ${b} ${neg ? 'groter' : 'kleiner'} dan ${eind}`;
    uitleg = [
      `${a} = ${c}: alle punten liggen op de ${opX ? 'verticale' : 'horizontale'} lijn door (${opX ? `${c}, 0` : `0, ${c}`}).`,
      `${cap(waar)} de ${as} is ${b} ${neg ? 'negatief' : 'positief'}. Een punt op de ${as} zelf, met ${b} = 0, telt niet mee.`,
      `${b} ${neg ? 'groter' : 'kleiner'} dan ${eind}, dus ${eind} telt ook niet mee. Dus ${b} = ${rij(tussen(lo, hi))}.`,
    ];
    grensMsg = `Kijk naar de grenzen. Een punt op de ${as} ligt niet ${waar} de ${as}, en ${b} = ${mn(eind)} is niet ${neg ? 'groter' : 'kleiner'} dan ${mn(eind)}.`;
    hoort = (p) =>
      p[opX ? 0 : 1] === c &&
      (neg ? p[opX ? 1 : 0] < 0 : p[opX ? 1 : 0] > 0) &&
      Math.abs(p[opX ? 1 : 0]) < k;
  } else if (soort === 'zelfde') {
    // Dezelfde x-coördinaat (of y-coördinaat) als een gegeven punt A, dat zelf buiten de grenzen ligt.
    const a = pick(['x', 'y']),
      b = a === 'x' ? 'y' : 'x',
      L = pick(['A', 'K', 'P', 'R']),
      { lo, hi, c, e } = until(
        () => {
          const [lo, hi] = lijn();
          return { lo, hi, c: nz(-5, 5), e: nz(-6, 6) };
        },
        ({ lo, hi, e }) => e < lo || e > hi,
      ),
      pA = a === 'x' ? [c, e] : [e, c];
    geg = [{ p: pA, L }];
    [X, Y] = a === 'x' ? [c, [lo, hi]] : [[lo, hi], c];
    cond = `dezelfde ${a}-coördinaat als punt ${L}(${pA[0]}, ${pA[1]}) en ${b} tussen ${lo} en ${hi}`;
    uitleg = [
      `${L} heeft ${a} = ${c}. De punten liggen dus op de ${a === 'x' ? 'verticale' : 'horizontale'} lijn door ${L}.`,
      `${b} tussen ${lo} en ${hi}: de grenzen ${lo} en ${hi} tellen niet mee. Dus ${b} = ${rij(tussen(lo, hi))}.`,
    ];
    grensMsg = `Tussen ${mn(lo)} en ${mn(hi)} betekent zonder ${mn(lo)} en ${mn(hi)} zelf. Haal de punten met ${b} = ${mn(lo)} en ${b} = ${mn(hi)} weg.`;
    hoort = (p) =>
      p[a === 'x' ? 0 : 1] === pA[a === 'x' ? 0 : 1] &&
      p[a === 'x' ? 1 : 0] > lo &&
      p[a === 'x' ? 1 : 0] < hi;
  } else {
    // Een rechthoek: x tussen twee grenzen en y tussen twee grenzen.
    const [w, h] = until(
        () => [ri(2, 4), ri(2, 4)],
        ([w, h]) => w * h <= 12,
      ),
      x0 = ri(-6, 5 - w),
      y0 = ri(-6, 5 - h);
    X = [x0, x0 + w + 1];
    Y = [y0, y0 + h + 1];
    cond = `x tussen ${X[0]} en ${X[1]} en y tussen ${Y[0]} en ${Y[1]}`;
    uitleg = [
      `x tussen ${X[0]} en ${X[1]}, zonder de grenzen: x = ${rij(tussen(...X))}.`,
      `y tussen ${Y[0]} en ${Y[1]}, zonder de grenzen: y = ${rij(tussen(...Y))}.`,
      `Elke x hoort bij elke y. Dat zijn ${w} · ${h} = ${w * h} punten, in een rechthoek.`,
    ];
    grensMsg =
      'Tussen betekent zonder de grenzen. Een punt op de rand, met x of y gelijk aan een grens, telt niet mee.';
    hoort = (p) => p[0] > X[0] && p[0] < X[1] && p[1] > Y[0] && p[1] < Y[1];
  }
  // De punten, en de punten op de grenzen: wat je krijgt als je de grenzen wel meetelt.
  const waarden = (A, dicht) =>
      typeof A === 'number' ? [A] : dicht ? [A[0], ...tussen(...A), A[1]] : tussen(...A),
    punten = (dicht) => waarden(X, dicht).flatMap((x) => waarden(Y, dicht).map((y) => [x, y])),
    goed = punten(false),
    t = { soort: 'roosterpunten', xr: [-6, 6], yr: [-6, 6], goed, ...(geg ? { geg } : {}) },
    has = (ps, p) => ps.some((q) => is(q, p)),
    grens = punten(true).filter((p) => !has(goed, p) && Math.abs(p[0]) <= 6 && Math.abs(p[1]) <= 6),
    antwoord = G.schrijf(t, goed),
    lees = (v) => G.lees(t, v[0]),
    alle = (v, f) => {
      const L = lees(v);
      return L.length > 0 && L.every(f);
    };
  return {
    q: T(`${ROOSTER} Zet in het assenstelsel alle roosterpunten met ${cond}. ${TIK}`),
    fig: tekenFig(t),
    teken: t,
    fields: [{ teken: true, a: antwoord, label: 'Je punten' }],
    hint: T(
      `Een roosterpunt heeft hele getallen als coördinaten. Tussen twee getallen betekent zonder die getallen zelf: tussen 1 en 4 liggen 2 en 3.`,
    ),
    steps: [
      ...uitleg,
      `Dat zijn ${goed.length} punten: ${and(goed.map(([x, y]) => `(${x}, ${y})`))}.`,
      H(tekenAf(t, antwoord, 'Met de goede punten.')),
    ],
    traps: [
      {
        id: 'x-en-y-verwisseld',
        f: (v) => alle(v, (p) => has(goed, [p[1], p[0]])) && lees(v).some((p) => !has(goed, p)),
        m: 'Je hebt x en y omgewisseld. De x-coördinaat zegt hoe ver je naar links of rechts gaat, de y-coördinaat hoe ver omhoog of omlaag.',
      },
      {
        id: 'grenzen-meegeteld',
        f: (v) =>
          alle(v, (p) => has(goed, p) || has(grens, p)) && lees(v).some((p) => has(grens, p)),
        m: grensMsg,
      },
      ...(geg
        ? [
            {
              id: 'andere-coordinaat-gebruikt',
              f: (v) =>
                alle(v, (p) => p[0] === geg[0].p[0] || p[1] === geg[0].p[1]) &&
                lees(v).some((p) => !has(goed, p)),
              m: `Kijk welke coördinaat hetzelfde moet zijn als bij ${geg[0].L}. Dezelfde x-coördinaat betekent recht boven of onder ${geg[0].L}, dezelfde y-coördinaat recht links of rechts ervan.`,
            },
          ]
        : []),
      {
        id: 'punt-vergeten',
        f: (v) => alle(v, (p) => has(goed, p)) && lees(v).length < goed.length,
        m: `Je bent een punt vergeten. Er horen ${goed.length} punten bij.`,
      },
    ],
    // Loopt alle roosterpunten van het assenstelsel langs en houdt die over die aan de voorwaarde voldoen.
    v: () => {
      const gezet = G.lees(t, antwoord),
        L = [];
      for (let x = -6; x <= 6; x++) for (let y = -6; y <= 6; y++) if (hoort([x, y])) L.push([x, y]);
      return (
        L.length >= 2 &&
        L.length <= 12 &&
        L.length === gezet.length &&
        L.every((p) => has(gezet, p)) &&
        !(geg || []).some((g) => hoort(g.p))
      );
    },
  };
}

// --- 231 Snijpunt van de diagonalen (#289) ---

// Hoeveel je naar links of rechts en omhoog of omlaag gaat, zoals '5 naar rechts en 3 omhoog'.
function stap(dx, dy) {
  const s = (n) => fr(Q(Math.abs(n.n), n.d)),
    delen = [];
  if (dx.n) delen.push(`${s(dx)} ${dx.n < 0 ? 'naar links' : 'naar rechts'}`);
  if (dy.n) delen.push(`${s(dy)} ${omhoog(dy.n)}`);
  return delen.join(' en ');
}
// Een coördinaat plus een stap, zoals x = 3 - {2 1/2} = {1/2}.
const plus = (c, a, s, uit) =>
  `${c} = ${a} ${s.n < 0 ? '-' : '+'} ${fr(Q(Math.abs(s.n), s.d))} = ${fr(uit)}`;
const HEEL = [
  'Ja, want de x-coördinaat en de y-coördinaat van S zijn allebei hele getallen.',
  'Nee, want de x-coördinaat van S is geen heel getal.',
  'Nee, want de y-coördinaat van S is geen heel getal.',
  'Nee, want de x-coördinaat en de y-coördinaat van S zijn allebei geen hele getallen.',
];

// Een vierkant of rechthoek met roosterpunten als hoekpunten. Het snijpunt S van de diagonalen ligt midden op
// een diagonaal. Bereken S, of zeg of S een roosterpunt is.
function s31diagonalen() {
  const scheef = coin(),
    square = scheef || coin(),
    // De hoekpunten tegen de klok in. Een scheef vierkant heeft een zijde van a opzij en b omhoog.
    P = until(
      () => {
        if (scheef) {
          const a = ri(1, 4),
            b = ri(1, 3),
            p = [ri(-6, 6), ri(-6, 6)];
          return [p, [p[0] + a, p[1] + b], [p[0] + a - b, p[1] + a + b], [p[0] - b, p[1] + a]];
        }
        const w = ri(2, 7),
          h = square ? w : ri(2, 7),
          p = [ri(-6, 6), ri(-6, 6)];
        return [p, [p[0] + w, p[1]], [p[0] + w, p[1] + h], [p[0], p[1] + h]];
      },
      (P) =>
        P.every(([x, y]) => Math.abs(x) <= 6 && Math.abs(y) <= 6) &&
        (square || P[1][0] - P[0][0] !== P[3][1] - P[0][1]),
    ),
    names = pick(['ABCD', 'KLMN', 'EFGH']),
    vorm = square ? 'vierkant' : 'rechthoek',
    [A, , C] = P,
    dx = Q(C[0] - A[0], 2),
    dy = Q(C[1] - A[1], 2),
    Sx = Q(A[0] + C[0], 2),
    Sy = Q(A[1] + C[1], 2),
    sx = qv(Sx),
    sy = qv(Sy),
    heel = (q) => q.d === 1,
    k = heel(Sx) ? (heel(Sy) ? 0 : 2) : heel(Sy) ? 1 : 3,
    midX = (P[0][0] + P[2][0]) / 2,
    midY = (P[0][1] + P[2][1]) / 2,
    // De letter staat van het midden af, zodat hij niet op een zijde valt. Op de y-as staat hij rechts en op de
    // x-as boven, want links van de y-as en onder de x-as staan de getallen van de as.
    off = ([x, y]) => [
      x === 0 || x > midX ? 6 : x < midX ? -14 : -4,
      y === 0 || y > midY ? -6 : y < midY ? 16 : 5,
    ],
    hoeken = P.map((p, i) => ({ x: p[0], y: p[1], label: names[i], off: off(p) })),
    rand = (Xp, Yp) =>
      `<path class="l2" d="M${P.map(([x, y]) => `${Xp(x)} ${Yp(y)}`).join('L')}Z"/>`,
    fig = graph({
      xr: [-7, 7],
      yr: [-7, 7],
      u: 20,
      pts: hoeken,
      extra: rand,
      label: `${cap(vorm)} ${names} in een assenstelsel`,
    }),
    figS = graph({
      xr: [-7, 7],
      yr: [-7, 7],
      u: 20,
      pts: [...hoeken, { x: sx, y: sy, label: 'S', off: [6, -7] }],
      extra: (Xp, Yp) =>
        rand(Xp, Yp) +
        `<path class="l1 d" d="M${Xp(P[0][0])} ${Yp(P[0][1])}L${Xp(P[2][0])} ${Yp(P[2][1])}M${Xp(P[1][0])} ${Yp(P[1][1])}L${Xp(P[3][0])} ${Yp(P[3][1])}"/>`,
      label: `${cap(vorm)} ${names} met de diagonalen ${names[0]}${names[2]} en ${names[1]}${names[3]} en hun snijpunt S`,
    }),
    gegeven = `${names} is een ${vorm} met ${and(P.map((p, i) => `${names[i]}(${p[0]}, ${p[1]})`))}. S is het snijpunt van de diagonalen ${names[0]}${names[2]} en ${names[1]}${names[3]}.`,
    reken = [
      `De diagonalen van een ${vorm} snijden elkaar precies in het midden. S ligt dus midden op ${names[0]}${names[2]}.`,
      `Van ${names[0]}(${A[0]}, ${A[1]}) naar ${names[2]}(${C[0]}, ${C[1]}) ga je ${stap(Q(C[0] - A[0]), Q(C[1] - A[1]))}. De helft daarvan is ${stap(dx, dy)}.`,
      ...(dx.n ? [plus('x', A[0], dx, Sx)] : [`x = ${A[0]}`]),
      ...(dy.n ? [plus('y', A[1], dy, Sy)] : [`y = ${A[1]}`]),
      `Dus S(${fr(Sx)}, ${fr(Sy)}).`,
    ],
    // Het snijpunt van de lijnen AC en BD, met de formule voor twee lijnen door twee punten. Zo rekent v niet
    // met het midden. Bij een vierkant zijn de zijden ook even lang en staan ze loodrecht op elkaar.
    v = () => {
      const [p, q, r, s] = P,
        u = [r[0] - p[0], r[1] - p[1]],
        w = [s[0] - q[0], s[1] - q[1]],
        cr = (a, b) => a[0] * b[1] - a[1] * b[0],
        t = cr([q[0] - p[0], q[1] - p[1]], w) / cr(u, w),
        zij = [0, 1, 2, 3].map((i) => [P[(i + 1) % 4][0] - P[i][0], P[(i + 1) % 4][1] - P[i][1]]),
        haaks = zij.every((z, i) => z[0] * zij[(i + 1) % 4][0] + z[1] * zij[(i + 1) % 4][1] === 0),
        len = zij.map((z) => z[0] ** 2 + z[1] ** 2);
      return (
        near(p[0] + t * u[0], sx) &&
        near(p[1] + t * u[1], sy) &&
        haaks &&
        (!square || len.every((l) => l === len[0])) &&
        Number.isInteger(sx) === (k === 0 || k === 2) &&
        Number.isInteger(sy) === (k === 0 || k === 1)
      );
    };
  if (coin()) {
    const vormen = (q) => (heel(q) ? {} : { vorm: 'gemengd' }),
      half = !heel(Sx) || !heel(Sy);
    return {
      q: T(
        `${gegeven} Bereken de coördinaten van S. Is een coördinaat geen heel getal, schrijf die dan als gemengd getal, zoals {2 1/2}.`,
      ),
      fig,
      fields: [
        { ...F('S(', sx, ','), ...vormen(Sx), label: 'x-coördinaat van S' },
        { ...F('', sy, ')'), ...vormen(Sy), label: 'y-coördinaat van S' },
      ],
      compact: true,
      hint: T(
        `De diagonalen snijden elkaar in het midden. Kijk hoeveel je van ${names[0]} naar ${names[2]} opzij en omhoog gaat, en neem daarvan de helft.`,
      ),
      steps: [...reken, H(figS)],
      traps: [
        { id: 'x-en-y-verwisseld', f: (v) => sx !== sy && is(v, [sy, sx]), m: SWAP },
        {
          id: 'beginpunt-vergeten',
          f: (v) => (A[0] !== 0 || A[1] !== 0) && is(v, [qv(dx), qv(dy)]),
          m: `Dat is de halve stap van ${names[0]} naar ${names[2]}. Begin in ${names[0]} en tel de halve stap erbij op.`,
        },
        {
          id: 'hoekpunt',
          f: (v) => P.some((p) => is(v, p)),
          m: `Dat is een hoekpunt. S ligt midden in de ${vorm}, waar de diagonalen elkaar snijden.`,
        },
        ...(half
          ? [
              {
                id: 'half-afgerond',
                f: (v) =>
                  Math.abs(v[0] - sx) <= 0.5 &&
                  Math.abs(v[1] - sy) <= 0.5 &&
                  (Math.abs(v[0] - sx) === 0.5 || Math.abs(v[1] - sy) === 0.5),
                m: 'S ligt hier niet op een roosterpunt, maar precies halverwege twee roosterlijnen. Rond niet af: schrijf de helft als gemengd getal, zoals {2 1/2}.',
              },
            ]
          : []),
      ],
      v,
    };
  }
  const opts = HEEL.map((s) => T(s)),
    swapK = k === 1 ? 2 : k === 2 ? 1 : -1;
  return {
    q: T(`${gegeven} ${ROOSTER} Is S een roosterpunt?`),
    fig,
    mc: MC(opts, k),
    hint: T(
      `Bereken eerst S. De diagonalen snijden elkaar in het midden: neem de helft van de stap van ${names[0]} naar ${names[2]}.`,
    ),
    steps: [
      ...reken,
      k
        ? `${k === 3 ? `x = ${fr(Sx)} en y = ${fr(Sy)} zijn` : k === 1 ? `x = ${fr(Sx)} is` : `y = ${fr(Sy)} is`} geen heel getal, dus S is geen roosterpunt.`
        : 'x en y zijn hele getallen, dus S is een roosterpunt.',
      H(figS),
    ],
    traps: [
      ...(swapK > 0 ? [{ id: 'x-en-y-verwisseld', f: (v) => v[0] === opts[swapK], m: SWAP }] : []),
      {
        id: 'roosterpunt-fout',
        f: (v) => v[0] !== opts[k],
        m: 'Bereken S eerst. Ligt S precies halverwege twee roosterlijnen, dan is die coördinaat geen heel getal en is S geen roosterpunt.',
      },
    ],
    v,
  };
}

export default {
  slug: 'coordinaten-en-assenstelsels',
  title: 'Coördinaten en assenstelsels',
  intro:
    'Met twee getallen geef je precies aan waar een punt in een assenstelsel ligt. Hier leer je punten aflezen en verschuiven, en werk je met de assen, de kwadranten en regelmaat.',
  description:
    'Coördinaten oefenen: punten aflezen en verschuiven, punten op de assen, kwadranten en regelmaat in een assenstelsel. Gratis met uitleg en uitwerkingen.',
  videos: {},
  skills: [
    [127, 'Een punt aflezen', s31read],
    [128, 'Een punt verschuiven', s31shift],
    [129, 'Punten op de assen', s31axes],
    [130, 'Het ontbrekende hoekpunt', s31rect],
    [131, 'Kwadranten', s31quadrant],
    [132, 'Regelmaat in punten', s32pattern],
    [230, 'Roosterpunten tekenen', s31rooster],
    [231, 'Snijpunt van de diagonalen', s31diagonalen],
  ],
  learn: [
    {
      t: 'Het assenstelsel',
      p: [
        T(
          'Een {{=assenstelsel|assenstelsel}} heeft een horizontale x-as en een verticale y-as. Die snijden elkaar in de {{=oorsprong|oorsprong}} O, het punt (0, 0).',
        ),
        T(
          'Een punt schrijf je met een hoofdletter en twee getallen tussen haakjes, de {{=coordinaat|coördinaten}}, zoals P(4, -2). Het eerste getal is de x-coördinaat, het tweede de y-coördinaat.',
        ),
      ],
      ex: {
        q: T('Waar ligt het punt R(-3, 2)?'),
        steps: ['Vanuit O ga je 3 naar links en 2 omhoog.', 'Daar ligt R.'],
      },
      watch: T(
        'Verwissel x en y niet. De punten (2, 5) en (5, 2) liggen op verschillende plekken.',
      ),
    },
    {
      t: 'Punten op de assen',
      p: [
        T(
          'Op de x-as is de y-coördinaat 0, zoals bij (6, 0). Op de y-as is de x-coördinaat 0, zoals bij (0, -4).',
        ),
      ],
    },
    {
      t: 'Een punt verschuiven',
      p: [
        T(
          'Naar rechts tel je bij de x-coördinaat op, naar links haal je eraf. Omhoog tel je bij de y-coördinaat op, omlaag haal je eraf.',
        ),
      ],
      ex: {
        q: T('Je begint in K(1, 4). Je gaat 6 naar links en 5 omlaag. Waar kom je uit?'),
        steps: ['Naar links: x = 1 - 6 = -5', 'Omlaag: y = 4 - 5 = -1', 'Je komt uit in (-5, -1).'],
      },
    },
    {
      t: 'Een rechthoek in een assenstelsel',
      p: [
        T(
          'Zijn de zijden van een rechthoek horizontaal en verticaal, dan komt elke x-coördinaat van de hoekpunten twee keer voor, en elke y-coördinaat ook. Zo vind je een hoekpunt dat ontbreekt.',
        ),
      ],
      ex: {
        q: T(
          'ABCD is een rechthoek met A(-2, 1), B(3, 1) en C(3, 5). Wat zijn de coördinaten van D?',
        ),
        steps: [
          'De x-coördinaten zijn -2, 3 en 3. Dus D heeft x = -2.',
          'De y-coördinaten zijn 1, 1 en 5. Dus D heeft y = 5.',
          'Dus D(-2, 5).',
        ],
      },
    },
    {
      t: 'Roosterpunten',
      p: [
        T(
          'Een roosterpunt is een punt waarvan de x-coördinaat en de y-coördinaat allebei hele getallen zijn, zoals (3, -2). Het punt ({1 1/2}, 2) is geen roosterpunt.',
        ),
        T(
          'Staat er "tussen -1 en 3", dan tellen de grenzen niet mee. Tussen -1 en 3 liggen de hele getallen 0, 1 en 2.',
        ),
      ],
      ex: {
        q: T('Welke roosterpunten hebben x = 2 en y tussen -1 en 3?'),
        steps: ['x = 2, en y = 0, 1 of 2.', 'Dus (2, 0), (2, 1) en (2, 2).'],
      },
      watch: T('Tel de grenzen niet mee: (2, -1) en (2, 3) horen er niet bij.'),
    },
    {
      t: 'Het snijpunt van de diagonalen',
      p: [
        T(
          'De diagonalen van een vierkant of rechthoek snijden elkaar precies in het midden. Het snijpunt ligt dus midden op een diagonaal. Neem de helft van de stap van het ene hoekpunt naar het overstaande hoekpunt.',
        ),
      ],
      ex: {
        q: T(
          'ABCD is een rechthoek met A(1, 1), B(6, 1), C(6, 4) en D(1, 4). Bereken het snijpunt S van de diagonalen.',
        ),
        steps: [
          'Van A naar C ga je 5 naar rechts en 3 omhoog. De helft is {2 1/2} naar rechts en {1 1/2} omhoog.',
          'x = 1 + {2 1/2} = {3 1/2}',
          'y = 1 + {1 1/2} = {2 1/2}',
          'Dus S({3 1/2}, {2 1/2}). S is geen roosterpunt.',
        ],
      },
    },
    {
      t: 'Kwadranten',
      p: [
        TK(
          'De assen verdelen het assenstelsel in vier {{=kwadrant|kwadranten}}. Je nummert ze tegen de klok in: rechtsboven is kwadrant I, linksboven II, linksonder III en rechtsonder IV.',
        ),
        TK(
          'In kwadrant I zijn x en y allebei positief, en in kwadrant III allebei negatief. In II is x negatief, en in IV is y negatief.',
        ),
      ],
      watch: T('Een punt op een as, zoals (0, 3), ligt in geen kwadrant.'),
    },
    {
      t: 'Regelmaat',
      p: [
        T(
          'Bij een rij punten met een vaste regelmaat verandert x bij elke stap met hetzelfde getal, en y ook. Voor een punt ver weg tel je eerst het aantal stappen.',
        ),
      ],
      ex: {
        q: T(
          'De punten P_1(2, 1), P_2(5, 3), P_3(8, 5) en P_4(11, 7) horen bij een rij. Bereken P_10.',
        ),
        steps: [
          'Van punt naar punt neemt x steeds met 3 toe en y steeds met 2 toe.',
          'Van P_1 naar P_10 zijn 9 stappen.',
          'x = 2 + 9*3 = 2 + 27 = 29',
          'y = 1 + 9*2 = 1 + 18 = 19',
          'Dus P_10(29, 19).',
        ],
      },
    },
  ],
};
