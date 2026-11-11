// Bewaren in de browser: mislukte opslag, en een tabblad dat achterloopt bij de proeftoets.
// Deze test geeft Node een eigen opslag, dus de modules worden pas daarna geladen.
import test from 'node:test';
import assert from 'node:assert/strict';

const data = new Map();
// Welke sleutels nu niet te bewaren zijn, zoals bij een volle opslag.
let full = new Set();
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => {
      if (full.has(k)) throw new DOMException('De opslag is vol', 'QuotaExceededError');
      data.set(k, String(v));
    },
    removeItem: (k) => data.delete(k),
  },
});
globalThis.window = globalThis;

const { STORE, load, opslag, prog, rec } = await import('../src/js/progress.js');
const { TEST_KEY, RESULT_KEY, buildTest, loadTests, saveTest, stopTest, storeTest } =
  await import('../src/js/ui/exam.js');
const { state } = await import('../src/js/ui/state.js');
const { storageNotice } = await import('../src/js/ui/layout.js');

function reset() {
  data.clear();
  full = new Set();
  Object.assign(opslag, { voortgang: false, toets: false, gemeld: false });
  load();
  state.test = null;
  state.result = null;
}
const stored = () => JSON.parse(data.get(STORE)).skills;
const newTest = (id) => ({ id, items: buildTest([3, 4], 2), i: 0, spent: 0, since: null });

test('na een mislukte poging bewaart de voortgang weer als het lukt', () => {
  reset();
  full.add(STORE);
  rec(3, true);
  assert.equal(opslag.voortgang, true);
  assert.match(storageNotice(), /role="alert"/);
  // Het geheugen is nu het nieuwst. Een oude bewaarde voortgang zet dat niet terug.
  data.set(STORE, JSON.stringify({ v: 5, skills: { 3: [0, 0] } }));
  rec(3, true);
  assert.deepEqual(prog.skills[3], [1, 1]);
  full.clear();
  rec(3, false);
  assert.equal(opslag.voortgang, false);
  assert.equal(storageNotice(), '');
  assert.deepEqual(stored()[3], [1, 1, 0]);
});

test('een melding die al is voorgelezen, wordt niet bij elk scherm opnieuw voorgelezen', () => {
  reset();
  full.add(STORE);
  rec(3, true);
  opslag.gemeld = true;
  assert.doesNotMatch(storageNotice(), /role="alert"/);
  assert.match(storageNotice(), /niet worden bewaard/);
});

test('een mislukte proeftoets houdt het lezen van de voortgang niet tegen', () => {
  reset();
  full.add(TEST_KEY);
  state.test = newTest(1);
  saveTest();
  assert.equal(opslag.toets, true);
  assert.equal(opslag.voortgang, false);
  assert.match(storageNotice(), /niet worden bewaard/);
  // Een ander tabblad bewaart voortgang. Die komt gewoon binnen.
  data.set(STORE, JSON.stringify({ v: 5, skills: { 4: [1] } }));
  load();
  assert.deepEqual(prog.skills, { 4: [1] });
  full.clear();
  saveTest();
  assert.equal(opslag.toets, false);
});

test('een proeftoets die niet bewaard kon worden, blijft lopen tot je stopt', () => {
  reset();
  full.add(TEST_KEY);
  state.test = newTest(1);
  saveTest();
  // Een ander tabblad bewaart een uitslag of wist alles. Het geheugen gaat voor.
  loadTests();
  assert.equal(state.test?.id, 1);
  assert.equal(storeTest(), true);
  // Gestopt: er is niets meer dat niet bewaard kon worden, dus de melding verdwijnt.
  stopTest();
  assert.equal(opslag.toets, false);
  assert.equal(storageNotice(), '');
});

test('een tabblad dat achterliep, zet een ingeleverde proeftoets niet terug', () => {
  reset();
  state.test = newTest(1);
  saveTest();
  assert.equal(storeTest(), true);
  // Een ander tabblad levert in: de proeftoets is weg en de uitslag staat er.
  const result = JSON.parse(data.get(TEST_KEY));
  Object.assign(result, { score: 1, max: 2, time: 60 });
  result.items = result.items.map((x) => ({ ...x, c: { each: [true, false] }, got: 1, max: 2 }));
  data.set(RESULT_KEY, JSON.stringify(result));
  data.delete(TEST_KEY);
  assert.equal(storeTest(), false);
  assert.equal(state.test, null);
  assert.equal(data.has(TEST_KEY), false);
  assert.equal(state.result.score, 1);
});

test('een tabblad dat achterliep, overschrijft een nieuwe proeftoets van een ander tabblad niet', () => {
  reset();
  state.test = newTest(1);
  saveTest();
  data.set(TEST_KEY, JSON.stringify({ ...JSON.parse(data.get(TEST_KEY)), id: 2 }));
  assert.equal(storeTest(), false);
  assert.equal(state.test.id, 2);
  assert.equal(JSON.parse(data.get(TEST_KEY)).id, 2);
});

test('een proeftoets van voor versie 1.11.4, zonder id, loopt gewoon door', () => {
  reset();
  state.test = newTest(undefined);
  saveTest();
  assert.equal(storeTest(), true);
});

test('een beschadigde proeftoets of uitslag wordt niet gelezen', () => {
  reset();
  state.test = newTest(1);
  saveTest();
  const good = JSON.parse(data.get(TEST_KEY));
  loadTests();
  assert.equal(state.test.id, 1);
  const broken = [
    { ...good, spent: 'x' },
    { ...good, i: 5 },
    { ...good, items: [] },
    { ...good, items: good.items.map((x) => ({ ...x, vals: null })) },
    { ...good, items: good.items.map((x) => ({ ...x, q: { q: 1 } })) },
    { ...good, items: good.items.map((x) => ({ ...x, q: { ...x.q, fields: [], mc: null } })) },
    { ...good, items: good.items.map((x) => ({ ...x, id: 999999 })) },
  ];
  for (const t of broken) {
    data.set(TEST_KEY, JSON.stringify(t));
    loadTests();
    assert.equal(state.test, null, JSON.stringify(t).slice(0, 80));
  }
  // Een uitslag heeft ook het nakijken nodig.
  data.set(RESULT_KEY, JSON.stringify(good));
  loadTests();
  assert.equal(state.result, null);
});
