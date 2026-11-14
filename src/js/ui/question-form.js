// Invoervelden van een vraag tekenen en uitlezen, voor oefenen en proeftoets.
import { parseNum } from '../answers.js';
import { pathFor } from '../routes.js';
import { topicOf } from '../stof.js';
import { esc, T } from '../typeset.js';
import { githubLink, mailLink, MAX_TEKST, melding, WAT } from './melden.js';
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
      const input = `<input id="${pfx}f${i}" type="text" inputmode="text" autocomplete="off" ${f.label ? `aria-label="${f.label}"` : f.pre ? '' : `aria-label="Antwoord ${i + 1}"`} aria-describedby="${pfx}q" value="${esc(vals[i] ?? '').replace(/"/g, '&quot;')}" ${locked ? 'disabled' : ''}>`;
      // Het veld en de eenheid erachter blijven bij elkaar als het veld op een smal scherm onder
      // de tekst ervoor komt te staan.
      return `${br}<label class="fld ${cl}">${f.pre ? `<span>${T(f.pre)}</span>` : ''}${f.post ? `<span class="fin">${input}<span>${T(f.post)}</span></span>` : input}</label>`;
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

// De knop om een probleem bij een vraag te melden, en het paneel dat daarvan van rechts opent. De
// leerling kiest wat er aan de hand is en verstuurt het dan zelf, zie melden.js. Het paneel staat
// los van de vraag, want een vraag die net verschijnt beweegt even en dan klopt een vaste plek
// niet meer. Een vraag uit een oude proeftoets heeft geen seed, en daar valt dus niets te melden.
const FLAG_ICON =
  '<svg class="icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M3.5 14V2.5h8l-1.6 3 1.6 3h-8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
// Onder in het paneel: wat er nog mist, en de twee manieren om te versturen. Zolang er niets gekozen
// is, zijn het knoppen die niets doen. Daarna zijn het links met alles al ingevuld.
function meldVoetHTML(m) {
  const gh = m
    ? `<a class="btn main" id="meldgh" href="${esc(githubLink(m))}" target="_blank" rel="noopener">Via GitHub</a>`
    : '<button class="btn main" type="button" disabled>Via GitHub</button>';
  const mail = m
    ? `<a class="btn" id="meldmail" href="${esc(mailLink(m))}">Via e-mail</a>`
    : '<button class="btn" type="button" disabled>Via e-mail</button>';
  return `<p class="small melden-hulp" role="status">${m ? '' : 'Kies eerst wat er aan de hand is. Dan kun je het versturen.'}</p>
      <p class="small melden-via"><b>Melden via:</b></p>
      <div class="melden-kies">
        <div class="melden-kanaal">${gh}<p class="small muted">Je hebt een GitHub-account nodig. Je gebruikersnaam staat openbaar bij de melding.</p></div>
        <div class="melden-kanaal">${mail}<p class="small muted">Opent je mailprogramma. Alleen wij zien je mailadres.</p></div>
      </div>`;
}
function meldHTML(skill, q) {
  const topic = topicOf(skill.id);
  if (q.seed === undefined || !topic) return { button: '', panel: '' };
  const path = pathFor({
    name: 'topic',
    slug: topic.slug,
    oefen: true,
    soort: skill.id,
    seed: q.seed,
  });
  const button = `<button class="btn quiet share" type="button" data-act="meld" data-id="${esc(path)}" aria-haspopup="dialog">${FLAG_ICON}Meld een probleem</button>`;
  const open = state.melden?.open && state.melden.path === path ? state.melden : null;
  if (!open) return { button, panel: '' };
  const m = melding({ soort: skill, path, wat: open.wat, tekst: open.tekst });
  const radios = WAT.map(
    ([id, tekst]) =>
      `<label class="opt"><input type="radio" name="meldwat" id="meldwat-${id}" value="${id}" ${open.wat === id ? 'checked' : ''}><span>${esc(tekst)}</span></label>`,
  ).join('');
  const panel = `<div class="melden-back"><button class="melden-gap" type="button" data-act="meldsluit" tabindex="-1" aria-label="Paneel sluiten"></button>
  <section class="melden" id="melden" role="dialog" aria-modal="true" aria-labelledby="meldkop">
    <div class="melden-kop"><h2 class="h3" id="meldkop">Een probleem melden bij deze vraag</h2><button class="btn quiet melden-sluit" type="button" data-act="meldsluit" aria-label="Paneel sluiten">›</button></div>
    <div class="melden-romp">
      <p class="small muted">Zie je iets wat niet klopt, of snap je iets niet? Dan kijken wij ernaar.</p>
      <fieldset class="melden-wat"><legend>Wat is er aan de hand? <span class="muted">(kies er één)</span></legend>${radios}</fieldset>
      <p class="melden-label"><label for="meldtekst"><b>Wil je er iets bij schrijven?</b> <span class="muted">(niet verplicht)</span></label></p>
      <textarea id="meldtekst" maxlength="${MAX_TEKST}" placeholder="Bijvoorbeeld: welk antwoord je verwachtte, of wat je niet snapt.">${esc(open.tekst)}</textarea>
      <p class="small muted melden-count"><span id="meldn">${open.tekst.length}</span> van ${MAX_TEKST} tekens</p>
      <p class="small"><b>Schrijf geen naam of andere gegevens van jezelf.</b> Wat je schrijft, kan openbaar worden.</p>
      <details class="small"><summary>Wat gaat er mee?</summary><p>Alleen een link naar deze vraag (de soort vraag en het nummer van de variant), de versie van de site en wat je zelf hebt gekozen en geschreven. Je antwoorden, je voortgang en gegevens van je toestel gaan niet mee.</p></details>
    </div>
    <div class="melden-voet">${meldVoetHTML(m)}</div>
  </section></div>`;
  return { button, panel };
}

export { fieldsHTML, readVals, unreadable, empty, shareHTML, meldHTML, meldVoetHTML };
