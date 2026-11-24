// De tekenvragen (#232): vouwen bij een uitslag van een kubus, het snijpunt van de boogjes met een marge, de punten
// van een kubus, en wat een tik doet. Zie src/js/tekenvragen.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, findTrap } from '../src/js/answers.js';
import { CUBE_NETS, TURNS, notCubeNets, sameFace } from '../src/js/ruimte.js';
import { MARGE, SOORTEN, cGoed, hoek, snijpunt, uitslagFout } from '../src/js/tekenvragen.js';
import { TOPIC, makeQuestion } from '../src/js/topics/index.js';

const { kubus, passer, uitslag } = SOORTEN;
const soort = (id) => TOPIC.tekenopdrachten.skills.find((k) => k.id === id);
// De hokjes in het rooster van 6 bij 5, met de kleinste x en y op 0.
const naarRooster = (cells) => {
  const x0 = Math.min(...cells.map((c) => c[0])),
    y0 = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - x0, y - y0]);
};

test('sameFace vindt twee hokjes die bij het vouwen op elkaar komen', () => {
  // Een rij van vijf: het vijfde hokje komt op het eerste.
  const rij = [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [1, 1],
  ];
  assert.deepEqual([...sameFace(rij)].sort(), [0, 4]);
  for (const net of CUBE_NETS)
    for (const t of TURNS) assert.equal(sameFace(net.map(t)), null, 'een uitslag van een kubus');
  for (const bijna of notCubeNets(CUBE_NETS[0]))
    assert.ok(sameFace(bijna), `bijna een uitslag: ${JSON.stringify(bijna)}`);
});

test('elke uitslag van een kubus is goed, in elke stand en op elke plek', () => {
  const t = { soort: 'uitslag', W: 6, H: 5, geg: [] };
  for (const net of CUBE_NETS)
    for (const draai of TURNS) {
      const cells = naarRooster(net.map(draai)).map(([x, y]) => [x + 1, y]),
        val = uitslag.schrijf(t, cells);
      if (cells.some(([x, y]) => x >= 6 || y >= 5)) continue;
      assert.deepEqual(uitslag.lees(t, val).length, 6);
      assert.equal(uitslagFout(t, cells), null);
      assert.deepEqual(uitslag.nakijken(t, cells), [true]);
    }
});

test('bij een uitslag zegt de feedback wat er mis is', () => {
  const t = { soort: 'uitslag', W: 6, H: 5, geg: [] };
  const fout = (cells) => uitslagFout(t, cells)?.id;
  const kruis = [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2],
    [1, 3],
  ];
  assert.equal(fout(kruis), undefined);
  assert.equal(fout(kruis.slice(0, 5)), 'te-weinig-hokjes');
  assert.equal(fout([...kruis, [3, 1]]), 'te-veel-hokjes');
  // Een hokje dat alleen met een hoekpunt vastzit.
  assert.equal(fout([...kruis.slice(0, 5), [2, 3]]), 'los-hokje');
  assert.deepEqual(uitslagFout(t, [...kruis.slice(0, 5), [2, 3]]).cells, [[2, 3]]);
  assert.equal(
    fout([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ]),
    'vierkant-van-vier',
  );
  assert.equal(
    fout([
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [4, 1],
      [2, 0],
    ]),
    'rij-van-vijf',
  );
  // Twee rijen van drie recht onder elkaar, met één hokje opgeschoven: geen vierkant, wel twee keer hetzelfde zijvlak.
  const dubbel = [
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [3, 1],
    [2, 2],
  ];
  assert.equal(fout(dubbel), 'zijvlak-dubbel');
  assert.equal(uitslagFout(t, dubbel).cells.length, 2);
});

test('een uitslag afmaken: de hokjes die er al staan tellen mee, en blijven staan', () => {
  const t = {
    soort: 'uitslag',
    W: 6,
    H: 5,
    geg: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
  };
  assert.deepEqual(uitslag.nakijken(t, [[2, 2]]), [true]);
  assert.deepEqual(uitslag.nakijken(t, [[1, 1]]), [false], 'een hokje dat er al staat telt niet');
  const tik = uitslag.tik(t, [], [1, 1]);
  assert.deepEqual(tik.st, [], 'een hokje dat er al staat, kun je niet weghalen');
  const aan = uitslag.tik(t, [], [2, 2]);
  assert.deepEqual(aan.st, [[2, 2]]);
  assert.match(aan.zin, /6 van 6 hokjes/);
  assert.deepEqual(uitslag.tik(t, aan.st, [2, 2]).st, [], 'nog een keer tikken maakt het leeg');
});

test('het snijpunt van de boogjes, en een marge bij het derde hoekpunt', () => {
  const t = { soort: 'passer', ab: 5, ac: 4, bc: 3, L: 'KLM', x1: 6, y1: 6 };
  const [x, y] = snijpunt(5, 4, 3);
  assert.ok(Math.abs(x - 3.2) < 1e-9 && Math.abs(y - 2.4) < 1e-9);
  assert.equal(snijpunt(5, 1, 2), null, 'boogjes die elkaar niet raken');
  assert.ok(cGoed(t, [3.2, 2.4]));
  assert.ok(cGoed(t, [3.2 + MARGE * 0.6, 2.4]), 'net naast het snijpunt is goed');
  assert.ok(!cGoed(t, [3.2 + MARGE * 3, 2.4]), 'verder ervan af is fout');
  assert.ok(cGoed(t, [3.2, -2.4]), 'onder de eerste zijde is ook goed');
  const goed = { ra: 4, rb: 3, c: [3.2, 2.4] };
  assert.deepEqual(passer.nakijken(t, goed), [true, true, true]);
  assert.deepEqual(passer.nakijken(t, { ra: 3, rb: 4, c: snijpunt(5, 3, 4) }), [
    false,
    false,
    false,
  ]);
  assert.deepEqual(passer.lees(t, passer.schrijf(t, goed)), goed);
});

test('een tik bij de passer: neerzetten, het snijpunt vangen en een veranderd boogje', () => {
  const t = { soort: 'passer', ab: 5, ac: 4, bc: 3, L: 'KLM', x1: 6, y1: 6 };
  let st = passer.lees(t, '');
  st = passer.tik(t, st, [0.2, -0.1], 4).st;
  assert.equal(st.ra, 4, 'een tik bij K zet de passer in K');
  st = passer.tik(t, st, [5.1, 0.3], 3).st;
  assert.equal(st.rb, 3, 'een tik bij L zet de passer in L');
  // Vlak bij het snijpunt komt M precies op het snijpunt.
  st = passer.tik(t, st, [3.5, 2.2], 3).st;
  assert.deepEqual(st.c, [3.2, 2.4]);
  assert.deepEqual(passer.nakijken(t, st), [true, true, true]);
  // Met een ander boogje vanuit K valt M weg, met hetzelfde boogje niet.
  assert.deepEqual(passer.boog(t, st, 0, 4).st.c, [3.2, 2.4]);
  const anders = passer.boog(t, st, 0, 4.5);
  assert.equal(anders.st.c, null);
  assert.match(anders.zin, /M is weggehaald/);
  // Ver van het snijpunt blijft M waar je tikt.
  assert.deepEqual(passer.tik(t, st, [1, 4], 3).st.c, [1, 4]);
});

test('een kubus afmaken: de punten op volgorde, en wat een tik doet', () => {
  const t = {
    soort: 'kubus',
    n: 4,
    s: [2, 1],
    o: [1, 1],
    W: 8,
    H: 8,
    L: 'ABCDEFGH',
    geg: [0, 1, 5, 4, 2],
    zet: [3, 6, 7],
  };
  assert.deepEqual(hoek(t, 3), [3, 2]);
  assert.deepEqual(hoek(t, 6), [7, 6]);
  const goed = t.zet.map((i) => hoek(t, i));
  assert.deepEqual(kubus.nakijken(t, goed), [true, true, true]);
  assert.deepEqual(kubus.nakijken(t, [goed[1], goed[0], goed[2]]), [false, false, true]);
  assert.equal(kubus.schrijf(t, [goed[0], null, null]), '3,2 ? ?');
  assert.equal(kubus.schrijf(t, [null, null, null]), '');
  let st = kubus.lees(t, '');
  st = kubus.tik(t, st, [3, 2]).st;
  st = kubus.tik(t, st, [9, 9]).st;
  assert.deepEqual(st, [[3, 2], [9, 9], null], 'een tik zet het volgende punt');
  st = kubus.tik(t, st, [9, 9]).st;
  assert.deepEqual(st, [[3, 2], null, null], 'een tik op een gezet punt haalt het weg');
  assert.deepEqual(
    kubus.tik(t, st, [1, 1]).st,
    st,
    'op een hoekpunt dat er al staat, gebeurt niets',
  );
  assert.match(
    kubus.tik(t, st, [7, 6]).zin,
    /Punt G gezet, 6 hokjes naar rechts en 5 omhoog van A/,
  );
});

test('een tekenvraag kijkt na via answers.js, ook als JSON bewaard', () => {
  for (const id of [182, 183, 184])
    for (let seed = 1; seed <= 50; seed++) {
      const q = JSON.parse(JSON.stringify(makeQuestion(soort(id), seed)));
      assert.ok(checkAnswer(q, [q.fields[0].a]).ok, `${id}, seed ${seed}`);
      assert.ok(!checkAnswer(q, ['']).ok);
    }
});

test('bij een tekenvraag geeft een bekende fout de goede valkuil', () => {
  // Een kubus met de letters verwisseld.
  for (let seed = 1; seed <= 40; seed++) {
    const q = makeQuestion(soort(182), seed),
      p = q.fields[0].a.split(' ');
    const omgedraaid = [p[1], p[0], ...p.slice(2)].join(' ');
    assert.equal(findTrap(q, [omgedraaid])?.id, 'letters-verwisseld');
  }
  // Een driehoek met de stralen verwisseld, en een met de boogjes weg.
  for (let seed = 1; seed <= 40; seed++) {
    const q = makeQuestion(soort(183), seed),
      { ac, bc, ab } = q.teken,
      t = q.teken;
    if (ac !== bc) {
      const st = { ra: bc, rb: ac, c: snijpunt(ab, bc, ac) };
      assert.equal(findTrap(q, [passer.schrijf(t, st)])?.id, 'zijden-verwisseld');
    }
    const zonder = { ra: 0, rb: 0, c: snijpunt(ab, ac, bc) };
    assert.equal(findTrap(q, [passer.schrijf(t, zonder)])?.id, 'boogjes-vergeten');
  }
  // Een uitslag met een hokje te weinig.
  for (let seed = 1; seed <= 40; seed++) {
    const q = makeQuestion(soort(184), seed),
      cells = q.fields[0].a.split(' ');
    if (cells.length < 2) continue;
    assert.equal(findTrap(q, [cells.slice(1).join(' ')])?.id, 'te-weinig-hokjes');
  }
});
