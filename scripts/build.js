// Bouwt dist/index.html: de hele site in één HTML-bestand, plus wat Azure en linkvoorbeelden nodig hebben.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
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
// Zet de lettertypes als data-URL in de CSS, zodat het ene bestand alles bevat.
const fonts = /url\('(fonts\/[^']+\.woff2)'\)/g;
let css = await read('src/styles.css');
for (const [ref, path] of css.matchAll(fonts)) {
  const data = await readFile(new URL(`src/${path}`, root), 'base64');
  css = css.replace(ref, () => `url('data:font/woff2;base64,${data}')`);
}

if (js.includes('</script') || css.includes('</style')) {
  throw new Error('De code bevat een sluittag die het inlinen zou breken.');
}

// Vervang de verwijzingen door de inhoud. Met een functie, want de code bevat $-tekens.
function inline(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`Niet gevonden in src/index.html: ${pattern}`);
  return html.replace(pattern, () => replacement);
}

const icon = encodeURIComponent(await read('src/favicon.svg'));

let html = await read('src/index.html');
html = inline(html, /href="\/favicon\.svg"/, `href="data:image/svg+xml,${icon}"`);
html = inline(html, /<link[^>]*href="\/styles\.css"[^>]*>/, `<style>\n${css}</style>`);
html = inline(html, /<script[^>]*src="\/js\/main\.js"[^>]*><\/script>/, `<script>\n${js}</script>`);

await mkdir(new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/index.html', root), html);
// Linkvoorbeelden en het beginscherm hebben een echt bestand nodig.
for (const file of ['og.png', 'apple-touch-icon.png']) {
  await copyFile(new URL(`src/${file}`, root), new URL(`dist/${file}`, root));
}
// Azure leest hieruit dat elk adres de site moet tonen.
await copyFile(
  new URL('staticwebapp.config.json', root),
  new URL('dist/staticwebapp.config.json', root),
);
console.log(`dist/index.html gebouwd (${Math.round(Buffer.byteLength(html) / 1024)} kB)`);
