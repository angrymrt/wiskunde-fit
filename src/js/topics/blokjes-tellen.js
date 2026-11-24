// Onderwerp: Blokjes tellen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, pick, coin, until } from '../math.js';
import { F, H } from './shared.js';
import { T, dt } from '../typeset.js';
import { solid } from '../ruimtefiguren.js';

const NAMEN = ['Lieke', 'Omar', 'Floor', 'Jesse', 'Nina', 'Thijs', 'Sara', 'Milan'];
// '1 blokje' of '5 blokjes'.
const stuks = (n, een = 'blokje', meer = 'blokjes') => `${n} ${n === 1 ? een : meer}`;
const som = (xs) => xs.reduce((t, x) => t + x, 0);
const tot = (n) => Array.from({ length: n }, (_, i) => i + 1);
// Alle hokjes [i, j] van een rechthoek van a bij b.
const vak = (a, b) => Array.from({ length: a * b }, (_, t) => [Math.floor(t / b), t % b]);

// Een valkuil met per veld een fout getal: [veld, fout getal, goed antwoord]. Een fout getal dat
// gelijk is aan het goede antwoord valt weg, want het goede antwoord mag nooit in een valkuil vallen.
function valkuil(id, m, paren) {
  const p = paren.filter(([, x, goed]) => x !== goed);
  return p.length ? { id, m, f: (v) => p.some(([i, x]) => v[i] === x) } : null;
}

// Bouwwerken in lagen, met laag 1 bovenaan. laag(k) is het aantal blokjes in laag k, en zichtbaar(k)
// hoeveel daarvan je aan de buitenkant ziet. kolommen(n) geeft de hoogte van elke stapel blokjes als
// het bouwwerk n lagen heeft, met alle lagen tegen dezelfde hoek. Waar een laag precies ligt, maakt
// voor het aantal niet uit. Zo telt v de blokjes per stapel in plaats van per laag.
const BOUW = {
  vierkant: () => ({
    tekst:
      'Elke laag is een vierkant van blokjes. De bovenste laag is 1 blokje. Elke laag eronder is 1 blokje langer en 1 blokje breder dan de laag erboven.',
    laag: (k) => k * k,
    reken: (k) => `Laag ${k} is ${k} bij ${k}, dus ${k}*${k} = ${k * k} blokjes.`,
    zichtbaar: (k) => k * k - Math.max(0, k - 2) ** 2,
    kolommen: (n) => vak(n, n).map(([i, j]) => n - Math.max(i, j)),
    zicht:
      'Je hebt alleen de blokjes aan de rand van een laag geteld. In een grote laag zitten ook blokjes binnenin. Die zie je niet, maar ze tellen wel mee.',
  }),
  rechthoek: (c) => ({
    tekst: `Elke laag is een rechthoek van blokjes. De bovenste laag is 1 bij ${1 + c}. Elke laag eronder is 1 blokje langer en 1 blokje breder dan de laag erboven.`,
    laag: (k) => k * (k + c),
    reken: (k) => `Laag ${k} is ${k} bij ${k + c}, dus ${k}*${k + c} = ${k * (k + c)} blokjes.`,
    zichtbaar: (k) => k * (k + c) - Math.max(0, k - 2) * Math.max(0, k + c - 2),
    kolommen: (n) => vak(n, n + c).map(([i, j]) => n - Math.max(i, j - c)),
    zicht:
      'Je hebt alleen de blokjes aan de rand van een laag geteld. In een grote laag zitten ook blokjes binnenin. Die zie je niet, maar ze tellen wel mee.',
  }),
  trap: (c, w) => ({
    tekst: `Het is een trap, ${w} blokjes breed. De bovenste laag is 1 rij van ${w} blokjes. Elke laag eronder heeft 1 rij van ${w} blokjes meer.`,
    laag: (k) => k * w,
    reken: (k) => `Laag ${k} heeft ${k} rijen van ${w} blokjes, dus ${k}*${w} = ${k * w} blokjes.`,
    zichtbaar: (k) => k,
    kolommen: (n) => vak(n, w).map(([i]) => i + 1),
    zicht: `Je hebt alleen de blokjes aan de zijkant van de trap geteld. Elke rij is ${w} blokjes breed, dus achter elk blokje dat je ziet zitten er nog meer.`,
  }),
};

function inLagen() {
  const naam = pick(NAMEN),
    soort = pick(['vierkant', 'rechthoek', 'trap']),
    c = soort === 'rechthoek' ? ri(1, 2) : 0,
    w = soort === 'trap' ? ri(2, 4) : 0,
    b = BOUW[soort](c, w),
    k = ri(5, 6),
    n = ri(5, 7),
    n2 = ri(Math.max(n, k) + 1, 9),
    lagen = (j) => tot(j).map(b.laag),
    samen = (j) => som(lagen(j)),
    doel = samen(n2),
    getoond = lagen(4);
  const rij = (xs) => xs.map(String),
    opgeteld = lagen(n2).map((_, i) => samen(i + 1));
  return {
    q:
      T(
        `${naam} bouwt een bouwwerk van gelijke blokjes. ${b.tekst} In de tabel zie je hoeveel blokjes er in de bovenste vier lagen zitten. Hoeveel blokjes zitten er in laag ${k}? Hoeveel blokjes zijn het samen als het bouwwerk ${n} lagen heeft? En hoeveel lagen heeft het bouwwerk als er precies ${doel} blokjes in zitten?`,
      ) +
      dt(
        [
          ['laag', ...rij(tot(4))],
          ['blokjes', ...rij(getoond)],
        ],
        `Tabel: blokjes per laag, ${getoond.join(', ')}`,
      ),
    fields: [
      F(`Laag ${k} heeft`, b.laag(k), 'blokjes'),
      { ...F(`Met ${n} lagen zijn het samen`, samen(n), 'blokjes'), br: true },
      { ...F(`Met ${doel} blokjes heeft het bouwwerk`, n2, 'lagen'), br: true },
    ],
    hint: T(
      'Laag 1 is de bovenste laag. Kijk in de tabel hoe de lagen groter worden. Tel voor het totaal alle lagen op, ook de blokjes die je niet ziet.',
    ),
    steps: [
      b.reken(k),
      `Met ${n} lagen: ${lagen(n).join(' + ')} = ${samen(n)} blokjes.`,
      `Tel in een tabel verder op, tot het totaal ${doel} is:`,
      H(
        dt(
          [
            ['laag', ...rij(tot(n2))],
            ['blokjes', ...rij(lagen(n2))],
            ['totaal', ...rij(opgeteld)],
          ],
          `Ingevulde tabel: blokjes per laag tot ${doel} blokjes`,
        ),
      ),
      `Bij ${n2} lagen is het totaal ${doel}. Dus het bouwwerk heeft ${n2} lagen.`,
    ],
    traps: [
      valkuil('alleen-zichtbare', b.zicht, [
        [0, b.zichtbaar(k), b.laag(k)],
        [1, som(tot(n).map(b.zichtbaar)), samen(n)],
      ]),
      valkuil(
        'laag-vergeten',
        `Je bent een laag vergeten. Tel alle ${n} lagen op, van de bovenste tot de onderste.`,
        [
          [1, samen(n - 1), samen(n)],
          [1, samen(n) - b.laag(1), samen(n)],
        ],
      ),
      valkuil(
        'onderste-laag-als-totaal',
        'Dat is alleen de onderste laag. Tel de blokjes van alle lagen bij elkaar op.',
        [[1, b.laag(n), samen(n)]],
      ),
      valkuil(
        'lagen-verkeerd-geteld',
        'Tel de lagen een voor een op en houd bij hoeveel blokjes je samen hebt. Stop als je precies op het totaal uitkomt, en tel dan hoeveel lagen je hebt gebruikt.',
        [
          [2, n2 - 1, n2],
          [2, n2 + 1, n2],
        ],
      ),
    ].filter(Boolean),
    // Tel per stapel: hoe hoog is elke stapel blokjes? Laag k van boven ligt op hoogte j - k + 1
    // in een bouwwerk van j lagen.
    v: () => {
      const j = Math.max(n, k),
        inLaag = b.kolommen(j).filter((h) => h >= j - k + 1).length;
      return (
        inLaag === b.laag(k) &&
        som(b.kolommen(n)) === samen(n) &&
        som(b.kolommen(n2)) === doel &&
        som(b.kolommen(n2 - 1)) < doel
      );
    },
  };
}

// Een balk van blokjes die je aanvult tot de kleinste kubus.
function aanvullen() {
  const naam = pick(NAMEN),
    [l, b, h] = until(
      () => [ri(2, 6), ri(2, 5), ri(2, 5)],
      ([l, b, h]) => !(l === b && b === h),
    ),
    m = Math.max(l, b, h),
    kubus = m ** 3,
    balk = l * b * h,
    erbij = kubus - balk;
  return {
    q: T(
      `${naam} heeft een balk gebouwd van gelijke blokjes: ${l} blokjes lang, ${b} blokjes breed en ${h} blokjes hoog. ${naam} wil er een kubus van maken door er blokjes bij te zetten. De kubus moet zo klein mogelijk zijn. Hoe lang is de ribbe van de kubus? Hoeveel blokjes zitten er in de kubus? En hoeveel blokjes moet ${naam} erbij zetten?`,
    ),
    fig: solid({
      kind: 'balk',
      l,
      b,
      h,
      letters: false,
      counts: false,
      len: { AB: stuks(l), EH: stuks(b), AE: stuks(h) },
    }),
    fields: [
      F('Ribbe van de kubus:', m, 'blokjes'),
      { ...F('Blokjes in de kubus:', kubus), br: true },
      { ...F('Blokjes erbij:', erbij), br: true },
    ],
    hint: T(
      'De balk moet helemaal in de kubus passen. Kijk dus naar de langste kant. Reken daarna uit hoeveel blokjes er in de kubus en in de balk zitten.',
    ),
    steps: [
      `De langste kant van de balk is ${m} blokjes. De kubus wordt dus ${m} bij ${m} bij ${m}.`,
      `Kubus: ${m}*${m}*${m} = ${kubus} blokjes.`,
      `Balk: ${l}*${b}*${h} = ${balk} blokjes.`,
      `Erbij: ${kubus} - ${balk} = ${erbij} blokjes.`,
    ],
    traps: [
      valkuil(
        'kleinste-kant',
        'De balk moet helemaal in de kubus passen. De ribbe van de kubus is dus de langste kant van de balk.',
        [[0, Math.min(l, b, h), m]],
      ),
      valkuil(
        'keer-3-in-plaats-van-macht',
        'Een kubus heeft evenveel lagen als de ribbe lang is, en elke laag is een vierkant. Reken dus ribbe*ribbe*ribbe, en niet 3*ribbe.',
        [
          [1, 3 * m, kubus],
          [2, 3 * m - balk, erbij],
        ],
      ),
      valkuil(
        'maar-een-laag',
        'Je hebt maar één laag van de kubus geteld. Een kubus heeft evenveel lagen als de ribbe lang is.',
        [
          [1, m * m, kubus],
          [2, m * m - balk, erbij],
        ],
      ),
      valkuil(
        'kubus-niet-afgetrokken',
        'Dat zijn alle blokjes van de kubus. De blokjes van de balk heb je al, die trek je eraf.',
        [[2, kubus, erbij]],
      ),
    ].filter(Boolean),
    // Tel per laag van de kubus wat erbij moet: in de lagen van de balk de rest van het vierkant,
    // daarboven het hele vierkant.
    v: () => {
      const perLaag = tot(m).map((j) => (j <= h ? m * m - l * b : m * m));
      return (
        [l, b, h].every((x) => x <= m) &&
        [l, b, h].some((x) => x === m) &&
        som(perLaag) === erbij &&
        som(tot(m).map(() => m * m)) === kubus
      );
    },
  };
}

// Uit een aantal blokjes de grootste kubus bouwen. Een kubus met ribbe k heeft k^3 blokjes.
const DINGEN = [
  ['blokje', 'blokjes'],
  ['suikerklontje', 'suikerklontjes'],
  ['dobbelsteen', 'dobbelstenen'],
  ['houten kubusje', 'houten kubusjes'],
];
// Om een kubus met ribbe j een blokje groter te maken, zijn er 3j^2 + 3j + 1 blokjes nodig.
const schil = (j) => 3 * j * j + 3 * j + 1;
function grootsteKubus() {
  const naam = pick(NAMEN),
    [een, meer] = pick(DINGEN),
    k = ri(2, 7),
    r = ri(0, 3 * k * k + 3 * k),
    N = k ** 3 + r,
    volgende = coin(),
    nodig = (k + 1) ** 3 - N;
  const fields = [
    F('Ribbe van de kubus:', k, meer),
    { ...F('Over:', r, meer), br: true },
    ...(volgende ? [{ ...F('Nog nodig:', nodig, meer), br: true }] : []),
  ];
  return {
    q: T(
      `${naam} heeft ${stuks(N, een, meer)}. ${naam} bouwt daarmee een zo groot mogelijke kubus, helemaal vol en zonder gaten. Hoe lang is de ribbe van de kubus? En hoeveel ${meer} houdt ${naam} over?${volgende ? ` Hoeveel ${meer} zijn er nog nodig voor een kubus met een ribbe die 1 langer is?` : ''}`,
    ),
    fields,
    hint: T(
      'Een kubus met een ribbe van 3 heeft 3 lagen van 3 bij 3, dus 3*3*3 = 27. Probeer zo een paar kubussen, tot je er een vindt die te groot is.',
    ),
    steps: [
      `Probeer kubussen: ${tot(k + 1)
        .slice(1)
        .map((j) => `${j}*${j}*${j} = ${j ** 3}`)
        .join(', ')}.`,
      `${(k + 1) ** 3} is meer dan ${N}. Dus de grootste kubus heeft een ribbe van ${k} ${meer}, met ${k ** 3} ${meer}.`,
      `Over: ${N} - ${k ** 3} = ${r} ${r === 1 ? een : meer}.`,
      ...(volgende
        ? [
            `Een kubus met een ribbe van ${k + 1} heeft ${(k + 1) ** 3} ${meer}. Nog nodig: ${(k + 1) ** 3} - ${N} = ${nodig}.`,
          ]
        : []),
    ],
    traps: [
      valkuil(
        'keer-3-in-plaats-van-macht',
        'Een kubus heeft evenveel lagen als de ribbe lang is, en elke laag is een vierkant. Het aantal is dus ribbe*ribbe*ribbe, en niet 3*ribbe.',
        [[0, Math.floor(N / 3), k]],
      ),
      valkuil(
        'maar-een-laag',
        'Een kubus is niet één laag. Een kubus heeft evenveel lagen als de ribbe lang is, dus het aantal is ribbe*ribbe*ribbe.',
        [
          [0, Math.floor(Math.sqrt(N)), k],
          [1, N - k * k, r],
        ],
      ),
      valkuil(
        'te-grote-kubus',
        `Een kubus met een ribbe van ${k + 1} heeft ${k + 1}*${k + 1}*${k + 1} = ${(k + 1) ** 3} ${meer}. Zoveel heeft ${naam} niet.`,
        [[0, k + 1, k]],
      ),
      ...(volgende
        ? [
            valkuil(
              'kubus-niet-afgetrokken',
              `Dat zijn alle ${meer} van de grotere kubus. ${naam} heeft er al ${N}, die trek je eraf.`,
              [[2, (k + 1) ** 3, nodig]],
            ),
            valkuil(
              'over-vergeten',
              `De ${meer} die ${naam} overhoudt, gebruik je ook voor de grotere kubus.`,
              [[2, schil(k), nodig]],
            ),
          ]
        : []),
    ].filter(Boolean),
    // Bouw de kubus schil voor schil: steeds een laagje erbij, tot de volgende schil niet meer past.
    v: () => {
      let ribbe = 0,
        gebruikt = 0;
      for (; gebruikt + schil(ribbe) <= N; ribbe++) gebruikt += schil(ribbe);
      return (
        ribbe === k &&
        N - gebruikt === r &&
        Math.floor(Math.cbrt(N) + 1e-9) === k &&
        (!volgende || gebruikt + schil(ribbe) - N === nodig)
      );
    },
  };
}

// Een rij bouwwerken die volgens een patroon groeit. waarde(n) is het aantal blokjes van figuur n
// zoals de uitwerking het uitrekent, na(n) rekent het op een andere manier: optellen tegenover een
// formule. reken(n) is de stap in de uitwerking.
const ophoog = (n, stap) => som(tot(n).map(stap));
const PATRONEN = {
  trap: () => ({
    tekst:
      'Elke figuur is een trap van blokjes. Figuur 1 is 1 blokje. Bij elke volgende figuur komt er rechts een stapel bij die 1 blokje hoger is dan de vorige.',
    waarde: (n) => ophoog(n, (j) => j),
    na: (n) => (n * (n + 1)) / 2,
    reken: (n) => `Figuur ${n}: ${tot(n).join(' + ')} = ${ophoog(n, (j) => j)}`,
    terug: (m, N) => `Tel verder op: figuur ${m} heeft ${tot(m).join(' + ')} = ${N} blokjes.`,
    bereik: [8, 12],
    terugBereik: [6, 14],
  }),
  plaat: () => ({
    tekst:
      'Elke figuur is een vierkante plaat van één laag blokjes. Bij elke volgende figuur is de plaat 1 blokje langer en 1 blokje breder.',
    waarde: (n) => n * n,
    // De oneven getallen optellen: 1 + 3 + 5 + ... geeft de kwadraten.
    na: (n) => ophoog(n, (j) => 2 * j - 1),
    reken: (n) => `Figuur ${n} is ${n} bij ${n}, dus ${n}*${n} = ${n * n}`,
    terug: (m, N) => `Zoek welk getal keer zichzelf ${N} is: ${m}*${m} = ${N}.`,
    bereik: [8, 15],
    terugBereik: [6, 15],
  }),
  kubus: () => ({
    tekst:
      'Elke figuur is een volle kubus van blokjes. Bij elke volgende figuur is de ribbe 1 blokje langer.',
    waarde: (n) => n ** 3,
    na: (n) => ophoog(n, (j) => schil(j - 1)),
    reken: (n) => `Figuur ${n} is ${n} bij ${n} bij ${n}, dus ${n}*${n}*${n} = ${n ** 3}`,
    terug: (m, N) =>
      `Zoek welk getal drie keer met zichzelf vermenigvuldigd ${N} is: ${m}*${m}*${m} = ${N}.`,
    bereik: [5, 8],
    terugBereik: [5, 9],
  }),
  rij: (s, t) => ({
    tekst: 'Bij elke volgende figuur komen er evenveel blokjes bij.',
    waarde: (n) => s + (n - 1) * t,
    na: (n) => ophoog(n, (j) => (j === 1 ? s : t)),
    reken: (n) =>
      `Er komen steeds ${t} blokjes bij. Van figuur 1 naar figuur ${n} zijn ${n - 1} stappen: ${s} + ${n - 1}*${t} = ${s} + ${(n - 1) * t} = ${s + (n - 1) * t}`,
    terug: (m, N) =>
      `${N} - ${s} = ${N - s}, en ${N - s} : ${t} = ${m - 1} stappen na figuur 1. Dus figuur ${m}.`,
    bereik: [10, 25],
    terugBereik: [8, 30],
  }),
};

function patroon() {
  const naam = pick(NAMEN),
    soort = pick(['trap', 'plaat', 'kubus', 'rij']),
    [s, t] = until(
      () => [ri(2, 6), ri(2, 5)],
      ([s, t]) => s !== t,
    ),
    p = PATRONEN[soort](s, t),
    [n, m] = until(
      () => [ri(...p.bereik), ri(...p.terugBereik)],
      ([n, m]) => n !== m,
    ),
    y = p.waarde(n),
    N = p.waarde(m),
    getoond = tot(4).map(p.waarde);
  const extra = {
    trap: [
      [
        'alleen-hoogste-stapel',
        'Dat is alleen de hoogste stapel. Tel de blokjes van alle stapels op.',
        [[0, n, y]],
      ],
      [
        'stapel-vergeten',
        `Je bent een stapel vergeten. Figuur ${n} heeft ${n} stapels.`,
        [[0, p.waarde(n - 1), y]],
      ],
    ],
    plaat: [
      [
        'keer-2-in-plaats-van-kwadraat',
        'Een plaat van 4 bij 4 heeft 4 rijen van 4 blokjes, dus 4*4 blokjes, en niet 2*4.',
        [
          [0, 2 * n, y],
          [1, N / 2, m],
        ],
      ],
    ],
    kubus: [
      [
        'keer-3-in-plaats-van-macht',
        'Een kubus heeft evenveel lagen als de ribbe lang is, en elke laag is een vierkant. Reken dus ribbe*ribbe*ribbe, en niet 3*ribbe.',
        [
          [0, 3 * n, y],
          [1, N / 3, m],
        ],
      ],
      [
        'maar-een-laag',
        'Je hebt maar één laag van de kubus geteld. Een kubus heeft evenveel lagen als de ribbe lang is.',
        [[0, n * n, y]],
      ],
      [
        'alleen-zichtbare',
        'Je hebt alleen de blokjes geteld die je van voren, van boven en van opzij ziet. Daarachter en daaronder zitten ook blokjes.',
        [[0, n ** 3 - (n - 1) ** 3, y]],
      ],
    ],
    rij: [
      [
        'stap-te-veel',
        `Van figuur 1 naar figuur ${n} zijn ${n - 1} stappen, niet ${n}.`,
        [[0, s + n * t, y]],
      ],
      [
        'begin-vergeten',
        `Figuur 1 heeft al ${s} blokjes. Begin daarmee en tel er dan de stappen bij.`,
        [[0, n * t, y]],
      ],
    ],
  }[soort];
  return {
    q:
      T(
        `${naam} maakt een rij bouwwerken van gelijke blokjes: figuur 1, figuur 2, figuur 3, enzovoort. ${p.tekst} In de tabel zie je hoeveel blokjes de eerste vier figuren hebben. Hoeveel blokjes heeft figuur ${n}? En welke figuur heeft ${N} blokjes?`,
      ) +
      dt(
        [
          ['figuur', ...tot(4).map(String)],
          ['blokjes', ...getoond.map(String)],
        ],
        `Tabel: blokjes per figuur, ${getoond.join(', ')}`,
      ),
    fields: [
      F(`Figuur ${n} heeft`, y, 'blokjes'),
      { ...F(`${N} blokjes heeft figuur`, m), br: true, label: `Figuur met ${N} blokjes` },
    ],
    hint: T(
      'Kijk in de tabel en in de tekst hoe het aantal blokjes groeit. Bedenk hoe je het aantal bij een figuurnummer uitrekent, zonder alle figuren te tekenen.',
    ),
    steps: [p.reken(n) + '.', p.terug(m, N)],
    traps: [
      ...extra.map(([id, bericht, paren]) => valkuil(id, bericht, paren)),
      valkuil(
        'figuur-verschoven',
        'Reken na hoeveel blokjes de figuur met jouw nummer heeft. Tel figuur 1 ook mee.',
        [
          [1, m - 1, m],
          [1, m + 1, m],
        ],
      ),
    ].filter(Boolean),
    // Reken de rij op een andere manier na. Het aantal groeit steeds, dus alleen figuur m heeft er N.
    v: () => p.na(n) === y && p.na(m) === N && p.na(m - 1) < N && p.na(m + 1) > N,
  };
}

export default {
  slug: 'blokjes-tellen',
  title: 'Blokjes tellen',
  intro:
    'Een bouwwerk van gelijke blokjes tel je het handigst per laag. Hier tel je blokjes in lagen, vul je een balk aan tot een kubus en bouw je de grootste kubus uit een stapel blokjes. Ook zoek je het patroon in een rij bouwwerken.',
  description:
    'Blokjes tellen oefenen: bouwwerken per laag tellen, een balk aanvullen tot een kubus en patronen in een rij bouwwerken. Havo/vwo 1, gratis met uitleg.',
  videos: {},
  skills: [
    [158, 'Blokjes in lagen tellen', inLagen],
    [159, 'Aanvullen tot een kubus', aanvullen],
    [160, 'Blokjes over bij de grootste kubus', grootsteKubus],
    [161, 'Een rij bouwwerken met een patroon', patroon],
  ],
  learn: [
    {
      t: 'Blokjes in lagen',
      p: [
        'Een bouwwerk van gelijke blokjes tel je per laag. Tel eerst hoeveel blokjes er in elke laag zitten, en tel die aantallen daarna op.',
        'Een laag van 4 bij 3 blokjes heeft 4*3 = 12 blokjes. Zet de lagen in een tabel, met het totaal eronder.',
      ],
      ex: {
        q: T(
          'Een toren heeft drie lagen. De bovenste laag is 1 bij 2, de middelste 2 bij 3 en de onderste 3 bij 4. Hoeveel blokjes zijn het samen?',
        ),
        steps: ['1*2 = 2, 2*3 = 6 en 3*4 = 12.', 'Samen: 2 + 6 + 12 = 20 blokjes.'],
      },
      watch: T(
        'Tel ook de blokjes die je niet ziet. Midden in een grote laag en onder een andere laag zitten ook blokjes.',
      ),
    },
    {
      t: 'Aanvullen tot een kubus',
      p: [
        'Een kubus met een ribbe van 4 blokjes heeft 4 lagen van 4 bij 4. Dat zijn 4*4*4 = 64 blokjes.',
        'Wil je een balk aanvullen tot een kubus, dan moet de balk in de kubus passen. De ribbe van de kubus is dan de langste kant van de balk. Het aantal blokjes erbij is de kubus min de balk.',
      ],
      ex: {
        q: T(
          'Een balk is 4 blokjes lang, 2 blokjes breed en 3 blokjes hoog. Hoeveel blokjes moeten erbij voor de kleinste kubus?',
        ),
        steps: [
          'De langste kant is 4, dus de kubus is 4 bij 4 bij 4.',
          'Kubus: 4*4*4 = 64. Balk: 4*2*3 = 24.',
          'Erbij: 64 - 24 = 40 blokjes.',
        ],
      },
      watch: T('Een kubus met ribbe 4 heeft 4*4*4 = 64 blokjes, en niet 3*4 = 12.'),
    },
    {
      t: 'De grootste kubus',
      p: [
        'Met een aantal blokjes bouw je de grootste kubus door kubussen te proberen: 2*2*2 = 8, 3*3*3 = 27, 4*4*4 = 64, enzovoort. Stop bij de eerste kubus die te groot is. De kubus ervoor is de grootste die past.',
      ],
      ex: {
        q: T(
          'Je hebt 100 blokjes. Hoe groot is de grootste kubus, en hoeveel blokjes houd je over?',
        ),
        steps: [
          '4*4*4 = 64 en 5*5*5 = 125.',
          '125 is meer dan 100, dus de ribbe is 4 blokjes.',
          'Over: 100 - 64 = 36 blokjes.',
        ],
      },
    },
    {
      t: 'Een rij bouwwerken',
      p: [
        'Bij een rij bouwwerken groeit het aantal blokjes volgens een patroon. Zet de figuurnummers en de aantallen in een tabel en kijk wat er steeds bij komt.',
        'Komen er steeds evenveel blokjes bij, dan tel je vanaf figuur 1 het aantal stappen. Van figuur 1 naar figuur 10 zijn 9 stappen.',
      ],
      ex: {
        q: T(
          'Figuur 1 heeft 5 blokjes, en bij elke figuur komen er 3 bij. Hoeveel blokjes heeft figuur 10?',
        ),
        steps: ['Van figuur 1 naar figuur 10 zijn 9 stappen.', '5 + 9*3 = 5 + 27 = 32 blokjes.'],
      },
      watch: T(
        'Is elke figuur een vierkant of een kubus van blokjes, dan reken je met n*n of n*n*n, en niet met 2*n of 3*n.',
      ),
    },
  ],
};
