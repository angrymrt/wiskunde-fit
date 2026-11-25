// Figuren bij getallen en breuken: een breukfiguur (een vorm in gelijke delen, waarvan er een aantal
// gekleurd zijn) en een getallenlijn met punten en pijlen. Dit staat niet in figures.js, want dat
// laadt bij het eerste bezoek van elke pagina mee. Alleen de onderwerpen over getallen en breuken
// gebruiken dit, dus het komt in de code van die onderwerpen.
import { near, rd, isNice } from './math.js';
import { esc } from './typeset.js';
import { num, and, cap, attr } from './figures.js';

const f1 = (x) => +x.toFixed(1);
const svg = (W, H, desc, o) =>
  `<svg class="fig" role="img" aria-label="${attr(desc)}" width="${Math.ceil(W)}" height="${Math.ceil(H)}" viewBox="0 0 ${Math.ceil(W)} ${Math.ceil(H)}">${o}</svg>`;

// Nummers die op elkaar volgen samen: [1, 2, 3, 5] wordt "1 tot en met 3" en "5".
function runs(ks) {
  const out = [];
  for (let i = 0; i < ks.length; i++) {
    let j = i;
    while (j + 1 < ks.length && ks[j + 1] === ks[j] + 1) j++;
    if (j - i >= 2) out.push(`${ks[i]} tot en met ${ks[j]}`);
    else for (let k = i; k <= j; k++) out.push(String(ks[k]));
    i = j;
  }
  return out;
}
// "stuk 3 is" of "de stukken 1 en 2 zijn", met de nummers vanaf 1.
const which = (ks, [one, more]) =>
  ks.length === 1 ? `${one} ${ks[0]} is` : `de ${more} ${and(runs(ks))} zijn`;

const NAMES = {
  vierkant: 'een vierkant',
  rechthoek: 'een rechthoek',
  strook: 'een strook',
  cirkel: 'een cirkel',
};

// Een breukfiguur: een vorm in gelijke delen, waarvan de delen in on gekleurd zijn. Opties:
//  - kind: 'vierkant' of 'rechthoek' in n stroken (naast elkaar, of met flat onder elkaar),
//    'strook' (een lange smalle balk in n stukken), 'cirkel' in n gelijke taartpunten, of
//    'rooster' met rows rijen en cols kolommen van gelijke hokjes.
//  - on: de gekleurde delen, als lijst van nummers vanaf 0, of als getal k voor de eerste k delen.
//    Bij een rooster telt een deel per rij: rij r, kolom c is nummer r * cols + c. Een cirkel telt
//    met de klok mee vanaf boven. De gekleurde delen hoeven niet naast elkaar te liggen.
//  - w: de breedte in pixels (bij een cirkel de middellijn, bij een rooster de breedte van een hokje).
//  - count: true noemt in de beschrijving alleen hoeveel delen gekleurd zijn, zie hieronder.
//  - desc: een eigen beschrijving voor een schermlezer.
//
// De beschrijving voor een schermlezer. De figuur laat zien in hoeveel gelijke delen de vorm is
// verdeeld en welke delen gekleurd zijn. Dat moet een blinde leerling ook weten, anders kan die
// de vraag niet maken. Maar bij "welk deel is gekleurd?" is "8 stukken, waarvan 3 gekleurd" al
// bijna het antwoord: het tellen is dan voorgekauwd (vergelijk #168). Daarom noemt de beschrijving
// standaard welke delen gekleurd zijn, met hun plek ("met de klok mee vanaf boven zijn de stukken
// 1, 2 en 5 gekleurd"), en niet hoeveel. Zo krijgt de leerling dezelfde gegevens als wie de figuur
// ziet, en telt hij zelf, net als een ziende leerling. Bij een rooster noemt de beschrijving het
// aantal rijen en het aantal hokjes per rij, maar niet het totaal: dat reken je zelf uit. De breuk
// zelf staat er nooit in. Is de figuur geen vraag maar een voorbeeld, gebruik dan count: true voor
// een kortere beschrijving.
function breukFig({
  kind = 'cirkel',
  n,
  rows,
  cols,
  on = [],
  flat = false,
  w,
  count = false,
  desc,
}) {
  const grid = kind === 'rooster';
  if (grid) n = rows * cols;
  if (!Number.isInteger(n) || n < 1) throw new Error(`breukFig: geen goed aantal delen (${n})`);
  const set = typeof on === 'number' ? [...Array(on).keys()] : [...on];
  if (set.some((k) => !Number.isInteger(k) || k < 0 || k >= n) || new Set(set).size !== set.length)
    throw new Error(`breukFig: gekleurde delen ${set} passen niet bij ${n} delen`);
  const lit = new Set(set),
    part = (k) => (lit.has(k) ? 'bd aan' : 'bd'),
    p = 3; // ruimte voor de rand
  let o = '',
    W,
    H;
  if (kind === 'cirkel') {
    const r = (w || 150) / 2,
      c = r + p,
      P = (a) => `${f1(c + r * Math.sin(a))} ${f1(c - r * Math.cos(a))}`;
    W = H = 2 * c;
    for (let k = 0; k < n; k++) {
      const a0 = (2 * Math.PI * k) / n,
        a1 = (2 * Math.PI * (k + 1)) / n;
      o +=
        n === 1
          ? `<circle class="${part(k)}" cx="${c}" cy="${c}" r="${r}"/>`
          : `<path class="${part(k)}" d="M${c} ${c}L${P(a0)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${P(a1)}Z"/>`;
    }
    o += `<circle class="s" cx="${c}" cy="${c}" r="${r}"/>`;
  } else {
    // Een rechthoek van bw bij bh pixels, in nx kolommen en ny rijen.
    let bw, bh, nx, ny;
    if (grid) {
      const s = w || Math.min(32, Math.floor(224 / cols));
      [bw, bh, nx, ny] = [s * cols, s * rows, cols, rows];
    } else {
      const size = {
        vierkant: [w || 150, w || 150],
        rechthoek: [w || 195, (w || 195) * (2 / 3)],
        strook: [w || 224, 40],
      }[kind];
      if (!size) throw new Error(`breukFig: onbekende vorm ${kind}`);
      [bw, bh] = size;
      [nx, ny] = flat && kind !== 'strook' ? [1, n] : [n, 1];
    }
    W = bw + 2 * p;
    H = bh + 2 * p;
    for (let k = 0; k < n; k++) {
      const i = k % nx,
        j = Math.floor(k / nx);
      o += `<rect class="${part(k)}" x="${f1(p + (i * bw) / nx)}" y="${f1(p + (j * bh) / ny)}" width="${f1(bw / nx)}" height="${f1(bh / ny)}"/>`;
    }
    o += `<rect class="s" x="${p}" y="${p}" width="${f1(bw)}" height="${f1(bh)}"/>`;
  }
  return svg(W, H, desc || breukDesc({ kind, n, rows, cols, flat, lit, count }), o);
}
function breukDesc({ kind, n, rows, cols, flat, lit, count }) {
  const ks = [...lit].sort((a, b) => a - b).map((k) => k + 1);
  if (kind === 'rooster') {
    const shape =
      rows === cols
        ? `Een vierkant rooster van ${rows} rijen met elk ${cols} gelijke hokjes.`
        : `Een rooster van ${rows} ${rows === 1 ? 'rij' : 'rijen'} met elk ${cols} gelijke hokjes.`;
    if (!ks.length) return `${shape} Geen enkel hokje is gekleurd.`;
    if (ks.length === n) return `${shape} Alle hokjes zijn gekleurd.`;
    if (count)
      return `${shape} ${ks.length === 1 ? '1 hokje is' : `${ks.length} hokjes zijn`} gekleurd.`;
    // Per rij: een volle rij in één keer, anders de hokjes in die rij.
    const full = [],
      parts = [];
    for (let r = 0; r < rows; r++) {
      const inRow = ks.filter((k) => Math.ceil(k / cols) === r + 1).map((k) => k - r * cols);
      if (inRow.length === cols) full.push(r + 1);
      else if (inRow.length)
        parts.push(
          `in rij ${r + 1} ${which(inRow, ['hokje', 'hokjes']).replace(/ (is|zijn)$/, '')}`,
        );
    }
    const items = [
      ...(full.length
        ? [`${full.length === 1 ? `rij ${full[0]}` : `de rijen ${and(runs(full))}`} helemaal`]
        : []),
      ...parts,
    ];
    return `${shape} De rijen tellen van boven naar beneden en de hokjes in een rij van links naar rechts. Gekleurd: ${items.join('; ')}.`;
  }
  const stroken = kind === 'vierkant' || kind === 'rechthoek',
    word = stroken ? ['strook', 'stroken'] : ['stuk', 'stukken'],
    side = stroken ? (flat ? ' onder elkaar' : ' naast elkaar') : '',
    shape =
      n === 1
        ? `${cap(NAMES[kind])}, niet verdeeld.`
        : `${cap(NAMES[kind])} in ${n} gelijke ${word[1]}${side}${kind === 'cirkel' ? ', zoals een taart' : ''}.`;
  if (!ks.length)
    return `${shape} ${n === 1 ? 'Hij is niet' : stroken ? 'Geen enkele strook is' : 'Geen enkel stuk is'} gekleurd.`;
  if (ks.length === n) return `${shape} ${n === 1 ? 'Hij is' : `Alle ${word[1]} zijn`} gekleurd.`;
  if (count)
    return `${shape} ${ks.length === 1 ? `1 ${word[0]} is` : `${ks.length} ${word[1]} zijn`} gekleurd.`;
  const from =
    kind === 'cirkel'
      ? 'Met de klok mee vanaf boven'
      : flat && stroken
        ? 'Van boven naar beneden'
        : 'Van links naar rechts';
  return `${shape} ${from}: ${which(ks, word)} gekleurd.`;
}

// Een getal zoals je het zegt: een kommagetal als dat kort is, anders een breuk als 2 1/3.
function said(x) {
  if (isNice(x, 3)) return num(x);
  for (let den = 2; den <= 12; den++)
    if (near(x * den, Math.round(x * den), 1e-9)) {
      const a = Math.abs(Math.round(x * den)),
        w = Math.floor(a / den);
      return `${x < 0 ? '−' : ''}${w ? `${w} ` : ''}${a % den}/${den}`;
    }
  return `ongeveer ${num(rd(x, 2))}`;
}
const ORD = ['eerste', 'tweede', 'derde', 'vierde', 'vijfde', 'zesde'];

// Een getallenlijn: een horizontale lijn met een streepje bij elke stap, en getallen eronder. Opties:
//  - xr: [van, tot], het stuk van de lijn dat je ziet. step: de afstand tussen twee streepjes
//    (standaard 1). tot - van moet een veelvoud van step zijn.
//  - lx: om de hoeveel er een getal onder een streepje staat, ook een veelvoud van step. Standaard
//    zo klein als past, zodat de getallen elkaar niet raken.
//  - u: de afstand tussen twee streepjes in pixels. Standaard past de lijn op een smal scherm.
//  - pts: [{ x, label: 'A', t }], punten met een hoofdletter erboven, ook tussen twee streepjes,
//    zoals x: -2.5. t is hoe de beschrijving het getal noemt, zoals '−2 1/2'; standaard een
//    kommagetal als dat kort is, en anders een breuk.
//  - arrows: [{ from, to, t }], pijlen boven de lijn, voor optellen en aftrekken: de pijl begint bij
//    from en wijst naar to. t staat boven de pijl, zoals '+4' of '−6'. De eerste pijl staat het
//    laagst; de volgende komen erboven, zoals de stappen van een som.
//  - coords: met false noemt de beschrijving niet bij welk getal een punt staat of waar een pijl
//    begint en eindigt, maar alleen de volgorde van de punten en de richting van de pijlen. Gebruik
//    dat als die getallen het antwoord zijn, net als bij graph (#168).
//  - desc: een eigen beschrijving voor een schermlezer.
function getallenlijn({
  xr = [-5, 5],
  step = 1,
  lx,
  u,
  pts = [],
  arrows = [],
  coords = true,
  desc,
}) {
  const [lo, hi] = xr,
    ns = Math.round((hi - lo) / step);
  if (!(ns > 0) || !near(lo + ns * step, hi, 1e-9))
    throw new Error(`getallenlijn: ${lo} tot ${hi} is geen veelvoud van ${step}`);
  for (const v of [...pts.map((q) => q.x), ...arrows.flatMap((a) => [a.from, a.to])])
    if (v < lo - 1e-9 || v > hi + 1e-9) throw new Error(`getallenlijn: ${v} ligt buiten ${xr}`);
  // Standaard is de lijn met de randen ongeveer 240 pixels breed: op een telefoon van 320 pixels
  // breed is er naast de randen van de pagina ongeveer 230 pixels ruimte voor een figuur.
  u = u || Math.max(10, Math.min(44, Math.floor(200 / ns)));
  const ticks = [...Array(ns + 1).keys()].map((k) => rd(lo + k * step, 9)),
    wide = (v) => 7 * num(v).length + 4;
  // Een getal staat onder een streepje als het een veelvoud is van lx. Zonder lx kiezen we de
  // kleinste stap waarbij de getallen elkaar niet raken, het liefst een mooie, zoals 1, 2 of 5 maal
  // een macht van 10: bij streepjes om de 0,25 dus 0, 0,5 en 1, en niet 0 en 1,25.
  if (!lx) {
    const at = (l) => ticks.filter((v) => near(v / l, Math.round(v / l), 1e-9)),
      room = (l) => Math.max(...at(l).map(wide)),
      nice = (l) => {
        const m = l / 10 ** Math.floor(Math.log10(l) + 1e-9);
        return [1, 2, 2.5, 5].some((k) => near(m, k, 1e-6));
      },
      fit = [1, 2, 3, 4, 5, 6, 10, 12, 20, 25, 50, 100, 200, 500]
        .map((k) => k * step)
        .filter((l) => at(l).length && (u * l) / step >= room(l));
    lx = fit.find(nice) ?? fit[0] ?? hi - lo;
  }
  const k0 = Math.round(lx / step);
  if (!near(k0 * step, lx, 1e-9))
    throw new Error(`getallenlijn: ${lx} is geen veelvoud van ${step}`);
  const labeled = ticks.filter((v) => near(v / lx, Math.round(v / lx), 1e-9)),
    ml = Math.max(16, wide(lo) / 2 + 4),
    mr = Math.max(24, wide(hi) / 2 + 4),
    up = pts.some((q) => q.label) ? 24 : 6,
    na = arrows.length,
    mt = 10 + na * 28 + up,
    X = (x) => ml + ((x - lo) / step) * u,
    Y = mt,
    W = ml + ns * u + mr,
    H = Y + 31;
  let o = `<path class="ax" d="M${f1(X(lo) - 10)} ${Y}H${f1(X(hi) + 16)}m-6 -4l6 4l-6 4"/>`;
  for (const v of ticks) {
    const big = labeled.includes(v) ? 7 : 5;
    o += `<path class="ax" d="M${f1(X(v))} ${Y - big}v${2 * big}"/>`;
  }
  for (const v of labeled)
    o += `<text class="tn" text-anchor="middle" x="${f1(X(v))}" y="${Y + 23}">${num(v)}</text>`;
  // De pijlen: een hulplijn naar beneden bij het begin en het eind, een streepje waar de pijl
  // begint en een punt waar hij naartoe wijst.
  arrows.forEach(({ from, to, t }, i) => {
    const y = Y - up - 14 - 28 * i,
      a = X(from),
      b = X(to),
      dir = to > from ? 1 : -1,
      // Staat er een letter bij dat getal, dan stopt de hulplijn erboven.
      end = (v) => (pts.some((q) => q.label && near(q.x, v, 1e-9)) ? Y - 28 : Y);
    o += `<path class="hl" d="M${f1(a)} ${y}V${end(from)}M${f1(b)} ${y}V${end(to)}"/>`;
    o += `<path class="l2" d="M${f1(a)} ${y - 5}v10M${f1(a)} ${y}H${f1(b)}m${-7 * dir} -5l${7 * dir} 5l${-7 * dir} 5"/>`;
    if (t)
      o += `<text class="t2" text-anchor="middle" x="${f1((a + b) / 2)}" y="${y - 7}">${esc(String(t).replace('-', '−'))}</text>`;
  });
  pts.forEach((q) => {
    o += `<circle class="dot" cx="${f1(X(q.x))}" cy="${Y}" r="4"/>`;
    if (q.label)
      o += `<text class="ti" text-anchor="middle" x="${f1(X(q.x))}" y="${Y - 11}">${esc(q.label)}</text>`;
  });
  return svg(W, H, desc || lijnDesc({ lo, hi, step, lx, labeled, ticks, pts, arrows, coords }), o);
}
function lijnDesc({ lo, hi, step, lx, labeled, ticks, pts, arrows, coords }) {
  const every = (s) => (s === 1 ? 'elk geheel getal' : `elke ${said(s)}`),
    out = [`Een getallenlijn van ${num(lo)} tot ${num(hi)}, met een streepje bij ${every(step)}.`];
  out.push(
    labeled.length === ticks.length
      ? 'Onder elk streepje staat het getal.'
      : `Getallen staan alleen onder ${and(labeled.map(num))}.`,
  );
  const named = pts.filter((q) => q.label);
  if (named.length) {
    if (coords)
      out.push(
        cap(
          `${and(named.map((q) => `punt ${q.label} staat bij ${q.t ? String(q.t).replace('-', '−') : said(q.x)}`))}.`,
        ),
      );
    else {
      const order = [...named].sort((p, q) => p.x - q.x).map((q) => q.label);
      out.push(
        order.length === 1
          ? `Op de lijn staat punt ${order[0]}.`
          : `Op de lijn staan van links naar rechts de punten ${and(order)}.`,
      );
    }
  }
  const loose = pts.length - named.length;
  if (loose)
    out.push(
      coords
        ? `${loose === 1 ? 'Een stip staat' : 'Stippen staan'} bij ${and(pts.filter((q) => !q.label).map((q) => said(q.x)))}.`
        : `Op de lijn ${loose === 1 ? 'staat een stip' : `staan ${loose} stippen`}.`,
    );
  arrows.forEach(({ from, to, t }, i) => {
    const who =
        arrows.length === 1 ? 'Boven de lijn staat een pijl' : `De ${ORD[i] || `${i + 1}e`} pijl`,
      dir = to > from ? 'naar rechts' : 'naar links',
      lab = t ? `, met ${String(t).replace('-', '−')} erboven` : '';
    if (i === 0 && arrows.length > 1)
      out.push(
        `Boven de lijn staan ${arrows.length} pijlen boven elkaar; de eerste staat het laagst.`,
      );
    out.push(
      coords
        ? `${who} ${arrows.length === 1 ? 'van' : 'gaat van'} ${said(from)} naar ${said(to)}, ${dir}${lab}.`
        : arrows.length === 1
          ? `${who} die ${dir} wijst${lab}.`
          : `${who} wijst ${dir}${lab}.`,
    );
  });
  return out.join(' ');
}

export { breukFig, getallenlijn };
