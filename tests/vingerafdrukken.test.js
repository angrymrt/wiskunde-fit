// Dezelfde seed moet dezelfde vraag blijven geven, want een gedeelde link bevat alleen de vraagsoort
// en de seed. Zie #60 en tests/vingerafdruk.js.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fingerprints } from './vingerafdruk.js';

const saved = JSON.parse(
  await readFile(new URL('./vingerafdrukken.json', import.meta.url), 'utf8'),
);

test('dezelfde seed geeft dezelfde vraag als in een gedeelde link', () => {
  const now = fingerprints();
  const fresh = Object.keys(now).filter((id) => !(id in saved));
  assert.deepEqual(
    fresh,
    [],
    `Nieuwe vraagsoort zonder vingerafdruk: ${fresh.join(', ')}. Draai node scripts/vingerafdrukken.js.`,
  );
  const changed = Object.keys(now).filter((id) => now[id] !== saved[id]);
  assert.deepEqual(
    changed,
    [],
    `De antwoorden van vraagsoort ${changed.join(', ')} zijn veranderd bij dezelfde seed. Een gedeelde link toont dan een andere vraag dan de leerling zag. Geef de vraagsoort eerst een versie in de link, zie #60 en AGENTS.md.`,
  );
});
