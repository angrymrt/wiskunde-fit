// Klikt de gebouwde site door in een echte browser, op telefoonformaat. Start: npm run test:browser
// Gebruikt Edge; een andere browser kies je met de omgevingsvariabele BROWSER, bijvoorbeeld chrome of webkit.
// Standaard krijgt elke soort vraag 1 ronde; met de omgevingsvariabele ROUNDS kies je er meer.
// Schermafbeeldingen om zelf na te kijken komen in test-results/.
// De lange test, die alle onderwerpen doorloopt, beperk je met ONDERWERPEN=a,b (adressen van
// onderwerpen) of met METHODE=gr13-havo3 en eventueel HOOFDSTUK=4. Met SNEL=1 slaat hij over.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readdir, readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';
import { chromium, webkit } from 'playwright-core';
import { check } from '../scripts/controleer-site.js';
import { onderwerpenVan } from '../scripts/browsertest-selectie.js';
import { startServer } from '../scripts/server.js';
import { MAPPINGS } from '../src/js/mappings/index.js';
import { PAGES } from '../src/js/pages.js';
import { graph } from '../src/js/figures.js';
import { contextGraph } from '../src/js/grafiekfiguren.js';
import { SOORTEN, tekenFig } from '../src/js/tekenvragen.js';
import { DOMAINS, TOPICS, makeQuestion } from '../src/js/topics/index.js';
import { MC, orFields } from '../src/js/topics/shared.js';

const server = await startServer(fileURLToPath(new URL('../dist', import.meta.url)), 0);
after(() => {
  server.closeAllConnections();
  server.close();
});
const siteUrl = `http://127.0.0.1:${server.address().port}/`;
const at = (address) => new URL(address, siteUrl).href;
const shotDir = fileURLToPath(new URL('../test-results/', import.meta.url));
const rounds = Number(process.env.ROUNDS) || 1;
// Welke onderwerpen de lange test doorloopt: alle, tenzij je er een keuze voor maakt.
const gekozen = process.env.ONDERWERPEN
  ? process.env.ONDERWERPEN.split(',')
  : process.env.METHODE
    ? await onderwerpenVan(process.env.METHODE, process.env.HOOFDSTUK)
    : null;
// WebKit is de motor van Safari. Installeer die eenmalig met: npx playwright-core install webkit
const launch = () =>
  process.env.BROWSER === 'webkit'
    ? webkit.launch({ headless: true })
    : chromium.launch({ channel: process.env.BROWSER || 'msedge', headless: true });

// Geeft de juiste antwoorden van een vraag, getypt zoals een leerling dat zou doen. In een groep
// velden, zoals bij x = −2 ∨ x = 9, staan ze in omgekeerde volgorde: die volgorde moet ook goed zijn.
const answerOf = `(q) => {
  // Bij een veld met een vorm (#244) moet het antwoord een breuk zijn, dus zoekt het dan elke noemer
  // tot 1000, zodat ook 1/18 of 7/45 een breuk blijft. Bij de vorm gemengd haalt het de helen eruit,
  // zoals 3 1/2 in plaats van 7/2.
  const alle = Array.from({ length: 999 }, (_, i) => i + 2);
  const typed = (x, vorm) => {
    if (Number.isInteger(x)) return String(x);
    for (const n of vorm ? alle : [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 24, 25, 40]) {
      const k = Math.round(x * n);
      if (Math.abs(x * n - k) >= 1e-7) continue;
      const t = Math.abs(k);
      if (vorm === 'gemengd' && t > n) return (k < 0 ? '-' : '') + Math.floor(t / n) + ' ' + (t % n) + '/' + n;
      return k + '/' + n;
    }
    return String(x).replace('.', ',');
  };
  const vals = q.mc ? null : q.fields.map((f) => (f.sel || f.teken || f.berekening || f.uitdrukking ? f.a : (f.round != null ? String(window.wiskundefit.rd(f.a, f.round)).replace('.', ',') : typed(f.a, f.vorm))));
  const groups = {};
  if (vals) q.fields.forEach((f, i) => f.grp != null && (groups[f.grp] = groups[f.grp] || []).push(i));
  for (const g of Object.values(groups)) {
    const back = g.map((i) => vals[i]).reverse();
    g.forEach((i, k) => (vals[i] = back[k]));
  }
  // Zijn alle velden keuzelijsten, dan kiest het foute antwoord in de eerste een andere keuze.
  const fout = vals && q.fields.every((f) => f.sel)
    ? [q.fields[0].sel.find((o) => o !== q.fields[0].a), ...vals.slice(1)]
    : null;
  return { mc: q.mc ? q.mc.a : null, vals, fout };
}`;

// Een tekening (#232) staat in een verborgen veld. Dat vult de test zoals tikken het zou vullen. Het tikken zelf test
// 'een tekenvraag werkt met tikken, het toetsenbord en de knoppen'.
async function fill(page, prefix, vals, numericOverride) {
  for (let i = 0; i < vals.length; i++) {
    const el = await page.$(`#${prefix}f${i}`);
    const [tag, type] = await el.evaluate((e) => [e.tagName, e.type]);
    if (tag === 'SELECT') await el.selectOption(vals[i]);
    else if (type === 'hidden')
      await el.evaluate((e, v) => (e.value = v), numericOverride ?? vals[i]);
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
      const all = await p.evaluate(() => wiskundefit.TOPICS.map((s) => s.slug));
      const unknown = (gekozen ?? []).filter((id) => !all.includes(id));
      assert.deepEqual(unknown, [], 'onbekende onderwerpen in ONDERWERPEN of METHODE');
      const ids = all.filter((id) => !gekozen || gekozen.includes(id));
      for (const id of ids) {
        await p.evaluate((i) => wiskundefit.go({ name: 'topic', slug: i }), id);
        for (const b of await p.$$('[data-act="exnext"]')) {
          while (await b.isVisible()) await b.click();
        }
        await check(`${id} uitleg`);
        // Een term met zijn popup open (#39). De knoppen komen pas na het laden van de popup, dus
        // wacht erop als de uitleg een term bevat, anders meet de test niets.
        if (await p.locator('.term').count()) {
          const term = p.locator('button.term:visible').first();
          await term.waitFor();
          await term.click();
          assert.equal(await term.getAttribute('aria-expanded'), 'true', `${id}: de popup is open`);
          await check(`${id} uitleg met een popup`);
          await p.keyboard.press('Escape');
        }
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
        'rekenen-met-letters',
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
    // Eerst laadt het onderwerp, dan pas staat de uitleg er.
    await p.waitForSelector('.topic-body');
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
    // Eerst laden de onderwerpen van de stofkeuze, dan pas staat het scherm er.
    await p.waitForFunction(() => document.activeElement.tagName === 'H1');
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
        // Het bestand met deze pagina's laadt pas bij de eerste keer, dus wacht op de kop.
        await p.waitForFunction(
          (src) => new RegExp(src).test(document.querySelector('h1')?.textContent ?? ''),
          heading.source,
        );
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

test(
  'een term opent een popup met uitleg, met tikken en met het toetsenbord',
  { timeout: 60_000 },
  async () => {
    const browser = await launch();
    try {
      const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
      await p.goto(`${siteUrl}lineaire-formule-opstellen`);
      await p.waitForSelector('button.term');
      // Een term die in dit onderwerp wordt uitgelegd, is gewone tekst. Alleen termen uit andere
      // onderwerpen krijgen een popup.
      assert.equal(await p.locator('button.term[data-term="evenwijdig"]').count(), 0);
      const knop = p.locator('button.term[data-term="richtingscoefficient"]');
      assert.equal(await knop.getAttribute('aria-expanded'), 'false');
      await knop.click();
      assert.equal(await knop.getAttribute('aria-expanded'), 'true');
      assert.equal(await p.locator('.pop').count(), 1);
      assert.match(await p.locator('.pop').innerText(), /richtingscoëfficiënt/);
      // De popup pakt de focus niet af.
      assert.equal(await p.evaluate(() => document.activeElement.className), 'term');

      // Sluit werkt, en de focus gaat terug naar de term.
      await p.click('.pop button');
      assert.equal(await p.locator('.pop').count(), 0);
      assert.equal(await knop.getAttribute('aria-expanded'), 'false');

      // Enter opent, Escape sluit en houdt de focus op de term.
      await knop.focus();
      await p.keyboard.press('Enter');
      assert.equal(await p.locator('.pop').count(), 1);
      await p.keyboard.press('Escape');
      assert.equal(await p.locator('.pop').count(), 0);
      assert.equal(await p.evaluate(() => document.activeElement.className), 'term');

      // Een klik ergens anders sluit de popup.
      await knop.click();
      await p.click('h1');
      assert.equal(await p.locator('.pop').count(), 0);

      // Onder de uitleg staat een lijst met de termen uit dit onderwerp.
      assert.match(await p.locator('.termen').innerText(), /richtingscoëfficiënt/);

      // "Meer uitleg" gaat naar de term in de woordenlijst onder de uitleg, en die komt in beeld.
      await p.evaluate(() =>
        window.wiskundefit.go(
          { name: 'topic', slug: 'lineaire-formule-opstellen' },
          '#woord-richtingscoefficient',
        ),
      );
      await p.waitForFunction(() => {
        const r = document.getElementById('woord-richtingscoefficient')?.getBoundingClientRect();
        return r && r.top >= 0 && r.bottom <= window.innerHeight;
      });

      // Alleen de hoogte van het venster veranderen sluit de popup niet.
      await p.locator('button.term').first().click();
      await p.setViewportSize({ width: 390, height: 700 });
      assert.equal(await p.locator('.pop').count(), 1);
      await p.setViewportSize({ width: 360, height: 700 });
      await p.waitForFunction(() => !document.querySelector('.pop'));

      // Een term uit een ander onderwerp heeft "Meer uitleg", naar de lijst bij dat onderwerp.
      await knop.click();
      assert.equal(await p.locator('.pop a').count(), 1);
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
    assert.equal(await p.locator('main a.par').count(), 15);
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
    assert.equal(await p.locator('.chapter details').count(), 5, 'ingeklapte hoofdstukken');
    await p.click('[data-act="chapter"][data-id="1"]');
    // De balk onderaan geeft ruimte bij het scrollen, ook in browsers zonder :has().
    const withBar = () =>
      p.evaluate(() => document.documentElement.classList.contains('met-stof-bar'));
    assert.equal(await withBar(), true);
    await p.click('.stof-bar a');
    assert.deepEqual(await current(), ['Mijn stof page']);
    assert.equal(await withBar(), false);
    assert.match(
      await p.textContent('main'),
      /Uit je boek, Getal & Ruimte, 13e editie, havo 3: hoofdstuk 1\./,
    );
    const mixed = await p.$$eval('input[data-act="topicpick"]', (els) =>
      els.filter((e) => e.indeterminate).map((e) => e.dataset.id),
    );
    assert.deepEqual(mixed, ['rekenen-met-een-formule']);
    await p.screenshot({ path: `${shotDir}mijn-stof-boek.png`, fullPage: true });
    // Een half gekozen onderwerp oefent standaard alleen de gekozen soorten, tot je alles kiest.
    await p.goto(at('/rekenen-met-een-formule/oefenen'));
    const chipCount = () => p.locator('.chips .chip').count();
    const mine = await chipCount();
    assert.match(await p.textContent('main'), /Alleen mijn stof/);
    await p.click('[data-act="scope"]');
    const all = await chipCount();
    assert.ok(all > mine, `alle soorten (${all}) zijn meer dan mijn stof (${mine})`);
    await p.click('[data-act="scope"]');
    assert.equal(await chipCount(), mine);
    await p.screenshot({ path: `${shotDir}onderwerp-mijn-stof.png` });
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

// Een antwoordtabel in de uitslag die zijwaarts scrolt, is met het toetsenbord niet te bereiken. Dat
// gebeurde bij een lang woord als label, zoals vermenigvuldigingsfactor (vraagsoort 107), en maakte
// de axe-test af en toe rood (#155 en #169, want de proeftoets kiest willekeurige vragen).
test('een lang woord in de uitslag maakt de antwoordtabel niet te breed', async () => {
  const browser = await launch();
  try {
    for (const width of [320, 390]) {
      const p = await browser.newPage({ viewport: { width, height: 700 } });
      await p.goto(siteUrl);
      await p.waitForFunction(() => window.wiskundefit);
      await p.evaluate(() => {
        wiskundefit.prog.stof = [107];
        wiskundefit.go({ name: 'toets' });
      });
      await p.click('[data-act="len"][data-id="30"]');
      await p.click('[data-act="start"]');
      await p.click('[data-act="tfin"]');
      await p.click('[data-act="tfin"]');
      await p.waitForSelector('.resq');
      const wide = await p.evaluate(
        () =>
          [...document.querySelectorAll('.resq .scroll')].filter(
            (s) => s.scrollWidth > s.clientWidth,
          ).length,
      );
      // De test moet het lange label ook echt hebben gezien, anders slaagt hij leeg.
      assert.match(await p.textContent('.res'), /vermenigvuldigingsfactor/);
      assert.equal(wide, 0, `bij ${width} pixels scrolt een antwoordtabel zijwaarts`);
      await p.close();
    }
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

test('een parabool tekenen werkt met tikken en met typen', { timeout: 60_000 }, async () => {
  const browser = await launch();
  const slug = 'kwadratische-functies';
  try {
    await mkdir(shotDir, { recursive: true });
    const p = await browser.newPage({ viewport: { width: 390, height: 1400 } });
    await p.goto(siteUrl);
    await p.evaluate((s) => wiskundefit.go({ name: 'topic', slug: s, oefen: true }), slug);
    await p.click('.chip[data-id="103"]');
    const q = () =>
      p.evaluate((s) => {
        const x = wiskundefit.state.prac[s].q;
        return [x.fields.map((f) => f.a), x.parabola];
      }, slug);
    const inputs = () => p.$$eval('#pform .fld input', (els) => els.map((e) => e.value));
    const tap = async (x, y) => {
      const box = await (await p.$('svg[data-draw]')).boundingBox();
      const [x0, , , y1, u, ml, mt, w] = await p.$eval('svg[data-draw]', (s) => [
        ...s.dataset.draw.split(',').map(Number),
        s.viewBox.baseVal.width,
      ]);
      const k = box.width / w;
      await p.mouse.click(box.x + (ml + (x - x0) * u) * k, box.y + (mt + (y1 - y) * u) * k);
    };
    const [[h, k, x2, y2, x3, y3], { a, b, c }] = await q();
    const curves = () => p.$$eval('.drawn path', (l) => l.length);

    // De eerste tik is de top. Pas met drie punten staat er een parabool.
    await tap(h, k);
    await tap(x2, y2);
    assert.deepEqual(await inputs(), [h, k, x2, y2, '', ''].map(String));
    assert.equal(await curves(), 0);
    await tap(x3, y3);
    assert.deepEqual(await inputs(), [h, k, x2, y2, x3, y3].map(String));
    assert.equal(await curves(), 1);
    await p.screenshot({ path: `${shotDir}parabool-tekenen.png`, fullPage: true });

    // Zijn alle punten bezet, dan blijft de top staan en vervalt het oudste andere punt.
    const free = [-5, -4, 4, 5].find((x) => x !== x2 && x !== x3 && x !== h);
    await tap(free, -6);
    assert.deepEqual(await inputs(), [h, k, x3, y3, free, -6].map(String));
    // Tikken op een gekozen punt haalt het weg.
    await tap(free, -6);
    assert.deepEqual((await inputs()).slice(4), ['', '']);
    assert.equal(await curves(), 0);

    // Typen tekent ook, en een ander punt op de parabool is goed.
    const far = h + (h > 0 ? -3 : 3);
    await p.fill('#pf4', String(far));
    await p.fill('#pf5', String(a * far * far + b * far + c));
    assert.equal(await curves(), 1);
    await p.click('#pform button[type=submit]');
    assert.match(await p.textContent('.fb'), /Goed gedaan/);
  } finally {
    await browser.close();
  }
});

// Tekenvragen (#232): een kubus afmaken, een driehoek met de passer, een uitslag van een kubus en een pijl op de
// getallenlijn (#263). Wat een tik precies doet, staat in tests/tekenvragen.test.js. Hier: dat tikken, het toetsenbord en de knoppen het verborgen veld vullen,
// dat het nakijken werkt en dat de tekening er na een hint nog staat, op een telefoon, smal en donker.
test(
  'een tekenvraag werkt met tikken, het toetsenbord en de knoppen',
  { timeout: 90_000 },
  async () => {
    const browser = await launch();
    try {
      await mkdir(shotDir, { recursive: true });
      const errors = [];
      const context = await browser.newContext({ viewport: { width: 390, height: 1300 } });
      const p = await context.newPage();
      p.on('pageerror', (e) => errors.push(e.message));
      const open = async (soort, seed = 'k3x9q') => {
        await p.goto(at(`/tekenopdrachten/oefenen?soort=${soort}&seed=${seed}`));
        await p.waitForSelector('.teken-knoppen button');
      };
      const vraag = () => p.evaluate(() => wiskundefit.state.prac.tekenopdrachten.q);
      const veld = () => p.$eval('#pf0', (e) => e.value);
      // Tikt op een plek in de figuur, in de eenheden van de viewBox, ook als de figuur geschaald is.
      const tik = async (sx, sy) => {
        const svg = await p.$('svg[data-teken]');
        const box = await svg.boundingBox();
        const w = await svg.evaluate((s) => s.viewBox.baseVal.width);
        await p.mouse.click(box.x + (sx * box.width) / w, box.y + (sy * box.width) / w);
      };
      const controleer = async () => {
        await p.click('#pform button[type=submit]');
        return p.textContent('.fb');
      };

      // 182: een kubus afmaken. Het rooster heeft 34 per hokje en een rand van 16, met y omhoog.
      await open(182);
      let q = await vraag();
      assert.equal(await p.getAttribute('svg[data-teken]', 'role'), 'application');
      // Met het toetsenbord: de focus op het rooster, een pijltje en Enter zetten het eerste punt.
      await p.focus('svg[data-teken]');
      await p.keyboard.press('ArrowRight');
      await p.keyboard.press('Enter');
      assert.equal(await veld(), q.teken.zet.map((_, k) => (k ? '?' : '2,1')).join(' '));
      assert.match(await p.textContent('body > p.sr[aria-live]:not(#laadmelding)'), /gezet/);
      await p.keyboard.press('Enter');
      assert.equal(await veld(), '', 'nog een keer Enter haalt het punt weg');
      // Met tikken: elk goed punt.
      for (const pt of q.fields[0].a.split(' ').map((s) => s.split(',').map(Number)))
        await tik(16 + pt[0] * 34, 16 + (q.teken.H - pt[1]) * 34);
      assert.equal(await veld(), q.fields[0].a);
      // Na een hint staat de tekening er nog.
      await p.click('[data-act="hint"]');
      assert.equal(await veld(), q.fields[0].a);
      // ui/tekenen.js tekent na render() opnieuw, zodra het geladen bestand dat kan.
      await p.waitForFunction(
        () => document.querySelectorAll('svg[data-teken] .getekend circle.dot').length >= 3,
      );
      await p.screenshot({ path: `${shotDir}teken-kubus.png`, fullPage: true });
      assert.match(await controleer(), /Goed gedaan/);

      // 183: een driehoek met de passer, met de knoppen.
      await open(183);
      q = await vraag();
      const straal = async (r) => {
        const nu = Number(
          (await p.textContent('#ptk-straal')).replace(',', '.').replace(' cm', ''),
        );
        for (let k = 0; k < Math.abs(r - nu) / 0.5; k++)
          await p.click(r > nu ? '#ptk-groter' : '#ptk-kleiner');
      };
      assert.equal(await p.isDisabled('#ptk-c'), true, 'zonder boogjes is er geen snijpunt');
      await straal(q.teken.ac);
      await p.click('#ptk-a');
      await straal(q.teken.bc);
      await p.click('#ptk-b');
      assert.equal(await p.isDisabled('#ptk-c'), false);
      await p.click('#ptk-c');
      assert.equal(await veld(), q.fields[0].a);
      await p.screenshot({ path: `${shotDir}teken-passer.png`, fullPage: true });
      assert.match(await controleer(), /Goed gedaan/);
      // Een tik op het eerste hoekpunt zet de passer daar. Het rooster heeft 36 per cm, vanaf x = −1.
      await open(183, 'abc12');
      await tik(16 + 36, 16 + q.teken.y1 * 36);
      assert.match(await veld(), /^3 0 \?$/);

      // 184: een uitslag van een kubus. Eerst een hokje te veel, dan de goede hokjes.
      await open(184);
      q = await vraag();
      const hokje = (x, y) => tik(16 + x * 44 + 22, 16 + y * 44 + 22);
      const cells = q.fields[0].a.split(' ').map((s) => s.split(',').map(Number));
      for (const [x, y] of cells) await hokje(x, y);
      const vrij = [...Array(30).keys()]
        .map((i) => [i % 6, Math.floor(i / 6)])
        .find(([x, y]) => ![...cells, ...q.teken.geg].some((c) => c[0] === x && c[1] === y));
      await hokje(...vrij);
      assert.match(await controleer(), /meer dan zes/);
      await hokje(...vrij);
      assert.equal(await veld(), q.fields[0].a);
      // Met het toetsenbord kleur je een hokje en maak je het weer leeg. De cursor begint linksboven. Na Controleer
      // bouwt het scherm zich opnieuw op, en ui/tekenen.js maakt het rooster daarna pas focusbaar: wacht daarop, en
      // op de cursor, anders gaan de toetsen soms nergens heen.
      await p.waitForSelector('svg[data-teken][tabindex="0"]');
      await p.focus('svg[data-teken]');
      await p.waitForSelector('svg[data-teken] .getekend .cursor');
      for (let k = 0; k < vrij[0]; k++) await p.keyboard.press('ArrowRight');
      for (let k = 0; k < vrij[1]; k++) await p.keyboard.press('ArrowDown');
      await p.keyboard.press(' ');
      assert.notEqual(await veld(), q.fields[0].a);
      await p.keyboard.press(' ');
      assert.equal(await veld(), q.fields[0].a);
      assert.match(await controleer(), /Goed gedaan/);

      // 215: een som als pijl op de getallenlijn (#263). De lijn begint 16 van links, met 20 per getal.
      await p.goto(at('/negatieve-getallen/oefenen?soort=215&seed=k3x9q'));
      await p.waitForSelector('.teken-knoppen button');
      q = await p.evaluate(() => wiskundefit.state.prac['negatieve-getallen'].q);
      const getal = (v) => tik(16 + (v - q.teken.lo) * 20, 58);
      const uitleg = () => p.textContent('#ptk-uitleg');
      assert.equal(await p.$$eval('.teken-knoppen [data-teken-knop="omhoog"]', (b) => b.length), 0);
      // Met het toetsenbord: de cursor begint bij 0, en Enter zet daar het begin. Een schermlezer hoort waar.
      await p.focus('svg[data-teken]');
      await p.waitForSelector('svg[data-teken] .getekend .cursor');
      assert.match(await uitleg(), /De cursor staat bij 0\./);
      await p.keyboard.press('Enter');
      assert.equal(await veld(), '0 ?');
      assert.match(
        await p.textContent('body > p.sr[aria-live]:not(#laadmelding)'),
        /Begin van de pijl bij 0/,
      );
      assert.match(await uitleg(), /De pijl begint bij 0/);
      // Een pijl vanaf 0 is een valkuil.
      await getal(q.teken.e);
      assert.match(await uitleg(), /De pijl gaat van 0 naar/);
      assert.match(await controleer(), /niet bij 0/);
      // Haal het begin weg en zet het goed.
      await getal(0);
      await getal(q.teken.a);
      assert.equal(await veld(), q.fields[0].a);
      await p.screenshot({ path: `${shotDir}teken-pijl.png`, fullPage: true });
      assert.match(await controleer(), /Goed gedaan/);

      // Smal en donker: niets steekt buiten het scherm, en de schermafbeeldingen om zelf te bekijken.
      for (const [naam, soort, pad = 'tekenopdrachten'] of [
        ['kubus', 182],
        ['passer', 183],
        ['uitslag', 184],
        ['pijl', 215, 'negatieve-getallen'],
      ]) {
        const d = await browser.newPage({
          viewport: { width: 320, height: 1000 },
          colorScheme: 'dark',
        });
        d.on('pageerror', (e) => errors.push(e.message));
        await d.goto(at(`/${pad}/oefenen?soort=${soort}&seed=k3x9q`));
        await d.waitForSelector('.teken-knoppen button');
        const wide = await d.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        );
        assert.equal(wide, false, `${naam}: niets steekt buiten een scherm van 320 px`);
        // Elke knop is minstens 44 bij 44 px.
        const klein = await d.$$eval('.teken-knoppen button', (bs) =>
          bs.filter((b) => b.offsetWidth < 44 || b.offsetHeight < 44).map((b) => b.textContent),
        );
        assert.deepEqual(klein, [], `${naam}: knoppen van minstens 44 px`);
        await d.screenshot({ path: `${shotDir}teken-${naam}-smal-donker.png`, fullPage: true });
        await d.close();
      }

      // In een proeftoets: alles goed, en in het resultaat de tekening.
      await p.evaluate(() => {
        wiskundefit.prog.stof = [182, 183, 184];
        return wiskundefit.go({ name: 'toets' });
      });
      await p.click('[data-act="len"][data-id="10"]');
      await p.click('[data-act="start"]');
      for (let i = 0; i < 10; i++) {
        await p.waitForSelector('#tform .teken-knoppen button');
        const a = await p.evaluate(() => wiskundefit.state.test.items[wiskundefit.state.test.i].q);
        await fill(p, 't', [i ? a.fields[0].a : '']);
        if (i < 9) await p.click('#tform button[type=submit]');
      }
      await p.click('[data-act="tfin"]');
      await p.click('[data-act="tfin"]');
      await p.waitForSelector('.resq');
      const [score, max] = await p.evaluate(() => [
        wiskundefit.state.result.score,
        wiskundefit.state.result.max,
      ]);
      assert.ok(score < max && score > 0, 'de eerste vraag was leeg');
      assert.equal(await p.locator('.resq .figbox > svg').count(), 10);
      assert.equal(
        await p.locator('.resq svg[data-teken]').count(),
        0,
        'in het resultaat kun je niet tekenen',
      );
      await p.screenshot({ path: `${shotDir}teken-proeftoets-resultaat.png`, fullPage: true });
      assert.deepEqual(errors, []);
      await context.close();
    } finally {
      await browser.close();
    }
  },
);

// Punten aantikken en grafieken bij een verhaal (#286). Nog geen vraagsoort gebruikt dit, dus de test maakt de vragen
// zelf, als gegevens. Wat een tik precies doet, staat in tests/tekenvragen.test.js. Hier: dat tikken en het toetsenbord
// het verborgen veld vullen, dat het nakijken werkt, en schermafbeeldingen in licht en donker om zelf te bekijken.
test(
  'roosterpunten en grafiekpunten tik je aan, en een grafiek bij een verhaal staat goed op het scherm',
  { timeout: 60_000 },
  async () => {
    const rooster = {
      soort: 'roosterpunten',
      xr: [-4, 4],
      yr: [-3, 3],
      goed: [
        [2, -1],
        [2, 0],
        [2, 1],
      ],
      geg: [{ p: [0, 2], L: 'A' }],
    };
    const tabel = {
      soort: 'grafiekpunten',
      fig: {
        titel: 'Groei van een plant',
        x: { naam: 'tijd in weken', van: 0, tot: 8, stap: 1 },
        y: { naam: 'lengte in cm', van: 0, tot: 50, stap: 5 },
      },
      goed: [
        [0, 5],
        [2, 12.5],
        [4, 30],
      ],
      snap: [1, 2.5],
      verbind: 'kromme',
    };
    const tekenvraag = (t, tekst) => ({
      q: tekst,
      fig: tekenFig(t),
      teken: t,
      fields: [{ teken: true, a: SOORTEN[t.soort].schrijf(t, t.goed), label: 'Je punten' }],
      hint: 'Kijk goed naar het rooster.',
      steps: ['Zie de figuur.'],
    });
    const aflezen = {
      q: 'Hoeveel km had Mila om 11 uur gefietst?',
      fig: `${contextGraph({
        titel: 'Fietstocht',
        x: { naam: 'tijd in uren', van: 9, tot: 14, stap: 1 },
        y: { naam: 'afstand in km', van: 0, tot: 40, stap: 5 },
        grafieken: [
          {
            naam: 'Mila',
            punten: [
              [9, 0],
              [10, 15],
              [11, 15],
              [13, 40],
            ],
          },
          {
            naam: 'Ravi',
            vorm: 'kromme',
            punten: [
              [9, 0],
              [11, 20],
              [12, 22],
              [14, 35],
            ],
          },
        ],
        zeg: 'vorm',
      })}${contextGraph({
        schets: true,
        x: { naam: 'tijd', van: 0, tot: 8, stap: 1 },
        y: { naam: 'snelheid', van: 0, tot: 4, stap: 1 },
        grafieken: [
          {
            punten: [
              [0, 0],
              [2, 3],
              [5, 3],
              [8, 0],
            ],
            stukken: ['a', 'b', 'c'],
          },
        ],
        zeg: 'assen',
      })}`,
      fields: [{ a: 15, post: 'km' }],
      hint: 'Zoek 11 uur op de horizontale as.',
      steps: ['Om 11 uur is de afstand 15 km.'],
    };
    const browser = await launch();
    try {
      await mkdir(shotDir, { recursive: true });
      for (const kleur of ['light', 'dark']) {
        const errors = [];
        const context = await browser.newContext({
          viewport: { width: 390, height: 1100 },
          colorScheme: kleur,
        });
        const p = await context.newPage();
        p.on('pageerror', (e) => errors.push(e.message));
        await p.goto(siteUrl);
        const slug = 'lineaire-grafieken-tekenen';
        await p.evaluate((s) => wiskundefit.go({ name: 'topic', slug: s, oefen: true }), slug);
        const show = (q) =>
          p.evaluate(
            ([s, q]) => {
              // go() bewaart eerst wat er in de velden staat. Bij een vraag die de test zelf neerzet,
              // hoort het antwoord op de vorige vraag daar niet bij.
              for (const v of document.querySelectorAll('#pform input')) v.value = '';
              Object.assign(wiskundefit.state.prac[s], {
                q,
                status: 'open',
                vals: [],
                marks: null,
                msg: '',
              });
              wiskundefit.go({ name: 'topic', slug: s, oefen: true });
            },
            [slug, q],
          );
        const veld = () => p.$eval('#pf0', (e) => e.value);
        // Tikt op een plek in de figuur, in de eenheden van de viewBox, ook als de figuur geschaald is.
        const tik = async (sx, sy) => {
          const svg = await p.$('svg[data-teken]');
          const box = await svg.boundingBox();
          const w = await svg.evaluate((s) => s.viewBox.baseVal.width);
          await p.mouse.click(box.x + (sx * box.width) / w, box.y + (sy * box.width) / w);
        };
        const controleer = async () => {
          await p.click('#pform button[type=submit]');
          return p.textContent('.fb');
        };

        // Roosterpunten: een assenstelsel zoals graph() het tekent, met 26 per hokje, x vanaf 30 en y vanaf 20.
        await show(tekenvraag(rooster, 'Zet alle roosterpunten met x = 2 en y tussen −2 en 2.'));
        await p.waitForSelector('.teken-knoppen button');
        const roosterTik = ([x, y]) => tik(30 + (x + 4) * 26, 20 + (3 - y) * 26);
        // Met het toetsenbord: de cursor begint in O, twee keer naar rechts en Enter zet (2, 0).
        await p.focus('svg[data-teken]');
        await p.waitForSelector('svg[data-teken] .getekend .cursor');
        await p.keyboard.press('ArrowRight');
        await p.keyboard.press('ArrowRight');
        await p.keyboard.press('Enter');
        assert.equal(await veld(), '2,0');
        await roosterTik([2, 1]);
        await roosterTik([3, 3]);
        assert.equal(await veld(), '2,0 2,1 3,3');
        assert.doesNotMatch(await controleer(), /Goed gedaan/);
        // Haal het verkeerde punt weg en zet het laatste goede punt.
        await roosterTik([3, 3]);
        await roosterTik([2, -1]);
        assert.equal(await veld(), '2,-1 2,0 2,1');
        assert.match(await controleer(), /Goed gedaan/);
        await p.screenshot({ path: `${shotDir}teken-roosterpunten-${kleur}.png`, fullPage: true });

        // Grafiekpunten: een tik komt op de dichtstbijzijnde stap van het rooster.
        await show(tekenvraag(tabel, 'Zet de punten uit de tabel in het rooster.'));
        await p.waitForSelector('.teken-knoppen button');
        const maat = SOORTEN.grafiekpunten.maat(tabel);
        for (const [x, y] of tabel.goed) await tik(maat.X(x) + 2, maat.Y(y) - 2);
        assert.equal(await veld(), '0,5 2,12.5 4,30');
        assert.equal(await p.locator('svg[data-teken] .getekend path.l1').count(), 1);
        assert.match(await controleer(), /Goed gedaan/);
        await p.screenshot({ path: `${shotDir}teken-grafiekpunten-${kleur}.png`, fullPage: true });

        // Een grafiek bij een verhaal en een globale grafiek, als gewone figuren bij een vraag.
        await show(aflezen);
        const namen = await p.$$eval('.figbox svg[aria-label]', (els) =>
          els.map((e) => e.getAttribute('aria-label')),
        );
        assert.ok(namen.some((n) => /^Grafiek: Fietstocht\./.test(n)));
        assert.ok(namen.some((n) => /^Globale grafiek\./.test(n)));
        // De figuren passen op een telefoon zonder dat de pagina opzij schuift.
        assert.ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await p.fill('#pf0', '15');
        assert.match(await controleer(), /Goed gedaan/);
        await p.screenshot({ path: `${shotDir}grafiek-bij-verhaal-${kleur}.png`, fullPage: true });
        assert.deepEqual(errors, []);
        await context.close();
      }
    } finally {
      await browser.close();
    }
  },
);

test(
  'een groep velden en schetsen als keuzes werken bij oefenen en in de proeftoets',
  {
    timeout: 60_000,
  },
  async () => {
    // Nog geen vraagsoort gebruikt dit, dus de test maakt de vragen zelf, als gegevens.
    const sketch = (abc) =>
      graph({ xr: [-4, 4], yr: [-4, 4], u: 16, sketch: true, curves: [{ abc }], label: 'Schets' });
    const group = {
      q: 'Los op: x² − 7x − 18 = 0.',
      fig: graph({ xr: [-3, 10], yr: [-6, 6], ys: 5, curves: [{ abc: [1, -7, -18], name: 'f' }] }),
      fields: orFields([-2, 9]),
      hint: 'Ontbind in factoren.',
      steps: ['(x + 2)(x - 9) = 0'],
    };
    const choice = {
      q: 'Welke schets hoort bij y = x² − 2?',
      mc: MC([sketch([1, 0, -2]), sketch([-1, 0, 2]), sketch([1, 2, 0]), sketch([-1, 2, 0])], 0),
      hint: 'Kijk naar a en c.',
      steps: ['a > 0, dus een dalparabool.'],
    };
    const browser = await launch();
    try {
      await mkdir(shotDir, { recursive: true });
      const p = await browser.newPage({ viewport: { width: 390, height: 900 } });
      await p.goto(siteUrl);
      const slug = 'lineaire-grafieken-tekenen';
      await p.evaluate((s) => wiskundefit.go({ name: 'topic', slug: s, oefen: true }), slug);
      const show = (q) =>
        p.evaluate(
          ([s, q]) => {
            Object.assign(wiskundefit.state.prac[s], {
              q,
              status: 'open',
              vals: [],
              marks: null,
              msg: '',
            });
            wiskundefit.go({ name: 'topic', slug: s, oefen: true });
          },
          [slug, q],
        );
      const marks = () => p.$$eval('#pform .fld', (els) => els.map((e) => e.className.trim()));
      const check = async (a, b) => {
        await p.fill('#pf0', a);
        await p.fill('#pf1', b);
        await p.click('#pform button[type=submit]');
      };
      await show(group);
      assert.equal(await p.getAttribute('#pf1', 'aria-label'), 'x, tweede oplossing');
      // Twee keer hetzelfde getal: één veld goed en één fout.
      await check('9', '9');
      assert.deepEqual(await marks(), ['fld no', 'fld ok']);
      await check('5', '-2');
      assert.deepEqual(await marks(), ['fld no', 'fld ok']);
      await p.screenshot({ path: `${shotDir}groep-velden.png`, fullPage: true });
      await check('9', '-2');
      assert.match(await p.textContent('.fb'), /Goed gedaan/);

      await show(choice);
      // Elke keuze heeft de beschrijving van de schets als naam.
      const names = await p.$$eval('#pform input[type=radio]', (els) =>
        els.map((e) => e.closest('label').querySelector('svg').getAttribute('aria-label')),
      );
      assert.equal(names.length, 4);
      assert.ok(names.every((n) => /^Schets\. De grafiek is een (dal|berg)parabool/.test(n)));
      const box = await p.$$eval('#pform .opt', (els) =>
        els.map((e) => e.getBoundingClientRect().toJSON()),
      );
      // Op een telefoon twee naast elkaar.
      assert.equal(box[0].top, box[1].top);
      await p.check(`#pm${choice.mc.a}`);
      await p.click('#pform button[type=submit]');
      assert.match(await p.textContent('.fb'), /Goed gedaan/);
      await p.screenshot({ path: `${shotDir}schets-kiezen.png`, fullPage: true });

      // In een proeftoets, die als JSON wordt bewaard, en in de uitslag.
      await p.evaluate(
        ([s, qs]) => {
          // Zoals ui/exam.js een lopende proeftoets in de browser bewaart.
          const id = wiskundefit.TOPIC[s].skills[0].id;
          localStorage.setItem(
            'wiskundefit-proeftoets',
            JSON.stringify({
              v: 1,
              id: 1,
              i: 0,
              spent: 0,
              since: null,
              items: qs.map((q) => ({ q, vals: [], id })),
            }),
          );
        },
        [slug, [group, choice]],
      );
      // De bewaarde proeftoets wordt gelezen bij het openen van de site.
      await p.reload();
      await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
      await p.fill('#tf0', '9');
      await p.fill('#tf1', '5');
      await p.click('#tform button[type=submit]');
      await p.check(`#tm${choice.mc.a === 0 ? 1 : 0}`);
      await p.click('[data-act="tfin"]');
      const result = await p.evaluate(() => wiskundefit.state.result.items.map((x) => x.c.each));
      assert.deepEqual(result, [[true, false], [false]]);
      // Bij het foute veld staat het antwoord dat nog over is: −2, niet 9.
      const rows = await p.$$eval('.resq:first-child tbody tr', (trs) =>
        trs.map((tr) => tr.textContent.replace(/\s+/g, ' ').trim()),
      );
      assert.match(rows[1], /5.*−2$/);
      assert.equal(await p.$$eval('.resq .answers svg.fig', (s) => s.length), 2);
      await p.screenshot({ path: `${shotDir}groep-en-schets-uitslag.png`, fullPage: true });
    } finally {
      await browser.close();
    }
  },
);

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
    assert.equal(await p.locator('.book').count(), 4);
    assert.ok(await p.isHidden('#filters'), 'de filters staan eerst dicht');
    await p.screenshot({ path: `${shotDir}kies-uit-je-boek.png`, fullPage: true });
    await p.click('[data-act="boekfilters"]');
    assert.equal(await p.getAttribute('[data-act="boekfilters"]', 'aria-expanded'), 'true');
    await p.click('[data-act="boekfilter"][data-id="niveau:vwo"]');
    assert.equal(await status(), '3 boeken passen bij je filters');
    assert.equal(search(), '?niveau=vwo');
    await p.click('[data-act="boekfilterclear"]');
    assert.equal(await status(), '4 boeken');
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
    // Hoofdstuk 3 is deels gedekt: bij de paragraaf staat wat nog ontbreekt.
    assert.match(
      await p.textContent('label:has([data-act="para"][data-id="3.3"])'),
      /Pythagoras .* nog niet oefenen/,
    );
    assert.equal(await p.locator('[data-act="chapter"][data-id="5"]').count(), 0);
    assert.match(await p.textContent('.chapter:nth-of-type(5)'), /nog niet oefenen/);
    await fits('methode-indeling');
    await p.screenshot({ path: `${shotDir}methode-indeling.png`, fullPage: true });

    // Mijn stof: oefenen en proeftoets gaan alleen over de gekozen stof.
    await p.click('.stof-bar a');
    assert.equal(await p.locator('.stof-list .par').count(), 4);
    await fits('mijn stof');
    await p.screenshot({ path: `${shotDir}mijn-stof.png`, fullPage: true });
    await p.click('a[href="/mijn-stof/oefenen"]');
    // De vraag staat er pas als de onderwerpen van de stofkeuze geladen zijn.
    await p.waitForSelector('#pform');
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

test(
  'de hele site werkt op telefoonformaat',
  { timeout: 600_000, skip: process.env.SNEL ? 'SNEL=1' : false },
  async () => {
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

      const all = await p.evaluate(() => wiskundefit.TOPICS.map((s) => s.slug));
      const ids = all.filter((id) => !gekozen || gekozen.includes(id));
      for (const id of ids) {
        await p.evaluate(() => wiskundefit.go({ name: 'home' }));
        await checkOverflow('overzicht');
        await p.click(`a.par[href="/${id}"]`);
        // De uitleg staat er pas als het onderwerp geladen is.
        await p.waitForSelector('.topic-body');
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
        // Elke video staat er één keer, en de link bovenaan gaat naar de video's. Een onderwerp
        // zonder video's heeft geen link en geen kop.
        const videos = await p.evaluate((i) => {
          const v = wiskundefit.TOPIC[i].videos;
          return Object.values(v).flat().length;
        }, id);
        assert.equal(await p.locator('.vid-links a').count(), videos, `${id}: video's`);
        assert.equal(!!(await p.$('a[href="#videos"]')), videos > 0, `${id}: link naar de video's`);
        assert.equal(!!(await p.$('h2#videos')), videos > 0, `${id}: kop van de video's`);
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
            else await fill(p, 'p', a.fout ?? a.vals, '999');
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
      // Bij elke vraag in het resultaat staat de knop om een probleem te melden.
      assert.equal(await p.$$eval('.resq [data-act="meld"]', (e) => e.length), 10);
      await p.click('.resq:nth-child(2) [data-act="meld"]');
      await p.waitForSelector('.melden');
      assert.equal(await p.$$eval('.melden', (e) => e.length), 1);
      await p.keyboard.press('Escape');

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
      // Bij een keuze van onderwerpen telt de voortgang van die onderwerpen, bij alles het totaal.
      const kept = await p.evaluate(() => Object.keys(wiskundefit.prog.skills));
      const wanted = await p.evaluate(
        (ids) =>
          wiskundefit.TOPICS.filter((s) => ids.includes(s.slug)).flatMap((s) =>
            s.skills.map((k) => String(k.id)),
          ),
        ids,
      );
      if (gekozen)
        assert.deepEqual(
          wanted.filter((k) => !kept.includes(k)),
          [],
          'voortgang na herladen',
        );
      else assert.equal(kept.length, wanted.length, 'voortgang na herladen');

      assert.deepEqual([...overflowing], [], 'schermen die breder zijn dan de telefoon');

      // Schermafbeeldingen om zelf na te kijken.
      const shot = (page, name, fullPage = false) =>
        page.screenshot({ path: `${shotDir}${name}.png`, fullPage });
      const light = await open({ viewport: { width: 1100, height: 860 }, colorScheme: 'light' });
      await shot(light, 'overzicht');
      await light.click('a.par[href="/lineaire-grafieken-tekenen"]');
      await light.waitForSelector('.topic-body');
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
  },
);

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
      ...DOMAINS.map((d) => [
        `/${d.slug}`,
        new RegExp(d.name),
        new RegExp(`^${d.name} oefenen \\|`),
      ]),
      ...MAPPINGS.map((m) => [
        `/methode-indeling/${m.slug}`,
        new RegExp(`${m.level} ${m.year}`),
        new RegExp(`${m.level} ${m.year} \\|`),
      ]),
      ...TOPICS.flatMap((t) => [
        [`/${t.slug}`, new RegExp(t.title), new RegExp(`^${t.title} oefenen met uitleg \\|`)],
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
              // Een term wordt een knop, of gewone tekst op de pagina van zijn eigen onderwerp (#39): de
              // tekst en de plek blijven gelijk.
              if (
                m.type === 'childList' &&
                [...m.addedNodes, ...m.removedNodes].every(
                  (n) => n.nodeType === 3 || n.matches?.('.term'),
                )
              )
                return;
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

test('Zo maken we de vragen past op een telefoon, ook met alles uitgeklapt', async () => {
  const browser = await launch();
  try {
    for (const width of [320, 360, 390]) {
      const p = await browser.newPage({ viewport: { width, height: 800 } });
      await p.goto(at('/zo-maken-we-vragen'));
      await p.click('[data-act="vragenopen"][data-id="open"]');
      assert.equal(
        await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
        `${width} px: de pagina is breder dan het scherm`,
      );
      await p.close();
    }
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

test('de voortgang blijft heel in twee tabbladen, bij kapotte opslag en als opslaan mislukt', async () => {
  // Uit #56.
  const browser = await launch();
  try {
    const context = await browser.newContext();
    const errors = [];
    context.on('weberror', (e) => errors.push(e.error().message));
    const [A, B] = [await context.newPage(), await context.newPage()];
    const slug = 'verhoudingstabellen',
      practice = at(`/${slug}/oefenen?soort=41`);
    const stored = () => A.evaluate(() => JSON.parse(localStorage.getItem('lijn-driehoek-v1')));
    const answerRight = async (p) => {
      const a = await p.evaluate(
        `(${answerOf})(wiskundefit.state.prac[${JSON.stringify(slug)}].q)`,
      );
      await fill(p, 'p', a.vals);
      await p.click('#pform button[type=submit]');
      assert.match(await p.textContent('.fb'), /Goed gedaan/);
    };

    // Oefenen in A en daarna in B: allebei bewaard, en A neemt het resultaat van B over.
    await A.goto(practice);
    await B.goto(practice);
    await answerRight(A);
    await answerRight(B);
    assert.deepEqual((await stored()).skills['41'], [1, 1]);
    await A.waitForFunction(() => wiskundefit.prog.skills[41]?.length === 2);

    // Wissen in A gaat voor: B zet de oude voortgang niet terug.
    await A.goto(at('/mijn-stof'));
    await A.click('[data-act="reset1"]');
    await A.click('[data-act="reset2"]');
    await B.click('#nextq');
    await answerRight(B);
    assert.deepEqual((await stored()).skills, { 41: [1] });

    // Wat je in B aan het invullen bent, blijft staan als A iets bewaart.
    await B.click('#nextq');
    await B.fill('#pf0', '12');
    await A.goto(practice);
    await answerRight(A);
    await B.waitForFunction(() => wiskundefit.prog.skills[41]?.length === 2);
    assert.equal(await B.inputValue('#pf0'), '12');

    // Een proeftoets in twee tabbladen: elk tabblad blijft bij zijn eigen vraag, en lever je in A
    // in, dan ziet B de uitslag.
    await A.goto(at('/proeftoets'));
    await A.click('[data-act="stofall"]');
    await A.click('[data-act="len"][data-id="10"]');
    await A.click('[data-act="start"]');
    await B.goto(at('/proeftoets'));
    // Het scherm van de proeftoets laadt apart (#188). Tot dat er is, staat de vooraf gebouwde keuzepagina er nog,
    // dus wacht op de vraag in plaats van meteen te kijken (#242).
    assert.ok(
      await B.waitForSelector('#tform', { timeout: 5_000 }).catch(() => null),
      'B ziet de lopende proeftoets',
    );
    await A.click('[data-act="goto"][data-id="3"]');
    const a3 = await A.evaluate(`(${answerOf})(wiskundefit.state.test.items[3].q)`);
    if (a3.mc !== null) await A.check(`#tm${a3.mc}`);
    else await fill(A, 't', a3.vals);
    await A.click('[data-act="goto"][data-id="4"]');
    await B.waitForFunction(() => wiskundefit.state.test.items[3].vals.length > 0);
    assert.equal(await B.evaluate(() => wiskundefit.state.test.i), 0);
    await A.click('[data-act="tfin"]');
    await A.click('[data-act="tfin"]');
    await A.waitForURL(/\/proeftoets\/uitslag$/);
    await B.waitForFunction(() => !document.getElementById('tform') && wiskundefit.state.result);

    // Geldige JSON met de verkeerde vorm laat de site niet vastlopen. Alleen het kapotte deel valt
    // weg. Dat gebeurt op robots.txt, want bij het weggaan bewaart de site zelf nog.
    for (const p of [A, B]) await p.goto(at('/robots.txt'));
    await A.evaluate(() => {
      localStorage.setItem(
        'lijn-driehoek-v1',
        JSON.stringify({ v: 5, skills: { 1: 'bad', 3: [1, 0] }, stof: 'x', mapping: 'onbekend' }),
      );
      const q = { q: 'x' };
      localStorage.setItem(
        'wiskundefit-proeftoets',
        JSON.stringify({ v: 1, items: [{ id: 41, q, vals: 'bad' }], i: 0, spent: 0, since: null }),
      );
    });
    await A.goto(siteUrl);
    assert.deepEqual(await A.evaluate(() => wiskundefit.prog.skills), { 3: [1, 0] });
    await A.goto(at('/proeftoets'));
    assert.equal(await A.$('#tform'), null, 'een kapotte proeftoets begint opnieuw');
    assert.match(await A.textContent('h1'), /Proeftoets/);
    await A.goto(practice);
    await answerRight(A);
    assert.deepEqual((await stored()).skills, { 3: [1, 0], 41: [1] });
    assert.deepEqual(errors, [], 'fouten in de browserconsole');

    // Lukt opslaan niet, dan zegt de site dat, en oefenen gaat gewoon door.
    const full = await browser.newPage();
    await full.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException('De opslag is vol', 'QuotaExceededError');
      };
    });
    await full.goto(practice);
    assert.equal(await full.$('.notice'), null);
    await answerRight(full);
    assert.match(await full.textContent('main'), /niet worden bewaard/);
    await full.click('#nextq');
    await answerRight(full);
    assert.deepEqual(await full.evaluate(() => wiskundefit.prog.skills[41]), [1, 1]);
  } finally {
    await browser.close();
  }
});

test('Enter op de laatste vraag van een proeftoets laat de site niet vastlopen', async () => {
  // Uit #51: Enter op de laatste vraag zette de index voorbij de laatste vraag, ook in de opslag.
  const browser = await launch();
  try {
    const p = await browser.newPage();
    const errors = [];
    p.on('pageerror', (e) => errors.push(e.message));
    const index = () =>
      p.evaluate(() => JSON.parse(localStorage.getItem('wiskundefit-proeftoets')).i);
    await p.goto(at('/proeftoets'));
    await p.click('[data-act="stofall"]');
    await p.click('[data-act="len"][data-id="10"]');
    await p.click('[data-act="start"]');
    await p.click('[data-act="goto"][data-id="9"]');
    // Een veld, een keuzelijst of meerkeuze. Enter verstuurt het formulier, net als requestSubmit.
    const sel = (await p.$('#tf0')) ? '#tf0' : '#tm0';
    const kind = await p.$eval(sel, (el) =>
      el.type === 'radio' || el.type === 'hidden' ? el.type : el.tagName,
    );
    let kept;
    if (kind === 'hidden') {
      // Een tekening (#232): de test vult het veld zoals tikken het zou doen.
      await p.$eval(sel, (el) => (el.value = '1,1'));
      kept = async () => (await p.inputValue(sel)) === '1,1';
    } else if (kind === 'radio') {
      await p.check(sel);
      kept = () => p.isChecked(sel);
    } else if (kind === 'SELECT') {
      const value = await p.$eval(sel, (el) => el.options[el.options.length - 1].value);
      await p.selectOption(sel, value);
      kept = async () => (await p.inputValue(sel)) === value;
    } else {
      await p.fill(sel, '12');
      kept = async () => (await p.inputValue(sel)) === '12';
    }
    await p.$eval('#tform', (f) => f.requestSubmit());
    assert.equal(await index(), 9);
    assert.equal(
      await p.evaluate(() => document.activeElement.dataset.act),
      'tfin',
      'de focus staat op Inleveren',
    );
    assert.match(await p.textContent('[aria-current="step"]'), /^10$/);
    assert.equal(new URL(p.url()).pathname, '/proeftoets', 'nog niet ingeleverd');

    // Weg en terug, en herladen: dezelfde vraag, met het antwoord nog ingevuld.
    await p.goto(siteUrl);
    await p.goto(at('/proeftoets'));
    await p.reload();
    assert.equal(await index(), 9);
    assert.ok(await kept(), 'het antwoord is bewaard');

    // Een bewaarde proeftoets met een index buiten de lijst, of zonder vragen, begint opnieuw.
    // Dat gebeurt op robots.txt, want bij het weggaan bewaart de site de proeftoets zelf nog.
    for (const broken of [{ i: 99 }, { i: -1 }, { i: 1.5 }, { items: [] }]) {
      await p.goto(at('/robots.txt'));
      await p.evaluate((broken) => {
        const t = JSON.parse(localStorage.getItem('wiskundefit-proeftoets'));
        localStorage.setItem('wiskundefit-proeftoets', JSON.stringify({ ...t, ...broken }));
      }, broken);
      await p.goto(at('/proeftoets'));
      assert.ok(await p.$('[data-act="start"]'), `opnieuw beginnen bij ${JSON.stringify(broken)}`);
      await p.click('[data-act="start"]');
    }

    // Uit #52: een half ingevulde vraag telt niet als ingevuld. Inleveren waarschuwt dan ook.
    await p.click('[data-act="tstop1"]');
    await p.click('[data-act="tstop2"]');
    await p.click('[data-act="len"][data-id="30"]');
    await p.click('[data-act="start"]');
    const k = await p.evaluate(() =>
      wiskundefit.state.test.items.findIndex(
        (x) => !x.q.mc && x.q.fields.length >= 2 && !x.q.fields[0].sel,
      ),
    );
    assert.ok(k >= 0, 'een vraag met twee velden');
    for (let j = 0; j < 30; j++) {
      if (j === k) continue;
      await p.click(`[data-act="goto"][data-id="${j}"]`);
      if (await p.$('#tm0')) await p.check('#tm0');
      // Een tekening (#232) vult de test zoals tikken het zou doen.
      else if (await p.$('#tf0[data-teken]'))
        await p.$eval(
          '#tf0',
          (e) => (e.value = wiskundefit.state.test.items[wiskundefit.state.test.i].q.fields[0].a),
        );
      else
        for (const el of await p.$$('#tform select, #tform input[type="text"]'))
          (await el.evaluate((e) => e.tagName)) === 'SELECT'
            ? await el.selectOption({ index: 1 })
            : await el.fill('1');
    }
    await p.click(`[data-act="goto"][data-id="${k}"]`);
    await p.fill('#tf0', '3');
    await p.click('[data-act="tfin"]');
    assert.match(await p.textContent('#tfb'), /Je hebt nog 1 vraag half ingevuld\./);
    assert.equal(
      await p.getAttribute(`[data-act="goto"][data-id="${k}"]`, 'aria-label'),
      `Vraag ${k + 1}, half ingevuld`,
    );
    assert.equal(new URL(p.url()).pathname, '/proeftoets', 'nog niet ingeleverd');
    assert.deepEqual(errors, [], 'fouten in de browserconsole');
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

test('het getal bij een soort rolt alleen als het verandert', async () => {
  const browser = await launch();
  try {
    const { slug, skills } = TOPICS[0];
    const id = skills[0].id;
    const answer = async (p, goed) => {
      const a = await p.evaluate(
        `(${answerOf})(wiskundefit.state.prac[${JSON.stringify(slug)}].q)`,
      );
      if (a.mc !== null) await p.check(`#pm${goed ? a.mc : a.mc === 0 ? 1 : 0}`);
      else await fill(p, 'p', goed ? a.vals : (a.fout ?? a.vals), goed ? undefined : '999');
      await p.click('#pform button[type=submit]');
    };
    const roll = (p) =>
      p.evaluate((i) => {
        const n = document.querySelector(`.chip[data-id="${i}"] .n.gewijzigd`);
        if (!n) return null;
        const r = n.querySelector('.roll');
        return {
          richting: r.classList.contains('op') ? 'op' : 'neer',
          nieuw: r.querySelector('.kol > span:not(.oud)').textContent,
          oud: r.querySelector('.oud').textContent,
          oudVoorSchermlezer: r.querySelector('.oud').getAttribute('aria-hidden'),
          tekst: n.textContent,
        };
      }, id);
    const next = async (p) => {
      await p.click('#nextq');
    };

    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await p.goto(at(`/${slug}/oefenen?soort=${id}`));
    // Meer goed: het nieuwe getal komt van boven.
    await answer(p, true);
    assert.deepEqual(await roll(p), {
      richting: 'op',
      nieuw: '1',
      oud: '0',
      oudVoorSchermlezer: 'true',
      tekst: '10/5',
    });
    assert.equal(await p.textContent('#laadmelding'), 'Bij deze soort nu 1 van 5 goed.');
    assert.equal(
      await p.evaluate(() => document.activeElement.id),
      'nextq',
      'de focus blijft staan',
    );
    assert.ok(
      await p.evaluate(() => document.getAnimations().some((a) => a.animationName === 'roll-op')),
      'met beweging rolt het getal',
    );
    // Een volgende render, zoals een klik op de hint, herhaalt de beweging niet.
    await next(p);
    assert.equal(await roll(p), null);
    for (let n = 2; n <= 5; n++) {
      await answer(p, true);
      assert.equal((await roll(p)).nieuw, String(n));
      await next(p);
    }
    // Al 5/5: nog een goed antwoord verandert niets.
    await answer(p, true);
    assert.equal(await roll(p), null, 'bij 5/5 blijft het 5/5');
    await next(p);
    // Een fout antwoord laat het oudste goede antwoord vallen: minder goed, het nieuwe komt van onder.
    await answer(p, false);
    assert.deepEqual((({ richting, nieuw, oud }) => ({ richting, nieuw, oud }))(await roll(p)), {
      richting: 'neer',
      nieuw: '4',
      oud: '5',
    });
    assert.equal(await p.textContent('#laadmelding'), 'Bij deze soort nu 4 van 5 goed.');
    // Nog een keer proberen telt niet mee, dus ook geen beweging.
    await p.click('[data-act="show"]');
    assert.equal(await roll(p), null);
    // Toon uitwerking telt bij een eerste poging als fout, en het getal rolt dan ook.
    await next(p);
    await p.click('[data-act="show"]');
    assert.deepEqual((({ richting, nieuw, oud }) => ({ richting, nieuw, oud }))(await roll(p)), {
      richting: 'neer',
      nieuw: '3',
      oud: '4',
    });
    await p.close();

    // Zonder beweging komt het nieuwe getal rustig in beeld en rolt er niets.
    const calm = await browser.newContext({ reducedMotion: 'reduce' });
    const cp = await calm.newPage();
    await cp.goto(at(`/${slug}/oefenen?soort=${id}`));
    await answer(cp, true);
    assert.equal((await roll(cp)).nieuw, '1');
    assert.equal(
      await cp.evaluate(() => getComputedStyle(document.querySelector('.roll .oud')).display),
      'none',
      'het oude getal is niet te zien',
    );
    assert.ok(
      await cp.evaluate(() => document.getAnimations().every((a) => a.animationName !== 'roll-op')),
      'er is geen rolbeweging',
    );
    await calm.close();
  } finally {
    await browser.close();
  }
});

test('5 goede antwoorden achter elkaar geven een plaatje, en een fout begint opnieuw', async () => {
  const browser = await launch();
  try {
    const { slug, skills } = TOPICS[0];
    const id = skills[0].id;
    const answer = async (p, goed) => {
      const a = await p.evaluate(
        `(${answerOf})(wiskundefit.state.prac[${JSON.stringify(slug)}].q)`,
      );
      if (a.mc !== null) await p.check(`#pm${goed ? a.mc : a.mc === 0 ? 1 : 0}`);
      else await fill(p, 'p', goed ? a.vals : (a.fout ?? a.vals), goed ? undefined : '999');
      await p.click('#pform button[type=submit]');
    };
    const reeks = (p) => p.getAttribute('.reeks', 'aria-label');
    const gezien = (p) => p.evaluate(() => wiskundefit.prog.iconen);
    const goed = async (p) => {
      await answer(p, true);
      await p.click('#nextq');
    };

    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await p.goto(at(`/${slug}/oefenen?soort=${id}`));
    assert.equal(await p.$('.reeks'), null, 'zonder poging nog geen balk');
    for (let n = 1; n <= 4; n++) {
      await answer(p, true);
      assert.equal(await reeks(p), `${n} van 5 achter elkaar goed`);
      assert.equal(await p.$('.icoon'), null, `${n}: nog geen plaatje`);
      // Na de animatie is elk vakje weer klein. De algemene klasse pop van de popup met uitleg maakte het nieuwe
      // vakje 28 bij 24 pixels groot, met een rand (#218).
      await p.waitForTimeout(700);
      assert.deepEqual(
        await p.$$eval('.reeks .seg', (e) =>
          e.map((x) => [
            Math.round(x.getBoundingClientRect().width),
            Math.round(x.getBoundingClientRect().height),
          ]),
        ),
        Array(5).fill([11, 7]),
        `${n}: alle vakjes zijn 11 bij 7`,
      );
      await p.click('#nextq');
    }
    // De vijfde: het plaatje verschijnt, de balk begint opnieuw en het wordt bewaard.
    await answer(p, true);
    assert.ok(await p.$('.reeks.klaar .icoon.toon'), 'het plaatje verschijnt');
    assert.equal(await reeks(p), '0 van 5 achter elkaar goed');
    assert.equal(await p.textContent('#laadmelding'), '5 achter elkaar goed!');
    assert.equal(
      await p.evaluate(() => document.activeElement.id),
      'nextq',
      'de focus blijft staan',
    );
    const eerste = await gezien(p);
    assert.equal(
      Object.values(eerste).reduce((t, n) => t + n, 0),
      1,
    );
    assert.ok(
      await p.evaluate(() =>
        /"iconen":\{"[a-z-]+":1\}/.test(localStorage.getItem('lijn-driehoek-v1')),
      ),
      'bewaard in de browser',
    );
    // Een volgende render, zoals een klik op de hint, laat het plaatje niet opnieuw zien.
    await p.click('#nextq');
    assert.equal(await p.$('.icoon'), null);
    assert.equal(await reeks(p), '0 van 5 achter elkaar goed');

    // Twee goed en dan een fout: de balk loopt leeg en begint weer bij 0.
    await goed(p);
    await goed(p);
    assert.equal(await reeks(p), '2 van 5 achter elkaar goed');
    await answer(p, false);
    assert.equal(await reeks(p), '0 van 5 achter elkaar goed');
    assert.ok(await p.$('.reeks.leeg'), 'de balk loopt leeg');
    // Een tweede poging telt niet mee, ook niet als die goed is.
    await answer(p, true);
    assert.equal(await reeks(p), '0 van 5 achter elkaar goed');
    await p.click('#nextq');
    // Toon uitwerking bij een eerste poging telt als fout.
    await goed(p);
    await p.click('[data-act="show"]');
    assert.equal(await reeks(p), '0 van 5 achter elkaar goed');
    await p.click('#nextq');

    // Nog vijf goed: dezelfde teller loopt door, en de reeks na een herlaad begint opnieuw.
    for (let n = 0; n < 5; n++) await goed(p);
    assert.equal(
      Object.values(await gezien(p)).reduce((t, n) => t + n, 0),
      2,
    );
    await p.reload();
    assert.equal(
      Object.values(await gezien(p)).reduce((t, n) => t + n, 0),
      2,
      'ook na herladen',
    );

    // Voortgang wissen wist ook de plaatjes.
    await p.goto(at('/mijn-stof'));
    await p.click('[data-act="reset1"]');
    await p.click('[data-act="reset2"]');
    assert.deepEqual(await gezien(p), {});
    await p.close();

    // Zonder beweging staat het plaatje rustig stil en loopt de balk meteen leeg.
    const calm = await browser.newContext({ reducedMotion: 'reduce' });
    const cp = await calm.newPage();
    await cp.goto(at(`/${slug}/oefenen?soort=${id}`));
    for (let n = 0; n < 4; n++) await goed(cp);
    await answer(cp, true);
    assert.ok(await cp.$('.icoon.toon'));
    assert.ok(
      await cp.evaluate(() =>
        document
          .getAnimations()
          .every((a) => !['icoon-op', 'seg-leeg', 'seg-pop'].includes(a.animationName)),
      ),
      'geen zwevende of schuivende beweging',
    );
    assert.equal(
      await cp.evaluate(() =>
        [...document.querySelectorAll('.reeks .seg')].every(
          (s) =>
            getComputedStyle(s).backgroundColor ===
            getComputedStyle(document.querySelector('.reeks .seg')).backgroundColor,
        ),
      ),
      true,
      'alle vakjes zijn leeg',
    );
    await calm.close();
  } finally {
    await browser.close();
  }
});

test('een probleem melden opent een paneel met links naar GitHub en e-mail', async () => {
  const browser = await launch();
  try {
    const errors = [];
    const { slug, skills } = TOPICS[0];
    const link = `/${slug}/oefenen?soort=${skills[0].id}&seed=k3x9q`;
    for (const [naam, viewport] of [
      ['telefoon', { width: 390, height: 800 }],
      ['computer', { width: 1200, height: 800 }],
    ]) {
      const p = await browser.newPage({ viewport });
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(at(link));
      const typed = await p.$('input#pf0');
      if (typed) await typed.fill('12');
      await p.screenshot({ path: `${shotDir}melden-${naam}-knop.png` });
      await p.click('[data-act="meld"]');
      await p.waitForSelector('.melden');
      // Het paneel schuift in. Meet pas als dat klaar is.
      const klaar = () =>
        p.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
      await klaar();
      assert.equal(await p.evaluate(() => document.activeElement.id), 'meldkop');
      // Er is niets voorgekozen, en de knoppen wachten tot je kiest.
      assert.equal(await p.$$eval('input[name="meldwat"]:checked', (e) => e.length), 0);
      assert.equal(await p.$$eval('.melden-voet button:disabled', (e) => e.length), 2);
      await p.screenshot({ path: `${shotDir}melden-${naam}-leeg.png` });
      await p.click('.melden-wat label:nth-of-type(2)');
      await p.click('#meldtekst');
      await p.keyboard.type('Ik kom op 3x uit.');
      // Typen en kiezen laat het paneel niet opnieuw inschuiven en de cursor blijft achteraan.
      assert.equal(await p.evaluate(() => document.getAnimations().length), 0);
      assert.equal(await p.evaluate(() => document.getElementById('meldtekst').selectionStart), 17);
      const gh = new URL(await p.getAttribute('#meldgh', 'href'));
      assert.equal(gh.searchParams.get('template'), 'vraagmelding.yml');
      assert.equal(gh.searchParams.get('toelichting'), 'Ik kom op 3x uit.');
      assert.equal(
        gh.searchParams.get('vraag'),
        at(link).replace(/^http:\/\/[^/]+/, 'https://wiskundefit.nl'),
      );
      assert.match(await p.getAttribute('#meldmail', 'href'), /^mailto:contact@wiskundefit\.nl\?/);
      // Het typen ging door de render heen: de focus en de tekst staan er nog.
      assert.equal(await p.evaluate(() => document.activeElement.id), 'meldtekst');
      assert.equal(await p.inputValue('#meldtekst'), 'Ik kom op 3x uit.');
      assert.equal(
        await p.evaluate(() => getComputedStyle(document.documentElement).overflow),
        'hidden',
      );
      await p.screenshot({ path: `${shotDir}melden-${naam}.png` });
      // De breedte van de kier links van het paneel.
      const kier = await p.$eval('.melden', (e) => e.getBoundingClientRect().left);
      if (naam === 'telefoon') assert.equal(Math.round(kier), 44, 'een smalle kier links');
      else assert.equal(Math.round(kier), viewport.width - 520, 'op een computer 520px breed');
      // Escape sluit het paneel en de focus gaat terug naar de knop. Wat je typte blijft staan.
      await p.keyboard.press('Escape');
      assert.equal(await p.$('.melden'), null);
      assert.equal(await p.evaluate(() => document.activeElement.dataset.act), 'meld');
      if (typed) assert.equal(await p.inputValue('input#pf0'), '12', 'wat je typte blijft staan');
      // Een klik in de kier sluit het ook, en daarna kun je weer scrollen.
      await p.click('[data-act="meld"]');
      await p.waitForSelector('.melden');
      await p.mouse.click(5, viewport.height / 2);
      assert.equal(await p.$('.melden'), null);
      assert.equal(
        await p.evaluate(() => getComputedStyle(document.documentElement).overflow),
        'visible',
      );
      // Ook de knop > sluit het paneel, en de Tab blijft binnen het paneel.
      await p.click('[data-act="meld"]');
      await p.waitForSelector('.melden');
      for (let i = 0; i < 12; i++) {
        await p.keyboard.press('Tab');
        assert.ok(
          await p.evaluate(() => !!document.activeElement.closest('.melden')),
          'Tab blijft in het paneel',
        );
      }
      for (let i = 0; i < 12; i++) {
        await p.keyboard.press('Shift+Tab');
        assert.ok(
          await p.evaluate(() => !!document.activeElement.closest('.melden')),
          'Shift+Tab blijft in het paneel',
        );
      }
      await p.click('.melden-sluit');
      assert.equal(await p.$('.melden'), null);
      // Wat je typte blijft bewaard als je het paneel weer opent bij dezelfde vraag.
      await p.click('[data-act="meld"]');
      await p.waitForSelector('.melden');
      assert.equal(await p.inputValue('#meldtekst'), 'Ik kom op 3x uit.');
      assert.equal(await p.$$eval('input[name="meldwat"]:checked', (e) => e.length), 1);
      await p.keyboard.press('Escape');
      await p.close();
    }
    assert.deepEqual(errors, [], 'fouten in de browserconsole');
  } finally {
    await browser.close();
  }
});

test('de Rekenhulp rekent en neemt de uitkomst over in het veld', async () => {
  const browser = await launch();
  try {
    const errors = [];
    const link = '/lineaire-formule-opstellen/oefenen?soort=5&seed=k3x9q';
    for (const [naam, viewport, kleur] of [
      ['telefoon', { width: 390, height: 700 }, 'light'],
      ['telefoon-donker', { width: 390, height: 700 }, 'dark'],
      ['computer', { width: 1200, height: 800 }, 'light'],
    ]) {
      const ctx = await browser.newContext({
        reducedMotion: 'reduce',
        viewport,
        colorScheme: kleur,
      });
      const p = await ctx.newPage();
      p.on('pageerror', (e) => errors.push(e.message));
      p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await p.goto(at(link));
      await p.waitForSelector('#pform');
      // Het paneel is er pas als je de knop gebruikt, want de code laadt dan pas.
      assert.equal(await p.$('#rekenhulp'), null, 'nog geen paneel');
      assert.equal(await p.getAttribute('[data-act="rekenhulp"]', 'aria-expanded'), 'false');
      await p.click('[data-act="rekenhulp"]');
      await p.waitForSelector('#rekenhulp:not([hidden])');
      assert.equal(await p.getAttribute('[data-act="rekenhulp"]', 'aria-expanded'), 'true');
      // Snel tikken op de toetsen mag niet inzoomen (#241). Dat zelf zie je alleen op een echte telefoon.
      assert.equal(
        await p.$eval('#rekenhulp', (e) => getComputedStyle(e).touchAction),
        'manipulation',
        'geen dubbeltik-zoom op het paneel',
      );
      assert.equal(
        await p.evaluate(() => document.activeElement.id),
        'rh-titel',
        'focus op de kop',
      );
      assert.equal(
        await p.$$eval('#rh-toetsen .rh-toets', (e) => e.length),
        25,
        'uitgebreid heeft 5 extra toetsen',
      );
      // De vraag en de velden blijven boven het paneel zichtbaar. De pagina schuift zacht, dus wacht tot ze stilstaat.
      for (let y = -1, nu = 0; nu !== y;) {
        y = nu;
        await p.waitForTimeout(150);
        nu = await p.evaluate(() => scrollY);
      }
      const boven = await p.$eval('#rekenhulp', (e) => e.getBoundingClientRect().top);
      for (const bottom of await p.$$eval('#pform .fld input', (e) =>
        e.map((i) => i.getBoundingClientRect().bottom),
      ))
        assert.ok(bottom <= boven, `veld boven het paneel (${bottom} <= ${boven})`);
      if (naam === 'computer')
        assert.ok(
          (await p.$eval('#rekenhulp', (e) => e.getBoundingClientRect().width)) <= 900,
          'niet breder dan de pagina',
        );
      // In de donkere modus gebruikt het paneel de kleuren van de site.
      const bg = await p.$eval('#rekenhulp', (e) => getComputedStyle(e).backgroundColor);
      assert.equal(bg, kleur === 'dark' ? 'rgb(22, 35, 58)' : 'rgb(255, 255, 255)');
      const toets = (...ks) =>
        ks.reduce(
          (w, k) => w.then(() => p.click(`#rh-toetsen [data-k="${k}"]`)),
          Promise.resolve(),
        );
      // 3 × −2 = −6, en de uitkomst gaat naar het eerste veld; het doel springt naar het volgende lege veld.
      await toets('3', '×', '−', '2');
      assert.equal(await p.textContent('#rh-uit'), '= −6');
      await p.click('#rh-neem');
      assert.equal(await p.inputValue('#pf0'), '−6');
      assert.equal(await p.textContent('#rh-doel'), 'b = (2/2)');
      await toets('C', '5', '+', '4');
      await p.click('#rh-neem');
      assert.equal(await p.inputValue('#pf1'), '9');
      // Er is geen afronden en geen breuk: een uitkomst met veel cijfers komt er met alle cijfers in.
      await toets('C', '√', '5', '0');
      await p.click('#rh-neem');
      assert.equal(await p.inputValue('#pf1'), '7,07106781187');
      await toets('C', '2', '÷', '3');
      assert.equal(await p.textContent('#rh-uit'), '= 0,666666666667');
      assert.equal(await p.$('#rh-neem-breuk'), null);
      // Een som die niet kan, geeft een melding en niets om over te nemen.
      // Zolang je typt, staat er geen melding. Pas na = komt die, en bij de volgende toets is hij weg.
      await toets('C', '5', '÷', '0');
      assert.equal(await p.textContent('#rh-uit'), '');
      await toets('=');
      assert.equal(await p.textContent('#rh-uit'), 'Delen door 0 kan niet.');
      assert.equal(await p.isDisabled('#rh-neem'), true);
      await toets(',', '5');
      assert.equal(await p.textContent('#rh-uit'), '= 10', '5÷0,5 is geen fout meer');
      await toets('C', '5', '+');
      assert.equal(
        await p.textContent('#rh-uit'),
        '',
        'een som die niet af is, geeft geen melding',
      );
      await toets('=');
      assert.equal(await p.textContent('#rh-uit'), 'Dat begrijp ik niet.');
      await toets('3');
      assert.equal(
        await p.textContent('#rh-uit'),
        '= 8',
        'de melding verdwijnt bij de volgende toets',
      );
      await toets('C', '5', '÷', '0', '=');
      await p.screenshot({ path: `${shotDir}rekenhulp-${naam}.png` });
      // Het gewone toetsenbord werkt als de focus in het paneel staat.
      await p.focus('#rh-titel');
      await p.keyboard.press('Delete');
      await p.keyboard.type('2*(3+4)');
      assert.equal(await p.textContent('#rh-som'), '2×(3+4)');
      await p.keyboard.press('Enter');
      assert.equal(await p.textContent('#rh-uit'), '= 14');
      // Escape sluit het paneel, en de focus gaat terug naar de knop.
      await p.keyboard.press('Escape');
      assert.equal(await p.$eval('#rekenhulp', (e) => e.hidden), true);
      assert.equal(await p.evaluate(() => document.activeElement.dataset.act), 'rekenhulp');
      assert.equal(
        await p.evaluate(() => document.documentElement.classList.contains('rh-open')),
        false,
      );
      // Open weer, ga naar een volgende vraag: het paneel blijft open en begint opnieuw.
      await p.click('[data-act="rekenhulp"]');
      await toets('7');
      await p.click('[data-act="show"]');
      await p.click('#nextq');
      await p.waitForSelector('#pform');
      assert.equal(await p.$eval('#rekenhulp', (e) => e.hidden), false, 'het paneel blijft open');
      assert.equal(await p.textContent('#rh-som'), '0');
      // De focus gaat naar de vraag en niet naar het veld, anders opent op een telefoon het toetsenbord over het paneel.
      assert.equal(await p.evaluate(() => document.activeElement.id), 'pq');
      // Een scherm zonder vraag sluit het paneel.
      await p.evaluate(() => window.wiskundefit.go({ name: 'home' }));
      assert.equal(await p.$eval('#rekenhulp', (e) => e.hidden), true);
      await ctx.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test('de Rekenhulp houdt zich aan de velden: groep, typen, vergrendeld, HTML, landschap en laden', async () => {
  const browser = await launch();
  try {
    const errors = [];
    // Een vraag met een groep velden, zoals x = −2 ∨ x = 9.
    let groep = null;
    for (const t of TOPICS) {
      for (const k of t.skills) {
        if (!k.gen || groep) continue;
        for (const seed of ['a1', 'b2', 'c3', 'd4']) {
          const q = makeQuestion(k, seed);
          if (!groep && q.fields?.some((f) => f.grp != null))
            groep = `/${t.slug}/oefenen?soort=${k.id}&seed=${seed}`;
        }
      }
    }
    assert.ok(groep, 'er is een vraag met een groep velden');
    const link = '/lineaire-formule-opstellen/oefenen?soort=5&seed=k3x9q';
    const open = async (p, url) => {
      await p.goto(at(url));
      await p.waitForSelector('#pform');
      await p.click('[data-act="rekenhulp"]');
      await p.waitForSelector('#rekenhulp:not([hidden])');
    };
    const toets = (p, ...ks) =>
      ks.reduce((w, k) => w.then(() => p.click(`#rh-toetsen [data-k="${k}"]`)), Promise.resolve());
    {
      // Een groep: de uitkomsten gaan na elkaar in de lege velden.
      const p = await browser.newPage({
        reducedMotion: 'reduce',
        viewport: { width: 390, height: 800 },
      });
      p.on('pageerror', (e) => errors.push(e.message));
      await open(p, groep);
      const n = await p.$$eval('#pform .fld input[type="text"]', (e) => e.length);
      assert.ok(n >= 2, 'een groep heeft meer dan één veld');
      await toets(p, '4', '+', '3');
      await p.click('#rh-neem');
      await toets(p, 'C', '8', '−', '1');
      await p.click('#rh-neem');
      assert.deepEqual(
        await p.$$eval('#pform .fld input[type="text"]', (e) => e.slice(0, 2).map((i) => i.value)),
        ['7', '7'],
      );
      await p.close();
    }
    {
      // Zonder Rekenhulp gaat de focus bij Volgende vraag naar het eerste veld, zoals altijd.
      const p = await browser.newPage({
        reducedMotion: 'reduce',
        viewport: { width: 390, height: 800 },
      });
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(at(link));
      await p.waitForSelector('#pform');
      await p.click('[data-act="show"]');
      await p.click('#nextq');
      await p.waitForSelector('#pf0');
      assert.equal(await p.evaluate(() => document.activeElement.id), 'pf0');
      await p.close();
    }
    {
      // Zelf in het veld typen verandert de kop van het paneel, en wat je typt is nooit HTML.
      const p = await browser.newPage({
        reducedMotion: 'reduce',
        viewport: { width: 390, height: 800 },
      });
      p.on('pageerror', (e) => errors.push(e.message));
      let dialoog = false;
      p.on('dialog', () => (dialoog = true));
      await open(p, link);
      await p.fill('#pf0', '12');
      assert.equal(await p.textContent('#rh-doel'), 'a = (1/2)');
      assert.equal(await p.textContent('#rh-invwaarde'), '12');
      await p.fill('#pf0', '<img src=x onerror="alert(1)">');
      await p.waitForTimeout(100);
      assert.equal(await p.$('#rh-invwaarde img'), null, 'geen HTML in het paneel');
      assert.match(await p.textContent('#rh-invwaarde'), /<img src=x/);
      assert.equal(dialoog, false);
      // Een veld met een eenheid erachter krijgt de tekst ervoor als naam, zonder de eenheid.
      await p.close();
    }
    {
      // Na Toon uitwerking zijn de velden vergrendeld: er valt niets meer over te nemen.
      const p = await browser.newPage({
        reducedMotion: 'reduce',
        viewport: { width: 390, height: 800 },
      });
      p.on('pageerror', (e) => errors.push(e.message));
      await open(p, link);
      await p.click('[data-act="show"]');
      await p.waitForSelector('.sol');
      await toets(p, '7');
      assert.equal(await p.isDisabled('#rh-neem'), true, 'geen veld om in te vullen');
      assert.equal(await p.textContent('#rh-doel'), '');
      assert.equal(
        await p.$$eval('#pform .fld input', (e) => e.filter((i) => i.value).length),
        0,
        'er is niets ingevuld',
      );
      await p.close();
    }
    {
      // Een telefoon in landschap: het paneel staat rechts, past op het scherm en je kunt het sluiten.
      const p = await browser.newPage({
        reducedMotion: 'reduce',
        viewport: { width: 740, height: 360 },
      });
      p.on('pageerror', (e) => errors.push(e.message));
      await open(p, link);
      const r = await p.$eval('#rekenhulp', (e) => {
        const b = e.getBoundingClientRect();
        const s = e.querySelector('.rh-sluit').getBoundingClientRect();
        return {
          top: b.top,
          bottom: b.bottom,
          left: b.left,
          right: b.right,
          sluit: [s.top, s.bottom, s.left, s.right],
        };
      });
      assert.equal(Math.round(r.top), 0);
      assert.ok(r.bottom <= 360 + 1, 'past in de hoogte');
      assert.ok(r.right <= 740 + 1 && r.left > 200, 'staat rechts');
      assert.ok(r.sluit[0] >= 0 && r.sluit[1] <= 360, 'de sluitknop is te zien');
      await p.screenshot({ path: `${shotDir}rekenhulp-landschap.png` });
      await p.click('.rh-sluit');
      assert.equal(await p.$eval('#rekenhulp', (e) => e.hidden), true);
      await p.close();
    }
    {
      // Lukt het laden niet, dan is er een melding, en een nieuwe klik probeert het opnieuw. Twee klikken na elkaar
      // tijdens het laden openen en sluiten het paneel niet meteen weer.
      const p = await browser.newPage({
        reducedMotion: 'reduce',
        viewport: { width: 390, height: 800 },
      });
      p.on('pageerror', (e) => errors.push(e.message));
      await p.goto(at(link));
      await p.waitForSelector('#pform');
      const bestand = '**/assets/rekenhulp-*.js';
      await p.route(bestand, (route) => route.abort());
      await p.click('[data-act="rekenhulp"]');
      await p.waitForFunction(() =>
        /kon niet worden geladen/.test(document.getElementById('laadmelding').textContent),
      );
      assert.equal(await p.$('#rekenhulp'), null, 'geen paneel');
      await p.unroute(bestand);
      let loslaten;
      const poort = new Promise((resolve) => (loslaten = resolve));
      await p.route(bestand, async (route) => {
        await poort;
        await route.continue();
      });
      await p.click('[data-act="rekenhulp"]');
      await p.click('[data-act="rekenhulp"]');
      loslaten();
      await p.waitForSelector('#rekenhulp:not([hidden])');
      await p.waitForTimeout(200);
      assert.equal(
        await p.$eval('#rekenhulp', (e) => e.hidden),
        false,
        'twee klikken laten het paneel open',
      );
      await p.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test('het tabblad Toetsenbord typt in het veld, en het toetsenbord van het systeem blijft weg', async () => {
  const browser = await launch();
  try {
    const errors = [];
    const link = '/lineaire-formule-opstellen/oefenen?soort=5&seed=k3x9q';
    // Op een telefoon (volledig scherm, #222) opent het paneel vanzelf en is er geen knop.
    const open = async (p, telefoon = false) => {
      await p.goto(at(link));
      await p.waitForSelector('#pform');
      if (!telefoon) await p.click('[data-act="rekenhulp"]');
      await p.waitForSelector('#rekenhulp:not([hidden])');
    };
    const waarde = (p, i) => p.inputValue(`#pf${i}`);
    const toets = (p, ...ks) =>
      ks.reduce((w, k) => w.then(() => p.click(`.rh [data-k="V:${k}"]`)), Promise.resolve());
    {
      // Met een muis: de tabbladen, de toetsen en wat er in het veld komt.
      const p = await browser.newPage({
        reducedMotion: 'reduce',
        viewport: { width: 390, height: 700 },
      });
      p.on('pageerror', (e) => errors.push(e.message));
      await open(p);
      assert.equal(await p.getAttribute('#rh-tab-rekenen', 'aria-selected'), 'true');
      assert.equal(await p.getAttribute('#rh-tab-toetsenbord', 'aria-selected'), 'false');
      // Zolang de Rekenhulp open staat, opent een veld geen toetsenbord van het systeem.
      assert.deepEqual(
        await p.$$eval('#pform .fld input', (e) => e.map((i) => i.getAttribute('inputmode'))),
        ['none', 'none'],
      );
      const hoogte = await p.$eval('#rekenhulp', (e) => e.offsetHeight);
      // Een muisklik in een veld verandert het tabblad niet.
      await p.click('#pf1');
      assert.equal(await p.getAttribute('#rh-tab-rekenen', 'aria-selected'), 'true');
      await p.click('#rh-tab-toetsenbord');
      assert.equal(await p.getAttribute('#rh-tab-toetsenbord', 'aria-selected'), 'true');
      assert.equal(
        await p.$eval('#rekenhulp', (e) => e.offsetHeight),
        hoogte,
        'het paneel blijft even hoog',
      );
      assert.equal(await p.isVisible('.rh-invtoetsen'), true);
      assert.equal(await p.isVisible('#rh-toetsen'), false, 'de toetsen van het rekenen zijn weg');
      // Het doel is veld b (daar klikte je in): een negatief getal en een gemengd getal.
      assert.equal(await p.textContent('#rh-invnaam'), 'b = (2/2)');
      await toets(p, '5', 'TEKEN');
      assert.equal(await waarde(p, 1), '−5');
      assert.equal(await p.textContent('#rh-invwaarde'), '−5');
      await toets(p, 'TEKEN');
      assert.equal(await waarde(p, 1), '5');
      await toets(p, 'WIS', ' ', '1', ' ', '1', '/', '/', ',', '2');
      // Een spatie komt alleen na een cijfer, en een breukstreep of komma maar één keer.
      assert.equal(await waarde(p, 1), '1 1/2');
      await toets(p, ' ', ',', '/');
      assert.equal(await waarde(p, 1), '1 1/2');
      // Duizendtallen met spaties, zoals 1 250 000, zijn ook te typen. Een komma kan niet direct na een spatie.
      await toets(p, 'WIS', 'WIS', 'WIS', 'WIS', 'WIS');
      assert.equal(await waarde(p, 1), '');
      await toets(p, '1', ' ', ',', '2', '5', '0', ' ', '0', '0', '0');
      assert.equal(await waarde(p, 1), '1 250 000');
      await toets(p, 'WIS', 'WIS', 'WIS', 'WIS', 'WIS', 'WIS', 'WIS', 'WIS', 'WIS');
      await toets(p, '1', ' ', '1', '/', '2');
      await toets(p, 'WIS', 'WIS');
      assert.equal(await waarde(p, 1), '1 1');
      await toets(p, 'WIS', 'WIS', ',', ',', '5');
      assert.equal(await waarde(p, 1), '1,5');
      // Leeg maakt het hele veld leeg.
      await toets(p, 'LEEG');
      assert.equal(await waarde(p, 1), '');
      await toets(p, '1', ',', '5');
      assert.equal(await waarde(p, 1), '1,5');
      // Volgende gaat naar het volgende veld, en rond na het laatste weer naar het eerste.
      await toets(p, 'VOLGENDE');
      assert.equal(await p.textContent('#rh-invnaam'), 'a = (1/2)');
      await toets(p, 'TEKEN', '3');
      assert.equal(await waarde(p, 0), '−3');
      // Het gewone toetsenbord typt ook in het veld, als de focus in het paneel staat.
      await p.focus('#rh-titel');
      await p.keyboard.type('4');
      assert.equal(await waarde(p, 0), '−34');
      await p.keyboard.press('Backspace');
      assert.equal(await waarde(p, 0), '−3');
      // De pijltjes wisselen van tabblad, en het tabblad met de focus heeft een ring die niet wordt weggeknipt.
      await p.focus('#rh-tab-toetsenbord');
      await p.keyboard.press('ArrowLeft');
      assert.equal(await p.getAttribute('#rh-tab-rekenen', 'aria-selected'), 'true');
      assert.equal(await p.evaluate(() => document.activeElement.id), 'rh-tab-rekenen');
      assert.equal(
        await p.$eval('#rh-tab-rekenen', (e) => getComputedStyle(e).outlineOffset),
        '-3px',
        'de ring staat binnen de knop',
      );
      // Wat je typte telt mee bij het nakijken: −3 en 1,5 zijn fout, maar het is een gewoon antwoord.
      // De toets Controleer doet wat de knop in de vraag doet.
      assert.equal(await p.textContent('.rh [data-k="V:CONTROLEER"]'), 'Controleer');
      await p.click('#rh-tab-toetsenbord');
      await toets(p, 'CONTROLEER');
      assert.ok(await p.$('#pfb'), 'het antwoord wordt nagekeken');
      await p.click('#rh-tab-toetsenbord');
      await p.screenshot({ path: `${shotDir}rekenhulp-toetsenbord.png` });
      // Na Controleer, Toon uitwerking en een volgende vraag blijft het toetsenbord van het systeem weg, ook bij de
      // nieuwe velden. De velden die vergrendeld zijn, krijgen niets meer.
      const modes = () =>
        p.$$eval('#pform .fld input', (e) => e.map((i) => i.getAttribute('inputmode')));
      assert.deepEqual(await modes(), ['none', 'none'], 'na Controleer');
      await p.click('[data-act="show"]');
      await p.waitForSelector('.sol');
      assert.deepEqual(await p.$$eval('#pform .fld input', (e) => e.map((i) => i.disabled)), [
        true,
        true,
      ]);
      await p.click('#rh-tab-toetsenbord');
      // Zonder velden valt er niets te typen, en is Volgende uit. Controleer is nu Volgende vraag.
      await toets(p, '7', 'TEKEN');
      assert.equal(await p.isDisabled('.rh [data-k="V:VOLGENDE"]'), true);
      assert.equal(await p.textContent('.rh [data-k="V:CONTROLEER"]'), 'Volgende vraag');
      assert.equal(
        await p.$$eval(
          '#pform .fld input',
          (e) => e.filter((i) => i.value !== '' && i.value !== '−3' && i.value !== '1,5').length,
        ),
        0,
      );
      await p.click('#nextq');
      await p.waitForSelector('#pf0');
      assert.deepEqual(await modes(), ['none', 'none'], 'bij een nieuwe vraag');
      // Sluit je de Rekenhulp, dan is het gewone toetsenbord er weer.
      await p.click('.rh-sluit');
      assert.deepEqual(await modes(), ['text', 'text']);
      await p.click('[data-act="rekenhulp"]');
      assert.deepEqual(await modes(), ['none', 'none'], 'bij opnieuw openen');
      await p.close();
    }
    {
      // Op een telefoon brengt een tik in een veld het paneel naar het tabblad Toetsenbord.
      const ctx = await browser.newContext({
        reducedMotion: 'reduce',
        viewport: { width: 390, height: 700 },
        hasTouch: true,
        isMobile: true,
      });
      const p = await ctx.newPage();
      p.on('pageerror', (e) => errors.push(e.message));
      await open(p, true);
      assert.equal(await p.getAttribute('#rh-tab-rekenen', 'aria-selected'), 'true');
      await p.tap('#pf0');
      assert.equal(await p.getAttribute('#rh-tab-toetsenbord', 'aria-selected'), 'true');
      assert.equal(await p.textContent('#rh-invnaam'), 'a = (1/2)');
      await ctx.close();
    }
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test('een berekening typ je zelf, ook met de Rekenhulp, en de site rekent hem na (#262)', async () => {
  const browser = await launch();
  try {
    const errors = [];
    const p = await browser.newPage({
      reducedMotion: 'reduce',
      viewport: { width: 390, height: 700 },
    });
    p.on('pageerror', (e) => errors.push(e.message));
    // Rekentekens zetten bij -3, -9, 7 en -3 met de uitkomst -15.
    await p.goto(at('/vermenigvuldigen-en-delen-met-negatieve-getallen/oefenen?soort=222&seed=2'));
    await p.waitForSelector('#pform');
    assert.match(await p.textContent('#pq'), /uitkomst −15/);
    // Wat niet te lezen is, krijgt een eigen melding.
    await p.fill('#pf0', '-3 - (-9 + 7');
    await p.click('#pform button[type="submit"]');
    assert.match(await p.textContent('#pfb'), /berekening kan ik niet lezen/);
    // Een andere volgorde van de getallen, en een berekening met de verkeerde uitkomst.
    await p.fill('#pf0', '-9 - -3 + 7 * -3');
    await p.click('#pform button[type="submit"]');
    assert.match(await p.textContent('#pfb'), /in dezelfde volgorde/);
    await p.fill('#pf0', '-3 * -9 + 7 * -3');
    await p.click('#pform button[type="submit"]');
    assert.match(await p.textContent('#pfb'), /geeft niet −15/);
    // Het tabblad Toetsenbord heeft bij een berekening rekentekens en haakjes. Een min na een getal is een aftrekmin,
    // met spaties, en anders een negatieve min.
    await p.click('[data-act="rekenhulp"]');
    await p.waitForSelector('#rekenhulp:not([hidden])');
    await p.click('#rh-tab-toetsenbord');
    await p.click('.rh [data-k="V:LEEG"]');
    for (const k of ['-', '3', '-', '(', '-', '9', ')', '+', '7', '*', '-', '3'])
      await p.click(`.rh [data-k="V:${k}"]`);
    assert.equal(await p.inputValue('#pf0'), '−3 − (−9) + 7 · −3');
    await p.click('.rh [data-k="V:WIS"]');
    assert.equal(await p.inputValue('#pf0'), '−3 − (−9) + 7 · −');
    // Het gewone toetsenbord typt ook rekentekens, als de focus in het paneel staat.
    await p.focus('#rh-titel');
    await p.keyboard.type('3');
    assert.equal(await p.inputValue('#pf0'), '−3 − (−9) + 7 · −3');
    await p.screenshot({ path: `${shotDir}rekenhulp-berekening.png` });
    await p.click('.rh [data-k="V:CONTROLEER"]');
    assert.equal(await p.textContent('#pfb'), 'Goed gedaan!');
    // Bij een vraag zonder berekening heeft het tabblad weer de gewone toetsen.
    await p.goto(at('/lineaire-formule-opstellen/oefenen?soort=5&seed=k3x9q'));
    await p.waitForSelector('#pform');
    await p.click('[data-act="rekenhulp"]');
    await p.waitForSelector('#rekenhulp:not([hidden])');
    await p.click('#rh-tab-toetsenbord');
    assert.ok(await p.$('.rh [data-k="V:TEKEN"]'));
    assert.equal(await p.$('.rh [data-k="V:("]'), null);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
});

test('op een telefoon is het oefenen een volledig scherm met een vaste kop en voet (#222)', async () => {
  const browser = await launch();
  try {
    const errors = [];
    const link = '/lineaire-formule-opstellen/oefenen?soort=5&seed=k3x9q';
    const oef = (p) => p.evaluate(() => document.documentElement.classList.contains('oef'));
    // Zonder aanraken, ook op een smal scherm, blijft het oefenscherm zoals het was.
    {
      const p = await browser.newPage({ viewport: { width: 390, height: 780 } });
      await p.goto(at(link));
      await p.waitForSelector('#pform');
      assert.equal(await oef(p), false);
      assert.equal(await p.isVisible('.soort-knop'), false);
      assert.equal(await p.isVisible('.oef-terug'), false);
      assert.equal(await p.isVisible('#pform button[type="submit"]'), true);
      await p.close();
    }
    // Een tekenvraag klapt het paneel alleen op een telefoon in: zonder dat is er geen knop om weer uit te klappen.
    {
      const p = await browser.newPage({ viewport: { width: 1000, height: 800 } });
      await p.goto(at('/lineaire-grafieken-tekenen/oefenen?soort=8&seed=k3x9q'));
      await p.waitForSelector('#pform');
      await p.click('[data-act="rekenhulp"]');
      await p.waitForSelector('#rekenhulp:not([hidden])');
      assert.equal(await p.isVisible('#rekenhulp .rh-panelen'), true);
      await p.close();
    }
    const ctx = await browser.newContext({
      reducedMotion: 'reduce',
      viewport: { width: 390, height: 780 },
      hasTouch: true,
      isMobile: true,
    });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(e.message));
    await p.goto(at(link));
    await p.waitForSelector('#rekenhulp:not([hidden])');
    assert.equal(await oef(p), true);
    // De kop van de site is weg. De kop van het oefenen blijft bovenaan staan, ook als je scrolt.
    assert.equal(await p.isVisible('header.top'), false);
    assert.equal(await p.isVisible('.crumbs'), false);
    assert.equal(await p.isVisible('.oef-terug'), true);
    await p.evaluate(() => window.scrollTo(0, 400));
    assert.equal(await p.$eval('.oef-kop', (e) => Math.round(e.getBoundingClientRect().top)), 0);
    // De voet staat onderaan, met Volgende veld en Controleer in beeld. Controleer in de vraag zelf is weg.
    const voet = await p.$eval('.rh-actie', (e) => {
      const b = e.getBoundingClientRect();
      return { top: b.top, bottom: b.bottom };
    });
    assert.ok(voet.top > 0 && voet.bottom <= 780, 'de knoppen staan in beeld');
    assert.equal(await p.isVisible('#pform button[type="submit"]'), false);
    assert.equal(await p.isVisible('#rekenhulp .rh-sluit'), false, 'geen sluitknop');
    assert.equal(await p.isVisible('[data-act="rekenhulp"]'), false);
    // Bij Alles door elkaar staat de soort van de vraag er toch.
    assert.match(await p.textContent('.soort-knop'), /alleen deze soort/);
    await p.tap('.soort-knop');
    assert.equal(await p.getAttribute('.soort-knop', 'aria-expanded'), 'true');
    assert.equal(await p.isVisible('.menu-open .soort-menu'), true);
    // Het menu sluit met Escape en met een tik ergens anders.
    await p.keyboard.press('Escape');
    assert.equal(await p.isVisible('.menu-open .soort-menu'), false, 'Escape sluit het menu');
    await p.tap('.soort-knop');
    assert.equal(await p.isVisible('.menu-open .soort-menu'), true);
    await p.tap('#rekenhulp .rh-kop', { position: { x: 250, y: 4 } });
    assert.equal(
      await p.isVisible('.menu-open .soort-menu'),
      false,
      'een tik buiten sluit het menu',
    );
    // Een tik op Controleer terwijl het menu open staat, sluit het menu en kijkt het antwoord ook na.
    await p.tap('.soort-knop');
    await p.tap('#rekenhulp .rh-con');
    await p.waitForSelector('#pfb');
    assert.equal(await p.isVisible('.menu-open .soort-menu'), false);
    await p.tap('.soort-knop');
    await p.tap('[data-act="filter"][data-id=""]');
    assert.equal(await p.isVisible('.menu-open .soort-menu'), false, 'het menu sluit');
    assert.match(await p.textContent('.soort-knop'), /alles door elkaar/);
    // Een andere vraag, zonder de soort of de ronde te verliezen.
    const vorige = await p.getAttribute('#pform', 'data-vraag');
    await p.tap('.q-tools .andere');
    assert.notEqual(await p.getAttribute('#pform', 'data-vraag'), vorige);
    assert.match(await p.textContent('.soort-knop'), /alles door elkaar/);
    // Controleer staat in het paneel en doet wat de knop in de vraag doet.
    await p.tap('#rekenhulp .rh-con');
    await p.waitForSelector('#pfb');
    assert.match(await p.textContent('#pfb'), /Vul eerst alle antwoorden in/);
    // Inklappen laat de tabbladen en de twee knoppen staan. Een tabblad kiezen klapt weer uit.
    await p.tap('#rh-klap');
    assert.equal(await p.isVisible('#rekenhulp .rh-panelen'), false);
    assert.equal(await p.isVisible('#rekenhulp .rh-con'), true);
    assert.equal(await p.getAttribute('#rh-klap', 'aria-expanded'), 'false');
    await p.tap('#rh-tab-toetsenbord');
    assert.equal(await p.isVisible('#rekenhulp .rh-panelen'), true);
    // Volgende veld is uit bij één veld.
    await p.goto(at('/procentuele-verandering/oefenen?soort=105&seed=k3x9q'));
    await p.waitForSelector('#rekenhulp:not([hidden])');
    const velden = await p.$$eval('#pform .fld input[type="text"]', (e) => e.length);
    assert.equal(await p.isDisabled('#rekenhulp .rh-vol'), velden < 2);
    // Een tekenvraag heeft de Rekenhulp ook, maar ingeklapt, zodat het rooster in beeld blijft. Daarna volgt het paneel
    // de keuze van de leerling.
    await p.goto(at('/lineaire-grafieken-tekenen/oefenen?soort=8&seed=k3x9q'));
    await p.waitForSelector('#rekenhulp:not([hidden])');
    assert.equal(await p.isVisible('#rekenhulp .rh-panelen'), false);
    assert.equal(await p.isVisible('#rekenhulp .rh-con'), true);
    await p.tap('#rh-klap');
    assert.equal(await p.isVisible('#rekenhulp .rh-panelen'), true);
    // Ook meerkeuze heeft het paneel, ingeklapt, zodat Controleer altijd op dezelfde plek onderin staat.
    await p.goto(at('/ontbinden-in-factoren/oefenen?soort=76&seed=k3x9q'));
    await p.waitForSelector('#rekenhulp:not([hidden])');
    assert.equal(await p.isVisible('#rekenhulp .rh-panelen'), false);
    assert.equal(await p.isVisible('#pform button[type="submit"]'), false);
    assert.equal(await p.isDisabled('#rekenhulp .rh-vol'), true);
    await p.tap('#rekenhulp .rh-con');
    await p.waitForSelector('#pfb');
    assert.match(await p.textContent('#pfb'), /Vul eerst alle antwoorden in/);
    // De uitleg van een term staat tussen de kop en het paneel, niet eronder.
    await p.goto(at('/ontbinden-in-factoren/oefenen?soort=75&seed=k3x9q'));
    await p.waitForSelector('#rekenhulp:not([hidden])');
    await p.waitForSelector('#pq button.term');
    await p.tap('#pq button.term');
    await p.waitForSelector('.pop');
    const pop = await p.$eval('.pop', (e) => {
      const b = e.getBoundingClientRect();
      return {
        top: b.top,
        bottom: b.bottom,
        paneel: document.getElementById('rekenhulp').getBoundingClientRect().top,
        kop: document.querySelector('.oef-kop').getBoundingClientRect().bottom,
      };
    });
    assert.ok(pop.bottom <= pop.paneel + 1, 'de popup staat boven het paneel');
    assert.ok(pop.top >= pop.kop - 1, 'de popup staat onder de kop');
    await ctx.close();
    assert.deepEqual(errors, []);
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
    assert.ok(await p.waitForSelector('#pform'));
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
      // Alleen de vraagsoorten waarin je een lijn tekent: die hebben twee punten.
      const drawing = TOPICS.flatMap((t) => t.skills)
        .filter((k) => makeQuestion(k, 1).line)
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
      // Het onderwerp laadt pas als het nodig is, en op een trage computer duurt dat even.
      await p.waitForSelector('#pform');
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
// doet. In november 2026 was de grootste pagina 3,5 kB, een schil 1,6 kB en de CSS 5 kB. Wordt een
// grens te krap, kijk dan eerst met node scripts/meet.js dist <naam> wat er groeide, en verhoog de
// grens alleen als dat nodig is.
//
// De code was eerst één bestand, en groeide met elk onderwerp ongeveer 6 kB: met hoofdstuk 3 werd
// het 102 kB (301 kB zelf). Sinds #80 laadt de browser de generatoren en de uitleg van een
// onderwerp pas als die nodig zijn. Bij het eerste bezoek laadt Home alleen de schermen, de
// gedeelde code en de catalogus: in november 2026 47 kB (125 kB zelf). Het grootste onderwerp, Top
// en snijpunten van een parabool, was 10 kB (27 kB zelf), en het grootste gedeelde bestand 8 kB
// (17 kB zelf). Een nieuw onderwerp maakt het eerste bezoek dus nauwelijks groter. Wordt een
// onderwerp te groot, verdeel het dan in twee onderwerpen. De pagina Zo maken we de vragen (#22)
// maakte het eerste bezoek 3,5 kB groter (12 kB zelf), door de tekst en de aantallen per soort vraag:
// het eerste bezoek was 54 kB en mag nu 60 kB zijn. De pagina zelf is 8,6 kB, want alle 126
// soorten en de roosters staan erin. Die heeft daarom een eigen grens (lijst), zodat de grens voor
// de andere pagina's blijft laag. Die was 6 kB, tot de grootste pagina (Top en snijpunten van een
// parabool) er met de link in de voettekst precies op zat, en is nu 6,5 kB. De tellen voor de pagina
// Cijfers staan niet in het eerste bezoek, maar in een eigen bestand dat pas laadt op die pagina
// (#184): anders groeide de code elke week. Het eerste bezoek zat al boven de oude grenzen (60 kB en
// 166 kB zelf) door eerdere groei; nu is het 60,6 kB en 167 kB zelf, dus de grenzen zijn 61 en 168.
// Zo maken we de vragen staat sinds #188 in een eigen bestand (16 kB zelf, 5,5 kB verstuurd). Het
// eerste bezoek is daardoor 15 kB zelf en ongeveer 2 kB verstuurd kleiner, en de grenzen zijn 59 en 154.
// De proeftoets (exam.js) staat sinds #188 ook in een eigen bestand; het bewaren en de klok staan in
// toets-opslag.js, want die zijn bij het eerste bezoek al nodig. Het eerste bezoek is nu 145 kB zelf en
// 56,8 kB verstuurd, en de grenzen zijn 58 en 146.
// Over, Privacy en Contact staan sinds #188 samen in een eigen bestand (about.js). Het eerste bezoek is
// nu 137 kB zelf en 54 kB verstuurd, en de grenzen zijn 55 en 138.
// Cijfers staat sinds #188 ook in een eigen bestand (cijfers.js, 9 kB), naast het bestand met de
// tellen. Het eerste bezoek is nu 128 kB zelf en 50,6 kB verstuurd, en de grenzen zijn 52 en 130.
// Wat main en dat scherm samen gebruiken, staat nu in een gedeeld bestand dat main ook meteen laadt: het
// grootste is 15,5 kB verstuurd en 43 kB zelf, dus die grens is 16 en 44. De grens voor het eerste
// bezoek als geheel is wat telt. Dezelfde grens geldt ook voor de gedeelde code die alleen onderwerpen laden
// (nu 10 kB zelf), die dus ruimer is dan voorheen; een eigen soort grens volgt als die gaat groeien.
const LIMITS = {
  // De pagina Cijfers noemt alle vraagsoorten (#232: 184). Hoofdstuk 1 van havo/vwo 1 voegde er 39 aan toe: 7,2 kB, dus de grens ging van 7 naar 7,5.
  // Rekenvolgorde en Breuken (#244) voegden er tien aan toe: 7,52 kB, dus de grens ging van 7,5 naar 8.
  // Haakjes zetten en rekentekens zetten (#262) maakten er 222: 8,0 kB, dus de grens ging van 8 naar 8,5.
  page: { sent: 8.5, why: 'een vooraf gebouwde pagina' },
  // Alleen Zo maken we de vragen: alle 184 vraagsoorten en drie roosters staan erin (10,1 kB, dus de grens ging van 10 naar 10,5).
  // Rekenen met breuken (#244) voegde er zes toe (nu 200 vraagsoorten): 10,6 kB, dus de grens ging van 10,5 naar 11.
  // De puzzels (#262) voegden er vijf toe (nu 220 vraagsoorten): 11,1 kB, dus de grens ging van 11 naar 11,5.
  lijst: { sent: 12.5, why: 'de pagina met alle vraagsoorten; groeit met elke vraagsoort (H5 havo 3, #101)' },
  shell: { sent: 2.5, why: 'een schil of de 404-pagina' },
  // Het volledig-schermmodus (#222) voegde 0,5 kB toe aan main. De grens ging van 52 naar 53, en onverpakt van 130 naar 133 kB.
  // Hoofdstuk 1 van havo/vwo 1 (#232) voegde vier onderwerpen met 19 vraagsoorten toe. Van elk onderwerp staat de
  // catalogus (naam, adres, intro en de namen van de vraagsoorten) bij het eerste bezoek in de code: samen 2 kB zelf
  // en 0,3 kB verstuurd. Laag 3 voegde er vijf toe (nu 9 onderwerpen). De grens ging van 53 naar 55, en onverpakt van 133 naar 139 kB.
  // Kleiner maken kan met #206 (de catalogus niet meer bij het eerste bezoek laden).
  // De methode-indeling van hoofdstuk 1 (#232) staat bij het eerste bezoek in de code: 139,7 kB onverpakt, dus de grens ging van 139 naar 140 kB.
  // Het nakijken van de vorm van een breuk (#244, vormTraps in answers.js) voegde 0,8 kB verstuurd toe: 55,4 kB, dus de grens ging van 55 naar 56, en onverpakt (142 kB) van 140 naar 143 kB.
  // Breuken (#244) zette de catalogus van een onderwerp en vijf woorden (teller, noemer, vereenvoudigen, gemengd getal,
  // gelijknamig) in de code bij het eerste bezoek: 56,04 kB verstuurd en 143,5 kB onverpakt, dus de grens ging van 56 naar 57, en onverpakt van 143 naar 145 kB.
  // Negatieve getallen en Vermenigvuldigen en delen met negatieve getallen (#244) zetten hun catalogus en vijf woorden
  // (onder meer getallenlijn, aftrekmin en negatieve min) in de code bij het eerste bezoek: 145,6 kB onverpakt en 56,7 kB verstuurd,
  // dus de grens onverpakt ging van 145 naar 146 kB. narekenen en tekst in topics/shared.js laden alleen bij een onderwerp.
  // Met alle zes onderwerpen van hoofdstuk 2 (#244) in de catalogus is het eerste bezoek 57,0 kB verstuurd, dus de grens ging van 57 naar 58.
  // Met het hele hoofdstuk 2 (#244) is de code bij het eerste bezoek 146,7 kB onverpakt, dus die grens ging van 146 naar 148 kB.
  // De schuifjes in de uitleg en het tekenen in een rooster (#206) staan in een eigen bestand (interactief.js), dat
  // laadt met een onderwerp. Daarmee laadt ook figures.js (19,8 kB zelf, 9,4 kB verstuurd) niet meer bij het eerste
  // bezoek. Dat is nu 123,2 kB onverpakt en 46,4 kB verstuurd, dus de grenzen gingen van 58 naar 47 en van 148 naar 124 kB.
  // Hoofdstuk 3 van havo/vwo 1 (#283) zet drie onderwerpen in de catalogus (Grafieken lezen en tekenen, Globale grafieken,
  // Grafiek bij een formule), drie woorden en de vraagsoorten in de methode-indelingen: ongeveer 125 kB onverpakt, dus die grens ging van 124 naar 126 kB.
  // Met Grafiek bij een formule (#290) is het eerste bezoek 47,1 kB verstuurd, dus die grens ging van 47 naar 48 kB.
  // De uitleg en het oefenen (ui/topic.js) en de invoervelden van een vraag (ui/question-form.js, samen 16,5 kB zelf)
  // laden sinds #206 ook pas met een onderwerp, net als interactief.js. Het eerste bezoek ging van 125,4 naar 110,3 kB
  // onverpakt en van 47,1 naar 41,9 kB verstuurd, dus de grenzen gingen van 48 naar 43 en van 126 naar 112 kB.
  start: { sent: 43, own: 112, why: 'de code bij het eerste bezoek' },
  // De tellen voor de pagina Cijfers (src/js/cijfers-data.js). Dit bestand groeit met elke week aan
  // tellen en valt niet onder de code bij het eerste bezoek. Wordt het te groot, dan moet de build de
  // cijfers beperken of in delen splitsen. Nu is het 5,4 kB zelf en 1,0 kB verstuurd (vier dagen
  // tellen). Met 56 dagen nepcijfers (npm run dev:nep) is het 26,8 kB zelf en 6,8 kB verstuurd, dus de
  // grens is 8 en 30.
  tellen: { sent: 8, own: 30, why: 'het bestand met de tellen voor Cijfers' },
  // Een scherm in een eigen bestand (scripts/later-schermen.js), dat pas laadt als het nodig is.
  scherm: { sent: 7, own: 20, why: 'een scherm in een eigen bestand' },
  topic: { sent: 14, own: 40, why: 'de code van een onderwerp' },
  // De figuren voor ruimtefiguren (src/js/ruimtefiguren.js en ruimte.js, #232) worden door vier onderwerpen gedeeld en
  // staan daarom in een eigen gedeeld bestand: 16,2 kB verstuurd en 46,3 kB zelf. Dat bestand laadt alleen bij die
  // onderwerpen, niet bij het eerste bezoek. De grens ging van 16 naar 17 en van 44 naar 48 kB.
  // Laag 3 van #232 zette gedeelde figuurcode in topics/shared.js: 17,0 kB verstuurd, dus de grens ging van 17 naar 17,5, en onverpakt van 48 naar 49 kB.
  // De tekenopdrachten en de methode-indeling (#232) brachten het gedeelde bestand op 17,5 kB verstuurd en 49,6 kB onverpakt, dus de grens ging van 17,5 naar 18 en van 49 naar 50 kB.
  // Het nakijken van de vorm van een breuk (#244) staat in het gedeelde bestand met answers.js: 18,2 kB verstuurd en 51,6 kB onverpakt, dus de grens ging van 18 naar 18,5 en van 50 naar 52 kB.
  // De woorden van Rekenvolgorde (#244: som, verschil, product, quotiënt en rekenvolgorde) staan in woorden.js in hetzelfde bestand: 52,2 kB onverpakt, dus de grens ging van 52 naar 53 kB.
  // De woorden van Breuken (#244: teller, noemer, vereenvoudigen, gemengd getal en gelijknamig) brachten het op 18,77 kB verstuurd en 53,06 kB onverpakt, dus de grens ging van 18,5 naar 19 en van 53 naar 54 kB.
  // De woorden van Negatieve getallen (#244: positief, negatief, getallenlijn) brachten het op 19,1 kB verstuurd. De rest van hoofdstuk 2 voegt nog woorden toe (aftrekmin, negatieve min), dus de grens ging in één keer van 19 naar 20 en van 54 naar 56 kB. Kleiner maken kan met #206.
  // Met alle woorden van hoofdstuk 2 (#244) is het gedeelde bestand 56,1 kB onverpakt, dus de grens ging van 56 naar 57 kB.
  shared: { sent: 20, own: 57, why: 'een gedeeld codebestand' },
  // De Rekenhulp (#18) voegde 0,7 kB toe aan de CSS, die voor het paneel bij elk bezoek wordt geladen. De grens ging van 8,5 naar 9,5.
  // Het volledig-schermmodus op een telefoon (#222) voegde 0,9 kB toe aan de CSS. De grens ging van 9,5 naar 10,5.
  css: { sent: 10.5, why: 'de CSS' },
  font: { sent: 25, why: 'een lettertype' },
};
const kB = (n) => `${n.toFixed(1).replace('.', ',')} kB`;
const sizes = async (file) => {
  const body = await readFile(new URL(file, new URL('../dist/', import.meta.url)));
  const sent = brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } });
  return { own: body.length / 1024, sent: sent.length / 1024 };
};
const underLimit = (what, size, limit) => {
  for (const key of ['sent', 'own']) {
    if (!limit[key]) continue;
    assert.ok(
      size[key] <= limit[key],
      `${what} is ${kB(size[key])}${key === 'sent' ? ' verstuurd' : ''}, en de grens voor ${limit.why} is ${kB(limit[key])}`,
    );
  }
};
test('de pagina’s en de code blijven klein', async () => {
  const dist = new URL('../dist/', import.meta.url);
  const topics = new Set(TOPICS.map((t) => t.slug));
  const files = PAGES.map((p) => [
    p.file,
    p.shell || !p.path ? 'shell' : p.file === 'zo-maken-we-vragen/index.html' ? 'lijst' : 'page',
  ]);
  for (const name of await readdir(new URL('assets/', dist))) {
    const ext = name.match(/\.\w+$/)?.[0];
    const code = topics.has(name.replace(/-\w+\.js$/, ''))
      ? 'topic'
      : /^chunk-/.test(name)
        ? 'shared'
        : /^cijfers-data-/.test(name)
          ? 'tellen'
          : /^(vragen|exam|about|cijfers|rekenhulp|tekenen|interactief|topic)-/.test(name) &&
            'scherm';
    const kind = ext === '.js' ? code : { '.css': 'css', '.woff2': 'font' }[ext];
    if (kind) files.push([`assets/${name}`, kind]);
  }
  assert.equal(
    files.filter(([, kind]) => kind === 'topic').length,
    topics.size,
    'elk onderwerp heeft een eigen bestand',
  );
  assert.ok(
    files.some(([, kind]) => kind === 'shared'),
    'de gedeelde code is gevonden',
  );
  for (const [file, kind] of files) underLimit(file, await sizes(file), LIMITS[kind]);
});

test('de pagina Cijfers laadt de cijfers apart, en blijft staan terwijl dat duurt', async () => {
  const browser = await launch();
  try {
    const file = '**/assets/cijfers-data-*.js';
    // Rechtstreeks openen: de vooraf gebouwde pagina blijft staan, ook als de cijfers laat komen.
    {
      const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
      let release;
      const gate = new Promise((resolve) => (release = resolve));
      await p.route(file, async (route) => {
        await gate;
        await route.continue();
      });
      const gevraagd = p.waitForRequest(/cijfers-data-/);
      await p.goto(at('/cijfers'));
      await p.waitForFunction(() => window.wiskundefit);
      await gevraagd;
      // Langer dan de 300 ms waarna het scherm zou zeggen dat het laadt.
      await p.waitForTimeout(600);
      assert.ok(await p.$('#niet-zeggen'), 'de vooraf gebouwde pagina staat er');
      assert.equal(await p.$('#app :text("Even laden")'), null, 'geen laadmelding');
      release();
      await p.close();
    }
    // Vanaf Home: de cijfers laden pas nu, en bij een fout is er een melding met opnieuw proberen.
    {
      const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
      const geladen = [];
      // Zowel de tellen als het scherm zelf (cijfers-HASH.js).
      p.on('request', (r) => /\/assets\/cijfers-/.test(r.url()) && geladen.push(r.url()));
      await p.goto(siteUrl);
      await p.waitForFunction(() => window.wiskundefit);
      assert.deepEqual(geladen, [], 'Home laadt de cijfers niet');
      await p.route(file, (route) => route.abort());
      await p.evaluate(() => wiskundefit.go({ name: 'cijfers' }));
      await p.waitForSelector('#laadfout');
      await p.unroute(file);
      const antwoord = p.waitForResponse((r) => /cijfers-data-/.test(r.url()) && r.ok());
      await p.click('[data-act=opnieuw]');
      await antwoord;
      await p.waitForSelector('#niet-zeggen');
      assert.equal(await p.$('#laadfout'), null, 'na opnieuw proberen is de fout weg');
      await p.close();
    }
  } finally {
    await browser.close();
  }
});

test('Over, Privacy en Contact laden in één eigen bestand, en blijven staan terwijl dat duurt', async () => {
  const browser = await launch();
  try {
    const file = '**/assets/about-*.js';
    const geladen = /\/assets\/about-/;
    // Rechtstreeks openen: de vooraf gebouwde pagina blijft staan, ook als het bestand laat komt.
    {
      const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
      let release;
      const gate = new Promise((resolve) => (release = resolve));
      await p.route(file, async (route) => {
        await gate;
        await route.continue();
      });
      const gevraagd = p.waitForRequest(geladen);
      await p.goto(at('/privacy'));
      await p.waitForFunction(() => window.wiskundefit);
      await gevraagd;
      await p.waitForTimeout(600);
      assert.match(await p.textContent('h1'), /Privacy/, 'de vooraf gebouwde pagina staat er');
      assert.equal(await p.$('#app :text("Even laden")'), null, 'geen laadmelding');
      release();
      // Daarna naar een andere pagina uit hetzelfde bestand: dat haalt niets meer op.
      await p.waitForTimeout(500);
      const nog = [];
      p.on('request', (r) => geladen.test(r.url()) && nog.push(r.url()));
      await p.click('footer a[href="/contact"]');
      await p.waitForFunction(() => document.querySelector('h1')?.textContent.includes('Contact'));
      assert.deepEqual(nog, [], 'Contact gebruikt hetzelfde bestand');
      await p.close();
    }
    // Vanaf Home laadt het bestand pas nu, en bij een fout is er een melding met opnieuw proberen.
    {
      const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
      const aangevraagd = [];
      p.on('request', (r) => geladen.test(r.url()) && aangevraagd.push(r.url()));
      await p.goto(siteUrl);
      await p.waitForFunction(() => window.wiskundefit);
      assert.deepEqual(aangevraagd, [], 'Home laadt deze pagina’s niet');
      await p.route(file, (route) => route.abort());
      await p.evaluate(() => wiskundefit.go({ name: 'over' }));
      await p.waitForSelector('#laadfout');
      await p.unroute(file);
      const antwoord = p.waitForResponse((r) => geladen.test(r.url()) && r.ok());
      await p.click('[data-act=opnieuw]');
      await antwoord;
      await p.waitForFunction(
        () =>
          /Over/.test(document.querySelector('h1')?.textContent) &&
          !document.querySelector('#laadfout'),
      );
      assert.equal(await p.$('#laadfout'), null, 'na opnieuw proberen is de fout weg');
      await p.close();
    }
  } finally {
    await browser.close();
  }
});

test('Zo maken we de vragen laadt in een eigen bestand, en blijft staan terwijl dat duurt', async () => {
  const browser = await launch();
  try {
    const file = '**/assets/vragen-*.js';
    const geladen = /\/assets\/vragen-/;
    // Rechtstreeks openen: de vooraf gebouwde pagina blijft staan, ook als het bestand laat komt.
    {
      const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
      let release;
      const gate = new Promise((resolve) => (release = resolve));
      await p.route(file, async (route) => {
        await gate;
        await route.continue();
      });
      const gevraagd = p.waitForRequest(geladen);
      await p.goto(at('/zo-maken-we-vragen'));
      await p.waitForFunction(() => window.wiskundefit);
      await gevraagd;
      await p.waitForTimeout(600);
      assert.ok(await p.$('.vtotaal'), 'de vooraf gebouwde pagina staat er');
      assert.equal(await p.$('#app :text("Even laden")'), null, 'geen laadmelding');
      // Wat je opklapt terwijl het bestand laadt, blijft open als het scherm er is.
      await p.click('[data-act=vragenopen][data-id=open]');
      const open = () => p.$$eval('.vdomeinen details[open]', (l) => l.length);
      assert.ok((await open()) > 0, 'alles is opengeklapt');
      const binnen = p.waitForResponse((r) => geladen.test(r.url()) && r.ok());
      release();
      await binnen;
      await p.waitForTimeout(500);
      assert.ok((await open()) > 0, 'na het laden staat het nog open');
      await p.close();
    }
    // Vanaf Home laadt het bestand pas nu, en bij een fout is er een melding met opnieuw proberen.
    {
      const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
      const aangevraagd = [];
      p.on('request', (r) => geladen.test(r.url()) && aangevraagd.push(r.url()));
      await p.goto(siteUrl);
      await p.waitForFunction(() => window.wiskundefit);
      assert.deepEqual(aangevraagd, [], 'Home laadt dit scherm niet');
      await p.route(file, (route) => route.abort());
      await p.evaluate(() => wiskundefit.go({ name: 'vragen' }));
      await p.waitForSelector('#laadfout');
      await p.unroute(file);
      const antwoord = p.waitForResponse((r) => geladen.test(r.url()) && r.ok());
      await p.click('[data-act=opnieuw]');
      await antwoord;
      await p.waitForSelector('.vtotaal');
      assert.equal(await p.$('#laadfout'), null, 'na opnieuw proberen is de fout weg');
      await p.close();
    }
  } finally {
    await browser.close();
  }
});

test('de proeftoets laadt in een eigen bestand, met een melding als dat niet lukt', async () => {
  const browser = await launch();
  try {
    const file = '**/assets/exam-*.js';
    const geladen = /\/assets\/exam-/;
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    const aangevraagd = [];
    p.on('request', (r) => geladen.test(r.url()) && aangevraagd.push(r.url()));
    await p.goto(siteUrl);
    await p.waitForFunction(() => window.wiskundefit);
    assert.deepEqual(aangevraagd, [], 'Home laadt de proeftoets niet');
    await p.route(file, (route) => route.abort());
    await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
    await p.waitForSelector('#laadfout');
    await p.unroute(file);
    const antwoord = p.waitForResponse((r) => geladen.test(r.url()) && r.ok());
    await p.click('[data-act=opnieuw]');
    await antwoord;
    await p.waitForSelector('.setup');
    assert.equal(await p.$('#laadfout'), null, 'na opnieuw proberen is de fout weg');
    await p.close();
  } finally {
    await browser.close();
  }
});

test('een lopende proeftoets wacht op het scherm, en de klok loopt pas als het er is', async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    await p.goto(at('/'));
    await p.waitForFunction(() => window.wiskundefit);
    await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
    await p.click('[data-act="stofall"]');
    await p.click('[data-act="len"][data-id="10"]');
    await p.click('[data-act="start"]');
    await p.waitForSelector('#tform');
    // Herladen met een scherm dat laat komt: de proeftoets staat in de opslag, en wacht.
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await p.route('**/assets/exam-*.js', async (route) => {
      await gate;
      await route.continue();
    });
    const gevraagd = p.waitForRequest(/\/assets\/exam-/);
    await p.reload();
    await p.waitForFunction(() => window.wiskundefit);
    await gevraagd;
    await p.waitForSelector('#app :text("Even laden")');
    assert.equal(await p.evaluate(() => wiskundefit.state.test.since), null, 'de klok staat stil');
    release();
    await p.waitForSelector('#tform');
    assert.ok(await p.evaluate(() => wiskundefit.state.test.since), 'de klok loopt weer');
    assert.match(await p.textContent('main'), /Vraag 1 van 10/);
    await p.close();
  } finally {
    await browser.close();
  }
});

// De schuifjes en het tekenen (interactief.js) en de schermen van een onderwerp (topic.js) staan elk in een eigen
// bestand, dat laadt met een onderwerp (BIJ_ONDERWERP in scripts/later-schermen.js, #206).
test('de bestanden die met een onderwerp laden: niet bij Home, en de uitleg blijft staan', async () => {
  const browser = await launch();
  try {
    for (const naam of ['interactief', 'topic']) {
      const file = `**/assets/${naam}-*.js`;
      const geladen = new RegExp(`/assets/${naam}-`);
      const uitleg = { name: 'topic', slug: 'lineaire-grafieken-tekenen' };
      // Het schuifje voor a verandert de formule erboven. Het schuift steeds opnieuw, want het werkt pas
      // als beide bestanden er zijn en het schuifje is gekoppeld.
      const schuif = async (p) => {
        const voor = await p.innerHTML('#sl-f');
        await p.waitForFunction((v) => {
          const a = document.querySelector('#sl-a');
          a.value = a.value === '2' ? '2.5' : '2';
          a.dispatchEvent(new Event('input', { bubbles: true }));
          return document.querySelector('#sl-f').innerHTML !== v;
        }, voor);
      };
      // Rechtstreeks openen: de vooraf gebouwde uitleg blijft staan tot het bestand er is.
      {
        const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
        let release;
        const gate = new Promise((resolve) => (release = resolve));
        await p.route(file, async (route) => {
          await gate;
          await route.continue();
        });
        const gevraagd = p.waitForRequest(geladen);
        await p.goto(at('/lineaire-grafieken-tekenen'));
        await p.waitForFunction(() => window.wiskundefit);
        await gevraagd;
        await p.waitForTimeout(600);
        assert.ok(await p.$('#sl-a'), 'de vooraf gebouwde uitleg staat er');
        assert.equal(await p.$('#app :text("Even laden")'), null, 'geen laadmelding');
        release();
        await schuif(p);
        await p.close();
      }
      // Home laadt het bestand niet. Lukt het later niet, dan een melding met opnieuw proberen.
      {
        const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
        const aangevraagd = [];
        p.on('request', (r) => geladen.test(r.url()) && aangevraagd.push(r.url()));
        await p.goto(siteUrl, { waitUntil: 'networkidle' });
        await p.waitForFunction(() => window.wiskundefit);
        assert.deepEqual(aangevraagd, [], `Home laadt ${naam}.js niet`);
        await p.route(file, (route) => route.abort());
        await p.evaluate((v) => wiskundefit.go(v), uitleg);
        await p.waitForSelector('#laadfout');
        await p.unroute(file);
        await p.click('[data-act=opnieuw]');
        await p.waitForSelector('#sl-a');
        assert.equal(await p.$('#laadfout'), null, 'na opnieuw proberen is de fout weg');
        await schuif(p);
        await p.close();
      }
    }
  } finally {
    await browser.close();
  }
});

test('een onderwerp dat niet laadt, geeft een melding met opnieuw proberen', async () => {
  const browser = await launch();
  try {
    await mkdir(shotDir, { recursive: true });
    const p = await browser.newPage({ viewport: { width: 390, height: 800 } });
    const file = '**/assets/haakjes-wegwerken-*.js';
    const practice = { name: 'topic', slug: 'haakjes-wegwerken', oefen: true };
    await p.goto(siteUrl);
    await p.waitForFunction(() => window.wiskundefit);
    // Duurt het laden even, dan zegt het scherm dat.
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    await p.route(file, async (route) => {
      await gate;
      await route.continue();
    });
    const shown = p.evaluate((v) => wiskundefit.go(v), practice);
    await p.waitForSelector('#app :text("Even laden")');
    // Een schermlezer hoort het uit een gebied dat er al stond.
    assert.equal(await p.textContent('#laadmelding'), 'Even laden…');
    release();
    await shown;
    assert.ok(await p.$('#pq'), 'na het laden staat de vraag er');
    assert.equal(await p.textContent('#laadmelding'), '', 'na het laden is de melding weg');
    await p.unroute(file);
    // Opent de site met een vooraf gebouwde uitleg die nog laadt, dan blijft die staan. Ga je dan
    // naar een ander onderwerp, dan zie je dat dat laadt, en niet de oude uitleg.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
      const q = await context.newPage();
      const other = '**/assets/ontbinden-in-factoren-*.js';
      let open;
      const wait = new Promise((resolve) => (open = resolve));
      for (const f of [file, other])
        await q.route(f, async (route) => {
          await wait;
          await route.continue();
        });
      await q.goto(at('/haakjes-wegwerken'), { waitUntil: 'domcontentloaded' });
      await q.waitForFunction(() => window.wiskundefit);
      await q.waitForTimeout(400);
      assert.match(await q.textContent('h1'), /Haakjes wegwerken/, 'de eigen uitleg blijft staan');
      assert.ok(
        !(await q.$('#app :text("Even laden")')),
        'de eigen uitleg zegt niet dat hij laadt',
      );
      const naar = q.evaluate((v) => wiskundefit.go(v), {
        name: 'topic',
        slug: 'ontbinden-in-factoren',
      });
      await q.waitForSelector('#app :text("Even laden")');
      assert.match(
        await q.textContent('h1'),
        /Ontbinden in factoren/,
        'de kop is van het nieuwe onderwerp',
      );
      open();
      await naar;
      assert.match(await q.textContent('h1'), /Ontbinden in factoren/);
      assert.ok(!(await q.$('#app :text("Even laden")')), 'na het laden staat de uitleg er');
      await context.close();
    }
    // Lukt het niet, dan een melding met een knop, en geen witte pagina.
    for (const open of ['in de site', 'met een adres']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
      const q = await context.newPage();
      await q.route(file, (route) => route.abort());
      if (open === 'in de site') {
        await q.goto(siteUrl);
        await q.waitForFunction(() => window.wiskundefit);
        await q.evaluate((v) => wiskundefit.go(v), practice);
      } else await q.goto(at('/haakjes-wegwerken/oefenen'));
      await q.waitForSelector('#laadfout');
      assert.equal(await q.evaluate(() => document.activeElement.id), 'laadfout', open);
      assert.match(await q.textContent('h1'), /Haakjes wegwerken oefenen/, open);
      assert.ok(await q.$('.crumbs'), `${open}: het kruimelpad staat er`);
      if (open === 'in de site') await q.screenshot({ path: `${shotDir}laadfout.png` });
      await q.unroute(file);
      await q.click('[data-act="opnieuw"]');
      await q.waitForSelector('#pq');
      await context.close();
    }
  } finally {
    await browser.close();
  }
});

test('het eerste bezoek laadt alleen de schermen en de catalogus', async () => {
  const browser = await launch();
  try {
    const p = await browser.newPage();
    const code = [];
    p.on('request', (r) => {
      const { pathname } = new URL(r.url());
      if (pathname.startsWith('/assets/') && pathname.endsWith('.js')) code.push(pathname.slice(1));
    });
    await p.goto(siteUrl, { waitUntil: 'networkidle' });
    await p.waitForFunction(() => window.wiskundefit);
    assert.ok(
      code.some((f) => /^assets\/main-/.test(f)),
      'main is geladen',
    );
    const topics = TOPICS.map((t) => t.slug);
    assert.deepEqual(
      code.filter((f) => topics.some((t) => f.startsWith(`assets/${t}-`))),
      [],
      'Home laadt geen onderwerp',
    );
    const total = { own: 0, sent: 0 };
    for (const file of new Set(code)) {
      const size = await sizes(file);
      total.own += size.own;
      total.sent += size.sent;
    }
    underLimit('De code bij het eerste bezoek', total, LIMITS.start);
  } finally {
    await browser.close();
  }
});
