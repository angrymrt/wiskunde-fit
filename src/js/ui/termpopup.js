// De knop en de popup bij een term (#39). Wordt pas geladen als een scherm termen bevat, zodat de
// woordenlijst niet bij het eerste bezoek meekomt. DOM-code: alleen main.js roept dit aan.
// Importeert niets uit de rest van de site, anders komt er een gedeeld bestand bij het eerste bezoek.
import { WOORDEN } from '../woorden.js';

// Maakt van elke <span class="term"> een knop. Het id komt op de plek waar de term wordt
// uitgelegd (data-def), en alleen de eerste keer op de pagina.
function mount(root) {
  for (const sp of root.querySelectorAll('span.term')) {
    const id = sp.dataset.term;
    if (!WOORDEN[id]) continue;
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'term';
    knop.dataset.term = id;
    knop.setAttribute('aria-expanded', 'false');
    if ('def' in sp.dataset && !root.querySelector(`#${id}`)) knop.id = id;
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
// `link(onderwerp, id)` geeft het adres van "Meer uitleg", of niets als de leerling al op de uitleg
// van het onderwerp zelf is. main.js kent de adressen en de huidige pagina.
function zetPopup(knop, link) {
  const id = knop.dataset.term,
    w = WOORDEN[id];
  const el = document.createElement('div');
  el.className = 'pop';
  el.id = 'pop-uitleg';
  el.setAttribute('role', 'note');
  const naam = document.createElement('b');
  naam.textContent = w.naam;
  el.append(naam, w.uitleg);
  const href = w.onderwerp && link(w.onderwerp, id);
  if (href) {
    const a = document.createElement('a');
    a.href = href;
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
  document.body.appendChild(el);
  const r = knop.getBoundingClientRect(),
    breed = el.offsetWidth,
    links = Math.min(Math.max(8, r.left), document.documentElement.clientWidth - breed - 8);
  // Past de popup niet onder de term, dan komt hij erboven.
  const boven = r.bottom + 6 + el.offsetHeight > window.innerHeight && r.top > el.offsetHeight + 12;
  el.style.left = `${links + window.scrollX}px`;
  el.style.top = `${(boven ? r.top - el.offsetHeight - 6 : r.bottom + 6) + window.scrollY}px`;
  knop.setAttribute('aria-expanded', 'true');
  knop.setAttribute('aria-describedby', el.id);
  open = { knop, el };
}
// Een klik op dezelfde term sluit de popup, een klik op een andere term opent die.
function klik(knop, link) {
  const zelfde = open?.knop === knop;
  sluit(false);
  if (!zelfde) zetPopup(knop, link);
}
// Een klik buiten de term en de popup sluit de popup.
function buiten(doel) {
  if (open && !doel.closest('.term, .pop')) sluit(false);
}

export { mount, sluit, klik, buiten };
export const isOpen = () => open !== null;
