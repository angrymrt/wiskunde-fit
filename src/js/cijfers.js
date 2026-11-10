// Rekent de samenvattingen per dag om naar de cijfers op de pagina Cijfers. De build doet dit, en
// zet alleen de uitkomst in de code, zodat de browser van een leerling er geen werk aan heeft.
// Bevat geen DOM-code. Zie #19.

// Onder dit aantal pogingen zegt een percentage weinig, en toont de pagina het niet.
const MINIMUM = 30;
// Een valkuil komt pas in de top als hij minstens zo vaak is voorgekomen.
const MINIMUM_VALKUIL = 10;
// De moeilijkheid: hoe zwaar de moeite en de tijd meetellen. Zie moeilijkheid hieronder.
const GEWICHT_TIJD = 0.25;

// De mediaan uit een lijst van [duur, aantal].
function mediaan(duren) {
  const n = duren.reduce((s, [, a]) => s + a, 0);
  if (!n) return null;
  const sorted = [...duren].sort((a, b) => a[0] - b[0]);
  let seen = 0;
  for (let i = 0; i < sorted.length; i++) {
    seen += sorted[i][1];
    if (seen * 2 > n) return sorted[i][0];
    // Bij een even aantal: het midden tussen de twee middelste.
    if (seen * 2 === n) return (sorted[i][0] + sorted[i + 1][0]) / 2;
  }
  return null;
}

// Hoe moeilijk een vraagsoort is, van 0 tot 1, voor elke vraagsoort met genoeg pogingen.
// - De moeite van een eerste poging: goed zonder hint 0, goed met hint 0,5, fout of meteen de
//   uitwerking 1. Het gemiddelde schuift naar dat van de hele site, met het gewicht van MINIMUM
//   pogingen. Zo komt een vraagsoort met weinig pogingen niet bovenaan door een paar keer pech.
// - De tijd: de plek van de mediane duur van goede antwoorden, van 0 voor de snelste tot 1 voor
//   de langzaamste vraagsoort. Zo telt ook hoe lang je moet nadenken, maar weegt één heel lange
//   vraagsoort niet extra zwaar. Alleen goede antwoorden, want wie gokt of meteen de uitwerking
//   bekijkt, denkt niet na.
function moeilijkheid(soorten) {
  const moeite = (s) => s.pogingen - s.goed + 0.5 * s.goedHint;
  const all = Object.values(soorten);
  const pogingen = all.reduce((t, s) => t + s.pogingen, 0);
  if (!pogingen) return null;
  const site = all.reduce((t, s) => t + moeite(s), 0) / pogingen;
  const ranked = all.filter((s) => s.pogingen >= MINIMUM && s.duur !== null);
  const byTime = [...ranked].sort((a, b) => a.duur - b.duur);
  for (const s of ranked) {
    s.moeite = (moeite(s) + MINIMUM * site) / (s.pogingen + MINIMUM);
    // Vraagsoorten met dezelfde duur krijgen dezelfde plek.
    const plek = byTime.findIndex((x) => x.duur === s.duur);
    s.tijd = byTime.length > 1 ? plek / (byTime.length - 1) : 0;
    s.moeilijkheid = (1 - GEWICHT_TIJD) * s.moeite + GEWICHT_TIJD * s.tijd;
  }
  // Het gemiddelde, zodat de pagina kan laten zien hoeveel moeilijker een vraagsoort is.
  return ranked.length ? ranked.reduce((t, s) => t + s.moeilijkheid, 0) / ranked.length : null;
}

// Hoe vaak een vraagsoort in een proeftoets leeg blijft, voor elke vraagsoort die minstens MINIMUM
// keer in een proeftoets zat. Net als de moeite schuift dit naar het gemiddelde van de site, zodat
// een vraagsoort die nog weinig in proeftoetsen zat, niet bovenaan komt door toeval. Geeft het
// gemiddelde terug.
function leegKans(soorten) {
  const total = (s) => s.toets.goed + s.toets.fout + s.toets.leeg;
  const all = Object.values(soorten);
  const n = all.reduce((t, s) => t + total(s), 0);
  if (!n) return null;
  const site = all.reduce((t, s) => t + s.toets.leeg, 0) / n;
  for (const s of all) {
    if (total(s) >= MINIMUM) s.leeg = (s.toets.leeg + MINIMUM * site) / (total(s) + MINIMUM);
  }
  return site;
}

// dagen: [[dag, samenvatting], ...]. Geeft de totalen, de periode en de cijfers per vraagsoort.
function cijfers(dagen) {
  const soorten = {};
  const duren = new Map();
  let proeftoetsen = 0;
  const soort = (id) =>
    (soorten[id] ??= {
      pogingen: 0,
      goed: 0,
      goedHint: 0,
      fout: 0,
      uitwerking: 0,
      hint: 0,
      duren: new Map(),
      valkuilen: {},
      toets: { goed: 0, fout: 0, leeg: 0 },
    });
  const add = (map, key, n) => map.set(key, (map.get(key) ?? 0) + n);
  for (const [, samenvatting] of dagen) {
    for (const c of samenvatting.poging ?? []) {
      const s = soort(c.soort);
      s.pogingen += c.aantal;
      s[c.uitkomst] += c.aantal;
      if (c.hint) s.hint += c.aantal;
      if (c.hint && c.uitkomst === 'goed') s.goedHint += c.aantal;
      if (c.uitkomst === 'goed') {
        add(s.duren, c.duur, c.aantal);
        add(duren, c.duur, c.aantal);
      }
    }
    for (const c of samenvatting.valkuil ?? []) {
      const v = soort(c.soort).valkuilen;
      v[c.valkuil] = (v[c.valkuil] ?? 0) + c.aantal;
    }
    for (const c of samenvatting.toetsvraag ?? []) soort(c.soort).toets[c.uitkomst] += c.aantal;
    for (const c of samenvatting.proeftoets ?? []) proeftoetsen += c.aantal;
  }
  for (const s of Object.values(soorten)) {
    s.duur = mediaan([...s.duren]);
    delete s.duren;
  }
  const gemiddeld = moeilijkheid(soorten);
  const leeg = leegKans(soorten);
  const all = Object.values(soorten);
  return {
    van: dagen[0]?.[0] ?? null,
    tot: dagen.at(-1)?.[0] ?? null,
    dagen: dagen.length,
    // De eerste dag met een proeftoets: eerder telde de site die niet.
    proeftoetsenVan: dagen.find(([, s]) => s.proeftoets)?.[0] ?? null,
    totaal: {
      pogingen: all.reduce((t, s) => t + s.pogingen, 0),
      goed: all.reduce((t, s) => t + s.goed, 0),
      duur: mediaan([...duren]),
      proeftoetsen,
      moeilijkheid: gemiddeld,
      leeg,
    },
    soorten,
  };
}

export { MINIMUM, MINIMUM_VALKUIL, cijfers, mediaan };
