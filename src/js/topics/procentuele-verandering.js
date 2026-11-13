// Onderwerp: Procentuele verandering. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, pick, coin, near, rd, isNice, d } from '../math.js';
import { F, RF, needRound, euro } from './shared.js';
import { T } from '../typeset.js';

// Een percentage zoals in het boek: afgerond op één decimaal, ook als dat een 0 is (≈ 5,0%).
// Een percentage dat precies uitkomt, zoals 25%, krijgt geen decimaal erbij.
const pc = (x) => (isNice(x, 1) ? d(x) : rd(x, 1).toFixed(1).replace('.', ','));
const eq = (x) => `${isNice(x, 1) ? '=' : '≈'} ${pc(x)}`;
// Een getal met een niet-afgeronde staart, zoals 1,0399... in het boek.
function dots(x, k = 4) {
  if (isNice(x, k)) return d(x);
  const s = x.toFixed(k + 4);
  return `${s.slice(0, s.indexOf('.') + k + 1).replace('.', ',')}...`;
}
// Een melding na een valkuil is gewone tekst, dus met een echt minteken.
const mn = (x) => d(x).replace('-', '−');
// De vermenigvuldigingsfactor bij een verandering { p, up }: +16% geeft 1,16 en −12% geeft 0,88.
const fac = (c) => rd((100 + (c.up ? c.p : -c.p)) / 100, 6);
const signed = (c) => (c.up ? c.p : -c.p);
const joinAnd = (xs) =>
  xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} en ${xs[xs.length - 1]}`;
// De zin bij een rondingsvraag over geld.
const centen = (fs) => (fs.some((f) => f.round != null) ? ' Rond af op centen.' : '');

// Een valkuil voor veld i: de leerling vult een getal uit ws in dat je met een bekende fout krijgt,
// ook als hij dat zelf afrondt (tol). allow is hoeveel het goede antwoord na afronden mag schelen.
// Een fout getal dat te dicht bij het goede antwoord ligt, telt niet mee.
function miss(id, i, ws, right, tol, allow, m) {
  const wrong = ws.filter((w) => Number.isFinite(w) && Math.abs(w - right) > tol + allow + 1e-9);
  return wrong.length
    ? {
        id,
        f: (v) => Number.isFinite(v[i]) && wrong.some((w) => Math.abs(v[i] - w) <= tol + 1e-9),
        m,
      }
    : null;
}
// Afronden op 1 decimaal: een fout percentage mag de leerling ook zelf hebben afgerond.
const PCT = [0.05, 0.05];
// Geld op centen.
const EUR = [0.005, 0.005];

// Eigen verhalen bij een deel van een totaal.
const PARTS = [
  {
    t: [18, 96],
    whole: (t) => `Een tennisclub heeft ${t} leden.`,
    part: (p) => `Van de leden speelt ${d(p)}% competitie.`,
    askN: 'Hoeveel leden spelen competitie?',
    have: (x) => `Daarvan spelen er ${x} competitie.`,
    askP: 'Hoeveel procent van de leden speelt competitie?',
    unit: 'leden',
  },
  {
    t: [40, 160],
    whole: (t) => `Op een middelbare school zitten ${t} leerlingen.`,
    part: (p) => `Van de leerlingen komt ${d(p)}% met de bus.`,
    askN: 'Hoeveel leerlingen komen met de bus?',
    have: (x) => `Daarvan komen er ${x} met de bus.`,
    askP: 'Hoeveel procent van de leerlingen komt met de bus?',
    unit: 'leerlingen',
  },
  {
    t: [120, 960],
    whole: (t) => `Op zaterdag had een festival ${t} bezoekers.`,
    part: (p) => `Van de bezoekers kwam ${d(p)}% met de trein.`,
    askN: 'Hoeveel bezoekers kwamen met de trein?',
    have: (x) => `Daarvan kwamen er ${x} met de trein.`,
    askP: 'Hoeveel procent van de bezoekers kwam met de trein?',
    unit: 'bezoekers',
  },
  {
    t: [15, 90],
    whole: (t) => `Een fietsenstalling heeft ${t} plekken.`,
    part: (p) => `Op een ochtend is ${d(p)}% van de plekken bezet.`,
    askN: 'Hoeveel plekken zijn bezet?',
    have: (x) => `Op een ochtend zijn er ${x} bezet.`,
    askP: 'Hoeveel procent van de plekken is bezet?',
    unit: 'plekken',
  },
];

// Een procent van een getal: 18,4% van 650 is 0,184 · 650.
function partOf() {
  const bare = coin();
  let p, t, ans, c;
  for (;;) {
    c = pick(PARTS);
    if (bare) {
      p = pick([2.5, 4.5, 6.4, 7.2, 0.8, 12.5, 16.8, 18.5, 23, 35, 62.5, 84]);
      t = pick([ri(12, 99) * 10, ri(100, 999)]);
    } else {
      p = pick([4, 5, 8, 12, 15, 18, 24, 25, 35, 40, 45, 55, 64, 72, 85]);
      t = ri(c.t[0], c.t[1]) * 10;
    }
    ans = rd((p * t) / 100, 6);
    if (bare || Number.isInteger(ans)) break;
  }
  const fields = [F(bare ? `${d(p)}% van ${t} is` : 'Dat zijn', ans, bare ? '' : c.unit)];
  return {
    q: T(bare ? `Bereken ${d(p)}% van ${t}.` : `${c.whole(t)} ${c.part(p)} ${c.askN}`),
    fields,
    hint: 'Schrijf het procent als kommagetal: deel het door 100. Vermenigvuldig dat met het totaal.',
    steps: [
      `${d(p)}% van ${t} is ${d(p / 100)}*${t} = ${d(ans)}`,
      ...(bare ? [] : [`Dat zijn ${d(ans)} ${c.unit}.`]),
    ],
    traps: [
      miss(
        'komma-verschoven',
        0,
        [10, 0.1, 100, 0.01].map((k) => rd(ans * k, 6)),
        ans,
        1e-6,
        0,
        `Let op de komma. ${mn(p)}% is ${mn(p / 100)} als kommagetal, want je deelt het procent door 100.`,
      ),
    ].filter(Boolean),
    v: () => near((ans / t) * 100, p, 1e-6),
  };
}
// Hoeveel procent een deel is: 87 van 540 is 87/540 · 100%.
function shareOf() {
  const bare = coin();
  let x, t, c;
  for (;;) {
    c = pick(PARTS);
    if (bare) {
      t = ri(150, 990);
      x = coin()
        ? ri(Math.ceil(t * 0.04), Math.floor(t * 0.9))
        : ri(Math.ceil(t * 0.4), Math.floor(t * 9)) / 10;
    } else {
      t = ri(c.t[0], c.t[1]) * 10 + ri(0, 9);
      x = ri(Math.ceil(t * 0.04), Math.floor(t * 0.9));
    }
    if ((x / t) * 100 >= 3 && !isNice((x / t) * 100, 0)) break;
  }
  const pct = (x / t) * 100,
    fields = [RF('Dat is', pct, 1, '%')];
  return {
    q: T(
      (bare ? `Hoeveel procent van ${t} is ${d(x)}?` : `${c.whole(t)} ${c.have(x)} ${c.askP}`) +
        needRound(fields),
    ),
    fields,
    hint: 'Deel het deel door het totaal en vermenigvuldig met 100%.',
    steps: [`{${d(x)}/${t}}*100% ${eq(pct)}%`],
    traps: [
      miss(
        'keer-100-vergeten',
        0,
        [x / t],
        pct,
        ...PCT,
        'Je hebt het deel als kommagetal berekend. Vermenigvuldig nog met 100% om er een percentage van te maken.',
      ),
      miss(
        'deling-omgedraaid',
        0,
        [(t / x) * 100, t / x],
        pct,
        ...PCT,
        'Deel het deel door het totaal, dus het kleinste getal door het grootste.',
      ),
    ].filter(Boolean),
    v: () => near((pct / 100) * t, x, 1e-6),
  };
}
function s41percent() {
  return coin() ? partOf() : shareOf();
}

// Eigen spullen met een prijs: [naam, kort, laagste prijs, hoogste prijs].
const ITEMS = [
  ['Een koptelefoon', 'de koptelefoon', 39, 129],
  ['Een fiets', 'de fiets', 349, 899],
  ['Een kaartje voor een pretpark', 'een kaartje', 29, 49],
  ['Een spelcomputer', 'de spelcomputer', 279, 549],
  ['Een tent', 'de tent', 89, 249],
  ['Een maandabonnement van de sportschool', 'het abonnement', 19, 45],
];
const price = (lo, hi) => rd(ri(lo, hi) + pick([0, 0.5, 0.95, 0.99]), 2);
// Eigen verhalen met een oud en een nieuw aantal.
const CHANGES = [
  [120, 900, (o, n) => `Vorig jaar had een zwemvereniging ${o} leden. Dit jaar zijn het er ${n}.`],
  [
    400,
    2500,
    (o, n) => `In maart kwamen er ${o} bezoekers naar een museum. In april waren het er ${n}.`,
  ],
  [
    800,
    9000,
    (o, n) =>
      `Een podcast had in januari ${o} luisteraars per aflevering. In juni waren dat er ${n}.`,
  ],
  [1500, 8500, (o, n) => `Een dorp had in 2015 ${o} inwoners. In 2025 waren het er ${n}.`],
];

// De procentuele verandering, met de antwoordzin bij een afname.
function s41change() {
  const up = coin();
  let o, n, story, show;
  for (;;) {
    const q = ri(3, 38) + (coin() ? 0 : ri(1, 9) / 10),
      f = 1 + (up ? q : -q) / 100;
    if (coin()) {
      const [name, short, lo, hi] = pick(ITEMS);
      o = price(lo, hi);
      n = rd(Math.floor(o * f) + pick([0, 0.5, 0.95, 0.99]), 2);
      story = `${name} kostte eerst ${euro(o)} euro. Nu kost ${short} ${euro(n)} euro.`;
      show = euro;
    } else {
      const [lo, hi, t] = pick(CHANGES);
      o = ri(lo, hi);
      n = Math.round(o * f);
      story = t(o, n);
      show = String;
    }
    const pct = ((n - o) / o) * 100;
    if (n !== o && up === n > o && Math.abs(pct) >= 2 && n < 10000) break;
  }
  const pct = ((n - o) / o) * 100,
    A = Math.abs(pct),
    word = up ? 'toename' : 'afname',
    fields = [RF(`procentuele ${word} =`, A, 1, '%')],
    msgSign = up
      ? 'Reken nieuw − oud, dus het nieuwe getal min het oude. Bij een toename komt er dan een positief getal uit.'
      : `De berekening geeft een negatief getal, want het is een afname. De procentuele afname schrijf je als positief getal, zonder min.`;
  return {
    q: T(`${story} Bereken de procentuele ${word}.${needRound(fields)}`),
    fields,
    hint: T('Gebruik procentuele verandering = {nieuw - oud/oud} × 100%. Je deelt door oud.'),
    steps: [
      'procentuele verandering = {nieuw - oud/oud} × 100%',
      `{${show(n)} - ${show(o)}/${show(o)}}*100% ${eq(pct)}%`,
      `Dus de procentuele ${word} is ${pc(A)}%.`,
    ],
    traps: [
      miss('min-teken', 0, [-A], A, ...PCT, msgSign),
      miss(
        'gedeeld-door-nieuw',
        0,
        [(Math.abs(n - o) / n) * 100],
        A,
        ...PCT,
        'Je hebt door het nieuwe getal gedeeld. Deel het verschil door oud, het getal van vóór de verandering.',
      ),
      miss(
        'nieuw-gedeeld-door-oud',
        0,
        [(n / o) * 100],
        A,
        ...PCT,
        'Je hebt nieuw gedeeld door oud. Dat is het nieuwe getal als percentage van het oude. Deel het verschil nieuw − oud door oud.',
      ),
      miss(
        'verschil-geen-procent',
        0,
        [Math.abs(n - o)],
        A,
        1e-6,
        PCT[1],
        'Dit is het verschil. Deel dat nog door oud en vermenigvuldig met 100% om de procentuele verandering te krijgen.',
      ),
    ].filter(Boolean),
    v: () => near(o * (1 + (up ? A : -A) / 100), n, 1e-6),
  };
}

// Onderwerpen voor een toename of afname: [naam, werkwoord bij toename, bij afname].
const SUBJ = [
  ['De prijs van een fiets', 'stijgt', 'daalt'],
  ['Het aantal leden van een club', 'stijgt', 'daalt'],
  ['Het aantal bezoekers van een website', 'neemt toe', 'neemt af'],
  ['De huur van een woning', 'stijgt', 'daalt'],
];
const FACTOR_IS_PCT =
  'Een vermenigvuldigingsfactor is geen percentage. Schrijf het percentage als kommagetal: deel het door 100.';
const ONLY_PCT =
  'Tel het procent op bij 100% of haal het van 100% af. Deel het nieuwe percentage door 100, dan heb je de vermenigvuldigingsfactor.';
const UP_DOWN =
  'Bij een toename is de vermenigvuldigingsfactor groter dan 1, bij een afname kleiner dan 1.';
// Van een procent naar de vermenigvuldigingsfactor: 16% erbij geeft × 1,16.
function pctToFactor() {
  const [s, vUp, vDown] = pick(SUBJ),
    p = pick([
      3, 4, 6, 8, 12, 15, 16, 18, 22, 25, 30, 35, 40, 60, 2.5, 4.5, 7.5, 13.2, 0.8, 1.5, 120,
    ]),
    up = p >= 100 || coin(),
    c = { p, up },
    f = fac(c),
    sign = up ? '+' : '-';
  return {
    q: T(`${s} ${up ? vUp : vDown} met ${d(p)}%. Wat is de vermenigvuldigingsfactor?`),
    fields: [F('vermenigvuldigingsfactor =', f)],
    hint: up
      ? 'Bij een toename komt het procent bij 100% erbij. Deel het nieuwe percentage door 100.'
      : 'Bij een afname gaat het procent van 100% af. Deel het nieuwe percentage door 100.',
    steps: [
      `${d(p)}% ${up ? 'erbij' : 'eraf'} geeft 100% ${sign} ${d(p)}% = ${d(f * 100)}%, dus × ${d(f)}`,
      `De vermenigvuldigingsfactor is ${d(f)}.`,
    ],
    traps: [
      miss('alleen-het-procent', 0, [p / 100, p], f, 1e-6, 0, ONLY_PCT),
      miss('factor-als-procent', 0, [f * 100], f, 1e-6, 0, FACTOR_IS_PCT),
      p < 100 && miss('toename-afname-omgedraaid', 0, [fac({ p, up: !up })], f, 1e-6, 0, UP_DOWN),
      p < 10 &&
        miss(
          'komma-verschoven',
          0,
          [rd(1 + (up ? p : -p) / 10, 6)],
          f,
          1e-6,
          0,
          `Let op de komma. ${mn(p)}% is ${mn(p / 100)} als kommagetal.`,
        ),
    ].filter(Boolean),
    v: () => near(f * 100 - 100, signed(c), 1e-6),
  };
}
// Woorden in plaats van een procent: verdubbeld, gehalveerd of 400% meer.
const WORDS = [
  ['is verdubbeld', 2, 'Verdubbeld betekent twee keer zo veel, dus × 2.'],
  ['is verdrievoudigd', 3, 'Verdrievoudigd betekent drie keer zo veel, dus × 3.'],
  ['is gehalveerd', 0.5, 'Gehalveerd betekent de helft, dus × 0,5.'],
  ['is met 400% toegenomen', 5, '400% erbij geeft 100% + 400% = 500%, dus × 5.', 400],
  ['is met 300% toegenomen', 4, '300% erbij geeft 100% + 300% = 400%, dus × 4.', 300],
  ['is met 150% toegenomen', 2.5, '150% erbij geeft 100% + 150% = 250%, dus × 2,5.', 150],
  ['is met 75% afgenomen', 0.25, '75% eraf geeft 100% - 75% = 25%, dus × 0,25.', -75],
];
function wordToFactor() {
  const [phrase, f, step, p] = pick(WORDS),
    s = pick([
      'Het aantal bezoekers van een museum',
      'Het aantal leden van een schaakclub',
      'Het aantal fietsen in een stalling',
    ]);
  return {
    q: T(`${s} ${phrase}. Wat is de vermenigvuldigingsfactor?`),
    fields: [F('vermenigvuldigingsfactor =', f)],
    hint: 'Bedenk hoeveel procent het nieuwe getal is van het oude. Deel dat percentage door 100.',
    steps: [step, `De vermenigvuldigingsfactor is ${d(f)}.`],
    traps: [
      p && miss('alleen-het-procent', 0, [Math.abs(p) / 100, Math.abs(p)], f, 1e-6, 0, ONLY_PCT),
      miss('factor-als-procent', 0, [f * 100], f, 1e-6, 0, FACTOR_IS_PCT),
      f < 1 &&
        miss(
          'toename-afname-omgedraaid',
          0,
          [1 / f, 2 - f],
          f,
          1e-6,
          0,
          `Het wordt minder. ${UP_DOWN}`,
        ),
    ].filter(Boolean),
    v: () => (p ? near(100 + p, f * 100) : near(f * 100, { 2: 200, 3: 300, 0.5: 50 }[f])),
  };
}
// Van de vermenigvuldigingsfactor naar het procent: × 1,132 hoort bij +13,2%.
function factorToPct() {
  const up = coin(),
    f = up
      ? pick([1.132, 1.05, 1.3, 1.025, 1.6, 2.5, 1.08, 1.45, 3])
      : pick([0.75, 0.88, 0.965, 0.6, 0.92, 0.995, 0.4, 0.85]),
    p = rd(Math.abs(f * 100 - 100), 6),
    a = up ? 'toename' : 'afname',
    s = pick(SUBJ)[0];
  return {
    q: T(
      `${s} wordt vermenigvuldigd met ${d(f)}. Is dat een toename of een afname, en hoeveel procent?`,
    ),
    fields: [
      { sel: ['toename', 'afname'], a, pre: 'Dat is een', label: 'Toename of afname' },
      F('van', p, '%'),
    ],
    hint: 'Schrijf de vermenigvuldigingsfactor als percentage en vergelijk dat met 100%.',
    steps: [
      `× ${d(f)} hoort bij ${d(f * 100)}%`,
      up ? `${d(f * 100)}% - 100% = ${d(p)}%` : `100% - ${d(f * 100)}% = ${d(p)}%`,
      `Dus een ${a} van ${d(p)}%.`,
    ],
    traps: [
      miss(
        'factor-als-procent',
        1,
        [f * 100],
        p,
        1e-6,
        0,
        `Bij × ${mn(f)} hoort ${mn(f * 100)}%. De verandering is hoeveel dat van 100% verschilt.`,
      ),
      miss(
        'keer-100-vergeten',
        1,
        [p / 100],
        p,
        1e-6,
        0,
        'Het verschil met 1 is een kommagetal. Vermenigvuldig met 100 om er een percentage van te maken.',
      ),
      {
        id: 'toename-afname-omgedraaid',
        f: (v) => !!v[0] && v[0] !== a,
        m: UP_DOWN,
      },
    ].filter(Boolean),
    v: () => near(up ? 100 + p : 100 - p, f * 100, 1e-6) && f > 1 === up,
  };
}
function s41factor() {
  const k = ri(0, 9);
  return k < 5 ? pctToFactor() : k < 7 ? wordToFactor() : factorToPct();
}

// Eigen verhalen met een aantal dat verandert. t maakt de vraag, say de antwoordzin, pre en unit
// staan bij het veld. r is het bereik van oud, in tientallen.
const COUNT_NEW = [
  {
    t: (o, p, up) =>
      `Een voetbalclub had ${o} leden. Het aantal leden is met ${d(p)}% ${up ? 'gestegen' : 'gedaald'}. Hoeveel leden heeft de club nu?`,
    say: (x) => `De club heeft nu ${x} leden.`,
    pre: 'De club heeft nu',
    unit: 'leden',
    r: [20, 90],
  },
  {
    t: (o, p, up) =>
      `Een bibliotheek leende in januari ${o} boeken uit. In februari waren dat er ${d(p)}% ${up ? 'meer' : 'minder'}. Hoeveel boeken leende de bibliotheek in februari uit?`,
    say: (x) => `In februari leende de bibliotheek ${x} boeken uit.`,
    pre: 'In februari',
    unit: 'boeken',
    r: [60, 800],
  },
  {
    t: (o, p, up) =>
      `Een camping had in juni ${o} gasten. In juli waren het er ${d(p)}% ${up ? 'meer' : 'minder'}. Hoeveel gasten had de camping in juli?`,
    say: (x) => `In juli had de camping ${x} gasten.`,
    pre: 'In juli',
    unit: 'gasten',
    r: [40, 400],
  },
];
// Het nieuwe getal met de vermenigvuldigingsfactor: nieuw = vermenigvuldigingsfactor × oud.
function s41new() {
  const money = coin(),
    up = coin(),
    p = up
      ? pick([4, 6, 8, 12, 15, 18, 2.5, 3.5, 7.5])
      : pick([10, 15, 20, 25, 30, 35, 40, 12.5, 4]),
    c = { p, up },
    f = fac(c),
    sign = up ? '+' : '-',
    factorStep = `${d(p)}% ${up ? 'erbij' : 'eraf'} geeft 100% ${sign} ${d(p)}% = ${d(f * 100)}%, dus × ${d(f)}`;
  let q, fields, steps, tol, o, x;
  if (money) {
    const [name, , lo, hi] = pick(ITEMS);
    o = price(lo, hi);
    x = o * f;
    fields = [RF('nieuwe prijs =', x, 2, 'euro')];
    q = up
      ? `${name} kost ${euro(o)} euro. De prijs stijgt met ${d(p)}%. Bereken de nieuwe prijs.`
      : `${name} kost ${euro(o)} euro. In de uitverkoop krijg je ${d(p)}% korting. Bereken de nieuwe prijs.`;
    q += centen(fields);
    steps = [
      factorStep,
      `nieuwe prijs = ${d(f)}*${euro(o)} ${isNice(x, 2) ? '=' : '≈'} ${euro(rd(x, 2))}`,
      `De nieuwe prijs is ${euro(rd(x, 2))} euro.`,
    ];
    tol = EUR;
  } else {
    const ctx = pick(COUNT_NEW);
    do {
      o = ri(ctx.r[0], ctx.r[1]) * 10;
      x = o * f;
    } while (!isNice(x, 0));
    x = Math.round(x);
    fields = [F(ctx.pre, x, ctx.unit)];
    q = ctx.t(o, p, up);
    steps = [factorStep, `nieuw = ${d(f)}*${o} = ${x}`, ctx.say(x)];
    tol = [0.5, 0];
  }
  return {
    q: T(q),
    fields,
    hint: 'Bereken eerst de vermenigvuldigingsfactor. Dan is nieuw = vermenigvuldigingsfactor × oud.',
    steps,
    traps: [
      miss(
        'alleen-de-verandering',
        0,
        [(o * p) / 100],
        x,
        ...tol,
        `Dit is hoeveel er ${up ? 'bij komt' : 'af gaat'}. Gebruik de vermenigvuldigingsfactor, dan krijg je in één keer het nieuwe getal.`,
      ),
      miss('toename-afname-omgedraaid', 0, [o * fac({ p, up: !up })], x, ...tol, UP_DOWN),
      p < 10 &&
        miss(
          'komma-verschoven',
          0,
          [o * (1 + (up ? p : -p) / 10)],
          x,
          ...tol,
          `Let op de komma in de vermenigvuldigingsfactor. ${mn(p)}% is ${mn(p / 100)} als kommagetal.`,
        ),
    ].filter(Boolean),
    v: () => near(((x - o) / o) * 100, signed(c), money ? 0.01 : 1e-6),
  };
}

// Twee of drie veranderingen na elkaar, met hun factoren. pool zijn de procenten waaruit je kiest.
const CHAIN_PCTS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 18, 20, 25, 30, 35, 2.5, 3.8, 4.5, 8.1, 12.5];
const chainOf = (n, pool) => Array.from({ length: n }, () => ({ p: pick(pool), up: coin() }));
const product = (ch) =>
  rd(
    ch.reduce((f, c) => f * fac(c), 1),
    10,
  );
// Een prijs stijgt of daalt, een aantal neemt toe of af. y0 is het eerste jaar.
function chainText(ch, kind, y0) {
  const parts = ch.map((c, i) =>
    kind === 'prijs'
      ? `${c.up ? 'steeg' : 'daalde'} in ${y0 + i} met ${d(c.p)}%`
      : `${i ? '' : 'nam '}in ${y0 + i} ${c.up ? 'toe' : 'af'} met ${d(c.p)}%`,
  );
  return joinAnd(parts);
}
const factorsText = (ch) =>
  joinAnd(ch.map((c) => `${c.up ? '+' : '-'}${d(c.p)}% geeft × ${d(fac(c))}`));
const factorCalc = (ch, fx) =>
  `vermenigvuldigingsfactor = ${ch.map((c) => d(fac(c))).join('*')} = ${dots(fx)}`;
const CHAIN_SUBJ = [
  ['De prijs van een concertkaartje', 'prijs', 'de prijs'],
  ['De prijs van een treinabonnement', 'prijs', 'de prijs'],
  ['Het aantal leden van een judoclub', 'aantal', 'het aantal leden'],
  ['Het aantal bezoekers van een dierentuin', 'aantal', 'het aantal bezoekers'],
  ['Het aantal inwoners van een dorp', 'aantal', 'het aantal inwoners'],
];

// Procent op procent: de veranderingen samen geven één vermenigvuldigingsfactor.
function s41chain() {
  let ch, fx, A;
  for (;;) {
    ch = chainOf(coin() ? 2 : 3, CHAIN_PCTS);
    fx = product(ch);
    A = Math.abs(fx - 1) * 100;
    const sum = ch.reduce((s, c) => s + signed(c), 0);
    if (A >= 1 && Math.abs(Math.abs(sum) - A) > 0.2) break;
  }
  const up = fx > 1,
    a = up ? 'toename' : 'afname',
    sum = ch.reduce((s, c) => s + signed(c), 0),
    [s, kind, short] = pick(CHAIN_SUBJ),
    y0 = ri(2019, 2023),
    pctF = fx * 100,
    fields = [
      { sel: ['toename', 'afname'], a, pre: 'In totaal een', label: 'Toename of afname' },
      RF('van', A, 1, '%'),
    ];
  return {
    q: T(
      `${s} ${chainText(ch, kind, y0)}. Met hoeveel procent is ${short} in totaal veranderd?${needRound(fields)}`,
    ),
    fields,
    hint: 'Schrijf bij elke verandering de vermenigvuldigingsfactor. Vermenigvuldig die factoren met elkaar.',
    steps: [
      factorsText(ch),
      factorCalc(ch, fx),
      `× ${dots(fx)} hoort bij ${dots(pctF, 2)}%`,
      up ? `${dots(pctF, 2)}% - 100% ${eq(A)}%` : `100% - ${dots(pctF, 2)}% ${eq(A)}%`,
      `Dus in totaal een ${a} van ${pc(A)}%.`,
    ],
    traps: [
      miss(
        'procenten-opgeteld',
        1,
        [Math.abs(sum)],
        A,
        ...PCT,
        'Percentages na elkaar tel je niet op, want elke verandering gaat over een ander getal. Vermenigvuldig de vermenigvuldigingsfactoren.',
      ),
      miss(
        'factor-als-procent',
        1,
        [pctF],
        A,
        ...PCT,
        `Bij de vermenigvuldigingsfactor hoort ${mn(rd(pctF, 1))}%. De verandering is hoeveel dat van 100% verschilt.`,
      ),
      miss(
        'keer-100-vergeten',
        1,
        [A / 100],
        A,
        0.005,
        PCT[1],
        'Het verschil met 1 is een kommagetal. Vermenigvuldig met 100 om er een percentage van te maken.',
      ),
      {
        id: 'toename-afname-omgedraaid',
        f: (v) => !!v[0] && v[0] !== a,
        m: `Kijk naar de vermenigvuldigingsfactor van alle veranderingen samen. ${UP_DOWN}`,
      },
    ].filter(Boolean),
    // Reken het na met 100 als beginwaarde, stap voor stap.
    v: () => {
      let y = 100;
      for (const c of ch) y += (y * signed(c)) / 100;
      return near(Math.abs(y - 100), A, 1e-6) && y > 100 === up;
    },
  };
}

// Eigen verhalen met een aantal dat een paar jaar na elkaar verandert. r is het bereik van oud,
// in honderdtallen.
const CHAIN_COUNTS = [
  {
    t: (o, y) => `Begin ${y} had een judoclub ${o} leden. Het aantal leden`,
    ask: (y) => `Hoeveel leden had de club eind ${y}?`,
    say: (x, y) => `Eind ${y} had de club ${x} leden.`,
    unit: 'leden',
    r: [4, 15],
  },
  {
    t: (o, y) => `Begin ${y} had een bibliotheek ${o} leden. Het aantal leden`,
    ask: (y) => `Hoeveel leden had de bibliotheek eind ${y}?`,
    say: (x, y) => `Eind ${y} had de bibliotheek ${x} leden.`,
    unit: 'leden',
    r: [15, 60],
  },
  {
    t: (o, y) => `Begin ${y} had een dorp ${o} inwoners. Het aantal inwoners`,
    ask: (y) => `Hoeveel inwoners had het dorp eind ${y}?`,
    say: (x, y) => `Eind ${y} had het dorp ${x} inwoners.`,
    unit: 'inwoners',
    r: [20, 90],
  },
];
const CHAIN_INTS = [4, 5, 6, 8, 10, 12, 15, 20, 25, 30];
// Procent op procent: het nieuwe getal, met de vermenigvuldigingsfactor die niet is afgerond.
function s41chainNew() {
  const money = coin(),
    y0 = ri(2019, 2023);
  let ch, fx, o, x, q, fields, steps, tol;
  if (money) {
    const [name, short, lo, hi] = pick(ITEMS);
    for (;;) {
      ch = chainOf(coin() ? 2 : 3, CHAIN_PCTS);
      fx = product(ch);
      o = price(lo, hi);
      x = o * fx;
      // Wie na elke stap op centen afrondt, komt op hetzelfde bedrag uit. Anders zijn er twee
      // antwoorden te verdedigen.
      let y = o;
      for (const c of ch) y = rd(y * fac(c), 2);
      if (near(y, rd(x, 2), 1e-9) && Math.abs(fx - 1) >= 0.01 && !isNice(fx, 2)) break;
    }
    const yl = y0 + ch.length - 1;
    fields = [RF(`prijs eind ${yl} =`, x, 2, 'euro')];
    q = `Begin ${y0} kostte ${name.toLowerCase()} ${euro(o)} euro. De prijs ${chainText(ch, 'prijs', y0)}. Bereken de prijs eind ${yl}.${centen(fields)}`;
    steps = [
      factorsText(ch),
      factorCalc(ch, fx),
      `nieuw = ${dots(fx)}*${euro(o)} ${isNice(x, 2) ? '=' : '≈'} ${euro(rd(x, 2))}`,
      `Eind ${yl} kost ${short} ${euro(rd(x, 2))} euro.`,
    ];
    tol = EUR;
  } else {
    const ctx = pick(CHAIN_COUNTS);
    for (;;) {
      ch = chainOf(coin() ? 2 : 3, CHAIN_INTS);
      fx = product(ch);
      // Na elke verandering is het aantal een geheel getal.
      o = ri(ctx.r[0], ctx.r[1]) * 100;
      let y = o,
        whole = true;
      for (const c of ch) {
        y = (y * (100 + signed(c))) / 100;
        whole = whole && Number.isInteger(y);
      }
      x = y;
      if (whole && x < 10000 && Math.abs(fx - 1) >= 0.01 && !isNice(fx, 2)) break;
    }
    const yl = y0 + ch.length - 1;
    fields = [F(`Eind ${yl}`, x, ctx.unit)];
    q = `${ctx.t(o, y0)} ${chainText(ch, 'aantal', y0)}. ${ctx.ask(yl)}`;
    steps = [
      factorsText(ch),
      factorCalc(ch, fx),
      `nieuw = ${dots(fx)}*${o} = ${x}`,
      ctx.say(x, yl),
    ];
    tol = [0.5, 0];
  }
  const sum = ch.reduce((s, c) => s + signed(c), 0);
  return {
    q: T(q),
    fields,
    hint: 'Vermenigvuldig de vermenigvuldigingsfactoren van alle veranderingen. Reken met die factor zonder hem af te ronden.',
    steps,
    traps: [
      miss(
        'procenten-opgeteld',
        0,
        [o * (1 + sum / 100)],
        x,
        ...tol,
        'Percentages na elkaar tel je niet op, want elke verandering gaat over een ander getal. Vermenigvuldig de vermenigvuldigingsfactoren.',
      ),
      miss(
        'factor-afgerond',
        0,
        [o * rd(fx, 2), o * rd(fx, 3)],
        x,
        ...tol,
        'Je hebt de vermenigvuldigingsfactor afgerond. Reken door met de factor die niet is afgerond, en rond pas het antwoord af.',
      ),
      miss(
        'alleen-de-verandering',
        0,
        [o * Math.abs(fx - 1)],
        x,
        ...tol,
        'Dit is hoeveel het in totaal is veranderd. Vermenigvuldig oud met de vermenigvuldigingsfactor, dan krijg je het nieuwe getal.',
      ),
    ].filter(Boolean),
    // Reken het na stap voor stap, zonder af te ronden.
    v: () => {
      let y = o;
      for (const c of ch) y += (y * signed(c)) / 100;
      return near(y, x, 1e-6);
    },
  };
}

export default {
  slug: 'procentuele-verandering',
  title: 'Procentuele verandering',
  intro:
    'Met procenten zeg je hoe groot een deel is, of hoeveel iets is toegenomen of afgenomen. Hier leer je de procentuele verandering berekenen en rekenen met de vermenigvuldigingsfactor, ook als er meer veranderingen na elkaar komen.',
  description:
    'Bereken procenten, de procentuele toename of afname en de vermenigvuldigingsfactor, ook bij procent op procent. Gratis oefenen met uitwerkingen.',
  videos: {
    menno: [
      ['Procentuele verandering', 'b0Y7EzRorT4'],
      ['De vermenigvuldigingsfactor', 'euiNyjtWxgY'],
      ['Procent op procent', '9wXMLQuFmus'],
    ],
  },
  skills: [
    [105, 'Procent van een getal', s41percent],
    [106, 'Procentuele verandering berekenen', s41change],
    [107, 'Vermenigvuldigingsfactor', s41factor],
    [108, 'Nieuw berekenen met de vermenigvuldigingsfactor', s41new],
    [109, 'Procent op procent', s41chain],
    [110, 'Procent op procent: het nieuwe getal', s41chainNew],
  ],
  learn: [
    {
      t: 'Procenten',
      p: [
        'Een procent is een honderdste deel. Wil je een procent van een getal weten, schrijf het procent dan als kommagetal en vermenigvuldig. Wil je weten hoeveel procent een deel is, deel het deel dan door het totaal en vermenigvuldig met 100%.',
      ],
      ex: { q: T('Bereken 18,4% van 650.'), steps: ['18,4% van 650 is 0,184*650 = 119,6'] },
      ex2: {
        q: T('Hoeveel procent van 540 is 87?'),
        steps: ['{87/540}*100% ≈ 16,1%'],
      },
    },
    {
      t: 'Procentuele verandering',
      p: [
        'De procentuele verandering zegt met hoeveel procent iets is toegenomen of afgenomen. Je deelt het verschil door oud, het getal van vóór de verandering:',
        'procentuele verandering = {nieuw - oud/oud} × 100%',
        'Komt er een negatief getal uit, dan is het een afname. In de antwoordzin schrijf je de procentuele afname als positief getal.',
      ],
      ex: {
        q: T('Een zwemclub had 412 leden. Nu zijn het er 365. Bereken de procentuele afname.'),
        steps: [
          'procentuele verandering = {nieuw - oud/oud} × 100%',
          '{365 - 412/412}*100% ≈ -11,4%',
          'Dus de procentuele afname is 11,4%.',
        ],
      },
      watch: 'Je deelt altijd door oud. Rond een percentage af op één decimaal.',
    },
    {
      t: 'De vermenigvuldigingsfactor',
      p: [
        'Bij een toename of afname hoort een vermenigvuldigingsfactor. Daarmee reken je in één keer het nieuwe getal uit: nieuw = vermenigvuldigingsfactor × oud.',
        '18% erbij geeft 100% + 18% = 118%, dus × 1,18. En 7% eraf geeft 100% - 7% = 93%, dus × 0,93.',
        'Andersom hoort bij × 1,045 een toename van 4,5%, en bij × 0,8 een afname van 20%. Verdubbelen is × 2 en halveren is × 0,5. Bij 300% meer hoort 100% + 300% = 400%, dus × 4.',
      ],
      ex: {
        q: T(
          'Een jas kost 79,95 euro. In de uitverkoop krijg je 35% korting. Bereken de nieuwe prijs.',
        ),
        steps: [
          '35% eraf geeft 100% - 35% = 65%, dus × 0,65',
          'nieuwe prijs = 0,65*79,95 ≈ 51,97',
          'De nieuwe prijs is 51,97 euro.',
        ],
      },
      watch:
        'Een vermenigvuldigingsfactor groter dan 1 hoort bij een toename, kleiner dan 1 bij een afname.',
    },
    {
      t: 'Procent op procent',
      p: [
        'Komen er twee of meer veranderingen na elkaar, dan vermenigvuldig je de vermenigvuldigingsfactoren. Percentages tel je niet op, want elke verandering gaat over een ander getal.',
      ],
      ex: {
        q: T(
          'Een prijs stijgt eerst met 10% en daarna nog eens met 20%. Met hoeveel procent is de prijs in totaal gestegen?',
        ),
        steps: [
          '+10% geeft × 1,1 en +20% geeft × 1,2',
          'vermenigvuldigingsfactor = 1,1*1,2 = 1,32',
          '× 1,32 hoort bij 132%, dus een toename van 32%, en niet van 30%.',
        ],
      },
      ex2: {
        q: T(
          'Een vereniging had 2400 leden. Het aantal leden nam eerst toe met 6,5% en daarna af met 3,2%. Hoeveel leden zijn er nu?',
        ),
        steps: [
          '+6,5% geeft × 1,065 en -3,2% geeft × 0,968',
          'vermenigvuldigingsfactor = 1,065*0,968 = 1,03092',
          'nieuw = 1,03092*2400 ≈ 2474',
          'Er zijn nu 2474 leden.',
        ],
      },
      watch:
        'Reken door met de vermenigvuldigingsfactor die niet is afgerond. Rond pas het antwoord af, net zo nauwkeurig als het oude getal.',
    },
  ],
};
