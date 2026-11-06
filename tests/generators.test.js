// Draait elke vraaggenerator vaak en controleert of de vragen kloppen en te beantwoorden zijn.
// Meer rondes kan met de omgevingsvariabele QUESTIONS, bijvoorbeeld QUESTIONS=5000.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SECTIONS } from '../src/js/paragraphs/index.js';
import { checkAnswer, checkField, parseNum } from '../src/js/answers.js';
import { migrateSkills } from '../src/js/progress.js';
import { stepsHTML, T } from '../src/js/typeset.js';

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

function assertSound(q) {
  const text = q.q + (q.fig ?? '') + stepsHTML(q.steps) + q.hint + (q.mc ? q.mc.opts.join('') : '');
  for (const bad of ['NaN', 'undefined', 'Infinity', 'null', '[object']) {
    assert.ok(!text.includes(bad), `tekst bevat "${bad}": ${q.q}`);
  }
  assert.ok(!/[{}]/.test(text), `niet-omgezette accolade: ${q.q}`);
  assert.ok(q.hint, `geen hint: ${q.q}`);
  assert.ok(q.steps.length > 0, `geen uitwerking: ${q.q}`);
  if (q.v) assert.ok(q.v(), `zelfcontrole mislukt: ${q.q}`);

  if (q.mc) {
    assert.ok(q.mc.a >= 0 && q.mc.a < q.mc.opts.length, `juiste keuze bestaat niet: ${q.q}`);
    assert.equal(new Set(q.mc.opts).size, q.mc.opts.length, `dubbele keuzes: ${q.q}`);
    assert.ok(checkAnswer(q, [String(q.mc.a)]).ok, `goed antwoord afgekeurd: ${q.q}`);
    assert.ok(!checkAnswer(q, ['']).ok, `leeg antwoord goedgekeurd: ${q.q}`);
    return;
  }
  assert.ok(q.fields.length > 0, `geen invoervelden: ${q.q}`);
  for (const f of q.fields) if (!f.sel) assert.ok(Number.isFinite(f.a), `geen getal: ${q.q}`);
  const right = q.fields.map((f) =>
    f.sel ? f.a : typed(f.round ? Number(f.a.toFixed(f.round)) : f.a),
  );
  assert.ok(checkAnswer(q, right).ok, `goed antwoord afgekeurd (${right.join(' | ')}): ${q.q}`);
  // Bij een tekenvraag verschuift alleen de eerste y, want twee punten even ver opschuiven kan weer
  // een punt op dezelfde lijn geven.
  const wrong = q.fields.map((f, i) =>
    f.sel ? f.a : typed(q.check ? (i === 1 ? f.a + 7 : f.a) : f.a + 7),
  );
  assert.ok(!checkAnswer(q, wrong).ok, `fout antwoord goedgekeurd: ${q.q}`);
}

for (const section of SECTIONS) {
  test(`${section.num} ${section.title}`, async (t) => {
    for (const skill of section.skills) {
      await t.test(skill.name, () => {
        for (let i = 0; i < ROUNDS; i++) assertSound(skill.gen());
      });
    }
  });
}

test('bij een lijn tekenen is elk paar punten op de lijn goed', () => {
  const drawing = SECTIONS.flatMap((s) => s.skills).filter((k) => /tekenen$/.test(k.name));
  assert.equal(drawing.length, 3);
  for (const skill of drawing) {
    for (let i = 0; i < ROUNDS; i++) {
      const q = skill.gen();
      const [x1, y1, x2, y2] = q.fields.map((f) => f.a);
      const other = [x1 + 2 * (x2 - x1), y1 + 2 * (y2 - y1)];
      const answer = (...vals) => checkAnswer(q, vals.map(String));
      assert.ok(answer(x1, y1, ...other).ok, `ander punt op de lijn afgekeurd: ${q.q}`);
      assert.ok(answer(x2, y2, x1, y1).ok, `omgekeerde volgorde afgekeurd: ${q.q}`);
      assert.ok(!answer(x1, y1, x1, y1).ok, `twee keer hetzelfde punt goedgekeurd: ${q.q}`);
      assert.deepEqual(answer(x1, y1, x2, y2 + 1).each, [true, true, false, false]);
      assert.ok(!answer(x1, y1, '', '').ok, `één punt goedgekeurd: ${q.q}`);
    }
  }
});

test('oude voortgang verhuist mee met de nieuwe indeling', () => {
  const ids = new Set(SECTIONS.flatMap((s) => s.skills.map((k) => k.id)));
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
    assert.ok(ids.has(to), `${to} bestaat niet`);
  }
  for (const gone of ['1.5#1', '1.5#4', '2.4#1', '2.4#2']) {
    assert.deepEqual(migrateSkills({ [gone]: [1] }), {}, gone);
  }
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
    [{ a: 8.1818, round: 1 }, '8,18', true],
    [{ a: 8.1818, round: 1 }, '8,3', false],
    [{ a: 2.5 }, '2 1/2', true],
    [{ a: 2.5 }, '2,4', false],
  ];
  for (const [field, input, want] of cases) assert.equal(checkField(field, input), want, input);
});

test('T zet wiskunde goed om', () => {
  assert.match(T('y = ax + b'), /<span class="v">ax<\/span>/);
  assert.match(T('x - 3'), /−/);
  assert.match(T('de x-as'), /-as/);
  assert.match(T('{3/4}'), /class="f"/);
  assert.match(T('2*3'), /·/);
  assert.equal(T('F-hoeken'), 'F-hoeken');
});
