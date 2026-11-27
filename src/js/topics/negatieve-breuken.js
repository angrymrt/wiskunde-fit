// Onderwerp: Negatieve breuken. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten
// onderaan.
// Rekenen met de deelstreep, een negatieve breuk vereenvoudigen, en negatieve breuken optellen,
// aftrekken en vermenigvuldigen. Zoals in het boek staat een negatief getal zonder haakjes, en het
// minteken van een negatieve breuk voor de breuk: -{3/4} en {-2 1/3}. Breuken delen doet het boek in
// dit hoofdstuk niet. Een gemeenschappelijke noemer is hoogstens 60, en bij gemengde getallen
// hoogstens 24.
import { ri, pick, coin, gcd, lcm, Q, near, until } from '../math.js';
import { F } from './shared.js';
import { T } from '../typeset.js';
import { vierkantFig } from '../getalfiguren.js';
import {
  magisch,
  vierkantOpen,
  vierkantLetters,
  losVierkantOp,
  vierkantStappen,
  vierkantKlopt,
  letterLijst,
  mintekenFout,
} from '../puzzels.js';

// Het veld voor een breuk als antwoord: zo ver mogelijk vereenvoudigd, de helen eruit halen mag.
const BF = (pre, q, post) => ({ ...F(pre, q, post), vorm: 'vereenvoudigd' });
const metTeken = (x) => (coin() ? -x : x);
const doe = (x, op, y) => (op === '+' ? x + y : op === '-' ? x - y : op === '*' ? x * y : x / y);
const lijst = (xs) =>
  xs.length === 1 ? `${xs[0]}` : `${xs.slice(0, -1).join(', ')} en ${xs[xs.length - 1]}`;
const zegTeken = (x) => (x > 0 ? 'positief' : 'negatief');
const hoofd = (s) => s[0].toUpperCase() + s.slice(1);

// Een breuk t/n als tekst voor T, zonder te vereenvoudigen, met het minteken voor de breuk: -{3/4}.
// De noemer n is positief. Met noemer 1 is het een heel getal.
const br = (t, n) => (n === 1 ? String(t) : `${t < 0 ? '-' : ''}{${Math.abs(t)}/${n}}`);
// Een negatief of positief gemengd getal: {-2 1/3} of {2 1/3}.
const gm = (neg, h, t, n) => `{${neg ? '-' : ''}${h} ${t}/${n}}`;

// Een getal in een som of product: teken s (1 of -1), helen h, teller t en noemer n. Een breuk heeft
// h = 0, een heel getal t = 0 en n = 1. Teller en noemer zijn positief.
const breukGetal = (n) => ({ s: metTeken(1), h: 0, t: ri(1, n - 1), n });
const gemengdGetal = (n, max = 4) => ({ s: metTeken(1), h: ri(1, max), t: ri(1, n - 1), n });
const isGemengd = (x) => x.h > 0 && x.n > 1;
const vereenvoudigd = (x) => x.n === 1 || gcd(x.t, x.n) === 1;
// Het getal als tekst voor T.
const toon = (x) =>
  x.n === 1 ? String(x.s * x.h) : x.h ? gm(x.s < 0, x.h, x.t, x.n) : br(x.s * x.t, x.n);
// De waarde als kommagetal, voor de controle v: helen plus breuk, met het teken ervoor.
const waarde = (x) => x.s * (x.h + x.t / x.n);
// De fout bij een negatief gemengd getal: de min alleen op de helen, zoals −2 + 1/3 bij −2 1/3.
const waardeMinOpHelen = (x) => (isGemengd(x) && x.s < 0 ? -x.h + x.t / x.n : waarde(x));
// De helen binnen de breuk: een breuk met een teller met teken, zoals -7/3 bij {-2 1/3}.
const onecht = (x) => ({ t: x.s * (x.h * x.n + x.t), n: x.n });
const zonderTeken = (x) => ({ ...x, s: 1 });
// Een getal of breuk zoals je het leest, voor een melding: −2 1/3.
const zw = (x) => String(x).replace(/-/g, '−');
const leesGetal = (x) =>
  zw(x.n === 1 ? x.s * x.h : `${x.s < 0 ? '-' : ''}${x.h ? `${x.h} ` : ''}${x.t}/${x.n}`);

// Een valkuil per fout. fouten is een lijst [id, veld, foute waarde], in de volgorde waarin ze
// voorgaan. Een foute waarde die gelijk is aan het goede antwoord van dat veld valt weg, net als een
// waarde die geen getal is. Geven twee fouten dezelfde waarde, dan hoort die bij de eerste, zodat een
// leerling één melding krijgt die past. Zonder foute waarde is er geen valkuil. De test leest w om
// te kijken of elke valkuil kan afgaan.
function maakTraps(fouten, goed, berichten) {
  const bezet = [],
    perId = new Map();
  for (const [id, i, x] of fouten) {
    if (!Number.isFinite(x) || near(x, goed[i])) continue;
    if (bezet.some(([j, y]) => i === j && near(x, y))) continue;
    bezet.push([i, x]);
    perId.set(id, [...(perId.get(id) || []), [i, x]]);
  }
  return [...perId].map(([id, w]) => ({
    id,
    w,
    f: (v) => w.some(([i, x]) => Number.isFinite(v[i]) && near(v[i], x)),
    m: berichten[id],
  }));
}

// De regels van een uitkomst t/n (t met teken) tot de breuk zo ver mogelijk vereenvoudigd is, en de
// helen eruit: met helen 'mag' als dat mag maar niet hoeft, met 'eruit' als gewone stap.
function afmaken(t, n, helen = 'mag') {
  const a = Math.abs(t),
    k = gcd(a, n),
    tt = a / k,
    nn = n / k,
    min = t < 0 ? -1 : 1,
    s = [];
  if (nn === 1) s.push(`Deel de teller door de noemer: ${br(t, n)} = ${min * tt}`);
  else if (k > 1) s.push(`Teller en noemer door ${k} delen: ${br(t, n)} = ${br(min * tt, nn)}`);
  else
    s.push(
      `${a} en ${n} kun je niet door hetzelfde getal delen, dus ${br(t, n)} is al zo ver mogelijk vereenvoudigd.`,
    );
  if (nn > 1 && tt > nn) {
    const g = gm(t < 0, Math.floor(tt / nn), tt % nn, nn);
    s.push(
      helen === 'eruit'
        ? `Haal de helen eruit: ${br(min * tt, nn)} = ${g}`
        : `Helen eruit halen mag, maar hoeft niet: ${br(min * tt, nn)} = ${g}`,
    );
  }
  return s;
}

// De regel met de nieuwe noemer bij gelijknamig maken, net als bij Rekenen met breuken.
function nieuweNoemer(ns) {
  const u = [...new Set(ns)].sort((x, y) => x - y),
    L = u.reduce(lcm);
  if (u.includes(L)) {
    const rest = u.filter((x) => x !== L);
    return `De nieuwe noemer is ${L}, want ${L} staat ook in de tafel van ${lijst(rest)}.`;
  }
  if (u.length === 2 && L === u[0] * u[1]) return `De nieuwe noemer is ${u[0]} * ${u[1]} = ${L}.`;
  return `De nieuwe noemer is ${L}: dat is het eerste getal dat in de tafels van ${lijst(u)} staat.`;
}
// Een regel per breuk die een andere noemer krijgt. bs zijn breuken {t, n} met een teller met teken.
const omzetten = (bs, L) =>
  bs
    .filter((x) => x.n !== L)
    .map((x) =>
      x.n === 1
        ? `Schrijf ${x.t} als breuk met noemer ${L}: ${x.t} = ${br(x.t * L, L)}`
        : `Teller en noemer keer ${L / x.n}: ${br(x.t, x.n)} = ${br((x.t * L) / x.n, L)}`,
    );
// De regel bij het binnen brengen van de helen, voor de gemengde getallen in xs.
function binnenBrengen(xs) {
  const gs = xs.filter(isGemengd);
  if (!gs.length) return [];
  const neg = gs.some((x) => x.s < 0) ? '. De min hoort bij het hele getal' : '';
  const delen = gs.map((x) => `${toon(x)} = ${br(onecht(x).t, x.n)}`);
  return [`Breng de helen binnen de breuk${neg}: ${delen.join(' en ')}`];
}

// Rekent een berekening als tekst na, zoals '5 - (-18 + 6) : (-4)'. Een eigen ontleder, los van de
// stappen in de generator, voor de controle v. Een min aan het begin, na een bewerking of na '('
// hoort bij het getal erachter.
function narekenen(s) {
  const ts = s.match(/\d+|[-+*:()]/g) || [];
  let i = 0;
  const een = () => {
    if (ts[i] === '-') {
      i++;
      return -een();
    }
    if (ts[i] === '(') {
      i++;
      const x = som();
      return ts[i++] === ')' ? x : NaN;
    }
    return /^\d+$/.test(ts[i] ?? '') ? Number(ts[i++]) : NaN;
  };
  const meer = (x) =>
    ts[i] === '*' || ts[i] === ':' ? meer(ts[i++] === '*' ? x * een() : x / een()) : x;
  const product = () => meer(een());
  const plus = (x) =>
    ts[i] === '+' || ts[i] === '-' ? plus(ts[i++] === '+' ? x + product() : x - product()) : x;
  const som = () => plus(product());
  const x = som();
  return i === ts.length ? x : NaN;
}

const BERICHTEN = {
  'niet-eerst-teller-en-noemer':
    'Reken eerst de hele teller en de hele noemer uit, en deel daarna. De deelstreep werkt als haakjes om de teller en om de noemer.',
  'min-gedeeld-door-min-is-min':
    'Een breuk is een deling. Negatief gedeeld door negatief is positief, net als bij vermenigvuldigen.',
  'teller-en-noemer-omgedraaid':
    'Je hebt de noemer door de teller gedeeld. Het is andersom: de teller gedeeld door de noemer.',
  'minteken-weggelaten':
    'Er staat één minteken in de breuk. Dat mag je niet weglaten: zet het voor de breuk. De breuk is negatief.',
  'twee-mintekens-niet-weggestreept':
    'Er staan twee mintekens in de breuk, in de teller en in de noemer. Negatief gedeeld door negatief is positief, dus de twee mintekens vallen weg.',
  'plus-min-als-plus':
    'Plus een negatief getal is hetzelfde als min. Je hebt de min van het negatieve getal weggelaten.',
  'min-min-als-min':
    'Min een negatief getal is hetzelfde als plus. Twee mintekens naast elkaar worden een plus.',
  'negatief-min-getal-als-verschil':
    'Trek je iets af van een negatief getal, dan ga je nog verder naar links op de getallenlijn, verder van 0 af.',
  'keerregel-bij-aftrekken':
    'Min keer min is plus geldt bij vermenigvuldigen, niet bij aftrekken. Trek je iets af van een negatief getal, dan ga je nog verder naar links.',
  'tellers-en-noemers-opgeteld':
    'Je mag niet de tellers en de noemers allebei optellen of aftrekken. Maak de breuken eerst gelijknamig. Dan reken je alleen met de tellers, en blijft de noemer hetzelfde.',
  'alleen-noemer-veranderd':
    'Bij gelijknamig maken verander je de teller en de noemer allebei: je vermenigvuldigt ze met hetzelfde getal. Verander je alleen de noemer, dan wordt de breuk een andere.',
  'minteken-vergeten': 'Kijk nog eens naar het teken van je antwoord.',
  'min-keer-min-is-min':
    'Negatief keer negatief is positief, ook bij breuken. Twee mintekens samen geven een plus.',
  'gemengd-los-vermenigvuldigd':
    'Je mag de helen en de breuken niet los vermenigvuldigen. Breng eerst de helen binnen de breuk, en vermenigvuldig dan.',
  'heel-getal-teller-en-noemer':
    'Je hebt het hele getal met de teller én met de noemer vermenigvuldigd. Dan blijft de breuk even groot. Schrijf het hele getal als breuk met noemer 1.',
  'toch-gelijknamig-gemaakt':
    'Bij vermenigvuldigen maak je de breuken niet gelijknamig. Vermenigvuldig de tellers met elkaar en de noemers met elkaar.',
  'noemer-gelijk-gelaten':
    'Bij vermenigvuldigen blijft de noemer niet hetzelfde, ook niet als de noemers gelijk zijn. Vermenigvuldig ook de noemers met elkaar.',
};
// De melding bij een negatief gemengd getal waarvan de min alleen op de helen staat, met dat getal
// erin, zoals −2 1/3.
const minOpHelen = (x) =>
  `Bij een negatief gemengd getal hoort de min bij het hele getal, dus ook bij de breuk. Zo is ${leesGetal(x)} hetzelfde als −${x.h} − ${x.t}/${x.n}, en niet −${x.h} + ${x.t}/${x.n}.`;
// Het teken vergeten bij een deling en bij een product: dezelfde fout, met een eigen uitleg.
const DELING_TEKEN = {
  ...BERICHTEN,
  'minteken-vergeten':
    'Een breuk is een deling. Positief gedeeld door negatief is negatief, en negatief gedeeld door positief ook.',
};
const KEER_TEKEN = {
  ...BERICHTEN,
  'minteken-vergeten':
    'Positief keer negatief is negatief, en negatief keer positief ook. Vergeet het minteken niet.',
};

// --- 211 Rekenen met de deelstreep ---

// Een berekening [a, op, b] met uitkomst x, of null als dat niet mooi kan.
function splits(x, op) {
  if (op === '+') {
    const a = metTeken(ri(1, 20));
    return [a, '+', x - a];
  }
  if (op === '-') {
    const b = metTeken(ri(1, 15));
    return [x + b, '-', b];
  }
  const a = metTeken(ri(2, 6));
  return [a, '*', x / a];
}
const mooiDeel = (d) =>
  d.length === 1 ||
  (Number.isInteger(d[2]) &&
    d[0] !== 0 &&
    d[2] !== 0 &&
    Math.abs(d[0]) <= 40 &&
    Math.abs(d[2]) <= 40 &&
    (d[1] !== '*' || Math.abs(d[2]) >= 2));
const deelTekst = (d) => d.join(' ');

function deelstreep() {
  const soort = pick(['teller', 'noemer', 'beide', 'buiten', 'buiten']);
  const binnen = soort === 'buiten' ? pick(['teller', 'noemer', 'geen']) : soort;
  const metTeller = binnen === 'teller' || binnen === 'beide',
    metNoemer = binnen === 'noemer' || binnen === 'beide';
  const { q, N, Tw, tel, noe, buiten } = until(
    () => {
      const q = metTeken(ri(1, 9)),
        N = metTeken(ri(2, metNoemer ? 12 : 9)),
        Tw = q * N;
      return {
        q,
        N,
        Tw,
        tel: metTeller ? splits(Tw, pick(['+', '-', '*'])) : [Tw],
        noe: metNoemer ? splits(N, pick(['+', '-', '*'])) : [N],
        buiten:
          soort === 'buiten'
            ? { op: pick(['+', '-', '*']), e: metTeken(ri(2, 9)), voor: coin() }
            : null,
      };
    },
    ({ q, Tw, N, tel, noe, buiten }) =>
      mooiDeel(tel) &&
      mooiDeel(noe) &&
      // Er staat een negatief getal in, en de uitkomst is niet te groot.
      [...tel, ...noe, buiten?.e].some((x) => typeof x === 'number' && x < 0) &&
      (!buiten || Math.abs(doe(buiten.e, buiten.op, q)) <= 100),
  );
  // Met een bewerking buiten de breuk: e op x, of x op e.
  const metBuiten = (x) =>
    buiten ? (buiten.voor ? doe(buiten.e, buiten.op, x) : doe(x, buiten.op, buiten.e)) : x;
  const omBuiten = (s) =>
    buiten ? (buiten.voor ? `${buiten.e} ${buiten.op} ${s}` : `${s} ${buiten.op} ${buiten.e}`) : s;
  const breuk = `{${deelTekst(tel)}/${deelTekst(noe)}}`,
    s = omBuiten(breuk),
    R = metBuiten(q);
  const rows = [`${s} =`];
  if (metTeller || metNoemer) rows.push(`${omBuiten(`{${Tw}/${N}}`)} =`);
  if (buiten) rows.push(`${omBuiten(String(q))} = ${R}`);
  else rows[rows.length - 1] += ` ${R}`;

  const fouten = [];
  if (metTeller && tel[1] !== '*') {
    const [a, op, b] = tel;
    fouten.push(
      ['niet-eerst-teller-en-noemer', 0, metBuiten(doe(a, op, b / N))],
      ['niet-eerst-teller-en-noemer', 0, metBuiten(doe(a / N, op, b))],
    );
  }
  if (metNoemer && noe[1] !== '*') {
    const [c, op, d] = noe;
    fouten.push(['niet-eerst-teller-en-noemer', 0, metBuiten(doe(Tw / c, op, d))]);
  }
  if (Tw < 0 && N < 0) fouten.push(['min-gedeeld-door-min-is-min', 0, metBuiten(-q)]);
  else if (Tw < 0 || N < 0) fouten.push(['minteken-vergeten', 0, metBuiten(-q)]);
  fouten.push(['teller-en-noemer-omgedraaid', 0, metBuiten(N / Tw)]);
  // Gewone tekst voor de ontleder: de deelstreep als haakjes om teller en noemer.
  const plat = omBuiten(`(${deelTekst(tel)}) : (${deelTekst(noe)})`);
  const fields = [F('Uitkomst:', R)];
  return {
    q: T(`Bereken ${s}.`),
    fields,
    hint: T(
      `De {{deelstreep|deelstreep}} betekent delen.${metTeller || metNoemer ? ' Reken eerst de teller en de noemer apart uit. Deel daarna.' : ''}${buiten ? ' Reken de breuk uit voor je de bewerking buiten de breuk doet.' : ''}`,
    ),
    steps: [...rows, `Controle van de deling: ${q} * ${N} = ${Tw}`],
    traps: maakTraps(fouten, [R], DELING_TEKEN),
    // Een eigen ontleder rekent de berekening na, met haakjes om de teller en de noemer.
    v: () => narekenen(plat) === fields[0].a && Number.isInteger(fields[0].a),
  };
}

// --- 212 Een negatieve breuk vereenvoudigen ---

function vereenvoudigen() {
  const plek = pick(['teller', 'noemer', 'beide']);
  const [p, n, k] = until(
    () => {
      const n = ri(2, 12);
      return [ri(1, 3 * n), n, pick([1, 2, 2, 3, 3, 4, 5, 6, 7, 8])];
    },
    ([p, n, k]) => gcd(p, n) === 1 && n * k <= 60 && p * k <= 99,
  );
  const t = p * k,
    m = n * k,
    ts = plek === 'noemer' ? t : -t,
    ns = plek === 'teller' ? m : -m,
    neg = plek !== 'beide',
    antw = Q(neg ? -p : p, n),
    helen = p > n && coin(),
    s = `{${ts}/${ns}}`,
    zonder = br(neg ? -t : t, m),
    fields = [{ ...F(`${s} =`, antw), vorm: helen ? 'gemengd' : 'vereenvoudigd' }];
  const eerst = {
    teller: `Er staat één minteken, in de teller. Zet het voor de breuk: ${s} = ${zonder}`,
    noemer: `Er staat één minteken, in de noemer. Zet het voor de breuk, want positief gedeeld door negatief is negatief: ${s} = ${zonder}`,
    beide: `Er staan twee mintekens, in de teller en in de noemer. Die vallen weg, want negatief gedeeld door negatief is positief: ${s} = ${zonder}`,
  }[plek];
  return {
    q: T(
      `Vereenvoudig ${s} zo ver mogelijk.${helen ? ' Haal ook de helen eruit.' : ''} Laat geen minteken in de teller of de noemer staan.`,
    ),
    fields,
    hint: T(
      'Staat er één minteken in de teller of de noemer, zet het dan voor de breuk. Twee mintekens vallen weg. Deel daarna de teller en de noemer door hetzelfde getal.',
    ),
    steps: [eerst, ...afmaken(neg ? -t : t, m, helen ? 'eruit' : 'mag')],
    traps: maakTraps(
      [[neg ? 'minteken-weggelaten' : 'twee-mintekens-niet-weggestreept', 0, -antw.n / antw.d]],
      [antw.n / antw.d],
      BERICHTEN,
    ),
    // Rekent terug: het antwoord keer de noemer van de vraag is de teller van de vraag, met teken.
    v: () => near(fields[0].a * ns, ts),
  };
}

// --- 213 Negatieve breuken optellen en aftrekken ---

function kiesSom(soort) {
  if (soort === 'gelijk') {
    const n = pick([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    return [breukGetal(n), breukGetal(n)];
  }
  if (soort === 'ongelijk') return [breukGetal(ri(2, 12)), breukGetal(ri(2, 12))];
  if (soort === 'gemengd') {
    const a = gemengdGetal(ri(2, 8)),
      b = coin() ? gemengdGetal(ri(2, 8)) : breukGetal(ri(2, 10));
    return coin() ? [a, b] : [b, a];
  }
  return [
    { s: metTeken(1), h: ri(1, 6), t: 0, n: 1 },
    coin() ? breukGetal(ri(2, 10)) : gemengdGetal(ri(2, 8), 3),
  ];
}
// De som A op B: na de tekenregel staat er A op2 |B|, met de tellers a en c bij noemer L.
function somDelen(A, op, B) {
  const op2 = (op === '+') === B.s > 0 ? '+' : '-',
    B2 = zonderTeken(B),
    a0 = onecht(A),
    c0 = onecht(B2),
    L = lcm(A.n, B.n),
    a = (a0.t * L) / A.n,
    c = (c0.t * L) / B.n;
  return { op2, B2, a0, c0, L, a, c, r: doe(a, op2, c) };
}

function optellenAftrekken() {
  const soort = pick(['gelijk', 'ongelijk', 'ongelijk', 'gemengd', 'gemengd', 'heel']),
    op = soort === 'heel' ? '-' : pick(['+', '-']);
  const [A, B] = until(
    () => kiesSom(soort),
    ([A, B]) => {
      if (!vereenvoudigd(A) || !vereenvoudigd(B)) return false;
      const L = lcm(A.n, B.n),
        { r } = somDelen(A, op, B);
      if (soort === 'gelijk' && A.t === B.t) return false;
      if (soort === 'ongelijk' && (A.n === B.n || L > 60)) return false;
      if (soort === 'gemengd' && (L > 24 || ![A, B].some((x) => isGemengd(x) && x.s < 0)))
        return false;
      return r !== 0 && (A.s < 0 || B.s < 0 || r < 0);
    },
  );
  const { op2, B2, a0, c0, L, a, c, r } = somDelen(A, op, B),
    antw = Q(r, L),
    goed = antw.n / antw.d;
  const s = `${toon(A)} ${op} ${toon(B)}`,
    s2 = `${toon(A)} ${op2} ${toon(B2)}`,
    fields = [BF(`${s} =`, antw)];
  const steps = [];
  if (B.s < 0)
    steps.push(
      `${op === '+' ? 'Plus een negatief getal is min' : 'Min een negatief getal is plus'}: ${s} = ${s2}`,
    );
  steps.push(...binnenBrengen([A, B2]));
  if (A.n === B.n) steps.push(`De noemers zijn gelijk, dus de noemer blijft ${L}.`);
  else {
    if (A.n > 1 && B.n > 1) steps.push(nieuweNoemer([A.n, B.n]));
    steps.push(...omzetten([a0, c0], L));
  }
  steps.push(
    `Reken met de tellers: ${a} ${op2} ${c} = ${r}. Dus ${br(a, L)} ${op2} ${br(c, L)} = ${br(r, L)}`,
    ...afmaken(r, L, soort === 'gemengd' ? 'eruit' : 'mag'),
  );

  const wA = waarde(A),
    wB = waarde(B),
    fouten = [];
  const negGemengd = [A, B].find((x) => isGemengd(x) && x.s < 0);
  if (negGemengd)
    fouten.push(['min-alleen-op-de-helen', 0, doe(waardeMinOpHelen(A), op, waardeMinOpHelen(B))]);
  if (B.s < 0)
    fouten.push([
      op === '+' ? 'plus-min-als-plus' : 'min-min-als-min',
      0,
      doe(wA, op, Math.abs(wB)),
    ]);
  if (op2 === '-' && A.s < 0)
    fouten.push(['negatief-min-getal-als-verschil', 0, wA + Math.abs(wB)]);
  // Alleen bij optellen: wie de noemers aftrekt, komt op een vreemde of geen noemer.
  if (A.n > 1 && op2 === '+')
    fouten.push(['tellers-en-noemers-opgeteld', 0, (a0.t + c0.t) / (A.n + B.n)]);
  if (A.n !== B.n) fouten.push(['alleen-noemer-veranderd', 0, doe(a0.t, op2, c0.t) / L]);
  fouten.push(['minteken-vergeten', 0, -goed]);
  const berichten = negGemengd
    ? { ...BERICHTEN, 'min-alleen-op-de-helen': minOpHelen(negGemengd) }
    : BERICHTEN;
  return {
    q: T(`Bereken ${s}. Vereenvoudig zo ver mogelijk.`),
    fields,
    hint: T(
      `${B.s < 0 ? 'Gebruik eerst de tekenregel: plus een negatief getal is min, en min een negatief getal is plus. ' : ''}${[A, B].some(isGemengd) ? 'Breng de helen binnen de breuk; bij een negatief gemengd getal hoort de min bij het hele getal. ' : ''}Maak de breuken {{gelijknamig|gelijknamig}} en reken met de tellers, met hun teken erbij.`,
    ),
    steps,
    traps: maakTraps(fouten, [goed], berichten),
    // Rekent terug met kommagetallen: het antwoord min of plus het tweede getal is weer het eerste.
    v: () => {
      const x = fields[0].a;
      return near(op === '+' ? x - wB : x + wB, wA);
    },
  };
}

// --- 214 Negatieve breuken vermenigvuldigen ---

function kiesProduct(soort) {
  if (soort === 'breuk') return [breukGetal(ri(2, 10)), breukGetal(ri(2, 10))];
  if (soort === 'heel') {
    const W = { s: metTeken(1), h: ri(2, 12), t: 0, n: 1 },
      x = breukGetal(ri(2, 12));
    return coin() ? [W, x] : [x, W];
  }
  const a = gemengdGetal(ri(2, 6), 3),
    b = coin() ? gemengdGetal(ri(2, 6), 3) : breukGetal(ri(2, 9));
  return coin() ? [a, b] : [b, a];
}
// Een getal als breuk met teken, ook een heel getal: -{3/1}, en een gemengd getal binnen de breuk.
const alsBreuk = (x) => {
  const { t, n } = onecht(x);
  return `${t < 0 ? '-' : ''}{${Math.abs(t)}/${n}}`;
};
// Het product A · B als uitwerking, met de uitkomst als breuk {t, n} met teken.
function productDelen(A, B) {
  const sg = A.s * B.s,
    a = onecht(zonderTeken(A)),
    c = onecht(zonderTeken(B));
  const t = sg * a.t * c.t,
    n = a.n * c.n,
    min = sg < 0 ? '-' : '';
  const heel = [A, B].filter((x) => x.n === 1);
  const regels = [
    `${hoofd(zegTeken(A.s))} keer ${zegTeken(B.s)} is ${zegTeken(sg)}, dus de uitkomst is ${zegTeken(sg)}.`,
    ...binnenBrengen([A, B]),
    ...heel.map(
      (x) =>
        `Schrijf ${toon(x)} als breuk met noemer 1: ${toon(x)} = ${x.s < 0 ? '-' : ''}{${x.h}/1}`,
    ),
    `Teller keer teller en noemer keer noemer: ${alsBreuk(A)} * ${alsBreuk(B)} = ${min}{${a.t} * ${c.t}/${a.n} * ${c.n}} = ${br(t, n)}`,
    ...afmaken(t, n),
  ];
  return { regels, t, n, sg, a, c };
}
// De foute uitkomsten van een product, als [id, veld, waarde].
function productFouten(A, B, soort, veld, goed) {
  const { sg, a, c } = productDelen(A, B),
    fouten = [];
  if ([A, B].some((x) => isGemengd(x) && x.s < 0))
    fouten.push(['min-alleen-op-de-helen', veld, waardeMinOpHelen(A) * waardeMinOpHelen(B)]);
  if (isGemengd(A) && isGemengd(B))
    fouten.push([
      'gemengd-los-vermenigvuldigd',
      veld,
      sg * (A.h * B.h + (A.t / A.n) * (B.t / B.n)),
    ]);
  if (soort === 'heel') {
    const x = A.n === 1 ? B : A;
    fouten.push(['heel-getal-teller-en-noemer', veld, sg * (x.t / x.n)]);
  }
  if (soort === 'breuk' || soort === 'naast') {
    const L = lcm(a.n, c.n);
    if (a.n !== c.n)
      fouten.push([
        'toch-gelijknamig-gemaakt',
        veld,
        (sg * (((a.t * L) / a.n) * ((c.t * L) / c.n))) / L,
      ]);
    else fouten.push(['noemer-gelijk-gelaten', veld, (sg * a.t * c.t) / a.n]);
  }
  if (A.s < 0 && B.s < 0) fouten.push(['min-keer-min-is-min', veld, -goed]);
  else fouten.push(['minteken-vergeten', veld, -goed]);
  return fouten;
}

// Aftrekken en vermenigvuldigen met dezelfde breuken naast elkaar, in twee velden.
function naastElkaar() {
  const [A, B] = until(
    () => [breukGetal(ri(2, 10)), breukGetal(ri(2, 10))],
    ([A, B]) =>
      vereenvoudigd(A) &&
      vereenvoudigd(B) &&
      A.n * B.n <= 60 &&
      (A.s < 0 || B.s < 0) &&
      somDelen(A, '-', B).r !== 0,
  );
  const som = somDelen(A, '-', B),
    { op2, B2, a0, c0, L, a, c, r } = som,
    verschil = Q(r, L),
    prod = productDelen(A, B),
    product = Q(prod.t, prod.n),
    goed = [verschil.n / verschil.d, product.n / product.d];
  const s0 = `${toon(A)} - ${toon(B)}`,
    s1 = `${toon(A)} * ${toon(B)}`;
  const aftrek = [`Bij ${s0} trek je af.`];
  if (B.s < 0) aftrek.push(`Min een negatief getal is plus: ${s0} = ${toon(A)} ${op2} ${toon(B2)}`);
  if (A.n === B.n) aftrek.push(`De noemers zijn gelijk, dus de noemer blijft ${L}.`);
  else aftrek.push(nieuweNoemer([A.n, B.n]), ...omzetten([a0, c0], L));
  aftrek.push(
    `Reken met de tellers: ${a} ${op2} ${c} = ${r}. Dus ${br(a, L)} ${op2} ${br(c, L)} = ${br(r, L)}`,
    ...afmaken(r, L),
  );
  const wA = waarde(A),
    wB = waarde(B);
  const fouten = [];
  if (B.s < 0) fouten.push(['min-min-als-min', 0, wA - Math.abs(wB)]);
  if (A.s < 0 && B.s > 0)
    fouten.push(
      ['keerregel-bij-aftrekken', 0, Math.abs(wA) + wB],
      ['negatief-min-getal-als-verschil', 0, wA + wB],
    );
  fouten.push(...productFouten(A, B, 'naast', 1, goed[1]));
  const fields = [BF(`${s0} =`, verschil), { ...BF(`${s1} =`, product), br: true }];
  return {
    q: T(
      'Bereken. Let op het verschil tussen aftrekken en vermenigvuldigen. Vereenvoudig zo ver mogelijk.',
    ),
    fields,
    hint: T(
      'Bij aftrekken maak je de breuken {{gelijknamig|gelijknamig}}, en min een negatief getal is plus. Bij vermenigvuldigen bepaal je eerst het teken, en vermenigvuldig je dan teller met teller en noemer met noemer.',
    ),
    steps: [...aftrek, `Bij ${s1} vermenigvuldig je.`, ...prod.regels],
    traps: maakTraps(fouten, goed, KEER_TEKEN),
    // Rekent terug met kommagetallen: verschil plus B is weer A, en product gedeeld door B ook.
    v: () => {
      const [x, y] = fields.map((f) => f.a);
      return near(x + wB, wA) && near(y / wB, wA);
    },
  };
}

function vermenigvuldigen() {
  const soort = pick(['breuk', 'breuk', 'heel', 'gemengd', 'naast']);
  if (soort === 'naast') return naastElkaar();
  const [A, B] = until(
    () => kiesProduct(soort),
    ([A, B]) => {
      if (!vereenvoudigd(A) || !vereenvoudigd(B) || (A.s > 0 && B.s > 0)) return false;
      if (soort === 'breuk') return A.n * B.n <= 60;
      if (soort === 'gemengd') {
        const [a, c] = [A, B].map((x) => onecht(zonderTeken(x)));
        return [A, B].some((x) => isGemengd(x) && x.s < 0) && a.n * c.n <= 36 && a.t * c.t <= 200;
      }
      return true;
    },
  );
  const { regels, t, n } = productDelen(A, B),
    antw = Q(t, n),
    goed = antw.n / antw.d,
    s = `${toon(A)} * ${toon(B)}`,
    fields = [BF(`${s} =`, antw)];
  const negGemengd = [A, B].find((x) => isGemengd(x) && x.s < 0);
  const berichten = negGemengd
    ? { ...KEER_TEKEN, 'min-alleen-op-de-helen': minOpHelen(negGemengd) }
    : KEER_TEKEN;
  const hint = {
    breuk:
      'Bepaal eerst het teken met de tekenregels. Vermenigvuldig dan de tellers met elkaar en de noemers met elkaar.',
    heel: 'Bepaal eerst het teken met de tekenregels. Schrijf het hele getal als breuk met noemer 1, en vermenigvuldig dan de tellers met elkaar en de noemers met elkaar.',
    gemengd:
      'Bepaal eerst het teken met de tekenregels. Breng dan de helen binnen de breuk, en vermenigvuldig de tellers met elkaar en de noemers met elkaar.',
  }[soort];
  return {
    q: T(`Bereken ${s}. Vereenvoudig zo ver mogelijk.`),
    fields,
    hint: T(hint),
    steps: regels,
    traps: maakTraps(productFouten(A, B, soort, 0, goed), [goed], berichten),
    // Rekent terug met kommagetallen: het antwoord gedeeld door het tweede getal is weer het eerste.
    v: () => near(fields[0].a / waarde(B), waarde(A)),
  };
}

// Een magisch vierkant met negatieve breuken (#262): elke rij, kolom en diagonaal heeft dezelfde som.
// Vier vakken zijn leeg. Minstens één lijn is helemaal bekend, zodat je de som kunt uitrekenen, en
// daarna kun je telkens een lijn afmaken waarin nog één vak leeg is. De getallen zijn negen
// verschillende breuken met dezelfde noemer, de helft, een derde of een kwart.
const VIERKANT_OPEN = vierkantOpen(4);
function magischVierkant() {
  const { noemer, ms, open } = until(
    () => {
      const noemer = pick([2, 3, 4]);
      return {
        noemer,
        ms: magisch(ri(-2 * noemer, noemer), ri(1, 3 * noemer), ri(-3 * noemer, 3 * noemer)),
        open: pick(VIERKANT_OPEN),
      };
    },
    ({ noemer, ms, open }) => {
      const alle = ms.flat(),
        leeg = open.map(([r, k]) => ms[r][k]);
      return (
        new Set(alle).size === 9 &&
        alle.every((x) => Math.abs(x) <= 6 * noemer) &&
        alle.filter((x) => x < 0).length >= 3 &&
        alle.filter((x) => x % noemer !== 0).length >= 5 &&
        leeg.some((x) => x < 0 && x % noemer !== 0)
      );
    },
  );
  const vk = ms.map((rij) => rij.map((x) => Q(x, noemer))),
    letters = vierkantLetters(open),
    namen = Object.values(letters).sort(),
    plek = (L) =>
      Object.keys(letters)
        .find((p) => letters[p] === L)
        .split(',')
        .map(Number),
    goed = namen.map((L) => vk[plek(L)[0]][plek(L)[1]]),
    fields = namen.map((L, i) => BF(`${L} =`, goed[i])),
    toon = vk.map((rij, r) => rij.map((g, k) => letters[`${r},${k}`] ?? g)),
    teken = goed.map((q, i) => [i, -q.n / q.d]).filter(([, x]) => x !== 0);
  return {
    q: T(
      `Dit is een {{magisch-vierkant|magisch vierkant}}: de getallen in elke rij, elke kolom en de twee diagonalen hebben dezelfde som. Bereken de getallen in de vakken ${letterLijst(namen)}. Vereenvoudig zo ver mogelijk.`,
    ),
    fig: vierkantFig(toon),
    fields,
    hint: 'Zoek een rij, kolom of diagonaal waarin alle drie de getallen bekend zijn, en tel ze op. Dat is de som van elke lijn. Zoek dan een lijn waarin nog één vak leeg is.',
    steps: vierkantStappen(vk, losVierkantOp(open), letters),
    traps: [mintekenFout(teken)],
    // Rekent alle lijnen na met de ingevulde getallen, als kommagetallen.
    v: () =>
      vierkantKlopt(
        vk,
        open,
        fields.map((f) => f.a),
      ),
  };
}

export default {
  slug: 'negatieve-breuken',
  title: 'Negatieve breuken',
  intro:
    'Een breuk kan ook negatief zijn. Hier reken je met de deelstreep, vereenvoudig je negatieve breuken, en tel je ze op, trek je ze af en vermenigvuldig je ze. Je let steeds op de tekenregels.',
  description:
    'Negatieve breuken oefenen: rekenen met de deelstreep, een negatieve breuk vereenvoudigen, optellen, aftrekken en vermenigvuldigen. Gratis met uitleg.',
  videos: {},
  skills: [
    [211, 'Rekenen met de deelstreep', deelstreep],
    [212, 'Een negatieve breuk vereenvoudigen', vereenvoudigen],
    [213, 'Negatieve breuken optellen en aftrekken', optellenAftrekken],
    [214, 'Negatieve breuken vermenigvuldigen', vermenigvuldigen],
    [219, 'Een magisch vierkant', magischVierkant],
  ],
  learn: [
    {
      t: 'Rekenen met de deelstreep',
      p: [
        'De streep van een breuk heet de {{=deelstreep|deelstreep}}. Hij betekent delen: {-54/9} = -54 : 9 = -6.',
        'Staat er een berekening boven of onder de deelstreep, reken dan eerst de teller en de noemer apart uit. Daarna deel je. De deelstreep werkt dus als haakjes om de teller en om de noemer.',
        'Staat er nog een bewerking buiten de breuk, dan reken je eerst de breuk uit.',
      ],
      ex: {
        q: T('Bereken {13 - 61/-4}.'),
        steps: ['{13 - 61/-4} =', '{-48/-4} = 12', 'Controle van de deling: 12 * -4 = -48'],
      },
      ex2: {
        q: T('Bereken -9 + {-5 * 7/3 - 8}.'),
        steps: [
          '-9 + {-5 * 7/3 - 8} =',
          '-9 + {-35/-5} =',
          '-9 + 7 = -2',
          'Controle van de deling: 7 * -5 = -35',
        ],
      },
      watch:
        'Deel de hele teller door de hele noemer. In {13 - 61/-4} deel je dus niet alleen 61 door -4.',
    },
    {
      t: 'Een negatieve breuk vereenvoudigen',
      p: [
        'Een breuk is een deling, dus voor het teken gelden de tekenregels van delen. {-3/5} en {3/-5} zijn allebei negatief, en {-3/-5} is positief.',
        'Laat geen minteken in de teller of de noemer staan. Staat er één minteken, zet het dan voor de breuk. Staan er twee, dan vallen ze weg.',
        'Vereenvoudig daarna zo ver mogelijk. Helen eruit halen mag, maar hoeft niet.',
      ],
      ex: {
        q: T('Vereenvoudig {16/-44}.'),
        steps: [
          'Er staat één minteken, in de noemer. Zet het voor de breuk, want positief gedeeld door negatief is negatief: {16/-44} = -{16/44}',
          'Teller en noemer door 4 delen: -{16/44} = -{4/11}',
        ],
      },
      ex2: {
        q: T('Vereenvoudig {-21/-35}.'),
        steps: [
          'Er staan twee mintekens, in de teller en in de noemer. Die vallen weg, want negatief gedeeld door negatief is positief: {-21/-35} = {21/35}',
          'Teller en noemer door 7 delen: {21/35} = {3/5}',
        ],
      },
    },
    {
      t: 'Negatieve breuken optellen en aftrekken',
      p: [
        'Je rekent net als met gewone breuken: maak de breuken {{gelijknamig|gelijknamig}} en reken met de tellers. Het minteken van een negatieve breuk neem je mee in de teller.',
        'Plus een negatief getal is min, en min een negatief getal is plus. Dat geldt ook voor breuken.',
        'Bij een negatief {{gemengd-getal|gemengd getal}} hoort de min bij het hele getal. {-3 2/7} is -3 - {2/7}, en niet -3 + {2/7}. Breng de helen binnen de breuk: {-3 2/7} = -{23/7}.',
      ],
      ex: {
        q: T('Bereken -{5/12} + {1/9}.'),
        steps: [
          'De nieuwe noemer is 36: dat is het eerste getal dat in de tafels van 9 en 12 staat.',
          'Teller en noemer keer 3: -{5/12} = -{15/36}',
          'Teller en noemer keer 4: {1/9} = {4/36}',
          'Reken met de tellers: -15 + 4 = -11. Dus -{15/36} + {4/36} = -{11/36}',
        ],
      },
      ex2: {
        q: T('Bereken {-3 2/7} - -{1/2}.'),
        steps: [
          'Min een negatief getal is plus: {-3 2/7} - -{1/2} = {-3 2/7} + {1/2}',
          'Breng de helen binnen de breuk. De min hoort bij het hele getal: {-3 2/7} = -{23/7}',
          'De nieuwe noemer is 2 * 7 = 14.',
          'Teller en noemer keer 2: -{23/7} = -{46/14}',
          'Teller en noemer keer 7: {1/2} = {7/14}',
          'Reken met de tellers: -46 + 7 = -39. Dus -{46/14} + {7/14} = -{39/14}',
          'Haal de helen eruit: -{39/14} = {-2 11/14}',
        ],
      },
      watch:
        'Een negatief gemengd getal is helemaal negatief: {-3 2/7} ligt verder van 0 af dan -3, en niet dichter bij 0.',
    },
    {
      t: 'Negatieve breuken vermenigvuldigen',
      p: [
        'Bepaal eerst het teken met de tekenregels: negatief keer negatief is positief, en positief keer negatief is negatief.',
        'Vermenigvuldig dan de tellers met elkaar en de noemers met elkaar. Gelijknamig maken is niet nodig.',
        'Breng een gemengd getal eerst binnen de breuk. Een heel getal schrijf je als breuk met noemer 1.',
      ],
      ex: {
        q: T('Bereken -{4/9} * -{3/10}.'),
        steps: [
          'Negatief keer negatief is positief, dus de uitkomst is positief.',
          'Teller keer teller en noemer keer noemer: {4 * 3/9 * 10} = {12/90}',
          'Teller en noemer door 6 delen: {12/90} = {2/15}',
        ],
      },
      ex2: {
        q: T('Bereken {-1 5/6} * {3/7}.'),
        steps: [
          'Negatief keer positief is negatief, dus de uitkomst is negatief.',
          'Breng de helen binnen de breuk. De min hoort bij het hele getal: {-1 5/6} = -{11/6}',
          'Teller keer teller en noemer keer noemer: -{11 * 3/6 * 7} = -{33/42}',
          'Teller en noemer door 3 delen: -{33/42} = -{11/14}',
        ],
      },
      watch:
        'Haal aftrekken en vermenigvuldigen niet door elkaar: -{1/4} - {1/4} = -{1/2}, maar -{1/4} * -{1/4} = {1/16}.',
    },
    {
      t: 'Een magisch vierkant',
      p: [
        'In een {{=magisch-vierkant|magisch vierkant}} hebben de getallen in elke rij, elke kolom en de twee diagonalen dezelfde som.',
        'Zoek eerst een rij, kolom of diagonaal waarin alle getallen bekend zijn. Tel ze op: dat is de som van elke lijn. Zoek dan een lijn waarin nog één vak leeg is. Het lege vak is de som min de twee andere getallen.',
      ],
      ex: {
        q: T(
          'De som van elke lijn is -{1/2}. In een rij staan -{3/4}, {1 1/2} en een leeg vak A. Bereken A.',
        ),
        steps: [
          'Tel de twee bekende getallen op: -{3/4} + {1 1/2} = -{3/4} + {6/4} = {3/4}',
          'A = -{1/2} - {3/4} = -{2/4} - {3/4} = -{5/4} = {-1 1/4}',
        ],
      },
      watch: 'Let bij elk getal op het minteken. Een min min wordt een plus.',
    },
  ],
};
