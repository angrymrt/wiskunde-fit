// Paragraaf 1.5: Lineaire ongelijkheden. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { graph } from '../figures.js';
import { ri, nz, pick, Q, near, lin, dlin, sg } from '../math.js';
import { F } from './shared.js';
import { T } from '../typeset.js';

const SIG = ['<', '>'];
const flip = { '<': '>', '>': '<' };
const holds = (l, sign, r) => (sign === '<' ? l < r : l > r);
const signF = (a) => ({ sel: SIG, a, pre: 'x' });
function ineqOut(sign, k) {
  return [signF(sign), F('', k)];
}
const ineqTrap = (sign, k) => [
  {
    f: (v) => near(v[1], k) && v[0] !== sign,
    m: 'Het getal klopt. Kijk nog eens naar het teken: deel je door een negatief getal, dan klap je het ongelijkheidsteken om.',
  },
];
// De laatste stappen: delen door het getal voor x. Bij x zelf valt er niets te delen.
const divide = (co, sign, rhs, fin, k) =>
  co === 1
    ? []
    : [
        `${lin(co, 0)} ${sign} ${rhs}`,
        co < 0
          ? `Delen door ${co}, dus ${sign} klapt om.`
          : `Delen door ${co}, dus ${sign} klapt niet om.`,
        `x ${fin} ${k}`,
      ];
function s15basic() {
  let a, c;
  do {
    a = nz(-8, 8);
    c = nz(-8, 8);
  } while (a === c);
  const k = nz(-8, 8),
    b = nz(-12, 12),
    dd = (a - c) * k + b,
    s0 = pick(SIG),
    co = a - c,
    fin = co < 0 ? flip[s0] : s0;
  return {
    q: T(`Los op: ${lin(a, b)} ${s0} ${lin(c, dd)}`),
    fields: ineqOut(fin, k),
    hint:
      co < 0
        ? 'Los op zoals een vergelijking. Deel je door een negatief getal? Klap dan het ongelijkheidsteken om.'
        : 'Los op zoals een vergelijking: de term met x links, het getal rechts.',
    steps: [
      `${lin(co, b)} ${s0} ${dd}`,
      ...(co === 1 ? [`x ${fin} ${k}`] : divide(co, s0, dd - b, fin, k)),
    ],
    traps: ineqTrap(fin, k),
    v: () => [k - 1, k, k + 1].every((x) => holds(a * x + b, s0, c * x + dd) === holds(x, fin, k)),
  };
}
function s15br() {
  for (let i = 0; i < 60; i++) {
    const k = nz(-7, 7),
      p = pick([-4, -3, -2, 2, 3, 4, 5]),
      q = nz(-6, 6),
      r = nz(-7, 7);
    if (p === r) continue;
    const dd = p * (k + q) - r * k,
      s0 = pick(SIG),
      co = p - r,
      fin = co < 0 ? flip[s0] : s0;
    const pr = `${p < 0 ? '-' : ''}${Math.abs(p)}(x${sg(q)})`;
    return {
      q: T(`Los op: ${pr} ${s0} ${lin(r, dd)}`),
      fields: ineqOut(fin, k),
      hint: 'Werk eerst de haakjes weg en los daarna op. Let op het ongelijkheidsteken als je door een negatief getal deelt.',
      steps: [
        `${lin(p, p * q)} ${s0} ${lin(r, dd)}`,
        ...(co === 1 ? [`x ${fin} ${k}`] : divide(co, s0, dd - p * q, fin, k)),
      ],
      traps: ineqTrap(fin, k),
      v: () =>
        [k - 1, k, k + 1].every((x) => holds(p * (x + q), s0, r * x + dd) === holds(x, fin, k)),
    };
  }
  return s15basic();
}
function s15gr() {
  let a1, a2, xs, ys, b1, b2;
  do {
    a1 = pick([-2, -1, 1, 2, 0.5]);
    a2 = pick([-2, -1, 1, 2, -0.5]);
    xs = pick([0, 2, 2, 4]);
    ys = ri(-1, 3);
    b1 = ys - a1 * xs;
    b2 = ys - a2 * xs;
  } while (a1 === a2 || Math.abs(b1) > 6 || Math.abs(b2) > 6);
  const s0 = pick(SIG),
    grow = a1 > a2,
    up = s0 === '>'; /* links groter dan rechts: l boven m */
  const right = up === grow,
    fin = right ? '>' : '<';
  return {
    q: T(
      `In de figuur staan de lijnen l: y = ${dlin(a1, b1)} en m: y = ${dlin(a2, b2)}. Los met de grafieken op: ${dlin(a1, b1)} ${s0} ${dlin(a2, b2)}`,
    ),
    fig: graph({
      xr: [-2, 7],
      yr: [-5, 7],
      lines: [
        { a: a1, b: b1, name: 'l' },
        { a: a2, b: b2, name: 'm' },
      ],
      pts: [{ x: xs, y: ys }],
    }),
    fields: ineqOut(fin, xs),
    hint: T(
      `Zoek het snijpunt. Kijk daarna aan welke kant lijn l ${up ? 'boven' : 'onder'} lijn m ligt.`,
    ),
    steps: [
      `De lijnen snijden elkaar bij x = ${xs}.`,
      `Lijn l ligt ${up ? 'boven' : 'onder'} lijn m ${right ? 'rechts' : 'links'} van het snijpunt.`,
      `Dus x ${fin} ${xs}. Het snijpunt zelf hoort er niet bij.`,
    ],
    traps: [
      {
        f: (v) => near(v[1], xs) && v[0] !== fin,
        m: 'Het getal klopt. Kijk aan welke kant van het snijpunt de juiste lijn hoger of lager ligt.',
      },
    ],
    v: () => {
      const x = xs + (right ? 1 : -1),
        l = a1 * x + b1,
        r = a2 * x + b2;
      return near(a1 * xs + b1, a2 * xs + b2) && (up ? l > r : l < r);
    },
  };
}
function s15flip() {
  const [n, den] = pick([
      [-2, 1],
      [-3, 1],
      [-4, 1],
      [-5, 1],
      [-6, 1],
      [-1, 1],
      [3, 1],
      [4, 1],
      [-1, 2],
      [-1, 3],
      [-1, 4],
      [1, 2],
      [1, 3],
    ]),
    k = den * nz(-6, 6),
    c = (n * k) / den,
    s0 = pick(SIG),
    fin = n < 0 ? flip[s0] : s0,
    a = Q(n, den),
    how = den === 1 ? `Delen door ${n}` : `Vermenigvuldigen met ${n * den}`;
  return {
    q: T(`Los op: ${lin(a, 0)} ${s0} ${c}`),
    fields: ineqOut(fin, k),
    hint:
      den === 1
        ? 'Deel beide kanten door het getal voor x. Is dat negatief? Klap dan het ongelijkheidsteken om.'
        : 'Vermenigvuldig beide kanten zo dat er x overblijft. Doe je dat met een negatief getal? Klap dan het ongelijkheidsteken om.',
    steps: [`${how}, dus ${s0} ${n < 0 ? 'klapt om' : 'klapt niet om'}.`, `x ${fin} ${k}`],
    traps: ineqTrap(fin, k),
    v: () => [k - 1, k, k + 1].every((x) => holds(n * x, s0, c * den) === holds(x, fin, k)),
  };
}

export default {
  id: '1.5',
  ch: 1,
  num: '1.5',
  title: 'Lineaire ongelijkheden',
  videos: {
    menno: [
      ['Lineaire ongelijkheden oplossen met grafieken', '016gEKebUGM'],
      ['Lineaire ongelijkheden oplossen zonder grafieken', '5l1zGO5-6NQ'],
      ['Het omklappen van het ongelijkheidsteken', 'QoExM-o8uGs'],
      ['Lineaire ongelijkheden oplossen', 'nRI_665QMks'],
    ],
    bob: [
      ['Lineaire ongelijkheden oplossen met grafieken', '_20Rwdzb5So'],
      ['Lineaire ongelijkheden oplossen zonder grafieken', 'TG6G3qZ3BwM'],
      ['Het omklappen van het ongelijkheidsteken', '94XxGpvkLNY'],
      ['Lineaire ongelijkheden oplossen', 'WwyGUKpUMa4'],
    ],
  },
  skills: [
    ['Ongelijkheid oplossen', s15basic],
    ['Ongelijkheid met haakjes', s15br],
    ['Oplossen met grafieken', s15gr],
    ['Het teken omklappen', s15flip],
  ],
  learn: [
    {
      t: 'Met grafieken',
      p: [
        T(
          'Een ongelijkheid zoals 3x - 1 < x + 3 vraagt voor welke x de grafiek van y = 3x - 1 onder de grafiek van y = x + 3 ligt. Bij > kijk je waar de grafiek boven de andere ligt.',
        ),
        T(
          'Zoek het snijpunt en kijk aan welke kant de ene lijn onder of boven de andere ligt. Hier snijden de lijnen elkaar bij x = 2, dus het antwoord is x < 2. Elk getal kleiner dan 2 is een oplossing, maar 2 zelf niet. Daarom teken je op de x-as een pijl met een open bolletje bij 2.',
        ),
      ],
    },
    {
      t: 'Zonder grafieken',
      how: [
        'Werk de haakjes weg.',
        'Reken beide kanten zo ver mogelijk uit.',
        'Zorg dat links alleen een term met x staat en rechts alleen een getal.',
        'Deel door het getal voor x. Is dat getal negatief? Klap dan het ongelijkheidsteken om.',
      ],
      ex: {
        q: T('2x + 1 > 5x - 8'),
        steps: ['-3x + 1 > -8', '-3x > -9', 'Delen door -3, dus > klapt om.', 'x < 3'],
      },
    },
    {
      t: 'Het ongelijkheidsteken omklappen',
      p: [
        'Delen of vermenigvuldigen met een negatief getal draait de ongelijkheid om. Zo is 2 < 5 waar, maar -2 < -5 niet. Daarom verander je < in > en > in <. Dat heet omklappen.',
      ],
      watch: T(
        'Je klapt alleen om als je deelt door of vermenigvuldigt met een negatief getal. 3x < -6 geeft x < -2: hier klapt het teken niet om.',
      ),
    },
  ],
};
