// De site werkt in de browsers uit browserslist in package.json. esbuild zet nieuwere schrijfwijzen
// om, maar geen functies die een oudere browser niet heeft. Deze test bouwt de code en de CSS, zoals
// de build, en zoekt naar zulke functies, ook in wat uit node_modules komt. Zie #59.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { TARGETS } from '../scripts/browsers.js';
import { catalogusPlugin } from '../scripts/catalogus.js';

const root = new URL('../', import.meta.url);

// Wat er niet is in Safari 14.1, Chrome 87 of Firefox 83, met wat je ervoor in de plaats gebruikt.
const JS = [
  [/\bhasOwn\b/, 'Object.hasOwn', 'Object.prototype.hasOwnProperty.call(...)'],
  [/\.at\(/, '.at()', 'x[x.length - 1]'],
  [/\bstructuredClone\b/, 'structuredClone', 'JSON.parse(JSON.stringify(...))'],
  [/\.findLast(Index)?\b/, '.findLast()', 'een lus van achteren'],
  [/\.(toSorted|toReversed|toSpliced)\b/, '.toSorted() en dergelijke', '[...x].sort()'],
  [/\b(Object|Map)\.groupBy\b/, 'groupBy', 'een lus met een Map'],
  [/\bArray\.fromAsync\b/, 'Array.fromAsync', 'Promise.all'],
  [/\bcrypto\.randomUUID\b/, 'crypto.randomUUID', 'crypto.getRandomValues'],
  [/\bAbortSignal\.(timeout|any)\b/, 'AbortSignal.timeout', 'setTimeout met een AbortController'],
  [/\bWeakRef\b|\bFinalizationRegistry\b/, 'WeakRef', 'een gewone verwijzing'],
  [/\bIntl\.(ListFormat|Segmenter)\b/, 'Intl.ListFormat', 'zelf samenvoegen'],
  [/\brequestIdleCallback\b/, 'requestIdleCallback (nooit in Safari)', 'setTimeout'],
  [/\.showModal\b|<dialog/, '<dialog>', 'een gewoon blok'],
];
// Nieuwere CSS die de opmaak zou breken. Wat alleen iets mooier maakt, zoals :focus-visible en
// text-wrap, mag wel: een oudere browser slaat het over. :has() is er pas vanaf Safari 15.4,
// Chrome 105 en Firefox 121, en is meestal nodig voor de opmaak. Gebruik daar een klasse.
const CSS = [
  [/:has\(/, ':has(), gebruik een klasse'],
  [/@container\b/, '@container'],
  [/\bcolor-mix\(/, 'color-mix()'],
  [/\b\d+(dvh|svh|lvh)\b/, 'dvh, svh of lvh'],
  [/@layer\b/, '@layer'],
];

// Zoals de build: de code in meer bestanden, met een bestand per onderwerp. De test kijkt in alle
// bestanden samen.
const bundle = async (entry) => {
  const out = await build({
    absWorkingDir: fileURLToPath(root),
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    splitting: true,
    outdir: 'niet-geschreven',
    plugins: [catalogusPlugin()],
    target: TARGETS,
    loader: { '.woff2': 'empty', '.svg': 'empty' },
    logLevel: 'silent',
  });
  return out.outputFiles.map((f) => f.text).join('\n');
};
const found = (code, list) =>
  list
    .filter(([re]) => re.test(code))
    .map(([re, name, instead]) => `${name}${instead ? `, gebruik ${instead}` : ''}`);

test('de code gebruikt geen functies die de ondersteunde browsers niet hebben', async () => {
  const html = await readFile(new URL('src/index.html', root), 'utf8');
  const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
  const code = (await bundle('src/js/main.js')) + inline;
  assert.deepEqual(found(code, JS), []);
});

test('de CSS gebruikt niets wat de opmaak in de ondersteunde browsers breekt', async () => {
  assert.deepEqual(found(await bundle('src/styles.css'), CSS), []);
});

test('de controle vindt wat ze zoekt', () => {
  // Zo blijft de test werken als een patroon per ongeluk niets meer vindt.
  for (const bad of [
    'Object.hasOwn(a, b)',
    'keys.filter(Object.hasOwn)',
    'const { hasOwn } = Object',
    'x.at(-1)',
    'x.at(i)',
    'x.at(x.length - 1)',
    'structuredClone(y)',
    'a.findLast(f)',
    'a.toSorted()',
    'new WeakRef(x)',
  ])
    assert.equal(found(bad, JS).length, 1, bad);
  for (const bad of ['html:has(.x){}', 'div{height:100dvh}', '@container x{}'])
    assert.equal(found(bad, CSS).length, 1, bad);
});
