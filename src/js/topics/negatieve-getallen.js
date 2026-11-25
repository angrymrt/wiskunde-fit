// Onderwerp: Negatieve getallen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
// Getallen kleiner dan 0 op de getallenlijn, vergelijken, temperaturen, en optellen en aftrekken.
// Een negatief getal staat zonder haakjes, zoals in het boek: 8 - -3. Haakjes staan alleen om een
// deelberekening. Alleen gehele getallen, behalve bij de getallenlijn en het vergelijken.
// Vermenigvuldigen en delen met negatieve getallen staat in een eigen onderwerp.
import { ri, nz, pick, coin, shuffle, gcd, lcm, Q, near, until } from '../math.js';
import { F, MC } from './shared.js';
import { T } from '../typeset.js';
import { getallenlijn } from '../getalfiguren.js';

// Een getal als tekst voor T: een geheel getal, of een breuk of gemengd getal met de min ervoor,
// zoals -{3/4} of -{7 1/2}. De min staat voor de breuk, nooit in de teller.
function getal(q) {
  q = Q(q);
  if (q.d === 1) return String(q.n);
  const a = Math.abs(q.n),
    h = Math.floor(a / q.d);
  return `${q.n < 0 ? '-' : ''}{${h ? `${h} ` : ''}${a % q.d}/${q.d}}`;
}
// Hetzelfde getal zoals je het zegt, voor een schermlezer en in een melding: −7 1/2.
function zeg(q) {
  q = Q(q);
  if (q.d === 1) return String(q.n).replace('-', '−');
  const a = Math.abs(q.n),
    h = Math.floor(a / q.d);
  return `${q.n < 0 ? '−' : ''}${h ? `${h} ` : ''}${a % q.d}/${q.d}`;
}
const zw = (x) => String(x).replace('-', '−');
const waarde = (q) => q.n / q.d;
// Vergelijkt twee breuken kruislings, zonder kommagetallen.
const teken = (x, y) => {
  const l = x.n * y.d,
    r = y.n * x.d;
  return l < r ? '<' : l > r ? '>' : '=';
};
const absQ = (q) => ({ n: Math.abs(q.n), d: q.d });
const figbox = (svg) => `<div class="figbox">${svg}</div>`;

// --- 201 Getallen op de getallenlijn ---

const LETTERS = ['A', 'B', 'C', 'D'];
// Een getallenlijn. Bij 'heel' staan er streepjes bij elk geheel getal en alleen getallen bij de
// vijfvouden, zodat je moet tellen. Bij 'half' staan de punten midden tussen twee streepjes. Bij
// 'deel' staan er streepjes per derde of per kwart. d is het aantal stappen per 1.
function kiesLijn(soort) {
  if (soort === 'heel') {
    const lo = ri(-15, -10);
    return { lo, hi: lo + 20, d: 1 };
  }
  if (soort === 'half')
    return until(
      () => {
        const lo = ri(-8, -4);
        return { lo, hi: lo + ri(8, 10), d: 2 };
      },
      ({ hi }) => hi >= 2,
    );
  const d = pick([3, 4]),
    breed = d === 3 ? pick([5, 6]) : pick([4, 5]),
    lo = -ri(2, breed - 1);
  return { lo, hi: lo + breed, d };
}
// Of een punt met teller n (de waarde is n / d) op deze lijn mag staan: binnen de lijn, en bij
// 'heel' niet bij een getal dat er al staat, bij 'half' midden tussen twee streepjes, en bij 'deel'
// niet op een geheel getal.
function magPunt({ lo, hi, d }, n) {
  if (n <= lo * d || n >= hi * d) return false;
  if (d === 1) return n % 5 !== 0;
  return n % d !== 0 && (d !== 2 || Math.abs(n) % 2 === 1);
}
// De fout die bij een negatief punt hoort. Bij een breuk: de breuk vanaf het verkeerde streepje
// geteld, zodat -3½ tussen -3 en -2 komt (of omgekeerd: het punt midden tussen -4 en -3 als -4½
// gelezen). Bij 'heel': de streepjes vanaf het dichtstbijzijnde getal de verkeerde kant op geteld.
function foutPunt({ d }, n) {
  if (n >= 0) return null;
  if (d === 1) return 2 * Math.round(n / 5) * 5 - n;
  const m = -n,
    h = Math.floor(m / d);
  return -(h * d + 2 * d - (m % d));
}
const FOUT_ID = (d) => (d === 1 ? 'verkeerde-kant-op-geteld' : 'breuk-de-verkeerde-kant-op');
const FOUT_M = (d) =>
  d === 1
    ? 'Je hebt de streepjes de verkeerde kant op geteld. Links van 0 worden de getallen kleiner: een streepje naar links is 1 minder.'
    : 'Een negatief getal met een breuk, zoals −3 1/2, is −3 en dan nog een stukje verder naar links. Het ligt dus tussen −4 en −3. Tel de breuk vanaf het streepje dat het dichtst bij 0 ligt.';

// Hoe je een punt vindt of afleest, als zin voor de uitwerking.
function plekZin({ d }, n, naam) {
  const x = Q(n, d);
  if (d === 1) {
    const L = Math.round(n / 5) * 5,
      k = Math.abs(n - L);
    return `${naam} staat ${k} ${k === 1 ? 'streepje' : 'streepjes'} ${n < L ? 'links' : 'rechts'} van ${L}, dus bij ${n}.`;
  }
  if (d === 2) {
    const a = Math.floor(n / 2);
    return `${naam} staat midden tussen ${a} en ${a + 1}, dus bij ${getal(x)}.`;
  }
  // Tel vanaf het gehele getal dat het dichtst bij 0 ligt.
  const h = Math.trunc(n / d),
    r = Math.abs(n % d);
  return `${naam} staat ${r} ${r === 1 ? 'streepje' : 'streepjes'} ${n < 0 ? 'links' : 'rechts'} van ${h}, dus bij ${getal(x)}.`;
}
const STAP_ZIN = { 1: 'Van streepje naar streepje is 1.', 2: 'Van streepje naar streepje is 1.' };
const stapZin = (d) =>
  STAP_ZIN[d] || `Van 0 naar 1 zijn ${d} stappen, dus van streepje naar streepje is {1/${d}}.`;

// Leest de punten terug uit de figuur zelf: de plek van elke letter, omgerekend met de getallen
// onder de streepjes. Zo kijkt v na wat de leerling echt ziet.
function uitFiguur(fig) {
  const tn = [...fig.matchAll(/<text class="tn"[^>]*\sx="([\d.]+)"[^>]*>([^<]+)<\/text>/g)].map(
      (m) => [+m[1], +m[2].replace('−', '-').replace(',', '.')],
    ),
    [x0, v0] = tn[0],
    [x1, v1] = tn[tn.length - 1],
    naar = (px) => v0 + ((px - x0) * (v1 - v0)) / (x1 - x0);
  return Object.fromEntries(
    [...fig.matchAll(/<text class="ti"[^>]*\sx="([\d.]+)"[^>]*>([A-Z])<\/text>/g)].map((m) => [
      m[2],
      naar(+m[1]),
    ]),
  );
}
const lijnFig = (lijn, pts) =>
  getallenlijn({
    xr: [lijn.lo, lijn.hi],
    step: lijn.d === 2 ? 1 : 1 / lijn.d,
    pts: pts.map(([n, label]) => ({ x: n / lijn.d, label })),
    coords: false,
  });
// Velden met een breuk die geen helft is, moeten als breuk: -2,67 is niet precies -2⅔.
const veld = (pre, q) => (q.d > 2 ? { ...F(pre, q), vorm: 'vereenvoudigd' } : F(pre, q));

function getallenOpDeLijn() {
  const soort = pick(['heel', 'half', 'deel']),
    lijn = kiesLijn(soort),
    { lo, hi, d } = lijn,
    alle = Array.from({ length: (hi - lo) * d - 1 }, (_, i) => lo * d + 1 + i).filter((n) =>
      magPunt(lijn, n),
    ),
    negatief = alle.filter((n) => n < 0),
    ver = (ns) => ns.every((a, i) => ns.every((b, j) => i === j || Math.abs(a - b) >= 2));
  if (coin()) {
    // Aflezen: bij welk getal staan twee punten? Minstens één is negatief.
    const [n1, n2] = until(
      () => [pick(negatief), pick(alle)],
      (ns) => ver(ns),
    );
    const [na, nb] = coin() ? [n1, n2] : [n2, n1],
      fig = lijnFig(lijn, [
        [na, 'A'],
        [nb, 'B'],
      ]),
      xs = [Q(na, d), Q(nb, d)],
      fields = [veld('A staat bij', xs[0]), { ...veld('B staat bij', xs[1]), br: true }];
    const fout = [na, nb].map((n) => foutPunt(lijn, n));
    const traps = [
      {
        id: 'minteken-vergeten',
        f: (v) => [na, nb].some((n, i) => n < 0 && near(v[i], -n / d)),
        m: 'Links van 0 staan de negatieve getallen. Vergeet het minteken niet.',
      },
      fout.some((w) => w !== null) && {
        id: FOUT_ID(d),
        f: (v) => fout.some((w, i) => w !== null && near(v[i], w / d)),
        m: FOUT_M(d),
      },
    ].filter(Boolean);
    return {
      q: T('Bij welke getallen staan de punten A en B?'),
      fig,
      fields,
      hint: T(
        d === 1
          ? 'Tel de streepjes vanaf het dichtstbijzijnde getal. Links van 0 worden de getallen kleiner.'
          : 'Kijk eerst hoeveel een stap van streepje naar streepje is. Tel dan vanaf het gehele getal dat het dichtst bij 0 ligt.',
      ),
      steps: [stapZin(d), plekZin(lijn, na, 'A'), plekZin(lijn, nb, 'B')],
      traps,
      v: () => {
        const plek = uitFiguur(fig);
        return fields.every((f, i) => near(plek[LETTERS[i]], f.a, 0.02));
      },
    };
  }
  // Kiezen: welk punt staat bij een getal? Bij de punten staan ook het getal zonder minteken en
  // het getal van de fout.
  const [n, vierde] = until(
    () => [pick(negatief), pick(alle)],
    ([n, vierde]) => {
      const w = foutPunt(lijn, n);
      return magPunt(lijn, -n) && magPunt(lijn, w) && ver([n, -n, w, vierde]);
    },
  );
  const w = foutPunt(lijn, n),
    plekken = [n, -n, w, vierde],
    namen = shuffle(LETTERS),
    x = Q(n, d),
    fig = lijnFig(
      lijn,
      plekken.map((p, i) => [p, namen[i]]),
    );
  return {
    q: T(`Welk punt staat bij ${getal(x)}?`),
    fig,
    fields: [
      {
        sel: LETTERS,
        a: namen[0],
        pre: `${getal(x)} staat bij punt`,
        label: `Het punt bij ${zeg(x)}`,
      },
    ],
    hint: T(
      d === 1
        ? 'Zoek het getal onder de lijn dat er het dichtst bij ligt, en tel de streepjes. Links van 0 worden de getallen kleiner.'
        : 'Kijk eerst hoeveel een stap van streepje naar streepje is. Een negatief getal ligt links van 0: hoe groter het getal zonder minteken, hoe verder naar links.',
    ),
    steps: [
      stapZin(d),
      plekZin(lijn, n, getal(x)).replace(/, dus bij .*$/, '.'),
      `Daar staat punt ${namen[0]}.`,
    ],
    traps: [
      {
        id: 'minteken-vergeten',
        f: (v) => v[0] === namen[1],
        m: `Punt ${namen[1]} staat bij ${zeg(Q(-n, d))}, rechts van 0. Een negatief getal staat links van 0.`,
      },
      {
        id: FOUT_ID(d),
        f: (v) => v[0] === namen[2],
        m: FOUT_M(d),
      },
    ],
    v: () => near(uitFiguur(fig)[namen[0]], waarde(x), 0.02),
  };
}

// --- 202 Getallen vergelijken ---

// Een echte breuk die al vereenvoudigd is, als { t, n }.
const echteBreuk = () =>
  until(
    () => {
      const n = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]);
      return { t: ri(1, n - 1), n };
    },
    ({ t, n }) => gcd(t, n) === 1,
  );
// De twee kanten per soort. Elke kant is een breuk uit Q.
const PAREN = {
  heel: () =>
    until(
      () => [Q(ri(-20, 20)), Q(ri(-20, 20))],
      ([x, y]) => x.n !== y.n && (x.n < 0 || y.n < 0),
    ),
  breuk: () =>
    until(
      () => [echteBreuk(), echteBreuk()],
      ([x, y]) => x.n !== y.n && x.t * y.n !== y.t * x.n && lcm(x.n, y.n) <= 60,
    ).map(({ t, n }) => Q(-t, n)),
  gemengd: () => {
    const h = ri(1, 9);
    return until(
      () => [echteBreuk(), echteBreuk()],
      ([x, y]) => x.t * y.n !== y.t * x.n && lcm(x.n, y.n) <= 60,
    ).map(({ t, n }) => Q(-(h * n + t), n));
  },
  // Een negatieve en een positieve breuk of gemengd getal.
  tegen: () => {
    const [x, y] = until(
      () => [echteBreuk(), echteBreuk()],
      ([x, y]) => x.t * y.n !== y.t * x.n,
    );
    const hx = ri(0, 3),
      hy = ri(0, 2);
    return [Q(-(hx * x.n + x.t), x.n), Q(hy * y.n + y.t, y.n)];
  },
  // Even groot, in een andere vorm: als onechte breuk, of niet vereenvoudigd.
  gelijk: () => {
    const { t, n } = echteBreuk(),
      h = ri(0, 3),
      x = Q(-(h * n + t), n);
    if (h && coin()) return [x, { soort: 'onecht', t: h * n + t, n }];
    const k = ri(2, 4);
    return [x, { soort: 'niet-vereenvoudigd', h, t: t * k, n: n * k, k }];
  },
};
// Een kant als tekst. Een kant uit 'gelijk' is soms een onechte breuk of niet vereenvoudigd.
const kantTekst = (k) =>
  !k.soort
    ? getal(k)
    : k.soort === 'onecht' || !k.h
      ? `-{${k.t}/${k.n}}`
      : `-{${k.h} ${k.t}/${k.n}}`;
const kantZeg = (k) =>
  !k.soort ? zeg(k) : k.soort === 'onecht' || !k.h ? `−${k.t}/${k.n}` : `−${k.h} ${k.t}/${k.n}`;
const kantQ = (k) =>
  !k.soort ? k : k.soort === 'onecht' ? Q(-k.t, k.n) : Q(-(k.h * k.n + k.t), k.n);

// Vergelijkt twee positieve breuken in de uitwerking: gelijknamig maken als dat nodig is.
function breukenZin(x, y) {
  const s = teken(x, y);
  if (x.d === y.d) return `${getal(x)} ${s} ${getal(y)}`;
  const m = lcm(x.d, y.d),
    om = (q) => (q.d === m ? getal(q) : `${getal(q)} = {${(q.n * m) / q.d}/${m}}`);
  return `${om(x)} en ${om(y)}, dus ${getal(x)} ${s} ${getal(y)}`;
}

function vergelijkTeken() {
  const soort = pick(['heel', 'heel', 'breuk', 'gemengd', 'tegen', 'gelijk']);
  const [K1, K2] = PAREN[soort]();
  const [L, R] = coin() ? [K1, K2] : [K2, K1];
  const ql = kantQ(L),
    qr = kantQ(R),
    a = teken(ql, qr),
    tl = kantTekst(L),
    tr = kantTekst(R);
  const steps = [];
  if (soort === 'gelijk') {
    const [o, k] = L.soort ? [R, L] : [L, R],
      ot = getal(o),
      kt = kantTekst(k);
    if (k.soort === 'onecht')
      steps.push(
        `Haal de helen uit {${k.t}/${k.n}}: ${k.n} past ${Math.floor(k.t / k.n)} keer in ${k.t}, en er blijft ${k.t % k.n} over. Dus ${kt} = ${ot}.`,
      );
    else steps.push(`Vereenvoudig ${kt}: teller en noemer door ${k.k} delen. Dat geeft ${ot}.`);
    steps.push(`Ze zijn even groot, dus ${tl} = ${tr}.`);
  } else if (ql.n < 0 && qr.n < 0) {
    const zl = absQ(ql),
      zr = absQ(qr);
    if (soort === 'heel') steps.push(`Zonder minteken: ${zl.n} ${teken(zl, zr)} ${zr.n}.`);
    else if (soort === 'gemengd')
      steps.push(
        `De helen zijn gelijk. Vergelijk de breuken zonder minteken: ${breukenZin(Q(zl.n % zl.d, zl.d), Q(zr.n % zr.d, zr.d))}.`,
        `Dus zonder minteken is ${getal(zl)} ${teken(zl, zr)} ${getal(zr)}.`,
      );
    else steps.push(`Vergelijk eerst zonder minteken: ${breukenZin(zl, zr)}.`);
    steps.push(
      'Bij negatieve getallen is het andersom: hoe verder van 0, hoe verder naar links op de getallenlijn, en hoe kleiner.',
    );
  } else if (ql.n === 0 || qr.n === 0) {
    const [neg] = [ql, qr].filter((q) => q.n !== 0);
    steps.push(
      neg.n < 0
        ? `${getal(neg)} is negatief en ligt links van 0 op de getallenlijn.`
        : `${getal(neg)} is positief en ligt rechts van 0 op de getallenlijn.`,
    );
  } else if (ql.n < 0 !== qr.n < 0)
    steps.push(
      'Een negatief getal ligt links van 0 en een positief getal rechts van 0. Een negatief getal is dus altijd kleiner dan een positief getal.',
    );
  if (soort !== 'gelijk') steps.push(`Dus ${tl} ${a} ${tr}.`);

  const zonder = teken(absQ(ql), absQ(qr)),
    omgedraaid = { '<': '>', '>': '<', '=': '=' }[a];
  const beideNeg = ql.n < 0 && qr.n < 0;
  const traps = [];
  if (zonder !== a)
    traps.push({
      id: 'zonder-minteken-vergeleken',
      f: (v) => v[0] === zonder,
      m: beideNeg
        ? `Je hebt de getallen vergeleken zonder minteken. Bij negatieve getallen is het getal dat verder van 0 af ligt juist het kleinst: ${kantZeg(zonder === '>' ? L : R)} ligt verder naar links.`
        : ql.n === 0 || qr.n === 0
          ? 'Je hebt de getallen vergeleken zonder minteken. Een negatief getal ligt links van 0, dus het is kleiner dan 0.'
          : 'Je hebt de getallen vergeleken zonder minteken. Een negatief getal is altijd kleiner dan een positief getal.',
    });
  else if (a !== '=')
    traps.push({
      id: 'kleiner-en-groter-verwisseld',
      f: (v) => v[0] === omgedraaid,
      m: 'Je hebt kleiner en groter verwisseld. De punt van het teken wijst naar het kleinste getal, en het kleinste getal ligt links op de getallenlijn.',
    });
  return {
    q: T(`Wat moet er tussen ${tl} en ${tr} staan? Kies <, > of =.`),
    fields: [
      {
        sel: ['<', '>', '='],
        a,
        pre: tl,
        post: tr,
        label: `Teken tussen ${kantZeg(L)} en ${kantZeg(R)}`,
      },
    ],
    hint: T(
      'Denk aan de {{getallenlijn|getallenlijn}}: rechts is groter. Een negatief getal dat verder van 0 af ligt, is kleiner.',
    ),
    steps,
    traps,
    // Rekent beide kanten uit als kommagetal en vergelijkt die.
    v: () => {
      const wl = kantQ(L).n / kantQ(L).d,
        wr = kantQ(R).n / kantQ(R).d;
      return a === (near(wl, wr) ? '=' : wl < wr ? '<' : '>');
    },
  };
}

function volgorde() {
  const { vals, opties } = until(
    () => {
      const neg = [ri(-15, -1), ri(-15, -1), ri(-15, -1)].map((n) => Q(n));
      // Soms een negatief getal met een half.
      if (coin()) neg[0] = Q(2 * neg[0].n - 1, 2);
      const vals = [...neg, Q(ri(0, 6)), Q(ri(3, 15))];
      const op = (xs) => [...xs].sort((x, y) => waarde(x) - waarde(y));
      const juist = op(vals),
        negs = juist.filter((x) => x.n < 0),
        rest = juist.filter((x) => x.n >= 0);
      const opties = [
        juist,
        [...[...negs].reverse(), ...rest],
        [...vals].sort((x, y) => Math.abs(waarde(x)) - Math.abs(waarde(y))),
        [...juist].reverse(),
      ];
      return { vals, opties };
    },
    ({ vals, opties }) => {
      const abs = vals.map((x) => Math.abs(waarde(x)));
      const rijen = opties.map((o) => o.map(getal).join());
      return new Set(abs).size === vals.length && new Set(rijen).size === rijen.length;
    },
  );
  const rij = (o) => T(o.map(getal).join(' < '));
  const html = opties.map(rij),
    juist = opties[0],
    negs = juist.filter((x) => x.n < 0),
    rest = juist.filter((x) => x.n >= 0);
  return {
    q: T(
      `Zet de getallen op volgorde van klein naar groot: ${shuffle(vals).map(getal).join('; ')}. Welke rij klopt?`,
    ),
    mc: MC(html, 0),
    hint: T(
      'Op de {{getallenlijn|getallenlijn}} staat het kleinste getal links. Bij negatieve getallen is het getal dat verder van 0 af ligt het kleinst.',
    ),
    steps: [
      `De negatieve getallen staan links van 0. Hoe verder van 0, hoe kleiner: ${negs.map(getal).join(' < ')}.`,
      `Daarna komen ${rest[0].n === 0 ? '0 en het positieve getal' : 'de positieve getallen'}: ${rest.map(getal).join(' < ')}.`,
      `Van klein naar groot: ${juist.map(getal).join(' < ')}.`,
    ],
    traps: [
      {
        id: 'zonder-minteken-vergeleken',
        f: (v) => v[0] === html[1] || v[0] === html[2],
        m: 'Je hebt de getallen vergeleken zonder minteken. Bij negatieve getallen is het getal dat verder van 0 af ligt juist het kleinst.',
      },
      {
        id: 'van-groot-naar-klein',
        f: (v) => v[0] === html[3],
        m: 'Je hebt de getallen van groot naar klein gezet. Het kleinste getal staat links op de getallenlijn en komt vooraan.',
      },
    ],
    // Elk getal in de goede rij is kleiner dan het volgende, kruislings vergeleken, en de rij heeft
    // dezelfde getallen als de vraag.
    v: () =>
      juist.every((x, i) => i === 0 || juist[i - 1].n * x.d < x.n * juist[i - 1].d) &&
      juist.map(getal).sort().join() === vals.map(getal).sort().join(),
  };
}

const negatiefVergelijken = () => (ri(0, 2) === 0 ? volgorde() : vergelijkTeken());

// --- 203 Temperatuur ---

// Een temperatuur die stijgt (s = 1) of daalt (s = -1). a is de begintemperatuur, b hoeveel graden.
const VERANDER = [
  {
    s: 1,
    a: [-24, -16],
    b: [4, 30],
    t: (a, b) =>
      `In een vriezer is het ${a} graden. De stroom valt uit, en de temperatuur in de vriezer stijgt ${b} graden. Hoeveel graden is het dan in de vriezer?`,
    pre: 'Het is dan',
  },
  {
    s: -1,
    a: [-6, 5],
    b: [5, 20],
    t: (a, b) =>
      `In een koelcel van een visafslag is het ${a} graden. Er komt een lading vis aan, en de koelcel wordt ${b} graden kouder gezet. Hoeveel graden is het dan in de koelcel?`,
    pre: 'Het is dan',
  },
  {
    s: -1,
    a: [-3, 12],
    b: [8, 20],
    t: (a, b) =>
      `Onder aan een berg is het ${a} graden. Op de top is het ${b} graden kouder. Hoeveel graden is het op de top?`,
    pre: 'Op de top is het',
  },
  {
    s: -1,
    a: [-2, 15],
    b: [15, 30],
    t: (a, b) =>
      `Een weerballon stijgt op. Op de grond is het ${a} graden. Hoog in de lucht is het ${b} graden kouder. Hoeveel graden is het daar?`,
    pre: 'Hoog in de lucht is het',
  },
  {
    s: 1,
    a: [-25, -12],
    b: [5, 15],
    t: (a, b) =>
      `Buiten een ijshotel is het ${a} graden. Binnen is het ${b} graden warmer. Hoeveel graden is het binnen?`,
    pre: 'Binnen is het',
  },
  {
    s: 1,
    a: [-20, -16],
    b: [25, 60],
    t: (a, b) =>
      `Een blok diepvriessoep komt uit de vriezer met een temperatuur van ${a} graden. In de pan wordt de soep ${b} graden warmer. Hoeveel graden is de soep dan?`,
    pre: 'De soep is dan',
  },
];
// Twee temperaturen en het verschil. lo is de laagste, hi de hoogste.
const VERSCHIL = [
  {
    lo: [-24, -16],
    hi: [2, 7],
    t: (lo, hi) =>
      `In een vriezer is het ${lo} graden en in een koelkast ${hi} graden. Hoeveel graden is het verschil?`,
    pre: 'Het verschil is',
    post: 'graden',
  },
  {
    lo: [-30, -15],
    hi: [-6, 3],
    t: (lo, hi) =>
      `Buiten een iglo is het ${lo} graden. Binnen in de iglo is het ${hi} graden. Hoeveel graden is het binnen warmer dan buiten?`,
    pre: 'Binnen is het',
    post: 'graden warmer',
  },
  {
    lo: [-50, -20],
    hi: [2, 18],
    t: (lo, hi) =>
      `Een weerballon meet op de grond ${hi} graden en hoog in de lucht ${lo} graden. Hoeveel graden is het verschil?`,
    pre: 'Het verschil is',
    post: 'graden',
  },
  {
    lo: [-8, -3],
    hi: [17, 22],
    t: (lo, hi) =>
      `Het ijs van een schaatsbaan is ${lo} graden. In de kantine ernaast is het ${hi} graden. Hoeveel graden is het verschil?`,
    pre: 'Het verschil is',
    post: 'graden',
  },
  {
    lo: [-22, -12],
    hi: [-8, -1],
    t: (lo, hi) =>
      `Een ijsblokje komt uit de vriezer met een temperatuur van ${lo} graden. Even later is het ${hi} graden. Hoeveel graden is de temperatuur gestegen?`,
    pre: 'De temperatuur is',
    post: 'graden gestegen',
  },
];
// Telt een temperatuur graad voor graad op of af, los van optellen en aftrekken.
const tel = (van, stappen, s) => Array.from({ length: stappen }).reduce((t) => t + s, van);
const telTot = (van, tot) => (van < tot ? 1 + telTot(van + 1, tot) : 0);

function temperatuur() {
  if (coin()) {
    const s = pick(VERANDER);
    const [a, b] = until(
      () => [ri(...s.a), ri(...s.b)],
      ([a, b]) => a !== 0 && a + s.s * b !== 0,
    );
    const c = a + s.s * b,
      fout = a - s.s * b,
      fields = [F(s.pre, c, 'graden')];
    const stijgt = s.s > 0;
    return {
      q: T(s.t(a, b)),
      fields,
      hint: T(
        stijgt
          ? 'Stijgen is erbij optellen: op de {{getallenlijn|getallenlijn}} ga je naar rechts.'
          : 'Dalen is eraf halen: op de {{getallenlijn|getallenlijn}} ga je naar links.',
      ),
      steps: [
        stijgt
          ? `De temperatuur stijgt, dus je telt erbij op. Op de getallenlijn ga je ${b} naar rechts.`
          : `De temperatuur daalt, dus je trekt eraf. Op de getallenlijn ga je ${b} naar links.`,
        `${a} ${stijgt ? '+' : '-'} ${b} = ${c}`,
        `${s.pre} ${c} graden.`,
      ],
      traps: [
        {
          id: 'verkeerde-kant-op',
          f: (v) => near(v[0], fout),
          m: stijgt
            ? 'Stijgt de temperatuur, dan wordt het warmer. Op de getallenlijn ga je dan naar rechts: je telt erbij op.'
            : `Daalt de temperatuur, dan wordt het kouder. Op de getallenlijn ga je dan naar links: je trekt eraf.${a < 0 ? ` Bij ${zw(a)} − ${b} ga je vanaf ${zw(a)} nog ${b} verder van 0 af.` : ''}`,
        },
        {
          id: 'minteken-vergeten',
          f: (v) => near(v[0], -c),
          m:
            c < 0
              ? 'De temperatuur komt onder 0 uit. Vergeet het minteken niet.'
              : 'De temperatuur komt boven 0 uit, dus er hoort geen minteken bij.',
        },
      ],
      // Telt graad voor graad vanaf de begintemperatuur.
      v: () => tel(a, b, s.s) === fields[0].a,
    };
  }
  const s = pick(VERSCHIL);
  const [lo, hi] = until(
    () => [ri(...s.lo), ri(...s.hi)],
    ([lo, hi]) => hi !== 0 && lo < hi,
  );
  const dv = hi - lo,
    fields = [F(s.pre, dv, s.post)];
  // Zonder minteken: bij een negatieve en een positieve temperatuur trek je de getallen zonder
  // minteken af; bij twee negatieve tel je ze op.
  const zonder = hi > 0 ? Math.abs(Math.abs(lo) - hi) : Math.abs(lo) + Math.abs(hi);
  return {
    q: T(s.t(lo, hi)),
    fields,
    hint: T(
      'Het verschil is de hoogste temperatuur min de laagste. Je kunt ook op de {{getallenlijn|getallenlijn}} tellen hoeveel stappen ertussen zitten.',
    ),
    steps: [
      'Het verschil is de hoogste temperatuur min de laagste.',
      `${hi} - ${lo} = ${hi} + ${-lo} = ${dv}`,
      hi > 0
        ? `Op de getallenlijn: van ${lo} naar 0 is ${-lo}, en van 0 naar ${hi} is ${hi}. Samen ${dv}.`
        : `Op de getallenlijn: van ${lo} naar ${hi} zijn ${dv} stappen.`,
      `${s.pre} ${dv} ${s.post}.`,
    ],
    traps: [
      zonder !== dv && {
        id: 'verschil-zonder-minteken',
        f: (v) => near(v[0], zonder),
        m:
          hi > 0
            ? `Je hebt gerekend zonder minteken. Van ${zw(lo)} naar 0 is al ${-lo} graden, en dan nog ${hi} graden tot ${hi}.`
            : `Beide temperaturen zijn negatief. Van ${zw(lo)} naar ${zw(hi)} ga je ${dv} stappen naar rechts; je komt niet langs 0.`,
      },
      {
        id: 'verschil-negatief',
        f: (v) => near(v[0], -dv),
        m: 'Een verschil is hoeveel graden ertussen zit, en dat is positief. Trek de laagste temperatuur af van de hoogste.',
      },
    ].filter(Boolean),
    // Telt graad voor graad van de laagste naar de hoogste temperatuur.
    v: () => telTot(lo, hi) === fields[0].a,
  };
}

// --- 204 en 205 Optellen en aftrekken ---

// Een berekening is een rij tekens: getallen (ook negatief), '+', '-', '(' en ')'. Als tekst voor T
// staat een negatief getal zonder haakjes, zoals 8 - -3.
const tekst = (ts) => ts.join(' ').replace(/\( /g, '(').replace(/ \)/g, ')');
const doe = (x, op, y) => (op === '+' ? x + y : x - y);

// Eén stap: reken binnen de eerste haakjes die sluiten de eerste bewerking uit, of anders de eerste
// bewerking van links. Blijft er tussen de haakjes één getal over, dan vallen de haakjes weg.
function stap(ts, reken = doe) {
  const sluit = ts.indexOf(')'),
    open = sluit < 0 ? -1 : ts.lastIndexOf('(', sluit),
    i = open + 2;
  const c = reken(ts[i - 1], ts[i], ts[i + 1]);
  if (sluit >= 0 && sluit - open === 4) return [...ts.slice(0, open), c, ...ts.slice(sluit + 1)];
  return [...ts.slice(0, i - 1), c, ...ts.slice(i + 2)];
}
const rijen = (ts, reken = doe) => (ts.length > 1 ? [ts, ...rijen(stap(ts, reken), reken)] : [ts]);
const uitkomst = (ts, reken = doe) => rijen(ts, reken).pop()[0];
// De laatste stap met de tussenstap van het boek: a + -b = a - b en a - -b = a + b.
function laatsteStap([x, op, y], c) {
  if (y < 0) return `${x} ${op} ${y} = ${x} ${op === '+' ? '-' : '+'} ${-y} = ${c}`;
  return `${x} ${op} ${y} = ${c}`;
}
// De uitwerking onder elkaar: elke regel is de hele berekening opnieuw, met één stap uitgerekend.
function uitwerking(ts) {
  const rs = rijen(ts),
    c = rs[rs.length - 1][0];
  return rs.slice(0, -1).map((r, i) => (i < rs.length - 2 ? `${tekst(r)} =` : laatsteStap(r, c)));
}

// De fouten uit het boek, als een verkeerde manier om één bewerking uit te rekenen. De eerste die
// past, geeft de melding.
const FOUTEN = [
  {
    id: 'plus-min-als-plus',
    reken: (x, op, y) => (op === '+' && y < 0 ? x - y : doe(x, op, y)),
    m: 'Plus een negatief getal is hetzelfde als min: 5 + −2 = 5 − 2. Je hebt de min van het negatieve getal weggelaten.',
  },
  {
    id: 'min-min-als-min',
    reken: (x, op, y) => (op === '-' && y < 0 ? x + y : doe(x, op, y)),
    m: 'Min een negatief getal is hetzelfde als plus: 5 − −2 = 5 + 2. Twee mintekens naast elkaar worden een plus.',
  },
  {
    id: 'negatief-min-getal-als-verschil',
    reken: (x, op, y) => (op === '-' && x < 0 && y > 0 ? x + y : doe(x, op, y)),
    m: 'Trek je iets af van een negatief getal, dan ga je nog verder naar links, verder van 0 af. Zo is −6 − 4 = −10 en niet −2.',
  },
  {
    id: 'pijl-verkeerde-kant',
    reken: (x, op, y) =>
      op === '+' && x < 0 && y > 0 ? x - y : op === '-' && x > 0 && y > x ? x + y : doe(x, op, y),
    m: 'Je bent de verkeerde kant op gegaan. Erbij optellen is op de getallenlijn naar rechts, eraf aftrekken is naar links.',
  },
];
const HAAKJES = {
  id: 'haakjes-genegeerd',
  m: 'Wat tussen haakjes staat, reken je eerst uit. Staat er een min voor de haakjes, dan trek je de hele uitkomst van de haakjes af.',
};
// De foute uitkomsten van een berekening per fout, zonder de goede uitkomst.
function fouteUitkomsten(ts) {
  const goed = uitkomst(ts);
  const fs = FOUTEN.map(({ id, reken }) => [id, uitkomst(ts, reken)]);
  if (ts.includes('('))
    fs.unshift([HAAKJES.id, uitkomst(ts.filter((x) => x !== '(' && x !== ')'))]);
  fs.push(['minteken-vergeten', -goed]);
  return fs.filter(([, w]) => w !== goed);
}
const BERICHT = Object.fromEntries([...FOUTEN, HAAKJES].map(({ id, m }) => [id, m]));
BERICHT['minteken-vergeten'] =
  'Kijk nog eens naar het teken van je antwoord: ligt de uitkomst links of rechts van 0?';
// Een valkuil per fout, als een van de velden de foute uitkomst van die fout heeft.
function rekenTraps(berekeningen) {
  const per = berekeningen.map(fouteUitkomsten);
  return ['haakjes-genegeerd', ...FOUTEN.map((f) => f.id), 'minteken-vergeten']
    .map((id) => {
      const ws = per.map((fs) => fs.filter(([j]) => j === id).map(([, w]) => w));
      return ws.some((w) => w.length)
        ? { id, f: (v) => ws.some((w, i) => w.some((x) => near(v[i], x))), m: BERICHT[id] }
        : null;
    })
    .filter(Boolean);
}

// Rekent een berekening als tekst na, zoals '8 - -3' of '-4 - (6 - 9)'. Een eigen ontleder, los van
// de stappen hierboven, voor de controle v. Een min aan het begin, na een bewerking of na '(' hoort
// bij het getal erachter.
function narekenen(s) {
  const ts = s.match(/\d+|[-+()]/g) || [];
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
  const verder = (x) =>
    ts[i] === '+' || ts[i] === '-' ? verder(ts[i++] === '+' ? x + een() : x - een()) : x;
  const som = () => verder(een());
  const x = som();
  return i === ts.length ? x : NaN;
}
// Telt een som stap voor stap op de getallenlijn: vanaf het eerste getal één stap per keer naar
// rechts (erbij) of naar links (eraf). Min een negatief getal gaat dus naar rechts.
const pijl = (x, op, y) => tel(x, Math.abs(y), (op === '+') === y > 0 ? 1 : -1);

// De soorten sommen van 204. a is het eerste getal en b het tweede, met teken.
const SOMMEN = {
  plusNegatief: () => [nz(-15, 20), '+', -ri(2, 20)],
  minNegatief: () => [nz(-15, 20), '-', -ri(2, 20)],
  negatiefPlus: () => [-ri(2, 20), '+', ri(2, 20)],
  negatiefMin: () => [-ri(2, 20), '-', ri(2, 15)],
  kleinMinGroot: () => {
    const a = ri(1, 12);
    return [a, '-', ri(a + 1, 25)];
  },
};
// Hoe je een som zonder tussenstap op de getallenlijn ziet.
const pijlZin = ([a, op, b]) => `${a} ${op} ${b} = ${pijl(a, op, b)}`;

function optellenAftrekken() {
  const soorten = shuffle(Object.keys(SOMMEN)).slice(0, 2);
  const sommen = soorten.map((k) =>
    until(SOMMEN[k], ([a, op, b]) => {
      const c = doe(a, op, b);
      return c !== 0 && Math.abs(c) <= 30 && Math.abs(a) !== Math.abs(b);
    }),
  );
  const fields = sommen.map((s, i) => ({ ...F(`${tekst(s)} =`, doe(...s)), br: i > 0 }));
  const steps = sommen.map((s) => {
    const [a, op, b] = s;
    if (b < 0) return laatsteStap(s, doe(a, op, b));
    return `${pijlZin(s)}, want vanaf ${a} ga je ${b} naar ${op === '+' ? 'rechts' : 'links'}.`;
  });
  return {
    q: T('Bereken.'),
    fields,
    hint: T(
      'Optellen is naar rechts op de {{getallenlijn|getallenlijn}}, aftrekken naar links. Plus een negatief getal is min: 5 + -2 = 5 - 2. Min een negatief getal is plus: 5 - -2 = 5 + 2.',
    ),
    steps,
    traps: rekenTraps(sommen),
    // Een eigen ontleder rekent de tekst na, en op de getallenlijn tellen geeft hetzelfde.
    v: () =>
      sommen.every((s, i) => narekenen(tekst(s)) === fields[i].a && pijl(...s) === fields[i].a),
  };
}

// --- 205 Drie getallen en haakjes ---

// De vormen met 'n' voor een getal. De haakjes staan na een min, zodat ze ertoe doen, of ervoor.
const n = 'n';
const VORMEN = [
  [n, '-', '(', n, '+', n, ')'],
  [n, '-', '(', n, '-', n, ')'],
  ['(', n, '-', n, ')', '-', n],
  ['(', n, '+', n, ')', '-', n],
  [n, '+', '(', n, '-', n, ')'],
  ['(', n, '-', n, ')', '+', n],
];
// Twee berekeningen met dezelfde getallen die alleen in de haakjes verschillen.
const PAREN_HAAKJES = [
  [
    [n, '-', '(', n, '-', n, ')'],
    ['(', n, '-', n, ')', '-', n],
  ],
  [
    [n, '-', '(', n, '+', n, ')'],
    ['(', n, '-', n, ')', '+', n],
  ],
];
const vul = (vorm, xs) => {
  let i = 0;
  return vorm.map((x) => (x === n ? xs[i++] : x));
};
// Een berekening is mooi als er een negatief getal in staat, elke tussenuitkomst niet groter is
// dan 40, en er minstens een keer + - of - - staat, zodat de tekenregels ertoe doen.
function mooi(ts) {
  const rs = rijen(ts);
  const getallen = rs.flat().filter((x) => typeof x === 'number');
  const regel = rs.some((r) =>
    r.some((x, i) => (x === '+' || x === '-') && typeof r[i + 1] === 'number' && r[i + 1] < 0),
  );
  return (
    ts.some((x) => typeof x === 'number' && x < 0) &&
    getallen.every((x) => x !== 0 && Math.abs(x) <= 40) &&
    regel &&
    uitkomst(ts) !== 0
  );
}
const drieGetal = () => (coin() ? -ri(1, 15) : ri(1, 15));

function drieGetallen() {
  let berekeningen;
  if (ri(0, 2) === 0) {
    const [va, vb] = pick(PAREN_HAAKJES);
    berekeningen = until(
      () => {
        const xs = [drieGetal(), drieGetal(), drieGetal()];
        return [vul(va, xs), vul(vb, xs)];
      },
      ([a, b]) => mooi(a) && mooi(b) && uitkomst(a) !== uitkomst(b),
    );
  } else {
    const vorm = pick(VORMEN);
    berekeningen = [
      until(
        () => vul(vorm, [drieGetal(), drieGetal(), drieGetal()]),
        (ts) => mooi(ts) && fouteUitkomsten(ts).length > 1,
      ),
    ];
  }
  const ss = berekeningen.map(tekst);
  const fields = berekeningen.map((ts, i) => ({
    ...F(berekeningen.length > 1 ? `${ss[i]} =` : 'Uitkomst:', uitkomst(ts)),
    br: i > 0,
  }));
  return {
    q: T(
      berekeningen.length > 1
        ? `Bereken ${ss[0]} en ${ss[1]}. Let op: ze verschillen alleen in de haakjes.`
        : `Bereken ${ss[0]}.`,
    ),
    fields,
    hint: T(
      'Reken eerst uit wat tussen haakjes staat. Daarna reken je van links naar rechts. Plus een negatief getal is min, en min een negatief getal is plus.',
    ),
    steps: berekeningen.flatMap(uitwerking),
    traps: rekenTraps(berekeningen),
    // Een eigen ontleder rekent de berekening na, en elke regel van de uitwerking heeft dezelfde
    // uitkomst.
    v: () =>
      berekeningen.every(
        (ts, i) =>
          narekenen(ss[i]) === fields[i].a &&
          rijen(ts).every((r) => narekenen(tekst(r)) === fields[i].a),
      ),
  };
}

export default {
  slug: 'negatieve-getallen',
  title: 'Negatieve getallen',
  intro:
    'Getallen kleiner dan 0 heten negatieve getallen, zoals −5 of een temperatuur van −12 graden. Hier zet je ze op de getallenlijn, vergelijk je ze, reken je met temperaturen, en tel je op en trek je af met negatieve getallen.',
  description:
    'Negatieve getallen oefenen: de getallenlijn, groter en kleiner, temperatuur, en optellen en aftrekken met negatieve getallen. Gratis met uitleg en hints.',
  videos: {},
  skills: [
    [201, 'Getallen op de getallenlijn', getallenOpDeLijn],
    [202, 'Negatieve getallen vergelijken', negatiefVergelijken],
    [203, 'Temperatuur die stijgt of daalt', temperatuur],
    [204, 'Optellen en aftrekken met negatieve getallen', optellenAftrekken],
    [205, 'Drie getallen en haakjes', drieGetallen],
  ],
  learn: [
    {
      t: 'De getallenlijn',
      p: [
        'Op een {{=getallenlijn|getallenlijn}} staan de getallen op gelijke afstand. Rechts van 0 staan de {{=positief|positieve getallen}}, links van 0 de {{=negatief|negatieve getallen}}, zoals -3. Het getal 0 is niet positief en niet negatief.',
        'Een negatief getal met een breuk, zoals -{2 1/2}, betekent -2 en dan nog {1/2} verder naar links. Het ligt dus midden tussen -3 en -2.',
      ],
      ex: {
        q:
          T('Bij welk getal staat punt P?') +
          figbox(getallenlijn({ xr: [-5, 3], pts: [{ x: -3.5, label: 'P', t: '−3 1/2' }] })),
        steps: [
          'Van streepje naar streepje is 1.',
          'P staat midden tussen -4 en -3, dus bij -{3 1/2}.',
        ],
      },
    },
    {
      t: 'Getallen vergelijken',
      p: [
        'Met < bedoel je kleiner dan, met > groter dan. Op de getallenlijn is het getal dat rechts ligt het grootst.',
        'Bij negatieve getallen is het getal dat verder van 0 af ligt het kleinst. Vergelijk ze eerst zonder minteken, en draai het teken dan om.',
      ],
      ex: {
        q: T('Kies <, > of =: -{4 1/2} en -{4 2/5}.'),
        steps: [
          'Zonder minteken: {1/2} = {5/10} en {2/5} = {4/10}, dus {4 1/2} > {4 2/5}.',
          'Bij negatieve getallen is het andersom: -{4 1/2} ligt verder naar links.',
          'Dus -{4 1/2} < -{4 2/5}.',
        ],
      },
      watch:
        'Vergelijk negatieve getallen niet zonder minteken: -9 is kleiner dan -2, ook al is 9 groter dan 2.',
    },
    {
      t: 'Temperatuur',
      p: [
        'Stijgt de temperatuur, dan tel je erbij op: op de getallenlijn ga je naar rechts. Daalt de temperatuur, dan trek je eraf: je gaat naar links.',
        'Het verschil tussen twee temperaturen is de hoogste min de laagste. Je kunt ook tellen hoeveel stappen ertussen zitten op de getallenlijn.',
      ],
      ex: {
        q: T(
          'Op een ijsbaan is het ijs -6 graden. In de kleedkamer is het 19 graden. Hoeveel graden is het verschil?',
        ),
        steps: ['19 - -6 = 19 + 6 = 25', 'Het verschil is 25 graden.'],
      },
    },
    {
      t: 'Optellen en aftrekken',
      p: [
        'Optellen is op de getallenlijn naar rechts, aftrekken naar links. Je begint bij het eerste getal.',
        'Plus een negatief getal is hetzelfde als min: 7 + -12 = 7 - 12. Min een negatief getal is hetzelfde als plus: -3 - -8 = -3 + 8.',
      ],
      ex: {
        q: T('Bereken 7 + -12.'),
        steps: ['7 + -12 = 7 - 12 = -5'],
      },
      ex2: {
        q: T('Bereken -3 - -8.'),
        steps: ['-3 - -8 = -3 + 8 = 5'],
      },
      watch:
        'Trek je iets af van een negatief getal, dan ga je nog verder van 0 af: -6 - 4 = -10, en niet -2.',
    },
    {
      t: 'Drie getallen en haakjes',
      p: [
        'Staan er haakjes, dan reken je eerst uit wat ertussen staat. Daarna reken je van links naar rechts.',
        'Schrijf de berekening onder elkaar. Reken op elke regel één stap uit, en schrijf de rest opnieuw op.',
      ],
      ex: {
        q: T('Bereken -6 - (4 - 11).'),
        steps: ['-6 - (4 - 11) =', '-6 - -7 = -6 + 7 = 1'],
      },
      watch:
        'Staat er een min voor de haakjes, dan trek je de hele uitkomst van de haakjes af. -6 - (4 - 11) is dus niet hetzelfde als -6 - 4 - 11.',
    },
  ],
};
