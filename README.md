# Wiskundefit

Interactieve oefensite voor de wiskundetoets over hoofdstuk 1 (lineaire problemen), hoofdstuk 2 (gelijkvormigheid) en hoofdstuk 3 (parabolen en kwadratische vergelijkingen) van havo 3. De site sluit aan op _Getal & Ruimte_, editie 13, FLEX-boek deel 1.

![Het overzichtsscherm van de site](docs/overzicht.png)

## Wat de site doet

- **Uitleg per paragraaf**, met voorbeelden die stap voor stap verschijnen en interactieve onderdelen, zoals schuifjes voor `a` en `b` in `y = ax + b`.
- **Oefenvragen** die elke keer nieuwe getallen krijgen. Er zijn 126 vraagsoorten in 23 onderwerpen, met hints, uitwerkingen en gerichte feedback op veelgemaakte fouten.
- **Proeftoetsen** van 10 tot 30 vragen, met aan het eind een score per paragraaf en alle uitwerkingen.
- **Video's** per paragraaf, als links naar YouTube.
- **Voortgang** per vraagsoort, bewaard in de browser. Er is geen server en er is geen account nodig.

## Plannen

Nu oefent de site drie hoofdstukken van één boek voor havo 3. Op de lange termijn willen we meer hoofdstukken en leerjaren ondersteunen, bij voorkeur eerst alle leerjaren van de havo en daarna niveaus als vwo en vmbo, en onafhankelijk worden van één methode. We blijven voorlopig binnen het Nederlandse schoolstelsel.

De planning staat op het [projectbord](https://github.com/users/angrymrt/projects/1), met per issue een status, een fase en een prioriteit. Genomen besluiten, met de reden erbij, zijn [issues met het label `besluit`](https://github.com/angrymrt/wiskunde-fit/issues?q=label%3Abesluit).

## Snel beginnen

Je hebt [Node.js](https://nodejs.org) 20 of nieuwer nodig.

```sh
npm install
npm run dev
```

Open daarna <http://localhost:5173>. `npm run dev` bouwt de site in `dist-dev/`, zonder de code kleiner te maken, en toont die zoals Azure dat doet. Wijzig je een bestand in `src/`, dan bouwt hij opnieuw en hoef je de pagina alleen te herladen. `dist/` is voor `npm run build`, de browsertest en de controle van een preview, dus die kun je naast `npm run dev` draaien.

In Visual Studio Code kun je debuggen met de configuraties in `.vscode/launch.json`. **Site in Edge** start `npm run dev` en opent de site. Een breakpoint in `src/js/` werkt, omdat de dev-build een sourcemap heeft. Er zijn ook configuraties voor `npm test`, het testbestand dat je open hebt, de browsertest en de build zelf.

Bij `npm install` meldt npm mogelijk dat het installatiescript van esbuild niet is uitgevoerd. Dat is geen probleem, de build werkt ook zonder.

## Commando's

| Commando               | Wat het doet                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Bouwt de site en toont die lokaal, en bouwt opnieuw na een wijziging |
| `npm run build`        | Bouwt de site in `dist/`, klaar om online te zetten                  |
| `npm test`             | Maakt van elke vraagsoort 500 varianten en controleert die           |
| `npm run test:browser` | Bouwt de site en klikt hem door in Edge (ongeveer 2,5 minuut)        |
| `npm run images`       | Maakt het linkvoorbeeld en het icoon opnieuw                         |
| `npm run fonts`        | Maakt het lettertype voor de koppen en het logo opnieuw              |
| `npm run format`       | Maakt de code netjes op met Prettier                                 |

De site werkt alleen via een webserver, want elk scherm heeft een eigen adres. Dubbelklikken op `dist/index.html` werkt dus niet. Gebruik `npm run dev` of [wiskundefit.nl](https://wiskundefit.nl).

## Online zetten

Elke push naar `main` draait de tests, bouwt de site en zet hem online via [.github/workflows/deploy.yml](.github/workflows/deploy.yml). De site staat op een Azure Static Web App met het gratis Free-plan. De workflow gebruikt het GitHub-secret `AZURE_STATIC_WEB_APPS_API_TOKEN`, het deploy-token van die app. In [staticwebapp.config.json](staticwebapp.config.json) staan de regels voor Azure: een adres dat niet bestaat geeft de 404-pagina, en de bestanden in `assets/` mag de browser een jaar bewaren. De build zet dat bestand in `dist/`, met de doorverwijzingen van oude adressen erachter. Na elke deploy controleert `scripts/controleer-site.js` dat de site precies `dist/` is, met de juiste status, doorverwijzingen en cache. Dat kan ook met de hand: `node scripts/controleer-site.js <adres>`.

De anonieme tellen gaan naar de functie `/api/tel` uit `api/`, in een eigen Function App op Flex Consumption: `func-we-wiskundefit-prd`. Die is er één voor de site en alle previews. De build bundelt de functie in `dist-api/`, en alleen een push naar `main` zet die online, vóór de site. De functie kiest de tabel aan de hand van de site die de tel stuurt: `TELLERS_TABEL` voor wiskundefit.nl en `TELLERS_DEV_TABEL` voor een preview. Zonder setting controleert de functie de tellen wel, maar bewaart hij niets. Er zijn geen sleutels: de functie schrijft met een managed identity die alleen rijen mag toevoegen, en de workflow logt in met OIDC via de GitHub-variabelen `AZURE_CLIENT_ID`, `AZURE_TENANT_ID` en `AZURE_SUBSCRIPTION_ID`. Alles in Azure zet je klaar met `scripts/azure-tellers.ps1`, na `az login` en `gh auth login`. Bij `npm run dev` en in de browsertest gaan de tellen naar `scripts/server.js`, die ze in het geheugen bewaart.

Elke maandag vat de workflow [Tellen samenvatten](.github/workflows/tellen.yml) de losse tellen van de dagen die voorbij zijn samen, met `scripts/tellen-samenvatten.js`. Per dag telt hij hoe vaak elke combinatie voorkomt, zonder tijdstip of volgorde. Die van wiskundefit.nl komen in `data/tellen/<dag>.json`, via een pull request die de eigenaar nakijkt. Die van de previews komen alleen in het overzicht van de run. Daarna verwijdert de workflow de losse rijen, zodat ze hoogstens ongeveer acht dagen bestaan. De workflow logt in met dezelfde OIDC-identiteit als het online zetten. Lokaal zie je de samenvatting met `node scripts/tellen-samenvatten.js tellersdev`, na `az login` met een account dat de tabel mag lezen. Dat verandert niets.

De build maakt uit `data/tellen/` de pagina `/cijfers`. Om die te ontwerpen zonder echte tellen, maakt `npm run dev:nep` nepcijfers in `data/nep-tellen/` en toont de site daarmee. Die map staat in `.gitignore`, de build zonder `--dev` weigert elk bestand met `"nep": true`, en de pagina zegt erbij dat het nepcijfers zijn.

### Wat er in `dist/` staat

```text
dist/
├── index.html                       Home, vooraf gebouwd
├── 404.html                         De pagina voor een adres dat niet bestaat
├── meetkunde/index.html             Een domein, vooraf gebouwd
├── snijpunten-van-lijnen/
│   ├── index.html                   De uitleg bij een onderwerp, vooraf gebouwd
│   └── oefenen/index.html           Oefenen: een schil met noindex
├── methode-indeling/
│   ├── index.html                   Kies uit je boek, met de hele lijst met boeken
│   └── getal-en-ruimte-13-havo-3/   Een methode-indeling, vooraf gebouwd
├── over/, privacy/, contact/        Vooraf gebouwd
├── mijn-stof/, proeftoets/          Schillen met noindex, ook mijn-stof/oefenen en proeftoets/uitslag
├── assets/                          Code, CSS, lettertypes en logo, met een hash in de naam
├── sitemap.xml, robots.txt          Voor zoekmachines
├── staticwebapp.config.json         De regels voor Azure, met de doorverwijzingen
└── favicon.svg, apple-touch-icon.png, og.png
```

De code in `assets/` staat in meer bestanden. `main-*.js` heeft de schermen en een kleine catalogus van de onderwerpen: de naam, het adres, de intro en de namen van de vraagsoorten. Elk onderwerp heeft een eigen bestand met de generatoren en de uitleg, dat de browser pas laadt bij de uitleg, bij oefenen, bij Mijn stof oefenen of bij de proeftoets. Code die meer bestanden gebruiken, staat in `chunk-*.js`. De build maakt de catalogus uit de onderwerpbestanden zelf (`scripts/catalogus.js`), dus die hoef je niet bij te houden. Lukt het laden van een onderwerp niet, dan toont het scherm een melding met een knop om het opnieuw te proberen.

Een vooraf gebouwde pagina bevat al alle tekst, zodat je die zonder JavaScript kunt lezen en zoekmachines de stof zien. Een schil heeft alleen het menu en de kop, want wat erop staat hangt af van wat in de browser is bewaard. Azure toont `over/index.html` op `/over`, en stuurt `/over/` en `/over/index.html` met een 301 daarheen. De lijst met pagina's staat in `src/js/pages.js`.

Een pull request naar `main` komt op een eigen preview-adres, dat Azure als reactie bij de pull request zet. Dat adres is openbaar, en het verdwijnt als de pull request dicht gaat. Het gratis plan heeft ruimte voor drie previews tegelijk. Een pull request uit een fork komt niet online.

## Zo zit het in elkaar

```text
src/
├── index.html              Het sjabloon voor elke pagina; de build vult de inhoud in
├── styles.css              Alle opmaak, inclusief donkere modus
├── og.png                  Afbeelding voor linkvoorbeelden, gemaakt met npm run images
├── apple-touch-icon.png    Icoon voor het beginscherm, gemaakt met npm run images
├── fonts/                  De lettertypes met hun licenties
└── js/
    ├── main.js             Startpunt: kiest het scherm en verwerkt klikken
    ├── math.js             Rekenhulp: toeval, breuken, getallen schrijven
    ├── typeset.js          Zet tekst om naar wiskundezetting in HTML
    ├── figures.js          Tekent grafieken en driehoeken als SVG
    ├── answers.js          Leest en controleert antwoorden
    ├── progress.js         Bewaart de voortgang in de browser
    ├── routes.js           De adressen: welk scherm bij welk adres hoort
    ├── pages.js            De pagina's die de build maakt, de sitemap en de doorverwijzingen
    ├── stof.js             De stofkeuze: welke vraagsoorten een leerling oefent
    ├── tel.js              Welke anonieme tellen er bestaan
    ├── mappings/           De methode-indelingen: paragrafen en hun vraagsoorten
    ├── topics/             De stof: elk bestand is één onderwerp
    │   ├── index.js        De domeinen, hun onderwerpen en de voorkennis
    │   ├── shared.js       Hulpmiddelen voor meerdere onderwerpen
    │   └── snijpunten-van-lijnen.js … de andere onderwerpen
    └── ui/                 De schermen, ook in Node te maken voor de build
        ├── screens.js      Kiest het scherm bij de toestand en maakt de hele pagina
        ├── home.js         Overzicht en domeinen
        ├── stof.js         Mijn stof, Kies uit je boek en de methode-indelingen
        ├── topic.js        Uitleg en oefenen bij een onderwerp
        ├── exam.js         Proeftoets
        ├── question-form.js Invoervelden van een vraag
        ├── widgets.js      Schuifjes en hoekendemo
        ├── about.js        De pagina's Over, Privacy en Contact
        ├── layout.js       Het menu, het kruimelpad en de voettekst
        ├── tellen.js       De klok per vraag en het versturen van de anonieme tellen
        └── state.js        Gedeelde toestand van de schermen
api/                        De functie /api/tel, die de anonieme tellen in een tabel zet
data/tellen/                De anonieme tellen van wiskundefit.nl, samengevat per dag
scripts/                    Build, ontwikkelserver, controle na de deploy, metingen, afbeeldingen,
                            lettertypes, releasenotities en het samenvatten van de tellen
tests/                      Generatortests, adressen, schermen, pagina's, server, releasecontrole
                            en browsertest
```

De belangrijkste plek om te beginnen is een bestand in `src/js/topics/`. Bovenaan staan de functies die vragen maken, onderaan de uitleg en de lijst met vraagsoorten. Elke functie geeft één vraag terug, met het antwoord, een hint en de uitwerking. De schermen in `ui/` tonen die vraag alleen en weten niets van wiskunde.

In [AGENTS.md](AGENTS.md) staat hoe je een vraag of onderwerp toevoegt en welke afspraken gelden. De woorden die we gebruiken staan in [BEGRIPPEN.md](BEGRIPPEN.md).

## Laagmodel: de vraagsoort als kern

Een methode is vooral een volgorde en een indeling van vraagsoorten. De site zelf ordenen we op onderwerp, en een methode-indeling koppelt een methode daaraan. Dit is de uitkomst van [#10](https://github.com/angrymrt/wiskunde-fit/issues/10). Daarom kiezen we, mits het haalbaar blijkt, voor deze lagen:

```text
Vraagsoort        vast id + naam + generator
Onderwerp         adres + uitleg, video's, vraagsoorten
Domein            onderwerpen die bij elkaar horen
Methode-indeling  methode, editie, niveau, leerjaar → hoofdstukken → paragrafen → vraagsoorten
```

Een nieuwe methode is dan vooral een nieuw gegevensbestand. Een methode-indeling krijgt een eigen naam, zoals `gr13-havo3`, want niveau en leerjaar zijn niet genoeg: in de bovenbouw komt het vak erbij en vmbo heeft leerwegen. Een boek is alleen een label bij een hoofdstuk, want hoofdstukken nummeren door over de boeken heen. Een stofkeuze is altijd een lijst vraagsoorten, of een leerling nu op paragraaf, hoofdstuk of onderwerp kiest. Oefenen en de proeftoets gebruiken dezelfde lijst.

We beginnen met twaalf onderwerpen. Negen paragrafen waren eigenlijk al een onderwerp. Alleen `v1`, 1.1 en 1.2 liepen door elkaar en zijn drie nieuwe onderwerpen geworden. Met hoofdstuk 3 kwamen er in versie 1.12.0 zes bij, en het domein Rekenen met letters.

| Domein                          | Onderwerpen                                                                                                                                                                              |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rekenen met letters             | Ontbinden in factoren, Haakjes wegwerken                                                                                                                                                 |
| Formules en grafieken           | Rekenen met een formule, Lineaire grafieken tekenen, Lineaire formule opstellen, Snijpunten van lijnen, Kwadratische functies, Top en snijpunten van een parabool, Parabolen verschuiven |
| Vergelijkingen en ongelijkheden | Lineaire vergelijkingen, Lineaire ongelijkheden, Vergelijkingen met twee variabelen, Kwadratische vergelijkingen                                                                         |
| Meetkunde                       | Stelling van Pythagoras, Verhoudingstabellen, Gelijkvormige driehoeken, Gelijkvormigheid aantonen, Lengtes van lijnstukken berekenen                                                     |

We tonen alleen domeinen waar stof in zit. We hebben de inhoudsopgaven van de havo van Getal & Ruimte en Moderne Wiskunde gelezen, alleen de titels. Daaruit volgt dit voorstel voor de hele havo, in onze eigen woorden: Getallen en rekenen, Rekenen met letters, Formules en grafieken, Vergelijkingen en ongelijkheden, Veranderingen, Meetkunde, Statistiek, en Kansrekening en combinatoriek. Een onderwerp kan makkelijk verhuizen, want het domein staat niet in het adres.

Dezelfde stof komt in meer leerjaren terug. Lineaire formules zitten bijvoorbeeld in leerjaar 1, 2 en 3 en bij wiskunde A en B, en ongelijkheden staan bij de ene methode in leerjaar 2 en bij de andere in leerjaar 3. Een onderwerp groeit dus mee, en de methode-indeling kiest per paragraaf de passende vraagsoorten. Wat een boek voorkennis noemt, is meestal zo'n onderwerp uit een eerder leerjaar. Het volgt dan vanzelf uit de voorkennis van het onderwerp, en hoort niet in de methode-indeling.

Ook is hergebruik lastiger dan het lijkt: "Evenwijdige lijnen" betekent iets anders in 1.1 dan in 2.1, en `s11coord`, `s12value` en `s15value` rekenen vrijwel hetzelfde uit met een andere notatie. Daarom zetten we de 65 vraagsoorten eerst één op één om en voegen we pas samen als dezelfde vraag en uitwerking echt in beide methodes passen.

Dit model moet nog bewijzen dat het werkt. De inhoudsopgaven van Getal & Ruimte en Moderne Wiskunde passen goed op deze onderwerpen ([#2](https://github.com/angrymrt/wiskunde-fit/issues/2)), maar over de werkwijze zeggen ze niets. Verschilt die per methode of niveau, dan krijgt een vraagsoort een variant of een eigen neutrale werkwijze, en moet de regel "volg de werkwijze van de methode" worden herzien. Adressen en id's blijven dan gelijk, dus dit houdt het bouwen niet op. Bij een video komt te staan bij welke methode die hoort.

## Navigatie

Dit is de uitkomst van [#21](https://github.com/angrymrt/wiskunde-fit/issues/21). Een gewijzigd adres kost een doorverwijzing en mag geen bestaande links breken, dus deze ligt vast voordat we bouwen.

```text
/                                             overzichtsscherm: onderwerpen per domein
/meetkunde                                    domein: intro, onderwerpen en paragrafen uit de boeken
/snijpunten-van-lijnen                        onderwerp: uitleg en video's, vooraf gebouwd
/snijpunten-van-lijnen/oefenen                oefenen, ?soort=... kiest een vraagsoort
/methode-indeling                             de boeken, met filters op niveau, leerjaar, methode en editie
/methode-indeling/getal-en-ruimte-13-havo-3   paragrafen, dekking en vinkjes
/mijn-stof                                    de stofkeuze, de laatste uitslag en de voortgang
/mijn-stof/oefenen                            de stofkeuze door elkaar oefenen
/proeftoets                                   instellen en maken
/proeftoets/uitslag                           de uitslag van de laatste proeftoets
/over                                         over de site en hoe de stof is gemaakt
/privacy                                      de privacyverklaring
/contact                                      contact en fouten melden
```

De namen `methode-indeling`, `boek`, `mijn-stof`, `proeftoets`, `over`, `privacy`, `contact`, `cijfers`, `assets`, `index` en `404` zijn gereserveerd en mogen geen adres van een onderwerp of domein worden. Een onderwerp en een domein mogen ook niet hetzelfde adres hebben. Een test bewaakt dat.

**Id's en adressen**

Een id is voor de site en verandert nooit. Een adres is voor mensen en mag wel veranderen.

- De voortgang en de stofkeuze bewaren alleen id's van vraagsoorten. De voortgang van een onderwerp, paragraaf of domein wordt daaruit berekend en niet opgeslagen. Zo verhuist de voortgang vanzelf mee als een vraagsoort naar een ander onderwerp gaat. Daarnaast onthoudt de site welke methode-indeling je het laatst koos, zodat Mijn stof kan laten zien wat ontbreekt.
- Een id is een geheel getal dat we doortellen en nooit opnieuw gebruiken. Het zegt dus niets over de plek van een vraagsoort: geen paragraafnummer, geen methode en geen volgorde. Dat is het verschil met `1.1#0`. Het adres bevat al leesbare tekst, dus die hoeft niet nog een keer in het id. Zo blijft ook een link met een stofkeuze kort, zoals `?stof=3,7,12`.
- Een onderwerp krijgt voorlopig geen eigen id, want we slaan er niets op op. Domeinen en verwijzingen naar voorkennis gebruiken in de code het onderwerp zelf, zodat een nieuw adres maar op één plek staat. Is een id later toch nodig, dan kan dat er zonder migratie bij.
- Krijgt een onderwerp een nieuw adres, dan blijft het oude adres in de gegevens staan. De build maakt daar een doorverwijzing van, zodat links van docenten en zoekresultaten blijven werken.
- Links met `?soort=` en `?stof=` gebruiken id's, dus die overleven een nieuwe naam ook.
- Stopt een vraagsoort of wordt die gesplitst, dan legt een tabel vast waar het id naartoe gaat, of dat het vervalt. Een test vergelijkt de id's met een lijst van alle eerder gebruikte id's, zodat er geen id ongemerkt verdwijnt of opnieuw wordt gebruikt.

**Bewegen door de site**

- Het hoofdmenu bevat Home, Mijn stof en Proeftoets. Onder Home vallen de domeinen, de onderwerpen en het oefenen. Onder Mijn stof vallen Kies uit je boek, de methode-indelingen en Mijn stof oefenen. Onder Proeftoets valt de uitslag. Het deel waar je bent, is vet en onderstreept en heeft `aria-current`.
- Op een telefoon staat het menu op een eigen regel, in drie even brede delen, ook op 320 pixels. Het menu blijft zichtbaar tijdens een proeftoets, want de melding "Je proeftoets loopt nog" wijst de weg terug.
- Elk scherm behalve Home heeft een kruimelpad. Het begint met een huisje en Home, en eindigt met het scherm zelf, zonder link en met `aria-current`. Bij een onderwerp is dat `Home › Meetkunde › Gelijkvormige driehoeken`, bij oefenen komt `Oefenen` erachter, en bij een methode-indeling `Home › Mijn stof › Kies uit je boek › Getal & Ruimte, 13e editie, havo 3`.
- Een onderwerp staat in één vel: de titel, de intro, de voorkennis, de uitleg en de video's. De knop om te oefenen staat op een breed scherm rechtsboven en blijft in beeld tijdens het scrollen. Op een telefoon staat hij onder de intro, en een balk onderaan neemt het over zodra die knop uit beeld is.
- Onderaan een onderwerp en het oefenscherm staan het vorige en het volgende onderwerp in het domein. Voor het eerste en na het laatste onderwerp wijst die plek naar de pagina van het domein.
- De laatste uitslag staat op het overzicht, op Mijn stof en op het scherm Proeftoets. Ze komt niet in het menu.
- De voettekst bevat Over, Privacy, Contact en GitHub, en de versie met de datum van de laatste wijziging. Later komt `/cijfers` erbij.
- Oefenen op een onderwerp verandert de stofkeuze niet. De voortgang telt per vraagsoort, dus die telt overal mee.

**Het overzichtsscherm**

- De hoofdknop is `Oefen voor je toets: kies uit je boek`, of `Verder met mijn stof` als er al een stofkeuze is. Daarnaast staat `Maak een proeftoets`. De knop `Begin met ...`, die het onderwerp met de laagste voortgang kiest, vervalt.
- Elk domein krijgt een eigen kleur, in plaats van elk hoofdstuk. Is een domein leeg, dan tonen we het niet.
- De zin over Getal & Ruimte verhuist naar de pagina's onder `/methode-indeling` en de over-pagina, want het overzicht hoort niet meer bij één methode.

**Stof kiezen en dekking**

- `/methode-indeling` is een lijst met boeken met filters, zoals in een webshop. Op een breed scherm staan de filters links en de boeken rechts, op een telefoon staan de filters achter een knop Filters. De filters zijn niveau, leerjaar, methode en editie, elk met vinkjes en het aantal boeken erachter. Binnen een filter is één keuze genoeg, en een boek moet bij elk filter passen. Het niveau kent losse niveaus: een boek voor havo/vwo staat bij havo en bij vwo, en vmbo verschijnt zodra er een boek voor is. Elke kaart toont de methode-indeling met een link, de boeken met hun ISBN en hoeveel paragrafen je kunt oefenen. Het gekozen boek staat bovenaan, met een lintje "Mijn boek". De filters staan met `replaceState` in het adres, zoals `?niveau=havo,vwo&leerjaar=3`, en de canonical blijft `/methode-indeling`. Een zin met `role="status"` zegt hoeveel boeken er passen. Zonder JavaScript zie je de hele lijst. In de bovenbouw komt het vak erbij als filter.
- Op de site blijft de knop "Kies uit je boek" heten, want zo zegt een leerling het. Alleen het adres gebruikt het woord methode-indeling.
- `/methode-indeling/...` is een gewone pagina die zonder JavaScript leesbaar blijft: paragrafen op nummer, met een korte eigen omschrijving en links naar de onderwerpen. JavaScript voegt de vinkjes toe.
- Bij een paragraaf zonder vraagsoorten staat "Dit kun je hier nog niet oefenen." Bij een deels gedekte paragraaf staat wat er wel is, en wat nog ontbreekt als we dat weten.
- Staat je boek er niet bij, dan verwijst `/methode-indeling` naar kiezen op onderwerp op `/mijn-stof`.
- Later kunnen landingspagina's onder `/boek/...` helpen om via Google snel bij de juiste stof te komen. Daarom is `boek` gereserveerd. Dit bouwen we nu niet ([#25](https://github.com/angrymrt/wiskunde-fit/issues/25)).
- Later, voor [#23](https://github.com/angrymrt/wiskunde-fit/issues/23): een link van een docent wijst naar `/mijn-stof?stof=...`. De leerling bevestigt die keuze, zodat de eigen stofkeuze niet ongevraagd verdwijnt.

**Techniek**

- Alles waarmee je ergens heen gaat, wordt een gewone link, ook de knop van de uitleg naar het oefenscherm.
- De schermen blijven wisselen met `render()`, nu met `pushState` en `popstate`. Zo overleeft een half gemaakte vraag de terugknop. Een lopende proeftoets staat bovendien in de browser en overleeft ook herladen. De vooraf gebouwde HTML is er voor de eerste keer laden en voor zoekmachines.
- `?soort=` en `&seed=` werken zonder eigen pagina: `/snijpunten-van-lijnen/oefenen?soort=15&seed=k3x9q` opent precies die vraag, en bij de volgende vraag verdwijnt de seed uit het adres. Het adres verandert dus niet bij elke vraag. Daar kan de knop om een fout te melden ([#82](https://github.com/angrymrt/wiskunde-fit/issues/82)) op voortbouwen. Een seed geeft alleen dezelfde vraag zolang de generator niet verandert, dus een foutmelding noemt ook de versie.
- Een eigen pagina met cijfers ([#22](https://github.com/angrymrt/wiskunde-fit/issues/22)) krijgt `/cijfers`, met een link in de voettekst.

**Meegroeien**

Bij ongeveer dertig onderwerpen maken we de domeinen inklapbaar met `<details>`. Komen er meer leerjaren, dan filtert het overzicht op het gekozen boek. Dat bouwen we nu niet, en de platte adressen houden het open.

## Lesmateriaal

De map `naslag/` is bewust niet opgenomen in deze repository (zie `.gitignore`). De uitwerkingen daarin zijn auteursrechtelijk beschermd materiaal van de uitgever. De site gebruikt ze alleen als naslag voor de werkwijze en notatie; de uitleg en vragen zijn zelf geschreven of worden automatisch gemaakt.

De werkwijze is vergeleken met de theorie en de voorbeelden uit het boek. De site zegt niet welke stof bij een toets hoort: dat hangt af van de methode en de docent, en de leerling kiest het zelf.

Dit is een persoonlijk project en heeft geen band met Noordhoff of _Getal & Ruimte_. De video's zijn van de YouTube-kanalen Math with Menno en Wiskunde met Bob Pruiksma.

## Getest met

This project is tested with BrowserStack.

We gebruiken BrowserStack om de site op een echte iPhone in Safari te proberen.

## Licentie

De code en de zelf geschreven stof vallen onder de [MIT-licentie](LICENSE). Die geldt niet voor het materiaal van de uitgever of voor de video's waarnaar de site linkt. De lettertypes in `src/fonts/` vallen onder de SIL Open Font License; de teksten staan in die map.
