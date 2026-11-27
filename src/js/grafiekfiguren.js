// Grafieken bij een verhaal (#286), zoals de afstand van een fietser tegen de tijd. Anders dan graph() in
// figures.js heeft elke as een naam met eenheid ("tijd in uren") in plaats van x en y, een eigen stap per
// hokje, en mag hij bij een ander getal dan 0 beginnen. Begint de verticale as niet bij 0, dan staat er een
// scheurlijn in. Een globale grafiek (schets) heeft geen getallen en geen rooster. Dit staat niet in
// figures.js, want dat laadt bij het eerste bezoek van elke pagina mee. Net als bij de andere figuren: geen
// DOM, en dezelfde invoer geeft steeds dezelfde SVG-tekst, zonder toeval en zonder id's.
//
// contextGraph({ titel, x, y, grafieken, schets, zeg, u, label }):
//  - x en y: een as, { naam: 'tijd in uren', van: 9, tot: 15, stap: 1 }. stap is wat één hokje is, zoals
//    2 uur of 5 km. Optioneel: eenheid (bij één hokje in de beschrijving, zoals 'uur'), getal (elke hoeveelste lijn een getal krijgt; vanzelf als de getallen anders
//    over elkaar vallen), scheur (een scheurlijn tussen 0 en van; voor y vanzelf als van groter is dan 0) en
//    fmt (hoe een getal bij de as staat: standaard met een komma; 'tijd' voor tijdstippen, zoals 9.30 bij de
//    as en "9.30 uur" in de beschrijving; of een eigen functie, maar die kan niet in een tekenvraag, want
//    die wordt als JSON bewaard).
//  - grafieken: één tot drie, elk { naam, punten: [[x, y], ...], vorm, stippen, c, stukken, naamBij }.
//    vorm is 'lijn' (rechte stukken van punt naar punt, een horizontaal stuk is een pauze), 'kromme' (een
//    vloeiende kromme door de punten, die tussen twee punten niet hoger of lager komt dan die punten) of
//    'los' (alleen de punten). stippen zet een stip op elk punt. c is de kleur, 1 tot en met 3. stukken
//    zijn letters bij de stukken tussen de punten, zoals ['a', 'b', 'c'], om naar een stuk te verwijzen.
//    naamBij is de plek van de naam als [x, y] in de getallen van de assen; standaard staat de naam
//    rechts van het laatste punt.
//  - schets: een globale grafiek, zonder getallen en zonder rooster. De punten geven dan alleen de vorm.
//  - zeg (standaard 'vorm', zodat een vergeten zeg het antwoord niet verklapt): wat de beschrijving voor een schermlezer over de grafieken zegt. 'punten' noemt de punten,
//    'vorm' alleen of elk stuk stijgt, daalt of horizontaal loopt (voor een vraag waarbij je een getal
//    afleest), en 'assen' alleen de assen en de namen (voor een vraag over de vorm zelf). Zie #168: de
//    beschrijving zegt nooit het antwoord voor.
//
// Voorbeeld: contextGraph({ titel: 'Fietstocht', x: { naam: 'tijd in uren', van: 9, tot: 14, stap: 1 },
//   y: { naam: 'afstand in km', van: 0, tot: 40, stap: 5 },
//   grafieken: [{ naam: 'Mila', punten: [[9, 0], [10, 15], [11, 15], [13, 40]] }], zeg: 'vorm' })
import { near } from './math.js';
import { esc } from './typeset.js';
import { num, and, cap, attr } from './figures.js';

const f1 = (x) => +x.toFixed(1);
// Breedte van tekst in de figuur, ruw geschat: ongeveer 7 pixels per letter.
const breed = (s) => 7 * String(s).length;
const txt = (x, y, s, cls = 'tc', anchor = 'middle') =>
  `<text class="${cls}" text-anchor="${anchor}" x="${f1(x)}" y="${f1(y)}">${esc(s)}</text>`;
// De ruimte die een scheurlijn op een as inneemt, in pixels, net als in chart() in figures.js.
const SCHEUR = 18;

// Een tijdstip in uren als tekst, zoals op een klok: 9 is '9 uur', 9,5 is '9.30 uur' en 14,25 is
// '14.15 uur'. Tussen de uren en de minuten staat een punt en geen komma, want 9,5 uur is een duur en
// 9.30 uur een tijdstip. Op hele minuten afgerond, en na 24 uur weer vanaf 0.
function tijd(h) {
  const m = Math.round(h * 60),
    uur = Math.floor(m / 60) % 24,
    min = m % 60;
  return min ? `${uur}.${String(min).padStart(2, '0')} uur` : `${uur} uur`;
}

// Een vloeiende kromme door punten P (in pixels, van links naar rechts), als pad van Bézier-krommen. De
// helling in elk punt is begrensd (de methode van Steffen, ook monotone kubische interpolatie genoemd):
// tussen twee punten stijgt of daalt de kromme alleen, dus komt hij nooit hoger of lager dan die twee
// punten. Is een stuk horizontaal, dan blijft de kromme daar horizontaal.
function hellingen(P) {
  const n = P.length,
    s = [],
    m = [];
  for (let k = 0; k + 1 < n; k++) s.push((P[k + 1][1] - P[k][1]) / (P[k + 1][0] - P[k][0]));
  for (let k = 1; k + 1 < n; k++) {
    const h0 = P[k][0] - P[k - 1][0],
      h1 = P[k + 1][0] - P[k][0],
      p = (s[k - 1] * h1 + s[k] * h0) / (h0 + h1);
    m[k] =
      s[k - 1] * s[k] <= 0
        ? 0
        : (Math.sign(s[k - 1]) + Math.sign(s[k])) *
          Math.min(Math.abs(s[k - 1]), Math.abs(s[k]), Math.abs(p) / 2);
  }
  // Aan de uiteinden: zo dat de kromme daar vloeiend begint, met dezelfde begrenzing.
  m[0] = n > 2 ? (3 * s[0] - m[1]) / 2 : s[0];
  m[n - 1] = n > 2 ? (3 * s[n - 2] - m[n - 2]) / 2 : s[0];
  return m;
}
// De Bézier-krommen van de kromme: per stuk het begin, twee controlepunten en het eind.
function bezier(P) {
  const m = hellingen(P),
    uit = [];
  for (let k = 0; k + 1 < P.length; k++) {
    const h = (P[k + 1][0] - P[k][0]) / 3;
    uit.push([
      P[k],
      [P[k][0] + h, P[k][1] + m[k] * h],
      [P[k + 1][0] - h, P[k + 1][1] - m[k + 1] * h],
      P[k + 1],
    ]);
  }
  return uit;
}
const pt = ([x, y]) => `${f1(x)} ${f1(y)}`;
// Het pad door punten P in pixels: rechte stukken, of een vloeiende kromme.
function pad(P, vorm) {
  if (P.length < 2) return '';
  if (vorm !== 'kromme' || P.length === 2) return `M${P.map(pt).join('L')}`;
  return `M${pt(P[0])}${bezier(P)
    .map((b) => `C${pt(b[1])} ${pt(b[2])} ${pt(b[3])}`)
    .join('')}`;
}
// Het midden van stuk k en de richting daar, in pixels: voor een letter bij dat stuk.
function midden(P, vorm, k) {
  if (vorm === 'kromme' && P.length > 2) {
    const [a, b, c, e] = bezier(P)[k];
    return {
      p: [0, 1].map((i) => (a[i] + 3 * b[i] + 3 * c[i] + e[i]) / 8),
      r: [0, 1].map((i) => e[i] + c[i] - b[i] - a[i]),
    };
  }
  return {
    p: [0, 1].map((i) => (P[k][i] + P[k + 1][i]) / 2),
    r: [0, 1].map((i) => P[k + 1][i] - P[k][i]),
  };
}

// Of een stuk stijgt, daalt of horizontaal loopt, in de getallen van de assen.
const richting = (a, b) => (near(a[1], b[1], 1e-9) ? 0 : b[1] > a[1] ? 1 : -1);
const WOORD = { 1: 'stijgt', '-1': 'daalt', 0: 'loopt horizontaal' };
// De vorm van een grafiek in woorden: 'stijgt eerst, loopt daarna horizontaal en daalt dan'. Stukken
// die op elkaar volgen en dezelfde kant op gaan, tellen samen.
function vormZin(punten) {
  const r = [];
  for (let k = 0; k + 1 < punten.length; k++) {
    const d = richting(punten[k], punten[k + 1]);
    if (r[r.length - 1] !== d) r.push(d);
  }
  // Het werkwoord met de tijd erbij: 'stijgt eerst', 'loopt daarna horizontaal'.
  const zin = (d, t) => (d ? `${WOORD[d]} ${t}` : `loopt ${t} horizontaal`);
  if (r.length === 1) return WOORD[r[0]];
  return and(r.map((d, i) => zin(d, i === 0 ? 'eerst' : i === r.length - 1 ? 'dan' : 'daarna')));
}

const VORM = {
  lijn: 'bestaat uit rechte stukken',
  kromme: 'is een vloeiende kromme',
  los: 'bestaat uit losse punten',
};

// De beschrijving voor een schermlezer, zie zeg hierboven.
// Hoe een getal van as a klinkt in de beschrijving en hoe het bij de as staat.
const zegGetal = (a) => (a.fmt === 'tijd' ? tijd : typeof a.fmt === 'function' ? a.fmt : num),
  asGetal = (a) => (a.fmt === 'tijd' ? (h) => tijd(h).replace(' uur', '') : zegGetal(a));
function beschrijf({ titel, x, y, G, schets, zeg, label }) {
  const fmt = zegGetal;
  const out = [`${label.replace(/\.$/, '')}${titel ? `: ${titel}` : ''}.`];
  if (schets) {
    out.push(`Langs de horizontale as: ${x.naam}. Langs de verticale as: ${y.naam}.`);
    out.push('Er staan geen getallen bij de assen en er is geen rooster.');
  } else {
    for (const [a, waar] of [
      [x, 'horizontale'],
      [y, 'verticale'],
    ])
      out.push(
        `Langs de ${waar} as: ${a.naam}, van ${fmt(a)(a.van)} tot ${fmt(a)(a.tot)}${a.scheur ? ', met een scheurlijn tussen 0 en het eerste getal' : ''}. Eén hokje is ${num(a.stap)}${a.eenheid ? ` ${a.eenheid}` : ''}.`,
      );
    out.push('Er is een rooster om af te lezen.');
  }
  const wie = (g, i) =>
    g.naam
      ? `de grafiek van ${g.naam}`
      : G.length > 1
        ? `grafiek ${i + 1}`
        : g.vorm === 'los'
          ? 'de punten'
          : 'de grafiek';
  if (G.length > 1) out.push(`Er staan ${G.length} grafieken in de figuur.`);
  // Bij een schets zijn er geen getallen, dus dan kan hij hoogstens de vorm zeggen.
  const wat = schets && zeg === 'punten' ? 'vorm' : zeg;
  G.forEach((g, i) => {
    const w = wie(g, i),
      ps = g.punten;
    if (g.vorm === 'los' && !g.naam) {
      if (wat === 'punten')
        out.push(
          `Er staan ${ps.length} punten, steeds ${x.naam} en ${y.naam}: ${ps.map(([a, b]) => `${fmt(x)(a)} en ${fmt(y)(b)}`).join('; ')}.`,
        );
      else out.push(`Er staan ${ps.length} punten.`);
      return;
    }
    out.push(cap(`${w} ${VORM[g.vorm]}.`));
    if (g.stukken) {
      const L = g.stukken.slice(0, ps.length - 1).filter(Boolean);
      if (wat === 'vorm')
        out.push(
          cap(
            and(
              g.stukken
                .map(
                  (s, k) =>
                    s && k < ps.length - 1 && `stuk ${s} ${WOORD[richting(ps[k], ps[k + 1])]}`,
                )
                .filter(Boolean),
            ) + '.',
          ),
        );
      else out.push(`Van links naar rechts heeft hij de stukken ${and(L)}.`);
    } else if (wat === 'vorm' && ps.length > 1) out.push(cap(`hij ${vormZin(ps)}.`));
    if (wat === 'punten')
      out.push(
        `Punten op ${w}, steeds ${x.naam} en ${y.naam}: ${ps.map(([a, b]) => `${fmt(x)(a)} en ${fmt(y)(b)}`).join('; ')}.`,
      );
  });
  return out.join(' ');
}

// De delen van de figuur: de maten, de plek van een getal op de assen (X en Y, in pixels) en de inhoud.
// Een tekenvraag (zie grafiekpunten in tekenvragen.js) bouwt hiermee op dezelfde figuur verder.
function grafiekDelen({
  titel = '',
  x: x0,
  y: y0,
  grafieken = [],
  schets = false,
  zeg = 'vorm',
  u = 26,
  label = schets ? 'Globale grafiek' : 'Grafiek',
}) {
  const x = { scheur: false, ...x0 },
    y = { scheur: !schets && y0.van > 0, ...y0 },
    nx = Math.round((x.tot - x.van) / x.stap),
    ny = Math.round((y.tot - y.van) / y.stap),
    fmt = asGetal,
    G = grafieken.map((g, i) => ({ vorm: 'lijn', c: i + 1, ...g }));
  // Elke hoeveelste lijn een getal krijgt: zo vaak als past zonder dat de getallen over elkaar vallen.
  const xs = [],
    ysn = [];
  for (let i = 0; i <= nx; i++) xs.push(x.van + i * x.stap);
  for (let j = 0; j <= ny; j++) ysn.push(y.van + j * y.stap);
  const lx =
      x.getal || Math.max(1, Math.ceil((Math.max(...xs.map((v) => breed(fmt(x)(v)))) + 6) / u)),
    ly = y.getal || Math.max(1, Math.ceil(15 / u)),
    lw = schets ? 0 : Math.max(...ysn.filter((v, j) => j % ly === 0).map((v) => breed(fmt(y)(v)))),
    top = titel ? 30 : 4,
    mt = top + (y.naam ? 24 : 0) + 12,
    ax = schets ? 12 : Math.max(12, lw + 12),
    px0 = ax + (x.scheur ? SCHEUR : 0),
    px1 = px0 + nx * u,
    py1 = mt + ny * u,
    ay = py1 + (y.scheur ? SCHEUR : 0),
    X = (v) => px0 + ((v - x.van) / x.stap) * u,
    Y = (v) => py1 - ((v - y.van) / y.stap) * u;
  let o = '';
  if (!schets) {
    let g = '';
    for (let i = 0; i <= nx; i++) g += `M${px0 + i * u} ${mt}V${py1}`;
    for (let j = 0; j <= ny; j++) g += `M${px0} ${py1 - j * u}H${px1}`;
    o += `<path class="gl" d="${g}"/>`;
  }
  // De assen, met een pijlpunt aan het eind en een scheurlijn als die er is.
  const zigY = y.scheur ? `V${py1 + 1}l5 3l-10 6l10 6l-5 2` : '',
    zigX = x.scheur ? `H${ax + 1}l3 -5l6 10l6 -10l2 5` : '';
  o += `<path class="ax" d="M${ax} ${mt - 12}${zigY}V${ay}${zigX}H${px1 + 12}m-6 -4l6 4l-6 4M${ax - 4} ${mt - 6}l4 -6l4 6"/>`;
  if (!schets) {
    xs.forEach((v, i) => {
      if (i % lx === 0) o += txt(X(v), ay + 16, fmt(x)(v), 'tk');
    });
    ysn.forEach((v, j) => {
      if (j % ly === 0) o += txt(ax - 5, Y(v) + 4, fmt(y)(v), 'tk', 'end');
    });
    // Bij een scheurlijn staat 0 bij het begin van de as.
    if (x.scheur && y.scheur) o += txt(ax - 4, ay + 14, '0', 'tk', 'end');
    else if (y.scheur) o += txt(ax - 5, ay + 4, '0', 'tk', 'end');
    else if (x.scheur) o += txt(ax, ay + 16, '0', 'tk');
  }
  let W = px1 + 16;
  const xn = ay + (schets ? 18 : 34);
  if (x.naam) {
    const r = Math.max(px1 + 12, 4 + breed(x.naam));
    o += txt(r, xn, x.naam, 'tc', 'end');
    W = Math.max(W, r + 4);
  }
  if (y.naam) {
    o += txt(4, top + 16, y.naam, 'tc', 'start');
    W = Math.max(W, 8 + breed(y.naam));
  }
  // De grafieken, met de stippen en de letters bij de stukken erop.
  G.forEach((g) => {
    const P = g.punten.map(([a, b]) => [X(a), Y(b)]);
    if (g.vorm !== 'los') o += `<path class="l${g.c}" d="${pad(P, g.vorm)}"/>`;
    if (g.stippen || g.vorm === 'los')
      P.forEach(
        (p) => (o += `<circle class="mk c${g.c}" cx="${f1(p[0])}" cy="${f1(p[1])}" r="3.5"/>`),
      );
    (g.stukken || []).forEach((s, k) => {
      if (!s || k + 1 >= P.length) return;
      const { p, r } = midden(P, g.vorm, k),
        l = Math.hypot(r[0], r[1]) || 1;
      // Loodrecht op het stuk, aan de bovenkant.
      let n = [r[1] / l, -r[0] / l];
      if (n[1] > 0) n = [-n[0], -n[1]];
      o += txt(p[0] + 13 * n[0], p[1] + 13 * n[1] + 5, s, 'ti');
    });
    // In een schets zie je met een stip waar het ene stuk ophoudt en het volgende begint.
    if (g.stukken && !g.stippen)
      P.slice(1, -1).forEach(
        (p) => (o += `<circle class="dot" cx="${f1(p[0])}" cy="${f1(p[1])}" r="2.5"/>`),
      );
    if (g.naam && g.vorm !== 'los') {
      const at = g.naamBij ? [X(g.naamBij[0]), Y(g.naamBij[1])] : P[P.length - 1],
        bij = !g.naamBij;
      o += txt(
        at[0] + (bij ? 7 : 0),
        at[1] + (bij ? 4 : 0),
        g.naam,
        `tc t${g.c}`,
        bij ? 'start' : 'middle',
      );
      W = Math.max(W, at[0] + (bij ? 11 : breed(g.naam) / 2 + 4) + breed(g.naam));
    }
  });
  if (titel) W = Math.max(W, breed(titel) * 1.3 + 16);
  W = Math.ceil(W);
  const H = Math.ceil(xn + 8);
  if (titel) o = txt(W / 2, 20, titel, 'tt') + o;
  const desc = beschrijf({ titel, x, y, G, schets, zeg, label });
  return { W, H, X, Y, x, y, u, px0, px1, mt, py1, inner: o, desc };
}

const contextGraph = (opts) => {
  const { W, H, inner, desc } = grafiekDelen(opts);
  return `<svg class="fig" role="img" aria-label="${attr(desc)}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}</svg>`;
};

export { contextGraph, grafiekDelen, tijd, zegGetal, bezier, pad };
