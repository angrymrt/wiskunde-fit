// De schermen van een onderwerp: de uitleg en het oefenen.
import { prog, skillPct, topicPct } from '../progress.js';
import { pathFor, to } from '../routes.js';
import { topicOf } from '../stof.js';
import { esc, T, stepsHTML } from '../typeset.js';
import { crumbs, pageHead } from './layout.js';
import { fieldsHTML } from './question-form.js';
import { state } from './state.js';

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
    .map(
      (b, i) =>
        `<div class="block"><h2 class="h3">${T(b.t)}</h2>${(b.p || []).map((x) => `<p>${/<span|<table/.test(x) ? x : T(x)}</p>`).join('')}${b.how ? `<ol class="how">${b.how.map((x) => `<li>${/<span/.test(x) ? x : T(x)}</li>`).join('')}</ol>` : ''}${b.widget ? `<div data-widget="${b.widget}"></div>` : ''}${b.ex ? exampleHTML(b.ex, i) : ''}${b.watch ? `<p class="watch"><b>Let op:</b> ${/<span/.test(b.watch) ? b.watch : T(b.watch)}</p>` : ''}</div>`,
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
function newQuestion(s) {
  const st = state.prac[s.slug];
  let sk;
  if (st.filter) {
    sk = s.skills.find((k) => k.id === st.filter);
  } else {
    const pool = [...s.skills].sort(
      (a, b) => skillPct(a.id) - skillPct(b.id) + (Math.random() - 0.5) * 0.5,
    );
    sk = pool.find((k) => k.id !== st.lastSkill) || pool[0];
  }
  st.q = sk.gen();
  st.skill = sk;
  st.lastSkill = sk.id;
  st.status = 'open';
  st.vals = [];
  st.marks = null;
  st.hint = false;
  st.first = true;
  st.msg = '';
  st.sol = false;
}
const practiceState = (s) => state.prac[s.slug] || (state.prac[s.slug] = { right: 0, total: 0 });
// Volgt ?soort= uit het adres. Een half gemaakte vraag blijft staan als die daarbij past.
function applySoort(s, soort = null) {
  const st = practiceState(s);
  st.filter = soort;
  if (soort && st.skill?.id !== soort) newQuestion(s);
}
function vPractice(s) {
  const st = practiceState(s);
  if (!st.q) newQuestion(s);
  const q = st.q,
    done = st.status === 'right' || st.status === 'shown';
  const chips = s.mixed
    ? `<p class="small">Uitleg bij deze vraag: ${topicLink(topicOf(st.skill.id))}</p>`
    : `<div class="chips"><button class="chip" type="button" data-act="filter" data-id="" aria-pressed="${!st.filter}">Alles door elkaar</button>${s.skills.map((k) => `<button class="chip" type="button" data-act="filter" data-id="${k.id}" aria-pressed="${st.filter === k.id}">${T(k.name)}${prog.skills[k.id] ? `<span class="n">${Math.round(skillPct(k.id) * 5)}/5</span>` : ''}</button>`).join('')}</div>`;
  return `${chips}<div class="sheet fade"><div class="row small muted" style="justify-content:space-between"><span>${T(st.skill.name)}</span><span>${st.total ? `${st.right} van ${st.total} goed deze ronde` : ''}</span></div>
  <div class="q" id="pq">${q.q}</div>${q.fig ? `<div class="figbox">${q.fig}</div>` : ''}
  <form id="pform" class="block" novalidate>${fieldsHTML(q, 'p', st.vals, st.marks, done)}${!q.mc && !q.line && q.fields.some((f) => !f.sel) ? `<p class="small muted">Een breuk mag ook: 1/2 of 1 1/2. Een kommagetal schrijf je als 3,5.</p>` : ''}
  ${st.msg ? `<div class="fb ${st.status === 'right' ? 'good' : 'bad'}" id="pfb">${st.msg}</div>` : ''}
  ${st.hint && !done ? `<div class="hintb"><b>Hint:</b> ${/<span/.test(q.hint) ? q.hint : T(q.hint)}</div>` : ''}
  <div class="row">${done ? `<button class="btn main" type="submit" id="nextq" ${st.msg ? 'aria-describedby="pfb"' : ''}>Volgende vraag</button>` : `<button class="btn main" type="submit">Controleer</button>${st.hint ? '' : `<button class="btn" type="button" data-act="hint">Hint</button>`}<button class="btn quiet" type="button" data-act="show">Toon uitwerking</button>`}${st.status === 'right' && !st.sol ? `<button class="btn quiet" type="button" data-act="showsol">Bekijk uitwerking</button>` : ''}</div></form>
  ${st.status === 'shown' || st.sol ? `<div class="sol"><h2 class="h3">Uitwerking</h2>${stepsHTML(q.steps)}</div>` : ''}</div>`;
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
    return `<div class="screen-grid color-${s.domain.color}">${pageHead(`${T(s.title)} oefenen`)}${vPractice(s)}${pagerHTML(s)}</div>`;
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
  <div class="topic-body">${vLearn(s)}${videos}</div>
  <div class="practice-bar">${practiceButton(s)}</div>
  ${pagerHTML(s)}</article></div>`;
}

export { vTopic, vPractice, newQuestion, applySoort, topicLink };
