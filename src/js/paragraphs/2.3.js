// Paragraaf 2.3: Gelijkvormigheid aantonen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { geo, angleFig } from '../figures.js';
import { ri, pick, coin, near, rd, isNice, d, ap } from '../math.js';
import { H, F, RF, needRound, MC, TRP, nestedPts, nestedFig } from './shared.js';
import { T, vt } from '../typeset.js';

// Meetkunde op de coördinaten van een figuur, om de redenen in een vraag na te rekenen.
const vec = (p, q) => [q[0] - p[0], q[1] - p[1]];
const dot = (u, w) => u[0] * w[0] + u[1] * w[1];
const cross = (u, w) => u[0] * w[1] - u[1] * w[0];
const angleAt = (p, v, q) => {
  const u = vec(v, p),
    w = vec(v, q);
  return Math.atan2(Math.abs(cross(u, w)), dot(u, w));
};
const parallel = (a, b, c, e) => near(cross(vec(a, b), vec(c, e)), 0);
const perpendicular = (a, b, c, e) => near(dot(vec(a, b), vec(c, e)), 0);
const between = (p, x, q) => near(cross(vec(p, x), vec(p, q)), 0) && dot(vec(x, p), vec(x, q)) < 0;
const sameSide = (p, q, a, b) => cross(vec(a, b), vec(a, p)) * cross(vec(a, b), vec(a, q)) > 0;

function s23kind() {
  const k = ri(0, 2);
  let f, ans;
  if (k === 0) {
    const p = ri(0, 3);
    f = angleFig(p, 0, p, 1);
    ans = 0;
  } else if (k === 1) {
    f = coin() ? angleFig(2, 0, 0, 1) : angleFig(3, 0, 1, 1);
    ans = 1;
  } else {
    const p = ri(0, 3),
      at = ri(0, 1);
    f = angleFig(p, at, (p + 2) % 4, at);
    ans = 2;
  }
  return {
    q: 'De twee horizontale lijnen zijn evenwijdig. Waarom zijn de twee gekleurde hoeken gelijk?',
    fig: f,
    mc: { opts: ['F-hoeken', 'Z-hoeken', 'Overstaande hoeken'], a: ans },
    hint: 'Overstaand: bij hetzelfde snijpunt, tegenover elkaar. F: bij twee verschillende snijpunten, aan dezelfde kant van de snijlijn en op dezelfde plek. Z: tussen de evenwijdige lijnen, aan weerskanten van de snijlijn.',
    steps: [
      [
        'Ze zitten bij twee verschillende snijpunten op dezelfde plek. Dat zijn F-hoeken.',
        'Ze liggen tussen de evenwijdige lijnen, aan weerskanten van de snijlijn. Dat zijn Z-hoeken.',
        'Ze zitten bij hetzelfde snijpunt, recht tegenover elkaar. Dat zijn overstaande hoeken.',
      ][ans],
    ],
    v: () => ans >= 0 && ans < 3,
  };
}
function s23why() {
  const k = ri(0, 2);
  if (k === 0) {
    const pts = { C: [0, 0], A: [-4, -1.3], B: [-1, -3], E: [6, 1.95], D: [1.5, 4.5] };
    return {
      q: T(
        'AB is evenwijdig met DE. De lijnstukken AE en BD snijden elkaar in C. Welke reden laat zien dat △ABC ∼ △EDC?',
      ),
      fig: geo({
        pts,
        segs: ['AE', 'BD', 'AB', 'DE'],
        tris: ['ABC', 'EDC'],
        off: { C: [-13, -14] },
        nums: [
          { at: 'C', t: 1, off: [-11, 11] },
          { at: 'C', t: 2, off: [12, -11] },
        ],
        w: 320,
        maxH: 250,
      }),
      mc: MC(
        [
          T('∠C_1 = ∠C_2 (overstaande hoeken) en ∠A = ∠E (Z-hoeken)'),
          T('∠C_1 = ∠C_2 (F-hoeken) en ∠A = ∠E (Z-hoeken)'),
          T('∠C_1 = ∠C_2 (overstaande hoeken) en ∠A = ∠D (Z-hoeken)'),
          T('∠C_1 = ∠C_2 (overstaande hoeken) en ∠A = ∠E (F-hoeken)'),
        ],
        0,
      ),
      hint: 'Bij een zandloperfiguur liggen de hoeken bij C tegenover elkaar, en liggen A en E in een Z tussen de evenwijdige lijnen.',
      steps: [
        '∠C_1 = ∠C_2 (overstaande hoeken)',
        '∠A = ∠E (Z-hoeken)',
        'Twee paar gelijke hoeken, dus △ABC ∼ △EDC.',
      ],
      v: () => {
        const { A, B, C, D, E } = pts;
        return (
          parallel(A, B, D, E) &&
          between(A, C, E) &&
          between(B, C, D) &&
          !sameSide(B, D, A, E) &&
          near(angleAt(A, C, B), angleAt(E, C, D)) &&
          near(angleAt(B, A, C), angleAt(D, E, C)) &&
          !near(angleAt(B, A, C), angleAt(C, D, E))
        );
      },
    };
  }
  if (k === 1) {
    const sizes = [8, 8, 7, 4];
    return {
      q: T(
        'In △ABC ligt D op AB en E op AC, met DE evenwijdig aan BC. Welke reden laat zien dat △ABC ∼ △ADE?',
      ),
      fig: nestedFig(...sizes, {}),
      mc: MC(
        [
          T('∠B = ∠D (F-hoeken) en ∠A is gemeenschappelijk'),
          T('∠B = ∠D (Z-hoeken) en ∠A is gemeenschappelijk'),
          T('∠B = ∠E (F-hoeken) en ∠A is gemeenschappelijk'),
          T('∠C = ∠D (F-hoeken) en ∠A is gemeenschappelijk'),
        ],
        0,
      ),
      hint: T(
        'De hoek bij A zit in allebei de driehoeken. Kijk welke hoek van de kleine driehoek op dezelfde plek zit als ∠B.',
      ),
      steps: ['∠A (in △ABC) = ∠A (in △ADE)', '∠B = ∠D (F-hoeken)', 'Dus △ABC ∼ △ADE.'],
      v: () => {
        const { A, B, C, D, E } = nestedPts(...sizes);
        return (
          between(A, D, B) &&
          between(A, E, C) &&
          parallel(D, E, B, C) &&
          sameSide(C, E, A, B) &&
          near(angleAt(A, B, C), angleAt(A, D, E)) &&
          !near(angleAt(A, B, C), angleAt(A, E, D)) &&
          !near(angleAt(A, C, B), angleAt(A, D, E))
        );
      },
    };
  }
  const pts = { A: [0, 0], B: [6.25, 0], D: [2.25, 0], C: [2.25, 3] };
  return {
    q: T('In △ABC is ∠C = 90°. CD staat loodrecht op AB. Welke reden laat zien dat △ABC ∼ △ACD?'),
    fig: geo({
      pts,
      segs: ['AB', 'BC', 'CA', 'CD'],
      rights: [
        { at: 'D', p: 'A', q: 'C' },
        { at: 'C', p: 'A', q: 'B' },
      ],
      w: 320,
      maxH: 220,
    }),
    mc: MC(
      [
        T('∠A is gemeenschappelijk en ∠C (in △ABC) = ∠D (= 90°)'),
        T('∠B is gemeenschappelijk en ∠C (in △ABC) = ∠D (= 90°)'),
        T('∠A is gemeenschappelijk en ∠B = ∠D (= 90°)'),
        T('∠A is gemeenschappelijk en ∠C = ∠D (Z-hoeken)'),
      ],
      0,
    ),
    hint: T(
      'Welke hoek zit in allebei de driehoeken △ABC en △ACD? En waar zitten de rechte hoeken?',
    ),
    steps: ['∠A (in △ABC) = ∠A (in △ACD)', '∠C (in △ABC) = ∠D (= 90°)', 'Dus △ABC ∼ △ACD.'],
    v: () => {
      const { A, B, C, D } = pts;
      return (
        perpendicular(C, A, C, B) &&
        perpendicular(D, C, A, B) &&
        between(A, D, B) &&
        !near(angleAt(A, B, C), Math.PI / 2)
      );
    },
  };
}
function s23x() {
  const ab = pick([9, 10, 12, 16, 18, 21]),
    bc = pick([4, 5, 6, 8, 10]),
    k = pick([1.5, 2, 2.5, 3, 1.2, 0.8]),
    dc = rd(bc * k, 1),
    de = (ab * dc) / bc,
    f = [RF('RS =', de)];
  return {
    q: T(
      `PS en QR snijden elkaar in T. ∠Q = ∠R = 90°, PQ = ${ab}, QT = ${bc} en RT = ${d(dc)}. Bereken RS.${needRound(f)}`,
    ),
    fig: geo({
      pts: { T: [0, 0], Q: [0, -bc], P: [-ab, -bc], R: [0, dc], S: [de, dc] },
      segs: ['PS', 'QR', 'PQ', 'RS'],
      tris: ['PQT', 'SRT'],
      rights: [
        { at: 'Q', p: 'P', q: 'T' },
        { at: 'R', p: 'T', q: 'S' },
      ],
      off: { T: [-13, -9] },
      sides: [
        { a: 'P', b: 'Q', t: ab },
        { a: 'Q', b: 'T', t: bc },
        { a: 'R', b: 'T', t: d(dc) },
      ],
      w: 360,
      maxH: 280,
    }),
    fields: f,
    hint: 'Toon eerst aan dat de driehoeken gelijkvormig zijn met twee paar gelijke hoeken. Zet ze daarna in een verhoudingstabel.',
    steps: [
      '∠Q = ∠R (= 90°)',
      '∠P = ∠S (Z-hoeken)',
      'Dus △PQT ∼ △SRT.',
      H(
        vt(['PQ', 'QT', 'PT'], ['SR', 'RT', 'ST']) +
          T(' geeft ') +
          vt([String(ab), String(bc), 'PT'], ['SR', d(dc), 'ST']),
      ),
      H(
        vt([String(ab), String(bc)], ['SR', d(dc)]) +
          T(` geeft RS = {${ab}*${d(dc)}/${bc}} ${ap(de)}`),
      ),
    ],
    traps: [
      {
        f: (v) => near(v[0], (ab * bc) / dc, 0.06),
        m: 'Controleer de volgorde in de tabel. PQ hoort bij SR en QT hoort bij RT.',
      },
    ],
    v: () => near(de / ab, dc / bc, 1e-6),
  };
}
function s23shadow() {
  if (coin()) {
    const hv = pick([1.5, 1.6, 1.7, 1.8, 1.9]),
      vs = pick([1.2, 2, 2.4, 2.5, 3]),
      bs = pick([15, 20, 24, 30, 36, 40]),
      tb = (hv * bs) / vs,
      f = [RF('AB =', tb, 1, 'meter')];
    return {
      q: T(
        `Een persoon CD van ${d(hv)} meter heeft een schaduw DE van ${d(vs)} meter. Op hetzelfde moment heeft een toren AB een schaduw BE van ${bs} meter. Bereken de hoogte van de toren.${needRound(f)} De figuur is niet op schaal.`,
      ),
      fig: geo({
        pts: { A: [0, 4], B: [0, 0], E: [8, 0], C: [5.8, 1.1], D: [5.8, 0] },
        segs: ['AB', 'BE', 'EA', 'CD'],
        rights: [
          { at: 'B', p: 'A', q: 'E' },
          { at: 'D', p: 'C', q: 'E' },
        ],
        w: 340,
        maxH: 230,
        off: { D: [0, 16], C: [-2, -15] },
        sides: [
          { a: 'C', b: 'D', t: d(hv), flip: true },
          { a: 'D', b: 'E', t: d(vs) },
          { a: 'B', b: 'E', t: bs },
        ],
      }),
      fields: f,
      hint: T('△CDE en △ABE hebben ∠E gemeenschappelijk en allebei een rechte hoek.'),
      steps: [
        '∠D = ∠B (= 90°)',
        '∠E (in △CDE) = ∠E (in △ABE)',
        'Dus △CDE ∼ △ABE.',
        H(vt(['CD', 'DE'], ['AB', 'BE']) + T(' geeft ') + vt([d(hv), d(vs)], ['AB', String(bs)])),
        `AB = {${d(hv)}*${bs}/${d(vs)}} ${ap(tb)}`,
        `De toren is ${isNice(tb, 1) ? '' : 'ongeveer '}${d(rd(tb, 1))} meter hoog.`,
      ],
      v: () => near(tb / bs, hv / vs, 1e-6),
    };
  }
  const ac = pick([1.5, 1.6, 1.7, 1.8]),
    ab = pick([2, 2.5, 3, 4, 5]),
    bd = pick([20, 24, 30, 40, 50, 60]),
    de = (ac * bd) / ab,
    f = [RF('ST =', de, 1, 'meter')];
  return {
    q: T(
      `Iemand staat op P met de ogen Q op ${d(ac)} meter hoogte en ziet in een spiegel op R de top T van een vuurtoren. PR = ${d(ab)} meter en RS = ${bd} meter. Bereken de hoogte ST.${needRound(f)} De figuur is niet op schaal.`,
    ),
    fig: geo({
      pts: { P: [0, 0], R: [2.5, 0], S: [8, 0], Q: [0, 1.6], T: [8, 3.52] },
      segs: ['PS', 'PQ', 'QR', 'RT', 'TS'],
      rights: [
        { at: 'P', p: 'R', q: 'Q' },
        { at: 'S', p: 'R', q: 'T' },
      ],
      arcs: [
        { at: 'R', p: 'P', q: 'Q', n: 1, c: 1 },
        { at: 'R', p: 'S', q: 'T', n: 1, c: 1 },
      ],
      w: 380,
      maxH: 220,
      sides: [
        { a: 'P', b: 'Q', t: d(ac) },
        { a: 'P', b: 'R', t: d(ab) },
        { a: 'R', b: 'S', t: bd },
      ],
    }),
    fields: f,
    hint: T('Bij een spiegel zijn de twee hoeken bij R gelijk. Er zijn ook twee rechte hoeken.'),
    steps: [
      '∠R (in △PRQ) = ∠R (in △SRT) (gegeven)',
      '∠P = ∠S (= 90°)',
      'Dus △PRQ ∼ △SRT.',
      H(vt(['PR', 'PQ'], ['SR', 'ST']) + T(' geeft ') + vt([d(ab), d(ac)], [String(bd), 'ST'])),
      `ST = {${bd}*${d(ac)}/${d(ab)}} ${ap(de)}`,
      `De vuurtoren is ${isNice(de, 1) ? '' : 'ongeveer '}${d(rd(de, 1))} meter hoog.`,
    ],
    v: () => near(de / bd, ac / ab, 1e-6),
  };
}
function s23alt() {
  const [a, b, c] = pick(TRP),
    AC = a,
    BC = b,
    AB = c,
    ad = (AC * AC) / AB,
    f = [F('AB =', AB), RF('AD =', ad)];
  return {
    q: T(
      `In △ABC is ∠C = 90°, AC = ${AC} en BC = ${BC}. CD staat loodrecht op AB. Bereken AB en AD.${needRound(f)}`,
    ),
    fig: geo({
      pts: { A: [0, 0], B: [AB, 0], D: [ad, 0], C: [ad, (AC * BC) / AB] },
      segs: ['AB', 'BC', 'CA', 'CD'],
      rights: [
        { at: 'D', p: 'B', q: 'C' },
        { at: 'C', p: 'A', q: 'B' },
      ],
      sides: [
        { a: 'A', b: 'C', t: AC },
        { a: 'B', b: 'C', t: BC },
      ],
      w: 340,
      maxH: 220,
    }),
    fields: f,
    hint: T('AB vind je met Pythagoras. Daarna gebruik je △ABC ∼ △ACD.'),
    steps: [
      `∠C = 90°, dus AC^2 + BC^2 = AB^2`,
      `${AC}^2 + ${BC}^2 = AB^2`,
      `AB^2 = ${AB * AB}, dus AB = ${AB}`,
      '∠A (in △ABC) = ∠A (in △ACD)',
      '∠C (in △ABC) = ∠D (= 90°)',
      'Dus △ABC ∼ △ACD.',
      H(
        vt(['AB', 'BC', 'AC'], ['AC', 'CD', 'AD']) +
          T(' geeft ') +
          vt([String(AB), String(BC), String(AC)], [String(AC), 'CD', 'AD']),
      ),
      H(
        vt([String(AB), String(AC)], [String(AC), 'AD']) +
          T(` geeft AD = {${AC}*${AC}/${AB}} ${ap(ad)}`),
      ),
    ],
    v: () => a * a + b * b === c * c && near(ad / AC, AC / AB),
  };
}

export default {
  id: '2.3',
  ch: 2,
  num: '2.3',
  title: 'Gelijkvormigheid aantonen',
  videos: {
    menno: [
      ['Gelijkvormige driehoeken aantonen', 'v82_TCJTSks'],
      ['Gelijke hoeken zoeken', 'cqP_DHCfdy8'],
    ],
    bob: [
      ['Gelijkvormige driehoeken aantonen', 'ghmQ7N--bFA'],
      ['Gelijke hoeken zoeken', 'lx8uuYjVNMc'],
    ],
  },
  skills: [
    ['F, Z of overstaand', s23kind],
    ['De juiste reden', s23why],
    ['Zandloperfiguur', s23x],
    ['Schaduw en spiegel', s23shadow],
    ['Hoogtelijn', s23alt],
  ],
  learn: [
    {
      t: 'Twee paar gelijke hoeken is genoeg',
      p: [
        'De som van de hoeken in een driehoek is 180°. Zijn twee paar hoeken gelijk, dan is het derde paar dat ook. Je hoeft dus maar twee paar te noemen.',
      ],
    },
    {
      t: 'Gelijke hoeken vinden',
      p: [
        'Kies hieronder een soort hoek en bekijk waar de gelijke hoeken zitten.',
        'Denk ook aan de twee gelijke hoeken in een gelijkbenige driehoek, en aan rechte hoeken.',
      ],
      widget: 'angles',
    },
    {
      t: 'Zo schrijf je het op',
      ex: {
        q: T('PQ is evenwijdig met RS en PS en QR snijden elkaar in T.'),
        steps: ['∠T_1 = ∠T_2 (overstaande hoeken)', '∠P = ∠S (Z-hoeken)', 'Dus △PQT ∼ △SRT.'],
      },
      watch: T(
        'Zet altijd de reden erbij: gegeven, F-hoeken, Z-hoeken, overstaande hoeken of (= 90°). Een hoek die in beide driehoeken zit noteer je als ∠A (in △ABC) = ∠A (in △ADE).',
      ),
    },
  ],
};
