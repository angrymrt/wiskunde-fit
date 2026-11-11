// Een vingerafdruk per vraagsoort: een korte hash van de antwoorden bij een paar vaste seeds. Die
// verandert als dezelfde seed een andere vraag geeft, en dan toont een gedeelde link ineens een
// andere vraag dan de leerling zag. Zie #60, tests/vingerafdrukken.test.js en
// scripts/vingerafdrukken.js.
import { createHash } from 'node:crypto';
import { TOPICS, makeQuestion } from '../src/js/topics/index.js';

// Genoeg seeds om elke tak van een generator te raken, en snel genoeg voor npm test.
const SEEDS = Array.from({ length: 25 }, (_, i) => 1000 + i * 7919);

// Alleen wat er bij de vraag hoort: de antwoorden, de keuzes en de lijn. Een andere tekst, hint of
// uitwerking verandert de vraag niet, en mag dus zonder nieuwe versie.
const answers = (q) => ({
  fields: (q.fields ?? []).map((f) => f.a),
  mc: q.mc ? { opts: q.mc.opts, a: q.mc.a } : null,
  line: q.line ?? null,
});

function fingerprints() {
  const out = {};
  for (const skill of TOPICS.flatMap((t) => t.skills)) {
    const data = JSON.stringify(SEEDS.map((seed) => answers(makeQuestion(skill, seed))));
    out[skill.id] = createHash('sha256').update(data).digest('hex').slice(0, 12);
  }
  return out;
}

export { fingerprints };
