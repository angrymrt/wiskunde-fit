// Onderwerp: Lineaire grafieken tekenen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, nz, pick, Q, qv, near, lin, until } from '../math.js';
import { drawLine, inGrid, lineTable, fillIn, H, LV } from './shared.js';
import { T, dt } from '../typeset.js';

function s11draw() {
  const [b, run, rise, a] = until(
    () => {
      const b = ri(-4, 4);
      const run = pick([1, 1, 2, 3]);
      const rise = nz(-4, 4);
      return [b, run, rise, Q(rise, run)];
    },
    ([b, , , a]) => inGrid(a.d, b + a.n),
  );
  const l = pick('klmn'),
    p = [0, b],
    q = [a.d, b + a.n];
  return {
    q: T(
      `Teken de lijn ${l}: y = ${lin(a, b)}. Tik in het rooster twee punten van de lijn aan, of vul de coördinaten in.`,
    ),
    ...drawLine(qv(a), b, p, q),
    hint: T(
      `Maak een tabel met twee punten. Neem x = 0 en een x waarbij y geen breuk wordt, bijvoorbeeld x = ${a.d}.`,
    ),
    steps: [fillIn(a, b, 0), fillIn(a, b, a.d), ...lineTable(p, q, { a: qv(a), b, name: l })],
    v: () => [p, q].every(([x, y]) => near((rise * x) / run + b, y)),
  };
}
// Een grafiek tekenen met andere letters: de letter achter a staat op de horizontale as.
function s12draw() {
  const [b, a] = until(
    () => [ri(-4, 4), Q(nz(-4, 4), pick([1, 1, 2, 3, 4]))],
    ([b, a]) => inGrid(a.d, b + a.n),
  );
  const [y, x] = pick(LV),
    p = [0, b],
    q = [a.d, b + a.n];
  return {
    q: T(
      `Teken de grafiek van ${y} = ${lin(a, b, x)}. Tik in het rooster twee punten aan, of vul de coördinaten in.`,
    ),
    ...drawLine(qv(a), b, p, q, x, y),
    hint: T(
      `Maak een tabel met twee punten. Neem ${x} = 0 en ${x} = ${a.d}. De ${x}-as is horizontaal en de ${y}-as is verticaal.`,
    ),
    steps: [
      fillIn(a, b, 0, x, y),
      fillIn(a, b, a.d, x, y),
      ...lineTable(p, q, { a: qv(a), b }, x, y),
    ],
    v: () => [p, q].every(([s, t]) => near((a.n * s) / a.d + b, t)),
  };
}

export default {
  slug: 'lineaire-grafieken-tekenen',
  title: 'Lineaire grafieken tekenen',
  intro:
    'Bij een formule als y = ax + b hoort een rechte lijn. Hier leer je wat a en b over die lijn zeggen en hoe je de lijn tekent met een tabel.',
  description:
    'Lineaire grafiek tekenen oefenen: wat a en b zeggen in y = ax + b en een lijn tekenen met een tabel. Havo 3, gratis met uitleg en uitwerkingen.',
  videos: {
    menno: [['De grafiek van een lineaire formule', '67AA66Z_hIw']],
    bob: [['De grafiek van een lineaire formule', 'ZS_74Ceblcc']],
  },
  skills: [
    [8, 'Een lijn tekenen', s11draw],
    [16, 'Een grafiek tekenen', s12draw],
  ],
  learn: [
    {
      t: 'Wat betekenen a en b?',
      p: [
        T(
          'In y = ax + b is b de y-coördinaat van het snijpunt met de y-as. De lijn gaat dus door (0, b).',
        ),
        T(
          'a is de richtingscoëfficiënt, ook wel de helling genoemd: ga je 1 naar rechts, dan ga je a omhoog. Is a negatief, dan ga je omlaag. De richtingscoëfficiënt van lijn l schrijf je als rc_l.',
        ),
      ],
      widget: 'slope',
    },
    {
      t: 'Een lijn tekenen',
      p: [
        T(
          'Voor een lijn heb je twee punten nodig. Maak daarom een tabel met twee x-waarden. Neem x = 0 en een x waarbij y geen breuk wordt. Teken de punten en trek de lijn erdoor. Zet de letter van de lijn erbij.',
        ),
      ],
      ex: {
        q: T('Teken de lijn y = {3/2}x - 2.'),
        steps: [
          'x = 0 geeft y = {3/2}*0 - 2 = -2',
          'x = 2 geeft y = {3/2}*2 - 2 = 1',
          H(
            dt([
              ['x', '0', '2'],
              ['y', '-2', '1'],
            ]),
          ),
          'Dus de lijn gaat door de punten (0, -2) en (2, 1).',
        ],
      },
    },
    {
      t: 'Een grafiek met andere letters',
      p: [
        T(
          'Een formule als N = {2/3}t - 1 teken je op dezelfde manier. De letter op de horizontale as vervangt x, de letter op de verticale as vervangt y.',
        ),
        T(
          'Maak eerst een tabel. Hier is dat bijvoorbeeld t = 0 met N = -1, en t = 3 met N = 1. Met die twee punten teken je de lijn.',
        ),
      ],
    },
  ],
};
