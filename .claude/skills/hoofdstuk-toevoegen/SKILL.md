---
name: hoofdstuk-toevoegen
description: Een hoofdstuk toevoegen aan wiskunde-fit: werkwijze uit het boek, plan, branches en stack, agents per onderwerp, review, afronden, tokens meten en de controle voor de release. Gebruik bij een nieuw hoofdstuk.
---

De regels voor iedereen staan in AGENTS.md (Regels). Dit is de werkwijze.

# Een hoofdstuk toevoegen

Een hoofdstuk is veel werk: hoofdstuk 3 werden 30 vraagsoorten in vier pull requests. Het meeste werk zit in de agents die de vraagsoorten bouwen. Elke stap van een agent leest de hele context opnieuw, dus de kosten zijn ongeveer het aantal stappen maal de grootte van de context. Houd agents daarom klein en gericht, zonder te bezuinigen op de controles.

1. **Werkwijze uit het boek.** De eigenaar zet foto's van het hoofdstuk in `naslag/`, op de plek die `naslag/LEESMIJ.md` beschrijft. Laat agents met Sonnet de foto's per deel verwerken tot notities. Vat die zelf samen in een `werkwijze.md` naast de foto's: de notatie, de werkwijze per paragraaf en wat je bewust niet gebruikt. Controleer de notatie op een paar foto's. Daarna werkt niemand meer vanuit de foto's, want een foto kost veel meer dan een notitie.
2. **Plan.** Schrijf in het issue van het hoofdstuk welke onderwerpen er komen, in welk domein en met welke vraagsoorten, en wat een paragraaf nog mist. Gebruik de bestaande domeinen in `topics/index.js`. Leg het plan voor aan de eigenaar.
3. **Branches.** Maak een integratiebranch `hoofdstuk-N` vanaf `main` en open een draft-PR naar `main`. Die geeft de preview en wordt later de PR die het hoofdstuk online zet. Elk deel komt als laag in een stack, zie [Een pull request maken](../../../AGENTS.md#een-pull-request-maken).
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
