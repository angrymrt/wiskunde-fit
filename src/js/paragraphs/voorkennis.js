// Voorkennis: Pythagoras. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { geo, rightTriFig } from '../figures.js';
import { ri, near, rd, d } from '../math.js';
import { RF } from './shared.js';
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

export default {
  id: 'v2',
  ch: 2,
  num: 'V',
  title: 'Voorkennis: Pythagoras',
  core: true,
  videos: {
    menno: [
      ['De stelling van Pythagoras', 'zAnoHcHsKfM'],
      ['Schuine zijde en rechthoekszijde', 'TVxaJL7ABx0'],
    ],
  },
  skills: [
    ['Schuine zijde', sPyHyp],
    ['Rechthoekszijde', sPyLeg],
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
  ],
};
