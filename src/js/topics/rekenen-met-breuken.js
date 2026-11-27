// Onderwerp: Rekenen met breuken. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
// Alleen positieve breuken en uitkomsten: negatieve breuken komen in een later onderwerp. Breuken delen
// doet het boek in dit hoofdstuk niet. Een gemeenschappelijke noemer is hoogstens 60, en bij gemengde
// getallen hoogstens 24, want daar worden de tellers al groot.
import { ri, pick, coin, gcd, lcm, Q, qAdd, qSub, qMul, near, until } from '../math.js';
import { F } from './shared.js';
import { T } from '../typeset.js';
import { piramideOpen, piramideVraag, letterLijst } from '../puzzels.js';

// Een breuk en een gemengd getal als tekst voor T, zonder te vereenvoudigen: {24/36} en {2 3/5}.
const b = (t, n) => `{${t}/${n}}`;
const g = (h, t, n) => `{${h} ${t}/${n}}`;
// Een breuk {t, n}, of een heel getal als de noemer 1 is.
const toon = ({ t, n }) => (n === 1 ? String(t) : b(t, n));
// Het veld voor een breuk als antwoord: zo ver mogelijk vereenvoudigd, de helen eruit halen mag.
const BF = (pre, q, post) => ({ ...F(pre, q, post), vorm: 'vereenvoudigd' });
const OPTEL = { '+': (x, y) => x + y, '-': (x, y) => x - y, '*': (x, y) => x * y };
const lijst = (xs) =>
  xs.length === 1 ? `${xs[0]}` : `${xs.slice(0, -1).join(', ')} en ${xs[xs.length - 1]}`;
// Een echte breuk met noemer n die al vereenvoudigd is.
const echteBreuk = (n) => ({ t: ri(1, n - 1), n });
const vereenvoudigd = ({ t, n }) => gcd(t, n) === 1;

// Geven twee fouten dezelfde foute waarde, dan hoort die bij de eerste valkuil, zodat een leerling
// één melding krijgt die past. Een valkuil zonder eigen foute waarde valt weg.
function uniek(traps) {
  const bezet = [];
  return traps
    .filter(Boolean)
    .map((t) => {
      const ws = t.w.filter(([i, x]) => !bezet.some(([j, y]) => i === j && near(x, y)));
      bezet.push(...ws);
      return ws.length ? { ...t, w: ws, f: (v) => ws.some(([i, x]) => near(v[i], x)) } : null;
    })
    .filter(Boolean);
}
// Een valkuil die afgaat als veld i een van de foute waarden heeft. w is een lijst [veld, waarde]. Een
// foute waarde die gelijk is aan het goede antwoord van dat veld valt weg, net als een waarde die geen
// getal is (zoals delen door 0). Zonder foute waarde is er geen valkuil. De test leest w om te kijken
// of elke valkuil kan afgaan.
function valkuil(id, w, goed, m) {
  const ws = w.filter(([i, x]) => Number.isFinite(x) && !near(x, goed[i]));
  return ws.length ? { id, w: ws, f: (v) => ws.some(([i, x]) => near(v[i], x)), m } : null;
}

// De regel met de nieuwe noemer bij gelijknamig maken. Staat de grootste noemer in de tafel van de
// andere, dan is die het. Anders het eerste getal in de tafels van allemaal; bij twee noemers zonder
// gemeenschappelijke deler is dat het product.
function nieuweNoemer(ns) {
  const u = [...new Set(ns)].sort((x, y) => x - y),
    L = u.reduce(lcm);
  if (u.includes(L)) {
    const rest = u.filter((x) => x !== L);
    return `De nieuwe noemer is ${L}, want ${L} staat ook in de ${rest.length > 1 ? 'tafels' : 'tafel'} van ${lijst(rest)}.`;
  }
  if (u.length === 2 && L === u[0] * u[1]) return `De nieuwe noemer is ${u[0]} * ${u[1]} = ${L}.`;
  return `De nieuwe noemer is ${L}: dat is het eerste getal dat in de tafels van ${lijst(u)} staat.`;
}
// Een regel per breuk die een andere noemer krijgt: teller en noemer keer hetzelfde getal. Een heel
// getal schrijf je als breuk met de nieuwe noemer.
const omzetten = (bs, L) =>
  bs
    .filter((x) => x.n !== L)
    .map((x) =>
      x.n === 1
        ? `Schrijf ${x.t} als breuk met noemer ${L}: ${x.t} = ${b(x.t * L, L)}`
        : `Teller en noemer keer ${L / x.n}: ${b(x.t, x.n)} = ${b((x.t * L) / x.n, L)}`,
    );

// De regels van een uitkomst t/n tot de breuk zo ver mogelijk vereenvoudigd is. Bij de laatste stap
// (eind) zegt het ook als vereenvoudigen niet kan, en haalt het de helen eruit: met helen 'mag' als
// dat mag maar niet hoeft, met 'eruit' als gewone stap.
function afmaken(t, n, eind = false, helen = 'mag') {
  const k = gcd(t, n),
    tt = t / k,
    nn = n / k,
    s = [];
  if (nn === 1) s.push(`Deel de teller door de noemer: ${b(t, n)} = ${t} : ${n} = ${tt}`);
  else if (k > 1) s.push(`Teller en noemer door ${k} delen: ${b(t, n)} = ${b(tt, nn)}`);
  else if (eind)
    s.push(
      `${t} en ${n} kun je niet door hetzelfde getal delen, dus ${b(t, n)} is al zo ver mogelijk vereenvoudigd.`,
    );
  if (eind && nn > 1 && tt > nn) {
    const gm = g(Math.floor(tt / nn), tt % nn, nn);
    s.push(
      helen === 'eruit'
        ? `Haal de helen eruit: ${b(tt, nn)} = ${gm}`
        : `Helen eruit halen mag, maar hoeft niet: ${b(tt, nn)} = ${gm}`,
    );
  }
  return s;
}

// Eén bewerking met twee breuken of hele getallen x en y, met de regels van de uitwerking en de
// uitkomst (vereenvoudigd). Bij keer: teller keer teller en noemer keer noemer, en een heel getal
// als breuk met noemer 1. Bij plus en min: eerst gelijknamig maken.
function rekenStap(op, x, y, eind = false, helen = 'mag') {
  let t, n, regels;
  if (op === '*') {
    t = x.t * y.t;
    n = x.n * y.n;
    const heel = x.n === 1 || y.n === 1 ? ` = ${b(x.t, x.n)} * ${b(y.t, y.n)}` : '';
    regels = [
      `Teller keer teller en noemer keer noemer: ${toon(x)} * ${toon(y)}${heel} = ${b(t, n)}`,
    ];
  } else {
    n = lcm(x.n, y.n);
    const [a, c] = [x, y].map((z) => (z.t * n) / z.n);
    t = OPTEL[op](a, c);
    const verb = op === '+' ? 'Tel de tellers op' : 'Trek de tellers af';
    const midden = x.n === y.n ? '' : ` = ${b(a, n)} ${op} ${b(c, n)}`;
    regels = [
      // Een heel getal schrijf je meteen als breuk met de noemer van de andere breuk.
      ...(x.n === y.n
        ? []
        : [...(x.n > 1 && y.n > 1 ? [nieuweNoemer([x.n, y.n])] : []), ...omzetten([x, y], n)]),
      `${verb}: ${toon(x)} ${op} ${toon(y)}${midden} = ${b(t, n)}`,
    ];
  }
  const k = gcd(t, n);
  return { regels: [...regels, ...afmaken(t, n, eind, helen)], uit: { t: t / k, n: n / k } };
}

const TELLERS_EN_NOEMERS =
  'Je mag niet de tellers en de noemers allebei optellen of aftrekken. Maak de breuken eerst {{gelijknamig|gelijknamig}}. Dan reken je alleen met de tellers, en blijft de noemer hetzelfde.';
const ALLEEN_NOEMER =
  'Bij gelijknamig maken verander je de teller en de noemer allebei: je vermenigvuldigt ze met hetzelfde getal. Verander je alleen de noemer, dan wordt de breuk een andere.';
const HAAKJES = 'Wat tussen haakjes staat, reken je eerst uit. Daarna de rest.';
const HINT_GELIJKNAMIG =
  'Maak de breuken eerst {{gelijknamig|gelijknamig}}: zoek een getal dat in de tafels van alle noemers staat. Tel dan de tellers op of trek ze af. Vereenvoudig zo ver mogelijk.';

// --- 195 Gelijknamige breuken optellen en aftrekken ---

function gelijknamig() {
  const soort = pick(['plus', 'min', 'drie']),
    vereenvoudig = coin();
  // Kies de soort vóór until, zodat een soort die vaker wordt afgekeurd niet minder vaak komt.
  const { n, ts, ops } = until(
    () => {
      const n = pick([3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20]);
      return {
        n,
        ts: Array.from({ length: soort === 'drie' ? 3 : 2 }, () => ri(1, n - 1)),
        ops:
          soort === 'plus' ? ['+'] : soort === 'min' ? ['-'] : [pick(['+', '-']), pick(['+', '-'])],
      };
    },
    ({ n, ts, ops }) => {
      if (!ts.every((t) => gcd(t, n) === 1)) return false;
      // Elke tussenuitkomst is groter dan 0.
      const tussen = ops.reduce((acc, o, i) => [...acc, OPTEL[o](acc[i], ts[i + 1])], [ts[0]]);
      const r = tussen[tussen.length - 1];
      return tussen.every((x) => x > 0) && gcd(r, n) > 1 === vereenvoudig;
    },
  );
  const r = ops.reduce((x, o, i) => OPTEL[o](x, ts[i + 1]), ts[0]),
    antw = Q(r, n);
  const reeks = (f) => ts.map((t, i) => (i ? ` ${ops[i - 1]} ` : '') + f(t)).join('');
  const s = reeks((t) => b(t, n));
  const alleenPlus = ops.every((o) => o === '+');
  const traps = uniek([
    alleenPlus &&
      valkuil(
        'tellers-en-noemers-opgeteld',
        [[0, r / (ts.length * n)]],
        [antw.n / antw.d],
        'Je hebt ook de noemers opgeteld. Bij {{gelijknamig|gelijknamige}} breuken blijft de noemer hetzelfde: je telt alleen de tellers op.',
      ),
  ]);
  return {
    q: T(`Bereken ${s}. Vereenvoudig zo ver mogelijk.`),
    fields: [BF(`${s} =`, antw)],
    hint: T(
      'De breuken zijn {{gelijknamig|gelijknamig}}: ze hebben dezelfde noemer. Reken met de tellers, en laat de noemer hetzelfde. Vereenvoudig daarna.',
    ),
    steps: [
      `De noemers zijn gelijk, dus de noemer blijft ${n}. Reken de tellers uit: ${reeks(String)} = ${r}`,
      `${s} = ${b(r, n)}`,
      ...afmaken(r, n, true),
    ],
    traps,
    // Rekent met kommagetallen: elke breuk apart gedeeld, en dan opgeteld of afgetrokken.
    v: () => {
      const som = ops.reduce((x, o, i) => OPTEL[o](x, ts[i + 1] / n), ts[0] / n);
      return near(antw.n / antw.d, som) && gcd(antw.n, antw.d) === 1;
    },
  };
}

// --- 196 Ongelijknamige breuken optellen en aftrekken ---

// Welke twee noemers bij welke soort horen: de ene in de tafel van de andere, zonder gemeenschappelijke
// deler (dan is het product de nieuwe noemer), of een kleinere nieuwe noemer dan het product.
const NOEMERS = {
  deler: (x, y) => x !== y && (x % y === 0 || y % x === 0),
  product: (x, y) => gcd(x, y) === 1,
  tafel: (x, y) => gcd(x, y) > 1 && x % y !== 0 && y % x !== 0,
};
function tweeBreuken(soort) {
  const op = pick(['+', '-']);
  const [A, B] = until(
    () => {
      const x = ri(2, 12),
        y = ri(2, 12);
      return [echteBreuk(x), echteBreuk(y)];
    },
    ([A, B]) =>
      NOEMERS[soort](A.n, B.n) &&
      lcm(A.n, B.n) <= 60 &&
      vereenvoudigd(A) &&
      vereenvoudigd(B) &&
      // Bij aftrekken zijn de tellers verschillend: anders geven twee fouten allebei 0.
      (op === '+' || (A.t * B.n > B.t * A.n && A.t !== B.t)),
  );
  const L = lcm(A.n, B.n),
    s = `${b(A.t, A.n)} ${op} ${b(B.t, B.n)}`,
    { regels, uit } = rekenStap(op, A, B, true),
    antw = Q(uit.t, uit.n),
    goed = [uit.t / uit.n];
  const traps = uniek([
    valkuil(
      'tellers-en-noemers-opgeteld',
      [[0, OPTEL[op](A.t, B.t) / OPTEL[op](A.n, B.n)]],
      goed,
      TELLERS_EN_NOEMERS,
    ),
    valkuil('alleen-noemer-veranderd', [[0, OPTEL[op](A.t, B.t) / L]], goed, ALLEEN_NOEMER),
  ]);
  return {
    q: T(`Bereken ${s}. Vereenvoudig zo ver mogelijk.`),
    fields: [BF(`${s} =`, antw)],
    hint: T(HINT_GELIJKNAMIG),
    steps: regels,
    traps,
    // Rekent met kommagetallen: elke breuk apart gedeeld.
    v: () => near(antw.n / antw.d, OPTEL[op](A.t / A.n, B.t / B.n)),
  };
}
// Drie breuken met haakjes: x buiten (y binnen z).
const DRIE = [
  ['-', '+'],
  ['-', '-'],
  ['+', '-'],
];
function drieBreuken() {
  const [buiten, binnen] = pick(DRIE);
  const [X, Y, Z] = until(
    () => [0, 1, 2].map(() => echteBreuk(pick([2, 3, 4, 5, 6, 8, 9, 10, 12]))),
    (bs) => {
      const ns = bs.map((x) => x.n),
        L = ns.reduce(lcm);
      if (!bs.every(vereenvoudigd) || new Set(ns).size < 2 || L > 60) return false;
      const [x, y, z] = bs.map((k) => (k.t * L) / k.n),
        tussen = OPTEL[binnen](y, z);
      return tussen > 0 && OPTEL[buiten](x, tussen) > 0;
    },
  );
  const bs = [X, Y, Z],
    L = bs.map((x) => x.n).reduce(lcm),
    [x, y, z] = bs.map((k) => (k.t * L) / k.n),
    tussen = OPTEL[binnen](y, z),
    r = OPTEL[buiten](x, tussen),
    antw = Q(r, L),
    goed = [r / L];
  const vorm = (p, q, u) => `${p} ${buiten} (${q} ${binnen} ${u})`;
  const s = vorm(...bs.map((k) => b(k.t, k.n))),
    sL = vorm(...[x, y, z].map((t) => b(t, L)));
  const waarden = bs.map((k) => k.t / k.n);
  const traps = uniek([
    valkuil(
      'haakjes-genegeerd',
      [[0, OPTEL[binnen](OPTEL[buiten](waarden[0], waarden[1]), waarden[2])]],
      goed,
      `${HAAKJES} Staat er een min voor de haakjes, dan trek je de hele uitkomst van de haakjes af.`,
    ),
    valkuil(
      'alleen-noemer-veranderd',
      [[0, OPTEL[buiten](X.t, OPTEL[binnen](Y.t, Z.t)) / L]],
      goed,
      ALLEEN_NOEMER,
    ),
  ]);
  return {
    q: T(`Bereken ${s}. Vereenvoudig zo ver mogelijk.`),
    fields: [BF('Uitkomst:', antw)],
    hint: T(
      'Maak alle drie de breuken {{gelijknamig|gelijknamig}}. Reken dan eerst uit wat tussen haakjes staat.',
    ),
    steps: [
      nieuweNoemer(bs.map((k) => k.n)),
      ...omzetten(bs, L),
      `${s} = ${sL}`,
      `Eerst binnen de haakjes: ${b(y, L)} ${binnen} ${b(z, L)} = ${b(tussen, L)}`,
      `${b(x, L)} ${buiten} ${b(tussen, L)} = ${b(r, L)}`,
      ...afmaken(r, L, true),
    ],
    traps,
    // Rekent met kommagetallen, met de haakjes zoals ze staan.
    v: () =>
      near(antw.n / antw.d, OPTEL[buiten](waarden[0], OPTEL[binnen](waarden[1], waarden[2]))),
  };
}
function ongelijknamig() {
  const soort = pick(['deler', 'product', 'tafel', 'tafel', 'drie']);
  return soort === 'drie' ? drieBreuken() : tweeBreuken(soort);
}

// --- 197 Optellen en aftrekken met gemengde getallen ---

const waardeVan = ({ h, t, n }) => h + t / n;
const binnenBrengen = ({ h, t, n }) => ({ t: h * n + t, n });
function gemengdTwee(op) {
  // Bij aftrekken is de breuk van het tweede getal soms groter dan die van het eerste: dan kun je de
  // helen en de breuken niet los aftrekken.
  const lenen = op === '-' && coin();
  const [A, B] = until(
    () => {
      const x = ri(2, 10),
        y = ri(2, 10);
      return [
        { h: ri(1, 6), ...echteBreuk(x) },
        { h: ri(1, 5), ...echteBreuk(y) },
      ];
    },
    ([A, B]) =>
      vereenvoudigd(A) &&
      vereenvoudigd(B) &&
      lcm(A.n, B.n) <= 24 &&
      // Bij aftrekken zijn de tellers na het binnen brengen verschillend: anders geven twee fouten
      // allebei 0.
      (op === '+' ||
        (A.h > B.h && A.t * B.n < B.t * A.n === lenen && A.h * A.n + A.t !== B.h * B.n + B.t)),
  );
  const [a, c] = [A, B].map(binnenBrengen),
    L = lcm(A.n, B.n),
    s = `${g(A.h, A.t, A.n)} ${op} ${g(B.h, B.t, B.n)}`,
    { regels, uit } = rekenStap(op, a, c, true, 'eruit'),
    antw = Q(uit.t, uit.n),
    goed = [uit.t / uit.n];
  const traps = uniek([
    lenen &&
      valkuil(
        'helen-en-breuken-los',
        [[0, A.h - B.h + (B.t / B.n - A.t / A.n)]],
        goed,
        'De breuk van het tweede getal is groter dan die van het eerste. Dan kun je de helen en de breuken niet los aftrekken. Breng eerst de helen binnen de breuk.',
      ),
    valkuil(
      'tellers-en-noemers-opgeteld',
      [[0, OPTEL[op](a.t, c.t) / OPTEL[op](a.n, c.n)]],
      goed,
      TELLERS_EN_NOEMERS,
    ),
    A.n !== B.n &&
      valkuil('alleen-noemer-veranderd', [[0, OPTEL[op](a.t, c.t) / L]], goed, ALLEEN_NOEMER),
  ]);
  return {
    q: T(`Bereken ${s}. Vereenvoudig zo ver mogelijk.`),
    fields: [BF(`${s} =`, antw)],
    hint: T(
      'Breng eerst de helen binnen de breuk. Maak de breuken dan {{gelijknamig|gelijknamig}} en reken uit. Haal tot slot de helen eruit.',
    ),
    steps: [
      `Breng de helen binnen de breuk: ${g(A.h, A.t, A.n)} = ${b(a.t, a.n)} en ${g(B.h, B.t, B.n)} = ${b(c.t, c.n)}`,
      ...regels,
    ],
    traps,
    // Rekent met kommagetallen: helen plus breuk, voor elk getal apart.
    v: () => near(antw.n / antw.d, OPTEL[op](waardeVan(A), waardeVan(B))),
  };
}
// Een heel getal min een gemengd getal.
function heelMinGemengd() {
  const [W, A] = until(
    () => {
      const n = ri(2, 10);
      return [ri(2, 10), { h: ri(1, 8), ...echteBreuk(n) }];
    },
    ([W, A]) => vereenvoudigd(A) && A.h < W,
  );
  const a = binnenBrengen(A),
    s = `${W} - ${g(A.h, A.t, A.n)}`,
    { regels, uit } = rekenStap('-', { t: W, n: 1 }, a, true, 'eruit'),
    antw = Q(uit.t, uit.n),
    goed = [uit.t / uit.n];
  const traps = uniek([
    valkuil(
      'helen-en-breuken-los',
      [[0, W - A.h + A.t / A.n]],
      goed,
      `Je hebt alleen de helen afgetrokken. De breuk moet er ook af. Schrijf ${W} als breuk met dezelfde noemer, en trek dan af.`,
    ),
  ]);
  return {
    q: T(`Bereken ${s}. Vereenvoudig zo ver mogelijk.`),
    fields: [BF(`${s} =`, antw)],
    hint: T(
      'Breng de helen binnen de breuk. Schrijf het hele getal als breuk met dezelfde noemer. Trek dan de tellers af.',
    ),
    steps: [`Breng de helen binnen de breuk: ${g(A.h, A.t, A.n)} = ${b(a.t, a.n)}`, ...regels],
    traps,
    // Rekent terug: het antwoord plus het gemengde getal is weer het hele getal.
    v: () => near(antw.n / antw.d + waardeVan(A), W),
  };
}
function gemengd() {
  const soort = pick(['+', '-', '-', 'heel']);
  return soort === 'heel' ? heelMinGemengd() : gemengdTwee(soort);
}

// --- 198 Breuken vermenigvuldigen ---

function vermenigvuldigen() {
  const soort = pick(['breuk', 'noemer', 'heel', 'gemengd']);
  // De twee factoren: breuken, hele getallen (noemer 1) of gemengde getallen (met helen h).
  const [A, B] = until(
    () => {
      if (soort === 'breuk') return [echteBreuk(ri(2, 10)), echteBreuk(ri(2, 10))];
      if (soort === 'noemer') {
        const n = ri(3, 7);
        return [echteBreuk(n), echteBreuk(n)];
      }
      if (soort === 'heel') {
        const W = { t: ri(2, 12), n: 1 },
          x = echteBreuk(ri(2, 12));
        return coin() ? [W, x] : [x, W];
      }
      return [0, 1].map(() => ({ h: ri(1, 3), ...echteBreuk(ri(2, 6)) }));
    },
    ([A, B]) => {
      if (![A, B].every(vereenvoudigd)) return false;
      if (soort === 'breuk') return A.n !== B.n && A.n * B.n <= 60;
      if (soort === 'gemengd') {
        const [a, c] = [A, B].map(binnenBrengen);
        return a.n * c.n <= 36 && a.t * c.t <= 200;
      }
      return true;
    },
  );
  const isGemengd = soort === 'gemengd',
    [a, c] = isGemengd ? [A, B].map(binnenBrengen) : [A, B],
    tekst = (x) => (isGemengd ? g(x.h, x.t, x.n) : toon(x)),
    s = `${tekst(A)} * ${tekst(B)}`,
    { regels, uit } = rekenStap('*', a, c, true),
    antw = Q(uit.t, uit.n),
    goed = [uit.t / uit.n];
  const L = lcm(a.n, c.n);
  const traps = uniek([
    soort === 'breuk' &&
      valkuil(
        'toch-gelijknamig-gemaakt',
        [[0, (((a.t * L) / a.n) * ((c.t * L) / c.n)) / L]],
        goed,
        'Bij vermenigvuldigen maak je de breuken niet gelijknamig. Vermenigvuldig de tellers met elkaar en de noemers met elkaar.',
      ),
    soort === 'noemer' &&
      valkuil(
        'noemer-gelijk-gelaten',
        [[0, (a.t * c.t) / a.n]],
        goed,
        'Bij vermenigvuldigen blijft de noemer niet hetzelfde, ook niet als de noemers gelijk zijn. Vermenigvuldig ook de noemers met elkaar.',
      ),
    soort === 'heel' &&
      valkuil(
        'heel-getal-teller-en-noemer',
        [[0, a.n === 1 ? c.t / c.n : a.t / a.n]],
        goed,
        'Je hebt het hele getal met de teller én met de noemer vermenigvuldigd. Dan blijft de breuk even groot. Schrijf het hele getal als breuk met noemer 1.',
      ),
    isGemengd &&
      valkuil(
        'gemengd-los-vermenigvuldigd',
        [[0, A.h * B.h + (A.t / A.n) * (B.t / B.n)]],
        goed,
        'Je mag de helen en de breuken niet los vermenigvuldigen. Breng eerst de helen binnen de breuk, en vermenigvuldig dan.',
      ),
  ]);
  const hint = {
    breuk:
      'Vermenigvuldig de tellers met elkaar en de noemers met elkaar. Gelijknamig maken is niet nodig.',
    noemer:
      'Vermenigvuldig de tellers met elkaar en de noemers met elkaar. Ook als de noemers gelijk zijn.',
    heel: 'Schrijf het hele getal als breuk met noemer 1. Vermenigvuldig dan de tellers met elkaar en de noemers met elkaar.',
    gemengd:
      'Breng eerst de helen binnen de breuk. Vermenigvuldig dan de tellers met elkaar en de noemers met elkaar.',
  }[soort];
  return {
    q: T(`Bereken ${s}. Vereenvoudig zo ver mogelijk.`),
    fields: [BF(`${s} =`, antw)],
    hint: T(hint),
    steps: [
      ...(isGemengd
        ? [
            `Breng de helen binnen de breuk: ${tekst(A)} = ${b(a.t, a.n)} en ${tekst(B)} = ${b(c.t, c.n)}`,
          ]
        : []),
      ...regels,
    ],
    traps,
    // Rekent met kommagetallen: de waarde van elke factor, en die met elkaar vermenigvuldigd.
    v: () => {
      const w = (x) => (isGemengd ? waardeVan(x) : x.t / x.n);
      return near(antw.n / antw.d, w(A) * w(B));
    },
  };
}

// --- 199 Een deel van een getal ---

const STAM = {
  2: 'de helft',
  3: 'een derde deel',
  4: 'een kwart',
  5: 'een vijfde deel',
  6: 'een zesde deel',
  8: 'een achtste deel',
  10: 'een tiende deel',
};
const hoofd = (s) => s[0].toUpperCase() + s.slice(1);
// Een deel als woorden: de helft, een kwart, of {3/4} deel.
const deelTekst = ({ t, n }) => (t === 1 && STAM[n] ? STAM[n] : `${b(t, n)} deel`);
// Eigen verhalen: een geheel van W, waarvan je een deel neemt. max is het grootste geheel, en een
// de eenheid of de dingen die je telt.
const VERHALEN = [
  {
    zin: (W, d) => `Een moestuin is ${W} vierkante meter groot. Op ${d} van de tuin groeien bonen.`,
    deel: 'Op hoeveel vierkante meter groeien bonen?',
    rest: 'Op de rest groeien aardappels. Welk deel van de tuin is voor aardappels, en hoeveel vierkante meter is dat?',
    een: 'vierkante meter',
    max: 120,
  },
  {
    zin: (W, d) => `Een playlist heeft ${W} nummers. ${hoofd(d)} daarvan is rap.`,
    deel: 'Hoeveel nummers zijn rap?',
    rest: 'De rest is pop. Welk deel van de playlist is pop, en hoeveel nummers zijn dat?',
    een: 'nummers',
    max: 120,
  },
  {
    zin: (W, d) => `In een doos zitten ${W} kralen. ${hoofd(d)} van de kralen is blauw.`,
    deel: 'Hoeveel kralen zijn blauw?',
    rest: 'De andere kralen zijn geel. Welk deel van de kralen is geel, en hoeveel kralen zijn dat?',
    een: 'kralen',
    max: 150,
  },
  {
    zin: (W, d) => `Je leest een boek van ${W} bladzijden. Je hebt al ${d} gelezen.`,
    deel: 'Hoeveel bladzijden heb je al gelezen?',
    rest: 'Welk deel moet je nog lezen, en hoeveel bladzijden zijn dat?',
    een: 'bladzijden',
    max: 300,
  },
  {
    zin: (W, d) => `In een regenton zit ${W} liter water. Je geeft ${d} aan de planten.`,
    deel: 'Hoeveel liter geef je aan de planten?',
    rest: 'Welk deel blijft er in de ton, en hoeveel liter is dat?',
    een: 'liter',
    max: 120,
  },
  {
    zin: (W, d) => `Een wandelroute is ${W} kilometer lang. Je hebt ${d} gelopen.`,
    deel: 'Hoeveel kilometer heb je gelopen?',
    rest: 'Welk deel moet je nog lopen, en hoeveel kilometer is dat?',
    een: 'kilometer',
    max: 40,
  },
  {
    zin: (W, d) =>
      `Bij een schaaktoernooi spelen ${W} leerlingen mee. ${hoofd(d)} van hen speelt voor het eerst mee.`,
    deel: 'Hoeveel leerlingen spelen voor het eerst mee?',
    rest: 'De anderen speelden al eerder mee. Welk deel van de leerlingen is dat, en hoeveel leerlingen zijn dat?',
    een: 'leerlingen',
    max: 96,
  },
];
const DEEL_VAN = 'Deel van betekent keer: vermenigvuldig met de breuk.';
// De valkuilen bij een deel x van een heel getal W, voor veld i.
const deelTraps = (x, W, goed, i = 0) =>
  uniek([
    x.t > 1 &&
      valkuil(
        'alleen-door-noemer-gedeeld',
        [[i, W / x.n]],
        goed,
        'Je hebt alleen door de noemer gedeeld. Dat is één deel. Vermenigvuldig nog met de teller.',
      ),
    valkuil(
      'heel-getal-teller-en-noemer',
      [[i, x.t / x.n]],
      goed,
      'Je hebt het hele getal met de teller én met de noemer vermenigvuldigd. Dan blijft de breuk even groot. Schrijf het hele getal als breuk met noemer 1.',
    ),
    valkuil(
      'gedeeld-door-de-breuk',
      [[i, (W * x.n) / x.t]],
      goed,
      `Een deel van iets is kleiner dan het geheel. ${DEEL_VAN}`,
    ),
  ]);
// De uitwerking van een deel x van een heel getal W: keer, met W als breuk met noemer 1.
function deelVanGetal(x, W) {
  const { regels, uit } = rekenStap('*', x, { t: W, n: 1 }, true);
  return {
    regels: [`${hoofd(deelTekst(x))} van ${W} betekent ${b(x.t, x.n)} * ${W}.`, ...regels],
    uit,
  };
}
function deelVan() {
  const soort = pick(['stam', 'breuk', 'van-breuk', 'verhaal', 'rest']);
  if (soort === 'verhaal' || soort === 'rest') return deelVerhaal(soort === 'rest');
  if (soort === 'van-breuk') return deelVanBreuk();
  if (soort === 'stam') {
    const n = pick([2, 3, 4, 5, 6, 8, 10]),
      k = ri(2, 15),
      W = n * k,
      x = { t: 1, n };
    return {
      q: T(`Bereken ${STAM[n]} van ${W}.`),
      fields: [BF('Uitkomst:', k)],
      hint: T(
        `${hoofd(STAM[n])} van een getal betekent {1/${n}} keer dat getal. Dat is hetzelfde als delen door ${n}.`,
      ),
      steps: [
        `${hoofd(STAM[n])} van ${W} betekent ${b(1, n)} * ${W}. Dat is hetzelfde als ${W} : ${n}.`,
        `${W} : ${n} = ${k}, want ${k} * ${n} = ${W}`,
      ],
      traps: deelTraps(x, W, [k]),
      // Rekent terug: het antwoord keer de noemer is weer het hele getal.
      v: () => k * n === W,
    };
  }
  // Een breuk met een teller groter dan 1. Komt het deel niet heel uit, dan is het antwoord een breuk.
  const heel = coin();
  const [x, W] = until(
    () => {
      const n = pick([3, 4, 5, 6, 8, 10, 12]);
      return [{ t: ri(2, n - 1), n }, heel ? n * ri(2, 12) : ri(2, 40)];
    },
    ([x, W]) => vereenvoudigd(x) && (W % x.n === 0) === heel,
  );
  const { regels, uit } = deelVanGetal(x, W),
    antw = Q(uit.t, uit.n);
  if (heel)
    regels.push(
      `Zo kan het ook: ${W} : ${x.n} = ${W / x.n}, en ${x.t} * ${W / x.n} = ${(x.t * W) / x.n}`,
    );
  return {
    q: T(`Bereken ${b(x.t, x.n)} deel van ${W}.${heel ? '' : ' Vereenvoudig zo ver mogelijk.'}`),
    fields: [BF('Uitkomst:', antw)],
    hint: T(`${DEEL_VAN} Schrijf ${W} als breuk met noemer 1.`),
    steps: regels,
    traps: deelTraps(x, W, [uit.t / uit.n]),
    // Rekent terug: het antwoord gedeeld door de breuk is weer het hele getal.
    v: () => near(((antw.n / antw.d) * x.n) / x.t, W),
  };
}
// Een deel van een breuk, zoals de helft van {2/5} of {3/4} deel van {2/7}.
function deelVanBreuk() {
  const [x, y] = until(
    () => {
      const stam = coin(),
        n = stam ? pick([2, 3, 4, 5]) : ri(3, 6);
      return [stam ? { t: 1, n } : { t: ri(2, n - 1), n }, echteBreuk(ri(2, 10))];
    },
    ([x, y]) => vereenvoudigd(x) && vereenvoudigd(y) && x.n * y.n <= 60,
  );
  const { regels, uit } = rekenStap('*', x, y, true),
    antw = Q(uit.t, uit.n),
    d = deelTekst(x);
  return {
    q: T(`Bereken ${d} van ${b(y.t, y.n)}. Vereenvoudig zo ver mogelijk.`),
    fields: [BF('Uitkomst:', antw)],
    hint: T(DEEL_VAN),
    steps: [`${hoofd(d)} van ${b(y.t, y.n)} betekent ${b(x.t, x.n)} * ${b(y.t, y.n)}.`, ...regels],
    traps: uniek([
      valkuil(
        'gedeeld-door-de-breuk',
        [[0, y.t / y.n / (x.t / x.n)]],
        [uit.t / uit.n],
        `Een deel van iets is kleiner dan het geheel. ${DEEL_VAN}`,
      ),
    ]),
    // Rekent terug: het antwoord gedeeld door het deel is weer de breuk.
    v: () => near(antw.n / antw.d / (x.t / x.n), y.t / y.n),
  };
}
// Een verhaal: hoeveel is het deel, of welk deel blijft over en hoeveel is dat.
function deelVerhaal(rest) {
  const vh = pick(VERHALEN);
  const [x, W] = until(
    () => {
      const n = pick([3, 4, 5, 6, 8, 10]);
      return [echteBreuk(n), n * ri(2, Math.floor(vh.max / n))];
    },
    ([x, W]) => vereenvoudigd(x) && (W * x.t) / x.n >= 2 && (W * (x.n - x.t)) / x.n >= 2,
  );
  const d = deelTekst(x),
    zin = vh.zin(W, d);
  if (!rest) {
    const { regels, uit } = deelVanGetal(x, W);
    return {
      q: T(`${zin} ${vh.deel}`),
      fields: [BF('Antwoord:', uit.t, vh.een)],
      hint: T(`${DEEL_VAN} Schrijf ${W} als breuk met noemer 1.`),
      steps: [...regels, `Het antwoord is ${uit.t} ${vh.een}.`],
      traps: deelTraps(x, W, [uit.t]),
      // Rekent terug: het antwoord gedeeld door de breuk is weer het geheel.
      v: () => near((uit.t * x.n) / x.t, W) && uit.n === 1,
    };
  }
  const over = { t: x.n - x.t, n: x.n },
    k = gcd(over.t, over.n),
    r = { t: over.t / k, n: over.n / k },
    aantal = (W * over.t) / over.n,
    goed = [r.t / r.n, aantal];
  const { regels } = rekenStap('*', r, { t: W, n: 1 }, true);
  return {
    q: T(`${zin} ${vh.rest}`),
    fields: [BF('Deel:', Q(r.t, r.n)), { ...BF('Dat is', aantal, vh.een), br: true }],
    hint: T(
      `Het geheel is 1. Trek het deel ervan af: zo weet je welk deel overblijft. ${DEEL_VAN}`,
    ),
    steps: [
      `Het geheel is 1, en 1 = ${b(x.n, x.n)}.`,
      `Er blijft ${b(x.n, x.n)} - ${b(x.t, x.n)} = ${b(over.t, over.n)} over.`,
      ...afmaken(over.t, over.n),
      `${hoofd(deelTekst(r))} van ${W} betekent ${b(r.t, r.n)} * ${W}.`,
      ...regels,
      `Dat is ${aantal} ${vh.een}.`,
    ],
    traps: uniek([
      valkuil(
        'deel-in-plaats-van-rest',
        [
          [0, x.t / x.n],
          [1, (W * x.t) / x.n],
        ],
        goed,
        'Dat is het deel uit het verhaal zelf. De vraag gaat over wat er overblijft: trek het deel af van het geheel.',
      ),
    ]),
    // Rekent terug: het deel en wat overblijft zijn samen het geheel.
    v: () => near(r.t / r.n + x.t / x.n, 1) && near(aantal + (W * x.t) / x.n, W),
  };
}

// --- 200 Rekenvolgorde met breuken ---

// De vormen: x buiten (y binnen z), of (x binnen y) buiten z als links. Haakjes staan er als de
// binnenste bewerking optellen of aftrekken is en de buitenste keer. heel: x is een heel getal. Geen
// x * y + z: van links naar rechts geeft daar hetzelfde, dus de fout zonder voorrang kan dan niet.
const VORMEN = [
  { buiten: '+', binnen: '*' },
  { buiten: '*', binnen: '-', links: true },
  { buiten: '-', binnen: '*' },
  { buiten: '*', binnen: '+', links: true },
  { buiten: '*', binnen: '-' },
  { buiten: '*', binnen: '+', heel: true },
];
const qVan = ({ t, n }) => Q(t, n);
const QOP = { '+': qAdd, '-': qSub, '*': qMul };
// Rekent een rij getallen en bewerkingen zonder haakjes uit, met kommagetallen: met voorrang eerst keer,
// anders alles van links naar rechts.
function rij(ts, voorrang) {
  const r = [ts[0]];
  for (let i = 1; i < ts.length; i += 2) {
    if (voorrang && ts[i] === '*') r[r.length - 1] *= ts[i + 1];
    else r.push(ts[i], ts[i + 1]);
  }
  let x = r[0];
  for (let i = 1; i < r.length; i += 2) x = OPTEL[r[i]](x, r[i + 1]);
  return x;
}
// De noemer die bij een bewerking ontstaat: bij keer het product, anders de nieuwe noemer.
const noemerBij = (op, n, m) => (op === '*' ? n * m : lcm(n, m));
function rekenvolgorde() {
  const vorm = pick(VORMEN),
    { buiten, binnen, links, heel } = vorm,
    haakjes = binnen !== '*';
  // De breuken, en bij heel een heel getal vooraan.
  const kies = () => echteBreuk(ri(2, 10));
  const bs = until(
    () => [heel ? { t: ri(2, 6), n: 1 } : kies(), kies(), kies()],
    (bs) => {
      if (!bs.every(vereenvoudigd)) return false;
      const { tussen, uit, fout } = bereken(bs);
      const [p, q] = links ? [bs[0], bs[1]] : [bs[1], bs[2]],
        ander = links ? bs[2] : bs[0];
      // Elke noemer onderweg is hoogstens 60, de tussenuitkomst is een breuk en geen heel getal, en
      // de fout geeft een andere uitkomst.
      return (
        noemerBij(binnen, p.n, q.n) <= 60 &&
        noemerBij(buiten, tussen.d, ander.n) <= 60 &&
        tussen.n > 0 &&
        tussen.d > 1 &&
        uit.n > 0 &&
        !near(fout, uit.n / uit.d)
      );
    },
  );
  function bereken([x, y, z]) {
    const [p, q] = links ? [x, y] : [y, z];
    const tussen = QOP[binnen](qVan(p), qVan(q));
    const uit = links ? QOP[buiten](tussen, qVan(z)) : QOP[buiten](qVan(x), tussen);
    // De foute uitkomst: zonder haakjes (met voorrang), of zonder voorrang van links naar rechts.
    const ws = [x, y, z].map((k) => k.t / k.n);
    const ops = links ? [binnen, buiten] : [buiten, binnen];
    const fout = rij([ws[0], ops[0], ws[1], ops[1], ws[2]], haakjes);
    return { tussen, uit, fout };
  }
  const [x, y, z] = bs,
    { uit, fout } = bereken(bs);
  const [p, q] = links ? [x, y] : [y, z],
    stap1 = rekenStap(binnen, p, q),
    m = stap1.uit,
    stap2 = links ? rekenStap(buiten, m, z, true) : rekenStap(buiten, x, m, true);
  const deel = (u, v, op) => `${toon(u)} ${op} ${toon(v)}`,
    haak = (s) => (haakjes ? `(${s})` : s);
  const s = links
    ? `${haak(deel(x, y, binnen))} ${buiten} ${toon(z)}`
    : `${toon(x)} ${buiten} ${haak(deel(y, z, binnen))}`;
  const ingevuld = links ? deel(m, z, buiten) : deel(x, m, buiten);
  const antw = Q(uit.n, uit.d),
    goed = [uit.n / uit.d];
  const traps = uniek([
    haakjes
      ? valkuil(
          'haakjes-genegeerd',
          [[0, fout]],
          goed,
          `${HAAKJES} Keer gaat anders voor plus en min.`,
        )
      : valkuil(
          'zonder-voorrang',
          [[0, fout]],
          goed,
          'Je hebt van links naar rechts gerekend. Vermenigvuldigen gaat voor optellen en aftrekken, ook bij breuken.',
        ),
  ]);
  return {
    q: T(`Bereken ${s}. Vereenvoudig zo ver mogelijk.`),
    fields: [BF('Uitkomst:', antw)],
    hint: T(
      haakjes
        ? 'Reken eerst uit wat tussen haakjes staat. Vermenigvuldig daarna.'
        : 'Gebruik de {{rekenvolgorde|rekenvolgorde}}: vermenigvuldigen gaat voor optellen en aftrekken.',
    ),
    steps: [
      haakjes
        ? 'Reken eerst uit wat tussen haakjes staat.'
        : `Vermenigvuldigen gaat voor ${buiten === '+' ? 'optellen' : 'aftrekken'}. Reken eerst ${deel(p, q, '*')} uit.`,
      ...stap1.regels,
      `Vul dat in: ${s} = ${ingevuld}`,
      ...stap2.regels,
    ],
    traps,
    // Rekent de vorm na met kommagetallen, met de haakjes zoals ze staan.
    v: () => {
      const [a, c, e] = bs.map((k) => k.t / k.n);
      const w = links
        ? OPTEL[buiten](OPTEL[binnen](a, c), e)
        : OPTEL[buiten](a, OPTEL[binnen](c, e));
      return near(antw.n / antw.d, w);
    },
  };
}

// Een getallenpiramide met breuken (#262): elk vak is de som van de twee vakken eronder. Drie van de
// zes vakken zijn leeg, en minstens één daarvan vind je door terug te rekenen met aftrekken. De
// breuken in de onderste laag hebben een noemer die in de tafel van de grote noemer staat, zodat
// gelijknamig maken niet te zwaar wordt.
const PIRAMIDE_OPEN = piramideOpen(3, 3);
function piramide() {
  const { onder, open } = until(
    () => {
      const L = pick([4, 6, 8, 12]);
      return { L, onder: [0, 1, 2].map(() => Q(ri(1, 2 * L), L)), open: pick(PIRAMIDE_OPEN) };
    },
    ({ L, onder }) =>
      onder.filter((q) => q.d > 1).length >= 2 &&
      onder.some((q) => q.d === L) &&
      new Set(onder.map((q) => `${q.n}/${q.d}`)).size === 3,
  );
  const p = piramideVraag({ onder, soort: 'som', open, vorm: 'vereenvoudigd' });
  return {
    q: T(
      `In deze {{getallenpiramide|getallenpiramide}} is elk vak de som van de twee vakken eronder. Bereken de getallen in de vakken ${letterLijst(p.namen)}. Vereenvoudig zo ver mogelijk.`,
    ),
    fig: p.fig,
    fields: p.fields,
    hint: 'Begin bij een vak waarvan je de twee vakken eronder al weet, en tel die op. Weet je het vak erboven en één vak eronder, trek dan dat vak eronder af van het vak erboven.',
    steps: p.steps,
    traps: p.traps,
    v: p.v,
  };
}

export default {
  slug: 'rekenen-met-breuken',
  title: 'Rekenen met breuken',
  intro:
    'Breuken kun je optellen, aftrekken en vermenigvuldigen. Hier maak je breuken gelijknamig om ze op te tellen of af te trekken, ook met gemengde getallen. Je vermenigvuldigt breuken, berekent een deel van een getal en let op de rekenvolgorde.',
  description:
    'Rekenen met breuken oefenen: gelijknamig maken, optellen, aftrekken, vermenigvuldigen, gemengde getallen en een deel van een getal. Gratis met uitwerkingen.',
  videos: {},
  skills: [
    [195, 'Gelijknamige breuken optellen en aftrekken', gelijknamig],
    [196, 'Ongelijknamige breuken optellen en aftrekken', ongelijknamig],
    [197, 'Optellen en aftrekken met gemengde getallen', gemengd],
    [198, 'Breuken vermenigvuldigen', vermenigvuldigen],
    [199, 'Een deel van een getal', deelVan],
    [200, 'Rekenvolgorde met breuken', rekenvolgorde],
    [216, 'Een getallenpiramide met breuken', piramide],
  ],
  learn: [
    {
      t: 'Gelijknamige breuken optellen en aftrekken',
      p: [
        'Breuken met dezelfde noemer zijn {{gelijknamig|gelijknamig}}. Die tel je op door de tellers op te tellen. De noemer blijft hetzelfde. Aftrekken gaat net zo.',
        'Vereenvoudig de uitkomst zo ver mogelijk. Helen eruit halen mag, maar hoeft niet.',
      ],
      ex: {
        q: T('Bereken {7/10} - {3/10}.'),
        steps: [
          'De noemers zijn gelijk, dus de noemer blijft 10. Reken de tellers uit: 7 - 3 = 4',
          '{7/10} - {3/10} = {4/10}',
          'Teller en noemer door 2 delen: {4/10} = {2/5}',
        ],
      },
      watch: 'Tel de noemers niet op: {1/6} + {4/6} is {5/6}, en niet {5/12}.',
    },
    {
      t: 'Ongelijknamige breuken optellen en aftrekken',
      p: [
        'Zijn de noemers verschillend, maak de breuken dan eerst gelijknamig. Kies als nieuwe noemer het eerste getal dat in de tafels van beide noemers staat. Het product van de noemers kan ook altijd.',
        'Vermenigvuldig de teller en de noemer van elke breuk met hetzelfde getal. Tel daarna de tellers op of trek ze af.',
      ],
      ex: {
        q: T('Bereken {5/6} - {3/8}.'),
        steps: [
          'De nieuwe noemer is 24: dat is het eerste getal dat in de tafels van 6 en 8 staat.',
          'Teller en noemer keer 4: {5/6} = {20/24}',
          'Teller en noemer keer 3: {3/8} = {9/24}',
          'Trek de tellers af: {5/6} - {3/8} = {20/24} - {9/24} = {11/24}',
        ],
      },
      watch:
        'Verander bij gelijknamig maken de teller en de noemer allebei. Alleen de noemer veranderen geeft een andere breuk.',
    },
    {
      t: 'Gemengde getallen',
      p: [
        'Bij een {{gemengd-getal|gemengd getal}} breng je eerst de helen binnen de breuk. Maak de breuken dan gelijknamig en reken uit. Haal tot slot de helen eruit.',
        'Een heel getal schrijf je als breuk met dezelfde noemer als de andere breuk.',
      ],
      ex: {
        q: T('Bereken {4 1/3} - {1 3/4}.'),
        steps: [
          'Breng de helen binnen de breuk: {4 1/3} = {13/3} en {1 3/4} = {7/4}',
          'De nieuwe noemer is 3 * 4 = 12.',
          'Teller en noemer keer 4: {13/3} = {52/12}',
          'Teller en noemer keer 3: {7/4} = {21/12}',
          'Trek de tellers af: {13/3} - {7/4} = {52/12} - {21/12} = {31/12}',
          'Haal de helen eruit: {31/12} = {2 7/12}',
        ],
      },
      watch:
        'Is de breuk die je aftrekt groter, dan kun je de helen en de breuken niet los aftrekken. Breng de helen dan eerst binnen de breuk.',
    },
    {
      t: 'Breuken vermenigvuldigen',
      p: [
        'Bij vermenigvuldigen maak je de breuken niet gelijknamig. Je vermenigvuldigt de tellers met elkaar en de noemers met elkaar.',
        'Een heel getal schrijf je als breuk met noemer 1, zoals 5 = {5/1}. Een gemengd getal breng je eerst binnen de breuk.',
      ],
      ex: {
        q: T('Bereken {1 1/2} * {2 2/5}.'),
        steps: [
          'Breng de helen binnen de breuk: {1 1/2} = {3/2} en {2 2/5} = {12/5}',
          'Teller keer teller en noemer keer noemer: {3/2} * {12/5} = {36/10}',
          'Teller en noemer door 2 delen: {36/10} = {18/5}',
          'Helen eruit halen mag, maar hoeft niet: {18/5} = {3 3/5}',
        ],
      },
      watch:
        'Vermenigvuldig de helen en de breuken niet los. {1 1/2} * {2 2/5} is niet 1 * 2 plus {1/2} * {2/5}.',
    },
    {
      t: 'Een deel van een getal',
      p: [
        'Deel van betekent keer. {3/5} deel van 40 is {3/5} * 40.',
        'Een derde deel van een getal is hetzelfde als dat getal gedeeld door 3. De helft is gedeeld door 2, en een kwart gedeeld door 4.',
      ],
      ex: {
        q: T('Bereken {3/5} deel van 40.'),
        steps: [
          '{3/5} deel van 40 betekent {3/5} * 40.',
          'Teller keer teller en noemer keer noemer: {3/5} * 40 = {3/5} * {40/1} = {120/5}',
          'Deel de teller door de noemer: {120/5} = 120 : 5 = 24',
          'Zo kan het ook: 40 : 5 = 8, en 3 * 8 = 24',
        ],
      },
    },
    {
      t: 'Rekenvolgorde met breuken',
      p: [
        'Ook met breuken geldt de {{rekenvolgorde|rekenvolgorde}}: eerst wat tussen haakjes staat, dan vermenigvuldigen, en dan optellen en aftrekken.',
      ],
      ex: {
        q: T('Bereken {3/4} + {1/3} * {3/5}.'),
        steps: [
          'Vermenigvuldigen gaat voor optellen. Reken eerst {1/3} * {3/5} uit.',
          'Teller keer teller en noemer keer noemer: {1/3} * {3/5} = {3/15}',
          'Teller en noemer door 3 delen: {3/15} = {1/5}',
          'Vul dat in: {3/4} + {1/3} * {3/5} = {3/4} + {1/5}',
          'De nieuwe noemer is 4 * 5 = 20.',
          'Teller en noemer keer 5: {3/4} = {15/20}',
          'Teller en noemer keer 4: {1/5} = {4/20}',
          'Tel de tellers op: {3/4} + {1/5} = {15/20} + {4/20} = {19/20}',
        ],
      },
    },
    {
      t: 'Een getallenpiramide',
      p: [
        'In een {{=getallenpiramide|getallenpiramide}} is elk vak de som van de twee vakken eronder. Sommige vakken zijn leeg, en die reken je uit.',
        'Weet je de twee vakken onder een leeg vak, dan tel je ze op. Weet je het vak erboven en één vak eronder, dan reken je terug: je trekt het vak eronder af van het vak erboven.',
      ],
      ex: {
        q: T('Onder het vak {2 1/2} staan het vak {3/4} en een leeg vak A. Bereken A.'),
        steps: [
          '{3/4} + A = {2 1/2}, dus A = {2 1/2} - {3/4}.',
          'A = {2 1/2} - {3/4} = {5/2} - {3/4} = {10/4} - {3/4} = {7/4} = {1 3/4}',
        ],
      },
      watch: 'Bij terugrekenen trek je af. Tel het vak eronder niet op bij het vak erboven.',
    },
  ],
};
