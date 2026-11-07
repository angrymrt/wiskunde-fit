// Alle onderwerpen per domein, op volgorde. Een nieuw onderwerp voeg je hier toe.
import rekenen from './rekenen-met-een-formule.js';
import lijnen from './lineaire-grafieken-tekenen.js';
import opstellen from './lineaire-formule-opstellen.js';
import snijpunten from './snijpunten-van-lijnen.js';
import vergelijkingen from './lineaire-vergelijkingen.js';
import ongelijkheden from './lineaire-ongelijkheden.js';
import tweeVariabelen from './vergelijkingen-met-twee-variabelen.js';
import pythagoras from './stelling-van-pythagoras.js';
import verhoudingen from './verhoudingstabellen.js';
import gelijkvormig from './gelijkvormige-driehoeken.js';
import aantonen from './gelijkvormigheid-aantonen.js';
import lengtes from './lengtes-van-lijnstukken-berekenen.js';

// ch is tijdelijk: de proeftoets kiest nog op hoofdstuk, tot de stofkeuze er is.
const DOMAINS = [
  {
    slug: 'formules-en-grafieken',
    name: 'Formules en grafieken',
    color: 'blue',
    ch: 1,
    topics: [rekenen, lijnen, opstellen, snijpunten],
  },
  {
    slug: 'vergelijkingen-en-ongelijkheden',
    name: 'Vergelijkingen en ongelijkheden',
    color: 'forest',
    ch: 1,
    topics: [vergelijkingen, ongelijkheden, tweeVariabelen],
  },
  {
    slug: 'meetkunde',
    name: 'Meetkunde',
    color: 'orange',
    ch: 2,
    topics: [pythagoras, verhoudingen, gelijkvormig, aantonen, lengtes],
  },
];

// Stof die je al moet kennen voordat je aan een onderwerp begint.
const PREREQUISITES = new Map([
  [rekenen, [vergelijkingen]],
  [lijnen, [rekenen]],
  [opstellen, [lijnen]],
  [snijpunten, [vergelijkingen, lijnen]],
  [ongelijkheden, [vergelijkingen, snijpunten]],
  [tweeVariabelen, [lijnen]],
  [gelijkvormig, [verhoudingen, pythagoras]],
  [aantonen, [gelijkvormig]],
  [lengtes, [pythagoras, gelijkvormig]],
]);

const TOPICS = DOMAINS.flatMap((d) => d.topics);
const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.slug, t]));
for (const domain of DOMAINS) {
  domain.topics.forEach((t, i) => {
    t.domain = domain;
    t.ch = domain.ch;
    t.next = domain.topics[i + 1] || null;
    t.prerequisites = PREREQUISITES.get(t) || [];
    t.skills = t.skills.map(([id, name, gen]) => ({ id, name, gen }));
  });
}

export { DOMAINS, TOPICS, TOPIC };
