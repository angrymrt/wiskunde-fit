// Tekenvragen (#232): de leerling tekent zelf, in een rooster of op een getallenlijn. Er zijn zes soorten:
//  - kubus: een kubus afmaken op roosterpapier, door hoekpunten aan te tikken;
//  - passer: een driehoek tekenen uit drie zijden, met boogjes van een passer;
//  - uitslag: een uitslag van een kubus tekenen, door hokjes aan te tikken;
//  - pijl: een som als pijl op de getallenlijn, door het begin en het eind aan te tikken (#263);
//  - roosterpunten: roosterpunten in een assenstelsel aan- en weer uittikken, zoals alle punten die aan een
//    voorwaarde voldoen (#286);
//  - grafiekpunten: de punten uit een tabel zetten in het rooster van een grafiek bij een verhaal (#286).
// Alleen gegevens, rekenwerk en SVG als tekst, geen DOM, zodat de tests het in Node draaien. Het tikken,
// het toetsenbord en de knoppen staan in ui/tekenen.js, dat pas laadt als er een tekenvraag op het scherm staat.
//
// Een tekenvraag heeft q.teken met de gegevens, zoals { soort: 'kubus', ... }, en één veld met teken: true.
// Wat de leerling tekent, staat in dat veld als tekst (lees en schrijf per soort), zodat de site het net als een
// getypt antwoord bewaart, ook in een proeftoets. Een ? in die tekst is iets wat nog niet is getekend: dan is de
// vraag nog niet af (zie empty in ui/question-form.js). answers.js kijkt de tekst na met TEKEN.nakijken uit math.js,
// dat dit bestand hieronder invult.
import { and, attr, graph } from './figures.js';
import { grafiekDelen, pad } from './grafiekfiguren.js';
import { TEKEN, d, near } from './math.js';
import { CUBE_NETS, canonicalNet, isCubeNet, sameFace } from './ruimte.js';
import { T } from './typeset.js';

const PAD = 16;
const same = (p, q) => !!p && !!q && p[0] === q[0] && p[1] === q[1];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const r2 = (x) => Math.round(x * 100) / 100;
const num = (x) => d(r2(x)).replace('-', '−');
// Lijnen van een rooster, als één pad: kolommen 0 tot en met w, rijen 0 tot en met h.
function rooster(w, h, X, Y) {
  let g = '';
  for (let i = 0; i <= w; i++) g += `M${X(i)} ${Y(0)}V${Y(h)}`;
  for (let j = 0; j <= h; j++) g += `M${X(0)} ${Y(j)}H${X(w)}`;
  // Iets donkerder dan een gewoon rooster (gr), want hier tik je op.
  return `<path class="gl gr" d="${g}"/>`;
}
const lijn = (m, p, q, cls) =>
  `<line class="${cls}" x1="${r2(m.X(p[0]))}" y1="${r2(m.Y(p[1]))}" x2="${r2(m.X(q[0]))}" y2="${r2(m.Y(q[1]))}"/>`;
const stip = (m, p, r = 4) =>
  `<circle class="dot" cx="${r2(m.X(p[0]))}" cy="${r2(m.Y(p[1]))}" r="${r}"/>`;
const tekst = (x, y, t) =>
  `<text class="ti" text-anchor="middle" x="${r2(x)}" y="${r2(y)}">${t}</text>`;
// Een kruisje bij iets wat fout is. Zo zie je het ook zonder de kleur.
const kruis = (x, y, k = 6) =>
  `<path class="fout" d="M${r2(x - k)} ${r2(y - k)}l${2 * k} ${2 * k}m0 ${-2 * k}l${-2 * k} ${2 * k}"/>`;
// Hoeveel hokjes, en welke kant op: '2 hokjes naar rechts en 1 omhoog'.
function rel([dx, dy]) {
  const delen = [];
  if (dx) delen.push(`${Math.abs(dx)} naar ${dx > 0 ? 'rechts' : 'links'}`);
  if (dy) delen.push(`${Math.abs(dy)} ${dy > 0 ? 'omhoog' : 'omlaag'}`);
  if (!delen.length) return '';
  const n = Math.abs(dx || dy);
  return delen.join(' en ').replace(/^(\d+)/, `$1 ${n === 1 ? 'hokje' : 'hokjes'}`);
}
const waar = (p, q, naam) =>
  same(p, q) ? `op ${naam}` : `${rel([p[0] - q[0], p[1] - q[1]])} van ${naam}`;

// ---------------------------------------------------------------------------------------------
// Kubus afmaken. t = { soort: 'kubus', n, s, o, W, H, L, geg, zet }: ribbe n hokjes, de schuine ribben
// s = [dx, dy] hokjes, hoekpunt 0 op o, een rooster van W bij H hokjes en de acht letters L. geg zijn de
// hoekpunten die al getekend zijn, zet de hoekpunten die de leerling in die volgorde aantikt.
// De hoekpunten 0 tot en met 3 zijn het grondvlak, tegen de klok in vanaf linksvoor, en 4 tot en met 7 liggen
// erboven, zoals in kubus ABCD EFGH. De ribben bij hoekpunt 3 zie je niet: die zijn gestippeld.
// In het veld staat per hoekpunt van zet 'x,y', met ? als het nog niet is gezet.

const RIBBEN = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];
const verborgen = ([a, b]) => a === 3 || b === 3;
// Hoekpunt i in het rooster, met y omhoog.
function hoek({ o, n, s }, i) {
  const k = i % 4;
  return [
    o[0] + (k === 1 || k === 2 ? n : 0) + (k >= 2 ? s[0] : 0),
    o[1] + (i >= 4 ? n : 0) + (k >= 2 ? s[1] : 0),
  ];
}
// De naam van een ribbe, zoals BC.
const ribNaam = (t, [a, b]) => [t.L[a], t.L[b]].sort().join('');
// Het hoekpunt aan de voorkant bij een hoekpunt aan de achterkant: 2 bij 1, 3 bij 0, 6 bij 5 en 7 bij 4.
const voorkant = (i) => (i % 4 === 2 ? i - 1 : i - 3);
// Een schuine ribbe die al getekend is: van een hoekpunt achter naar het hoekpunt ervoor.
const schuineRibbe = (t) => {
  const i = t.geg.find((k) => k % 4 >= 2 && t.geg.includes(voorkant(k)));
  return [voorkant(i), i];
};
const kubusMaat = (t) => {
  const u = 34;
  return {
    u,
    w: t.W * u + 2 * PAD,
    h: t.H * u + 2 * PAD,
    X: (x) => PAD + x * u,
    Y: (y) => PAD + (t.H - y) * u,
  };
};
// De letter staat van het midden van de kubus af, zodat hij niet op een ribbe valt.
function kubusLetter(t, m, i, p) {
  const cx = t.o[0] + (t.n + t.s[0]) / 2,
    cy = t.o[1] + (t.n + t.s[1]) / 2,
    vx = p[0] - cx,
    vy = cy - p[1],
    l = Math.hypot(vx, vy) || 1;
  return tekst(m.X(p[0]) + (14 * vx) / l, m.Y(p[1]) + (14 * vy) / l + 5, t.L[i]);
}
// Welk hoekpunt waar ligt: wat al getekend is, en wat de leerling zette.
const kubusBekend = (t, pts, i) => (t.geg.includes(i) ? hoek(t, i) : pts[t.zet.indexOf(i)] || null);
const kubus = {
  maat: kubusMaat,
  lees(t, val) {
    const w = String(val).split(' ');
    return t.zet.map((_, k) => {
      const m = /^(\d+),(\d+)$/.exec(w[k] ?? '');
      return m && +m[1] <= t.W && +m[2] <= t.H ? [+m[1], +m[2]] : null;
    });
  },
  schrijf: (t, pts) => (pts.some(Boolean) ? pts.map((p) => (p ? p.join(',') : '?')).join(' ') : ''),
  nakijken: (t, pts) => t.zet.map((i, k) => same(pts[k], hoek(t, i))),
  // Het punt van het rooster dat het dichtst bij een tik ligt.
  terug(t, sx, sy) {
    const m = kubusMaat(t);
    return [
      clamp(Math.round((sx - PAD) / m.u), 0, t.W),
      clamp(Math.round(t.H - (sy - PAD) / m.u), 0, t.H),
    ];
  },
  fig(t) {
    const m = kubusMaat(t);
    let o = rooster(t.W, t.H, m.X, m.Y);
    for (const r of RIBBEN)
      if (t.geg.includes(r[0]) && t.geg.includes(r[1]))
        o += lijn(m, hoek(t, r[0]), hoek(t, r[1]), verborgen(r) ? 's d' : 's');
    for (const i of t.geg) o += stip(m, hoek(t, i), 3.5) + kubusLetter(t, m, i, hoek(t, i));
    return o;
  },
  // Wat de leerling tekende: de punten met hun letter, en de ribben die daarmee bekend zijn. Met fout een
  // kruisje bij een punt dat niet goed ligt, met goed ook de goede kubus gestippeld, en met cursor de plek
  // waar het toetsenbord staat.
  laag(t, pts, { fout, goed, cursor } = {}) {
    const m = kubusMaat(t),
      ok = kubus.nakijken(t, pts);
    let o = '';
    for (const r of RIBBEN) {
      if (t.geg.includes(r[0]) && t.geg.includes(r[1])) continue;
      if (goed) o += lijn(m, hoek(t, r[0]), hoek(t, r[1]), 'l2 d');
      const p = kubusBekend(t, pts, r[0]),
        q = kubusBekend(t, pts, r[1]);
      if (p && q) o += lijn(m, p, q, verborgen(r) ? 'l1 d' : 'l1');
    }
    pts.forEach((p, k) => {
      if (!p) return;
      o += stip(m, p, 4.5) + kubusLetter(t, m, t.zet[k], p);
      if (fout && !ok[k]) o += kruis(m.X(p[0]), m.Y(p[1]) - 13, 5);
    });
    if (cursor)
      o += `<circle class="cursor" cx="${m.X(cursor[0])}" cy="${m.Y(cursor[1])}" r="11"/>`;
    return o;
  },
  desc(t) {
    const L = t.L,
      naam = `kubus ${L.slice(0, 4)} ${L.slice(4)}`;
    return [
      'Rooster met hokjes.',
      t.geg.includes(5)
        ? `Zijvlak ${L[0]}${L[1]}${L[5]}${L[4]} aan de voorkant van ${naam} is getekend: een vierkant van ${t.n} bij ${t.n} hokjes.`
        : `Grondvlak ${L.slice(0, 4)} van ${naam} is getekend. Ribbe ${L[0]}${L[1]} is ${t.n} hokjes.`,
      `Ribbe ${ribNaam(t, schuineRibbe(t))} gaat ${rel(t.s)}.`,
      `${L[0]} ligt linksonder.`,
    ].join(' ');
  },
  staat(t, pts) {
    return `${t.zet.map((i, k) => `${t.L[i]} ${pts[k] ? waar(pts[k], hoek(t, 0), t.L[0]) : 'nog niet gezet'}`).join(', ')}.`;
  },
  rijen: (t, pts, each) =>
    t.zet.map((i, k) => [
      T(t.L[i]),
      pts[k] ? T(waar(pts[k], hoek(t, 0), t.L[0])) : '<span class="muted">niet gezet</span>',
      each[k],
      T(waar(hoek(t, i), hoek(t, 0), t.L[0])),
    ]),
  // Een tik op punt p: een gezet punt haal je weg, en anders komt het volgende hoekpunt daar. Geeft de nieuwe
  // punten en een zin voor een schermlezer.
  tik(t, pts, p) {
    const uit = [...pts],
      k = pts.findIndex((q) => same(q, p)),
      vast = t.geg.find((i) => same(hoek(t, i), p)),
      vrij = pts.findIndex((q) => !q);
    if (k >= 0) {
      uit[k] = null;
      return { st: uit, zin: `Punt ${t.L[t.zet[k]]} weggehaald. ${kubus.stap(t, uit)}` };
    }
    if (vast !== undefined) return { st: pts, zin: `Daar ligt ${t.L[vast]} al.` };
    if (vrij < 0)
      return { st: pts, zin: 'Alle punten staan er al. Tik op een punt om het weg te halen.' };
    uit[vrij] = p;
    return {
      st: uit,
      zin: `Punt ${t.L[t.zet[vrij]]} gezet, ${waar(p, hoek(t, 0), t.L[0])}. ${kubus.stap(t, uit)}`,
    };
  },
  stap(t, pts) {
    const k = pts.findIndex((q) => !q);
    return k < 0 ? 'Alle punten staan er.' : `Zet nu punt ${t.L[t.zet[k]]}.`;
  },
  // Wat er op een punt van het rooster ligt, voor de cursor van het toetsenbord.
  plek(t, pts, p) {
    const k = pts.findIndex((q) => same(q, p)),
      i = k >= 0 ? t.zet[k] : t.geg.find((j) => same(hoek(t, j), p));
    return `${waar(p, hoek(t, 0), t.L[0])}${i === undefined ? '' : `, punt ${t.L[i]}`}`;
  },
  bezet: (t, pts, p) => pts.some((q) => same(q, p)),
  start: (t) => hoek(t, 0),
  // De cursor een stap verder, met y omhoog, binnen het rooster.
  verder: (t, p, [dx, dy]) => [clamp(p[0] + dx, 0, t.W), clamp(p[1] + dy, 0, t.H)],
};

// ---------------------------------------------------------------------------------------------
// Een driehoek met de passer. t = { soort: 'passer', ab, ac, bc, L, x1, y1 }: zijde AB ligt met A in (0, 0)
// en B in (ab, 0), in cm. Het rooster loopt van x = −1 tot x1 en van y = −1 tot y1. L zijn de drie letters.
// In het veld staan de straal van het boogje vanuit A en vanuit B (0 als er geen is) en het derde hoekpunt
// als 'x,y', met ? als dat er nog niet is.

// Zo ver mag het derde hoekpunt van de goede plek liggen: 1,5 mm, net als bij tekenen op papier.
const MARGE = 0.15;
// Een tik zo dicht bij het snijpunt van de boogjes komt precies op het snijpunt, en een tik zo dicht bij A of B
// zet de passer daar neer. In cm.
const VANG = 0.5,
  PUNT = 0.6;
// Het snijpunt boven AB van de cirkels om A met straal ra en om B met straal rb, of null.
function snijpunt(ab, ra, rb) {
  if (!ra || !rb) return null;
  const x = (ra * ra - rb * rb + ab * ab) / (2 * ab),
    h2 = ra * ra - x * x;
  return h2 < 0 ? null : [x, Math.sqrt(h2)];
}
// Of het derde hoekpunt c de goede afstanden tot A en B heeft, gemeten met een marge.
const cGoed = (t, c) =>
  !!c &&
  Math.abs(Math.hypot(c[0], c[1]) - t.ac) <= MARGE &&
  Math.abs(Math.hypot(c[0] - t.ab, c[1]) - t.bc) <= MARGE;
const passerMaat = (t) => {
  const u = 36;
  return {
    u,
    w: (t.x1 + 1) * u + 2 * PAD,
    h: (t.y1 + 1) * u + 2 * PAD,
    X: (x) => PAD + (x + 1) * u,
    Y: (y) => PAD + (t.y1 - y) * u,
  };
};
// Een boogje: een stuk van de cirkel om o met straal r, van hoek a0 tot a1 (tegen de klok in).
function boog(m, o, r, a0, a1) {
  const p = (a) => `${r2(m.X(o[0] + r * Math.cos(a)))} ${r2(m.Y(o[1] + r * Math.sin(a)))}`;
  return `M${p(a0)}A${r2(r * m.u)} ${r2(r * m.u)} 0 ${a1 - a0 > Math.PI ? 1 : 0} 0 ${p(a1)}`;
}
const passer = {
  maat: passerMaat,
  lees(t, val) {
    const w = String(val).split(' '),
      r = (s) => (/^\d+(\.\d+)?$/.test(s ?? '') && +s <= 20 ? +s : 0),
      m = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(w[2] ?? '');
    return { ra: r(w[0]), rb: r(w[1]), c: m ? [+m[1], +m[2]] : null };
  },
  schrijf: (t, { ra, rb, c }) =>
    ra || rb || c ? `${r2(ra)} ${r2(rb)} ${c ? c.map(r2).join(',') : '?'}` : '',
  nakijken: (t, { ra, rb, c }) => [near(ra, t.ac, 1e-9), near(rb, t.bc, 1e-9), cGoed(t, c)],
  // Waar een tik ligt, in cm.
  terug(t, sx, sy) {
    const m = passerMaat(t);
    return [(sx - PAD) / m.u - 1, t.y1 - (sy - PAD) / m.u];
  },
  snijpunt: (t, { ra, rb }) => snijpunt(t.ab, ra, rb),
  fig(t) {
    const m = passerMaat(t),
      A = [0, 0],
      B = [t.ab, 0];
    return (
      rooster(
        t.x1 + 1,
        t.y1 + 1,
        (i) => m.X(i - 1),
        (j) => m.Y(j - 1),
      ) +
      lijn(m, A, B, 's') +
      stip(m, A) +
      stip(m, B) +
      tekst(m.X(0) - 6, m.Y(0) + 20, t.L[0]) +
      tekst(m.X(t.ab) + 6, m.Y(0) + 20, t.L[1])
    );
  },
  // Wat de leerling tekende: de boogjes, het derde hoekpunt en de zijden ernaartoe. Snijden de boogjes elkaar,
  // dan zijn het korte boogjes rond het snijpunt, zoals op papier, met een rondje op het snijpunt zolang er nog
  // geen hoekpunt staat. Met fout is een verkeerd boogje rood en staat er een kruisje bij een verkeerd hoekpunt,
  // en met goed staat de goede driehoek er gestippeld bij.
  laag(t, st, { fout, goed } = {}) {
    const m = passerMaat(t),
      ok = passer.nakijken(t, st),
      S = snijpunt(t.ab, st.ra, st.rb),
      A = [0, 0],
      B = [t.ab, 0];
    let o = '';
    if (goed) {
      const C = snijpunt(t.ab, t.ac, t.bc);
      o += lijn(m, A, C, 'l2 d') + lijn(m, B, C, 'l2 d');
    }
    const bogen = [
      [st.ra, A, 0.17, 2.1, ok[0]],
      [st.rb, B, 1.05, 2.97, ok[1]],
    ];
    let paden = '',
      kruisjes = '';
    for (const [r, O, a0, a1, goedBoog] of bogen) {
      if (!r) continue;
      const mid = S && Math.atan2(S[1] - O[1], S[0] - O[0]);
      if (fout && !goedBoog) {
        // Een kruisje bij het midden van het foute boogje, binnen het rooster.
        const h = S ? mid : (a0 + a1) / 2,
          x = Math.min(Math.max(m.X(O[0] + r * Math.cos(h)), PAD + 8), m.w - PAD - 8),
          y = Math.min(Math.max(m.Y(O[1] + r * Math.sin(h)), PAD + 8), m.h - PAD - 8);
        kruisjes += kruis(x, y - 14, 5);
      }
      paden += `<path class="a1${fout && !goedBoog ? ' fout' : ''}" d="${S ? boog(m, O, r, mid - 0.4, mid + 0.4) : boog(m, O, r, a0, a1)}"/>`;
    }
    // Een boogje dat buiten het rooster komt, valt weg aan de rand, net als in graph() in figures.js.
    o += `<svg x="${PAD}" y="${PAD}" width="${m.w - 2 * PAD}" height="${m.h - 2 * PAD}" viewBox="${PAD} ${PAD} ${m.w - 2 * PAD} ${m.h - 2 * PAD}">${paden}</svg>${kruisjes}`;
    if (S && !st.c) o += `<circle class="a2" cx="${r2(m.X(S[0]))}" cy="${r2(m.Y(S[1]))}" r="7"/>`;
    if (st.c) {
      const c = st.c;
      o +=
        lijn(m, A, c, 'l1') +
        lijn(m, B, c, 'l1') +
        stip(m, c) +
        tekst(m.X(c[0]), m.Y(c[1]) + (c[1] < 0 ? 22 : -10), t.L[2]);
      if (fout && !ok[2]) o += kruis(m.X(c[0]) + 14, m.Y(c[1]) - 14, 5);
    }
    return o;
  },
  desc: (t) =>
    `Rooster met hokjes van 1 cm. Lijnstuk ${t.L[0]}${t.L[1]} van ${d(t.ab)} cm ligt horizontaal, met ${t.L[0]} links en ${t.L[1]} rechts.`,
  staat(t, { ra, rb, c }) {
    const [A, B, C] = t.L;
    const boogje = (P, r) =>
      `Boogje vanuit ${P}: ${r ? `straal ${d(r)} cm` : 'nog niet getekend'}.`;
    return [
      boogje(A, ra),
      boogje(B, rb),
      c
        ? `${C} ligt ${num(Math.hypot(c[0], c[1]))} cm van ${A} en ${num(Math.hypot(c[0] - t.ab, c[1]))} cm van ${B}.`
        : `${C} is nog niet gezet.`,
    ].join(' ');
  },
  rijen(t, { ra, rb, c }, each) {
    const [A, B, C] = t.L;
    const niet = (w) => `<span class="muted">${w}</span>`;
    return [
      [
        `Boogje vanuit ${T(A)}`,
        ra ? `straal ${d(ra)} cm` : niet('niet getekend'),
        each[0],
        T(`straal ${A}${C} = ${d(t.ac)} cm`),
      ],
      [
        `Boogje vanuit ${T(B)}`,
        rb ? `straal ${d(rb)} cm` : niet('niet getekend'),
        each[1],
        T(`straal ${B}${C} = ${d(t.bc)} cm`),
      ],
      [
        T(C),
        c
          ? T(
              `${num(Math.hypot(c[0], c[1]))} cm van ${A} en ${num(Math.hypot(c[0] - t.ab, c[1]))} cm van ${B}`,
            )
          : niet('niet gezet'),
        each[2],
        'op het snijpunt van de boogjes',
      ],
    ];
  },
  // Zet de passer met straal r in A of in B (welk is 0 of 1) en teken een boogje. Een ander boogje dan eerst
  // haalt het derde hoekpunt weg, want dat hoorde bij het oude snijpunt.
  boog(t, st, welk, r) {
    const naam = welk ? 'rb' : 'ra',
      weg = !!st.c && !near(st[naam], r),
      uit = { ...st, [naam]: r, c: weg ? null : st.c },
      S = snijpunt(t.ab, uit.ra, uit.rb);
    const zin = [
      `Boogje vanuit ${t.L[welk]} getekend, met straal ${d(r)} cm.`,
      weg ? `${t.L[2]} is weggehaald, want het boogje is veranderd.` : '',
      uit.ra && uit.rb
        ? S
          ? 'De boogjes snijden elkaar.'
          : 'De boogjes snijden elkaar niet.'
        : '',
    ];
    return { st: uit, zin: zin.filter(Boolean).join(' ') };
  },
  // Zet het derde hoekpunt op c.
  zetC(t, st, c) {
    const p = c.map(r2);
    return {
      st: { ...st, c: p },
      zin: `${t.L[2]} gezet, ${num(Math.hypot(p[0], p[1]))} cm van ${t.L[0]} en ${num(Math.hypot(p[0] - t.ab, p[1]))} cm van ${t.L[1]}.`,
    };
  },
  // Een tik op p, in cm. Vlak bij A of B zet je daar de passer neer, met straal r. Vlak bij het derde hoekpunt
  // haal je dat weg. Anders komt het derde hoekpunt op p, of op het snijpunt van de boogjes als p daar vlakbij ligt.
  tik(t, st, p, r) {
    const bij = (q, afstand) => Math.hypot(p[0] - q[0], p[1] - q[1]) <= afstand,
      S = snijpunt(t.ab, st.ra, st.rb);
    if (bij([0, 0], PUNT)) return passer.boog(t, st, 0, r);
    if (bij([t.ab, 0], PUNT)) return passer.boog(t, st, 1, r);
    if (st.c && bij(st.c, 0.3))
      return {
        st: { ...st, c: null },
        zin: `${t.L[2]} weggehaald. ${passer.stap(t, { ...st, c: null })}`,
      };
    return passer.zetC(t, st, S && bij(S, VANG) ? S : p);
  },
  opSnijpunt(t, st) {
    const S = snijpunt(t.ab, st.ra, st.rb);
    return S ? passer.zetC(t, st, S) : { st, zin: passer.stap(t, st) };
  },
  stap(t, { ra, rb, c }) {
    const [A, B, C] = t.L;
    if (c) return `${C} staat er.`;
    if (!ra && !rb) return `Stel de passer in en zet hem in ${A} of in ${B}.`;
    if (!ra || !rb) return `Teken nu ook een boogje vanuit ${ra ? B : A}.`;
    return snijpunt(t.ab, ra, rb)
      ? `Zet ${C} op het snijpunt van de boogjes.`
      : 'De boogjes snijden elkaar niet. Verander de straal van een boogje.';
  },
};

// ---------------------------------------------------------------------------------------------
// Een uitslag van een kubus tekenen. t = { soort: 'uitslag', W, H, geg }: een rooster van W bij H hokjes en
// de hokjes [x, y] die al gekleurd zijn, met x naar rechts en y naar beneden, zoals in ruimte.js. De
// leerling tikt de andere hokjes aan. In het veld staan die als 'x,y', van boven naar beneden.

const uitslagMaat = (t) => {
  const u = 44;
  return {
    u,
    w: t.W * u + 2 * PAD,
    h: t.H * u + 2 * PAD,
    X: (x) => PAD + x * u,
    Y: (y) => PAD + y * u,
  };
};
const hokje = (m, [x, y], cls) =>
  `<rect class="${cls}" x="${m.X(x)}" y="${m.Y(y)}" width="${m.u}" height="${m.u}"/>`;
const plek = ([x, y]) => `rij ${y + 1}, kolom ${x + 1}`;
const opVolgorde = (cells) => [...cells].sort((p, q) => p[1] - q[1] || p[0] - q[0]);
// De stukken waar de hokjes in uiteenvallen: hokjes met een hele zijde tegen elkaar zitten in hetzelfde stuk.
// Het grootste stuk staat voorop.
function stukken(cells) {
  const over = cells.map((c) => c.join(',')),
    uit = [];
  while (over.length) {
    const stuk = [over.shift()];
    for (let k = 0; k < stuk.length; k++) {
      const [x, y] = stuk[k].split(',').map(Number);
      for (const n of [`${x + 1},${y}`, `${x - 1},${y}`, `${x},${y + 1}`, `${x},${y - 1}`]) {
        const i = over.indexOf(n);
        if (i >= 0) stuk.push(...over.splice(i, 1));
      }
    }
    uit.push(stuk.map((s) => s.split(',').map(Number)));
  }
  return uit.sort((p, q) => q.length - p.length);
}
const heeft = (cells, x, y) => cells.some((c) => c[0] === x && c[1] === y);
// Wat er mis is met de zes hokjes, als valkuil, met de hokjes waar het om gaat. Of null als het een uitslag
// van een kubus is.
function uitslagFout(t, cells) {
  const all = [...t.geg, ...cells];
  if (all.length < 6) return { id: 'te-weinig-hokjes', cells: [] };
  if (all.length > 6) return { id: 'te-veel-hokjes', cells: [] };
  const st = stukken(all);
  if (st.length > 1) return { id: 'los-hokje', cells: st.slice(1).flat() };
  for (const [x, y] of all)
    if (heeft(all, x + 1, y) && heeft(all, x, y + 1) && heeft(all, x + 1, y + 1))
      return {
        id: 'vierkant-van-vier',
        cells: [
          [x, y],
          [x + 1, y],
          [x, y + 1],
          [x + 1, y + 1],
        ],
      };
  for (const [x, y] of all)
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
    ]) {
      const rij = [0, 1, 2, 3, 4].map((k) => [x + k * dx, y + k * dy]);
      if (rij.every((c) => heeft(all, ...c))) return { id: 'rij-van-vijf', cells: rij };
    }
  const twee = sameFace(all);
  if (twee) return { id: 'zijvlak-dubbel', cells: twee.map((i) => all[i]) };
  return null;
}
const uitslag = {
  maat: uitslagMaat,
  lees(t, val) {
    const out = [];
    for (const w of String(val).split(' ')) {
      const m = /^(\d+),(\d+)$/.exec(w);
      if (m && +m[1] < t.W && +m[2] < t.H && !heeft(out, +m[1], +m[2])) out.push([+m[1], +m[2]]);
    }
    return out;
  },
  schrijf: (t, cells) =>
    opVolgorde(cells)
      .map((c) => c.join(','))
      .join(' '),
  nakijken: (t, cells) => [isCubeNet([...t.geg, ...cells])],
  // Het hokje waar een tik in valt, of null buiten het rooster.
  terug(t, sx, sy) {
    const m = uitslagMaat(t),
      x = Math.floor((sx - PAD) / m.u),
      y = Math.floor((sy - PAD) / m.u);
    return x >= 0 && y >= 0 && x < t.W && y < t.H ? [x, y] : null;
  },
  fig(t) {
    const m = uitslagMaat(t);
    return (
      rooster(t.W, t.H, m.X, m.Y) + t.geg.map((c) => hokje(m, c, 'sf') + hokje(m, c, 's')).join('')
    );
  },
  // De hokjes van de leerling, met fout een dikke rode rand en een kruisje bij de hokjes waar het om gaat, en
  // met cursor de plek van het toetsenbord.
  laag(t, cells, { fout, cursor } = {}) {
    const m = uitslagMaat(t),
      mis = fout ? (uitslagFout(t, cells)?.cells ?? []) : [];
    let o = cells.map((c) => hokje(m, c, 'w1') + hokje(m, c, 's')).join('');
    for (const c of mis)
      o += hokje(m, c, 'fout') + kruis(m.X(c[0]) + m.u / 2, m.Y(c[1]) + m.u / 2, 7);
    if (cursor)
      o += `<rect class="cursor" x="${m.X(cursor[0]) + 4}" y="${m.Y(cursor[1]) + 4}" width="${m.u - 8}" height="${m.u - 8}"/>`;
    return o;
  },
  desc: (t) =>
    `Rooster van ${t.W} hokjes breed en ${t.H} hokjes hoog.${t.geg.length ? ` Al gekleurd: ${opVolgorde(t.geg).map(plek).join('; ')}.` : ''}`,
  staat: (t, cells) =>
    cells.length
      ? `Jij kleurde ${cells.length === 1 ? '1 hokje' : `${cells.length} hokjes`}: ${opVolgorde(cells).map(plek).join('; ')}.`
      : 'Je hebt nog geen hokjes gekleurd.',
  rijen: (t, cells, each) => [
    [
      'Uitslag van een kubus',
      `${t.geg.length + cells.length} hokjes${each[0] ? '' : ', geen uitslag van een kubus'}`,
      each[0],
      'zie de uitwerking',
    ],
  ],
  // Een tik op hokje c kleurt het, of maakt het weer leeg. Een hokje dat er al stond, blijft staan.
  tik(t, cells, c) {
    if (heeft(t.geg, ...c)) return { st: cells, zin: `Hokje ${plek(c)} hoort al bij de uitslag.` };
    const aan = !heeft(cells, ...c),
      uit = aan ? [...cells, c] : cells.filter((q) => !same(q, c));
    return {
      st: uit,
      zin: `Hokje ${plek(c)} ${aan ? 'gekleurd' : 'leeg gemaakt'}. ${uitslag.stap(t, uit)}`,
    };
  },
  stap: (t, cells) => `${t.geg.length + cells.length} van 6 hokjes.`,
  plek: (t, cells, c) =>
    `${plek(c)}: ${heeft(t.geg, ...c) ? 'hoort al bij de uitslag' : heeft(cells, ...c) ? 'gekleurd' : 'leeg'}`,
  bezet: (t, cells, c) => heeft(cells, ...c),
  start: () => [0, 0],
  // De cursor een stap verder, met y omhoog, binnen het rooster. In het rooster loopt y naar beneden.
  verder: (t, c, [dx, dy]) => [clamp(c[0] + dx, 0, t.W - 1), clamp(c[1] - dy, 0, t.H - 1)],
};

// ---------------------------------------------------------------------------------------------
// Een som als pijl op de getallenlijn (#263). t = { soort: 'pijl', lo, hi, a, e }: de getallenlijn loopt van lo
// tot hi met een streepje bij elk geheel getal, en de goede pijl gaat van a, het eerste getal van de som, naar e,
// de uitkomst. De leerling tikt eerst het begin en dan het eind aan. Een punt is [x], zodat ook 0 een punt is.
// In het veld staan het begin en het eind, met een spatie ertussen en ? voor wat nog niet is gezet.

const pijlMaat = (t) => {
  // 20 per getal, net als de getallenlijn in getalfiguren.js: zo past de lijn op een telefoon van 320 px breed
  // zonder kleiner te worden, en blijven de getallen leesbaar.
  const u = 20,
    ml = 16,
    Y = 58;
  return {
    u,
    w: ml + (t.hi - t.lo) * u + 22,
    h: Y + 30,
    X: (x) => ml + (x - t.lo) * u,
    Y,
  };
};
// De hoogte van een pijl boven de lijn: die van de leerling, en daarboven de goede.
const PIJL_Y = { mijn: 30, goed: 12 };
function pijlLijn(m, van, naar, y, cls) {
  const a = r2(m.X(van)),
    b = r2(m.X(naar)),
    r = naar > van ? 1 : -1;
  return `<path class="hl" d="M${a} ${y}V${m.Y}M${b} ${y}V${m.Y}"/><path class="${cls}" d="M${a} ${y - 5}v10M${a} ${y}H${b}m${-7 * r} -5l${7 * r} 5l${-7 * r} 5"/>`;
}
const stappen = (van, naar) =>
  `${Math.abs(naar - van)} ${Math.abs(naar - van) === 1 ? 'stap' : 'stappen'} naar ${naar > van ? 'rechts' : 'links'}`;
const pijl = {
  maat: pijlMaat,
  lees(t, val) {
    const w = String(val).split(' ');
    return [0, 1].map((k) => {
      const m = /^-?\d+$/.exec(w[k] ?? '');
      return m && +m[0] >= t.lo && +m[0] <= t.hi ? [+m[0]] : null;
    });
  },
  schrijf: (t, pts) =>
    pts.some(Boolean) ? pts.map((p) => (p ? String(p[0]) : '?')).join(' ') : '',
  nakijken: (t, [b, e]) => [same(b, [t.a]), same(e, [t.e])],
  // Het streepje dat het dichtst bij een tik ligt.
  terug(t, sx) {
    const m = pijlMaat(t);
    return [clamp(Math.round((sx - m.X(t.lo)) / m.u) + t.lo, t.lo, t.hi)];
  },
  fig(t) {
    const m = pijlMaat(t);
    let o = `<path class="ax" d="M${m.X(t.lo) - 10} ${m.Y}H${m.X(t.hi) + 16}m-6 -4l6 4l-6 4"/>`;
    for (let v = t.lo; v <= t.hi; v++)
      o += `<path class="ax" d="M${m.X(v)} ${m.Y - 6}v12"/><text class="tn" text-anchor="middle" x="${m.X(v)}" y="${m.Y + 23}">${num(v)}</text>`;
    return o;
  },
  // Wat de leerling tekende: het begin en het eind als stip, en de pijl als ze er allebei zijn. Met fout een
  // kruisje bij wat niet goed is, met goed ook de goede pijl gestippeld erboven, en met cursor de plek van het
  // toetsenbord.
  laag(t, [b, e], { fout, goed, cursor } = {}) {
    const m = pijlMaat(t),
      ok = pijl.nakijken(t, [b, e]);
    let o = goed ? pijlLijn(m, t.a, t.e, PIJL_Y.goed, 'l2 d') : '';
    if (b && e && b[0] !== e[0]) o += pijlLijn(m, b[0], e[0], PIJL_Y.mijn, 'l1');
    [b, e].forEach((p, k) => {
      if (!p) return;
      o += `<circle class="dot" cx="${m.X(p[0])}" cy="${m.Y}" r="${k ? 4.5 : 3.5}"/>`;
      if (fout && !ok[k]) o += kruis(m.X(p[0]), m.Y - 14, 5);
    });
    if (cursor) o += `<circle class="cursor" cx="${m.X(cursor[0])}" cy="${m.Y}" r="11"/>`;
    return o;
  },
  desc: (t) =>
    `Een getallenlijn van ${num(t.lo)} tot ${num(t.hi)}, met een streepje bij elk geheel getal. Onder elk streepje staat het getal.`,
  staat(t, [b, e]) {
    if (!b && !e) return 'Er staat nog geen pijl.';
    if (!b) return `Het eind van de pijl staat bij ${num(e[0])}, het begin nog niet.`;
    if (!e) return `De pijl begint bij ${num(b[0])}, het eind staat er nog niet.`;
    return `De pijl gaat van ${num(b[0])} naar ${num(e[0])}, ${stappen(b[0], e[0])}.`;
  },
  rijen: (t, pts, each) =>
    ['Begin', 'Eind'].map((naam, k) => [
      naam,
      pts[k] ? T(String(pts[k][0])) : '<span class="muted">niet gezet</span>',
      each[k],
      T(String(k ? t.e : t.a)),
    ]),
  // Een tik op punt p: een gezet punt haal je weg, en anders komt eerst het begin en dan het eind daar.
  tik(t, pts, p) {
    const uit = [...pts],
      k = pts.findIndex((q) => same(q, p)),
      vrij = pts.findIndex((q) => !q);
    if (k >= 0) {
      uit[k] = null;
      return {
        st: uit,
        zin: `${k ? 'Eind' : 'Begin'} van de pijl weggehaald. ${pijl.stap(t, uit)}`,
      };
    }
    if (vrij < 0)
      return {
        st: pts,
        zin: 'De pijl staat er al. Tik op het begin of het eind om het weg te halen.',
      };
    uit[vrij] = p;
    return {
      st: uit,
      zin: `${vrij ? 'Eind' : 'Begin'} van de pijl bij ${num(p[0])}. ${uit[0] && uit[1] ? pijl.staat(t, uit) : pijl.stap(t, uit)}`,
    };
  },
  stap: (t, [b, e]) =>
    !b ? 'Tik waar de pijl begint.' : !e ? 'Tik nu waar de pijl eindigt.' : 'De pijl staat er.',
  plek(t, [b, e], p) {
    const wat = same(p, b) ? ', het begin van de pijl' : same(p, e) ? ', het eind van de pijl' : '';
    return `bij ${num(p[0])}${wat}`;
  },
  bezet: (t, pts, p) => pts.some((q) => same(q, p)),
  start: () => [0],
  verder: (t, p, [dx]) => [clamp(p[0] + dx, t.lo, t.hi)],
};

// ---------------------------------------------------------------------------------------------
// Punten aantikken (#286): de leerling zet een verzameling punten op de snijpunten van een rooster. Een tik zet
// een punt, en een tik op een gezet punt haalt het weg. De volgorde is vrij. Goed is precies de verzameling
// t.goed: elk punt van t.goed staat er, en er staat geen ander punt. In het veld staan de punten als 'x,y',
// gesorteerd op x en dan op y, met een spatie ertussen. Een getal schrijft het veld met een punt, zoals 9.5.
//
// roosterpunten: t = { soort: 'roosterpunten', xr: [-6, 6], yr: [-6, 6], goed: [[x, y], ...], geg }. Een gewoon
// assenstelsel zoals graph() in figures.js het tekent, met een rooster van 1 bij 1. geg zijn punten die er al
// staan, met een letter: [{ p: [1, 2], L: 'A' }]. Die kun je niet aantikken, dus ze horen niet bij t.goed.
//
// grafiekpunten: t = { soort: 'grafiekpunten', fig, goed: [[x, y], ...], snap, verbind }. fig zijn de opties van
// contextGraph() in grafiekfiguren.js (zonder functies, want t wordt als JSON bewaard), meestal zonder grafieken:
// alleen de assen met hun namen en het rooster. De punten liggen op de lijnen van het rooster, of met snap = [dx, dy]
// op een fijnere verdeling (bijvoorbeeld [1, 2.5] bij een as met stappen van 5). Met verbind ('lijn' of 'kromme')
// tekent de site de grafiek door de gezette punten, van links naar rechts.

const heeftP = (ps, p) => ps.some((q) => near(q[0], p[0], 1e-9) && near(q[1], p[1], 1e-9));
const puntOrde = (ps) => [...ps].sort((p, q) => p[0] - q[0] || p[1] - q[1]);
const spotP = (p) => `(${num(p[0])}, ${num(p[1])})`;
const aantal = (n) => (n === 1 ? '1 punt' : `${n} punten`);
// Het rooster waarop punten mogen liggen: per as het begin, het eind en de stap.
function raster(t) {
  if (t.soort === 'roosterpunten')
    return [
      [...t.xr, 1],
      [...t.yr, 1],
    ];
  const { x, y } = t.fig,
    s = t.snap || [x.stap, y.stap];
  return [
    [x.van, x.tot, s[0]],
    [y.van, y.tot, s[1]],
  ];
}
// Een getal op het rooster van een as: afgerond op een stap vanaf het begin, en niet buiten de as.
const opAs = ([lo, hi, st], v) => r2(clamp(lo + Math.round((v - lo) / st) * st, lo, hi));
const opRaster = (A, v) => v >= A[0] - 1e-9 && v <= A[1] + 1e-9 && near(opAs(A, v), v, 1e-6);
// De maat van een gewoon assenstelsel, zoals graph() in figures.js het tekent.
const assenMaat = (t) => {
  const u = t.u || 26;
  return {
    u,
    w: (t.xr[1] - t.xr[0]) * u + 50,
    h: (t.yr[1] - t.yr[0]) * u + 42,
    X: (x) => 30 + (x - t.xr[0]) * u,
    Y: (y) => 20 + (t.yr[1] - y) * u,
  };
};
const grafiekMaat = (t) => {
  const g = grafiekDelen(t.fig);
  return { u: g.u, w: g.W, h: g.H, X: g.X, Y: g.Y, g };
};
// De inhoud van een figuur zonder de buitenste <svg>, om er in een tekenvraag op verder te tekenen.
const zonderSvg = (s) => s.slice(s.indexOf('>') + 1, -6);
// een is de naam van één punt, zoals (2, 1), en waar de plek van de cursor, zoals op (2, 1).
function puntenSoort({ maat, fig, desc, lijst, een, waar, verbind }) {
  const vast = (t, p) => (t.geg || []).find((g) => heeftP([g.p], p));
  const S = {
    maat,
    lees(t, val) {
      const R = raster(t),
        out = [];
      for (const w of String(val).split(' ')) {
        const m = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(w);
        if (!m) continue;
        const p = [+m[1], +m[2]];
        if (opRaster(R[0], p[0]) && opRaster(R[1], p[1]) && !heeftP(out, p)) out.push(p);
      }
      return out;
    },
    schrijf: (t, ps) =>
      puntOrde(ps)
        .map((p) => p.map(r2).join(','))
        .join(' '),
    // Per punt van t.goed of het er staat, en als laatste of er geen ander punt staat.
    nakijken: (t, ps) => [...t.goed.map((g) => heeftP(ps, g)), ps.every((p) => heeftP(t.goed, p))],
    // Het punt van het rooster dat het dichtst bij een tik ligt, of null als de tik buiten het rooster valt. Een
    // halve stap buiten het rooster telt nog mee, zodat je ook de rand goed raakt.
    terug(t, sx, sy) {
      const m = maat(t),
        [A, B] = raster(t),
        x = A[0] + (sx - m.X(A[0])) / (m.X(A[0] + 1) - m.X(A[0])),
        y = B[0] + (sy - m.Y(B[0])) / (m.Y(B[0] + 1) - m.Y(B[0])),
        buiten = (R, v) => v < R[0] - R[2] / 2 || v > R[1] + R[2] / 2;
      return buiten(A, x) || buiten(B, y) ? null : [opAs(A, x), opAs(B, y)];
    },
    fig,
    // De punten van de leerling. Met fout een kruisje bij een punt dat er niet hoort, met goed de goede punten als
    // gestippelde rondjes, en met cursor de plek van het toetsenbord.
    laag(t, ps, { fout, goed, cursor } = {}) {
      const m = maat(t),
        P = (p) => [r2(m.X(p[0])), r2(m.Y(p[1]))],
        rond = (p, cls, r) => `<circle class="${cls}" cx="${P(p)[0]}" cy="${P(p)[1]}" r="${r}"/>`;
      let o = '';
      if (verbind && t.verbind && ps.length > 1) {
        const rij = puntOrde(ps),
          zelfdeX = rij.some((p, k) => k && near(p[0], rij[k - 1][0], 1e-9));
        o += `<path class="l1" d="${pad(rij.map(P), zelfdeX ? 'lijn' : t.verbind)}"/>`;
      }
      if (goed) for (const p of t.goed) o += rond(p, 'l2 d', 8);
      for (const p of ps) {
        o += rond(p, 'mk c1', 5);
        if (fout && !heeftP(t.goed, p)) o += kruis(P(p)[0] + 10, P(p)[1] - 10, 4);
      }
      if (cursor) o += rond(cursor, 'cursor', 11);
      return o;
    },
    desc,
    staat: (t, ps) =>
      ps.length
        ? `Je zette ${aantal(ps.length)}: ${lijst(t, puntOrde(ps))}.`
        : 'Je hebt nog geen punten gezet.',
    rijen(t, ps, each) {
      const anders = puntOrde(ps.filter((p) => !heeftP(t.goed, p))),
        niet = '<span class="muted">niet gezet</span>';
      return [
        ...t.goed.map((g, k) => [
          `Punt ${T(een(t, g))}`,
          each[k] ? 'gezet' : niet,
          each[k],
          'gezet',
        ]),
        [
          'Andere punten',
          anders.length ? T(lijst(t, anders)) : 'geen',
          each[each.length - 1],
          'geen',
        ],
      ];
    },
    // Een tik op punt p zet het, of haalt het weg als het er al stond. Een punt dat er al stond, blijft staan.
    tik(t, ps, p) {
      const g = vast(t, p);
      if (g) return { st: ps, zin: `Daar ligt punt ${g.L} al.` };
      const weg = heeftP(ps, p),
        uit = weg ? ps.filter((q) => !heeftP([q], p)) : [...ps, p];
      return {
        st: uit,
        zin: `Punt ${een(t, p)} ${weg ? 'weggehaald' : 'gezet'}. ${S.stap(t, uit)}`,
      };
    },
    stap: (t, ps) => `${aantal(ps.length)} gezet.`,
    plek(t, ps, p) {
      const g = vast(t, p);
      return `${waar(t, p)}${heeftP(ps, p) ? ', gezet' : g ? `, punt ${g.L}` : ''}`;
    },
    bezet: (t, ps, p) => heeftP(ps, p),
    start: (t) => raster(t).map((A) => opAs(A, 0)),
    // De cursor een stap verder, met y omhoog, binnen het rooster.
    verder(t, p, [dx, dy]) {
      const [A, B] = raster(t);
      return [opAs(A, p[0] + dx * A[2]), opAs(B, p[1] + dy * B[2])];
    },
  };
  return S;
}

const roosterpunten = puntenSoort({
  maat: assenMaat,
  fig: (t) =>
    zonderSvg(
      graph({
        xr: t.xr,
        yr: t.yr,
        u: t.u || 26,
        coords: false,
        pts: (t.geg || []).map((g) => ({ x: g.p[0], y: g.p[1], label: g.L })),
      }),
    ),
  desc: (t) =>
    `Assenstelsel met een rooster. De x-as loopt van ${num(t.xr[0])} tot ${num(t.xr[1])} en de y-as van ${num(t.yr[0])} tot ${num(t.yr[1])}.${t.geg?.length ? ` Gegeven: ${and(t.geg.map((g) => g.L + spotP(g.p)))}.` : ''}`,
  lijst: (t, ps) => and(ps.map(spotP)),
  een: (t, p) => spotP(p),
  waar: (t, p) => `op ${spotP(p)}`,
});

// Bij een grafiek bij een verhaal staan de getallen niet als coördinaten, maar als het getal op de horizontale as
// en het getal op de verticale as: 'bij 9 en 15'.
const grafiekpunten = puntenSoort({
  maat: grafiekMaat,
  fig: (t) => grafiekMaat(t).g.inner,
  desc: (t) => grafiekMaat(t).g.desc,
  lijst: (t, ps) =>
    `${ps.map((p) => `${num(p[0])} en ${num(p[1])}`).join('; ')} (steeds ${t.fig.x.naam} en ${t.fig.y.naam})`,
  een: (t, p) => `bij ${num(p[0])} en ${num(p[1])}`,
  waar: (t, p) => `bij ${num(p[0])} en ${num(p[1])}`,
  verbind: true,
});

const SOORTEN = { kubus, passer, uitslag, pijl, roosterpunten, grafiekpunten };
TEKEN.nakijken = (t, val) => SOORTEN[t.soort].nakijken(t, SOORTEN[t.soort].lees(t, val));

const svg = (t, inner, label, extra = '') => {
  const m = SOORTEN[t.soort].maat(t);
  return `<svg class="fig"${extra} role="img" aria-label="${attr(label)}" width="${m.w}" height="${m.h}" viewBox="0 0 ${m.w} ${m.h}">${inner}</svg>`;
};
// De figuur bij de vraag: wat er al getekend is, en een lege laag voor wat de leerling tekent. ui/tekenen.js
// vult die laag en maakt de figuur te bedienen.
const tekenFig = (t) =>
  svg(
    t,
    `${SOORTEN[t.soort].fig(t)}<g class="getekend"></g>`,
    SOORTEN[t.soort].desc(t),
    ` data-teken="${t.soort}"`,
  );
// Een vaste figuur met een tekening erin, zoals in de uitwerking: val is de tekst uit het veld.
const tekenAf = (t, val, label, opts) => {
  const S = SOORTEN[t.soort];
  return svg(t, S.fig(t) + S.laag(t, S.lees(t, val), opts), `${S.desc(t)} ${label}`);
};
// In het resultaat van een proeftoets: wat de leerling tekende, en bij een fout wat er mis is en, als dat kan,
// de goede tekening gestippeld.
const tekenResultaat = (t, val, ok) =>
  tekenAf(t, val, ok ? 'Met jouw tekening.' : 'Met jouw tekening en wat er fout is.', {
    fout: !ok,
    goed: !ok,
  });
// De regels in de tabel van het resultaat: [deel, jouw antwoord, goed, goed antwoord].
const tekenRijen = (t, val, each) => SOORTEN[t.soort].rijen(t, SOORTEN[t.soort].lees(t, val), each);

export {
  SOORTEN,
  RIBBEN,
  hoek,
  voorkant,
  schuineRibbe,
  ribNaam,
  rel,
  snijpunt,
  cGoed,
  MARGE,
  stukken,
  uitslagFout,
  assenMaat,
  tekenFig,
  tekenAf,
  tekenResultaat,
  tekenRijen,
};
