// De anonieme tellen: welke de functie /api/tel aanneemt, waar ze heen gaan en wat er wordt bewaard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { corsHeaders, handleTel, insertRow } from '../api/tel.js';
import { checkTellen } from '../src/js/tel.js';
import { overzicht, telOp, toJSON } from '../scripts/tellen-samenvatten.js';

const soorten = new Set([12, 38]);
const poging = { tel: 'poging', soort: 38, uitkomst: 'fout', duur: 47, hint: true };
const valkuil = { tel: 'valkuil', soort: 38, valkuil: 'wortel-vergeten' };
const toetsvraag = { tel: 'toetsvraag', soort: 12, uitkomst: 'leeg' };

test('alleen bekende tellen met bekende waarden zijn geldig', () => {
  assert.deepEqual(checkTellen([poging, valkuil, toetsvraag], soorten), [
    poging,
    valkuil,
    toetsvraag,
  ]);
  const wrong = [
    [],
    {},
    [{ ...poging, soort: 99 }],
    [{ ...poging, tel: 'weergave' }],
    [{ ...poging, uitkomst: 'leeg' }],
    [{ ...toetsvraag, uitkomst: 'uitwerking' }],
    [{ ...poging, duur: -1 }],
    [{ ...poging, duur: 1801 }],
    [{ ...poging, duur: 4.5 }],
    [{ ...poging, hint: 'ja' }],
    [{ ...valkuil, valkuil: 'Wortel vergeten' }],
    [{ ...valkuil, valkuil: 'x'.repeat(61) }],
    // Een veld dat er niet hoort, zoals een id, maakt het hele bericht ongeldig.
    [{ ...poging, id: 'abc' }],
    [poging, { ...valkuil, soort: '38' }],
    Array(41).fill(toetsvraag),
  ];
  for (const tellen of wrong)
    assert.equal(checkTellen(tellen, soorten), null, JSON.stringify(tellen));
});

test('de functie kiest de tabel bij de site, en bewaart alleen de tel en de dag', async () => {
  const rows = [];
  const env = { TELLERS_TABEL: 'prod', TELLERS_DEV_TABEL: 'dev' };
  const store = (table, row) => rows.push({ table, ...row });
  const now = new Date('2026-11-12T23:30:00Z');
  const send = (req) =>
    handleTel(
      { method: 'POST', userAgent: 'Mozilla/5.0', body: JSON.stringify([poging]), ...req },
      { env, soorten, store, now },
    );

  assert.equal(await send({ origin: 'https://wiskundefit.nl' }), 204);
  assert.equal(
    await send({ origin: 'https://proud-meadow-0cf492e03-47.westeurope.5.azurestaticapps.net' }),
    204,
  );
  assert.equal(await send({ origin: 'http://127.0.0.1:5173' }), 204);
  assert.deepEqual(
    rows.map((r) => r.table),
    ['prod', 'dev', 'dev'],
  );
  // Om half een 's nachts in Nederland is het al de volgende dag.
  const { table, PartitionKey, RowKey, ...rest } = rows[0];
  assert.equal(PartitionKey, '2026-11-13');
  assert.match(RowKey, /^[0-9a-f-]{36}$/);
  assert.notEqual(rows[1].RowKey, RowKey);
  assert.deepEqual(rest, poging);

  // Een proeftoets: elke vraag wordt een eigen rij.
  rows.length = 0;
  const toets = JSON.stringify(Array(10).fill(toetsvraag));
  assert.equal(await send({ origin: 'https://wiskundefit.nl', body: toets }), 204);
  assert.equal(new Set(rows.map((r) => r.RowKey)).size, 10);

  // Wat niet klopt, wordt niet bewaard.
  rows.length = 0;
  assert.equal(await send({ origin: 'https://wiskundefit.nl', method: 'GET' }), 405);
  assert.equal(await send({ origin: 'https://example.com' }), 403);
  assert.equal(await send({ origin: 'https://wiskundefit.nl.example.com' }), 403);
  assert.equal(await send({ origin: undefined }), 403);
  assert.equal(await send({ origin: 'https://wiskundefit.nl', body: '' }), 400);
  assert.equal(await send({ origin: 'https://wiskundefit.nl', body: 'geen json' }), 400);
  assert.equal(await send({ origin: 'https://wiskundefit.nl', body: '[{}]' }), 400);
  assert.equal(
    await send({ origin: 'https://wiskundefit.nl', body: ' '.repeat(9000) + '[]' }),
    400,
  );
  // Een bot krijgt gewoon antwoord, maar telt niet mee.
  const bot = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
  assert.equal(await send({ origin: 'https://wiskundefit.nl', userAgent: bot }), 204);
  assert.equal(rows.length, 0);

  // Een site die mag sturen, krijgt CORS-headers met haar eigen naam. Een andere site niet.
  assert.equal(await send({ origin: 'https://wiskundefit.nl', method: 'OPTIONS' }), 204);
  assert.equal(await send({ origin: 'https://example.com', method: 'OPTIONS' }), 403);
  assert.equal(
    corsHeaders('https://wiskundefit.nl')['Access-Control-Allow-Origin'],
    'https://wiskundefit.nl',
  );
  assert.deepEqual(corsHeaders('https://example.com'), {});
  assert.equal(rows.length, 0);

  // Zonder setting controleert de functie de tellen wel, maar bewaart hij niets.
  const none = await handleTel(
    { method: 'POST', origin: 'https://wiskundefit.nl', body: JSON.stringify([poging]) },
    { env: {}, soorten, store },
  );
  assert.equal(none, 204);
  assert.equal(rows.length, 0);
});

test('het samenvatten telt combinaties per dag, zonder tijdstip of volgorde', () => {
  const row = (t, n) => ({
    PartitionKey: '2026-11-12',
    RowKey: `rij-${n}`,
    Timestamp: `2026-11-12T10:0${n}:00Z`,
    ...t,
  });
  const rows = [
    row(poging, 1),
    row(toetsvraag, 2),
    row(poging, 3),
    row({ ...poging, soort: 12 }, 4),
    row(valkuil, 5),
  ];
  const { samenvatting, onbekend } = telOp(rows);
  assert.deepEqual(onbekend, []);
  assert.deepEqual(samenvatting, {
    poging: [
      { soort: 12, uitkomst: 'fout', duur: 47, hint: true, aantal: 1 },
      { soort: 38, uitkomst: 'fout', duur: 47, hint: true, aantal: 2 },
    ],
    valkuil: [{ soort: 38, valkuil: 'wortel-vergeten', aantal: 1 }],
    toetsvraag: [{ soort: 12, uitkomst: 'leeg', aantal: 1 }],
  });
  // Dezelfde rijen in een andere volgorde geven precies hetzelfde bestand.
  assert.equal(toJSON(telOp([...rows].reverse()).samenvatting), toJSON(samenvatting));
  assert.doesNotMatch(toJSON(samenvatting), /rij-|Timestamp|PartitionKey/);

  assert.deepEqual(JSON.parse(toJSON(samenvatting)), samenvatting);

  // Een soort tel die het script niet kent, telt niet stil mee.
  assert.equal(telOp([row({ tel: 'weergave', soort: 12 }, 6)]).onbekend.length, 1);

  assert.match(
    overzicht('tellers', [['2026-11-12', samenvatting]]),
    /\| 2026-11-12 \| 3 \| 1 \| 1 \|/,
  );
});

test('een tijdelijke fout van de tabel krijgt nog twee kansen, een fout in de rij niet', async () => {
  const env = { IDENTITY_ENDPOINT: 'https://identity', IDENTITY_HEADER: 'geheim' };
  const real = globalThis.fetch;
  const calls = [];
  let answers = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    if (url.startsWith('https://identity')) {
      const expires = String(Math.floor(Date.now() / 1000) + 3600);
      return new Response(JSON.stringify({ access_token: 't', expires_on: expires }));
    }
    return new Response(null, { status: answers.shift() });
  };
  try {
    answers = [503, 204];
    await insertRow('https://tabel', { a: 1 }, env, 1);
    assert.equal(calls.filter((u) => u === 'https://tabel').length, 2);

    calls.length = 0;
    answers = [503, 503, 503];
    await assert.rejects(insertRow('https://tabel', { a: 1 }, env, 1));
    assert.equal(calls.filter((u) => u === 'https://tabel').length, 3);

    calls.length = 0;
    answers = [400];
    await assert.rejects(insertRow('https://tabel', { a: 1 }, env, 1));
    assert.equal(calls.filter((u) => u === 'https://tabel').length, 1);

    // Een geweigerd token: de volgende poging haalt een nieuw.
    calls.length = 0;
    answers = [403, 204];
    await insertRow('https://tabel', { a: 1 }, env, 1);
    assert.equal(calls.filter((u) => u.startsWith('https://identity')).length, 1);
  } finally {
    globalThis.fetch = real;
  }
});
