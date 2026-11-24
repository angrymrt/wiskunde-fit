// Onderwerp: Tekenopdrachten (#232). De leerling tekent zelf: een kubus afmaken op roosterpapier, een driehoek
// met een passer en een uitslag van een kubus. Het tekenen, nakijken en de figuren staan in tekenvragen.js, het
// tikken en de knoppen in ui/tekenen.js. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten
// onderaan.
import { coin, pick, ri, until, d } from '../math.js';
import { H } from './shared.js';
import { T } from '../typeset.js';
import { and } from '../figures.js';
import { CUBE_NETS, canonicalNet, turned } from '../ruimte.js';
import {
  RIBBEN,
  SOORTEN,
  hoek,
  rel,
  ribNaam,
  schuineRibbe,
  snijpunt,
  stukken,
  tekenAf,
  tekenFig,
  uitslagFout,
  voorkant,
} from '../tekenvragen.js';

// Het ene veld van een tekenvraag: daarin staat wat de leerling tekent, als tekst. a is een goede tekening.
const veld = (a) => ({ teken: true, a, label: 'Je tekening' });
const same = (p, q) => !!p && !!q && p[0] === q[0] && p[1] === q[1];

// ---------------------------------------------------------------------------------------------
// 182: een kubus afmaken op roosterpapier.

// Letters bij de hoekpunten: eerst het grondvlak, dan het bovenvlak, tegen de klok in vanaf linksvoor. Zonder
// de I en de O, die lijken op 1 en 0.
const LETTERS = ['DEFGRSTU', 'GHJKVWXY', 'LMNPWXYZ', 'MNPQVWXY', 'STUVDEFG'];
// Hoeveel hokjes een schuine ribbe naar rechts en omhoog gaat. Altijd korter dan de ribbe zelf.
const SCHUIN = [
  [1, 1],
  [2, 1],
  [2, 2],
];
// Een kubus op het rooster. Bij achter staan het zijvlak aan de voorkant en één schuine ribbe er al, en tikt
// de leerling de andere hoekpunten aan de achterkant aan. Anders staat het grondvlak er al, en tikt de
// leerling het bovenvlak aan.
function kubusVraag(L, n, s, achter, g) {
  return {
    soort: 'kubus',
    n,
    s,
    o: [1, 1],
    W: n + 4,
    H: n + 4,
    L,
    geg: achter ? [0, 1, 5, 4, g] : [0, 1, 2, 3],
    zet: achter ? [2, 3, 6, 7].filter((i) => i !== g) : [4, 5, 6, 7],
  };
}
const naamKubus = (L) => `kubus ${L.slice(0, 4)} ${L.slice(4)}`;
const voorvlak = (L) => `${L[0]}${L[1]}${L[5]}${L[4]}`;
// De gestippelde ribben: die bij het hoekpunt linksachter onder.
const gestippeld = (t) =>
  and(
    RIBBEN.filter((r) => r.includes(3))
      .map((r) => ribNaam(t, r))
      .sort(),
  );

// Of acht hoekpunten samen een kubus op roosterpapier zijn: het zijvlak aan de voorkant een vierkant van n bij
// n, de ribben omhoog recht omhoog en n lang, en de vier schuine ribben gelijk, naar rechts en omhoog en korter
// dan n. Zo rekent de controle anders dan hoek() in tekenvragen.js.
function isKubusTekening(P, n) {
  const sub = (p, q) => [p[0] - q[0], p[1] - q[1]],
    eq = (u, w) => u[0] === w[0] && u[1] === w[1],
    schuin = [
      [3, 0],
      [2, 1],
      [6, 5],
      [7, 4],
    ].map(([a, b]) => sub(P[a], P[b])),
    op = [
      [4, 0],
      [5, 1],
      [6, 2],
      [7, 3],
    ].map(([a, b]) => sub(P[a], P[b]));
  return (
    eq(sub(P[1], P[0]), [n, 0]) &&
    op.every((w) => eq(w, [0, n])) &&
    schuin.every((w) => eq(w, schuin[0])) &&
    schuin[0][0] > 0 &&
    schuin[0][1] > 0 &&
    Math.hypot(...schuin[0]) < n
  );
}

function kubusAfmaken() {
  const L = pick(LETTERS),
    n = pick([3, 4]),
    s = pick(SCHUIN),
    achter = coin(),
    g = achter ? pick([2, 3, 6, 7]) : null,
    t = kubusVraag(L, n, s, achter, g),
    goed = t.zet.map((i) => hoek(t, i)),
    a = SOORTEN.kubus.schrijf(t, goed),
    lees = (v) => SOORTEN.kubus.lees(t, v[0]),
    letters = and(t.zet.map((i) => L[i])),
    rib = ribNaam(t, schuineRibbe(t)),
    voor = voorvlak(L),
    grond = L.slice(0, 4);
  const verwisseld = {
    id: 'letters-verwisseld',
    f: (v) => {
      const p = lees(v);
      return goed.every((q) => p.some((r) => same(r, q))) && !p.every((r, k) => same(r, goed[k]));
    },
    m: `Je punten liggen goed, maar de letters staan op de verkeerde plek. Tik de hoekpunten aan in de volgorde van de vraag: ${letters}.`,
  };
  const traps = achter
    ? [
        verwisseld,
        {
          id: 'schuin-anders',
          f: (v) => lees(v).some((p) => p && !goed.some((q) => same(p, q))),
          m: `Alle ribben die schuin naar achteren lopen, zijn even lang en lopen dezelfde kant op. Ribbe ${rib} gaat ${rel(s)}. Doe dat ook bij de andere hoekpunten van zijvlak ${voor}.`,
        },
      ]
    : [
        verwisseld,
        {
          id: 'niet-recht-omhoog',
          f: (v) => lees(v).some((p, k) => p && p[0] !== hoek(t, t.zet[k] - 4)[0]),
          m: `De ribben omhoog staan recht omhoog. Zo ligt ${L[4]} recht boven ${L[0]}, en ${L[5]} recht boven ${L[1]}.`,
        },
        {
          id: 'hoogte-anders',
          f: (v) =>
            lees(v).some((p, k) => {
              const b = hoek(t, t.zet[k] - 4);
              return p && p[0] === b[0] && p[1] !== b[1] + n;
            }),
          m: `Bij een kubus zijn alle ribben even lang. Ribbe ${L[0]}${L[1]} is ${n} hokjes, dus de ribben omhoog zijn ook ${n} hokjes.`,
        },
      ];
  const af = H(tekenAf(t, a, `${naamKubus(L)} is af.`));
  return {
    q: T(
      achter
        ? `Maak ${naamKubus(L)} af op het rooster. Zijvlak ${voor} aan de voorkant en ribbe ${rib} staan er al. Tik de hoekpunten ${letters} aan, in die volgorde.`
        : `Maak ${naamKubus(L)} af op het rooster. Grondvlak ${grond} staat er al. Tik de hoekpunten ${letters} van het bovenvlak aan, in die volgorde.`,
    ),
    fig: tekenFig(t),
    teken: t,
    fields: [veld(a)],
    hint: achter
      ? `Alle ribben die schuin naar achteren lopen, zijn even lang en lopen dezelfde kant op. Tel hoeveel hokjes ribbe ${rib} naar rechts en omhoog gaat.`
      : `Bij een kubus zijn alle ribben even lang. Hoeveel hokjes is ribbe ${L[0]}${L[1]}?`,
    steps: achter
      ? [
          `Ribbe ${rib} gaat ${rel(s)}. Alle ribben die schuin naar achteren lopen, zijn even lang en lopen dezelfde kant op.`,
          ...t.zet.map((i) => `${L[i]} ligt ${rel(s)} van ${L[voorkant(i)]}.`),
          `De ribben ${gestippeld(t)} zie je niet. Die teken je gestippeld.`,
          af,
        ]
      : [
          `Ribbe ${L[0]}${L[1]} is ${n} hokjes. Bij een kubus zijn alle ribben even lang, dus de ribben omhoog zijn ook ${n} hokjes.`,
          ...t.zet.map((i) => `${L[i]} ligt ${n} hokjes recht boven ${L[i - 4]}.`),
          `De ribben ${gestippeld(t)} zie je niet. Die teken je gestippeld.`,
          af,
        ],
    traps,
    v: () => {
      const p = lees([a]),
        P = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
          t.geg.includes(i) ? hoek(t, i) : p[t.zet.indexOf(i)],
        );
      return (
        isKubusTekening(P, n) &&
        P.every((q) => q[0] >= 0 && q[0] <= t.W && q[1] >= 0 && q[1] <= t.H)
      );
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 183: een driehoek tekenen als de drie zijden bekend zijn, met een passer.

const DRIEHOEKEN = ['GHJ', 'RST', 'XYZ', 'MNP', 'VWX', 'DEG'];
const ZIJDEN = [2.5, 3, 3.5, 4, 4.5, 5, 5.5];
// Een driehoek die goed te tekenen is: het derde hoekpunt ligt tussen 1,5 en 4,5 cm boven de eerste zijde, en
// de hoeken bij die zijde zijn tussen 25° en 115°. Dan vallen de boogjes in het rooster.
function mooiDriehoek(ab, ac, bc) {
  const C = snijpunt(ab, ac, bc);
  if (!C || C[1] < 1.5 || C[1] > 4.5) return false;
  const graden = (y, x) => (Math.atan2(y, x) * 180) / Math.PI;
  return [graden(C[1], C[0]), graden(C[1], ab - C[0])].every((h) => h >= 25 && h <= 115);
}

function driehoekPasser() {
  const L = pick(DRIEHOEKEN),
    ab = pick([4, 4.5, 5, 5.5, 6]),
    [ac, bc] = until(
      () => [pick(ZIJDEN), pick(ZIJDEN)],
      ([p, q]) => mooiDriehoek(ab, p, q),
    ),
    t = { soort: 'passer', ab, ac, bc, L, x1: Math.ceil(ab) + 1, y1: 6 },
    C = snijpunt(ab, ac, bc),
    a = SOORTEN.passer.schrijf(t, { ra: ac, rb: bc, c: C }),
    lees = (v) => SOORTEN.passer.lees(t, v[0]),
    [P, Q, R] = L,
    PQ = P + Q,
    PR = P + R,
    QR = Q + R,
    cGoed = (st) => SOORTEN.passer.nakijken(t, st)[2];
  const near = (x, y) => Math.abs(x - y) < 1e-9;
  return {
    q: T(
      `Teken △${L} met ${PQ} = ${d(ab)} cm, ${PR} = ${d(ac)} cm en ${QR} = ${d(bc)} cm. Zijde ${PQ} staat er al. Gebruik de passer, en gum de boogjes niet weg.`,
    ),
    fig: tekenFig(t),
    teken: t,
    fields: [veld(a)],
    hint: `${R} ligt ${d(ac)} cm van ${P} en ${d(bc)} cm van ${Q}. Welke punten liggen ${d(ac)} cm van ${P}? Die vind je met de passer.`,
    steps: [
      `Zijde ${PQ} = ${d(ab)} cm staat er al.`,
      `Stel de passer in op ${PR} = ${d(ac)} cm. Zet de punt in ${P} en teken een boogje.`,
      `Stel de passer in op ${QR} = ${d(bc)} cm. Zet de punt in ${Q} en teken een boogje dat het eerste boogje snijdt. Het snijpunt is ${R}.`,
      `Teken de zijden ${PR} en ${QR}. Gum de boogjes niet weg.`,
      H(tekenAf(t, a, `△${L} is getekend, met de boogjes.`)),
    ],
    traps: [
      {
        id: 'zijden-verwisseld',
        f: (v) => {
          const st = lees(v);
          return !near(ac, bc) && near(st.ra, bc) && near(st.rb, ac);
        },
        m: `Je hebt de stralen verwisseld. ${R} ligt ${d(ac)} cm van ${P}, dus vanuit ${P} teken je een boogje met straal ${PR} = ${d(ac)} cm.`,
      },
      {
        id: 'straal-eerste-zijde',
        f: (v) => {
          const st = lees(v);
          return (near(st.ra, ab) && !near(ab, ac)) || (near(st.rb, ab) && !near(ab, bc));
        },
        m: `Zijde ${PQ} staat er al. Voor ${R} gebruik je de twee andere zijden: ${PR} vanuit ${P} en ${QR} vanuit ${Q}.`,
      },
      {
        id: 'boogjes-vergeten',
        f: (v) => {
          const st = lees(v);
          return cGoed(st) && (!st.ra || !st.rb);
        },
        m: `${R} ligt goed. Maar teken de boogjes met de passer, en gum ze niet weg. Daaraan zie je hoe je ${R} hebt gevonden.`,
      },
      {
        id: 'niet-op-snijpunt',
        f: (v) => {
          const st = lees(v);
          return near(st.ra, ac) && near(st.rb, bc) && !!st.c && !cGoed(st);
        },
        m: `Je boogjes kloppen. Zet ${R} precies op het snijpunt van de twee boogjes.`,
      },
      {
        id: 'straal-fout',
        f: (v) => {
          const st = lees(v);
          return (!!st.ra && !near(st.ra, ac)) || (!!st.rb && !near(st.rb, bc));
        },
        m: `Een boogje heeft niet de goede straal. Vanuit ${P} is de straal ${PR} = ${d(ac)} cm, en vanuit ${Q} is de straal ${QR} = ${d(bc)} cm.`,
      },
    ],
    // Meet de afstanden van het snijpunt tot de eerste twee hoekpunten na, in plaats van het snijpunt uit te rekenen.
    v: () => {
      const c = lees([a]).c;
      return (
        C[1] > 0 &&
        Math.abs(Math.hypot(c[0], c[1]) - ac) < 0.01 &&
        Math.abs(Math.hypot(t.ab - c[0], c[1]) - bc) < 0.01
      );
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 184: een uitslag van een kubus tekenen, of afmaken.

const W = 6,
  HOOG = 5;
// De uitslagen van een kubus met een rij van vier, met één vierkant erboven en één eronder.
const RIJ_VAN_VIER = CUBE_NETS.filter((n) =>
  [0, 1, 2].some((y) => n.filter((c) => c[1] === y).length === 4),
);
const sleutel = (cells) => JSON.stringify(canonicalNet(cells));
// Draait of spiegelt een uitslag en zet hem op een plek in het rooster.
function inRooster(net) {
  const c = turned(net),
    x0 = Math.min(...c.map((p) => p[0])),
    y0 = Math.min(...c.map((p) => p[1])),
    w = Math.max(...c.map((p) => p[0])) - x0 + 1,
    h = Math.max(...c.map((p) => p[1])) - y0 + 1,
    dx = ri(0, W - w) - x0,
    dy = ri(0, HOOG - h) - y0;
  return c.map(([x, y]) => [x + dx, y + dy]);
}

function uitslagTekenen() {
  const vrij = coin(),
    net = inRooster(vrij ? pick(RIJ_VAN_VIER) : pick(CUBE_NETS)),
    k = vrij ? 6 : pick([1, 2]),
    // Bij afmaken vallen er een of twee vierkanten weg. Wat er staat, blijft één stuk.
    weg = vrij
      ? [0, 1, 2, 3, 4, 5]
      : until(
          () => {
            const i = ri(0, 5);
            if (k === 1) return [i];
            const j = ri(0, 4);
            return [i, j >= i ? j + 1 : j];
          },
          (w) => stukken(net.filter((_, i) => !w.includes(i))).length === 1,
        ),
    t = { soort: 'uitslag', W, H: HOOG, geg: net.filter((_, i) => !weg.includes(i)) },
    erbij = net.filter((_, i) => weg.includes(i)),
    a = SOORTEN.uitslag.schrijf(t, erbij),
    fout = (id) => (v) => uitslagFout(t, SOORTEN.uitslag.lees(t, v[0]))?.id === id;
  return {
    q: T(
      vrij
        ? 'Teken een uitslag van een kubus in het rooster. Tik zes hokjes aan: voor elk zijvlak één.'
        : `In het rooster staan al ${6 - k} hokjes van een uitslag van een kubus. Maak de uitslag af: tik er nog ${k === 1 ? 'één hokje' : 'twee hokjes'} bij.`,
    ),
    fig: tekenFig(t),
    teken: t,
    fields: [veld(a)],
    hint: vrij
      ? 'Begin met een rij van vier hokjes. Die vouw je om de kubus heen. Welke twee zijvlakken ontbreken dan nog?'
      : `Vouw de hokjes in gedachten tot een kubus. ${k === 1 ? 'Welk zijvlak blijft open?' : 'Welke twee zijvlakken blijven open?'}`,
    steps: vrij
      ? [
          'Een kubus heeft zes zijvlakken. Een uitslag van een kubus heeft dus zes hokjes, die met hele zijden aan elkaar vastzitten.',
          'Een rij van vier hokjes vouw je om de kubus heen. Dan ontbreken nog het grondvlak en het bovenvlak. Zet dus aan elke kant van de rij één hokje.',
          'Zo krijg je bijvoorbeeld deze uitslag. Er zijn elf verschillende uitslagen van een kubus, dus er zijn meer goede antwoorden.',
          H(tekenAf(t, a, 'Een goede uitslag van een kubus.')),
        ]
      : [
          'Vouw de hokjes in gedachten tot een kubus. Elk hokje komt op een ander zijvlak.',
          k === 1
            ? 'Er blijft één zijvlak open. Daar hoort het hokje dat je erbij zet.'
            : 'Er blijven twee zijvlakken open. Daar horen de hokjes die je erbij zet.',
          'Zo kan het. Soms kan het ook op een andere plek.',
          H(tekenAf(t, a, 'De uitslag van een kubus is af.')),
        ],
    traps: [
      {
        id: 'te-weinig-hokjes',
        f: fout('te-weinig-hokjes'),
        m: 'Een kubus heeft zes zijvlakken. Een uitslag van een kubus heeft dus zes hokjes.',
      },
      {
        id: 'te-veel-hokjes',
        f: fout('te-veel-hokjes'),
        m: 'Je hebt meer dan zes hokjes. Een kubus heeft maar zes zijvlakken, en plakrandjes teken je niet.',
      },
      {
        id: 'los-hokje',
        f: fout('los-hokje'),
        m: 'Niet alle hokjes zitten met een hele zijde aan elkaar vast. Een uitslag van een kubus is één stuk.',
      },
      {
        id: 'vierkant-van-vier',
        f: fout('vierkant-van-vier'),
        m: 'Vier hokjes in een vierkant van 2 bij 2 kun je niet vouwen. Bij een hoekpunt van een kubus komen maar drie zijvlakken samen.',
      },
      {
        id: 'rij-van-vijf',
        f: fout('rij-van-vijf'),
        m: 'Een rij van vijf hokjes kan niet. Vouw je vier hokjes om de kubus heen, dan komt het vijfde op het eerste.',
      },
      {
        id: 'zijvlak-dubbel',
        f: fout('zijvlak-dubbel'),
        m: 'Als je dit vouwt, komen twee hokjes op hetzelfde zijvlak, en blijft er een ander zijvlak open. In de figuur zie je welke twee hokjes op elkaar komen.',
      },
    ],
    // Vergelijkt de vorm met de elf uitslagen in ruimte.js, die met de hand zijn opgeschreven, in plaats van te vouwen.
    v: () => {
      const all = [...t.geg, ...SOORTEN.uitslag.lees(t, a)];
      return all.length === 6 && CUBE_NETS.some((n) => sleutel(n) === sleutel(all));
    },
  };
}

// ---------------------------------------------------------------------------------------------
// De voorbeelden in de uitleg.

const VB_KUBUS = kubusVraag('MNPQVWXY', 4, [2, 1], true, 2);
const VB_DRIEHOEK = { soort: 'passer', ab: 5, ac: 4, bc: 3, L: 'RST', x1: 6, y1: 6 };
const VB_UITSLAG = {
  soort: 'uitslag',
  W,
  H: HOOG,
  geg: [
    [2, 1],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
  ],
};
const vbKubus = SOORTEN.kubus.schrijf(
  VB_KUBUS,
  VB_KUBUS.zet.map((i) => hoek(VB_KUBUS, i)),
);
const vbDriehoek = SOORTEN.passer.schrijf(VB_DRIEHOEK, {
  ra: 4,
  rb: 3,
  c: snijpunt(5, 4, 3),
});

export default {
  slug: 'tekenopdrachten',
  title: 'Tekenopdrachten',
  intro:
    'Hier teken je zelf: een kubus op roosterpapier, een driehoek met een passer en een uitslag van een kubus.',
  description:
    'Tekenopdrachten oefenen: een kubus afmaken op roosterpapier, een driehoek tekenen met een passer en een uitslag van een kubus tekenen. Gratis met uitleg.',
  videos: {},
  skills: [
    [182, 'Een kubus afmaken', kubusAfmaken],
    [183, 'Een driehoek tekenen met een passer', driehoekPasser],
    [184, 'Een uitslag van een kubus tekenen', uitslagTekenen],
  ],
  learn: [
    {
      t: 'Een kubus tekenen op roosterpapier',
      p: [
        'Je tekent een kubus zoals je hem schuin van voren ziet. Het zijvlak aan de voorkant teken je op ware grootte: een vierkant.',
        'De ribben die naar achteren lopen, teken je schuin en korter. Ze gaan allemaal even ver naar rechts en omhoog. Zo zijn ze evenwijdig en even lang.',
        'Bij een kubus zijn alle ribben even lang. De ribben omhoog teken je dus even lang als de ribben aan de voorkant.',
        'De drie ribben die je in werkelijkheid niet ziet, teken je gestippeld.',
        'Op het scherm tik je de hoekpunten aan. De ribben komen er dan vanzelf bij.',
      ],
      ex: {
        q:
          T('Maak kubus MNPQ VWXY af. Zijvlak MNWV en ribbe NP staan er al.') +
          tekenAf(VB_KUBUS, '', 'Nog zonder Q, X en Y.'),
        steps: [
          'Ribbe NP gaat 2 hokjes naar rechts en 1 omhoog.',
          'Zo ligt Q 2 hokjes naar rechts en 1 omhoog van M, X van W en Y van V.',
          'De ribben MQ, PQ en QY zie je niet. Die teken je gestippeld.',
          H(tekenAf(VB_KUBUS, vbKubus, 'Kubus MNPQ VWXY is af.')),
        ],
      },
      watch:
        'Teken de schuine ribben niet even lang als de ribben aan de voorkant. Ze zijn korter getekend dan ze in werkelijkheid zijn.',
    },
    {
      t: 'Een driehoek tekenen met een passer',
      p: [
        'Weet je de drie zijden van een driehoek, dan teken je hem met een passer.',
        'Het derde hoekpunt ligt op een vaste afstand van de twee andere hoekpunten. Met de passer teken je alle punten op die afstand: een boogje. Waar de twee boogjes elkaar snijden, ligt het derde hoekpunt.',
      ],
      how: [
        'Teken de eerste zijde op ware grootte.',
        'Teken een boogje met het ene eindpunt als middelpunt en de tweede zijde als straal.',
        'Teken een boogje met het andere eindpunt als middelpunt en de derde zijde als straal. Het snijpunt van de boogjes is het derde hoekpunt.',
        'Maak de driehoek af, zet de letters erbij en gum de boogjes niet weg.',
      ],
      ex: {
        q: T('Teken △RST met RS = 5 cm, RT = 4 cm en ST = 3 cm.'),
        steps: [
          'Teken zijde RS = 5 cm.',
          'Stel de passer in op RT = 4 cm. Zet de punt in R en teken een boogje.',
          'Stel de passer in op ST = 3 cm. Zet de punt in S en teken een boogje. Het snijpunt van de boogjes is T.',
          'Teken de zijden RT en ST. Gum de boogjes niet weg.',
          H(tekenAf(VB_DRIEHOEK, vbDriehoek, '△RST is getekend, met de boogjes.')),
        ],
      },
      watch:
        'Gum de boogjes niet weg. Daaraan zie je hoe je de driehoek hebt getekend. Op het scherm stel je de passer in met − en +, en zet je hem neer met de knop bij het hoekpunt.',
    },
    {
      t: 'Een uitslag van een kubus tekenen',
      p: [
        'Een uitslag van een kubus bestaat uit zes vierkanten, één voor elk zijvlak. Ze zitten met hele zijden aan elkaar vast.',
        'Er zijn elf verschillende uitslagen van een kubus. Een rij van vier vierkanten met één vierkant erboven en één eronder is altijd goed.',
        'Twijfel je, vouw de uitslag dan in gedachten. Elk vierkant moet op een ander zijvlak komen.',
      ],
      ex: {
        q:
          T('Maak de uitslag van een kubus af. Er staan al vijf hokjes.') +
          tekenAf(VB_UITSLAG, '', 'Nog met vijf hokjes.'),
        steps: [
          'De rij van vier vouw je om de kubus heen. Het hokje erboven wordt het bovenvlak.',
          'Dan blijft het grondvlak open. Dat hokje zet je onder de rij, bijvoorbeeld onder het tweede hokje.',
          H(tekenAf(VB_UITSLAG, '2,3', 'Met het zesde hokje.')),
        ],
      },
      watch:
        'Vier hokjes in een vierkant van 2 bij 2 of een rij van vijf hokjes kan nooit. En plakrandjes teken je niet.',
    },
  ],
};
