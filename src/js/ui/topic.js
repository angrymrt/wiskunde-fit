// De schermen van een onderwerp: de uitleg en het oefenen.
import { isDrawing } from '../answers.js';
import { prog, skillGoed, skillPct, topicPct } from '../progress.js';
import { pathFor, to } from '../routes.js';
import { isChosen, topicOf } from '../stof.js';
import { makeQuestion } from '../topics/index.js';
import { esc, T, stepsHTML } from '../typeset.js';
import { crumbs, pageHead } from './layout.js';
import { fieldsHTML, meldHTML, rekenhulpHTML, shareHTML } from './question-form.js';
import { state } from './state.js';
import { termen } from './termen.js';
import { widgetHTML } from './widgets.js';

function exampleHTML(ex, key) {
  const st = ex.steps;
  return `<div class="ex" data-ex="${key}"><div class="lab">Voorbeeld</div><div>${ex.q}</div><ul class="steps">${st.map((s, i) => `<li ${i ? 'hidden' : ''}>${typeof s === 'string' ? T(s) : s.h}</li>`).join('')}</ul>${st.length > 1 ? `<div class="row"><button class="btn quiet" type="button" data-act="exnext">Volgende stap</button></div>` : ''}</div>`;
}
const topicPath = (t) => pathFor({ name: 'topic', slug: t.slug });
const practicePath = (t) => pathFor({ name: 'topic', slug: t.slug, oefen: true });
const topicLink = (t) => `<a class="linkbtn" href="${topicPath(t)}">${T(t.title)}</a>`;
// Vorig en volgend onderwerp binnen het domein. Voor het eerste en na het laatste onderwerp
// wijst het naar de pagina van het domein.
function pagerHTML(s) {
  const side = (cls, label, href, title) =>
    `<a class="${cls}" href="${href}"><span class="small muted">${label}</span><span>${title}</span></a>`;
  const domain = pathFor({ name: 'domain', slug: s.domain.slug });
  const prev = s.prev
    ? side('pager-prev', 'Vorig onderwerp', topicPath(s.prev), T(s.prev.title))
    : side('pager-prev', 'Alle onderwerpen', domain, s.domain.name);
  const next = s.next
    ? side('pager-next', 'Volgend onderwerp', topicPath(s.next), T(s.next.title))
    : side('pager-next', `Klaar met ${s.domain.name}`, domain, 'Alle onderwerpen');
  return `<nav class="pager" aria-label="Onderwerpen in ${s.domain.name}">${prev}${next}</nav>`;
}
const practiceButton = (s) => `<a class="btn main" href="${practicePath(s)}">Ga oefenen</a>`;
const vLearn = (s) =>
  s.learn
    .map((b, i) =>
      termen(
        `<div class="block"><h2 class="h3">${T(b.t)}</h2>${(b.p || []).map((x) => `<p>${/<span|<table/.test(x) ? x : T(x)}</p>`).join('')}${b.how ? `<ol class="how">${b.how.map((x) => `<li>${/<span/.test(x) ? x : T(x)}</li>`).join('')}</ol>` : ''}${b.widget ? `<div data-widget="${b.widget}">${widgetHTML(b.widget)}</div>` : ''}${b.ex ? exampleHTML(b.ex, i) : ''}${b.ex2 ? exampleHTML(b.ex2, `${i}b`) : ''}${b.watch ? `<p class="watch"><b>Let op:</b> ${/<span/.test(b.watch) ? b.watch : T(b.watch)}</p>` : ''}</div>`,
      ),
    )
    .join('');
const CHANNELS = { menno: 'Math with Menno', bob: 'Wiskunde met Bob Pruiksma' };
function vVideos(s) {
  // Per video-onderwerp in plaats van per kanaal, want de kanalen behandelen vaak dezelfde stof.
  const groups = new Map();
  for (const k of Object.keys(CHANNELS)) {
    for (const [title, id] of s.videos[k] || []) {
      groups.set(title, [...(groups.get(title) || []), [k, id]]);
    }
  }
  return groups.size
    ? `<div class="block"><h2 class="h3" id="videos">Video's</h2><p class="muted small">Kies de uitleg die jou het best helpt. De video's openen op YouTube.</p><ul class="vids">${[...groups].map(([title, links]) => `<li>${esc(title)}<span class="vid-links">${links.map(([k, id]) => `<a href="https://youtu.be/${id}" target="_blank" rel="noopener" aria-label="${esc(title)}, ${CHANNELS[k]}">${CHANNELS[k]}</a>`).join('')}</span></li>`).join('')}</ul></div>`
    : '';
}
// Zonder seed krijgt de vraag een nieuwe. Met ?soort=...&seed=... uit het adres komt precies die
// vraag terug.
// Heeft de leerling stof gekozen met een deel van de soorten van dit onderwerp, dan staat de
// schakelaar "Alleen mijn stof" erbij, standaard aan. Uit (st.alle) oefent ze alles.
const mijnStof = (s) => {
  const mine = s.skills.filter((k) => isChosen(k.id));
  return !s.mixed && mine.length && mine.length < s.skills.length ? mine : null;
};
const activeSkills = (s) => (!state.prac[s.slug]?.alle && mijnStof(s)) || s.skills;
function newQuestion(s, seed) {
  const st = state.prac[s.slug];
  let sk;
  if (st.filter) {
    sk = s.skills.find((k) => k.id === st.filter);
  } else {
    const pool = [...activeSkills(s)].sort(
      (a, b) => skillPct(a.id) - skillPct(b.id) + (Math.random() - 0.5) * 0.5,
    );
    sk = pool.find((k) => k.id !== st.lastSkill) || pool[0];
  }
  st.q = makeQuestion(sk, seed);
  st.skill = sk;
  st.lastSkill = sk.id;
  st.status = 'open';
  st.vals = [];
  st.marks = null;
  st.hint = false;
  st.first = true;
  st.msg = '';
  st.sol = false;
  // Voor de anonieme tellen, zie ui/tellen.js: de klok tot de eerste poging, en de valkuilen die al
  // zijn geteld.
  st.spent = 0;
  st.since = null;
  st.valkuilen = [];
}
const practiceState = (s) => state.prac[s.slug] || (state.prac[s.slug] = { right: 0, total: 0 });
// Volgt ?soort= en ?seed= uit het adres. Een half gemaakte vraag blijft staan als die daarbij past.
function applySoort(s, soort = null, seed) {
  const st = practiceState(s);
  st.filter = soort;
  // Een nieuw bezoek begint weer met alleen je stof.
  st.alle = false;
  // Een gedeelde link met ?soort= toont die soort altijd, ook buiten je stof.
  if (soort && !activeSkills(s).some((k) => k.id === soort)) st.alle = true;
  if (soort && seed !== undefined && (st.q?.seed !== seed || st.skill?.id !== soort))
    newQuestion(s, seed);
  else if (soort && st.skill?.id !== soort) newQuestion(s);
}
function scopeSwitch(s) {
  return mijnStof(s)
    ? `<button class="switch" type="button" role="switch" aria-checked="${!state.prac[s.slug]?.alle}" data-act="scope">Alleen mijn stof</button>`
    : '';
}
// De reeks goede eerste pogingen: 5 vakjes. Elk goed antwoord vult er een, en een fout antwoord
// leegt ze weer. Bij 5 verschijnt er een plaatje (zie iconen.js) dat uit de balk omhoog zweeft.
// st.reeksAnim hoort bij alleen de render direct na een poging (main.js wist het daarna): zo laat
// de CSS de beweging eenmaal zien en blijft er voor dezelfde toestand dezelfde HTML. Zonder
// beweging staat de balk meteen goed en staat het plaatje even stil. De tekst voor een schermlezer
// zegt altijd hoe de reeks er na de poging voor staat.
const SVG = (d) =>
  `<svg class="icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
// Alles door elkaar: twee pijlen die kruisen. Eén soort: een doel.
const MIX_ICON = SVG(
  'M2 4.5h2.5c3 0 4 7 7 7H14M2 11.5h2.5c1 0 1.800-1.100 2.500-2.300M9 6.800c.700-1.300 1.500-2.300 2.500-2.300H14M12 2.500l2 2-2 2M12 9.500l2 2-2 2',
);
const SOORT_ICON = SVG(
  'M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zM8 5.500a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5z',
);
const CARET_ICON = SVG('M4 6.500 8 10.500l4-4').replace('class="icon"', 'class="icon caret"');
// Een andere vraag, zonder de ronde te verliezen. Op een breed scherm doen de chips dat al; op een telefoon is dit het icoon.
const ANDERE_KNOP = `<button class="btn quiet share andere" type="button" data-act="andere">${SVG('M13.500 3v3.500H10M2.500 13V9.500H6M3.200 7a5 5 0 0 1 9.100-1.500M12.800 9a5 5 0 0 1-9.100 1.500')}<span class="bt">Andere vraag</span></button>`;
const REEKS = 5;
function reeksHTML(st) {
  const n = st.streak || 0,
    a = st.reeksAnim,
    klaar = a?.type === 'icoon',
    leeg = a?.type === 'leeg',
    aan = klaar ? REEKS : leeg ? a.van : n,
    tekst = `${n} van ${REEKS} achter elkaar goed`,
    vakjes = Array.from(
      { length: REEKS },
      (_, i) =>
        `<span class="seg${i < aan ? ' aan' : ''}${a && i === aan - 1 && !leeg ? ' puls' : ''}" style="--i:${REEKS - 1 - i}"></span>`,
    ).join('');
  const icoon = klaar
    ? `<svg class="icoon toon" viewBox="0 0 24 24" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${a.icoon}</svg>`
    : '';
  return `<span class="reeks${klaar ? ' klaar' : ''}${leeg ? ' leeg' : ''}" role="img" aria-label="${tekst}">${vakjes}${icoon}</span>`;
}
// Het getal `3/5` achter een soort. Is het net veranderd (roll), dan rolt het: bij meer goed gaat
// het oude getal omlaag en komt het nieuwe van boven, bij minder goed andersom. Het oude getal is
// alleen voor het oog; een schermlezer leest het nieuwe. Zonder beweging (prefers-reduced-motion)
// komt het nieuwe getal rustig in beeld.
function chipGetal(id, roll) {
  if (roll?.id !== id) return `<span class="n">${skillGoed(id)}/5</span>`;
  const nieuw = `<span>${roll.naar}</span>`,
    oud = `<span class="oud" aria-hidden="true">${roll.van}</span>`,
    op = roll.naar > roll.van;
  return `<span class="n gewijzigd"><span class="roll ${op ? 'op' : 'neer'}"><span class="kol">${op ? nieuw + oud : oud + nieuw}</span></span>/5</span>`;
}
// Oefenen in één blok: bovenaan de kop met de soorten vragen, daaronder de vraag. Alleen de vraag
// komt met een korte animatie in beeld, de kop blijft staan.
function vPractice(s, title, terug) {
  const st = practiceState(s);
  // De stofkeuze kan veranderd zijn (ook in een ander tabblad): een soort die niet meer meedoet, vervalt.
  const act = activeSkills(s);
  if (!act.some((k) => k.id === st.filter)) st.filter = null;
  if (!st.q || !act.includes(st.skill)) newQuestion(s);
  const q = st.q,
    done = st.status === 'right' || st.status === 'shown';
  const chips = s.mixed
    ? `<p class="small">Uitleg bij deze vraag: ${topicLink(topicOf(st.skill.id))}</p>`
    : `<div class="soort-menu">${scopeSwitch(s)}<div class="chips"><button class="chip" type="button" data-act="filter" data-id="" aria-pressed="${!st.filter}">Alles door elkaar</button>${activeSkills(
        s,
      )
        .map(
          (k) =>
            `<button class="chip" type="button" data-act="filter" data-id="${k.id}" aria-pressed="${st.filter === k.id}">${T(k.name)}${prog.skills[k.id] ? chipGetal(k.id, st.roll) : ''}</button>`,
        )
        .join('')}</div></div>`;
  const share = shareHTML(st.skill, q),
    meld = meldHTML(st.skill, q),
    rek = rekenhulpHTML(st.skill, q);
  // Op een telefoon is dit de vaste kop van het volledig-schermmodus (zie styles.css, html.oef). Op een breed scherm
  // staat alles gewoon onder elkaar. De knop met de soort is alleen daar; de chips zijn dan het menu eronder.
  const knop = s.mixed
    ? ''
    : `<button class="soort-knop" type="button" data-act="menu" aria-expanded="${!!st.menu}">${st.filter ? SOORT_ICON : MIX_ICON}<span class="sn"><span class="sr">Soort vraag, ${st.filter ? 'alleen deze soort' : 'alles door elkaar'}: </span>${T(st.skill.name)}</span>${CARET_ICON}</button>`;
  return termen(`<div class="sheet practice${st.menu ? ' menu-open' : ''}"><div class="oef-kop"><a class="oef-terug" href="${terug}"><svg class="icon" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" focusable="false"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="sr">Terug naar het onderwerp</span></a>${pageHead(title, chips)}<div class="q-head"><div class="row small muted q-row">${knop}<span class="soort-naam">${T(st.skill.name)}</span><span class="row q-rechts">${st.total ? `<span class="row q-stat"><span>${st.right} van ${st.total} goed deze ronde</span>${reeksHTML(st)}</span>` : ''}<span class="row q-tools">${rek.button}${ANDERE_KNOP}${share.button}${meld.button}</span></span></div>${share.note}</div></div><div class="practice-q fade">
  <div class="q" id="pq">${q.q}</div>${q.fig ? `<div class="figbox">${q.fig}</div>` : ''}
  <form id="pform" class="block" novalidate${rek.attrs}>${fieldsHTML(q, 'p', st.vals, st.marks, done)}${!q.mc && !isDrawing(q) && q.fields.some((f) => !f.sel) ? `<p class="small muted">${q.fields.some((f) => f.berekening) ? 'Typ de hele berekening, zoals <span class="nowrap">4 * (5 - -2)</span>. Keer typ je als * of x, en delen als : of /.' : q.fields.some((f) => f.vorm) ? 'Schrijf een breuk als 3/4, en een gemengd getal als 1 5/8.' : 'Een breuk mag ook: 1/2 of 1 1/2. Een kommagetal schrijf je als 3,5.'}</p>` : ''}
  ${st.msg ? `<div class="fb ${st.status === 'right' ? 'good' : 'bad'}" id="pfb">${st.msg}</div>` : ''}
  ${st.hint && !done ? `<div class="hintb"><b>Hint:</b> ${/<span/.test(q.hint) ? q.hint : T(q.hint)}</div>` : ''}
  <div class="row">${done ? `<button class="btn main" type="submit" id="nextq" ${st.msg ? 'aria-describedby="pfb"' : ''}>Volgende vraag</button>` : `<button class="btn main" type="submit">Controleer</button>${st.hint ? '' : `<button class="btn" type="button" data-act="hint">Hint</button>`}<button class="btn quiet" type="button" data-act="show">Toon uitwerking</button>`}${st.status === 'right' && !st.sol ? `<button class="btn quiet" type="button" data-act="showsol">Bekijk uitwerking</button>` : ''}</div></form>
  ${st.status === 'shown' || st.sol ? `<div class="sol"><h2 class="h3">Uitwerking</h2>${stepsHTML(q.steps)}</div>` : ''}</div>${meld.panel}</div>`);
}
// Kwam je via "Uitleg bij deze vraag" uit Mijn stof oefenen, dan kun je daar weer verder.
function backToRound(s) {
  const st = state.prac['mijn-stof'];
  return st?.q && st.status === 'open' && s.skills.includes(st.skill)
    ? `<a class="btn" href="${to('stofoefen')}">Verder met mijn stof oefenen</a>`
    : '';
}
// De uitleg staat in één vel. De knop om te oefenen staat op een breed scherm rechts en blijft
// in beeld. Op een telefoon staat hij onder de intro, en een balk onderaan neemt het over zodra
// die knop uit beeld is (zie main.js).
function vTopic(s) {
  if (state.view.oefen) {
    return `<div class="screen-grid color-${s.domain.color}">${crumbs()}${vPractice(s, `${T(s.title)} oefenen`, topicPath(s))}${pagerHTML(s)}</div>`;
  }
  const p = Math.round(topicPct(s) * 100),
    videos = vVideos(s);
  const prerequisites = s.prerequisites.length
    ? `<p class="small">Voorkennis: ${s.prerequisites.map(topicLink).join(', ')}</p>`
    : '';
  const done = p
    ? `<div class="topic-pct small"><span class="muted">${p}% geoefend</span><span class="bar ${p >= 80 ? 'done' : ''}"><i style="width:${p}%"></i></span></div>`
    : '';
  return `<div class="screen-grid color-${s.domain.color}">${crumbs()}<article class="sheet topic">
  <div class="head topic-head"><h1>${T(s.title)}</h1><p class="lead">${T(s.intro)}</p>${prerequisites}</div>
  <div class="topic-side"><div class="topic-actions">${practiceButton(s)}${backToRound(s)}${done}${videos ? `<a class="small" href="#videos">Naar de video's</a>` : ''}</div></div>
  <div class="topic-body">${vLearn(s)}${videos}<!--termen--></div>
  <div class="practice-bar away">${practiceButton(s)}</div>
  ${pagerHTML(s)}</article></div>`;
}

export { vTopic, vPractice, newQuestion, applySoort, topicLink };
