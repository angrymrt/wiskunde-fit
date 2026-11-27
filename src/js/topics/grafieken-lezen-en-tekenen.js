// Onderwerp: Grafieken lezen en tekenen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
// Grafieken bij een verhaal, met assen met een naam en een eenheid (#287). De figuur komt uit
// contextGraph in grafiekfiguren.js. Elke v leest de getallen terug uit de getekende figuur: de
// getallen bij de assen en de lijnen in pixels. Zo controleert v wat de leerling echt ziet, en niet
// de gegevens waarmee de vraag is gemaakt.
import { ri, pick, coin, until, near, d } from '../math.js';
import { F, MC, H } from './shared.js';
import { T, esc } from '../typeset.js';
import { SOORTEN, tekenAf, tekenFig } from '../tekenvragen.js';
import { contextGraph, tijd } from '../grafiekfiguren.js';

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const heel = (x) => near(x, Math.round(x), 1e-9);
const figbox = (svg) => `<div class="figbox">${svg}</div>`;
const NAMEN = ['Noor', 'Daan', 'Sem', 'Lotte', 'Yara', 'Milan', 'Fenna', 'Ilias', 'Saar', 'Jesse'];

// De waarde van een grafiek met rechte stukken bij x. Bij een vloeiende kromme klopt dit alleen in
// de punten zelf, dus daar vragen we alleen naar de punten.
function op(P, x, tol = 1e-6) {
  for (let k = 0; k + 1 < P.length; k++) {
    const [a, b] = [P[k], P[k + 1]];
    if (x >= a[0] - tol && x <= b[0] + tol)
      return a[1] + ((x - a[0]) * (b[1] - a[1])) / (b[0] - a[0] || 1);
  }
  return NaN;
}
// De x waarbij de grafiek voor het eerst bij de waarde w komt (van onder af).
function eerst(P, w, tol = 1e-6) {
  if (Math.abs(P[0][1] - w) < tol) return P[0][0];
  for (let k = 0; k + 1 < P.length; k++) {
    const [a, b] = [P[k], P[k + 1]];
    if (a[1] < w - tol && b[1] >= w - tol)
      return a[0] + ((w - a[1]) * (b[0] - a[0])) / (b[1] - a[1]);
  }
  return NaN;
}
// Alle x waarbij de grafiek de waarde w heeft; null als hij daar horizontaal loopt.
function wanneer(P, w, tol = 1e-6) {
  const uit = [],
    is = (y) => Math.abs(y - w) < tol;
  for (let k = 0; k < P.length; k++) {
    if (is(P[k][1])) uit.push(P[k][0]);
    if (k + 1 < P.length) {
      const [a, b] = [P[k], P[k + 1]];
      if (is(a[1]) && is(b[1])) return null;
      if (!is(a[1]) && !is(b[1]) && (a[1] - w) * (b[1] - w) < 0)
        uit.push(a[0] + ((w - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
    }
  }
  return uit;
}
// De snijpunten van twee grafieken met rechte stukken, waar ze allebei bestaan. Een punt waar ze
// elkaar alleen raken telt ook.
function snijpunten(P, Q, tol = 1e-6) {
  const van = Math.max(P[0][0], Q[0][0]),
    tot = Math.min(P[P.length - 1][0], Q[Q.length - 1][0]),
    xs = [...new Set([...P, ...Q].map((p) => p[0]))]
      .filter((x) => x >= van - tol && x <= tot + tol)
      .sort((a, b) => a - b),
    f = (x) => op(P, x, tol) - op(Q, x, tol),
    uit = [];
  xs.forEach((x, i) => {
    if (Math.abs(f(x)) < tol) uit.push([x, op(P, x, tol)]);
    else if (i + 1 < xs.length && Math.abs(f(xs[i + 1])) >= tol && f(x) * f(xs[i + 1]) < 0) {
      const s = x + ((xs[i + 1] - x) * f(x)) / (f(x) - f(xs[i + 1]));
      uit.push([s, op(P, s, tol)]);
    }
  });
  return uit;
}

// Leest een figuur uit contextGraph terug: per grafiek de punten in de getallen van de assen. De
// schaal komt uit de getallen bij de assen (de twee grootste, zodat de 0 bij een scheurlijn niet
// meetelt). Bij een vloeiende kromme zijn de punten de eindpunten van de Bézier-stukken. tx en ty
// zijn een halve pixel in de getallen van de assen: zo nauwkeurig is de figuur.
function lees(fig) {
  const getal = (s) => +s.replace('−', '-').replace(',', '.'),
    tk = [
      ...fig.matchAll(
        /<text class="tk" text-anchor="(middle|end)" x="([-\d.]+)" y="([-\d.]+)">([^<]+)<\/text>/g,
      ),
    ].map(([, a, x, y, s]) => ({ a, x: +x, y: +y - 4, v: getal(s) })),
    schaal = (L, k) => {
      const [p, q] = L.sort((a, b) => b.v - a.v);
      return [
        (px) => p.v + ((px - p[k]) * (q.v - p.v)) / (q[k] - p[k]),
        (q.v - p.v) / (q[k] - p[k]),
      ];
    },
    [xv, sx] = schaal(
      tk.filter((t) => t.a === 'middle'),
      'x',
    ),
    [yv, sy] = schaal(
      tk.filter((t) => t.a === 'end'),
      'y',
    ),
    lijnen = [...fig.matchAll(/<path class="l\d" d="([^"]+)"/g)].map(([, dd]) => {
      const n = dd.match(/-?[\d.]+/g).map(Number),
        P = [];
      for (let i = 0; i + 1 < n.length; i += 2) P.push([n[i], n[i + 1]]);
      const punten = dd.includes('C') ? P.filter((p, i) => i % 3 === 0) : P;
      return punten.map(([a, b]) => [xv(a), yv(b)]);
    });
  return { lijnen, tx: Math.abs(sx) / 2, ty: Math.abs(sy) / 2 };
}

// Tijd op de horizontale as: in uren (een tijdstip, zoals 9.30 uur), weken of minuten.
const opAs = (k, t) =>
  k === 'uur' ? tijd(t) : `${d(t)} ${k === 'weken' ? (t === 1 ? 'week' : 'weken') : 'minuten'}`;
const bij = (k, t) => (k === 'uur' ? `om ${tijd(t)}` : `na ${opAs(k, t)}`);
const tijdVeld = (k, t) => (k === 'uur' ? F('om', t, 'uur') : F('na', t, k));
const tussen = (S, a, b) =>
  S.k === 'uur' ? `tussen ${tijd(a)} en ${tijd(b)}` : `tussen ${a} en ${b} ${S.k} na ${S.start}`;
// Een stap van de uitwerking zoals in het boek.
const omhoog = (S, t, w) =>
  `Ga op de horizontale as naar ${opAs(S.k, t)}, omhoog naar de grafiek en dan naar links: ${d(w)} ${S.y.eenheid}.`;
const opzij = (S, w, t) =>
  `Ga op de verticale as naar ${d(w)} ${S.y.eenheid}, naar rechts naar de grafiek en dan omlaag: ${opAs(S.k, t)}.`;
const hokje = (a, waar) =>
  `Eén hokje op de ${waar} as is ${a.stap === 0.5 && a.eenheid === 'uur' ? 'een half uur' : `${d(a.stap)} ${a.eenheid}`}.`;

// Meetgegevens bij een verhaal, met eigen getallen. xs zijn de tijdstippen van de metingen. h is
// een half hokje op de verticale as: elke meting is een veelvoud van h, dus ligt op een lijn of
// precies halverwege. start en inc zijn de eerste meting en de stappen ertussen, in halve hokjes.
// vorm zegt hoe de gegevens lopen: berg (eerst omhoog, dan omlaag), golf, stijg of ballon.
const uren = (a, b, s) => Array.from({ length: (b - a) / s + 1 }, (_, i) => a + i * s);
const MEET = [
  {
    titel: 'Temperatuur op een zomerdag',
    intro: 'Op een zomerdag is in een tuin elke twee uur de temperatuur gemeten.',
    k: 'uur',
    x: { naam: 'tijd in uren', van: 6, tot: 20, stap: 2, eenheid: 'uur' },
    xs: uren(6, 20, 2),
    y: { naam: 'temperatuur in °C', stap: 2, eenheid: 'graden' },
    h: 1,
    begin: [9, 16],
    inc: [1, 3],
    vorm: 'berg',
    pre: 'Het is',
    post: 'graden',
    waarde: (b) => `Hoeveel graden is het ${b}?`,
    zin: (b, w) => `${cap(b)} is het ${w} graden.`,
    wanneer: (w) => `Hoe laat is het ${w} graden?`,
    hoogst: 'Wat is de hoogste temperatuur, en hoe laat is het zo warm?',
    hoogstVeld: 'De hoogste temperatuur is',
    toe: (tus, up) => `Hoeveel graden wordt het ${up ? 'warmer' : 'kouder'} ${tus}?`,
    toeZin: (tus, up, w) => `${cap(tus)} wordt het ${w} graden ${up ? 'warmer' : 'kouder'}.`,
  },
  {
    titel: 'Waterstand in de haven',
    intro: 'In een haven is elke twee uur gemeten hoe hoog het water staat.',
    k: 'uur',
    x: { naam: 'tijd in uren', van: 4, tot: 16, stap: 1, eenheid: 'uur' },
    xs: uren(4, 16, 2),
    y: { naam: 'waterstand in cm', stap: 20, eenheid: 'cm' },
    h: 10,
    begin: [100, 200],
    inc: [2, 6],
    vorm: 'golf',
    u: 22,
    pre: 'De waterstand is',
    post: 'cm',
    waarde: (b) => `Hoe hoog staat het water ${b}?`,
    zin: (b, w) => `${cap(b)} is de waterstand ${w} cm.`,
    wanneer: (w) => `Hoe laat is de waterstand ${w} cm?`,
    hoogst: 'Wat is de hoogste waterstand, en hoe laat staat het water zo hoog?',
    hoogstVeld: 'De hoogste waterstand is',
    toe: (tus, up) => `Hoeveel cm ${up ? 'stijgt' : 'daalt'} het water ${tus}?`,
    toeZin: (tus, up, w) => `${cap(tus)} ${up ? 'stijgt' : 'daalt'} het water ${w} cm.`,
  },
  {
    titel: 'Lengte van een zonnebloem',
    intro: 'Een zonnebloem is elke week gemeten, vanaf de dag dat hij is geplant.',
    k: 'weken',
    start: 'het planten',
    x: { naam: 'tijd in weken', van: 0, tot: 8, stap: 1, eenheid: 'week' },
    xs: uren(0, 8, 1),
    y: { naam: 'lengte in cm', stap: 10, eenheid: 'cm' },
    h: 5,
    begin: [5, 15],
    inc: [1, 3],
    vorm: 'stijg',
    pre: 'De plant is',
    post: 'cm',
    waarde: (b) => `Hoe lang is de plant ${b}?`,
    zin: (b, w) => `${cap(b)} is de plant ${w} cm.`,
    wanneer: (w) => `Na hoeveel weken is de plant ${w} cm lang?`,
    toe: (tus) => `Hoeveel cm groeit de plant ${tus}?`,
    toeZin: (tus, up, w) => `${cap(tus)} groeit de plant ${w} cm.`,
  },
  {
    titel: 'Vlucht van een luchtballon',
    intro: 'Een luchtballon maakt een korte vlucht.',
    k: 'minuten',
    start: 'de start',
    x: { naam: 'tijd in minuten', van: 0, tot: 50, stap: 5, eenheid: 'minuten' },
    xs: uren(0, 50, 10),
    y: { naam: 'hoogte in meter', stap: 50, eenheid: 'meter' },
    h: 25,
    vorm: 'ballon',
    lijn: true,
    pre: 'De ballon is op',
    post: 'meter hoogte',
    waarde: (b) => `Hoe hoog is de ballon ${b}?`,
    zin: (b, w) => `${cap(b)} is de ballon op ${w} meter hoogte.`,
    wanneer: (w) => `Na hoeveel minuten is de ballon op ${w} meter hoogte?`,
    hoogst: 'Wat is de grootste hoogte van de ballon, en na hoeveel minuten is hij daar?',
    hoogstVeld: 'De ballon komt het hoogst op',
    toe: (tus, up) => `Hoeveel meter ${up ? 'stijgt' : 'daalt'} de ballon ${tus}?`,
    toeZin: (tus, up, w) => `${cap(tus)} ${up ? 'stijgt' : 'daalt'} de ballon ${w} meter.`,
  },
  {
    titel: 'Bezoekers in het zwembad',
    intro: 'In een zwembad is elk uur geteld hoeveel mensen er zijn.',
    k: 'uur',
    x: { naam: 'tijd in uren', van: 10, tot: 18, stap: 1, eenheid: 'uur' },
    xs: uren(10, 18, 1),
    y: { naam: 'aantal bezoekers', stap: 20, eenheid: 'bezoekers' },
    h: 10,
    begin: [20, 60],
    inc: [1, 4],
    vorm: 'berg',
    pre: 'Er zijn',
    post: 'bezoekers',
    waarde: (b) => `Hoeveel bezoekers zijn er ${b}?`,
    zin: (b, w) => `${cap(b)} zijn er ${w} bezoekers.`,
    wanneer: (w) => `Hoe laat zijn er ${w} bezoekers?`,
    hoogst: 'Hoeveel bezoekers zijn er als het het drukst is, en hoe laat is dat?',
    hoogstVeld: 'Het drukst is het met',
    toe: (tus, up) => `Hoeveel neemt het aantal bezoekers ${up ? 'toe' : 'af'} ${tus}?`,
    toeZin: (tus, up, w) => `${cap(tus)} neemt het aantal bezoekers ${w} ${up ? 'toe' : 'af'}.`,
  },
];

// De metingen van een verhaal, als punten [tijd, waarde].
function metingen(S) {
  const n = S.xs.length,
    stap = () => ri(S.inc[0], S.inc[1]);
  let k;
  if (S.vorm === 'ballon') {
    const a = ri(4, 8),
      b = a + ri(2, 6),
      c = ri(2, b - 2);
    k = [0, a, a, b, c, 0];
  } else {
    k = [ri(S.begin[0] / S.h, S.begin[1] / S.h)];
    const p = S.vorm === 'berg' ? ri(2, n - 3) : 0,
      up = coin(),
      p1 = S.vorm === 'golf' ? ri(1, n - 4) : 0,
      p2 = S.vorm === 'golf' ? ri(p1 + 2, n - 2) : 0;
    for (let i = 1; i < n; i++) {
      const r =
        S.vorm === 'stijg'
          ? 1
          : S.vorm === 'berg'
            ? i <= p
              ? 1
              : -1
            : (i <= p1 || i > p2) === up
              ? 1
              : -1;
      k.push(k[i - 1] + r * stap());
    }
  }
  return S.xs.map((x, i) => [x, k[i] * S.h]);
}
// De verticale as bij de metingen: een hokje ruimte boven en onder, en beginnen bij 0 als dat kan.
function yAs(S, ys) {
  const st = S.y.stap,
    lo = Math.min(...ys),
    van = Math.max(0, (Math.floor(lo / st) - 1) * st);
  return { ...S.y, van: lo <= 4 * st ? 0 : van, tot: (Math.ceil(Math.max(...ys) / st) + 1) * st };
}
const meetFig = (S, P, y) =>
  contextGraph({
    titel: S.titel,
    x: S.x,
    y,
    grafieken: [{ punten: P, vorm: S.lijn ? 'lijn' : 'kromme', stippen: !S.lijn }],
    zeg: 'vorm',
    u: S.u || 26,
  });
// Een verhaal met metingen die binnen de figuur passen en niet onder 0 komen.
const meetVerhaal = (keuze) =>
  until(
    () => {
      const S = pick(keuze),
        P = metingen(S);
      return {
        S,
        P,
        y: yAs(
          S,
          P.map((p) => p[1]),
        ),
      };
    },
    ({ S, P, y }) =>
      P.every((p) => p[1] > 0 || S.vorm === 'ballon') && (y.tot - y.van) / y.stap <= 14,
  );

// Valkuilen bij een getal dat je op de verticale as afleest.
function afleesTraps(y, w, t, opAsT) {
  const hok = (w - y.van) / y.stap;
  return [
    ...(hok !== w
      ? [
          {
            id: 'hokjes-geteld',
            f: (v) => v[0] === hok,
            m: `Je hebt de hokjes geteld. Eén hokje op de verticale as is ${d(y.stap)} ${y.eenheid}, en niet 1. Lees het getal af bij de lijn.`,
          },
        ]
      : []),
    ...(t !== w && t !== hok
      ? [
          {
            id: 'verkeerde-as',
            f: (v) => v[0] === t,
            m: `Dat getal staat op de horizontale as, bij ${opAsT}. Het antwoord lees je af op de verticale as: ga vanaf de grafiek naar links.`,
          },
        ]
      : []),
    {
      id: 'hokje-ernaast',
      f: (v) => Math.abs(v[0] - w) === y.stap,
      m: 'Je zit een hokje naast het goede getal. Ga precies recht omhoog naar de grafiek, en dan precies horizontaal naar de verticale as.',
    },
  ];
}

// Een waarde aflezen bij een tijdstip. Bij een vloeiende kromme op een meting, bij rechte stukken
// ook ertussen, als de waarde op een lijn of precies halverwege valt.
function s32aflezen() {
  const { S, P, y } = meetVerhaal(MEET),
    kan = S.lijn
      ? uren(S.x.van + S.x.stap, S.x.tot - S.x.stap, S.x.stap).filter((t) => heel(op(P, t) / S.h))
      : P.map((p) => p[0]).filter((t) => S.k === 'uur' || t > 0),
    t = pick(kan),
    w = op(P, t),
    fig = meetFig(S, P, y),
    b = bij(S.k, t);
  return {
    q: T(`${S.intro} ${S.waarde(b)}`),
    fig,
    fields: [F(S.pre, w, S.post)],
    hint: T(
      `Kijk eerst wat één hokje is op elke as. Ga dan op de horizontale as naar ${opAs(S.k, t)}, recht omhoog naar de grafiek en dan naar links naar de verticale as.`,
    ),
    steps: [hokje(y, 'verticale'), omhoog(S, t, w), S.zin(b, d(w))],
    traps: afleesTraps(y, w, t, opAs(S.k, t)),
    v: () => {
      const R = lees(fig);
      return near(op(R.lijnen[0], t, R.tx), w, R.ty);
    },
  };
}

// Een tijdstip bij een waarde, de hoogste waarde met het tijdstip erbij, of hoeveel het verandert
// tussen twee tijdstippen.
function s32tijdstip() {
  const { S, P, y, soort, kan } = until(
      () => {
        const g = meetVerhaal(MEET),
          ok = (t) => g.S.k === 'uur' || t > 0,
          ys = g.P.map((p) => p[1]),
          m = Math.max(...ys),
          kan = {
            tijd: g.P.filter(([t, w]) => {
              const z = wanneer(g.P, w);
              return ok(t) && z && z.length === 1;
            }),
            hoogst:
              g.S.hoogst && ys.filter((w) => w === m).length === 1
                ? g.P.filter((p) => p[1] === m)
                : [],
            toe: [],
          };
        g.P.forEach(([a, va], i) =>
          g.P.forEach(([b, vb], j) => {
            const dif = Math.abs(vb - va),
              stuk = g.P.slice(i, j + 1),
              rich = stuk.slice(1).map((p, k) => Math.sign(p[1] - stuk[k][1]));
            if (
              j > i &&
              ok(a) &&
              dif > 0 &&
              dif !== va &&
              dif !== vb &&
              rich.every((r) => r === rich[0])
            )
              kan.toe.push([a, b]);
          }),
        );
        return { ...g, kan, soort: pick(Object.keys(kan).filter((s) => kan[s].length)) };
      },
      (g) => g.soort,
    ),
    fig = meetFig(S, P, y),
    x = S.x,
    hint0 = 'Kijk eerst wat één hokje is op elke as.';
  if (soort === 'tijd') {
    const [t, w] = pick(kan.tijd),
      hok = (t - x.van) / x.stap;
    return {
      q: T(`${S.intro} ${S.wanneer(d(w))}`),
      fig,
      fields: [tijdVeld(S.k, t)],
      hint: T(
        `${hint0} Ga op de verticale as naar ${d(w)} ${y.eenheid}, naar rechts naar de grafiek en dan recht omlaag naar de horizontale as.`,
      ),
      steps: [
        ...(x.stap !== 1 ? [hokje(x, 'horizontale')] : []),
        opzij(S, w, t),
        S.zin(bij(S.k, t), d(w)),
      ],
      traps: [
        ...(hok !== t
          ? [
              {
                id: 'hokjes-geteld',
                f: (v) => v[0] === hok,
                m: `Je hebt de hokjes geteld. Kijk welk getal er op de horizontale as staat: ${x.van === 0 ? '' : `de as begint bij ${d(x.van)}, en `}één hokje is ${d(x.stap)} ${x.eenheid}.`,
              },
            ]
          : []),
        ...(w !== t
          ? [
              {
                id: 'verkeerde-as',
                f: (v) => v[0] === w,
                m: `Dat getal staat in de vraag. Het tijdstip lees je af op de horizontale as: ga vanaf de grafiek recht omlaag.`,
              },
            ]
          : []),
      ],
      v: () => {
        const R = lees(fig),
          z = wanneer(R.lijnen[0], w, R.ty);
        return Boolean(z) && z.length === 1 && near(z[0], t, R.tx);
      },
    };
  }
  if (soort === 'hoogst') {
    const [t, m] = kan.hoogst[0],
      laag = Math.min(...P.map((p) => p[1])),
      hok = (m - y.van) / y.stap;
    return {
      q: T(`${S.intro} ${S.hoogst}`),
      fig,
      fields: [F(S.hoogstVeld, m, S.post), tijdVeld(S.k, t)],
      hint: T(
        `${hint0} Zoek het hoogste punt van de grafiek. Lees links af hoe hoog het is, en onder bij welk tijdstip het ligt.`,
      ),
      steps: [
        `Het hoogste punt van de grafiek ligt bij ${opAs(S.k, t)}.`,
        `Ga vanaf dat punt naar links: ${d(m)} ${y.eenheid}.`,
        S.zin(bij(S.k, t), d(m)),
      ],
      traps: [
        ...(hok !== m
          ? [
              {
                id: 'hokjes-geteld',
                f: (v) => v[0] === hok,
                m: `Je hebt de hokjes geteld. Eén hokje op de verticale as is ${d(y.stap)} ${y.eenheid}, en niet 1.`,
              },
            ]
          : []),
        {
          id: 'laagste-waarde',
          f: (v) => v[0] === laag,
          m: 'Dat is de laagste waarde. De hoogste waarde hoort bij het hoogste punt van de grafiek.',
        },
        ...(t !== m
          ? [
              {
                id: 'waarde-en-tijd-verwisseld',
                f: (v) => v[0] === t && v[1] === m,
                m: 'Je hebt de waarde en het tijdstip omgewisseld. De tijd staat op de horizontale as, de waarde op de verticale as.',
              },
            ]
          : []),
      ],
      v: () => {
        const R = lees(fig).lijnen[0],
          top = R.reduce((a, p) => (p[1] > a[1] ? p : a));
        return near(top[1], m, 0.01 * m) && near(top[0], t, 0.01 * (x.tot - x.van));
      },
    };
  }
  const [a, b] = pick(kan.toe),
    [va, vb] = [op(P, a), op(P, b)],
    up = vb > va,
    dif = Math.abs(vb - va),
    tus = tussen(S, a, b),
    hok = dif / y.stap;
  return {
    q: T(`${S.intro} ${S.toe(tus, up)}`),
    fig,
    fields: [F('', dif, y.eenheid)],
    hint: T(
      `${hint0} Lees de waarde bij allebei de tijdstippen af. Het verschil is hoeveel het verandert.`,
    ),
    steps: [
      omhoog(S, a, va),
      omhoog(S, b, vb),
      `${d(Math.max(va, vb))} - ${d(Math.min(va, vb))} = ${d(dif)}`,
      S.toeZin(tus, up, d(dif)),
    ],
    traps: [
      {
        id: 'waarde-in-plaats-van-verschil',
        f: (v) => v[0] === va || v[0] === vb,
        m: 'Je hebt een waarde afgelezen, maar de vraag is hoeveel het verandert. Lees bij allebei de tijdstippen af en trek de getallen van elkaar af.',
      },
      ...(hok !== dif
        ? [
            {
              id: 'hokjes-geteld',
              f: (v) => v[0] === hok,
              m: `Je hebt de hokjes geteld. Eén hokje op de verticale as is ${d(y.stap)} ${y.eenheid}, en niet 1.`,
            },
          ]
        : []),
    ],
    v: () => {
      const R = lees(fig),
        L = R.lijnen[0];
      return near(Math.abs(op(L, b, R.tx) - op(L, a, R.tx)), dif, 2 * R.ty);
    },
  };
}

// Een tocht: rijden, pauze, weer rijden. v zijn de snelheden in km per uur, h een half hokje op
// de verticale as. Niet elke snelheid geeft in elke duur een veelvoud van h (wandelen met 3 km per
// uur in een half uur niet), dus snelheid() kiest alleen een snelheid die dat wel doet. Zo ligt elk
// knikpunt op een lijn of precies halverwege.
const TOCHT = [
  {
    zin: (n) => `${n} maakt een fietstocht.`,
    titel: 'Fietstocht',
    wwv: 'fietste',
    y: { naam: 'afstand in km', van: 0, stap: 5, eenheid: 'km' },
    h: 2.5,
    v: [10, 15, 20],
  },
  {
    zin: (n) => `${n} maakt een wandeling.`,
    titel: 'Wandeling',
    wwv: 'liep',
    y: { naam: 'afstand in km', van: 0, stap: 2, eenheid: 'km' },
    h: 1,
    v: [3, 4, 5, 6],
  },
  {
    zin: (n) => `${n} maakt een tocht in een kano.`,
    titel: 'Kanotocht',
    wwv: 'voer',
    y: { naam: 'afstand in km', van: 0, stap: 2, eenheid: 'km' },
    h: 1,
    v: [4, 6, 8],
  },
];
// Een snelheid die in duur uur een veelvoud van h oplevert.
const snelheid = (S, duur, niet) => {
  const L = S.v.filter((s) => heel((s * duur) / S.h));
  return pick(L.filter((s) => s !== niet).length ? L.filter((s) => s !== niet) : L);
};
function rit(S, t0) {
  const r1 = pick([1, 1.5, 2]),
    p = pick([0.5, 1, 1.5]),
    r2 = pick([1, 1.5, 2]),
    s1 = snelheid(S, r1),
    s2 = snelheid(S, r2, s1),
    d1 = s1 * r1;
  return {
    P: [
      [t0, 0],
      [t0 + r1, d1],
      [t0 + r1 + p, d1],
      [t0 + r1 + p + r2, d1 + s2 * r2],
    ],
    p,
  };
}
const ritAs = (t0, eind) => ({
  naam: 'tijd in uren',
  van: t0,
  tot: Math.ceil(eind),
  stap: 0.5,
  eenheid: 'uur',
  getal: 2,
});
const halfuur = (t) =>
  heel(t) ? '' : `${tijd(t)} ligt precies halverwege ${tijd(t - 0.5)} en ${tijd(t + 0.5)}. `;
const duur = (u) => (u === 0.5 ? 'een half uur' : `${d(u)} uur`);

// Een afstand-tijdgrafiek van een tocht: hoe lang de pauze duurt, de afstand op een tijdstip of de
// snelheid op een recht stuk.
function s32tocht() {
  const { S, P, p, n, t0 } = until(
      () => {
        const S = pick(TOCHT),
          t0 = pick([9, 10, 13]);
        return { S, t0, n: pick(NAMEN), ...rit(S, t0) };
      },
      ({ S, P, t0 }) => P[3][0] - t0 <= 5 && P[3][1] / S.y.stap <= 12,
    ),
    eind = P[3][0],
    D = P[3][1],
    x = ritAs(t0, eind),
    y = { ...S.y, tot: (Math.floor(D / S.y.stap) + 1) * S.y.stap },
    fig = contextGraph({
      titel: S.titel,
      x,
      y,
      grafieken: [{ naam: n, punten: P }],
      zeg: 'vorm',
      u: 24,
    }),
    soort = pick(['pauze', 'afstand', 'snelheid']),
    intro = `${S.zin(n)} In de grafiek zie je hoeveel km ${n} na het vertrek heeft afgelegd.`;
  if (soort === 'pauze') {
    const inUren = p === 1 && coin(),
      a = P[1][0],
      b = P[2][0],
      goed = inUren ? p : p * 60,
      heleTocht = inUren ? eind - t0 : (eind - t0) * 60;
    return {
      q: T(`${intro} Onderweg houdt ${n} pauze. Hoe lang duurt de pauze?`),
      fig,
      fields: [F('De pauze duurt', goed, inUren ? 'uur' : 'minuten')],
      hint: T(
        'Tijdens een pauze verandert de afstand niet. Zoek het stuk waar de grafiek horizontaal loopt, en kijk wat één hokje op de horizontale as is.',
      ),
      steps: [
        'Tijdens de pauze verandert de afstand niet. Daar loopt de grafiek horizontaal.',
        hokje(x, 'horizontale'),
        `De grafiek loopt horizontaal van ${tijd(a)} tot ${tijd(b)}.`,
        inUren
          ? `Dus de pauze duurt 1 uur.`
          : `Dat is ${duur(p)}, dus de pauze duurt ${d(p * 60)} minuten.`,
      ],
      traps: [
        {
          id: 'hele-tocht',
          f: (v) => v[0] === heleTocht,
          m: 'Zo lang duurt de hele tocht. De pauze is alleen het stuk waar de grafiek horizontaal loopt.',
        },
        ...(inUren
          ? []
          : [
              {
                id: 'antwoord-in-uren',
                f: (v) => v[0] === p,
                m: 'Je antwoord is in uren, maar de vraag is in minuten. Een uur is 60 minuten.',
              },
            ]),
        ...(2 * p !== goed
          ? [
              {
                id: 'hokjes-geteld',
                f: (v) => v[0] === 2 * p,
                m: 'Je hebt de hokjes geteld. Eén hokje op de horizontale as is een half uur.',
              },
            ]
          : []),
      ],
      v: () => {
        const L = lees(fig).lijnen[0],
          k = L.findIndex((q, i) => i + 1 < L.length && near(q[1], L[i + 1][1], 0.01));
        return k >= 0 && near((L[k + 1][0] - L[k][0]) * (inUren ? 1 : 60), goed, 0.5);
      },
    };
  }
  if (soort === 'afstand') {
    const t = pick(uren(t0 + 0.5, eind, 0.5).filter((t) => heel(op(P, t) / S.h) && op(P, t) > 0)),
      w = op(P, t);
    return {
      q: T(`${intro} Hoeveel km heeft ${n} om ${tijd(t)} afgelegd?`),
      fig,
      fields: [F('', w, 'km')],
      hint: T(
        `Kijk eerst wat één hokje is op elke as. Ga dan op de horizontale as naar ${tijd(t)}, recht omhoog naar de grafiek en dan naar links.`,
      ),
      steps: [
        hokje(x, 'horizontale'),
        `${halfuur(t)}Ga op de horizontale as naar ${tijd(t)}, omhoog naar de grafiek en dan naar links: ${d(w)} km.`,
        `Dus om ${tijd(t)} heeft ${n} ${d(w)} km afgelegd.`,
      ],
      traps: afleesTraps(y, w, t, tijd(t)),
      v: () => {
        const R = lees(fig);
        return near(op(R.lijnen[0], t, R.tx), w, R.ty);
      },
    };
  }
  // De snelheid op een van de twee rechte stukken waarop gereden wordt.
  const [i, j] = coin() ? [0, 1] : [2, 3],
    [a, da] = P[i],
    [b, db] = P[j],
    dt = b - a,
    dd = db - da,
    s = dd / dt,
    rekenen =
      dt === 1
        ? [`In 1 uur gaat ${n} ${d(dd)} km, dus de snelheid is ${d(s)} km per uur.`]
        : dt === 2
          ? [
              `In 2 uur gaat ${n} ${d(dd)} km.`,
              `In een uur is dat ${d(dd)} : 2 = ${d(s)} km, dus de snelheid is ${d(s)} km per uur.`,
            ]
          : [
              `In 1,5 uur gaat ${n} ${d(dd)} km. Dat zijn drie halve uren.`,
              `In een half uur is dat ${d(dd)} : 3 = ${d(dd / 3)} km.`,
              `In een uur is dat 2 * ${d(dd / 3)} = ${d(s)} km, dus de snelheid is ${d(s)} km per uur.`,
            ],
    gemiddeld = D / (eind - t0);
  return {
    q: T(`${intro} Bereken de snelheid van ${n} tussen ${tijd(a)} en ${tijd(b)} in km per uur.`),
    fig,
    fields: [F('', s, 'km per uur')],
    hint: T(
      `Lees af hoeveel km ${n} tussen ${tijd(a)} en ${tijd(b)} aflegt, en hoe lang dat duurt. Reken dan uit hoeveel km dat in één uur is.`,
    ),
    steps: [
      `Van ${tijd(a)} tot ${tijd(b)} is ${duur(dt)}.`,
      da
        ? `De grafiek gaat in die tijd van ${d(da)} km naar ${d(db)} km. Dat is ${d(db)} - ${d(da)} = ${d(dd)} km.`
        : `De grafiek gaat in die tijd van 0 km naar ${d(db)} km. Dat is ${d(dd)} km.`,
      ...rekenen,
    ],
    traps: [
      ...(da && db / dt !== s
        ? [
            {
              id: 'afstand-vanaf-het-begin',
              f: (v) => v[0] === db / dt,
              m: `Je hebt de afstand vanaf het vertrek genomen. Bij ${tijd(a)} had ${n} al ${d(da)} km afgelegd. Neem alleen de km die er op dit stuk bij komen.`,
            },
          ]
        : []),
      ...(dt !== 1
        ? [
            {
              id: 'niet-gedeeld-door-de-tijd',
              f: (v) => v[0] === dd,
              m: `Zoveel km gaat ${n} in ${duur(dt)}. De snelheid is hoeveel km dat in één uur is.`,
            },
          ]
        : []),
      ...(!near(gemiddeld, s, 0.01)
        ? [
            {
              id: 'hele-tocht',
              f: (v) => near(v[0], gemiddeld, 0.01),
              m: `Je hebt met de hele tocht gerekend. De vraag gaat alleen over het stuk tussen ${tijd(a)} en ${tijd(b)}.`,
            },
          ]
        : []),
    ],
    v: () => {
      const R = lees(fig),
        L = R.lijnen[0],
        binnen = L.filter((q) => q[0] > a + R.tx && q[0] < b - R.tx);
      return !binnen.length && near((op(L, b, R.tx) - op(L, a, R.tx)) / dt, s, (2 * R.ty) / dt);
    },
  };
}

// Twee grafieken in één figuur: twee mensen op dezelfde route, of de temperatuur in twee plaatsen.
const PLAATSEN = ['Zwolle', 'Breda', 'Assen', 'Venlo', 'Hoorn', 'Delft'];
function s32tweeRit() {
  const { S, A, B, nA, nB, t0, kan } = until(
      () => {
        const S = pick(TOCHT.slice(0, 2)),
          t0 = pick([9, 10]),
          [nA, nB] = (() => {
            const a = pick(NAMEN);
            return [a, pick(NAMEN.filter((x) => x !== a))];
          })(),
          A = rit(S, t0).P,
          eind = A[3][0],
          st = t0 + pick([0.5, 1, 1.5]),
          sb = snelheid(S, eind - st),
          B = [
            [st, 0],
            [eind, sb * (eind - st)],
          ],
          top = Math.min(A[3][1], B[1][1]),
          kan = {
            eerst: uren(S.y.stap, Math.floor(top / S.y.stap) * S.y.stap, S.y.stap).filter((X) => {
              const [ta, tb] = [eerst(A, X), eerst(B, X)];
              return heel(2 * ta) && heel(2 * tb) && ta !== tb;
            }),
            inhalen: (() => {
              const z = snijpunten(A, B).filter((q) => q[0] > st);
              return z.length === 1 &&
                heel(z[0][0]) &&
                z[0][0] < eind &&
                heel(z[0][1] / S.h) &&
                B[1][1] > A[3][1]
                ? z
                : [];
            })(),
            verschil: uren(st + 0.5, eind, 0.5).filter((t) => {
              const [a, b] = [op(A, t), op(B, t)],
                dif = Math.abs(a - b);
              return heel(a / S.h) && heel(b / S.h) && dif > 0 && dif !== a && dif !== b;
            }),
          };
        return { S, A, B, nA, nB, t0, kan };
      },
      ({ S, A, B, t0, kan }) =>
        A[3][0] - t0 <= 5 &&
        Math.max(A[3][1], B[1][1]) / S.y.stap <= 12 &&
        Math.abs(A[3][1] - B[1][1]) >= S.y.stap &&
        Object.values(kan).some((l) => l.length),
    ),
    eind = A[3][0],
    x = ritAs(t0, eind),
    y = { ...S.y, tot: (Math.floor(Math.max(A[3][1], B[1][1]) / S.y.stap) + 1) * S.y.stap },
    fig = contextGraph({
      titel: S.titel,
      x,
      y,
      grafieken: [
        { naam: nA, punten: A },
        { naam: nB, punten: B },
      ],
      zeg: 'vorm',
      u: 24,
    }),
    soort = pick(Object.keys(kan).filter((s) => kan[s].length)),
    intro = `${nA} en ${nB} gaan dezelfde route. ${nA} vertrekt om ${tijd(t0)}, ${nB} om ${tijd(B[0][0])}. In de grafiek zie je hoeveel km ze na het vertrek hebben afgelegd.`;
  if (soort === 'eerst') {
    const X = pick(kan.eerst),
      [ta, tb] = [eerst(A, X), eerst(B, X)],
      [win, lose, tw, tl] = ta < tb ? [nA, nB, ta, tb] : [nB, nA, tb, ta],
      opts = [T(win), T(lose), T('Ze zijn er tegelijk')];
    return {
      q: T(`${intro} Wie is er het eerst bij ${X} km?`),
      fig,
      mc: MC(opts, 0),
      hint: T(
        `Ga op de verticale as naar ${X} km en dan naar rechts. Welke grafiek kom je het eerst tegen?`,
      ),
      steps: [
        `Ga op de verticale as naar ${X} km en dan naar rechts.`,
        `Eerst kom je bij de grafiek van ${win}, bij ${tijd(tw)}. De grafiek van ${lose} kom je pas tegen bij ${tijd(tl)}.`,
        `Dus ${win} is er het eerst.`,
      ],
      traps: [
        {
          id: win === nB ? 'eerst-vertrokken' : 'andere-grafiek',
          f: (v) => v[0] === opts[1],
          m:
            win === nB
              ? `${nA} vertrekt eerder, maar dat zegt nog niet wie het eerst bij ${X} km is. Ga op de verticale as naar ${X} km en dan naar rechts.`
              : `Ga op de verticale as naar ${X} km en dan naar rechts. De grafiek die je het eerst tegenkomt, hoort bij wie er het eerst is.`,
        },
        {
          id: 'tegelijk',
          f: (v) => v[0] === opts[2],
          m: `Ze zijn er niet tegelijk. Kijk bij ${X} km welke grafiek verder naar links ligt.`,
        },
      ],
      v: () => {
        const R = lees(fig),
          [la, lb] = R.lijnen.map((L) => eerst(L, X, R.ty));
        return (la < lb ? nA : nB) === win && Math.abs(la - lb) > 4 * R.tx;
      },
    };
  }
  if (soort === 'inhalen') {
    const [[t, w]] = kan.inhalen,
      hok = (t - t0) / 0.5;
    return {
      q: T(`${intro} ${nB} haalt ${nA} in. Hoe laat is dat?`),
      fig,
      fields: [F('om', t, 'uur')],
      hint: T(
        `Waar ${nB} ${nA} inhaalt, zijn ze op dezelfde plek. Daar snijden de grafieken elkaar.`,
      ),
      steps: [
        `${nB} haalt ${nA} in waar de grafieken elkaar snijden.`,
        `Ga vanaf het snijpunt recht omlaag naar de horizontale as: ${tijd(t)}.`,
        `Dus om ${tijd(t)} haalt ${nB} ${nA} in. Ze hebben dan allebei ${d(w)} km afgelegd.`,
      ],
      traps: [
        ...(w !== t
          ? [
              {
                id: 'afstand-in-plaats-van-tijd',
                f: (v) => v[0] === w,
                m: 'Dat is de afstand bij het snijpunt. De vraag is hoe laat het is: ga vanaf het snijpunt recht omlaag naar de horizontale as.',
              },
            ]
          : []),
        ...(hok !== t
          ? [
              {
                id: 'hokjes-geteld',
                f: (v) => v[0] === hok,
                m: 'Je hebt de hokjes geteld. Kijk welk getal er op de horizontale as staat. Eén hokje is een half uur.',
              },
            ]
          : []),
      ],
      v: () => {
        const R = lees(fig),
          z = snijpunten(R.lijnen[0], R.lijnen[1], R.ty).filter((q) => q[0] > B[0][0] + R.tx);
        return z.length === 1 && near(z[0][0], t, 2 * R.tx);
      },
    };
  }
  const t = pick(kan.verschil),
    [a, b] = [op(A, t), op(B, t)],
    dif = Math.abs(a - b);
  return {
    q: T(`${intro} Hoeveel km zit er om ${tijd(t)} tussen ${nA} en ${nB}?`),
    fig,
    fields: [F('', dif, 'km')],
    hint: T(
      `Lees bij ${tijd(t)} van allebei af hoeveel km ze hebben afgelegd. Het verschil is de afstand tussen hen.`,
    ),
    steps: [
      `${halfuur(t)}Ga op de horizontale as naar ${tijd(t)} en omhoog naar de grafieken.`,
      `Bij de grafiek van ${nA} ga je naar links: ${d(a)} km. Bij die van ${nB}: ${d(b)} km.`,
      `${d(Math.max(a, b))} - ${d(Math.min(a, b))} = ${d(dif)}`,
      `Dus om ${tijd(t)} zit er ${d(dif)} km tussen ${nA} en ${nB}.`,
    ],
    traps: [
      {
        id: 'waarde-in-plaats-van-verschil',
        f: (v) => v[0] === a || v[0] === b,
        m: 'Zoveel km heeft een van de twee afgelegd. De vraag is hoeveel km er tussen hen zit: trek de afstanden van elkaar af.',
      },
    ],
    v: () => {
      const R = lees(fig),
        [la, lb] = R.lijnen.map((L) => op(L, t, R.tx));
      return near(Math.abs(la - lb), dif, 2 * R.ty);
    },
  };
}
function s32tweeWarmte() {
  const S = MEET[0],
    { P, Q, y, pa, pb } = until(
      () => {
        const pa = pick(PLAATSEN),
          P = metingen(S),
          Q = metingen(S),
          ys = [...P, ...Q].map((p) => p[1]);
        return { P, Q, pa, pb: pick(PLAATSEN.filter((x) => x !== pa)), y: yAs(S, ys) };
      },
      ({ P, Q, y }) =>
        [...P, ...Q].every((p) => p[1] > 0) &&
        (y.tot - y.van) / y.stap <= 14 &&
        Math.abs(P[P.length - 1][1] - Q[Q.length - 1][1]) >= S.y.stap &&
        P.some((p, i) => p[1] !== Q[i][1]),
    ),
    fig = contextGraph({
      titel: 'Temperatuur in twee plaatsen',
      x: S.x,
      y,
      grafieken: [
        { naam: pa, punten: P, vorm: 'kromme', stippen: true },
        { naam: pb, punten: Q, vorm: 'kromme', stippen: true },
      ],
      zeg: 'vorm',
    }),
    intro = `Op een zomerdag is in ${pa} en in ${pb} elke twee uur de temperatuur gemeten.`,
    verschil = S.xs.filter((t, i) => {
      const dif = Math.abs(P[i][1] - Q[i][1]);
      return dif > 0 && dif !== P[i][1] && dif !== Q[i][1];
    }),
    warmst = S.xs.filter((t, i) => P[i][1] !== Q[i][1]),
    soort = verschil.length && coin() ? 'verschil' : 'warmst';
  if (soort === 'warmst') {
    const t = pick(warmst),
      i = S.xs.indexOf(t),
      [a, b] = [P[i][1], Q[i][1]],
      [warm, koud] = a > b ? [pa, pb] : [pb, pa],
      opts = [T(warm), T(koud), T('Het is in beide plaatsen even warm')];
    return {
      q: T(`${intro} Waar is het om ${tijd(t)} het warmst?`),
      fig,
      mc: MC(opts, 0),
      hint: T(
        `Ga op de horizontale as naar ${tijd(t)} en recht omhoog. Welke grafiek ligt daar het hoogst?`,
      ),
      steps: [
        `Ga op de horizontale as naar ${tijd(t)} en omhoog naar de grafieken.`,
        `Bij ${pa} is het ${d(a)} graden en bij ${pb} ${d(b)} graden.`,
        `Dus om ${tijd(t)} is het in ${warm} het warmst.`,
      ],
      traps: [
        {
          id: 'andere-grafiek',
          f: (v) => v[0] === opts[1],
          m: `Kijk goed welke grafiek bij welke plaats hoort. De naam staat aan het eind van elke grafiek.`,
        },
        {
          id: 'tegelijk',
          f: (v) => v[0] === opts[2],
          m: `De twee grafieken liggen om ${tijd(t)} niet even hoog. Kijk welke het hoogst ligt.`,
        },
      ],
      v: () => {
        const R = lees(fig),
          [la, lb] = R.lijnen.map((L) => op(L, t, R.tx));
        return (la > lb ? pa : pb) === warm && Math.abs(la - lb) > 2 * R.ty;
      },
    };
  }
  const t = pick(verschil),
    i = S.xs.indexOf(t),
    [a, b] = [P[i][1], Q[i][1]],
    dif = Math.abs(a - b);
  return {
    q: T(
      `${intro} Hoeveel graden is het om ${tijd(t)} in ${a > b ? pa : pb} warmer dan in ${a > b ? pb : pa}?`,
    ),
    fig,
    fields: [F('', dif, 'graden')],
    hint: T(`Lees bij ${tijd(t)} van allebei de temperatuur af en trek ze van elkaar af.`),
    steps: [
      `Ga op de horizontale as naar ${tijd(t)} en omhoog naar de grafieken.`,
      `Bij ${pa} is het ${d(a)} graden en bij ${pb} ${d(b)} graden.`,
      `${d(Math.max(a, b))} - ${d(Math.min(a, b))} = ${d(dif)}`,
      `Dus het is ${d(dif)} graden warmer.`,
    ],
    traps: [
      {
        id: 'waarde-in-plaats-van-verschil',
        f: (v) => v[0] === a || v[0] === b,
        m: 'Dat is de temperatuur in een van de twee plaatsen. De vraag is hoeveel graden het verschil is.',
      },
      ...(dif / y.stap !== dif
        ? [
            {
              id: 'hokjes-geteld',
              f: (v) => v[0] === dif / y.stap,
              m: `Je hebt de hokjes geteld. Eén hokje op de verticale as is ${d(y.stap)} graden, en niet 1.`,
            },
          ]
        : []),
    ],
    v: () => {
      const R = lees(fig),
        [la, lb] = R.lijnen.map((L) => op(L, t, R.tx));
      return near(Math.abs(la - lb), dif, 2 * R.ty);
    },
  };
}
const s32twee = () => (coin() || coin() ? s32tweeRit() : s32tweeWarmte());

// --- 227 Van tabel naar grafiek (#288) ---

// De meetverhalen met een vloeiende kromme. De luchtballon vliegt in rechte stukken, die hoort er niet bij.
const MEET_KROMME = MEET.filter((S) => !S.lijn);
// Handige stappen voor één hokje.
const NETJES = [1, 2, 5, 10, 20, 25, 50, 100];
// De tabel met de metingen: bovenaan de tijd, onderaan wat er gemeten is. Zonder T, want T zet de C van
// °C cursief.
const meetTabel = (S, P) =>
  `<div class="scroll" role="region" tabindex="0" aria-label="Tabel met de metingen"><table class="dt">${[
    [S.x.naam, ...P.map((p) => p[0])],
    [S.y.naam, ...P.map((p) => p[1])],
  ]
    .map(
      (r) =>
        `<tr><th>${esc(r[0])}</th>${r
          .slice(1)
          .map((c) => `<td>${d(c)}</td>`)
          .join('')}</tr>`,
    )
    .join('')}</table></div>`;
// De getallen uit rij i van een tabel, terug uit de HTML.
const tabelRij = (html, i) =>
  html
    .split('<tr>')
    [i + 1].split('<td>')
    .slice(1)
    .map((c) => +c.replace(/<[^>]+>/g, '').replace(',', '.'));
const gelijkeStappen = (L) => L.every((x, k) => k < 2 || near(x - L[k - 1], L[1] - L[0], 1e-9));

// Welke verdeling van de verticale as is handig: gelijke stappen, het grootste getal past, en de as is
// niet veel te lang.
function s32verdeling() {
  const { S, P, R, M, i } = until(
      () => {
        const g = meetVerhaal(MEET_KROMME),
          R = pick([6, 8, 10]),
          M = Math.max(...g.P.map((p) => p[1]));
        return { ...g, R, M, i: NETJES.findIndex((s) => R * s >= M) };
      },
      ({ P, R, M, i }) => {
        const L = [0, ...new Set(P.map((p) => p[1]))].sort((a, b) => a - b);
        return i >= 1 && i + 2 < NETJES.length && R * NETJES[i] <= 1.7 * M && !gelijkeStappen(L);
      },
    ),
    [kort, s, lang] = [NETJES[i - 1], NETJES[i], NETJES[i + 2]],
    as = (st) => Array.from({ length: R + 1 }, (_, k) => k * st),
    rij = (L) => T(L.map(d).join(', ')),
    goed = rij(as(s)),
    opts = [
      goed,
      rij([0, ...new Set(P.map((p) => p[1]))].sort((a, b) => a - b)),
      rij(as(kort)),
      rij(as(lang)),
    ],
    mc = MC(opts, 0),
    tab = meetTabel(S, P),
    e = S.y.eenheid;
  return {
    q:
      T(`${S.intro} De metingen staan in de tabel.`) +
      tab +
      T(
        `Je tekent de grafiek op roosterpapier. De verticale as begint bij 0, en er is ruimte voor ${R} hokjes. Welke verdeling van de verticale as is handig?`,
      ),
    mc,
    hint: T(
      'Op een as zijn de stappen altijd even groot. Kijk naar het grootste getal in de tabel: dat moet op de as passen, maar de as moet ook niet veel te lang worden.',
    ),
    steps: [
      `Het grootste getal in de tabel is ${d(M)}.`,
      `Met stappen van ${kort} kom je met ${R} hokjes tot ${R}*${kort} = ${R * kort}. Daar past ${d(M)} niet op.`,
      `Met stappen van ${s} kom je tot ${R}*${s} = ${R * s}. Daar past ${d(M)} wel op.`,
      `Met stappen van ${lang} kom je tot ${R * lang}. Dan gebruik je hoogstens de helft van de as, en is de grafiek slecht af te lezen.`,
      'De getallen uit de tabel zelf zijn geen goede verdeling, want de stappen ertussen zijn niet even groot.',
      `Dus de handige verdeling is ${as(s).map(d).join(', ')}: één hokje is ${s} ${e}.`,
    ],
    traps: [
      {
        id: 'ongelijke-stappen',
        f: (v) => v[0] === opts[1],
        m: 'Dat zijn de getallen uit de tabel. De stappen ertussen zijn niet even groot. Op een as is elk hokje evenveel waard.',
      },
      {
        id: 'as-te-kort',
        f: (v) => v[0] === opts[2],
        m: `Met deze verdeling kom je maar tot ${R * kort}. Het grootste getal uit de tabel, ${d(M)}, past er dan niet op.`,
      },
      {
        id: 'stap-te-groot',
        f: (v) => v[0] === opts[3],
        m: `Alles past erop, maar de as gaat tot ${R * lang}. De grafiek komt dan heel laag en is slecht af te lezen. Kies kleinere stappen.`,
      },
    ],
    // Leest het grootste getal terug uit de tabel en de getallen uit elke keuze. Alleen de goede keuze
    // heeft gelijke stappen vanaf 0, past het grootste getal erop en is minder dan twee keer zo lang.
    v: () => {
      const max = Math.max(...tabelRij(tab, 1)),
        getallen = (o) =>
          o
            .replace(/<[^>]+>/g, '')
            .split(', ')
            .map(Number),
        handig = (L) =>
          L[0] === 0 && L.length === R + 1 && gelijkeStappen(L) && L[R] >= max && L[R] < 2 * max;
      return mc.opts.every((o, k) => handig(getallen(o)) === (k === mc.a));
    },
  };
}

// De punten uit de tabel zetten in een assenstelsel met een titel en namen bij de assen. De site tekent
// er een vloeiende kromme door, want het zijn metingen.
function s32punten() {
  const { S, P, y } = meetVerhaal(MEET_KROMME),
    t = {
      soort: 'grafiekpunten',
      fig: { titel: S.titel, x: S.x, y, u: S.u || 26 },
      goed: P,
      snap: [S.x.stap, S.h],
      verbind: 'kromme',
    },
    G = SOORTEN.grafiekpunten,
    goed = G.schrijf(t, P),
    tab = meetTabel(S, P),
    is = (p, q) => near(p[0], q[0], 1e-9) && near(p[1], q[1], 1e-9),
    hoort = (p) => P.some((q) => is(p, q)),
    lees = (v) => G.lees(t, v[0]),
    // Een gezet punt dat niet hoort, maar wel dy naast een punt uit de tabel ligt.
    naast = (v, dy) =>
      lees(v).some(
        (p) =>
          !hoort(p) &&
          P.some((q) => near(q[0], p[0], 1e-9) && near(Math.abs(q[1] - p[1]), dy, 1e-9)),
      ),
    half = P.find((p) => !heel(p[1] / y.stap)),
    [x1, y1] = P[1];
  return {
    q:
      T(`${S.intro} De metingen staan in de tabel.`) +
      tab +
      T(
        'Zet de punten uit de tabel in de grafiek. Tik op een plek om er een punt te zetten, en nog een keer om het weg te halen. Door de punten komt vanzelf een vloeiende kromme.',
      ),
    fig: tekenFig(t),
    teken: t,
    fields: [{ teken: true, a: goed, label: 'Je punten' }],
    hint: T(
      'Kijk eerst wat één hokje is op elke as. Zet dan bij elke kolom van de tabel een punt: ga op de horizontale as naar de tijd en dan recht omhoog naar het getal uit de tabel.',
    ),
    steps: [
      hokje(S.x, 'horizontale'),
      hokje(y, 'verticale'),
      `Zet bij elke kolom van de tabel een punt. Bijvoorbeeld ${bij(S.k, x1)}: ga recht omhoog tot ${d(y1)} ${y.eenheid}.`,
      ...(half
        ? [
            `${d(half[1])} ${y.eenheid} ligt niet op een lijn, maar precies halverwege ${d(half[1] - S.h)} en ${d(half[1] + S.h)}.`,
          ]
        : []),
      'Het zijn metingen. Daarom verbind je de punten met een vloeiende kromme, en niet met rechte stukken.',
      H(tekenAf(t, goed, 'Met de punten uit de tabel en de kromme erdoor.')),
    ],
    traps: [
      {
        id: 'punt-vergeten',
        f: (v) => {
          const L = lees(v);
          return L.length < P.length && L.every(hoort);
        },
        m: `Je hebt niet alle punten gezet. In de tabel staan ${P.length} metingen, dus er horen ${P.length} punten in de grafiek.`,
      },
      {
        id: 'half-hokje-ernaast',
        f: (v) => naast(v, S.h),
        m: `Een punt staat een half hokje te hoog of te laag. Eén hokje is ${d(y.stap)} ${y.eenheid}. Een getal dat niet op een lijn valt, ligt precies halverwege twee lijnen.`,
      },
      {
        id: 'hokje-ernaast',
        f: (v) => naast(v, y.stap),
        m: `Een punt staat een hokje te hoog of te laag. Eén hokje op de verticale as is ${d(y.stap)} ${y.eenheid}. Tel vanaf een getal bij de as.`,
      },
    ],
    // Leest de getallen terug uit de tabel in de vraag. Elk punt uit de tabel ligt in het rooster van de
    // tekenvraag, en het goede antwoord zijn precies die punten.
    v: () => {
      const xs = tabelRij(tab, 0),
        ys = tabelRij(tab, 1),
        gezet = G.lees(t, goed);
      return (
        xs.length === ys.length &&
        gezet.length === xs.length &&
        xs.every((x, k) => gezet.some((p) => is(p, [x, ys[k]]))) &&
        y.van <= Math.min(...ys) &&
        y.tot >= Math.max(...ys)
      );
    },
  };
}
const s32tabel = () => (coin() ? s32verdeling() : s32punten());

// --- 228 Stijgend, dalend of constant (#288) ---

// De punten van de eerste grafiek in een figuur, in pixels, met y omhoog. Zo rekent v met wat er
// getekend staat.
function pixels(svg) {
  const n = svg
      .match(/<path class="l\d" d="([^"]+)"/)[1]
      .match(/-?[\d.]+/g)
      .map(Number),
    P = [];
  for (let i = 0; i + 1 < n.length; i += 2) P.push([n[i], -n[i + 1]]);
  return P;
}
const richtingen = (P) =>
  P.slice(1).map((p, k) => (Math.abs(p[1] - P[k][1]) < 0.5 ? 0 : Math.sign(p[1] - P[k][1])));
// De hoogte van de horizontale as in pixels, met y omhoog.
const asHoogte = (svg) => -svg.match(/<path class="ax" d="M[\d.]+ [\d.]+V([\d.]+)/)[1];
const LETTERS = ['a', 'b', 'c', 'd'];
const WOORD = { 1: 'stijgend', '-1': 'dalend', 0: 'constant' };
const GAAT = { 1: 'gaat omhoog', '-1': 'gaat omlaag', 0: 'loopt horizontaal' };

const GLOBAAL = [
  {
    y: 'temperatuur',
    intro: () =>
      'In de globale grafiek zie je hoe de temperatuur in een klaslokaal verandert op een schooldag.',
    doet: (n, r) =>
      r > 0 ? 'wordt het warmer' : r < 0 ? 'wordt het kouder' : 'blijft de temperatuur gelijk',
    snelst: (r) => `In welk stuk wordt het het snelst ${r > 0 ? 'warmer' : 'kouder'}?`,
  },
  {
    y: 'waterhoogte',
    intro: (n) => `In de globale grafiek zie je hoe hoog het water in het bad van ${n} staat.`,
    doet: (n, r) =>
      r > 0 ? 'stijgt het water' : r < 0 ? 'daalt het water' : 'blijft het water even hoog',
    snelst: (r) => `In welk stuk ${r > 0 ? 'stijgt' : 'daalt'} het water het snelst?`,
  },
  {
    y: 'snelheid',
    fiets: true,
    intro: (n) => `${n} maakt een fietstocht. In de globale grafiek zie je de snelheid van ${n}.`,
    doet: (n, r, nul) =>
      r > 0
        ? `gaat ${n} steeds harder`
        : r < 0
          ? `gaat ${n} steeds langzamer`
          : nul
            ? `staat ${n} stil`
            : `fietst ${n} steeds even hard`,
  },
];

// Een globale grafiek met k stukken die steeds een andere kant op gaan, op hoogte 0 tot en met 7. Alleen bij
// een fietser komt hij op 0, want daar betekent dat stilstaan; anders ligt hij boven de horizontale as.
// soort zegt wat de vraag nodig heeft: 'stuk' (alle drie de richtingen), 'steil' (twee stukken die
// dezelfde kant op gaan, waarvan één duidelijk steiler) of 'doet' (een stuk j bij een fietser, dat
// met nul op 0 ligt).
function globaal(G, soort) {
  return until(
    () => {
      const k = pick([3, 4]),
        r = Array.from({ length: k }, () => pick([1, -1, 0])),
        w = r.map(() => ri(2, 3)),
        h = r.map((x) => (x ? x * ri(1, 4) : 0)),
        P = [[0, 0]];
      r.forEach((x, j) => P.push([P[j][0] + w[j], P[j][1] + h[j]]));
      // Bij 'doet' gaat de vraag meestal over een horizontaal stuk: daar zit de fout.
      const vlak = r.map((x, i) => i).filter((i) => r[i] === 0),
        j = soort === 'doet' && vlak.length && coin() ? pick(vlak) : ri(0, k - 1),
        nul = soort === 'doet' && r[j] === 0 && coin(),
        lo = Math.min(...P.map((p) => p[1])),
        op = nul ? -P[j][1] : ri(G.fiets ? 0 : 1, 2) - lo;
      return { r, j, nul, td: coin() ? 1 : -1, P: P.map(([x, y]) => [x, y + op]) };
    },
    ({ r, j, nul, td, P }) => {
      const ys = P.map((p) => p[1]),
        st = r.map((x, k) =>
          x === td ? Math.abs(P[k + 1][1] - P[k][1]) / (P[k + 1][0] - P[k][0]) : 0,
        ),
        [s1, s2] = [...st].sort((a, b) => b - a);
      return (
        Math.min(...ys) >= 0 &&
        Math.max(...ys) <= 7 &&
        r.every((x, k) => !k || x !== r[k - 1]) &&
        new Set(r).size === 3 &&
        (soort !== 'steil' || (s2 > 0 && s1 >= 1.5 * s2)) &&
        // Bij een fietser ligt een horizontaal stuk op 0 (stilstaan) of duidelijk erboven.
        (!G.fiets || r.every((x, k) => x !== 0 || P[k][1] === 0 || P[k][1] >= 2)) &&
        (soort !== 'doet' || nul || r[j] !== 0 || P[j][1] >= 2)
      );
    },
  );
}
const schetsFig = (G, P) =>
  contextGraph({
    schets: true,
    x: { naam: 'tijd', van: 0, tot: P[P.length - 1][0], stap: 1 },
    y: { naam: G.y, van: 0, tot: Math.max(...P.map((p) => p[1])) + 1, stap: 1 },
    grafieken: [{ punten: P, stukken: LETTERS.slice(0, P.length - 1) }],
    zeg: 'assen',
    u: 20,
  });

function s32globaal() {
  const G = pick(GLOBAAL),
    soort = pick(G.fiets ? ['stuk', 'doet'] : ['stuk', 'steil']),
    { r, j, nul, td, P } = globaal(G, soort),
    n = pick(NAMEN),
    fig = schetsFig(G, P),
    L = LETTERS.slice(0, r.length),
    // Ligt stuk k op de horizontale as? Alleen bij een fietser zegt dat iets: dan staat hij stil.
    opNul = (k) => G.fiets && r[k] === 0 && P[k][1] === 0,
    zin = (k) =>
      `Stuk ${L[k]} ${GAAT[r[k]]}, dus stuk ${L[k]} is ${WOORD[r[k]]}. Daar ${G.doet(n, r[k], opNul(k))}.`,
    letters = () => [...fig.matchAll(/<text class="ti"[^>]*>([^<]+)<\/text>/g)].map((m) => m[1]);
  if (soort === 'stuk') {
    return {
      q: T(`${G.intro(n)} Is elk stuk van de grafiek stijgend, dalend of constant?`),
      fig,
      fields: L.map((s, k) => ({
        sel: ['stijgend', 'dalend', 'constant'],
        a: WOORD[r[k]],
        pre: `Stuk ${s} is`,
        label: `Is stuk ${s} stijgend, dalend of constant?`,
        br: true,
      })),
      hint: T(
        'Lees de grafiek van links naar rechts. Gaat hij omhoog, dan is hij stijgend. Gaat hij omlaag, dan is hij dalend. Loopt hij horizontaal, dan is hij constant.',
      ),
      steps: L.map((s, k) => zin(k)),
      traps: [
        {
          id: 'stijgend-en-dalend-verwisseld',
          f: (v) => v.some((x, k) => x === WOORD[-r[k]] && r[k] !== 0),
          m: 'Lees een grafiek altijd van links naar rechts. Gaat hij dan omhoog, dan is hij stijgend. Gaat hij omlaag, dan is hij dalend.',
        },
        {
          id: 'constant-verwisseld',
          f: (v) => v.some((x, k) => x && x !== WOORD[r[k]] && (x === 'constant' || r[k] === 0)),
          m: 'Constant betekent dat de grafiek horizontaal loopt: daar verandert niets. Loopt een stuk schuin, dan is het stijgend of dalend.',
        },
      ],
      // Leest de richting van elk stuk terug uit de getekende lijn, en de letters bij de stukken.
      v: () =>
        richtingen(pixels(fig)).every((x, k) => WOORD[x] === WOORD[r[k]]) &&
        letters().join('') === L.join(''),
    };
  }
  if (soort === 'steil') {
    const st = r.map((x, k) =>
        x === td ? Math.abs(P[k + 1][1] - P[k][1]) / (P[k + 1][0] - P[k][0]) : 0,
      ),
      a = st.indexOf(Math.max(...st)),
      zelfde = L.filter((s, k) => r[k] === td),
      opts = L.map((s) => T(`stuk ${s}`)),
      wat = td > 0 ? 'stijgen' : 'dalen';
    return {
      q: T(`${G.intro(n)} ${G.snelst(td)}`),
      fig,
      mc: MC(opts, a),
      hint: T(`Zoek eerst de stukken die ${wat}. Hoe steiler de grafiek, hoe sneller het gaat.`),
      steps: [
        `De stukken ${zelfde.join(' en ')} ${wat}.`,
        `Stuk ${L[a]} is het steilst.`,
        `Hoe steiler, hoe sneller. ${G.snelst(td).replace('welk stuk', `stuk ${L[a]}`).replace('?', '.')}`,
      ],
      traps: [
        {
          id: 'snel-en-langzaam-verwisseld',
          f: (v) => L.some((s, k) => k !== a && r[k] === td && v[0] === opts[k]),
          m: `Dat stuk ${td > 0 ? 'stijgt' : 'daalt'} ook, maar minder steil. Hoe steiler de grafiek, hoe sneller het gaat.`,
        },
        {
          id: 'stijgend-en-dalend-verwisseld',
          f: (v) => L.some((s, k) => r[k] === -td && v[0] === opts[k]),
          m: `Dat stuk ${td > 0 ? 'daalt' : 'stijgt'}. Lees de grafiek van links naar rechts, en zoek een stuk dat ${td > 0 ? 'omhoog' : 'omlaag'} gaat.`,
        },
        {
          id: 'constant-verwisseld',
          f: (v) => L.some((s, k) => r[k] === 0 && v[0] === opts[k]),
          m: 'Dat stuk loopt horizontaal: daar verandert niets.',
        },
      ],
      // Rekent de helling van elk stuk uit met de pixels van de getekende lijn.
      v: () => {
        const R = pixels(fig),
          h = R.slice(1).map((p, k) => (td * (p[1] - R[k][1])) / (p[0] - R[k][0])),
          [h1, h2] = [...h].sort((x, y) => y - x);
        return h.indexOf(h1) === a && h1 >= 1.5 * h2 && letters()[a] === L[a];
      },
    };
  }
  // Wat doet de fietser in stuk j? Bij een snelheidsgrafiek is horizontaal steeds even hard, en op 0
  // stilstaan.
  const s = L[j],
    opts = [
      `${n} gaat steeds harder fietsen.`,
      `${n} gaat steeds langzamer fietsen.`,
      `${n} fietst steeds even hard.`,
      `${n} staat stil.`,
    ].map((x) => T(x)),
    a = r[j] > 0 ? 0 : r[j] < 0 ? 1 : nul ? 3 : 2;
  return {
    q: T(`${G.intro(n)} Wat doet ${n} in stuk ${s}?`),
    fig,
    mc: MC(opts, a),
    hint: T(
      'Dit is een snelheidsgrafiek. Stijgt hij, dan gaat de snelheid omhoog. Loopt hij horizontaal, dan blijft de snelheid gelijk. Ligt hij op de horizontale as, dan is de snelheid 0.',
    ),
    steps: [
      `Op de verticale as staat de snelheid.`,
      nul
        ? `Stuk ${s} ligt op de horizontale as. Daar is de snelheid 0.`
        : `Stuk ${s} ${GAAT[r[j]]}, dus de snelheid is daar ${WOORD[r[j]]}.`,
      `Dus in stuk ${s} ${G.doet(n, r[j], nul)}.`,
    ],
    traps:
      r[j] === 0
        ? [
            nul
              ? {
                  id: 'stilstaan-niet-gezien',
                  f: (v) => v[0] === opts[2],
                  m: `Stuk ${s} ligt op de horizontale as: de snelheid is 0. Dan staat ${n} stil.`,
                }
              : {
                  id: 'constant-is-stilstaan',
                  f: (v) => v[0] === opts[3],
                  m: `Dit is een snelheidsgrafiek. Loopt hij horizontaal, dan verandert de snelheid niet: ${n} fietst steeds even hard. ${n} staat pas stil als de snelheid 0 is. Dan ligt de grafiek op de horizontale as.`,
                },
            {
              id: 'constant-verwisseld',
              f: (v) => v[0] === opts[0] || v[0] === opts[1],
              m: `Stuk ${s} loopt horizontaal: de snelheid verandert daar niet.`,
            },
          ]
        : [
            {
              id: 'stijgend-en-dalend-verwisseld',
              f: (v) => v[0] === opts[1 - a],
              m: `Lees de grafiek van links naar rechts. Stuk ${s} ${GAAT[r[j]]}: de snelheid wordt ${r[j] > 0 ? 'groter' : 'kleiner'}.`,
            },
            {
              id: 'niet-constant',
              f: (v) => v[0] === opts[2] || v[0] === opts[3],
              m: `Stuk ${s} loopt niet horizontaal: de snelheid verandert daar.`,
            },
          ],
    // Leest uit de pixels of het stuk stijgt, daalt of horizontaal loopt, en of het op de horizontale as
    // ligt.
    v: () => {
      const R = pixels(fig),
        x = richtingen(R)[j],
        op = near(R[j][1], asHoogte(fig), 0.5) && near(R[j + 1][1], asHoogte(fig), 0.5),
        b = x > 0 ? 0 : x < 0 ? 1 : op ? 3 : 2;
      return b === a && letters()[j] === s;
    },
  };
}

// --- 229 Welke globale grafiek past bij het verhaal? (#288) ---

// Een verhaal met de goede globale grafiek en foute grafieken. Een grafiek is [beginhoogte, [breedte,
// hoogte], ...], met breedtes a, b, c, e en een hoogte H die per vraag verschillen. rich is de richting
// van elk stuk van het verhaal (1 stijgt, -1 daalt, 0 horizontaal) en nul zijn de stukken op 0, met de
// hand opgeschreven, zodat v de getekende grafiek daarmee kan vergelijken. Elke foute grafiek is een
// echte fout, met een andere vorm dan de goede, zodat ook de beschrijving voor een schermlezer anders is.
// Bij een foute grafiek staat welke stap van de uitwerking de fout uitlegt.
const FOUT = {
  'volgorde-omgedraaid':
    'In deze grafiek staan de stukken in een andere volgorde dan in het verhaal. Lees de grafiek van links naar rechts.',
  'pauze-vergeten': 'In deze grafiek ontbreekt een stuk van het verhaal.',
  'stilstaan-als-dalen': 'In deze grafiek daalt een stuk dat horizontaal moet lopen.',
  'stijgend-en-dalend-verwisseld': 'In deze grafiek stijgt een stuk dat moet dalen.',
  'afstand-en-snelheid-verwisseld': (V) =>
    V.fiets
      ? 'Zo ziet een afstand-tijdgrafiek eruit. Hier staat de snelheid op de verticale as.'
      : 'Deze grafiek komt op 0 bij stilstaan. Zo ziet een snelheidsgrafiek eruit.',
};
const VERHALEN = [
  {
    y: 'afstand tot huis',
    zin: (n) =>
      `${n} fietst naar opa en oma. Daar blijft ${n} een tijdje. Daarna fietst ${n} terug naar huis.`,
    rich: [1, 0, -1],
    stappen: (n) => [
      `Eerst fietst ${n} van huis weg. De afstand tot huis wordt groter, dus de grafiek stijgt.`,
      'Bij opa en oma verandert de afstand tot huis niet. De grafiek loopt horizontaal.',
      'Op de terugweg wordt de afstand tot huis kleiner. De grafiek daalt tot 0.',
    ],
    goed: ({ a, b, c, H }) => [0, [a, H], [b, H], [c, 0]],
    fout: [
      ['volgorde-omgedraaid', ({ a, b, c, H }) => [H, [c, 0], [b, 0], [a, H]], 0],
      ['pauze-vergeten', ({ a, c, H }) => [0, [a, H], [c, 0]], 1],
      [
        'afstand-en-snelheid-verwisseld',
        ({ a, b, c, H }) => [H - 1, [a, H - 1], [1, 0], [b, 0], [1, H - 1], [c, H - 1]],
        1,
      ],
    ],
  },
  {
    y: 'afgelegde afstand',
    zin: (n) => `${n} fietst naar het bos. Daar gaat ${n} op een bankje zitten om uit te rusten.`,
    rich: [1, 0],
    stappen: (n) => [
      `Eerst fietst ${n}. De afgelegde afstand wordt groter, dus de grafiek stijgt.`,
      `Als ${n} uitrust, verandert de afgelegde afstand niet. De grafiek loopt horizontaal.`,
    ],
    goed: ({ a, b, H }) => [0, [a, H], [b, H]],
    fout: [
      ['volgorde-omgedraaid', ({ a, b, H }) => [0, [b, 0], [a, H]], 0],
      ['pauze-vergeten', ({ a, b, H }) => [0, [a + b, H]], 1],
      ['afstand-en-snelheid-verwisseld', ({ a, b, H }) => [H - 1, [a, H - 1], [1, 0], [b, 0]], 1],
      ['stilstaan-als-dalen', ({ a, b, H }) => [0, [a, H], [b, 1]], 1],
    ],
  },
  {
    y: 'snelheid',
    fiets: true,
    zin: (n) =>
      `${n} fietst weg en gaat steeds harder. Dan fietst ${n} een tijd even hard. Bij een stoplicht remt ${n} af en wacht tot het groen wordt.`,
    rich: [1, 0, -1, 0],
    nul: [3],
    stappen: (n) => [
      `Eerst gaat ${n} steeds harder. De snelheid wordt groter, dus de grafiek stijgt.`,
      `Dan fietst ${n} even hard. De snelheid verandert niet, dus de grafiek loopt horizontaal.`,
      'Bij het remmen wordt de snelheid kleiner. De grafiek daalt tot 0.',
      `Tijdens het wachten staat ${n} stil. De snelheid is 0, dus de grafiek ligt een stuk op de horizontale as.`,
    ],
    goed: ({ a, b, c, e, H }) => [0, [a, H], [b, H], [c, 0], [e, 0]],
    fout: [
      [
        'afstand-en-snelheid-verwisseld',
        ({ a, b, c, e, H }) => [0, [a, 1], [b, H - 1], [c, H], [e, H]],
        3,
      ],
      ['pauze-vergeten', ({ a, b, c, e, H }) => [0, [a, H], [b, H], [c + e, 0]], 3],
      ['volgorde-omgedraaid', ({ a, b, c, e, H }) => [0, [e, 0], [c, H], [b, H], [a, 0]], 0],
    ],
  },
  {
    y: 'snelheid',
    fiets: true,
    zin: (n) =>
      `${n} wacht met de fiets bij een stoplicht. Als het groen wordt, gaat ${n} steeds harder fietsen. Daarna fietst ${n} een heel stuk even hard.`,
    rich: [0, 1, 0],
    nul: [0],
    stappen: (n) => [
      `Bij het stoplicht staat ${n} stil. De snelheid is 0, dus de grafiek ligt eerst op de horizontale as.`,
      `Daarna gaat ${n} steeds harder. De snelheid wordt groter, dus de grafiek stijgt.`,
      `Dan fietst ${n} even hard. De snelheid verandert niet, dus de grafiek loopt horizontaal.`,
    ],
    goed: ({ a, b, c, H }) => [0, [a, 0], [b, H], [c + 1, H]],
    fout: [
      ['afstand-en-snelheid-verwisseld', ({ a, b, c, H }) => [0, [a, 0], [b, 1], [c + 1, H]], 2],
      ['volgorde-omgedraaid', ({ a, b, c, H }) => [H, [c + 1, H], [b, 0], [a, 0]], 0],
      ['pauze-vergeten', ({ a, b, c, H }) => [0, [b, H], [a + c + 1, H]], 0],
    ],
  },
  {
    y: 'waterhoogte',
    zin: (n) =>
      `Het regent een tijd hard, en de regenton in de tuin van ${n} loopt vol. Dan stopt het met regenen. Later haalt ${n} water uit de ton voor de planten.`,
    rich: [1, 0, -1],
    stappen: (n) => [
      'Als het regent, komt er water in de ton. De waterhoogte wordt groter, dus de grafiek stijgt.',
      'Als het niet meer regent, verandert de waterhoogte niet. De grafiek loopt horizontaal.',
      `Als ${n} water uit de ton haalt, wordt de waterhoogte kleiner. De grafiek daalt.`,
    ],
    goed: ({ a, b, c, H }) => [1, [a, H], [b, H], [c, 2]],
    fout: [
      ['volgorde-omgedraaid', ({ a, b, c, H }) => [H, [c, 1], [b, 1], [a, H]], 0],
      ['pauze-vergeten', ({ a, c, H }) => [1, [a, H], [c, 2]], 1],
      ['stijgend-en-dalend-verwisseld', ({ a, b, c, H }) => [1, [a, H - 2], [b, H - 2], [c, H]], 2],
    ],
  },
];
// De punten van een grafiek [beginhoogte, [breedte, hoogte], ...], zo uitgerekt dat hij 10 breed is.
function verhaalPunten([y0, ...stukken]) {
  const P = [[0, y0]];
  stukken.forEach(([w, y], k) => P.push([P[k][0] + w, y]));
  const f = 10 / P[P.length - 1][0];
  return P.map(([x, y]) => [x * f, y]);
}
const samen = (r) => r.filter((x, k) => !k || x !== r[k - 1]).join(' ');

function s32verhaal() {
  const V = pick(VERHALEN),
    n = pick(NAMEN),
    m = { a: ri(2, 3), b: ri(2, 3), c: ri(2, 3), e: ri(2, 3), H: ri(4, 5) },
    fout = (() => {
      if (V.fout.length <= 3) return V.fout;
      const weg = ri(0, V.fout.length - 1);
      return V.fout.filter((_, k) => k !== weg);
    })(),
    schets = (g) =>
      contextGraph({
        schets: true,
        x: { naam: 'tijd', van: 0, tot: 10, stap: 1 },
        y: { naam: V.y, van: 0, tot: 6, stap: 1 },
        grafieken: [{ punten: verhaalPunten(g(m)) }],
        zeg: 'vorm',
        u: 14,
        label: 'Schets',
      }),
    opts = [schets(V.goed), ...fout.map(([, g]) => schets(g))],
    mc = MC(opts, 0),
    uit = V.stappen(n);
  return {
    q: T(
      `${V.zin(n)} Welke globale grafiek past bij dit verhaal? In elke grafiek staat de tijd op de horizontale as en de ${V.y} op de verticale as.`,
    ),
    mc,
    hint: T(
      `Ga het verhaal stap voor stap langs. Wordt de ${V.y} groter, kleiner of blijft hij gelijk? Groter is stijgend, kleiner is dalend en gelijk is horizontaal.${V.fiets ? ' Let op: staat iemand stil, dan is de snelheid 0.' : ''}`,
    ),
    steps: [...uit, H(figbox(opts[0]))],
    traps: fout.map(([id, , stap], k) => ({
      id,
      f: (v) => v[0] === opts[k + 1],
      m: `${typeof FOUT[id] === 'function' ? FOUT[id](V) : FOUT[id]} ${uit[stap]}`,
    })),
    // Leest de richting van elk stuk terug uit de pixels van de getekende grafieken. De goede grafiek
    // gaat stuk voor stuk zoals het verhaal, met de stukken op 0 op de horizontale as. Alle grafieken
    // hebben een andere vorm.
    v: () => {
      const goed = mc.opts[mc.a],
        R = pixels(goed),
        r = richtingen(R),
        y0 = asHoogte(goed),
        opAs = (k) => near(R[k][1], y0, 0.5) && near(R[k + 1][1], y0, 0.5);
      return (
        r.join(' ') === V.rich.join(' ') &&
        r.every((x, k) => x !== 0 || !V.fiets || opAs(k) === (V.nul || []).includes(k)) &&
        new Set(mc.opts.map((o) => samen(richtingen(pixels(o))))).size === mc.opts.length
      );
    },
  };
}

// De figuren in de uitleg.
const UITLEG_WARMTE = contextGraph({
  titel: 'Temperatuur in een kas',
  x: { naam: 'tijd in uren', van: 6, tot: 18, stap: 2, eenheid: 'uur' },
  y: { naam: 'temperatuur in °C', van: 10, tot: 30, stap: 2, eenheid: 'graden' },
  grafieken: [
    {
      vorm: 'kromme',
      stippen: true,
      punten: [
        [6, 13],
        [8, 16],
        [10, 22],
        [12, 26],
        [14, 27],
        [16, 24],
        [18, 18],
      ],
    },
  ],
  zeg: 'punten',
});
const UITLEG_RIT = contextGraph({
  titel: 'Fietstocht',
  x: { naam: 'tijd in uren', van: 10, tot: 14, stap: 0.5, eenheid: 'uur', getal: 2 },
  y: { naam: 'afstand in km', van: 0, tot: 45, stap: 5, eenheid: 'km' },
  grafieken: [
    {
      naam: 'Lotte',
      punten: [
        [10, 0],
        [11, 15],
        [11.5, 15],
        [13.5, 40],
      ],
    },
  ],
  zeg: 'punten',
});
const UITLEG_SCHETS = contextGraph({
  schets: true,
  x: { naam: 'tijd', van: 0, tot: 10, stap: 1 },
  y: { naam: 'temperatuur', van: 0, tot: 7, stap: 1 },
  grafieken: [
    {
      punten: [
        [0, 2],
        [3, 5],
        [5, 5],
        [6, 2],
        [10, 4],
      ],
      stukken: ['a', 'b', 'c', 'd'],
    },
  ],
  zeg: 'vorm',
  u: 20,
});

export default {
  slug: 'grafieken-lezen-en-tekenen',
  title: 'Grafieken lezen en tekenen',
  intro:
    'Een grafiek laat zien hoe iets verandert, zoals de temperatuur op een dag of de afstand tijdens een fietstocht. Hier leer je een grafiek aflezen en tekenen, reken je met een afstand-tijdgrafiek de snelheid uit en kies je een globale grafiek bij een verhaal.',
  description:
    'Grafieken lezen en tekenen oefenen: aflezen, afstand-tijdgrafiek, snelheid, van tabel naar grafiek en globale grafieken bij een verhaal. Gratis met uitleg.',
  videos: {},
  skills: [
    [223, 'Aflezen bij een tijdstip', s32aflezen],
    [224, 'Tijdstip, hoogste waarde of toename', s32tijdstip],
    [225, 'Afstand-tijdgrafiek', s32tocht],
    [226, 'Twee grafieken', s32twee],
    [227, 'Van tabel naar grafiek', s32tabel],
    [228, 'Stijgend, dalend of constant', s32globaal],
    [229, 'Globale grafiek bij een verhaal', s32verhaal],
  ],
  learn: [
    {
      t: 'Een grafiek aflezen',
      p: [
        T(
          'Bij een grafiek over een verhaal heeft elke as een naam met een eenheid, zoals "tijd in uren" of "afstand in km". De tijd staat meestal op de horizontale as.',
        ),
        T(
          'Om af te lezen ga je op de horizontale as naar het tijdstip, recht omhoog naar de grafiek en dan naar links naar de verticale as. Wil je weten wanneer iets een bepaalde waarde heeft, dan ga je andersom: van de verticale as naar rechts, en dan omlaag.',
        ),
        T(
          'Zijn de punten gemeten, zoals een temperatuur, dan teken je er een vloeiende kromme door en geen rechte stukken.',
        ),
      ],
      ex: {
        q: T('Hoe warm is het om 10 uur in de kas?') + figbox(UITLEG_WARMTE),
        steps: [
          'Eén hokje op de verticale as is 2 graden.',
          'Ga op de horizontale as naar 10 uur, omhoog naar de grafiek en dan naar links: 22 graden.',
          'Om 10 uur is het 22 graden.',
        ],
      },
    },
    {
      t: 'De schaal van een as',
      p: [
        T(
          'Eén hokje is niet altijd 1. Kijk eerst bij de getallen langs de as wat één hokje is, de {{schaal|schaal}}. Op de as van de kas gaat de tijd per hokje 2 uur verder.',
        ),
        T(
          'Een as hoeft niet bij 0 te beginnen. Begint de verticale as bij een ander getal, dan staat er een {{=scheurlijn|scheurlijn}} onderaan, een zigzag in de as.',
        ),
      ],
      watch: T(
        'Tel niet alleen de hokjes. Bij de kas is 6 hokjes boven de 10 geen 16 graden, maar 10 + 6 * 2 = 22 graden.',
      ),
    },
    {
      t: 'De hoogste waarde en de toename',
      p: [
        T(
          'De hoogste waarde vind je bij het hoogste punt van de grafiek. Lees links af hoe hoog het is, en onder wanneer het is.',
        ),
        T(
          'Hoeveel iets stijgt of daalt tussen twee tijdstippen, lees je af bij allebei de tijdstippen. Daarna trek je de twee getallen van elkaar af.',
        ),
      ],
      ex: {
        q: T('Hoeveel graden wordt het in de kas warmer tussen 8 uur en 12 uur?'),
        steps: [
          'Om 8 uur is het 16 graden.',
          'Om 12 uur is het 26 graden.',
          '26 - 16 = 10',
          'Tussen 8 uur en 12 uur wordt het 10 graden warmer.',
        ],
      },
    },
    {
      t: 'Een afstand-tijdgrafiek',
      p: [
        T(
          'Een {{=afstand-tijdgrafiek|afstand-tijdgrafiek}} laat zien hoeveel km iemand na het vertrek heeft afgelegd. Loopt de grafiek horizontaal, dan verandert de afstand niet: dan houdt iemand pauze.',
        ),
        T('Hoe steiler de grafiek, hoe sneller iemand gaat.'),
      ],
      ex: {
        q: T('Hoe lang houdt Lotte pauze?') + figbox(UITLEG_RIT),
        steps: [
          'Eén hokje op de horizontale as is een half uur.',
          'De grafiek loopt horizontaal van 11 uur tot 11.30 uur.',
          'Dat is een half uur, dus de pauze duurt 30 minuten.',
        ],
      },
    },
    {
      t: 'Snelheid',
      p: [
        T(
          'De snelheid in km per uur is hoeveel km iemand in één uur aflegt. Op een recht stuk van de grafiek is de snelheid steeds hetzelfde. Je rekent: afstand : tijd in uren.',
        ),
      ],
      ex: {
        q: T('Bereken de snelheid van Lotte tussen 11.30 uur en 13.30 uur in km per uur.'),
        steps: [
          'Van 11.30 uur tot 13.30 uur is 2 uur.',
          'De grafiek gaat van 15 km naar 40 km. Dat is 40 - 15 = 25 km.',
          'In een uur is dat 25 : 2 = 12,5 km, dus de snelheid is 12,5 km per uur.',
        ],
      },
      watch: T(
        'Neem alleen de km die er op dat stuk bij komen, en niet de afstand vanaf het vertrek.',
      ),
    },
    {
      t: 'Twee grafieken',
      p: [
        T(
          'Staan er twee grafieken in één figuur, dan kun je ze vergelijken. Wie er het eerst bij een afstand is, vind je door op de verticale as naar die afstand te gaan en dan naar rechts: de grafiek die je het eerst tegenkomt, hoort bij wie er het eerst is.',
        ),
        T(
          'Waar de grafieken elkaar snijden, hebben ze dezelfde waarde. Bij een afstand-tijdgrafiek haalt daar de een de ander in.',
        ),
      ],
    },
    {
      t: 'Van tabel naar grafiek',
      p: [T('Bij een tabel met metingen teken je zelf de grafiek. Dat gaat zo:')],
      how: [
        'Zet de tijd op de horizontale as, met gelijke stappen.',
        'Kies de verdeling van de verticale as: gelijke stappen, het grootste getal past erop en de as is niet veel te lang. Begin je niet bij 0, zet dan een scheurlijn in de as.',
        'Zet bij elke as een naam met een eenheid, en een titel boven de grafiek.',
        'Zet bij elke kolom van de tabel een punt.',
        'Teken een vloeiende kromme door de punten, want het zijn metingen.',
      ],
      ex: {
        q:
          T('In de tabel staat de temperatuur in de kas. Je hebt 10 hokjes op de verticale as.') +
          meetTabel({ x: { naam: 'tijd in uren' }, y: { naam: 'temperatuur in °C' } }, [
            [6, 13],
            [8, 16],
            [10, 22],
            [12, 26],
            [14, 27],
            [16, 24],
            [18, 18],
          ]),
        steps: [
          'De temperaturen liggen tussen 13 en 27 graden.',
          'Begin de verticale as bij 10, met een scheurlijn. Met 1 hokje = 2 graden kom je met 10 hokjes tot 30 graden.',
          'Zet de punten en teken er een vloeiende kromme door. Zo krijg je de grafiek van de kas bovenaan deze pagina.',
        ],
      },
      watch: T(
        'Neem niet de getallen uit de tabel als verdeling van de as. De stappen tussen die getallen zijn niet even groot.',
      ),
    },
    {
      t: 'Globale grafieken',
      p: [
        T(
          'Een {{=globale-grafiek|globale grafiek}} heeft geen getallen bij de assen. Je ziet alleen hoe iets verandert. Lees de grafiek van links naar rechts. Gaat hij omhoog, dan is hij stijgend. Gaat hij omlaag, dan is hij dalend. Loopt hij horizontaal, dan is hij constant: dan verandert er niets.',
        ),
        T(
          'Hoe steiler de grafiek, hoe sneller het stijgt of daalt. Zoek je de grafiek bij een verhaal, ga dan stuk voor stuk na of het groter wordt, kleiner wordt of gelijk blijft.',
        ),
      ],
      ex: {
        q:
          T(
            'De globale grafiek laat de temperatuur in een lokaal zien. Welk stuk is dalend? Wordt het in stuk a of in stuk d het snelst warmer?',
          ) + figbox(UITLEG_SCHETS),
        steps: [
          'Stuk c gaat omlaag, dus stuk c is dalend. Daar wordt het kouder.',
          'Stuk a en stuk d stijgen allebei. Stuk a is steiler.',
          'Hoe steiler, hoe sneller. Dus in stuk a wordt het het snelst warmer.',
        ],
      },
      watch: T(
        'Kijk wat er op de verticale as staat. Staat iemand stil, dan loopt een afstand-tijdgrafiek horizontaal. Bij een snelheidsgrafiek is horizontaal juist steeds even hard. Stilstaan is daar een snelheid van 0: dan ligt de grafiek op de horizontale as.',
      ),
    },
  ],
};
