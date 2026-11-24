// Onderwerp: Veelhoeken en diagonalen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { geo } from '../figures.js';
import { ri, pick, coin, d } from '../math.js';
import { F, MC, H } from './shared.js';
import { T, dt } from '../typeset.js';

// Een lijst als zin: 'A, B en C'.
const en = (xs) =>
  xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} en ${xs[xs.length - 1]}`;
const groot = (s) => s[0].toUpperCase() + s.slice(1);

// De naam van een veelhoek, naar het aantal hoekpunten.
const NAAM = {
  3: 'driehoek',
  4: 'vierhoek',
  5: 'vijfhoek',
  6: 'zeshoek',
  7: 'zevenhoek',
  8: 'achthoek',
  9: 'negenhoek',
  10: 'tienhoek',
  11: 'elfhoek',
  12: 'twaalfhoek',
};

// Letters bij de hoekpunten: een rij opeenvolgende letters, tegen de klok in. Elke vraag begint bij
// een andere letter. Met een rij van 8 letters past elk begin nog in het alfabet.
const ALFABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BEGIN = ['A', 'D', 'E', 'G', 'K', 'L', 'P', 'R'];
function reeks(n) {
  const b = ALFABET.indexOf(pick(BEGIN));
  return ALFABET.slice(b, b + n);
}
// De naam van een lijnstuk tussen twee hoekpunten, op alfabet: KM, niet MK.
const lijn = (p, q) => [p, q].sort().join('');
// De zijden van een veelhoek, rondom. De laatste gaat van de laatste letter terug naar de eerste.
const zijdenVan = (L) => [...L].map((c, i) => lijn(c, L[(i + 1) % L.length]));
// De buren van hoekpunt k: de hoekpunten waar een zijde naartoe loopt.
const burenVan = (L, k) => [L[(k + L.length - 1) % L.length], L[(k + 1) % L.length]].sort();
// De hoekpunten waar vanuit hoekpunt k een diagonaal naartoe gaat: niet k zelf en niet de buren.
const overVan = (L, k) => [...L].filter((c, j) => j !== k && !burenVan(L, k).includes(c));
// Alle diagonalen, op alfabet.
const diagonalenVan = (L) =>
  [...L]
    .flatMap((c, k) =>
      overVan(L, k)
        .filter((p) => p > c)
        .map((p) => lijn(c, p)),
    )
    .sort();

// Een bolle veelhoek: de hoekpunten liggen op een ellips, tegen de klok in. Per hoekpunt schuift de
// hoek een stukje op (SCHUIF, in delen van een stap), zodat de figuur niet regelmatig is. Twee
// hoekpunten naast elkaar liggen zo altijd minstens 0,6 stap uit elkaar.
const SCHUIF = [
  [0, 0.15, -0.1, 0.2, -0.15, 0.1, -0.05, 0.15],
  [0.1, -0.15, 0.05, -0.1, 0.2, -0.05, 0.15, -0.2],
  [-0.1, 0.1, 0.2, -0.05, 0, -0.2, 0.1, 0.05],
];
function punten(L, vorm, draai) {
  const n = L.length,
    stap = (2 * Math.PI) / n,
    pts = {};
  [...L].forEach((c, k) => {
    const h = (draai * Math.PI) / 4 + 0.2 + stap * (k + SCHUIF[vorm][k]);
    pts[c] = [Math.round(130 * Math.cos(h)) / 100, Math.round(100 * Math.sin(h)) / 100];
  });
  return pts;
}
const veelhoek = (n) => {
  const L = reeks(n);
  return { L, pts: punten(L, ri(0, 2), ri(0, 7)) };
};
// De zijden zoals geo ze tekent: van elke letter naar de volgende.
const rand = (L) => [...L].map((c, i) => c + L[(i + 1) % L.length]);

// Voor de controle: meetkunde met de hoekpunten zelf.
const kruis = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
// Ligt punt q echt binnen de veelhoek? Bij een bolle veelhoek tegen de klok in ligt q dan links van
// elke zijde. Een punt op een zijde ligt niet binnen.
const binnen = (pts, L, q) =>
  [...L].every((c, i) => kruis(pts[c], pts[L[(i + 1) % L.length]], q) > 1e-9);
// Is de veelhoek bol, met de letters tegen de klok in?
const bol = (pts, L) =>
  [...L].every(
    (c, i) => kruis(pts[c], pts[L[(i + 1) % L.length]], pts[L[(i + 2) % L.length]]) > 1e-9,
  );
// Een lijnstuk tussen twee hoekpunten is een diagonaal als het midden binnen de veelhoek ligt. Het
// midden van een zijde ligt op de rand.
const isDiagonaal = (pts, L, p, q) =>
  binnen(pts, L, [(pts[p][0] + pts[q][0]) / 2, (pts[p][1] + pts[q][1]) / 2]);
const paren = (L) => [...L].flatMap((c, i) => [...L].slice(i + 1).map((p) => [c, p]));
// Telt de diagonalen van een n-hoek met paren hoekpunten: twee hoekpunten zijn buren als ze in
// de rij naast elkaar staan, of als het de eerste en de laatste zijn.
function telDiagonalen(n) {
  let t = 0;
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) if (j - i !== 1 && j - i !== n - 1) t++;
  return t;
}

// ---------------------------------------------------------------------------------------------
// 166: veelhoeken en zijden benoemen.

const NAMEN = [3, 4, 5, 6, 7, 8].map((k) => NAAM[k]);

function naamBijFiguur() {
  const n = ri(3, 8),
    { L, pts } = veelhoek(n),
    zijden = zijdenVan(L),
    segs = rand(L),
    fields = [
      { sel: NAMEN, a: NAAM[n], pre: 'Het is een', label: 'Naam van de veelhoek' },
      { ...F('Zijden:', n), br: true },
      { ...F('Hoekpunten:', n), br: true },
    ];
  return {
    q: T(
      'Hieronder staat een veelhoek met letters bij de hoekpunten. Wat voor veelhoek is het? Hoeveel zijden en hoeveel hoekpunten heeft hij?',
    ),
    fig: geo({
      pts,
      segs,
      w: 260,
      maxH: 220,
      desc: `Veelhoek met de hoekpunten ${en([...L])}, tegen de klok in.`,
    }),
    fields,
    hint: T(
      'Tel de hoekpunten. Een veelhoek heet naar het aantal hoekpunten: een vijfhoek heeft 5 hoekpunten. Een veelhoek heeft evenveel zijden als hoekpunten.',
    ),
    steps: [
      `De hoekpunten zijn ${en([...L])}. Dat zijn er ${n}.`,
      `De zijden zijn ${en(zijden)}. Dat zijn er ook ${n}.`,
      `Dus het is een ${NAAM[n]}.`,
    ],
    traps: [
      {
        id: 'naam-verkeerd-geteld',
        f: (v) => v[0] === NAAM[n - 1] || v[0] === NAAM[n + 1],
        m: 'Tel de hoekpunten nog eens. Een veelhoek heet naar het aantal hoekpunten: een zeshoek heeft 6 hoekpunten.',
      },
      {
        id: 'zijde-vergeten',
        f: (v) => v[1] === n - 1,
        m: `Je bent een zijde vergeten. De laatste zijde gaat van ${L[n - 1]} terug naar ${L[0]}: zijde ${lijn(L[0], L[n - 1])}.`,
      },
      {
        id: 'hoekpunt-dubbel-geteld',
        f: (v) => v[2] === n + 1,
        m: `Je hebt een hoekpunt twee keer geteld. Ga je rond vanaf ${L[0]}, dan kom je aan het eind weer bij ${L[0]}. Tel ${L[0]} maar één keer.`,
      },
    ],
    // Tel in de figuur: de punten, de getekende lijnstukken, en elk punt zit aan twee zijden.
    v: () => {
      const aantal = Object.keys(pts).length;
      return (
        bol(pts, L) &&
        [...L].every((c) => segs.filter((g) => g.includes(c)).length === 2) &&
        segs.length === fields[1].a &&
        aantal === fields[2].a &&
        NAAM[aantal] === fields[0].a
      );
    },
  };
}

function zijdenNoemen() {
  const n = ri(4, 7),
    L = reeks(n),
    zijden = zijdenVan(L),
    slot = zijden[n - 1],
    // Vier rijen: alle zijden, zonder de laatste zijde, met een diagonaal in plaats van de laatste
    // zijde, en met een diagonaal erbij.
    rijen = [
      zijden,
      zijden.slice(0, -1),
      [...zijden.slice(0, -1), lijn(L[0], L[n - 2])],
      [...zijden, lijn(L[0], L[2])],
    ],
    keuzes = rijen.map((r) => T(en(r))),
    mc = MC(keuzes, 0);
  return {
    q: T(`Welke rij noemt precies alle zijden van ${NAAM[n]} ${L}?`),
    mc,
    hint: T(
      'De letters staan tegen de klok in. Een zijde verbindt twee letters die naast elkaar staan. Vergeet de zijde van de laatste letter terug naar de eerste niet.',
    ),
    steps: [
      `Ga rond langs de hoekpunten: ${[...L, L[0]].join(' → ')}.`,
      `Zo krijg je de zijden ${en(zijden)}.`,
      `Dat zijn ${n} zijden, evenveel als de hoekpunten.`,
    ],
    traps: [
      {
        id: 'zijde-vergeten',
        f: (v) => v[0] === keuzes[1],
        m: `Je mist een zijde. Van ${L[n - 1]} ga je terug naar ${L[0]}: dat is zijde ${slot}.`,
      },
      {
        id: 'diagonaal-als-zijde',
        f: (v) => v[0] === keuzes[2] || v[0] === keuzes[3],
        m: `In deze rij staat een diagonaal: ${[...new Set([lijn(L[0], L[n - 2]), lijn(L[0], L[2])])].join(' of ')} verbindt twee hoekpunten die geen buren zijn. Een zijde verbindt twee hoekpunten die naast elkaar liggen.`,
      },
    ],
    // Een rij is goed als er n lijnstukken in staan, elk hoekpunt aan precies twee ervan zit, en
    // elk lijnstuk twee buren verbindt (zoals de eerste en de laatste letter).
    v: () => {
      const goed = (r) =>
        r.length === n &&
        new Set(r).size === n &&
        [...L].every((c) => r.filter((g) => g.includes(c)).length === 2) &&
        r.every((g) => [1, n - 1].includes(Math.abs(L.indexOf(g[0]) - L.indexOf(g[1]))));
      return goed(rijen[0]) && rijen.slice(1).every((r) => !goed(r)) && mc.opts[mc.a] === keuzes[0];
    },
  };
}
const s166 = () => pick([naamBijFiguur, zijdenNoemen])();

// ---------------------------------------------------------------------------------------------
// 167: diagonalen in een getekende vierhoek, vijfhoek of zeshoek.

// Valkuilen bij het tellen: v[0] is het aantal vanuit één hoekpunt, v[1] het totaal. Met bij erin
// noemen de berichten de letters uit de figuur.
function telValkuilen(n, bij) {
  const per = n - 3,
    alle = (n * (n - 1)) / 2;
  return [
    {
      id: 'zijde-als-diagonaal',
      // Bij een vijfhoek is alle paren ook het dubbele aantal: dan is het een dubbeltelling.
      f: (v) => v[0] === n - 1 || v[0] === n - 2 || (v[1] === alle && alle !== n * per),
      m: bij
        ? `Je hebt een zijde als diagonaal geteld. Van ${bij.X} naar ${en(bij.buren)} loopt een zijde. Een diagonaal verbindt twee hoekpunten die geen buren zijn.`
        : 'Je hebt zijden als diagonaal geteld. Vanuit een hoekpunt kun je geen diagonaal tekenen naar dat hoekpunt zelf, en ook niet naar de twee buren: daar loopt een zijde naartoe.',
    },
    {
      id: 'dubbel-geteld',
      f: (v) => v[1] === n * per,
      m: bij
        ? `Je hebt elke diagonaal twee keer geteld. Diagonaal ${bij.voorbeeld} tel je vanuit ${bij.voorbeeld[0]} en nog een keer vanuit ${bij.voorbeeld[1]}. Deel dus nog door 2.`
        : 'Je hebt elke diagonaal twee keer geteld: een keer vanuit elk uiteinde. Deel dus nog door 2.',
    },
    {
      id: 'vanuit-een-punt',
      f: (v) => v[1] === per,
      m: 'Dat zijn alleen de diagonalen vanuit één hoekpunt. Vanuit de andere hoekpunten gaan ook diagonalen.',
    },
  ];
}
const diagonalenTekst = (k) => (k === 1 ? '1 diagonaal' : `${k} diagonalen`);

function diagonalenTellen() {
  const n = pick([4, 5, 6]),
    { L, pts } = veelhoek(n),
    k = ri(0, n - 1),
    X = L[k],
    buren = burenVan(L, k),
    over = overVan(L, k),
    vanuit = over.map((c) => lijn(X, c)),
    alle = diagonalenVan(L),
    per = n - 3,
    totaal = (n * per) / 2,
    voorbeeld = vanuit[0],
    naam = NAAM[n],
    fields = [
      { ...F(`Diagonalen vanuit ${X}:`, per), label: `Aantal diagonalen vanuit ${X}` },
      { ...F('Diagonalen in totaal:', totaal), br: true },
    ];
  return {
    q: T(
      `Hieronder staat ${naam} ${L}. Hoeveel diagonalen kun je vanuit hoekpunt ${X} tekenen? Hoeveel diagonalen heeft de ${naam} in totaal?`,
    ),
    fig: geo({
      pts,
      segs: rand(L),
      w: 260,
      maxH: 220,
      desc: `${groot(naam)} ${L} met de hoekpunten ${en([...L])}, tegen de klok in.`,
    }),
    fields,
    hint: T(
      'Een diagonaal verbindt twee hoekpunten die geen buren zijn. Tel eerst de diagonalen vanuit één hoekpunt. Elk hoekpunt heeft er evenveel.',
    ),
    steps: [
      `Vanuit ${X} kun je niet naar ${X} zelf, en ook niet naar de buren ${en(buren)}: daar loopt een zijde naartoe.`,
      per === 1
        ? `Alleen naar ${over[0]} kan het. Dat is 1 diagonaal: ${vanuit[0]}.`
        : `Naar ${en(over)} kan het wel. Dat zijn ${n} - 3 = ${per} diagonalen: ${en(vanuit)}.`,
      `Elk van de ${n} hoekpunten heeft ${diagonalenTekst(per)}. ${n} * ${per} = ${n * per}.`,
      `Zo tel je elke diagonaal twee keer: ${voorbeeld} tel je vanuit ${voorbeeld[0]} en ook vanuit ${voorbeeld[1]}. Dus ${n * per} : 2 = ${totaal}.`,
      `De diagonalen zijn ${en(alle)}.`,
    ],
    traps: telValkuilen(n, { X, buren, voorbeeld }),
    // Tel met de figuur: een lijnstuk tussen twee hoekpunten is een diagonaal als het midden binnen
    // de veelhoek ligt.
    v: () =>
      bol(pts, L) &&
      [...L].filter((c) => c !== X && isDiagonaal(pts, L, X, c)).length === fields[0].a &&
      paren(L).filter(([p, q]) => isDiagonaal(pts, L, p, q)).length === fields[1].a,
  };
}

function diagonalenVanuit() {
  const n = pick([4, 5, 6]),
    { L, pts } = veelhoek(n),
    k = ri(0, n - 1),
    X = L[k],
    buren = burenVan(L, k),
    zijden = buren.map((c) => lijn(X, c)),
    goed = overVan(L, k).map((c) => lijn(X, c)),
    // Een buur, en de diagonalen vanuit die buur.
    j = (k + 1) % n,
    Y = L[j],
    vanY = overVan(L, j).map((c) => lijn(Y, c)),
    rijen = [goed, [...goed.slice(1), zijden[0]], [...goed, ...zijden], vanY].map((r) =>
      en([...r].sort()),
    ),
    keuzes = rijen.map((r) => T(r)),
    mc = MC(keuzes, 0),
    naam = NAAM[n];
  return {
    q: T(`Hieronder staat ${naam} ${L}. Welke diagonalen kun je vanuit hoekpunt ${X} tekenen?`),
    fig: geo({
      pts,
      segs: rand(L),
      w: 260,
      maxH: 220,
      desc: `${groot(naam)} ${L} met de hoekpunten ${en([...L])}, tegen de klok in.`,
    }),
    mc,
    hint: T(
      `Een diagonaal verbindt twee hoekpunten die geen buren zijn. Welke hoekpunten zijn de buren van ${X}?`,
    ),
    steps: [
      `De buren van ${X} zijn ${en(buren)}. Daar loopt een zijde naartoe: ${en(zijden)}.`,
      goed.length === 1
        ? `Er blijft één hoekpunt over: ${goed[0].replace(X, '')}. De diagonaal is ${goed[0]}.`
        : `De andere hoekpunten zijn ${en(overVan(L, k))}. De diagonalen zijn ${rijen[0]}.`,
    ],
    traps: [
      {
        id: 'zijde-als-diagonaal',
        f: (v) => v[0] === keuzes[1] || v[0] === keuzes[2],
        m: `${en(zijden)} zijn zijden van de ${naam}, geen diagonalen. Een diagonaal verbindt twee hoekpunten die geen buren zijn.`,
      },
      {
        id: 'ander-hoekpunt',
        f: (v) => v[0] === keuzes[3],
        m: `Dat ${vanY.length === 1 ? 'is de diagonaal' : 'zijn de diagonalen'} vanuit ${Y}. Een diagonaal vanuit ${X} heeft de letter ${X} in zijn naam.`,
      },
    ],
    // De diagonalen vanuit X zijn de lijnstukken waarvan het midden binnen de veelhoek ligt.
    v: () => {
      const echt = en(
        [...L]
          .filter((c) => c !== X && isDiagonaal(pts, L, X, c))
          .map((c) => lijn(X, c))
          .sort(),
      );
      return (
        bol(pts, L) &&
        rijen[0] === echt &&
        rijen.slice(1).every((r) => r !== echt) &&
        mc.opts[mc.a] === T(echt)
      );
    },
  };
}
const s167 = () => pick([diagonalenTellen, diagonalenTellen, diagonalenVanuit])();

// ---------------------------------------------------------------------------------------------
// 168: het aantal diagonalen van een veelhoek, ook terugredeneren.

function aantalDiagonalen() {
  const n = ri(7, 12),
    metNaam = coin(),
    wie = metNaam ? `een ${NAAM[n]}` : `een veelhoek met ${n} hoekpunten`,
    per = n - 3,
    totaal = (n * per) / 2,
    fields = [
      { ...F('Vanuit één hoekpunt:', per), label: 'Aantal diagonalen vanuit één hoekpunt' },
      { ...F('In totaal:', totaal), label: 'Aantal diagonalen in totaal', br: true },
    ];
  return {
    q: T(
      `Hoeveel diagonalen heeft ${wie}? Tel eerst hoeveel diagonalen er vanuit één hoekpunt gaan.`,
    ),
    fields,
    hint: T(
      'Vanuit een hoekpunt kun je niet naar dat hoekpunt zelf, en ook niet naar de twee buren. Tel daarna voor alle hoekpunten samen. Let op: zo tel je elke diagonaal twee keer.',
    ),
    steps: [
      ...(metNaam ? [`${groot(wie)} heeft ${n} hoekpunten.`] : []),
      `Vanuit één hoekpunt kun je naar ${n} - 3 = ${per} hoekpunten: niet naar het hoekpunt zelf en niet naar de twee buren.`,
      `${n} hoekpunten met elk ${per} diagonalen: ${n} * ${per} = ${n * per}.`,
      `Zo tel je elke diagonaal twee keer, want een diagonaal heeft twee uiteinden. Dus ${n * per} : 2 = ${totaal}.`,
    ],
    traps: telValkuilen(n),
    // Tel alle paren hoekpunten die geen buren zijn.
    v: () => {
      let vanuit = 0;
      for (let j = 1; j < n; j++) if (j !== 1 && j !== n - 1) vanuit++;
      return vanuit === fields[0].a && telDiagonalen(n) === fields[1].a;
    },
  };
}

const TABEL = 'Tabel met het aantal diagonalen van een veelhoek';
function tabelAfmaken() {
  const k = ri(5, 7),
    D = (m) => (m * (m - 3)) / 2,
    bekend = Array.from({ length: k - 2 }, (_, i) => i + 3),
    rows = [
      ['Hoekpunten', ...bekend.map(String), String(k + 1), String(k + 2)],
      ['Diagonalen', ...bekend.map((m) => String(D(m))), '?', '?'],
    ],
    fields = [
      { ...F(`${k + 1} hoekpunten:`, D(k + 1)), label: `Diagonalen bij ${k + 1} hoekpunten` },
      {
        ...F(`${k + 2} hoekpunten:`, D(k + 2)),
        label: `Diagonalen bij ${k + 2} hoekpunten`,
        br: true,
      },
    ];
  return {
    q:
      T('In de tabel staat hoeveel diagonalen een veelhoek heeft. Maak de tabel af.') +
      dt(rows, TABEL),
    fields,
    hint: T(
      'Kijk hoeveel diagonalen er steeds bij komen. Je kunt ook tellen: vanuit elk hoekpunt gaan er 3 minder dan het aantal hoekpunten, en zo tel je elke diagonaal twee keer.',
    ),
    steps: [
      `Er komt steeds 1 meer bij: ${bekend
        .slice(1)
        .map((m) => `${D(m - 1)} + ${m - 2} = ${D(m)}`)
        .join(', ')}.`,
      `Dus ${D(k)} + ${k - 1} = ${D(k + 1)} en ${D(k + 1)} + ${k} = ${D(k + 2)}.`,
      `Controle: ${k + 1} * ${k - 2} : 2 = ${D(k + 1)} en ${k + 2} * ${k - 1} : 2 = ${D(k + 2)}.`,
    ],
    traps: [
      {
        id: 'zelfde-stap',
        f: (v) =>
          v[0] === D(k) + (k - 2) || v[1] === D(k + 1) + (k - 1) || v[1] === D(k) + 2 * (k - 2),
        m: 'Er komt niet steeds evenveel bij. Het aantal dat erbij komt, wordt elke keer 1 groter.',
      },
      {
        id: 'dubbel-geteld',
        f: (v) => v[0] === 2 * D(k + 1) || v[1] === 2 * D(k + 2),
        m: 'Je hebt elke diagonaal twee keer geteld: een keer vanuit elk uiteinde. Deel dus nog door 2.',
      },
    ],
    // Tel bij elk aantal hoekpunten de paren die geen buren zijn.
    v: () =>
      bekend.every((m, i) => String(telDiagonalen(m)) === rows[1][i + 1]) &&
      telDiagonalen(k + 1) === fields[0].a &&
      telDiagonalen(k + 2) === fields[1].a,
  };
}

function terugredeneren() {
  const n = ri(5, 12),
    D = (n * (n - 3)) / 2,
    rij = Array.from({ length: n - 2 }, (_, i) => i + 3),
    // Wie vergeet te delen door 2, zoekt een aantal hoekpunten m met m * (m - 3) = D.
    zonderDelen = rij.find((m) => m * (m - 3) === D),
    fields = [
      { ...F('Hoekpunten:', n), label: 'Aantal hoekpunten' },
      {
        ...F('Diagonalen vanuit één hoekpunt:', n - 3),
        label: 'Aantal diagonalen vanuit één hoekpunt',
        br: true,
      },
    ];
  return {
    q: T(
      `Een veelhoek heeft ${D} diagonalen. Hoeveel hoekpunten heeft de veelhoek? Hoeveel diagonalen gaan er vanuit één hoekpunt?`,
    ),
    fields,
    hint: T(
      `Maak een tabel: een driehoek heeft 0 diagonalen, een vierhoek 2 en een vijfhoek 5. Er komt steeds 1 meer bij dan de vorige keer. Ga door tot je bij ${D} bent.`,
    ),
    steps: [
      'Maak een tabel. Er komt steeds 1 meer bij dan de vorige keer.',
      H(
        dt(
          [
            ['Hoekpunten', ...rij.map(String)],
            ['Diagonalen', ...rij.map((m) => String((m * (m - 3)) / 2))],
          ],
          'Uitwerking: tabel met het aantal diagonalen',
        ),
      ),
      `Bij ${n} hoekpunten horen ${D} diagonalen. Dus de veelhoek heeft ${n} hoekpunten: het is een ${NAAM[n]}.`,
      `Vanuit elk hoekpunt gaan ${n} - 3 = ${n - 3} diagonalen. Controle: ${n} * ${n - 3} : 2 = ${D}.`,
    ],
    traps: [
      {
        id: 'vanuit-een-punt',
        f: (v) => v[0] === D + 3,
        m: `Met ${D + 3} hoekpunten gaan er vanuit één hoekpunt al ${D} diagonalen. In totaal zijn het er dan veel meer. Maak een tabel.`,
      },
      zonderDelen && {
        id: 'dubbel-geteld',
        f: (v) => v[0] === zonderDelen,
        m: `Een ${NAAM[zonderDelen]} heeft ${zonderDelen} * ${zonderDelen - 3} : 2 = ${D / 2} diagonalen. Vergeet niet te delen door 2: anders tel je elke diagonaal twee keer.`,
      },
      {
        id: 'zijde-als-diagonaal',
        f: (v) => v[1] === n - 1 || v[1] === n - 2,
        m: 'Vanuit een hoekpunt kun je geen diagonaal tekenen naar dat hoekpunt zelf, en ook niet naar de twee buren: daar loopt een zijde naartoe.',
      },
    ].filter(Boolean),
    // Tel de diagonalen bij steeds meer hoekpunten, tot het aantal is bereikt.
    v: () => {
      const m = Array.from({ length: 40 }, (_, i) => i + 3).find((x) => telDiagonalen(x) >= D);
      return telDiagonalen(m) === D && m === fields[0].a && fields[1].a === m - 3;
    },
  };
}
const s168 = () => pick([aantalDiagonalen, tabelAfmaken, terugredeneren])();

// ---------------------------------------------------------------------------------------------
// 169: de diagonalen van een vierkant, een rechthoek en een ruit.

// Een vierkant, rechthoek of ruit met de diagonalen en hun snijpunt. Een rechthoek of vierkant
// staat recht, met de eerste letter linksonder. Een ruit staat op een punt, met de eerste letter
// links. ac en bd zijn de lengtes van de diagonalen in cm.
function vierhoekMetDiagonalen(soort, ac, bd) {
  const L = reeks(4),
    S = L.includes('S') ? 'M' : 'S',
    [A, B, C, D] = [...L];
  let pts;
  if (soort === 'ruit')
    pts = { [A]: [-ac / 2, 0], [B]: [0, -bd / 2], [C]: [ac / 2, 0], [D]: [0, bd / 2] };
  else {
    // De hoek tussen de diagonaal en de onderste zijde: 45° bij een vierkant.
    const h = soort === 'vierkant' ? Math.PI / 4 : (pick([30, 34, 38]) * Math.PI) / 180,
      w = ac * Math.cos(h),
      z = ac * Math.sin(h);
    pts = { [A]: [0, 0], [B]: [w, 0], [C]: [w, z], [D]: [0, z] };
  }
  pts[S] = [(pts[A][0] + pts[C][0]) / 2, (pts[A][1] + pts[C][1]) / 2];
  const AC = lijn(A, C),
    BD = lijn(B, D),
    recht = soort !== 'ruit',
    fig = geo({
      pts,
      segs: [...rand(L), A + C, B + D],
      rights: recht
        ? [0, 1, 2, 3].map((i) => ({ at: L[i], p: L[(i + 1) % 4], q: L[(i + 3) % 4] }))
        : [],
      off: { [S]: soort === 'ruit' ? [11, -9] : [0, -13] },
      w: 260,
      maxH: 200,
      desc: `${groot(soort)} ${L} met de diagonalen ${AC} en ${BD}. Ze snijden elkaar in ${S}.${recht ? ' Alle vier de hoeken zijn recht.' : ''}`,
    });
  return { L, S, A, B, C, D, AC, BD, pts, fig };
}
const afstand = (pts, p, q) => Math.hypot(pts[p][0] - pts[q][0], pts[p][1] - pts[q][1]);
// Het snijpunt van de lijnen door p1 en p2 en door q1 en q2.
function snijpunt(p1, p2, q1, q2) {
  const r = [p2[0] - p1[0], p2[1] - p1[1]],
    s = [q2[0] - q1[0], q2[1] - q1[1]],
    t = ((q1[0] - p1[0]) * s[1] - (q1[1] - p1[1]) * s[0]) / (r[0] * s[1] - r[1] * s[0]);
  return [p1[0] + t * r[0], p1[1] + t * r[1]];
}
const RUIT = 'Een ruit is een vierhoek met vier even lange zijden.';
// De diagonalen van een ruit in cm: eerst de lange, die horizontaal ligt.
const RUITEN = [
  [8, 6],
  [10, 6],
  [12, 8],
  [10, 4],
  [14, 8],
  [9, 6],
  [12, 7],
  [11, 5],
];
const WAT = {
  vierkant: 'Een vierkant is een rechthoek en ook een ruit.',
  rechthoek: '',
  ruit: RUIT,
};

function eigenschappen() {
  const soort = pick(['vierkant', 'rechthoek', 'ruit']),
    [ac, bd] = soort === 'ruit' ? pick(RUITEN) : [0, 0].fill(ri(5, 14)),
    f = vierhoekMetDiagonalen(soort, ac, bd),
    { AC, BD, S } = f,
    V = pick([f.A, f.C]),
    VS = V + S,
    gelijk = soort !== 'ruit',
    loodrecht = soort !== 'rechthoek',
    jn = (b) => (b ? 'ja' : 'nee'),
    fields = [
      {
        sel: ['ja', 'nee'],
        a: jn(gelijk),
        pre: `Zijn ${AC} en ${BD} even lang?`,
        label: `Zijn ${AC} en ${BD} even lang?`,
      },
      {
        sel: ['ja', 'nee'],
        a: jn(loodrecht),
        pre: `Snijden ${AC} en ${BD} elkaar in een rechte hoek?`,
        label: `Snijden ${AC} en ${BD} elkaar in een rechte hoek?`,
        br: true,
      },
      { ...F(`${VS} =`, ac / 2, 'cm'), label: `Lengte van ${VS}`, br: true },
    ];
  return {
    q: T(
      `${WAT[soort] ? WAT[soort] + ' ' : ''}Hieronder staat ${soort} ${f.L} met de diagonalen ${AC} en ${BD}. Ze snijden elkaar in ${S}. ${AC} = ${d(ac)} cm. Zijn de diagonalen even lang? Snijden ze elkaar in een rechte hoek? Hoe lang is ${VS}?`,
    ),
    fig: f.fig,
    fields,
    hint: T(
      'Kijk goed naar de figuur. Een vierkant is een rechthoek en ook een ruit. Wat geldt voor de diagonalen van elke rechthoek en van elke ruit, geldt dus ook voor een vierkant. Het snijpunt ligt in het midden van allebei de diagonalen.',
    ),
    steps:
      soort === 'vierkant'
        ? [
            `Een vierkant is een rechthoek, dus de diagonalen zijn even lang: ${AC} = ${BD}.`,
            'Een vierkant is ook een ruit, dus de diagonalen snijden elkaar in een rechte hoek.',
            `Het snijpunt ${S} ligt in het midden van allebei de diagonalen. Dus ${VS} = ${d(ac)} : 2 = ${d(ac / 2)} cm.`,
          ]
        : soort === 'rechthoek'
          ? [
              `In een rechthoek zijn de diagonalen even lang: ${AC} = ${BD}.`,
              `Ze snijden elkaar niet in een rechte hoek: de hoeken bij ${S} zijn niet allemaal even groot. Alleen bij een vierkant is dat wel zo.`,
              `Het snijpunt ${S} ligt in het midden van allebei de diagonalen. Dus ${VS} = ${d(ac)} : 2 = ${d(ac / 2)} cm.`,
            ]
          : [
              `In deze ruit is ${AC} langer dan ${BD}. De diagonalen zijn dus niet even lang. Alleen bij een vierkant is dat wel zo.`,
              'In een ruit snijden de diagonalen elkaar in een rechte hoek.',
              `Het snijpunt ${S} ligt in het midden van allebei de diagonalen. Dus ${VS} = ${d(ac)} : 2 = ${d(ac / 2)} cm.`,
            ],
    traps: [
      gelijk
        ? {
            id: 'diagonalen-niet-even-lang',
            f: (v) => v[0] === 'nee',
            m: `In een ${soort} zijn de diagonalen altijd even lang.`,
          }
        : {
            id: 'ruit-diagonalen-even-lang',
            f: (v) => v[0] === 'ja',
            m: `Kijk naar de figuur: ${AC} is langer dan ${BD}. In een ruit zijn de diagonalen alleen even lang als het een vierkant is.`,
          },
      loodrecht
        ? {
            id: 'geen-rechte-hoek-gezien',
            f: (v) => v[1] === 'nee',
            m: `In een ${soort} snijden de diagonalen elkaar altijd in een rechte hoek.`,
          }
        : {
            id: 'rechthoek-diagonalen-rechte-hoek',
            f: (v) => v[1] === 'ja',
            m: `Kijk naar de hoeken bij ${S}: ze zijn niet allemaal even groot. In een rechthoek snijden de diagonalen elkaar alleen in een rechte hoek als het een vierkant is.`,
          },
      {
        id: 'niet-gehalveerd',
        f: (v) => v[2] === ac,
        m: `${VS} gaat maar tot het snijpunt ${S}. ${S} ligt in het midden, dus ${VS} is de helft van ${AC}.`,
      },
    ],
    // Meet in de figuur: de lengtes van de diagonalen, het inproduct is 0 bij een rechte hoek, en
    // het stuk van V tot het snijpunt van de twee lijnen.
    v: () => {
      const p = f.pts,
        u = [p[f.C][0] - p[f.A][0], p[f.C][1] - p[f.A][1]],
        w = [p[f.D][0] - p[f.B][0], p[f.D][1] - p[f.B][1]],
        even = Math.abs(afstand(p, f.A, f.C) - afstand(p, f.B, f.D)) < 1e-9,
        rh = Math.abs(u[0] * w[0] + u[1] * w[1]) < 1e-9,
        s = snijpunt(p[f.A], p[f.C], p[f.B], p[f.D]);
      return (
        jn(even) === fields[0].a &&
        jn(rh) === fields[1].a &&
        Math.abs(Math.hypot(p[V][0] - s[0], p[V][1] - s[1]) - fields[2].a) < 1e-9
      );
    },
  };
}

function lengtes() {
  const soort = pick(['vierkant', 'rechthoek', 'ruit']),
    [ac, bd] = soort === 'ruit' ? pick(RUITEN) : [0, 0].fill(ri(5, 14)),
    f = vierhoekMetDiagonalen(soort, ac, bd),
    { AC, BD, S, pts } = f,
    ruit = soort === 'ruit',
    // Een hoekpunt op AC en een op BD, voor de stukken tot het snijpunt.
    V = pick([f.A, f.C]),
    W = pick([f.B, f.D]),
    VS = V + S,
    WS = W + S;
  const fields = ruit
    ? [
        { ...F(`${VS} =`, ac / 2, 'cm'), label: `Lengte van ${VS}` },
        { ...F(`${WS} =`, bd / 2, 'cm'), label: `Lengte van ${WS}`, br: true },
      ]
    : [
        { ...F(`${BD} =`, ac, 'cm'), label: `Lengte van ${BD}` },
        { ...F(`${WS} =`, ac / 2, 'cm'), label: `Lengte van ${WS}`, br: true },
      ];
  return {
    q: T(
      ruit
        ? `${RUIT} Hieronder staat ruit ${f.L} met de diagonalen ${AC} en ${BD}. Ze snijden elkaar in ${S}. ${AC} = ${d(ac)} cm en ${BD} = ${d(bd)} cm. Hoe lang zijn ${VS} en ${WS}?`
        : `Hieronder staat ${soort} ${f.L} met de diagonalen ${AC} en ${BD}. Ze snijden elkaar in ${S}. ${AC} = ${d(ac)} cm. Hoe lang zijn ${BD} en ${WS}?`,
    ),
    fig: f.fig,
    fields,
    hint: T(
      ruit
        ? `${S} ligt in het midden van allebei de diagonalen. Kijk op welke diagonaal ${VS} ligt, en op welke ${WS}.`
        : `In een ${soort} zijn de diagonalen even lang. ${S} ligt in het midden van allebei de diagonalen.`,
    ),
    steps: ruit
      ? [
          `${S} ligt in het midden van allebei de diagonalen.`,
          `${VS} is de helft van ${AC}: ${d(ac)} : 2 = ${d(ac / 2)} cm.`,
          `${WS} is de helft van ${BD}: ${d(bd)} : 2 = ${d(bd / 2)} cm.`,
        ]
      : [
          `In een ${soort} zijn de diagonalen even lang. Dus ${BD} = ${AC} = ${d(ac)} cm.`,
          `${S} ligt in het midden van ${BD}. Dus ${WS} is de helft: ${d(ac)} : 2 = ${d(ac / 2)} cm.`,
        ],
    traps: ruit
      ? [
          {
            id: 'niet-gehalveerd',
            f: (v) => v[0] === ac || v[1] === bd,
            m: `Dat is de hele diagonaal. ${VS} en ${WS} gaan maar tot het snijpunt ${S}, en ${S} ligt in het midden.`,
          },
          {
            id: 'andere-diagonaal',
            f: (v) => v[0] === bd / 2 || v[1] === ac / 2,
            m: `Kijk op welke diagonaal het stuk ligt. ${VS} ligt op ${AC} en ${WS} ligt op ${BD}. In een ruit zijn de diagonalen niet even lang.`,
          },
        ]
      : [
          {
            id: 'diagonaal-gehalveerd',
            f: (v) => v[0] === ac / 2,
            m: `${BD} is de hele diagonaal, niet de helft. In een ${soort} zijn de diagonalen even lang.`,
          },
          {
            id: 'niet-gehalveerd',
            f: (v) => v[1] === ac,
            m: `${WS} gaat maar tot het snijpunt ${S}. ${S} ligt in het midden, dus ${WS} is de helft van ${BD}.`,
          },
        ],
    // Bereken het snijpunt van de twee diagonalen en meet de stukken in de figuur.
    v: () => {
      const s = snijpunt(pts[f.A], pts[f.C], pts[f.B], pts[f.D]),
        tot = (k) => Math.hypot(pts[k][0] - s[0], pts[k][1] - s[1]),
        ok = (x, y) => Math.abs(x - y) < 1e-9;
      return ruit
        ? ok(afstand(pts, f.A, f.C), ac) && ok(tot(V), fields[0].a) && ok(tot(W), fields[1].a)
        : ok(afstand(pts, f.A, f.C), ac) &&
            ok(afstand(pts, f.B, f.D), fields[0].a) &&
            ok(tot(W), fields[1].a);
    },
  };
}
const s169 = () => pick([eigenschappen, lengtes])();

// ---------------------------------------------------------------------------------------------
// De uitleg.

// Een vaste vijfhoek met zijn diagonalen, voor het voorbeeld.
const VB = 'KLMNO',
  VB_PTS = punten(VB, 0, 1);
const VB_FIG = geo({
  pts: VB_PTS,
  segs: [...rand(VB), ...diagonalenVan(VB)],
  w: 220,
  maxH: 180,
  desc: 'Vijfhoek KLMNO met de diagonalen KM, KN, LN, LO en MO.',
});

export default {
  slug: 'veelhoeken-en-diagonalen',
  title: 'Veelhoeken en diagonalen',
  intro:
    'Een veelhoek heet naar het aantal hoekpunten, zoals een vijfhoek of een zeshoek. Hier leer je veelhoeken en hun zijden benoemen, en tel je de diagonalen: de lijnstukken tussen twee hoekpunten die geen buren zijn. Ook leer je wat er geldt voor de diagonalen van een vierkant, een rechthoek en een ruit.',
  description:
    'Veelhoeken en diagonalen oefenen: zijden en hoekpunten tellen, diagonalen tellen in een vijfhoek of zeshoek, en diagonalen van een ruit. Gratis met uitleg.',
  videos: {},
  skills: [
    [166, 'Veelhoeken en zijden benoemen', s166],
    [167, 'Diagonalen in een getekende veelhoek', s167],
    [168, 'Het aantal diagonalen van een veelhoek', s168],
    [169, 'Diagonalen van een vierkant, rechthoek en ruit', s169],
  ],
  learn: [
    {
      t: 'Veelhoeken',
      p: [
        'Een veelhoek is een figuur met rechte zijden. Hij heet naar het aantal hoekpunten: een driehoek heeft 3 hoekpunten, een vierhoek 4, een vijfhoek 5, een zeshoek 6, een zevenhoek 7 en een achthoek 8. Een veelhoek heeft evenveel zijden als hoekpunten.',
        'Je zet hoofdletters bij de hoekpunten, tegen de klok in, zoals bij vijfhoek KLMNO. Een zijde noem je met de twee hoekpunten aan de uiteinden, zoals KL. De laatste zijde gaat van O terug naar K: dat is zijde KO.',
      ],
      ex: {
        q: T('Welke zijden heeft zeshoek DEFGHI?'),
        steps: [
          'Ga rond langs de hoekpunten: D → E → F → G → H → I → D.',
          'De zijden zijn DE, EF, FG, GH, HI en DI. Dat zijn er 6.',
        ],
      },
      watch:
        'Vergeet de laatste zijde niet: die gaat van het laatste hoekpunt terug naar het eerste.',
    },
    {
      t: 'Diagonalen',
      p: [
        'Een diagonaal is een lijnstuk tussen twee hoekpunten die geen buren zijn. Je noemt een diagonaal met de twee hoekpunten, zoals KM.',
        'Vanuit een hoekpunt kun je geen diagonaal tekenen naar dat hoekpunt zelf, en ook niet naar de twee buren: daar loopt al een zijde naartoe. In een vijfhoek gaan er dus vanuit elk hoekpunt 5 - 3 = 2 diagonalen.',
      ],
      ex: {
        q: T('Hoeveel diagonalen heeft vijfhoek KLMNO?') + VB_FIG,
        steps: [
          'Vanuit elk hoekpunt gaan 2 diagonalen. Voor 5 hoekpunten is dat 5 * 2 = 10.',
          'Zo tel je elke diagonaal twee keer: KM tel je vanuit K en ook vanuit M. Dus 10 : 2 = 5.',
          'De diagonalen zijn KM, KN, LN, LO en MO.',
        ],
      },
      watch:
        'Tel je alleen vanuit één hoekpunt, dan mis je diagonalen. Tel je vanuit elk hoekpunt, deel dan door 2.',
    },
    {
      t: 'Hoeveel diagonalen?',
      p: [
        'Bij meer hoekpunten zijn er meer diagonalen. Zet het in een tabel: een driehoek heeft 0 diagonalen, een vierhoek 2, een vijfhoek 5 en een zeshoek 9. Er komt steeds 1 meer bij dan de vorige keer: 2, 3, 4, enzovoort.',
        'Met de tabel kun je ook terugredeneren. Heeft een veelhoek 14 diagonalen, dan zoek je 14 in de tabel. Daar horen 7 hoekpunten bij.',
      ],
      ex: {
        q: T('Hoeveel diagonalen heeft een tienhoek?'),
        steps: [
          'Vanuit één hoekpunt gaan 10 - 3 = 7 diagonalen.',
          '10 hoekpunten met elk 7 diagonalen: 10 * 7 = 70.',
          'Elke diagonaal heb je twee keer geteld. Dus 70 : 2 = 35.',
        ],
      },
    },
    {
      t: 'Diagonalen van een vierkant, rechthoek en ruit',
      p: [
        'Een ruit is een vierhoek met vier even lange zijden. Een vierkant is een rechthoek en ook een ruit.',
        'In een rechthoek zijn de diagonalen even lang. In een ruit snijden de diagonalen elkaar in een rechte hoek. Bij een vierkant geldt dus allebei.',
        'Bij alle drie ligt het snijpunt van de diagonalen in het midden van allebei de diagonalen.',
      ],
      ex: {
        q: T(
          'Rechthoek KLMN heeft diagonaal KM = 9 cm. De diagonalen snijden elkaar in S. Hoe lang zijn LN en LS?',
        ),
        steps: [
          'In een rechthoek zijn de diagonalen even lang. Dus LN = KM = 9 cm.',
          'S ligt in het midden van LN. Dus LS = 9 : 2 = 4,5 cm.',
        ],
      },
      watch:
        'In een rechthoek die geen vierkant is, snijden de diagonalen elkaar niet in een rechte hoek. In een ruit die geen vierkant is, zijn de diagonalen niet even lang.',
    },
  ],
};
