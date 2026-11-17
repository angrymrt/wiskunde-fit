// De knop en de popup bij een term (#39). Wordt pas geladen als een scherm termen bevat, zodat de
// woordenlijst niet bij het eerste bezoek meekomt. DOM-code: alleen main.js roept dit aan.
// Importeert niets uit de rest van de site, anders komt er een gedeeld bestand bij het eerste bezoek.
import { WOORDEN } from '../woorden.js';

// Maakt van elke <span class="term"> een knop. Een id (de plek waar de term wordt uitgelegd) blijft.
// Draait of vergroot het venster, dan staat de popup niet meer goed.
let luistert = false;
function mount(root) {
  if (!luistert) window.addEventListener('resize', () => sluit(false));
  luistert = true;
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
}

let open = null; // { knop, el }
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
  open = { knop, el };
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
