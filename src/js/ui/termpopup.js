// De knop en de popup bij een term (#39). Wordt pas geladen als een scherm termen bevat, zodat de
// woordenlijst niet bij het eerste bezoek meekomt. DOM-code: alleen main.js roept dit aan.
// Importeert niets uit de rest van de site, anders komt er een gedeeld bestand bij het eerste bezoek.
import { WOORDEN } from '../woorden.js';

// Maakt van elke <span class="term"> een knop. Een id (de plek waar de term wordt uitgelegd) blijft.
// Verandert de breedte van het venster, dan staat de popup niet meer goed. Alleen de hoogte (de
// werkbalk van een telefoon) maakt niet uit.
let luistert = false;
function mount(root) {
  if (!luistert)
    window.addEventListener('resize', () => open?.breed !== innerWidth && sluit(false));
  luistert = true;
  lijst(root);
  for (const sp of root.querySelectorAll('span.term')) {
    const id = sp.dataset.term;
    if (!WOORDEN[id]) continue;
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'term';
    knop.dataset.term = id;
    knop.setAttribute('aria-expanded', 'false');
    if (sp.id) knop.id = sp.id;
    knop.textContent = sp.textContent;
    sp.replaceWith(knop);
  }
  // Linkt het adres met een # naar een term, dan krijgt die knop de focus, tenzij de leerling al
  // ergens anders is.
  const naar = document.getElementById(location.hash.slice(1));
  if (naar?.matches('button.term') && /^(BODY|H1)$/.test(document.activeElement.tagName))
    naar.focus();
}

// Onder de uitleg van een onderwerp staan de termen die erin voorkomen, uit de woordenlijst. Zo hoeft
// niemand een uitleg twee keer te schrijven. Bij elke render komt de lijst opnieuw.
function lijst(root) {
  const body = root.querySelector('.topic-body');
  if (!body || body.querySelector('.termen')) return;
  const ids = [
    ...new Set([...body.querySelectorAll('span.term')].map((x) => x.dataset.term)),
  ].filter((id) => WOORDEN[id]);
  if (!ids.length) return;
  const blok = document.createElement('div'),
    kop = document.createElement('h2'),
    dl = document.createElement('dl');
  blok.className = 'block termen';
  kop.className = 'h3';
  kop.textContent = 'Woorden in dit onderwerp';
  for (const id of ids) {
    const dt = document.createElement('dt'),
      dd = document.createElement('dd');
    dt.textContent = WOORDEN[id].naam;
    dd.textContent = WOORDEN[id].uitleg;
    dl.append(dt, dd);
  }
  blok.append(kop, dl);
  body.append(blok);
}

let open = null; // { knop, el, breed }
function sluit(terug) {
  if (!open) return;
  const { knop, el } = open;
  open = null;
  el.remove();
  if (!knop.isConnected) return;
  knop.setAttribute('aria-expanded', 'false');
  knop.removeAttribute('aria-describedby');
  if (terug) knop.focus();
}
// `pathFor` en `view` komen van main.js. Staat de leerling al op de uitleg van het onderwerp zelf,
// dan is de link "Meer uitleg" niet nodig.
function zetPopup(knop, pathFor, view) {
  const id = knop.dataset.term,
    w = WOORDEN[id];
  const el = document.createElement('div');
  el.className = 'pop';
  el.id = 'pop-uitleg';
  el.setAttribute('role', 'note');
  const naam = document.createElement('b');
  naam.textContent = w.naam;
  el.append(naam, w.uitleg);
  if (w.onderwerp && (view.oefen || view.slug !== w.onderwerp)) {
    const a = document.createElement('a');
    a.href = `${pathFor({ name: 'topic', slug: w.onderwerp })}#${id}`;
    a.textContent = 'Meer uitleg';
    el.append(' ', a);
  }
  const rij = document.createElement('div'),
    sluitknop = document.createElement('button');
  sluitknop.type = 'button';
  sluitknop.className = 'btn quiet';
  sluitknop.dataset.act = 'termsluit';
  sluitknop.textContent = 'Sluit';
  rij.append(sluitknop);
  el.append(rij);
  // De popup staat direct na het blok met de term, binnen het scherm: zo vindt Tab hem meteen en
  // gaat een klik erin door dezelfde afhandeling als de rest.
  (knop.closest('p, .q, .hintb, .watch, .block, .ex') || knop.parentNode).after(el);
  const r = knop.getBoundingClientRect(),
    basis = (el.offsetParent || document.body).getBoundingClientRect(),
    links = Math.min(
      Math.max(8, r.left),
      document.documentElement.clientWidth - el.offsetWidth - 8,
    );
  // Past de popup niet onder de term, dan komt hij erboven.
  const boven = r.bottom + 6 + el.offsetHeight > window.innerHeight && r.top > el.offsetHeight + 12;
  el.style.left = `${links - basis.left}px`;
  el.style.top = `${(boven ? r.top - el.offsetHeight - 6 : r.bottom + 6) - basis.top}px`;
  knop.setAttribute('aria-expanded', 'true');
  knop.setAttribute('aria-describedby', el.id);
  open = { knop, el, breed: innerWidth };
}
// Een klik op dezelfde term sluit de popup, een klik op een andere term opent die.
function klik(knop, pathFor, view) {
  const zelfde = open?.knop === knop;
  sluit(false);
  if (!zelfde) zetPopup(knop, pathFor, view);
}
// Een klik buiten de term en de popup sluit de popup.
function buiten(doel) {
  if (open && !doel.closest('.term, .pop')) sluit(false);
}

export { mount, sluit, klik, buiten };
export const isOpen = () => open !== null;
