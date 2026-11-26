// Antwoorden lezen en nakijken. Bevat geen DOM-code, dus goed los te testen.
import { near, isNice, rd, roundText, gcd, TEKEN, Q, d, fr } from './math.js';

const netjes = (s) => String(s).trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
function parseNum(s) {
  s = netjes(s);
  if (!s) return NaN;
  let neg = false;
  if (s[0] === '-' || s[0] === '+') {
    neg = s[0] === '-';
    s = s.slice(1).trim();
  }
  // Duizendtallen met een spatie ertussen, zoals 16 100 of 1 250 000.
  if (/^\d{1,3}( \d{3})+([.,]\d+)?$/.test(s)) s = s.replace(/ /g, '');
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
// De vorm van een breuk in een antwoord (#244). Een veld met vorm keurt een antwoord met de goede
// waarde af als de vorm niet klopt, en geeft dan een eigen valkuil uit vormTraps.
// - vereenvoudigd: zo ver mogelijk vereenvoudigd. 7/2 en 3 1/2 zijn allebei goed, 14/4, 1 2/4 en
//   1 3/2 niet. Een heel getal staat zonder breuk: 4, niet 4/1 of 8/2.
// - gemengd: vereenvoudigd, met de helen eruit gehaald: 3 1/2, niet 7/2.
// - onecht: vereenvoudigd, met de helen binnen de breuk: 7/2, niet 3 1/2.
// Een kommagetal is bij elke vorm fout, ook 3,5 bij 7/2: de vraag vraagt om een breuk.
const VORMEN = ['vereenvoudigd', 'gemengd', 'onecht'];
// Leest de vorm van wat de leerling typte: een heel getal, een breuk (t/n) of een gemengd getal
// (heel t/n), of een kommagetal. Geeft null als het geen getal is.
function leesVorm(raw) {
  const s = netjes(raw).replace(/^[-+] ?/, '');
  let m;
  if (/^\d+$|^\d{1,3}( \d{3})+$/.test(s)) return { soort: 'heel' };
  if ((m = s.match(/^(\d+)\/(\d+)$/))) return { soort: 'breuk', heel: 0, t: +m[1], n: +m[2] };
  if ((m = s.match(/^(\d+) (\d+)\/(\d+)$/)))
    return { soort: 'gemengd', heel: +m[1], t: +m[2], n: +m[3] };
  if (/^(\d+([.,]\d*)?|[.,]\d+)$|^\d{1,3}( \d{3})+[.,]\d+$/.test(s)) return { soort: 'komma' };
  return null;
}
// Geeft de id van de vormfout, of null als de vorm klopt of het geen getal is.
function vormFout(vorm, raw) {
  const b = leesVorm(raw);
  if (!b || b.soort === 'heel') return null;
  if (b.soort === 'komma') return 'kommagetal-bij-breuk';
  if (!b.n) return null;
  if (b.soort === 'gemengd' && !b.heel) return 'nul-helen';
  if (b.t % b.n === 0) return 'heel-getal-als-breuk';
  if (gcd(b.t, b.n) > 1) return 'breuk-niet-vereenvoudigd';
  if (b.soort === 'gemengd' && vorm === 'onecht') return 'helen-niet-binnen-de-breuk';
  if (b.soort === 'gemengd' && b.t > b.n) return 'gemengd-getal-te-grote-breuk';
  if (b.soort === 'breuk' && b.t > b.n && vorm === 'gemengd') return 'helen-niet-eruit';
  return null;
}
function checkField(f, raw) {
  if (f.sel) return raw === f.a;
  const v = parseNum(raw);
  if (Number.isNaN(v)) return false;
  if (f.vorm && vormFout(f.vorm, raw)) return false;
  // Bij afronden is alleen het goed afgeronde getal goed: bij 3,75 en 1 decimaal is 3,8 goed en
  // 3,7 fout. Meer decimalen is fout, ook als ze kloppen. Minder mag als het precies hetzelfde
  // getal is: 8 bij 7,96 en 1 decimaal, want dat is 8,0.
  if (f.round != null) return near(v, rd(f.a, f.round), 1e-9);
  if (/[.,]/.test(raw) && !isNice(f.a, 4)) return Math.abs(v - f.a) < 0.0051;
  return near(v, f.a);
}
// Op hoeveel decimalen een getal staat, of Infinity bij een breuk als 2/3. Een geheel getal met
// nullen aan het eind telt negatief, net als bij afronden: 37 000 staat op −3, duizendtallen.
const places = (x) => {
  if (isNice(x, 0)) {
    let k = 0;
    while (k > -9 && x && isNice(x, k - 1)) k--;
    return k;
  }
  for (let k = 1; k <= 6; k++) if (isNice(x, k)) return k;
  return Infinity;
};
// De valkuilen die elke vraag met afronden vanzelf krijgt. Zie makeQuestion in topics/index.js.
function roundTraps(fields = []) {
  const rounded = fields.filter((f) => f.round != null);
  if (!rounded.length) return [];
  const op = roundText(rounded[0].round);
  // In een groep kan elk getal bij elk antwoord van de groep horen, zie matchFields. Een getal dat
  // goed is voor een van die antwoorden, valt in geen van deze valkuilen.
  const mates = (i) =>
    fields[i].grp != null ? fields.filter((g) => g.grp === fields[i].grp) : [fields[i]];
  const right = (ms, x) => ms.some((g) => near(x, g.round != null ? rd(g.a, g.round) : g.a, 1e-9));
  const some = (test) => (v) =>
    fields.some(
      (f, i) =>
        Number.isFinite(v[i]) &&
        !right(mates(i), v[i]) &&
        mates(i).some((g) => g.round != null && test(g, v[i])),
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
// De valkuilen die elke vraag met een vorm van een breuk vanzelf krijgt (#244). Zie makeQuestion in
// topics/index.js. Een valkuil krijgt naast de getallen ook wat de leerling typte (raw), want 7/2 en
// 3 1/2 zijn hetzelfde getal. Hij valt alleen als elk veld de goede waarde heeft, zodat "Je antwoord
// klopt" ook echt klopt, en als minstens één veld deze vormfout heeft.
function vormTraps(fields = []) {
  if (!fields.some((f) => f.vorm)) return [];
  // In een groep hoort elk getal bij een antwoord van de groep dat nog niet is gebruikt, net als bij
  // het nakijken (matchFields). Het koppelen gaat op de waarde, zonder op de vorm te letten, zodat
  // 14/4 bij 7/2 hoort. Twee keer 14/4 bij 7/2 en 5/2 valt dus niet in een valkuil.
  const zonderVorm = fields.map(({ vorm, ...f }) => f);
  const fout = (v, raw, i, to) => {
    const g = fields[to[i]];
    if (checkField(g, raw[i] ?? '')) return null;
    return g.vorm && Number.isFinite(v[i]) && near(v[i], g.a) ? vormFout(g.vorm, raw[i]) : null;
  };
  const trap = (id, m) => ({
    id,
    f: (v, raw = []) => {
      const to = matchFields(zonderVorm, raw);
      return (
        fields.every((f, i) => fout(v, raw, i, to) || checkField(fields[to[i]], raw[i] ?? '')) &&
        fields.some((f, i) => fout(v, raw, i, to) === id)
      );
    },
    m,
  });
  // Bij een heel getal als antwoord helpt "schrijf het als breuk" niet.
  const breuk = fields.some((f) => f.vorm && !Number.isInteger(f.a));
  return [
    trap(
      'kommagetal-bij-breuk',
      breuk
        ? 'Je antwoord klopt, maar schrijf het als breuk, niet als kommagetal.'
        : 'Je antwoord klopt, maar schrijf het zonder komma.',
    ),
    trap('nul-helen', 'Je antwoord klopt, maar schrijf het zonder 0 helen ervoor.'),
    trap(
      'heel-getal-als-breuk',
      'Je antwoord klopt, maar het is een heel getal. Schrijf het zonder breuk.',
    ),
    trap(
      'breuk-niet-vereenvoudigd',
      'Je antwoord klopt, maar je kunt de breuk nog vereenvoudigen.',
    ),
    trap(
      'helen-niet-binnen-de-breuk',
      'Je antwoord klopt, maar breng de helen nog binnen de breuk: schrijf het als één breuk.',
    ),
    trap(
      'gemengd-getal-te-grote-breuk',
      'Je antwoord klopt, maar de breuk in je gemengde getal is groter dan 1. Haal er nog helen uit.',
    ),
    trap(
      'helen-niet-eruit',
      'Je antwoord klopt, maar haal de helen er nog uit: schrijf het als gemengd getal.',
    ),
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
// Bij een parabool tekenen is de top precies één punt, en zijn twee andere punten op de parabool
// goed. Die mogen niet gelijk zijn aan elkaar of aan de top. Zie drawParabola in topics/shared.js.
function checkParabola({ a, b, c }, v) {
  const h = -b / (2 * a),
    on = (x, y) => near(a * x * x + b * x + c, y),
    top = near(v[0], h) && near(v[1], a * h * h + b * h + c),
    // Een punt op de parabool met x_top is de top zelf.
    second = on(v[2], v[3]) && !near(v[2], h),
    third = on(v[4], v[5]) && !near(v[4], h) && !(near(v[4], v[2]) && near(v[5], v[3]));
  return [top, top, second, second, third, third];
}
// Een tekenvraag: een lijn of een parabool in een rooster, of een tekening met q.teken, zoals een
// kubus afmaken (zie tekenvragen.js).
const isDrawing = (q) => !!(q.line || q.parabola || q.teken);
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
  const nums = () => q.fields.map((f, i) => parseNum(vals[i] ?? ''));
  const each = q.teken
    ? TEKEN.nakijken(q.teken, vals[0] ?? '')
    : q.line
      ? checkLine(q.line, nums())
      : q.parabola
        ? checkParabola(q.parabola, nums())
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
// Een valkuil bij een groep kijkt dus zelf naar alle velden van de groep. Als tweede argument krijgt
// een valkuil wat de leerling typte, voor de vorm van een breuk (vormTraps).
function findTrap(q, vals) {
  if (!q.traps) return null;
  const v = q.mc
    ? [q.mc.opts[+vals[0]]]
    : q.fields.map((f, i) => (f.sel || f.teken ? vals[i] : parseNum(vals[i])));
  for (const t of q.traps) {
    try {
      if (t.f(v, vals)) return t;
    } catch (e) {}
  }
  return null;
}

// Het goede antwoord zoals de uitslag van de proeftoets het toont. Bij een veld met een vorm (#244) staat het antwoord altijd als breuk, in die vorm: 3,5 zou daar fout zijn.
// Daar zoekt het de kleinste noemer tot 1000, zodat ook 19/24 of 3/14 een breuk blijft.
const NOEMERS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16],
  ALLE_NOEMERS = Array.from({ length: 999 }, (_, i) => i + 2);
function fmtAns(a, vorm) {
  if (Number.isInteger(a) || (!vorm && isNice(a, 4))) return d(a);
  for (const den of vorm ? ALLE_NOEMERS : NOEMERS) {
    const n = a * den;
    if (!near(n, Math.round(n))) continue;
    const q = Q(Math.round(n), den);
    return vorm === 'onecht' ? `${q.n < 0 ? '-' : ''}{${Math.abs(q.n)}/${q.d}}` : fr(q);
  }
  return d(rd(a, 2));
}

export {
  fmtAns,
  parseNum,
  checkField,
  checkAnswer,
  matchFields,
  fillState,
  findTrap,
  roundTraps,
  vormTraps,
  vormFout,
  VORMEN,
  isDrawing,
};
