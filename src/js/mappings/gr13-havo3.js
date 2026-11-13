// Getal & Ruimte, 13e editie, havo 3. De koppelingen zijn met de theorie in het boek vergeleken.
// Voorkennis hoort hier niet: dat is een kenmerk van een onderwerp. Zie PREREQUISITES.
// Een paragraaf die deels gedekt is, zegt als vijfde waarde wat je hier nog niet kunt oefenen.
export default {
  id: 'gr13-havo3',
  slug: 'getal-en-ruimte-13-havo-3',
  method: 'Getal & Ruimte',
  edition: 13,
  level: 'havo',
  year: 3,
  // Het FLEX-boek van deel 1 komt uit het boek zelf, die van deel 2 is doorgegeven door de eigenaar.
  // De andere nummers komen uit de webshop van Noordhoff.
  books: [
    {
      part: 'deel 1',
      name: 'Getal & Ruimte ed 13.0 havo 3 leerboek deel 1',
      isbn: '9789001055202',
    },
    {
      part: 'deel 1',
      name: 'Getal & Ruimte ed 13.0 havo 3 FLEX boek deel 1',
      isbn: '9789001055189',
    },
    {
      part: 'deel 2',
      name: 'Getal & Ruimte ed 13.0 havo 3 leerboek deel 2',
      isbn: '9789001055219',
    },
    {
      part: 'deel 2',
      name: 'Getal & Ruimte ed 13.0 havo 3 FLEX boek deel 2',
      isbn: '9789001055196',
    },
  ],
  chapters: [
    {
      number: '1',
      part: 'deel 1',
      description: 'Lineaire formules, vergelijkingen en ongelijkheden',
      paragraphs: [
        ['1.1', 'Formule en grafiek van een rechte lijn', [3, 4, 5, 6, 7, 8, 9, 10]],
        [
          '1.2',
          'Rechte lijnen met andere letters, uit tabellen en verhalen',
          [11, 12, 13, 14, 15, 16],
        ],
        ['1.3', 'Vergelijkingen oplossen, ook met haakjes en breuken', [17, 18, 19, 20, 21, 22]],
        ['1.4', 'Waar lijnen elkaar en de assen snijden', [23, 24, 25]],
        ['1.5', 'Ongelijkheden oplossen, met algebra en met grafieken', [26, 27, 28, 29, 30, 31]],
        [
          '1.6',
          'Vergelijkingen met x en y: getallenparen en de lijn erbij',
          [32, 33, 34, 35, 36, 37],
        ],
      ],
    },
    {
      number: '2',
      part: 'deel 1',
      description: 'Gelijkvormige driehoeken en lengtes',
      paragraphs: [
        ['2.1', 'Rekenen met verhoudingen in een tabel', [41, 42, 43, 44, 45, 46]],
        ['2.2', 'Zijden berekenen in gelijkvormige driehoeken', [47, 48, 49, 50, 51, 52]],
        [
          '2.3',
          'Met gelijke hoeken laten zien dat driehoeken gelijkvormig zijn',
          [53, 54, 55, 56, 57],
        ],
        [
          '2.4',
          'Een onbekende lengte x berekenen, in vlakke figuren en ruimtefiguren',
          [58, 59, 60, 61, 62, 63, 64, 65],
        ],
      ],
    },
    {
      number: '3',
      part: 'deel 1',
      description: 'Parabolen en kwadratische formules',
      paragraphs: [
        [
          '3.1',
          'De parabool als grafiek van een kwadratische formule',
          [66, 67, 68, 69, 70, 71, 83, 100, 101],
          'deels',
          'Zelf een parabool tekenen kun je hier nog niet oefenen.',
        ],
        ['3.2', 'Opgaven met een kwadratische formule en de grafiek', [72, 73, 88, 96, 97, 102]],
        [
          '3.3',
          'Kwadratische vergelijkingen oplossen',
          [74, 75, 76, 77, 78, 79, 80, 81, 82, 86],
          'deels',
          'Een vergelijking opstellen met de stelling van Pythagoras kun je hier nog niet oefenen.',
        ],
        ['3.4', 'Kwadratische formule met twee factoren tussen haakjes', [85, 89, 93, 94, 98, 99]],
        [
          '3.5',
          'Kwadratische formule waaruit je de top afleest',
          [84, 87, 90, 91, 92, 95],
          'deels',
          'Zelf een schets van een parabool maken kun je hier nog niet oefenen. Je kiest hier de goede schets.',
        ],
      ],
    },
    {
      number: '4',
      part: 'deel 1',
      description: 'Procenten en gegevens',
      paragraphs: [
        ['4.1', 'Toename en afname in procenten'],
        ['4.2', 'Verschillende berekeningen met procenten'],
        ['4.3', 'Gegevens verwerken in tabellen en diagrammen'],
        ['4.4', 'Cijfers en diagrammen die een verkeerd beeld geven'],
        ['4.5', 'Waarden schatten tussen en buiten bekende gegevens'],
      ],
    },
    {
      number: '5',
      part: 'deel 1',
      description: 'Rekenen met letters',
      paragraphs: [
        ['5.1', 'Uitdrukkingen met letters korter schrijven'],
        ['5.2', 'Breuken met letters vereenvoudigen'],
        ['5.3', 'Rekenregels voor machten'],
        ['5.4', 'Vereenvoudigen met wortels'],
      ],
    },
    {
      number: '6',
      part: 'deel 2',
      description: 'Hoeken en verhoudingen in driehoeken',
      paragraphs: [
        ['6.1', 'Uitdrukken hoe steil iets is'],
        ['6.2', 'Het verband tussen helling, hoek en tangens'],
        ['6.3', 'Zijden en hoeken uitrekenen met de tangens'],
        ['6.4', 'Twee nieuwe verhoudingen: sinus en cosinus'],
        ['6.5', 'Kiezen tussen sinus, cosinus en tangens'],
        ['6.6', 'Hoeken en lengtes in ruimtefiguren'],
      ],
    },
    {
      number: '7',
      part: 'deel 2',
      description: 'Kwadratische vergelijkingen en ongelijkheden',
      paragraphs: [
        ['7.1', 'Waar een parabool een andere grafiek snijdt'],
        ['7.2', 'Kwadratische vergelijkingen oplossen met de abc-formule'],
        ['7.3', 'De handigste manier kiezen om op te lossen'],
        ['7.4', 'Ongelijkheden oplossen met behulp van grafieken'],
        ['7.5', 'Kwadratische ongelijkheden oplossen'],
      ],
    },
    {
      number: '8',
      part: 'deel 2',
      description: 'Groei en andere verbanden',
      paragraphs: [
        ['8.1', 'Groei met een vaste factor'],
        ['8.2', 'Omrekenen tussen percentage en groeifactor'],
        ['8.3', 'De groeifactor bepalen uit een tabel'],
        ['8.4', 'Verbanden die zich steeds herhalen'],
        ['8.5', 'Formules met een macht van x'],
        ['8.6', 'Verbanden waarbij x keer y steeds hetzelfde is'],
      ],
    },
    {
      number: '9',
      part: 'deel 2',
      description: 'Gegevens, tellen en kans',
      paragraphs: [
        ['9.1', 'Gegevens indelen in klassen'],
        ['9.2', 'Kwartielen en hoe ver gegevens uit elkaar liggen'],
        ['9.3', 'Gegevens samenvatten in een boxplot'],
        ['9.4', 'Het aantal mogelijkheden tellen'],
        ['9.5', 'Kansen berekenen'],
      ],
    },
  ],
};
