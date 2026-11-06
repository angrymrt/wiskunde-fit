// Het overzichtsscherm met alle paragrafen.
import { SECTIONS } from '../paragraphs/index.js';
import { prog, secPct, inScope } from '../progress.js';
import { T } from '../typeset.js';
import { topbar } from './layout.js';
import { state } from './state.js';

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
function nextSec() {
  const scope = prog.scope || 'all';
  return SECTIONS.filter((s) => inScope(s, scope)).sort((a, b) => secPct(a) - secPct(b))[0];
}
function vHome() {
  const n = nextSec(),
    last = prog.tests[prog.tests.length - 1];
  const started = Object.keys(prog.skills).length > 0;
  const secRow = (s) => {
    const p = Math.round(secPct(s) * 100),
      done = p >= 80;
    return `<button class="par" type="button" data-act="sec" data-id="${s.id}"><b>${s.num}</b><span>${T(s.title)}</span><span class="pct">${done ? '<span class="pill good">Beheerst</span>' : p ? p + '%' : ''}</span><span class="bar ${done ? 'done' : ''}"><i style="width:${p}%"></i></span></button>`;
  };
  const chapter = (c, title) =>
    `<section class="ch c${c}"><div class="chh">Hoofdstuk ${c}<small>${title}</small></div>${SECTIONS.filter(
      (s) => s.ch === c,
    )
      .map(secRow)
      .join('')}</section>`;
  return `${topbar()}
  <section class="hero"><div class="hero-txt"><h1>Klaar voor je wiskundetoets</h1><p class="lead">Lees per paragraaf de uitleg en oefen met vragen die steeds nieuwe getallen krijgen. Kom je er niet uit, dan zie je de uitwerking stap voor stap.</p>
  <div class="row"><button class="btn main" type="button" data-act="sec" data-id="${n.id}">${started ? 'Oefen' : 'Begin met'} ${n.num === 'V' ? 'Pythagoras' : n.num}</button><button class="btn" type="button" data-act="toets">Maak een proeftoets</button></div>
  ${last ? `<p class="small muted">Laatste proeftoets: ${last.score} van ${last.max} punten.</p>` : ''}</div>${heroFig()}</section>
  <div class="chs">${chapter(1, 'Lineaire problemen')}${chapter(2, 'Gelijkvormigheid')}</div>
  <div class="row small muted"><span>Oefenstof voor havo 3 die aansluit op Getal &amp; Ruimte editie 13, FLEX-boek deel 1. Dit is een eigen project zonder band met Noordhoff of Getal &amp; Ruimte. Je voortgang blijft in deze browser bewaard.</span>${started ? (state.confirmReset ? `<button class="btn quiet" type="button" data-act="reset2">Ja, wis alles</button><button class="btn quiet" type="button" data-act="reset0">Annuleren</button>` : `<button class="btn quiet" type="button" data-act="reset1">Voortgang wissen</button>`) : ''}</div>`;
}

export { vHome };
