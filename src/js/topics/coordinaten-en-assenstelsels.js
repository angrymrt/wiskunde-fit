// Onderwerp: Coördinaten en assenstelsels. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, nz, pick, coin, shuffle, until } from '../math.js';
import { F, H, MC } from './shared.js';
import { graph } from '../figures.js';
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
        'Begin in de oorsprong O. Tel eerst hoeveel hokjes je naar links of rechts gaat: dat is de x-coördinaat. Tel daarna hoeveel hokjes omhoog of omlaag: dat is de y-coördinaat.',
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
    start = fromO ? 'Vanuit de oorsprong O' : `Je begint in ${S}(${x0}, ${y0}). Vanuit ${S}`;
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
      `Punt ${L} ligt op de ${as}, ${n} ${where} de oorsprong O. Wat zijn de coördinaten van ${L}?`,
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
      q: TK(`Punt ${L} ligt in kwadrant ${ROMAN[k - 1]}. Wat weet je van de coördinaten van ${L}?`),
      mc: MC(opts, k - 1),
      hint: TK(
        'Rechtsboven is kwadrant I, linksboven II, linksonder III en rechtsonder IV. Links van de y-as is x negatief, onder de x-as is y negatief.',
      ),
      steps: [H(TK(`Kwadrant ${ROMAN[k - 1]} ligt ${SIDE[k - 1]}.`)), `Dus ${SIGNS[k - 1]}.`],
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
    q: T(`In welk kwadrant ligt het punt ${L}(${x}, ${y})?`),
    mc: MC(QUAD, k ? k - 1 : 4),
    hint: TK(
      'Kijk naar de tekens van x en y. Rechtsboven is kwadrant I, en je nummert tegen de klok in. Een punt op een as ligt in geen kwadrant.',
    ),
    steps: k
      ? [
          word('x', x, 'links van de y-as', 'rechts van de y-as'),
          word('y', y, 'onder de x-as', 'boven de x-as'),
          H(
            TK(
              `${SIDE[k - 1][0].toUpperCase()}${SIDE[k - 1].slice(1)} is kwadrant ${ROMAN[k - 1]}.`,
            ),
          ),
          H(TK(`Dus ${L} ligt in kwadrant ${ROMAN[k - 1]}.`)),
        ]
      : [
          `${x ? 'y' : 'x'} = 0, dus ${L} ligt op de ${x ? 'x' : 'y'}-as.`,
          `Een punt op een as ligt in geen kwadrant.`,
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
