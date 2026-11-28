// Een uitdrukking die de leerling zelf typt (#304), zoals 12a^3b^6, 2a/(3c), 6√3 of (3y + 4x)/(xy):
// lezen, vergelijken met het goede antwoord, nakijken of hij herleid is, en de valkuilen. Dit bestand
// laadt alleen met de onderwerpen die zo'n veld hebben, zodat het eerste bezoek niet groter wordt. Het
// vult UITDRUKKING uit math.js in, dat checkField in answers.js en het formulier gebruiken, net als
// BEREKENING bij een berekening. Geen DOM: de tests draaien het in Node.
//
// Een generator maakt het veld met UF en zet de vraag in metUitdrukking, zie de skill vraag-toevoegen.
import { checkField } from './answers.js';
import { gcd, UITDRUKKING } from './math.js';
import { esc } from './typeset.js';

// ---------------------------------------------------------------------------------------------------
// Rekenen, exact. Een getal is een breuk { n, d } met d > 0. Wordt een getal te groot om precies te
// rekenen, of deelt de leerling door 0, dan is de uitdrukking niet te lezen.
const KAPOT = new Error('uitdrukking');
const veilig = (x) => {
  if (!Number.isSafeInteger(x)) throw KAPOT;
  return x;
};
const R = (n, d = 1) => {
  veilig(n);
  veilig(d);
  if (!d) throw KAPOT;
  if (d < 0) [n, d] = [-n, -d];
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
};
const rPlus = (a, b) => R(a.n * b.d + b.n * a.d, a.d * b.d);
const rKeer = (a, b) => R(a.n * b.n, a.d * b.d);
const EEN = R(1);

// Haalt het grootste kwadraat uit n: n = k² · r, met r zonder kwadraat erin. √n = k√r. Alleen voor
// een getal dat de leerling onder het wortelteken zet, dus niet te groot.
function kwadraatEruit(n) {
  if (n > 1e9) throw KAPOT;
  let k = 1,
    r = n;
  for (let f = 2; f * f <= r; f++)
    while (r % (f * f) === 0) {
      r /= f * f;
      k *= f;
    }
  return { k, r };
}

// Een term is een getal (c) keer letters met een exponent (m, zoals { a: 3, b: 6 }) keer de wortel van
// een getal zonder kwadraat erin (r; 1 als er geen wortel is). Twee termen met dezelfde letters,
// exponenten en wortel zijn gelijksoortig: ze hebben dezelfde sleutel. Een veelterm is een Map van
// sleutel naar term. Omdat de wortels van verschillende getallen zonder kwadraat niet in elkaar over
// te zetten zijn, zijn twee veeltermen alleen gelijk als ze dezelfde termen hebben.
const sleutel = (m, r) =>
  `${Object.keys(m)
    .sort()
    .map((l) => l + m[l])
    .join('')}√${r}`;
function voegToe(p, t) {
  if (!t.c.n) return;
  const k = sleutel(t.m, t.r),
    oud = p.get(k);
  if (!oud) p.set(k, t);
  else {
    const c = rPlus(oud.c, t.c);
    if (c.n) p.set(k, { ...oud, c });
    else p.delete(k);
  }
  if (p.size > 300) throw KAPOT;
}
const veelterm = (...termen) => {
  const p = new Map();
  termen.forEach((t) => voegToe(p, t));
  return p;
};
const tegengesteld = (t) => ({ ...t, c: R(-t.c.n, t.c.d) });
function pPlus(a, b, teken = 1) {
  const p = new Map(a);
  for (const t of b.values()) voegToe(p, teken < 0 ? tegengesteld(t) : t);
  return p;
}
// Twee wortels zonder kwadraat erin: √p · √q = g√((p/g)(q/g)) met g de ggd, en daar zit weer geen
// kwadraat in.
const wortelKeer = (p, q) => {
  const g = gcd(p, q);
  return { k: g, r: veilig((p / g) * (q / g)) };
};
function tKeer(s, t) {
  const m = { ...s.m };
  for (const l in t.m) m[l] = (m[l] || 0) + t.m[l];
  const { k, r } = wortelKeer(s.r, t.r);
  return { c: rKeer(rKeer(s.c, t.c), R(k)), m, r };
}
function pKeer(a, b) {
  const p = new Map();
  for (const s of a.values()) for (const t of b.values()) voegToe(p, tKeer(s, t));
  return p;
}

// Een waarde is een breuk van twee veeltermen: teller t en noemer n. Zo kan ook 2a/(3c) of
// (3y + 4x)/(xy). De breuk wordt nooit vereenvoudigd; gelijk vergelijkt kruiselings.
const W = (t, n = veelterm({ c: EEN, m: {}, r: 1 })) => ({ t, n });
const wPlus = (a, b, teken = 1) =>
  W(pPlus(pKeer(a.t, b.n), pKeer(b.t, a.n), teken), pKeer(a.n, b.n));
const wKeer = (a, b) => W(pKeer(a.t, b.t), pKeer(a.n, b.n));
function wDeel(a, b) {
  if (!b.t.size) throw KAPOT;
  return W(pKeer(a.t, b.n), pKeer(a.n, b.t));
}
function wMacht(a, e) {
  if (!e && !a.t.size) throw KAPOT;
  let x = W(veelterm({ c: EEN, m: {}, r: 1 }));
  for (let i = 0; i < e; i++) x = wKeer(x, a);
  return x;
}
// Het getal van een waarde zonder letters en wortels, of null.
function getalVan(w) {
  const los = (p) => {
    if (!p.size) return R(0);
    const [t] = p.values();
    return p.size === 1 && t.r === 1 && !Object.keys(t.m).length ? t.c : null;
  };
  const t = los(w.t),
    n = los(w.n);
  return t && n ? rKeer(t, R(n.d, n.n)) : null;
}
// De wortel van een getal: √(p/q) = √(pq)/q. Onder de wortel mag alleen een getal van 0 of meer staan.
function wWortel(a) {
  const q = getalVan(a);
  if (!q || q.n < 0) throw KAPOT;
  if (!q.n) return W(veelterm());
  const { k, r } = kwadraatEruit(veilig(q.n * q.d));
  return W(veelterm({ c: R(k, q.d), m: {}, r }));
}
const gelijk = (a, b) => !pPlus(pKeer(a.t, b.n), pKeer(b.t, a.n), -1).size;
// De hoogste graad van een veelterm: het grootste aantal letters in een term, met de exponenten.
const graad = (p) =>
  Math.max(0, ...[...p.values()].map((t) => Object.values(t.m).reduce((s, e) => s + e, 0)));

// ---------------------------------------------------------------------------------------------------
// Lezen. Eerst gaat wat de leerling typte naar één schrijfwijze: − en – worden -, ·, × en * worden *,
// ÷ wordt :, ² en ³ worden ^2 en ^3, en ½ wordt 1/2 (en 2½ wordt 2 1/2).
const SUPER = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const BREUKEN = {
  '½': '1/2',
  '⅓': '1/3',
  '⅔': '2/3',
  '¼': '1/4',
  '¾': '3/4',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
};
const normaal = (s) =>
  String(s ?? '')
    .replace(/[−–‒]/g, '-')
    .replace(/[·×∙⋅]/g, '*')
    .replace(/÷/g, ':')
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^${[...m].map((c) => SUPER.indexOf(c)).join('')}`)
    .replace(/(\d?)([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, (m, d, b) => `${d ? `${d} ` : ''}${BREUKEN[b]}`)
    .replace(/\s+/g, ' ')
    .trim();

// De tekens: getallen, letters a tot en met z, rekentekens, haakjes, ^ en √. Bij elk teken staat of er
// een spatie voor stond. Daarna worden twee soorten getallen één getal:
// - een breuk van twee hele getallen zonder spatie rond de streep, zoals 2/3 in 2/3a of 7/3x. Dat is
//   één getal, zodat 7/3x hetzelfde is als 7/3 · x. Na ^ en √ niet: x^2/3 is x²/3 en √2/3 is √2/3.
//   En ook niet voor ^: 2/3^2 is 2/9.
// - een gemengd getal: een heel getal, een spatie en zo'n breuk, zoals 2 1/3.
function tekens(s) {
  const re = /( ?)(\d+(?:[.,]\d+)?|[a-z]|[-+*/:()^√])/y,
    ruw = [];
  let m;
  while (re.lastIndex < s.length) {
    if (!(m = re.exec(s))) return null;
    ruw.push({ w: m[2], sp: !!m[1] });
  }
  const heel = (t) => !!t && /^\d+$/.test(t.w);
  const breukBij = (j) =>
    heel(ruw[j]) &&
    ruw[j + 1]?.w === '/' &&
    !ruw[j + 1].sp &&
    heel(ruw[j + 2]) &&
    !ruw[j + 2].sp &&
    ruw[j + 3]?.w !== '^';
  const uit = [];
  for (let i = 0; i < ruw.length; i++) {
    const t = ruw[i],
      voor = uit[uit.length - 1],
      mag = !voor || (voor.w !== '^' && voor.w !== '√');
    if (mag && heel(t) && ruw[i + 1]?.sp && breukBij(i + 1)) {
      const [h, a, b] = [+t.w, +ruw[i + 1].w, +ruw[i + 3].w];
      if (!b) return null;
      uit.push({ k: 'getal', vorm: 'gemengd', h, a, b, q: R(h * b + a, b) });
      i += 3;
    } else if (mag && breukBij(i)) {
      const [a, b] = [+t.w, +ruw[i + 2].w];
      if (!b) return null;
      uit.push({ k: 'getal', vorm: 'breuk', a, b, q: R(a, b) });
      i += 2;
    } else if (/^\d/.test(t.w)) {
      const [voorK, na = ''] = t.w.split(/[.,]/);
      uit.push({
        k: 'getal',
        vorm: na ? 'komma' : 'heel',
        tekst: na ? `${voorK},${na}` : t.w,
        q: R(veilig(+(voorK + na)), 10 ** na.length),
      });
    } else uit.push({ k: /[a-z]/.test(t.w) ? 'letter' : 'teken', w: t.w });
  }
  return uit;
}

// Leest de tekens met de gewone voorrang: haakjes, dan machten, dan keer en delen, dan plus en min.
// Letters, haakjes en wortels achter elkaar zijn keer, zoals in 12a^3b^6 of 2(x + 3). Een getal mag
// alleen vooraan zo'n rij staan: a2 is niet te lezen. Wat achter / of : staat, is zo'n rij, dus 2a/3c is
// 2a/(3c). Een min vooraan, na een rekenteken of na ( hoort bij wat erachter staat: -x^2 is −(x²).
// Achter √ staat een getal, een letter of iets tussen haakjes; achter ^ een heel getal tot en met 40.
// De boom heeft knopen { k: 'getal' }, { k: 'letter', w }, { k: 'wortel', a }, { k: 'macht', a, e },
// { k: 'haakjes', a }, { k: 'min', a } en { k: '*' | '/' | '+' | '-', a, b }. Bij * staat in x of
// het maalteken er stond, en bij / in op of het / of : was.
function boom(ts) {
  let i = 0;
  const is = (w) => ts[i]?.k === 'teken' && ts[i].w === w;
  const neem = (w) => {
    if (!is(w)) throw KAPOT;
    i++;
  };
  function basis() {
    const t = ts[i];
    if (!t) throw KAPOT;
    if (t.k === 'getal' || t.k === 'letter') {
      i++;
      return t;
    }
    if (is('(')) {
      i++;
      const a = som();
      neem(')');
      return { k: 'haakjes', a };
    }
    if (is('√')) {
      i++;
      return { k: 'wortel', a: basis() };
    }
    throw KAPOT;
  }
  function macht() {
    const a = basis();
    if (!is('^')) return a;
    i++;
    const haak = is('(');
    if (haak) i++;
    const e = ts[i++];
    if (e?.k !== 'getal' || e.vorm !== 'heel' || +e.tekst > 40) throw KAPOT;
    if (haak) neem(')');
    if (is('^')) throw KAPOT;
    return { k: 'macht', a, e: +e.tekst };
  }
  const factorHier = () =>
    ts[i] && (ts[i].k === 'getal' || ts[i].k === 'letter' || is('(') || is('√'));
  function rij() {
    let x = macht();
    while (factorHier()) {
      if (ts[i].k === 'getal') throw KAPOT;
      x = { k: '*', a: x, b: macht(), x: false };
    }
    return x;
  }
  function eenTerm() {
    if (is('-')) {
      i++;
      return { k: 'min', a: eenTerm() };
    }
    if (is('+')) {
      i++;
      return eenTerm();
    }
    return rij();
  }
  function product() {
    let x = eenTerm();
    while (is('*') || is('/') || is(':')) {
      const op = ts[i++].w;
      const y = eenTerm();
      x = op === '*' ? { k: '*', a: x, b: y, x: true } : { k: '/', a: x, b: y, op };
    }
    return x;
  }
  function som() {
    let x = product();
    while (is('+') || is('-')) {
      const op = ts[i++].w;
      x = { k: op, a: x, b: product() };
    }
    return x;
  }
  const x = som();
  if (i < ts.length) throw KAPOT;
  return x;
}

// De waarde van een boom.
function waarde(n) {
  switch (n.k) {
    case 'getal':
      return W(veelterm({ c: n.q, m: {}, r: 1 }));
    case 'letter':
      return W(veelterm({ c: EEN, m: { [n.w]: 1 }, r: 1 }));
    case 'wortel':
      return wWortel(waarde(n.a));
    case 'macht':
      return wMacht(waarde(n.a), n.e);
    case 'haakjes':
      return waarde(n.a);
    case 'min':
      return wKeer(W(veelterm({ c: R(-1), m: {}, r: 1 })), waarde(n.a));
    case '*':
      return wKeer(waarde(n.a), waarde(n.b));
    case '/':
      return wDeel(waarde(n.a), waarde(n.b));
    default:
      return wPlus(waarde(n.a), waarde(n.b), n.k === '-' ? -1 : 1);
  }
}

// Leest wat de leerling typte. Geeft { boom, w } met de boom en de waarde, of null als het niet te lezen
// is. Wat al eens gelezen is, staat in een geheugen, want de valkuilen lezen hetzelfde antwoord vaak.
const geheugen = new Map();
function lees(raw) {
  const s = normaal(raw);
  if (geheugen.has(s)) return geheugen.get(s);
  let r = null;
  try {
    const ts = s && tekens(s);
    if (ts && ts.length) {
      const b = boom(ts);
      r = { boom: b, w: waarde(b) };
    }
  } catch (e) {
    if (e !== KAPOT) throw e;
  }
  if (geheugen.size > 500) geheugen.clear();
  geheugen.set(s, r);
  return r;
}

// ---------------------------------------------------------------------------------------------------
// Herleid. Een antwoord dat gelijk is aan het goede antwoord, is ook goed als het herleid is zoals in
// het boek. Elke reden waarom het nog niet herleid is, is de id van een valkuil, met een melding.
const NIET_HERLEID = {
  'nog-haakjes': 'Er staan nog haakjes. Werk ze weg.',
  'plus-en-min': 'Schrijf + − als −, en − − als +.',
  'min-niet-vooraan': 'Zet de min vooraan in de term.',
  'term-nul': 'Laat een term die 0 is weg.',
  'getallen-niet-samen': 'Neem in elke term de getallen samen tot één getal.',
  'getal-niet-vooraan': 'Zet in elke term het getal vooraan.',
  'letters-niet-samen': 'Neem in elke term dezelfde letters samen tot één macht.',
  'macht-niet-uitgerekend': 'Reken de macht nog uit.',
  'wortels-niet-samen': 'Neem de wortels samen tot één wortel.',
  'wortel-niet-uitgerekend': 'Reken de wortel nog uit.',
  'onder-wortel-niet-uitgerekend': 'Reken eerst uit wat onder het wortelteken staat.',
  'breuk-onder-wortel': 'Er mag geen breuk onder het wortelteken.',
  'wortel-factor-te-klein': 'Er kan nog een groter getal voor het wortelteken.',
  deelteken: 'Schrijf delen als een breuk, met /.',
  'breuk-in-breuk': 'Er staat nog een breuk in een breuk. Maak er één breuk van.',
  'breuk-en-termen': 'Maak er één breuk van, of schrijf de breuk als losse termen.',
  'min-in-noemer': 'Zet de min vóór de breuk, niet in de noemer.',
  'breuk-niet-vereenvoudigd': 'De breuk kan nog eenvoudiger.',
  'gelijksoortige-termen': 'Neem de gelijksoortige termen samen.',
  'niet-een-breuk': 'Schrijf je antwoord als één breuk.',
  'letter-in-breuk': 'Haal de letter uit de breuk, zoals x/8 = ⅛x.',
  'wortel-in-noemer': 'Werk de wortel uit de noemer weg.',
};

// De termen van een som, met het teken ervoor (null bij de eerste), en de factoren van een product.
const termen = (n) =>
  n.k === '+' || n.k === '-' ? [...termen(n.a), { n: n.b, op: n.k }] : [{ n }];
const factoren = (n) => (n.k === '*' ? [...factoren(n.a), ...factoren(n.b)] : [n]);
const breukGetal = (n) => n.k === 'getal' && (n.vorm === 'breuk' || n.vorm === 'gemengd');
const heeftBreuk = (n) =>
  n.k === '/' || breukGetal(n) || ['a', 'b'].some((d) => n[d] && heeftBreuk(n[d]));
// Wat om een teller of noemer mag staan: haakjes en een min.
function kaal(n) {
  let min = false;
  if (n.k === 'min') [min, n] = [true, n.a];
  if (n.k === 'haakjes') n = n.a;
  if (n.k === 'min') [min, n] = [!min, n.a];
  return { n, min };
}

// Of een getal in een term herleid is: een breuk vereenvoudigd en zonder helen erin, en een gemengd
// getal met helen en een echte breuk erachter. Een onechte breuk mag, zoals 7/3x.
function getalFout(g) {
  if (g.vorm === 'breuk') return g.a % g.b === 0 || gcd(g.a, g.b) > 1;
  if (g.vorm === 'gemengd') return !g.h || !g.a || g.a >= g.b || gcd(g.a, g.b) > 1;
  return false;
}
// Wat onder het wortelteken staat: een heel getal zonder kwadraat erin.
function wortelFout(a) {
  const x = a.k === 'haakjes' ? a.a : a,
    q = getalVan(waarde(x));
  if (!q.n || kwadraatEruit(q.n * q.d).r === 1) return 'wortel-niet-uitgerekend';
  if (x.k === 'getal')
    return x.vorm !== 'heel'
      ? 'breuk-onder-wortel'
      : kwadraatEruit(q.n).k > 1
        ? 'wortel-factor-te-klein'
        : null;
  return heeftBreuk(x) ? 'breuk-onder-wortel' : 'onder-wortel-niet-uitgerekend';
}
// Eén term zonder breukstreep, zoals -12a^3b^6 of 2 1/3√5: hoogstens één getal, vooraan, elke letter
// één keer, hoogstens één wortel, en geen haakjes. 1x mag, net als x^1.
function termFout(n, enige) {
  if (n.k === 'min') n = n.a;
  if (n.k === 'min') return 'plus-en-min';
  // De min van -2a · 3 hoort bij de hele term.
  const fs = factoren(n),
    letters = {};
  while (fs[0].k === 'min') fs.splice(0, 1, ...factoren(fs[0].a));
  let getallen = 0,
    wortels = 0;
  for (let j = 0; j < fs.length; j++) {
    const f = fs[j];
    if (f.k === 'haakjes' || (f.k === 'macht' && f.a.k === 'haakjes')) return 'nog-haakjes';
    if (f.k === 'min') return 'min-niet-vooraan';
    if (f.k === '/') return f.op === ':' ? 'deelteken' : 'breuk-in-breuk';
    if (f.k === 'macht' && (f.a.k !== 'letter' || !f.e)) return 'macht-niet-uitgerekend';
    const l = f.k === 'macht' ? f.a.w : f.k === 'letter' ? f.w : null;
    if (l) {
      if (letters[l]) return 'letters-niet-samen';
      letters[l] = true;
    } else if (f.k === 'getal') {
      if (getallen++) return 'getallen-niet-samen';
      if (j) return 'getal-niet-vooraan';
      if (!f.q.n && (fs.length > 1 || !enige)) return 'term-nul';
      if (getalFout(f)) return 'breuk-niet-vereenvoudigd';
    } else if (f.k === 'wortel') {
      if (wortels++) return 'wortels-niet-samen';
      const w = wortelFout(f.a);
      if (w) return w;
    }
  }
  return null;
}
// De ene term van een term zonder breukstreep (die is dan al goedgekeurd), als { c, m, r }.
const losseTerm = (n) => {
  const [t] = waarde(n).t.values();
  return t || { c: R(0), m: {}, r: 1 };
};
// De sleutel van een term, ook als het een breuk is zoals 2/x: de exponenten in de noemer tellen
// negatief, en een wortel in de noemer telt als wortel. Zo zijn 1/x en 3/x gelijksoortig.
function termSleutel(n) {
  const { n: k } = kaal(n);
  if (k.k !== '/') {
    const t = losseTerm(n);
    return sleutel(t.m, t.r);
  }
  const t = losseTerm(kaal(k.a).n),
    o = losseTerm(kaal(k.b).n),
    m = { ...t.m };
  for (const l in o.m) m[l] = (m[l] || 0) - o.m[l];
  for (const l in m) if (!m[l]) delete m[l];
  return sleutel(m, wortelKeer(t.r, o.r).r);
}
// Een som van termen, zoals in een teller: elke term goed, geen + − en geen gelijksoortige termen.
function somFout(lijst, opties, binnen) {
  const gezien = new Set();
  for (const { n, op } of lijst) {
    if (op && n.k === 'min') return 'plus-en-min';
    // Een breuk mag als term, ook met een min ervoor, maar niet tussen haakjes.
    const k = n.k === 'min' ? n.a : n;
    const f =
      k.k === '/' && !binnen
        ? breukFout(k, lijst.length === 1, opties)
        : termFout(n, lijst.length === 1);
    if (f) return f;
    const s = termSleutel(n);
    if (gezien.has(s)) return 'gelijksoortige-termen';
    gezien.add(s);
  }
  return null;
}
// Een breuk, zoals 2a/(3c) of (3y + 4x)/(xy). Haakjes en een min om de teller of noemer mogen. Teller en
// noemer zijn een som van termen zonder breuk. Ze hebben geen getal of letter die je uit allebei kunt
// halen. Staat de breuk naast andere termen, dan zijn teller en noemer elk één term.
function breukFout(b, heel, opties) {
  if (b.op === ':') return 'deelteken';
  const t = kaal(b.a),
    o = kaal(b.b);
  if (o.min) return 'min-in-noemer';
  if (heeftBreuk(t.n) || heeftBreuk(o.n)) return 'breuk-in-breuk';
  const tt = termen(t.n),
    ot = termen(o.n);
  if (!heel && (tt.length > 1 || ot.length > 1)) return 'breuk-en-termen';
  const f = somFout(tt, opties, true) || somFout(ot, opties, true);
  if (f) return f;
  const tl = tt.map((x) => losseTerm(x.n)),
    ol = ot.map((x) => losseTerm(x.n)),
    alle = [...tl, ...ol];
  // Een kommagetal in een breuk kan nog eenvoudiger, net als een getal of letter die overal in zit.
  if (alle.some((x) => x.c.d !== 1)) return 'breuk-niet-vereenvoudigd';
  if (alle.reduce((g, x) => gcd(g, x.c.n), 0) > 1) return 'breuk-niet-vereenvoudigd';
  if (Object.keys(tl[0].m).some((l) => alle.every((x) => x.m[l])))
    return 'breuk-niet-vereenvoudigd';
  const getalNoemer = ol.length === 1 && !Object.keys(ol[0].m).length && ol[0].r === 1;
  if (getalNoemer && ol[0].c.n === 1) return 'breuk-niet-vereenvoudigd';
  if (tl.length === 1 && ol.length === 1 && tl[0].r > 1 && ol[0].r > 1) return 'wortels-niet-samen';
  if (opties.wortelUitNoemer && ol.some((x) => x.r > 1)) return 'wortel-in-noemer';
  if (
    opties.breuk === 'ervoor' &&
    getalNoemer &&
    tl.some((x) => Object.keys(x.m).length || x.r > 1)
  )
    return 'letter-in-breuk';
  return null;
}
// Waarom een antwoord nog niet herleid is, of null als het herleid is. verwacht is het goede antwoord
// (gelezen). Is het antwoord één breuk met een noemer van een hogere graad dan die van het goede
// antwoord, dan kun je teller en noemer nog door iets met een letter delen, zoals bij (x² − 1)/(x − 1).
function herleidFout(r, opties = {}, verwacht = null) {
  const lijst = termen(r.boom);
  const f = somFout(lijst, opties, false);
  if (f) return f;
  if (opties.breuk === 'een' && lijst.length > 1 && lijst.some(({ n }) => heeftBreuk(n)))
    return 'niet-een-breuk';
  if (
    verwacht &&
    lijst.length === 1 &&
    kaal(lijst[0].n).n.k === '/' &&
    graad(r.w.n) > graad(verwacht.w.n)
  )
    return 'breuk-niet-vereenvoudigd';
  return null;
}

// ---------------------------------------------------------------------------------------------------
// Nakijken. Een veld met een uitdrukking heeft het goede antwoord als tekst in a, zoals '12a^3b^6', en
// de opties in uitdrukking (zie UF). Geeft { gelijk, fout, goed }: gelijk als de waarde klopt, fout met
// de reden als het niet herleid is, en goed als het allebei klopt.
function oordeel(f, raw) {
  const r = lees(raw),
    v = lees(f.a);
  if (!r || !v || !gelijk(r.w, v.w)) return { gelijk: false, fout: null, goed: false };
  let fout = null;
  try {
    fout = herleidFout(r, f.uitdrukking, v);
  } catch (e) {
    // Een getal dat te groot is om na te gaan: dan telt het als herleid.
    if (e !== KAPOT) throw e;
  }
  return { gelijk: true, fout, goed: !fout };
}
const uitdrukkingKlopt = (f, raw) => oordeel(f, raw).goed;

// De valkuilen voor een antwoord dat klopt maar niet herleid is, een per reden. Ze vallen alleen als elk
// veld goed is of gelijk maar niet herleid, net als bij de vorm van een breuk (vormTraps in answers.js).
function herleidValkuilen(fields) {
  if (!fields.some((f) => f.uitdrukking)) return [];
  const bepaal = (raw) => {
    let eerste = null;
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      if (!f.uitdrukking) {
        if (!checkField(f, raw[i] ?? '')) return null;
        continue;
      }
      const o = oordeel(f, raw[i] ?? '');
      if (!o.gelijk) return null;
      eerste = eerste || o.fout;
    }
    return eerste;
  };
  // Alle valkuilen kijken naar hetzelfde antwoord, dus de reden wordt één keer bepaald.
  let vorig = null,
    vorigeReden = null;
  const reden = (raw = []) => {
    const k = JSON.stringify(raw);
    if (k !== vorig) [vorig, vorigeReden] = [k, bepaal(raw)];
    return vorigeReden;
  };
  return Object.keys(NIET_HERLEID).map((id) => ({
    id,
    f: (v, raw) => reden(raw) === id,
    m: `Je antwoord klopt, maar het is nog niet helemaal herleid. ${NIET_HERLEID[id]}`,
  }));
}

// Een valkuil met een foute uitdrukking, zoals { id: 'exponenten-keer', als: '12a^2b^5', m: '…' }. Hij
// valt als het antwoord gelijk is aan als (in elke volgorde en schrijfwijze). als mag ook een lijst
// zijn. veld is het nummer van het veld, standaard het eerste veld met een uitdrukking.
function alsValkuil(fields, t) {
  const veld = t.veld ?? fields.findIndex((f) => f.uitdrukking),
    fout = [].concat(t.als).map((a) => {
      const r = lees(a);
      if (!r) throw new Error(`De valkuil ${t.id} is niet te lezen: ${a}`);
      return r;
    });
  return {
    id: t.id,
    m: t.m,
    f: (v, raw = []) => {
      const r = lees(raw[veld] ?? '');
      return !!r && fout.some((x) => gelijk(r.w, x.w));
    },
  };
}

// ---------------------------------------------------------------------------------------------------
// Laten zien. Een uitdrukking als HTML in dezelfde wiskundezetting als T in typeset.js: letters
// cursief, een macht hoog, een breuk met een streep, en een streep boven wat onder het wortelteken
// staat. De haakjes om een teller, een noemer of wat onder de wortel staat, vallen weg, want de streep
// laat al zien wat erbij hoort. Een min vóór de teller staat vóór de breuk, zoals in het boek.
const NMIN = '<span class="nmin">−</span>';
const breukHTML = (t, n) => `<span class="f"><span>${t}</span><span>${n}</span></span>`;
const zonderHaakjes = (n) => (n.k === 'haakjes' ? n.a : n);
function html(n) {
  switch (n.k) {
    case 'getal':
      if (n.vorm === 'breuk') return breukHTML(n.a, n.b);
      if (n.vorm === 'gemengd') return `${n.h}${breukHTML(n.a, n.b)}`;
      return n.tekst;
    case 'letter':
      return `<span class="v">${n.w}</span>`;
    case 'wortel':
      return `√<span class="wortel">${html(zonderHaakjes(n.a))}</span>`;
    case 'macht':
      return `${html(n.a)}<sup>${n.e}</sup>`;
    case 'haakjes':
      return `(${html(n.a)})`;
    case 'min':
      return `<span class="negatief">${NMIN}${html(n.a)}</span>`;
    case '*':
      return `${html(n.a)}${n.x ? ' · ' : ''}${html(n.b)}`;
    case '/': {
      if (n.op === ':') return `${html(n.a)} : ${html(n.b)}`;
      const t = kaal(n.a);
      const b = breukHTML(
        html(t.min ? zonderHaakjes(t.n) : zonderHaakjes(n.a)),
        html(zonderHaakjes(n.b)),
      );
      return t.min ? `<span class="negatief">${NMIN}${b}</span>` : b;
    }
    default:
      return `${html(n.a)} ${n.k === '-' ? '−' : '+'} ${html(n.b)}`;
  }
}
// Een uitdrukking als HTML, voor de uitwerking en het goede antwoord. Een rij met =, zoals
// '2a^4 · 6a^3 = 12a^7', zet elk deel apart. Een deel dat geen uitdrukking is, blijft gewone tekst.
const U = (s) =>
  String(s)
    .split('=')
    .map((d) => {
      const r = lees(d);
      return r ? html(r.boom) : esc(d.trim());
    })
    .join(' = ');

// Hoe een schermlezer de uitdrukking voorleest, in woorden, zodat je hoort hoe de site hem leest.
function zeg(n) {
  switch (n.k) {
    case 'getal':
      if (n.vorm === 'breuk') return `${n.a} gedeeld door ${n.b}`;
      if (n.vorm === 'gemengd') return `${n.h} en ${n.a} gedeeld door ${n.b}`;
      return n.tekst;
    case 'letter':
      return n.w;
    case 'wortel':
      return n.a.k === 'getal' ? `wortel ${zeg(n.a)}` : `wortel van ${zeg(zonderHaakjes(n.a))}`;
    case 'macht':
      return `${zeg(n.a)} ${n.e === 2 ? 'kwadraat' : `tot de macht ${n.e}`}`;
    case 'haakjes':
      return `haakje openen ${zeg(n.a)} haakje sluiten`;
    case 'min':
      return `min ${zeg(n.a)}`;
    case '*':
      return `${zeg(n.a)} ${n.x ? 'keer ' : ''}${zeg(n.b)}`;
    case '/':
      return n.op === ':'
        ? `${zeg(n.a)} gedeeld door ${zeg(n.b)}`
        : `breuk met teller ${zeg(zonderHaakjes(n.a))} en noemer ${zeg(zonderHaakjes(n.b))}`;
    default:
      return `${zeg(n.a)} ${n.k === '-' ? 'min' : 'plus'} ${zeg(n.b)}`;
  }
}

// ---------------------------------------------------------------------------------------------------
// Voor een generator.

// Een veld voor een uitdrukking: UF(tekst ervoor, goed antwoord, opties). Het antwoord schrijf je zoals
// een leerling het typt, herleid zoals in het boek: '12a^3b^6', '2a/(3c)', '3 1/3x', '-x^8', '6√3'.
// Opties:
// - letters: de letters voor de Rekenhulp, zoals 'ab'. Standaard de letters in het antwoord.
// - breuk: 'een' als het antwoord één breuk moet zijn, zoals (3x + 2)/6 en niet ½x + ⅓. 'ervoor' als
//   een breuk met een getal als noemer vóór de letter moet, zoals ⅛x en niet x/8.
// - wortelUitNoemer: true als er geen wortel in de noemer mag staan, zoals ⅚√2 en niet 5/(3√2).
// toon is het goede antwoord als HTML, voor de uitslag van de proeftoets.
function UF(pre, a, opties = {}) {
  const r = lees(a);
  if (!r) throw new Error(`Het antwoord is niet te lezen: ${a}`);
  const letters = opties.letters ?? [...new Set(normaal(a).match(/[a-z]/g) ?? [])].sort().join('');
  const f = { pre, a, uitdrukking: { ...opties, letters }, toon: html(r.boom) };
  const fout = herleidFout(r, f.uitdrukking, r);
  if (fout) throw new Error(`Het antwoord ${a} is niet herleid: ${fout}`);
  return f;
}
// Een vraag met een uitdrukking, met de valkuilen erbij: die met als, en die voor een antwoord dat
// niet herleid is.
const metUitdrukking = (q) => ({
  ...q,
  traps: [
    ...(q.traps ?? []).map((t) => (t.als == null ? t : alsValkuil(q.fields, t))),
    ...herleidValkuilen(q.fields),
  ],
});

UITDRUKKING.klopt = uitdrukkingKlopt;
UITDRUKKING.lees = (raw) => !!lees(raw);
UITDRUKKING.html = (raw) => (lees(raw) ? html(lees(raw).boom) : '');
UITDRUKKING.zeg = (raw) => (lees(raw) ? zeg(lees(raw).boom) : '');
UITDRUKKING.onleesbaar =
  'Deze uitdrukking kan ik niet lezen. Kijk of elk haakje dicht is. Een macht typ je als a^3, een wortel als √5 en een breuk als 2a/(3c).';

export {
  UF,
  U,
  metUitdrukking,
  lees as leesUitdrukking,
  gelijk as uitdrukkingGelijk,
  oordeel as uitdrukkingOordeel,
  NIET_HERLEID,
};
