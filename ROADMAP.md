# Roadmap

Dit is een werkdocument om over de toekomst van Wiskundefit na te denken. De principes en besluiten staan vast. De fases en voorkeuren zijn voorstellen. Leg een besluit vast zodra het genomen is, met de reden erbij. Losse feedback en fouten horen in GitHub-issues.

Laatst bijgewerkt: 7 november 2026.

## Het doel

Nu oefent de site twee hoofdstukken van één boek voor havo 3. Op de lange termijn willen we:

1. meer hoofdstukken ondersteunen;
2. meer leerjaren en niveaus ondersteunen, bij voorkeur eerst alle leerjaren van de havo en daarna niveaus als vwo en vmbo;
3. onafhankelijk worden van één methode, of meerdere methodes ondersteunen.

We blijven voorlopig binnen het Nederlandse schoolstelsel.

## Principes

Al het werk wordt getoetst aan de grenzen en doelen in de [principes in AGENTS.md](AGENTS.md#principes).

## Besluiten

| Besluit                                                                                                                                                                | Reden                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| We bouwen voor leerlingen in het Nederlandse schoolstelsel. Docenten zijn de tweede doelgroep, voorlopig vooral om feedback te geven.                                  | Zo blijft duidelijk voor wie een functie is. Inloggen voor docenten is iets voor de verre toekomst.                                                                                                                                                                                               |
| We gebruiken het laagmodel uit deze roadmap, mits het haalbaar blijkt.                                                                                                 | Een nieuwe methode of een nieuw leerjaar wordt dan vooral een gegevensbestand. In fase 3 moet blijken of het werkt.                                                                                                                                                                               |
| De site krijgt echte adressen in plaats van hash-routes, met vooraf gebouwde HTML per onderwerp.                                                                       | De site moet vindbaar zijn via Google, en dat lukt niet met hash-routes en tekst die pas met JavaScript verschijnt. Adressen zijn later duur om te wijzigen.                                                                                                                                      |
| Vindbaarheid in AI-antwoorden krijgt geen eigen werk.                                                                                                                  | Echte adressen, duidelijke uitleg en een over-pagina helpen daar ook.                                                                                                                                                                                                                             |
| We volgen de AVG en bouwen zo dat er geen cookiebanner nodig is: geen cookies, of alleen functionele.                                                                  | Een banner zit leerlingen in de weg en we hebben geen gegevens over bezoekers nodig. Heeft iets toestemming nodig, dan bouwen we het niet.                                                                                                                                                        |
| We meten alleen anonieme totalen, in een vorm die geen toestemming nodig heeft, en we vragen hiervoor geen apart juridisch advies.                                     | We willen weten hoeveel de site wordt gebruikt en wat populair is. Daar zijn geen gegevens per leerling voor nodig.                                                                                                                                                                               |
| Inloggen heeft de laagste prioriteit.                                                                                                                                  | Het is niet nodig om te oefenen, en het brengt persoonsgegevens van vooral minderjarigen en een server met zich mee.                                                                                                                                                                              |
| Donaties, subsidie en een vergoeding van scholen mogen.                                                                                                                | Zo kunnen eventuele kosten worden betaald, zonder reclame of betaalmuur voor leerlingen.                                                                                                                                                                                                          |
| Elke release komt automatisch na een geslaagde deploy. Alleen de eigenaar besluit over een major-versie.                                                               | Niemand hoeft handmatig te publiceren, terwijl de eigenaar bepaalt wanneer er iets ingrijpends verandert.                                                                                                                                                                                         |
| De site zegt niet welke stof bij een toets hoort.                                                                                                                      | Dat hangt af van de methode en van wat de docent opgeeft. Leerlingen kiezen het zelf.                                                                                                                                                                                                             |
| Onderwerpen zijn de hoofdingang van de site. Het overzichtsscherm toont ze per domein, met daarboven een knop om uit je boek te kiezen.                                | Hoofdstukken verschillen sterk per methode, onderwerpen veel minder. Een leerling met een toets kan toch snel op paragraaf kiezen ([#10](https://github.com/angrymrt/wiskunde-fit/issues/10)). De navigatie wordt verder uitgewerkt in [#21](https://github.com/angrymrt/wiskunde-fit/issues/21). |
| Een onderwerp krijgt een plat adres zonder methode of leerjaar, zoals `/snijpunten-van-lijnen`.                                                                        | Juist de ordening verandert nog. Dezelfde titel kan in één methode twee keer voorkomen, dus de naam moet zeggen om welke stof het gaat.                                                                                                                                                           |
| Een methode-indeling koppelt elke paragraaf aan losse vraagsoorten en bevat ook wat we niet dekken.                                                                    | Een paragraaf past niet altijd op één onderwerp, en een vraag bestaat zo maar één keer. We dekken 10 van de 46 paragrafen van Getal & Ruimte havo 3, en een leerling moet zien wat ontbreekt.                                                                                                     |
| Een methode-indeling noemt een paragraaf op nummer per editie, met een korte eigen omschrijving. We nemen geen inhoudsopgave één op één over en geen creatieve titels. | Verwijzen helpt een leerling de juiste stof te kiezen, en de omschrijving laat zien of de editie klopt. In de zaak GEU tegen Snappet vond het hof het niet onrechtmatig om te zeggen dat materiaal aansluit op een methode. Dit is onze eigen inschatting en geen juridisch advies.               |
| We gebruiken de woorden uit [BEGRIPPEN.md](BEGRIPPEN.md).                                                                                                              | Eén ding heeft één naam. De termen sluiten aan op wat in het voortgezet onderwijs gebruikelijk is.                                                                                                                                                                                                |

## Waar we nu staan

De site staat op [wiskundefit.nl](https://wiskundefit.nl) met 12 paragrafen en 65 vraagsoorten. Hij is statisch, zonder accounts of tracking. Elke push naar `main` draait `npm test`, bouwt de site, zet hem online en maakt zo nodig een release. De stof is al goed gescheiden van de schermen, maar dit zit een uitbreiding in de weg:

| Wat                   | Waar                                          | Probleem                                                                                                                                                     |
| --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Id's van vraagsoorten | `paragraphs/index.js`                         | `1.1#0` hangt af van de volgorde in de lijst en is niet uniek over methodes en leerjaren.                                                                    |
| Voortgang             | `progress.js`                                 | Is opgeslagen onder die id's. Een nieuw schema heeft dus een migratie nodig.                                                                                 |
| Lijst met paragrafen  | `paragraphs/index.js`                         | Eén platte lijst met losse imports. Alles wordt altijd geladen.                                                                                              |
| Hoofdstukken          | `ui/home.js:42`, `progress.js` (`SCOPES`)     | Hoofdstuk 1 en 2, hun titels en de keuzes voor de proeftoets staan vast in de code. Een hoofdstuk is een getal, terwijl een methode ook `11A` kan gebruiken. |
| Kleuren per hoofdstuk | `styles.css` (`.c1`, `.c2`)                   | Er zijn maar twee hoofdstukkleuren.                                                                                                                          |
| Teksten               | `ui/home.js`, `ui/paragraph.js`, `index.html` | De titel en de voettekst gaan uit van deze ene methode.                                                                                                      |
| Adressen en HTML      | Hele site                                     | Er zijn geen URL's per scherm en de stof staat pas na JavaScript in de pagina. Je kunt niet naar een paragraaf linken en zoekmachines zien de stof slecht.   |
| Willekeurige vragen   | `paragraphs/`, `math.js`                      | Een vraag is niet te herhalen. Een foutmelding of een gedeelde proeftoets kan dus niet naar precies dezelfde vraag wijzen.                                   |
| Browsertest           | `tests/browser.e2e.js`                        | Duurt nu anderhalve minuut, groeit mee met de stof en draait alleen lokaal. Safari is alleen via WebKit te testen.                                           |

## Laagmodel: de vraagsoort als kern

Een methode is vooral een volgorde en een indeling van vraagsoorten. De site zelf ordenen we op onderwerp, en een methode-indeling koppelt een methode daaraan. Dit is de uitkomst van [#10](https://github.com/angrymrt/wiskunde-fit/issues/10). Daarom kiezen we, mits het haalbaar blijkt, voor deze lagen:

```text
Vraagsoort        stabiel id + generator
Onderwerp         uitleg, video's, vraagsoorten
Domein            onderwerpen die bij elkaar horen
Methode-indeling  methode, editie, niveau, leerjaar → hoofdstukken → paragrafen → vraagsoorten
```

Een nieuwe methode is dan vooral een nieuw gegevensbestand. Een methode-indeling krijgt een eigen naam, zoals `gr13-havo3`, want niveau en leerjaar zijn niet genoeg: in de bovenbouw komt het vak erbij en vmbo heeft leerwegen. Een boek is alleen een label bij een hoofdstuk, want hoofdstukken nummeren door over de boeken heen. Een stofkeuze is altijd een lijst vraagsoorten, of een leerling nu op paragraaf, hoofdstuk of onderwerp kiest. Oefenen en de proeftoets gebruiken dezelfde lijst.

We beginnen met twaalf onderwerpen. Negen paragrafen zijn eigenlijk al een onderwerp. Alleen `v1`, 1.1 en 1.2 lopen door elkaar en worden drie nieuwe onderwerpen.

| Domein                          | Onderwerpen                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Formules en grafieken           | Rekenen met een formule, Formule opstellen, Lijnen tekenen, Snijpunten van lijnen                       |
| Vergelijkingen en ongelijkheden | Lineaire vergelijkingen, Lineaire ongelijkheden, Vergelijkingen met twee variabelen                     |
| Meetkunde                       | Pythagoras, Verhoudingstabellen, Gelijkvormige driehoeken, Gelijkvormigheid aantonen, Lengtes berekenen |

We tonen alleen domeinen waar stof in zit. Voor een heel leerjaar lijken er drie bij te komen: herleiden, rekenen en procenten, en statistiek en kans. Een onderwerp kan makkelijk verhuizen, want het domein staat niet in het adres.

Ook is hergebruik lastiger dan het lijkt: "Evenwijdige lijnen" betekent iets anders in 1.1 dan in 2.1, en `s11coord`, `s12value` en `s15value` rekenen vrijwel hetzelfde uit met een andere notatie. Daarom zetten we de 65 vraagsoorten eerst één op één om en voegen we pas samen als dezelfde vraag en uitwerking echt in beide methodes passen.

Dit model moet nog bewijzen dat het werkt. De inhoudsopgaven van Getal & Ruimte en Moderne Wiskunde passen goed op deze onderwerpen ([#2](https://github.com/angrymrt/wiskunde-fit/issues/2)), maar over de werkwijze zeggen ze niets. Verschilt die per methode of niveau, dan krijgt een vraagsoort een variant of een eigen neutrale werkwijze, en moet de regel "volg de werkwijze van de methode" worden herzien. Adressen en id's blijven dan gelijk, dus dit houdt fase 3 niet op. Bij een video komt te staan bij welke methode die hoort.

## Fases

### Fase 1: de inhoud op orde

Afgerond in versie 1.3.0. Doel 1 gaat voor op nieuwe functies en nieuwe stof.

- [x] De vier plekken met `v: () => true` een echte controle geven, in `s12story` en `s23why` ([#5](https://github.com/angrymrt/wiskunde-fit/issues/5)).
- [x] Paragrafen 1.4, 1.5, 1.6 en 2.4 nakijken op overlap met het boek en op de juiste werkwijze ([#6](https://github.com/angrymrt/wiskunde-fit/issues/6)).
- [x] De indeling van hoofdstuk 1 en de titel van 2.4 gelijk maken aan het boek ([#8](https://github.com/angrymrt/wiskunde-fit/issues/8)).
- [x] Besloten dat de site niet zegt wat bij een toets hoort ([#7](https://github.com/angrymrt/wiskunde-fit/issues/7)).
- [x] Beslissen over de video's van Menno en de links aanpassen ([#1](https://github.com/angrymrt/wiskunde-fit/issues/1)).

### Fase 2: de basis op orde

Afgerond in versie 1.3.1, op de test op een echte iPhone na. De eigenaar heeft geen iPhone, dus die test blijft open voor wie er wel een heeft. Tot die tijd testen we alleen op WebKit, en dat zeggen we ook op de over-pagina.

- [x] Een over-pagina: wie erachter zit, geen band met uitgevers, hoe de stof is gemaakt en nagekeken, en een privacyverklaring.
- [x] Contact voor docenten, voorlopig met een `mailto:` naar een bestaand adres. Vervang dat door een adres op `wiskundefit.nl` zodra dat er is (`MAIL` in `ui/about.js`).
- [x] Titel, beschrijving en afbeelding voor linkvoorbeelden, zoals in WhatsApp.
- [x] Een PNG-icoon voor het beginscherm, en de browsertest ook kunnen draaien op WebKit, de motor van Safari.
- [ ] Testen op een echte iPhone. Dit kan alleen met de hand, en controleer dan ook het linkvoorbeeld en het icoon op het beginscherm ([#20](https://github.com/angrymrt/wiskunde-fit/issues/20)).
- [x] Toegankelijkheid: `axe-core` in de browsertest, en de focus goed zetten wanneer `render()` het scherm vervangt.
- [x] De melding over de toetsstof weghalen, want leerlingen kiezen zelf wat ze oefenen.
- [x] De regel "geen tracking" in `AGENTS.md` vervangen door "geen persoonsgegevens en geen cookies".

### Aanvullen: wat hoofdstuk 1 en 2 nog missen

Dit kan naast de andere fases, en doel 1 gaat voor op nieuwe functies. Zie open vraag 7 over het nakijken. De stof is aangevuld in versie 1.4.0 en met de theorie in het boek vergeleken in versie 1.5.0. Wat overblijft, kan niet zonder een docent. De [nakijklijst](NAKIJKEN.md) staat daarvoor klaar.

- [x] Zelf een grafiek laten tekenen ([#11](https://github.com/angrymrt/wiskunde-fit/issues/11)).
- [x] Een ongelijkheid of vergelijking opstellen uit een verhaal ([#12](https://github.com/angrymrt/wiskunde-fit/issues/12)).
- [x] Ongelijkheden waarbij je eerst het snijpunt berekent ([#13](https://github.com/angrymrt/wiskunde-fit/issues/13)).
- [x] De kubus en vlakke figuren bij 2.4 ([#14](https://github.com/angrymrt/wiskunde-fit/issues/14)).
- [x] De werkwijze van de andere paragrafen vergelijken met de theorie in het boek ([#15](https://github.com/angrymrt/wiskunde-fit/issues/15)).
- [x] De video's bij 1.4 controleren ([#16](https://github.com/angrymrt/wiskunde-fit/issues/16)).
- [ ] Een wiskundedocent de stof laten nakijken ([#17](https://github.com/angrymrt/wiskunde-fit/issues/17)).

### Fase 3: het fundament

Geen nieuwe stof, wel alles wat later duur wordt om te veranderen. Eén uitzondering: de uitleg van `v1`, 1.1 en 1.2 wordt opnieuw geordend en moet dus opnieuw worden nagekeken.

- [ ] De navigatie van de site ontwerpen, voordat we de adressen vastleggen ([#21](https://github.com/angrymrt/wiskunde-fit/issues/21)).
- [ ] Stabiele id's voor vraagsoorten, met een migratie van de bestaande voortgang.
- [ ] Onderwerpen en domeinen als structuur van de site. `v1`, 1.1 en 1.2 opdelen in Rekenen met een formule, Formule opstellen en Lijnen tekenen. Voorkennis wordt een verwijzing naar een gewoon onderwerp.
- [ ] Domeinen, onderwerpen, titels en kleuren uit gegevens halen in plaats van uit de schermcode.
- [ ] Een structuur voor methode-indelingen, voorlopig met alleen Getal & Ruimte havo 3. Daarin staan alle paragrafen op nummer, met een korte eigen omschrijving, ook de paragrafen die we niet dekken. Hoofdstuknummers zijn tekst.
- [ ] Een stofkeuze op paragraaf, hoofdstuk of onderwerp, voor oefenen en de proeftoets, in plaats van de vaste keuzes in `SCOPES`.
- [ ] Een knop op het overzichtsscherm om stof uit je boek te kiezen, met een melding bij wat we nog niet dekken.
- [ ] Echte adressen en vooraf gebouwde HTML per onderwerp, plus een pagina per methode-indeling die naar de onderwerpen verwijst, met een `staticwebapp.config.json` en een nette 404-pagina.
- [ ] Lettertypes en code uit de HTML halen, zodat de browser ze kan bewaren. Het losse bestand wordt een optionele export.
- [ ] Vragen met een seed, zodat elke vraag precies te herhalen is.
- [ ] Zoekmachines helpen: een sitemap, unieke titels en beschrijvingen.
- [ ] Anonieme totalen meten, nadat de echte adressen er zijn, met opslag in de EU en zonder unieke bezoekers. Zo kunnen we weergaven per onderwerp op de server tellen, zonder script en zonder iets op het apparaat. Tellers per functie alleen als ze geen toestemming nodig hebben ([#19](https://github.com/angrymrt/wiskunde-fit/issues/19)).
- [ ] De browsertest per methode-indeling kunnen draaien en bij een push laten meelopen.

Klaar als: een leerling kan oefenen op onderwerp en op paragraaf uit het eigen boek, opgeslagen voortgang behouden blijft en een nieuw hoofdstuk geen schermcode meer nodig heeft.

### Fase 4: fouten kunnen melden

- [ ] Een knop om per vraag een fout te melden, met de seed erbij.

### Fase 5: meer waarde voor leerlingen en docenten

- [ ] Een link waarmee een docent de juiste stof deelt, om te oefenen of voor een proeftoets ([#23](https://github.com/angrymrt/wiskunde-fit/issues/23)).
- [ ] Een pagina met cijfers over de stof: alle domeinen en onderwerpen, het aantal vraagsoorten en vragen, en groot bovenaan het totaal aantal vragen ([#22](https://github.com/angrymrt/wiskunde-fit/issues/22)).
- [ ] Een printversie van de proeftoets, met antwoorden.
- [ ] Een toetsplanner: "mijn toets is op vrijdag" geeft een oefenplan, opgeslagen op het apparaat zelf.
- [ ] Een oefenronde met je zwakste vaardigheden.
- [ ] Voortgang overzetten met een link of QR-code, zonder server.
- [ ] De site kunnen installeren en offline gebruiken.
- [ ] Een ingebouwde rekenmachine, vooral handig op de telefoon ([#18](https://github.com/angrymrt/wiskunde-fit/issues/18)).

Voor later, na de link voor docenten: een toetsnorm die een docent kan instellen, zodat het cijfer van een proeftoets dichter bij het echte resultaat komt ([#24](https://github.com/angrymrt/wiskunde-fit/issues/24)).

### Fase 6: uitbreiden op basis van echte signalen

- [ ] Eén extra hoofdstuk van havo 3 toevoegen en meten hoeveel werk dat kost. Hoofdstuk 3 is de logische volgende stap voor Getal & Ruimte, en goniometrie en herleiden helpen leerlingen van beide methodes tegelijk. Dat maakt ze ook de eerste echte test van de werkwijze.
- [ ] De werkwijze en een nakijklijst per hoofdstuk vastleggen in `AGENTS.md`.
- [ ] Daarna de rest van het leerjaar plannen.
- [ ] Beslissen over Moderne Wiskunde als tweede methode ([#2](https://github.com/angrymrt/wiskunde-fit/issues/2)). Nu dekken we daar nog te weinig van, en de werkwijze is nog niet vergeleken.
- [ ] De overige leerjaren van de havo toevoegen en daarna andere niveaus. Dit is de voorkeur, geen vast besluit. In de bovenbouw komen vakken als wiskunde A en B erbij.

### Fase 7: inloggen, alleen bij aantoonbare vraag

- [ ] Eerst nagaan of overzetten met een link te weinig is.
- [ ] Daarna een anonieme synccode, zonder e-mailadres. Dit vraagt om een kleine server.
- [ ] Pas daarna een optioneel account, met een privacyverklaring, verwijderen op verzoek en juridisch advies over leerlingen onder de 16.

Voor de verre toekomst: docenten die inloggen om de resultaten van hun leerlingen te bekijken en de stof af te stemmen op veelgemaakte fouten. Dat raakt direct de eerste grens, want het gaat om gegevens van leerlingen per persoon. Het vraagt dus om een apart besluit, juridisch advies en afspraken met scholen.

## Open vragen

Bij een vraag staat onze voorlopige voorkeur als die er is.

1. **Welke leerling staat voorop?** _Voorkeur: een leerling die binnenkort een toets heeft, het eigen boek en hoofdstuk kent en via een gedeelde link of Google binnenkomt._ Dit hangt samen met het verschil met het FLEX-aanbod ([#3](https://github.com/angrymrt/wiskunde-fit/issues/3)).
2. **Hoe ver willen we hiermee?** Hoeveel tijd is er beschikbaar, en hoe snel moet de site groeien?
3. **Wie staat buiten havo 3 in voor de wiskunde?** Doel 1 maakt dit de echte grens aan de groei.
4. **Indelen op methode of op onderwerp?** _Besloten: onderwerpen zijn de hoofdingang, en een methode-indeling is de manier om stof te kiezen ([#10](https://github.com/angrymrt/wiskunde-fit/issues/10))._
5. **Sluiten we aan bij Neon?** Dat kan de richting veranderen, want samenwerken ligt dan misschien meer voor de hand dan alles zelf bouwen ([#4](https://github.com/angrymrt/wiskunde-fit/issues/4)).
6. **Hoe maken we de stof op grote schaal?** Twee hoofdstukken kostten 65 vraagsoorten, dus een heel leerjaar wordt al snel een paar honderd. _Voorkeur: uitbreiden op basis van echte vraag en AI gebruiken als hulp, met de automatische controles en een menselijke nakijkronde._
7. **Wie controleert de wiskunde?** De `v`-functies vinden rekenfouten, maar geen slechte uitleg of een verkeerde aanpak. _Voorkeur: per hoofdstuk een nakijkronde, en een knop om een fout te melden._
8. **Wat mag er over boeken op de site?** _Besloten: we verwijzen naar de methode, de editie en het paragraafnummer, met een korte eigen omschrijving. De werkwijze volgen mag, zolang teksten, opgaven en uitwerkingen van onszelf zijn. Dit is onze eigen inschatting. Willen we complete titellijsten tonen of veel methodes toevoegen, dan laten we dit eerst nakijken door een advocaat ([#10](https://github.com/angrymrt/wiskunde-fit/issues/10))._
9. **Hoe gaan we om met het curriculum?** Moeten we aansluiten op landelijke leerdoelen? Dat kan helpen om onafhankelijk van een methode te worden. Onze domeinen lijken al op de conceptkerndoelen voor de onderbouw uit 2023, maar de nieuwste versie is nog niet vergeleken.
10. **Moet de opmaak mee veranderen?** De kleuren per hoofdstuk en de overzichtspagina zijn ontworpen voor twee hoofdstukken. Bij tien hoofdstukken moet het overzicht opnieuw worden doordacht. Dit hoort bij de navigatie ([#21](https://github.com/angrymrt/wiskunde-fit/issues/21)).

## Hier beginnen we

Fase 1 en 2 zijn af, op de test op een echte iPhone na ([#20](https://github.com/angrymrt/wiskunde-fit/issues/20)). Het voorstel over onderwerpen is uitgewerkt ([#10](https://github.com/angrymrt/wiskunde-fit/issues/10)). Zoek nu uit hoe de site verschilt van het FLEX-aanbod en of Neon past ([#3](https://github.com/angrymrt/wiskunde-fit/issues/3) en [#4](https://github.com/angrymrt/wiskunde-fit/issues/4)), want dat kan de keuzes voor fase 3 en verder veranderen. Ontwerp daarna de navigatie ([#21](https://github.com/angrymrt/wiskunde-fit/issues/21)) en maak een concreet plan voor stabiele id's, adressen en de migratie van de voortgang.
