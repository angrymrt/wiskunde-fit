// Paragraaf 2.4: Lengtes van lijnstukken berekenen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { geo } from '../figures.js';
import { pick, near, ap, isNice, d, lin } from '../math.js';
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
// Een kubus met S op het verlengde van BA en V op het verlengde van BC.
// SV ligt in het grondvlak: wat achter de kubus langs loopt, is gestippeld. X en Y zijn de hulppunten daarvoor.
function kubusFig(r, as, at, cv) {
  const dx = r * 0.6,
    dy = r * 0.25,
    k = 1 + cv / r,
    V = [r + dx * k, dy * k],
    up = V[1] / (V[0] + as);
  return geo({
    pts: {
      A: [0, 0],
      B: [r, 0],
      C: [r + dx, dy],
      D: [dx, dy],
      E: [0, r],
      F: [r, r],
      G: [r + dx, r + dy],
      H: [dx, r + dy],
      S: [-as, 0],
      T: [0, at],
      V,
      X: [0, as * up],
      Y: [r + dx, (r + dx + as) * up],
    },
    segs: ['AB', 'BF', 'FE', 'EA', 'EH', 'HG', 'GF', 'BC', 'CG', 'SA', 'SF', 'CV', 'SX', 'YV'],
    dash: ['AD', 'DC', 'DH', 'XY'],
    hide: 'XY',
    sides: [
      { a: 'A', b: 'B', t: r },
      { a: 'A', b: 'T', t: at, flip: true },
      { a: 'C', b: 'V', t: cv, flip: true },
    ],
    off: { T: [-11, -9], F: [-11, -11], D: [9, -11] },
    w: 320,
    maxH: 300,
  });
}
function s24cube() {
  for (let i = 0; i < 200; i++) {
    const r = pick([4, 6, 8, 10, 12]),
      at = pick([2, 3, 4, 5, 6]),
      cv = pick([2, 3, 4, 5, 6]);
    if (at >= r || cv < r * 0.3 || cv > r * 0.7) continue;
    const x = (at * r) / (r - at);
    // AS is een tussenstap voor SV. Daarom moet AS mooi uitkomen, anders telt de afronding door.
    // Is AS veel korter of langer dan de ribbe, dan is de figuur niet goed te lezen.
    if (!isNice(x, 1) || x < r * 0.4 || x > r * 1.25 || !fits(x, r, r)) continue;
    const sb = x + r,
      bv = r + cv,
      sum = sb * sb + bv * bv,
      sv = Math.sqrt(sum),
      f = [RF('AS =', x), RF('SV =', sv)];
    return {
      q: T(
        `Gegeven is de kubus ABCD.EFGH met ribben van lengte ${r}. Punt S ligt op het verlengde van ribbe BA. Lijnstuk SF snijdt ribbe AE in punt T, met AT = ${at}. Punt V ligt op het verlengde van ribbe BC, met CV = ${cv}. Bereken AS en SV.${needRound(f)}`,
      ),
      fig: kubusFig(r, x, at, cv),
      fields: f,
      hint: T(
        `Schets eerst het voorvlak ABFE en stel AS = x. Dan is SB = x + ${r}. SV is een zijde van △SBV in het grondvlak, en daarin is ∠B = 90°.`,
      ),
      steps: [
        'Schets het vlak waarin △SAT ligt.',
        sketch(r, r, x, at, [
          { a: 'S', b: 'A', t: 'x' },
          { a: 'A', b: 'B', t: r },
          { a: 'B', b: 'F', t: r },
        ]),
        '∠S (in △SAT) = ∠S (in △SBF)',
        '∠A = ∠B (= 90°)',
        'Dus △SAT ∼ △SBF.',
        `Stel AS = x, dan is SB = x + ${r}.`,
        H(
          vt(['AT', 'SA'], ['BF', 'SB']) +
            T(' geeft ') +
            vt([String(at), 'x'], [String(r), `x + ${r}`]),
        ),
        `${r}x = ${at}(x + ${r})`,
        `${r}x = ${at}x + ${at * r}`,
        ...(r - at === 1 ? [] : [`${lin(r - at, 0)} = ${at * r}`]),
        `x ${ap(x)}`,
        `Dus AS ${ap(x)}.`,
        `SV ligt in het grondvlak. In △SBV is SB = ${d(sb)} en BV = ${r} + ${cv} = ${bv}.`,
        '∠B = 90°, dus SB^2 + BV^2 = SV^2',
        `SV^2 = ${d(sb)}^2 + ${bv}^2 = ${d(sum)}`,
        `SV = √${d(sum)} ${ap(sv)}`,
      ],
      traps: [
        {
          f: (v) => near(v[0], at) || near(v[0], (at * r) / (r + at), 0.06),
          m: 'Stel AS = x. De onderkant van de grote driehoek is dan x plus de ribbe, dus niet alleen de ribbe.',
        },
        {
          f: (v) => near(v[0], x, 0.06) && near(v[1], Math.sqrt(x * x + bv * bv), 0.06),
          m: 'AS klopt. Voor SV heb je de hele zijde SB nodig. Dat is AS plus de ribbe.',
        },
      ],
      v: () => near(r * x, at * (x + r)) && near(sv * sv, (x + r) ** 2 + (r + cv) ** 2),
    };
  }
  return s24balkx();
}
// Rechthoek PQRS: lijn PT snijdt het verlengde van QR in U.
function s24rect() {
  for (let i = 0; i < 200; i++) {
    const w = pick([6, 8, 9, 10, 12]),
      h = pick([3, 4, 5, 6]),
      c = pick([2, 3, 4]),
      rt = (w * c) / (h + c);
    // RT is een tussenstap voor PT. Daarom moet RT mooi uitkomen, anders telt de afronding door.
    if (!isNice(rt, 1)) continue;
    const st = w - rt,
      sum = h * h + st * st,
      pt = Math.sqrt(sum),
      f = [RF('RT =', rt), RF('PT =', pt)];
    return {
      q: T(
        `PQRS is een rechthoek met PQ = ${w} en QR = ${h}. Punt U ligt op het verlengde van QR, met RU = ${c}. Lijnstuk PU snijdt zijde RS in punt T. Bereken RT en PT.${needRound(f)}`,
      ),
      fig: geo({
        pts: { P: [0, 0], Q: [w, 0], R: [w, h], S: [0, h], T: [st, h], U: [w, h + c] },
        segs: ['PQ', 'QU', 'RS', 'SP', 'PU'],
        rights: [
          { at: 'Q', p: 'P', q: 'R' },
          { at: 'R', p: 'S', q: 'U' },
        ],
        sides: [
          { a: 'P', b: 'Q', t: w },
          { a: 'Q', b: 'R', t: h },
          { a: 'R', b: 'U', t: c },
        ],
        off: { T: [-4, -12], R: [14, 6] },
        w: 320,
        maxH: 260,
      }),
      fields: f,
      hint: T(
        `Zoek twee gelijkvormige driehoeken met een hoek bij U. QU = ${h} + ${c} = ${h + c}. Voor PT gebruik je de stelling van Pythagoras in △PST.`,
      ),
      steps: [
        '∠U (in △TRU) = ∠U (in △PQU)',
        '∠R = ∠Q (= 90°)',
        'Dus △TRU ∼ △PQU.',
        `QU = ${h} + ${c} = ${h + c}`,
        H(
          vt(['RT', 'RU'], ['QP', 'QU']) +
            T(' geeft ') +
            vt(['RT', String(c)], [String(w), String(h + c)]),
        ),
        `RT = {${w}*${c}/${h + c}} ${ap(rt)}`,
        `ST = ${w} - ${d(rt)} = ${d(st)}`,
        '∠S = 90°, dus PS^2 + ST^2 = PT^2',
        `PT^2 = ${h}^2 + ${d(st)}^2 = ${d(sum)}`,
        `PT = √${d(sum)} ${ap(pt)}`,
      ],
      traps: [
        {
          f: (v) => near(v[0], (w * c) / h, 0.06),
          m: 'Je hebt QR gebruikt, maar de zijde van de grote driehoek is QU. QU is QR + RU.',
        },
        {
          f: (v) => near(v[0], rt, 0.06) && near(v[1], Math.sqrt(h * h + rt * rt), 0.06),
          m: 'RT klopt. In △PST heb je ST nodig, en dat is PQ min RT.',
        },
      ],
      v: () => near(rt * (h + c), w * c) && near(pt * pt, h * h + (w - rt) * (w - rt)),
    };
  }
  return s24balk();
}
// Parallellogram PQRS: lijn PT snijdt het verlengde van QR in U. PS en RU zijn evenwijdig.
function s24par() {
  for (let i = 0; i < 200; i++) {
    const a = pick([6, 8, 9, 10, 12]),
      b = pick([3, 4, 5, 6]),
      s = pick([3, 4, 5, 6, 8]),
      rt = a - s,
      ru = (b * rt) / s;
    // Is RU veel langer dan QR, dan past de figuur niet meer goed op het scherm.
    if (rt < 2 || ru > 2 * b) continue;
    const dx = b * 0.45,
      h = b * 0.89,
      f = [RF('RU =', ru)];
    return {
      q: T(
        `PQRS is een parallellogram met PQ = ${a} en QR = ${b}. Punt T ligt op zijde RS, met ST = ${s}. Lijnstuk PT snijdt het verlengde van QR in punt U. Bereken RU.${needRound(f)}`,
      ),
      fig: geo({
        pts: {
          P: [0, 0],
          Q: [a, 0],
          R: [a + dx, h],
          S: [dx, h],
          T: [dx + s, h],
          U: [a + dx + (dx * ru) / b, h + (h * ru) / b],
        },
        segs: ['PQ', 'QU', 'RS', 'SP', 'PU'],
        sides: [
          { a: 'P', b: 'Q', t: a },
          { a: 'Q', b: 'R', t: b },
          { a: 'S', b: 'T', t: s },
        ],
        off: { T: [-10, 15], R: [14, 8] },
        w: 320,
        maxH: 260,
      }),
      fields: f,
      hint: T(
        `PS is evenwijdig met RU, dus zoek Z-hoeken. Bij T zie je overstaande hoeken. RT = ${a} - ${s} = ${rt}.`,
      ),
      steps: [
        '∠SPT = ∠U (Z-hoeken)',
        '∠STP = ∠RTU (overstaande hoeken)',
        'Dus △PST ∼ △URT.',
        `RS = PQ = ${a}, dus RT = ${a} - ${s} = ${rt}.`,
        `In een parallellogram is PS = QR = ${b}.`,
        H(
          vt(['PS', 'ST'], ['RU', 'RT']) +
            T(' geeft ') +
            vt([String(b), String(s)], ['RU', String(rt)]),
        ),
        `RU = {${b}*${rt}/${s}} ${ap(ru)}`,
      ],
      traps: [
        {
          f: (v) => near(v[0], (b * a) / s, 0.06),
          m: 'Je hebt de hele zijde RS gebruikt. In de kleine driehoek zit alleen RT. Dat is RS min ST.',
        },
        {
          f: (v) => near(v[0], (b * s) / rt, 0.06),
          m: 'Je hebt de verhouding omgedraaid. Bij S hoort PS en bij R hoort RU, dus PS en ST staan samen in een rij.',
        },
      ],
      v: () => near(ru * s, b * (a - s)),
    };
  }
  return s24x();
}
// Twee eigen verhalen: de gekruiste poten van een klaptafel, en een kabel over een paal.
function tableStory() {
  for (let i = 0; i < 200; i++) {
    const w = pick([60, 70, 80, 90, 100]),
      f = pick([40, 50, 60, 70]),
      L = pick([60, 70, 80, 90, 100]),
      half = (w + f) / 2;
    if (w === f || half > L * 0.9) continue;
    const x = (L * w) / (w + f),
      h = Math.sqrt(L * L - half * half),
      out = (w - f) / 2,
      r = [RF('PS =', x, 1, 'cm')];
    return {
      q: T(
        `Een klaptafel heeft twee rechte poten PR en QT die elkaar kruisen in punt S. Elke poot is ${L} cm lang. Bovenaan zitten de poten vast aan het tafelblad, op ${w} cm van elkaar. Op de vloer staan ze ${f} cm uit elkaar. Het tafelblad is evenwijdig met de vloer. Bereken PS.${needRound(r)}`,
      ),
      fig: geo({
        pts: {
          P: [0, h],
          Q: [w, h],
          T: [out, 0],
          R: [out + f, 0],
          S: [w / 2, (h * f) / (w + f)],
        },
        segs: ['PQ', 'TR', 'PR', 'QT'],
        sides: [
          { a: 'P', b: 'Q', t: w },
          { a: 'T', b: 'R', t: f },
        ],
        off: { S: [17, 0] },
        w: 300,
        maxH: 220,
      }),
      fields: r,
      hint: T(`Stel PS = x. De hele poot is ${L}, dus RS = ${L} - x.`),
      steps: [
        '∠P = ∠R (Z-hoeken)',
        '∠Q = ∠T (Z-hoeken)',
        'Dus △PQS ∼ △RTS.',
        `Stel PS = x, dan is RS = ${L} - x.`,
        H(
          vt(['PQ', 'PS'], ['RT', 'RS']) +
            T(' geeft ') +
            vt([String(w), 'x'], [String(f), `${L} - x`]),
        ),
        `${f}x = ${w}(${L} - x)`,
        `${f}x = ${w * L} - ${w}x`,
        `${f + w}x = ${w * L}`,
        `x ${ap(x)}`,
        `Dus PS ${ap(x)} cm.`,
      ],
      traps: [
        {
          f: (v) => near(v[0], L - x, 0.06),
          m: 'Dit is de lengte van RS. Kijk nog eens welk stuk je x hebt genoemd.',
        },
      ],
      v: () => near(f * x, w * (L - x)) && near(Math.hypot(half, h), L),
    };
  }
  return s24sum();
}
function cableStory() {
  for (let i = 0; i < 200; i++) {
    const h1 = pick([2, 3, 4, 5]),
      h2 = pick([6, 8, 10, 12]),
      dist = pick([6, 8, 9, 10, 12, 15]),
      x = (h1 * dist) / (h2 - h1);
    if (x < 2 || x > 25) continue;
    const f = [RF('KL =', x, 1, 'meter')];
    return {
      q: T(
        `Een strakke kabel loopt in een rechte lijn van punt K op de grond naar de top R van een mast. De kabel rust op de top M van een paal. De paal LM is ${h1} meter hoog en de mast NR is ${h2} meter hoog. Paal en mast staan loodrecht op de grond, op ${dist} meter van elkaar. Stel KL = x en bereken KL.${needRound(f)}`,
      ),
      fig: geo({
        pts: { K: [0, 0], L: [x, 0], M: [x, h1], N: [x + dist, 0], R: [x + dist, h2] },
        segs: ['KN', 'NR', 'KR', 'LM'],
        rights: [
          { at: 'L', p: 'N', q: 'M' },
          { at: 'N', p: 'K', q: 'R' },
        ],
        sides: [
          { a: 'L', b: 'M', t: h1, flip: true },
          { a: 'N', b: 'R', t: h2 },
          { a: 'L', b: 'N', t: dist },
          { a: 'K', b: 'L', t: 'x' },
        ],
        off: { M: [-6, -12] },
        w: 320,
        maxH: 240,
      }),
      fields: f,
      hint: T(`Als KL = x, dan is KN = x + ${dist}. Zet dat in de verhoudingstabel.`),
      steps: [
        '∠K (in △KLM) = ∠K (in △KNR)',
        '∠L = ∠N (= 90°)',
        'Dus △KLM ∼ △KNR.',
        `Stel KL = x, dan is KN = x + ${dist}.`,
        H(
          vt(['KL', 'LM'], ['KN', 'NR']) +
            T(' geeft ') +
            vt(['x', String(h1)], [`x + ${dist}`, String(h2)]),
        ),
        `${h2}x = ${h1}(x + ${dist})`,
        `${h2}x = ${h1}x + ${h1 * dist}`,
        `${h2 - h1}x = ${h1 * dist}`,
        `x ${ap(x)}`,
        `Dus KL ${ap(x)} meter.`,
      ],
      traps: [
        {
          f: (v) => near(v[0], (h1 * dist) / h2, 0.06),
          m: 'Je hebt voor KN alleen de afstand tussen paal en mast gebruikt. KN is x plus die afstand.',
        },
      ],
      v: () => near(h2 * x, h1 * (x + dist)),
    };
  }
  return tableStory();
}
const s24story = () => pick([tableStory, cableStory])();

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
    [58, 'Een lengte x stellen', s24x],
    [59, 'Deel van een bekende lengte', s24sum],
    [60, 'Balk', s24balk],
    [61, 'Balk met x', s24balkx],
    [62, 'Kubus', s24cube],
    [63, 'Rechthoek', s24rect],
    [64, 'Parallellogram', s24par],
    [65, 'Lengte uit een verhaal', s24story],
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
      t: 'Rechthoek en parallellogram',
      p: [
        'Snijdt een lijn een zijde en het verlengde van een andere zijde, dan krijg je twee gelijkvormige driehoeken. Bij een rechthoek gebruik je vaak de gedeelde hoek en de rechte hoeken. Bij een parallellogram gebruik je vaak Z-hoeken en overstaande hoeken.',
      ],
      watch: T(
        'In een rechthoek en een parallellogram zijn de overstaande zijden even lang. Zo vind je ook de lengte van een zijde die niet is gegeven.',
      ),
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
