// Welke Rekenhulp een vraag krijgt (rekNiveau in ui/question-form.js, #18), en de knop en gegevens die het scherm
// daarvoor tekent. Zonder browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rekNiveau, rekenhulpHTML } from '../src/js/ui/question-form.js';
import { state } from '../src/js/ui/state.js';
import { TOPICS, makeQuestion } from '../src/js/topics/index.js';
import { MC } from '../src/js/topics/shared.js';

const skill = TOPICS[0].skills[0];
const getal = (extra = {}) => ({ q: '', fields: [{ label: 'x =', a: 1 }], seed: 'abc', ...extra });

test('een vraag met getallen krijgt standaard de uitgebreide Rekenhulp', () => {
  assert.equal(rekNiveau(skill, getal()), 'uitgebreid');
});

test('een vraag of onderwerp kan het niveau kiezen, of de Rekenhulp uitzetten', () => {
  assert.equal(rekNiveau(skill, getal({ rek: 'simpel' })), 'simpel');
  assert.equal(rekNiveau(skill, getal({ rek: false })), false);
  // Een vraag gaat voor op het onderwerp.
  const onderwerp = TOPICS[0];
  const was = onderwerp.rek;
  try {
    onderwerp.rek = 'simpel';
    assert.equal(rekNiveau(skill, getal()), 'simpel');
    assert.equal(rekNiveau(skill, getal({ rek: 'uitgebreid' })), 'uitgebreid');
    onderwerp.rek = false;
    assert.equal(rekNiveau(skill, getal()), false);
  } finally {
    if (was === undefined) delete onderwerp.rek;
    else onderwerp.rek = was;
  }
});

test('meerkeuze en alleen keuzelijsten krijgen geen Rekenhulp, een tekenvraag wel (ingeklapt)', () => {
  assert.equal(rekNiveau(skill, { q: '', mc: MC(['a', 'b'], 0), seed: 'x' }), false);
  assert.equal(rekNiveau(skill, getal({ line: { a: 1, b: 0 } })), 'uitgebreid');
  assert.equal(rekNiveau(skill, getal({ parabola: { a: 1, b: 0, c: 0 } })), 'uitgebreid');
  assert.match(rekenhulpHTML(skill, getal({ line: { a: 1, b: 0 } })).attrs, /data-rek-klap/);
  assert.doesNotMatch(rekenhulpHTML(skill, getal()).attrs, /data-rek-klap/);
  assert.equal(rekNiveau(skill, getal({ fields: [{ sel: ['<', '>'], a: '<' }] })), false);
  // Een keuzelijst naast een getal is genoeg om de Rekenhulp te geven.
  assert.equal(
    rekNiveau(
      skill,
      getal({
        fields: [
          { sel: ['<', '>'], a: '<' },
          { label: 'x', a: 2 },
        ],
      }),
    ),
    'uitgebreid',
  );
});

test('de knop en de gegevens voor het formulier', () => {
  const r = rekenhulpHTML(skill, getal({ rek: 'simpel' }));
  assert.match(r.button, /data-act="rekenhulp"/);
  assert.match(r.button, /aria-expanded="false"/);
  assert.match(r.attrs, /data-rek="simpel"/);
  assert.match(r.attrs, new RegExp(`data-vraag="${skill.id}-abc"`));
  // Zonder Rekenhulp is er geen knop en zijn er geen gegevens.
  assert.deepEqual(rekenhulpHTML(skill, getal({ rek: false })), { button: '', attrs: '' });
  // De knop zegt of het paneel open staat.
  state.rekenhulp.open = true;
  try {
    assert.match(rekenhulpHTML(skill, getal()).button, /aria-expanded="true"/);
  } finally {
    state.rekenhulp.open = false;
  }
});

test('een onbekend niveau is uitgebreid, ook van een onderwerp', () => {
  assert.equal(rekNiveau(skill, getal({ rek: 'eenvoudig' })), 'uitgebreid');
  assert.equal(rekNiveau(skill, getal({ rek: 'simpel' })), 'simpel');
});

test('dezelfde seed geeft dezelfde HTML voor de knop', () => {
  // Het scherm hoort voor dezelfde toestand steeds dezelfde HTML te geven: geen toeval en geen tellers.
  for (const t of TOPICS.slice(0, 6))
    for (const k of t.skills) {
      if (!k.gen) continue;
      const q = makeQuestion(k, 'seed1');
      const a = rekenhulpHTML(k, q);
      assert.deepEqual(a, rekenhulpHTML(k, makeQuestion(k, 'seed1')), k.name);
    }
});
