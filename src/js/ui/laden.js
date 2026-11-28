// Welke onderwerpen een scherm nodig heeft, en wat het scherm toont zolang die laden of als dat niet
// lukt. In de browser laden de generatoren en de uitleg van een onderwerp pas als die nodig zijn
// (zie laadOnderwerpen in topics/index.js). render() in main.js laadt eerst, en tekent daarna.
import { nameOf, titleFor } from '../routes.js';
import { chosenTopics } from '../stof.js';
import { TOPIC, geladen } from '../topics/index.js';
import { esc } from '../typeset.js';
import { klaar as aboutKlaar, laad as laadAbout } from './about.js';
import { klaar as cijfersKlaar, laad as laadCijfers } from './cijfers.js';
import { klaar as examKlaar, laad as laadExam } from './exam.js';
import { klaar as interactiefKlaar, laad as laadInteractief } from './interactief.js';
import { crumbs, pageHead } from './layout.js';
import { state } from './state.js';
import { klaar as topicKlaar, laad as laadTopic } from './topic.js';
import { klaar as vragenKlaar, laad as laadVragen } from './vragen.js';

// De uitleg en het oefenen hebben het onderwerp nodig. Mijn stof oefenen en de proeftoets hebben
// alle onderwerpen van de stofkeuze nodig, en een lopende proeftoets die van zijn vragen.
function nodig(v = state.view) {
  if (v.name === 'topic') return [TOPIC[v.slug]];
  if (v.name === 'stofoefen') return chosenTopics().map((g) => g.topic);
  if (v.name === 'toets') {
    return state.test
      ? [...new Set(state.test.items.map((x) => x.topic))]
      : chosenTopics().map((g) => g.topic);
  }
  return [];
}
const nogTeLaden = () => nodig().filter((t) => !geladen(t));

// Schermen die in de browser pas laden als ze nodig zijn (scripts/later-schermen.js, #188). In Node
// zijn ze altijd klaar.
// Met `vooraf` is de vooraf gebouwde pagina al helemaal te lezen en blijft die staan tot het scherm
// er is. Een schil, zoals bij de proeftoets, zegt in de tussentijd dat het laadt.
const examen = { klaar: examKlaar, laad: laadExam };
const about = { klaar: aboutKlaar, laad: laadAbout, vooraf: true };
const LATER = {
  vragen: { klaar: vragenKlaar, laad: laadVragen, vooraf: true },
  cijfers: { klaar: cijfersKlaar, laad: laadCijfers, vooraf: true },
  over: about,
  privacy: about,
  contact: about,
  toets: examen,
  toetsres: examen,
};
const schermVooraf = (v = state.view) => LATER[v.name]?.vooraf === true;
// Een scherm met een onderwerp heeft ook de bestanden uit BIJ_ONDERWERP in scripts/later-schermen.js
// nodig: interactief.js, met de schuifjes in de uitleg en het tekenen in een rooster, en topic.js, met
// de uitleg, het oefenen en de invoervelden van een vraag. Die laden tegelijk met het onderwerp (#206).
// Mijn stof oefenen gebruikt altijd het oefenen uit topic.js, ook als er geen onderwerp te laden is.
// In dezelfde volgorde als daar; tests/later-schermen.test.js kijkt dat na.
const BIJ_ONDERWERP = [
  { klaar: interactiefKlaar, laad: laadInteractief },
  { klaar: topicKlaar, laad: laadTopic },
];
const metOnderwerp = (v) => v.name === 'stofoefen' || nodig(v).length > 0;
const schermLaadt = (v) => !!LATER[v.name] && !LATER[v.name].klaar();
const bijOnderwerp = (v) => (metOnderwerp(v) ? BIJ_ONDERWERP.filter((b) => !b.klaar()) : []);
const wachtOpScherm = (v = state.view) => schermLaadt(v) || bijOnderwerp(v).length > 0;
const laadScherm = (v = state.view) =>
  Promise.all([
    schermLaadt(v) ? LATER[v.name].laad() : null,
    ...bijOnderwerp(v).map((b) => b.laad()),
  ]);

// Zoals een schil: het kruimelpad en de kop staan er al, met daaronder dat het laadt, of een
// melding met een knop om het opnieuw te proberen. Een schermlezer hoort "Even laden…" uit
// #laadmelding, dat main.js maakt en vult. De foutmelding krijgt de focus.
function vLaden() {
  // De kop is de naam, zonder wat de titel erbij zegt voor zoekmachines.
  const v = state.view;
  const naam =
    v.name === 'topic' || v.name === 'domain'
      ? `${nameOf(v)}${v.oefen ? ' oefenen' : ''}`
      : titleFor(v).replace(/ \| Wiskundefit$/, '');
  const heading = esc(naam);
  const body =
    state.laden === 'fout'
      ? `<p class="fb bad" id="laadfout" tabindex="-1">Dit deel van de site kon niet worden geladen. Misschien is je internet even weg. Controleer je verbinding en probeer het opnieuw.</p><div class="row"><button class="btn main" type="button" data-act="opnieuw">Probeer opnieuw</button></div>`
      : `<p class="muted" aria-hidden="true">Even laden…</p>`;
  return `${crumbs()}<div class="sheet">${pageHead(heading)}${body}</div>`;
}

export {
  nodig,
  nogTeLaden,
  vLaden,
  wachtOpScherm,
  laadScherm,
  schermVooraf,
  LATER,
  BIJ_ONDERWERP as BIJ_ONDERWERP_LADEN,
};
