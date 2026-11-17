// De woordenlijst: wiskundige termen met een korte uitleg, voor de popup bij een term (#39). Eén
// term heeft één uitleg. In een tekst schrijf je `{{id|woord}}`, zie `T` in typeset.js.
// `onderwerp` is het onderwerp waar de term wordt uitgelegd; zonder onderwerp is de korte uitleg genoeg.
// De uitleg is in eigen woorden en geeft nooit het antwoord van een vraag.
export const WOORDEN = {
  richtingscoefficient: {
    naam: 'richtingscoëfficiënt',
    uitleg: 'Het getal a in y = ax + b. Het zegt hoeveel y omhoog gaat als x met 1 groter wordt.',
    onderwerp: 'lineaire-grafieken-tekenen',
  },
  procent: {
    naam: 'procent',
    uitleg: 'Een honderdste deel. 1% is 1 van de 100, dus 0,01 als kommagetal.',
    onderwerp: 'procentuele-verandering',
  },
  'procentuele-verandering': {
    naam: 'procentuele verandering',
    uitleg:
      'Met hoeveel procent iets groter of kleiner is geworden, gerekend vanaf het getal van vóór de verandering.',
    onderwerp: 'procentuele-verandering',
  },
  vermenigvuldigingsfactor: {
    naam: 'vermenigvuldigingsfactor',
    uitleg:
      'Het getal waarmee je vermenigvuldigt om het nieuwe getal te krijgen. Bij 5% erbij hoort × 1,05.',
    onderwerp: 'procentuele-verandering',
  },
  btw: {
    naam: 'btw',
    uitleg:
      'Belasting die over een prijs komt, een percentage erbij. Bij 21% btw is de prijs met btw 1,21 keer zo groot als zonder.',
    onderwerp: 'rekenen-met-procenten',
  },
  snijpunt: {
    naam: 'snijpunt',
    uitleg: 'Het punt waar twee lijnen of een lijn en een as elkaar kruisen.',
  },
};

// De lijst "Woorden in dit onderwerp" onder de uitleg, als HTML. De build zet hem in de vooraf
// gebouwde pagina, zodat hij ook zonder JavaScript te lezen is, en ui/termpopup.js maakt hem in de
// browser als hij er niet staat. Beide gebruiken deze functie, dus het is dezelfde lijst. Bevat geen
// import uit de rest van de site, zodat het niet bij de code van het eerste bezoek komt.
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function termenLijstHTML(ids) {
  const uniek = [...new Set(ids)].filter((id) => WOORDEN[id]);
  return uniek.length
    ? `<div class="block termen"><h2 class="h3">Woorden in dit onderwerp</h2><dl>${uniek.map((id) => `<dt>${esc(WOORDEN[id].naam)}</dt><dd>${esc(WOORDEN[id].uitleg)}</dd>`).join('')}</dl></div>`
    : '';
}
// De termen die in de HTML van een uitleg staan, in de volgorde van de tekst.
export const termenIn = (html) => [...html.matchAll(/data-term="([a-z-]+)"/g)].map((m) => m[1]);
