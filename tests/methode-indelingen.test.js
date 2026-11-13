// Controleert of de methode-indelingen kloppen met de vraagsoorten en met wat is afgesproken.
import test from 'node:test';
import assert from 'node:assert/strict';
import { MAPPING, MAPPINGS } from '../src/js/mappings/index.js';
import { migrateScope, prog } from '../src/js/progress.js';
import {
  ALL_IDS,
  chosenTopics,
  setStof,
  stofFromBook,
  stofGaps,
  toggleStof,
} from '../src/js/stof.js';
import { TOPICS } from '../src/js/topics/index.js';
import { T } from '../src/js/typeset.js';

const paragraphsOf = (m) => m.chapters.flatMap((c) => c.paragraphs);
const skillIdsOf = (m) => paragraphsOf(m).flatMap((p) => p.skills);

// Het laatste cijfer van een ISBN volgt uit de andere twaalf, dus een tikfout valt zo op.
function validIsbn(isbn) {
  if (!/^97[89]\d{10}$/.test(isbn)) return false;
  const sum = [...isbn].reduce((t, c, i) => t + Number(c) * (i % 2 ? 3 : 1), 0);
  return sum % 10 === 0;
}

test('id en adres zijn uniek en het adres is geldig', () => {
  assert.equal(new Set(MAPPINGS.map((m) => m.id)).size, MAPPINGS.length);
  assert.equal(new Set(MAPPINGS.map((m) => m.slug)).size, MAPPINGS.length);
  for (const m of MAPPINGS) assert.match(m.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, m.id);
});

test('elke methode-indeling heeft alle paragrafen', () => {
  const expected = { 'gr13-hv1': 47, 'gr13-hv2': 39, 'gr13-havo3': 46 };
  for (const m of MAPPINGS) assert.equal(paragraphsOf(m).length, expected[m.id], m.id);
});

test('hoofdstukken en paragrafen hebben een eigen nummer en omschrijving', () => {
  for (const m of MAPPINGS) {
    const numbers = paragraphsOf(m).map((p) => p.number);
    const texts = [...m.chapters, ...paragraphsOf(m)].map((x) => x.description);
    assert.equal(new Set(numbers).size, numbers.length, `${m.id}: dubbel paragraafnummer`);
    for (const chapter of m.chapters) {
      assert.equal(typeof chapter.number, 'string', `${m.id}: hoofdstuknummer is geen tekst`);
      for (const p of chapter.paragraphs) {
        assert.ok(p.number.startsWith(`${chapter.number}.`), `${m.id}: ${p.number} staat verkeerd`);
      }
    }
    for (const text of texts) {
      assert.ok(text, `${m.id}: lege omschrijving`);
      assert.ok(!/[{}]/.test(T(text)), `${m.id}: niet-omgezette accolade: ${text}`);
    }
    assert.equal(new Set(texts).size, texts.length, `${m.id}: dubbele omschrijving`);
  }
});

test('een vraagsoort bestaat en staat maar één keer in een methode-indeling', () => {
  const known = new Set(TOPICS.flatMap((t) => t.skills.map((k) => k.id)));
  for (const m of MAPPINGS) {
    const ids = skillIdsOf(m);
    for (const id of ids) assert.ok(known.has(id), `${m.id}: vraagsoort ${id} bestaat niet`);
    assert.equal(new Set(ids).size, ids.length, `${m.id}: dubbele vraagsoort`);
  }
});

test('de dekking klopt met de vraagsoorten', () => {
  for (const m of MAPPINGS) {
    for (const p of paragraphsOf(m)) {
      assert.ok(['gedekt', 'deels', 'niet'].includes(p.coverage), `${m.id} ${p.number}`);
      assert.equal(p.coverage === 'niet', p.skills.length === 0, `${m.id} ${p.number}`);
    }
  }
});

test('een methode-indeling die niet is vergeleken met het boek zegt dat', () => {
  for (const m of MAPPINGS) {
    const coverage = paragraphsOf(m).map((p) => p.coverage);
    if (m.note) assert.ok(!coverage.includes('gedekt'), `${m.id}: gedekt zonder vergelijking`);
  }
});

test('een deels gedekte paragraaf zegt wat ontbreekt', () => {
  for (const m of MAPPINGS) {
    for (const p of paragraphsOf(m)) {
      if (p.note) assert.equal(p.coverage, 'deels', `${m.id} ${p.number}: uitleg zonder deels`);
      if (p.coverage === 'deels' && !m.note) assert.ok(p.note, `${m.id} ${p.number}: geen uitleg`);
      if (p.note) assert.ok(!/[{}]/.test(T(p.note)), `${m.id} ${p.number}: accolade`);
    }
  }
});

test('havo 3 dekt vijftien paragrafen, zonder de voorkennis', () => {
  const m = MAPPING['gr13-havo3'];
  const count = (c) => paragraphsOf(m).filter((p) => p.coverage === c).length;
  assert.equal(count('gedekt'), 12);
  assert.equal(count('deels'), 3);
  assert.equal(count('niet'), 31);
  assert.equal(skillIdsOf(m).length, 97);
  for (const id of [1, 2, 38, 39, 40]) assert.ok(!skillIdsOf(m).includes(id), `voorkennis ${id}`);
});

test('elk deel heeft een leerboek en een FLEX-boek met een geldig ISBN', () => {
  const isbns = MAPPINGS.flatMap((m) => m.books.map((b) => b.isbn));
  assert.equal(new Set(isbns).size, isbns.length, 'dubbel ISBN');
  for (const m of MAPPINGS) {
    for (const b of m.books) assert.ok(validIsbn(b.isbn), `${b.name}: ${b.isbn}`);
    for (const part of new Set(m.books.map((b) => b.part))) {
      const names = m.books.filter((b) => b.part === part).map((b) => b.name);
      assert.equal(names.length, 2, `${m.id} ${part}`);
      assert.equal(names.filter((n) => n.includes('FLEX')).length, 1, `${m.id} ${part}`);
    }
    for (const c of m.chapters) {
      assert.ok(
        m.books.some((b) => b.part === c.part),
        `${m.id}: hoofdstuk ${c.number}`,
      );
    }
  }
});

test('de stofkeuze is een lijst vraagsoorten die je aan en uit kunt zetten', () => {
  setStof([]);
  assert.equal(prog.stof, null);
  toggleStof([25, 23]);
  assert.deepEqual(prog.stof, [23, 25]);
  toggleStof([24, 25]);
  assert.deepEqual(prog.stof, [23, 24, 25]);
  toggleStof([24, 25]);
  assert.deepEqual(prog.stof, [23]);
  assert.deepEqual(
    chosenTopics([38, 23]).map((g) => g.topic.slug),
    ['snijpunten-van-lijnen', 'stelling-van-pythagoras'],
  );
  setStof(ALL_IDS);
  assert.equal(prog.stof.length, 102);
  setStof([]);
});

test('Mijn stof noemt alleen wat ontbreekt in de gekozen hoofdstukken', () => {
  prog.mapping = 'gr13-hv2';
  setStof([38]);
  assert.deepEqual(
    stofGaps().map((p) => [p.number, p.coverage]),
    [
      ['6.1', 'niet'],
      ['6.2', 'deels'],
      ['6.3', 'deels'],
      ['6.4', 'deels'],
      ['6.5', 'niet'],
    ],
  );
  prog.mapping = 'gr13-havo3';
  setStof([3]);
  assert.deepEqual(stofGaps(), [], 'hoofdstuk 1 van havo 3 is helemaal gedekt');
  prog.mapping = null;
  assert.deepEqual(stofGaps(), [], 'op onderwerp gekozen: geen boek om mee te vergelijken');
  setStof([]);
});

test('Mijn stof zegt welke hoofdstukken en paragrafen uit je boek komen', () => {
  const havo3 = MAPPING['gr13-havo3'].chapters;
  const ids = (number) =>
    havo3.find((c) => c.number === number).paragraphs.flatMap((p) => p.skills);
  const para = (number) =>
    havo3.flatMap((c) => c.paragraphs).find((p) => p.number === number).skills;
  prog.mapping = 'gr13-havo3';
  setStof([...ids('1'), ...para('2.1')]);
  assert.deepEqual(stofFromBook(), ['hoofdstuk 1', 'paragraaf 2.1']);
  setStof(ids('2'));
  assert.deepEqual(stofFromBook(), ['hoofdstuk 2']);
  prog.mapping = null;
  assert.deepEqual(stofFromBook(), [], 'zonder boek');
  setStof([]);
});

test('een oude keuze voor een hoofdstuk wordt een stofkeuze', () => {
  assert.equal(migrateScope('all'), null);
  assert.equal(migrateScope('iets anders'), null);
  assert.equal(migrateScope('h1').length, 35);
  assert.equal(migrateScope('h2').length, 25);
  assert.ok(!migrateScope('h2').includes(38), 'voorkennis hoort er niet bij');
});
