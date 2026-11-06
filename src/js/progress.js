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
const prog = { v: 2, skills: {}, tests: [], scope: 'all' };
try {
  const raw = localStorage.getItem(STORE);
  if (raw) {
    const saved = JSON.parse(raw);
    if (!saved.v) {
      saved.skills = migrateSkills(saved.skills || {});
      saved.v = 2;
      if (saved.scope === 'core') saved.scope = 'all';
    }
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

export { prog, save, rec, skillPct, secPct, inScope, SCOPES, resetProgress, migrateSkills };
