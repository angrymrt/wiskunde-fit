// De pagina Cijfers: hoe er op de site wordt geoefend, uit de anonieme tellen. De build rekent de
// cijfers uit (src/js/cijfers.js) en zet ze als __CIJFERS__ in de code. Zie #19.
//
// Op de site heet een vraagsoort "soort vraag", een valkuil "veelgemaakte fout" en een eerste
// poging "een gemaakte vraag". Zie BEGRIPPEN.md.
import { MINIMUM, MINIMUM_VALKUIL } from '../cijfers.js';
import { pathFor, to } from '../routes.js';
import { DOMAINS, TOPICS } from '../topics/index.js';
import { T, esc } from '../typeset.js';
import { crumbs, pageHead, REPO } from './layout.js';

// Zo vaak staat iets in een top: de moeilijkste vraagsoorten en de meest gemaakte fouten.
const TOP = 5;

const getal = (x) => x.toLocaleString('nl-NL');
const procent = (deel, geheel = 1) => `${Math.round((100 * deel) / geheel)}%`;
function tijd(sec) {
  const s = Math.round(sec);
  if (s < 60) return `${s} sec`;
  return s % 60 ? `${Math.floor(s / 60)} min ${s % 60} sec` : `${s / 60} min`;
}
const datum = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

// De vraagsoorten met hun onderwerp en domein, in de volgorde van de site.
const SKILLS = TOPICS.flatMap((t) => t.skills.map((skill) => ({ skill, topic: t })));
const practice = (skill, topic) =>
  pathFor({ name: 'topic', slug: topic.slug, oefen: true, soort: skill.id });

function tile(value, label, note = '') {
  return `<div class="tile"><span class="tile-value">${value}</span><span class="tile-label">${label}</span>${note ? `<span class="tile-note small muted">${note}</span>` : ''}</div>`;
}

// Een rij met een staaf: de naam, het getal, en de staaf naar verhouding van de grootste. De naam
// heeft de kleur van het domein; de staaf heeft dezelfde kleur als de andere staven op de pagina.
function barRow(name, value, max, color) {
  const width = max ? Math.max(1, Math.round((100 * value) / max)) : 0;
  return `<li class="cbar color-${color}"><span>${name}</span><span class="cbar-n">${getal(value)}</span><span class="bar" aria-hidden="true"><i style="width:${width}%"></i></span></li>`;
}

function populair(c) {
  const per = (skills) => skills.reduce((s, k) => s + (c.soorten[k.id]?.pogingen ?? 0), 0);
  // Van meest naar minst geoefend. Bij evenveel blijft de volgorde van de site.
  const domains = DOMAINS.map((d) => ({ d, n: per(d.topics.flatMap((t) => t.skills)) })).sort(
    (a, b) => b.n - a.n,
  );
  const max = Math.max(...domains.map((x) => x.n));
  return `<div class="block"><h2 class="h3">Het meest geoefend</h2>
  <p>Hoeveel vragen er per domein zijn gemaakt. Een vraag telt één keer, ook als je hem vaker probeert.</p>
  <ul class="cbars">${domains.map(({ d, n }) => barRow(`<a href="${pathFor({ name: 'domain', slug: d.slug })}">${esc(d.name)}</a>`, n, max, d.color)).join('')}</ul></div>`;
}

// Een staaf van 0 tot 1, met een streepje voor het gemiddelde. De getallen staan er altijd ook als
// tekst bij, dus voor een schermlezer is de staaf niet nodig.
const meter = (value, avg) =>
  `<span class="meter" aria-hidden="true"><i style="width:${Math.round(100 * value)}%"></i><b style="left:${Math.round(100 * avg)}%"></b></span>`;
const legend = (text) =>
  `<p class="small muted"><span class="meter-key" aria-hidden="true"></span> ${text}</p>`;

// Een rij in een top: de soort vraag met een link naar oefenen en rechts de score, eronder het
// onderwerp, een staaf en wat de score uitlegt. De staaf heeft één kleur: het domein staat er als
// tekst bij, en een kleur per domein maakt de top alleen onrustig. De score heeft voor een schermlezer een woord
// ervoor en erna, zoals "moeilijkheid 69 van 100".
const rankRow = ({ skill, topic }, score, rest) =>
  `<li><span class="rank-head"><a href="${practice(skill, topic)}">${T(skill.name)}</a><b>${score}</b></span><span class="small muted">${T(topic.title)}</span>${rest}</li>`;
const sr = (text) => `<span class="sr">${text}</span>`;

function moeilijkst(c) {
  const ranked = SKILLS.filter(({ skill }) => c.soorten[skill.id]?.moeilijkheid !== undefined)
    .sort((a, b) => c.soorten[b.skill.id].moeilijkheid - c.soorten[a.skill.id].moeilijkheid)
    .slice(0, TOP);
  if (!ranked.length) return '';
  const avg = c.totaal.moeilijkheid;
  const row = (x) => {
    const s = c.soorten[x.skill.id];
    return rankRow(
      x,
      `${sr('moeilijkheid ')}${Math.round(100 * s.moeilijkheid)}${sr(' van 100')}`,
      `${meter(s.moeilijkheid, avg)}<span class="small">${procent(s.goed, s.pogingen)} in één keer goed, van ${getal(s.pogingen)} keer gemaakt</span>`,
    );
  };
  return `<div class="block"><h2 class="h3">De moeilijkste vragen</h2>
  ${legend(`Moeilijkheid van 0 tot 100: bij 0 is een vraag bijna altijd meteen goed, bij 100 bijna altijd fout. Het streepje is het gemiddelde van alle soorten vragen: ${Math.round(100 * avg)}.`)}
  <ol class="ranking">${ranked.map(row).join('')}</ol>
  <details class="small"><summary>Hoe we dit berekenen</summary>
  <p>We kijken naar de eerste keer dat een vraag wordt gemaakt. Goed zonder hint telt als 0, goed met hint als een half, en fout of meteen de uitwerking bekijken als 1. Het gemiddelde daarvan is het grootste deel van de score.</p>
  <p>Is een soort vraag nog maar weinig gemaakt, dan rekenen we er een stukje van het gemiddelde van de hele site bij. Zo komt een vraag niet bovenaan door een paar keer pech.</p>
  <p>Voor een kwart telt de tijd mee: hoe lang een goed antwoord duurt, vergeleken met de andere soorten vragen. Lang moeten nadenken hoort bij moeilijk. Maar een vraag waarin je veel moet invullen, duurt ook langer. Daarom telt de tijd maar voor een kwart.</p>
  <p>Alleen soorten vragen die minstens ${MINIMUM} keer zijn gemaakt, doen mee.</p></details></div>`;
}

function fouten(c) {
  const all = SKILLS.flatMap(({ skill, topic }) => {
    const s = c.soorten[skill.id];
    if (!s) return [];
    return Object.entries(s.valkuilen).map(([id, n]) => ({
      skill,
      topic,
      s,
      n,
      m: s.teksten?.[id],
    }));
  })
    .filter((x) => x.n >= MINIMUM_VALKUIL && x.s.fout >= MINIMUM)
    .sort((a, b) => b.n - a.n)
    .slice(0, TOP);
  if (!all.length) return '';
  const row = (x) =>
    rankRow(
      x,
      `${getal(x.n)} keer`,
      `<span class="small">${procent(x.n, x.s.fout)} van de foute antwoorden bij deze soort vraag</span>${x.m ? `<span class="feedback"><span class="muted">Je ziet dan:</span> ${T(x.m)}</span>` : ''}`,
    );
  return `<div class="block"><h2 class="h3">Meest gemaakte fouten</h2>
  <p>Veel vragen herkennen een veelgemaakte fout. Dan krijg je uitleg over wat er misging. Deze fouten kwamen het vaakst voor.</p>
  <ol class="ranking">${all.map(row).join('')}</ol></div>`;
}

// De vragen die in een proeftoets het vaakst leeg blijven: dan wist je waarschijnlijk niet hoe je
// moest beginnen. De volgorde komt uit s.leeg, dat bij weinig proeftoetsen naar het gemiddelde
// schuift. De staaf en het getal tonen wat er echt is gebeurd, op een schaal van 0 tot 100%.
function leeg(c) {
  const total = (s) => s.toets.goed + s.toets.fout + s.toets.leeg;
  const ranked = SKILLS.filter(({ skill }) => c.soorten[skill.id]?.leeg !== undefined)
    .sort((a, b) => c.soorten[b.skill.id].leeg - c.soorten[a.skill.id].leeg)
    .slice(0, TOP);
  if (!ranked.length) return '';
  const avg = c.totaal.leeg;
  const row = (x) => {
    const s = c.soorten[x.skill.id];
    return rankRow(
      x,
      `${procent(s.toets.leeg, total(s))}${sr(' leeg gelaten')}`,
      `${meter(s.toets.leeg / total(s), avg)}<span class="small">${getal(s.toets.leeg)} van de ${getal(total(s))} keer leeg gelaten</span>`,
    );
  };
  return `<div class="block"><h2 class="h3">Vaakst leeg gelaten in een proeftoets</h2>
  <p>Laat je een vraag in een proeftoets leeg, dan wist je waarschijnlijk niet hoe je moest beginnen.</p>
  ${legend(`Hoe vaak een vraag leeg bleef, van 0 tot 100%. Het streepje is het gemiddelde van alle vragen in proeftoetsen: ${procent(avg)}.`)}
  <ol class="ranking">${ranked.map(row).join('')}</ol>
  <p class="small muted">Zat een soort vraag nog maar weinig in proeftoetsen, dan rekenen we voor de volgorde een stukje van het gemiddelde mee, net als bij de moeilijkheid. Alleen soorten vragen die minstens ${MINIMUM} keer in een proeftoets zaten, doen mee.</p></div>`;
}

function perOnderwerp(c) {
  const cells = (s) =>
    s.pogingen < MINIMUM
      ? `<td colspan="4" class="muted">nog te weinig</td>`
      : `<td>${procent(s.goed, s.pogingen)}</td><td>${procent(s.hint, s.pogingen)}</td><td>${procent(s.uitwerking, s.pogingen)}</td><td>${s.duur === null ? '' : tijd(s.duur)}</td>`;
  const topic = (t) => {
    const rows = t.skills.map((k) => ({ k, s: c.soorten[k.id] ?? { pogingen: 0 } }));
    const n = rows.reduce((sum, r) => sum + r.s.pogingen, 0);
    const goed = rows.reduce((sum, r) => sum + (r.s.goed ?? 0), 0);
    const name = `Per soort vraag bij ${t.title}`;
    // Een tabel die opzij schuift, moet ook met het toetsenbord te schuiven zijn.
    return `<details class="ctopic"><summary><span>${T(t.title)}</span><span class="small muted">${getal(n)} keer gemaakt${n >= MINIMUM ? `, ${procent(goed, n)} goed` : ''}</span></summary>
    <div class="ctable" role="region" tabindex="0" aria-label="${esc(name)}"><table>
    <caption class="sr">${esc(name)}</caption>
    <thead><tr><th scope="col">Soort vraag</th><th scope="col">Gemaakt</th><th scope="col">Goed</th><th scope="col">Hint</th><th scope="col">Uitwerking</th><th scope="col">Tijd</th></tr></thead>
    <tbody>${rows.map(({ k, s }) => `<tr><th scope="row"><a href="${practice(k, t)}">${T(k.name)}</a></th><td>${getal(s.pogingen)}</td>${cells(s)}</tr>`).join('')}</tbody></table></div><p class="small muted">Gemaakt: zo vaak is de vraag gemaakt. Goed: in één keer goed. Hint: eerst de hint gevraagd. Uitwerking: meteen de uitwerking bekeken. Tijd: de helft van de goede antwoorden was sneller.</p></details>`;
  };
  return `<div class="block"><h2 class="h3">Per onderwerp</h2>
  ${DOMAINS.map((d) => `<h3 class="plain-h">${esc(d.name)}</h3>${d.topics.map(topic).join('')}`).join('')}</div>`;
}

function vCijfers() {
  const c = typeof __CIJFERS__ === 'object' ? __CIJFERS__ : null;
  const nep = c?.nep
    ? '<p class="notice"><b>Dit zijn nepcijfers</b>, om de pagina te ontwerpen. Ze komen nooit online.</p>'
    : '';
  const about = `<div class="block"><h2 class="h3" id="niet-zeggen">Wat deze cijfers niet zeggen</h2>
  <ul>
  <li>We tellen geen leerlingen, alleen gemaakte vragen. Eén leerling die veel oefent, telt dus vaak mee.</li>
  <li>Iemand kan de cijfers expres opblazen. Dat kunnen we niet helemaal voorkomen.</li>
  <li>Een moeilijke soort vraag is niet per se een slechte vraag. Soms is de stof gewoon lastig.</li>
  </ul>
  <p>Wat we precies tellen, staat op de pagina <a href="${to('privacy')}">Privacy</a>. De tellen per dag staan ${`<a href="${REPO}/tree/main/data/tellen" target="_blank" rel="noopener">op GitHub</a>`}, zodat je alles kunt nagaan.</p></div>`;
  if (!c?.totaal?.pogingen) {
    return `${crumbs()}<div class="sheet">${pageHead('Cijfers')}${nep}<div class="block"><p>Hier komt te staan hoe er op Wiskundefit wordt geoefend: welke stof het meest, welke vragen moeilijk zijn en welke fouten vaak voorkomen. Elke week tellen we de anonieme tellen op. Zodra er genoeg zijn, staan de cijfers hier.</p></div>${about}</div>`;
  }
  const t = c.totaal;
  const sinds =
    c.proeftoetsenVan && c.proeftoetsenVan > c.van ? `sinds ${datum(c.proeftoetsenVan)}` : '';
  const lead = `<p class="lead">Hoe er op Wiskundefit wordt geoefend, anoniem geteld van ${datum(c.van)} tot en met ${datum(c.tot)}. Zo zien we welke vragen lastig zijn en wat we beter kunnen uitleggen.</p>
  <p class="small muted">We tellen gemaakte vragen, geen leerlingen. Lees de cijfers dus als een richting, niet als precieze waarheid. <a href="#niet-zeggen">Wat de cijfers niet zeggen</a></p>`;
  return `${crumbs()}<div class="sheet">${pageHead('Cijfers', lead)}${nep}
  <div class="tiles">${tile(getal(t.pogingen), 'vragen gemaakt')}${tile(procent(t.goed, t.pogingen), 'in één keer goed')}${t.duur === null ? '' : tile(tijd(t.duur), 'per goed antwoord', 'de helft was sneller')}${tile(getal(t.proeftoetsen), 'proeftoetsen gemaakt', sinds)}</div>
  ${populair(c)}${moeilijkst(c)}${fouten(c)}${leeg(c)}${perOnderwerp(c)}${about}</div>`;
}

export { vCijfers };
