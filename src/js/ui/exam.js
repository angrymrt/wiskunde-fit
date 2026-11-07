// De proeftoets: samenstellen, afnemen en nakijken.
import { checkAnswer } from '../answers.js';
import { shuffle, Q, near, rd, isNice, d, fr } from '../math.js';
import { TOPICS, TOPIC } from '../topics/index.js';
import { prog, save, rec } from '../progress.js';
import { chosenTopics } from '../stof.js';
import { esc, T, stepsHTML } from '../typeset.js';
import { fieldsHTML, readVals } from './question-form.js';
import { state } from './state.js';

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
  const n = state.view.n || 20,
    groups = chosenTopics();
  const intro = `<h1 style="font-size:clamp(1.7rem,5vw,2.4rem)">Proeftoets</h1><p>Je krijgt vragen uit jouw stof, zonder hints. Pas aan het eind zie je wat goed en fout is, met de uitwerkingen erbij. Zet een rekenmachine en kladpapier klaar.</p>`;
  if (!groups.length)
    return `<div class="sheet">${intro}<div class="setup"><b>Welke stof?</b><p class="small muted">Een proeftoets gaat over jouw stof. Kies die eerst.</p><div class="row"><button class="btn main" type="button" data-act="kies">Kies uit je boek</button><button class="btn" type="button" data-act="stof">Kies op onderwerp</button><button class="btn" type="button" data-act="stofall">Alle stof</button></div></div></div>`;
  return `<div class="sheet">${intro}
  <div class="setup"><b>Welke stof?</b><p class="small">Jouw stof: ${groups.map((g) => T(g.topic.title)).join(', ')}.</p><div><button class="linkbtn" type="button" data-act="stof">Wijzig jouw stof</button></div></div>
  <div class="setup"><b>Hoeveel vragen?</b><div class="chips">${[10, 15, 20, 30].map((k) => `<button class="chip" type="button" data-act="len" data-id="${k}" aria-pressed="${n === k}">${k} vragen</button>`).join('')}</div></div>
  <div class="row"><button class="btn main" type="button" data-act="start">Start de proeftoets</button></div></div>`;
}
const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
function vToetsRun() {
  const t = state.test,
    i = t.i,
    it = t.items[i];
  const filled = (x) =>
    x.vals.length && (x.q.mc ? x.vals[0] !== '' : x.vals.some((v) => String(v).trim()));
  const open = t.items.filter((x) => !filled(x)).length;
  return `<div class="sheet"><div class="row" style="justify-content:space-between"><h1 class="plain-h">Vraag ${i + 1} van ${t.items.length}</h1><span class="muted small">Tijd <span id="clock" style="font-variant-numeric:tabular-nums">${fmtT(Math.floor((Date.now() - t.start) / 1000))}</span></span></div>
  <div class="grid-nav">${t.items.map((x, k) => `<button class="gn ${filled(x) ? 'fill' : ''} ${k === i ? 'cur' : ''}" type="button" data-act="goto" data-id="${k}" aria-label="Ga naar vraag ${k + 1}">${k + 1}</button>`).join('')}</div>
  <div class="small muted">${T(it.topic.title)}</div><div class="q" id="tq">${it.q.q}</div>${it.q.fig ? `<div class="figbox">${it.q.fig}</div>` : ''}
  <form id="tform" class="block" novalidate>${fieldsHTML(it.q, 't', it.vals)}<div class="row"><button class="btn" type="button" data-act="tprev" ${i ? '' : 'disabled'}>Vorige</button>${i < t.items.length - 1 ? `<button class="btn main" type="submit">Volgende</button>` : ''}<button class="btn ${i === t.items.length - 1 ? 'main' : 'quiet'}" type="button" data-act="tfin" ${t.warn ? 'aria-describedby="tfb"' : ''}>Inleveren</button></div>
  ${t.warn ? `<div class="fb bad" id="tfb">Je hebt nog ${open} ${open === 1 ? 'vraag' : 'vragen'} open. Klik nog een keer op Inleveren als je toch wilt stoppen.</div>` : ''}</form></div>`;
}
function storeTest() {
  const it = state.test.items[state.test.i];
  if (it) it.vals = readVals(it.q, 't');
}
function finishTest() {
  let score = 0,
    max = 0;
  const per = {};
  state.test.items.forEach((x) => {
    const c = x.vals.length
      ? checkAnswer(x.q, x.vals)
      : { each: x.q.mc ? [false] : x.q.fields.map(() => false), ok: false };
    x.c = c;
    x.got = c.each.filter(Boolean).length;
    x.max = c.each.length;
    score += x.got;
    max += x.max;
    rec(x.skill.id, c.ok);
    const p = per[x.topic.slug] || (per[x.topic.slug] = { got: 0, max: 0 });
    p.got += x.got;
    p.max += x.max;
  });
  state.test.score = score;
  state.test.max = max;
  state.test.per = per;
  state.test.time = Math.floor((Date.now() - state.test.start) / 1000);
  prog.tests.push({ score, max, when: Date.now() });
  if (prog.tests.length > 20) prog.tests.shift();
  save();
}
function vToetsRes() {
  const t = state.test,
    grade = 1 + (9 * t.score) / t.max,
    weak = Object.entries(t.per)
      .map(([slug, p]) => ({ s: TOPIC[slug], ...p, r: p.got / p.max }))
      .sort((a, b) => a.r - b.r);
  return `<div class="sheet"><h1 style="font-size:clamp(1.7rem,5vw,2.4rem)">Je resultaat</h1><div class="row" style="gap:24px"><div class="score">${t.score}/${t.max}</div><div><div>punten in ${fmtT(t.time)} minuten</div><div class="muted small">Dat is ongeveer een ${d(rd(grade, 1))} met de formule cijfer = 1 + 9 × punten / maximum. Je docent kan anders normeren.</div></div></div>
  <h2 class="h3">Per onderwerp</h2><div class="res">${weak
    .map((w) => {
      const pc = Math.round(w.r * 100);
      return `<button class="par color-${w.s.domain.color}" type="button" data-act="topicp" data-id="${w.s.slug}" style="border-top:0;padding:4px 0"><span>${T(w.s.title)}</span><span class="pct">${w.got} van ${w.max}</span><span class="bar ${pc >= 80 ? 'done' : ''}"><i style="width:${pc}%"></i></span></button>`;
    })
    .join('')}</div>
  <p class="small muted">Klik op een onderwerp om dat verder te oefenen.</p><div class="row"><button class="btn main" type="button" data-act="toets">Nieuwe proeftoets</button></div></div>
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

export { buildTest, vToetsSetup, vToetsRun, vToetsRes, storeTest, finishTest, fmtT };
