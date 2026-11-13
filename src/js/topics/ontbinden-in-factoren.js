// Onderwerp: Ontbinden in factoren. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { nz, pick, coin, gcd, near } from '../math.js';
import { F, H, MC, quad, factors, setTrap } from './shared.js';
import { T, dt } from '../typeset.js';

// Meestal x, soms een andere letter, zoals in het boek.
const letter = () => (coin() || coin() ? 'x' : pick(['a', 'p', 't']));

// Twee verschillende getallen p en q, niet 0 en niet tegengesteld, zodat x² + bx + c met b = p + q
// en c = pq echt drie termen heeft: (x + p)(x + q).
function pair(max = 48) {
  let p, q;
  do {
    p = nz(-10, 10);
    q = nz(-10, 10);
  } while (p === q || p === -q || Math.abs(p * q) > max);
  return [p, q];
}
// Zoekt de twee gehele getallen met product c en som b door alles te proberen. Voor de controle v:
// zo volgt het antwoord uit de vraag en niet uit hoe de vraag is gemaakt.
function search(b, c) {
  const out = [];
  for (let p = -Math.abs(c); p <= Math.abs(c); p++)
    if (p && c % p === 0 && p + c / p === b && p <= c / p) out.push([p, c / p]);
  return out;
}
// De paren getallen met product c, met het teken dat bij b past, tot en met het goede paar. Zoals
// in de tabel in het boek, met het kleinste getal (zonder teken) eerst.
function candidates(b, c) {
  const out = [],
    s = Math.sign(b);
  for (let k = 1; k * k <= Math.abs(c); k++) {
    if (Math.abs(c) % k) continue;
    const big = Math.abs(c) / k,
      // Bij een positief product hebben ze allebei het teken van b. Anders krijgt het grootste
      // getal het teken van b.
      duo = c > 0 ? [s * k, s * big] : [-s * k, s * big];
    out.push(duo);
    if (duo[0] + duo[1] === b) break;
  }
  return out;
}
const signText = (b, c) =>
  c > 0
    ? `Het product is positief, dus de getallen hebben hetzelfde teken. De som is ${b > 0 ? 'positief, dus ze zijn allebei positief' : 'negatief, dus ze zijn allebei negatief'}.`
    : `Het product is negatief, dus één getal is positief en één negatief. De som is ${b > 0 ? 'positief' : 'negatief'}, dus het getal dat het verst van 0 ligt, is ${b > 0 ? 'positief' : 'negatief'}.`;
// De uitwerking van de product-som-methode: welke tekens, de tabel en de controle in woorden.
function pairSteps(b, c, v) {
  const rows = candidates(b, c),
    [p, q] = rows[rows.length - 1];
  return [
    `Zoek twee getallen met product ${c} en som ${b}.`,
    signText(b, c),
    // Elk paar op een eigen regel, zodat de tabel ook op een telefoon past.
    H(
      dt(
        [[`product ${c}`, 'som'], ...rows.map(([x, y]) => [`${x} en ${y}`, String(x + y)])],
        `Paren getallen met product ${String(c).replace('-', '−')}`,
      ),
    ),
    `Dus ${p} en ${q}, want ${p}*${q} = ${c} en ${p} + ${q} = ${b}.`,
    `${quad([1, b, c], undefined, v)} = ${factors(
      [
        [1, p],
        [1, q],
      ],
      v,
    )}`,
  ];
}
// De valkuilen bij twee getallen met product c en som b, voor een groep van twee velden.
// Met v gaat het om de velden in (x + …)(x + …). Wie daar de getallen zonder teken of met het
// verkeerde teken invult, denkt vaak niets fout over de ontbinding, maar over wat in het veld hoort.
function pairTraps(p, q, v) {
  const b = p + q,
    c = p * q,
    sign = v
      ? `Er staat (${v} + …), dus je vult het getal met zijn teken in: voor (${v} − 4) typ je −4, en voor (${v} + 4) typ je 4.`
      : null;
  return [
    ...(v ? [setTrap('teken-in-haakjes', [Math.abs(p), Math.abs(q)], [p, q], sign)] : []),
    setTrap(
      'tekens-omgedraaid',
      [-p, -q],
      [p, q],
      sign ||
        `Het product klopt, maar de som niet: die is nu ${-b} in plaats van ${b}. Draai de tekens van allebei de getallen om.`.replace(
          /-/g,
          '−',
        ),
    ),
    {
      id: 'som-klopt-niet',
      f: (v) => near(v[0] * v[1], c) && !near(v[0] + v[1], b),
      m: `Het product klopt, maar de som niet. Zoek een ander paar getallen met product ${c}.`.replace(
        /-/g,
        '−',
      ),
    },
    {
      id: 'product-klopt-niet',
      f: (v) => near(v[0] + v[1], b) && !near(v[0] * v[1], c),
      m: `De som klopt, maar het product niet. Zoek een ander paar getallen met som ${b}.`.replace(
        /-/g,
        '−',
      ),
    },
  ].filter(Boolean);
}
// x² + bx + c met b = p + q en c = pq moet bij precies dit paar horen.
const pairOk = (p, q) => {
  const all = search(p + q, p * q);
  return all.length === 1 && all[0].join() === [p, q].sort((x, y) => x - y).join();
};

function s33common() {
  const v = letter(),
    // Meestal x² + bx, soms ax² + bx met a en b zonder gemeenschappelijke factor.
    a = coin() ? 1 : pick([2, 3, 4, 5, 6]);
  let b;
  do {
    b = coin() && a > 1 ? pick([-1, 1]) : nz(-12, 12);
  } while (gcd(a, b) !== 1 && a > 1);
  const poly = quad([a, b, 0], undefined, v),
    fields =
      a === 1
        ? [{ ...F(`${v}(${v} +`, b, ')'), label: `Het getal tussen de haakjes na ${v} +` }]
        : [
            { ...F(`${v}(`, a, `${v} +`), label: `Het getal voor ${v} tussen de haakjes` },
            { ...F('', b, ')'), label: `Het getal zonder ${v} tussen de haakjes` },
          ],
    last = fields.length - 1;
  const traps = [
    {
      id: 'teken-vergeten',
      f: (v) => near(v[last], -b),
      m: 'Het teken hoort bij het getal. Staat er een min voor de term, dan staat die min ook tussen de haakjes.',
    },
  ];
  if (Math.abs(b) === 1)
    traps.push({
      id: 'een-wordt-nul',
      f: (v) => near(v[last], 0),
      m: `Haal je x buiten haakjes, dan blijft er van x het getal 1 over en niet 0, want x = 1 · x.`.replace(
        /x/g,
        v,
      ),
    });
  return {
    q: T(`Ontbind in factoren: ${poly}`),
    fields,
    compact: true,
    hint: T(
      `In elke term zit een ${v}. Haal ${v} buiten haakjes.${b < 0 ? ' Is een getal negatief, vul dan bijvoorbeeld -3 in.' : ''}`,
    ),
    steps: [
      a === 1
        ? `${v}^2 = ${v}*${v} en ${quad([0, b, 0], undefined, v)} = ${Math.abs(b) === 1 ? (b < 0 ? '-' : '') + `1*${v}` : `${b}*${v}`}`
        : `${a}${v}^2 = ${v}*${a}${v} en ${quad([0, b, 0], undefined, v)} = ${b}*${v}`,
      `Dus ${poly} = ${v}(${quad([0, a, b], undefined, v)})`,
    ],
    traps,
    // Haakjes weer wegwerken: x · (ax + b) moet bij elke x hetzelfde geven als ax² + bx.
    v: () =>
      [-2, 1, 3].every((x) => {
        const [A, B] = fields.length === 1 ? [1, fields[0].a] : fields.map((f) => f.a);
        return near(x * (A * x + B), a * x * x + b * x);
      }),
  };
}

function s33pair() {
  let p, q;
  do [p, q] = pair();
  while (!pairOk(p, q));
  const v = letter(),
    b = p + q,
    c = p * q;
  return {
    q: T(
      `Je ontbindt ${quad([1, b, c], undefined, v)} met de product-som-methode. Welke twee getallen hebben als product ${c} en als som ${b}?`,
    ),
    fields: [
      { ...F('', p), grp: 'getal', label: 'Eerste getal' },
      { ...F('en', q), grp: 'getal', label: 'Tweede getal' },
    ],
    compact: true,
    hint: T(
      `Schrijf de paren getallen op met product ${c}. Kijk eerst naar de tekens: is het product positief of negatief?`,
    ),
    steps: pairSteps(b, c, v),
    traps: pairTraps(p, q),
    v: () => search(b, c).length === 1 && near(p * q, c) && near(p + q, b),
  };
}

function s33pick() {
  let p, q, other;
  do {
    [p, q] = pair();
    // Een ander paar met hetzelfde product, voor een keuze waarbij alleen de som niet klopt.
    const c = p * q,
      list = [];
    for (let k = 1; k <= Math.abs(c); k++)
      if (c % k === 0 && k !== Math.abs(p) && k !== Math.abs(q) && k * k !== Math.abs(c))
        list.push([Math.sign(p) * k, c / (Math.sign(p) * k)]);
    other = list.length && coin() ? pick(list) : null;
  } while (!pairOk(p, q));
  const v = letter(),
    b = p + q,
    c = p * q,
    fx = (r, s) =>
      T(
        factors(
          [
            [1, r],
            [1, s],
          ],
          v,
        ),
      ),
    right = fx(p, q),
    both = fx(-p, -q),
    one = coin() ? fx(-p, q) : fx(p, -q),
    // Zonder ander paar met hetzelfde product, de andere keuze met één teken fout.
    third = other ? fx(...other) : one === fx(-p, q) ? fx(p, -q) : fx(-p, q),
    mc = MC([right, both, one, third], 0);
  return {
    q: T(`Welke ontbinding hoort bij ${quad([1, b, c], undefined, v)}?`),
    mc,
    hint: T(
      `Zoek twee getallen met product ${c} en som ${b}. Werk daarna bij een keuze de haakjes weg als je twijfelt.`,
    ),
    steps: pairSteps(b, c, v),
    traps: [
      {
        id: 'tekens-omgedraaid',
        f: (x) => x[0] === both,
        m: `Het product klopt, maar de som niet. Bij (${v} − 3) hoort het getal −3, en bij (${v} + 3) het getal 3.`,
      },
      {
        id: 'een-teken-fout',
        f: (x) => x[0] === one || (!other && x[0] === third),
        m: 'Kijk naar het product van de twee getallen: klopt het teken daarvan?',
      },
      ...(other
        ? [
            {
              id: 'som-klopt-niet',
              f: (x) => x[0] === third,
              m: 'Het product klopt, maar de som niet. Tel de twee getallen op en vergelijk met het getal voor x.',
            },
          ]
        : []),
    ],
    // De goede keuze volgt ook uit zoeken naar het enige paar met product c en som b.
    v: () => {
      const [r, s] = search(b, c)[0];
      return mc.opts[mc.a] === fx(r, s) && new Set(mc.opts).size === 4;
    },
  };
}

function s33factor() {
  let p, q;
  do [p, q] = pair(60);
  while (!pairOk(p, q));
  const v = letter(),
    b = p + q,
    c = p * q;
  return {
    q: T(
      `Ontbind in factoren: ${quad([1, b, c], undefined, v)}. Staat er een min in de haakjes, typ dan een minteken voor het getal.`,
    ),
    fields: [
      { ...F(`(${v} +`, p, ')'), grp: 'factor', label: 'Getal in de eerste haakjes' },
      { ...F(`(${v} +`, q, ')'), grp: 'factor', label: 'Getal in de tweede haakjes' },
    ],
    compact: true,
    hint: T(
      `Zoek twee getallen met product ${c} en som ${b}. Is een getal negatief, vul dan bijvoorbeeld -3 in: (${v} + -3) is hetzelfde als (${v} - 3).`,
    ),
    steps: pairSteps(b, c, v),
    traps: pairTraps(p, q, v),
    // De haakjes weer wegwerken moet bij elke x hetzelfde geven.
    v: () => [-3, 0, 2, 5].every((x) => near((x + p) * (x + q), x * x + b * x + c)),
  };
}

export default {
  slug: 'ontbinden-in-factoren',
  title: 'Ontbinden in factoren',
  intro:
    'Ontbinden in factoren is een som schrijven als een product, zoals x^2 + 5x = x(x + 5). Het is het omgekeerde van haakjes wegwerken. Hier leer je x buiten haakjes halen en de product-som-methode.',
  description:
    'Oefen ontbinden in factoren: x buiten haakjes halen en x² + bx + c ontbinden met de product-som-methode. Gratis, met uitleg en uitwerkingen.',
  videos: {
    menno: [['Ontbinden in factoren', 'WG3moj6vfS8']],
  },
  skills: [
    [74, 'x buiten haakjes', s33common],
    [75, 'Product en som', s33pair],
    [76, 'Ontbinding kiezen', s33pick],
    [77, 'Ontbinden met product en som', s33factor],
  ],
  learn: [
    {
      t: 'x buiten haakjes halen',
      p: [
        'Ontbinden in factoren betekent: een som schrijven als een product. Het is het omgekeerde van haakjes wegwerken.',
        T(
          'Zit in elke term een x, dan haal je x buiten haakjes. Bij x^2 + 6x is x^2 = x*x en 6x = 6*x, dus x^2 + 6x = x(x + 6).',
        ),
      ],
      ex: {
        q: T('Ontbind in factoren: 2x^2 - 7x'),
        steps: ['2x^2 = x*2x en -7x = -7*x', 'Dus 2x^2 - 7x = x(2x - 7)'],
      },
      watch: T('Bij x^2 - x blijft 1 over, want x = 1*x. Dus x^2 - x = x(x - 1).'),
    },
    {
      t: 'De product-som-methode',
      p: [
        T(
          'Bij x^2 + bx + c zoek je twee getallen met product c en som b. Zijn dat p en q, dan is x^2 + bx + c = (x + p)(x + q).',
        ),
        T(
          'Let op: c is het losse getal, zonder x. b is het getal vóór x. Het product is dus altijd het losse getal, ook als b verder van 0 ligt dan c.',
        ),
      ],
      how: [
        'Kijk naar de tekens. Is het product positief, dan hebben de getallen hetzelfde teken als de som. Is het product negatief, dan is één getal positief en één negatief, en het getal dat het verst van 0 ligt heeft het teken van de som.',
        'Schrijf de paren getallen op met het goede product, en reken van elk paar de som uit.',
        T('Kies het paar met de goede som en schrijf de ontbinding op.'),
      ],
      ex: {
        q: T('Ontbind in factoren: x^2 - 4x - 21'),
        steps: [
          'Zoek twee getallen met product -21 en som -4.',
          'Het product is negatief, dus één getal is positief en één negatief. De som is negatief, dus het getal dat het verst van 0 ligt, is negatief.',
          H(
            dt(
              [
                ['product -21', 'som'],
                ['1 en -21', '-20'],
                ['3 en -7', '-4'],
              ],
              'Paren getallen met product −21',
            ),
          ),
          'Dus 3 en -7, want 3*-7 = -21 en 3 + -7 = -4.',
          'x^2 - 4x - 21 = (x + 3)(x - 7)',
        ],
      },
      ex2: {
        q: T('Ontbind in factoren: x^2 + 9x + 8'),
        steps: [
          'Zoek twee getallen met product 8 en som 9. Het product is 8 (het losse getal) en de som is 9 (het getal vóór x), ook al ligt 9 verder van 0 dan 8.',
          'Het product is positief en de som is positief, dus beide getallen zijn positief.',
          H(
            dt(
              [
                ['product 8', 'som'],
                ['1 en 8', '9'],
                ['2 en 4', '6'],
              ],
              'Paren getallen met product 8',
            ),
          ),
          'Dus 1 en 8, want 1*8 = 8 en 1 + 8 = 9.',
          'x^2 + 9x + 8 = (x + 1)(x + 8)',
        ],
      },
      watch: T(
        'Staat er alleen x, dan is b = 1. Bij x^2 + x - 12 zoek je dus twee getallen met product -12 en som 1.',
      ),
    },
  ],
};
