// Onderwerp: Vierkant en rechthoek. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { geo } from '../figures.js';
import { ri, pick, coin, until, d } from '../math.js';
import { F, MC } from './shared.js';
import { T } from '../typeset.js';

// Een lijst als zin: 'A, B en C'.
const en = (xs) =>
  xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} en ${xs[xs.length - 1]}`;

// Vier soorten vierhoeken, naar hun hoeken (h: vier rechte hoeken) en zijden (z: vier even lange
// zijden). Daarmee rekent v een uitspraak na, los van het antwoord dat erbij is opgeschreven.
const SOORTEN = [
  { h: true, z: true },
  { h: true, z: false },
  { h: false, z: true },
  { h: false, z: false },
];
const IS = {
  vierkant: (s) => s.h && s.z,
  rechthoek: (s) => s.h,
  hoeken: (s) => s.h,
  zijden: (s) => s.z,
  vierhoek: () => true,
};
// Klopt 'elke a is b', 'sommige a zijn b' of 'geen a is b'?
const klopt = ({ k, a, b }) =>
  k === 'elk'
    ? SOORTEN.filter(IS[a]).every(IS[b])
    : k === 'sommige'
      ? SOORTEN.some((s) => IS[a](s) && IS[b](s))
      : SOORTEN.filter(IS[a]).every((s) => !IS[b](s));

const VIERKANT_IS_RECHTHOEK =
  'Een vierkant heeft vier rechte hoeken. Dan is het ook een rechthoek. Dus elk vierkant is een rechthoek.';
const RECHTHOEK =
  'Een rechthoek is een vierhoek met vier rechte hoeken. Meer is er niet nodig: de zijden hoeven niet even lang te zijn.';
// w is of de uitspraak klopt. id en m zijn de valkuil als de leerling dat verkeerd inschat.
const UITSPRAKEN = [
  {
    t: 'Elk vierkant is een rechthoek.',
    k: 'elk',
    a: 'vierkant',
    b: 'rechthoek',
    w: true,
    id: 'vierkant-geen-rechthoek',
    m: VIERKANT_IS_RECHTHOEK,
  },
  {
    t: 'Een vierkant is nooit een rechthoek.',
    k: 'geen',
    a: 'vierkant',
    b: 'rechthoek',
    w: false,
    id: 'vierkant-geen-rechthoek',
    m: VIERKANT_IS_RECHTHOEK,
  },
  {
    t: 'Er zijn rechthoeken die ook een vierkant zijn.',
    k: 'sommige',
    a: 'rechthoek',
    b: 'vierkant',
    w: true,
    id: 'vierkant-geen-rechthoek',
    m: 'Een vierkant heeft vier rechte hoeken, dus het is ook een rechthoek. Er zijn dus rechthoeken die een vierkant zijn.',
  },
  {
    t: 'Elke rechthoek is een vierkant.',
    k: 'elk',
    a: 'rechthoek',
    b: 'vierkant',
    w: false,
    id: 'uitspraak-omgedraaid',
    m: 'Elk vierkant is een rechthoek, maar niet andersom. Een rechthoek van 7 cm bij 2 cm heeft geen vier even lange zijden, dus dat is geen vierkant.',
  },
  {
    t: 'Een vierhoek met vier rechte hoeken is altijd een vierkant.',
    k: 'elk',
    a: 'hoeken',
    b: 'vierkant',
    w: false,
    id: 'uitspraak-omgedraaid',
    m: 'Een vierhoek met vier rechte hoeken is een rechthoek. De zijden hoeven niet even lang te zijn, dus het is niet altijd een vierkant.',
  },
  {
    t: 'Elke rechthoek heeft vier even lange zijden.',
    k: 'elk',
    a: 'rechthoek',
    b: 'zijden',
    w: false,
    id: 'uitspraak-omgedraaid',
    m: 'Alleen bij een vierkant zijn de vier zijden altijd even lang. Een rechthoek van 7 cm bij 2 cm heeft dat niet.',
  },
  {
    t: 'Een vierhoek met vier even lange zijden is altijd een vierkant.',
    k: 'elk',
    a: 'zijden',
    b: 'vierkant',
    w: false,
    id: 'alleen-zijden',
    m: 'Bij een vierkant moeten ook alle hoeken recht zijn. Een vierhoek met vier even lange zijden kan ook scheef zijn.',
  },
  {
    t: 'Elk vierkant heeft vier rechte hoeken.',
    k: 'elk',
    a: 'vierkant',
    b: 'hoeken',
    w: true,
    id: 'alleen-zijden',
    m: 'Een vierkant heeft vier even lange zijden en ook vier rechte hoeken.',
  },
  {
    t: 'Een vierhoek met vier rechte hoeken is een rechthoek.',
    k: 'elk',
    a: 'hoeken',
    b: 'rechthoek',
    w: true,
    id: 'rechthoek-niet-herkend',
    m: RECHTHOEK,
  },
  {
    t: 'Elke rechthoek heeft vier rechte hoeken.',
    k: 'elk',
    a: 'rechthoek',
    b: 'hoeken',
    w: true,
    id: 'rechthoek-niet-herkend',
    m: RECHTHOEK,
  },
];
const NAMEN = ['Noor', 'Daan', 'Ilse', 'Sem', 'Yara', 'Bram', 'Fenna', 'Joep'];
const klopTekst = (w) => (w ? 'klopt' : 'klopt niet');

// Twee leerlingen doen een uitspraak. Wie heeft er gelijk?
function wieHeeftGelijk() {
  const [u1, u2] = until(
      () => [pick(UITSPRAKEN), pick(UITSPRAKEN)],
      ([a, b]) => a.id !== b.id,
    ),
    [n1, n2] = until(
      () => [pick(NAMEN), pick(NAMEN)],
      ([a, b]) => a !== b,
    );
  // Per keuze: welke uitspraken je dan goed vindt.
  const keuzes = [
    [`Alleen ${n1}`, true, false],
    [`Alleen ${n2}`, false, true],
    ['Allebei', true, true],
    ['Geen van beiden', false, false],
  ].map(([tekst, a, b]) => ({ tekst, t: T(tekst), a, b }));
  const goed = keuzes.findIndex((o) => o.a === u1.w && o.b === u2.w),
    mc = MC(
      keuzes.map((o) => o.t),
      goed,
    );
  const fout = (i, u, n) => ({
    id: u.id,
    f: (v) => keuzes.some((o) => o.t === v[0] && (i ? o.b : o.a) !== u.w),
    m: `De uitspraak van ${n} ${klopTekst(u.w)}. ${u.m}`,
  });
  return {
    q: T(`${n1} zegt: “${u1.t}” ${n2} zegt: “${u2.t}” Wie heeft er gelijk?`),
    mc,
    hint: T(
      'Een vierkant heeft vier rechte hoeken en vier even lange zijden. Een rechthoek heeft vier rechte hoeken. Kijk bij elke uitspraak of die altijd klopt.',
    ),
    steps: [
      `${n1}: “${u1.t}” Dat ${klopTekst(u1.w)}.`,
      `${n2}: “${u2.t}” Dat ${klopTekst(u2.w)}.`,
      u1.w && u2.w
        ? 'Dus ze hebben allebei gelijk.'
        : u1.w
          ? `Dus alleen ${n1} heeft gelijk.`
          : u2.w
            ? `Dus alleen ${n2} heeft gelijk.`
            : 'Dus geen van beiden heeft gelijk.',
    ],
    traps: [fout(0, u1, n1), fout(1, u2, n2)],
    v: () => {
      const a = klopt(u1),
        b = klopt(u2),
        t = a && b ? 'Allebei' : a ? `Alleen ${n1}` : b ? `Alleen ${n2}` : 'Geen van beiden';
      return a === u1.w && b === u2.w && mc.opts[mc.a] === T(t);
    },
  };
}

// Welke eigenschap past bij de vraag?
const EIGENSCHAPPEN = {
  'vier rechte hoeken': IS.hoeken,
  'vier even lange zijden': IS.zijden,
  'vier hoekpunten': IS.vierhoek,
  'vier zijden': IS.vierhoek,
};
const ELKE_VIERHOEK = {
  id: 'elke-vierhoek',
  m: 'Elke vierhoek heeft vier hoekpunten en vier zijden. Dat is niet iets van alleen een vierkant of een rechthoek.',
};
function welkeEigenschap() {
  const extra = coin(),
    goed = extra ? 'vier even lange zijden' : 'vier rechte hoeken',
    namen = Object.keys(EIGENSCHAPPEN),
    keuzes = namen.map((n) => T(n[0].toUpperCase() + n.slice(1))),
    mc = MC(keuzes, namen.indexOf(goed)),
    keuze = (n) => keuzes[namen.indexOf(n)];
  return {
    q: T(
      extra
        ? 'Welke eigenschap heeft elk vierkant, maar niet elke rechthoek?'
        : 'Welke eigenschap hebben elk vierkant en elke rechthoek allebei, maar niet elke vierhoek?',
    ),
    mc,
    hint: T(
      'Een vierkant heeft vier rechte hoeken en vier even lange zijden. Een rechthoek heeft vier rechte hoeken.',
    ),
    steps: extra
      ? [
          'Een vierkant heeft vier rechte hoeken en vier even lange zijden.',
          'Een rechthoek heeft ook vier rechte hoeken, maar de zijden zijn niet altijd even lang.',
          'Dus alleen een vierkant heeft altijd vier even lange zijden.',
        ]
      : [
          'Een vierkant en een rechthoek hebben allebei vier rechte hoeken.',
          'Een vierhoek heeft vier hoekpunten en vier zijden, maar niet altijd rechte hoeken.',
          'Dus het antwoord is: vier rechte hoeken.',
        ],
    traps: [
      extra
        ? {
            id: 'ook-bij-rechthoek',
            f: (v) => v[0] === keuze('vier rechte hoeken'),
            m: 'Ook elke rechthoek heeft vier rechte hoeken. Wat heeft een vierkant nog meer?',
          }
        : {
            id: 'alleen-zijden',
            f: (v) => v[0] === keuze('vier even lange zijden'),
            m: 'Een rechthoek heeft niet altijd vier even lange zijden. Een rechthoek van 7 cm bij 2 cm bijvoorbeeld niet.',
          },
      {
        ...ELKE_VIERHOEK,
        f: (v) => v[0] === keuze('vier hoekpunten') || v[0] === keuze('vier zijden'),
      },
    ],
    // De goede eigenschap is de enige die past, nagerekend met de vier soorten vierhoeken.
    v: () => {
      const past = namen.filter((n) => {
        const p = EIGENSCHAPPEN[n];
        return extra
          ? SOORTEN.filter(IS.vierkant).every(p) && !SOORTEN.filter(IS.rechthoek).every(p)
          : SOORTEN.filter(IS.rechthoek).every(p) && !SOORTEN.every(p);
      });
      return past.length === 1 && mc.opts[mc.a] === keuze(past[0]);
    },
  };
}

// Een vierhoek met gegeven zijden en hoeken: is het een vierkant, een rechthoek of geen van beide?
const NAAM = [
  'Het is een vierkant en ook een rechthoek.',
  'Het is een vierkant, maar geen rechthoek.',
  'Het is een rechthoek, maar geen vierkant.',
  'Het is geen vierkant en ook geen rechthoek.',
];
function welkeVierhoek() {
  const recht = coin(),
    gelijk = coin(),
    [a, b] = until(
      () => [pick([2, 3, 4, 5, 6, 2.5, 3.5, 4.5]), pick([2, 3, 4, 5, 6, 7, 8, 1.5])],
      ([a, b]) => a !== b,
    ),
    zijden = gelijk ? [a, a, a, a] : [a, b, a, b],
    goed = recht ? (gelijk ? 0 : 2) : 3,
    keuzes = NAAM.map(T),
    mc = MC(keuzes, goed);
  // Per foute keuze de valkuil die erbij hoort.
  const ALLEEN_ZIJDEN = {
      id: 'alleen-zijden',
      m: `Een vierkant en een rechthoek hebben vier rechte hoeken. Hier is geen van de hoeken recht, dus het is geen vierkant en geen rechthoek, ook al ${gelijk ? 'zijn de zijden even lang' : 'zijn de overstaande zijden even lang'}.`,
    },
    per = recht
      ? gelijk
        ? {
            1: {
              id: 'vierkant-geen-rechthoek',
              m: 'Een vierkant heeft vier rechte hoeken, dus het is ook een rechthoek.',
            },
            2: {
              id: 'vierkant-niet-herkend',
              m: 'Alle zijden zijn even lang en alle hoeken zijn recht. Dan is het een vierkant, en dus ook een rechthoek.',
            },
            3: {
              id: 'vierkant-niet-herkend',
              m: 'Alle zijden zijn even lang en alle hoeken zijn recht. Dan is het een vierkant, en dus ook een rechthoek.',
            },
          }
        : {
            0: {
              id: 'alleen-hoeken',
              m: 'Alle hoeken zijn recht, maar de zijden zijn niet allemaal even lang. Dan is het geen vierkant.',
            },
            1: {
              id: 'alleen-hoeken',
              m: 'Alle hoeken zijn recht, maar de zijden zijn niet allemaal even lang. Dan is het geen vierkant.',
            },
            3: { id: 'rechthoek-niet-herkend', m: RECHTHOEK },
          }
      : { 0: ALLEEN_ZIJDEN, 1: ALLEEN_ZIJDEN, 2: ALLEEN_ZIJDEN };
  // Dezelfde fout bij twee keuzes is één valkuil.
  const ids = [...new Set(Object.values(per).map((t) => t.id))],
    traps = ids.map((id) => {
      const bij = Object.keys(per).filter((i) => per[i].id === id),
        m = per[bij[0]].m;
      return { id, f: (v) => bij.some((i) => v[0] === keuzes[i]), m };
    });
  const lijst = en(zijden.map((z) => `${d(z)} cm`));
  return {
    q: T(
      `Een vierhoek heeft zijden van ${lijst}. ${recht ? 'Alle vier de hoeken zijn recht.' : 'Geen van de hoeken is recht.'} Welke uitspraak klopt?`,
    ),
    mc,
    hint: T(
      'Kijk eerst naar de hoeken: een vierkant en een rechthoek hebben vier rechte hoeken. Kijk daarna naar de zijden: bij een vierkant zijn ze alle vier even lang.',
    ),
    steps: [
      recht
        ? 'Alle hoeken zijn recht, dus het is een rechthoek.'
        : 'De hoeken zijn niet recht, dus het is geen rechthoek en ook geen vierkant.',
      ...(recht
        ? [
            gelijk
              ? 'De vier zijden zijn even lang, dus het is ook een vierkant.'
              : `De zijden zijn niet alle vier even lang: ${d(a)} cm en ${d(b)} cm. Dus het is geen vierkant.`,
          ]
        : []),
      NAAM[goed],
    ],
    traps,
    v: () => {
      const z = zijden.every((x) => x === zijden[0]),
        vk = recht && z,
        rh = recht,
        i = vk && rh ? 0 : vk ? 1 : rh ? 2 : 3;
      return mc.opts[mc.a] === keuzes[i];
    },
  };
}
const s147 = () => pick([wieHeeftGelijk, wieHeeftGelijk, welkeEigenschap, welkeVierhoek])();

// Een vierkant of rechthoek met letters. De hoeken heten in deze volgorde, tegen de klok in.
const PLEK = ['linksonder', 'rechtsonder', 'rechtsboven', 'linksboven'];
// Elke vraag kiest een andere reeks letters.
const WOORDEN = ['WXYZ', 'DEFG', 'HIJK', 'MNOP', 'QRST', 'STUV', 'BCDE', 'FGHI', 'UVWX', 'LMNO'];
// De maten in cm, en bij welke hoek de eerste letter staat.
function vierhoek() {
  const vk = coin(),
    [w, h] = vk
      ? [0, 0].fill(pick([3, 4, 5, 6]))
      : pick([
          [6, 3],
          [5, 3],
          [6, 4],
          [7, 4],
          [5, 2],
          [8, 3],
        ]),
    woord = pick(WOORDEN),
    start = ri(0, 3);
  return { vk, w, h, woord, start, soort: vk ? 'vierkant' : 'rechthoek' };
}
const HOEK = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];
// plek[i] is de hoek van letter i. Met klok staan de letters met de klok mee.
function figuur({ vk, w, h, woord, start }, klok = false) {
  const plek = [0, 1, 2, 3].map((i) => (start + (klok ? -i : i) + 4) % 4),
    pts = {},
    l = [...woord];
  l.forEach((c, i) => (pts[c] = [HOEK[plek[i]][0] * w, HOEK[plek[i]][1] * h]));
  const naam = vk ? 'Vierkant' : 'Rechthoek',
    waar = en(l.map((c, i) => `${c} ${PLEK[plek[i]]}`));
  return {
    pts,
    plek,
    fig: geo({
      pts,
      segs: [0, 1, 2, 3].map((i) => l[i] + l[(i + 1) % 4]),
      rights: [0, 1, 2, 3].map((i) => ({ at: l[i], p: l[(i + 1) % 4], q: l[(i + 3) % 4] })),
      w: 260,
      maxH: 200,
      desc: `${naam} met ${waar}. Alle vier de hoeken zijn recht.`,
    }),
  };
}
// De naam van zijde i, van letter i naar letter i + 1, met de letters in de volgorde van het
// woord: bij WXYZ zijn dat WX, XY, YZ en WZ.
const zijde = (woord, i) => {
  const [p, q] = [i % 4, (i + 1) % 4].sort((x, y) => x - y);
  return woord[p] + woord[q];
};
// De lengte van zijde i. De zijde vanaf linksonder of rechtsboven is horizontaal.
const lengte = ({ w, h, start }, i) => ((start + i) % 2 ? h : w);
const afstand = (pts, a, b) => Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1]);
// Ligt zijde st tegenover zijde pq? Dan hebben ze geen hoekpunt gemeen en zijn ze evenwijdig.
const overstaand = (pts, [p, q], [s, t]) => {
  const u = [pts[q][0] - pts[p][0], pts[q][1] - pts[p][1]],
    w = [pts[t][0] - pts[s][0], pts[t][1] - pts[s][1]];
  return ![p, q].includes(s) && ![p, q].includes(t) && u[0] * w[1] - u[1] * w[0] === 0;
};
// Tweemaal de oppervlakte met teken: positief als de punten tegen de klok in liggen.
const omloop = (pts, ls) =>
  ls.reduce((t, c, i) => {
    const [x1, y1] = pts[c],
      [x2, y2] = pts[ls[(i + 1) % ls.length]];
    return t + x1 * y2 - x2 * y1;
  }, 0);
const GELIJK = (soort) =>
  soort === 'vierkant'
    ? 'In een vierkant zijn alle zijden even lang'
    : 'In een rechthoek zijn zijden die tegenover elkaar liggen even lang';
const ERNAAST = {
  id: 'lengte-van-zijde-ernaast',
  m: 'Dat is de lengte van een zijde ernaast. Zijden die tegenover elkaar liggen, zijn even lang.',
};
// Hoe de vierhoek in de vraag staat: rechthoek DEFG met DE = 6 cm en EF = 3 cm.
const metMaten = (r, ks) =>
  `${r.soort} ${r.woord} met ${en((r.vk ? ks.slice(0, 1) : ks).map((k) => `${zijde(r.woord, k)} = ${lengte(r, k)} cm`))}`;

function zijdeTegenover() {
  const r = vierhoek(),
    { pts, fig } = figuur(r),
    { woord } = r,
    i = ri(0, 3),
    vraag = [i, (i + 1) % 4],
    alle = [0, 1, 2, 3].map((k) => zijde(woord, k));
  const fields = vraag.flatMap((k, n) => [
    {
      sel: alle.filter((s) => s !== zijde(woord, k)),
      a: zijde(woord, k + 2),
      pre: `Tegenover ${zijde(woord, k)} ligt zijde`,
      label: `Zijde tegenover ${zijde(woord, k)}`,
      br: n > 0,
    },
    {
      ...F('met een lengte van', lengte(r, k + 2), 'cm'),
      label: `Lengte van de zijde tegenover ${zijde(woord, k)}`,
    },
  ]);
  return {
    q: T(
      `In de figuur zie je ${metMaten(r, vraag)}. Welke zijden liggen tegenover ${zijde(woord, vraag[0])} en ${zijde(woord, vraag[1])}, en hoe lang zijn die?`,
    ),
    fig,
    fields,
    hint: T(
      'Een zijde noem je met de letters van de twee hoekpunten aan de uiteinden. De zijde tegenover een zijde heeft geen hoekpunt met die zijde gemeen.',
    ),
    steps: [
      ...vraag.map(
        (k) =>
          `${zijde(woord, k)} heeft de hoekpunten ${zijde(woord, k)[0]} en ${zijde(woord, k)[1]}. De zijde zonder deze hoekpunten is ${zijde(woord, k + 2)}.`,
      ),
      `${GELIJK(r.soort)}. Dus ${en(vraag.map((k) => `${zijde(woord, k + 2)} = ${zijde(woord, k)} = ${lengte(r, k)} cm`))}.`,
    ],
    traps: [
      {
        id: 'zijde-ernaast',
        f: (v) =>
          vraag.some((k, n) => [zijde(woord, k + 1), zijde(woord, k + 3)].includes(v[2 * n])),
        m: 'Je hebt een zijde gekozen die ernaast ligt: die heeft een hoekpunt gemeen met de gegeven zijde. De zijde tegenover raakt de gegeven zijde nergens.',
      },
      ...(r.vk
        ? []
        : [{ ...ERNAAST, f: (v) => vraag.some((k, n) => v[2 * n + 1] === lengte(r, k + 1)) }]),
    ],
    v: () =>
      vraag.every((k, n) => {
        const s = fields[2 * n].a;
        return (
          overstaand(pts, zijde(woord, k), s) &&
          afstand(pts, s[0], s[1]) === fields[2 * n + 1].a &&
          afstand(pts, woord[k % 4], woord[(k + 1) % 4]) === lengte(r, k)
        );
      }),
  };
}

function hoekpuntenErnaast() {
  const r = vierhoek(),
    { pts, fig } = figuur(r),
    { woord } = r,
    k = ri(0, 3),
    L = woord[k],
    ander = [...woord].filter((c) => c !== L),
    paren = [
      [ander[0], ander[1]],
      [ander[0], ander[2]],
      [ander[1], ander[2]],
    ].map(([p, q]) => `${p} en ${q}`),
    naast = [woord[(k + 3) % 4], woord[(k + 1) % 4]].sort(),
    tegen = woord[(k + 2) % 4],
    zk = zijde(woord, k);
  const fields = [
    {
      sel: paren,
      a: `${naast[0]} en ${naast[1]}`,
      pre: `Naast ${L} liggen de hoekpunten`,
      label: `Hoekpunten naast ${L}`,
    },
    {
      sel: ander,
      a: tegen,
      pre: `Tegenover ${L} ligt hoekpunt`,
      label: `Hoekpunt tegenover ${L}`,
      br: true,
    },
    {
      ...F(`De zijde tegenover ${zk} is`, lengte(r, k + 2), 'cm'),
      label: `Lengte van de zijde tegenover ${zk}`,
      br: true,
    },
  ];
  return {
    q: T(
      `In de figuur zie je ${metMaten(r, [k + 3, k])}. Welke hoekpunten liggen naast ${L}, en welk hoekpunt ligt tegenover ${L}? Hoe lang is de zijde tegenover ${zk}?`,
    ),
    fig,
    fields,
    hint: T(
      `Een hoekpunt naast ${L} is met een zijde aan ${L} verbonden. Het hoekpunt tegenover ${L} is het hoekpunt dat dan nog over is.`,
    ),
    steps: [
      `De zijden bij ${L} zijn ${en([zijde(woord, k + 3), zk])}.`,
      `Dus naast ${L} liggen ${naast[0]} en ${naast[1]}.`,
      `Dan blijft ${tegen} over. Dat hoekpunt ligt tegenover ${L}.`,
      `De zijde tegenover ${zk} is ${zijde(woord, k + 2)}. ${GELIJK(r.soort)}, dus ${zijde(woord, k + 2)} = ${lengte(r, k)} cm.`,
    ],
    traps: [
      {
        id: 'tegenover-in-plaats-van-naast',
        f: (v) => !!v[0] && v[0] !== fields[0].a && v[0].includes(tegen),
        m: `${tegen} ligt tegenover ${L}, niet ernaast. Tussen ${L} en ${tegen} loopt geen zijde.`,
      },
      {
        id: 'naast-in-plaats-van-tegenover',
        f: (v) => naast.includes(v[1]),
        m: `${naast[0]} en ${naast[1]} liggen naast ${L}: er loopt een zijde naartoe. Tegenover ${L} ligt het hoekpunt waar geen zijde naartoe loopt.`,
      },
      ...(r.vk ? [] : [{ ...ERNAAST, f: (v) => v[2] === lengte(r, k + 3) }]),
    ],
    // De buren liggen het dichtst bij, het hoekpunt tegenover het verst weg.
    v: () => {
      const op = [...ander].sort((p, q) => afstand(pts, L, p) - afstand(pts, L, q)),
        s = [...woord].filter((c) => !zk.includes(c));
      return (
        fields[0].a === [op[0], op[1]].sort().join(' en ') &&
        fields[1].a === op[2] &&
        overstaand(pts, zk, s) &&
        afstand(pts, s[0], s[1]) === fields[2].a
      );
    },
  };
}

function tegenDeKlokIn() {
  const r = vierhoek(),
    klok = coin(),
    { pts, fig, plek } = figuur(r, klok),
    { woord } = r,
    k = ri(0, 3),
    L = woord[k],
    ander = [...woord].filter((c) => c !== L),
    // Tegen de klok in: de letter op de volgende hoek in de volgorde van PLEK.
    letterOp = (hk) => woord[plek.indexOf(hk)],
    van = plek[k],
    goed = [0, 1, 2, 3].map((n) => letterOp((van + n) % 4)).join(''),
    mee = [0, 1, 2, 3].map((n) => letterOp((van - n + 4) % 4)).join(''),
    // Twee namen die schuin over de vierhoek springen, op alfabet.
    schuin = [
      [0, 1, 2],
      [0, 2, 1],
      [1, 0, 2],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
    ]
      .map((p) => L + p.map((i) => ander[i]).join(''))
      .filter((n) => n !== goed && n !== mee)
      .sort()
      .slice(0, 2),
    keuzes = [goed, mee, ...schuin].map(T),
    mc = MC(keuzes, 0);
  return {
    q: T(
      `In de figuur staan de letters ${en([...woord])} bij de hoekpunten. Je noemt de vierhoek met de letters tegen de klok in. Je begint bij ${L}. Welke naam krijgt de vierhoek?`,
    ),
    fig,
    mc,
    hint: T(
      `Tegen de klok in is de andere kant op dan de wijzers van een klok. Begin bij ${L} en ga langs de zijden naar het volgende hoekpunt.`,
    ),
    steps: [
      `${L} ligt ${PLEK[van]}.`,
      `Tegen de klok in kom je daarna bij ${en([1, 2, 3].map((n) => `${goed[n]} (${PLEK[(van + n) % 4]})`))}.`,
      `Dus de naam is ${goed}.`,
    ],
    traps: [
      {
        id: 'met-de-klok-mee',
        f: (v) => v[0] === keuzes[1],
        m: 'Dat is met de klok mee. Tegen de klok in ga je de andere kant op.',
      },
      {
        id: 'hoekpunt-overgeslagen',
        f: (v) => v[0] === keuzes[2] || v[0] === keuzes[3],
        m: 'Je springt in die naam schuin over de vierhoek. Twee letters die naast elkaar staan in de naam, horen bij een zijde.',
      },
    ],
    // Met de hoekpunten tegen de klok in is de oppervlakte met teken positief.
    v: () =>
      mc.opts[mc.a] === T(goed) &&
      goed[0] === L &&
      omloop(pts, [...goed]) > 0 &&
      omloop(pts, [...mee]) < 0 &&
      schuin.every((n) => omloop(pts, [...n]) === 0),
  };
}
const s148 = () => pick([zijdeTegenover, hoekpuntenErnaast, tegenDeKlokIn])();

// Een rooster van b hokjes breed en h hokjes hoog, zonder letters. Elke lijn krijgt twee punten met
// een eigen teken, want geo leest een lijnstuk als twee tekens.
const TEKENS = 'abcdefghijklmnopqrstuvwxyz0123456789';
function rooster(b, h, desc) {
  const pts = {},
    segs = [];
  let n = 0;
  const lijn = (p, q) => {
    const [s, t] = [TEKENS[n++], TEKENS[n++]];
    pts[s] = p;
    pts[t] = q;
    segs.push(s + t);
  };
  for (let y = 0; y <= h; y++) lijn([0, y], [b, y]);
  for (let x = 0; x <= b; x++) lijn([x, 0], [x, h]);
  return geo({
    pts,
    segs,
    hide: Object.keys(pts).join(''),
    w: 40 * b + 20,
    maxH: 40 * h + 20,
    pad: 10,
    desc,
  });
}
// Telt alle vierkanten met de hoekpunten op het rooster: elk vierkant heeft een zijde (p, q) met
// p > 0 en q ≥ 0 vanaf het hoekpunt waar die zijde begint. q = 0 is een recht vierkant.
function telVierkanten(b, h) {
  const recht = {};
  let schuin = 0;
  for (let x = 0; x <= b; x++)
    for (let y = 0; y <= h; y++)
      for (let p = 1; p <= Math.max(b, h); p++)
        for (let q = 0; q <= Math.max(b, h); q++) {
          const hk = [
            [x, y],
            [x + p, y + q],
            [x + p - q, y + q + p],
            [x - q, y + p],
          ];
          if (!hk.every(([u, w]) => u >= 0 && u <= b && w >= 0 && w <= h)) continue;
          if (q) schuin++;
          else recht[p] = (recht[p] || 0) + 1;
        }
  return { recht, schuin };
}
function vierkantenRecht() {
  const vk = coin(),
    [b, h] = vk
      ? [0, 0].fill(ri(2, 5))
      : until(
          () => [ri(3, 6), ri(2, 4)],
          ([b, h]) => b > h,
        ),
    m = Math.min(b, h),
    maten = Array.from({ length: m }, (_, i) => i + 1),
    aantal = (k) => (b - k + 1) * (h - k + 1),
    totaal = maten.reduce((t, k) => t + aantal(k), 0),
    fields = [
      ...maten.map((k) => ({
        ...F(`${k} bij ${k}:`, aantal(k)),
        label: `Vierkanten van ${k} bij ${k}`,
      })),
      { ...F('Totaal:', totaal), label: 'Totaal aantal vierkanten', br: true },
    ],
    t = fields.length - 1,
    rooster0 = vk ? `${b} bij ${b} hokjes` : `${b} hokjes breed en ${h} hokjes hoog`;
  const rij = (k) => maten.findIndex((x) => x === k);
  return {
    q: T(
      `Je ziet een rooster van ${rooster0}. Hoeveel vierkanten zie je in het rooster? Tel per maat, en tel ze daarna op. Vierkanten mogen elkaar overlappen.`,
    ),
    fig: rooster(b, h, `Een rooster van ${rooster0}.`),
    fields,
    hint: T(
      'Begin met de vierkantjes van 1 bij 1. Schuif daarna een vierkant van 2 bij 2 stap voor stap door het rooster. Tel hoeveel plekken er naast elkaar zijn en hoeveel onder elkaar.',
    ),
    steps: [
      ...maten.map((k) => {
        const nb = b - k + 1,
          nh = h - k + 1;
        return nb === 1 && nh === 1
          ? `${k} bij ${k}: dat is het hele rooster, dus 1.`
          : `${k} bij ${k}: ${nb} naast elkaar en ${nh} onder elkaar, dus ${nb}*${nh} = ${aantal(k)}.`;
      }),
      `Totaal: ${maten.map(aantal).join(' + ')} = ${totaal}`,
    ],
    traps: [
      {
        id: 'alleen-kleine-vierkanten',
        f: (v) => v[t] === b * h,
        m: 'Je hebt alleen de kleinste vierkantjes geteld. Ook de grotere vierkanten tellen mee.',
      },
      {
        id: 'een-rij-geteld',
        f: (v) =>
          maten.some(
            (k) =>
              aantal(k) !== b - k + 1 &&
              aantal(k) !== h - k + 1 &&
              [b - k + 1, h - k + 1].includes(v[rij(k)]),
          ),
        m: 'Je hebt de vierkanten in één rij geteld. Een vierkant kan ook een rij lager liggen.',
      },
      {
        id: 'plek-te-weinig',
        f: (v) => maten.some((k) => k < m && v[rij(k)] === (b - k) * (h - k)),
        m: 'Je mist een plek. Een vierkant kan helemaal tegen de linkerrand liggen en helemaal tegen de rechterrand. In een rij van 4 hokjes past een vierkant van 2 bij 2 op 3 plekken.',
      },
    ],
    // Tel op een andere manier: elk hoekpunt en elke richting van een zijde.
    v: () => {
      const { recht } = telVierkanten(b, h);
      return (
        Object.keys(recht).length === m &&
        maten.every((k) => recht[k] === fields[rij(k)].a) &&
        Object.values(recht).reduce((s, x) => s + x, 0) === fields[t].a
      );
    },
  };
}
function vierkantenSchuin() {
  const n = pick([2, 3]),
    recht = n === 2 ? 5 : 14,
    schuin = n === 2 ? 1 : 6,
    fields = [
      { ...F('Recht:', recht), label: 'Aantal rechte vierkanten' },
      { ...F('Schuin:', schuin), label: 'Aantal schuine vierkanten' },
      { ...F('Totaal:', recht + schuin), label: 'Totaal aantal vierkanten', br: true },
    ];
  return {
    q: T(
      `Je ziet een rooster van ${n} bij ${n} hokjes. Je tekent vierkanten met de hoekpunten op de hoeken van de hokjes. Een vierkant mag ook schuin staan. Hoeveel rechte vierkanten kun je tekenen, hoeveel schuine, en hoeveel samen?`,
    ),
    fig: rooster(n, n, `Een rooster van ${n} bij ${n} hokjes.`),
    fields,
    hint: T(
      'Tel eerst de rechte vierkanten per maat. Een schuin vierkant past precies in een recht vierkant, met zijn hoekpunten op de rand.',
    ),
    steps:
      n === 2
        ? [
            'Recht: 4 van 1 bij 1 en 1 van 2 bij 2. Samen 4 + 1 = 5.',
            'Schuin: in het hele rooster past 1 schuin vierkant, met de hoekpunten in het midden van de randen.',
            'Totaal: 5 + 1 = 6',
          ]
        : [
            'Recht: 9 van 1 bij 1, 4 van 2 bij 2 en 1 van 3 bij 3. Samen 9 + 4 + 1 = 14.',
            'Schuin: in elk vierkant van 2 bij 2 past 1 schuin vierkant. Dat zijn er 4.',
            'In het vierkant van 3 bij 3 passen nog 2 schuine vierkanten: met de hoekpunten 1 hokje van de hoeken af, of 2 hokjes. Samen 4 + 2 = 6.',
            'Totaal: 14 + 6 = 20',
          ],
    traps: [
      {
        id: 'alleen-kleine-vierkanten',
        f: (v) => v[0] === n * n,
        m: 'Je hebt bij de rechte vierkanten alleen de kleinste vierkantjes geteld. Ook de grotere vierkanten tellen mee.',
      },
      {
        id: 'schuine-vergeten',
        f: (v) => v[2] === recht,
        m: 'Bij het totaal tellen de schuine vierkanten ook mee.',
      },
    ],
    v: () => {
      const t = telVierkanten(n, n),
        r = Object.values(t.recht).reduce((s, x) => s + x, 0);
      return r === recht && t.schuin === schuin;
    },
  };
}
const s149 = () => pick([vierkantenRecht, vierkantenRecht, vierkantenSchuin])();

// De rechthoeken van n vierkantjes: [rijen, per rij] met rijen ≤ per rij.
function rechthoeken(n) {
  const uit = [];
  for (let r = 1; r * r <= n; r++) if (n % r === 0) uit.push([r, n / r]);
  return uit;
}
// Elk aantal heeft minstens twee delers van 2 tot en met 9, zodat rijenVanVierkantjes altijd een
// keuze heeft voor een aantal rijen dat wel en een dat niet past.
const AANTALLEN = [14, 15, 21, 27, 35, 44, 50, 54, 56, 63, 64, 81];
function hoeveelRechthoeken() {
  const n = pick(AANTALLEN),
    rh = rechthoeken(n),
    c = rh.length,
    wortel = Math.round(Math.sqrt(n)),
    vk = wortel * wortel === n,
    // Een voorbeeld van een rechthoek die je dubbel kunt tellen, zo dicht mogelijk bij het midden.
    [p, q] = rh[c - (vk ? 2 : 1)],
    delers = rh.length * 2 - (vk ? 1 : 0),
    niet = [];
  for (let r = 2; r * r <= n; r++) if (n % r) niet.push(r);
  return {
    q: T(
      `Je hebt ${n} gelijke vierkantjes. Je legt ze allemaal tegen elkaar als één rechthoek, zonder gaten. Hoeveel verschillende rechthoeken kun je zo maken? Een rechthoek van 2 bij 5 en een van 5 bij 2 tellen als één.`,
    ),
    fields: [{ ...F('Aantal rechthoeken:', c), label: 'Aantal verschillende rechthoeken' }],
    hint: T(
      `Begin met 1 rij van ${n}. Probeer daarna 2 rijen, 3 rijen, enzovoort. Het kan als ${n} gedeeld door het aantal rijen uitkomt. Een vierkant is ook een rechthoek.`,
    ),
    steps: [
      ...rh.map(
        ([r, k]) =>
          `${r} rij${r > 1 ? 'en' : ''} van ${k}: ${r} bij ${k}${r === k ? ', een vierkant' : ''}`,
      ),
      ...(niet.length
        ? [`Met ${en(niet.map(String))} rijen kan het niet, want ${n} is daar niet door te delen.`]
        : []),
      `Meer rijen geeft een rechthoek die je al hebt, maar dan gedraaid. Dus ${c} rechthoeken.`,
    ],
    traps: [
      {
        id: 'dubbel-geteld',
        f: (v) => v[0] === delers,
        m: `Je hebt rechthoeken dubbel geteld. ${p} bij ${q} en ${q} bij ${p} is dezelfde rechthoek, alleen gedraaid.`,
      },
      vk
        ? {
            id: 'vierkant-vergeten',
            f: (v) => v[0] === c - 1,
            m: `Je mist er een. Telde je ${wortel} bij ${wortel} mee? Een vierkant is ook een rechthoek. En 1 bij ${n} telt ook mee.`,
          }
        : {
            id: 'strook-vergeten',
            f: (v) => v[0] === c - 1,
            m: `Je mist er een. Telde je 1 bij ${n} mee? Die is lang en smal, maar het is wel een rechthoek.`,
          },
    ],
    // Tel alle paren rijen en per rij, en tel 3 bij 4 en 4 bij 3 één keer.
    v: () => {
      let paren = 0;
      for (let a = 1; a <= n; a++) for (let b = a; b <= n; b++) if (a * b === n) paren++;
      return paren === c;
    },
  };
}
function rijenVanVierkantjes() {
  const n = pick(AANTALLEN),
    rh = rechthoeken(n)
      .flatMap(([a, b]) => [a, b])
      .filter((x) => x > 1 && x < n && x <= 12),
    k = pick(rh),
    kan = coin(),
    j = until(
      () => ri(2, 9),
      (x) => x !== k && (n % x === 0) === kan,
    ),
    per = n / k,
    fields = [
      {
        ...F(`Met ${k} rijen liggen er in elke rij`, per, 'vierkantjes'),
        label: `Vierkantjes per rij bij ${k} rijen`,
      },
      {
        sel: ['ja', 'nee'],
        a: kan ? 'ja' : 'nee',
        pre: `Kan het ook met ${j} rijen?`,
        label: `Kan het met ${j} rijen?`,
        br: true,
      },
    ];
  return {
    q: T(
      `Je legt ${n} gelijke vierkantjes tegen elkaar als een rechthoek. In elke rij liggen evenveel vierkantjes. Hoeveel vierkantjes liggen er in elke rij als je ${k} rijen maakt? En kan het ook met ${j} rijen?`,
    ),
    fields,
    hint: T(
      `Deel het aantal vierkantjes door het aantal rijen. Het kan alleen als dat precies uitkomt.`,
    ),
    steps: [
      `${n} : ${k} = ${per}, dus ${per} vierkantjes in elke rij.`,
      kan
        ? `${n} : ${j} = ${n / j}. Dat komt uit, dus het kan: ${j} rijen van ${n / j}.`
        : `${n} : ${j} komt niet uit. Dus het kan niet: de laatste rij is dan niet vol.`,
    ],
    traps: [
      {
        id: 'keer-in-plaats-van-delen',
        f: (v) => v[0] === n * k,
        m: 'Je hebt vermenigvuldigd. Deel het aantal vierkantjes door het aantal rijen.',
      },
      kan
        ? {
            id: 'deelt-wel',
            f: (v) => v[1] === 'nee',
            m: `${n} : ${j} = ${n / j}. Dus ${j} rijen van ${n / j} vierkantjes is wel een rechthoek.`,
          }
        : {
            id: 'deelt-niet',
            f: (v) => v[1] === 'ja',
            m: `${n} : ${j} komt niet uit. Dan is de laatste rij niet vol, en dat is geen rechthoek.`,
          },
    ],
    // Leg de rijen naast elkaar en kijk of je op het aantal vierkantjes uitkomt.
    v: () => {
      const rijen = Array.from({ length: k }, () => per).reduce((t, x) => t + x, 0);
      let vol = false;
      for (let c = 1; c <= n; c++) if (c * j === n) vol = true;
      return rijen === n && Number.isInteger(per) && vol === kan;
    },
  };
}
const s150 = () => pick([hoeveelRechthoeken, rijenVanVierkantjes])();

export default {
  slug: 'vierkant-en-rechthoek',
  title: 'Vierkant en rechthoek',
  intro:
    'Een vierkant en een rechthoek zijn vierhoeken met vier rechte hoeken. Hier leer je wat het verschil is, hoe je de hoekpunten en zijden een naam geeft, en hoe je vierkanten en rechthoeken telt.',
  description:
    'Vierkant en rechthoek oefenen: eigenschappen, hoekpunten en zijden benoemen, vierkanten tellen op een rooster. Havo/vwo 1, gratis met uitleg en uitwerkingen.',
  videos: {},
  skills: [
    [147, 'Eigenschappen van een vierkant en een rechthoek', s147],
    [148, 'Hoekpunten en zijden benoemen', s148],
    [149, 'Vierkanten tellen op een rooster', s149],
    [150, 'Rechthoeken van vierkantjes', s150],
  ],
  learn: [
    {
      t: 'Vierkant en rechthoek',
      p: [
        'Een vierhoek heeft vier zijden en vier hoekpunten. Een rechthoek is een vierhoek met vier rechte hoeken. Een vierkant heeft vier rechte hoeken en ook vier even lange zijden.',
        'Elk vierkant is dus ook een rechthoek. Andersom niet: een rechthoek van 6 cm bij 2 cm is geen vierkant.',
      ],
      watch: T(
        'Kijk naar de hoeken én naar de zijden. Een vierhoek met vier even lange zijden is pas een vierkant als ook alle hoeken recht zijn.',
      ),
    },
    {
      t: 'Hoekpunten en zijden',
      p: [
        T(
          'Hoekpunten krijgen een hoofdletter. Je noemt ze tegen de klok in, zoals bij rechthoek WXYZ: W linksonder, X rechtsonder, Y rechtsboven en Z linksboven.',
        ),
        T(
          'Een zijde noem je met de twee hoekpunten aan de uiteinden, zoals WX. Tegenover WX ligt zijde YZ. Tegenover hoekpunt W ligt hoekpunt Y.',
        ),
      ],
      ex: {
        q: T(
          'Je noemt rechthoek WXYZ tegen de klok in, maar je begint bij Y. Welke naam krijg je?',
        ),
        steps: ['Na Y komt Z, dan W en dan X.', 'Dus de naam is YZWX.'],
      },
    },
    {
      t: 'Vierkanten tellen',
      p: [
        'In een rooster zitten niet alleen kleine vierkantjes, maar ook grotere vierkanten. Tel per maat. Schuif een vierkant stap voor stap door het rooster, en tel hoeveel plekken er naast elkaar en onder elkaar zijn.',
      ],
      ex: {
        q: T('Hoeveel vierkanten zie je in een rooster van 3 bij 3 hokjes?'),
        steps: [
          '1 bij 1: 3 naast elkaar en 3 onder elkaar, dus 3*3 = 9.',
          '2 bij 2: 2 naast elkaar en 2 onder elkaar, dus 2*2 = 4.',
          '3 bij 3: dat is het hele rooster, dus 1.',
          'Totaal: 9 + 4 + 1 = 14',
        ],
      },
      watch: T(
        'Mogen de hoekpunten op elke hoek van een hokje liggen, dan kun je ook schuine vierkanten tekenen. Een schuin vierkant past precies in een groter recht vierkant.',
      ),
    },
    {
      t: 'Rechthoeken van vierkantjes',
      p: [
        'Met een aantal gelijke vierkantjes kun je verschillende rechthoeken leggen. Probeer 1 rij, 2 rijen, 3 rijen, enzovoort. Het lukt als het aantal vierkantjes precies deelbaar is door het aantal rijen.',
      ],
      ex: {
        q: T('Hoeveel verschillende rechthoeken kun je leggen met 18 vierkantjes?'),
        steps: [
          '1 bij 18, 2 bij 9 en 3 bij 6.',
          'Met 4 of 5 rijen komt het niet uit. Bij 6 rijen krijg je 6 bij 3, en die heb je al.',
          'Dus 3 rechthoeken.',
        ],
      },
      watch: T(
        'Een rechthoek van 2 bij 9 en een van 9 bij 2 is dezelfde rechthoek, alleen gedraaid.',
      ),
    },
  ],
};
