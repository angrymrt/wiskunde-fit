// De valkuilen van Rekenen met breuken (#244): elke valkuil kan afgaan bij de fout waar hij over gaat,
// en nooit bij het goede antwoord. Elke valkuil van dit onderwerp heeft een lijst w met [veld, foute
// waarde]; de test typt die foute waarde als breuk in, en de goede antwoorden in de andere velden.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, makeQuestion } from '../src/js/topics/index.js';
import { checkAnswer, findTrap } from '../src/js/answers.js';

const topic = TOPICS.find((t) => t.slug === 'rekenen-met-breuken');
const seeds = Array.from({ length: 400 }, (_, i) => (i * 2654435761) >>> 0);

// Een getal zoals een leerling het als breuk typt, zoals 17/30 of -1/4.
function typ(x) {
  if (Number.isInteger(x)) return String(x);
  for (let den = 2; den <= 1000; den++) {
    const n = Math.round(x * den);
    if (Math.abs(x * den - n) < 1e-7) return `${n}/${den}`;
  }
  throw new Error(`geen breuk: ${x}`);
}

const VALKUILEN = {
  195: ['tellers-en-noemers-opgeteld'],
  196: ['tellers-en-noemers-opgeteld', 'alleen-noemer-veranderd', 'haakjes-genegeerd'],
  197: ['helen-en-breuken-los', 'tellers-en-noemers-opgeteld', 'alleen-noemer-veranderd'],
  198: [
    'toch-gelijknamig-gemaakt',
    'noemer-gelijk-gelaten',
    'heel-getal-teller-en-noemer',
    'gemengd-los-vermenigvuldigd',
  ],
  199: [
    'alleen-door-noemer-gedeeld',
    'heel-getal-teller-en-noemer',
    'gedeeld-door-de-breuk',
    'deel-in-plaats-van-rest',
  ],
  200: ['haakjes-genegeerd', 'zonder-voorrang'],
  216: ['opgeteld-bij-terugrekenen', 'tellers-en-noemers-opgeteld'],
};

for (const skill of topic.skills) {
  test(`${skill.name}: elke valkuil kan afgaan, en nooit bij het goede antwoord (#244)`, () => {
    const gezien = new Set();
    for (const seed of seeds) {
      const q = makeQuestion(skill, seed),
        goed = q.fields.map((f) => typ(f.a)),
        waar = `${q.q} (seed ${seed})`;
      assert.ok(checkAnswer(q, goed).ok, waar);
      assert.equal(findTrap(q, goed), null, waar);
      for (const t of q.traps.filter((t) => t.w)) {
        for (const [i, x] of t.w) {
          const vals = goed.map((v, k) => (k === i ? typ(x) : v));
          assert.ok(!checkAnswer(q, vals).ok, `${t.id} keurt een fout antwoord goed: ${waar}`);
          assert.equal(findTrap(q, vals)?.id, t.id, `${t.id} gaat niet af bij ${vals}: ${waar}`);
          gezien.add(t.id);
        }
      }
    }
    assert.deepEqual([...gezien].sort(), [...VALKUILEN[skill.id]].sort());
  });
}

// Een breuk die klopt maar niet vereenvoudigd is, is fout, met een eigen melding.
test('Rekenen met breuken vraagt een vereenvoudigde breuk (#244)', () => {
  const skill = topic.skills.find((k) => k.id === 196);
  for (const seed of seeds.slice(0, 50)) {
    const q = makeQuestion(skill, seed),
      x = q.fields[0].a;
    if (Number.isInteger(x)) continue;
    const t = typ(x).split('/').map(Number),
      dubbel = `${t[0] * 2}/${t[1] * 2}`;
    assert.ok(!checkAnswer(q, [dubbel]).ok, q.q);
    assert.equal(findTrap(q, [dubbel])?.id, 'breuk-niet-vereenvoudigd', q.q);
  }
});
