// Tekent figuren als SVG-tekst: grafieken, driehoeken, evenwijdige lijnen en diagrammen.
import { pick, near, d, rd, isNice } from './math.js';
import { esc } from './typeset.js';

// Elke figuur zegt in woorden wat erin staat, voor wie hem niet kan zien: de gemarkeerde punten,
// de lengtes, de rechte hoeken en de hoeken met boogjes. Zo is een vraag ook met een schermlezer
// te maken. De beschrijving zegt nooit meer dan wat je in de figuur ziet. Zie #55.
const num = (x) => d(x).replace('-', '−');
const whole = (x) => near(x, Math.round(x), 1e-9);
const spot = (x, y) =>
  whole(x) && whole(y) ? `(${num(x)}, ${num(y)})` : `x = ${num(x)} en y = ${num(y)}`;
const and = (items) =>
  items.length < 2
    ? items.join('')
    : `${items.slice(0, -1).join(', ')} en ${items[items.length - 1]}`;
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const trend = (a) => (a > 0 ? 'stijgt' : a < 0 ? 'daalt' : 'loopt horizontaal');

// Een parabool y = ax² + bx + c staat als gegevens in abc: [a, b, c], met a niet 0.
const val = ([a, b, c], x) => (a * x + b) * x + c;
// De snijpunten met de x-as, van links naar rechts. Raakt de parabool de x-as, dan is er één.
function roots([a, b, c]) {
  const D = b * b - 4 * a * c;
  if (near(D, 0, 1e-9)) return [-b / (2 * a)];
  if (D < 0) return [];
  return [(-b - Math.sqrt(D)) / (2 * a), (-b + Math.sqrt(D)) / (2 * a)].sort((p, q) => p - q);
}
// Een getal dat niet mooi uitkomt, zoals bij een snijpunt met een wortel, staat afgerond met ≈.
const about = (n, x) => (isNice(x, 4) ? `${n} = ${num(x)}` : `${n} ≈ ${num(rd(x, 1))}`);
// Wat je van een parabool ziet: dal- of bergparabool, de top en de snijpunten met de assen, voor
// zover die in het beeld liggen. Bij een schets alleen waar ze liggen, want getallen staan er niet.
function curveDesc(k, who, { view, xn, yn, sketch }) {
  const { abc } = k,
    [a, , c] = abc,
    xt = -abc[1] / (2 * a),
    yt = val(abc, xt),
    seen = (x, y) =>
      x >= view[0] - 1e-9 && x <= view[1] + 1e-9 && y >= view[2] - 1e-9 && y <= view[3] + 1e-9,
    xAxis = seen(view[0], 0) && seen(view[1], 0),
    yAxis = seen(0, view[2]) && seen(0, view[3]),
    all = roots(abc),
    cuts = all.filter((x) => seen(x, 0)),
    top = seen(xt, yt),
    out = [];
  const kind = a > 0 ? 'dalparabool' : 'bergparabool';
  if (sketch) {
    out.push(cap(`${who} is een ${kind}.`));
    const side = (v, axis, lo, hi) =>
      near(v, 0, 1e-9) ? `op de ${axis}-as` : v < 0 ? `${lo} de ${axis}-as` : `${hi} de ${axis}-as`;
    if (top)
      out.push(
        near(xt, 0, 1e-9) && near(yt, 0, 1e-9)
          ? 'De top ligt in O.'
          : `De top ligt ${side(xt, yn, 'links van', 'rechts van')} en ${side(yt, xn, 'onder', 'boven')}.`,
      );
  } else {
    const where =
      whole(xt) && whole(yt) ? `in ${spot(xt, yt)}` : `bij ${about(xn, xt)} en ${about(yn, yt)}`;
    out.push(cap(`${who} is een ${kind}${top ? ` met de top ${where}` : ''}.`));
  }
  // Raakt de parabool de x-as of snijdt hij die niet, dan is dat een eigen zin.
  const parts = [];
  if (xAxis) {
    if (all.length === 1 && cuts.length) out.push(`Hij raakt de ${xn}-as in de top.`);
    else if (!all.length) out.push(`Hij snijdt de ${xn}-as niet.`);
    else if (cuts.length)
      parts.push(
        sketch
          ? `de ${xn}-as ${cuts.length === 2 ? 'twee keer' : 'één keer'}`
          : `de ${xn}-as bij ${and(cuts.map((x) => about(xn, x)))}`,
      );
  }
  if (yAxis && seen(0, c))
    parts.push(
      sketch
        ? `de ${yn}-as ${near(c, 0, 1e-9) ? 'in O' : c > 0 ? 'boven O' : 'onder O'}`
        : `de ${yn}-as bij ${about(yn, c)}`,
    );
  if (parts.length) out.push(`Hij snijdt ${parts.join(sketch ? ' en ' : ', en ')}.`);
  return out.join(' ');
}

function graphDesc({ xr, yr, lines, curves, pts, xs, ys, xn, yn, sketch, label }) {
  const out = [label.replace(/\.$/, '') + '.'];
  if (!sketch) {
    out.push(
      `De ${xn}-as loopt van ${num(xr[0] * xs)} tot ${num(xr[1] * xs)} en de ${yn}-as van ${num(yr[0] * ys)} tot ${num(yr[1] * ys)}.`,
    );
    if (xs !== 1 || ys !== 1)
      out.push(`Eén hokje is ${num(xs)} op de ${xn}-as en ${num(ys)} op de ${yn}-as.`);
  }
  const on = (l, p) => near(l.a * p.x + l.b, p.y, 1e-6);
  const nameOf = (l, i) =>
    l.name ? `lijn ${l.name}` : lines.length > 1 ? `lijn ${i + 1}` : 'de lijn';
  const crossing = (p) => lines.filter((l) => on(l, p)).length > 1;
  lines.forEach((l, i) => {
    const n = nameOf(l, i);
    if (sketch) return out.push(cap(`${n} ${trend(l.a)}.`));
    // Eerst de gemarkeerde punten op deze lijn, daarna roosterpunten, het liefst dicht bij de y-as.
    const marked = pts.filter((p) => !p.label && on(l, p) && !crossing(p));
    const grid = [];
    for (let k = xr[0]; k <= xr[1]; k++) {
      const x = k * xs,
        j = (l.a * x + l.b) / ys;
      if (whole(j) && j >= yr[0] && j <= yr[1] && !marked.some((p) => near(p.x, x)))
        grid.push({ x, y: Math.round(j) * ys });
    }
    grid.sort((p, q) => Math.abs(p.x) - Math.abs(q.x) || q.x - p.x);
    const m = marked.slice(0, 2).map((p) => spot(p.x, p.y)),
      g = grid.slice(0, 2 - m.length).map((p) => spot(p.x, p.y));
    if (m.length + g.length < 2)
      return out.push(cap(`${n} snijdt de ${yn}-as bij ${num(l.b)} en ${trend(l.a)}.`));
    const through =
      m.length === 2
        ? `de gemarkeerde punten ${and(m)}`
        : m.length === 1
          ? `het gemarkeerde punt ${m[0]} en het roosterpunt ${g[0]}`
          : `de roosterpunten ${and(g)}`;
    out.push(cap(`${n} gaat door ${through}.`));
  });
  const view = [xr[0] * xs, xr[1] * xs, yr[0] * ys, yr[1] * ys];
  curves.forEach((k, i) => {
    const who = k.name
      ? `de grafiek van ${k.name}`
      : curves.length > 1
        ? `grafiek ${i + 1}`
        : 'de grafiek';
    out.push(curveDesc(k, who, { view, xn, yn, sketch }));
  });
  pts.forEach((p) => {
    const ls = lines.map((l, i) => [l, i]).filter(([l]) => on(l, p)),
      names = and(ls.map(([l, i]) => nameOf(l, i))),
      where = sketch ? '' : ` ${spot(p.x, p.y)}`;
    if (p.label) {
      const at = sketch ? '' : ` op ${spot(p.x, p.y)}`,
        cross = ls.length > 1 ? `, waar ${names} elkaar snijden` : '';
      out.push(`Punt ${p.label} is gemarkeerd${at}${cross}.`);
    } else if (ls.length > 1)
      out.push(cap(`${names} snijden elkaar in het gemarkeerde punt${where}.`));
    else if (!ls.length) out.push(`Gemarkeerd punt${where}.`);
  });
  return out.join(' ');
}
function geoDesc({ pts, segs, sides, arcs, rights, tris, hide, dash, nums, P }) {
  const vis = Object.keys(pts).filter((k) => !hide.includes(k)),
    seen = (g) => [...g].every((k) => vis.includes(k)),
    angle = ({ at, p, q }) => `hoek ${p}${at}${q}`,
    out = [];
  if (tris.length) out.push(cap(`${and(tris.map((t) => `driehoek ${t}`))}.`));
  else if (vis.length) out.push(`Figuur met de punten ${and(vis)}.`);
  const triSide = new Set(
    tris.flatMap((t) => [0, 1, 2].map((i) => [t[i], t[(i + 1) % 3]].sort().join(''))),
  );
  const more = segs.filter((g) => seen(g) && !triSide.has([...g].sort().join('')));
  if (more.length)
    out.push(`${tris.length ? 'Verder de lijnstukken' : 'Lijnstukken'} ${and(more)}.`);
  if (dash.some(seen)) out.push(`Gestippeld: ${and(dash.filter(seen))}.`);
  // Een punt op een getekend lijnstuk, zoals D op AB.
  const lies = [];
  for (const g of [...segs, ...dash].filter(seen))
    for (const k of vis) {
      if (g.includes(k)) continue;
      const [a, b] = [pts[g[0]], pts[g[1]]],
        p = pts[k],
        dx = b[0] - a[0],
        dy = b[1] - a[1],
        l2 = dx * dx + dy * dy,
        t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2,
        cross = (dx * (p[1] - a[1]) - dy * (p[0] - a[0])) / l2;
      if (Math.abs(cross) < 1e-6 && t > 1e-6 && t < 1 - 1e-6) lies.push(`${k} ligt op ${g}`);
    }
  if (lies.length) out.push(cap(`${and(lies)}.`));
  const lengths = sides
    .filter(({ a, b }) => seen(a + b))
    .map(({ a, b, t }) => `${a}${b} = ${String(t).replace('-', '−')}`);
  if (lengths.length) out.push(`Lengtes: ${and(lengths)}.`);
  if (rights.length)
    out.push(cap(`${and(rights.map(angle))} ${rights.length > 1 ? 'zijn' : 'is'} recht.`));
  // Hoeken met evenveel boogjes zijn gelijk.
  const groups = new Map();
  for (const a of arcs) {
    const key = `${a.n ?? 1}-${a.c ?? 1}`;
    groups.set(key, [...(groups.get(key) ?? []), a]);
  }
  for (const list of groups.values()) {
    const n = list[0].n ?? 1,
      bows = n === 1 ? '1 boogje' : `${n} boogjes`,
      both = list.length === 2 ? 'allebei' : 'elk';
    out.push(
      list.length === 1
        ? cap(`${angle(list[0])} heeft ${bows}.`)
        : cap(`${and(list.map(angle))} hebben ${both} ${bows}.`),
    );
  }
  // Een nummer bij een hoek, zoals C_1: in welke driehoek staat het?
  const inside = ([x, y], t) => {
    const [a, b, c] = [...t].map(P),
      s = (p, q) => (q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]),
      v = [s(a, b), s(b, c), s(c, a)];
    return v.every((z) => z > 0) || v.every((z) => z < 0);
  };
  for (const { at, t, off } of nums) {
    const xy = [P(at)[0] + off[0], P(at)[1] + off[1]],
      tri = tris.find((tr) => tr.includes(at) && inside(xy, tr));
    out.push(tri ? `Hoek ${at}${t} ligt in driehoek ${tri}.` : `Bij ${at} staat het nummer ${t}.`);
  }
  return out.join(' ') || 'Meetkundige figuur';
}

// Het pad van een parabool in het rooster. Een stuk van een parabool is precies een kwadratische
// Bézier-kromme, met als controlepunt het snijpunt van de raaklijnen in de eindpunten. Zo is het pad
// vloeiend met weinig tekst. Alleen de stukken die bij het rooster in de buurt komen, worden
// getekend: verder weg worden de getallen groot. De rand van het rooster snijdt de rest af.
function curvePath(abc, { xr, yr, xs, ys, X, Y }) {
  const f = (x) => val(abc, x * xs) / ys,
    slope = (x) => ((2 * abc[0] * x * xs + abc[1]) * xs) / ys,
    r2 = (n) => String(Number(n.toFixed(2))),
    n = (xr[1] - xr[0]) * 20,
    xk = (k) => xr[0] + (k * (xr[1] - xr[0])) / n,
    near = (k) => f(xk(k)) >= yr[0] - 1 && f(xk(k)) <= yr[1] + 1;
  let o = '';
  for (let k = 0; k <= n; k++) {
    if (!near(k) || (k > 0 && near(k - 1))) continue;
    let e = k;
    while (e < n && near(e + 1)) e++;
    // Eén stap verder aan beide kanten, zodat het pad tot buiten het rooster doorloopt.
    const x0 = xk(Math.max(k - 1, 0)),
      x1 = xk(Math.min(e + 1, n)),
      cx = (x0 + x1) / 2,
      cy = f(x0) + (slope(x0) * (x1 - x0)) / 2;
    o += `M${r2(X(x0))} ${r2(Y(f(x0)))}Q${r2(X(cx))} ${r2(Y(cy))} ${r2(X(x1))} ${r2(Y(f(x1)))}`;
  }
  return o;
}
function graph({
  xr = [-1, 6],
  yr = [-5, 6],
  lines = [],
  // Parabolen: { abc: [a, b, c], name: 'f', c: 2, at: 3 } voor y = ax² + bx + c. Net als bij lines
  // is c de kleur en at de plek van de naam.
  curves = [],
  pts = [],
  u = 26,
  xs = 1,
  ys = 1,
  xn = 'x',
  yn = 'y',
  lx = 1,
  ly = 1,
  extra = '',
  sketch = false, // Een schets: alleen de assen, dus zonder rooster en getallen.
  draw = false, // Een rooster om zelf in te tekenen, zie ui/draw.js.
  label = 'Grafiek in een assenstelsel',
}) {
  const desc = graphDesc({ xr, yr, lines, curves, pts, xs, ys, xn, yn, sketch, label });
  const ml = 30,
    mr = 20,
    mt = 20,
    mb = 22,
    W = (xr[1] - xr[0]) * u + ml + mr,
    Ht = (yr[1] - yr[0]) * u + mt + mb;
  const X = (x) => ml + (x - xr[0]) * u,
    Y = (y) => mt + (yr[1] - y) * u;
  // Een geneste svg snijdt de lijnen af bij de rand van het rooster. Een clipPath zou een id nodig
  // hebben, en dan is dezelfde figuur niet steeds dezelfde tekst.
  const box = [X(xr[0]), Y(yr[1]), (xr[1] - xr[0]) * u, (yr[1] - yr[0]) * u],
    inside = (cls = '') =>
      `<svg${cls} x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" viewBox="${box.join(' ')}">`;
  let o = '';
  if (!sketch) {
    for (let i = xr[0]; i <= xr[1]; i++)
      o += `<line class="gl" x1="${X(i)}" x2="${X(i)}" y1="${Y(yr[1])}" y2="${Y(yr[0])}"/>`;
    for (let j = yr[0]; j <= yr[1]; j++)
      o += `<line class="gl" x1="${X(xr[0])}" x2="${X(xr[1])}" y1="${Y(j)}" y2="${Y(j)}"/>`;
  }
  const ax = Math.max(xr[0], 0),
    ay = Math.max(yr[0], 0);
  o += `<path class="ax" d="M${X(xr[0]) - 6} ${Y(ay)}H${X(xr[1]) + 10}m-6 -4l6 4l-6 4M${X(ax)} ${Y(yr[0]) + 6}V${Y(yr[1]) - 10}m-4 6l4 -6l4 6"/>`;
  o += `<text class="ti" x="${X(xr[1]) + 6}" y="${Y(ay) - 8}">${xn}</text><text class="ti" x="${X(ax) + 9}" y="${Y(yr[1]) - 5}">${yn}</text><text class="ti tk" x="${X(ax) - 11}" y="${Y(ay) + 14}">O</text>`;
  if (!sketch) {
    for (let i = xr[0]; i <= xr[1]; i++)
      if (i && i % lx === 0)
        o += `<text class="tk" text-anchor="middle" x="${X(i)}" y="${Y(ay) + 15}">${String(i * xs).replace('-', '−')}</text>`;
    for (let j = yr[0]; j <= yr[1]; j++)
      if (j && j % ly === 0)
        o += `<text class="tk" text-anchor="end" x="${X(ax) - 5}" y="${Y(j) + 4}">${String(j * ys).replace('-', '−')}</text>`;
  }
  o += inside();
  lines.forEach((l, i) => {
    const f = (x) => (l.a * x * xs + l.b) / ys;
    o += `<line class="l${l.c || i + 1}" x1="${X(xr[0])}" y1="${Y(f(xr[0]))}" x2="${X(xr[1])}" y2="${Y(f(xr[1]))}"/>`;
  });
  // Een parabool krijgt na de lijnen de volgende kleur, of een eigen kleur met c.
  const color = (k, i) => k.c || ((lines.length + i) % 3) + 1;
  curves.forEach((k, i) => {
    o += `<path class="l${color(k, i)}" d="${curvePath(k.abc, { xr, yr, xs, ys, X, Y })}"/>`;
  });
  o += '</svg>';
  lines.forEach((l, i) => {
    if (!l.name) return;
    const f = (x) => (l.a * x * xs + l.b) / ys;
    let tx = l.at ?? xr[1] - 0.1;
    for (let k = 0; k < 400 && l.at === undefined; k++) {
      if (f(tx) >= yr[0] + 0.3 && f(tx) <= yr[1] - 0.3) break;
      tx -= (xr[1] - xr[0]) / 400;
    }
    const up = -8,
      // Met een eigen plek (at) komt de naam aan de kant waar de lijn niet naartoe loopt.
      after = l.at !== undefined && l.a < 0;
    o += `<text class="t${l.c || i + 1} ti" text-anchor="${after ? 'start' : 'end'}" x="${X(tx) + (after ? 6 : -6)}" y="${Y(f(tx)) + up}">${l.name}</text>`;
  });
  curves.forEach((k, i) => {
    if (!k.name) return;
    const f = (x) => val(k.abc, x * xs) / ys,
      slope = (x) => ((2 * k.abc[0] * x * xs + k.abc[1]) * xs) / ys;
    let tx = k.at ?? xr[1] - 0.1;
    for (let j = 0; j < 400 && k.at === undefined; j++) {
      if (f(tx) >= yr[0] + 0.3 && f(tx) <= yr[1] - 0.3) break;
      tx -= (xr[1] - xr[0]) / 400;
    }
    // De naam staat boven de grafiek: links van een stijgend stuk, rechts van een dalend stuk.
    const after = slope(tx) < 0;
    o += `<text class="t${color(k, i)} ti" text-anchor="${after ? 'start' : 'end'}" x="${(X(tx) + (after ? 6 : -6)).toFixed(1)}" y="${(Y(f(tx)) - 8).toFixed(1)}">${k.name}</text>`;
  });
  pts.forEach((p) => {
    o += `<circle class="dot" cx="${X(p.x / xs)}" cy="${Y(p.y / ys)}" r="3.6"/>`;
    if (p.label)
      o += `<text class="ti" x="${X(p.x / xs) + (p.off ? p.off[0] : 7)}" y="${Y(p.y / ys) + (p.off ? p.off[1] : -7)}">${p.label}</text>`;
  });
  const drawing = draw ? `${inside(' class="drawn"')}</svg>` : '',
    drawData = draw ? ` data-draw="${[...xr, ...yr, u, ml, mt].join(',')}"` : '';
  return `<svg class="fig" role="img" aria-label="${attr(desc)}"${drawData} width="${W}" height="${Ht}" viewBox="0 0 ${W} ${Ht}">${o}${typeof extra === 'function' ? extra(X, Y) : extra}${drawing}</svg>`;
}
// Tekent punten in een rooster om zelf in te tekenen, met de lijn door twee punten of de parabool
// door drie punten. data is de inhoud van data-draw, zodat alles op dezelfde plek komt als in het
// rooster zelf. Bij drie punten op één rechte lijn is er geen parabool, en staat die lijn er.
function drawnHTML(data, pts, { cls = 'l1', dots = true } = {}) {
  const [x0, x1, y0, y1, u, ml, mt] = data.split(',').map(Number),
    X = (x) => ml + (x - x0) * u,
    Y = (y) => mt + (y1 - y) * u,
    given = pts.filter((p) => p.every(Number.isFinite)),
    // Ver buiten het rooster doortrekken: de rand van het rooster snijdt de lijn af.
    line = ([a, b], [c, e]) => {
      const far = 100,
        dx = c - a,
        dy = e - b;
      return `<line class="${cls}" x1="${X(a - dx * far)}" y1="${Y(b - dy * far)}" x2="${X(a + dx * far)}" y2="${Y(b + dy * far)}"/>`;
    };
  let o = '';
  if (
    pts.length === 2 &&
    given.length === 2 &&
    (given[0][0] !== given[1][0] || given[0][1] !== given[1][1])
  )
    o += line(given[0], given[1]);
  if (pts.length === 3 && given.length === 3) {
    const abc = through(given);
    if (abc && Math.abs(abc[0]) < 1e-9) o += line(given[0], given[2]);
    else if (abc)
      o += `<path class="${cls}" d="${curvePath(abc, { xr: [x0, x1], yr: [y0, y1], xs: 1, ys: 1, X, Y })}"/>`;
  }
  if (dots)
    given.forEach(([x, y]) => (o += `<circle class="dot" cx="${X(x)}" cy="${Y(y)}" r="5"/>`));
  return o;
}
// [a, b, c] van de parabool y = ax² + bx + c door drie punten, of null als twee punten dezelfde x
// hebben. a is 0 als de punten op één rechte lijn liggen.
function through([[p, P], [q, Q], [r, R]]) {
  if (p === q || p === r || q === r) return null;
  const k = P / ((p - q) * (p - r)),
    l = Q / ((q - p) * (q - r)),
    m = R / ((r - p) * (r - q));
  return [k + l + m, -(k * (q + r) + l * (p + r) + m * (p + q)), k * q * r + l * p * r + m * p * q];
}
// Het rooster van een tekenvraag in de uitslag: wat de leerling tekende, en bij een fout ook de
// goede lijn y = ax + b of de goede parabool y = ax² + bx + c. Op dit rooster kun je niet meer
// tikken. Een proeftoets die nog uit versie 1.6.0 in de browser staat, heeft een <g class="drawn">
// in plaats van een svg.
function drawnResult(fig, pts, { line, parabola }, ok) {
  const data = fig.match(/ data-draw="([^"]+)"/)[1],
    [x0, x1] = data.split(',').map(Number),
    // De goede grafiek door twee of drie van zijn punten, zoals de leerling hem ook tekent.
    good = ok
      ? ''
      : drawnHTML(
          data,
          parabola
            ? [x0, (x0 + x1) / 2, x1].map((x) => [
                x,
                parabola.a * x * x + parabola.b * x + parabola.c,
              ])
            : [x0, x1].map((x) => [x, line.a * x + line.b]),
          { cls: 'l2 d', dots: false },
        ),
    shape = parabola ? 'parabool' : 'lijn',
    label = ok ? `Rooster met jouw ${shape}` : `Rooster met jouw ${shape} en de goede ${shape}`;
  return fig
    .replace(` data-draw="${data}"`, '')
    .replace(/aria-label="[^"]*"/, `aria-label="${label}"`)
    .replace(
      /(<(g|svg) class="drawn"[^>]*>)<\/\2>/,
      (_, open, tag) => `${open}${good}${drawnHTML(data, pts)}</${tag}>`,
    );
}
function triFromSides(ab, bc, ac) {
  const x = (ab * ab + ac * ac - bc * bc) / (2 * ab);
  return { A: [0, 0], B: [ab, 0], C: [x, Math.sqrt(Math.max(ac * ac - x * x, 0))] };
}
const xf = ([x, y], { s = 1, r = 0, fx = false, dx = 0, dy = 0 } = {}) => {
  if (fx) x = -x;
  const c = Math.cos(r),
    n = Math.sin(r);
  return [s * (x * c - y * n) + dx, s * (x * n + y * c) + dy];
};
function geo({
  pts,
  segs = [],
  sides = [],
  arcs = [],
  rights = [],
  tris = [],
  w = 340,
  maxH = 300,
  hide = '',
  dash = [],
  pad = 30,
  off = {},
  nums = [], // Nummers bij hoeken, zoals C_1 en C_2: { at: 'C', t: 1, off: [x, y] }.
  desc = '', // Een eigen beschrijving, als de punten geen zichtbare namen hebben.
}) {
  const K = Object.keys(pts),
    xa = K.map((k) => pts[k][0]),
    ya = K.map((k) => pts[k][1]),
    x0 = Math.min(...xa),
    x1 = Math.max(...xa),
    y0 = Math.min(...ya),
    y1 = Math.max(...ya);
  const dx = x1 - x0 || 1,
    dy = y1 - y0 || 1,
    s = Math.min((w - 2 * pad) / dx, (maxH - 2 * pad) / dy),
    W = dx * s + 2 * pad,
    Ht = dy * s + 2 * pad;
  const P = (k) => [(pts[k][0] - x0) * s + pad, Ht - ((pts[k][1] - y0) * s + pad)];
  const cen = (ks) => {
    const a = ks.map(P);
    return [a.reduce((t, p) => t + p[0], 0) / a.length, a.reduce((t, p) => t + p[1], 0) / a.length];
  };
  const centerOf = (...ks) => {
    const t = tris.find((t) => ks.every((k) => t.includes(k)));
    return t ? cen([...t]) : cen(K);
  };
  const r2 = (n) => n.toFixed(1);
  let o = '';
  segs.forEach((g) => {
    const [a, b] = [P(g[0]), P(g[1])];
    o += `<line class="s" x1="${r2(a[0])}" y1="${r2(a[1])}" x2="${r2(b[0])}" y2="${r2(b[1])}"/>`;
  });
  dash.forEach((g) => {
    const [a, b] = [P(g[0]), P(g[1])];
    o += `<line class="s d" x1="${r2(a[0])}" y1="${r2(a[1])}" x2="${r2(b[0])}" y2="${r2(b[1])}"/>`;
  });
  rights.forEach(({ at, p, q }) => {
    const A = P(at),
      u = P(p),
      v = P(q),
      nu = Math.hypot(u[0] - A[0], u[1] - A[1]),
      nv = Math.hypot(v[0] - A[0], v[1] - A[1]),
      a = [((u[0] - A[0]) / nu) * 11, ((u[1] - A[1]) / nu) * 11],
      b = [((v[0] - A[0]) / nv) * 11, ((v[1] - A[1]) / nv) * 11];
    o += `<path class="a1" d="M${r2(A[0] + a[0])} ${r2(A[1] + a[1])}L${r2(A[0] + a[0] + b[0])} ${r2(A[1] + a[1] + b[1])}L${r2(A[0] + b[0])} ${r2(A[1] + b[1])}"/>`;
  });
  arcs.forEach(({ at, p, q, n = 1, c = 1 }) => {
    const A = P(at),
      u = P(p),
      v = P(q);
    let a1 = Math.atan2(u[1] - A[1], u[0] - A[0]),
      a2 = Math.atan2(v[1] - A[1], v[0] - A[0]);
    let da = a2 - a1;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    for (let i = 0; i < n; i++) {
      const r = 15 + i * 5,
        sx = A[0] + r * Math.cos(a1),
        sy = A[1] + r * Math.sin(a1),
        ex = A[0] + r * Math.cos(a1 + da),
        ey = A[1] + r * Math.sin(a1 + da);
      o += `<path class="a${c}" d="M${r2(sx)} ${r2(sy)}A${r} ${r} 0 0 ${da > 0 ? 1 : 0} ${r2(ex)} ${r2(ey)}"/>`;
    }
  });
  K.filter((k) => !hide.includes(k)).forEach((k) => {
    const p = P(k),
      c = centerOf(k);
    let ux = p[0] - c[0],
      uy = p[1] - c[1];
    const n = Math.hypot(ux, uy) || 1,
      ox = off[k] ? off[k][0] : (ux / n) * 15,
      oy = off[k] ? off[k][1] : (uy / n) * 15;
    o += `<text class="ti" text-anchor="middle" x="${r2(p[0] + ox)}" y="${r2(p[1] + oy + 5)}">${k}</text>`;
  });
  nums.forEach(({ at, t, off: o2 }) => {
    const p = P(at);
    o += `<text class="tk" text-anchor="middle" x="${r2(p[0] + o2[0])}" y="${r2(p[1] + o2[1] + 4)}">${t}</text>`;
  });
  sides.forEach(({ a, b, t, flip }) => {
    const A = P(a),
      B = P(b),
      c = centerOf(a, b),
      mx = (A[0] + B[0]) / 2,
      my = (A[1] + B[1]) / 2;
    let nx = -(B[1] - A[1]),
      ny = B[0] - A[0];
    const n = Math.hypot(nx, ny) || 1;
    nx /= n;
    ny /= n;
    if ((mx - c[0]) * nx + (my - c[1]) * ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    if (flip) {
      nx = -nx;
      ny = -ny;
    }
    o += `<text class="tv${/^[a-z]$/.test(String(t)) ? ' ti' : ''}" text-anchor="middle" x="${r2(mx + nx * (14 + Math.abs(nx) * Math.min(String(t).length * 3, 12)))}" y="${r2(my + ny * 14 + 5)}">${esc(String(t).replace('-', '−'))}</text>`;
  });
  const label = desc || geoDesc({ pts, segs, sides, arcs, rights, tris, hide, dash, nums, P });
  return `<svg class="fig" role="img" aria-label="${attr(label)}" width="${W.toFixed(0)}" height="${Ht.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${Ht.toFixed(0)}">${o}</svg>`;
}
/* Evenwijdige lijnen met een snijlijn; markeer twee hoeken. pos: 0 rechtsboven, 1 linksboven, 2 linksonder, 3 rechtsonder */
// Zonder hoek kiest de figuur er zelf een. Geef een hoek mee als de figuur steeds gelijk moet zijn.
function angleFig(p1, q1, p2, q2, w = 300, deg = pick([55, 65, 115, 125])) {
  const th = (deg * Math.PI) / 180,
    H = 170,
    yP = 52,
    yQ = 120,
    cx = w / 2,
    dx = (yQ - yP) / Math.tan(th);
  const P = [cx + dx / 2, yP],
    Q2 = [cx - dx / 2, yQ],
    arc = (A, pos, cls) => {
      const t = [0, th, Math.PI, th + Math.PI, 2 * Math.PI];
      const s = t[pos],
        e = t[pos + 1],
        r = 20,
        sx = A[0] + r * Math.cos(s),
        sy = A[1] - r * Math.sin(s),
        ex = A[0] + r * Math.cos(e),
        ey = A[1] - r * Math.sin(e);
      return `<path class="${cls}" d="M${A[0].toFixed(1)} ${A[1].toFixed(1)}L${sx.toFixed(1)} ${sy.toFixed(1)}A${r} ${r} 0 ${e - s > Math.PI ? 1 : 0} 0 ${ex.toFixed(1)} ${ey.toFixed(1)}Z"/>`;
    };
  const ext = 46,
    ux = Math.cos(th),
    uy = -Math.sin(th);
  const a = [P[0] + ux * ext, P[1] + uy * ext],
    b = [Q2[0] - ux * ext, Q2[1] - uy * ext];
  const where = ['rechtsboven', 'linksboven', 'linksonder', 'rechtsonder'],
    cut = (q) => (q === 0 ? 'het bovenste snijpunt' : 'het onderste snijpunt'),
    marked = [
      [p1, q1],
      [p2, q2],
    ]
      .filter(([p]) => p != null)
      .map(([p, q]) => `de hoek ${where[p]} bij ${cut(q)}`),
    label =
      'Twee evenwijdige horizontale lijnen met een schuine snijlijn.' +
      (marked.length ? ` Gekleurd zijn ${and(marked)}.` : '');
  return `<svg class="fig" role="img" aria-label="${label}" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}">
  ${p1 != null ? arc(q1 === 0 ? P : Q2, p1, 'w1') : ''}${p2 != null ? arc(q2 === 0 ? P : Q2, p2, 'w2') : ''}
  <line class="s" x1="16" x2="${w - 16}" y1="${yP}" y2="${yP}"/><line class="s" x1="16" x2="${w - 16}" y1="${yQ}" y2="${yQ}"/>
  <line class="s" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>
  <path class="a2" d="M36 ${yP - 5}l7 5l-7 5M36 ${yQ - 5}l7 5l-7 5"/></svg>`;
}
const rightTriFig = (a, b, labels = {}, L = 'ABC') => {
  const pts = { [L[0]]: [0, 0], [L[1]]: [a, 0], [L[2]]: [0, b] };
  return geo({
    pts,
    segs: [L[0] + L[1], L[1] + L[2], L[2] + L[0]],
    rights: [{ at: L[0], p: L[1], q: L[2] }],
    sides: Object.entries(labels).map(([k, t]) => ({ a: k[0], b: k[1], t })),
    w: 300,
    maxH: 230,
  });
};
// Diagrammen met kind: 'staaf', 'stapel' (gestapelde staven), 'cirkel' of 'lijn'. Een reeks is
// { name, values, c }, met c de kleur zoals bij graph, hier 1 tot 6. cats zijn de namen onder de
// staven of op de tijdas, of de sectoren van een cirkeldiagram, die zelf hun kleur krijgen. De
// verticale as loopt over yr in stappen ys, standaard van 0 tot een mooi getal boven het grootste.
// Begint yr niet bij 0, dan begint de as daar gewoon, of met brk bij 0 met een onderbroken stuk.
// Met at, zoals jaartallen, staan de punten van een lijndiagram op afstand naar die getallen.
// vals zet de getallen bij de staven of punten, pct de procenten in een cirkeldiagram. u is de
// breedte per staaf of punt, of de straal van de cirkel, en h de hoogte van de as.
// Een reeks heeft ook een naam in de legenda en bij een lijn een eigen vorm van de punten, zodat je
// de reeksen niet alleen aan de kleur herkent. De beschrijving noemt alle getallen.
// Voor misleidende diagrammen: y2 is een tweede verticale as rechts, { yr, ys, yn, unit }, voor de
// reeksen van een lijndiagram met ax: 2. Met grow is een staaf breder naarmate hij hoger is, zoals
// een plaatje dat in de hoogte en de breedte groeit. Staan jaartallen zonder at op gelijke afstand
// terwijl de stappen verschillen, dan zegt de beschrijving dat de punten op gelijke afstand staan.
const KINDS = {
  staaf: 'Staafdiagram',
  stapel: 'Gestapeld staafdiagram',
  cirkel: 'Cirkeldiagram',
  lijn: 'Lijndiagram',
};
const SHAPES = ['rondjes', 'vierkantjes', 'driehoekjes'];
const f1 = (x) => +x.toFixed(1);
// Een stap van 1, 2, 2,5 of 5 maal een macht van 10, met hoogstens 6 stappen.
function niceStep(span) {
  const p = 10 ** Math.floor(Math.log10(span / 6));
  return [1, 2, 2.5, 5, 10].map((k) => k * p).find((s) => span / s <= 6 + 1e-9);
}
const txt = (x, y, s, cls = 'tc', anchor = 'middle') =>
  `<text class="${cls}" text-anchor="${anchor}" x="${f1(x)}" y="${f1(y)}">${esc(s)}</text>`;
function mark(i, x, y, c) {
  const k = `class="mk c${c}"`;
  if (i % 3 === 0) return `<circle ${k} cx="${f1(x)}" cy="${f1(y)}" r="4"/>`;
  if (i % 3 === 1) return `<rect ${k} x="${f1(x - 3.5)}" y="${f1(y - 3.5)}" width="7" height="7"/>`;
  return `<path ${k} d="M${f1(x)} ${f1(y - 5)}l4.5 8h-9z"/>`;
}
function chart({
  kind = 'staaf',
  title = '',
  cats = [],
  series = [],
  yr,
  ys,
  brk = false,
  at,
  xn = '',
  yn = '',
  unit = '',
  vals = false,
  pct = false,
  u = kind === 'cirkel' ? 70 : 48,
  h = 160,
  y2,
  grow = false,
  label = KINDS[kind],
}) {
  const S = series.map((s, i) => ({ ...s, c: s.c || i + 1 })),
    n = cats.length,
    vu = (v) => num(v) + (unit ? ` ${unit}` : ''),
    list = (vs, f = vu) => and(cats.map((c, j) => `${c} ${f(vs[j])}`)),
    out = [`${label.replace(/\.$/, '')}${title ? `: ${title}` : ''}.`];
  let o = '',
    W,
    H;
  const top = title ? 30 : 8;
  if (kind === 'cirkel') {
    const vs = S[0].values,
      sum = vs.reduce((a, b) => a + b, 0),
      shown = (v) => (pct ? `${num(rd((100 * v) / sum, 1))}%` : num(v)),
      r = u,
      cx = r + 110,
      cy = top + r + 34,
      P = (a, R = r) => [cx + R * Math.sin(a), cy - R * Math.cos(a)];
    W = 2 * r + 220;
    H = cy + r + 42;
    // Eerst de sectoren en de plek van elk label: de naam met het getal eronder, naast de sector.
    let a0 = 0;
    const secs = vs.map((v, j) => {
      const a1 = a0 + (2 * Math.PI * v) / sum,
        m = (a0 + a1) / 2,
        [lx, ly] = P(m, r + 10),
        sin = Math.sin(m),
        side = sin > 1e-9 ? 1 : sin < -1e-9 ? -1 : 0,
        w = 7 * Math.max(cats[j].length, shown(v).length),
        s = {
          a0,
          a1,
          x: lx,
          y: ly + (Math.cos(m) > 0.3 ? -14 : Math.cos(m) < -0.3 ? 12 : -2),
          side,
          w,
        };
      a0 = a1;
      return s;
    });
    const box = (s) => {
      const x0 = s.side > 0 ? s.x : s.side < 0 ? s.x - s.w : s.x - s.w / 2;
      return { x0, x1: x0 + s.w, y0: s.y - 11, y1: s.y + 18 };
    };
    // Vallen twee labels over elkaar, zoals bij twee kleine sectoren naast elkaar, dan schuift het
    // label dat verder van de verticale lijn door het midden staat opzij, van de cirkel af.
    for (let pass = 0; pass < 4; pass++)
      secs.forEach((s, i) =>
        secs.forEach((t, k) => {
          if (k <= i) return;
          const [b, c] = [box(s), box(t)];
          if (b.x0 >= c.x1 || c.x0 >= b.x1 || b.y0 >= c.y1 || c.y0 >= b.y1) return;
          const [far, near] =
              Math.abs(s.side ? s.x - cx : 0) > Math.abs(t.side ? t.x - cx : 0) ? [s, t] : [t, s],
            nb = box(near);
          if (far.side > 0) far.x = nb.x1 + 6;
          else if (far.side < 0) far.x = nb.x0 - 6;
        }),
      );
    // Schuift een label buiten de figuur, dan wordt de figuur breder.
    const bs = secs.map(box),
      ox = Math.max(0, 4 - Math.min(...bs.map((b) => b.x0)));
    W = Math.max(W, Math.max(...bs.map((b) => b.x1)) + 4) + ox;
    const C = cx + ox;
    vs.forEach((v, j) => {
      const { a0, a1, x, y, side } = secs[j],
        [x0, y0] = P(a0),
        [x1, y1] = P(a1),
        anchor = side > 0 ? 'start' : side < 0 ? 'end' : 'middle',
        cls = `sec c${(j % 6) + 1}`;
      o +=
        v === sum
          ? `<circle class="${cls}" cx="${C}" cy="${cy}" r="${r}"/>`
          : `<path class="${cls}" d="M${C} ${cy}L${f1(x0 + ox)} ${f1(y0)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${f1(x1 + ox)} ${f1(y1)}Z"/>`;
      o += txt(x + ox, y, cats[j], 'tc', anchor) + txt(x + ox, y + 15, shown(v), 'tc', anchor);
    });
    out.push(`Met de klok mee vanaf boven: ${list(vs, pct ? shown : vu)}.`);
  } else {
    const stack = kind === 'stapel',
      tops = stack
        ? cats.map((_, j) => S.reduce((a, s) => a + s.values[j], 0))
        : S.filter((s) => !y2 || s.ax !== 2).flatMap((s) => s.values),
      [lo, hi0] = yr || [0],
      step = ys || niceStep((hi0 ?? Math.max(...tops)) - lo),
      hi = hi0 ?? Math.ceil(Math.max(...tops) / step - 1e-9) * step,
      ticks = [];
    for (let k = 0; lo + k * step <= hi + 1e-9; k++) ticks.push(rd(lo + k * step, 6));
    const axisName = (n, un) => [n, un && `(${un})`].filter(Boolean).join(' '),
      axis = axisName(yn, unit),
      ml = 14 + 7 * Math.max(...ticks.map((t) => num(t).length)),
      // De titel van de verticale as staat op ty. Met getallen bij de staven of punten komt er
      // ruimte onder, zodat het getal bij de hoogste waarde niet over de titel valt.
      ty = top + 12,
      mt = top + (axis ? 20 : 0) + (vals ? (axis ? 22 : 14) : 6),
      pw = n * u,
      scale = (a, b) => (v) => mt + ((b - Math.min(b, Math.max(a, v))) / (b - a)) * h,
      Y = scale(lo, hi),
      yB = Y(lo) + (brk ? 18 : 0),
      X = (j) => ml + u / 2 + (at ? ((at[j] - at[0]) / (at[n - 1] - at[0])) * (n - 1) : j) * u,
      legend = S.length > 1 ? (stack ? [...S].reverse() : S) : [],
      lg = yB + (xn ? 42 : 22);
    // De tweede as rechts, met eigen getallen. Een reeks met ax: 2 hoort daarbij.
    const R = y2 && {
      axis: axisName(y2.yn, y2.unit),
      lo: y2.yr[0],
      hi: y2.yr[1],
      step: y2.ys || niceStep(y2.yr[1] - y2.yr[0]),
      x: ml + pw + 8,
    };
    const ticks2 = [];
    if (R) {
      for (let k = 0; R.lo + k * R.step <= R.hi + 1e-9; k++) ticks2.push(rd(R.lo + k * R.step, 6));
      R.Y = scale(R.lo, R.hi);
    }
    const YS = (s) => (R && s.ax === 2 ? R.Y : Y),
      side = (s) => (R ? ` (as ${s.ax === 2 ? 'rechts' : 'links'})` : ''),
      mr = R ? 14 + 7 * Math.max(...ticks2.map((t) => num(t).length)) : 8;
    W = Math.max(
      ml + pw + 8 + mr,
      (axis.length + 2) * 7 + (R ? (R.axis.length + 2) * 7 : 0),
      title.length * 9.5 + 16,
    );
    H = lg + 18 * legend.length + (legend.length ? 6 : 0);
    for (const t of ticks)
      o += `<line class="gl" x1="${ml}" x2="${ml + pw}" y1="${f1(Y(t))}" y2="${f1(Y(t))}"/>${txt(ml - 6, Y(t) + 4, num(t), 'tk', 'end')}`;
    // Een onderbroken as begint bij 0 en springt met een zigzag naar het eerste getal.
    const zig = brk ? `V${f1(Y(lo) + 1)}l5 3l-10 6l10 6l-5 2` : '';
    o += `<path class="ax" d="M${ml} ${mt - 8}${zig}V${f1(yB)}H${ml + pw + 8}"/>`;
    if (brk) o += txt(ml - 6, yB + 4, '0', 'tk', 'end');
    cats.forEach((c, j) => (o += txt(X(j), yB + 17, c)));
    if (xn) o += txt(ml + pw / 2, yB + 37, xn);
    if (axis) o += txt(4, ty, axis, 'tc', 'start');
    if (R) {
      o += `<path class="ax" d="M${R.x} ${mt - 8}V${f1(yB)}${ticks2.map((t) => `M${R.x} ${f1(R.Y(t))}h4`).join('')}"/>`;
      for (const t of ticks2) o += txt(R.x + 7, R.Y(t) + 4, num(t), 'tk', 'start');
      if (R.axis) o += txt(W - 4, ty, R.axis, 'tc', 'end');
    }
    // Met grow is de breedste staaf die van het grootste getal.
    const most = Math.max(...tops),
      bw = (v) => (grow ? (u * 0.9 * v) / most : u * 0.6);
    if (kind === 'lijn')
      S.forEach((s, i) => {
        const Ys = YS(s);
        o += `<path class="ln c${s.c}" d="M${s.values.map((v, j) => `${f1(X(j))} ${f1(Ys(v))}`).join('L')}"/>`;
        s.values.forEach((v, j) => {
          o += mark(i, X(j), Ys(v), s.c);
          // Ligt een andere lijn hier hoger, dan staat het getal onder het punt.
          const under = S.some((t) => t !== s && YS(t)(t.values[j]) < Ys(v));
          if (vals) o += txt(X(j), Ys(v) + (under ? 18 : -8), num(v));
        });
      });
    else
      cats.forEach((_, j) => {
        let base = 0;
        S.forEach((s) => {
          const v = s.values[j],
            y0 = base ? Y(base) : yB,
            y1 = Y(base + v);
          o += `<rect class="st c${s.c}" x="${f1(X(j) - bw(v) / 2)}" y="${f1(y1)}" width="${f1(bw(v))}" height="${f1(y0 - y1)}"/>`;
          if (vals && (!stack || y0 - y1 >= 16))
            o += txt(X(j), stack ? (y0 + y1) / 2 + 5 : y1 - 5, num(v));
          if (stack) base += v;
        });
      });
    legend.forEach((s, k) => {
      const y = lg + 12 + 18 * k,
        i = S.indexOf(s);
      o +=
        (kind === 'lijn'
          ? `<path class="ln c${s.c}" d="M${ml} ${y}h22"/>${mark(i, ml + 11, y, s.c)}`
          : `<rect class="st c${s.c}" x="${ml + 4}" y="${y - 6}" width="14" height="12"/>`) +
        txt(ml + 30, y + 5, s.name + side(s), 'tc', 'start');
    });
    const left = R ? ' links' : '';
    if (xn) out.push(`Langs de horizontale as: ${xn}.`);
    if (axis) out.push(`Langs de verticale as${left}: ${axis}.`);
    if (R?.axis) out.push(`Langs de verticale as rechts: ${R.axis}.`);
    out.push(
      `De verticale as${left} ${brk ? 'begint bij 0, is onderbroken en loopt verder' : 'loopt'} van ${num(lo)} tot ${num(hi)}, in stappen van ${num(step)}.`,
    );
    if (R)
      out.push(
        `De verticale as rechts loopt van ${num(R.lo)} tot ${num(R.hi)}, in stappen van ${num(R.step)}.`,
      );
    // Jaartallen met verschillende stappen op gelijke afstand: dat moet je ook zonder figuur weten.
    const gaps = cats.slice(1).map((c, j) => +c - +cats[j]);
    if (kind === 'lijn' && !at && gaps.every(Number.isFinite) && new Set(gaps).size > 1)
      out.push('De punten staan op gelijke afstand van elkaar.');
    if (kind === 'staaf') out.push(`De staven: ${list(S[0].values)}.`);
    if (grow) out.push('De staven zijn niet even breed: hoe hoger de staaf, hoe breder.');
    if (stack) {
      out.push(`Elke staaf bestaat van onder naar boven uit ${and(S.map((s) => s.name))}.`);
      cats.forEach((c, j) =>
        out.push(`${cap(c)}: ${and(S.map((s) => `${s.name} ${vu(s.values[j])}`))}.`),
      );
    }
    if (kind === 'lijn')
      S.forEach((s, i) =>
        out.push(
          `${S.length > 1 ? `De lijn van ${s.name}${side(s)}, met ${SHAPES[i % 3]}` : 'De punten van de lijn'}: ${list(s.values)}.`,
        ),
      );
  }
  if (title) o = txt(W / 2, 20, title, 'tt') + o;
  W = Math.ceil(W);
  H = Math.ceil(H);
  return `<svg class="fig" role="img" aria-label="${attr(out.join(' '))}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${o}</svg>`;
}

export { graph, drawnHTML, drawnResult, triFromSides, xf, geo, angleFig, rightTriFig, chart };
