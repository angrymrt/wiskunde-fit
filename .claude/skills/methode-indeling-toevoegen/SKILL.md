---
name: methode-indeling-toevoegen
description: Een methode-indeling (boek, leerjaar, paragrafen) toevoegen in src/js/mappings/ van wiskunde-fit. Gebruik bij een nieuw boek, leerjaar of editie.
---

De regels voor iedereen staan in AGENTS.md (Regels). Dit is de werkwijze.

# Een methode-indeling toevoegen

1. Kopieer een bestand in `src/js/mappings/` en zet het in de lijst in `mappings/index.js`. Elk leerjaar krijgt per editie één bestand.
2. Zet er alle boeken in, met volledige naam en ISBN, en alle paragrafen op nummer met een korte eigen omschrijving. Neem geen inhoudsopgave één op één over en schrijf ook geen titels over. Hoofdstuknummers zijn tekst. Voorkennis hoort er niet in.
3. Een paragraaf is `['1.1', 'Omschrijving', [3, 4]]`. Zonder vraagsoorten is die niet gedekt. Schrijf `'deels'` als vierde waarde als er nog stof ontbreekt of als de stof niet met dit boek is vergeleken. Ontbreekt er stof, zet dan als vijfde waarde een korte zin voor de leerling over wat je hier nog niet kunt oefenen. Is de stof niet met dit boek vergeleken, leg dat dan uit in `note` van de methode-indeling.
4. Zet het aantal paragrafen in `tests/methode-indelingen.test.js` en draai `npm test`.
