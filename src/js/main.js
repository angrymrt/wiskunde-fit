// Startpunt van de app: kiest het juiste scherm en verwerkt klikken en formulieren.
import { checkAnswer, findTrap } from './answers.js';
import { SECTIONS, SEC } from './paragraphs/index.js';
import { prog, save, rec, resetProgress } from './progress.js';
import {
  buildTest,
  vToetsSetup,
  vToetsRun,
  vToetsRes,
  storeTest,
  finishTest,
  fmtT,
} from './ui/exam.js';
import { vHome } from './ui/home.js';
import { vSec, newQuestion } from './ui/paragraph.js';
import { readVals, unreadable, empty } from './ui/question-form.js';
import { state, app } from './ui/state.js';
import { mountWidgets } from './ui/widgets.js';

const go = (v) => {
  state.view = v;
  state.confirmReset = false;
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
  render();
  try {
    window.scrollTo(0, 0);
  } catch (e) {}
};
function render() {
  let html = '';
  if (state.view.name === 'home') html = vHome();
  else if (state.view.name === 'sec') html = vSec(SEC[state.view.id]);
  else if (state.view.name === 'toets') html = vToetsSetup();
  else if (state.view.name === 'toetsrun') html = vToetsRun();
  else if (state.view.name === 'toetsres') html = vToetsRes();
  app.innerHTML = html;
  mountWidgets();
  if (state.view.name === 'toetsrun' && !state.timer)
    state.timer = setInterval(() => {
      const c = document.getElementById('clock');
      if (c && state.test) c.textContent = fmtT(Math.floor((Date.now() - state.test.start) / 1000));
    }, 1000);
}
app.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const a = b.dataset.act,
    id = b.dataset.id;
  if (a === 'home') return go({ name: 'home' });
  if (a === 'toets') return go({ name: 'toets' });
  if (a === 'sec') return go({ name: 'sec', id, tab: 'uitleg' });
  if (a === 'secp') return go({ name: 'sec', id, tab: 'oefen' });
  if (a === 'tab') {
    state.view.tab = b.dataset.tab;
    render();
    return;
  }
  if (a === 'reset1') {
    state.confirmReset = true;
    render();
    return;
  }
  if (a === 'reset0') {
    state.confirmReset = false;
    render();
    return;
  }
  if (a === 'reset2') {
    resetProgress();
    state.prac = {};
    state.confirmReset = false;
    render();
    return;
  }
  if (a === 'exnext') {
    const ex = b.closest('.ex'),
      hid = ex.querySelector('li[hidden]');
    if (hid) hid.hidden = false;
    if (!ex.querySelector('li[hidden]')) b.hidden = true;
    return;
  }
  if (a === 'filter') {
    const s = SEC[state.view.id],
      st = state.prac[s.id];
    st.filter = id || null;
    newQuestion(s);
    render();
    return;
  }
  if (a === 'hint') {
    const st = state.prac[state.view.id];
    st.vals = readVals(st.q, 'p');
    st.hint = true;
    render();
    return;
  }
  if (a === 'show') {
    const st = state.prac[state.view.id];
    st.vals = readVals(st.q, 'p');
    if (st.first) {
      rec(st.skill.id, false);
      st.total++;
      st.first = false;
    }
    st.status = 'shown';
    st.msg = '';
    st.marks = st.q.mc ? { each: [String(st.vals[0]) === String(st.q.mc.a)], reveal: true } : null;
    render();
    return;
  }
  if (a === 'showsol') {
    state.prac[state.view.id].sol = true;
    render();
    return;
  }
  if (a === 'scope') {
    prog.scope = id;
    save();
    render();
    return;
  }
  if (a === 'len') {
    state.view.n = +id;
    render();
    return;
  }
  if (a === 'start') {
    state.test = {
      items: buildTest(prog.scope || 'all', state.view.n || 20),
      i: 0,
      start: Date.now(),
    };
    return go({ name: 'toetsrun' });
  }
  if (a === 'goto') {
    storeTest();
    state.test.i = +id;
    state.test.warn = false;
    render();
    return;
  }
  if (a === 'tprev') {
    storeTest();
    state.test.i--;
    state.test.warn = false;
    render();
    return;
  }
  if (a === 'tfin') {
    storeTest();
    const f = (x) =>
      x.vals.length && (x.q.mc ? x.vals[0] !== '' : x.vals.some((v) => String(v).trim()));
    if (state.test.items.some((x) => !f(x)) && !state.test.warn) {
      state.test.warn = true;
      render();
      return;
    }
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    finishTest();
    return go({ name: 'toetsres' });
  }
});
app.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.id === 'tform') {
    storeTest();
    state.test.i++;
    state.test.warn = false;
    render();
    const n = document.getElementById('tf0');
    if (n) n.focus();
    return;
  }
  if (e.target.id === 'pform') {
    const s = SEC[state.view.id],
      st = state.prac[s.id];
    if (st.status === 'right' || st.status === 'shown') {
      newQuestion(s);
      render();
      const n = document.getElementById('pf0');
      if (n) n.focus();
      return;
    }
    const vals = readVals(st.q, 'p');
    st.vals = vals;
    if (empty(st.q, vals)) {
      st.status = 'wrong';
      st.msg = 'Vul eerst alle antwoorden in.';
      st.marks = null;
      render();
      return;
    }
    if (unreadable(st.q, vals)) {
      st.status = 'wrong';
      st.msg = 'Dit getal kan ik niet lezen. Schrijf bijvoorbeeld -2, 3,5 of 1 1/2.';
      st.marks = null;
      render();
      return;
    }
    const c = checkAnswer(st.q, vals);
    if (st.first) {
      rec(st.skill.id, c.ok);
      st.total++;
      if (c.ok) st.right++;
      st.first = false;
    }
    st.marks = c;
    if (c.ok) {
      st.status = 'right';
      st.msg = 'Goed gedaan!';
    } else {
      st.status = 'wrong';
      st.msg = findTrap(st.q, vals) || 'Nog niet goed. Probeer het nog eens, of bekijk de hint.';
    }
    render();
    const n = document.getElementById('nextq');
    if (n) n.focus();
  }
});
/* Alleen voor tests/browser.e2e.js: zo kan de browsertest de juiste antwoorden opvragen. */
window.wiskundefit = { state, SECTIONS, SEC, prog, go };
render();
