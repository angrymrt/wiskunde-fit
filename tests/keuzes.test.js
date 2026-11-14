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
  const { paden, uitkomsten } = alle(kies, { maxKeuzes: 20 });
  // Op elke diepte tot maxKeuzes zijn er twee uitkomsten, en daarna wordt het pad afgekeurd.
  assert.equal(paden, 40);
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

test('until laat de toevalsgenerator in dezelfde stand achter als een gewone lus', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const lus = withSeed(seed, () => {
      let x;
      do {
        x = ri(1, 6);
      } while (x % 3 !== 0);
      return ri(1, 1000);
    });
    const metUntil = withSeed(seed, () => {
      until(
        () => ri(1, 6),
        (x) => x % 3 === 0,
      );
      return ri(1, 1000);
    });
    assert.equal(metUntil, lus);
  }
});

test('maxPaden: precies zoveel paden geeft het aantal, één minder geeft null', () => {
  const make = () => ri(1, 10);
  assert.equal(
    alleKeuzes(make, () => {}, { maxPaden: 10 }),
    10,
  );
  assert.equal(
    alleKeuzes(make, () => {}, { maxPaden: 9 }),
    null,
  );
});

test('maxPaden telt ook de paden die until afkeurt', () => {
  const nooit = () =>
    until(
      () => ri(1, 100),
      () => false,
    );
  assert.equal(
    alleKeuzes(nooit, () => {}, { maxPaden: 50 }),
    null,
  );
});

test('een keuze uit één of nul mogelijkheden geeft één pad', () => {
  assert.deepEqual(
    alle(() => ri(5, 5)),
    { paden: 1, uitkomsten: [5] },
  );
  assert.equal(
    alleKeuzes(
      () => pick([]),
      () => {},
    ),
    1,
  );
});

test('alleKeuzes in alleKeuzes telt elk apart', () => {
  const buiten = alle(() => {
    const binnen = alleKeuzes(
      () => ri(1, 3),
      () => {},
    );
    return binnen + ri(1, 2);
  });
  assert.equal(buiten.paden, 2);
  assert.deepEqual(buiten.uitkomsten, [4, 5]);
});

test('na een fout in make is het toeval weer gewoon', () => {
  assert.throws(
    () =>
      alleKeuzes(
        () => {
          ri(1, 3);
          throw new Error('kapot');
        },
        () => {},
      ),
    /kapot/,
  );
  // Zonder tellen kiest until weer opnieuw in plaats van een pad af te keuren.
  assert.equal(
    withSeed(1, () =>
      until(
        () => ri(1, 6),
        (x) => x === 6,
      ),
    ),
    6,
  );
});
