// Onderwerp: Ruimtefiguren herkennen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { pick, coin, shuffle, until, near } from '../math.js';
import { H, F, MC } from './shared.js';
import { T } from '../typeset.js';
import { net, solid, solidFacts } from '../ruimtefiguren.js';
import { isCubeNet, cubeFaces, CUBE_NETS, canonicalNet, notCubeNets, boxFaces } from '../ruimte.js';

const HOEK = { 3: 'driehoek', 4: 'vierhoek', 5: 'vijfhoek', 6: 'zeshoek' };
const WORD = { 3: 'drie', 4: 'vier', 5: 'vijf', 6: 'zes' };
const MEEST_PRECIES = 'Kies de naam die het meest precies is.';

// De berichten die bij meer vraagsoorten horen.
const PIRAMIDE_HEEFT_TOP =
  'Een piramide heeft een top, waar de opstaande ribben in één punt samenkomen. Deze figuur heeft een bovenvlak dat gelijk is aan het grondvlak.';

// Foute keuzes bij het geven van een naam: [naam, id van de valkuil, bericht].
const WRONG_NAME = {
  kubus: [
    [
      'balk',
      'kubus-en-balk-verwisseld',
      'Een kubus is ook een balk. Maar hier zijn alle ribben even lang, en dan heet het een kubus. Kies de naam die het meest precies is.',
    ],
    [
      'prisma',
      'minder-precieze-naam',
      'Een kubus is ook een prisma, met een vierkant als grondvlak. Maar kubus is de naam die het meest precies is.',
    ],
    ['piramide', 'prisma-en-piramide-verwisseld', PIRAMIDE_HEEFT_TOP],
    [
      'dobbelsteen',
      'dagelijkse-naam',
      'Een dobbelsteen is een voorwerp met deze vorm. De wiskundige naam van de vorm is kubus.',
    ],
  ],
  balk: [
    [
      'kubus',
      'kubus-en-balk-verwisseld',
      'Bij een kubus zijn alle ribben even lang. Hier niet, dus dit is een balk.',
    ],
    [
      'prisma',
      'minder-precieze-naam',
      'Een balk is ook een prisma, met een rechthoek als grondvlak. Maar balk is de naam die het meest precies is.',
    ],
    ['piramide', 'prisma-en-piramide-verwisseld', PIRAMIDE_HEEFT_TOP],
    [
      'doos',
      'dagelijkse-naam',
      'Een doos heeft vaak deze vorm, maar doos is geen wiskundige naam. De wiskundige naam is balk.',
    ],
  ],
  prisma: [
    [
      'piramide',
      'prisma-en-piramide-verwisseld',
      'Een piramide heeft één grondvlak en een top. Deze figuur heeft twee gelijke vlakken tegenover elkaar, met rechthoeken ertussen. Dat is een prisma.',
    ],
    [
      'balk',
      'balk-heeft-rechthoeken',
      'Een balk heeft zes rechthoeken als zijvlakken. Hier zijn twee zijvlakken geen rechthoek.',
    ],
    [
      'cilinder',
      'platte-en-gebogen-verwisseld',
      'Een cilinder heeft een gebogen zijvlak. Deze figuur heeft alleen platte zijvlakken.',
    ],
  ],
  piramide: [
    [
      'prisma',
      'prisma-en-piramide-verwisseld',
      'Een prisma heeft een grondvlak en een bovenvlak die gelijk zijn. Deze figuur heeft geen bovenvlak, maar een top.',
    ],
    [
      'kegel',
      'platte-en-gebogen-verwisseld',
      'Een kegel heeft een gebogen zijvlak. Deze figuur heeft alleen platte zijvlakken.',
    ],
    [
      'driehoek',
      'platte-figuur',
      'Een driehoek is een platte figuur, geen ruimtefiguur. Wel zijn de opstaande zijvlakken hier driehoeken.',
    ],
  ],
  cilinder: [
    [
      'kegel',
      'kegel-en-cilinder-verwisseld',
      'Een kegel heeft maar één cirkel en een top. Deze ruimtefiguur heeft twee cirkels.',
    ],
    [
      'prisma',
      'platte-en-gebogen-verwisseld',
      'Een prisma heeft alleen platte zijvlakken. Deze ruimtefiguur heeft ook een gebogen zijvlak.',
    ],
    [
      'cirkel',
      'platte-figuur',
      'Een cirkel is een platte figuur. Hier zijn de cirkels de platte zijvlakken van een ruimtefiguur.',
    ],
    [
      'buis',
      'dagelijkse-naam',
      'Buis is geen wiskundige naam. Een ruimtefiguur met twee cirkels en een gebogen zijvlak ertussen heet een cilinder.',
    ],
  ],
  kegel: [
    [
      'cilinder',
      'kegel-en-cilinder-verwisseld',
      'Een cilinder heeft twee cirkels, tegenover elkaar. Deze ruimtefiguur heeft één cirkel en een top.',
    ],
    [
      'piramide',
      'platte-en-gebogen-verwisseld',
      'Een piramide heeft alleen platte zijvlakken. Deze ruimtefiguur heeft een gebogen zijvlak.',
    ],
    [
      'cirkel',
      'platte-figuur',
      'Een cirkel is een platte figuur. Hier is de cirkel het platte zijvlak van een ruimtefiguur.',
    ],
    [
      'punthoed',
      'dagelijkse-naam',
      'Punthoed is geen wiskundige naam. Een ruimtefiguur met een cirkel en een gebogen zijvlak naar een top heet een kegel.',
    ],
  ],
  bol: [
    [
      'cirkel',
      'platte-figuur',
      'Een cirkel is plat. Een bol is rond in alle richtingen, het is een ruimtefiguur.',
    ],
    [
      'cilinder',
      'platte-en-gebogen-verwisseld',
      'Een cilinder heeft ook twee platte zijvlakken. Deze ruimtefiguur heeft alleen een gebogen zijvlak.',
    ],
    [
      'kegel',
      'kegel-en-bol-verwisseld',
      'Een kegel heeft een plat zijvlak en een top. Deze ruimtefiguur heeft geen platte zijvlakken.',
    ],
    [
      'bal',
      'dagelijkse-naam',
      'Een bal is een voorwerp met deze vorm. De wiskundige naam van de vorm is bol.',
    ],
  ],
};

// Ruimtefiguren die solid() niet tekent, beschreven in woorden. flat en curved zijn de aantallen
// platte en gebogen zijvlakken, circles hoeveel platte zijvlakken een cirkel zijn.
const ROUND = {
  cilinder: {
    flat: 2,
    curved: 1,
    circles: 2,
    top: false,
    text: 'Een ruimtefiguur heeft drie zijvlakken. Twee zijvlakken zijn plat: het zijn even grote cirkels, recht tegenover elkaar. Het derde zijvlak is gebogen en zit tussen de twee cirkels in.',
    steps: [
      'Er zijn twee platte zijvlakken, en dat zijn even grote cirkels.',
      'Daartussen zit één gebogen zijvlak.',
      'Dus het is een cilinder.',
    ],
  },
  kegel: {
    flat: 1,
    curved: 1,
    circles: 1,
    top: true,
    text: 'Een ruimtefiguur heeft twee zijvlakken. Het ene zijvlak is plat: een cirkel. Het andere zijvlak is gebogen. Het loopt van de rand van de cirkel naar één punt, de top.',
    steps: [
      'Er is één plat zijvlak, en dat is een cirkel.',
      'Het gebogen zijvlak loopt naar een top.',
      'Dus het is een kegel.',
    ],
  },
  bol: {
    flat: 0,
    curved: 1,
    circles: 0,
    top: false,
    text: 'Een ruimtefiguur heeft maar één zijvlak, en dat is gebogen. Elk punt van dat zijvlak ligt even ver van het middelpunt.',
    steps: [
      'Er zijn geen platte zijvlakken.',
      'Het gebogen zijvlak ligt overal even ver van het middelpunt.',
      'Dus het is een bol.',
    ],
  },
};
// De naam bij de zijvlakken van een ronde ruimtefiguur, zonder de naam zelf te gebruiken.
function roundKind({ flat, curved, circles, top }) {
  if (!curved) return null;
  if (!flat) return 'bol';
  if (circles === 1 && flat === 1 && top) return 'kegel';
  if (circles === 2 && flat === 2 && !top) return 'cilinder';
  return null;
}

// De naam bij een getekende ruimtefiguur, uitgerekend uit de hoekpunten (solidFacts).
function drawnKind(f) {
  const P = f.pts,
    vec = (a, b) => P[b].map((c, i) => c - P[a][i]),
    dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2],
    len = ([a, b]) => Math.hypot(...vec(a, b));
  if (f.top.length === 1) return 'piramide';
  if (f.n !== 4) return 'prisma';
  // Een prisma met een vierhoek als grondvlak is een balk als alle hoeken recht zijn.
  const base = [...f.base],
    up = vec(base[0], f.top[0]),
    right = base.every((k, i) => {
      const p = vec(k, base[(i + 3) % 4]),
        q = vec(k, base[(i + 1) % 4]);
      return near(dot(p, q), 0, 1e-9) && near(dot(p, up), 0, 1e-9);
    });
  if (!right) return 'prisma';
  const ls = f.edges.map(len);
  return ls.every((x) => near(x, ls[0], 1e-9)) ? 'kubus' : 'balk';
}

// Opties voor solid(). Een label beschrijft de vorm voor een schermlezer, zonder de naam.
function drawnSolid(kind) {
  if (kind === 'kubus') {
    const l = pick([3, 4]);
    return {
      kind,
      l,
      len: { AB: l, AE: l, EH: l },
      label: 'Ruimtefiguur met zes vierkanten als zijvlakken,',
      steps: [
        'Alle zijvlakken zijn vierkanten, en alle ribben zijn even lang.',
        'Een kubus is ook een balk, maar kubus zegt het meest.',
        'Dus het is een kubus.',
      ],
    };
  }
  if (kind === 'balk') {
    const [l, b, h] = until(
      () => [pick([3, 4, 5, 6]), pick([2, 3]), pick([2, 3, 4])],
      ([l, b, h]) => l !== h && !(l === b && b === h),
    );
    return {
      kind,
      l,
      b,
      h,
      len: { AB: l, EH: b, AE: h },
      label: 'Ruimtefiguur met zes rechthoeken als zijvlakken,',
      steps: [
        'Alle zijvlakken zijn rechthoeken, en de ribben zijn niet allemaal even lang.',
        'Een balk is ook een prisma, maar balk zegt het meest.',
        'Dus het is een balk.',
      ],
    };
  }
  if (kind === 'prisma') {
    const n = pick([3, 5, 6]),
      lying = coin();
    return {
      kind,
      n,
      lying,
      h: lying ? 4 : 3,
      label: `Ruimtefiguur met twee gelijke ${HOEK[n]}en tegenover elkaar en ${WORD[n]} rechthoeken ertussen,`,
      steps: [
        lying
          ? `Vooraan en achteraan zitten twee gelijke ${HOEK[n]}en.`
          : `Het grondvlak en het bovenvlak zijn twee gelijke ${HOEK[n]}en.`,
        'De zijvlakken ertussen zijn rechthoeken.',
        'Dus het is een prisma.',
      ],
    };
  }
  const n = pick([3, 4, 5, 6]);
  return {
    kind,
    n,
    h: 3,
    label: `Ruimtefiguur met een ${HOEK[n]} als grondvlak en ${WORD[n]} driehoeken die samenkomen in één punt,`,
    steps: [
      `Het grondvlak is een ${HOEK[n]}.`,
      'De andere zijvlakken zijn driehoeken. Ze komen samen in één punt, de top.',
      'Dus het is een piramide.',
    ],
  };
}

// Kies de goede naam en drie foute, met een valkuil bij elke foute keuze.
function nameChoices(kind, wrongs) {
  const ws = shuffle(wrongs).slice(0, 3);
  return {
    mc: MC([kind, ...ws.map((w) => w[0])], 0),
    traps: ws.map(([name, id, m]) => ({ id, f: (v) => v[0] === name, m })),
  };
}

function s11name() {
  const kind = pick(['kubus', 'balk', 'prisma', 'piramide', 'cilinder', 'kegel', 'bol']);
  const { mc, traps } = nameChoices(kind, WRONG_NAME[kind]);
  const hint =
    'Kijk eerst of er gebogen zijvlakken zijn. Zijn alle zijvlakken plat, kijk dan of de figuur een top heeft of twee gelijke vlakken tegenover elkaar.';
  if (ROUND[kind]) {
    const r = ROUND[kind];
    return {
      q: T(`${r.text} Hoe heet deze ruimtefiguur? ${MEEST_PRECIES}`),
      mc,
      hint,
      steps: r.steps,
      traps,
      v: () => roundKind(r) === kind,
    };
  }
  const { steps, ...opts } = drawnSolid(kind),
    shape = { ...opts, letters: false, counts: false };
  return {
    q: T(`Hoe heet deze ruimtefiguur? ${MEEST_PRECIES}`),
    fig: solid(shape),
    mc,
    hint,
    steps,
    traps,
    v: () => drawnKind(solidFacts(shape)) === kind,
  };
}

// Voorwerpen voor platte en gebogen zijvlakken. parts zijn de ruimtefiguren waaruit een voorwerp
// bestaat, met per deel [plat, gebogen]. weg is het aantal platte zijvlakken dat je niet meer ziet,
// omdat twee delen daar tegen elkaar zitten. Een gat is een gebogen zijvlak aan de binnenkant.
const PART = {
  cilinder: [2, 1],
  kegel: [1, 1],
  'halve bol': [1, 1],
  bol: [0, 1],
  kubus: [6, 0],
  balk: [6, 0],
  piramide: [5, 0],
  gat: [0, 1],
};
const THINGS = [
  {
    name: 'een cilinder',
    parts: ['cilinder'],
    weg: 0,
    flat: 2,
    curved: 1,
    rolls: true,
    steps: [
      'Platte zijvlakken: de twee cirkels, onder en boven. Dat zijn er 2.',
      'Gebogen zijvlakken: de wand rondom. Dat is er 1.',
      'Leg je een cilinder op de wand, dan kan hij rollen.',
    ],
  },
  {
    name: 'een kegel',
    parts: ['kegel'],
    weg: 0,
    flat: 1,
    curved: 1,
    rolls: true,
    steps: [
      'Platte zijvlakken: de cirkel onderaan. Dat is er 1.',
      'Gebogen zijvlakken: de wand van de cirkel naar de top. Dat is er 1.',
      'Leg je een kegel op de wand, dan kan hij rollen, in een rondje om de top.',
    ],
  },
  {
    name: 'een bol',
    parts: ['bol'],
    weg: 0,
    flat: 0,
    curved: 1,
    rolls: true,
    steps: [
      'Een bol heeft geen platte zijvlakken.',
      'Gebogen zijvlakken: de buitenkant. Dat is er 1.',
      'Een bol kan alle kanten op rollen.',
    ],
  },
  {
    text: 'Een voorwerp bestaat uit een cilinder met bovenop een kegel. De cirkel van de kegel is even groot als de bovenkant van de cilinder, en ligt daar precies op.',
    parts: ['cilinder', 'kegel'],
    weg: 2,
    flat: 1,
    curved: 2,
    rolls: true,
    steps: [
      'De bovenkant van de cilinder en de cirkel van de kegel zitten tegen elkaar. Die zie je niet meer.',
      'Platte zijvlakken: alleen de cirkel onderaan de cilinder. Dat is er 1.',
      'Gebogen zijvlakken: de wand van de cilinder en de wand van de kegel. Dat zijn er 2.',
      'Op de wand van de cilinder kan het voorwerp rollen.',
    ],
  },
  {
    text: 'Een voorwerp bestaat uit een cilinder met aan elk uiteinde een kegel. De cirkels van de kegels zijn even groot als de uiteinden van de cilinder, en zitten er precies tegen.',
    parts: ['cilinder', 'kegel', 'kegel'],
    weg: 4,
    flat: 0,
    curved: 3,
    rolls: true,
    steps: [
      'Aan beide uiteinden zitten een cirkel van de cilinder en een cirkel van een kegel tegen elkaar. Die vier cirkels zie je niet meer.',
      'Er zijn dus geen platte zijvlakken.',
      'Gebogen zijvlakken: de wand van de cilinder en de wanden van de twee kegels. Dat zijn er 3.',
      'Op de wand van de cilinder kan het voorwerp rollen.',
    ],
  },
  {
    text: 'Een voorwerp bestaat uit twee even grote kegels. Ze zitten met hun cirkels precies tegen elkaar.',
    parts: ['kegel', 'kegel'],
    weg: 2,
    flat: 0,
    curved: 2,
    rolls: true,
    steps: [
      'De twee cirkels zitten tegen elkaar. Die zie je niet meer.',
      'Er zijn dus geen platte zijvlakken.',
      'Gebogen zijvlakken: de wanden van de twee kegels. Dat zijn er 2.',
      'Op een van de wanden kan het voorwerp rollen.',
    ],
  },
  {
    text: 'Een voorwerp bestaat uit een kegel met op zijn cirkel een halve bol. De platte kant van de halve bol is even groot als de cirkel van de kegel, en ligt er precies op.',
    parts: ['kegel', 'halve bol'],
    weg: 2,
    flat: 0,
    curved: 2,
    rolls: true,
    steps: [
      'De cirkel van de kegel en de platte kant van de halve bol zitten tegen elkaar. Die zie je niet meer.',
      'Er zijn dus geen platte zijvlakken.',
      'Gebogen zijvlakken: de wand van de kegel en de bolle kant van de halve bol. Dat zijn er 2.',
      'Met gebogen zijvlakken kan het voorwerp rollen.',
    ],
  },
  {
    text: 'Een voorwerp bestaat uit een kubus met bovenop een piramide. Het grondvlak van de piramide is even groot als het bovenvlak van de kubus, en ligt er precies op.',
    parts: ['kubus', 'piramide'],
    weg: 2,
    flat: 9,
    curved: 0,
    rolls: false,
    steps: [
      'Het bovenvlak van de kubus en het grondvlak van de piramide zitten tegen elkaar. Die zie je niet meer.',
      'Platte zijvlakken: nog 5 van de kubus en 4 driehoeken van de piramide. Dat zijn er 5 + 4 = 9.',
      'Er zijn geen gebogen zijvlakken.',
      'Met alleen platte zijvlakken kan het voorwerp niet rollen.',
    ],
  },
  {
    text: 'Een voorwerp bestaat uit een cilinder met bovenop een smallere cilinder. De smalle cilinder staat midden op de brede.',
    parts: ['cilinder', 'cilinder'],
    weg: 1,
    flat: 3,
    curved: 2,
    rolls: true,
    steps: [
      'De onderkant van de smalle cilinder zie je niet meer. Van de bovenkant van de brede cilinder zie je nog een ring.',
      'Platte zijvlakken: de onderkant, de ring en de bovenkant van de smalle cilinder. Dat zijn er 3.',
      'Gebogen zijvlakken: de wanden van de twee cilinders. Dat zijn er 2.',
      'Op de wand van de brede cilinder kan het voorwerp rollen.',
    ],
  },
  {
    text: 'Een voorwerp heeft de vorm van een cilinder met in het midden een rond gat, recht van de bovenkant naar de onderkant.',
    parts: ['cilinder', 'gat'],
    weg: 0,
    flat: 2,
    curved: 2,
    rolls: true,
    steps: [
      'Platte zijvlakken: de bovenkant en de onderkant. Door het gat zijn het ringen. Dat zijn er 2.',
      'Gebogen zijvlakken: de wand aan de buitenkant en de wand van het gat. Dat zijn er 2.',
      'Op de wand aan de buitenkant kan het voorwerp rollen.',
    ],
  },
  {
    text: 'Een voorwerp bestaat uit een balk met bovenop een kubus. De kubus staat midden op het bovenvlak van de balk, en is aan alle kanten smaller dan de balk.',
    parts: ['balk', 'kubus'],
    weg: 1,
    flat: 11,
    curved: 0,
    rolls: false,
    steps: [
      'Het grondvlak van de kubus zie je niet meer. Het bovenvlak van de balk zie je nog wel, rond de kubus.',
      'Platte zijvlakken: 6 van de balk en 5 van de kubus. Dat zijn er 6 + 5 = 11.',
      'Er zijn geen gebogen zijvlakken.',
      'Met alleen platte zijvlakken kan het voorwerp niet rollen.',
    ],
  },
  {
    text: 'Een voorwerp bestaat uit een kubus met bovenop een cilinder. De cilinder staat rechtop midden op het bovenvlak van de kubus, en is smaller dan de kubus.',
    parts: ['kubus', 'cilinder'],
    weg: 1,
    flat: 7,
    curved: 1,
    rolls: false,
    noRoll:
      'De wand van de cilinder raakt de tafel niet, want de kubus is breder. Het voorwerp ligt dus altijd op een plat zijvlak, en kan niet rollen.',
    steps: [
      'De onderkant van de cilinder zie je niet meer. Het bovenvlak van de kubus zie je nog wel, rond de cilinder.',
      'Platte zijvlakken: 6 van de kubus en de bovenkant van de cilinder. Dat zijn er 6 + 1 = 7.',
      'Gebogen zijvlakken: de wand van de cilinder. Dat is er 1.',
      'De wand van de cilinder raakt de tafel niet, want de kubus is breder. Het voorwerp ligt altijd op een plat zijvlak, dus het kan niet rollen.',
    ],
  },
];

function s11faces() {
  const t = pick(THINGS),
    yes = t.rolls ? 'ja' : 'nee',
    // Wat je krijgt als je de vlakken meetelt waar twee delen tegen elkaar zitten.
    naive = t.parts.reduce((s, p) => s + PART[p][0], 0),
    it = t.name ? t.name : 'het voorwerp',
    q = t.name
      ? `Hoeveel platte en hoeveel gebogen zijvlakken heeft ${t.name}? Kan ${t.name} rollen?`
      : `${t.text} Hoeveel platte en hoeveel gebogen zijvlakken heeft het voorwerp? Kan het voorwerp rollen?`;
  const traps = [
    t.flat !== t.curved && {
      id: 'platte-en-gebogen-verwisseld',
      f: (v) => v[0] === t.curved && v[1] === t.flat,
      m: 'Je hebt de platte en de gebogen zijvlakken verwisseld. Een plat zijvlak kun je plat op tafel leggen.',
    },
    naive !== t.flat && {
      id: 'plakvlak-meegeteld',
      f: (v) => v[0] === naive,
      m: 'Waar twee delen tegen elkaar zitten, zie je de vlakken niet meer. Die tel je niet mee.',
    },
    t.parts.includes('gat') && {
      id: 'binnenkant-vergeten',
      f: (v) => v[1] === t.curved - 1,
      m: 'De wand van het gat is ook een gebogen zijvlak.',
    },
    {
      id: t.rolls ? 'kan-wel-rollen' : 'kan-niet-rollen',
      f: (v) => !!v[2] && v[2] !== yes,
      m: t.rolls
        ? 'Dit voorwerp heeft een gebogen zijvlak. Leg je het daarop, dan kan het rollen.'
        : t.noRoll ||
          'Dit voorwerp heeft alleen platte zijvlakken. Dan kan het niet rollen, alleen kantelen.',
    },
  ].filter(Boolean);
  return {
    q: T(q),
    fields: [
      F('Platte zijvlakken:', t.flat),
      { ...F('Gebogen zijvlakken:', t.curved), br: true },
      {
        sel: ['ja', 'nee'],
        a: yes,
        pre: 'Kan het rollen?',
        label: `Kan ${it} rollen?`,
        br: true,
      },
    ],
    hint: t.name
      ? 'Een plat zijvlak kun je plat op tafel leggen. Een gebogen zijvlak is rond. Om te rollen is een gebogen zijvlak nodig.'
      : 'Tel de zijvlakken van elk deel. Waar twee delen tegen elkaar zitten, zie je de vlakken niet meer. Om te rollen is een gebogen zijvlak nodig.',
    steps: t.steps,
    traps,
    v: () =>
      t.parts.reduce((s, p) => s + PART[p][0], 0) - t.weg === t.flat &&
      t.parts.reduce((s, p) => s + PART[p][1], 0) === t.curved &&
      // Om te rollen is een gebogen zijvlak nodig. Kan een voorwerp met een gebogen zijvlak toch
      // niet rollen, dan staat erbij waarom.
      (t.rolls ? t.curved > 0 : t.curved === 0 || !!t.noRoll),
  };
}

// De acht standen van een vorm: draaien en spiegelen.
const TURNS = [
  ([x, y]) => [x, y],
  ([x, y]) => [-y, x],
  ([x, y]) => [-x, -y],
  ([x, y]) => [y, -x],
  ([x, y]) => [-x, y],
  ([x, y]) => [y, x],
  ([x, y]) => [x, -y],
  ([x, y]) => [-y, -x],
];
const turned = (cells) => {
  const t = pick(TURNS);
  return cells.map(t);
};
// De elf uitslagen van een kubus als tekst, in hun vaste stand.
const shapeKey = (cells) =>
  canonicalNet(cells)
    .map((c) => c.join(','))
    .join(' ');
const KNOWN = new Set(CUBE_NETS.map(shapeKey));
const inList = (cells) => cells.length === 6 && KNOWN.has(shapeKey(cells));
const choiceFig = (cells) => net({ cells, u: 16, grid: false, label: 'Keuze' });
// Een vlak dat maar aan één ander vlak vastzit. Haal je dat weg, dan blijft de rest één stuk.
const leaf = (cells) =>
  cells.findIndex(
    ([x, y]) => cells.filter(([a, b]) => Math.abs(a - x) + Math.abs(b - y) === 1).length === 1,
  );
// De uitslag van een kubus in de uitwerking, met op tegenover elkaar liggende vlakken hetzelfde getal.
const pairsFig = (cells) => {
  const faces = cubeFaces(cells),
    marks = Object.fromEntries(faces.map((f, i) => [i, String((f >> 1) + 1)]));
  return H(net({ cells, u: 24, grid: false, marks }));
};
const FOLD_HINT =
  'Een uitslag van een kubus heeft zes vlakken. Vouw de figuur in gedachten: elk vlak moet op een eigen zijvlak komen. Komen twee vlakken op dezelfde plek, dan is het geen uitslag van een kubus.';

function s11cubenet() {
  if (coin()) {
    // Welke figuur is wel een uitslag van een kubus?
    const base = pick(CUBE_NETS),
      good = turned(base),
      five = coin(),
      bad = shuffle(notCubeNets(base))
        .slice(0, five ? 2 : 3)
        .map(turned),
      short = five ? turned(base.filter((_, i) => i !== leaf(base))) : null,
      goodFig = choiceFig(good),
      badFigs = bad.map(choiceFig),
      shortFig = short ? choiceFig(short) : null;
    return {
      q: T('Welke figuur is een uitslag van een kubus?'),
      mc: MC([goodFig, ...badFigs, ...(short ? [shortFig] : [])], 0),
      hint: FOLD_HINT,
      steps: [
        'Kies een vlak als grondvlak en vouw de andere vlakken in gedachten omhoog.',
        pairsFig(good),
        'Vlakken met hetzelfde getal komen tegenover elkaar. Elk vlak komt op een eigen zijvlak, dus dit is een uitslag van een kubus.',
        short
          ? 'Bij twee andere figuren komen twee vlakken op dezelfde plek. Eén figuur heeft maar 5 vlakken.'
          : 'Bij de andere figuren komen twee vlakken op dezelfde plek, en blijft er een zijvlak open.',
      ],
      traps: [
        {
          id: 'twee-vlakken-op-elkaar',
          f: (v) => badFigs.includes(v[0]),
          m: 'Vouw deze figuur in gedachten. Dan komen twee vlakken op dezelfde plek, en blijft er een zijvlak open.',
        },
        ...(short
          ? [
              {
                id: 'vlak-vergeten',
                f: (v) => v[0] === shortFig,
                m: 'Deze figuur heeft maar 5 vlakken. Een kubus heeft 6 zijvlakken.',
              },
            ]
          : []),
      ],
      v: () =>
        isCubeNet(good) &&
        inList(good) &&
        [...bad, ...(short ? [short] : [])].every((c) => !isCubeNet(c) && !inList(c)),
    };
  }
  // Welke figuur is geen uitslag van een kubus?
  const goods = shuffle(CUBE_NETS).slice(0, 3),
    bad = turned(pick(notCubeNets(goods[0]))),
    shown = goods.map(turned),
    goodFigs = shown.map(choiceFig);
  return {
    q: T('Welke figuur is geen uitslag van een kubus?'),
    mc: MC([choiceFig(bad), ...goodFigs], 0),
    hint: FOLD_HINT,
    steps: [
      'Vouw elke figuur in gedachten.',
      H(
        net({
          cells: bad,
          u: 24,
          grid: false,
          label: 'De figuur die geen uitslag van een kubus is',
        }),
      ),
      'Als je deze figuur vouwt, komen twee vlakken op dezelfde plek, en blijft er een zijvlak open. Dus dit is geen uitslag van een kubus.',
      'De andere drie figuren zijn wel een uitslag van een kubus. Elk vlak komt daar op een eigen zijvlak.',
    ],
    traps: [
      {
        id: 'wel-een-uitslag-van-een-kubus',
        f: (v) => goodFigs.includes(v[0]),
        m: 'Deze figuur is wel een uitslag van een kubus. Vouw hem in gedachten: elk vlak komt op een eigen zijvlak.',
      },
    ],
    v: () => shown.every((c) => isCubeNet(c) && inList(c)) && !isCubeNet(bad) && !inList(bad),
  };
}

// Foute keuzes bij een uitslag van een ruimtefiguur: [naam, id van de valkuil, bericht].
const PIRAMIDE_DRIEHOEKEN =
  'Een piramide heeft driehoeken die samenkomen in een top. In deze uitslag van een ruimtefiguur zitten geen driehoeken.';
function wrongForNet(kind, n) {
  return {
    kubus: [
      [
        'balk',
        'kubus-en-balk-verwisseld',
        'Een kubus is ook een balk. Maar hier zijn alle vlakken even grote vierkanten, en dan heet het een kubus.',
      ],
      [
        'prisma',
        'minder-precieze-naam',
        'Een kubus is ook een prisma. Maar kubus is de naam die het meest precies is.',
      ],
      ['piramide', 'prisma-en-piramide-verwisseld', PIRAMIDE_DRIEHOEKEN],
    ],
    balk: [
      [
        'kubus',
        'kubus-en-balk-verwisseld',
        'Bij een uitslag van een kubus zijn alle vlakken even grote vierkanten. Hier niet, dus het is een balk.',
      ],
      [
        'prisma',
        'minder-precieze-naam',
        'Een balk is ook een prisma, met een rechthoek als grondvlak. Maar balk is de naam die het meest precies is.',
      ],
      ['piramide', 'prisma-en-piramide-verwisseld', PIRAMIDE_DRIEHOEKEN],
    ],
    prisma: [
      [
        'piramide',
        'prisma-en-piramide-verwisseld',
        `Een piramide heeft één grondvlak, en verder driehoeken die samenkomen in een top. Hier zijn twee gelijke ${HOEK[n]}en met rechthoeken ertussen.`,
      ],
      [
        'balk',
        'balk-heeft-rechthoeken',
        `Een balk heeft zes rechthoeken. Hier zijn twee vlakken ${HOEK[n]}en.`,
      ],
      [
        'cilinder',
        'platte-en-gebogen-verwisseld',
        'Een cilinder heeft twee cirkels. In deze uitslag van een ruimtefiguur zitten geen cirkels.',
      ],
    ],
    piramide: [
      [
        'prisma',
        'prisma-en-piramide-verwisseld',
        'Een prisma heeft twee gelijke vlakken tegenover elkaar, met rechthoeken ertussen. Hier zijn het driehoeken die samenkomen in een top.',
      ],
      [
        'kegel',
        'platte-en-gebogen-verwisseld',
        'Een kegel heeft een cirkel en een gebogen zijvlak. Hier zijn alle vlakken driehoeken of andere vlakken met rechte zijden.',
      ],
      [
        'balk',
        'balk-heeft-rechthoeken',
        'Een balk heeft zes rechthoeken. Hier zitten driehoeken in.',
      ],
    ],
    cilinder: [
      [
        'kegel',
        'kegel-en-cilinder-verwisseld',
        'Een kegel heeft maar één cirkel. Hier zijn het er twee.',
      ],
      [
        'prisma',
        'platte-en-gebogen-verwisseld',
        'Een prisma heeft geen cirkels. De rechthoek buig je hier rond tot de gebogen wand tussen de twee cirkels.',
      ],
      [
        'balk',
        'balk-heeft-rechthoeken',
        'Een balk heeft zes rechthoeken. Hier zijn er twee cirkels.',
      ],
    ],
  }[kind];
}
// De vlakken van een uitslag in woorden: 0 is een cirkel, 3 een driehoek, 4 een rechthoek of
// vierkant, en verder het aantal hoeken.
function wordNet(kind) {
  if (kind === 'cilinder')
    return {
      faces: [0, 0, 4],
      text: 'twee even grote cirkels en een rechthoek',
      steps: [
        'De twee cirkels worden het grondvlak en het bovenvlak.',
        'De rechthoek buig je rond tot de gebogen wand ertussen.',
        'Dus het is een cilinder.',
      ],
    };
  if (kind === 'prisma') {
    const n = pick([3, 5, 6]);
    return {
      n,
      faces: [n, n, ...Array(n).fill(4)],
      text: `twee gelijke ${HOEK[n]}en en ${WORD[n]} rechthoeken`,
      steps: [
        `De twee gelijke ${HOEK[n]}en worden het grondvlak en het bovenvlak.`,
        `De ${WORD[n]} rechthoeken worden de zijvlakken ertussen.`,
        'Dus het is een prisma.',
      ],
    };
  }
  const n = pick([3, 4, 5, 6]);
  return {
    n,
    faces: [n, ...Array(n).fill(3)],
    text:
      n === 3
        ? 'vier even grote driehoeken'
        : `een ${n === 4 ? 'vierkant' : HOEK[n]} en ${WORD[n]} even grote driehoeken`,
    steps: [
      n === 3
        ? 'Eén driehoek wordt het grondvlak.'
        : `${n === 4 ? 'Het vierkant' : `De ${HOEK[n]}`} wordt het grondvlak.`,
      `De ${n === 3 ? 'andere ' : ''}${WORD[n]} driehoeken komen samen in één punt, de top.`,
      'Dus het is een piramide.',
    ],
  };
}
// De ruimtefiguur bij de vlakken van wordNet, zonder de naam te gebruiken.
function facesKind(faces) {
  const count = (k) => faces.filter((f) => f === k).length,
    m = faces.length;
  if (count(0) === 2 && count(4) === 1 && m === 3) return 'cilinder';
  if (count(0)) return null;
  // Piramide: één grondvlak met k hoeken en k driehoeken.
  if (faces.some((k, i) => k === m - 1 && faces.every((f, j) => j === i || f === 3)))
    return 'piramide';
  // Prisma: twee gelijke vlakken met k hoeken (geen vierhoek) en k rechthoeken.
  const k = faces.find((f) => f !== 4);
  if (k && k !== 4 && count(k) === 2 && count(4) === k && m === k + 2) return 'prisma';
  return null;
}

function s11whichnet() {
  const kind = pick(['kubus', 'balk', 'prisma', 'piramide', 'cilinder']),
    ask = `Welke ruimtefiguur kun je ervan vouwen? ${MEEST_PRECIES}`,
    hint =
      'Kijk welke vormen de vlakken hebben en hoeveel het er zijn. Twee gelijke vlakken met rechthoeken ertussen geeft een prisma. Eén vlak met driehoeken eromheen geeft een piramide.';
  if (kind === 'kubus' || kind === 'balk') {
    const [cells, dims] =
      kind === 'kubus'
        ? [turned(pick(CUBE_NETS)), [2, 2, 2]]
        : until(
            () => [turned(pick(CUBE_NETS)), [pick([1, 2, 3]), pick([1, 2, 3]), pick([1, 2, 3])]],
            ([c, d]) => !(d[0] === d[1] && d[1] === d[2]) && boxFaces(c, d) !== null,
          );
    const { mc, traps } = nameChoices(kind, wrongForNet(kind));
    return {
      q: T(`Dit is een uitslag van een ruimtefiguur. ${ask}`),
      fig: net({ cells, dims, u: 18, label: 'Uitslag van een ruimtefiguur' }),
      mc,
      hint,
      steps:
        kind === 'kubus'
          ? [
              'Er zijn zes vlakken, en het zijn allemaal even grote vierkanten.',
              'Dus je vouwt er een kubus van.',
            ]
          : [
              'Er zijn zes vlakken, en het zijn rechthoeken. Ze zijn niet allemaal even groot.',
              'Steeds twee vlakken zijn even groot. Die komen tegenover elkaar.',
              'Dus je vouwt er een balk van.',
            ],
      traps,
      v: () => {
        const fs = boxFaces(cells, dims);
        if (!isCubeNet(cells) || !fs) return false;
        const squares = fs.every((f) => f.w === fs[0].w && f.h === fs[0].w);
        return (squares ? 'kubus' : 'balk') === kind;
      },
    };
  }
  const w = wordNet(kind),
    { mc, traps } = nameChoices(kind, wrongForNet(kind, w.n));
  return {
    q: T(`Een uitslag van een ruimtefiguur bestaat uit ${w.text}. ${ask}`),
    mc,
    hint,
    steps: w.steps,
    traps,
    v: () => facesKind(w.faces) === kind,
  };
}

export default {
  slug: 'ruimtefiguren-herkennen',
  title: 'Ruimtefiguren herkennen',
  intro:
    'Een ruimtefiguur is een figuur die je van alle kanten kunt bekijken, zoals een kubus, een cilinder of een piramide. Hier leer je ruimtefiguren een naam geven, platte en gebogen zijvlakken tellen en een uitslag van een kubus herkennen. Ook zoek je bij een uitslag van een ruimtefiguur de ruimtefiguur die erbij hoort.',
  description:
    'Ruimtefiguren herkennen: kubus, balk, prisma, piramide, cilinder, kegel en bol. Platte en gebogen zijvlakken en de uitslag van een kubus. Gratis oefenen.',
  videos: {},
  skills: [
    [143, 'Naam van een ruimtefiguur', s11name],
    [144, 'Platte en gebogen zijvlakken', s11faces],
    [145, 'Is dit een uitslag van een kubus?', s11cubenet],
    [146, 'Welke ruimtefiguur kun je vouwen?', s11whichnet],
  ],
  learn: [
    {
      t: 'Ruimtefiguren',
      p: [
        'Een ruimtefiguur is een figuur die je van alle kanten kunt bekijken. Een ander woord is lichaam. Elk vlak van een ruimtefiguur heet een zijvlak, ook het grondvlak en het bovenvlak.',
        'Een kubus heeft zes zijvlakken die even grote vierkanten zijn. Een balk heeft zes rechthoeken als zijvlakken.',
        'Een prisma heeft een grondvlak en een bovenvlak die gelijk zijn. De zijvlakken ertussen zijn rechthoeken.',
        'Een piramide heeft één grondvlak. De andere zijvlakken zijn driehoeken die samenkomen in één punt, de top.',
        'Een cilinder, een kegel en een bol hebben een gebogen zijvlak.',
      ],
      ex: {
        q:
          T('Hoe heet deze ruimtefiguur?') +
          solid({ kind: 'prisma', n: 3, lying: true, h: 4, letters: false }),
        steps: [
          'Vooraan en achteraan zitten twee gelijke driehoeken.',
          'De zijvlakken ertussen zijn rechthoeken.',
          'Dus het is een prisma.',
        ],
      },
      watch: T(
        'Een kubus is ook een balk, en een balk is ook een prisma. Je kiest de naam die het meest precies is. Zes even grote vierkanten heet dus een kubus.',
      ),
    },
    {
      t: 'Platte en gebogen zijvlakken',
      p: [
        'Een plat zijvlak kun je plat op tafel leggen. Een gebogen zijvlak is rond, zoals de wand van een cilinder.',
        'Een cilinder heeft twee platte zijvlakken en één gebogen zijvlak. Een kegel heeft één plat en één gebogen zijvlak. Een bol heeft alleen een gebogen zijvlak.',
        'Om te rollen is een gebogen zijvlak nodig. Met alleen platte zijvlakken kan een ruimtefiguur niet rollen.',
      ],
      watch: T(
        'Zitten twee ruimtefiguren tegen elkaar, dan zie je de vlakken waar ze elkaar raken niet meer. Die tel je niet mee.',
      ),
    },
    {
      t: 'Uitslag van een kubus',
      p: [
        'Een uitslag van een kubus is een platte figuur waaruit je een kubus kunt vouwen, zonder plakrandjes. Er zitten zes vierkanten in, één voor elk zijvlak.',
        'Niet elke figuur van zes vierkanten is een uitslag van een kubus. Vouw de figuur in gedachten. Komen twee vierkanten op dezelfde plek, dan blijft er een zijvlak open. Dan is het geen uitslag van een kubus.',
        'Er zijn elf verschillende uitslagen van een kubus.',
      ],
      ex: {
        q:
          T('Is dit een uitslag van een kubus?') +
          net({
            cells: [
              [1, 0],
              [0, 1],
              [1, 1],
              [2, 1],
              [3, 1],
              [2, 2],
            ],
            u: 24,
            label: 'Figuur van zes vierkanten',
          }),
        steps: [
          'Kies een vlak als grondvlak en vouw de andere vlakken in gedachten omhoog.',
          pairsFig([
            [1, 0],
            [0, 1],
            [1, 1],
            [2, 1],
            [3, 1],
            [2, 2],
          ]),
          'Vlakken met hetzelfde getal komen tegenover elkaar. Elk vlak komt op een eigen zijvlak, dus dit is een uitslag van een kubus.',
        ],
      },
      watch: T('Vier vierkanten in een blok van 2 bij 2 kun je nooit tot een kubus vouwen.'),
    },
    {
      t: 'Uitslagen van andere ruimtefiguren',
      p: [
        'Een uitslag van een balk heeft zes rechthoeken. Steeds twee ervan zijn even groot, want die komen tegenover elkaar.',
        'Een uitslag van een prisma heeft twee gelijke vlakken, het grondvlak en het bovenvlak, en daartussen rechthoeken.',
        'Een uitslag van een piramide heeft één grondvlak, met aan elke zijde een driehoek. De driehoeken komen samen in de top.',
        'Een uitslag van een cilinder heeft twee even grote cirkels en een rechthoek. De rechthoek buig je rond tot de gebogen wand.',
      ],
    },
  ],
};
