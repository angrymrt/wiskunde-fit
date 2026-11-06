// Paragraaf 1.5: Functies. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { ri, nz, pick, coin, Q, qv, near, d, fr, lin } from '../math.js';
import { F, plug } from './shared.js';
import { T } from '../typeset.js';

function s15value() {
  const g = pick('fgh'),
    a = pick([-5, -4, -3, -2, 2, 3, 4, 5]),
    b = nz(-12, 12),
    x = nz(-8, 8),
    y = a * x + b;
  return {
    q: T(`Gegeven is de functie ${g}(x) = ${lin(a, b)}. Bereken ${g}(${x}).`),
    fields: [F(`${g}(${x}) =`, y)],
    hint: T(`${g}(${x}) betekent: vul x = ${x} in.`),
    steps: [`${g}(${x}) = ${plug(a, x, b)} = ${y}`],
    v: () => a * x + b === y,
  };
}
function s15orig() {
  const g = pick('fgh'),
    a = pick([-5, -4, -3, -2, 2, 3, 4, 5]),
    b = nz(-12, 12),
    p = nz(-8, 8),
    y = a * p + b;
  return {
    q: T(`Gegeven is de functie ${g}(x) = ${lin(a, b)}. Bereken p als ${g}(p) = ${y}.`),
    fields: [F('p =', p)],
    hint: 'Stel de formule gelijk aan het gegeven getal en los op.',
    steps: [`${lin(a, b, 'p')} = ${y}`, `${a}p = ${y - b}`, `p = ${p}`],
    traps: [
      {
        f: (v) => near(v[0], a * y + b),
        m: 'Je hebt het getal in de functie ingevuld. Hier is de uitkomst juist gegeven en zoek je wat je moet invullen.',
      },
    ],
    v: () => a * p + b === y,
  };
}
function s15axes() {
  const g = pick('fgh'),
    a = pick([-6, -4, -3, -2, 2, 3, 4, 5, 6]),
    z = coin() ? nz(-6, 6) : null,
    b = z !== null ? -a * z : nz(-12, 12),
    xs = Q(-b, a);
  if (b === 0) return s15axes();
  return {
    q: T(
      `Bereken de snijpunten van de grafiek van ${g}(x) = ${lin(a, b)} met de assen. Vul de ontbrekende coördinaten in.`,
    ),
    fields: [
      { pre: 'x-as: (', a: qv(xs), post: ', 0)' },
      { pre: 'y-as: (0,', a: b, post: ')' },
    ],
    hint: T(`Snijpunt met de x-as: ${g}(x) = 0. Snijpunt met de y-as: x = 0.`),
    steps: [
      `${g}(x) = 0 geeft ${lin(a, b)} = 0`,
      `${a}x = ${-b}`,
      `x = ${fr(xs)}, dus het snijpunt met de x-as is (${fr(xs)}, 0).`,
      `x = 0 geeft y = ${b}, dus het snijpunt met de y-as is (0, ${b}).`,
    ],
    traps: [
      {
        f: (v) => near(v[0], b) && near(v[1], qv(xs)),
        m: 'Je hebt de twee omgewisseld. Op de x-as is y gelijk aan 0, op de y-as is x gelijk aan 0.',
      },
    ],
    v: () => near(a * qv(xs) + b, 0),
  };
}
function s15cut() {
  const a = nz(-5, 5);
  let c;
  do {
    c = nz(-5, 5);
  } while (c === a);
  const x = nz(-7, 7),
    y = ri(-12, 12),
    b = y - a * x,
    e = y - c * x;
  return {
    q: T(
      `Bereken de coördinaten van het snijpunt van de grafieken van f(x) = ${lin(a, b)} en g(x) = ${lin(c, e)}.`,
    ),
    fields: [
      { pre: '(', a: x, post: ',' },
      { pre: '', a: y, post: ')' },
    ],
    hint: T(`Los op: f(x) = g(x). Vul de gevonden x in om y te krijgen.`),
    steps: [
      `f(x) = g(x) geeft ${lin(a, b)} = ${lin(c, e)}`,
      `${lin(a - c, 0)} = ${e - b}`,
      `x = ${x}`,
      `f(${x}) = ${plug(a, x, b)} = ${y}`,
      `Het snijpunt is (${x}, ${y}).`,
    ],
    v: () => a * x + b === y && c * x + e === y,
  };
}
function s15ab() {
  const a = pick([-4, -3, -2, 2, 3, 4, 0.5, 1.5]),
    aq = Q(a * 2, 2),
    p = ri(-3, 3) * 2;
  let r;
  do {
    r = ri(-3, 5) * 2;
  } while (r === p);
  const b = nz(-9, 9),
    fp = a * p + b,
    fr2 = a * r + b;
  return {
    q: T(
      `Van de lineaire functie f(x) = ax + b is gegeven: f(${p}) = ${d(fp)} en f(${r}) = ${d(fr2)}. Bereken a en b.`,
    ),
    fields: [F('a =', aq), F('b =', b)],
    hint: T(
      `De grafiek gaat door (${p}, ${d(fp)}) en (${r}, ${d(fr2)}). Bereken a met verschil in y gedeeld door verschil in x.`,
    ),
    steps: [
      `a = {${d(fr2)} - ${fp < 0 ? '-' + d(-fp) : d(fp)}/${r} - ${p < 0 ? '-' + -p : p}} = {${d(fr2 - fp)}/${r - p}} = ${fr(aq)}`,
      `f(x) = ${lin(aq, 0)} + b en f(${p}) = ${d(fp)} geeft ${fr(aq)}*${p} + b = ${d(fp)}`,
      `b = ${b}`,
      `Dus f(x) = ${lin(aq, b)}.`,
    ],
    v: () => near(a * p + b, fp) && near(a * r + b, fr2),
  };
}

export default {
  id: '1.5',
  ch: 1,
  num: '1.5',
  title: 'Functies',
  core: false,
  videos: {
    menno: [
      ['Het functievoorschrift', 'AHmbhTZX_7w'],
      ['De functie f(x) = ax + b', 'BAMvDpmp-AM'],
      ['Snijpunten met de x-as en de y-as', 'tdHnhUP7sgQ'],
      ['Snijpunten van grafieken van functies', 'aE6hAgajF0A'],
    ],
    bob: [
      ['Functie en functievoorschrift', 'bTmZ16Xc0QI'],
      ['Het functievoorschrift', 'tKVU0t9LzKg'],
      ['De functie f(x) = ax + b', '8S-LnzejdhE'],
      ['Snijpunten met de x-as en de y-as', '2NIdNlJIDrM'],
      ['Snijpunten van grafieken van functies', 'Q4JkCIf48nQ'],
    ],
  },
  skills: [
    ['Functiewaarde', s15value],
    ['Terugrekenen', s15orig],
    ['Snijpunten met de assen', s15axes],
    ['Snijpunt van twee grafieken', s15cut],
    ['f(x) = ax + b opstellen', s15ab],
  ],
  learn: [
    {
      t: 'Wat is f(x)?',
      p: [
        T(
          'Een functie geeft bij elke x precies één uitkomst. f(x) = 2x + 3 is een functievoorschrift. f(4) betekent: vul x = 4 in, dus f(4) = 2*4 + 3 = 11.',
        ),
      ],
    },
    {
      t: 'Snijpunten met de assen',
      how: [
        T('Snijpunt met de x-as: los f(x) = 0 op. Het punt is (x, 0).'),
        T('Snijpunt met de y-as: vul x = 0 in. Het punt is (0, f(0)).'),
      ],
      ex: {
        q: T('f(x) = 2x - 6'),
        steps: ['2x - 6 = 0 geeft x = 3, dus (3, 0).', 'f(0) = -6, dus (0, -6).'],
      },
    },
    {
      t: 'Snijpunt van twee grafieken',
      how: [
        T('Los f(x) = g(x) op. Dat geeft x.'),
        'Vul x in een van de formules in. Dat geeft y.',
        'Schrijf het snijpunt als (x, y).',
      ],
    },
  ],
};
