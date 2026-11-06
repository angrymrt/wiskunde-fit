// Maakt de PNG's in src/: het linkvoorbeeld en het icoon voor het beginscherm. Start: npm run images
// Draai dit alleen als het ontwerp of favicon.svg verandert. De PNG's staan in git, zodat de deploy geen browser nodig heeft.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const src = new URL('../src/', import.meta.url);
const font = async (name) => {
  const data = await readFile(new URL(`fonts/${name}.woff2`, src), 'base64');
  return `url('data:font/woff2;base64,${data}') format('woff2')`;
};
const icon = await readFile(new URL('favicon.svg', src), 'utf8');

// WhatsApp snijdt het voorbeeld soms tot een vierkant, dus de tekst staat in het midden.
const linkPreview = `<!doctype html><meta charset="utf-8"><style>
  @font-face { font-family: Figtree; font-weight: 400; src: ${await font('figtree-400')}; }
  @font-face { font-family: Bricolage; font-weight: 200 800; src: ${await font('bricolage-grotesque')}; }
  html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
  body {
    display: grid; place-content: center; justify-items: center; gap: 20px; text-align: center; color: #13233f;
    font-family: Figtree, sans-serif;
    background: #f3f7fb;
    background-image: linear-gradient(#d9e7f2 2px, transparent 2px), linear-gradient(90deg, #d9e7f2 2px, transparent 2px);
    background-size: 42px 42px;
  }
  .icon { width: 112px; height: 112px; }
  h1 { margin: 0; font: 800 92px/1 Bricolage, sans-serif; letter-spacing: -0.02em; }
  h1 span { color: #cf1f68; }
  p { margin: 0; font-size: 36px; line-height: 1.3; }
  .sub { max-width: 600px; color: #4f607f; font-size: 30px; text-wrap: balance; }
</style><div class="icon">${icon}</div><h1>Wiskunde<span>fit</span></h1><p>Op naar die voldoende!</p><p class="sub">Oefen met uitleg, hints en steeds nieuwe vragen.</p>`;

// De achtergrond vult de ronde hoeken, want iOS rondt het icoon zelf af.
const touchIcon = `<!doctype html><style>
  html, body { margin: 0; background: #13233f; } svg { display: block; width: 180px; height: 180px; }
</style>${icon}`;

const browser = await chromium.launch({
  channel: process.env.BROWSER || 'msedge',
  headless: true,
});
try {
  const shoot = async (html, width, height, name) => {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: fileURLToPath(new URL(name, src)) });
    await page.close();
    console.log(`src/${name} gemaakt`);
  };
  await shoot(linkPreview, 1200, 630, 'og.png');
  await shoot(touchIcon, 180, 180, 'apple-touch-icon.png');
} finally {
  await browser.close();
}
