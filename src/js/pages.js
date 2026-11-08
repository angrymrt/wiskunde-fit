// Alle pagina's die de build vooraf maakt, met hun titel en beschrijving, en de doorverwijzingen
// van oude adressen. Bevat geen DOM-code: de build, de sitemap en de tests gebruiken dezelfde lijst.
//
// Een vooraf gebouwde pagina bevat al alle tekst. Een schil bevat alleen het menu, de kop en de
// voettekst, want de inhoud hangt af van wat er in de browser staat. Zoekmachines nemen een schil
// niet op.
import { MAPPINGS } from './mappings/index.js';
import { pathFor, titleFor } from './routes.js';
import { DOMAINS, TOPICS } from './topics/index.js';

const SITE = 'https://wiskundefit.nl';

const mappingName = (m) => `${m.method}, ${m.edition}e editie, ${m.level} ${m.year}`;
function mappingDescription(m) {
  const paragraphs = m.chapters.flatMap((c) => c.paragraphs);
  const covered = paragraphs.filter((p) => p.coverage !== 'niet').length;
  return `${mappingName(m)}: zie per paragraaf wat je hier gratis kunt oefenen. Nu bij ${covered} van de ${paragraphs.length} paragrafen.`;
}

// De beschrijving voor zoekmachines en linkvoorbeelden: hoogstens ongeveer 155 tekens, want Google
// kapt de rest af. Een onderwerp en een domein hebben er een in de gegevens (description).
const DESCRIPTIONS = {
  home: 'Gratis wiskunde oefenen voor je toets in havo 3: uitleg, hints en steeds nieuwe vragen over formules, vergelijkingen en meetkunde. Zonder account.',
  kies: 'Kies je wiskundeboek, zoals Getal & Ruimte, en zie per paragraaf wat je gratis kunt oefenen, met uitleg, hints en steeds nieuwe vragen.',
  over: 'Wiskundefit is een gratis oefensite voor wiskunde, zonder band met een uitgever. Lees wie de site maakt en hoe we de uitleg en vragen maken.',
  privacy:
    'Wiskundefit werkt zonder account, cookies of reclame. Je voortgang blijft alleen in je eigen browser. Lees hier wat de site bewaart.',
  contact:
    'Een vraag, een idee of een fout in de stof gevonden? Mail Wiskundefit of meld het op GitHub. Testers met een schermlezer zijn ook welkom.',
  stof: 'Je gekozen stof, je voortgang en je laatste resultaat.',
  stofoefen: 'Oefen de stof die je zelf hebt gekozen.',
  toets: 'Maak een proeftoets over je eigen stof, met een cijfer en uitwerkingen.',
  toetsres: 'Het resultaat van je laatste proeftoets.',
  missing: 'Deze pagina bestaat niet.',
};

const page = (view, description, shell = false) => {
  const path = view.name === 'missing' ? null : pathFor(view);
  return {
    view,
    path,
    // Het bestand in dist/. Azure toont bij /over het bestand over/index.html.
    file: path === null ? '404.html' : `${path.slice(1)}${path === '/' ? '' : '/'}index.html`,
    title: titleFor(view),
    description,
    shell,
    // Alleen vooraf gebouwde pagina's komen in de sitemap en in zoekmachines.
    index: !shell && path !== null,
  };
};

const PAGES = [
  page({ name: 'home' }, DESCRIPTIONS.home),
  ...DOMAINS.map((d) => page({ name: 'domain', slug: d.slug }, d.description)),
  ...TOPICS.map((t) => page({ name: 'topic', slug: t.slug }, t.description)),
  page({ name: 'kies' }, DESCRIPTIONS.kies),
  ...MAPPINGS.map((m) => page({ name: 'mapping', id: m.id }, mappingDescription(m))),
  ...['over', 'privacy', 'contact'].map((name) => page({ name }, DESCRIPTIONS[name])),
  ...TOPICS.map((t) =>
    page(
      { name: 'topic', slug: t.slug, oefen: true },
      `Oefen ${t.title} met steeds nieuwe vragen, hints en uitwerkingen.`,
      true,
    ),
  ),
  page({ name: 'stof' }, DESCRIPTIONS.stof, true),
  page({ name: 'stofoefen', slug: 'mijn-stof' }, DESCRIPTIONS.stofoefen, true),
  page({ name: 'toets' }, DESCRIPTIONS.toets, true),
  page({ name: 'toetsres' }, DESCRIPTIONS.toetsres, true),
  page({ name: 'missing', path: '/' }, DESCRIPTIONS.missing),
];

// Krijgt iets een nieuw adres, dan blijft het oude adres in de gegevens staan, in oldSlugs. De build
// maakt daar een doorverwijzing van, zodat links van docenten en zoekresultaten blijven werken.
// Een wildcard neemt het deel na het adres niet mee, dus oefenen krijgt een eigen regel.
function redirects({ topics = TOPICS, domains = DOMAINS, mappings = MAPPINGS } = {}) {
  const out = [];
  for (const t of topics) {
    for (const old of t.oldSlugs || []) {
      out.push([`/${old}`, `/${t.slug}`], [`/${old}/oefenen`, `/${t.slug}/oefenen`]);
    }
  }
  for (const d of domains) {
    for (const old of d.oldSlugs || []) out.push([`/${old}`, `/${d.slug}`]);
  }
  for (const m of mappings) {
    for (const old of m.oldSlugs || []) {
      out.push([`/methode-indeling/${old}`, `/methode-indeling/${m.slug}`]);
    }
  }
  return out;
}

export { SITE, PAGES, redirects };
