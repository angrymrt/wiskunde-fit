// Het scherm van een onderwerp met de tabbladen Uitleg en Oefenen.
import { prog, skillPct } from '../progress.js';
import { esc, T, stepsHTML } from '../typeset.js';
import { fieldsHTML } from './question-form.js';
import { state } from './state.js';

function exampleHTML(ex, key) {
  const st = ex.steps;
  return `<div class="ex" data-ex="${key}"><div class="lab">Voorbeeld</div><div>${ex.q}</div><ul class="steps">${st.map((s, i) => `<li ${i ? 'hidden' : ''}>${typeof s === 'string' ? T(s) : s.h}</li>`).join('')}</ul>${st.length > 1 ? `<div class="row"><button class="btn quiet" type="button" data-act="exnext">Volgende stap</button></div>` : ''}</div>`;
}
const topicLink = (t) =>
  `<button class="linkbtn" type="button" data-act="topic" data-id="${t.slug}">${T(t.title)}</button>`;
const nextHTML = (s) =>
  s.next ? `<p class="small">Volgend onderwerp: ${topicLink(s.next)}</p>` : '';
function vLearn(s) {
  return (
    vVideos(s) +
    s.learn
      .map(
        (b, i) =>
          `<div class="block"><h2 class="h3">${T(b.t)}</h2>${(b.p || []).map((x) => `<p>${/<span|<table/.test(x) ? x : T(x)}</p>`).join('')}${b.how ? `<ol class="how">${b.how.map((x) => `<li>${/<span/.test(x) ? x : T(x)}</li>`).join('')}</ol>` : ''}${b.widget ? `<div data-widget="${b.widget}"></div>` : ''}${b.ex ? exampleHTML(b.ex, i) : ''}${b.watch ? `<p class="watch"><b>Let op:</b> ${/<span/.test(b.watch) ? b.watch : T(b.watch)}</p>` : ''}</div>`,
      )
      .join('') +
    `<div class="row"><button class="btn main" type="button" data-act="tab" data-tab="oefen">Ga oefenen</button></div>${nextHTML(s)}`
  );
}
const CHANNELS = { menno: 'Math with Menno', bob: 'Wiskunde met Bob Pruiksma' };
function vVideos(s) {
  const groups = Object.keys(CHANNELS).filter((k) => s.videos[k]?.length);
  return groups.length
    ? `<div class="block"><h2 class="h3">Liever kijken?</h2><p class="muted small">Kies de uitleg die jou het best helpt. De video's openen op YouTube.</p>${groups.map((k) => `<h3>${CHANNELS[k]}</h3><ul class="vids">${s.videos[k].map(([t, id]) => `<li><a href="https://youtu.be/${id}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>`).join('')}</div>`
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
function vPractice(s) {
  const st = state.prac[s.slug] || (state.prac[s.slug] = { right: 0, total: 0 });
  if (!st.q) newQuestion(s);
  const q = st.q,
    done = st.status === 'right' || st.status === 'shown';
  const chips = `<div class="chips"><button class="chip" type="button" data-act="filter" data-id="" aria-pressed="${!st.filter}">Alles door elkaar</button>${s.skills.map((k) => `<button class="chip" type="button" data-act="filter" data-id="${k.id}" aria-pressed="${st.filter === k.id}">${T(k.name)}${prog.skills[k.id] ? `<span class="n">${Math.round(skillPct(k.id) * 5)}/5</span>` : ''}</button>`).join('')}</div>`;
  return `${chips}<div class="sheet fade"><div class="row small muted" style="justify-content:space-between"><span>${T(st.skill.name)}</span><span>${st.total ? `${st.right} van ${st.total} goed deze ronde` : ''}</span></div>
  <div class="q" id="pq">${q.q}</div>${q.fig ? `<div class="figbox">${q.fig}</div>` : ''}
  <form id="pform" class="block" novalidate>${fieldsHTML(q, 'p', st.vals, st.marks, done)}${!q.mc && !q.check && q.fields.some((f) => !f.sel) ? `<p class="small muted">Een breuk mag ook: 1/2 of 1 1/2. Een kommagetal schrijf je als 3,5.</p>` : ''}
  ${st.msg ? `<div class="fb ${st.status === 'right' ? 'good' : 'bad'}" id="pfb">${st.msg}</div>` : ''}
  ${st.hint && !done ? `<div class="hintb"><b>Hint:</b> ${/<span/.test(q.hint) ? q.hint : T(q.hint)}</div>` : ''}
  <div class="row">${done ? `<button class="btn main" type="submit" id="nextq" ${st.msg ? 'aria-describedby="pfb"' : ''}>Volgende vraag</button>` : `<button class="btn main" type="submit">Controleer</button>${st.hint ? '' : `<button class="btn" type="button" data-act="hint">Hint</button>`}<button class="btn quiet" type="button" data-act="show">Toon uitwerking</button>`}${st.status === 'right' && !st.sol ? `<button class="btn quiet" type="button" data-act="showsol">Bekijk uitwerking</button>` : ''}</div></form>
  ${st.status === 'shown' || st.sol ? `<div class="sol"><h2 class="h3">Uitwerking</h2>${stepsHTML(q.steps)}</div>` : ''}</div>`;
}
function vTopic(s) {
  const tab = state.view.tab === 'oefen' ? 'oefen' : 'uitleg';
  const body =
    tab === 'uitleg' ? `<div class="sheet">${vLearn(s)}</div>` : `${vPractice(s)}${nextHTML(s)}`;
  const prerequisites = s.prerequisites.length
    ? `<p class="small">Voorkennis: ${s.prerequisites.map(topicLink).join(' en ')}</p>`
    : '';
  return `<div class="color-${s.domain.color}" style="display:grid;gap:16px"><div class="head"><span class="small muted">${s.domain.name}</span><h1>${T(s.title)}</h1>${prerequisites}</div>
  <div class="tabs" role="tablist">${[
    ['uitleg', 'Uitleg'],
    ['oefen', 'Oefenen'],
  ]
    .map(
      ([k, n]) =>
        `<button class="tab" type="button" role="tab" id="tab-${k}" aria-selected="${tab === k}" aria-controls="paneel" tabindex="${tab === k ? 0 : -1}" data-act="tab" data-tab="${k}">${n}</button>`,
    )
    .join(
      '',
    )}</div><div class="panel" role="tabpanel" id="paneel" aria-labelledby="tab-${tab}">${body}</div></div>`;
}

export { vTopic, newQuestion };
