// Onderwerp: Kubus en balk. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { pick, coin, shuffle, until, near, d } from '../math.js';
import { F, MC, trap } from './shared.js';
import { T } from '../typeset.js';
import { and } from '../figures.js';
import { net, solid, solidFacts } from '../ruimtefiguren.js';
import { boxFaces, opposite, CUBE_NETS, TURNS } from '../ruimte.js';

// Letters bij de hoekpunten: eerst het grondvlak, dan het bovenvlak, tegen de klok in. De eerste
// letter ligt linksvoor, de vijfde staat boven de eerste. Elke reeks staat op alfabetische volgorde,
// zodat de naam van een ribbe uit solidFacts al op volgorde staat. Elke vraag kiest een andere reeks.
const LETTERS = [
  'DEFGHIJK',
  'MNOPQRST',
  'STUVWXYZ',
  'BCDEFGHI',
  'FGHIJKLM',
  'HIJKMNOP',
  'CDEFQRST',
  'RSTUVWXY',
  'NOPQSTUV',
];
// De reeks in de uitleg.
const VOORBEELD = 'DEFGHIJK';
// De naam van een kubus of balk, zoals 'DEFG HIJK'.
const naam = (L) => `${L.slice(0, 4)} ${L.slice(4)}`;
// De richtingen van de ribben: naar rechts (de lengte), naar achteren (de breedte) en omhoog
// (de hoogte), net als de coördinaten in solidFacts.
const RECHTS = 0,
  ACHTER = 1,
  OMHOOG = 2;

// De naam van een zijvlak: vier letters rondom, beginnend bij de eerste letter van het alfabet.
// Zo heet zijvlak DAEH hier ADHE.
function faceName(w) {
  const s = [...w],
    all = [];
  s.forEach((_, i) => {
    const r = [...s.slice(i), ...s.slice(0, i)];
    all.push(r.join(''), [r[0], ...r.slice(1).reverse()].join(''));
  });
  return all.sort()[0];
}
// Een lijst van namen op alfabetische volgorde, zoals 'AD, CD en DH'.
const list = (xs) => and([...xs].sort());
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
// De werkelijke lengte van een ribbe, uit de hoekpunten.
const realLen = (f, e) => Math.hypot(...f.pts[e[1]].map((c, i) => c - f.pts[e[0]][i]));
// De richting van een ribbe: de coördinaat die verandert.
const dirOf = (f, e) => [0, 1, 2].find((a) => !near(f.pts[e[0]][a], f.pts[e[1]][a], 1e-9));
// Het aantal coördinaten waarin twee hoekpunten verschillen: 1 bij een ribbe, 2 bij een lijnstuk
// dwars over een zijvlak.
const diff = (f, p, q) => [0, 1, 2].filter((a) => !near(f.pts[p][a], f.pts[q][a], 1e-9)).length;
// De coördinaat die in een zijvlak overal gelijk is: 2 bij grond- en bovenvlak, 1 bij voor- en
// achtervlak, 0 bij de zijvlakken links en rechts.
const planeOf = (f, w) =>
  [0, 1, 2].find((a) => [...w].every((k) => near(f.pts[k][a], f.pts[w[0]][a], 1e-9)));
// De lengtes van de zijden van een zijvlak, uit de hoekpunten.
const sidesOf = (f, w) => [...w].map((k, i) => realLen(f, [k, w[(i + 1) % w.length]]));
// De letters die een zijvlak en een ribbe gemeen hebben.
const holds = (w, letters) => [...letters].every((k) => w.includes(k));

// Een kubus of balk met letters, voor solid() en solidFacts().
function boxShape(kind, l, b, h, L, len) {
  return kind === 'kubus'
    ? { kind, l, letters: L, ...(len ? { len } : {}) }
    : { kind, l, b, h, letters: L, ...(len ? { len } : {}) };
}
// De ribben op de omtrek van de tekening, per richting. Een lengte bij zo'n ribbe valt niet over
// een andere ribbe.
const outline = (L) => ({
  [RECHTS]: [L[0] + L[1], L[6] + L[7]],
  [ACHTER]: [L[1] + L[2], L[4] + L[7]],
  [OMHOOG]: [L[0] + L[4], L[2] + L[6]],
});

// ---------------------------------------------------------------------------------------------
// 151: hoekpunten, ribben en zijvlakken tellen.

const VOORWERPEN = [
  ['kubus', 'Een suikerklontje heeft de vorm van een kubus.', 'een suikerklontje'],
  ['kubus', 'Een houten speelblok heeft de vorm van een kubus.', 'het speelblok'],
  ['balk', 'Een baksteen heeft de vorm van een balk.', 'een baksteen'],
  ['balk', 'Een blok nougat heeft de vorm van een balk.', 'het blok nougat'],
  ['balk', 'Een gum heeft de vorm van een balk.', 'de gum'],
];

function s12count() {
  const kind = pick(['kubus', 'balk']);
  const shape =
    kind === 'kubus'
      ? { kind, l: pick([3, 4]), letters: false, counts: false }
      : { kind, l: pick([4, 5]), b: 2, h: pick([2, 3]), letters: false, counts: false };
  const f = solidFacts(shape),
    hp = f.vertices.length,
    rb = f.edges.length,
    zv = f.faces.length,
    // Wat je ziet in de tekening: de ribben die niet gestippeld zijn, de hoekpunten met een
    // ribbe die je ziet, en de zijvlakken naar je toe.
    seen = [
      f.vertices.filter((k) => f.edges.some((e) => e.includes(k) && !f.hidden.includes(e))).length,
      rb - f.hidden.length,
      zv -
        f.faces.filter((w) =>
          [...w].some((k, i) => f.hidden.includes([k, w[(i + 1) % 4]].sort().join(''))),
        ).length,
    ];
  // De controle rekent via de figuur zelf: de ribben die bij een hoekpunt samenkomen worden
  // geteld, ribben zijn de helft van al die uiteinden, en daarna moet het aantal vlakken
  // kloppen met het verband tussen hoekpunten, ribben en vlakken.
  const v = () => {
    const per = f.vertices.map((k) => f.edges.filter((e) => e.includes(k)).length);
    return (
      per.every((n) => n === 3) &&
      hp === 2 * f.base.length &&
      rb === (hp * per[0]) / 2 &&
      zv === 2 + rb - hp &&
      f.base.length + f.top.length === hp
    );
  };
  if (coin()) {
    // Een model van satéprikkers en balletjes klei.
    const fields = [
      F('Satéprikkers:', rb),
      { ...F('Balletjes klei:', hp), br: true },
      { ...F('Prikkers per balletje:', 3), br: true },
    ];
    return {
      q: T(
        `Je bouwt een ${kind} van satéprikkers en balletjes klei. Elke ribbe is een prikker. Op elk hoekpunt zit een balletje klei. Hoeveel prikkers en hoeveel balletjes heb je nodig? Hoeveel prikkers zitten er in één balletje?`,
      ),
      fields,
      hint: 'Een prikker is een ribbe en een balletje is een hoekpunt. Tel de hoekpunten van het grondvlak en van het bovenvlak.',
      steps: [
        `Het grondvlak en het bovenvlak hebben elk 4 hoekpunten. Dat zijn 4 + 4 = ${hp} balletjes.`,
        `Het grondvlak en het bovenvlak hebben elk 4 ribben, en er zijn 4 opstaande ribben. Dat zijn 4 + 4 + 4 = ${rb} prikkers.`,
        'In elk hoekpunt komen 3 ribben samen, dus in elk balletje zitten 3 prikkers.',
      ],
      traps: [
        {
          id: 'ribben-dubbel-geteld',
          f: (x) => x[0] === hp * 3,
          m: `Met ${hp * 3} prikkers heb je er te veel: je hebt sommige prikkers twee keer geteld. Tel liever in groepen. Er zijn drie richtingen (breed, diep en hoog), en in elke richting zitten 4 prikkers. Dus je hebt 3 * 4 = ${rb} prikkers nodig.`,
        },
        {
          id: 'hoekpunten-en-ribben-verwisseld',
          f: (x) => x[0] === hp && x[1] === rb,
          m: 'Je hebt de prikkers en de balletjes verwisseld. Een prikker is een ribbe, een balletje een hoekpunt.',
        },
        {
          id: 'ribben-vergeten',
          f: (x) => x[0] === 4 || x[0] === 8,
          m: 'Tel alle ribben: 4 van het grondvlak, 4 van het bovenvlak en 4 opstaande ribben.',
        },
      ],
      v,
    };
  }
  // Tellen bij een tekening of een voorwerp, in een willekeurige volgorde.
  const thing = coin() ? pick(VOORWERPEN.filter((t) => t[0] === kind)) : null,
    it = thing ? thing[2] : `de ${kind}`,
    parts = shuffle([
      ['hoekpunten', hp],
      ['ribben', rb],
      ['zijvlakken', zv],
    ]),
    at = (w) => parts.findIndex((p) => p[0] === w),
    fields = parts.map(([w, n], i) => ({
      ...F(`${w[0].toUpperCase()}${w.slice(1)}:`, n),
      ...(i ? { br: true } : {}),
    }));
  return {
    q: T(
      thing
        ? `${thing[1]} Hoeveel ${and(parts.map((p) => p[0]))} heeft ${it}?`
        : `Hoeveel ${and(parts.map((p) => p[0]))} heeft deze ${kind}?`,
    ),
    ...(thing ? {} : { fig: solid(shape) }),
    fields,
    hint: 'Tel ook wat je niet ziet. Het grondvlak en het bovenvlak zijn ook zijvlakken. In elk hoekpunt komen drie ribben samen.',
    steps: [
      `Het grondvlak en het bovenvlak hebben elk 4 hoekpunten. Dat zijn 4 + 4 = ${hp} hoekpunten.`,
      `Het grondvlak en het bovenvlak hebben elk 4 ribben, en er zijn 4 opstaande ribben. Dat zijn 4 + 4 + 4 = ${rb} ribben.`,
      `Er zijn 4 zijvlakken rondom, en het grondvlak en het bovenvlak. Dat zijn 4 + 2 = ${zv} zijvlakken.`,
    ],
    traps: [
      {
        id: 'ribben-dubbel-geteld',
        f: (x) => x[at('ribben')] === hp * 3,
        m: `Met ${hp * 3} ribben tel je er te veel: je hebt sommige ribben twee keer geteld. Tel liever in groepen. Er zijn drie richtingen (breed, diep en hoog), en in elke richting lopen 4 ribben. Dus er zijn 3 * 4 = ${rb} ribben.`,
      },
      {
        id: 'grond-of-bovenvlak-vergeten',
        f: (x) => x[at('zijvlakken')] === 4 || x[at('zijvlakken')] === 5,
        m: `Het grondvlak en het bovenvlak zijn ook zijvlakken. Dus ${it} heeft 4 + 2 = ${zv} zijvlakken.`,
      },
      {
        id: 'ribben-vergeten',
        f: (x) => x[at('ribben')] === 4 || x[at('ribben')] === 8,
        m: 'Tel alle ribben: 4 van het grondvlak, 4 van het bovenvlak en 4 opstaande ribben.',
      },
      {
        id: 'alleen-zichtbare-geteld',
        f: (x) =>
          x[at('hoekpunten')] === seen[0] ||
          x[at('ribben')] === seen[1] ||
          x[at('zijvlakken')] === seen[2],
        m: 'Je hebt alleen geteld wat je ziet. Tel ook de hoekpunten, ribben en zijvlakken aan de achterkant mee.',
      },
      {
        id: 'hoekpunten-en-ribben-verwisseld',
        f: (x) => x[at('hoekpunten')] === rb && x[at('ribben')] === hp,
        m: 'Je hebt de hoekpunten en de ribben verwisseld. Een hoekpunt is een punt, een ribbe is een lijnstuk tussen twee hoekpunten.',
      },
    ],
    v,
  };
}

// ---------------------------------------------------------------------------------------------
// 152: ribben, zijvlakken en hoekpunten benoemen.

// Een kubus of balk met letters, en de feiten erbij.
function lettered() {
  const kind = pick(['kubus', 'balk']),
    L = pick(LETTERS),
    [l, b, h] =
      kind === 'kubus'
        ? [pick([3, 4]), 0, 0]
        : until(
            () => [pick([4, 5, 6]), pick([2, 3]), pick([2, 3, 4])],
            ([l, b, h]) => l !== h,
          );
  const shape = boxShape(kind, l, b, h, L);
  return { kind, L, l, b, h, shape, f: solidFacts(shape) };
}

function s12name() {
  const { kind, L, shape, f } = lettered(),
    faces = f.faces.map(faceName),
    pair = (a, c) => [a, c].sort().join(' en '),
    intro = `Hieronder staat ${kind} ${naam(L)}.`,
    hint =
      'Een zijvlak heeft vier letters en een ribbe twee. Een zijvlak hoort bij een ribbe of hoekpunt als die letters erin staan.';
  const type = pick(['ribbe', 'hoekpunt', 'ribben']);
  if (type === 'ribbe') {
    const e = pick(f.edges),
      two = faces.filter((w) => holds(w, e)),
      right = pair(...two),
      // Bij een ribbe ernaast, in dezelfde richting, horen andere zijvlakken.
      others = shuffle(f.edges.filter((x) => x !== e && dirOf(f, x) === dirOf(f, e))).slice(0, 2),
      wrongs = others.map((x) => pair(...faces.filter((w) => holds(w, x)))),
      // Een zijvlak en het zijvlak dat ertegenover ligt: die hebben geen ribbe samen.
      one = pick(two),
      across = faces.find((w) => [...w].every((k) => !one.includes(k))),
      apart = pair(one, across);
    return {
      q: T(
        `${intro} Ribbe ${e} is de grens tussen twee zijvlakken. Welke twee zijvlakken zijn dat?`,
      ),
      fig: solid(shape),
      mc: MC([right, ...wrongs, apart], 0),
      hint,
      steps: [`Zoek de zijvlakken waarin zowel ${e[0]} als ${e[1]} staat.`, `Dat zijn ${right}.`],
      traps: [
        {
          id: 'andere-ribbe',
          f: (x) => wrongs.includes(x[0]),
          m: `Deze twee zijvlakken komen samen in een andere ribbe. Zoek de zijvlakken waarin zowel ${e[0]} als ${e[1]} staat.`,
        },
        {
          id: 'tegenover-elkaar',
          f: (x) => x[0] === apart,
          m: 'Deze zijvlakken liggen tegenover elkaar. Ze hebben geen ribbe samen.',
        },
      ],
      // De twee zijvlakken liggen elk in een plat vlak met een vaste coördinaat. Beide hoekpunten
      // van de ribbe liggen in die vlakken, en die vlakken staan in twee verschillende richtingen.
      v: () => {
        const planes = two.map((w) => planeOf(f, w)),
          inPlane = (w, k) => near(f.pts[k][planeOf(f, w)], f.pts[w[0]][planeOf(f, w)], 1e-9);
        return (
          two.length === 2 &&
          planes[0] !== planes[1] &&
          two.every((w) => [...e].every((k) => inPlane(w, k))) &&
          !planes.includes(dirOf(f, e)) &&
          others.every(
            (x) =>
              !sameSet(
                faces.filter((w) => holds(w, x)),
                two,
              ),
          )
        );
      },
    };
  }
  const k = pick(f.vertices),
    near3 = f.edges.filter((e) => e.includes(k)).map((e) => e.replace(k, ''));
  if (type === 'hoekpunt') {
    const three = faces.filter((w) => w.includes(k)),
      right = list(three),
      wrongs = near3.map((p) => list(faces.filter((w) => w.includes(p))));
    return {
      q: T(`${intro} Welke drie zijvlakken komen samen in hoekpunt ${k}?`),
      fig: solid(shape),
      mc: MC([right, ...wrongs], 0),
      hint,
      steps: [`Zoek de zijvlakken waarin de letter ${k} staat.`, `Dat zijn ${right}.`],
      traps: [
        {
          id: 'ander-hoekpunt',
          f: (x) => wrongs.includes(x[0]),
          m: `Deze drie zijvlakken komen samen in een ander hoekpunt. In alle drie moet de letter ${k} staan.`,
        },
      ],
      // Het hoekpunt ligt in elk van de drie vlakken, en die staan in drie richtingen.
      v: () =>
        three.length === 3 &&
        new Set(three.map((w) => planeOf(f, w))).size === 3 &&
        three.every((w) => near(f.pts[k][planeOf(f, w)], f.pts[w[0]][planeOf(f, w)], 1e-9)),
    };
  }
  // De ribben in een hoekpunt.
  const edges = f.edges.filter((e) => e.includes(k)),
    right = list(edges),
    // Een lijnstuk dwars over een zijvlak, van k naar het hoekpunt schuin tegenover k.
    diags = faces
      .filter((w) => w.includes(k))
      .map((w) => [...w].find((p) => p !== k && !f.edges.includes([p, k].sort().join(''))))
      .map((p) => [p, k].sort().join('')),
    swaps = shuffle(diags)
      .slice(0, 2)
      .map((g, i) => list([...edges.filter((_, j) => j !== i), g])),
    nb = pick(near3),
    other = list(f.edges.filter((e) => e.includes(nb)));
  return {
    q: T(`${intro} Welke drie ribben komen samen in hoekpunt ${k}?`),
    fig: solid(shape),
    mc: MC([right, ...swaps, other], 0),
    hint: `Een ribbe is een lijnstuk tussen twee hoekpunten, langs de rand van een zijvlak. Zoek de ribben met de letter ${k}.`,
    steps: [
      `Vanuit ${k} gaan drie ribben naar de hoekpunten ${and(near3.sort())}.`,
      `Dus de ribben zijn ${right}.`,
    ],
    traps: [
      {
        id: 'geen-ribbe',
        f: (x) => swaps.includes(x[0]),
        m: 'Een van deze lijnstukken loopt dwars over een zijvlak, naar het hoekpunt schuin ertegenover. Dat is geen ribbe.',
      },
      {
        id: 'ander-hoekpunt',
        f: (x) => x[0] === other,
        m: `Deze ribben komen samen in hoekpunt ${nb}, niet in ${k}.`,
      },
    ],
    // Een ribbe loopt in één richting: de twee hoekpunten verschillen maar in één coördinaat.
    v: () =>
      edges.length === 3 &&
      edges.every((e) => diff(f, e[0], e[1]) === 1) &&
      new Set(edges.map((e) => dirOf(f, e))).size === 3 &&
      diags.every((g) => diff(f, g[0], g[1]) === 2),
  };
}

// ---------------------------------------------------------------------------------------------
// 153: gestippelde ribben.

const REDEN = 'je ziet ze in werkelijkheid niet';
const REDENEN = [
  'ze lopen schuin naar achteren',
  REDEN,
  'ze zijn in werkelijkheid korter',
  'ze zijn korter getekend',
];

function s12hidden() {
  const { kind, L, shape, f } = lettered(),
    hv = f.vertices.find((k) => f.hidden.every((e) => e.includes(k))),
    // Het hoekpunt dat het dichtst bij je staat: rechtsvoor boven.
    front = f.vertices.find(
      (k) => f.edges.every((e) => !e.includes(k) || !f.hidden.includes(e)) && diff(f, k, hv) === 3,
    ),
    at = (k) => list(f.edges.filter((e) => e.includes(k))),
    nbs = shuffle(f.edges.filter((e) => e.includes(hv)).map((e) => e.replace(hv, ''))).slice(0, 2),
    right = list(f.hidden),
    wrong = [front, ...nbs].map(at),
    opts = [right, ...wrong].sort(),
    // De zijvlakken die je niet ziet: die met het hoekpunt dat je niet ziet.
    unseen = f.faces.map(faceName).filter((w) => w.includes(hv));
  const fields = [
    { sel: opts, a: right, pre: 'Gestippeld zijn de ribben', label: 'Gestippelde ribben' },
    {
      sel: REDENEN,
      a: REDEN,
      pre: 'Ze zijn gestippeld, want',
      label: 'Waarom zijn ze gestippeld?',
      br: true,
    },
    {
      sel: [...f.vertices],
      a: hv,
      pre: 'De gestippelde ribben komen samen in hoekpunt',
      label: 'Hoekpunt van de gestippelde ribben',
      br: true,
    },
    { ...F('Zijvlakken die je niet ziet:', unseen.length), br: true },
  ];
  return {
    q: T(
      `Hieronder staat ${kind} ${naam(L)}. Welke ribben zijn gestippeld, en waarom? In welk hoekpunt komen de gestippelde ribben samen? Hoeveel zijvlakken zie je in werkelijkheid niet?`,
    ),
    fig: solid(shape),
    fields,
    hint: `Een gestippelde ribbe teken je met streepjes. Denk aan wat je wel en niet ziet als je naar een echte ${kind} kijkt.`,
    steps: [
      `De ribben ${right} zijn met streepjes getekend.`,
      `Ze liggen aan de achterkant, onder en links. Je ziet ze in werkelijkheid niet, want de ${kind} zit ervoor.`,
      `Ze komen samen in hoekpunt ${hv}, het hoekpunt linksachter onder.`,
      `De zijvlakken met hoekpunt ${hv} zie je niet: ${list(unseen)}. Dat zijn er ${unseen.length}.`,
    ],
    traps: [
      {
        id: 'zichtbare-ribbe-gekozen',
        f: (x) => wrong.includes(x[0]),
        m: 'Bij deze ribben staan ribben die je wel ziet. Kijk welke ribben in de tekening met streepjes getekend zijn.',
      },
      {
        id: 'korter-getekend-is-niet-gestippeld',
        f: (x) => x[1] === 'ze zijn korter getekend',
        m: 'Ribben die schuin naar achteren lopen, zijn korter getekend. Maar ze zijn niet allemaal gestippeld. Gestippeld zijn de ribben die je niet ziet.',
      },
      {
        id: 'gestippeld-is-niet-korter',
        f: (x) => x[1] === 'ze zijn in werkelijkheid korter',
        m: 'Gestippelde ribben zijn in werkelijkheid niet korter. Je ziet ze alleen niet.',
      },
      {
        id: 'schuin-is-niet-gestippeld',
        f: (x) => x[1] === 'ze lopen schuin naar achteren',
        m: 'Niet elke ribbe die schuin naar achteren loopt, is gestippeld. Gestippeld zijn de ribben die je niet ziet.',
      },
      {
        id: 'voorste-hoekpunt',
        f: (x) => x[2] === front,
        m: `Hoekpunt ${front} staat juist vooraan. De gestippelde ribben komen samen in het hoekpunt dat het verst weg ligt.`,
      },
    ],
    // Je kijkt van rechtsvoor en van boven. Het hoekpunt dat je niet ziet, ligt dus links, achter
    // en onder: de kleinste x, de grootste y en de kleinste z. Gestippeld zijn de ribben daarvan.
    v: () => {
      const c = (a, g) => g(...f.vertices.map((k) => f.pts[k][a])),
        far = f.vertices.find(
          (k) =>
            f.pts[k][0] === c(0, Math.min) &&
            f.pts[k][1] === c(1, Math.max) &&
            f.pts[k][2] === c(2, Math.min),
        );
      return (
        far === hv &&
        sameSet(
          f.edges.filter((e) => e.includes(far)),
          f.hidden,
        ) &&
        opts.length === 4 &&
        new Set(opts).size === 4 &&
        // Een ribbe is gestippeld als je geen van de twee zijvlakken ernaast ziet. Een zijvlak met
        // een gestippelde ribbe zie je dus niet.
        f.faces.filter((w) =>
          [...w].some((k, i) => f.hidden.includes([k, w[(i + 1) % 4]].sort().join(''))),
        ).length === unseen.length
      );
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 154: ribben die korter getekend zijn.

function s12short() {
  // Alleen een kubus: daar zijn alle ribben even lang, dus je vergelijkt de getekende lengte met die ene
  // lengte. Bij een balk is er geen vaste lengte om mee te vergelijken (#232).
  const kind = 'kubus',
    L = pick(LETTERS),
    // Een zijvlak met een ribbe naar achteren: het grondvlak, het bovenvlak of een zijvlak opzij.
    lying = coin(),
    [l, b, h] = Array(3).fill(pick([2, 3, 4, 5, 6])),
    // De ribben met een lengte erbij, op de omtrek van de tekening: de eerste en tweede letter, de tweede en derde, en de eerste en vijfde.
    lab = { [RECHTS]: L[0] + L[1], [ACHTER]: L[1] + L[2], [OMHOOG]: L[0] + L[4] },
    dims = { [RECHTS]: l, [ACHTER]: b, [OMHOOG]: h },
    len = { [lab[RECHTS]]: l },
    shape = boxShape(kind, l, b, h, L, len),
    f = solidFacts(shape),
    byDir = (a) => f.edges.filter((e) => dirOf(f, e) === a),
    back = list(byDir(ACHTER)),
    up = list(byDir(OMHOOG)),
    side = list(byDir(RECHTS)),
    dashed = list(f.hidden),
    opts = [back, up, side, dashed].sort(),
    // Het gevraagde zijvlak: liggend (grond- of bovenvlak) of staand opzij.
    w = faceName(pick(f.faces.filter((x) => planeOf(f, x) === (lying ? OMHOOG : RECHTS)))),
    sides = [...w].map((k, i) => [k, w[(i + 1) % 4]].sort().join('')),
    // Een ribbe naar achteren in het zijvlak, maar niet de ribbe met de lengte erbij, en een
    // ribbe in een andere richting die eraan vastzit.
    rec = sides.find((e) => dirOf(f, e) === ACHTER && e !== lab[ACHTER]),
    other = sides.find((e) => dirOf(f, e) !== ACHTER && [...e].some((k) => rec.includes(k))),
    yes = dims[ACHTER] === dims[dirOf(f, other)] ? 'ja' : 'nee';
  const fields = [
    { sel: opts, a: back, pre: 'Korter getekend zijn de ribben', label: 'Korter getekende ribben' },
    {
      ...F(`In werkelijkheid is ${rec}`, dims[ACHTER], 'cm'),
      label: `Echte lengte van ${rec}`,
      br: true,
    },
    {
      sel: ['ja', 'nee'],
      a: yes,
      pre: `Is zijvlak ${w} in werkelijkheid een vierkant?`,
      label: `Is zijvlak ${w} in werkelijkheid een vierkant?`,
      br: true,
    },
  ];
  return {
    q: T(
      `Hieronder staat ${kind} ${naam(L)}. Alle maten staan in cm. Welke ribben zijn korter getekend dan ze in werkelijkheid zijn? Hoe lang is ribbe ${rec} in werkelijkheid? Is zijvlak ${w} in werkelijkheid een vierkant?`,
    ),
    fig: solid(shape),
    fields,
    hint: `De voorkant staat op ware grootte. Ribben die schuin naar achteren lopen, teken je korter. Kijk voor zijvlak ${w} naar de echte lengtes van de ribben.`,
    steps: [
      `De ribben ${back} lopen schuin naar achteren. Die zijn korter getekend.`,
      `Bij een kubus zijn alle ribben even lang, dus ${rec} en ${other} zijn allebei ${l} cm.`,
      `In de tekening lijkt zijvlak ${w} geen vierkant. Maar in werkelijkheid zijn alle zijden even lang, dus het is een vierkant.`,
    ],
    traps: [
      {
        id: 'opstaande-ribben',
        f: (x) => x[0] === up,
        m: 'Opstaande ribben staan recht omhoog. Die zijn op ware grootte getekend. Korter getekend zijn de ribben die schuin naar achteren lopen.',
      },
      {
        id: 'ribben-naar-rechts',
        f: (x) => x[0] === side,
        m: 'Ribben die naar rechts lopen, zijn op ware grootte getekend. Korter getekend zijn de ribben die schuin naar achteren lopen.',
      },
      {
        id: 'gestippeld-is-niet-korter',
        f: (x) => x[0] === dashed,
        m: 'Gestippeld betekent dat je de ribbe niet ziet. Dat zegt niets over de lengte. Korter getekend zijn de ribben die schuin naar achteren lopen.',
      },
      {
        id: 'getekende-lengte',
        f: (x) => near(x[1], dims[ACHTER] / 2),
        m: `In de tekening is ${rec} korter, maar in werkelijkheid is ${rec} even lang als ${lab[ACHTER]} en de andere ribben.`,
      },
      {
        id: 'korter-getekend-vergeten',
        f: (x) => x[2] === 'nee',
        m: `In de tekening lijkt zijvlak ${w} geen vierkant, want ${rec} is korter getekend. Maar in werkelijkheid zijn ${rec} en ${other} even lang.`,
      },
    ],
    // In schuine projectie is een punt (x, y, z) getekend op (x + y/2, z + y/2). Een ribbe is korter
    // getekend als de getekende lengte kleiner is dan de echte. Een vierkant: vier gelijke zijden.
    v: () => {
      const drawn = (e) => {
          const [p, q] = [f.pts[e[0]], f.pts[e[1]]];
          return Math.hypot(q[0] - p[0] + (q[1] - p[1]) / 2, q[2] - p[2] + (q[1] - p[1]) / 2);
        },
        shorter = f.edges.filter((e) => drawn(e) < realLen(f, e) - 1e-9),
        s = sidesOf(f, w);
      return (
        list(shorter) === back &&
        near(realLen(f, rec), dims[ACHTER], 1e-9) &&
        new Set(opts).size === 4 &&
        (yes === 'ja') === s.every((x) => near(x, s[0], 1e-9))
      );
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 155: gelijke ribben en gelijke zijvlakken van een balk.

const GEEN = 'geen enkel zijvlak';

function s13same() {
  const L = pick(LETTERS),
    two = coin(),
    [l, b, h] = until(
      () => [pick([3, 4, 5, 6, 7]), pick([2, 3, 4, 5]), pick([2, 3, 4, 5, 6])],
      ([l, b, h]) => (two ? new Set([l, b, h]).size === 2 : new Set([l, b, h]).size === 3),
    ),
    dims = { [RECHTS]: l, [ACHTER]: b, [OMHOOG]: h },
    ring = outline(L),
    len = Object.fromEntries([RECHTS, ACHTER, OMHOOG].map((a) => [pick(ring[a]), dims[a]])),
    shape = boxShape('balk', l, b, h, L, len),
    f = solidFacts(shape),
    faces = f.faces.map(faceName),
    e = pick(f.edges),
    de = dims[dirOf(f, e)],
    // De ribbe met de lengte erbij, in dezelfde richting als e.
    known = Object.keys(len).find((k) => dirOf(f, k) === dirOf(f, e)),
    // De maten van een zijvlak: de twee richtingen die niet vast zijn.
    sizeOf = (w) => [RECHTS, ACHTER, OMHOOG].filter((a) => a !== planeOf(f, w)).map((a) => dims[a]),
    sizeKey = (w) =>
      sizeOf(w)
        .sort((p, q) => p - q)
        .join(),
    sameSize = (p, q) => sizeKey(p) === sizeKey(q),
    pairs = [OMHOOG, ACHTER, RECHTS].map((a) => faces.filter((w) => planeOf(f, w) === a)),
    pairText = (p) => p.sort().join(' en '),
    sqPair = pairs.find((p) => sizeOf(p[0])[0] === sizeOf(p[0])[1]),
    sq = sqPair ? pairText(sqPair) : GEEN,
    opts = [...pairs.map(pairText).sort(), GEEN],
    w = pick(faces),
    n = 4 * [l, b, h].filter((x) => x === de).length,
    m = faces.filter((x) => sameSize(x, w)).length;
  const fields = [
    { ...F(`Even lang als ${e}:`, n, 'ribben'), label: `Aantal ribben even lang als ${e}` },
    {
      sel: opts,
      a: sq,
      pre: 'Een vierkant zijn de zijvlakken',
      label: 'Welke zijvlakken zijn een vierkant?',
      br: true,
    },
    {
      ...F(`Even groot als ${w}:`, m, 'zijvlakken'),
      label: `Aantal zijvlakken even groot als ${w}`,
      br: true,
    },
  ];
  const dimWords = `${d(l)} cm lang, ${d(b)} cm breed en ${d(h)} cm hoog`;
  return {
    q: T(
      `Hieronder staat balk ${naam(L)}. Alle maten staan in cm. Hoeveel ribben zijn even lang als ${e}? Tel ${e} zelf ook mee. Welke zijvlakken zijn een vierkant? Hoeveel zijvlakken zijn even groot als zijvlak ${w}? Tel ${w} zelf ook mee.`,
    ),
    fig: solid(shape),
    fields,
    hint: 'Een balk heeft drie groepen van vier even lange ribben: de lengte, de breedte en de hoogte. Zijvlakken die tegenover elkaar liggen, zijn even groot.',
    steps: [
      `De balk is ${dimWords}.`,
      `${e === known ? `Ribbe ${e} is ${d(de)} cm.` : `Ribbe ${e} loopt in dezelfde richting als ${known}, dus ${e} is ${d(de)} cm.`} ${
        n === 4
          ? `Er zijn vier ribben in die richting, en geen andere maat is ${d(de)} cm. Dus 4 ribben.`
          : `Twee maten van de balk zijn ${d(de)} cm, dus twee groepen van vier ribben. Dat zijn 8 ribben.`
      }`,
      sqPair
        ? `Zijvlakken ${pairText(sqPair)} zijn ${d(sizeOf(sqPair[0])[0])} bij ${d(sizeOf(sqPair[0])[1])} cm. Dat zijn vierkanten.`
        : 'Alle maten zijn verschillend, dus geen enkel zijvlak is een vierkant.',
      `Zijvlak ${w} is ${d(sizeOf(w)[0])} bij ${d(sizeOf(w)[1])} cm. ${
        m === 2
          ? `Alleen het zijvlak tegenover ${w} is even groot. Dus 2 zijvlakken.`
          : `Zo groot zijn de zijvlakken ${list(faces.filter((x) => sameSize(x, w)))}. Dus 4 zijvlakken.`
      }`,
    ],
    traps: [
      {
        id: 'ribbe-vergeten',
        f: (x) => x[0] === n - 1 || (n === 8 && x[0] === 3),
        m: `Er lopen vier ribben in dezelfde richting als ${e}. Tel ${e} zelf en de gestippelde ribbe ook mee.`,
      },
      n === 8 && {
        id: 'groep-vergeten',
        f: (x) => x[0] === 4,
        m: `Een balk heeft drie groepen van vier even lange ribben. Hier zijn twee groepen ${d(de)} cm lang.`,
      },
      sqPair
        ? {
            id: 'vierkant-gemist',
            f: (x) => x[1] === GEEN,
            m: 'Twee maten van de balk zijn gelijk. De zijvlakken met die twee maten zijn vierkanten.',
          }
        : null,
      {
        id: 'geen-vierkant',
        f: (x) => x[1] !== sq && x[1] !== GEEN && opts.includes(x[1]),
        m: 'Bij een vierkant zijn de lengte en de breedte gelijk. Kijk bij elk paar zijvlakken welke twee maten erbij horen.',
      },
      {
        id: 'tegenover-vergeten',
        f: (x) => x[2] === 1,
        m: `Het zijvlak tegenover ${w} is even groot. Tel ${w} zelf ook mee.`,
      },
      m === 4 && {
        id: 'even-groot-gemist',
        f: (x) => x[2] === 2,
        m: `Twee maten van de balk zijn gelijk. Daardoor zijn er ook in een andere richting zijvlakken die even groot zijn als ${w}.`,
      },
    ].filter(Boolean),
    // De controle meet alles na in de hoekpunten: de lengte van elke ribbe, de zijden van elk zijvlak.
    v: () => {
      const le = realLen(f, e),
        sides = (x) => sidesOf(f, x).sort((p, q) => p - q),
        sw = sides(w),
        squares = faces.filter((x) => {
          const s = sides(x);
          return near(s[0], s[3], 1e-9);
        });
      return (
        f.edges.filter((x) => near(realLen(f, x), le, 1e-9)).length === n &&
        faces.filter((x) => sides(x).every((s, i) => near(s, sw[i], 1e-9))).length === m &&
        (squares.length ? pairText(squares) === sq : sq === GEEN)
      );
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 156: ribben van een gegeven lengte tellen, en alle ribben samen.

const MODELLEN = [
  {
    t: 'Je maakt een model van een balk van ijzerdraad. Elke ribbe is een stuk draad.',
    stuk: 'stukken draad',
    dims: [
      [8, 10, 12, 15],
      [4, 4.5, 5, 6],
      [3, 5, 6, 7.5],
    ],
  },
  {
    t: 'Een aquarium heeft de vorm van een balk. Langs elke ribbe zit een strip van aluminium.',
    stuk: 'strips',
    dims: [
      [50, 60, 80, 100],
      [25, 30, 40],
      [30, 40, 50],
    ],
  },
  {
    t: 'Een vitrinekast van glas heeft de vorm van een balk. Langs elke ribbe zit een houten lat.',
    stuk: 'latten',
    dims: [
      [40, 50, 60, 80],
      [30, 35, 40],
      [90, 120, 150],
    ],
  },
];

function s13edges() {
  const type = pick(['tekening', 'model', 'kubus']);
  if (type === 'kubus') {
    const r = pick([3, 4, 5, 6, 7, 8, 2.5, 3.5, 4.5]),
      total = 12 * r,
      f = solidFacts({ kind: 'kubus', l: r }),
      sum = f.edges.reduce((s, e) => s + realLen(f, e), 0);
    if (coin()) {
      // Terugrekenen: uit alle ribben samen de lengte van één ribbe.
      const wrongs = [
        ['hoekpunten-geteld', 8, 'Een kubus heeft 8 hoekpunten, maar 12 ribben.'],
        ['zijvlakken-geteld', 6, 'Een kubus heeft 6 zijvlakken, maar 12 ribben.'],
        [
          'alleen-een-groep',
          4,
          'Een kubus heeft niet 4 maar 12 ribben: 4 onder, 4 boven en 4 opstaand.',
        ],
      ];
      return {
        q: T(
          `Je hebt ${d(total)} cm ijzerdraad. Je buigt er precies één kubus van, zonder dat er draad overblijft. Elke ribbe is een stuk draad. Hoe lang is elke ribbe?`,
        ),
        fields: [F('Eén ribbe:', r, 'cm')],
        hint: 'Hoeveel ribben heeft een kubus? Ze zijn allemaal even lang.',
        steps: [
          'Een kubus heeft 12 ribben, en die zijn allemaal even lang.',
          `${d(total)} : 12 = ${d(r)}, dus elke ribbe is ${d(r)} cm.`,
        ],
        traps: wrongs.map(([id, k, m]) => ({
          id,
          f: (x) => Math.abs(x[0] - total / k) < 0.051,
          m: `${m} Deel dus door 12.`,
        })),
        v: () => near(sum, total, 1e-9) && f.edges.length * r === total,
      };
    }
    return {
      q: T(
        `Je buigt een kubus van ijzerdraad. Elke ribbe is een stuk draad van ${d(r)} cm. Hoeveel stukken draad heb je nodig? Hoeveel cm draad is dat samen?`,
      ),
      fields: [F('Stukken draad:', 12), { ...F('Samen:', total, 'cm'), br: true }],
      hint: 'Elke ribbe is een stuk draad. Tel de ribben van het grondvlak, van het bovenvlak en de opstaande ribben.',
      steps: [
        'Een kubus heeft 4 + 4 + 4 = 12 ribben, dus 12 stukken draad.',
        `Samen is dat 12 * ${d(r)} = ${d(total)} cm.`,
      ],
      traps: [
        trap(
          'hoekpunten-geteld',
          'Een kubus heeft 8 hoekpunten, maar 12 ribben: 4 onder, 4 boven en 4 opstaand.',
          (x) => x[0] === 8,
          (x) => near(x[1], 8 * r),
        ),
        trap(
          'zijvlakken-geteld',
          'Een kubus heeft 6 zijvlakken, maar 12 ribben: 4 onder, 4 boven en 4 opstaand.',
          (x) => x[0] === 6,
          (x) => near(x[1], 6 * r),
        ),
        trap(
          'ribben-dubbel-geteld',
          'Je komt op 24 uit: 6 zijvlakken met elk 4 ribben. Maar elke ribbe hoort bij twee zijvlakken, dus je hebt elke ribbe twee keer geteld. Een kubus heeft 12 ribben.',
          (x) => x[0] === 24,
          (x) => near(x[1], 24 * r),
        ),
      ],
      v: () => near(sum, total, 1e-9) && f.edges.length === 12,
    };
  }
  const drawn = type === 'tekening',
    L = pick(LETTERS),
    model = drawn ? null : pick(MODELLEN),
    [l, b, h] = drawn
      ? until(
          () => [pick([4, 5, 6, 7]), pick([2, 3, 4]), pick([2, 3, 4, 5])],
          ([l, b, h]) => !(l === b && b === h) && l !== h,
        )
      : model.dims.map(pick),
    dims = { [RECHTS]: l, [ACHTER]: b, [OMHOOG]: h },
    ring = outline(L),
    len = drawn
      ? Object.fromEntries([RECHTS, ACHTER, OMHOOG].map((a) => [pick(ring[a]), dims[a]]))
      : null,
    shape = boxShape('balk', l, b, h, L, len),
    f = solidFacts(shape),
    x = pick([l, b, h]),
    n = 4 * [l, b, h].filter((y) => y === x).length,
    which = ['lengte', 'breedte', 'hoogte'].filter((_, i) => [l, b, h][i] === x),
    total = 4 * (l + b + h),
    stuk = drawn ? 'ribben' : model.stuk;
  const fields = [
    {
      ...F(`${stuk[0].toUpperCase()}${stuk.slice(1)} van ${d(x)} cm:`, n),
      label: `Aantal ${stuk} van ${d(x)} cm`,
    },
    { ...F('Alle ribben samen:', total, 'cm'), br: true },
  ];
  const sumText = `4 * ${d(l)} + 4 * ${d(b)} + 4 * ${d(h)} = ${d(4 * l)} + ${d(4 * b)} + ${d(4 * h)} = ${d(total)}`;
  return {
    q: T(
      drawn
        ? `Hieronder staat balk ${naam(L)}. Alle maten staan in cm. Hoeveel ribben zijn ${d(x)} cm lang? Hoe lang zijn alle ribben samen?`
        : `${model.t} De balk is ${d(l)} cm lang, ${d(b)} cm breed en ${d(h)} cm hoog. Hoeveel ${stuk} zijn ${d(x)} cm lang? Hoeveel cm zijn alle ribben samen?`,
    ),
    ...(drawn ? { fig: solid(shape) } : {}),
    fields,
    hint: 'Een balk heeft drie groepen van vier even lange ribben: vier keer de lengte, vier keer de breedte en vier keer de hoogte.',
    steps: [
      n === 4
        ? `De ${which[0]} is ${d(x)} cm. Een balk heeft vier ribben voor de ${which[0]}, dus 4 ribben.`
        : `De ${which[0]} en de ${which[1]} zijn allebei ${d(x)} cm. Dat zijn 4 + 4 = 8 ribben.`,
      `Alle ribben samen: ${sumText} cm.`,
    ],
    traps: [
      {
        id: 'keer-vier-vergeten',
        f: (y) => near(y[1], l + b + h),
        m: `Je hebt elke maat maar één keer geteld. Van elke maat zijn er vier ribben, dus 4 * (${d(l)} + ${d(b)} + ${d(h)}).`,
      },
      drawn &&
        trap(
          'gestippeld-vergeten',
          'Tel de gestippelde ribben ook mee. Je ziet ze niet, maar ze zijn er wel.',
          (y) =>
            y[0] ===
            f.edges.filter((e) => near(realLen(f, e), x, 1e-9) && !f.hidden.includes(e)).length,
          (y) => near(y[1], 3 * (l + b + h)),
        ),
      n === 8 && {
        id: 'groep-vergeten',
        f: (y) => y[0] === 4,
        m: `Twee maten van de balk zijn ${d(x)} cm. Dan zijn er twee groepen van vier ribben die ${d(x)} cm zijn.`,
      },
    ].filter(Boolean),
    // De controle telt elke ribbe op, met de lengte uit de hoekpunten.
    v: () =>
      near(
        f.edges.reduce((s, e) => s + realLen(f, e), 0),
        total,
        1e-9,
      ) && f.edges.filter((e) => near(realLen(f, e), x, 1e-9)).length === n,
  };
}

// ---------------------------------------------------------------------------------------------
// 157: de maten in een uitslag van een balk.

const VLAK = ['A', 'B', 'C', 'D', 'E'];

function s13net() {
  const [cells, dims, fs] = until(
    () => {
      const t = pick(TURNS),
        c = pick(CUBE_NETS).map(t),
        ds = [pick([2, 3, 4]), pick([1, 2, 3]), pick([2, 3, 4])];
      return [c, ds, boxFaces(c, ds)];
    },
    ([, ds, fs]) =>
      !(ds[0] === ds[1] && ds[1] === ds[2]) &&
      fs !== null &&
      Math.max(...fs.map((r) => r.x + r.w)) <= 13 &&
      Math.max(...fs.map((r) => r.y + r.h)) <= 12,
  );
  const s = pick([0, 1, 2, 3, 4, 5]),
    opp = opposite(cells, s),
    sorted = (r) => [r.w, r.h].sort((p, q) => p - q),
    same = (i) => sorted(fs[i]).join() === sorted(fs[s]).join(),
    m = fs.filter((_, i) => same(i)).length,
    [l, b, h] = dims;
  // De vlakken zonder kleur krijgen een letter, van boven naar beneden en van links naar rechts.
  const order = fs
      .map((r, i) => i)
      .filter((i) => i !== s)
      .sort((p, q) => fs[p].y - fs[q].y || fs[p].x - fs[q].x),
    letterOf = Object.fromEntries(order.map((i, k) => [i, VLAK[k]]));
  // Vlakken die in de uitslag van een balk aan het gekleurde vlak vastzitten.
  const touch = (i) =>
    Math.abs(cells[i][0] - cells[s][0]) + Math.abs(cells[i][1] - cells[s][1]) === 1;
  // De controle: de vlakken uit boxFaces moeten precies de zes vlakken zijn die je uit l, b en h
  // maakt, twee keer l bij b, twee keer l bij h en twee keer b bij h. Tegenover elkaar liggen even
  // grote vlakken die niet aan elkaar vastzitten.
  const sizesOk = () => {
    const want = [
        [l, b],
        [l, b],
        [l, h],
        [l, h],
        [b, h],
        [b, h],
      ].map((p) => p.sort((x, y) => x - y).join()),
      got = fs.map((r) => sorted(r).join());
    return want.sort().join(' ') === got.sort().join(' ');
  };
  const intro = 'Hieronder staat een uitslag van een balk. De zijde van een hokje is 1 cm.';
  if (coin()) {
    const marks = Object.fromEntries(order.map((i) => [i, letterOf[i]])),
      fig = net({ cells, dims, u: 20, marks, shade: [s] }),
      [w, hh] = [fs[s].w, fs[s].h],
      touching = order.filter(touch).map((i) => letterOf[i]),
      beside = order.filter((i) => i !== opp && !touch(i)).map((i) => letterOf[i]);
    return {
      q: T(
        `${intro} Hoe groot is het gekleurde vlak? Welk vlak komt tegenover het gekleurde vlak als je de balk vouwt?`,
      ),
      fig,
      fields: [
        {
          ...F('Het gekleurde vlak is', w, 'cm'),
          grp: 'v',
          label: 'Eerste maat van het gekleurde vlak',
        },
        { ...F('bij', hh, 'cm'), grp: 'v', label: 'Tweede maat van het gekleurde vlak' },
        {
          sel: VLAK,
          a: letterOf[opp],
          pre: 'Tegenover het gekleurde vlak komt vlak',
          label: 'Vlak tegenover het gekleurde vlak',
          br: true,
        },
      ],
      hint: 'Tel de hokjes langs de randen van het gekleurde vlak. Vlakken die aan elkaar vastzitten, komen naast elkaar als je vouwt, nooit tegenover elkaar.',
      steps: [
        `Het gekleurde vlak is ${w} hokjes breed en ${hh} hokjes hoog, dus ${w} cm bij ${hh} cm.`,
        `Vouw de uitslag van een balk in gedachten. Vlak ${letterOf[opp]} komt tegenover het gekleurde vlak.`,
        `Vlak ${letterOf[opp]} is ook ${d(sorted(fs[opp])[0])} bij ${d(sorted(fs[opp])[1])} cm. Tegenover elkaar liggen altijd even grote vlakken.`,
      ],
      traps: [
        touching.length && {
          id: 'vastzittend-vlak',
          f: (x) => touching.includes(x[2]),
          m: 'Dit vlak zit aan het gekleurde vlak vast. Als je vouwt, komt het ernaast, niet ertegenover.',
        },
        beside.length && {
          id: 'buurvlak-gekozen',
          f: (x) => beside.includes(x[2]),
          m: 'Als je vouwt, komt dit vlak naast het gekleurde vlak, niet ertegenover. Vouw de uitslag van een balk in gedachten.',
        },
      ].filter(Boolean),
      v: () =>
        sizesOk() &&
        sorted(fs[opp]).join() === sorted(fs[s]).join() &&
        !touch(opp) &&
        opp !== s &&
        [w, hh].sort((p, q) => p - q).join() === sorted(fs[s]).join(),
    };
  }
  // De maten van de balk, in elke volgorde.
  const abc = [...dims].sort((p, q) => p - q),
    fig = net({ cells, dims, u: 20, shade: [s] });
  return {
    q: T(
      `${intro} Hoe lang, hoe breed en hoe hoog is de balk? Je mag de maten in elke volgorde invullen. Hoeveel vlakken zijn even groot als het gekleurde vlak? Tel het gekleurde vlak zelf ook mee.`,
    ),
    fig,
    fields: [
      { ...F('De balk is', abc[0]), grp: 'm', label: 'Eerste maat van de balk' },
      { ...F('bij', abc[1]), grp: 'm', label: 'Tweede maat van de balk' },
      { ...F('bij', abc[2], 'cm'), grp: 'm', label: 'Derde maat van de balk' },
      { ...F('Even groot als het gekleurde vlak:', m, 'vlakken'), br: true },
    ],
    hint: 'Elk vlak van de uitslag van een balk is een zijvlak van de balk. Elk vlak heeft twee van de drie maten van de balk. Tegenover elkaar liggen even grote vlakken.',
    steps: [
      `De vlakken zijn ${and([...new Set(fs.map((r) => sorted(r).join(' bij ')))])} hokjes.`,
      `Daarin komen drie maten voor: ${and(abc.map(String))} cm. Dus de balk is ${abc.join(' bij ')} cm.`,
      `Het gekleurde vlak is ${sorted(fs[s]).join(' bij ')} cm. ${m === 2 ? 'Alleen het vlak dat ertegenover komt, is even groot. Dus 2 vlakken.' : `Er zijn ${m} vlakken van ${sorted(fs[s]).join(' bij ')} cm, want twee maten van de balk zijn gelijk.`}`,
    ],
    traps: [
      {
        id: 'tegenover-vergeten',
        f: (x) => x[3] === 1,
        m: 'Het vlak dat tegenover het gekleurde vlak komt, is even groot. Tel het gekleurde vlak zelf ook mee.',
      },
      m === 4 && {
        id: 'even-groot-gemist',
        f: (x) => x[3] === 2,
        m: 'Twee maten van de balk zijn gelijk. Daardoor zijn er nog twee vlakken die even groot zijn als het gekleurde vlak.',
      },
    ].filter(Boolean),
    // De maten volgen ook uit de oppervlaktes van drie verschillende vlakken: bij vlakken van
    // l·b, l·h en b·h is l = √(l·b · l·h / (b·h)).
    v: () => {
      // Eén vlak uit elk paar vlakken dat tegenover elkaar komt.
      const one = [];
      fs.forEach((_, i) => {
        if (!one.some((k) => k === i || opposite(cells, k) === i)) one.push(i);
      });
      const A = one.map((i) => fs[i].w * fs[i].h),
        got = [
          Math.sqrt((A[0] * A[1]) / A[2]),
          Math.sqrt((A[0] * A[2]) / A[1]),
          Math.sqrt((A[1] * A[2]) / A[0]),
        ].sort((p, q) => p - q);
      return (
        one.length === 3 &&
        sizesOk() &&
        got.every((x, i) => near(x, abc[i], 1e-9)) &&
        fs.filter((_, i) => same(i)).length === m &&
        same(opp)
      );
    },
  };
}

export default {
  slug: 'kubus-en-balk',
  title: 'Kubus en balk',
  intro:
    'Een kubus en een balk hebben zes zijvlakken, acht hoekpunten en twaalf ribben. Hier leer je die tellen en benoemen met letters, zoals zijvlak EFJI en ribbe DE. Ook leer je waarom sommige ribben gestippeld of korter getekend zijn, en reken je met de ribben en een uitslag van een balk.',
  description:
    'Kubus en balk oefenen: hoekpunten, ribben en zijvlakken tellen en benoemen, gestippelde ribben en de uitslag van een balk. Gratis met uitleg en hints.',
  videos: {},
  skills: [
    [151, 'Hoekpunten, ribben en zijvlakken van een kubus of balk', s12count],
    [152, 'Ribben, zijvlakken en hoekpunten benoemen', s12name],
    [153, 'Gestippelde ribben', s12hidden],
    [154, 'Ribben die korter getekend zijn', s12short],
    [155, 'Gelijke ribben en gelijke zijvlakken van een balk', s13same],
    [156, 'Ribben van een gegeven lengte tellen', s13edges],
    [157, 'Uitslag van een balk: de maten', s13net],
  ],
  learn: [
    {
      t: 'Hoekpunten, ribben en zijvlakken',
      p: [
        'Een kubus heeft zes zijvlakken. Dat zijn even grote vierkanten. Een balk heeft zes rechthoeken als zijvlakken.',
        'Een kubus en een balk hebben allebei 8 hoekpunten en 12 ribben. In elk hoekpunt komen 3 ribben samen.',
        'Je geeft de hoekpunten letters: eerst het grondvlak, dan het bovenvlak, allebei tegen de klok in. Zo krijg je kubus DEFG HIJK. Een zijvlak noem je met vier letters, zoals zijvlak EFJI. Een ribbe noem je met twee letters, zoals ribbe DE.',
      ],
      ex: {
        q:
          T('Welke ribben komen samen in hoekpunt E van kubus DEFG HIJK?') +
          solid({ kind: 'kubus', l: 3, letters: VOORBEELD }),
        steps: [
          'Vanuit E gaan drie ribben: naar D, naar F en naar I.',
          'Dus de ribben DE, EF en EI.',
        ],
      },
      watch: T(
        'Tel je 6 zijvlakken met elk 4 ribben, dan kom je op 24. Maar elke ribbe hoort bij twee zijvlakken, dus je telt elke ribbe twee keer. Een kubus heeft 12 ribben. Je kunt ook tellen in drie richtingen met elk 4 ribben: 3 * 4 = 12.',
      ),
    },
    {
      t: 'Gestippeld en korter getekend',
      p: [
        'Ribben die je in werkelijkheid niet ziet, teken je gestippeld. Bij een kubus of balk zijn dat drie ribben, aan de achterkant.',
        'De voorkant teken je op ware grootte. Ribben die schuin naar achteren lopen, teken je korter dan ze in werkelijkheid zijn.',
        'Daarom lijkt een zijvlak opzij of bovenop scheef. In werkelijkheid is het een vierkant of een rechthoek.',
      ],
      ex: {
        q:
          T('Welke ribben van balk DEFG HIJK zijn korter getekend?') +
          solid({ kind: 'balk', l: 5, b: 3, h: 2, letters: VOORBEELD }),
        steps: [
          'De ribben DG, EF, HK en IJ lopen schuin naar achteren.',
          'Die zijn korter getekend dan ze in werkelijkheid zijn.',
        ],
      },
      watch: T(
        'Gestippeld zegt niets over de lengte. Een gestippelde ribbe is even lang als de ribben die ernaast in dezelfde richting lopen.',
      ),
    },
    {
      t: 'De balk',
      p: [
        'Een balk heeft een lengte, een breedte en een hoogte. De ribben vormen drie groepen van vier even lange ribben.',
        'Zijvlakken die tegenover elkaar liggen, zijn even groot.',
        'Zijn twee maten gelijk, dan zijn twee zijvlakken vierkanten. Zijn alle drie de maten gelijk, dan is het een kubus.',
        'Alle ribben samen zijn 4 * lengte + 4 * breedte + 4 * hoogte.',
      ],
      ex: {
        q: T('Een balk is 6 cm lang, 3 cm breed en 2 cm hoog. Hoe lang zijn alle ribben samen?'),
        steps: ['4 * 6 + 4 * 3 + 4 * 2 = 24 + 12 + 8 = 44', 'Alle ribben samen zijn 44 cm.'],
      },
      watch: T(
        'Vergeet de gestippelde ribben niet. Je ziet ze niet in de tekening, maar ze zijn er wel.',
      ),
    },
    {
      t: 'Uitslag van een balk',
      p: [
        'Een uitslag van een balk heeft zes rechthoeken. Elk vlak heeft twee van de drie maten van de balk.',
        'Vlakken die tegenover elkaar komen als je vouwt, zijn even groot. In de uitslag van een balk zitten ze nooit aan elkaar vast.',
      ],
      ex: {
        q:
          T('Hoe groot is het gekleurde vlak? De zijde van een hokje is 1 cm.') +
          net({
            cells: [
              [1, 0],
              [0, 1],
              [1, 1],
              [2, 1],
              [3, 1],
              [1, 2],
            ],
            dims: [3, 2, 1],
            u: 20,
            shade: [0],
          }),
        steps: ['Het gekleurde vlak is 3 hokjes breed en 2 hokjes hoog.', 'Dus 3 cm bij 2 cm.'],
      },
      watch: T(
        'Tel de hokjes langs twee zijden van het vlak die in één hoek samenkomen: de breedte en de hoogte.',
      ),
    },
  ],
};
