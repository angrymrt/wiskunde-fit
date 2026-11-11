// Een vingerafdruk per vraagsoort: een korte hash van de antwoorden bij een paar vaste seeds. Die
// verandert als dezelfde seed een andere vraag geeft, en dan toont een gedeelde link ineens een
// andere vraag dan de leerling zag. Zie #60, tests/vingerafdrukken.test.js en
// scripts/vingerafdrukken.js.
import { createHash } from 'node:crypto';
import { TOPICS, makeQuestion } from '../src/js/topics/index.js';

// Genoeg seeds om elke tak van een generator te raken, en snel genoeg voor npm test.
const SEEDS = Array.from({ length: 25 }, (_, i) => 1000 + i * 7919);

// Wat de vraag bepaalt: de getallen in de vraag, de antwoorden, de keuzes en de lijn. Andere
// woorden, een hint of een uitwerking veranderen de vraag niet, en mogen dus zonder nieuwe versie.
// De figuur telt niet mee, want daarin staat ook de opmaak. Wat erin gegeven is, staat meestal ook
// in de vraag of het antwoord.
const numbers = (html) => html.replace(/<[^>]*>/g, ' ').match(/\d+(?:[.,]\d+)?/g) ?? [];
const answers = (q) => ({
  numbers: numbers(q.q),
  fields: (q.fields ?? []).map((f) => f.a),
  mc: q.mc ? { opts: q.mc.opts, a: q.mc.a } : null,
  line: q.line ?? null,
});
// Afgerond op 10 cijfers, zodat een verschil in de laatste bit tussen Node-versies, bijvoorbeeld
// bij Math.sin, geen vals alarm geeft.
const steady = (key, x) => (typeof x === 'number' ? Number(x.toPrecision(10)) : x);

function fingerprints() {
  const out = {};
  for (const skill of TOPICS.flatMap((t) => t.skills)) {
    const data = JSON.stringify(
      SEEDS.map((seed) => answers(makeQuestion(skill, seed))),
      steady,
    );
    out[skill.id] = createHash('sha256').update(data).digest('hex').slice(0, 12);
  }
  return out;
}

export { fingerprints };
