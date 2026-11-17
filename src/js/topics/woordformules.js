// Onderwerp: Woordformules. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { ri, pick, coin, until, Q, qv, near, isNice, rd, d, fr, ap } from '../math.js';
import { F, MC } from './shared.js';
import { T } from '../typeset.js';

// Een bedrag in euro met twee decimalen als het geen heel getal is: 12,50 en geen 12,5.
const geld = (x) => (isNice(x, 0) ? String(Math.round(x)) : x.toFixed(2).replace('.', ','));
// Een uitkomst met de eenheid erachter, zoals 20 euro of 18 cm.
const amt = (c, x) => `${c.u === 'euro' ? geld(x) : d(x)} ${c.u}`;
// Dezelfde uitkomst voor de uitwerking, in dezelfde schrijfwijze als de rekenstappen: 27,5 euro.
const amd = (c, x) => `${d(x)} ${c.u}`;

// Woordformules die stijgen: uitkomst = vast deel + getal · aantal. y is de naam van de uitkomst,
// x de woorden voor het aantal en u de eenheid, die in de zin staat en niet in de formule. a, b en
// n zijn de keuzes voor het vaste deel, het getal per keer en het aantal.
const UP = [
  {
    y: 'rekening',
    heel: true,
    x: 'aantal kinderen',
    u: 'euro',
    wat: 'Voor de rekening in euro van een kinderfeestje in een klimhal geldt de woordformule',
    a: [5, 6, 8, 10],
    b: [3, 4, 5, 6],
    n: [2, 6],
    vraag: (n) => `Er komen ${n} kinderen naar het feestje. Bereken de rekening.`,
    zin: (w) => `De rekening is ${w}.`,
    terug: (w) => `De rekening is ${w}. Hoeveel kinderen komen er?`,
    terugZin: (n) => `Er komen ${n} kinderen.`,
    welk: 'Welke rekening kan niet?',
    nooit: (w) =>
      `Ook als er geen kind komt, betaal je al ${w}. De rekening is dus nooit minder dan ${w}.`,
  },
  {
    y: 'prijs',
    heel: true,
    x: 'aantal posters',
    u: 'euro',
    wat: 'Voor de prijs in euro van posters bij een drukker geldt de woordformule',
    a: [3, 4, 5],
    b: [2, 2.5, 3],
    n: [4, 16],
    vraag: (n) => `Je bestelt ${n} posters. Bereken de prijs.`,
    zin: (w) => `De prijs is ${w}.`,
    terug: (w) => `Je betaalt ${w}. Hoeveel posters heb je besteld?`,
    terugZin: (n) => `Je hebt ${n} posters besteld.`,
    welk: 'Welke prijs kan niet?',
    nooit: (w) => `Bij 0 posters betaal je al ${w}. De prijs is dus nooit minder dan ${w}.`,
  },
  {
    y: 'lengte',
    x: 'aantal weken',
    u: 'cm',
    wat: 'Voor de lengte in cm van een zonnebloem geldt de woordformule',
    a: [4, 5, 6, 8, 10],
    b: [3, 4, 5, 6],
    n: [2, 10],
    vraag: (n) => `Bereken de lengte na ${n} weken.`,
    zin: (w) => `De zonnebloem is dan ${w} lang.`,
    terug: (w) => `De zonnebloem is ${w} lang. Na hoeveel weken is dat?`,
    terugZin: (n) => `Dat is na ${n} weken.`,
    welk: 'Welke lengte kan niet?',
    nooit: (w) =>
      `Bij 0 weken is de zonnebloem al ${w} lang, en daarna groeit hij. De lengte is dus nooit minder dan ${w}.`,
  },
  {
    y: 'spaargeld',
    heel: true,
    x: 'aantal weken',
    u: 'euro',
    wat: 'Noor doet elke week evenveel geld in haar spaarpot. Voor haar spaargeld in euro geldt de woordformule',
    a: [10, 15, 20, 25, 30],
    b: [2, 3, 4, 5],
    n: [3, 12],
    vraag: (n) => `Bereken het spaargeld na ${n} weken.`,
    zin: (w) => `Noor heeft dan ${w}.`,
    terug: (w) => `Noor heeft ${w} in haar spaarpot. Na hoeveel weken is dat?`,
    terugZin: (n) => `Dat is na ${n} weken.`,
    welk: 'Welk spaargeld kan niet?',
    nooit: (w) =>
      `Bij 0 weken heeft Noor al ${w}, en daarna komt er geld bij. Ze heeft dus nooit minder dan ${w}.`,
  },
  {
    y: 'kosten',
    heel: true,
    x: 'aantal lessen',
    u: 'euro',
    wat: 'Voor de kosten in euro van zwemles geldt de woordformule',
    a: [15, 20, 25],
    b: [6, 7, 8, 9],
    n: [4, 12],
    vraag: (n) => `Bereken de kosten van ${n} lessen.`,
    zin: (w) => `De kosten zijn ${w}.`,
    terug: (w) => `De kosten zijn ${w}. Hoeveel lessen zijn dat?`,
    terugZin: (n) => `Dat zijn ${n} lessen.`,
    welk: 'Welke kosten kunnen niet?',
    nooit: (w) =>
      `Ook bij heel weinig lessen betaal je al ${w}. De kosten zijn dus nooit minder dan ${w}.`,
  },
];

// Woordformules die dalen: uitkomst = begin - afname · aantal. op zegt wanneer het op is.
const DOWN = [
  {
    y: 'hoogte',
    x: 'aantal uren',
    u: 'cm',
    wat: 'Een sneeuwpop smelt. Voor de hoogte in cm van de sneeuwpop geldt de woordformule',
    a: [20, 24, 30],
    b: [1.5, 2, 2.5, 3],
    n: [2, 6],
    vraag: (n) => `Bereken de hoogte na ${n} uur.`,
    zin: (w) => `De sneeuwpop is dan ${w} hoog.`,
    terug: (w) => `De sneeuwpop is nog ${w} hoog. Hoeveel uur smelt hij al?`,
    terugZin: (n) => `De sneeuwpop smelt al ${n} uur.`,
    kanNiet: (w) => `Een sneeuwpop kan niet ${w} hoog zijn.`,
    op: (t) => `Na ${t} uur is de sneeuwpop gesmolten.`,
  },
  {
    y: 'saldo',
    x: 'aantal vellen',
    u: 'euro',
    wat: 'Voor het saldo in euro op de printpas van Sem geldt de woordformule',
    a: [10, 15, 20],
    b: [0.2, 0.25, 0.5],
    n: [10, 18],
    vraag: (n) => `Sem print in totaal ${n} vellen. Bereken zijn saldo.`,
    zin: (w) => `Sem heeft dan nog ${w} op zijn printpas.`,
    terug: (w) => `Sem heeft nog ${w} op zijn printpas. Hoeveel vellen heeft hij geprint?`,
    terugZin: (n) => `Sem heeft ${n} vellen geprint.`,
    heel: true,
    welk: 'Welk saldo kan niet?',
    kanNiet: (w) => `Een saldo van ${w} kan niet.`,
    op: (t) => `Na ${t} vellen is de printpas leeg.`,
  },
  {
    y: 'inhoud',
    x: 'aantal dagen',
    u: 'liter',
    wat: 'Je geeft de planten elke dag water uit een regenton. Voor de inhoud in liter van de ton geldt de woordformule',
    a: [80, 120, 150, 200],
    b: [4, 5, 6, 8],
    n: [3, 12],
    vraag: (n) => `Bereken de inhoud na ${n} dagen.`,
    zin: (w) => `Er zit dan ${w} water in de ton.`,
    terug: (w) => `Er zit nog ${w} water in de ton. Na hoeveel dagen is dat?`,
    terugZin: (n) => `Dat is na ${n} dagen.`,
    heel: true,
    welk: 'Welke inhoud kan niet?',
    kanNiet: (w) => `Er kan niet ${w} water in de ton zitten.`,
    op: (t) => `Na ${t} dagen is de ton leeg.`,
  },
  {
    y: 'inhoud',
    x: 'aantal uren',
    u: 'dl',
    wat: 'Op een kinderfeestje staat een kan ranja op tafel. Voor de inhoud in dl van de kan geldt de woordformule',
    a: [36, 45, 48, 60],
    b: [10, 12, 14, 16],
    n: [2, 3],
    vraag: (n) => `Bereken de inhoud na ${n} uur.`,
    zin: (w) => `Er zit dan nog ${w} in de kan.`,
    terug: (w) => `Er zit nog ${w} in de kan. Hoeveel uur is het feest dan al bezig?`,
    terugZin: (n) => `Het feest is dan al ${n} uur bezig.`,
    kanNiet: (w) => `Een inhoud van ${w} kan niet.`,
    op: (t) => `Na ${t} uur is de kan leeg.`,
  },
];

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

// Invullen in een stijgende woordformule: vast deel + getal · aantal.
function wfFill() {
  const c = pick(UP),
    a = pick(c.a),
    b = pick(c.b),
    n = ri(c.n[0], c.n[1]),
    bn = rd(b * n, 6),
    y = rd(a + bn, 6);
  return {
    q: T(`${c.wat} ${c.y} = ${d(a)} + ${d(b)} · ${c.x}. ${c.vraag(n)}`),
    fields: [F(`${c.y} =`, y, c.u)],
    hint: T(`Vul ${n} in voor ${c.x}. Reken eerst de keer uit en tel daarna op.`),
    steps: [`${c.y} = ${d(a)} + ${d(b)} · ${n} = ${d(a)} + ${d(bn)} = ${d(y)}`, c.zin(amd(c, y))],
    traps: [
      fout(
        'eerst-optellen',
        (a + b) * n,
        y,
        'Je hebt eerst opgeteld. Reken eerst de keer uit en tel daarna op.',
      ),
      fout(
        'vast-deel-vergeten',
        bn,
        y,
        'Je bent het vaste getal vooraan in de formule vergeten. Tel dat er nog bij op.',
      ),
    ].filter(Boolean),
    v: () => near((y - a) / n, b),
  };
}

// Invullen in een dalende woordformule: begin - afname · aantal. Het aantal kan ook een gemengd
// getal zijn, zoals 2 1/2; de afname is dan even, zodat de uitkomst heel blijft.
function wfDown() {
  const half = coin();
  const { c, a, b, n } = until(
    () => {
      const c = half ? pick(DOWN.filter((k) => k.b.some((b) => b % 2 === 0))) : pick(DOWN),
        b = half ? pick(c.b.filter((b) => b % 2 === 0)) : pick(c.b),
        n = half ? Q(2 * ri(1, 3) + 1, 2) : Q(ri(c.n[0], c.n[1]));
      return { c, a: pick(c.a), b, n };
    },
    ({ a, b, n }) => a - b * qv(n) > 0,
  );
  const nv = qv(n),
    bn = rd(b * nv, 6),
    y = rd(a - bn, 6),
    nt = fr(n);
  return {
    q: T(`${c.wat} ${c.y} = ${d(a)} - ${d(b)} · ${c.x}. ${c.vraag(nt)}`),
    fields: [F(`${c.y} =`, y, c.u)],
    hint: T(`Vul ${nt} in voor ${c.x}. Reken eerst de keer uit en trek dat daarna af.`),
    steps: [`${c.y} = ${d(a)} - ${d(b)} · ${nt} = ${d(a)} - ${d(bn)} = ${d(y)}`, c.zin(amd(c, y))],
    traps: [
      fout(
        'eerst-aftrekken',
        (a - b) * nv,
        y,
        'Je hebt eerst afgetrokken. Reken eerst de keer uit en trek dat daarna af.',
      ),
      fout(
        'afname-als-plus',
        a + bn,
        y,
        'Er staat een min in de formule. Je moet het product dus aftrekken.',
      ),
    ].filter(Boolean),
    v: () => near((a - y) / b, nv),
  };
}

// Verhalen voor het opstellen. up zegt of er elke keer iets bij komt of af gaat.
const MAKE = [
  {
    up: true,
    y: 'kosten',
    x: 'aantal spellen',
    a: [3, 4, 5],
    b: [6, 7, 8],
    s: (a, b) =>
      `Bij een bowlingbaan betaal je ${geld(a)} euro voor de schoenen en ${geld(b)} euro per spel. Stel een woordformule op voor de kosten in euro.`,
    vast: (a) => `Eén keer ${geld(a)} euro voor de schoenen.`,
    per: (b) => `Per spel komt er ${geld(b)} euro bij.`,
  },
  {
    up: true,
    y: 'bedrag',
    x: 'aantal uren',
    a: [20, 25, 30, 35],
    b: [40, 45, 50],
    s: (a, b) =>
      `Een klusser rekent ${geld(a)} euro voorrijkosten en ${geld(b)} euro per uur. Stel een woordformule op voor het bedrag in euro.`,
    vast: (a) => `Eén keer ${geld(a)} euro voorrijkosten.`,
    per: (b) => `Per uur komt er ${geld(b)} euro bij.`,
  },
  {
    up: true,
    y: 'gewicht',
    x: 'aantal weken',
    a: [3, 4, 5, 6],
    b: [1.5, 2, 2.5],
    s: (a, b) =>
      `Een pompoen weegt nu ${d(a)} kg. Elke week wordt hij ${d(b)} kg zwaarder. Stel een woordformule op voor het gewicht in kg.`,
    vast: (a) => `Het begin is ${d(a)} kg.`,
    per: (b) => `Per week komt er ${d(b)} kg bij.`,
  },
  {
    up: true,
    y: 'kosten',
    x: 'aantal maanden',
    a: [15, 20, 25, 30],
    b: [19, 22, 24, 28],
    s: (a, b) =>
      `Bij een sportschool betaal je eenmalig ${geld(a)} euro inschrijfgeld. Daarna betaal je ${geld(b)} euro per maand. Stel een woordformule op voor de kosten in euro.`,
    vast: (a) => `Eén keer ${geld(a)} euro inschrijfgeld.`,
    per: (b) => `Per maand komt er ${geld(b)} euro bij.`,
  },
  {
    up: false,
    y: 'dikte',
    x: 'aantal uren',
    a: [18, 20, 24, 30],
    b: [1.5, 2, 2.5, 3],
    s: (a, b) =>
      `Een laag sneeuw is ${d(a)} cm dik. Elk uur smelt er ${d(b)} cm weg. Stel een woordformule op voor de dikte in cm.`,
    vast: (a) => `Het begin is ${d(a)} cm.`,
    per: (b) => `Per uur gaat er ${d(b)} cm af.`,
  },
  {
    up: false,
    y: 'tegoed',
    x: 'aantal weken',
    a: [25, 30, 40, 50],
    b: [3.5, 4, 4.5, 5],
    s: (a, b) =>
      `Op een cadeaukaart staat ${geld(a)} euro. Je koopt er elke week een tijdschrift van ${geld(b)} euro mee. Stel een woordformule op voor het tegoed in euro.`,
    vast: (a) => `Het begin is ${geld(a)} euro.`,
    per: (b) => `Per week gaat er ${geld(b)} euro af.`,
  },
  {
    up: false,
    y: 'inhoud',
    x: 'aantal minuten',
    a: [300, 360, 400, 480],
    b: [12, 15, 20],
    s: (a, b) =>
      `In een opblaasbad zit ${d(a)} liter water. Je laat het leeglopen: elke minuut stroomt er ${d(b)} liter uit. Stel een woordformule op voor de inhoud in liter.`,
    vast: (a) => `Het begin is ${d(a)} liter.`,
    per: (b) => `Per minuut gaat er ${d(b)} liter af.`,
  },
  {
    up: false,
    y: 'hoogte',
    x: 'aantal minuten',
    a: [6000, 8000, 9000],
    b: [250, 300, 400],
    s: (a, b) =>
      `Een vliegtuig vliegt op ${d(a)} meter hoogte en gaat landen. Elke minuut daalt het ${d(b)} meter. Stel een woordformule op voor de hoogte in meter.`,
    vast: (a) => `Het begin is ${d(a)} meter.`,
    per: (b) => `Per minuut gaat er ${d(b)} meter af.`,
  },
];
const SIGN = ['+', '−'];

// Een woordformule opstellen uit een verhaal. De leerling vult het vaste getal en het getal per
// keer in en kiest + of −.
function wfMake() {
  const c = pick(MAKE),
    a = pick(c.a),
    b = pick(c.b),
    sign = c.up ? '+' : '−',
    op = c.up ? '+' : '-';
  return {
    q: T(`${c.s(a, b)} Vul de getallen in en kies + of −.`),
    fields: [
      { ...F(`${c.y} =`, a), label: 'Het getal vooraan' },
      { sel: SIGN, a: sign, label: 'Plus of min' },
      { ...F('', b, `· ${c.x}`), label: `Het getal voor ${c.x}` },
    ],
    compact: true,
    hint: T(
      'Vooraan staat het getal waarmee je begint. Voor het aantal staat wat er elke keer bij komt of af gaat.',
    ),
    steps: [c.vast(a), c.per(b), `${c.y} = ${d(a)} ${op} ${d(b)} · ${c.x}`],
    traps: [
      {
        id: 'vast-en-per-omgewisseld',
        f: (v) => near(v[0], b) && near(v[2], a),
        m: 'Je hebt de getallen omgewisseld. Vooraan staat het getal waarmee je begint, voor het aantal wat er elke keer bij komt of af gaat.',
      },
      c.up
        ? {
            id: 'toename-als-min',
            f: (v) => v[1] === '−',
            m: 'Er komt elke keer iets bij. Dan staat er een plus in de formule.',
          }
        : {
            id: 'afname-als-plus',
            f: (v) => v[1] === '+',
            m: 'Er gaat elke keer iets af. Dan staat er een min in de formule.',
          },
      {
        id: 'min-in-getal',
        f: (v) => near(v[2], -b),
        m: 'Typ het getal zonder min. Het teken kies je in de lijst.',
      },
    ],
    // Na 3 keer: tel stap voor stap op of trek af, en vergelijk met de formule.
    v: () =>
      near(
        [1, 2, 3].reduce((t) => (c.up ? t + b : t - b), a),
        a + (sign === '+' ? 1 : -1) * b * 3,
      ),
  };
}

// Terugrekenen: bij een gegeven uitkomst het aantal. Eerst het vaste deel weghalen, dan delen.
function wfBack() {
  const up = coin();
  // Bij een dalende formule moet er nog iets over zijn.
  const { c, a, b, n } = until(
    () => {
      const c = pick(up ? UP : DOWN);
      return { c, a: pick(c.a), b: pick(c.b), n: ri(c.n[0], c.n[1]) };
    },
    ({ a, b, n }) => up || a - b * n > 0,
  );
  const bn = rd(b * n, 6),
    y = rd(up ? a + bn : a - bn, 6),
    rest = rd(up ? y - a : a - y, 6),
    formule = `${c.y} = ${d(a)} ${up ? '+' : '-'} ${d(b)} · ${c.x}`;
  return {
    q: T(`${c.wat} ${formule}. ${c.terug(amt(c, y))}`),
    fields: [F(`${c.x} =`, n)],
    hint: T(
      up
        ? `Haal eerst het vaste getal ${d(a)} eraf. Deel daarna door ${d(b)}.`
        : `Reken eerst uit hoeveel er af is: ${d(a)} minus de uitkomst. Deel daarna door ${d(b)}.`,
    ),
    steps: [
      up
        ? `${c.u === 'euro' ? geld(y) : d(y)} - ${d(a)} = ${d(rest)}`
        : `Er is ${d(a)} - ${c.u === 'euro' ? geld(y) : d(y)} = ${d(rest)} af.`,
      `${d(rest)} : ${d(b)} = ${n}`,
      c.terugZin(n),
    ],
    traps: (up
      ? [
          fout(
            'eerst-delen',
            y / b - a,
            n,
            'Je hebt eerst gedeeld. Haal eerst het vaste getal eraf en deel daarna.',
          ),
          fout(
            'vast-deel-vergeten',
            y / b,
            n,
            'Je bent het vaste getal vergeten. Haal dat er eerst af en deel daarna.',
          ),
        ]
      : [
          fout(
            'rest-gedeeld',
            y / b,
            n,
            'Je hebt gedeeld wat er nog over is. Reken eerst uit hoeveel er af is.',
          ),
          fout(
            'afname-als-plus',
            (a + y) / b,
            n,
            'Je hebt opgeteld. Er gaat elke keer iets af, dus trek de uitkomst af van het begin.',
          ),
        ]
    ).filter(Boolean),
    // Vul het aantal terug in de formule in.
    v: () => near(up ? a + b * n : a - b * n, y),
  };
}

// Welke waarde kan niet? Bij een dalende formule: een aantal waarbij het al op is. Bij een
// stijgende formule: een uitkomst die kleiner is dan het vaste deel.
// Het foute antwoord ligt tussen de goede uitkomsten in, met evenveel decimalen als de rest, en
// hoort bij een aantal dat niet heel is.
const tussen = (vals, a, b) =>
  until(
    () => {
      const dp = [0, 1, 2].find((n) => [a, b, ...vals].every((x) => isNice(x, n))) ?? 2,
        step = 10 ** -dp,
        i = ri(0, vals.length - 2),
        lo = Math.min(vals[i], vals[i + 1]),
        hi = Math.max(vals[i], vals[i + 1]);
      return rd(lo + step * ri(1, Math.max(1, Math.round((hi - lo) / step) - 1)), 6);
    },
    (bad) => !isNice((bad - a) / b, 0),
  );

// Hint en uitwerking bij een foute uitkomst waar geen heel aantal bij hoort. up: stijgende formule.
const geenHeel = (c, up, a, b, bad) => {
  const k = rd(Math.abs(bad - a) / b, 6);
  return {
    hint: T(`Reken bij elke uitkomst uit bij welk ${c.x} die hoort. Een aantal is een heel getal.`),
    steps: [
      `${c.x} = (${d(up ? bad : a)} - ${d(up ? a : bad)}) : ${d(b)} ${ap(k, 2)}`,
      `Dat is geen heel aantal, dus ${amd(c, bad)} kan niet.`,
    ],
  };
};

function wfCannot() {
  if (coin()) {
    const { c, a, b, t } = until(
      () => {
        const c = pick(DOWN),
          a = pick(c.a),
          b = pick(c.b);
        return { c, a, b, t: rd(a / b, 6) };
      },
      ({ t }) => isNice(t, 0) && t >= 5,
    );
    const goods = [
      ri(1, Math.floor(t / 3)),
      ri(Math.floor(t / 3) + 1, Math.floor((2 * t) / 3)),
      ri(Math.floor((2 * t) / 3) + 1, t - 1),
    ];
    if (c.heel && coin()) {
      const ys = goods.map((k) => rd(a - b * k, 6)),
        bad = tussen(ys, a, b),
        opts = [bad, ...ys].map((x) => T(amt(c, x)));
      return {
        q: T(`${c.wat} ${c.y} = ${d(a)} - ${d(b)} · ${c.x}. ${c.welk}`),
        mc: MC(opts, 0),
        ...geenHeel(c, false, a, b, bad),
        traps: [
          {
            id: 'kan-wel',
            f: (v) => v[0] !== opts[0],
            m: 'Reken uit bij welk aantal die uitkomst hoort. Is dat een heel getal, dan kan het wel.',
          },
        ],
        v: () =>
          !isNice((a - bad) / b, 0) &&
          bad > Math.min(...ys) &&
          bad < Math.max(...ys) &&
          goods.every((k) => isNice(k, 0) && a - b * k > 0),
      };
    }
    const bad = t + ri(1, 5),
      bb = rd(b * bad, 6),
      y = rd(a - bb, 6),
      opts = [bad, ...goods].map((k) => T(String(k)));
    return {
      q: T(
        `${c.wat} ${c.y} = ${d(a)} - ${d(b)} · ${c.x}. Voor welk ${c.x} kun je deze formule niet gebruiken?`,
      ),
      mc: MC(opts, 0),
      hint: T('Vul elk aantal in de formule in. Welke uitkomst kan niet?'),
      steps: [
        `${c.y} = ${d(a)} - ${d(b)} · ${bad} = ${d(a)} - ${d(bb)} = ${d(y)}`,
        `${c.kanNiet(amd(c, y))} ${c.op(t)}`,
      ],
      traps: [
        {
          id: 'kan-wel',
          f: (v) => v[0] !== opts[0],
          m: 'Vul dat aantal in de formule in. Komt er geen negatief getal uit, dan kan het wel.',
        },
      ],
      v: () => a - b * bad < 0 && goods.every((k) => a - b * k > 0),
    };
  }
  const c = pick(UP),
    a = pick(c.a),
    b = pick(c.b),
    ks = [ri(1, 3), ri(4, 6), ri(7, 10)],
    goods = ks.map((k) => rd(a + b * k, 6));
  if (c.heel && coin()) {
    const bad = tussen(goods, a, b),
      opts = [bad, ...goods].map((x) => T(amt(c, x)));
    return {
      q: T(`${c.wat} ${c.y} = ${d(a)} + ${d(b)} · ${c.x}. ${c.welk}`),
      mc: MC(opts, 0),
      ...geenHeel(c, true, a, b, bad),
      traps: [
        {
          id: 'kan-wel',
          f: (v) => v[0] !== opts[0],
          m: 'Reken uit bij welk aantal die uitkomst hoort. Is dat een heel getal, dan kan het wel.',
        },
      ],
      v: () =>
        !isNice((bad - a) / b, 0) &&
        bad > Math.min(...goods) &&
        bad < Math.max(...goods) &&
        goods.every((g) => isNice((g - a) / b, 0) && (g - a) / b > 0),
    };
  }
  const bad = ri(1, a - 1),
    opts = [bad, ...goods].map((x) => T(amt(c, x)));
  return {
    q: T(`${c.wat} ${c.y} = ${d(a)} + ${d(b)} · ${c.x}. ${c.welk}`),
    mc: MC(opts, 0),
    hint: T(`Kijk naar het vaste getal ${d(a)} vooraan. Daar komt altijd iets bij.`),
    steps: [c.nooit(amt(c, a)), `${amt(c, bad)} is minder, dus dat kan niet.`],
    traps: [
      {
        id: 'kan-wel',
        f: (v) => v[0] !== opts[0],
        m: 'Bij die uitkomst hoort een aantal dat kan. Kijk naar het vaste getal vooraan in de formule.',
      },
    ],
    // Bij de goede uitkomsten is het aantal heel en positief, bij de foute negatief.
    v: () =>
      (bad - a) / b < 0 &&
      goods.every((g) => {
        const k = (g - a) / b;
        return k > 0 && isNice(k, 0);
      }),
  };
}

export default {
  slug: 'woordformules',
  title: 'Woordformules',
  intro:
    'In een woordformule staan woorden in plaats van letters, zoals prijs = 5 + 2 · aantal stuks. Hier leer je invullen, zelf een woordformule opstellen en terugrekenen.',
  description:
    'Woordformules oefenen: invullen, een woordformule opstellen bij een verhaal en terugrekenen naar het aantal. Gratis met uitleg, hints en uitwerkingen.',
  videos: {},
  skills: [
    [133, 'Woordformule invullen', wfFill],
    [134, 'Dalende woordformule', wfDown],
    [135, 'Woordformule opstellen', wfMake],
    [136, 'Aantal terugrekenen', wfBack],
    [137, 'Welke waarde kan niet?', wfCannot],
  ],
  learn: [
    {
      t: 'Invullen in een woordformule',
      p: [
        T(
          'Een {{=woordformule|woordformule}} zegt hoe je iets uitrekent. De eenheid staat in de zin, niet in de formule. Vul het aantal in. Reken eerst de keer uit en tel daarna op.',
        ),
      ],
      ex: {
        q: T(
          'Voor de rekening in euro van een kinderfeestje in een speeltuin geldt rekening = 9 + 4 · aantal kinderen. Er komen 5 kinderen.',
        ),
        steps: ['rekening = 9 + 4 · 5 = 9 + 20 = 29', 'De rekening is 29 euro.'],
      },
      watch: T('Reken 9 + 4 · 5 niet uit als 13 · 5. Eerst de keer, dan de plus.'),
    },
    {
      t: 'Een formule die daalt',
      p: [
        T(
          'Gaat er elke keer iets af, dan staat er een min in de formule. Ook dan reken je eerst de keer uit en trek je daarna af.',
        ),
      ],
      ex: {
        q: T(
          'Voor de hoogte in cm van een sneeuwpop geldt hoogte = 34 - 4 · aantal uren. Bereken de hoogte na {3 1/2} uur.',
        ),
        steps: ['hoogte = 34 - 4 · {3 1/2} = 34 - 14 = 20', 'De sneeuwpop is dan 20 cm hoog.'],
      },
    },
    {
      t: 'Een woordformule opstellen',
      p: [
        T(
          'Vooraan staat het getal waarmee je begint, zoals een vast bedrag. Dan een plus als er elke keer iets bij komt, of een min als er elke keer iets af gaat. Daarna het getal per keer, keer het aantal.',
        ),
      ],
      ex: {
        q: T(
          'Een atelier rekent 6 euro voor de verf en 4 euro per uur schilderles. Stel een woordformule op voor de kosten in euro.',
        ),
        steps: ['kosten = 6 + 4 · aantal uren'],
      },
    },
    {
      t: 'Terugrekenen',
      p: [
        T(
          'Weet je de uitkomst en zoek je het aantal? Haal dan eerst het vaste getal eraf. Deel daarna door het getal per keer.',
        ),
      ],
      ex: {
        q: T('Bij kosten = 6 + 4 · aantal uren betaal je 22 euro. Hoeveel uur is dat?'),
        steps: ['22 - 6 = 16', '16 : 4 = 4', 'Je hebt 4 uur schilderles gehad.'],
      },
      watch: T('Deel niet eerst: 22 : 4 - 6 klopt niet.'),
    },
    {
      t: 'Waarden die niet kunnen',
      p: [
        T(
          'Een aantal kan niet negatief zijn. En is de sneeuwpop gesmolten, dan kun je de formule niet meer gebruiken. Komt er bij invullen iets uit dat niet kan, dan past die waarde niet.',
        ),
      ],
    },
  ],
};
