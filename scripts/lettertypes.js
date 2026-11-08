// Maakt het lettertype voor de koppen en het logo uit het originele Bricolage Grotesque in
// src/fonts/. Alleen nodig als het ontwerp verandert. Start: npm run fonts
//
// Het origineel is variabel, met een gewicht van 200 tot 800 en een optische grootte, en is 75 kB.
// De site gebruikt het alleen voor koppen in gewicht 800. Met beide assen vast en alleen de tekens
// voor het Nederlands is het ongeveer 19 kB, klein genoeg om meteen te laden.
// Het logo wordt een vorm in SVG. Zo staat het altijd goed, ook als het lettertype nog niet binnen
// is. De CSS gebruikt het als masker en kleurt het met de tokens, zie .brand-logo in styles.css.
// De OFL-licentie staat dit toe: Bricolage Grotesque heeft geen gereserveerde naam.
import { readFile, writeFile } from 'node:fs/promises';
import * as fontkit from 'fontkit';
import subsetFont from 'subset-font';

const fonts = new URL('../src/fonts/', import.meta.url);
const source = await readFile(new URL('bricolage-grotesque.woff2', fonts));

// De optische grootte waarvoor de vormen zijn gemaakt, in pixels. De koppen zijn 17 tot 50 pixels.
const OPSZ = 32;
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
// Basic Latin, Latin-1 en de leestekens – — ‘ ’ “ ” … € − › ·.
const CHARS = String.fromCodePoint(
  ...range(0x20, 0x7e),
  ...range(0xa0, 0xff),
  ...[0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026, 0x20ac, 0x2212, 0x203a, 0x00b7],
);
const heading = await subsetFont(source, CHARS, {
  targetFormat: 'woff2',
  variationAxes: { wght: 800, opsz: OPSZ },
});
await writeFile(new URL('bricolage-grotesque-800.woff2', fonts), heading);

// Het logo, in de optische grootte van het logo zelf, met de kerning van het lettertype. fontkit
// kan geen variaties maken van een woff2, dus subset-font maakt eerst een vaste versie.
const logoFont = await subsetFont(source, 'Wiskundefit', {
  targetFormat: 'truetype',
  variationAxes: { wght: 800, opsz: 22 },
});
const font = fontkit.create(logoFont);
const run = font.layout('Wiskundefit');
const round = (n) => Math.round(n);
let x = 0,
  split = 0,
  d = '';
run.glyphs.forEach((glyph, i) => {
  const pos = run.positions[i];
  if (i === 'Wiskunde'.length) split = x;
  d += glyph.path
    .scale(1, -1)
    .translate(x + pos.xOffset, -pos.yOffset)
    .toSVG()
    .replace(/-?\d+\.\d+/g, (n) => String(round(+n)));
  x += pos.xAdvance;
});
const top = font.ascent,
  height = font.ascent - font.descent;
await writeFile(
  new URL('../src/logo.svg', import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 ${-top} ${round(x)} ${height}"><path d="${d}"/></svg>\n`,
);

const em = (n) => +(n / font.unitsPerEm).toFixed(3);
console.log(`src/fonts/bricolage-grotesque-800.woff2: ${(heading.length / 1024).toFixed(1)} kB`);
console.log(
  `src/logo.svg: zet in styles.css bij .brand-logo: width ${em(x)}em, height ${em(height)}em, ` +
    `en de overgang naar roze bij ${((split / x) * 100).toFixed(1)}%.`,
);
