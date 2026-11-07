// Paragraaf 1.6: Vergelijkingen met twee variabelen. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vaardigheden onderaan.
import { ri, nz, pick, coin, gcd, Q, qv, near, fr, lin, d, dlin } from '../math.js';
import { F, MC, drawLine, inGrid, lineTable, euro } from './shared.js';
import { T } from '../typeset.js';

const lin2 = (A, B) =>
  `${lin(A, 0, 'x')} ${B < 0 ? '-' : '+'} ${Math.abs(B) === 1 ? '' : Math.abs(B)}y`;
function s16pair() {
  const A = pick([1, 2, 3, 4, 5]),
    B = pick([-3, -2, -1, 1, 2, 3, 4]),
    x = nz(-6, 6),
    y = nz(-6, 6),
    C = A * x + B * y;
  if (coin())
    return {
      q: T(`Gegeven is de vergelijking ${lin2(A, B)} = ${C}. Bereken de oplossing met x = ${x}.`),
      fields: [F('y =', y)],
      hint: T(`Vul x = ${x} in. Dan houd je een vergelijking met alleen y over.`),
      steps: [
        `x = ${x} geeft ${A}*${x} ${B < 0 ? '-' : '+'} ${Math.abs(B)}y = ${C}`,
        `${A * x} ${B < 0 ? '-' : '+'} ${Math.abs(B)}y = ${C}`,
        `${lin(B, 0, 'y')} = ${C - A * x}`,
        `y = ${y}`,
        `Dus (${x}, ${y}).`,
      ],
      v: () => A * x + B * y === C,
    };
  return {
    q: T(`Gegeven is de vergelijking ${lin2(A, B)} = ${C}. Bereken de oplossing met y = ${y}.`),
    fields: [F('x =', x)],
    hint: T(`Vul y = ${y} in. Dan houd je een vergelijking met alleen x over.`),
    steps: [
      `y = ${y} geeft ${lin(A, 0)} ${B < 0 ? '-' : '+'} ${Math.abs(B)}*${y} = ${C}`,
      `${lin(A, B * y)} = ${C}`,
      `${lin(A, 0)} = ${C - B * y}`,
      `x = ${x}`,
      `Dus (${x}, ${y}).`,
    ],
    v: () => A * x + B * y === C,
  };
}
function s16check() {
  const A = pick([2, 3, 4, 5, 6]),
    B = pick([-5, -4, -3, -2, -1, 1, 2, 3, 4]),
    x = nz(-6, 6),
    y = nz(-6, 6),
    good = coin(),
    worth = A * x + B * y,
    C = good ? worth : worth + nz(-4, 4);
  return {
    q: T(
      `Gegeven is de vergelijking ${lin2(A, B)} = ${C}. Is het getallenpaar (${x}, ${y}) een oplossing van de vergelijking?`,
    ),
    mc: MC(good ? ['Ja', 'Nee'] : ['Nee', 'Ja'], 0),
    hint: T(`Vul x = ${x} en y = ${y} in en kijk of er ${C} uitkomt.`),
    steps: [
      `x = ${x} en y = ${y} geeft ${A}*${x} ${B < 0 ? '-' : '+'} ${Math.abs(B)}*${y} = ${worth}${good ? '' : ` ≠ ${C}`}`,
      `Dus (${x}, ${y}) is ${good ? 'een' : 'geen'} oplossing.`,
    ],
    v: () => (A * x + B * y === C) === good,
  };
}
function s16iso() {
  const A = pick([1, 2, 3, 4, 5, 6]),
    B = pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]),
    C = B * nz(-5, 6) + (coin() ? 0 : nz(-3, 3));
  const a = Q(-A, B),
    b = Q(C, B);
  return {
    q: T(`Herleid ${lin2(A, B)} = ${C} tot de vorm y = ax + b.`),
    fields: [F('a =', a), F('b =', b)],
    hint: T(
      B === 1
        ? `Breng ${lin(A, 0)} over naar het rechterlid. Daarbij verandert + in -.`
        : `Breng ${lin(A, 0)} over naar het rechterlid. Daarbij verandert + in -. Deel daarna alle termen door ${B}.`,
    ),
    steps: [
      `${lin2(A, B)} = ${C}`,
      `${lin(B, 0, 'y')} = ${lin(-A, C)}`,
      ...(B === 1 ? [] : [`y = ${lin(a, b)}`]),
    ],
    traps: [
      {
        f: (v) => near(v[0], A / B),
        m: 'Let op het teken: als je een term naar de andere kant brengt, verandert het teken.',
      },
    ],
    v: () => near(A * 1 + B * (qv(a) + qv(b)), C),
  };
}
function s16ax() {
  const A = pick([2, 3, 4, 5, 6]),
    B = pick([2, 3, 4, 5, -2, -3, -4]),
    C = A * Math.abs(B) * pick([1, 2, -1, 3]);
  const xi = Q(C, A),
    yi = Q(C, B);
  return {
    q: T(`Bereken de snijpunten van de lijn ${lin2(A, B)} = ${C} met de assen.`),
    fields: [
      { pre: 'x-as: (', a: qv(xi), post: ', 0)' },
      { pre: 'y-as: (0,', a: qv(yi), post: ')' },
    ],
    hint: 'Op de x-as is y = 0. Op de y-as is x = 0.',
    steps: [
      `y = 0 geeft ${A}x = ${C}, dus x = ${fr(xi)}. Dat geeft (${fr(xi)}, 0).`,
      `x = 0 geeft ${B}y = ${C}, dus y = ${fr(yi)}. Dat geeft (0, ${fr(yi)}).`,
    ],
    v: () => near(A * qv(xi), C) && near(B * qv(yi), C),
  };
}
function s16draw() {
  for (let i = 0; i < 200; i++) {
    const A = pick([1, 2, 3, 4, 5]),
      B = pick([-4, -3, -2, -1, 1, 2, 3, 4]);
    if (gcd(A, Math.abs(B)) > 1) continue;
    const C = A * ri(-5, 5) + B * ri(-6, 6),
      pts = [];
    for (let x = -5; x <= 5; x++) {
      const y = (C - A * x) / B + 0;
      if (Number.isInteger(y) && inGrid(x, y)) pts.push([x, y]);
    }
    if (pts.length < 2) continue;
    // Het liefst x = 0 en y = 0, want dan rekent het het makkelijkst.
    const onY = pts.find((p) => p[0] === 0),
      onX = pts.find((p) => p[1] === 0),
      p = onY || pts[0],
      q = onX && onX !== p ? onX : pts[pts.length - 1] !== p ? pts[pts.length - 1] : pts[0],
      line = (x, y) => {
        if (x === 0)
          return B === 1
            ? `x = 0 geeft y = ${y}.`
            : `x = 0 geeft ${lin(B, 0, 'y')} = ${C}, dus y = ${y}.`;
        if (y === 0)
          return A === 1
            ? `y = 0 geeft x = ${x}.`
            : `y = 0 geeft ${lin(A, 0)} = ${C}, dus x = ${x}.`;
        return `x = ${x} geeft ${A * x} ${B < 0 ? '-' : '+'} ${lin(Math.abs(B), 0, 'y')} = ${C}, dus y = ${y}.`;
      };
    return {
      q: T(
        `Teken de lijn l: ${lin2(A, B)} = ${C}. Tik in het rooster twee punten van de lijn aan, of vul de coördinaten in.`,
      ),
      ...drawLine(-A / B, C / B, p, q),
      hint: 'Maak een tabel met twee punten. Vaak is rekenen met x = 0 en y = 0 het makkelijkst. Komt er geen geheel getal uit of valt het punt buiten het rooster, kies dan een andere x.',
      steps: [
        ...(C === 0
          ? ['x = 0 en y = 0 geven allebei het punt (0, 0). Je hebt dus nog een ander punt nodig.']
          : []),
        line(...p),
        line(...q),
        ...lineTable(p, q, { a: -A / B, b: C / B, name: 'l' }),
      ],
      v: () => [p, q].every(([x, y]) => A * x + B * y === C) && (p[0] !== q[0] || p[1] !== q[1]),
    };
  }
  return s16pair();
}
// Elk verhaal levert de getallen van px + qy = r. Bij punten kan q negatief zijn.
const STORIES = [
  () => ({
    p: pick([2, 2.5, 3]),
    q: pick([1.5, 3.5, 4]),
    text: (p, q, t) =>
      `In de kantine kost een tosti ${euro(p)} euro en een smoothie ${euro(q)} euro. Yara koopt x tosti's en y smoothies en betaalt ${euro(t)} euro.`,
    ask: (x) => `Yara koopt ${x} tosti's. Hoeveel smoothies koopt Yara?`,
  }),
  () => ({
    p: pick([2, 3, 4]),
    q: pick([5, 6, 7]),
    text: (p, q, t) =>
      `Een kweker verkoopt x potten viooltjes van ${p} euro per stuk en y potten lavendel van ${q} euro per stuk. De opbrengst is ${t} euro.`,
    ask: (x) => `Er zijn ${x} potten viooltjes verkocht. Hoeveel potten lavendel zijn er verkocht?`,
  }),
  () => ({
    p: pick([3, 4, 5]),
    q: pick([-1, -2]),
    text: (p, q, t) =>
      `Bij een quiz krijg je ${p} punten voor elk goed antwoord en verlies je ${-q} ${q === -1 ? 'punt' : 'punten'} voor elk fout antwoord. Noor heeft x antwoorden goed en y antwoorden fout, en eindigt met ${t} punten.`,
    ask: (x) => `Noor heeft ${x} antwoorden goed. Hoeveel antwoorden heeft Noor fout?`,
  }),
];
function s16story() {
  const st = pick(STORIES)(),
    { p, q } = st,
    x = pick([4, 6, 8, 10, 12]),
    y = pick([2, 3, 4, 5, 6]),
    r = p * x + q * y,
    eq = `${dlin(p, 0)} ${q < 0 ? '-' : '+'} ${Math.abs(q) === 1 ? '' : d(Math.abs(q))}y`;
  return {
    q: T(
      `${st.text(p, q, r)} Stel een vergelijking op met de variabelen x en y, en gebruik de getallen uit het verhaal. ${st.ask(x)}`,
    ),
    compact: true,
    fields: [
      { ...F('', p, 'x +'), label: 'Getal voor x' },
      { ...F('', q, 'y ='), label: 'Getal voor y' },
      { ...F('', r), label: 'Getal achter het is-gelijkteken' },
      { ...F('y =', y), br: true },
    ],
    hint: T(
      `Het getal voor x is wat één keer x kost of oplevert. Hier is dat ${d(p)}, dus je schrijft ${dlin(p, 0)}. Doe dat ook voor y. Vul daarna x = ${x} in.`,
    ),
    steps: [
      `${eq} = ${d(r)}`,
      `x = ${x} geeft ${d(p * x)} ${q < 0 ? '-' : '+'} ${Math.abs(q) === 1 ? '' : d(Math.abs(q))}y = ${d(r)}`,
      `${dlin(q, 0, 'y')} = ${d(r - p * x)}`,
      `y = ${y}`,
    ],
    traps: [
      {
        f: (v) => near(v[0], q) && near(v[1], p),
        m: 'Je hebt de getallen omgewisseld. Het getal voor x hoort bij wat x telt.',
      },
      {
        f: (v) => q < 0 && near(v[1], -q),
        m: 'Voor een fout antwoord verlies je punten, dus het getal voor y is negatief.',
      },
    ],
    v: () => near((r - p * x) / q, y),
  };
}

export default {
  id: '1.6',
  ch: 1,
  num: '1.6',
  title: 'Vergelijkingen met twee variabelen',
  videos: {
    menno: [
      ['Getallenparen', 'fr2kg8fWaBU'],
      ['De vergelijking px + qy = r', 'ao0c11rk_lE'],
      ['Herleiden tot de vorm y = ax + b', 'yPUP3-Yajw8'],
    ],
    bob: [['Vergelijkingen met twee variabelen', 'yuGhiBebZfU']],
  },
  skills: [
    [32, 'Getallenparen', s16pair],
    [33, 'Herleiden tot y = ax + b', s16iso],
    [34, 'Snijpunten met de assen', s16ax],
    [35, 'Is het een oplossing?', s16check],
    [36, 'Een lijn tekenen', s16draw],
    [37, 'Vergelijking uit een verhaal', s16story],
  ],
  learn: [
    {
      t: 'Getallenparen',
      p: [
        T(
          'Een oplossing van een vergelijking met x en y is een getallenpaar (x, y) waarvoor de vergelijking klopt. Bij 4x + 3y = 12 is (-3, 8) een oplossing, want 4*-3 + 3*8 = 12. Maar (8, -3) is geen oplossing, want 4*8 + 3*-3 = 23 ≠ 12.',
        ),
      ],
    },
    {
      t: 'Een vergelijking opstellen',
      p: [
        'Bij een verhaal staat x voor het aantal van het ene en y voor het aantal van het andere. Kost één stuk 3 euro, dan kosten x stuks samen 3x euro. Tel de twee delen op en zet het totaal achter het is-gelijkteken.',
      ],
      ex: {
        q: T(
          'Een fles sap kost 2 euro en een pak koek 3 euro. Je koopt x flessen en y pakken en betaalt 19 euro. Hoeveel pakken koop je als x = 5?',
        ),
        steps: ['2x + 3y = 19', 'x = 5 geeft 10 + 3y = 19', '3y = 9', 'y = 3'],
      },
    },
    {
      t: 'De grafiek tekenen',
      p: [
        T(
          'De grafiek van p​x + q​y = r is een lijn. Daarvoor heb je twee punten nodig. Meestal is rekenen met x = 0 en y = 0 het makkelijkst. Bij 4x + 3y = 12 geeft x = 0 het punt (0, 4) en y = 0 het punt (3, 0).',
        ),
      ],
    },
    {
      t: 'Herleiden tot y = ax + b',
      p: [
        'Breng de term met x over naar het rechterlid. Daarbij verandert + in - en - in +. Staat er nog een getal voor y, deel dan alle termen door dat getal.',
      ],
      ex: { q: T('4x + 3y = 12'), steps: ['3y = -4x + 12', 'y = -{4/3}x + 4'] },
    },
  ],
};
