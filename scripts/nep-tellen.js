// Maakt nepcijfers om de pagina Cijfers mee te ontwerpen en te testen, in dezelfde vorm als de
// samenvattingen van scripts/tellen-samenvatten.js. Ze komen in data/nep-tellen/, en die map staat
// in .gitignore. Elk bestand heeft "nep": true, en npm run build weigert zo'n bestand. Alleen
// npm run dev:nep gebruikt ze.
//
//   node scripts/nep-tellen.js            acht weken tot en met gisteren
//   node scripts/nep-tellen.js 20         twintig weken
//
// De getallen zijn verzonnen, maar lijken op echt gebruik: sommige vraagsoorten worden veel vaker
// geoefend dan andere, sommige zijn moeilijker, en doordeweeks wordt meer geoefend dan in het
// weekend. Dezelfde seed geeft steeds dezelfde cijfers.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOPICS, makeQuestion } from '../src/js/topics/index.js';
import { MAX_DUUR } from '../src/js/tel.js';
import { telOp, toJSON } from './tellen-samenvatten.js';

const MAP = fileURLToPath(new URL('../data/nep-tellen/', import.meta.url));

// Een eigen toevalsgenerator, zodat dezelfde seed steeds dezelfde nepcijfers geeft.
function generator(seed) {
  let a = seed >>> 0;
  const random = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const between = (lo, hi) => lo + (hi - lo) * random();
  // Een getal rond 1 met een lange staart naar boven, zoals de duur van een antwoord.
  const lognormal = (sigma) =>
    Math.exp(sigma * Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random()));
  const weighted = (items, weight) => {
    let r = random() * items.reduce((s, x) => s + weight(x), 0);
    for (const x of items) if ((r -= weight(x)) < 0) return x;
    return items.at(-1);
  };
  return { random, between, lognormal, weighted };
}

// De valkuilen van een vraagsoort: de ids die in honderd vragen voorkomen.
function trapIds(skill) {
  const ids = new Set();
  for (let seed = 1; seed <= 100; seed++) {
    for (const trap of makeQuestion(skill, seed).traps ?? []) ids.add(trap.id);
  }
  return [...ids];
}

function nepTellen({ weken = 8, seed = 2026, tot = new Date() } = {}) {
  const r = generator(seed);
  // Per vraagsoort hoe populair en hoe moeilijk hij is, en hoe vaak een leerling hulp vraagt.
  const skills = TOPICS.flatMap((t) => t.skills).map((skill, i) => ({
    id: skill.id,
    populair: 1 / (1 + ((i * 7) % 23)) + r.between(0, 0.3),
    goed: r.between(0.35, 0.9),
    hint: r.between(0.03, 0.25),
    uitwerking: r.between(0.02, 0.12),
    duur: r.between(15, 120),
    leeg: r.between(0.02, 0.15),
    valkuilen: trapIds(skill).map((id) => ({ id, vaak: r.between(0.2, 1) })),
  }));

  const dagen = [];
  const dag = new Date(tot);
  dag.setUTCDate(dag.getUTCDate() - 1);
  for (let i = 0; i < weken * 7; i++) {
    const naam = dag.toISOString().slice(0, 10);
    // Minder op vrijdag en zaterdag, het meest op zondag tot en met dinsdag, en steeds iets meer.
    const weekdag = [1.3, 1.2, 1.1, 1, 0.8, 0.4, 0.5][(dag.getUTCDay() + 6) % 7];
    const groei = 1 - i / (weken * 7 * 1.5);
    const pogingen = Math.round(400 * weekdag * groei * r.between(0.7, 1.3));
    const rows = [];
    for (let p = 0; p < pogingen; p++) {
      const s = r.weighted(skills, (x) => x.populair);
      const hint = r.random() < s.hint;
      let uitkomst = 'uitwerking';
      if (r.random() >= s.uitwerking)
        uitkomst = r.random() < s.goed + (hint ? 0.1 : 0) ? 'goed' : 'fout';
      const duur = Math.min(
        MAX_DUUR,
        Math.round(
          uitkomst === 'uitwerking' ? s.duur * 0.4 * r.lognormal(0.8) : s.duur * r.lognormal(0.6),
        ),
      );
      rows.push({ tel: 'poging', soort: s.id, uitkomst, duur, hint });
      // Bij een fout antwoord raakt de leerling soms een bekende valkuil.
      if (uitkomst === 'fout' && s.valkuilen.length && r.random() < 0.45) {
        const v = r.weighted(s.valkuilen, (x) => x.vaak);
        rows.push({ tel: 'valkuil', soort: s.id, valkuil: v.id });
      }
    }
    // Zo nu en dan een proeftoets van tien vragen.
    const toetsen = Math.round(pogingen / 60);
    for (let t = 0; t < toetsen; t++) {
      rows.push({ tel: 'proeftoets' });
      for (let q = 0; q < 10; q++) {
        const s = r.weighted(skills, (x) => x.populair);
        const leeg = r.random() < s.leeg;
        const uitkomst = leeg ? 'leeg' : r.random() < s.goed - 0.05 ? 'goed' : 'fout';
        rows.push({ tel: 'toetsvraag', soort: s.id, uitkomst });
      }
    }
    dagen.push([naam, telOp(rows).samenvatting]);
    dag.setUTCDate(dag.getUTCDate() - 1);
  }
  return dagen.reverse();
}

// Een bestand zoals in data/tellen/, met "nep": true als eerste regel.
const nepJSON = (samenvatting) => toJSON(samenvatting).replace('{\n', '{\n  "nep": true,\n');

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const weken = Number(process.argv[2]) || 8;
  rmSync(MAP, { recursive: true, force: true });
  mkdirSync(MAP, { recursive: true });
  const dagen = nepTellen({ weken });
  for (const [naam, samenvatting] of dagen) {
    writeFileSync(join(MAP, `${naam}.json`), nepJSON(samenvatting));
  }
  console.log(`${dagen.length} dagen met nepcijfers in data/nep-tellen/`);
}

export { nepTellen, nepJSON };
