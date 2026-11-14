// Onderwerp: Parabolen verschuiven. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { nz, pick, coin, near, d, sg, Q, qv, fr, dlin } from '../math.js';
import { F, H, coef, vertexForm } from './shared.js';
import { graph } from '../figures.js';
import { T, esc } from '../typeset.js';

// Een melding na een valkuil is gewone tekst, dus met een echt minteken.
const minus = (s) => String(s).replace(/-/g, '−');
const num = (k) => (typeof k === 'object' ? fr(k) : d(k));
// Getallen voor a. Een half staat als breuk, zoals in het boek.
const A_FORM = [-3, -2, -1, -1, 1, 1, 2, 3, Q(1, 2), Q(-1, 2)];
// [a, b, c] uit drie functiewaarden, voor de controle v: zo volgt de parabool uit de formule zelf.
const fromValues = (f) => [(f(1) + f(-1) - 2 * f(0)) / 2, (f(1) - f(-1)) / 2, f(0)];

// Uitleg bij a, p en q, zoals in het boek: x + 3 = x − −3, dus p = −3.
function aText(a, p) {
  const A = qv(a),
    where = p ? 'de haakjes' : 'x^2';
  if (A === 1) return `Voor ${where} staat geen getal, dus a = 1.`;
  if (A === -1) return `Voor ${where} staat alleen een min, dus a = -1.`;
  return `Voor ${where} staat ${num(a)}, dus a = ${num(a)}.`;
}
const pText = (p) =>
  !p
    ? 'Er staan geen haakjes: x^2 = (x - 0)^2, dus p = 0.'
    : p < 0
      ? `x + ${-p} = x - -${-p}, dus p = ${p}.`
      : `In de haakjes staat x - ${p}, dus p = ${p}.`;
const qText = (q) =>
  q
    ? `Achter het kwadraat staat ${q}, dus q = ${q}.`
    : 'Er staat geen getal achter het kwadraat, dus q = 0.';

function s35apq() {
  const a = pick(A_FORM),
    kind = pick(['pq', 'pq', 'pq', 'zonder-q', 'zonder-p']),
    p = kind === 'zonder-p' ? 0 : nz(-7, 7),
    q = kind === 'zonder-q' ? 0 : nz(-9, 9),
    f = vertexForm(a, p, q),
    n = pick(['f', 'g', 'h']),
    traps = [];
  if (p)
    traps.push({
      id: 'teken-p',
      f: (v) => near(v[1], -p),
      m: minus(
        `Let op het teken van p. In a(x − p)² + q staat een min voor p. Bij (${dlin(1, -p)}) is p = ${p}.`,
      ),
    });
  if (Math.abs(qv(a)) === 1)
    traps.push({
      id: 'a-is-een',
      // Ook a = 1 bij −(x + 4)²: de min vergeten.
      f: (v) => near(v[0], 0) || near(v[0], -qv(a)),
      m: 'Staat er geen getal voor de haakjes, dan is a = 1. Staat er alleen een min, dan is a = −1.',
    });
  if (p !== q)
    traps.push({
      id: 'p-en-q-omgedraaid',
      f: (v) => near(v[1], q) && near(v[2], p),
      m: 'p is het getal in de haakjes en q het getal achter het kwadraat.',
    });
  return {
    q: T(
      `Gegeven is de functie ${n}(x) = ${f}. Schrijf die als a(x - p)^2 + q. Wat zijn a, p en q?`,
    ),
    fields: [F('a =', a), F('p =', p), F('q =', q)],
    compact: true,
    hint: T(
      'a is het getal voor de haakjes, p staat met een min in de haakjes en q achter het kwadraat. Ontbreekt een getal, dan is dat 0.',
    ),
    steps: [aText(a, p), pText(p), qText(q), `a = ${num(a)}, p = ${p} en q = ${q}`],
    traps,
    // De top uit de formule met x_top = −b/(2a): die is (p, q).
    v: () => {
      const k = fromValues((x) => qv(a) * (x - p) ** 2 + q),
        xt = -k[1] / (2 * k[0]);
      return near(k[0], qv(a)) && near(xt, p) && near((k[0] * xt + k[1]) * xt + k[2], q);
    },
  };
}

// De verschuiving in woorden, zoals boven de pijl in het boek: 4 naar links en 7 omlaag.
const moveText = (h, v) =>
  [
    h ? `${Math.abs(h)} naar ${h > 0 ? 'rechts' : 'links'}` : '',
    v ? `${Math.abs(v)} ${v > 0 ? 'omhoog' : 'omlaag'}` : '',
  ]
    .filter(Boolean)
    .join(' en ');
// De pijl met de verschuiving erboven, van de ene formule naar de andere.
// Een formule breekt niet midden op een telefoon af, alleen bij de pijl.
const arrow = (from, move, to) =>
  H(
    `<span class="heel">${T(from)}</span> <span class="pijl">${esc(move)}</span> <span class="heel">${T(to)}</span>`,
  );
// Spaties die niet afbreken, zodat x − 2 op één regel blijft.
const keep = (s) => s.replace(/ /g, ' ');
// Wat je in de formule doet bij elke verschuiving.
const howText = (h, v) => [
  ...(h
    ? [`${Math.abs(h)} naar ${h > 0 ? 'rechts' : 'links'}: vervang x door ${keep(dlin(1, -h))}.`]
    : []),
  ...(v
    ? [`${Math.abs(v)} ${v > 0 ? 'omhoog' : 'omlaag'}: zet ${sg(v).trim()} achter het voorschrift.`]
    : []),
];

const SIGN = ['+', '−'];
function s35shift() {
  const a = pick([...A_FORM, 0.5, 0.3, -0.2]),
    base = pick(['ax2', 'ax2q', 'apq', 'apq']),
    kind = pick(['h', 'v', 'hv', 'hv']);
  let p, q, h, v;
  do {
    p = base === 'apq' ? nz(-5, 5) : 0;
    q = base === 'ax2' ? 0 : nz(-9, 9);
    h = kind === 'v' ? 0 : nz(-8, 8);
    v = kind === 'h' ? 0 : nz(-9, 9);
    // Valt een getal na de verschuiving weg, dan klopt de vorm van de velden niet meer. Zo'n
    // verschuiving komt dus niet voor.
  } while ((h && p + h === 0) || (v && q + v === 0) || Math.abs(p + h) > 9 || Math.abs(q + v) > 15);
  const P = p + h,
    R = q + v,
    fn = vertexForm(a, p, q),
    gn = vertexForm(a, P, R),
    // De formule direct na het vervangen van x en het optellen, zoals in het boek.
    inner = p ? `(${h ? dlin(1, -h) : 'x'}${sg(-p)})` : h ? `(${dlin(1, -h)})` : 'x',
    raw = `${coef(a)}${inner}^2${q ? sg(q) : ''}${v ? sg(v) : ''}`,
    lead = `g(x) = ${coef(a)}`,
    fields = [],
    iP = P ? 0 : -1,
    iR = P ? 2 : 0;
  if (P)
    fields.push(
      { sel: SIGN, a: P > 0 ? '−' : '+', pre: `${lead}(x`, label: 'Het teken in de haakjes' },
      { ...F('', Math.abs(P), ')^2'), label: 'Het getal in de haakjes' },
    );
  if (R)
    fields.push(
      {
        sel: SIGN,
        a: R > 0 ? '+' : '−',
        pre: P ? '' : `${lead}x^2`,
        label: 'Het teken voor het getal achter het kwadraat',
      },
      { ...F('', Math.abs(R)), label: 'Het getal achter het kwadraat' },
    );
  // Het getal met teken zoals de leerling het invult: P in (x − P) en R in + R.
  const sign = (s) => (s === '+' ? 1 : s === '−' ? -1 : NaN),
    gotP = (w) => (P ? -sign(w[iP]) * w[iP + 1] : 0),
    gotR = (w) => (R ? sign(w[iR]) * w[iR + 1] : 0),
    // Een getal met een min erbij, zoals + en −3 voor − 3. Wiskundig kan dat hetzelfde zijn, maar
    // het teken hoort in de lijst. Deze valkuil staat voor de andere.
    traps = [
      {
        id: 'getal-met-teken',
        f: (w) => fields.some((f, i) => !f.sel && w[i] < 0),
        m: 'Typ het getal zonder min. Het teken kies je in de lijst ervoor.',
      },
    ];
  if (h)
    traps.push({
      id: 'links-rechts-omgedraaid',
      f: (w) => near(gotP(w), p - h),
      m: 'Let op het teken. Bij n naar rechts vervang je x door x − n, en bij n naar links door x + n. Naar links geeft dus een plus.',
    });
  if (v)
    traps.push({
      id: 'omhoog-omlaag-omgedraaid',
      f: (w) => near(gotR(w), q - v),
      m: 'Bij omhoog tel je het getal op, bij omlaag trek je het af.',
    });
  if (p && h)
    traps.push({
      id: 'p-vergeten',
      f: (w) => near(gotP(w), h),
      m: minus(
        `In de formule van f staat al (${dlin(1, -p)}). Vervang daarin x door ${dlin(1, -h)}, en schrijf het korter.`,
      ),
    });
  if (q && v)
    traps.push({
      id: 'q-vergeten',
      f: (w) => near(gotR(w), v),
      m: minus(`Het getal ${q} uit de formule van f blijft staan. Tel de verschuiving erbij op.`),
    });
  return {
    q: T(
      `De grafiek van f(x) = ${fn} schuif je ${moveText(h, v)}. Zo krijg je de grafiek van g. Wat is de formule van g? Kies het teken in de lijst en typ het getal zonder teken.`,
    ),
    fields,
    compact: true,
    hint: T(
      'n naar rechts: vervang x door x - n. n naar links: vervang x door x + n. n omhoog of omlaag: zet + n of - n achter het voorschrift.',
    ),
    steps: [
      ...howText(h, v),
      arrow(`f(x) = ${fn}`, moveText(h, v), `g(x) = ${raw}`),
      ...(raw !== gn ? [`Dus g(x) = ${gn}`] : []),
    ],
    traps,
    // De ingevulde formule van g, vergeleken met f(x − h) + v.
    v: () => {
      const w = fields.map((f) => f.a),
        g = (x) => qv(a) * (x - gotP(w)) ** 2 + gotR(w),
        f = (x) => qv(a) * (x - p) ** 2 + q;
      return [-3, -1, 0, 2, 5].every((x) => near(g(x), f(x - h) + v));
    },
  };
}

function s35howshift() {
  const a = pick(A_FORM);
  let p, q, h, v;
  do {
    p = coin() ? 0 : nz(-5, 5);
    q = coin() && coin() ? 0 : nz(-9, 9);
    h = nz(-7, 7);
    v = nz(-9, 9);
  } while (Math.abs(p + h) > 8 || Math.abs(q + v) > 12);
  const P = p + h,
    R = q + v,
    LR = ['naar links', 'naar rechts'],
    UD = ['omhoog', 'omlaag'],
    lr = h > 0 ? LR[1] : LR[0],
    ud = v > 0 ? UD[0] : UD[1],
    traps = [
      {
        id: 'getal-met-teken',
        f: (w) => w[0] < 0 || w[2] < 0,
        m: 'Een afstand is altijd positief. Typ het getal zonder min, en kies de richting in de lijst.',
      },
      {
        id: 'links-rechts-omgedraaid',
        f: (w) => near(w[0], Math.abs(h)) && !!w[1] && w[1] !== lr,
        m: 'Kijk naar x_top. Wordt x_top groter, dan gaat de grafiek naar rechts. Wordt x_top kleiner, dan naar links.',
      },
      {
        id: 'omhoog-omlaag-omgedraaid',
        f: (w) => near(w[2], Math.abs(v)) && !!w[3] && w[3] !== ud,
        m: 'Kijk naar y_top. Wordt y_top groter, dan gaat de grafiek omhoog. Wordt y_top kleiner, dan omlaag.',
      },
    ];
  if ((p && Math.abs(P) !== Math.abs(h)) || (q && Math.abs(R) !== Math.abs(v)))
    traps.push({
      id: 'verschil-vergeten',
      f: (w) =>
        (p && Math.abs(P) !== Math.abs(h) && near(w[0], Math.abs(P))) ||
        (q && Math.abs(R) !== Math.abs(v) && near(w[2], Math.abs(R))),
      m: 'De afstand is het verschil tussen de toppen. Schrijf de top van f en de top van g op, en kijk hoe ver de top opschuift.',
    });
  return {
    q: T(
      `Gegeven zijn f(x) = ${vertexForm(a, p, q)} en g(x) = ${vertexForm(a, P, R)}. Hoe moet je de grafiek van f verschuiven om de grafiek van g te krijgen? Typ de afstanden zonder teken en kies de richting in de lijst.`,
    ),
    fields: [
      { ...F('De grafiek van f gaat', Math.abs(h)), label: 'Hoe ver naar links of rechts' },
      { sel: LR, a: lr, label: 'Naar links of naar rechts' },
      { ...F('en', Math.abs(v)), label: 'Hoe ver omhoog of omlaag' },
      { sel: UD, a: ud, label: 'Omhoog of omlaag' },
    ],
    compact: true,
    hint: T('Schrijf de top van f en de top van g op. De top van a(x - p)^2 + q is (p, q).'),
    steps: [
      `De top van f is (${p}, ${q}). De top van g is (${P}, ${R}).`,
      `Van x = ${p} naar x = ${P} is ${Math.abs(h)} ${lr}.`,
      `Van y = ${q} naar y = ${R} is ${Math.abs(v)} ${ud}.`,
      `Dus de grafiek van f gaat ${Math.abs(h)} ${lr} en ${Math.abs(v)} ${ud}.`,
    ],
    traps,
    // f verschoven zoals in de antwoorden moet bij elke x hetzelfde geven als g.
    v: () => {
      const H2 = lr === LR[1] ? Math.abs(h) : -Math.abs(h),
        V2 = ud === UD[0] ? Math.abs(v) : -Math.abs(v),
        f = (x) => qv(a) * (x - p) ** 2 + q,
        g = (x) => qv(a) * (x - P) ** 2 + R;
      return [-3, -1, 0, 2, 5].every((x) => near(f(x - H2) + V2, g(x)));
    },
  };
}

// De grafieken bij het voorbeeld in de uitleg.
const EX = { xr: [-5, 4], yr: [-5, 6], u: 22 };

export default {
  slug: 'parabolen-verschuiven',
  title: 'Parabolen verschuiven',
  intro:
    'Schuif je een parabool omhoog, omlaag, naar links of naar rechts, dan verandert de formule op een vaste manier. Hier leer je de formule van een verschoven parabool opstellen, en uit twee formules aflezen hoe een grafiek is verschoven.',
  description:
    'Parabolen verschuiven oefenen: de formule na een verschuiving opstellen en a, p en q aflezen uit a(x − p)² + q. Havo 3, gratis met uitleg en hints.',
  videos: {
    menno: [
      ['Verticaal verschuiven', 'tTxbZ4qK8BY'],
      ['Horizontaal verschuiven', 'kZygNhv7H8w'],
    ],
  },
  skills: [
    [90, 'a, p en q aflezen', s35apq],
    [91, 'Formule na een verschuiving', s35shift],
    [92, 'Hoe is de grafiek verschoven?', s35howshift],
  ],
  learn: [
    {
      t: 'De functie f(x) = a(x - p)^2 + q',
      p: [
        T(
          'Een functie als f(x) = a(x - p)^2 + q met a ≠ 0 is een kwadratische functie. a is het getal voor de haakjes, p staat met een min in de haakjes en q staat achter het kwadraat.',
        ),
        T('Bij f(x) = -2(x + 5)^2 is a = -2, p = -5 en q = 0, want x + 5 = x - -5.'),
      ],
    },
    {
      t: 'Verticaal verschuiven',
      p: [
        T(
          'Schuif je een grafiek n omhoog, dan komt er + n achter het voorschrift. Schuif je n omlaag, dan komt er - n achter.',
        ),
      ],
      ex: {
        q: T('De grafiek van f(x) = 2x^2 schuif je 3 omlaag. Zo krijg je de grafiek van g.'),
        steps: [
          arrow('f(x) = 2x^2', '3 omlaag', 'g(x) = 2x^2 - 3'),
          H(
            graph({
              ...EX,
              curves: [
                { abc: [2, 0, 0], name: 'f', at: 1.5 },
                { abc: [2, 0, -3], name: 'g', at: 1.9 },
              ],
              label: 'De grafieken van f en g. De grafiek van g ligt 3 lager.',
            }),
          ),
        ],
      },
    },
    {
      t: 'Horizontaal verschuiven',
      p: [
        T(
          'Schuif je een grafiek n naar rechts, dan vervang je x door x - n. Schuif je n naar links, dan vervang je x door x + n.',
        ),
      ],
      ex: {
        q: T('De grafiek van f(x) = 2x^2 schuif je 3 naar links. Zo krijg je de grafiek van g.'),
        steps: [
          arrow('f(x) = 2x^2', '3 naar links', 'g(x) = 2(x + 3)^2'),
          H(
            graph({
              ...EX,
              curves: [
                { abc: [2, 0, 0], name: 'f', at: 1.5 },
                { abc: [2, 12, 18], name: 'g', at: -1.5 },
              ],
              label: 'De grafieken van f en g. De grafiek van g ligt 3 naar links.',
            }),
          ),
        ],
      },
      watch: T(
        'Naar links geeft een plus en naar rechts een min. Bij g(x) = 2(x + 3)^2 is x_top = -3: de top ligt 3 naar links.',
      ),
    },
    {
      t: 'Twee verschuivingen tegelijk',
      p: [
        'Schuif je een grafiek opzij en omhoog of omlaag, doe dan allebei. Staat er al een getal achter het kwadraat, tel dan de getallen bij elkaar op.',
      ],
      ex: {
        q: T(
          'De grafiek van f(x) = -0,5x^2 + 4 schuif je 6 naar rechts en 9 omlaag. Zo krijg je de grafiek van g.',
        ),
        steps: [
          arrow('f(x) = -0,5x^2 + 4', '6 naar rechts en 9 omlaag', 'g(x) = -0,5(x - 6)^2 + 4 - 9'),
          'Dus g(x) = -0,5(x - 6)^2 - 5',
        ],
      },
    },
    {
      t: 'Hoe is een grafiek verschoven?',
      p: [
        T(
          'De top van a(x - p)^2 + q is (p, q). Vergelijk de toppen van de twee grafieken. Zo zie je hoe ver de grafiek opzij en omhoog of omlaag is geschoven.',
        ),
      ],
      ex: {
        q: T(
          'Hoe schuif je de grafiek van f(x) = 3(x - 1)^2 + 2 naar de grafiek van g(x) = 3(x + 4)^2 + 7?',
        ),
        steps: [
          'De top van f is (1, 2). De top van g is (-4, 7).',
          'Van x = 1 naar x = -4 is 5 naar links.',
          'Van y = 2 naar y = 7 is 5 omhoog.',
          'Dus de grafiek van f gaat 5 naar links en 5 omhoog.',
        ],
      },
    },
  ],
};
