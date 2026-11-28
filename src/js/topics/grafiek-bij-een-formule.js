// Onderwerp: Grafiek bij een formule. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
// Een formule bij een verhaal, met een woord voor de uitkomst en een letter voor het aantal, zoals
// bedrag = 6 + 4u (#290). Bij de formule maak je een tabel met stappen van 2, teken je de grafiek (een
// rechte lijn) en stel je de formule op uit een grafiek. De figuren komen uit contextGraph in
// grafiekfiguren.js, met assen met een naam en een eenheid.
import { ri, pick, coin, until, near, d } from '../math.js';
import { F, H } from './shared.js';
import { T } from '../typeset.js';
import { SOORTEN, tekenAf, tekenFig } from '../tekenvragen.js';
import { contextGraph, leesGrafiek } from '../grafiekfiguren.js';

const figbox = (svg) => `<div class="figbox">${svg}</div>`;
const en = (L) => (L.length > 1 ? `${L.slice(0, -1).join(', ')} en ${L[L.length - 1]}` : L[0]);
const reeks = (van, tot) => Array.from({ length: (tot - van) / 2 + 1 }, (_, k) => van + 2 * k);

// Verhalen met een formule: uitkomst = a + b · letter (op = '+') of a − b · letter (op = '-'). w is het
// woord voor de uitkomst, de hetzelfde met lidwoord, e de eenheid, l de letter en wat wat de letter is.
// enk en mv zijn de eenheid op de horizontale as (1 uur, 2 uur; 1 week, 2 weken), en as de naam van
// die as. Bij een stijgende formule zijn a en b de keuzes voor het begin en wat er per keer bij komt.
// Bij een dalende formule is b wat er per keer af gaat en n de keuzes voor de waarde van de letter
// waarbij alles op is, dus a = b · n. op0 zegt wanneer alles op is.
const VERHALEN = [
  {
    op: '+',
    w: 'bedrag',
    de: 'het bedrag',
    e: 'euro',
    l: 'u',
    wat: 'het aantal uren',
    enk: 'uur',
    mv: 'uur',
    as: 'tijd in uren',
    titel: 'Een sup-board huren',
    intro:
      'Bij een meer kun je een sup-board huren. Je betaalt een vast bedrag en een bedrag per uur.',
    y: "bedrag in euro's",
    a: [5, 10, 15, 20],
    b: [5, 10, 15],
  },
  {
    op: '+',
    w: 'lengte',
    de: 'de lengte',
    e: 'cm',
    l: 'w',
    wat: 'het aantal weken',
    enk: 'week',
    mv: 'weken',
    as: 'tijd in weken',
    titel: 'Een zonnebloem groeit',
    intro: 'Een zonnebloem wordt elke week even veel langer.',
    y: 'lengte in cm',
    a: [4, 5, 6, 8, 10, 15, 20],
    b: [2, 3, 4, 5, 6, 8, 10],
  },
  {
    op: '+',
    w: 'water',
    de: 'de hoeveelheid water',
    e: 'liter',
    l: 'm',
    wat: 'het aantal minuten',
    enk: 'minuut',
    mv: 'minuten',
    as: 'tijd in minuten',
    titel: 'Een bad loopt vol',
    intro: 'Er zit al wat water in een bad, en de kraan staat open.',
    y: 'water in liter',
    a: [10, 15, 20, 25, 30],
    b: [5, 10, 15],
  },
  {
    op: '+',
    w: 'spaargeld',
    de: 'het spaargeld',
    e: 'euro',
    l: 'w',
    wat: 'het aantal weken',
    enk: 'week',
    mv: 'weken',
    as: 'tijd in weken',
    titel: 'Sparen',
    intro: 'In een spaarpot zit al wat geld. Er komt elke week even veel bij.',
    y: "spaargeld in euro's",
    a: [10, 15, 20, 25, 30, 40, 50],
    b: [5, 10, 15, 20],
  },
  {
    op: '-',
    w: 'lengte',
    de: 'de lengte',
    e: 'cm',
    l: 'u',
    wat: 'het aantal uren',
    enk: 'uur',
    mv: 'uur',
    as: 'tijd in uren',
    titel: 'Een brandende kaars',
    intro: 'Een kaars brandt en wordt elk uur even veel korter.',
    y: 'lengte in cm',
    b: [2, 3, 4],
    n: [4, 6, 8, 10],
    op0: 'de kaars op is',
  },
  {
    op: '-',
    w: 'benzine',
    de: 'de hoeveelheid benzine',
    e: 'liter',
    l: 'u',
    wat: 'het aantal uren',
    enk: 'uur',
    mv: 'uur',
    as: 'tijd in uren',
    titel: 'Een bootje vaart',
    intro: 'Een bootje vaart over een meer en gebruikt elk uur even veel benzine.',
    y: 'benzine in liter',
    b: [2, 3, 4, 5],
    n: [4, 6, 8, 10],
    op0: 'de tank leeg is',
  },
  {
    op: '-',
    w: 'hoogte',
    de: 'de hoogte',
    e: 'meter',
    l: 'm',
    wat: 'het aantal minuten',
    enk: 'minuut',
    mv: 'minuten',
    as: 'tijd in minuten',
    titel: 'Een luchtballon daalt',
    intro: 'Een luchtballon daalt en komt elke minuut even veel lager.',
    y: 'hoogte in meter',
    b: [20, 25, 30, 40, 50],
    n: [4, 6, 8, 10],
    op0: 'de ballon op de grond staat',
  },
  {
    op: '-',
    w: 'water',
    de: 'de hoeveelheid water',
    e: 'liter',
    l: 'm',
    wat: 'het aantal minuten',
    enk: 'minuut',
    mv: 'minuten',
    as: 'tijd in minuten',
    titel: 'Een regenton loopt leeg',
    intro: 'Uit een regenton loopt via een kraan elke minuut even veel water.',
    y: 'water in liter',
    b: [5, 10, 15],
    n: [4, 6, 8, 10],
    op0: 'de ton leeg is',
  },
];
// Een verhaal met getallen. Bij een dalende formule is n de waarde van de letter waarbij alles op is.
function verhaal(lijst = VERHALEN) {
  const V = pick(lijst),
    b = pick(V.b);
  if (V.op === '+') return { V, a: pick(V.a), b, n: null };
  const n = pick(V.n);
  return { V, a: b * n, b, n };
}
const teken = (V) => (V.op === '+' ? 1 : -1);
const uit = (V, a, b, x) => a + teken(V) * b * x;
const formule = (V, a, b) => `${V.w} = ${a} ${V.op} ${b}${V.l}`;
const zin = (V, a, b) =>
  `${V.intro} Voor ${V.de} in ${V.e} geldt de formule ${formule(V, a, b)}. Hierin is ${V.l} ${V.wat}.`;
const tijd = (V, x) => `${x} ${x === 1 ? V.enk : V.mv}`;
// Invullen zoals in het boek: u = 2 geeft bedrag = 6 + 4 · 2 = 6 + 8 = 14.
const invul = (V, a, b, x) =>
  `${V.l} = ${x} geeft ${V.w} = ${a} ${V.op} ${b} · ${x} = ${a} ${V.op} ${b * x} = ${uit(V, a, b, x)}`;
// Leest a, het teken en b terug uit de tekst van de formule.
function leesFormule(f) {
  const m = f.match(/= (\d+) ([+-]) (\d+)[a-z]$/);
  return { a: +m[1], s: m[2] === '+' ? 1 : -1, b: +m[3] };
}
// De uitkomst bij x door vanaf het begin x keer b erbij te tellen of eraf te halen: zo rekent v anders
// dan de formule met een keer.
function stapVoorStap(f, x) {
  const { a, s, b } = leesFormule(f),
    stap = (w, k) => (k > 0 ? stap(w + s * b, k - 1) : w);
  return stap(a, x);
}

// De tabel met de letter bovenaan en de uitkomst eronder. Een leeg vak is null, en tekst blijft tekst.
// naam is de naam voor een schermlezer; die verschilt als er twee tabellen op het scherm staan.
const tabel = (V, xs, ys, naam = 'Tabel bij de formule') =>
  `<div class="scroll" role="region" tabindex="0" aria-label="${naam}"><table class="dt">${[
    [V.l, ...xs],
    [V.w, ...ys],
  ]
    .map(
      (r) =>
        `<tr><th>${T(r[0])}</th>${r
          .slice(1)
          .map((c) => `<td>${c === null ? '…' : typeof c === 'string' ? c : d(c)}</td>`)
          .join('')}</tr>`,
    )
    .join('')}</table></div>`;

// Een valkuil die per veld kijkt: fout(x, k) is het foute getal bij veld k. Een veld waar het foute getal
// gelijk is aan het goede telt niet mee, zodat een goed veld nooit een melding krijgt.
const perVeld = (id, xs, goed, fout, m) => ({
  id,
  f: (v) =>
    xs.some((x, k) => {
      const w = fout(x, k);
      return !near(w, goed[k]) && near(v[k], w);
    }),
  m,
});

// --- 233 Tabel bij een formule ---

function tabelInvullen() {
  const { V, a, b, n } = verhaal(),
    eind = n ? Math.min(n, 8) : 8,
    xs = reeks(0, eind),
    // Drie vakken om in te vullen (twee bij een korte tabel), en minstens één met een groot getal.
    aantal = xs.length >= 5 ? 3 : 2,
    vraag = until(
      () => Array.from({ length: aantal }, () => ri(0, xs.length - 1)),
      (L) => new Set(L).size === aantal && Math.max(...L) >= 2,
    ).sort((p, q) => p - q),
    gx = vraag.map((k) => xs[k]),
    goed = gx.map((x) => uit(V, a, b, x)),
    f = formule(V, a, b),
    s = teken(V),
    plus = V.op === '+';
  return {
    q:
      T(`${zin(V, a, b)} Je maakt een tabel met stappen van 2. Vul de tabel verder in.`) +
      tabel(
        V,
        xs,
        xs.map((x, k) => (vraag.includes(k) ? null : uit(V, a, b, x))),
      ),
    fields: gx.map((x, k) => F(`${V.l} = ${x} geeft ${V.w} =`, goed[k])),
    hint: T(
      `Vul het getal uit de bovenste rij in voor ${V.l}. ${b}${V.l} betekent ${b} · ${V.l}. Reken eerst de keer uit en ${plus ? `tel daarna ${a} erbij op` : `trek dat daarna van ${a} af`}.`,
    ),
    steps: [
      ...gx.map((x) => invul(V, a, b, x)),
      H(
        tabel(
          V,
          xs,
          xs.map((x) => uit(V, a, b, x)),
          'Ingevulde tabel bij de formule',
        ),
      ),
    ],
    traps: [
      perVeld(
        plus ? 'eerst-optellen' : 'eerst-aftrekken',
        gx,
        goed,
        (x) => (a + s * b) * x,
        `Je hebt eerst ${a} ${V.op} ${b} uitgerekend. Reken eerst ${b} · ${V.l} uit, en ${plus ? `tel dat daarna bij ${a} op` : `trek dat daarna van ${a} af`}.`,
      ),
      {
        id: 'vast-deel-vergeten',
        f: (v) =>
          gx.some((x, k) => [b * x, -b * x].some((w) => !near(w, goed[k]) && near(v[k], w))),
        m: `Je bent het getal ${a} vooraan vergeten. Reken ${b} · ${V.l} uit en ${plus ? `tel dat op bij ${a}` : `trek dat af van ${a}`}.`,
      },
      perVeld(
        'stap-van-1',
        gx,
        goed,
        (x) => uit(V, a, b, x / 2),
        `In de tabel gaat ${V.l} met stappen van 2: 0, 2, 4, ... Vul voor ${V.l} het getal uit de bovenste rij in, en niet het hoeveelste vakje het is.`,
      ),
    ],
    // Reken elk vak uit door vanaf het begin stap voor stap op te tellen of af te trekken.
    v: () => gx.every((x, k) => stapVoorStap(f, x) === goed[k]),
  };
}

// Bij een dalende formule raakt er iets op: daar stopt de tabel.
function tabelStopt() {
  const { V, a, b, n } = until(
      () => verhaal(VERHALEN.filter((k) => k.op === '-')),
      (g) => g.n >= 6,
    ),
    xs = [0, 2, 4],
    f = formule(V, a, b);
  return {
    q:
      T(
        `${zin(V, a, b)} Je maakt een tabel met stappen van 2, en je stopt als ${V.op0}. Bij welke waarde van ${V.l} stopt de tabel?`,
      ) + tabel(V, [...xs, '…'], [...xs.map((x) => uit(V, a, b, x)), null]),
    fields: [F(`${V.l} =`, n)],
    hint: T(
      `De tabel stopt als ${V.w} = 0. Elke stap van 2 ${V.mv} gaat er 2 · ${b} = ${2 * b} ${V.e} af. Ga verder in de tabel tot je bij 0 bent.`,
    ),
    steps: [
      `Als ${V.op0}, dan is ${V.w} = 0.`,
      `Elke stap van 2 ${V.mv} gaat er 2 · ${b} = ${2 * b} ${V.e} af: ${en(reeks(0, n).map((x) => d(uit(V, a, b, x))))}.`,
      invul(V, a, b, n),
      `Dus de tabel stopt bij ${V.l} = ${n}: dan is ${V.w} = 0 en ${V.op0}.`,
    ],
    traps: [
      {
        id: 'beginwaarde-als-antwoord',
        f: (v) => near(v[0], a),
        m: `${a} is ${V.de} bij het begin, bij ${V.l} = 0. Zoek de waarde van ${V.l} waarbij ${V.w} = 0 is.`,
      },
      {
        id: 'stappen-geteld',
        f: (v) => near(v[0], n / 2),
        m: `Je hebt de stappen in de tabel geteld. Elke stap is 2 ${V.mv}, dus ${V.l} is twee keer zo groot.`,
      },
      {
        id: 'een-stap-te-vroeg',
        f: (v) => near(v[0], n - 2),
        m: `Bij ${V.l} = ${n - 2} is ${V.w} = ${uit(V, a, b, n - 2)}. Er is dan nog wat over. Ga nog een stap verder.`,
      },
    ],
    // Haal steeds b eraf tot het op is, en tel hoe vaak.
    v: () => {
      const { a: begin, b: per } = leesFormule(f),
        keer = (w) => (w > 0 ? 1 + keer(w - per) : 0),
        rest = (w) => (w > 0 ? rest(w - per) : w);
      return rest(begin) === 0 && keer(begin) === n && stapVoorStap(f, n) === 0;
    },
  };
}
const s35tabel = () => (coin() || coin() ? tabelInvullen() : tabelStopt());

// --- 234 Grafiek tekenen bij een formule ---

// De stappen voor één hokje op de verticale as. Een schaal past als de grafiek 4 tot 12 hokjes hoog is.
const STAPPEN = [2, 5, 10, 20, 25, 50, 100];
const pastHoogte = (max, st) => Math.ceil(max / st) >= 4 && Math.ceil(max / st) <= 12;
// Alle getallen bij een verhaal: het begin a, wat er per keer bij komt of af gaat b, en het laatste
// getal X op de horizontale as. Bij een dalende formule is X de waarde waarbij alles op is.
const keuzes = (V, Xs) =>
  V.b.flatMap((b) =>
    V.op === '+'
      ? V.a.flatMap((a) => Xs.map((X) => ({ V, a, b, n: null, X })))
      : V.n.map((n) => ({ V, a: b * n, b, n, X: n })),
  );
const hoogste = (g) => Math.max(g.a, uit(g.V, g.a, g.b, g.X));
// Kiest uit een lijst keuzes eerst een schaal st en daarna getallen die daarop passen, zodat elke
// schaal even vaak voorkomt.
function kiesSchaal(L) {
  const st = pick([...new Set(L.map((g) => g.st))]);
  return pick(L.filter((g) => g.st === st));
}

// Per verhaal de getallen met een schaal waarop alle punten van de tabel op een lijn liggen. De tabel
// gaat met stappen van 2 tot hoogstens 8, dus elk getal is een veelvoud van st als a en 2b dat zijn.
const TEKENEN = VERHALEN.map((V) =>
  keuzes(V, [4, 6, 8])
    .filter((g) => g.X <= 8)
    .flatMap((g) =>
      STAPPEN.filter(
        (st) => g.a % st === 0 && (2 * g.b) % st === 0 && pastHoogte(hoogste(g), st),
      ).map((st) => ({ ...g, st })),
    ),
);

function s35tekenen() {
  const { V, a, b, X, st } = kiesSchaal(pick(TEKENEN)),
    xs = reeks(0, X),
    ys = xs.map((x) => uit(V, a, b, x)),
    f = formule(V, a, b),
    max = Math.max(...ys),
    t = {
      soort: 'grafiekpunten',
      fig: {
        titel: V.titel,
        x: { naam: V.as, van: 0, tot: xs[xs.length - 1] + 2, stap: 1, eenheid: V.enk },
        y: { naam: V.y, van: 0, tot: (Math.ceil(max / st) + 1) * st, stap: st, eenheid: V.e },
        u: 26,
      },
      goed: xs.map((x, k) => [x, ys[k]]),
      // Een extra punt op de lijn, bijvoorbeeld tussen twee kolommen van de tabel in, is ook goed.
      lijn: [ys[0], (ys[1] - ys[0]) / (xs[1] - xs[0])],
      verbind: 'lijn',
    },
    G = SOORTEN.grafiekpunten,
    goed = G.schrijf(t, t.goed),
    is = (p, q) => near(p[0], q[0], 1e-9) && near(p[1], q[1], 1e-9),
    hoort = (p) => t.goed.some((q) => is(p, q)),
    lees = (v) => G.lees(t, v[0]),
    // Een gezet punt dat niet hoort, maar wel bij een ander punt q ligt dat fout(q) geeft.
    ernaast = (v, fout) => lees(v).some((p) => !hoort(p) && t.goed.some((q) => fout(p, q)));
  return {
    q: T(
      `${zin(V, a, b)} Teken de grafiek. Maak eerst een tabel met ${V.l} = ${en(xs)}, en zet die punten in het {{assenstelsel|assenstelsel}}. Tik op een plek om er een punt te zetten, en nog een keer om het weg te halen. Door de punten komt vanzelf een rechte lijn.`,
    ),
    fig: tekenFig(t),
    teken: t,
    fields: [{ teken: true, a: goed, label: 'Je punten' }],
    hint: T(
      `Reken eerst ${V.w} uit bij elke ${V.l} uit de tabel. Kijk dan wat één hokje is op elke as. ${V.l} staat op de horizontale as en ${V.w} op de verticale as.`,
    ),
    steps: [
      ...xs.map((x) => invul(V, a, b, x)),
      H(tabel(V, xs, ys)),
      `Eén hokje op de horizontale as is 1 ${V.enk}. Eén hokje op de verticale as is ${st} ${V.e}.`,
      `Zet bij elke kolom van de tabel een punt. Bijvoorbeeld bij ${tijd(V, xs[1])}: ga recht omhoog tot ${d(ys[1])} ${V.e}.`,
      'Bij een formule als deze liggen de punten op een rechte lijn. Teken de lijn door de punten.',
      H(tekenAf(t, goed, 'Met de punten uit de tabel en de lijn erdoor.')),
    ],
    traps: [
      {
        id: 'punt-vergeten',
        f: (v) => {
          const L = lees(v);
          return L.length < t.goed.length && L.every(hoort);
        },
        m: `Je hebt niet alle punten gezet. In de tabel staan ${xs.length} kolommen, dus er horen ${xs.length} punten in de grafiek.`,
      },
      {
        id: 'x-en-y-verwisseld',
        f: (v) => ernaast(v, (p, q) => is(p, [q[1], q[0]])),
        m: `Je hebt de assen verwisseld. ${V.l} staat op de horizontale as, en ${V.w} op de verticale as.`,
      },
      {
        id: 'stap-van-1',
        f: (v) => ernaast(v, (p, q) => is(p, [q[0] / 2, q[1]])),
        m: `Een punt staat bij het hoeveelste vakje van de tabel, en niet bij ${V.l}. In de tabel gaat ${V.l} met stappen van 2: 0, 2, 4, ...`,
      },
      {
        id: 'hokje-ernaast',
        f: (v) =>
          ernaast(
            v,
            (p, q) =>
              (near(p[0], q[0], 1e-9) && near(Math.abs(p[1] - q[1]), st, 1e-9)) ||
              (near(p[1], q[1], 1e-9) && near(Math.abs(p[0] - q[0]), 1, 1e-9)),
          ),
        m: `Een punt staat een hokje naast de goede plek. Eén hokje op de verticale as is ${st} ${V.e}. Tel vanaf een getal bij de as.`,
      },
    ],
    // Reken elk punt na door stap voor stap op te tellen of af te trekken, en kijk of alle punten in het
    // rooster passen.
    v: () => {
      const gezet = G.lees(t, goed);
      return (
        gezet.length === xs.length &&
        gezet.every(([x, y]) => stapVoorStap(f, x) === y) &&
        gezet.every(([, y]) => y >= t.fig.y.van && y <= t.fig.y.tot)
      );
    },
  };
}

// --- 235 Formule uit een grafiek ---

// Alle getallen met een schaal waarbij het begin op een lijn ligt en de grafiek daarna voor het eerst
// door een roosterpunt gaat bij x2: over x2 stappen lees je af, en daarna deel je door x2. Met de
// stappen uit STAPPEN is x2 altijd 1, 2 of 4. a en b zijn verschillend, zodat omwisselen opvalt.
const AFLEZEN = VERHALEN.flatMap((V) =>
  keuzes(V, [6, 8])
    .filter((g) => g.a !== g.b)
    .flatMap((g) =>
      STAPPEN.filter((st) => g.a % st === 0 && pastHoogte(hoogste(g), st)).map((st) => ({
        ...g,
        st,
        x2: [1, 2, 3, 4].find((x) => (g.b * x) % st === 0) || 0,
      })),
    )
    .filter((g) => g.x2 > 0),
);

function s35formule() {
  // Kies eerst over hoeveel stappen je afleest, zodat je meestal moet delen, dan stijgend of dalend,
  // dan het verhaal, en daarna de schaal en de getallen.
  const x2 = pick([1, 2, 2, 4]),
    richting = coin() ? '+' : '-',
    L = AFLEZEN.filter((g) => g.x2 === x2 && g.V.op === richting),
    V = pick([...new Set(L.map((g) => g.V))]),
    { a, b, n, X, st } = kiesSchaal(L.filter((g) => g.V === V)),
    y2 = uit(V, a, b, x2),
    plus = V.op === '+',
    op = plus ? '+' : '−',
    max = Math.max(a, uit(V, a, b, X)),
    verschil = b * x2,
    fig = contextGraph({
      titel: V.titel,
      x: { naam: V.as, van: 0, tot: X, stap: 1, eenheid: V.enk },
      y: { naam: V.y, van: 0, tot: (Math.ceil(max / st) + 1) * st, stap: st, eenheid: V.e },
      grafieken: [
        {
          punten: [
            [0, a],
            [X, uit(V, a, b, X)],
          ],
        },
      ],
      zeg: 'vorm',
    });
  return {
    q: T(
      `${V.intro} In de grafiek zie je ${V.de} in ${V.e}. Stel de formule op. Hierin is ${V.l} ${V.wat}. Vul de getallen in en kies plus of min.`,
    ),
    fig,
    fields: [
      F(`${V.w} =`, a),
      { sel: ['+', '−'], a: op, label: 'Plus of min' },
      { ...F('', b, `· ${V.l}`), label: `Het getal voor ${V.l}` },
    ],
    compact: true,
    hint: T(
      `Het getal vooraan lees je af bij ${V.l} = 0. Zoek dan een tweede punt waar de grafiek precies door een roosterpunt gaat. Reken uit hoeveel er per ${V.enk} bij komt of af gaat.`,
    ),
    steps: [
      `Bij 0 ${V.mv} lees je ${a} ${V.e} af. Dat is het getal vooraan in de formule.`,
      `De grafiek gaat ook precies door een roosterpunt bij ${tijd(V, x2)}: daar lees je ${d(y2)} ${V.e} af.`,
      plus
        ? `In ${tijd(V, x2)} komt er ${d(y2)} - ${a} = ${verschil} ${V.e} bij.`
        : `In ${tijd(V, x2)} gaat er ${a} - ${d(y2)} = ${verschil} ${V.e} af.`,
      x2 > 1
        ? `Per ${V.enk} is dat ${verschil} : ${x2} = ${b} ${V.e}.`
        : `Dat is ${b} ${V.e} per ${V.enk}.`,
      plus
        ? `De grafiek stijgt, dus er staat een plus in de formule.`
        : `De grafiek daalt, dus er staat een min in de formule.`,
      `Dus ${formule(V, a, b)}.`,
    ],
    traps: [
      {
        id: 'getallen-omgewisseld',
        f: (v) => near(v[0], b) && near(v[2], a),
        m: `Je hebt de getallen omgewisseld. Vooraan staat ${V.de} bij ${V.l} = 0. Voor de ${V.l} staat wat er per ${V.enk} bij komt of af gaat.`,
      },
      {
        id: 'toename-niet-gedeeld',
        f: (v) => [verschil, b * X].some((w) => !near(w, b) && near(v[2], w)),
        m: `In de formule staat wat er per ${V.enk} bij komt of af gaat. Deel wat erbij komt of af gaat door het aantal ${V.mv} ertussen.`,
      },
      {
        id: 'waarde-bij-een',
        f: (v) => !near(uit(V, a, b, 1), b) && near(v[2], uit(V, a, b, 1)),
        m: `Dat is ${V.de} bij 1 ${V.enk}. Daar zit het begin nog in. Reken uit hoeveel er in 1 ${V.enk} bij komt of af gaat.`,
      },
      plus
        ? {
            id: 'min-bij-stijgend',
            f: (v) => v[1] === '−',
            m: 'De grafiek stijgt: er komt steeds wat bij. Dan staat er een plus in de formule.',
          }
        : {
            id: 'plus-bij-dalend',
            f: (v) => v[1] === '+',
            m: 'De grafiek daalt: er gaat steeds wat af. Dan staat er een min in de formule.',
          },
    ],
    // Leest de lijn terug uit de getekende figuur: de waarde bij 0 en de helling in de getallen van de assen.
    v: () => {
      const { lijnen, tx, ty } = leesGrafiek(fig),
        [p, q] = lijnen[0],
        helling = (q[1] - p[1]) / (q[0] - p[0]);
      return (
        lijnen.length === 1 &&
        near(p[0], 0, tx) &&
        near(p[1], a, ty) &&
        near(helling, (plus ? 1 : -1) * b, 0.05) &&
        (n === null || near(q[1], 0, ty))
      );
    },
  };
}

// --- De uitleg ---

const UITLEG_V = VERHALEN[0];
const UITLEG_T = {
  soort: 'grafiekpunten',
  fig: {
    titel: 'Een kano huren',
    x: { naam: 'tijd in uren', van: 0, tot: 8, stap: 1, eenheid: 'uur' },
    y: { naam: "bedrag in euro's", van: 0, tot: 45, stap: 5, eenheid: 'euro' },
    u: 22,
  },
  goed: [
    [0, 10],
    [2, 20],
    [4, 30],
    [6, 40],
  ],
  verbind: 'lijn',
};
const UITLEG_GRAFIEK = tekenAf(
  UITLEG_T,
  SOORTEN.grafiekpunten.schrijf(UITLEG_T, UITLEG_T.goed),
  'Met de punten uit de tabel en de lijn erdoor.',
);
const UITLEG_DALEND = contextGraph({
  titel: 'Een fles limonade',
  x: { naam: 'aantal glazen', van: 0, tot: 8, stap: 1, eenheid: 'glas' },
  y: { naam: 'limonade in cl', van: 0, tot: 175, stap: 25, eenheid: 'cl' },
  grafieken: [
    {
      punten: [
        [0, 150],
        [6, 0],
      ],
    },
  ],
  zeg: 'punten',
});

export default {
  slug: 'grafiek-bij-een-formule',
  title: 'Grafiek bij een formule',
  intro:
    'Bij een formule zoals bedrag = 10 + 5u maak je een tabel, en met die tabel teken je de grafiek: een rechte lijn. Hier leer je een tabel maken met stappen van 2, de grafiek tekenen en uit een grafiek de formule opstellen.',
  description:
    'Grafiek bij een formule oefenen: een tabel maken met stappen van 2, de rechte lijn tekenen en de formule uit een grafiek halen. Gratis met uitleg.',
  videos: {},
  skills: [
    [233, 'Tabel bij een formule', s35tabel],
    [234, 'Grafiek tekenen bij een formule', s35tekenen],
    [235, 'Formule uit een grafiek', s35formule],
  ],
  learn: [
    {
      t: 'Een tabel bij een formule',
      p: [
        T(
          'Bij het huren van een kano geldt bedrag = 10 + 5u. Hierin is u het aantal uren, en het bedrag is in euro. Het woord bedrag is de uitkomst, de letter u is wat je invult.',
        ),
        T(
          'Voor een tabel neem je vaak stappen van 2 in de bovenste rij: u = 0, 2, 4, ... Vul elk getal in voor u. Reken eerst de keer uit, en tel daarna op.',
        ),
      ],
      ex: {
        q: T('Maak een tabel bij bedrag = 10 + 5u.'),
        steps: [
          'u = 0 geeft bedrag = 10 + 5 · 0 = 10 + 0 = 10',
          'u = 2 geeft bedrag = 10 + 5 · 2 = 10 + 10 = 20',
          'u = 4 geeft bedrag = 10 + 5 · 4 = 10 + 20 = 30',
          'u = 6 geeft bedrag = 10 + 5 · 6 = 10 + 30 = 40',
          H(tabel(UITLEG_V, [0, 2, 4, 6], [10, 20, 30, 40])),
        ],
      },
      watch: T('10 + 5 · 2 is 10 + 10 = 20, en niet 15 · 2 = 30.'),
    },
    {
      t: 'De grafiek tekenen',
      p: [T('Met de tabel teken je de grafiek. Dat gaat zo:')],
      how: [
        'Maak een tabel. In de bovenste rij staat de letter, vaak met stappen van 2.',
        'Zet de letter op de horizontale as, met gelijke stappen.',
        'Zet de uitkomst op de verticale as. Kies een handige stap per hokje, zodat het grootste getal past.',
        'Zet bij elke as een naam met een eenheid, en een titel boven de grafiek.',
        'Zet de punten uit de tabel en teken er een rechte lijn door.',
      ],
      ex: {
        q: T('Teken de grafiek bij bedrag = 10 + 5u.'),
        steps: [
          'In de tabel gaat u van 0 tot 6, en het bedrag van 10 tot 40.',
          'Op de horizontale as is één hokje 1 uur. Op de verticale as is één hokje 5 euro, dan past 40 euro erop.',
          H(`Zet de punten en teken de lijn erdoor.${figbox(UITLEG_GRAFIEK)}`),
        ],
      },
      watch: T(
        'Bij een formule als deze liggen de punten op een rechte lijn. Bij metingen, zoals een temperatuur, teken je een vloeiende kromme.',
      ),
    },
    {
      t: 'Waarom stopt de tabel?',
      p: [
        T(
          'Bij een formule met een min wordt de uitkomst steeds kleiner. Uit een fles van 150 cl schenk je glazen van 25 cl. Dan geldt limonade = 150 - 25g, met g het aantal glazen.',
        ),
        T(
          'Bij g = 6 is limonade = 150 - 25 · 6 = 150 - 150 = 0. Dan is de fles leeg, dus de tabel en de grafiek stoppen daar.',
        ),
      ],
    },
    {
      t: 'De formule uit een grafiek',
      p: [
        T(
          'Is de grafiek een rechte lijn, dan kun je de formule opstellen. Het getal vooraan lees je af bij 0. Daarna kijk je hoeveel er per stap bij komt of af gaat.',
        ),
      ],
      ex: {
        q: T('Stel de formule op bij de grafiek van de fles limonade.') + figbox(UITLEG_DALEND),
        steps: [
          'Bij 0 glazen lees je 150 cl af. Dat is het getal vooraan.',
          'Bij 6 glazen lees je 0 cl af. In 6 glazen gaat er 150 cl af.',
          'Per glas is dat 150 : 6 = 25 cl.',
          'De grafiek daalt, dus er staat een min: limonade = 150 - 25g.',
        ],
      },
      watch: T(
        'Lees je een toename af over meer dan één stap, deel die dan nog door het aantal stappen.',
      ),
    },
  ],
};
