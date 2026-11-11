// De stofkeuze: altijd een lijst id's van vraagsoorten, of een leerling nu op paragraaf, hoofdstuk
// of onderwerp kiest. Oefenen en de proeftoets gebruiken dezelfde lijst.
import { MAPPING, MAPPINGS } from './mappings/index.js';
import { prog, update } from './progress.js';
import { pathFor, to } from './routes.js';
import { TOPICS } from './topics/index.js';

const TOPIC_OF = new Map(TOPICS.flatMap((t) => t.skills.map((k) => [k.id, t])));
const ALL_IDS = [...TOPIC_OF.keys()];

const isChosen = (id) => (prog.stof || []).includes(id);
const allChosen = (ids) => ids.length > 0 && ids.every(isChosen);
const topicOf = (id) => TOPIC_OF.get(id);

const sorted = (ids) => (ids.length ? [...new Set(ids)].sort((a, b) => a - b) : null);
function setStof(ids) {
  update((p) => (p.stof = sorted(ids)));
}
// Kiest deze vraagsoorten, of haalt ze weg als ze allemaal al gekozen zijn. Met de stofkeuze zoals
// die nu bewaard is, want een ander tabblad kan die hebben veranderd.
function toggleStof(ids) {
  update((p) => {
    const rest = (p.stof || []).filter((id) => !ids.includes(id));
    p.stof = sorted(allChosen(ids) ? rest : [...rest, ...ids]);
  });
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
  slug: 'mijn-stof',
  title: 'Mijn stof',
  mixed: true,
  skills: chosenTopics().flatMap((g) => g.skills),
});
// Wat uit het gekozen boek in de stofkeuze zit: hele hoofdstukken, of anders losse paragrafen.
// Een paragraaf telt alleen als alles wat je ervan kunt oefenen is gekozen.
function stofFromBook() {
  const mapping = MAPPING[prog.mapping];
  if (!mapping) return [];
  return mapping.chapters.flatMap((c) => {
    const covered = c.paragraphs.filter((p) => p.skills.length);
    const chosen = covered.filter((p) => allChosen(p.skills));
    if (!chosen.length) return [];
    if (chosen.length === covered.length) return [`hoofdstuk ${c.number}`];
    return chosen.map((p) => `paragraaf ${p.number}`);
  });
}
// Per methode-indeling de paragrafen waarin vraagsoorten van dit domein zitten.
function domainParagraphs(domain) {
  const ids = new Set(domain.topics.flatMap((t) => t.skills.map((k) => k.id)));
  return MAPPINGS.map((mapping) => ({
    mapping,
    paragraphs: mapping.chapters
      .flatMap((c) => c.paragraphs)
      .filter((p) => p.skills.some((id) => ids.has(id))),
  })).filter((m) => m.paragraphs.length);
}
// "Kies uit je boek" gaat naar het boek dat je het laatst koos, als dat er is.
const bookPath = () =>
  MAPPING[prog.mapping] ? pathFor({ name: 'mapping', id: prog.mapping }) : to('kies');
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
  bookPath,
  chosenTopics,
  domainParagraphs,
  isChosen,
  setStof,
  stofFromBook,
  stofGaps,
  stofTopic,
  toggleStof,
  topicOf,
};
