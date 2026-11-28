// Onderwerp: Globale grafieken. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
// Een globale grafiek heeft geen getallen bij de assen (#288). De figuur komt uit contextGraph in
// grafiekfiguren.js. Elke v leest de richting van de stukken terug uit de pixels van de getekende
// figuur. Zo controleert v wat de leerling echt ziet, en niet de gegevens waarmee de vraag is gemaakt.
import { ri, pick, coin, until, near } from '../math.js';
import { MC, H } from './shared.js';
import { T } from '../typeset.js';
import { contextGraph } from '../grafiekfiguren.js';

const figbox = (svg) => `<div class="figbox">${svg}</div>`;
const NAMEN = ['Noor', 'Daan', 'Sem', 'Lotte', 'Yara', 'Milan', 'Fenna', 'Ilias', 'Saar', 'Jesse'];

// --- 228 Stijgend, dalend of constant (#288) ---

// De punten van de eerste grafiek in een figuur, in pixels, met y omhoog. Zo rekent v met wat er
// getekend staat.
function pixels(svg) {
  const n = svg
      .match(/<path class="l\d" d="([^"]+)"/)[1]
      .match(/-?[\d.]+/g)
      .map(Number),
    P = [];
  for (let i = 0; i + 1 < n.length; i += 2) P.push([n[i], -n[i + 1]]);
  return P;
}
const richtingen = (P) =>
  P.slice(1).map((p, k) => (Math.abs(p[1] - P[k][1]) < 0.5 ? 0 : Math.sign(p[1] - P[k][1])));
// De hoogte van de horizontale as in pixels, met y omhoog.
const asHoogte = (svg) => -svg.match(/<path class="ax" d="M[\d.]+ [\d.]+V([\d.]+)/)[1];
const LETTERS = ['a', 'b', 'c', 'd'];
const WOORD = { 1: 'stijgend', '-1': 'dalend', 0: 'constant' };
const GAAT = { 1: 'gaat omhoog', '-1': 'gaat omlaag', 0: 'loopt horizontaal' };

const GLOBAAL = [
  {
    y: 'temperatuur',
    intro: () =>
      'In de {{globale-grafiek|globale grafiek}} zie je hoe de temperatuur in een klaslokaal verandert op een schooldag.',
    doet: (n, r) =>
      r > 0 ? 'wordt het warmer' : r < 0 ? 'wordt het kouder' : 'blijft de temperatuur gelijk',
    snelst: (r) => `In welk stuk wordt het het snelst ${r > 0 ? 'warmer' : 'kouder'}?`,
  },
  {
    y: 'waterhoogte',
    intro: (n) =>
      `In de {{globale-grafiek|globale grafiek}} zie je hoe hoog het water in het bad van ${n} staat.`,
    doet: (n, r) =>
      r > 0 ? 'stijgt het water' : r < 0 ? 'daalt het water' : 'blijft het water even hoog',
    snelst: (r) => `In welk stuk ${r > 0 ? 'stijgt' : 'daalt'} het water het snelst?`,
  },
  {
    y: 'snelheid',
    fiets: true,
    intro: (n) =>
      `${n} maakt een fietstocht. In de {{globale-grafiek|globale grafiek}} zie je de snelheid van ${n}.`,
    doet: (n, r, nul) =>
      r > 0
        ? `gaat ${n} steeds harder`
        : r < 0
          ? `gaat ${n} steeds langzamer`
          : nul
            ? `staat ${n} stil`
            : `fietst ${n} steeds even hard`,
  },
];

// Een globale grafiek met k stukken die steeds een andere kant op gaan, op hoogte 0 tot en met 7. Alleen bij
// een fietser komt hij op 0, want daar betekent dat stilstaan; anders ligt hij boven de horizontale as.
// soort zegt wat de vraag nodig heeft: 'stuk' (alle drie de richtingen), 'steil' (twee stukken die
// dezelfde kant op gaan, waarvan één duidelijk steiler) of 'doet' (een stuk j bij een fietser, dat
// met nul op 0 ligt).
function globaal(G, soort) {
  return until(
    () => {
      const k = pick([3, 4]),
        r = Array.from({ length: k }, () => pick([1, -1, 0])),
        w = r.map(() => ri(2, 3)),
        h = r.map((x) => (x ? x * ri(1, 4) : 0)),
        P = [[0, 0]];
      r.forEach((x, j) => P.push([P[j][0] + w[j], P[j][1] + h[j]]));
      // Bij 'doet' gaat de vraag meestal over een horizontaal stuk: daar zit de fout.
      const vlak = r.map((x, i) => i).filter((i) => r[i] === 0),
        j = soort === 'doet' && vlak.length && coin() ? pick(vlak) : ri(0, k - 1),
        nul = soort === 'doet' && r[j] === 0 && coin(),
        lo = Math.min(...P.map((p) => p[1])),
        op = nul ? -P[j][1] : ri(G.fiets ? 0 : 1, 2) - lo;
      return { r, j, nul, td: coin() ? 1 : -1, P: P.map(([x, y]) => [x, y + op]) };
    },
    ({ r, j, nul, td, P }) => {
      const ys = P.map((p) => p[1]),
        st = r.map((x, k) =>
          x === td ? Math.abs(P[k + 1][1] - P[k][1]) / (P[k + 1][0] - P[k][0]) : 0,
        ),
        [s1, s2] = [...st].sort((a, b) => b - a);
      return (
        Math.min(...ys) >= 0 &&
        Math.max(...ys) <= 7 &&
        r.every((x, k) => !k || x !== r[k - 1]) &&
        new Set(r).size === 3 &&
        (soort !== 'steil' || (s2 > 0 && s1 >= 1.5 * s2)) &&
        // Bij een fietser ligt een horizontaal stuk op 0 (stilstaan) of duidelijk erboven.
        (!G.fiets || r.every((x, k) => x !== 0 || P[k][1] === 0 || P[k][1] >= 2)) &&
        (soort !== 'doet' || nul || r[j] !== 0 || P[j][1] >= 2)
      );
    },
  );
}
const schetsFig = (G, P) =>
  contextGraph({
    schets: true,
    x: { naam: 'tijd', van: 0, tot: P[P.length - 1][0], stap: 1 },
    y: { naam: G.y, van: 0, tot: Math.max(...P.map((p) => p[1])) + 1, stap: 1 },
    grafieken: [{ punten: P, stukken: LETTERS.slice(0, P.length - 1) }],
    zeg: 'assen',
    u: 20,
  });

function s32globaal() {
  const G = pick(GLOBAAL),
    soort = pick(G.fiets ? ['stuk', 'doet'] : ['stuk', 'steil']),
    { r, j, nul, td, P } = globaal(G, soort),
    n = pick(NAMEN),
    fig = schetsFig(G, P),
    L = LETTERS.slice(0, r.length),
    // Ligt stuk k op de horizontale as? Alleen bij een fietser zegt dat iets: dan staat hij stil.
    opNul = (k) => G.fiets && r[k] === 0 && P[k][1] === 0,
    zin = (k) =>
      `Stuk ${L[k]} ${GAAT[r[k]]}, dus stuk ${L[k]} is ${WOORD[r[k]]}. Daar ${G.doet(n, r[k], opNul(k))}.`,
    letters = () => [...fig.matchAll(/<text class="ti"[^>]*>([^<]+)<\/text>/g)].map((m) => m[1]);
  if (soort === 'stuk') {
    return {
      q: T(`${G.intro(n)} Is elk stuk van de grafiek stijgend, dalend of constant?`),
      fig,
      fields: L.map((s, k) => ({
        sel: ['stijgend', 'dalend', 'constant'],
        a: WOORD[r[k]],
        pre: `Stuk ${s} is`,
        label: `Is stuk ${s} stijgend, dalend of constant?`,
        br: true,
      })),
      hint: T(
        'Lees de grafiek van links naar rechts. Gaat hij omhoog, dan is hij stijgend. Gaat hij omlaag, dan is hij dalend. Loopt hij horizontaal, dan is hij constant.',
      ),
      steps: L.map((s, k) => zin(k)),
      traps: [
        {
          id: 'stijgend-en-dalend-verwisseld',
          f: (v) => v.some((x, k) => x === WOORD[-r[k]] && r[k] !== 0),
          m: 'Lees een grafiek altijd van links naar rechts. Gaat hij dan omhoog, dan is hij stijgend. Gaat hij omlaag, dan is hij dalend.',
        },
        {
          id: 'constant-verwisseld',
          f: (v) => v.some((x, k) => x && x !== WOORD[r[k]] && (x === 'constant' || r[k] === 0)),
          m: 'Constant betekent dat de grafiek horizontaal loopt: daar verandert niets. Loopt een stuk schuin, dan is het stijgend of dalend.',
        },
      ],
      // Leest de richting van elk stuk terug uit de getekende lijn, en de letters bij de stukken.
      v: () =>
        richtingen(pixels(fig)).every((x, k) => WOORD[x] === WOORD[r[k]]) &&
        letters().join('') === L.join(''),
    };
  }
  if (soort === 'steil') {
    const st = r.map((x, k) =>
        x === td ? Math.abs(P[k + 1][1] - P[k][1]) / (P[k + 1][0] - P[k][0]) : 0,
      ),
      a = st.indexOf(Math.max(...st)),
      zelfde = L.filter((s, k) => r[k] === td),
      opts = L.map((s) => T(`stuk ${s}`)),
      wat = td > 0 ? 'stijgen' : 'dalen';
    return {
      q: T(`${G.intro(n)} ${G.snelst(td)}`),
      fig,
      mc: MC(opts, a),
      hint: T(`Zoek eerst de stukken die ${wat}. Hoe steiler de grafiek, hoe sneller het gaat.`),
      steps: [
        `De stukken ${zelfde.join(' en ')} ${wat}.`,
        `Stuk ${L[a]} is het steilst.`,
        `Hoe steiler, hoe sneller. ${G.snelst(td).replace('welk stuk', `stuk ${L[a]}`).replace('?', '.')}`,
      ],
      traps: [
        {
          id: 'snel-en-langzaam-verwisseld',
          f: (v) => L.some((s, k) => k !== a && r[k] === td && v[0] === opts[k]),
          m: `Dat stuk ${td > 0 ? 'stijgt' : 'daalt'} ook, maar minder steil. Hoe steiler de grafiek, hoe sneller het gaat.`,
        },
        {
          id: 'stijgend-en-dalend-verwisseld',
          f: (v) => L.some((s, k) => r[k] === -td && v[0] === opts[k]),
          m: `Dat stuk ${td > 0 ? 'daalt' : 'stijgt'}. Lees de grafiek van links naar rechts, en zoek een stuk dat ${td > 0 ? 'omhoog' : 'omlaag'} gaat.`,
        },
        {
          id: 'constant-verwisseld',
          f: (v) => L.some((s, k) => r[k] === 0 && v[0] === opts[k]),
          m: 'Dat stuk loopt horizontaal: daar verandert niets.',
        },
      ],
      // Rekent de helling van elk stuk uit met de pixels van de getekende lijn.
      v: () => {
        const R = pixels(fig),
          h = R.slice(1).map((p, k) => (td * (p[1] - R[k][1])) / (p[0] - R[k][0])),
          [h1, h2] = [...h].sort((x, y) => y - x);
        return h.indexOf(h1) === a && h1 >= 1.5 * h2 && letters()[a] === L[a];
      },
    };
  }
  // Wat doet de fietser in stuk j? Bij een snelheidsgrafiek is horizontaal steeds even hard, en op 0
  // stilstaan.
  const s = L[j],
    opts = [
      `${n} gaat steeds harder fietsen.`,
      `${n} gaat steeds langzamer fietsen.`,
      `${n} fietst steeds even hard.`,
      `${n} staat stil.`,
    ].map((x) => T(x)),
    a = r[j] > 0 ? 0 : r[j] < 0 ? 1 : nul ? 3 : 2;
  return {
    q: T(`${G.intro(n)} Wat doet ${n} in stuk ${s}?`),
    fig,
    mc: MC(opts, a),
    hint: T(
      'Dit is een snelheidsgrafiek. Stijgt hij, dan gaat de snelheid omhoog. Loopt hij horizontaal, dan blijft de snelheid gelijk. Ligt hij op de horizontale as, dan is de snelheid 0.',
    ),
    steps: [
      `Op de verticale as staat de snelheid.`,
      nul
        ? `Stuk ${s} ligt op de horizontale as. Daar is de snelheid 0.`
        : `Stuk ${s} ${GAAT[r[j]]}, dus de snelheid is daar ${WOORD[r[j]]}.`,
      `Dus in stuk ${s} ${G.doet(n, r[j], nul)}.`,
    ],
    traps:
      r[j] === 0
        ? [
            nul
              ? {
                  id: 'stilstaan-niet-gezien',
                  f: (v) => v[0] === opts[2],
                  m: `Stuk ${s} ligt op de horizontale as: de snelheid is 0. Dan staat ${n} stil.`,
                }
              : {
                  id: 'constant-is-stilstaan',
                  f: (v) => v[0] === opts[3],
                  m: `Dit is een snelheidsgrafiek. Loopt hij horizontaal, dan verandert de snelheid niet: ${n} fietst steeds even hard. ${n} staat pas stil als de snelheid 0 is. Dan ligt de grafiek op de horizontale as.`,
                },
            {
              id: 'constant-verwisseld',
              f: (v) => v[0] === opts[0] || v[0] === opts[1],
              m: `Stuk ${s} loopt horizontaal: de snelheid verandert daar niet.`,
            },
          ]
        : [
            {
              id: 'stijgend-en-dalend-verwisseld',
              f: (v) => v[0] === opts[1 - a],
              m: `Lees de grafiek van links naar rechts. Stuk ${s} ${GAAT[r[j]]}: de snelheid wordt ${r[j] > 0 ? 'groter' : 'kleiner'}.`,
            },
            {
              id: 'niet-constant',
              f: (v) => v[0] === opts[2] || v[0] === opts[3],
              m: `Stuk ${s} loopt niet horizontaal: de snelheid verandert daar.`,
            },
          ],
    // Leest uit de pixels of het stuk stijgt, daalt of horizontaal loopt, en of het op de horizontale as
    // ligt.
    v: () => {
      const R = pixels(fig),
        x = richtingen(R)[j],
        op = near(R[j][1], asHoogte(fig), 0.5) && near(R[j + 1][1], asHoogte(fig), 0.5),
        b = x > 0 ? 0 : x < 0 ? 1 : op ? 3 : 2;
      return b === a && letters()[j] === s;
    },
  };
}

// --- 229 Welke globale grafiek past bij het verhaal? (#288) ---

// Een verhaal met de goede globale grafiek en foute grafieken. Een grafiek is [beginhoogte, [breedte,
// hoogte], ...], met breedtes a, b, c, e en een hoogte H die per vraag verschillen. rich is de richting
// van elk stuk van het verhaal (1 stijgt, -1 daalt, 0 horizontaal) en nul zijn de stukken op 0, met de
// hand opgeschreven, zodat v de getekende grafiek daarmee kan vergelijken. Elke foute grafiek is een
// echte fout, met een andere vorm dan de goede, zodat ook de beschrijving voor een schermlezer anders is.
// Bij een foute grafiek staat welke stap van de uitwerking de fout uitlegt.
const FOUT = {
  'volgorde-omgedraaid':
    'In deze grafiek staan de stukken in een andere volgorde dan in het verhaal. Lees de grafiek van links naar rechts.',
  'pauze-vergeten': 'In deze grafiek ontbreekt een stuk van het verhaal.',
  'stilstaan-als-dalen': 'In deze grafiek daalt een stuk dat horizontaal moet lopen.',
  'stijgend-en-dalend-verwisseld': 'In deze grafiek stijgt een stuk dat moet dalen.',
  'afstand-en-snelheid-verwisseld': (V) =>
    V.fiets
      ? 'Zo ziet een afstand-tijdgrafiek eruit. Hier staat de snelheid op de verticale as.'
      : 'Deze grafiek komt op 0 bij stilstaan. Zo ziet een snelheidsgrafiek eruit.',
};
const VERHALEN = [
  {
    y: 'afstand tot huis',
    zin: (n) =>
      `${n} fietst naar opa en oma. Daar blijft ${n} een tijdje. Daarna fietst ${n} terug naar huis.`,
    rich: [1, 0, -1],
    stappen: (n) => [
      `Eerst fietst ${n} van huis weg. De afstand tot huis wordt groter, dus de grafiek stijgt.`,
      'Bij opa en oma verandert de afstand tot huis niet. De grafiek loopt horizontaal.',
      'Op de terugweg wordt de afstand tot huis kleiner. De grafiek daalt tot 0.',
    ],
    goed: ({ a, b, c, H }) => [0, [a, H], [b, H], [c, 0]],
    fout: [
      ['volgorde-omgedraaid', ({ a, b, c, H }) => [H, [c, 0], [b, 0], [a, H]], 0],
      ['pauze-vergeten', ({ a, c, H }) => [0, [a, H], [c, 0]], 1],
      [
        'afstand-en-snelheid-verwisseld',
        ({ a, b, c, H }) => [H - 1, [a, H - 1], [1, 0], [b, 0], [1, H - 1], [c, H - 1]],
        1,
      ],
    ],
  },
  {
    y: 'afgelegde afstand',
    zin: (n) => `${n} fietst naar het bos. Daar gaat ${n} op een bankje zitten om uit te rusten.`,
    rich: [1, 0],
    stappen: (n) => [
      `Eerst fietst ${n}. De afgelegde afstand wordt groter, dus de grafiek stijgt.`,
      `Als ${n} uitrust, verandert de afgelegde afstand niet. De grafiek loopt horizontaal.`,
    ],
    goed: ({ a, b, H }) => [0, [a, H], [b, H]],
    fout: [
      ['volgorde-omgedraaid', ({ a, b, H }) => [0, [b, 0], [a, H]], 0],
      ['pauze-vergeten', ({ a, b, H }) => [0, [a + b, H]], 1],
      ['afstand-en-snelheid-verwisseld', ({ a, b, H }) => [H - 1, [a, H - 1], [1, 0], [b, 0]], 1],
      ['stilstaan-als-dalen', ({ a, b, H }) => [0, [a, H], [b, 1]], 1],
    ],
  },
  {
    y: 'snelheid',
    fiets: true,
    zin: (n) =>
      `${n} fietst weg en gaat steeds harder. Dan fietst ${n} een tijd even hard. Bij een stoplicht remt ${n} af en wacht tot het groen wordt.`,
    rich: [1, 0, -1, 0],
    nul: [3],
    stappen: (n) => [
      `Eerst gaat ${n} steeds harder. De snelheid wordt groter, dus de grafiek stijgt.`,
      `Dan fietst ${n} even hard. De snelheid verandert niet, dus de grafiek loopt horizontaal.`,
      'Bij het remmen wordt de snelheid kleiner. De grafiek daalt tot 0.',
      `Tijdens het wachten staat ${n} stil. De snelheid is 0, dus de grafiek ligt een stuk op de horizontale as.`,
    ],
    goed: ({ a, b, c, e, H }) => [0, [a, H], [b, H], [c, 0], [e, 0]],
    fout: [
      [
        'afstand-en-snelheid-verwisseld',
        ({ a, b, c, e, H }) => [0, [a, 1], [b, H - 1], [c, H], [e, H]],
        3,
      ],
      ['pauze-vergeten', ({ a, b, c, e, H }) => [0, [a, H], [b, H], [c + e, 0]], 3],
      ['volgorde-omgedraaid', ({ a, b, c, e, H }) => [0, [e, 0], [c, H], [b, H], [a, 0]], 0],
    ],
  },
  {
    y: 'snelheid',
    fiets: true,
    zin: (n) =>
      `${n} wacht met de fiets bij een stoplicht. Als het groen wordt, gaat ${n} steeds harder fietsen. Daarna fietst ${n} een heel stuk even hard.`,
    rich: [0, 1, 0],
    nul: [0],
    stappen: (n) => [
      `Bij het stoplicht staat ${n} stil. De snelheid is 0, dus de grafiek ligt eerst op de horizontale as.`,
      `Daarna gaat ${n} steeds harder. De snelheid wordt groter, dus de grafiek stijgt.`,
      `Dan fietst ${n} even hard. De snelheid verandert niet, dus de grafiek loopt horizontaal.`,
    ],
    goed: ({ a, b, c, H }) => [0, [a, 0], [b, H], [c + 1, H]],
    fout: [
      ['afstand-en-snelheid-verwisseld', ({ a, b, c, H }) => [0, [a, 0], [b, 1], [c + 1, H]], 2],
      ['volgorde-omgedraaid', ({ a, b, c, H }) => [H, [c + 1, H], [b, 0], [a, 0]], 0],
      ['pauze-vergeten', ({ a, b, c, H }) => [0, [b, H], [a + c + 1, H]], 0],
    ],
  },
  {
    y: 'waterhoogte',
    zin: (n) =>
      `Het regent een tijd hard, en de regenton in de tuin van ${n} loopt vol. Dan stopt het met regenen. Later haalt ${n} water uit de ton voor de planten.`,
    rich: [1, 0, -1],
    stappen: (n) => [
      'Als het regent, komt er water in de ton. De waterhoogte wordt groter, dus de grafiek stijgt.',
      'Als het niet meer regent, verandert de waterhoogte niet. De grafiek loopt horizontaal.',
      `Als ${n} water uit de ton haalt, wordt de waterhoogte kleiner. De grafiek daalt.`,
    ],
    goed: ({ a, b, c, H }) => [1, [a, H], [b, H], [c, 2]],
    fout: [
      ['volgorde-omgedraaid', ({ a, b, c, H }) => [H, [c, 1], [b, 1], [a, H]], 0],
      ['pauze-vergeten', ({ a, c, H }) => [1, [a, H], [c, 2]], 1],
      ['stijgend-en-dalend-verwisseld', ({ a, b, c, H }) => [1, [a, H - 2], [b, H - 2], [c, H]], 2],
    ],
  },
];
// De punten van een grafiek [beginhoogte, [breedte, hoogte], ...], zo uitgerekt dat hij 10 breed is.
function verhaalPunten([y0, ...stukken]) {
  const P = [[0, y0]];
  stukken.forEach(([w, y], k) => P.push([P[k][0] + w, y]));
  const f = 10 / P[P.length - 1][0];
  return P.map(([x, y]) => [x * f, y]);
}
const samen = (r) => r.filter((x, k) => !k || x !== r[k - 1]).join(' ');

function s32verhaal() {
  const V = pick(VERHALEN),
    n = pick(NAMEN),
    m = { a: ri(2, 3), b: ri(2, 3), c: ri(2, 3), e: ri(2, 3), H: ri(4, 5) },
    fout = (() => {
      if (V.fout.length <= 3) return V.fout;
      const weg = ri(0, V.fout.length - 1);
      return V.fout.filter((_, k) => k !== weg);
    })(),
    schets = (g) =>
      contextGraph({
        schets: true,
        x: { naam: 'tijd', van: 0, tot: 10, stap: 1 },
        y: { naam: V.y, van: 0, tot: 6, stap: 1 },
        grafieken: [{ punten: verhaalPunten(g(m)) }],
        zeg: 'vorm',
        u: 14,
        label: 'Schets',
      }),
    opts = [schets(V.goed), ...fout.map(([, g]) => schets(g))],
    mc = MC(opts, 0),
    uit = V.stappen(n);
  return {
    q: T(
      `${V.zin(n)} Welke {{globale-grafiek|globale grafiek}} past bij dit verhaal? In elke grafiek staat de tijd op de horizontale as en de ${V.y} op de verticale as.`,
    ),
    mc,
    hint: T(
      `Ga het verhaal stap voor stap langs. Wordt de ${V.y} groter, kleiner of blijft hij gelijk? Groter is stijgend, kleiner is dalend en gelijk is horizontaal.${V.fiets ? ' Let op: staat iemand stil, dan is de snelheid 0.' : ''}`,
    ),
    steps: [...uit, H(figbox(opts[0]))],
    traps: fout.map(([id, , stap], k) => ({
      id,
      f: (v) => v[0] === opts[k + 1],
      m: `${typeof FOUT[id] === 'function' ? FOUT[id](V) : FOUT[id]} ${uit[stap]}`,
    })),
    // Leest de richting van elk stuk terug uit de pixels van de getekende grafieken. De goede grafiek
    // gaat stuk voor stuk zoals het verhaal, met de stukken op 0 op de horizontale as. Alle grafieken
    // hebben een andere vorm.
    v: () => {
      const goed = mc.opts[mc.a],
        R = pixels(goed),
        r = richtingen(R),
        y0 = asHoogte(goed),
        opAs = (k) => near(R[k][1], y0, 0.5) && near(R[k + 1][1], y0, 0.5);
      return (
        r.join(' ') === V.rich.join(' ') &&
        r.every((x, k) => x !== 0 || !V.fiets || opAs(k) === (V.nul || []).includes(k)) &&
        new Set(mc.opts.map((o) => samen(richtingen(pixels(o))))).size === mc.opts.length
      );
    },
  };
}

// De figuur in de uitleg.
const UITLEG_SCHETS = contextGraph({
  schets: true,
  x: { naam: 'tijd', van: 0, tot: 10, stap: 1 },
  y: { naam: 'temperatuur', van: 0, tot: 7, stap: 1 },
  grafieken: [
    {
      punten: [
        [0, 2],
        [3, 5],
        [5, 5],
        [6, 2],
        [10, 4],
      ],
      stukken: ['a', 'b', 'c', 'd'],
    },
  ],
  zeg: 'vorm',
  u: 20,
});

export default {
  slug: 'globale-grafieken',
  title: 'Globale grafieken',
  intro:
    'Een globale grafiek heeft geen getallen bij de assen. Je ziet alleen of iets stijgt, daalt of gelijk blijft, en hoe snel. Hier leer je zo’n grafiek lezen en kies je de globale grafiek die bij een verhaal past.',
  description:
    'Globale grafieken oefenen: stijgend, dalend of constant, hoe snel iets verandert en welke grafiek bij een verhaal past. Gratis met uitleg.',
  videos: {},
  skills: [
    [228, 'Stijgend, dalend of constant', s32globaal],
    [229, 'Globale grafiek bij een verhaal', s32verhaal],
  ],
  learn: [
    {
      t: 'Globale grafieken',
      p: [
        T(
          'Een {{=globale-grafiek|globale grafiek}} heeft geen getallen bij de assen. Je ziet alleen hoe iets verandert. Lees de grafiek van links naar rechts. Gaat hij omhoog, dan is hij stijgend. Gaat hij omlaag, dan is hij dalend. Loopt hij horizontaal, dan is hij constant: dan verandert er niets.',
        ),
        T(
          'Hoe steiler de grafiek, hoe sneller het stijgt of daalt. Zoek je de grafiek bij een verhaal, ga dan stuk voor stuk na of het groter wordt, kleiner wordt of gelijk blijft.',
        ),
      ],
      ex: {
        q:
          T(
            'De globale grafiek laat de temperatuur in een lokaal zien. Welk stuk is dalend? Wordt het in stuk a of in stuk d het snelst warmer?',
          ) + figbox(UITLEG_SCHETS),
        steps: [
          'Stuk c gaat omlaag, dus stuk c is dalend. Daar wordt het kouder.',
          'Stuk a en stuk d stijgen allebei. Stuk a is steiler.',
          'Hoe steiler, hoe sneller. Dus in stuk a wordt het het snelst warmer.',
        ],
      },
      watch: T(
        'Kijk wat er op de verticale as staat. Staat iemand stil, dan loopt een afstand-tijdgrafiek horizontaal. Bij een snelheidsgrafiek is horizontaal juist steeds even hard. Stilstaan is daar een snelheid van 0: dan ligt de grafiek op de horizontale as.',
      ),
    },
  ],
};
