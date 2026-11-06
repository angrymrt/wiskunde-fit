// Het paragraafscherm met de tabbladen Uitleg, Oefenen en Video's.
import { prog, skillPct } from '../progress.js';
import { esc, T, stepsHTML } from '../typeset.js';
import { topbar } from './layout.js';
import { fieldsHTML } from './question-form.js';
import { state } from './state.js';

function exampleHTML(ex, key) {
  const st = ex.steps;
  return `<div class="ex" data-ex="${key}"><div class="lab">Voorbeeld</div><div>${ex.q}</div><ul class="steps">${st.map((s, i) => `<li ${i ? 'hidden' : ''}>${typeof s === 'string' ? T(s) : s.h}</li>`).join('')}</ul>${st.length > 1 ? `<div class="row"><button class="btn quiet" type="button" data-act="exnext">Volgende stap</button></div>` : ''}</div>`;
}
function vLearn(s) {
  return (
    s.learn
      .map(
        (b, i) =>
          `<div class="block"><h3>${T(b.t)}</h3>${(b.p || []).map((x) => `<p>${/<span|<table/.test(x) ? x : T(x)}</p>`).join('')}${b.how ? `<ol class="how">${b.how.map((x) => `<li>${/<span/.test(x) ? x : T(x)}</li>`).join('')}</ol>` : ''}${b.widget ? `<div data-widget="${b.widget}"></div>` : ''}${b.ex ? exampleHTML(b.ex, i) : ''}${b.watch ? `<p class="watch"><b>Let op:</b> ${/<span/.test(b.watch) ? b.watch : T(b.watch)}</p>` : ''}</div>`,
      )
      .join('') +
    `<div class="row"><button class="btn main" type="button" data-act="tab" data-tab="oefen">Ga oefenen</button></div>`
  );
}
function vVideos(s) {
  return s.videos.length
    ? `<p class="muted small">Video's van Wiskunde met Bob Pruiksma. Ze openen op YouTube.</p><ul class="vids">${s.videos.map(([t, id]) => `<li><a href="https://youtu.be/${id}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ul>`
    : '<p>Bij deze voorkennis staat geen video in de lijst.</p>';
}
function newQuestion(s) {
  const st = state.prac[s.id];
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
  const st = state.prac[s.id] || (state.prac[s.id] = { right: 0, total: 0 });
  if (!st.q) newQuestion(s);
  const q = st.q,
    done = st.status === 'right' || st.status === 'shown';
  const chips = `<div class="chips"><button class="chip" type="button" data-act="filter" data-id="" aria-pressed="${!st.filter}">Alles door elkaar</button>${s.skills.map((k) => `<button class="chip" type="button" data-act="filter" data-id="${k.id}" aria-pressed="${st.filter === k.id}">${T(k.name)}${prog.skills[k.id] ? `<span class="n">${Math.round(skillPct(k.id) * 5)}/5</span>` : ''}</button>`).join('')}</div>`;
  return `${chips}<div class="sheet fade"><div class="row small muted" style="justify-content:space-between"><span>${T(st.skill.name)}</span><span>${st.total ? `${st.right} van ${st.total} goed deze ronde` : ''}</span></div>
  <div class="q">${q.q}</div>${q.fig ? `<div class="figbox">${q.fig}</div>` : ''}
  <form id="pform" class="block" novalidate>${fieldsHTML(q, 'p', st.vals, st.marks, done)}${!q.mc && q.fields.some((f) => !f.sel) ? `<p class="small muted">Een breuk mag ook: 1/2 of 1 1/2. Een kommagetal schrijf je als 3,5.</p>` : ''}
  ${st.msg ? `<div class="fb ${st.status === 'right' ? 'good' : 'bad'}">${st.msg}</div>` : ''}
  ${st.hint && !done ? `<div class="hintb"><b>Hint:</b> ${/<span/.test(q.hint) ? q.hint : T(q.hint)}</div>` : ''}
  <div class="row">${done ? `<button class="btn main" type="submit" id="nextq">Volgende vraag</button>` : `<button class="btn main" type="submit">Controleer</button>${st.hint ? '' : `<button class="btn" type="button" data-act="hint">Hint</button>`}<button class="btn quiet" type="button" data-act="show">Toon uitwerking</button>`}${st.status === 'right' && !st.sol ? `<button class="btn quiet" type="button" data-act="showsol">Bekijk uitwerking</button>` : ''}</div></form>
  ${st.status === 'shown' || st.sol ? `<div class="sol"><h3>Uitwerking</h3>${stepsHTML(q.steps)}</div>` : ''}</div>`;
}
function vSec(s) {
  const tab = state.view.tab || 'uitleg',
    c = s.ch;
  const body =
    tab === 'uitleg'
      ? `<div class="sheet">${vLearn(s)}</div>`
      : tab === 'oefen'
        ? vPractice(s)
        : `<div class="sheet">${vVideos(s)}</div>`;
  return `${topbar()}<div class="c${c}" style="display:grid;gap:16px"><div class="head"><span class="small muted">Hoofdstuk ${c}</span><h1>${s.num === 'V' ? '' : s.num + ' '}${T(s.title)}</h1></div>
  ${s.core ? '' : `<p class="notice">Voor deze paragraaf heb je geen uitwerkingen uit het boek. De uitleg en vragen volgen de onderwerpen van de video's. Vraag je docent of dit bij de toets hoort.</p>`}
  <div class="tabs" role="tablist">${[
    ['uitleg', 'Uitleg'],
    ['oefen', 'Oefenen'],
    ['video', "Video's"],
  ]
    .map(
      ([k, n]) =>
        `<button class="tab" type="button" role="tab" aria-selected="${tab === k}" data-act="tab" data-tab="${k}">${n}</button>`,
    )
    .join('')}</div>${body}</div>`;
}

export { vSec, newQuestion };
