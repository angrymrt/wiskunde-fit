// Controleert dat een site precies doet wat dist/ en staticwebapp.config.json zeggen: elke pagina is
// gelijk aan het gebouwde bestand, een adres dat niet bestaat geeft een 404, en doorverwijzingen en
// de cache kloppen. Start: node scripts/controleer-site.js https://wiskundefit.nl
// De workflow draait dit na elke deploy, de browsertest tegen de lokale server. Zo volgen die twee
// dezelfde regels.
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dist = new URL('../dist/', import.meta.url);
const read = (path) => readFile(new URL(path, dist), 'utf8');

// Geeft een lijst met fouten. Leeg betekent: alles klopt.
async function check(site, { wait = 0 } = {}) {
  const { PAGES } = await import('../src/js/pages.js');
  const config = JSON.parse(await read('staticwebapp.config.json'));
  const at = (path) => new URL(path, site).href;
  const get = (path) => fetch(at(path), { redirect: 'manual' });
  const failures = [];
  const expect = (ok, message) => ok || failures.push(message);

  // Wacht tot de nieuwe versie online staat: dan is /over precies het gebouwde bestand.
  const over = await read('over/index.html');
  for (let i = 0; ; i++) {
    const res = await get('/over').catch(() => null);
    if (res?.status === 200 && (await res.text()) === over) break;
    if (i >= wait) {
      failures.push(`/over is niet de versie uit dist/ (status ${res?.status ?? 'geen antwoord'})`);
      return failures;
    }
    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }

  // Elke pagina en elke schil, met de juiste status en precies de gebouwde inhoud.
  for (const page of PAGES) {
    const path = page.path ?? '/bestaat-niet';
    const res = await get(path);
    expect(res.status === (page.path ? 200 : 404), `${path} gaf ${res.status}`);
    expect((await res.text()) === (await read(page.file)), `${path} is niet ${page.file}`);
    expect(/^text\/html/.test(res.headers.get('content-type')), `${path} is geen HTML`);
  }
  for (const file of ['sitemap.xml', 'robots.txt']) {
    const res = await get(`/${file}`);
    expect(res.status === 200 && (await res.text()) === (await read(file)), `/${file} klopt niet`);
  }

  // Azure toont Home ook op /index en de 404-pagina ook op /404, allebei met status 200. Home heeft
  // een canonical naar /, en JavaScript zet het adres op /.
  for (const [path, file] of [
    ['/index', 'index.html'],
    ['/404', '404.html'],
  ]) {
    const res = await get(path);
    expect(
      res.status === 200 && (await res.text()) === (await read(file)),
      `${path} is niet ${file}`,
    );
  }

  // Wat niet bestaat, is een echte 404. Hoofdletters tellen, en een doorverwijzing komt er alleen
  // als het bestand bestaat.
  for (const path of [
    '/Over',
    '/Over/',
    '/over.html',
    '/bestaat-niet/',
    '/bestaat-niet/index',
    '/404/index',
    '/favicon',
    '/favicon.ico',
    '/bestaat-niet.png',
    '/assets/bestaat-niet.js',
  ]) {
    expect((await get(path)).status === 404, `${path} geeft geen 404`);
  }

  // Een streep aan het eind, .html of /index gaat met een 301 naar het adres zonder, met de
  // parameters. Bij Home blijft /index staan.
  const moved = async (from, to, status = 301) => {
    const res = await get(from);
    const location = res.headers.get('location');
    const target = location && new URL(location, at(from));
    expect(
      res.status === status && target?.pathname + target?.search === to,
      `${from} gaf ${res.status} naar ${location} in plaats van ${status} naar ${to}`,
    );
  };
  await moved('/over/', '/over');
  await moved('/over/?soort=3', '/over?soort=3');
  await moved('/over/index', '/over');
  await moved('/over/index.html?soort=3', '/over?soort=3');
  await moved('/over/index/', '/over');
  await moved('/meetkunde/index', '/meetkunde');
  await moved('/mijn-stof/oefenen/index', '/mijn-stof/oefenen');
  await moved('/index.html', '/index');
  await moved('/index/', '/index');
  await moved('/404.html', '/404');
  await moved('/sitemap.xml/', '/sitemap.xml');
  for (const route of config.routes.filter((r) => r.redirect)) {
    await moved(route.route, route.redirect, route.statusCode || 302);
  }

  // De code, de CSS, de lettertypes en het logo mag de browser een jaar bewaren.
  for (const name of await readdir(new URL('assets/', dist))) {
    const res = await get(`/assets/${name}`);
    expect(res.status === 200, `/assets/${name} gaf ${res.status}`);
    expect(
      /immutable/.test(res.headers.get('cache-control')),
      `/assets/${name} heeft cache-control ${res.headers.get('cache-control')}`,
    );
    await res.arrayBuffer();
  }
  return failures;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const site = process.argv[2];
  if (!site) throw new Error('Geef het adres van de site, zoals https://wiskundefit.nl');
  // Online kan het even duren voordat de nieuwe versie overal staat: wacht tot 2 minuten.
  const failures = await check(site, { wait: 12 });
  for (const f of failures) console.log(`::error::${f}`);
  if (failures.length) process.exit(1);
  console.log(`${site} klopt met dist/`);
}

export { check };
