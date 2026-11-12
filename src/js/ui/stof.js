// De schermen om stof te kiezen: uit je boek, de paragrafen van een boek, en Mijn stof.
import { FILTERS, MAPPING, MAPPINGS, matches } from '../mappings/index.js';
import { prog, skillPct } from '../progress.js';
import { pathFor, to } from '../routes.js';
import {
  allChosen,
  bookPath,
  chosenTopics,
  isChosen,
  stofFromBook,
  stofGaps,
  stofTopic,
} from '../stof.js';
import { DOMAINS } from '../topics/index.js';
import { esc, T } from '../typeset.js';
import { resultText } from './exam.js';
import { crumbs, pageHead } from './layout.js';
import { state } from './state.js';
import { topicLink, vPractice } from './topic.js';

const mappingName = (m) => `${esc(m.method)}, ${m.edition}e editie, ${esc(m.level)} ${m.year}`;
// Een vinkje voor een groep vraagsoorten. Is maar een deel gekozen, dan zet main.js het vinkje
// half aan (indeterminate), want dat kan niet in HTML.
const checkbox = (act, id, ids) => {
  const on = allChosen(ids),
    mixed = !on && ids.some(isChosen);
  return `<input type="checkbox" data-act="${act}" data-id="${id}" ${on ? 'checked' : ''}${mixed ? ' data-mixed' : ''}>`;
};
const skillNames = (skills) => skills.map((k) => T(k.name)).join(', ');
const list = (items) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} en ${items[items.length - 1]}` : items[0];

// Kies uit je boek: een lijst met boeken en filters, zoals in een webshop, alles in één blok. De
// filters staan in het adres, zoals ?niveau=havo. Zonder JavaScript zie je de hele lijst. Het
// gekozen boek staat bovenaan.
const plural = (n, one, more) => `${n} ${n === 1 ? one : more}`;
const bookKind = (b) => (/FLEX/.test(b.name) ? 'FLEX-boek' : 'leerboek');
function booksText(m) {
  const parts = [...new Set(m.books.map((b) => b.part))];
  const text = `${list(parts)}, ${[...new Set(m.books.map(bookKind))].join(' of ')}`;
  return text[0].toUpperCase() + text.slice(1);
}
function coverageText(m) {
  const paragraphs = m.chapters.flatMap((c) => c.paragraphs);
  const some = paragraphs.filter((p) => p.coverage !== 'niet').length;
  const part = paragraphs.filter((p) => p.coverage === 'deels').length;
  const start = `${some} van de ${paragraphs.length} paragrafen kun je hier`;
  if (!part) return `${start} oefenen.`;
  return part === some ? `${start} deels oefenen.` : `${start} oefenen, ${part} daarvan deels.`;
}
function bookHTML(m) {
  const mine = m.id === prog.mapping;
  const isbns = m.books.map((b) => `<li>${esc(b.part)}, ${bookKind(b)}: ${esc(b.isbn)}</li>`);
  return `<li class="book${mine ? ' mine' : ''}">
  <h2 class="h3">${mine ? '<span class="mine-tag">Mijn boek<span class="sr">: </span></span>' : ''}<a href="${pathFor({ name: 'mapping', id: m.id })}" data-act="kiesgo" data-id="${m.id}">${mappingName(m)}</a></h2>
  <p>${esc(booksText(m))}</p><p class="small">${coverageText(m)}</p>
  <details class="small"><summary>ISBN's</summary><ul>${isbns.join('')}</ul></details></li>`;
}
// Het getal achter een keuze: zoveel boeken zie je als je die keuze erbij zet.
function filterHTML(filter, chosen) {
  const { key, label, options, values, name } = filter;
  const count = (v) =>
    MAPPINGS.filter((m) => matches(m, chosen, key) && values(m).includes(v)).length;
  const option = (v) =>
    `<label class="pick"><input type="checkbox" data-act="boekfilter" data-id="${key}:${esc(v)}"${chosen[key]?.includes(v) ? ' checked' : ''}><span>${esc(name(v))} <span class="muted" aria-hidden="true">(${count(v)})</span><span class="sr">, ${plural(count(v), 'boek', 'boeken')}</span></span></label>`;
  return `<fieldset class="filter"><legend>${label}</legend>${options.map(option).join('')}</fieldset>`;
}
function vPick() {
  const chosen = state.view.filters || {};
  const active = Object.values(chosen).flat().length;
  const found = MAPPINGS.filter((m) => matches(m, chosen)).sort(
    (a, b) => (b.id === prog.mapping) - (a.id === prog.mapping),
  );
  const n = found.length;
  const status = !active
    ? plural(n, 'boek', 'boeken')
    : n
      ? `${plural(n, 'boek past', 'boeken passen')} bij je filters`
      : 'Geen boek past bij je filters';
  const open = state.filtersOpen;
  return `${crumbs()}<div class="sheet">${pageHead('Kies uit je boek', '<p class="lead">Zoek je boek en bekijk wat je daaruit hier kunt oefenen.</p>')}
  <div class="shop">
  <div class="filters needs-js">
  <button class="btn filter-toggle" type="button" data-act="boekfilters" aria-expanded="${open}" aria-controls="filters">Filters${active ? ` (${active})` : ''}</button>
  <div class="filter-panel${open ? ' open' : ''}" id="filters">${FILTERS.map((f) => filterHTML(f, chosen)).join('')}
  <button class="btn main filter-done" type="button" data-act="boekfiltersdone">Toon ${plural(n, 'boek', 'boeken')}</button></div></div>
  <div class="found">
  <div class="row found-count"><p role="status">${status}</p>${active ? '<button class="linkbtn" type="button" data-act="boekfilterclear">Wis filters</button>' : ''}</div>
  ${n ? `<ul class="books">${found.map(bookHTML).join('')}</ul>` : ''}
  <p class="small books-end">Staat je boek er niet bij? <a class="linkbtn" href="${to('stof')}#onderwerp">Kies op onderwerp</a></p></div></div></div>`;
}

function paragraphHTML(p) {
  const label = `<b>${esc(p.number)}</b> ${T(p.description)}`;
  if (p.coverage === 'niet')
    return `<li class="pick off"><span></span><span>${label}<span class="small muted pick-note">Dit kun je hier nog niet oefenen.</span></span></li>`;
  const topics = chosenTopics(p.skills)
    .map((g) => topicLink(g.topic))
    .join(', ');
  const part =
    p.coverage === 'deels'
      ? `<span class="small muted pick-note">Dit kun je hier al oefenen: ${skillNames(chosenTopics(p.skills).flatMap((g) => g.skills))}.${p.note ? ` ${T(p.note)}` : ''}</span>`
      : '';
  return `<li><label class="pick">${checkbox('para', esc(p.number), p.skills)}<span>${label}${part}</span></label><span class="small pick-topics">Onderwerp: ${topics}</span></li>`;
}
function chapterHTML(c) {
  const ids = c.paragraphs.flatMap((p) => p.skills);
  const head = `<h2 class="h3">Hoofdstuk ${esc(c.number)}: ${T(c.description)}</h2><span class="small muted">${esc(c.part)}</span>`;
  const paragraphs = `<ul class="picks">${c.paragraphs.map(paragraphHTML).join('')}</ul>`;
  // Een hoofdstuk zonder iets om te oefenen staat ingeklapt, zodat de lijst kort blijft en je
  // toch ziet wat ontbreekt.
  if (!ids.length)
    return `<section class="chapter">${head}<details class="small"><summary>Dit kun je hier nog niet oefenen. Bekijk de ${c.paragraphs.length} paragrafen.</summary>${paragraphs}</details></section>`;
  return `<section class="chapter">${head}
  <label class="pick pick-all">${checkbox('chapter', esc(c.number), ids)}<span>Kies alles wat je hier kunt oefenen uit hoofdstuk ${esc(c.number)}</span></label>
  ${paragraphs}</section>`;
}
function vMapping(m) {
  const count = (prog.stof || []).length;
  return `${crumbs()}<div class="sheet">${pageHead(mappingName(m), '<p class="lead needs-js">Vink aan wat je wilt oefenen. Wat je kiest, komt in Mijn stof.</p>')}
  ${m.note ? `<p class="watch"><b>Let op:</b> ${esc(m.note)}</p>` : ''}
  ${m.chapters.map(chapterHTML).join('')}
  <details class="small"><summary>Bij welke boeken hoort dit?</summary><ul>${m.books.map((b) => `<li>${esc(b.name)}, ISBN ${esc(b.isbn)}</li>`).join('')}</ul><p>Dit is een eigen project zonder band met de uitgever of ${esc(m.method)}. We verwijzen alleen naar de paragrafen en schrijven zelf de uitleg en de vragen.</p></details>
  <div class="stof-bar"><span class="small">${count === 1 ? '1 soort vraag' : `${count} soorten vragen`} gekozen</span><a class="btn main" href="${to('stof')}">Naar mijn stof</a></div></div>`;
}

function chosenHTML({ topic, skills }) {
  const p = Math.round((skills.reduce((t, k) => t + skillPct(k.id), 0) / skills.length) * 100);
  return `<a class="par color-${topic.domain.color}" href="${pathFor({ name: 'topic', slug: topic.slug })}"><span>${T(topic.title)}</span><span class="pct">${p}%</span><span class="small muted stof-skills">${skillNames(skills)}</span><span class="bar ${p >= 80 ? 'done' : ''}"><i style="width:${p}%"></i></span></a>`;
}
function topicPickHTML(topic) {
  const ids = topic.skills.map((k) => k.id),
    some = ids.filter(isChosen).length;
  return `<label class="pick">${checkbox('topicpick', topic.slug, ids)}<span>${T(topic.title)}${some && some < ids.length ? `<span class="small muted pick-note">${some} van ${ids.length} soorten vragen gekozen</span>` : ''}</span></label>`;
}
function gapsHTML() {
  const gaps = stofGaps();
  if (!gaps.length) return '';
  return `<section class="sheet"><h2 class="h3">Wat je hier nog niet kunt oefenen</h2><p class="small muted">Uit de hoofdstukken die je koos, in ${mappingName(MAPPING[prog.mapping])}.</p><ul class="stof-gaps small">${gaps.map((p) => `<li><b>${esc(p.number)}</b> ${T(p.description)}${p.coverage === 'deels' ? ` (een deel kun je hier oefenen)${p.note ? `<span class="pick-note muted">${T(p.note)}</span>` : ''}` : ''}</li>`).join('')}</ul></section>`;
}
// Waar de stof vandaan komt: uit welk boek, en welke hoofdstukken of paragrafen.
function sourceHTML() {
  const parts = stofFromBook();
  if (!parts.length) return '';
  return `<p>Uit je boek, ${mappingName(MAPPING[prog.mapping])}: ${list(parts)}. <a class="linkbtn" href="${bookPath()}">Bekijk de paragrafen</a></p>`;
}
function testHTML() {
  if (!state.test && !state.result) return '';
  const running = state.test
    ? `<p>Je proeftoets loopt nog. <a class="linkbtn" href="${to('toets')}">Ga verder met vraag ${state.test.i + 1}</a></p>`
    : '';
  const last = state.result
    ? `<p>Je laatste resultaat: ${resultText(state.result)}.</p><div class="row"><a class="btn" href="${to('toetsres')}">Bekijk je resultaat</a></div>`
    : '';
  return `<section class="sheet"><h2 class="h3">Proeftoets</h2>${running}${last}</section>`;
}
function progressHTML() {
  const stored =
    Object.keys(prog.skills).length || prog.stof || prog.mapping || state.test || state.result;
  const reset = state.confirmReset
    ? `<p class="small">Wil je alles wissen? Je voortgang, je stof, je boek en je proeftoetsen zijn dan weg.</p><div class="row"><button class="btn quiet" type="button" data-act="reset2">Ja, wis alles</button><button class="btn quiet" type="button" data-act="reset0">Annuleren</button></div>`
    : `<div class="row"><button class="btn quiet" type="button" data-act="reset1">Voortgang wissen</button></div>`;
  return `<section class="sheet"><h2 class="h3">Je voortgang</h2><p class="small">Je voortgang, je stof en je laatste proeftoets blijven alleen in deze browser bewaard. <a class="linkbtn" href="${to('privacy')}">Lees meer over privacy</a></p>${stored ? reset : ''}</section>`;
}
function vStof() {
  const groups = chosenTopics(),
    mapping = MAPPING[prog.mapping];
  const onMapping = mapping?.chapters.some((c) =>
    c.paragraphs.some((p) => p.skills.some(isChosen)),
  );
  const chosen = groups.length
    ? `${sourceHTML()}<div class="row"><a class="btn main" href="${to('stofoefen')}">Oefen mijn stof</a><a class="btn" href="${to('toets')}">${state.test ? 'Ga verder met je proeftoets' : 'Maak een proeftoets'}</a></div>
    ${onMapping && mapping.note ? `<p class="watch"><b>Let op:</b> ${esc(mapping.note)} Ook de uitleg is voor havo 3 geschreven.</p>` : ''}
    <div class="stof-list">${groups.map(chosenHTML).join('')}</div>
    <p class="small muted">Tik op een onderwerp voor de uitleg.</p>`
    : `<p>Je hebt nog geen stof gekozen. Kies wat je wilt oefenen, dan oefen je daarna precies die stof en maak je er een proeftoets over.</p>`;
  return `${crumbs()}<div class="sheet">${pageHead('Mijn stof')}${chosen}</div>
  ${groups.length ? gapsHTML() : ''}
  ${testHTML()}
  <section class="sheet"><h2 class="h3" id="onderwerp">${groups.length ? 'Stof wijzigen' : 'Stof kiezen'}</h2>
  <div class="row"><a class="btn ${groups.length ? '' : 'main'}" href="${bookPath()}">Kies uit je boek</a><button class="btn" type="button" data-act="stofall">Alle stof</button>${groups.length ? `<button class="btn quiet" type="button" data-act="stofclear">Alles weghalen</button>` : ''}</div>
  <p class="small muted">Of kies op onderwerp:</p>
  ${DOMAINS.map((d) => `<div class="setup"><b>${d.name}</b>${d.topics.map(topicPickHTML).join('')}</div>`).join('')}</section>
  ${progressHTML()}`;
}
function vStofPractice() {
  // De stof kan zijn gewijzigd sinds de vorige ronde. Past de vraag nog, dan blijft die staan.
  const st = state.prac['mijn-stof'];
  if (st?.skill && !isChosen(st.skill.id)) delete state.prac['mijn-stof'];
  return `<div class="screen-grid">${crumbs()}${vPractice(stofTopic(), 'Mijn stof oefenen')}</div>`;
}

export { list, mappingName, vPick, vMapping, vStof, vStofPractice };
