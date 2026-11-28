// Onderwerp: Machten herleiden. Machten vermenigvuldigen, gelijksoortige termen optellen (ook als dat
// niet kan), een macht van een macht en van een product, machten delen, en als uitdaging haakjes
// wegwerken met machten. De leerling typt het herleide antwoord zelf, in een veld voor een uitdrukking
// (#304). Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, nz, pick, coin, until } from '../math.js';
import { H } from './shared.js';
import { T } from '../typeset.js';
import {
  UF,
  U,
  metUitdrukking,
  invullen,
  leesUitdrukking,
  uitdrukkingGelijk,
} from '../uitdrukking.js';

// Letters voor een uitdrukking. Geen l, o of i: die lijken op 1 en 0. Bij een merkwaardig product ook
// geen a en b, want die staan al in de regel (a + b)² = a² + 2ab + b².
const LETTERS = [
  'a',
  'b',
  'x',
  'y',
  'p',
  'q',
  'm',
  'n',
  'k',
  't',
  's',
  'r',
  'c',
  'd',
  'g',
  'h',
  'z',
];
const ZONDER_AB = LETTERS.filter((l) => l !== 'a' && l !== 'b');
const PAREN = [
  ['a', 'b'],
  ['x', 'y'],
  ['p', 'q'],
  ['m', 'n'],
  ['s', 't'],
  ['a', 'c'],
  ['k', 'm'],
  ['r', 's'],
  ['x', 'z'],
  ['g', 'h'],
  ['b', 'c'],
  ['d', 'g'],
];
// Echte breuken voor een getal dat bij delen niet uitkomt.
const BREUKEN = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
  [3, 5],
  [1, 6],
  [5, 6],
];

// ---------------------------------------------------------------------------------------------------
// Een term is { c, m }: een heel getal c en de exponent per letter m, zoals { a: 3, b: 6 } voor a³b⁶.
// Een letter met exponent 0 staat er niet.

// De letters als tekst, op alfabet: { b: 6, a: 3 } is a^3b^6, en een exponent 1 schrijf je niet.
const letterTekst = (m) =>
  Object.keys(m)
    .filter((l) => m[l])
    .sort()
    .map((l) => (m[l] === 1 ? l : `${l}^${m[l]}`))
    .join('');
// Eén term zoals een leerling hem typt: 12a^3b^6, -x^8, a, 5.
function term({ c, m = {} }) {
  const l = letterTekst(m);
  if (!l) return `${c}`;
  return `${c === 1 ? '' : c === -1 ? '-' : c}${l}`;
}
// Termen met hun teken, zonder + - en zonder termen die 0 zijn: 6a^5 - 15a^3.
function som(ts) {
  const lijst = ts.filter((x) => x.c !== 0);
  if (!lijst.length) return '0';
  return lijst
    .map((x, i) => {
      const s = term({ c: Math.abs(x.c), m: x.m });
      return i ? `${x.c < 0 ? '-' : '+'} ${s}` : x.c < 0 ? `-${s}` : s;
    })
    .join(' ');
}
const graad = (m) => Object.values(m).reduce((s, e) => s + e, 0);
// Het product van termen: de getallen keer elkaar, en per letter de exponenten opgeteld.
const keer = (...ts) =>
  ts.reduce(
    (a, b) => {
      const m = { ...a.m };
      for (const l in b.m) m[l] = (m[l] || 0) + b.m[l];
      return { c: a.c * b.c, m };
    },
    { c: 1, m: {} },
  );
// Een term tot de macht q: het getal tot de macht q, en elke exponent keer q.
const macht = (x, q) => ({
  c: x.c ** q,
  m: Object.fromEntries(Object.entries(x.m).map(([l, e]) => [l, e * q])),
});
// Neemt de gelijksoortige termen samen en laat de termen met 0 weg. De hoogste graad staat vooraan; bij
// dezelfde graad blijft de volgorde waarin de termen ontstaan.
function samen(ts) {
  const per = new Map();
  for (const x of ts) {
    const k = letterTekst(x.m);
    if (per.has(k)) per.get(k).c += x.c;
    else per.set(k, { c: x.c, m: x.m });
  }
  return [...per.values()].filter((x) => x.c !== 0).sort((a, b) => graad(b.m) - graad(a.m));
}
const tegen = (x) => ({ c: -x.c, m: x.m });
// Een getal in een rij van een uitwerking: (-2)^3 en 2^3.
const grondtal = (k) => (k < 0 ? `(${k})` : `${k}`);
// Een melding na een valkuil is gewone tekst: a^12 wordt a¹², een min wordt een echt minteken, en * een
// maalpunt.
const SUPER = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const gewoon = (s) =>
  String(s)
    .replace(/\^(\d+)/g, (_, e) => [...e].map((c) => SUPER[c]).join(''))
    .replace(/-/g, '−')
    .replace(/ \* /g, ' · ');

// Een regel met tekst en wiskunde: zin('Trek de exponenten af: ', W('a^9 : a^4 = a^5'), '.'). De tekst
// gaat door T, de wiskunde door U, zoals in het veld.
const W = (s) => ({ w: s });
const zin = (...delen) => delen.map((d) => (typeof d === 'string' ? T(d) : U(d.w))).join('');
const uitleg = (...delen) => H(zin(...delen));
const rij = (s) => H(U(s));
// Een opsomming met komma's en 'en' ervoor: [a, b, c] wordt a, b en c, ook met W(...) erin.
const opsomming = (lijst) =>
  lijst.flatMap((x, i) => (i === 0 ? [x] : [i === lijst.length - 1 ? ' en ' : ', ', x]));

// De valkuilen met een foute uitdrukking. Een fout antwoord dat gelijk is aan het goede antwoord of aan
// een eerdere valkuil, valt weg: zo is een valkuil nooit het goede antwoord, en heeft elk fout antwoord
// één melding. Een exponent boven 40 kan het veld niet lezen, dus zo'n fout antwoord valt ook weg.
function valkuilen(antwoord, lijst) {
  const gezien = [leesUitdrukking(antwoord).w];
  const uit = [];
  for (const { id, als, m } of lijst) {
    const fout = [].concat(als).filter((a) => {
      const r = leesUitdrukking(a);
      if (!r || gezien.some((g) => uitdrukkingGelijk(g, r.w))) return false;
      gezien.push(r.w);
      return true;
    });
    if (fout.length) uit.push({ id, als: fout, m: gewoon(m) });
  }
  return uit;
}

// v vult in de opgave en in het antwoord dezelfde getallen in en vergelijkt. Zo rekent v met de
// uitdrukking zelf, en niet met de termen waarmee de generator het antwoord maakt. Geen 0, want bij
// delen staat een letter in de noemer.
const PUNTEN = [
  [2, -3],
  [-1, 2],
  [3, 1],
  [-2, -1],
  [1, 3],
];
const klopt = (opgave, antwoord, letters) =>
  PUNTEN.every((p) => {
    const w = Object.fromEntries(letters.map((l, i) => [l, p[i]]));
    return invullen(opgave, w) === invullen(antwoord, w);
  });

// Maakt de vraag: "Herleid …." met een veld voor de uitdrukking.
function vraag({ opgave, antwoord, hint, steps, traps = [], opties = {} }) {
  const letters = [...new Set(opgave.match(/[a-z]/g))].sort();
  return metUitdrukking({
    q: `${T('{{herleiden|Herleid}}')} ${U(opgave)}.`,
    fields: [UF('', antwoord, { letters: letters.join(''), ...opties })],
    hint,
    steps,
    traps: valkuilen(antwoord, traps),
    v: () => klopt(opgave, antwoord, letters),
  });
}

// De letters van een paar termen, op alfabet.
const lettersVan = (ts) =>
  [...new Set(ts.flatMap((x) => Object.keys(x.m).filter((l) => x.m[l])))].sort();
// De exponenten van een letter in een paar termen, zonder de termen waar hij niet in staat.
const exponenten = (ts, l) => ts.map((x) => x.m[l] || 0).filter((e) => e);
// Een term met per letter een andere exponent: f krijgt de exponenten van de letter in ts.
const metExponenten = (c, ts, f) => ({
  c,
  m: Object.fromEntries(lettersVan(ts).map((l) => [l, f(exponenten(ts, l))])),
});

// ---------------------------------------------------------------------------------------------------
// 243. Een product van machten: de getallen keer elkaar, en per letter de exponenten opgeteld. Met één
// letter, twee letters of drie factoren, en een negatief getal na · zonder haakjes.
function s243product() {
  const soort = pick(['een', 'een', 'twee', 'drie']);
  let fs;
  if (soort === 'twee') {
    const [X, Y] = pick(PAREN);
    fs = until(
      () => [
        { c: pick([1, 2, 3, 4, 5, -2, -3]), m: { [X]: ri(1, 5), [Y]: ri(1, 5) } },
        { c: pick([2, 3, 4, 5, 6, 7, -2, -3, -4]), m: { [X]: ri(0, 5), [Y]: ri(0, 5) } },
      ],
      ([, b]) => b.m[X] + b.m[Y] > 0,
    );
  } else {
    const L = pick(LETTERS);
    const n = soort === 'drie' ? 3 : 2;
    fs = Array.from({ length: n }, (_, i) => ({
      c: pick(i ? [1, 2, 3, 4, 5, 6, -2, -3, -4, -5] : [1, 2, 3, 4, 5, 6, 7, -2, -3]),
      m: { [L]: ri(1, n === 3 ? 5 : 7) },
    }));
  }
  const goed = keer(...fs),
    antwoord = term(goed),
    opgave = fs.map(term).join(' · '),
    letters = lettersVan(fs),
    getallen = fs.map((f) => f.c).filter((c) => c !== 1),
    minnen = fs.filter((f) => f.c < 0).length;
  // De letters die in meer dan één factor staan: daar tel je de exponenten op.
  const samenLetters = letters.filter((l) => exponenten(fs, l).length > 1);
  const metEen = samenLetters.filter((l) => exponenten(fs, l).includes(1));
  const steps = [rij(`${opgave} = ${antwoord}`)];
  if (getallen.length > 1)
    steps.push(
      uitleg('Vermenigvuldig de getallen: ', W(getallen.join(' · ') + ` = ${goed.c}`), '.'),
    );
  for (const l of samenLetters) {
    const es = exponenten(fs, l);
    steps.push(uitleg(`Tel de exponenten van ${l} op: ${es.join(' + ')} = ${goed.m[l]}.`));
  }
  if (metEen.length)
    steps.push(
      uitleg(
        'Een letter zonder exponent heeft exponent 1: ',
        W(`${metEen[0]} = ${metEen[0]}^1`),
        '.',
      ),
    );
  const opgeteld = fs.reduce((s, f) => s + f.c, 0);
  return vraag({
    opgave,
    antwoord,
    hint: T(
      'Vermenigvuldig de getallen. Tel bij elke letter de {{exponent|exponenten}} op. Een letter zonder exponent heeft exponent 1.',
    ),
    steps,
    traps: [
      {
        id: 'exponenten-keer',
        als: term(metExponenten(goed.c, fs, (es) => es.reduce((a, b) => a * b, 1))),
        m: 'Bij vermenigvuldigen tel je de exponenten op. Je vermenigvuldigt ze niet.',
      },
      {
        id: 'keer-als-plus',
        als:
          soort === 'een' && fs[0].m[letters[0]] === fs[1].m[letters[0]] && opgeteld
            ? term({ c: opgeteld, m: fs[0].m })
            : [],
        m: 'Dit is keer, geen plus. Bij keer tel je de exponenten op.',
      },
      {
        id: 'getallen-opgeteld',
        als: fs.every((f) => Math.abs(f.c) > 1) && opgeteld ? term({ c: opgeteld, m: goed.m }) : [],
        m: 'De getallen vermenigvuldig je. Je telt ze niet op.',
      },
      {
        id: 'exponent-1-vergeten',
        als: metEen.length
          ? term(
              metExponenten(goed.c, fs, (es) =>
                es.length > 1 ? es.filter((e) => e !== 1).reduce((a, b) => a + b, 0) || 1 : es[0],
              ),
            )
          : [],
        m: `Een letter zonder exponent heeft exponent 1: ${metEen[0]} = ${metEen[0]}^1. Tel die 1 ook op.`,
      },
      {
        id: 'teken',
        als: fs.some((f) => f.c < 0) ? term(tegen(goed)) : [],
        m: `Let op het teken: ${['', 'plus keer min is min', 'min keer min is plus', 'min keer min keer min is min'][minnen]}.`,
      },
    ],
  });
}

// 244. Gelijksoortige termen optellen en aftrekken, ook als het niet kan, met drie termen, en met een
// product ervoor.
function s244optellen() {
  const soort = pick(['gelijk', 'gelijk', 'kan-niet', 'drie', 'product']);
  const L = pick(LETTERS);
  const s = coin() ? 1 : -1,
    teken = s > 0 ? '+' : '-';
  const bijOptellen =
    'Bij optellen en aftrekken blijft de exponent hetzelfde. Je telt alleen de getallen op.';
  if (soort === 'gelijk') {
    const [p, q, e] = until(
      () => [pick([1, 2, 3, 4, 5, 6, 7, 8, 9, -2, -3, -4, -6]), ri(1, 9), ri(2, 7)],
      ([p, q]) => p + s * q !== 0 && (p !== 1 || q !== 1),
    );
    const A = { c: p, m: { [L]: e } },
      B = { c: q, m: { [L]: e } },
      goed = { c: p + s * q, m: A.m },
      opgave = `${term(A)} ${teken} ${term(B)}`;
    return vraag({
      opgave,
      antwoord: term(goed),
      hint: T(
        `De termen zijn {{gelijksoortige-termen|gelijksoortig}}: dezelfde letter met dezelfde {{exponent|exponent}}. Tel de getallen op of trek ze af. De exponent blijft ${e}.`,
      ),
      steps: [
        rij(`${opgave} = ${term(goed)}`),
        uitleg(
          `De termen zijn gelijksoortig, dus je neemt ze samen: ${p} ${teken} ${q} = ${goed.c}.`,
        ),
      ],
      traps: [
        {
          id: 'exponent-bij-optellen',
          als: term({ c: goed.c, m: { [L]: 2 * e } }),
          m: bijOptellen,
        },
        {
          id: 'getallen-keer',
          als: term({ c: p * s * q, m: { [L]: 2 * e } }),
          m: 'Dit is plus of min, geen keer. Tel de getallen op en laat de exponent staan.',
        },
      ],
    });
  }
  if (soort === 'kan-niet') {
    // Dezelfde letter met een andere exponent, of twee letters met dezelfde exponent.
    const twee = coin();
    const [X, Y] = twee ? pick(PAREN) : [L, L];
    const [p, q, e, f] = until(
      () => [pick([1, 2, 3, 4, 5, 6, 7, 8, -2, -3, -5]), ri(1, 9), ri(1, 6), ri(1, 6)],
      ([p, q, e, f]) => (twee || e !== f) && p + s * q !== 0,
    );
    const A = { c: p, m: { [X]: e } },
      B = { c: q, m: { [Y]: f } },
      opgave = `${term(A)} ${teken} ${term(B)}`,
      c = p + s * q;
    const waarom = twee ? 'de letters zijn verschillend' : 'de exponenten zijn verschillend';
    return vraag({
      opgave,
      antwoord: opgave,
      hint: T(
        'Kijk of de termen {{gelijksoortige-termen|gelijksoortig}} zijn: dezelfde letters met dezelfde {{exponent|exponenten}}. Kun je niets samennemen, dan is de uitdrukking zelf het antwoord.',
      ),
      steps: [
        uitleg(
          W(term(A)),
          ' en ',
          W(term(B)),
          ` zijn niet gelijksoortig, want ${waarom}. Je kunt ze niet samennemen.`,
        ),
        uitleg('Het antwoord is dus ', W(opgave), '.'),
      ],
      traps: [
        {
          id: 'niet-gelijksoortig',
          als: [
            term({ c, m: A.m }),
            term({ c, m: B.m }),
            term(keer({ c, m: A.m }, { c: 1, m: B.m })),
          ],
          m: `${term(A)} en ${term(B)} zijn niet gelijksoortig, want ${waarom}. Die kun je niet samennemen.`,
        },
      ],
    });
  }
  if (soort === 'drie') {
    // p·a^e + q·a^f − r·a^e: de eerste en de laatste zijn gelijksoortig.
    const [p, q, r, e, f, s2] = until(
      () => [
        pick([2, 3, 4, 5, 6, 7, 8, 9]),
        ri(1, 9),
        ri(1, 9),
        ri(2, 6),
        ri(1, 6),
        coin() ? 1 : -1,
      ],
      ([p, , r, e, f, s2]) => e !== f && p + s2 * r !== 0,
    );
    const A = { c: p, m: { [L]: e } },
      B = { c: s * q, m: { [L]: f } },
      C = { c: s2 * r, m: { [L]: e } },
      opgave = som([A, B, C]),
      goed = samen([A, B, C]),
      antwoord = som(goed),
      eA = A.c + C.c;
    return vraag({
      opgave,
      antwoord,
      hint: T(
        'Zoek de {{gelijksoortige-termen|gelijksoortige termen}}: dezelfde letter met dezelfde {{exponent|exponent}}. Neem alleen die samen.',
      ),
      steps: [
        rij(opgave),
        rij(`= ${som([A, C, B])}`),
        uitleg(
          W(term(A)),
          ' en ',
          W(term(C)),
          ' zijn gelijksoortig. ',
          W(term(B)),
          ' heeft een andere exponent.',
        ),
        rij(`= ${antwoord}`),
      ],
      traps: [
        {
          id: 'niet-gelijksoortig',
          als: [term({ c: eA + B.c, m: A.m }), term({ c: eA + B.c, m: B.m })],
          m: 'Alleen termen met dezelfde letter en dezelfde exponent zijn gelijksoortig. Neem alleen die samen.',
        },
        {
          id: 'exponent-bij-optellen',
          als: som(samen([{ c: eA, m: { [L]: 2 * e } }, B])),
          m: bijOptellen,
        },
      ],
    });
  }
  // Een product en een term: p·a^e · q·a^f + r·a^g. Meestal is het product gelijksoortig met de term.
  const [p, q, r, e, f, g] = until(
    () => {
      const e = ri(1, 5),
        f = ri(1, 5);
      return [
        ri(1, 5),
        pick([2, 3, 4, 5, -2, -3]),
        ri(1, 9),
        e,
        f,
        ri(1, 4) > 1 ? e + f : ri(1, 8),
      ];
    },
    ([p, q, r, e, f, g]) => g !== e + f || p * q + s * r !== 0,
  );
  const A = { c: p, m: { [L]: e } },
    B = { c: q, m: { [L]: f } },
    P = keer(A, B),
    C = { c: s * r, m: { [L]: g } },
    gelijk = g === e + f,
    opgave = `${term(A)} · ${term(B)} ${teken} ${term({ c: r, m: C.m })}`,
    tussen = som([P, C]),
    antwoord = som(samen([P, C]));
  const steps = [
    rij(opgave),
    rij(`= ${tussen}`),
    uitleg(
      'Reken eerst het product uit: ',
      W(`${term(A)} · ${term(B)} = ${term(P)}`),
      `. Tel de exponenten op: ${e} + ${f} = ${e + f}.`,
    ),
  ];
  if (gelijk)
    steps.push(rij(`= ${antwoord}`), uitleg('Neem daarna de gelijksoortige termen samen.'));
  else
    steps.push(
      uitleg(
        W(term(P)),
        ' en ',
        W(term({ c: r, m: C.m })),
        ' zijn niet gelijksoortig, dus je bent klaar.',
      ),
    );
  return vraag({
    opgave,
    antwoord,
    hint: T(
      'Keer gaat voor plus en min. Reken eerst het product uit. Kijk daarna of je {{gelijksoortige-termen|gelijksoortige termen}} kunt samennemen.',
    ),
    steps,
    traps: [
      {
        id: 'exponenten-keer',
        als: som(samen([{ c: P.c, m: { [L]: e * f } }, C])),
        m: 'Bij vermenigvuldigen tel je de exponenten op. Je vermenigvuldigt ze niet.',
      },
      gelijk
        ? {
            id: 'exponent-bij-optellen',
            als: term({ c: P.c + C.c, m: { [L]: 2 * g } }),
            m: bijOptellen,
          }
        : {
            id: 'niet-gelijksoortig',
            als: [term({ c: P.c + C.c, m: P.m }), term({ c: P.c + C.c, m: C.m })],
            m: `${term(P)} en ${term({ c: r, m: C.m })} zijn niet gelijksoortig, want de exponenten zijn verschillend. Die kun je niet samennemen.`,
          },
    ],
  });
}

// De zin bij een macht van een product: elke factor gaat tot de macht q, zoals (-2)^3 = -8 en
// (a^2)^3 = a^6.
function factorenZin(x, q) {
  const delen = [];
  if (x.c !== 1) delen.push(W(`${grondtal(x.c)}^${q} = ${x.c ** q}`));
  for (const l of Object.keys(x.m).sort())
    delen.push(W(x.m[l] === 1 ? `${l}^${q}` : `(${l}^${x.m[l]})^${q} = ${l}^${x.m[l] * q}`));
  return delen.length > 1
    ? uitleg(`Elke factor tussen de haakjes gaat tot de macht ${q}: `, ...opsomming(delen), '.')
    : uitleg(...delen, '.');
}
// De melding bij een negatief grondtal: met een even exponent positief, met een oneven negatief.
const tekenZin = (k, q) =>
  q % 2
    ? `Een negatief grondtal met een oneven exponent geeft een negatief getal: (${k})^${q} = ${k ** q}.`
    : `Een negatief grondtal met een even exponent geeft een positief getal: (${k})^${q} = ${k ** q}.`;

// 245. Een macht van een macht en van een product: (a^4)^3, (2x^4)^3, (-2a^3)^2, (a^2b)^5, en het
// verschil tussen -(x^2y)^4 en (-3n^5)^3.
function s245macht() {
  const soort = pick(['macht', 'getal', 'getal', 'twee', 'min']);
  if (soort === 'macht') {
    const L = pick(LETTERS);
    const [p, q] = until(
      () => [ri(2, 7), ri(2, 5)],
      ([p, q]) => p * q !== p + q && p * q <= 30,
    );
    const opgave = `(${L}^${p})^${q}`,
      antwoord = `${L}^${p * q}`;
    return vraag({
      opgave,
      antwoord,
      hint: zin(
        'Bij een {{macht|macht}} van een macht vermenigvuldig je de {{exponent|exponenten}}. ',
        W(opgave),
        ` is ${q} keer `,
        W(`${L}^${p}`),
        '.',
      ),
      steps: [
        rij(`${opgave} = ${Array(q).fill(`${L}^${p}`).join(' · ')} = ${antwoord}`),
        uitleg(`Vermenigvuldig de exponenten: ${p} * ${q} = ${p * q}.`),
      ],
      traps: [
        {
          id: 'exponenten-opgeteld',
          als: `${L}^${p + q}`,
          m: 'Bij een macht van een macht vermenigvuldig je de exponenten. Je telt ze niet op.',
        },
      ],
    });
  }
  // Een getal en een of twee letters tussen de haakjes, met een min ervoor (soort min) of niet.
  const twee = soort === 'twee' || (soort === 'min' && coin());
  const [X, Y] = twee ? pick(PAREN) : [pick(LETTERS)];
  const [k, p, r, q] = until(
    () => [
      soort === 'getal'
        ? pick([2, 3, 4, 5, -1, -2, -3, -4])
        : pick(soort === 'min' ? [1, 1, 2, 3] : [1, 1, 2, 3, -1, -2]),
      ri(1, soort === 'getal' ? 5 : 3),
      ri(1, 3),
      soort === 'min' ? pick([2, 2, 3, 4]) : ri(2, soort === 'getal' ? 5 : 4),
    ],
    // Geen kale (x)^q: dan staat er niets tussen de haakjes om uit te rekenen.
    ([k, p, r, q]) =>
      Math.abs(k) ** q <= (soort === 'getal' ? 256 : 81) &&
      p * q <= 30 &&
      (twee || k !== 1 || p > 1),
  );
  const binnen = { c: k, m: twee ? { [X]: p, [Y]: r } : { [X]: p } },
    goedBinnen = macht(binnen, q),
    min = soort === 'min',
    goed = min ? tegen(goedBinnen) : goedBinnen,
    opgave = `${min ? '-' : ''}(${term(binnen)})^${q}`,
    antwoord = term(goed);
  const metBinnen = (x) => term(min ? tegen(x) : x);
  const steps = [rij(`${opgave} = ${antwoord}`), factorenZin(binnen, q)];
  if (k < 0) steps.push(uitleg(tekenZin(k, q)));
  if (min)
    steps.push(
      uitleg(
        'De min staat buiten de haakjes, dus die gaat niet mee in de macht. Je zet hem er daarna weer voor: ',
        W(antwoord),
        '.',
      ),
    );
  const letters = Object.keys(binnen.m);
  const traps = [
    {
      id: 'min-in-macht',
      als: min ? term(macht(tegen(binnen), q)) : [],
      m: 'De min staat buiten de haakjes, dus die gaat niet mee in de macht. Reken eerst de macht uit en zet de min er daarna voor.',
    },
    {
      id: 'alleen-laatste-letter',
      als: twee
        ? [
            metBinnen({ c: k, m: { [X]: p, [Y]: r * q } }),
            metBinnen({ c: k ** q, m: { [X]: p, [Y]: r * q } }),
          ]
        : [],
      m: 'De exponent hoort bij elke factor tussen de haakjes: (ab)^5 = a^5b^5.',
    },
    {
      id: 'getal-niet-in-macht',
      als: Math.abs(k) > 1 ? metBinnen({ c: k, m: goedBinnen.m }) : [],
      m: `Ook het getal tussen de haakjes gaat tot de macht ${q}.`,
    },
    {
      id: 'getal-keer-exponent',
      als: Math.abs(k) > 1 ? metBinnen({ c: k * q, m: goedBinnen.m }) : [],
      m: `${grondtal(k)}^${q} is niet ${k} * ${q}, maar ${Array(q).fill(k).join(' * ')}.`,
    },
    {
      id: 'exponenten-opgeteld',
      als: letters.some((l) => binnen.m[l] > 1)
        ? metBinnen({
            c: goedBinnen.c,
            m: Object.fromEntries(letters.map((l) => [l, binnen.m[l] > 1 ? binnen.m[l] + q : q])),
          })
        : [],
      m: 'Bij een macht van een macht vermenigvuldig je de exponenten. Je telt ze niet op.',
    },
    {
      id: 'teken',
      als: k < 0 ? term(tegen(goed)) : [],
      m: tekenZin(k, q),
    },
  ];
  return vraag({
    opgave,
    antwoord,
    hint: T(
      `Elke factor tussen de haakjes gaat tot de {{macht|macht}} ${q}: het getal en elke letter. Bij een letter met een {{exponent|exponent}} vermenigvuldig je de exponenten.${min ? ' Let op: de min staat buiten de haakjes.' : ''}`,
    ),
    steps,
    traps,
  });
}
// 246. Machten delen, als breuk: de getallen delen en per letter de exponenten aftrekken. Een letter
// kan wegvallen, en een getal dat niet uitkomt wordt een breuk vóór de letters.
function s246delen() {
  const soort = pick(['een', 'twee', 'breuk']);
  const [X, Y] = soort === 'een' ? [pick(LETTERS)] : pick(PAREN);
  // Het getal van het antwoord is k of r/s, en g is wat je wegdeelt.
  const [r, s] = soort === 'breuk' ? pick(BREUKEN) : [pick([1, 2, 3, 4, 5, 6, 7, -2, -3, -5]), 1];
  const g = soort === 'breuk' ? ri(1, 4) : ri(2, 6);
  // Per letter [e, f]: e in het antwoord en f in de noemer, dus e + f in de teller. Een tweede letter kan
  // wegvallen (e = 0) of alleen in de teller staan (f = 0).
  const ex = { [X]: [ri(1, 6), ri(1, 5)] };
  if (Y)
    ex[Y] = pick([
      [0, ri(1, 4)],
      [ri(1, 4), ri(1, 4)],
      [ri(1, 3), 0],
    ]);
  const ls = Object.keys(ex).sort(),
    exp = (f) => Object.fromEntries(ls.map((l) => [l, f(...ex[l], l)]));
  const teller = { c: r * g, m: exp((e, f) => e + f) },
    noemer = { c: s * g, m: exp((e, f) => f) },
    rest = exp((e) => e),
    opgave = `${term(teller)}/(${term(noemer)})`;
  const metGetal = (m, rs = [r, s]) =>
    rs[1] === 1 ? term({ c: rs[0], m }) : `${rs[0]}/${rs[1]}${letterTekst(m)}`;
  const antwoord = metGetal(rest);
  const steps = [rij(`${opgave} = ${antwoord}`)];
  if (s === 1 && noemer.c !== 1)
    steps.push(
      uitleg(
        'Deel de getallen: ',
        W(`${teller.c} : ${noemer.c} = ${r}`),
        r === 1 ? '. Een 1 voor de letters schrijf je niet.' : '.',
      ),
    );
  else if (s > 1 && g > 1)
    steps.push(
      uitleg(
        'Deel de getallen: ',
        W(`${teller.c}/${noemer.c} = ${r}/${s}`),
        '. Dat komt niet uit, dus je houdt een breuk. Die zet je vóór de letters.',
      ),
    );
  else if (s > 1)
    steps.push(
      uitleg(
        'Het getal ',
        W(`${teller.c} : ${noemer.c}`),
        ' komt niet uit. Je houdt de breuk ',
        W(`${r}/${s}`),
        ' en die zet je vóór de letters.',
      ),
    );
  for (const l of ls) {
    const [e, f] = ex[l],
      t = e + f;
    if (!f)
      steps.push(
        uitleg(W(term({ c: 1, m: { [l]: e } })), ' staat alleen in de teller en blijft staan.'),
      );
    else if (!e)
      steps.push(
        uitleg(
          W(`${term({ c: 1, m: { [l]: t } })} : ${term({ c: 1, m: { [l]: f } })} = 1`),
          `, dus ${l} valt weg.`,
        ),
      );
    else
      steps.push(
        uitleg(
          'Trek de exponenten af: ',
          W(
            `${term({ c: 1, m: { [l]: t } })} : ${term({ c: 1, m: { [l]: f } })} = ${term({ c: 1, m: { [l]: e } })}`,
          ),
          `, want ${t} - ${f} = ${e}.`,
        ),
      );
  }
  // De fout a^8 : a^4 = a^2: alleen als de exponent in de noemer minstens 2 is, want door 1 delen verandert niets.
  const deelbaar = ls.filter(
    (l) => ex[l][1] > 1 && ex[l][0] > 0 && (ex[l][0] + ex[l][1]) % ex[l][1] === 0,
  );
  const weg = ls.filter((l) => !ex[l][0]);
  return vraag({
    opgave,
    antwoord,
    opties: { breuk: 'ervoor' },
    hint: T(
      `Deel de getallen. Trek bij elke letter de {{exponent|exponenten}} af: de exponent in de teller min de exponent in de noemer.${s > 1 ? ' Komt het getal niet uit, zet de breuk dan vóór de letters.' : ''}`,
    ),
    steps,
    traps: [
      {
        id: 'exponenten-gedeeld',
        als: deelbaar.length
          ? metGetal(exp((e, f, l) => (deelbaar.includes(l) ? (e + f) / f : e)))
          : [],
        m: 'Bij delen trek je de exponenten af. Je deelt ze niet.',
      },
      {
        id: 'delen-als-keer',
        als: metGetal(exp((e, f) => e + 2 * f)),
        m: 'Bij delen trek je de exponenten af. Je telt ze niet op.',
      },
      {
        id: 'letter-valt-niet-weg',
        als: weg.length ? metGetal(exp((e) => e || 1)) : [],
        m: weg.length
          ? `${term({ c: 1, m: { [weg[0]]: ex[weg[0]][1] } })} : ${term({ c: 1, m: { [weg[0]]: ex[weg[0]][1] } })} = 1, dus ${weg[0]} valt weg.`
          : '',
      },
      {
        id: 'breuk-omgedraaid',
        als: s > 1 ? metGetal(rest, [s, r]) : [],
        m: 'Deel het getal in de teller door het getal in de noemer, niet andersom.',
      },
      {
        id: 'teken',
        als: r < 0 ? metGetal(rest, [-r, s]) : [],
        m: 'Let op de min in de teller: het antwoord is negatief.',
      },
    ],
  });
}

// 247. Gemengd: een product plus of min een product, zoals 4a^2 · 2a^3 − a · 3a^4, of een macht van een
// product plus of min een product. Meestal zijn de twee termen daarna gelijksoortig.
function s247gemengd() {
  const L = pick(LETTERS),
    soort = pick(['producten', 'producten', 'macht']),
    s = coin() ? 1 : -1,
    teken = s > 0 ? '+' : '-';
  const T1 = (e) => ({ [L]: e });
  let eerste, tweede, opgave, traps;
  const bijOptellen =
    'Bij optellen en aftrekken blijft de exponent hetzelfde. Je telt alleen de getallen op.';
  if (soort === 'producten') {
    const [a, b, c, d] = until(
      () => {
        const n = ri(3, 8),
          e = ri(1, n - 1),
          g = ri(1, n - 1),
          h = ri(1, 4) > 1 ? n - g : ri(1, 6);
        return [
          { c: ri(1, 5), m: T1(e) },
          { c: pick([2, 3, 4, 5, -2, -3]), m: T1(n - e) },
          { c: ri(1, 4), m: T1(g) },
          { c: ri(1, 5), m: T1(h) },
        ];
      },
      ([a, b, c, d]) => {
        const x = keer(a, b),
          y = keer(c, d);
        return x.m[L] !== y.m[L] || x.c + s * y.c !== 0;
      },
    );
    eerste = keer(a, b);
    tweede = { c: s * c.c * d.c, m: keer(c, d).m };
    opgave = `${term(a)} · ${term(b)} ${teken} ${term(c)} · ${term(d)}`;
    traps = [
      {
        id: 'exponenten-keer',
        als: som(
          samen([
            { c: eerste.c, m: T1(a.m[L] * b.m[L]) },
            { c: tweede.c, m: T1(c.m[L] * d.m[L]) },
          ]),
        ),
        m: 'Bij vermenigvuldigen tel je de exponenten op. Je vermenigvuldigt ze niet.',
      },
    ];
  } else {
    const [k, p, q, c, d, voorop] = until(
      () => {
        const p = ri(1, 4),
          q = pick([2, 2, 3]),
          g = ri(1, p * q - 1);
        return [
          pick([1, 2, 3, -1, -2]),
          p,
          q,
          { c: ri(1, 5), m: T1(g) },
          { c: pick([1, 2, 3, 4, -2, -3]), m: T1(p * q - g) },
          coin(),
        ];
      },
      ([k, p, q, c, d]) => Math.abs(k) ** q <= 27 && k ** q + s * c.c * d.c !== 0,
    );
    const binnen = { c: k, m: T1(p) },
      M = macht(binnen, q),
      P = keer(c, d),
      mTekst = `(${term(binnen)})^${q}`,
      pTekst = `${term(c)} · ${term(d)}`;
    [eerste, tweede] = voorop ? [M, { c: s * P.c, m: P.m }] : [P, { c: s * M.c, m: M.m }];
    opgave = voorop ? `${mTekst} ${teken} ${pTekst}` : `${pTekst} ${teken} ${mTekst}`;
    // Een fout in de macht: de macht wordt w, het product blijft goed.
    const fout = (w) =>
      som(samen(voorop ? [w, { c: s * P.c, m: P.m }] : [P, { c: s * w.c, m: w.m }]));
    traps = [
      {
        id: 'getal-niet-in-macht',
        als: Math.abs(k) > 1 ? fout({ c: k, m: M.m }) : [],
        m: `Ook het getal tussen de haakjes gaat tot de macht ${q}.`,
      },
      {
        id: 'exponenten-opgeteld',
        als: p > 1 ? fout({ c: M.c, m: T1(p + q) }) : [],
        m: 'Bij een macht van een macht vermenigvuldig je de exponenten. Je telt ze niet op.',
      },
      {
        id: 'teken',
        als: k < 0 ? fout(tegen(M)) : [],
        m: tekenZin(k, q),
      },
      {
        id: 'exponenten-keer',
        als: som(
          samen(
            voorop
              ? [M, { c: s * P.c, m: T1(c.m[L] * d.m[L]) }]
              : [
                  { c: P.c, m: T1(c.m[L] * d.m[L]) },
                  { c: s * M.c, m: M.m },
                ],
          ),
        ),
        m: 'Bij vermenigvuldigen tel je de exponenten op. Je vermenigvuldigt ze niet.',
      },
    ];
  }
  const gelijk = eerste.m[L] === tweede.m[L],
    tussen = som([eerste, tweede]),
    antwoord = som(samen([eerste, tweede]));
  const steps = [
    rij(opgave),
    rij(`= ${tussen}`),
    uitleg(
      soort === 'macht'
        ? 'Reken eerst de macht en het product uit. Bij het product tel je de exponenten op, bij de macht van een macht vermenigvuldig je ze.'
        : 'Reken eerst de producten uit: vermenigvuldig de getallen en tel de exponenten op.',
    ),
  ];
  const tweedeTekst = term({ c: Math.abs(tweede.c), m: tweede.m });
  if (gelijk)
    steps.push(rij(`= ${antwoord}`), uitleg('Neem daarna de gelijksoortige termen samen.'));
  else
    steps.push(
      uitleg(
        W(term(eerste)),
        ' en ',
        W(tweedeTekst),
        ' zijn niet gelijksoortig, dus je bent klaar.',
      ),
    );
  traps.push(
    gelijk
      ? {
          id: 'exponent-bij-optellen',
          als: term({ c: eerste.c + tweede.c, m: T1(2 * eerste.m[L]) }),
          m: bijOptellen,
        }
      : {
          id: 'niet-gelijksoortig',
          als:
            eerste.c + tweede.c
              ? [
                  term({ c: eerste.c + tweede.c, m: eerste.m }),
                  term({ c: eerste.c + tweede.c, m: tweede.m }),
                ]
              : [],
          m: `${term(eerste)} en ${tweedeTekst} zijn niet gelijksoortig, want de exponenten zijn verschillend. Die kun je niet samennemen.`,
        },
  );
  return vraag({
    opgave,
    antwoord,
    hint: T(
      'Keer gaat voor plus en min. Reken eerst elk product en elke {{macht|macht}} uit. Neem daarna de {{gelijksoortige-termen|gelijksoortige termen}} samen, als dat kan.',
    ),
    steps,
    traps,
  });
}

// 248. Uitdaging: haakjes wegwerken met machten, zoals 3a^2(2a^3 − 5a) en (a^2 + 3)(a^3 − 2), en een
// merkwaardig product met machten, zoals (a^3 + 4)^2 en (2a^2 + 5)(2a^2 − 5).
function s248haakjes() {
  const soort = pick(['factor', 'factor', 'twee', 'kwadraat', 'verschil']);
  const L = pick(soort === 'kwadraat' || soort === 'verschil' ? ZONDER_AB : LETTERS);
  const T1 = (e) => (e ? { [L]: e } : {});
  if (soort === 'factor') {
    const [k, p, A, B] = until(
      () => [
        pick([1, 2, 3, 4, 5, -1, -2, -3]),
        ri(1, 4),
        { c: ri(1, 5), m: T1(ri(1, 5)) },
        { c: nz(-7, 7), m: T1(ri(0, 4)) },
      ],
      ([, , A, B]) => (A.m[L] || 0) !== (B.m[L] || 0),
    );
    const K = { c: k, m: T1(p) },
      ts = [keer(K, A), keer(K, B)],
      opgave = `${term(K)}(${som([A, B])})`,
      antwoord = som(samen(ts));
    const expKeer = (x) => ({ c: k * x.c, m: T1(x.m[L] ? p * x.m[L] : p) });
    return vraag({
      opgave,
      antwoord,
      hint: zin(
        'Vermenigvuldig ',
        W(term(K)),
        ' met elke term tussen de haakjes. Vermenigvuldig de getallen en tel de {{exponent|exponenten}} op.',
      ),
      steps: [
        rij(`${opgave} = ${som(ts)}`),
        uitleg(
          'Vermenigvuldig ',
          W(term(K)),
          ' met elke term tussen de haakjes. Bij elke term tel je de exponenten op.',
        ),
      ],
      traps: [
        {
          id: 'haakjes-vergeten',
          als: som(samen([ts[0], B])),
          m: `Denk aan de haakjes: vermenigvuldig elke term tussen de haakjes met ${term(K)}.`,
        },
        {
          id: 'exponenten-keer',
          als: som(samen([expKeer(A), expKeer(B)])),
          m: 'Bij vermenigvuldigen tel je de exponenten op. Je vermenigvuldigt ze niet.',
        },
        {
          id: 'teken',
          als: k < 0 ? som(samen([ts[0], tegen(ts[1])])) : [],
          m:
            B.c < 0
              ? 'Let op het teken: min keer min is plus.'
              : 'Let op het teken: min keer plus is min.',
        },
      ],
    });
  }
  if (soort === 'twee') {
    const [m1, p, q, c, d] = until(
      () => [pick([1, 1, 2, 3]), ri(1, 4), ri(1, 4), nz(-7, 7), nz(-7, 7)],
      ([m1, p, q, c, d]) => p + q > 2 && (p !== q || (m1 * d + c !== 0 && (m1 !== 1 || c !== d))),
    );
    const A = [
        { c: m1, m: T1(p) },
        { c, m: {} },
      ],
      B = [
        { c: 1, m: T1(q) },
        { c: d, m: {} },
      ],
      vier = A.flatMap((x) => B.map((y) => keer(x, y))),
      goed = samen(vier),
      opgave = `(${som(A)})(${som(B)})`,
      antwoord = som(goed);
    const steps = [rij(opgave), rij(`= ${som(vier)}`)];
    if (goed.length < 4) steps.push(rij(`= ${antwoord}`));
    steps.push(
      uitleg(
        'Vermenigvuldig elke term van de eerste haakjes met elke term van de tweede. Tel bij de letters de exponenten op.',
      ),
    );
    return vraag({
      opgave,
      antwoord,
      hint: T(
        'Vermenigvuldig elke {{term|term}} van de eerste haakjes met elke term van de tweede. Tel bij de letters de {{exponent|exponenten}} op.',
      ),
      steps,
      traps: [
        {
          id: 'middelste-termen-vergeten',
          als: som(samen([vier[0], vier[3]])),
          m: 'Vermenigvuldig elke term van de eerste haakjes met elke term van de tweede. Dan krijg je vier termen.',
        },
        {
          id: 'exponenten-keer',
          als: p * q !== p + q ? som(samen([{ c: m1, m: T1(p * q) }, ...vier.slice(1)])) : [],
          m: 'Bij vermenigvuldigen tel je de exponenten op. Je vermenigvuldigt ze niet.',
        },
      ],
    });
  }
  const m1 = pick([1, 1, 2, 3]),
    p = ri(2, 4),
    c = ri(1, 7),
    A = { c: m1, m: T1(p) },
    A2 = macht(A, 2),
    kwA = uitleg(
      W(`(${term(A)})^2 = ${term(A2)}`),
      ', want ',
      W(`${term({ c: 1, m: T1(p) })} · ${term({ c: 1, m: T1(p) })}`),
      ` geeft de exponent ${p} + ${p} = ${2 * p}.`,
    );
  if (soort === 'verschil') {
    const omgekeerd = coin(),
      plus = som([A, { c, m: {} }]),
      min = som([A, { c: -c, m: {} }]),
      opgave = omgekeerd ? `(${min})(${plus})` : `(${plus})(${min})`,
      antwoord = som([A2, { c: -c * c, m: {} }]);
    return vraag({
      opgave,
      antwoord,
      hint: zin(
        'Gebruik het {{merkwaardig-product|merkwaardig product}} ',
        W('(a + b)(a - b) = a^2 - b^2'),
        ', met ',
        W(term(A)),
        ' als a.',
      ),
      steps: [rij(`${opgave} = ${antwoord}`), kwA, uitleg(W(`${c}^2 = ${c * c}`), '.')],
      traps: [
        {
          id: 'plus-kwadraat',
          als: som([A2, { c: c * c, m: {} }]),
          m: 'Plus keer min is min. Het wordt a^2 - b^2, met een min.',
        },
        {
          id: 'exponenten-keer',
          als: som([
            { c: m1 * m1, m: T1(p * p) },
            { c: -c * c, m: {} },
          ]),
          m: `Bij vermenigvuldigen tel je de exponenten op: ${term({ c: 1, m: T1(p) })} * ${term({ c: 1, m: T1(p) })} = ${term({ c: 1, m: T1(2 * p) })}.`,
        },
        {
          id: 'getal-niet-in-kwadraat',
          als:
            m1 > 1
              ? som([
                  { c: m1, m: A2.m },
                  { c: -c * c, m: {} },
                ])
              : [],
          m: `Ook het getal gaat in het kwadraat: ${m1}^2 = ${m1 * m1}.`,
        },
      ],
    });
  }
  // (m·a^p ± c)²
  const s = coin() ? 1 : -1,
    B = { c: s * c, m: {} },
    opgave = `(${som([A, B])})^2`,
    dp = { c: 2 * m1 * s * c, m: T1(p) },
    antwoord = som([A2, dp, { c: c * c, m: {} }]),
    regel = s > 0 ? '(a + b)^2 = a^2 + 2ab + b^2' : '(a - b)^2 = a^2 - 2ab + b^2';
  return vraag({
    opgave,
    antwoord,
    hint: zin(
      'Gebruik het {{merkwaardig-product|merkwaardig product}} ',
      W(regel),
      ', met ',
      W(term(A)),
      ' als a. Vergeet het {{dubbelproduct|dubbelproduct}} niet.',
    ),
    steps: [
      rij(`${opgave} = ${antwoord}`),
      kwA,
      uitleg(
        'Het dubbelproduct is ',
        W(`2 · ${term(A)} · ${c} = ${term({ c: 2 * m1 * c, m: T1(p) })}`),
        s < 0 ? '. Er staat een min tussen de termen, dus je trekt het af.' : '.',
      ),
    ],
    traps: [
      {
        id: 'dubbelproduct-vergeten',
        als: [som([A2, { c: c * c, m: {} }]), som([A2, { c: -c * c, m: {} }])],
        m: `Vergeet het dubbelproduct niet: ${regel}.`,
      },
      {
        id: 'exponenten-opgeteld',
        als: som([{ c: m1 * m1, m: T1(p + 2) }, dp, { c: c * c, m: {} }]),
        m: 'Bij het kwadraat van een macht vermenigvuldig je de exponent met 2. Je telt er geen 2 bij op.',
      },
      {
        id: 'getal-niet-in-kwadraat',
        als: m1 > 1 ? som([{ c: m1, m: A2.m }, dp, { c: c * c, m: {} }]) : [],
        m: `Ook het getal gaat in het kwadraat: ${m1}^2 = ${m1 * m1}.`,
      },
      {
        id: 'dubbelproduct-zonder-2',
        als: som([A2, { c: m1 * s * c, m: T1(p) }, { c: c * c, m: {} }]),
        m: 'Het dubbelproduct is 2 keer het product van de twee termen.',
      },
    ],
  });
}

export default {
  slug: 'machten-herleiden',
  title: 'Machten herleiden',
  intro:
    'Een macht zoals a^4 is een korte schrijfwijze voor a · a · a · a. Hier leer je uitdrukkingen met machten herleiden: machten vermenigvuldigen en delen, gelijksoortige termen optellen, en een macht van een macht of van een product uitrekenen, zoals (2x^4)^3 = 8x^12.',
  description:
    'Machten herleiden oefenen: machten vermenigvuldigen en delen, een macht van een macht en gelijksoortige termen optellen. Havo 3, gratis met uitwerkingen.',
  videos: {},
  skills: [
    [243, 'Machten vermenigvuldigen', s243product],
    [244, 'Gelijksoortige termen optellen', s244optellen],
    [245, 'Een macht van een macht of van een product', s245macht],
    [246, 'Machten delen', s246delen],
    [247, 'Producten en machten samennemen', s247gemengd],
    [248, 'Haakjes wegwerken met machten', s248haakjes, 'uitdaging'],
  ],
  learn: [
    {
      t: 'Machten',
      p: [
        T(
          'Een {{=macht|macht}} is een korte schrijfwijze voor een product van gelijke factoren: k^5 = k * k * k * k * k. De k heet het {{=grondtal|grondtal}} en de 5 de {{=exponent|exponent}}. De exponent zegt hoe vaak het grondtal er staat.',
        ),
        T('Een letter zonder exponent heeft exponent 1: k = k^1.'),
      ],
    },
    {
      t: 'Machten vermenigvuldigen',
      p: [
        `${T('Bij vermenigvuldigen tel je de exponenten op, want je telt hoe vaak de letter er staat:')} ${U('t^3 · t^4 = t^7')}${T('.')}`,
        T(
          'Staan er getallen voor, vermenigvuldig dan de getallen met elkaar en neem elke letter apart.',
        ),
      ],
      how: [
        'Vermenigvuldig de getallen.',
        'Tel bij elke letter de exponenten op.',
        'Zet het getal vooraan en de letters op alfabet.',
      ],
      ex: {
        q: `${T('Herleid')} ${U('5k^3 · -2k^4')}.`,
        steps: [
          rij('5k^3 · -2k^4 = -10k^7'),
          uitleg('Vermenigvuldig de getallen: ', W('5 · -2 = -10'), '.'),
          uitleg('Tel de exponenten op: 3 + 4 = 7.'),
        ],
      },
      ex2: {
        q: `${T('Herleid')} ${U('3x^2y · 6xy^4')}.`,
        steps: [
          rij('3x^2y · 6xy^4 = 18x^3y^5'),
          uitleg('Vermenigvuldig de getallen: ', W('3 · 6 = 18'), '.'),
          uitleg('Tel de exponenten van x op: 2 + 1 = 3. Tel de exponenten van y op: 1 + 4 = 5.'),
        ],
      },
      watch: zin(
        'Vermenigvuldig de exponenten niet: ',
        W('t^3 · t^4'),
        ' is ',
        W('t^7'),
        ' en niet ',
        W('t^12'),
        '.',
      ),
    },
    {
      t: 'Optellen en aftrekken',
      p: [
        T(
          'Optellen en aftrekken kan alleen bij {{gelijksoortige-termen|gelijksoortige termen}}: dezelfde letters met dezelfde exponenten. Je telt de getallen op, en de exponent blijft hetzelfde.',
        ),
        zin(
          'Zijn de termen niet gelijksoortig, zoals bij ',
          W('6m^4 + 2m^3'),
          ', dan kun je niets samennemen. Dan is de uitdrukking zelf het antwoord.',
        ),
      ],
      ex: {
        q: `${T('Herleid')} ${U('7m^4 + 3m^2 - 2m^4')}.`,
        steps: [rij('7m^4 + 3m^2 - 2m^4'), rij('= 7m^4 - 2m^4 + 3m^2'), rij('= 5m^4 + 3m^2')],
      },
      ex2: {
        q: `${T('Herleid')} ${U('2n^3 · 4n^2 + n^5')}.`,
        steps: [
          rij('2n^3 · 4n^2 + n^5'),
          rij('= 8n^5 + n^5'),
          rij('= 9n^5'),
          uitleg(
            'Keer gaat voor plus. Reken eerst het product uit, en neem daarna de gelijksoortige termen samen.',
          ),
        ],
      },
      watch: zin(
        'Bij optellen blijft de exponent: ',
        W('m^4 + m^4 = 2m^4'),
        ' en niet ',
        W('m^8'),
        '.',
      ),
    },
    {
      t: 'Een macht van een macht of van een product',
      p: [
        zin(
          'Bij een macht van een macht vermenigvuldig je de exponenten: ',
          W('(q^3)^4 = q^3 · q^3 · q^3 · q^3 = q^12'),
          '.',
        ),
        zin(
          'Bij een macht van een product gaat elke factor tot de macht, ook het getal: ',
          W('(3q^2)^3 = 27q^6'),
          ', want ',
          W('3^3 = 27'),
          ' en ',
          W('(q^2)^3 = q^6'),
          '.',
        ),
        T(
          'Is het grondtal negatief, let dan op het teken. Met een even exponent is de uitkomst positief, met een oneven exponent negatief.',
        ),
      ],
      ex: {
        q: `${T('Herleid')} ${U('(-2s^3)^3')}.`,
        steps: [
          rij('(-2s^3)^3 = -8s^9'),
          uitleg(W('(-2)^3 = -8'), ' en ', W('(s^3)^3 = s^9'), '.'),
        ],
      },
      ex2: {
        q: `${T('Herleid')} ${U('-(s^2t)^4')}.`,
        steps: [
          rij('-(s^2t)^4 = -s^8t^4'),
          uitleg(
            'De min staat buiten de haakjes, dus die gaat niet mee in de macht. Je zet hem er daarna weer voor.',
          ),
        ],
      },
      watch: zin(
        'Vergeet geen factor: ',
        W('(st)^4 = s^4t^4'),
        ' en niet ',
        W('st^4'),
        '. En ',
        W('(2s)^3 = 8s^3'),
        ' en niet ',
        W('2s^3'),
        '.',
      ),
    },
    {
      t: 'Machten delen',
      p: [
        zin(
          'Bij delen trek je de exponenten af: ',
          W('g^7 : g^3 = g^4'),
          '. Staat een deling als breuk, deel dan de getallen en neem elke letter apart. Is de exponent in de teller en de noemer gelijk, dan valt de letter weg, want ',
          W('g^3 : g^3 = 1'),
          '.',
        ),
        T('Komt het getal niet uit, dan houd je een breuk. Die zet je vóór de letters.'),
      ],
      ex: {
        q: `${T('Herleid')} ${U('18n^7/(6n^2)')}.`,
        steps: [
          rij('18n^7/(6n^2) = 3n^5'),
          uitleg('Deel de getallen: ', W('18 : 6 = 3'), '.'),
          uitleg('Trek de exponenten af: ', W('n^7 : n^2 = n^5'), ', want 7 - 2 = 5.'),
        ],
      },
      ex2: {
        q: `${T('Herleid')} ${U('3g^5h^2/(12g^2h^2)')}.`,
        steps: [
          rij('3g^5h^2/(12g^2h^2) = 1/4g^3'),
          uitleg(
            'Deel de getallen: ',
            W('3/12 = 1/4'),
            '. Dat komt niet uit, dus de breuk staat vóór de letters.',
          ),
          uitleg(W('g^5 : g^2 = g^3'), ' en ', W('h^2 : h^2 = 1'), ', dus h valt weg.'),
        ],
      },
      watch: zin(
        'Deel de exponenten niet: ',
        W('g^8 : g^4'),
        ' is ',
        W('g^4'),
        ' en niet ',
        W('g^2'),
        '.',
      ),
    },
    {
      t: 'Haakjes met machten',
      p: [
        zin(
          'Als uitdaging werk je haakjes weg met machten. Dat gaat zoals altijd: vermenigvuldig elke term, en tel daarbij de exponenten op. Zo is ',
          W('2k^2(k^3 + 4) = 2k^5 + 8k^2'),
          '.',
        ),
      ],
    },
  ],
};
