// De proeftoets: samenstellen, afnemen, bewaren en nakijken.
import { checkAnswer, parseNum } from '../answers.js';
import { drawnResult } from '../figures.js';
import { shuffle, Q, near, rd, isNice, d, fr } from '../math.js';
import { DOMAINS, TOPICS, makeQuestion } from '../topics/index.js';
import { rec } from '../progress.js';
import { pathFor, to } from '../routes.js';
import { bookPath, chosenTopics, topicOf } from '../stof.js';
import { esc, T, stepsHTML } from '../typeset.js';
import { crumbs, pageHead } from './layout.js';
import { fieldsHTML, readVals, shareHTML } from './question-form.js';
import { state } from './state.js';

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
// Geeft null als er niets is, als een vraagsoort niet meer bestaat, of als de vragen of de
// huidige vraag niet kloppen. Dan begint de leerling liever opnieuw dan dat de site vastloopt.
function read(key) {
  try {
    const t = JSON.parse(localStorage.getItem(key));
    if (t?.v !== STORED || !Array.isArray(t.items) || !t.items.length) return null;
    if ('i' in t && !(Number.isInteger(t.i) && t.i >= 0 && t.i < t.items.length)) return null;
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
      out.push({ topic, skill: sk, q: makeQuestion(sk), vals: [] });
    }
  }
  const order = TOPICS.map((s) => s.slug);
  out.sort((a, b) => order.indexOf(a.topic.slug) - order.indexOf(b.topic.slug));
  return out;
}
const gradeOf = (t) => 1 + (9 * t.score) / t.max;
// Het resultaat in één zin, voor het overzicht, Mijn stof en het scherm Proeftoets.
const resultText = (t) => `${t.score} van ${t.max} punten, ongeveer een ${d(rd(gradeOf(t), 1))}`;
function vToetsSetup() {
  const n = state.len,
    groups = chosenTopics();
  const head = pageHead(
    'Proeftoets',
    `<p class="lead">Je krijgt vragen uit je stof, zonder hints. Pas aan het eind zie je wat goed en fout is, met de uitwerkingen erbij. Zet een rekenmachine en kladpapier klaar.</p>`,
  );
  const stopped = state.stopped
    ? `<p class="fb neutral" id="stopped">Je proeftoets is gestopt. Je antwoorden zijn niet bewaard en de proeftoets telt niet mee.</p>`
    : '';
  // Alles in één blok, zoals de uitleg bij een onderwerp: je laatste resultaat staat op een breed
  // scherm rechts, en op een telefoon onder de intro.
  const last = state.result
    ? `<div class="toets-side"><h2 class="h3">Je laatste resultaat</h2><p>${resultText(state.result)}.</p><div class="row"><a class="btn" href="${to('toetsres')}">Bekijk je resultaat</a></div></div>`
    : '';
  const sheet = (body) =>
    `${crumbs()}<div class="sheet${last ? ' toets' : ''}">${head}${last}<div class="toets-body">${stopped}${body}</div></div>`;
  if (!groups.length)
    return sheet(
      `<div class="setup"><h2 class="h3">Welke stof?</h2><p class="small muted">Een proeftoets gaat over je stof. Kies die eerst.</p><div class="row"><a class="btn main" href="${bookPath()}">Kies uit je boek</a><a class="btn" href="${to('stof')}#onderwerp">Kies op onderwerp</a><button class="btn" type="button" data-act="stofall">Alle stof</button></div></div>`,
    );
  return sheet(`<div class="setup"><h2 class="h3">Welke stof?</h2><p class="small">Mijn stof: ${groups.map((g) => T(g.topic.title)).join(', ')}.</p><div><a class="linkbtn" href="${to('stof')}">Wijzig mijn stof</a></div></div>
  <div class="setup"><h2 class="h3" id="len-label">Hoeveel vragen?</h2><div class="chips" role="group" aria-labelledby="len-label">${[10, 15, 20, 30].map((k) => `<button class="chip" type="button" data-act="len" data-id="${k}" aria-pressed="${n === k}">${k} vragen</button>`).join('')}</div></div>
  <div class="row"><button class="btn main" type="button" data-act="start">Start de proeftoets</button></div>`);
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
  <nav class="grid-nav" aria-label="Vragen van de proeftoets">${t.items.map((x, k) => `<button class="gn ${filled(x) ? 'fill' : ''} ${k === i ? 'cur' : ''}" type="button" data-act="goto" data-id="${k}" aria-label="Vraag ${k + 1}${filled(x) ? ', ingevuld' : ''}"${k === i ? ' aria-current="step"' : ''}>${k + 1}</button>`).join('')}</nav>
  <div class="small muted">${T(it.topic.title)}</div><div class="q" id="tq">${it.q.q}</div>${it.q.fig ? `<div class="figbox">${it.q.fig}</div>` : ''}
  <form id="tform" class="block" novalidate>${fieldsHTML(it.q, 't', it.vals)}<div class="row"><button class="btn" type="button" data-act="tprev" ${i ? '' : 'disabled'}>Vorige</button>${i < t.items.length - 1 ? `<button class="btn main" type="submit">Volgende</button>` : ''}<button class="btn ${i === t.items.length - 1 ? 'main' : 'quiet'}" type="button" data-act="tfin" ${t.warn ? 'aria-describedby="tfb"' : ''}>Inleveren</button></div>
  ${t.warn ? `<div class="fb bad" id="tfb">Je hebt nog ${open} ${open === 1 ? 'vraag' : 'vragen'} open. Klik nog een keer op Inleveren als je toch wilt stoppen.</div>` : ''}</form>
  ${t.confirmStop ? `<p class="small">Wil je stoppen? Je antwoorden gaan dan verloren en deze proeftoets telt niet mee.</p><div class="row"><button class="btn quiet" type="button" data-act="tstop2">Ja, stop de proeftoets</button><button class="btn quiet" type="button" data-act="tstop0">Annuleren</button></div>` : `<div class="row"><button class="btn quiet" type="button" data-act="tstop1">Stoppen zonder inleveren</button></div>`}</div>`;
}
// Bewaart wat er op het scherm is ingevuld. Doet niets als de vraag niet op het scherm staat.
// Gaat naar een andere vraag, maar nooit buiten de proeftoets.
function toQuestion(i) {
  state.test.i = Math.max(0, Math.min(state.test.items.length - 1, i));
  state.test.warn = false;
}
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
// Het antwoord per deel: wat de leerling invulde, goed of fout, en bij een fout wat goed was.
// Wat de leerling typte komt van de leerling, dus alleen esc en geen T.
const mark = (ok) =>
  `<span class="mark ${ok ? 'good' : 'bad'}"><span aria-hidden="true">${ok ? '✓' : '✗'}</span><span class="sr">${ok ? 'goed' : 'fout'}</span></span>`;
const filled = (v) => String(v ?? '').trim();
// Een minteken zetten we als echt minteken, net als in de rest van de site.
const typed = (v) =>
  filled(v) ? esc(filled(v)).replace(/-/g, '−') : '<span class="muted">niet ingevuld</span>';
const rightField = (f) =>
  `${f.sel ? esc(f.a) : (f.round ? '≈ ' : '') + T(f.round ? d(rd(f.a, f.round)) : fmtAns(f.a))}${f.post ? ' ' + T(f.post) : ''}`;
function answerRows({ q, vals, c }) {
  if (q.mc)
    return [[null, filled(vals[0]) ? q.mc.opts[vals[0]] : typed(''), c.each[0], q.mc.opts[q.mc.a]]];
  if (q.line)
    return [0, 1].map((k) => {
      const [x, y] = [vals[2 * k], vals[2 * k + 1]];
      return [
        `Punt ${k + 1}`,
        filled(x) && filled(y)
          ? `<span class="nowrap">(${typed(x)}, ${typed(y)})</span>`
          : typed(''),
        c.each[2 * k],
        `<span class="nowrap">${T(`(${fmtAns(q.fields[2 * k].a)}, ${fmtAns(q.fields[2 * k + 1].a)})`)}</span>`,
      ];
    });
  // Een veld zonder eigen tekst is meestal het vervolg van een formule, zoals b in ax + b.
  const named = q.fields.some((f) => f.pre || f.post);
  const label = (f, i) =>
    f.pre ? T(f.pre) : named ? '' : q.fields.length > 1 ? `Antwoord ${i + 1}` : null;
  return q.fields.map((f, i) => [
    label(f, i),
    `${typed(vals[i])}${f.post && filled(vals[i]) ? ' ' + T(f.post) : ''}`,
    c.each[i],
    rightField(f),
  ]);
}
function answersHTML(x) {
  const rows = answerRows(x),
    labels = rows.some(([l]) => l),
    wrong = !x.c.ok;
  // Bij een tekenvraag is elk punt op de lijn goed, dus het goede antwoord is een voorbeeld.
  const right = x.q.line ? 'Een goed punt' : 'Goed antwoord';
  const head = `<tr>${labels ? '<th><span class="sr">Deel</span></th>' : ''}<th>Jouw antwoord</th>${wrong ? `<th>${right}</th>` : ''}</tr>`;
  const row = ([l, given, ok, right]) =>
    `<tr class="${ok ? 'ok' : 'no'}">${labels ? (l ? `<th scope="row">${l}</th>` : '<td></td>') : ''}<td>${mark(ok)}${given}</td>${wrong ? `<td>${ok ? '' : right}</td>` : ''}</tr>`;
  return `<div class="scroll"><table class="answers"><thead>${head}</thead><tbody>${rows.map(row).join('')}</tbody></table></div>`;
}
// Een tekenvraag toont de lijn die de leerling tekende, en bij een fout ook de goede lijn.
function resultFig(x) {
  if (!x.q.fig) return '';
  if (!x.q.line) return `<div class="figbox">${x.q.fig}</div>`;
  const [a, b, c, e] = x.q.fields.map((f, i) => parseNum(String(x.vals[i] ?? '')));
  const fig = drawnResult(
    x.q.fig,
    [
      [a, b],
      [c, e],
    ],
    x.q.line,
    x.c.ok,
  );
  // Zonder twee verschillende punten staat er geen lijn van de leerling, dus ook niet in de legenda.
  const drawn = [a, b, c, e].every(Number.isFinite) && (a !== c || b !== e);
  const legend = x.c.ok
    ? ''
    : `<p class="small legend">${drawn ? '<span><span class="key mine"></span> Jouw lijn, doorgetrokken</span>' : ''}<span><span class="key good"></span> De goede lijn, gestippeld</span></p>`;
  return `<div class="figbox">${fig}</div>${legend}`;
}
function vToetsRes() {
  const t = state.result;
  if (!t)
    return `${crumbs()}<div class="sheet">${pageHead('Je resultaat')}<p>Je ziet hier je resultaat zodra je een proeftoets hebt ingeleverd. Maak dus eerst een proeftoets.</p><div class="row"><a class="btn main" href="${to('toets')}">${state.test ? 'Ga verder met je proeftoets' : 'Maak een proeftoets'}</a></div></div>`;
  const topic = (w) => {
    const pc = Math.round(w.r * 100);
    return `<li><a href="${pathFor({ name: 'topic', slug: w.s.slug, oefen: true })}"><span>${T(w.s.title)}</span><span class="pct">${w.got} van ${w.max}</span><span class="bar ${pc >= 80 ? 'done' : ''}"><i style="width:${pc}%"></i></span></a></li>`;
  };
  // Per domein, in de volgorde van de site. Is er maar één domein, dan mag dat over twee kolommen.
  const scores = perTopic(t.items);
  const groups = DOMAINS.map((dm) => ({
    dm,
    rows: dm.topics.map((s) => scores.find((w) => w.s === s)).filter(Boolean),
  })).filter((g) => g.rows.length);
  const domain = ({ dm, rows }) =>
    `<section class="res-domain color-${dm.color}"><h3 class="res-domain-head">${dm.name}</h3><ul class="res-topics">${rows.map(topic).join('')}</ul></section>`;
  const question = (x, i) => {
    const share = shareHTML(x.skill, x.q);
    return `<div class="resq"><div class="q-head"><div class="row" style="justify-content:space-between"><h3 class="plain-h">Vraag ${i + 1}</h3><span class="row"><span class="tag ${x.c.ok ? 'good' : 'bad'}">${x.c.ok ? 'Goed' : x.got ? `${x.got} van ${x.max} goed` : 'Fout'}</span>${share.button}</span></div>${share.note}</div><div>${x.q.q}</div>${resultFig(x)}${answersHTML(x)}<details><summary>Uitwerking</summary>${stepsHTML(x.q.steps)}</details></div>`;
  };
  return `${crumbs()}<div class="sheet res-head">${pageHead('Je resultaat')}
  <div class="res-score"><div class="score">${t.score}/${t.max}</div><div><p><b>Ongeveer een ${d(rd(gradeOf(t), 1))}</b></p><p class="small muted">In ${fmtT(t.time)} minuten. Cijfer = 1 + 9 × punten / maximum. Je docent kan anders normeren.</p></div></div>
  <div class="res-per"><h2 class="h3">Per onderwerp</h2><div class="res-domains${groups.length === 1 ? ' one' : ''}">${groups.map(domain).join('')}</div><p class="small muted">Tik op een onderwerp om het te oefenen.</p></div>
  <div class="row"><a class="btn main" href="${to('toets')}">Nieuwe proeftoets</a><a class="btn" href="${to('stof')}">Naar mijn stof</a></div></div>
  <div class="sheet"><h2>Alle vragen nakijken</h2><div class="res">${t.items.map(question).join('')}</div></div>`;
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
  toQuestion,
  stopTest,
  forgetTests,
  finishTest,
  pauseClock,
  clockText,
  resultText,
};
