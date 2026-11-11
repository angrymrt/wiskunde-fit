// Onderdelen die op elk scherm terugkomen.
import { crumbsFor, sectionFor, to } from '../routes.js';
import { esc } from '../typeset.js';
import { opslag } from '../progress.js';
import { state } from './state.js';

const REPO = 'https://github.com/angrymrt/wiskunde-fit';
// De build vult de versie en de datum in, zie scripts/build.js. Met npm run dev bestaan ze niet.
const VERSION = typeof __VERSIE__ === 'string' ? __VERSIE__ : null;
const DATE = typeof __DATUM__ === 'string' ? __DATUM__ : null;

// Het menu-item van het onderdeel waar je bent, krijgt aria-current: "page" op dat scherm zelf,
// "true" op een scherm eronder.
function menuItem(name, text) {
  const here = sectionFor(state.view) === name;
  const current = here ? ` aria-current="${state.view.name === name ? 'page' : 'true'}"` : '';
  return `<a href="${to(name)}"${current}>${text}</a>`;
}
// De knop wisselt tussen licht en donker, zie main.js. Hij toont wat je krijgt: een maan op een
// licht scherm, een zon op een donker scherm. Welke van de twee je ziet, regelt de CSS, zodat het
// ook klopt voordat JavaScript de pagina overneemt.
const icon = (path) =>
  `<svg class="icon" viewBox="0 0 16 16" width="20" height="20" aria-hidden="true" focusable="false"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
const MOON = icon('M13.5 10.2A5.8 5.8 0 0 1 5.8 2.5a5.8 5.8 0 1 0 7.7 7.7z');
const SUN = icon(
  'M8 5.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 1 0 0-5.6zM8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1',
);
const themeButton = () =>
  `<button class="theme" type="button" data-act="thema" aria-pressed="${state.dark}" title="Donkere modus"><span class="sr">Donkere modus</span><span class="moon">${MOON}</span><span class="sun">${SUN}</span></button>`;
const topbar = () =>
  `<a class="skip" href="#inhoud">Naar de inhoud</a><header class="top"><a class="brand" href="${to('home')}"><span class="brand-logo" aria-hidden="true"></span><span class="sr">Wiskundefit</span></a><nav class="topnav" aria-label="Hoofdmenu">${menuItem('home', 'Home')}${menuItem('stof', 'Mijn stof')}${menuItem('toets', 'Proeftoets')}</nav>${themeButton()}</header>`;
// Een huisje voor Home. Het is versiering: de tekst Home staat er altijd bij.
const HOUSE =
  '<svg class="icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="M2 7.5 8 2.5l6 5M3.8 6.3V13.5h3V10h2.4v3.5h3V6.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/></svg>';
// Het scherm zelf staat als laatste in het kruimelpad, zonder link.
function crumbs() {
  const list = crumbsFor(state.view);
  const item = (c, i) => {
    const text = `${i ? '' : HOUSE}${esc(c.text)}`;
    return `<li>${c.path ? `<a href="${c.path}">${text}</a>` : `<span aria-current="page">${text}</span>`}</li>`;
  };
  return list.length
    ? `<nav class="crumbs" aria-label="Kruimelpad"><ol>${list.map(item).join('')}</ol></nav>`
    : '';
}
// De kop van een scherm, bovenaan in het eerste blok. Alleen Home heeft een losse kop. Het
// kruimelpad staat boven het blok: zet crumbs() ervoor. Geef HTML mee voor wat onder de kop hoort,
// zoals de intro.
const pageHead = (title, rest = '') =>
  `<div class="head sheet-head"><h1>${title}</h1>${rest}</div>`;
const DATE_TEXT = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
const footer = () =>
  `<footer class="foot"><nav aria-label="Over de site"><a href="${to('over')}">Over</a><a href="${to('privacy')}">Privacy</a><a href="${to('contact')}">Contact</a><a href="${to('cijfers')}">Cijfers</a><a href="${REPO}" target="_blank" rel="noopener">GitHub</a></nav><p class="small muted">${VERSION ? `Versie ${VERSION}, bijgewerkt op ${DATE_TEXT(DATE)}.` : 'Ontwikkelversie.'} <a href="${REPO}/releases" target="_blank" rel="noopener">Wat is er nieuw?</a></p></footer>`;
// Een proeftoets loopt door als je ergens anders heen gaat, dus zeg waar je hem terugvindt.
const testNotice = () =>
  state.test && state.view.name !== 'toets'
    ? `<p class="notice small"><a href="${to('toets')}">Je proeftoets loopt nog. Ga verder met vraag ${state.test.i + 1}.</a></p>`
    : '';
// Lukt opslaan niet, dan zegt de site dat, want overal staat dat je voortgang bewaard blijft.
const storageNotice = () =>
  opslag.mislukt
    ? '<p class="notice small">Je voortgang kan in deze browser niet worden bewaard, bijvoorbeeld omdat de opslag vol is of is uitgezet. Oefenen gaat gewoon door, maar als je de pagina sluit, ben je je voortgang kwijt.</p>'
    : '';
const vMissing = () =>
  `${crumbs()}<div class="sheet">${pageHead('Deze pagina bestaat niet')}<p>Misschien is de link verkeerd overgenomen of staat de pagina ergens anders.</p><div class="row"><a class="btn main" href="${to('home')}">Naar het overzicht</a></div></div>`;

export { REPO, topbar, footer, crumbs, pageHead, testNotice, storageNotice, vMissing };
