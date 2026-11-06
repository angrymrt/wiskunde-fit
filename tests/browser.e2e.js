// Klikt de gebouwde site door in een echte browser, op telefoonformaat. Start: npm run test:browser
// Gebruikt Edge; een andere browser kies je met de omgevingsvariabele BROWSER, bijvoorbeeld chrome of webkit.
// Standaard krijgt elke soort vraag 1 ronde; met de omgevingsvariabele ROUNDS kies je er meer.
// Schermafbeeldingen om zelf na te kijken komen in test-results/.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, webkit } from 'playwright-core';

const siteUrl = new URL('../dist/index.html', import.meta.url).href;
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
      const ids = await p.evaluate(() => wiskundefit.SECTIONS.map((s) => s.id));
      for (const id of ids) {
        await p.evaluate((i) => wiskundefit.go({ name: 'sec', id: i, tab: 'uitleg' }), id);
        for (const b of await p.$$('[data-act="exnext"]')) {
          while (await b.isVisible()) await b.click();
        }
        await check(`${id} uitleg`);
        await p.click('[role="tab"][data-tab="video"]');
        await check(`${id} video's`);
        await p.click('[role="tab"][data-tab="oefen"]');
        await p.click('[data-act="hint"]');
        await p.click('#pform button[type=submit]');
        await check(`${id} oefenen met hint en melding`);
        await p.click('[data-act="show"]');
        await check(`${id} uitwerking`);
      }
      await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
      await check('proeftoets kiezen');
      await p.click('[data-act="len"][data-id="10"]');
      await p.click('[data-act="start"]');
      await check('proeftoets');
      await p.click('[data-act="tfin"]');
      await check('proeftoets met waarschuwing');
      await p.click('[data-act="tfin"]');
      await check('resultaat proeftoets');
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
        return el.id || el.dataset.tab || el.dataset.act || el.className || el.tagName;
      });

    // Een nieuw scherm: de focus gaat naar de kop.
    await p.click('[data-act="sec"][data-id="1.1"]:not(.btn)');
    assert.equal(await p.evaluate(() => document.activeElement.tagName), 'H1');

    // Tabbladen: met de pijltjes wisselen, en de focus blijft op het tabblad.
    await p.focus('#tab-uitleg');
    await p.keyboard.press('ArrowRight');
    assert.equal(await focused(), 'tab-oefen');
    assert.ok(await p.$('#pform'), 'het tabblad Oefenen staat open');

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

    const ids = await p.evaluate(() => wiskundefit.SECTIONS.map((s) => s.id));
    for (const id of ids) {
      await p.evaluate(() => wiskundefit.go({ name: 'home' }));
      await checkOverflow('overzicht');
      await p.click(`[data-act="sec"][data-id="${id}"]:not(.btn)`);
      await checkOverflow(`${id} uitleg`);
      for (const b of await p.$$('[data-act="exnext"]')) {
        while (await b.isVisible()) await b.click();
      }
      await checkOverflow(`${id} voorbeelden open`);
      for (const r of await p.$$('input[type=range]')) {
        await r.evaluate((el) => {
          el.value = el.max;
          el.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
      await checkOverflow(`${id} schuifjes op maximum`);
      await p.click('[role="tab"][data-tab="video"]');
      await p.click('[role="tab"][data-tab="oefen"]');

      const skills = await p.evaluate((i) => wiskundefit.SEC[i].skills.map((k) => k.id), id);
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
    const full = await p.evaluate(() => [wiskundefit.state.test.score, wiskundefit.state.test.max]);
    assert.equal(full[0], full[1], 'proeftoets met alles goed');
    await checkOverflow('resultaat proeftoets');

    // Lege proeftoets: eerst een waarschuwing, daarna nul punten.
    await p.evaluate(() => wiskundefit.go({ name: 'toets' }));
    await p.click('[data-act="scope"][data-id="core"]');
    await p.click('[data-act="len"][data-id="10"]');
    await p.click('[data-act="start"]');
    await p.click('[data-act="tfin"]');
    assert.match(await p.textContent('.fb'), /nog 10 vragen open/);
    await p.click('[data-act="tfin"]');
    const blank = await p.evaluate(() => ({
      score: wiskundefit.state.test.score,
      onlyCore: wiskundefit.state.test.items.every((x) => x.sec.core),
    }));
    assert.deepEqual(blank, { score: 0, onlyCore: true });

    // Voortgang blijft bewaard na herladen.
    await p.reload();
    await p.waitForTimeout(200);
    const kept = await p.evaluate(() => Object.keys(wiskundefit.prog.skills).length);
    const total = await p.evaluate(() => wiskundefit.SECTIONS.flatMap((s) => s.skills).length);
    assert.equal(kept, total, 'voortgang na herladen');

    assert.deepEqual([...overflowing], [], 'schermen die breder zijn dan de telefoon');

    // Schermafbeeldingen om zelf na te kijken.
    const shot = (page, name, fullPage = false) =>
      page.screenshot({ path: `${shotDir}${name}.png`, fullPage });
    const light = await open({ viewport: { width: 1100, height: 860 }, colorScheme: 'light' });
    await shot(light, 'overzicht');
    await light.click('[data-act="sec"][data-id="1.1"]:not(.btn)');
    await shot(light, 'uitleg', true);
    const dark = await open({ viewport: { width: 1100, height: 860 }, colorScheme: 'dark' });
    await dark.click('[data-act="sec"][data-id="2.2"]:not(.btn)');
    await dark.click('[role="tab"][data-tab="oefen"]');
    await dark.click('[data-act="show"]');
    await shot(dark, 'oefenen-donker', true);
    await shot(await open({ viewport: { width: 390, height: 800 } }), 'telefoon', true);

    assert.deepEqual(errors, [], 'fouten in de browserconsole');
  } finally {
    await browser.close();
  }
});
