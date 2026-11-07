// Voorkennis: Lineaire formules. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { ri, nz, pick, coin, Q, qv, near, lin, sg } from '../math.js';
import { F } from './shared.js';
import { T } from '../typeset.js';

// Schrijft a maal x uit zoals het boek: -x met x = -2 wordt --2, en een breuk blijft een breuk.
const times = (aq, x) => {
  if (aq.d === 1 && aq.n === 1) return String(x);
  if (aq.d === 1 && aq.n === -1) return x ? `-${x}` : '0';
  return `${lin(aq, 0, '')}*${x}`;
};
function svValue() {
  const half = coin() && coin(),
    aq = half ? Q(pick([-1, 1]), 2) : Q(pick([-5, -4, -3, -2, -1, 2, 3, 4, 5])),
    b = nz(-12, 12),
    x = half ? 2 * nz(-5, 5) : nz(-9, 9),
    ax = (aq.n * x) / aq.d,
    y = ax + b;
  return {
    q: T(`Gegeven is de formule y = ${lin(aq, b)}. Bereken y voor x = ${x}.`),
    fields: [F('y =', y)],
    hint: T(`Vul x = ${x} in. Reken eerst de vermenigvuldiging uit.`),
    steps: [`x = ${x} geeft y = ${times(aq, x)}${sg(b)} = ${ax}${sg(b)} = ${y}`],
    v: () => near(y - b, qv(aq) * x),
  };
}
function svTable() {
  const a = nz(-5, 5),
    b = nz(-9, 9),
    x = ri(-3, 3),
    y0 = a * x + b,
    y1 = a * (x + 1) + b,
    dir = a > 0 ? 'toe' : 'af',
    size = Math.abs(a);
  return {
    q: T(`Gegeven is de formule y = ${lin(a, b)}. Vul de tabel en de zin in.`),
    fields: [
      F(`x = ${x} geeft y =`, y0),
      F(`x = ${x + 1} geeft y =`, y1),
      F('Als x met 1 toeneemt, dan neemt y met', size),
      { sel: ['toe', 'af'], a: dir, label: 'Kies toe of af' },
    ],
    hint: T('Vul allebei de waarden van x in en kijk hoeveel y verandert.'),
    steps: [
      `x = ${x} geeft y = ${times(Q(a), x)}${sg(b)} = ${y0}`,
      `x = ${x + 1} geeft y = ${times(Q(a), x + 1)}${sg(b)} = ${y1}`,
      `Van ${y0} naar ${y1} is ${size} ${a > 0 ? 'erbij' : 'eraf'}. Als x met 1 toeneemt, dan neemt y met ${size} ${dir}.`,
    ],
    traps: [
      {
        f: (v) => near(v[0], y0) && near(v[1], y1) && near(v[2], size) && v[3] !== dir,
        m: 'De getallen kloppen. Kijk nog eens of y groter of kleiner wordt.',
      },
    ],
    v: () => y1 - y0 === a,
  };
}

export default {
  id: 'v1',
  ch: 1,
  num: 'V',
  title: 'Voorkennis: Lineaire formules',
  videos: {},
  skills: [
    [1, 'y berekenen', svValue],
    [2, 'Tabel en toename', svTable],
  ],
  learn: [
    {
      t: 'Rekenen met een lineaire formule',
      p: ['Bij elke x hoort één y. Vul x in de formule in en reken uit. Doe de keer eerst.'],
      ex: {
        q: T('Gegeven is de formule y = -2x + 6.'),
        steps: [
          'x = 4 geeft y = -2*4 + 6 = -8 + 6 = -2',
          'x = -3 geeft y = -2*-3 + 6 = 6 + 6 = 12',
        ],
      },
      watch: T('Vul je een negatief getal in, gebruik dan: min maal min is plus.'),
    },
    {
      t: 'Een tabel invullen',
      p: [
        T(
          'Maak je x steeds 1 groter, dan verandert y steeds met hetzelfde getal. Dat is het getal voor x. Bij y = -2x + 6 neemt y met 2 af als x met 1 toeneemt.',
        ),
      ],
    },
  ],
};
