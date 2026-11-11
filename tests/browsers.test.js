// De site werkt in de browsers uit browserslist in package.json. esbuild zet nieuwere schrijfwijzen
// om, maar geen functies die een oudere browser niet heeft. Deze test bouwt de code en de CSS, zoals
// de build, en zoekt naar zulke functies, ook in wat uit node_modules komt. Zie #59.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { TARGETS } from '../scripts/browsers.js';

const root = new URL('../', import.meta.url);

// Wat er niet is in Safari 14.1, Chrome 87 of Firefox 83, met wat je ervoor in de plaats gebruikt.
const JS = [
  [/\bObject\.hasOwn\(/, 'Object.hasOwn', 'Object.prototype.hasOwnProperty.call(...)'],
  [/\.at\(-?\d/, '.at()', 'x[x.length - 1]'],
  [/\bstructuredClone\(/, 'structuredClone', 'JSON.parse(JSON.stringify(...))'],
  [/\.findLast(Index)?\(/, '.findLast()', 'een lus van achteren'],
  [/\.(toSorted|toReversed|toSpliced)\(/, '.toSorted() en dergelijke', '[...x].sort()'],
  [/\b(Object|Map)\.groupBy\(/, 'groupBy', 'een lus met een Map'],
  [/\bArray\.fromAsync\(/, 'Array.fromAsync', 'Promise.all'],
  [/\bcrypto\.randomUUID\(/, 'crypto.randomUUID', 'crypto.getRandomValues'],
  [/\bAbortSignal\.(timeout|any)\(/, 'AbortSignal.timeout', 'setTimeout met een AbortController'],
  [/\bnew WeakRef\(|\bFinalizationRegistry\b/, 'WeakRef', 'een gewone verwijzing'],
  [/\bIntl\.(ListFormat|Segmenter)\b/, 'Intl.ListFormat', 'zelf samenvoegen'],
  [/\brequestIdleCallback\(/, 'requestIdleCallback (nooit in Safari)', 'setTimeout'],
  [/\.showModal\(|<dialog/, '<dialog>', 'een gewoon blok'],
];
// Nieuwere CSS die de opmaak zou breken. Wat alleen iets mooier maakt, zoals :has() voor
// scroll-padding, :focus-visible en text-wrap, mag wel: een oudere browser slaat het over.
const CSS = [
  [/@container\b/, '@container'],
  [/\bcolor-mix\(/, 'color-mix()'],
  [/\b\d+(dvh|svh|lvh)\b/, 'dvh, svh of lvh'],
  [/@layer\b/, '@layer'],
];

const bundle = async (entry) => {
  const out = await build({
    absWorkingDir: fileURLToPath(root),
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'iife',
    target: TARGETS,
    loader: { '.woff2': 'empty', '.svg': 'empty' },
    logLevel: 'silent',
  });
  return out.outputFiles[0].text;
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
  const bad = 'Object.hasOwn(a, b); x.at(-1); structuredClone(y); a.findLast(f); a.toSorted();';
  assert.equal(found(bad, JS).length, 5);
  assert.equal(found('div{height:100dvh} @container x{}', CSS).length, 2);
});
