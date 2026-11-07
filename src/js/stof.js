// De stofkeuze: altijd een lijst id's van vraagsoorten, of een leerling nu op paragraaf, hoofdstuk
// of onderwerp kiest. Oefenen en de proeftoets gebruiken dezelfde lijst.
import { MAPPING } from './mappings/index.js';
import { prog, save } from './progress.js';
import { TOPICS } from './topics/index.js';

const TOPIC_OF = new Map(TOPICS.flatMap((t) => t.skills.map((k) => [k.id, t])));
const ALL_IDS = [...TOPIC_OF.keys()];

const isChosen = (id) => (prog.stof || []).includes(id);
const allChosen = (ids) => ids.length > 0 && ids.every(isChosen);
const topicOf = (id) => TOPIC_OF.get(id);

function setStof(ids) {
  prog.stof = ids.length ? [...new Set(ids)].sort((a, b) => a - b) : null;
  save();
}
// Kiest deze vraagsoorten, of haalt ze weg als ze allemaal al gekozen zijn.
function toggleStof(ids) {
  const rest = (prog.stof || []).filter((id) => !ids.includes(id));
  setStof(allChosen(ids) ? rest : [...rest, ...ids]);
}
// De gekozen vraagsoorten per onderwerp, in de volgorde van de site.
function chosenTopics(ids = prog.stof || []) {
  return TOPICS.map((topic) => ({
    topic,
    skills: topic.skills.filter((k) => ids.includes(k.id)),
  })).filter((g) => g.skills.length);
}
// Doet zich voor als onderwerp, zodat oefenen op de stofkeuze hetzelfde werkt als op een onderwerp.
const stofTopic = () => ({
  slug: 'jouw-stof',
  title: 'Jouw stof',
  mixed: true,
  skills: chosenTopics().flatMap((g) => g.skills),
});
// Paragrafen uit de hoofdstukken waarin de leerling iets koos, die we niet of niet helemaal dekken.
function stofGaps() {
  const mapping = MAPPING[prog.mapping];
  if (!mapping) return [];
  return mapping.chapters
    .filter((c) => c.paragraphs.some((p) => p.skills.some(isChosen)))
    .flatMap((c) => c.paragraphs.filter((p) => p.coverage !== 'gedekt'));
}

export {
  ALL_IDS,
  allChosen,
  chosenTopics,
  isChosen,
  setStof,
  stofGaps,
  stofTopic,
  toggleStof,
  topicOf,
};
