// Telt per soort vraag hoeveel verschillende vragen de generator kan maken, en schrijft dat naar
// data/vragen-tellen.json voor de pagina Zo maken we de vragen (#22).
//
//   npm run vragen-tellen
//
// Elke keuze van een generator gaat via choose (zie math.js). alleKeuzes loopt ze allemaal na en we
// tellen de verschillende vragen: dezelfde vraag via twee keuzes telt één keer. Zijn het er te veel
// om na te lopen, dan schatten we het aantal met schatKeuzes en staat er exact: false.
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { alleKeuzes, schatKeuzes, withSeed } from '../src/js/math.js';
import { fingerprints } from '../tests/vingerafdruk.js';
import { TOPICS } from '../src/js/topics/index.js';

// Boven dit aantal paden lopen we niet alles na, maar schatten we het aantal.
const MAX_PADEN = 100000;

// Wat de vraag bepaalt, net als in tests/vingerafdruk.js, maar met de keuzes van meerkeuze op
// volgorde: een andere volgorde is niet een andere vraag. Een figuur telt mee, want een keuze die
// een figuur is, verschilt daarin.
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

// Te veel om na te lopen: trek N vragen met seeds, zoals een leerling ze krijgt, en tel hoe vaak er
// twee gelijk zijn. Bij D verschillende vragen zijn dat ongeveer N²/(2D) paren. Zo komen we ook
// terecht bij een generator waar veel keuzes dezelfde vraag geven. Zijn er te weinig paren, dan is
// de ruimte te groot om zo te meten en nemen we het aantal paden van schatKeuzes: dat telt vragen
// die twee keuzes gemeen hebben dubbel, dus het is een bovengrens.
const TREKKINGEN = 400000;
const MIN_PAREN = 30;
function schat(skill) {
  const telling = new Map();
  for (let i = 0; i < TREKKINGEN; i++) {
    const k = hash(sleutel(withSeed(((i * 2654435761) % 4294967296) >>> 0, skill.gen)));
    telling.set(k, (telling.get(k) ?? 0) + 1);
  }
  let paren = 0;
  for (const c of telling.values()) paren += (c * (c - 1)) / 2;
  if (paren >= MIN_PAREN) return Math.round((TREKKINGEN * (TREKKINGEN - 1)) / 2 / paren);
  return Math.round(schatKeuzes(skill.gen));
}

export function tel(skill) {
  // Eerst een snelle schatting van het aantal paden, zodat we geen tijd verliezen aan een
  // generator met miljoenen paden.
  if (schatKeuzes(skill.gen, { rondes: 1000, seed: 7 }) > 3 * MAX_PADEN)
    return { aantal: schat(skill), exact: false };
  const gezien = new Set();
  const paden = alleKeuzes(skill.gen, (q) => gezien.add(hash(sleutel(q))), {
    maxPaden: MAX_PADEN,
  });
  if (paden !== null) return { aantal: gezien.size, exact: true };
  return { aantal: schat(skill), exact: false };
}

// Een korte controlesom per soort vraag, snel te berekenen: de vingerafdruk van de vragen bij vaste
// seeds en het aantal paden van een korte schatting. Verandert een generator zo dat het aantal
// vragen anders kan zijn, dan verandert die, en faalt de test tot npm run vragen-tellen is gedraaid.
export function controles(skills = TOPICS.flatMap((t) => t.skills)) {
  const afdruk = fingerprints();
  return Object.fromEntries(
    skills.map((skill) => [
      skill.id,
      hash(`${afdruk[skill.id]} ${schatKeuzes(skill.gen, { rondes: 500, seed: 3 })}`).slice(0, 8),
    ]),
  );
}

export function telAlles() {
  const controle = controles();
  const soorten = {};
  for (const skill of TOPICS.flatMap((t) => t.skills))
    soorten[skill.id] = { ...tel(skill), controle: controle[skill.id] };
  return { soorten };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const start = Date.now();
  const uit = telAlles();
  const bestand = new URL('../data/vragen-tellen.json', import.meta.url);
  // Zonder plusteken bij een grote exponent, zoals Prettier het schrijft.
  await writeFile(bestand, `${JSON.stringify(uit, null, 2).replace(/e\+/g, 'e')}\n`);
  const n = Object.values(uit.soorten);
  console.log(
    `${n.length} soorten: ${n.filter((s) => s.exact).length} exact, ${n.filter((s) => !s.exact).length} geschat, ${Math.round((Date.now() - start) / 1000)} s`,
  );
}
