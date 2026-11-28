// Een probleem melden bij een vraag. De leerling kiest wat er aan de hand is en kan er iets bij
// schrijven, en verstuurt dat dan zelf, via een nieuw issue op GitHub of via e-mail. De site stuurt
// niets: de knoppen zijn gewone links met alles al ingevuld. Meegestuurd wordt alleen de link naar
// de vraag (de vraagsoort en de seed), de versie van de site en wat de leerling zelf kiest of typt.
// Bevat geen DOM-code, zodat de tests de links kunnen controleren.
import { SITE } from '../routes.js';
import { esc } from '../typeset.js';
import { MAIL, REPO, VERSION } from './layout.js';

// De keuzes. De tekst komt als gewone tekst in het veld `wat` van .github/ISSUE_TEMPLATE/vraagmelding.yml.
// Dat is bewust een tekstveld: GitHub vult een keuzelijst niet in via de link.
const WAT = [
  ['antwoord-fout', 'Het antwoord dat de site goed vindt, klopt niet'],
  ['antwoord-goed', 'Mijn antwoord is goed, maar de site zegt fout'],
  ['uitleg', 'De uitleg of hint klopt niet of is onduidelijk'],
  ['anders', 'Iets anders'],
];
const MAX_TEKST = 400;

// `soort` is de vraagsoort, `path` het adres van precies deze vraag, zoals pathFor() het geeft.
function melding({ soort, path, wat, tekst }) {
  const kies = WAT.find(([id]) => id === wat);
  if (!kies) return null;
  const toelichting = String(tekst || '')
    .trim()
    .slice(0, MAX_TEKST);
  return {
    titel: `Probleem bij vraag: ${soort.name} (nr. ${soort.id})`,
    vraag: `${SITE}${path}`,
    soort: `${soort.name} (nr. ${soort.id})`,
    versie: VERSION || 'onbekend',
    wat: kies[1],
    toelichting,
  };
}
const q = (m) => encodeURIComponent(m);
function githubLink(m) {
  const velden = ['vraag', 'soort', 'versie', 'wat', 'toelichting'];
  return `${REPO}/issues/new?template=vraagmelding.yml&title=${q(m.titel)}&${velden.map((k) => `${k}=${q(m[k])}`).join('&')}`;
}
function mailLink(m) {
  const regels = [
    `Vraag: ${m.vraag}`,
    `Soort: ${m.soort}`,
    `Versie: ${m.versie}`,
    '',
    `Wat is er aan de hand: ${m.wat}`,
    '',
    `Toelichting: ${m.toelichting || '(geen)'}`,
  ];
  return `mailto:${MAIL}?subject=${q(m.titel)}&body=${q(regels.join('\r\n'))}`;
}

// Onder in het paneel: wat er nog mist, en de twee manieren om te versturen. Zolang er niets gekozen
// is, zijn het knoppen die niets doen. Daarna zijn het links met alles al ingevuld.
function meldVoetHTML(m) {
  const gh = m
    ? `<a class="btn main" id="meldgh" href="${esc(githubLink(m))}" target="_blank" rel="noopener">Via GitHub</a>`
    : '<button class="btn main" type="button" disabled>Via GitHub</button>';
  const mail = m
    ? `<a class="btn" id="meldmail" href="${esc(mailLink(m))}">Via e-mail</a>`
    : '<button class="btn" type="button" disabled>Via e-mail</button>';
  return `<p class="small melden-hulp" role="status">${m ? '' : 'Kies eerst wat er aan de hand is. Dan kun je het versturen.'}</p>
      <p class="small melden-via"><b>Melden via:</b></p>
      <div class="melden-kies">
        <div class="melden-kanaal">${gh}<p class="small muted">Je hebt een GitHub-account nodig. Je gebruikersnaam staat openbaar bij de melding.</p></div>
        <div class="melden-kanaal">${mail}<p class="small muted">Opent je mailprogramma. Alleen wij zien je mailadres.</p></div>
      </div>`;
}

export { WAT, MAX_TEKST, melding, githubLink, mailLink, meldVoetHTML };
