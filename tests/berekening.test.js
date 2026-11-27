// Een berekening die de leerling zelf typt (#262): Haakjes zetten (221) en Rekentekens zetten (222).
// answers.js leest de berekening met een eigen ontleder (leesBerekening). Deze test rekent die na met
// narekenen uit shared.js, en kijkt welke schrijfwijzen goed zijn en welke valkuil bij een fout hoort.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, makeQuestion } from '../src/js/topics/index.js';
import { checkAnswer, findTrap, leesBerekening } from '../src/js/answers.js';
import { narekenen } from '../src/js/topics/shared.js';

const skill = (id) => TOPICS.flatMap((t) => t.skills).find((k) => k.id === id);
const seeds = Array.from({ length: 300 }, (_, i) => (i * 2654435761) >>> 0);

test('leesBerekening rekent hetzelfde als narekenen (#262)', () => {
  for (const id of [221, 222])
    for (const seed of seeds) {
      const s = makeQuestion(skill(id), seed).fields[0].a;
      assert.equal(leesBerekening(s).waarde, narekenen(s), s);
    }
  for (const s of [
    '18 - 6 : 3',
    '-5 - 3 * -2',
    '(4 - 9) : -5',
    '20 - (8 - 3) * 2',
    '2 * (3 + (4 - 1))',
  ])
    assert.equal(leesBerekening(s).waarde, narekenen(s), s);
});

test('een berekening mag met ·, x, ×, −, ÷ en extra haakjes, maar moet te lezen zijn (#262)', () => {
  const r = leesBerekening('4 · (−3) − 12 ÷ -4 x 2');
  assert.deepEqual(r.getallen, [4, -3, 12, -4, 2]);
  assert.deepEqual(r.tekens, ['*', '-', ':', '*']);
  assert.equal(r.waarde, -6);
  // De uitkomst erachter mag, als die klopt.
  assert.equal(leesBerekening('4 * -3 = -12').waarde, -12);
  assert.ok(Number.isNaN(leesBerekening('4 * -3 = 12').waarde));
  for (const s of [
    '4 * -3 = ',
    '4 = 4 = 4',
    '3 4',
    '(3 + 4',
    '3 + 4)',
    '-(3 + 4)',
    '3 + + 4',
    '3(4 + 5)',
    '3 + a',
    '2,5 + 1',
  ])
    assert.equal(leesBerekening(s), null, s);
});

test('Haakjes zetten: elke plek van de haakjes met de goede uitkomst is goed (#262)', () => {
  const q = makeQuestion(skill(221), seeds[1]),
    b = q.fields[0].berekening;
  assert.ok(checkAnswer(q, [q.fields[0].a]).ok);
  // Extra haakjes om een getal of om de hele berekening veranderen niets.
  assert.ok(checkAnswer(q, [`(${q.fields[0].a.replace(/(\d+)/, '($1)')})`]).ok);
  for (const seed of seeds) {
    const q = makeQuestion(skill(221), seed),
      { getallen, tekens } = q.fields[0].berekening,
      kaal = getallen.flatMap((x, i) => (i ? [tekens[i - 1], x] : [x])).join(' ');
    // Zonder haakjes klopt de uitkomst niet.
    assert.ok(!checkAnswer(q, [kaal]).ok, kaal);
    assert.equal(findTrap(q, [kaal])?.id, 'berekening-andere-uitkomst', kaal);
    // Een ander rekenteken is fout, ook als de uitkomst toevallig klopt.
    const ander = q.fields[0].a.replace(/[-+*:]/, (op) => (op === '+' ? '-' : '+'));
    assert.ok(!checkAnswer(q, [ander]).ok, ander);
    assert.equal(findTrap(q, [ander])?.id, 'berekening-andere-getallen', ander);
  }
  assert.ok(b.tekens.length >= 1);
});

test('Rekentekens zetten: de min van een getal mag in de plus of min ervoor zitten (#262)', () => {
  const q = {
    fields: [{ a: '-2 * 2 + -5 + -3', berekening: { getallen: [-2, 2, -5, -3], uitkomst: -12 } }],
  };
  for (const s of ['-2 * 2 + -5 + -3', '-2 · 2 − 5 − 3', '-2 * 2 - 5 + -3', '(-2 * 2) + (-5) - 3'])
    assert.ok(checkAnswer(q, [s]).ok, s);
  // Het eerste getal en een getal na keer houden hun teken, en de volgorde blijft.
  for (const s of ['2 * -2 - 5 - 3', '-2 * -2 * -5 + 8', '-3 + -5 + -2 * 2'])
    assert.ok(!checkAnswer(q, [s]).ok, s);
  for (const seed of seeds) {
    const q = makeQuestion(skill(222), seed),
      { getallen, uitkomst } = q.fields[0].berekening;
    assert.ok(checkAnswer(q, [q.fields[0].a]).ok, q.fields[0].a);
    // Alles plus is meestal een andere uitkomst; dan valt de valkuil voor de uitkomst.
    const plus = getallen.join(' + ');
    if (narekenen(plus) !== uitkomst)
      assert.equal(findTrap(q, [plus])?.id, 'berekening-andere-uitkomst', plus);
    const om = [...getallen].reverse().join(' * ');
    if (getallen[0] !== getallen[getallen.length - 1])
      assert.equal(findTrap(q, [om])?.id, 'berekening-andere-getallen', om);
  }
});
