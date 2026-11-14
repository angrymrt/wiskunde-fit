// De pagina Zo maken we de vragen: hoe de site vragen maakt en nakijkt, en hoeveel verschillende
// vragen elke soort vraag kan maken. Zie #22.
//
// De aantallen komen uit data/vragen-tellen.json. Zolang daar `voorbeeld: true` staat, zijn het
// voorbeeldcijfers om de pagina te ontwerpen, en dat zegt de pagina er ook bij.
//
// Op de site heet een vraagsoort "soort vraag". Zie BEGRIPPEN.md.
import TELLEN from '../../../data/vragen-tellen.json' with { type: 'json' };
import { pathFor, to } from '../routes.js';
import { DOMAINS, TOPICS } from '../topics/index.js';
import { T, esc } from '../typeset.js';
import { crumbs, pageHead, REPO } from './layout.js';

const getal = (x) => x.toLocaleString('nl-NL');

// Een schatting laten we zien op twee cijfers, want een tiende van een miljoen is schijnzekerheid.
function rond(n) {
  const grootte = 10 ** Math.max(0, String(Math.round(n)).length - 2);
  return Math.round(n / grootte) * grootte;
}
// "5.776" bij een exact aantal, en bij een schatting "≈ 120.000". Een schermlezer leest het teken
// niet goed voor, dus daar staat "ongeveer".
const aantal = (s) =>
  s.exact
    ? getal(s.aantal)
    : `<span aria-hidden="true">≈ </span><span class="sr">ongeveer </span>${getal(rond(s.aantal))}`;
// Een groot getal in woorden: "140 miljoen". Daaronder noemen we het hele getal.
const groot = (n) =>
  n >= 1e6 ? `${Number((n / 1e6).toPrecision(2)).toLocaleString('nl-NL')} miljoen` : getal(rond(n));

const practice = (skill, topic) =>
  pathFor({ name: 'topic', slug: topic.slug, oefen: true, soort: skill.id });

const som = (skills, tellen) => skills.reduce((n, k) => n + (tellen.soorten[k.id]?.aantal ?? 0), 0);
const schatting = (skills, tellen) => skills.some((k) => tellen.soorten[k.id]?.exact === false);
// Een som van schattingen is zelf een schatting. Kort staat er "≈" voor, in een kop of een regel
// onder een onderwerp.
const kort = (skills, tellen) =>
  schatting(skills, tellen)
    ? `<span aria-hidden="true">≈ </span><span class="sr">ongeveer </span>${groot(som(skills, tellen))}`
    : getal(som(skills, tellen));

const totaal = (skills, tellen) =>
  schatting(skills, tellen) ? `ongeveer ${groot(som(skills, tellen))}` : getal(som(skills, tellen));

function perOnderwerp(tellen) {
  const topic = (t) => {
    const name = `Verschillende vragen per soort vraag bij ${t.title}`;
    const rows = t.skills
      .map(
        (k) =>
          `<tr><th scope="row"><a href="${practice(k, t)}">${T(k.name)}</a></th><td>${aantal(tellen.soorten[k.id])}</td></tr>`,
      )
      .join('');
    // Een tabel die opzij schuift, moet ook met het toetsenbord te schuiven zijn.
    return `<details class="ctopic"><summary><span>${T(t.title)}</span><span class="small muted">${kort(t.skills, tellen)} vragen</span></summary>
    <div class="ctable" role="region" tabindex="0" aria-label="${esc(name)}"><table>
    <caption class="sr">${esc(name)}</caption>
    <thead><tr><th scope="col">Soort vraag</th><th scope="col">Vragen</th></tr></thead>
    <tbody>${rows}</tbody></table></div></details>`;
  };
  // Elk domein is een kaart in de kleur van het domein. Op een breed scherm staan er twee naast
  // elkaar.
  return `<div class="vdomeinen">${DOMAINS.map(
    (d) =>
      `<section class="vdomein color-${d.color}"><h3 class="vkop"><span>${esc(d.name)}</span><span class="small muted">${kort(
        d.topics.flatMap((t) => t.skills),
        tellen,
      )} vragen</span></h3>${d.topics.map(topic).join('')}</section>`,
  ).join('')}</div>`;
}

function vVragen() {
  const tellen = TELLEN;
  const skills = TOPICS.flatMap((t) => t.skills);
  const voorbeeld = tellen.voorbeeld
    ? '<p class="notice"><b>Dit zijn voorbeeldcijfers</b>, om de pagina te ontwerpen. De echte aantallen komen later.</p>'
    : '';
  const lead = `<p class="lead">Elke vraag op Wiskundefit is gemaakt door een computerprogramma, en elk antwoord wordt op een tweede manier nagerekend. Hier lees je hoe dat werkt en hoeveel verschillende vragen er zijn.</p>`;
  return `${crumbs()}<div class="sheet">${pageHead('Zo maken we de vragen', lead)}${voorbeeld}
  <div class="block"><h2 class="h3">Eerst even wat statistieken</h2>
  <p>Op Wiskundefit.nl kun je:</p>
  <div class="vstats">
  <div class="tile vtile-main"><span class="tile-value">${totaal(skills, tellen)}</span><span class="tile-label">verschillende vragen oefenen</span></div>
  <div class="tile"><span class="small muted">verdeeld over</span><span class="tile-value">${skills.length}</span><span class="tile-label">soorten vragen</span></div>
  <div class="tile"><span class="small muted">in</span><span class="tile-value">${DOMAINS.length} domeinen</span><span class="tile-label">en ${TOPICS.length} onderwerpen</span></div>
  </div></div>
  <div class="block"><h2 class="h3">Elke soort vraag heeft een generator</h2>
  <p>Een generator is een klein programma dat vragen van één soort maakt, met steeds andere getallen. Het bedenkt eerst het antwoord en maakt daar de vraag bij. Zo komen de getallen altijd mooi uit en krijg je geen antwoord als 3,7182818.</p>
  <p>Daarom kun je een soort vraag zo vaak oefenen als je wilt: er komt steeds een nieuwe vraag.</p></div>
  <div class="block"><h2 class="h3">Een voorbeeld: de schuine zijde</h2>
  <p>Neem de vraag om de schuine zijde van een rechthoekige driehoek te berekenen.</p>
  <ol>
  <li>De generator kiest de eerste rechthoekszijde uit 76 lengtes.</li>
  <li>Dan kiest hij de tweede rechthoekszijde, ook uit 76 lengtes.</li>
  <li>Daarna rekent hij de schuine zijde uit en maakt de vraag, met de uitwerking erbij.</li>
  </ol>
  <p>Elke keuze kan met elke andere keuze samen. Er zijn dus 76 × 76 = 5.776 verschillende vragen.</p></div>
  <div class="block"><h2 class="h3">Opnieuw kiezen tot het mooi uitkomt</h2>
  <p>Soms komt een keuze niet mooi uit. Een van de getallen is 0, of het antwoord is een lelijke breuk. Dan kiest de generator opnieuw, tot de vraag klopt. Zo'n afgekeurde keuze telt niet mee.</p>
  <p>We tellen dus niet alle combinaties, maar alleen de combinaties die een goede vraag geven. En als twee keuzes dezelfde vraag geven, telt die vraag één keer. Een andere volgorde van de antwoorden bij meerkeuze maakt het ook niet een andere vraag.</p></div>
  <div class="block"><h2 class="h3">Hoe we weten dat het antwoord klopt</h2>
  <p>Bij elke vraag rekent de computer het antwoord nog een keer na, op een andere manier dan de generator zelf. Komt daar iets anders uit, dan slaat de test alarm.</p>
  <p>Bij elke wijziging maken de tests duizenden vragen en controleren die allemaal. Elke vraag hoort bij een seed, een getal dat de vraag vastlegt. Met dezelfde seed krijg je precies dezelfde vraag, dus een fout is altijd te herhalen.</p></div>
  <div class="block"><h2 class="h3">Hoeveel vragen zijn er?</h2>
  <p>Open een onderwerp om te zien hoeveel verschillende vragen elke soort vraag kan maken. Staat er <b>≈</b> voor, dan is het aantal te groot om na te tellen en hebben we het geschat.</p>
  ${perOnderwerp(tellen)}</div>
  <div class="block"><h2 class="h3">Open en eerlijk</h2>
  <p>De code van de generatoren staat op <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>, dus je kunt nakijken hoe elke vraag wordt gemaakt. De generatoren, de tests en deze pagina zijn gemaakt met hulp van AI (Claude van Anthropic). Dat staat ook op de pagina <a href="${to('over')}">Over</a>. Klopt een vraag niet? Gebruik de knop <b>Meld een probleem</b> bij de vraag.</p></div></div>`;
}

export { vVragen };
