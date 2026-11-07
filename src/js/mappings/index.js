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

export { MAPPINGS, MAPPING };
