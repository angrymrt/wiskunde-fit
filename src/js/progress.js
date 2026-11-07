// Voortgang van de leerling. Blijft alleen in deze browser bewaard (localStorage).

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
const prog = { v: 3, skills: {}, tests: [], scope: 'all' };
try {
  const raw = localStorage.getItem(STORE);
  if (raw) {
    const saved = JSON.parse(raw);
    if (!saved.v) {
      saved.skills = migrateSkills(saved.skills || {});
      saved.v = 2;
      if (saved.scope === 'core') saved.scope = 'all';
    }
    // Altijd omzetten: een tabblad met de oude code kan nog een oude id hebben bewaard.
    saved.skills = migrateIds(saved.skills || {});
    saved.v = 3;
    Object.assign(prog, saved);
  }
} catch (e) {}
const save = () => {
  try {
    localStorage.setItem(STORE, JSON.stringify(prog));
  } catch (e) {}
};
function rec(id, ok) {
  const a = prog.skills[id] || (prog.skills[id] = []);
  a.push(ok ? 1 : 0);
  if (a.length > 5) a.shift();
  save();
}
const skillPct = (id) => {
  const a = prog.skills[id] || [];
  return a.reduce((t, x) => t + x, 0) / 5;
};
const secPct = (s) => s.skills.reduce((t, k) => t + skillPct(k.id), 0) / s.skills.length;
const inScope = (s, scope) => (scope === 'h1' ? s.ch === 1 : scope === 'h2' ? s.ch === 2 : true);
const SCOPES = [
  ['all', 'Heel hoofdstuk 1 en 2'],
  ['h1', 'Alleen hoofdstuk 1'],
  ['h2', 'Alleen hoofdstuk 2'],
];
const resetProgress = () => {
  prog.skills = {};
  prog.tests = [];
  prog.scope = 'all';
  save();
};

export {
  prog,
  save,
  rec,
  skillPct,
  secPct,
  inScope,
  SCOPES,
  resetProgress,
  migrateSkills,
  migrateIds,
};
