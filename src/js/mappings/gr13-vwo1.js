// Getal & Ruimte, 13e editie, vwo 1. Alleen hoofdstuk 3 is ingevuld.
// Voor vwo 1 bestaat geen FLEX-boek, alleen de twee leerboeken.
export default {
  id: 'gr13-vwo1',
  slug: 'getal-en-ruimte-13-vwo-1',
  method: 'Getal & Ruimte',
  edition: 13,
  level: 'vwo',
  year: 1,
  note: 'Alleen hoofdstuk 3 is ingevuld, de andere hoofdstukken volgen later. Deze vragen zijn gemaakt voor havo 3 of havo/vwo en zijn alleen voor hoofdstuk 3 met dit boek vergeleken: 3.1 wel, 3.4 t/m 3.6 alleen met de samenvatting en de diagnostische toets, 3.2 en 3.3 niet.',
  books: [
    {
      part: 'deel 1',
      name: 'Getal & Ruimte ed 13.0 vwo 1 leerboek deel 1',
      isbn: '9789001304027',
    },
    {
      part: 'deel 2',
      name: 'Getal & Ruimte ed 13.0 vwo 1 leerboek deel 2',
      isbn: '9789001304034',
    },
  ],
  chapters: [
    {
      number: '3',
      part: 'deel 1',
      description: 'Grafieken en formules',
      paragraphs: [
        ['3.1', 'Assenstelsels en kwadranten', [127, 128, 129, 130, 131, 230, 231]],
        ['3.2', 'Regelmaat in assenstelsels', [132], 'deels'],
        [
          '3.3',
          'Grafieken in assenstelsels',
          [223, 224, 225, 226, 227, 228, 229],
          'deels',
          'Vormen vullen met water en een snelheidsgrafiek bij een circuit kun je hier nog niet oefenen.',
        ],
        ['3.4', 'Woordformules', [133, 134, 135, 136, 137, 232]],
        ['3.5', 'Formules met letters', [138, 139, 140, 141, 142, 236]],
        [
          '3.6',
          'Grafiek bij een formule',
          [1, 2, 3, 8, 11, 16],
          'deels',
          'Een formule opstellen uit een grafiek en uitrekenen wanneer iets leeg is kun je hier nog niet oefenen. Grafieken aflezen bij een verhaal oefen je bij 3.3.',
        ],
      ],
    },
  ],
};
