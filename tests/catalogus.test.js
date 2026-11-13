// De catalogus in de browser komt uit de onderwerpbestanden (zie scripts/catalogus.js). Deze test
// bouwt topics/index.js zoals de build dat doet, met een eigen bestand per onderwerp, en draait dat
// in Node. Voor het laden moet de catalogus kloppen, en na het laden moet alles hetzelfde zijn als
// in Node: dezelfde seed geeft dezelfde vraag.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { VELDEN, VELDEN_LATER, catalogusPlugin } from '../scripts/catalogus.js';
import { TOPICS, makeQuestion } from '../src/js/topics/index.js';

const root = fileURLToPath(new URL('../', import.meta.url));
// Wat topics/index.js zelf aan een onderwerp toevoegt.
const LINKS = ['domain', 'prev', 'next', 'prerequisites'];

test('de catalogus past bij de onderwerpen, en na het laden is alles hetzelfde', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'catalogus-'));
  try {
    const { metafile } = await build({
      absWorkingDir: root,
      entryPoints: { index: 'src/js/topics/index.js' },
      bundle: true,
      format: 'esm',
      splitting: true,
      outdir: dir,
      outExtension: { '.js': '.mjs' },
      plugins: [catalogusPlugin()],
      metafile: true,
      logLevel: 'silent',
    });
    // In het bestand met de catalogus staat geen onderwerpbestand, alleen topics/index.js.
    const entry = Object.values(metafile.outputs).find(
      (o) => o.entryPoint === 'src/js/topics/index.js',
    );
    assert.deepEqual(
      Object.keys(entry.inputs).filter((p) => p.startsWith('src/js/topics/')),
      ['src/js/topics/index.js'],
    );
    const browser = await import(pathToFileURL(join(dir, 'index.mjs')).href);
    assert.deepEqual(
      browser.TOPICS.map((t) => t.slug),
      TOPICS.map((t) => t.slug),
    );
    for (const [i, t] of browser.TOPICS.entries()) {
      const node = TOPICS[i];
      assert.equal(browser.geladen(t), false, t.slug);
      for (const key of VELDEN) assert.deepEqual(t[key], node[key], `${t.slug}: ${key}`);
      for (const key of VELDEN_LATER) assert.ok(!(key in t), `${t.slug}: ${key} komt pas later`);
      assert.deepEqual(
        t.skills.map((k) => [k.id, k.name, k.gen]),
        node.skills.map((k) => [k.id, k.name, undefined]),
        t.slug,
      );
      assert.equal(t.domain.slug, node.domain.slug, t.slug);
      assert.deepEqual(
        t.prerequisites.map((p) => p.slug),
        node.prerequisites.map((p) => p.slug),
        t.slug,
      );
      // Elk veld van een onderwerp staat in de catalogus of komt later. Een nieuw veld vraagt dus
      // om een keuze in scripts/catalogus.js.
      for (const key of Object.keys(node)) {
        assert.ok(
          [...VELDEN, ...VELDEN_LATER, 'skills', ...LINKS].includes(key),
          `${t.slug}: zet ${key} in VELDEN of VELDEN_LATER in scripts/catalogus.js`,
        );
      }
    }
    await browser.laadOnderwerpen(browser.TOPICS);
    for (const [i, t] of browser.TOPICS.entries()) {
      const node = TOPICS[i];
      assert.equal(browser.geladen(t), true, t.slug);
      for (const key of VELDEN_LATER) assert.deepEqual(t[key], node[key], `${t.slug}: ${key}`);
      for (const [j, k] of t.skills.entries()) {
        assert.equal(k.gen.name, node.skills[j].gen.name, `${t.slug}: ${k.id}`);
        for (const seed of [1, 2, 3]) {
          const a = browser.makeQuestion(k, seed),
            b = makeQuestion(node.skills[j], seed);
          assert.equal(JSON.stringify(a), JSON.stringify(b), `${k.id} met seed ${seed}`);
        }
      }
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
