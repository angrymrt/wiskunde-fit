// Onderwerp: Rekenvolgorde. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
// Alleen gehele getallen van 0 en groter: negatieve getallen komen in een later onderwerp. Elke
// tussenuitkomst is heel en niet negatief, en elke deling gaat op.
import { ri, pick, coin, near, until } from '../math.js';
import { F, tekst, narekenen } from './shared.js';
import { T } from '../typeset.js';
import { metBerekening } from '../berekening.js';

// Een berekening is een boom: een getal, of [bewerking, links, rechts], met als bewerking '+', '-',
// '*' of ':'. Als tekst voor T wordt '*' het maalpunt en '-' de aftrekmin.
const PREC = { '+': 1, '-': 1, '*': 2, ':': 2 };
const doe = (op, a, b) => (op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b);
const isBoom = Array.isArray;
const waarde = (t) => (isBoom(t) ? doe(t[0], waarde(t[1]), waarde(t[2])) : t);

// De boom als rij tekens: getallen, bewerkingen en haakjes. Haakjes komen er alleen waar ze nodig
// zijn: om een bewerking met een lagere voorrang, of rechts van een bewerking met dezelfde voorrang,
// zoals in 20 - (8 - 3).
function tekens(t, ouder = null, rechts = false) {
  if (!isBoom(t)) return [t];
  const [op, l, r] = t;
  const binnen = [...tekens(l, op), op, ...tekens(r, op, true)];
  const nodig = ouder && (PREC[op] < PREC[ouder] || (rechts && PREC[op] === PREC[ouder]));
  return nodig ? ['(', ...binnen, ')'] : binnen;
}
// Dezelfde tekst voor een keuzelijst, die geen T krijgt: met het maalpunt en het minteken zelf.
const zichtbaar = (s) => s.replace(/ \* /g, ' · ').replace(/ - /g, ' − ');
const getallen = (t) => (isBoom(t) ? [...getallen(t[1]), ...getallen(t[2])] : [t]);
const knopen = (t) => (isBoom(t) ? [t, ...knopen(t[1]), ...knopen(t[2])] : []);

// Eén stap van de rekenvolgorde: werk binnen de binnenste haakjes (de eerste die sluiten), en doe
// daar eerst het eerste maal- of deelteken, anders het eerste plus- of minteken. Blijft er tussen
// de haakjes één getal over, dan vallen de haakjes weg.
function stap(ts) {
  const sluit = ts.indexOf(')'),
    open = sluit < 0 ? -1 : ts.lastIndexOf('(', sluit),
    lo = open + 1,
    hi = sluit < 0 ? ts.length : sluit;
  const zoek = (ops) => {
    for (let k = lo; k < hi; k++) if (ops.includes(ts[k])) return k;
    return -1;
  };
  let i = zoek('*:');
  if (i < 0) i = zoek('+-');
  const c = doe(ts[i], ts[i - 1], ts[i + 1]);
  if (sluit >= 0 && hi - lo === 3) return [...ts.slice(0, open), c, ...ts.slice(sluit + 1)];
  return [...ts.slice(0, i - 1), c, ...ts.slice(i + 2)];
}
// Alle regels van de uitwerking, tot er één getal over is. Klopt is onwaar als een tussenuitkomst
// geen heel getal van 0 of meer is.
function stappen(ts) {
  const verder = (r) => (r.length > 1 ? [r, ...verder(stap(r))] : [r]);
  const rijen = verder(ts),
    klopt = rijen.every((r) =>
      r.every((x) => typeof x !== 'number' || (Number.isInteger(x) && x >= 0)),
    );
  return { rijen, uitkomst: rijen[rijen.length - 1][0], klopt };
}
// De uitwerking onder elkaar, zoals in het boek: elke regel is de hele berekening opnieuw, met één
// stap uitgerekend. Elke regel eindigt op =, de laatste op = uitkomst.
function uitwerking(rijen) {
  const k = rijen.length - 1;
  return rijen
    .slice(0, k)
    .map((r, i) => (i < k - 1 ? `${tekst(r)} =` : `${tekst(r)} = ${rijen[k][0]}`));
}

// Rekent tekens uit met een andere voorrang of volgorde, voor de valkuilen. prec geeft de voorrang
// per bewerking, en de bewerkingen in rechts reken je van rechts naar links.
function anders(ts, prec = PREC, rechts = '') {
  let p = 0;
  const een = () => {
    const x = ts[p++];
    if (x !== '(') return x;
    const v = rij(0);
    p++;
    return v;
  };
  // Zolang er een bewerking met genoeg voorrang volgt, reken je die erbij.
  const verder = (l, min) => {
    if (p >= ts.length || ts[p] === ')' || !(prec[ts[p]] >= min)) return l;
    const op = ts[p++];
    return verder(doe(op, l, rij(rechts.includes(op) ? prec[op] : prec[op] + 1)), min);
  };
  const rij = (min) => verder(een(), min);
  return rij(0);
}
const ZONDER_HAAKJES = (ts) => ts.filter((x) => x !== '(' && x !== ')');
// De fouten uit het boek, met wat je dan uitrekent. De eerste die past, geeft de melding.
const FOUTEN = [
  {
    id: 'haakjes-genegeerd',
    w: (ts) => (ts.includes('(') ? [anders(ZONDER_HAAKJES(ts))] : []),
    m: 'Wat tussen haakjes staat, reken je eerst uit. Staan er haakjes in haakjes, dan begin je bij de binnenste.',
  },
  {
    id: 'zonder-voorrang',
    w: (ts) => [anders(ts, { '+': 1, '-': 1, '*': 1, ':': 1 })],
    m: 'Je hebt alles van links naar rechts uitgerekend. Vermenigvuldigen en delen gaan voor optellen en aftrekken.',
  },
  {
    id: 'keer-en-delen-niet-van-links-naar-rechts',
    w: (ts) => [anders(ts, PREC, '*:'), anders(ts, { '+': 1, '-': 1, '*': 3, ':': 2 })],
    m: 'Vermenigvuldigen en delen doe je van links naar rechts, in de volgorde waarin ze staan. Keer gaat niet voor delen.',
  },
  {
    id: 'plus-en-min-niet-van-links-naar-rechts',
    w: (ts) => [anders(ts, PREC, '+-'), anders(ts, { '+': 2, '-': 1, '*': 3, ':': 3 })],
    m: 'Optellen en aftrekken doe je van links naar rechts, in de volgorde waarin ze staan. Plus gaat niet voor min.',
  },
];
// De foute uitkomsten per fout bij deze tekens, zonder de goede uitkomst.
const fouteUitkomsten = (ts, goed) =>
  FOUTEN.map((f) => ({
    ...f,
    w: f.w(ts).filter((x) => Number.isFinite(x) && !near(x, goed, 1e-9)),
  })).filter((f) => f.w.length);
// Een valkuil per fout: een van de velden heeft een foute uitkomst van die fout. per[i] is de lijst
// van fouten voor veld i, uit fouteUitkomsten.
function rekenTraps(per) {
  return FOUTEN.map(({ id, m }) => {
    const ws = per.map((fs) => (fs.find((f) => f.id === id) || { w: [] }).w);
    return ws.some((w) => w.length)
      ? {
          id,
          f: (v) => ws.some((w, i) => Number.isFinite(v[i]) && w.some((x) => near(v[i], x, 1e-9))),
          m,
        }
      : null;
  }).filter(Boolean);
}

// Maakt een berekening in de vorm van een boom met 'n' voor een getal, zoals ['+', 'n', ['*', 'n', 'n']].
// Met een doel komt die uitkomst eruit. Delingen gaan zo altijd op. klein geeft kleine getallen,
// voor bij vermenigvuldigen en delen. Lukt het niet, dan staat er een 0 in, en keurt goed() hem af.
function bouw(vorm, doel, klein = false) {
  const vrij = doel === undefined;
  if (vorm === 'n') return vrij ? (klein ? ri(2, 9) : ri(2, 25)) : doel;
  const [op, L, R] = vorm;
  if (op === '+') {
    if (vrij) return [op, bouw(L, undefined, klein), bouw(R, undefined, klein)];
    const r = R === 'n' ? (doel >= 4 ? ri(2, doel - 2) : 0) : bouw(R, undefined, true);
    const vr = waarde(r);
    return [op, bouw(L, vr < doel ? doel - vr : 0), r];
  }
  if (op === '-') {
    const r = bouw(R, undefined, klein || !vrij);
    return [op, bouw(L, waarde(r) + (vrij ? (klein ? ri(1, 9) : ri(2, 30)) : doel)), r];
  }
  if (op === '*') {
    if (vrij) return [op, bouw(L, undefined, true), bouw(R, undefined, true)];
    const delers = [2, 3, 4, 5, 6, 7, 8, 9].filter((k) => doel % k === 0 && doel / k >= 2);
    const k = delers.length ? pick(delers) : 0;
    return [op, bouw(L, k ? doel / k : 0, true), bouw(R, k, true)];
  }
  const r = bouw(R, undefined, true);
  return [op, bouw(L, waarde(r) * (vrij ? ri(2, 9) : doel), true), r];
}
// Een berekening is mooi als elk getal tussen 2 en 120 ligt, elke tussenuitkomst heel is en tussen
// 1 en 200, en er niet met 1 wordt vermenigvuldigd of gedeeld.
function goed(t) {
  if (!getallen(t).every((x) => Number.isInteger(x) && x >= 2 && x <= 120)) return false;
  return knopen(t).every((k) => {
    const v = waarde(k);
    if (!Number.isInteger(v) || v < 1 || v > 200) return false;
    return !'*:'.includes(k[0]) || (waarde(k[1]) > 1 && waarde(k[2]) > 1);
  });
}

const n = 'n';
// Zonder haakjes: rechts van + en - staat een getal of een product, rechts van · en : een getal.
// Elke vorm heeft een fout uit het boek die een andere uitkomst geeft. Bij 4 · 5 + 3 is dat er niet,
// want van links naar rechts geeft daar hetzelfde.
const ZONDER = [
  ['+', n, ['*', n, n]],
  ['-', n, ['*', n, n]],
  ['+', n, [':', n, n]],
  ['-', n, [':', n, n]],
  ['*', [':', n, n], n],
  [':', [':', n, n], n],
  ['+', ['-', n, n], n],
  ['-', ['-', n, n], n],
  ['+', ['*', n, n], ['*', n, n]],
  ['-', ['*', n, n], [':', n, n]],
  ['-', ['+', n, ['*', n, n]], n],
  ['+', ['-', n, n], ['*', n, n]],
  ['+', ['*', [':', n, n], n], n],
  ['+', ['-', n, [':', n, n]], n],
  ['-', ['+', [':', n, n], n], ['*', n, n]],
];
// Met haakjes, ook haakjes in haakjes.
const MET = [
  ['*', n, ['+', n, n]],
  ['*', ['-', n, n], n],
  [':', ['+', n, n], n],
  [':', n, ['-', n, n]],
  ['-', n, ['+', n, n]],
  ['-', n, ['-', n, n]],
  ['*', ['+', n, n], ['-', n, n]],
  ['+', n, ['*', n, ['-', n, n]]],
  ['-', ['*', ['+', n, n], n], n],
  [':', ['-', n, ['*', n, n]], n],
  ['*', n, ['-', n, ['+', n, n]]],
  ['*', ['-', n, ['-', n, n]], n],
  [':', n, ['-', n, ['+', n, n]]],
  ['-', n, ['*', n, ['-', n, ['+', n, n]]]],
  ['*', n, ['+', n, ['*', n, ['-', n, n]]]],
];
// Twee berekeningen met dezelfde getallen die alleen in de haakjes verschillen.
const PAREN = [
  [
    ['*', ['+', n, n], n],
    ['+', n, ['*', n, n]],
  ],
  [
    [':', ['-', n, n], n],
    ['-', n, [':', n, n]],
  ],
  [
    ['-', n, ['-', n, n]],
    ['-', ['-', n, n], n],
  ],
  [
    ['*', n, ['+', n, n]],
    ['+', ['*', n, n], n],
  ],
  [
    [':', n, ['*', n, n]],
    ['*', [':', n, n], n],
  ],
  [
    ['*', ['-', n, n], ['+', n, n]],
    ['+', ['-', n, ['*', n, n]], n],
  ],
  [
    ['-', n, ['+', n, n]],
    ['+', ['-', n, n], n],
  ],
];
// Zet de getallen op volgorde in de vorm.
function vul(vorm, xs) {
  let i = 0;
  const go = (v) => (v === 'n' ? xs[i++] : [v[0], go(v[1]), go(v[2])]);
  return go(vorm);
}

const HINT_ZONDER =
  'Gebruik de {{rekenvolgorde|rekenvolgorde}}. Eerst vermenigvuldigen en delen, van links naar rechts. Daarna optellen en aftrekken, van links naar rechts.';
const HINT_MET =
  'Reken eerst uit wat tussen haakjes staat. Staan er haakjes in haakjes, begin dan bij de binnenste. Daarna gaan vermenigvuldigen en delen voor optellen en aftrekken.';

// Eén berekening uitrekenen. De vorm komt uit vormen; met haakjes moeten die er ook toe doen.
function eenBerekening(vormen, haakjes) {
  // Kies de vorm vóór until, zodat een vorm die vaker wordt afgekeurd niet minder vaak komt.
  const vorm = pick(vormen);
  const t = until(
    () => bouw(vorm),
    (t) => {
      if (!goed(t)) return false;
      const ts = tekens(t),
        fs = fouteUitkomsten(ts, waarde(t));
      return haakjes ? fs.some((f) => f.id === 'haakjes-genegeerd') : fs.length > 0;
    },
  );
  const ts = tekens(t),
    { rijen, uitkomst } = stappen(ts),
    s = tekst(ts);
  return {
    q: T(`Bereken ${s}.`),
    fields: [F('Uitkomst:', uitkomst)],
    hint: T(haakjes ? HINT_MET : HINT_ZONDER),
    steps: uitwerking(rijen),
    traps: rekenTraps([fouteUitkomsten(ts, uitkomst)]),
    // Een eigen ontleder rekent de berekening na, en elke regel van de uitwerking heeft dezelfde uitkomst.
    v: () => narekenen(s) === uitkomst && rijen.every((r) => narekenen(tekst(r)) === uitkomst),
  };
}

// Twee berekeningen die alleen in de haakjes verschillen.
function paar() {
  const [a, b] = until(
    () => {
      const [va, vb] = pick(PAREN),
        a = bouw(va);
      return [a, vul(vb, getallen(a))];
    },
    ([a, b]) => goed(a) && goed(b) && waarde(a) !== waarde(b),
  );
  const ts = [tekens(a), tekens(b)],
    uit = ts.map((t) => stappen(t)),
    ss = ts.map(tekst);
  return {
    q: T(`Bereken ${ss[0]} en ${ss[1]}. Let op: ze verschillen alleen in de haakjes.`),
    fields: [F(`${ss[0]} =`, uit[0].uitkomst), { ...F(`${ss[1]} =`, uit[1].uitkomst), br: true }],
    hint: T(HINT_MET),
    steps: [...uitwerking(uit[0].rijen), ...uitwerking(uit[1].rijen)],
    traps: rekenTraps(ts.map((t, i) => fouteUitkomsten(t, uit[i].uitkomst))),
    v: () => ss.every((s, i) => narekenen(s) === uit[i].uitkomst),
  };
}

// 185: de naam van de uitkomst, en de uitkomst.
const NAAM = { '+': 'de som', '-': 'het verschil', '*': 'het product', ':': 'het quotiënt' };
const NAMEN = ['de som', 'het verschil', 'het product', 'het quotiënt'];
const DELEN = { '+': 'termen', '*': 'factoren' };
const WOORD = {
  '+': '{{som|som}}',
  '-': '{{verschil|verschil}}',
  '*': '{{product|product}}',
  ':': '{{quotient|quotiënt}}',
};
function twee(op, nul) {
  if (op === '+') return [ri(12, 99), ri(12, 99)];
  if (op === '-') {
    const a = ri(25, 99);
    return [a, ri(11, a - 6)];
  }
  if (op === '*') {
    if (nul) return coin() ? [0, ri(12, 99)] : [ri(12, 99), 0];
    return coin() ? [ri(3, 12), ri(3, 15)] : [ri(2, 9) * 10, ri(3, 9)];
  }
  const k = pick([2, 3, 4, 5, 6, 7, 8, 9, 12]),
    q = ri(3, 15);
  return [k * q, k];
}
function bewerkingen() {
  const op = pick(['+', '-', '*', ':']),
    woorden = coin(),
    nul = woorden && op === '*' && ri(0, 4) === 0,
    [a, b] = twee(op, nul),
    s = `${a} ${op} ${b}`,
    c = doe(op, a, b),
    ander = { '+': '*', '*': '+' }[op];
  // Som en product verward: de naam, of de uitkomst van de andere bewerking.
  const verward = ander ? doe(ander, a, b) : null;
  let fields, q;
  if (woorden) {
    q = `Bereken ${NAAM[op].split(' ')[0]} ${WOORD[op]} van ${a} en ${b}.`;
    fields = [F(`${NAAM[op][0].toUpperCase()}${NAAM[op].slice(1)} is`, c)];
  } else {
    const deel = DELEN[op];
    q = deel
      ? `Bekijk ${s}. Hoe heten ${a} en ${b}, en hoe heet de uitkomst? Reken de uitkomst ook uit.`
      : `Bekijk ${s}. Hoe heet de uitkomst? Reken de uitkomst ook uit.`;
    fields = [
      ...(deel
        ? [
            {
              sel: ['termen', 'factoren'],
              a: deel,
              pre: `${a} en ${b} zijn de`,
              label: 'Termen of factoren',
            },
          ]
        : []),
      {
        sel: NAMEN,
        a: NAAM[op],
        pre: 'De uitkomst heet',
        label: 'De naam van de uitkomst',
        br: !!deel,
      },
      { ...F(`${s} =`, c), br: true },
    ];
  }
  const nr = fields.length - 1,
    naamVeld = woorden ? -1 : nr - 1,
    deelVeld = DELEN[op] && !woorden ? 0 : -1;
  const traps = [
    nul && {
      id: 'product-met-nul',
      f: (v) => near(v[nr], a + b),
      m: 'Vermenigvuldig je met 0, dan komt er altijd 0 uit.',
    },
    ander && {
      id: 'som-en-product-verward',
      f: (v) =>
        (naamVeld >= 0 && v[naamVeld] === NAAM[ander]) || (verward !== c && near(v[nr], verward)),
      m: 'Bij een som tel je op, bij een product vermenigvuldig je.',
    },
    (op === '-' || op === ':') &&
      naamVeld >= 0 && {
        id: 'verschil-en-quotient-verward',
        f: (v) => v[naamVeld] === NAAM[op === '-' ? ':' : '-'],
        m: 'Bij een verschil trek je af, bij een quotiënt deel je.',
      },
    deelVeld >= 0 && {
      id: 'termen-en-factoren-verward',
      f: (v) => v[deelVeld] === (op === '+' ? 'factoren' : 'termen'),
      m: 'De getallen die je optelt, heten termen. De getallen die je vermenigvuldigt, heten factoren.',
    },
  ].filter(Boolean);
  return {
    q: T(q),
    fields,
    hint: T(
      'Bij optellen krijg je een som, bij aftrekken een verschil, bij vermenigvuldigen een product en bij delen een quotiënt.',
    ),
    steps: [
      op === ':' ? `${s} = ${c}, want ${c} * ${b} = ${a}` : `${s} = ${c}`,
      `De uitkomst heet ${NAAM[op]}.${DELEN[op] ? ` ${a} en ${b} zijn de ${DELEN[op]}.` : ''}`,
    ],
    traps,
    v: () => narekenen(s) === c && Number.isInteger(c) && c >= 0,
  };
}

// 186: een kort verhaal. Vermenigvuldigen, delen dat opgaat, of delen met een rest waarbij je naar
// boven afrondt (hoeveel heb je nodig) of naar beneden (hoeveel volle of hele).
const NAMEN_P = ['Noor', 'Sem', 'Yara', 'Mees', 'Lieke', 'Bram', 'Amira', 'Teun', 'Floor', 'Ravi'];
const KEER = [
  {
    a: [3, 12],
    b: [8, 12],
    t: (a, b, p) =>
      `Imker ${p} heeft ${a} bijenkasten. In elke kast hangen ${b} ramen. Hoeveel ramen zijn dat samen?`,
    pre: 'Dat zijn',
    post: 'ramen',
  },
  {
    a: [4, 9],
    b: [12, 24],
    t: (a, b) =>
      `Een bakker legt ${b} croissants op een bakplaat. Ze bakt ${a} volle platen. Hoeveel croissants bakt ze?`,
    pre: 'Ze bakt',
    post: 'croissants',
  },
  {
    a: [2, 4],
    b: [11, 18],
    t: (a, b, p) =>
      `De band van ${p} speelt ${a} dagen op een festival, elke dag ${b} nummers. Hoeveel nummers speelt de band in totaal?`,
    pre: 'Dat zijn',
    post: 'nummers',
  },
  {
    a: [6, 15],
    b: [8, 20],
    t: (a, b) =>
      `Een tuinder plant ${a} rijen sla, met ${b} kroppen in elke rij. Hoeveel kroppen sla zijn dat?`,
    pre: 'Dat zijn',
    post: 'kroppen',
  },
];
const DEEL = [
  {
    k: [3, 9],
    q: [12, 40],
    t: (N, k) =>
      `Een kweker verdeelt ${N} tulpenbollen eerlijk over ${k} kratten. Hoeveel bollen gaan er in elk krat?`,
    pre: 'In elk krat gaan',
    post: 'bollen',
  },
  {
    k: [4, 8],
    q: [9, 25],
    t: (N, k, p) =>
      `${p} leest een stripboek van ${N} bladzijden in ${k} avonden, elke avond evenveel. Hoeveel bladzijden zijn dat per avond?`,
    pre: 'Dat zijn',
    post: 'bladzijden per avond',
  },
  {
    k: [3, 6],
    q: [6, 14],
    t: (N, k) =>
      `Een koor van ${N} zangers staat in ${k} rijen, met in elke rij evenveel zangers. Hoeveel zangers staan er in een rij?`,
    pre: 'Er staan',
    post: 'zangers in een rij',
  },
  {
    k: [3, 7],
    q: [18, 45],
    t: (N, k, p) =>
      `${p} fietst een route van ${N} kilometer in ${k} dagen, elke dag even ver. Hoeveel kilometer is dat per dag?`,
    pre: 'Dat is',
    post: 'kilometer per dag',
  },
];
// Delen met een rest, en dan naar boven afronden: voor de rest heb je er nog een nodig.
const OP = [
  {
    k: [6, 12],
    q: [3, 15],
    t: (N, k) =>
      `Een imker heeft ${N} potten honing. In een doos passen ${k} potten. Hoeveel dozen zijn er nodig voor alle potten?`,
    pre: 'Er zijn',
    post: 'dozen nodig',
    rest: (r) =>
      `Voor ${r === 1 ? 'de laatste pot' : `de laatste ${r} potten`} is nog een doos nodig.`,
  },
  {
    k: [4, 8],
    q: [5, 14],
    t: (N, k) =>
      `Bij een quizavond doen ${N} mensen mee. Een team heeft hoogstens ${k} spelers. Hoeveel teams zijn er minstens nodig?`,
    pre: 'Er zijn',
    post: 'teams nodig',
    rest: (r) =>
      `Voor ${r === 1 ? 'de laatste persoon' : `de laatste ${r} mensen`} is nog een team nodig.`,
  },
  {
    k: [4, 8],
    q: [2, 5],
    t: (N, k) =>
      `Een pontje kan ${k} fietsers tegelijk overzetten. Aan de kant wachten ${N} fietsers. Hoeveel ritten met fietsers moet het pontje minstens maken?`,
    pre: 'Het pontje moet',
    post: 'ritten maken',
    rest: (r) =>
      `Voor ${r === 1 ? 'de laatste fietser' : `de laatste ${r} fietsers`} is nog een rit nodig.`,
  },
  {
    k: [4, 9],
    q: [4, 16],
    t: (N, k, p) =>
      `${p} plakt ${N} kaarten in een album. Op een bladzijde passen ${k} kaarten. Hoeveel bladzijden zijn er nodig?`,
    pre: 'Er zijn',
    post: 'bladzijden nodig',
    rest: (r) =>
      `Voor ${r === 1 ? 'de laatste kaart' : `de laatste ${r} kaarten`} is nog een bladzijde nodig.`,
  },
];
// Delen met een rest, en dan naar beneden afronden: de rest is niet genoeg voor nog een hele.
const NEER = [
  {
    k: [3, 6],
    q: [4, 15],
    t: (N, k) =>
      `Een bakker heeft ${N} eieren. Voor één taart zijn ${k} eieren nodig. Hoeveel taarten kan de bakker bakken?`,
    pre: 'Dat zijn',
    post: 'taarten',
    rest: (r) =>
      `Met ${r === 1 ? 'het laatste ei' : `de laatste ${r} eieren`} kun je geen hele taart meer bakken.`,
  },
  {
    k: [14, 22],
    q: [3, 9],
    t: (N, k, p) =>
      `${p} heeft ${N} centimeter touw. Voor één armband is ${k} centimeter nodig. Hoeveel armbanden kan ${p} maken?`,
    pre: 'Dat zijn',
    post: 'armbanden',
    rest: (r) => `Van de rest van ${r} centimeter kun je geen hele armband meer maken.`,
  },
  {
    k: [6, 12],
    q: [5, 18],
    t: (N, k) =>
      `Een teler heeft ${N} aardbeien en vult bakjes met elk ${k} aardbeien. Hoeveel volle bakjes krijgt de teler?`,
    pre: 'Dat zijn',
    post: 'volle bakjes',
    rest: (r) =>
      `${r === 1 ? 'De laatste aardbei is' : `De laatste ${r} aardbeien zijn`} niet genoeg voor nog een vol bakje.`,
  },
  {
    k: [28, 36],
    q: [3, 8],
    t: (N, k) =>
      `Een fietsenmaker heeft ${N} spaken. Voor één wiel zijn ${k} spaken nodig. Hoeveel wielen kan de fietsenmaker helemaal afmaken?`,
    pre: 'Dat zijn',
    post: 'wielen',
    rest: (r) =>
      `Met ${r === 1 ? 'de laatste spaak' : `de laatste ${r} spaken`} kun je geen heel wiel meer maken.`,
  },
];
function verhaal() {
  const soort = pick(['keer', 'deel', 'op', 'neer']),
    p = pick(NAMEN_P),
    keer = soort === 'keer';
  let s, ans, steps, check, anderAntwoord;
  if (keer) {
    s = pick(KEER);
    const a = ri(...s.a),
      b = ri(...s.b);
    ans = a * b;
    steps = [`${a} * ${b} = ${ans}`];
    s = { ...s, q: s.t(a, b, p) };
    anderAntwoord = null;
    // Controle met een deling: het antwoord gedeeld door het ene getal geeft het andere.
    check = () => ans / b === a;
  } else {
    s = pick(soort === 'deel' ? DEEL : soort === 'op' ? OP : NEER);
    const k = ri(...s.k),
      q = ri(...s.q),
      r = soort === 'deel' ? 0 : ri(1, k - 1),
      N = k * q + r;
    s = { ...s, q: s.t(N, k, p) };
    anderAntwoord = soort === 'op' ? q : soort === 'neer' ? q + 1 : N * k;
    if (soort === 'deel') {
      ans = q;
      steps = [`${N} : ${k} = ${q}, want ${q} * ${k} = ${N}`];
      check = () => ans * k === N;
    } else {
      ans = soort === 'op' ? q + 1 : q;
      steps = [
        `${N} : ${k} = ${q} rest ${r}, want ${q} * ${k} = ${q * k} en ${N} - ${q * k} = ${r}`,
        s.rest(r),
      ];
      // Naar boven: net te weinig met één minder. Naar beneden: net te veel met één meer.
      check = () =>
        soort === 'op' ? (ans - 1) * k < N && ans * k >= N : ans * k <= N && (ans + 1) * k > N;
    }
  }
  const bew = keer ? 'vermenigvuldigen' : 'delen';
  const traps = [
    {
      id: 'keer-en-delen-verward',
      f: (v) =>
        v[0] === (keer ? 'delen' : 'vermenigvuldigen') ||
        (soort === 'deel' && near(v[1], anderAntwoord)),
      m: keer
        ? 'Er zijn een aantal groepen die even groot zijn. Hoeveel is dat samen? Dan vermenigvuldig je.'
        : 'Je verdeelt een totaal in gelijke delen. Dan deel je.',
    },
    (soort === 'op' || soort === 'neer') && {
      id: 'verkeerde-kant-afgerond',
      f: (v) => near(v[1], anderAntwoord),
      m:
        soort === 'op'
          ? 'Je hebt naar beneden afgerond. Maar ook voor de rest heb je er nog een nodig.'
          : 'Je hebt naar boven afgerond. Maar de rest is niet genoeg voor nog een hele.',
    },
  ].filter(Boolean);
  return {
    q: T(`${s.q} Moet je vermenigvuldigen of delen? Reken het ook uit.`),
    fields: [
      {
        sel: ['vermenigvuldigen', 'delen'],
        a: bew,
        pre: 'Je moet',
        label: 'Vermenigvuldigen of delen',
      },
      { ...F(s.pre, ans, s.post), br: true },
    ],
    hint: keer
      ? 'Zijn er een aantal groepen die even groot zijn, en wil je weten hoeveel het samen is? Dan vermenigvuldig je.'
      : soort === 'deel'
        ? 'Verdeel je een totaal in gelijke delen? Dan deel je. Controleer de deling met een vermenigvuldiging.'
        : 'Verdeel je een totaal in gelijke delen? Dan deel je. Blijft er een rest over, lees dan goed of je naar boven of naar beneden moet afronden.',
    steps: [...steps, `${s.pre} ${ans} ${s.post}.`],
    traps,
    v: check,
  };
}

// 189: het ontbrekende getal. De puntjes staan op de plek van één getal; je rekent terug.
const PUNTJES = '…';
function ontbrekend() {
  const vorm = pick(coin() ? ZONDER : MET);
  const [t, plek] = until(
    () => {
      const t = bouw(vorm);
      return [t, ri(0, getallen(t).length - 1)];
    },
    ([t, plek]) => {
      if (!goed(t)) return false;
      // Wat naast het pad naar de puntjes staat, is een getal of één bewerking.
      const pad = (k, i) => {
        if (!isBoom(k)) return true;
        const nl = getallen(k[1]).length,
          links = i < nl;
        return (
          knopen(links ? k[2] : k[1]).length <= 1 && pad(links ? k[1] : k[2], links ? i : i - nl)
        );
      };
      return pad(t, plek);
    },
  );
  const x = getallen(t)[plek],
    r = waarde(t);
  let teller = -1;
  const leeg = (b) =>
    isBoom(b) ? [b[0], leeg(b[1]), leeg(b[2])] : ++teller === plek ? PUNTJES : b;
  const gat = leeg(t),
    s = tekst(tekens(gat));
  // Terugrekenen langs het pad van boven naar beneden.
  const terug = (k, doel) => {
    if (!isBoom(k)) return [];
    const [op, L, R] = k,
      links = tekens(L).includes(PUNTJES),
      naast = links ? R : L,
      vn = waarde(naast),
      deel = links ? L : R;
    let nieuw, som;
    if (op === '+') [som, nieuw] = [`${doel} - ${vn}`, doel - vn];
    else if (op === '-')
      [som, nieuw] = links ? [`${doel} + ${vn}`, doel + vn] : [`${vn} - ${doel}`, vn - doel];
    else if (op === '*') [som, nieuw] = [`${doel} : ${vn}`, doel / vn];
    else [som, nieuw] = links ? [`${doel} * ${vn}`, doel * vn] : [`${vn} : ${doel}`, vn / doel];
    return [
      ...(isBoom(naast) ? [`Reken eerst uit: ${tekst(tekens(naast))} = ${vn}`] : []),
      `${tekst(tekens(deel))} = ${som} = ${nieuw}`,
      ...terug(deel, nieuw),
    ];
  };
  const steps = [`${s} = ${r}`, ...terug(gat, r)];
  const ts = tekens(gat);
  const met = (y) => ts.map((z) => (z === PUNTJES ? y : z));
  // De fouten: welk getal maakt de berekening kloppend als je hem verkeerd uitrekent?
  const kandidaten = Array.from({ length: 301 }, (_, i) => i);
  const traps = FOUTEN.map(({ id, w, m }) => {
    const ws = kandidaten.filter(
      (y) => y !== x && w(met(y)).some((z) => near(z, r, 1e-9)) && !near(anders(met(y)), r, 1e-9),
    );
    return ws.length ? { id, f: (v) => ws.some((y) => near(v[0], y, 1e-9)), m } : null;
  }).filter(Boolean);
  const vul = (y) => s.replace(PUNTJES, String(y));
  return {
    q: T(`Welk getal moet op de puntjes staan, zodat de berekening klopt? ${s} = ${r}`),
    fields: [F('Op de puntjes staat', x)],
    hint: T(
      'Reken terug. Kijk welke bewerking je volgens de {{rekenvolgorde|rekenvolgorde}} als laatste doet, en draai die om. Ga zo verder tot je bij de puntjes bent.',
    ),
    steps: [...steps, `Controle: ${vul(x)} = ${r}`],
    traps,
    // Een eigen ontleder zoekt alle gehele getallen tot 300 die kloppen: dat is er precies één.
    v: () => kandidaten.filter((y) => narekenen(vul(y)) === r).join() === String(x),
  };
}

const GETAL = { 3: 'Drie', 4: 'Vier', 5: 'Vijf', 6: 'Zes' };
// 190: een verhaal als één berekening. Een keuzelijst met berekeningen, en de uitkomst.
const PLEKKEN = [
  ['Een sterrenwacht', 'Voor de rondleiding in de koepel betaalt de groep samen nog'],
  ['Een klimhal', 'Voor de les van een instructeur betaalt de groep samen nog'],
  ['Een pottenbakkerij', 'Voor het bakken in de oven betaalt de groep samen nog'],
];
const DELERS = [
  [
    'vrienden',
    (a, m, p) => `huren samen een tent van ${a} euro en ${m} luchtbedden van ${p} euro per stuk.`,
  ],
  [
    'buren',
    (a, m, p) =>
      `kopen samen een kuub tuinaarde van ${a} euro en ${m} zakken bloembollen van ${p} euro per zak.`,
  ],
  [
    'teamgenoten',
    (a, m, p) =>
      `kopen samen voor hun trainer een cadeau van ${a} euro en ${m} kaarten van ${p} euro per stuk.`,
  ],
];
const LESSEN = [
  ['een kookworkshop', 'de ingrediënten', 'het schoonmaken van de keuken'],
  ['een cursus kaarsen gieten', 'het materiaal', 'het huren van de ruimte'],
  ['een dag zeilles', 'het zwemvest', 'de koffie en thee voor de hele groep'],
];
function verhaalBerekening() {
  const soort = ri(0, 2);
  let story, goedS, fout, ans, zin;
  if (soort === 0) {
    const [plek, extra] = pick(PLEKKEN);
    const [v1, k1, v2, k2, t] = until(
      () => [ri(2, 5), ri(8, 15), ri(2, 7), ri(4, 9), ri(5, 25)],
      ([v1, k1, v2, k2]) => k1 > k2 && v1 !== v2,
    );
    story = `${plek} vraagt ${k1} euro per volwassene en ${k2} euro per kind. Er komt een groep van ${v1} volwassenen en ${v2} kinderen. ${extra} ${t} euro. Hoeveel euro betaalt de groep samen?`;
    goedS = `${v1} * ${k1} + ${v2} * ${k2} + ${t}`;
    fout = [
      [`(${v1} + ${v2}) * (${k1} + ${k2}) + ${t}`, 'groepen-samengenomen'],
      [`${v1} * (${k1} + ${t}) + ${v2} * (${k2} + ${t})`, 'toeslag-per-persoon'],
    ];
    ans = v1 * k1 + v2 * k2 + t;
    zin = `De groep betaalt samen ${ans} euro.`;
  } else if (soort === 1) {
    const [wie, wat] = pick(DELERS);
    const [m, k, p, a] = until(
      () => {
        const m = ri(2, 6),
          k = ri(3, 6),
          p = ri(2, 5);
        return [m, k, p, ri(3, 12) * k - m * p];
      },
      ([, , , a]) => a >= 10,
    );
    story = `${GETAL[k]} ${wie} ${wat(a, m, p)} Ze delen de kosten eerlijk. Hoeveel euro betaalt ieder?`;
    goedS = `(${a} + ${m} * ${p}) : ${k}`;
    fout = [
      [`${a} + ${m} * ${p} : ${k}`, 'haakjes-vergeten'],
      [`(${a} + ${m}) * ${p} : ${k}`, 'verkeerde-haakjes'],
    ];
    ans = (a + m * p) / k;
    zin = `Ieder betaalt ${ans} euro.`;
  } else {
    const [les, spul, extra] = pick(LESSEN);
    const m = ri(4, 12),
      p1 = ri(15, 35),
      p2 = ri(3, 9),
      t = ri(10, 30);
    story = `Bij ${les} betaalt elke deelnemer ${p1} euro voor de les en ${p2} euro voor ${spul}. Er doen ${m} mensen mee. Voor ${extra} betaalt de groep samen nog ${t} euro. Hoeveel euro betaalt de groep samen?`;
    goedS = `${m} * (${p1} + ${p2}) + ${t}`;
    fout = [
      [`${m} * ${p1} + ${p2} + ${t}`, 'haakjes-vergeten'],
      [`${m} * (${p1} + ${p2} + ${t})`, 'toeslag-per-persoon'],
    ];
    ans = m * (p1 + p2) + t;
    zin = `De groep betaalt samen ${ans} euro.`;
  }
  const opties = [goedS, ...fout.map(([s]) => s)].map(zichtbaar).sort();
  const ts = goedS.match(/\d+|[-+*:()]/g).map((x) => (/\d/.test(x) ? Number(x) : x));
  const { rijen } = stappen(ts);
  const BERICHT = {
    'groepen-samengenomen':
      'Reken elke groep apart uit: het aantal keer de prijs. Tel daarna alles bij elkaar op.',
    'toeslag-per-persoon':
      'Het vaste bedrag betaalt de groep één keer samen, en niet elke persoon. Tel het dus één keer op.',
    'haakjes-vergeten':
      soort === 1
        ? 'Je deelt het hele bedrag door het aantal mensen. Zet dat bedrag tussen haakjes.'
        : 'Elke deelnemer betaalt beide bedragen. Zet ze tussen haakjes en vermenigvuldig dan met het aantal deelnemers.',
    'verkeerde-haakjes':
      'Kijk welke getallen bij elkaar horen: het aantal dingen keer de prijs per stuk.',
  };
  const traps = fout.map(([s, id]) => {
    const w = narekenen(s);
    return {
      id,
      f: (v) => v[0] === zichtbaar(s) || (Number.isFinite(w) && w !== ans && near(v[1], w, 1e-9)),
      m: BERICHT[id],
    };
  });
  return {
    q: T(`${story} Welke berekening hoort erbij? Reken hem ook uit.`),
    fields: [
      { sel: opties, a: zichtbaar(goedS), pre: 'De berekening is', label: 'De berekening' },
      { ...F('Uitkomst:', ans, 'euro'), br: true },
    ],
    hint: T(
      'Schrijf alles in één berekening. Een aantal keer een prijs hoort bij elkaar. Zet haakjes om wat je eerst samen moet nemen.',
    ),
    steps: [`De berekening is ${goedS}.`, ...uitwerking(rijen), zin],
    traps,
    v: () => narekenen(goedS) === ans && Number.isInteger(ans),
  };
}

const s187 = () => eenBerekening(ZONDER, false);
const s188 = () => (ri(0, 2) === 0 ? paar() : eenBerekening(MET, true));

// Een getallenrij voortzetten (#262): vijf getallen met een regelmaat, en de leerling geeft de
// volgende twee. De regel is telkens hetzelfde erbij of eraf, telkens keer of gedeeld door
// hetzelfde getal, een verschil dat telkens 1 of 2 groter wordt, of om en om iets erbij en iets eraf.
// Alle getallen zijn heel en niet negatief.
const RIJEN = {
  plus: () => {
    const s = ri(1, 30),
      k = ri(2, 15);
    return (i) => s + i * k;
  },
  min: () => {
    const k = ri(3, 12),
      s = 6 * k + ri(0, 40);
    return (i) => s - i * k;
  },
  keer: () => {
    const k = pick([2, 3]),
      s = ri(1, 5);
    return (i) => s * k ** i;
  },
  delen: () => {
    const k = pick([2, 3]),
      s = ri(1, 4) * k ** 6;
    return (i) => s / k ** i;
  },
  groeiend: () => {
    const s = ri(1, 20),
      d = ri(1, 6),
      st = pick([1, 2]);
    return (i) => s + i * d + (st * i * (i - 1)) / 2;
  },
  afwisselend: () => {
    const s = ri(1, 20),
      a = ri(3, 12),
      b = ri(1, a - 1);
    return (i) => s + Math.ceil(i / 2) * a - Math.floor(i / 2) * b;
  },
};
const verschilTekst = (x) => (x < 0 ? `-${-x}` : `+${x}`);
function getallenrij() {
  const { soort, rij } = until(
    () => {
      const soort = pick(Object.keys(RIJEN)),
        f = RIJEN[soort]();
      return { soort, rij: [0, 1, 2, 3, 4, 5, 6].map(f) };
    },
    ({ rij }) => rij.every((x) => Number.isInteger(x) && x >= 0) && Math.max(...rij) <= 3000,
  );
  const [x6, x7] = rij.slice(5),
    toon = rij.slice(0, 5),
    vs = rij.slice(1).map((x, i) => x - rij[i]),
    lijstV = (xs) =>
      `${xs.slice(0, -1).map(verschilTekst).join(', ')} en ${verschilTekst(xs[xs.length - 1])}`,
    k = rij[1] / rij[0],
    q = rij[0] / rij[1];
  const uitleg = {
    plus: [`De verschillen zijn ${lijstV(vs.slice(0, 4))}. Je telt er telkens ${vs[0]} bij op.`],
    min: [`De verschillen zijn ${lijstV(vs.slice(0, 4))}. Je haalt er telkens ${-vs[0]} af.`],
    keer: [
      `Elk getal is ${k} keer het getal ervoor: ${toon[0]} * ${k} = ${toon[1]}, ${toon[1]} * ${k} = ${toon[2]}, enzovoort.`,
    ],
    delen: [
      `Elk getal is het getal ervoor gedeeld door ${q}: ${toon[0]} : ${q} = ${toon[1]}, ${toon[1]} : ${q} = ${toon[2]}, enzovoort.`,
    ],
    groeiend: [
      `De verschillen zijn ${lijstV(vs.slice(0, 4))}. Het verschil wordt telkens ${vs[1] - vs[0]} groter.`,
      `De volgende verschillen zijn dus ${verschilTekst(vs[4])} en ${verschilTekst(vs[5])}.`,
    ],
    afwisselend: [
      `De verschillen zijn ${lijstV(vs.slice(0, 4))}. Je telt er om en om ${vs[0]} bij op en haalt er ${-vs[1]} af.`,
    ],
  }[soort];
  const stap = (a, b) => {
    if (soort === 'keer') return `${a} * ${k} = ${b}`;
    if (soort === 'delen') return `${a} : ${q} = ${b}`;
    return b >= a ? `${a} + ${b - a} = ${b}` : `${a} - ${a - b} = ${b}`;
  };
  // De fout bij het volgende getal: de laatste stap nog een keer doen, of bij keer en delen het
  // laatste verschil nog een keer optellen.
  const fout = rij[4] + vs[3],
    bericht = {
      keer: 'Het verschil tussen twee getallen is niet steeds hetzelfde. Kijk of je steeds met hetzelfde getal vermenigvuldigt.',
      delen:
        'Het verschil tussen twee getallen is niet steeds hetzelfde. Kijk of je steeds door hetzelfde getal deelt.',
      groeiend:
        'Het verschil blijft niet gelijk. Kijk hoe het verschil van stap tot stap verandert.',
      afwisselend: 'Je doet niet telkens dezelfde stap. Kijk welke stap na de laatste stap komt.',
    }[soort];
  return {
    q: T(
      `Dit is het begin van een rij getallen met een regelmaat: ${toon.join(', ')}, ... Wat zijn de volgende twee getallen van de rij?`,
    ),
    fields: [F('Het volgende getal is', x6), F('Het getal daarna is', x7)],
    hint: 'Kijk wat er van het ene getal naar het volgende gebeurt. Is dat steeds hetzelfde, of verandert het met een regelmaat?',
    steps: [...uitleg, stap(rij[4], x6), stap(x6, x7)],
    traps:
      bericht && fout !== x6
        ? [{ id: 'verkeerde-regel', f: (v) => v[0] === fout, m: bericht }]
        : [],
    // Rekent na of de hele rij, met de twee antwoorden erbij, één regel volgt: de verschillen of de
    // verhoudingen zijn gelijk, de verschillen van de verschillen zijn gelijk, of de verschillen
    // wisselen om en om.
    v: () => {
      const r = [...toon, x6, x7],
        d = r.slice(1).map((x, i) => x - r[i]),
        dd = d.slice(1).map((x, i) => x - d[i]),
        alle = (xs) => xs.every((x) => x === xs[0]);
      if (soort === 'plus' || soort === 'min') return alle(d) && d[0] !== 0;
      if (soort === 'keer' || soort === 'delen')
        return alle(r.slice(1).map((x, i) => x / r[i])) && r[1] !== r[0];
      if (soort === 'groeiend') return alle(dd) && dd[0] > 0;
      return d.every((x, i) => i < 2 || x === d[i - 2]) && d[0] > 0 && d[1] < 0;
    },
  };
}

// --- 221 Haakjes zetten (#262) ---
// Een berekening met één paar haakjes uit MET. Zonder haakjes geeft ze een andere uitkomst, dus de
// haakjes zijn echt nodig. Ook zonder haakjes is de uitkomst heel en niet negatief, want die staat in
// de uitwerking. De leerling typt de hele berekening. Elke plek van de haakjes die de
// uitkomst geeft, is goed: answers.js rekent de getypte berekening na (berekeningKlopt).
const EEN_PAAR = MET.filter(
  (v) => tekens(vul(v, [2, 3, 4, 5, 6])).filter((x) => x === '(').length === 1,
);
function haakjesZetten() {
  const vorm = pick(EEN_PAAR);
  const t = until(
    () => bouw(vorm),
    (t) => {
      if (!goed(t)) return false;
      const zonder = anders(ZONDER_HAAKJES(tekens(t)));
      return Number.isInteger(zonder) && zonder >= 0 && zonder !== waarde(t);
    },
  );
  const ts = tekens(t),
    kaal = ZONDER_HAAKJES(ts),
    { rijen, uitkomst } = stappen(ts),
    s = tekst(ts);
  return metBerekening({
    q: T(
      `Zet haakjes in ${tekst(kaal)}, zodat de uitkomst ${uitkomst} is. Typ de hele berekening, met de haakjes erin.`,
    ),
    fields: [
      {
        pre: 'Berekening:',
        label: 'Je berekening met haakjes',
        a: s,
        berekening: {
          getallen: kaal.filter((x) => typeof x === 'number'),
          tekens: kaal.filter((x) => typeof x === 'string'),
          uitkomst,
        },
      },
    ],
    hint: 'Wat tussen haakjes staat, reken je eerst uit. Zet de haakjes om een plus of min, en reken na of de uitkomst klopt. Klopt hij niet, probeer dan een andere plek.',
    steps: [
      `Zonder haakjes is ${tekst(kaal)} = ${narekenen(tekst(kaal))}. Dat is niet ${uitkomst}, dus er moeten haakjes bij.`,
      `Met haakjes om ${tekst(ts.slice(ts.indexOf('(') + 1, ts.indexOf(')')))} reken je dat eerst uit:`,
      ...uitwerking(rijen),
    ],
    // Een eigen ontleder rekent de berekening met haakjes na, en zonder haakjes is de uitkomst anders.
    v: () =>
      narekenen(s) === uitkomst &&
      narekenen(tekst(kaal)) !== uitkomst &&
      s.replace(/[()]/g, '').replace(/ +/g, ' ').trim() === tekst(kaal),
  });
}

export default {
  slug: 'rekenvolgorde',
  title: 'Rekenvolgorde',
  intro:
    'Staan er meer bewerkingen in een berekening, dan zegt de rekenvolgorde wat je eerst uitrekent. Hier leer je de namen som, verschil, product en quotiënt, reken je met en zonder haakjes, en schrijf je een verhaal als één berekening.',
  description:
    'Rekenvolgorde oefenen: som, verschil, product en quotiënt, haakjes, delen met een rest en een verhaal als één berekening. Gratis met uitleg en hints.',
  videos: {},
  skills: [
    [185, 'Som, verschil, product en quotiënt', bewerkingen],
    [186, 'Vermenigvuldigen of delen in een verhaal', verhaal],
    [187, 'Rekenvolgorde zonder haakjes', s187],
    [188, 'Rekenvolgorde met haakjes', s188],
    [189, 'Het ontbrekende getal', ontbrekend],
    [190, 'Een verhaal als één berekening', verhaalBerekening],
    [220, 'Een getallenrij voortzetten', getallenrij],
    [221, 'Haakjes zetten', haakjesZetten],
  ],
  learn: [
    {
      t: 'Som, verschil, product en quotiënt',
      p: [
        'Tel je op, dan heet de uitkomst de {{=som|som}}. De getallen die je optelt, zijn de termen. Trek je af, dan heet de uitkomst het {{=verschil|verschil}}.',
        'Vermenigvuldig je, dan heet de uitkomst het {{=product|product}}. De getallen die je vermenigvuldigt, zijn de factoren. Deel je, dan heet de uitkomst het {{=quotient|quotiënt}}.',
        'Vermenigvuldigen schrijf je met een punt: 4 * 6. Delen schrijf je met een dubbele punt: 24 : 6. Een deling controleer je met een vermenigvuldiging.',
      ],
      ex: {
        q: T('Bereken het quotiënt van 84 en 7.'),
        steps: ['84 : 7 = 12, want 12 * 7 = 84'],
      },
    },
    {
      t: 'Delen met een rest',
      p: [
        'Gaat een deling niet precies op, dan blijft er een rest over. Lees in het verhaal of je dan naar boven of naar beneden afrondt.',
      ],
      ex: {
        q: T(
          'Een kweker heeft 50 plantjes. In een bak passen 6 plantjes. Hoeveel bakken heeft de kweker nodig?',
        ),
        steps: [
          '50 : 6 = 8 rest 2, want 8 * 6 = 48 en 50 - 48 = 2',
          'Voor de laatste 2 plantjes is nog een bak nodig.',
          'De kweker heeft 9 bakken nodig.',
        ],
      },
      ex2: {
        q: T(
          'Je hebt 50 centimeter lint. Voor een strik is 6 centimeter nodig. Hoeveel strikken kun je maken?',
        ),
        steps: [
          '50 : 6 = 8 rest 2',
          'Van de rest van 2 centimeter kun je geen hele strik meer maken.',
          'Je kunt 8 strikken maken.',
        ],
      },
      watch:
        'Vraagt het verhaal hoeveel je nodig hebt, dan telt de rest ook mee en rond je naar boven af. Vraagt het hoeveel volle of hele je krijgt, dan rond je naar beneden af.',
    },
    {
      t: 'De rekenvolgorde',
      p: [
        'Staan er meer bewerkingen in een berekening, dan zegt de {{=rekenvolgorde|rekenvolgorde}} wat je eerst doet:',
        '1. Werk binnen de haakjes. Staan er haakjes in haakjes, begin dan bij de binnenste.',
        '2. Vermenigvuldig en deel, van links naar rechts.',
        '3. Tel op en trek af, van links naar rechts.',
        'Schrijf de berekening onder elkaar. Reken op elke regel één stap uit, en schrijf de rest van de berekening opnieuw op.',
      ],
      ex: {
        q: T('Bereken 20 - 12 : 4 * 2.'),
        steps: ['20 - 12 : 4 * 2 =', '20 - 3 * 2 =', '20 - 6 = 14'],
      },
      ex2: {
        q: T('Bereken 3 * (14 - (2 + 5)).'),
        steps: ['3 * (14 - (2 + 5)) =', '3 * (14 - 7) =', '3 * 7 = 21'],
      },
      watch:
        'Vermenigvuldigen gaat niet voor delen, en optellen gaat niet voor aftrekken. Die doe je van links naar rechts: 15 − 5 + 3 = 10 + 3 = 13.',
    },
    {
      t: 'Het ontbrekende getal',
      p: [
        'Ontbreekt er een getal, dan reken je terug. Kijk welke bewerking je volgens de rekenvolgorde als laatste doet, en draai die om. Een plus wordt een min, en een keer wordt een gedeeld door.',
      ],
      ex: {
        q: T('Welk getal moet op de puntjes staan? 6 * … + 4 = 34'),
        steps: [
          '6 * … + 4 = 34',
          '6 * … = 34 - 4 = 30',
          '… = 30 : 6 = 5',
          'Controle: 6 * 5 + 4 = 34',
        ],
      },
    },
    {
      t: 'Een verhaal als één berekening',
      p: [
        'De stappen van een verhaal kun je in één berekening schrijven. Zet haakjes om wat je eerst samen moet nemen.',
      ],
      ex: {
        q: T(
          'Drie vrienden kopen samen een spel van 25 euro en 4 batterijen van 2 euro. Ze delen de kosten eerlijk. Hoeveel betaalt ieder?',
        ),
        steps: ['(25 + 4 * 2) : 3 =', '(25 + 8) : 3 =', '33 : 3 = 11', 'Ieder betaalt 11 euro.'],
      },
    },
  ],
};
