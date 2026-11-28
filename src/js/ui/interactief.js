// De figuren waar de leerling zelf iets mee doet: de schuifjes en de hoekendemo in de uitleg
// (widgets.js) en het tekenen in een rooster (draw.js). Ze hebben figures.js nodig, en dat is groot.
// Daarom staan ze samen in een eigen bestand, dat de browser pas laadt met een onderwerp (#206). Zie
// BIJ_ONDERWERP in scripts/later-schermen.js en wachtOpScherm in laden.js. In Node is het gewoon
// geladen.
import { showDrawn, tapGrid } from './draw.js';
import { mountWidgets, widgetHTML } from './widgets.js';
import { UITDAGING } from './layout.js';

const klaar = () => true;
const laad = () => Promise.resolve();

// Boven een uitdaging bij het oefenen staat wat dat is, zodat niemand schrikt als het moeilijk is.
// Dat staat hier en niet in topic.js, want het oefenen wacht toch op dit bestand, en zo blijft het
// eerste bezoek klein (#309).
const uitdagingUitleg = () =>
  `<p class="small uitdaging-uitleg">${UITDAGING} Extra stof voor wie meer wil. Lukt het nog niet? Geen probleem: het telt niet mee voor je voortgang bij dit onderwerp.</p>`;

export { klaar, laad, mountWidgets, showDrawn, tapGrid, uitdagingUitleg, widgetHTML };
