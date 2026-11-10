// Leest de samenvattingen per dag voor de pagina Cijfers: de echte uit data/tellen/, of met
// npm run dev:nep de nepcijfers uit data/nep-tellen/ (zie scripts/nep-tellen.js).
//
// Nepcijfers mogen nooit online komen. Daarom weigert dit een bestand met "nep": true als het om de
// echte cijfers gaat, en een bestand zonder als het om nepcijfers gaat. Ook een onbekende soort tel
// of een onbekend veld stopt de build, zodat er nooit iets op de pagina komt wat niet klopt.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VORM } from '../src/js/tel.js';

const DAG = /^(\d{4}-\d{2}-\d{2})\.json$/;

function checkDag(naam, data, nep) {
  if ((data.nep === true) !== nep) {
    throw new Error(
      nep
        ? `${naam} is geen nepbestand, en hoort niet bij de nepcijfers.`
        : `${naam} bevat nepcijfers, en die mogen nooit online komen.`,
    );
  }
  for (const [tel, list] of Object.entries(data)) {
    if (tel === 'nep') continue;
    if (!VORM[tel] || !Array.isArray(list)) throw new Error(`${naam}: onbekende soort tel ${tel}`);
    const keys = [...Object.keys(VORM[tel]), 'aantal'];
    for (const c of list) {
      const ok =
        Object.keys(c).length === keys.length &&
        keys.every((k) => k in c) &&
        (!('soort' in c) || Number.isInteger(c.soort)) &&
        Number.isInteger(c.aantal) &&
        c.aantal > 0;
      if (!ok) throw new Error(`${naam}: ${JSON.stringify(c)} klopt niet`);
    }
  }
}

// Geeft [[dag, samenvatting], ...] terug, op volgorde van dag. Een map die niet bestaat is leeg.
function leesTellen(map, { nep = false } = {}) {
  if (!existsSync(map)) return [];
  const dagen = [];
  for (const naam of readdirSync(map).sort()) {
    const match = DAG.exec(naam);
    if (!match) throw new Error(`${join(map, naam)} hoort niet in deze map.`);
    const data = JSON.parse(readFileSync(join(map, naam), 'utf8'));
    checkDag(naam, data, nep);
    const { nep: _, ...samenvatting } = data;
    dagen.push([match[1], samenvatting]);
  }
  return dagen;
}

export { leesTellen };
