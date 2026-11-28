// Schermen die de browser pas laadt als ze nodig zijn, zodat de code bij het eerste bezoek klein
// blijft (#188). Net als bij de onderwerpen (scripts/catalogus.js) is er één bron: het scherm zelf.
// In Node (de build en de tests) is het scherm gewoon geladen. Deze plugin voor esbuild zet in de
// code voor de browser in plaats van het scherm een klein bestand met een import() van het echte
// bestand. Zo komt elk scherm in een eigen bestand.
//
// Een scherm in LATER exporteert behalve zijn functies ook `klaar()` en `laad()`. In Node zijn dat
// `() => true` en `() => Promise.resolve()`. Een scherm dat nog gegevens moet ophalen, zoals Cijfers,
// doet dat in zijn eigen laad() en klaar(). De browser krijgt in de plaats daarvan de versies uit deze
// plugin: laad() haalt het bestand op en wacht dan ook op laad() van het scherm, en klaar() is waar
// zodra het bestand er is én het scherm zelf klaar() zegt. render() in main.js wacht daarop (zie
// laden.js).
import { basename, dirname, resolve } from 'node:path';

// De bestanden in src/js/ui/ en de namen die andere bestanden ervan gebruiken, behalve klaar en
// laad. Een naam die hier niet staat, bestaat in de browser niet voor wie het scherm importeert.
const LATER = {
  'vragen.js': ['vVragen'],
  'cijfers.js': ['vCijfers'],
  'about.js': ['vOver', 'vPrivacy', 'vContact'],
  'exam.js': ['buildTest', 'toQuestion', 'finishTest', 'vToetsSetup', 'vToetsRun', 'vToetsRes'],
  'interactief.js': ['widgetHTML', 'mountWidgets', 'showDrawn', 'tapGrid'],
  'topic.js': [
    'vTopic',
    'vPractice',
    'newQuestion',
    'applySoort',
    'readVals',
    'unreadable',
    'empty',
  ],
};

// Bestanden die geen eigen scherm zijn, maar die elk scherm met een onderwerp nodig heeft: de uitleg,
// het oefenen, Mijn stof oefenen en de proeftoets (metOnderwerp() in src/js/ui/laden.js). Dat zijn de
// schuifjes en het tekenen (interactief.js), en de schermen van een onderwerp met de invoervelden van
// een vraag (topic.js). Ze staan daarom niet in SCHERM_VAN. De build zet ze in de modulepreload van
// die pagina's.
const BIJ_ONDERWERP = ['interactief', 'topic'];

// Bij welk bestand de pagina van een scherm hoort (voor de modulepreload in scripts/build.js). De
// proeftoets en de uitslag delen er één. Het scherm staat ook in LATER in src/js/ui/laden.js;
// tests/later-schermen.test.js ziet erop toe dat de drie lijsten gelijk blijven.
const SCHERM_VAN = {
  vragen: 'vragen',
  cijfers: 'cijfers',
  over: 'about',
  privacy: 'about',
  contact: 'about',
  toets: 'exam',
  toetsres: 'exam',
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
            `const laad = () => import('./${naam}').then((x) => { m = x; return x.laad(); });`,
            'const klaar = () => m !== null && m.klaar();',
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

export { BIJ_ONDERWERP, LATER, SCHERM_VAN, laterSchermenPlugin };
