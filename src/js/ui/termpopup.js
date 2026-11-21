// De knop en de popup bij een term (#39). Wordt pas geladen als een scherm termen bevat, zodat de
// woordenlijst niet bij het eerste bezoek meekomt. DOM-code: alleen main.js roept dit aan.
// Importeert niets uit de rest van de site, anders komt er een gedeeld bestand bij het eerste bezoek.
import { WOORDEN, termenLijstHTML } from '../woorden.js';

// Maakt van elke <span class="term"> een knop, behalve op de pagina van het onderwerp waar de term wordt
// uitgelegd: daar legt de woordenlijst onder de uitleg hem uit, dus blijft het gewone tekst.
// Verandert de breedte van het venster, dan staat de popup niet meer goed. Alleen de hoogte (de
// werkbalk van een telefoon) maakt niet uit.
let gescrold = ''; // het adres waarvoor we al naar de woordenlijst zijn gescrold
let ctx = null; // { pathFor, state } van main.js, nodig voor de link "Meer uitleg"
function mount(root, pathFor, state) {
  if (!ctx) luister();
  ctx = { pathFor, state };
  lijst(root);
  const eigen = !state.view.oefen && state.view.name === 'topic' ? state.view.slug : null;
  for (const sp of root.querySelectorAll('span.term')) {
    const id = sp.dataset.term;
    if (!WOORDEN[id]) continue;
    if (WOORDEN[id].onderwerp === eigen) {
      sp.replaceWith(sp.textContent);
      continue;
    }
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.className = 'term';
    knop.dataset.term = id;
    knop.setAttribute('aria-expanded', 'false');
    knop.textContent = sp.textContent;
    sp.replaceWith(knop);
  }
  const naar = document.getElementById(location.hash.slice(1));
  // "Meer uitleg" linkt naar de term in de woordenlijst onder de uitleg. Elke nieuwe tekening van het
  // scherm roept mount aan, maar naar de term scrollen we maar één keer per adres.
  if (naar?.matches('dt') && gescrold !== location.hash) naar.scrollIntoView();
  gescrold = location.hash;
}

// Onder de uitleg van een onderwerp staan de termen die erin voorkomen, uit de woordenlijst. Zo hoeft
// niemand een uitleg twee keer te schrijven. De vooraf gebouwde pagina heeft de lijst al.
function lijst(root) {
  const body = root.querySelector('.topic-body');
  if (body && !body.querySelector('.termen'))
    body.insertAdjacentHTML(
      'beforeend',
      termenLijstHTML([...body.querySelectorAll('span.term')].map((x) => x.dataset.term)),
    );
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
    a.href = `${pathFor({ name: 'topic', slug: w.onderwerp })}#woord-${id}`;
    a.textContent = 'Meer uitleg';
    el.append(' ', a);
  }
  const rij = document.createElement('div'),
    sluitknop = document.createElement('button');
  sluitknop.type = 'button';
  sluitknop.className = 'btn quiet';
  sluitknop.onclick = () => sluit(true);
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
// Een klik op dezelfde term sluit de popup, een klik op een andere term opent die, en een klik
// ergens anders sluit hem. Escape sluit en geeft de focus terug aan de term.
function luister() {
  window.addEventListener('resize', () => open?.breed !== innerWidth && sluit(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && sluit(true));
  document.addEventListener('click', (e) => {
    const knop = e.target.closest('button.term'),
      zelfde = open?.knop === knop;
    if (knop || !e.target.closest('.pop')) sluit(false);
    if (knop && !zelfde) zetPopup(knop, ctx.pathFor, ctx.state.view);
  });
}

export { mount, sluit };
