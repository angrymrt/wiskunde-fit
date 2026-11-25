// Onderwerp: Breuken. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
// Alleen positieve breuken: negatieve breuken komen in een later onderwerp. Rekenen met breuken
// (optellen, vermenigvuldigen) staat in een eigen onderwerp.
import { ri, pick, coin, shuffle, gcd, lcm, Q, near, until } from '../math.js';
import { F } from './shared.js';
import { T } from '../typeset.js';
import { breukFig } from '../getalfiguren.js';

// Een breuk en een gemengd getal als tekst voor T, zonder te vereenvoudigen: {24/36} en {4 2/9}.
const b = (t, n) => `{${t}/${n}}`;
const g = (h, t, n) => `{${h} ${t}/${n}}`;
// Of je de teller en de noemer nog door hetzelfde getal kunt delen. Dit probeert elk getal vanaf 2,
// los van gcd, zodat de controle v anders rekent dan de generator.
const onvereenvoudigbaar = (t, n) => {
  for (let k = 2; k <= Math.min(t, n); k++) if (t % k === 0 && n % k === 0) return false;
  return true;
};
// Het veld voor een breuk als antwoord, met de vorm waarin de leerling hem moet schrijven.
const BF = (pre, q, vorm = 'vereenvoudigd') => ({ ...F(pre, q), vorm });

// --- 191 Welk deel is gekleurd? ---

// De vormen van de breukfiguur, met hoe de vraag ze noemt.
const FIGUREN = {
  cirkel: 'de cirkel',
  vierkant: 'het vierkant',
  rechthoek: 'de rechthoek',
  strook: 'de strook',
  rooster: 'het rooster',
};
// Kiest een figuur van deze vorm in n gelijke delen.
function kiesFiguur(kind) {
  if (kind === 'rooster') {
    const rows = ri(2, 4),
      cols = ri(3, 6);
    return { kind, rows, cols, n: rows * cols };
  }
  if (kind === 'cirkel') return { kind, n: pick([3, 4, 5, 6, 8, 9, 10, 12]) };
  if (kind === 'strook') return { kind, n: ri(5, 12) };
  return { kind, n: ri(3, 8), flat: coin() };
}
// Bij soort 'vereenvoudig' kun je de breuk vereenvoudigen; bij 'los' liggen de gekleurde delen door
// elkaar, en bij 'aaneen' naast elkaar.
function deelGekleurd() {
  const kind = pick(Object.keys(FIGUREN)),
    soort = pick(['aaneen', 'los', 'vereenvoudig']);
  const { fig: o, k } = until(
    () => {
      const fig = kiesFiguur(kind);
      // Bij een rooster kleur je soms hele rijen: dan zie je de vereenvoudigde breuk ook in de figuur.
      const rijen = kind === 'rooster' && soort === 'vereenvoudig' && coin();
      const k = rijen ? fig.cols * ri(1, fig.rows - 1) : ri(1, fig.n - 1);
      return { fig, k };
    },
    ({ fig, k }) => (soort === 'vereenvoudig' ? gcd(k, fig.n) > 1 : true),
  );
  const n = o.n,
    alle = [...Array(n).keys()];
  // Aaneen: een rij delen vanaf een begin (bij een cirkel ook over het begin heen). Anders door elkaar.
  let on;
  if (soort === 'los') on = shuffle(alle).slice(0, k);
  else {
    const s = kind === 'cirkel' ? ri(0, n - 1) : kind === 'rooster' ? 0 : ri(0, n - k);
    on = alle.slice(0, k).map((i) => (s + i) % n);
  }
  const fig = breukFig({ ...o, on });
  const d = gcd(k, n),
    antw = Q(k, n),
    naam = FIGUREN[kind],
    Naam = naam[0].toUpperCase() + naam.slice(1);
  const delen =
    kind === 'rooster'
      ? `Het rooster heeft ${o.rows} rijen van ${o.cols} hokjes. Dat zijn ${o.rows} * ${o.cols} = ${n} gelijke hokjes.`
      : `${Naam} is verdeeld in ${n} gelijke delen.`;
  const steps = [
    delen,
    `Daarvan ${k === 1 ? 'is' : 'zijn'} er ${k} gekleurd. Het gekleurde deel is ${b(k, n)}.`,
    d > 1
      ? `Teller en noemer door ${d} delen: ${b(k, n)} = ${b(antw.n, antw.d)}`
      : `${k} en ${n} kun je niet door hetzelfde getal delen, dus ${b(k, n)} is al zo ver mogelijk vereenvoudigd.`,
  ];
  if (d > 1) steps.push(`Het gekleurde deel is ${b(antw.n, antw.d)}.`);
  const traps = [
    {
      id: 'ongekleurde-deel',
      f: (v) => 2 * k !== n && near(v[0], (n - k) / n),
      m: 'Dat is het deel dat niet gekleurd is. Tel de delen die wel gekleurd zijn.',
    },
    {
      id: 'gedeeld-door-niet-gekleurd',
      f: (v) => near(v[0], k / (n - k)),
      m: 'De noemer is het aantal gelijke delen van de hele figuur, niet het aantal delen dat niet gekleurd is.',
    },
    {
      id: 'teller-en-noemer-omgedraaid',
      f: (v) => near(v[0], n / k),
      m: 'Je hebt de teller en de noemer omgedraaid. De teller staat boven de streep: het aantal gekleurde delen.',
    },
  ];
  return {
    q: T(`Welk deel van ${naam} is gekleurd? Vereenvoudig zo ver mogelijk.`),
    fig,
    fields: [BF('Gekleurd deel:', antw)],
    hint: T(
      'Tel in hoeveel gelijke delen de figuur is verdeeld: dat is de {{noemer|noemer}}. Tel hoeveel delen gekleurd zijn: dat is de {{teller|teller}}.',
    ),
    steps,
    traps,
    // Telt de gekleurde en alle delen in de figuur zelf, en vergelijkt kruislings.
    v: () => {
      const aan = (fig.match(/class="bd aan"/g) || []).length,
        totaal = (fig.match(/class="bd/g) || []).length;
      return aan * antw.d === antw.n * totaal && onvereenvoudigbaar(antw.n, antw.d);
    },
  };
}

// --- 192 Een breuk vereenvoudigen ---

// De kleinste noemer tot 1000 waarmee x een geheel getal wordt, door elke noemer vanaf 1 te proberen.
const kleinsteNoemer = (x) => {
  for (let d = 1; d <= 1000; d++) if (near(x * d, Math.round(x * d))) return d;
  return 0;
};
// De kleinste deler van x vanaf 2.
const kleinsteDeler = (x) => {
  for (let k = 2; k < x; k++) if (x % k === 0) return k;
  return x;
};
function vereenvoudigen() {
  const onecht = !coin() && !coin();
  const [p, q, f] = until(
    () => {
      const q = ri(2, 12);
      return [
        onecht ? ri(q + 1, 3 * q) : ri(1, q - 1),
        q,
        pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]),
      ];
    },
    ([p, q, f]) => gcd(p, q) === 1 && p * f <= 150 && q * f <= 150,
  );
  const t = p * f,
    n = q * f;
  // Is f geen priemgetal, dan deel je in twee stappen, zoals je het vaak ziet: eerst door een klein
  // getal, dan door de rest.
  const k = kleinsteDeler(f);
  const deel = (a, c, x) => `Teller en noemer door ${x} delen: ${b(a, c)} = ${b(a / x, c / x)}`;
  const steps = k < f ? [deel(t, n, k), deel(t / k, n / k, f / k)] : [deel(t, n, f)];
  steps.push(
    `${p} en ${q} kun je niet meer door hetzelfde getal delen, dus ${b(t, n)} = ${b(p, q)}.`,
  );
  if (onecht)
    steps.push(
      `Helen eruit halen mag ook, maar hoeft niet: ${b(p, q)} = ${g(Math.floor(p / q), p % q, q)}.`,
    );
  // Teller en noemer door verschillende getallen gedeeld: elk paar delers van allebei, of een van
  // de twee niet gedeeld.
  const delers = [1, ...Array.from({ length: f - 1 }, (_, i) => i + 2).filter((x) => f % x === 0)];
  const verschillend = delers.flatMap((x) =>
    delers.filter((y) => y !== x).map((y) => t / x / (n / y)),
  );
  const fields = [BF(`${b(t, n)} =`, Q(t, n))];
  return {
    q: T(`Vereenvoudig ${b(t, n)} zo ver mogelijk.`),
    fields,
    hint: T(
      'Zoek een getal waardoor je de {{teller|teller}} en de {{noemer|noemer}} allebei kunt delen. Ga door tot dat niet meer kan.',
    ),
    steps,
    traps: [
      {
        id: 'door-verschillende-getallen-gedeeld',
        f: (v) => verschillend.some((x) => near(v[0], x)),
        m: 'Deel de teller en de noemer door hetzelfde getal. Deel je ze door verschillende getallen, dan verandert de breuk.',
      },
    ],
    // Kijkt het antwoord in het veld na: kruislings vermenigvuldigen met de vraagbreuk geeft
    // hetzelfde, en geen getal deelt nog de teller en de noemer van het antwoord.
    v: () => {
      const a = fields[0].a,
        d = kleinsteNoemer(a),
        z = Math.round(a * d);
      return d > 1 && z * n === d * t && onvereenvoudigbaar(z, d);
    },
  };
}

// --- 193 Helen eruit halen en binnen de breuk brengen ---

function helen() {
  const eruit = coin();
  const [h, r, n] = until(
    () => {
      const n = ri(2, 12);
      return [ri(1, 9), ri(1, n - 1), n];
    },
    ([h, r, n]) => gcd(r, n) === 1 && h !== r && h * n + r <= 120,
  );
  const t = h * n + r,
    antw = Q(t, n);
  // De controle telt op een andere manier: haalt de noemer steeds van de teller af, of telt hem
  // steeds bij de teller op.
  const v = () => {
    const af = (rest, keer) => (rest >= n ? af(rest - n, keer + 1) : [rest, keer]);
    const [rest, keer] = af(t, 0);
    const terug = Array.from({ length: h }).reduce((s) => s + n, r);
    return keer === h && rest === r && terug === t && near(antw.n / antw.d, h + r / n);
  };
  if (eruit)
    return {
      q: T(`Haal de helen uit ${b(t, n)}.`),
      fields: [BF(`${b(t, n)} =`, antw, 'gemengd')],
      hint: T(
        'Kijk hoe vaak de {{noemer|noemer}} in de {{teller|teller}} past. Dat zijn de helen. Wat overblijft, is de nieuwe teller.',
      ),
      steps: [
        `${n} past ${h} keer in ${t}, want ${h} * ${n} = ${h * n}.`,
        `Er blijft ${t} - ${h * n} = ${r} over. Dat is de nieuwe teller.`,
        `${b(t, n)} = ${g(h, r, n)}`,
        `Controle: ${h} * ${n} + ${r} = ${t}`,
      ],
      traps: [
        {
          id: 'helen-en-rest-verwisseld',
          f: (x) => near(x[0], r + h / n),
          m: 'Je hebt de helen en de teller verwisseld. Hoe vaak de noemer in de teller past, zijn de helen. Wat overblijft, is de teller.',
        },
        {
          id: 'rest-vergeten',
          f: (x) => near(x[0], h),
          m: 'Je hebt alleen de helen opgeschreven. Wat overblijft, komt als breuk achter de helen.',
        },
      ],
      v,
    };
  const een =
    h === 1
      ? `Eén heel is ${b(n, n)}.`
      : `Eén heel is ${b(n, n)}, dus ${h} helen zijn ${b(h * n, n)}, want ${h} * ${n} = ${h * n}.`;
  return {
    q: T(`Breng de helen binnen de breuk: ${g(h, r, n)}.`),
    fields: [BF(`${g(h, r, n)} =`, antw, 'onecht')],
    hint: T('De nieuwe teller is heel * noemer + teller. De noemer blijft hetzelfde.'),
    steps: [een, `${b(h * n, n)} + ${b(r, n)} = ${b(t, n)}`, `Dus ${g(h, r, n)} = ${b(t, n)}.`],
    traps: [
      {
        id: 'teller-niet-opgeteld',
        f: (x) => near(x[0], h),
        m: 'Je hebt alleen de helen binnen de breuk gebracht. Tel de teller er nog bij op: heel · noemer + teller.',
      },
      {
        id: 'helen-en-teller-verwisseld',
        f: (x) => near(x[0], (r * n + h) / n),
        m: 'Je hebt de helen en de teller verwisseld. Vermenigvuldig de helen met de noemer, en tel daar de teller bij op.',
      },
      {
        id: 'helen-bij-teller-opgeteld',
        f: (x) => near(x[0], (h + r) / n),
        m: 'Eén heel is niet één deel, maar zoveel delen als de noemer zegt. Vermenigvuldig de helen dus eerst met de noemer.',
      },
    ],
    v,
  };
}

// --- 194 Welke breuk is groter? ---

// Een kant van de vergelijking: een breuk t/n, of met helen h een gemengd getal.
const tekstVan = ({ h, t, n }) => (h ? g(h, t, n) : b(t, n));
const zegVan = ({ h, t, n }) => (h ? `${h} ${t}/${n}` : `${t}/${n}`);
const teken = (x, y) => (x < y ? '<' : x > y ? '>' : '=');
// Een echte breuk die al vereenvoudigd is, met een noemer van 2 tot en met 12.
const echteBreuk = () =>
  until(
    () => {
      const n = ri(2, 12);
      return { h: 0, t: ri(1, n - 1), n };
    },
    ({ t, n }) => gcd(t, n) === 1,
  );
// De twee kanten per soort vergelijking. Bij 'gelijk' zijn ze even groot, in een andere vorm.
const PAREN = {
  noemer: () => {
    const n = ri(3, 12);
    const [t1, t2] = until(
      () => [ri(1, n - 1), ri(1, n - 1)],
      ([x, y]) => x !== y,
    );
    return [
      { h: 0, t: t1, n },
      { h: 0, t: t2, n },
    ];
  },
  stam: () => {
    const [n1, n2] = until(
      () => [ri(2, 12), ri(2, 12)],
      ([x, y]) => x !== y,
    );
    return [
      { h: 0, t: 1, n: n1 },
      { h: 0, t: 1, n: n2 },
    ];
  },
  teller: () => {
    const t = ri(2, 9);
    const [n1, n2] = until(
      () => [ri(2, 12), ri(2, 12)],
      ([x, y]) => x !== y && t % x !== 0 && t % y !== 0,
    );
    return [
      { h: 0, t, n: n1 },
      { h: 0, t, n: n2 },
    ];
  },
  anders: () =>
    until(
      () => [echteBreuk(), echteBreuk()],
      ([x, y]) => x.n !== y.n && x.t !== y.t && x.t * y.n !== y.t * x.n && lcm(x.n, y.n) <= 60,
    ),
  gelijk: () => {
    const x = until(
      () => {
        const n = ri(2, 6);
        return { h: 0, t: ri(1, 2 * n - 1), n };
      },
      ({ t, n }) => gcd(t, n) === 1 && t !== n,
    );
    // Groter gemaakt met een factor, of als gemengd getal.
    const y =
      x.t > x.n && coin()
        ? { h: Math.floor(x.t / x.n), t: x.t % x.n, n: x.n }
        : ((f) => ({ h: 0, t: x.t * f, n: x.n * f }))(ri(2, 5));
    return [x, y];
  },
  gemengd: () => {
    const x = until(
      () => {
        const n = ri(2, 9);
        return { h: 0, t: ri(n + 1, 4 * n), n };
      },
      ({ t, n }) => gcd(t, n) === 1,
    );
    // Een gemengd getal met dezelfde helen of één meer of minder, met een andere breuk.
    const y = until(
      () => ({ ...echteBreuk(), h: Math.floor(x.t / x.n) + pick([-1, 0, 0, 1]) }),
      (y) =>
        y.h >= 1 && y.n !== x.n && y.h * y.n * x.n + y.t * x.n !== x.t * y.n && lcm(x.n, y.n) <= 60,
    );
    return [y, x];
  },
};
function vergelijken() {
  const soort = pick(Object.keys(PAREN));
  const [L, R] = coin() ? PAREN[soort]() : PAREN[soort]().reverse();
  const a = teken((L.h * L.n + L.t) * R.n, (R.h * R.n + R.t) * L.n);
  // De uitwerking: eerst de helen binnen de breuk, dan vergelijken.
  const steps = [];
  const [x, y] = [L, R].map((k) => {
    if (!k.h) return { t: k.t, n: k.n };
    steps.push(`Breng de helen binnen de breuk: ${g(k.h, k.t, k.n)} = ${b(k.h * k.n + k.t, k.n)}`);
    return { t: k.h * k.n + k.t, n: k.n };
  });
  if (x.n === y.n)
    steps.push(`De noemers zijn gelijk, dus kijk je naar de tellers: ${x.t} ${a} ${y.t}.`);
  else if (x.t === y.t)
    steps.push(
      'De tellers zijn gelijk. Bij de kleinste noemer is elk deel het grootst, want je verdeelt in minder stukken.',
      `De kleinste noemer is ${Math.min(x.n, y.n)}, dus ${x.n < y.n ? b(x.t, x.n) : b(y.t, y.n)} is het grootst.`,
    );
  else {
    const m = lcm(x.n, y.n),
      om = (k) =>
        k.n === m
          ? `${b(k.t, k.n)} heeft al noemer ${m}`
          : `${b(k.t, k.n)} = ${b((k.t * m) / k.n, m)}`;
    steps.push(
      `Maak de breuken {{gelijknamig|gelijknamig}}. ${m} staat in de tafel van ${x.n} en van ${y.n}.`,
      `${om(x)} en ${om(y)}`,
      `${(x.t * m) / x.n} ${a} ${(y.t * m) / y.n}`,
    );
  }
  steps.push(`Dus ${tekstVan(L)} ${a} ${tekstVan(R)}.`);
  const traps = [];
  // Wie alleen de tellers vergelijkt, zet het teken van de tellers. Wie denkt dat een grotere noemer
  // een grotere breuk geeft, zet het teken van de noemers. Is het teken van de tellers fout, dan is
  // dat van de noemers hetzelfde: met een grotere teller en een kleinere noemer is de breuk altijd
  // groter. Daarom noemt die melding allebei de fouten.
  const viaNoemer = teken(L.n, R.n),
    viaTeller = teken(L.t, R.t);
  if (!L.h && !R.h && L.n !== R.n && L.t !== R.t && viaTeller !== a)
    traps.push({
      id: 'alleen-tellers-vergeleken',
      f: (v) => v[0] === viaTeller,
      m: 'De noemers zijn niet gelijk, dus je kunt de tellers niet zomaar vergelijken. En een grotere noemer betekent geen grotere breuk: elk stuk is dan juist kleiner. Maak de breuken eerst gelijknamig.',
    });
  else if (!L.h && !R.h && L.n !== R.n && viaNoemer !== a)
    traps.push({
      id: 'grotere-noemer-grotere-breuk',
      f: (v) => v[0] === viaNoemer,
      m: 'Een grotere noemer betekent geen grotere breuk. Bij een grotere noemer verdeel je in meer stukken, dus is elk stuk juist kleiner.',
    });
  const hint = {
    noemer: 'De noemers zijn gelijk. Vergelijk de tellers.',
    stam: 'De tellers zijn gelijk. Bedenk: hoe meer stukken, hoe kleiner elk stuk.',
    teller: 'De tellers zijn gelijk. Bedenk: hoe meer stukken, hoe kleiner elk stuk.',
    anders: 'Maak de breuken {{gelijknamig|gelijknamig}}. Vergelijk daarna de tellers.',
    gelijk: 'Vereenvoudig de breuken, of maak ze {{gelijknamig|gelijknamig}}.',
    gemengd: 'Breng eerst de helen binnen de breuk.',
  }[L.h || R.h ? 'gemengd' : soort];
  return {
    q: T(`Welke breuk is groter: ${tekstVan(L)} of ${tekstVan(R)}? Kies <, > of =.`),
    fields: [
      {
        sel: ['<', '>', '='],
        a,
        pre: tekstVan(L),
        post: tekstVan(R),
        label: `Teken tussen ${zegVan(L)} en ${zegVan(R)}`,
      },
    ],
    hint: T(hint),
    steps,
    traps,
    // Rekent beide kanten uit als kommagetal en vergelijkt die.
    v: () => {
      const wl = L.h + L.t / L.n,
        wr = R.h + R.t / R.n;
      return a === (near(wl, wr) ? '=' : wl < wr ? '<' : '>');
    },
  };
}

const figbox = (svg) => `<div class="figbox">${svg}</div>`;

export default {
  slug: 'breuken',
  title: 'Breuken',
  intro:
    'Een breuk is een deel van een geheel, zoals drie van de vijf gelijke stukken. Hier lees je af welk deel van een figuur gekleurd is, vereenvoudig je breuken, haal je de helen eruit of breng je ze binnen de breuk, en zoek je uit welke breuk groter is.',
  description:
    'Breuken oefenen: teller en noemer, vereenvoudigen, gemengde getallen, helen eruit halen en breuken vergelijken. Gratis met uitleg, hints en uitwerkingen.',
  videos: {},
  skills: [
    [191, 'Welk deel is gekleurd?', deelGekleurd],
    [192, 'Een breuk vereenvoudigen', vereenvoudigen],
    [193, 'Helen eruit halen en binnen de breuk brengen', helen],
    [194, 'Welke breuk is groter?', vergelijken],
  ],
  learn: [
    {
      t: 'Teller en noemer',
      p: [
        'Een breuk zoals {3/5} bestaat uit twee getallen. De {{=noemer|noemer}} onder de streep zegt in hoeveel gelijke delen het geheel is verdeeld. De {{=teller|teller}} boven de streep zegt hoeveel van die delen je neemt.',
        'De delen moeten even groot zijn. Ze hoeven niet naast elkaar te liggen.',
      ],
      ex: {
        q:
          T('Welk deel van de strook is gekleurd?') +
          figbox(breukFig({ kind: 'strook', n: 7, on: [0, 3, 4], count: true })),
        steps: [
          'De strook is verdeeld in 7 gelijke delen.',
          'Daarvan zijn er 3 gekleurd.',
          'Het gekleurde deel is {3/7}.',
        ],
      },
    },
    {
      t: 'Vereenvoudigen',
      p: [
        'Je {{=vereenvoudigen|vereenvoudigt}} een breuk door de teller en de noemer door hetzelfde getal te delen. De breuk blijft even groot, maar de getallen worden kleiner.',
        'Dat mag in één keer of in stappen. Vereenvoudig een uitkomst altijd zo ver mogelijk: tot je de teller en de noemer niet meer door hetzelfde getal kunt delen.',
      ],
      ex: {
        q: T('Vereenvoudig {28/42} zo ver mogelijk.'),
        steps: [
          'Teller en noemer door 2 delen: {28/42} = {14/21}',
          'Teller en noemer door 7 delen: {14/21} = {2/3}',
          '2 en 3 kun je niet meer door hetzelfde getal delen, dus {28/42} = {2/3}.',
        ],
      },
      watch:
        'Deel de teller en de noemer altijd door hetzelfde getal. Deel je ze door verschillende getallen, dan krijg je een andere breuk.',
    },
    {
      t: 'Helen eruit halen en binnen de breuk brengen',
      p: [
        'Is de teller groter dan de noemer, dan zitten er helen in de breuk. Die kun je eruit halen. Je krijgt dan een {{=gemengd-getal|gemengd getal}}, zoals {4 2/9}. Dat betekent 4 + {2/9}.',
        'Kijk hoe vaak de noemer in de teller past. Dat zijn de helen. Wat overblijft, is de nieuwe teller. De noemer blijft hetzelfde.',
        'Omgekeerd kun je de helen binnen de breuk brengen. De nieuwe teller is dan heel * noemer + teller.',
      ],
      ex: {
        q: T('Haal de helen uit {19/6}.'),
        steps: [
          '6 past 3 keer in 19, want 3 * 6 = 18.',
          'Er blijft 19 - 18 = 1 over. Dat is de nieuwe teller.',
          '{19/6} = {3 1/6}',
          'Controle: 3 * 6 + 1 = 19',
        ],
      },
      ex2: {
        q: T('Breng de helen binnen de breuk: {2 5/7}.'),
        steps: [
          'Eén heel is {7/7}, dus 2 helen zijn {14/7}, want 2 * 7 = 14.',
          '{14/7} + {5/7} = {19/7}',
          'Dus {2 5/7} = {19/7}.',
        ],
      },
      watch:
        'Vergeet bij het binnen brengen de teller niet: bij {2 5/7} is de nieuwe teller 2 * 7 + 5 = 19, en niet 2 * 7 = 14.',
    },
    {
      t: 'Breuken vergelijken',
      p: [
        'Met < bedoel je kleiner dan, met > groter dan.',
        'Zijn de noemers gelijk, dan is de breuk met de grootste teller het grootst.',
        'Zijn de tellers gelijk, dan is de breuk met de kleinste noemer het grootst. Bij een kleinere noemer verdeel je in minder stukken, dus is elk stuk groter.',
        'Zijn de tellers en de noemers verschillend, maak de breuken dan {{=gelijknamig|gelijknamig}}: geef ze dezelfde noemer. Kies als noemer een getal dat in de tafels van beide noemers staat.',
      ],
      ex: {
        q: T('Welke breuk is groter: {4/9} of {5/12}?'),
        steps: [
          '36 staat in de tafel van 9 en van 12.',
          '{4/9} = {16/36} en {5/12} = {15/36}',
          '16 > 15, dus {4/9} > {5/12}',
        ],
      },
      watch: 'Een grotere noemer betekent geen grotere breuk: {1/8} is kleiner dan {1/5}.',
    },
  ],
};
