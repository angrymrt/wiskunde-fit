// Onderwerp: Vermenigvuldigen en delen met negatieve getallen. Vraaggeneratoren staan bovenaan, de
// uitleg en de lijst met vraagsoorten onderaan.
// De tekenregels bij keer en delen, lange producten, de rekenvolgorde met de aftrekmin en de
// negatieve min, en een ontbrekende factor of deler. Een negatief getal staat zonder haakjes, zoals
// in het boek: 4 * -3 en 12 : -4. Haakjes staan alleen om een deelberekening. Alleen gehele
// getallen, elke deling gaat op en je deelt nooit door 0.
import { ri, pick, coin, shuffle, near, until } from '../math.js';
import { F, tekst, narekenen } from './shared.js';
import { T } from '../typeset.js';

// Een berekening is een rij tekens: getallen (ook negatief), '-', '*', ':', '(' en ')'. tekst en
// narekenen staan in shared.js.
// Een getal of berekening zoals je het leest, voor een melding: met − en ·.
const zw = (s) => String(s).replace(/-/g, '−').replace(/\*/g, '·');
const doe = (x, op, y) => (op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : x / y);
const zegTeken = (x) => (x > 0 ? 'positief' : 'negatief');
const metTeken = (x) => (coin() ? -x : x);

// Een valkuil per fout, als een van de velden een foute uitkomst van die fout heeft. per[i] is een
// lijst [id, foute waarde] voor veld i, zonder de goede waarde. De volgorde van ids is de volgorde
// waarin de valkuilen staan: de eerste die past, geeft de melding.
function veldTraps(per, ids, bericht) {
  return ids
    .map((id) => {
      const ws = per.map((fs) => fs.filter(([j]) => j === id).map(([, w]) => w));
      return ws.some((w) => w.length)
        ? {
            id,
            f: (v) => ws.some((w, i) => Number.isFinite(v[i]) && w.some((x) => near(v[i], x))),
            m: bericht[id],
          }
        : null;
    })
    .filter(Boolean);
}
// Haalt de goede waarde en dubbele waarden weg, en waarden die geen getal zijn.
const zonderGoed = (fs, goed) =>
  fs.filter(
    ([id, w], k) =>
      Number.isFinite(w) &&
      !near(w, goed) &&
      fs.findIndex(([j, x]) => j === id && near(x, w)) === k,
  );

// --- 206 Vermenigvuldigen ---

// De soorten producten. Elke soort geeft de factoren.
const PRODUCTEN = {
  pn: () => [ri(2, 10), -ri(2, 10)],
  np: () => [-ri(2, 10), ri(2, 10)],
  nn: () => [-ri(2, 10), -ri(2, 10)],
  nul: () => shuffle([0, -ri(2, 12)]),
  een: () => {
    const e = pick([1, -1]);
    return shuffle([e, e === 1 ? -ri(2, 12) : metTeken(ri(2, 12))]);
  },
  // Drie factoren met een, twee of drie negatieve.
  drie: () =>
    until(
      () => {
        const m = ri(1, 3);
        return shuffle([0, 1, 2].map((i) => (i < m ? -1 : 1))).map((s) => s * ri(2, 6));
      },
      (fs) => Math.abs(fs[0] * fs[1] * fs[2]) <= 100,
    ),
};
// + 0 maakt van −0 gewoon 0.
const product = (fs) => fs.reduce((p, x) => p * x, 1) + 0;
// Het product volgens de tekenregels: de getallen zonder minteken vermenigvuldigen, en het teken uit
// het aantal mintekens. Los van gewoon vermenigvuldigen, voor de controle v.
function metTekenregel(fs) {
  if (fs.includes(0)) return 0;
  const zonder = fs.reduce((p, x) => p * Math.abs(x), 1);
  return fs.filter((x) => x < 0).length % 2 ? -zonder : zonder;
}
function keerZin(fs) {
  const c = product(fs),
    s = tekst(fs.flatMap((x, i) => (i ? ['*', x] : [x])));
  if (fs.length === 3) return `${s} = ${fs[0] * fs[1]} * ${fs[2]} = ${c}`;
  const [a, b] = fs;
  if (a === 0 || b === 0) return `${s} = 0, want keer 0 is altijd 0.`;
  if (a === 1 || b === 1) return `${s} = ${c}, want 1 keer een getal is dat getal zelf.`;
  if (a === -1 || b === -1)
    return `${s} = ${c}, want -1 keer een getal geeft het getal met het andere teken.`;
  return `${s} = ${c}, want ${zegTeken(a)} keer ${zegTeken(b)} is ${zegTeken(c)}.`;
}
// De foute uitkomsten van een product, als [id, waarde].
function fouteProducten(fs) {
  const c = product(fs),
    m = fs.filter((x) => x < 0).length;
  if (c === 0) return [['product-met-nul', fs.find((x) => x !== 0)]];
  if (c > 0) return [['min-keer-min-is-min', -c]];
  return [[m >= 3 ? 'mintekens-verkeerd-geteld' : 'minteken-vergeten', -c]];
}
const BERICHT_KEER = {
  'product-met-nul':
    'Keer 0 is altijd 0, ook bij een negatief getal. Neem je 0 een aantal keer, dan heb je nog steeds 0.',
  'min-keer-min-is-min':
    'Bij vermenigvuldigen is negatief keer negatief positief: −3 · −4 = 12. Twee mintekens samen geven een plus.',
  'minteken-vergeten':
    'Positief keer negatief is negatief, en negatief keer positief ook. Vergeet het minteken niet.',
  'mintekens-verkeerd-geteld':
    'Tel de mintekens nog eens. Twee mintekens samen geven een plus. Blijft er één minteken over, dan is de uitkomst negatief.',
};

function vermenigvuldigen() {
  // Drie factoren komt vaker, want daar is meer te oefenen.
  const soorten = shuffle(['pn', 'np', 'nn', 'nn', 'nul', 'een', 'drie', 'drie']);
  const twee = [soorten[0], soorten.slice(1).find((k) => k !== soorten[0])];
  const producten = twee.map((k) => PRODUCTEN[k]());
  const ss = producten.map((fs) => tekst(fs.flatMap((x, i) => (i ? ['*', x] : [x]))));
  const fields = producten.map((fs, i) => ({ ...F(`${ss[i]} =`, product(fs)), br: i > 0 }));
  return {
    q: T('Bereken.'),
    fields,
    hint: T(
      'Positief keer negatief is negatief, en negatief keer negatief is positief. Keer 0 is altijd 0. Heb je drie factoren, reken dan van links naar rechts.',
    ),
    steps: producten.map(keerZin),
    traps: veldTraps(
      producten.map((fs) => zonderGoed(fouteProducten(fs), product(fs))),
      Object.keys(BERICHT_KEER),
      BERICHT_KEER,
    ),
    // Een eigen ontleder rekent de tekst na, en de tekenregels geven hetzelfde.
    v: () =>
      producten.every(
        (fs, i) => narekenen(ss[i]) === fields[i].a && metTekenregel(fs) === fields[i].a,
      ),
  };
}

// --- 207 Positief of negatief ---

const KEUZES = ['positief', 'negatief', '0'];
function positiefOfNegatief() {
  const k = ri(4, 7),
    nul = ri(0, 4) === 0,
    positief = coin();
  // Het aantal negatieve factoren: even als de uitkomst positief is, minstens 1 en minstens 2 bij
  // positief. Met een 0 erbij mag het elk aantal zijn.
  const mogelijk = Array.from({ length: k }, (_, i) => i + 1).filter(
    (m) => nul || (positief ? m % 2 === 0 : m % 2 === 1),
  );
  const m = pick(mogelijk);
  const fs = shuffle(Array.from({ length: k }, (_, i) => i < m)).map((neg) =>
    neg ? -ri(2, 20) : ri(2, 20),
  );
  // Bij een 0 vervangt die een positieve factor, of anders de laatste.
  if (nul) {
    const plek = fs.findIndex((x) => x > 0);
    fs[plek < 0 ? k - 1 : plek] = 0;
  }
  const negs = fs.filter((x) => x < 0),
    a = nul ? '0' : negs.length % 2 ? 'negatief' : 'positief';
  const s = tekst(fs.flatMap((x, i) => (i ? ['*', x] : [x])));
  const steps = nul
    ? [`Er staat een 0 tussen de factoren. Keer 0 is altijd 0, dus de uitkomst is 0.`]
    : [
        negs.length === 1
          ? `Er is één negatieve factor: ${negs[0]}.`
          : `Tel de negatieve factoren: ${negs.slice(0, -1).join(', ')} en ${negs[negs.length - 1]}. Dat zijn er ${negs.length}.`,
        'Twee mintekens samen geven een plus. Bij een even aantal mintekens is de uitkomst dus positief, en bij een oneven aantal negatief.',
        `${negs.length} is ${negs.length % 2 ? 'oneven' : 'even'}, dus de uitkomst is ${a}.`,
      ];
  const anders = a === 'positief' ? 'negatief' : 'positief';
  return {
    q: T(`Is de uitkomst van ${s} positief, negatief of 0? Je hoeft het niet uit te rekenen.`),
    fields: [
      {
        sel: KEUZES,
        a,
        pre: 'De uitkomst is',
        label: 'De uitkomst is positief, negatief of 0',
      },
    ],
    hint: T(
      'Kijk eerst of er een 0 bij de factoren staat. Tel anders de mintekens: twee mintekens samen geven een plus.',
    ),
    steps,
    traps: nul
      ? [
          {
            id: 'nul-vergeten',
            f: (v) => v[0] === 'positief' || v[0] === 'negatief',
            m: 'Er staat een 0 tussen de factoren. Keer 0 is altijd 0, wat de andere getallen ook zijn.',
          },
        ]
      : [
          {
            id: 'mintekens-verkeerd-geteld',
            f: (v) => v[0] === anders,
            m: 'Tel de mintekens nog eens. Twee mintekens samen geven een plus. Blijft er één minteken over, dan is de uitkomst negatief.',
          },
        ],
    // Rekent het product echt uit en kijkt naar het teken.
    v: () => {
      const p = fs.reduce((x, y) => x * y, 1);
      return a === (p === 0 ? '0' : p > 0 ? 'positief' : 'negatief');
    },
  };
}

// --- 208 Delen ---

// De soorten delingen, als [deeltal, deler]. De deling gaat altijd op.
const deling = (q, b) => [q * b, b];
const quotient = ([a, b]) => a / b + 0;
const DELINGEN = {
  np: () => deling(-ri(2, 12), ri(2, 10)),
  pn: () => deling(-ri(2, 12), -ri(2, 10)),
  nn: () => deling(ri(2, 12), -ri(2, 10)),
  nul: () => [0, metTeken(ri(2, 12))],
  // Delen door -1, of door hetzelfde getal met of zonder minteken.
  een: () =>
    coin()
      ? deling(metTeken(ri(2, 15)), -1)
      : until(
          () => deling(pick([1, -1]), metTeken(ri(2, 15))),
          ([a, b]) => a < 0 || b < 0,
        ),
};
function fouteDelingen([a, b]) {
  const q = quotient([a, b]);
  if (a === 0)
    return [
      ['nul-gedeeld-door-getal', b],
      ['nul-gedeeld-door-getal', -b],
    ];
  if (q > 0) return [['min-gedeeld-door-min-is-min', -q]];
  return [['minteken-vergeten', -q]];
}
const BERICHT_DELEN = {
  'nul-gedeeld-door-getal':
    '0 gedeeld door een getal is altijd 0. Controleer met keer: 0 keer elk getal is 0.',
  'min-gedeeld-door-min-is-min':
    'Bij delen is negatief gedeeld door negatief positief, net als bij vermenigvuldigen. Controleer met keer.',
  'minteken-vergeten':
    'Delen gaat met dezelfde tekenregels als vermenigvuldigen. Positief gedeeld door negatief is negatief, en negatief gedeeld door positief ook.',
};

function delen() {
  const soorten = shuffle(['np', 'pn', 'nn', 'nn', 'nul', 'een']);
  const twee = [soorten[0], soorten.slice(1).find((k) => k !== soorten[0])];
  const delingen = twee.map((k) => DELINGEN[k]());
  const ss = delingen.map(([a, b]) => tekst([a, ':', b]));
  const fields = delingen.map(([a, b], i) => ({ ...F(`${ss[i]} =`, quotient([a, b])), br: i > 0 }));
  return {
    q: T('Bereken.'),
    fields,
    hint: T(
      'Bij delen gelden dezelfde tekenregels als bij vermenigvuldigen. Controleer je antwoord met een vermenigvuldiging.',
    ),
    steps: delingen.map(
      ([a, b], i) => `${ss[i]} = ${quotient([a, b])}, want ${quotient([a, b])} * ${b} = ${a}`,
    ),
    traps: veldTraps(
      delingen.map((d) => zonderGoed(fouteDelingen(d), quotient(d))),
      Object.keys(BERICHT_DELEN),
      BERICHT_DELEN,
    ),
    // Een eigen ontleder rekent de tekst na, en de controle met keer klopt.
    v: () =>
      delingen.every(
        ([a, b], i) => narekenen(ss[i]) === fields[i].a && fields[i].a * b === a && b !== 0,
      ),
  };
}

// --- 209 Rekenvolgorde ---

// Welke bewerking je nu uitrekent: binnen de binnenste haakjes (de eerste die sluiten) eerst het
// eerste maal- of deelteken, en anders het eerste min- of plusteken. Zonder voorrang gewoon de
// eerste van links.
function welke(ts, voorrang = true) {
  const sluit = ts.indexOf(')'),
    lo = sluit < 0 ? 0 : ts.lastIndexOf('(', sluit) + 1,
    hi = sluit < 0 ? ts.length : sluit;
  const zoek = (ops) => {
    for (let k = lo; k < hi; k++) if (typeof ts[k] === 'string' && ops.includes(ts[k])) return k;
    return -1;
  };
  const i = voorrang ? zoek('*:') : -1;
  return { i: i < 0 ? zoek('+-*:') : i, lo, hi, sluit };
}
// Eén stap: reken die bewerking uit. Blijft er tussen de haakjes één getal over, dan vallen de
// haakjes weg.
function stap(ts, reken = doe, voorrang = true) {
  const { i, lo, hi, sluit } = welke(ts, voorrang);
  const c = reken(ts[i - 1], ts[i], ts[i + 1]);
  if (sluit >= 0 && hi - lo === 3) return [...ts.slice(0, lo - 1), c, ...ts.slice(sluit + 1)];
  return [...ts.slice(0, i - 1), c, ...ts.slice(i + 2)];
}
const rijen = (ts, reken = doe, voorrang = true) =>
  ts.length > 1 ? [ts, ...rijen(stap(ts, reken, voorrang), reken, voorrang)] : [ts];
const uitkomst = (ts, reken = doe, voorrang = true) => rijen(ts, reken, voorrang).pop()[0];
// De bewerkingen die je na elkaar uitrekent, als [x, bewerking, y].
const bewerkingen = (ts) =>
  rijen(ts)
    .slice(0, -1)
    .map((r) => {
      const { i } = welke(r);
      return [r[i - 1], r[i], r[i + 1]];
    });
// De uitwerking onder elkaar: elke regel is de hele berekening opnieuw, met één stap uitgerekend.
// Elke regel eindigt op =, de laatste op = uitkomst.
function uitwerking(ts) {
  const rs = rijen(ts),
    k = rs.length - 1;
  return rs.slice(0, k).map((r, i) => (i < k - 1 ? `${tekst(r)} =` : `${tekst(r)} = ${rs[k][0]}`));
}

// De fouten uit het boek, met wat je dan uitrekent. De eerste die past, geeft de melding.
const fout = (wanneer, anders) => (x, op, y) => (wanneer(x, op, y) ? anders(x, y) : doe(x, op, y));
const FOUTEN = [
  {
    id: 'haakjes-genegeerd',
    w: (ts) => (ts.includes('(') ? uitkomst(ts.filter((x) => x !== '(' && x !== ')')) : NaN),
  },
  { id: 'zonder-voorrang', w: (ts) => uitkomst(ts, doe, false) },
  {
    id: 'min-keer-min-is-min',
    w: (ts) =>
      uitkomst(
        ts,
        fout(
          (x, op, y) => op === '*' && x < 0 && y < 0,
          (x, y) => -(x * y),
        ),
      ),
  },
  {
    id: 'min-gedeeld-door-min-is-min',
    w: (ts) =>
      uitkomst(
        ts,
        fout(
          (x, op, y) => op === ':' && x < 0 && y < 0,
          (x, y) => -(x / y),
        ),
      ),
  },
  {
    id: 'min-min-als-min',
    w: (ts) =>
      uitkomst(
        ts,
        fout(
          (x, op, y) => op === '-' && y < 0,
          (x, y) => x + y,
        ),
      ),
  },
  {
    id: 'keerregel-bij-aftrekken',
    w: (ts) =>
      uitkomst(
        ts,
        fout(
          (x, op, y) => op === '-' && x < 0 && y > 0,
          (x, y) => -x + y,
        ),
      ),
  },
  {
    id: 'negatief-min-getal-als-verschil',
    w: (ts) =>
      uitkomst(
        ts,
        fout(
          (x, op, y) => op === '-' && x < 0 && y > 0,
          (x, y) => x + y,
        ),
      ),
  },
  { id: 'minteken-vergeten', w: (ts) => -uitkomst(ts) },
];
const fouteUitkomsten = (ts) =>
  zonderGoed(
    FOUTEN.map(({ id, w }) => [id, w(ts)]),
    uitkomst(ts),
  );
// Staat er een aftrekmin vlak voor een vermenigvuldiging of deling, zoals in 7 - 4 * -5 of
// 7 - (2 - 6) * 3? Dan geeft de melding bij zonder-voorrang die vermenigvuldiging als voorbeeld.
// Een getal of iets tussen haakjes is één deel; eind geeft de plek net erachter.
const eind = (ts, k) => {
  if (ts[k] !== '(') return k + 1;
  const dicht = (j, diep) =>
    ts[j] === '('
      ? dicht(j + 1, diep + 1)
      : ts[j] === ')'
        ? diep === 1
          ? j + 1
          : dicht(j + 1, diep - 1)
        : dicht(j + 1, diep);
  return dicht(k, 0);
};
function aftrekminVoorKeer(ts) {
  for (let k = 0; k < ts.length; k++) {
    if (ts[k] !== '-' || k === 0) continue;
    const e = eind(ts, k + 1);
    if (ts[e] === '*' || ts[e] === ':') return ts.slice(k + 1, eind(ts, e + 1));
  }
  return null;
}
function berichten(ts) {
  const keer = aftrekminVoorKeer(ts);
  return {
    'haakjes-genegeerd': 'Wat tussen haakjes staat, reken je eerst uit.',
    'zonder-voorrang': `Je hebt van links naar rechts gerekend. Vermenigvuldigen en delen gaan voor aftrekken.${keer ? ` Reken dus eerst ${zw(tekst(keer))} uit. De aftrekmin ervoor zegt alleen dat je die uitkomst straks aftrekt.` : ''}`,
    'min-keer-min-is-min':
      'Negatief keer negatief is positief: −3 · −4 = 12. Twee mintekens samen geven een plus.',
    'min-gedeeld-door-min-is-min':
      'Negatief gedeeld door negatief is positief, net als bij vermenigvuldigen.',
    'min-min-als-min':
      'Min een negatief getal is hetzelfde als plus: 5 − −2 = 5 + 2. Twee mintekens naast elkaar worden een plus.',
    'keerregel-bij-aftrekken':
      'Min keer min is plus geldt bij vermenigvuldigen en delen, niet bij aftrekken. Trek je iets af van een negatief getal, dan ga je nog verder naar links: −5 − 3 = −8.',
    'negatief-min-getal-als-verschil':
      'Trek je iets af van een negatief getal, dan ga je nog verder naar links, verder van 0 af. Zo is −6 − 4 = −10 en niet −2.',
    'minteken-vergeten':
      'Kijk nog eens naar het teken van je antwoord. Tel de mintekens bij elke stap goed.',
  };
}

// De vormen met 'n' voor een getal en 'd' voor een deeltal: dat is een veelvoud van de deler erna,
// zodat de deling opgaat.
const n = 'n',
  d = 'd';
const VORMEN = [
  [n, '-', n, '*', n],
  [n, '*', n, '-', n],
  [n, '-', d, ':', n],
  [d, ':', n, '-', n],
  [n, '-', '(', n, '-', n, ')', '*', n],
  ['(', n, '-', n, ')', '*', n],
  [n, '*', '(', n, '-', n, ')'],
  ['(', n, '-', n, ')', ':', n],
  [n, '-', n, '*', n, '-', n],
  [n, '*', n, '-', n, '*', n],
  [n, '-', n, '*', '(', n, '-', n, ')'],
];
function vul(vorm) {
  const ts = vorm.map((x) => (x === n || x === d ? metTeken(ri(2, 12)) : x));
  return ts.map((x, i) => (vorm[i] === d ? metTeken(ri(2, 9)) * ts[i + 2] : x));
}
// Een berekening is mooi als elke deling opgaat, elk getal in de uitwerking niet 0 is en niet
// groter dan 120, de uitkomst niet groter is dan 100, er bij keer of delen een negatief getal staat,
// en er minstens twee fouten zijn die een ander antwoord geven.
function mooi(ts) {
  const getallen = rijen(ts)
    .flat()
    .filter((x) => typeof x === 'number');
  return (
    getallen.every((x) => Number.isInteger(x) && x !== 0 && Math.abs(x) <= 120) &&
    Math.abs(uitkomst(ts)) <= 100 &&
    bewerkingen(ts).some(([x, op, y]) => (op === '*' || op === ':') && (x < 0 || y < 0)) &&
    fouteUitkomsten(ts).length > 1
  );
}

function rekenvolgordeNegatief() {
  let berekeningen, steps;
  if (ri(0, 3) === 0) {
    // Aftrekken en vermenigvuldigen met dezelfde getallen naast elkaar.
    const [a, b] = until(
      () => [-ri(2, 12), ri(2, 12)],
      ([a, b]) => -a !== b,
    );
    berekeningen = [
      [a, '-', b],
      [a, '-', -b],
      [a, '*', -b],
    ];
    steps = [
      `${a} - ${b} = ${a - b}, want vanaf ${a} ga je nog ${b} naar links.`,
      `${a} - ${-b} = ${a} + ${b} = ${a + b}`,
      `${a} * ${-b} = ${a * -b}, want negatief keer negatief is positief.`,
    ];
  } else {
    const vorm = pick(VORMEN);
    berekeningen = [until(() => vul(vorm), mooi)];
    steps = uitwerking(berekeningen[0]);
  }
  const ss = berekeningen.map(tekst),
    een = berekeningen.length === 1;
  const fields = berekeningen.map((ts, i) => ({
    ...F(een ? 'Uitkomst:' : `${ss[i]} =`, uitkomst(ts)),
    br: i > 0,
  }));
  return {
    q: T(
      een
        ? `Bereken ${ss[0]}.`
        : 'Bereken. Let op het verschil tussen de {{aftrekmin|aftrekmin}} en de {{negatieve-min|negatieve min}}.',
    ),
    fields,
    hint: T(
      'Reken eerst uit wat tussen haakjes staat. Dan vermenigvuldigen en delen, en daarna aftrekken, steeds van links naar rechts. Min een negatief getal is plus, en negatief keer negatief is positief.',
    ),
    steps,
    traps: veldTraps(
      berekeningen.map(fouteUitkomsten),
      FOUTEN.map((f) => f.id),
      // De berichten van de eerste berekening met een aftrekmin voor keer, anders van de eerste.
      berichten(berekeningen.find(aftrekminVoorKeer) || berekeningen[0]),
    ),
    // Een eigen ontleder rekent de berekening na, en elke regel van de uitwerking heeft dezelfde
    // uitkomst.
    v: () =>
      berekeningen.every(
        (ts, i) =>
          narekenen(ss[i]) === fields[i].a &&
          rijen(ts).every((r) => narekenen(tekst(r)) === fields[i].a),
      ),
  };
}

// --- 210 De ontbrekende factor of deler ---

const PUNTJES = '…';
// p · r = P. De vorm zegt welk getal op de puntjes staat.
const ONTBREKEND = {
  f1: { s: (p, r, P) => [PUNTJES, '*', r, '=', P], x: (p) => p },
  f2: { s: (p, r, P) => [p, '*', PUNTJES, '=', P], x: (p, r) => r },
  d1: { s: (p, r, P) => [PUNTJES, ':', r, '=', p], x: (p, r, P) => P },
  d2: { s: (p, r, P) => [P, ':', PUNTJES, '=', p], x: (p, r) => r },
};
function ontbrekendeFactor() {
  const vorm = pick(Object.keys(ONTBREKEND)),
    o = ONTBREKEND[vorm];
  const [p, r] = until(
    () => [metTeken(ri(2, 12)), metTeken(ri(0, 5) === 0 ? 1 : ri(2, 10))],
    ([p, r]) => p < 0 || r < 0,
  );
  const P = p * r,
    x = o.x(p, r, P),
    ts = o.s(p, r, P),
    s = tekst(ts),
    links = tekst(ts.slice(0, 3)),
    rechts = ts[4];
  const vul = (y) => links.replace(PUNTJES, String(y));
  const steps = {
    f1: [
      `Welk getal keer ${r} is ${P}? Reken terug met delen: ${P} : ${r} = ${p}.`,
      `Controle: ${p} * ${r} = ${P}`,
    ],
    f2: [
      `${p} keer welk getal is ${P}? Reken terug met delen: ${P} : ${p} = ${r}.`,
      `Controle: ${p} * ${r} = ${P}`,
    ],
    d1: [
      `Welk getal gedeeld door ${r} is ${p}? Reken terug met keer: ${p} * ${r} = ${P}.`,
      `Controle: ${P} : ${r} = ${p}`,
    ],
    d2: [
      `${P} gedeeld door welk getal is ${p}? Dat getal vind je met delen: ${P} : ${p} = ${r}.`,
      `Controle: ${P} : ${r} = ${p}`,
    ],
  }[vorm];
  // Wat er uitkomt als je een ander getal op de puntjes zet.
  const met = (y) => narekenen(vul(y));
  const omgekeerd = { f1: P * r, f2: P * p, d1: p / r, d2: P * p }[vorm];
  const traps = [
    {
      id: 'teken-omgedraaid',
      f: (v) => near(v[0], -x),
      m: `Vul je antwoord in en reken na: ${zw(vul(-x))} = ${zw(met(-x))}, en niet ${zw(rechts)}. Let op de tekenregels.`,
    },
    Number.isInteger(omgekeerd) &&
      Math.abs(omgekeerd) !== Math.abs(x) && {
        id: 'verkeerd-teruggerekend',
        f: (v) => near(v[0], omgekeerd),
        m:
          vorm === 'd2'
            ? `Bij ${zw(s)} zoek je het getal waardoor je deelt. Dat vind je met delen: ${zw(P)} gedeeld door de uitkomst.`
            : vorm === 'd1'
              ? 'Het omgekeerde van delen is keer. Het getal op de puntjes is de uitkomst keer het getal waardoor je deelt.'
              : 'Het omgekeerde van keer is delen. Reken terug met delen, niet met keer.',
      },
  ].filter(Boolean);
  const kandidaten = Array.from({ length: 601 }, (_, i) => i - 300);
  return {
    q: T(`Welk getal moet op de puntjes staan, zodat de berekening klopt? ${s}`),
    fields: [F('Op de puntjes staat', x)],
    hint: T(
      vorm === 'd1'
        ? 'Reken terug: het omgekeerde van delen is keer. Let op de tekenregels.'
        : 'Reken terug met delen. Let op de tekenregels, en controleer je antwoord door het in te vullen.',
    ),
    steps,
    traps,
    // Een eigen ontleder zoekt alle gehele getallen van -300 tot 300 die kloppen: dat is er precies één.
    v: () => kandidaten.filter((y) => met(y) === rechts).join() === String(x),
  };
}

export default {
  slug: 'vermenigvuldigen-en-delen-met-negatieve-getallen',
  title: 'Vermenigvuldigen en delen met negatieve getallen',
  intro:
    'Ook bij vermenigvuldigen en delen kom je negatieve getallen tegen, zoals 4 · −3 of −12 : −4. Hier leer je de tekenregels, zie je zonder uitrekenen of een lang product positief of negatief is, en reken je met de rekenvolgorde. Je leert ook de aftrekmin en de negatieve min uit elkaar te houden.',
  description:
    'Vermenigvuldigen en delen met negatieve getallen oefenen: de tekenregels, min keer min, de rekenvolgorde en de ontbrekende factor. Gratis met uitleg.',
  videos: {},
  skills: [
    [206, 'Vermenigvuldigen met negatieve getallen', vermenigvuldigen],
    [207, 'Positief of negatief zonder uitrekenen', positiefOfNegatief],
    [208, 'Delen met negatieve getallen', delen],
    [209, 'Rekenvolgorde met negatieve getallen', rekenvolgordeNegatief],
    [210, 'De ontbrekende factor of deler', ontbrekendeFactor],
  ],
  learn: [
    {
      t: 'Vermenigvuldigen met negatieve getallen',
      p: [
        'Een product is herhaald optellen. Zo is 3 * -4 = -4 + -4 + -4 = -12.',
        'Voor het teken van een product gelden de tekenregels. Positief keer positief is positief. Positief keer negatief is negatief, en negatief keer positief ook. Negatief keer negatief is positief.',
        'Keer 0 is altijd 0. Keer 1 verandert een getal niet, en keer -1 geeft het getal met het andere teken.',
      ],
      ex: {
        q: T('Bereken -6 * -7 en 8 * -3.'),
        steps: [
          '-6 * -7 = 42, want negatief keer negatief is positief.',
          '8 * -3 = -24, want positief keer negatief is negatief.',
        ],
      },
      watch:
        'Bij optellen is -3 + -4 = -7, maar bij vermenigvuldigen is -3 * -4 = 12. Haal de regels niet door elkaar.',
    },
    {
      t: 'Een lang product',
      p: [
        'Heb je meer dan twee factoren, dan reken je van links naar rechts.',
        'Wil je alleen weten of de uitkomst positief of negatief is, tel dan de mintekens. Twee mintekens samen geven een plus. Staat er een 0 bij, dan is de uitkomst 0.',
      ],
      ex: {
        q: T('Is de uitkomst van -2 * 5 * -1 * -3 positief of negatief?'),
        steps: [
          'Er staan 3 mintekens. Twee daarvan samen geven een plus. Er blijft één minteken over, dus de uitkomst is negatief.',
          'Controle: -2 * 5 * -1 * -3 = -10 * -1 * -3 = 10 * -3 = -30',
        ],
      },
    },
    {
      t: 'Delen met negatieve getallen',
      p: [
        'Bij delen gelden dezelfde tekenregels als bij vermenigvuldigen.',
        'Een deling controleer je met een vermenigvuldiging. 0 gedeeld door een getal is 0. Delen door 0 kan niet.',
      ],
      ex: {
        q: T('Bereken -56 : 8 en -36 : -4.'),
        steps: ['-56 : 8 = -7, want -7 * 8 = -56', '-36 : -4 = 9, want 9 * -4 = -36'],
      },
    },
    {
      t: 'Aftrekmin en negatieve min',
      p: [
        'In 6 - -2 staan twee soorten min. De eerste is de {{=aftrekmin|aftrekmin}}: die zegt dat je aftrekt. De tweede is de {{=negatieve-min|negatieve min}}: die hoort bij het getal 2. Hij is iets korter.',
        'De {{rekenvolgorde|rekenvolgorde}} blijft hetzelfde: eerst wat tussen haakjes staat, dan vermenigvuldigen en delen, en dan optellen en aftrekken, steeds van links naar rechts.',
        'Schrijf de berekening onder elkaar. Reken op elke regel één stap uit, en schrijf de rest opnieuw op.',
      ],
      ex: {
        q: T('Bereken -3 * 5 - -12 : 4.'),
        steps: [
          'De min voor de 3 is een negatieve min: die hoort bij de 3. De min na de 5 is een aftrekmin. De min voor de 12 is weer een negatieve min.',
          'Eerst vermenigvuldigen en delen, van links naar rechts, en dan pas aftrekken.',
          '-3 * 5 - -12 : 4 =',
          '-15 - -12 : 4 =',
          '-15 - -3 = -12',
        ],
      },
      watch:
        'In -3 * 5 - -12 : 4 reken je eerst -12 : 4 uit. De aftrekmin ervoor doet pas daarna mee, want aftrekken komt na delen.',
    },
    {
      t: 'Een ontbrekende factor of deler',
      p: [
        'Bij … * -4 = 28 zoek je het getal dat keer -4 gelijk is aan 28. Reken terug met delen: 28 : -4 = -7.',
        'Bij … : -3 = 6 reken je terug met keer: 6 * -3 = -18. Controleer je antwoord door het in te vullen.',
      ],
      ex: {
        q: T('Welk getal moet op de puntjes staan? -45 : … = 9'),
        steps: [
          '-45 gedeeld door welk getal is 9? Dat getal is -45 : 9 = -5.',
          'Controle: -45 : -5 = 9',
        ],
      },
    },
  ],
};
