// Uitslagen van een kubus en van een balk (ruimte.js) en de figuur ervan (net in ruimtefiguren.js).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isCubeNet,
  cubeFaces,
  opposite,
  canonicalNet,
  CUBE_NETS,
  notCubeNets,
  notCubeNet,
  boxFaces,
} from '../src/js/ruimte.js';
import { net } from '../src/js/ruimtefiguren.js';
import { withSeed } from '../src/js/math.js';

const K = ([x, y]) => `${x},${y}`;
const same = (a, b) => JSON.stringify(canonicalNet(a)) === JSON.stringify(canonicalNet(b));
const SYMS = [
  ([x, y]) => [x, y],
  ([x, y]) => [-y, x],
  ([x, y]) => [-x, -y],
  ([x, y]) => [y, -x],
  ([x, y]) => [-x, y],
  ([x, y]) => [y, x],
  ([x, y]) => [x, -y],
  ([x, y]) => [-y, -x],
];
const label = (fig) => fig.match(/aria-label="([^"]*)"/)[1];

// Alle vormen van zes hokjes, los van ruimte.js opgesomd: begin met één hokje en zet er steeds een
// hokje naast. Een vorm telt één keer, ook gedraaid, gespiegeld of verschoven.
function hexominoes() {
  const norm = (cells) => {
    let best = null;
    for (const s of SYMS) {
      const m = cells.map(s),
        x0 = Math.min(...m.map((c) => c[0])),
        y0 = Math.min(...m.map((c) => c[1])),
        t = m
          .map(([x, y]) => [x - x0, y - y0])
          .map(K)
          .sort()
          .join(' ');
      if (best === null || t < best) best = t;
    }
    return best;
  };
  let level = new Map([[norm([[0, 0]]), [[0, 0]]]]);
  for (let n = 2; n <= 6; n++) {
    const next = new Map();
    for (const cells of level.values()) {
      const taken = new Set(cells.map(K));
      for (const [x, y] of cells)
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const p = [x + dx, y + dy];
          if (taken.has(K(p))) continue;
          const c = [...cells, p],
            k = norm(c);
          if (!next.has(k)) next.set(k, c);
        }
    }
    level = next;
  }
  return [...level.values()];
}

test('de elf uitslagen van een kubus zijn verschillend en isCubeNet herkent ze in elke stand', () => {
  assert.equal(CUBE_NETS.length, 11);
  assert.equal(new Set(CUBE_NETS.map((c) => JSON.stringify(c))).size, 11);
  for (const c of CUBE_NETS)
    for (const s of SYMS) {
      const turned = c.map(s).map(([x, y]) => [x + 5, y - 2]);
      // Ook met elk hokje als eerste: het vouwen begint daar.
      for (let i = 0; i < 6; i++) {
        const order = [...turned.slice(i), ...turned.slice(0, i)];
        assert.ok(isCubeNet(order), JSON.stringify(order));
        assert.deepEqual(canonicalNet(order), c);
      }
    }
});

test('van alle 35 vormen van zes hokjes zijn er precies 11 een uitslag van een kubus, en dat zijn CUBE_NETS', () => {
  const all = hexominoes();
  assert.equal(all.length, 35);
  const nets = all.filter(isCubeNet);
  assert.equal(nets.length, 11);
  for (const c of nets)
    assert.ok(
      CUBE_NETS.some((n) => same(n, c)),
      JSON.stringify(c),
    );
  // Een paar die je zo ziet: een rij van zes, een rechthoek van 2 bij 3, een rij van vijf.
  for (const c of [
    [0, 1, 2, 3, 4, 5].map((x) => [x, 0]),
    [0, 1, 2].flatMap((x) => [
      [x, 0],
      [x, 1],
    ]),
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [2, 1],
    ],
    // Een rij van vier met twee vlakken aan dezelfde kant: die komen op hetzelfde zijvlak.
    [
      [0, 0],
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
  ])
    assert.equal(isCubeNet(c), false, JSON.stringify(c));
  // Niet zes hokjes, niet één stuk, of een hokje dubbel.
  assert.equal(isCubeNet(CUBE_NETS[0].slice(1)), false);
  assert.equal(isCubeNet([...CUBE_NETS[0].slice(1), [9, 9]]), false);
  assert.equal(isCubeNet([...CUBE_NETS[0].slice(1), CUBE_NETS[0][1]]), false);
});

test('tegenover: de uiteinden van een rij van drie liggen tegenover elkaar', () => {
  for (const c of CUBE_NETS) {
    const faces = cubeFaces(c);
    assert.deepEqual([...faces].sort(), [0, 1, 2, 3, 4, 5]);
    const at = new Map(c.map((p, i) => [K(p), i]));
    for (let i = 0; i < 6; i++) {
      const j = opposite(c, i);
      assert.equal(opposite(c, j), i);
      assert.notEqual(i, j);
      const [x, y] = c[i];
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
      ]) {
        // Twee buren liggen nooit tegenover elkaar, en in een rij van drie de uiteinden wel.
        const b = at.get(K([x + dx, y + dy])),
          e = at.get(K([x + 2 * dx, y + 2 * dy]));
        if (b !== undefined) assert.notEqual(j, b);
        if (b !== undefined && e !== undefined) assert.equal(j, e);
      }
    }
  }
  // Het kruis: boven tegenover onder.
  const cross = [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [1, 2],
  ];
  assert.equal(opposite(cross, 0), 5);
  assert.equal(opposite(cross, 1), 3);
  assert.equal(opposite(cross, 2), 4);
  assert.equal(opposite([[0, 0]], 0), -1);
});

test('een vorm die bijna een uitslag van een kubus is, is één stuk, scheelt één hokje en is geen uitslag van een kubus', () => {
  const oneBlock = (cells) => {
    const at = new Set(cells.map(K));
    return cells.some(([x, y]) =>
      [
        [x + 1, y],
        [x, y + 1],
        [x + 1, y + 1],
      ].every((p) => at.has(K(p))),
    );
  };
  // Eén stuk: vanaf het eerste hokje bereik je via buren alle hokjes.
  const oneGroup = (cells) => {
    const left = new Set(cells.slice(1).map(K)),
      todo = [cells[0]];
    while (todo.length) {
      const [x, y] = todo.pop();
      for (const p of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ])
        if (left.delete(K(p))) todo.push(p);
    }
    return left.size === 0;
  };
  for (const c of CUBE_NETS)
    for (const s of SYMS) {
      const turned = c.map(s),
        all = notCubeNets(turned);
      assert.ok(all.length >= 1, JSON.stringify(turned));
      assert.equal(new Set(all.map((a) => JSON.stringify(canonicalNet(a)))).size, all.length);
      for (const a of all) {
        assert.equal(a.length, 6);
        assert.equal(new Set(a.map(K)).size, 6);
        assert.equal(isCubeNet(a), false);
        assert.ok(!CUBE_NETS.some((n) => same(n, a)), 'staat niet in de lijst van elf');
        assert.ok(!oneBlock(a));
        assert.ok(oneGroup(a), JSON.stringify(a));
        // Vijf hokjes staan nog op hun plek. Die vorm begint bij 0, dus het kan zijn dat
        // alles één hokje is opgeschoven.
        const x0 = Math.min(...turned.map((p) => p[0])),
          y0 = Math.min(...turned.map((p) => p[1])),
          shifted = new Set(turned.map(([x, y]) => K([x - x0, y - y0])));
        const fits = [-1, 0, 1].some((dx) =>
          [-1, 0, 1].some(
            (dy) => a.filter(([x, y]) => shifted.has(K([x + dx, y + dy]))).length === 5,
          ),
        );
        assert.ok(fits, JSON.stringify([turned, a]));
      }
    }
  const cross = [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [1, 2],
  ];
  assert.deepEqual(
    withSeed(7, () => notCubeNet(cross)),
    withSeed(7, () => notCubeNet(cross)),
  );
});

test('boxFaces: een balk van 2 bij 3 bij 4 vouwt dicht', () => {
  const dims = [2, 3, 4];
  for (const c of CUBE_NETS)
    for (const s of SYMS) {
      const cells = c.map(s),
        f = boxFaces(cells, dims);
      assert.ok(f, JSON.stringify(cells));
      // Vlakken die tegenover elkaar liggen zijn even groot, en samen is de oppervlakte goed.
      for (let i = 0; i < 6; i++) {
        const j = opposite(cells, i),
          [a, b] = [f[i], f[j]];
        assert.deepEqual([a.w, a.h].sort(), [b.w, b.h].sort());
      }
      assert.equal(
        f.reduce((t, r) => t + r.w * r.h, 0),
        2 * (2 * 3 + 2 * 4 + 3 * 4),
      );
      // Buren delen een hele zijde.
      const at = new Map(cells.map((p, i) => [K(p), i]));
      cells.forEach(([x, y], i) => {
        const r = at.get(K([x + 1, y])),
          d = at.get(K([x, y + 1]));
        if (r !== undefined) {
          assert.equal(f[r].x, f[i].x + f[i].w);
          assert.equal(f[r].y, f[i].y);
          assert.equal(f[r].h, f[i].h);
        }
        if (d !== undefined) {
          assert.equal(f[d].y, f[i].y + f[i].h);
          assert.equal(f[d].x, f[i].x);
          assert.equal(f[d].w, f[i].w);
        }
      });
    }
  // Het kruis: het middelste vlak is 2 bij 3, zoals het eerste hokje.
  const cross = [
    [1, 1],
    [1, 0],
    [0, 1],
    [2, 1],
    [3, 1],
    [1, 2],
  ];
  assert.deepEqual(boxFaces(cross, dims)[0], { x: 4, y: 4, w: 2, h: 3 });
  assert.equal(
    boxFaces(
      [
        [0, 0],
        [1, 0],
      ],
      dims,
    ),
    null,
  );
});

test('net tekent een uitslag van een kubus en de beschrijving noemt alles', () => {
  const cross = [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [1, 2],
  ];
  const opts = { cells: cross, marks: { 0: 'A', 4: 'B' }, shade: [2] };
  const fig = net(opts);
  assert.equal(net(opts), fig, 'twee keer dezelfde tekst');
  assert.doesNotMatch(fig, / id="/);
  assert.equal((fig.match(/<rect class="s"/g) || []).length, 6);
  assert.equal((fig.match(/<rect class="sf"/g) || []).length, 1);
  assert.equal(
    label(fig),
    'Uitslag van een kubus. 6 vlakken, in 3 rijen. Rij 1: 1 vlak, in kolom 2. Rij 2: 4 vlakken, in kolom 1 tot en met 4. Rij 3: 1 vlak, in kolom 2. Op het vlak in rij 1, kolom 2 staat A. Op het vlak in rij 2, kolom 4 staat B. Het vlak in rij 2, kolom 2 is gekleurd.',
  );
  for (const [, t] of fig.matchAll(/<text class="tc"[^>]*>([^<]+)<\/text>/g))
    assert.ok(label(fig).includes(t), t);
  // Een rij met een gat, en een eigen label.
  assert.match(
    label(
      net({
        cells: [
          [0, 0],
          [2, 0],
          [0, 1],
          [1, 1],
          [2, 1],
          [3, 1],
        ],
        label: 'Keuze',
      }),
    ),
    /^Keuze\. 6 vlakken, in 2 rijen\. Rij 1: 2 vlakken, in kolom 1 en 3\./,
  );
  // Een balk noemt de maten per vlak; zonder rooster niet, want dan kun je ze niet tellen.
  const box = net({ cells: cross, dims: [2, 3, 4] });
  assert.match(label(box), /Rij 2: 4 vlakken, in kolom 1 tot en met 4, van \d bij \d, /);
  assert.doesNotMatch(label(net({ cells: cross, dims: [2, 3, 4], grid: false })), / bij /);
  assert.match(label(net({ cells: cross, dims: [2, 2, 2] })), /vierkant van 2 bij 2 hokjes/);
  assert.throws(() =>
    net({
      cells: [
        [0, 0],
        [1, 0],
      ],
      dims: [1, 2, 3],
    }),
  );
});

test('verschillende uitslagen van een kubus en standen geven een verschillende beschrijving', () => {
  const seen = new Map();
  for (const c of [...CUBE_NETS, ...CUBE_NETS.flatMap(notCubeNets)])
    for (const s of SYMS) {
      const cells = c.map(s),
        x0 = Math.min(...cells.map((p) => p[0])),
        y0 = Math.min(...cells.map((p) => p[1])),
        k = cells
          .map(([x, y]) => K([x - x0, y - y0]))
          .sort()
          .join(' '),
        l = label(net({ cells, u: 16, grid: false, label: 'Keuze' }));
      if (seen.has(l)) assert.equal(seen.get(l), k, l);
      seen.set(l, k);
    }
});
