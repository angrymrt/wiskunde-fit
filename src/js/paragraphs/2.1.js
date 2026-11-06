// Paragraaf 2.1: Verhoudingstabellen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { geo } from '../figures.js';
import { ri, nz, pick, coin, near, rd, isNice, d, ap, lin, sg } from '../math.js';
import { H, F, RF, needRound } from './shared.js';
import { T, vt } from '../typeset.js';

function s21cross() {
  const a = pick([2, 3, 4, 5, 6, 7, 8, 9, 12, 16, 18]),
    b = pick([3, 4, 5, 6, 8, 10, 15, 21, 25]),
    c = pick([2, 3, 5, 7, 9, 11, 12, 14, 18, 20]);
  if (a === b) return s21cross();
  const pos = ri(0, 3);
  /* tabel: a|c / b|? met onbekende op wisselende plek */
  const cells = [a, c, b, null];
  const map = [
    [3, 1, 2, 0],
    [1, 3, 0, 2],
    [2, 0, 3, 1],
    [0, 1, 2, 3],
  ][pos];
  const g = map.map((i) => cells[i]);
  const xi = g.indexOf(null);
  const [tl, tr, bl, br] = g;
  const op = { 0: [tr, bl, br], 1: [tl, br, bl], 2: [tl, br, tr], 3: [tr, bl, tl] }[xi];
  const x = (op[0] * op[1]) / op[2];
  const cell = (v) => (v === null ? 'x' : String(v)),
    f = [RF('x =', x)];
  return {
    q:
      T('Bereken x in de verhoudingstabel.') +
      vt([cell(tl), cell(tr)], [cell(bl), cell(br)]) +
      T(needRound(f)),
    fields: f,
    hint: 'Kruislings vermenigvuldigen: de twee vermenigvuldigingen over het kruis zijn gelijk.',
    steps: [
      H(
        vt([cell(tl), cell(tr)], [cell(bl), cell(br)]) +
          T(` geeft x = {${op[0]}*${op[1]}/${op[2]}} ${ap(x)}`),
      ),
    ],
    traps: [
      {
        f: (v) => near(v[0], (op[2] * op[0]) / op[1]) && op[0] !== op[1],
        m: 'Vermenigvuldig de twee getallen die schuin tegenover elkaar staan en deel door het overgebleven getal.',
      },
    ],
    v: () => {
      const t = xi === 0 ? x : tl,
        u = xi === 1 ? x : tr,
        w = xi === 2 ? x : bl,
        z = xi === 3 ? x : br;
      return near(t * z, u * w, 1e-6);
    },
  };
}
function s21var() {
  for (let i = 0; i < 300; i++) {
    const p = pick([2, 3, 4, 5, 6, 7, 8]),
      q = pick([2, 3, 4, 5, 6, 7, 8, 9, 12]);
    if (p === q) continue;
    const r = nz(-6, 6),
      s = nz(-6, 6);
    const x = (p * s - q * r) / (q - p);
    if (!isNice(x, 1) || x === 0) continue;
    const c1 = `x${sg(r)}`,
      c2 = `x${sg(s)}`;
    return {
      q: T('Bereken x in de verhoudingstabel.') + vt([c1, c2], [String(p), String(q)]),
      fields: [F('x =', x)],
      hint: 'Kruislings vermenigvuldigen geeft een vergelijking met haakjes. Werk de haakjes weg en los op.',
      steps: [
        H(vt([c1, c2], [String(p), String(q)]) + T(` geeft ${q}(${c1}) = ${p}(${c2})`)),
        `${lin(q, q * r)} = ${lin(p, p * s)}`,
        `${lin(q - p, 0)} = ${d(p * s - q * r)}`,
        `x = ${d(x)}`,
      ],
      v: () => near(q * (x + r), p * (x + s)),
    };
  }
  return s21cross();
}
function s21tab3() {
  const a = pick([6, 8, 9, 12, 15, 18, 36, 40, 80]),
    c = pick([4, 5, 7, 10, 14, 16, 21, 25, 88]),
    m = pick([3, 5, 7, 9, 11, 13, 16, 20]),
    e = pick([6, 12, 14, 24, 30, 50, 72]);
  if (a === c) return s21tab3();
  const x = (m * a) / c,
    y = (e * c) / a,
    f = [RF('x =', x), RF('y =', y)];
  return {
    q:
      T('Bereken x en y in de verhoudingstabel.') +
      vt([String(a), 'x', String(e)], [String(c), String(m), 'y']) +
      T(needRound(f)),
    fields: f,
    hint: 'Gebruik steeds de kolom waarin geen letter staat, samen met de kolom van de letter die je zoekt.',
    steps: [
      H(vt([String(a), 'x'], [String(c), String(m)]) + T(` geeft x = {${a}*${m}/${c}} ${ap(x)}`)),
      H(vt([String(a), String(e)], [String(c), 'y']) + T(` geeft y = {${c}*${e}/${a}} ${ap(y)}`)),
    ],
    v: () => near(a * m, c * x, 1e-6) && near(a * y, c * e, 1e-6),
  };
}
function s21story() {
  if (coin()) {
    const h = pick([1.2, 1.5, 1.6, 1.8, 2]),
      s = pick([0.8, 1.2, 2, 2.4, 3]),
      S = pick([6, 8, 9, 10, 12, 15, 18]),
      H2 = (h * S) / s,
      f = [RF('hoogte =', H2, 1, 'meter')];
    return {
      q: T(
        `Een paal van ${d(h)} meter heeft een schaduw van ${d(s)} meter. Op hetzelfde moment heeft een boom een schaduw van ${S} meter. Hoe hoog is de boom?${needRound(f)}`,
      ),
      fields: f,
      hint: 'Zet hoogtes in de bovenste rij en schaduwen in de onderste rij.',
      steps: [
        H(T('Bij de situatie hoort de verhoudingstabel ') + vt([d(h), 'x'], [d(s), String(S)])),
        `x = {${d(h)}*${S}/${d(s)}} ${ap(H2)}`,
        `De boom is ${isNice(H2, 1) ? '' : 'ongeveer '}${d(rd(H2, 1))} meter hoog.`,
      ],
      v: () => near(h * S, s * H2, 1e-6),
    };
  }
  const n = pick([3, 4, 5, 6]),
    per = pick([1, 1.5, 2, 2.5]),
    L = n * per,
    m = pick([7, 8, 10, 12, 14, 16, 20]);
  return {
    q: T(
      `Een stapel van ${n} dezelfde boeken is ${d(L)} cm hoog. Hoe hoog is een stapel van ${m} van die boeken?`,
    ),
    fields: [F('hoogte =', per * m, 'cm')],
    hint: 'Reken eerst uit hoe dik één boek is, of gebruik een verhoudingstabel.',
    steps: [
      H(vt([String(n), String(m)], [d(L), 'x'])),
      `x = {${d(L)}*${m}/${n}} = ${d(per * m)}`,
      `De stapel is ${d(per * m)} cm hoog.`,
    ],
    v: () => near(L * m, n * per * m),
  };
}
function s21par() {
  const k = pick([1.2, 1.25, 1.5, 2, 2.5, 0.8]),
    p = pick([4, 8, 12, 16, 20]),
    q = pick([4, 6, 8, 10, 12, 16]),
    s = pick([4, 8, 10, 12, 20]);
  const a = p * k,
    x = q * k,
    e = s * k,
    y = s;
  const u = [0.35, -1],
    w = [1, 0.12],
    t1 = a,
    t2 = x,
    t3 = e,
    tot = t1 + t2 + t3,
    sc = 8 / tot,
    gp = 5.5,
    cc = 0.55,
    mk = (t) => [u[0] * t * sc, u[1] * t * sc],
    mk2 = (t) => [
      u[0] * t * sc + (gp + cc * t * sc) * w[0],
      u[1] * t * sc + (gp + cc * t * sc) * w[1],
    ];
  const pts = {
    A: mk(0),
    B: mk(t1),
    C: mk(t1 + t2),
    D: mk(tot),
    E: mk2(0),
    G: mk2(t1),
    H: mk2(t1 + t2),
    J: mk2(tot),
  };
  return {
    q: T(
      `Vier evenwijdige lijnen snijden twee andere lijnen. Bereken x en y. De figuur is niet op schaal.`,
    ),
    fig: geo({
      pts,
      segs: ['AD', 'EJ', 'AE', 'BG', 'CH', 'DJ'],
      hide: 'ABCDEGHJ',
      sides: [
        { a: 'A', b: 'B', t: d(a) },
        { a: 'B', b: 'C', t: 'x' },
        { a: 'C', b: 'D', t: d(e) },
        { a: 'E', b: 'G', t: d(p) },
        { a: 'G', b: 'H', t: d(q) },
        { a: 'H', b: 'J', t: 'y' },
      ],
      w: 340,
      maxH: 260,
    }),
    fields: [F('x =', x), F('y =', y)],
    hint: 'Evenwijdige lijnen snijden stukken af die in een verhoudingstabel passen.',
    steps: [
      H(T('Bij de figuur hoort de verhoudingstabel ') + vt([d(a), 'x', d(e)], [d(p), d(q), 'y'])),
      H(vt([d(a), 'x'], [d(p), d(q)]) + T(` geeft x = {${d(a)}*${d(q)}/${d(p)}} = ${d(x)}`)),
      H(vt([d(a), d(e)], [d(p), 'y']) + T(` geeft y = {${d(p)}*${d(e)}/${d(a)}} = ${d(y)}`)),
    ],
    v: () => near(a * q, p * x) && near(a * y, p * e),
  };
}

export default {
  id: '2.1',
  ch: 2,
  num: '2.1',
  title: 'Verhoudingstabellen',
  core: true,
  videos: [
    ['2.1 A Kruislings vermenigvuldigen', '18SFop_Itmg'],
    ['2.1 B Verhoudingstabellen met meer dan twee kolommen', 'hjC0AqJWgP8'],
    ['2.1 C Parallelprojecties en verhoudingstabellen', 'hEdnD9kUCfY'],
  ],
  skills: [
    ['Kruislings vermenigvuldigen', s21cross],
    ['Met een letter in haakjes', s21var],
    ['Tabel met drie kolommen', s21tab3],
    ['Verhaalsom', s21story],
    ['Evenwijdige lijnen', s21par],
  ],
  learn: [
    {
      t: 'Kruislings vermenigvuldigen',
      p: [
        'In een verhoudingstabel zijn de twee vermenigvuldigingen over het kruis gelijk. Daarmee reken je een onbekend getal uit.',
      ],
      ex: { q: vt(['6', 'x'], ['3', '5']), steps: ['3*x = 6*5', 'x = {6*5/3} = 10'] },
    },
    {
      t: 'Met een letter in de haakjes',
      ex: {
        q: vt(['x - 2', 'x + 2'], ['2', '3']),
        steps: ['3(x - 2) = 2(x + 2)', '3x - 6 = 2x + 4', 'x = 10'],
      },
    },
    {
      t: 'Evenwijdige lijnen',
      p: [
        'Snijden evenwijdige lijnen twee andere lijnen, dan passen de afgesneden stukken in een verhoudingstabel. Dat heet parallelprojectie. Schaduwen van de zon zijn daar een voorbeeld van.',
      ],
    },
  ],
};
