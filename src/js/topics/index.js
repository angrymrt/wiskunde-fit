// Alle onderwerpen per domein, op volgorde. Een nieuw onderwerp voeg je hier toe.
import rekenen from './rekenen-met-een-formule.js';
import lijnen from './lineaire-grafieken-tekenen.js';
import opstellen from './lineaire-formule-opstellen.js';
import snijpunten from './snijpunten-van-lijnen.js';
import kwadratisch from './kwadratische-functies.js';
import vergelijkingen from './lineaire-vergelijkingen.js';
import ongelijkheden from './lineaire-ongelijkheden.js';
import tweeVariabelen from './vergelijkingen-met-twee-variabelen.js';
import kwVergelijkingen from './kwadratische-vergelijkingen.js';
import ontbinden from './ontbinden-in-factoren.js';
import pythagoras from './stelling-van-pythagoras.js';
import verhoudingen from './verhoudingstabellen.js';
import gelijkvormig from './gelijkvormige-driehoeken.js';
import aantonen from './gelijkvormigheid-aantonen.js';
import lengtes from './lengtes-van-lijnstukken-berekenen.js';
import { newSeed, withSeed } from '../math.js';
import { roundTraps } from '../answers.js';

const DOMAINS = [
  {
    slug: 'rekenen-met-letters',
    name: 'Rekenen met letters',
    intro:
      'Bij rekenen met letters werk je met termen als 3x en x² zonder te weten welk getal x is. Hier leer je een som van termen schrijven als een product. Dat heet ontbinden in factoren, en je hebt het nodig bij kwadratische vergelijkingen.',
    description:
      'Rekenen met letters: ontbinden in factoren met x buiten haakjes en de product-som-methode. Gratis wiskunde oefenen met uitleg.',
    color: 'plum',
    topics: [ontbinden],
  },
  {
    slug: 'formules-en-grafieken',
    name: 'Formules en grafieken',
    intro:
      'Een formule zegt hoe twee hoeveelheden samenhangen, en een grafiek laat dat zien. Hier reken je met formules, teken je rechte lijnen en stel je zelf een formule op. Ook bereken je waar twee lijnen elkaar snijden, en werk je met parabolen.',
    description:
      'Rekenen met formules, lineaire grafieken, een formule opstellen, snijpunten van lijnen en kwadratische functies. Gratis wiskunde oefenen met uitleg.',
    color: 'blue',
    topics: [rekenen, lijnen, opstellen, snijpunten, kwadratisch],
  },
  {
    slug: 'vergelijkingen-en-ongelijkheden',
    name: 'Vergelijkingen en ongelijkheden',
    intro:
      'Bij een vergelijking zoek je wanneer twee kanten even groot zijn. Bij een ongelijkheid zoek je wanneer de ene kant groter of kleiner is dan de andere. Hier leer je ze oplossen, ook als er twee variabelen of een kwadraat in staan.',
    description:
      'Lineaire vergelijkingen en ongelijkheden oplossen, ook met haakjes, breuken en twee variabelen, en kwadratische vergelijkingen. Gratis oefenen met uitleg.',
    color: 'forest',
    topics: [vergelijkingen, ongelijkheden, tweeVariabelen, kwVergelijkingen],
  },
  {
    slug: 'meetkunde',
    name: 'Meetkunde',
    intro:
      'Meetkunde gaat over figuren, lengtes en hoeken. Hier bereken je zijden met de stelling van Pythagoras en met verhoudingstabellen, en leer je wanneer twee driehoeken gelijkvormig zijn.',
    description:
      'Stelling van Pythagoras, verhoudingstabellen en gelijkvormige driehoeken: bereken zijden en lengtes. Gratis wiskunde oefenen met uitleg.',
    color: 'orange',
    topics: [pythagoras, verhoudingen, gelijkvormig, aantonen, lengtes],
  },
];

// Stof die je al moet kennen voordat je aan een onderwerp begint.
const PREREQUISITES = new Map([
  [rekenen, [vergelijkingen]],
  [lijnen, [rekenen]],
  [opstellen, [lijnen]],
  [snijpunten, [vergelijkingen, lijnen]],
  [kwadratisch, [rekenen]],
  [ongelijkheden, [vergelijkingen, snijpunten]],
  [tweeVariabelen, [lijnen]],
  [kwVergelijkingen, [ontbinden, vergelijkingen]],
  [gelijkvormig, [verhoudingen, pythagoras]],
  [aantonen, [gelijkvormig]],
  [lengtes, [pythagoras, gelijkvormig]],
]);

const DOMAIN = Object.fromEntries(DOMAINS.map((d) => [d.slug, d]));
const TOPICS = DOMAINS.flatMap((d) => d.topics);
const TOPIC = Object.fromEntries(TOPICS.map((t) => [t.slug, t]));
for (const domain of DOMAINS) {
  domain.topics.forEach((t, i) => {
    t.domain = domain;
    t.prev = domain.topics[i - 1] || null;
    t.next = domain.topics[i + 1] || null;
    t.prerequisites = PREREQUISITES.get(t) || [];
    t.skills = t.skills.map(([id, name, gen]) => ({ id, name, gen }));
  });
}

// Maakt een vraag van een vraagsoort met een seed, en bewaart die seed in de vraag. Zo is elke
// vraag precies te herhalen, bijvoorbeeld bij een foutmelding.
// Een vraag met afronden krijgt na zijn eigen valkuilen ook die voor afronden.
function makeQuestion(skill, seed = newSeed()) {
  const q = withSeed(seed, skill.gen);
  const traps = [...(q.traps ?? []), ...roundTraps(q.fields)];
  return { ...q, ...(traps.length ? { traps } : {}), seed };
}

export { DOMAINS, DOMAIN, TOPICS, TOPIC, makeQuestion };
