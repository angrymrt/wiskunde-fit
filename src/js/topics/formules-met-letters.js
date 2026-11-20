// Onderwerp: Formules met letters. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, nz, pick, coin, until, Q, qv, near, isNice, rd, d, fr, sg } from '../math.js';
import { F, MC } from './shared.js';
import { T } from '../typeset.js';

// Een bedrag in euro met twee decimalen als het geen heel getal is: 12,50 en geen 12,5.
const geld = (x) => (isNice(x, 0) ? String(Math.round(x)) : x.toFixed(2).replace('.', ','));
// Een uitkomst met de eenheid erachter, zoals 20 euro of 18 cm.
const amt = (c, x) => `${c.u === 'euro' ? geld(x) : d(x)} ${c.u}`;
// Dezelfde uitkomst voor de uitwerking, in dezelfde schrijfwijze als de rekenstappen: 27,5 euro.
const amd = (c, x) => `${d(x)} ${c.u}`;

// Een valkuil voor een fout getal w in het eerste veld. Komt w niet mooi uit, dan rondt een
// leerling het zelf af, zoals 4,3 bij 4,333… Ligt w te dicht bij het goede antwoord, dan geldt de
// valkuil niet.
const fout = (id, w, goed, m) =>
  Number.isFinite(w) && Math.abs(w - goed) > 0.06
    ? {
        id,
        f: (v) => near(v[0], w, 1e-6) || (!isNice(w, 2) && Math.abs(v[0] - w) < 0.051),
        m,
      }
    : null;

// Letters voor een kale uitdrukking. Geen l, o of i: die lijken op 1 en 0.
const LETTERS = ['c', 'g', 'h', 'k', 'm', 'p', 'q', 's', 'u', 'w', 'y', 'z'];

// Verhalen met een woordformule: uitkomst = vast deel + getal · aantal, of met een min. l en xl
// zijn de letters voor de uitkomst en het aantal, dy en dx de woorden met lidwoord. a, b en n zijn
// de keuzes voor het vaste deel, het getal per keer en het aantal.
const STORIES = [
  {
    up: true,
    y: 'hoogte',
    x: 'aantal dozen',
    l: 'h',
    xl: 'd',
    dy: 'de hoogte',
    dx: 'het aantal dozen',
    u: 'cm',
    wat: 'Voor de hoogte in cm van een stapel dozen op een plank geldt de {{woordformule|woordformule}}',
    lw: 'Voor de hoogte h in cm van een stapel dozen op een plank geldt',
    a: [10, 12, 15],
    b: [6, 8, 9],
    n: [2, 7],
    zin: (w) => `De stapel is dan ${w} hoog.`,
    terug: (w) => `De stapel is ${w} hoog. Hoeveel dozen liggen erop?`,
    terugZin: (n) => `Er liggen ${n} dozen op de plank.`,
  },
  {
    up: true,
    y: 'kosten',
    x: 'aantal ritjes',
    l: 'k',
    xl: 'r',
    dy: 'de kosten',
    dx: 'het aantal ritjes',
    u: 'euro',
    wat: 'Voor de kosten in euro van een middag op de kermis geldt de {{woordformule|woordformule}}',
    lw: 'Voor de kosten k in euro van een middag op de kermis geldt',
    a: [4, 5, 6],
    b: [2, 3, 4],
    n: [3, 9],
    zin: (w) => `De kosten zijn ${w}.`,
    terug: (w) => `De kosten zijn ${w}. Hoeveel ritjes heb je gemaakt?`,
    terugZin: (n) => `Je hebt ${n} ritjes gemaakt.`,
  },
  {
    up: true,
    y: 'hoogte',
    x: 'aantal pannenkoeken',
    l: 'h',
    xl: 'p',
    dy: 'de hoogte',
    dx: 'het aantal pannenkoeken',
    u: 'mm',
    wat: 'Voor de hoogte in mm van een stapel dunne pannenkoeken op een bord geldt de {{woordformule|woordformule}}',
    lw: 'Voor de hoogte h in mm van een stapel dunne pannenkoeken op een bord geldt',
    a: [8, 10, 12, 15],
    b: [3, 4, 5],
    n: [2, 8],
    zin: (w) => `De stapel is dan ${w} hoog.`,
    terug: (w) => `De stapel is ${w} hoog. Hoeveel pannenkoeken liggen erop?`,
    terugZin: (n) => `Er liggen ${n} pannenkoeken op het bord.`,
  },
  {
    up: true,
    y: 'gewicht',
    x: 'aantal knikkers',
    l: 'g',
    xl: 'k',
    dy: 'het gewicht',
    dx: 'het aantal knikkers',
    u: 'gram',
    wat: 'Voor het gewicht in gram van een doos met knikkers geldt de {{woordformule|woordformule}}',
    lw: 'Voor het gewicht g in gram van een doos met knikkers geldt',
    a: [100, 150, 200],
    b: [6, 8, 12],
    n: [4, 12],
    zin: (w) => `De doos weegt ${w}.`,
    terug: (w) => `De doos weegt ${w}. Hoeveel knikkers zitten erin?`,
    terugZin: (n) => `Er zitten ${n} knikkers in de doos.`,
  },
  {
    up: false,
    y: 'tegoed',
    x: 'aantal films',
    l: 't',
    xl: 'f',
    dy: 'het tegoed',
    dx: 'het aantal films',
    u: 'euro',
    wat: 'Voor het tegoed in euro op een bioscoopkaart geldt de {{woordformule|woordformule}}',
    lw: 'Voor het tegoed t in euro op een bioscoopkaart geldt',
    a: [30, 40, 50],
    b: [5, 6, 8],
    n: [1, 5],
    zin: (w) => `Er staat dan nog ${w} op de kaart.`,
  },
  {
    up: false,
    y: 'temperatuur',
    x: 'aantal minuten',
    l: 't',
    xl: 'm',
    dy: 'de temperatuur',
    dx: 'het aantal minuten',
    u: 'graden',
    wat: 'Een kop thee koelt af. Voor de temperatuur in graden geldt de {{woordformule|woordformule}}',
    lw: 'Een kop thee koelt af. Voor de temperatuur t in graden geldt',
    a: [70, 80, 90],
    b: [2, 3, 4],
    n: [2, 10],
    zin: (w) => `De thee is dan ${w}.`,
  },
];

// Een verhaal met getallen: bij een dalende formule moet er nog iets over zijn.
const story = (list) =>
  until(
    () => {
      const c = pick(list);
      return { c, a: pick(c.a), b: pick(c.b), n: ri(c.n[0], c.n[1]) };
    },
    ({ c, a, b, n }) => c.up || a - b * n > 0,
  );

// Een woordformule omzetten naar een formule met letters. De leerling kiest de goede formule.
function flWrite() {
  const { c, a, b } = until(
    () => {
      const c = pick(STORIES);
      return { c, a: pick(c.a), b: pick(c.b) };
    },
    ({ a, b }) => a !== b,
  );
  const op = c.up ? '+' : '-',
    samen = c.up ? a + b : a - b,
    goed = `${c.l} = ${a} ${op} ${b}${c.xl}`,
    raw = [
      goed,
      `${c.l} = ${b} ${op} ${a}${c.xl}`,
      `${c.xl} = ${a} ${op} ${b}${c.l}`,
      `${c.l} = ${samen}${c.xl}`,
    ],
    opts = raw.map((s) => T(s));
  return {
    q: T(
      `${c.wat} ${c.y} = ${a} ${op} ${b} · ${c.x}. Je gebruikt de letter ${c.l} voor ${c.dy} en ${c.xl} voor ${c.dx}. Welke formule met letters hoort hierbij?`,
    ),
    mc: MC(opts, 0),
    hint: T(
      `Schrijf ${c.l} in plaats van ${c.y} en ${c.xl} in plaats van ${c.x}. Het punt tussen een getal en een letter laat je weg.`,
    ),
    steps: [
      `In plaats van ${c.y} schrijf je ${c.l}, en in plaats van ${c.x} schrijf je ${c.xl}.`,
      `${c.l} = ${a} ${op} ${b} · ${c.xl}`,
      `Het punt mag weg, dus ${goed}.`,
    ],
    traps: [
      {
        id: 'getallen-omgewisseld',
        f: (v) => v[0] === opts[1],
        m: 'Je hebt de getallen omgewisseld. Het getal vooraan blijft vooraan. Het getal voor het aantal komt voor de letter van het aantal.',
      },
      {
        id: 'letters-omgewisseld',
        f: (v) => v[0] === opts[2],
        m: `Je hebt de letters omgewisseld. Links van het = staat de letter voor ${c.dy}.`,
      },
      {
        id: c.up ? 'eerst-optellen' : 'eerst-aftrekken',
        f: (v) => v[0] === opts[3],
        m: `Je hebt ${a} en ${b} samengenomen. Dat mag niet: alleen het getal voor het aantal hoort bij de letter ${c.xl}.`,
      },
    ],
    // Lees de goede formule terug uit de tekst en vergelijk bij 3 met de woordformule, die je stap
    // voor stap uitrekent.
    v: () => {
      const m = raw[0].match(/^(\w) = (\d+) ([+-]) (\d+)(\w)$/);
      const at3 = Number(m[2]) + (m[3] === '+' ? 1 : -1) * Number(m[4]) * 3;
      return (
        m[1] === c.l &&
        m[5] === c.xl &&
        new Set(raw).size === 4 &&
        at3 === [1, 2, 3].reduce((t) => (c.up ? t + b : t - b), a)
      );
    },
  };
}

// Tekst van een uitdrukking c + k · letter. lead zegt of het vaste getal vooraan staat, zoals in
// 20 - 4w; anders staat het achteraan, zoals in 9q + 5, of is het er niet, zoals in 6m.
function exprText({ k, c, lead }, l) {
  const ka = d(Math.abs(k));
  if (lead) return `${d(c)} ${k < 0 ? '-' : '+'} ${ka}${l}`;
  return `${k < 0 ? '-' : ''}${ka}${l}${c ? sg(c) : ''}`;
}

// De rekenstappen na het invullen van x (met tekst xt), als lijst voor "= ... = ...".
// p is het getal na het invullen dat je bij c optelt of van c aftrekt.
function leadChain(c, op, p) {
  const o = [`${d(c)} ${op} ${d(p)}`];
  if (p < 0) o.push(`${d(c)} ${op === '+' ? '-' : '+'} ${d(-p)}`);
  return o;
}
function valueChain({ k, c, lead }, xv, xt) {
  const ka = Math.abs(k);
  if (lead) {
    const op = k < 0 ? '-' : '+';
    return [
      `${d(c)} ${op} ${d(ka)} · ${xt}`,
      ...leadChain(c, op, rd(ka * xv, 6)),
      d(rd(c + k * xv, 6)),
    ];
  }
  const o = [`${k < 0 ? '-' : ''}${d(ka)} · ${xt}${c ? sg(c) : ''}`];
  if (c) o.push(`${d(rd(k * xv, 6))}${sg(c)}`);
  o.push(d(rd(c + k * xv, 6)));
  return o;
}

// Valkuilen bij het invullen in c + k · letter.
function valueTraps({ k, c, lead }, xv, y, l) {
  const ka = Math.abs(k);
  const glued = Number.isInteger(xv) && xv > 0 ? c + Math.sign(k) * Number(`${ka}${xv}`) : NaN;
  return [
    fout(
      'getal-en-letter-aan-elkaar',
      glued,
      y,
      `${ka}${l} betekent ${ka} · ${l}. Zet de getallen niet achter elkaar, maar vermenigvuldig ze.`,
    ),
    xv < 0 || (k < 0 && !lead)
      ? fout(
          'min-keer-min',
          c - k * xv,
          y,
          'Let op het teken. Min keer min is plus, en min keer plus is min.',
        )
      : null,
    lead
      ? fout(
          k > 0 ? 'eerst-optellen' : 'eerst-aftrekken',
          (c + k) * xv,
          y,
          `Je hebt eerst ${d(c)} ${k > 0 ? '+' : '-'} ${d(ka)} uitgerekend. Reken eerst ${d(ka)}${l} uit en ${k > 0 ? 'tel dat daarna op' : 'trek dat daarna af'}.`,
        )
      : null,
  ].filter(Boolean);
}

// Een uitdrukking met een letter berekenen, zoals 6m, 4 + 9w of 25 - 2z. Soms is het een formule
// uit een verhaal, zoals h = 15 + 4d.
function flValue() {
  if (ri(1, 3) === 1) {
    const { c: s, a, b, n } = story(STORIES);
    const e = { k: s.up ? b : -b, c: a, lead: true },
      y = a + e.k * n,
      formule = `${s.l} = ${exprText(e, s.xl)}`;
    return {
      q: T(`${s.lw} ${formule}, met ${s.xl} ${s.dx}. Bereken ${s.l} voor ${s.xl} = ${n}.`),
      fields: [F(`${s.l} =`, y, s.u)],
      hint: T(
        `Vul ${n} in voor ${s.xl}. ${b}${s.xl} betekent ${b} · ${s.xl}. Reken eerst de keer uit.`,
      ),
      steps: [
        `${s.xl} = ${n} geeft ${s.l} = ${valueChain(e, n, String(n)).join(' = ')}`,
        s.zin(amd(s, y)),
      ],
      traps: valueTraps(e, n, y, s.xl),
      v: () => near((y - a) / e.k, n),
    };
  }
  const l = pick(LETTERS),
    form = pick(['kx', 'p+kx', 'p-kx', 'kx+q', 'kx-q']),
    frac = ri(1, 4) === 1,
    ka = frac ? pick([2, 4, 6, 8]) : ri(2, 9),
    neg = coin(),
    x = frac ? Q((neg ? -1 : 1) * pick([1, 3, 5]), 2) : Q(neg ? -ri(1, 6) : ri(2, 9)),
    e = {
      kx: { k: coin() ? ka : -ka, c: 0, lead: false },
      'p+kx': { k: ka, c: ri(1, 20), lead: true },
      'p-kx': { k: -ka, c: ri(5, 30), lead: true },
      'kx+q': { k: ka, c: ri(1, 9), lead: false },
      'kx-q': { k: ka, c: -ri(1, 9), lead: false },
    }[form];
  const xv = qv(x),
    xt = fr(x),
    y = rd(e.c + e.k * xv, 6),
    expr = exprText(e, l),
    tekens = xv < 0 || e.k < 0;
  return {
    q: T(`Bereken ${expr} voor ${l} = ${xt}.`),
    fields: [F(`${expr} =`, y)],
    hint: T(
      `Vul ${xt} in voor ${l}. ${ka}${l} betekent ${ka} · ${l}.${e.c ? ' Reken eerst de keer uit.' : ''}${tekens ? ' Let op de mintekens.' : ''}`,
    ),
    steps: [`${l} = ${xt} geeft ${expr} = ${valueChain(e, xv, xt).join(' = ')}`],
    traps: valueTraps(e, xv, y, l),
    // Reken terug: haal het vaste getal eraf en deel door het getal voor de letter.
    v: () => near((y - e.c) / e.k, xv),
  };
}

// Een uitdrukking met haakjes berekenen, zoals 6(m + 2), -3(w - 5) + 4 of 25 - 2(z + 7). Het
// getal voor het haakje is m, het getal in het haakje r en het vaste getal c.
function flBrackets() {
  const l = pick(LETTERS),
    form = pick(['m(x+r)', '-m(x+r)+c', 'c-m(x+r)']);
  const { m, r, c, lead, x } = until(
    () => {
      const r = nz(-9, 9),
        x = nz(-6, 10);
      if (form === 'm(x+r)') return { m: ri(2, 9), r, c: 0, lead: false, x };
      if (form === '-m(x+r)+c') return { m: -ri(2, 6), r, c: nz(-9, 9), lead: false, x };
      return { m: -ri(2, 6), r, c: ri(5, 30), lead: true, x };
    },
    ({ r, x }) => x + r !== 0,
  );
  const ma = Math.abs(m),
    s = x + r,
    y = c + m * s,
    inner = `(${l}${sg(r)})`,
    expr = lead ? `${c} - ${ma}${inner}` : `${m < 0 ? '-' : ''}${ma}${inner}${c ? sg(c) : ''}`,
    filled = `(${x}${sg(r)})`;
  const chain = lead
    ? [`${c} - ${ma}${filled}`, `${c} - ${ma} · ${s}`, ...leadChain(c, '-', ma * s), String(y)]
    : [
        `${m < 0 ? '-' : ''}${ma}${filled}${c ? sg(c) : ''}`,
        `${m < 0 ? '-' : ''}${ma} · ${s}${c ? sg(c) : ''}`,
        ...(c ? [`${m * s}${sg(c)}`] : []),
        String(y),
      ];
  return {
    q: T(`Bereken ${expr} voor ${l} = ${x}.`),
    fields: [F(`${expr} =`, y)],
    hint: T(
      `Vul ${x} in voor ${l}. Reken eerst uit wat tussen de haakjes staat. ${ma}${inner} betekent ${ma} · ${inner}.`,
    ),
    steps: [`${l} = ${x} geeft ${expr} = ${chain.join(' = ')}`],
    traps: [
      fout(
        'haakje-vergeten',
        c + m * x + r,
        y,
        `Je moet alles tussen de haakjes met ${ma} vermenigvuldigen. Reken eerst uit wat tussen de haakjes staat.`,
      ),
      m < 0 || s < 0
        ? fout(
            'min-keer-min',
            c - m * s,
            y,
            'Let op het teken. Min keer min is plus, en min keer plus is min.',
          )
        : null,
      lead
        ? fout(
            'eerst-aftrekken',
            (c - ma) * s,
            y,
            `Je hebt eerst ${c} - ${ma} uitgerekend. Reken eerst ${ma}${filled} uit en trek dat daarna af.`,
          )
        : null,
    ].filter(Boolean),
    // Werk de haakjes weg en vul daarna in.
    v: () => c + m * r + m * x === y,
  };
}

// Terugrekenen: bij een gegeven uitkomst de letter. Eerst het vaste getal weghalen, dan delen.
function flBack() {
  if (coin()) {
    const { c: s, a, b, n } = story(STORIES.filter((k) => k.up));
    const y = a + b * n,
      rest = y - a;
    return {
      q: T(`${s.lw} ${s.l} = ${a} + ${b}${s.xl}, met ${s.xl} ${s.dx}. ${s.terug(amt(s, y))}`),
      fields: [F(`${s.xl} =`, n)],
      hint: T(`Er geldt ${a} + ${b}${s.xl} = ${y}. Haal eerst ${a} eraf. Deel daarna door ${b}.`),
      steps: [
        `${a} + ${b}${s.xl} = ${y}`,
        `${b}${s.xl} = ${y} - ${a} = ${rest}`,
        `${s.xl} = ${rest} : ${b} = ${n}`,
        s.terugZin(n),
      ],
      traps: [
        fout(
          'eerst-delen',
          y / b - a,
          n,
          `Je hebt eerst gedeeld. Haal eerst ${a} eraf en deel daarna.`,
        ),
        fout(
          'vast-deel-vergeten',
          y / b,
          n,
          `Je bent het vaste getal ${a} vergeten. Haal dat er eerst af en deel daarna.`,
        ),
      ].filter(Boolean),
      // Vul het aantal terug in de formule in.
      v: () => a + b * n === y,
    };
  }
  const l = pick(LETTERS),
    plus = coin();
  const { k, p, x } = until(
    () => ({ k: ri(2, 9), p: ri(1, plus ? 30 : 15), x: ri(2, 12) }),
    ({ k, p, x }) => plus || k * x - p > 0,
  );
  const kx = k * x,
    y = plus ? p + kx : kx - p,
    eq = plus ? `${p} + ${k}${l} = ${y}` : `${k}${l} - ${p} = ${y}`;
  return {
    q: T(`Er geldt ${eq}. Bereken ${l}.`),
    fields: [F(`${l} =`, x)],
    hint: T(
      `${plus ? `Haal eerst ${p} eraf` : `Tel eerst ${p} erbij op`}. Dan weet je wat ${k}${l} is. Deel daarna door ${k}.`,
    ),
    steps: [eq, `${k}${l} = ${y} ${plus ? '-' : '+'} ${p} = ${kx}`, `${l} = ${kx} : ${k} = ${x}`],
    traps: [
      fout(
        'eerst-delen',
        plus ? y / k - p : y / k + p,
        x,
        `Je hebt eerst gedeeld. ${plus ? `Haal eerst ${p} eraf` : `Tel eerst ${p} erbij op`} en deel daarna.`,
      ),
      fout(
        'vast-deel-vergeten',
        y / k,
        x,
        `Je bent het getal ${p} vergeten. ${plus ? 'Haal dat er eerst af' : 'Tel dat er eerst bij op'} en deel daarna.`,
      ),
      plus
        ? null
        : fout(
            'eraf-in-plaats-van-erbij',
            (y - p) / k,
            x,
            `Er staat - ${p}. Dan tel je ${p} erbij op voordat je deelt.`,
          ),
    ].filter(Boolean),
    // Vul de letter terug in.
    v: () => (plus ? p + k * x : k * x - p) === y,
  };
}

// Formules met twee letters. a en b zijn de getallen voor de letters x1 en x2, n1 en n2 de keuzes
// voor hun waarden.
const TWO = [
  {
    l: 'k',
    x1: 'v',
    x2: 'j',
    u: 'euro',
    wat: 'Voor de kosten k in euro van een rondvaart geldt',
    met: 'Hierin is v het aantal volwassenen en j het aantal jongeren.',
    a: [6, 7, 8],
    b: [3, 4, 5],
    n1: [1, 4],
    n2: [1, 5],
  },
  {
    l: 's',
    x1: 'm',
    x2: 't',
    u: 'punten',
    wat: 'Voor je score s bij een computerspel geldt',
    met: 'Hierin is m het aantal munten en t het aantal sterren dat je pakt.',
    a: [5, 10],
    b: [20, 25, 50],
    n1: [2, 12],
    n2: [1, 4],
  },
  {
    l: 'z',
    x1: 'b',
    x2: 'g',
    u: 'euro',
    wat: 'Voor de omzet z in euro van een bakker op een ochtend geldt',
    met: 'Hierin is b het aantal broden en g het aantal gebakjes.',
    a: [3, 3.5, 4],
    b: [2, 2.5, 3],
    n1: [1, 4],
    n2: [1, 4],
  },
];

// Invullen in een formule met twee letters, zoals p = 7v + 4k.
function flTwo() {
  const c = pick(TWO),
    a = pick(c.a),
    b = pick(c.b),
    n1 = ri(c.n1[0], c.n1[1]),
    n2 = ri(c.n2[0], c.n2[1]),
    an = rd(a * n1, 6),
    bn = rd(b * n2, 6),
    y = rd(an + bn, 6),
    formule = `${c.l} = ${d(a)}${c.x1} + ${d(b)}${c.x2}`,
    glued =
      Number.isInteger(a) && Number.isInteger(b) ? Number(`${a}${n1}`) + Number(`${b}${n2}`) : NaN;
  return {
    q: T(`${c.wat} ${formule}. ${c.met} Bereken ${c.l} voor ${c.x1} = ${n1} en ${c.x2} = ${n2}.`),
    fields: [F(`${c.l} =`, y, c.u)],
    hint: T(
      `Vul ${n1} in voor ${c.x1} en ${n2} voor ${c.x2}. Reken eerst de twee keersommen uit en tel ze daarna op.`,
    ),
    steps: [
      `${c.x1} = ${n1} en ${c.x2} = ${n2} geeft ${c.l} = ${d(a)} · ${n1} + ${d(b)} · ${n2} = ${d(an)} + ${d(bn)} = ${d(y)}`,
      `Dus ${c.l} = ${d(y)}.`,
    ],
    traps: [
      fout(
        'letters-omgewisseld',
        a * n2 + b * n1,
        y,
        `Je hebt de letters omgewisseld. Vul ${n1} in voor ${c.x1} en ${n2} voor ${c.x2}.`,
      ),
      fout(
        'getal-en-letter-aan-elkaar',
        glued,
        y,
        `${d(a)}${c.x1} betekent ${d(a)} · ${c.x1}. Zet de getallen niet achter elkaar, maar vermenigvuldig ze.`,
      ),
    ].filter(Boolean),
    // Tel voor elk ding los het bedrag of de punten op.
    v: () =>
      near(
        [...Array(n1).fill(a), ...Array(n2).fill(b)].reduce((t, k) => t + k, 0),
        y,
      ),
  };
}

export default {
  slug: 'formules-met-letters',
  title: 'Formules met letters',
  intro:
    'In een formule kun je een letter gebruiken in plaats van woorden, zoals p = 5 + 2w. Hier leer je een woordformule met letters schrijven, een getal invullen voor een letter, ook met haakjes en negatieve getallen, en terugrekenen.',
  description:
    'Formules met letters oefenen: invullen voor een letter, ook negatief en met haakjes, een woordformule met letters schrijven en terugrekenen. Gratis met uitleg.',
  videos: {},
  skills: [
    [138, 'Woordformule met letters', flWrite],
    [139, 'Invullen voor een letter', flValue],
    [140, 'Invullen met haakjes', flBrackets],
    [141, 'Letter terugrekenen', flBack],
    [142, 'Formule met twee letters', flTwo],
  ],
  learn: [
    {
      t: 'Letters in plaats van woorden',
      p: [
        T(
          'In plaats van een woord gebruik je in een formule vaak een letter. Bij rekening = 4 + 3 · aantal kinderen schrijf je r voor de rekening en k voor het aantal kinderen. Dan krijg je r = 4 + 3 · k.',
        ),
        T('Het punt tussen een getal en een letter mag weg: 3k betekent 3 · k. Dus r = 4 + 3k.'),
      ],
      watch: T('Tel 4 en 3 niet bij elkaar op: r = 7k klopt niet.'),
    },
    {
      t: 'Invullen voor een letter',
      p: [
        T(
          'Vul het getal in voor de letter en zet het punt terug. Reken eerst de keer uit en tel daarna op of trek af.',
        ),
      ],
      ex: {
        q: T('Bereken 5 + 4s voor s = 6.'),
        steps: ['s = 6 geeft 5 + 4s = 5 + 4 · 6 = 5 + 24 = 29'],
      },
      watch: T('4s met s = 6 is 4 · 6 = 24, en niet 46.'),
    },
    {
      t: 'Negatieve getallen invullen',
      p: [
        T(
          'Vul je een negatief getal in, let dan op de tekens. Min keer min is plus, en min keer plus is min. Haakjes om het negatieve getal zijn niet nodig.',
        ),
      ],
      ex: {
        q: T('Bereken 9 - 4w voor w = -5.'),
        steps: ['w = -5 geeft 9 - 4w = 9 - 4 · -5 = 9 - -20 = 9 + 20 = 29'],
      },
      watch: T('Reken 9 - 4 niet eerst uit. Eerst de keer, dan de min.'),
    },
    {
      t: 'Haakjes',
      p: [
        T(
          'Ook voor een haakje laat je het punt weg: 3(m + 5) betekent 3 · (m + 5). Reken eerst uit wat tussen de haakjes staat en vermenigvuldig dat daarna.',
        ),
      ],
      ex: {
        q: T('Bereken 3(m + 5) voor m = 4.'),
        steps: ['m = 4 geeft 3(m + 5) = 3(4 + 5) = 3 · 9 = 27'],
      },
      watch: T('3(m + 5) is niet hetzelfde als 3m + 5. Het hele haakje gaat keer 3.'),
    },
    {
      t: 'Terugrekenen',
      p: [
        T(
          'Weet je de uitkomst en zoek je de letter? Haal dan eerst het vaste getal eraf. Deel daarna door het getal voor de letter.',
        ),
      ],
      ex: {
        q: T('Er geldt 9 + 4q = 37. Bereken q.'),
        steps: ['9 + 4q = 37', '4q = 37 - 9 = 28', 'q = 28 : 4 = 7'],
      },
    },
    {
      t: 'Twee letters',
      p: [
        T(
          'Een formule kan ook twee letters hebben, zoals z = 8c + 3,5d. Vul voor elke letter het goede getal in. Reken de keersommen uit en tel ze op.',
        ),
      ],
      ex: {
        q: T('Bereken z = 8c + 3,5d voor c = 3 en d = 2.'),
        steps: ['c = 3 en d = 2 geeft z = 8 · 3 + 3,5 · 2 = 24 + 7 = 31'],
      },
    },
  ],
};
