// De pagina's uit de voettekst: over de site, privacy en contact.
import { to } from '../routes.js';
import { pageHead, REPO } from './layout.js';

const MAIL = 'wiskundefit@rubenvanderhoop.nl';

const mail = `<a class="mail" href="mailto:${MAIL}">${MAIL}</a>`;
const repo = (text, path = '') =>
  `<a href="${REPO}${path}" target="_blank" rel="noopener">${text}</a>`;

function vOver() {
  return `${pageHead('Over Wiskundefit')}<div class="sheet">
  <div class="block"><p>Wiskundefit is een eigen project van David van der Hoop. Je oefent hier gratis, zonder account en zonder reclame. Er is geen band met Noordhoff, Getal &amp; Ruimte of een andere uitgever.</p></div>
  <div class="block"><h2 class="h3">Hoe de stof is gemaakt</h2>
  <p>De uitleg, de vragen en de code zijn gemaakt met hulp van AI (Claude van Anthropic). We schrijven eigen teksten en voorbeelden en nemen niets over uit boeken.</p>
  <p>De computer maakt van elke soort vraag honderden varianten en rekent het antwoord op een tweede manier na. Zo vinden we rekenfouten, maar geen onduidelijke uitleg of een verkeerde aanpak.</p>
  <p>We maken het middelbare scholieren makkelijk om de juiste stof te vinden, door te verwijzen naar de hoofdstukken in bekende Nederlandse schoolboeken. Voorlopig is dat Getal &amp; Ruimte.</p>
  <p>De werkwijze is met het boek vergeleken, maar de stof is nog niet helemaal door een wiskundedocent nagekeken. Er kan dus iets niet kloppen. Zie je een fout? <a href="${to('contact')}">Laat het ons weten</a>, dan herstellen we die zo snel mogelijk.</p></div>
  <div class="block"><h2 class="h3">Open en eerlijk</h2>
  <p>De code, de bekende fouten en de plannen staan op ${repo('GitHub')}. Wat er in elke versie is veranderd, staat bij de ${repo('versies', '/releases')}, ook welke fouten we hebben hersteld.</p></div></div>`;
}

function vPrivacy() {
  return `${pageHead('Privacy')}<div class="sheet">
  <div class="block"><h2 class="h3">Wat we niet doen</h2>
  <p>Je hebt geen account nodig en je hoeft niets over jezelf te vertellen. We gebruiken geen cookies, reclame of volgscripts van anderen. We tellen geen bezoekers en niet welke pagina's je bekijkt. We weten dus niet wie de site gebruikt.</p></div>
  <div class="block"><h2 class="h3">Wat we anoniem tellen</h2>
  <p>We willen weten welke vragen moeilijk zijn, zodat we de vragen, hints en uitleg beter kunnen maken. Daarom stuurt de site na je eerste poging bij een vraag een tel naar ons. Daarin staat alleen welke soort vraag het was, of je antwoord goed of fout was of dat je meteen de uitwerking bekeek, hoeveel seconden je erover deed en of je eerst de hint vroeg.</p>
  <p>Veel vragen herkennen een veelgemaakte fout, zoals de wortel vergeten bij Pythagoras. Maak je zo'n fout, dan tellen we welke het was. Lever je een proeftoets in, dan tellen we per vraag of die goed, fout of leeg was.</p>
  <p>In een tel staat geen naam, geen nummer dat bij jou hoort, niets over je apparaat en niets wat je hebt ingetypt. Elke tel staat los. We kunnen tellen dus niet aan elkaar of aan jou koppelen.</p>
  <p>De tellen komen in een tabel bij Microsoft Azure in West-Europa. Azure zet bij elke tel zelf het tijdstip. Binnen ongeveer een week tellen we ze op per dag en verwijderen we de losse tellen. Die optelling is openbaar, ${repo('op GitHub')}, zodat iedereen kan zien wat we bewaren.</p>
  <p>Zo'n tel mag zonder dat we het je eerst vragen, omdat die alleen dient om de kwaliteit van de site te meten en bijna geen gevolgen heeft voor je privacy (artikel 11.7a, lid 3 van de Telecommunicatiewet). Zo lezen wij die regel.</p></div>
  <div class="block"><h2 class="h3">Je voortgang</h2>
  <p>Je voortgang staat alleen in de opslag van deze browser (localStorage): welke soorten vragen je goed of fout had, welke stof en welk boek je koos, en je laatste proeftoets met je antwoorden, ook als je die nog niet hebt ingeleverd. Die gegevens komen niet bij ons terecht.</p>
  <p>Je wist je voortgang met de knop <b>Voortgang wissen</b> op <a href="${to('stof')}">Mijn stof</a>, of door de sitegegevens in je browser te wissen.</p>
  <p>Kies je met de knop bovenaan een licht of donker scherm dat anders is dan op je apparaat, dan onthoudt deze browser dat ook. Kies je weer hetzelfde als je apparaat, dan wordt die keuze gewist.</p></div>
  <div class="block"><h2 class="h3">Waar de site staat</h2>
  <p>De site staat bij Microsoft Azure. Zoals bij elke website krijgt die server je IP-adres, anders kan hij de pagina niet naar je sturen. Dat geldt ook als de site een tel stuurt. Microsoft kan zulke technische gegevens gebruiken om de dienst te laten werken en te beveiligen. Wij hebben geen logboeken aangezet, bewaren je IP-adres niet en krijgen het dus niet te zien.</p></div>
  <div class="block"><h2 class="h3">Video's</h2>
  <p>De video's zijn van andere makers en staan niet op onze site. Klik je op een video, dan ga je naar YouTube. Daar gelden de regels van YouTube.</p></div>
  <div class="block"><h2 class="h3">Als je ons mailt</h2>
  <p>Dan zien we je e-mailadres en je bericht. We gebruiken die alleen om je te antwoorden. Wil je dat we je bericht verwijderen, mail dan naar ${mail}.</p></div>
  <div class="block"><h2 class="h3">Als dit verandert</h2>
  <p>Gaan we iets anders tellen of bewaren, dan passen we deze tekst eerst aan.</p>
  <p class="small muted">Bijgewerkt op 9 november 2026.</p></div></div>`;
}

function vContact() {
  return `${pageHead('Contact')}<div class="sheet">
  <div class="block"><h2 class="h3">Een vraag of idee</h2>
  <p>Heb je een vraag, een idee of iets wat beter kan? Mail naar ${mail}. Iedereen mag mailen, of je nu leerling, ouder of docent bent.</p></div>
  <div class="block"><h2 class="h3">Een fout gevonden</h2>
  <p>Zie je een fout in een vraag, een uitwerking of de uitleg? ${repo('Maak een issue aan op GitHub', '/issues/new')}, zodat iedereen kan zien dat we ermee bezig zijn. Zo'n issue is openbaar, met je accountnaam erbij, dus zet er geen namen of andere gegevens van leerlingen in. Heb je geen GitHub-account, mail de fout dan gerust.</p></div>
  <div class="block"><h2 class="h3">Help ons de site te testen</h2>
  <p>Zie je slecht of niet, en gebruik je een schermlezer, vergroting of hoog contrast? Dan zoeken we jou. We willen weten of je met jouw hulpmiddelen goed kunt oefenen, en waar je vastloopt. Je hoeft niets van websites te weten. Mail naar ${mail} als je wilt helpen.</p>
  <p>We hebben de site ook nog niet op een echte iPhone getest, alleen met de motor van Safari op een computer. Werkt er op jouw iPhone iets niet goed? Laat het ons dan weten.</p></div>
  <div class="block"><h2 class="h3">Wat we met je bericht doen</h2>
  <p>We gebruiken je e-mailadres alleen om je te antwoorden. Lees meer over <a href="${to('privacy')}">privacy</a>.</p></div></div>`;
}

export { vOver, vPrivacy, vContact };
