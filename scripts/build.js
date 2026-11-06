// Bouwt dist/index.html: de hele site in één los te delen HTML-bestand.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('src/js/main.js', root))],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
  write: false,
});
const js = bundle.outputFiles[0].text;
const css = await read('src/styles.css');

if (js.includes('</script') || css.includes('</style')) {
  throw new Error('De code bevat een sluittag die het inlinen zou breken.');
}

// Vervang de verwijzingen door de inhoud. Met een functie, want de code bevat $-tekens.
function inline(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`Niet gevonden in src/index.html: ${pattern}`);
  return html.replace(pattern, () => replacement);
}

let html = await read('src/index.html');
html = inline(html, /<link[^>]*href="styles\.css"[^>]*>/, `<style>\n${css}</style>`);
html = inline(html, /<script[^>]*src="js\/main\.js"[^>]*><\/script>/, `<script>\n${js}</script>`);

await mkdir(new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/index.html', root), html);
console.log(`dist/index.html gebouwd (${Math.round(Buffer.byteLength(html) / 1024)} kB)`);
