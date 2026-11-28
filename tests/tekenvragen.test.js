// De tekenvragen (#232): vouwen bij een uitslag van een kubus, het snijpunt van de boogjes met een marge, de punten
// van een kubus, en wat een tik doet. Zie src/js/tekenvragen.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, findTrap } from '../src/js/answers.js';
import { CUBE_NETS, TURNS, notCubeNets, sameFace } from '../src/js/ruimte.js';
import {
  MARGE,
  SOORTEN,
  cGoed,
  hoek,
  snijpunt,
  tekenAf,
  tekenFig,
  tekenResultaat,
  tekenRijen,
  uitslagFout,
} from '../src/js/tekenvragen.js';
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
  const t = { soort: 'passer', ab: 5, ac: 4, bc: 3, L: 'RST', x1: 6, y1: 6 };
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
  const t = { soort: 'passer', ab: 5, ac: 4, bc: 3, L: 'RST', x1: 6, y1: 6 };
  let st = passer.lees(t, '');
  st = passer.tik(t, st, [0.2, -0.1], 4).st;
  assert.equal(st.ra, 4, 'een tik bij R zet de passer in R');
  st = passer.tik(t, st, [5.1, 0.3], 3).st;
  assert.equal(st.rb, 3, 'een tik bij S zet de passer in S');
  // Vlak bij het snijpunt komt T precies op het snijpunt.
  st = passer.tik(t, st, [3.5, 2.2], 3).st;
  assert.deepEqual(st.c, [3.2, 2.4]);
  assert.deepEqual(passer.nakijken(t, st), [true, true, true]);
  // Met een ander boogje vanuit R valt T weg, met hetzelfde boogje niet.
  assert.deepEqual(passer.boog(t, st, 0, 4).st.c, [3.2, 2.4]);
  const anders = passer.boog(t, st, 0, 4.5);
  assert.equal(anders.st.c, null);
  assert.match(anders.zin, /T is weggehaald/);
  // Ver van het snijpunt blijft T waar je tikt.
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
    L: 'MNPQVWXY',
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
    /Punt X gezet, 6 hokjes naar rechts en 5 omhoog van M/,
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

// Een som als pijl op de getallenlijn (#263).
const pijlSoort = TOPIC['negatieve-getallen'].skills.find((k) => k.id === 215);
const { pijl } = SOORTEN;

test('een pijl: lezen, schrijven en nakijken', () => {
  const t = { soort: 'pijl', lo: -6, hi: 6, a: -2, e: 3 };
  assert.deepEqual(pijl.lees(t, '-2 3'), [[-2], [3]]);
  assert.deepEqual(pijl.lees(t, '0 ?'), [[0], null]);
  assert.deepEqual(pijl.lees(t, '-7 9'), [null, null], 'buiten de lijn telt niet');
  assert.equal(pijl.schrijf(t, [[0], null]), '0 ?');
  assert.equal(pijl.schrijf(t, [null, null]), '');
  assert.deepEqual(pijl.nakijken(t, pijl.lees(t, '-2 3')), [true, true]);
  assert.deepEqual(pijl.nakijken(t, pijl.lees(t, '3 -2')), [false, false]);
  // Een tik komt op het dichtstbijzijnde streepje: 16 van links en 20 per getal.
  assert.deepEqual(pijl.terug(t, 16 + 6 * 20 + 8), [0]);
  assert.deepEqual(pijl.terug(t, 0), [-6]);
  assert.deepEqual(pijl.verder(t, [6], [1, 0]), [6]);
});

test('een pijl: tikken zet eerst het begin en dan het eind, en een schermlezer hoort waar', () => {
  const t = { soort: 'pijl', lo: -6, hi: 6, a: -2, e: 3 };
  let r = pijl.tik(t, [null, null], [0]);
  assert.deepEqual(r.st, [[0], null]);
  assert.match(r.zin, /Begin van de pijl bij 0\. Tik nu waar de pijl eindigt\./);
  r = pijl.tik(t, r.st, [-4]);
  assert.deepEqual(r.st, [[0], [-4]]);
  assert.match(r.zin, /De pijl gaat van 0 naar −4, 4 stappen naar links\./);
  assert.match(pijl.tik(t, r.st, [2]).zin, /staat er al/);
  r = pijl.tik(t, r.st, [0]);
  assert.deepEqual(r.st, [null, [-4]]);
  assert.match(pijl.staat(t, r.st), /eind van de pijl staat bij −4/i);
  assert.equal(pijl.plek(t, r.st, [-4]), 'bij −4, het eind van de pijl');
});

test('een pijl: elke vraag is goed met het antwoord en heeft de valkuilen', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const q = makeQuestion(pijlSoort, seed),
      { a, e, lo, hi } = q.teken;
    assert.ok(q.v(), `seed ${seed}`);
    // Ook als JSON bewaard, zoals in een proeftoets.
    assert.ok(checkAnswer(JSON.parse(JSON.stringify(q)), [q.fields[0].a]).ok, `seed ${seed}`);
    assert.ok(!checkAnswer(q, [`${a} ?`]).ok);
    assert.ok(a >= lo && a <= hi && e >= lo && e <= hi && lo <= 0 && hi >= 0);
    assert.ok(a < 0 || e < 0, 'er staat een negatief getal in');
    const s = Math.sign(e - a);
    assert.equal(findTrap(q, [`${e} ${a}`])?.id, 'pijl-omgedraaid');
    assert.equal(findTrap(q, [`0 ${e}`])?.id, 'pijl-vanaf-nul');
    if (a - s >= lo && a - s <= hi)
      assert.equal(findTrap(q, [`${a} ${a - s}`])?.id, 'pijl-verkeerde-kant');
    if (e + s >= lo && e + s <= hi)
      assert.equal(findTrap(q, [`${a} ${e + s}`])?.id, 'pijl-te-lang');
    assert.equal(findTrap(q, [`${a} ${e - s}`])?.id, 'pijl-te-kort');
    assert.equal(findTrap(q, [q.fields[0].a]), null);
  }
});

// Punten aantikken (#286): roosterpunten in een assenstelsel, en de punten uit een tabel in een grafiek bij een verhaal.
const { roosterpunten, grafiekpunten } = SOORTEN;
const ROOSTER = {
  soort: 'roosterpunten',
  xr: [-4, 4],
  yr: [-3, 3],
  goed: [
    [2, -1],
    [2, 0],
    [2, 1],
  ],
  geg: [{ p: [0, 2], L: 'A' }],
};
const TABEL = {
  soort: 'grafiekpunten',
  fig: {
    titel: 'Groei van een plant',
    x: { naam: 'tijd in weken', van: 0, tot: 8, stap: 1 },
    y: { naam: 'lengte in cm', van: 0, tot: 50, stap: 5 },
  },
  goed: [
    [0, 5],
    [2, 12.5],
    [4, 30],
  ],
  snap: [1, 2.5],
  verbind: 'kromme',
};

test('roosterpunten: lezen, schrijven en nakijken, in elke volgorde', () => {
  const t = ROOSTER,
    S = roosterpunten;
  assert.deepEqual(S.lees(t, '2,1 2,-1 2,0'), [
    [2, 1],
    [2, -1],
    [2, 0],
  ]);
  // Buiten het assenstelsel, niet op een roosterpunt of dubbel telt niet.
  assert.deepEqual(S.lees(t, '5,0 1.5,0 2,1 2,1 x'), [[2, 1]]);
  assert.equal(S.schrijf(t, S.lees(t, '2,1 2,-1 2,0')), '2,-1 2,0 2,1');
  assert.deepEqual(S.nakijken(t, S.lees(t, '2,0 2,1 2,-1')), [true, true, true, true]);
  // Een punt te weinig, of een punt te veel: fout.
  assert.deepEqual(S.nakijken(t, S.lees(t, '2,0 2,1')), [false, true, true, true]);
  assert.deepEqual(S.nakijken(t, S.lees(t, '2,0 2,1 2,-1 3,3')), [true, true, true, false]);
  const q = { teken: t, fields: [{ teken: true, a: S.schrijf(t, t.goed) }] };
  assert.ok(checkAnswer(JSON.parse(JSON.stringify(q)), ['2,1 2,0 2,-1']).ok);
  assert.ok(!checkAnswer(q, ['2,1 2,0']).ok);
  assert.ok(!checkAnswer(q, ['']).ok);
});

test('roosterpunten: een tik zet een punt of haalt het weg, en een schermlezer hoort waar', () => {
  const t = ROOSTER,
    S = roosterpunten,
    m = S.maat(t);
  let r = S.tik(t, [], [2, 1]);
  assert.deepEqual(r.st, [[2, 1]]);
  assert.equal(r.zin, 'Punt (2, 1) gezet. 1 punt gezet.');
  r = S.tik(t, r.st, [2, -1]);
  assert.match(S.staat(t, r.st), /Je zette 2 punten: \(2, −1\) en \(2, 1\)\./);
  r = S.tik(t, r.st, [2, 1]);
  assert.deepEqual(r.st, [[2, -1]]);
  assert.match(r.zin, /Punt \(2, 1\) weggehaald/);
  assert.equal(S.tik(t, r.st, [0, 2]).zin, 'Daar ligt punt A al.');
  assert.equal(S.plek(t, r.st, [2, -1]), 'op (2, −1), gezet');
  assert.equal(S.plek(t, r.st, [0, 2]), 'op (0, 2), punt A');
  // Een tik komt op het dichtstbijzijnde roosterpunt, en ver buiten het rooster telt niet.
  assert.deepEqual(S.terug(t, m.X(2) + 6, m.Y(1) - 5), [2, 1]);
  assert.equal(S.terug(t, 0, 0), null);
  assert.deepEqual(S.start(t), [0, 0]);
  assert.deepEqual(S.verder(t, [4, 3], [1, 1]), [4, 3]);
  assert.deepEqual(S.verder(t, [0, 0], [-1, 1]), [-1, 1]);
  // De figuur is het assenstelsel van graph(), met de maat die tekenvragen.js gebruikt.
  const svg = tekenFig(t);
  assert.match(svg, new RegExp(`width="${m.w}" height="${m.h}"`));
  assert.match(svg, /data-teken="roosterpunten"/);
  assert.match(svg, /aria-label="Assenstelsel met een rooster\. .* Gegeven: A\(0, 2\)\."/);
  assert.doesNotMatch(svg, /<svg[^>]*><svg class="fig"/, 'geen svg in een svg met dezelfde klasse');
});

test('grafiekpunten: de punten uit een tabel in het rooster van een grafiek bij een verhaal', () => {
  const t = TABEL,
    S = grafiekpunten,
    m = S.maat(t);
  // Op een fijnere verdeling dan het rooster: 12,5 ligt op een stap van 2,5.
  assert.deepEqual(S.lees(t, '4,30 0,5 2,12.5 3,11 9,5'), [
    [4, 30],
    [0, 5],
    [2, 12.5],
  ]);
  assert.equal(S.schrijf(t, S.lees(t, '4,30 0,5 2,12.5')), '0,5 2,12.5 4,30');
  assert.deepEqual(S.nakijken(t, S.lees(t, '4,30 2,12.5 0,5')), [true, true, true, true]);
  assert.deepEqual(S.nakijken(t, S.lees(t, '4,30 2,15 0,5')), [true, false, true, false]);
  assert.deepEqual(S.terug(t, m.X(2) + 3, m.Y(12.5) + 2), [2, 12.5]);
  assert.deepEqual(S.verder(t, [0, 0], [1, 1]), [1, 2.5]);
  assert.deepEqual(S.verder(t, [8, 50], [1, 1]), [8, 50]);
  const r = S.tik(t, [[0, 5]], [2, 12.5]);
  assert.equal(r.zin, 'Punt bij 2 en 12,5 gezet. 2 punten gezet.');
  assert.equal(
    S.staat(t, r.st),
    'Je zette 2 punten: 0 en 5; 2 en 12,5 (steeds tijd in weken en lengte in cm).',
  );
  // De figuur is die van contextGraph, met de beschrijving van de assen. Met verbind staat er een kromme door
  // de gezette punten.
  const svg = tekenFig(t);
  assert.match(svg, /data-teken="grafiekpunten"/);
  assert.match(
    svg,
    /aria-label="Grafiek: Groei van een plant\. Langs de horizontale as: tijd in weken/,
  );
  const af = tekenAf(t, '0,5 2,12.5 4,30', 'Met jouw punten.');
  assert.match(af, /<path class="l1" d="M[^"]*C/);
  assert.equal((af.match(/class="mk c1"/g) || []).length, 3);
  // In het resultaat: de goede punten gestippeld, en een kruisje bij een punt dat er niet hoort.
  const fout = tekenResultaat(t, '0,5 2,15', false);
  assert.equal((fout.match(/class="l2 d"/g) || []).length, 3);
  assert.equal((fout.match(/class="fout"/g) || []).length, 1);
  const rijen = tekenRijen(t, '0,5 2,15', checkAnswer({ teken: t }, ['0,5 2,15']).each);
  assert.deepEqual(
    rijen.map((rij) => rij[2]),
    [true, false, false, false],
  );
  assert.match(rijen[3][1], /2 en 15/);
});

test('grafiekpunten met lijn: een extra punt op de lijn is goed, een punt ernaast niet (#283)', () => {
  const t = {
      soort: 'grafiekpunten',
      fig: {
        titel: 'Een sup-board huren',
        x: { naam: 'tijd in uren', van: 0, tot: 6, stap: 1 },
        y: { naam: "bedrag in euro's", van: 0, tot: 60, stap: 5 },
      },
      goed: [
        [0, 15],
        [2, 35],
        [4, 55],
      ],
      lijn: [15, 10],
      verbind: 'lijn',
    },
    S = grafiekpunten;
  // Alle punten uit de tabel en daartussen ook 1 en 3: allemaal op de lijn, dus goed.
  assert.deepEqual(S.nakijken(t, S.lees(t, '0,15 1,25 2,35 3,45 4,55')), [true, true, true, true]);
  // Een extra punt naast de lijn blijft fout, en krijgt als enige een kruisje.
  assert.deepEqual(S.nakijken(t, S.lees(t, '0,15 1,30 2,35 4,55')), [true, true, true, false]);
  const laag = S.laag(t, S.lees(t, '0,15 1,25 1,30 2,35 4,55'), { fout: true });
  assert.equal((laag.match(/class="fout"/g) || []).length, 1);
  // Zonder lijn is een extra punt fout, zoals bij punten uit een tabel met meetgegevens.
  const zonder = { ...t, lijn: undefined };
  assert.equal(S.nakijken(zonder, S.lees(zonder, '0,15 1,25 2,35 4,55'))[3], false);
});

test('234: mist er een punt uit de tabel naast extra punten op de lijn, dan zegt de melding dat (#283)', () => {
  const sk = TOPIC['grafiek-bij-een-formule'].skills.find((k) => k.id === 234);
  for (let seed = 1; seed <= 50; seed++) {
    const q = makeQuestion(sk, seed),
      t = q.teken,
      [b, a] = t.lijn,
      X = t.goed.map((p) => p[0]),
      // Alle hele waarden van 0 tot de laatste kolom min één, dus de laatste kolom ontbreekt.
      ps = [];
    for (let x = 0; x < X[X.length - 1]; x++) ps.push([x, b + a * x]);
    const v = [grafiekpunten.schrijf(t, ps)];
    assert.equal(findTrap(q, v)?.id, 'punt-vergeten');
  }
});
