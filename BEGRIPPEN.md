# Begrippen

Deze lijst legt vast welke woorden we gebruiken als we over Wiskundefit praten, schrijven en bouwen. Eén ding heeft één naam. Gebruik deze woorden in code-opmerkingen, documentatie, issues en commits. Kom je iets tegen dat hier niet in staat, voeg het dan toe.

Teksten voor leerlingen volgen dezelfde betekenis, maar mogen gewonere woorden gebruiken. Zie [Voor de leerling](#voor-de-leerling).

De stof staat in de code per onderwerp in `topics/`, de methode-indelingen staan in `mappings/`. De stofkeuze staat in `stof.js`. Zie ook het [projectbord](https://github.com/users/angrymrt/projects/1).

## Het overzicht

Er zijn twee kanten: hoe een uitgever de stof ordent en hoe wij dat doen. De methode-indeling verbindt die twee.

```text
De methode                         Wiskundefit

Methode    Getal & Ruimte          Domein       Meetkunde
Editie     13e editie              Onderwerp    Gelijkvormige driehoeken
Niveau     havo                    Vraagsoort   Zijden berekenen
Leerjaar   3                       Vraag        één vraag met eigen getallen
Boek       deel 1
Hoofdstuk  2
Paragraaf  2.2  ── methode-indeling ──>  een of meer vraagsoorten
```

## School en methode

| Begrip    | Betekenis                                                                                                                                                                                                    | Niet gebruiken         |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| Uitgever  | Het bedrijf dat een methode uitbrengt, bijvoorbeeld Noordhoff.                                                                                                                                               |                        |
| Methode   | De lesmethode, zoals Getal & Ruimte of Moderne Wiskunde.                                                                                                                                                     | boek, lesmethode       |
| Editie    | De versie van een methode, zoals de 13e editie.                                                                                                                                                              | druk, versie           |
| Niveau    | Havo, vwo of vmbo. Bij vmbo hoort daar ook de leerweg bij.                                                                                                                                                   | schoolsoort, opleiding |
| Leerjaar  | Het jaar op school. "Havo 3" is niveau plus leerjaar.                                                                                                                                                        | klas                   |
| Vak       | In de bovenbouw kan het vak verschillen, zoals wiskunde A of B.                                                                                                                                              |                        |
| Boek      | Eén los boek van een methode, met een eigen deelnummer zoals deel 1 of 3A. Een leerjaar kan uit meer boeken bestaan. Van een deel bestaat vaak een gewoon leerboek en een FLEX-boek, elk met een eigen ISBN. |                        |
| FLEX      | De naam die de uitgever geeft aan boeken met online materiaal. We noemen het alleen om een boek precies aan te duiden.                                                                                       |                        |
| Hoofdstuk | Een hoofdstuk van een methode. Het nummer is uniek binnen het leerjaar en hoeft geen getal te zijn, zoals `11A`.                                                                                             |                        |
| Paragraaf | Een paragraaf van een methode, zoals 2.2. Dit woord gebruiken we alleen voor de methode.                                                                                                                     | sectie, les            |
| Opgave    | Een opdracht in een boek. Onze eigen opdrachten heten vragen.                                                                                                                                                |                        |
| Werkwijze | Hoe een methode een soort opgave voordoet en opschrijft. Die kan per methode verschillen.                                                                                                                    | aanpak, notatie        |
| Toets     | De toets die de docent op school geeft. Wat er in een toets zit, bepaalt de docent en zegt de site niet.                                                                                                     | proefwerk, examen      |
| Docent    | De wiskundedocent van een leerling, of iemand die de stof voor ons nakijkt.                                                                                                                                  | leraar                 |
| Naslag    | Materiaal uit boeken in de map `naslag/`, dat we alleen gebruiken om de werkwijze op te zoeken. Komt nooit in git.                                                                                           | lesstof                |

## De stof op de site

| Begrip            | Betekenis                                                                                                                                                                                            | In de code           | Niet gebruiken              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------- |
| Stof              | Alles wat een leerling op de site kan leren en oefenen.                                                                                                                                              |                      | lesstof, content, materiaal |
| Domein            | Een aantal onderwerpen die bij elkaar horen, zoals Meetkunde. We kiezen de domeinen zelf: het is geen officiële lijst uit de kerndoelen of examenprogramma's en geen hoofdstuk.                      | `DOMAINS`            | groep, hoofdstuk            |
| Onderwerp         | De plek waar je iets leert: uitleg, video's en vraagsoorten. Onafhankelijk van een methode.                                                                                                          | `TOPICS`             | les, paragraaf              |
| Vraagsoort        | Eén soort vraag die je kunt oefenen, met een vaste id en een generator, zoals Zijden berekenen. Per vraag verschillen alleen de getallen of het verhaal.                                             | `skills`             | skill in lopende tekst      |
| Vaardigheid       | Wat een leerling leert kunnen. Eén vaardigheid kan bij meer vraagsoorten horen. Het woord is breed en kan ook iets als modelleren betekenen. Daarom is het nu geen laag op de site.                  | nog niet             |                             |
| Vraag             | Eén concrete vraag met eigen getallen, gemaakt door een generator.                                                                                                                                   | `q` en de rest ervan | som, opgave, opdracht       |
| Generator         | De functie die vragen maakt bij een vraagsoort.                                                                                                                                                      | `gen`                |                             |
| Seed              | Het getal waarmee je precies dezelfde vraag opnieuw kunt maken, samen met de vraagsoort. Werkt alleen zolang de generator niet verandert. In het adres staat het kort, zoals `?soort=15&seed=k3x9q`. | `seed`, `withSeed`   |                             |
| Voorkennis        | Stof die je al moet kennen voordat je aan een onderwerp begint. Een kenmerk van een onderwerp: de uitleg verwijst ernaar, en het hoort niet bij de stofkeuze.                                        | `prerequisites`      |                             |
| Uitleg            | De tekst bij een onderwerp die de stof uitlegt.                                                                                                                                                      |                      | theorie (dat is de methode) |
| Hint              | Een tip bij een vraag, zonder het antwoord.                                                                                                                                                          | `hint`               |                             |
| Uitwerking        | De stappen naar het goede antwoord.                                                                                                                                                                  | `steps`              | oplossing, antwoord         |
| Pijlschema        | Een rij vakjes met pijlen ertussen, waarbij je bij elke pijl een bewerking ziet, zoals × 1,21. Zo reken je met procenten stap voor stap.                                                             |
| Feedback          | Elk bericht dat de leerling na het nakijken ziet, zoals "Goed gedaan!" of "Nog niet goed."                                                                                                           | `msg`                |                             |
| Valkuil           | Een bekende fout bij een vraagsoort, die de site in een antwoord herkent.                                                                                                                            | `traps`              | trap                        |
| Gerichte feedback | Het bericht bij een valkuil, dat uitlegt wat er misging, zoals "Je bent BC² aan het geven. Neem nog de wortel."                                                                                      | `m` in een valkuil   |                             |
| Id                | Het vaste nummer van een vraagsoort voor de site. Verandert nooit en zegt niets over de plek in de stof. De voortgang hangt hieraan.                                                                 | `id`                 |                             |
| Adres             | Het webadres van een pagina, zoals `/snijpunten-van-lijnen`. Is voor mensen en mag veranderen, met een doorverwijzing vanaf het oude adres.                                                          | `slug`               |                             |

## Pagina's

| Begrip                 | Betekenis                                                                                                                                                                                                 | In de code              | Niet gebruiken            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------- |
| Vooraf gebouwde pagina | Een pagina die de build al met alle tekst maakt, zoals de uitleg bij een onderwerp. Je kunt die zonder JavaScript lezen en zoekmachines zien de stof. Daarna neemt JavaScript de pagina over.             | `PAGES` in `pages.js`   | prerender, statische HTML |
| Schil                  | Een vooraf gebouwde pagina met alleen het menu, de kop en `noindex`, voor een scherm dat afhangt van wat in de browser is bewaard, zoals oefenen, Mijn stof en de proeftoets. JavaScript vult de rest in. | `shellHTML`             | lege pagina, shell        |
| Doorverwijzing         | Een oud adres dat met een 301 naar het nieuwe adres gaat, zodat links van docenten en zoekresultaten blijven werken. Komt uit `oldSlugs` in de gegevens.                                                  | `redirects`, `oldSlugs` | redirect, omleiding       |

## De methode-indeling en het kiezen van stof

| Begrip           | Betekenis                                                                                                                                                                                                                                                    | In de code  | Niet gebruiken |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | -------------- |
| Methode-indeling | Onze beschrijving van één methode, editie, niveau en leerjaar: de hoofdstukken en paragrafen op nummer, met een korte eigen omschrijving en de vraagsoorten die erbij horen. Bevat ook wat we niet dekken, maar neemt de inhoudsopgave niet één op één over. | `MAPPINGS`  | indeling, boek |
| Dekking          | Of een paragraaf op de site te oefenen is: gedekt, deels gedekt of niet gedekt.                                                                                                                                                                              | `coverage`  |                |
| Stofkeuze        | De vraagsoorten die een leerling wil oefenen, gekozen op paragraaf, hoofdstuk of onderwerp. Blijft op het apparaat.                                                                                                                                          | `prog.stof` |                |

## Oefenen en voortgang

| Begrip           | Betekenis                                                                                                                                                                                                                             | In de code      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Oefenen          | Vragen maken bij een vraagsoort, met hints en uitwerking.                                                                                                                                                                             |                 |
| Poging           | Eén keer nakijken van een antwoord op Controleer. De eerste poging bij een vraag telt mee voor de voortgang en de anonieme tellen. Toon uitwerking voor de eerste poging is ook een eerste poging, die in de voortgang als fout telt. | `st.first`      |
| Tel              | Eén losse, anonieme gebeurtenis die de site naar `/api/tel` stuurt: een eerste poging, een valkuil, een ingeleverde proeftoets of een vraag daaruit. Zonder id. Niet: weergave, event of hit.                                         | `src/js/tel.js` |
| Samenvatting     | De tellen van één dag, opgeteld per combinatie van kenmerken, zonder tijdstip of volgorde. Openbaar in `data/tellen/`. Op de pagina Privacy: optelling. Niet: aggregatie of rapport.                                                  | `data/tellen/`  |
| Proeftoets       | Een toets op de site met vragen uit de stofkeuze en een score in punten.                                                                                                                                                              | `ui/exam.js`    |
| Uitslag          | Het resultaat van de laatst ingeleverde proeftoets. Er blijft er één bewaard.                                                                                                                                                         | `state.result`  |
| Voortgang        | Wat de site per vraagsoort onthoudt. Blijft in de browser op het apparaat.                                                                                                                                                            | `prog`          |
| Beheerst         | De voortgang is 80% of meer.                                                                                                                                                                                                          | `topicPct`      |
| Overzichtsscherm | Het eerste scherm van de site, op de site "Home". Het woord beginscherm is voor het icoon op een telefoon.                                                                                                                            | `ui/home.js`    |
| Mijn stof        | Het scherm met alles wat de site van de leerling onthoudt: stofkeuze, boek, laatste uitslag en voortgang. Geen account of profiel.                                                                                                    | `ui/stof.js`    |
| Hoofdmenu        | Home, Mijn stof en Proeftoets bovenaan elk scherm. Elk scherm hoort bij één deel ervan.                                                                                                                                               | `ui/layout.js`  |
| Kruimelpad       | De regel boven de kop, van Home tot het scherm zelf, zoals Home › Meetkunde › Gelijkvormige driehoeken.                                                                                                                               | `crumbsFor`     |

## Controleren

Drie dingen lijken op elkaar, maar zijn iets anders.

| Begrip      | Betekenis                                                                        | In de code   |
| ----------- | -------------------------------------------------------------------------------- | ------------ |
| Nakijken    | De site beoordeelt het antwoord van een leerling.                                | `answers.js` |
| Controle    | Een test die rekent of het antwoord van een generator klopt met de vraag.        | `v`          |
| Nakijkronde | Een docent leest de stof na op uitleg en aanpak. Zie [NAKIJKEN.md](NAKIJKEN.md). |              |

## Het werk aan de site

Op het [projectbord](https://github.com/users/angrymrt/projects/1) heeft elk issue een fase. Twee fases lopen altijd door en lijken op elkaar.

| Begrip          | Betekenis                                                                                                                                                              | Niet gebruiken     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Onderhoud       | Werk aan de code van de site zelf: een fout herstellen, de site sneller of kleiner maken, code opruimen.                                                               |                    |
| Ontwikkelproces | Hoe we de site bouwen: de agents en hun opdrachten, de review van een pull request, de testopzet, het online zetten, het meten van tokens en de regels in `AGENTS.md`. | werkwijze, harness |

## Voor de leerling

Een leerling zegt "mijn boek", niet "mijn methode en editie". Op de site mag dat dus ook, zolang de betekenis hierboven klopt.

| Intern                   | Op de site                                                            |
| ------------------------ | --------------------------------------------------------------------- |
| Domein                   | Alleen de naam, zoals "Meetkunde"                                     |
| Methode                  | De naam zelf, of "je boek"                                            |
| Methode-indeling         | "Je boek", zoals in "Kies uit je boek". Het gekozen boek: "Mijn boek" |
| Stofkeuze                | "Mijn stof", of "je stof" in een zin                                  |
| Overzichtsscherm         | "Home"                                                                |
| Vraagsoort               | "Soort vraag", of de naam van de vraagsoort                           |
| Uitslag                  | "Je resultaat"                                                        |
| Valkuil                  | "Veelgemaakte fout"                                                   |
| Probleemmelding          | "Meld een probleem", de knop bij een vraag (`ui/melden.js`)           |
| Generator, seed, dekking | Niet noemen. Zeg bij dekking: "Dit kun je hier nog niet oefenen."     |
