// Bouwt de site in dist/: per pagina een HTML-bestand waar de tekst al in staat, de code, de CSS en
// de lettertypes als losse bestanden met een hash in de naam, en wat Azure en zoekmachines nodig
// hebben. Met --dev wordt de code niet kleiner gemaakt, zodat je die in de browser kunt lezen, en
// komt alles in dist-dev/.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { basename, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { TARGETS } from './browsers.js';
import { catalogusPlugin } from './catalogus.js';

const root = new URL('../', import.meta.url);
const dev = process.argv.includes('--dev');
// Met --nep gebruikt de pagina Cijfers de nepcijfers uit data/nep-tellen/. Dat kan alleen in
// dist-dev/, zodat nepcijfers nooit online komen.
const nep = process.argv.includes('--nep');
if (nep && !dev) throw new Error('--nep kan alleen samen met --dev.');
// npm run dev bouwt in een eigen map. Zo verandert dist/ niet terwijl de browsertest of
// scripts/controleer-site.js die gebruikt.
const target = dev ? 'dist-dev' : 'dist';
// Eerst in een eigen map, en pas als alles klaar is op de plek van target. Zo toont npm run dev nooit
// een halve site, en blijft na een fout de vorige build staan.
const out = `${target}-bouw`;
const dist = new URL(`${out}/`, root);
const read = (path) => readFile(new URL(path, root), 'utf8');

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
// De cijfers voor de pagina Cijfers, al uitgerekend. Zie src/js/cijfers.js.
const { leesTellen } = await import('./tellen-lezen.js');
const { cijfers } = await import('../src/js/cijfers.js');
const tellen = leesTellen(fileURLToPath(new URL(nep ? 'data/nep-tellen/' : 'data/tellen/', root)), {
  nep,
});
if (nep && !tellen.length)
  throw new Error('Geen nepcijfers. Maak ze met node scripts/nep-tellen.js.');
globalThis.__CIJFERS__ = { ...cijfers(tellen), nep };
// Bij elke getelde valkuil de gerichte feedback, zoals een leerling die ziet. Uit de vragen van de
// vraagsoort zelf, want een valkuil hoort bij een vraag.
{
  const { TOPICS, makeQuestion } = await import('../src/js/topics/index.js');
  for (const skill of TOPICS.flatMap((t) => t.skills)) {
    const s = globalThis.__CIJFERS__.soorten[skill.id];
    if (!s) continue;
    const ids = new Set(Object.keys(s.valkuilen));
    s.teksten = {};
    for (let seed = 1; seed <= 200 && ids.size; seed++) {
      for (const trap of makeQuestion(skill, seed).traps ?? []) {
        if (ids.delete(trap.id)) s.teksten[trap.id] = trap.m;
      }
    }
  }
}
Object.defineProperty(globalThis, 'localStorage', { value: undefined, configurable: true });
const { PAGES, SITE, redirects } = await import('../src/js/pages.js');
const { screenHTML, shellHTML } = await import('../src/js/ui/screens.js');
const { state } = await import('../src/js/ui/state.js');
const { esc } = await import('../src/js/typeset.js');

await rm(dist, { recursive: true, force: true });

// De code, de CSS en de lettertypes. De hash in de naam verandert als de inhoud verandert, dus de
// browser mag ze een jaar bewaren (zie staticwebapp.config.json).
// De code staat in meer bestanden: main met de schermen en de catalogus, een bestand per onderwerp
// dat main pas laadt als het nodig is, en gedeelde code in chunk-*.js. Zie scripts/catalogus.js.
const { metafile, outputFiles } = await build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: { main: 'src/js/main.js', styles: 'src/styles.css' },
  bundle: true,
  format: 'esm',
  splitting: true,
  plugins: [catalogusPlugin()],
  write: false,
  // esbuild zet nieuwere schrijfwijzen in de code en de CSS om voor deze browsers. Functies die er
  // niet zijn, zoals Object.hasOwn, zet het niet om. Die bewaakt tests/browsers.test.js.
  target: TARGETS,
  charset: 'utf8',
  minify: !dev,
  // Met npm run dev wijst een sourcemap naar src/, zodat je in de browser en in VS Code (zie
  // .vscode/launch.json) een breakpoint in je eigen bestanden kunt zetten.
  sourcemap: dev ? 'inline' : false,
  outdir: `${out}/assets`,
  entryNames: '[name]-[hash]',
  chunkNames: '[name]-[hash]',
  assetNames: '[name]-[hash]',
  loader: { '.woff2': 'file', '.svg': 'file' },
  metafile: true,
  define: {
    __VERSIE__: JSON.stringify(version),
    __DATUM__: JSON.stringify(date),
    __CIJFERS__: JSON.stringify(globalThis.__CIJFERS__),
  },
});
// esbuild rekent bij de code ook de paden van de modules mee in de hash, en Windows schrijft die
// met \. Dan heet dezelfde code lokaal anders dan online, en kan scripts/controleer-site.js een
// preview niet met dist/ vergelijken. Daarom krijgt de code een hash van alleen de inhoud. Een
// codebestand noemt de bestanden die het laadt bij naam, dus die krijgen eerst hun nieuwe naam.
const files = new Map(
  outputFiles.map((f) => [relative(fileURLToPath(root), f.path).replace(/\\/g, '/'), f.contents]),
);
const todo = new Set(Object.keys(metafile.outputs).filter((path) => path.endsWith('.js')));
const renamed = new Map();
while (todo.size) {
  const ready = [...todo].filter((path) =>
    metafile.outputs[path].imports.every((i) => !todo.has(i.path)),
  );
  if (!ready.length) throw new Error(`Codebestanden laden elkaar: ${[...todo].join(', ')}`);
  for (const path of ready) {
    const output = metafile.outputs[path];
    let code = Buffer.from(files.get(path)).toString('utf8');
    for (const i of output.imports) {
      const to = renamed.get(i.path);
      if (to) code = code.replaceAll(basename(i.path), basename(to));
    }
    const hash = createHash('sha256').update(code).digest('hex').slice(0, 8);
    const to = path.replace(/-\w+\.js$/, `-${hash.toUpperCase()}.js`);
    renamed.set(path, to);
    files.delete(path);
    files.set(to, code);
    delete metafile.outputs[path];
    metafile.outputs[to] = output;
    todo.delete(path);
  }
}
for (const output of Object.values(metafile.outputs)) {
  output.imports = output.imports.map((i) => ({ ...i, path: renamed.get(i.path) ?? i.path }));
}
await mkdir(new URL('assets/', dist), { recursive: true });
for (const [path, contents] of files) await writeFile(new URL(path, root), contents);
const assets = Object.keys(metafile.outputs).map((path) => path.slice(out.length));
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

// De code die main meteen laadt, en per onderwerp het bestand met de generatoren en de uitleg. Op
// de pagina van een onderwerp haalt de browser dat al op terwijl main nog laadt. Een browser die
// modulepreload niet kent, haalt het pas op als main erom vraagt.
const imported = (file, seen = new Set()) => {
  for (const i of metafile.outputs[`${out}${file}`].imports) {
    const f = i.path.slice(out.length);
    if (i.kind === 'import-statement' && !seen.has(f)) imported(f, seen.add(f));
  }
  return seen;
};
const main = asset(/\/main-\w+\.js$/);
const start = [main, ...imported(main)];
const topicCode = new Map();
for (const [path, { entryPoint }] of Object.entries(metafile.outputs)) {
  if (!/^src\/js\/topics\/.+\.js$/.test(entryPoint ?? '') || entryPoint.endsWith('/index.js'))
    continue;
  const { default: topic } = await import(pathToFileURL(fileURLToPath(new URL(entryPoint, root))));
  const file = path.slice(out.length);
  topicCode.set(
    topic.slug,
    [file, ...imported(file)].filter((f) => !start.includes(f)),
  );
}
const modulepreload = (list) =>
  list.map((f) => `\n    <link rel="modulepreload" href="${f}" />`).join('');

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
    `<script type="module" src="${main}"></script>${modulepreload([...start.slice(1), ...(page.view.name === 'topic' ? topicCode.get(page.view.slug) : [])])}`,
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

// De functie /api/tel, in dist-api/. Azure installeert daar @azure/functions uit package.json. De
// ids van de vraagsoorten komen erin, zodat de functie weet welke tellen kunnen bestaan.
if (!dev) {
  const api = new URL('dist-api/', root);
  await rm(api, { recursive: true, force: true });
  const { TOPICS } = await import('../src/js/topics/index.js');
  await build({
    absWorkingDir: fileURLToPath(root),
    entryPoints: ['api/index.js'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    external: ['@azure/functions'],
    outfile: 'dist-api/index.js',
    define: { __SOORTEN__: JSON.stringify(TOPICS.flatMap((t) => t.skills.map((k) => k.id))) },
  });
  await copyFile(new URL('api/host.json', root), new URL('host.json', api));
  await writeFile(
    new URL('package.json', api),
    `${JSON.stringify({ name: 'wiskundefit-api', private: true, main: 'index.js', dependencies: { '@azure/functions': '^4.0.0' } }, null, 2)}\n`,
  );
}

// Op Windows kan een map even niet verplaatst worden, als de server net een bestand eruit leest.
// Bij de eerste build is er nog geen vorige build om weg te zetten.
async function move(from, to, missingOk = false) {
  for (let i = 0; ; i++) {
    try {
      return await rename(from, to);
    } catch (e) {
      if (e.code === 'ENOENT' && missingOk) return;
      if (i === 20 || !['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) throw e;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
}
const final = new URL(`${target}/`, root),
  old = new URL(`${target}-oud/`, root);
await rm(old, { recursive: true, force: true });
await move(final, old, true);
try {
  await move(dist, final);
} catch (e) {
  // Zet de vorige build terug, zodat npm run dev iets blijft tonen. De eerste fout is de echte.
  await move(old, final, true).catch((e2) =>
    console.warn(`De vorige build kon niet worden teruggezet: ${e2.message}`),
  );
  throw e;
}
// De nieuwe build staat er al. Lukt opruimen niet, dan gebeurt dat bij de volgende build.
await rm(old, { recursive: true, force: true, maxRetries: 5 }).catch((e) =>
  console.warn(`${target}-oud/ kon niet worden gewist: ${e.message}`),
);

const kB = (...list) =>
  Math.round(list.reduce((n, f) => n + Buffer.byteLength(files.get(`${out}${f}`)), 0) / 1024);
const most = Math.max(...[...topicCode.values()].map(([f]) => kB(f)));
console.log(
  `${target}/ gebouwd: ${PAGES.length} pagina's, code bij het eerste bezoek ${kB(...start)} kB, grootste onderwerp ${most} kB, CSS ${kB(asset(/\/styles-\w+\.css$/))} kB${dev ? ', niet kleiner gemaakt' : ''}`,
);
