// Paragraaf 1.5: Lineaire ongelijkheden. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { graph } from '../figures.js';
import { ri, nz, pick, Q, near, lin, dlin, sg, d } from '../math.js';
import { F, euro } from './shared.js';
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
// Een schets zonder ruitjes: het snijpunt bereken je eerst, en daarna lees je af welke kant het is.
function s15sketch() {
  let a1, a2, b1, b2, xs;
  do {
    a1 = pick([-3, -2, -1, 1, 2, 3]);
    a2 = pick([-3, -2, -1, 1, 2, 3]);
    b1 = nz(-6, 8);
    b2 = nz(-6, 8);
    xs = (b2 - b1) / (a1 - a2);
    // Lijnen die bijna evenwijdig lopen, zijn in een schets niet uit elkaar te houden.
  } while (Math.abs(a1 - a2) < 2 || !xs || Math.abs(xs) > 5 || !Number.isInteger(xs * 2));
  const ys = a1 * xs + b1,
    co = a1 - a2,
    s0 = pick(SIG),
    // Rechts van S kijken of de ongelijkheid klopt: dan is de oplossing x > ...
    right = holds(a1 * (xs + 1) + b1, s0, a2 * (xs + 1) + b2),
    fin = right ? '>' : '<',
    up = s0 === '>',
    xq = Q(xs * 2, 2),
    side = xs > 0 ? 1 : -1;
  return {
    q: T(
      `In de figuur staat een schets van de lijnen l: y = ${lin(a1, b1)} en m: y = ${lin(a2, b2)}. Ze snijden elkaar in het punt S. Bereken de x-coördinaat van S. Los daarna op: ${lin(a1, b1)} ${s0} ${lin(a2, b2)}`,
    ),
    fig: graph({
      sketch: true,
      label: 'Schets van twee lijnen die elkaar snijden in het punt S',
      xr: [Math.floor(Math.min(xs, 0)) - 3, Math.ceil(Math.max(xs, 0)) + 3],
      yr: [Math.floor(Math.min(ys, 0)) - 3, Math.ceil(Math.max(ys, 0)) + 3],
      u: 22,
      // De namen staan aan de kant van S die van de y-as af ligt.
      lines: [
        { a: a1, b: b1, name: 'l', at: xs + side * Math.min(2, 2.5 / Math.abs(a1)) },
        { a: a2, b: b2, name: 'm', at: xs + side * Math.min(2, 2.5 / Math.abs(a2)) },
      ],
      // De letter S komt op de plek waar geen van beide lijnen loopt.
      pts: [
        {
          x: xs,
          y: ys,
          label: 'S',
          off: a1 > 0 && a2 > 0 ? [-16, -6] : a1 < 0 && a2 < 0 ? [8, -6] : [-4, -11],
        },
      ],
    }),
    fields: [F('x-coördinaat van S:', xq), signF(fin), F('', xq)],
    hint: T(
      `Stel de formules aan elkaar gelijk: ${lin(a1, b1)} = ${lin(a2, b2)}. Kijk daarna in de schets aan welke kant van S lijn l ${up ? 'boven' : 'onder'} lijn m ligt.`,
    ),
    steps: [
      `${lin(a1, b1)} = ${lin(a2, b2)}`,
      `${lin(co, 0)} = ${b2 - b1}`,
      `x = ${d(xs)}`,
      `Lijn l ligt ${up ? 'boven' : 'onder'} lijn m ${right ? 'rechts' : 'links'} van S.`,
      `Dus x ${fin} ${d(xs)}.`,
    ],
    traps: [
      {
        f: (v) => !near(v[0], xs),
        m: 'De x-coördinaat van S klopt nog niet. Stel de twee formules aan elkaar gelijk en los de vergelijking op.',
      },
      {
        f: (v) => near(v[2], xs) && v[1] !== fin,
        m: 'De getallen kloppen. Kijk nog eens aan welke kant van S de juiste lijn hoger of lager ligt.',
      },
    ],
    v: () => near(a1 * xs + b1, a2 * xs + b2) && fin === (co < 0 ? flip[s0] : s0),
  };
}
// Elk verhaal levert twee formules en vraagt wanneer de ene groter of kleiner is dan de andere.
const STORIES = [
  (k) => {
    const a = pick([3, 4, 5, 6]),
      da = pick([2, 3, 4, 5]),
      b = pick([10, 15, 20, 25, 30]);
    return {
      text: `Sam heeft ${b + da * k} euro gespaard en legt daar elke week ${a} euro bij. Lina heeft ${b} euro gespaard en legt daar elke week ${a + da} euro bij. Neem x voor het aantal weken. Voor welke x heeft Lina meer gespaard dan Sam?`,
      left: ['Lina', a + da, b],
      right: ['Sam', a, b + da * k],
      s0: '>',
      end: `Dus na meer dan ${k} weken heeft Lina meer gespaard dan Sam.`,
      hint: 'Het beginbedrag staat los, en het bedrag per week staat voor x.',
    };
  },
  (k) => {
    const a = pick([2.5, 3, 3.5, 4]),
      da = pick([1, 1.5, 2, 2.5]),
      b = pick([10, 15, 20]);
    return {
      text: `Bij klimhal Boven betaal je ${b + da * k} euro inschrijfgeld en ${euro(a)} euro per bezoek. Bij klimhal Grip betaal je ${b} euro inschrijfgeld en ${euro(a + da)} euro per bezoek. Neem x voor het aantal bezoeken. Voor welke x is klimhal Boven goedkoper dan klimhal Grip?`,
      left: ['Boven', a, b + da * k],
      right: ['Grip', a + da, b],
      s0: '<',
      end: `Dus bij meer dan ${k} bezoeken is klimhal Boven goedkoper.`,
      hint: 'Het inschrijfgeld betaal je één keer, en het bedrag per bezoek staat voor x.',
    };
  },
  (k) => {
    const out = pick([2, 3, 4, 5]),
      inn = pick([1, 2, 3]),
      b = pick([20, 30, 40, 50]);
    return {
      text: `In bak A zit ${b + (out + inn) * k} liter water, en er loopt per minuut ${out} liter uit. In bak B zit ${b} liter water, en er loopt per minuut ${inn} liter bij. Neem x voor het aantal minuten. Voor welke x zit er in bak A meer water dan in bak B?`,
      left: ['Bak A', -out, b + (out + inn) * k],
      right: ['Bak B', inn, b],
      s0: '>',
      end: `Dus de eerste ${k} minuten zit er in bak A meer water dan in bak B.`,
      hint: 'De hoeveelheid aan het begin staat los. Loopt er water uit, dan is het getal voor x negatief.',
    };
  },
];
function s15story() {
  const k = pick([4, 6, 8, 10, 12]),
    st = pick(STORIES)(k),
    [ln, a1, b1] = st.left,
    [rn, a2, b2] = st.right,
    co = a1 - a2,
    rhs = b2 - b1,
    fin = co < 0 ? flip[st.s0] : st.s0;
  return {
    q: T(`${st.text} Vul de formules in en los de ongelijkheid op.`),
    compact: true,
    fields: [
      { ...F(`${ln}:`, a1, 'x +'), label: `Getal voor x bij ${ln}` },
      { ...F('', b1), label: `Vast getal bij ${ln}` },
      { ...F(`${rn}:`, a2, 'x +'), label: `Getal voor x bij ${rn}`, br: true },
      { ...F('', b2), label: `Vast getal bij ${rn}` },
      { ...signF(fin), br: true },
      { ...F('', k), label: 'Het getal in je oplossing' },
    ],
    hint: T(st.hint),
    steps: [
      `${ln}: ${dlin(a1, b1)}`,
      `${rn}: ${dlin(a2, b2)}`,
      `${dlin(a1, b1)} ${st.s0} ${dlin(a2, b2)}`,
      `${dlin(co, 0)} ${st.s0} ${d(rhs)}`,
      co < 0
        ? `Delen door ${d(co)}, dus ${st.s0} klapt om.`
        : `Delen door ${d(co)}, dus ${st.s0} klapt niet om.`,
      `x ${fin} ${k}`,
      st.end,
    ],
    traps: [
      {
        f: (v) => (near(v[0], b1) && near(v[1], a1)) || (near(v[2], b2) && near(v[3], a2)),
        m: 'Je hebt de twee getallen van een formule omgewisseld. Wat er per week, bezoek of minuut bijkomt, staat voor x.',
      },
      {
        f: (v) => near(v[0], -a1) && a1 < 0,
        m: 'Er loopt water uit, dus de hoeveelheid wordt kleiner. Dan is het getal voor x negatief.',
      },
      {
        f: (v) => near(v[5], k) && v[4] !== fin,
        m: 'Het getal klopt. Kijk nog eens naar het teken: deel je door een negatief getal, dan klap je het ongelijkheidsteken om.',
      },
    ],
    v: () =>
      [k - 1, k, k + 1].every((x) => holds(a1 * x + b1, st.s0, a2 * x + b2) === holds(x, fin, k)) &&
      near(a1 * k + b1, a2 * k + b2),
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
    ['Schets zonder ruitjes', s15sketch],
    ['Ongelijkheid uit een verhaal', s15story],
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
      t: 'Met een schets',
      p: [
        'Heb je alleen een schets zonder ruitjes, dan kun je het snijpunt niet aflezen. Bereken daarom eerst de x-coördinaat van het snijpunt door de formules aan elkaar gelijk te stellen. Daarna kijk je in de schets aan welke kant de ene lijn onder of boven de andere ligt.',
      ],
      ex: {
        q: T(
          'De lijnen l: y = 2x - 3 en m: y = -x + 3 snijden elkaar in S. Los op: 2x - 3 > -x + 3',
        ),
        steps: [
          '2x - 3 = -x + 3',
          '3x = 6',
          'x = 2',
          'Lijn l ligt boven lijn m rechts van S.',
          'Dus x > 2.',
        ],
      },
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
    {
      t: 'Een ongelijkheid opstellen',
      p: [
        'Bij een verhaal schrijf je eerst voor elke kant een formule op. Wat elke keer bijkomt, staat voor x. Wat er vanaf het begin al is, staat los. Daarna kies je het teken en los je de ongelijkheid op.',
      ],
      ex: {
        q: T(
          'Mila heeft 30 euro en spaart 5 euro per week. Daan heeft 70 euro en spaart 3 euro per week. Voor welke x heeft Mila na x weken meer dan Daan?',
        ),
        steps: [
          'Mila: 5x + 30',
          'Daan: 3x + 70',
          '5x + 30 > 3x + 70',
          '2x > 40',
          'x > 20',
          'Dus na meer dan 20 weken heeft Mila meer dan Daan.',
        ],
      },
    },
  ],
};
