// Onderdelen die op elk scherm terugkomen.
import { to } from '../routes.js';
import { state } from './state.js';

const topbar = () =>
  `<header class="top"><a class="brand" href="${to('home')}">Wiskunde<span class="brand-fit">fit</span></a><nav class="topnav" aria-label="Hoofdmenu"><a class="btn quiet" href="${to('home')}">Overzicht</a><a class="btn quiet" href="${to('stof')}">Jouw stof</a><a class="btn quiet" href="${to('toets')}">Proeftoets</a></nav></header>`;
const footer = () =>
  `<footer class="foot"><a class="linkbtn" href="${to('over')}">Over Wiskundefit, privacy en contact</a></footer>`;
// Een proeftoets loopt door als je ergens anders heen gaat, dus zeg waar je hem terugvindt.
const testNotice = () =>
  state.test && state.view.name !== 'toets'
    ? `<p class="notice small"><a href="${to('toets')}">Je proeftoets loopt nog. Ga verder met vraag ${state.test.i + 1}.</a></p>`
    : '';
const vMissing = () =>
  `<div class="sheet"><h1 style="font-size:clamp(1.7rem,5vw,2.4rem)">Deze pagina bestaat niet</h1><p>Misschien is de link verkeerd overgenomen of staat de pagina ergens anders.</p><div class="row"><a class="btn main" href="${to('home')}">Naar het overzicht</a></div></div>`;

export { topbar, footer, testNotice, vMissing };
