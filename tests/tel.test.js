// De anonieme tellen: welke de functie /api/tel aanneemt, waar ze heen gaan en wat er wordt bewaard.
import test from 'node:test';
import assert from 'node:assert/strict';
import { handleTel } from '../api/tel.js';
import { checkTellen } from '../src/js/tel.js';

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

  // Zonder setting controleert de functie de tellen wel, maar bewaart hij niets.
  const none = await handleTel(
    { method: 'POST', origin: 'https://wiskundefit.nl', body: JSON.stringify([poging]) },
    { env: {}, soorten, store },
  );
  assert.equal(none, 204);
  assert.equal(rows.length, 0);
});
