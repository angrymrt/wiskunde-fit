// Een lijn tekenen in een rooster. Tik je twee punten aan of typ je de coördinaten, dan komen die
// in dezelfde invoervelden terecht. Zo werkt de vraag ook met het toetsenbord en een schermlezer.
import { parseNum } from '../answers.js';
import { app } from './state.js';

function drawParts() {
  const svg = app.querySelector('svg[data-draw]'),
    form = app.querySelector('#pform, #tform');
  if (!svg || !form) return null;
  const [x0, x1, y0, y1, u, ml, mt] = svg.dataset.draw.split(',').map(Number);
  return { svg, inputs: [...form.querySelectorAll('.fld input')], x0, x1, y0, y1, u, ml, mt };
}
function showDrawn() {
  const g = drawParts();
  if (!g) return;
  const X = (x) => g.ml + (x - g.x0) * g.u,
    Y = (y) => g.mt + (g.y1 - y) * g.u,
    [a, b, c, e] = g.inputs.map((i) => parseNum(i.value)),
    pts = [
      [a, b],
      [c, e],
    ].filter((p) => p.every(Number.isFinite));
  let o = '';
  if (pts.length === 2 && (a !== c || b !== e)) {
    // Ver buiten het rooster doortrekken: de clipPath snijdt de lijn af.
    const far = 100,
      dx = c - a,
      dy = e - b;
    o += `<line class="l1" x1="${X(a - dx * far)}" y1="${Y(b - dy * far)}" x2="${X(a + dx * far)}" y2="${Y(b + dy * far)}"/>`;
  }
  pts.forEach(([x, y]) => {
    o += `<circle class="dot" cx="${X(x)}" cy="${Y(y)}" r="5"/>`;
  });
  g.svg.querySelector('.drawn').innerHTML = o;
}
// Een tik vult het eerste lege punt. Zijn beide punten bezet, dan vervalt het oudste.
// Tik je op een gekozen punt, dan haal je het weg.
function tapGrid(svg, e) {
  const g = drawParts();
  if (!g || g.svg !== svg || g.inputs[0].disabled) return;
  const r = svg.getBoundingClientRect(),
    vb = svg.viewBox.baseVal,
    sx = ((e.clientX - r.left) * vb.width) / r.width,
    sy = ((e.clientY - r.top) * vb.height) / r.height,
    x = Math.min(g.x1, Math.max(g.x0, Math.round((sx - g.ml) / g.u + g.x0))),
    y = Math.min(g.y1, Math.max(g.y0, Math.round(g.y1 - (sy - g.mt) / g.u))),
    [i0, i1, i2, i3] = g.inputs,
    set = (ix, iy, vx, vy) => {
      ix.value = vx;
      iy.value = vy;
    },
    hit = (ix, iy) => parseNum(ix.value) === x && parseNum(iy.value) === y,
    blank = (ix, iy) => !ix.value.trim() || !iy.value.trim();
  if (hit(i0, i1)) set(i0, i1, '', '');
  else if (hit(i2, i3)) set(i2, i3, '', '');
  else if (blank(i0, i1)) set(i0, i1, x, y);
  else if (blank(i2, i3)) set(i2, i3, x, y);
  else {
    set(i0, i1, i2.value, i3.value);
    set(i2, i3, x, y);
  }
  showDrawn();
}

export { showDrawn, tapGrid };
