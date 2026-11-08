// De schermen om stof te kiezen: uit je boek, de paragrafen van een boek, en Jouw stof.
import { MAPPING, MAPPINGS } from '../mappings/index.js';
import { prog, skillPct } from '../progress.js';
import { pathFor, to } from '../routes.js';
import { allChosen, chosenTopics, isChosen, stofGaps, stofTopic } from '../stof.js';
import { DOMAINS } from '../topics/index.js';
import { esc, T } from '../typeset.js';
import { state } from './state.js';
import { topicLink, vPractice } from './topic.js';

const mappingName = (m) => `${esc(m.method)}, ${m.edition}e editie, ${esc(m.level)} ${m.year}`;
const checkbox = (act, id, on) =>
  `<input type="checkbox" data-act="${act}" data-id="${id}" ${on ? 'checked' : ''}>`;
const skillNames = (skills) => skills.map((k) => T(k.name)).join(', ');

const PICK_FIELDS = [
  ['level', 'Niveau'],
  ['year', 'Leerjaar'],
  ['method', 'Methode'],
  ['edition', 'Editie'],
];
// Elke lijst toont alleen wat bij de eerdere keuzes past. Is er maar één mogelijkheid, dan staat
// die al ingevuld.
function pickLists() {
  let matches = MAPPINGS;
  const lists = PICK_FIELDS.map(([key, label]) => {
    const options = [...new Set(matches.map((m) => String(m[key])))];
    if (!options.includes(state.pick[key]))
      state.pick[key] = options.length === 1 ? options[0] : '';
    if (state.pick[key]) matches = matches.filter((m) => String(m[key]) === state.pick[key]);
    return { key, label, options, value: state.pick[key] };
  });
  return { lists, mapping: lists.every((l) => l.value) ? matches[0] : null };
}
const pickedMapping = () => pickLists().mapping;
// "Kies uit je boek" gaat naar het boek dat je het laatst koos, als dat er is.
const bookPath = () =>
  MAPPING[prog.mapping] ? pathFor({ name: 'mapping', id: prog.mapping }) : to('kies');
function vPick() {
  const { lists, mapping } = pickLists();
  const toggles = ({ key, label, options, value }) =>
    `<div class="setup"><b id="pick-${key}">${label}</b><div class="toggles" role="group" aria-labelledby="pick-${key}">${options.map((o) => `<button class="toggle" type="button" data-act="pick" data-id="${esc(`${key}:${o}`)}" aria-pressed="${o === value}">${esc(o)}${key === 'edition' ? 'e editie' : ''}</button>`).join('')}</div></div>`;
  return `<div class="sheet"><h1 style="font-size:clamp(1.7rem,5vw,2.4rem)">Kies uit je boek</h1><p>Kies wat op je boek staat. Daarna zie je de paragrafen en wat je daarvan hier kunt oefenen.</p>
  <div class="pick-lists">${lists.map(toggles).join('')}</div>
  <div class="row">${mapping ? `<a class="btn main" data-act="kiesgo" href="${pathFor({ name: 'mapping', id: mapping.id })}">Bekijk de paragrafen</a>` : `<button class="btn main" type="button" data-act="kiesgo" disabled>Bekijk de paragrafen</button>`}</div>
  <p class="small">Staat je boek er niet bij? <a class="linkbtn" href="${to('stof')}">Kies op onderwerp</a></p></div>`;
}

function paragraphHTML(p) {
  const label = `<b>${esc(p.number)}</b> ${T(p.description)}`;
  if (p.coverage === 'niet')
    return `<li class="pick off"><span></span><span>${label}<span class="small muted pick-note">Dit kun je hier nog niet oefenen.</span></span></li>`;
  const topics = chosenTopics(p.skills)
    .map((g) => topicLink(g.topic))
    .join(' ');
  const part =
    p.coverage === 'deels'
      ? `<span class="small muted pick-note">Dit kun je hier al oefenen: ${skillNames(chosenTopics(p.skills).flatMap((g) => g.skills))}.</span>`
      : '';
  return `<li><label class="pick">${checkbox('para', esc(p.number), allChosen(p.skills))}<span>${label}${part}</span></label><span class="small pick-topics">Onderwerp: ${topics}</span></li>`;
}
function chapterHTML(c) {
  const ids = c.paragraphs.flatMap((p) => p.skills);
  return `<section class="chapter"><h2 class="h3">Hoofdstuk ${esc(c.number)}: ${T(c.description)}</h2><span class="small muted">${esc(c.part)}</span>
  ${ids.length ? `<label class="pick pick-all">${checkbox('chapter', esc(c.number), allChosen(ids))}<span>Kies alles wat je hier kunt oefenen uit hoofdstuk ${esc(c.number)}</span></label>` : ''}
  <ul class="picks">${c.paragraphs.map(paragraphHTML).join('')}</ul></section>`;
}
function vMapping(m) {
  const count = (prog.stof || []).length;
  return `<div class="sheet"><div class="head"><h1 style="font-size:clamp(1.5rem,5vw,2.1rem)">${mappingName(m)}</h1><p><a class="linkbtn" href="${to('kies')}">Kies een ander boek</a></p></div>
  <p>Vink aan wat je wilt oefenen. Wat je kiest, komt in jouw stof.</p>
  ${m.note ? `<p class="watch"><b>Let op:</b> ${esc(m.note)}</p>` : ''}
  ${m.chapters.map(chapterHTML).join('')}
  <details class="small"><summary>Bij welke boeken hoort dit?</summary><ul>${m.books.map((b) => `<li>${esc(b.name)}, ISBN ${esc(b.isbn)}</li>`).join('')}</ul><p>Dit is een eigen project zonder band met de uitgever of ${esc(m.method)}. We verwijzen alleen naar de paragrafen en schrijven zelf de uitleg en de vragen.</p></details>
  <div class="stof-bar"><span class="small">${count === 1 ? '1 soort vraag' : `${count} soorten vragen`} gekozen</span><a class="btn main" href="${to('stof')}">Naar jouw stof</a></div></div>`;
}

function chosenHTML({ topic, skills }) {
  const p = Math.round((skills.reduce((t, k) => t + skillPct(k.id), 0) / skills.length) * 100);
  return `<a class="par color-${topic.domain.color}" href="${pathFor({ name: 'topic', slug: topic.slug })}"><span>${T(topic.title)}</span><span class="pct">${p}%</span><span class="small muted stof-skills">${skillNames(skills)}</span><span class="bar ${p >= 80 ? 'done' : ''}"><i style="width:${p}%"></i></span></a>`;
}
function topicPickHTML(topic) {
  const ids = topic.skills.map((k) => k.id),
    some = ids.filter(isChosen).length;
  return `<label class="pick">${checkbox('topicpick', topic.slug, allChosen(ids))}<span>${T(topic.title)}${some && some < ids.length ? `<span class="small muted pick-note">${some} van ${ids.length} soorten vragen gekozen</span>` : ''}</span></label>`;
}
function gapsHTML() {
  const gaps = stofGaps();
  if (!gaps.length) return '';
  return `<section class="sheet"><h2 class="h3">Wat je hier nog niet kunt oefenen</h2><p class="small muted">Uit de hoofdstukken die je koos, in ${mappingName(MAPPING[prog.mapping])}.</p><ul class="stof-gaps small">${gaps.map((p) => `<li><b>${esc(p.number)}</b> ${T(p.description)}${p.coverage === 'deels' ? ' (een deel kun je hier oefenen)' : ''}</li>`).join('')}</ul></section>`;
}
function vStof() {
  const groups = chosenTopics(),
    mapping = MAPPING[prog.mapping];
  const onMapping = mapping?.chapters.some((c) =>
    c.paragraphs.some((p) => p.skills.some(isChosen)),
  );
  const chosen = groups.length
    ? `<div class="row"><a class="btn main" href="${to('stofoefen')}">Oefen jouw stof</a><a class="btn" href="${to('toets')}">Maak een proeftoets</a></div>
    ${onMapping && mapping.note ? `<p class="watch"><b>Let op:</b> ${esc(mapping.note)} Ook de uitleg is voor havo 3 geschreven.</p>` : ''}
    <div class="stof-list">${groups.map(chosenHTML).join('')}</div>
    <p class="small muted">Tik op een onderwerp voor de uitleg.</p>`
    : `<p>Je hebt nog geen stof gekozen. Kies wat je wilt oefenen, dan oefen je daarna precies die stof en maak je er een proeftoets over.</p>`;
  return `<div class="sheet"><h1 style="font-size:clamp(1.7rem,5vw,2.4rem)">Jouw stof</h1>${chosen}</div>
  ${groups.length ? gapsHTML() : ''}
  <section class="sheet"><h2 class="h3">${groups.length ? 'Stof wijzigen' : 'Stof kiezen'}</h2>
  <div class="row"><a class="btn ${groups.length ? '' : 'main'}" href="${bookPath()}">Kies uit je boek</a><button class="btn" type="button" data-act="stofall">Alle stof</button>${groups.length ? `<button class="btn quiet" type="button" data-act="stofclear">Alles weghalen</button>` : ''}</div>
  <p class="small muted">Of kies op onderwerp:</p>
  ${DOMAINS.map((d) => `<div class="setup"><b>${d.name}</b>${d.topics.map(topicPickHTML).join('')}</div>`).join('')}</section>`;
}
function vStofPractice() {
  // De stof kan zijn gewijzigd sinds de vorige ronde. Past de vraag nog, dan blijft die staan.
  const st = state.prac['jouw-stof'];
  if (st?.skill && !isChosen(st.skill.id)) delete state.prac['jouw-stof'];
  return `<div style="display:grid;gap:16px"><div class="head"><span class="small"><a class="linkbtn" href="${to('stof')}">Terug naar jouw stof</a></span><h1>Jouw stof oefenen</h1></div>${vPractice(stofTopic())}</div>`;
}

export { bookPath, pickedMapping, vPick, vMapping, vStof, vStofPractice };
