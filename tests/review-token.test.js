// De JWT voor de review-app (scripts/review-token.js), zonder GitHub.
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createVerify } from 'node:crypto';
import { maakJwt } from '../scripts/review-token.js';

test('de JWT is een geldige RS256-handtekening met de gegevens van de app', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  const nu = 1_700_000_000;
  const [kop, inhoud, hand] = maakJwt({ appId: 123456, privateKey, nu }).split('.');
  assert.deepEqual(JSON.parse(Buffer.from(kop, 'base64url')), { alg: 'RS256', typ: 'JWT' });
  const claims = JSON.parse(Buffer.from(inhoud, 'base64url'));
  assert.deepEqual(claims, { iat: nu - 60, exp: nu + 540, iss: '123456' });
  // GitHub staat hoogstens 10 minuten toe.
  assert.ok(claims.exp - claims.iat <= 600);
  const klopt = createVerify('RSA-SHA256')
    .update(`${kop}.${inhoud}`)
    .verify(publicKey, hand, 'base64url');
  assert.ok(klopt);
});
