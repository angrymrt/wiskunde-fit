// Onderwerp: Interpoleren en extrapoleren. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, pick, near, rd, isNice, d } from '../math.js';
import { F, RF, needRound, group, miss, trap } from './shared.js';
import { T, tabel } from '../typeset.js';
import { chart } from '../figures.js';

// Een getal zoals in het boek, met een spatie tussen de duizendtallen vanaf 10 000.
const g = (x) => group(d(x));
// Een getal met precies k decimalen, zoals in de tabel: 52,0 of 7,50.
const fx = (x, k) => group(rd(x, k).toFixed(Math.max(k, 0)).replace('.', ','));
// = of ≈ met het getal op k decimalen.
const eq = (x, k) => `${isNice(x, k) ? '=' : '≈'} ${fx(x, k)}`;
// Een tussenresultaat zoals in het boek: precies als het mooi uitkomt, anders afgekapt met
// puntjes, zoals 1,85... Je rekent door met het getal dat niet is afgerond.
function dots(x) {
  if (isNice(x, 4)) return g(rd(x, 4));
  const k = Math.max(2, 1 - Math.floor(Math.log10(Math.abs(x)))),
    t = Math.trunc(rd(x * 10 ** k, 6)) / 10 ** k;
  return `${group(t.toFixed(k).replace('.', ','))}...`;
}
// De schatting in jaar x met de rechte lijn door twee waarnemingen (xa, va) en (xb, vb). Zo rekent
// v na, op een andere manier dan de uitwerking.
const line = (xa, va, xb, vb, x) => (va * (xb - x) + vb * (x - xa)) / (xb - xa);
// Ligt x precies midden tussen twee getallen met k decimalen, zoals 4,45? Dan is afronden lastig na
// te kijken, dus zo'n vraag maken we niet.
const half = (x, k) => near((Math.abs(x) * 10 ** k) % 1, 0.5, 1e-6);

// Eigen gegevens over een paar jaar. the is waar het over gaat, row de naam in de tabel, post het
// woord achter een getal, zu het woord achter een getal na the. k is het aantal decimalen in de tabel.
// v0 is het bereik van de eerste waarde, s het bereik van de verandering per jaar en min hoe groot
// die verandering minstens is. Elke waarde, ook een schatting, blijft binnen real, zodat het verhaal
// echt kan: geen 11 uur schermtijd per dag.
const DATA = [
  {
    title: 'Inwoners van de stad',
    the: 'het aantal inwoners',
    row: 'inwoners (× 1000)',
    yn: 'inwoners',
    unit: '× 1000',
    post: 'duizend',
    zu: 'duizend',
    k: 1,
    v0: [40, 70],
    s: [-0.4, 1.5],
    min: 0.1,
    real: [25, 110],
  },
  {
    title: 'Leden van de atletiekclub',
    the: 'het aantal leden',
    row: 'leden',
    yn: 'leden',
    unit: '',
    post: 'leden',
    zu: '',
    k: 0,
    v0: [150, 350],
    s: [-10, 25],
    min: 2,
    real: [100, 700],
  },
  {
    title: 'Afval per inwoner',
    the: 'de hoeveelheid afval per inwoner',
    row: 'afval per inwoner (kg)',
    yn: 'afval',
    unit: 'kg',
    post: 'kg',
    zu: 'kg',
    k: 0,
    v0: [470, 560],
    s: [-9, 3],
    min: 1,
    real: [380, 600],
  },
  {
    title: 'Prijs van een bioscoopkaartje',
    the: 'de prijs van een bioscoopkaartje',
    row: 'prijs (euro)',
    yn: 'prijs',
    unit: 'euro',
    post: 'euro',
    zu: 'euro',
    k: 2,
    v0: [6.5, 9],
    s: [0.08, 0.4],
    min: 0.05,
    real: [5, 14],
  },
  {
    title: 'Bezoekers van het museum',
    the: 'het aantal bezoekers',
    row: 'bezoekers (× 1000)',
    yn: 'bezoekers',
    unit: '× 1000',
    post: 'duizend',
    zu: 'duizend',
    k: 1,
    v0: [80, 160],
    s: [-4, 6],
    min: 0.5,
    real: [50, 250],
  },
  {
    title: 'Schermtijd van jongeren per dag',
    the: 'de gemiddelde schermtijd per dag',
    row: 'schermtijd (uur)',
    yn: 'schermtijd',
    unit: 'uur',
    post: 'uur',
    zu: 'uur',
    k: 1,
    v0: [2, 3.5],
    s: [0.05, 0.3],
    min: 0.05,
    real: [1, 6],
  },
  {
    title: 'Laadpalen in de gemeente',
    the: 'het aantal laadpalen',
    row: 'laadpalen',
    yn: 'laadpalen',
    unit: '',
    post: 'laadpalen',
    zu: '',
    k: 0,
    v0: [20, 80],
    s: [6, 40],
    min: 3,
    real: [5, 900],
  },
];

// Kan deze waarde echt voorkomen in het verhaal van c?
const real = (c, v) => v >= c.real[0] && v <= c.real[1];

// Een reeks waarnemingen: n jaren met stappen van 2 tot 8 jaar, en bij elk jaar een waarde.
function makeData(n = ri(4, 5)) {
  const c = pick(DATA),
    p = 10 ** c.k;
  for (;;) {
    const gaps = Array.from({ length: n - 1 }, () => ri(2, 8)),
      span = gaps.reduce((a, b) => a + b, 0);
    if (span > 26) continue;
    const ys = [ri(1996, 2024 - span)];
    gaps.forEach((gp) => ys.push(ys[ys.length - 1] + gp));
    const vs = [ri(c.v0[0] * p, c.v0[1] * p) / p];
    let ok = true;
    for (const gp of gaps) {
      const dv = ri(Math.round(gp * c.s[0] * p), Math.round(gp * c.s[1] * p)) / p;
      if (Math.abs(dv) < gp * c.min) ok = false;
      vs.push(rd(vs[vs.length - 1] + dv, c.k));
    }
    if (ok && vs.every((v) => real(c, v))) return { c, ys, vs };
  }
}

// De gegevens als tabel in de vraag, of als lijndiagram met de jaren op de goede afstand. Twee
// jaren die dicht bij elkaar liggen, staan in het diagram minstens 46 pixels uit elkaar, zodat de
// jaartallen en de getallen niet over elkaar vallen. Wordt het diagram dan te breed, dan een tabel. Anders meestal een lijndiagram.
function show({ c, ys, vs }) {
  const n = ys.length,
    span = ys[n - 1] - ys[0],
    close = Math.min(...ys.slice(1).map((y, i) => y - ys[i])),
    u = Math.max(48, Math.ceil((46 * span) / (close * (n - 1))));
  if (ri(0, 2) === 0 || span / close > 6)
    return {
      look: 'Bekijk de tabel.',
      html: tabel(
        c.title,
        ['jaar', ...ys.map(String)],
        [[c.row, ...vs.map((v) => fx(v, c.k))]],
        `Tabel: ${c.title}`,
      ),
    };
  return {
    look: 'Bekijk het lijndiagram.',
    html: '',
    fig: chart({
      kind: 'lijn',
      title: c.title,
      cats: ys.map(String),
      at: ys,
      series: [{ name: c.yn, values: vs }],
      xn: 'jaar',
      yn: c.yn,
      unit: c.unit,
      vals: true,
      u,
    }),
  };
}

// De regel uit de uitwerking: gemiddelde per jaar = verschil in waarde / verschil in jaren.
const perYear = (c, Ya, va, Yb, vb, r) =>
  `gemiddelde per jaar = {${fx(vb, c.k)} - ${fx(va, c.k)}/${Yb} - ${Ya}} = ${dots(r)}`;
const RATE = 'gemiddelde verandering per jaar = {verschil in waarde/verschil in jaren}';

// De gegevens en twee waarnemingen waartussen de verandering per jaar niet op een half uitkomt.
function rateData() {
  for (;;) {
    const D = makeData(),
      n = D.ys.length,
      whole = ri(0, 2) === 0,
      j = ri(0, n - 2),
      [a, b] = whole ? [0, n - 1] : [j, j + 1],
      nr = Math.min(D.c.k + 1, 2),
      r = rd(D.vs[b] - D.vs[a], D.c.k) / (D.ys[b] - D.ys[a]);
    if (!half(r, nr)) return { D, whole, a, b, nr };
  }
}

function s45rate() {
  const { D, whole, a, b, nr } = rateData(),
    { c, ys, vs } = D,
    n = ys.length,
    k = c.k,
    [Ya, Yb, va, vb] = [ys[a], ys[b], vs[a], vs[b]],
    gap = Yb - Ya,
    diff = rd(vb - va, k),
    r = diff / gap,
    up = diff > 0,
    tol = 0.5 * 10 ** -nr,
    fields = [
      F(`Verandering van ${Ya} tot ${Yb}:`, diff, c.post),
      { ...RF('Gemiddelde verandering per jaar:', rd(r, 9), nr, c.post), br: true },
    ],
    { look, html, fig } = show(D);
  return {
    q:
      T(
        `${look} Bereken hoeveel ${c.the} van ${Ya} tot ${Yb} is veranderd, en de gemiddelde verandering per jaar. Is het een afname, zet dan een min voor het getal.${needRound(fields)}`,
      ) + html,
    fig,
    fields,
    hint: T(`${RATE}. Bij een afname komt er een negatief getal uit.`),
    steps: [
      `${fx(vb, k)} - ${fx(va, k)} = ${fx(diff, k)}, dus in ${gap} jaar ${fx(Math.abs(diff), k)} ${c.post} ${up ? 'meer' : 'minder'}.`,
      `gemiddelde per jaar = {${fx(vb, k)} - ${fx(va, k)}/${Yb} - ${Ya}} = {${fx(diff, k)}/${gap}} ${isNice(r, nr) ? `= ${g(r)}` : `≈ ${fx(r, nr)}`}`,
      `De gemiddelde verandering is ${isNice(r, nr) ? g(r) : fx(r, nr)} ${c.post} per jaar, een ${up ? 'toename' : 'afname'}.`,
    ],
    traps: [
      trap(
        'niet-gedeeld-door-jaren',
        `Dit is de verandering in ${gap} jaar. Deel die nog door het aantal jaren, ${gap}, dan heb je de verandering per jaar.`,
        miss(1, [diff], r, tol, tol),
      ),
      trap(
        'jaren-verkeerd-geteld',
        `Van ${Ya} tot ${Yb} is ${Yb} − ${Ya} = ${gap} jaar, niet ${gap + 1}.`,
        miss(1, [diff / (gap + 1)], r, tol, tol),
      ),
      whole &&
        trap(
          'gedeeld-door-aantal-stappen',
          `Je hebt gedeeld door het aantal stappen tussen de waarnemingen. Deel door het aantal jaren: ${Yb} − ${Ya} = ${gap}.`,
          miss(1, [diff / (n - 1)], r, tol, tol),
        ),
      trap(
        'deling-omgedraaid',
        'Je hebt de deling omgedraaid. Deel de verandering door het aantal jaren.',
        miss(1, [gap / diff], r, tol, tol),
      ),
      trap(
        'min-teken',
        up
          ? `Reken nieuw − oud: de waarde van ${Yb} min de waarde van ${Ya}. Bij een toename komt er een positief getal uit.`
          : `Reken nieuw − oud: de waarde van ${Yb} min de waarde van ${Ya}. Bij een afname komt er een negatief getal uit, met een min ervoor.`,
        miss(0, [-diff], diff, 1e-6),
        miss(1, [-r], r, tol, tol),
      ),
    ].filter(Boolean),
    // Tel de veranderingen tussen alle waarnemingen op, en reken met de verandering per jaar terug.
    v: () =>
      near(
        ys.slice(a, b).reduce((s, _, i) => s + vs[a + i + 1] - vs[a + i], 0),
        diff,
        1e-9,
      ) && near(va + r * gap, vb, 1e-9),
  };
}

// Valkuilen die bij interpoleren en extrapoleren horen. Y is het jaar, m het aantal jaren vanaf
// de waarde base, sgn +1 vooruit en −1 terug in de tijd. other zijn de schattingen met verkeerde
// waarnemingen, wrongYear die met de jaren geteld vanaf de andere waarneming.
function estimateTraps({ c, Ya, Yb, gap, diff, r, m, sgn, base, Y0, ans, other, wrongYear, why }) {
  const tol = 0.5 * 10 ** -c.k,
    hit = (ws) => miss(0, ws, ans, tol, tol);
  return [
    trap('verkeerde-waarnemingen', why, hit(other.filter((w) => !near(w, ans, 1e-9)))),
    trap(
      'niet-gedeeld-door-jaren',
      `Je hebt ${m} keer de hele verandering van ${Ya} tot ${Yb} genomen. Deel die verandering eerst door het aantal jaren, ${gap}.`,
      hit([base + sgn * m * diff]),
    ),
    trap(
      'jaren-verkeerd-geteld',
      `Van ${Ya} tot ${Yb} is ${Yb} − ${Ya} = ${gap} jaar, niet ${gap + 1}.`,
      hit([base + (sgn * m * diff) / (gap + 1)]),
    ),
    trap(
      'startwaarde-vergeten',
      `Dit is alleen de verandering in ${m} jaar. Begin bij de waarde van ${Y0}, ${fx(base, c.k)}, en reken de verandering daarbij.`,
      hit([m * r, -m * r]),
    ),
    trap(
      'verkeerd-beginjaar',
      `Tel de jaren vanaf het jaar waarvan je de waarde gebruikt: ${Y0}.`,
      hit(wrongYear),
    ),
  ];
}

function s45inter() {
  for (;;) {
    const D = makeData(),
      { c, ys, vs } = D,
      n = ys.length,
      k = c.k,
      j = ri(0, n - 2),
      [Ya, Yb, va, vb] = [ys[j], ys[j + 1], vs[j], vs[j + 1]],
      gap = Yb - Ya,
      Y = ri(Ya + 1, Yb - 1),
      m = Y - Ya,
      diff = rd(vb - va, k),
      r = diff / gap,
      ans = va + m * r;
    // De verandering moet te zien zijn, en de schatting mag niet op een waarneming uitkomen.
    if (Math.abs(m * r) < 2 * 10 ** -k || Math.abs(vb - ans) < 2 * 10 ** -k || half(ans, k))
      continue;
    const est = (p, q) => line(ys[p], vs[p], ys[q], vs[q], Y),
      pairs = [
        [0, n - 1],
        [j - 1, j],
        [j + 1, j + 2],
      ].filter(([p, q]) => p >= 0 && q < n && !(p === j && q === j + 1)),
      fields = [RF(`Schatting voor ${Y}:`, rd(ans, 9), k, c.post)],
      { look, html, fig } = show(D);
    return {
      q: T(`${look} Schat ${c.the} in ${Y}.${needRound(fields)}`) + html,
      fig,
      fields,
      hint: T(
        `Gebruik de twee waarnemingen om ${Y} heen. Bereken eerst de gemiddelde verandering per jaar.`,
      ),
      steps: [
        `${Y} ligt tussen ${Ya} en ${Yb}, dus interpoleren met de waarnemingen van ${Ya} en ${Yb}.`,
        perYear(c, Ya, va, Yb, vb, r),
        `${Y} is ${m} jaar na ${Ya}, dus de schatting voor ${Y} is ${fx(va, k)} + ${m}*${dots(r)} ${eq(ans, k)} ${c.post}.`,
      ],
      traps: estimateTraps({
        c,
        Ya,
        Yb,
        gap,
        diff,
        r,
        m,
        sgn: 1,
        base: va,
        Y0: Ya,
        ans,
        other: pairs.map(([p, q]) => est(p, q)),
        wrongYear: [va + (Yb - Y) * r, vb + m * r],
        why: `Gebruik de twee waarnemingen om ${Y} heen: die van ${Ya} en ${Yb}.`,
      }).filter(Boolean),
      // Met de rechte lijn door de twee waarnemingen, en het jaar ligt ertussen.
      v: () => near(line(Ya, va, Yb, vb, Y), ans, 1e-9) && Ya < Y && Y < Yb && !ys.includes(Y),
    };
  }
}

function s45extra() {
  for (;;) {
    const D = makeData(),
      { c, ys, vs } = D,
      n = ys.length,
      k = c.k,
      back = ri(0, 3) === 0,
      [a, b] = back ? [0, 1] : [n - 2, n - 1],
      [Ya, Yb, va, vb] = [ys[a], ys[b], vs[a], vs[b]],
      gap = Yb - Ya,
      diff = rd(vb - va, k),
      r = diff / gap,
      m = back ? ri(1, 5) : ri(2, 8),
      Y = back ? Ya - m : Yb + m,
      sgn = back ? -1 : 1,
      base = back ? va : vb,
      Y0 = back ? Ya : Yb,
      ans = base + sgn * m * r;
    if (!real(c, ans) || Math.abs(m * r) < 2 * 10 ** -k || half(ans, k)) continue;
    const est = (p, q) => line(ys[p], vs[p], ys[q], vs[q], Y),
      pairs = (
        back
          ? [
              [0, n - 1],
              [1, 2],
            ]
          : [
              [0, n - 1],
              [n - 3, n - 2],
            ]
      ).filter(([p, q]) => p >= 0 && q < n),
      tol = 0.5 * 10 ** -k,
      fields = [RF(`Schatting voor ${Y}:`, rd(ans, 9), k, c.post)],
      { look, html, fig } = show(D),
      first = back
        ? `${Y} ligt vóór ${Ya}, dus extrapoleren terug in de tijd. Gebruik de eerste twee waarnemingen: ${Ya} en ${Yb}.`
        : `${Y} komt na ${Yb}, dus extrapoleren. Gebruik de laatste twee waarnemingen: ${Ya} en ${Yb}.`,
      last = back
        ? `${Y} is ${m} jaar vóór ${Ya}, dus de schatting voor ${Y} is ${fx(va, k)} - ${m}*${dots(r)} ${eq(ans, k)} ${c.post}.`
        : `${Y} is ${m} jaar na ${Yb}, dus de schatting voor ${Y} is ${fx(vb, k)} + ${m}*${dots(r)} ${eq(ans, k)} ${c.post}.`;
    return {
      q: T(`${look} Schat ${c.the} in ${Y}.${needRound(fields)}`) + html,
      fig,
      fields,
      hint: T(
        back
          ? 'Ligt het jaar vóór de eerste waarneming, gebruik dan de eerste twee waarnemingen. Bereken de gemiddelde verandering per jaar en reken terug in de tijd.'
          : 'Ligt het jaar na de laatste waarneming, gebruik dan de laatste twee waarnemingen. Bereken de gemiddelde verandering per jaar.',
      ),
      steps: [first, perYear(c, Ya, va, Yb, vb, r), last],
      traps: [
        ...estimateTraps({
          c,
          Ya,
          Yb,
          gap,
          diff,
          r,
          m,
          sgn,
          base,
          Y0,
          ans,
          other: pairs.map(([p, q]) => est(p, q)),
          wrongYear: back ? [va - (Yb - Y) * r] : [vb + (Y - Ya) * r],
          why: back
            ? `Gebruik bij een jaar vóór de eerste waarneming de eerste twee waarnemingen: die van ${Ya} en ${Yb}.`
            : `Gebruik bij extrapoleren de laatste twee waarnemingen: die van ${Ya} en ${Yb}. Die passen het best bij de nieuwste ontwikkeling.`,
        }),
        back &&
          trap(
            'verkeerde-richting',
            `${Y} ligt vóór ${Ya}. Ga dus terug in de tijd: ${fx(va, k)} − ${m} · ${dots(r)}.`,
            miss(0, [va + m * r], ans, tol, tol),
          ),
      ].filter(Boolean),
      // Met de rechte lijn door de twee waarnemingen, en het jaar ligt buiten de tabel.
      v: () =>
        near(line(Ya, va, Yb, vb, Y), ans, 1e-9) &&
        (back ? Y < ys[0] : Y > ys[n - 1]) &&
        Math.abs(a - b) === 1,
    };
  }
}

// Ligt z tussen de waarden van twee waarnemingen die na elkaar komen? Telt hoe vaak.
const crossings = (vs, z) =>
  vs.slice(1).filter((v, i) => Math.min(v, vs[i]) <= z && z <= Math.max(v, vs[i])).length;

function s45year() {
  for (;;) {
    const D = makeData(),
      { c, ys, vs } = D,
      n = ys.length,
      k = c.k,
      extra = ri(0, 2) === 0,
      j = extra ? n - 2 : ri(0, n - 2),
      [Ya, Yb, va, vb] = [ys[j], ys[j + 1], vs[j], vs[j + 1]],
      gap = Yb - Ya,
      diff = rd(vb - va, k),
      r = diff / gap,
      [Y0, v0] = extra ? [Yb, vb] : [Ya, va],
      t0 = extra ? ri(10, 80) / 10 : ri(7, gap * 10 - 7) / 10;
    // Eerst een tijdstip, dan de mooiste waarde in de buurt die past: op tientallen, vijftallen,
    // tweetallen of gehelen van de laatste decimaal. Het aantal jaren t mag niet bijna op een half
    // uitkomen, want dan is niet duidelijk welk jaar het is.
    const fit = (zs) => {
      const z = rd(Math.round((v0 + t0 * r) / zs) * zs, c.k),
        t = (z - v0) / r,
        fr = t - Math.floor(t),
        exact = near(fr, 0, 1e-9) || near(fr, 1, 1e-9),
        okT = extra ? t >= 1 && t <= 10 : t >= 0.65 && t <= gap - 0.65,
        okFr = exact || (fr >= 0.15 && fr <= 0.35) || (fr >= 0.65 && fr <= 0.85);
      return okT && okFr && real(c, z) && crossings(vs, z) === (extra ? 0 : 1)
        ? { z, t, exact }
        : null;
    };
    const found = [10, 5, 2, 1].map((s) => fit(s * 10 ** -k)).find(Boolean);
    if (!found) continue;
    const { z, t, exact } = found,
      Y = Math.round(Y0 + t),
      tt = exact ? Math.round(t) : t,
      zt = `${fx(z, k)}${c.zu ? ` ${c.zu}` : ''}`,
      dz = rd(z - v0, k),
      field = exact ? F('Jaar:', Y) : RF('Jaar:', Y0 + t, 0),
      { look, html, fig } = show(D),
      tol = 0.5,
      hit = (ws) => miss(0, ws, Y0 + t, tol, tol),
      more = dz > 0 ? 'meer' : 'minder';
    return {
      q:
        T(
          `${look} Schat in welk jaar ${c.the} ${zt} is.${exact ? '' : ' Rond af op een heel jaar.'}`,
        ) + html,
      fig,
      fields: [field],
      hint: T(
        'Bereken de gemiddelde verandering per jaar. Hoeveel moet er nog bij of af? Deel dat door de verandering per jaar. Dan weet je hoeveel jaar later het is.',
      ),
      steps: [
        extra
          ? `${zt} is ${more} dan ${fx(vb, k)}, de laatste waarneming. Dus extrapoleren met de laatste twee waarnemingen: ${Ya} en ${Yb}.`
          : `${zt} ligt tussen ${fx(va, k)} (${Ya}) en ${fx(vb, k)} (${Yb}), dus interpoleren met de waarnemingen van ${Ya} en ${Yb}.`,
        perYear(c, Ya, va, Yb, vb, r),
        `Van ${fx(v0, k)} naar ${fx(z, k)}: ${fx(z, k)} - ${fx(v0, k)} = ${fx(dz, k)}.`,
        `{${fx(dz, k)}/${dots(r)}} ${exact ? `= ${tt}` : `≈ ${fx(t, 1)}`}, dus ${exact ? tt : fx(t, 1)} jaar na ${Y0}.`,
        exact
          ? `${Y0} + ${tt} = ${Y}, dus in ${Y}.`
          : `${Y0} + ${fx(t, 1)} = ${fx(Y0 + rd(t, 1), 1)}, dus in ${Y}.`,
      ],
      traps: [
        trap(
          'aantal-jaren-geen-jaartal',
          `Dit is het aantal jaren na ${Y0}. Tel dat nog op bij ${Y0}.`,
          hit([t]),
        ),
        trap(
          'niet-gedeeld-door-jaren',
          `Deel de verandering van ${Ya} tot ${Yb} eerst door het aantal jaren, ${gap}. Dan heb je de verandering per jaar.`,
          hit([Y0 + dz / diff]),
        ),
        trap(
          'startwaarde-vergeten',
          `Bereken eerst hoeveel er nog bij of af moet: ${fx(z, k)} − ${fx(v0, k)}. Deel dat door de verandering per jaar.`,
          hit([Y0 + z / r]),
        ),
        trap(
          'verkeerd-beginjaar',
          `Je rekent vanaf ${fx(v0, k)}, de waarde in ${Y0}. Tel de jaren dus ook op bij ${Y0}.`,
          hit([(extra ? Ya : Yb) + t]),
        ),
      ].filter(Boolean),
      // Met de rechte lijn door de twee waarnemingen hoort bij dat moment precies z, en z komt
      // niet ook ergens anders in de tabel voor.
      v: () =>
        near(line(Ya, va, Yb, vb, Y0 + t), z, 1e-9) &&
        Math.abs(Y0 + t - Y) <= 0.5 &&
        crossings(vs, z) === (extra ? 0 : 1),
    };
  }
}

// Een voorbeeldtabel voor de uitleg.
const EX = (label) =>
  tabel(
    'Bezoekers van de kinderboerderij',
    ['jaar', '2008', '2015', '2020'],
    [['bezoekers (× 1000)', '12,4', '16,6', '15,1']],
    label,
  );

export default {
  slug: 'interpoleren-en-extrapoleren',
  title: 'Interpoleren en extrapoleren',
  intro:
    'Uit een tabel of een lijndiagram kun je een waarde schatten die er niet in staat. Hier bereken je de gemiddelde verandering per jaar, schat je een waarde tussen twee waarnemingen of erbuiten, en zoek je bij welk jaar een waarde hoort.',
  description:
    'Interpoleren en extrapoleren: bereken de gemiddelde verandering per jaar en schat waarden uit een tabel of lijndiagram. Gratis oefenen met uitleg.',
  videos: {
    menno: [['Interpoleren en extrapoleren', 'EI8vAZMrIBA']],
  },
  skills: [
    [123, 'Gemiddelde verandering per jaar', s45rate],
    [124, 'Interpoleren', s45inter],
    [125, 'Extrapoleren', s45extra],
    [126, 'Welk jaar hoort bij een waarde?', s45year],
  ],
  learn: [
    {
      t: 'Gemiddelde verandering per jaar',
      p: [
        'In een tabel staan waarnemingen: bij een paar jaren de waarde die toen is gemeten. Tussen twee waarnemingen zitten vaak meer jaren.',
        'De gemiddelde verandering per jaar is het verschil in waarde gedeeld door het verschil in jaren. Bij een afname is die negatief.',
      ],
      ex: {
        q:
          T('Bereken de gemiddelde verandering per jaar van 2008 tot 2015.') +
          EX('Voorbeeldtabel bij de gemiddelde verandering'),
        steps: [
          '16,6 - 12,4 = 4,2, dus in 7 jaar 4,2 duizend bezoekers meer.',
          'gemiddelde per jaar = {16,6 - 12,4/2015 - 2008} = {4,2/7} = 0,6',
          'De gemiddelde verandering is 0,6 duizend bezoekers per jaar.',
        ],
      },
      watch: 'Deel door het aantal jaren, niet door het aantal stappen in de tabel.',
    },
    {
      t: 'Interpoleren',
      p: [
        'Interpoleren is een waarde schatten die tussen twee waarnemingen ligt. Inter betekent tussen.',
        'Gebruik de twee waarnemingen om het jaar heen. Bereken de gemiddelde verandering per jaar, en tel die zo vaak op als er jaren zijn verstreken.',
        'Komt de gemiddelde verandering niet precies uit, reken dan door met het getal dat niet is afgerond, zoals 1,85..., en rond pas aan het eind af.',
      ],
      ex: {
        q: T('Schat het aantal bezoekers in 2011.') + EX('Voorbeeldtabel bij interpoleren'),
        steps: [
          '2011 ligt tussen 2008 en 2015, dus interpoleren met de waarnemingen van 2008 en 2015.',
          'gemiddelde per jaar = {16,6 - 12,4/2015 - 2008} = 0,6',
          '2011 is 3 jaar na 2008, dus de schatting voor 2011 is 12,4 + 3*0,6 = 14,2 duizend.',
        ],
      },
      watch:
        'Je mag ook terugtellen vanaf het latere jaar: 16,6 − 4 · 0,6 = 14,2. Dat geeft hetzelfde.',
    },
    {
      t: 'Extrapoleren',
      p: [
        'Extrapoleren is een waarde schatten die buiten de waarnemingen ligt. Extra betekent buiten.',
        'Gebruik voor een jaar na de tabel de laatste twee waarnemingen, want die passen het best bij de nieuwste ontwikkeling. Voor een jaar vóór de tabel gebruik je de eerste twee.',
        'Wees voorzichtig met extrapoleren. Je weet niet hoe het verder gaat, en ook tussen twee waarnemingen kan het flink schommelen.',
      ],
      ex: {
        q: T('Schat het aantal bezoekers in 2024.') + EX('Voorbeeldtabel bij extrapoleren'),
        steps: [
          '2024 komt na 2020, dus extrapoleren. Gebruik de laatste twee waarnemingen: 2015 en 2020.',
          'gemiddelde per jaar = {15,1 - 16,6/2020 - 2015} = -0,3',
          '2024 is 4 jaar na 2020, dus de schatting voor 2024 is 15,1 + 4*-0,3 = 13,9 duizend.',
        ],
      },
    },
    {
      t: 'Welk jaar hoort bij een waarde?',
      p: [
        'Soms weet je de waarde en zoek je het jaar. Kijk eerst tussen welke waarnemingen de waarde ligt, of dat je moet extrapoleren.',
        'Bereken hoeveel er nog bij of af moet, en deel dat door de gemiddelde verandering per jaar. Dan weet je hoeveel jaar later het is.',
      ],
      ex: {
        q:
          T('Schat in welk jaar het aantal bezoekers 12,1 duizend is.') +
          EX('Voorbeeldtabel bij welk jaar'),
        steps: [
          '12,1 duizend is minder dan 15,1, de laatste waarneming. Dus extrapoleren met de laatste twee waarnemingen: 2015 en 2020.',
          'gemiddelde per jaar = {15,1 - 16,6/2020 - 2015} = -0,3',
          'Van 15,1 naar 12,1: 12,1 - 15,1 = -3,0.',
          '{-3,0/-0,3} = 10, dus 10 jaar na 2020.',
          '2020 + 10 = 2030, dus in 2030.',
        ],
      },
      watch:
        'Komt er geen heel aantal jaren uit, rond het jaar dan af op een heel jaar: 2020 + 2,8 = 2022,8, dus in 2023.',
    },
  ],
};
