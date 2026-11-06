// Paragraaf 2.4: Een lengte x stellen en ruimtefiguren. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { geo } from '../figures.js';
import { pick, near, isNice, d, ap } from '../math.js';
import { s22comm } from './2.2.js';
import { H, F, RF, needRound, nestedFig } from './shared.js';
import { T, vt } from '../typeset.js';

function s24x() {
  for (let i = 0; i < 200; i++) {
    const db = pick([2, 3, 4, 5, 6, 8, 10]),
      de = pick([3, 4, 5, 6, 8, 9]),
      bc = pick([6, 7, 8, 10, 12, 14, 15]);
    if (bc <= de) continue;
    const x = (db * de) / (bc - de);
    if (!isNice(x, 1) || x < 1 || x > 30) continue;
    const ab = x + db,
      ac = ab * 1.05,
      f = [F('x =', x)];
    if (ab + ac <= bc || Math.abs(ab - ac) >= bc) continue;
    return {
      q: T(
        `In △ABC is DE evenwijdig met BC. Gegeven is DB = ${db}, DE = ${de} en BC = ${bc}. Stel AD = x. Bereken x.`,
      ),
      fig: nestedFig(ab, bc, ac, x, {
        sides: [
          { a: 'A', b: 'D', t: 'x' },
          { a: 'D', b: 'B', t: db },
          { a: 'D', b: 'E', t: de, flip: false },
          { a: 'B', b: 'C', t: bc },
        ],
      }),
      fields: f,
      hint: T(
        `Als AD = x, dan is AB = x + ${db}. Zet dat in de verhoudingstabel en vermenigvuldig kruislings.`,
      ),
      steps: [
        `Stel AD = x, dan is AB = x + ${db}.`,
        '△ADE ∼ △ABC',
        H(vt(['x', String(de)], [`x + ${db}`, String(bc)]) + T(` geeft ${bc}x = ${de}(x + ${db})`)),
        `${bc}x = ${de}x + ${de * db}`,
        `${bc - de}x = ${de * db}`,
        `x = ${d(x)}`,
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
function pyrFig(H0, hs) {
  const b = [
      [0, 0],
      [6, 0],
      [8, 2.2],
      [2, 2.2],
    ],
    top = [4, 1.1 + 6.2];
  const f = hs / H0;
  const lift = (p) => [p[0] + (top[0] - p[0]) * f, p[1] + (top[1] - p[1]) * f];
  const [P, Q, R2, U] = b.map(lift);
  return geo({
    pts: { A: b[0], B: b[1], C: b[2], Y: b[3], T: top, P, Q, R: R2, U },
    segs: ['AB', 'BC', 'AT', 'BT', 'CT', 'PQ', 'QR'],
    dash: ['CY', 'AY', 'YT', 'RU', 'UP'],
    hide: 'YRU',
    w: 280,
    maxH: 290,
  });
}
function s24pyr() {
  const ab = pick([6, 8, 10, 12, 15]),
    H0 = pick([8, 10, 12, 15, 16, 20]),
    hs = pick([2, 3, 4, 5, 6]);
  if (hs >= H0) return s24pyr();
  const top = H0 - hs,
    pq = (ab * top) / H0,
    f = [RF('PQ =', pq)];
  return {
    q: T(
      `Van de piramide T.ABCD is het grondvlak een vierkant met AB = ${ab}. De top T ligt ${H0} boven het grondvlak. Op hoogte ${hs} wordt de piramide doorgesneden, evenwijdig aan het grondvlak. Daardoor ontstaat lijnstuk PQ evenwijdig aan AB. Bereken PQ.${needRound(f)}`,
    ),
    fig: pyrFig(H0, hs),
    fields: f,
    hint: T(
      `De kleine piramide bovenop heeft hoogte ${H0} - ${hs} = ${top}. Lengtes in de kleine en grote piramide passen in een verhoudingstabel.`,
    ),
    steps: [
      '△TPQ ∼ △TAB',
      `De hoogte van T boven PQ is ${H0} - ${hs} = ${top}.`,
      H(
        vt(['PQ', 'hoogte klein'], ['AB', 'hoogte groot']) +
          T(' geeft ') +
          vt(['PQ', String(top)], [String(ab), String(H0)]),
      ),
      `PQ = {${ab}*${top}/${H0}} ${ap(pq)}`,
    ],
    traps: [
      {
        f: (v) => near(v[0], (ab * hs) / H0, 0.06),
        m: 'Je hebt de hoogte vanaf het grondvlak gebruikt. Neem de hoogte vanaf de top T.',
      },
    ],
    v: () => near(pq / ab, top / H0),
  };
}
function s24cone() {
  const R = pick([3, 4, 5, 6, 8, 9, 10]),
    H0 = pick([9, 10, 12, 15, 16, 18, 20]),
    w = pick([3, 4, 5, 6, 8]);
  if (w >= H0) return s24cone();
  const r = (R * w) / H0,
    f = [RF('straal =', r, 1, 'cm')];
  return {
    q: T(
      `Een kegelvormig glas staat met de punt naar beneden. De bovenrand heeft straal ${R} cm en het glas is ${H0} cm hoog. Er staat ${w} cm water in, gemeten vanaf de punt. Bereken de straal van het wateroppervlak.${needRound(f)}`,
    ),
    fig: geo({
      pts: { T: [0, 0], A: [-R, H0], B: [R, H0], M: [0, H0], P: [-r, w], Q: [r, w], N: [0, w] },
      segs: ['TA', 'TB', 'AB', 'PQ'],
      dash: ['TM'],
      hide: 'ABMNPQ',
      sides: [
        { a: 'M', b: 'B', t: R },
        { a: 'N', b: 'Q', t: 'r', flip: true },
      ],
      w: 260,
      maxH: 280,
    }),
    fields: f,
    hint: 'In de doorsnede zie je twee gelijkvormige rechthoekige driehoeken met dezelfde punt.',
    steps: [
      'De doorsnede geeft twee gelijkvormige driehoeken.',
      H(vt(['r', String(w)], [String(R), String(H0)])),
      `r = {${R}*${w}/${H0}} ${ap(r)} cm`,
    ],
    v: () => near(r / R, w / H0),
  };
}

export default {
  id: '2.4',
  ch: 2,
  num: '2.4',
  title: 'Een lengte x stellen en ruimtefiguren',
  core: false,
  videos: [
    ['2.4 A Een lengte x stellen', 'UorHPuOjZ90'],
    ['2.4 B Gelijkvormige driehoeken in ruimtefiguren', 'tThkWlWtso8'],
  ],
  skills: [
    ['Een lengte x stellen', s24x],
    ['Piramide', s24pyr],
    ['Kegel', s24cone],
  ],
  learn: [
    {
      t: 'Een lengte x stellen',
      p: [
        'Soms ontbreekt een stuk dat je nodig hebt. Noem dat stuk x en druk de andere lengtes uit in x. Kruislings vermenigvuldigen geeft dan een vergelijking.',
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
    },
    {
      t: 'Ruimtefiguren',
      p: [
        'Zoek in de ruimtefiguur een plat vlak met twee gelijkvormige driehoeken, en teken dat vlak los. Daarna reken je zoals altijd met een verhoudingstabel.',
      ],
      watch: 'Neem lengtes steeds vanaf dezelfde top. Zo horen ze bij dezelfde twee driehoeken.',
    },
  ],
};
