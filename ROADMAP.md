# Roadmap

Dit is een werkdocument om over de toekomst van Wiskundefit na te denken. De principes en besluiten staan vast. De fases en voorkeuren zijn voorstellen. Leg een besluit vast zodra het genomen is, met de reden erbij. Losse feedback en fouten horen in GitHub-issues.

Laatst bijgewerkt: 6 november 2026.

## Het doel

Nu oefent de site twee hoofdstukken van één boek voor havo 3. Op de lange termijn willen we:

1. meer hoofdstukken ondersteunen;
2. meer leerjaren en niveaus ondersteunen, bij voorkeur eerst alle leerjaren van de havo en daarna niveaus als vwo en vmbo;
3. onafhankelijk worden van één boek, of meerdere boeken ondersteunen.

We blijven voorlopig binnen het Nederlandse schoolstelsel.

## Principes

Al het werk wordt getoetst aan de grenzen en doelen in de [principes in AGENTS.md](AGENTS.md#principes).

## Besluiten

| Besluit                                                                                                                               | Reden                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| We bouwen voor leerlingen in het Nederlandse schoolstelsel. Docenten zijn de tweede doelgroep, voorlopig vooral om feedback te geven. | Zo blijft duidelijk voor wie een functie is. Inloggen voor docenten is iets voor de verre toekomst.                                                          |
| We gebruiken het laagmodel uit deze roadmap, mits het haalbaar blijkt.                                                                | Een nieuw boek of leerjaar wordt dan vooral een gegevensbestand. In fase 3 moet blijken of het werkt.                                                        |
| De site krijgt echte adressen in plaats van hash-routes, met vooraf gebouwde HTML per les.                                            | De site moet vindbaar zijn via Google, en dat lukt niet met hash-routes en tekst die pas met JavaScript verschijnt. Adressen zijn later duur om te wijzigen. |
| Vindbaarheid in AI-antwoorden krijgt geen eigen werk.                                                                                 | Echte adressen, duidelijke uitleg en een over-pagina helpen daar ook.                                                                                        |
| We meten alleen anonieme totalen: weergaven per les en tellers per functie.                                                           | We willen weten hoeveel de site wordt gebruikt en wat populair is. Daar zijn geen gegevens per leerling voor nodig. Dit gaat pas live na juridisch advies.   |
| Inloggen heeft de laagste prioriteit.                                                                                                 | Het is niet nodig om te oefenen, en het brengt persoonsgegevens van vooral minderjarigen en een server met zich mee.                                         |
| Donaties, subsidie en een vergoeding van scholen mogen.                                                                               | Zo kunnen eventuele kosten worden betaald, zonder reclame of betaalmuur voor leerlingen.                                                                     |
| Elke release komt automatisch na een geslaagde deploy. Alleen de eigenaar besluit over een major-versie.                              | Niemand hoeft handmatig te publiceren, terwijl de eigenaar bepaalt wanneer er iets ingrijpends verandert.                                                    |

## Waar we nu staan

De site staat op [wiskundefit.nl](https://wiskundefit.nl) met 11 paragrafen en 49 soorten vragen. Hij is statisch, zonder accounts of tracking. Elke push naar `main` draait `npm test`, bouwt de site, zet hem online en maakt zo nodig een release. De lesstof is al goed gescheiden van de schermen, maar dit zit een uitbreiding in de weg:

| Wat                   | Waar                                          | Probleem                                                                                                                                                      |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Id's van vaardigheden | `paragraphs/index.js`                         | `1.1#0` hangt af van de volgorde in de lijst en is niet uniek over boeken en leerjaren.                                                                       |
| Voortgang             | `progress.js`                                 | Is opgeslagen onder die id's. Een nieuw schema heeft dus een migratie nodig.                                                                                  |
| Lijst met paragrafen  | `paragraphs/index.js`                         | Eén platte lijst met losse imports. Alles wordt altijd geladen.                                                                                               |
| Hoofdstukken          | `ui/home.js:42`, `progress.js` (`SCOPES`)     | Hoofdstuk 1 en 2, hun titels en de keuzes voor de proeftoets staan vast in de code.                                                                           |
| Kleuren per hoofdstuk | `styles.css` (`.c1`, `.c2`)                   | Er zijn maar twee hoofdstukkleuren.                                                                                                                           |
| Teksten               | `ui/home.js`, `ui/paragraph.js`, `index.html` | De titel, de voettekst en de melding bij `core: false` gaan uit van dit ene boek.                                                                             |
| Adressen en HTML      | Hele site                                     | Er zijn geen URL's per scherm en de lesstof staat pas na JavaScript in de pagina. Je kunt niet naar een paragraaf linken en zoekmachines zien de stof slecht. |
| Willekeurige vragen   | `paragraphs/`, `math.js`                      | Een vraag is niet te herhalen. Een foutmelding of een gedeelde proeftoets kan dus niet naar precies dezelfde vraag wijzen.                                    |
| Browsertest           | `tests/browser.e2e.js`                        | Duurt nu 59 seconden, groeit mee met de lesstof, draait alleen lokaal en test Safari niet.                                                                    |

## Laagmodel: de vaardigheid als kern

Een boek is vooral een volgorde en een indeling van vaardigheden. Daarom kiezen we, mits het haalbaar blijkt, voor drie lagen:

```text
Vaardigheid  stabiel id + generator
Les          uitleg, video's, vaardigheden (nu: de inhoud van een paragraafbestand)
Indeling     naam → hoofdstukken → paragrafen → lessen
```

Een boek en een boekonafhankelijke leerlijn zijn allebei een indeling. Een nieuw boek is dan vooral een nieuw gegevensbestand. De indeling krijgt een eigen naam, zoals `gr13-havo3`, want niveau en leerjaar zijn niet genoeg: in de bovenbouw komt het vak erbij en vmbo heeft leerwegen.

De les is nodig omdat uitleg en video's nu per paragraaf staan en niet één op één bij een vaardigheid horen. Ook is hergebruik lastiger dan het lijkt: "Evenwijdige lijnen" betekent iets anders in 1.1 dan in 2.1, en `s11coord`, `s12value` en `s15value` rekenen vrijwel hetzelfde uit met een andere notatie. Daarom zetten we de 49 vaardigheden eerst één op één om en voegen we pas samen als dezelfde vraag en uitwerking echt in beide indelingen passen.

Dit model moet nog bewijzen dat het werkt. De werkwijze en notatie kunnen per boek en niveau verschillen, en de regel "volg de werkwijze van het boek" moet dan worden herzien.

## Fases

### Fase 1: de inhoud op orde

Doel 1 gaat voor op nieuwe functies en nieuwe stof.

- [x] De vier plekken met `v: () => true` een echte controle geven, in `s12story` en `s23why` ([#5](https://github.com/angrymrt/wiskunde-fit/issues/5)).
- [ ] Paragrafen 1.4, 1.5, 1.6 en 2.4 nakijken op overlap met het boek en op de juiste werkwijze, zodra dat materiaal beschikbaar is ([#6](https://github.com/angrymrt/wiskunde-fit/issues/6)).
- [ ] Laten bevestigen of die paragrafen bij de toetsstof horen ([#7](https://github.com/angrymrt/wiskunde-fit/issues/7)).
- [ ] Beslissen over de video's van Menno en de links aanpassen ([#1](https://github.com/angrymrt/wiskunde-fit/issues/1)).

### Fase 2: de basis op orde

- [ ] Een over-pagina: wie erachter zit, geen band met uitgevers, hoe de stof is gemaakt en nagekeken, en een privacyverklaring.
- [ ] Contact voor docenten, om te beginnen met een `mailto:` naar een eigen adres.
- [ ] Titel, beschrijving en afbeelding voor linkvoorbeelden, zoals in WhatsApp.
- [ ] Testen op Safari en iPhone, en een PNG-icoon voor het beginscherm.
- [ ] Toegankelijkheid: `axe-core` in de browsertest, en de focus goed zetten wanneer `render()` het scherm vervangt.
- [ ] De melding bij `core: false` herschrijven, want die gaat uit van één klas.

### Fase 3: het fundament

Geen nieuwe lesstof, wel alles wat later duur wordt om te veranderen.

- [ ] Stabiele id's voor vaardigheden, met een migratie van de bestaande voortgang.
- [ ] Hoofdstukken, titels en kleuren uit gegevens halen in plaats van uit de schermcode.
- [ ] Een structuur voor indelingen, voorlopig met alleen Getal & Ruimte havo 3.
- [ ] Echte adressen en vooraf gebouwde HTML per les, met een `staticwebapp.config.json` en een nette 404-pagina.
- [ ] Lettertypes en code uit de HTML halen, zodat de browser ze kan bewaren. Het losse bestand wordt een optionele export.
- [ ] Vragen met een seed, zodat elke vraag precies te herhalen is.
- [ ] Zoekmachines helpen: een sitemap, unieke titels en beschrijvingen.
- [ ] De browsertest per indeling kunnen draaien en bij een push laten meelopen.

Klaar als: de site er hetzelfde uitziet, opgeslagen voortgang behouden blijft en een nieuw hoofdstuk geen schermcode meer nodig heeft.

### Fase 4: leren wat werkt

- [ ] Juridisch laten nakijken welke vorm van anonieme statistieken mag.
- [ ] De regel "geen tracking" in `AGENTS.md` vervangen door "geen persoonsgegevens en geen cookies".
- [ ] Weergaven per les en tellers per functie meten, met opslag in de EU en het script op onze eigen site. Unieke bezoekers alleen als het juridische advies dat toelaat.
- [ ] Een knop om per vraag een fout te melden, met de seed erbij.

### Fase 5: meer waarde voor leerlingen en docenten

- [ ] Een link naar een proeftoets met gekozen stof, die een docent kan delen.
- [ ] Een printversie van de proeftoets, met antwoorden.
- [ ] Een toetsplanner: "mijn toets is op vrijdag" geeft een oefenplan, opgeslagen op het apparaat zelf.
- [ ] Een oefenronde met je zwakste vaardigheden.
- [ ] Voortgang overzetten met een link of QR-code, zonder server.
- [ ] De site kunnen installeren en offline gebruiken.

### Fase 6: uitbreiden op basis van echte signalen

- [ ] Eén extra hoofdstuk van havo 3 toevoegen en meten hoeveel werk dat kost.
- [ ] De werkwijze en een nakijklijst per hoofdstuk vastleggen in `AGENTS.md`.
- [ ] Daarna de rest van het leerjaar plannen.
- [ ] Beslissen over Moderne Wiskunde als tweede boek ([#2](https://github.com/angrymrt/wiskunde-fit/issues/2)).
- [ ] De overige leerjaren van de havo toevoegen en daarna andere niveaus. Dit is de voorkeur, geen vast besluit. In de bovenbouw komen vakken als wiskunde A en B erbij.
- [ ] Een weergave op onderwerp, voor wie geen boek wil kiezen.

### Fase 7: inloggen, alleen bij aantoonbare vraag

- [ ] Eerst nagaan of overzetten met een link te weinig is.
- [ ] Daarna een anonieme synccode, zonder e-mailadres. Dit vraagt om een kleine server.
- [ ] Pas daarna een optioneel account, met een privacyverklaring, verwijderen op verzoek en juridisch advies over leerlingen onder de 16.

Voor de verre toekomst: docenten die inloggen om de resultaten van hun leerlingen te bekijken en de lesstof af te stemmen op veelgemaakte fouten. Dat raakt direct de eerste grens, want het gaat om gegevens van leerlingen per persoon. Het vraagt dus om een apart besluit, juridisch advies en afspraken met scholen.

## Open vragen

Bij een vraag staat onze voorlopige voorkeur als die er is.

1. **Welke leerling staat voorop?** _Voorkeur: een leerling die binnenkort een toets heeft, het eigen boek en hoofdstuk kent en via een gedeelde link of Google binnenkomt._ Dit hangt samen met het verschil met het FLEX-aanbod ([#3](https://github.com/angrymrt/wiskunde-fit/issues/3)).
2. **Hoe ver willen we hiermee?** Hoeveel tijd is er beschikbaar, en hoe snel moet de site groeien?
3. **Wie staat buiten havo 3 in voor de wiskunde?** Doel 1 maakt dit de echte grens aan de groei.
4. **Indelen op boek of op onderwerp?** _Voorkeur: voor de leerling het boek als gewone ingang, en onderwerp als terugvaloptie. Intern geen onderwerpenboom, maar de drie lagen uit het laagmodel._
5. **Sluiten we aan bij Neon?** Dat kan de richting veranderen, want samenwerken ligt dan misschien meer voor de hand dan alles zelf bouwen ([#4](https://github.com/angrymrt/wiskunde-fit/issues/4)).
6. **Hoe maken we de lesstof op grote schaal?** Twee hoofdstukken kostten 49 soorten vragen, dus een heel leerjaar wordt al snel een paar honderd. _Voorkeur: uitbreiden op basis van echte vraag en AI gebruiken als hulp, met de automatische controles en een menselijke nakijkronde._
7. **Wie controleert de wiskunde?** De `v`-functies vinden rekenfouten, maar geen slechte uitleg of een verkeerde aanpak. _Voorkeur: per hoofdstuk een nakijkronde, en een knop om een fout te melden._
8. **Wat mag er over boeken op de site?** Mogen we titels en paragraafnummers van uitgevers noemen en de werkwijze volgen? Dat is belangrijk voordat we meer boeken toevoegen. _Voorkeur: alleen eigen teksten en voorbeelden. Dit moet nog juridisch worden nagevraagd, en deze roadmap geeft daarover geen uitsluitsel._
9. **Hoe gaan we om met het curriculum?** Moeten we aansluiten op landelijke leerdoelen? Dat kan helpen om onafhankelijk van een boek te worden, maar dat moet nog worden uitgezocht.
10. **Moet de opmaak mee veranderen?** De kleuren per hoofdstuk en de overzichtspagina zijn ontworpen voor twee hoofdstukken. Bij tien hoofdstukken moet het overzicht opnieuw worden doordacht.

## Hier beginnen we

Begin met fase 1. Zoek ondertussen uit hoe de site verschilt van het FLEX-aanbod en of Neon past ([#3](https://github.com/angrymrt/wiskunde-fit/issues/3) en [#4](https://github.com/angrymrt/wiskunde-fit/issues/4)), want dat kan de keuzes voor fase 3 en verder veranderen. Maak voor fase 3 een concreet plan voor stabiele id's, adressen en de migratie van de voortgang.
