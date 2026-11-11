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
  // In een groep kan elk getal bij elk antwoord van de groep horen, zie matchFields. Een getal dat
  // goed is voor een van die antwoorden, valt in geen van deze valkuilen.
  const mates = (i) =>
    fields[i].grp != null ? fields.filter((g) => g.grp === fields[i].grp) : [fields[i]];
  const right = (ms, x) => ms.some((g) => near(x, g.round ? rd(g.a, g.round) : g.a, 1e-9));
  const some = (test) => (v) =>
    fields.some(
      (f, i) =>
        Number.isFinite(v[i]) &&
        !right(mates(i), v[i]) &&
        mates(i).some((g) => g.round && test(g, v[i])),
    );
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
// Velden met dezelfde groep (grp), zoals de twee velden bij x = −2 ∨ x = 9, worden zonder volgorde
// nagekeken: elk ingevuld getal mag bij een antwoord van de groep horen dat nog niet is gebruikt.
// Geeft per veld het veld waarvan het antwoord erbij hoort. Van alle manieren om de getallen bij de
// antwoorden te zetten, telt die met de meeste goede velden. Bij gelijkspel wint de gewone volgorde,
// zodat de uitslag bij hetzelfde antwoord steeds hetzelfde laat zien. Een groep heeft hoogstens een
// paar velden, dus alle volgordes proberen gaat snel.
const orders = (a) =>
  a.length < 2
    ? [a]
    : a.flatMap((x, i) => orders([...a.slice(0, i), ...a.slice(i + 1)]).map((p) => [x, ...p]));
function matchFields(fields, vals = []) {
  const to = fields.map((f, i) => i),
    groups = new Map();
  fields.forEach((f, i) => {
    if (f.grp != null && !f.sel) groups.set(f.grp, [...(groups.get(f.grp) || []), i]);
  });
  for (const idx of groups.values()) {
    let best = idx,
      most = -1;
    for (const p of orders(idx)) {
      const n = idx.filter((i, k) => checkField(fields[p[k]], vals[i] ?? '')).length;
      if (n > most) {
        best = p;
        most = n;
      }
    }
    idx.forEach((i, k) => (to[i] = best[k]));
  }
  return to;
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
    : matchFields(q.fields, vals).map((j, i) => checkField(q.fields[j], vals[i] ?? ''));
  return { each, ok: each.every(Boolean) };
}
// Of een vraag leeg, half of helemaal is ingevuld. Alleen spaties telt als leeg, en bij een
// tekenvraag is één punt half. Voor de lijst met vragen en Inleveren bij een proeftoets.
function fillState(q, vals = []) {
  const has = (v) => String(v ?? '').trim() !== '';
  if (q.mc) return has(vals[0]) ? 'ingevuld' : 'leeg';
  const n = q.fields.filter((f, i) => has(vals[i])).length;
  return n === 0 ? 'leeg' : n === q.fields.length ? 'ingevuld' : 'half';
}
// Geeft de eerste valkuil waar het antwoord in valt, met de gerichte feedback in m.
// Bij meerkeuze krijgt een valkuil de tekst van de gekozen keuze, zoals [q.mc.opts[2]].
// Een valkuil krijgt de getallen in de volgorde waarin ze zijn ingevuld, ook bij een groep velden.
// Een valkuil bij een groep kijkt dus zelf naar alle velden van de groep.
function findTrap(q, vals) {
  if (!q.traps) return null;
  const v = q.mc
    ? [q.mc.opts[+vals[0]]]
    : q.fields.map((f, i) => (f.sel ? vals[i] : parseNum(vals[i])));
  for (const t of q.traps) {
    try {
      if (t.f(v)) return t;
    } catch (e) {}
  }
  return null;
}

export { parseNum, checkField, checkAnswer, matchFields, fillState, findTrap, roundTraps };
