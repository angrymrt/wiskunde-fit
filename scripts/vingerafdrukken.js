// Werkt tests/vingerafdrukken.json bij: voegt nieuwe vraagsoorten toe en haalt gestopte weg. Een
// vingerafdruk die is veranderd, blijft staan, want dan geeft dezelfde seed een andere vraag. Noem
// de nummers als die vraagsoort een nieuwe versie heeft gekregen:
//   node scripts/vingerafdrukken.js 17 41
// Zie #60 en AGENTS.md.
import { readFile, writeFile } from 'node:fs/promises';
import { fingerprints } from '../tests/vingerafdruk.js';

const file = new URL('../tests/vingerafdrukken.json', import.meta.url);
const saved = JSON.parse(await readFile(file, 'utf8'));
const renew = new Set(process.argv.slice(2));
const now = fingerprints();
const out = {};
const kept = [];
for (const [id, hash] of Object.entries(now)) {
  if (id in saved && saved[id] !== hash && !renew.has(id)) {
    out[id] = saved[id];
    kept.push(id);
  } else out[id] = hash;
}
await writeFile(file, `${JSON.stringify(out, null, 2)}\n`);
const added = Object.keys(now).filter((id) => !(id in saved));
const removed = Object.keys(saved).filter((id) => !(id in now));
console.log(
  `Toegevoegd: ${added.join(', ') || 'geen'}. Weggehaald: ${removed.join(', ') || 'geen'}.`,
);
if (kept.length)
  console.log(
    `Veranderd maar niet bijgewerkt: ${kept.join(', ')}. Geef die eerst een versie in de link (#60) en noem dan de nummers.`,
  );
