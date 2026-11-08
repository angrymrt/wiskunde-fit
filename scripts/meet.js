// Meet hoe groot de pagina's zijn en hoe snel de tekst verschijnt op een oude telefoon met traag
// internet. Start: node scripts/meet.js [map of adres] [naam]
// Zonder argument meet het dist/. Met een adres, zoals https://wiskundefit.nl, meet het de site die
// online staat. Het resultaat komt ook in test-results/meting-<naam>.txt.
// Werkt alleen met Edge of Chrome, want het vertragen gaat via het DevTools-protocol.
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';
import { chromium } from 'playwright-core';
import { startServer } from './server.js';

const target = process.argv[2] || 'dist';
const name = process.argv[3] || (/^https?:/.test(target) ? new URL(target).hostname : target);
const online = /^https?:/.test(target);
const runs = Number(process.env.RUNS) || 3;

// Een oude telefoon: de processor 6 keer zo traag. Het internet als een slechte 3G-verbinding, en
// als een gewone mobiele verbinding.
const CPU = 6;
const NETWORKS = [
  { name: 'traag (400 kbit/s, 400 ms)', kbit: 400, latency: 400 },
  { name: 'mobiel (1,6 Mbit/s, 150 ms)', kbit: 1600, latency: 150 },
];
// Een eerste bezoek via Google, en daarna een tweede pagina met wat er al in de cache staat.
const VISITS = [
  { name: 'eerste bezoek, Home', first: '/' },
  { name: 'eerste bezoek, onderwerp', first: '/snijpunten-van-lijnen' },
  { name: 'daarna een domein', first: '/snijpunten-van-lijnen', then: '/meetkunde' },
];

// Legt in de pagina vast wanneer de eerste tekst, de h1 en de code er zijn, en hoeveel de pagina
// verspringt (CLS). De tijden tellen vanaf het begin van het laden.
const PROBE = () => {
  const m = (window.__meting = { cls: 0 });
  const watch = (type, f) => {
    try {
      new PerformanceObserver((l) => l.getEntries().forEach(f)).observe({ type, buffered: true });
    } catch {}
  };
  watch('paint', (e) => e.name === 'first-contentful-paint' && (m.fcp = e.startTime));
  watch('largest-contentful-paint', (e) => (m.lcp = e.startTime));
  watch('layout-shift', (e) => !e.hadRecentInput && (m.cls += e.value));
  new MutationObserver(() => {
    if (m.h1 === undefined && document.querySelector('h1')?.textContent.trim()) {
      m.h1 = performance.now();
    }
  }).observe(document, { childList: true, subtree: true });
  // window.wiskundefit bestaat zodra main.js klaar is met opstarten.
  let site;
  Object.defineProperty(window, 'wiskundefit', {
    configurable: true,
    get: () => site,
    set: (v) => {
      site = v;
      m.js = performance.now();
    },
  });
};

const kB = (n) => `${(n / 1024).toFixed(1).replace('.', ',')} kB`;
const s = (ms) => (ms === undefined ? '-' : `${(ms / 1000).toFixed(2).replace('.', ',')} s`);
const median = (xs) => {
  const v = xs.filter((x) => x !== undefined).sort((a, b) => a - b);
  return v.length ? v[Math.floor(v.length / 2)] : undefined;
};

async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(path)));
    else out.push(path);
  }
  return out;
}
// Per bestand de grootte zelf en na brotli, zoals Azure die verstuurt.
async function sizes(dir) {
  const rows = [];
  for (const path of await files(dir)) {
    if (/staticwebapp\.config\.json$/.test(path)) continue;
    const body = await readFile(path);
    const text = /\.(html|css|js|svg|json|xml|txt)$/.test(path);
    const br = text
      ? brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: 4 } }).length
      : body.length;
    rows.push([relative(dir, path).replaceAll('\\', '/'), body.length, br]);
  }
  return rows.sort((a, b) => b[2] - a[2]);
}

async function visit(browser, base, network, { first, then }) {
  const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await context.addInitScript(PROBE);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: network.latency,
    downloadThroughput: (network.kbit * 1000) / 8,
    uploadThroughput: (network.kbit * 1000) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  // Een data-URL, zoals een lettertype in de CSS, gaat niet over het netwerk en telt dus niet mee.
  let bytes = 0;
  const inline = new Set();
  cdp.on('Network.requestWillBeSent', (e) => {
    if (e.request.url.startsWith('data:')) inline.add(e.requestId);
  });
  cdp.on('Network.loadingFinished', (e) => {
    if (!inline.has(e.requestId)) bytes += e.encodedDataLength;
  });
  const open = async (path) => {
    bytes = 0;
    await page.goto(new URL(path, base).href, { waitUntil: 'load', timeout: 120_000 });
    // Wacht tot de code klaar is en de grootste tekst er staat.
    await page.waitForFunction(() => window.__meting.js !== undefined, null, { timeout: 60_000 });
    await page.waitForTimeout(500);
    return { ...(await page.evaluate(() => window.__meting)), bytes };
  };
  let result = await open(first);
  if (then) result = await open(then);
  await context.close();
  return result;
}

let server;
let base = target;
if (!online) {
  const dir = resolve(target);
  if (!(await stat(dir).catch(() => null))?.isDirectory()) throw new Error(`Geen map: ${dir}`);
  server = await startServer(dir, 0);
  base = `http://127.0.0.1:${server.address().port}/`;
}

const lines = [
  `Meting van ${online ? target : `de map ${target}`}, ${new Date().toISOString()}`,
  '',
];
if (!online) {
  const rows = await sizes(resolve(target));
  lines.push('Grootte per bestand (zelf / verstuurd met brotli):');
  for (const [file, raw, br] of rows)
    lines.push(`  ${file.padEnd(60)} ${kB(raw).padStart(10)} ${kB(br).padStart(10)}`);
  lines.push('');
}
lines.push(
  `Snelheid op telefoonformaat, processor ${CPU}x zo traag, mediaan van ${runs} keer.`,
  'Eerste tekst = first contentful paint. Kop = de h1 met tekst staat in de pagina.',
  'Code = main.js is klaar. CLS = hoeveel de pagina verspringt. Verstuurd = bytes over het netwerk.',
  '',
);

const browser = await chromium.launch({ channel: process.env.BROWSER || 'msedge', headless: true });
try {
  for (const network of NETWORKS) {
    lines.push(network.name);
    lines.push(
      `  ${'bezoek'.padEnd(28)}${['eerste tekst', 'kop', 'grootste tekst', 'code', 'CLS', 'verstuurd'].map((h) => h.padStart(15)).join('')}`,
    );
    for (const v of VISITS) {
      const all = [];
      for (let i = 0; i < runs; i++) all.push(await visit(browser, base, network, v));
      const pick = (k) => median(all.map((r) => r[k]));
      lines.push(
        `  ${v.name.padEnd(28)}${[s(pick('fcp')), s(pick('h1')), s(pick('lcp')), s(pick('js')), pick('cls').toFixed(3).replace('.', ','), kB(pick('bytes'))].map((x) => x.padStart(15)).join('')}`,
      );
      console.log(lines.at(-1));
    }
    lines.push('');
  }
} finally {
  await browser.close();
  server?.close();
}

const out = fileURLToPath(
  new URL(`../test-results/meting-${name.replace(/[^\w.-]+/g, '-')}.txt`, import.meta.url),
);
await mkdir(fileURLToPath(new URL('../test-results/', import.meta.url)), { recursive: true });
await writeFile(out, lines.join('\n') + '\n');
console.log(`\n${lines.join('\n')}\nOpgeslagen in ${relative(process.cwd(), out)}`);
