// De pagina Zo maken we de vragen: hoe de site vragen maakt en nakijkt, en hoeveel verschillende
// vragen elke soort vraag kan maken. Zie #22.
//
// De aantallen komen uit data/vragen-tellen.json, dat npm run vragen-tellen maakt.
//
// Op de site heet een vraagsoort "soort vraag". Zie BEGRIPPEN.md.
import TELLEN from '../../../data/vragen-tellen.json' with { type: 'json' };
import { pathFor, to } from '../routes.js';
import { DOMAINS, TOPICS } from '../topics/index.js';
import { T, esc } from '../typeset.js';
import { crumbs, pageHead, REPO } from './layout.js';

const getal = (x) => x.toLocaleString('nl-NL');

// Een vraag komt uit een seed van 32 bits. Zo'n seed zijn er 4.294.967.296, dus een vraagsoort laat
// hooguit zoveel verschillende vragen zien, ook als de generator er in theorie meer kan maken. Is
// het getal groter, dan staat er dit aantal, als schatting: een seed geeft haast nooit dezelfde
// vraag als een andere seed. Zie #22.
const SEEDS = 2 ** 32;
function soort(tellen, k) {
  const s = tellen.soorten[k.id];
  return s && s.aantal > SEEDS ? { aantal: SEEDS, exact: false } : s;
}

// Een schatting laten we zien op twee cijfers, want een tiende van een miljoen is schijnzekerheid.
function rond(n) {
  const grootte = 10 ** Math.max(0, String(Math.round(n)).length - 2);
  return Math.round(n / grootte) * grootte;
}
// Bij "meer dan" ronden we omlaag op twee cijfers: "meer dan 17 miljard" mag niet voor 16,6 staan.
function onder(n) {
  const stap = 10 ** Math.max(0, Math.floor(Math.log10(n)) - 1);
  return Math.floor(n / stap) * stap;
}
// n op twee cijfers als m × 10^e, met m van 1 tot 10.
function macht(n) {
  let e = Math.floor(Math.log10(n));
  let m = Number((n / 10 ** e).toPrecision(2));
  if (m >= 10) {
    m /= 10;
    e++;
  }
  return { m, e };
}
// "8,5 × 10²⁴". Een schermlezer leest het teken ² niet goed voor, dus daar staat het in woorden.
function wetenschappelijk(n) {
  const { m, e } = macht(n);
  const mantisse = m.toLocaleString('nl-NL');
  return `<span aria-hidden="true">${mantisse} × 10<sup>${e}</sup></span><span class="sr">${mantisse} keer 10 tot de macht ${e}</span>`;
}
// De som van alle aantallen, helemaal uitgeschreven met puntjes: 8.500.120.000.533.232.122. Dat kan
// in JavaScript niet met gewone getallen, want die zijn bij zo'n groot getal niet meer precies.
function uitgeschreven(skills, tellen) {
  const som = skills.reduce((n, k) => n + BigInt(Math.round(soort(tellen, k).aantal)), BigInt(0));
  return String(som).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
// Vanaf 10^12 is een getal in woorden niet meer te lezen, en dan schrijven we m × 10^e.
const GROTE_MACHT = 1e12;
// "5.776" bij een exact aantal, en bij een schatting "≈ 120.000". Een schermlezer leest het teken
// niet goed voor, dus daar staat "ongeveer".
const MEER = 'meer dan ';
const ongeveer = '<span aria-hidden="true">≈ </span><span class="sr">ongeveer </span>';
const mooi = (n) => (n >= GROTE_MACHT ? wetenschappelijk(n) : getal(rond(n)));
const aantal = (s) =>
  s.exact
    ? getal(s.aantal)
    : `${s.ondergrens ? MEER : ongeveer}${mooi(s.ondergrens ? onder(s.aantal) : s.aantal)}`;
// Een groot getal in woorden: "140 miljoen" of "3,8 miljard", en daarboven "8,5 × 10²⁴".
const groot = (n) => {
  if (n >= GROTE_MACHT) return wetenschappelijk(n);
  if (n < 1e6) return getal(rond(n));
  const [deel, woord] = n >= 1e9 ? [1e9, 'miljard'] : [1e6, 'miljoen'];
  const m = Number((n / deel).toPrecision(2));
  // Vlak onder een grens rondt het af naar 1.000 miljoen: dan is het de volgende eenheid.
  if (m >= 1000) return woord === 'miljoen' ? groot(1e9) : wetenschappelijk(n);
  return `${m.toLocaleString('nl-NL')} ${woord}`;
};

const practice = (skill, topic) =>
  pathFor({ name: 'topic', slug: topic.slug, oefen: true, soort: skill.id });

const som = (skills, tellen) => skills.reduce((n, k) => n + (soort(tellen, k)?.aantal ?? 0), 0);
// De som om te tonen: bij een ondergrens omlaag afgerond.
const totaalWaarde = (skills, tellen) =>
  ondergrens(skills, tellen) ? onder(som(skills, tellen)) : som(skills, tellen);
const schatting = (skills, tellen) => skills.some((k) => soort(tellen, k)?.exact === false);
// Is één van de aantallen een ondergrens, dan is de som dat ook: er zijn minstens zoveel.
const ondergrens = (skills, tellen) => skills.some((k) => soort(tellen, k)?.ondergrens);
// Een som van schattingen is zelf een schatting. Kort staat er "≈" voor, in een kop of een regel
// onder een onderwerp.
const kort = (skills, tellen) =>
  schatting(skills, tellen)
    ? `${ondergrens(skills, tellen) ? MEER : ongeveer}${groot(totaalWaarde(skills, tellen))}`
    : getal(som(skills, tellen));

function perOnderwerp(tellen) {
  const topic = (t) => {
    const name = `Verschillende vragen per soort vraag bij ${t.title}`;
    const rows = t.skills
      .map(
        (k) =>
          `<tr><th scope="row"><a href="${practice(k, t)}">${T(k.name)}</a></th><td>${aantal(soort(tellen, k))}</td></tr>`,
      )
      .join('');
    // Een tabel die opzij schuift, moet ook met het toetsenbord te schuiven zijn.
    return `<details class="ctopic"><summary><span>${T(t.title)}</span><span class="small muted">${kort(t.skills, tellen)}</span></summary>
    <div class="ctable" role="region" tabindex="0" aria-label="${esc(name)}"><table>
    <caption class="sr">${esc(name)}</caption>
    <thead><tr><th scope="col">Soort vraag</th><th scope="col">Vragen</th></tr></thead>
    <tbody>${rows}</tbody></table></div></details>`;
  };
  // Elk domein is een kaart in de kleur van het domein. Op een breed scherm staan er twee naast
  // elkaar.
  return `<div class="vdomeinen">${DOMAINS.map(
    (d) =>
      `<section class="vdomein color-${d.color}"><div class="vkop"><h3>${esc(d.name)}</h3><span class="small muted">${kort(
        d.topics.flatMap((t) => t.skills),
        tellen,
      )}</span></div>${d.topics.map(topic).join('')}</section>`,
  ).join('')}</div>`;
}

// Een rooster van 76 bij 76 vakjes: elk vakje is één vraag. De afmetingen staan hier vast, want de
// pagina legt het voorbeeld Schuine zijde uit.
function raster() {
  const N = 76;
  const C = 4;
  const X = 26;
  const Y = 22;
  const size = N * C;
  const label = `Een rooster van ${N} bij ${N} vakjes. Elk vakje is één vraag: ${getal(N * N)} samen.`;
  return `<figure class="vfig"><svg class="vraster" viewBox="0 0 ${X + size + 2} ${Y + size + 2}" role="img" aria-label="${label}">
  <defs><pattern id="vraster-vakje" width="${C}" height="${C}" patternUnits="userSpaceOnUse"><path class="vr-lijn" d="M${C} 0H0V${C}"/></pattern></defs>
  <rect class="vr-bg" x="${X}" y="${Y}" width="${size}" height="${size}"/>
  <rect class="vr-patroon" x="${X}" y="${Y}" width="${size}" height="${size}" fill="url(#vraster-vakje)"/>
  <rect class="vr-rand" x="${X}" y="${Y}" width="${size}" height="${size}"/>
  <circle class="vr-ring" cx="${X + 23.5 * C}" cy="${Y + 40.5 * C}" r="9"/>
  <rect class="vr-cel" x="${X + 23 * C}" y="${Y + 40 * C}" width="${C}" height="${C}"/>
  <text class="vr-t" x="${X + size / 2}" y="14" text-anchor="middle">eerste zijde: ${N} lengtes</text>
  <text class="vr-t" x="12" y="${Y + size / 2}" text-anchor="middle" transform="rotate(-90 12 ${Y + size / 2})">tweede zijde: ${N} lengtes</text>
  </svg><figcaption class="small muted">Elk vakje is één vraag. Het oranje vakje hoort bij één keuze voor de eerste zijde en één voor de tweede.</figcaption></figure>`;
}

// Het totaal ook één keer helemaal uitgeschreven. Alleen de eerste cijfers zeggen iets: de aantallen
// zijn schattingen.
function uitschrijving(skills, tellen) {
  return `<p class="vuit"><span class="small muted">Onze huidige beste schatting van het aantal verschillende vragen is:</span><b>${uitgeschreven(skills, tellen)}</b><span class="small muted">Alleen de eerste cijfers zeggen iets, want veel aantallen zijn schattingen.</span></p>`;
}

// Een rooster van b (−9 tot 9) bij x (−8 tot 8), voor de vraag "Bereken f(x) = ax + b". b en x mogen
// niet 0 zijn: die vakjes zijn grijs en tellen niet mee. De aantallen komen uit de lijsten, zodat de
// tekst en het plaatje niet uit elkaar kunnen lopen.
const AF = { b: [-9, 9], x: [-8, 8] };
const aantalWaarden = ([van, tot]) => tot - van + 1;
const nulKolom = AF.b[1] + 1; // de plek van b = 0
const nulRij = AF.x[1] + 1; // de plek van x = 0
const afRaster = () => {
  const kolommen = aantalWaarden(AF.b);
  const rijen = aantalWaarden(AF.x);
  const totaal = kolommen * rijen;
  const over = (kolommen - 1) * (rijen - 1);
  return { kolommen, rijen, totaal, over, af: totaal - over };
};
function rasterAfgekeurd() {
  const { kolommen: N, rijen: M, totaal, over, af } = afRaster();
  const C = 12;
  const X = 26;
  const Y = 22;
  const w = N * C;
  const h = M * C;
  const label = `Een rooster van ${N} bij ${M} vakjes, ${getal(totaal)} samen. In ${getal(af)} vakjes is b of x gelijk aan 0. Die vakjes worden afgekeurd, dus er blijven ${getal(over)} vakjes over.`;
  const nul = (k, r) => k === nulKolom || r === nulRij;
  let cellen = '';
  for (let r = 0; r < M; r++)
    for (let k = 0; k < N; k++)
      if (nul(k, r))
        cellen += `<rect class="vr-af" x="${X + k * C}" y="${Y + r * C}" width="${C}" height="${C}"/>`;
  return `<figure class="vfig"><svg class="vraster" viewBox="0 0 ${X + w + 2} ${Y + h + 2}" role="img" aria-label="${label}">
  <defs><pattern id="vraster-af-vakje" width="${C}" height="${C}" patternUnits="userSpaceOnUse"><path class="vr-lijn" d="M${C} 0H0V${C}"/></pattern></defs>
  <rect class="vr-bg" x="${X}" y="${Y}" width="${w}" height="${h}"/>
  ${cellen}
  <rect class="vr-patroon" x="${X}" y="${Y}" width="${w}" height="${h}" fill="url(#vraster-af-vakje)"/>
  <rect class="vr-rand" x="${X}" y="${Y}" width="${w}" height="${h}"/>
  <text class="vr-t" x="${X + w / 2}" y="14" text-anchor="middle">b: ${N} mogelijkheden</text>
  <text class="vr-t" x="12" y="${Y + h / 2}" text-anchor="middle" transform="rotate(-90 12 ${Y + h / 2})">x: ${M} mogelijkheden</text>
  </svg><figcaption class="small muted">Elk vakje is één keuze voor b en x. De grijze vakjes zijn afgekeurd: daar is b of x gelijk aan 0. Er blijven ${getal(over)} van de ${getal(totaal)} vakjes over.</figcaption></figure>`;
}

// Een rooster van p bij q (1 tot 10), voor de vergelijking x² − (p + q)x + pq = 0. Het vakje (p, q) en
// het gespiegelde vakje (q, p) geven dezelfde vergelijking, dus alleen één van beide telt. De
// aantallen volgen uit N.
const NP = 10;
function rasterDubbel() {
  const C = 16;
  const X = 26;
  const Y = 22;
  const w = NP * C;
  const uniek = (NP * (NP + 1)) / 2;
  const totaal = NP * NP;
  const label = `Een rooster van ${NP} bij ${NP} vakjes, ${getal(totaal)} samen. Het vakje van p en q en het gespiegelde vakje geven dezelfde vergelijking. Daardoor zijn er ${getal(uniek)} verschillende vragen.`;
  const vakje = (p, q) =>
    `x="${X + (p - 1) * C}" y="${Y + (q - 1) * C}" width="${C}" height="${C}"`;
  let dubbel = '';
  for (let q = 1; q <= NP; q++)
    for (let p = q + 1; p <= NP; p++) dubbel += `<rect class="vr-dubbel" ${vakje(p, q)}/>`;
  const midden = (p, q) => [X + (p - 0.5) * C, Y + (q - 0.5) * C];
  const [x1, y1] = midden(3, 7);
  const [x2, y2] = midden(7, 3);
  return `<figure class="vfig"><svg class="vraster" viewBox="0 0 ${X + w + 2} ${Y + w + 2}" role="img" aria-label="${label}">
  <defs><pattern id="vraster-dubbel-vakje" width="${C}" height="${C}" patternUnits="userSpaceOnUse"><path class="vr-lijn" d="M${C} 0H0V${C}"/></pattern></defs>
  <rect class="vr-bg" x="${X}" y="${Y}" width="${w}" height="${w}"/>
  ${dubbel}
  <rect class="vr-patroon" x="${X}" y="${Y}" width="${w}" height="${w}" fill="url(#vraster-dubbel-vakje)"/>
  <rect class="vr-rand" x="${X}" y="${Y}" width="${w}" height="${w}"/>
  <line class="vr-ring" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-dasharray="3 3"/>
  <circle class="vr-ring" cx="${x1}" cy="${y1}" r="8"/>
  <circle class="vr-ring" cx="${x2}" cy="${y2}" r="8"/>
  <text class="vr-t" x="${X + w / 2}" y="14" text-anchor="middle">p: ${NP} mogelijkheden</text>
  <text class="vr-t" x="12" y="${Y + w / 2}" text-anchor="middle" transform="rotate(-90 12 ${Y + w / 2})">q: ${NP} mogelijkheden</text>
  </svg><figcaption class="small muted">De twee omcirkelde vakjes (p = 3 en q = 7, en p = 7 en q = 3) geven dezelfde vraag. De oranje vakjes zijn zo'n tweede vakje voor dezelfde vraag. Er blijven ${getal(uniek)} verschillende vragen over van de ${getal(totaal)} vakjes.</figcaption></figure>`;
}

function vVragen() {
  const tellen = TELLEN;
  const skills = TOPICS.flatMap((t) => t.skills);
  const lead = `<p class="lead">Elke vraag op Wiskundefit is gemaakt door een computerprogramma, en elk antwoord wordt op een tweede manier nagerekend. Hier lees je hoe dat werkt en hoeveel verschillende vragen er zijn.</p>`;
  return `${crumbs()}<div class="sheet">${pageHead('Zo maken we de vragen', lead)}
  <div class="block"><h2 class="h3">Eerst even wat statistieken</h2>
  <p>Op Wiskundefit.nl kun je:</p>
  <div class="vstats">
  <div class="tile vtile-main">${schatting(skills, tellen) ? `<span class="small muted">${ondergrens(skills, tellen) ? 'meer dan' : 'ongeveer'}</span>` : ''}<span class="tile-value">${schatting(skills, tellen) ? groot(totaalWaarde(skills, tellen)) : getal(som(skills, tellen))}</span><span class="tile-label">verschillende vragen oefenen</span></div>
  <div class="tile"><span class="small muted">verdeeld over</span><span class="tile-value">${skills.length} soorten vragen</span><span class="tile-label">om uit te kiezen</span></div>
  <div class="tile"><span class="small muted">in</span><span class="tile-value">${DOMAINS.length} domeinen</span><span class="tile-label">en ${TOPICS.length} onderwerpen</span></div>
  </div>${uitschrijving(skills, tellen)}</div>
  <div class="block"><h2 class="h3">Elke soort vraag heeft een generator</h2>
  <p>Een generator is een klein programma dat vragen van één soort maakt, met steeds andere getallen. Het bedenkt eerst het antwoord en maakt daar de vraag bij. Zo komen de getallen altijd mooi uit en krijg je geen antwoord als 3,7182818.</p>
  <p>Daarom kun je een soort vraag zo vaak oefenen als je wilt: er komt steeds een nieuwe vraag.</p></div>
  <div class="block"><h2 class="h3">Een voorbeeld: de schuine zijde</h2>
  <p>Neem de vraag om de schuine zijde van een rechthoekige driehoek te berekenen.</p>
  <ol class="vsteps">
  <li>De generator kiest de eerste rechthoekszijde uit 76 lengtes.</li>
  <li>Dan kiest hij de tweede rechthoekszijde, ook uit 76 lengtes.</li>
  <li>Daarna rekent hij de schuine zijde uit en maakt de vraag, met de uitwerking erbij.</li>
  </ol>
  <p>Elke keuze kan met elke andere keuze samen. Er zijn dus 76 × 76 = 5.776 verschillende vragen.</p>
  ${raster()}</div>
  <div class="block"><h2 class="h3">Niet elk vakje is een goede vraag</h2>
  <p>Neem de vraag: "Gegeven is f(x) = ax + b. Bereken f(x) voor een gegeven x." De generator kiest een getal voor b en een voor x, en ze mogen geen van beide 0 zijn. Elk vakje in het rooster is weer één keuze.</p>
  ${rasterAfgekeurd()}
  <p>Een keuze die niet mag, valt af. De generator kiest dan opnieuw, tot de vraag klopt. We tellen dus alleen de vakjes die een goede vraag geven.</p>
</div>
  <div class="block"><h2 class="h3">Soms is een vraag dubbel</h2>
  <p>Neem de vraag om x² − 10x + 21 = 0 op te lossen. De generator maakt die vraag uit twee oplossingen, p en q, die elk een getal van 1 tot 10 zijn. Kiest hij p = 3 en q = 7, of p = 7 en q = 3? Dat geeft dezelfde vergelijking, dus dezelfde vraag.</p>
  ${rasterDubbel()}
  <p>Zo'n vraag telt één keer. We tellen dus verschillende vragen en niet alle keuzes. Een andere volgorde van de antwoorden bij meerkeuze maakt het ook niet een andere vraag.</p></div>
  <div class="block"><h2 class="h3">Hoe we weten dat het antwoord klopt</h2>
  <p>Bij elke vraag rekent de computer het antwoord nog een keer na, op een andere manier dan de generator zelf. Komt daar iets anders uit, dan slaat de test alarm.</p>
  <p>Bij elke wijziging maken de tests duizenden vragen en controleren die allemaal. Elke vraag hoort bij een seed, een getal dat de vraag vastlegt. Met dezelfde seed krijg je precies dezelfde vraag, dus een fout is altijd te herhalen.</p></div>
  <div class="block"><h2 class="h3">Hoeveel vragen zijn er?</h2>
  <p>Hieronder staat per domein, onderwerp en soort vraag hoeveel verschillende vragen er zijn. Open een onderwerp om de soorten vragen te zien. Soms is het aantal te groot om na te tellen. Staat er <b>≈</b> voor, dan hebben we het geschat, en dat kan er wat naast zitten. Staat er <b>meer dan</b> voor, dan weten we alleen dat het er minstens zoveel zijn, en zijn het er waarschijnlijk meer. Een getal als 2,3 × 10<sup>21</sup> lees je als 2,3 keer 10<sup>21</sup>, en 10<sup>21</sup> is een 1 met 21 nullen. Zulke grote aantallen komen er als de generator veel getallen kiest, zoals bij een tabel of een diagram. Elke vraag komt uit een seed van 32 bits, en daarvan zijn er 4.294.967.296. Meer verschillende vragen dan dat kan één soort dus niet laten zien, en zo'n soort staat hier op ongeveer 4,3 miljard.</p>
  <div class="row"><button class="btn quiet" type="button" data-act="vragenopen" data-id="open">Alles openen</button><button class="btn quiet" type="button" data-act="vragenopen" data-id="dicht">Alles sluiten</button></div>
  ${perOnderwerp(tellen)}
  <p class="vtotaal"><span>Samen</span><span><b>${kort(skills, tellen)}</b> verschillende vragen</span></p></div>
  <div class="block"><h2 class="h3">Open en eerlijk</h2>
  <p>De code van de generatoren staat op <a href="${REPO}" target="_blank" rel="noopener">GitHub</a>, dus je kunt nakijken hoe elke vraag wordt gemaakt. De generatoren, de tests en deze pagina zijn gemaakt met hulp van AI (Claude van Anthropic). Dat staat ook op de pagina <a href="${to('over')}">Over</a>. Klopt een vraag niet? Gebruik de knop <b>Meld een probleem</b> bij de vraag.</p></div></div>`;
}

export { vVragen };
