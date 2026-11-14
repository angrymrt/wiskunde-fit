// Controleert de melding van een probleem bij een vraag: de links naar GitHub en e-mail, wat er wel
// en niet in staat, en dat het formulier op GitHub bij de links past.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { makeQuestion, TOPICS } from '../src/js/topics/index.js';

const ui = new URL('../src/js/ui/', import.meta.url);
const topic = TOPICS.at(-1);
const skill = topic.skills.at(-1);
const path = `/${topic.slug}/oefenen?soort=${skill.id}&seed=k3x9q`;

test('de melding bevat alleen de vraag, de vraagsoort, de versie en wat de leerling schreef', async () => {
  const { melding, githubLink, mailLink, MAX_TEKST } = await import(new URL('melden.js', ui));
  const m = melding({ soort: skill, path, wat: 'antwoord-goed', tekst: '  Ik kom op 3x uit.  ' });
  assert.deepEqual(Object.keys(m).sort(), [
    'soort',
    'titel',
    'toelichting',
    'versie',
    'vraag',
    'wat',
  ]);
  assert.equal(m.vraag, `https://wiskundefit.nl${path}`);
  assert.equal(m.toelichting, 'Ik kom op 3x uit.');
  assert.equal(m.wat, 'Mijn antwoord is goed, maar de site zegt fout');
  // Een onbekende keuze geeft geen melding, en een te lange tekst wordt afgekapt.
  assert.equal(melding({ soort: skill, path, wat: '', tekst: '' }), null);
  assert.equal(melding({ soort: skill, path, wat: 'nep', tekst: '' }), null);
  assert.equal(
    melding({ soort: skill, path, wat: 'anders', tekst: 'x'.repeat(MAX_TEKST + 50) }).toelichting
      .length,
    MAX_TEKST,
  );

  const gh = new URL(githubLink(m));
  assert.equal(gh.origin + gh.pathname, 'https://github.com/angrymrt/wiskunde-fit/issues/new');
  assert.equal(gh.searchParams.get('template'), 'vraagmelding.yml');
  for (const k of ['vraag', 'soort', 'versie', 'wat', 'toelichting', 'title']) {
    assert.ok(gh.searchParams.has(k), k);
  }
  assert.equal(gh.searchParams.get('toelichting'), 'Ik kom op 3x uit.');
  assert.ok(githubLink(m).length < 4000, 'GitHub weigert een heel lange link');

  const mail = new URL(mailLink(m));
  assert.equal(mail.protocol, 'mailto:');
  assert.equal(mail.pathname, 'contact@wiskundefit.nl');
  assert.match(mail.searchParams.get('subject'), /^Probleem bij vraag: /);
  assert.match(mail.searchParams.get('body'), /Vraag: https:\/\/wiskundefit\.nl\//);
  assert.match(mail.searchParams.get('body'), /Toelichting: Ik kom op 3x uit\./);
  // Zonder toelichting staat er dat, zodat de mail niet leeg lijkt.
  const kaal = melding({ soort: skill, path, wat: 'uitleg', tekst: '' });
  assert.match(new URL(mailLink(kaal)).searchParams.get('body'), /Toelichting: \(geen\)/);
});

test('de keuzes passen bij het formulier op GitHub', async () => {
  const { WAT } = await import(new URL('melden.js', ui));
  const yml = await readFile(
    new URL('../.github/ISSUE_TEMPLATE/vraagmelding.yml', import.meta.url),
    'utf8',
  );
  for (const [, tekst] of WAT) assert.ok(yml.includes(`- ${tekst}\n`), tekst);
  for (const id of ['vraag', 'soort', 'versie', 'wat', 'toelichting']) {
    assert.ok(yml.includes(`id: ${id}\n`), id);
  }
  assert.match(yml, /labels: \['vraagmelding'\]/);
});

test('het paneel staat er alleen bij de vraag die je meldt, en de knoppen wachten op een keuze', async () => {
  const { meldHTML } = await import(new URL('question-form.js', ui));
  const { state } = await import(new URL('state.js', ui));
  const q = makeQuestion(skill, 33775406);
  const open = meldHTML(skill, q);
  assert.match(
    open.button,
    /data-act="meld"[^>]*aria-haspopup="dialog">[^]*Meld een probleem<\/button>$/,
  );
  assert.equal(open.panel, '');
  // Een vraag uit een proeftoets van voor de seed kun je niet melden.
  const { seed, ...old } = q;
  assert.equal(seed, 33775406);
  assert.deepEqual(meldHTML(skill, old), { button: '', panel: '' });
  try {
    state.melden = {
      path: `/${topic.slug}/oefenen?soort=${skill.id}&seed=k3x9q`,
      wat: '',
      tekst: '',
    };
    const zonder = meldHTML(skill, q).panel;
    assert.match(zonder, /role="dialog" aria-modal="true" aria-labelledby="meldkop"/);
    assert.equal((zonder.match(/name="meldwat"/g) || []).length, 4);
    assert.doesNotMatch(zonder, /checked/, 'er is niets voorgekozen');
    assert.match(zonder, /disabled>Via GitHub[^]*disabled>Via e-mail/);
    assert.doesNotMatch(zonder, /href="https:\/\/github\.com/);
    assert.match(zonder, /Kies eerst wat er aan de hand is/);
    state.melden.wat = 'uitleg';
    state.melden.tekst = 'Dit <b>klopt</b> niet';
    const gekozen = meldHTML(skill, q).panel;
    assert.match(gekozen, /value="uitleg" checked/);
    assert.match(gekozen, /href="https:\/\/github\.com\/angrymrt\/wiskunde-fit\/issues\/new\?/);
    assert.match(gekozen, /href="mailto:contact@wiskundefit\.nl\?/);
    assert.doesNotMatch(gekozen, /disabled/);
    assert.doesNotMatch(gekozen, /<b>klopt/, 'wat je typt wordt niet als HTML gezet');
    // Het paneel hoort bij één vraag: bij een andere vraag staat het er niet.
    assert.equal(meldHTML(skill, makeQuestion(skill, 1)).panel, '');
  } finally {
    state.melden = null;
  }
});
