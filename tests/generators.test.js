// Draait elke vraaggenerator vaak en controleert of de vragen kloppen en te beantwoorden zijn.
// Meer rondes kan met de omgevingsvariabele QUESTIONS, bijvoorbeeld QUESTIONS=5000.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMAINS, TOPICS, makeQuestion } from '../src/js/topics/index.js';
import { flipTrap, orFields, MC } from '../src/js/topics/shared.js';
import { drawnHTML, graph } from '../src/js/figures.js';
import { parseSeed, rd, seedText } from '../src/js/math.js';
import {
  checkAnswer,
  checkField,
  fillState,
  findTrap,
  isDrawing,
  matchFields,
  parseNum,
  roundTraps,
} from '../src/js/answers.js';
import { cleanProgress, migrateIds, migrateSkills } from '../src/js/progress.js';
import { VALKUIL_ID } from '../src/js/tel.js';
import { stepsHTML, T } from '../src/js/typeset.js';
import KNOWN_IDS from './vraagsoort-ids.js';

const ROUNDS = Number(process.env.QUESTIONS) || 500;

// Schrijft een antwoord zoals een leerling het zou intypen.
function typed(x) {
  if (Number.isInteger(x)) return String(x);
  for (const den of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 24, 25, 40]) {
    const n = x * den;
    if (Math.abs(n - Math.round(n)) < 1e-7) return `${Math.round(n)}/${den}`;
  }
  return String(x).replace('.', ',');
}

// Een lopende proeftoets staat in de browser als JSON, en moet daarna nog na te kijken zijn.
const stored = (q) => JSON.parse(JSON.stringify(q));

// Een figuur zegt in woorden wat erin staat, zodat je de vraag ook met een schermlezer kunt
// maken. Alles wat in de figuur geschreven staat, zoals een lengte, de naam van een punt of van
// een lijn, staat dus ook in de beschrijving. Zie #55.
const GENERIC = [
  'Grafiek in een assenstelsel',
  'Meetkundige figuur',
  'Meetkundige figuur met lengtes en hoeken',
];
function assertDescribed(fig, q) {
  const label = fig.match(/aria-label="([^"]*)"/)?.[1] ?? '';
  assert.ok(!GENERIC.includes(label.replace(/\.$/, '')), `figuur zonder beschrijving: ${q}`);
  const written = [
    // Lengtes bij een zijde.
    ...[...fig.matchAll(/<text class="tv[^"]*"[^>]*>([^<]+)<\/text>/g)].map((m) => m[1]),
    // Namen van punten in een meetkundige figuur.
    ...[...fig.matchAll(/<text class="ti" text-anchor="middle"[^>]*>([^<]+)<\/text>/g)].map(
      (m) => m[1],
    ),
  ];
  for (const w of written)
    assert.ok(
      label.toLowerCase().includes(w.toLowerCase()),
      `"${w}" staat niet in de beschrijving: ${q}`,
    );
  // Namen van lijnen en parabolen in een grafiek.
  for (const [, name] of fig.matchAll(/<text class="t\d ti"[^>]*>([^<]+)<\/text>/g))
    assert.ok(
      [`lijn ${name}`, `grafiek van ${name}`].some((w) =>
        label.toLowerCase().includes(w.toLowerCase()),
      ),
      `"${name}" staat niet in de beschrijving: ${q}`,
    );
}

// Alle volgordes van de goede antwoorden: binnen een groep velden mag elke volgorde.
function rightOrders(fields, right) {
  let all = [right];
  const groups = new Map();
  fields.forEach((f, i) => {
    if (f.grp != null) groups.set(f.grp, [...(groups.get(f.grp) || []), i]);
  });
  const orders = (a) =>
    a.length < 2
      ? [a]
      : a.flatMap((x, i) => orders([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
  for (const idx of groups.values())
    all = all.flatMap((vals) =>
      orders(idx).map((p) => {
        const v = [...vals];
        idx.forEach((i, k) => (v[i] = vals[p[k]]));
        return v;
      }),
    );
  return all;
}

// Het goede antwoord valt in geen enkele valkuil. Anders krijgt een leerling bij een vraag met
// meer velden een melding over een veld dat goed is.
function assertNoTrap(q, vals) {
  const trap = findTrap(q, vals);
  if (trap) assert.fail(`goed antwoord in de valkuil ${trap.id}: ${q.q}`);
}

function assertSound(q) {
  const text = q.q + (q.fig ?? '') + stepsHTML(q.steps) + q.hint + (q.mc ? q.mc.opts.join('') : '');
  for (const bad of ['NaN', 'undefined', 'Infinity', 'null', '[object']) {
    assert.ok(!text.includes(bad), `tekst bevat "${bad}": ${q.q}`);
  }
  assert.ok(!/[{}]/.test(text), `niet-omgezette accolade: ${q.q}`);
  if (q.fig) assertDescribed(q.fig, q.q);
  assert.ok(q.hint, `geen hint: ${q.q}`);
  assert.ok(q.steps.length > 0, `geen uitwerking: ${q.q}`);
  // Elke vraag heeft een controle die het antwoord op een andere manier narekent. Zie AGENTS.md.
  assert.equal(typeof q.v, 'function', `geen controle v: ${q.q}`);
  assert.ok(q.v(), `zelfcontrole mislukt: ${q.q}`);
  // Elke valkuil heeft een vaste naam, zodat we kunnen tellen hoe vaak die voorkomt.
  const traps = (q.traps ?? []).map((t) => t.id);
  for (const id of traps) {
    assert.match(id ?? '', VALKUIL_ID, `valkuil zonder geldige id: ${q.q}`);
  }
  assert.equal(new Set(traps).size, traps.length, `twee valkuilen met dezelfde id: ${q.q}`);

  if (q.mc) {
    assert.ok(q.mc.a >= 0 && q.mc.a < q.mc.opts.length, `juiste keuze bestaat niet: ${q.q}`);
    // Een keuze kan een figuur zijn, zoals een schets. Die heeft dan ook een beschrijving.
    for (const o of q.mc.opts) if (/^<svg/.test(o)) assertDescribed(o, q.q);
    assert.equal(new Set(q.mc.opts).size, q.mc.opts.length, `dubbele keuzes: ${q.q}`);
    assert.ok(checkAnswer(q, [String(q.mc.a)]).ok, `goed antwoord afgekeurd: ${q.q}`);
    assertNoTrap(q, [String(q.mc.a)]);
    assert.ok(!checkAnswer(q, ['']).ok, `leeg antwoord goedgekeurd: ${q.q}`);
    assert.ok(checkAnswer(stored(q), [String(q.mc.a)]).ok, `bewaard niet na te kijken: ${q.q}`);
    return;
  }
  assert.ok(q.fields.length > 0, `geen invoervelden: ${q.q}`);
  for (const f of q.fields) if (!f.sel) assert.ok(Number.isFinite(f.a), `geen getal: ${q.q}`);
  // Een groep velden wordt zonder volgorde nagekeken. Dat kan alleen bij getallen, en met
  // hoogstens vier velden, want het nakijken probeert alle volgordes.
  const groups = q.fields.filter((f) => f.grp != null);
  for (const f of groups) {
    assert.ok(!f.sel && !isDrawing(q), `groep bij een keuzelijst of tekenvraag: ${q.q}`);
    const size = groups.filter((g) => g.grp === f.grp).length;
    assert.ok(size >= 2 && size <= 4, `groep met ${size} velden: ${q.q}`);
  }
  const right = q.fields.map((f) =>
    f.sel ? f.a : f.round ? String(rd(f.a, f.round)).replace('.', ',') : typed(f.a),
  );
  // Bij een groep velden in elke volgorde.
  for (const r of rightOrders(q.fields, right)) {
    assert.ok(checkAnswer(q, r).ok, `goed antwoord afgekeurd (${r.join(' | ')}): ${q.q}`);
    assert.ok(checkAnswer(stored(q), r).ok, `bewaard goed antwoord afgekeurd: ${q.q}`);
    assertNoTrap(q, r);
  }
  // Bij een tekenvraag verschuift alleen de y van het eerste punt (bij een parabool de top), want twee punten even ver opschuiven kan weer
  // een punt op dezelfde lijn geven.
  const wrong = q.fields.map((f, i) =>
    f.sel ? f.a : typed(isDrawing(q) ? (i === 1 ? f.a + 7 : f.a) : f.a + 7),
  );
  assert.ok(!checkAnswer(q, wrong).ok, `fout antwoord goedgekeurd: ${q.q}`);
  assert.ok(checkAnswer(stored(q), right).ok, `bewaard goed antwoord afgekeurd: ${q.q}`);
  assert.ok(!checkAnswer(stored(q), wrong).ok, `bewaard fout antwoord goedgekeurd: ${q.q}`);
}

// Elke ronde heeft een vaste seed. Gaat er iets mis, dan noemt de test de link naar precies die
// vraag, zodat je die met npm run dev in de browser kunt openen.
const seeds = Array.from({ length: ROUNDS }, (_, i) => (i * 2654435761) >>> 0);
const linkTo = (topic, skill, seed) =>
  `/${topic.slug}/oefenen?soort=${skill.id}&seed=${seedText(seed)}`;
function eachQuestion(topic, skill, check) {
  for (const seed of seeds) {
    try {
      check(makeQuestion(skill, seed));
    } catch (e) {
      // Node toont de stack, en daar staat de melding al in. Zet de link dus op beide plekken.
      const where = `\n    Open de vraag: ${linkTo(topic, skill, seed)}`;
      e.stack = e.stack.replace(e.message, e.message + where);
      e.message += where;
      throw e;
    }
  }
}

for (const section of TOPICS) {
  test(section.title, async (t) => {
    for (const skill of section.skills) {
      await t.test(skill.name, () => eachQuestion(section, skill, assertSound));
    }
  });
}

test('dezelfde seed geeft precies dezelfde vraag, zonder Math.random', () => {
  const random = Math.random;
  Math.random = () => {
    throw new Error('Een generator gebruikt Math.random, en dan werkt een seed niet');
  };
  try {
    for (const topic of TOPICS) {
      for (const skill of topic.skills) {
        const seen = new Set();
        for (const seed of seeds.slice(0, 20)) {
          const q = stored(makeQuestion(skill, seed));
          assert.deepEqual(stored(makeQuestion(skill, seed)), q, linkTo(topic, skill, seed));
          assert.equal(q.seed, seed);
          seen.add(JSON.stringify(q.fields ?? q.mc));
        }
        assert.ok(seen.size > 1, `${skill.name} geeft bij elke seed dezelfde vraag`);
      }
    }
  } finally {
    Math.random = random;
  }
});

test('een seed staat kort in het adres en gaat heen en terug', () => {
  for (const seed of [0, 1, 35, 36, 2654435761, 0xffffffff]) {
    assert.equal(parseSeed(seedText(seed)), seed);
    assert.ok(seedText(seed).length <= 7);
  }
  for (const bad of [null, '', 'K3X9Q', 'k3x9q!', '12345678', '1z141z4', '-1']) {
    assert.equal(parseSeed(bad), null, bad);
  }
});

// Uit de review van #74: bij f(-1) = f(3) is de halve afstand 2, net als -1 + 3. Ook dan hoort de
// valkuil halve-afstand bij de vraag.
test('x_top uit gelijke functiewaarden herkent de halve afstand', () => {
  const topic = TOPICS.find((t) => t.slug === 'kwadratische-functies'),
    skill = topic.skills.find((k) => k.id === 70);
  assert.ok(
    makeQuestion(skill, 14).traps.some((t) => t.id === 'halve-afstand'),
    'seed 14',
  );
  let checked = 0;
  eachQuestion(topic, skill, (q) => {
    if (q.fields.length !== 3) return;
    const [p, r] = q.fields.slice(0, 2).map((f) => Number(f.pre.match(/\((-?\d+)\)/)[1])),
      half = (r - p) / 2,
      vals = [q.fields[0].a, q.fields[1].a, half].map(String);
    // Bij p = 0 is de halve afstand het goede antwoord.
    if (p === 0) return assert.equal(findTrap(q, vals), null);
    checked++;
    // Is de halve afstand ook p + q, dan past het getal bij twee fouten, en komt midden-vergeten eerst.
    const want = half === p + r ? 'midden-vergeten' : 'halve-afstand';
    assert.equal(findTrap(q, vals)?.id, want, q.q);
  });
  assert.ok(checked > 50, 'genoeg vragen met de halve afstand');
});

// Bij ax² = bx is x = 0 een oplossing en de andere vaak een breuk, zoals 3x² = 8x. Die mag als
// gemengd getal, als breuk of afgerond, in elke volgorde. Wie door x deelt, mist x = 0.
test('een kwadratische vergelijking met een breuk als oplossing', () => {
  const topic = TOPICS.find((t) => t.slug === 'kwadratische-vergelijkingen'),
    skill = topic.skills.find((k) => k.id === 79);
  let checked = 0;
  eachQuestion(topic, skill, (q) => {
    const [a, b] = q.fields.map((f) => f.a);
    if (a !== 0 || Number.isInteger(b)) return;
    checked++;
    // Het getal voor x² is 2, 3, 4 of 5, dus dat is ook de noemer.
    const den = [2, 3, 4, 5].find((n) => Number.isInteger(rd(b * n, 6))),
      whole = Math.trunc(b),
      rest = Math.round(Math.abs(b - whole) * den),
      sign = b < 0 ? '-' : '',
      mixed = whole ? `${sign}${Math.abs(whole)} ${rest}/${den}` : `${sign}${rest}/${den}`;
    for (const r of [
      mixed,
      `${Math.round(b * den)}/${den}`,
      String(b.toFixed(2)).replace('.', ','),
    ]) {
      assert.ok(checkAnswer(q, ['0', r]).ok, `${r} afgekeurd: ${q.q}`);
      assert.ok(checkAnswer(q, [r, '0']).ok, `${r} in andere volgorde afgekeurd: ${q.q}`);
    }
    const trap = (...vals) => findTrap(q, vals.map(String))?.id;
    assert.equal(trap(b, b), 'nul-vergeten', q.q);
    assert.equal(trap(0, -b), 'teken-omgedraaid', q.q);
    // Ook als de leerling een afgerond kommagetal invult, zoals −1,67 bij −5/3.
    const comma = (x) => x.toFixed(2).replace('.', ',');
    assert.equal(trap(comma(b), comma(b)), 'nul-vergeten', q.q);
    assert.equal(trap(0, comma(-b)), 'teken-omgedraaid', q.q);
  });
  assert.ok(checked > 20, 'genoeg vragen met een breuk');
});

// Uit de review van #76: is een oplossing 0, dan herkent elke vraagsoort wie door x deelt.
test('wie bij een oplossing 0 door x deelt, krijgt nul-vergeten', () => {
  const topic = TOPICS.find((t) => t.slug === 'kwadratische-vergelijkingen');
  for (const id of [79, 80, 82]) {
    let checked = 0;
    eachQuestion(
      topic,
      topic.skills.find((k) => k.id === id),
      (q) => {
        const r = q.fields.map((f) => f.a).find((a) => a !== 0);
        if (!q.fields.some((f) => f.a === 0)) return;
        checked++;
        assert.equal(findTrap(q, [String(r), String(r)])?.id, 'nul-vergeten', q.q);
      },
    );
    assert.ok(checked > 20, `genoeg vragen met een oplossing 0 bij ${id}`);
  }
});

// Uit de review van #76: bij (t + …)(t + …) typt wie (t − 4)(t − 7) bedoelt soms 4 en 7. De melding
// gaat dan over het teken in het veld, en niet over product en som.
test('ontbinden: getallen zonder teken in (x + …) krijgen een melding over het teken', () => {
  const topic = TOPICS.find((t) => t.slug === 'ontbinden-in-factoren'),
    skill = topic.skills.find((k) => k.id === 77);
  let checked = 0;
  eachQuestion(topic, skill, (q) => {
    const [p, r] = q.fields.map((f) => f.a);
    if (p > 0 && r > 0) return;
    checked++;
    const trap = findTrap(q, [String(Math.abs(p)), String(Math.abs(r))]);
    assert.equal(trap?.id, 'teken-in-haakjes', q.q);
    assert.match(trap.m, /met zijn teken/);
  });
  assert.ok(checked > 50, 'genoeg vragen met een negatief getal');
});

test('bij een lijn tekenen is elk paar punten op de lijn goed', () => {
  const drawing = TOPICS.flatMap((s) => s.skills).filter((k) => makeQuestion(k, 1).line);
  assert.equal(drawing.length, 3);
  for (const skill of drawing) {
    eachQuestion(
      TOPICS.find((t) => t.skills.includes(skill)),
      skill,
      (q) => {
        const [x1, y1, x2, y2] = q.fields.map((f) => f.a);
        const other = [x1 + 2 * (x2 - x1), y1 + 2 * (y2 - y1)];
        const answer = (...vals) => checkAnswer(q, vals.map(String));
        assert.ok(answer(x1, y1, ...other).ok, `ander punt op de lijn afgekeurd: ${q.q}`);
        assert.ok(answer(x2, y2, x1, y1).ok, `omgekeerde volgorde afgekeurd: ${q.q}`);
        assert.ok(!answer(x1, y1, x1, y1).ok, `twee keer hetzelfde punt goedgekeurd: ${q.q}`);
        assert.deepEqual(answer(x1, y1, x2, y2 + 1).each, [true, true, false, false]);
        assert.ok(!answer(x1, y1, '', '').ok, `één punt goedgekeurd: ${q.q}`);
      },
    );
  }
});

test('bij een parabool tekenen is de top precies, en elk ander punt op de parabool goed', () => {
  const drawing = TOPICS.flatMap((s) => s.skills).filter((k) => makeQuestion(k, 1).parabola);
  assert.equal(drawing.length, 2);
  for (const skill of drawing) {
    eachQuestion(
      TOPICS.find((t) => t.skills.includes(skill)),
      skill,
      (q) => {
        const [h, k, x2, y2, x3, y3] = q.fields.map((f) => f.a);
        const { a, b, c } = q.parabola,
          f = (x) => a * x * x + b * x + c,
          // Twee andere punten op de parabool, verder van de top dan het voorbeeld.
          far = [h - 3, f(h - 3)],
          far2 = [h + 4, f(h + 4)];
        const answer = (...vals) => checkAnswer(q, vals.map(String));
        assert.ok(answer(h, k, ...far, ...far2).ok, `andere punten afgekeurd: ${q.q}`);
        assert.ok(answer(h, k, x3, y3, x2, y2).ok, `omgekeerde volgorde afgekeurd: ${q.q}`);
        // Ook een ander goed antwoord valt in geen enkele valkuil.
        assertNoTrap(q, [h, k, ...far, ...far2].map(String));
        assertNoTrap(q, [h, k, x3, y3, x2, y2].map(String));
        assert.ok(!answer(h, k, x2, y2, x2, y2).ok, `twee keer hetzelfde punt goedgekeurd: ${q.q}`);
        assert.ok(!answer(h, k, h, k, x2, y2).ok, `de top als ander punt goedgekeurd: ${q.q}`);
        assert.ok(!answer(...far, h, k, x2, y2).ok, `top op een andere plek goedgekeurd: ${q.q}`);
        assert.deepEqual(answer(h, k + 1, x2, y2, x3, y3 + 1).each, [
          false,
          false,
          true,
          true,
          false,
          false,
        ]);
        assert.ok(!answer(h, k, x2, y2, '', '').ok, `twee punten goedgekeurd: ${q.q}`);
        // Gespiegeld in de top: een bergparabool in plaats van een dal, of andersom.
        assert.equal(
          findTrap(q, [h, k, x2, 2 * k - y2, x3, 2 * k - y3])?.id,
          'dal-berg-omgedraaid',
        );
        assert.equal(findTrap(q, [h, k, x2, y2, x2, y2])?.id, 'zelfde-punt');
        assert.equal(findTrap(q, [h, k, x2, y2, x3, y3 + 1])?.id, 'een-punt-fout');
        assert.equal(findTrap(q, [x2, y2, h, k, x3, y3])?.id, 'top-niet-eerst');
      },
    );
  }
});

test('een getekende parabool staat door drie punten in het rooster', () => {
  const data = '-5,5,-6,6,28,30,20';
  // Drie punten van y = x² − 2: een pad, geen lijn.
  const curve = drawnHTML(data, [
    [0, -2],
    [1, -1],
    [2, 2],
  ]);
  assert.match(curve, /<path class="l1" d="M/);
  assert.equal((curve.match(/<circle/g) || []).length, 3);
  // Drie punten op één rechte lijn: dan staat die lijn er.
  assert.match(
    drawnHTML(data, [
      [0, 0],
      [1, 1],
      [2, 2],
    ]),
    /<line class="l1"/,
  );
  // Twee punten met dezelfde x, of een punt dat ontbreekt: geen grafiek, wel de punten.
  const none = drawnHTML(data, [
    [0, 0],
    [0, 1],
    [2, 2],
  ]);
  assert.doesNotMatch(none, /<path|<line/);
  assert.doesNotMatch(
    drawnHTML(data, [
      [0, 0],
      [1, 1],
      [NaN, 2],
    ]),
    /<path|<line/,
  );
  // Een lijn met één punt is nog geen lijn.
  assert.doesNotMatch(
    drawnHTML(data, [
      [0, 0],
      [NaN, NaN],
    ]),
    /<line/,
  );
});

test('oude voortgang verhuist mee met de nieuwe indeling', () => {
  const ids = new Set(TOPICS.flatMap((s) => s.skills.map((k) => k.id)));
  const old = [
    ['1.1#0', '1.1#0'],
    ['1.3#4', '1.3#4'],
    ['1.3#5', '1.4#2'],
    ['1.3#6', '1.3#5'],
    ['1.4#0', '1.5#0'],
    ['1.4#2', '1.5#2'],
    ['1.5#0', 'v1#0'],
    ['1.5#2', '1.4#0'],
    ['1.5#3', '1.4#1'],
    ['2.4#0', '2.4#0'],
  ];
  for (const [from, to] of old) {
    assert.deepEqual(migrateSkills({ [from]: [1, 0] }), { [to]: [1, 0] }, from);
    const [id] = Object.keys(migrateIds({ [to]: [1, 0] }));
    assert.ok(ids.has(Number(id)), `${to} bestaat niet`);
  }
  for (const gone of ['1.5#1', '1.5#4', '2.4#1', '2.4#2']) {
    assert.deepEqual(migrateSkills({ [gone]: [1] }), {}, gone);
  }
});

test('opgeslagen voortgang houdt alleen wat klopt', () => {
  const empty = { v: 5, skills: {}, stof: null, mapping: null };
  // Geen voortgang of iets wat geen voortgang is.
  for (const saved of [null, 'x', 5, [], [1, 2]]) assert.deepEqual(cleanProgress(saved), empty);
  // Uit #56: een tekst in plaats van een lijst liet het herladen vastlopen.
  assert.deepEqual(cleanProgress({ v: 5, skills: { 1: 'bad' }, stof: null, mapping: null }), empty);
  // Alleen het ongeldige deel valt weg.
  assert.deepEqual(
    cleanProgress({
      v: 5,
      skills: { 3: [1, 0, 1], 4: [1, 2, 'x', 0], 5: [1, 1, 1, 1, 1, 0, 0], 6: [], x: [1], 0: [1] },
      stof: [41, 3, 999, 3, 'a'],
      mapping: 'gr13-havo3',
    }),
    {
      v: 5,
      skills: { 3: [1, 0, 1], 4: [1, 0], 5: [1, 1, 1, 0, 0] },
      stof: [3, 41],
      mapping: 'gr13-havo3',
    },
  );
  // Een onbekende indeling of stofkeuze wordt leeg, ook een naam als constructor.
  for (const mapping of ['onbekend', 'constructor', 5, null])
    assert.equal(cleanProgress({ v: 5, mapping }).mapping, null, String(mapping));
  for (const stof of ['x', {}, [999], []])
    assert.equal(cleanProgress({ v: 5, stof }).stof, null, JSON.stringify(stof));
  // Een onbekende, nieuwere versie: wat klopt, blijft staan.
  assert.deepEqual(cleanProgress({ v: 9, skills: { 3: [1] }, extra: true }).skills, { 3: [1] });
  // De oudste vorm, zonder versie, wordt nog steeds omgezet.
  assert.deepEqual(cleanProgress({ skills: { '1.1#0': [1, 1] }, scope: 'all' }).skills, {
    3: [1, 1],
  });
});

test('elk onderwerp heeft een adres dat bij de titel past', () => {
  const reserved = [
    'methode-indeling',
    'boek',
    'mijn-stof',
    'proeftoets',
    'over',
    'privacy',
    'contact',
    'cijfers',
    // De code, de CSS en de lettertypes, zie scripts/build.js.
    'assets',
    // De functie voor de anonieme tellen, zie api/tel.js. Azure houdt /api altijd voor functies.
    'api',
    // Azure toont index.html ook op /index en 404.html op /404.
    'index',
    '404',
  ];
  // Domeinen en onderwerpen delen de adressen direct onder /, dus geen twee mogen hetzelfde zijn.
  const slugs = [...TOPICS, ...DOMAINS].map((t) => t.slug);
  assert.equal(
    new Set(slugs).size,
    slugs.length,
    'Twee onderwerpen of domeinen hebben hetzelfde adres',
  );
  // Een oud adres blijft altijd een doorverwijzing, dus het mag nooit opnieuw een adres worden.
  const old = [...TOPICS, ...DOMAINS].flatMap((t) => t.oldSlugs || []);
  assert.equal(
    new Set([...slugs, ...old]).size,
    slugs.length + old.length,
    'Oud adres hergebruikt',
  );
  for (const o of old) assert.ok(!reserved.includes(o), `${o} is gereserveerd`);
  for (const d of DOMAINS) {
    assert.equal(d.slug, d.name.toLowerCase().replaceAll(' ', '-'), d.name);
    assert.ok(!reserved.includes(d.slug), `${d.slug} is gereserveerd`);
    assert.ok(d.intro && !/[{}<]/.test(d.intro), `${d.name}: de intro is geen gewone tekst`);
  }
  for (const t of TOPICS) {
    assert.equal(t.slug, t.title.toLowerCase().replaceAll(' ', '-'), t.title);
    assert.ok(!reserved.includes(t.slug), `${t.slug} is gereserveerd`);
    assert.ok(t.intro, `${t.title} heeft geen intro`);
    assert.ok(!/[{}<]/.test(t.intro), `${t.title}: de intro is geen gewone tekst`);
    assert.ok(t.skills.length > 0, `${t.title} heeft geen vraagsoorten`);
    assert.ok(DOMAINS.includes(t.domain), `${t.title} hoort niet bij een domein`);
    for (const p of t.prerequisites) {
      assert.ok(TOPICS.includes(p) && p !== t, `Verkeerde voorkennis bij ${t.title}`);
    }
  }
});

test('elke vraagsoort houdt haar vaste nummer', () => {
  const seen = new Set();
  const next = Math.max(...Object.keys(KNOWN_IDS).map(Number)) + 1;
  for (const k of TOPICS.flatMap((s) => s.skills)) {
    assert.ok(Number.isInteger(k.id) && k.id > 0, `${k.name}: het id moet een positief getal zijn`);
    assert.ok(!seen.has(k.id), `Nummer ${k.id} komt twee keer voor`);
    seen.add(k.id);
    assert.ok(
      k.id in KNOWN_IDS,
      `Nieuwe vraagsoort ${k.name}: geef die nummer ${next} en zet ${next}: '${k.gen.name}' in tests/vraagsoort-ids.js`,
    );
    assert.notEqual(KNOWN_IDS[k.id], null, `Nummer ${k.id} is vervallen en mag niet terugkomen`);
    assert.equal(
      k.gen.name,
      KNOWN_IDS[k.id],
      `Nummer ${k.id} hoort bij ${KNOWN_IDS[k.id]}. Heb je de generator hernoemd? Pas dan tests/vraagsoort-ids.js aan.`,
    );
  }
  for (const [id, gen] of Object.entries(KNOWN_IDS)) {
    if (gen)
      assert.ok(
        seen.has(Number(id)),
        `Nummer ${id} (${gen}) is verdwenen. Zet het op null in tests/vraagsoort-ids.js en leg in progress.js vast waar de voortgang heen gaat.`,
      );
  }
});

test('voortgang op de oude id verhuist naar het vaste nummer', () => {
  const skills = TOPICS.flatMap((s) => s.skills);
  const byGen = (name) => skills.find((k) => k.gen.name === name).id;
  const cases = [
    ['v1#0', 'svValue'],
    ['1.1#0', 's11point'],
    ['1.2#5', 's12draw'],
    ['2.4#0', 's24x'],
    ['2.4#7', 's24story'],
  ];
  for (const [old, gen] of cases) {
    assert.deepEqual(migrateIds({ [old]: [1, 0] }), { [byGen(gen)]: [1, 0] }, old);
  }
  // Nieuwe voortgang blijft staan en wordt niet nog eens omgezet.
  assert.deepEqual(migrateIds({ 3: [1] }), { 3: [1] });
  assert.deepEqual(migrateIds({ 3: [1], '1.1#0': [0] }), { 3: [1] });
});

test('parseNum leest kommagetallen, breuken en mintekens', () => {
  const cases = [
    ['3,5', 3.5],
    ['3.5', 3.5],
    ['-2', -2],
    ['−2', -2],
    ['1/2', 0.5],
    ['1 1/2', 1.5],
    ['-1 1/2', -1.5],
    ['- 3/4', -0.75],
    [',5', 0.5],
    ['+4', 4],
  ];
  for (const [input, want] of cases) assert.equal(parseNum(input), want, input);
  for (const input of ['abc', '1/0', '', '3x', '1 2 3']) {
    assert.ok(Number.isNaN(parseNum(input)), input);
  }
});

test('checkField keurt breuken en afrondingen goed', () => {
  const cases = [
    [{ a: 1 / 3 }, '1/3', true],
    [{ a: 1 / 3 }, '0,33', true],
    [{ a: 1 / 3 }, '0,5', false],
    [{ a: 8.1818, round: 1 }, '8,2', true],
    [{ a: 8.1818, round: 1 }, '8,18', false],
    [{ a: 8.1818, round: 1 }, '8,3', false],
    [{ a: 2.5 }, '2 1/2', true],
    [{ a: 2.5 }, '2,4', false],
  ];
  for (const [field, input, want] of cases) assert.equal(checkField(field, input), want, input);
});

test('rd rondt een halve stap weg van nul af, ook als de computer er net onder zit', () => {
  const cases = [
    [3.75, 1, 3.8],
    [-3.75, 1, -3.8],
    [3.74, 1, 3.7],
    [2.675, 2, 2.68],
    [1.005, 2, 1.01],
    [-2.675, 2, -2.68],
    [0.125, 2, 0.13],
    [8.1818, 1, 8.2],
    [2.5, 0, 3],
    [-0.04, 1, 0],
  ];
  for (const [x, n, want] of cases) assert.equal(rd(x, n), want, `${x} op ${n}`);
  assert.ok(Object.is(rd(-0.04, 1), 0), 'geen −0');
});

test('checkField keurt alleen het goed afgeronde getal goed', () => {
  // Uit #50: bij 3,75 en "Rond af op één decimaal" was ook 3,7 goed.
  const skill = TOPICS.flatMap((t) => t.skills).find((s) => s.id === 41);
  const q = makeQuestion(skill, 0);
  const f = q.fields.find((x) => x.round);
  assert.deepEqual([f.a, f.round], [3.75, 1]);
  assert.ok(checkAnswer(q, ['3,8']).ok);
  assert.ok(!checkAnswer(q, ['3,7']).ok);

  const cases = [
    // Een halve stap, positief en negatief.
    [{ a: 3.75, round: 1 }, '3,8', true],
    [{ a: 3.75, round: 1 }, '3,7', false],
    [{ a: -3.75, round: 1 }, '-3,8', true],
    [{ a: -3.75, round: 1 }, '−3,7', false],
    [{ a: 2.675, round: 2 }, '2,68', true],
    [{ a: 2.675, round: 2 }, '2,67', false],
    [{ a: -2.675, round: 2 }, '-2,68', true],
    [{ a: -2.675, round: 2 }, '-2,67', false],
    // Vlak naast de halve stap.
    [{ a: 3.7499, round: 1 }, '3,7', true],
    [{ a: 3.7499, round: 1 }, '3,8', false],
    [{ a: 3.7501, round: 1 }, '3,8', true],
    [{ a: 3.7501, round: 1 }, '3,7', false],
    [{ a: 2.6749, round: 2 }, '2,67', true],
    [{ a: 2.6749, round: 2 }, '2,68', false],
    // Meer decimalen dan gevraagd is fout, ook als ze kloppen.
    [{ a: 3.75, round: 1 }, '3,75', false],
    [{ a: 8.1818, round: 1 }, '8,18', false],
    [{ a: 2 / 3, round: 2 }, '0,667', false],
    // Een nul achteraan verandert het getal niet.
    [{ a: 8.1818, round: 1 }, '8,20', true],
    // Minder decimalen mag als de nul wegvalt: 7,96 wordt 8,0.
    [{ a: 7.96, round: 1 }, '8', true],
    [{ a: 7.96, round: 1 }, '8,0', true],
    [{ a: 8.1818, round: 1 }, '8', false],
    // Een breuk als antwoord: 2/3 op twee decimalen is 0,67.
    [{ a: 2 / 3, round: 2 }, '0,67', true],
    [{ a: 2 / 3, round: 2 }, '0,66', false],
    // Een breuk is geen afgerond getal, tenzij die precies het afgeronde getal is.
    [{ a: 2 / 3, round: 2 }, '2/3', false],
    [{ a: 3.75, round: 1 }, '19/5', true],
  ];
  for (const [field, input, want] of cases)
    assert.equal(checkField(field, input), want, `${input} bij ${field.a}`);
});

test('een groep velden wordt zonder volgorde nagekeken', () => {
  const q = { q: '', fields: orFields([-2, 9]) };
  const each = (...vals) => checkAnswer(q, vals).each;
  assert.deepEqual(each('-2', '9'), [true, true]);
  assert.deepEqual(each('9', '−2'), [true, true], 'omgekeerde volgorde');
  // Twee keer hetzelfde getal is één goed antwoord, niet twee.
  assert.deepEqual(each('9', '9'), [false, true]);
  assert.deepEqual(each('-2', '-2'), [true, false]);
  // Alleen het foute veld is fout, ook als het goede getal in het andere veld hoort.
  assert.deepEqual(each('-2', '5'), [true, false]);
  assert.deepEqual(each('5', '-2'), [false, true]);
  assert.deepEqual(each('', '9'), [false, true]);
  assert.deepEqual(each('', ''), [false, false]);
  // In de uitslag staat bij een fout veld het antwoord dat nog over is.
  assert.deepEqual(matchFields(q.fields, ['9', '5']), [1, 0]);
  assert.deepEqual(matchFields(q.fields, ['5', '9']), [0, 1]);
  // Velden buiten de groep houden hun plek.
  const mixed = { q: '', fields: [...orFields([1, 4]), { pre: 'y =', a: 1 }] };
  assert.ok(checkAnswer(mixed, ['4', '1', '1']).ok);
  assert.deepEqual(checkAnswer(mixed, ['4', '1', '4']).each, [true, true, false]);
  // Een bewaarde proeftoets is JSON, en de groep blijft dan werken.
  assert.ok(checkAnswer(JSON.parse(JSON.stringify(q)), ['9', '-2']).ok);
  // Twee gelijke antwoorden: dan mag het getal twee keer.
  assert.ok(checkAnswer({ q: '', fields: orFields([3, 3]) }, ['3', '3']).ok);
});

test('een groep met afronden kent de valkuilen voor afronden in elke volgorde', () => {
  // x = 1 ± √3: 2,73 en −0,73.
  const fields = orFields([1 + Math.sqrt(3), 1 - Math.sqrt(3)], { n: 2 });
  const q = { q: '', fields, traps: roundTraps(fields) };
  assert.ok(checkAnswer(q, ['-0,73', '2,73']).ok);
  assert.ok(checkAnswer(q, ['2,73', '-0,73']).ok);
  assert.deepEqual(checkAnswer(q, ['2,73', '-0,74']).each, [true, false]);
  const trap = (...vals) => findTrap(q, vals)?.id ?? null;
  assert.equal(trap('-0,73', '2,73'), null);
  assert.equal(trap('-0,732', '2,73'), 'te-veel-decimalen');
  assert.equal(trap('2,73', '-0,732'), 'te-veel-decimalen');
  assert.equal(trap('-0,73', '2,74'), 'verkeerd-afgerond');
  assert.equal(trap('2,74', '-0,73'), 'verkeerd-afgerond');
  assert.equal(trap('5', '2,73'), null);
  // Valt een antwoord mooi uit, dan rondt dat veld niet af, en dan is het getal ook goed.
  const half = orFields([2, Math.sqrt(2)], { n: 1 });
  assert.deepEqual(
    half.map((f) => f.round),
    [undefined, 1],
  );
  assert.ok(checkAnswer({ q: '', fields: half }, ['1,4', '2']).ok);
  assert.equal(findTrap({ q: '', fields: half, traps: roundTraps(half) }, ['1,4', '2']), null);
});

test('een parabool staat in de grafiek en in de beschrijving', () => {
  const opts = { xr: [-3, 6], yr: [-5, 6], curves: [{ abc: [1, -2, -3], name: 'f' }] };
  const fig = graph(opts);
  assert.equal(graph(opts), fig, 'twee keer dezelfde tekst');
  assert.doesNotMatch(fig, / id="/);
  assert.match(fig, /<path class="l1" d="M[^"]+Q[^"]+"\/>/);
  assertDescribed(fig, 'parabool');
  const label = fig.match(/aria-label="([^"]*)"/)[1];
  assert.match(label, /De grafiek van f is een dalparabool met de top in \(1, −4\)\./);
  assert.match(label, /Hij snijdt de x-as bij x = −1 en x = 3, en de y-as bij y = −3\./);
  const desc = (o) => graph(o).match(/aria-label="([^"]*)"/)[1];
  // Snijpunten die niet mooi uitkomen, staan afgerond, en wat buiten beeld ligt, staat er niet.
  assert.match(
    desc({ xr: [-3, 3], yr: [-3, 3], curves: [{ abc: [1, 0, -2] }] }),
    /De grafiek is een dalparabool met de top in \(0, −2\)\. Hij snijdt de x-as bij x ≈ −1,4 en x ≈ 1,4, en de y-as bij y = −2\./,
  );
  assert.match(
    desc({ xr: [-2, 2], yr: [-2, 2], curves: [{ abc: [-1, 6, -5] }] }),
    /De grafiek is een bergparabool\. Hij snijdt de x-as bij x = 1\.$/,
  );
  assert.match(desc({ xr: [-3, 3], yr: [-3, 6], curves: [{ abc: [1, 0, 1] }] }), /de x-as niet/);
  // Met een andere schaal en andere letters.
  assert.match(
    desc({ xr: [0, 6], yr: [0, 8], ys: 5, xn: 't', yn: 'h', curves: [{ abc: [-5, 20, 0] }] }),
    /bergparabool met de top in \(2, 20\)\. Hij snijdt de t-as bij t = 0 en t = 4, en de h-as bij h = 0\./,
  );
  // Een schets noemt geen getallen.
  const sketch = (abc) =>
    desc({ xr: [-4, 4], yr: [-4, 4], sketch: true, curves: [{ abc }], label: 'Schets' });
  assert.equal(
    sketch([1, -2, -3]),
    'Schets. De grafiek is een dalparabool. De top ligt rechts van de y-as en onder de x-as. Hij snijdt de x-as twee keer en de y-as onder O.',
  );
  assert.equal(
    sketch([-1, -4, -4]),
    'Schets. De grafiek is een bergparabool. De top ligt links van de y-as en op de x-as. Hij raakt de x-as in de top. Hij snijdt de y-as onder O.',
  );
});

test('een schets kan een keuze zijn bij meerkeuze', () => {
  const sketch = (abc) =>
    graph({ xr: [-4, 4], yr: [-4, 4], u: 16, sketch: true, curves: [{ abc }] });
  const q = { q: '', mc: MC([sketch([1, 0, -2]), sketch([-1, 0, 2]), sketch([1, 2, 0])], 0) };
  assert.equal(new Set(q.mc.opts).size, 3);
  for (const o of q.mc.opts) assertDescribed(o, 'schets');
  const kept = JSON.parse(JSON.stringify(q));
  assert.deepEqual(kept, q);
  assert.ok(checkAnswer(kept, [String(q.mc.a)]).ok);
});

test('flipTrap herkent een omgedraaide verhouding, ook afgerond', () => {
  // x = 7·3/4 = 5,25; omgedraaid 4·3/7 ≈ 1,714.
  const fields = [{ a: 5.25, round: 1 }, { a: 6 }];
  const trap = flipTrap(fields, { 0: (4 * 3) / 7, 1: 6 });
  assert.equal(trap.id, 'verhouding-omgedraaid');
  assert.ok(trap.f([1.7, 0]), 'afgerond');
  assert.ok(trap.f([12 / 7, 0]), 'als breuk');
  assert.ok(!trap.f([1.9, 0]));
  assert.ok(!trap.f([5.3, 0]), 'het goede antwoord');
  // Is het omgedraaide getal gelijk aan het goede, dan geldt de valkuil niet.
  assert.ok(!trap.f([0, 6]));
});

test('elke soort vraag met een verhoudingstabel kent de omgedraaide verhouding', () => {
  const skills = TOPICS.flatMap((t) => t.skills);
  for (const id of [43, 44, 45, 46, 50, 52, 56]) {
    const skill = skills.find((k) => k.id === id);
    for (let seed = 0; seed < 20; seed++) {
      const ids = (makeQuestion(skill, seed).traps ?? []).map((t) => t.id);
      assert.ok(ids.includes('verhouding-omgedraaid'), `${id} met seed ${seed}`);
    }
  }
});

test('meerkeuze geeft bij een foute keuze gerichte feedback', () => {
  const skills = TOPICS.flatMap((t) => t.skills);
  const wrongPicks = (id, seed) => {
    const q = makeQuestion(
      skills.find((k) => k.id === id),
      seed,
    );
    return q.mc.opts.map((o, i) => [o, findTrap(q, [String(i)])?.id ?? null, i === q.mc.a]);
  };
  for (let seed = 0; seed < 30; seed++) {
    for (const [, trap, right] of wrongPicks(48, seed))
      assert.equal(trap, right ? null : 'hoeken-verkeerd-gekoppeld');
    for (const [, trap, right] of wrongPicks(49, seed))
      assert.equal(trap, right ? null : 'zijden-verkeerd-gekoppeld');
    const picks = wrongPicks(53, seed);
    const good = picks.find(([, , right]) => right)[0];
    for (const [o, trap, right] of picks) {
      if (right) assert.equal(trap, null);
      else if (o === 'Overstaande hoeken' || good === 'Overstaande hoeken')
        assert.equal(trap, 'overstaand-verwisseld');
      else assert.equal(trap, 'f-en-z-verwisseld');
    }
  }
});

test('een vraag met afronden heeft valkuilen voor te veel decimalen en verkeerd afronden', () => {
  const skill = TOPICS.flatMap((t) => t.skills).find((s) => s.id === 41);
  const q = makeQuestion(skill, 0);
  const trap = (vals) => findTrap(q, vals)?.id ?? null;
  assert.equal(trap(['3,75']), 'te-veel-decimalen');
  assert.equal(trap(['3,7']), 'verkeerd-afgerond');
  assert.equal(trap(['3,9']), null);
  assert.equal(
    findTrap(q, ['3,7']).m,
    'Bijna, maar je hebt verkeerd afgerond. Is het eerste cijfer dat wegvalt 5 of meer, rond dan naar boven af.',
  );
  assert.equal(findTrap(q, ['3,75']).m, 'Bijna: rond je antwoord nog af op 1 decimaal.');

  const [teVeel, verkeerd] = roundTraps([{ a: 8.1818, round: 1 }]);
  const cases = [
    // Juist, maar niet ver genoeg afgerond.
    ['8,18', 'te-veel'],
    ['8,182', 'te-veel'],
    ['8,1818', 'te-veel'],
    // Te veel decimalen, maar ook fout: geen van beide.
    ['8,24', null],
    // Afgekapt of de verkeerde kant op.
    ['8,1', 'verkeerd'],
    ['8,3', null],
    ['8,2', null],
  ];
  for (const [input, want] of cases) {
    const v = [parseNum(input)];
    const got = teVeel.f(v) ? 'te-veel' : verkeerd.f(v) ? 'verkeerd' : null;
    assert.equal(got, want, input);
  }
  // Een breuk die precies het antwoord is, is niet afgerond.
  assert.ok(roundTraps([{ a: 2 / 3, round: 2 }])[0].f([2 / 3]));
  // Een vraag zonder afronden krijgt deze valkuilen niet.
  assert.deepEqual(roundTraps([{ a: 3 }]), []);
});

test('fillState zegt of een vraag leeg, half of helemaal is ingevuld', () => {
  const skills = TOPICS.flatMap((t) => t.skills);
  const make = (test) =>
    makeQuestion(
      skills.find((k) => test(makeQuestion(k, 1))),
      1,
    );
  const twee = make((q) => q.fields?.length === 2 && !q.fields.some((f) => f.sel) && !q.line);
  const teken = make((q) => q.fields?.some((f) => f.sel));
  const lijn = make((q) => q.line);
  const mc = make((q) => q.mc);
  const vol = (q) => q.fields.map((f) => (f.sel ? f.sel[0] : '1'));
  const cases = [
    // Een getal met een leeg veld.
    [twee, ['3', ''], 'half'],
    [twee, ['', '3'], 'half'],
    [twee, vol(twee), 'ingevuld'],
    // Alleen spaties is leeg.
    [twee, ['  ', ' '], 'leeg'],
    [twee, [], 'leeg'],
    // Alleen een gekozen teken bij een ongelijkheid.
    [teken, teken.fields.map((f) => (f.sel ? f.sel[0] : '')), 'half'],
    [teken, vol(teken), 'ingevuld'],
    // Eén getekend punt.
    [lijn, ['1', '2', '', ''], 'half'],
    [lijn, ['1', '2', '3', '4'], 'ingevuld'],
    [mc, [''], 'leeg'],
    [mc, ['0'], 'ingevuld'],
  ];
  for (const [q, vals, want] of cases) assert.equal(fillState(q, vals), want, JSON.stringify(vals));
});

test('T zet wiskunde goed om', () => {
  assert.match(T('y = ax + b'), /<span class="v">ax<\/span>/);
  assert.match(T('x - 3'), /−/);
  assert.match(T('de x-as'), /-as/);
  assert.match(T('{3/4}'), /class="f"/);
  assert.match(T('2*3'), /·/);
  assert.equal(T('F-hoeken'), 'F-hoeken');
  assert.equal(T('x_top'), '<span class="v">x</span><sub>top</sub>');
  assert.equal(T('y_top'), '<span class="v">y</span><sub>top</sub>');
  assert.equal(T('x = -2 ∨ x = 9'), '<span class="v">x</span> = −2 ∨ <span class="v">x</span> = 9');
});
