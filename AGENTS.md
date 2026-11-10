# AGENTS.md

Instructies voor iedereen die hier code wijzigt, mens of AI. Wat de site doet en hoe de mappen zijn ingedeeld staat in [README.md](README.md).

## Principes

Al het werk wordt hieraan getoetst. Over de grenzen gaan we nooit heen. Binnen die grenzen gelden de doelen, in deze volgorde.

### Grenzen

1. **Privacy van leerlingen.** De hele site werkt zonder dat je iets over jezelf deelt. We volgen de AVG. We gebruiken geen cookies, of alleen functionele, zodat er geen cookiebanner nodig is. We verzamelen geen persoonsgegevens en meten alleen anoniem: losse tellen zonder id, die we binnen een week optellen en verwijderen, in een vorm die geen toestemming nodig heeft. Komt er ooit toch iets dat wel gegevens bewaart, dan is dat optioneel en kun je het laten verwijderen.
2. **Voor leerlingen altijd gratis.** Geen reclame en geen betaalmuur. Donaties, subsidie of een vergoeding van scholen mogen, zolang ze geen invloed hebben op de inhoud en leerlingen er niets van merken.
3. **Respect voor het werk van anderen.** We schrijven eigen teksten en voorbeelden en nemen niets over uit boeken.

### Doelen

1. **De inhoud klopt.** Een fout antwoord leert een leerling iets verkeerds. Daarom liever minder stof die is nagekeken dan veel stof die dat niet is. Fouten herstellen we snel en openlijk.
2. **De leerling gaat voor.** Elke functie moet een leerling helpen beter te oefenen. Wat docenten of ouders helpt, is welkom als het de leerling niet in de weg zit.
3. **Iedereen kan meedoen.** De site werkt op een oude telefoon, met traag internet, met een schermlezer en zonder schoollicentie.
4. **Open en eerlijk.** Code, fouten en besluiten zijn openbaar. We zeggen wat niet is nagekeken of niet wordt gedekt, en hoe de stof is gemaakt, ook als daar AI bij is gebruikt.
5. **Eenvoudig te onderhouden.** We bouwen wat echt nodig is, en één persoon moet het kunnen volhouden. Statisch, tenzij er een goede reden is om dat niet te doen.

## Commando's

```sh
npm run dev           # bouwt de site in dist-dev/ en toont die op poort 5173 zoals Azure; bouwt opnieuw na een wijziging
npm run dev:nep       # hetzelfde, maar de pagina Cijfers toont nepcijfers uit data/nep-tellen/
npm test              # generatortests, adressen, schermen, server en releasecontrole, ongeveer 3 seconden
npm run test:browser  # bouwt en klikt alles door in Edge, ongeveer 2,5 minuut
npm run build         # maakt de site in dist/, met een HTML-bestand per pagina
npm run images        # maakt de PNG's in src/ opnieuw, alleen nodig als het ontwerp verandert
npm run fonts         # maakt het lettertype voor de koppen en het logo, alleen nodig als het ontwerp verandert
npm run format        # Prettier
```

Draai `npm test` na elke wijziging in de stof. Draai `npm run test:browser` na wijzigingen in `ui/`, `main.js`, `styles.css` of de build. Bekijk daarna de schermafbeeldingen in `test-results/`, want de test ziet niet of een figuur er goed uitziet. Een andere browser kies je met de omgevingsvariabele `BROWSER`, bijvoorbeeld `chrome`, of `webkit` voor de motor van Safari. Die installeer je eenmalig met `npx playwright-core install webkit`. Dit vervangt geen test op een echte iPhone.

De browsertest geeft elke soort vraag standaard 1 ronde, en dat is genoeg voor kleine wijzigingen. Draai bij grote wijzigingen, zoals in de schermen, de antwoordcontrole of de build, ook `ROUNDS=4 npm run test:browser` (in PowerShell: `$env:ROUNDS=4; npm run test:browser`). Dat duurt ongeveer 6 minuten. Voeg een gerichte test toe als je een bepaald randgeval wilt vastleggen.

## Regels

- **Gebruik de woorden uit [BEGRIPPEN.md](BEGRIPPEN.md).** Eén ding heeft één naam, in code-opmerkingen, documentatie, issues en commits.
- **De wiskunde moet kloppen.** Een fout antwoord leert de leerling iets verkeerds. Geef elke generator een `v`-functie die het antwoord controleert tegen de gegevens in de vraag, en bereken die controle op een andere manier dan het antwoord zelf.
- **Volg de werkwijze van de methode.** Bijvoorbeeld `Door (0, 3), dus b = 3.`, een verhoudingstabel gevolgd door `geeft x = ...`, en bij gelijkvormigheid twee paar gelijke hoeken met de reden erbij (`F-hoeken`, `Z-hoeken`, `overstaande hoeken`, `gegeven`, `= 90°`). Schrijf getallen met een komma.
- **Neem geen materiaal uit een boek over.** `naslag/` staat in `.gitignore` en mag nooit in git komen. Gebruik het alleen als naslag voor de werkwijze. Schrijf eigen teksten en gebruik eigen verhalen, getallen en letters bij figuren, ook in de lijsten waaruit generatoren kiezen.
- **Schrijf Nederlands voor de leerling.** Spreek de leerling aan met "je", in korte, gewone zinnen. Ook de code-opmerkingen en documentatie zijn Nederlands.
- **Houd de site statisch.** Geen server, geen accounts, geen persoonsgegevens, geen cookies en geen externe scripts. Let op: de cookieregels gelden ook voor een script dat zonder cookie iets naar een server stuurt. De lettertypes staan in `src/fonts/`. Alleen de links naar YouTube en GitHub, het mailadres en de anonieme tellen gebruiken internet.
- **De anonieme tellen zijn de enige uitzondering op "geen server".** De browser stuurt ze met `ui/tellen.js` naar de functie `/api/tel` in `api/tel.js`, en `src/js/tel.js` bepaalt welke tellen bestaan. Stuur nooit een id, iets over het apparaat of iets wat een leerling intypt. Wil je iets nieuws tellen, pas dan eerst de pagina Privacy aan en leg het voor aan de eigenaar. Zie [#19](https://github.com/angrymrt/wiskunde-fit/issues/19).
- **Wijzig `dist/` niet.** Die map wordt gebouwd en staat niet in git.
- **Houd stof en schermen gescheiden.** `math.js`, `typeset.js`, `figures.js`, `answers.js`, `stof.js`, `routes.js`, `tel.js`, `topics/` en `mappings/` mogen geen DOM gebruiken, want de tests draaien ze in Node. DOM-code hoort in `ui/` en `main.js`. Ook `ui/` moet in Node te importeren zijn, want de build maakt met de schermen de pagina's vooraf. Gebruik de DOM daar dus alleen binnen functies die `main.js` aanroept, en laat een scherm voor dezelfde toestand steeds dezelfde HTML geven: geen toeval en geen tellers voor id's.
- **Kleuren staan als tokens in `:root`.** Definieer elke nieuwe kleur ook voor de donkere modus. Dat gebeurt op twee plekken: in de `prefers-color-scheme`-regel en bij `[data-theme='dark']`.

## Een vraag toevoegen

1. Schrijf in het juiste bestand in `src/js/topics/` een functie die een vraag teruggeeft. Bedenk eerst het antwoord en maak daar de vraag bij, zodat de getallen altijd mooi uitkomen. Haal al het toeval uit `ri`, `nz`, `pick`, `coin` en `shuffle` in `math.js`, nooit uit `Math.random`. Dan maakt dezelfde seed steeds dezelfde vraag, en `npm test` controleert dat. Faalt een vraag in de test, dan staat de link naar precies die vraag in de melding.
2. Zet de functie in de lijst `skills` onderaan het bestand, met het eerstvolgende vrije nummer: `[66, 'Naam van de vraagsoort', mijnFunctie]`.
3. Zet hetzelfde nummer in `tests/vraagsoort-ids.js`: `66: 'mijnFunctie'`.
4. Draai `npm test`. De test vindt de nieuwe vraag vanzelf en zegt welk nummer vrij is.

Een eenvoudig voorbeeld:

```js
function s15value() {
  const a = pick([-3, 2, 4]);
  const b = nz(-9, 9);
  const x = nz(-8, 8);
  const y = a * x + b;
  return {
    q: T(`Gegeven is f(x) = ${lin(a, b)}. Bereken f(${x}).`),
    fields: [F(`f(${x}) =`, y)],
    hint: T(`Vul x = ${x} in.`),
    steps: [`f(${x}) = ${plug(a, x, b)} = ${y}`],
    v: () => a * x + b === y,
  };
}
```

### Velden van een vraag

| Veld      | Verplicht   | Betekenis                                                                                  |
| --------- | ----------- | ------------------------------------------------------------------------------------------ |
| `q`       | ja          | De vraag als HTML, meestal gemaakt met `T(...)`                                            |
| `fields`  | of `mc`     | Invoervelden, zie hieronder                                                                |
| `mc`      | of `fields` | Meerkeuze, gemaakt met `MC([goed, fout, fout], 0)`; de keuzes worden geschud               |
| `hint`    | ja          | Tekst, wordt automatisch omgezet met `T`                                                   |
| `steps`   | ja          | De uitwerking: tekst voor `T`, of `H(html)` voor kant-en-klare HTML                        |
| `v`       | aanbevolen  | Controlefunctie, moet `true` geven                                                         |
| `fig`     | nee         | Figuur als SVG-tekst, uit `graph(...)` of `geo(...)`                                       |
| `traps`   | nee         | Valkuilen met gerichte feedback: `[{ id: 'naam', f: (waarden) => boolean, m: 'bericht' }]` |
| `line`    | nee         | De lijn `{ a, b }` bij een tekenvraag: elk paar punten erop is goed                        |
| `compact` | nee         | Smalle velden, voor een formule of punt op één regel                                       |

Een figuur uit `graph(...)`, `geo(...)` of `angleFig(...)` maakt zelf een beschrijving voor een schermlezer, met de gemarkeerde punten, de lengtes, de rechte hoeken en de hoeken met boogjes. Zo is de vraag ook te maken als je de figuur niet ziet. Hebben de punten geen zichtbare naam, geef `geo` dan een eigen `desc`. `npm test` controleert dat alles wat in de figuur geschreven staat ook in de beschrijving staat.

Een lopende proeftoets wordt als JSON in de browser bewaard. Alles wat nodig is om een vraag na te kijken moet dus gegevens zijn en geen functie. `npm test` controleert dat.

Elke valkuil heeft een `id` die de fout beschrijft, in kleine letters met streepjes, zoals `breuk-omgedraaid`. Die is uniek binnen de vraag. Dezelfde fout in een andere variant van de vraagsoort krijgt dezelfde `id`. Wijzig een `id` liever niet, want de site telt hoe vaak elke valkuil voorkomt, en een nieuwe naam begint weer bij nul.

De functie `f` krijgt de ingevulde getallen, en bij meerkeuze de tekst van de gekozen keuze. Het goede antwoord mag nooit in een valkuil vallen, ook niet in één veld, want dan krijgt een leerling een melding over een veld dat goed is. `npm test` controleert dat. Voor een omgedraaide verhouding is er `flipTrap(velden, { 0: fout getal })` in `topics/shared.js`.

Veldhulpen in `topics/shared.js`:

- `F(label, antwoord, achterLabel)` maakt een exact veld. Breuken uit `Q(...)` mogen als antwoord.
- `RF(label, antwoord, decimalen, achterLabel)` maakt een veld dat afronden alleen toestaat als het antwoord niet precies uitkomt. Zet `needRound(velden)` achter de vraag voor de zin "Rond af op ...". Alleen het goed afgeronde getal is goed, dus niet meer decimalen dan gevraagd. Zo'n vraag krijgt vanzelf de valkuilen `te-veel-decimalen` en `verkeerd-afgerond` (`roundTraps` in `answers.js`).
- `{ sel: ['<', '>'], a: '<', pre: 'x' }` maakt een keuzelijst.
- `drawLine(a, b, punt1, punt2)` geeft alles voor een vraag waarin de leerling een lijn tekent: het rooster, de velden, het nakijken en de feedback. Elk paar punten op de lijn is goed. Tikken op het rooster vult dezelfde velden als typen, zodat de vraag ook zonder muis of scherm werkt. Gebruik in de uitwerking `lineTable(...)`: de methode tekent een lijn altijd via een tabel.

Een veld kan ook `label` krijgen, de naam voor een schermlezer als de tekst ernaast niet genoeg zegt, en `br: true` om op een nieuwe regel te beginnen.

### T-notatie

`T(tekst)` uit `typeset.js` zet gewone tekst om naar wiskundezetting. Geef het geen HTML.

| Je schrijft        | Resultaat                                            |
| ------------------ | ---------------------------------------------------- |
| `y = ax + b`       | Losse letters, `ax` en hoofdletters als `AB` cursief |
| `{3/4}`            | Breuk                                                |
| `{1 1/2}`          | Gemengd getal                                        |
| `{DE/AB}`          | Breuk met letters                                    |
| `8*-4`             | `8·−4`                                               |
| `AC^2`, `rc_k`     | Superscript en subscript                             |
| `x-as`, `F-hoeken` | Koppelteken blijft staan, geen minteken              |

Let op: een losse letter wordt altijd als variabele gezet, dus schrijf `meter` in plaats van `m`. Bij een andere letter dan x, zoals `a` gevolgd door `s`, zet je `​` ertussen. Anders wordt het het woord "as".

Handige hulpen uit `math.js` zijn `lin(a, b, 'x')` voor een nette formule zonder `+ -3`, `fr(q)` voor een breuk in T-notatie, `d(x)` voor een getal met komma en `ap(x)` voor `= 3,5` of `≈ 3,5`.

## Een onderwerp toevoegen

1. Kopieer een bestand in `src/js/topics/` en pas de `export default` aan. Het adres (`slug`) is de titel in kleine letters met streepjes. Kies een titel die ook later niet botst, zoals Lineaire formule opstellen in plaats van Formule opstellen. Schrijf bij `intro` in twee of drie zinnen wat de stof is en wat de leerling hier leert, zonder HTML. Schrijf bij `description` de beschrijving voor zoekmachines en linkvoorbeelden: hoogstens ongeveer 155 tekens, met de woorden waarop een leerling zoekt, en zonder iets te beloven wat de pagina niet heeft. Een domein heeft ook een `intro` en een `description`.
2. Zet het onderwerp in een domein in `topics/index.js`, op de plek waar het in de volgorde hoort.
3. Zet de voorkennis in `PREREQUISITES` in hetzelfde bestand. Voorkennis is een kenmerk van een onderwerp, ook als die in een boek als los stukje voor een hoofdstuk staat. Maak dus geen apart onderwerp voor voorkennis.

Een nieuw domein krijgt een kleur met een eigen klasse `.color-...` in `styles.css`. Wijzig het nummer van een vraagsoort nooit, want de opgeslagen voortgang verwijst daarnaar. De naam, de volgorde en het onderwerp van een vraagsoort mogen wel veranderen. Stopt een vraagsoort, zet dan `null` achter het nummer in `tests/vraagsoort-ids.js`, leg in `progress.js` vast waar de voortgang heen gaat en gebruik het nummer nooit opnieuw.

## Een methode-indeling toevoegen

1. Kopieer een bestand in `src/js/mappings/` en zet het in de lijst in `mappings/index.js`. Elk leerjaar krijgt per editie één bestand.
2. Zet er alle boeken in, met volledige naam en ISBN, en alle paragrafen op nummer met een korte eigen omschrijving. Neem geen inhoudsopgave één op één over en schrijf ook geen titels over. Hoofdstuknummers zijn tekst. Voorkennis hoort er niet in.
3. Een paragraaf is `['1.1', 'Omschrijving', [3, 4]]`. Zonder vraagsoorten is die niet gedekt. Schrijf `'deels'` als vierde waarde als er nog stof ontbreekt of als de stof niet met dit boek is vergeleken, en leg dat laatste uit in `note`.
4. Zet het aantal paragrafen in `tests/methode-indelingen.test.js` en draai `npm test`.

## Zo werken de schermen

Alle schermen zijn functies die een HTML-tekst teruggeven. `screenHTML()` in `ui/screens.js` maakt daarmee het hele scherm, en `render()` in `main.js` zet dat in de pagina; `go({ name, ... })` wisselt van scherm en past het adres aan. Knoppen hebben een `data-act`, en één klik-handler in `main.js` verwerkt ze allemaal. Wat er op het scherm staat, volgt uit `state` in `ui/state.js`.

Alleen Home heeft een losse kop. Op elk ander scherm staat het kruimelpad (`crumbs()`) boven het blok, en begint het eerste blok met de kop en de intro (`pageHead()`). Zet dus geen kop of tekst los tussen het kruimelpad en het blok.

Bij elk scherm hoort een adres, en dat staat alleen in `routes.js`. Alles waarmee je ergens heen gaat, is een gewone link met `<a href>`, zodat openen in een nieuw tabblad werkt. Een knop is voor iets dat op dit scherm gebeurt. Een nieuw eerste deel van een adres moet ook in de lijst met gereserveerde namen in `tests/generators.test.js`. De build maakt bij elk adres een vooraf gebouwde pagina of een schil (`src/js/pages.js`). Een adres zonder bestand geeft een echte 404. `staticwebapp.config.json` bevat de regels voor Azure, en `scripts/server.js` volgt die voor `npm run dev` en de browsertest. Wijzig je die regels, controleer dan ook de preview met `node scripts/controleer-site.js <adres>`.

`window.wiskundefit` bestaat alleen zodat `tests/browser.e2e.js` de juiste antwoorden kan opvragen. Gebruik het niet in de site zelf.

## Feedback en open punten bewaren

Leg feedback, gevonden fouten, ideeën en open vragen vast als issue op GitHub, zodat ze niet verloren gaan in een gesprek. Zet één onderwerp in één issue en schrijf erbij wat er moet gebeuren en waarom. Zet `Fixes #12` in de commit die het punt oplost, dan sluit het issue vanzelf.

De repository is openbaar, en dus de issues ook. Zet er geen namen of andere gegevens van leerlingen, docenten of ouders in, en geen materiaal uit een boek.

## Een release maken

Elke push naar `main` zet de site meteen online. Een release legt vast wat er is veranderd en ontstaat vanzelf: heeft de versie in `package.json` na een geslaagde deploy nog geen release, dan maakt de workflow `Online zetten` de tag en de release, met de notities uit `CHANGELOG.md`. Maak dus geen tags of releases met de hand.

Merken leerlingen iets van je wijziging, doe dan dit in dezelfde push:

1. Verhoog de versie zonder commit of tag: `npm version minor --no-git-tag-version` (of `patch`).
2. Zet bovenaan in `CHANGELOG.md` een kop met het nieuwe nummer, bijvoorbeeld `## 1.1.0`, met de notities eronder. `npm test` faalt als de bovenste kop niet gelijk is aan de versie, en dan gaat er ook niets online.
3. Commit en push naar `main`.

Wijzigingen in tests, documentatie of de werkwijze houden dezelfde versie en krijgen dus geen release. Meerdere kleine pushes mogen samen één versie worden: verhoog de versie dan bij de laatste.

- **Patch** (`1.0.1`): een herstelde fout of een kleine verbetering.
- **Minor** (`1.1.0`): nieuwe stof of een nieuwe functie.
- **Major** (`2.0.0`): een wijziging waardoor opgeslagen voortgang of bestaande links niet meer werken zoals eerst. Alleen de eigenaar van het project besluit hierover. Verhoog de major-versie dus nooit zelf. Leg zo'n wijziging eerst voor en push niets voordat de eigenaar heeft gekozen.

Schrijf de notities zelf, in het Nederlands en voor leerlingen, dus zonder bestandsnamen of technische details. Gebruik de kopjes die van toepassing zijn: `Nieuw`, `Verbeterd` en `Hersteld`. Noem een fout in de wiskunde altijd onder `Hersteld`, met de paragraaf en wat er fout was, want een leerling kan dat verkeerd hebben geleerd.
