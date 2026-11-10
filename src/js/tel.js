// Welke anonieme tellen er bestaan. ui/tellen.js maakt ze, en de functie /api/tel (api/tel.js) neemt
// alleen deze aan en bewaart niets anders. Zie #19.

// De functie draait in een eigen Function App, voor de site en alle previews samen. Bij npm run dev
// en in de browsertest neemt scripts/server.js de tellen aan.
const TEL_FUNCTIE = 'https://func-we-wiskundefit-prd.azurewebsites.net/api/tel';
const telAdres = (hostname) =>
  /^(localhost|127\.0\.0\.1)$/.test(hostname) ? '/api/tel' : TEL_FUNCTIE;

// Een langere eerste poging telt als 30 minuten: dan is de leerling waarschijnlijk weggelopen.
const MAX_DUUR = 30 * 60;
// Een proeftoets heeft hoogstens 30 vragen, en die gaan samen met de tel proeftoets in één bericht.
const MAX_TELLEN = 40;
// De id van een valkuil: kleine letters en cijfers met streepjes, zoals breuk-omgedraaid.
const VALKUIL_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Per soort tel de velden naast tel. Een lijst noemt de waarden die mogen.
const VORM = {
  poging: { soort: 'soort', uitkomst: ['goed', 'fout', 'uitwerking'], duur: 'duur', hint: 'janee' },
  valkuil: { soort: 'soort', valkuil: 'valkuil' },
  toetsvraag: { soort: 'soort', uitkomst: ['goed', 'fout', 'leeg'] },
  // Een ingeleverde proeftoets: alleen dat er een is gemaakt, zonder vraagsoort of score.
  proeftoets: {},
};
const GELDIG = {
  duur: (x) => Number.isInteger(x) && x >= 0 && x <= MAX_DUUR,
  janee: (x) => typeof x === 'boolean',
  valkuil: (x) => typeof x === 'string' && x.length <= 60 && VALKUIL_ID.test(x),
};

// Geeft de tellen terug als alles klopt, en anders null. soorten zijn de ids van de vraagsoorten
// die er nu zijn. Een onbekend veld is ook een fout, zodat er nooit iets extra's wordt bewaard.
function checkTellen(tellen, soorten) {
  if (!Array.isArray(tellen) || !tellen.length || tellen.length > MAX_TELLEN) return null;
  const out = [];
  for (const t of tellen) {
    const vorm = VORM[t?.tel];
    if (!vorm) return null;
    const clean = { tel: t.tel };
    for (const [key, rule] of Object.entries(vorm)) {
      const value = t[key];
      const ok = Array.isArray(rule)
        ? rule.includes(value)
        : rule === 'soort'
          ? soorten.has(value)
          : GELDIG[rule](value);
      if (!ok) return null;
      clean[key] = value;
    }
    if (Object.keys(t).length !== Object.keys(clean).length) return null;
    out.push(clean);
  }
  return out;
}

export { MAX_DUUR, VALKUIL_ID, VORM, checkTellen, telAdres };
