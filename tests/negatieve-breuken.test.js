// De valkuilen van Negatieve breuken (#244): elke valkuil kan afgaan bij de fout waar hij over gaat,
// en nooit bij het goede antwoord. Elke valkuil van dit onderwerp heeft een lijst w met [veld, foute
// waarde]; de test typt die foute waarde als breuk in, en de goede antwoorden in de andere velden.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, makeQuestion } from '../src/js/topics/index.js';
import { checkAnswer, findTrap } from '../src/js/answers.js';

const topic = TOPICS.find((t) => t.slug === 'negatieve-breuken');
const seeds = Array.from({ length: 400 }, (_, i) => (i * 2654435761) >>> 0);

// Een getal zoals een leerling het typt: een breuk zoals -17/30, of bij de vorm gemengd een gemengd
// getal zoals -2 1/3.
function typ(x, vorm) {
  if (Number.isInteger(x)) return String(x);
  for (let den = 2; den <= 1000; den++) {
    const n = Math.round(x * den);
    if (Math.abs(x * den - n) >= 1e-7) continue;
    const a = Math.abs(n),
      heel = Math.floor(a / den);
    if (vorm === 'gemengd' && heel) return `${n < 0 ? '-' : ''}${heel} ${a % den}/${den}`;
    return `${n}/${den}`;
  }
  throw new Error(`geen breuk: ${x}`);
}

const VALKUILEN = {
  211: [
    'niet-eerst-teller-en-noemer',
    'min-gedeeld-door-min-is-min',
    'minteken-vergeten',
    'teller-en-noemer-omgedraaid',
  ],
  212: ['minteken-weggelaten', 'twee-mintekens-niet-weggestreept'],
  213: [
    'min-alleen-op-de-helen',
    'plus-min-als-plus',
    'min-min-als-min',
    'negatief-min-getal-als-verschil',
    'tellers-en-noemers-opgeteld',
    'alleen-noemer-veranderd',
    'minteken-vergeten',
  ],
  214: [
    'min-alleen-op-de-helen',
    'gemengd-los-vermenigvuldigd',
    'heel-getal-teller-en-noemer',
    'toch-gelijknamig-gemaakt',
    'noemer-gelijk-gelaten',
    'min-keer-min-is-min',
    'minteken-vergeten',
    'min-min-als-min',
    'keerregel-bij-aftrekken',
    'negatief-min-getal-als-verschil',
  ],
  219: ['minteken-fout'],
};

for (const skill of topic.skills) {
  test(`${skill.name}: elke valkuil kan afgaan, en nooit bij het goede antwoord (#244)`, () => {
    const gezien = new Set();
    for (const seed of seeds) {
      const q = makeQuestion(skill, seed),
        goed = q.fields.map((f) => typ(f.a, f.vorm)),
        waar = `${q.q} (seed ${seed})`;
      assert.ok(checkAnswer(q, goed).ok, waar);
      assert.equal(findTrap(q, goed), null, waar);
      for (const t of q.traps.filter((t) => t.w)) {
        for (const [i, x] of t.w) {
          const vals = goed.map((v, k) => (k === i ? typ(x, q.fields[i].vorm) : v));
          assert.ok(!checkAnswer(q, vals).ok, `${t.id} keurt een fout antwoord goed: ${waar}`);
          assert.equal(findTrap(q, vals)?.id, t.id, `${t.id} gaat niet af bij ${vals}: ${waar}`);
          gezien.add(t.id);
        }
      }
    }
    assert.deepEqual([...gezien].sort(), [...VALKUILEN[skill.id]].sort());
  });
}

// Zoals in het boek staat in een antwoord geen minteken in de teller of de noemer, en de breuk is
// vereenvoudigd. Wie bij een negatieve breuk het teken goed heeft maar niet vereenvoudigt, krijgt
// de melding over vereenvoudigen.
test('Negatieve breuken vraagt een vereenvoudigde breuk (#244)', () => {
  let gevallen = 0;
  for (const skill of topic.skills.filter((k) => k.id !== 211)) {
    for (const seed of seeds.slice(0, 60)) {
      const q = makeQuestion(skill, seed),
        x = q.fields[0].a;
      if (Number.isInteger(x) || q.fields[0].vorm !== 'vereenvoudigd') continue;
      const [t, n] = typ(x).split('/').map(Number),
        vals = q.fields.map((f) => typ(f.a, f.vorm));
      vals[0] = `${t * 3}/${n * 3}`;
      assert.ok(!checkAnswer(q, vals).ok, q.q);
      assert.equal(findTrap(q, vals)?.id, 'breuk-niet-vereenvoudigd', q.q);
      gevallen++;
    }
  }
  assert.ok(gevallen > 50, `genoeg negatieve breuken: ${gevallen}`);
});

// De uitwerking en de vraag zetten een negatieve breuk met het minteken voor de breuk, en nooit met
// een min in de teller of de noemer, behalve in de vraag van 211 en 212 (#244).
test('Negatieve breuken zet het minteken voor de breuk (#244)', () => {
  // In T-notatie: {-3/4} of {3/-4}. Een negatief gemengd getal {-2 1/3} mag wel.
  const inBreuk = /\{-\d+\/|\/-\d/;
  for (const skill of topic.skills.filter((k) => k.id === 213 || k.id === 214)) {
    for (const seed of seeds.slice(0, 100)) {
      const q = makeQuestion(skill, seed);
      for (const s of [...q.fields.map((f) => f.pre), ...q.steps])
        assert.ok(!inBreuk.test(s), `${s}: ${q.q}`);
    }
  }
});
