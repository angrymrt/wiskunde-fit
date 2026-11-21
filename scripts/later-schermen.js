// Schermen die de browser pas laadt als ze nodig zijn, zodat de code bij het eerste bezoek klein
// blijft (#188). Net als bij de onderwerpen (scripts/catalogus.js) is er één bron: het scherm zelf.
// In Node (de build en de tests) is het scherm gewoon geladen. Deze plugin voor esbuild zet in de
// code voor de browser in plaats van het scherm een klein bestand met een import() van het echte
// bestand. Zo komt elk scherm in een eigen bestand.
//
// Een scherm in LATER exporteert behalve zijn functies ook `klaar()` en `laad()`. In Node zijn dat
// `() => true` en `() => Promise.resolve()`. De browser krijgt in de plaats daarvan de versies uit
// deze plugin: klaar() is waar zodra laad() het bestand heeft opgehaald. render() in main.js wacht
// daarop (zie laden.js).
import { basename, dirname, resolve } from 'node:path';

// De bestanden in src/js/ui/ en de namen die andere bestanden ervan gebruiken, behalve klaar en
// laad. Een naam die hier niet staat, bestaat in de browser niet voor wie het scherm importeert.
const LATER = {
  'vragen.js': ['vVragen'],
  'about.js': ['vOver', 'vPrivacy', 'vContact'],
  'exam.js': ['buildTest', 'toQuestion', 'finishTest', 'vToetsSetup', 'vToetsRun', 'vToetsRes'],
};

function laterSchermenPlugin() {
  return {
    name: 'later-schermen',
    setup(build) {
      const ui = resolve(build.initialOptions.absWorkingDir ?? process.cwd(), 'src/js/ui');
      build.onResolve({ filter: /\.js$/ }, (args) => {
        // Alleen de schermen zelf, en niet de import() in het bestand dat deze plugin maakt.
        if (args.namespace === 'later-schermen' || !args.path.startsWith('.')) return undefined;
        const file = resolve(args.resolveDir, args.path);
        if (dirname(file) !== ui || !(basename(file) in LATER)) return undefined;
        return { path: file, namespace: 'later-schermen' };
      });
      build.onLoad({ filter: /.*/, namespace: 'later-schermen' }, (args) => {
        const naam = basename(args.path);
        const aanroep = (f) => `export const ${f} = (...a) => m.${f}(...a);`;
        return {
          contents: [
            'let m = null;',
            `const laad = () => import('./${naam}').then((x) => { m = x; });`,
            'const klaar = () => m !== null;',
            'export { laad, klaar };',
            ...LATER[naam].map(aanroep),
          ].join('\n'),
          resolveDir: dirname(args.path),
          loader: 'js',
        };
      });
    },
  };
}

export { LATER, laterSchermenPlugin };
