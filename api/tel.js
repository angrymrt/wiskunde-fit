// De functie /api/tel: neemt anonieme tellen aan en zet elke tel als losse rij in een tabel van
// Azure, met alleen de dag erbij. Hij logt niets en bewaart geen IP-adres. Zie #19.
// - De functie draait in een eigen Function App, voor wiskundefit.nl en alle previews samen. Tellen
//   vanaf wiskundefit.nl gaan naar de tabel in TELLERS_TABEL, die van een preview of lokaal naar
//   TELLERS_DEV_TABEL.
// - Hij schrijft met de managed identity van de Function App, die alleen rijen mag toevoegen. Er
//   is dus geen sleutel. Zie scripts/azure-tellers.ps1.
// - Zonder setting controleert hij de tellen wel, maar bewaart hij niets.
// api/index.js meldt de functie aan bij Azure, scripts/server.js gebruikt hem voor npm run dev.
import { randomUUID } from 'node:crypto';
import { checkTellen } from '../src/js/tel.js';

const PROD = 'https://wiskundefit.nl';
// Een preview van de Static Web App, of npm run dev en de browsertest.
const DEV =
  /^(https:\/\/proud-meadow-0cf492e03(-\d+)?\.[a-z]+\.\d+\.azurestaticapps\.net|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;
// Zoekmachines en meetprogramma's. Die krijgen gewoon antwoord, maar tellen niet mee.
const BOT = /bot|crawl|spider|slurp|headless|lighthouse/i;
const MAX_BODY = 8 * 1024;
// De dag in Nederlandse tijd, zoals 2026-11-12. Dat is de PartitionKey.
const dag = (now) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(now);

const allowed = (origin) => origin === PROD || DEV.test(origin ?? '');
// De functie staat op een ander adres dan de site. De site leest het antwoord niet (no-cors), maar
// met deze headers meldt een browser ook geen CORS-fout.
function corsHeaders(origin) {
  if (!allowed(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

// req: { method, origin, userAgent, body }. Geeft de HTTP-status terug.
async function handleTel(req, { env, soorten, store, now = new Date() }) {
  if (req.method === 'OPTIONS') return allowed(req.origin) ? 204 : 403;
  if (req.method !== 'POST') return 405;
  const prod = req.origin === PROD;
  if (!allowed(req.origin)) return 403;
  if (BOT.test(req.userAgent ?? '')) return 204;
  if (!req.body || req.body.length > MAX_BODY) return 400;
  let tellen;
  try {
    tellen = checkTellen(JSON.parse(req.body), soorten);
  } catch (e) {
    return 400;
  }
  if (!tellen) return 400;
  const table = prod ? env.TELLERS_TABEL : env.TELLERS_DEV_TABEL;
  if (!table) return 204;
  // Een willekeurige RowKey, zodat de volgorde van binnenkomst niet in de sleutel zit.
  const PartitionKey = dag(now);
  await Promise.all(tellen.map((t) => store(table, { PartitionKey, RowKey: randomUUID(), ...t })));
  return 204;
}

// Een token van de managed identity voor Azure Storage. Azure zet IDENTITY_ENDPOINT en
// IDENTITY_HEADER in de Function App. Het token blijft bewaard tot vijf minuten voor het verloopt.
let token = null;
async function storageToken(env) {
  if (token && token.until > Date.now()) return token.value;
  const url = `${env.IDENTITY_ENDPOINT}?resource=${encodeURIComponent('https://storage.azure.com/')}&api-version=2019-08-01`;
  const res = await fetch(url, { headers: { 'X-IDENTITY-HEADER': env.IDENTITY_HEADER } });
  if (!res.ok) throw new Error(`Geen token voor de tabel: ${res.status}`);
  const { access_token: value, expires_on: expires } = await res.json();
  token = { value, until: Number(expires) * 1000 - 5 * 60_000 };
  return value;
}

// Zet één rij in de tabel, met de REST API van Azure Table Storage.
async function insertRow(table, row, env = process.env) {
  const res = await fetch(table, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await storageToken(env)}`,
      'Content-Type': 'application/json',
      Accept: 'application/json;odata=nometadata',
      Prefer: 'return-no-content',
      'x-ms-version': '2020-12-06',
      DataServiceVersion: '3.0',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`De tabel gaf ${res.status}`);
}

export { corsHeaders, handleTel, insertRow };
