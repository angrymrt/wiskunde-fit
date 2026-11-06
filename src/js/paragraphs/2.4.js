// Paragraaf 2.4: Lengtes van lijnstukken berekenen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { geo } from '../figures.js';
import { pick, near, ap } from '../math.js';
import { s22comm } from './2.2.js';
import { H, RF, needRound, nestedFig } from './shared.js';
import { T, vt } from '../typeset.js';

function s24x() {
  for (let i = 0; i < 200; i++) {
    const db = pick([2, 3, 4, 5, 6, 8, 10]),
      de = pick([3, 4, 5, 6, 8, 9]),
      bc = pick([6, 7, 8, 10, 12, 14, 15]);
    if (bc - de < 2) continue;
    const x = (db * de) / (bc - de);
    // Is AD veel langer dan DB, dan lopen de letters in de figuur door elkaar.
    if (x < 1 || x > db * 4) continue;
    const ab = x + db,
      ac = ab * 1.05,
      f = [RF('x =', x)];
    // Een bijna platte driehoek is niet goed te lezen.
    if (ab + ac <= bc * 1.3 || Math.abs(ab - ac) >= bc) continue;
    return {
      q: T(
        `In △ABC is DE evenwijdig met BC. Gegeven is DB = ${db}, DE = ${de} en BC = ${bc}. Stel AD = x. Bereken x.${needRound(f)}`,
      ),
      fig: nestedFig(ab, bc, ac, x, {
        sides: [
          { a: 'A', b: 'D', t: 'x' },
          { a: 'D', b: 'B', t: db },
          { a: 'D', b: 'E', t: de, flip: true },
          { a: 'B', b: 'C', t: bc },
        ],
      }),
      fields: f,
      hint: T(
        `Als AD = x, dan is AB = x + ${db}. Zet dat in de verhoudingstabel en zet x + ${db} tussen haakjes.`,
      ),
      steps: [
        '∠A (in △ADE) = ∠A (in △ABC)',
        '∠ADE = ∠B (F-hoeken)',
        'Dus △ADE ∼ △ABC.',
        `Stel AD = x, dan is AB = x + ${db}.`,
        H(vt(['x', String(de)], [`x + ${db}`, String(bc)]) + T(` geeft ${bc}x = ${de}(x + ${db})`)),
        `${bc}x = ${de}x + ${de * db}`,
        `${bc - de}x = ${de * db}`,
        `x ${ap(x)}`,
        `Dus AD ${ap(x)}.`,
      ],
      traps: [
        {
          f: (v) => near(v[0], (db * de) / bc, 0.06),
          m: 'Je hebt voor AB alleen het stuk DB gebruikt. AB is x + DB.',
        },
      ],
      v: () => near(x * bc, de * (x + db)),
    };
  }
  return s22comm();
}
// Twee lijnstukken die elkaar snijden in S, met KL evenwijdig met MN.
function crossPts(p, q, t, x, s, angle) {
  const f = 0.2,
    u = [Math.cos(-f), Math.sin(-f)],
    v = [Math.cos(angle - f), Math.sin(angle - f)],
    at = (w, r) => [w[0] * r, w[1] * r];
  return { K: at(u, -x), M: at(u, t - x), L: at(v, -s), N: at(v, (s * q) / p), S: [0, 0] };
}
function s24sum() {
  for (let i = 0; i < 200; i++) {
    const p = pick([2, 3, 4, 6, 7, 8]),
      q = pick([2, 3, 4, 5, 6]),
      t = pick([6, 8, 9, 12, 14, 15, 18, 20]);
    if (p === q) continue;
    const x = (p * t) / (p + q),
      s = Math.max(x, p),
      angle = Math.acos((x * x + s * s - p * p) / (2 * x * s));
    if (angle < 0.5 || angle > 2.2) continue;
    const f = [RF('KS =', x)];
    return {
      q: T(
        `De lijnstukken KM en LN snijden elkaar in S. KL is evenwijdig met MN. Gegeven is KM = ${t}, KL = ${p} en MN = ${q}. Bereken KS.${needRound(f)}`,
      ),
      fig: geo({
        pts: crossPts(p, q, t, x, s, angle),
        segs: ['KM', 'LN', 'KL', 'MN'],
        sides: [
          { a: 'K', b: 'L', t: p },
          { a: 'M', b: 'N', t: q },
        ],
        w: 320,
        maxH: 240,
      }),
      fields: f,
      hint: T(`Je weet dat KS + MS = ${t}. Stel KS = x, dan is MS = ${t} - x.`),
      steps: [
        '∠K = ∠M (Z-hoeken)',
        '∠L = ∠N (Z-hoeken)',
        'Dus △KLS ∼ △MNS.',
        `Stel KS = x, dan is MS = ${t} - x.`,
        H(
          vt(['KL', 'KS'], ['MN', 'MS']) +
            T(' geeft ') +
            vt([String(p), 'x'], [String(q), `${t} - x`]),
        ),
        `${q}x = ${p}(${t} - x)`,
        `${q}x = ${p * t} - ${p}x`,
        `${p + q}x = ${p * t}`,
        `x ${ap(x)}`,
        `Dus KS ${ap(x)}.`,
      ],
      traps: [
        {
          f: (v) => near(v[0], t - x, 0.06),
          m: 'Dit is de lengte van MS. Kijk nog eens welk stuk je x hebt genoemd.',
        },
      ],
      v: () => near(q * x, p * (t - x)),
    };
  }
  return s24x();
}
function balkFig(ab, bc, h, as, at, sides) {
  const dx = bc * 0.6,
    dy = bc * 0.25;
  return geo({
    pts: {
      A: [0, 0],
      B: [ab, 0],
      C: [ab + dx, dy],
      D: [dx, dy],
      E: [0, h],
      F: [ab, h],
      G: [ab + dx, h + dy],
      H: [dx, h + dy],
      S: [-as, 0],
      T: [0, at],
    },
    segs: ['AB', 'BF', 'FE', 'EA', 'EH', 'HG', 'GF', 'BC', 'CG', 'SA', 'SF'],
    dash: ['AD', 'DC', 'DH'],
    sides,
    off: { T: [11, -9], F: [-11, -11] },
    w: 320,
    maxH: 280,
  });
}
// Is AS in de schets breed genoeg om de letters S en A en de lengte naast elkaar te zetten?
const fits = (as, ab, h) => as * Math.min(220 / (as + ab), 120 / h) >= 26;
// De schets van het voorvlak, los van de balk: die hoort bij de uitwerking.
const sketch = (ab, h, as, at, sides) =>
  H(
    geo({
      pts: { S: [-as, 0], A: [0, 0], B: [ab, 0], F: [ab, h], T: [0, at] },
      segs: ['SB', 'BF', 'SF', 'AT'],
      rights: [
        { at: 'A', p: 'B', q: 'T' },
        { at: 'B', p: 'A', q: 'F' },
      ],
      sides,
      w: 280,
      maxH: 180,
    }),
  );
function s24balk() {
  let ab, h, as;
  do {
    ab = pick([6, 8, 9, 10, 12]);
    h = pick([4, 6, 7, 8, 9]);
    as = pick([2, 3, 4, 5]);
  } while (!fits(as, ab, h));
  const bc = pick([3, 4, 5, 6]),
    sb = as + ab,
    at = (h * as) / sb,
    f = [RF('AT =', at)];
  return {
    q: T(
      `Gegeven is de balk ABCD.EFGH met AB = ${ab}, BC = ${bc} en AE = ${h}. Punt S ligt op het verlengde van ribbe BA, met AS = ${as}. Lijnstuk SF snijdt ribbe AE in punt T. Bereken AT.${needRound(f)}`,
    ),
    fig: balkFig(ab, bc, h, as, at, [
      { a: 'A', b: 'B', t: ab },
      { a: 'B', b: 'F', t: h },
      { a: 'S', b: 'A', t: as },
      { a: 'B', b: 'C', t: bc },
    ]),
    fields: f,
    hint: T(
      'AT is een zijde van △SAT. Schets het vlak waarin deze driehoek ligt. Dat is het voorvlak ABFE, met SB als onderkant.',
    ),
    steps: [
      'Schets het vlak waarin △SAT ligt.',
      sketch(ab, h, as, at, [
        { a: 'S', b: 'A', t: as },
        { a: 'A', b: 'B', t: ab },
        { a: 'B', b: 'F', t: h },
      ]),
      '∠S (in △SAT) = ∠S (in △SBF)',
      '∠A = ∠B (= 90°)',
      'Dus △SAT ∼ △SBF.',
      H(
        vt(['AT', 'SA'], ['BF', 'SB']) +
          T(' geeft ') +
          vt(['AT', String(as)], [String(h), String(sb)]),
      ),
      `AT = {${h}*${as}/${sb}} ${ap(at)}`,
    ],
    traps: [
      {
        f: (v) => near(v[0], (h * as) / ab, 0.06),
        m: 'Je hebt AB gebruikt, maar de zijde van de grote driehoek is SB. SB is SA + AB.',
      },
    ],
    v: () => near(at * sb, h * as),
  };
}
function s24balkx() {
  for (let i = 0; i < 200; i++) {
    const ab = pick([4, 5, 6, 8, 10]),
      bc = pick([3, 4, 5, 6]),
      h = pick([6, 8, 9, 10, 12]),
      at = pick([2, 3, 4, 5]),
      x = (at * ab) / (h - at);
    if (x < 1 || x > 12 || !fits(x, ab, h)) continue;
    const f = [RF('AS =', x)];
    return {
      q: T(
        `Gegeven is de balk ABCD.EFGH met AB = ${ab}, BC = ${bc} en AE = ${h}. Punt S ligt op het verlengde van ribbe BA. Lijnstuk SF snijdt ribbe AE in punt T, met AT = ${at}. Bereken AS.${needRound(f)}`,
      ),
      fig: balkFig(ab, bc, h, x, at, [
        { a: 'A', b: 'B', t: ab },
        { a: 'B', b: 'F', t: h },
        { a: 'B', b: 'C', t: bc },
      ]),
      fields: f,
      hint: T(`Schets het voorvlak ABFE. Stel AS = x, dan is SB = x + ${ab}.`),
      steps: [
        'Schets het vlak waarin △SAT ligt.',
        sketch(ab, h, x, at, [
          { a: 'S', b: 'A', t: 'x' },
          { a: 'A', b: 'B', t: ab },
          { a: 'B', b: 'F', t: h },
        ]),
        '∠S (in △SAT) = ∠S (in △SBF)',
        '∠A = ∠B (= 90°)',
        'Dus △SAT ∼ △SBF.',
        `Stel AS = x, dan is SB = x + ${ab}.`,
        H(
          vt(['AT', 'SA'], ['BF', 'SB']) +
            T(' geeft ') +
            vt([String(at), 'x'], [String(h), `x + ${ab}`]),
        ),
        `${h}x = ${at}(x + ${ab})`,
        `${h}x = ${at}x + ${at * ab}`,
        `${h - at}x = ${at * ab}`,
        `x ${ap(x)}`,
        `Dus AS ${ap(x)}.`,
      ],
      v: () => near(h * x, at * (x + ab)),
    };
  }
  return s24balk();
}

export default {
  id: '2.4',
  ch: 2,
  num: '2.4',
  title: 'Lengtes van lijnstukken berekenen',
  videos: {
    menno: [
      ['Een lengte x stellen', 'PdS3qjpN9gY'],
      ['Gelijkvormigheid bij ruimtefiguren', 'MGeexCYSuOI'],
    ],
    bob: [
      ['Een lengte x stellen', 'UorHPuOjZ90'],
      ['Gelijkvormige driehoeken in ruimtefiguren', 'tThkWlWtso8'],
    ],
  },
  skills: [
    ['Een lengte x stellen', s24x],
    ['Deel van een bekende lengte', s24sum],
    ['Balk', s24balk],
    ['Balk met x', s24balkx],
  ],
  learn: [
    {
      t: 'Een lengte x stellen',
      p: [
        'Soms ontbreekt een stuk dat je nodig hebt. Noem dat stuk x en druk de andere lengte uit in x. Daarna gebruik je de verhoudingstabel zoals altijd.',
      ],
      ex: {
        q: T('AD = x, DB = 4, DE = 3 en BC = 5. DE is evenwijdig met BC.'),
        steps: [
          'AB = x + 4',
          H(vt(['x', '3'], ['x + 4', '5'])),
          '5x = 3(x + 4)',
          '5x = 3x + 12',
          '2x = 12',
          'x = 6',
        ],
      },
      watch: T('Zet x + 4 tussen haakjes als je het vermenigvuldigt: 5x = 3(x + 4).'),
    },
    {
      t: 'Deel van een bekende lengte',
      p: [
        T(
          'Weet je de lengte van een heel lijnstuk en zoek je een deel ervan? Noem dat deel x. Het andere deel is dan de hele lengte min x. Is het hele stuk 12, dan is het andere deel 12 - x.',
        ),
      ],
    },
    {
      t: 'Ruimtefiguren',
      p: [
        'Zoek de zijde die je wilt weten en het platte vlak waarin die zijde ligt. Schets dat vlak los en schrijf de lengtes erbij. Vaak is dat een zijvlak van een balk of een kubus.',
        'Toon in de schets aan dat twee driehoeken gelijkvormig zijn. Daarna reken je zoals altijd met een verhoudingstabel.',
      ],
      watch: T(
        'Een ribbe van de balk hoort vaak maar bij een deel van de zijde. Tel de stukken op.',
      ),
    },
  ],
};
