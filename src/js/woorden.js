// De woordenlijst: wiskundige termen met een korte uitleg, voor de popup bij een term (#39). Eén
// term heeft één uitleg. In een tekst schrijf je `{{id|woord}}`, zie `T` in typeset.js.
// `onderwerp` is het onderwerp waar de term wordt uitgelegd; zonder onderwerp is de korte uitleg genoeg.
// De uitleg is in eigen woorden en geeft nooit het antwoord van een vraag.
export const WOORDEN = {
  richtingscoefficient: {
    naam: 'richtingscoëfficiënt',
    uitleg: 'Het getal a in y = ax + b. Het vertelt hoeveel y verandert als x 1 groter wordt.',
    onderwerp: 'lineaire-grafieken-tekenen',
  },
  procent: {
    naam: 'procent',
    uitleg: 'Procent betekent "per honderd". 1% is 1 van de 100, oftewel 0,01 als kommagetal.',
    onderwerp: 'procentuele-verandering',
  },
  'procentuele-verandering': {
    naam: 'procentuele verandering',
    uitleg:
      'Het percentage waarmee iets groter of kleiner is geworden. Je vergelijkt de verandering met het getal van vóór de verandering (oud).',
    onderwerp: 'procentuele-verandering',
  },
  vermenigvuldigingsfactor: {
    naam: 'vermenigvuldigingsfactor',
    uitleg:
      'Het getal waarmee je het getal van vóór de verandering (oud) vermenigvuldigt om het nieuwe getal te krijgen. Bij 5% erbij hoort × 1,05 en bij 5% eraf × 0,95.',
    onderwerp: 'procentuele-verandering',
  },
  btw: {
    naam: 'btw',
    uitleg:
      'Btw is belasting op producten en diensten. Een prijs inclusief btw is de prijs die je betaalt, met de btw er al in. Bij 21% btw is dat 1,21 keer de prijs zonder btw.',
    onderwerp: 'rekenen-met-procenten',
  },
  'ontbinden-in-factoren': {
    naam: 'ontbinden in factoren',
    uitleg: 'Een som schrijven als een product. Zo wordt x² + 5x gelijk aan x(x + 5).',
    onderwerp: 'ontbinden-in-factoren',
  },
  'haakjes-wegwerken': {
    naam: 'haakjes wegwerken',
    uitleg: 'Een product met haakjes schrijven als een som. Zo wordt x(x + 5) gelijk aan x² + 5x.',
    onderwerp: 'haakjes-wegwerken',
  },
  factor: {
    naam: 'factor',
    uitleg:
      'Een getal of een uitdrukking waarmee je vermenigvuldigt. In 3(x + 2) zijn 3 en (x + 2) de factoren.',
    onderwerp: 'ontbinden-in-factoren',
  },
  term: {
    naam: 'term',
    uitleg:
      'Een stukje van een som, gescheiden door + of −. In 3x² − 5x + 2 zijn de termen 3x², −5x en 2.',
    onderwerp: 'ontbinden-in-factoren',
  },
  assenstelsel: {
    naam: 'assenstelsel',
    uitleg:
      'Twee getallenlijnen die elkaar kruisen: de x-as is horizontaal en de y-as verticaal. Daarmee geef je elk punt een plek.',
    onderwerp: 'coordinaten-en-assenstelsels',
  },
  oorsprong: {
    naam: 'oorsprong',
    uitleg: 'Het punt waar de x-as en de y-as elkaar kruisen. Dat is het punt (0, 0).',
    onderwerp: 'coordinaten-en-assenstelsels',
  },
  coordinaat: {
    naam: 'coördinaat',
    uitleg:
      'Een getal dat zegt waar een punt ligt. De x-coördinaat zegt hoe ver naar rechts of links, de y-coördinaat hoe ver omhoog of omlaag.',
    onderwerp: 'coordinaten-en-assenstelsels',
  },
  kwadrant: {
    naam: 'kwadrant',
    uitleg:
      'Een van de vier stukken waarin de assen het vlak verdelen. Je nummert ze I tot en met IV, tegen de klok in.',
    onderwerp: 'coordinaten-en-assenstelsels',
  },
  woordformule: {
    naam: 'woordformule',
    uitleg: 'Een formule die in woorden zegt hoe je iets uitrekent, zoals prijs = 2 + 3 · aantal.',
    onderwerp: 'woordformules',
  },
  'constant-verband': {
    naam: 'constant verband',
    uitleg:
      'Een verband waarbij de uitkomst altijd hetzelfde is, wat je ook invult. De grafiek is een horizontale lijn, zoals bij y = 4.',
    onderwerp: 'lineaire-formule-opstellen',
  },
  'recht-evenredig-verband': {
    naam: 'recht evenredig verband',
    uitleg:
      'Een verband y = ax. Verdubbelt x, dan verdubbelt y ook. De grafiek is een rechte lijn door de oorsprong.',
    onderwerp: 'lineaire-formule-opstellen',
  },
  evenwijdig: {
    naam: 'evenwijdig',
    uitleg: 'Lijnen die even steil lopen en elkaar daarom nooit snijden. Je schrijft k // l.',
    onderwerp: 'lineaire-formule-opstellen',
  },
  functiewaarde: {
    naam: 'functiewaarde',
    uitleg:
      'De uitkomst van een functie bij een bepaalde x. Bij f(x) = 2x + 1 is de functiewaarde bij x = 4 gelijk aan 9.',
    onderwerp: 'kwadratische-functies',
  },
  'kwadratische-functie': {
    naam: 'kwadratische functie',
    uitleg: 'Een functie f(x) = ax² + bx + c met a ≠ 0. De grafiek is een parabool.',
    onderwerp: 'kwadratische-functies',
  },
  parabool: {
    naam: 'parabool',
    uitleg: 'De kromme grafiek van een kwadratische functie. Hij is symmetrisch en heeft één top.',
    onderwerp: 'kwadratische-functies',
  },
  dalparabool: {
    naam: 'dalparabool',
    uitleg: 'Een parabool met de top onderaan, als een dal. Hij hoort bij a > 0.',
    onderwerp: 'kwadratische-functies',
  },
  bergparabool: {
    naam: 'bergparabool',
    uitleg: 'Een parabool met de top bovenaan, als een berg. Hij hoort bij a < 0.',
    onderwerp: 'kwadratische-functies',
  },
  top: {
    naam: 'top',
    uitleg: 'Het laagste punt van een dalparabool of het hoogste punt van een bergparabool.',
    onderwerp: 'kwadratische-functies',
  },
  symmetrieas: {
    naam: 'symmetrieas',
    uitleg:
      'De verticale lijn door de top. Links en rechts ervan is de parabool elkaars spiegelbeeld.',
    onderwerp: 'kwadratische-functies',
  },
  snijpunt: {
    naam: 'snijpunt',
    uitleg: 'Het punt waar twee lijnen elkaar kruisen, of waar een lijn een as kruist.',
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
