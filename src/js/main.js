// Startpunt van de app: kiest het juiste scherm en verwerkt klikken en formulieren.
import { Idiomorph } from 'idiomorph';
import { checkAnswer, fillState, findTrap } from './answers.js';
import { rd } from './math.js';
import { TOPICS, TOPIC } from './topics/index.js';
import { MAPPING, MAPPINGS } from './mappings/index.js';
import { STORE, load, prog, rec, resetProgress, update } from './progress.js';
import { pathFor, titleFor, viewFor } from './routes.js';
import { ALL_IDS, setStof, stofTopic, toggleStof } from './stof.js';
import {
  TEST_KEY,
  RESULT_KEY,
  buildTest,
  loadTests,
  saveTest,
  storeTest,
  toQuestion,
  stopTest,
  forgetTests,
  finishTest,
  pauseClock,
  clockText,
} from './ui/exam.js';
import { newQuestion, applySoort } from './ui/topic.js';
import { showDrawn, tapGrid } from './ui/draw.js';
import { readVals, unreadable, empty } from './ui/question-form.js';
import { screenHTML } from './ui/screens.js';
import { state, app } from './ui/state.js';
import { runClock, sent, telPoging, telToets, telValkuil } from './ui/tellen.js';
import { mountWidgets } from './ui/widgets.js';

const here = () => location.pathname + location.search;
function stopTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}
// render() vervangt de velden, dus bewaar eerst wat de leerling heeft ingevuld.
function keepTyped() {
  if (state.test) storeTest();
  if (document.getElementById('pform')) {
    const st = state.prac[state.view.slug];
    st.vals = readVals(st.q, 'p');
  }
}
function leave() {
  keepTyped();
  if (state.test) pauseClock(state.test);
  stopTimer();
}
function show(v, focus) {
  state.view = v;
  state.confirmReset = false;
  state.stopped = false;
  state.shared = null;
  if (v.oefen) applySoort(TOPIC[v.slug], v.soort, v.seed);
  render(focus);
}
// De browser zet de scrollpositie niet goed terug, want het scherm bestaat dan nog niet. Daarom
// staat die bij elke stap in de geschiedenis.
let scrollSave;
const saveScroll = () => {
  clearTimeout(scrollSave);
  history.replaceState({ scroll: window.scrollY }, '');
};
// Bij het openen staat de pagina er al. Wie al aan het lezen was, blijft dan op die plek.
function restoreScroll(opening) {
  const { scroll } = history.state || {};
  if (scroll != null) window.scrollTo(0, scroll);
  else if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  else if (!opening) window.scrollTo(0, 0);
}
// Met een hash, zoals /#meetkunde, gaat de focus naar de kop van dat deel van het scherm.
const go = (v, hash = '') => {
  leave();
  saveScroll();
  const path = pathFor(v);
  if (path === here() && !hash) history.replaceState(null, '', path);
  else history.pushState(null, '', path + hash);
  window.scrollTo(0, 0);
  show(v, hash ? `${hash} h2, h2${hash}` : 'h1');
};
// Toont het scherm dat bij het adres hoort: bij het openen en bij de terugknop.
function arrive(focus) {
  const opening = prebuilt;
  let found = viewFor(location.pathname, location.search);
  // Een adres met hoofdletters, zoals /Over, bestaat niet. Bestaat het in kleine letters wel, dan
  // gaan we daarheen.
  if (found.name === 'missing') {
    const lower = viewFor(location.pathname.toLowerCase(), location.search);
    if (lower.name !== 'missing') found = lower;
  }
  // Zonder stofkeuze valt er niets te oefenen.
  const v = found.name === 'stofoefen' && !prog.stof ? { name: 'stof' } : found;
  const path = pathFor(v);
  if (path !== here()) history.replaceState(history.state, '', path + location.hash);
  show(v, focus);
  restoreScroll(opening);
}
// Geeft een selector voor het element met de focus, om dat na het vervangen terug te vinden.
function focusedSelector() {
  const el = document.activeElement;
  if (!el || !app.contains(el)) return null;
  if (el.id) return `#${el.id}`;
  const { act, id } = el.dataset;
  if (!act) return null;
  return `[data-act="${act}"]${id === undefined ? '' : `[data-id="${id}"]`}`;
}
function focusOn(selector) {
  const el = app.querySelector(selector);
  if (!el) return false;
  if (!el.matches('button, input, select')) el.tabIndex = -1;
  el.focus();
  return document.activeElement === el;
}
// Bij het openen staat het scherm al in de pagina, vooraf gebouwd. De eerste render() past dan
// alleen aan wat anders is, zoals de voortgang. Zo blijven de focus, de scrollpositie en de plek
// van een schermlezer staan, en verspringt er niets.
let prebuilt = app.firstElementChild !== null;
// render() vervangt het hele scherm en daarmee het element met de focus. Zonder dit begint wie
// het toetsenbord of een schermlezer gebruikt na elke klik weer bovenaan de pagina.
// Geef een selector mee om de focus ergens anders te zetten dan waar die stond.
function render(focus) {
  const target = focus || focusedSelector();
  if (prebuilt) Idiomorph.morph(app, screenHTML(), { morphStyle: 'innerHTML' });
  else app.innerHTML = screenHTML();
  prebuilt = false;
  document.title = titleFor(state.view);
  // Half aangevinkt kan alleen vanuit JavaScript. Een schermlezer zegt dan "half aangevinkt".
  app.querySelectorAll('input[data-mixed]').forEach((el) => (el.indeterminate = true));
  mountWidgets();
  showDrawn();
  watchPracticeBar();
  runClock();
  if (target && !focusOn(target)) focusOn('h1');
  if (state.view.name === 'toets' && state.test) {
    if (!state.test.since) state.test.since = Date.now();
    if (!state.timer)
      state.timer = setInterval(() => {
        const c = document.getElementById('clock');
        if (c && state.test) c.textContent = clockText(state.test);
      }, 1000);
  }
}
// Licht of donker. Zonder keuze volgt de site het apparaat. Kies je met de knop hetzelfde als het
// apparaat, dan vergeet de site de keuze, zodat die het apparaat weer volgt, ook als dat later
// vanzelf wisselt. Het script in de <head> van index.html zet een keuze bij het laden.
const THEME_KEY = 'wiskundefit-thema';
const deviceDark = matchMedia('(prefers-color-scheme: dark)');
const deviceTheme = () => (deviceDark.matches ? 'dark' : 'light');
const theme = () => document.documentElement.dataset.theme || deviceTheme();
state.dark = theme() === 'dark';
function setTheme(next) {
  const root = document.documentElement;
  const stored = next === deviceTheme() ? null : next;
  if (stored) root.dataset.theme = stored;
  else delete root.dataset.theme;
  try {
    if (stored) localStorage.setItem(THEME_KEY, stored);
    else localStorage.removeItem(THEME_KEY);
  } catch (e) {}
  state.dark = next === 'dark';
}
// Oudere Safari kent alleen addListener.
const onDeviceTheme = () => {
  state.dark = theme() === 'dark';
  keepTyped();
  render();
};
if (deviceDark.addEventListener) deviceDark.addEventListener('change', onDeviceTheme);
else deviceDark.addListener(onDeviceTheme);
// Op een telefoon verschijnt de balk met "Ga oefenen" pas als de knop onder de intro uit beeld is.
// De balk begint verborgen, zodat hij bij het laden niet even in beeld staat.
let barWatch;
function watchPracticeBar() {
  barWatch?.disconnect();
  const bar = app.querySelector('.practice-bar'),
    button = app.querySelector('.topic-actions .btn.main');
  if (!bar || !button) return;
  if (!('IntersectionObserver' in window)) return bar.classList.remove('away');
  barWatch = new IntersectionObserver(([e]) => bar.classList.toggle('away', e.isIntersecting));
  barWatch.observe(button);
}
app.addEventListener('input', showDrawn);
app.addEventListener('click', (e) => {
  const grid = e.target.closest('svg[data-draw]');
  if (grid) return tapGrid(grid, e);
  // De link naar de inhoud zet de focus daar, zonder #inhoud in het adres.
  if (e.target.closest('a.skip')) {
    e.preventDefault();
    focusOn('main');
    return;
  }
  // Een link binnen de site wisselt alleen van scherm, tenzij je die in een nieuw tabblad opent.
  const link = e.target.closest('a[href^="/"]');
  if (link) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (link.dataset.act === 'kiesgo') update((p) => (p.mapping = link.dataset.id));
    const { pathname, search, hash } = new URL(link.href);
    return go(viewFor(pathname, search), hash);
  }
  if (e.target.closest('a[href^="#"]')) return saveScroll();
  const b = e.target.closest('[data-act]');
  if (!b) return;
  // Safari geeft een knop geen focus bij een klik, en dan vindt render() hem niet terug.
  b.focus();
  const a = b.dataset.act,
    id = b.dataset.id;
  if (a === 'thema') {
    setTheme(state.dark ? 'light' : 'dark');
    keepTyped();
    render();
    return;
  }
  if (a === 'boekfilter' || a === 'boekfilterclear') {
    const filters = { ...state.view.filters };
    if (a === 'boekfilter') {
      const [key, value] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
      const values = filters[key] || [];
      filters[key] = values.includes(value)
        ? values.filter((v) => v !== value)
        : [...values, value];
    }
    // Via het adres, zodat de volgorde net zo wordt als bij een gedeelde link.
    const { pathname, search } = new URL(
      pathFor({ name: 'kies', filters: a === 'boekfilter' ? filters : {} }),
      location.href,
    );
    state.view = viewFor(pathname, search);
    // Een ander filter is geen nieuw scherm, dus de terugknop slaat dat over.
    history.replaceState(history.state, '', pathFor(state.view));
    render(a === 'boekfilterclear' ? '.found-count [role="status"]' : undefined);
    return;
  }
  if (a === 'share') {
    const url = new URL(id, location.href).href;
    // Op een telefoon het deelmenu van het toestel, zodat je de link in een chat zet. Op een
    // computer is dat menu onhandig, en dan kopiëren we de link.
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      // Wie het menu sluit zonder te delen, krijgt een fout. Dat is geen probleem.
      navigator.share({ text: 'Kun je me helpen met deze vraag?', url }).catch(() => {});
      return;
    }
    const copy = navigator.clipboard
      ? navigator.clipboard.writeText(url).then(
          () => true,
          () => false,
        )
      : Promise.resolve(false);
    copy.then((copied) => {
      keepTyped();
      state.shared = { path: id, url, copied };
      render(copied ? undefined : '.share-link input');
      if (!copied) app.querySelector('.share-link input')?.select();
    });
    return;
  }
  if (a === 'boekfilters' || a === 'boekfiltersdone') {
    state.filtersOpen = a === 'boekfilters' && !state.filtersOpen;
    render(a === 'boekfiltersdone' ? '.found-count [role="status"]' : undefined);
    return;
  }
  if (a === 'para' || a === 'chapter') {
    // Iets aanvinken maakt dit je boek. Alleen de pagina openen niet, want dat kan via een link zijn.
    update((p) => (p.mapping = state.view.id));
    const chapters = MAPPING[state.view.id].chapters;
    const paragraphs =
      a === 'chapter'
        ? chapters.find((c) => c.number === id).paragraphs
        : chapters.flatMap((c) => c.paragraphs).filter((p) => p.number === id);
    toggleStof(paragraphs.flatMap((p) => p.skills));
    render();
    return;
  }
  if (a === 'topicpick') {
    toggleStof(TOPIC[id].skills.map((k) => k.id));
    render();
    return;
  }
  if (a === 'stofall') {
    setStof(ALL_IDS);
    render();
    return;
  }
  if (a === 'stofclear') {
    setStof([]);
    render('h1');
    return;
  }
  if (a === 'reset1') {
    state.confirmReset = true;
    render('[data-act="reset2"]');
    return;
  }
  if (a === 'reset0') {
    state.confirmReset = false;
    render('[data-act="reset1"]');
    return;
  }
  if (a === 'reset2') {
    resetProgress();
    forgetTests();
    stopTimer();
    state.prac = {};
    state.confirmReset = false;
    render();
    return;
  }
  if (a === 'exnext') {
    const ex = b.closest('.ex'),
      hid = ex.querySelector('li[hidden]');
    if (hid) hid.hidden = false;
    if (!ex.querySelector('li[hidden]')) {
      b.hidden = true;
      hid.tabIndex = -1;
      hid.focus();
    }
    return;
  }
  if (a === 'filter') {
    const s = TOPIC[state.view.slug],
      st = state.prac[s.slug];
    st.filter = id ? Number(id) : null;
    newQuestion(s);
    state.view.soort = st.filter;
    delete state.view.seed;
    // Een andere keuze is geen nieuw scherm, dus de terugknop slaat die over.
    history.replaceState(history.state, '', pathFor(state.view));
    render();
    return;
  }
  if (a === 'hint') {
    const st = state.prac[state.view.slug];
    st.vals = readVals(st.q, 'p');
    st.hint = true;
    render('.hintb');
    return;
  }
  if (a === 'show') {
    const st = state.prac[state.view.slug];
    st.vals = readVals(st.q, 'p');
    if (st.first) {
      rec(st.skill.id, false);
      telPoging(st, 'uitwerking');
      st.total++;
      st.first = false;
    }
    st.status = 'shown';
    st.msg = '';
    st.marks = st.q.mc ? { each: [String(st.vals[0]) === String(st.q.mc.a)], reveal: true } : null;
    render('.sol');
    return;
  }
  if (a === 'showsol') {
    state.prac[state.view.slug].sol = true;
    render('.sol');
    return;
  }
  if (a === 'len') {
    state.len = +id;
    render();
    return;
  }
  if (a === 'start') {
    state.test = { items: buildTest(prog.stof, state.len), i: 0, spent: 0, since: null };
    saveTest();
    return go({ name: 'toets' });
  }
  if (a === 'tstop1' || a === 'tstop0') {
    storeTest();
    state.test.confirmStop = a === 'tstop1';
    render(a === 'tstop1' ? '[data-act="tstop2"]' : '[data-act="tstop1"]');
    return;
  }
  if (a === 'tstop2') {
    stopTest();
    stopTimer();
    state.stopped = true;
    render('#stopped');
    return;
  }
  if (a === 'goto') {
    storeTest();
    toQuestion(+id);
    render('#tq');
    return;
  }
  if (a === 'tprev') {
    storeTest();
    toQuestion(state.test.i - 1);
    render('#tq');
    return;
  }
  if (a === 'tfin') {
    storeTest();
    const done = (x) => fillState(x.q, x.vals) === 'ingevuld';
    if (!state.test.items.every(done) && !state.test.warn) {
      state.test.warn = true;
      render();
      return;
    }
    finishTest();
    telToets(state.result.items);
    return go({ name: 'toetsres' });
  }
});
app.addEventListener('submit', (e) => {
  e.preventDefault();
  if (e.target.id === 'tform') {
    storeTest();
    // Op de laatste vraag is er geen knop Volgende, maar Enter verstuurt het formulier toch. Dan
    // blijft het antwoord bewaard en gaat de focus naar Inleveren, zonder al in te leveren.
    if (state.test.i === state.test.items.length - 1) {
      render('[data-act="tfin"]');
      return;
    }
    toQuestion(state.test.i + 1);
    render('#tq');
    focusOn('#tf0');
    return;
  }
  if (e.target.id === 'pform') {
    const s = state.view.name === 'stofoefen' ? stofTopic() : TOPIC[state.view.slug],
      st = state.prac[s.slug];
    if (st.status === 'right' || st.status === 'shown') {
      newQuestion(s);
      // De seed in het adres hoorde bij de vorige vraag.
      if (state.view.seed !== undefined) {
        delete state.view.seed;
        history.replaceState(history.state, '', pathFor(state.view));
      }
      render('#pq');
      focusOn('#pf0');
      return;
    }
    const vals = readVals(st.q, 'p');
    st.vals = vals;
    if (empty(st.q, vals)) {
      st.status = 'wrong';
      st.msg = 'Vul eerst alle antwoorden in.';
      st.marks = null;
      render('#pfb');
      return;
    }
    if (unreadable(st.q, vals)) {
      st.status = 'wrong';
      st.msg = 'Dit getal kan ik niet lezen. Schrijf bijvoorbeeld -2, 3,5 of 1 1/2.';
      st.marks = null;
      render('#pfb');
      return;
    }
    const c = checkAnswer(st.q, vals);
    if (st.first) {
      rec(st.skill.id, c.ok);
      telPoging(st, c.ok ? 'goed' : 'fout');
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
      const trap = findTrap(st.q, vals);
      telValkuil(st, trap);
      st.msg = trap?.m || 'Nog niet goed. Probeer het nog eens, of bekijk de hint.';
    }
    render(c.ok ? '#nextq' : '#pfb');
  }
});
window.addEventListener('popstate', () => {
  // Een link naar een plek op hetzelfde scherm, zoals de video's, geeft ook dit signaal. Bouw het
  // scherm dan niet opnieuw op, want dan gaat wat je hebt ingevuld verloren.
  const { pathname, search } = location;
  if (pathFor(viewFor(pathname, search)) === pathFor(state.view)) return restoreScroll();
  leave();
  arrive('h1');
});
window.addEventListener(
  'scroll',
  () => {
    clearTimeout(scrollSave);
    scrollSave = setTimeout(saveScroll, 200);
  },
  { passive: true },
);
// Een telefoon kan een pagina op de achtergrond zonder waarschuwing afsluiten.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') keepTyped();
  runClock();
});
// Een ander tabblad heeft iets bewaard. Neem dat over, zodat beide tabbladen hetzelfde laten zien
// en het ene tabblad het werk van het andere niet overschrijft. Bij de proeftoets volgt dit tabblad
// het andere: een antwoord dat je daar invult, staat hier ook, en lever je daar in, dan ziet dit
// tabblad de uitslag. key is null als een ander tabblad alles heeft gewist.
window.addEventListener('storage', (e) => {
  const progress = e.key === STORE || e.key === null,
    tests = e.key === TEST_KEY || e.key === RESULT_KEY || e.key === null;
  if (!progress && !tests) return;
  if (progress) load();
  if (tests) {
    loadTests();
    if (!state.test) stopTimer();
  }
  render();
});
window.addEventListener('pagehide', () => {
  keepTyped();
  saveScroll();
});
/* Alleen voor tests/browser.e2e.js: zo kan de browsertest de juiste antwoorden en de tellen
   opvragen. */
window.wiskundefit = { state, TOPICS, TOPIC, MAPPINGS, prog, go, sent, rd };
history.scrollRestoration = 'manual';
loadTests();
arrive();
