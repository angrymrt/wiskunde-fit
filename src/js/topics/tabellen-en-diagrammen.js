// Onderwerp: Tabellen en diagrammen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, pick, coin, shuffle, near, rd, isNice, d, roundText } from '../math.js';
import { F, RF, H, MC, euro, group, miss, trap } from './shared.js';
import { T, tabel } from '../typeset.js';
import { chart } from '../figures.js';

// Een getal zoals in het boek, met een spatie tussen de duizendtallen vanaf 10 000.
const g = (x) => group(d(x));
// Een getal met precies k decimalen, zoals 12,0 of 27,50 in een tabel.
const fx = (x, k) => group(rd(x, k).toFixed(Math.max(k, 0)).replace('.', ','));
// Geld: op centen, of zonder komma als het een heel bedrag is.
const eu = (x) => group(euro(rd(x, 2)));
// Een percentage zoals in het boek: afgerond op één decimaal, ook als dat een 0 is (≈ 5,0%).
const pc = (x) => (isNice(x, 1) ? d(x) : rd(x, 1).toFixed(1).replace('.', ','));
const eq = (x) => `${isNice(x, 1) ? '=' : '≈'} ${pc(x)}`;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const ROUND_PCT = ' Rond de percentages af op 1 decimaal.';

// Afronden op 1 decimaal: een fout percentage mag de leerling ook zelf hebben afgerond.
const PCT = [0.05, 0.05];

// De procentuele verandering van oud naar nieuw, met een keuzelijst voor toename of afname en een
// veld voor het percentage. i is de plek van de keuzelijst tussen alle velden.
function change(o, n, i, pre = 'Verandering: een') {
  const pct = ((n - o) / o) * 100,
    up = n > o,
    A = Math.abs(pct),
    word = up ? 'toename' : 'afname';
  return {
    up,
    A,
    word,
    fields: [
      { sel: ['toename', 'afname'], a: word, pre, label: 'Toename of afname', br: true },
      RF('van', A, 1, '%'),
    ],
    steps: (so, sn) => [
      'procentuele verandering = {nieuw - oud/oud} × 100%',
      `{${sn} - ${so}/${so}}*100% ${eq(pct)}%`,
      `Dus de procentuele ${word} is ${pc(A)}%.`,
    ],
    traps: [
      trap(
        'min-teken',
        up
          ? 'Reken nieuw − oud, dus het nieuwe getal min het oude. Bij een toename komt er dan een positief getal uit.'
          : 'Bij een afname geeft de berekening een negatief getal. Na "afname" schrijf je het percentage als positief getal, zonder min.',
        miss(i + 1, [-A], A, ...PCT),
      ),
      trap(
        'gedeeld-door-nieuw',
        'Je hebt door het nieuwe getal gedeeld. Deel het verschil door oud, het getal van vóór de verandering.',
        miss(i + 1, [(Math.abs(n - o) / n) * 100], A, ...PCT),
      ),
      trap(
        'nieuw-gedeeld-door-oud',
        'Je hebt nieuw gedeeld door oud. Dat is het nieuwe getal als percentage van het oude. Deel het verschil nieuw − oud door oud.',
        miss(i + 1, [(n / o) * 100], A, ...PCT),
      ),
      trap(
        'verschil-geen-procent',
        'Dit is het verschil. Deel dat nog door oud en vermenigvuldig met 100% om de procentuele verandering te krijgen.',
        miss(i + 1, [Math.abs(n - o)], A, 1e-6, PCT[1]),
      ),
      {
        id: 'toename-afname-omgedraaid',
        f: (v) => !!v[i] && v[i] !== word,
        m: 'Kijk welk getal het oude is en welk het nieuwe. Is het nieuwe getal groter, dan is het een toename.',
      },
    ],
  };
}

// Eigen tabellen met een totaal, een aantal en het gemiddelde. n en m maken een aantal en een
// gemiddelde, k is op hoeveel decimalen het gemiddelde in de tabel staat. De korte namen staan bij
// de velden en in de formule.
const AVG = [
  {
    title: 'Uitleningen van de bibliotheek',
    tot: 'aantal uitleningen',
    cnt: 'aantal leden',
    avg: 'gemiddeld aantal uitleningen per lid',
    sTot: 'uitleningen',
    sCnt: 'leden',
    sAvg: 'uitleningen per lid',
    n: () => ri(80, 240) * 10,
    m: () => ri(120, 240) / 10,
    k: 1,
  },
  {
    title: 'Bezoekers van het theater',
    tot: 'aantal bezoekers',
    cnt: 'aantal voorstellingen',
    avg: 'gemiddeld aantal bezoekers per voorstelling',
    sTot: 'bezoekers',
    sCnt: 'voorstellingen',
    sAvg: 'bezoekers per voorstelling',
    n: () => ri(120, 260),
    m: () => ri(180, 420),
    k: 0,
  },
  {
    title: 'Kaartverkoop van het zomerfestival',
    tot: 'opbrengst in euro',
    cnt: 'aantal kaartjes',
    avg: 'gemiddelde prijs per kaartje in euro',
    sTot: 'opbrengst',
    sCnt: 'kaartjes',
    sAvg: 'prijs per kaartje',
    n: () => ri(300, 900) * 10,
    m: () => ri(110, 190) / 4,
    k: 2,
    money: true,
  },
  {
    title: 'Fietsverhuur aan zee',
    tot: 'aantal gefietste km',
    cnt: 'aantal ritten',
    avg: 'gemiddelde lengte van een rit in km',
    sTot: 'kilometers',
    sCnt: 'ritten',
    sAvg: 'km per rit',
    n: () => ri(150, 400) * 10,
    m: () => ri(85, 220) / 10,
    k: 1,
  },
];

// Een tabel met in elke rij één ontbrekend getal: het gemiddelde, het totaal of het aantal.
function s43missing() {
  const c = pick(AVG),
    dy = pick([2, 3, 4, 5]),
    y0 = ri(2008, 2024 - 2 * dy);
  const rows = shuffle(['avg', 'tot', 'cnt']).map((kind, j) => {
    const y = y0 + j * dy;
    for (;;) {
      const n = c.n(),
        m = c.m();
      if (kind !== 'avg') {
        const t = rd(n * m, 6);
        if (c.money || Number.isInteger(t)) return { kind, y, n, m, t };
        continue;
      }
      // Het totaal komt niet precies uit, zodat de leerling het gemiddelde moet afronden.
      const t = c.money
        ? rd(n * m + ri(-400, 400) + ri(1, 99) / 100, 2)
        : Math.round(n * m) + ri(1, n - 1);
      if (!isNice(t / n, c.k)) return { kind, y, n, m: t / n, t };
    }
  });
  const showT = (x) => (c.money ? eu(x) : g(x)),
    showM = (x) => fx(x, c.k),
    unit = c.money ? 'euro' : '',
    cell = (r, kind, hide) =>
      hide && r.kind === kind
        ? '?'
        : kind === 'tot'
          ? showT(r.t)
          : kind === 'cnt'
            ? g(r.n)
            : showM(r.m),
    head = ['jaar', c.tot, c.cnt, c.avg],
    body = (hide) =>
      rows.map((r) => [
        String(r.y),
        cell(r, 'tot', hide),
        cell(r, 'cnt', hide),
        cell(r, 'avg', hide),
      ]),
    fields = rows.map((r) =>
      r.kind === 'avg'
        ? RF(`${r.y}: ${c.sAvg} =`, r.m, c.k, unit)
        : r.kind === 'tot'
          ? F(`${r.y}: ${c.sTot} =`, r.t, unit)
          : F(`${r.y}: ${c.sCnt} =`, r.n),
    ),
    at = (kind) => rows.findIndex((r) => r.kind === kind),
    [iA, iT, iC] = ['avg', 'tot', 'cnt'].map(at),
    [A, Tt, C] = [iA, iT, iC].map((i) => rows[i]),
    tA = 0.5 * 10 ** -c.k,
    round = c.money
      ? ' Rond de prijs af op centen.'
      : ` Rond het gemiddelde af op ${roundText(c.k)}.`;
  return {
    q:
      T(`In de tabel ontbreekt in elke rij een getal. Bereken de ontbrekende getallen.${round}`) +
      tabel(c.title, head, body(true), `Tabel: ${c.title}`),
    fields,
    hint: T(
      'Gebruik gemiddelde = {totaal/aantal}. Dan is totaal = aantal × gemiddelde, en aantal = {totaal/gemiddelde}.',
    ),
    steps: [
      `${c.sAvg} = {${c.sTot}/${c.sCnt}}`,
      ...rows.map((r) =>
        r.kind === 'avg'
          ? `${r.y}: ${c.sAvg} = {${showT(r.t)}/${g(r.n)}} ≈ ${showM(r.m)}`
          : r.kind === 'tot'
            ? `${r.y}: ${c.sTot} = ${g(r.n)}*${showM(r.m)} = ${showT(r.t)}`
            : `${r.y}: ${c.sCnt} = {${showT(r.t)}/${showM(r.m)}} = ${g(r.n)}`,
      ),
      H(tabel(c.title, head, body(false), `Ingevulde tabel: ${c.title}`)),
    ],
    traps: [
      trap(
        'deling-omgedraaid',
        'Je hebt de deling omgedraaid. Deel het totaal door het aantal, dus het grote getal door het kleine.',
        miss(iA, [A.n / A.t], A.m, tA, tA),
      ),
      trap(
        'keer-en-delen-verwisseld',
        'Bij een gemiddelde deel je het totaal door het aantal. Het totaal is dus aantal keer gemiddelde, en het aantal is totaal gedeeld door gemiddelde.',
        miss(iA, [A.t * A.n], A.m, tA, tA),
        miss(iT, [Tt.n / Tt.m], Tt.t, 0.5),
        miss(iC, [C.t * C.m], C.n, 0.5),
      ),
    ].filter(Boolean),
    // Reken terug: deel waar de vraag vermenigvuldigt, en andersom.
    v: () =>
      near(Tt.t / Tt.n, Tt.m, 1e-9) &&
      near(C.n * C.m, C.t, 1e-6) &&
      Math.abs(rd(A.m, c.k) * A.n - A.t) <= tA * A.n + 1e-6,
  };
}

// Eigen tabellen met twee rijen en een paar groepen. Een groep is [kop, enkelvoud, meervoud,
// bereik]. share maakt de vraag naar een aandeel.
const years2 = () => {
  const y = ri(2018, 2023);
  return [String(y), String(y + pick([1, 2]))];
};
const SHARE = [
  {
    title: 'Leden van de sportclub',
    all: 'leden',
    rowName: 'jaar',
    rows: years2,
    cats: [
      ['jeugd', 'jeugdlid', 'jeugdleden', [120, 380]],
      ['senioren', 'senior', 'senioren', [90, 300]],
      ['veteranen', 'veteraan', 'veteranen', [30, 120]],
    ],
    share: (one, row) => `Hoeveel procent van de leden was in ${row} ${one}?`,
  },
  {
    title: 'Bezoekers van het openluchtbad',
    all: 'bezoekers',
    rowName: 'jaar',
    rows: years2,
    cats: [
      ['kinderen', 'kind', 'kinderen', [800, 2400]],
      ['volwassenen', 'volwassene', 'volwassenen', [600, 1800]],
      ['ouderen', 'oudere', 'ouderen', [150, 700]],
    ],
    share: (one, row) => `Hoeveel procent van de bezoekers was in ${row} een ${one}?`,
  },
  {
    title: 'Verkochte ijsjes bij de strandtent',
    all: 'ijsjes',
    rowName: 'maand',
    rows: () =>
      pick([
        ['mei', 'juni'],
        ['juni', 'juli'],
        ['juli', 'augustus'],
      ]),
    cats: [
      ['vanille', 'vanille', 'vanille-ijsjes', [300, 900]],
      ['aardbei', 'aardbei', 'aardbei-ijsjes', [200, 700]],
      ['chocolade', 'chocolade', 'chocolade-ijsjes', [250, 800]],
      ['citroen', 'citroen', 'citroen-ijsjes', [80, 400]],
    ],
    share: (one, row) => `Hoeveel procent van de ijsjes in ${row} was ${one}?`,
  },
];
const sum = (xs) => xs.reduce((a, b) => a + b, 0);

// Een tabel: een aandeel in procenten, en de procentuele verandering van een of meer groepen.
function s43share() {
  const c = pick(SHARE),
    rowNames = c.rows(),
    withTotal = coin(),
    mode = pick(['een', 'een', 'twee', 'alles']),
    sr = ri(0, 1),
    si = ri(0, c.cats.length - 1);
  let vals, S, o, n, share;
  for (;;) {
    vals = [0, 1].map(() => c.cats.map((k) => ri(k[3][0], k[3][1])));
    S =
      mode === 'alles'
        ? c.cats.map((_, i) => i)
        : shuffle(c.cats.map((_, i) => i)).slice(0, mode === 'twee' ? 2 : 1);
    o = sum(S.map((i) => vals[0][i]));
    n = sum(S.map((i) => vals[1][i]));
    share = (vals[sr][si] / sum(vals[sr])) * 100;
    const p = (Math.abs(n - o) / o) * 100;
    if (p >= 2 && p <= 80 && share >= 3) break;
  }
  if (mode === 'twee') S.sort((a, b) => a - b);
  const [r0, r1] = rowNames,
    totals = vals.map(sum),
    t = totals[sr],
    p = vals[sr][si],
    other = 1 - sr,
    ch = change(o, n, 1),
    fields = [RF('Aandeel:', share, 1, '%'), ...ch.fields],
    round = fields.some((f) => f.round != null) ? ROUND_PCT : '',
    subj =
      mode === 'alles'
        ? `het totale aantal ${c.all}`
        : `het aantal ${S.map((i) => c.cats[i][2]).join(' en ')}${mode === 'twee' ? ' samen' : ''}`,
    head = [c.rowName, ...c.cats.map((k) => k[0]), ...(withTotal ? ['totaal'] : [])],
    body = vals.map((vs, j) => [rowNames[j], ...vs.map(g), ...(withTotal ? [g(totals[j])] : [])]),
    addUp = (j, idx) =>
      `${rowNames[j]}: ${idx.map((i) => g(vals[j][i])).join(' + ')} = ${g(sum(idx.map((i) => vals[j][i])))}`;
  const stepsA = [
    ...(withTotal ? [] : [`totaal in ${rowNames[sr]}: ${vals[sr].map(g).join(' + ')} = ${g(t)}`]),
    `{${g(p)}/${g(t)}}*100% ${eq(share)}%`,
    `Het aandeel is ${pc(share)}%.`,
  ];
  const stepsB = [
    ...(S.length > 1 && !(mode === 'alles' && withTotal) ? [addUp(0, S), addUp(1, S)] : []),
    ...ch.steps(g(o), g(n)),
  ];
  return {
    q:
      T(`De tabel gaat over de ${c.title.toLowerCase()}.`) +
      tabel(c.title, head, body, `Tabel: ${c.title}`) +
      T(c.share(c.cats[si][1], rowNames[sr])) +
      '<br>' +
      T(`Met hoeveel procent is ${subj} veranderd van ${r0} naar ${r1}?${round}`),
    fields,
    hint: T(
      'Een aandeel is {deel/totaal} × 100%. Voor de procentuele verandering gebruik je {nieuw - oud/oud} × 100%. Tel zo nodig eerst de getallen op die je nodig hebt.',
    ),
    steps: [...stepsA, ...stepsB],
    traps: [
      trap(
        'keer-100-vergeten',
        'Je hebt het deel als kommagetal berekend. Vermenigvuldig nog met 100% om er een percentage van te maken.',
        miss(0, [p / t], share, ...PCT),
      ),
      trap(
        'deling-omgedraaid',
        'Deel het deel door het totaal, dus het kleinste getal door het grootste.',
        miss(0, [(t / p) * 100, t / p], share, ...PCT),
      ),
      trap(
        'andere-rij',
        `Neem het deel en het totaal allebei uit de rij van ${rowNames[sr]}.`,
        miss(0, [(p / totals[other]) * 100, (vals[other][si] / t) * 100], share, ...PCT),
      ),
      mode === 'twee' &&
        trap(
          'een-groep-vergeten',
          'Tel eerst de twee groepen bij elkaar op, in allebei de rijen. Bereken daarna de procentuele verandering.',
          miss(
            2,
            S.map((i) => (Math.abs(vals[1][i] - vals[0][i]) / vals[0][i]) * 100),
            ch.A,
            ...PCT,
          ),
        ),
      ...ch.traps,
    ].filter(Boolean),
    v: () =>
      near((share / 100) * sum(vals[sr]), p, 1e-6) &&
      near(o * (1 + (ch.up ? ch.A : -ch.A) / 100), n, 1e-6) &&
      n > o === ch.up,
  };
}

// Eigen staafdiagrammen over vijf jaar. k is de eenheid op de as, zoals × 1000.
const BARS = [
  {
    title: 'Bezoekers van het pretpark',
    what: 'bezoekers',
    unit: '× 1000',
    k: 1000,
    r: [80, 260],
    total: (a, b) => `Hoeveel bezoekers had het pretpark van ${a} tot en met ${b} samen?`,
  },
  {
    title: 'Verkochte scooters bij een winkel',
    what: 'scooters',
    unit: '',
    k: 1,
    r: [40, 160],
    total: (a, b) => `Hoeveel scooters verkocht de winkel van ${a} tot en met ${b} samen?`,
  },
  {
    title: 'Passagiers van de veerboot',
    what: 'passagiers',
    unit: '× 1000',
    k: 1000,
    r: [30, 95],
    total: (a, b) => `Hoeveel passagiers had de veerboot van ${a} tot en met ${b} samen?`,
  },
];
// Eigen gestapelde staafdiagrammen met twee delen per staaf.
const DAYS = { ma: 'maandag', di: 'dinsdag', wo: 'woensdag', do: 'donderdag', vr: 'vrijdag' };
const STACKS = [
  {
    title: 'Uitslag van het zwemexamen',
    cats: ['groep 5', 'groep 6', 'groep 7'],
    names: ['geslaagd', 'niet geslaagd'],
    r: [
      [14, 28],
      [5, 12],
    ],
    yn: 'kinderen',
    unit: '',
    k: 1,
    u: 64,
    what: 'kinderen',
    tot: (c) => `Hoeveel kinderen uit ${c} deden zwemexamen?`,
    share: (c, s) => `Hoeveel procent van de kinderen uit ${c} is ${s}?`,
  },
  {
    title: 'Maaltijden in de kantine',
    cats: ['ma', 'di', 'wo', 'do', 'vr'],
    names: ['warm', 'koud'],
    r: [
      [30, 90],
      [40, 110],
    ],
    yn: 'maaltijden',
    unit: '',
    k: 1,
    u: 48,
    what: 'maaltijden',
    tot: (c) => `Hoeveel maaltijden verkocht de kantine op ${DAYS[c]}?`,
    share: (c, s) => `Hoeveel procent van de maaltijden op ${DAYS[c]} was ${s}?`,
  },
  {
    title: 'Kaartjes van de dierentuin',
    cats: ['april', 'mei', 'juni'],
    names: ['volwassenen', 'kinderen'],
    r: [
      [18, 45],
      [12, 40],
    ],
    yn: 'kaartjes',
    unit: '× 1000',
    k: 1000,
    u: 60,
    what: 'kaartjes',
    tot: (c) => `Hoeveel kaartjes verkocht de dierentuin in ${c}?`,
    share: (c, s) => `Hoeveel procent van de kaartjes in ${c} was voor ${s}?`,
  },
];
const THOUSAND =
  'Kijk naar de eenheid bij de as: × 1000. Een getal in het diagram moet je dus nog met 1000 vermenigvuldigen.';

// Elke staaf van een staafdiagram over vijf jaar.
function barData(c) {
  const y0 = ri(2018, 2021),
    cats = [0, 1, 2, 3, 4].map((j) => String(y0 + j)),
    values = cats.map(() => ri(c.r[0], c.r[1]));
  return {
    cats,
    values,
    fig: (label) =>
      chart({
        kind: 'staaf',
        title: c.title,
        cats,
        series: [{ name: c.what, values }],
        yn: c.what,
        unit: c.unit,
        xn: 'jaar',
        vals: true,
        ...(label ? { label } : {}),
      }),
  };
}
// Een gestapeld staafdiagram, met elk deel groot genoeg voor zijn getal.
function stackData(c) {
  let vs;
  for (;;) {
    vs = c.names.map((_, s) => c.cats.map(() => ri(c.r[s][0], c.r[s][1])));
    const most = Math.max(...c.cats.map((_, j) => vs[0][j] + vs[1][j]));
    if (vs.flat().every((v) => v >= 0.17 * most)) break;
  }
  return {
    vs,
    fig: (label) =>
      chart({
        kind: 'stapel',
        title: c.title,
        cats: c.cats,
        series: c.names.map((name, s) => ({ name, values: vs[s] })),
        yn: c.yn,
        unit: c.unit,
        u: c.u,
        vals: true,
        ...(label ? { label } : {}),
      }),
  };
}

// Rekenen met een staafdiagram: alles bij elkaar, en de procentuele verandering.
function barQuestion() {
  const c = pick(BARS);
  let data, a, b;
  for (;;) {
    data = barData(c);
    [a, b] = coin() ? [0, 4] : shuffle([0, 1, 2, 3, 4]).slice(0, 2).sort();
    const p = (Math.abs(data.values[b] - data.values[a]) / data.values[a]) * 100;
    if (p >= 2) break;
  }
  const { cats, values } = data,
    total = sum(values),
    o = values[a],
    n = values[b],
    ch = change(o, n, 1),
    fields = [F('Samen:', total * c.k, c.what), ...ch.fields],
    round = fields.some((f) => f.round != null) ? ' Rond het percentage af op 1 decimaal.' : '';
  return {
    q:
      T(c.total(cats[0], cats[4])) +
      '<br>' +
      T(
        `Met hoeveel procent is het aantal ${c.what} veranderd van ${cats[a]} naar ${cats[b]}?${round}`,
      ),
    fig: data.fig(),
    fields,
    hint: T(
      `Lees de getallen af bij de staven.${c.k > 1 ? ' Let op de eenheid bij de as.' : ''} Voor de procentuele verandering gebruik je {nieuw - oud/oud} × 100%.`,
    ),
    steps: [
      `samen: ${values.map(g).join(' + ')} = ${g(total)}`,
      ...(c.k > 1
        ? [`${g(total)} × 1000 = ${g(total * c.k)}, dus ${g(total * c.k)} ${c.what}.`]
        : []),
      ...ch.steps(g(o), g(n)),
    ],
    traps: [
      c.k > 1 && trap('keer-1000-vergeten', THOUSAND, miss(0, [total], total * c.k, 0)),
      ...ch.traps,
    ].filter(Boolean),
    v: () =>
      near(
        values.reduce((s, x) => s + x * c.k, 0),
        total * c.k,
        1e-6,
      ) && near(o * (1 + (ch.up ? ch.A : -ch.A) / 100), n, 1e-6),
  };
}

// Rekenen met een gestapeld staafdiagram: het totaal van een staaf, en welk deel daarvan een stuk is.
function stackQuestion() {
  const c = pick(STACKS),
    { vs, fig } = stackData(c),
    j = ri(0, c.cats.length - 1),
    s = ri(0, 1),
    part = vs[s][j],
    rest = vs[1 - s][j],
    tot = part + rest,
    share = (part / tot) * 100,
    fields = [F('Totaal:', tot * c.k, c.what), RF('Aandeel:', share, 1, '%')];
  fields[1].br = true;
  const round = fields[1].round != null ? ' Rond het percentage af op 1 decimaal.' : '';
  return {
    q: T(c.tot(c.cats[j])) + '<br>' + T(`${c.share(c.cats[j], c.names[s])}${round}`),
    fig: fig(),
    fields,
    hint: `In een gestapeld staafdiagram staan de delen op elkaar. Tel de delen van een staaf op voor het totaal.${c.k > 1 ? ' Let op de eenheid bij de as.' : ''}`,
    steps: [
      `totaal: ${g(vs[0][j])} + ${g(vs[1][j])} = ${g(tot)}`,
      ...(c.k > 1 ? [`${g(tot)} × 1000 = ${g(tot * c.k)}, dus ${g(tot * c.k)} ${c.what}.`] : []),
      `aandeel: {${g(part)}/${g(tot)}}*100% ${eq(share)}%`,
    ],
    traps: [
      trap(
        'alleen-een-deel',
        'Dit is maar één deel van de staaf. Tel de delen op die op elkaar staan.',
        miss(0, [vs[0][j] * c.k, vs[1][j] * c.k], tot * c.k, 0),
      ),
      c.k > 1 && trap('keer-1000-vergeten', THOUSAND, miss(0, [tot], tot * c.k, 0)),
      trap(
        'keer-100-vergeten',
        'Je hebt het deel als kommagetal berekend. Vermenigvuldig nog met 100% om er een percentage van te maken.',
        miss(1, [part / tot], share, ...PCT),
      ),
      trap(
        'gedeeld-door-ander-deel',
        'Je hebt het ene deel door het andere gedeeld. Deel door het totaal van de hele staaf.',
        miss(1, [(part / rest) * 100], share, ...PCT),
      ),
      trap(
        'andere-groep',
        `Dit is het percentage voor "${c.names[1 - s]}". De vraag gaat over "${c.names[s]}".`,
        miss(1, [(rest / tot) * 100], share, ...PCT),
      ),
    ].filter(Boolean),
    v: () => near((tot * c.k) / c.k - rest, part, 1e-9) && near((share / 100) * tot, part, 1e-6),
  };
}
function s43bars() {
  return coin() ? barQuestion() : stackQuestion();
}

// Eigen cirkeldiagrammen. Een sector is [naam in het diagram, woorden in de vraag].
const PIES = [
  {
    title: 'Hoe leerlingen naar school komen',
    unit: 'leerlingen',
    N: [400, 1600],
    cats: [
      ['fiets', 'met de fiets'],
      ['bus', 'met de bus'],
      ['auto', 'met de auto'],
      ['lopend', 'lopend'],
      ['scooter', 'met de scooter'],
    ],
    whole: (N) => `Op een school zitten ${g(N)} leerlingen.`,
    ask: (p) => `Hoeveel leerlingen komen ${p}?`,
    have: (x, p) => `Er komen ${g(x)} leerlingen ${p}.`,
    askAll: 'Hoeveel leerlingen zitten er op de school?',
  },
  {
    title: 'Wat jongeren het liefst doen',
    unit: 'jongeren',
    N: [200, 1200],
    cats: [
      ['sport', 'sport'],
      ['gamen', 'gamen'],
      ['muziek', 'muziek'],
      ['lezen', 'lezen'],
      ['vrienden', 'vrienden'],
    ],
    whole: (N) => `Aan een enquête over vrije tijd deden ${g(N)} jongeren mee.`,
    ask: (p) => `Hoeveel jongeren kozen ${p}?`,
    have: (x, p) => `Er kozen ${g(x)} jongeren ${p}.`,
    askAll: 'Hoeveel jongeren deden mee aan de enquête?',
  },
  {
    title: 'Afval van de school',
    unit: 'kg',
    N: [800, 3000],
    cats: [
      ['papier', 'papier'],
      ['plastic', 'plastic'],
      ['gft', 'gft'],
      ['restafval', 'restafval'],
    ],
    whole: (N) => `In een maand had een school ${g(N)} kg afval.`,
    ask: (p) => `Hoeveel kg ${p} was dat?`,
    have: (x, p) => `In een maand had een school ${g(x)} kg ${p}.`,
    askAll: 'Hoeveel kg afval had de school in die maand in totaal?',
  },
  {
    title: 'Stemmen voor de leerlingenraad',
    unit: 'stemmen',
    N: [300, 1200],
    cats: [
      ['lijst 1', 'lijst 1'],
      ['lijst 2', 'lijst 2'],
      ['lijst 3', 'lijst 3'],
      ['lijst 4', 'lijst 4'],
    ],
    whole: (N) => `Bij de verkiezing van de leerlingenraad werden ${g(N)} stemmen uitgebracht.`,
    ask: (p) => `Hoeveel stemmen kreeg ${p}?`,
    have: (x, p) => `Bij de verkiezing van de leerlingenraad kreeg ${p} ${g(x)} stemmen.`,
    askAll: 'Hoeveel stemmen werden er in totaal uitgebracht?',
  },
];
// Hele procenten die samen 100 zijn, elk groot genoeg voor een sector met een naam.
function pieParts(k) {
  for (;;) {
    const ps = Array.from({ length: k - 1 }, () => ri(6, 45));
    const last = 100 - sum(ps);
    if (last >= 6 && last <= 50) return [...ps, last];
  }
}
function pieData(c) {
  const k = Math.min(c.cats.length, pick([3, 4, 4, 5])),
    cats = c.cats.slice(0, k),
    ps = pieParts(k);
  return {
    cats,
    ps,
    fig: (label) =>
      chart({
        kind: 'cirkel',
        title: c.title,
        cats: cats.map((x) => x[0]),
        series: [{ values: ps }],
        pct: true,
        ...(label ? { label } : {}),
      }),
  };
}

// Rekenen met een cirkeldiagram: van het totaal naar een deel, of van een deel naar het totaal.
function s43pie() {
  const c = pick(PIES),
    { cats, ps, fig } = pieData(c),
    i = ri(0, cats.length - 1),
    pX = ps[i],
    unitPost = c.unit,
    lo = Math.ceil(c.N[0] / 10),
    hi = Math.floor(c.N[1] / 10);
  if (coin()) {
    let N, x;
    do {
      N = ri(lo, hi) * 10;
      x = (pX * N) / 100;
    } while (!Number.isInteger(x));
    return {
      q: T(`${c.whole(N)} ${c.ask(cats[i][1])}`),
      fig: fig(),
      fields: [F('Dat is', x, unitPost)],
      hint: 'Lees het percentage af in het cirkeldiagram. Neem dat percentage van het totaal.',
      steps: [`${pX}% van ${g(N)} is ${d(pX / 100)}*${g(N)} = ${g(x)}`],
      traps: [
        trap(
          'procent-als-aantal',
          'Dit is het percentage uit het diagram. Bereken nog hoeveel dat is van het totaal.',
          miss(0, [pX], x, 0),
        ),
        trap(
          'komma-verschoven',
          `Let op de komma. ${pX}% is ${d(pX / 100)} als kommagetal, want je deelt het procent door 100.`,
          miss(0, [x * 10, x / 10, x * 100, x / 100], x, 0.5),
        ),
        trap(
          'gedeeld-in-plaats-van-keer',
          'Je hebt het totaal door het procent gedeeld. Vermenigvuldig het totaal met het procent als kommagetal.',
          miss(0, [N / (pX / 100), N / pX], x, 0.5),
        ),
      ].filter(Boolean),
      v: () => near((x / N) * 100, pX, 1e-9),
    };
  }
  let j, N, x, y;
  do {
    j = ri(0, cats.length - 1);
    N = ri(lo, hi) * 10;
    x = (pX * N) / 100;
    y = (ps[j] * N) / 100;
  } while (j === i || !Number.isInteger(x) || !Number.isInteger(y));
  const pY = ps[j],
    fields = [F('Totaal:', N, unitPost), F(`${cap(cats[j][0])}:`, y, unitPost)];
  fields[1].br = true;
  return {
    q: T(`${c.have(x, cats[i][1])}`) + '<br>' + T(c.askAll) + '<br>' + T(c.ask(cats[j][1])),
    fig: fig(),
    fields,
    hint: 'Je weet een deel en het percentage dat erbij hoort. Reken eerst terug naar het totaal.',
    steps: [
      `${pX}% van het totaal is ${g(x)}`,
      `${d(pX / 100)} × totaal = ${g(x)}`,
      `totaal = {${g(x)}/${d(pX / 100)}} = ${g(N)}`,
      `${pY}% van ${g(N)} is ${d(pY / 100)}*${g(N)} = ${g(y)}`,
    ],
    traps: [
      trap(
        'keer-in-plaats-van-delen',
        'Je hebt het deel nog eens met het procent vermenigvuldigd. Het totaal is groter dan het deel: deel door het procent als kommagetal.',
        miss(0, [(x * pX) / 100], N, 0.5),
      ),
      trap(
        'procent-van-het-deel',
        'Je hebt het procent genomen van het deel uit de vraag. Neem het procent van het totaal.',
        miss(1, [(x * pY) / 100], y, 0.5),
      ),
      trap(
        'procent-als-aantal',
        'Dit is het percentage uit het diagram. Bereken nog hoeveel dat is van het totaal.',
        miss(1, [pY], y, 0),
      ),
    ].filter(Boolean),
    // Via de verhouding van de twee sectoren, zonder het totaal.
    v: () => near((x / N) * 100, pX, 1e-9) && near((x * pY) / pX, y, 1e-9),
  };
}

// Welk diagram past bij een situatie: eigen voorbeelden per soort diagram.
const NAMES = {
  staaf: 'staafdiagram',
  stapel: 'gestapeld staafdiagram',
  cirkel: 'cirkeldiagram',
  lijn: 'lijndiagram',
};
const SITUATIONS = {
  lijn: [
    'Je wilt laten zien hoe het aantal inwoners van een dorp elk jaar van 2000 tot 2025 veranderde.',
    'Je hebt een dag lang elk uur de temperatuur in je tuin gemeten. Je wilt laten zien hoe de temperatuur verliep.',
    'Je wilt laten zien hoe het gewicht van een puppy week na week toenam.',
    'Je wilt laten zien hoe de prijs van een liter melk zich van 2010 tot 2025 heeft ontwikkeld.',
  ],
  cirkel: [
    'Je hebt alle leerlingen van je klas gevraagd wat hun lievelingsfruit is. Je wilt laten zien welk deel van de klas elk soort fruit koos.',
    'Je wilt laten zien welk deel van je zakgeld naar kleding, eten, sparen en uitgaan gaat.',
    'Je wilt laten zien welk deel van alle stemmen bij de verkiezing van de leerlingenraad elke lijst kreeg.',
  ],
  staaf: [
    'Je wilt de lengte van vijf rivieren met elkaar vergelijken.',
    'Je wilt de prijs van dezelfde koptelefoon in vijf winkels met elkaar vergelijken.',
    'Je wilt de gemiddelde temperatuur in juli in zes steden met elkaar vergelijken.',
    'Je wilt laten zien hoe hoog vijf bekende torens zijn.',
  ],
  stapel: [
    'Je wilt per klas laten zien hoeveel leerlingen met de fiets en hoeveel met de bus komen, en ook hoeveel leerlingen er in elke klas zitten.',
    'Je wilt voor vier sportclubs laten zien hoeveel leden jongens en hoeveel leden meisjes zijn, en ook hoeveel leden elke club in totaal heeft.',
    'Je wilt voor drie supermarkten laten zien hoeveel kilo gewone en hoeveel kilo biologische bananen ze verkochten, en ook hoeveel kilo bananen elke supermarkt in totaal verkocht.',
  ],
};
// Wat elk soort diagram goed laat zien, zoals in de uitleg.
const GOOD_FOR = {
  staaf: 'Met een staafdiagram vergelijk je losse getallen met elkaar.',
  stapel:
    'In een gestapeld staafdiagram bestaat elke staaf uit delen. Je ziet de delen en ook het totaal van elke staaf.',
  cirkel: 'Een cirkeldiagram laat zien welk deel van het geheel elk stuk is.',
  lijn: 'Een lijndiagram laat zien hoe iets zich in de tijd ontwikkelt.',
};
// De keuzes per situatie: alleen soorten die echt minder goed passen, zodat er één antwoord is.
const OPTIONS = {
  lijn: ['lijn', 'cirkel', 'stapel'],
  cirkel: ['cirkel', 'lijn', 'staaf'],
  staaf: ['staaf', 'lijn', 'cirkel'],
  stapel: ['stapel', 'cirkel', 'lijn'],
};
// Wat er mis is met een keuze, per goede soort en gekozen soort.
const WRONG = {
  lijn: {
    cirkel: [
      'cirkel-zonder-geheel',
      'Een cirkeldiagram laat delen van één geheel zien. Hier verandert één getal in de tijd.',
    ],
    stapel: [
      'stapel-zonder-delen',
      'In een gestapeld staafdiagram bestaat elke staaf uit delen. Hier is er op elk moment maar één getal.',
    ],
  },
  cirkel: {
    lijn: [
      'lijn-zonder-tijd',
      'Een lijndiagram laat zien hoe iets in de tijd verandert. Hier gaat het niet over de tijd.',
    ],
    staaf: [
      'staaf-bij-deel-van-geheel',
      'Met een staafdiagram vergelijk je getallen, maar je ziet niet goed welk deel van het geheel elk stuk is.',
    ],
  },
  staaf: {
    lijn: [
      'lijn-zonder-tijd',
      'Een lijndiagram laat zien hoe iets in de tijd verandert. Hier gaat het niet over de tijd.',
    ],
    cirkel: [
      'cirkel-zonder-geheel',
      'Een cirkeldiagram laat delen van één geheel zien. Deze getallen vormen samen geen geheel.',
    ],
  },
  stapel: {
    cirkel: [
      'cirkel-bij-meer-groepen',
      'Een cirkeldiagram laat de verdeling van één geheel zien. Hier wil je voor elke groep de delen en het totaal.',
    ],
    lijn: [
      'lijn-zonder-tijd',
      'Een lijndiagram laat zien hoe iets in de tijd verandert. Hier gaat het niet over de tijd.',
    ],
  },
};

// Een lijndiagram voor de vraag welk diagram dit is.
function lineFig(label) {
  const w0 = ri(20, 40) / 10,
    values = [w0];
  for (let j = 1; j < 6; j++) values.push(rd(values[j - 1] + ri(3, 12) / 10, 1));
  return chart({
    kind: 'lijn',
    title: 'Gewicht van een puppy',
    cats: ['1', '2', '3', '4', '5', '6'],
    series: [{ name: 'gewicht', values }],
    xn: 'week',
    yn: 'gewicht',
    unit: 'kg',
    vals: true,
    label,
  });
}

function s43which() {
  const kinds = ['staaf', 'stapel', 'cirkel', 'lijn'];
  if (ri(0, 3) === 0) {
    // Welk diagram is dit? De beschrijving voor een schermlezer noemt de soort niet.
    const kind = pick(kinds),
      label = 'Diagram',
      fig =
        kind === 'staaf'
          ? barData(pick(BARS)).fig(label)
          : kind === 'stapel'
            ? stackData(pick(STACKS)).fig(label)
            : kind === 'cirkel'
              ? pieData(pick(PIES)).fig(label)
              : lineFig(label),
      order = [kind, ...kinds.filter((k) => k !== kind)],
      opts = order.map((k) => T(NAMES[k])),
      twin = { staaf: 'stapel', stapel: 'staaf' }[kind];
    return {
      q: T('Wat voor diagram is dit?'),
      fig,
      mc: MC(opts, 0),
      hint: 'Kijk of er staven, sectoren van een cirkel of punten met een lijn zijn. Bestaat een staaf uit delen op elkaar?',
      steps: [`Dit is een ${NAMES[kind]}.`, GOOD_FOR[kind]],
      traps: twin
        ? [
            {
              id: 'staaf-en-stapel-verwisseld',
              f: (v) => v[0] === T(NAMES[twin]),
              m:
                kind === 'stapel'
                  ? 'Kijk goed: elke staaf bestaat uit delen op elkaar. Dat is een gestapeld staafdiagram.'
                  : 'Elke staaf is hier één getal, zonder delen op elkaar. Dat is een gewoon staafdiagram.',
            },
          ]
        : [],
      v: () =>
        fig.includes(
          kind === 'cirkel' ? 'class="sec' : kind === 'lijn' ? 'class="ln' : 'class="st',
        ),
    };
  }
  const kind = pick(kinds),
    situation = pick(SITUATIONS[kind]),
    order = OPTIONS[kind],
    opts = order.map((k) => T(NAMES[k]));
  return {
    q: T(`${situation} Welk diagram past het best?`),
    mc: MC(opts, 0),
    hint: 'Gaat het over een ontwikkeling in de tijd, over delen van één geheel, over losse getallen vergelijken, of over groepen die uit delen bestaan?',
    steps: [GOOD_FOR[kind], `Dus een ${NAMES[kind]} past het best.`],
    traps: order.slice(1).map((k) => {
      const [id, m] = WRONG[kind][k];
      return { id, f: (v) => v[0] === T(NAMES[k]), m };
    }),
    v: () => order[0] === kind && Object.keys(WRONG[kind]).length === order.length - 1,
  };
}

export default {
  slug: 'tabellen-en-diagrammen',
  title: 'Tabellen en diagrammen',
  intro:
    'Gegevens zet je overzichtelijk in een tabel of een diagram. Hier reken je met een gemiddelde, een aandeel en een procentuele verandering uit een tabel, lees je staaf- en cirkeldiagrammen af en leer je welk diagram bij welke gegevens past.',
  description:
    'Tabellen en diagrammen oefenen: gemiddelde, aandeel en procentuele verandering aflezen, en kiezen welk diagram past. Havo 3, gratis met uitleg.',
  videos: {
    menno: [['Tabellen en diagrammen', 'rAx6i4uWHI0']],
  },
  skills: [
    [115, 'Ontbrekend getal in een tabel', s43missing],
    [116, 'Rekenen met een tabel', s43share],
    [117, 'Rekenen met een staafdiagram', s43bars],
    [118, 'Rekenen met een cirkeldiagram', s43pie],
    [119, 'Welk diagram past?', s43which],
  ],
  learn: [
    {
      t: 'Gemiddelde in een tabel',
      p: [
        'In een tabel staat vaak een totaal, een aantal en het gemiddelde. Die drie horen bij elkaar:',
        'gemiddelde = {totaal/aantal}',
        'Ken je er twee, dan bereken je de derde. Het totaal is aantal × gemiddelde, en het aantal is {totaal/gemiddelde}.',
      ],
      ex: {
        q:
          T('Bereken het gemiddeld aantal bezoekers per voorstelling. Rond af op gehelen.') +
          tabel(
            'Bezoekers van een filmhuis',
            ['jaar', 'aantal bezoekers', 'aantal voorstellingen', 'gemiddeld per voorstelling'],
            [['2024', g(48125), '412', '?']],
            'Voorbeeldtabel: bezoekers van een filmhuis',
          ),
        steps: [
          'gemiddelde = {totaal/aantal}',
          `{${g(48125)}/412} ≈ 117`,
          'Gemiddeld 117 bezoekers per voorstelling.',
        ],
      },
      watch:
        'Kijk bij afronden naar de getallen in de tabel. Staat het gemiddelde op 1 decimaal, rond dan ook op 1 decimaal af.',
    },
    {
      t: 'Aandeel en procentuele verandering',
      p: [
        'Het aandeel van een groep is welk deel van het totaal die groep is, in procenten: {deel/totaal} × 100%. Staat het totaal niet in de tabel, tel dan eerst de getallen in de rij op.',
        'Bij twee rijen, zoals twee jaren, bereken je de procentuele verandering: {nieuw - oud/oud} × 100%.',
      ],
      ex: {
        q:
          T('Hoeveel procent van de leden was in 2025 jeugdlid?') +
          tabel(
            'Leden van een hockeyclub',
            ['jaar', 'jeugd', 'senioren'],
            [
              ['2024', '214', '188'],
              ['2025', '236', '179'],
            ],
            'Voorbeeldtabel: leden van een hockeyclub',
          ),
        steps: ['totaal in 2025: 236 + 179 = 415', '{236/415}*100% ≈ 56,9%'],
      },
      watch: 'Neem het deel en het totaal uit dezelfde rij.',
    },
    {
      t: 'Soorten diagrammen',
      p: [
        'Met een staafdiagram vergelijk je getallen snel met elkaar. In een gestapeld staafdiagram bestaat elke staaf uit delen op elkaar: je ziet de delen en het totaal van elke staaf.',
        'Een cirkeldiagram laat zien welk deel van het geheel elk stuk is. Een lijndiagram laat zien hoe iets zich in de tijd ontwikkelt.',
      ],
      ex: {
        q:
          T('Hoeveel procent van de kinderen uit groep 6 is geslaagd?') +
          chart({
            kind: 'stapel',
            title: 'Uitslag van het zwemexamen',
            cats: ['groep 5', 'groep 6'],
            series: [
              { name: 'geslaagd', values: [21, 18] },
              { name: 'niet geslaagd', values: [6, 9] },
            ],
            yn: 'kinderen',
            u: 64,
            vals: true,
          }),
        steps: ['In groep 6: 18 + 9 = 27 kinderen', '{18/27}*100% ≈ 66,7%'],
      },
      watch: 'Kijk naar de eenheid bij de as. Staat er (× 1000), dan betekent 48 eigenlijk 48 000.',
    },
    {
      t: 'Rekenen met een cirkeldiagram',
      p: [
        'In een cirkeldiagram staan vaak percentages. Ken je het totaal, dan bereken je een deel met het percentage als kommagetal. Ken je alleen een deel, reken dan eerst terug naar het totaal.',
      ],
      ex: {
        q: T(
          'Op een school komt 35% van de leerlingen met de bus. Dat zijn 287 leerlingen. Hoeveel leerlingen zitten er op de school?',
        ),
        steps: [
          '0,35 × totaal = 287',
          'totaal = {287/0,35} = 820',
          'Er zitten 820 leerlingen op de school.',
        ],
      },
    },
  ],
};
