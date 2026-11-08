// Tekent figuren als SVG-tekst: grafieken, driehoeken en evenwijdige lijnen.
import { pick } from './math.js';
import { esc } from './typeset.js';

function graph({
  xr = [-1, 6],
  yr = [-5, 6],
  lines = [],
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
  pts.forEach((p) => {
    o += `<circle class="dot" cx="${X(p.x / xs)}" cy="${Y(p.y / ys)}" r="3.6"/>`;
    if (p.label)
      o += `<text class="ti" x="${X(p.x / xs) + (p.off ? p.off[0] : 7)}" y="${Y(p.y / ys) + (p.off ? p.off[1] : -7)}">${p.label}</text>`;
  });
  const drawing = draw ? `${inside(' class="drawn"')}</svg>` : '',
    drawData = draw ? ` data-draw="${[...xr, ...yr, u, ml, mt].join(',')}"` : '';
  return `<svg class="fig" role="img" aria-label="${label}"${drawData} width="${W}" height="${Ht}" viewBox="0 0 ${W} ${Ht}">${o}${typeof extra === 'function' ? extra(X, Y) : extra}${drawing}</svg>`;
}
// Tekent punten en de lijn erdoor in een rooster om zelf in te tekenen. data is de inhoud van
// data-draw, zodat alles op dezelfde plek komt als in het rooster zelf.
function drawnHTML(data, pts, { cls = 'l1', dots = true } = {}) {
  const [x0, , , y1, u, ml, mt] = data.split(',').map(Number),
    X = (x) => ml + (x - x0) * u,
    Y = (y) => mt + (y1 - y) * u,
    given = pts.filter((p) => p.every(Number.isFinite));
  let o = '';
  if (given.length === 2 && (given[0][0] !== given[1][0] || given[0][1] !== given[1][1])) {
    // Ver buiten het rooster doortrekken: de rand van het rooster snijdt de lijn af.
    const [[a, b], [c, e]] = given,
      far = 100,
      dx = c - a,
      dy = e - b;
    o += `<line class="${cls}" x1="${X(a - dx * far)}" y1="${Y(b - dy * far)}" x2="${X(a + dx * far)}" y2="${Y(b + dy * far)}"/>`;
  }
  if (dots)
    given.forEach(([x, y]) => (o += `<circle class="dot" cx="${X(x)}" cy="${Y(y)}" r="5"/>`));
  return o;
}
// Het rooster van een tekenvraag in de uitslag: de lijn van de leerling, en bij een fout ook de
// goede lijn y = ax + b. Op dit rooster kun je niet meer tikken. Een proeftoets die nog uit
// versie 1.6.0 in de browser staat, heeft een <g class="drawn"> in plaats van een svg.
function drawnResult(fig, pts, line, ok) {
  const data = fig.match(/ data-draw="([^"]+)"/)[1],
    [x0, x1] = data.split(',').map(Number),
    good = ok
      ? ''
      : drawnHTML(
          data,
          [x0, x1].map((x) => [x, line.a * x + line.b]),
          { cls: 'l2 d', dots: false },
        ),
    label = ok ? 'Rooster met jouw lijn' : 'Rooster met jouw lijn en de goede lijn';
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
  return `<svg class="fig" role="img" aria-label="Meetkundige figuur met lengtes en hoeken" width="${W.toFixed(0)}" height="${Ht.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${Ht.toFixed(0)}">${o}</svg>`;
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
  return `<svg class="fig" role="img" aria-label="Twee evenwijdige lijnen met een snijlijn en twee gemarkeerde hoeken" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}">
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

export { graph, drawnHTML, drawnResult, triFromSides, xf, geo, angleFig, rightTriFig };
