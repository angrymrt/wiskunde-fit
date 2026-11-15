// Telt per vraagsoort hoeveel verschillende vragen de generator kan maken, en schrijft dat naar
// data/vragen-tellen.json voor de pagina Zo maken we de vragen (#22).
//
//   npm run vragen-tellen
//
// Elke keuze van een generator gaat via choose (zie math.js). alleKeuzes loopt ze allemaal na en we
// tellen de verschillende vragen: dezelfde vraag via twee keuzes telt één keer. Zijn het er te veel
// om na te lopen, dan schatten we het aantal met schatKeuzes en staat er exact: false.
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { alleKeuzes, schatKeuzes, withSeed } from '../src/js/math.js';
import { fingerprints } from '../tests/vingerafdruk.js';
import { TOPICS } from '../src/js/topics/index.js';

// Boven dit aantal bezochte paden lopen we niet alles na, maar schatten we het aantal.
export const STEMPELS = new URL('../tests/vragen-tellen-stempels.json', import.meta.url);
const MAX_PADEN = 2000000;

// Wat de vraag bepaalt, net als in tests/vingerafdruk.js, maar met de keuzes van meerkeuze op
// volgorde: een andere volgorde is niet een andere vraag. Anders dan de vingerafdruk telt de hele
// figuur mee, ook de opmaak, want een andere figuur is een andere vraag voor de leerling. Wat een
// veld alleen anders opmaakt (label, br, compact) staat al in de vraag of het antwoord.
export const sleutel = (q) =>
  JSON.stringify([
    q.q,
    (q.fields ?? []).map((f) => f.a),
    q.mc ? [[...q.mc.opts].sort(), q.mc.opts[q.mc.a]] : null,
    q.line ?? null,
    q.parabola ?? null,
    q.fig ?? null,
  ]);

const hash = (t) => createHash('sha1').update(t).digest('base64').slice(0, 16);

// Te veel om na te lopen: trek N vragen met seeds, zoals een leerling ze krijgt, en kijk hoe vaak
// dezelfde vraag terugkomt. Niet elke vraag is even waarschijnlijk (een paar vragen komen veel
// vaker voor), dus uit het aantal gelijke paren alleen volgt een veel te laag aantal. Daarom
// gebruiken we Chao1, een schatting uit het aantal vragen dat één keer (f1) en twee keer (f2) is
// getrokken: S + f1(f1 − 1) / (2(f2 + 1)), waarbij S het aantal verschillende vragen in de trekking
// is. Dat is een ondergrens: met meer trekkingen komt er meer uit, en het echte aantal kan veel
// hoger zijn. Daarom krijgt zo'n aantal `ondergrens: true`, en toont de pagina "meer dan".
// Zijn er bijna geen herhalingen, dan zegt de trekking niets over de grootte. Dan nemen we het
// aantal paden van schatKeuzes (een bovengrens, want twee paden kunnen dezelfde vraag geven), maar
// alleen als de trekking daarmee klopt: bij zoveel paden zijn er ongeveer N² / (2 · paden)
// herhalingen te verwachten. Zijn het er veel meer, dan geven veel paden dezelfde vraag en nemen we
// Chao1.
export const TREKKINGEN = 400000;
export function schat(gen, trekkingen = TREKKINGEN) {
  const telling = new Map();
  for (let i = 0; i < trekkingen; i++) {
    const k = hash(sleutel(withSeed(((i * 2654435761) % 4294967296) >>> 0, gen)));
    telling.set(k, (telling.get(k) ?? 0) + 1);
  }
  let f1 = 0;
  let f2 = 0;
  let paren = 0;
  for (const c of telling.values()) {
    if (c === 1) f1++;
    if (c === 2) f2++;
    paren += (c * (c - 1)) / 2;
  }
  const paden = schatKeuzes(gen);
  const verwacht = (trekkingen * (trekkingen - 1)) / 2 / paden;
  if (paren <= 2 * verwacht + 5) return { aantal: Math.round(paden) };
  // Chao1 groeit mee met het aantal trekkingen en is dus een ondergrens: er zijn minstens zoveel.
  const chao1 = telling.size + (f1 * (f1 - 1)) / (2 * (f2 + 1));
  return { aantal: Math.round(Math.min(chao1, paden)), ondergrens: true };
}

export function tel(skill) {
  // Eerst een snelle schatting van het aantal paden, zodat we geen tijd verliezen aan een
  // generator met honderden miljoenen paden.
  if (schatKeuzes(skill.gen, { rondes: 3000, seed: 7 }) > 30 * MAX_PADEN)
    return { ...schat(skill.gen), exact: false };
  const gezien = new Set();
  const paden = alleKeuzes(skill.gen, (q) => gezien.add(hash(sleutel(q))), {
    maxPaden: MAX_PADEN,
  });
  if (paden !== null) return { aantal: gezien.size, exact: true };
  return { ...schat(skill.gen), exact: false };
}

// Een korte stempel per vraagsoort, snel te berekenen: de vingerafdruk van de vragen bij vaste
// seeds en het aantal paden van een korte schatting. Verandert een generator zo dat het aantal
// vragen anders kan zijn, dan verandert die meestal, en faalt de test tot npm run vragen-tellen is
// gedraaid. Niet elke wijziging valt op, bijvoorbeeld een dubbele waarde in een lijst of een tak die
// zelden voorkomt. Draai bij twijfel opnieuw met het nummer van de vraagsoort.
export function stempels(skills = TOPICS.flatMap((t) => t.skills)) {
  const afdruk = fingerprints();
  return Object.fromEntries(
    skills.map((skill) => [
      skill.id,
      hash(`${afdruk[skill.id]} ${schatKeuzes(skill.gen, { rondes: 500, seed: 3 })}`).slice(0, 8),
    ]),
  );
}

// Zonder nummers telt dit alles opnieuw. Met nummers telt het alleen die soorten en blijft de rest
// uit het bestand staan.
export function telAlles(ids = [], oud = {}) {
  const soorten = {};
  for (const skill of TOPICS.flatMap((t) => t.skills)) {
    const behouden = ids.length && !ids.includes(skill.id) && oud[skill.id];
    soorten[skill.id] = behouden ? oud[skill.id] : tel(skill);
  }
  return { soorten };
}

// Zonder plusteken bij een grote exponent, zoals Prettier het schrijft.
const json = (x) => `${JSON.stringify(x, null, 2).replace(/("aantal": [\d.]+)e\+(\d+)/g, '$1e$2')}
`;

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const start = Date.now();
  const invoer = process.argv.slice(2);
  const ids = invoer.map(Number);
  const bekend = TOPICS.flatMap((t) => t.skills).map((k) => k.id);
  const onbekend = invoer.filter((x) => !bekend.includes(Number(x)));
  if (onbekend.length) {
    console.error(
      `Geen vraagsoort met nummer ${onbekend.join(', ')}. Gebruik: npm run vragen-tellen [-- nummers]`,
    );
    process.exit(1);
  }
  const bestand = new URL('../data/vragen-tellen.json', import.meta.url);
  const oud = ids.length ? JSON.parse(await readFile(bestand, 'utf8')).soorten : {};
  const uit = telAlles(ids, oud);
  await writeFile(bestand, json(uit));
  // De stempels staan bij de tests: de pagina heeft ze niet nodig, en elke byte telt daar.
  // Met nummers vervangen we alleen de stempels van die soorten. Een soort die ook veranderd
  // is maar niet is meegegeven, houdt dan haar oude som en laat de test falen.
  const nieuw = stempels();
  const oudeSommen = ids.length ? JSON.parse(await readFile(STEMPELS, 'utf8')) : {};
  const sommen = Object.fromEntries(
    Object.entries(nieuw).map(([id, som]) => [
      id,
      !ids.length || ids.includes(Number(id)) || !(id in oudeSommen) ? som : oudeSommen[id],
    ]),
  );
  await writeFile(STEMPELS, json(sommen));
  const n = Object.values(uit.soorten);
  console.log(
    `${n.length} soorten: ${n.filter((s) => s.exact).length} exact, ${n.filter((s) => !s.exact).length} geschat of ondergrens, ${Math.round((Date.now() - start) / 1000)} s`,
  );
}
