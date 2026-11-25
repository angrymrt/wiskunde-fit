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
npm run test:mobiel   # een oefenvraag op echte telefoons via BrowserStack, ongeveer 30 seconden
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

De mobiele test (`tests/mobiel.e2e.js`) draait op echte telefoons via BrowserStack Automate: Safari op een oude en een nieuwe iPhone, en Chrome, Samsung Internet en Firefox op Android. Hij opent Home en een oefenvraag, typt het antwoord met de Rekenhulp en controleert het. Draai hem af en toe en na grote wijzigingen in de schermen, niet bij elke pull request, want de minuten zijn beperkt. Start de workflow Mobiele tests met de hand, of draai hem lokaal met `BROWSERSTACK_USERNAME` en `BROWSERSTACK_ACCESS_KEY` onder `env` in `.claude/settings.local.json`. Standaard test hij de site die online staat; een preview kies je met `ADRES=<adres>`, en toestellen met `TOESTELLEN=firefox,safari-oud`. Bekijk de schermafbeeldingen in `test-results/mobiel/`. Wat de browser zelf doet, zoals inzoomen met een dubbeltik, ziet deze test niet ([#241](https://github.com/angrymrt/wiskunde-fit/issues/241)); dat probeer je met de hand in BrowserStack Live.

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

## Werkwijzen

De werkwijze per taak staat in `.claude/skills/<naam>/SKILL.md`: gewone Markdown, die je met elke tool kunt lezen. Claude Code laadt een skill zelf als de taak erom vraagt. Met een andere tool lees je het bestand van de taak. De skills zijn `vraag-toevoegen`, `onderwerp-toevoegen`, `methode-indeling-toevoegen`, `hoofdstuk-toevoegen`, `schermen` en `release-maken`. De review staat in de agent `.claude/agents/review.md`. Een regel die voor iedereen geldt staat hier en niet in een skill.

## Een vraag toevoegen

De werkwijze staat in de skill `.claude/skills/vraag-toevoegen/SKILL.md`: de stappen, de velden van een vraag, de veldhulpen en de T-notatie. Lees die bij elke wijziging aan een vraagsoort. Vaste regels: elke generator heeft een `v` die anders rekent dan het antwoord, het toeval komt uit `math.js` (nooit `Math.random`), een nummer van een vraagsoort wijzig je nooit, en een gedeelde link blijft dezelfde vraag geven (`npm test` controleert de vingerafdrukken).

## Een onderwerp toevoegen

Een onderwerp krijgt een eigen bestand in `src/js/topics/`, een plek in een domein en voorkennis in `PREREQUISITES`. Wijzig het nummer van een vraagsoort nooit. De werkwijze staat in de skill `.claude/skills/onderwerp-toevoegen/SKILL.md`.

## Een methode-indeling toevoegen

Een methode-indeling staat in `src/js/mappings/`, met eigen omschrijvingen en nooit de titels of inhoudsopgave van het boek over te nemen. De werkwijze staat in de skill `.claude/skills/methode-indeling-toevoegen/SKILL.md`.

## Een hoofdstuk toevoegen

Een hoofdstuk is veel werk en gaat in een stack van pull requests. Draai niet meer dan twee agents en één browsertest tegelijk, anders raakt het geheugen van de computer op. De werkwijze staat in de skill `.claude/skills/hoofdstuk-toevoegen/SKILL.md`.

## Zo werken de schermen

Schermen zijn functies die HTML teruggeven, zonder DOM bij het maken. Een adres staat alleen in `routes.js`, en alles waarmee je ergens heen gaat is een gewone `<a href>`. De uitleg staat in de skill `.claude/skills/schermen/SKILL.md`.

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

Elke merge naar `main` zet de site meteen online en de release ontstaat vanzelf: maak nooit tags of releases met de hand. Merken leerlingen iets van je wijziging, verhoog dan de versie en schrijf `CHANGELOG.md`. Verhoog de major-versie nooit zelf: alleen de eigenaar besluit dat. De werkwijze staat in de skill `.claude/skills/release-maken/SKILL.md`.
