# AGENTS.md

Instructies voor iedereen die hier code wijzigt, mens of AI. Wat de site doet en hoe de mappen zijn ingedeeld staat in [README.md](README.md).

## Commando's

```sh
npm run dev           # site lokaal op poort 5173, toont src/ zonder bouwstap
npm test              # generatortests, ongeveer 2 seconden
npm run test:browser  # bouwt en klikt alles door in Edge, ongeveer 1 minuut
npm run build         # maakt dist/index.html
npm run format        # Prettier
```

Draai `npm test` na elke wijziging in de lesstof. Draai `npm run test:browser` na wijzigingen in `ui/`, `main.js`, `styles.css` of de build. Bekijk daarna de schermafbeeldingen in `test-results/`, want de test ziet niet of een figuur er goed uitziet. Een andere browser kies je met de omgevingsvariabele `BROWSER`, bijvoorbeeld `chrome`.

De browsertest geeft elke soort vraag standaard 1 ronde, en dat is genoeg voor kleine wijzigingen. Draai bij grote wijzigingen, zoals in de schermen, de antwoordcontrole of de build, ook `ROUNDS=4 npm run test:browser` (in PowerShell: `$env:ROUNDS=4; npm run test:browser`). Dat duurt ongeveer 4 minuten. Voeg een gerichte test toe als je een bepaald randgeval wilt vastleggen.

## Regels

- **De wiskunde moet kloppen.** Een fout antwoord leert de leerling iets verkeerds. Geef elke generator een `v`-functie die het antwoord controleert tegen de gegevens in de vraag, en bereken die controle op een andere manier dan het antwoord zelf.
- **Volg de werkwijze van het boek.** Bijvoorbeeld `Door (0, 3), dus b = 3.`, een verhoudingstabel gevolgd door `geeft x = ...`, en bij gelijkvormigheid twee paar gelijke hoeken met de reden erbij (`F-hoeken`, `Z-hoeken`, `overstaande hoeken`, `gegeven`, `= 90°`). Schrijf getallen met een komma.
- **Neem geen materiaal uit het boek over.** `lesstof/` staat in `.gitignore` en mag nooit in git komen. Gebruik het alleen als naslag voor de werkwijze. Schrijf eigen teksten en gebruik eigen verhalen, getallen en letters bij figuren, ook in de lijsten waaruit generatoren kiezen.
- **Schrijf Nederlands voor de leerling.** Spreek de leerling aan met "je", in korte, gewone zinnen. Ook de code-opmerkingen en documentatie zijn Nederlands.
- **Houd de site statisch.** Geen server, geen accounts, geen tracking en geen externe scripts. De lettertypes staan in `src/fonts/`. Alleen de YouTube-links gebruiken internet.
- **Wijzig `dist/` niet.** Die map wordt gebouwd en staat niet in git.
- **Houd lesstof en schermen gescheiden.** `math.js`, `typeset.js`, `figures.js`, `answers.js` en `paragraphs/` mogen geen DOM gebruiken, want de tests draaien ze in Node. DOM-code hoort in `ui/` en `main.js`.
- **Kleuren staan als tokens in `:root`.** Definieer elke nieuwe kleur ook voor de donkere modus. Dat gebeurt op twee plekken: in de `prefers-color-scheme`-regel en bij `[data-theme='dark']`.

## Een vraag toevoegen

1. Schrijf in het juiste bestand in `src/js/paragraphs/` een functie die een vraag teruggeeft. Bedenk eerst het antwoord en maak daar de vraag bij, zodat de getallen altijd mooi uitkomen.
2. Zet de functie in de lijst `skills` onderaan het bestand: `['Naam van de vaardigheid', mijnFunctie]`.
3. Draai `npm test`. De test vindt de nieuwe vraag vanzelf.

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

| Veld     | Verplicht   | Betekenis                                                                    |
| -------- | ----------- | ---------------------------------------------------------------------------- |
| `q`      | ja          | De vraag als HTML, meestal gemaakt met `T(...)`                              |
| `fields` | of `mc`     | Invoervelden, zie hieronder                                                  |
| `mc`     | of `fields` | Meerkeuze, gemaakt met `MC([goed, fout, fout], 0)`; de keuzes worden geschud |
| `hint`   | ja          | Tekst, wordt automatisch omgezet met `T`                                     |
| `steps`  | ja          | De uitwerking: tekst voor `T`, of `H(html)` voor kant-en-klare HTML          |
| `v`      | aanbevolen  | Controlefunctie, moet `true` geven                                           |
| `fig`    | nee         | Figuur als SVG-tekst, uit `graph(...)` of `geo(...)`                         |
| `traps`  | nee         | Gerichte feedback: `[{ f: (waarden) => boolean, m: 'bericht' }]`             |

Veldhulpen in `paragraphs/shared.js`:

- `F(label, antwoord, achterLabel)` maakt een exact veld. Breuken uit `Q(...)` mogen als antwoord.
- `RF(label, antwoord, decimalen, achterLabel)` maakt een veld dat afronden alleen toestaat als het antwoord niet precies uitkomt. Zet `needRound(velden)` achter de vraag voor de zin "Rond af op ...".
- `{ sel: ['<', '>'], a: '<', pre: 'x' }` maakt een keuzelijst.

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

## Een paragraaf toevoegen

1. Kopieer een bestand in `src/js/paragraphs/` en pas de `export default` aan.
2. Voeg het toe aan de lijst in `paragraphs/index.js`.
3. Zet `core: true` als er uitwerkingen uit het boek bij horen. Bij `core: false` toont de site een melding dat de docent moet bevestigen of de stof bij de toets hoort.

Wijzig de `id` van een bestaande paragraaf of de volgorde van de `skills` niet zomaar: de opgeslagen voortgang verwijst daarnaar (`1.1#0`).

## Zo werken de schermen

Alle schermen zijn functies die een HTML-tekst teruggeven. `render()` in `main.js` zet die in de pagina; `go({ name, ... })` wisselt van scherm. Knoppen hebben een `data-act`, en één klik-handler in `main.js` verwerkt ze allemaal. Wat er op het scherm staat, volgt uit `state` in `ui/state.js`.

`window.wiskundefit` bestaat alleen zodat `tests/browser.e2e.js` de juiste antwoorden kan opvragen. Gebruik het niet in de site zelf.
