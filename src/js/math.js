// Rekenhulp: toeval, breuken (als {n, d}) en getallen op zijn Nederlands schrijven.

// Al het toeval van een vraag komt uit random(). Binnen withSeed is dat mulberry32, een kleine,
// bekende toevalsgenerator: dezelfde seed geeft dan steeds precies dezelfde vraag, zolang de
// generator zelf niet verandert. Een seed is een geheel getal van 32 bits.
const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
let random = Math.random;
function withSeed(seed, make) {
  const before = random;
  random = mulberry32(seed);
  try {
    return make();
  } finally {
    random = before;
  }
}
const newSeed = () => globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
// In het adres staat een seed in base 36, zodat die kort blijft: hoogstens 7 tekens.
const seedText = (seed) => seed.toString(36);
function parseSeed(text) {
  if (!/^[0-9a-z]{1,7}$/.test(text || '')) return null;
  const seed = parseInt(text, 36);
  return seed <= 0xffffffff ? seed : null;
}

// Elke keuze van een generator gaat via choose(n): een geheel getal van 0 tot en met n - 1. ri, pick,
// coin en shuffle zijn er gewoon mee gemaakt. Zo kan alleKeuzes elke keuze een voor een doorlopen
// en tellen hoeveel verschillende vragen een generator kan maken, zonder dat een seed iets anders
// geeft. Zie #22.
let choose = (n) => Math.floor(random() * n);

// Een keuze die niet mooi uitkomt, kies je opnieuw met until(maak, klopt): maak geeft een
// uitkomst, klopt zegt of die goed is. Schrijf zelf geen lus voor toeval, want alleKeuzes kan een
// lus niet overslaan. Zonder tellen kiest until opnieuw tot het klopt, met hetzelfde toeval als
// een gewone lus.
class Afgekeurd extends Error {}
let telt = false;
const until = (maak, klopt) => {
  for (;;) {
    const x = maak();
    if (klopt(x)) return x;
    // Bij het tellen is dit pad geen vraag: alleKeuzes gaat naar het volgende.
    if (telt) throw new Afgekeurd();
  }
};

// Vervangt choose zolang make loopt, net als withSeed het toeval vervangt. Een keuze die until
// afkeurt, gooit dan Afgekeurd.
function withChoices(kies, make) {
  const before = [choose, telt];
  choose = kies;
  telt = true;
  try {
    return make();
  } finally {
    [choose, telt] = before;
  }
}

// Loopt alle keuzes van make een voor een door en roept op voor elke uitkomst. Geeft het aantal
// paden terug, of null als er meer dan maxPaden zijn: dan is het te veel om na te lopen. Een pad
// met meer dan maxKeuzes keuzes is een generator die steeds opnieuw begint, en telt niet mee.
// Het eerste pad kiest overal 0. Daarna gaat de laatste keuze die nog kan een omhoog, en begint
// alles daarna weer bij 0.
function alleKeuzes(make, op, { maxPaden = 1e6, maxKeuzes = 200 } = {}) {
  const pad = [];
  let paden = 0;
  for (;;) {
    let i = 0;
    const kies = (n) => {
      if (i >= maxKeuzes) throw new Afgekeurd();
      if (i === pad.length) pad.push({ k: 0, n });
      return pad[i++].k;
    };
    try {
      op(withChoices(kies, make));
      paden++;
    } catch (e) {
      if (!(e instanceof Afgekeurd)) throw e;
    }
    if (paden > maxPaden) return null;
    pad.length = i;
    while (pad.length && pad[pad.length - 1].k + 1 >= pad[pad.length - 1].n) pad.pop();
    if (!pad.length) return paden;
    pad[pad.length - 1].k++;
  }
}

const ri = (a, b) => a + choose(b - a + 1);
const nz = (a, b) =>
  until(
    () => ri(a, b),
    (x) => x !== 0,
  );
const pick = (a) => a[ri(0, a.length - 1)];
const coin = () => choose(2) === 0;
const shuffle = (a) => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = ri(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const gcd = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
};
const lcm = (a, b) => (a * b) / gcd(a, b);
const Q = (n, e = 1) => {
  if (typeof n === 'object') return n;
  if (e < 0) {
    n = -n;
    e = -e;
  }
  const g = gcd(n, e) || 1;
  return { n: n / g, d: e / g };
};
const qv = (q) => {
  q = Q(q);
  return q.n / q.d;
};
const qAdd = (a, b) => {
  a = Q(a);
  b = Q(b);
  return Q(a.n * b.d + b.n * a.d, a.d * b.d);
};
const qSub = (a, b) => {
  b = Q(b);
  return qAdd(a, { n: -b.n, d: b.d });
};
const qMul = (a, b) => {
  a = Q(a);
  b = Q(b);
  return Q(a.n * b.n, a.d * b.d);
};
const qDiv = (a, b) => {
  a = Q(a);
  b = Q(b);
  return Q(a.n * b.d, a.d * b.n);
};
const near = (x, y, t = 1e-7) => Math.abs(x - y) < t;
// Afronden op n decimalen, bij een halve stap weg van nul, zoals op school: 3,75 wordt 3,8 en
// −3,75 wordt −3,8. Met n = 0 op gehelen, en met een negatieve n op tientallen (−1),
// duizendtallen (−3), miljoenen (−6) of miljarden (−9). Een kommagetal als 2,675 staat in de
// computer net onder de helft, en toFixed maakt daar 2,67 van. Eerst op 12 cijfers afronden zet
// zo'n getal weer op de helft, zonder ruis aan grote getallen toe te voegen.
const rd = (x, n = 1) => {
  const half = (s) => Math.round(Number(s.toPrecision(12)));
  const a = Math.abs(x);
  const r = n < 0 ? half(a / 10 ** -n) * 10 ** -n : half(a * 10 ** n) / 10 ** n;
  return x < 0 && r ? -r : r;
};
// Waarop je afrondt, zoals in de vraag: "1 decimaal", "gehelen" of "duizendtallen".
const ROUND_WORDS = {
  0: 'gehelen',
  '-1': 'tientallen',
  '-2': 'honderdtallen',
  '-3': 'duizendtallen',
  '-6': 'miljoenen',
  '-9': 'miljarden',
};
const roundText = (n) =>
  n === 1 ? '1 decimaal' : n > 1 ? `${n} decimalen` : ROUND_WORDS[n] || `${10 ** -n}-tallen`;
const isNice = (x, n = 1) => near(x, rd(x, n), 1e-7);
const d = (x) => String(Number((+x).toFixed(6))).replace('.', ',');
const ap = (x, n = 1) => `${isNice(x, n) ? '=' : '≈'} ${d(rd(x, n))}`;
function fr(q) {
  q = Q(q);
  if (q.d === 1) return String(q.n);
  const a = Math.abs(q.n),
    w = Math.floor(a / q.d),
    r = a % q.d;
  return `{${q.n < 0 ? '-' : ''}${w ? w + ' ' : ''}${r}/${q.d}}`;
}
function lin(a, b, v = 'x') {
  a = Q(a);
  b = Q(b);
  let s = '';
  if (a.n) {
    const p = Q(Math.abs(a.n), a.d);
    s = (a.n < 0 ? '-' : '') + (p.n === 1 && p.d === 1 ? '' : fr(p)) + v;
  }
  if (b.n) {
    const p = fr(Q(Math.abs(b.n), b.d));
    s = s ? `${s} ${b.n < 0 ? '-' : '+'} ${p}` : (b.n < 0 ? '-' : '') + p;
  }
  return s || '0';
}
// Als lin, maar met kommagetallen in plaats van breuken: 0,5x - 1,5.
function dlin(a, b, v = 'x') {
  let s = a ? (a < 0 ? '-' : '') + (Math.abs(a) === 1 ? '' : d(Math.abs(a))) + v : '';
  if (b) s = s ? `${s} ${b < 0 ? '-' : '+'} ${d(Math.abs(b))}` : d(b);
  return s || '0';
}
const sg = (b) => (b < 0 ? ` - ${d(-b)}` : ` + ${d(b)}`);

export {
  withSeed,
  newSeed,
  seedText,
  parseSeed,
  withChoices,
  alleKeuzes,
  until,
  Afgekeurd,
  ri,
  nz,
  pick,
  coin,
  shuffle,
  gcd,
  lcm,
  Q,
  qv,
  qAdd,
  qSub,
  qMul,
  qDiv,
  near,
  rd,
  isNice,
  d,
  ap,
  fr,
  lin,
  dlin,
  sg,
  roundText,
};
