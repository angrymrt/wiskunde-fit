// Onderwerp: Misleidende statistiek. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, pick, coin, near, rd, isNice, d, until } from '../math.js';
import { F, RF, MC, group, needRound, miss, trap } from './shared.js';
import { T } from '../typeset.js';
import { chart } from '../figures.js';

// Een getal zoals in het boek, met een spatie tussen de duizendtallen vanaf 10 000.
const g = (x) => group(d(x));
// = of ≈ met het getal afgerond op k decimalen.
const eq = (x, k = 1) => `${isNice(x, k) ? '=' : '≈'} ${g(rd(x, k))}`;
const years = (n, y0 = ri(2019, 2021)) => Array.from({ length: n }, (_, j) => String(y0 + j));
const WORD = { 2: 'twee', 3: 'drie', 4: 'vier', 5: 'vijf' };

// Wat er misleidend kan zijn aan een diagram. Elk soort heeft een eigen figuur hieronder.
const WHAT = {
  as: 'De verticale as begint niet bij 0.',
  tijd: 'De stappen tussen de jaren op de tijdas zijn niet gelijk.',
  schalen: 'Er zijn twee verticale assen met een verschillende schaal.',
  breed: 'De staven worden breder naarmate ze hoger zijn.',
};

// Welke misleidende kenmerken een diagram heeft, berekend uit wat chart() krijgt.
function features(p) {
  const gaps = p.cats.slice(1).map((c, j) => +c - +p.cats[j]);
  return [
    ((p.yr && p.yr[0] > 0) || (p.y2 && p.y2.yr[0] > 0)) && 'as',
    p.kind === 'lijn' && !p.at && new Set(gaps).size > 1 && 'tijd',
    !!p.y2 && 'schalen',
    !!p.grow && 'breed',
  ].filter(Boolean);
}

// Eigen diagrammen waarvan de getallen dicht bij elkaar liggen. De as begint bij lo, in stappen
// van s, en loopt 6 stappen omhoog.
const NARROW = [
  { title: 'Leerlingen op een school', yn: 'leerlingen', lo: 1100, s: 20 },
  { title: 'Verkochte fietsen bij een winkel', yn: 'fietsen', lo: 400, s: 10 },
  { title: 'Prijs van een bioscoopkaartje', yn: 'prijs', unit: 'euro', lo: 10, s: 0.5 },
  { title: 'Bezoekers van de dierentuin', yn: 'bezoekers', unit: '× 1000', lo: 200, s: 5 },
];
// De as begint niet bij 0: een staaf- of lijndiagram met jaren in gelijke stappen.
function axisFig() {
  const c = pick(NARROW),
    cats = years(5),
    hi = c.lo + 6 * c.s;
  const values = until(
    () => cats.map(() => c.lo + (ri(1, 12) * c.s) / 2),
    (values) => {
      const lo = Math.min(...values),
        top = Math.max(...values);
      return top - c.lo >= 3 * (lo - c.lo);
    },
  );
  const p = {
      kind: coin() ? 'staaf' : 'lijn',
      title: c.title,
      cats,
      series: [{ name: c.yn, values }],
      yr: [c.lo, hi],
      ys: c.s,
      yn: c.yn,
      unit: c.unit || '',
      xn: 'jaar',
      vals: true,
    },
    big = values.indexOf(Math.max(...values)),
    small = values.indexOf(Math.min(...values)),
    r = values[big] / values[small];
  return {
    p,
    steps: [
      `De verticale as begint bij ${g(c.lo)} en niet bij 0.`,
      `Daardoor lijkt ${cats[big]} (${g(values[big])}) veel groter dan ${cats[small]} (${g(values[small])}).`,
      `Maar {${g(values[big])}/${g(values[small])}} ${eq(r, 2)}. Dat is maar ${g(rd(r, 2))} keer zoveel.`,
    ],
    ok: () => r < 1.5 && (values[big] - c.lo) / (values[small] - c.lo) >= 3,
  };
}

// Eigen lijndiagrammen die elk jaar ongeveer evenveel groeien: v0 is het begin, r de groei per jaar.
const GROWTH = [
  { title: 'Inwoners van een dorp', yn: 'inwoners', v0: [1800, 2600], r: [15, 40] },
  { title: 'Leden van de hockeyclub', yn: 'leden', v0: [150, 300], r: [4, 12] },
  { title: 'Laadpalen in een gemeente', yn: 'laadpalen', v0: [20, 60], r: [8, 20] },
];
// Jaren met grote stappen eerst en daarna kleine, of andersom.
const UNEVEN = [
  [2000, 2010, 2020, 2021, 2022, 2023],
  [2005, 2010, 2015, 2016, 2017, 2018],
  [2016, 2017, 2018, 2019, 2024],
  [2010, 2011, 2012, 2013, 2018, 2023],
];
// Ongelijke stappen op de tijdas: de jaren staan op gelijke afstand.
function timeFig() {
  const c = pick(GROWTH),
    ys = pick(UNEVEN),
    v0 = ri(c.v0[0], c.v0[1]),
    r = ri(c.r[0], c.r[1]),
    values = ys.map((y) => v0 + r * (y - ys[0])),
    cats = ys.map(String),
    gaps = ys.slice(1).map((y, j) => y - ys[j]),
    jb = gaps.indexOf(Math.max(...gaps)),
    js = gaps.indexOf(Math.min(...gaps)),
    per = (j) => (values[j + 1] - values[j]) / gaps[j],
    bigFirst = jb < js,
    p = {
      kind: 'lijn',
      title: c.title,
      cats,
      series: [{ name: c.yn, values }],
      yn: c.yn,
      xn: 'jaar',
      vals: true,
    };
  const span = (j) =>
    `Van ${cats[j]} tot ${cats[j + 1]}: ` +
    (gaps[j] > 1
      ? `{${g(values[j + 1])} - ${g(values[j])}/${gaps[j]}} = ${g(per(j))} per jaar.`
      : `${g(values[j + 1])} - ${g(values[j])} = ${g(per(j))} per jaar.`);
  return {
    p,
    steps: [
      `Tussen ${cats[jb]} en ${cats[jb + 1]} zitten ${gaps[jb]} jaar, tussen ${cats[js]} en ${cats[js + 1]} maar ${gaps[js]} jaar. Toch staan ze op de tijdas even ver uit elkaar.`,
      `Daardoor lijkt de groei ${bigFirst ? 'eerst snel en daarna langzaam' : 'eerst langzaam en daarna snel'}.`,
      span(jb),
      span(js),
      'Per jaar is de groei dus even groot.',
    ],
    ok: () => near(per(jb), per(js), 1e-9) && gaps[jb] > gaps[js],
  };
}

// Eigen lijndiagrammen met twee lijnen die hetzelfde tellen. fact noemt de echte getallen.
const TWO = [
  {
    title: 'Verkochte fietsen',
    names: ['elektrische fietsen', 'gewone fietsen'],
    axes: ['elektrische fietsen', 'gewone fietsen'],
    fact: (y, a, b) =>
      `Maar in ${y} werden er ${g(a)} elektrische fietsen en ${g(b)} gewone fietsen verkocht.`,
  },
  {
    title: 'Bezoekers in de zomervakantie',
    names: ['museum', 'pretpark'],
    axes: ['bezoekers museum', 'bezoekers pretpark'],
    fact: (y, a, b) =>
      `Maar in ${y} had het museum ${g(a)} bezoekers en het pretpark ${g(b)} bezoekers.`,
  },
  {
    title: 'Leden van twee sportclubs',
    names: ['tennisclub', 'voetbalclub'],
    axes: ['leden tennisclub', 'leden voetbalclub'],
    fact: (y, a, b) => `Maar in ${y} had de tennisclub ${g(a)} leden en de voetbalclub ${g(b)}.`,
  },
];
// Twee verticale assen met een verschillende schaal: de lijnen lijken elkaar te kruisen.
function scalesFig() {
  const c = pick(TWO),
    cats = years(5),
    L = pick([50, 100, 200, 500]),
    k = pick([3, 4, 5]),
    lin = (a, b) => cats.map((_, j) => a + ((b - a) * j) / 4),
    // Een beetje onregelmatig, maar steeds hele getallen.
    wobble = (vs, m) => vs.map((v, j) => Math.round(v + (j % 4 ? ri(-1, 1) * m : 0))),
    a = wobble(lin((ri(25, 40) * L) / 100, (ri(75, 90) * L) / 100), L / 50),
    b = wobble(lin((ri(70, 85) * k * L) / 100, (ri(30, 45) * k * L) / 100), (k * L) / 50),
    p = {
      kind: 'lijn',
      title: c.title,
      cats,
      series: [
        { name: c.names[0], values: a },
        { name: c.names[1], values: b, ax: 2, c: 3 },
      ],
      yr: [0, L],
      yn: c.axes[0],
      y2: { yr: [0, k * L], yn: c.axes[1] },
      xn: 'jaar',
      vals: true,
    };
  return {
    p,
    steps: [
      `De verticale as links loopt tot ${g(L)}, de as rechts tot ${g(k * L)}.`,
      `Daardoor lijkt het of de lijn van ${c.names[0]} die van ${c.names[1]} inhaalt.`,
      c.fact(cats[4], a[4], b[4]),
    ],
    // Aan het begin ligt de lijn van a lager, aan het eind hoger, maar b is altijd groter.
    ok: () =>
      a[0] / L < b[0] / (k * L) &&
      a[4] / L > b[4] / (k * L) &&
      a.every((x, j) => x < b[j]) &&
      // De lijnen kruisen tussen twee jaren, zodat de getallen bij de punten niet over elkaar staan.
      a.every((x, j) => Math.abs(x / L - b[j] / (k * L)) >= 0.12) &&
      Math.max(...a) <= L &&
      Math.max(...b) <= k * L,
  };
}

// Eigen staafdiagrammen die eruitzien als plaatjes: hoe hoger, hoe breder.
const PICS = [
  { title: 'Opbrengst van de sponsorloop', yn: 'opbrengst', unit: 'euro', r: [30, 120], k: 10 },
  { title: 'Verkochte ijsjes in de zomer', yn: 'ijsjes', unit: '', r: [20, 90], k: 10 },
  { title: 'Ingezameld plastic op school', yn: 'plastic', unit: 'kg', r: [40, 160], k: 1 },
];
// Te dikke staven: een staaf die twee keer zo hoog is, is ook twee keer zo breed.
function wideFig() {
  const c = pick(PICS),
    cats = years(4);
  const values = until(
    () => cats.map(() => ri(c.r[0], c.r[1]) * c.k),
    (values) => {
      const q = Math.max(...values) / Math.min(...values);
      return q >= 2 && q <= 3.5 && isNice(q, 1);
    },
  );
  const big = values.indexOf(Math.max(...values)),
    small = values.indexOf(Math.min(...values)),
    r = values[big] / values[small],
    p = {
      kind: 'staaf',
      title: c.title,
      cats,
      series: [{ name: c.yn, values }],
      yn: c.yn,
      unit: c.unit,
      xn: 'jaar',
      vals: true,
      grow: true,
      u: 60,
    };
  return {
    p,
    steps: [
      `{${g(values[big])}/${g(values[small])}} = ${g(r)}, dus ${cats[big]} is ${g(r)} keer zo groot als ${cats[small]}.`,
      `Maar die staaf is ook ${g(r)} keer zo breed. Daardoor lijkt hij ${g(r)}*${g(r)} = ${g(rd(r * r, 6))} keer zo groot.`,
    ],
    ok: () => r >= 2 && near(values[small] * r, values[big], 1e-9),
  };
}

const FIGS = { as: axisFig, tijd: timeFig, schalen: scalesFig, breed: wideFig };
// De valkuil bij elke keuze die niet klopt, met waarom dat kenmerk hier niet geldt.
function wrongChoice(k, p) {
  const line = p.kind === 'lijn';
  return {
    as: [
      'as-begint-wel-bij-0',
      `Kijk naar het onderste getal bij ${p.y2 ? 'de verticale assen' : 'de verticale as'}. Dat is hier 0.`,
    ],
    tijd: [
      'tijdas-heeft-gelijke-stappen',
      'Kijk naar de jaren langs de horizontale as. Daar zit steeds evenveel tijd tussen.',
    ],
    schalen: [
      'maar-een-verticale-as',
      'Dit diagram heeft maar één verticale as, dus ook maar één schaal.',
    ],
    breed: [
      'staven-even-breed',
      line
        ? 'Dit is een lijndiagram. Er zijn geen staven die breder worden.'
        : 'Alle staven zijn hier even breed.',
    ],
  }[k];
}

function s44misleading() {
  const kind = pick(Object.keys(WHAT));
  const made = until(
    () => FIGS[kind](),
    (made) => made.ok(),
  );
  const { p, steps } = made,
    order = [kind, ...Object.keys(WHAT).filter((k) => k !== kind)],
    opts = order.map((k) => T(WHAT[k]));
  return {
    q: T('Waarom is dit diagram misleidend?'),
    fig: chart(p),
    mc: MC(opts, 0),
    hint: 'Kijk bij welk getal de verticale as begint, of de stappen tussen de jaren gelijk zijn, hoeveel verticale assen er zijn en of de staven even breed zijn.',
    steps: [WHAT[kind], ...steps],
    traps: order.slice(1).map((k) => {
      const [id, m] = wrongChoice(k, p);
      return { id, f: (v) => v[0] === T(WHAT[k]), m };
    }),
    v: () => made.ok() && features(p).join() === kind,
  };
}

// Eigen verhalen over een percentage dat verandert. r is het bereik van het percentage.
const SHARES = [
  { what: 'het percentage leerlingen dat met de fiets naar school komt', r: [30, 75] },
  { what: 'de opkomst bij de verkiezing van de leerlingenraad', r: [40, 85] },
  { what: 'het percentage jongeren dat elke week sport', r: [45, 80] },
  { what: 'het marktaandeel van een merk frisdrank', r: [8, 30] },
  { what: 'het percentage huishoudens met zonnepanelen', r: [10, 40] },
  { what: 'het percentage geslaagden voor het rijexamen', r: [40, 65] },
];
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const PP_AS_PCT =
  'Een verschil in procentpunten is geen procentuele verandering. Procentpunten tel je op bij het percentage of trek je ervan af. Voor de procentuele verandering deel je het verschil nog door het oude percentage en vermenigvuldig je met 100%.';
const PCT_AS_PP =
  'Een procentuele verandering is geen verschil in procentpunten. Met 20% stijgen betekent: 20% van het oude percentage erbij. Het verschil in procentpunten is nieuw percentage − oud percentage.';
const NEG =
  'Na "toename" of "afname" schrijf je het getal zonder min. Het woord zegt al of het meer of minder wordt.';
const PCT = [0.05, 0.05];

function s44points() {
  const c = pick(SHARES),
    y1 = ri(2015, 2021),
    y2 = y1 + ri(1, 4),
    mode = pick(['van-naar', 'van-naar', 'punten', 'procent']);
  const { p1, p2, up } = until(
    () => {
      const up = coin();
      let p1, p2;
      if (mode === 'procent') {
        p1 = ri(c.r[0], c.r[1]);
        const r = pick([10, 15, 20, 25, 30, 40, 50]);
        p2 = rd(p1 * (1 + (up ? r : -r) / 100), 6);
      } else {
        p1 = coin() ? ri(c.r[0], c.r[1]) : ri(c.r[0] * 10, c.r[1] * 10) / 10;
        p2 = rd(p1 + ((up ? 1 : -1) * ri(5, 120)) / 10, 1);
      }
      return { p1, p2, up };
    },
    ({ p1, p2 }) => {
      if (mode === 'procent' && !isNice(p2, 1)) return false;
      const pp = rd(Math.abs(p2 - p1), 1);
      const A = (pp / p1) * 100;
      return p2 > 0 && p2 < 100 && pp > 0 && A >= 1 && Math.abs(A - pp) >= 0.5;
    },
  );
  const pp = rd(Math.abs(p2 - p1), 1);
  const A = (pp / p1) * 100,
    r = rd(A, 6),
    word = up ? 'toename' : 'afname',
    verb = up ? 'gestegen' : 'gedaald',
    sgn = up ? 1 : -1,
    pctField = RF(`Procentuele ${word}:`, A, 1, '%'),
    ppField = F(`${cap(word)}:`, pp, 'procentpunt'),
    newField = F(`Percentage in ${y2}:`, p2, '%');
  const fields =
    mode === 'van-naar'
      ? [ppField, pctField]
      : mode === 'punten'
        ? [newField, pctField]
        : [newField, ppField];
  fields[1].br = true;
  const intro = `In ${y1} was ${c.what} ${g(p1)}%.`,
    q =
      mode === 'van-naar'
        ? `${intro} In ${y2} was dat ${g(p2)}%. Met hoeveel procentpunt is het percentage ${verb}? En met hoeveel procent?`
        : mode === 'punten'
          ? `${intro} In ${y2} was het percentage ${g(pp)} procentpunt ${up ? 'hoger' : 'lager'}. Bereken het percentage in ${y2} en de procentuele ${word}.`
          : `${intro} Tot ${y2} is het percentage met ${g(r)}% ${verb}. Bereken het percentage in ${y2} en hoeveel procentpunt het is ${verb}.`;
  const diff = `${g(p2)} - ${g(p1)} = ${g(sgn * pp)}, dus een ${word} van ${g(pp)} procentpunt.`,
    pctSteps = [
      'procentuele verandering = {nieuw - oud/oud} × 100%',
      `{${g(p2)} - ${g(p1)}/${g(p1)}}*100% ${eq(sgn * A)}%`,
      `Dus de procentuele ${word} is ${g(rd(A, 1))}%.`,
    ];
  const steps =
    mode === 'van-naar'
      ? [diff, ...pctSteps]
      : mode === 'punten'
        ? [`${g(p1)} ${up ? '+' : '-'} ${g(pp)} = ${g(p2)}, dus in ${y2} ${g(p2)}%.`, ...pctSteps]
        : [
            `${up ? '100% + ' : '100% - '}${g(r)}% = ${g(100 + sgn * r)}%, dus × ${g((100 + sgn * r) / 100)}.`,
            `${g((100 + sgn * r) / 100)}*${g(p1)} = ${g(p2)}, dus in ${y2} ${g(p2)}%.`,
            diff,
          ];
  // Waar elk getal staat: het verschil in procentpunten, de procentuele verandering, het nieuwe percentage.
  const at = (f) => fields.indexOf(f);
  const iPP = at(ppField),
    iA = at(pctField),
    iN = at(newField);
  return {
    q: T(q + needRound(fields)),
    fields,
    hint: T(
      'Het verschil in procentpunten is nieuw percentage − oud percentage. De procentuele verandering is {nieuw - oud/oud} × 100%.',
    ),
    steps,
    traps: [
      trap(
        'procent-als-procentpunt',
        PCT_AS_PP,
        iPP >= 0 && miss(iPP, [A, r], pp, ...PCT),
        iN >= 0 && mode === 'procent' && miss(iN, [p1 + sgn * r], p2, 0.05),
      ),
      trap(
        'procentpunt-als-procent',
        PP_AS_PCT,
        iA >= 0 && miss(iA, [pp], A, 1e-6, 0.05),
        iN >= 0 && mode === 'punten' && miss(iN, [p1 * (1 + (sgn * pp) / 100)], p2, 0.05),
      ),
      iA >= 0 &&
        trap(
          'gedeeld-door-nieuw',
          'Je hebt door het nieuwe percentage gedeeld. Deel het verschil door oud, het percentage van vóór de verandering.',
          miss(iA, [(pp / p2) * 100], A, ...PCT),
        ),
      iA >= 0 &&
        trap(
          'nieuw-gedeeld-door-oud',
          'Je hebt nieuw gedeeld door oud. Deel het verschil nieuw − oud door oud.',
          miss(iA, [(p2 / p1) * 100], A, ...PCT),
        ),
      trap(
        'min-teken',
        NEG,
        iA >= 0 && miss(iA, [-A], A, ...PCT),
        iPP >= 0 && miss(iPP, [-pp], pp, 0),
      ),
    ].filter(Boolean),
    // Terug van oud naar nieuw: één keer met procentpunten erbij, één keer met de factor.
    v: () => near(p1 + sgn * pp, p2, 1e-9) && near(p1 * (1 + (sgn * A) / 100), p2, 1e-9),
  };
}

// Eigen staaf- en lijndiagrammen voor een bewering. Een as die niet bij 0 begint, begint meestal bij
// een van de getallen in lo, in stappen van s. Een as vanaf 0 loopt tot ongeveer lo + 5 stappen. what is wat er geteld wordt.
const CLAIMS = [
  {
    title: 'Bezoekers van het museum',
    what: 'bezoekers',
    unit: '× 1000',
    lo: [100, 120, 150],
    s: 10,
  },
  { title: 'Leden van de zwemclub', what: 'leden', unit: '', lo: [200, 250, 300], s: 10 },
  {
    title: 'Verkochte kaartjes voor het schoolfeest',
    what: 'kaartjes',
    unit: '',
    lo: [300, 400],
    s: 20,
  },
  { title: 'Ritten met de deelscooter', what: 'ritten', unit: '× 1000', lo: [50, 60, 80], s: 5 },
];

function s44claim() {
  const c = pick(CLAIMS),
    zero = ri(0, 2) === 0,
    ok = coin(),
    cats = years(5),
    times = coin(),
    top = pick(c.lo) + 5 * c.s;
  // Of de bewering klopt, hangt af van de getallen, niet van de as. Bij times zegt de bewering dat
  // B N keer zoveel is als A, en die klopt als B precies N keer A is. Anders zegt de bewering dat
  // het aantal van A naar B meer dan verdubbeld is, en die klopt als B meer dan 2 keer A is.
  const { N, A, B, iA, iB, values, lo, k } = until(
    () => {
      let N, A, B, iA, iB, values, lo, k;
      N = pick(!zero && ok ? [2, 3] : [2, 3, 4, 5]);
      iA = times ? ri(0, 3) : 0;
      iB = times ? ri(iA + 1, 4) : 4;
      if (zero) {
        // De hoogte past bij de getallen. Klopt de bewering niet, dan overdrijft die.
        lo = 0;
        if (times) {
          const r = ok ? N : pick([N - 1, N - 0.5].filter((x) => x >= 1.5));
          A = 2 * ri(Math.ceil(top / 24), Math.floor(top / (2 * r)));
          B = A * r;
        } else {
          A = ri(Math.ceil(top / 10), Math.floor(top / 3));
          B = Math.round((A * (ok ? ri(22, 35) : ri(13, 19))) / 10);
        }
        values = cats.map(() => ri(Math.ceil(top / 6), top));
      } else {
        if (ok) {
          // De as begint net onder A. B lijkt dan veel groter dan A, maar de bewering klopt.
          lo = c.s * ri(1, 3);
          A = lo + ri(Math.ceil(c.s / 2), c.s);
          B = times ? N * A : Math.round((A * ri(22, 30)) / 10);
        } else {
          // In het diagram lijkt B N keer zo hoog of meer dan twee keer zo hoog, maar dat is het niet.
          lo = pick(c.lo);
          const m = times
            ? ri(Math.ceil(c.s / 2), Math.floor((5 * c.s) / N))
            : ri(Math.ceil(c.s / 2), 2 * c.s);
          A = lo + m;
          B = lo + (times ? N * m : Math.round((m * ri(22, 35)) / 10));
        }
        k = Math.max(5, Math.ceil((Math.max(A, B) - lo) / c.s));
        values = cats.map(() => lo + Math.round((ri(1, 2 * k) * c.s) / 2));
      }
      values[iA] = A;
      values[iB] = B;
      return { N, A, B, iA, iB, values, lo, k };
    },
    ({ N, A, B, k }) => {
      const real = B / A,
        claim = times ? N : 2,
        // Klopt de bewering niet, dan ligt de echte verhouding er duidelijk naast.
        clear = ok ? !times || real === N : Math.abs(real - claim) > 0.05;
      return B > A && clear && ok === (times ? real === N : real > 2) && (zero || k <= 8);
    },
  );
  const p = {
      kind: times ? 'staaf' : 'lijn',
      title: c.title,
      cats,
      series: [{ name: c.what, values }],
      ...(zero ? {} : { yr: [lo, lo + k * c.s], ys: c.s }),
      yn: c.what,
      unit: c.unit,
      xn: 'jaar',
      vals: true,
    },
    ratio = B / A,
    pct = ((B - A) / A) * 100,
    // Wat je krijgt als je de hoogte in het diagram vergelijkt in plaats van de getallen.
    looksRatio = (B - lo) / (A - lo),
    looks = ((B - A) / (A - lo)) * 100,
    answer = ok ? 'klopt' : 'klopt niet',
    num = times
      ? RF(`${cats[iB]} is`, ratio, 2, `keer zoveel als ${cats[iA]}`)
      : RF('Procentuele toename:', pct, 1, '%'),
    fields = [
      num,
      {
        sel: ['klopt', 'klopt niet'],
        a: answer,
        pre: 'De bewering',
        label: 'Klopt de bewering?',
        br: true,
      },
    ],
    claim = times
      ? `"In ${cats[iB]} waren er ${WORD[N]} keer zoveel ${c.what} als in ${cats[iA]}."`
      : `"Het aantal ${c.what} is van ${cats[iA]} tot ${cats[iB]} meer dan verdubbeld."`,
    ask = times
      ? `Bereken hoeveel keer zoveel ${c.what} er in ${cats[iB]} echt waren. Klopt de bewering?`
      : `Bereken de procentuele toename van ${cats[iA]} tot ${cats[iB]}. Klopt de bewering?`,
    marks = times ? 'de staven' : 'de punten',
    axisStep = `De verticale as begint bij ${g(lo)} en niet bij 0. Daarom kun je de hoogte van ${marks} niet vergelijken, en reken je met de getallen.`,
    rule = times
      ? `${cap(WORD[N])} keer zoveel betekent dat het getal van ${cats[iB]} precies ${WORD[N]} keer zo groot is als dat van ${cats[iA]}.`
      : 'Meer dan verdubbeld betekent een toename van meer dan 100%.';
  const steps = [
    ...(times
      ? [
          `{${g(B)}/${g(A)}} ${eq(ratio, 2)}`,
          ok
            ? `Er waren dus precies ${WORD[N]} keer zoveel ${c.what}, zoals de bewering zegt.`
            : `Er waren dus ${g(rd(ratio, 2))} keer zoveel ${c.what}, en niet ${WORD[N]} keer.`,
        ]
      : [
          `{${g(B)} - ${g(A)}/${g(A)}}*100% ${eq(pct)}%`,
          `Verdubbelen is een toename van 100%. ${ok ? 'De toename is meer' : 'De toename is minder'}.`,
        ]),
    ...(zero ? [] : [axisStep]),
    `Dus de bewering ${answer}.`,
  ];
  return {
    q: T(`Iemand zegt over het diagram: ${claim}`) + '<br>' + T(`${ask}${needRound([num])}`),
    fig: chart(p),
    fields,
    hint: `${times ? `Deel het getal van ${cats[iB]} door het getal van ${cats[iA]}` : `Bereken de procentuele toename met de getallen van ${cats[iA]} en ${cats[iB]}`}. Reken met de getallen, niet met de hoogte van ${marks}. Vergelijk je uitkomst daarna met de bewering.`,
    steps,
    traps: [
      !zero &&
        trap(
          'as-niet-bij-0-vergeten',
          `Je hebt de hoogte in het diagram vergeleken. De verticale as begint bij ${g(lo)}, niet bij 0. Reken met de getallen zelf.`,
          times ? miss(0, [looksRatio], ratio, 0.005) : miss(0, [looks], pct, ...PCT),
        ),
      times &&
        trap(
          'deling-omgedraaid',
          `Je hebt de deling omgedraaid. Deel het getal van ${cats[iB]} door het getal van ${cats[iA]}.`,
          miss(0, [A / B], ratio, 0.005, 0.005),
        ),
      !times &&
        trap(
          'nieuw-gedeeld-door-oud',
          'Je hebt nieuw gedeeld door oud. Deel het verschil nieuw − oud door oud.',
          miss(0, [(B / A) * 100], pct, ...PCT),
        ),
      !times &&
        trap(
          'gedeeld-door-nieuw',
          'Je hebt door het nieuwe getal gedeeld. Deel het verschil door oud, het getal van vóór de verandering.',
          miss(0, [((B - A) / B) * 100], pct, ...PCT),
        ),
      !times &&
        trap(
          'verschil-geen-procent',
          'Dit is het verschil. Deel dat nog door oud en vermenigvuldig met 100% om de procentuele toename te krijgen.',
          miss(0, [B - A], pct, 1e-6, PCT[1]),
        ),
      // De beslissing volgt uit de berekening. Deze twee vangen alleen een verkeerde keuze.
      !ok && {
        id: 'bewering-klopt-niet',
        f: (v) => v[1] === 'klopt',
        m: `Vergelijk je uitkomst met de bewering. ${rule}${zero ? '' : ` Kijk niet naar de hoogte van ${marks}, want de verticale as begint niet bij 0.`}`,
      },
      ok && {
        id: 'bewering-klopt-wel',
        f: (v) => v[1] === 'klopt niet',
        m: `Vergelijk je uitkomst met de bewering. ${rule}${zero ? '' : ` Het diagram overdrijft wel, want de verticale as begint niet bij 0. Maar de bewering gaat over de getallen.`}`,
      },
    ].filter(Boolean),
    // Reken terug van A naar B met de verhouding of het percentage, kijk op een andere manier of de
    // bewering past, en of alle getallen boven het begin van de as liggen.
    v: () =>
      (times ? near(ratio * A, B, 1e-9) : near(A * (1 + pct / 100), B, 1e-9)) &&
      ok === (times ? B - N * A === 0 : B - A > A) &&
      values.every((x) => x > lo && (zero || x <= lo + k * c.s)),
  };
}

export default {
  slug: 'misleidende-statistiek',
  title: 'Misleidende statistiek',
  intro:
    'Een diagram of een getal kan een verkeerde indruk geven, ook als de gegevens kloppen. Hier leer je herkennen wanneer een diagram misleidend is, reken je met procentpunten en controleer je of een bewering over een diagram klopt.',
  description:
    'Misleidende diagrammen herkennen oefenen: een as die niet bij 0 begint, ongelijke stappen en procentpunten. Havo 3, gratis met uitleg en hints.',
  videos: {
    menno: [['Misleidende statistiek', 'GBPsDtFgJoQ']],
  },
  skills: [
    [120, 'Wat is misleidend aan dit diagram?', s44misleading],
    [121, 'Procentpunten en procentuele verandering', s44points],
    [122, 'Klopt de bewering?', s44claim],
  ],
  learn: [
    {
      t: 'Misleidende diagrammen',
      p: [
        'Een diagram kan de goede getallen bevatten en toch een verkeerde indruk geven. Let daarom op drie dingen.',
        'Is duidelijk waar het diagram over gaat? Kijk naar de titel, wat er langs de assen staat en de eenheden.',
        'Geven de assen de juiste indruk? Begint de verticale as niet bij 0, dan lijken verschillen groter. Staan jaren op gelijke afstand terwijl er niet steeds evenveel jaren tussen zitten, dan lijkt de groei sneller of langzamer. Bij twee verticale assen met een verschillende schaal kun je de lijnen niet met elkaar vergelijken.',
        'Helpen de plaatjes? Wordt een plaatje of staaf twee keer zo hoog en ook twee keer zo breed, dan lijkt het vier keer zo groot.',
      ],
      ex: {
        q:
          T('Waarom is dit diagram misleidend?') +
          chart({
            kind: 'staaf',
            title: 'Leden van de schaakclub',
            cats: ['2022', '2023', '2024'],
            series: [{ name: 'leden', values: [84, 88, 96] }],
            yr: [80, 100],
            ys: 5,
            yn: 'leden',
            xn: 'jaar',
            vals: true,
          }),
        steps: [
          'De verticale as begint bij 80 en niet bij 0.',
          'De staaf van 2024 lijkt vier keer zo hoog als die van 2022.',
          'Maar {96/84} ≈ 1,14. Het aantal leden is maar een klein beetje gegroeid.',
        ],
      },
      watch: 'Kijk altijd eerst naar de getallen langs de assen voordat je naar de vorm kijkt.',
    },
    {
      t: 'Procentpunten',
      p: [
        'Verandert een percentage, dan kun je het verschil op twee manieren geven.',
        'In procentpunten: nieuw percentage − oud percentage. Van 24% naar 18% is een afname van 6 procentpunt.',
        'Als procentuele verandering: {nieuw - oud/oud} × 100%, net als bij andere getallen.',
      ],
      ex: {
        q: T(
          'Het percentage leerlingen dat met de bus komt, daalde van 24% naar 18%. Bereken de afname in procentpunten en de procentuele afname.',
        ),
        steps: [
          '18 - 24 = -6, dus een afname van 6 procentpunt.',
          '{18 - 24/24}*100% = -25%',
          'Dus de procentuele afname is 25%.',
        ],
      },
      watch:
        'Een afname van 6 procentpunt is iets anders dan een afname van 6%. Schrijf er dus altijd bij wat je bedoelt.',
    },
    {
      t: 'Klopt de bewering?',
      p: [
        'Bij een diagram staat vaak een bewering, zoals "drie keer zoveel" of "meer dan verdubbeld". Controleer die met de getallen, niet met de hoogte van de staven.',
        'Hoeveel keer zoveel bereken je met een deling: {nieuw/oud}. Verdubbelen is een toename van 100%.',
      ],
      ex: {
        q: T(
          'Bij het staafdiagram van de schaakclub staat: "In 2024 had de club vier keer zoveel leden als in 2022." In 2022 waren er 84 leden, in 2024 waren er 96.',
        ),
        steps: ['{96/84} ≈ 1,14', 'Het is dus maar 1,14 keer zoveel. De bewering klopt niet.'],
      },
    },
  ],
};
