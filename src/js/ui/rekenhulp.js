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
import { oefModus } from './oef-modus.js';
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
// zodat het niet voor een toets van het rekenen wordt aangezien. Volgende veld en Controleer staan onder beide tabbladen.
const INVOER = [
  ['7'], ['8'], ['9'], ['⌫', 'WIS', 'fn', 'Wis het laatste teken'],
  ['4'], ['5'], ['6'], ['±', 'TEKEN', 'op', 'Maak negatief, of weer positief'],
  ['1'], ['2'], ['3'], [',', ',', '', 'komma'],
  ['0'], ['/', '/', 'fn', 'breukstreep'], ['␣', ' ', 'fn', 'spatie, voor een gemengd getal'],
  ['Leeg', 'LEEG', 'fn', 'Maak het veld leeg'],
].map(([tekst, waarde, soort, naam]) => [tekst, `V:${waarde ?? tekst}`, soort, naam]); // prettier-ignore
// Het tabblad Toetsenbord bij een veld waarin je een hele berekening typt (#262): cijfers, rekentekens en haakjes.
const REKEN = [
  ['7'], ['8'], ['9'], ['+', '+', 'op', 'plus'], ['⌫', 'WIS', 'fn', 'Wis het laatste teken'],
  ['4'], ['5'], ['6'], ['−', '-', 'op', 'min'], ['(', '(', 'fn', 'haakje openen'],
  ['1'], ['2'], ['3'], ['·', '*', 'op', 'keer'], [')', ')', 'fn', 'haakje sluiten'],
  ['0'], [':', ':', 'op', 'gedeeld door'], ['Leeg', 'LEEG', 'fn rh-breed', 'Maak het veld leeg'],
].map(([tekst, waarde, soort, naam]) => [tekst, `V:${waarde ?? tekst}`, soort, naam]); // prettier-ignore
// Een berekening zoals een schermlezer hem voorleest: ·, : en de haakjes als woord, want haakjes leest een
// schermlezer meestal niet voor.
const uitspraak = (t) =>
  t
    .replace(/·/g, ' keer ')
    .replace(/:/g, ' gedeeld door ')
    .replace(/\(/g, ' haakje openen ')
    .replace(/\)/g, ' haakje sluiten ')
    .replace(/ +/g, ' ')
    .trim();

let paneel = null; // Het paneel, zodra het er is.
let melding = null; // Het gebied dat een schermlezer voorleest.
let rekenToetsen = null; // Of het tabblad Toetsenbord de toetsen voor een berekening heeft.

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
      <button class="rh-klap" type="button" data-k="KLAP" id="rh-klap" aria-expanded="true" aria-label="Klap de toetsen in"><svg class="icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M4 6.500 8 10.500l4-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <button class="rh-sluit" type="button" data-k="SLUIT" aria-label="Sluit de rekenhulp">✕</button>
    </div>
    <div class="rh-panelen">
      <div class="rh-pan" role="tabpanel" id="rh-pan-rekenen" aria-labelledby="rh-tab-rekenen">
        <div class="rh-rij">
          <button class="rh-dk rh-neem" type="button" data-k="NEEM" id="rh-neem"><span>Neem over</span><small id="rh-doel"></small></button>
          <div class="rh-scherm">
            <div class="rh-som" id="rh-som"></div>
            <div class="rh-uit" id="rh-uit"></div>
          </div>
        </div>
        <div class="rh-toetsen" id="rh-toetsen"></div>
      </div>
      <div class="rh-pan rh-invoer" role="tabpanel" id="rh-pan-toetsenbord" aria-labelledby="rh-tab-toetsenbord">
        <div class="rh-rij">
          <div class="rh-dk rh-dkvak"><span>Typ in</span><small id="rh-invnaam"></small></div>
          <div class="rh-scherm">
            <div class="rh-som" id="rh-invwaarde"></div>
          </div>
        </div>
        <div class="rh-invtoetsen" id="rh-invtoetsen"></div>
      </div>
    </div>
    <div class="rh-actie">
      <button class="rh-vol" type="button" data-k="V:VOLGENDE" aria-label="Naar het volgende veld">Volgende veld</button>
      <button class="rh-con" type="button" data-k="V:CONTROLEER">Controleer</button>
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
    if (i < 0) return;
    if (i !== h().doel) {
      h().doel = i;
      markeerDoel();
      teken();
    }
    // Op een telefoon is een tik in een veld de wens om te typen.
    if (h().open && matchMedia('(pointer: coarse)').matches) zetTab('toetsenbord');
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
  const doel = veld
    ? `${veldNaam(veld)}${lijst.length > 1 ? ` (${h().doel + 1}/${lijst.length})` : ''}`
    : '';
  paneel.querySelector('#rh-doel').textContent = doel;
  paneel.querySelector('#rh-invnaam').textContent = doel;
  paneel.querySelector('#rh-invwaarde').textContent = veld?.value || '';
  // Bij een veld voor een berekening krijgt het tabblad Toetsenbord rekentekens en haakjes.
  const reken = !!veld?.hasAttribute('data-berekening');
  if (reken !== rekenToetsen) {
    rekenToetsen = reken;
    const vak = paneel.querySelector('#rh-invtoetsen');
    vak.innerHTML = (reken ? REKEN : INVOER).map(toets).join('');
    vak.classList.toggle('rh-reken', reken);
  }
  // Volgende heeft alleen zin als er nog een ander veld is. Controleer volgt de knop van de vraag.
  paneel.querySelector('[data-k="V:VOLGENDE"]').disabled = lijst.length < 2;
  const ok = document.querySelector('#pform button[type="submit"]');
  const controleer = paneel.querySelector('[data-k="V:CONTROLEER"]');
  controleer.disabled = !ok;
  controleer.textContent = ok?.textContent.trim() || 'Controleer';
  controleer.setAttribute('aria-label', controleer.textContent);
}
function markeerDoel() {
  velden().forEach((el, i) => el.classList.toggle('rh-doelveld', h().open && i === h().doel));
}

// Een toets of een van de knoppen.
function druk(k) {
  if (k === 'SLUIT') return zet(false, true);
  if (k === 'NEEM') return neemOver();
  if (k === 'KLAP') return klap(!h().klap);
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
// keer in een getal, en een spatie alleen na een cijfer, voor een gemengd getal (1 1/2) of duizendtallen (1 250 000).
function typ(k) {
  // Dezelfde knop als in de vraag: Controleer, of na het nakijken Volgende vraag. De knop zelf klikken werkt ook op
  // een oude telefoon, anders dan requestSubmit.
  if (k === 'CONTROLEER') return document.querySelector('#pform button[type="submit"]')?.click();
  const lijst = velden();
  const veld = lijst[h().doel];
  if (!veld) return;
  if (k === 'VOLGENDE') {
    if (lijst.length < 2) return;
    h().doel = (h().doel + 1) % lijst.length;
    markeerDoel();
    teken();
    return zeg(`${veldNaam(lijst[h().doel])}${veldNodig(lijst[h().doel])}`);
  }
  let t = veld.value;
  const deel = t.split(' ').pop();
  if (veld.hasAttribute('data-berekening')) t = rekenTyp(t, k);
  else if (k === 'WIS') t = t.slice(0, -1);
  else if (k === 'LEEG') t = '';
  else if (k === 'TEKEN') t = /^[−-]/.test(t) ? t.replace(/^[−-]/, '') : `−${t}`;
  else if (k === ',' && (/[,/]/.test(deel) || t.endsWith(' '))) return;
  else if (k === '/' && (!/\d$/.test(deel) || /[,/]/.test(deel))) return;
  else if (k === ' ' && !(/\d$/.test(t) && !/[,/]/.test(t))) return;
  else t += k;
  veld.value = t;
  veld.dispatchEvent(new Event('input', { bubbles: true }));
  teken();
  zeg(uitspraak(t) || 'leeg');
}
// Een toets in een veld voor een berekening. Een rekenteken krijgt een spatie ervoor en erna. Een min na een getal of
// een haakje sluiten is een aftrekmin, en anders een negatieve min, die vast aan het getal erachter staat.
function rekenTyp(t, k) {
  const kaal = t.trimEnd();
  if (k === 'WIS') return kaal.slice(0, -1).trimEnd();
  if (k === 'LEEG') return '';
  if (k === '-' && !/[\d)]$/.test(kaal)) return `${t}−`;
  const teken = { '+': '+', '-': '−', '*': '·', ':': ':' }[k];
  return teken ? `${kaal} ${teken} ` : t + k;
}
const veldNodig = (el) => (el.value ? ` ${el.value}` : ' leeg');

// Klapt de toetsen in of uit. Ingeklapt blijven alleen de tabbladen en de knoppen Volgende veld en Controleer over,
// zodat de vraag meer ruimte krijgt. Alleen op een telefoon is er een knop voor.
function klap(in_, stil = false) {
  h().klap = in_;
  paneel.classList.toggle('rh-ingeklapt', in_);
  const knop = paneel.querySelector('#rh-klap');
  knop.setAttribute('aria-expanded', String(!in_));
  knop.setAttribute('aria-label', in_ ? 'Klap de toetsen uit' : 'Klap de toetsen in');
  if (!stil) zeg(in_ ? 'Toetsen ingeklapt.' : 'Toetsen uitgeklapt.');
}

// Wisselt tussen Rekenen en Toetsenbord. Beide staan in dezelfde plek, dus het paneel blijft even hoog.
function zetTab(tab) {
  h().tab = tab;
  // Een tabblad kiezen klapt de toetsen uit.
  if (h().klap) klap(false, true);
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
    // Alleen de Rekenhulp sluit. Een Melden-paneel dat er ook open staat, blijft open. Op een telefoon is er geen knop
    // om hem weer te openen, dus daar klapt hij in.
    e.stopPropagation();
    return oefModus() ? klap(!h().klap) : zet(false, true);
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
  if (h().tab === 'toetsenbord' && rekenToetsen) {
    const t = {
      x: '*',
      '×': '*',
      '·': '*',
      '/': ':',
      '÷': ':',
      '−': '-',
      Backspace: 'WIS',
      Enter: 'CONTROLEER',
    };
    const r = t[e.key] ?? e.key;
    if (/^[0-9+\-*:()]$/.test(r) || r === 'WIS' || r === 'CONTROLEER') {
      e.preventDefault();
      typ(r);
    }
    return;
  }
  if (h().tab === 'toetsenbord') {
    const t = {
      '-': 'TEKEN',
      '−': 'TEKEN',
      '.': ',',
      ',': ',',
      '/': '/',
      Backspace: 'WIS',
      Enter: 'CONTROLEER',
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
    // In het volledig-schermmodus staat de vaste kop bovenaan: wat daaronder komt telt als boven.
    const kop = oefModus()
      ? (document.querySelector('.oef-kop')?.getBoundingClientRect().bottom ?? 0)
      : 0;
    const vrij = window.innerHeight - hoogte - 8;
    const boven = vraag.getBoundingClientRect().top;
    const onder = lijst[lijst.length - 1].getBoundingClientRect().bottom;
    const veld = (lijst[h().doel] || lijst[0]).getBoundingClientRect();
    let dy = 0;
    if (onder - boven <= vrij - kop) {
      // De vraag en alle velden passen tussen de kop en het paneel.
      if (opnieuw || onder > vrij || boven < kop) dy = boven - 8 - kop;
    } else if (veld.bottom > vrij) dy = veld.bottom - vrij + 12;
    else if (veld.top < kop) dy = veld.top - 8 - kop;
    if (Math.abs(dy) > 1) window.scrollBy({ top: dy, behavior: rustig() ? 'auto' : 'smooth' });
  });
}

// Opent of sluit het paneel. Sluit de leerling het zelf, dan gaat de focus terug naar de knop en zegt een schermlezer
// dat het dicht is. Gaat het dicht omdat het scherm verandert, dan blijft dat stil.
function zet(open, focusTerug = false, stil = false) {
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
  // Een paneel dat vanzelf opent, in het volledig-schermmodus, laat de focus waar die is.
  if (!stil) paneel.querySelector('#rh-titel').focus();
  zetRuimte(true);
}

// Na elke render(): hoort het paneel nog bij een vraag, en is het dezelfde vraag? Bij een andere vraag begint de som
// opnieuw, en gaat de volgende uitkomst naar het eerste veld.
function synchroniseer() {
  // Op een telefoon maakt de eerste vraag met een Rekenhulp het paneel, zonder dat de leerling een knop gebruikt.
  if (!paneel && oefModus() && document.querySelector('#pform[data-rek]')) maak();
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
  // Op een telefoon staat de Rekenhulp er altijd, voor een vraag die er een heeft.
  if (!h().open && oefModus()) zet(true, false, true);
  if (!h().open) return;
  // Bij een tekenvraag begint het paneel ingeklapt, zodat het rooster in beeld blijft. Wisselt de leerling van een
  // tekenvraag naar een andere, of andersom, dan volgt het paneel dat. Daarbinnen houdt het de keuze van de leerling.
  // Alleen op een telefoon: alleen daar is er een knop om weer uit te klappen.
  if (!oefModus() && h().klap) klap(false, true);
  const tekenen = oefModus() && form.hasAttribute('data-rek-klap');
  if (tekenen !== h().tekenen) {
    h().tekenen = tekenen;
    klap(tekenen, true);
  }
  if (nieuw || h().niveau !== form.dataset.rek) bouwToetsen();
  zetInvoer(true);
  markeerDoel();
  teken();
  if (nieuw) zetRuimte(true);
}

export { zet, synchroniseer };
