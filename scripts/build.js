// Bouwt de site in dist/: per pagina een HTML-bestand waar de tekst al in staat, de code, de CSS en
// de lettertypes als losse bestanden met een hash in de naam, en wat Azure en zoekmachines nodig
// hebben. Met --dev wordt de code niet kleiner gemaakt, zodat je die in de browser kunt lezen.
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const read = (path) => readFile(new URL(path, root), 'utf8');
const dev = process.argv.includes('--dev');

// De voettekst toont de versie en de datum van de laatste commit. Zonder git wordt dat vandaag.
const { version } = JSON.parse(await read('package.json'));
let date;
try {
  date = execFileSync('git', ['log', '-1', '--format=%cs'], { encoding: 'utf8' }).trim();
} catch {}
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = new Date().toISOString().slice(0, 10);

// De schermen lezen de versie hier op dezelfde manier als in de browser. En de build leest nooit
// de voortgang van wie bouwt: elke pagina toont wat een nieuwe bezoeker ziet.
globalThis.__VERSIE__ = version;
globalThis.__DATUM__ = date;
Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });
const { PAGES, SITE, redirects } = await import('../src/js/pages.js');
const { screenHTML, shellHTML } = await import('../src/js/ui/screens.js');
const { state } = await import('../src/js/ui/state.js');
const { esc } = await import('../src/js/typeset.js');

await rm(dist, { recursive: true, force: true });

// De code, de CSS en de lettertypes. De hash in de naam verandert als de inhoud verandert, dus de
// browser mag ze een jaar bewaren (zie staticwebapp.config.json).
const { metafile } = await build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: { main: 'src/js/main.js', styles: 'src/styles.css' },
  bundle: true,
  format: 'iife',
  target: 'es2020',
  charset: 'utf8',
  minify: !dev,
  outdir: 'dist/assets',
  entryNames: '[name]-[hash]',
  assetNames: '[name]-[hash]',
  loader: { '.woff2': 'file', '.svg': 'file' },
  metafile: true,
  define: { __VERSIE__: JSON.stringify(version), __DATUM__: JSON.stringify(date) },
});
const assets = Object.keys(metafile.outputs).map((path) => path.replace(/^dist/, ''));
const asset = (pattern) => {
  const found = assets.find((path) => pattern.test(path));
  if (!found) throw new Error(`Geen bestand gebouwd voor ${pattern}`);
  return found;
};
// De lettertypes van de gewone tekst, vet en de koppen. De browser haalt ze zo meteen op, en niet
// pas als de CSS binnen is. Alle lettertypes hebben font-display: optional: wat niet op tijd is,
// gebruikt de pagina niet, zodat er niets verspringt. Vanaf de tweede pagina staan ze in de cache.
const preload = [
  /\/figtree-400-\w+\.woff2$/,
  /\/figtree-700-\w+\.woff2$/,
  /\/bricolage-grotesque-800-\w+\.woff2$/,
]
  .map((p) => `<link rel="preload" href="${asset(p)}" as="font" type="font/woff2" crossorigin />`)
  .join('\n    ');

// Vervang een deel van src/index.html. Met een functie, want de tekst kan $-tekens bevatten.
function replace(html, pattern, replacement) {
  if (!pattern.test(html)) throw new Error(`Niet gevonden in src/index.html: ${pattern}`);
  return html.replace(pattern, () => replacement);
}
const attr = (s) => esc(s).replace(/"/g, '&quot;');
const template = await read('src/index.html');

function pageHTML(page, body) {
  const url = page.path && `${SITE}${page.path}`;
  // Een tag uit het sjabloon, ook als Prettier die over meer regels heeft verdeeld.
  const tag = (name, value) => new RegExp(`<(meta|link)\\s+${name}="${value}"\\s+[^>]*>`);
  const robots = page.index ? '' : '\n    <meta name="robots" content="noindex" />';
  let html = template;
  html = replace(html, /<title>.*<\/title>/, `<title>${esc(page.title)}</title>`);
  html = replace(
    html,
    tag('name', 'description'),
    `<meta name="description" content="${attr(page.description)}" />${robots}`,
  );
  html = replace(
    html,
    tag('property', 'og:title'),
    `<meta property="og:title" content="${attr(page.title)}" />`,
  );
  html = replace(
    html,
    tag('property', 'og:description'),
    `<meta property="og:description" content="${attr(page.description)}" />`,
  );
  // De pagina voor een adres dat niet bestaat, heeft geen eigen adres.
  html = replace(
    html,
    tag('rel', 'canonical'),
    url ? `<link rel="canonical" href="${url}" />` : '',
  );
  html = replace(
    html,
    tag('property', 'og:url'),
    url ? `<meta property="og:url" content="${url}" />` : '',
  );
  html = replace(
    html,
    /<link rel="stylesheet" href="\/styles\.css" \/>/,
    `${preload}\n    <link rel="stylesheet" href="${asset(/\/styles-\w+\.css$/)}" />`,
  );
  html = replace(
    html,
    /<script type="module" src="\/js\/main\.js"><\/script>/,
    `<script defer src="${asset(/\/main-\w+\.js$/)}"></script>`,
  );
  return replace(
    html,
    /<div class="wrap" id="app"><\/div>/,
    `<div class="wrap" id="app">${body}</div>`,
  );
}

for (const page of PAGES) {
  state.view = page.view;
  const body = page.shell ? shellHTML(page.title.replace(/ \| Wiskundefit$/, '')) : screenHTML();
  const file = new URL(page.file, dist);
  await mkdir(new URL('./', file), { recursive: true });
  await writeFile(file, pageHTML(page, body));
}

// Linkvoorbeelden, het beginscherm en het tabblad hebben een echt bestand nodig.
for (const file of ['og.png', 'apple-touch-icon.png', 'favicon.svg']) {
  await copyFile(new URL(`src/${file}`, root), new URL(file, dist));
}

const indexed = PAGES.filter((p) => p.index);
await writeFile(
  new URL('sitemap.xml', dist),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexed.map((p) => `  <url><loc>${SITE}${p.path}</loc></url>`).join('\n')}\n</urlset>\n`,
);
await writeFile(
  new URL('robots.txt', dist),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`,
);

// Azure leest hieruit de regels voor adressen. De doorverwijzingen komen uit de gegevens.
const config = JSON.parse(await read('staticwebapp.config.json'));
config.routes.push(...redirects().map(([route, to]) => ({ route, redirect: to, statusCode: 301 })));
const json = JSON.stringify(config, null, 2);
// Azure leest een groter bestand niet.
if (Buffer.byteLength(json) > 20 * 1024)
  throw new Error('staticwebapp.config.json is groter dan 20 kB.');
await writeFile(new URL('staticwebapp.config.json', dist), `${json}\n`);

const kB = (path) => Math.round(metafile.outputs[`dist${path}`].bytes / 1024);
console.log(
  `dist/ gebouwd: ${PAGES.length} pagina's, code ${kB(asset(/\/main-\w+\.js$/))} kB, CSS ${kB(asset(/\/styles-\w+\.css$/))} kB${dev ? ', niet kleiner gemaakt' : ''}`,
);
