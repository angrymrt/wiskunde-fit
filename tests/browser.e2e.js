// Klikt de gebouwde site door in een echte browser, op telefoonformaat. Start: npm run test:browser
// Gebruikt Edge; een andere browser kies je met de omgevingsvariabele BROWSER, bijvoorbeeld chrome of webkit.
// Standaard krijgt elke soort vraag 1 ronde; met de omgevingsvariabele ROUNDS kies je er meer.
// Schermafbeeldingen om zelf na te kijken komen in test-results/.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';
import { chromium, webkit } from 'playwright-core';
import { check } from '../scripts/controleer-site.js';
import { startServer } from '../scripts/server.js';
import { MAPPINGS } from '../src/js/mappings/index.js';
import { PAGES } from '../src/js/pages.js';
import { DOMAINS, TOPICS } from '../src/js/topics/index.js';

const server = await startServer(fileURLToPath(new URL('../dist', import.meta.url)), 0);
after(() => {
  server.closeAllConnections();
  server.close();
});
const siteUrl = `http://127.0.0.1:${server.address().port}/`;
const at = (address) => new URL(address, siteUrl).href;
const shotDir = fileURLToPath(new URL('../test-results/', import.meta.url));
const rounds = Number(process.env.ROUNDS) || 1;
// WebKit is de motor van Safari. Installeer die eenmalig met: npx playwright-core install webkit
const launch = () =>
  process.env.BROWSER === 'webkit'
    ? webkit.launch({ headless: true })
    : chromium.launch({ channel: process.env.BROWSER || 'msedge', headless: true });

// Geeft de juiste antwoorden van een vraag, getypt zoals een leerling dat zou doen.
const answerOf = `(q) => {
  const typed = (x) => {
    if (Number.isInteger(x)) return String(x);
    for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 24, 25, 40]) {
      const k = x * n;
      if (Math.abs(k - Math.round(k)) < 1e-7) return Math.round(k) + '/' + n;
    }
    return String(x).replace('.', ',');
  };
  return {
    mc: q.mc ? q.mc.a : null,
    vals: q.mc ? null : q.fields.map((f) => (f.sel ? f.a : typed(f.round ? Number(f.a.toFixed(f.round)) : f.a))),
  };
}`;

async function fill(page, prefix, vals, numericOverride) {
  for (let i = 0; i < vals.length; i++) {
    const el = await page.$(`#${prefix}f${i}`);
    const isSelect = (await el.evaluate((e) => e.tagName)) === 'SELECT';
    if (isSelect) await el.selectOption(vals[i]);
    else await el.fill(numericOverride ?? vals[i]);
  }
}

test('axe vindt geen toegankelijkheidsfouten', { timeout: 300_000 }, async () => {
  const browser = await launch();
  const found = new Map();
  const axePath = fileURLToPath(new URL('../node_modules/axe-core/axe.min.js', import.meta.url));
  try {
    for (const colorScheme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 800 },
        colorScheme,
        // Zonder animaties meet axe de contrasten pas als alles helemaal zichtbaar is.
        reducedMotion: 'reduce',
      });
      const p = await context.newPage();
      await p.goto(siteUrl);
      await p.addScriptTag({ path: axePath });
      const check = async (where) => {
        const { violations } = await p.evaluate(() =>
          axe.run(document, {
            runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
          }),
        );
        for (const v of violations) {
          // Per regel en element één keer, anders verdrinkt de rest in dezelfde melding per paragraaf.
          for (const node of v.nodes) {
            const key = `${v.id}: ${node.target} (${v.help})`;
            if (!found.has(key))
              found.set(key, `${key}, voor het eerst op ${where} in ${colorScheme}`);
          }
        }
      };
      await check('overzicht');
      const ids = await p.evaluate(() => wiskundefit.TOPICS.map((s) => s.slug));
      for (const id of ids) {
        await p.evaluate((i) => wiskundefit.go({ name: 'topic', slug: i }), id);
        for (const b of await p.$$('[data-act="exnext"]')) {
          while (await b.isVisible()) await b.click();
        }
        await check(`${id} uitleg`);
        await p.click('a.btn[href$="/oefenen"]');
        await p.click('[data-act="hint"]');
        await p.click('#pform button[type=submit]');
        await check(`${id} oefenen met hint en melding`);
        await p.click('[data-act="show"]');
        await check(`${id} uitwerking`);
      }
      await p.evaluate(() => wiskundefit.go({ name: 'kies' }));
      await check('kiezen uit je boek');
      for (const slug of [
        'formules-en-grafieken',
        'vergelijkingen-en-ongelijkheden',
        'meetkunde',
      ]) {
        await p.evaluate((s) => wiskundefit.go({ name: 'domain', slug: s }), slug);
        await check(`domein ${slug}`);
      }
      for (const id of await p.evaluate(() => wiskundefit.MAPPINGS.map((m) => m.id))) {
        await p.evaluate((i) => wiskundefit.go({ name: 'mapping', id: i }), id);
        await check(`methode-indeling ${id}`);
      }
      await p.evaluate(() => wiskundefit.go({ name: 'stof' }));
      await check('mijn stof zonder keuze');
      await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
      await check('proeftoets zonder stof');
      await p.click('[data-act="stofall"]');
      await check('proeftoets kiezen');
      await p.evaluate(() => wiskundefit.go({ name: 'stof' }));
      await check('mijn stof met keuze');
      await p.click('a[href="/mijn-stof/oefenen"]');
      await check('mijn stof oefenen');
      await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
      await p.click('[data-act="len"][data-id="10"]');
      await p.click('[data-act="start"]');
      await check('proeftoets');
      await p.click('[data-act="tstop1"]');
      await check('proeftoets stoppen');
      await p.click('[data-act="tstop0"]');
      await p.evaluate(() => wiskundefit.go({ name: 'home' }));
      await check('melding dat de proeftoets nog loopt');
      await p.evaluate(() => wiskundefit.go({ name: 'toetsres' }));
      await check('nog geen uitslag');
      await p.evaluate(() => wiskundefit.go({ name: 'missing', path: '/bestaat-niet' }));
      await check('adres dat niet bestaat');
      await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
      await p.click('[data-act="tfin"]');
      await check('proeftoets met waarschuwing');
      await p.click('[data-act="tfin"]');
      await check('resultaat proeftoets');
      await p.evaluate(() => wiskundefit.go({ name: 'home' }));
      await check('overzicht met de link naar de uitslag');
      for (const page of ['over', 'privacy', 'contact']) {
        await p.click(`.foot a[href="/${page}"]`);
        await check(`${page}-pagina`);
      }
      await context.close();
    }
    assert.deepEqual([...found.values()], []);
  } finally {
    await browser.close();
  }
});

test('de focus blijft op een logische plek', { timeout: 60_000 }, async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await p.goto(siteUrl);
    const focused = () =>
      p.evaluate(() => {
        const el = document.activeElement;
        return el.id || el.dataset.act || el.className || el.tagName;
      });

    // Een nieuw scherm: de focus gaat naar de kop.
    await p.click('a.par[href="/lineaire-grafieken-tekenen"]');
    assert.equal(await p.evaluate(() => document.activeElement.tagName), 'H1');

    // Van de uitleg naar het oefenscherm en terug: de focus gaat naar de kop.
    await p.click('a.btn[href$="/oefenen"]');
    assert.equal(await p.evaluate(() => document.activeElement.tagName), 'H1');
    assert.ok(await p.$('#pform'), 'het oefenscherm staat open');
    await p.click('.crumbs a[href="/lineaire-grafieken-tekenen"]');
    assert.equal(await p.evaluate(() => document.activeElement.tagName), 'H1');
    assert.equal(await p.$('#pform'), null, 'de uitleg staat open');
    await p.click('.sheet a[href$="/oefenen"]');

    // Een leeg antwoord: de focus gaat naar de melding.
    await p.click('.chip[data-id=""]');
    assert.equal(await p.getAttribute('.chip[data-id=""]', 'aria-pressed'), 'true');
    assert.equal(await focused(), 'filter');
    await p.click('#pform button[type=submit]');
    assert.equal(await focused(), 'pfb');

    // Een hint: de focus gaat naar de hint.
    await p.click('[data-act="hint"]');
    assert.equal(await focused(), 'hintb');

    // Uitwerking tonen en dan de volgende vraag: de focus gaat naar het eerste veld of de vraag.
    await p.click('[data-act="show"]');
    assert.equal(await focused(), 'sol');
    await p.click('#nextq');
    assert.match(await focused(), /^(pf0|pq)$/);

    // Proeftoets: bij een andere vraag gaat de focus naar die vraag.
    await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
    assert.equal(await p.evaluate(() => document.activeElement.tagName), 'H1');
    await p.click('[data-act="stofall"]');
    assert.equal(await p.evaluate(() => document.activeElement.tagName), 'H1');
    await p.click('[data-act="len"][data-id="10"]');
    assert.equal(await p.getAttribute('[data-act="len"][data-id="10"]', 'aria-pressed'), 'true');
    assert.equal(await focused(), 'len');
    await p.click('[data-act="start"]');
    assert.equal(await p.evaluate(() => document.activeElement.tagName), 'H1');
    await p.click('[data-act="goto"][data-id="4"]');
    assert.equal(await focused(), 'tq');
    await p.click('[data-act="tfin"]');
    assert.equal(await focused(), 'tfin');
  } finally {
    await browser.close();
  }
});

test(
  'over, privacy en contact staan in de voettekst, met een werkend mailadres',
  { timeout: 60_000 },
  async () => {
    const browser = await launch();
    try {
      await mkdir(shotDir, { recursive: true });
      const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
      await p.goto(siteUrl);
      const wide = () =>
        p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      for (const [page, heading] of [
        ['over', /Over Wiskundefit/],
        ['privacy', /Privacy/],
        ['contact', /Contact/],
      ]) {
        await p.click(`.foot a[href="/${page}"]`);
        assert.match(await p.textContent('h1'), heading);
        assert.equal(await p.evaluate(() => document.activeElement.tagName), 'H1');
        assert.equal(await wide(), false, `${page} is breder dan de telefoon`);
        await p.screenshot({ path: `${shotDir}${page}.png`, fullPage: true });
      }
      const mail = await p.getAttribute('main a[href^="mailto:"]', 'href');
      assert.match(mail, /^mailto:[^@\s]+@[^@\s]+\.nl$/);
      assert.ok(await p.$('a[href$="/wiskunde-fit/issues/new"]'), 'link om een fout te melden');
      // De voettekst noemt de versie uit package.json, met een link naar wat er nieuw is.
      const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url)));
      assert.match(
        await p.textContent('.foot'),
        new RegExp(`Versie ${version}, bijgewerkt op \\d`),
      );
      assert.ok(await p.$('.foot a[href$="/wiskunde-fit/releases"]'));
      assert.ok(await p.$('.foot a[href="https://github.com/angrymrt/wiskunde-fit"]'));
    } finally {
      await browser.close();
    }
  },
);

test('kruimelpad, menu en meldingen wijzen de weg', { timeout: 120_000 }, async () => {
  const browser = await launch();
  try {
    await mkdir(shotDir, { recursive: true });
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    const current = () =>
      p.$$eval('.topnav a[aria-current]', (a) =>
        a.map((x) => `${x.textContent} ${x.getAttribute('aria-current')}`),
      );
    const focused = () => p.evaluate(() => document.activeElement);
    await p.goto(siteUrl);
    assert.deepEqual(await current(), ['Home page']);

    // De link naar de inhoud slaat het menu over, zonder iets aan het adres te veranderen.
    await p.keyboard.press('Tab');
    assert.equal(await p.evaluate(() => document.activeElement.className), 'skip');
    await p.keyboard.press('Enter');
    assert.equal(await p.evaluate(() => document.activeElement.id), 'inhoud');
    assert.equal(new URL(p.url()).hash, '');

    // Oefenen: het kruimelpad gaat via het domein naar de uitleg.
    await p.goto(at('/gelijkvormige-driehoeken/oefenen'));
    assert.deepEqual(await current(), ['Home true']);
    assert.deepEqual(await p.$$eval('.crumbs a', (a) => a.map((x) => x.getAttribute('href'))), [
      '/',
      '/meetkunde',
      '/gelijkvormige-driehoeken',
    ]);
    assert.equal(await p.textContent('.crumbs [aria-current="page"]'), 'Oefenen');
    // Het domein heeft een eigen pagina met de onderwerpen en de paragrafen uit de boeken.
    await p.click('.crumbs a[href="/meetkunde"]');
    assert.equal(new URL(p.url()).pathname, '/meetkunde');
    assert.equal(await p.textContent('h1'), 'Meetkunde');
    assert.equal(await p.locator('main a.par').count(), 5);
    assert.ok(await p.$('main a[href="/methode-indeling/getal-en-ruimte-13-havo-3"]'));
    await p.screenshot({ path: `${shotDir}domein.png`, fullPage: true });

    // Een onderwerp wijst naar het vorige en volgende onderwerp in het domein.
    await p.goto(at('/gelijkvormige-driehoeken'));
    assert.deepEqual(await p.$$eval('.pager a', (a) => a.map((x) => x.getAttribute('href'))), [
      '/verhoudingstabellen',
      '/gelijkvormigheid-aantonen',
    ]);
    // Op een telefoon verschijnt de balk met Ga oefenen pas als de knop bovenaan uit beeld is.
    const away = () => p.$eval('.practice-bar', (b) => b.classList.contains('away'));
    assert.equal(await away(), true);
    await p.evaluate(() => scrollTo(0, 1500));
    await p.waitForFunction(() => !document.querySelector('.practice-bar.away'));
    await p.screenshot({ path: `${shotDir}uitleg-balk.png` });

    // Na het laatste onderwerp van een domein ga je terug naar de pagina van het domein.
    await p.goto(at('/lengtes-van-lijnstukken-berekenen'));
    assert.equal(
      await p.locator('.pager a[href="/meetkunde"]', { hasText: 'Alle onderwerpen' }).count(),
      1,
    );

    // Mijn stof: uit welk boek de stof komt, en een half gekozen onderwerp staat half aangevinkt.
    await p.goto(at('/methode-indeling/getal-en-ruimte-13-havo-3'));
    assert.deepEqual(await current(), ['Mijn stof true']);
    assert.equal(await p.locator('.chapter details').count(), 7, 'ingeklapte hoofdstukken');
    await p.click('[data-act="chapter"][data-id="1"]');
    await p.click('.stof-bar a');
    assert.deepEqual(await current(), ['Mijn stof page']);
    assert.match(
      await p.textContent('main'),
      /Uit je boek, Getal & Ruimte, 13e editie, havo 3: hoofdstuk 1\./,
    );
    const mixed = await p.$$eval('input[data-act="topicpick"]', (els) =>
      els.filter((e) => e.indeterminate).map((e) => e.dataset.id),
    );
    assert.deepEqual(mixed, ['rekenen-met-een-formule']);
    await p.screenshot({ path: `${shotDir}mijn-stof-boek.png`, fullPage: true });
    await p.goto(siteUrl);
    assert.equal(await p.locator('.domain .pill', { hasText: 'Mijn stof' }).count(), 7);

    // Een lopende proeftoets: de knoppen zeggen waar je verder gaat.
    await p.goto(at('/proeftoets'));
    assert.deepEqual(await current(), ['Proeftoets page']);
    await p.click('[data-act="len"][data-id="10"]');
    await p.click('[data-act="start"]');
    assert.equal(await p.getAttribute('.gn.cur', 'aria-current'), 'step');
    assert.equal(await p.getAttribute('.gn.cur', 'aria-label'), 'Vraag 1');
    await p.goto(siteUrl);
    assert.match(await p.textContent('.hero'), /Ga verder met je proeftoets/);
    await p.click('.notice a');

    // Stoppen zegt dat de proeftoets is gestopt, en de focus staat op die melding.
    await p.click('[data-act="tstop1"]');
    await p.click('[data-act="tstop2"]');
    assert.equal(await p.evaluate(() => document.activeElement.id), 'stopped');
    assert.match(await p.textContent('#stopped'), /gestopt/);
    await p.evaluate(() => localStorage.clear());
  } finally {
    await browser.close();
  }
});

test(
  'op een oude telefoon van 320 pixels is geen scherm te breed',
  { timeout: 120_000 },
  async () => {
    const browser = await launch();
    try {
      const p = await browser.newPage({ viewport: { width: 320, height: 568 } });
      const addresses = [
        '/',
        '/mijn-stof',
        '/proeftoets',
        '/methode-indeling',
        '/over',
        ...MAPPINGS.map((m) => `/methode-indeling/${m.slug}`),
        ...DOMAINS.map((d) => `/${d.slug}`),
        ...TOPICS.flatMap((t) => [`/${t.slug}`, `/${t.slug}/oefenen`]),
      ];
      const wide = [];
      for (const address of addresses) {
        await p.goto(at(address));
        await p.waitForSelector('h1');
        if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) {
          wide.push(address);
        }
      }
      assert.deepEqual(wide, []);
    } finally {
      await browser.close();
    }
  },
);

test('een lijn tekenen werkt met tikken en met typen', { timeout: 60_000 }, async () => {
  const browser = await launch();
  try {
    await mkdir(shotDir, { recursive: true });
    // Hoog genoeg voor het hele rooster: een muisklik buiten het scherm raakt niets.
    const p = await browser.newPage({ viewport: { width: 390, height: 1300 } });
    await p.goto(siteUrl);
    await p.evaluate(() =>
      wiskundefit.go({ name: 'topic', slug: 'lineaire-grafieken-tekenen', oefen: true }),
    );
    const id = await p.evaluate(
      () =>
        wiskundefit.TOPIC['lineaire-grafieken-tekenen'].skills.find(
          (k) => k.name === 'Een lijn tekenen',
        ).id,
    );
    await p.click(`.chip[data-id="${id}"]`);
    const q = () =>
      p.evaluate(() =>
        wiskundefit.state.prac['lineaire-grafieken-tekenen'].q.fields.map((f) => f.a),
      );
    const inputs = () => p.$$eval('#pform .fld input', (els) => els.map((e) => e.value));
    // Tikt op een punt van het rooster, ook als de figuur op het scherm is geschaald.
    const tap = async (x, y) => {
      const box = await (await p.$('svg[data-draw]')).boundingBox();
      const [x0, , , y1, u, ml, mt, w] = await p.$eval('svg[data-draw]', (s) => [
        ...s.dataset.draw.split(',').map(Number),
        s.viewBox.baseVal.width,
      ]);
      const k = box.width / w;
      await p.mouse.click(box.x + (ml + (x - x0) * u) * k, box.y + (mt + (y1 - y) * u) * k);
    };
    const [x1, y1, x2, y2] = await q();

    // Twee tikken vullen de velden en tekenen de lijn.
    await tap(x1, y1);
    assert.deepEqual(await inputs(), [String(x1), String(y1), '', '']);
    assert.equal(await p.$$eval('.drawn line', (l) => l.length), 0);
    assert.equal(await p.$$eval('.drawn circle', (c) => c.length), 1);
    await tap(x2, y2);
    assert.deepEqual(await inputs(), [String(x1), String(y1), String(x2), String(y2)]);
    assert.equal(await p.$$eval('.drawn line', (l) => l.length), 1);
    await p.screenshot({ path: `${shotDir}lijn-tekenen.png`, fullPage: true });

    // Een derde tik vervangt het oudste punt, en tikken op een gekozen punt haalt het weg.
    await tap(5, -6);
    assert.deepEqual((await inputs()).slice(0, 2), [String(x2), String(y2)]);
    await tap(5, -6);
    assert.deepEqual((await inputs()).slice(2), ['', '']);
    assert.equal(await p.$$eval('.drawn line', (l) => l.length), 0);

    // Na een hint staat de tekening er nog, want die volgt uit de velden.
    await tap(x1, y1);
    await p.click('[data-act="hint"]');
    assert.equal(await p.$$eval('.drawn line', (l) => l.length), 1);

    // Typen tekent ook, en een ander paar punten op de lijn is goed.
    await p.fill('#pf0', String(x1 + 2 * (x2 - x1)));
    await p.fill('#pf1', String(y1 + 2 * (y2 - y1)));
    await p.fill('#pf2', String(x1));
    await p.fill('#pf3', String(y1));
    await p.click('#pform button[type=submit]');
    assert.match(await p.textContent('.fb'), /Goed gedaan/);

    // Na het nakijken verandert een tik niets meer.
    const before = await inputs();
    await tap(0, 0);
    assert.deepEqual(await inputs(), before);
  } finally {
    await browser.close();
  }
});

test('oude voortgang blijft bewaard na de nieuwe indeling', { timeout: 60_000 }, async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await p.goto(siteUrl);
    await p.evaluate(() =>
      localStorage.setItem(
        'lijn-driehoek-v1',
        JSON.stringify({ skills: { '1.4#0': [1, 1], '1.5#1': [1] }, tests: [], scope: 'all' }),
      ),
    );
    await p.reload();
    const first = await p.evaluate(() => wiskundefit.TOPIC['lineaire-ongelijkheden'].skills[0].id);
    assert.deepEqual(await p.evaluate(() => wiskundefit.prog.skills), { [first]: [1, 1] });
    assert.equal(
      await p.evaluate(() => wiskundefit.TOPIC['lineaire-ongelijkheden'].title),
      'Lineaire ongelijkheden',
    );
    assert.equal(await p.evaluate(() => wiskundefit.prog.v), 5);
    assert.equal(await p.evaluate(() => wiskundefit.prog.stof), null);

    // Voortgang op de id's uit paragraaf en volgorde krijgt het vaste nummer.
    await p.evaluate(() =>
      localStorage.setItem(
        'lijn-driehoek-v1',
        JSON.stringify({ v: 2, skills: { '2.4#7': [1, 0, 1] }, tests: [], scope: 'h2' }),
      ),
    );
    await p.reload();
    const story = await p.evaluate(
      () => wiskundefit.TOPIC['lengtes-van-lijnstukken-berekenen'].skills[7].id,
    );
    assert.deepEqual(await p.evaluate(() => wiskundefit.prog.skills), { [story]: [1, 0, 1] });
    // Een oude keuze voor een hoofdstuk wordt een stofkeuze.
    const stof = await p.evaluate(() => wiskundefit.prog.stof);
    assert.equal(stof.length, 25);
    assert.ok(stof.includes(story));
    assert.equal(await p.evaluate(() => 'scope' in wiskundefit.prog), false);
    await p.evaluate(() => localStorage.clear());
  } finally {
    await browser.close();
  }
});

test('een leerling kiest stof uit het boek en oefent die', { timeout: 120_000 }, async () => {
  await mkdir(shotDir, { recursive: true });
  const browser = await launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await p.goto(siteUrl);
    const stof = () => p.evaluate(() => wiskundefit.prog.stof);
    const fits = async (where) =>
      assert.ok(
        await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${where} is breder dan de telefoon`,
      );

    // Kies uit je boek: alle boeken, en op een telefoon staan de filters achter een knop.
    await p.click('.hero a[href="/methode-indeling"]');
    const status = () => p.textContent('.found-count [role="status"]');
    const search = () => new URL(p.url()).search;
    assert.equal(await p.locator('.book').count(), 3);
    assert.ok(await p.isHidden('#filters'), 'de filters staan eerst dicht');
    await p.screenshot({ path: `${shotDir}kies-uit-je-boek.png`, fullPage: true });
    await p.click('[data-act="boekfilters"]');
    assert.equal(await p.getAttribute('[data-act="boekfilters"]', 'aria-expanded'), 'true');
    await p.click('[data-act="boekfilter"][data-id="niveau:vwo"]');
    assert.equal(await status(), '2 boeken passen bij je filters');
    assert.equal(search(), '?niveau=vwo');
    await p.click('[data-act="boekfilterclear"]');
    assert.equal(await status(), '3 boeken');
    assert.equal(search(), '');
    // Een boek voor havo 3: twee filters, en de focus blijft op het vinkje.
    await p.click('label:has([data-id="niveau:havo"])');
    await p.click('[data-act="boekfilter"][data-id="leerjaar:3"]');
    assert.equal(search(), '?niveau=havo&leerjaar=3');
    assert.equal(await p.evaluate(() => document.activeElement.dataset.id), 'leerjaar:3');
    assert.equal(await status(), '1 boek past bij je filters');
    assert.match(await p.textContent('[data-act="boekfilters"]'), /Filters \(2\)/);
    await fits('kiezen uit je boek');
    await p.screenshot({ path: `${shotDir}kies-uit-je-boek-filters.png`, fullPage: true });
    await p.click('[data-act="boekfiltersdone"]');
    assert.ok(await p.isHidden('#filters'));
    assert.equal(await p.evaluate(() => document.activeElement.getAttribute('role')), 'status');
    // De filters blijven bij herladen, en op een breed scherm staan ze altijd open.
    await p.reload();
    assert.equal(await p.locator('.book').count(), 1);
    await p.setViewportSize({ width: 1200, height: 800 });
    assert.ok(await p.isVisible('#filters'));
    assert.ok(await p.isHidden('[data-act="boekfilters"]'));
    await p.click('[data-act="boekfilterclear"]');
    await p.screenshot({ path: `${shotDir}kies-uit-je-boek-breed.png`, fullPage: true });
    await p.click('[data-act="boekfilter"][data-id="leerjaar:3"]');
    await p.setViewportSize({ width: 390, height: 800 });
    await p.click('.book a');

    // Een paragraaf aan- en uitvinken, en een heel hoofdstuk kiezen.
    assert.equal(await p.locator('.chapter').count(), 9);
    await p.click('[data-act="para"][data-id="1.4"]');
    assert.deepEqual(await stof(), [23, 24, 25]);
    assert.ok(await p.isChecked('[data-act="para"][data-id="1.4"]'));
    assert.equal(
      await p.evaluate(() => document.activeElement.dataset.id),
      '1.4',
      'de focus blijft op het vinkje',
    );
    await p.click('[data-act="para"][data-id="1.4"]');
    assert.equal(await stof(), null);
    await p.click('[data-act="chapter"][data-id="2"]');
    assert.equal((await stof()).length, 25);
    assert.ok(await p.isChecked('[data-act="para"][data-id="2.3"]'));
    await p.click('[data-act="para"][data-id="2.3"]');
    assert.equal((await stof()).length, 20);
    assert.equal(await p.isChecked('[data-act="chapter"][data-id="2"]'), false);
    await p.click('[data-act="para"][data-id="2.3"]');
    assert.equal(await p.locator('[data-act="chapter"][data-id="3"]').count(), 0);
    assert.match(await p.textContent('.chapter:nth-of-type(3)'), /nog niet oefenen/);
    await fits('methode-indeling');
    await p.screenshot({ path: `${shotDir}methode-indeling.png`, fullPage: true });

    // Mijn stof: oefenen en proeftoets gaan alleen over de gekozen stof.
    await p.click('.stof-bar a');
    assert.equal(await p.locator('.stof-list .par').count(), 4);
    await fits('mijn stof');
    await p.screenshot({ path: `${shotDir}mijn-stof.png`, fullPage: true });
    await p.click('a[href="/mijn-stof/oefenen"]');
    const chosen = await stof();
    for (let i = 0; i < 12; i++) {
      const id = await p.evaluate(() => wiskundefit.state.prac['mijn-stof'].skill.id);
      assert.ok(chosen.includes(id), `vraagsoort ${id} is niet gekozen`);
      await p.click('[data-act="show"]');
      await p.click('#nextq');
    }
    await p.reload();
    assert.deepEqual(await stof(), chosen, 'de stofkeuze blijft bewaard');
    assert.equal(new URL(p.url()).pathname, '/mijn-stof/oefenen', 'herladen blijft op dit scherm');
    await p.goto(siteUrl);
    assert.match(await p.textContent('.hero .btn.main'), /Verder met mijn stof/);
    await p.click('.hero a[href="/proeftoets"]');
    await p.click('[data-act="len"][data-id="10"]');
    await p.click('[data-act="start"]');
    const asked = await p.evaluate(() => wiskundefit.state.test.items.map((x) => x.skill.id));
    assert.ok(asked.every((id) => chosen.includes(id)));

    // Havo/vwo 2: alleen deels gedekt, met de melding dat het niet is vergeleken.
    await p.evaluate(() => wiskundefit.go({ name: 'stof' }));
    await p.click('[data-act="stofclear"]');
    // Mijn boek staat nu bovenaan de lijst.
    await p.evaluate(() => wiskundefit.go({ name: 'kies' }));
    assert.match(
      await p.textContent('.book:first-child h2'),
      /^Mijn boek: Getal & Ruimte, 13e editie, havo 3$/,
    );
    await p.screenshot({ path: `${shotDir}kies-uit-je-boek-je-boek.png`, fullPage: true });
    await p.click('[data-act="boekfilters"]');
    await p.click('[data-act="boekfilter"][data-id="niveau:vwo"]');
    await p.click('[data-act="boekfilter"][data-id="leerjaar:2"]');
    await p.click('.book a');
    assert.match(await p.textContent('.watch'), /nog niet met dit boek vergeleken/);
    await p.click('[data-act="para"][data-id="6.2"]');
    assert.deepEqual(await stof(), [38]);
    await p.click('.stof-bar a');
    assert.match(await p.textContent('.watch'), /Ook de uitleg is voor havo 3 geschreven/);
    assert.match(await p.textContent('.stof-gaps'), /6\.5/);
    await p.evaluate(() => localStorage.clear());
  } finally {
    await browser.close();
  }
});

test('de hele site werkt op telefoonformaat', { timeout: 600_000 }, async () => {
  await mkdir(shotDir, { recursive: true });
  const browser = await launch();
  const errors = [];
  const open = async (options) => {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error' && !/fonts\.g|ERR_/.test(m.text())) errors.push(m.text());
    });
    await page.goto(siteUrl);
    await page.waitForTimeout(400);
    return page;
  };

  try {
    const p = await open({ viewport: { width: 390, height: 800 } });
    const overflowing = new Set();
    const checkOverflow = async (where) => {
      const wide = await p.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      if (wide) overflowing.add(where);
    };
    const failures = [];
    let answered = 0;

    const ids = await p.evaluate(() => wiskundefit.TOPICS.map((s) => s.slug));
    for (const id of ids) {
      await p.evaluate(() => wiskundefit.go({ name: 'home' }));
      await checkOverflow('overzicht');
      await p.click(`a.par[href="/${id}"]`);
      await checkOverflow(`${id} uitleg`);
      for (const b of await p.$$('[data-act="exnext"]')) {
        while (await b.isVisible()) await b.click();
      }
      await checkOverflow(`${id} voorbeelden open`);
      if (/&(lt|gt|amp);/.test(await p.textContent('main'))) {
        failures.push(`${id}: dubbel omgezette tekens in de uitleg`);
      }
      for (const r of await p.$$('input[type=range]')) {
        await r.evaluate((el) => {
          el.value = el.max;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
      await checkOverflow(`${id} schuifjes op maximum`);
      // Elke video staat er één keer, en de link bovenaan gaat naar de video's.
      const videos = await p.evaluate((i) => {
        const v = wiskundefit.TOPIC[i].videos;
        return Object.values(v).flat().length;
      }, id);
      assert.equal(await p.locator('.vid-links a').count(), videos, `${id}: video's`);
      assert.ok(await p.$('a[href="#videos"]'), `${id}: link naar de video's`);
      assert.ok(await p.$('h2#videos'), `${id}: kop van de video's`);
      await p.click('a.btn[href$="/oefenen"]');

      const skills = await p.evaluate((i) => wiskundefit.TOPIC[i].skills.map((k) => k.id), id);
      for (const skill of skills) {
        for (let round = 0; round < rounds; round++) {
          await p.click(`.chip[data-id="${skill}"]`);
          await checkOverflow(`${skill} vraag`);
          const a = await p.evaluate(
            `(${answerOf})(wiskundefit.state.prac[${JSON.stringify(id)}].q)`,
          );

          // Eerst een fout antwoord: dat mag niet goed worden gerekend.
          if (a.mc !== null) await p.check(`#pm${a.mc === 0 ? 1 : 0}`);
          else await fill(p, 'p', a.vals, '999');
          await p.click('#pform button[type=submit]');
          if (/Goed gedaan/.test(await p.textContent('.fb'))) {
            failures.push(`${skill}: fout goedgekeurd`);
          }

          // Daarna het goede antwoord.
          if (a.mc !== null) await p.check(`#pm${a.mc}`);
          else await fill(p, 'p', a.vals);
          await p.click('#pform button[type=submit]');
          if (/Goed gedaan/.test(await p.textContent('.fb'))) answered++;
          else failures.push(`${skill}: goed antwoord afgekeurd (${JSON.stringify(a.vals)})`);

          await p.click('[data-act="showsol"]');
          await checkOverflow(`${skill} uitwerking`);
          await p.click('#nextq');
        }
      }
    }
    assert.deepEqual(failures, []);
    assert.ok(answered > 0);

    // Proeftoets met alles goed.
    await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
    await p.click('[data-act="stofall"]');
    await p.click('[data-act="len"][data-id="10"]');
    await p.click('[data-act="start"]');
    for (let i = 0; i < 10; i++) {
      const a = await p.evaluate(
        `(${answerOf})(wiskundefit.state.test.items[wiskundefit.state.test.i].q)`,
      );
      if (a.mc !== null) await p.check(`#tm${a.mc}`);
      else await fill(p, 't', a.vals);
      if (i < 9) await p.click('#tform button[type=submit]');
    }
    await p.click('[data-act="tfin"]');
    const full = await p.evaluate(() => [
      wiskundefit.state.result.score,
      wiskundefit.state.result.max,
    ]);
    assert.equal(full[0], full[1], 'proeftoets met alles goed');
    await checkOverflow('resultaat proeftoets');

    // Lege proeftoets: eerst een waarschuwing, daarna nul punten.
    await p.evaluate(() => wiskundefit.go({ name: 'stof' }));
    await p.click('[data-act="stofclear"]');
    await p.click('[data-act="topicpick"][data-id="stelling-van-pythagoras"]');
    await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
    await p.click('[data-act="len"][data-id="10"]');
    await p.click('[data-act="start"]');
    await p.click('[data-act="tfin"]');
    assert.match(await p.textContent('.fb'), /nog 10 vragen open/);
    await p.click('[data-act="tfin"]');
    const blank = await p.evaluate(() => ({
      score: wiskundefit.state.result.score,
      onlyChosen: wiskundefit.state.result.items.every(
        (x) => x.topic.slug === 'stelling-van-pythagoras',
      ),
    }));
    assert.deepEqual(blank, { score: 0, onlyChosen: true });

    // Voortgang blijft bewaard na herladen.
    await p.reload();
    await p.waitForTimeout(200);
    const kept = await p.evaluate(() => Object.keys(wiskundefit.prog.skills).length);
    const total = await p.evaluate(() => wiskundefit.TOPICS.flatMap((s) => s.skills).length);
    assert.equal(kept, total, 'voortgang na herladen');

    assert.deepEqual([...overflowing], [], 'schermen die breder zijn dan de telefoon');

    // Schermafbeeldingen om zelf na te kijken.
    const shot = (page, name, fullPage = false) =>
      page.screenshot({ path: `${shotDir}${name}.png`, fullPage });
    const light = await open({ viewport: { width: 1100, height: 860 }, colorScheme: 'light' });
    await shot(light, 'overzicht');
    await light.click('a.par[href="/lineaire-grafieken-tekenen"]');
    await shot(light, 'uitleg', true);
    const dark = await open({ viewport: { width: 1100, height: 860 }, colorScheme: 'dark' });
    await dark.click('a.par[href="/gelijkvormige-driehoeken"]');
    await dark.click('a.btn[href$="/oefenen"]');
    await dark.click('[data-act="show"]');
    await shot(dark, 'oefenen-donker', true);
    await shot(await open({ viewport: { width: 390, height: 800 } }), 'telefoon', true);

    assert.deepEqual(errors, [], 'fouten in de browserconsole');
  } finally {
    await browser.close();
  }
});

test('elk adres opent rechtstreeks het juiste scherm, ook na herladen', async () => {
  const browser = await launch();
  const errors = [];
  try {
    await mkdir(shotDir, { recursive: true });
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    p.on('pageerror', (e) => errors.push(e.message));
    const pages = [
      ['/', /Op naar die voldoende/, /^Wiskundefit: oefenen/],
      ['/methode-indeling', /Kies uit je boek/, /^Kies uit je boek \|/],
      ['/mijn-stof', /Mijn stof/, /^Mijn stof \|/],
      ['/proeftoets', /Proeftoets/, /^Proeftoets \|/],
      ['/proeftoets/uitslag', /Je resultaat/, /^Resultaat proeftoets \|/],
      ['/over', /Over Wiskundefit/, /^Over Wiskundefit$/],
      ['/privacy', /Privacy/, /^Privacy \|/],
      ['/contact', /Contact/, /^Contact \|/],
      ...DOMAINS.map((d) => [`/${d.slug}`, new RegExp(d.name), new RegExp(`^${d.name} \\|`)]),
      ...MAPPINGS.map((m) => [
        `/methode-indeling/${m.slug}`,
        new RegExp(`${m.level} ${m.year}`),
        new RegExp(`${m.level} ${m.year} \\|`),
      ]),
      ...TOPICS.flatMap((t) => [
        [`/${t.slug}`, new RegExp(t.title), new RegExp(`^${t.title} \\|`)],
        [`/${t.slug}/oefenen`, new RegExp(`${t.title} oefenen`), new RegExp(`^${t.title} oefenen`)],
      ]),
    ];
    for (const [address, heading, title] of pages) {
      await p.goto(at(address));
      for (let i = 0; i < 2; i++) {
        assert.match(await p.textContent('h1'), heading, address);
        assert.match(await p.title(), title, address);
        assert.equal(new URL(p.url()).pathname, address);
        await p.reload();
      }
    }

    // Een streep aan het eind en onbekende parameters verdwijnen uit het adres.
    await p.goto(at('/over/?x=1'));
    assert.equal(new URL(p.url()).pathname + new URL(p.url()).search, '/over');

    // Een adres dat niet bestaat zegt dat, en het adres blijft staan zodat je de fout kunt zien.
    await p.goto(at('/bestaat-niet'));
    assert.match(await p.textContent('h1'), /bestaat niet/);
    assert.equal(new URL(p.url()).pathname, '/bestaat-niet');
    await p.screenshot({ path: `${shotDir}adres-bestaat-niet.png` });
    await p.click('main a[href="/"]');
    assert.match(await p.textContent('h1'), /Op naar die voldoende/);

    // Een plek op het overzicht is direct te openen.
    await p.goto(at('/#meetkunde'));
    assert.ok(await p.evaluate(() => scrollY > 0), 'scrolt naar het domein');

    // Azure krijgt de regels uit de repository, met de doorverwijzingen uit de gegevens erachter.
    const config = async (path) =>
      JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
    const built = await config('../dist/staticwebapp.config.json');
    const source = await config('../staticwebapp.config.json');
    assert.deepEqual(built.routes.slice(0, source.routes.length), source.routes);
    assert.deepEqual({ ...built, routes: [] }, { ...source, routes: [] });

    // Dezelfde controle als na elke deploy: elke pagina, de 404, de doorverwijzingen en de cache.
    assert.deepEqual(await check(siteUrl), []);
    assert.match((await fetch(at('/og.png'))).headers.get('content-type'), /image\/png/);
    assert.deepEqual(errors, []);

    // Een adres met hoofdletters gaat naar hetzelfde adres in kleine letters.
    await p.goto(at('/Snijpunten-van-Lijnen'));
    assert.equal(new URL(p.url()).pathname, '/snijpunten-van-lijnen');
    assert.match(await p.textContent('h1'), /Snijpunten van lijnen/);
  } finally {
    await browser.close();
  }
});

// De pagina's die de build vooraf maakt, met de tekst er al in. Zie src/js/pages.js.
const PREBUILT = [
  '/',
  '/meetkunde',
  ...TOPICS.map((t) => `/${t.slug}`),
  '/methode-indeling',
  ...MAPPINGS.map((m) => `/methode-indeling/${m.slug}`),
  '/over',
  '/privacy',
  '/contact',
];

test('JavaScript neemt een vooraf gebouwde pagina over zonder iets te vervangen', async () => {
  const browser = await launch();
  try {
    for (const progress of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
      const p = await context.newPage();
      if (progress) {
        // Een leerling die al heeft geoefend: dan verandert de voortgang wel.
        await p.goto(at('/over'));
        await p.evaluate(
          (ids) => {
            const skills = Object.fromEntries(ids.map((id) => [id, [1, 1, 0]]));
            localStorage.setItem('lijn-driehoek-v1', JSON.stringify({ v: 5, skills, stof: ids }));
          },
          TOPICS[1].skills.map((k) => k.id),
        );
      }
      for (const address of ['/', '/lineaire-grafieken-tekenen', '/meetkunde', '/bestaat-niet']) {
        // Houd de code tegen tot de leerling al aan het lezen is.
        let release;
        const gate = new Promise((resolve) => (release = resolve));
        await p.route('**/assets/main-*.js', async (route) => {
          await gate;
          await route.continue();
        });
        // DOMContentLoaded wacht op de code, dus wacht hier alleen tot de voettekst er staat.
        await p.goto(at(address), { waitUntil: 'commit' });
        await p.waitForSelector('.foot');
        const where = `${address}${progress ? ' met voortgang' : ''}`;
        assert.equal(await p.evaluate(() => window.wiskundefit), undefined, where);
        await p.keyboard.press('Tab');
        await p.keyboard.press('Tab');
        await p.evaluate(() => {
          scrollTo(0, 200);
          window.voor = {
            focus: document.activeElement,
            y: scrollY,
            h1: document.querySelector('h1'),
          };
          window.vervangen = [];
          new MutationObserver((list) =>
            list.forEach((m) => {
              // De balk met Ga oefenen schakelt main.js zelf aan en uit.
              if (m.type === 'attributes' && m.target.matches('.practice-bar')) return;
              window.vervangen.push(m.type);
            }),
          ).observe(document.getElementById('app'), {
            subtree: true,
            childList: true,
            attributes: true,
            characterData: true,
          });
        });
        release();
        await p.waitForFunction(() => window.wiskundefit);
        await p.waitForTimeout(100);
        const after = await p.evaluate(() => ({
          focus: document.activeElement === voor.focus && voor.focus !== document.body,
          y: scrollY === voor.y,
          h1: document.querySelector('h1') === voor.h1,
          vervangen: vervangen.length,
        }));
        assert.ok(after.focus, `${where}: de focus blijft op hetzelfde element`);
        assert.ok(after.y, `${where}: de pagina scrolt niet`);
        assert.ok(after.h1, `${where}: de kop blijft hetzelfde element`);
        if (!progress) assert.equal(after.vervangen, 0, `${where}: niets veranderd`);
        await p.unroute('**/assets/main-*.js');
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
});

test('elke vooraf gebouwde pagina is zonder JavaScript te lezen', async () => {
  const browser = await launch();
  try {
    await mkdir(shotDir, { recursive: true });
    const p = await browser.newPage({
      viewport: { width: 390, height: 800 },
      javaScriptEnabled: false,
    });
    for (const address of PREBUILT) {
      await p.goto(at(address));
      assert.ok((await p.textContent('h1')).trim(), `${address}: kop`);
      assert.ok((await p.textContent('main')).length > 200, `${address}: tekst`);
      // Een knop doet zonder JavaScript niets, dus die is er niet.
      const buttons = await p.$$eval('main button, main input', (els) =>
        els.filter((e) => e.checkVisibility()).map((e) => e.outerHTML.slice(0, 80)),
      );
      assert.deepEqual(buttons, [], `${address}: zichtbare knoppen`);
      const hidden = await p.$$eval('.steps li', (els) => els.filter((e) => !e.checkVisibility()));
      assert.equal(hidden.length, 0, `${address}: alle stappen van een voorbeeld zijn zichtbaar`);
      assert.equal(
        await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
        `${address}: breder dan de telefoon`,
      );
    }
    await p.goto(at('/lineaire-grafieken-tekenen'));
    await p.screenshot({ path: `${shotDir}zonder-javascript-uitleg.png`, fullPage: true });
    await p.goto(at('/methode-indeling/getal-en-ruimte-13-havo-3'));
    await p.screenshot({ path: `${shotDir}zonder-javascript-boek.png`, fullPage: true });
    // Een schil zegt dat oefenen JavaScript nodig heeft.
    await p.goto(at(`/${TOPICS[0].slug}/oefenen`));
    assert.match(await p.textContent('main'), /werken alleen met JavaScript/);
  } finally {
    await browser.close();
  }
});

test('de terugknop gaat naar het vorige scherm en bewaart een half gemaakte vraag', async () => {
  const browser = await launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const p = await context.newPage();
    const path = () => new URL(p.url()).pathname + new URL(p.url()).search;
    await p.goto(siteUrl);
    const slug = 'lineaire-grafieken-tekenen';
    const id = TOPICS.find((t) => t.slug === slug).skills.find(
      (k) => k.name === 'Een lijn tekenen',
    ).id;

    await p.click(`a.par[href="/${slug}"]`);
    assert.equal(path(), `/${slug}`);
    await p.click('a.btn[href$="/oefenen"]');
    assert.equal(path(), `/${slug}/oefenen`);
    await p.click(`.chip[data-id="${id}"]`);
    assert.equal(path(), `/${slug}/oefenen?soort=${id}`);
    const question = await p.textContent('#pq');
    await p.fill('#pf0', '7');

    // Terug en weer vooruit: dezelfde vraag, met wat je had ingevuld.
    await p.goBack();
    assert.equal(path(), `/${slug}`);
    assert.equal(await p.evaluate(() => document.activeElement.tagName), 'H1');
    assert.equal(await p.$('#pform'), null);
    await p.goForward();
    assert.equal(path(), `/${slug}/oefenen?soort=${id}`);
    assert.equal(await p.textContent('#pq'), question);
    assert.equal(await p.inputValue('#pf0'), '7');
    assert.equal(await p.getAttribute(`.chip[data-id="${id}"]`, 'aria-pressed'), 'true');

    // Via een link terug naar de uitleg en weer oefenen: ook dan blijft de vraag staan.
    await p.click('.crumbs a[href$="' + slug + '"]');
    await p.click('.sheet a[href$="/oefenen"]');
    assert.equal(await p.textContent('#pq'), question);
    assert.equal(await p.inputValue('#pf0'), '7');

    // Terug helemaal naar het overzicht, op dezelfde hoogte als waar je klikte.
    await p.goto(siteUrl);
    const last = p.locator(`a.par[href="/${TOPICS.at(-1).slug}"]`);
    await last.scrollIntoViewIfNeeded();
    const y = await p.evaluate(() => scrollY);
    assert.ok(y > 0, 'de lijst is langer dan het scherm');
    await last.click();
    assert.equal(await p.evaluate(() => scrollY), 0, 'een nieuw scherm begint bovenaan');
    await p.goBack();
    assert.equal(path(), '/');
    assert.ok(Math.abs((await p.evaluate(() => scrollY)) - y) <= 2, 'terug op dezelfde hoogte');

    // De link naar de video's is hetzelfde scherm: niets wordt opnieuw opgebouwd.
    await p.goto(at(`/${slug}`));
    await p.evaluate(() => (window.scherm = document.querySelector('main')));
    const same = () => p.evaluate(() => window.scherm === document.querySelector('main'));
    await p.click('a[href="#videos"]');
    assert.equal(new URL(p.url()).hash, '#videos');
    assert.ok(await p.evaluate(() => scrollY > 0));
    assert.ok(await same());
    await p.goBack();
    assert.equal(new URL(p.url()).hash, '');
    assert.equal(await p.evaluate(() => scrollY), 0);
    assert.ok(await same());

    // Een gewone link: openen in een nieuw tabblad werkt, en dit scherm blijft staan.
    await p.goto(siteUrl);
    const [tab] = await Promise.all([
      context.waitForEvent('page'),
      p.click(`a.par[href="/${slug}"]`, { modifiers: ['Control'] }),
    ]);
    await tab.waitForSelector('h1');
    assert.match(await tab.textContent('h1'), /Lineaire grafieken tekenen/);
    assert.equal(path(), '/');
  } finally {
    await browser.close();
  }
});

test('soort in het adres kiest de vraagsoort', async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    const { slug, skills } = TOPICS[0];
    const [one, two] = skills;
    const skill = () => p.evaluate((s) => wiskundefit.state.prac[s].skill.id, slug);
    const search = () => new URL(p.url()).search;
    await p.goto(at(`/${slug}/oefenen?soort=${two.id}`));
    assert.equal(await skill(), two.id);
    assert.equal(await p.getAttribute(`.chip[data-id="${two.id}"]`, 'aria-pressed'), 'true');
    await p.reload();
    assert.equal(await skill(), two.id, 'ook na herladen');

    // Een andere keuze past het adres aan, maar is geen extra stap voor de terugknop.
    const steps = await p.evaluate(() => history.length);
    await p.click(`.chip[data-id="${one.id}"]`);
    assert.equal(search(), `?soort=${one.id}`);
    assert.equal(await skill(), one.id);
    await p.click('.chip[data-id=""]');
    assert.equal(search(), '');
    assert.equal(await p.evaluate(() => history.length), steps);

    // Met een seed opent precies dezelfde vraag, ook in een ander tabblad. Bij de volgende vraag
    // verdwijnt de seed uit het adres.
    const question = () => p.textContent('#pq');
    const link = `/${slug}/oefenen?soort=${two.id}&seed=k3x9q`;
    await p.goto(at(link));
    const asked = await question();
    assert.equal(await p.evaluate((s) => wiskundefit.state.prac[s].q.seed, slug), 33775406);
    const other = await browser.newPage();
    await other.goto(at(link));
    assert.equal(await other.textContent('#pq'), asked, 'een ander tabblad krijgt dezelfde vraag');
    await other.close();
    await p.reload();
    assert.equal(await question(), asked, 'ook na herladen');

    // Deel op een computer: de link staat op het klembord, en wat je typte blijft staan.
    const webkitBrowser = process.env.BROWSER === 'webkit';
    if (!webkitBrowser) await p.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const typed = await p.$('input#pf0');
    if (typed) await typed.fill('12');
    await p.click('[data-act="share"]');
    await p.waitForSelector('.share-note:not(:empty)', { state: 'attached' });
    if (!webkitBrowser) {
      assert.equal(await p.textContent('.share-note.sr'), 'Link gekopieerd.');
      assert.equal(await p.textContent('[data-act="share"]'), 'Gekopieerd');
      assert.equal(
        await p.evaluate(() => document.activeElement.dataset.act),
        'share',
        'de focus blijft op de knop',
      );
      assert.equal(await p.evaluate(() => navigator.clipboard.readText()), at(link));
    }
    if (typed) assert.equal(await p.inputValue('input#pf0'), '12', 'wat je typte blijft staan');
    assert.match(await p.getAttribute('[data-act="share"]', 'data-id'), /seed=k3x9q$/);

    // Op een telefoon opent het deelmenu van het toestel.
    const phone = await browser.newContext({ isMobile: true, hasTouch: true });
    await phone.addInitScript(() => {
      navigator.share = (data) => {
        window.__shared = data;
        return Promise.resolve();
      };
    });
    const tp = await phone.newPage();
    await tp.goto(at(link));
    await tp.tap('[data-act="share"]');
    assert.deepEqual(await tp.evaluate(() => window.__shared), {
      text: 'Kun je me helpen met deze vraag?',
      url: at(link),
    });
    await phone.close();

    await p.click('[data-act="show"]');
    await p.click('#nextq');
    assert.equal(search(), `?soort=${two.id}`);
    assert.notEqual(await question(), asked);

    // Een vraagsoort van een ander onderwerp of een onzinnummer verdwijnt uit het adres.
    for (const bad of [TOPICS[1].skills[0].id, 99999, 'abc']) {
      await p.goto(at(`/${slug}/oefenen?soort=${bad}`));
      assert.equal(search(), '', `soort=${bad}`);
      assert.ok(await p.$('#pform'));
    }
  } finally {
    await browser.close();
  }
});

test('zonder stofkeuze gaat mijn stof oefenen naar het kiezen van stof', async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await p.goto(at('/mijn-stof/oefenen'));
    assert.equal(new URL(p.url()).pathname, '/mijn-stof');
    assert.match(await p.textContent('h1'), /Mijn stof/);

    // Met een stofkeuze werkt het adres wel, en een half gemaakte vraag overleeft de terugknop.
    await p.click('[data-act="stofall"]');
    await p.click('a[href="/mijn-stof/oefenen"]');
    assert.ok(await p.$('#pform'));
    const question = await p.textContent('#pq');
    await p.goBack();
    await p.click('a[href="/mijn-stof/oefenen"]');
    assert.equal(await p.textContent('#pq'), question);

    // Is de vraag geen gekozen stof meer, dan komt er een nieuwe.
    await p.goBack();
    await p.click('[data-act="stofclear"]');
    await p.click('[data-act="topicpick"][data-id="stelling-van-pythagoras"]');
    await p.click('a[href="/mijn-stof/oefenen"]');
    const id = await p.evaluate(() => wiskundefit.state.prac['mijn-stof'].skill.id);
    const chosen = TOPICS.find((t) => t.slug === 'stelling-van-pythagoras').skills;
    assert.ok(chosen.some((k) => k.id === id));
    await p.reload();
    assert.ok(await p.$('#pform'), 'de stofkeuze blijft bewaard');
  } finally {
    await browser.close();
  }
});

test('een methode-indeling openen maakt die nog niet tot je boek', async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    const mapping = () => p.evaluate(() => wiskundefit.prog.mapping);
    await p.goto(at('/methode-indeling/getal-en-ruimte-13-havo-3'));
    assert.equal(await mapping(), null);
    assert.equal(await p.locator('.chapter').count(), 9);
    await p.click('[data-act="para"][data-id="1.4"]');
    assert.equal(await mapping(), 'gr13-havo3');

    // Een link naar een ander boek verandert dat niet, totdat je daar iets aanvinkt.
    await p.goto(at('/methode-indeling/getal-en-ruimte-13-havo-vwo-2'));
    assert.equal(await mapping(), 'gr13-havo3');
    await p.goto(siteUrl);
    await p.click('a[href="/mijn-stof"].btn.main');
    assert.ok(await p.$('a.btn[href="/methode-indeling/getal-en-ruimte-13-havo-3"]'));
    await p.goto(at('/methode-indeling/getal-en-ruimte-13-havo-vwo-2'));
    await p.click('[data-act="para"][data-id="6.2"]');
    assert.equal(await mapping(), 'gr13-hv2');
  } finally {
    await browser.close();
  }
});

test('de knop wisselt tussen licht en donker en volgt anders het apparaat', async () => {
  const browser = await launch();
  try {
    const DARK = 'rgb(13, 22, 38)';
    const look = (p) =>
      p.evaluate(() => ({
        theme: document.documentElement.dataset.theme ?? null,
        stored: localStorage.getItem('wiskundefit-thema'),
        pressed: document.querySelector('[data-act="thema"]').getAttribute('aria-pressed'),
        background: getComputedStyle(document.body).backgroundColor,
        icon: document.querySelector('.theme .moon').offsetParent ? 'maan' : 'zon',
      }));

    // Een licht apparaat: de knop maakt het donker, en dat blijft na herladen.
    const light = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const p = await light.newPage();
    await p.goto(at('/stelling-van-pythagoras/oefenen?soort=38'));
    let now = await look(p);
    assert.deepEqual([now.theme, now.stored, now.pressed, now.icon], [null, null, 'false', 'maan']);
    // Op een telefoon staat de knop naast het logo, boven het menu.
    const logo = await p.locator('.brand').boundingBox();
    const toggle = await p.locator('.theme').boundingBox();
    const menu = await p.locator('.topnav').boundingBox();
    assert.ok(toggle.y < menu.y && toggle.x > logo.x + logo.width, 'rechts van het logo');
    await p.fill('#pf0', '12');
    await p.click('[data-act="thema"]');
    now = await look(p);
    assert.deepEqual(
      [now.theme, now.stored, now.pressed, now.icon],
      ['dark', 'dark', 'true', 'zon'],
    );
    assert.equal(now.background, DARK);
    assert.equal(await p.inputValue('#pf0'), '12', 'wat je had ingevuld, blijft staan');
    await p.reload();
    now = await look(p);
    assert.deepEqual([now.theme, now.pressed, now.background], ['dark', 'true', DARK]);

    // Terug naar hetzelfde als het apparaat: de site vergeet de keuze.
    await p.click('[data-act="thema"]');
    now = await look(p);
    assert.deepEqual([now.theme, now.stored, now.pressed], [null, null, 'false']);

    // Zonder keuze volgt de knop het apparaat als dat wisselt.
    await p.emulateMedia({ colorScheme: 'dark' });
    await p.waitForFunction(
      () => document.querySelector('[data-act="thema"]').getAttribute('aria-pressed') === 'true',
    );
    now = await look(p);
    assert.deepEqual([now.theme, now.stored, now.background], [null, null, DARK]);
    await light.close();

    // Een donker apparaat: licht wordt bewaard, en terug naar donker wist de keuze weer.
    const dark = await browser.newContext({
      viewport: { width: 1100, height: 800 },
      colorScheme: 'dark',
    });
    const d = await dark.newPage();
    await d.goto(siteUrl);
    assert.equal((await look(d)).pressed, 'true');
    await d.click('[data-act="thema"]');
    now = await look(d);
    assert.deepEqual([now.theme, now.stored, now.pressed], ['light', 'light', 'false']);
    assert.notEqual(now.background, DARK);
    await d.click('[data-act="thema"]');
    now = await look(d);
    assert.deepEqual([now.theme, now.stored, now.pressed], [null, null, 'true']);

    // Op een breed scherm staat de knop rechts naast het menu.
    const nav = await d.locator('.topnav').boundingBox();
    const button = await d.locator('.theme').boundingBox();
    assert.ok(button.x > nav.x + nav.width, 'rechts van het menu');
    await dark.close();
  } finally {
    await browser.close();
  }
});

test('de site telt pogingen, valkuilen en proeftoetsen zonder iets over de leerling', async () => {
  const browser = await launch();
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const p = await context.newPage();
    let requests = 0;
    await context.route('**/api/tel', (route) => {
      requests++;
      return route.fulfill({ status: 204 });
    });
    const sent = () => p.evaluate(() => wiskundefit.sent.map((x) => ({ ...x })));
    const slug = 'stelling-van-pythagoras';
    await p.goto(at(`/${slug}/oefenen?soort=38&seed=k3x9q`));

    // Hint, even nadenken, en dan BC² in plaats van BC: een fout met een valkuil.
    await p.click('[data-act="hint"]');
    await p.waitForTimeout(1200);
    const square = await p.evaluate((s) => {
      const c = wiskundefit.state.prac[s].q.fields[0].a;
      return (Math.round(c * c * 100) / 100).toString().replace('.', ',');
    }, slug);
    await p.fill('#pf0', square);
    await p.click('#pform [type="submit"]');
    let tellen = await sent();
    assert.equal(tellen.length, 2);
    const [poging, valkuil] = tellen;
    assert.deepEqual(
      { ...poging, duur: undefined },
      { tel: 'poging', soort: 38, uitkomst: 'fout', duur: undefined, hint: true },
    );
    assert.ok(poging.duur >= 1 && poging.duur <= 5, `duur ${poging.duur}`);
    assert.deepEqual(valkuil, { tel: 'valkuil', soort: 38, valkuil: 'wortel-vergeten' });

    // Dezelfde fout nog eens, en daarna goed: geen nieuwe tellen.
    await p.click('#pform [type="submit"]');
    const right = await p.evaluate((s) => wiskundefit.state.prac[s].q.fields[0].a, slug);
    await p.fill('#pf0', (Math.round(right * 100) / 100).toString().replace('.', ','));
    await p.click('#pform [type="submit"]');
    assert.equal((await sent()).length, 2);

    // De klok staat stil zolang de pagina uit beeld is.
    await p.click('#nextq');
    const visible = (hidden) =>
      p.evaluate((h) => {
        Object.defineProperty(document, 'hidden', { value: h, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);
    await visible(true);
    await p.waitForTimeout(2200);
    await visible(false);
    await p.click('[data-act="show"]');
    tellen = await sent();
    assert.equal(tellen.length, 3);
    assert.equal(tellen[2].uitkomst, 'uitwerking');
    assert.equal(tellen[2].hint, false);
    assert.ok(tellen[2].duur <= 1, `de klok liep door: ${tellen[2].duur}`);

    // Een ingeleverde proeftoets telt zichzelf en elke vraag, ook de lege. Na goto is de lijst met
    // verstuurde tellen weer leeg.
    await p.goto(at('/proeftoets'));
    await p.click('[data-act="stofall"]');
    await p.click('[data-act="len"][data-id="10"]');
    await p.click('[data-act="start"]');
    await p.click('[data-act="tfin"]');
    await p.click('[data-act="tfin"]');
    await p.waitForURL(/\/proeftoets\/uitslag$/);
    tellen = await sent();
    assert.equal(tellen.length, 11);
    assert.deepEqual(tellen[0], { tel: 'proeftoets' });
    assert.ok(
      tellen
        .slice(1)
        .every((x) => x.tel === 'toetsvraag' && x.uitkomst === 'leeg' && Number.isInteger(x.soort)),
    );

    // Dit is een geautomatiseerde browser, net als een bot: er ging niets weg.
    assert.equal(requests, 0);
    await context.close();

    // Zonder navigator.webdriver gaat elke tel meteen naar /api/tel, ook als je het tabblad direct
    // daarna sluit. De functie in scripts/server.js bewaart dan precies de tel en de dag.
    // Ook HeadlessChrome in de user-agent telt als bot, dus doe je voor als een gewone browser.
    const human = await browser.newContext({
      viewport: { width: 390, height: 800 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    });
    await human.addInitScript(() =>
      Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }),
    );
    const before = server.tellen.length;
    const h = await human.newPage();
    await h.goto(at(`/${slug}/oefenen?soort=38&seed=k3x9q`));
    await h.click('[data-act="show"]');
    await h.close();
    for (let i = 0; i < 50 && server.tellen.length === before; i++) await sleep(100);
    assert.equal(server.tellen.length, before + 1);
    const { PartitionKey, RowKey, ...row } = server.tellen.at(-1);
    assert.match(PartitionKey, /^\d{4}-\d{2}-\d{2}$/);
    assert.deepEqual(Object.keys(row), ['tel', 'soort', 'uitkomst', 'duur', 'hint']);
    assert.equal(row.uitkomst, 'uitwerking');
    assert.deepEqual(await human.cookies(), [], 'geen cookies');
    await human.close();
  } finally {
    await browser.close();
  }
});

test(
  'een proeftoets overleeft de terugknop, herladen en sluiten',
  { timeout: 120_000 },
  async () => {
    const browser = await launch();
    try {
      await mkdir(shotDir, { recursive: true });
      const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
      let p = await context.newPage();
      const path = () => new URL(p.url()).pathname;
      const stored = (key) => p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
      const drawing = TOPICS.flatMap((t) => t.skills)
        .filter((k) => /tekenen$/.test(k.name))
        .map((k) => k.id);
      const start = async () => {
        await p.evaluate((ids) => {
          wiskundefit.prog.stof = ids;
          wiskundefit.go({ name: 'toets' });
        }, drawing);
        await p.click('[data-act="len"][data-id="10"]');
        await p.click('[data-act="start"]');
      };
      const points = (i) =>
        p.evaluate((n) => wiskundefit.state.test.items[n].q.fields.map((f) => f.a), i);
      // Elk paar punten op de lijn is goed, dus vul ze andersom in. Dat vraagt om echt nakijken.
      const answer = async (i) => {
        const [x1, y1, x2, y2] = await points(i);
        await fill(p, 't', [x2, y2, x1, y1].map(String));
      };

      // Zonder proeftoets is er nog geen resultaat.
      await p.goto(at('/proeftoets/uitslag'));
      assert.match(await p.textContent('main'), /eerst een proeftoets/);
      await p.screenshot({ path: `${shotDir}uitslag-nog-leeg.png` });
      await p.click('main a[href="/proeftoets"]');
      assert.match(await p.textContent('h1'), /Proeftoets/);

      // Starten verandert het adres niet en is geen extra stap voor de terugknop.
      await p.goto(siteUrl);
      await p.click('.hero a[href="/proeftoets"]');
      const steps = await p.evaluate(() => history.length);
      await start();
      assert.equal(path(), '/proeftoets');
      assert.equal(await p.evaluate(() => history.length), steps);
      const first = await p.textContent('#tq');
      await p.fill('#tf0', '3');

      // De terugknop: de proeftoets loopt door en de melding wijst de weg terug.
      await p.goBack();
      assert.equal(path(), '/');
      assert.match(await p.textContent('.notice'), /proeftoets loopt nog/);
      await p.screenshot({ path: `${shotDir}proeftoets-loopt-nog.png` });
      await p.goForward();
      assert.equal(await p.textContent('#tq'), first);
      assert.equal(await p.inputValue('#tf0'), '3');
      assert.equal(await p.$('.notice'), null);

      // Via de melding kom je ook terug, en via het menu.
      await p.click('a[href="/over"]');
      await p.click('.notice a');
      assert.equal(await p.inputValue('#tf0'), '3');
      await p.click('.topnav a[href="/mijn-stof"]');
      await p.click('.topnav a[href="/proeftoets"]');
      assert.equal(await p.inputValue('#tf0'), '3');

      // Herladen: dezelfde vraag, met wat er stond. De klok telt de tijd ertussen niet mee.
      await p.reload();
      assert.equal(await p.textContent('#tq'), first);
      assert.equal(await p.inputValue('#tf0'), '3');
      const saved = await stored('wiskundefit-proeftoets');
      assert.equal(saved.since, null);
      assert.equal(typeof saved.spent, 'number');

      // Tabblad dicht en later verder: de vragen en antwoorden staan in de browser.
      await answer(0);
      await p.click('#tform button[type=submit]');
      await p.close();
      p = await context.newPage();
      await p.goto(at('/proeftoets'));
      assert.match(await p.textContent('h1'), /Vraag 2 van 10/);
      await p.click('[data-act="goto"][data-id="0"]');
      assert.equal(await p.textContent('#tq'), first);

      // Inleveren na herladen: een tekenvraag is ook dan nog goed na te kijken.
      for (let i = 0; i < 10; i++) {
        await p.click(`[data-act="goto"][data-id="${i}"]`);
        await answer(i);
      }
      await p.reload();
      await p.click('[data-act="tfin"]');
      assert.equal(path(), '/proeftoets/uitslag');
      const score = () =>
        p.evaluate(() => [wiskundefit.state.result.score, wiskundefit.state.result.max]);
      const [got, max] = await score();
      assert.equal(max, 40);
      assert.equal(got, max, 'alles goed');
      assert.equal(await stored('wiskundefit-proeftoets'), null);
      assert.match(await p.textContent('.score'), /40\/40/);
      // Elke tekenvraag toont de lijn die je tekende, en het rooster reageert niet meer.
      assert.equal(await p.locator('.resq svg .drawn line.l1').count(), 10);
      assert.equal(await p.locator('.resq svg .drawn line.l2').count(), 0, 'alles goed');
      assert.equal(await p.locator('.resq svg[data-draw]').count(), 0);
      assert.equal(await p.locator('.resq .answers').count(), 10);
      assert.equal(await p.locator('.answers .mark.bad').count(), 0, 'alles goed: geen kruisjes');
      assert.equal(await p.locator('.resq details[open]').count(), 0, 'uitwerkingen ingeklapt');
      // Elke vraag kun je delen, met precies die vraag in de link.
      const shared = await p.$$eval('.resq [data-act="share"]', (els) =>
        els.map((b) => b.dataset.id),
      );
      const seeds = await p.evaluate(() => wiskundefit.state.result.items.map((x) => x.q.seed));
      assert.equal(shared.length, 10);
      shared.forEach((path, i) => assert.ok(path.endsWith(`&seed=${seeds[i].toString(36)}`), path));
      await p.screenshot({ path: `${shotDir}uitslag.png`, fullPage: true });

      // De uitslag heeft een eigen adres en blijft na herladen staan.
      await p.reload();
      assert.deepEqual(await score(), [40, 40]);
      assert.match(await p.textContent('.score'), /40\/40/);

      // Terug gaat niet de ingeleverde proeftoets in.
      await p.goBack();
      assert.equal(path(), '/proeftoets');
      assert.equal(await p.$('#tform'), null);
      assert.match(await p.textContent('h1'), /Proeftoets/);
      await p.goForward();
      assert.match(await p.textContent('.score'), /40\/40/);

      // Een onderwerp uit de uitslag oefenen, en terug: de uitslag staat er nog.
      await p.click('.res-topics a');
      assert.ok(await p.$('#pform'));
      await p.goBack();
      assert.match(await p.textContent('.score'), /40\/40/);

      // Het overzicht en het scherm Proeftoets verwijzen naar de uitslag.
      await p.goto(siteUrl);
      await p.click('a[href="/proeftoets/uitslag"]');
      assert.match(await p.textContent('.score'), /40\/40/);
      await p.goto(at('/proeftoets'));
      await p.click('main a[href="/proeftoets/uitslag"]');
      assert.match(await p.textContent('.score'), /40\/40/);

      // Stoppen zonder inleveren: de vorige uitslag en de voortgang blijven zoals ze waren.
      const progress = await p.evaluate(() => JSON.stringify(wiskundefit.prog.skills));
      await start();
      await p.fill('#tf0', '5');
      await p.click('[data-act="tstop1"]');
      assert.equal(await p.inputValue('#tf0'), '5', 'de vraag blijft staan');
      assert.equal(await p.evaluate(() => document.activeElement.dataset.act), 'tstop2');
      await p.click('[data-act="tstop0"]');
      assert.equal(await p.inputValue('#tf0'), '5');
      await p.click('[data-act="tstop1"]');
      await p.click('[data-act="tstop2"]');
      assert.ok(await p.$('[data-act="start"]'));
      assert.equal(await stored('wiskundefit-proeftoets'), null);
      assert.equal(await p.evaluate(() => JSON.stringify(wiskundefit.prog.skills)), progress);
      await p.goto(at('/proeftoets/uitslag'));
      assert.match(await p.textContent('.score'), /40\/40/);

      // Een lopende proeftoets zonder uitslag verwijst daarnaar terug.
      await p.evaluate(() => localStorage.removeItem('wiskundefit-uitslag'));
      await p.goto(at('/proeftoets'));
      await start();
      await p.goto(at('/proeftoets/uitslag'));
      assert.match(await p.textContent('main a.btn.main'), /Ga verder/);

      // Wat niet meer te lezen is, wordt genegeerd in plaats van dat de site stopt.
      const broken = await stored('wiskundefit-proeftoets');
      for (const value of ['{kapot', JSON.stringify({ ...broken, items: [{ id: 99999 }] })]) {
        await p.evaluate((v) => localStorage.setItem('wiskundefit-proeftoets', v), value);
        await p.goto(at('/proeftoets'));
        assert.ok(await p.$('[data-act="start"], a.btn.main'), value.slice(0, 10));
        assert.equal(await p.evaluate(() => wiskundefit.state.test), null);
      }

      // Voortgang wissen haalt ook de proeftoets en de uitslag weg.
      await start();
      await answer(0);
      await p.fill('#tf3', '6');
      await p.click('[data-act="tfin"]');
      await p.click('[data-act="tfin"]');
      // Bij een fout staat ook de goede lijn in het rooster, met uitleg die zonder kleur werkt.
      const wrong = await p.evaluate(
        () => wiskundefit.state.result.items.filter((x) => !x.c.ok).length,
      );
      assert.ok(wrong >= 9);
      assert.equal(await p.locator('.resq svg .drawn line.l2').count(), wrong);
      assert.equal(await p.locator('.legend').count(), wrong);
      assert.equal(await p.locator('.resq', { hasText: 'niet ingevuld' }).count(), 9);
      // Elk fout punt krijgt een kruisje en een voorbeeld van een goed punt.
      const crosses = await p.evaluate(
        () =>
          wiskundefit.state.result.items
            .flatMap((x) => x.c.each.filter((_, i) => i % 2 === 0))
            .filter((ok) => !ok).length,
      );
      assert.equal(await p.locator('.answers .mark.bad').count(), crosses);
      // Bij een tekenvraag is elk punt op de lijn goed, dus de tabel noemt een goed punt als voorbeeld.
      assert.equal(await p.locator('.answers thead', { hasText: 'Een goed punt' }).count(), wrong);
      await p.screenshot({ path: `${shotDir}uitslag-fout.png`, fullPage: true });
      await start();
      await p.evaluate(() => wiskundefit.go({ name: 'stof' }));
      await p.click('[data-act="reset1"]');
      await p.click('[data-act="reset2"]');
      assert.equal(await stored('wiskundefit-proeftoets'), null);
      assert.equal(await stored('wiskundefit-uitslag'), null);
      assert.equal(await p.$('.notice'), null);
    } finally {
      await browser.close();
    }
  },
);

// Grenzen voor de grootte, zodat het opvalt als een pagina of de code opeens veel groter wordt. Een
// oude telefoon met traag internet merkt elke kilobyte. Verstuurd is met brotli, zoals Azure dat
// doet. In november 2026 was de grootste pagina 3,5 kB, een schil 1,6 kB, de code 62 kB (179 kB
// zelf) en de CSS 5 kB. Wordt een grens te krap, kijk dan eerst met node scripts/meet.js dist <naam>
// wat er groeide, en verhoog de grens alleen als dat nodig is.
const LIMITS = {
  page: { sent: 6, why: 'een vooraf gebouwde pagina' },
  shell: { sent: 2.5, why: 'een schil of de 404-pagina' },
  code: { sent: 80, own: 230, why: 'de code' },
  css: { sent: 8, why: 'de CSS' },
  font: { sent: 25, why: 'een lettertype' },
};
test('de pagina’s en de code blijven klein', async () => {
  const dist = new URL('../dist/', import.meta.url);
  const sizes = async (file) => {
    const body = await readFile(new URL(file, dist));
    const sent = brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } });
    return { own: body.length / 1024, sent: sent.length / 1024 };
  };
  const files = PAGES.map((p) => [p.file, p.shell || !p.path ? 'shell' : 'page']);
  for (const name of await readdir(new URL('assets/', dist))) {
    const kind = { '.js': 'code', '.css': 'css', '.woff2': 'font' }[name.match(/\.\w+$/)?.[0]];
    if (kind) files.push([`assets/${name}`, kind]);
  }
  assert.ok(
    files.some(([, kind]) => kind === 'code'),
    'de code is gevonden',
  );
  const kB = (n) => `${n.toFixed(1).replace('.', ',')} kB`;
  for (const [file, kind] of files) {
    const size = await sizes(file);
    const limit = LIMITS[kind];
    for (const key of ['sent', 'own']) {
      if (!limit[key]) continue;
      assert.ok(
        size[key] <= limit[key],
        `${file} is ${kB(size[key])}${key === 'sent' ? ' verstuurd' : ''}, en de grens voor ${limit.why} is ${kB(limit[key])}`,
      );
    }
  }
});
