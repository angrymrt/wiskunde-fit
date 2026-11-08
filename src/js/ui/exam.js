// De proeftoets: samenstellen, afnemen, bewaren en nakijken.
import { checkAnswer } from '../answers.js';
import { shuffle, Q, near, rd, isNice, d, fr } from '../math.js';
import { TOPICS } from '../topics/index.js';
import { rec } from '../progress.js';
import { pathFor, to } from '../routes.js';
import { chosenTopics, topicOf } from '../stof.js';
import { esc, T, stepsHTML } from '../typeset.js';
import { fieldsHTML, readVals } from './question-form.js';
import { state } from './state.js';
import { bookPath } from './stof.js';

// Een lopende proeftoets en de laatste uitslag blijven in de browser bewaard, los van de voortgang.
const TEST_KEY = 'wiskundefit-proeftoets';
const RESULT_KEY = 'wiskundefit-uitslag';
// Verhoog dit als de vorm verandert. Wat dan nog in een browser staat, wordt niet meer gelezen.
const STORED = 1;

const elapsed = (t) => t.spent + (t.since ? Date.now() - t.since : 0);
// De klok loopt alleen zolang de proeftoets open is, ook als je die later afmaakt.
const pauseClock = (t) => {
  t.spent = elapsed(t);
  t.since = null;
};
function write(key, t) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        ...t,
        v: STORED,
        spent: elapsed(t),
        since: null,
        items: t.items.map(({ topic, skill, ...x }) => ({ ...x, id: skill.id })),
      }),
    );
  } catch (e) {}
}
// Geeft null als er niets is of als een vraagsoort niet meer bestaat.
function read(key) {
  try {
    const t = JSON.parse(localStorage.getItem(key));
    if (t?.v !== STORED) return null;
    t.items = t.items.map(({ id, ...x }) => {
      const topic = topicOf(id);
      return { ...x, topic, skill: topic.skills.find((k) => k.id === id) };
    });
    return t;
  } catch (e) {
    return null;
  }
}
function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}
function loadTests() {
  state.test = read(TEST_KEY);
  state.result = read(RESULT_KEY);
}
const saveTest = () => write(TEST_KEY, state.test);
function stopTest() {
  state.test = null;
  remove(TEST_KEY);
}
function forgetTests() {
  stopTest();
  state.result = null;
  remove(RESULT_KEY);
}

function buildTest(ids, n) {
  const groups = chosenTopics(ids),
    pools = new Map(groups.map((g) => [g.topic.slug, shuffle(g.skills)])),
    out = [];
  let round = shuffle(groups);
  while (out.length < n) {
    for (const { topic, skills } of round) {
      if (out.length >= n) break;
      if (!pools.get(topic.slug).length) pools.set(topic.slug, shuffle(skills));
      const sk = pools.get(topic.slug).pop();
      out.push({ topic, skill: sk, q: sk.gen(), vals: [] });
    }
  }
  const order = TOPICS.map((s) => s.slug);
  out.sort((a, b) => order.indexOf(a.topic.slug) - order.indexOf(b.topic.slug));
  return out;
}
function vToetsSetup() {
  const n = state.len,
    groups = chosenTopics();
  const intro = `<h1 style="font-size:clamp(1.7rem,5vw,2.4rem)">Proeftoets</h1><p>Je krijgt vragen uit jouw stof, zonder hints. Pas aan het eind zie je wat goed en fout is, met de uitwerkingen erbij. Zet een rekenmachine en kladpapier klaar.</p>`;
  if (!groups.length)
    return `<div class="sheet">${intro}<div class="setup"><b>Welke stof?</b><p class="small muted">Een proeftoets gaat over jouw stof. Kies die eerst.</p><div class="row"><a class="btn main" href="${bookPath()}">Kies uit je boek</a><a class="btn" href="${to('stof')}">Kies op onderwerp</a><button class="btn" type="button" data-act="stofall">Alle stof</button></div></div></div>`;
  return `<div class="sheet">${intro}
  <div class="setup"><b>Welke stof?</b><p class="small">Jouw stof: ${groups.map((g) => T(g.topic.title)).join(', ')}.</p><div><a class="linkbtn" href="${to('stof')}">Wijzig jouw stof</a></div></div>
  <div class="setup"><b>Hoeveel vragen?</b><div class="chips">${[10, 15, 20, 30].map((k) => `<button class="chip" type="button" data-act="len" data-id="${k}" aria-pressed="${n === k}">${k} vragen</button>`).join('')}</div></div>
  <div class="row"><button class="btn main" type="button" data-act="start">Start de proeftoets</button></div></div>`;
}
const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const clockText = (t) => fmtT(Math.floor(elapsed(t) / 1000));
function vToetsRun() {
  const t = state.test,
    i = t.i,
    it = t.items[i];
  const filled = (x) =>
    x.vals.length && (x.q.mc ? x.vals[0] !== '' : x.vals.some((v) => String(v).trim()));
  const open = t.items.filter((x) => !filled(x)).length;
  return `<div class="sheet"><div class="row" style="justify-content:space-between"><h1 class="plain-h">Vraag ${i + 1} van ${t.items.length}</h1><span class="muted small">Tijd <span id="clock" style="font-variant-numeric:tabular-nums">${clockText(t)}</span></span></div>
  <div class="grid-nav">${t.items.map((x, k) => `<button class="gn ${filled(x) ? 'fill' : ''} ${k === i ? 'cur' : ''}" type="button" data-act="goto" data-id="${k}" aria-label="Ga naar vraag ${k + 1}">${k + 1}</button>`).join('')}</div>
  <div class="small muted">${T(it.topic.title)}</div><div class="q" id="tq">${it.q.q}</div>${it.q.fig ? `<div class="figbox">${it.q.fig}</div>` : ''}
  <form id="tform" class="block" novalidate>${fieldsHTML(it.q, 't', it.vals)}<div class="row"><button class="btn" type="button" data-act="tprev" ${i ? '' : 'disabled'}>Vorige</button>${i < t.items.length - 1 ? `<button class="btn main" type="submit">Volgende</button>` : ''}<button class="btn ${i === t.items.length - 1 ? 'main' : 'quiet'}" type="button" data-act="tfin" ${t.warn ? 'aria-describedby="tfb"' : ''}>Inleveren</button></div>
  ${t.warn ? `<div class="fb bad" id="tfb">Je hebt nog ${open} ${open === 1 ? 'vraag' : 'vragen'} open. Klik nog een keer op Inleveren als je toch wilt stoppen.</div>` : ''}</form>
  ${t.confirmStop ? `<p class="small">Wil je stoppen? Je antwoorden gaan dan verloren en deze proeftoets telt niet mee.</p><div class="row"><button class="btn quiet" type="button" data-act="tstop2">Ja, stop de proeftoets</button><button class="btn quiet" type="button" data-act="tstop0">Annuleren</button></div>` : `<div class="row"><button class="btn quiet" type="button" data-act="tstop1">Stoppen zonder inleveren</button></div>`}</div>`;
}
// Bewaart wat er op het scherm is ingevuld. Doet niets als de vraag niet op het scherm staat.
function storeTest() {
  if (!document.getElementById('tform')) return;
  state.test.items[state.test.i].vals = readVals(state.test.items[state.test.i].q, 't');
  saveTest();
}
function finishTest() {
  let score = 0,
    max = 0;
  const t = state.test;
  t.items.forEach((x) => {
    const c = x.vals.length
      ? checkAnswer(x.q, x.vals)
      : { each: x.q.mc ? [false] : x.q.fields.map(() => false), ok: false };
    x.c = c;
    x.got = c.each.filter(Boolean).length;
    x.max = c.each.length;
    score += x.got;
    max += x.max;
    rec(x.skill.id, c.ok);
  });
  t.score = score;
  t.max = max;
  t.time = Math.floor(elapsed(t) / 1000);
  // Alleen de laatste uitslag blijft bewaard, dus de vorige verdwijnt nu pas.
  state.result = t;
  write(RESULT_KEY, t);
  stopTest();
}
function perTopic(items) {
  const per = new Map();
  for (const x of items) {
    const p = per.get(x.topic) || { s: x.topic, got: 0, max: 0 };
    p.got += x.got;
    p.max += x.max;
    per.set(x.topic, p);
  }
  return [...per.values()].map((p) => ({ ...p, r: p.got / p.max })).sort((a, b) => a.r - b.r);
}
function vToetsRes() {
  const t = state.result;
  if (!t)
    return `<div class="sheet"><h1 style="font-size:clamp(1.7rem,5vw,2.4rem)">Je resultaat</h1><p>Je ziet hier je resultaat zodra je een proeftoets hebt ingeleverd. Maak dus eerst een proeftoets.</p><div class="row"><a class="btn main" href="${to('toets')}">${state.test ? 'Ga verder met je proeftoets' : 'Maak een proeftoets'}</a></div></div>`;
  const grade = 1 + (9 * t.score) / t.max,
    weak = perTopic(t.items);
  return `<div class="sheet"><h1 style="font-size:clamp(1.7rem,5vw,2.4rem)">Je resultaat</h1><div class="row" style="gap:24px"><div class="score">${t.score}/${t.max}</div><div><div>punten in ${fmtT(t.time)} minuten</div><div class="muted small">Dat is ongeveer een ${d(rd(grade, 1))} met de formule cijfer = 1 + 9 × punten / maximum. Je docent kan anders normeren.</div></div></div>
  <h2 class="h3">Per onderwerp</h2><div class="res">${weak
    .map((w) => {
      const pc = Math.round(w.r * 100);
      return `<a class="par color-${w.s.domain.color}" href="${pathFor({ name: 'topic', slug: w.s.slug, oefen: true })}" style="border-top:0;padding:4px 0"><span>${T(w.s.title)}</span><span class="pct">${w.got} van ${w.max}</span><span class="bar ${pc >= 80 ? 'done' : ''}"><i style="width:${pc}%"></i></span></a>`;
    })
    .join('')}</div>
  <p class="small muted">Klik op een onderwerp om dat verder te oefenen.</p><div class="row"><a class="btn main" href="${to('toets')}">Nieuwe proeftoets</a></div></div>
  <div class="sheet"><h2>Alle vragen nakijken</h2><div class="res">${t.items
    .map((x, i) => {
      const ok = x.c.ok;
      const ans = x.q.mc
        ? x.q.mc.opts[x.q.mc.a]
        : x.q.fields
            .map(
              (f) =>
                `${f.pre ? T(f.pre) + ' ' : ''}${f.sel ? esc(f.a) : (f.round ? '≈ ' : '') + T(f.round ? d(rd(f.a, f.round)) : fmtAns(f.a))}${f.post ? ' ' + T(f.post) : ''}`,
            )
            .join('; ');
      return `<div class="resq"><div class="row" style="justify-content:space-between"><b>Vraag ${i + 1}</b><span class="tag ${ok ? 'good' : 'bad'}">${ok ? 'Goed' : x.got ? `${x.got} van ${x.max} goed` : 'Fout'}</span></div><div>${x.q.q}</div>${x.q.fig ? `<div class="figbox">${x.q.fig}</div>` : ''}${ok ? '' : `<div><b>Goed antwoord:</b> ${ans}</div>`}<details ${ok ? '' : 'open'}><summary>Uitwerking</summary>${stepsHTML(x.q.steps)}</details></div>`;
    })
    .join('')}</div></div>`;
}
function fmtAns(a) {
  if (Number.isInteger(a) || isNice(a, 4)) return d(a);
  for (const den of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16]) {
    const n = a * den;
    if (near(n, Math.round(n))) return fr(Q(Math.round(n), den));
  }
  return d(rd(a, 2));
}

export {
  buildTest,
  vToetsSetup,
  vToetsRun,
  vToetsRes,
  loadTests,
  saveTest,
  storeTest,
  stopTest,
  forgetTests,
  finishTest,
  pauseClock,
  clockText,
};
