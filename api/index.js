// Meldt /api/tel aan bij Azure Functions. scripts/build.js bundelt dit met api/tel.js in dist-api/,
// met de ids van de vraagsoorten in __SOORTEN__. De workflow installeert daar @azure/functions en
// zet het geheel in de Function App.
import { app } from '@azure/functions';
import { handleTel, insertRow } from './tel.js';

const soorten = new Set(__SOORTEN__);

app.http('tel', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request) => {
    const req = {
      method: request.method,
      origin: request.headers.get('origin'),
      userAgent: request.headers.get('user-agent'),
      body: await request.text(),
    };
    const status = await handleTel(req, { env: process.env, soorten, store: insertRow }).catch(
      () => 502,
    );
    return { status };
  },
});
