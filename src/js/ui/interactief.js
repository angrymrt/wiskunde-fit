// De figuren waar de leerling zelf iets mee doet: de schuifjes en de hoekendemo in de uitleg
// (widgets.js), het tekenen in een rooster (draw.js) en het veld voor een uitdrukking
// (uitdrukking-veld.js). Ze hebben figures.js nodig, en dat is groot.
// Daarom staan ze samen in een eigen bestand, dat de browser pas laadt met een onderwerp (#206). Zie
// BIJ_ONDERWERP in scripts/later-schermen.js en wachtOpScherm in laden.js. In Node is het gewoon
// geladen.
import { showDrawn, tapGrid } from './draw.js';
import { toonUitdrukking, uitdrukkingVeld } from './uitdrukking-veld.js';
import { mountWidgets, widgetHTML } from './widgets.js';

const klaar = () => true;
const laad = () => Promise.resolve();

export {
  klaar,
  laad,
  mountWidgets,
  showDrawn,
  tapGrid,
  toonUitdrukking,
  uitdrukkingVeld,
  widgetHTML,
};
