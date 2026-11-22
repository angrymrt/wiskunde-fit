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
npm run vragen-tellen # telt hoeveel verschillende vragen elke soort maakt (alles ongeveer 15 minuten); met nummers erachter alleen die soorten
npm run build         # maakt de site in dist/, met een HTML-bestand per pagina
npm run images        # maakt de PNG's in src/ opnieuw, alleen nodig als het ontwerp verandert
npm run fonts         # maakt het lettertype voor de koppen en het logo, alleen nodig als het ontwerp verandert
npm run format        # Prettier
```

Draai `npm test` na elke wijziging in de stof. Draai `npm run test:browser` na wijzigingen in `ui/`, `main.js`, `styles.css` of de build. Bekijk daarna de schermafbeeldingen in `test-results/`, want de test ziet niet of een figuur er goed uitziet. Een andere browser kies je met de omgevingsvariabele `BROWSER`, bijvoorbeeld `chrome`, of `webkit` voor de motor van Safari. Die installeer je eenmalig met `npx playwright-core install webkit`. Dit vervangt geen test op een echte iPhone.

Bij een pull request die schermen, opmaak, figuren, antwoordcontrole of de build raakt, meet de workflow Online zetten ook met Lighthouse, voor Home en het oefenscherm van `/top-en-snijpunten-van-een-parabool/oefenen`, op de preview en op de site die nu online staat. De scores komen als opmerking bij de pull request (`scripts/lighthouse.js`). Dat is informatief en niet verplicht. Een score die lager is dan op de site die nu online staat, verdient een verklaring. SEO telt niet mee: die is op een preview en een oefenscherm lager, omdat die niet in zoekmachines horen (`noindex`). Zelf meten kan met `node scripts/lighthouse.js <preview>`. Zet `CHROME_PATH` op Edge of Chrome, en `RUNS=1` voor een snelle meting (in PowerShell: `$env:RUNS=1`). Of met `npx -y lighthouse@13.6.0 <adres> --chrome-flags="--headless=new"`.

Bij een pull request draait de workflow Browsertest. Die bepaalt met `scripts/browsertest-selectie.js` wat nodig is: bij alleen documentatie of tests zonder browser draait er niets, bij alleen de stof van onderwerpen de snelle set en de lange test voor die onderwerpen, en bij schermen, opmaak, figuren, antwoordcontrole of de build alles. De check is voorlopig informatief en niet verplicht. Lokaal beperk je de lange test met `ONDERWERPEN=a,b`, of met `METHODE=gr13-havo3` en eventueel `HOOFDSTUK=4`, en met `SNEL=1` sla je hem over. Bij een nieuw hoofdstuk is `METHODE=... HOOFDSTUK=...` genoeg tijdens het bouwen; draai voor de merge één keer alles.

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
- **De site werkt in de browsers uit `browserslist` in `package.json`.** Nu zijn dat Safari 14.1 (iOS 14.5), Chrome 87, Edge 88 en Firefox 83, zodat de site ook op een oude telefoon werkt. De build zet nieuwere schrijfwijzen om, maar geen functies. Gebruik dus geen functies die deze browsers niet hebben, zoals `Object.hasOwn` of `.at()`. `npm test` zoekt ernaar met `tests/browsers.test.js`, ook in wat uit `node_modules` komt. Nieuwere CSS mag alleen als de pagina zonder ook goed werkt, zoals `text-wrap`. Gebruik geen `:has()`, maar een klasse. Verander je de lijst, pas dan ook de pagina Over aan.
- **Houd stof en schermen gescheiden.** `math.js`, `typeset.js`, `figures.js`, `answers.js`, `stof.js`, `routes.js`, `tel.js`, `topics/` en `mappings/` mogen geen DOM gebruiken, want de tests draaien ze in Node. DOM-code hoort in `ui/` en `main.js`. Ook `ui/` moet in Node te importeren zijn, want de build maakt met de schermen de pagina's vooraf. Gebruik de DOM daar dus alleen binnen functies die `main.js` aanroept, en laat een scherm voor dezelfde toestand steeds dezelfde HTML geven: geen toeval en geen tellers voor id's.
- **Kleuren staan als tokens in `:root`.** Definieer elke nieuwe kleur ook voor de donkere modus. Dat gebeurt op twee plekken: in de `prefers-color-scheme`-regel en bij `[data-theme='dark']`.

## Een vraag toevoegen

De werkwijze staat in de skill `.claude/skills/vraag-toevoegen/SKILL.md`: de stappen, de velden van een vraag, de veldhulpen en de T-notatie. Lees die bij elke wijziging aan een vraagsoort. Vaste regels: elke generator heeft een `v` die anders rekent dan het antwoord, het toeval komt uit `math.js` (nooit `Math.random`), een nummer van een vraagsoort wijzig je nooit, en een gedeelde link blijft dezelfde vraag geven (`npm test` controleert de vingerafdrukken).

## Een onderwerp toevoegen

1. Kopieer een bestand in `src/js/topics/` en pas de `export default` aan. Het adres (`slug`) is de titel in kleine letters met streepjes. Kies een titel die ook later niet botst, zoals Lineaire formule opstellen in plaats van Formule opstellen. Schrijf bij `intro` in twee of drie zinnen wat de stof is en wat de leerling hier leert, zonder HTML. Schrijf bij `description` de beschrijving voor zoekmachines en linkvoorbeelden: hoogstens ongeveer 155 tekens, met de woorden waarop een leerling zoekt, en zonder iets te beloven wat de pagina niet heeft. Een domein heeft ook een `intro` en een `description`.
2. Zet het onderwerp in een domein in `topics/index.js`, op de plek waar het in de volgorde hoort.
3. Zet de voorkennis in `PREREQUISITES` in hetzelfde bestand. Voorkennis is een kenmerk van een onderwerp, ook als die in een boek als los stukje voor een hoofdstuk staat. Maak dus geen apart onderwerp voor voorkennis.

In de browser komt elk onderwerp in een eigen bestand, dat pas laadt als het nodig is. Bij het eerste bezoek is er alleen een catalogus: de velden uit `VELDEN` in `scripts/catalogus.js` en per vraagsoort het nummer en de naam. De build maakt die uit het onderwerpbestand, dus je hoeft niets dubbel bij te houden. Krijgt een onderwerp een nieuw veld, zet het dan in `VELDEN` als Home, Mijn stof of een ander scherm zonder het onderwerp het nodig heeft, en anders in `VELDEN_LATER`. `npm test` faalt tot je kiest. Een scherm dat de generatoren of de uitleg gebruikt, moet in `nodig()` in `ui/laden.js` staan, zodat `render()` het onderwerp eerst laadt. In Node, dus in de tests, de scripts en de build, is alles meteen geladen.

Een nieuw domein krijgt een kleur met een eigen klasse `.color-...` in `styles.css`. Wijzig het nummer van een vraagsoort nooit, want de opgeslagen voortgang verwijst daarnaar. De naam, de volgorde en het onderwerp van een vraagsoort mogen wel veranderen. Stopt een vraagsoort, zet dan `null` achter het nummer in `tests/vraagsoort-ids.js`, leg in `progress.js` vast waar de voortgang heen gaat en gebruik het nummer nooit opnieuw.

## Een methode-indeling toevoegen

1. Kopieer een bestand in `src/js/mappings/` en zet het in de lijst in `mappings/index.js`. Elk leerjaar krijgt per editie één bestand.
2. Zet er alle boeken in, met volledige naam en ISBN, en alle paragrafen op nummer met een korte eigen omschrijving. Neem geen inhoudsopgave één op één over en schrijf ook geen titels over. Hoofdstuknummers zijn tekst. Voorkennis hoort er niet in.
3. Een paragraaf is `['1.1', 'Omschrijving', [3, 4]]`. Zonder vraagsoorten is die niet gedekt. Schrijf `'deels'` als vierde waarde als er nog stof ontbreekt of als de stof niet met dit boek is vergeleken. Ontbreekt er stof, zet dan als vijfde waarde een korte zin voor de leerling over wat je hier nog niet kunt oefenen. Is de stof niet met dit boek vergeleken, leg dat dan uit in `note` van de methode-indeling.
4. Zet het aantal paragrafen in `tests/methode-indelingen.test.js` en draai `npm test`.

## Een hoofdstuk toevoegen

Een hoofdstuk is veel werk: hoofdstuk 3 werden 30 vraagsoorten in vier pull requests. Het meeste werk zit in de agents die de vraagsoorten bouwen. Elke stap van een agent leest de hele context opnieuw, dus de kosten zijn ongeveer het aantal stappen maal de grootte van de context. Houd agents daarom klein en gericht, zonder te bezuinigen op de controles.

1. **Werkwijze uit het boek.** De eigenaar zet foto's van het hoofdstuk in `naslag/`, op de plek die `naslag/LEESMIJ.md` beschrijft. Laat agents met Sonnet de foto's per deel verwerken tot notities. Vat die zelf samen in een `werkwijze.md` naast de foto's: de notatie, de werkwijze per paragraaf en wat je bewust niet gebruikt. Controleer de notatie op een paar foto's. Daarna werkt niemand meer vanuit de foto's, want een foto kost veel meer dan een notitie.
2. **Plan.** Schrijf in het issue van het hoofdstuk welke onderwerpen er komen, in welk domein en met welke vraagsoorten, en wat een paragraaf nog mist. Gebruik de bestaande domeinen in `topics/index.js`. Leg het plan voor aan de eigenaar.
3. **Branches.** Maak een integratiebranch `hoofdstuk-N` vanaf `main` en open een draft-PR naar `main`. Die geeft de preview en wordt later de PR die het hoofdstuk online zet. Elk deel komt als laag in een stack, zie [Een pull request maken](#een-pull-request-maken).
4. **Bouwen: één agent per onderwerp.** Laat elk onderwerp bouwen door een eigen agent met Opus, want het bedenken van de sommen en de controle vragen het meeste denkwerk. Geef de agent alleen wat hij nodig heeft: het issue, `werkwijze.md`, een bestaand onderwerp als voorbeeld en de vrije nummers. Laat hem `npm test` draaien en alleen de fouten bekijken. Nieuwe techniek die meer onderwerpen nodig hebben, zoals een nieuw soort figuur, bouwt een eigen agent eerst.
5. **Review.** Laat elke laag reviewen zoals bij elke pull request. Verwerk de bevindingen met een nieuwe, kleine agent die alleen de opmerkingen en de bestanden krijgt waar ze over gaan. Stuur ze niet terug naar de agent die de laag bouwde, want die heeft dan al een grote context.
6. **Afronden met Sonnet.** De methode-indeling, de versie, de `CHANGELOG.md` en de aantallen in README en `index.html` zijn mechanisch werk. Laat een agent met Sonnet dat doen in de laatste laag.
7. **Meten.** Zet bovenaan de opdracht van elke agent de regels `Issue: #97` en `Rol: bouw` of `Rol: review`. Tel na de release de tokens met `node scripts/tokens.js --per-issue --bord <sessie.jsonl>`. Dat zet per issue de velden Orkestratie, Bouw en Review op het projectbord. Het werk van de hoofdsessie telt als orkestratie, voor de issues waarvan de agents op dat moment bezig waren. Bouwde de hoofdsessie zelf, dan telt dat als Bouw van het issue uit de eerstvolgende commit (`(#N)` aan het eind van de titel), als schatting. Werk daarbuiten, zoals aan het bord, telt voor geen issue. Zet de tabel per agent (`node scripts/tokens.js <sessie.jsonl>`) als opmerking bij het issue van het hoofdstuk. Zo vergelijk je issues en hoofdstukken met elkaar.

Draai niet meer dan twee agents en één browsertest tegelijk, anders raakt het geheugen van de computer op.

Controleer voor de release van een hoofdstuk:

- Elke paragraaf van het hoofdstuk staat in de methode-indeling: gedekt, deels met een zin over wat ontbreekt, of niet gedekt.
- Wat ontbreekt staat als sub-issue onder het issue van het hoofdstuk.
- Elke vraagsoort volgt de notatie uit `werkwijze.md` en heeft een `v`, een hint, een uitwerking en valkuilen voor de fouten die leerlingen echt maken.
- Nieuwe invoerkeuzes, zoals een teken in een keuzelijst, staan in `NAKIJKEN.md`.
- `npm test` en `npm run test:browser` slagen, en je hebt de schermafbeeldingen van nieuwe figuren bekeken.
- De code blijft onder de grens voor de grootte ([#80](https://github.com/angrymrt/wiskunde-fit/issues/80)).
- De Lighthouse-opmerking bij de pull request van het hoofdstuk: geen score lager dan op de site die nu online staat, behalve SEO.

## Zo werken de schermen

Alle schermen zijn functies die een HTML-tekst teruggeven. `screenHTML()` in `ui/screens.js` maakt daarmee het hele scherm, en `render()` in `main.js` zet dat in de pagina; `go({ name, ... })` wisselt van scherm en past het adres aan. Knoppen hebben een `data-act`, en één klik-handler in `main.js` verwerkt ze allemaal. Wat er op het scherm staat, volgt uit `state` in `ui/state.js`. Heeft het scherm een onderwerp nodig dat nog niet geladen is (`nodig()` in `ui/laden.js`), dan laadt `render()` dat eerst en geeft het een Promise. Duurt dat langer, dan toont het scherm dat het laadt, en lukt het niet, dan een melding met een knop om het opnieuw te proberen. Een browsertest die `wiskundefit.go(...)` gebruikt, wacht dus op wat `go` teruggeeft.

Een scherm dat Home niet nodig heeft, kan in een eigen bestand staan dat de browser pas laadt als het nodig is ([#188](https://github.com/angrymrt/wiskunde-fit/issues/188)). Zet het in `LATER` in `scripts/later-schermen.js` en in `LATER` in `ui/laden.js` (per adres van het scherm), en geef het scherm `klaar()` en `laad()` zoals `ui/vragen.js`. Staat de pagina van het scherm vooraf gebouwd en helemaal te lezen (geen schil), geef het dan `vooraf: true` in `ui/laden.js`, zodat die pagina blijft staan tot het scherm er is. Zet het adres ook in `SCHERM_VAN` in `scripts/later-schermen.js`, voor de `modulepreload`. `tests/later-schermen.test.js` faalt als die drie lijsten niet gelijk zijn. Wat bij het eerste bezoek al nodig is, zoals het bewaren van de proeftoets, hoort niet in het scherm maar in een eigen bestand (`ui/toets-opslag.js`). In Node is zo'n scherm gewoon geladen. De vooraf gebouwde pagina blijft staan tot het scherm er is. Zet een gerichte test naast die voor Zo maken we de vragen in `tests/browser.e2e.js`.

Alleen Home heeft een losse kop. Op elk ander scherm staat het kruimelpad (`crumbs()`) boven het blok, en begint het eerste blok met de kop en de intro (`pageHead()`). Zet dus geen kop of tekst los tussen het kruimelpad en het blok.

Bij elk scherm hoort een adres, en dat staat alleen in `routes.js`. Alles waarmee je ergens heen gaat, is een gewone link met `<a href>`, zodat openen in een nieuw tabblad werkt. Een knop is voor iets dat op dit scherm gebeurt. Een nieuw eerste deel van een adres moet ook in de lijst met gereserveerde namen in `tests/generators.test.js`. De build maakt bij elk adres een vooraf gebouwde pagina of een schil (`src/js/pages.js`). Een adres zonder bestand geeft een echte 404. `staticwebapp.config.json` bevat de regels voor Azure, en `scripts/server.js` volgt die voor `npm run dev` en de browsertest. Wijzig je die regels, controleer dan ook de preview met `node scripts/controleer-site.js <adres>`.

`window.wiskundefit` bestaat alleen zodat `tests/browser.e2e.js` de juiste antwoorden kan opvragen. Gebruik het niet in de site zelf.

## Feedback en open punten bewaren

Leg feedback, gevonden fouten, ideeën en open vragen vast als issue op GitHub, zodat ze niet verloren gaan in een gesprek. Zet één onderwerp in één issue en schrijf erbij wat er moet gebeuren en waarom. Zet `Fixes #12` in de commit die het punt oplost, dan sluit het issue vanzelf.

Elk nieuw issue komt op het [projectbord](https://github.com/users/angrymrt/projects/1) met een Fase. Staat het punt er niet op, dan zet je het erop. Werk aan de code van de site zelf krijgt de Fase Onderhoud, en werk aan hoe we de site bouwen de Fase Ontwikkelproces (zie [BEGRIPPEN.md](BEGRIPPEN.md)). Merken leerlingen er nu iets van, geef het dan Prioriteit Hoog. Een nieuw besluit komt als opmerking in het besluit-issue van het thema, of als nieuw issue met het label `besluit`. Besluiten zijn [issues met het label `besluit`](https://github.com/angrymrt/wiskunde-fit/issues?q=label%3Abesluit), met de reden erbij.

De repository is openbaar, en dus de issues ook. Zet er geen namen of andere gegevens van leerlingen, docenten of ouders in, en geen materiaal uit een boek.

## Een pull request maken

Push nooit rechtstreeks naar `main`. Zet elke wijziging op een eigen branch en open een pull request naar `main`. Die komt dan ook op een eigen preview-adres, zie [README.md](README.md). GitHub dwingt dit af met de ruleset "main beschermen": samenvoegen kan alleen via een pull request waarvan de checks `deploy` en `issue` slagen. Een pull request van de workflow Tellen samenvatten krijgt geen van beide checks, en een uit een fork niet `deploy` (`issue` slaagt daar meteen). Die voegt de eigenaar samen door de regels te omzeilen, wat alleen via een pull request kan.

Elke pull request hoort bij een issue ([#208](https://github.com/angrymrt/wiskunde-fit/issues/208)). Zet `(#N)` aan het eind van de titel van de pull request, zoals `Cijfers laadt apart (#188)`, of `Fixes #N` of `Refs #N` aan het begin van een regel in de tekst. Bij een stap van een grotere klus is `Refs` de goede keuze, want `Fixes` sluit het issue bij het samenvoegen. De check `issue` (`scripts/issue-koppeling.js`) faalt als het ontbreekt, of als het nummer geen bestaand issue is. De pull request is de commit op `main`: de titel ervan is de titel van de squash-commit. Zet ook in elke commit `(#N)` aan het eind van de titel. In Claude Code weigert de hook `scripts/commit-hook.js` een commit zonder. Bestaat het issue nog niet, maak het dan eerst aan (zie hierboven).

Laat elke pull request reviewen door de agent `review` (`.claude/agents/review.md`), die op de achtergrond draait, met het model Sonnet. De checklist van wat hij nakijkt en hoe hij zijn review plaatst staat in dat bestand. Kies de effort die bij de pull request past:

- **low:** alleen documentatie, tests of het ontwikkelproces.
- **medium:** schermen, opmaak of teksten, zonder wijziging in de stof of in wat de browser bewaart.
- **high:** de stof, de antwoordcontrole, de voortgang en de proeftoets in de browser, de anonieme tellen, de build, de regels voor Azure, en elke grote wijziging die veel bestanden raakt.

De agent doet de review als GitHub App `wiskundefit-review`, zodat te zien is wat van hem komt en het een echte review kan zijn ([#67](https://github.com/angrymrt/wiskunde-fit/issues/67)). Hij haalt eerst een token op, dat een uur geldig is, en gebruikt dat voor `gh`. De app mag pull requests lezen en schrijven en code lezen, en kan dus niet pushen of samenvoegen. De private key staat buiten de repository en komt nooit in git. Verlies je hem, maak dan in de instellingen van de app een nieuwe en trek de oude in.

```sh
REVIEW_APP_ID=<app id> REVIEW_APP_KEY=<pad naar de .pem> node scripts/review-token.js   # het token staat op stdout
```

In PowerShell zet je `$env:GH_TOKEN = node scripts/review-token.js`, na `$env:REVIEW_APP_ID` en `$env:REVIEW_APP_KEY`. Zet `REVIEW_APP_ID` en `REVIEW_APP_KEY` één keer in `.claude/settings.local.json` onder `env` (dat bestand staat in `.gitignore`), dan hebben alle Claude Code-sessies ze vanzelf. De key zelf staat alleen in het `.pem`-bestand, nooit in een instelling. Gebruik dat token alleen voor de review, en laat de agent het niet in een opmerking of bestand zetten. De agent zet zijn bevindingen in één review, waar mogelijk bij de regel waar ze over gaan, met als eindoordeel "Request changes" als er bevindingen zijn, en "Approve" als alles is verwerkt. Verwerk de bevindingen daarna met een nieuwe commit en antwoord bij elke opmerking wat je hebt gedaan. Laat je een bevinding liggen, schrijf dan waarom. Laat de agent daarna opnieuw reviewen. Hij kijkt dan naar de nieuwe commits en naar wat er met zijn opmerkingen is gebeurd.

Zo gaat het hoogstens drie rondes heen en weer. Zijn er na de derde ronde nog bevindingen, leg ze dan voor aan de eigenaar. Die besluit of de pull request zo samen mag. Voeg pas samen als de tests slagen en elke opmerking is verwerkt of beantwoord.

Na het samenvoegen komen de tokens van de issues van de pull request op het projectbord. In Claude Code doet de hook in `.claude/settings.json` dat zelf na `gh pr merge` (`scripts/tokens-hook.js`, met alle sessies uit de map van het logboek). Werk je zonder die hook, doe het dan met de hand: `node scripts/tokens.js --per-issue --bord --issue=N <sessie.jsonl> [...]`, met alle sessies die aan het issue hebben gewerkt, want het overschrijft wat er stond.

### Een stack van pull requests

Bouwt een wijziging in delen op elkaar voort, zoals een hoofdstuk, maak dan een stack met de extensie [gh-stack](https://github.com/github/gh-stack). Elk deel is een eigen pull request, die alleen de wijzigingen van dat deel toont. Zo kan de review per deel, en staat er nooit een half hoofdstuk online.

- Begin met `gh stack init` op de integratiebranch, zoals `hoofdstuk-3`. Maak elk volgend deel met `gh stack add <branch>` en zet alles op GitHub met `gh stack submit`. Een integratiebranch krijgt geen tests en geen preview op GitHub; die geeft de draft-PR van de integratiebranch naar `main`.
- Voeg een deel samen door de integratiebranch vooruit te zetten: `git push origin origin/<branch>:refs/heads/hoofdstuk-3`. GitHub ziet de pull request dan als samengevoegd. Draai daarna `gh stack sync`, dat de hogere delen op de nieuwe basis zet.
- De draft-PR van de integratiebranch naar `main` voeg je samen met squash, want dat is de enige methode die de ruleset toestaat. Het hoofdstuk wordt dan één commit op `main`, met de titel van die pull request en het issue van het hoofdstuk erin (`Hoofdstuk 4 (#97)`). De delen blijven te lezen in de pull requests.
- De basis van een pull request in een stack kun je niet wijzigen. Zet bij het bovenste deel daarom ook zijn eigen basis vooruit, zodat GitHub ook die pull request als samengevoegd ziet.
- Stuit `gh stack sync` op een conflict, dan stopt het en verandert het niets. Los het op met `git rebase --onto` en draai `gh stack sync` opnieuw. `gh stack modify` werkt alleen interactief.

## Een release maken

Elke merge naar `main` zet de site meteen online. Een release legt vast wat er is veranderd en ontstaat vanzelf: heeft de versie in `package.json` na een geslaagde deploy nog geen release, dan maakt de workflow `Online zetten` de tag en de release, met de notities uit `CHANGELOG.md`. Maak dus geen tags of releases met de hand.

Merken leerlingen iets van je wijziging, doe dan dit in dezelfde pull request:

1. Verhoog de versie zonder commit of tag: `npm version minor --no-git-tag-version` (of `patch`).
2. Zet bovenaan in `CHANGELOG.md` een kop met het nieuwe nummer, bijvoorbeeld `## 1.1.0`, met de notities eronder. `npm test` faalt als de bovenste kop niet gelijk is aan de versie, en dan gaat er ook niets online.
3. Commit, push de branch en open een pull request, zoals hierboven.

Wijzigingen in tests, documentatie of het ontwikkelproces houden dezelfde versie en krijgen dus geen release. Meerdere kleine pull requests mogen samen één versie worden: verhoog de versie dan bij de laatste.

- **Patch** (`1.0.1`): een herstelde fout of een kleine verbetering.
- **Minor** (`1.1.0`): nieuwe stof of een nieuwe functie.
- **Major** (`2.0.0`): een wijziging waardoor opgeslagen voortgang of bestaande links niet meer werken zoals eerst. Alleen de eigenaar van het project besluit hierover. Verhoog de major-versie dus nooit zelf. Leg zo'n wijziging eerst voor en voeg niets samen voordat de eigenaar heeft gekozen.

Schrijf de notities zelf, in het Nederlands en voor leerlingen, dus zonder bestandsnamen of technische details. Gebruik de kopjes die van toepassing zijn: `Nieuw`, `Verbeterd` en `Hersteld`. Noem een fout in de wiskunde altijd onder `Hersteld`, met de paragraaf en wat er fout was, want een leerling kan dat verkeerd hebben geleerd.
