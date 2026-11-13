// Een lijn of parabool tekenen in een rooster. Tik je punten aan of typ je de coördinaten, dan komen
// die in dezelfde invoervelden terecht. Zo werkt de vraag ook met het toetsenbord en een schermlezer.
// Elk punt heeft twee velden, x en y: een lijn heeft er twee, een parabool drie, met de top eerst.
import { parseNum } from '../answers.js';
import { drawnHTML } from '../figures.js';
import { app } from './state.js';

function drawParts() {
  const svg = app.querySelector('svg[data-draw]'),
    form = app.querySelector('#pform, #tform');
  if (!svg || !form) return null;
  const [x0, x1, y0, y1, u, ml, mt] = svg.dataset.draw.split(',').map(Number),
    inputs = [...form.querySelectorAll('.fld input')],
    pairs = [];
  for (let i = 0; i + 1 < inputs.length; i += 2) pairs.push([inputs[i], inputs[i + 1]]);
  return { svg, inputs, pairs, x0, x1, y0, y1, u, ml, mt };
}
function showDrawn() {
  const g = drawParts();
  if (!g) return;
  g.svg.querySelector('.drawn').innerHTML = drawnHTML(
    g.svg.dataset.draw,
    g.pairs.map(([ix, iy]) => [parseNum(ix.value), parseNum(iy.value)]),
  );
}
// Een tik vult het eerste lege punt. Tik je op een gekozen punt, dan haal je het weg. Zijn alle
// punten bezet, dan vervalt het oudste. Bij een parabool blijft de top staan: dan vervalt het
// oudste punt na de top.
function tapGrid(svg, e) {
  const g = drawParts();
  if (!g || g.svg !== svg || g.inputs[0].disabled) return;
  const r = svg.getBoundingClientRect(),
    vb = svg.viewBox.baseVal,
    sx = ((e.clientX - r.left) * vb.width) / r.width,
    sy = ((e.clientY - r.top) * vb.height) / r.height,
    x = Math.min(g.x1, Math.max(g.x0, Math.round((sx - g.ml) / g.u + g.x0))),
    y = Math.min(g.y1, Math.max(g.y0, Math.round(g.y1 - (sy - g.mt) / g.u))),
    set = ([ix, iy], vx, vy) => {
      ix.value = vx;
      iy.value = vy;
    },
    hit = g.pairs.find(([ix, iy]) => parseNum(ix.value) === x && parseNum(iy.value) === y),
    blank = g.pairs.find(([ix, iy]) => !ix.value.trim() || !iy.value.trim());
  if (hit) set(hit, '', '');
  else if (blank) set(blank, x, y);
  else {
    const keep = g.pairs.length > 2 ? 1 : 0;
    for (let i = keep; i + 1 < g.pairs.length; i++)
      set(g.pairs[i], g.pairs[i + 1][0].value, g.pairs[i + 1][1].value);
    set(g.pairs[g.pairs.length - 1], x, y);
  }
  showDrawn();
}

export { showDrawn, tapGrid };
