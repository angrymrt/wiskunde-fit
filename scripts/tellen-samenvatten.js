// Vat de losse tellen in een tabel van Azure samen per dag, en verwijdert ze daarna. De workflow
// Tellen samenvatten draait dit elke week. Zie #19.
//
//   node scripts/tellen-samenvatten.js tellersdev
//     toont de samenvatting van alle dagen die voorbij zijn, en verandert niets
//   node scripts/tellen-samenvatten.js tellers --map data/tellen --rijen rijen.json
//     schrijft elke dag naar data/tellen/<dag>.json, en de sleutels van de rijen naar rijen.json
//   node scripts/tellen-samenvatten.js tellers --verwijder rijen.json
//     verwijdert die rijen uit de tabel
//
// Per dag telt het hoe vaak elke combinatie van kenmerken voorkomt. Het tijdstip en de volgorde
// van de rijen vallen daarbij weg. Inloggen gaat met az: in de workflow met OIDC, en lokaal met je
// eigen account, dat dan wel de tabel mag lezen.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VORM } from '../src/js/tel.js';

const ACCOUNT = 'https://stwewiskundefitprd.table.core.windows.net';
const dag = (now) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(now);

// Vergelijkt twee combinaties op de velden in de volgorde van VORM, dus eerst op soort.
const compare = (keys) => (a, b) => {
  for (const key of keys) {
    if (a[key] !== b[key]) return a[key] < b[key] ? -1 : 1;
  }
  return 0;
};

// Vat de rijen van één dag samen: { poging: [{ soort, ..., aantal }], ... }. Een rij van een
// onbekende soort tel slaat het over, en geeft het terug in onbekend.
function telOp(rows) {
  const totals = {};
  const onbekend = [];
  for (const row of rows) {
    if (!VORM[row.tel]) {
      onbekend.push(row);
      continue;
    }
    const keys = [...Object.keys(VORM[row.tel])];
    const pick = Object.fromEntries(keys.map((k) => [k, row[k]]));
    const key = JSON.stringify(pick);
    totals[row.tel] ??= new Map();
    const old = totals[row.tel].get(key);
    totals[row.tel].set(key, { ...pick, aantal: (old?.aantal ?? 0) + 1 });
  }
  const out = {};
  for (const tel of Object.keys(VORM)) {
    if (!totals[tel]) continue;
    const keys = [...Object.keys(VORM[tel])];
    out[tel] = [...totals[tel].values()].sort(compare(keys));
  }
  return { samenvatting: out, onbekend };
}

// Eén combinatie per regel, zodat een pull request per regel laat zien wat er bij komt.
function toJSON(samenvatting) {
  const parts = Object.entries(samenvatting).map(
    ([tel, list]) =>
      `  ${JSON.stringify(tel)}: [\n${list.map((c) => `    ${JSON.stringify(c)}`).join(',\n')}\n  ]`,
  );
  return `{\n${parts.join(',\n')}\n}\n`;
}

// Een tabel met per dag het aantal tellen van elke soort, zodat een uitschieter opvalt.
function overzicht(tabel, dagen) {
  const tellen = Object.keys(VORM);
  const lines = [
    `### ${tabel}`,
    '',
    `| Dag | ${tellen.join(' | ')} |`,
    `| --- | ${tellen.map(() => '---:').join(' | ')} |`,
  ];
  for (const [d, samenvatting] of dagen) {
    const sum = (tel) => (samenvatting[tel] ?? []).reduce((s, c) => s + c.aantal, 0);
    lines.push(`| ${d} | ${tellen.map(sum).join(' | ')} |`);
  }
  if (!dagen.length) lines.push(`| geen | ${tellen.map(() => '').join(' | ')} |`);
  return lines.join('\n') + '\n';
}

const token = () =>
  execSync(
    'az account get-access-token --resource https://storage.azure.com/ --query accessToken -o tsv',
    {
      encoding: 'utf8',
    },
  ).trim();

const headers = (auth) => ({
  Authorization: `Bearer ${auth}`,
  Accept: 'application/json;odata=nometadata',
  'x-ms-version': '2020-12-06',
  DataServiceVersion: '3.0',
});

// Alle rijen van dagen voor vandaag, in pagina's van hoogstens 1000.
async function readRows(tabel, auth, today) {
  const filter = encodeURIComponent(`PartitionKey lt '${today}'`);
  const rows = [];
  let next = '';
  do {
    const res = await fetch(`${ACCOUNT}/${tabel}()?$filter=${filter}${next}`, {
      headers: headers(auth),
    });
    if (!res.ok) throw new Error(`Lezen uit ${tabel} gaf ${res.status}: ${await res.text()}`);
    rows.push(...(await res.json()).value);
    const pk = res.headers.get('x-ms-continuation-NextPartitionKey');
    const rk = res.headers.get('x-ms-continuation-NextRowKey');
    next = pk ? `&NextPartitionKey=${pk}&NextRowKey=${rk}` : '';
  } while (next);
  return rows;
}

// Verwijdert rijen, zestien tegelijk. Een rij die al weg is, is goed. Een tijdelijke fout krijgt
// nog twee kansen.
async function deleteRows(tabel, auth, keys) {
  const one = async ([pk, rk]) => {
    for (let attempt = 1; ; attempt++) {
      const res = await fetch(`${ACCOUNT}/${tabel}(PartitionKey='${pk}',RowKey='${rk}')`, {
        method: 'DELETE',
        headers: { ...headers(auth), 'If-Match': '*' },
      });
      if (res.ok || res.status === 404) return;
      if ((res.status < 500 && res.status !== 429) || attempt >= 3) {
        throw new Error(`Verwijderen uit ${tabel} gaf ${res.status}: ${await res.text()}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  };
  const queue = [...keys];
  await Promise.all(
    Array.from({ length: 16 }, async () => {
      while (queue.length) await one(queue.shift());
    }),
  );
}

async function main(args) {
  const [tabel] = args;
  const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : null);
  if (!tabel || tabel.startsWith('--')) throw new Error('Noem de tabel, zoals tellersdev.');
  const auth = token();

  const verwijder = option('--verwijder');
  if (verwijder) {
    const keys = JSON.parse(readFileSync(verwijder, 'utf8'));
    await deleteRows(tabel, auth, keys);
    console.error(`${keys.length} rijen verwijderd uit ${tabel}.`);
    return;
  }

  const map = option('--map');
  const rijen = option('--rijen');
  const rows = await readRows(tabel, auth, dag(new Date()));
  const perDag = new Map();
  for (const row of rows) {
    if (!perDag.has(row.PartitionKey)) perDag.set(row.PartitionKey, []);
    perDag.get(row.PartitionKey).push(row);
  }
  const dagen = [];
  for (const d of [...perDag.keys()].sort()) {
    const { samenvatting, onbekend } = telOp(perDag.get(d));
    if (onbekend.length) {
      throw new Error(
        `${onbekend.length} rijen van ${d} hebben een onbekende soort tel, zoals ${JSON.stringify(onbekend[0])}`,
      );
    }
    // Een dag die voorbij is, krijgt geen nieuwe rijen. Heeft hij al een bestand, dan zijn deze
    // rijen al geteld en is alleen het verwijderen toen mislukt. Dan tellen ze niet nog eens mee.
    const file = map && join(map, `${d}.json`);
    if (file && existsSync(file)) {
      dagen.push([`${d}, al samengevat`, samenvatting]);
      continue;
    }
    if (file) {
      mkdirSync(map, { recursive: true });
      writeFileSync(file, toJSON(samenvatting));
    }
    dagen.push([d, samenvatting]);
  }
  if (rijen) writeFileSync(rijen, JSON.stringify(rows.map((r) => [r.PartitionKey, r.RowKey])));
  console.log(overzicht(tabel, dagen));
  if (!map)
    for (const [d, samenvatting] of dagen) console.error(`${d}.json\n${toJSON(samenvatting)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}

export { telOp, toJSON, overzicht };
