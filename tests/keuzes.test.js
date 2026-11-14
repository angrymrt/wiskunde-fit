// De keuzes van een generator: choose, until en alleKeuzes in math.js. Zie #22.
import test from 'node:test';
import assert from 'node:assert/strict';
import { alleKeuzes, coin, nz, pick, ri, shuffle, until, withSeed } from '../src/js/math.js';

const alle = (make, opties) => {
  const uitkomsten = [];
  const paden = alleKeuzes(make, (x) => uitkomsten.push(x), opties);
  return { paden, uitkomsten };
};

test('alleKeuzes loopt elke keuze een voor een door', () => {
  const { paden, uitkomsten } = alle(() => [ri(1, 3), coin(), pick(['a', 'b'])]);
  assert.equal(paden, 3 * 2 * 2);
  assert.equal(new Set(uitkomsten.map(String)).size, 12);
});

test('shuffle geeft elke volgorde precies één keer', () => {
  const { paden, uitkomsten } = alle(() => shuffle([1, 2, 3]).join());
  assert.equal(paden, 6);
  assert.equal(new Set(uitkomsten).size, 6);
});

test('until slaat een afgekeurde keuze over', () => {
  // x uit 1 t/m 5 met y uit 1 t/m 5, maar nooit gelijk: 20 vragen, niet 25.
  const { paden, uitkomsten } = alle(() => {
    const x = ri(1, 5);
    const y = until(
      () => ri(1, 5),
      (y) => y !== x,
    );
    return `${x},${y}`;
  });
  assert.equal(paden, 20);
  assert.equal(new Set(uitkomsten).size, 20);
});

test('nz slaat 0 over', () => {
  const { paden, uitkomsten } = alle(() => nz(-2, 2));
  assert.equal(paden, 4);
  assert.deepEqual(
    uitkomsten.sort((a, b) => a - b),
    [-2, -1, 1, 2],
  );
});

test('een generator die steeds opnieuw begint, telt niet mee en blijft niet hangen', () => {
  const kies = () => {
    const x = ri(1, 3);
    return x === 3 ? kies() : x;
  };
  const { uitkomsten } = alle(kies, { maxKeuzes: 20 });
  assert.deepEqual([...new Set(uitkomsten)].sort(), [1, 2]);
});

test('te veel paden geeft null', () => {
  assert.equal(
    alleKeuzes(
      () => ri(1, 10) + ri(1, 10),
      () => {},
      { maxPaden: 50 },
    ),
    null,
  );
});

test('until geeft zonder tellen hetzelfde toeval als een gewone lus', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const lus = withSeed(seed, () => {
      let x;
      do {
        x = ri(1, 6);
      } while (x % 3 !== 0);
      return x;
    });
    const metUntil = withSeed(seed, () =>
      until(
        () => ri(1, 6),
        (x) => x % 3 === 0,
      ),
    );
    assert.equal(metUntil, lus);
  }
});

// Een eigen lus voor toeval kan alleKeuzes niet overslaan, dus de generatoren gebruiken until.
test('de onderwerpen kiezen opnieuw met until en schrijven geen eigen lus voor toeval', async () => {
  const { readdir, readFile } = await import('node:fs/promises');
  const dir = new URL('../src/js/topics/', import.meta.url);
  const VORMEN = [
    [/\bdo \{/, 'do … while'],
    [/for \(;;\)/, 'for (;;)'],
    [/for \(let \w+ = 0; \w+ < \d{3,};/, 'een lus met veel pogingen'],
    [/^\s*while \(/m, 'while'],
    [/Math\.random/, 'Math.random'],
  ];
  const gevonden = [];
  for (const f of await readdir(dir)) {
    if (!f.endsWith('.js')) continue;
    const tekst = await readFile(new URL(f, dir), 'utf8');
    for (const [re, naam] of VORMEN) if (re.test(tekst)) gevonden.push(`${f}: ${naam}`);
  }
  assert.deepEqual(gevonden, [], 'Gebruik until(maak, klopt) uit math.js, zie AGENTS.md.');
});
