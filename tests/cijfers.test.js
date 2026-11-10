// De pagina Cijfers: het inlezen van de samenvattingen, de nepcijfers en het uitrekenen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { cijfers, mediaan } from '../src/js/cijfers.js';
import { leesTellen } from '../scripts/tellen-lezen.js';
import { nepJSON, nepTellen } from '../scripts/nep-tellen.js';
import { toJSON } from '../scripts/tellen-samenvatten.js';
import { vCijfers } from '../src/js/ui/cijfers.js';

const dag = {
  poging: [
    { soort: 12, uitkomst: 'goed', duur: 30, hint: false, aantal: 3 },
    { soort: 12, uitkomst: 'fout', duur: 50, hint: true, aantal: 1 },
    { soort: 12, uitkomst: 'uitwerking', duur: 2, hint: false, aantal: 2 },
  ],
  valkuil: [{ soort: 12, valkuil: 'breuk-omgedraaid', aantal: 1 }],
  toetsvraag: [{ soort: 38, uitkomst: 'leeg', aantal: 2 }],
  proeftoets: [{ aantal: 1 }],
};

function map(files) {
  const dir = mkdtempSync(join(tmpdir(), 'tellen-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}

test('nepcijfers en echte cijfers komen nooit samen in een build', (t) => {
  const echt = map({ '2026-11-12.json': toJSON(dag) });
  const nep = map({ '2026-11-12.json': nepJSON(dag) });
  t.after(() => [echt, nep].forEach((d) => rmSync(d, { recursive: true })));

  assert.deepEqual(leesTellen(echt), [['2026-11-12', dag]]);
  assert.deepEqual(leesTellen(nep, { nep: true }), [['2026-11-12', dag]]);
  assert.throws(() => leesTellen(nep), /nepcijfers/);
  assert.throws(() => leesTellen(echt, { nep: true }), /geen nepbestand/);
  assert.deepEqual(leesTellen(join(echt, 'bestaat-niet')), []);
});

test('een bestand dat niet klopt, stopt de build', (t) => {
  const wrong = [
    { 'notities.txt': '' },
    { '2026-11-12.json': JSON.stringify({ weergave: [] }) },
    { '2026-11-12.json': JSON.stringify({ toetsvraag: [{ soort: 12, uitkomst: 'leeg' }] }) },
    {
      '2026-11-12.json': JSON.stringify({
        toetsvraag: [{ soort: 12, uitkomst: 'leeg', aantal: 1, id: 'x' }],
      }),
    },
  ];
  for (const files of wrong) {
    const dir = map(files);
    t.after(() => rmSync(dir, { recursive: true }));
    assert.throws(() => leesTellen(dir), undefined, JSON.stringify(files));
  }
});

test('de cijfers per vraagsoort', () => {
  const c = cijfers([
    ['2026-11-12', dag],
    ['2026-11-13', dag],
  ]);
  assert.equal(c.van, '2026-11-12');
  assert.equal(c.tot, '2026-11-13');
  assert.equal(c.dagen, 2);
  assert.equal(c.proeftoetsenVan, '2026-11-12');
  // De duur is die van de goede antwoorden.
  assert.deepEqual(c.totaal, {
    pogingen: 12,
    goed: 6,
    duur: 30,
    proeftoetsen: 2,
    moeilijkheid: null,
    // Alle vier de vragen in proeftoetsen waren leeg.
    leeg: 1,
  });
  // Met minder dan 30 pogingen krijgt een vraagsoort geen moeilijkheid.
  assert.deepEqual(c.soorten[12], {
    pogingen: 12,
    goed: 6,
    goedHint: 0,
    fout: 2,
    uitwerking: 4,
    hint: 2,
    duur: 30,
    valkuilen: { 'breuk-omgedraaid': 2 },
    toets: { goed: 0, fout: 0, leeg: 0 },
  });
  assert.deepEqual(c.soorten[38].toets, { goed: 0, fout: 0, leeg: 4 });
  assert.equal(cijfers([]).totaal.pogingen, 0);
  assert.equal(cijfers([]).totaal.duur, null);

  assert.equal(
    mediaan([
      [10, 1],
      [20, 1],
    ]),
    15,
  );
  assert.equal(mediaan([[10, 3]]), 10);
  assert.equal(mediaan([]), null);
});

test('de moeilijkheid weegt moeite en tijd, en schuift bij weinig pogingen naar het gemiddelde', () => {
  const poging = (soort, uitkomst, duur, hint, aantal) => ({ soort, uitkomst, duur, hint, aantal });
  const c = cijfers([
    [
      '2026-11-12',
      {
        poging: [
          // 1: makkelijk en snel. 2: vaak fout. 3: alleen goed met hint, en langzaam.
          poging(1, 'goed', 10, false, 90),
          poging(1, 'fout', 10, false, 10),
          poging(2, 'goed', 20, false, 40),
          poging(2, 'fout', 20, false, 60),
          poging(3, 'goed', 60, true, 100),
          // 4: maar 5 pogingen, allemaal fout.
          poging(4, 'fout', 20, false, 5),
        ],
      },
    ],
  ]);
  const s = c.soorten;
  // Het gemiddelde van de site: (10 + 60 + 50 + 5) / 305.
  const site = 125 / 305;
  assert.ok(Math.abs(s[1].moeite - (10 + 30 * site) / 130) < 1e-12);
  assert.ok(Math.abs(s[3].moeite - (50 + 30 * site) / 130) < 1e-12);
  assert.deepEqual([s[1].tijd, s[2].tijd, s[3].tijd], [0, 0.5, 1]);
  assert.ok(Math.abs(s[2].moeilijkheid - (0.75 * s[2].moeite + 0.25 * 0.5)) < 1e-12);
  assert.ok(s[2].moeilijkheid > s[1].moeilijkheid);
  assert.equal(s[4].moeilijkheid, undefined);
  const avg = (s[1].moeilijkheid + s[2].moeilijkheid + s[3].moeilijkheid) / 3;
  assert.ok(Math.abs(c.totaal.moeilijkheid - avg) < 1e-12);
});

test('leeg gelaten schuift bij weinig proeftoetsen naar het gemiddelde', () => {
  const vraag = (soort, uitkomst, aantal) => ({ soort, uitkomst, aantal });
  const c = cijfers([
    [
      '2026-11-12',
      {
        toetsvraag: [
          // 1: 30 keer in een proeftoets, 9 keer leeg. 2: 300 keer, 60 keer leeg.
          vraag(1, 'leeg', 9),
          vraag(1, 'goed', 21),
          vraag(2, 'leeg', 60),
          vraag(2, 'fout', 240),
          // 3: maar 20 keer, en doet dus niet mee.
          vraag(3, 'leeg', 20),
        ],
      },
    ],
  ]);
  const site = 89 / 350;
  assert.ok(Math.abs(c.totaal.leeg - site) < 1e-12);
  assert.ok(Math.abs(c.soorten[1].leeg - (9 + 30 * site) / 60) < 1e-12);
  assert.ok(Math.abs(c.soorten[2].leeg - (60 + 30 * site) / 330) < 1e-12);
  assert.equal(c.soorten[3].leeg, undefined);
  // Eigenlijk 30% tegen 20% leeg. Met maar 30 keer schuift 1 veel meer naar het gemiddelde dan 2,
  // dus het verschil wordt kleiner, maar 1 blijft boven 2.
  const verschil = c.soorten[1].leeg - c.soorten[2].leeg;
  assert.ok(verschil > 0 && verschil < 0.08, `verschil ${verschil}`);
});

test('de pagina Cijfers toont de cijfers, zegt het bij nepcijfers, en werkt ook zonder', (t) => {
  t.after(() => delete globalThis.__CIJFERS__);
  globalThis.__CIJFERS__ = { ...cijfers([]), nep: false };
  let html = vCijfers();
  assert.match(html, /Zodra er genoeg zijn/);
  assert.doesNotMatch(html, /nepcijfers/);
  // De map met tellen op GitHub bestaat pas na de eerste samenvatting.
  assert.doesNotMatch(html, /data\/tellen/);

  const dagen = nepTellen({ weken: 8, tot: new Date('2026-11-16T12:00:00Z') });
  globalThis.__CIJFERS__ = { ...cijfers(dagen), nep: true };
  html = vCijfers();
  assert.match(html, /Dit zijn nepcijfers/);
  assert.match(html, /data\/tellen/);
  assert.match(html, /van 21 september 2026 tot en met 15 november 2026/);
  const koppen = [
    'Het meest geoefend',
    'De moeilijkste vragen',
    'Meest gemaakte fouten',
    'Vaakst leeg gelaten in een proeftoets',
    'Per onderwerp',
  ];
  for (const kop of koppen) assert.ok(html.includes(kop), kop);
  // De tops linken naar precies die soort vraag, met de moeilijkheid als score van 0 tot 100.
  assert.match(
    html,
    /<ol class="ranking"><li><span class="rank-head"><a href="\/[a-z-]+\/oefenen\?soort=\d+">.+?<\/a><b><span class="sr">moeilijkheid <\/span>\d{1,3}<span class="sr"> van 100<\/span><\/b>/,
  );
  // Ook in de tabel per onderwerp linkt elke soort vraag naar oefenen.
  assert.match(html, /<th scope="row"><a href="\/[a-z-]+\/oefenen\?soort=\d+">/);
});

test('de nepcijfers zijn steeds dezelfde, en lijken op echte samenvattingen', () => {
  const tot = new Date('2026-11-16T12:00:00Z');
  const a = nepTellen({ weken: 1, tot });
  assert.deepEqual(a, nepTellen({ weken: 1, tot }));
  assert.deepEqual(
    a.map(([d]) => d),
    [
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ],
  );
  const dir = map(Object.fromEntries(a.map(([d, s]) => [`${d}.json`, nepJSON(s)])));
  try {
    assert.equal(leesTellen(dir, { nep: true }).length, 7);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
