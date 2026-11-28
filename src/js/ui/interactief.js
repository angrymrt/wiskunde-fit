// De figuren waar de leerling zelf iets mee doet: de schuifjes en de hoekendemo in de uitleg
// (widgets.js) en het tekenen in een rooster (draw.js). Ze hebben figures.js nodig, en dat is groot.
// Daarom staan ze samen in een eigen bestand, dat de browser pas laadt met een onderwerp (#206). Zie
// BIJ_ONDERWERP in scripts/later-schermen.js en wachtOpScherm in laden.js. In Node is het gewoon
// geladen.
import { showDrawn, tapGrid } from './draw.js';
import { mountWidgets, widgetHTML } from './widgets.js';

const klaar = () => true;
const laad = () => Promise.resolve();

export { klaar, laad, mountWidgets, showDrawn, tapGrid, widgetHTML };
