// Figuren met cirkels: cirkels, een gekleurde cirkelboog, rechthoeken, lijnstukken, punten met een
// naam en lengtes. Dit staat niet in figures.js, want dat laadt bij het eerste bezoek van elke pagina
// mee. Alleen het onderwerp Cirkel gebruikt dit, dus het komt in de code van dat onderwerp.
import { esc } from './typeset.js';
import { attr } from './figures.js';

// Alle maten in cm, met y omhoog. Opties:
//  - circles: [{ c: [x, y], r }]
//  - arcs: [{ c: [x, y], r, from, to }], een gekleurde cirkelboog tegen de klok in, van de hoek from
//    naar de hoek to, in graden.
//  - rects: [[x0, y0, x1, y1]]
//  - lines: [[[x, y], [x, y]]], lijnstukken.
//  - dots: [[x, y]], stippen, zoals voor een middelpunt.
//  - names: [{ at: [x, y], t: 'M', from: [x, y], off: [dx, dy] }], de naam van een punt. Die staat
//    16 pixels van from af, of op off in pixels.
//  - lengths: [{ at: [x, y], t: '3 cm', off: [dx, dy] }], een lengte bij at, op off in pixels.
//  - desc: de beschrijving voor een schermlezer, met alle namen en lengtes erin (zie #55).
function cirkelFig({
  circles = [],
  arcs = [],
  rects = [],
  lines = [],
  dots = [],
  names = [],
  lengths = [],
  desc,
  w = 300,
  maxH = 220,
  pad = 30,
}) {
  const xs = [],
    ys = [];
  circles.forEach(({ c, r }) => {
    xs.push(c[0] - r, c[0] + r);
    ys.push(c[1] - r, c[1] + r);
  });
  rects.forEach(([a, b, c, e]) => {
    xs.push(a, c);
    ys.push(b, e);
  });
  [...lines.flat(), ...dots, ...names.map((n) => n.at)].forEach(([x, y]) => {
    xs.push(x);
    ys.push(y);
  });
  const x0 = Math.min(...xs),
    y0 = Math.min(...ys),
    dx = Math.max(...xs) - x0 || 1,
    dy = Math.max(...ys) - y0 || 1,
    s = Math.min((w - 2 * pad) / dx, (maxH - 2 * pad) / dy),
    W = dx * s + 2 * pad,
    Ht = dy * s + 2 * pad,
    X = (x) => (x - x0) * s + pad,
    Y = (y) => Ht - ((y - y0) * s + pad),
    r1 = (n) => n.toFixed(1);
  let o = '';
  rects.forEach(([a, b, c, e]) => {
    o += `<rect class="s" x="${r1(X(a))}" y="${r1(Y(e))}" width="${r1((c - a) * s)}" height="${r1((e - b) * s)}"/>`;
  });
  circles.forEach(({ c, r }) => {
    o += `<circle class="s" cx="${r1(X(c[0]))}" cy="${r1(Y(c[1]))}" r="${r1(r * s)}"/>`;
  });
  arcs.forEach(({ c, r, from, to }) => {
    const rad = (g) => (g * Math.PI) / 180,
      at = (g) => `${r1(X(c[0] + r * Math.cos(rad(g))))} ${r1(Y(c[1] + r * Math.sin(rad(g))))}`,
      span = (((to - from) % 360) + 360) % 360;
    // In de figuur staat y omlaag, dus tegen de klok in is sweep 0.
    o += `<path class="l1" d="M${at(from)}A${r1(r * s)} ${r1(r * s)} 0 ${span > 180 ? 1 : 0} 0 ${at(to)}"/>`;
  });
  lines.forEach(([p, q]) => {
    o += `<line class="s" x1="${r1(X(p[0]))}" y1="${r1(Y(p[1]))}" x2="${r1(X(q[0]))}" y2="${r1(Y(q[1]))}"/>`;
  });
  dots.forEach(
    ([x, y]) => (o += `<circle class="dot" cx="${r1(X(x))}" cy="${r1(Y(y))}" r="3.6"/>`),
  );
  names.forEach(({ at, t, from, off }) => {
    let [ox, oy] = off || [0, 0];
    if (!off && from) {
      const ux = at[0] - from[0],
        uy = -(at[1] - from[1]),
        n = Math.hypot(ux, uy) || 1;
      [ox, oy] = [(ux / n) * 16, (uy / n) * 16];
    }
    o += `<text class="ti" text-anchor="middle" x="${r1(X(at[0]) + ox)}" y="${r1(Y(at[1]) + oy + 5)}">${esc(t)}</text>`;
  });
  lengths.forEach(({ at, t, off = [0, 0] }) => {
    o += `<text class="tv" text-anchor="middle" x="${r1(X(at[0]) + off[0])}" y="${r1(Y(at[1]) + off[1] + 5)}">${esc(t)}</text>`;
  });
  return `<svg class="fig" role="img" aria-label="${attr(desc)}" width="${W.toFixed(0)}" height="${Ht.toFixed(0)}" viewBox="0 0 ${W.toFixed(0)} ${Ht.toFixed(0)}">${o}</svg>`;
}

export { cirkelFig };
