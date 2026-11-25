// Onderwerp: Cirkel. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, pick, coin, until, near, d } from '../math.js';
import { F, MC, trap } from './shared.js';
import { T } from '../typeset.js';
import { and } from '../figures.js';
import { cirkelFig } from '../cirkelfiguren.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const cm = (x) => `${d(x)} cm`;
// Een punt op een cirkel met middelpunt c en straal r, bij een hoek in graden.
const op = (c, r, g) => [
  c[0] + r * Math.cos((g * Math.PI) / 180),
  c[1] + r * Math.sin((g * Math.PI) / 180),
];
const afstand = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
// De afstand van punt p tot de lijn door a en b.
const totLijn = (p, a, b) =>
  Math.abs((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / afstand(a, b);

// Letters bij een cirkel: eerst het middelpunt, dan vier punten op de cirkel. Elke vraag kiest een
// andere reeks.
const LETTERS = ['MPQRS', 'KDEFG', 'NTUVW', 'ZHJLP', 'SABCE', 'WKLNR', 'HCDEF'];

const VERWISSELD = 'straal-diameter-verwisseld';
const GELIJK = {
  id: 'straal-en-diameter-gelijk',
  m: 'De straal en de diameter zijn niet even lang. De straal gaat van het middelpunt naar de cirkel. De diameter gaat van de cirkel door het middelpunt naar de overkant: dat zijn twee stralen.',
};

// ---------------------------------------------------------------------------------------------
// 162: straal en diameter.

// Een rond voorwerp. r: in het verhaal staat de straal, anders de diameter. w: de lengtes waaruit
// je kiest.
const VERHALEN = [
  {
    r: true,
    w: [3, 4, 5, 6, 7],
    q: (x) =>
      `Je zet de punten van een passer ${cm(x)} uit elkaar en tekent een cirkel. Hoe groot is de diameter van de cirkel?`,
    pre: 'Diameter:',
    post: 'cm',
  },
  {
    r: true,
    w: [9, 11, 12, 14, 16],
    q: (x) =>
      `De grote wijzer van een ronde klok is ${cm(x)} lang. Hij reikt precies van het midden tot de rand. Hoe breed is de klok?`,
    pre: 'De klok is',
    post: 'cm breed',
  },
  {
    r: true,
    w: [3, 4, 5, 6],
    q: (x) =>
      `De rand van een draaimolen ligt overal ${d(x)} meter van de paal in het midden. Hoe breed is de draaimolen?`,
    pre: 'De draaimolen is',
    post: 'meter breed',
  },
  {
    r: false,
    w: [22, 24, 26, 28, 30],
    q: (x) =>
      `Een ronde onderzetter heeft een diameter van ${cm(x)}. Een gekleurde streep loopt van het midden naar de rand. Hoe lang is de streep?`,
    pre: 'De streep is',
    post: 'cm',
  },
  {
    r: false,
    w: [4, 5, 6, 8, 10],
    q: (x) =>
      `Een ronde vijver heeft een diameter van ${d(x)} meter. Een eend zwemt van de rand recht naar het midden. Hoeveel meter zwemt de eend?`,
    pre: 'De eend zwemt',
    post: 'meter',
  },
  {
    r: false,
    w: [140, 160, 180, 200],
    q: (x) =>
      `Een rond tafelkleed heeft een diameter van ${cm(x)}. Hoe ver is het van het midden tot de rand?`,
    pre: 'Van het midden tot de rand:',
    post: 'cm',
  },
];
const STRALEN = [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 9, 12, 15];

function straalDiameter() {
  const verhaal = coin() ? pick(VERHALEN) : null,
    L = pick(LETTERS),
    isR = verhaal ? verhaal.r : coin(),
    x = verhaal ? pick(verhaal.w) : isR ? pick(STRALEN) : 2 * pick(STRALEN),
    goed = isR ? 2 * x : x / 2,
    fout = isR ? x / 2 : 2 * x,
    // De straal en de diameter, voor de controle.
    [r, D] = isR ? [x, goed] : [goed, x],
    eenheid = verhaal && verhaal.post.includes('meter') ? 'meter' : 'cm';
  const q = verhaal
    ? verhaal.q(x)
    : isR
      ? `Je tekent een cirkel met middelpunt ${L[0]} en straal ${cm(x)}. Hoe groot is de diameter?`
      : `Je tekent een cirkel met diameter ${L[1]}${L[2]} = ${cm(x)}. Hoe groot is de straal?`;
  return {
    q: T(q),
    fields: [
      verhaal ? F(verhaal.pre, goed, verhaal.post) : F(isR ? 'Diameter:' : 'Straal:', goed, 'cm'),
    ],
    hint: 'De straal gaat van het middelpunt naar de cirkel. De diameter gaat van de cirkel door het middelpunt naar de overkant. Hoeveel stralen passen er in een diameter?',
    steps: [
      ...(verhaal
        ? [
            isR
              ? `Van het midden tot de rand is de straal: ${d(x)} ${eenheid}. De breedte is de diameter.`
              : `Van rand tot rand door het midden is de diameter: ${d(x)} ${eenheid}. Van het midden tot de rand is de straal.`,
          ]
        : []),
      isR
        ? `De diameter is 2 keer de straal: 2 * ${d(x)} = ${d(goed)}.`
        : `De straal is de helft van de diameter: ${d(x)} : 2 = ${d(goed)}.`,
      verhaal
        ? `Dus het antwoord is ${d(goed)} ${eenheid}.`
        : `Dus de ${isR ? 'diameter' : 'straal'} is ${cm(goed)}.`,
    ],
    traps: [
      {
        id: VERWISSELD,
        f: (v) => near(v[0], fout),
        m: isR
          ? 'Je hebt de straal gehalveerd. De diameter is juist 2 keer zo lang als de straal.'
          : 'Je hebt de diameter verdubbeld. De straal is juist de helft van de diameter.',
      },
      { ...GELIJK, f: (v) => near(v[0], x) },
    ],
    // Twee punten recht tegenover elkaar op de cirkel liggen een diameter uit elkaar.
    v: () => near(afstand(op([0, 0], r, 40), op([0, 0], r, 220)), D, 1e-9) && near(D / r, 2, 1e-9),
  };
}

// Welke van twee ronde voorwerpen is breder? Van het ene staat de straal, van het andere de diameter.
const RONDE = [
  ['de', 'spiegel'],
  ['het', 'dienblad'],
  ['de', 'klok'],
  ['het', 'bord'],
  ['de', 'schaal'],
  ['het', 'kleedje'],
];
const EVEN = 'Ze zijn even breed';
function welkeBreder() {
  const [a, b] = until(
      () => [pick(RONDE), pick(RONDE)],
      ([a, b]) => a !== b,
    ),
    r = pick([6, 7, 8, 9, 10, 12, 15]),
    geval = pick(['eerste', 'tweede', 'even']),
    D =
      geval === 'eerste'
        ? ri(r + 2, 2 * r - 1)
        : geval === 'even'
          ? 2 * r
          : 2 * r + pick([2, 3, 4]),
    naam = ([lw, n]) => `${cap(lw)} ${n}`,
    keuzes = [naam(a), naam(b), EVEN],
    goed = geval === 'eerste' ? 0 : geval === 'tweede' ? 1 : 2,
    mc = MC(keuzes.map(T), goed);
  return {
    q: T(
      `${cap(a[0])} ronde ${a[1]} heeft een straal van ${cm(r)}. ${cap(b[0])} ronde ${b[1]} heeft een diameter van ${cm(D)}. Wat is breder?`,
    ),
    mc,
    hint: 'De breedte van een rond voorwerp is de diameter. Maak eerst van de straal een diameter, en vergelijk dan.',
    steps: [
      `${naam(a)}: de straal is ${cm(r)}, dus de diameter is 2 * ${d(r)} = ${cm(2 * r)}.`,
      `${naam(b)}: de diameter is ${cm(D)}.`,
      geval === 'even'
        ? `${cm(2 * r)} en ${cm(D)} zijn gelijk. Dus ze zijn even breed.`
        : `${cm(Math.max(2 * r, D))} is meer dan ${cm(Math.min(2 * r, D))}. Dus ${geval === 'eerste' ? a[0] : b[0]} ${geval === 'eerste' ? a[1] : b[1]} is breder.`,
    ],
    // Wie de straal met de diameter vergelijkt, kiest steeds het tweede voorwerp.
    traps:
      geval === 'tweede'
        ? []
        : [
            {
              id: 'straal-met-diameter-vergeleken',
              f: (v) => v[0] === T(keuzes[1]),
              m: `Je vergelijkt de straal van ${a[0]} ${a[1]} met de diameter van ${b[0]} ${b[1]}. Maak eerst van de straal een diameter: 2 * ${d(r)} = ${cm(2 * r)}.`,
            },
          ],
    // Vergelijk de oppervlaktes: een bredere cirkel heeft een grotere oppervlakte.
    v: () => {
      const o1 = Math.PI * r * r,
        o2 = Math.PI * (D / 2) ** 2,
        i = near(o1, o2, 1e-9) ? 2 : o1 > o2 ? 0 : 1;
      return mc.opts[mc.a] === T(keuzes[i]);
    },
  };
}
const s162 = () => pick([straalDiameter, straalDiameter, welkeBreder])();

// ---------------------------------------------------------------------------------------------
// 163: middelpunt, straal, diameter en cirkelboog in een figuur.

// Een cirkel met middelpunt M, diameter AB, straal MC en een lijnstuk BD dat niet door M gaat.
function cirkelMetLetters() {
  const L = pick(LETTERS),
    [M, A, B, C, D] = [...L],
    r = pick([2, 2.5, 3, 3.5, 4]),
    c = [0, 0],
    g = { A: pick([10, 15, 20, 25]), C: pick([60, 75, 105, 120]), D: pick([270, 285, 300]) };
  g.B = g.A + 180;
  const P = {
    [M]: c,
    [A]: op(c, r, g.A),
    [B]: op(c, r, g.B),
    [C]: op(c, r, g.C),
    [D]: op(c, r, g.D),
  };
  return { L, M, A, B, C, D, r, c, g, P };
}
// De naam van een punt op de cirkel staat van het middelpunt af. Die van het middelpunt staat eronder.
const namen = (k, ls) =>
  ls.map((t) => (t === k.M ? { at: k.c, t, off: [0, 18] } : { at: k.P[t], t, from: k.c }));
// Wat een lijnstuk is, uit de punten: een straal gaat van het middelpunt naar de cirkel, een diameter
// van de cirkel door het middelpunt naar de cirkel.
function soort(k, [p, q]) {
  const opC = (t) => near(afstand(k.c, k.P[t]), k.r, 1e-9);
  if ((p === k.M && opC(q)) || (q === k.M && opC(p))) return 'straal';
  if (opC(p) && opC(q) && totLijn(k.c, k.P[p], k.P[q]) < 1e-9) return 'diameter';
  return 'lijnstuk';
}

const SOORTEN = ['straal', 'diameter', 'cirkelboog'];
function benoemen() {
  const k = cirkelMetLetters(),
    { M, A, B, C, D, r } = k,
    // De gekleurde cirkelboog loopt tegen de klok in van p naar q.
    [p, q] = coin() ? [A, C] : [C, B],
    fig = cirkelFig({
      circles: [{ c: k.c, r }],
      arcs: [{ c: k.c, r, from: k.g[p === A ? 'A' : 'C'], to: k.g[q === C ? 'C' : 'B'] }],
      lines: [
        [k.P[A], k.P[B]],
        [k.P[M], k.P[C]],
        [k.P[B], k.P[D]],
      ],
      dots: [M, A, B, C, D].map((t) => k.P[t]),
      names: namen(k, [M, A, B, C, D]),
      desc: `Een cirkel met in het midden punt ${M}. De punten ${and([A, B, C, D])} liggen op de cirkel. Lijnstukken ${A}${B}, ${M}${C} en ${B}${D}. ${A}${B} gaat door ${M}. Het stuk van de cirkel van ${p} tot ${q} is gekleurd.`,
    });
  const fields = [
    { sel: SOORTEN, a: 'diameter', pre: `Lijnstuk ${A}${B} is een`, label: `Wat is ${A}${B}?` },
    {
      sel: SOORTEN,
      a: 'straal',
      pre: `Lijnstuk ${M}${C} is een`,
      label: `Wat is ${M}${C}?`,
      br: true,
    },
    {
      sel: SOORTEN,
      a: 'cirkelboog',
      pre: 'Het gekleurde stuk van de cirkel is een',
      label: 'Wat is het gekleurde stuk?',
      br: true,
    },
    {
      sel: ['ja', 'nee'],
      a: 'nee',
      pre: `Is ${B}${D} een diameter?`,
      label: `Is ${B}${D} een diameter?`,
      br: true,
    },
    { ...F(`${A}${B} =`, 2 * r, 'cm'), label: `Lengte van ${A}${B}`, br: true },
  ];
  return {
    q: T(
      `In de figuur zie je een cirkel met middelpunt ${M}. ${M}${C} = ${cm(r)}. Wat zijn ${A}${B}, ${M}${C} en het gekleurde stuk? Is ${B}${D} een diameter? Hoe lang is ${A}${B}?`,
    ),
    fig,
    fields,
    hint: 'Een straal gaat van het middelpunt naar de cirkel. Een diameter gaat van de cirkel door het middelpunt naar de overkant. Een stuk van de cirkel zelf heet een cirkelboog.',
    steps: [
      `${A}${B} gaat van de cirkel door het middelpunt ${M} naar de overkant. Dat is een diameter.`,
      `${M}${C} gaat van het middelpunt naar de cirkel. Dat is een straal.`,
      `Het gekleurde stuk is een deel van de cirkel zelf. Dat is een cirkelboog.`,
      `${B}${D} gaat niet door ${M}, dus ${B}${D} is geen diameter.`,
      `Een diameter is 2 keer de straal: ${A}${B} = 2 * ${d(r)} = ${cm(2 * r)}.`,
    ],
    traps: [
      trap(
        VERWISSELD,
        'Je hebt de straal en de diameter verwisseld. Een straal gaat van het middelpunt naar de cirkel. Een diameter gaat door het middelpunt, van de cirkel naar de overkant, en is 2 keer zo lang.',
        (v) => v[0] === 'straal' || v[1] === 'diameter',
        (v) => near(v[4], r / 2),
      ),
      {
        id: 'boog-is-geen-lijnstuk',
        f: (v) => v[2] === 'straal' || v[2] === 'diameter',
        m: 'Een straal en een diameter zijn rechte lijnstukken. Het gekleurde stuk is een deel van de cirkel zelf, en dat is gebogen: een cirkelboog.',
      },
      {
        id: 'lijnstuk-niet-door-middelpunt',
        f: (v) => v[3] === 'ja',
        m: `${B}${D} gaat van de cirkel naar de cirkel, maar niet door het middelpunt ${M}. Een diameter gaat altijd door het middelpunt.`,
      },
      { ...GELIJK, f: (v) => near(v[4], r) },
    ],
    // Reken uit de punten na wat elk lijnstuk is, en meet de diameter.
    v: () =>
      soort(k, [A, B]) === fields[0].a &&
      soort(k, [M, C]) === fields[1].a &&
      soort(k, [B, D]) === 'lijnstuk' &&
      fields[3].a === 'nee' &&
      near(afstand(k.P[A], k.P[B]), fields[4].a, 1e-9),
  };
}

// Welke beschrijving past bij de cirkel? Met de straal erbij, of als cirkel met een diameter.
function beschrijving() {
  const k = cirkelMetLetters(),
    { M, A, B, C, r } = k,
    metDiameter = coin(),
    mid = k.P[C].map((x) => x / 2),
    fig = cirkelFig({
      circles: [{ c: k.c, r }],
      lines: [
        [k.P[A], k.P[B]],
        [k.P[M], k.P[C]],
      ],
      dots: [M, A, B, C].map((t) => k.P[t]),
      names: namen(k, [M, A, B, C]),
      lengths: [{ at: mid, t: cm(r), off: [k.g.C < 90 ? -24 : 24, -4] }],
      desc: `Een cirkel met in het midden punt ${M}. De punten ${and([A, B, C])} liggen op de cirkel. Lijnstukken ${A}${B} en ${M}${C}. ${A}${B} gaat door ${M}. Lengte: ${M}${C} = ${cm(r)}.`,
    });
  // Elke keuze als gegevens, zodat v kan narekenen welke cirkel het is.
  const middelpunt = (X, s) => ({ t: `Cirkel met middelpunt ${X} en straal ${cm(s)}`, X, s }),
    diameter = (pq) => ({ t: `Cirkel met diameter ${pq}`, pq }),
    keuzes = metDiameter
      ? [diameter(A + B), diameter(M + C), middelpunt(M, 2 * r), middelpunt(A, r)]
      : [middelpunt(M, r), diameter(M + C), middelpunt(M, 2 * r), middelpunt(C, r)],
    opts = keuzes.map((x) => T(x.t)),
    mc = MC(opts, 0);
  return {
    q: T('Welke beschrijving past bij de cirkel in de figuur?'),
    fig,
    mc,
    hint: 'Een cirkel noem je met het middelpunt en de straal, of met een diameter. De straal gaat van het middelpunt naar de cirkel, de diameter door het middelpunt naar de overkant.',
    steps: [
      `${M} ligt in het midden. Dat is het middelpunt.`,
      `${M}${C} gaat van het middelpunt naar de cirkel. Dat is een straal, dus de straal is ${cm(r)}.`,
      metDiameter
        ? `${A}${B} gaat door het middelpunt, van de cirkel naar de overkant. Dat is een diameter. Dus: cirkel met diameter ${A}${B}.`
        : `Dus: cirkel met middelpunt ${M} en straal ${cm(r)}.`,
    ],
    traps: [
      {
        id: 'straal-als-diameter',
        f: (v) => v[0] === opts[1],
        m: `${M}${C} begint in het middelpunt. Dat is een straal, geen diameter. Een diameter gaat door het middelpunt naar de overkant.`,
      },
      {
        id: VERWISSELD,
        f: (v) => v[0] === opts[2],
        m: `${cm(2 * r)} is de diameter. De straal is de helft: ${cm(r)}.`,
      },
      {
        id: 'punt-op-cirkel-als-middelpunt',
        f: (v) => v[0] === opts[3],
        m: `${keuzes[3].X} ligt op de cirkel, niet in het midden. Het middelpunt is ${M}.`,
      },
    ],
    // Welke keuzes passen bij de getekende cirkel: hetzelfde middelpunt en dezelfde straal?
    v: () => {
      const straal = afstand(k.P[M], k.P[C]),
        past = (x) =>
          x.pq
            ? near(afstand(k.c, k.P[x.pq[0]]), straal, 1e-9) &&
              near(afstand(k.P[x.pq[0]], k.P[x.pq[1]]), 2 * straal, 1e-9)
            : near(afstand(k.P[x.X], k.c), 0, 1e-9) && near(x.s, straal, 1e-9);
      const goed = keuzes.filter(past);
      return goed.length === 1 && mc.opts[mc.a] === T(goed[0].t);
    },
  };
}
const s163 = () => pick([benoemen, benoemen, beschrijving])();

// ---------------------------------------------------------------------------------------------
// 164: de grootste cirkel in een rechthoek of vierkant.

// De grootste straal in een rechthoek van l bij b: de kleinste afstand van het midden tot een zijde.
const grootsteStraal = (l, b) => {
  const m = [l / 2, b / 2];
  return Math.min(m[0], l - m[0], m[1], b - m[1]);
};
function rechthoekFig(l, b, cirkel, extra = {}) {
  const vk = l === b,
    naam = vk
      ? `Een vierkant van ${cm(l)} bij ${cm(b)}`
      : `Een rechthoek van ${cm(l)} bij ${cm(b)}`;
  return cirkelFig({
    rects: [[0, 0, l, b]],
    circles: cirkel ? [{ c: [l / 2, b / 2], r: b / 2 }] : [],
    lengths: [
      { at: [l / 2, 0], t: cm(l), off: [0, 16] },
      ...(vk ? [] : [{ at: [l, b / 2], t: cm(b), off: [26, 0] }]),
    ],
    desc:
      `${naam}${cirkel ? `, met daarin de grootste cirkel die past. ${vk ? 'De cirkel raakt alle vier de zijden.' : 'De cirkel raakt de twee lange zijden.'}` : '.'}` +
      (extra.desc || ''),
    w: 320,
    maxH: 200,
    pad: 45,
  });
}

function grootsteCirkel() {
  const vk = coin(),
    [l, b] = vk
      ? [0, 0].fill(pick([4, 5, 6, 7, 8, 9, 10, 12]))
      : until(
          () => [pick([6, 7, 8, 9, 10, 12]), pick([3, 4, 5, 6, 7, 9, 4.5])],
          ([l, b]) => l > b,
        ),
    rh = vk ? 'vierkant' : 'rechthoek',
    lw = vk ? 'het' : 'de';
  return {
    q: T(
      `In de figuur zie je een ${rh} van ${cm(l)} bij ${cm(b)}. Je tekent de grootste cirkel die in ${lw} ${rh} past. Hoe groot is de diameter van die cirkel, en hoe groot is de straal?`,
    ),
    fig: rechthoekFig(l, b, true),
    fields: [F('Diameter:', b, 'cm'), { ...F('Straal:', b / 2, 'cm'), br: true }],
    hint: vk
      ? 'De grootste cirkel in een vierkant raakt alle vier de zijden. Hoe breed is de cirkel dan?'
      : 'De grootste cirkel raakt twee zijden van de rechthoek. Welke zijde is dan precies zo lang als de diameter?',
    steps: [
      vk
        ? `De cirkel raakt alle vier de zijden. De diameter is dus zo lang als een zijde: ${cm(b)}.`
        : `De cirkel raakt de twee lange zijden. De diameter is dus zo lang als de korte zijde: ${cm(b)}.`,
      `De straal is de helft: ${d(b)} : 2 = ${cm(b / 2)}.`,
    ],
    traps: [
      !vk &&
        trap(
          'lange-zijde-genomen',
          `Een cirkel met een diameter van ${cm(l)} komt buiten de rechthoek, want de rechthoek is maar ${cm(b)} breed. Neem de korte zijde.`,
          (v) => near(v[0], l),
          (v) => near(v[1], l / 2),
        ),
      trap(
        VERWISSELD,
        'Je hebt de straal en de diameter verwisseld. De diameter is zo lang als de zijde die de cirkel van kant tot kant raakt. De straal is de helft daarvan.',
        (v) => near(v[0], b / 2),
        (v) => near(v[1], b),
      ),
    ].filter(Boolean),
    v: () => near(2 * grootsteStraal(l, b), b, 1e-9) && near(grootsteStraal(l, b), b / 2, 1e-9),
  };
}

// Een cirkel past precies in een vierkant. Hoe lang is een zijde?
function vierkantOmCirkel() {
  const r = pick([2, 2.5, 3, 3.5, 4, 4.5, 5, 6]),
    z = 2 * r,
    fig = cirkelFig({
      rects: [[0, 0, z, z]],
      circles: [{ c: [r, r], r }],
      lines: [
        [
          [r, r],
          [z, r],
        ],
      ],
      dots: [[r, r]],
      lengths: [{ at: [1.5 * r, r], t: cm(r), off: [0, -12] }],
      desc: `Een vierkant met daarin een cirkel die alle vier de zijden raakt. Vanuit het middelpunt is een straal getekend: ${cm(r)}.`,
      w: 260,
      maxH: 200,
    });
  return {
    q: T(
      `Een cirkel met een straal van ${cm(r)} past precies in een vierkant: de cirkel raakt alle vier de zijden. Hoe lang is een zijde van het vierkant?`,
    ),
    fig,
    fields: [F('Een zijde is', z, 'cm')],
    hint: 'Een zijde van het vierkant is zo lang als de cirkel breed is. Hoe breed is een cirkel?',
    steps: [
      'De cirkel raakt twee zijden tegenover elkaar. De afstand daartussen is de diameter.',
      `De diameter is 2 keer de straal: 2 * ${d(r)} = ${cm(z)}.`,
      `Dus een zijde is ${cm(z)}.`,
    ],
    traps: [
      {
        id: VERWISSELD,
        f: (v) => near(v[0], r) || near(v[0], r / 2),
        m: 'Een zijde van het vierkant is zo lang als de diameter van de cirkel, niet als de straal. De diameter is 2 keer de straal.',
      },
    ],
    v: () => near(grootsteStraal(z, z), r, 1e-9),
  };
}

// Past een cirkel met een gegeven straal in een rechthoek?
function pastHet() {
  const past = coin(),
    [l, b, r] = until(
      () => [pick([8, 9, 10, 12, 14]), pick([4, 5, 6, 7]), pick([2, 2.5, 3, 3.5, 4, 4.5, 5])],
      ([l, b, r]) => l > b && (past ? 2 * r <= b : 2 * r > b && 2 * r <= l && r < b),
    );
  const fields = [
    { ...F('De grootste cirkel die past, heeft een straal van', b / 2, 'cm') },
    {
      sel: ['ja', 'nee'],
      a: past ? 'ja' : 'nee',
      pre: `Past een cirkel met een straal van ${cm(r)}?`,
      label: `Past een cirkel met een straal van ${cm(r)}?`,
      br: true,
    },
  ];
  return {
    q: T(
      `In de figuur zie je een rechthoek van ${cm(l)} bij ${cm(b)}. Hoe groot is de straal van de grootste cirkel die in de rechthoek past? Past een cirkel met een straal van ${cm(r)} in de rechthoek?`,
    ),
    fig: rechthoekFig(l, b, false),
    fields,
    hint: 'De diameter van de grootste cirkel is zo lang als de korte zijde. Vergelijk daarna de straal van de cirkel met die straal.',
    steps: [
      `De diameter van de grootste cirkel is zo lang als de korte zijde: ${cm(b)}. De straal is ${d(b)} : 2 = ${cm(b / 2)}.`,
      past
        ? `${cm(r)} is niet meer dan ${cm(b / 2)}, dus de cirkel past.`
        : `${cm(r)} is meer dan ${cm(b / 2)}, dus de cirkel past niet. Hij is ${cm(2 * r)} breed en de korte zijde is maar ${cm(b)}.`,
    ],
    traps: [
      trap(
        'lange-zijde-genomen',
        `Neem de korte zijde. Langs de lange zijde van ${cm(l)} is genoeg plek, maar de cirkel moet ook passen tussen de lange zijden, en die liggen maar ${cm(b)} uit elkaar.`,
        (v) => near(v[0], l / 2) || near(v[0], l),
      ),
      {
        id: VERWISSELD,
        f: (v) => near(v[0], b),
        m: `${cm(b)} is de diameter van de grootste cirkel. De straal is de helft.`,
      },
      !past && {
        id: 'straal-met-zijde-vergeleken',
        f: (v) => v[1] === 'ja',
        m: `Kijk naar de diameter: een cirkel met een straal van ${cm(r)} is ${cm(2 * r)} breed. De korte zijde is maar ${cm(b)}, dus de cirkel past niet.`,
      },
    ].filter(Boolean),
    v: () =>
      near(grootsteStraal(l, b), fields[0].a, 1e-9) && r <= grootsteStraal(l, b) + 1e-9 === past,
  };
}
const s164 = () => pick([grootsteCirkel, grootsteCirkel, vierkantOmCirkel, pastHet])();

// ---------------------------------------------------------------------------------------------
// 165: afstanden en punten op een cirkel.

const WAAR = ['binnen de cirkel', 'op de cirkel', 'buiten de cirkel'];
function binnenOfBuiten() {
  const L = pick(LETTERS),
    [M, P, Q] = [...L],
    D = pick([5, 6, 7, 8, 9, 10, 12, 14]),
    r = D / 2,
    geval = ri(0, 2),
    // Buiten, maar dichterbij dan de diameter: wie met de diameter vergelijkt, zegt dan binnen.
    x = geval === 0 ? r - pick([0.5, 1, 1.5, 2]) : geval === 1 ? r : r + pick([0.5, 1, 1.5, 2]);
  const fields = [
    { ...F(`Afstand van ${P} tot ${M}:`, r, 'cm') },
    { sel: WAAR, a: WAAR[geval], pre: `Punt ${Q} ligt`, label: `Waar ligt ${Q}?`, br: true },
  ];
  return {
    q: T(
      `Een cirkel heeft middelpunt ${M} en een diameter van ${cm(D)}. Punt ${P} ligt op de cirkel. Punt ${Q} ligt op ${cm(x)} van ${M}. Hoe ver ligt ${P} van ${M} af? Ligt ${Q} binnen de cirkel, op de cirkel of buiten de cirkel?`,
    ),
    fields,
    hint: 'Een punt op de cirkel ligt precies een straal van het middelpunt. Reken eerst de straal uit en kijk dan of de afstand van het punt groter, kleiner of gelijk is.',
    steps: [
      `Een punt op de cirkel ligt een straal van het middelpunt. De straal is ${d(D)} : 2 = ${cm(r)}. Dus ${P} ligt op ${cm(r)} van ${M}.`,
      geval === 0
        ? `${cm(x)} is minder dan de straal, dus ${Q} ligt binnen de cirkel.`
        : geval === 1
          ? `${cm(x)} is precies de straal, dus ${Q} ligt op de cirkel.`
          : `${cm(x)} is meer dan de straal, dus ${Q} ligt buiten de cirkel.`,
    ],
    traps: [
      {
        id: VERWISSELD,
        f: (v) => near(v[0], D),
        m: `${cm(D)} is de diameter: van de cirkel door ${M} naar de overkant. ${P} ligt een straal van ${M}, en dat is de helft van de diameter.`,
      },
      geval > 0 && {
        id: 'vergeleken-met-diameter',
        f: (v) => v[1] === WAAR[0],
        m: `Vergelijk de afstand met de straal, niet met de diameter. De straal is ${cm(r)}, en ${Q} ligt op ${cm(x)} van ${M}.`,
      },
    ].filter(Boolean),
    // Zet de punten in een assenstelsel met M in O, en meet.
    v: () => {
      const p = op([0, 0], r, 130),
        q = op([0, 0], x, 20),
        mp = Math.hypot(...p),
        mq = Math.hypot(...q),
        w = near(mq, mp, 1e-9) ? 1 : mq < mp ? 0 : 2;
      return near(mp, fields[0].a, 1e-9) && fields[1].a === WAAR[w];
    },
  };
}

// Hoeveel cirkels passen er in rechte rijen in een rechthoek?
const DOZEN = [
  {
    t: (L, B) => `Je plakt ronde stickers op een vel van ${cm(L)} bij ${cm(B)}.`,
    rij: 'Je plakt ze in rechte rijen tegen elkaar aan, en niet over de rand.',
    elk: 'Elke sticker',
    een: 'sticker',
    veel: 'stickers',
  },
  {
    t: (L, B) =>
      `Je zet bekers rechtop in een krat van ${cm(L)} bij ${cm(B)}. Van boven zie je elke beker als een cirkel.`,
    rij: 'De bekers staan in rechte rijen tegen elkaar aan.',
    elk: 'Elke beker',
    een: 'beker',
    veel: 'bekers',
  },
  {
    t: (L, B) => `Je legt ronde koekjes op een bakplaat van ${cm(L)} bij ${cm(B)}.`,
    rij: 'Je legt ze in rechte rijen tegen elkaar aan.',
    elk: 'Elk koekje',
    een: 'koekje',
    veel: 'koekjes',
  },
  {
    t: (L, B) => `Een tuinder zet ronde potten in een bak van ${cm(L)} bij ${cm(B)}.`,
    rij: 'De potten staan in rechte rijen tegen elkaar aan.',
    elk: 'Elke pot',
    een: 'pot',
    veel: 'potten',
  },
];
function cirkelsInRechthoek() {
  const doos = pick(DOZEN),
    D = pick([4, 5, 6, 8, 10]),
    r = D / 2,
    metStraal = coin(),
    [n1, n2, e1, e2] = until(
      () => [ri(3, 7), ri(2, 5), ri(0, D - 1), ri(0, D - 1)],
      ([n1, n2, e1, e2]) => n1 * D + e1 > n2 * D + e2,
    ),
    L = n1 * D + e1,
    B = n2 * D + e2;
  const fields = [
    F('In één rij langs de lange kant:', n1, doos.veel),
    { ...F('Aantal rijen:', n2), br: true },
    { ...F('Samen:', n1 * n2, doos.veel), br: true },
  ];
  const langs = (z, n, e) =>
    e === 0
      ? `${d(z)} : ${d(D)} = ${n}.`
      : `${n} * ${d(D)} = ${d(n * D)}. Dan blijft er ${cm(e)} over, en daar past geen hele ${doos.een} meer in. Dus ${n}.`;
  return {
    q: T(
      `${doos.t(L, B)} ${doos.elk} heeft een ${metStraal ? `straal van ${cm(r)}` : `diameter van ${cm(D)}`}. ${doos.rij} Hoeveel ${doos.veel} passen er in één rij langs de lange kant? Hoeveel rijen passen er? Hoeveel ${doos.veel} passen er samen?`,
    ),
    fields,
    hint: `Hoe breed is één ${doos.een}? Dat is de diameter. Kijk hoe vaak die past langs elke kant.`,
    steps: [
      metStraal
        ? `Eén ${doos.een} is zo breed als de diameter: 2 * ${d(r)} = ${cm(D)}.`
        : `Eén ${doos.een} is zo breed als de diameter: ${cm(D)}.`,
      `Langs de lange kant van ${cm(L)}: ${langs(L, n1, e1)}`,
      `Langs de korte kant van ${cm(B)}: ${langs(B, n2, e2)} Dat is het aantal rijen.`,
      `Samen: ${n1} * ${n2} = ${n1 * n2}.`,
    ],
    traps: [
      metStraal &&
        trap(
          VERWISSELD,
          `Je hebt gedeeld door de straal. Eén ${doos.een} is 2 * ${d(r)} = ${cm(D)} breed: de diameter. Deel dus door ${d(D)}.`,
          (v) => v[0] === Math.floor(L / r),
          (v) => v[1] === Math.floor(B / r),
        ),
      trap(
        'naar-boven-afgerond',
        `Er blijft een stukje over dat smaller is dan één ${doos.een}. Daar past geen hele ${doos.een} meer in, dus rond naar beneden af.`,
        e1 > 0 && ((v) => v[0] === n1 + 1),
        e2 > 0 && ((v) => v[1] === n2 + 1),
      ),
      {
        id: 'opgeteld-in-plaats-van-keer',
        f: (v) => v[2] === n1 + n2,
        m: `Je hebt opgeteld. In elke rij passen ${n1} ${doos.veel}, en er zijn ${n2} rijen. Dus ${n1} * ${n2}.`,
      },
    ].filter(Boolean),
    // Leg de cirkels een voor een neer, zolang ze binnen de rand blijven.
    v: () => {
      const tel = (z) => {
        let n = 0;
        for (let m = r; m + r <= z + 1e-9; m += 2 * r) n++;
        return n;
      };
      return tel(L) === n1 && tel(B) === n2 && fields[2].a === tel(L) * tel(B);
    },
  };
}

// Even grote cirkels in een rij die elkaar raken: hoe lang is de rij, en hoe ver liggen het
// eerste en het laatste middelpunt uit elkaar?
function rijVanCirkels() {
  const n = ri(3, 6),
    r = pick([1, 1.5, 2, 2.5, 3, 4]),
    D = 2 * r,
    metStraal = coin(),
    m = Array.from({ length: n }, (_, i) => [r + i * D, r]),
    fig = cirkelFig({
      circles: m.map((c) => ({ c, r })),
      dots: m,
      lines: [
        metStraal
          ? [m[0], [r, 2 * r]]
          : [
              [0, r],
              [D, r],
            ],
      ],
      // De lengte staat boven de eerste cirkel: in een kleine cirkel is geen plek.
      lengths: [{ at: [r, 2 * r], t: cm(metStraal ? r : D), off: [0, -10] }],
      desc: `${n} even grote cirkels in een rij, die elkaar raken. In elke cirkel staat een stip voor het middelpunt. In de eerste cirkel is ${metStraal ? `de straal getekend: ${cm(r)}` : `een diameter getekend: ${cm(D)}`}.`,
      w: 340,
      maxH: 160,
      pad: 20,
    });
  const fields = [
    F('De rij is', n * D, 'cm lang'),
    { ...F('Van het eerste tot het laatste middelpunt:', (n - 1) * D, 'cm'), br: true },
  ];
  return {
    q: T(
      `In de figuur zie je ${n} even grote cirkels in een rij. Ze raken elkaar, en de middelpunten liggen op één rechte lijn. ${metStraal ? `De straal is ${cm(r)}` : `De diameter is ${cm(D)}`}. Hoe lang is de rij, van links tot rechts? Hoe ver ligt het middelpunt van de eerste cirkel van het middelpunt van de laatste?`,
    ),
    fig,
    fields,
    hint: 'Elke cirkel is zo breed als de diameter. Van het ene middelpunt naar het volgende is ook een diameter: een straal tot de rand en nog een straal tot het volgende middelpunt.',
    steps: [
      metStraal
        ? `Eén cirkel is 2 * ${d(r)} = ${cm(D)} breed.`
        : `Eén cirkel is ${cm(D)} breed: de diameter.`,
      `De rij is ${n} * ${d(D)} = ${cm(n * D)} lang.`,
      `Tussen ${n} middelpunten zitten ${n - 1} stappen van ${cm(D)}. Dus ${n - 1} * ${d(D)} = ${cm((n - 1) * D)}.`,
    ],
    traps: [
      metStraal &&
        trap(
          VERWISSELD,
          `Je hebt met de straal gerekend. Eén cirkel is 2 * ${d(r)} = ${cm(D)} breed, en van middelpunt tot middelpunt is ook ${cm(D)}.`,
          (v) => near(v[0], n * r),
          (v) => near(v[1], (n - 1) * r),
        ),
      {
        id: 'uiteinden-vergeten',
        f: (v) => near(v[0], (n - 1) * D),
        m: `Links van het eerste middelpunt en rechts van het laatste middelpunt zit nog een straal. De rij is dus ${n} hele cirkels lang.`,
      },
      {
        id: 'middelpunten-als-cirkels',
        f: (v) => near(v[1], n * D),
        m: `Tussen ${n} middelpunten zitten maar ${n - 1} stappen. Van het eerste tot het laatste middelpunt mis je links en rechts een straal.`,
      },
    ].filter(Boolean),
    // Meet in de figuur: van de linkerrand tot de rechterrand, en van middelpunt tot middelpunt.
    v: () =>
      m.every((c, i) => !i || near(c[0] - m[i - 1][0], r + r, 1e-9)) &&
      near(m[n - 1][0] + r - (m[0][0] - r), fields[0].a, 1e-9) &&
      near(m[n - 1][0] - m[0][0], fields[1].a, 1e-9),
  };
}
const s165 = () => pick([binnenOfBuiten, cirkelsInRechthoek, rijVanCirkels])();

// Een figuur voor de uitleg: cirkel met middelpunt M, diameter AB en straal MC.
const UITLEG = (() => {
  const c = [0, 0],
    r = 3,
    P = { M: c, A: op(c, r, 15), B: op(c, r, 195), C: op(c, r, 100) };
  return cirkelFig({
    circles: [{ c, r }],
    arcs: [{ c, r, from: 15, to: 100 }],
    lines: [
      [P.A, P.B],
      [P.M, P.C],
    ],
    dots: Object.values(P),
    names: [
      { at: c, t: 'M', off: [0, 18] },
      ...['A', 'B', 'C'].map((t) => ({ at: P[t], t, from: c })),
    ],
    desc: 'Een cirkel met middelpunt M. De punten A, B en C liggen op de cirkel. AB is een diameter en MC is een straal. Het stuk van de cirkel van A tot C is gekleurd: dat is een cirkelboog.',
    maxH: 200,
  });
})();

export default {
  slug: 'cirkel',
  title: 'Cirkel',
  intro:
    'Een cirkel bestaat uit alle punten die dezelfde afstand tot één punt hebben. Hier leer je wat de straal, de diameter en een cirkelboog zijn, en hoe je een cirkel met letters beschrijft. Ook zoek je de grootste cirkel in een rechthoek of vierkant, en reken je met afstanden tot het middelpunt.',
  description:
    'Cirkel oefenen: middelpunt, straal, diameter en cirkelboog, de grootste cirkel in een rechthoek en cirkels in een rij. Havo/vwo 1, gratis met uitleg en hints.',
  videos: {},
  skills: [
    [162, 'Straal en diameter', s162],
    [163, 'Middelpunt, straal, diameter en cirkelboog benoemen', s163],
    [164, 'De grootste cirkel in een rechthoek of vierkant', s164],
    [165, 'Afstanden en cirkels in een rij', s165],
  ],
  learn: [
    {
      t: 'Middelpunt, straal en diameter',
      p: [
        'Een cirkel bestaat uit alle punten die dezelfde afstand hebben tot één punt: het middelpunt. Die afstand heet de straal.',
        'Een diameter (of middellijn) is een lijnstuk van de cirkel door het middelpunt naar de overkant. Een diameter is 2 keer zo lang als de straal.',
        'Een stuk van de cirkel zelf heet een cirkelboog.',
        T(
          'Je beschrijft een cirkel met het middelpunt en de straal, zoals: cirkel met middelpunt M en straal 3 cm. Of met een diameter, zoals: cirkel met diameter AB.',
        ),
      ],
      ex: {
        q: T('Wat zijn AB en MC in deze cirkel? MC = 3 cm. Hoe lang is AB?') + UITLEG,
        steps: [
          'AB gaat door het middelpunt M, van de cirkel naar de overkant. Dat is een diameter.',
          'MC gaat van het middelpunt naar de cirkel. Dat is een straal.',
          'AB = 2 * 3 = 6 cm.',
        ],
      },
      watch: T(
        'Haal straal en diameter niet door elkaar. De straal begint in het middelpunt. De diameter gaat door het middelpunt en is 2 keer zo lang.',
      ),
    },
    {
      t: 'De grootste cirkel in een rechthoek',
      p: [
        'De grootste cirkel die in een rechthoek past, raakt de twee lange zijden. De diameter is dan zo lang als de korte zijde.',
        'In een vierkant raakt de grootste cirkel alle vier de zijden. De diameter is dan zo lang als een zijde.',
      ],
      ex: {
        q: T('Hoe groot is de straal van de grootste cirkel in een rechthoek van 10 cm bij 6 cm?'),
        steps: [
          'De korte zijde is 6 cm, dus de diameter is 6 cm.',
          '6 : 2 = 3, dus de straal is 3 cm.',
        ],
      },
      watch: T(
        'Neem de korte zijde, niet de lange. Een cirkel zo breed als de lange zijde komt buiten de rechthoek.',
      ),
    },
    {
      t: 'Afstanden en cirkels in een rij',
      p: [
        'Een punt op de cirkel ligt precies een straal van het middelpunt. Ligt een punt dichterbij, dan ligt het binnen de cirkel. Ligt het verder weg, dan ligt het buiten de cirkel.',
        'Wil je weten hoeveel cirkels er naast elkaar passen, kijk dan naar de diameter: zo breed is één cirkel.',
      ],
      ex: {
        q: T(
          'Hoeveel cirkels met een straal van 2 cm passen naast elkaar op een strook van 18 cm?',
        ),
        steps: [
          'Eén cirkel is 2 * 2 = 4 cm breed.',
          '4 * 4 = 16. Dan blijft er 2 cm over, en daar past geen hele cirkel meer in.',
          'Dus er passen 4 cirkels.',
        ],
      },
      watch: T(
        'Blijft er een stukje over, dan rond je naar beneden af. Daar past geen hele cirkel meer in.',
      ),
    },
  ],
};
