// Onderwerp: Piramide. Vraaggeneratoren staan bovenaan, de uitleg en de lijst met vraagsoorten onderaan.
import { pick, coin, shuffle, until, near, d } from '../math.js';
import { F, MC, H, HOEK } from './shared.js';
import { T, esc } from '../typeset.js';
import { and, cap, attr } from '../figures.js';
import { solid, solidFacts } from '../ruimtefiguren.js';

const WOORD = {
  2: 'twee',
  3: 'drie',
  4: 'vier',
  5: 'vijf',
  6: 'zes',
  7: 'zeven',
  8: 'acht',
  9: 'negen',
  10: 'tien',
  11: 'elf',
  12: 'twaalf',
};
// De vorm van het grondvlak in een zin. Een vierhoek is een vierkant of een rechthoek.
const vormVan = (n) => (n === 4 ? pick(['vierkant', 'rechthoek']) : HOEK[n]);
const SOORTEN = ['zijvlakken', 'ribben', 'hoekpunten'];
const EEN = { zijvlakken: 'zijvlak', ribben: 'ribbe', hoekpunten: 'hoekpunt' };

// Letters bij de hoekpunten: eerst de top, dan het grondvlak, tegen de klok in. Het grondvlak staat
// op alfabetische volgorde, zodat de naam van een ribbe uit solidFacts al op volgorde staat.
const LETTERS = ['TGHIJKL', 'TLMNOPQ', 'SHIJKLM', 'MQRSTUV', 'EOPQRST', 'TBCDEFG'];

// De aantallen van een piramide en een prisma met een n-hoek als grondvlak.
const piramideTal = (n) => ({ zijvlakken: n + 1, ribben: 2 * n, hoekpunten: n + 1 });
const prismaTal = (n) => ({ zijvlakken: n + 2, ribben: 3 * n, hoekpunten: 2 * n });
const tal = (soort, n) => (soort === 'prisma' ? prismaTal(n) : piramideTal(n));

// De controle telt op een andere manier: uit de vlakken. Elke ribbe hoort bij twee vlakken, dus de
// ribben zijn de helft van alle zijden van alle vlakken samen. De hoekpunten volgen uit
// hoekpunten + zijvlakken - ribben = 2. Tot een achthoek telt solidFacts ook alles in de figuur.
function telUitVlakken(soort, n) {
  const vlakken = soort === 'piramide' ? [n, ...Array(n).fill(3)] : [n, n, ...Array(n).fill(4)];
  const ribben = vlakken.reduce((s, k) => s + k, 0) / 2;
  return { zijvlakken: vlakken.length, ribben, hoekpunten: ribben - vlakken.length + 2 };
}
function klopt(soort, n, c) {
  const a = telUitVlakken(soort, n),
    gelijk = (b) => SOORTEN.every((k) => b[k] === c[k]);
  if (!gelijk(a)) return false;
  if (n > 8) return true;
  const f = solidFacts({ kind: soort, n, letters: false });
  return gelijk({
    zijvlakken: f.faces.length,
    ribben: f.edges.length,
    hoekpunten: f.vertices.length,
  });
}

// Valkuilen bij het tellen van een piramide. at(soort) is het veld van die soort, of -1. Met extra
// komt er bij prisma-geteld nog een eigen voorwaarde bij.
function telValkuilen(n, at, extra) {
  const x = (v, k) => (at(k) >= 0 ? v[at(k)] : undefined),
    has = (k) => at(k) >= 0;
  return [
    has('ribben') &&
      has('hoekpunten') && {
        id: 'hoekpunten-en-ribben-verwisseld',
        f: (v) => x(v, 'ribben') === n + 1 && x(v, 'hoekpunten') === 2 * n,
        m: 'Je hebt de hoekpunten en de ribben verwisseld. Een hoekpunt is een punt, een ribbe is een lijnstuk tussen twee hoekpunten.',
      },
    has('zijvlakken') && {
      id: 'grondvlak-vergeten',
      f: (v) => x(v, 'zijvlakken') === n,
      m: `Het grondvlak is ook een zijvlak. Dus ${n} opstaande zijvlakken en het grondvlak: ${n} + 1 = ${n + 1} zijvlakken.`,
    },
    has('ribben') && {
      id: 'ribben-grondvlak-vergeten',
      f: (v) => x(v, 'ribben') === n,
      m: `Tel ook de ribben van het grondvlak mee: ${n} opstaande ribben en ${n} ribben van het grondvlak.`,
    },
    has('hoekpunten') && {
      id: 'top-niet-meegeteld',
      f: (v) => x(v, 'hoekpunten') === n,
      m: `De top is ook een hoekpunt. Dus ${n} hoekpunten van het grondvlak en de top: ${n} + 1 = ${n + 1}.`,
    },
    {
      id: 'prisma-geteld',
      f: (v) =>
        x(v, 'zijvlakken') === n + 2 ||
        x(v, 'ribben') === 3 * n ||
        x(v, 'hoekpunten') === 2 * n ||
        (extra ? extra(v) : false),
      m: 'Zo tel je bij een prisma. Een piramide heeft geen bovenvlak, maar een top. Daar komen alle opstaande ribben samen.',
    },
  ].filter(Boolean);
}
// De stappen bij het tellen van een piramide.
const telStap = {
  zijvlakken: (n) =>
    `Zijvlakken: het grondvlak en ${n} opstaande zijvlakken. Dat zijn 1 + ${n} = ${n + 1} zijvlakken.`,
  ribben: (n) =>
    `Ribben: ${n} van het grondvlak en ${n} opstaande ribben. Dat zijn ${n} + ${n} = ${2 * n} ribben.`,
  hoekpunten: (n) =>
    `Hoekpunten: ${n} van het grondvlak en de top. Dat zijn ${n} + 1 = ${n + 1} hoekpunten.`,
};
const prismaStap = {
  zijvlakken: (n) =>
    `het grondvlak, het bovenvlak en ${n} rechthoeken. Dat zijn 2 + ${n} = ${n + 2} zijvlakken`,
  ribben: (n) =>
    `${n} ribben in het grondvlak, ${n} in het bovenvlak en ${n} opstaande ribben. Dat zijn 3 * ${n} = ${3 * n} ribben`,
  hoekpunten: (n) =>
    `${n} hoekpunten in het grondvlak en ${n} in het bovenvlak. Dat zijn 2 * ${n} = ${2 * n} hoekpunten`,
};
const piramideStap = {
  zijvlakken: (n) =>
    `het grondvlak en ${n} opstaande zijvlakken. Dat zijn 1 + ${n} = ${n + 1} zijvlakken`,
  ribben: (n) =>
    `${n} ribben in het grondvlak en ${n} opstaande ribben. Dat zijn 2 * ${n} = ${2 * n} ribben`,
  hoekpunten: (n) =>
    `${n} hoekpunten in het grondvlak en de top. Dat zijn ${n} + 1 = ${n + 1} hoekpunten`,
};

// ---------------------------------------------------------------------------------------------
// 174: een piramide herkennen en benoemen.

function s174() {
  const n = pick([3, 4, 5, 6]),
    L = pick(LETTERS).slice(0, n + 1),
    top = L[0],
    base = L.slice(1),
    shape = { kind: 'piramide', n, h: 3, r: n >= 5 ? 2.5 : 2, letters: L },
    f = solidFacts(shape),
    fig = solid(shape),
    name = `piramide ${L}`,
    up = f.edges.filter((e) => e.includes(top)),
    low = f.edges.filter((e) => !e.includes(top)).sort(),
    sides = f.faces.filter((w) => w.includes(top));
  // De controle kijkt in de hoekpunten van de figuur: de top ligt het hoogst, het grondvlak ligt
  // plat op hoogte 0, de letters gaan tegen de klok in, en tussen buren in het grondvlak en tussen
  // de top en elk hoekpunt van het grondvlak loopt een ribbe.
  const z = (k) => f.pts[k][2],
    isEdge = (p, q) => f.edges.includes(p + q) || f.edges.includes(q + p),
    hi = f.vertices.reduce((p, k) => (z(k) > z(p) ? k : p)),
    flat = f.vertices.filter((k) => near(z(k), 0, 1e-9)).join(''),
    area = [...flat].reduce((s, k, i) => {
      const p = f.pts[k],
        q = f.pts[flat[(i + 1) % flat.length]];
      return s + p[0] * q[1] - q[0] * p[1];
    }, 0),
    ok = () =>
      hi === top &&
      flat === base &&
      area > 0 &&
      [...base].every((k, i) => isEdge(k, base[(i + 1) % n]) && isEdge(top, k));
  const type = pick(n >= 4 ? ['naam', 'delen', 'ribben', 'zijvlak'] : ['naam', 'delen', 'ribben']);
  const intro = 'Hieronder staat een piramide.';

  if (type === 'naam') {
    const swapped = top + base[0] + base[2] + base[1] + base.slice(3),
      wrongs = shuffle(
        [
          [
            `piramide ${base}${top}`,
            'top-niet-voorop',
            `Bij een piramide zet je de top voorop. Dus ${name}.`,
          ],
          [
            `piramide ${base}`,
            'top-vergeten',
            `${base} is alleen het grondvlak. Zet de top ${top} ervoor: ${name}.`,
          ],
          n >= 4 && [
            `piramide ${swapped}`,
            'niet-rondom',
            `Je noemt de letters van het grondvlak rondom, tegen de klok in. Hier staan ${base[1]} en ${base[2]} verkeerd om.`,
          ],
          [
            `piramide ${top}${base.slice(0, -1)}`,
            'hoekpunt-vergeten',
            `Hier mist hoekpunt ${base[n - 1]}. Noem de top en alle hoekpunten van het grondvlak.`,
          ],
        ].filter(Boolean),
      ).slice(0, 3),
      opts = [name, ...wrongs.map((w) => w[0])].map(T);
    return {
      q: T(`${intro} Welke naam hoort bij deze piramide?`),
      fig,
      mc: MC(opts, 0),
      hint: 'Bij een piramide noem je eerst de top. Daarna noem je de hoekpunten van het grondvlak, rondom.',
      steps: [
        `De top is ${top}. Daar komen alle opstaande ribben samen.`,
        `Het grondvlak is ${base}. De letters gaan rondom, tegen de klok in.`,
        `Je zet de top voorop, dus ${name}.`,
      ],
      traps: wrongs.map(([w, id, m], i) => ({ id, f: (v) => v[0] === opts[i + 1], m })),
      v: () => ok() && name === `piramide ${hi}${flat}`,
    };
  }

  if (type === 'delen') {
    const faceOpts = [base, ...shuffle(sides).slice(0, 2)].sort();
    return {
      q: T(
        `Hieronder staat ${name}. Welk punt is de top? Welk vlak is het grondvlak? Hoeveel opstaande zijvlakken en hoeveel opstaande ribben heeft de piramide?`,
      ),
      fig,
      fields: [
        { sel: [...L].sort(), a: top, pre: 'De top is', label: 'De top' },
        { sel: faceOpts, a: base, pre: 'Het grondvlak is', label: 'Het grondvlak', br: true },
        { ...F('Opstaande zijvlakken:', n), br: true },
        { ...F('Opstaande ribben:', n), br: true },
      ],
      hint: 'De top is het hoekpunt dat niet in het grondvlak ligt. De opstaande zijvlakken en de opstaande ribben gaan van het grondvlak naar de top.',
      steps: [
        `In de naam ${name} staat de top voorop. De top is ${top}.`,
        `Het grondvlak is ${base}: het vlak zonder de top.`,
        `Bij elke zijde van het grondvlak hoort een opstaand zijvlak. Dat zijn er ${n}.`,
        `Bij elk hoekpunt van het grondvlak hoort een opstaande ribbe naar ${top}. Dat zijn er ${n}.`,
      ],
      traps: [
        {
          id: 'hoekpunt-van-grondvlak',
          f: (v) => [...base].includes(v[0]),
          m: `Dit hoekpunt ligt in het grondvlak. De top is het hoekpunt waar alle opstaande ribben samenkomen. Bij een piramide staat de top voorop in de naam.`,
        },
        {
          id: 'opstaand-zijvlak-gekozen',
          f: (v) => sides.includes(v[1]),
          m: `Dit is een opstaand zijvlak, want de top ${top} zit erin. Het grondvlak is het vlak zonder de top.`,
        },
        {
          id: 'grondvlak-meegeteld',
          f: (v) => v[2] === n + 1,
          m: 'Het grondvlak is geen opstaand zijvlak. Tel alleen de driehoeken met de top erin.',
        },
        {
          id: 'ribben-grondvlak-meegeteld',
          f: (v) => v[3] === 2 * n,
          m: `De ribben van het grondvlak zijn geen opstaande ribben. Een opstaande ribbe gaat van het grondvlak naar de top ${top}.`,
        },
      ],
      v: () =>
        ok() &&
        sides.length === n &&
        sides.every((w) => w.length === 3) &&
        f.edges.filter((e) => e.includes(hi)).length === n,
    };
  }

  if (type === 'ribben') {
    const right = and(up),
      drop = up.find((e) => f.hidden.includes(e)) ?? up[n - 1],
      fewer = and(up.filter((e) => e !== drop)),
      j = pick(up.map((_, i) => i)),
      other = pick(low),
      mixed = and(up.map((e, i) => (i === j ? other : e))),
      opts = [right, and(low), fewer, mixed].map(T);
    return {
      q: T(`Hieronder staat ${name}. Welke ribben zijn de opstaande ribben?`),
      fig,
      mc: MC(opts, 0),
      hint: `Een opstaande ribbe gaat van een hoekpunt van het grondvlak naar de top ${top}.`,
      steps: [
        `De top is ${top}, want die staat voorop in de naam.`,
        `Van elk hoekpunt van het grondvlak gaat een opstaande ribbe naar ${top}. Dat zijn er ${n}.`,
        `Dus de opstaande ribben zijn ${right}.`,
      ],
      traps: [
        {
          id: 'ribben-van-grondvlak',
          f: (v) => v[0] === opts[1],
          m: `Dit zijn de ribben van het grondvlak ${base}. Een opstaande ribbe gaat naar de top ${top}.`,
        },
        {
          id: 'opstaande-ribbe-vergeten',
          f: (v) => v[0] === opts[2],
          m: f.hidden.includes(drop)
            ? `Ribbe ${drop} is gestippeld, omdat je die in werkelijkheid niet ziet. Maar het is ook een opstaande ribbe.`
            : `Ribbe ${drop} gaat ook naar de top. Er zijn ${n} opstaande ribben.`,
        },
        {
          id: 'grondvlakribbe-erbij',
          f: (v) => v[0] === opts[3],
          m: `Ribbe ${other} ligt in het grondvlak. Een opstaande ribbe gaat naar de top ${top}.`,
        },
      ],
      v: () =>
        ok() &&
        up.length === n &&
        up.every((e) => [...e].some((k) => near(z(k), 0, 1e-9)) && e.includes(hi)) &&
        low.every((e) => [...e].every((k) => near(z(k), 0, 1e-9))) &&
        new Set(opts).size === 4,
    };
  }

  // Een opstaand zijvlak kiezen.
  const right = pick(sides),
    wrongs = [
      [
        base,
        'grondvlak-gekozen',
        `${base} is het grondvlak. Een opstaand zijvlak is een driehoek met de top ${top} erin.`,
      ],
      [
        top + base[0] + base[2],
        'geen-zijvlak',
        `Tussen ${base[0]} en ${base[2]} loopt geen ribbe, want ze liggen niet naast elkaar. Een opstaand zijvlak heeft de top en twee hoekpunten van het grondvlak die naast elkaar liggen.`,
      ],
      [
        base.slice(0, 3),
        'top-vergeten',
        `Een opstaand zijvlak heeft de top ${top} erin. Deze drie hoekpunten liggen allemaal in het grondvlak.`,
      ],
    ],
    opts = [right, ...wrongs.map((w) => w[0])].map(T);
  return {
    q: T(`Hieronder staat ${name}. Welk vlak is een opstaand zijvlak?`),
    fig,
    mc: MC(opts, 0),
    hint: 'Een opstaand zijvlak is een driehoek. Daarin zitten de top en twee hoekpunten van het grondvlak die naast elkaar liggen.',
    steps: [
      `De top is ${top} en het grondvlak is ${base}.`,
      `In ${right} zitten de top ${top} en de hoekpunten ${right[1]} en ${right[2]}. Die liggen naast elkaar in het grondvlak.`,
      `Dus ${right} is een opstaand zijvlak.`,
    ],
    traps: wrongs.map(([, id, m], i) => ({ id, f: (v) => v[0] === opts[i + 1], m })),
    v: () =>
      ok() &&
      right[0] === hi &&
      isEdge(right[1], right[2]) &&
      !isEdge(base[0], base[2]) &&
      f.faces.includes(right) &&
      !f.faces.includes(top + base[0] + base[2]),
  };
}

// ---------------------------------------------------------------------------------------------
// 175: zijvlakken, ribben en hoekpunten tellen, en terugredeneren.

// Voorwerpen met de vorm van een piramide: [onbepaald, bepaald].
const DINGEN = [
  ['Een kaars', 'de kaars'],
  ['Een kerstboomhanger van glas', 'de hanger'],
  ['Een presse-papier van glas', 'de presse-papier'],
  ['Een stuk zeep', 'het stuk zeep'],
  ['Een theelichthouder', 'de theelichthouder'],
];

function s175() {
  const type = pick(['figuur', 'tekst', 'terug']);
  if (type !== 'terug') {
    const fig = type === 'figuur',
      n = fig ? pick([3, 4, 5, 6]) : pick([3, 4, 5, 6, 7, 8, 9, 10, 12]),
      g = vormVan(n),
      thing = !fig && coin() ? pick(DINGEN) : null,
      c = piramideTal(n),
      parts = shuffle(SOORTEN),
      at = (k) => parts.indexOf(k),
      fields = parts.map((k, i) => ({ ...F(`${cap(k)}:`, c[k]), ...(i ? { br: true } : {}) }));
    return {
      q: T(
        fig
          ? `Hieronder staat een piramide. Hoeveel ${and(parts)} heeft deze piramide?`
          : thing
            ? `${thing[0]} heeft de vorm van een piramide met een ${g} als grondvlak. Hoeveel ${and(parts)} heeft ${thing[1]}?`
            : `Een piramide heeft een ${g} als grondvlak. Hoeveel ${and(parts)} heeft de piramide?`,
      ),
      ...(fig
        ? {
            fig: solid({
              kind: 'piramide',
              n,
              h: 3,
              r: n >= 5 ? 2.5 : 2,
              letters: false,
              counts: false,
            }),
          }
        : {}),
      fields,
      hint: 'Begin bij het grondvlak. Bij elke zijde van het grondvlak hoort een opstaand zijvlak, en bij elk hoekpunt een opstaande ribbe. Vergeet het grondvlak en de top niet.',
      steps: [
        `Het grondvlak is een ${HOEK[n]}. Het heeft ${n} hoekpunten en ${n} zijden.`,
        ...parts.map((k) => telStap[k](n)),
      ],
      traps: telValkuilen(n, at),
      v: () => klopt('piramide', n, c),
    };
  }
  // Terugredeneren: uit één aantal het grondvlak en de andere aantallen.
  const n = pick([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    given = pick(SOORTEN),
    c = piramideTal(n),
    val = c[given],
    rest = SOORTEN.filter((k) => k !== given),
    at = (k) => (k === given ? -1 : 1 + rest.indexOf(k)),
    // Wat je krijgt als je terugrekent zoals bij een prisma.
    asPrism = { ribben: val / 3, zijvlakken: val - 2, hoekpunten: val / 2 }[given],
    prismN = Number.isInteger(asPrism) && asPrism >= 3 ? asPrism : null;
  const first = {
    ribben: {
      id: 'ribben-is-hoeken',
      m: `Een piramide met een ${HOEK[n]} als grondvlak heeft niet ${val} maar ${2 * n} ribben. Het grondvlak heeft evenveel ribben als er opstaande ribben zijn. Deel het aantal ribben dus door 2.`,
      steps: [
        `Er zijn evenveel ribben in het grondvlak als opstaande ribben. Samen ${val}, dus elk de helft.`,
        `${val} : 2 = ${n}, dus het grondvlak heeft ${n} hoekpunten. Het is een ${HOEK[n]}.`,
      ],
    },
    zijvlakken: {
      id: 'grondvlak-meegeteld',
      m: `Eén van de ${val} zijvlakken is het grondvlak. De andere zijn de opstaande zijvlakken, één bij elke zijde van het grondvlak.`,
      steps: [
        `Eén zijvlak is het grondvlak. Er zijn dus ${val} - 1 = ${n} opstaande zijvlakken.`,
        `Bij elke zijde van het grondvlak hoort één opstaand zijvlak. Dus het grondvlak heeft ${n} zijden en ${n} hoekpunten. Het is een ${HOEK[n]}.`,
      ],
    },
    hoekpunten: {
      id: 'top-meegeteld',
      m: 'Eén van de hoekpunten is de top. Die ligt niet in het grondvlak.',
      steps: [
        `Eén hoekpunt is de top. De andere ${val} - 1 = ${n} hoekpunten liggen in het grondvlak.`,
        `Het grondvlak is dus een ${HOEK[n]}.`,
      ],
    },
  }[given];
  return {
    q: T(
      `Een piramide heeft ${val} ${given}. Hoeveel hoekpunten heeft het grondvlak? Hoeveel ${and(rest)} heeft de piramide?`,
    ),
    fields: [
      F('Hoekpunten van het grondvlak:', n),
      ...rest.map((k) => ({ ...F(`${cap(k)} van de piramide:`, c[k]), br: true })),
    ],
    hint: 'Een piramide met een n-hoek als grondvlak heeft n + 1 zijvlakken, 2 * n ribben en n + 1 hoekpunten. Reken terug naar het grondvlak.',
    steps: [...first.steps, ...rest.map((k) => telStap[k](n))],
    traps: [
      { id: first.id, f: (v) => v[0] === val, m: first.m },
      ...telValkuilen(n, at, prismN ? (v) => v[0] === prismN : null),
    ],
    v: () => klopt('piramide', n, c) && telUitVlakken('piramide', n)[given] === val,
  };
}

// ---------------------------------------------------------------------------------------------
// 176: prisma en piramide met hetzelfde grondvlak vergelijken.

const ART = { prisma: 'het prisma', piramide: 'de piramide' };
// Foute aantallen bij het tellen: [fout getal, id van de valkuil, bericht].
const PRISMA_FOUT = {
  zijvlakken: (n) => [
    n + 1,
    'bovenvlak-vergeten',
    `Een prisma heeft een grondvlak en ook een bovenvlak. Met de ${n} rechthoeken zijn dat ${n + 2} zijvlakken.`,
  ],
  ribben: (n) => [
    2 * n,
    'ribben-bovenvlak-vergeten',
    `Een prisma heeft ${n} ribben in het grondvlak, ${n} in het bovenvlak en ${n} opstaande ribben. Dat zijn ${3 * n} ribben.`,
  ],
  hoekpunten: (n) => [
    n,
    'hoekpunten-bovenvlak-vergeten',
    `Ook het bovenvlak van een prisma heeft ${n} hoekpunten. Dus ${n} + ${n} = ${2 * n}.`,
  ],
};
const PIRAMIDE_FOUT = {
  zijvlakken: (n) => [
    n,
    'grondvlak-vergeten',
    `Het grondvlak van de piramide is ook een zijvlak. Dus ${n} + 1 = ${n + 1} zijvlakken.`,
  ],
  ribben: (n) => [
    n,
    'ribben-grondvlak-vergeten',
    `Tel bij de piramide ook de ribben van het grondvlak mee: ${n} + ${n} = ${2 * n} ribben.`,
  ],
  hoekpunten: (n) => [
    n,
    'top-niet-meegeteld',
    `De top van de piramide is ook een hoekpunt. Dus ${n} + 1 = ${n + 1} hoekpunten.`,
  ],
};
const FOUT = { prisma: PRISMA_FOUT, piramide: PIRAMIDE_FOUT };
// Terugrekenen van een aantal naar het aantal hoekpunten van het grondvlak.
const TERUG = {
  prisma: {
    zijvlakken: (v) => v - 2,
    ribben: (v) => v / 3,
    hoekpunten: (v) => v / 2,
  },
  piramide: {
    zijvlakken: (v) => v - 1,
    ribben: (v) => v / 2,
    hoekpunten: (v) => v - 1,
  },
};
const TERUG_STAP = {
  prisma: {
    zijvlakken: (v, n) =>
      `Een prisma heeft een grondvlak, een bovenvlak en een rechthoek bij elke zijde van het grondvlak. ${v} - 2 = ${n}.`,
    ribben: (v, n) =>
      `Een prisma heeft drie keer zoveel ribben als het grondvlak zijden heeft: in het grondvlak, in het bovenvlak en opstaand. ${v} : 3 = ${n}.`,
    hoekpunten: (v, n) =>
      `Een prisma heeft twee keer zoveel hoekpunten als het grondvlak: in het grondvlak en in het bovenvlak. ${v} : 2 = ${n}.`,
  },
  piramide: {
    zijvlakken: (v, n) =>
      `Een piramide heeft een grondvlak en een driehoek bij elke zijde van het grondvlak. ${v} - 1 = ${n}.`,
    ribben: (v, n) =>
      `Een piramide heeft twee keer zoveel ribben als het grondvlak zijden heeft: in het grondvlak en opstaand. ${v} : 2 = ${n}.`,
    hoekpunten: (v, n) =>
      `Een piramide heeft de hoekpunten van het grondvlak en de top. ${v} - 1 = ${n}.`,
  },
};
const WAAROM = {
  zijvlakken:
    'Het prisma heeft een bovenvlak en de piramide niet. Daarom heeft het prisma altijd 1 zijvlak meer.',
  ribben: (n) =>
    `Het prisma heeft ook de ribben van het bovenvlak. Daarom heeft het prisma er ${n} meer: evenveel als het grondvlak zijden heeft.`,
  hoekpunten: (n) =>
    `Het prisma heeft ${n} hoekpunten in het bovenvlak, de piramide alleen de top. Dat scheelt ${n} - 1 = ${n - 1}.`,
};

function s176() {
  const n = pick([3, 4, 5, 7, 9, 10]),
    g = vormVan(n),
    P = prismaTal(n),
    Q = piramideTal(n);
  if (coin()) {
    // De aantallen naast elkaar en het verschil.
    const k = pick(SOORTEN),
      diff = P[k] - Q[k],
      [wp, idp, mp] = PRISMA_FOUT[k](n),
      [wq, idq, mq] = PIRAMIDE_FOUT[k](n);
    return {
      q: T(
        `Een prisma en een piramide hebben hetzelfde grondvlak: een ${g}. Hoeveel ${k} heeft het prisma? Hoeveel ${k} heeft de piramide? Hoeveel ${k} heeft het prisma meer dan de piramide?`,
      ),
      fields: [
        F(`${cap(k)} van het prisma:`, P[k]),
        { ...F(`${cap(k)} van de piramide:`, Q[k]), br: true },
        { ...F('Het prisma heeft', diff, `${k} meer`), label: `Zoveel ${k} meer`, br: true },
      ],
      hint: 'Een prisma heeft een grondvlak en een bovenvlak. Een piramide heeft een grondvlak en een top. Tel bij allebei vanuit het grondvlak.',
      steps: [
        `Het grondvlak is een ${HOEK[n]}, met ${n} hoekpunten en ${n} zijden.`,
        `Het prisma: ${prismaStap[k](n)}.`,
        `De piramide: ${piramideStap[k](n)}.`,
        `Het prisma heeft ${P[k]} - ${Q[k]} = ${diff} ${diff === 1 ? EEN[k] : k} meer.`,
        typeof WAAROM[k] === 'string' ? WAAROM[k] : WAAROM[k](n),
      ],
      traps: [
        {
          id: 'prisma-en-piramide-verwisseld',
          f: (v) => v[0] === Q[k] && v[1] === P[k],
          m: 'Je hebt het prisma en de piramide verwisseld. Een prisma heeft een bovenvlak, een piramide een top.',
        },
        { id: idp, f: (v) => v[0] === wp || v[2] === wp - Q[k], m: mp },
        { id: idq, f: (v) => v[1] === wq || v[2] === P[k] - wq, m: mq },
      ],
      v: () =>
        klopt('prisma', n, P) &&
        klopt('piramide', n, Q) &&
        telUitVlakken('prisma', n)[k] - telUitVlakken('piramide', n)[k] === diff,
    };
  }
  // Terugredeneren: uit een aantal van de ene ruimtefiguur het grondvlak en de andere ruimtefiguur.
  const fig = pick(['prisma', 'piramide']),
    other = fig === 'prisma' ? 'piramide' : 'prisma',
    k = pick(SOORTEN),
    val = tal(fig, n)[k],
    O = tal(other, n),
    wrongN = TERUG[other][k](val),
    fouten = SOORTEN.map((s) => FOUT[other][s](n));
  return {
    q: T(
      `Een ${fig} heeft ${val} ${k}. Een ${other} heeft hetzelfde grondvlak. Hoeveel hoekpunten heeft het grondvlak? Hoeveel zijvlakken, ribben en hoekpunten heeft ${ART[other]}?`,
    ),
    fields: [
      F('Hoekpunten van het grondvlak:', n),
      ...SOORTEN.map((s) => ({ ...F(`${cap(s)} van ${ART[other]}:`, O[s]), br: true })),
    ],
    hint: `Reken eerst terug naar het grondvlak. Tel daarna de ${other} vanuit het grondvlak.`,
    steps: [
      TERUG_STAP[fig][k](val, n),
      `Het grondvlak heeft ${n} hoekpunten. Het is een ${HOEK[n]}.`,
      ...SOORTEN.map((s) =>
        cap(`${ART[other]}: ${(other === 'prisma' ? prismaStap : piramideStap)[s](n)}.`),
      ),
    ],
    traps: [
      {
        id: 'aantal-is-geen-hoeken',
        f: (v) => v[0] === val,
        m: `${val} is het aantal ${k} van ${ART[fig]}, niet het aantal hoekpunten van het grondvlak. Reken terug.`,
      },
      Number.isInteger(wrongN) &&
        wrongN >= 3 &&
        wrongN !== n &&
        wrongN !== val && {
          id: 'prisma-en-piramide-verwisseld',
          f: (v) => v[0] === wrongN,
          m: `Je hebt teruggerekend alsof het een ${other} is. ${TERUG_STAP[fig][k](val, n)}`,
        },
      ...fouten.map(([w, id, m], i) => ({ id, f: (v) => v[1 + i] === w, m })),
    ].filter(Boolean),
    v: () =>
      klopt(fig, n, tal(fig, n)) &&
      klopt(other, n, O) &&
      telUitVlakken(fig, n)[k] === val &&
      TERUG[fig][k](val) === n,
  };
}

// ---------------------------------------------------------------------------------------------
// 177: de uitslag van een piramide.

// Een regelmatige veelhoek met zijde a, met het midden in (0, 0). De punten gaan tegen de klok in, en
// de eerste zijde ligt onderaan. De y-as gaat hier omhoog.
function regelmatig(n, a) {
  const R = a / (2 * Math.sin(Math.PI / n));
  return Array.from({ length: n }, (_, i) => {
    const t = -Math.PI / 2 - Math.PI / n + (2 * Math.PI * i) / n;
    return [R * Math.cos(t), R * Math.sin(t)];
  });
}
const rechthoek = (l, b) => [
  [-l / 2, -b / 2],
  [l / 2, -b / 2],
  [l / 2, b / 2],
  [-l / 2, b / 2],
];
const lengte = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);
const midden = (poly) =>
  poly.reduce((t, p) => [t[0] + p[0] / poly.length, t[1] + p[1] / poly.length], [0, 0]);
// De afstand van het punt c tot de lijn door zijde i.
function afstand(poly, i, c = midden(poly)) {
  const p = poly[i],
    q = poly[(i + 1) % poly.length];
  return Math.abs((q[0] - p[0]) * (c[1] - p[1]) - (q[1] - p[1]) * (c[0] - p[0])) / lengte(p, q);
}
// De punt van een driehoek met hoogte h op zijde i, naar buiten.
function punt(poly, i, h) {
  const p = poly[i],
    q = poly[(i + 1) % poly.length],
    l = lengte(p, q);
  return [(p[0] + q[0]) / 2 + ((q[1] - p[1]) / l) * h, (p[1] + q[1]) / 2 - ((q[0] - p[0]) / l) * h];
}
// Een uitslag van een piramide met de top op hoogte H boven het midden van het grondvlak. Een
// driehoek is dan zo hoog als de schuine afstand van de top tot zijn zijde.
const piramideNet = (base, H) => ({
  base,
  H,
  tris: base.map((_, i) => ({ i, apex: punt(base, i, Math.hypot(H, afstand(base, i))) })),
});
// Of de tekening goed te lezen is. Bij een vijfhoek of zeshoek kan een schuine zijde van een driehoek
// bijna in het verlengde van een zijde van het grondvlak liggen. Dan lijkt de uitslag van een
// piramide een ster van lange lijnen. Dat gebeurt als de hoek onderaan de driehoek bijna 360/n
// graden is. h is de hoogte van de driehoek en a de zijde van het grondvlak.
const leesbaar = (n, h, a) =>
  n < 5 || Math.abs((Math.atan2(h, a / 2) * 180) / Math.PI - 360 / n) >= 8;
// De vlakken van een uitslag van een piramide als veelhoeken.
const vlakkenVan = ({ base, tris }) => [
  base,
  ...tris.map(({ i, apex }) => [base[i], base[(i + 1) % base.length], apex]),
];

// Of een figuur de uitslag van een piramide kan zijn: bij elke zijde van het middelste vlak precies
// één driehoek, twee schuine zijden die bij het vouwen tegen elkaar komen even lang, en elke
// driehoek hoger dan de afstand van het midden tot zijn zijde. Anders komen de punten niet samen.
function kanPiramide(net) {
  if (net.prisma) return false;
  const { base, tris } = net,
    n = base.length,
    at = (i) => tris.find((t) => t.i === i);
  if (tris.length !== n || new Set(tris.map((t) => t.i)).size !== n) return false;
  return base.every((p, i) => {
    const t = at(i),
      prev = at((i + n - 1) % n),
      q = base[(i + 1) % n],
      h = afstand([p, q, t.apex], 0, t.apex);
    return near(lengte(p, t.apex), lengte(p, prev.apex), 1e-9) && h > afstand(base, i) + 1e-9;
  });
}
// Of elke schuine zijde zo lang is als de echte opstaande ribbe, van een hoekpunt van het grondvlak
// naar de top boven het midden. Dat rekent in de ruimte, niet in de uitslag van de piramide.
function echteRibben(net) {
  const c = midden(net.base),
    rib = (p) => Math.hypot(p[0] - c[0], p[1] - c[1], net.H);
  return net.tris.every(({ i, apex }) =>
    [net.base[i], net.base[(i + 1) % net.base.length]].every((p) =>
      near(lengte(p, apex), rib(p), 1e-9),
    ),
  );
}

// Een platte figuur van veelhoeken, zoals een uitslag van een piramide. marks zijn letters bij een
// punt: { at: [x, y], dir: [x, y], s: 'T' }, een eindje van het punt af in de richting dir. shade
// zijn de vlakken die gekleurd zijn, zoals het grondvlak: zo zie je meteen welke zijden erbij horen.
function vlakkenFig({ polys, marks = [], shade = [], desc, w = 300, h = 270 }) {
  const all = polys.flat(),
    xs = all.map((p) => p[0]),
    ys = all.map((p) => p[1]),
    x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys),
    y1 = Math.max(...ys),
    pad = marks.length ? 22 : 4,
    s = Math.min((w - 2 * pad) / (x1 - x0), (h - 2 * pad) / (y1 - y0)),
    W = Math.ceil((x1 - x0) * s + 2 * pad),
    Ht = Math.ceil((y1 - y0) * s + 2 * pad),
    P = ([x, y]) => [pad + (x - x0) * s, pad + (y1 - y) * s],
    r1 = (c) => c.toFixed(1),
    points = (poly) => poly.map((p) => P(p).map(r1).join(',')).join(' ');
  let o = shade.map((i) => `<polygon class="sf" points="${points(polys[i])}"/>`).join('');
  o += polys.map((poly) => `<polygon class="s" points="${points(poly)}"/>`).join('');
  for (const { at, dir, s: t } of marks) {
    const [x, y] = P(at),
      l = Math.hypot(dir[0], dir[1]) || 1;
    o += `<text class="ti" text-anchor="middle" x="${r1(x + (13 * dir[0]) / l)}" y="${r1(y - (13 * dir[1]) / l + 5)}">${esc(t)}</text>`;
  }
  return `<svg class="fig" role="img" aria-label="${attr(desc)}" width="${W}" height="${Ht}" viewBox="0 0 ${W} ${Ht}">${o}</svg>`;
}

// Wat je van het grondvlak ziet, zonder de naam: voor een schermlezer.
function eigenschappen(n, rect) {
  if (n === 3) return 'drie even lange zijden';
  if (rect) return 'vier rechte hoeken, en twee zijden zijn langer dan de andere twee';
  if (n === 4) return 'vier even lange zijden en vier rechte hoeken';
  return `${WOORD[n]} even lange zijden en ${WOORD[n]} even grote hoeken`;
}
// Een uitslag van een piramide met letters: de letters van het grondvlak één keer, en bij de punt
// van elke driehoek de top. Met X krijgt de punt van driehoek i in plaats daarvan de letter X[i].
function letterNet(net, L, rect, X) {
  const top = L[0],
    base = L.slice(1),
    n = base.length,
    c = midden(net.base),
    marks = [
      ...net.base.map((p, i) => ({ at: p, dir: [p[0] - c[0], p[1] - c[1]], s: base[i] })),
      ...net.tris.map(({ i, apex }) => {
        const p = net.base[i],
          q = net.base[(i + 1) % n];
        return {
          at: apex,
          dir: [apex[0] - (p[0] + q[0]) / 2, apex[1] - (p[1] + q[1]) / 2],
          s: X ? X[i] : top,
        };
      }),
    ],
    tris = net.tris.map(({ i }) => `${base[i]}${base[(i + 1) % n]}${X ? X[i] : top}`),
    derde = X ? 'een eigen letter bij de punt' : `de top ${top} als derde hoekpunt`,
    desc = `Uitslag van een piramide. In het midden ligt het grondvlak ${base}, met ${eigenschappen(n, rect)}. Aan elke zijde van het grondvlak zit een driehoek met ${derde}: de driehoeken ${and(tris)}. Het grondvlak is gekleurd.`;
  return { fig: vlakkenFig({ polys: vlakkenVan(net), marks, shade: [0], desc }), marks };
}
const VORMEN = ['driehoek', 'vierkant', 'rechthoek', 'vijfhoek', 'zeshoek'];
// Letters voor de punten van de driehoeken in een uitslag van een piramide. Een rij mag geen letter
// van de piramide zelf hebben.
const PUNTEN = ['PQRSUV', 'ABCDEF', 'UVWXYZ'];

function s177() {
  const type = pick(['kies', 'vouwen', 'lengtes']);
  if (type === 'kies') {
    // Welke figuur is een uitslag van een piramide? Het grondvlak is regelmatig.
    const n = pick([3, 4, 5, 6]),
      a = 2,
      vorm = n === 4 ? 'vierkant' : HOEK[n],
      base = regelmatig(n, a),
      rho = afstand(base, 0),
      hoogte = until(
        () => pick([1, 1.2, 1.6, 2, 2.4]),
        (H) => leesbaar(n, Math.hypot(H, rho), a),
      ),
      good = piramideNet(base, hoogte),
      skip = pick(base.map((_, i) => i)),
      big = pick(base.map((_, i) => i)),
      hGood = Math.hypot(hoogte, rho),
      low = { base, tris: base.map((_, i) => ({ i, apex: punt(base, i, 0.6 * rho) })) },
      missing = { base, tris: good.tris.filter((t) => t.i !== skip) },
      large = {
        base,
        tris: good.tris.map((t) =>
          t.i === big ? { i: t.i, apex: punt(base, t.i, 1.7 * hGood) } : t,
        ),
      };
    // Een uitslag van een prisma: n rechthoeken naast elkaar, met boven en onder een n-hoek.
    const hp = 1.3 * a,
      jt = pick(base.map((_, i) => i)),
      jb = pick(base.map((_, i) => i)),
      rects = base.map((_, i) => rechthoek(a, hp).map(([x, y]) => [x + (i + 0.5) * a, y + hp / 2])),
      onTop = base.map(([x, y]) => [x - base[0][0] + jt * a, y - base[0][1] + hp]),
      below = base.map(([x, y]) => [x - base[0][0] + jb * a, -(y - base[0][1])]),
      prism = { prisma: true, polys: [...rects, onTop, below] },
      meer = n === 4 ? 'vierkanten' : `${HOEK[n]}en`;
    // Het middelste vlak is gekleurd, en bij een uitslag van een prisma de twee gelijke vlakken.
    const fig = (net, desc) =>
      net.prisma
        ? vlakkenFig({
            polys: net.polys,
            shade: [n, n + 1],
            desc: `Keuze. ${desc} De twee ${meer} zijn gekleurd.`,
            w: 130,
            h: 130,
          })
        : vlakkenFig({
            polys: vlakkenVan(net),
            shade: [0],
            desc: `Keuze. ${desc} Het middelste vlak is gekleurd.`,
            w: 130,
            h: 130,
          });
    const midTekst = 'het midden van het middelste vlak tot een zijde';
    const keuzes = [
      [
        good,
        `Een ${vorm} met aan elke zijde een driehoek. De driehoeken zijn even groot, en hoger dan de afstand van ${midTekst}.`,
      ],
      [
        low,
        `Een ${vorm} met aan elke zijde een driehoek. De driehoeken zijn even groot, maar lager dan de afstand van ${midTekst}.`,
        'driehoeken-te-laag',
        'De driehoeken in deze figuur zijn te laag. Als je ze omhoog vouwt, komen de punten niet bij elkaar in één top.',
      ],
      [
        missing,
        `Een ${vorm} met aan ${WOORD[n - 1]} van de ${WOORD[n]} zijden een driehoek. Aan één zijde zit niets.`,
        'driehoek-vergeten',
        `In deze figuur mist een driehoek. Bij een uitslag van een piramide zit aan elke zijde van het grondvlak een driehoek, dus ${n} driehoeken.`,
      ],
      [
        large,
        `Een ${vorm} met aan elke zijde een driehoek. Eén driehoek is veel hoger dan de andere, en zijn schuine zijden zijn langer.`,
        'zijden-niet-even-lang',
        'In deze figuur is één driehoek hoger dan de andere. Als je vouwt, komen twee schuine zijden steeds tegen elkaar. Hier zijn die niet even lang, dus ze passen niet.',
      ],
      [
        prism,
        `${cap(WOORD[n])} rechthoeken naast elkaar, met boven één rechthoek een ${vorm} en onder één rechthoek een ${vorm}.`,
        'uitslag-van-een-prisma',
        `Deze figuur heeft twee ${meer} met rechthoeken ertussen. Dat is een uitslag van een prisma.`,
      ],
    ];
    const chosen = [keuzes[0], ...shuffle(keuzes.slice(1)).slice(0, 3)],
      figs = chosen.map(([net, desc]) => fig(net, desc));
    return {
      q: T('Welke figuur is een uitslag van een piramide?'),
      mc: MC(figs, 0),
      hint: 'Een uitslag van een piramide heeft een grondvlak met aan elke zijde een driehoek. Vouw de driehoeken in gedachten omhoog: hun punten moeten samenkomen in de top.',
      steps: [
        `Bij een uitslag van een piramide zit aan elke zijde van het grondvlak één driehoek. Hier zijn dat ${n} driehoeken aan een ${vorm}.`,
        'Als je vouwt, komen steeds twee schuine zijden tegen elkaar. Die moeten even lang zijn.',
        'De driehoeken moeten hoog genoeg zijn. Anders komen de punten niet bij elkaar in de top.',
        H(figs[0].replace('Keuze. ', 'De goede keuze. ')),
      ],
      traps: chosen.slice(1).map(([, , id, m], i) => ({ id, f: (v) => v[0] === figs[i + 1], m })),
      v: () =>
        kanPiramide(good) &&
        echteRibben(good) &&
        chosen.slice(1).every(([net]) => !kanPiramide(net)) &&
        new Set(figs).size === 4,
    };
  }

  const L0 = pick(LETTERS);
  if (type === 'vouwen') {
    // Een uitslag van een piramide waarin elke punt van een driehoek een eigen letter heeft. Je
    // vouwt in gedachten: welk punt wordt de punt, welke ribbe wordt een zijde, en welke zijden
    // komen tegen elkaar.
    const vorm = pick(VORMEN),
      rect = vorm === 'rechthoek',
      n = { driehoek: 3, vierkant: 4, rechthoek: 4, vijfhoek: 5, zeshoek: 6 }[vorm],
      base = rect ? rechthoek(pick([4, 4.5]), pick([2.5, 3])) : regelmatig(n, 3),
      net = piramideNet(
        base,
        until(
          () => pick([1.5, 2, 2.5, 3, 3.5]),
          (H) => rect || leesbaar(n, Math.hypot(H, afstand(base, 0)), 3),
        ),
      ),
      L = L0.slice(0, n + 1),
      X = until(
        () => pick(PUNTEN).slice(0, n),
        (p) => [...p].every((c) => !L.includes(c)),
      ),
      top = L[0],
      G = L.slice(1),
      k = pick(G.split('').map((_, i) => i)),
      B = G[k],
      // De twee driehoeken bij B: j is die van de gevraagde zijde, o die aan de andere kant.
      [j, o] = pick([
        [k, (k + n - 1) % n],
        [(k + n - 1) % n, k],
      ]),
      zijde = B + X[j],
      tegen = B + X[o],
      // De andere schuine zijde van driehoek j, die niet bij B begint.
      overkant = G[j === k ? (k + 1) % n : (k + n - 1) % n] + X[j],
      ribbe = top + B,
      schuin = G.split('').flatMap((g, i) => [g + X[i], G[(i + 1) % n] + X[i]]),
      ribben = solidFacts({ kind: 'piramide', n, letters: L }).edges,
      { fig, marks } = letterNet(net, L, rect, X);
    return {
      q: T(
        `Hieronder staat een uitslag van piramide ${L}. Je vouwt de driehoeken omhoog tot de piramide. Welk punt van de piramide wordt punt ${X[j]}? Welke ribbe van de piramide wordt zijde ${zijde}? Welke zijde van de uitslag van de piramide komt tegen zijde ${zijde}?`,
      ),
      fig,
      fields: [
        {
          sel: L.split(''),
          a: top,
          pre: `Punt ${X[j]} wordt punt`,
          label: `Welk punt wordt ${X[j]}?`,
        },
        {
          sel: ribben,
          a: ribbe,
          pre: `Zijde ${zijde} wordt ribbe`,
          label: `Welke ribbe wordt zijde ${zijde}?`,
          br: true,
        },
        {
          sel: schuin.filter((s) => s !== zijde),
          a: tegen,
          pre: `Tegen zijde ${zijde} komt zijde`,
          label: `Welke zijde komt tegen ${zijde}?`,
          br: true,
        },
      ],
      hint: `Een hoekpunt van het grondvlak blijft waar het is als je vouwt. De punten van de driehoeken komen samen in de top.`,
      steps: [
        `${X[j]} is de punt van een driehoek. Als je vouwt, komen de punten van alle driehoeken samen in de top. Dus ${X[j]} wordt ${top}.`,
        `${B} blijft ${B} en ${X[j]} wordt ${top}. Dus zijde ${zijde} wordt ribbe ${ribbe}.`,
        `Aan de andere kant van ${B} zit driehoek ${G[o]}${G[(o + 1) % n]}${X[o]}. Ook daarvan wordt zijde ${tegen} ribbe ${ribbe}.`,
        `Twee zijden die dezelfde ribbe worden, komen tegen elkaar. Dus zijde ${tegen} komt tegen zijde ${zijde}.`,
      ],
      traps: [
        {
          id: 'punt-wordt-hoekpunt-grondvlak',
          f: (v) => G.includes(v[0]),
          m: `${X[j]} is de punt van een driehoek, geen hoekpunt van het grondvlak. Als je vouwt, komen de punten van alle driehoeken samen in de top.`,
        },
        {
          id: 'grondvlakribbe',
          f: (v) => !v[1].startsWith(top),
          m: `Zijde ${zijde} is een schuine zijde van een driehoek. Die gaat van het grondvlak naar de punt, dus die wordt een opstaande ribbe.`,
        },
        {
          id: 'verkeerde-opstaande-ribbe',
          f: (v) => v[1].startsWith(top) && v[1] !== ribbe,
          m: `${B} blijft ${B} als je vouwt, en ${X[j]} wordt de top. De ribbe gaat dus van de top naar ${B}.`,
        },
        {
          id: 'zijde-van-dezelfde-driehoek',
          f: (v) => v[2] === overkant,
          m: `Zijde ${overkant} hoort bij dezelfde driehoek als zijde ${zijde}. Twee zijden van één driehoek komen niet tegen elkaar. Kijk naar de driehoek aan de andere kant van ${B}.`,
        },
        {
          id: 'zijde-niet-bij-hoekpunt',
          f: (v) => v[2] !== overkant && v[2] !== tegen && v[2][0] !== B,
          m: `${B} blijft op zijn plek als je vouwt. De zijde die tegen zijde ${zijde} komt, begint dus ook bij ${B}.`,
        },
      ],
      // De controle vouwt echt. Elke driehoek draait om zijn zijde van het grondvlak omhoog, tot
      // zijn punt recht boven het midden van het grondvlak komt. De namen komen uit de letters in de
      // figuur. Dan zoekt ze de schuine zijden die op dezelfde ribbe in de ruimte terechtkomen.
      v: () => {
        const c = midden(net.base),
          gelijk = (a, b) => a.length === b.length && a.every((x, i) => near(x, b[i], 1e-9)),
          letter = (pt) => {
            const ls = marks.filter((m) => gelijk(m.at, pt)).map((m) => m.s);
            return ls.length === 1 ? ls[0] : '?';
          },
          // Draait punt a van een driehoek om de lijn door p en q, uit het vlak omhoog.
          vouw = (p, q, a) => {
            const l = lengte(p, q),
              u = [(q[0] - p[0]) / l, (q[1] - p[1]) / l],
              t = (a[0] - p[0]) * u[0] + (a[1] - p[1]) * u[1],
              f = [p[0] + t * u[0], p[1] + t * u[1]],
              h = lengte(f, a),
              w = [(a[0] - f[0]) / h, (a[1] - f[1]) / h],
              cos = ((c[0] - f[0]) * w[0] + (c[1] - f[1]) * w[1]) / h,
              sin = Math.sqrt(1 - cos * cos);
            return [f[0] + h * cos * w[0], f[1] + h * cos * w[1], h * sin];
          },
          segs = vlakkenVan(net)
            .slice(1)
            .flatMap(([p, q, a]) => {
              const top3 = vouw(p, q, a);
              return [p, q].map((g) => ({
                naam: letter(g) + letter(a),
                punt: letter(a),
                ends: [[g[0], g[1], 0], top3],
              }));
            }),
          toppen = segs.map((s) => s.ends[1]),
          mijn = segs.find((s) => s.naam === zijde),
          zelfde = segs.filter(
            (s) => s !== mijn && s.ends.every((e, i) => gelijk(e, mijn.ends[i])),
          );
        return (
          kanPiramide(net) &&
          toppen.every((p) => gelijk(p, toppen[0]) && p[2] > 0) &&
          gelijk(toppen[0], [c[0], c[1], net.H]) &&
          segs.filter((s) => s.punt === X[j]).length === 2 &&
          !!mijn &&
          zelfde.length === 1 &&
          zelfde[0].naam === tegen &&
          ribben.includes(top + letter(mijn.ends[0].slice(0, 2))) &&
          top + letter(mijn.ends[0].slice(0, 2)) === ribbe &&
          new Set(marks.map((m) => m.s)).size === 2 * n &&
          !X.includes(top)
        );
      },
    };
  }

  // De zijden in een uitslag van een piramide met maten.
  const [n, a, s] = until(
      () => [pick([3, 4, 5, 6]), pick([3, 4, 5, 6]), pick([4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 9])],
      ([n, a, s]) =>
        s !== a &&
        s >= a / (2 * Math.sin(Math.PI / n)) + 0.8 &&
        leesbaar(n, Math.sqrt(s * s - (a * a) / 4), a),
    ),
    vorm = n === 4 ? 'vierkant' : HOEK[n],
    base = regelmatig(n, a),
    // De top staat op een hoogte waarbij de opstaande ribben precies s zijn.
    hoogte = Math.sqrt(s * s - (a / (2 * Math.sin(Math.PI / n))) ** 2),
    net = piramideNet(base, hoogte),
    L = L0.slice(0, n + 1),
    { fig } = letterNet(net, L, false),
    rand = 2 * n * s;
  return {
    q: T(
      `Piramide ${L} heeft een ${vorm} als grondvlak, met zijden van ${d(a)} cm. De opstaande ribben zijn allemaal ${d(s)} cm. Hieronder staat een uitslag van de piramide. Hoeveel zijden van ${d(s)} cm teken je? Hoeveel zijden van ${d(a)} cm? Je knipt de uitslag van de piramide uit, langs de rand. Hoe lang is de rand?`,
    ),
    fig,
    fields: [
      F(`Zijden van ${d(s)} cm:`, 2 * n),
      { ...F(`Zijden van ${d(a)} cm:`, n), br: true },
      { ...F('De rand is', rand, 'cm'), label: 'Lengte van de rand', br: true },
    ],
    hint: 'Elke opstaande ribbe zit aan twee driehoeken. Als je vouwt, komen die twee zijden tegen elkaar. Een zijde van het grondvlak deelt het grondvlak met één driehoek.',
    steps: [
      `De piramide heeft ${n} opstaande ribben. In de uitslag van de piramide teken je elke opstaande ribbe twee keer: aan elke driehoek ernaast één keer. Dat zijn 2 * ${n} = ${2 * n} zijden van ${d(s)} cm.`,
      `Een zijde van het grondvlak teken je één keer: de driehoek zit daar vast aan het grondvlak. Dat zijn ${n} zijden van ${d(a)} cm.`,
      `De zijden van het grondvlak liggen binnen in de uitslag van de piramide. De rand bestaat uit de ${2 * n} schuine zijden: ${2 * n} * ${d(s)} = ${d(rand)} cm.`,
    ],
    traps: [
      {
        id: 'opstaande-ribbe-een-keer',
        f: (v) => v[0] === n || near(v[2], n * s),
        m: `Elke opstaande ribbe teken je in de uitslag van de piramide twee keer, aan elke driehoek ernaast één keer. Als je vouwt, komen die twee zijden tegen elkaar.`,
      },
      {
        id: 'grondvlakribbe-dubbel',
        f: (v) => v[1] === 2 * n,
        m: 'Een zijde van het grondvlak teken je maar één keer. De driehoek en het grondvlak zitten daar aan elkaar vast.',
      },
      {
        id: 'grondvlak-in-rand',
        f: (v) => near(v[2], rand + n * a),
        m: 'De zijden van het grondvlak liggen binnen in de uitslag van de piramide, tussen het grondvlak en een driehoek. Daar knip je niet.',
      },
    ],
    // De controle zoekt in de getekende vlakken alle zijden op, en telt een zijde die twee vlakken
    // delen één keer. De rand zijn de zijden die bij maar één vlak horen.
    v: () => {
      const segs = new Map();
      vlakkenVan(net).forEach((poly) =>
        poly.forEach((p, i) => {
          const q = poly[(i + 1) % poly.length],
            key = [p, q]
              .map((r) => r.map((c) => c.toFixed(6)).join(','))
              .sort()
              .join(' ');
          segs.set(key, { l: lengte(p, q), k: (segs.get(key)?.k ?? 0) + 1 });
        }),
      );
      const list = [...segs.values()];
      return (
        echteRibben(net) &&
        kanPiramide(net) &&
        list.filter((x) => near(x.l, s, 1e-6)).length === 2 * n &&
        list.filter((x) => near(x.l, a, 1e-6)).length === n &&
        list.length === 3 * n &&
        near(
          list.filter((x) => x.k === 1).reduce((t, x) => t + x.l, 0),
          rand,
          1e-6,
        )
      );
    },
  };
}

// De figuren in de uitleg.
const VOORBEELD = 'TGHIJ';
const voorbeeldNet = () =>
  letterNet(piramideNet(regelmatig(4, 3), 3), VOORBEELD, false, 'PQRS').fig;

export default {
  slug: 'piramide',
  title: 'Piramide',
  intro:
    'Een piramide heeft één grondvlak en een top. De andere zijvlakken zijn driehoeken die in de top samenkomen. Hier leer je een piramide benoemen, de zijvlakken, ribben en hoekpunten tellen, een piramide vergelijken met een prisma en een uitslag van een piramide herkennen.',
  description:
    'Piramide oefenen: top, grondvlak, opstaande ribben, zijvlakken, ribben en hoekpunten tellen, vergelijken met een prisma en de uitslag van een piramide.',
  videos: {},
  skills: [
    [174, 'Een piramide benoemen', s174],
    [175, 'Zijvlakken, ribben en hoekpunten van een piramide', s175],
    [176, 'Prisma en piramide vergelijken', s176],
    [177, 'Uitslag van een piramide', s177],
  ],
  learn: [
    {
      t: 'Wat is een piramide?',
      p: [
        'Een piramide heeft één grondvlak. Dat is een veelhoek, zoals een driehoek, een vierkant of een zeshoek.',
        'Bij elke zijde van het grondvlak hoort een driehoek. Die driehoeken heten de opstaande zijvlakken. Ze komen samen in één punt: de top.',
        'De ribben van de top naar het grondvlak heten de opstaande ribben.',
        'Je noemt een piramide met de top voorop, en daarna de hoekpunten van het grondvlak rondom, tegen de klok in. Zo krijg je piramide TGHIJ.',
      ],
      ex: {
        q:
          T('Wat is de top en wat is het grondvlak van piramide TGHIJ?') +
          solid({ kind: 'piramide', n: 4, h: 3, letters: VOORBEELD }),
        steps: [
          'De top staat voorop in de naam, dus de top is T.',
          'Het grondvlak is GHIJ.',
          'De opstaande ribben zijn TG, TH, TI en TJ.',
        ],
      },
      watch: T(
        'Het grondvlak is ook een zijvlak, maar geen opstaand zijvlak. Ribbe TD is gestippeld, omdat je die in werkelijkheid niet ziet. Het is wel een opstaande ribbe.',
      ),
    },
    {
      t: 'Zijvlakken, ribben en hoekpunten tellen',
      p: [
        'Tel vanuit het grondvlak. Heeft het grondvlak n hoekpunten, dan heeft het ook n zijden.',
        'Zijvlakken: het grondvlak en n opstaande zijvlakken. Dat zijn n + 1 zijvlakken.',
        'Ribben: n ribben in het grondvlak en n opstaande ribben. Dat zijn 2 * n ribben.',
        'Hoekpunten: n hoekpunten in het grondvlak en de top. Dat zijn n + 1 hoekpunten.',
        'Je kunt ook terugrekenen. Heeft een piramide 16 ribben, dan is 16 : 2 = 8. Het grondvlak is dan een achthoek.',
      ],
      ex: {
        q: T(
          'Een piramide heeft een zeshoek als grondvlak. Hoeveel zijvlakken, ribben en hoekpunten heeft de piramide?',
        ),
        steps: ['Zijvlakken: 1 + 6 = 7.', 'Ribben: 6 + 6 = 12.', 'Hoekpunten: 6 + 1 = 7.'],
      },
      watch: T(
        'Vergeet het grondvlak en de top niet. Het grondvlak is een zijvlak, en de top is een hoekpunt.',
      ),
    },
    {
      t: 'Prisma en piramide',
      p: [
        'Een prisma heeft een grondvlak en een bovenvlak. Een piramide heeft een grondvlak en een top.',
        'Met een n-hoek als grondvlak heeft een prisma n + 2 zijvlakken, 3 * n ribben en 2 * n hoekpunten. Een piramide heeft n + 1 zijvlakken, 2 * n ribben en n + 1 hoekpunten.',
        'Het prisma heeft dus altijd 1 zijvlak meer. Het heeft n ribben meer, de ribben van het bovenvlak.',
      ],
      ex: {
        q: T(
          'Een prisma en een piramide hebben allebei een vijfhoek als grondvlak. Hoeveel ribben heeft het prisma meer?',
        ),
        steps: [
          'Het prisma: 3 * 5 = 15 ribben.',
          'De piramide: 2 * 5 = 10 ribben.',
          '15 - 10 = 5 ribben meer.',
        ],
      },
      watch: T('Een prisma is geen piramide: een prisma heeft geen top.'),
    },
    {
      t: 'Uitslag van een piramide',
      p: [
        'Een uitslag van een piramide heeft het grondvlak in het midden, met aan elke zijde een driehoek.',
        'Als je vouwt, komen de punten van alle driehoeken samen in de top. Een hoekpunt van het grondvlak blijft waar het is.',
        'Elke opstaande ribbe zie je in de uitslag van een piramide twee keer, aan twee driehoeken. Die zijden komen tegen elkaar als je vouwt, dus ze zijn even lang.',
      ],
      ex: {
        q:
          T(
            'Dit is een uitslag van piramide TGHIJ. Welke zijde komt tegen zijde GP als je vouwt?',
          ) + voorbeeldNet(),
        steps: [
          'G blijft G, en de punt P komt in de top T. Zijde GP wordt dus ribbe TG.',
          'Aan de andere kant van G zit driehoek JGS. Ook zijde GS wordt ribbe TG.',
          'Dus zijde GS komt tegen zijde GP.',
        ],
      },
      watch: T(
        'De driehoeken moeten hoog genoeg zijn. Zijn ze te laag, dan komen de punten bij het vouwen niet bij elkaar.',
      ),
    },
  ],
};
