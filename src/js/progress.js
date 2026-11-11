// Voortgang van de leerling. Blijft alleen in deze browser bewaard (localStorage).
import { MAPPING } from './mappings/index.js';
import { TOPICS } from './topics/index.js';

const SKILL_IDS = new Set(TOPICS.flatMap((t) => t.skills.map((k) => k.id)));

// Oude naam van de site. Laat dit staan: een nieuwe sleutel wist de opgeslagen voortgang.
const STORE = 'lijn-driehoek-v1';
// Waar vaardigheden uit de eerste indeling naartoe zijn verhuisd. null betekent: bestaat niet meer.
const MOVED_V2 = {
  '1.3#5': '1.4#2',
  '1.3#6': '1.3#5',
  '1.4#0': '1.5#0',
  '1.4#1': '1.5#1',
  '1.4#2': '1.5#2',
  '1.5#0': 'v1#0',
  '1.5#1': null,
  '1.5#2': '1.4#0',
  '1.5#3': '1.4#1',
  '1.5#4': null,
  '2.4#1': null,
  '2.4#2': null,
};
function migrateSkills(skills) {
  const out = {};
  for (const [id, results] of Object.entries(skills)) {
    const to = id in MOVED_V2 ? MOVED_V2[id] : id;
    if (to) out[to] = results;
  }
  return out;
}
// Waar de id's uit paragraaf en volgorde naartoe zijn gegaan. Deze nummers veranderen nooit meer.
// Alle omzetting hier kan vanaf 1 december 2026 weg, zie issue 26.
const IDS_V3 = {
  'v1#0': 1,
  'v1#1': 2,
  '1.1#0': 3,
  '1.1#1': 4,
  '1.1#2': 5,
  '1.1#3': 6,
  '1.1#4': 7,
  '1.1#5': 8,
  '1.1#6': 9,
  '1.1#7': 10,
  '1.2#0': 11,
  '1.2#1': 12,
  '1.2#2': 13,
  '1.2#3': 14,
  '1.2#4': 15,
  '1.2#5': 16,
  '1.3#0': 17,
  '1.3#1': 18,
  '1.3#2': 19,
  '1.3#3': 20,
  '1.3#4': 21,
  '1.3#5': 22,
  '1.4#0': 23,
  '1.4#1': 24,
  '1.4#2': 25,
  '1.5#0': 26,
  '1.5#1': 27,
  '1.5#2': 28,
  '1.5#3': 29,
  '1.5#4': 30,
  '1.5#5': 31,
  '1.6#0': 32,
  '1.6#1': 33,
  '1.6#2': 34,
  '1.6#3': 35,
  '1.6#4': 36,
  '1.6#5': 37,
  'v2#0': 38,
  'v2#1': 39,
  'v2#2': 40,
  '2.1#0': 41,
  '2.1#1': 42,
  '2.1#2': 43,
  '2.1#3': 44,
  '2.1#4': 45,
  '2.1#5': 46,
  '2.2#0': 47,
  '2.2#1': 48,
  '2.2#2': 49,
  '2.2#3': 50,
  '2.2#4': 51,
  '2.2#5': 52,
  '2.3#0': 53,
  '2.3#1': 54,
  '2.3#2': 55,
  '2.3#3': 56,
  '2.3#4': 57,
  '2.4#0': 58,
  '2.4#1': 59,
  '2.4#2': 60,
  '2.4#3': 61,
  '2.4#4': 62,
  '2.4#5': 63,
  '2.4#6': 64,
  '2.4#7': 65,
};
function migrateIds(skills) {
  const out = {};
  for (const [id, results] of Object.entries(skills)) {
    const to = id in IDS_V3 ? IDS_V3[id] : id;
    if (!(to in out)) out[to] = results;
  }
  return out;
}
// De oude keuze voor de proeftoets wordt een stofkeuze. 'all' was ook de standaard en zegt dus niet
// dat een leerling iets koos. Dat wordt geen stofkeuze.
function migrateScope(scope) {
  const number = { h1: '1', h2: '2' }[scope];
  const chapter = MAPPING['gr13-havo3'].chapters.find((c) => c.number === number);
  return chapter ? chapter.paragraphs.flatMap((p) => p.skills) : null;
}
// Zet opgeslagen voortgang om naar de vorm van nu, en houdt alleen wat klopt. Een ongeldig deel,
// zoals een vraagsoort zonder lijst met resultaten, valt weg. De rest blijft staan.
function cleanProgress(saved) {
  const out = { v: 5, skills: {}, stof: null, mapping: null };
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return out;
  saved = { ...saved };
  const map = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  if (!saved.v) {
    saved.skills = migrateSkills(map(saved.skills));
    if (saved.scope === 'core') saved.scope = 'all';
  }
  // Altijd omzetten: een tabblad met de oude code kan nog een oude id hebben bewaard.
  const skills = migrateIds(map(saved.skills));
  if ('scope' in saved) {
    saved.stof = migrateScope(saved.scope);
    saved.mapping = saved.stof ? 'gr13-havo3' : null;
  }
  // Per vraagsoort hoogstens de laatste vijf resultaten, elk 0 of 1. Een onbekend nummer mag
  // blijven: dat kan van een nieuwere versie in een ander tabblad zijn, en het stoort niets.
  for (const [id, results] of Object.entries(skills)) {
    if (!/^[1-9]\d*$/.test(id) || !Array.isArray(results)) continue;
    const ok = results.filter((x) => x === 0 || x === 1).slice(-5);
    if (ok.length) out.skills[id] = ok;
  }
  // De stofkeuze bevat alleen vraagsoorten die bestaan, want oefenen en de proeftoets kiezen daaruit.
  if (Array.isArray(saved.stof)) {
    const ids = [...new Set(saved.stof.filter((id) => SKILL_IDS.has(id)))].sort((a, b) => a - b);
    out.stof = ids.length ? ids : null;
  }
  if (
    typeof saved.mapping === 'string' &&
    Object.prototype.hasOwnProperty.call(MAPPING, saved.mapping)
  )
    out.mapping = saved.mapping;
  return out;
}
// Of het laatste bewaren in deze browser is mislukt, bijvoorbeeld omdat de opslag vol of
// geblokkeerd is. Apart voor de voortgang en de proeftoets (ui/exam.js), want alleen voor de
// voortgang is dan wat in het geheugen staat het nieuwst. Lukt het later weer, dan gaat de vlag
// uit. Het scherm zegt het zolang een van de twee aan staat, en gemeld zegt of een schermlezer
// dat al heeft gehoord. Zie ui/layout.js.
const opslag = { voortgang: false, toets: false, gemeld: false };
// In Node, bij het bouwen en testen, is er geen opslag. Dat is geen mislukte poging.
const inBrowser = () => typeof window !== 'undefined';
const prog = { v: 5, skills: {}, stof: null, mapping: null };
// Leest de voortgang opnieuw, want een ander tabblad kan die intussen hebben veranderd.
// Is er geen opslag, of lukte het bewaren niet, dan is wat in het geheugen staat het nieuwst.
function load() {
  if (opslag.voortgang) return;
  let raw;
  try {
    raw = localStorage.getItem(STORE);
  } catch (e) {
    return;
  }
  let saved = null;
  try {
    saved = JSON.parse(raw);
  } catch (e) {}
  Object.assign(prog, cleanProgress(saved));
}
load();
function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(prog));
    opslag.voortgang = false;
  } catch (e) {
    if (inBrowser()) opslag.voortgang = true;
  }
}
// Elke wijziging begint met de voortgang zoals die nu bewaard is. Zo gaat niets verloren als je in
// twee tabbladen oefent, en komt gewiste voortgang niet terug uit een ouder tabblad.
function update(change) {
  load();
  change(prog);
  save();
}
function rec(id, ok) {
  update((p) => {
    const a = p.skills[id] || (p.skills[id] = []);
    a.push(ok ? 1 : 0);
    if (a.length > 5) a.shift();
  });
}
const skillPct = (id) => {
  const a = prog.skills[id] || [];
  return a.reduce((t, x) => t + x, 0) / 5;
};
const topicPct = (s) => s.skills.reduce((t, k) => t + skillPct(k.id), 0) / s.skills.length;
const resetProgress = () =>
  update((p) => {
    p.skills = {};
    p.stof = null;
    p.mapping = null;
  });

export {
  STORE,
  prog,
  opslag,
  inBrowser,
  load,
  update,
  cleanProgress,
  rec,
  skillPct,
  topicPct,
  resetProgress,
  migrateSkills,
  migrateIds,
  migrateScope,
};
