// Een token voor de review-agent (#67). De agent doet zijn review als GitHub App en niet als de eigenaar,
// zodat te zien is wie wat schreef en de review "Request changes" of "Approve" kan zijn. Het script maakt met
// de private key van de app een JWT, en ruilt die bij GitHub in voor een installation token dat een uur
// geldig is. Alleen `node:crypto` en `fetch`, geen pakketten.
//
//   REVIEW_APP_ID=123456 REVIEW_APP_KEY=C:\pad\naar\sleutel.pem node scripts/review-token.js
//
// Het token komt op stdout, voor gebruik als `GH_TOKEN` bij `gh`. In PowerShell:
//   $env:GH_TOKEN = node scripts/review-token.js
//
// REVIEW_APP_REPO (standaard angrymrt/wiskunde-fit) is de repository waarvan de installatie wordt gezocht.
// De private key staat buiten de repository en komt nooit in git.
import { createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const b64url = (data) => Buffer.from(data).toString('base64url');

// De JWT waarmee de app zich bekendmaakt (RS256). GitHub staat hoogstens 10 minuten toe en wil dat `iat`
// een minuut terug staat, voor een klok die iets afwijkt.
export function maakJwt({ appId, privateKey, nu = Math.floor(Date.now() / 1000) }) {
  const kop = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const inhoud = b64url(JSON.stringify({ iat: nu - 60, exp: nu + 9 * 60, iss: String(appId) }));
  const handtekening = createSign('RSA-SHA256').update(`${kop}.${inhoud}`).sign(privateKey);
  return `${kop}.${inhoud}.${b64url(handtekening)}`;
}

async function gh(pad, jwt, opties = {}) {
  const r = await fetch(`https://api.github.com${pad}`, {
    ...opties,
    headers: {
      Authorization: `Bearer ${jwt}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'wiskundefit-review',
    },
  });
  if (!r.ok) throw new Error(`GitHub gaf ${r.status} bij ${pad}: ${await r.text()}`);
  return r.json();
}

export async function haalToken({ appId, privateKey, repo }) {
  const jwt = maakJwt({ appId, privateKey });
  const { id } = await gh(`/repos/${repo}/installation`, jwt);
  const { token } = await gh(`/app/installations/${id}/access_tokens`, jwt, { method: 'POST' });
  return token;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { REVIEW_APP_ID, REVIEW_APP_KEY, REVIEW_APP_REPO = 'angrymrt/wiskunde-fit' } = process.env;
  if (!REVIEW_APP_ID || !REVIEW_APP_KEY) {
    console.error(
      'Zet REVIEW_APP_ID (het nummer van de app) en REVIEW_APP_KEY (het pad naar de .pem).',
    );
    process.exit(1);
  }
  try {
    const privateKey = readFileSync(REVIEW_APP_KEY, 'utf8');
    console.log(await haalToken({ appId: REVIEW_APP_ID, privateKey, repo: REVIEW_APP_REPO }));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
