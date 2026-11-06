// Interactieve onderdelen in de uitleg: schuifjes en hoekendemo.
import { graph, triFromSides, angleFig } from '../figures.js';
import { Q, d, lin } from '../math.js';
import { T, vt } from '../typeset.js';
import { app } from './state.js';

function mountWidgets() {
  app.querySelectorAll('[data-widget]').forEach((el) => {
    const w = el.dataset.widget;
    if (w === 'slope') slope(el);
    if (w === 'scale') scale(el);
    if (w === 'angles') angles(el);
  });
}
function slope(el) {
  let a = 1,
    b = 2;
  el.innerHTML = `<div class="wid"><div class="ctl"><div class="readout" id="sl-f"></div><label for="sl-a"><span id="sl-al"></span><input id="sl-a" type="range" min="-3" max="3" step="0.5" value="1"></label><label for="sl-b"><span id="sl-bl"></span><input id="sl-b" type="range" min="-4" max="5" step="1" value="2"></label><p class="small muted">Schuif en kijk hoe de lijn verandert. Het oranje driehoekje laat zien: 1 naar rechts, a omhoog of omlaag.</p></div><div id="sl-g"></div></div>`;
  const draw = () => {
    const aq = Q(a * 2, 2);
    el.querySelector('#sl-f').innerHTML = T(`y = ${lin(aq, b)}`);
    el.querySelector('#sl-al').innerHTML = T(`a = ${d(a)}`);
    el.querySelector('#sl-bl').innerHTML = T(`b = ${b}`);
    el.querySelector('#sl-g').innerHTML = graph({
      xr: [-4, 4],
      yr: [-5, 6],
      u: 22,
      lines: [{ a, b }],
      pts: [{ x: 0, y: b }],
      extra: (X, Y) => (a ? `<path class="tp" d="M${X(0)} ${Y(b)}H${X(1)}V${Y(b + a)}"/>` : ''),
    });
  };
  draw();
  el.querySelector('#sl-a').addEventListener('input', (e) => {
    a = +e.target.value;
    draw();
  });
  el.querySelector('#sl-b').addEventListener('input', (e) => {
    b = +e.target.value;
    draw();
  });
}
function scale(el) {
  let k = 1.5;
  const s = [4, 5, 6];
  el.innerHTML = `<div class="wid"><div class="ctl"><label for="sc-k"><span id="sc-l"></span><input id="sc-k" type="range" min="0.5" max="2.5" step="0.25" value="1.5"></label><div id="sc-t"></div><p class="small muted">De hoeken blijven gelijk. De zijden worden allemaal met hetzelfde getal vermenigvuldigd.</p></div><div id="sc-g"></div></div>`;
  const draw = () => {
    const t = triFromSides(s[0], s[1], s[2]),
      gap = 7.5,
      W = [t.A, t.B, t.C].map((p) => [p[0] * k + gap, p[1] * k]);
    el.querySelector('#sc-l').innerHTML = T(`Vergrotingsfactor ${d(k)}`);
    el.querySelector('#sc-t').innerHTML =
      vt(['AB', 'BC', 'AC'], ['DE', 'EF', 'DF']) +
      T(' = ') +
      vt(['4', '5', '6'], [d(4 * k), d(5 * k), d(6 * k)]);
    el.querySelector('#sc-g').innerHTML =
      `<svg class="fig" width="300" height="218" viewBox="0 0 300 218" role="img" aria-label="Twee gelijkvormige driehoeken">${geoInner(t, W)}</svg>`;
  };
  draw();
  el.querySelector('#sc-k').addEventListener('input', (e) => {
    k = +e.target.value;
    draw();
  });
}
function geoInner(t, W) {
  const sc = 14,
    base = 198,
    X = (p) => 12 + p[0] * sc,
    Y = (p) => base - p[1] * sc;
  const [a, b, c] = [t.A, t.B, t.C],
    [e, f, g] = W;
  const poly = (pts, lb) =>
    `<path class="s" d="M${X(pts[0])} ${Y(pts[0])}L${X(pts[1])} ${Y(pts[1])}L${X(pts[2])} ${Y(pts[2])}Z"/>` +
    pts
      .map(
        (p, i) =>
          `<text class="ti" x="${X(p) + (i === 0 ? -4 : i === 1 ? 4 : 0)}" y="${Y(p) + (i === 2 ? -6 : 14)}" text-anchor="middle">${lb[i]}</text>`,
      )
      .join('');
  return poly([a, b, c], 'ABC') + poly([e, f, g], 'DEF');
}
function angles(el) {
  const K = {
    F: ['F-hoeken', 'Zelfde plek bij twee verschillende snijpunten.', () => angleFig(0, 0, 0, 1)],
    Z: [
      'Z-hoeken',
      'Tussen de evenwijdige lijnen, aan weerskanten van de snijlijn.',
      () => angleFig(2, 0, 0, 1),
    ],
    O: [
      'Overstaande hoeken',
      'Bij hetzelfde snijpunt, recht tegenover elkaar. Hiervoor zijn geen evenwijdige lijnen nodig.',
      () => angleFig(0, 0, 2, 0),
    ],
  };
  let cur = 'F';
  const draw = () => {
    el.innerHTML = `<div class="wid"><div class="ctl"><div class="chips">${Object.entries(K)
      .map(
        ([k, v]) =>
          `<button class="chip" type="button" data-k="${k}" aria-pressed="${k === cur}">${v[0]}</button>`,
      )
      .join('')}</div><p>${K[cur][1]}</p></div><div>${K[cur][2]()}</div></div>`;
    el.querySelectorAll('[data-k]').forEach((b) =>
      b.addEventListener('click', () => {
        cur = b.dataset.k;
        draw();
      }),
    );
  };
  draw();
}

export { mountWidgets };
