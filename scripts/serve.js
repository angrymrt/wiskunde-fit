// Kleine webserver om te ontwikkelen: toont src/ zonder bouwstap. Wijzig een bestand en herlaad.
import { fileURLToPath } from 'node:url';
import { startServer } from './server.js';

const src = fileURLToPath(new URL('../src', import.meta.url));
const port = Number(process.env.PORT) || 5173;

await startServer(src, port);
console.log(`Open http://localhost:${port}`);
