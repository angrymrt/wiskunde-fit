// Voortgang van de leerling. Blijft alleen in deze browser bewaard (localStorage).

// Oude naam van de site. Laat dit staan: een nieuwe sleutel wist de opgeslagen voortgang.
const STORE = 'lijn-driehoek-v1';
const prog = { skills: {}, tests: [], scope: 'all' };
try {
  const raw = localStorage.getItem(STORE);
  if (raw) Object.assign(prog, JSON.parse(raw));
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
const inScope = (s, scope) =>
  scope === 'core' ? s.core : scope === 'h1' ? s.ch === 1 : scope === 'h2' ? s.ch === 2 : true;
const SCOPES = [
  ['all', 'Heel hoofdstuk 1 en 2'],
  ['core', 'Paragrafen met uitwerkingen'],
  ['h1', 'Alleen hoofdstuk 1'],
  ['h2', 'Alleen hoofdstuk 2'],
];
const resetProgress = () => {
  prog.skills = {};
  prog.tests = [];
  save();
};

export { prog, save, rec, skillPct, secPct, inScope, SCOPES, resetProgress };
