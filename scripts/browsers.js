// De browsers die de site ondersteunt. De lijst staat als browserslist in package.json, zodat er één
// plek is. Hier wordt die omgezet naar de doelen van esbuild, voor scripts/build.js en
// tests/browsers.test.js. Zie ook AGENTS.md.
import { readFileSync } from 'node:fs';

const { browserslist } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const NAMES = {
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  safari: 'safari',
  ios_saf: 'ios',
};

// Bijvoorbeeld ['chrome87', 'edge88', 'firefox83', 'safari14.1', 'ios14.5'].
const TARGETS = browserslist.map((line) => {
  const m = /^(\w+) >= ([\d.]+)$/.exec(line);
  if (!m || !NAMES[m[1]]) throw new Error(`Onbekende regel in browserslist: ${line}`);
  return NAMES[m[1]] + m[2];
});

export { TARGETS };
