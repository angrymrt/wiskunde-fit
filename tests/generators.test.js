// Draait elke vraaggenerator vaak en controleert of de vragen kloppen en te beantwoorden zijn.
// Meer rondes kan met de omgevingsvariabele QUESTIONS, bijvoorbeeld QUESTIONS=5000.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DOMAINS, TOPICS, makeQuestion } from '../src/js/topics/index.js';
import { flipTrap } from '../src/js/topics/shared.js';
import { parseSeed, rd, seedText } from '../src/js/math.js';
import {
  checkAnswer,
  checkField,
  fillState,
  findTrap,
  parseNum,
  roundTraps,
} from '../src/js/answers.js';
import { migrateIds, migrateSkills } from '../src/js/progress.js';
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
    assert.equal(new Set(q.mc.opts).size, q.mc.opts.length, `dubbele keuzes: ${q.q}`);
    assert.ok(checkAnswer(q, [String(q.mc.a)]).ok, `goed antwoord afgekeurd: ${q.q}`);
    assertNoTrap(q, [String(q.mc.a)]);
    assert.ok(!checkAnswer(q, ['']).ok, `leeg antwoord goedgekeurd: ${q.q}`);
    assert.ok(checkAnswer(stored(q), [String(q.mc.a)]).ok, `bewaard niet na te kijken: ${q.q}`);
    return;
  }
  assert.ok(q.fields.length > 0, `geen invoervelden: ${q.q}`);
  for (const f of q.fields) if (!f.sel) assert.ok(Number.isFinite(f.a), `geen getal: ${q.q}`);
  const right = q.fields.map((f) =>
    f.sel ? f.a : f.round ? String(rd(f.a, f.round)).replace('.', ',') : typed(f.a),
  );
  assert.ok(checkAnswer(q, right).ok, `goed antwoord afgekeurd (${right.join(' | ')}): ${q.q}`);
  assertNoTrap(q, right);
  // Bij een tekenvraag verschuift alleen de eerste y, want twee punten even ver opschuiven kan weer
  // een punt op dezelfde lijn geven.
  const wrong = q.fields.map((f, i) =>
    f.sel ? f.a : typed(q.line ? (i === 1 ? f.a + 7 : f.a) : f.a + 7),
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

test('bij een lijn tekenen is elk paar punten op de lijn goed', () => {
  const drawing = TOPICS.flatMap((s) => s.skills).filter((k) => /tekenen$/.test(k.name));
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
});
