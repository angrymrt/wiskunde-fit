// Welke onderwerpen een scherm nodig heeft, en wat het scherm toont zolang die laden of als dat niet
// lukt. In de browser laden de generatoren en de uitleg van een onderwerp pas als die nodig zijn
// (zie laadOnderwerpen in topics/index.js). render() in main.js laadt eerst, en tekent daarna.
import { titleFor } from '../routes.js';
import { chosenTopics } from '../stof.js';
import { TOPIC, geladen } from '../topics/index.js';
import { esc } from '../typeset.js';
import { crumbs, pageHead } from './layout.js';
import { state } from './state.js';

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

// Zoals een schil: het kruimelpad en de kop staan er al, met daaronder dat het laadt, of een
// melding met een knop om het opnieuw te proberen.
function vLaden() {
  const heading = esc(titleFor(state.view).replace(/ \| Wiskundefit$/, ''));
  const body =
    state.laden === 'fout'
      ? `<p class="fb bad" id="laadfout" tabindex="-1">Dit deel van de site kon niet worden geladen. Misschien is je internet even weg. Controleer je verbinding en probeer het opnieuw.</p><div class="row"><button class="btn main" type="button" data-act="opnieuw">Probeer opnieuw</button></div>`
      : `<p class="muted" role="status">Even laden…</p>`;
  return `${crumbs()}<div class="sheet">${pageHead(heading)}${body}</div>`;
}

export { nodig, nogTeLaden, vLaden };
