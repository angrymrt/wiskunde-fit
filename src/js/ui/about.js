// De over-pagina: wie erachter zit, hoe de stof is gemaakt, privacy en contact.
const MAIL = 'wiskundefit@rubenvanderhoop.nl';
const REPO = 'https://github.com/angrymrt/wiskunde-fit';

const mail = `<a class="mail" href="mailto:${MAIL}">${MAIL}</a>`;
const repo = (text, path = '') =>
  `<a href="${REPO}${path}" target="_blank" rel="noopener">${text}</a>`;

function vOver() {
  return `<div class="sheet"><h1 style="font-size:clamp(1.7rem,5vw,2.4rem)">Over Wiskundefit</h1>
  <div class="block"><p>Wiskundefit is een eigen project van David van der Hoop. Je oefent hier gratis, zonder account en zonder reclame. Er is geen band met Noordhoff, Getal &amp; Ruimte of een andere uitgever.</p></div>
  <div class="block"><h2 class="h3">Hoe de stof is gemaakt</h2>
  <p>De uitleg, de vragen en de code zijn gemaakt met hulp van AI (Claude van Anthropic). We schrijven eigen teksten en voorbeelden en nemen niets over uit boeken.</p>
  <p>De computer maakt van elke soort vraag honderden varianten en rekent het antwoord op een tweede manier na. Zo vinden we rekenfouten, maar geen onduidelijke uitleg of een verkeerde aanpak.</p>
  <p>We maken het middelbare scholieren makkelijk om de juiste stof te vinden, door te verwijzen naar de hoofdstukken in bekende Nederlandse schoolboeken. Voorlopig is dat Getal &amp; Ruimte.</p>
  <p>Niet alle paragrafen zijn al met het boek vergeleken. Daar staat dan een melding bij. De stof is ook nog niet helemaal door een wiskundedocent nagekeken, dus er kan iets niet kloppen. Zie je een fout? Laat het ons weten, dan herstellen we die zo snel mogelijk.</p></div>
  <div class="block"><h2 class="h3">Contact</h2>
  <p>Ben je docent, of heb je een vraag of idee? Mail naar ${mail}.</p>
  <p>Heb je een fout gevonden? ${repo('Maak dan een issue aan op GitHub', '/issues/new')}, zodat iedereen kan zien dat we ermee bezig zijn. Zo'n issue is openbaar, met je accountnaam erbij, dus zet er geen namen of andere gegevens van leerlingen in. Heb je geen GitHub-account, mail de fout dan gerust.</p>
  <p>De code, de bekende fouten en de plannen staan ook op ${repo('GitHub')}.</p></div>
  </div>
  <div class="sheet"><h2>Privacy</h2>
  <div class="block"><h3>Wat we niet doen</h3>
  <p>Je hebt geen account nodig en je hoeft niets over jezelf te vertellen. We gebruiken geen cookies, reclame of volgscripts en we meten geen bezoekers. We weten dus niet wie de site gebruikt.</p></div>
  <div class="block"><h3>Je voortgang</h3>
  <p>Je voortgang staat alleen in de opslag van deze browser (localStorage): welke soorten vragen je goed of fout had, je scores op proeftoetsen en welke stof je voor de proeftoets koos. Die gegevens komen niet bij ons terecht.</p>
  <p>Je wist je voortgang met de knop <b>Voortgang wissen</b> op het overzicht, of door de sitegegevens in je browser te wissen.</p></div>
  <div class="block"><h3>Waar de site staat</h3>
  <p>De site staat bij Microsoft Azure. Zoals bij elke website krijgt die server je IP-adres, anders kan hij de pagina niet naar je sturen. Microsoft kan zulke technische gegevens gebruiken om de dienst te laten werken en te beveiligen. Wij hebben geen logboeken of statistieken aangezet en krijgen deze gegevens dus niet te zien.</p></div>
  <div class="block"><h3>Video's</h3>
  <p>De video's zijn van andere makers en staan niet op onze site. Klik je op een video, dan ga je naar YouTube. Daar gelden de regels van YouTube.</p></div>
  <div class="block"><h3>Als je ons mailt</h3>
  <p>Dan zien we je e-mailadres en je bericht. We gebruiken die alleen om je te antwoorden. Wil je dat we je bericht verwijderen, mail dan naar ${mail}.</p></div>
  <div class="block"><h3>Als dit verandert</h3>
  <p>Misschien gaan we later anonieme totalen meten, zoals hoe vaak een paragraaf wordt bekeken. Dat zijn nooit gegevens per leerling. We passen deze tekst eerst aan voordat er iets verandert.</p>
  <p class="small muted">Bijgewerkt op 6 november 2026.</p></div></div>`;
}

export { vOver };
