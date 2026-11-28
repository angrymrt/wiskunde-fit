// Het veld voor een uitdrukking die de leerling zelf typt (#304), zoals 12a^3b^6 of 2a/(3c). Onder het
// veld staat hoe de site leest wat er staat, in wiskundezetting. Het lezen zelf staat in uitdrukking.js,
// dat met het onderwerp laadt. Dit bestand staat in interactief.js, dat ook met een onderwerp laadt, zodat
// het eerste bezoek niet groter wordt. Het veld maken kan zonder DOM; alleen toonUitdrukking gebruikt die.
import { UITDRUKKING } from '../math.js';
import { esc, T } from '../typeset.js';

// Wat onder het veld staat. Het zichtbare deel is voor een schermlezer verborgen, want die leest de
// opmaak slecht voor. In plaats daarvan staat er een zin in woorden. Het veld verwijst ernaar met
// aria-describedby, zodat een schermlezer hem voorleest als je naar het veld gaat, en niet bij elke toets.
function zienHTML(waarde) {
  const s = String(waarde ?? '').trim();
  if (!s || !UITDRUKKING.lees) return '';
  if (!UITDRUKKING.lees(s)) return '<span class="muted">Dit kan ik nog niet lezen.</span>';
  return `<span aria-hidden="true"><span class="muted">Zo lees ik het:</span> ${UITDRUKKING.html(s)}</span><span class="sr">Zo lees ik het: ${esc(UITDRUKKING.zeg(s))}.</span>`;
}

// Het veld met de tekst ervoor en eronder hoe het eruitziet. Bij het eerste veld met een uitdrukking staat
// ook hoe je een macht, wortel en breuk typt. De letters voor de Rekenhulp staan in data-uitdrukking.
function uitdrukkingVeld(q, i, pfx, waarde, cl, locked) {
  const f = q.fields[i],
    id = `${pfx}f${i}`,
    letters = String(f.uitdrukking.letters ?? '').replace(/[^a-z]/g, ''),
    naam = f.label ? `aria-label="${esc(f.label)}"` : f.pre ? '' : `aria-label="Antwoord ${i + 1}"`,
    tip =
      q.fields.findIndex((g) => g.uitdrukking) === i
        ? '<p class="small muted">Een macht typ je als a^3, een wortel als √5, een breuk als 2a/(3c) en een gemengd getal als 2 1/3.</p>'
        : '';
  const input = `<input id="${id}" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" data-uitdrukking="${letters}" ${naam} aria-describedby="${pfx}q ${id}z" value="${esc(waarde ?? '').replace(/"/g, '&quot;')}" ${locked ? 'disabled' : ''}>`;
  return `<label class="fld uitdr ${cl}">${f.pre ? `<span>${T(f.pre)}</span>` : ''}${input}</label><div class="uitdr-zien" id="${id}z">${zienHTML(waarde)}</div>${tip}`;
}

// Na elke toets in zo'n veld: zet onder het veld hoe het eruitziet.
function toonUitdrukking(el) {
  if (!el?.hasAttribute?.('data-uitdrukking')) return;
  const zien = document.getElementById(`${el.id}z`);
  if (zien) zien.innerHTML = zienHTML(el.value);
}

export { uitdrukkingVeld, toonUitdrukking };
