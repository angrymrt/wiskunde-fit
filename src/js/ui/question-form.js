// Invoervelden van een vraag tekenen en uitlezen, voor oefenen en proeftoets.
import { parseNum } from '../answers.js';
import { esc, T } from '../typeset.js';
import { app } from './state.js';

function fieldsHTML(q, pfx, vals = [], marks = null, locked = false) {
  if (q.mc)
    return `<div class="opts" role="radiogroup" aria-labelledby="${pfx}q">${q.mc.opts.map((o, i) => `<label class="opt ${marks ? (i === q.mc.a && marks.reveal ? 'ok' : String(vals[0]) === String(i) ? (marks.each[0] ? 'ok' : 'no') : '') : ''}"><input type="radio" name="${pfx}mc" id="${pfx}m${i}" value="${i}" ${String(vals[0]) === String(i) ? 'checked' : ''} ${locked ? 'disabled' : ''}><span>${o}</span></label>`).join('')}</div>`;
  return `<div class="fields">${q.fields
    .map((f, i) => {
      const cl = marks ? (marks.each[i] ? 'ok' : 'no') : '';
      if (f.sel)
        return `<label class="fld ${cl}">${f.pre ? `<span>${T(f.pre)}</span>` : ''}<select id="${pfx}f${i}" aria-label="Kies het teken" aria-describedby="${pfx}q" ${locked ? 'disabled' : ''}><option value="">kies</option>${f.sel.map((o) => `<option ${vals[i] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
      return `<label class="fld ${cl}">${f.pre ? `<span>${T(f.pre)}</span>` : ''}<input id="${pfx}f${i}" type="text" inputmode="text" autocomplete="off" ${f.pre ? '' : `aria-label="Antwoord ${i + 1}"`} aria-describedby="${pfx}q" value="${esc(vals[i] ?? '').replace(/"/g, '&quot;')}" ${locked ? 'disabled' : ''}>${f.post ? `<span>${T(f.post)}</span>` : ''}</label>`;
    })
    .join('')}</div>`;
}
function readVals(q, pfx) {
  if (q.mc) {
    const c = app.querySelector(`input[name="${pfx}mc"]:checked`);
    return [c ? c.value : ''];
  }
  return q.fields.map((f, i) => {
    const el = document.getElementById(pfx + 'f' + i);
    return el ? el.value : '';
  });
}
const unreadable = (q, vals) =>
  !q.mc && q.fields.some((f, i) => !f.sel && vals[i].trim() && Number.isNaN(parseNum(vals[i])));
const empty = (q, vals) =>
  q.mc ? vals[0] === '' : q.fields.some((f, i) => !String(vals[i]).trim());

export { fieldsHTML, readVals, unreadable, empty };
