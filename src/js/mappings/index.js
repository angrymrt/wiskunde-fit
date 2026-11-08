// Alle methode-indelingen. Een nieuwe methode-indeling voeg je hier toe.
import hv1 from './gr13-hv1.js';
import hv2 from './gr13-hv2.js';
import havo3 from './gr13-havo3.js';

const MAPPINGS = [hv1, hv2, havo3];
const MAPPING = Object.fromEntries(MAPPINGS.map((m) => [m.id, m]));

// Dekking: zonder vraagsoorten niet gedekt, en anders gedekt tenzij de paragraaf 'deels' zegt.
for (const mapping of MAPPINGS) {
  for (const chapter of mapping.chapters) {
    chapter.paragraphs = chapter.paragraphs.map(([number, description, skills = [], coverage]) => ({
      number,
      description,
      skills,
      coverage: coverage || (skills.length ? 'gedekt' : 'niet'),
    }));
  }
}

// De filters op Kies uit je boek, met de naam in het adres (?niveau=havo). Een filter geeft per
// methode-indeling een of meer waarden: een boek voor havo/vwo hoort bij havo en bij vwo.
const LEVELS = ['havo', 'vwo', 'vmbo'];
const level = (part) => (part.startsWith('vmbo') ? 'vmbo' : part);
const slugOf = (text) =>
  text
    .toLowerCase()
    .replace(/&/g, 'en')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const methodName = (slug) => MAPPINGS.find((m) => slugOf(m.method) === slug).method;
const byNumber = (a, b) => a - b;
const FILTERS = [
  {
    key: 'niveau',
    label: 'Niveau',
    values: (m) => m.level.split('/').map(level),
    name: (v) => v,
    order: (a, b) => LEVELS.indexOf(a) - LEVELS.indexOf(b),
  },
  {
    key: 'leerjaar',
    label: 'Leerjaar',
    values: (m) => [String(m.year)],
    name: (v) => v,
    order: byNumber,
  },
  {
    key: 'methode',
    label: 'Methode',
    values: (m) => [slugOf(m.method)],
    name: methodName,
    order: (a, b) => methodName(a).localeCompare(methodName(b)),
  },
  {
    key: 'editie',
    label: 'Editie',
    values: (m) => [String(m.edition)],
    name: (v) => `${v}e editie`,
    order: byNumber,
  },
];
// De keuzes van een filter: alleen wat bij een methode-indeling voorkomt.
for (const filter of FILTERS) {
  filter.options = [...new Set(MAPPINGS.flatMap(filter.values))].sort(filter.order);
}
// Past een methode-indeling bij de gekozen filters? Binnen een filter is één keuze genoeg, en een
// boek moet bij elk filter passen. Een filter zonder keuze telt niet.
const matches = (m, chosen = {}, skip = null) =>
  FILTERS.every(
    ({ key, values }) =>
      key === skip || !chosen[key]?.length || values(m).some((v) => chosen[key].includes(v)),
  );

export { FILTERS, MAPPINGS, MAPPING, matches };
