// Meet met Lighthouse (mobiel profiel) Home en een oefenscherm, op de preview en op de site die nu
// online staat, en maakt er een vergelijking van in Markdown.
//
//   node scripts/lighthouse.js <preview> [live]     live is standaard https://wiskundefit.nl
//
// Gebruikt door de workflow Online zetten bij een pull request. De tekst komt op stdout, en in het
// bestand uit LIGHTHOUSE_UIT als die is gezet. RUNS (standaard 3) is het aantal metingen per adres:
// we nemen de middelste, want één meting schommelt. Zet CHROME_PATH op Edge of Chrome als Lighthouse
// de browser niet vindt. SEO telt niet mee: een preview en een oefenscherm zijn noindex.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSIE = '13.6.0';
export const PAGINAS = [
  { naam: 'Home', pad: '/' },
  { naam: 'Oefenscherm', pad: '/top-en-snijpunten-van-een-parabool/oefenen' },
];
const CATEGORIEEN = [
  ['performance', 'Prestaties'],
  ['accessibility', 'Toegankelijkheid'],
  ['best-practices', 'Beste werkwijzen'],
];
const METINGEN = [
  ['largest-contentful-paint', 'LCP (s)', (ms) => ms / 1000, 1],
  ['total-blocking-time', 'TBT (ms)', (ms) => ms, 0],
  ['cumulative-layout-shift', 'CLS', (x) => x, 3],
];
// Een score die zoveel punten lager is dan live valt op. Kleiner verschil is meetruis.
const DREMPEL = 3;

export const mediaan = (lijst) => {
  const s = [...lijst].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const meet = (adres) => {
  const map = mkdtempSync(join(tmpdir(), 'lighthouse-'));
  const uit = join(map, 'rapport.json');
  // Op Windows is npx een .cmd en dus een shell nodig. Zet een argument met een spatie dan tussen
  // aanhalingstekens, anders valt het uiteen.
  const win = process.platform === 'win32';
  const npx = win ? 'npx.cmd' : 'npx';
  const arg = (a) => (win && /\s/.test(a) ? `"${a}"` : a);
  const r = spawnSync(
    npx,
    [
      '-y',
      `lighthouse@${VERSIE}`,
      adres,
      '--output=json',
      `--output-path=${uit}`,
      '--quiet',
      '--only-categories=performance,accessibility,best-practices',
      '--chrome-flags=--headless=new --no-sandbox',
    ].map(arg),
    { encoding: 'utf8', shell: win, timeout: 180000 },
  );
  try {
    if (r.status !== 0) throw new Error(`Lighthouse faalde voor ${adres}: ${r.stderr || r.error}`);
    const rapport = JSON.parse(readFileSync(uit, 'utf8'));
    const waarden = {};
    for (const [id] of CATEGORIEEN) {
      const score = rapport.categories[id].score;
      if (score === null) throw new Error(`Lighthouse gaf geen score voor ${id} bij ${adres}`);
      waarden[id] = Math.round(score * 100);
    }
    for (const [id] of METINGEN) waarden[id] = rapport.audits[id].numericValue;
    return waarden;
  } finally {
    rmSync(map, { recursive: true, force: true });
  }
};

// De middelste van alle metingen, per waarde.
export const meetMediaan = (adres, runs, meetFn = meet) => {
  // Een mislukte meting slaan we over, zolang er minstens één lukt.
  const alle = [];
  let fout;
  for (let i = 0; i < runs; i++) {
    try {
      alle.push(meetFn(adres));
    } catch (e) {
      fout = e;
      console.error(e.message);
    }
  }
  if (!alle.length) throw fout;
  return Object.fromEntries(Object.keys(alle[0]).map((k) => [k, mediaan(alle.map((m) => m[k]))]));
};

// Een getal met komma en een teken bij een verschil, en nooit -0,0.
const fmt = (x, dec, teken = false) => {
  const t = x.toFixed(dec);
  const nul = Number(t) === 0;
  return `${teken && !nul && x > 0 ? '+' : ''}${(nul ? t.replace('-', '') : t).replace('.', ',')}`;
};

// De tabel voor één pagina. live en preview komen uit meetMediaan.
export const tabel = (pagina, live, preview) => {
  const regels = [
    `**${pagina.naam}** (${pagina.pad})`,
    '',
    '| | Live | Preview | Verschil |',
    '| --- | ---: | ---: | ---: |',
  ];
  for (const [id, naam] of CATEGORIEEN) {
    const v = preview[id] - live[id];
    const vlag = v <= -DREMPEL ? ' ⚠️' : '';
    regels.push(`| ${naam} | ${live[id]} | ${preview[id]} | ${v > 0 ? '+' : ''}${v}${vlag} |`);
  }
  for (const [id, naam, om, dec] of METINGEN) {
    const a = om(live[id]);
    const b = om(preview[id]);
    const v = b - a;
    regels.push(`| ${naam} | ${fmt(a, dec)} | ${fmt(b, dec)} | ${fmt(v, dec, true)} |`);
  }
  return regels.join('\n');
};

export const opmerking = (preview, live, resultaten, runs) =>
  [
    '<!-- lighthouse -->',
    '### Lighthouse (mobiel)',
    '',
    `Preview ${preview} tegenover ${live}. Middelste van ${runs} metingen. ⚠️ betekent ${DREMPEL} punten of meer lager dan live. SEO telt niet mee, want de preview en het oefenscherm zijn \`noindex\`. Informatief, niet verplicht.`,
    '',
    ...resultaten.map(({ pagina, live: l, preview: p }) => `${tabel(pagina, l, p)}\n`),
  ].join('\n');

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const preview = (process.argv[2] ?? '').replace(/\/$/, '');
  const live = (process.argv[3] ?? 'https://wiskundefit.nl').replace(/\/$/, '');
  if (!preview) {
    console.error('Gebruik: node scripts/lighthouse.js <preview> [live]');
    process.exit(1);
  }
  const runs = Number(process.env.RUNS) || 3;
  const resultaten = PAGINAS.map((pagina) => ({
    pagina,
    live: meetMediaan(live + pagina.pad, runs),
    preview: meetMediaan(preview + pagina.pad, runs),
  }));
  const tekst = opmerking(preview, live, resultaten, runs);
  console.log(tekst);
  if (process.env.LIGHTHOUSE_UIT) writeFileSync(process.env.LIGHTHOUSE_UIT, tekst);
}
