// Haalt de notities van een versie uit CHANGELOG.md. De workflow maakt daar een release van.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const versions = (changelog) => [...changelog.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());

function notesFor(changelog, version) {
  const parts = changelog.split(/^## /m).slice(1);
  const part = parts.find((p) => p.split('\n')[0].trim() === version);
  if (!part) throw new Error(`Geen notities voor versie ${version} in CHANGELOG.md`);
  return part.slice(part.indexOf('\n') + 1).trim();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
  const { version } = JSON.parse(read('package.json'));
  console.log(notesFor(read('CHANGELOG.md'), version));
}

export { versions, notesFor };
