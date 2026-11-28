// De drie lijsten van schermen die in een eigen bestand staan moeten gelijk blijven (#206):
// LATER in scripts/later-schermen.js (bestand -> namen), SCHERM_VAN in dezelfde (scherm -> bestand)
// en LATER in src/js/ui/laden.js (scherm -> klaar en laad). Een scherm dat in een ervan ontbreekt,
// zou anders pas opvallen als de browser iets niet vindt.
import test from 'node:test';
import assert from 'node:assert/strict';
import { BIJ_ONDERWERP, LATER as BESTANDEN, SCHERM_VAN } from '../scripts/later-schermen.js';
import { BIJ_ONDERWERP_LADEN, LATER as SCHERMEN } from '../src/js/ui/laden.js';

const sleutels = (o) => Object.keys(o).sort();

test('elk scherm in laden.js heeft een bestand in SCHERM_VAN, en andersom', () => {
  assert.deepEqual(sleutels(SCHERMEN), sleutels(SCHERM_VAN));
});

// De bestanden die met een onderwerp laden (BIJ_ONDERWERP) hebben geen eigen scherm en staan dus niet
// in SCHERM_VAN.
test('elk bestand in SCHERM_VAN staat in later-schermen.js, en andersom', () => {
  const uitSchermVan = [...new Set([...Object.values(SCHERM_VAN), ...BIJ_ONDERWERP])]
    .map((f) => `${f}.js`)
    .sort();
  assert.deepEqual(sleutels(BESTANDEN), uitSchermVan);
});

test('elk bestand exporteert de namen uit LATER, en klaar en laad', async () => {
  for (const [bestand, namen] of Object.entries(BESTANDEN)) {
    const m = await import(`../src/js/ui/${bestand}`);
    for (const naam of [...namen, 'klaar', 'laad']) {
      assert.equal(typeof m[naam], 'function', `${bestand} exporteert ${naam} niet`);
    }
    // Andersom: een export die niet in LATER staat, bestaat in de browser niet voor wie het importeert.
    assert.deepEqual(Object.keys(m).sort(), [...namen, 'klaar', 'laad'].sort(), bestand);
  }
});

test('elk scherm in laden.js gebruikt klaar en laad van het bestand uit SCHERM_VAN', async () => {
  for (const [scherm, bestand] of Object.entries(SCHERM_VAN)) {
    const m = await import(`../src/js/ui/${bestand}.js`);
    assert.equal(SCHERMEN[scherm].klaar, m.klaar, `${scherm}: klaar komt niet uit ${bestand}.js`);
    assert.equal(SCHERMEN[scherm].laad, m.laad, `${scherm}: laad komt niet uit ${bestand}.js`);
  }
});

test('laden.js laadt met een onderwerp de bestanden uit BIJ_ONDERWERP', async () => {
  assert.equal(BIJ_ONDERWERP_LADEN.length, BIJ_ONDERWERP.length);
  for (const [i, bestand] of BIJ_ONDERWERP.entries()) {
    const m = await import(`../src/js/ui/${bestand}.js`);
    assert.equal(BIJ_ONDERWERP_LADEN[i].klaar, m.klaar, `klaar komt niet uit ${bestand}.js`);
    assert.equal(BIJ_ONDERWERP_LADEN[i].laad, m.laad, `laad komt niet uit ${bestand}.js`);
  }
});
