// De catalogus: wat de browser bij het eerste bezoek van elk onderwerp weet. Dat is alleen wat de
// schermen zonder generatoren nodig hebben, zoals Home, Mijn stof, Cijfers, de methode-indelingen
// en de voortgang. De rest van een onderwerp, zoals de generatoren en de uitleg, laadt de browser
// pas als die nodig is (laadOnderwerpen in src/js/topics/index.js).
//
// Er is één bron: de onderwerpbestanden zelf. De build importeert ze in Node, en deze plugin voor
// esbuild zet in de code voor de browser in plaats van elk onderwerp een klein bestand met de
// catalogus en een import() van het echte bestand. Zo komt elk onderwerp in een eigen bestand.
// tests/catalogus.test.js bewaakt dat de browser na het laden hetzelfde heeft als Node.
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const INDEX = fileURLToPath(new URL('../src/js/topics/index.js', import.meta.url));

// De velden van een onderwerp in de catalogus, en per vraagsoort het nummer en de naam. De andere
// velden (VELDEN_LATER) komen pas met het onderwerp zelf. description en oldSlugs gebruikt alleen
// de build, voor de pagina's en de doorverwijzingen.
const VELDEN = ['slug', 'title', 'intro'];
const VELDEN_LATER = ['description', 'oldSlugs', 'videos', 'learn'];

// De catalogus van één onderwerp, uit het onderwerp zoals topics/index.js het maakt.
function catalogus(topic) {
  const out = {};
  for (const key of VELDEN) if (key in topic) out[key] = topic[key];
  out.skills = topic.skills.map((k) => [k.id, k.name]);
  return out;
}

function catalogusPlugin() {
  return {
    name: 'catalogus',
    setup(build) {
      // Alleen de onderwerpen die topics/index.js importeert, en niet de import() hieronder.
      build.onResolve({ filter: /^\.\/[^/]+\.js$/ }, (args) => {
        if (args.kind !== 'import-statement' || resolve(args.importer) !== INDEX) return undefined;
        const file = join(args.resolveDir, args.path);
        // Een pad zonder de map van wie bouwt, want dat komt in de metafile en in npm run dev.
        return { path: `topics/${basename(file)}`, namespace: 'catalogus', pluginData: { file } };
      });
      build.onLoad({ filter: /.*/, namespace: 'catalogus' }, async (args) => {
        // Eerst topics/index.js, die de onderwerpen aanvult met onder meer de vraagsoorten.
        await import(pathToFileURL(INDEX).href);
        const { file: path } = args.pluginData;
        const { default: topic } = await import(pathToFileURL(path).href);
        const file = JSON.stringify(`./${basename(path)}`);
        return {
          contents: `const t = ${JSON.stringify(catalogus(topic))};\nt.laad = () => import(${file});\nexport default t;\n`,
          resolveDir: dirname(path),
          loader: 'js',
        };
      });
    },
  };
}

export { VELDEN, VELDEN_LATER, catalogus, catalogusPlugin };
