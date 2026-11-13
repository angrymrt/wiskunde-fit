// Alle onderwerpen per domein, op volgorde. Een nieuw onderwerp voeg je hier toe.
//
// In Node is van elk onderwerp alles meteen beschikbaar. In de browser staat bij het eerste bezoek
// van elk onderwerp alleen de catalogus: de naam, het adres, de intro en de namen van de
// vraagsoorten. De build zet die op de plek van de imports hieronder (zie scripts/catalogus.js).
// De generatoren en de uitleg komen pas met laadOnderwerpen().
import rekenen from './rekenen-met-een-formule.js';
import lijnen from './lineaire-grafieken-tekenen.js';
import opstellen from './lineaire-formule-opstellen.js';
import snijpunten from './snijpunten-van-lijnen.js';
import kwadratisch from './kwadratische-functies.js';
import topSnijpunten from './top-en-snijpunten-van-een-parabool.js';
import verschuiven from './parabolen-verschuiven.js';
import vergelijkingen from './lineaire-vergelijkingen.js';
import ongelijkheden from './lineaire-ongelijkheden.js';
import tweeVariabelen from './vergelijkingen-met-twee-variabelen.js';
import kwVergelijkingen from './kwadratische-vergelijkingen.js';
import ontbinden from './ontbinden-in-factoren.js';
import haakjes from './haakjes-wegwerken.js';
import pythagoras from './stelling-van-pythagoras.js';
import verhoudingen from './verhoudingstabellen.js';
import gelijkvormig from './gelijkvormige-driehoeken.js';
import aantonen from './gelijkvormigheid-aantonen.js';
import lengtes from './lengtes-van-lijnstukken-berekenen.js';
import procenten from './procentuele-verandering.js';
import terugrekenen from './rekenen-met-procenten.js';
import tabellen from './tabellen-en-diagrammen.js';
import { newSeed, withSeed } from '../math.js';
import { roundTraps } from '../answers.js';

const DOMAINS = [
  {
    slug: 'getallen-en-rekenen',
    name: 'Getallen en rekenen',
    intro:
      'Bij getallen en rekenen reken je met getallen uit het dagelijks leven, zoals prijzen en aantallen. Hier reken je met procenten: hoeveel procent iets is, met hoeveel procent het is veranderd, en wat er na een of meer veranderingen van over is. Ook reken je terug naar het oude getal of het totaal, en reken je met miljoenen en miljarden.',
    description:
      'Rekenen met procenten: procentuele verandering, de vermenigvuldigingsfactor, procent op procent en terugrekenen. Gratis wiskunde oefenen met uitleg.',
    color: 'teal',
    topics: [procenten, terugrekenen],
  },
  {
    slug: 'rekenen-met-letters',
    name: 'Rekenen met letters',
    intro:
      'Bij rekenen met letters werk je met termen als 3x en x² zonder te weten welk getal x is. Hier leer je een som van termen schrijven als een product. Dat heet ontbinden in factoren, en je hebt het nodig bij kwadratische vergelijkingen. Ook leer je het omgekeerde: haakjes wegwerken.',
    description:
      'Rekenen met letters: ontbinden in factoren met x buiten haakjes en de product-som-methode, en haakjes wegwerken. Gratis wiskunde oefenen met uitleg.',
    color: 'plum',
    topics: [ontbinden, haakjes],
  },
  {
    slug: 'formules-en-grafieken',
    name: 'Formules en grafieken',
    intro:
      'Een formule zegt hoe twee hoeveelheden samenhangen, en een grafiek laat dat zien. Hier reken je met formules, teken je rechte lijnen en stel je zelf een formule op. Ook bereken je waar twee lijnen elkaar snijden, en werk je met parabolen: de top, de snijpunten met de assen en verschuiven.',
    description:
      'Rekenen met formules, lineaire grafieken, snijpunten van lijnen, kwadratische functies, de top van een parabool en verschuiven. Gratis oefenen met uitleg.',
    color: 'blue',
    topics: [rekenen, lijnen, opstellen, snijpunten, kwadratisch, topSnijpunten, verschuiven],
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
  {
    slug: 'statistiek',
    name: 'Statistiek',
    intro:
      'Bij statistiek verzamel je gegevens en zet je ze overzichtelijk in een tabel of een diagram. Hier reken je met gegevens uit tabellen, staafdiagrammen en cirkeldiagrammen, en leer je welk diagram bij welke gegevens past.',
    description:
      'Statistiek: rekenen met tabellen en diagrammen, met het gemiddelde, een aandeel en de procentuele verandering. Gratis wiskunde oefenen met uitleg.',
    color: 'berry',
    topics: [tabellen],
  },
];

// Stof die je al moet kennen voordat je aan een onderwerp begint.
const PREREQUISITES = new Map([
  [rekenen, [vergelijkingen]],
  [lijnen, [rekenen]],
  [opstellen, [lijnen]],
  [snijpunten, [vergelijkingen, lijnen]],
  [kwadratisch, [rekenen]],
  [topSnijpunten, [kwadratisch, kwVergelijkingen]],
  [verschuiven, [topSnijpunten]],
  [ongelijkheden, [vergelijkingen, snijpunten]],
  [tweeVariabelen, [lijnen]],
  [kwVergelijkingen, [ontbinden, vergelijkingen]],
  [haakjes, [kwadratisch]],
  [gelijkvormig, [verhoudingen, pythagoras]],
  [aantonen, [gelijkvormig]],
  [lengtes, [pythagoras, gelijkvormig]],
  [terugrekenen, [procenten]],
  [tabellen, [procenten, terugrekenen]],
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

// Of alles van een onderwerp er is, zoals de generatoren en de uitleg. In Node altijd. In de
// browser heeft een onderwerp dat nog niet geladen is een functie laad (zie scripts/catalogus.js).
const geladen = (t) => !t.laad;
// Vult een onderwerp uit de catalogus aan met wat er na het laden bij komt.
function aanvullen(t, { default: full }) {
  t.skills.forEach((k, i) => {
    const [id, , gen] = full.skills[i] || [];
    if (id !== k.id) throw new Error(`${t.slug}: de catalogus past niet bij het onderwerp.`);
    k.gen = gen;
  });
  for (const [key, value] of Object.entries(full)) if (!(key in t)) t[key] = value;
  delete t.laad;
}
// Laadt de onderwerpen die nog niet geladen zijn, allemaal tegelijk. Een mislukte download mag je
// opnieuw proberen.
const loading = new Map();
function laadOnderwerpen(topics) {
  return Promise.all(
    topics
      .filter((t) => !geladen(t))
      .map((t) => {
        if (!loading.has(t)) {
          const load = t.laad().then((m) => {
            if (!geladen(t)) aanvullen(t, m);
          });
          loading.set(t, load);
          load.catch(() => {}).then(() => loading.delete(t));
        }
        return loading.get(t);
      }),
  );
}

// Maakt een vraag van een vraagsoort met een seed, en bewaart die seed in de vraag. Zo is elke
// vraag precies te herhalen, bijvoorbeeld bij een foutmelding.
// Een vraag met afronden krijgt na zijn eigen valkuilen ook die voor afronden.
function makeQuestion(skill, seed = newSeed()) {
  if (!skill.gen) throw new Error(`Vraagsoort ${skill.id} is nog niet geladen.`);
  const q = withSeed(seed, skill.gen);
  const traps = [...(q.traps ?? []), ...roundTraps(q.fields)];
  return { ...q, ...(traps.length ? { traps } : {}), seed };
}

export { DOMAINS, DOMAIN, TOPICS, TOPIC, makeQuestion, geladen, laadOnderwerpen };
