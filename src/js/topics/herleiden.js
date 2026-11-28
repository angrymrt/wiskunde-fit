// Onderwerp: Herleiden. Haakjes wegwerken en gelijksoortige termen samennemen, een factor of een min voor
// een haakjesproduct, en de drie merkwaardige producten. De leerling typt het herleide antwoord zelf, in
// een veld voor een uitdrukking (#304). Vraaggeneratoren staan bovenaan, de uitleg en de lijst met
// vraagsoorten onderaan.
import { ri, nz, pick, coin, until } from '../math.js';
import { H } from './shared.js';
import { T } from '../typeset.js';
import { UF, U, metUitdrukking, invullen } from '../uitdrukking.js';

// Letters voor een kale uitdrukking. Geen l, o of i: die lijken op 1 en 0. Bij de merkwaardige producten
// ook geen a en b, want die staan al in de regel (a + b)² = a² + 2ab + b².
const LETTERS = ['x', 'p', 'n', 't', 'y', 'k', 'm', 'q', 'r', 's', 'v', 'w', 'd', 'g', 'h', 'z'];
const ALLE_LETTERS = [...LETTERS, 'a', 'b'];
const PAREN = [
  ['x', 'y'],
  ['p', 'q'],
  ['m', 'n'],
  ['s', 't'],
  ['k', 'm'],
  ['d', 'g'],
  ['r', 's'],
  ['v', 'w'],
  ['n', 'y'],
  ['h', 'k'],
];

// ---------------------------------------------------------------------------------------------------
// Een veelterm is een lijst termen { c, m }: een heel getal c en de letters m, zoals { x: 2 } voor x².

// De letters van een term als tekst, op alfabet: { y: 1, x: 2 } is x^2y.
const sleutel = (m) =>
  Object.keys(m)
    .sort()
    .map((l) => (m[l] === 1 ? l : `${l}^${m[l]}`))
    .join('');
const graad = (m) => Object.values(m).reduce((s, e) => s + e, 0);
// Eén term: t(3, 'x') is 3x, t(-2, 'x', 'x') is −2x², t(5) is 5.
function t(c, ...letters) {
  const m = {};
  for (const l of letters) m[l] = (m[l] || 0) + 1;
  return { c, m };
}
const keerTerm = (a, b) => {
  const m = { ...a.m };
  for (const l in b.m) m[l] = (m[l] || 0) + b.m[l];
  return { c: a.c * b.c, m };
};
// Elke term van a keer elke term van b, zonder samen te nemen, in de volgorde zoals je het opschrijft.
const keer = (a, b) => a.flatMap((x) => b.map((y) => keerTerm(x, y)));
const schaal = (a, k) => a.map((x) => ({ c: x.c * k, m: x.m }));
const kwadraat = (a) => keer(a, a);
// Neemt de gelijksoortige termen samen en laat de termen met 0 weg. De hoogste graad staat vooraan; bij
// dezelfde graad blijft de volgorde waarin de termen ontstaan, zoals a² + 2ab + b².
function samen(...lijsten) {
  return opVolgorde(...lijsten).sort((a, b) => graad(b.m) - graad(a.m));
}
// Hetzelfde, maar in de volgorde waarin de termen ontstaan, zoals 64 − 9w² bij (8 + 3w)(8 − 3w).
function opVolgorde(...lijsten) {
  const per = new Map();
  for (const x of lijsten.flat()) {
    const k = sleutel(x.m);
    if (per.has(k)) per.get(k).c += x.c;
    else per.set(k, { c: x.c, m: x.m });
  }
  return [...per.values()].filter((x) => x.c !== 0);
}
// Of twee veeltermen gelijk zijn.
const zelfde = (a, b) => samen(a, schaal(b, -1)).length === 0;
// De veelterm als tekst zoals een leerling hem typt: 4p^2 - 20p + 25, zonder + - en zonder 1x.
function tekst(a) {
  if (!a.length) return '0';
  return a
    .map((x, i) => {
      const k = sleutel(x.m),
        n = Math.abs(x.c),
        term = k ? `${n === 1 ? '' : n}${k}` : `${n}`;
      return i ? `${x.c < 0 ? '-' : '+'} ${term}` : `${x.c < 0 ? '-' : ''}${term}`;
    })
    .join(' ');
}
// Een tweeterm tussen haakjes, en een term met zijn getal: (2p + 5), 3m.
const haakjes = (a) => `(${tekst(a)})`;
// Een getal voor haakjes: -3(…), -(…), 4(…). Met plus erbij als het geen eerste term is: + 4(…), - (…).
const voor = (k, eerste = true) =>
  eerste
    ? k === 1
      ? ''
      : k === -1
        ? '-'
        : `${k}`
    : `${k < 0 ? '-' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}`;
// Een term die niet vooraan staat, met zijn teken: + 5t of - 7.
const metTeken = (x) => tekst([t(1), x]).slice(2);
// Een melding na een valkuil is gewone tekst: x^2 wordt x², en een min wordt een echt minteken.
const gewoon = (s) => String(s).replace(/\^2/g, '²').replace(/-/g, '−').replace(/ \* /g, ' · ');

// Een regel met tekst en wiskunde: zin('Het kwadraat van ', W('3m'), ' is ', W('9m^2'), '.'). De tekst gaat
// door T, de wiskunde door U, zoals in het veld.
const W = (s) => ({ w: s });
const zin = (...delen) => delen.map((d) => (typeof d === 'string' ? T(d) : U(d.w))).join('');
const rij = (s) => H(U(s));

// De valkuilen met een foute uitdrukking. Een fout antwoord dat gelijk is aan het goede antwoord of aan
// een eerdere valkuil, valt weg: zo is een valkuil nooit het goede antwoord, en heeft elk fout antwoord
// één melding.
function valkuilen(goed, lijst) {
  const gezien = [goed];
  const uit = [];
  for (const { id, als, m } of lijst) {
    const fout = als.filter((a) => {
      if (gezien.some((g) => zelfde(g, a))) return false;
      gezien.push(a);
      return true;
    });
    if (fout.length) uit.push({ id, als: fout.map(tekst), m: gewoon(m) });
  }
  return uit;
}

// v vult in de opgave en in het antwoord dezelfde getallen in en vergelijkt. Zo rekent v met de
// uitdrukking zelf, en niet met de veeltermen waarmee de generator het antwoord maakt. Een veelterm van
// graad 2 in één letter die op drie plekken gelijk is, is overal gelijk.
const PUNTEN = [
  [2, -3],
  [-1, 4],
  [5, 2],
  [-4, -2],
];
const klopt = (opgave, antwoord, letters) =>
  PUNTEN.every((p) => {
    const w = Object.fromEntries(letters.map((l, i) => [l, p[i]]));
    return invullen(opgave, w) === invullen(antwoord, w);
  });

// Maakt de vraag: "Herleid …." met een veld voor de uitdrukking.
function vraag({ opgave, goed, letters, hint, steps, traps }) {
  const antwoord = tekst(goed);
  return metUitdrukking({
    q: `${T('{{herleiden|Herleid}}')} ${U(opgave)}.`,
    fields: [UF('', antwoord, { letters: [...letters].sort().join('') })],
    hint,
    steps,
    traps: valkuilen(goed, traps),
    v: () => klopt(opgave, antwoord, letters),
  });
}

// Het dubbelproduct van twee termen, als zin bij de uitwerking: Het dubbelproduct van 2p en 5 is
// 2 · 2p · 5 = 20p. Bij (a − b)² staat erbij dat je het aftrekt.
function dubbelZin(A, B, min) {
  const dp = samen(schaal(keer(A, B), 2));
  return H(
    zin(
      'Het {{dubbelproduct|dubbelproduct}} van ',
      W(tekst(A)),
      ' en ',
      W(tekst(B)),
      ' is ',
      W(`2 · ${tekst(A)} · ${tekst(B)} = ${tekst(dp)}`),
      min ? '. Er staat een min tussen de termen, dus je trekt het af.' : '.',
    ),
  );
}
// De kwadraten, als zin: (2p)² = 4p² en 5² = 25. Een kale letter of 1 hoeft niet.
function kwadraatZin(A, B) {
  const een = (X) => `${X.length === 1 && X[0].c === 1 ? tekst(X) : `(${tekst(X)})`}^2`;
  const delen = [A, B]
    .filter((X) => !(X[0].c === 1 && Object.keys(X[0].m).length))
    .map((X) =>
      W(`${Object.keys(X[0].m).length ? een(X) : `${X[0].c}^2`} = ${tekst(samen(kwadraat(X)))}`),
    );
  if (!delen.length) return [];
  return [H(zin(...(delen.length === 2 ? [delen[0], ' en ', delen[1]] : delen), '.'))];
}

// ---------------------------------------------------------------------------------------------------
// 237. Haakjes wegwerken en gelijksoortige termen samennemen: een term met k(…) ervoor of erachter, twee
// keer k(…), of twee tweetermen keer elkaar.
function s237samennemen() {
  const L = pick(ALLE_LETTERS),
    soort = pick(['ervoor', 'erachter', 'twee', 'product']);
  const B = (p, q) => [t(p, L), t(q)];
  if (soort === 'product') {
    const [p1, q1, p2, q2] = until(
      () => [ri(1, 3), nz(-9, 9), ri(1, 3), nz(-9, 9)],
      ([p1, q1, p2, q2]) => p1 * q2 + q1 * p2 !== 0 && (p1 !== p2 || q1 !== q2),
    );
    const A1 = B(p1, q1),
      A2 = B(p2, q2),
      vier = keer(A1, A2),
      goed = samen(vier),
      opgave = `${haakjes(A1)}${haakjes(A2)}`;
    return vraag({
      opgave,
      goed,
      letters: [L],
      hint: T(
        `Vermenigvuldig elke {{term|term}} van de eerste haakjes met elke term van de tweede. Neem daarna de {{gelijksoortige-termen|gelijksoortige termen}} samen.`,
      ),
      steps: [rij(opgave), rij(`= ${tekst(vier)}`), rij(`= ${tekst(goed)}`)],
      traps: [
        {
          id: 'middelste-termen-vergeten',
          als: [samen([vier[0], vier[3]])],
          m: `Vermenigvuldig elke term van de eerste haakjes met elke term van de tweede. Dan krijg je ook twee termen met ${L}.`,
        },
      ],
    });
  }
  // Eén of twee keer k(…), met een losse term ervoor of erachter.
  const [k1, p1, q1, k2, p2, q2, los, losLetter] = until(
    () => [
      pick([-6, -5, -4, -3, -2, -1, 2, 3, 4, 5, 6]),
      ri(1, 5),
      nz(-9, 9),
      pick([-6, -5, -4, -3, -2, -1, 2, 3, 4, 5, 6]),
      ri(1, 5),
      nz(-9, 9),
      nz(-9, 9),
      coin(),
    ],
    (x) => samen(...delen(soort, L, x)).length === 2,
  );
  const x = [k1, p1, q1, k2, p2, q2, los, losLetter],
    goed = samen(...delen(soort, L, x)),
    losTerm = losLetter ? t(los, L) : t(los),
    H1 = B(p1, q1),
    H2 = B(p2, q2);
  const opgave =
    soort === 'ervoor'
      ? `${tekst([losTerm])} ${voor(k1, false)}${haakjes(H1)}`
      : soort === 'erachter'
        ? `${voor(k1)}${haakjes(H1)} ${metTeken(losTerm)}`
        : `${voor(k1)}${haakjes(H1)} ${voor(k2, false)}${haakjes(H2)}`;
  const weg = delen(soort, L, x).flat();
  // De laatste haakjes, waar de fout meestal zit: bij twee keer k(…) de tweede.
  const [k, Hk] = soort === 'twee' ? [k2, H2] : [k1, H1];
  const rest = soort === 'twee' ? schaal(H1, k1) : [losTerm];
  const traps = [
    {
      id: 'haakjes-vergeten',
      als: [samen(rest, [keerTerm(Hk[0], t(k)), Hk[1]])],
      m:
        k === -1
          ? 'Denk aan de haakjes: een min voor de haakjes verandert het teken van elke term tussen de haakjes.'
          : `Denk aan de haakjes: vermenigvuldig elke term tussen de haakjes met ${k}.`,
    },
  ];
  if (k < 0)
    traps.push({
      id: Hk[1].c < 0 ? 'min-keer-min' : 'min-bij-een-term',
      als: [samen(rest, [keerTerm(Hk[0], t(k)), t(-k * Hk[1].c)])],
      m:
        Hk[1].c < 0
          ? `Let op het teken: min keer min is plus, dus ${k} * ${Hk[1].c} = ${k * Hk[1].c}.`
          : `Let op het teken: vermenigvuldig ook de tweede term met ${k}, dus ${k} * ${Hk[1].c} = ${k * Hk[1].c}.`,
    });
  return vraag({
    opgave,
    goed,
    letters: [L],
    hint: T(
      'Vermenigvuldig het getal voor de haakjes met elke {{term|term}} tussen de haakjes. Neem daarna de {{gelijksoortige-termen|gelijksoortige termen}} samen.',
    ),
    steps: [rij(opgave), rij(`= ${tekst(weg)}`), rij(`= ${tekst(goed)}`)],
    traps,
  });
}
// De termen van s237samennemen zonder haakjes, in de volgorde van de opgave.
function delen(soort, L, [k1, p1, q1, k2, p2, q2, los, losLetter]) {
  const losTerm = losLetter ? t(los, L) : t(los),
    een = schaal([t(p1, L), t(q1)], k1);
  if (soort === 'ervoor') return [[losTerm], een];
  if (soort === 'erachter') return [een, [losTerm]];
  return [een, schaal([t(p2, L), t(q2)], k2)];
}

// 238. Een factor voor twee haakjes: eerst het product tussen haakjes, dan elke term keer de factor.
function s238factor() {
  const L = pick(LETTERS);
  const [f, p, q1, q2] = until(
    () => [pick([-5, -4, -3, -2, 2, 3, 4, 5]), pick([1, 1, 1, 2, 3]), nz(-8, 8), nz(-8, 8)],
    ([, p, q1, q2]) => q1 + p * q2 !== 0 && (p !== 1 || q1 !== q2),
  );
  const A1 = [t(p, L), t(q1)],
    A2 = [t(1, L), t(q2)],
    vier = keer(A1, A2),
    binnen = samen(vier),
    goed = schaal(binnen, f),
    opgave = `${f}${haakjes(A1)}${haakjes(A2)}`;
  const steps = [rij(opgave), rij(`= ${f}(${tekst(vier)})`), rij(`= ${f}(${tekst(binnen)})`)];
  steps.push(rij(`= ${tekst(goed)}`));
  return vraag({
    opgave,
    goed,
    letters: [L],
    hint: T(
      `Werk eerst de twee haakjes weg en laat het resultaat tussen haakjes staan. Vermenigvuldig daarna elke {{term|term}} met ${f}.`,
    ),
    steps,
    traps: [
      {
        id: 'haakjes-vergeten',
        als: [[keerTerm(binnen[0], t(f)), ...binnen.slice(1)]],
        m: `Denk aan de haakjes: vermenigvuldig elke term van ${tekst(binnen)} met ${f}.`,
      },
      {
        id: 'factor-twee-keer',
        als: [schaal(binnen, f * f)],
        m: `Het getal ${f} staat maar één keer vooraan. Werk eerst de twee haakjes weg en vermenigvuldig daarna één keer met ${f}.`,
      },
      {
        id: 'middelste-termen-vergeten',
        als: [schaal(samen([vier[0], vier[3]]), f)],
        m: `Vermenigvuldig elke term van de eerste haakjes met elke term van de tweede. Dan krijg je ook twee termen met ${L}.`,
      },
    ],
  });
}

// 239. Een min voor een haakjesproduct: 2t² − (t + 4)(t − 7), (t + 6)(t − 2) − (t − 3)(t + 8) of
// (4t)² − 3t(5t − 2). Denk aan de haakjes.
function s239min() {
  const L = pick(LETTERS),
    soort = pick(['term', 'twee', 'kwadraat']);
  const lin = (q) => [t(1, L), t(q)];
  const minHint = T(
    'Denk aan de haakjes: werk eerst het product weg en zet het resultaat tussen haakjes. De min voor de haakjes verandert het teken van elke {{term|term}}.',
  );
  const minBijEen = (voorop, binnen) => ({
    id: 'min-bij-een-term',
    als: [samen(voorop, schaal(binnen.slice(0, 1), -1), binnen.slice(1))],
    m: `Denk aan de haakjes: de min hoort bij elke term van ${tekst(binnen)}. Zet het product eerst tussen haakjes.`,
  });
  if (soort === 'kwadraat') {
    // (kx)² − mx(px + q)
    const [k, m, p, q] = until(
      () => [ri(2, 5), ri(1, 5), ri(1, 6), nz(-9, 9)],
      ([k, m, p]) => k * k !== m * p,
    );
    const kk = [t(k * k, L, L)],
      binnen = keer([t(m, L)], [t(p, L), t(q)]),
      goed = samen(kk, schaal(binnen, -1)),
      opgave = `(${k}${L})^2 - ${m === 1 ? '' : m}${L}${haakjes([t(p, L), t(q)])}`;
    return vraag({
      opgave,
      goed,
      letters: [L],
      hint: zin(
        'Bij ',
        W(`(${k}${L})^2`),
        ' neem je het {{kwadraat|kwadraat}} van het getal én van de letter: ',
        W(`(${k}${L})^2 = ${k}${L} · ${k}${L}`),
        '. Werk daarna de haakjes weg. De min hoort bij elke term.',
      ),
      steps: [
        rij(opgave),
        rij(`= ${tekst(kk)} - ${haakjes(binnen)}`),
        rij(`= ${tekst([...kk, ...schaal(binnen, -1)])}`),
        rij(`= ${tekst(goed)}`),
      ],
      traps: [
        minBijEen(kk, binnen),
        {
          id: 'getal-niet-in-kwadraat',
          als: [samen([t(k, L, L)], schaal(binnen, -1))],
          m: `(${k}${L})^2 = ${k}${L} * ${k}${L} = ${k * k}${L}^2. Ook het getal moet in het kwadraat.`,
        },
      ],
    });
  }
  const [q1, q2] = until(
    () => [nz(-9, 9), nz(-9, 9)],
    ([a, b]) => a + b !== 0 && a !== b,
  );
  const vier = keer(lin(q1), lin(q2)),
    binnen = samen(vier),
    product = `${haakjes(lin(q1))}${haakjes(lin(q2))}`;
  if (soort === 'twee') {
    // (x + r1)(x + r2) − (x + q1)(x + q2), met een antwoord dat niet 0 is.
    const [r1, r2] = until(
      () => [nz(-9, 9), nz(-9, 9)],
      ([a, b]) => a + b !== 0 && a !== b && !zelfde(samen(keer(lin(a), lin(b))), binnen),
    );
    const vier1 = keer(lin(r1), lin(r2)),
      eerst = samen(vier1),
      goed = samen(eerst, schaal(binnen, -1)),
      opgave = `${haakjes(lin(r1))}${haakjes(lin(r2))} - ${product}`;
    return vraag({
      opgave,
      goed,
      letters: [L],
      hint: minHint,
      steps: [
        rij(opgave),
        rij(`= ${tekst(vier1)} - (${tekst(vier)})`),
        rij(`= ${tekst(eerst)} - ${haakjes(binnen)}`),
        rij(`= ${tekst([...eerst, ...schaal(binnen, -1)])}`),
        rij(`= ${tekst(goed)}`),
      ],
      traps: [minBijEen(eerst, binnen)],
    });
  }
  // mx² − (x + q1)(x + q2)
  const m = pick([1, 1, 2, 3, 4]),
    voorop = [t(m, L, L)],
    goed = samen(voorop, schaal(binnen, -1)),
    opgave = `${tekst(voorop)} - ${product}`;
  return vraag({
    opgave,
    goed,
    letters: [L],
    hint: minHint,
    steps: [
      rij(opgave),
      rij(`= ${tekst(voorop)} - (${tekst(vier)})`),
      rij(`= ${tekst(voorop)} - ${haakjes(binnen)}`),
      rij(`= ${tekst([...voorop, ...schaal(binnen, -1)])}`),
      rij(`= ${tekst(goed)}`),
    ],
    traps: [
      minBijEen(voorop, binnen),
      {
        id: 'middelste-termen-vergeten',
        als: [samen(voorop, schaal(samen([vier[0], vier[3]]), -1))],
        m: `Vermenigvuldig elke term van de eerste haakjes met elke term van de tweede. Dan krijg je ook twee termen met ${L}.`,
      },
    ],
  });
}

// De twee termen A en B van een merkwaardig product: px en c, c en px, of px en qy.
function tweeTermen(soort) {
  if (soort === 'letters') {
    const [X, Y] = pick(PAREN);
    return { A: [t(ri(1, 5), X)], B: [t(ri(1, 5), Y)], letters: [X, Y] };
  }
  const L = pick(LETTERS),
    p = soort === 'kaal' ? 1 : ri(2, 5),
    c = soort === 'kaal' ? ri(1, 12) : ri(1, 9);
  return soort === 'getal-eerst'
    ? { A: [t(c)], B: [t(p, L)], letters: [L] }
    : { A: [t(p, L)], B: [t(c)], letters: [L] };
}
const plus = (A, B) => [...A, ...B];
const min = (A, B) => [...A, ...schaal(B, -1)];
// Het kwadraat van één term als veelterm.
const kw = (A) => samen(kwadraat(A));

// De valkuilen bij (A + B)(A − B) = A² − B².
function verschilValkuilen(A, B, f = 1, omgedraaid = false) {
  const A2 = kw(A),
    B2 = kw(B),
    AB = samen(schaal(keer(A, B), 2)),
    F = (x) => schaal(samen(x), f);
  return [
    {
      id: 'middenterm',
      als: [F([...A2, ...AB, ...schaal(B2, -1)]), F([...A2, ...schaal(AB, -1), ...schaal(B2, -1)])],
      m: 'Bij (a + b)(a - b) vallen de twee middelste termen tegen elkaar weg: ab - ab = 0. Je houdt a^2 - b^2 over.',
    },
    {
      id: 'plus-kwadraat',
      als: [F([...A2, ...B2])],
      m: 'Plus keer min is min. Het wordt a^2 - b^2, met een min.',
    },
    {
      id: 'getal-niet-in-kwadraat',
      als: [
        F([...nietKw(A), ...schaal(B2, -1)]),
        F([...A2, ...schaal(nietKw(B), -1)]),
        F([...nietKw(A), ...schaal(nietKw(B), -1)]),
      ],
      m: helKwadraat(A, B),
    },
    {
      id: 'volgorde-omgedraaid',
      als: omgedraaid ? [F([...B2, ...schaal(A2, -1)])] : [],
      m: 'Kijk welke term in allebei de haakjes hetzelfde teken heeft. Het kwadraat daarvan staat voorop, met plus. Het kwadraat van de andere term trek je af.',
    },
  ];
}
// De letters van een term als lijst: { x: 2 } is ['x', 'x'].
const letters = (x) => Object.entries(x.m).flatMap(([l, e]) => Array(e).fill(l));
// De fout (2x)² = 2x²: alleen de letter in het kwadraat, en 5² = 5: het getal niet.
const nietKw = (A) => {
  const x = A[0];
  return Object.keys(x.m).length ? [t(x.c, ...letters(x), ...letters(x))] : [t(x.c)];
};
// (3m)^2 = 9m^2 of 5^2 = 25, voor een melding.
const kwTekst = (A) => {
  const x = A[0],
    k = Object.keys(x.m).length;
  return `${k && x.c !== 1 ? `(${tekst(A)})` : tekst(A)}^2 = ${tekst(kw(A))}`;
};
// De melding bij getal-niet-in-kwadraat, alleen met de termen waar het getal meetelt: niet bij x of 1.
const helKwadraat = (A, B) =>
  `Neem het hele kwadraat van elke term: ${[A, B]
    .filter((X) => !zelfde(nietKw(X), kw(X)))
    .map(kwTekst)
    .join(' en ')}.`;

// De valkuilen bij (A ± B)² = A² ± 2AB + B², met f ervoor.
function kwadraatValkuilen(A, B, s, f = 1) {
  const A2 = kw(A),
    B2 = kw(B),
    AB = samen(keer(A, B)),
    F = (x) => schaal(samen(x), f),
    regel = s > 0 ? '(a + b)^2 = a^2 + 2ab + b^2' : '(a - b)^2 = a^2 - 2ab + b^2';
  return [
    {
      id: 'dubbelproduct-vergeten',
      als: [F([...A2, ...B2]), F([...A2, ...schaal(B2, -1)])],
      m: `Vergeet het dubbelproduct niet: ${regel}.`,
    },
    {
      id: 'dubbelproduct-zonder-2',
      als: [F([...A2, ...schaal(AB, s), ...B2])],
      m: `Het dubbelproduct is 2 keer het product van de twee termen: 2 * ${tekst(A)} * ${tekst(B)} = ${tekst(schaal(AB, 2))}.`,
    },
    {
      id: 'getal-niet-in-kwadraat',
      als: [
        F([...nietKw(A), ...schaal(AB, 2 * s), ...B2]),
        F([...A2, ...schaal(AB, 2 * s), ...nietKw(B)]),
      ],
      m: helKwadraat(A, B),
    },
    ...(s < 0
      ? [
          {
            id: 'teken-dubbelproduct',
            als: [F([...A2, ...schaal(AB, 2), ...B2])],
            m: `Bij ${regel.split(' = ')[0]} trek je het dubbelproduct af: ${regel}.`,
          },
        ]
      : []),
    {
      id: 'min-kwadraat',
      als: [F([...A2, ...schaal(AB, 2 * s), ...schaal(B2, -1)])],
      m: 'Een kwadraat is nooit negatief: min keer min is plus. Het laatste kwadraat komt er dus bij.',
    },
  ];
}

// 240. Het merkwaardig product (a + b)(a − b) = a² − b².
function s240verschil() {
  const soort = pick(['kaal', 'getal', 'getal-eerst', 'letters']),
    { A, B, letters: ls } = tweeTermen(soort),
    omgekeerd = coin(),
    eerst = omgekeerd ? min(A, B) : plus(A, B),
    dan = omgekeerd ? plus(A, B) : min(A, B),
    opgave = `${haakjes(eerst)}${haakjes(dan)}`,
    goed = opVolgorde(kw(A), schaal(kw(B), -1));
  return vraag({
    opgave,
    goed,
    letters: ls,
    hint: zin(
      'Gebruik het {{merkwaardig-product|merkwaardig product}} ',
      W('(a + b)(a - b) = a^2 - b^2'),
      '. De twee middelste termen vallen weg.',
    ),
    steps: [rij(`${opgave} = ${tekst(goed)}`), ...kwadraatZin(A, B)],
    traps: verschilValkuilen(A, B, 1, soort === 'getal-eerst'),
  });
}

// 241. De merkwaardige producten (a + b)² en (a − b)², ook met een getal voor de letter en met twee
// letters.
function s241kwadraat() {
  const soort = pick(['kaal', 'kaal', 'getal', 'getal-eerst', 'letters']),
    { A, B, letters: ls } = tweeTermen(soort),
    s = coin() ? 1 : -1,
    opgave = `${haakjes(s > 0 ? plus(A, B) : min(A, B))}^2`,
    goed = opVolgorde(kw(A), schaal(keer(A, B), 2 * s), kw(B));
  return vraag({
    opgave,
    goed,
    letters: ls,
    hint: zin(
      'Gebruik het {{merkwaardig-product|merkwaardig product}} ',
      W(s > 0 ? '(a + b)^2 = a^2 + 2ab + b^2' : '(a - b)^2 = a^2 - 2ab + b^2'),
      '. Het middelste stuk is het {{dubbelproduct|dubbelproduct}}.',
    ),
    steps: [rij(`${opgave} = ${tekst(goed)}`), dubbelZin(A, B, s < 0), ...kwadraatZin(A, B)],
    traps: kwadraatValkuilen(A, B, s),
  });
}

// 242. Gemengd: een merkwaardig product met een factor of een min ervoor, met een term ervoor, of met de
// termen in een andere volgorde, zoals (n + y)(y − n).
function s242gemengd() {
  const soort = pick(['factor-kwadraat', 'min-kwadraat', 'factor-verschil', 'volgorde', 'term']);
  if (soort === 'volgorde') {
    // (B + A)(A − B) of (A + B)(B − A): in de eerste haakjes staan de termen andersom.
    const letters2 = coin(),
      { A, B, letters: ls } = tweeTermen(letters2 ? 'letters' : pick(['kaal', 'getal'])),
      [P, Q] = coin() ? [A, B] : [B, A],
      opgave = `${haakjes(plus(Q, P))}${haakjes(min(P, Q))}`,
      goed = opVolgorde(kw(P), schaal(kw(Q), -1));
    return vraag({
      opgave,
      goed,
      letters: ls,
      hint: zin(
        'Zet de termen in de eerste haakjes om, zodat je ',
        W('(a + b)(a - b)'),
        ' ziet. De term met hetzelfde teken in allebei de haakjes is a.',
      ),
      steps: [
        rij(opgave),
        rij(`= ${haakjes(plus(P, Q))}${haakjes(min(P, Q))}`),
        rij(`= ${tekst(goed)}`),
        ...kwadraatZin(P, Q),
      ],
      traps: verschilValkuilen(P, Q, 1, true),
    });
  }
  const L = pick(LETTERS),
    A = [t(soort === 'factor-verschil' ? pick([1, 1, 2, 3]) : 1, L)],
    B = [t(ri(1, 9))];
  if (soort === 'factor-verschil') {
    const f = pick([-5, -4, -3, -2, 2, 3, 4, 5]),
      binnen = opVolgorde(kw(A), schaal(kw(B), -1)),
      goed = schaal(binnen, f),
      opgave = `${f}${haakjes(plus(A, B))}${haakjes(min(A, B))}`;
    return vraag({
      opgave,
      goed,
      letters: [L],
      hint: zin(
        'Werk eerst het {{merkwaardig-product|merkwaardig product}} weg: ',
        W('(a + b)(a - b) = a^2 - b^2'),
        `. Laat het resultaat tussen haakjes staan en vermenigvuldig elke term met ${f}.`,
      ),
      steps: [
        rij(opgave),
        rij(`= ${f}${haakjes(binnen)}`),
        ...kwadraatZin(A, B),
        rij(`= ${tekst(goed)}`),
      ],
      traps: [
        {
          id: 'haakjes-vergeten',
          als: [[keerTerm(binnen[0], t(f)), binnen[1]]],
          m: `Denk aan de haakjes: vermenigvuldig elke term van ${tekst(binnen)} met ${f}.`,
        },
        ...verschilValkuilen(A, B, f),
      ],
    });
  }
  const s = coin() ? 1 : -1,
    tweeterm = s > 0 ? plus(A, B) : min(A, B),
    binnen = opVolgorde(kw(A), schaal(keer(A, B), 2 * s), kw(B)),
    kwadr = `${haakjes(tweeterm)}^2`,
    regel = s > 0 ? '(a + b)^2 = a^2 + 2ab + b^2' : '(a - b)^2 = a^2 - 2ab + b^2';
  if (soort === 'term') {
    // mx² − (x ± c)²
    const m = pick([1, 2, 3, 4]),
      voorop = [t(m, L, L)],
      goed = samen(voorop, schaal(binnen, -1)),
      opgave = `${tekst(voorop)} - ${kwadr}`;
    return vraag({
      opgave,
      goed,
      letters: [L],
      hint: zin(
        'Werk eerst het kwadraat weg met ',
        W(regel),
        ' en zet het resultaat tussen haakjes. De min voor de haakjes verandert het teken van elke {{term|term}}.',
      ),
      steps: [
        rij(opgave),
        rij(`= ${tekst(voorop)} - ${haakjes(binnen)}`),
        dubbelZin(A, B, s < 0),
        rij(`= ${tekst([...voorop, ...schaal(binnen, -1)])}`),
        rij(`= ${tekst(goed)}`),
      ],
      traps: [
        {
          id: 'min-bij-een-term',
          als: [samen(voorop, schaal(binnen.slice(0, 1), -1), binnen.slice(1))],
          m: `Denk aan de haakjes: de min hoort bij elke term van ${tekst(binnen)}. Werk eerst het kwadraat weg en zet het resultaat tussen haakjes.`,
        },
        {
          id: 'dubbelproduct-vergeten',
          als: [samen(voorop, schaal(samen(kw(A), kw(B)), -1))],
          m: `Vergeet het dubbelproduct niet: ${regel}.`,
        },
      ],
    });
  }
  // f(x ± c)² of −(x ± c)²
  const f = soort === 'min-kwadraat' ? -1 : pick([-4, -3, -2, 2, 3, 4, 5]),
    goed = schaal(binnen, f),
    opgave = `${voor(f)}${kwadr}`;
  const traps = [
    {
      id: f === -1 ? 'min-bij-een-term' : 'haakjes-vergeten',
      als: [[keerTerm(binnen[0], t(f)), ...binnen.slice(1)]],
      m:
        f === -1
          ? `Denk aan de haakjes: de min hoort bij elke term van ${tekst(binnen)}.`
          : `Denk aan de haakjes: vermenigvuldig elke term van ${tekst(binnen)} met ${f}.`,
    },
    {
      id: f === -1 ? 'min-in-kwadraat' : 'factor-in-kwadraat',
      als: [f === -1 ? binnen : schaal(binnen, f * f)],
      m:
        f === -1
          ? 'De min staat buiten het kwadraat. Werk eerst het kwadraat weg en zet de min daarna voor elke term.'
          : `Het getal ${f} staat buiten het kwadraat. Werk eerst het kwadraat weg en vermenigvuldig daarna met ${f}.`,
    },
    ...kwadraatValkuilen(A, B, s, f),
  ];
  return vraag({
    opgave,
    goed,
    letters: [L],
    hint: zin(
      'Werk eerst het kwadraat weg met ',
      W(regel),
      ` en laat het resultaat tussen haakjes staan. ${f === -1 ? 'Verander daarna het teken van elke {{term|term}}.' : `Vermenigvuldig daarna elke {{term|term}} met ${f}.`}`,
    ),
    steps: [
      rij(opgave),
      rij(`= ${voor(f)}${haakjes(binnen)}`),
      dubbelZin(A, B, s < 0),
      rij(`= ${tekst(goed)}`),
    ],
    traps,
  });
}

export default {
  slug: 'herleiden',
  title: 'Herleiden',
  intro:
    'Herleiden is een uitdrukking zo eenvoudig mogelijk schrijven: haakjes wegwerken en gelijksoortige termen samennemen. Hier leer je dat ook met een getal of een min voor twee haakjes, en met de merkwaardige producten, zoals (a + b)^2 = a^2 + 2ab + b^2.',
  description:
    'Herleiden oefenen: haakjes wegwerken, gelijksoortige termen samennemen en merkwaardige producten zoals (a + b)². Havo 3, gratis met uitleg en uitwerkingen.',
  videos: {},
  skills: [
    [237, 'Haakjes wegwerken en samennemen', s237samennemen],
    [238, 'Een factor voor twee haakjes', s238factor],
    [239, 'Een min voor een haakjesproduct', s239min],
    [240, 'Het merkwaardig product (a + b)(a − b)', s240verschil],
    [241, 'De merkwaardige producten (a + b)² en (a − b)²', s241kwadraat],
    [242, 'Merkwaardige producten met een factor of min ervoor', s242gemengd],
  ],
  learn: [
    {
      t: 'Herleiden',
      p: [
        T(
          '{{=herleiden|Herleiden}} is een uitdrukking zo kort mogelijk schrijven, zonder dat de waarde verandert. Je werkt de haakjes weg en neemt de {{=gelijksoortige-termen|gelijksoortige termen}} samen. Gelijksoortige termen hebben dezelfde letters met dezelfde exponenten, zoals 4t en -6t, of 2t^2 en t^2.',
        ),
      ],
      how: [
        'Vermenigvuldig het getal voor de haakjes met elke term tussen de haakjes.',
        'Staan er twee paar haakjes naast elkaar, vermenigvuldig dan elke term van de eerste haakjes met elke term van de tweede.',
        'Neem de gelijksoortige termen samen.',
      ],
      ex: {
        q: `${T('Herleid')} ${U('7t - 4(2t - 3)')}.`,
        steps: [rij('7t - 4(2t - 3)'), rij('= 7t - 8t + 12'), rij('= -t + 12')],
      },
      watch: zin(
        'Denk aan de min voor het getal: ',
        W('-4 · -3 = 12'),
        ', want min keer min is plus.',
      ),
    },
    {
      t: 'Een getal of een min voor twee haakjes',
      p: [
        zin(
          'Staat er een getal voor twee haakjes, zoals bij ',
          W('-2(q + 4)(q - 3)'),
          ', werk dan eerst de twee haakjes weg. Laat het resultaat tussen haakjes staan, en vermenigvuldig daarna elke term met het getal ervoor.',
        ),
      ],
      ex: {
        q: `${T('Herleid')} ${U('-2(q + 4)(q - 3)')}.`,
        steps: [
          rij('-2(q + 4)(q - 3)'),
          rij('= -2(q^2 - 3q + 4q - 12)'),
          rij('= -2(q^2 + q - 12)'),
          rij('= -2q^2 - 2q + 24'),
        ],
      },
      ex2: {
        q: `${T('Herleid')} ${U('3k^2 - (k + 2)(k - 6)')}.`,
        steps: [
          rij('3k^2 - (k + 2)(k - 6)'),
          rij('= 3k^2 - (k^2 - 6k + 2k - 12)'),
          rij('= 3k^2 - (k^2 - 4k - 12)'),
          rij('= 3k^2 - k^2 + 4k + 12'),
          rij('= 2k^2 + 4k + 12'),
        ],
      },
      watch: zin(
        'Denk aan de haakjes. Een min voor een product hoort bij elke term van dat product. En bij ',
        W('(4k)^2'),
        ' gaat ook het getal in het {{kwadraat|kwadraat}}: ',
        W('(4k)^2 = 16k^2'),
        '.',
      ),
    },
    {
      t: 'Merkwaardige producten',
      p: [
        T(
          'Drie producten komen zo vaak voor dat je ze in één keer opschrijft. Dit zijn de {{=merkwaardig-product|merkwaardige producten}}:',
        ),
        U('(a + b)(a - b) = a^2 - b^2'),
        U('(a + b)^2 = a^2 + 2ab + b^2'),
        U('(a - b)^2 = a^2 - 2ab + b^2'),
        zin(
          'Het stuk ',
          W('2ab'),
          ' heet het {{=dubbelproduct|dubbelproduct}}: twee keer het product van de twee termen. Bij ',
          W('(a + b)(a - b)'),
          ' vallen de middelste termen tegen elkaar weg, dus daar is geen dubbelproduct.',
        ),
      ],
      ex: {
        q: `${T('Herleid')} ${U('(3m - 4)^2')}.`,
        steps: [
          rij('(3m - 4)^2 = 9m^2 - 24m + 16'),
          H(
            zin(
              'Het dubbelproduct van ',
              W('3m'),
              ' en ',
              W('4'),
              ' is ',
              W('2 · 3m · 4 = 24m'),
              '. Er staat een min tussen de termen, dus je trekt het af.',
            ),
          ),
          H(zin(W('(3m)^2 = 9m^2'), ' en ', W('4^2 = 16'), '.')),
        ],
      },
      ex2: {
        q: `${T('Herleid')} ${U('(5 + 2w)(5 - 2w)')}.`,
        steps: [
          rij('(5 + 2w)(5 - 2w) = 25 - 4w^2'),
          H(zin(W('5^2 = 25'), ' en ', W('(2w)^2 = 4w^2'), '.')),
        ],
      },
      watch: zin(
        'Het kwadraat van een som is niet de som van de kwadraten: ',
        W('(m + 4)^2'),
        ' is niet ',
        W('m^2 + 16'),
        '. Vergeet het dubbelproduct niet.',
      ),
    },
    {
      t: 'Met een getal of een min ervoor',
      p: [
        zin(
          'Staat er een getal of een min voor een merkwaardig product, zoals bij ',
          W('-(h + 6)^2'),
          ', werk dan eerst het merkwaardig product weg en laat het resultaat tussen haakjes staan. Werk daarna de haakjes weg.',
        ),
      ],
      ex: {
        q: `${T('Herleid')} ${U('-(h + 6)^2')}.`,
        steps: [rij('-(h + 6)^2'), rij('= -(h^2 + 12h + 36)'), rij('= -h^2 - 12h - 36')],
      },
      ex2: {
        q: `${T('Herleid')} ${U('(g + 8)(8 - g)')}.`,
        steps: [rij('(g + 8)(8 - g)'), rij('= (8 + g)(8 - g)'), rij('= 64 - g^2')],
      },
      watch: zin(
        'Staan de termen in een andere volgorde, zet ze dan eerst om. De term met hetzelfde teken in allebei de haakjes komt voorop: ',
        W('(g + 8)(8 - g) = (8 + g)(8 - g)'),
        '.',
      ),
    },
  ],
};
