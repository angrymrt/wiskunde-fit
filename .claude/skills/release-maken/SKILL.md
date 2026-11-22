---
name: release-maken
description: Een release van wiskunde-fit maken: versie verhogen, CHANGELOG.md schrijven en de regels voor patch, minor en major. Gebruik als een wijziging iets is wat leerlingen merken.
---

De regels voor iedereen staan in AGENTS.md (Regels). Dit is de werkwijze.

# Een release maken

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
