// Bepaalt welke browsertest een wijziging nodig heeft, en welke onderwerpen de lange test doorloopt.
//
//   node scripts/browsertest-selectie.js origin/main    zegt wat deze branch nodig heeft
//
// Gebruikt door de workflow Browsertest. Een wijziging aan alleen documentatie, tests zonder
// browser, gegevens of het ontwikkelproces raakt wat een leerling ziet niet: dan draait er niets.
// Raakt een wijziging alleen de stof van een of meer onderwerpen, dan draait de snelle set en de
// lange test alleen voor die onderwerpen. Raakt ze schermen, opmaak, figuren, antwoordcontrole of
// de build, dan draait alles. Lokaal kies je zelf met ONDERWERPEN= of METHODE= (zie
// tests/browser.e2e.js).
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Raakt niets wat een leerling ziet of wat de browsertest controleert.
const GENEGEERD = [
  /\.md$/,
  /^naslag\//,
  /^\.vscode\//,
  /^\.serena\//,
  /^\.claude\//,
  /^LICENSE/,
  /^\.github\/workflows\/(tellen|browsertest)\.yml$/,
  /^\.github\/(ISSUE_TEMPLATE|CODEOWNERS)/,
  /^tests\/(?!browser\.e2e\.js)/,
  /^scripts\/(tokens|vingerafdrukken|azure-)/,
  /^api\//,
  /^\.prettier/,
];
// De stof van één onderwerp: alleen dat onderwerp doorlopen.
const ONDERWERP = /^src\/js\/topics\/(?!index\.js$|shared\.js$)[^/]+\.js$/;
// Methode-indelingen: alleen schermen met paragrafen, de snelle set is genoeg.
const MAPPING = /^src\/js\/mappings\//;

// files: de gewijzigde bestanden. slugOf: geeft de slug van een onderwerpbestand.
function selectie(files, slugOf) {
  const relevant = files.filter((f) => !GENEGEERD.some((r) => r.test(f)));
  if (!relevant.length) return { soort: 'geen', onderwerpen: [] };
  const rest = relevant.filter((f) => !ONDERWERP.test(f) && !MAPPING.test(f));
  if (rest.length) return { soort: 'alles', onderwerpen: [] };
  const onderwerpen = relevant.filter((f) => ONDERWERP.test(f)).map(slugOf);
  return onderwerpen.length
    ? { soort: 'onderwerpen', onderwerpen: [...new Set(onderwerpen)] }
    : { soort: 'snel', onderwerpen: [] };
}

// De slug van een onderwerp staat in zijn eigen bestand, zoals slug: 'stelling-van-pythagoras'.
const slugUitBestand = (file) =>
  readFileSync(file, 'utf8').match(/^\s*slug:\s*'([^']+)'/m)?.[1] ??
  file.replace(/^.*\//, '').replace(/\.js$/, '');

// De onderwerpen van de vraagsoorten in een methode-indeling, eventueel van één hoofdstuk.
async function onderwerpenVan(methode, hoofdstuk) {
  const { MAPPING: MAPPINGS } = await import('../src/js/mappings/index.js');
  const { TOPICS } = await import('../src/js/topics/index.js');
  const m = MAPPINGS[methode] ?? Object.values(MAPPINGS).find((x) => x.slug === methode);
  if (!m) throw new Error(`Onbekende methode-indeling: ${methode}`);
  const chapters = m.chapters.filter((c) => !hoofdstuk || String(c.number) === String(hoofdstuk));
  if (!chapters.length) throw new Error(`${methode} heeft geen hoofdstuk ${hoofdstuk}`);
  const ids = new Set(chapters.flatMap((c) => c.paragraphs.flatMap((p) => p.skills)));
  return TOPICS.filter((t) => t.skills.some((s) => ids.has(s.id))).map((t) => t.slug);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = process.argv[2] ?? 'origin/main';
  const files = execFileSync('git', ['diff', '--name-only', '--diff-filter=d', `${base}...HEAD`], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean);
  const { soort, onderwerpen } = selectie(files, slugUitBestand);
  const regels = [`soort=${soort}`, `onderwerpen=${onderwerpen.join(',')}`];
  console.log(`${regels.join('\n')}\n(${files.length} gewijzigde bestanden)`);
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `${regels.join('\n')}\n`);
}

export { selectie, onderwerpenVan, slugUitBestand };
