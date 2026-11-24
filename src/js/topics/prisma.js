// Onderwerp: Prisma. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { pick, coin, shuffle, until, near, d } from '../math.js';
import { F, MC, trap, HOEK, groot, reeks } from './shared.js';
import { T } from '../typeset.js';
import { and } from '../figures.js';
import { solid, solidFacts } from '../ruimtefiguren.js';

const WOORD = { 3: 'drie', 4: 'vier', 5: 'vijf', 6: 'zes', 7: 'zeven', 8: 'acht' };
// Een lijst van namen op alfabetische volgorde, zoals 'DI, EJ en FK'.
const list = (xs) => and([...xs].sort());
const som = (xs) => xs.reduce((t, x) => t + x, 0);

// Letters bij de hoekpunten: een rij opeenvolgende letters, eerst het grondvlak en dan het
// bovenvlak, tegen de klok in. Zo staat de naam van een ribbe uit solidFacts al op volgorde.
const BEGIN = ['C', 'D', 'E', 'H', 'K', 'M'];
const reeksVan = (n) => reeks(BEGIN, 2 * n);
// De naam van een prisma, zoals 'DEFGH IJKLM': het grondvlak, een spatie en het bovenvlak.
const naam = (L, n) => `${L.slice(0, n)} ${L.slice(n)}`;

// Het antwoord: een prisma met een n-hoek als grondvlak.
const telling = (n) => ({ zijvlakken: n + 2, ribben: 3 * n, hoekpunten: 2 * n });
// De controle telt anders: een prisma als lijst van zijvlakken, elk een rij hoekpunten rondom.
// Hoekpunt 0 tot en met n − 1 ligt in het grondvlak, n tot en met 2n − 1 in het bovenvlak. De
// ribben en de hoekpunten volgen uit de zijvlakken. Elke ribbe hoort bij precies twee zijvlakken.
// Een gebouwd prisma wordt bewaard, want de controle van 172 bouwt er veel. Dat geeft geen toeval.
const gebouwd = new Map();
function bouwPrisma(n) {
  if (!gebouwd.has(n)) gebouwd.set(n, bouw(n));
  return gebouwd.get(n);
}
function bouw(n) {
  const rond = (s) => Array.from({ length: n }, (_, i) => s + i),
    vlakken = [
      rond(0),
      rond(n),
      ...Array.from({ length: n }, (_, i) => [i, (i + 1) % n, n + ((i + 1) % n), n + i]),
    ],
    ribben = new Map(),
    punten = new Set();
  for (const w of vlakken)
    w.forEach((p, i) => {
      punten.add(p);
      const e = [p, w[(i + 1) % w.length]].sort((a, b) => a - b),
        key = e.join('-');
      ribben.set(key, { e, keer: (ribben.get(key)?.keer ?? 0) + 1 });
    });
  const r = [...ribben.values()];
  return {
    zijvlakken: vlakken.length,
    ribben: r.every((x) => x.keer === 2) ? r.length : NaN,
    hoekpunten: punten.size,
    lijst: r.map((x) => x.e),
  };
}

// De drie aantallen in woorden, voor de uitwerking. staand is het woord voor de ribben tussen het
// grondvlak en het bovenvlak.
function telStappen(n, staand = 'opstaande ribben') {
  const t = telling(n);
  return {
    zijvlakken: `Zijvlakken: het grondvlak, het bovenvlak en ${n} rechthoeken rondom. Dat zijn 2 + ${n} = ${t.zijvlakken} zijvlakken.`,
    ribben: `Ribben: ${n} van het grondvlak, ${n} van het bovenvlak en ${n} ${staand}. Dat zijn ${n} + ${n} + ${n} = ${t.ribben} ribben.`,
    hoekpunten: `Hoekpunten: ${n} van het grondvlak en ${n} van het bovenvlak. Dat zijn ${n} + ${n} = ${t.hoekpunten} hoekpunten.`,
  };
}

// Valkuilen bij het tellen. at(w) is het veld van zijvlakken, ribben of hoekpunten, of -1 als dat
// veld er niet is.
function telValkuilen(n, at, staand = 'opstaande ribben') {
  const t = telling(n),
    has = (w) => at(w) >= 0,
    swap = (a, b, id, m) =>
      has(a) &&
      has(b) && {
        id,
        f: (x) => x[at(a)] === t[b] && x[at(b)] === t[a],
        m,
      };
  return [
    swap(
      'hoekpunten',
      'ribben',
      'hoekpunten-en-ribben-verwisseld',
      'Je hebt de hoekpunten en de ribben verwisseld. Een hoekpunt is een punt, een ribbe is een lijnstuk tussen twee hoekpunten.',
    ),
    swap(
      'zijvlakken',
      'hoekpunten',
      'zijvlakken-en-hoekpunten-verwisseld',
      'Je hebt de zijvlakken en de hoekpunten verwisseld. Een zijvlak is een plat vlak, een hoekpunt is een punt.',
    ),
    swap(
      'zijvlakken',
      'ribben',
      'zijvlakken-en-ribben-verwisseld',
      'Je hebt de zijvlakken en de ribben verwisseld. Een zijvlak is een plat vlak, een ribbe is een lijnstuk op de rand van een zijvlak.',
    ),
    has('zijvlakken') && {
      id: 'grond-of-bovenvlak-vergeten',
      f: (x) => x[at('zijvlakken')] === n || x[at('zijvlakken')] === n + 1,
      m: `Het grondvlak en het bovenvlak zijn ook zijvlakken. Dus ${n} + 2 = ${t.zijvlakken} zijvlakken.`,
    },
    has('ribben') && {
      id: 'ribben-dubbel-geteld',
      f: (x) => x[at('ribben')] === 6 * n,
      m: `Met ${6 * n} ribben heb je elke ribbe twee keer geteld, want elke ribbe hoort bij twee zijvlakken. Tel liever in groepen: ${n} + ${n} + ${n} = ${t.ribben}.`,
    },
    has('ribben') && {
      id: 'ribben-vergeten',
      f: (x) => x[at('ribben')] === n || x[at('ribben')] === 2 * n,
      m: `Tel alle ribben: ${n} van het grondvlak, ${n} van het bovenvlak en ${n} ${staand}.`,
    },
    has('hoekpunten') && {
      id: 'hoekpunten-bovenvlak-vergeten',
      f: (x) => x[at('hoekpunten')] === n,
      m: `Het bovenvlak heeft ook ${n} hoekpunten. Dus ${n} + ${n} = ${t.hoekpunten} hoekpunten.`,
    },
  ].filter(Boolean);
}

// ---------------------------------------------------------------------------------------------
// 170: een prisma herkennen en een naam geven.

// Of een ruimtefiguur een prisma is, uitgerekend uit de hoekpunten (solidFacts): het bovenvlak is
// het grondvlak, verschoven langs één vector die loodrecht op elke ribbe van het grondvlak staat.
// Dan zijn het grondvlak en het bovenvlak gelijk, en zijn de zijvlakken ertussen rechthoeken.
function isPrisma(f) {
  if (f.top.length !== f.base.length) return false;
  const P = f.pts,
    B = [...f.base],
    U = [...f.top],
    t = P[U[0]].map((c, j) => c - P[B[0]][j]),
    dot = (p, q) => p.reduce((s, c, j) => s + c * q[j], 0);
  return (
    Math.hypot(...t) > 1e-9 &&
    B.every((k, i) => {
      const step = P[B[(i + 1) % B.length]].map((c, j) => c - P[k][j]);
      return P[U[i]].every((c, j) => near(c, P[k][j] + t[j], 1e-9)) && near(dot(step, t), 0, 1e-9);
    })
  );
}

const TOP_FOUT = [
  'Nee. Het heeft een top, waar de ribben samenkomen.',
  'prisma-en-piramide-verwisseld',
  'Een piramide heeft een top. Deze ruimtefiguur heeft geen top, maar een bovenvlak dat gelijk is aan het grondvlak.',
];
const DRIEHOEK_FOUT = [
  'Nee. Een prisma heeft altijd een driehoek als grondvlak.',
  'prisma-alleen-driehoek',
  'Het grondvlak van een prisma mag elke veelhoek zijn. Het grondvlak en het bovenvlak moeten wel gelijk zijn, en de zijvlakken ertussen rechthoeken.',
];
const RECHTHOEK_FOUT = [
  'Nee. Een prisma heeft altijd een rechthoek als grondvlak.',
  'grondvlak-mag-elke-veelhoek',
  'Het grondvlak van een prisma mag elke veelhoek zijn. Het grondvlak en het bovenvlak moeten wel gelijk zijn, en de zijvlakken ertussen rechthoeken.',
];

// Een ruimtefiguur zonder letters, met de goede keuze en de foute keuzes: [tekst, id, bericht].
// De beschrijving voor een schermlezer noemt de vorm, maar niet de naam.
function herkenFiguur() {
  const kind = pick(['prisma', 'prisma', 'prisma', 'balk', 'kubus', 'piramide']);
  if (kind === 'prisma') {
    const lying = coin(),
      n = lying ? pick([3, 5, 6]) : pick([3, 5, 6, 7, 8]),
      vlak = `${HOEK[n]}en`;
    return {
      shape: {
        kind,
        n,
        lying,
        h: lying ? 4 : 3,
        label: `Ruimtefiguur met twee gelijke ${vlak} tegenover elkaar en ${WOORD[n]} rechthoeken ertussen,`,
      },
      right: lying
        ? `Ja. Het vlak vooraan en het vlak achteraan zijn gelijke ${vlak}: het grondvlak en het bovenvlak. De andere zijvlakken zijn rechthoeken.`
        : `Ja. Het grondvlak en het bovenvlak zijn gelijke ${vlak}. De andere zijvlakken zijn rechthoeken.`,
      wrongs: [
        [
          'Ja. Alle zijvlakken zijn rechthoeken.',
          'grondvlak-is-geen-rechthoek',
          `Het is wel een prisma, maar niet alle zijvlakken zijn rechthoeken. Het grondvlak en het bovenvlak zijn ${vlak}.`,
        ],
        TOP_FOUT,
        n === 3 ? RECHTHOEK_FOUT : pick([DRIEHOEK_FOUT, RECHTHOEK_FOUT]),
        lying && [
          'Nee. Een prisma staat altijd op zijn grondvlak.',
          'liggend-prisma',
          'Een prisma mag ook liggen. Dan zijn het vlak vooraan en het vlak achteraan het grondvlak en het bovenvlak.',
        ],
      ].filter(Boolean),
      steps: [
        lying
          ? `Het vlak vooraan en het vlak achteraan zijn gelijke ${vlak}. Dat zijn het grondvlak en het bovenvlak. Een prisma mag ook liggen.`
          : `Het grondvlak en het bovenvlak zijn gelijke ${vlak}.`,
        'De zijvlakken ertussen zijn rechthoeken.',
        'Dus het is een prisma.',
      ],
    };
  }
  if (kind === 'balk' || kind === 'kubus') {
    const cube = kind === 'kubus',
      [l, b, h] = cube
        ? [3, 3, 3]
        : until(
            () => [pick([3, 4, 5]), pick([2, 3]), pick([2, 3, 4])],
            ([l, b, h]) => l !== h && !(l === b && b === h),
          ),
      vlak = cube ? 'vierkanten' : 'rechthoeken';
    return {
      shape: {
        kind,
        l,
        b,
        h,
        label: `Ruimtefiguur met zes ${vlak} als zijvlakken,`,
      },
      right: cube
        ? 'Ja. Een kubus is een prisma met een vierkant als grondvlak en als bovenvlak.'
        : 'Ja. Een balk is een prisma met een rechthoek als grondvlak en als bovenvlak.',
      wrongs: [
        [
          `Nee. Het is een ${kind}, en een ${kind} is geen prisma.`,
          'balk-geen-prisma',
          `Een ${kind} is ook een prisma. Het grondvlak en het bovenvlak zijn gelijke ${vlak}, en de zijvlakken ertussen zijn rechthoeken.`,
        ],
        DRIEHOEK_FOUT,
        TOP_FOUT,
      ],
      steps: [
        `Het grondvlak en het bovenvlak zijn gelijke ${vlak}.`,
        cube
          ? 'De zijvlakken ertussen zijn vierkanten. Een vierkant is ook een rechthoek.'
          : 'De zijvlakken ertussen zijn rechthoeken.',
        `Dus een ${kind} is ook een prisma.`,
      ],
    };
  }
  const n = pick([3, 4, 5, 6]);
  return {
    shape: {
      kind,
      n,
      h: 3,
      label: `Ruimtefiguur met een ${HOEK[n]} als grondvlak en ${WOORD[n]} driehoeken die samenkomen in één punt,`,
    },
    right: 'Nee. Er is geen bovenvlak. De opstaande ribben komen samen in één punt, de top.',
    wrongs: [
      [
        `Ja. Het grondvlak is een ${HOEK[n]} en de andere zijvlakken zijn driehoeken.`,
        'prisma-en-piramide-verwisseld',
        'Bij een prisma zijn de zijvlakken rondom rechthoeken, en is er een bovenvlak. Hier komen driehoeken samen in een top. Dat is een piramide.',
      ],
      [
        'Ja. Alle zijvlakken zijn plat.',
        'plat-is-niet-genoeg',
        'Alle zijvlakken van een prisma zijn plat, maar dat is niet genoeg. Een prisma heeft ook een bovenvlak dat gelijk is aan het grondvlak.',
      ],
      n !== 4 && [
        'Nee. Het grondvlak is geen rechthoek.',
        'grondvlak-mag-elke-veelhoek',
        'Het grondvlak van een prisma mag elke veelhoek zijn. Dit is geen prisma omdat er geen bovenvlak is, maar een top.',
      ],
    ].filter(Boolean),
    steps: [
      `Het grondvlak is een ${HOEK[n]}.`,
      'De andere zijvlakken zijn driehoeken. Ze komen samen in één punt, de top. Er is geen bovenvlak.',
      'Dus het is geen prisma, maar een piramide.',
    ],
  };
}

function prismaHerkennen() {
  if (coin()) {
    const { shape, right, wrongs, steps } = herkenFiguur(),
      ws = shuffle(wrongs).slice(0, 3),
      opts = { ...shape, letters: false, counts: false };
    return {
      q: T('Is deze ruimtefiguur een prisma? Kies het goede antwoord met de goede reden.'),
      fig: solid(opts),
      mc: MC([right, ...ws.map((w) => w[0])], 0),
      hint: 'Een prisma heeft een grondvlak en een bovenvlak die gelijk zijn. De zijvlakken ertussen zijn rechthoeken. Het grondvlak mag elke veelhoek zijn.',
      steps,
      traps: ws.map(([t, id, m]) => ({ id, f: (v) => v[0] === t, m })),
      v: () => isPrisma(solidFacts(opts)) === right.startsWith('Ja'),
    };
  }
  // Een naam geven: het grondvlak, een spatie en het bovenvlak.
  const n = pick([3, 5, 6]),
    L = reeksVan(n),
    B = L.slice(0, n),
    U = L.slice(n),
    shape = { kind: 'prisma', n, h: 3, letters: L },
    right = `prisma ${B} ${U}`,
    zig = (s) => s[0] + s[2] + s[1] + s.slice(3),
    wrongs = [
      [
        `prisma ${U} ${B}`,
        'grond-en-bovenvlak-verwisseld',
        'Je noemt eerst het grondvlak en dan het bovenvlak. Het grondvlak is het vlak waar het prisma op staat.',
      ],
      [
        `prisma ${B} ${U.slice(1)}${U[0]}`,
        'bovenvlak-verschoven',
        `De eerste letter van het bovenvlak staat boven de eerste letter van het grondvlak. Boven ${B[0]} staat ${U[0]}.`,
      ],
      n > 3 && [
        `prisma ${zig(B)} ${zig(U)}`,
        'letters-niet-rondom',
        `Je noemt de letters van een vlak rondom, zoals ze op de rand liggen. ${B[0]}${B[2]} is geen ribbe, maar loopt dwars over het grondvlak.`,
      ],
    ].filter(Boolean);
  return {
    q: T('Hieronder staat een prisma. Hoe noem je dit prisma?'),
    fig: solid(shape),
    mc: MC([right, ...wrongs.map((w) => w[0])], 0),
    hint: 'Noem eerst de letters van het grondvlak, tegen de klok in. Zet er een spatie achter. Noem dan de letters van het bovenvlak, en begin met de letter boven de eerste letter van het grondvlak.',
    steps: [
      `Het grondvlak is ${B}, tegen de klok in.`,
      `Boven ${B[0]} staat ${U[0]}, dus het bovenvlak is ${U}.`,
      `Dus het is ${right}.`,
    ],
    traps: wrongs.map(([t, id, m]) => ({ id, f: (v) => v[0] === t, m })),
    // De controle kijkt in de hoekpunten: in de goede naam zijn de letters van elk vlak rondom
    // verbonden door ribben, het eerste vlak ligt onderaan, en elke letter van het bovenvlak staat
    // recht boven de letter van het grondvlak op dezelfde plek. Bij elke foute naam gaat dat mis.
    v: () => {
      const f = solidFacts(shape),
        P = f.pts,
        ok = (name) => {
          const [g, b] = name.replace('prisma ', '').split(' ');
          return (
            [g, b].every((w) =>
              [...w].every((k, i) => f.edges.includes([k, w[(i + 1) % n]].sort().join(''))),
            ) &&
            [...g].every((k) => near(P[k][2], 0, 1e-9)) &&
            [...b].every(
              (k, i) => near(P[k][0], P[g[i]][0], 1e-9) && near(P[k][1], P[g[i]][1], 1e-9),
            )
          );
        };
      return ok(right) && wrongs.every((w) => !ok(w[0])) && isPrisma(f);
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 171: zijvlakken, ribben en hoekpunten tellen uit de vorm van het grondvlak.

const VOORWERPEN = [
  [8, 'Een kaars heeft de vorm van een prisma met een achthoek als grondvlak.', 'de kaars'],
  [
    6,
    'Een plantenbak heeft de vorm van een prisma met een zeshoek als grondvlak.',
    'de plantenbak',
  ],
  [5, 'Een koekblik heeft de vorm van een prisma met een vijfhoek als grondvlak.', 'het koekblik'],
  [
    3,
    'Een houten blokje heeft de vorm van een prisma met een driehoek als grondvlak.',
    'het blokje',
  ],
  [
    7,
    'Een snoeptrommel heeft de vorm van een prisma met een zevenhoek als grondvlak.',
    'de snoeptrommel',
  ],
];

function prismaTellen() {
  const type = pick(['figuur', 'voorwerp', 'tekst']),
    ding = type === 'voorwerp' ? pick(VOORWERPEN) : null,
    lying = type === 'figuur' && coin(),
    n = ding
      ? ding[0]
      : type === 'figuur'
        ? lying
          ? pick([3, 5, 6])
          : pick([3, 5, 6, 7, 8])
        : pick([4, 5, 6, 7, 8, 9, 10, 11, 12]),
    shape =
      type === 'figuur'
        ? { kind: 'prisma', n, lying, h: lying ? 4 : 3, letters: false, counts: false }
        : null,
    t = telling(n),
    staand = lying ? 'ribben van voor naar achter' : 'opstaande ribben',
    parts = shuffle(['zijvlakken', 'ribben', 'hoekpunten']),
    at = (w) => parts.indexOf(w),
    fields = parts.map((w, i) => ({ ...F(`${groot(w)}:`, t[w]), ...(i ? { br: true } : {}) })),
    it = ding ? ding[2] : 'het prisma',
    vraag = `Hoeveel ${and(parts)} heeft ${it}?`,
    s = telStappen(n, staand);
  // Wat je in de tekening ziet: de ribben die niet gestippeld zijn, en de hoekpunten met een ribbe
  // die je ziet.
  const f = shape ? solidFacts(shape) : null,
    seen = f && {
      ribben: f.edges.length - f.hidden.length,
      hoekpunten: f.vertices.filter((k) =>
        f.edges.some((e) => e.includes(k) && !f.hidden.includes(e)),
      ).length,
    },
    zichtbaar = seen && ['ribben', 'hoekpunten'].filter((w) => seen[w] !== t[w]);
  return {
    q: T(
      ding
        ? `${ding[1]} ${vraag}`
        : shape
          ? `Hieronder staat een prisma. ${vraag}`
          : `Het grondvlak van een prisma is een ${HOEK[n]}. ${vraag}`,
    ),
    ...(shape ? { fig: solid(shape) } : {}),
    fields,
    hint: 'Begin bij het grondvlak: hoeveel hoekpunten heeft het? Het bovenvlak is gelijk aan het grondvlak. Het grondvlak en het bovenvlak zijn ook zijvlakken.',
    steps: [
      shape
        ? `Het grondvlak is een ${HOEK[n]}${lying ? ', vooraan' : ''}. Het heeft ${n} hoekpunten en ${n} ribben.`
        : `Een ${HOEK[n]} heeft ${n} hoekpunten en ${n} zijden.`,
      ...parts.map((w) => s[w]),
    ],
    traps: [
      ...telValkuilen(n, at, staand),
      zichtbaar &&
        zichtbaar.length && {
          id: 'alleen-zichtbare-geteld',
          f: (x) => zichtbaar.some((w) => x[at(w)] === seen[w]),
          m: 'Je hebt alleen geteld wat je ziet. Tel ook de gestippelde ribben en de hoekpunten aan de achterkant mee.',
        },
    ].filter(Boolean),
    // De controle bouwt het prisma uit zijn zijvlakken en telt. Hoekpunten − ribben + zijvlakken
    // is bij elk prisma 2. Bij een tekening moet ook de figuur zelf kloppen.
    v: () => {
      const b = bouwPrisma(n),
        ok =
          b.zijvlakken === t.zijvlakken &&
          b.ribben === t.ribben &&
          b.hoekpunten === t.hoekpunten &&
          b.hoekpunten - b.ribben + b.zijvlakken === 2;
      return (
        ok &&
        (!f ||
          (f.faces.length === t.zijvlakken &&
            f.edges.length === t.ribben &&
            f.vertices.length === t.hoekpunten &&
            f.base.length === n))
      );
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 172: terugredeneren, uit een aantal het grondvlak bepalen.

const VORMEN = Object.keys(HOEK).map((k) => HOEK[k]);

function prismaTerug() {
  const n = pick([3, 4, 5, 6, 7, 8, 9, 10]),
    t = telling(n),
    [gegeven, gevraagd] = shuffle(['zijvlakken', 'ribben', 'hoekpunten']).slice(0, 2),
    g = t[gegeven],
    s = telStappen(n);
  // Foute grondvlakken: [aantal hoeken, id, bericht]. Alleen een veelhoek uit de lijst, en niet de goede.
  const fout = {
    hoekpunten: [
      [
        g,
        'niet-gedeeld-door-twee',
        `Het grondvlak en het bovenvlak hebben samen ${g} hoekpunten. Het grondvlak heeft er dus ${g} : 2 = ${n}.`,
      ],
      [
        g / 3,
        'hoekpunten-en-ribben-verwisseld',
        'Door 3 delen doe je bij de ribben. De hoekpunten zitten in twee groepen: die van het grondvlak en die van het bovenvlak. Deel dus door 2.',
      ],
      [
        g - 2,
        'zijvlakken-en-hoekpunten-verwisseld',
        'Er 2 af halen doe je bij de zijvlakken. De hoekpunten zitten in twee groepen: die van het grondvlak en die van het bovenvlak. Deel dus door 2.',
      ],
    ],
    ribben: [
      [
        g / 2,
        'hoekpunten-en-ribben-verwisseld',
        'Door 2 delen doe je bij de hoekpunten. De ribben zitten in drie groepen: die van het grondvlak, die van het bovenvlak en de opstaande ribben. Deel dus door 3.',
      ],
      [
        g - 2,
        'zijvlakken-en-ribben-verwisseld',
        'Er 2 af halen doe je bij de zijvlakken. De ribben zitten in drie groepen: die van het grondvlak, die van het bovenvlak en de opstaande ribben. Deel dus door 3.',
      ],
    ],
    zijvlakken: [
      [
        g,
        'grond-of-bovenvlak-vergeten',
        `Bij de ${g} zijvlakken horen ook het grondvlak en het bovenvlak. Er zijn dus ${g} - 2 = ${n} rechthoeken rondom.`,
      ],
      [
        g - 1,
        'grond-of-bovenvlak-vergeten',
        `Bij de ${g} zijvlakken horen het grondvlak en het bovenvlak. Haal er dus 2 af: ${g} - 2 = ${n}.`,
      ],
      [
        g / 2,
        'zijvlakken-en-hoekpunten-verwisseld',
        'Door 2 delen doe je bij de hoekpunten. Bij de zijvlakken haal je het grondvlak en het bovenvlak eraf.',
      ],
      [
        g / 3,
        'zijvlakken-en-ribben-verwisseld',
        'Door 3 delen doe je bij de ribben. Bij de zijvlakken haal je het grondvlak en het bovenvlak eraf.',
      ],
    ],
  }[gegeven].filter(([k]) => Number.isInteger(k) && HOEK[k] && k !== n);
  // Dezelfde fout met twee getallen wordt één valkuil.
  const ids = [...new Set(fout.map((w) => w[1]))],
    vormTraps = ids.map((id) => {
      const ws = fout.filter((w) => w[1] === id);
      return { id, f: (x) => ws.some(([k]) => x[0] === HOEK[k]), m: ws[0][2] };
    }),
    at = (w) => (w === gevraagd ? 1 : -1),
    terug = {
      hoekpunten: `Het grondvlak en het bovenvlak hebben evenveel hoekpunten. Het grondvlak heeft er dus ${g} : 2 = ${n}.`,
      ribben: `De ribben zitten in drie even grote groepen: die van het grondvlak, die van het bovenvlak en de opstaande ribben. Het grondvlak heeft er dus ${g} : 3 = ${n}.`,
      zijvlakken: `Haal het grondvlak en het bovenvlak eraf. Dan blijven er ${g} - 2 = ${n} rechthoeken over, één bij elke zijde van het grondvlak.`,
    }[gegeven];
  return {
    q: T(
      `Een prisma heeft ${g} ${gegeven}. Wat voor veelhoek is het grondvlak? Hoeveel ${gevraagd} heeft het prisma?`,
    ),
    fields: [
      { sel: VORMEN, a: HOEK[n], pre: 'Het grondvlak is een', label: 'Vorm van het grondvlak' },
      { ...F(`${groot(gevraagd)}:`, t[gevraagd]), br: true },
    ],
    hint: 'Hoekpunten: de helft hoort bij het grondvlak. Ribben: een derde hoort bij het grondvlak. Zijvlakken: haal het grondvlak en het bovenvlak eraf.',
    steps: [terug, `Het grondvlak heeft ${n} hoekpunten, dus het is een ${HOEK[n]}.`, s[gevraagd]],
    traps: [...vormTraps, ...telValkuilen(n, at)],
    // De controle probeert elk grondvlak tot 40 hoeken: bouw het prisma en tel. Maar één grondvlak
    // mag het gegeven aantal geven, en dat moet het goede zijn.
    v: () => {
      const past = Array.from({ length: 38 }, (_, i) => i + 3).filter(
        (k) => bouwPrisma(k)[gegeven] === g,
      );
      return past.length === 1 && past[0] === n && bouwPrisma(n)[gevraagd] === t[gevraagd];
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 173: de ribben van het grondvlak, het bovenvlak en de opstaande ribben, en hun lengte.

const MODELLEN = [
  {
    t: (n) =>
      `Je maakt een model van een prisma van rietjes. Elke ribbe is een rietje. Het grondvlak is een ${HOEK[n]}.`,
    stuk: 'rietjes',
    n: [3, 4, 5, 6, 7, 8],
    x: [3, 4, 5, 6, 4.5],
    h: [8, 10, 12, 15],
  },
  {
    t: (n) =>
      `Een lantaarn heeft de vorm van een prisma met een ${HOEK[n]} als grondvlak. Langs elke ribbe zit een metalen strip.`,
    stuk: 'strips',
    n: [4, 6, 8],
    x: [8, 10, 12, 7.5],
    h: [25, 30, 40, 45],
  },
];

// De opstaande ribben van een prisma met letters L, en de ribben van het grondvlak en het bovenvlak.
function ribGroepen(L, n) {
  const rond = (s) => [...s].map((k, i) => [k, s[(i + 1) % n]].sort().join(''));
  return {
    opstaand: Array.from({ length: n }, (_, i) => L[i] + L[n + i]),
    grond: rond(L.slice(0, n)),
    boven: rond(L.slice(n)),
  };
}
const GROEP = {
  opstaand: 'de opstaande ribben',
  grond: 'de ribben van het grondvlak',
  boven: 'de ribben van het bovenvlak',
};

function ribbenFiguur() {
  const regelmatig = coin(),
    n = regelmatig ? pick([3, 5, 6]) : 3,
    L = reeksVan(n),
    h = pick([3, 4, 5, 6, 7.5]),
    // Een regelmatig grondvlak met zijde x, of een rechthoekige driehoek van 3, 4 en 5 keer k.
    x = regelmatig ? pick([2, 2.5, 3, 4]) : 0,
    k = regelmatig ? 0 : pick([1, 1.5, 2]),
    zijden = regelmatig ? Array(n).fill(x) : [4 * k, 5 * k, 3 * k],
    r = regelmatig ? x / (2 * Math.sin(Math.PI / n)) : 0,
    breed = regelmatig ? 2 * r : 4 * k,
    u = Math.min(30, Math.floor(180 / Math.max(breed, h))),
    // De lengtes staan bij ribben op de rand van de tekening: bij een regelmatig grondvlak de
    // ribbe vooraan, bij de driehoek de ribben van het bovenvlak. En bij de opstaande ribbe links.
    len = regelmatig
      ? { [L[0] + L[1]]: x, [L[0] + L[n]]: h }
      : {
          [L[3] + L[4]]: 4 * k,
          [L[4] + L[5]]: 5 * k,
          [L[3] + L[5]]: 3 * k,
          [L[0] + L[3]]: h,
        },
    shape = regelmatig
      ? { kind: 'prisma', n, r, h, letters: L, len, u }
      : {
          kind: 'prisma',
          base: [
            [0, 0],
            [4 * k, 0],
            [0, 3 * k],
          ],
          h,
          letters: L,
          len,
          u,
        },
    f = solidFacts(shape),
    groepen = ribGroepen(L, n),
    lijst = Object.fromEntries(Object.entries(groepen).map(([w, es]) => [w, list(es)])),
    gestippeld = f.hidden.length ? list(f.hidden) : null,
    wat = pick(['opstaand', 'grond', 'boven']),
    opts = [...new Set([...Object.values(lijst), gestippeld].filter(Boolean))].sort(),
    P = som(zijden),
    total = 2 * P + n * h,
    zie = som(
      f.edges
        .filter((e) => !f.hidden.includes(e))
        .map((e) => Math.hypot(...f.pts[e[1]].map((c, i) => c - f.pts[e[0]][i]))),
    );
  const fields = [
    {
      sel: opts,
      a: lijst[wat],
      pre: `${groot(GROEP[wat])} zijn`,
      label: groot(GROEP[wat]),
    },
    { ...F('Alle ribben samen:', total, 'cm'), br: true },
  ];
  const naar = (w) => (w === 'grond' ? 'grondvlak' : 'bovenvlak');
  const kies = (w) => {
    if (w === wat) return null;
    if (w === 'opstaand')
      return {
        id: 'opstaande-ribben-gekozen',
        m: 'Dit zijn de opstaande ribben. Ze gaan van het grondvlak naar het bovenvlak.',
      };
    if (wat === 'opstaand')
      return {
        id: 'geen-opstaande-ribben',
        m: `Deze ribben liggen in het ${naar(w)}. Opstaande ribben gaan van het grondvlak naar het bovenvlak.`,
      };
    return {
      id: 'grond-en-bovenvlak-verwisseld',
      m: `Dit zijn de ribben van het ${naar(w)}. Het grondvlak is ${L.slice(0, n)}, het bovenvlak ${L.slice(n)}.`,
    };
  };
  // Twee foute keuzes met dezelfde fout worden één valkuil.
  const selTraps = [];
  for (const w of ['opstaand', 'grond', 'boven']) {
    const c = kies(w);
    if (!c) continue;
    const t = selTraps.find((x) => x.id === c.id);
    if (t) t.ws.push(lijst[w]);
    else selTraps.push({ ...c, ws: [lijst[w]] });
  }
  for (const t of selTraps) {
    const ws = t.ws;
    delete t.ws;
    t.f = (v) => ws.includes(v[0]);
  }
  if (gestippeld && !Object.values(lijst).includes(gestippeld))
    selTraps.push({
      id: 'gestippelde-ribben',
      f: (v) => v[0] === gestippeld,
      m: 'Dit zijn de gestippelde ribben: die zie je in werkelijkheid niet. Dat zegt niet bij welk vlak ze horen.',
    });
  const somGrond = regelmatig
    ? `Het grondvlak heeft ${n} ribben van ${d(x)} cm, en het bovenvlak ook. Samen is dat 2 * ${n} * ${d(x)} = ${d(2 * P)} cm.`
    : `Het bovenvlak heeft ribben van ${d(3 * k)}, ${d(4 * k)} en ${d(5 * k)} cm. Het grondvlak is gelijk aan het bovenvlak. Samen is dat 2 * (${d(3 * k)} + ${d(4 * k)} + ${d(5 * k)}) = ${d(2 * P)} cm.`;
  return {
    q: T(
      `Hieronder staat prisma ${naam(L, n)}. ${regelmatig ? 'Alle ribben van het grondvlak zijn even lang. ' : ''}De maten staan in cm. Welke ribben zijn ${GROEP[wat]}? Hoe lang zijn alle ribben samen?`,
    ),
    fig: solid(shape),
    fields,
    hint: 'Het grondvlak en het bovenvlak zijn gelijk, dus ze hebben dezelfde ribben. De opstaande ribben gaan van het grondvlak naar het bovenvlak, en zijn allemaal even lang.',
    steps: [
      `Het grondvlak is ${L.slice(0, n)}, met de ribben ${lijst.grond}.`,
      `Het bovenvlak is ${L.slice(n)}, met de ribben ${lijst.boven}.`,
      `De opstaande ribben zijn ${lijst.opstaand}.`,
      somGrond,
      `Er zijn ${n} opstaande ribben van ${d(h)} cm. Samen is dat ${n} * ${d(h)} = ${d(n * h)} cm.`,
      `Alle ribben samen: ${d(2 * P)} + ${d(n * h)} = ${d(total)} cm.`,
    ],
    traps: [
      ...selTraps,
      {
        id: 'ribben-bovenvlak-vergeten',
        f: (v) => near(v[1], P + n * h),
        m: 'Het bovenvlak heeft dezelfde ribben als het grondvlak. Tel ze ook mee.',
      },
      {
        id: 'opstaande-ribben-vergeten',
        f: (v) => near(v[1], 2 * P),
        m: `Tel ook de ${n} opstaande ribben mee.`,
      },
      {
        id: 'een-opstaande-ribbe',
        f: (v) => near(v[1], 2 * P + h),
        m: `Er zijn ${n} opstaande ribben, niet één. Ze zijn allemaal ${d(h)} cm.`,
      },
      {
        id: 'alleen-gegeven-ribben',
        f: (v) => near(v[1], som(Object.values(len))),
        m: 'Je hebt alleen de ribben opgeteld waar een lengte bij staat. Tel alle ribben mee: die van het grondvlak, het bovenvlak en de opstaande ribben.',
      },
      !near(zie, total) && {
        id: 'gestippeld-vergeten',
        f: (v) => near(v[1], zie),
        m: 'Tel de gestippelde ribben ook mee. Je ziet ze niet, maar ze zijn er wel.',
      },
    ].filter(Boolean),
    // De controle meet elke ribbe in de hoekpunten en telt op. Een opstaande ribbe loopt recht
    // omhoog, een ribbe van het grondvlak ligt helemaal op hoogte 0, een van het bovenvlak op de
    // hoogte h.
    v: () => {
      const p = f.pts,
        lang = (e) => Math.hypot(...p[e[1]].map((c, i) => c - p[e[0]][i])),
        soort = (e) =>
          near(p[e[0]][0], p[e[1]][0], 1e-9) && near(p[e[0]][1], p[e[1]][1], 1e-9)
            ? 'opstaand'
            : near(p[e[0]][2], 0, 1e-9) && near(p[e[1]][2], 0, 1e-9)
              ? 'grond'
              : near(p[e[0]][2], h, 1e-9) && near(p[e[1]][2], h, 1e-9)
                ? 'boven'
                : null;
      return (
        near(som(f.edges.map(lang)), total, 1e-6) &&
        list(f.edges.filter((e) => soort(e) === wat)) === lijst[wat] &&
        Object.entries(len).every(([e, l]) => near(lang(e), l, 1e-6)) &&
        opts.includes(lijst[wat])
      );
    },
  };
}

function ribbenModel() {
  const m = pick(MODELLEN),
    n = pick(m.n),
    x = pick(m.x),
    h = pick(m.h),
    total = 2 * n * x + n * h,
    intro = `${m.t(n)} Alle zijden van het grondvlak zijn ${d(x)} cm.`;
  // De controle telt de lengte van elke ribbe op, uit het prisma dat bouwPrisma maakt: een ribbe
  // tussen twee hoekpunten van hetzelfde vlak is een zijde, de andere zijn opstaand.
  const lengte = (hh) => som(bouwPrisma(n).lijst.map(([p, q]) => (p < n === q < n ? x : hh)));
  if (coin()) {
    // Terugrekenen: uit alle ribben samen de lengte van een opstaande ribbe.
    return {
      q: T(`${intro} Alle ribben samen zijn ${d(total)} cm. Hoe lang is één opstaande ribbe?`),
      fields: [F('Eén opstaande ribbe:', h, 'cm')],
      hint: 'Reken eerst uit hoe lang de ribben van het grondvlak en het bovenvlak samen zijn. Wat over is, hoort bij de opstaande ribben.',
      steps: [
        `Het grondvlak en het bovenvlak hebben elk ${n} ribben van ${d(x)} cm. Samen is dat 2 * ${n} * ${d(x)} = ${d(2 * n * x)} cm.`,
        `Voor de opstaande ribben blijft ${d(total)} - ${d(2 * n * x)} = ${d(n * h)} cm over.`,
        `Er zijn ${n} opstaande ribben, dus één opstaande ribbe is ${d(n * h)} : ${n} = ${d(h)} cm.`,
      ],
      traps: [
        {
          id: 'ribben-bovenvlak-vergeten',
          f: (v) => near(v[0], (total - n * x) / n),
          m: 'Het bovenvlak heeft ook ribben. Haal de ribben van het grondvlak én van het bovenvlak eraf.',
        },
        {
          id: 'delen-vergeten',
          f: (v) => near(v[0], n * h),
          m: `Dit zijn alle ${n} opstaande ribben samen. Deel nog door ${n}.`,
        },
        {
          id: 'alle-ribben-even-lang',
          f: (v) => near(v[0], total / (3 * n)),
          m: 'De ribben zijn niet allemaal even lang. Haal eerst de ribben van het grondvlak en het bovenvlak eraf.',
        },
      ],
      v: () => near(lengte(h), total, 1e-9) && h !== x,
    };
  }
  const Stuk = groot(m.stuk);
  return {
    q: T(
      `${intro} De opstaande ribben zijn ${d(h)} cm. Hoeveel ${m.stuk} heb je nodig? Hoeveel cm is dat samen?`,
    ),
    fields: [F(`${Stuk}:`, 3 * n), { ...F('Samen:', total, 'cm'), br: true }],
    hint: 'Elke ribbe is een stuk. Tel de ribben van het grondvlak, van het bovenvlak en de opstaande ribben.',
    steps: [
      `Het prisma heeft ${n} + ${n} + ${n} = ${3 * n} ribben, dus ${3 * n} ${m.stuk}.`,
      `Het grondvlak en het bovenvlak: 2 * ${n} * ${d(x)} = ${d(2 * n * x)} cm.`,
      `De opstaande ribben: ${n} * ${d(h)} = ${d(n * h)} cm.`,
      `Samen: ${d(2 * n * x)} + ${d(n * h)} = ${d(total)} cm.`,
    ],
    traps: [
      trap(
        'hoekpunten-geteld',
        `Het prisma heeft ${2 * n} hoekpunten, maar ${3 * n} ribben: ${n} van het grondvlak, ${n} van het bovenvlak en ${n} opstaande.`,
        (v) => v[0] === 2 * n,
      ),
      trap(
        'zijvlakken-geteld',
        `Het prisma heeft ${n + 2} zijvlakken, maar ${3 * n} ribben: ${n} van het grondvlak, ${n} van het bovenvlak en ${n} opstaande.`,
        (v) => v[0] === n + 2,
      ),
      trap(
        'ribben-dubbel-geteld',
        `Met ${6 * n} heb je elke ribbe twee keer geteld. Tel in groepen: ${n} + ${n} + ${n} = ${3 * n}.`,
        (v) => v[0] === 6 * n,
      ),
      trap(
        'ribben-bovenvlak-vergeten',
        'Het bovenvlak heeft dezelfde ribben als het grondvlak. Tel ze ook mee.',
        (v) => near(v[1], n * x + n * h),
      ),
      trap('opstaande-ribben-vergeten', `Tel ook de ${n} opstaande ribben mee.`, (v) =>
        near(v[1], 2 * n * x),
      ),
      trap(
        'een-opstaande-ribbe',
        `Er zijn ${n} opstaande ribben, niet één. Ze zijn allemaal ${d(h)} cm.`,
        (v) => near(v[1], 2 * n * x + h),
      ),
    ].filter(Boolean),
    v: () => near(lengte(h), total, 1e-9) && bouwPrisma(n).ribben === 3 * n,
  };
}

function prismaRibben() {
  return coin() ? ribbenFiguur() : ribbenModel();
}

export default {
  slug: 'prisma',
  title: 'Prisma',
  intro:
    'Een prisma heeft een grondvlak en een bovenvlak die gelijk zijn, met rechthoeken ertussen. Hier leer je een prisma herkennen en een naam geven, zoals prisma DEFGH IJKLM. Je telt zijvlakken, ribben en hoekpunten vanuit het grondvlak, rekent terug naar het grondvlak en rekent met de lengte van de ribben.',
  description:
    'Prisma oefenen: grondvlak en bovenvlak, zijvlakken, ribben en hoekpunten tellen, terugrekenen en de lengte van alle ribben. Gratis met uitleg en hints.',
  videos: {},
  skills: [
    [170, 'Een prisma herkennen', prismaHerkennen],
    [171, 'Zijvlakken, ribben en hoekpunten van een prisma', prismaTellen],
    [172, 'Het grondvlak van een prisma bepalen', prismaTerug],
    [173, 'Ribben van een prisma', prismaRibben],
  ],
  learn: [
    {
      t: 'Wat is een prisma?',
      p: [
        'Een prisma is een ruimtefiguur met twee gelijke veelhoeken tegenover elkaar: het grondvlak en het bovenvlak. De andere zijvlakken zijn rechthoeken.',
        "Het grondvlak mag elke veelhoek zijn, zoals een driehoek, een vijfhoek of een achthoek. Een balk en een kubus zijn ook prisma's, met een rechthoek of een vierkant als grondvlak.",
        'Een prisma kan ook liggen. Dan zijn het vlak vooraan en het vlak achteraan het grondvlak en het bovenvlak.',
        'Je noemt een prisma met de letters van het grondvlak, een spatie en de letters van het bovenvlak, allebei tegen de klok in. De eerste letter van het bovenvlak staat boven de eerste letter van het grondvlak.',
      ],
      ex: {
        q:
          T('Hoe noem je dit prisma?') +
          solid({ kind: 'prisma', n: 5, h: 3, letters: 'DEFGHIJKLM' }),
        steps: [
          'Het grondvlak is DEFGH, tegen de klok in.',
          'Boven D staat I, dus het bovenvlak is IJKLM.',
          'Dus het is prisma DEFGH IJKLM.',
        ],
      },
      watch: T(
        'Een balk is ook een prisma, want het grondvlak en het bovenvlak zijn gelijke rechthoeken. Een piramide is geen prisma: die heeft geen bovenvlak, maar een top.',
      ),
    },
    {
      t: 'Zijvlakken, ribben en hoekpunten tellen',
      p: [
        'Begin bij het grondvlak. Is het grondvlak een zeshoek, dan heeft het 6 hoekpunten en 6 ribben. Het bovenvlak ook.',
        'Zijvlakken: het grondvlak, het bovenvlak en een rechthoek bij elke zijde van het grondvlak. Bij een zeshoek zijn dat 2 + 6 = 8 zijvlakken.',
        'Ribben: die van het grondvlak, die van het bovenvlak en de opstaande ribben. Bij een zeshoek 6 + 6 + 6 = 18 ribben.',
        'Hoekpunten: die van het grondvlak en die van het bovenvlak. Bij een zeshoek 6 + 6 = 12 hoekpunten.',
      ],
      ex: {
        q: T(
          'Hoeveel zijvlakken, ribben en hoekpunten heeft een prisma met een vijfhoek als grondvlak?',
        ),
        steps: ['Zijvlakken: 2 + 5 = 7.', 'Ribben: 5 + 5 + 5 = 15.', 'Hoekpunten: 5 + 5 = 10.'],
      },
      watch: T(
        'Het grondvlak en het bovenvlak zijn ook zijvlakken. Vergeet ze niet mee te tellen.',
      ),
    },
    {
      t: 'Terugrekenen naar het grondvlak',
      p: [
        'Weet je hoeveel hoekpunten, ribben of zijvlakken een prisma heeft, dan kun je terugrekenen wat voor veelhoek het grondvlak is.',
        'Hoekpunten: deel door 2, want het grondvlak en het bovenvlak hebben er evenveel. Ribben: deel door 3, want er zijn drie even grote groepen. Zijvlakken: haal er 2 af, voor het grondvlak en het bovenvlak.',
      ],
      ex: {
        q: T('Een prisma heeft 21 ribben. Wat voor veelhoek is het grondvlak?'),
        steps: ['21 : 3 = 7, dus het grondvlak heeft 7 ribben.', 'Het grondvlak is een zevenhoek.'],
      },
      watch: T(
        'Kijk goed wat er gegeven is. Bij hoekpunten deel je door 2, bij ribben door 3, en bij zijvlakken haal je er 2 af.',
      ),
    },
    {
      t: 'De lengte van de ribben',
      p: [
        'Het grondvlak en het bovenvlak zijn gelijk, dus ze hebben dezelfde ribben. De opstaande ribben gaan van het grondvlak naar het bovenvlak, en zijn allemaal even lang.',
        'Alle ribben samen: twee keer de ribben van het grondvlak, plus alle opstaande ribben.',
      ],
      ex: {
        q: T(
          'Een prisma heeft een zeshoek als grondvlak met zijden van 3 cm. De opstaande ribben zijn 5 cm. Hoe lang zijn alle ribben samen?',
        ),
        steps: [
          'Het grondvlak en het bovenvlak: 2 * 6 * 3 = 36 cm.',
          'De opstaande ribben: 6 * 5 = 30 cm.',
          'Samen: 36 + 30 = 66 cm.',
        ],
      },
      watch: T(
        'Vergeet de ribben van het bovenvlak niet. Ze tellen net zo goed mee als die van het grondvlak.',
      ),
    },
  ],
};
