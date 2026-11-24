// Onderwerp: Regelmatige veelvlakken. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { pick, coin, near, d } from '../math.js';
import { F, MC } from './shared.js';
import { T, tabel } from '../typeset.js';
import { geo, and } from '../figures.js';

// ---------------------------------------------------------------------------------------------
// De vijf regelmatige veelvlakken. zv is het aantal zijvlakken, vorm het aantal zijden van één
// zijvlak, en per het aantal ribben dat in elk hoekpunt samenkomt.
const VEELVLAKKEN = [
  { naam: 'tetraëder', zv: 4, vorm: 3, per: 3 },
  { naam: 'hexaëder', zv: 6, vorm: 4, per: 3 },
  { naam: 'octaëder', zv: 8, vorm: 3, per: 4 },
  { naam: 'dodecaëder', zv: 12, vorm: 5, per: 3 },
  { naam: 'icosaëder', zv: 20, vorm: 3, per: 5 },
];
const NAMEN = VEELVLAKKEN.map((s) => s.naam);
const VEELVLAK = Object.fromEntries(VEELVLAKKEN.map((s) => [s.naam, s]));
// Ribben: alle zijden van alle zijvlakken, en elke ribbe hoort bij twee zijvlakken.
const ribbenVan = (s) => (s.zv * s.vorm) / 2;
// Hoekpunten: elke ribbe heeft twee uiteinden, en in elk hoekpunt komen per ribben samen.
const hoekpuntenVan = (s) => (2 * ribbenVan(s)) / s.per;

// De vorm van een zijvlak, als meervoud, als enkelvoud en met een lidwoord.
const VORMEN = { 3: 'driehoeken', 4: 'vierkanten', 5: 'vijfhoeken', 6: 'zeshoeken' };
const EEN_VORM = {
  3: 'een gelijkzijdige driehoek',
  4: 'een vierkant',
  5: 'een regelmatige vijfhoek',
};
const KEUZE_VORMEN = [3, 4, 5, 6].map((k) => VORMEN[k]);
const groot = (s) => s[0].toUpperCase() + s.slice(1);

// Voor de controle: de vijf lichamen met echte hoekpunten in de ruimte. Daaruit tellen we de
// ribben (de kortste afstanden), de zijvlakken (de platte vlakken waar alle hoekpunten aan één
// kant van liggen) en de ribben per hoekpunt. Zo rekent de controle niet met de tabel hierboven.
const PHI = (1 + Math.sqrt(5)) / 2;
const PM = [1, -1];
const rond = ([a, b, c]) => [
  [a, b, c],
  [b, c, a],
  [c, a, b],
];
const kubusPunten = () => PM.flatMap((x) => PM.flatMap((y) => PM.map((z) => [x, y, z])));
const PUNTEN = {
  tetraëder: () => [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ],
  hexaëder: kubusPunten,
  octaëder: () => [0, 1, 2].flatMap((i) => PM.map((s) => [0, 1, 2].map((j) => (j === i ? s : 0)))),
  dodecaëder: () => [
    ...kubusPunten(),
    ...PM.flatMap((a) => PM.flatMap((b) => rond([0, a / PHI, b * PHI]))),
  ],
  icosaëder: () => PM.flatMap((a) => PM.flatMap((b) => rond([0, a, b * PHI]))),
};
const geteld = new Map();
function meet(naam) {
  if (geteld.has(naam)) return geteld.get(naam);
  const P = PUNTEN[naam](),
    n = P.length,
    min = (p, q) => p.map((c, i) => c - q[i]),
    dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2],
    kruis = (p, q) => [
      p[1] * q[2] - p[2] * q[1],
      p[2] * q[0] - p[0] * q[2],
      p[0] * q[1] - p[1] * q[0],
    ],
    afstand = (i, j) => Math.hypot(...min(P[i], P[j])),
    paren = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) paren.push([i, j]);
  const kort = Math.min(...paren.map(([i, j]) => afstand(i, j))),
    ribben = paren.filter(([i, j]) => near(afstand(i, j), kort, 1e-9)),
    vlakken = new Map();
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let k = j + 1; k < n; k++) {
        const nv = kruis(min(P[j], P[i]), min(P[k], P[i]));
        if (Math.hypot(...nv) < 1e-9) continue;
        const h = P.map((p) => dot(nv, min(p, P[i])));
        if (!h.every((x) => x < 1e-9) && !h.every((x) => x > -1e-9)) continue;
        const op = P.map((_, m) => m).filter((m) => Math.abs(h[m]) < 1e-9);
        vlakken.set(op.join(), op.length);
      }
  const graad = P.map((_, m) => ribben.filter((r) => r.includes(m)).length),
    maten = [...vlakken.values()],
    uit = {
      H: n,
      R: ribben.length,
      Z: vlakken.size,
      // Alle zijvlakken hebben evenveel hoekpunten, en elk hoekpunt evenveel ribben.
      vorm: maten.every((m) => m === maten[0]) ? maten[0] : 0,
      per: graad.every((g) => g === graad[0]) ? graad[0] : 0,
    };
  geteld.set(naam, uit);
  return uit;
}
// Klopt de rij uit de tabel met het lichaam zelf?
const klopt = (s) => {
  const m = meet(s.naam);
  return (
    m.Z === s.zv &&
    m.vorm === s.vorm &&
    m.per === s.per &&
    m.R === ribbenVan(s) &&
    m.H === hoekpuntenVan(s)
  );
};

// ---------------------------------------------------------------------------------------------
// 178: regelmatige veelhoek herkennen.

const HOEK_NAAM = { 3: 'driehoek', 4: 'vierhoek', 5: 'vijfhoek', 6: 'zeshoek' };
const REGELMATIG_NAAM = {
  3: 'een regelmatige driehoek: een gelijkzijdige driehoek',
  4: 'een regelmatige vierhoek: een vierkant',
  5: 'een regelmatige vijfhoek',
  6: 'een regelmatige zeshoek',
};
// Hoe een veelhoek is: regelmatig, alleen de zijden ongelijk, alleen de hoeken ongelijk, of allebei.
const REDEN = {
  regelmatig: 'alle zijden zijn even lang en alle hoeken zijn even groot',
  zijden: 'de hoeken zijn even groot, maar de zijden niet',
  hoeken: 'de zijden zijn even lang, maar de hoeken niet',
  beide: 'de zijden zijn niet even lang en de hoeken ook niet',
};
// Veelhoeken met hun zijden en hoeken. De hoek met nummer i hoort bij hoekpunt i, en zijde i loopt
// van hoekpunt i naar hoekpunt i + 1.
const VEELHOEKEN = [
  ...[3, 4, 5, 6].map((n) => ({
    soort: 'regelmatig',
    maak: () => {
      const s = pick([2, 3, 4, 5]);
      return { zijden: Array(n).fill(s), hoeken: Array(n).fill(((n - 2) * 180) / n) };
    },
  })),
  {
    // Een rechthoek.
    soort: 'zijden',
    maak: () => {
      const [l, b] = pick([
        [5, 3],
        [6, 4],
        [4, 2],
        [5, 2],
        [6, 3],
      ]);
      return { zijden: [l, b, l, b], hoeken: [90, 90, 90, 90] };
    },
  },
  {
    // Een zeshoek met gelijke hoeken en om en om een lange en een korte zijde.
    soort: 'zijden',
    maak: () => {
      const [a, b] = pick([
        [3, 2],
        [4, 2],
        [3, 1.5],
        [4, 3],
      ]);
      return { zijden: [a, b, a, b, a, b], hoeken: Array(6).fill(120) };
    },
  },
  {
    // Een ruit: vier gelijke zijden, de hoeken om en om scherp en stomp.
    soort: 'hoeken',
    maak: () => {
      const s = pick([3, 4, 5]),
        a = pick([60, 70, 80]);
      return { zijden: [s, s, s, s], hoeken: [a, 180 - a, a, 180 - a] };
    },
  },
  {
    // Een huisje: een vierkant met een gelijkzijdige driehoek erop, alle vijf de zijden even lang.
    soort: 'hoeken',
    maak: () => {
      const s = pick([2, 3, 4]);
      return { zijden: Array(5).fill(s), hoeken: [90, 90, 150, 60, 150] };
    },
  },
  {
    // Een zeshoek met gelijke zijden en om en om een kleinere en een grotere hoek.
    soort: 'hoeken',
    maak: () => {
      const s = pick([2, 3]),
        a = pick([100, 110]);
      return { zijden: Array(6).fill(s), hoeken: [a, 240 - a, a, 240 - a, a, 240 - a] };
    },
  },
  {
    // Een trapezium met twee schuine zijden onder 60°.
    soort: 'beide',
    maak: () => {
      const k = pick([1, 1.5]);
      return { zijden: [6 * k, 2 * k, 4 * k, 2 * k], hoeken: [60, 60, 120, 120] };
    },
  },
];
// De hoekpunten: begin in (0, 0), loop zijde 0 naar rechts en draai bij elk hoekpunt linksom.
function lopen(zijden, hoeken) {
  const n = zijden.length,
    pts = [[0, 0]];
  let r = 0;
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    pts.push([x + zijden[i] * Math.cos(r), y + zijden[i] * Math.sin(r)]);
    r += ((180 - hoeken[(i + 1) % n]) * Math.PI) / 180;
  }
  return pts;
}
const BEGIN = ['A', 'D', 'K', 'P', 'R'];
const ALFABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function regelmatigeVeelhoek() {
  const soort = pick(['regelmatig', 'regelmatig', 'zijden', 'hoeken', 'beide']),
    { zijden, hoeken } = pick(VEELHOEKEN.filter((v) => v.soort === soort)).maak(),
    n = zijden.length,
    b = ALFABET.indexOf(pick(BEGIN)),
    L = ALFABET.slice(b, b + n),
    loop = lopen(zijden, hoeken),
    pts = Object.fromEntries([...L].map((c, i) => [c, loop[i]])),
    zij = [...L].map((c, i) => c + L[(i + 1) % n]),
    graden = hoeken.map((h) => `${d(h)}°`);
  const fig = geo({
    pts,
    segs: zij,
    sides: zij.map((g, i) => ({ a: g[0], b: g[1], t: `${d(zijden[i])} cm` })),
    w: 260,
    maxH: 220,
  });
  // Vier keuzes: ja of nee, met de reden erbij. Precies één past bij de veelhoek.
  const keuze = (k) => `${k === 'regelmatig' ? 'Ja' : 'Nee'}, ${REDEN[k]}.`,
    SOORTEN = Object.keys(REDEN),
    mc = MC([soort, ...SOORTEN.filter((k) => k !== soort)].map(keuze), 0),
    gekozen = (x) => SOORTEN.find((k) => keuze(k) === x[0]);
  const gelijk = (xs) => xs.every((x) => x === xs[0]),
    zijTekst = gelijk(zijden)
      ? `Alle zijden zijn ${d(zijden[0])} cm. Ze zijn even lang.`
      : `De zijden zijn ${and(zijden.map((z) => `${d(z)} cm`))}. Ze zijn niet allemaal even lang.`,
    hoekTekst = gelijk(hoeken)
      ? `Alle hoeken zijn ${graden[0]}. Ze zijn even groot.`
      : `De hoeken zijn ${and(graden)}. Ze zijn niet allemaal even groot.`;
  return {
    q: T(
      `Hieronder staat ${HOEK_NAAM[n]} ${L}. De hoeken bij ${and([...L])} zijn ${and(graden)}. Is ${HOEK_NAAM[n]} ${L} een regelmatige veelhoek? Waarom wel of niet?`,
    ),
    fig,
    mc,
    hint: 'Een veelhoek is regelmatig als alle zijden even lang zijn en ook alle hoeken even groot. Kijk naar allebei.',
    steps: [
      zijTekst,
      hoekTekst,
      soort === 'regelmatig'
        ? `Dus ${HOEK_NAAM[n]} ${L} is ${REGELMATIG_NAAM[n]}.`
        : `Dus ${HOEK_NAAM[n]} ${L} is geen regelmatige veelhoek.`,
    ],
    traps: [
      soort === 'hoeken' && {
        id: 'alleen-zijden-bekeken',
        f: (x) => gekozen(x) === 'regelmatig',
        m: 'Alle zijden zijn even lang, maar dat is niet genoeg. Bij een regelmatige veelhoek zijn ook alle hoeken even groot. Kijk naar de hoeken.',
      },
      soort === 'zijden' && {
        id: 'alleen-hoeken-bekeken',
        f: (x) => gekozen(x) === 'regelmatig',
        m: 'Alle hoeken zijn even groot, maar dat is niet genoeg. Bij een regelmatige veelhoek zijn ook alle zijden even lang. Kijk naar de zijden.',
      },
      soort === 'regelmatig' && {
        id: 'regelmatig-niet-herkend',
        f: (x) => gekozen(x) !== 'regelmatig',
        m: `Alle zijden zijn ${d(zijden[0])} cm en alle hoeken zijn ${graden[0]}. Dan is de veelhoek wel regelmatig.`,
      },
      soort !== 'regelmatig' && {
        id: 'reden-klopt-niet',
        f: (x) => !['regelmatig', soort].includes(gekozen(x)),
        m: 'Het is inderdaad geen regelmatige veelhoek, maar de reden klopt niet. Kijk apart naar de zijden en naar de hoeken. Zijn alle zijden even lang? Zijn alle hoeken even groot?',
      },
    ].filter(Boolean),
    // De controle meet de veelhoek na in de hoekpunten: komt de rondgang terug bij het begin, wat
    // zijn de lengtes van de zijden, en hoe groot zijn de hoeken tussen twee zijden?
    v: () => {
      const P = [...L].map((c) => pts[c]),
        dicht = near(loop[n][0], 0, 1e-9) && near(loop[n][1], 0, 1e-9),
        lang = P.map((p, i) => Math.hypot(P[(i + 1) % n][0] - p[0], P[(i + 1) % n][1] - p[1])),
        hoek = P.map((p, i) => {
          const a = P[(i + n - 1) % n],
            c = P[(i + 1) % n],
            u = [a[0] - p[0], a[1] - p[1]],
            w = [c[0] - p[0], c[1] - p[1]];
          return (
            (Math.acos((u[0] * w[0] + u[1] * w[1]) / Math.hypot(...u) / Math.hypot(...w)) * 180) /
            Math.PI
          );
        }),
        zelfde = (xs) => xs.every((x) => near(x, xs[0], 1e-6)),
        echt = zelfde(lang)
          ? zelfde(hoek)
            ? 'regelmatig'
            : 'hoeken'
          : zelfde(hoek)
            ? 'zijden'
            : 'beide';
      return (
        dicht &&
        lang.every((x, i) => near(x, zijden[i], 1e-6)) &&
        hoek.every((x, i) => near(x, hoeken[i], 1e-6)) &&
        near(
          hoek.reduce((s, x) => s + x, 0),
          (n - 2) * 180,
          1e-6,
        ) &&
        echt === soort &&
        mc.opts[mc.a] === keuze(echt) &&
        new Set(mc.opts).size === 4
      );
    },
  };
}

// ---------------------------------------------------------------------------------------------
// 179: de vijf regelmatige veelvlakken: naam, aantal zijvlakken en de vorm van de zijvlakken.

const BETEKENIS = 'Tetra betekent 4, hexa 6, octa 8, dodeca 12 en icosa 20.';
// Het begin van de naam, dat het aantal zijvlakken zegt: tetra, hexa, octa, dodeca of icosa.
const begin = (s) => s.naam.replace(/ëder$/, '');
// Valkuilen bij een foute vorm van de zijvlakken. Met num staat er in het veld een aantal zijden.
function vormValkuilen(s, at, num) {
  const vorm = (x) => (num ? VORMEN[x[at]] : x[at]);
  return [
    {
      id: 'geen-zeshoeken',
      f: (x) => vorm(x) === VORMEN[6],
      m: 'Geen enkel regelmatig veelvlak heeft zeshoeken als zijvlak. Drie regelmatige zeshoeken liggen plat tegen elkaar, dus ze maken geen hoekpunt.',
    },
    {
      id: 'vorm-verkeerd',
      f: (x) =>
        vorm(x) !== VORMEN[s.vorm] && vorm(x) !== VORMEN[6] && KEUZE_VORMEN.includes(vorm(x)),
      m: 'Alleen de hexaëder heeft vierkanten, en alleen de dodecaëder vijfhoeken. De tetraëder, de octaëder en de icosaëder hebben driehoeken als zijvlak.',
    },
  ];
}
const naamVeld = (s, pre, br) => ({
  sel: NAMEN,
  a: s.naam,
  pre,
  label: 'Naam van het regelmatige veelvlak',
  ...(br ? { br: true } : {}),
});
const vormVeld = (s, br) => ({
  sel: KEUZE_VORMEN,
  a: VORMEN[s.vorm],
  pre: 'De zijvlakken zijn',
  label: 'Vorm van de zijvlakken',
  ...(br ? { br: true } : {}),
});
const naamStap = (s) =>
  `${BETEKENIS} Dus ${s.zv} zijvlakken hoort bij de ${s.naam}${s.naam === 'hexaëder' ? ', de kubus' : ''}.`;
const vormStap = (s) =>
  `Elk zijvlak van de ${s.naam} is ${EEN_VORM[s.vorm]}. Dus de zijvlakken zijn ${VORMEN[s.vorm]}.`;
// Dobbelstenen voor een spel, met op elk zijvlak een getal.
const DOBBEL = [
  'Bij een bordspel hoort een dobbelsteen',
  'Voor een rollenspel heb je een dobbelsteen',
  'In een doos met spellen zit een dobbelsteen',
];

function vijfVeelvlakken() {
  const s = pick(VEELVLAKKEN),
    soort = pick(['naam', 'naam', 'aantal', 'hoekpunt']),
    v = () => klopt(s) && VEELVLAKKEN.filter((t) => meet(t.naam).Z === meet(s.naam).Z).length === 1;
  if (soort === 'aantal') {
    // Bij een naam: hoeveel zijvlakken en welke vorm?
    const kubus = s.naam === 'hexaëder',
      fields = [
        F('Zijvlakken:', s.zv),
        vormVeld(s, true),
        ...(kubus
          ? [
              {
                sel: ['balk', 'kubus', 'piramide', 'prisma'],
                a: 'kubus',
                pre: 'Een andere naam voor de hexaëder is',
                label: 'Andere naam voor de hexaëder',
                br: true,
              },
            ]
          : []),
      ];
    const od = { octaëder: 12, dodecaëder: 8 }[s.naam];
    return {
      q: T(
        `Een ${s.naam} is een regelmatig veelvlak. Hoeveel zijvlakken heeft een ${s.naam}? Welke vorm hebben de zijvlakken?${kubus ? ' Welke andere naam heeft de hexaëder?' : ''}`,
      ),
      fields,
      hint: `De naam zegt hoeveel zijvlakken er zijn. ${BETEKENIS}`,
      steps: [
        `De naam ${s.naam} begint met ${begin(s)}. ${BETEKENIS} Dus een ${s.naam} heeft ${s.zv} zijvlakken.`,
        vormStap(s),
        ...(kubus ? ['Een veelvlak met zes vierkanten als zijvlakken is een kubus.'] : []),
      ],
      traps: [
        od && {
          id: 'octaeder-en-dodecaeder-verwisseld',
          f: (x) => x[0] === od,
          m: 'Je hebt de octaëder en de dodecaëder verwisseld. Octa betekent 8 en dodeca betekent 12.',
        },
        ...vormValkuilen(s, 1),
        kubus && {
          id: 'balk-is-geen-regelmatig-veelvlak',
          f: (x) => x[2] === 'balk',
          m: 'Bij een balk zijn de zijvlakken rechthoeken, en die zijn niet altijd vierkanten. De hexaëder heeft zes even grote vierkanten: dat is een kubus.',
        },
      ].filter(Boolean),
      v,
    };
  }
  if (soort === 'hoekpunt') {
    // Uit de vorm van de zijvlakken en hoeveel er in een hoekpunt samenkomen: welk veelvlak?
    const drie = VEELVLAKKEN.filter((t) => t.vorm === 3).map((t) => t.naam);
    return {
      q: T(
        `Bij een regelmatig veelvlak is elk zijvlak ${EEN_VORM[s.vorm]}. In elk hoekpunt komen ${s.per} zijvlakken samen. Hoe heet dit veelvlak? Hoeveel zijvlakken heeft het?`,
      ),
      fields: [naamVeld(s, 'Het veelvlak heet de'), { ...F('Zijvlakken:', s.zv), br: true }],
      hint: 'Drie regelmatige veelvlakken hebben driehoeken als zijvlak. Je ziet het verschil aan het aantal zijvlakken in een hoekpunt.',
      steps: [
        s.vorm === 3
          ? `Driehoeken als zijvlak hebben de tetraëder (3 in een hoekpunt), de octaëder (4 in een hoekpunt) en de icosaëder (5 in een hoekpunt). Met ${s.per} in een hoekpunt is het de ${s.naam}.`
          : `Alleen de ${s.naam} heeft ${VORMEN[s.vorm]} als zijvlak.`,
        `${groot(begin(s))} betekent ${s.zv}, dus de ${s.naam} heeft ${s.zv} zijvlakken.`,
      ],
      traps: [
        s.vorm === 3 && {
          id: 'zijvlakken-per-hoekpunt',
          f: (x) => drie.includes(x[0]) && x[0] !== s.naam,
          m: 'Ook dit veelvlak heeft driehoeken als zijvlak, maar er komen er niet evenveel samen in een hoekpunt. Bij de tetraëder zijn het er 3, bij de octaëder 4 en bij de icosaëder 5.',
        },
        {
          id: 'vorm-verkeerd',
          f: (x) => NAMEN.includes(x[0]) && VEELVLAK[x[0]].vorm !== s.vorm && x[0] !== s.naam,
          m: `Dit veelvlak heeft geen ${VORMEN[s.vorm]} als zijvlak. Kijk eerst naar de vorm van de zijvlakken.`,
        },
      ].filter(Boolean),
      v: () =>
        klopt(s) &&
        VEELVLAKKEN.filter((t) => meet(t.naam).vorm === s.vorm && meet(t.naam).per === s.per)
          .length === 1,
    };
  }
  // Bij het aantal zijvlakken en de vorm: welke naam? Soms als dobbelsteen.
  const dobbel = coin(),
    q = dobbel
      ? `${pick(DOBBEL)} met de getallen 1 tot en met ${s.zv}. Elk getal staat op een eigen zijvlak. De dobbelsteen heeft de vorm van een regelmatig veelvlak. Hoe heet dat veelvlak? Hoeveel zijden heeft elk zijvlak?`
      : `Een regelmatig veelvlak heeft ${s.zv} zijvlakken. Hoe heet dat veelvlak? Hoeveel zijden heeft elk zijvlak?`,
    od = { octaëder: 'dodecaëder', dodecaëder: 'octaëder' }[s.naam];
  return {
    q: T(q),
    fields: [
      naamVeld(s, 'Het veelvlak heet de'),
      { ...F('Elk zijvlak heeft', s.vorm, 'zijden'), label: 'Zijden van één zijvlak', br: true },
    ],
    hint: `De naam zegt hoeveel zijvlakken er zijn. ${BETEKENIS}`,
    steps: [naamStap(s), `${vormStap(s)} Elk zijvlak heeft dus ${s.vorm} zijden.`],
    traps: [
      od && {
        id: 'octaeder-en-dodecaeder-verwisseld',
        f: (x) => x[0] === od,
        m: 'Je hebt de octaëder en de dodecaëder verwisseld. Octa betekent 8 en dodeca betekent 12. Een octaëder heeft 8 driehoeken als zijvlakken, een dodecaëder 12 vijfhoeken.',
      },
      {
        id: 'naam-past-niet',
        f: (x) => NAMEN.includes(x[0]) && x[0] !== s.naam && x[0] !== od,
        m: `De naam zegt hoeveel zijvlakken een regelmatig veelvlak heeft. ${BETEKENIS}`,
      },
      ...vormValkuilen(s, 1, true),
    ].filter(Boolean),
    v,
  };
}

// ---------------------------------------------------------------------------------------------
// 180: ribben en hoekpunten van een regelmatig veelvlak uitrekenen.

// Een bouwdoos: [inleiding, ribbe, meervoud, hoekpunt, meervoud].
const BOUWDOZEN = [
  [
    'met een bouwdoos van magneetstaafjes en stalen kogeltjes',
    'staafje',
    'staafjes',
    'kogeltje',
    'kogeltjes',
  ],
  ['van rietjes en pijpenragers', 'rietje', 'rietjes', 'pijpenrager', 'pijpenragers'],
  ['van houten stokjes en kurkjes', 'stokje', 'stokjes', 'kurkje', 'kurkjes'],
];

function veelvlakTellen() {
  const s = pick(VEELVLAKKEN),
    R = ribbenVan(s),
    Hp = hoekpuntenVan(s),
    samen = s.zv * s.vorm,
    soort = pick(['tellen', 'tellen', 'bouwen', 'terug']),
    gegeven = `Elk zijvlak is ${EEN_VORM[s.vorm]}. In elk hoekpunt komen ${s.per} ribben samen.`,
    ribStap = `Elk zijvlak heeft ${s.vorm} zijden. Samen zijn dat ${s.zv} * ${s.vorm} = ${samen} zijden.`,
    halfStap = `Elke ribbe is de zijde van twee zijvlakken, dus je telt elke ribbe twee keer. ${samen} : 2 = ${R} ribben.`,
    hoekStap = `Elke ribbe heeft 2 uiteinden. Dat zijn 2 * ${R} = ${2 * R} uiteinden. In elk hoekpunt komen ${s.per} ribben samen, dus ${2 * R} : ${s.per} = ${Hp} hoekpunten.`,
    hint = `Elke ribbe hoort bij twee zijvlakken. Elke ribbe heeft twee uiteinden, en in elk hoekpunt komen ${s.per} ribben samen.`,
    v = () => {
      const m = meet(s.naam);
      return m.R === R && m.H === Hp && m.Z === s.zv && m.vorm === s.vorm && m.per === s.per;
    };
  // Valkuilen voor ribben (op plek r) en hoekpunten (op plek h). Een fout getal dat toevallig het
  // goede antwoord is, valt weg.
  const valkuilen = (r, h) =>
    [
      samen !== R && {
        id: 'ribben-dubbel-geteld',
        f: (x) => x[r] === samen,
        m: `${samen} is het aantal zijden van alle zijvlakken samen. Elke ribbe is de zijde van twee zijvlakken, dus je hebt elke ribbe twee keer geteld. Deel nog door 2.`,
      },
      {
        id: 'hoekpunten-en-ribben-verwisseld',
        f: (x) => x[h] === R && x[r] === Hp,
        m: 'Je hebt de hoekpunten en de ribben verwisseld. Een ribbe is een lijnstuk, een hoekpunt is een punt waar ribben samenkomen.',
      },
      ![Hp, R].includes(samen) && {
        id: 'hoekpunten-niet-gedeeld',
        f: (x) => x[h] === samen || x[h] === 2 * R,
        m: `Zo tel je elk hoekpunt ${s.per} keer, want er komen ${s.per} ribben in samen. Deel nog door ${s.per}.`,
      },
      R / s.per !== Hp && {
        id: 'uiteinden-vergeten',
        f: (x) => x[h] === R / s.per,
        m: `Elke ribbe heeft twee uiteinden. Reken dus eerst 2 * ${R} uit, en deel dan door ${s.per}.`,
      },
    ].filter(Boolean);
  if (soort === 'terug') {
    // Terugredeneren: uit het aantal ribben het aantal zijvlakken.
    return {
      q: T(
        `Een ${s.naam} is een regelmatig veelvlak met ${R} ribben. Elk zijvlak is ${EEN_VORM[s.vorm]}. Hoeveel zijvlakken heeft de ${s.naam}?`,
      ),
      fields: [F('Zijvlakken:', s.zv)],
      hint: 'Elke ribbe is de zijde van twee zijvlakken. Hoeveel zijden hebben alle zijvlakken dan samen?',
      steps: [
        `Elke ribbe is de zijde van twee zijvlakken. Alle zijvlakken samen hebben dus 2 * ${R} = ${samen} zijden.`,
        `Elk zijvlak heeft ${s.vorm} zijden, dus ${samen} : ${s.vorm} = ${s.zv} zijvlakken.`,
      ],
      traps: [
        R % s.vorm === 0 &&
          R / s.vorm !== s.zv && {
            id: 'ribben-niet-verdubbeld',
            f: (x) => x[0] === R / s.vorm,
            m: `Elke ribbe is de zijde van twee zijvlakken. Alle zijvlakken samen hebben dus 2 * ${R} zijden. Deel dat door ${s.vorm}.`,
          },
        R / 2 !== s.zv && {
          id: 'ribben-gedeeld-door-twee',
          f: (x) => x[0] === R / 2,
          m: `Je hebt de ribben door 2 gedeeld. Maar dan weet je niet hoeveel zijvlakken er zijn. Reken eerst uit hoeveel zijden alle zijvlakken samen hebben: 2 * ${R}.`,
        },
      ].filter(Boolean),
      v,
    };
  }
  if (soort === 'bouwen') {
    const [hoe, rib, ribs, hp, hps] = pick(BOUWDOZEN);
    return {
      q: T(
        `Je bouwt een model van een ${s.naam} ${hoe}. Elke ribbe is een ${rib}. Op elk hoekpunt zit een ${hp}. De ${s.naam} heeft ${s.zv} zijvlakken. ${gegeven} Hoeveel ${ribs} en hoeveel ${hps} heb je nodig?`,
      ),
      fields: [F(`${groot(ribs)}:`, R), { ...F(`${groot(hps)}:`, Hp), br: true }],
      hint: `Een ${rib} is een ribbe en een ${hp} is een hoekpunt. ${hint}`,
      steps: [
        ribStap,
        halfStap.replace(` ${R} ribben.`, ` ${R} ribben, dus ${R} ${ribs}.`),
        `${hoekStap} Dus ${Hp} ${hps}.`,
      ],
      traps: valkuilen(0, 1),
      v,
    };
  }
  const fields = [
    F('Zijden van alle zijvlakken samen:', samen),
    { ...F('Ribben:', R), br: true },
    { ...F('Hoekpunten:', Hp), br: true },
  ];
  return {
    q: T(
      `Een ${s.naam} is een regelmatig veelvlak met ${s.zv} zijvlakken. ${gegeven} Hoeveel zijden hebben alle zijvlakken samen? Hoeveel ribben en hoeveel hoekpunten heeft de ${s.naam}?`,
    ),
    fields,
    hint,
    steps: [ribStap, halfStap, hoekStap],
    traps: [
      {
        id: 'zijden-niet-vermenigvuldigd',
        f: (x) => x[0] === s.zv + s.vorm,
        m: `Elk van de ${s.zv} zijvlakken heeft ${s.vorm} zijden. Reken dus ${s.zv} * ${s.vorm} uit.`,
      },
      ...valkuilen(1, 2),
    ],
    v,
  };
}

// ---------------------------------------------------------------------------------------------
// 181: de controle hoekpunten + zijvlakken − ribben = 2.

const WIE = ['Noor', 'Daan', 'Fenna', 'Milan', 'Isa', 'Jesse', 'Lotte', 'Sem'];
const EULER = 'hoekpunten + zijvlakken - ribben = 2';

function eulerControle() {
  const s = pick(VEELVLAKKEN),
    R = ribbenVan(s),
    Hp = hoekpuntenVan(s),
    Z = s.zv,
    echt = () => {
      const m = meet(s.naam);
      return m.H === Hp && m.Z === Z && m.R === R && m.H + m.Z - m.R === 2;
    };
  if (coin()) {
    // Een ontbrekend getal terugvinden.
    const mis = pick(['hoekpunten', 'zijvlakken', 'ribben']),
      wat = { hoekpunten: Hp, zijvlakken: Z, ribben: R },
      a = wat[mis],
      bekend = ['hoekpunten', 'zijvlakken', 'ribben'].filter((w) => w !== mis),
      // De fouten: de 2 aan de verkeerde kant, en de 2 vergeten.
      fout = {
        hoekpunten: [R - Z - 2, R - Z],
        zijvlakken: [R - Hp - 2, R - Hp],
        ribben: [Hp + Z + 2, Hp + Z],
      }[mis],
      steps = {
        hoekpunten: [
          `hoekpunten + ${Z} - ${R} = 2`,
          `hoekpunten - ${R - Z} = 2`,
          `hoekpunten = 2 + ${R - Z} = ${Hp}`,
        ],
        zijvlakken: [
          `${Hp} + zijvlakken - ${R} = 2`,
          `zijvlakken - ${R - Hp} = 2`,
          `zijvlakken = 2 + ${R - Hp} = ${Z}`,
        ],
        ribben: [
          `${Hp} + ${Z} - ribben = 2`,
          `${Hp + Z} - ribben = 2`,
          `ribben = ${Hp + Z} - 2 = ${R}`,
        ],
      }[mis];
    return {
      q: T(
        `Een ${s.naam} heeft ${wat[bekend[0]]} ${bekend[0]} en ${wat[bekend[1]]} ${bekend[1]}. Bij elk regelmatig veelvlak geldt: ${EULER}. Hoeveel ${mis} heeft de ${s.naam}?`,
      ),
      fields: [F(`${groot(mis)}:`, a)],
      hint: `Vul de getallen die je weet in: ${EULER}. Welk getal moet er dan nog op de open plek?`,
      steps: [`Vul in: ${steps[0]}.`, `${groot(steps[1])}, dus ${steps[2]}.`],
      traps: [
        fout[0] !== a && {
          id: 'twee-aan-verkeerde-kant',
          f: (x) => x[0] === fout[0],
          m: 'Vul je antwoord in en reken na of er 2 uitkomt. Let op of je de 2 erbij moet optellen of eraf moet halen.',
        },
        fout[1] !== a && {
          id: 'twee-vergeten',
          f: (x) => x[0] === fout[1],
          m: `Vergeet de 2 niet. Vul je antwoord in: dan moet er 2 uitkomen, niet 0.`,
        },
      ].filter(Boolean),
      v: () => {
        const m = meet(s.naam),
          uit = { hoekpunten: m.H, zijvlakken: m.Z, ribben: m.R };
        return echt() && uit[mis] === a && uit[bekend[0]] === wat[bekend[0]];
      },
    };
  }
  // Iemand heeft geteld. Kunnen de getallen kloppen?
  const wie = pick(WIE),
    fout = pick(['goed', 'goed', 'ribben-dubbel', 'verwisseld', 'een-meer']),
    plus = pick(['hoekpunten', 'zijvlakken']),
    [h, z, r] =
      fout === 'ribben-dubbel'
        ? [Hp, Z, 2 * R]
        : fout === 'verwisseld'
          ? [R, Z, Hp]
          : fout === 'een-meer'
            ? [Hp + (plus === 'hoekpunten' ? 1 : 0), Z + (plus === 'zijvlakken' ? 1 : 0), R]
            : [Hp, Z, R],
    uit = h + z - r,
    kan = uit === 2 ? 'kunnen kloppen' : 'kunnen niet kloppen',
    waarom = {
      'ribben-dubbel': `${wie} heeft de ribben niet door 2 gedeeld: ${s.zv} * ${s.vorm} = ${2 * R} zijden, maar elke ribbe hoort bij twee zijvlakken.`,
      verwisseld: `${wie} heeft de hoekpunten en de ribben verwisseld.`,
      'een-meer': `${wie} heeft één ${plus === 'hoekpunten' ? 'hoekpunt' : 'zijvlak'} te veel geteld.`,
    }[fout];
  return {
    q: T(
      `${wie} telt bij een ${s.naam} ${h} hoekpunten, ${z} zijvlakken en ${r} ribben. Bij elk regelmatig veelvlak geldt: ${EULER}. Reken hoekpunten + zijvlakken - ribben uit met de getallen van ${wie}. Kunnen die getallen kloppen?`,
    ),
    fields: [
      {
        ...F('hoekpunten + zijvlakken - ribben =', uit),
        label: 'Hoekpunten plus zijvlakken min ribben',
      },
      {
        sel: ['kunnen kloppen', 'kunnen niet kloppen'],
        a: kan,
        pre: `De getallen van ${wie}`,
        label: `Kunnen de getallen van ${wie} kloppen?`,
        br: true,
      },
    ],
    hint: 'Tel eerst de hoekpunten en de zijvlakken op, en haal daar de ribben vanaf. Bij een regelmatig veelvlak moet er 2 uitkomen.',
    steps: [
      `${h} + ${z} - ${r} = ${uit}.`,
      uit === 2
        ? 'Er komt 2 uit, dus de getallen kunnen kloppen.'
        : `Er komt geen 2 uit, dus de getallen kunnen niet kloppen. ${waarom}`,
      ...(uit === 2
        ? []
        : [
            `Een ${s.naam} heeft ${Hp} hoekpunten, ${Z} zijvlakken en ${R} ribben: ${Hp} + ${Z} - ${R} = 2.`,
          ]),
    ],
    traps: [
      h + z + r !== uit && {
        id: 'alles-opgeteld',
        f: (x) => x[0] === h + z + r,
        m: 'Je hebt alles opgeteld. Tel de hoekpunten en de zijvlakken op, en haal de ribben er juist vanaf.',
      },
      uit !== 2 && {
        id: 'uitkomst-moet-twee-zijn',
        f: (x) => x[1] === 'kunnen kloppen',
        m: `Bij een regelmatig veelvlak komt er altijd 2 uit. Hier komt er ${d(uit)} uit, dus ergens heeft ${wie} verkeerd geteld.`,
      },
      uit === 2 && {
        id: 'uitkomst-is-twee',
        f: (x) => x[1] === 'kunnen niet kloppen',
        m: 'Er komt precies 2 uit. Dan kunnen de getallen kloppen.',
      },
    ].filter(Boolean),
    // De controle telt het lichaam zelf, en kijkt of een fout getal echt fout is.
    v: () => {
      const m = meet(s.naam),
        goed = h === m.H && z === m.Z && r === m.R;
      return (
        echt() &&
        goed === (fout === 'goed') &&
        [h, z, r].reduce((t, x, i) => t + (i === 2 ? -x : x), 0) === uit
      );
    },
  };
}

// ---------------------------------------------------------------------------------------------
// De uitleg.

// Het huisje uit het voorbeeld: vijf zijden van 3 cm.
const HUIS = lopen(Array(5).fill(3), [90, 90, 150, 60, 150]);
const HUIS_PTS = Object.fromEntries([...'ABCDE'].map((c, i) => [c, HUIS[i]]));
const HUIS_ZIJ = [...'ABCDE'].map((c, i) => c + 'ABCDE'[(i + 1) % 5]);

export default {
  slug: 'regelmatige-veelvlakken',
  title: 'Regelmatige veelvlakken',
  intro:
    'Een regelmatige veelhoek heeft even lange zijden en even grote hoeken. Een regelmatig veelvlak is een ruimtefiguur met alleen zulke zijvlakken. Er zijn er precies vijf. Hier leer je hun namen, en tel en reken je met hun zijvlakken, ribben en hoekpunten. Met hoekpunten + zijvlakken − ribben = 2 controleer je of je goed hebt geteld.',
  description:
    'Regelmatige veelvlakken oefenen: tetraëder, kubus, octaëder, dodecaëder en icosaëder. Zijvlakken, ribben en hoekpunten tellen. Gratis met uitleg.',
  videos: {},
  skills: [
    [178, 'Regelmatige veelhoek herkennen', regelmatigeVeelhoek],
    [179, 'De vijf regelmatige veelvlakken', vijfVeelvlakken],
    [180, 'Ribben en hoekpunten van een regelmatig veelvlak', veelvlakTellen],
    [181, 'Controle met hoekpunten, zijvlakken en ribben', eulerControle],
  ],
  learn: [
    {
      t: 'Regelmatige veelhoek',
      p: [
        'Een veelhoek is regelmatig als alle zijden even lang zijn en alle hoeken even groot.',
        'Een regelmatige driehoek is een gelijkzijdige driehoek. Een regelmatige vierhoek is een vierkant. Zo bestaan er ook een regelmatige vijfhoek en een regelmatige zeshoek.',
        'Een rechthoek is meestal niet regelmatig. Alle hoeken zijn 90°, maar de zijden zijn niet allemaal even lang.',
      ],
      ex: {
        q:
          T(
            'Vijfhoek ABCDE heeft vijf zijden van 3 cm. De hoeken bij A, B, C, D en E zijn 90°, 90°, 150°, 60° en 150°. Is vijfhoek ABCDE regelmatig?',
          ) +
          geo({
            pts: HUIS_PTS,
            segs: HUIS_ZIJ,
            sides: HUIS_ZIJ.map((g) => ({ a: g[0], b: g[1], t: '3 cm' })),
            w: 220,
            maxH: 200,
          }),
        steps: [
          'Alle zijden zijn 3 cm. Ze zijn even lang.',
          'De hoeken zijn niet allemaal even groot.',
          'Dus vijfhoek ABCDE is geen regelmatige veelhoek.',
        ],
      },
      watch: T(
        'Kijk naar de zijden en naar de hoeken. Alleen even lange zijden is niet genoeg, en alleen even grote hoeken ook niet.',
      ),
    },
    {
      t: 'De vijf regelmatige veelvlakken',
      p: [
        'Een regelmatig veelvlak is een ruimtefiguur waarvan alle zijvlakken dezelfde regelmatige veelhoek zijn. In elk hoekpunt komen evenveel zijvlakken samen.',
        'Er zijn precies vijf regelmatige veelvlakken. Ze heten ook de platonische lichamen.',
        'De naam zegt hoeveel zijvlakken er zijn. Tetra betekent 4, hexa 6, octa 8, dodeca 12 en icosa 20. De hexaëder ken je al: dat is de kubus.',
      ],
      ex: {
        q:
          T('Welke vorm hebben de zijvlakken van de vijf regelmatige veelvlakken?') +
          tabel(
            '',
            ['naam', 'zijvlakken', 'vorm van een zijvlak', 'zijvlakken per hoekpunt'],
            VEELVLAKKEN.map((s) => [
              s.naam,
              String(s.zv),
              VORMEN[s.vorm].replace(/en$/, ''),
              String(s.per),
            ]),
            'Tabel: de vijf regelmatige veelvlakken',
          ),
        steps: [
          'De tetraëder, de octaëder en de icosaëder hebben driehoeken als zijvlak.',
          'De hexaëder heeft vierkanten en de dodecaëder vijfhoeken.',
        ],
      },
      watch: T(
        'Verwissel de octaëder en de dodecaëder niet. Octa is 8, zoals een octopus 8 armen heeft. Dodeca is 12.',
      ),
    },
    {
      t: 'Ribben en hoekpunten tellen',
      p: [
        'Tel eerst de zijden van alle zijvlakken samen. Elke ribbe is de zijde van twee zijvlakken. Deel dus door 2, dan heb je de ribben.',
        'Elke ribbe heeft twee uiteinden. Reken 2 * ribben uit, en deel dat door het aantal ribben dat in een hoekpunt samenkomt. Dan heb je de hoekpunten.',
      ],
      ex: {
        q: T(
          'Een icosaëder heeft 20 zijvlakken. Elk zijvlak is een gelijkzijdige driehoek. In elk hoekpunt komen 5 ribben samen. Hoeveel ribben en hoekpunten heeft de icosaëder?',
        ),
        steps: [
          'Alle zijvlakken samen: 20 * 3 = 60 zijden.',
          'Elke ribbe hoort bij twee zijvlakken: 60 : 2 = 30 ribben.',
          'Uiteinden van de ribben: 2 * 30 = 60. In elk hoekpunt komen er 5 samen: 60 : 5 = 12 hoekpunten.',
        ],
      },
      watch: T('Vergeet niet door 2 te delen. Met 20 * 3 = 60 heb je elke ribbe twee keer geteld.'),
    },
    {
      t: 'De controle',
      p: [
        `Bij elk regelmatig veelvlak geldt: ${EULER}. Zo controleer je of je goed hebt geteld.`,
        'Weet je twee van de drie getallen, dan vind je hiermee ook het derde.',
      ],
      ex: {
        q:
          T('Controleer de getallen in de tabel.') +
          tabel(
            '',
            ['naam', 'hoekpunten', 'zijvlakken', 'ribben'],
            VEELVLAKKEN.map((s) => [
              s.naam,
              String(hoekpuntenVan(s)),
              String(s.zv),
              String(ribbenVan(s)),
            ]),
            'Tabel: hoekpunten, zijvlakken en ribben',
          ),
        steps: VEELVLAKKEN.map(
          (s) => `${groot(s.naam)}: ${hoekpuntenVan(s)} + ${s.zv} - ${ribbenVan(s)} = 2`,
        ),
      },
      watch: T(
        'Komt er geen 2 uit, dan heb je ergens verkeerd geteld. Komt er wel 2 uit, dan is dat een goed teken, maar het bewijst niet dat alles klopt.',
      ),
    },
  ],
};
