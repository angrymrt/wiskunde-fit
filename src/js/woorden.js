// De woordenlijst: wiskundige termen met een korte uitleg, voor de popup bij een term (#39). Eén
// term heeft één uitleg. In een tekst schrijf je `{{id|woord}}`, zie `T` in typeset.js.
// `onderwerp` is het onderwerp waar de term wordt uitgelegd; zonder onderwerp is de korte uitleg genoeg.
// De uitleg is in eigen woorden en geeft nooit het antwoord van een vraag.
export const WOORDEN = {
  som: {
    naam: 'som',
    uitleg: 'De uitkomst van optellen. De getallen die je optelt, heten de termen.',
    onderwerp: 'rekenvolgorde',
  },
  verschil: {
    naam: 'verschil',
    uitleg: 'De uitkomst van aftrekken.',
    onderwerp: 'rekenvolgorde',
  },
  product: {
    naam: 'product',
    uitleg:
      'De uitkomst van vermenigvuldigen. De getallen die je vermenigvuldigt, heten de factoren.',
    onderwerp: 'rekenvolgorde',
  },
  quotient: {
    naam: 'quotiënt',
    uitleg: 'De uitkomst van delen.',
    onderwerp: 'rekenvolgorde',
  },
  rekenvolgorde: {
    naam: 'rekenvolgorde',
    uitleg:
      'De afspraak over wat je eerst uitrekent: eerst wat tussen haakjes staat, dan vermenigvuldigen en delen, en dan optellen en aftrekken. Bewerkingen met dezelfde voorrang doe je van links naar rechts.',
    onderwerp: 'rekenvolgorde',
  },
  teller: {
    naam: 'teller',
    uitleg: 'Het getal boven de streep van een breuk. Het zegt hoeveel delen je neemt.',
    onderwerp: 'breuken',
  },
  noemer: {
    naam: 'noemer',
    uitleg:
      'Het getal onder de streep van een breuk. Het zegt in hoeveel gelijke delen het geheel is verdeeld.',
    onderwerp: 'breuken',
  },
  vereenvoudigen: {
    naam: 'vereenvoudigen',
    uitleg:
      'De teller en de noemer van een breuk door hetzelfde getal delen. De breuk blijft even groot.',
    onderwerp: 'breuken',
  },
  'gemengd-getal': {
    naam: 'gemengd getal',
    uitleg: 'Een heel getal met een breuk erachter. Het betekent het hele getal plus de breuk.',
    onderwerp: 'breuken',
  },
  getallenpiramide: {
    naam: 'getallenpiramide',
    uitleg:
      'Vakken in lagen, met in elke laag één vak minder. Elk vak is de som, of het product, van de twee vakken eronder.',
    onderwerp: 'rekenen-met-breuken',
  },
  'magisch-vierkant': {
    naam: 'magisch vierkant',
    uitleg:
      'Een vierkant van vakken met getallen. De getallen in elke rij, elke kolom en de twee diagonalen hebben dezelfde som.',
    onderwerp: 'negatieve-breuken',
  },
  gelijknamig: {
    naam: 'gelijknamig',
    uitleg: 'Breuken zijn gelijknamig als ze dezelfde noemer hebben.',
    onderwerp: 'breuken',
  },
  positief: {
    naam: 'positief getal',
    uitleg: 'Een getal dat groter is dan 0. Op de getallenlijn staat het rechts van 0.',
    onderwerp: 'negatieve-getallen',
  },
  negatief: {
    naam: 'negatief getal',
    uitleg:
      'Een getal dat kleiner is dan 0, zoals −4. Op de getallenlijn staat het links van 0. Het getal 0 zelf is niet positief en niet negatief.',
    onderwerp: 'negatieve-getallen',
  },
  getallenlijn: {
    naam: 'getallenlijn',
    uitleg:
      'Een lijn met getallen op gelijke afstand van elkaar. Naar rechts worden de getallen groter, naar links kleiner.',
    onderwerp: 'negatieve-getallen',
  },
  aftrekmin: {
    naam: 'aftrekmin',
    uitleg: 'De min van aftrekken, zoals in 7 − 2. Hij zegt dat je het getal erachter aftrekt.',
    onderwerp: 'vermenigvuldigen-en-delen-met-negatieve-getallen',
  },
  'negatieve-min': {
    naam: 'negatieve min',
    uitleg:
      'De min van een negatief getal, zoals in −4 of 6 · −4. Hij hoort bij het getal erachter en is iets korter dan de aftrekmin.',
    onderwerp: 'vermenigvuldigen-en-delen-met-negatieve-getallen',
  },
  deelstreep: {
    naam: 'deelstreep',
    uitleg: 'De streep van een breuk. Hij betekent delen: de teller gedeeld door de noemer.',
    onderwerp: 'negatieve-breuken',
  },
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
      'Twee getallenlijnen die elkaar loodrecht kruisen: de x-as loopt horizontaal en de y-as verticaal. Hiermee kun je de plek van een punt aangeven.',
    onderwerp: 'coordinaten-en-assenstelsels',
  },
  oorsprong: {
    naam: 'oorsprong',
    uitleg:
      'Het punt waar de x-as en de y-as elkaar kruisen. De coördinaten van dit punt zijn (0, 0).',
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
      'Een van de vier gebieden waarin de x-as en de y-as het vlak verdelen. Je nummert ze I tot en met IV, tegen de klok in.',
    onderwerp: 'coordinaten-en-assenstelsels',
  },
  scheurlijn: {
    naam: 'scheurlijn',
    uitleg:
      'Een zigzag in een as. Die laat zien dat de as niet bij 0 begint: een stuk van de as is weggelaten.',
    onderwerp: 'grafieken-lezen-en-tekenen',
  },
  'afstand-tijdgrafiek': {
    naam: 'afstand-tijdgrafiek',
    uitleg:
      'Een grafiek met de tijd op de horizontale as en de afgelegde afstand op de verticale as. Een horizontaal stuk betekent dat de afstand niet verandert.',
    onderwerp: 'grafieken-lezen-en-tekenen',
  },
  woordformule: {
    naam: 'woordformule',
    uitleg:
      'Een formule waarin je woorden gebruikt in plaats van letters, zoals prijs = 2 + 3 · aantal.',
    onderwerp: 'woordformules',
  },
  'constant-verband': {
    naam: 'constant verband',
    uitleg:
      'Een verband waarbij de uitkomst altijd hetzelfde blijft, welke waarde je ook voor x kiest. De grafiek is een horizontale lijn, zoals bij y = 4.',
    onderwerp: 'lineaire-formule-opstellen',
  },
  'recht-evenredig-verband': {
    naam: 'recht evenredig verband',
    uitleg:
      'Een verband waarbij y altijd hetzelfde aantal keer zo groot is als x. Verdubbelt x, dan verdubbelt y ook. De grafiek is een rechte lijn door de oorsprong.',
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
      'De uitkomst van een functie als je een bepaalde waarde voor x invult. Bij f(x) = 2x + 1 is de functiewaarde bij x = 4 gelijk aan 9.',
    onderwerp: 'kwadratische-functies',
  },
  'kwadratische-functie': {
    naam: 'kwadratische functie',
    uitleg:
      'Een functie met een formule van de vorm f(x) = ax² + bx + c, waarbij a niet 0 is. De grafiek is een parabool.',
    onderwerp: 'kwadratische-functies',
  },
  parabool: {
    naam: 'parabool',
    uitleg:
      'De kromme grafiek van een kwadratische functie. Een parabool is symmetrisch en heeft één top.',
    onderwerp: 'kwadratische-functies',
  },
  dalparabool: {
    naam: 'dalparabool',
    uitleg:
      'Een parabool die omhoog opent, met de top onderaan als een dal. Dit gebeurt als a groter is dan 0.',
    onderwerp: 'kwadratische-functies',
  },
  bergparabool: {
    naam: 'bergparabool',
    uitleg:
      'Een parabool die omlaag opent, met de top bovenaan als een berg. Dit gebeurt als a kleiner is dan 0.',
    onderwerp: 'kwadratische-functies',
  },
  top: {
    naam: 'top',
    uitleg:
      'Het hoogste of laagste punt van een parabool. Bij een dalparabool is dat het laagste punt, bij een bergparabool het hoogste.',
    onderwerp: 'kwadratische-functies',
  },
  symmetrieas: {
    naam: 'symmetrieas',
    uitleg:
      'De verticale lijn door de top. De twee helften van de parabool links en rechts van die lijn zijn elkaars spiegelbeeld.',
    onderwerp: 'kwadratische-functies',
  },
  lid: {
    naam: 'linkerlid en rechterlid',
    uitleg:
      'Het linkerlid is wat links van het is-gelijkteken staat, het rechterlid wat rechts ervan staat. In 3x + 1 = 7 is 3x + 1 het linkerlid en 7 het rechterlid.',
    onderwerp: 'vergelijkingen-met-twee-variabelen',
  },
  ongelijkheid: {
    naam: 'ongelijkheid',
    uitleg:
      'Een uitdrukking die zegt dat iets groter of kleiner is dan iets anders, met < of >. Bij x + 3 > 5 zijn er veel getallen die kloppen.',
    onderwerp: 'lineaire-ongelijkheden',
  },
  'kwadratische-vergelijking': {
    naam: 'kwadratische vergelijking',
    uitleg:
      "Een vergelijking waarin x² voorkomt, zoals x² + 2x = 15. Zo'n vergelijking heeft vaak twee oplossingen.",
    onderwerp: 'kwadratische-vergelijkingen',
  },
  herleiden: {
    naam: 'herleiden',
    uitleg:
      'Een formule of vergelijking omschrijven zonder dat de oplossingen veranderen, bijvoorbeeld zodat y alleen links staat. Je lost hem dus niet op.',
    onderwerp: 'vergelijkingen-met-twee-variabelen',
  },
  'schuine-zijde': {
    naam: 'schuine zijde',
    uitleg: 'De langste zijde van een rechthoekige driehoek. Ze ligt tegenover de rechte hoek.',
    onderwerp: 'stelling-van-pythagoras',
  },
  rechthoekszijde: {
    naam: 'rechthoekszijde',
    uitleg: 'Een van de twee zijden van een rechthoekige driehoek die de rechte hoek insluiten.',
    onderwerp: 'stelling-van-pythagoras',
  },
  kwadraat: {
    naam: 'kwadraat',
    uitleg: 'Een getal keer zichzelf, zoals 5² = 5 · 5 = 25.',
    onderwerp: 'stelling-van-pythagoras',
  },
  hoogtelijn: {
    naam: 'hoogtelijn',
    uitleg:
      'Een lijnstuk vanuit een hoekpunt van een driehoek, loodrecht op de zijde tegenover dat hoekpunt.',
    onderwerp: 'stelling-van-pythagoras',
  },
  'gelijkbenige-driehoek': {
    naam: 'gelijkbenige driehoek',
    uitleg:
      'Een driehoek met twee even lange zijden. De hoeken tegenover die zijden zijn ook gelijk.',
    onderwerp: 'stelling-van-pythagoras',
  },
  verhoudingstabel: {
    naam: 'verhoudingstabel',
    uitleg:
      'Een tabel waarin de getallen in een kolom bij elkaar horen en elke kolom dezelfde verhouding heeft. Wordt de ene waarde 2 keer zo groot, dan wordt de andere dat ook.',
    onderwerp: 'verhoudingstabellen',
  },
  gelijkvormig: {
    naam: 'gelijkvormig',
    uitleg:
      'Figuren met dezelfde vorm, waarvan de een een vergroting of verkleining van de ander is. De hoeken zijn gelijk en de zijden staan in dezelfde verhouding.',
    onderwerp: 'gelijkvormige-driehoeken',
  },
  verlengde: {
    naam: 'verlengde',
    uitleg:
      'Het deel van een rechte lijn dat ontstaat als je een lijnstuk voorbij een eindpunt doortrekt.',
    onderwerp: 'lengtes-van-lijnstukken-berekenen',
  },
  'f-hoeken': {
    naam: 'F-hoeken',
    uitleg:
      'Gelijke hoeken bij twee evenwijdige lijnen die door een derde lijn worden gesneden. Ze liggen bij de twee snijpunten op dezelfde plek.',
    onderwerp: 'gelijkvormigheid-aantonen',
  },
  'z-hoeken': {
    naam: 'Z-hoeken',
    uitleg:
      'Gelijke hoeken tussen twee evenwijdige lijnen, aan weerskanten van de lijn die ze snijdt. Samen liggen ze in een Z-vorm.',
    onderwerp: 'gelijkvormigheid-aantonen',
  },
  'overstaande-hoeken': {
    naam: 'overstaande hoeken',
    uitleg:
      'De twee hoeken die recht tegenover elkaar liggen als twee lijnen elkaar snijden. Ze zijn altijd gelijk.',
    onderwerp: 'gelijkvormigheid-aantonen',
  },
  gemiddelde: {
    naam: 'gemiddelde',
    uitleg:
      'Het totaal van alle getallen gedeeld door het aantal getallen. Het gemiddelde van 4, 6 en 11 is 21 : 3 = 7.',
    onderwerp: 'tabellen-en-diagrammen',
  },
  aandeel: {
    naam: 'aandeel',
    uitleg: 'Het deel dat iets uitmaakt van het totaal, meestal in procenten.',
    onderwerp: 'tabellen-en-diagrammen',
  },
  staafdiagram: {
    naam: 'staafdiagram',
    uitleg: 'Een diagram met staven. De hoogte van een staaf laat zien hoe groot een waarde is.',
    onderwerp: 'tabellen-en-diagrammen',
  },
  'gestapeld-staafdiagram': {
    naam: 'gestapeld staafdiagram',
    uitleg:
      'Een staafdiagram waarbij elke staaf uit verschillende delen bestaat die op elkaar zijn gestapeld. Je ziet de afzonderlijke delen en het totaal.',
    onderwerp: 'tabellen-en-diagrammen',
  },
  cirkeldiagram: {
    naam: 'cirkeldiagram',
    uitleg:
      'Een cirkel die is verdeeld in stukken. Elk stuk laat zien welk deel het is van het totaal.',
    onderwerp: 'tabellen-en-diagrammen',
  },
  lijndiagram: {
    naam: 'lijndiagram',
    uitleg: 'Een diagram met een lijn die laat zien hoe iets in de tijd verandert.',
    onderwerp: 'tabellen-en-diagrammen',
  },
  schaal: {
    naam: 'schaal',
    uitleg:
      'De stapgrootte tussen de getallen op een as. Als de getallen steeds met 10 omhooggaan, is de schaal 10.',
    onderwerp: 'misleidende-statistiek',
  },
  procentpunt: {
    naam: 'procentpunt',
    uitleg:
      'Het verschil tussen twee percentages. Van 24% naar 18% is een afname van 6 procentpunt.',
    onderwerp: 'misleidende-statistiek',
  },
  waarneming: {
    naam: 'waarneming',
    uitleg: 'Een waarde die je meet of verzamelt, zoals het aantal bezoekers in een bepaald jaar.',
    onderwerp: 'interpoleren-en-extrapoleren',
  },
  'gemiddelde-verandering-per-jaar': {
    naam: 'gemiddelde verandering per jaar',
    uitleg:
      'Het verschil tussen twee waarden gedeeld door het aantal jaren ertussen. Het zegt hoeveel de waarde gemiddeld per jaar toe- of afneemt.',
    onderwerp: 'interpoleren-en-extrapoleren',
  },
  interpoleren: {
    naam: 'interpoleren',
    uitleg: 'Een waarde schatten die tussen twee bekende waarnemingen ligt.',
    onderwerp: 'interpoleren-en-extrapoleren',
  },
  extrapoleren: {
    naam: 'extrapoleren',
    uitleg:
      'Een waarde schatten buiten de bekende waarnemingen, dus vóór de eerste of na de laatste.',
    onderwerp: 'interpoleren-en-extrapoleren',
  },
  'stelling-van-pythagoras': {
    naam: 'stelling van Pythagoras',
    uitleg:
      'Een regel voor een rechthoekige driehoek: het kwadraat van de schuine zijde is gelijk aan de som van de kwadraten van de twee rechthoekszijden. Zijn a en b de rechthoekszijden en is c de schuine zijde, dan geldt a² + b² = c².',
    onderwerp: 'stelling-van-pythagoras',
  },
  snijpunt: {
    naam: 'snijpunt',
    uitleg: 'Het punt waar twee lijnen elkaar kruisen, of waar een lijn een as kruist.',
    onderwerp: 'snijpunten-van-lijnen',
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
    ? `<div class="block termen"><h2 class="h3">Woorden in dit onderwerp</h2><dl>${uniek.map((id) => `<dt id="woord-${id}">${esc(WOORDEN[id].naam)}</dt><dd>${esc(WOORDEN[id].uitleg)}</dd>`).join('')}</dl></div>`
    : '';
}
// De termen die in de HTML van een uitleg staan, in de volgorde van de tekst.
export const termenIn = (html) => [...html.matchAll(/data-term="([a-z-]+)"/g)].map((m) => m[1]);
