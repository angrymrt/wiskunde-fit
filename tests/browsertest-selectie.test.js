// Controleert dat de workflow Browsertest de juiste test kiest, en dat de lange browsertest weet welke
// onderwerpen bij een methode-indeling horen.
import test from 'node:test';
import assert from 'node:assert/strict';
import { onderwerpenVan, selectie, slugUitBestand } from '../scripts/browsertest-selectie.js';
import { TOPICS } from '../src/js/topics/index.js';

const slug = (f) => `slug-van-${f.replace(/^.*\//, '').replace('.js', '')}`;
const kies = (...files) => selectie(files, slug);

test('alleen documentatie, gegevens of tests zonder browser vragen geen browsertest', () => {
  for (const f of [
    'README.md',
    'AGENTS.md',
    'CHANGELOG.md',
    'naslag/getal-en-ruimte-13/werkwijze.md',
    'data/tellen/2026-11-10.json',
    'tests/generators.test.js',
    'tests/vingerafdrukken.json',
    'scripts/tokens.js',
    '.github/workflows/tellen.yml',
    'api/tel.js',
  ]) {
    assert.equal(kies(f).soort, 'geen', f);
  }
  assert.equal(kies('README.md', 'tests/vraagsoort-ids.js').soort, 'geen');
});

test('een wijziging aan alleen de stof van onderwerpen draait de lange test voor die onderwerpen', () => {
  assert.deepEqual(kies('src/js/topics/stelling-van-pythagoras.js'), {
    soort: 'onderwerpen',
    onderwerpen: ['slug-van-stelling-van-pythagoras'],
  });
  const twee = kies(
    'src/js/topics/a.js',
    'src/js/topics/b.js',
    'tests/vraagsoort-ids.js',
    'CHANGELOG.md',
  );
  assert.deepEqual(twee.onderwerpen, ['slug-van-a', 'slug-van-b']);
});

test('een methode-indeling vraagt de snelle set', () => {
  assert.equal(kies('src/js/mappings/gr13-havo3.js', 'README.md').soort, 'snel');
});

test('schermen, opmaak, figuren, antwoorden, de build en de stof samen vragen alles', () => {
  for (const f of [
    'src/js/ui/screens.js',
    'src/js/main.js',
    'src/styles.css',
    'src/js/figures.js',
    'src/js/answers.js',
    'src/js/topics/index.js',
    'src/js/topics/shared.js',
    'src/index.html',
    'scripts/build.js',
    'scripts/server.js',
    'staticwebapp.config.json',
    'package.json',
    'tests/browser.e2e.js',
    '.github/workflows/deploy.yml',
  ]) {
    assert.equal(kies(f).soort, 'alles', f);
  }
  assert.equal(kies('src/js/topics/a.js', 'src/js/ui/exam.js').soort, 'alles');
});

test('de slug van een onderwerpbestand komt uit het bestand zelf', () => {
  assert.equal(
    slugUitBestand('src/js/topics/stelling-van-pythagoras.js'),
    'stelling-van-pythagoras',
  );
});

test('de onderwerpen van een methode-indeling en een hoofdstuk', async () => {
  const slugs = new Set(TOPICS.map((t) => t.slug));
  const hoofdstuk4 = await onderwerpenVan('gr13-havo3', '4');
  assert.ok(hoofdstuk4.includes('procentuele-verandering'));
  assert.ok(hoofdstuk4.includes('interpoleren-en-extrapoleren'));
  assert.ok(!hoofdstuk4.includes('lineaire-vergelijkingen'));
  assert.ok(hoofdstuk4.every((s) => slugs.has(s)));
  const alles = await onderwerpenVan('getal-en-ruimte-13-havo-3');
  assert.ok(alles.length > hoofdstuk4.length);
  await assert.rejects(() => onderwerpenVan('bestaat-niet'), /Onbekende methode-indeling/);
  await assert.rejects(() => onderwerpenVan('gr13-havo3', '99'), /geen hoofdstuk 99/);
});
