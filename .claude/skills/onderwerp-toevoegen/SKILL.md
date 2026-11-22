---
name: onderwerp-toevoegen
description: Een onderwerp (of domein) toevoegen aan wiskunde-fit: bestand in src/js/topics/, volgorde en voorkennis in topics/index.js, de catalogus en het laden per onderwerp. Gebruik bij een nieuw onderwerp of domein.
---

De regels voor iedereen staan in AGENTS.md (Regels). Dit is de werkwijze.

# Een onderwerp toevoegen

1. Kopieer een bestand in `src/js/topics/` en pas de `export default` aan. Het adres (`slug`) is de titel in kleine letters met streepjes. Kies een titel die ook later niet botst, zoals Lineaire formule opstellen in plaats van Formule opstellen. Schrijf bij `intro` in twee of drie zinnen wat de stof is en wat de leerling hier leert, zonder HTML. Schrijf bij `description` de beschrijving voor zoekmachines en linkvoorbeelden: hoogstens ongeveer 155 tekens, met de woorden waarop een leerling zoekt, en zonder iets te beloven wat de pagina niet heeft. Een domein heeft ook een `intro` en een `description`.
2. Zet het onderwerp in een domein in `topics/index.js`, op de plek waar het in de volgorde hoort.
3. Zet de voorkennis in `PREREQUISITES` in hetzelfde bestand. Voorkennis is een kenmerk van een onderwerp, ook als die in een boek als los stukje voor een hoofdstuk staat. Maak dus geen apart onderwerp voor voorkennis.

In de browser komt elk onderwerp in een eigen bestand, dat pas laadt als het nodig is. Bij het eerste bezoek is er alleen een catalogus: de velden uit `VELDEN` in `scripts/catalogus.js` en per vraagsoort het nummer en de naam. De build maakt die uit het onderwerpbestand, dus je hoeft niets dubbel bij te houden. Krijgt een onderwerp een nieuw veld, zet het dan in `VELDEN` als Home, Mijn stof of een ander scherm zonder het onderwerp het nodig heeft, en anders in `VELDEN_LATER`. `npm test` faalt tot je kiest. Een scherm dat de generatoren of de uitleg gebruikt, moet in `nodig()` in `ui/laden.js` staan, zodat `render()` het onderwerp eerst laadt. In Node, dus in de tests, de scripts en de build, is alles meteen geladen.

Een nieuw domein krijgt een kleur met een eigen klasse `.color-...` in `styles.css`. Wijzig het nummer van een vraagsoort nooit, want de opgeslagen voortgang verwijst daarnaar. De naam, de volgorde en het onderwerp van een vraagsoort mogen wel veranderen. Stopt een vraagsoort, zet dan `null` achter het nummer in `tests/vraagsoort-ids.js`, leg in `progress.js` vast waar de voortgang heen gaat en gebruik het nummer nooit opnieuw.
