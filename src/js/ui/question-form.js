// Invoervelden van een vraag tekenen en uitlezen, voor oefenen en proeftoets.
import { parseNum } from '../answers.js';
import { pathFor } from '../routes.js';
import { topicOf } from '../stof.js';
import { esc, T } from '../typeset.js';
import { app, state } from './state.js';

function fieldsHTML(q, pfx, vals = [], marks = null, locked = false) {
  // Keuzes met een figuur, zoals schetsen van een grafiek, staan naast elkaar zolang ze passen. De
  // beschrijving van de figuur is de naam van de keuze voor een schermlezer.
  if (q.mc)
    return `<div class="opts${q.mc.opts.some((o) => /^<svg/.test(o)) ? ' figs' : ''}" role="radiogroup" aria-labelledby="${pfx}q">${q.mc.opts.map((o, i) => `<label class="opt ${marks ? (i === q.mc.a && marks.reveal ? 'ok' : String(vals[0]) === String(i) ? (marks.each[0] ? 'ok' : 'no') : '') : ''}"><input type="radio" name="${pfx}mc" id="${pfx}m${i}" value="${i}" ${String(vals[0]) === String(i) ? 'checked' : ''} ${locked ? 'disabled' : ''}><span>${o}</span></label>`).join('')}</div>`;
  return `<div class="fields${q.compact ? ' compact' : ''}">${q.fields
    .map((f, i) => {
      const cl = marks ? (marks.each[i] ? 'ok' : 'no') : '',
        br = f.br ? '<span class="fbreak"></span>' : '';
      if (f.sel)
        return `${br}<label class="fld ${cl}">${f.pre ? `<span>${T(f.pre)}</span>` : ''}<select id="${pfx}f${i}" aria-label="${f.label || 'Kies het teken'}" aria-describedby="${pfx}q" ${locked ? 'disabled' : ''}><option value="">kies</option>${f.sel.map((o) => `<option ${vals[i] === o ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
      return `${br}<label class="fld ${cl}">${f.pre ? `<span>${T(f.pre)}</span>` : ''}<input id="${pfx}f${i}" type="text" inputmode="text" autocomplete="off" ${f.label ? `aria-label="${f.label}"` : f.pre ? '' : `aria-label="Antwoord ${i + 1}"`} aria-describedby="${pfx}q" value="${esc(vals[i] ?? '').replace(/"/g, '&quot;')}" ${locked ? 'disabled' : ''}>${f.post ? `<span>${T(f.post)}</span>` : ''}</label>`;
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

// De knop om een vraag te delen, bijvoorbeeld om hulp te vragen aan een docent of een andere
// leerling. De link wijst naar precies deze vraag, met de vraagsoort en de seed, op het oefenscherm
// van het onderwerp. Antwoorden en voortgang gaan niet mee. Een vraag uit een oude proeftoets heeft
// geen seed, en die kun je dus niet delen. De melding staat er altijd, ook leeg, zodat een
// schermlezer hem voorleest zodra er iets in komt.
const SHARE_ICON =
  '<svg class="icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M8 10V2.5M5 5.2 8 2.2l3 3M4.5 7.5H3.5v6h9v-6h-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
const CHECK_ICON =
  '<svg class="icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
function shareHTML(skill, q) {
  const topic = topicOf(skill.id);
  if (q.seed === undefined || !topic) return { button: '', note: '' };
  const path = pathFor({
    name: 'topic',
    slug: topic.slug,
    oefen: true,
    soort: skill.id,
    seed: q.seed,
  });
  const done = state.shared?.path === path ? state.shared : null;
  const text = !done
    ? ''
    : done.copied
      ? 'Link gekopieerd.'
      : 'Kopiëren lukte niet. Kopieer de link hieronder zelf.';
  const link =
    done && !done.copied
      ? `<label class="small share-link">Link naar deze vraag <input type="text" readonly value="${esc(done.url)}"></label>`
      : '';
  // Na het kopiëren zegt de knop dat ook, tot je naar een andere vraag gaat.
  const label = done?.copied
    ? `${CHECK_ICON}Gekopieerd`
    : `${SHARE_ICON}Deel<span class="sr"> deze vraag</span>`;
  return {
    button: `<button class="btn quiet share${done?.copied ? ' copied' : ''}" type="button" data-act="share" data-id="${esc(path)}">${label}</button>`,
    // De knop zegt al Gekopieerd. Een schermlezer hoort dat niet vanzelf, dus daarvoor staat de
    // melding er wel, maar onzichtbaar.
    note: `<p class="small share-note${done?.copied ? ' sr' : ''}" role="status">${text}</p>${link}`,
  };
}

export { fieldsHTML, readVals, unreadable, empty, shareHTML };
