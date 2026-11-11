// Schrijft de vingerafdrukken van alle vraagsoorten naar tests/vingerafdrukken.json. Draai dit voor
// een nieuwe vraagsoort, of als een vraagsoort een nieuwe versie krijgt. Zie #60 en AGENTS.md.
import { writeFile } from 'node:fs/promises';
import { fingerprints } from '../tests/vingerafdruk.js';

const file = new URL('../tests/vingerafdrukken.json', import.meta.url);
await writeFile(file, `${JSON.stringify(fingerprints(), null, 2)}\n`);
console.log('tests/vingerafdrukken.json bijgewerkt.');
