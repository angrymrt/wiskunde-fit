// Paragraaf 1.4: Lineaire ongelijkheden. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { graph } from '../figures.js';
import { ri, nz, pick, Q, near, lin, sg } from '../math.js';
import { F } from './shared.js';
import { T } from '../typeset.js';

const SIG = ['<', '>', '≤', '≥'];
const flip = { '<': '>', '>': '<', '≤': '≥', '≥': '≤' };
const signF = (a) => ({ sel: SIG, a, pre: 'x' });
function ineqOut(sign, k) {
  return [signF(sign), F('', k)];
}
const ineqTrap = (sign, k) => [
  {
    f: (v) => near(v[1], k) && v[0] !== sign,
    m: 'Het getal klopt. Kijk nog eens naar het teken: deel je door een negatief getal, dan klap je het teken om.',
  },
];
function s14basic() {
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
        ? 'Los op zoals een vergelijking. Deel je door een negatief getal? Klap dan het teken om.'
        : 'Los op zoals een vergelijking: termen met x links, getallen rechts.',
    steps: [
      `${lin(a, b)} ${s0} ${lin(c, dd)}`,
      `${lin(co, b)} ${s0} ${dd}`,
      `${lin(co, 0)} ${s0} ${dd - b}`,
      co < 0
        ? `Delen door ${co}, een negatief getal, dus het teken klapt om.`
        : `Delen door ${co}, het teken blijft hetzelfde.`,
      `x ${fin} ${k}`,
    ],
    traps: ineqTrap(fin, k),
    v: () => {
      const t = (x) => {
          const l = a * x + b,
            r = c * x + dd;
          return { '<': l < r, '>': l > r, '≤': l <= r, '≥': l >= r }[s0];
        },
        u = (x) => ({ '<': x < k, '>': x > k, '≤': x <= k, '≥': x >= k })[fin];
      return [k - 1, k, k + 1].every((x) => t(x) === u(x));
    },
  };
}
function s14br() {
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
      hint: 'Werk eerst de haakjes weg en los daarna op. Let op het teken als je door een negatief getal deelt.',
      steps: [
        `${lin(p, p * q)} ${s0} ${lin(r, dd)}`,
        `${lin(co, 0)} ${s0} ${dd - p * q}`,
        co < 0
          ? `Delen door ${co}, dus het teken klapt om.`
          : `Delen door ${co}, het teken blijft hetzelfde.`,
        `x ${fin} ${k}`,
      ],
      traps: ineqTrap(fin, k),
      v: () => near(p * (k + q), r * k + dd),
    };
  }
  return s14basic();
}
function s14gr() {
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
    strict = s0 === '<' || s0 === '>',
    up = s0 === '>' || s0 === '≥'; /* links groter dan rechts: l boven m */
  const right = up === grow,
    fin = right ? (strict ? '>' : '≥') : strict ? '<' : '≤';
  return {
    q: T(
      `In de figuur staan de lijnen l: y = ${lin(Q(a1 * 2, 2), Q(b1 * 2, 2))} en m: y = ${lin(Q(a2 * 2, 2), Q(b2 * 2, 2))}. Los met de grafieken op: ${lin(Q(a1 * 2, 2), Q(b1 * 2, 2))} ${s0} ${lin(Q(a2 * 2, 2), Q(b2 * 2, 2))}`,
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
      `Dus x ${fin} ${xs}.`,
    ],
    traps: [
      {
        f: (v) => near(v[1], xs) && v[0] !== fin,
        m: 'Het getal klopt. Kijk aan welke kant van het snijpunt de juiste lijn hoger of lager ligt, en of het snijpunt meedoet.',
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

export default {
  id: '1.4',
  ch: 1,
  num: '1.4',
  title: 'Lineaire ongelijkheden',
  core: false,
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
    ['Ongelijkheid oplossen', s14basic],
    ['Ongelijkheid met haakjes', s14br],
    ['Oplossen met grafieken', s14gr],
  ],
  learn: [
    {
      t: 'De tekens',
      p: [
        T(
          'x < 3 betekent kleiner dan 3. x ≤ 3 betekent kleiner dan of gelijk aan 3. Bij > en ≥ gaat het om groter dan.',
        ),
      ],
    },
    {
      t: 'Zonder grafiek',
      p: ['Los de ongelijkheid op zoals een vergelijking.'],
      watch: T(
        'Deel of vermenigvuldig je met een negatief getal? Dan klapt het teken om: -2x > 6 wordt x < -3.',
      ),
      ex: {
        q: T('2x + 1 > 5x - 8'),
        steps: ['-3x + 1 > -8', '-3x > -9', 'Delen door -3, dus het teken klapt om.', 'x < 3'],
      },
    },
    {
      t: 'Met grafieken',
      p: [
        'Zoek het snijpunt van de twee lijnen. Kijk daarna waar de ene lijn boven of onder de andere ligt. Bij ≤ en ≥ hoort het snijpunt er ook bij.',
      ],
    },
  ],
};
