// Kleine webserver om te ontwikkelen: bouwt de site in dist-dev/ en toont die zoals Azure dat doet.
// Wijzig je iets in src/ of staticwebapp.config.json, dan bouwt hij opnieuw. Herlaad daarna.
// dist/ blijft zo van npm run build, de browsertest en scripts/controleer-site.js.
import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.js';

const root = new URL('../', import.meta.url);
const port = Number(process.env.PORT) || 5173;

// In een apart proces, want Node bewaart geïmporteerde bestanden en zou de oude code gebruiken.
let running = null,
  again = false;
function rebuild() {
  if (running) return void (again = true);
  running = spawn(process.execPath, ['scripts/build.js', '--dev'], {
    cwd: fileURLToPath(root),
    stdio: 'inherit',
  });
  return new Promise((resolve) =>
    running.on('exit', () => {
      running = null;
      if (again) {
        again = false;
        rebuild();
      }
      resolve();
    }),
  );
}

await rebuild();
let timer;
const changed = () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 100);
};
watch(fileURLToPath(new URL('src/', root)), { recursive: true }, changed);
watch(fileURLToPath(new URL('staticwebapp.config.json', root)), changed);
await startServer(fileURLToPath(new URL('dist-dev', root)), port);
console.log(`Open http://localhost:${port}`);
