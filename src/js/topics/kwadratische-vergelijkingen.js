// Onderwerp: Kwadratische vergelijkingen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { nz, pick, coin, gcd, Q, qv, qSub, qMul, qDiv, near, lin } from '../math.js';
import {
  orFields,
  quad,
  factors,
  byFactor,
  close,
  setTrap,
  intRoots,
  solveSteps,
  scaleText,
} from './shared.js';
import { T } from '../typeset.js';

// Meestal x, soms een andere letter, zoals in het boek.
const letter = () => (coin() || coin() ? 'x' : pick(['a', 'p', 't']));
// Een melding na een valkuil is gewone tekst, dus met een echt minteken.
const minus = (s) => s.replace(/-/g, '−');
// Twee verschillende oplossingen, niet tegengesteld, zodat de term met x niet wegvalt. Met zero mag
// er een 0 bij zijn.
function roots(max = 60, zero = false) {
  let p, q;
  do {
    p = zero && coin() && coin() ? 0 : nz(-9, 9);
    q = nz(-9, 9);
  } while (p === q || p === -q || Math.abs(p * q) > max);
  return [p, q];
}
// x² + bx + c met deze oplossingen, als breuken, en de factoren [m, n] voor mx + n.
const normal = ([p, q]) => [1, -(p + q), p * q].map((x) => Q(x));
const factorsOf = (rs) => rs.map((r) => [1, -r]);
const Z = [0, 0, 0].map((x) => Q(x));
// Eén term als tekst, zoals -6x of 8. i is de plek in [a, b, c].
const term = (c, i, v) =>
  quad(
    [0, 1, 2].map((j) => (j === i ? c : 0)),
    undefined,
    v,
  );
// De waarde van ax² + bx + c bij x = s.
const at = (abc, s) => abc.map(qv).reduce((t, c) => t * s + c, 0);

// Maakt de vraag bij een vergelijking die je met het werkschema oplost.
// L = R is de vergelijking na het wegwerken van haakjes, als [a, b, c]. L − R = k · N, met N de
// vorm met x² (of ax² bij de factor x) en fs de factoren van N. start zijn de stappen tot en met
// L = R. orig rekent links min rechts uit in de vergelijking zoals die in de vraag staat.
function solve({
  v,
  text,
  L,
  R,
  k = Q(1),
  fs,
  start = [],
  direct = false,
  orig,
  hint,
  traps = [],
}) {
  fs = [...fs].sort(byFactor);
  const LR = L.map((c, i) => qSub(c, R[i])),
    N = LR.map((c) => qDiv(c, k)),
    sols = fs.map(([m, n]) => Q(-n, m)),
    moved = [0, 1, 2].filter((i) => qv(R[i])),
    steps = [text, ...start];
  if (moved.length) {
    const ts = moved.map((i) => term(R[i], i, v)),
      back = moved.map((i) => term(qMul(R[i], -1), i, v));
    steps.push(
      `Breng ${ts.join(' en ')} naar het linkerlid. Daarbij verandert ${ts.map((t, j) => `${t} in ${back[j]}`).join(' en ')}.`,
      `${quad(LR, undefined, v)} = 0`,
    );
  }
  if (qv(k) !== 1) steps.push(scaleText(k), `${quad(N, undefined, v)} = 0`);
  steps.push(...solveSteps(fs, v).slice(direct ? 1 : 0));

  // De valkuilen. Elke valkuil hoort bij andere getallen, anders zegt de tweede nooit iets.
  const all = [],
    add = (t) => t && !all.some((u) => u.f(t.wrong)) && all.push(t),
    named = fs.find(([m, n]) => m === 1 && n);
  add(
    trap(
      'teken-omgedraaid',
      sols.map((s) => -qv(s)),
      sols,
      named
        ? `Let op het teken: ${lin(1, named[1], v)} = 0 geeft ${v} = ${-named[1]}, want ${-named[1]} ${named[1] < 0 ? '-' : '+'} ${Math.abs(named[1])} = 0.`
        : `Let op het teken van je oplossingen. Vul ze in om te controleren.`,
    ),
  );
  // Is een oplossing 0, dan raakt wie door x deelt die kwijt.
  const r = sols.map(qv).find((x) => x !== 0);
  if (sols.some((x) => qv(x) === 0))
    add({
      id: 'nul-vergeten',
      f: (x) => !x.some((y) => near(y, 0)) && x.some((y) => close(y, r)),
      m: `Je mist de oplossing ${v} = 0. Deel niet door ${v}, want dan raak je die kwijt. Haal ${v} buiten haakjes.`,
      wrong: [r, r],
    });
  for (const t of traps) add(t);
  if (moved.length) {
    const t = term(R[moved[0]], moved[0], v);
    add(
      trap(
        'teken-bij-overbrengen',
        intRoots(L.map((c, i) => qv(c) + qv(R[i]))),
        sols,
        `Let op het teken bij het overbrengen. Breng je een term naar het linkerlid, dan krijgt die het andere teken: ${t} wordt ${term(qMul(R[moved[0]], -1), moved[0], v)}.`,
      ),
    );
  }
  return {
    q: T(`Los op: ${text}`),
    fields: orFields(sols, { xn: v }),
    hint,
    steps,
    traps: all.map(({ id, f, m }) => ({ id, f, m: minus(m) })),
    v: () => {
      // De factoren uitgewerkt geven N, en k · N is L − R.
      const [[a, b], [c, e]] = fs,
        expanded = [a * c, a * e + b * c, b * e];
      return (
        expanded.every((x, i) => near(x * qv(k), qv(LR[i]))) &&
        qv(LR[0]) !== 0 &&
        !near(qv(sols[0]), qv(sols[1])) &&
        // Elke oplossing ingevuld in de vergelijking zoals die in de vraag staat.
        sols.every((s) => near(orig(qv(s)), 0))
      );
    },
  };
}
// Een valkuil die ook weet bij welke getallen hij hoort, zodat solve dubbele kan overslaan.
const trap = (id, wrong, right, m) => {
  const t = setTrap(id, wrong, right, m);
  return t && { ...t, wrong: wrong.map(qv) };
};

function s33zero() {
  const v = letter(),
    rs = roots(),
    N = normal(rs),
    [, B, C] = N.map(qv);
  return solve({
    v,
    text: `${quad(N, undefined, v)} = 0`,
    L: N,
    R: Z,
    fs: factorsOf(rs),
    orig: (s) => at(N, s),
    hint: T(
      `Ontbind het linkerlid: zoek twee getallen met product ${C} en som ${B}. Gebruik daarna A*B = 0 geeft A = 0 ∨ B = 0.`,
    ),
  });
}

// Zet L − R = LR om in een vergelijking met termen aan beide kanten.
// cx: de term met x staat rechts. c: het getal staat rechts. bc: allebei. mix: rechts staan een
// term met x en een getal die links ook voorkomen.
function split(LR, kind) {
  const [A, B, C] = LR,
    neg = (c) => qMul(c, -1);
  if (kind === 'cx')
    return [
      [A, Q(0), C],
      [Q(0), neg(B), Q(0)],
    ];
  if (kind === 'c')
    return [
      [A, B, Q(0)],
      [Q(0), Q(0), neg(C)],
    ];
  if (kind === 'bc')
    return [
      [A, Q(0), Q(0)],
      [Q(0), neg(B), neg(C)],
    ];
  const R = [Q(0), Q(nz(-9, 9)), Q(nz(-9, 9))];
  return [LR.map((c, i) => qSub(c, neg(R[i]))), R];
}
const equals = (L, R, v) => `${quad(L, undefined, v)} = ${quad(R, undefined, v) || 0}`;

function s33move() {
  const v = letter();
  if (coin() && coin()) {
    // ax² = bx, of ax² + kx = mx. Dan is x = 0 een oplossing.
    let a, b;
    do {
      a = pick([1, 1, 2, 3, 4, 5]);
      b = nz(-12, 12);
    } while (gcd(a, b) !== 1);
    // Soms staat er links ook een term met x, zoals a² − a = 2a.
    const k = coin() ? 0 : nz(-6, 6);
    if (k + b === 0) return s33move();
    const L = [a, k, 0].map((x) => Q(x)),
      R = [0, k + b, 0].map((x) => Q(x));
    return solve({
      v,
      text: equals(L, R, v),
      L,
      R,
      fs: [
        [1, 0],
        [a, -b],
      ],
      orig: (s) => at(L, s) - at(R, s),
      hint: T(`Maak het rechterlid 0 en haal ${v} buiten haakjes. Deel niet door ${v}.`),
    });
  }
  const rs = roots(48),
    N = normal(rs),
    [L, R] = split(N, pick(['cx', 'c', 'bc', 'mix']));
  return solve({
    v,
    text: equals(L, R, v),
    L,
    R,
    fs: factorsOf(rs),
    orig: (s) => at(L, s) - at(R, s),
    hint: T('Maak eerst het rechterlid 0. Ontbind daarna het linkerlid in factoren.'),
  });
}

// Eén poging voor een vergelijking met haakjes van deze soort. Geeft null als de getallen niet
// mooi uitkomen, en dan probeert s33brackets het opnieuw met dezelfde soort.
function bracketTry(kind, v) {
  const rs = kind === 'xk=mx' ? roots(48, true) : roots(48),
    N = normal(rs),
    [, B, C] = N.map(qv),
    x = (k) => `${v}(${lin(1, k, v)})`,
    direct = 'Het rechterlid is al 0. Werk de haakjes dus niet weg.',
    zeroHint = T('Het rechterlid is al 0. Gebruik meteen A*B = 0 geeft A = 0 ∨ B = 0.'),
    hint = T('Werk eerst de haakjes weg. Maak daarna het rechterlid 0 en ontbind het linkerlid.'),
    haakjes = (wrong) =>
      trap(
        'haakjes-direct',
        wrong,
        rs,
        'A · B = 0 geeft A = 0 ∨ B = 0, maar dat werkt alleen als het rechterlid 0 is. Werk eerst de haakjes weg en maak het rechterlid 0.',
      );
  if (kind === 'xk=n') {
    // x(x + k) = n
    const n = -C;
    return solve({
      v,
      text: `${x(B)} = ${n}`,
      start: [`${quad([1, B, 0], undefined, v)} = ${n}`],
      L: [1, B, 0].map((c) => Q(c)),
      R: [0, 0, n].map((c) => Q(c)),
      fs: factorsOf(rs),
      orig: (s) => s * (s + B) - n,
      hint,
      traps: [haakjes([n, n - B])],
    });
  }
  if (kind === 'xk=mx') {
    // x(x + k) = mx + n. Bij n = 0 is x = 0 een oplossing.
    const m = nz(-6, 6),
      k = B + m,
      n = -C;
    if (!k) return null;
    const R = [0, m, n].map((c) => Q(c));
    return solve({
      v,
      text: `${x(k)} = ${quad(R, undefined, v)}`,
      start: [`${quad([1, k, 0], undefined, v)} = ${quad(R, undefined, v)}`],
      L: [1, k, 0].map((c) => Q(c)),
      R,
      fs: factorsOf(rs),
      orig: (s) => s * (s + k) - (m * s + n),
      hint,
    });
  }
  if (kind === 'xk=0' || kind === 'rs=0') {
    // Het rechterlid is al 0: x(x + k) = 0, of (x + r)(x + s) = 0, soms met 2x of 3x.
    const k = nz(-9, 9),
      m = pick([2, 3, 4, 5]),
      fs =
        kind === 'xk=0'
          ? [
              [1, 0],
              [1, k],
            ]
          : coin()
            ? factorsOf(rs)
            : [
                [1, -rs[0]],
                [m, nz(-9, 9)],
              ];
    if (gcd(fs[1][0], fs[1][1]) !== 1 || near(-fs[0][1] / fs[0][0], -fs[1][1] / fs[1][0]))
      return null;
    const [[a, b], [c, e]] = fs,
      LR = [a * c, a * e + b * c, b * e].map((t) => Q(t));
    return solve({
      v,
      text: `${factors(fs, v)} = 0`,
      start: [direct],
      direct: true,
      L: LR,
      R: Z,
      fs,
      orig: (s) => (a * s + b) * (c * s + e),
      hint: zeroHint,
    });
  }
  if (kind === 'rs=n') {
    // (x + r)(x + s) = n
    const r = nz(-9, 9),
      s = B - r,
      n = r * s - C;
    if (!s || r === s || !n || Math.abs(n) > 40) return null;
    const fs = [
        [1, r],
        [1, s],
      ].sort(byFactor),
      [p, q] = fs.map((f) => f[1]),
      t = (c) => `${c < 0 ? '-' : '+'} ${Math.abs(c) === 1 ? '' : Math.abs(c)}${v}`;
    return solve({
      v,
      text: `${factors(fs, v)} = ${n}`,
      start: [
        `${v}^2 ${t(q)} ${t(p)} ${p * q < 0 ? '-' : '+'} ${Math.abs(p * q)} = ${n}`,
        `${quad([1, B, r * s], undefined, v)} = ${n}`,
      ],
      L: [1, B, r * s].map((c) => Q(c)),
      R: [0, 0, n].map((c) => Q(c)),
      fs: factorsOf(rs),
      orig: (y) => (y + r) * (y + s) - n,
      hint,
      traps: [haakjes([n - r, n - s])],
    });
  }
  // x² = m(x + n)
  const m = -B,
    n = -C / m;
  if (!Number.isInteger(n) || !n || Math.abs(m) === 1) return null;
  const R = [0, m, m * n].map((c) => Q(c));
  return solve({
    v,
    text: `${v}^2 = ${m}(${lin(1, n, v)})`,
    start: [`${v}^2 = ${quad(R, undefined, v)}`],
    L: [1, 0, 0].map((c) => Q(c)),
    R,
    fs: factorsOf(rs),
    orig: (s) => s * s - m * (s + n),
    hint,
  });
}

function s33brackets() {
  const v = letter(),
    kind = pick(['xk=n', 'xk=n', 'xk=mx', 'xk=0', 'rs=0', 'rs=n', 'x2=m']);
  let q;
  do q = bracketTry(kind, v);
  while (!q);
  return q;
}

// Het getal voor x², als het geen 1 is: delen door een geheel getal, of vermenigvuldigen bij een
// breuk of bij −1.
const SCALES = [2, 3, 4, 5, -1, -1, -2, -3, -5, [1, 2], [1, 3], [1, 4], [-1, 2], [-1, 3]];
function s33scale() {
  const v = letter(),
    s = pick(SCALES),
    k = Array.isArray(s) ? Q(s[0], s[1]) : Q(s);
  let rs, N;
  do {
    rs = roots(40);
    N = normal(rs);
  } while (
    // Bij een breuk komen de andere getallen mooi uit, en bij delen worden ze niet te groot.
    N.some((c, i) => (i && qMul(c, k).d !== 1) || Math.abs(qv(c) * qv(k)) > 60)
  );
  const LR = N.map((c) => qMul(c, k)),
    kind = coin() ? null : pick(['cx', 'c', 'bc', 'mix']);
  let L, R;
  do [L, R] = kind ? split(LR, kind) : [LR, Z];
  while ([...L, ...R].some((c) => Math.abs(qv(c)) > 60));
  // Alleen de term met x² gedeeld of vermenigvuldigd.
  const half = intRoots([1, qv(LR[1]), qv(LR[2])]);
  return solve({
    v,
    text: equals(L, R, v),
    L,
    R,
    k,
    fs: factorsOf(rs),
    orig: (x) => at(L, x) - at(R, x),
    hint: T(
      `${qv(R[1]) || qv(R[2]) ? 'Maak eerst het rechterlid 0. ' : ''}${scaleText(k).replace('.', '')}, zodat er ${v}^2 staat. Ontbind daarna het linkerlid.`,
    ),
    traps: [
      trap(
        'niet-alle-termen',
        half,
        rs,
        `${scaleText(k).replace('.', '')}, niet alleen de term met ${v}².`,
      ),
    ],
  });
}

const NAMES = ['f', 'g', 'h'];
function s33value() {
  const n = pick(NAMES),
    a = pick([1, 1, 1, -1, 2, -2]);
  let rs, f, c;
  do {
    rs = roots(40, coin());
    c = nz(-12, 12);
    f = normal(rs).map((t, i) => Q(qv(t) * a + (i === 2 ? c : 0)));
  } while (Math.abs(qv(f[2])) > 40 || Math.abs(qv(f[1])) > 20);
  const R = [0, 0, c].map((t) => Q(t)),
    q = solve({
      v: 'x',
      text: `${quad(f)} = ${c}`,
      L: f,
      R,
      k: Q(a),
      fs: factorsOf(rs),
      orig: (x) => at(f, x) - c,
      hint: T(`Los de vergelijking ${n}(x) = ${c} op. Maak eerst het rechterlid 0.`),
      traps: [
        trap(
          'rechterlid-niet-nul',
          intRoots(f),
          rs,
          `Je hebt ${n}(x) = 0 opgelost. Maak eerst het rechterlid 0: trek aan beide kanten ${c} af.`,
        ),
      ],
    });
  q.steps[0] = `${n}(x) = ${c} geeft ${q.steps[0]}`;
  return {
    ...q,
    q: T(`Gegeven is de functie ${n}(x) = ${quad(f)}. Voor welke x is ${n}(x) = ${c}?`),
  };
}
export default {
  slug: 'kwadratische-vergelijkingen',
  title: 'Kwadratische vergelijkingen',
  intro:
    'In een kwadratische vergelijking staat een kwadraat, zoals in x^2 - 3x = 10. Je lost die op met een werkschema: maak het rechterlid 0, ontbind in factoren en gebruik dat een product alleen 0 is als een van de factoren 0 is.',
  description:
    'Kwadratische vergelijkingen oplossen oefenen met ontbinden in factoren, zoals x² − 3x = 10. Havo 3, gratis met uitleg, hints en uitwerkingen.',
  videos: {
    menno: [
      ['Kwadratische vergelijkingen oplossen', 'tkapcNIaDM0'],
      ['Kwadratische vergelijkingen met haakjes', 'j_NBwD23Exk'],
      ['Kwadratische vergelijkingen vereenvoudigen', '7fl0cdLmNe4'],
    ],
  },
  skills: [
    [78, 'Rechterlid is al nul', s33zero],
    [79, 'Eerst het rechterlid 0 maken', s33move],
    [80, 'Kwadratische vergelijking met haakjes', s33brackets],
    [81, 'Eerst delen of vermenigvuldigen', s33scale],
    [82, 'Voor welke x is f(x) = c?', s33value],
  ],
  learn: [
    {
      t: 'Een product dat 0 is',
      p: [
        T(
          'Is een product 0, dan is minstens één van de factoren 0. Dus A*B = 0 geeft A = 0 ∨ B = 0. Het teken ∨ betekent of.',
        ),
        T(
          'Een kwadratische vergelijking heeft vaak twee oplossingen. Je schrijft ze op als x = -7 ∨ x = 4.',
        ),
      ],
      ex: {
        q: T('Los op: (x - 4)(x + 7) = 0'),
        steps: ['x - 4 = 0 ∨ x + 7 = 0', 'x = 4 ∨ x = -7'],
      },
      watch: T('Let op het teken: x + 7 = 0 geeft x = -7, want -7 + 7 = 0.'),
    },
    {
      t: 'Het werkschema',
      how: [
        'Maak het rechterlid 0.',
        'Ontbind het linkerlid in factoren.',
        T('Gebruik A*B = 0 geeft A = 0 ∨ B = 0.'),
      ],
      ex: {
        q: T('Los op: x^2 + 3x = 28'),
        steps: [
          'Breng 28 naar het linkerlid. Daarbij verandert 28 in -28.',
          'x^2 + 3x - 28 = 0',
          '(x - 4)(x + 7) = 0',
          'x - 4 = 0 ∨ x + 7 = 0',
          'x = 4 ∨ x = -7',
        ],
      },
      watch:
        'Breng je een term naar het andere lid, dan verandert het teken. Schrijf elke stap op een nieuwe regel.',
    },
    {
      t: 'Haal x buiten haakjes',
      p: [
        T(
          'Staat er geen getal zonder x, zoals bij 2t^2 = 7t? Maak dan het rechterlid 0 en haal de letter buiten haakjes. Eén oplossing is dan altijd 0.',
        ),
        'Een oplossing mag een breuk of een gemengd getal zijn.',
      ],
      ex: {
        q: T('Los op: 2t^2 = 7t'),
        steps: [
          'Breng 7t naar het linkerlid. Daarbij verandert 7t in -7t.',
          '2t^2 - 7t = 0',
          't(2t - 7) = 0',
          't = 0 ∨ 2t - 7 = 0',
          't = 0 ∨ 2t = 7',
          't = 0 ∨ t = {3 1/2}',
        ],
      },
      watch: T(
        'Deel niet door t. Dan blijft alleen t = {3 1/2} over, en raak je de oplossing t = 0 kwijt.',
      ),
    },
    {
      t: 'Vergelijkingen met haakjes',
      p: [
        T(
          'Is het rechterlid 0, gebruik dan meteen A*B = 0 geeft A = 0 ∨ B = 0. Werk de haakjes dan niet weg.',
        ),
        'Is het rechterlid geen 0, werk dan eerst de haakjes weg en volg daarna het werkschema.',
      ],
      ex: {
        q: T('Los op: x(x - 2) = 24'),
        steps: [
          'x^2 - 2x = 24',
          'Breng 24 naar het linkerlid. Daarbij verandert 24 in -24.',
          'x^2 - 2x - 24 = 0',
          '(x + 4)(x - 6) = 0',
          'x + 4 = 0 ∨ x - 6 = 0',
          'x = -4 ∨ x = 6',
        ],
      },
      watch: T(
        'x(x - 2) = 24 geeft niet x = 24 ∨ x - 2 = 24. Dat werkt alleen als het rechterlid 0 is.',
      ),
    },
    {
      t: 'Eerst delen of vermenigvuldigen',
      p: [
        T(
          'Staat er een ander getal dan 1 voor x^2, deel dan alle termen door dat getal. Bij een breuk zoals {1/3}x^2 vermenigvuldig je alle termen met 3, en bij -x^2 met -1.',
        ),
      ],
      ex: {
        q: T('Los op: -2x^2 - 6x + 20 = 0'),
        steps: [
          'Deel alle termen door -2.',
          'x^2 + 3x - 10 = 0',
          '(x - 2)(x + 5) = 0',
          'x - 2 = 0 ∨ x + 5 = 0',
          'x = 2 ∨ x = -5',
        ],
      },
      watch: T('Deel of vermenigvuldig álle termen, niet alleen de term met x^2.'),
    },
    {
      t: 'Voor welke x is f(x) = c?',
      p: [
        T(
          'Wil je weten voor welke x de functiewaarde gelijk is aan een getal, dan los je een vergelijking op. Bij f(x) = 4 zoek je de x waarvoor de uitkomst 4 is.',
        ),
      ],
      ex: {
        q: T('Gegeven is de functie f(x) = x^2 - x - 8. Voor welke x is f(x) = 4?'),
        steps: [
          'f(x) = 4 geeft x^2 - x - 8 = 4',
          'Breng 4 naar het linkerlid. Daarbij verandert 4 in -4.',
          'x^2 - x - 12 = 0',
          '(x + 3)(x - 4) = 0',
          'x + 3 = 0 ∨ x - 4 = 0',
          'x = -3 ∨ x = 4',
        ],
      },
    },
  ],
};
