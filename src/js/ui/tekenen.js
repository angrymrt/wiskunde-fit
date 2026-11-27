// Het tekenen bij een tekenvraag (#232): tikken, het toetsenbord en de knoppen. main.js laadt dit bestand pas als er
// een tekenvraag op het scherm staat, en roept na elke render() synchroniseer() aan.
//
// Wat de leerling tekent, staat als tekst in het verborgen veld van de vraag (zie tekenvragen.js). Zo bewaart en kijkt
// de site een tekening na zoals een getypt antwoord, en blijft ze staan als het scherm opnieuw wordt opgebouwd, zoals
// na een hint. Wat een tik of toets doet, staat ook in tekenvragen.js (tik per soort), zodat de tests het in Node
// draaien. Dit bestand onthoudt alleen wat bij het tekenen zelf hoort: waar de cursor van het toetsenbord staat en
// hoe ver de passer open staat.
//
// Bediening zonder muis: bij een kubus, een uitslag en een pijl krijgt het rooster of de getallenlijn de focus, en dan
// verplaatsen de pijltjes een cursor en zet Enter of de spatie daar iets neer. Knoppen eronder doen hetzelfde. Bij de
// passer gaat alles met knoppen. Wat er gebeurt, leest een schermlezer voor uit een eigen melding.
import { SOORTEN } from '../tekenvragen.js';
import { app, state } from './state.js';

// De tekenvraag op het scherm, in het oefenen of in een proeftoets, of null als er geen staat.
function delen() {
  const veld = app.querySelector('#pform input[data-teken], #tform input[data-teken]'),
    svg = app.querySelector('svg[data-teken]');
  if (!veld || !svg) return null;
  const pfx = veld.id[0],
    q =
      pfx === 't'
        ? state.test?.items[state.test.i]?.q
        : state.prac[state.view.name === 'stofoefen' ? 'mijn-stof' : state.view.slug]?.q;
  if (!q?.teken) return null;
  return {
    veld,
    svg,
    q,
    t: q.teken,
    S: SOORTEN[q.teken.soort],
    pfx,
    laag: svg.querySelector('.getekend'),
    knoppen: veld.closest('.fields').querySelector('.teken-knoppen'),
    dicht: veld.disabled,
  };
}

// Wat bij het tekenen van één vraag hoort. Bij een andere vraag begint het opnieuw. nagekeken is de tekening zoals
// die werd nagekeken: alleen zolang de tekening zo is, staat erin wat er fout was.
let ui = {};
function onthoud(g) {
  const vraag = `${g.pfx} ${g.q.seed} ${JSON.stringify(g.t)}`;
  if (ui.vraag !== vraag) ui = { vraag, cursor: null, straal: 3, nagekeken: null };
}

// Een melding die een schermlezer voorleest. Die staat buiten het scherm van main.js, zodat hij er al is als er tekst
// in komt, ook nadat render() het scherm opnieuw opbouwt.
let melding = null;
function zeg(tekst) {
  // Dezelfde tekst twee keer achter elkaar leest een schermlezer niet voor. Daarom wisselt er een spatie aan het eind.
  melding.textContent = melding.textContent === tekst ? `${tekst} ` : tekst;
}

// Waar de pijltjes de cursor heen zetten: x en y, met y omhoog.
const PIJL = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};
const KNOP_PIJL = { links: [-1, 0], rechts: [1, 0], omhoog: [0, 1], omlaag: [0, -1] };
// Met het rooster of de getallenlijn zelf: bij een kubus, een uitslag en een pijl. De passer gaat met knoppen.
const metRooster = (g) => g.t.soort !== 'passer';
const HULP = {
  kubus:
    'Tik op een punt van het rooster om het volgende hoekpunt te zetten. Tik je op een gezet punt, dan haal je het weg.',
  uitslag: 'Tik op een hokje om het te kleuren. Tik je nog een keer, dan is het weer leeg.',
  pijl: 'Tik op het getal waar de pijl begint, en daarna op het getal waar hij eindigt. Tik je op een gezet punt, dan haal je het weg.',
  passer: (L) =>
    `Stel de passer in met − en +. Zet hem in ${L[0]} of ${L[1]} met de knop, of tik in de figuur op ${L[0]} of ${L[1]}. Tik daarna op het snijpunt van de boogjes, of kies de knop voor ${L[2]}.`,
};
const TOETSEN = (g) =>
  ` Met het toetsenbord: zet de focus op ${g.t.soort === 'pijl' ? 'de getallenlijn' : 'het rooster'}, en gebruik de pijltjes en Enter.`;

const knop = (g, naam, tekst, label) =>
  `<button class="btn" type="button" id="${g.pfx}tk-${naam}" data-teken-knop="${naam}"${label ? ` aria-label="${label}"` : ''}>${tekst}</button>`;
function knoppenHTML(g) {
  const p = g.pfx,
    L = g.t.L,
    stap = `<p class="small" id="${p}tk-stap"></p>`,
    wis = `<div class="row">${knop(g, 'wis', 'Wis alles').replace('class="btn"', 'class="btn quiet"')}</div>`,
    uitleg = `<p class="sr" id="${p}tk-uitleg"></p>`;
  if (g.t.soort === 'passer')
    return `${stap}<div class="row" role="group" aria-labelledby="${p}tk-pl"><span id="${p}tk-pl">Passer</span>${knop(g, 'kleiner', '−', 'Passer kleiner')}<b id="${p}tk-straal"></b>${knop(g, 'groter', '+', 'Passer groter')}</div><div class="row">${knop(g, 'a', `Passer in ${L[0]}`)}${knop(g, 'b', `Passer in ${L[1]}`)}${knop(g, 'c', `${L[2]} op het snijpunt`)}</div>${wis}<p class="small muted">${HULP.passer(L)}</p>${uitleg}`;
  // Op een getallenlijn kan de cursor alleen naar links en naar rechts.
  const lijn = g.t.soort === 'pijl',
    pijlen = `<div class="row" role="group" aria-label="Cursor ${lijn ? 'op de getallenlijn' : 'in het rooster'}">${knop(g, 'links', '←', 'Cursor naar links')}${lijn ? '' : knop(g, 'omhoog', '↑', 'Cursor omhoog') + knop(g, 'omlaag', '↓', 'Cursor omlaag')}${knop(g, 'rechts', '→', 'Cursor naar rechts')}${knop(g, 'zet', g.t.soort === 'uitslag' ? 'Kleur hokje' : 'Zet punt')}</div>`;
  return `${stap}${pijlen}${wis}<p class="small muted">${HULP[g.t.soort]}</p>${uitleg}`;
}

// Tekent wat er nu in het veld staat, en zet de teksten bij de knoppen goed.
function bijwerken(g) {
  const st = g.S.lees(g.t, g.veld.value),
    fout = g.veld.closest('.fld').classList.contains('no') && g.veld.value === ui.nagekeken,
    cursor = !g.dicht && metRooster(g) ? ui.cursor : null;
  g.laag.innerHTML = g.S.laag(g.t, st, { fout, cursor });
  const tekst = `${g.S.desc(g.t)} ${g.S.staat(g.t, st)}`;
  if (g.dicht || !metRooster(g)) g.svg.setAttribute('aria-label', tekst);
  if (g.dicht) return;
  // Een tik vlak na render(), voordat synchroniseer() er was: dan staan de knoppen er nog niet.
  if (!g.knoppen.firstChild) g.knoppen.innerHTML = knoppenHTML(g);
  const deel = (naam) => document.getElementById(`${g.pfx}tk-${naam}`);
  deel('stap').textContent = g.S.stap(g.t, st);
  deel('uitleg').textContent = metRooster(g)
    ? `${tekst}${cursor ? ` De cursor staat ${g.S.plek(g.t, st, cursor)}.` : ''} ${HULP[g.t.soort]}${TOETSEN(g)}`
    : tekst;
  if (g.t.soort === 'passer') {
    deel('straal').textContent = `${String(ui.straal).replace('.', ',')} cm`;
    deel('c').disabled = !g.S.snijpunt(g.t, st);
  }
  if (metRooster(g)) {
    const bezet = cursor && g.S.bezet(g.t, st, cursor);
    deel('zet').textContent =
      g.t.soort !== 'uitslag'
        ? bezet
          ? 'Haal weg'
          : 'Zet punt'
        : bezet
          ? 'Maak hokje leeg'
          : 'Kleur hokje';
  }
}

// Na elke render(): het scherm is opnieuw opgebouwd, dus de knoppen en de tekening komen er weer bij. De eerste keer
// komen ook de melding en het luisteren naar tikken en toetsen erbij. Dat staat niet bovenaan dit bestand, want in
// Node, waar de tests en de build de schermen importeren, is er geen pagina.
function synchroniseer() {
  const g = delen();
  if (!g) return;
  if (!melding) {
    melding = document.createElement('p');
    melding.className = 'sr';
    melding.setAttribute('aria-live', 'polite');
    document.body.append(melding);
    luister();
  }
  onthoud(g);
  if (!g.dicht) {
    g.svg.classList.add('tekenbaar');
    if (metRooster(g)) {
      g.svg.setAttribute('role', 'application');
      g.svg.setAttribute('tabindex', '0');
      g.svg.setAttribute(
        'aria-label',
        g.t.soort === 'pijl'
          ? 'Getallenlijn om een pijl op te tekenen'
          : 'Rooster om in te tekenen',
      );
      g.svg.setAttribute('aria-describedby', `${g.pfx}tk-uitleg`);
    }
    g.knoppen.innerHTML = knoppenHTML(g);
  }
  bijwerken(g);
}

// Verwerkt een stap uit tekenvragen.js: de nieuwe tekening in het veld, en de zin voor een schermlezer.
function pas(g, { st, zin }) {
  g.veld.value = g.S.schrijf(g.t, st);
  bijwerken(g);
  zeg(zin);
}
const huidig = (g) => g.S.lees(g.t, g.veld.value);
function zetBijCursor(g) {
  if (!ui.cursor) ui.cursor = g.S.start(g.t);
  pas(g, g.S.tik(g.t, huidig(g), ui.cursor));
}
function beweeg(g, richting) {
  ui.cursor = ui.cursor ? g.S.verder(g.t, ui.cursor, richting) : g.S.start(g.t);
  bijwerken(g);
  zeg(`Cursor ${g.S.plek(g.t, huidig(g), ui.cursor)}.`);
}
// Een tik in de figuur, omgerekend naar het rooster, ook als de figuur op het scherm kleiner is.
function tik(g, e) {
  const r = g.svg.getBoundingClientRect(),
    vb = g.svg.viewBox.baseVal,
    p = g.S.terug(
      g.t,
      ((e.clientX - r.left) * vb.width) / r.width,
      ((e.clientY - r.top) * vb.height) / r.height,
    );
  if (!p) return;
  if (g.t.soort === 'passer') return pas(g, g.S.tik(g.t, huidig(g), p, ui.straal));
  if (ui.cursor) ui.cursor = p;
  pas(g, g.S.tik(g.t, huidig(g), p));
}
function knopActie(g, naam) {
  const st = huidig(g);
  if (KNOP_PIJL[naam]) return beweeg(g, KNOP_PIJL[naam]);
  if (naam === 'zet') return zetBijCursor(g);
  if (naam === 'wis') {
    g.veld.value = '';
    bijwerken(g);
    return zeg('Alles gewist.');
  }
  if (naam === 'kleiner' || naam === 'groter') {
    ui.straal = Math.min(9, Math.max(0.5, ui.straal + (naam === 'groter' ? 0.5 : -0.5)));
    bijwerken(g);
    return zeg(`Passer ${String(ui.straal).replace('.', ',')} cm.`);
  }
  if (naam === 'a' || naam === 'b')
    return pas(g, g.S.boog(g.t, st, naam === 'b' ? 1 : 0, ui.straal));
  if (naam === 'c') pas(g, g.S.opSnijpunt(g.t, st));
}

function luister() {
  app.addEventListener('click', (e) => {
    const g = delen();
    if (!g || g.dicht) return;
    const k = e.target.closest('[data-teken-knop]');
    if (k && g.knoppen.contains(k)) return knopActie(g, k.dataset.tekenKnop);
    if (e.target.closest('svg[data-teken]') === g.svg) tik(g, e);
  });
  app.addEventListener('keydown', (e) => {
    const g = delen();
    if (!g || g.dicht || e.target !== g.svg || !metRooster(g)) return;
    if (PIJL[e.key]) {
      e.preventDefault();
      beweeg(g, PIJL[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      zetBijCursor(g);
    }
  });
  // Met de focus op het rooster verschijnt de cursor.
  app.addEventListener('focusin', (e) => {
    const g = delen();
    if (!g || g.dicht || e.target !== g.svg || ui.cursor) return;
    ui.cursor = g.S.start(g.t);
    bijwerken(g);
  });
  // Voordat main.js het antwoord nakijkt, onthouden welke tekening dat is. Met capture, zodat dit eerst gebeurt.
  app.addEventListener(
    'submit',
    () => {
      const g = delen();
      if (g) ui.nagekeken = g.veld.value;
    },
    true,
  );
}

export { synchroniseer };
