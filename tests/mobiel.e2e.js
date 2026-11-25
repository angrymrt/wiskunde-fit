// Mobiele tests op echte telefoons via BrowserStack Automate (#243). Start: npm run test:mobiel
//
// Niet bij elke pull request: draai dit af en toe, of met de workflow Mobiele tests. Nodig zijn
// BROWSERSTACK_USERNAME en BROWSERSTACK_ACCESS_KEY. Standaard test het de site die online staat; een
// preview kies je met ADRES=<adres>. Met TOESTELLEN=firefox-pixel,... kies je toestellen uit de lijst
// hieronder. Schermafbeeldingen om zelf na te kijken komen in test-results/mobiel/.
//
// Selenium en niet Playwright, want Playwright kan op BrowserStack op Android alleen Chrome. De tikken
// zijn nagemaakt in de pagina: wat de browser zelf doet, zoals dubbeltik-zoom of scrollen met de
// vinger, zie je hier niet (#241). Daarvoor blijft een test met de hand in BrowserStack Live nodig.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Builder, By, until } from 'selenium-webdriver';

const TOESTELLEN = [
  {
    naam: 'firefox-pixel',
    browserName: 'firefox',
    deviceName: 'Google Pixel 9 Pro',
    osVersion: '15.0',
  },
  {
    naam: 'chrome-galaxy',
    browserName: 'chrome',
    deviceName: 'Samsung Galaxy S22',
    osVersion: '12.0',
  },
  // De oudste iOS uit browserslist in package.json die BrowserStack heeft.
  { naam: 'safari-iphone', browserName: 'safari', deviceName: 'iPhone 12', osVersion: '14' },
];

const user = process.env.BROWSERSTACK_USERNAME;
const key = process.env.BROWSERSTACK_ACCESS_KEY;
const adres = process.env.ADRES || 'https://wiskundefit.nl/';
const at = (pad) => new URL(pad, adres).href;
// Elke run een eigen build, anders voegt het dashboard runs met dezelfde naam samen.
const build =
  process.env.BROWSERSTACK_BUILD ||
  `mobiel ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
// Leeg, zoals in de workflow als je niets kiest, is alle toestellen.
const gekozen = process.env.TOESTELLEN?.split(',').map((t) => t.trim()).filter(Boolean);
const toestellen = gekozen?.length ? TOESTELLEN.filter((t) => gekozen.includes(t.naam)) : TOESTELLEN;
const shotDir = fileURLToPath(new URL('../test-results/mobiel/', import.meta.url));

// Een vaste vraag, zodat elke run hetzelfde doet: twee velden, a en b.
const ONDERWERP = 'lineaire-formule-opstellen';
const VRAAG = `/${ONDERWERP}/oefenen?soort=5&seed=k3x9q`;

// De juiste antwoorden van de vraag op het scherm, getypt zoals een leerling dat zou doen.
const antwoorden = `return ((q) => {
  const typed = (x) => {
    if (Number.isInteger(x)) return String(x);
    for (const n of [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 24, 25, 40]) {
      const k = x * n;
      if (Math.abs(k - Math.round(k)) < 1e-7) return Math.round(k) + '/' + n;
    }
    return String(x).replace('.', ',');
  };
  return q.fields.map((f) => (f.round != null ? String(window.wiskundefit.rd(f.a, f.round)).replace('.', ',') : typed(f.a)));
})(window.wiskundefit.state.prac[${JSON.stringify(ONDERWERP)}].q);`;

test('mobiele tests op BrowserStack', { concurrency: true }, async (t) => {
  assert.ok(user && key, 'Zet BROWSERSTACK_USERNAME en BROWSERSTACK_ACCESS_KEY.');
  assert.ok(toestellen.length, `Geen toestel gevonden in TOESTELLEN=${process.env.TOESTELLEN}`);
  await mkdir(shotDir, { recursive: true });
  console.log(`Build "${build}" op ${adres}`);

  for (const toestel of toestellen) {
    t.test(toestel.naam, async () => {
      const { naam, browserName, ...opties } = toestel;
      const driver = await new Builder()
        .usingServer('https://hub.browserstack.com/wd/hub')
        .withCapabilities({
          browserName,
          'bstack:options': {
            ...opties,
            realMobile: 'true',
            projectName: 'wiskunde-fit',
            buildName: build,
            sessionName: naam,
            userName: user,
            accessKey: key,
          },
        })
        .build();
      const foto = async (stap) =>
        writeFile(`${shotDir}${naam}-${stap}.png`, await driver.takeScreenshot(), 'base64');
      const status = (goed, reden) =>
        driver
          .executeScript(
            `browserstack_executor: ${JSON.stringify({ action: 'setSessionStatus', arguments: { status: goed ? 'passed' : 'failed', reason: reden.slice(0, 250) } })}`,
          )
          .catch(() => {});
      const tik = async (css) =>
        (await driver.wait(until.elementLocated(By.css(css)), 10000)).click();
      try {
        // Home
        await driver.get(adres);
        await driver.wait(until.elementLocated(By.css('main h1')), 20000);
        await foto('1-home');

        // Het oefenscherm. Op een telefoon staat de Rekenhulp al open.
        await driver.get(at(VRAAG));
        await driver.wait(until.elementLocated(By.css('#pform')), 20000);
        const open = () =>
          driver.executeScript(
            "const p = document.getElementById('rekenhulp'); return !!p && !p.hidden",
          );
        await driver.wait(open, 5000).catch(() => {});
        if (!(await open())) await tik('[data-act="rekenhulp"]');
        await driver.wait(open, 10000);
        await foto('2-oefenen');

        // Het antwoord typen met het tabblad Toetsenbord, veld na veld.
        const vals = await driver.executeScript(antwoorden);
        await tik('[data-k="TAB:toetsenbord"]');
        for (const [i, val] of vals.entries()) {
          const negatief = val.startsWith('-');
          for (const c of negatief ? val.slice(1) : val) await tik(`[data-k="V:${c}"]`);
          if (negatief) await tik('[data-k="V:TEKEN"]');
          if (i < vals.length - 1) await tik('[data-k="V:VOLGENDE"]');
        }
        const getypt = await driver.executeScript(
          `return [...document.querySelectorAll('#pform input:not([type=hidden])')].map((e) => e.value)`,
        );
        assert.deepEqual(
          getypt.map((v) => v.replace('−', '-')),
          vals,
          'de velden bevatten wat de toetsen typten',
        );
        await foto('3-getypt');

        // Controleren met de knop in de Rekenhulp.
        await tik('[data-k="V:CONTROLEER"]');
        await driver.wait(until.elementLocated(By.css('#pfb.good')), 10000);
        await foto('4-goed');
        await status(true, 'alles werkt');
      } catch (e) {
        await foto('fout').catch(() => {});
        await status(false, e.message);
        throw e;
      } finally {
        await driver.quit();
      }
    });
  }
});
