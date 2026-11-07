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

| Besluit                                                                                                                                                                           | Reden                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| We bouwen voor leerlingen in het Nederlandse schoolstelsel. Docenten zijn de tweede doelgroep, voorlopig vooral om feedback te geven.                                             | Zo blijft duidelijk voor wie een functie is. Inloggen voor docenten is iets voor de verre toekomst.                                                                                                                                                                                                                 |
| We gebruiken het laagmodel uit deze roadmap, mits het haalbaar blijkt.                                                                                                            | Een nieuwe methode of een nieuw leerjaar wordt dan vooral een gegevensbestand. In fase 3 moet blijken of het werkt.                                                                                                                                                                                                 |
| De site krijgt echte adressen in plaats van hash-routes, met vooraf gebouwde HTML per onderwerp.                                                                                  | De site moet vindbaar zijn via Google, en dat lukt niet met hash-routes en tekst die pas met JavaScript verschijnt. Adressen zijn later duur om te wijzigen.                                                                                                                                                        |
| Vindbaarheid in AI-antwoorden krijgt geen eigen werk.                                                                                                                             | Echte adressen, duidelijke uitleg en een over-pagina helpen daar ook.                                                                                                                                                                                                                                               |
| We volgen de AVG en bouwen zo dat er geen cookiebanner nodig is: geen cookies, of alleen functionele.                                                                             | Een banner zit leerlingen in de weg en we hebben geen gegevens over bezoekers nodig. Heeft iets toestemming nodig, dan bouwen we het niet.                                                                                                                                                                          |
| We meten alleen anonieme totalen, in een vorm die geen toestemming nodig heeft, en we vragen hiervoor geen apart juridisch advies.                                                | We willen weten hoeveel de site wordt gebruikt en wat populair is. Daar zijn geen gegevens per leerling voor nodig.                                                                                                                                                                                                 |
| Inloggen heeft de laagste prioriteit.                                                                                                                                             | Het is niet nodig om te oefenen, en het brengt persoonsgegevens van vooral minderjarigen en een server met zich mee.                                                                                                                                                                                                |
| Donaties, subsidie en een vergoeding van scholen mogen.                                                                                                                           | Zo kunnen eventuele kosten worden betaald, zonder reclame of betaalmuur voor leerlingen.                                                                                                                                                                                                                            |
| Elke release komt automatisch na een geslaagde deploy. Alleen de eigenaar besluit over een major-versie.                                                                          | Niemand hoeft handmatig te publiceren, terwijl de eigenaar bepaalt wanneer er iets ingrijpends verandert.                                                                                                                                                                                                           |
| De site zegt niet welke stof bij een toets hoort.                                                                                                                                 | Dat hangt af van de methode en van wat de docent opgeeft. Leerlingen kiezen het zelf.                                                                                                                                                                                                                               |
| Onderwerpen zijn de hoofdingang van de site. Het overzichtsscherm toont ze per domein, met daarboven een knop om uit je boek te kiezen.                                           | Hoofdstukken verschillen sterk per methode, onderwerpen veel minder. Een leerling met een toets kan toch snel op paragraaf kiezen ([#10](https://github.com/angrymrt/wiskunde-fit/issues/10)). De navigatie wordt verder uitgewerkt in [#21](https://github.com/angrymrt/wiskunde-fit/issues/21).                   |
| Een onderwerp krijgt een plat adres zonder methode of leerjaar, zoals `/snijpunten-van-lijnen`.                                                                                   | Juist de ordening verandert nog. Dezelfde titel kan in één methode twee keer voorkomen, dus de naam moet zeggen om welke stof het gaat.                                                                                                                                                                             |
| Een methode-indeling koppelt elke paragraaf aan losse vraagsoorten en bevat ook wat we niet dekken.                                                                               | Een paragraaf past niet altijd op één onderwerp, en een vraag bestaat zo maar één keer. We dekken 10 van de 46 paragrafen van Getal & Ruimte havo 3, en een leerling moet zien wat ontbreekt.                                                                                                                       |
| Een methode-indeling noemt een paragraaf op nummer per editie, met een korte eigen omschrijving. We nemen geen inhoudsopgave één op één over en geen creatieve titels.            | Verwijzen helpt een leerling de juiste stof te kiezen, en de omschrijving laat zien of de editie klopt. In de zaak GEU tegen Snappet vond het hof het niet onrechtmatig om te zeggen dat materiaal aansluit op een methode. Dit is onze eigen inschatting en geen juridisch advies.                                 |
| We gebruiken de woorden uit [BEGRIPPEN.md](BEGRIPPEN.md).                                                                                                                         | Eén ding heeft één naam. De termen sluiten aan op wat in het voortgezet onderwijs gebruikelijk is.                                                                                                                                                                                                                  |
| Een stofkeuze heeft één eigen plek: het scherm Jouw stof, met de gekozen stof, de uitleg, oefenen, de proeftoets en wat we niet dekken.                                           | Een paragraaf kan maar een deel van een onderwerp beslaan. Op een eigen scherm blijven uitleg en oefenen toch bij elkaar en is te zien wat ontbreekt ([#21](https://github.com/angrymrt/wiskunde-fit/issues/21)).                                                                                                   |
| Het overzichtsscherm toont alle onderwerpen open. Een domein krijgt geen eigen adres. Inklappen komt pas als de lijst te lang wordt.                                              | Bij twaalf onderwerpen is elk onderwerp zo één tik weg. Een domein kan nog verhuizen, en een adres extra moeten we stabiel houden.                                                                                                                                                                                  |
| Een onderwerp heeft twee tabbladen: Uitleg en Oefenen. De video's staan bij de uitleg.                                                                                            | Zo zijn de video's beter te vinden en is er een adres minder om stabiel te houden.                                                                                                                                                                                                                                  |
| Het adres van een onderwerp is de titel in kleine letters met streepjes.                                                                                                          | Eén ding heeft één naam. Daarom is een titel precies genoeg om later niet te botsen, ook als die daardoor iets langer wordt.                                                                                                                                                                                        |
| Adressen staan los van de voortgang. De voortgang hangt alleen aan het vaste id van een vraagsoort.                                                                               | Zo kunnen we een naam, adres, onderwerp of volgorde later wijzigen zonder dat een leerling voortgang kwijtraakt.                                                                                                                                                                                                    |
| Elke methode-indeling heeft een eigen adres onder `/methode-indeling`. Een methode alleen krijgt geen adres. Je vindt de juiste indeling via niveau, leerjaar, methode en editie. | Een methode-indeling is precies wat op de pagina staat, terwijl een boek maar één deel is. Paragrafen en dekking verschillen per editie, niveau en leerjaar, dus pas daar valt iets te kiezen.                                                                                                                      |
| Voorkennis is een kenmerk van een onderwerp en geen gekozen stof. De uitleg verwijst ernaar, en het telt niet mee in de proeftoets.                                               | Wat in een boek voorkennis heet, is meestal een onderwerp uit een eerder leerjaar. Zo hoeft een methode-indeling geen voorkennis te bevatten, en krijgt een leerling in een proeftoets geen vragen over stof van vorig jaar, tenzij die dat zelf kiest ([#27](https://github.com/angrymrt/wiskunde-fit/issues/27)). |
| Elk leerjaar krijgt per editie één methode-indeling. Het gewone leerboek en het FLEX-boek van een deel horen daar allebei bij, elk met de volledige naam en het ISBN.             | Zo weten we precies over welk boek het gaat. De paragrafen lijken gelijk: bij deel 1 van havo 3 klopt elke paragraaf en elk paginanummer. De andere delen zijn nog niet vergeleken.                                                                                                                                 |
| Een vraagsoort mag in meer methode-indelingen staan. Is de stof niet met dat boek vergeleken, dan is de paragraaf deels gedekt en zegt de pagina dat.                             | De stof van havo 3 past soms al bij leerjaar 1 en 2, zoals de stelling van Pythagoras, en de voortgang telt overal mee. Zo zien leerlingen wat er is, en zeggen we eerlijk wat niet is nagekeken.                                                                                                                   |
| We beginnen met de 13e editie van Getal & Ruimte. De 14e editie van leerjaar 1 en 2 komt later als eigen methode-indeling.                                                        | De 13e editie sluit aan op havo 3, waarvan nog geen 14e editie bestaat.                                                                                                                                                                                                                                             |
| De proeftoets gaat altijd over Jouw stof. Zonder stofkeuze kies je eerst: uit je boek, op onderwerp of alle stof.                                                                 | Alle stof als vaste keuze werkt niet meer zodra er stof van andere leerjaren bijkomt.                                                                                                                                                                                                                               |

## Waar we nu staan

De site staat op [wiskundefit.nl](https://wiskundefit.nl) met 12 onderwerpen en 65 vraagsoorten. Hij is statisch, zonder accounts of tracking. Elke push naar `main` draait `npm test`, bouwt de site, zet hem online en maakt zo nodig een release. De stof is al goed gescheiden van de schermen, maar dit zit een uitbreiding in de weg:

| Wat                   | Waar                                                | Probleem                                                                                                                                                   |
| --------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lijst met onderwerpen | `topics/index.js`                                   | Eén platte lijst met losse imports. Alles wordt altijd geladen.                                                                                            |
| Hoofdstukken          | `progress.js` (`SCOPES`), `ch` in `topics/index.js` | De keuzes voor de proeftoets gaan nog over hoofdstuk 1 en 2. Dat is tijdelijk, tot de stofkeuze er is.                                                     |
| Teksten               | `ui/home.js`, `index.html`                          | De titel en de voettekst gaan uit van deze ene methode.                                                                                                    |
| Adressen en HTML      | Hele site                                           | Er zijn geen URL's per scherm en de stof staat pas na JavaScript in de pagina. Je kunt niet naar een onderwerp linken en zoekmachines zien de stof slecht. |
| Willekeurige vragen   | `topics/`, `math.js`                                | Een vraag is niet te herhalen. Een foutmelding of een gedeelde proeftoets kan dus niet naar precies dezelfde vraag wijzen.                                 |
| Browsertest           | `tests/browser.e2e.js`                              | Duurt nu anderhalve minuut, groeit mee met de stof en draait alleen lokaal. Safari is alleen via WebKit te testen.                                         |

## Laagmodel: de vraagsoort als kern

Een methode is vooral een volgorde en een indeling van vraagsoorten. De site zelf ordenen we op onderwerp, en een methode-indeling koppelt een methode daaraan. Dit is de uitkomst van [#10](https://github.com/angrymrt/wiskunde-fit/issues/10). Daarom kiezen we, mits het haalbaar blijkt, voor deze lagen:

```text
Vraagsoort        vast id + naam + generator
Onderwerp         adres + uitleg, video's, vraagsoorten
Domein            onderwerpen die bij elkaar horen
Methode-indeling  methode, editie, niveau, leerjaar → hoofdstukken → paragrafen → vraagsoorten
```

Een nieuwe methode is dan vooral een nieuw gegevensbestand. Een methode-indeling krijgt een eigen naam, zoals `gr13-havo3`, want niveau en leerjaar zijn niet genoeg: in de bovenbouw komt het vak erbij en vmbo heeft leerwegen. Een boek is alleen een label bij een hoofdstuk, want hoofdstukken nummeren door over de boeken heen. Een stofkeuze is altijd een lijst vraagsoorten, of een leerling nu op paragraaf, hoofdstuk of onderwerp kiest. Oefenen en de proeftoets gebruiken dezelfde lijst.

We beginnen met twaalf onderwerpen. Negen paragrafen waren eigenlijk al een onderwerp. Alleen `v1`, 1.1 en 1.2 liepen door elkaar en zijn drie nieuwe onderwerpen geworden.

| Domein                          | Onderwerpen                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Formules en grafieken           | Rekenen met een formule, Lineaire grafieken tekenen, Lineaire formule opstellen, Snijpunten van lijnen                               |
| Vergelijkingen en ongelijkheden | Lineaire vergelijkingen, Lineaire ongelijkheden, Vergelijkingen met twee variabelen                                                  |
| Meetkunde                       | Stelling van Pythagoras, Verhoudingstabellen, Gelijkvormige driehoeken, Gelijkvormigheid aantonen, Lengtes van lijnstukken berekenen |

We tonen alleen domeinen waar stof in zit. We hebben de inhoudsopgaven van de havo van Getal & Ruimte en Moderne Wiskunde gelezen, alleen de titels. Daaruit volgt dit voorstel voor de hele havo, in onze eigen woorden: Getallen en rekenen, Rekenen met letters, Formules en grafieken, Vergelijkingen en ongelijkheden, Veranderingen, Meetkunde, Statistiek, en Kansrekening en combinatoriek. Een onderwerp kan makkelijk verhuizen, want het domein staat niet in het adres.

Dezelfde stof komt in meer leerjaren terug. Lineaire formules zitten bijvoorbeeld in leerjaar 1, 2 en 3 en bij wiskunde A en B, en ongelijkheden staan bij de ene methode in leerjaar 2 en bij de andere in leerjaar 3. Een onderwerp groeit dus mee, en de methode-indeling kiest per paragraaf de passende vraagsoorten. Wat een boek voorkennis noemt, is meestal zo'n onderwerp uit een eerder leerjaar. Het volgt dan vanzelf uit de voorkennis van het onderwerp, en hoort niet in de methode-indeling.

Ook is hergebruik lastiger dan het lijkt: "Evenwijdige lijnen" betekent iets anders in 1.1 dan in 2.1, en `s11coord`, `s12value` en `s15value` rekenen vrijwel hetzelfde uit met een andere notatie. Daarom zetten we de 65 vraagsoorten eerst één op één om en voegen we pas samen als dezelfde vraag en uitwerking echt in beide methodes passen.

Dit model moet nog bewijzen dat het werkt. De inhoudsopgaven van Getal & Ruimte en Moderne Wiskunde passen goed op deze onderwerpen ([#2](https://github.com/angrymrt/wiskunde-fit/issues/2)), maar over de werkwijze zeggen ze niets. Verschilt die per methode of niveau, dan krijgt een vraagsoort een variant of een eigen neutrale werkwijze, en moet de regel "volg de werkwijze van de methode" worden herzien. Adressen en id's blijven dan gelijk, dus dit houdt fase 3 niet op. Bij een video komt te staan bij welke methode die hoort.

## Navigatie

Dit is de uitkomst van [#21](https://github.com/angrymrt/wiskunde-fit/issues/21). Een gewijzigd adres kost een doorverwijzing en mag geen bestaande links breken, dus deze ligt vast voordat we bouwen.

```text
/                                             overzichtsscherm: onderwerpen per domein
/snijpunten-van-lijnen                        onderwerp: uitleg en video's, vooraf gebouwd
/snijpunten-van-lijnen/oefenen                oefenen, ?soort=... kiest een vraagsoort
/methode-indeling                             kies niveau, leerjaar, methode en editie
/methode-indeling/getal-en-ruimte-13-havo-3   paragrafen, dekking en vinkjes
/jouw-stof                                    de stofkeuze bekijken en wijzigen, ook op onderwerp
/jouw-stof/oefenen                            de stofkeuze door elkaar oefenen
/proeftoets                                   instellen, maken en uitslag
/over                                         over de site, privacy en contact
```

De namen `methode-indeling`, `boek`, `jouw-stof`, `proeftoets`, `over` en `cijfers` zijn gereserveerd en mogen geen adres van een onderwerp worden. Een test bewaakt dat.

**Id's en adressen**

Een id is voor de site en verandert nooit. Een adres is voor mensen en mag wel veranderen.

- De voortgang en de stofkeuze bewaren alleen id's van vraagsoorten. De voortgang van een onderwerp, paragraaf of domein wordt daaruit berekend en niet opgeslagen. Zo verhuist de voortgang vanzelf mee als een vraagsoort naar een ander onderwerp gaat.
- Een id is een geheel getal dat we doortellen en nooit opnieuw gebruiken. Het zegt dus niets over de plek van een vraagsoort: geen paragraafnummer, geen methode en geen volgorde. Dat is het verschil met `1.1#0`. Het adres bevat al leesbare tekst, dus die hoeft niet nog een keer in het id. Zo blijft ook een link met een stofkeuze kort, zoals `?stof=3,7,12`.
- Een onderwerp krijgt voorlopig geen eigen id, want we slaan er niets op op. Domeinen en verwijzingen naar voorkennis gebruiken in de code het onderwerp zelf, zodat een nieuw adres maar op één plek staat. Is een id later toch nodig, dan kan dat er zonder migratie bij.
- Krijgt een onderwerp een nieuw adres, dan blijft het oude adres in de gegevens staan. De build maakt daar een doorverwijzing van, zodat links van docenten en zoekresultaten blijven werken.
- Links met `?soort=` en `?stof=` gebruiken id's, dus die overleven een nieuwe naam ook.
- Stopt een vraagsoort of wordt die gesplitst, dan legt een tabel vast waar het id naartoe gaat, of dat het vervalt. Een test vergelijkt de id's met een lijst van alle eerder gebruikte id's, zodat er geen id ongemerkt verdwijnt of opnieuw wordt gebruikt.

**Bewegen door de site**

- Het hoofdmenu bevat Overzicht, Jouw stof en Proeftoets.
- Boven de titel van een onderwerp staat `Overzicht › Meetkunde`. Die tweede link gaat naar `/#meetkunde`.
- Een onderwerp noemt bovenaan de voorkennis, als die er is, en onderaan het volgende onderwerp in het domein.
- Oefenen op een onderwerp verandert de stofkeuze niet. De voortgang telt per vraagsoort, dus die telt overal mee.

**Het overzichtsscherm**

- De hoofdknop is `Oefen voor je toets: kies uit je boek`, of `Verder met jouw stof` als er al een stofkeuze is. Daarnaast staat `Maak een proeftoets`. De knop `Begin met ...`, die het onderwerp met de laagste voortgang kiest, vervalt.
- Elk domein krijgt een eigen kleur, in plaats van elk hoofdstuk. Is een domein leeg, dan tonen we het niet.
- De zin over Getal & Ruimte verhuist naar de pagina's onder `/methode-indeling` en de over-pagina, want het overzicht hoort niet meer bij één methode.

**Stof kiezen en dekking**

- `/methode-indeling` is een eenvoudig scherm met vier keuzelijsten: niveau, leerjaar, methode en editie. Elke lijst toont alleen wat bij de eerdere keuzes bestaat, en je gaat verder met een knop, zodat een schermlezer niet ongevraagd van pagina wisselt. Is er maar één mogelijkheid, dan staat die al ingevuld. In de bovenbouw komt het vak erbij, en een boek hoort daar niet altijd bij één leerjaar. In de onderbouw bestaan `havo/vwo` en `vmbo-t/havo` naast elkaar, en de nieuwste editie kan per leerjaar verschillen. Er zijn nu methode-indelingen voor `havo/vwo` en `havo`, dus werk dit uit bij het bouwen van dit scherm. Zonder JavaScript zie je een gewone lijst met links, die ook zoekmachines kunnen lezen.
- Op de site blijft de knop "Kies uit je boek" heten, want zo zegt een leerling het. Alleen het adres gebruikt het woord methode-indeling.
- `/methode-indeling/...` is een gewone pagina die zonder JavaScript leesbaar blijft: paragrafen op nummer, met een korte eigen omschrijving en links naar de onderwerpen. JavaScript voegt de vinkjes toe.
- Bij een paragraaf zonder vraagsoorten staat "Dit kun je hier nog niet oefenen." Bij een deels gedekte paragraaf staat wat er wel is.
- Staat je boek er niet bij, dan verwijst `/methode-indeling` naar kiezen op onderwerp op `/jouw-stof`.
- Later kunnen landingspagina's onder `/boek/...` helpen om via Google snel bij de juiste stof te komen. Daarom is `boek` gereserveerd. Dit bouwen we nu niet ([#25](https://github.com/angrymrt/wiskunde-fit/issues/25)).
- Later, voor [#23](https://github.com/angrymrt/wiskunde-fit/issues/23): een link van een docent wijst naar `/jouw-stof?stof=...`. De leerling bevestigt die keuze, zodat de eigen stofkeuze niet ongevraagd verdwijnt.

**Techniek**

- Alles waarmee je ergens heen gaat, wordt een gewone link. De tabbladen worden ook links, met `aria-current="page"`, want ze hebben nu eigen adressen.
- De schermen blijven wisselen met `render()`, nu met `pushState` en `popstate`. Zo overleeft een half gemaakte vraag of een lopende proeftoets de terugknop. De vooraf gebouwde HTML is er voor de eerste keer laden en voor zoekmachines.
- `?soort=` en later `&seed=` werken zonder eigen pagina. Daar kan de foutmelding uit fase 4 op voortbouwen.
- Een eigen pagina met cijfers ([#22](https://github.com/angrymrt/wiskunde-fit/issues/22)) krijgt `/cijfers`, met een link in de voettekst.

**Meegroeien**

Bij ongeveer dertig onderwerpen maken we de domeinen inklapbaar met `<details>`. Komen er meer leerjaren, dan filtert het overzicht op het gekozen boek. Dat bouwen we nu niet, en de platte adressen houden het open.

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

- [x] De navigatie van de site ontwerpen, voordat we de adressen vastleggen ([#21](https://github.com/angrymrt/wiskunde-fit/issues/21)). Zie [Navigatie](#navigatie).
- [x] Vaste id's voor vraagsoorten, los van adressen, met een migratie van de bestaande voortgang en een test die de id's bewaakt.
- [ ] De migratie van oude voortgang vanaf 1 december 2026 weer verwijderen ([#26](https://github.com/angrymrt/wiskunde-fit/issues/26)).
- [x] Onderwerpen en domeinen als structuur van de site. `v1`, 1.1 en 1.2 opdelen in Rekenen met een formule, Lineaire grafieken tekenen en Lineaire formule opstellen. De uitleg daarvan moet opnieuw worden nagekeken. Voorkennis wordt een verwijzing naar een gewoon onderwerp. De video's verhuizen naar de uitleg.
- [x] Domeinen, onderwerpen, titels en kleuren uit gegevens halen in plaats van uit de schermcode.
- [x] Een structuur voor methode-indelingen, voorlopig met de 13e editie van Getal & Ruimte: havo/vwo 1, havo/vwo 2 en havo 3. Daarin staan alle paragrafen op nummer, met een korte eigen omschrijving, ook de paragrafen die we niet dekken. Hoofdstuknummers zijn tekst. De site gebruikt de gegevens nog niet.
- [ ] Een stofkeuze op paragraaf, hoofdstuk of onderwerp, voor oefenen en de proeftoets, in plaats van de vaste keuzes in `SCOPES`. Het scherm Jouw stof wordt de plek daarvoor. De oude keuzes voor hoofdstuk 1, hoofdstuk 2 of alles worden een stofkeuze.
- [ ] Een knop op het overzichtsscherm om stof uit je boek te kiezen, met een melding bij wat we nog niet dekken.
- [ ] Het blok "Liever kijken?" bij de uitleg verbeteren ([#30](https://github.com/angrymrt/wiskunde-fit/issues/30)).
- [ ] Echte adressen en vooraf gebouwde HTML per onderwerp, plus een pagina per methode-indeling die naar de onderwerpen verwijst, met een `staticwebapp.config.json` en een nette 404-pagina. Controleer daarna de terugknop, een telefoon en een schermlezer.
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
- [ ] Bij veel fouten voorstellen om de voorkennis aan Jouw stof toe te voegen, alleen op het apparaat en altijd als keuze van de leerling ([#27](https://github.com/angrymrt/wiskunde-fit/issues/27)).
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
10. **Moet de opmaak mee veranderen?** _Besloten: elk domein krijgt een eigen kleur en het overzicht toont de onderwerpen per domein. Zie [Navigatie](#navigatie) voor hoe het meegroeit ([#21](https://github.com/angrymrt/wiskunde-fit/issues/21))._

## Hier beginnen we

Fase 1 en 2 zijn af, op de test op een echte iPhone na ([#20](https://github.com/angrymrt/wiskunde-fit/issues/20)). Het voorstel over onderwerpen is uitgewerkt ([#10](https://github.com/angrymrt/wiskunde-fit/issues/10)) en de navigatie is ontworpen ([#21](https://github.com/angrymrt/wiskunde-fit/issues/21)). De vraagsoorten hebben vaste id's en de stof is geordend op onderwerp en domein, op de branch `fase-3`. De structuur voor methode-indelingen staat er ook, voor de 13e editie van leerjaar 1, 2 en 3. De volgende stap is de stofkeuze. De branch gaat pas naar `main` als een leerling ook uit het eigen boek kan kiezen. Hoe de site verschilt van het FLEX-aanbod en of Neon past, staat nog open ([#3](https://github.com/angrymrt/wiskunde-fit/issues/3) en [#4](https://github.com/angrymrt/wiskunde-fit/issues/4)). De navigatie hangt daar niet van af, omdat onderwerpen los staan van een methode, maar de keuzes voor later kunnen er wel door veranderen.
