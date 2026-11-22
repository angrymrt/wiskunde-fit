// De Rekenhulp (#18): een paneel onderaan het oefenscherm om iets uit te rekenen en de uitkomst over te nemen in het
// veld waar je mee bezig bent. Het laadt pas bij de eerste klik op de knop (main.js), zodat het eerste bezoek niet
// zwaarder wordt. Het rekenen zelf staat in rekenen.js; hier staat alleen wat met het scherm te maken heeft.
//
// Het paneel staat buiten #app, want render() vervangt #app bij elke nieuwe vraag en het paneel moet blijven staan.
// main.js roept `synchroniseer()` aan na elke render(). Wat de leerling intikt staat in state.rekenhulp.
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

let paneel = null; // Het paneel, zodra het er is.
let melding = null; // Het gebied dat een schermlezer voorleest.

const toets = ([tekst, waarde, soort, naam]) =>
  `<button class="rh-toets${soort ? ` ${soort}` : ''}" type="button" data-k="${waarde ?? tekst}"${naam ? ` aria-label="${naam}"` : ''}>${tekst}</button>`;

// De velden van de vraag waar de uitkomst in kan: de tekstvelden, in de volgorde van het scherm.
const velden = () => [...document.querySelectorAll('#pform .fld input[type="text"]')];
const veldNaam = (el) =>
  (el.getAttribute('aria-label') || el.closest('label')?.textContent || '').trim();

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
      <h2 class="rh-titel" id="rh-titel" tabindex="-1">Rekenhulp</h2>
      <span class="rh-doel" id="rh-doel"></span>
      <button class="rh-sluit" type="button" data-k="SLUIT" aria-label="Sluit de rekenhulp">✕</button>
    </div>
    <div class="rh-scherm">
      <div class="rh-som" id="rh-som"></div>
      <div class="rh-uit" id="rh-uit"></div>
    </div>
    <div class="rh-acties"><button class="rh-neem" type="button" data-k="NEEM" id="rh-neem">Neem over</button></div>
    <div class="rh-toetsen" id="rh-toetsen"></div>
    <p class="sr" id="rh-melding" role="status"></p>`;
  document.body.append(paneel);
  melding = paneel.querySelector('#rh-melding');
  paneel.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-k]');
    if (b) druk(b.dataset.k);
  });
  paneel.addEventListener('keydown', toetsenbord);
  // Het veld waar de leerling in klikt, is het veld voor de volgende uitkomst.
  document.addEventListener('focusin', (e) => {
    const i = velden().indexOf(e.target);
    if (i >= 0 && i !== h().doel) {
      h().doel = i;
      markeerDoel();
      teken();
    }
  });
  // Verandert de hoogte, bijvoorbeeld door een ander niveau, dan krijgt de pagina meer of minder ruimte.
  if (window.ResizeObserver) new ResizeObserver(() => h().open && zetRuimte()).observe(paneel);
}

function bouwToetsen() {
  h().niveau = document.getElementById('pform')?.dataset.rek || 'uitgebreid';
  paneel.querySelector('#rh-toetsen').innerHTML =
    `${h().niveau === 'uitgebreid' ? EXTRA.map(toets).join('') : ''}${BASIS.map(toets).join('')}`;
  paneel.classList.toggle('rh-uitgebreid', h().niveau === 'uitgebreid');
}

// Wat er op het scherm van de rekenhulp staat: de som, en de uitkomst of een melding.
function teken() {
  const r = uitkomst(h().som, h().ans);
  paneel.querySelector('#rh-som').textContent = h().som || '0';
  const uit = paneel.querySelector('#rh-uit');
  uit.textContent = r ? (r.fout ?? `= ${r.tekst}`) : '';
  uit.classList.toggle('fout', !!r?.fout);
  paneel.querySelector('#rh-neem').disabled = !r?.tekst;
  const veld = velden()[h().doel];
  const n = velden().length;
  paneel.querySelector('#rh-doel').innerHTML = veld
    ? `→ ${veldNaam(veld)}${n > 1 ? ` (${h().doel + 1}/${n})` : ''} <b>${veld.value || 'leeg'}</b>`
    : '';
}
function markeerDoel() {
  velden().forEach((el, i) => el.classList.toggle('rh-doelveld', h().open && i === h().doel));
}

// Een toets of een van de knoppen.
function druk(k) {
  if (k === 'SLUIT') return zet(false, true);
  if (k === 'NEEM') return neemOver();
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
    } else if (r?.fout) zeg(r.fout);
  } else {
    // Na een uitkomst begint een getal een nieuwe som, en een teken gaat verder met de uitkomst.
    if (h().vers && !['+', '−', '×', '÷', '^', '^2'].includes(k)) h().som = '';
    h().vers = false;
    h().som += k;
  }
  teken();
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
  if (e.key === 'Escape') return zet(false, true);
  if (e.ctrlKey || e.metaKey || e.altKey) return;
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
function zetRuimte(opnieuw = false) {
  const hoogte = paneel.offsetHeight;
  document.documentElement.style.setProperty('--rh-h', `${hoogte}px`);
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
    markeerDoel();
    if (focusTerug) {
      document.querySelector('[data-act="rekenhulp"]')?.focus();
      zeg('Rekenhulp dicht.');
    }
    return;
  }
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
    h().doel = 0;
  }
  if (!h().open) return;
  if (nieuw || h().niveau !== form.dataset.rek) bouwToetsen();
  markeerDoel();
  teken();
  if (nieuw) zetRuimte(true);
}

export { zet, synchroniseer };
