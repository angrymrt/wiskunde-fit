// Controleert of een nieuwe versie klaar is om een release te worden.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { notesFor, versions } from '../scripts/release-notes.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const changelog = read('CHANGELOG.md');
const { version } = JSON.parse(read('package.json'));

test('de bovenste versie in CHANGELOG.md is de versie in package.json', () => {
  assert.equal(versions(changelog)[0], version);
});

test('package-lock.json heeft dezelfde versie', () => {
  assert.equal(JSON.parse(read('package-lock.json')).version, version);
});

test('elke versie komt één keer voor en heeft notities', () => {
  const all = versions(changelog);
  assert.equal(new Set(all).size, all.length);
  for (const v of all) assert.ok(notesFor(changelog, v).length > 0, `Lege notities bij ${v}`);
});

test('de linkvoorbeelden staan vóór de CSS en wijzen naar een bestaande afbeelding', () => {
  const html = read('src/index.html');
  const image = html.match(/property="og:image" content="https:\/\/wiskundefit\.nl\/([^"]+)"/);
  assert.ok(image, 'og:image moet een volledig adres zijn');
  assert.ok(html.lastIndexOf('property="og:') < html.indexOf('rel="stylesheet"'));
  const png = readFileSync(new URL(`../src/${image[1]}`, import.meta.url));
  // De breedte en hoogte staan vast in de kop van elk PNG-bestand.
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630]);
  assert.ok(png.length < 300_000, 'WhatsApp slaat grote afbeeldingen over');
});

test('notesFor geeft alleen de tekst van die versie', () => {
  const text = '# Titel\n\n## 1.1.0\n\nNieuw\n\n### Kop\n\nMeer\n\n## 1.0.0\n\nOud\n';
  assert.equal(notesFor(text, '1.1.0'), 'Nieuw\n\n### Kop\n\nMeer');
  assert.equal(notesFor(text, '1.0.0'), 'Oud');
  assert.throws(() => notesFor(text, '2.0.0'), /Geen notities/);
});
