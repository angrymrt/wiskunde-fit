// Onderwerp: Rekenen met procenten. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, pick, coin, near, rd, isNice, d } from '../math.js';
import { F, RF, H, needRound, euro, group } from './shared.js';
import { T, schema } from '../typeset.js';

const g = (x) => group(d(x));
// Geld: op centen, of zonder komma als het een heel bedrag is.
const eu = (x) => group(euro(rd(x, 2)));
// Een getal met een niet-afgeronde staart, zoals 22 191,01... in het boek.
const dots = (x, k = 2) =>
  isNice(x, k) ? g(x) : `${group(d(Math.trunc(x * 10 ** k) / 10 ** k))}...`;
// Een melding na een valkuil is gewone tekst, dus met een echt minteken.
const mn = (x) => g(x).replace('-', '−');
// Hoe nauwkeurig een antwoord is: tol is hoeveel een fout getal mag schelen als de leerling het zelf
// afrondt, allow hoeveel het goede antwoord na afronden scheelt.
const EUR = [0.005, 0];
const WHOLE = [0.5, 0];
const tolFor = (round) => (round == null ? WHOLE : [0.5 * 10 ** -round, 0.5 * 10 ** -round]);

// Een valkuil voor veld i: de leerling vult een getal uit ws in dat je met een bekende fout krijgt,
// ook als hij dat zelf afrondt (tol). Een fout getal dat te dicht bij het goede antwoord ligt, telt
// niet mee.
function miss(id, i, ws, right, tol, allow, m) {
  const wrong = ws.filter((w) => Number.isFinite(w) && Math.abs(w - right) > tol + allow + 1e-9);
  return wrong.length
    ? {
        id,
        f: (v) => Number.isFinite(v[i]) && wrong.some((w) => Math.abs(v[i] - w) <= tol + 1e-9),
        m,
      }
    : null;
}
// Een valkuil bij grote getallen, met een marge in procenten (r): een leerling rondt een fout
// getal vaak grof af. Alleen fouten die minstens een factor 2 schelen, zoals een verschoven komma.
function far(id, i, ws, right, r, m) {
  const wrong = ws.filter((w) => Number.isFinite(w) && w && (w / right > 2 || w / right < 0.5));
  return wrong.length
    ? {
        id,
        f: (v) => Number.isFinite(v[i]) && wrong.some((w) => Math.abs(v[i] - w) <= r * Math.abs(w)),
        m,
      }
    : null;
}
// Eén valkuil voor dezelfde fout in meer velden. De id is uniek binnen een vraag.
function either(id, m, ...traps) {
  const ts = traps.filter(Boolean);
  return ts.length ? { id, f: (v) => ts.some((t) => t.f(v)), m } : null;
}

// De vermenigvuldigingsfactor bij een verandering van p% omhoog (up) of omlaag.
const fac = (p, up) => rd((100 + (up ? p : -p)) / 100, 6);
const factorStep = (p, up, what = '') =>
  `${d(p)}%${what} ${up ? 'erbij' : 'eraf'} geeft 100% ${up ? '+' : '-'} ${d(p)}% = ${d(fac(p, up) * 100)}%, dus × ${d(fac(p, up))}`;

// ---------- 111 Rekenen met grote getallen ----------

// Eigen verhalen met een procent van een groot getal. unit is miljard of miljoen. Bij miljard kan
// de vraag het antwoord in miljoen willen, bij miljoen het hele aantal.
const BIG_SHARE = [
  {
    p: [4.5, 6.4, 7.5, 8.2, 12.5, 14.6],
    t: () => ri(150, 480),
    unit: 'miljard',
    q: (t, p) =>
      `De overheid van een land geeft in een jaar ${g(t)} miljard euro uit. Daarvan gaat ${d(p)}% naar onderwijs.`,
    ask: (u) => `Hoeveel ${u} euro gaat er naar onderwijs?`,
    pre: 'Naar onderwijs gaat',
    post: (u) => `${u} euro`,
  },
  {
    p: [2.8, 4.5, 6.4, 7.5, 8.2, 12.5],
    t: () => ri(12, 95),
    unit: 'miljard',
    q: (t, p) =>
      `Een groot bedrijf had in een jaar een omzet van ${g(t)} miljard euro. De winst was ${d(p)}% van de omzet.`,
    ask: (u) => `Hoeveel ${u} euro was de winst?`,
    pre: 'De winst was',
    post: (u) => `${u} euro`,
  },
  {
    p: [12.5, 14.6, 18.5, 21.4, 23],
    t: () => ri(60, 600) / 10,
    unit: 'miljoen',
    q: (t, p) =>
      `Een land heeft ${d(t)} miljoen inwoners. Van de inwoners is ${d(p)}% ouder dan 65 jaar.`,
    ask: (u) =>
      u ? `Hoeveel miljoen inwoners zijn ouder dan 65 jaar?` : 'Hoeveel inwoners zijn dat?',
    pre: 'Dat zijn',
    post: (u) => (u ? 'miljoen inwoners' : 'inwoners'),
  },
  {
    p: [18.5, 21.4, 23, 35, 42.5],
    t: () => ri(200, 900) / 10,
    unit: 'miljoen',
    q: (t, p) =>
      `Een app heeft ${d(t)} miljoen gebruikers. Van de gebruikers opent ${d(p)}% de app elke dag.`,
    ask: (u) =>
      u ? 'Hoeveel miljoen gebruikers openen de app elke dag?' : 'Hoeveel gebruikers zijn dat?',
    pre: 'Dat zijn',
    post: (u) => (u ? 'miljoen gebruikers' : 'gebruikers'),
  },
];
// Een procent van een groot getal: 6,4% van 314 miljard is 0,064 · 314 miljard.
function bigShare() {
  const c = pick(BIG_SHARE),
    t = c.t(),
    p = pick(c.p),
    big = rd((p * t) / 100, 6),
    // Bij miljard soms in miljoen, bij miljoen soms het hele aantal.
    alt = coin(),
    k = alt ? (c.unit === 'miljard' ? 1000 : 1e6) : 1,
    ans = rd(big * k, 6),
    u = alt ? (c.unit === 'miljard' ? 'miljoen' : '') : c.unit;
  const conv = !alt
    ? []
    : c.unit === 'miljard'
      ? [`1 miljard = 1000 miljoen, dus ${g(big)} miljard = ${g(ans)} miljoen`]
      : [`1 miljoen = 1${' '}000${' '}000, dus ${g(big)} miljoen = ${g(ans)}`];
  return {
    q: T(`${c.q(t, p)} ${c.ask(u)}`),
    fields: [F(c.pre, ans, c.post(u))],
    hint: alt
      ? `Schrijf het procent als kommagetal en vermenigvuldig. Zet het antwoord daarna om: ${c.unit === 'miljard' ? '1 miljard = 1000 miljoen' : '1 miljoen = 1 000 000'}.`
      : `Schrijf het procent als kommagetal en vermenigvuldig. Het woord ${c.unit} blijft erachter staan.`,
    steps: [
      `${d(p)}% van ${g(t)} ${c.unit} is ${d(p / 100)}*${g(t)} ${c.unit} = ${g(big)} ${c.unit}`,
      ...conv,
    ],
    traps: [
      far(
        'komma-verschoven',
        0,
        [10, 0.1, 100, 0.01].map((m) => ans * m),
        ans,
        0.005,
        `Let op de komma. ${mn(p)}% is ${mn(p / 100)} als kommagetal, want je deelt het procent door 100.`,
      ),
      alt &&
        far(
          'eenheid-vergeten',
          0,
          [big],
          ans,
          0.01,
          c.unit === 'miljard'
            ? 'Dit is het aantal miljard. Er wordt gevraagd hoeveel miljoen: 1 miljard = 1000 miljoen.'
            : 'Dit is het aantal miljoen. Er wordt gevraagd om het hele aantal: 1 miljoen = 1 000 000.',
        ),
    ].filter(Boolean),
    v: () => near((ans / k / t) * 100, p, 1e-6),
  };
}

// Eigen verhalen met een totaal in miljard en een aantal in miljoen. per is het bereik van het
// gemiddelde.
const PER = [
  {
    per: [15000, 45000],
    q: (T_, N) =>
      `Alle inwoners van een land verdienden in een jaar samen ${g(T_)} miljard euro. Het land heeft ${d(N)} miljoen inwoners. Hoeveel euro verdiende een inwoner gemiddeld?`,
    pre: 'Gemiddeld',
    post: 'euro per inwoner',
    say: (x) => `Een inwoner verdiende gemiddeld ongeveer ${x} euro.`,
  },
  {
    per: [9000, 25000],
    q: (T_, N) =>
      `De overheid van een land gaf in een jaar ${g(T_)} miljard euro uit. Het land heeft ${d(N)} miljoen inwoners. Hoeveel euro is dat gemiddeld per inwoner?`,
    pre: 'Gemiddeld',
    post: 'euro per inwoner',
    say: (x) => `Dat is gemiddeld ongeveer ${x} euro per inwoner.`,
  },
  {
    per: [25000, 48000],
    q: (T_, N) =>
      `Alle huishoudens in een land gaven in een jaar samen ${g(T_)} miljard euro uit. Er zijn ${d(N)} miljoen huishoudens. Hoeveel euro gaf een huishouden gemiddeld uit?`,
    pre: 'Gemiddeld',
    post: 'euro per huishouden',
    say: (x) => `Een huishouden gaf gemiddeld ongeveer ${x} euro uit.`,
  },
  {
    per: [10000, 16000],
    q: (T_, N) =>
      `In een land reden alle auto's in een jaar samen ${g(T_)} miljard kilometer. Er zijn ${d(N)} miljoen auto's. Hoeveel kilometer reed een auto gemiddeld?`,
    pre: 'Gemiddeld',
    post: 'kilometer per auto',
    say: (x) => `Een auto reed gemiddeld ongeveer ${x} kilometer.`,
  },
];
// Een gemiddelde per persoon: miljard gedeeld door miljoen, met eerst dezelfde eenheid.
function perPerson() {
  const c = pick(PER);
  let N, tot, ans;
  for (;;) {
    N = ri(40, 850) / 10;
    tot = Math.round((ri(c.per[0], c.per[1]) * N) / 1000);
    ans = (tot * 1000) / N;
    if (
      tot >= 20 &&
      ans >= c.per[0] &&
      ans <= c.per[1] &&
      !isNice(ans, -3) &&
      !near(ans % 1000, 500, 1e-6)
    )
      break;
  }
  const fields = [RF(c.pre, ans, -3, c.post)],
    r = g(rd(ans, -3));
  return {
    q: T(`${c.q(tot, N)}${needRound(fields)}`),
    fields,
    hint: 'Maak eerst de eenheden gelijk: 1 miljard = 1000 miljoen. Deel dan het totaal door het aantal.',
    steps: [
      `Eerst dezelfde eenheid: 1 miljard = 1000 miljoen, dus ${g(tot)} miljard = ${g(tot * 1000)} miljoen`,
      `{${g(tot * 1000)} miljoen/${d(N)} miljoen} = ${dots(ans)} ≈ ${r}`,
      c.say(r),
    ],
    traps: [
      far(
        'eenheden-niet-gelijk',
        0,
        [tot / N, (tot * 100) / N, (tot * 1e6) / N],
        ans,
        0.06,
        'Maak eerst de eenheden gelijk. Schrijf de miljarden als miljoenen: 1 miljard = 1000 miljoen. Deel daarna miljoen door miljoen.',
      ),
      far(
        'deling-omgedraaid',
        0,
        [N / tot, N / (tot * 1000)],
        ans,
        0.15,
        'Je hebt het aantal door het totaal gedeeld. Voor een gemiddelde deel je het totaal door het aantal.',
      ),
    ].filter(Boolean),
    // Reken terug: het afgeronde gemiddelde keer het aantal geeft ongeveer het totaal.
    v: () => Math.abs((rd(ans, -3) * N) / 1000 - tot) <= 0.5 * N + 1e-9,
  };
}

// Eigen verhalen met een groot getal om af te ronden: op duizendtallen (−3) of miljoenen (−6).
const ROUNDS = [
  {
    n: -3,
    x: () => ri(100000, 999999),
    q: (x) => `Een stad heeft ${g(x)} inwoners.`,
    unit: 'inwoners',
  },
  {
    n: -3,
    x: () => ri(30000, 999999),
    q: (x) => `Een pretpark had vorig jaar ${g(x)} bezoekers.`,
    unit: 'bezoekers',
  },
  {
    n: -3,
    x: () => ri(15000, 95000),
    q: (x) => `Een voetbalclub verkocht in een seizoen ${g(x)} seizoenkaarten.`,
    unit: 'seizoenkaarten',
  },
  {
    n: -6,
    x: () => ri(10000000, 99999999),
    q: (x) => `Een bedrijf had vorig jaar een omzet van ${g(x)} euro.`,
    unit: 'euro',
  },
  {
    n: -6,
    x: () => ri(12000000, 400000000),
    q: (x) => `Een gemeente geeft in een jaar ${g(x)} euro uit.`,
    unit: 'euro',
  },
];
const PLACE = { '-3': ['duizendtallen', 'duizend', 1000], '-6': ['miljoenen', 'miljoen', 1e6] };
// Een groot getal afronden op duizendtallen of miljoenen: 37 333 wordt 37 000.
function roundBig() {
  const c = pick(ROUNDS);
  let x;
  do x = c.x();
  while (isNice(x, c.n) || rd(x, c.n) === rd(x, c.n - 1));
  const [word, one, k] = PLACE[c.n],
    r = rd(x, c.n),
    next = Math.floor((x % k) / (k / 10)),
    fields = [RF('Afgerond:', x, c.n, c.unit)],
    coarse = [];
  for (let m = c.n - 1; m >= c.n - 2 && 10 ** -m <= x; m--) coarse.push(rd(x, m));
  return {
    q: T(`${c.q(x)} Rond dit getal af op ${word}.`),
    fields,
    hint: 'Kijk naar het eerste cijfer dat wegvalt. Is dat 5 of meer, dan rond je naar boven af. De cijfers die wegvallen, worden 0.',
    steps: [
      `Het eerste cijfer dat wegvalt is een ${next}, dus je rondt naar ${next >= 5 ? 'boven' : 'beneden'} af.`,
      `${g(x)} ≈ ${g(r)}, oftewel ${g(r / k)} ${one}.`,
    ],
    traps: [
      miss(
        'nullen-vergeten',
        0,
        [r / k],
        x,
        0,
        0,
        `Je hebt het aantal ${word} gegeven, dus ${g(r / k)} ${one}. Schrijf het hele getal, met de nullen erachter.`,
      ),
      miss(
        'te-grof-afgerond',
        0,
        coarse,
        x,
        0,
        k / 2,
        `Je hebt te grof afgerond. Op ${word} houd je de cijfers tot en met de ${word} en maak je de rest 0.`,
      ),
    ].filter(Boolean),
    v: () => Math.abs(r - x) <= k / 2 && r % k === 0,
  };
}
function s42big() {
  const k = ri(0, 9);
  return k < 4 ? bigShare() : k < 8 ? perPerson() : roundBig();
}

// ---------- 112 Oud berekenen ----------

// Eigen spullen met een prijs: [naam, kort, laagste prijs, hoogste prijs].
const GOODS = [
  ['Een skateboard', 'het skateboard', 40, 120],
  ['Een bureaustoel', 'de bureaustoel', 80, 250],
  ['Een rugzak', 'de rugzak', 25, 90],
  ['Een gitaar', 'de gitaar', 120, 480],
  ['Een smartwatch', 'de smartwatch', 90, 320],
  ['Een boekenkast', 'de boekenkast', 60, 260],
];
const lower = (s) => s[0].toLowerCase() + s.slice(1);
const UPS = [4, 5, 6, 8, 12, 15, 20, 25, 2.5, 7.5, 12.5];
const DOWNS = [10, 15, 20, 25, 30, 35, 40, 12.5];
// Een prijs vóór de verandering, zo dat de nieuwe prijs precies op centen uitkomt.
function priceFor(lo, hi, f) {
  for (;;) {
    const o = rd(ri(lo, hi) + pick([0, 0, 0.5, 0.95, 0.99]), 2);
    if (isNice(o * f, 2)) return o;
  }
}
// Een aantal vóór de verandering, zo dat het nieuwe aantal een geheel getal is.
function countFor(lo, hi, f) {
  for (;;) {
    const o = ri(lo, hi);
    if (isNice(o * f, 0)) return o;
  }
}

// Eigen verhalen met een aantal dat is veranderd. r is het bereik van oud.
const COUNT_OLD = [
  {
    up: true,
    r: [1200, 6000],
    q: (n, p) =>
      `Een zwembad had in juli ${g(n)} bezoekers. Dat is ${d(p)}% meer dan in juni. Hoeveel bezoekers had het zwembad in juni?`,
    pre: 'In juni',
    unit: 'bezoekers',
    say: (o) => `In juni had het zwembad ${g(o)} bezoekers.`,
  },
  {
    up: true,
    r: [800, 4000],
    q: (n, p) =>
      `Een webwinkel verstuurde in december ${g(n)} pakketten. Dat is ${d(p)}% meer dan in november. Hoeveel pakketten verstuurde de webwinkel in november?`,
    pre: 'In november',
    unit: 'pakketten',
    say: (o) => `In november verstuurde de webwinkel ${g(o)} pakketten.`,
  },
  {
    up: false,
    r: [40, 120],
    q: (n, p) =>
      `Het aantal leden van een koor is met ${d(p)}% gedaald. Het koor heeft nu ${n} leden. Hoeveel leden had het koor eerst?`,
    pre: 'Eerst',
    unit: 'leden',
    say: (o) => `Eerst had het koor ${o} leden.`,
  },
  {
    up: false,
    r: [200, 900],
    q: (n, p) =>
      `Een bakker verkocht deze week ${n} broden. Dat is ${d(p)}% minder dan vorige week. Hoeveel broden verkocht de bakker vorige week?`,
    pre: 'Vorige week',
    unit: 'broden',
    say: (o) => `Vorige week verkocht de bakker ${o} broden.`,
  },
];
// Eigen verhalen met een groot aantal dat al is afgerond. Het antwoord rond je net zo af.
const COUNT_OLD_BIG = [
  {
    up: true,
    q: (n, p) =>
      `Een stad heeft nu ongeveer ${g(n)} inwoners. Dat is ${d(p)}% meer dan tien jaar geleden. Hoeveel inwoners had de stad tien jaar geleden?`,
    pre: 'Tien jaar geleden',
    unit: 'inwoners',
    say: (o) => `Tien jaar geleden had de stad ongeveer ${o} inwoners.`,
  },
  {
    up: false,
    q: (n, p) =>
      `Een krant heeft nu ongeveer ${g(n)} abonnees. Dat is ${d(p)}% minder dan vijf jaar geleden. Hoeveel abonnees had de krant vijf jaar geleden?`,
    pre: 'Vijf jaar geleden',
    unit: 'abonnees',
    say: (o) => `Vijf jaar geleden had de krant ongeveer ${o} abonnees.`,
  },
];

// Een verandering terugrekenen: alles wat een vraag naar oud nodig heeft.
function makeBack() {
  const k = ri(0, 9);
  if (k < 5) {
    const [name, short, lo, hi] = pick(GOODS),
      kind = pick(['up', 'down', 'btw']);
    if (kind === 'btw') {
      const p = coin() ? 21 : 9,
        f = fac(p, true),
        food = p === 9,
        o = food ? priceFor(15, 90, f) : priceFor(lo, hi, f),
        n = rd(o * f, 2);
      return {
        p,
        up: true,
        o,
        n,
        show: eu,
        tol: EUR,
        what: ' btw',
        q: food
          ? `Je boodschappen kosten samen ${eu(n)} euro, inclusief 9% btw. Hoeveel euro is dat zonder btw?`
          : `${name} kost ${eu(n)} euro, inclusief 21% btw. Hoeveel euro is dat zonder btw?`,
        field: F('zonder btw =', o, 'euro'),
        say: `Zonder btw is dat ${eu(o)} euro.`,
      };
    }
    const up = kind === 'up',
      p = pick(up ? UPS : DOWNS),
      f = fac(p, up),
      o = priceFor(lo, hi, f),
      n = rd(o * f, 2);
    return {
      p,
      up,
      o,
      n,
      show: eu,
      tol: EUR,
      what: up ? '' : ' korting',
      q: up
        ? `${name} is ${d(p)}% duurder geworden. Nu kost ${short} ${eu(n)} euro. Wat kostte ${short} eerst?`
        : `In de uitverkoop krijg je ${d(p)}% korting op ${lower(name)}. Met korting betaal je ${eu(n)} euro. Wat was de prijs zonder korting?`,
      field: F(up ? 'Eerst' : 'Zonder korting', o, 'euro'),
      say: up
        ? `Eerst kostte ${short} ${eu(o)} euro.`
        : `Zonder korting kostte ${short} ${eu(o)} euro.`,
    };
  }
  if (k < 8) {
    const c = pick(COUNT_OLD),
      p = pick(c.up ? UPS : DOWNS),
      f = fac(p, c.up),
      o = countFor(c.r[0], c.r[1], f),
      n = Math.round(o * f);
    return {
      p,
      up: c.up,
      o,
      n,
      show: g,
      tol: WHOLE,
      what: '',
      q: c.q(n, p),
      field: F(c.pre, o, c.unit),
      say: c.say(o),
    };
  }
  const c = pick(COUNT_OLD_BIG);
  let p, f, n, o;
  do {
    p = pick(c.up ? [3.5, 4.5, 6.5, 8.5, 2.8, 7.2, 14] : [6.5, 8.5, 12.5, 15.5, 4.8, 18]);
    f = fac(p, c.up);
    n = ri(40, 400) * 1000;
    o = n / f;
  } while (isNice(o, -3));
  const field = RF(c.pre, o, -3, c.unit);
  return {
    p,
    up: c.up,
    o,
    n,
    show: g,
    tol: tolFor(-3),
    what: '',
    q: c.q(n, p) + needRound([field]),
    field,
    say: c.say(g(rd(o, -3))),
  };
}
// De stappen van oud = nieuw / vermenigvuldigingsfactor.
function backSteps(b) {
  const f = d(fac(b.p, b.up)),
    r = b.field.round,
    calc =
      r == null
        ? `oud = {${b.show(b.n)}/${f}} = ${b.show(b.o)}`
        : `oud = {${b.show(b.n)}/${f}} = ${dots(b.o)} ≈ ${g(rd(b.o, r))}`;
  return [
    factorStep(b.p, b.up, b.what),
    H(schema(['oud', 'nieuw'], [f])),
    `Je weet nieuw, dus gebruik oud = {nieuw/${f}}.`,
    calc,
  ];
}
// De fouten bij terugrekenen naar oud, voor veld i.
function backTraps(i, b) {
  const f = fac(b.p, b.up),
    P = d(b.p);
  return [
    miss(
      'nieuw-keer-factor',
      i,
      [b.n * f],
      b.o,
      ...b.tol,
      `Je hebt nieuw keer ${d(f)} gedaan. Je weet nieuw, dus reken terug: deel door de vermenigvuldigingsfactor, oud = nieuw / ${d(f)}.`,
    ),
    miss(
      'procent-van-nieuw',
      i,
      [b.n * fac(b.p, !b.up)],
      b.o,
      ...b.tol,
      `Je hebt ${P}% van nieuw ${b.up ? 'afgehaald' : 'erbij gedaan'}. Maar de ${P}% hoort bij oud, niet bij nieuw. Deel nieuw door de vermenigvuldigingsfactor ${d(f)}.`,
    ),
    miss(
      'alleen-de-verandering',
      i,
      [(b.n * b.p) / 100],
      b.o,
      ...b.tol,
      `Dit is ${P}% van nieuw. Je zoekt oud: deel nieuw door de vermenigvuldigingsfactor ${d(f)}.`,
    ),
  ];
}
function s42old() {
  const b = makeBack();
  return {
    q: T(b.q),
    fields: [b.field],
    hint: T(
      'Bereken eerst de vermenigvuldigingsfactor. Je weet nieuw, dus gebruik oud = {nieuw/vermenigvuldigingsfactor}.',
    ),
    steps: [...backSteps(b), b.say],
    traps: backTraps(0, b).filter(Boolean),
    // Reken vooruit: oud plus het procent van oud geeft nieuw.
    v: () => near(b.o + (b.o * (b.up ? b.p : -b.p)) / 100, b.n, 1e-6),
  };
}

// ---------- 113 Van deel naar totaal ----------

// Eigen verhalen met een deel dat een procent is van een totaal. r is het bereik van het totaal.
const PART_WHOLE = [
  {
    r: [200, 1200],
    p: [15, 20, 25, 35, 40, 45, 60, 64, 75],
    q: (p, x) =>
      `Bij een enquête op een school zei ${d(p)}% van de leerlingen dat ze met de fiets komen. Dat waren ${g(x)} leerlingen. Hoeveel leerlingen deden mee aan de enquête?`,
    pre: 'Er deden',
    unit: 'leerlingen mee',
    say: (t) => `Er deden ${t} leerlingen mee aan de enquête.`,
  },
  {
    r: [800, 4000],
    k: 10,
    p: [8, 12, 15, 18, 24, 32, 35],
    q: (p, x) =>
      `Van de bezoekers van een festival kwam ${d(p)}% met de trein. Dat waren ${g(x)} bezoekers. Hoeveel bezoekers had het festival?`,
    pre: 'Het festival had',
    unit: 'bezoekers',
    say: (t) => `Het festival had ${t} bezoekers.`,
  },
  {
    r: [900, 2400],
    p: [24, 28, 32, 35, 38, 40, 45],
    money: true,
    q: (p, x) =>
      `Een student geeft ${d(p)}% van haar inkomen uit aan huur. Dat is ${eu(x)} euro per maand. Hoeveel euro is haar inkomen per maand?`,
    pre: 'Inkomen:',
    unit: 'euro per maand',
    say: (t) => `Haar inkomen is ${t} euro per maand.`,
  },
  {
    r: [200, 900],
    k: 100,
    p: [12, 15, 18, 22, 25, 30, 35],
    money: true,
    q: (p, x) =>
      `Een sportclub betaalt ${d(p)}% van haar geld aan de huur van de velden. Dat is ${eu(x)} euro per jaar. Hoeveel geld heeft de club per jaar?`,
    pre: 'De club heeft',
    unit: 'euro per jaar',
    say: (t) => `De club heeft ${t} euro per jaar.`,
  },
];
// Verhalen met een percentage dat al is afgerond. Het totaal rond je af.
const PART_WHOLE_ROUND = [
  {
    n: 0,
    p: [8.7, 12.4, 18.6, 23.5, 27.3, 31.8],
    x: () => ri(150, 600),
    q: (p, x) =>
      `Bij een onderzoek zei ${d(p)}% van de ondervraagde jongeren dat ze elke dag sporten. Dat waren ${x} jongeren. Hoeveel jongeren zijn er ondervraagd?`,
    pre: 'Ondervraagd:',
    unit: 'jongeren',
    say: (t) => `Er zijn ongeveer ${t} jongeren ondervraagd.`,
  },
  {
    n: -3,
    p: [48.6, 52.4, 55.8, 57.2, 61.3],
    x: () => ri(20000, 150000),
    q: (p, x) =>
      `Bij de verkiezing van de gemeenteraad van een stad stemde ${d(p)}% van de kiezers. Dat waren ${g(x)} mensen. Hoeveel mensen mochten er stemmen?`,
    pre: 'Er mochten',
    unit: 'mensen stemmen',
    say: (t) => `Er mochten ongeveer ${t} mensen stemmen.`,
  },
];
// Een deel dat een procent is van een totaal: alles wat een vraag naar het totaal nodig heeft.
function makeWhole() {
  if (ri(0, 9) < 6) {
    const c = pick(PART_WHOLE),
      p = pick(c.p);
    let t, x;
    do {
      t = ri(c.r[0], c.r[1]) * (c.k || 1);
      x = rd((t * p) / 100, 6);
    } while (!isNice(x, c.money ? 2 : 0));
    const show = c.money ? eu : g;
    return {
      p,
      t,
      x,
      show,
      tol: c.money ? EUR : WHOLE,
      q: c.q(p, x),
      field: F(c.pre, t, c.unit),
      say: c.say(show(t)),
    };
  }
  const c = pick(PART_WHOLE_ROUND),
    p = pick(c.p);
  let x, t;
  do {
    x = c.x();
    t = x / (p / 100);
  } while (isNice(t, c.n));
  const field = RF(c.pre, t, c.n, c.unit);
  return {
    p,
    t,
    x,
    show: g,
    tol: tolFor(c.n),
    q: c.q(p, x) + needRound([field]),
    field,
    say: c.say(g(rd(t, c.n))),
  };
}
// De stappen van totaal = deel / procent als kommagetal.
function wholeSteps(w) {
  const q = d(w.p / 100),
    r = w.field.round,
    calc =
      r == null
        ? `totaal = {${w.show(w.x)}/${q}} = ${w.show(w.t)}`
        : `totaal = {${w.show(w.x)}/${q}} = ${dots(w.t)} ≈ ${g(rd(w.t, r))}`;
  return [
    `${d(w.p)}% van het totaal is ${w.show(w.x)}, dus ${q} × totaal = ${w.show(w.x)}`,
    H(schema(['totaal', 'deel'], [q])),
    `Je weet deel, dus gebruik totaal = {deel/${q}}.`,
    calc,
  ];
}
// De fouten bij terugrekenen naar het totaal, voor veld i.
function wholeTraps(i, w) {
  const P = d(w.p),
    q = d(w.p / 100);
  return [
    miss(
      'deel-keer-procent',
      i,
      [(w.x * w.p) / 100, w.x * w.p],
      w.t,
      ...w.tol,
      `Je hebt ${w.show(w.x)} keer ${P}% gedaan. Maar ${w.show(w.x)} is zelf al ${P}% van het totaal. Je weet deel, dus deel door ${q}.`,
    ),
    miss(
      'gedeeld-door-procent',
      i,
      [w.x / w.p],
      w.t,
      ...w.tol,
      `Je hebt door ${P} gedeeld. Schrijf het procent eerst als kommagetal: ${P}% is ${q}. Deel dan door ${q}.`,
    ),
  ];
}
function s42whole() {
  const w = makeWhole();
  return {
    q: T(w.q),
    fields: [w.field],
    hint: 'Schrijf het procent als kommagetal. Je weet deel, dus deel het deel door dat kommagetal.',
    steps: [...wholeSteps(w), w.say],
    traps: wholeTraps(0, w).filter(Boolean),
    // Reken vooruit: het procent van het totaal moet het deel geven.
    v: () => near((w.t * w.p) / 100, w.x, 1e-6),
  };
}

// ---------- 114 Gemengd ----------

// Eerst terug naar de prijs zonder korting of zonder btw, en dan verder.
function backThenOn() {
  if (coin()) {
    // Met korting, en daarna gaat de prijs zonder korting omhoog.
    const [name, short, lo, hi] = pick(GOODS),
      p1 = pick([15, 20, 25, 30, 40]),
      p2 = pick([4, 5, 6, 8, 10, 15]),
      f1 = fac(p1, false),
      f2 = fac(p2, true);
    let o;
    do o = ri(lo, hi) + pick([0, 0.5]);
    while (!isNice(o * f1, 2) || !isNice(o * f2, 2));
    const n = rd(o * f1, 2),
      x = rd(o * f2, 2),
      b = { p: p1, up: false, o, n, show: eu, tol: EUR, what: ' korting' };
    b.field = F('prijs zonder korting =', o, 'euro');
    return {
      q: T(
        `Met ${p1}% korting kost ${lower(name)} ${eu(n)} euro. Na de uitverkoop gaat de prijs zonder korting met ${p2}% omhoog. Bereken de prijs zonder korting en de prijs na de verhoging.`,
      ),
      fields: [b.field, F('prijs na de verhoging =', x, 'euro')],
      steps: [
        ...backSteps(b),
        factorStep(p2, true),
        `nieuwe prijs = ${d(f2)}*${eu(o)} = ${eu(x)}`,
        `Zonder korting kost ${short} ${eu(o)} euro. Na de verhoging kost ${short} ${eu(x)} euro.`,
      ],
      traps: [
        ...backTraps(0, b),
        miss(
          'niet-eerst-terug',
          1,
          [n * f2],
          x,
          ...EUR,
          `Je hebt de verhoging over de prijs met korting berekend. Reken eerst terug naar de prijs zonder korting, en verhoog die met ${p2}%.`,
        ),
        miss(
          'procenten-opgeteld',
          1,
          [n * fac(p1 + p2, true)],
          x,
          ...EUR,
          'Percentages tel je niet op, want ze gaan over verschillende prijzen. Reken eerst terug naar de prijs zonder korting en reken daarna verder.',
        ),
      ],
      v: () => near(o - (o * p1) / 100, n, 1e-6) && near(o + (o * p2) / 100, x, 1e-6),
    };
  }
  // Boodschappen met 9% btw, en dan met 21% btw.
  const o = ri(15, 90),
    n = rd(o * 1.09, 2),
    x = rd(o * 1.21, 2),
    b = { p: 9, up: true, o, n, show: eu, tol: EUR, what: ' btw' };
  b.field = F('zonder btw =', o, 'euro');
  return {
    q: T(
      `Je boodschappen kosten samen ${eu(n)} euro, inclusief 9% btw. Stel dat de btw op boodschappen 21% wordt. Hoeveel kosten dezelfde boodschappen dan? Bereken eerst het bedrag zonder btw.`,
    ),
    fields: [b.field, F('met 21% btw =', x, 'euro')],
    steps: [
      ...backSteps(b),
      factorStep(21, true, ' btw'),
      `met 21% btw = 1,21*${eu(o)} = ${eu(x)}`,
      `Zonder btw is het ${eu(o)} euro. Met 21% btw kosten de boodschappen ${eu(x)} euro.`,
    ],
    traps: [
      ...backTraps(0, b),
      miss(
        'niet-eerst-terug',
        1,
        [n * 1.21],
        x,
        ...EUR,
        'Je hebt 21% btw berekend over het bedrag dat al btw bevat. Reken eerst terug naar het bedrag zonder btw.',
      ),
      miss(
        'procenten-opgeteld',
        1,
        [n * 1.12],
        x,
        ...EUR,
        'Je hebt het verschil van 12% erbij gedaan. Maar de btw gaat over het bedrag zonder btw. Reken eerst terug naar het bedrag zonder btw.',
      ),
    ],
    v: () => near(o + (o * 9) / 100, n, 1e-6) && near(o + (o * 21) / 100, x, 1e-6),
  };
}

// Eigen verhalen met een deel van een deel. mid is het eerste deel, tot het totaal.
const PART_OF_PART = [
  {
    r: [40, 160],
    q: (p1, p2, x) =>
      `Op een school komt ${p1}% van de leerlingen met de fiets. Van de fietsers fietst ${p2}% langer dan een half uur. Dat zijn ${x} leerlingen. Hoeveel leerlingen komen met de fiets? En hoeveel leerlingen heeft de school?`,
    mid: 'fietsers',
    tot: 'leerlingen',
    pre: ['Met de fiets:', 'De school heeft'],
    unit: 'leerlingen',
    say: (m, t) => `Er komen ${m} leerlingen met de fiets. De school heeft ${t} leerlingen.`,
  },
  {
    r: [100, 600],
    q: (p1, p2, x) =>
      `Van de bezoekers van een dierentuin had op een dag ${p1}% een jaarkaart. Van de bezoekers met een jaarkaart was ${p2}% jonger dan 12 jaar. Dat waren ${x} kinderen. Hoeveel bezoekers met een jaarkaart waren er? En hoeveel bezoekers waren er in totaal?`,
    mid: 'jaarkaarten',
    tot: 'bezoekers',
    pre: ['Met een jaarkaart:', 'In totaal:'],
    unit: 'bezoekers',
    say: (m, t) => `Er waren ${m} bezoekers met een jaarkaart en ${t} bezoekers in totaal.`,
  },
  {
    r: [20, 90],
    q: (p1, p2, x) =>
      `Van de leden van een sportclub is ${p1}% jeugdlid. Van de jeugdleden speelt ${p2}% wedstrijden. Dat zijn ${x} jeugdleden. Hoeveel jeugdleden heeft de club? En hoeveel leden heeft de club in totaal?`,
    mid: 'jeugdleden',
    tot: 'leden',
    pre: ['Jeugdleden:', 'In totaal:'],
    unit: 'leden',
    say: (m, t) => `De club heeft ${m} jeugdleden en ${t} leden in totaal.`,
  },
];
// Een deel van een deel: twee keer van deel naar totaal.
function partOfPart() {
  const c = pick(PART_OF_PART);
  let p1, p2, tot, mid, x;
  for (;;) {
    p1 = pick([30, 35, 40, 45, 60, 64, 75, 80]);
    p2 = pick([15, 20, 25, 30, 35, 40, 45, 55]);
    tot = ri(c.r[0], c.r[1]) * 10;
    mid = rd((tot * p1) / 100, 6);
    x = rd((mid * p2) / 100, 6);
    if (Number.isInteger(mid) && Number.isInteger(x) && x >= 5) break;
  }
  const q1 = d(p1 / 100),
    q2 = d(p2 / 100),
    w1 = { p: p2, t: mid, x, show: g, tol: WHOLE },
    w0 = { p: p1, t: tot, x: mid, show: g, tol: WHOLE },
    [a, b] = [wholeTraps(0, w1), wholeTraps(1, w0)];
  return {
    q: T(c.q(p1, p2, x)),
    fields: [F(c.pre[0], mid, c.unit), F(c.pre[1], tot, c.unit)],
    steps: [
      `${p2}% van de ${c.mid} is ${x}. Je weet deel, dus gebruik totaal = {deel/${q2}}.`,
      `${c.mid} = {${x}/${q2}} = ${mid}`,
      `${p1}% van de ${c.tot} is ${mid}. Je weet deel, dus gebruik totaal = {deel/${q1}}.`,
      `${c.tot} = {${mid}/${q1}} = ${tot}`,
      c.say(mid, tot),
    ],
    traps: [
      either(
        'deel-keer-procent',
        'Je hebt het deel keer het procent gedaan. Maar het deel is zelf al een procent van het totaal. Je weet deel, dus deel door het procent als kommagetal.',
        a[0],
        b[0],
      ),
      either(
        'gedeeld-door-procent',
        'Je hebt door het procent gedeeld. Schrijf het procent eerst als kommagetal, zoals 25% is 0,25. Deel dan door dat kommagetal.',
        a[1],
        b[1],
      ),
      miss(
        'stap-overgeslagen',
        1,
        [x / (p1 / 100)],
        tot,
        ...WHOLE,
        `Je hebt ${x} gedeeld door ${q1}. Maar ${p1}% hoort bij de ${c.mid}. Reken eerst uit hoeveel ${c.mid} er zijn, en deel dat door ${q1}.`,
      ),
    ],
    v: () => near((((tot * p1) / 100) * p2) / 100, x, 1e-6) && near((tot * p1) / 100, mid, 1e-6),
  };
}

// Eigen verhalen met twee veranderingen na elkaar, waarvan je het laatste aantal weet. r is het
// bereik van het eerste aantal.
const TWO_BACK = [
  {
    r: [200, 900],
    q: (y, n, a, b) =>
      `In ${y + 2} had een sportclub ${g(n)} leden. Dat was ${a} dan in ${y + 1}. In ${y + 1} had de club ${b} leden dan in ${y}. Hoeveel leden had de club in ${y + 1} en in ${y}?`,
    unit: 'leden',
    say: (y, m, t) => `In ${y + 1} had de club ${g(m)} leden en in ${y} ${g(t)} leden.`,
  },
  {
    r: [2000, 9000],
    q: (y, n, a, b) =>
      `Een klein theater had in ${y + 2} ${g(n)} bezoekers. Dat was ${a} dan in ${y + 1}. In ${y + 1} waren het er ${b} dan in ${y}. Hoeveel bezoekers had het theater in ${y + 1} en in ${y}?`,
    unit: 'bezoekers',
    say: (y, m, t) => `In ${y + 1} had het theater ${g(m)} bezoekers en in ${y} ${g(t)}.`,
  },
];
const TWO_PCTS = [5, 8, 10, 12, 15, 20, 25, 30, 40];
// Twee keer terug: van het laatste jaar naar het jaar ervoor, en nog een jaar terug.
function twoBack() {
  const c = pick(TWO_BACK),
    y = ri(2019, 2022);
  let p1, u1, p2, u2, tot, mid, n;
  for (;;) {
    [p1, p2] = [pick(TWO_PCTS), pick(TWO_PCTS)];
    [u1, u2] = [coin(), coin()];
    tot = ri(c.r[0], c.r[1]);
    mid = rd(tot * fac(p1, u1), 6);
    n = rd(mid * fac(p2, u2), 6);
    if (Number.isInteger(mid) && Number.isInteger(n) && (u1 !== u2 || p1 !== p2)) break;
  }
  const f1 = fac(p1, u1),
    f2 = fac(p2, u2),
    rel = (p, u) => `${p}% ${u ? 'meer' : 'minder'}`,
    s = (u1 ? p1 : -p1) + (u2 ? p2 : -p2),
    b2 = { p: p2, up: u2, o: mid, n, tol: WHOLE },
    b1 = { p: p1, up: u1, o: tot, n: mid, tol: WHOLE },
    [a, b] = [backTraps(0, b2), backTraps(1, b1)],
    sg = (p, u) => `${u ? '+' : '-'}${p}%`;
  return {
    q: T(c.q(y, n, rel(p2, u2), rel(p1, u1))),
    fields: [F(`In ${y + 1}`, mid, c.unit), F(`In ${y}`, tot, c.unit)],
    steps: [
      `${sg(p1, u1)} geeft × ${d(f1)} en ${sg(p2, u2)} geeft × ${d(f2)}`,
      H(schema([String(y), String(y + 1), String(y + 2)], [d(f1), d(f2)])),
      `Je weet het aantal in ${y + 2}, dus reken terug: deel door de vermenigvuldigingsfactoren.`,
      `${y + 1}: {${g(n)}/${d(f2)}} = ${g(mid)}`,
      `${y}: {${g(mid)}/${d(f1)}} = ${g(tot)}`,
      c.say(y, mid, tot),
    ],
    traps: [
      either(
        'nieuw-keer-factor',
        'Je hebt keer de vermenigvuldigingsfactor gedaan. Je weet het latere aantal, dus reken terug: deel door de vermenigvuldigingsfactor.',
        a[0],
        b[0],
      ),
      either(
        'procent-van-nieuw',
        'Je hebt het procent van het latere aantal genomen. Maar het procent hoort bij het eerdere aantal. Deel door de vermenigvuldigingsfactor.',
        a[1],
        b[1],
      ),
      s &&
        miss(
          'procenten-opgeteld',
          1,
          [n / (1 + s / 100)],
          tot,
          ...WHOLE,
          'Percentages tel je niet op, want elke verandering gaat over een ander aantal. Reken stap voor stap terug.',
        ),
    ].filter(Boolean),
    // Reken vooruit, stap voor stap.
    v: () => {
      const m = tot + (tot * (u1 ? p1 : -p1)) / 100;
      return near(m, mid, 1e-6) && near(m + (m * (u2 ? p2 : -p2)) / 100, n, 1e-6);
    },
  };
}
function s42mixed() {
  const k = ri(0, 2);
  const q = k === 0 ? backThenOn() : k === 1 ? partOfPart() : twoBack();
  return {
    ...q,
    hint: 'Reken eerst terug: deel door de vermenigvuldigingsfactor, of door het procent als kommagetal. Reken daarna verder.',
    traps: q.traps.filter(Boolean),
  };
}

export default {
  slug: 'rekenen-met-procenten',
  title: 'Rekenen met procenten',
  intro:
    'Met procenten kun je ook terugrekenen. Hier reken je met grote getallen als miljoen en miljard, bereken je het oude getal als je het nieuwe weet, en het totaal als je weet hoe groot een deel is.',
  description:
    'Terugrekenen met procenten oefenen: het oude getal en het totaal berekenen, en rekenen met miljoen en miljard. Havo 3, gratis met uitleg en hints.',
  videos: {
    menno: [
      ['Rekenen met grote getallen', 'kcf-xP_3JeQ'],
      ['Oud berekenen', 'ZiJOXXOcj9I'],
      ['Van deel naar totaal', 'ccOr9DBFrUU'],
    ],
  },
  skills: [
    [111, 'Rekenen met grote getallen', s42big],
    [112, 'Oud berekenen', s42old],
    [113, 'Van deel naar totaal', s42whole],
    [114, 'Terugrekenen en verder', s42mixed],
  ],
  learn: [
    {
      t: 'Grote getallen',
      p: [
        `Een duizend is 1000, een miljoen is 1${' '}000${' '}000 en een miljard is 1${' '}000${' '}000${' '}000. Een miljard is dus 1000 miljoen.`,
        'Een procent van een groot getal reken je uit zoals altijd. Het woord miljoen of miljard blijft erachter staan: 6,4% van 314 miljard is 0,064 · 314 miljard = 20,096 miljard.',
        'Deel je miljard door miljoen, maak dan eerst de eenheden gelijk. Schrijf de miljarden als miljoenen.',
      ],
      ex: {
        q: T(
          'Een land gaf in een jaar 286 miljard euro uit. Het land heeft 13,4 miljoen inwoners. Hoeveel euro is dat gemiddeld per inwoner? Rond af op duizendtallen.',
        ),
        steps: [
          `Eerst dezelfde eenheid: 1 miljard = 1000 miljoen, dus 286 miljard = 286${' '}000 miljoen`,
          `{286${' '}000 miljoen/13,4 miljoen} = 21${' '}343,28... ≈ 21${' '}000`,
          `Dat is gemiddeld ongeveer 21${' '}000 euro per inwoner.`,
        ],
      },
      watch: `Afronden op duizendtallen: 21${' '}343 wordt 21${' '}000, oftewel 21 duizend. Is het eerste cijfer dat wegvalt 5 of meer, dan rond je naar boven af.`,
    },
    {
      t: 'Oud berekenen',
      p: [
        'Weet je het nieuwe getal en de procentuele verandering, dan reken je terug naar oud. Bij een toename van 12% hoort × 1,12, dus 1,12 × oud = nieuw. Heen vermenigvuldig je met 1,12, terug deel je door 1,12:',
        schema(['oud', 'nieuw'], ['1,12']),
        'Je weet nieuw, dus oud = {nieuw/1,12}. Btw is ook een toename: bij 21% btw hoort × 1,21.',
      ],
      ex: {
        q: T('Na een prijsstijging van 15% kost een step 82,80 euro. Wat kostte de step eerst?'),
        steps: [
          '15% erbij geeft 100% + 15% = 115%, dus × 1,15',
          H(schema(['oud', 'nieuw'], ['1,15'])),
          'Je weet nieuw, dus gebruik oud = {nieuw/1,15}.',
          'oud = {82,80/1,15} = 72',
          'Eerst kostte de step 72 euro.',
        ],
      },
      ex2: {
        q: T(
          'In de uitverkoop krijg je 30% korting. Met korting kost een jas 62,30 euro. Wat was de prijs zonder korting?',
        ),
        steps: [
          '30% korting eraf geeft 100% - 30% = 70%, dus × 0,7',
          H(schema(['oud', 'nieuw'], ['0,7'])),
          'Je weet nieuw, dus gebruik oud = {nieuw/0,7}.',
          'oud = {62,30/0,7} = 89',
          'Zonder korting kostte de jas 89 euro.',
        ],
      },
      watch:
        'Het procent hoort bij oud. Haal dus niet 30% van de nieuwe prijs af of tel het erbij op, maar deel door de vermenigvuldigingsfactor.',
    },
    {
      t: 'Van deel naar totaal',
      p: [
        'Weet je hoe groot een deel is en welk procent van het totaal dat is, dan reken je het totaal uit. Is 35% van het totaal 238, dan is 0,35 × totaal = 238:',
        schema(['totaal', 'deel'], ['0,35']),
        'Je weet deel, dus totaal = {deel/0,35}.',
      ],
      ex: {
        q: T(
          'Bij een enquête zei 35% van de leerlingen dat ze lopend naar school komen. Dat waren 238 leerlingen. Hoeveel leerlingen deden mee?',
        ),
        steps: [
          '35% van het totaal is 238, dus 0,35 × totaal = 238',
          'Je weet deel, dus gebruik totaal = {deel/0,35}.',
          'totaal = {238/0,35} = 680',
          'Er deden 680 leerlingen mee.',
        ],
      },
      watch: 'Deel door het kommagetal 0,35, niet door 35.',
    },
    {
      t: 'Terugrekenen en verder',
      p: [
        'Soms reken je eerst terug en daarna verder. Bereken dan eerst oud of het totaal, en ga daarmee verder.',
      ],
      ex: {
        q: T(
          'Met 25% korting kost een tent 66 euro. Na de uitverkoop gaat de prijs zonder korting met 10% omhoog. Wat kost de tent dan?',
        ),
        steps: [
          '25% korting eraf geeft × 0,75. Je weet nieuw, dus oud = {66/0,75} = 88',
          '10% erbij geeft × 1,1, dus de nieuwe prijs is 1,1*88 = 96,80',
          'Na de verhoging kost de tent 96,80 euro.',
        ],
      },
      watch:
        'Tel de procenten niet op. De 10% gaat over de prijs zonder korting, niet over de prijs met korting.',
    },
  ],
};
