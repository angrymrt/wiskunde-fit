// Onderwerp: Breuken met letters. Een breuk met letters vereenvoudigen, de letter uit de breuk halen,
// breuken vermenigvuldigen en delen, gelijknamige en ongelijknamige breuken optellen en aftrekken, en
// als uitdaging de teller en de noemer eerst ontbinden in factoren. De leerling typt het herleide
// antwoord zelf, in een veld voor een uitdrukking (#304). Vraaggeneratoren staan bovenaan, de uitleg en
// de lijst met vraagsoorten onderaan.
import { ri, nz, pick, coin, until, gcd, lcm } from '../math.js';
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
// geen a en b, want die staan al in de regel a² − b² = (a + b)(a − b).
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
const DRIETAL = [
  ['a', 'b', 'c'],
  ['x', 'y', 'z'],
  ['p', 'q', 'r'],
  ['k', 'm', 'n'],
  ['r', 's', 't'],
  ['a', 'c', 'd'],
  ['g', 'h', 'k'],
  ['m', 'n', 'p'],
  ['b', 'c', 'd'],
];

// ---------------------------------------------------------------------------------------------------
// Een term is { c, m }: een heel getal c en de exponent per letter m, zoals { a: 3, b: 6 } voor 3a³b⁶ bij
// c = 3. Een letter met exponent 0 telt niet mee.

// De letters als tekst, op alfabet: { b: 6, a: 3 } is a^3b^6, en een exponent 1 schrijf je niet.
const letterTekst = (m) =>
  Object.keys(m)
    .filter((l) => m[l])
    .sort()
    .map((l) => (m[l] === 1 ? l : `${l}^${m[l]}`))
    .join('');
// Eén term zoals een leerling hem typt: 12a^3b^6, -x, a, 5.
function term({ c, m = {} }) {
  const l = letterTekst(m);
  if (!l || !c) return `${c}`;
  return `${c === 1 ? '' : c === -1 ? '-' : c}${l}`;
}
// Termen met hun teken, zonder + - en zonder termen die 0 zijn: 6a - 15.
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
const tegen = (x) => ({ c: -x.c, m: x.m });
const EEN = { c: 1, m: {} };
const isEen = (x) => x.c === 1 && !letterTekst(x.m);
// Een term met één letter, of zonder letter als de exponent 0 is.
const mono = (c, l, e = 1) => ({ c, m: e ? { [l]: e } : {} });

// Een noemer: haakjes erom, behalve bij een heel getal of één letter. Zo is 2/x gewoon 2/x, en 3/(9x)
// geen ⅓x.
const noemerTekst = (x) => {
  const s = typeof x === 'string' ? x : term(x);
  return /^(\d+|[a-z])$/.test(s) ? s : `(${s})`;
};

// Een breuk van twee termen: { t, n }, de teller en de noemer.
const B = (t, n = EEN) => ({ t, n });
// Zoals in een opgave, met de letters in de teller: 10ab/(15bc), 3/x of 5a.
const opgaveTekst = (b) => (isEen(b.n) ? term(b.t) : `${term(b.t)}/${noemerTekst(b.n)}`);
const maal = (a, b) => B(keer(a.t, b.t), keer(a.n, b.n));
// De omgekeerde breuk: de teller wordt de noemer. Een min blijft in de teller.
const omgekeerd = ({ t, n }) =>
  B({ c: n.c * Math.sign(t.c), m: n.m }, { c: Math.abs(t.c), m: t.m });
// Waardoor je de teller en de noemer allebei kunt delen: de ggd van de getallen en de letters die in
// allebei staan.
function deler({ t, n }) {
  const m = {};
  for (const l in t.m) if (t.m[l] && n.m[l]) m[l] = Math.min(t.m[l], n.m[l]);
  return { c: gcd(t.c, n.c), m };
}

// De breuk zo ver mogelijk vereenvoudigd, als { p, q, m }: p/q een vereenvoudigde breuk met q > 0, en de
// exponent per letter, negatief als de letter in de noemer staat.
function vereenvoudig({ t, n }) {
  const g = gcd(t.c, n.c) || 1;
  const m = { ...t.m };
  for (const l in n.m) m[l] = (m[l] || 0) - n.m[l];
  for (const l in m) if (!m[l]) delete m[l];
  return { p: (Math.sign(n.c) * t.c) / g, q: Math.abs(n.c) / g, m };
}
const tegengesteld = (v) => ({ ...v, p: -v.p });
const omgekeerdV = ({ p, q, m }) => ({
  p: Math.sign(p) * q,
  q: Math.abs(p),
  m: Object.fromEntries(Object.entries(m).map(([l, e]) => [l, -e])),
});

// Een getal als breuk, zoals een leerling het typt: 3, 2/3, -1 1/2. Een onechte breuk wordt een gemengd
// getal, zoals in het boek.
function getalTekst(p, q = 1) {
  const g = gcd(p, q) || 1;
  [p, q] = [p / g, q / g];
  if (q === 1) return `${p}`;
  const a = Math.abs(p),
    min = p < 0 ? '-' : '';
  return a > q ? `${min}${Math.floor(a / q)} ${a % q}/${q}` : `${min}${a}/${q}`;
}
// Een getal p/q keer letters: 3x, 2/3x, 2 1/3x, of 0.
function coefTekst(p, q, L) {
  if (!p) return '0';
  const g = gcd(p, q);
  if (q / g === 1) return term({ c: p / g, m: L });
  return getalTekst(p, q) + letterTekst(L);
}
// Het antwoord bij een vereenvoudigde breuk { p, q, m }. Staan er letters in de noemer, dan is het een
// breuk zoals 2a/(3c). Anders staat een breuk als getal vooraan (2/3a), of met ervoor = false de letters
// in de teller (2a/3).
function antwoordTekst({ p, q, m }, ervoor = false) {
  if (!p) return '0';
  const boven = {},
    onder = {};
  for (const l in m) {
    if (m[l] > 0) boven[l] = m[l];
    else if (m[l] < 0) onder[l] = -m[l];
  }
  if (!letterTekst(onder)) {
    if (q === 1) return term({ c: p, m: boven });
    if (!letterTekst(boven) || ervoor) return getalTekst(p, q) + letterTekst(boven);
    return `${term({ c: p, m: boven })}/${q}`;
  }
  return `${p < 0 ? '-' : ''}${term({ c: Math.abs(p), m: boven })}/${noemerTekst({ c: q, m: onder })}`;
}
const breuk = (b, ervoor) => antwoordTekst(vereenvoudig(b), ervoor);
// Een breuk zoals hij na vermenigvuldigen staat, nog niet vereenvoudigd: 18ab/(12ab).
const ruw = (b) => (isEen(b.n) ? term(b.t) : `${term(b.t)}/${noemerTekst(b.n)}`);

// Een melding na een valkuil is gewone tekst: a^2 wordt a², een min wordt een echt minteken, en * een
// maalpunt.
const SUPER = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const gewoon = (s) =>
  String(s)
    .replace(/\^(\d+)/g, (_, e) => [...e].map((c) => SUPER[c]).join(''))
    .replace(/-/g, '−')
    .replace(/ \* /g, ' · ');

// Een uitdrukking met · of : tussen breuken, zoals 2a/(3b) · 9b/(4a) of 4 : 2/(3c). Het veld leest wat
// achter / staat als noemer, en zou er één breuk van maken. Daarom gaat elk deel apart naar U, en
// rekent v met haakjes om elk deel.
function stukken(s) {
  const uit = [];
  let diep = 0,
    begin = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') diep++;
    else if (s[i] === ')') diep--;
    else if (!diep && (s[i] === '·' || s[i] === ':') && s[i - 1] === ' ' && s[i + 1] === ' ') {
      uit.push(s.slice(begin, i - 1), s[i]);
      begin = i + 2;
    }
  }
  return [...uit, s.slice(begin)];
}
const toon = (s) =>
  String(s)
    .split('=')
    .map((d) =>
      stukken(d.trim())
        .map((p) => (p === '·' || p === ':' ? ` ${p} ` : U(p)))
        .join(''),
    )
    .join(' = ');
const reken = (s) =>
  stukken(s)
    .map((p) => (p === '·' ? '*' : p === ':' ? ':' : `(${p})`))
    .join(' ');

// Een regel met tekst en wiskunde: zin('Deel door ', W('5b'), '.'). De tekst gaat door T, de wiskunde
// door U, zoals in het veld.
const W = (s) => ({ w: s });
const zin = (...delen) => delen.map((d) => (typeof d === 'string' ? T(d) : toon(d.w))).join('');
const uitleg = (...delen) => H(zin(...delen));
const rij = (s) => H(toon(s));
const vraagTekst = (s) => `${T('{{herleiden|Herleid}}')} ${toon(s)}.`;

// De valkuilen met een foute uitdrukking. Een fout antwoord dat gelijk is aan het goede antwoord of aan
// een eerdere valkuil, valt weg: zo is een valkuil nooit het goede antwoord, en heeft elk fout antwoord
// één melding.
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
// uitdrukking zelf, en niet met de termen waarmee de generator het antwoord maakt. Wordt bij een punt een
// noemer 0, dan slaat v dat punt over; er moeten er minstens vier overblijven.
const PUNTEN = [
  [2, -3, 5, 7],
  [-1, 2, 3, -2],
  [3, 1, -2, 5],
  [-2, -1, 4, 3],
  [1, 3, -5, -4],
  [5, -2, 7, 2],
  [-3, 4, 2, -5],
  [4, 5, -1, 6],
];
function klopt(opgave, antwoord, letters) {
  let goed = 0;
  for (const p of PUNTEN) {
    const w = Object.fromEntries(letters.map((l, i) => [l, p[i]]));
    let a, b;
    try {
      a = invullen(opgave, w);
      b = invullen(antwoord, w);
    } catch (e) {
      // Delen door 0: dit punt telt niet mee.
      if (e.message === 'uitdrukking') continue;
      throw e;
    }
    if (a !== b) return false;
    goed++;
  }
  return goed >= 4;
}

// Maakt de vraag: "Herleid …." met een veld voor de uitdrukking. ook controleert nog iets wat het
// invullen niet ziet.
function vraag({ opgave, antwoord, hint, steps, traps = [], opties = {}, ook = () => true }) {
  const letters = [...new Set(opgave.match(/[a-z]/g))].sort();
  return metUitdrukking({
    q: vraagTekst(opgave),
    fields: [UF('', antwoord, { letters: letters.join(''), ...opties })],
    hint,
    steps,
    traps: valkuilen(antwoord, traps),
    v: () => klopt(reken(opgave), antwoord, letters) && ook(),
  });
}

const vereenvoudigZin = (b) => {
  const d = deler(b);
  return isEen(d)
    ? []
    : [uitleg('Vereenvoudig: deel de teller en de noemer door ', W(term(d)), '.')];
};

// ---------------------------------------------------------------------------------------------------
// 249. Vereenvoudigen: de teller en de noemer door hetzelfde getal en dezelfde letters delen, zoals
// 14pq/(21qr) = 2p/(3r). Ook als in de noemer niets overblijft (6k/k = 6), als in de teller alleen 1
// overblijft (k/(6k) = 1/6), en met een min in de teller of de noemer.
function s249vereenvoudigen() {
  const soort = pick(['algemeen', 'algemeen', 'heel', 'een', 'min']);
  const [X, Y, Z] = pick(DRIETAL);
  const PAAR = [
    [2, 3],
    [3, 4],
    [1, 2],
    [3, 5],
    [4, 5],
    [5, 6],
    [2, 5],
    [3, 2],
    [4, 3],
    [5, 2],
    [1, 3],
    [2, 1],
    [3, 1],
    [1, 4],
    [5, 3],
    [4, 1],
  ];
  const [r, s, g, eY, metX, metZ] = until(
    () => {
      const [r, s] =
        soort === 'heel' ? [ri(2, 9), 1] : soort === 'een' ? [1, ri(2, 9)] : pick(PAAR);
      const g = soort === 'heel' || soort === 'een' ? ri(1, 6) : ri(2, 6);
      const eY = pick(
        soort === 'heel'
          ? [
              [1, 1],
              [1, 1],
              [2, 1],
            ]
          : soort === 'een'
            ? [
                [1, 1],
                [1, 1],
                [1, 2],
              ]
            : [
                [1, 1],
                [1, 1],
                [2, 1],
                [1, 2],
              ],
      );
      return [r, s, g, eY, coin(), coin()];
    },
    ([r, s, g, , metX, metZ]) =>
      (soort === 'heel' || soort === 'een' || metX || metZ) && r * g <= 40 && s * g <= 40,
  );
  const tm = { [Y]: eY[0] },
    nm = { [Y]: eY[1] };
  if (soort !== 'een' && metX) tm[X] = 1;
  if (soort !== 'heel' && metZ) nm[Z] = 1;
  const min = soort === 'min' ? (coin() || coin() ? 'noemer' : 'teller') : null;
  const t = { c: r * g * (min === 'teller' ? -1 : 1), m: tm },
    n = { c: s * g * (min === 'noemer' ? -1 : 1), m: nm },
    b = B(t, n),
    v = vereenvoudig(b),
    antwoord = antwoordTekst(v),
    opgave = `${term(t)}/${noemerTekst(n)}`;
  const boven = Object.keys(v.m).filter((l) => v.m[l] > 0),
    onder = Object.keys(v.m).filter((l) => v.m[l] < 0);
  const tellerWeg = !boven.length && Math.abs(v.p) === 1,
    noemerWeg = !onder.length && v.q === 1;
  const steps = [rij(`${opgave} = ${antwoord}`)];
  if (min === 'noemer')
    steps.push(uitleg('Plus gedeeld door min is min. Zet de min vóór de breuk.'));
  if (min === 'teller')
    steps.push(uitleg('Min gedeeld door plus is min. De min blijft vóór de breuk.'));
  steps.push(uitleg('Deel de teller en de noemer door ', W(term(deler(b))), '.'));
  if (eY[0] !== eY[1])
    steps.push(
      uitleg(
        W(eY[0] > eY[1] ? `${Y}^2/${Y} = ${Y}` : `${Y}/${Y}^2 = 1/${Y}`),
        ', want ',
        W(`${Y}^2 = ${Y} · ${Y}`),
        '.',
      ),
    );
  if (tellerWeg) steps.push(uitleg('In de teller blijft 1 over.'));
  if (noemerWeg)
    steps.push(
      uitleg('In de noemer blijft 1 over. Een breuk met noemer 1 schrijf je zonder breukstreep.'),
    );
  const zonderY = { ...v.m };
  delete zonderY[Y];
  return vraag({
    opgave,
    antwoord,
    hint: T(
      `Deel de {{teller|teller}} en de {{noemer|noemer}} door hetzelfde getal en door de letters die in allebei staan.${min ? ' Een min zet je vóór de breuk.' : ''}`,
    ),
    steps,
    traps: [
      {
        id: 'een-in-de-teller',
        als: tellerWeg ? antwoordTekst(omgekeerdV(v)) : [],
        m: 'Deel je alles uit de teller weg, dan blijft daar 1 staan. Wat in de noemer overblijft, blijft in de noemer.',
      },
      {
        id: 'weggedeeld-is-nul',
        als: tellerWeg ? '0' : [],
        m: 'Deel je alles uit de teller weg, dan blijft daar 1 staan en niet 0.',
      },
      {
        id: 'breuk-omgedraaid',
        als: antwoordTekst(omgekeerdV(v)),
        m: 'Wat in de teller staat, blijft in de teller. Deel de teller en de noemer allebei door hetzelfde.',
      },
      {
        id: 'teken',
        als: min ? antwoordTekst(tegengesteld(v)) : [],
        m: `Let op het teken: ${min === 'noemer' ? 'plus gedeeld door min' : 'min gedeeld door plus'} is min.`,
      },
      {
        id: 'letter-helemaal-weg',
        als: eY[0] !== eY[1] ? antwoordTekst({ ...v, m: zonderY }) : [],
        m: `${Y}^2 = ${Y} · ${Y}. Je deelt maar één ${Y} weg, dus er blijft een ${Y} over.`,
      },
    ],
  });
}

// 250. De letter uit de breuk halen: x/8 = ⅛x, eerst vereenvoudigen (10p/25 = ⅖p). Uit de noemer kan
// het niet: 3/(9x) = 1/(3x). Daarna gelijksoortige termen samen (⅓x + 2x = 2⅓x), en een breuk met twee
// termen in de teller in de vorm ax + b.
function s250uitDeBreuk() {
  const soort = pick(['eruit', 'eruit', 'noemer', 'samen', 'samen', 'tweeterm']);
  const X = pick(LETTERS),
    M = { [X]: 1 },
    opties = { breuk: 'ervoor' };
  if (soort === 'eruit') {
    const m = ri(0, 3) ? M : Object.fromEntries(pick(PAREN).map((l) => [l, 1]));
    const [k, n] = until(
      () => [pick([1, 1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 14, 15, -1, -2, -3]), ri(2, 12)],
      ([k, n]) => n / gcd(k, n) >= 2,
    );
    const g = gcd(k, n),
      [kr, nr] = [k / g, n / g],
      L = letterTekst(m),
      opgave = `${term({ c: k, m })}/${n}`,
      tussen = `${term({ c: kr, m })}/${nr}`,
      antwoord = getalTekst(kr, nr) + L;
    const steps = [rij(g > 1 ? `${opgave} = ${tussen} = ${antwoord}` : `${opgave} = ${antwoord}`)];
    if (g > 1) steps.push(uitleg(`Vereenvoudig eerst: deel de teller en de noemer door ${g}.`));
    steps.push(uitleg('Haal de letter uit de breuk: ', W(`${tussen} = ${kr}/${nr} · ${L}`), '.'));
    if (Math.abs(kr) > nr)
      steps.push(
        uitleg('Schrijf ', W(`${kr}/${nr}`), ' als gemengd getal: ', W(getalTekst(kr, nr)), '.'),
      );
    return vraag({
      opgave,
      antwoord,
      opties,
      hint: T(
        '{{vereenvoudigen|Vereenvoudig}} de breuk eerst. Staat er alleen een getal in de {{noemer|noemer}}, dan zet je de breuk als getal vóór de letter.',
      ),
      steps,
      traps: [
        {
          id: 'breuk-omgedraaid',
          als: getalTekst(Math.sign(kr) * nr, Math.abs(kr)) + L,
          m: 'Het getal in de noemer blijft onder de breukstreep: je deelt erdoor.',
        },
      ],
    });
  }
  if (soort === 'noemer') {
    const [k, n] = until(
      () => [ri(2, 12), ri(2, 12)],
      ([k, n]) => gcd(k, n) > 1,
    );
    const g = gcd(k, n),
      [kr, nr] = [k / g, n / g],
      opgave = `${k}/(${n}${X})`,
      antwoord = `${kr}/${noemerTekst({ c: nr, m: M })}`;
    return vraag({
      opgave,
      antwoord,
      opties,
      hint: T(
        `{{vereenvoudigen|Vereenvoudig}} de breuk. Kijk dan waar de letter staat: in de {{noemer|noemer}} kun je hem niet uit de breuk halen.`,
      ),
      steps: [
        rij(`${opgave} = ${antwoord}`),
        uitleg(`Vereenvoudig: deel de teller en de noemer door ${g}.`),
        uitleg(
          `De letter ${X} staat in de noemer. Die kun je niet uit de breuk halen, dus het antwoord blijft een breuk.`,
        ),
      ],
      traps: [
        {
          id: 'letter-uit-noemer',
          als: coefTekst(kr, nr, M),
          m: 'Een letter in de noemer kun je niet uit de breuk halen. Let op: 1/3x lees ik als ⅓ · x. Staat de letter in de noemer, typ dan haakjes om de noemer.',
        },
      ],
    });
  }
  if (soort === 'samen') {
    const [k, n, r, eerst] = until(
      () => [ri(1, 9), ri(2, 8), nz(-5, 5), coin() || coin()],
      ([k, n]) => n / gcd(k, n) >= 2,
    );
    const g = gcd(k, n),
      [kr, nr] = [k / g, n / g],
      breukS = `${term({ c: k, m: M })}/${n}`,
      klein = `${term({ c: kr, m: M })}/${nr}`,
      uit = coefTekst(kr, nr, M),
      heel = term({ c: Math.abs(r), m: M }),
      teken = r < 0 ? '-' : '+',
      opgave = eerst ? `${breukS} ${teken} ${heel}` : `${term({ c: r, m: M })} + ${breukS}`,
      metUit = eerst ? `${uit} ${teken} ${heel}` : `${term({ c: r, m: M })} + ${uit}`,
      antwoord = coefTekst(kr + r * nr, nr, M),
      optel = eerst
        ? `${getalTekst(kr, nr)} ${teken} ${Math.abs(r)} = ${getalTekst(kr + r * nr, nr)}`
        : `${r} + ${getalTekst(kr, nr)} = ${getalTekst(kr + r * nr, nr)}`;
    const steps = [rij(`${opgave} = ${metUit} = ${antwoord}`)];
    if (g > 1) steps.push(uitleg('Vereenvoudig eerst: ', W(`${breukS} = ${klein}`), '.'));
    steps.push(
      uitleg('Haal de letter uit de breuk: ', W(`${klein} = ${uit}`), '.'),
      uitleg('Neem de {{gelijksoortige-termen|gelijksoortige termen}} samen: ', W(optel), '.'),
    );
    return vraag({
      opgave,
      antwoord,
      opties,
      hint: T(
        'Haal eerst de letter uit de breuk. Neem daarna de {{gelijksoortige-termen|gelijksoortige termen}} samen. Een onechte breuk schrijf je als {{gemengd-getal|gemengd getal}}.',
      ),
      steps,
      traps: [
        {
          id: 'teller-plus-heel',
          als: coefTekst(kr + r, nr, M),
          m: 'Haal eerst de letter uit de breuk. Tel daarna de getallen vóór de letter op: de breuk en het hele getal.',
        },
        {
          id: 'noemer-vergeten',
          als: coefTekst(k + r, 1, M),
          m: 'Vergeet de noemer niet: haal eerst de letter uit de breuk.',
        },
      ],
    });
  }
  const [a, b, n] = until(
    () => [ri(1, 9), nz(-9, 9), ri(2, 8)],
    ([a, , n]) => a % n !== 0,
  );
  const teken = b < 0 ? '-' : '+',
    opgave = `(${som([
      { c: a, m: M },
      { c: b, m: {} },
    ])})/${n}`,
    tussen = `${term({ c: a, m: M })}/${n} ${teken} ${Math.abs(b)}/${n}`,
    antwoord = `${coefTekst(a, n, M)} ${teken} ${getalTekst(Math.abs(b), n)}`;
  return vraag({
    opgave,
    antwoord,
    opties,
    hint: T(
      `Deel elke {{term|term}} van de {{teller|teller}} door ${n}. Haal daarna de letter uit de breuk.`,
    ),
    steps: [
      rij(`${opgave} = ${tussen}`),
      rij(`= ${antwoord}`),
      uitleg(`Deel elke term van de teller door ${n}.`),
      uitleg('Vereenvoudig de breuken en haal de letter uit de breuk.'),
    ],
    traps: [
      {
        id: 'niet-elke-term-gedeeld',
        als: [
          `${coefTekst(a, n, M)} ${teken} ${Math.abs(b)}`,
          `${term({ c: a, m: M })} ${teken} ${getalTekst(Math.abs(b), n)}`,
        ],
        m: `Deel elke term van de teller door ${n}.`,
      },
    ],
  });
}

// 251. Vermenigvuldigen en delen: teller keer teller en noemer keer noemer, delen door een breuk is
// vermenigvuldigen met het omgekeerde, en een breuk in de teller ((3/x)/4) of in de noemer (8/(4/x)).
function s251keerDelen() {
  const soort = pick(['keer', 'keer', 'delen', 'delen', 'teller', 'noemer']);
  const [X, Y] = pick(PAREN);
  const GETAL = [1, 2, 3, 4, 5, 6, 8, 9, 10, 12];
  const herleid = (b) => gcd(b.t.c, b.n.c) === 1;
  const steps = [];
  if (soort === 'keer' || soort === 'delen') {
    // F1 heeft X in de teller en Y in de noemer, H andersom. Zo is elke breuk herleid, en kun je na het
    // vermenigvuldigen kruiselings wegdelen.
    const [F1, H0, min] = until(
      () => [
        B(mono(pick(GETAL), X, ri(0, 2)), mono(pick([1, ...GETAL]), Y, ri(0, 1))),
        B(mono(pick(GETAL), Y, ri(0, 2)), mono(pick(GETAL), X, ri(0, 2))),
        pick([0, 0, 1, 2]),
      ],
      ([F1, H]) =>
        herleid(F1) &&
        herleid(H) &&
        (soort === 'keer' ? !isEen(H.n) : !isEen(H.t)) &&
        (gcd(F1.t.c, H.n.c) > 1 || gcd(H.t.c, F1.n.c) > 1) &&
        ((F1.t.m[X] && H.n.m[X]) || (F1.n.m[Y] && H.t.m[Y])) &&
        F1.t.c * H.t.c <= 120 &&
        F1.n.c * H.n.c <= 120,
    );
    const F = B({ c: min === 1 ? -F1.t.c : F1.t.c, m: F1.t.m }, F1.n),
      H = B({ c: min === 2 ? -H0.t.c : H0.t.c, m: H0.t.m }, H0.n),
      F2 = soort === 'keer' ? H : omgekeerd(H),
      P = maal(F, H),
      v = vereenvoudig(P),
      antwoord = antwoordTekst(v),
      o1 = opgaveTekst(F),
      o2 = opgaveTekst(F2),
      opgave = `${o1} ${soort === 'keer' ? '·' : ':'} ${o2}`;
    // Teller keer teller en noemer keer noemer, zonder de factoren 1.
    const factoren = (ts) => {
      const l = ts.filter((x) => !isEen(x));
      return !l.length ? '1' : l.length === 1 ? term(l[0]) : `(${l.map(term).join(' · ')})`;
    };
    const tl = factoren([F.t, H.t]),
      nl = factoren([F.n, H.n]),
      mid = `${tl}/${nl.startsWith('(') ? nl : noemerTekst(nl)}`;
    if (soort === 'keer') {
      steps.push(
        rij(`${opgave} = ${mid}`),
        uitleg('Vermenigvuldig teller met teller en noemer met noemer.'),
      );
    } else {
      steps.push(
        rij(`${opgave} = ${o1} · ${opgaveTekst(H)}`),
        uitleg(
          'Delen door een breuk is vermenigvuldigen met het omgekeerde: draai ',
          W(o2),
          ' om.',
        ),
        rij(`= ${mid}`),
      );
    }
    steps.push(rij(`= ${ruw(P)}`), rij(`= ${antwoord}`), ...vereenvoudigZin(P));
    // min is 1 als de min bij de eerste breuk staat, en 2 als hij bij de tweede staat.
    const tekens = (bij) => (min === 1 ? `min ${bij} plus` : `plus ${bij} min`);
    if (min)
      steps.push(
        uitleg(
          `${tekens(soort === 'keer' ? 'keer' : 'gedeeld door').replace(/^./, (x) => x.toUpperCase())} is min. De min staat vóór de breuk.`,
        ),
      );
    return vraag({
      opgave,
      antwoord,
      hint:
        soort === 'keer'
          ? T(
              'Vermenigvuldig {{teller|teller}} met teller en {{noemer|noemer}} met noemer. {{vereenvoudigen|Vereenvoudig}} daarna de breuk.',
            )
          : T(
              'Delen door een breuk is vermenigvuldigen met het omgekeerde. Draai de breuk om waardoor je deelt, en vermenigvuldig. {{vereenvoudigen|Vereenvoudig}} daarna.',
            ),
      steps,
      traps:
        soort === 'keer'
          ? [
              {
                id: 'kruislings',
                als: breuk(maal(F, omgekeerd(H))),
                m: 'Bij vermenigvuldigen doe je teller keer teller en noemer keer noemer. Je draait niets om.',
              },
              {
                id: 'teken',
                als: min ? antwoordTekst(tegengesteld(v)) : [],
                m: `Let op het teken: ${tekens('keer')} is min.`,
              },
            ]
          : [
              {
                id: 'niet-omgedraaid',
                als: breuk(maal(F, F2)),
                m: 'Delen door een breuk is vermenigvuldigen met het omgekeerde. Draai de breuk om waardoor je deelt.',
              },
              {
                id: 'verkeerde-omgedraaid',
                als: breuk(maal(omgekeerd(F), F2)),
                m: 'Draai alleen de breuk om waardoor je deelt. Wat vóór het deelteken staat, blijft staan.',
              },
              {
                id: 'teken',
                als: min ? antwoordTekst(tegengesteld(v)) : [],
                m: `Let op het teken: ${tekens('gedeeld door')} is min.`,
              },
            ],
    });
  }
  if (soort === 'teller') {
    // (F)/K: een breuk gedeeld door een term, zoals (3/x)/4.
    const [F, K] = until(
      () => [
        B(
          mono(pick([1, 2, 3, 4, 5, 6, 8, 9]), X, ri(0, 1)),
          mono(pick([1, 1, 2, 3, 4, 5]), Y, ri(0, 1)),
        ),
        mono(pick([1, 2, 3, 4, 5, 6, 8]), pick([X, Y]), ri(0, 1)),
      ],
      ([F, K]) =>
        herleid(F) && !isEen(F.n) && !isEen(K) && (letterTekst(F.t.m) || letterTekst(F.n.m)),
    );
    const P = maal(F, B(EEN, K)),
      antwoord = breuk(P),
      oF = opgaveTekst(F),
      opgave = `(${oF})/${noemerTekst(K)}`;
    steps.push(
      rij(`${opgave} = ${oF} : ${term(K)}`),
      uitleg('Een breukstreep is delen.'),
      rij(`= ${oF} · 1/${noemerTekst(K)}`),
      uitleg('Delen door ', W(term(K)), ' is vermenigvuldigen met ', W(`1/${noemerTekst(K)}`), '.'),
      rij(`= ${ruw(P)}`),
    );
    if (!isEen(deler(P))) steps.push(rij(`= ${antwoord}`), ...vereenvoudigZin(P));
    return vraag({
      opgave,
      antwoord,
      hint: zin(
        'Schrijf de lange breukstreep als delen. Delen door ',
        W(term(K)),
        ' is vermenigvuldigen met ',
        W(`1/${noemerTekst(K)}`),
        '.',
      ),
      steps,
      traps: [
        {
          id: 'deler-in-teller',
          als: breuk(maal(F, B(K))),
          m: `Je deelt door ${term(K)}. Dan komt ${term(K)} in de noemer, want delen door ${term(K)} is vermenigvuldigen met 1/${noemerTekst(K)}.`,
        },
      ],
    });
  }
  // A/(F): een term gedeeld door een breuk, zoals 8/(4/x).
  const [A, F] = until(
    () => [
      mono(pick([1, 2, 3, 4, 5, 6, 8, 9, 10, 12]), X, ri(0, 1)),
      B(
        mono(pick([1, 2, 3, 4, 5, 6]), Y, ri(0, 1)),
        mono(pick([1, 1, 2, 3, 4, 5, 6]), X, ri(0, 1)),
      ),
    ],
    ([A, F]) =>
      herleid(F) && !isEen(F.n) && (letterTekst(A.m) || letterTekst(F.t.m) || letterTekst(F.n.m)),
  );
  const P = maal(B(A), omgekeerd(F)),
    antwoord = breuk(P),
    oF = opgaveTekst(F),
    opgave = `${term(A)}/(${oF})`;
  steps.push(
    rij(`${opgave} = ${term(A)} : ${oF}`),
    uitleg('Een breukstreep is delen.'),
    rij(`= ${term(A)} · ${opgaveTekst(omgekeerd(F))}`),
    uitleg('Delen door een breuk is vermenigvuldigen met het omgekeerde: draai ', W(oF), ' om.'),
    rij(`= ${ruw(P)}`),
  );
  if (!isEen(deler(P))) steps.push(rij(`= ${antwoord}`), ...vereenvoudigZin(P));
  return vraag({
    opgave,
    antwoord,
    hint: T(
      'Schrijf de lange breukstreep als delen. Delen door een breuk is vermenigvuldigen met het omgekeerde.',
    ),
    steps,
    traps: [
      {
        id: 'niet-omgedraaid',
        als: breuk(maal(B(A), F)),
        m: 'Delen door een breuk is vermenigvuldigen met het omgekeerde. Draai de breuk in de noemer om.',
      },
      {
        id: 'breuk-omgedraaid',
        als: breuk(maal(F, B(EEN, A))),
        m: 'Wat boven de lange breukstreep staat, komt in de teller.',
      },
    ],
  });
}

// 252. Gelijknamige breuken optellen en aftrekken: de tellers samen en de noemer blijft, zoals
// 3/x + 5/x = 8/x. Ook met twee termen in de teller: bij aftrekken haakjes om de tweede teller.
function s252gelijknamig() {
  const soort = pick(['enkel', 'enkel', 'tweeterm', 'tweeterm', 'tweeterm']);
  const plus = coin(),
    s = plus ? 1 : -1,
    op = plus ? '+' : '-';
  const [X, N] = pick(PAREN);
  if (soort === 'enkel') {
    const [p1, p2, d, metX] = until(
      () => [ri(1, 9), ri(1, 9), pick([1, 1, 2, 3, 4, 5, 6]), coin()],
      ([p1, p2, d]) => gcd(p1, d) === 1 && gcd(p2, d) === 1 && p1 + s * p2 !== 0,
    );
    const M = metX ? { [X]: 1 } : {},
      D = { c: d, m: { [N]: 1 } },
      nD = noemerTekst(D),
      S = B({ c: p1 + s * p2, m: M }, D),
      v = vereenvoudig(S),
      antwoord = antwoordTekst(v),
      opgave = `${opgaveTekst(B({ c: p1, m: M }, D))} ${op} ${opgaveTekst(B({ c: p2, m: M }, D))}`;
    const steps = [
      rij(`${opgave} = (${term({ c: p1, m: M })} ${op} ${term({ c: p2, m: M })})/${nD}`),
      rij(`= ${ruw(S)}`),
      uitleg(
        `De breuken zijn {{gelijknamig|gelijknamig}}: ${plus ? 'tel de tellers op' : 'trek de tellers van elkaar af'}. De noemer blijft hetzelfde.`,
      ),
    ];
    if (!isEen(deler(S))) steps.push(rij(`= ${antwoord}`), ...vereenvoudigZin(S));
    return vraag({
      opgave,
      antwoord,
      opties: { breuk: 'een' },
      hint: T(
        `De breuken zijn {{gelijknamig|gelijknamig}}. ${plus ? 'Tel de tellers op' : 'Trek de tellers van elkaar af'}, en laat de {{noemer|noemer}} staan. {{vereenvoudigen|Vereenvoudig}} daarna als het kan.`,
      ),
      steps,
      traps: [
        {
          id: 'noemers-opgeteld',
          als: plus ? breuk(B(S.t, keer({ c: 2, m: {} }, D))) : [],
          m: 'Bij gelijknamige breuken blijft de noemer hetzelfde. Je telt alleen de tellers op.',
        },
        {
          id: 'teken',
          als: plus ? [] : antwoordTekst(tegengesteld(v)),
          m: 'Trek de tweede teller af van de eerste, niet andersom.',
        },
      ],
    });
  }
  // Twee termen in de teller. De tweede teller heeft twee termen, of alleen een term met de letter, of
  // alleen een getal.
  const metN = coin();
  const [a, b, c, e, d, vorm] = until(
    () => [ri(1, 6), nz(-9, 9), ri(1, 5), nz(-9, 9), metN ? ri(1, 6) : ri(2, 9), ri(0, 3)],
    ([a, b, c, e, d, vorm]) => {
      const [c2, e2] = vorm === 0 ? [c, 0] : vorm === 1 ? [0, Math.abs(e)] : [c, e];
      const A = a + s * c2,
        E = b + s * e2;
      return A !== 0 && E !== 0 && gcd(gcd(a, b), d) === 1 && gcd(gcd(c2, e2), d) === 1;
    },
  );
  const [c2, e2] = vorm === 0 ? [c, 0] : vorm === 1 ? [0, Math.abs(e)] : [c, e];
  const M = { [X]: 1 },
    T1 = [
      { c: a, m: M },
      { c: b, m: {} },
    ],
    T2 = [
      { c: c2, m: M },
      { c: e2, m: {} },
    ].filter((x) => x.c),
    D = { c: d, m: metN ? { [N]: 1 } : {} },
    nD = noemerTekst(D),
    R = [
      { c: a + s * c2, m: M },
      { c: b + s * e2, m: {} },
    ],
    h = gcd(gcd(R[0].c, R[1].c), d),
    Rh = R.map((x) => ({ c: x.c / h, m: x.m })),
    Dh = { c: d / h, m: D.m },
    antwoord = isEen(Dh) ? som(Rh) : `(${som(Rh)})/${noemerTekst(Dh)}`,
    t2 = T2.length > 1 ? `(${som(T2)})` : term(T2[0]),
    opgave = `(${som(T1)})/${nD} ${op} ${t2}/${nD}`;
  const steps = [];
  if (!plus && T2.length > 1)
    steps.push(
      rij(`${opgave} = (${som(T1)} - ${t2})/${nD}`),
      uitleg(
        'De noemers zijn gelijk. Zet de tellers op één breukstreep, met haakjes om de tweede teller.',
      ),
      rij(`= (${som([...T1, ...T2.map(tegen)])})/${nD}`),
      uitleg('Werk de haakjes weg: de min geldt voor elke term van de tweede teller.'),
    );
  else
    steps.push(
      rij(`${opgave} = (${som([...T1, ...T2.map((x) => (plus ? x : tegen(x)))])})/${nD}`),
      uitleg('De noemers zijn gelijk. Zet de tellers op één breukstreep.'),
    );
  steps.push(
    rij(`= (${som(R)})/${nD}`),
    uitleg('Neem de {{gelijksoortige-termen|gelijksoortige termen}} samen.'),
  );
  if (h > 1)
    steps.push(
      rij(`= ${antwoord}`),
      uitleg(`Vereenvoudig: deel elke term van de teller en de noemer door ${h}.`),
    );
  return vraag({
    opgave,
    antwoord,
    // Alleen met een letter in de noemer moet het één breuk zijn. Zonder is ⅐x + 2 ook herleid, zoals bij
    // de letter uit de breuk halen.
    opties: metN ? { breuk: 'een' } : {},
    hint: T(
      `De noemers zijn gelijk. Zet de tellers op één breukstreep${plus || T2.length === 1 ? '' : ', met haakjes om de tweede teller'}. Neem daarna de {{gelijksoortige-termen|gelijksoortige termen}} samen.`,
    ),
    steps,
    traps: [
      {
        id: 'min-niet-verdeeld',
        als:
          !plus && T2.length > 1
            ? [
                `(${som([
                  { c: a - c2, m: M },
                  { c: b + e2, m: {} },
                ])})/${nD}`,
                `(${som([
                  { c: a + c2, m: M },
                  { c: b - e2, m: {} },
                ])})/${nD}`,
              ]
            : [],
        m: `De min geldt voor elke term van de tweede teller: −${t2} = ${som(T2.map(tegen))}.`,
      },
      {
        id: 'noemers-opgeteld',
        als: plus ? `(${som(R)})/${noemerTekst(keer({ c: 2, m: {} }, D))}` : [],
        m: 'Bij gelijknamige breuken blijft de noemer hetzelfde. Je telt alleen de tellers op.',
      },
    ],
  });
}

// 253. Ongelijknamige breuken optellen en aftrekken: eerst gelijknamig maken. Noemers x en y geven xy,
// 2a en 3b geven 6ab, een heel getal of een letter als breuk (4 = 4b/b), en een tweede teller met twee
// termen die met haakjes keer een getal gaat. Het antwoord is één breuk.
function s253ongelijknamig() {
  const soort = pick(['letters', 'getallen', 'getallen', 'getal', 'tweeterm']);
  const plus = coin(),
    s = plus ? 1 : -1,
    op = plus ? '+' : '-',
    opties = { breuk: 'een' };
  const [A, Bl] = pick(PAREN);
  const gelijknamigZin = (lcd, f1, f2) => {
    const delen = [
      'Maak de breuken {{gelijknamig|gelijknamig}}: de noemer wordt ',
      W(term(lcd)),
      '.',
    ];
    const met = [
      ...(isEen(f1) ? [] : [['de eerste', f1]]),
      ...(isEen(f2) ? [] : [['de tweede', f2]]),
    ];
    met.forEach(([welke, f], i) =>
      delen.push(
        i
          ? `, en bij ${welke} met `
          : ` Vermenigvuldig bij ${welke} breuk de teller en de noemer met `,
        W(term(f)),
      ),
    );
    if (met.length) delen.push('.');
    return uitleg(...delen);
  };
  const tellersNoemers = {
    id: 'tellers-en-noemers-opgeteld',
    m: 'Breuken tel je niet op door de tellers en de noemers op te tellen. Maak eerst de noemers gelijk.',
  };
  const tellerNietMee = {
    id: 'teller-niet-mee',
    m: 'Vermenigvuldig je de noemer met iets, doe dat dan ook met de teller.',
  };
  if (soort === 'letters' || soort === 'getallen') {
    const zelfde = soort === 'getallen' && !ri(0, 2);
    const L2 = zelfde ? A : Bl;
    const [p, m, q, n] =
      soort === 'letters'
        ? [ri(1, 9), 1, ri(1, 9), 1]
        : until(
            () => [ri(1, 7), ri(1, 6), ri(1, 7), ri(1, 6)],
            ([p, m, q, n]) => {
              const L = lcm(m, n);
              return (
                gcd(p, m) === 1 &&
                gcd(q, n) === 1 &&
                (zelfde ? m !== n && (p * L) / m + (s * q * L) / n !== 0 : m * n > 1)
              );
            },
          );
    const L = lcm(m, n),
      D1 = { c: m, m: { [A]: 1 } },
      D2 = { c: n, m: { [L2]: 1 } },
      lcd = { c: L, m: zelfde ? { [A]: 1 } : { [A]: 1, [Bl]: 1 } },
      f1 = { c: L / m, m: zelfde ? {} : { [Bl]: 1 } },
      f2 = { c: L / n, m: zelfde ? {} : { [A]: 1 } },
      t1 = keer({ c: p, m: {} }, f1),
      t2 = keer({ c: q, m: {} }, f2),
      nL = noemerTekst(lcd),
      opgave = `${p}/${noemerTekst(D1)} ${op} ${q}/${noemerTekst(D2)}`,
      gelijk = `${term(t1)}/${nL} ${op} ${term(t2)}/${nL}`;
    let antwoord;
    const steps = [rij(`${opgave} = ${gelijk}`), gelijknamigZin(lcd, f1, f2)];
    if (zelfde) {
      const S = B({ c: t1.c + s * t2.c, m: {} }, lcd);
      antwoord = breuk(S);
      steps.push(rij(`= (${t1.c} ${op} ${t2.c})/${nL}`), rij(`= ${ruw(S)}`));
      if (!isEen(deler(S))) steps.push(rij(`= ${antwoord}`), ...vereenvoudigZin(S));
    } else {
      antwoord = `(${som([t1, { c: s * t2.c, m: t2.m }])})/${nL}`;
      steps.push(rij(`= ${antwoord}`), uitleg('Zet de tellers samen op één breukstreep.'));
    }
    return vraag({
      opgave,
      antwoord,
      opties,
      hint: T(
        'Maak de breuken eerst {{gelijknamig|gelijknamig}}: zoek een noemer waar beide noemers in passen. Vermenigvuldig de teller steeds met hetzelfde als de noemer.',
      ),
      steps,
      traps: [
        {
          ...tellersNoemers,
          als: plus ? `${p + q}/(${term(D1)} + ${term(D2)})` : [],
        },
        { ...tellerNietMee, als: `${p + s * q}/${nL}` },
      ],
    });
  }
  if (soort === 'getal') {
    const [k, p, m, metLetter, achter] = until(
      () => [ri(1, 9), ri(1, 9), ri(1, 5), !ri(0, 2), !ri(0, 3)],
      ([, p, m]) => gcd(p, m) === 1,
    );
    const E = metLetter ? { c: 1, m: { [Bl]: 1 } } : { c: k, m: {} },
      D = { c: m, m: { [A]: 1 } },
      nD = noemerTekst(D),
      ED = keer(E, D),
      fr = `${p}/${nD}`,
      opgave = achter ? `${fr} ${op} ${term(E)}` : `${term(E)} ${op} ${fr}`,
      teller = achter
        ? [
            { c: p, m: {} },
            { c: s * ED.c, m: ED.m },
          ]
        : [ED, { c: s * p, m: {} }],
      antwoord = `(${som(teller)})/${nD}`,
      gelijk = achter ? `${fr} ${op} ${term(ED)}/${nD}` : `${term(ED)}/${nD} ${op} ${fr}`;
    return vraag({
      opgave,
      antwoord,
      opties,
      hint: zin(
        'Schrijf ',
        W(term(E)),
        ' als breuk met dezelfde noemer als de andere breuk. Tel daarna de tellers op of trek ze af.',
      ),
      steps: [
        rij(`${opgave} = ${gelijk}`),
        uitleg(
          'Schrijf ',
          W(term(E)),
          ' als breuk met noemer ',
          W(term(D)),
          ': ',
          W(`${term(E)} = ${term(ED)}/${nD}`),
          '.',
        ),
        rij(`= ${antwoord}`),
        uitleg('Zet de tellers samen op één breukstreep.'),
      ],
      traps: [
        {
          id: 'getal-niet-gelijknamig',
          als: `(${som(
            achter
              ? [
                  { c: p, m: {} },
                  { c: s * E.c, m: E.m },
                ]
              : [E, { c: s * p, m: {} }],
          )})/${nD}`,
          m: `Schrijf ${term(E)} eerst als breuk met noemer ${term(D)}. Dan komt ${term(E)} · ${term(D)} in de teller.`,
        },
      ],
    });
  }
  // x/5 − (x − 2)/y: de noemer wordt 5y, en de tweede teller gaat met haakjes keer 5.
  const [n, p, q] = [ri(2, 6), ri(1, 3), nz(-9, 9)];
  const T2 = [
      { c: p, m: { [A]: 1 } },
      { c: q, m: {} },
    ],
    lcd = { c: n, m: { [Bl]: 1 } },
    nL = noemerTekst(lcd),
    AB = term({ c: 1, m: { [A]: 1, [Bl]: 1 } }),
    opgave = `${A}/${n} ${op} (${som(T2)})/${Bl}`,
    R = [
      { c: 1, m: { [A]: 1, [Bl]: 1 } },
      { c: s * n * p, m: { [A]: 1 } },
      { c: s * n * q, m: {} },
    ],
    antwoord = `(${som(R)})/${nL}`;
  return vraag({
    opgave,
    antwoord,
    opties,
    hint: zin(
      'Maak de breuken {{gelijknamig|gelijknamig}}: de noemer wordt ',
      W(term(lcd)),
      '. Zet haakjes om de tweede teller als je die met een getal vermenigvuldigt.',
    ),
    steps: [
      rij(`${opgave} = ${AB}/${nL} ${op} ${n}(${som(T2)})/${nL}`),
      gelijknamigZin(lcd, { c: 1, m: { [Bl]: 1 } }, { c: n, m: {} }),
      rij(`= (${AB} ${op} ${n}(${som(T2)}))/${nL}`),
      rij(`= ${antwoord}`),
      uitleg(
        plus
          ? 'Werk de haakjes weg: vermenigvuldig elke term met het getal ervoor.'
          : 'Werk de haakjes weg: vermenigvuldig elke term met het getal ervoor. De min geldt voor elke term.',
      ),
    ],
    traps: [
      {
        id: 'min-niet-verdeeld',
        als: plus ? [] : `(${som([R[0], R[1], tegen(R[2])])})/${nL}`,
        m: 'De min geldt voor elke term van de tweede teller. Zet haakjes om die teller.',
      },
      {
        id: 'haakjes-vergeten',
        als: `(${som([R[0], R[1], { c: s * q, m: {} }])})/${nL}`,
        m: `Vermenigvuldig de hele tweede teller met ${n}: zet er haakjes om.`,
      },
      {
        ...tellerNietMee,
        als: `(${som([R[0], { c: s * p, m: { [A]: 1 } }, { c: s * q, m: {} }])})/${nL}`,
      },
    ],
  });
}

// 254. Uitdaging: de teller en de noemer eerst ontbinden in factoren en dan vereenvoudigen, zoals
// (3x + 6)/(x + 2) = 3, (x² − 9)/(x + 3) = x − 3 en (x² + 5x)/(2x) = (x + 5)/2. Alleen een gemeenschappelijke
// factor en het merkwaardig product a² − b².
function s254ontbinden() {
  const soort = pick(['factor', 'factor', 'verschil', 'verschil', 'letter']);
  const om = !ri(0, 3);
  const deelWeg = (f) =>
    uitleg('De teller en de noemer hebben allebei de factor ', W(f), '. Deel die weg.');
  const strepen = {
    id: 'term-weggestreept',
    m: 'Je mag alleen een factor wegdelen, geen losse term. Ontbind eerst in factoren.',
  };
  const hint = T(
    '{{ontbinden-in-factoren|Ontbind}} de {{teller|teller}} en de {{noemer|noemer}} eerst in factoren. Een factor die boven en onder staat, mag je wegdelen. Een losse term niet.',
  );
  if (soort === 'factor') {
    const X = pick(LETTERS),
      k = pick([2, 3, 4, 5, 6, -2, -3]),
      m = nz(-9, 9);
    const Tm = [
        { c: k, m: { [X]: 1 } },
        { c: k * m, m: {} },
      ],
      N = [
        { c: 1, m: { [X]: 1 } },
        { c: m, m: {} },
      ],
      f = `(${som(N)})`,
      ontb = `${k}${f}`,
      opgave = om ? `${f}/(${som(Tm)})` : `(${som(Tm)})/${f}`,
      antwoord = om ? getalTekst(Math.sign(k), Math.abs(k)) : `${k}`;
    return vraag({
      opgave,
      antwoord,
      hint,
      steps: [
        rij(`${opgave} = ${om ? `${f}/(${ontb})` : `${ontb}/${f}`} = ${antwoord}`),
        uitleg(
          `{{ontbinden-in-factoren|Ontbind}} de ${om ? 'noemer' : 'teller'} in factoren: haal `,
          W(`${k}`),
          ' buiten haakjes.',
        ),
        deelWeg(f),
        ...(om ? [uitleg('In de teller blijft 1 over.')] : []),
      ],
      traps: [
        { ...strepen, als: om ? getalTekst(2 * Math.sign(k), Math.abs(k)) : `${2 * k}` },
        {
          id: 'teken',
          als: k < 0 ? (om ? getalTekst(1, -k) : `${-k}`) : [],
          m: 'Let op het teken: je haalt een negatief getal buiten haakjes.',
        },
      ],
    });
  }
  if (soort === 'verschil') {
    const X = pick(ZONDER_AB),
      m = ri(1, 9),
      k = om ? 1 : pick([1, 1, 1, 2, 3]),
      plusN = coin();
    const kw = [
        { c: 1, m: { [X]: 2 } },
        { c: -m * m, m: {} },
      ],
      Tm = kw.map((x) => ({ c: k * x.c, m: x.m })),
      fp = `(${X} + ${m})`,
      fm = `(${X} - ${m})`,
      fac = `${fp}${fm}`,
      fN = plusN ? fp : fm,
      fO = plusN ? fm : fp,
      over = [
        { c: k, m: { [X]: 1 } },
        { c: k * (plusN ? -m : m), m: {} },
      ],
      opgave = om ? `${fN}/(${som(Tm)})` : `(${som(Tm)})/${fN}`,
      antwoord = om ? `1/${fO}` : som(over);
    const mp = uitleg(
      'Ontbind met het {{merkwaardig-product|merkwaardig product}} ',
      W('a^2 - b^2 = (a + b)(a - b)'),
      ': ',
      W(`${som(kw)} = ${fac}`),
      '.',
    );
    const steps = [];
    if (om)
      steps.push(
        rij(`${opgave} = ${fN}/(${fac}) = ${antwoord}`),
        mp,
        deelWeg(fN),
        uitleg('In de teller blijft 1 over.'),
      );
    else if (k === 1) steps.push(rij(`${opgave} = ${fac}/${fN} = ${antwoord}`), mp, deelWeg(fN));
    else
      steps.push(
        rij(`${opgave} = ${k}(${som(kw)})/${fN}`),
        uitleg('Haal eerst ', W(`${k}`), ' buiten haakjes.'),
        rij(`= ${k}${fac}/${fN}`),
        mp,
        rij(`= ${k}${fO}`),
        deelWeg(fN),
        rij(`= ${antwoord}`),
      );
    return vraag({
      opgave,
      antwoord,
      hint,
      steps,
      traps: [
        {
          id: 'verkeerde-factor',
          als: om
            ? `1/${fN}`
            : som([
                { c: k, m: { [X]: 1 } },
                { c: k * (plusN ? m : -m), m: {} },
              ]),
          m: 'Deel de factor weg die in de teller en in de noemer staat. De andere factor blijft over.',
        },
      ],
    });
  }
  const X = pick(LETTERS);
  if (!om) {
    // (x² + px)/(kx) = (x + p)/k
    const k = ri(2, 6),
      p = nz(-9, 9),
      binnen = som([
        { c: 1, m: { [X]: 1 } },
        { c: p, m: {} },
      ]),
      opgave = `(${som([
        { c: 1, m: { [X]: 2 } },
        { c: p, m: { [X]: 1 } },
      ])})/(${k}${X})`,
      antwoord = `(${binnen})/${k}`;
    return vraag({
      opgave,
      antwoord,
      hint,
      steps: [
        rij(`${opgave} = ${X}(${binnen})/(${k}${X}) = ${antwoord}`),
        uitleg(
          '{{ontbinden-in-factoren|Ontbind}} de teller in factoren: haal ',
          W(X),
          ' buiten haakjes.',
        ),
        deelWeg(X),
      ],
      traps: [{ ...strepen, als: coefTekst(1 + p, k, { [X]: 1 }) }],
    });
  }
  // (kx + km)/(x² + mx) = k/x
  const k = ri(2, 6),
    m = nz(-9, 9),
    binnen = som([
      { c: 1, m: { [X]: 1 } },
      { c: m, m: {} },
    ]),
    opgave = `(${som([
      { c: k, m: { [X]: 1 } },
      { c: k * m, m: {} },
    ])})/(${som([
      { c: 1, m: { [X]: 2 } },
      { c: m, m: { [X]: 1 } },
    ])})`,
    antwoord = `${k}/${X}`;
  return vraag({
    opgave,
    antwoord,
    hint,
    steps: [
      rij(`${opgave} = ${k}(${binnen})/(${X}(${binnen})) = ${antwoord}`),
      uitleg(
        '{{ontbinden-in-factoren|Ontbind}} de teller en de noemer in factoren: haal ',
        W(`${k}`),
        ' en ',
        W(X),
        ' buiten haakjes.',
      ),
      deelWeg(`(${binnen})`),
    ],
    traps: [{ ...strepen, als: `${2 * k}/${X}` }],
  });
}

export default {
  slug: 'breuken-met-letters',
  title: 'Breuken met letters',
  intro:
    'Een breuk kan ook letters hebben, in de teller en in de noemer. Hier leer je zulke breuken herleiden: vereenvoudigen, de letter uit de breuk halen, vermenigvuldigen en delen, en optellen en aftrekken, ook als de noemers verschillen.',
  description:
    'Breuken met letters herleiden oefenen: vereenvoudigen, vermenigvuldigen en delen, optellen en gelijknamig maken. Havo 3, gratis met uitwerkingen.',
  videos: {},
  skills: [
    [249, 'Breuken met letters vereenvoudigen', s249vereenvoudigen],
    [250, 'De letter uit de breuk halen', s250uitDeBreuk],
    [251, 'Breuken vermenigvuldigen en delen', s251keerDelen],
    [252, 'Gelijknamige breuken optellen en aftrekken', s252gelijknamig],
    [253, 'Ongelijknamige breuken optellen en aftrekken', s253ongelijknamig],
    [254, 'Ontbinden en dan vereenvoudigen', s254ontbinden, 'uitdaging'],
  ],
  learn: [
    {
      t: 'Breuken vereenvoudigen',
      p: [
        T(
          'Een breuk met letters {{vereenvoudigen|vereenvoudig}} je net als een gewone breuk: je deelt de {{teller|teller}} en de {{noemer|noemer}} door hetzelfde. Dat kan een getal zijn, maar ook een letter die boven en onder staat.',
        ),
        zin(
          'Deel je alles uit de teller weg, dan blijft daar 1 staan: ',
          W('k/(6k) = 1/6'),
          '. Blijft er in de noemer alleen 1 over, dan schrijf je geen breukstreep: ',
          W('6k/k = 6'),
          '.',
        ),
        T('Een min in de noemer zet je vóór de breuk.'),
      ],
      how: [
        'Zoek het grootste getal waardoor je de teller en de noemer allebei kunt delen.',
        'Zoek de letters die in de teller en in de noemer staan.',
        'Deel de teller en de noemer door dat getal en die letters.',
      ],
      ex: {
        q: vraagTekst('14pq/(21qr)'),
        steps: [
          rij('14pq/(21qr) = 2p/(3r)'),
          uitleg('Deel de teller en de noemer door ', W('7q'), '.'),
        ],
      },
      ex2: {
        q: vraagTekst('4t/(-12st)'),
        steps: [
          rij('4t/(-12st) = -1/(3s)'),
          uitleg('Deel de teller en de noemer door ', W('4t'), '. In de teller blijft 1 over.'),
          uitleg('Plus gedeeld door min is min. Zet de min vóór de breuk.'),
        ],
      },
      watch: zin('Let op: ', W('k/(6k)'), ' is ', W('1/6'), ' en niet 6.'),
    },
    {
      t: 'De letter uit de breuk halen',
      p: [
        zin(
          'Staat er alleen een getal in de noemer, dan kun je de letter uit de breuk halen: ',
          W('t/6 = 1/6t'),
          '. Dat heet de {{=variabele-uit-de-breuk-halen|variabele uit de breuk halen}}. Vereenvoudig de breuk eerst: ',
          W('12t/18 = 2t/3 = 2/3t'),
          '.',
        ),
        zin(
          'Staat de letter in de noemer, dan kan dat niet. ',
          W('4/(10t)'),
          ' vereenvoudig je tot ',
          W('2/(5t)'),
          ', en dat blijft een breuk.',
        ),
        T(
          'Is het getal vóór de letter een onechte breuk, schrijf het dan als {{gemengd-getal|gemengd getal}}.',
        ),
      ],
      how: [
        'Vereenvoudig de breuk.',
        'Zet het getal als breuk vóór de letter.',
        'Neem daarna de gelijksoortige termen samen.',
      ],
      ex: {
        q: vraagTekst('t/4 + 3t'),
        steps: [
          rij('t/4 + 3t = 1/4t + 3t = 3 1/4t'),
          uitleg('Haal de letter uit de breuk: ', W('t/4 = 1/4t'), '.'),
          uitleg('Neem de gelijksoortige termen samen: ', W('1/4 + 3 = 3 1/4'), '.'),
        ],
      },
      ex2: {
        q: vraagTekst('(9m - 6)/12'),
        steps: [
          rij('(9m - 6)/12 = 9m/12 - 6/12'),
          rij('= 3/4m - 1/2'),
          uitleg(
            'Deel elke term van de teller door 12. Vereenvoudig en haal de letter uit de breuk.',
          ),
        ],
      },
      watch: zin(
        'Typ je een breuk met een letter in de noemer, zet dan haakjes om de noemer: 2/(5t). Zonder haakjes lees ik 2/5t als ',
        W('2/5t'),
        '.',
      ),
    },
    {
      t: 'Vermenigvuldigen en delen',
      p: [
        T(
          'Bij vermenigvuldigen doe je teller keer teller en noemer keer noemer. Daarna vereenvoudig je de breuk.',
        ),
        T(
          'Delen door een breuk is vermenigvuldigen met het omgekeerde: je draait de breuk om waardoor je deelt.',
        ),
        zin(
          'Staat er een breuk in de teller of in de noemer, schrijf de lange breukstreep dan als delen: ',
          W('(5/k)/3 = 5/k : 3 = 5/k · 1/3 = 5/(3k)'),
          '.',
        ),
      ],
      how: [
        'Schrijf delen door een breuk als vermenigvuldigen met het omgekeerde.',
        'Vermenigvuldig teller met teller en noemer met noemer.',
        'Vereenvoudig de breuk.',
      ],
      ex: {
        q: vraagTekst('3p/(4q) · 2q/(9p)'),
        steps: [
          rij('3p/(4q) · 2q/(9p) = (3p · 2q)/(4q · 9p)'),
          rij('= 6pq/(36pq)'),
          rij('= 1/6'),
          uitleg('Vermenigvuldig teller met teller en noemer met noemer.'),
          uitleg('Deel de teller en de noemer door ', W('6pq'), '.'),
        ],
      },
      ex2: {
        q: vraagTekst('10 : 5/(3n)'),
        steps: [
          rij('10 : 5/(3n) = 10 · 3n/5'),
          rij('= 30n/5'),
          rij('= 6n'),
          uitleg('Delen door een breuk is vermenigvuldigen met het omgekeerde.'),
        ],
      },
      watch: zin(
        'Vergeet bij delen niet om te draaien: ',
        W('10 : 5/(3n)'),
        ' is niet ',
        W('10 · 5/(3n)'),
        '.',
      ),
    },
    {
      t: 'Optellen en aftrekken',
      p: [
        T(
          'Breuken met dezelfde noemer zijn {{gelijknamig|gelijknamig}}. Die tel je op door de tellers op te tellen. De noemer blijft hetzelfde.',
        ),
        zin(
          'Zijn de noemers verschillend, maak de breuken dan eerst gelijknamig. Bij de noemers ',
          W('m'),
          ' en ',
          W('n'),
          ' wordt de noemer ',
          W('mn'),
          ', en bij ',
          W('2m'),
          ' en ',
          W('3n'),
          ' wordt hij ',
          W('6mn'),
          '. Een heel getal schrijf je ook als breuk: ',
          W('2 = 2n/n'),
          '.',
        ),
        T(
          'Bij aftrekken zet je haakjes om de tweede teller, want de min geldt voor elke term. Het antwoord schrijf je als één breuk.',
        ),
      ],
      how: [
        'Maak de noemers gelijk. Vermenigvuldig de teller met hetzelfde als de noemer.',
        'Zet de tellers op één breukstreep, met haakjes om een teller met twee termen.',
        'Werk de haakjes weg en neem de gelijksoortige termen samen.',
      ],
      ex: {
        q: vraagTekst('2/m + 5/n'),
        steps: [
          rij('2/m + 5/n = 2n/(mn) + 5m/(mn)'),
          rij('= (2n + 5m)/(mn)'),
          uitleg('Maak de breuken gelijknamig: de noemer wordt ', W('mn'), '.'),
        ],
      },
      ex2: {
        q: vraagTekst('(3k + 1)/(2r) - (k - 4)/(2r)'),
        steps: [
          rij('(3k + 1)/(2r) - (k - 4)/(2r) = (3k + 1 - (k - 4))/(2r)'),
          rij('= (3k + 1 - k + 4)/(2r)'),
          rij('= (2k + 5)/(2r)'),
          uitleg(
            'De noemers zijn gelijk. Zet haakjes om de tweede teller, want de min geldt voor elke term.',
          ),
        ],
      },
      watch: zin(
        'Tel de noemers niet op: ',
        W('2/m + 5/m'),
        ' is ',
        W('7/m'),
        ' en niet ',
        W('7/(2m)'),
        '.',
      ),
    },
    {
      t: 'Ontbinden en dan vereenvoudigen',
      p: [
        zin(
          'Als uitdaging {{ontbinden-in-factoren|ontbind}} je de teller en de noemer eerst in factoren. Een factor die boven en onder staat, deel je weg: ',
          W('(4t + 8)/(t + 2) = 4(t + 2)/(t + 2) = 4'),
          '.',
        ),
        T('Je mag alleen een factor wegdelen, geen losse term.'),
      ],
    },
  ],
};
