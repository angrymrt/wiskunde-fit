// Het overzichtsscherm met alle onderwerpen per domein, en de pagina van één domein.
import { DOMAINS } from '../topics/index.js';
import { prog, topicPct } from '../progress.js';
import { pathFor, to } from '../routes.js';
import { bookPath, domainParagraphs, isChosen } from '../stof.js';
import { esc, T } from '../typeset.js';
import { resultText } from './exam.js';
import { crumbs } from './layout.js';
import { state } from './state.js';
import { list, mappingName } from './stof.js';

function heroFig() {
  const X = (x) => 30 + x * 26,
    Y = (y) => 168 - y * 26;
  return `<svg class="fig hero-fig" viewBox="0 0 230 190" role="img" aria-label="Een rechte lijn met twee gelijkvormige hellingsdriehoeken">
  <path class="sf" d="M${X(1)} ${Y(1.5)}H${X(3)}V${Y(2.5)}Z"/><path class="sf2" d="M${X(3)} ${Y(2.5)}H${X(7)}V${Y(4.5)}Z"/>
  <path class="ax" d="M${X(-0.6)} ${Y(0)}H${X(7.6)}M${X(0)} ${Y(-0.5)}V${Y(6)}"/>
  <line class="l1" x1="${X(-0.5)}" y1="${Y(0.75)}" x2="${X(7.5)}" y2="${Y(4.75)}"/>
  <path class="s" d="M${X(1)} ${Y(1.5)}H${X(3)}V${Y(2.5)}M${X(3)} ${Y(2.5)}H${X(7)}V${Y(4.5)}"/>
  <text x="${X(2) - 4}" y="${Y(1.5) + 17}">2</text><text x="${X(3) + 6}" y="${Y(2) + 5}">1</text><text x="${X(5) - 4}" y="${Y(2.5) + 17}">4</text><text x="${X(7) + 6}" y="${Y(3.5) + 5}">2</text>
  <text class="ti t1" x="${X(0.5)}" y="${Y(3.6)}">y = ½x + 1</text></svg>`;
}
// Een onderwerp met de voortgang. Op de pagina van een domein staat de intro erbij.
function topicRow(s, intro = false) {
  const p = Math.round(topicPct(s) * 100),
    done = p >= 80,
    mine = s.skills.some((k) => isChosen(k.id)) ? ' <span class="pill">Mijn stof</span>' : '';
  return `<a class="par" href="${pathFor({ name: 'topic', slug: s.slug })}"><span>${T(s.title)}${mine}</span><span class="pct">${done ? '<span class="pill good">Beheerst</span>' : p ? p + '%' : ''}</span>${intro ? `<span class="small muted par-note">${T(s.intro)}</span>` : ''}<span class="bar ${done ? 'done' : ''}"><i style="width:${p}%"></i></span></a>`;
}
const domainPath = (d) => pathFor({ name: 'domain', slug: d.slug });
function vHome() {
  const last = state.result;
  const domain = (d) =>
    `<section class="domain color-${d.color}" id="${d.slug}"><h2 class="domain-head"><a href="${domainPath(d)}">${d.name}<span aria-hidden="true">›</span></a></h2>${d.topics.map((t) => topicRow(t)).join('')}</section>`;
  return `<section class="hero"><div class="hero-txt"><h1>Op naar die voldoende!</h1><p class="lead">Oefen voor je wiskundetoets met uitleg, hints en steeds nieuwe vragen. Zo ga je goed voorbereid je toets in.</p>
  <div class="row">${prog.stof ? `<a class="btn main" href="${to('stof')}">Verder met mijn stof</a>` : `<a class="btn main" href="${bookPath()}">Oefen voor je toets: kies uit je boek</a>`}<a class="btn" href="${to('toets')}">${state.test ? 'Ga verder met je proeftoets' : 'Maak een proeftoets'}</a></div>
  ${last ? `<p>Je laatste resultaat: <a href="${to('toetsres')}">${resultText(last)}</a></p>` : ''}</div>${heroFig()}</section>
  <div class="domains">${DOMAINS.map(domain).join('')}</div>
  <p class="small muted">Je voortgang blijft in deze browser bewaard. Je ziet en wist die op <a href="${to('stof')}">Mijn stof</a>.</p>`;
}

// Een domein: wat het is, de onderwerpen erin en bij welke paragrafen uit je boek ze horen.
function vDomain(d) {
  const book = ({ mapping: m, paragraphs }) => {
    const numbers = paragraphs.map((p) => esc(p.number));
    return `<li><a href="${pathFor({ name: 'mapping', id: m.id })}">${mappingName(m)}</a>: ${numbers.length === 1 ? 'paragraaf' : 'paragrafen'} ${list(numbers)}${m.note ? `<span class="muted pick-note">${esc(m.note)}</span>` : ''}</li>`;
  };
  const books = domainParagraphs(d);
  return `<div class="screen-grid color-${d.color}">${crumbs()}<article class="sheet">
  <div class="head domain-band"><h1>${esc(d.name)}</h1><p class="lead">${esc(d.intro)}</p></div>
  <section class="block"><h2 class="h3">Onderwerpen</h2><div class="stof-list">${d.topics.map((t) => topicRow(t, true)).join('')}</div></section>
  ${books.length ? `<section class="block"><h2 class="h3">In je boek</h2><p class="small muted">Bij deze paragrafen kun je de onderwerpen van ${esc(d.name)} oefenen.</p><ul class="book-list small">${books.map(book).join('')}</ul></section>` : ''}
  </article></div>`;
}

export { domainPath, vDomain, vHome };
