---
name: vraag-toevoegen
description: Een vraagsoort (generator) toevoegen of wijzigen in src/js/topics/ van wiskunde-fit: de stappen, de velden van een vraag, de veldhulpen in shared.js (F, RF, orFields, drawLine), valkuilen (traps), seed, v-controle, vingerafdrukken en de T-notatie. Gebruik bij elke wijziging aan een vraagsoort of generator.
---

De regels voor iedereen staan in AGENTS.md (Regels). Dit is de werkwijze voor een vraagsoort.

# Een vraag toevoegen

1. Schrijf in het juiste bestand in `src/js/topics/` een functie die een vraag teruggeeft. Bedenk eerst het antwoord en maak daar de vraag bij, zodat de getallen altijd mooi uitkomen. Haal al het toeval uit `ri`, `nz`, `pick`, `coin` en `shuffle` in `math.js`, nooit uit `Math.random`. Kies je opnieuw als de getallen niet mooi uitkomen, gebruik dan `until(maak, klopt)` uit `math.js` en schrijf geen eigen lus (`do … while`, `for (;;)`) of aanroep van de generator zelf. `maak` doet de keuzes van één ronde en geeft de uitkomst, en `klopt` bevat geen toeval. Zo kan het tellen van de verschillende vragen een afgekeurde keuze overslaan. Dan maakt dezelfde seed steeds dezelfde vraag, en `npm test` controleert dat. Faalt een vraag in de test, dan staat de link naar precies die vraag in de melding.
2. Zet de functie in de lijst `skills` onderaan het bestand, met het eerstvolgende vrije nummer: `[66, 'Naam van de vraagsoort', mijnFunctie]`.
3. Zet hetzelfde nummer in `tests/vraagsoort-ids.js`: `66: 'mijnFunctie'`.
4. Draai `npm test`. De test vindt de nieuwe vraag vanzelf en zegt welk nummer vrij is.
5. Draai `npm run vragen-tellen`. Dat telt hoeveel verschillende vragen de nieuwe vraagsoort maakt en zet dat in `data/vragen-tellen.json`, voor de pagina Zo maken we de vragen. `npm test` faalt als een generator is veranderd en het tellen niet is bijgewerkt. Met nummers erachter telt het alleen die soorten, zoals `npm run vragen-tellen -- 66 67`. Stopt een vraagsoort, haal dan haar regel zelf uit `data/vragen-tellen.json` en `tests/vragen-tellen-stempels.json`.
6. Draai `node scripts/vingerafdrukken.js`. Dat bewaart een vingerafdruk van de vraag bij een paar vaste seeds in `tests/vingerafdrukken.json`. Doe dat ook als een vraagsoort stopt.

Een gedeelde link bevat alleen de vraagsoort en de seed. Geeft dezelfde seed later een andere vraag, dan ziet wie de link opent iets anders dan de leerling die hem deelde. Daarom faalt `npm test` als de getallen in de vraag of de antwoorden bij dezelfde seed veranderen. Andere woorden, een hint, een uitwerking of de opmaak van een figuur mogen gewoon. Het script werkt een veranderde vingerafdruk niet vanzelf bij. Moeten de getallen of antwoorden echt anders, geef de vraagsoort dan eerst een versie in de link. Die bestaat nog niet: bouw hem de eerste keer dat dit nodig is ([#60](https://github.com/angrymrt/wiskunde-fit/issues/60)). Werk daarna de vingerafdruk bij met het nummer erbij, zoals `node scripts/vingerafdrukken.js 17`.

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

## Velden van een vraag

| Veld       | Verplicht   | Betekenis                                                                                                                             |
| ---------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `q`        | ja          | De vraag als HTML, meestal gemaakt met `T(...)`                                                                                       |
| `fields`   | of `mc`     | Invoervelden, zie hieronder                                                                                                           |
| `mc`       | of `fields` | Meerkeuze, gemaakt met `MC([goed, fout, fout], 0)`; de keuzes worden geschud. Een keuze mag ook een figuur zijn, zie hieronder        |
| `hint`     | ja          | Tekst, wordt automatisch omgezet met `T`                                                                                              |
| `steps`    | ja          | De uitwerking: tekst voor `T`, of `H(html)` voor kant-en-klare HTML                                                                   |
| `v`        | aanbevolen  | Controlefunctie, moet `true` geven                                                                                                    |
| `fig`      | nee         | Figuur als SVG-tekst, uit `graph(...)` of `geo(...)`; `graph` tekent ook parabolen                                                    |
| `traps`    | nee         | Valkuilen met gerichte feedback: `[{ id: 'naam', f: (waarden) => boolean, m: 'bericht' }]`; de waarden staan in de ingevulde volgorde |
| `line`     | nee         | De lijn `{ a, b }` bij een tekenvraag: elk paar punten erop is goed                                                                   |
| `parabola` | nee         | De parabool `{ a, b, c }` bij een tekenvraag: de top precies, en elk ander punt erop is goed                                          |
| `compact`  | nee         | Smalle velden, voor een formule of punt op één regel                                                                                  |

Een figuur uit `graph(...)`, `geo(...)` of `angleFig(...)` maakt zelf een beschrijving voor een schermlezer, met de gemarkeerde punten, de lengtes, de rechte hoeken en de hoeken met boogjes. Zo is de vraag ook te maken als je de figuur niet ziet. Hebben de punten geen zichtbare naam, geef `geo` dan een eigen `desc`. `npm test` controleert dat alles wat in de figuur geschreven staat ook in de beschrijving staat.

`graph` tekent naast lijnen (`lines`) ook parabolen, met `curves: [{ abc: [a, b, c], name: 'f' }]` voor y = ax² + bx + c, met a niet 0. Net als bij een lijn is `c` de kleur (1, 2 of 3) en `at` de x waar de naam staat. Het werkt ook met `sketch: true`, `xs`, `ys`, `xn` en `yn`. De beschrijving noemt dal- of bergparabool, de top en de snijpunten met de assen die in beeld liggen. Bij een schets zegt die alleen waar ze liggen, zoals "De top ligt links van de y-as en onder de x-as", want getallen staan er niet in.

Voor getallen en breuken staan er twee figuren in `getalfiguren.js` (niet in `figures.js`, want dat laadt bij elk eerste bezoek mee). De opties staan bij de functies.

- `breukFig({ kind, n, on })`: een vorm in `n` gelijke delen, waarvan de delen in `on` gekleurd zijn (nummers vanaf 0, of een getal k voor de eerste k delen; ze hoeven niet naast elkaar te liggen). `kind` is `'cirkel'` (taartpunten, met de klok mee vanaf boven), `'vierkant'` of `'rechthoek'` in stroken (met `flat: true` onder elkaar), `'strook'`, of `'rooster'` met `rows` en `cols` in plaats van `n`. De beschrijving noemt welke delen gekleurd zijn met hun plek, maar niet hoeveel en nooit de breuk: de leerling telt zelf, net als wie de figuur ziet. Met `count: true` zegt ze alleen hoeveel delen gekleurd zijn, voor een figuur die geen vraag is.
- `getallenlijn({ xr, step, pts, arrows })`: een lijn van `xr[0]` tot `xr[1]` met een streepje per `step` (standaard 1) en de getallen eronder, met het minteken −. Punten zijn `{ x, label: 'A' }`, ook tussen twee streepjes; geef `t: '−2 1/2'` als de beschrijving het getal anders moet noemen. Pijlen boven de lijn zijn `{ from, to, t: '+4' }`, voor optellen en aftrekken; de eerste pijl staat het laagst. Met `coords: false` noemt de beschrijving geen getallen bij de punten en pijlen, alleen de volgorde en de richting, zoals bij `graph`. Standaard past de lijn op een telefoon; houd het bij hoogstens ongeveer 20 streepjes.

Een keuze bij meerkeuze mag een figuur zijn, bijvoorbeeld om een schets te kiezen. De keuzes staan dan naast elkaar zolang ze passen, en de beschrijving van de figuur is de naam van de keuze voor een schermlezer. Geef de schets dus een `label` als `'Schets'` in plaats van de standaardtekst, maak de schetsen klein met `u: 16`, en zorg dat de beschrijvingen van de keuzes verschillen:

```js
const sketch = (abc) =>
  graph({ xr: [-4, 4], yr: [-4, 4], u: 16, sketch: true, curves: [{ abc }], label: 'Schets' });
return {
  q: T(`Welke schets hoort bij y = x^2 - 2?`),
  mc: MC([sketch([1, 0, -2]), sketch([-1, 0, 2]), sketch([1, 2, 0])], 0),
  // ...
};
```

Een valkuil bij zo'n vraag krijgt de SVG-tekst van de gekozen keuze. De vingerafdruk telt een figuur als keuze niet mee, net als de figuur van de vraag.

Een lopende proeftoets wordt als JSON in de browser bewaard. Alles wat nodig is om een vraag na te kijken moet dus gegevens zijn en geen functie. `npm test` controleert dat.

Elke valkuil heeft een `id` die de fout beschrijft, in kleine letters met streepjes, zoals `breuk-omgedraaid`. Die is uniek binnen de vraag. Dezelfde fout in een andere variant van de vraagsoort krijgt dezelfde `id`. Wijzig een `id` liever niet, want de site telt hoe vaak elke valkuil voorkomt, en een nieuwe naam begint weer bij nul.

De functie `f` krijgt de ingevulde getallen, en bij meerkeuze de tekst van de gekozen keuze. Als tweede argument krijgt hij wat de leerling typte, als tekst; dat is alleen nodig als de vorm telt, zoals 7/2 tegenover 3 1/2. De getallen staan in de volgorde waarin ze zijn ingevuld, ook bij een groep velden die zonder volgorde wordt nagekeken. Een valkuil bij zo'n groep kijkt dus zelf naar alle velden van de groep, bijvoorbeeld met `v.slice(0, 2).includes(...)`. Het goede antwoord mag nooit in een valkuil vallen, ook niet in één veld, want dan krijgt een leerling een melding over een veld dat goed is. `npm test` controleert dat, bij een groep voor elke volgorde van de goede antwoorden. `flipTrap` kijkt per veld en past dus niet bij een groep. Voor een omgedraaide verhouding is er `flipTrap(velden, { 0: fout getal })` in `topics/shared.js`.

Veldhulpen in `topics/shared.js`:

- `F(label, antwoord, achterLabel)` maakt een exact veld. Breuken uit `Q(...)` mogen als antwoord.
- `RF(label, antwoord, decimalen, achterLabel)` maakt een veld dat afronden alleen toestaat als het antwoord niet precies uitkomt. Zet `needRound(velden)` achter de vraag voor de zin "Rond af op ...". Alleen het goed afgeronde getal is goed, dus niet meer decimalen dan gevraagd. Zo'n vraag krijgt vanzelf de valkuilen `te-veel-decimalen` en `verkeerd-afgerond` (`roundTraps` in `answers.js`). Met 0 decimalen rond je af op gehelen, met −3 op duizendtallen en met −6 op miljoenen; de zin en de valkuilen noemen dat dan zo. Een leerling mag duizendtallen met een spatie typen, zoals 16 100.
- `orFields([-2, 9])` maakt de velden voor `x = −2 ∨ x = 9`. De leerling mag de oplossingen in elke volgorde invullen. Met `orFields([a, b], { n: 2 })` rondt elk veld af zoals bij `RF`, en met `{ xn: 't' }` heet de onbekende `t`. Zet de oplossingen van klein naar groot: zo staan ze in de uitslag als de leerling niets invult.
- `{ sel: ['<', '>'], a: '<', pre: 'x' }` maakt een keuzelijst.
- `drawLine(a, b, punt1, punt2)` geeft alles voor een vraag waarin de leerling een lijn tekent: het rooster, de velden, het nakijken en de feedback. Elk paar punten op de lijn is goed. Tikken op het rooster vult dezelfde velden als typen, zodat de vraag ook zonder muis of scherm werkt. Gebruik in de uitwerking `lineTable(...)`: de methode tekent een lijn altijd via een tabel.
- `drawParabola([a, b, c], top, punt2, punt3, valkuilen)` doet hetzelfde voor een parabool y = ax² + bx + c. De leerling zet de top en nog twee punten in het rooster, en ziet de parabool door die drie punten. De top moet precies kloppen; elk ander punt op de parabool is goed, dus punt2 en punt3 zijn een voorbeeld. Zet de top en de voorbeeldpunten binnen het rooster (`inGrid`). Geef de valkuilen voor de top mee als laatste argument, zodat ze in de goede volgorde staan. Laat in de uitwerking de grafiek zien met `parabolaFig(...)`.

Een veld met een breuk als antwoord kan `vorm` krijgen, dan telt ook hoe de leerling de breuk schrijft: `{ ...F('', Q(7, 2)), vorm: 'gemengd' }`. Met `vorm: 'vereenvoudigd'` moet de breuk zo ver mogelijk vereenvoudigd zijn: 7/2 en 3 1/2 zijn goed, 14/4, 1 2/4 en 2 3/2 niet, en een heel getal staat zonder breuk (4, niet 8/2 of 4/1). Met `'gemengd'` moeten bovendien de helen eruit (3 1/2), en met `'onecht'` binnen de breuk (7/2). Een kommagetal is dan altijd fout, ook 3,5 bij 7/2. De goede waarde in de verkeerde vorm is fout en krijgt vanzelf een valkuil (`vormTraps` in `answers.js`): `breuk-niet-vereenvoudigd`, `heel-getal-als-breuk`, `helen-niet-eruit`, `helen-niet-binnen-de-breuk`, `gemengd-getal-te-grote-breuk`, `nul-helen` of `kommagetal-bij-breuk`. Die vallen alleen als alle velden de goede waarde hebben. Zonder `vorm` is elke schrijfwijze van de goede waarde goed, zoals altijd.

Een veld kan ook `label` krijgen, de naam voor een schermlezer als de tekst ernaast niet genoeg zegt, en `br: true` om op een nieuwe regel te beginnen. Velden met dezelfde `grp`, zoals `grp: 'x'`, vormen een groep die zonder volgorde wordt nagekeken: elk ingevuld getal mag bij een antwoord van de groep horen dat nog niet is gebruikt. Twee keer hetzelfde getal is dus één goed veld en één fout veld, tenzij de antwoorden ook gelijk zijn. Een groep heeft 2 tot 4 velden met getallen, en kan niet bij een keuzelijst of tekenvraag. In de uitslag staat bij een fout veld het antwoord dat nog over is (`matchFields` in `answers.js`). Meestal is `orFields` genoeg.

## T-notatie

`T(tekst)` uit `typeset.js` zet gewone tekst om naar wiskundezetting. Geef het geen HTML.

| Je schrijft        | Resultaat                                                  |
| ------------------ | ---------------------------------------------------------- |
| `y = ax + b`       | Losse letters, `ax`, `bx` en hoofdletters als `AB` cursief |
| `{3/4}`            | Breuk                                                      |
| `{1 1/2}`          | Gemengd getal                                              |
| `{DE/AB}`          | Breuk met letters                                          |
| `8*-4`             | `8·−4`, met een korte negatieve min                        |
| `AC^2`, `rc_k`     | Superscript en subscript                                   |
| `x-as`, `F-hoeken` | Koppelteken blijft staan, geen minteken                    |

Een min zonder spatie direct voor een getal, breuk `{...}` of letter, aan het begin of na een spatie, rekenteken of `(`, is een negatieve min: `8 - -3`, `4 * -2`, `-x^2`, `(-3)^2`, `{-2 1/3}`. Die is korter, zoals in het boek (klasse `nmin` in `styles.css`). Een aftrekmin schrijf je met spaties eromheen, `a - b`. Beide worden het teken −, zodat een schermlezer "min" zegt.

Een term met uitleg in een popup schrijf je als `{{id|woord}}`, met het `id` uit `woorden.js`. Schrijf `{{=id|woord}}` op de plek waar de term wordt uitgelegd, in het onderwerp dat bij `onderwerp` staat. Op de pagina van dat onderwerp krijgt de term geen popup, want de lijst "Woorden in dit onderwerp" onder de uitleg legt hem uit. Op andere pagina's en bij het oefenen krijgt hij wel een popup, met "Meer uitleg" naar die lijst. Een term is nooit zichtbaar in de proeftoets.

Let op: een losse letter wordt altijd als variabele gezet, dus schrijf `meter` in plaats van `m`. Bij een andere letter dan x, zoals `a` gevolgd door `s`, zet je `​` ertussen. Anders wordt het het woord "as".

Handige hulpen uit `math.js` zijn `lin(a, b, 'x')` voor een nette formule zonder `+ -3`, `fr(q)` voor een breuk in T-notatie, `d(x)` voor een getal met komma en `ap(x)` voor `= 3,5` of `≈ 3,5`.
