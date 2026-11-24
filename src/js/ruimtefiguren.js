// Figuren van ruimtefiguren: een uitslag van een kubus of balk (net) en een ruimtefiguur in schuine
// projectie (solid, solidFacts). Dit staat niet in figures.js, want dat laadt bij het eerste bezoek
// van elke pagina mee. Alleen de onderwerpen voor ruimtefiguren gebruiken dit, dus zo blijft de code
// bij het eerste bezoek klein (zie de grens in tests/browser.e2e.js).
import { near } from './math.js';
import { esc } from './typeset.js';
import { boxFaces } from './ruimte.js';
import { num, and, cap, attr } from './figures.js';

// met x naar rechts en y naar beneden. Opties:
//  - dims: [l, b, h], de maten van een balk in hokjes van het rooster. Elk vlak wordt dan een
//    rechthoek met de goede maten (boxFaces), en de vorm moet een uitslag zijn. Zijn de drie maten
//    gelijk, dan is het een kubus met die ribbe, en mag de vorm ook bijna een uitslag van een kubus zijn. Zonder
//    dims is elk vlak één hokje.
//  - u: pixels per hokje. Maak een uitslag als keuze bij meerkeuze klein, met u: 16 en grid: false.
//  - grid: het rooster, met een rand van één hokje rond de uitslag.
//  - marks: { i: 'A' }, een letter of getal op vlak i, de plek in cells.
//  - shade: [i, ...], de vlakken die gekleurd zijn.
//  - label: het begin van de beschrijving, zoals 'Keuze'. Zonder label is het 'Uitslag van een kubus'
//    of 'Uitslag van een balk' (zie BEGRIPPEN.md: het losse woord uitslag is de uitslag van een proeftoets).
// De beschrijving noemt per rij, van boven naar beneden, in welke kolommen een vlak ligt. Zo geven
// twee verschillende vormen, of twee standen van dezelfde vorm, nooit dezelfde beschrijving.
function net({ cells, dims, u = 30, grid = true, marks = {}, shade = [], label }) {
  const x0 = Math.min(...cells.map((c) => c[0])),
    y0 = Math.min(...cells.map((c) => c[1])),
    at = cells.map(([x, y]) => [x - x0, y - y0]),
    cube = !dims || (dims[0] === dims[1] && dims[1] === dims[2]),
    k = dims ? dims[0] : 1,
    faces = cube ? at.map(([x, y]) => ({ x: x * k, y: y * k, w: k, h: k })) : boxFaces(at, dims);
  if (label === undefined) label = cube ? 'Uitslag van een kubus' : 'Uitslag van een balk';
  if (!faces) throw new Error(`net: met de maten ${dims} is dit geen uitslag van een balk`);
  const m = grid ? 1 : 0,
    pad = 3,
    bw = Math.max(...faces.map((f) => f.x + f.w)) + 2 * m,
    bh = Math.max(...faces.map((f) => f.y + f.h)) + 2 * m,
    W = bw * u + 2 * pad,
    Ht = bh * u + 2 * pad,
    X = (x) => pad + (x + m) * u,
    Y = (y) => pad + (y + m) * u;
  let o = '';
  if (grid) {
    let g = '';
    for (let i = 0; i <= bw; i++) g += `M${pad + i * u} ${pad}V${pad + bh * u}`;
    for (let j = 0; j <= bh; j++) g += `M${pad} ${pad + j * u}H${pad + bw * u}`;
    o += `<path class="gl" d="${g}"/>`;
  }
  const box = (f, cls) =>
    `<rect class="${cls}" x="${X(f.x)}" y="${Y(f.y)}" width="${f.w * u}" height="${f.h * u}"/>`;
  shade.forEach((i) => (o += box(faces[i], 'sf')));
  faces.forEach((f) => (o += box(f, 's')));
  Object.entries(marks).forEach(([i, t]) => {
    const f = faces[i];
    o += `<text class="tc" text-anchor="middle" x="${X(f.x + f.w / 2)}" y="${Y(f.y + f.h / 2) + 4.5}">${esc(String(t))}</text>`;
  });
  // De beschrijving: rijen en kolommen van vlakken, niet van hokjes.
  const rows = [...new Set(at.map((c) => c[1]))].sort((p, q) => p - q),
    where = (i) => `rij ${rows.indexOf(at[i][1]) + 1}, kolom ${at[i][0] + 1}`,
    size = (i) => `${num(faces[i].w)} bij ${num(faces[i].h)}`,
    sizes = grid && !cube,
    n = cells.length,
    out = [
      `${label}. ${n} ${n === 1 ? 'vlak' : 'vlakken'}, in ${rows.length} ${rows.length === 1 ? 'rij' : 'rijen'}.`,
    ];
  if (sizes)
    out.push(
      'Rijen en kolommen tellen vlakken. Bij elk vlak staat eerst hoeveel hokjes het breed is, dan hoeveel hokjes hoog.',
    );
  else if (grid && k !== 1)
    out.push(`Elk vlak is een vierkant van ${num(k)} bij ${num(k)} hokjes.`);
  rows.forEach((y, r) => {
    const idx = at
        .map((_, i) => i)
        .filter((i) => at[i][1] === y)
        .sort((p, q) => at[p][0] - at[q][0]),
      xs = idx.map((i) => at[i][0] + 1),
      runs = [];
    xs.forEach((x, j) => {
      if (j && x === xs[j - 1] + 1) runs[runs.length - 1][1] = x;
      else runs.push([x, x]);
    });
    const cols = and(runs.map(([a, b]) => (a === b ? `${a}` : `${a} tot en met ${b}`)));
    out.push(
      `Rij ${r + 1}: ${idx.length} ${idx.length === 1 ? 'vlak' : 'vlakken'}, in kolom ${cols}` +
        (sizes ? `, van ${and(idx.map(size))}.` : '.'),
    );
  });
  Object.entries(marks).forEach(([i, t]) => out.push(`Op het vlak in ${where(i)} staat ${t}.`));
  shade.forEach((i) => out.push(`Het vlak in ${where(i)} is gekleurd.`));
  return `<svg class="fig" role="img" aria-label="${attr(out.join(' '))}" width="${W}" height="${Ht}" viewBox="0 0 ${W} ${Ht}">${o}</svg>`;
}

// Een ruimtefiguur in schuine projectie, zoals in een schoolboek: kubus, balk, prisma of piramide.
// De voorkant staat op ware grootte. Ribben naar achteren zijn korter: één eenheid naar achteren is
// een half hokje naar rechts en een half hokje omhoog, dus schuin over de hokjes. Een ribbe is
// gestippeld als geen van de twee zijvlakken ernaast naar je toe gekeerd is. Opties:
//   kind     'kubus', 'balk', 'prisma' of 'piramide'.
//   l, b, h  Kubus: ribbe l. Balk: lengte l (naar rechts), breedte b (naar achteren) en hoogte h.
//            Prisma en piramide: hoogte h. Een liggend prisma is h lang, naar achteren.
//   n, r     Prisma en piramide: een regelmatig n-hoekig grondvlak (3 tot en met 8) met straal r,
//            met een ribbe vooraan (bij een liggend prisma onderaan).
//   base     Of een eigen convex grondvlak: [[x, y], ...], bij een liggend prisma [[x, z], ...].
//            Het eerste punt krijgt de letter A.
//   top      Piramide: het punt [x, y] waar de top boven staat. Standaard het midden.
//   lying    Het prisma ligt: het grondvlak staat vooraan, op ware grootte.
//   letters  false voor geen letters, of een eigen reeks. Standaard ABCD EFGH, ABCDE FGHIJ (grondvlak
//            en bovenvlak) en bij een piramide TABCDE, eerst de top.
//   hide     Letters die als ? getekend worden, zodat de leerling ze invult: 'G'.
//   cw       De letters met de klok mee in plaats van tegen de klok in.
//   fill     Een gekleurd zijvlak, met letters: 'EFGH'.
//   len      Lengtes bij ribben: { AB: 4, AE: 'x' }. Een getal krijgt cm erachter.
//   grid     Een rooster op de achtergrond.
//   u        Pixels per eenheid.
//   label    Een eigen naam in plaats van de soort, als de soort het antwoord is: 'Ruimtefiguur'.
//   counts   Met false noemt de beschrijving het aantal zijvlakken niet, als dat het antwoord is.
// fill, len en hide gebruiken de letters, ook als ze niet getekend worden.
const ZIJDIG = { 3: 'drie', 4: 'vier', 5: 'vijf', 6: 'zes', 7: 'zeven', 8: 'acht' };
// De richting naar de kijker: naar voren, naar rechts en omhoog. Een punt verschuift in de tekening
// niet als je het in die richting beweegt.
const VIEW = [0.5, -1, 0.5];
const sub3 = (p, q) => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const dot3 = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const cross3 = (p, q) => [
  p[1] * q[2] - p[2] * q[1],
  p[2] * q[0] - p[0] * q[2],
  p[0] * q[1] - p[1] * q[0],
];
const flat = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);

function solidModel({
  kind = 'kubus',
  l,
  b,
  h,
  n = 4,
  r = 2,
  base,
  top,
  lying = false,
  letters = true,
  cw = false,
}) {
  if (!['kubus', 'balk', 'prisma', 'piramide'].includes(kind))
    throw new Error(`Onbekende ruimtefiguur: ${kind}`);
  if (kind === 'piramide' && lying) throw new Error('Een piramide kan niet liggen.');
  const box = kind === 'kubus' || kind === 'balk';
  if (kind === 'kubus') b = h = l = l ?? 3;
  if (kind === 'balk') [l, b, h] = [l ?? 4, b ?? 2, h ?? 3];
  if (box) lying = false;
  h = h ?? 3;
  let poly = box
    ? [
        [0, 0],
        [l, 0],
        [l, b],
        [0, b],
      ]
    : base
      ? base.map((p) => [...p])
      : Array.from({ length: n }, (_, i) => {
          const a = -Math.PI / 2 - Math.PI / n + (2 * Math.PI * i) / n;
          return [r * Math.cos(a), r * Math.sin(a)].map((c) => (near(c, 0, 1e-12) ? 0 : c));
        });
  n = poly.length;
  if (n < 3 || n > 8) throw new Error(`Een grondvlak heeft 3 tot en met 8 hoeken, niet ${n}.`);
  // Tegen de klok in, en bij cw met de klok mee. A blijft het eerste punt.
  const turn = () => (poly = [poly[0], ...poly.slice(1).reverse()]);
  const area = poly.reduce((t, p, i) => t + flat([0, 0], p, poly[(i + 1) % n]), 0);
  if (area < 0) turn();
  // Elke bocht gaat linksaf, en de bochten samen zijn precies één rondje (2π). Een sterveelhoek
  // draait ook steeds linksaf, maar dan is het totaal een groter veelvoud van 2π.
  let turned = 0;
  poly.forEach((p, i) => {
    const q = poly[(i + 1) % n],
      r = poly[(i + 2) % n];
    if (flat(p, q, r) <= 1e-9)
      throw new Error('Het grondvlak moet convex zijn, zonder drie punten op een lijn.');
    turned += Math.atan2(
      flat(p, q, r),
      (q[0] - p[0]) * (r[0] - q[0]) + (q[1] - p[1]) * (r[1] - q[1]),
    );
  });
  if (!near(turned, 2 * Math.PI, 1e-6))
    throw new Error('Het grondvlak moet convex zijn, geen ster.');
  if (cw) turn();
  const pyr = kind === 'piramide',
    abc = 'ABCDEFGHIJKLMNOP',
    count = pyr ? n + 1 : 2 * n,
    names = [...(typeof letters === 'string' ? letters : pyr ? 'T' + abc : abc)].slice(0, count);
  if (names.length !== count || new Set(names).size !== count)
    throw new Error(`Verkeerde letters voor deze ruimtefiguur: ${letters}`);
  const lay = ([x, y], z) => (lying ? [x, z, y] : [x, y, z]);
  const mid = poly.reduce((t, p) => [t[0] + p[0] / n, t[1] + p[1] / n], [0, 0]);
  const P3 = pyr
    ? [[...(top ?? mid), h], ...poly.map((p) => [...p, 0])]
    : [...poly.map((p) => lay(p, 0)), ...poly.map((p) => lay(p, h))];
  const ring = (k) => Array.from({ length: n }, (_, i) => k + i),
    baseIdx = ring(pyr ? 1 : 0),
    topIdx = pyr ? [0] : ring(n),
    sides = Array.from({ length: n }, (_, i) =>
      pyr ? [0, 1 + i, 1 + ((i + 1) % n)] : [i, (i + 1) % n, n + ((i + 1) % n), n + i],
    );
  const cen = P3.reduce((t, p) => t.map((c, j) => c + p[j] / P3.length), [0, 0, 0]);
  const faces = [baseIdx, ...(pyr ? [] : [topIdx]), ...sides].map((idx) => {
    const [p, q, s] = idx.map((k) => P3[k]);
    let nrm = cross3(sub3(q, p), sub3(s, p));
    if (dot3(nrm, sub3(p, cen)) < 0) nrm = nrm.map((c) => -c);
    // Een zijvlak precies van opzij telt als zichtbaar: zijn ribben vallen op de omtrek.
    return { idx, vis: dot3(nrm, VIEW) / Math.hypot(...nrm) > -1e-9 };
  });
  const edges = new Map();
  for (const f of faces)
    f.idx.forEach((a, k) => {
      const e = [a, f.idx[(k + 1) % f.idx.length]].sort((x, y) => x - y),
        key = e.join('-');
      if (!edges.has(key)) edges.set(key, { i: e[0], j: e[1], faces: [] });
      edges.get(key).faces.push(f);
    });
  const E = [...edges.values()]
    .sort((x, y) => x.i - y.i || x.j - y.j)
    .map((e) => ({ ...e, hidden: !e.faces.some((f) => f.vis) }));
  return { kind, n, lying, box, pyr, names, P3, poly, mid, faces, edges: E, baseIdx, topIdx };
}

// De feiten van een ruimtefiguur, zonder te tekenen, met dezelfde opties als solid(). Een generator
// rekent hiermee het antwoord uit: de hoekpunten, ribben en zijvlakken met hun letters.
function solidFacts(opts = {}) {
  const m = solidModel(opts),
    word = (idx) => idx.map((k) => m.names[k]).join('');
  return {
    kind: m.kind,
    n: m.n,
    vertices: [...m.names],
    edges: m.edges.map((e) => word([e.i, e.j])),
    faces: m.faces.map((f) => word(f.idx)),
    base: word(m.baseIdx),
    top: word(m.topIdx),
    hidden: m.edges.filter((e) => e.hidden).map((e) => word([e.i, e.j])),
    pts: Object.fromEntries(m.names.map((k, i) => [k, [...m.P3[i]]])),
  };
}

function solidDesc(m, { show, shown, hidden, lens, fillIdx, label, counts, cw }) {
  const { n, P3, lying, pyr, baseIdx, topIdx } = m,
    word = (idx) => idx.map(shown).join(''),
    out = [];
  const sort = m.box
    ? m.kind
    : pyr
      ? `${ZIJDIG[n]}zijdige piramide`
      : `${lying ? 'liggend ' : ''}${ZIJDIG[n]}zijdig prisma`;
  const name = cap(label || sort);
  if (!show) out.push(`${name} zonder letters bij de hoekpunten.`);
  else if (pyr) out.push(`${name} met grondvlak ${word(baseIdx)} en top ${word(topIdx)}.`);
  else if (lying)
    out.push(
      `${name} met grondvlak ${word(baseIdx)} vooraan en bovenvlak ${word(topIdx)} achteraan.`,
    );
  else out.push(`${name} met grondvlak ${word(baseIdx)} en bovenvlak ${word(topIdx)}.`);
  if (show) {
    // Waar de letters van het grondvlak staan. Bij vier hoeken elk in een eigen hoek, zoals
    // linksvoor; anders de richting en wat vooraan ligt.
    const pos = m.poly.map((p) => [p[0] - m.mid[0], p[1] - m.mid[1]]),
      [fw, bw] = lying ? ['onder', 'boven'] : ['voor', 'achter'],
      words = pos.map(([x, y]) =>
        Math.abs(x) > 1e-9 && Math.abs(y) > 1e-9
          ? `${x < 0 ? 'links' : 'rechts'}${y < 0 ? fw : bw}`
          : '',
      );
    if (n === 4 && words.every(Boolean) && new Set(words).size === 4)
      out.push(cap(`${and(baseIdx.map((k, i) => `${shown(k)}${i ? '' : ' ligt'} ${words[i]}`))}.`));
    else {
      const low = Math.min(...pos.map((p) => p[1])),
        front = baseIdx.filter((k, i) => near(pos[i][1], low, 1e-9)),
        what = front.length > 1 ? `Ribbe ${word(front)}` : shown(front[0]);
      out.push(
        `De letters van het grondvlak gaan ${cw ? 'met de klok mee' : 'tegen de klok in'} als je ${lying ? 'van voren' : 'van bovenaf'} kijkt. ${what} ligt ${fw}aan.`,
      );
    }
    if (pyr) {
      const t = P3[0],
        at = baseIdx.find((k) => near(P3[k][0], t[0], 1e-9) && near(P3[k][1], t[1], 1e-9));
      out.push(
        near(t[0], m.mid[0], 1e-9) && near(t[1], m.mid[1], 1e-9)
          ? `De top ${shown(0)} staat boven het midden van het grondvlak.`
          : at != null
            ? `De top ${shown(0)} staat recht boven ${shown(at)}.`
            : `De top ${shown(0)} staat niet boven het midden van het grondvlak.`,
      );
    } else
      out.push(
        cap(
          `${and(topIdx.map((k, i) => `${shown(k)}${i ? '' : lying ? ' ligt' : ' staat'} ${lying ? 'achter' : 'boven'} ${shown(baseIdx[i])}`))}.`,
        ),
      );
  }
  if (counts) out.push(`De figuur heeft ${m.faces.length} zijvlakken.`);
  if (hidden.length)
    out.push(
      show
        ? `Gestippeld: ${and(hidden.map((e) => word([e.i, e.j])))}.`
        : `${hidden.length} ${hidden.length === 1 ? 'ribbe is' : 'ribben zijn'} gestippeld.`,
    );
  // Zonder letters zegt de soort ribbe waar een lengte staat.
  const role = ({ i, j }) => {
    if (m.kind === 'kubus') return 'een ribbe';
    if (m.kind === 'balk') {
      const dd = sub3(P3[j], P3[i]).map(Math.abs);
      return ['de lengte', 'de breedte', 'de hoogte'][dd.indexOf(Math.max(...dd))];
    }
    const inB = [i, j].every((k) => baseIdx.includes(k)),
      inT = [i, j].every((k) => topIdx.includes(k));
    return inB
      ? 'een ribbe van het grondvlak'
      : inT
        ? 'een ribbe van het bovenvlak'
        : lying
          ? 'een ribbe naar achteren'
          : 'een opstaande ribbe';
  };
  if (lens.length)
    out.push(
      show
        ? `${lens.length > 1 ? 'Lengtes' : 'Lengte'}: ${and(lens.map(({ e, t }) => `${word([e.i, e.j])} = ${t}`))}.`
        : cap(`${and(lens.map(({ e, t }) => `${role(e)} is ${t}`))}.`),
    );
  if (fillIdx) {
    const same = (a, c) => a.length === c.length && a.every((k) => c.includes(k));
    out.push(
      show
        ? `Zijvlak ${word(fillIdx)} is gekleurd.`
        : same(fillIdx, baseIdx)
          ? 'Het grondvlak is gekleurd.'
          : same(fillIdx, topIdx)
            ? 'Het bovenvlak is gekleurd.'
            : 'Eén zijvlak is gekleurd.',
    );
  }
  return out.join(' ');
}

function solid(opts = {}) {
  const {
    hide = '',
    fill = '',
    len = {},
    grid = false,
    u = 30,
    label = '',
    counts = true,
    cw = false,
  } = opts;
  const m = solidModel(opts),
    show = opts.letters !== false,
    shown = (k) => (hide.includes(m.names[k]) ? '?' : m.names[k]);
  const edgeOf = (s) => {
    const [a, c] = [...s].map((k) => m.names.indexOf(k)),
      e = m.edges.find((x) => (x.i === a && x.j === c) || (x.i === c && x.j === a));
    if (s.length !== 2 || !e) throw new Error(`${s} is geen ribbe van deze ruimtefiguur.`);
    return e;
  };
  const lens = Object.keys(len).map((s) => ({
    e: edgeOf(s),
    t: typeof len[s] === 'number' ? `${num(len[s])} cm` : String(len[s]).replace('-', '−'),
  }));
  let fillIdx = null;
  if (fill) {
    const want = [...fill].map((k) => m.names.indexOf(k)),
      f = m.faces.find((x) => x.idx.length === want.length && want.every((k) => x.idx.includes(k)));
    if (!f) throw new Error(`${fill} is geen zijvlak van deze ruimtefiguur.`);
    fillIdx = f.idx;
  }
  // Schuine projectie in eenheden, daarna in pixels met de y-as omlaag. Eerst zonder rand: de
  // rand volgt uit waar de letters en lengtes staan.
  const Q = m.P3.map(([x, y, z]) => [x + y / 2, z + y / 2]),
    x0 = Math.min(...Q.map((q) => q[0])),
    x1 = Math.max(...Q.map((q) => q[0])),
    y0 = Math.min(...Q.map((q) => q[1])),
    y1 = Math.max(...Q.map((q) => q[1])),
    P0 = Q.map(([x, y]) => [(x - x0) * u, (y1 - y) * u]),
    texts = [];
  // Een letter staat in de grootste opening tussen de ribben bij het hoekpunt.
  if (show)
    m.names.forEach((_, k) => {
      const dirs = m.edges
        .filter((e) => e.i === k || e.j === k)
        .map((e) => {
          const q = P0[e.i === k ? e.j : e.i];
          return Math.atan2(q[1] - P0[k][1], q[0] - P0[k][0]);
        })
        .sort((a, c) => a - c);
      let best = -1,
        at = 0;
      dirs.forEach((a, i) => {
        const gap = (i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + 2 * Math.PI) - a;
        if (gap > best + 1e-9) [best, at] = [gap, a + gap / 2];
      });
      texts.push({
        cls: 'ti',
        s: shown(k),
        x: P0[k][0] + 14 * Math.cos(at),
        y: P0[k][1] + 14 * Math.sin(at) + 5,
      });
    });
  // Een lengte staat naast het midden van de ribbe, aan de buitenkant.
  const cx = P0.reduce((t, p) => t + p[0] / P0.length, 0),
    cy = P0.reduce((t, p) => t + p[1] / P0.length, 0);
  for (const { e, t } of lens) {
    const [A, B] = [P0[e.i], P0[e.j]],
      mx = (A[0] + B[0]) / 2,
      my = (A[1] + B[1]) / 2;
    let nx = -(B[1] - A[1]),
      ny = B[0] - A[0];
    const nn = Math.hypot(nx, ny) || 1;
    nx /= nn;
    ny /= nn;
    if ((mx - cx) * nx + (my - cy) * ny < 0) [nx, ny] = [-nx, -ny];
    texts.push({
      cls: `tv${/^[a-z]$/.test(t) ? ' ti' : ''}`,
      s: t,
      x: mx + nx * (14 + Math.abs(nx) * Math.min(t.length * 3, 12)),
      y: my + ny * 14 + 5,
    });
  }
  // De rand: ruim genoeg voor alle tekst, ongeveer 8 pixels per teken. Met een rooster in hele
  // hokjes, en minstens één hokje.
  const fw = (x1 - x0) * u,
    fh = (y1 - y0) * u,
    need = (v) => Math.max(6, v + 4),
    side = [
      need(-Math.min(0, ...texts.map((t) => t.x - t.s.length * 4))),
      need(-Math.min(0, ...texts.map((t) => t.y - 13))),
      need(Math.max(0, ...texts.map((t) => t.x + t.s.length * 4 - fw))),
      need(Math.max(0, ...texts.map((t) => t.y + 4 - fh))),
    ].map((v) => (grid ? Math.max(1, Math.ceil(v / u)) * u : v)),
    [ml, mt, mr, mb] = side,
    W = Math.ceil(fw + ml + mr - 1e-9),
    Ht = Math.ceil(fh + mt + mb - 1e-9),
    P = P0.map(([x, y]) => [x + ml, y + mt]),
    r1 = (c) => c.toFixed(1),
    seg = (cls, a, c) =>
      `<line class="${cls}" x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(c[0])}" y2="${r1(c[1])}"/>`;
  let o = '';
  if (grid) {
    // Het rooster gaat door de hoekpunten met hele coördinaten.
    const sx = ml - (x0 - Math.floor(x0)) * u,
      sy = mt - (Math.ceil(y1) - y1) * u;
    for (let x = sx - Math.ceil(sx / u) * u; x <= W + 1e-6; x += u)
      if (x >= -1e-6) o += seg('gl', [x, 0], [x, Ht]);
    for (let y = sy - Math.ceil(sy / u) * u; y <= Ht + 1e-6; y += u)
      if (y >= -1e-6) o += seg('gl', [0, y], [W, y]);
  }
  if (fillIdx)
    o += `<polygon class="sf" points="${fillIdx.map((k) => `${r1(P[k][0])},${r1(P[k][1])}`).join(' ')}"/>`;
  // Eerst de gestippelde ribben, zodat een volle ribbe erover valt.
  const hidden = m.edges.filter((e) => e.hidden);
  for (const e of hidden) o += seg('s d', P[e.i], P[e.j]);
  for (const e of m.edges.filter((x) => !x.hidden)) o += seg('s', P[e.i], P[e.j]);
  for (const t of texts)
    o += `<text class="${t.cls}" text-anchor="middle" x="${r1(t.x + ml)}" y="${r1(t.y + mt)}">${esc(t.s)}</text>`;
  const desc = solidDesc(m, { show, shown, hidden, lens, fillIdx, label, counts, cw });
  return `<svg class="fig" role="img" aria-label="${attr(desc)}" width="${W.toFixed(0)}" height="${Ht.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${Ht.toFixed(0)}">${o}</svg>`;
}

export { net, solid, solidFacts };
