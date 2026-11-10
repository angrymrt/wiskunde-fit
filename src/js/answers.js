// Antwoorden lezen en nakijken. Bevat geen DOM-code, dus goed los te testen.
import { near, isNice, rd } from './math.js';

function parseNum(s) {
  s = String(s).trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
  if (!s) return NaN;
  let neg = false;
  if (s[0] === '-' || s[0] === '+') {
    neg = s[0] === '-';
    s = s.slice(1).trim();
  }
  let m, v;
  if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/))) {
    if (+m[3] === 0) return NaN;
    v = +m[1] + m[2] / m[3];
  } else if ((m = s.match(/^(\d+)\/(\d+)$/))) {
    if (+m[2] === 0) return NaN;
    v = m[1] / m[2];
  } else if (/^(\d+([.,]\d*)?|[.,]\d+)$/.test(s)) v = parseFloat(s.replace(',', '.'));
  else return NaN;
  return neg ? -v : v;
}
function checkField(f, raw) {
  if (f.sel) return raw === f.a;
  const v = parseNum(raw);
  if (Number.isNaN(v)) return false;
  // Bij afronden is alleen het goed afgeronde getal goed: bij 3,75 en 1 decimaal is 3,8 goed en
  // 3,7 fout. Meer decimalen is fout, ook als ze kloppen. Minder mag als het precies hetzelfde
  // getal is: 8 bij 7,96 en 1 decimaal, want dat is 8,0.
  if (f.round) return near(v, rd(f.a, f.round), 1e-9);
  if (/[.,]/.test(raw) && !isNice(f.a, 4)) return Math.abs(v - f.a) < 0.0051;
  return near(v, f.a);
}
// Het aantal decimalen van een getal, of Infinity bij een breuk als 2/3.
const places = (x) => {
  for (let k = 0; k <= 6; k++) if (isNice(x, k)) return k;
  return Infinity;
};
// De valkuilen die elke vraag met afronden vanzelf krijgt. Zie makeQuestion in topics/index.js.
function roundTraps(fields = []) {
  const rounded = fields.filter((f) => f.round);
  if (!rounded.length) return [];
  const n = rounded[0].round,
    op = n === 1 ? '1 decimaal' : `${n} decimalen`;
  const some = (test) => (v) =>
    fields.some((f, i) => f.round && Number.isFinite(v[i]) && test(f, v[i]));
  return [
    {
      // Het antwoord klopt, maar is niet of niet ver genoeg afgerond, zoals 8,18 bij 8,1818.
      id: 'te-veel-decimalen',
      f: some(
        (f, x) => places(x) > f.round && (near(x, f.a, 1e-9) || near(x, rd(f.a, places(x)), 1e-9)),
      ),
      m: `Bijna: rond je antwoord nog af op ${op}.`,
    },
    {
      // Naar de verkeerde kant afgerond of afgekapt, zoals 3,7 bij 3,75.
      id: 'verkeerd-afgerond',
      f: some(
        (f, x) =>
          places(x) <= f.round &&
          !near(x, rd(f.a, f.round), 1e-9) &&
          Math.abs(x - f.a) < 10 ** -f.round,
      ),
      m: 'Bijna, maar je hebt verkeerd afgerond. Is het eerste cijfer dat wegvalt 5 of meer, rond dan naar boven af.',
    },
  ];
}
// Bij een tekenvraag is elk paar verschillende punten op de lijn goed. Zie drawLine in topics/shared.js.
function checkLine({ a, b }, v) {
  const on = (x, y) => near(a * x + b, y),
    same = near(v[0], v[2]) && near(v[1], v[3]),
    first = on(v[0], v[1]),
    second = on(v[2], v[3]) && !same;
  return [first, first, second, second];
}
function checkAnswer(q, vals) {
  if (q.mc) {
    const hit = vals[0] !== '' && vals[0] != null && +vals[0] === q.mc.a;
    return { each: [hit], ok: hit };
  }
  const each = q.line
    ? checkLine(
        q.line,
        q.fields.map((f, i) => parseNum(vals[i] ?? '')),
      )
    : q.fields.map((f, i) => checkField(f, vals[i] ?? ''));
  return { each, ok: each.every(Boolean) };
}
// Geeft de eerste valkuil waar het antwoord in valt, met de gerichte feedback in m.
function findTrap(q, vals) {
  if (!q.traps || q.mc) return null;
  const v = q.fields.map((f, i) => (f.sel ? vals[i] : parseNum(vals[i])));
  for (const t of q.traps) {
    try {
      if (t.f(v)) return t;
    } catch (e) {}
  }
  return null;
}

export { parseNum, checkField, checkAnswer, findTrap, roundTraps };
