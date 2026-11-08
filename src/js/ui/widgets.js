// Interactieve onderdelen in de uitleg: schuifjes en hoekendemo. widgetHTML geeft de begintoestand
// als HTML, zodat die ook in de vooraf gebouwde pagina staat. mountWidgets koppelt de knoppen.
import { graph, triFromSides, angleFig } from '../figures.js';
import { Q, d, lin } from '../math.js';
import { T, vt } from '../typeset.js';
import { app } from './state.js';

// Een widget die al gekoppeld is, blijft dat zolang het element bestaat.
const mounted = new WeakSet();
function mountWidgets() {
  app.querySelectorAll('[data-widget]').forEach((el) => {
    if (mounted.has(el)) return;
    mounted.add(el);
    WIDGETS[el.dataset.widget].mount(el);
  });
}
const widgetHTML = (name) => WIDGETS[name].html();

// De delen van de helling-widget die meeveranderen met a en b.
function slopeParts(a, b) {
  const aq = Q(a * 2, 2);
  return {
    f: T(`y = ${lin(aq, b)}`),
    al: T(`a = ${d(a)}`),
    bl: T(`b = ${b}`),
    g: graph({
      xr: [-4, 4],
      yr: [-5, 6],
      u: 22,
      lines: [{ a, b }],
      pts: [{ x: 0, y: b }],
      extra: (X, Y) => (a ? `<path class="tp" d="M${X(0)} ${Y(b)}H${X(1)}V${Y(b + a)}"/>` : ''),
    }),
  };
}
const slope = {
  html() {
    const p = slopeParts(1, 2);
    return `<div class="wid"><div class="ctl"><div class="readout" id="sl-f">${p.f}</div><label for="sl-a"><span id="sl-al">${p.al}</span><input id="sl-a" type="range" min="-3" max="3" step="0.5" value="1"></label><label for="sl-b"><span id="sl-bl">${p.bl}</span><input id="sl-b" type="range" min="-4" max="5" step="1" value="2"></label><p class="small muted">Schuif en kijk hoe de lijn verandert. Het oranje driehoekje laat zien: 1 naar rechts, a omhoog of omlaag.</p></div><div id="sl-g">${p.g}</div></div>`;
  },
  mount(el) {
    const draw = () => {
      const p = slopeParts(+el.querySelector('#sl-a').value, +el.querySelector('#sl-b').value);
      el.querySelector('#sl-f').innerHTML = p.f;
      el.querySelector('#sl-al').innerHTML = p.al;
      el.querySelector('#sl-bl').innerHTML = p.bl;
      el.querySelector('#sl-g').innerHTML = p.g;
    };
    el.querySelector('#sl-a').addEventListener('input', draw);
    el.querySelector('#sl-b').addEventListener('input', draw);
  },
};

const SIDES = [4, 5, 6];
function scaleParts(k) {
  const t = triFromSides(SIDES[0], SIDES[1], SIDES[2]),
    gap = 7.5,
    W = [t.A, t.B, t.C].map((p) => [p[0] * k + gap, p[1] * k]);
  return {
    l: T(`Vergrotingsfactor ${d(k)}`),
    t:
      vt(['AB', 'BC', 'AC'], ['DE', 'EF', 'DF']) +
      T(' = ') +
      vt(['4', '5', '6'], [d(4 * k), d(5 * k), d(6 * k)]),
    g: `<svg class="fig" width="300" height="218" viewBox="0 0 300 218" role="img" aria-label="Twee gelijkvormige driehoeken">${geoInner(t, W)}</svg>`,
  };
}
const scale = {
  html() {
    const p = scaleParts(1.5);
    return `<div class="wid"><div class="ctl"><label for="sc-k"><span id="sc-l">${p.l}</span><input id="sc-k" type="range" min="0.5" max="2.5" step="0.25" value="1.5"></label><div id="sc-t">${p.t}</div><p class="small muted">De hoeken blijven gelijk. De zijden worden allemaal met hetzelfde getal vermenigvuldigd.</p></div><div id="sc-g">${p.g}</div></div>`;
  },
  mount(el) {
    el.querySelector('#sc-k').addEventListener('input', (e) => {
      const p = scaleParts(+e.target.value);
      el.querySelector('#sc-l').innerHTML = p.l;
      el.querySelector('#sc-t').innerHTML = p.t;
      el.querySelector('#sc-g').innerHTML = p.g;
    });
  },
};
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

// Bij elke keuze een andere hoek, behalve bij het begin: dat staat ook in de vooraf gebouwde pagina.
const ANGLES = {
  F: [
    'F-hoeken',
    'Zelfde plek bij twee verschillende snijpunten.',
    (deg) => angleFig(0, 0, 0, 1, undefined, deg),
  ],
  Z: [
    'Z-hoeken',
    'Tussen de evenwijdige lijnen, aan weerskanten van de snijlijn.',
    (deg) => angleFig(2, 0, 0, 1, undefined, deg),
  ],
  O: [
    'Overstaande hoeken',
    'Bij hetzelfde snijpunt, recht tegenover elkaar. Hiervoor zijn geen evenwijdige lijnen nodig.',
    (deg) => angleFig(0, 0, 2, 0, undefined, deg),
  ],
};
const anglesHTML = (cur, deg) =>
  `<div class="wid"><div class="ctl"><div class="chips">${Object.entries(ANGLES)
    .map(
      ([k, v]) =>
        `<button class="chip" type="button" data-k="${k}" aria-pressed="${k === cur}">${v[0]}</button>`,
    )
    .join('')}</div><p>${ANGLES[cur][1]}</p></div><div>${ANGLES[cur][2](deg)}</div></div>`;
const angles = {
  html: () => anglesHTML('F', 65),
  mount(el) {
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      el.innerHTML = anglesHTML(b.dataset.k);
      el.querySelector(`[data-k="${b.dataset.k}"]`).focus();
    });
  },
};

const WIDGETS = { slope, scale, angles };

export { mountWidgets, widgetHTML };
