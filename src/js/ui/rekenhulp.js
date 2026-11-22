// De Rekenhulp (#18): een paneel onderaan het oefenscherm om iets uit te rekenen en de uitkomst over te nemen in het
// veld waar je mee bezig bent. Het laadt pas bij de eerste klik op de knop (main.js), zodat het eerste bezoek niet
// zwaarder wordt. Het rekenen zelf staat in rekenen.js; hier staat alleen wat met het scherm te maken heeft.
//
// Het paneel staat buiten #app, want render() vervangt #app bij elke nieuwe vraag en het paneel moet blijven staan.
// main.js roept `synchroniseer()` aan na elke render(). Wat de leerling intikt staat in state.rekenhulp.
//
// Twee tabbladen: Rekenen, en Toetsenbord om een antwoord rechtstreeks in het veld te typen. Zolang de Rekenhulp open
// staat, krijgen de velden `inputmode="none"`: het toetsenbord van het systeem zou anders over het paneel komen. Een
// tik in een veld brengt een telefoon naar het tabblad Toetsenbord. Een fysiek toetsenbord werkt gewoon door.
//
// Bewust niet: afronden of een breuk maken. De leerling rondt zelf af en maakt zelf een breuk.
import { uitkomst } from '../rekenen.js';
import { state } from './state.js';

const h = () => state.rekenhulp;

// Vijf kolommen, vier rijen. Bij de uitgebreide Rekenhulp komt er een rij met extra functies bovenaan. [tekst, waarde,
// soort, naam voor een schermlezer]
const BASIS = [
  ['7'], ['8'], ['9'], ['÷', '÷', 'op', 'gedeeld door'], ['⌫', 'WIS', 'fn', 'Wis het laatste teken'],
  ['4'], ['5'], ['6'], ['×', '×', 'op', 'keer'], ['(', '(', 'fn', 'haakje openen'],
  ['1'], ['2'], ['3'], ['−', '−', 'op', 'min'], [')', ')', 'fn', 'haakje sluiten'],
  ['0'], [',', ',', '', 'komma'], ['C', 'C', 'fn', 'Wis alles'], ['+', '+', 'op', 'plus'], ['=', '=', 'go', 'is gelijk aan'],
]; // prettier-ignore
const EXTRA = [
  ['x²', '^2', 'fn', 'kwadraat'], ['√', '√', 'fn', 'wortel'], ['xʸ', '^', 'fn', 'macht'], ['π', 'π', 'fn', 'pi'],
  ['ANS', 'ANS', 'fn', 'vorige uitkomst'],
]; // prettier-ignore

// Het tabblad Toetsenbord: cijfers, komma, min, breukstreep en spatie (voor een gemengd getal). De waarde begint met V:
// zodat het niet voor een toets van het rekenen wordt aangezien.
const INVOER = [
  ['7'], ['8'], ['9'], ['⌫', 'WIS', 'fn', 'Wis het laatste teken'],
  ['4'], ['5'], ['6'], ['±', 'TEKEN', 'op', 'Maak negatief, of weer positief'],
  ['1'], ['2'], ['3'], [',', ',', '', 'komma'],
  ['0'], ['/', '/', 'fn', 'breukstreep'], ['␣', ' ', 'fn', 'spatie, voor een gemengd getal'],
  ['Volgende', 'VOLGENDE', 'go', 'Naar het volgende veld'],
].map(([tekst, waarde, soort, naam]) => [tekst, `V:${waarde ?? tekst}`, soort, naam]); // prettier-ignore

let paneel = null; // Het paneel, zodra het er is.
let melding = null; // Het gebied dat een schermlezer voorleest.

const toets = ([tekst, waarde, soort, naam]) =>
  `<button class="rh-toets${soort ? ` ${soort}` : ''}" type="button" data-k="${waarde ?? tekst}"${naam ? ` aria-label="${naam}"` : ''}>${tekst}</button>`;

// De velden van de vraag waar de uitkomst in kan: de tekstvelden, in de volgorde van het scherm.
// Een vergrendeld veld, na Toon uitwerking, telt niet mee.
const velden = () => [
  ...document.querySelectorAll('#pform .fld input[type="text"]:not(:disabled)'),
];
// De naam van een veld: de label voor een schermlezer, anders de tekst ervoor (zonder de eenheid erachter).
function veldNaam(el) {
  const pre = [...(el.closest('label')?.children ?? [])].find(
    (c) => c.tagName === 'SPAN' && !c.classList.contains('fin'),
  );
  return (el.getAttribute('aria-label') || pre?.textContent || '').trim();
}

function zeg(tekst) {
  // Eerst leeg, zodat dezelfde tekst twee keer achter elkaar ook twee keer wordt voorgelezen.
  melding.textContent = '';
  setTimeout(() => (melding.textContent = tekst), 30);
}

function maak() {
  paneel = document.createElement('section');
  paneel.id = 'rekenhulp';
  paneel.className = 'rh';
  paneel.setAttribute('aria-label', 'Rekenhulp');
  paneel.hidden = true;
  paneel.innerHTML = `<div class="rh-kop">
      <h2 class="sr" id="rh-titel" tabindex="-1">Rekenhulp</h2>
      <div class="rh-tabs" role="tablist" aria-label="Onderdeel van de rekenhulp">
        <button class="rh-tab" role="tab" id="rh-tab-rekenen" aria-controls="rh-pan-rekenen" data-k="TAB:rekenen">Rekenen</button>
        <button class="rh-tab" role="tab" id="rh-tab-toetsenbord" aria-controls="rh-pan-toetsenbord" data-k="TAB:toetsenbord">Toetsenbord</button>
      </div>
      <button class="rh-sluit" type="button" data-k="SLUIT" aria-label="Sluit de rekenhulp">✕</button>
    </div>
    <div class="rh-panelen">
      <div class="rh-pan" role="tabpanel" id="rh-pan-rekenen" aria-labelledby="rh-tab-rekenen">
        <div class="rh-scherm">
          <div class="rh-som" id="rh-som"></div>
          <div class="rh-uit" id="rh-uit"></div>
        </div>
        <div class="rh-acties">
          <button class="rh-neem" type="button" data-k="NEEM" id="rh-neem">Neem over</button>
          <span class="rh-doel" id="rh-doel"></span>
        </div>
        <div class="rh-toetsen" id="rh-toetsen"></div>
      </div>
      <div class="rh-pan rh-invoer" role="tabpanel" id="rh-pan-toetsenbord" aria-labelledby="rh-tab-toetsenbord">
        <div class="rh-scherm">
          <div class="rh-invnaam" id="rh-invnaam"></div>
          <div class="rh-som" id="rh-invwaarde"></div>
        </div>
        <div class="rh-invtoetsen">${INVOER.map(toets).join('')}</div>
      </div>
    </div>`;
  document.body.append(paneel);
  // Buiten het paneel, want een gebied in een verborgen paneel wordt niet voorgelezen, ook niet "Rekenhulp dicht."
  melding = document.createElement('p');
  melding.className = 'sr';
  melding.setAttribute('role', 'status');
  document.body.append(melding);
  paneel.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]');
    if (b) druk(b.dataset.k);
  });
  paneel.addEventListener('keydown', toetsenbord);
  // Het veld waar de leerling in klikt, is het veld voor de volgende uitkomst.
  document.addEventListener('focusin', (e) => {
    const i = velden().indexOf(e.target);
    if (i < 0 || !h().open) return;
    if (i !== h().doel) {
      h().doel = i;
      markeerDoel();
      teken();
    }
    // Op een telefoon is een tik in een veld de wens om te typen.
    if (matchMedia('(pointer: coarse)').matches) zetTab('toetsenbord');
  });
  // Typt de leerling zelf in het veld, dan staat dat ook in de kop van het paneel.
  document.addEventListener('input', (e) => {
    if (velden().includes(e.target)) teken();
  });
  // Verandert de hoogte, bijvoorbeeld door een ander niveau, dan krijgt de pagina meer of minder ruimte.
  if (window.ResizeObserver) new ResizeObserver(() => h().open && zetRuimte()).observe(paneel);
}

function bouwToetsen() {
  h().niveau = document.getElementById('pform')?.dataset.rek === 'simpel' ? 'simpel' : 'uitgebreid';
  paneel.querySelector('#rh-toetsen').innerHTML =
    `${h().niveau === 'uitgebreid' ? EXTRA.map(toets).join('') : ''}${BASIS.map(toets).join('')}`;
  paneel.classList.toggle('rh-uitgebreid', h().niveau === 'uitgebreid');
}

// Wat er op het scherm van de rekenhulp staat: de som, en de uitkomst of een melding.
function teken() {
  const r = uitkomst(h().som, h().ans);
  paneel.querySelector('#rh-som').textContent = h().som || '0';
  const uit = paneel.querySelector('#rh-uit');
  // Een som die nog niet af is, zoals 5+, is geen fout. Een melding komt pas als de leerling = drukt.
  uit.textContent = r?.tekst ? `= ${r.tekst}` : (h().fout ?? '');
  uit.classList.toggle('fout', !r?.tekst && !!h().fout);
  const lijst = velden();
  paneel.querySelector('#rh-neem').disabled = !r?.tekst || !lijst.length;
  // Wat de leerling typte komt als tekst in het paneel, nooit als HTML.
  const veld = lijst[h().doel];
  paneel.querySelector('#rh-invnaam').textContent = veld
    ? `${veldNaam(veld)}${lijst.length > 1 ? ` (${h().doel + 1}/${lijst.length})` : ''}`
    : '';
  paneel.querySelector('#rh-invwaarde').textContent = veld?.value || '';
  const doel = paneel.querySelector('#rh-doel');
  doel.textContent = '';
  if (veld) {
    const waarde = document.createElement('b');
    waarde.textContent = veld.value || 'leeg';
    doel.append(
      `→ ${veldNaam(veld)}${lijst.length > 1 ? ` (${h().doel + 1}/${lijst.length})` : ''} `,
      waarde,
    );
  }
}
function markeerDoel() {
  velden().forEach((el, i) => el.classList.toggle('rh-doelveld', h().open && i === h().doel));
}

// Een toets of een van de knoppen.
function druk(k) {
  if (k === 'SLUIT') return zet(false, true);
  if (k === 'NEEM') return neemOver();
  if (k.startsWith('TAB:')) return zetTab(k.slice(4));
  if (k.startsWith('V:')) return typ(k.slice(2));
  // De melding van een eerdere = verdwijnt bij de volgende toets.
  h().fout = null;
  if (k === 'C') {
    h().som = '';
    h().vers = false;
    zeg('Gewist.');
  } else if (k === 'WIS') {
    h().som = h().som.replace(/ANS$|.$/u, '');
    h().vers = false;
  } else if (k === '=') {
    const r = uitkomst(h().som, h().ans);
    if (r?.tekst) {
      h().ans = r.v;
      h().som = r.tekst;
      h().vers = true;
      zeg(`Uitkomst ${r.tekst}`);
    } else if (r?.fout) {
      h().fout = r.fout;
      zeg(r.fout);
    }
  } else {
    // Na een uitkomst begint een getal een nieuwe som, en een teken gaat verder met de uitkomst.
    if (h().vers && !['+', '−', '×', '÷', '^', '^2'].includes(k)) h().som = '';
    h().vers = false;
    h().som += k;
  }
  teken();
}

// Typt een toets van het tabblad Toetsenbord in het gekozen veld, achteraan. Een komma of breukstreep komt niet twee
// keer in een getal, en een spatie alleen voor een gemengd getal, zoals 1 1/2.
function typ(k) {
  const lijst = velden();
  const veld = lijst[h().doel];
  if (!veld) return;
  if (k === 'VOLGENDE') {
    h().doel = (h().doel + 1) % lijst.length;
    markeerDoel();
    teken();
    return zeg(`${veldNaam(lijst[h().doel])}${veldNodig(lijst[h().doel])}`);
  }
  let t = veld.value;
  const deel = t.split(' ').pop();
  if (k === 'WIS') t = t.slice(0, -1);
  else if (k === 'TEKEN') t = /^[−-]/.test(t) ? t.replace(/^[−-]/, '') : `−${t}`;
  else if (k === ',' && /[,/]/.test(deel)) return;
  else if (k === '/' && (!/\d$/.test(deel) || /[,/]/.test(deel))) return;
  else if (k === ' ' && !(/\d$/.test(t) && !/[ /,]/.test(t.replace(/^[−-]/, '')))) return;
  else t += k;
  veld.value = t;
  veld.dispatchEvent(new Event('input', { bubbles: true }));
  teken();
  zeg(t || 'leeg');
}
const veldNodig = (el) => (el.value ? ` ${el.value}` : ' leeg');

// Wisselt tussen Rekenen en Toetsenbord. Beide staan in dezelfde plek, dus het paneel blijft even hoog.
function zetTab(tab) {
  h().tab = tab;
  for (const t of ['rekenen', 'toetsenbord']) {
    const aan = t === tab;
    const knop = paneel.querySelector(`#rh-tab-${t}`);
    knop.setAttribute('aria-selected', String(aan));
    knop.tabIndex = aan ? 0 : -1;
    paneel.querySelector(`#rh-pan-${t}`).classList.toggle('weg', !aan);
  }
  teken();
}

// Zolang de Rekenhulp open staat, opent een tik in een veld geen toetsenbord van het systeem. Daarna krijgt het veld zijn
// oude waarde terug.
function zetInvoer(open) {
  for (const el of velden()) {
    el.dataset.im ??= el.getAttribute('inputmode') ?? 'text';
    el.setAttribute('inputmode', open ? 'none' : el.dataset.im);
  }
}

// Zet de uitkomst met alle cijfers in het veld, en gaat naar het volgende lege veld.
function neemOver() {
  const r = uitkomst(h().som, h().ans);
  const lijst = velden();
  const veld = lijst[h().doel];
  if (!r?.tekst || !veld) return;
  veld.value = r.tekst;
  veld.dispatchEvent(new Event('input', { bubbles: true }));
  let tekst = `${veldNaam(veld)} ${r.tekst} ingevuld.`;
  const volgende = lijst.findIndex((el, i) => i !== h().doel && !el.value.trim());
  if (volgende >= 0) {
    h().doel = volgende;
    tekst += ` Nu ${veldNaam(lijst[volgende])}.`;
  }
  markeerDoel();
  teken();
  zeg(tekst);
}

// Het gewone toetsenbord, als de focus in de rekenhulp staat.
function toetsenbord(e) {
  if (e.key === 'Escape') {
    // Alleen de Rekenhulp sluit. Een Melden-paneel dat er ook open staat, blijft open.
    e.stopPropagation();
    return zet(false, true);
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // De tabbladen: met de pijltjes naar het andere tabblad.
  if (
    e.target.getAttribute('role') === 'tab' &&
    (e.key === 'ArrowLeft' || e.key === 'ArrowRight')
  ) {
    e.preventDefault();
    zetTab(h().tab === 'rekenen' ? 'toetsenbord' : 'rekenen');
    paneel.querySelector(`#rh-tab-${h().tab}`).focus();
    return;
  }
  // Een knop doet zelf iets met Enter en spatie.
  if (e.target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return;
  const kaart = {
    '*': '×',
    '/': '÷',
    '-': '−',
    '.': ',',
    Enter: '=',
    Backspace: 'WIS',
    Delete: 'C',
  };
  const k = kaart[e.key] ?? e.key;
  // Op het tabblad Toetsenbord typen de toetsen in het veld.
  if (h().tab === 'toetsenbord') {
    const t = {
      '-': 'TEKEN',
      '−': 'TEKEN',
      '.': ',',
      ',': ',',
      '/': '/',
      Backspace: 'WIS',
      Enter: 'VOLGENDE',
    }[e.key];
    if (/^[0-9]$/.test(e.key) || t) {
      e.preventDefault();
      typ(t ?? e.key);
    }
    return;
  }
  if (/^[0-9+×÷−(),^=]$/.test(k) || k === 'WIS' || k === 'C') {
    e.preventDefault();
    druk(k);
  } else if (e.key === 'p') {
    e.preventDefault();
    druk('π');
  }
}

// Op een telefoon komt het paneel over de vraag. Daarom krijgt de pagina onderaan net zoveel ruimte als het paneel
// hoog is, en schuift ze zo dat de vraag en de velden erboven blijven staan.
const rustig = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Op een telefoon in landschap is er te weinig hoogte voor een paneel onderaan. Dan staat het rechts, over de volle
// hoogte, en maakt de pagina ruimte aan de zijkant.
const zijkant = () => matchMedia('(max-height: 520px) and (orientation: landscape)').matches;
function zetRuimte(opnieuw = false) {
  const kant = zijkant();
  const hoogte = kant ? 0 : paneel.offsetHeight;
  const root = document.documentElement.style;
  root.setProperty('--rh-h', `${hoogte}px`);
  root.setProperty('--rh-w', `${kant ? paneel.offsetWidth : 0}px`);
  requestAnimationFrame(() => {
    const lijst = velden();
    const vraag = document.getElementById('pq');
    if (!lijst.length || !vraag) return;
    const vrij = window.innerHeight - hoogte - 8;
    const boven = vraag.getBoundingClientRect().top;
    const onder = lijst[lijst.length - 1].getBoundingClientRect().bottom;
    const veld = (lijst[h().doel] || lijst[0]).getBoundingClientRect();
    let dy = 0;
    if (onder - boven <= vrij) {
      // De vraag en alle velden passen boven het paneel.
      if (opnieuw || onder > vrij || boven < 0) dy = boven - 8;
    } else if (veld.bottom > vrij) dy = veld.bottom - vrij + 12;
    else if (veld.top < 0) dy = veld.top - 8;
    if (Math.abs(dy) > 1) window.scrollBy({ top: dy, behavior: rustig() ? 'auto' : 'smooth' });
  });
}

// Opent of sluit het paneel. Sluit de leerling het zelf, dan gaat de focus terug naar de knop en zegt een schermlezer
// dat het dicht is. Gaat het dicht omdat het scherm verandert, dan blijft dat stil.
function zet(open, focusTerug = false) {
  if (!paneel) maak();
  h().open = open;
  paneel.hidden = !open;
  document.documentElement.classList.toggle('rh-open', open);
  document
    .querySelectorAll('[data-act="rekenhulp"]')
    .forEach((b) => b.setAttribute('aria-expanded', String(open)));
  if (!open) {
    document.documentElement.style.removeProperty('--rh-h');
    document.documentElement.style.removeProperty('--rh-w');
    zetInvoer(false);
    markeerDoel();
    if (focusTerug) {
      document.querySelector('[data-act="rekenhulp"]')?.focus();
      zeg('Rekenhulp dicht.');
    }
    return;
  }
  zetTab(h().tab);
  synchroniseer();
  paneel.querySelector('#rh-titel').focus();
  zetRuimte(true);
}

// Na elke render(): hoort het paneel nog bij een vraag, en is het dezelfde vraag? Bij een andere vraag begint de som
// opnieuw, en gaat de volgende uitkomst naar het eerste veld.
function synchroniseer() {
  if (!paneel) return;
  const form = document.getElementById('pform');
  if (!form?.dataset.vraag) {
    // Een scherm zonder vraag met de Rekenhulp: het paneel gaat dicht.
    if (h().open) zet(false);
    h().vraag = null;
    return;
  }
  const nieuw = h().vraag !== form.dataset.vraag;
  if (nieuw) {
    h().vraag = form.dataset.vraag;
    h().som = '';
    h().vers = false;
    h().fout = null;
    h().doel = 0;
  }
  if (!h().open) return;
  if (nieuw || h().niveau !== form.dataset.rek) bouwToetsen();
  zetInvoer(true);
  markeerDoel();
  teken();
  if (nieuw) zetRuimte(true);
}

export { zet, synchroniseer };
