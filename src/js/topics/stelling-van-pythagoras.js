// Onderwerp: Stelling van Pythagoras. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { geo, rightTriFig } from '../figures.js';
import { ri, coin, near, rd, isNice, d } from '../math.js';
import { RF, needRound } from './shared.js';
import { T } from '../typeset.js';

function sPyHyp() {
  const a = rd(ri(15, 90) / 10, 1),
    b = rd(ri(15, 90) / 10, 1),
    c2 = a * a + b * b,
    c = Math.sqrt(c2);
  return {
    q:
      T(`In △ABC is ∠A = 90°, AB = ${d(a)} cm en AC = ${d(b)} cm. Bereken BC in cm.`) +
      ' Rond af op 2 decimalen.',
    fig: rightTriFig(a, b, { AB: d(a), CA: d(b) }),
    fields: [{ ...RF('BC =', c, 2), round: 2, post: 'cm' }],
    hint: 'De schuine zijde is de zijde tegenover de rechte hoek. Kwadraten van de twee rechthoekszijden optellen, daarna de wortel nemen.',
    steps: [
      `∠A = 90°, dus AB^2 + AC^2 = BC^2`,
      `${d(a)}^2 + ${d(b)}^2 = BC^2`,
      `BC^2 = ${d(rd(c2, 4))}`,
      `BC = √${d(rd(c2, 4))} ≈ ${d(rd(c, 2))} cm`,
    ],
    traps: [
      { f: (v) => near(v[0], c2, 0.02), m: 'Je bent BC² aan het geven. Neem nog de wortel.' },
    ],
    v: () => near(a * a + b * b, c * c, 1e-6),
  };
}
function sPyLeg() {
  const a = rd(ri(20, 80) / 10, 1),
    c = rd(a + ri(5, 40) / 10, 1),
    b2 = c * c - a * a,
    b = Math.sqrt(b2);
  return {
    q:
      T(`In △PQR is ∠Q = 90°, PR = ${d(c)} cm en QR = ${d(a)} cm. Bereken PQ in cm.`) +
      ' Rond af op 2 decimalen.',
    fig: geo({
      pts: { Q: [0, 0], R: [a, 0], P: [0, b] },
      segs: ['QR', 'RP', 'PQ'],
      rights: [{ at: 'Q', p: 'R', q: 'P' }],
      sides: [
        { a: 'R', b: 'P', t: d(c) },
        { a: 'Q', b: 'R', t: d(a) },
      ],
      w: 300,
      maxH: 230,
    }),
    fields: [{ ...RF('PQ =', b, 2), round: 2, post: 'cm' }],
    hint: 'Je zoekt een rechthoekszijde. Dan trek je af: het kwadraat van de schuine zijde min het kwadraat van de andere zijde.',
    steps: [
      `∠Q = 90°, dus PQ^2 + QR^2 = PR^2`,
      `PQ^2 + ${d(a)}^2 = ${d(c)}^2`,
      `PQ^2 = ${d(c)}^2 - ${d(a)}^2 = ${d(rd(b2, 4))}`,
      `PQ = √${d(rd(b2, 4))} ≈ ${d(rd(b, 2))} cm`,
    ],
    traps: [
      {
        f: (v) => near(v[0], Math.sqrt(c * c + a * a), 0.02),
        m: 'Je hebt opgeteld. PR is de schuine zijde en dus de langste, daarom moet je hier aftrekken.',
      },
    ],
    v: () => near(a * a + b * b, c * c, 1e-6),
  };
}
// Een tussenantwoord rond je niet af: je schrijft 7,90... en rekent verder met je rekenmachine.
const midway = (x) =>
  isNice(x, 2) ? `= ${d(x)}` : `= ${(Math.trunc(x * 100) / 100).toFixed(2).replace('.', ',')}...`;
// Een hoogtelijn verdeelt de driehoek in twee rechthoekige driehoeken.
function sPyHeight() {
  const h = rd(ri(20, 60) / 10, 1),
    c = rd(h + ri(5, 30) / 10, 1),
    kn2 = c * c - h * h,
    kn = Math.sqrt(kn2);
  const first = [
    `In △KNM is ∠N = 90°, dus KN^2 + MN^2 = KM^2`,
    `KN^2 + ${d(h)}^2 = ${d(c)}^2`,
    `KN^2 = ${d(c)}^2 - ${d(h)}^2 = ${d(rd(kn2, 4))}`,
    `KN = √${d(rd(kn2, 4))} ${midway(kn)}`,
  ];
  if (coin()) {
    const kl = 2 * kn,
      f = [RF('KL =', kl, 2, 'cm')];
    return {
      q: T(
        `△KLM is gelijkbenig met KM = LM = ${d(c)} cm. De hoogtelijn MN staat loodrecht op KL, met MN = ${d(h)} cm. Bereken KL in cm.${needRound(f)}`,
      ),
      fig: geo({
        pts: { K: [0, 0], N: [kn, 0], L: [kl, 0], M: [kn, h] },
        segs: ['KL', 'LM', 'MK', 'MN'],
        rights: [{ at: 'N', p: 'L', q: 'M' }],
        sides: [
          { a: 'K', b: 'M', t: d(c) },
          { a: 'L', b: 'M', t: d(c) },
          { a: 'M', b: 'N', t: d(h), flip: true },
        ],
        off: { N: [0, 16] },
        w: 300,
        maxH: 210,
      }),
      fields: f,
      hint: T(
        'De hoogtelijn deelt KL in twee gelijke stukken. Bereken eerst KN met de stelling van Pythagoras.',
      ),
      steps: [
        ...first,
        `Dus KL = 2*${midway(kn).slice(2)} ${isNice(kl, 2) ? '=' : '≈'} ${d(rd(kl, 2))} cm`,
      ],
      traps: [
        {
          f: (v) => near(v[0], kn, 0.02),
          m: 'Dit is de lengte van KN. KL is twee keer zo lang.',
        },
      ],
      v: () => near(kn * kn + h * h, c * c, 1e-6) && near(kl / 2, kn),
    };
  }
  const s = rd(ri(15, 50) / 10, 1),
    lm2 = s * s + h * h,
    lm = Math.sqrt(lm2),
    o = kn + s + lm + c,
    f = [RF('omtrek =', o, 1, 'cm')];
  return {
    q: T(
      `In △KLM staat de hoogtelijn MN loodrecht op KL. Gegeven is KM = ${d(c)} cm, MN = ${d(h)} cm en LN = ${d(s)} cm. Bereken de omtrek van △KLM in cm.${needRound(f)}`,
    ),
    fig: geo({
      pts: { K: [0, 0], N: [kn, 0], L: [kn + s, 0], M: [kn, h] },
      segs: ['KL', 'LM', 'MK', 'MN'],
      rights: [{ at: 'N', p: 'L', q: 'M' }],
      sides: [
        { a: 'K', b: 'M', t: d(c) },
        { a: 'M', b: 'N', t: d(h), flip: true },
        { a: 'N', b: 'L', t: d(s) },
      ],
      off: { N: [0, 16] },
      w: 300,
      maxH: 210,
    }),
    fields: f,
    hint: T(
      'Je mist KN en LM. Bereken ze allebei met de stelling van Pythagoras. Tel daarna alle zijden op.',
    ),
    steps: [
      ...first,
      `In △LNM is ∠N = 90°, dus LN^2 + MN^2 = LM^2`,
      `${d(s)}^2 + ${d(h)}^2 = LM^2`,
      `LM^2 = ${d(rd(lm2, 4))}`,
      `LM = √${d(rd(lm2, 4))} ${midway(lm)}`,
      `De omtrek van △KLM is ${midway(kn).slice(2)} + ${d(s)} + ${midway(lm).slice(2)} + ${d(c)} ${isNice(o, 1) ? '=' : '≈'} ${d(rd(o, 1))} cm`,
    ],
    traps: [
      {
        f: (v) => near(v[0], kn + s + lm, 0.06),
        m: 'Je mist een zijde. De omtrek is KN + LN + LM + KM.',
      },
    ],
    v: () => near(kn * kn + h * h, c * c, 1e-6) && near(s * s + h * h, lm * lm, 1e-6),
  };
}

export default {
  slug: 'stelling-van-pythagoras',
  title: 'Stelling van Pythagoras',
  intro:
    'In een driehoek met een rechte hoek kun je een ontbrekende zijde uitrekenen als je de andere twee kent. Dat doe je met de stelling van Pythagoras.',
  description:
    'Bereken de schuine zijde of een rechthoekszijde met de stelling van Pythagoras. Gratis uitleg en oefenvragen met uitwerkingen.',
  videos: {
    menno: [
      ['De stelling van Pythagoras', 'zAnoHcHsKfM'],
      ['Schuine zijde en rechthoekszijde', 'TVxaJL7ABx0'],
    ],
  },
  skills: [
    [38, 'Schuine zijde', sPyHyp],
    [39, 'Rechthoekszijde', sPyLeg],
    [40, 'Hoogtelijn in een driehoek', sPyHeight],
  ],
  learn: [
    {
      t: 'De stelling van Pythagoras',
      p: [
        T(
          'In een rechthoekige driehoek geldt: de kwadraten van de twee rechthoekszijden samen zijn gelijk aan het kwadraat van de schuine zijde. De schuine zijde ligt tegenover de rechte hoek.',
        ),
      ],
      ex: {
        q: T('In △ABC is ∠C = 90°, AC = 6 en BC = 3.'),
        steps: [
          '∠C = 90°, dus AC^2 + BC^2 = AB^2',
          '6^2 + 3^2 = AB^2',
          'AB^2 = 45',
          'AB = √45 ≈ 6,71',
        ],
      },
      watch:
        'Zoek je een rechthoekszijde, dan trek je af. Zoek je de schuine zijde, dan tel je op.',
    },
    {
      t: 'Een hoogtelijn in een driehoek',
      p: [
        'Een hoogtelijn verdeelt een driehoek in twee rechthoekige driehoeken. Daarin gebruik je de stelling van Pythagoras. In een gelijkbenige driehoek zijn de twee stukken van de basis even lang.',
      ],
      watch: 'Rond een tussenantwoord niet af. Rond pas af bij het eindantwoord.',
    },
  ],
};
