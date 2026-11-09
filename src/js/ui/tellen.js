// Anonieme tellen: welke vraagsoorten leerlingen oefenen, wat goed en fout gaat, hoe lang een eerste
// poging duurt en welke valkuilen het vaakst voorkomen. Zonder id, cookie of iets wat op het
// apparaat blijft. Elke tel gaat meteen weg, zodat er niets verloren gaat als je de pagina sluit.
// Zie #19 en de pagina Privacy. De DOM staat alleen in functies, want de build importeert ui/.
// Welke tabel de tellen krijgt, kiest de functie /api/tel: alleen die van wiskundefit.nl telt mee.
import { MAX_DUUR, telAdres } from '../tel.js';
import { state } from './state.js';

// Wat de site zou sturen, ook waar niets wordt gestuurd. Alleen voor tests/browser.e2e.js.
const sent = [];

// Met fetch en keepalive, zodat de tel ook aankomt als je de pagina meteen sluit. Niet met
// sendBeacon: uBlock Origin blokkeert dat standaard met "Hyperlink-auditing uitschakelen", ook als
// er niets over de leerling in staat. Zonder cookies, en het antwoord lezen we niet.
function stuur(tellen) {
  sent.push(...tellen);
  sent.splice(0, sent.length - 100);
  // Een geautomatiseerde browser, zoals een bot of de browsertest, stuurt niets.
  if (navigator.webdriver || !window.fetch) return;
  try {
    fetch(telAdres(location.hostname), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(tellen),
      mode: 'no-cors',
      credentials: 'omit',
      keepalive: true,
    }).catch(() => {});
  } catch (e) {}
}

// Het oefenen dat nu op het scherm staat.
function onScreen() {
  const v = state.view;
  if (v.name === 'stofoefen') return state.prac['mijn-stof'];
  return v.oefen ? state.prac[v.slug] : undefined;
}
// De klok van een vraag loopt tot de eerste poging, en alleen zolang de vraag zichtbaar is. Roep
// dit aan na elke render() en als de pagina in of uit beeld gaat.
function runClock() {
  const now = Date.now(),
    here = onScreen();
  for (const st of Object.values(state.prac)) {
    const run = st === here && st.first && !document.hidden;
    if (st.since && !run) {
      st.spent += now - st.since;
      st.since = null;
    } else if (!st.since && run) st.since = now;
  }
}
const seconds = (st) =>
  Math.min(MAX_DUUR, Math.round((st.spent + (st.since ? Date.now() - st.since : 0)) / 1000));

// De eerste poging bij een vraag: goed, fout of meteen de uitwerking bekeken. Of de hint ervoor
// is gevraagd, gaat mee.
function telPoging(st, uitkomst) {
  stuur([
    { tel: 'poging', soort: st.skill.id, uitkomst, duur: seconds(st), hint: Boolean(st.hint) },
  ]);
}
// Een fout antwoord dat in een valkuil valt. Elke valkuil telt één keer per vraag.
function telValkuil(st, trap) {
  if (!trap?.id || st.valkuilen.includes(trap.id)) return;
  st.valkuilen.push(trap.id);
  stuur([{ tel: 'valkuil', soort: st.skill.id, valkuil: trap.id }]);
}
// Elke vraag van een ingeleverde proeftoets, in één bericht.
function telToets(items) {
  const filled = (x) =>
    x.vals.length && (x.q.mc ? x.vals[0] !== '' : x.vals.some((v) => String(v).trim()));
  stuur(
    items.map((x) => ({
      tel: 'toetsvraag',
      soort: x.skill.id,
      uitkomst: x.c.ok ? 'goed' : filled(x) ? 'fout' : 'leeg',
    })),
  );
}

export { runClock, telPoging, telValkuil, telToets, sent };
