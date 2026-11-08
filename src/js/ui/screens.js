// Het hele scherm bij state.view: het menu, de inhoud en de voettekst. Bevat geen DOM-code, zodat
// de build hiermee ook de pagina's vooraf kan maken.
import { MAPPING } from '../mappings/index.js';
import { DOMAIN, TOPIC } from '../topics/index.js';
import { vContact, vOver, vPrivacy } from './about.js';
import { vToetsRes, vToetsRun, vToetsSetup } from './exam.js';
import { vDomain, vHome } from './home.js';
import { esc } from '../typeset.js';
import { footer, pageHead, testNotice, topbar, vMissing } from './layout.js';
import { state } from './state.js';
import { vMapping, vPick, vStof, vStofPractice } from './stof.js';
import { vTopic } from './topic.js';

function content(v) {
  if (v.name === 'home') return vHome();
  if (v.name === 'domain') return vDomain(DOMAIN[v.slug]);
  if (v.name === 'topic') return vTopic(TOPIC[v.slug]);
  if (v.name === 'toets') return state.test ? vToetsRun() : vToetsSetup();
  if (v.name === 'toetsres') return vToetsRes();
  if (v.name === 'missing') return vMissing();
  if (v.name === 'over') return vOver();
  if (v.name === 'privacy') return vPrivacy();
  if (v.name === 'contact') return vContact();
  if (v.name === 'kies') return vPick();
  if (v.name === 'mapping') return vMapping(MAPPING[v.id]);
  if (v.name === 'stof') return vStof();
  if (v.name === 'stofoefen') return vStofPractice();
  return '';
}
const screenHTML = () =>
  `${topbar()}<main class="screen" id="inhoud">${testNotice()}${content(state.view)}</main>${footer()}`;
// Een schil voor een scherm dat afhangt van wat er in de browser staat, zoals oefenen of Mijn stof:
// alleen het menu, het kruimelpad, de kop en de voettekst. main.js vult de rest.
const shellHTML = (heading) =>
  `${topbar()}<main class="screen" id="inhoud">${pageHead(esc(heading))}<noscript><div class="sheet"><p>Oefenen, Mijn stof en de proeftoets werken alleen met JavaScript. Zet JavaScript aan in je browser. De uitleg bij een onderwerp kun je ook zonder lezen.</p><div class="row"><a class="btn" href="/">Naar het overzicht</a></div></div></noscript></main>${footer()}`;

export { screenHTML, shellHTML };
