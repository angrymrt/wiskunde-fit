// Een lopende proeftoets en de laatste uitslag in de browser: bewaren, teruglezen, de klok en de uitslag
// in één zin. Dit moet bij het eerste bezoek al klaar zijn, want main.js leest ze meteen terug en Home
// en Mijn stof tonen de laatste uitslag. De rest van de proeftoets staat in exam.js, dat de browser pas
// laadt als het scherm nodig is (#188).
import { d, rd } from '../math.js';
import { inBrowser, opslag } from '../progress.js';
import { topicOf } from '../stof.js';
import { readVals } from './question-form.js';
import { state } from './state.js';

// Een lopende proeftoets en de laatste uitslag blijven in de browser bewaard, los van de voortgang.
const TEST_KEY = 'wiskundefit-proeftoets';
const RESULT_KEY = 'wiskundefit-uitslag';
// Verhoog dit als de vorm verandert. Wat dan nog in een browser staat, wordt niet meer gelezen.
const STORED = 1;

const elapsed = (t) => t.spent + (t.since ? Date.now() - t.since : 0);
// De klok loopt alleen zolang de proeftoets open is, ook als je die later afmaakt.
const pauseClock = (t) => {
  t.spent = elapsed(t);
  t.since = null;
};
function write(key, t) {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        ...t,
        v: STORED,
        spent: elapsed(t),
        since: null,
        items: t.items.map(({ topic, skill, ...x }) => ({ ...x, id: skill.id })),
      }),
    );
    opslag.toets = false;
  } catch (e) {
    if (inBrowser()) opslag.toets = true;
  }
}
// Of een bewaarde vraag nog na te kijken en te tekenen is. Bij de uitslag ook het nakijken zelf.
const fine = (n) => Number.isFinite(n);
function sound(x, result) {
  const q = x?.q;
  if (!q || typeof q !== 'object' || typeof q.q !== 'string' || !Array.isArray(x.vals))
    return false;
  const answer = q.mc
    ? Array.isArray(q.mc.opts) && Number.isInteger(q.mc.a)
    : Array.isArray(q.fields) && q.fields.length > 0;
  return answer && (!result || (Array.isArray(x.c?.each) && fine(x.got) && fine(x.max)));
}
// Geeft null als er niets is, als een vraagsoort niet meer bestaat, of als de vragen of de
// huidige vraag niet kloppen. Dan begint de leerling liever opnieuw dan dat de site vastloopt.
function read(key) {
  try {
    const t = JSON.parse(localStorage.getItem(key));
    if (t?.v !== STORED || !Array.isArray(t.items) || !t.items.length) return null;
    if ('i' in t && !(Number.isInteger(t.i) && t.i >= 0 && t.i < t.items.length)) return null;
    const result = key === RESULT_KEY;
    if (!fine(t.spent) || (result && !(fine(t.score) && fine(t.max) && fine(t.time)))) return null;
    if (!t.items.every((x) => sound(x, result))) return null;
    t.items = t.items.map(({ id, ...x }) => {
      const topic = topicOf(id);
      return { ...x, topic, skill: topic.skills.find((k) => k.id === id) };
    });
    return t;
  } catch (e) {
    return null;
  }
}
function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}
// Lukte het bewaren van de proeftoets niet, dan is die in het geheugen het nieuwst.
function loadTests() {
  if (!opslag.toets || !state.test) state.test = read(TEST_KEY);
  state.result = read(RESULT_KEY);
}
const saveTest = () => write(TEST_KEY, state.test);
// Of deze proeftoets nog de bewaarde is. Een ander tabblad kan hem hebben ingeleverd, gestopt of
// een nieuwe zijn begonnen. Lukte het bewaren niet, dan is wat in het geheugen staat het nieuwst.
// Een proeftoets van voor versie 1.11.4 heeft geen id; die blijft gewoon lopen.
function current() {
  if (!state.test) return false;
  if (opslag.toets) return true;
  try {
    const raw = localStorage.getItem(TEST_KEY);
    return (raw === null ? null : JSON.parse(raw)?.id) === state.test.id;
  } catch (e) {
    return true;
  }
}
// Er loopt geen proeftoets meer, dus er is ook niets meer dat niet bewaard kon worden.
function stopTest() {
  state.test = null;
  opslag.toets = false;
  remove(TEST_KEY);
}
function forgetTests() {
  stopTest();
  state.result = null;
  remove(RESULT_KEY);
}

const gradeOf = (t) => 1 + (9 * t.score) / t.max;
// Het resultaat in één zin, voor het overzicht, Mijn stof en het scherm Proeftoets.
const resultText = (t) => `${t.score} van ${t.max} punten, ongeveer een ${d(rd(gradeOf(t), 1))}`;
const fmtT = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const clockText = (t) => fmtT(Math.floor(elapsed(t) / 1000));
// Bewaart de proeftoets met wat er nu is ingevuld. Loopt die niet meer, dan neemt dit tabblad over
// wat er nu bewaard is en geeft dit false. Zo zet een tabblad dat achterliep, bijvoorbeeld omdat
// de browser het had stilgezet, een ingeleverde proeftoets niet terug, en telt die niet dubbel.
function storeTest() {
  if (!current()) {
    loadTests();
    return false;
  }
  if (globalThis.document?.getElementById('tform')) {
    state.test.items[state.test.i].vals = readVals(state.test.items[state.test.i].q, 't');
    saveTest();
  }
  return true;
}

export {
  TEST_KEY,
  RESULT_KEY,
  elapsed,
  pauseClock,
  write,
  loadTests,
  saveTest,
  storeTest,
  stopTest,
  forgetTests,
  gradeOf,
  resultText,
  fmtT,
  clockText,
};
