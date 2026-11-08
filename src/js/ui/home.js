// Het overzichtsscherm met alle onderwerpen per domein.
import { DOMAINS } from '../topics/index.js';
import { prog, topicPct } from '../progress.js';
import { pathFor, to } from '../routes.js';
import { T } from '../typeset.js';
import { state } from './state.js';
import { bookPath } from './stof.js';

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
function vHome() {
  const last = state.result;
  const started = Object.keys(prog.skills).length > 0;
  const topicRow = (s) => {
    const p = Math.round(topicPct(s) * 100),
      done = p >= 80;
    return `<a class="par" href="${pathFor({ name: 'topic', slug: s.slug })}"><span>${T(s.title)}</span><span class="pct">${done ? '<span class="pill good">Beheerst</span>' : p ? p + '%' : ''}</span><span class="bar ${done ? 'done' : ''}"><i style="width:${p}%"></i></span></a>`;
  };
  const domain = (d) =>
    `<section class="domain color-${d.color}" id="${d.slug}"><h2 class="domain-head">${d.name}</h2>${d.topics.map(topicRow).join('')}</section>`;
  return `<section class="hero"><div class="hero-txt"><h1>Op naar die voldoende!</h1><p class="lead">Oefen voor je wiskundetoets met uitleg, hints en steeds nieuwe vragen. Zo ga je goed voorbereid je toets in.</p>
  <div class="row">${prog.stof ? `<a class="btn main" href="${to('stof')}">Verder met jouw stof</a>` : `<a class="btn main" href="${bookPath()}">Oefen voor je toets: kies uit je boek</a>`}<a class="btn" href="${to('toets')}">Maak een proeftoets</a></div>
  ${last ? `<p class="small muted">Laatste proeftoets: <a href="${to('toetsres')}">${last.score} van ${last.max} punten</a>.</p>` : ''}</div>${heroFig()}</section>
  <div class="domains">${DOMAINS.map(domain).join('')}</div>
  <div class="row small muted"><span>Je voortgang blijft in deze browser bewaard.</span>${started ? (state.confirmReset ? `<button class="btn quiet" type="button" data-act="reset2">Ja, wis alles</button><button class="btn quiet" type="button" data-act="reset0">Annuleren</button>` : `<button class="btn quiet" type="button" data-act="reset1">Voortgang wissen</button>`) : ''}</div>`;
}

export { vHome };
