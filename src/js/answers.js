// Antwoorden lezen en nakijken. Bevat geen DOM-code, dus goed los te testen.
import { near, isNice } from './math.js';

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
  if (f.round) return Math.abs(v - f.a) <= 0.5 * 10 ** -f.round + 1e-6;
  if (/[.,]/.test(raw) && !isNice(f.a, 4)) return Math.abs(v - f.a) < 0.0051;
  return near(v, f.a);
}
function checkAnswer(q, vals) {
  if (q.mc) {
    const hit = vals[0] !== '' && vals[0] != null && +vals[0] === q.mc.a;
    return { each: [hit], ok: hit };
  }
  const each = q.fields.map((f, i) => checkField(f, vals[i] ?? ''));
  return { each, ok: each.every(Boolean) };
}
function findTrap(q, vals) {
  if (!q.traps || q.mc) return null;
  const v = q.fields.map((f, i) => (f.sel ? vals[i] : parseNum(vals[i])));
  for (const t of q.traps) {
    try {
      if (t.f(v)) return t.m;
    } catch (e) {}
  }
  return null;
}

export { parseNum, checkField, checkAnswer, findTrap };
