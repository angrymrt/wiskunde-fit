// Rekenhulp: toeval, breuken (als {n, d}) en getallen op zijn Nederlands schrijven.

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const nz = (a, b) => {
  let x;
  do {
    x = ri(a, b);
  } while (x === 0);
  return x;
};
const pick = (a) => a[ri(0, a.length - 1)];
const coin = () => Math.random() < 0.5;
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
const rd = (x, n = 1) => Number(x.toFixed(n));
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
const sg = (b) => (b < 0 ? ` - ${d(-b)}` : ` + ${d(b)}`);

export {
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
  sg,
};
