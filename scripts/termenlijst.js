// Zet de lijst met woorden in de vooraf gebouwde uitleg van een onderwerp, zie woorden.js. De lijst
// komt op de plek van de markering <!--termen--> in vTopic (ui/topic.js). De markering blijft staan,
// zodat de vooraf gebouwde pagina gelijk is aan wat de browser maakt.
import { termenIn, termenLijstHTML } from '../src/js/woorden.js';

export const MARKERING = '<!--termen-->';
const BEGIN = '<div class="topic-body">';

export function metTermenLijst(html) {
  const begin = html.indexOf(BEGIN);
  if (begin < 0) return html; // geen uitleg van een onderwerp
  const plek = html.indexOf(MARKERING, begin);
  if (plek < 0) throw new Error(`De uitleg heeft geen markering ${MARKERING}: zie vTopic.`);
  // Alleen de termen in de uitleg zelf, zoals de lijst in de browser (ui/termpopup.js).
  const lijst = termenLijstHTML(termenIn(html.slice(begin, plek)));
  return html.slice(0, plek) + lijst + html.slice(plek);
}
