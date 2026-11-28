// Onderwerp: Wortels herleiden. Wortels vermenigvuldigen, gelijksoortige wortels optellen en aftrekken
// (ook als dat niet kan), een zo groot mogelijke factor voor het wortelteken, wortels delen en de
// wortel van een breuk, en als uitdaging de wortel uit de noemer wegwerken. De leerling typt het
// herleide antwoord zelf, in een veld voor een uitdrukking (#304). Vraaggeneratoren staan bovenaan, de
// uitleg en de lijst met vraagsoorten onderaan.
import { ri, pick, coin, until, gcd } from '../math.js';
import { H } from './shared.js';
import { T } from '../typeset.js';
import {
  UF,
  U,
  metUitdrukking,
  invullen,
  leesUitdrukking,
  uitdrukkingGelijk,
} from '../uitdrukking.js';

// Getallen zonder kwadraat erin, voor onder het wortelteken. Met 14 en 15 erbij hebben meer paren een
// factor gemeen, voor een product waar je daarna een factor uit haalt.
const VRIJ = [2, 3, 5, 6, 7, 10, 11];
const VRIJ_MEER = [2, 3, 5, 6, 7, 10, 14, 15];

// ---------------------------------------------------------------------------------------------------
// Zoals een leerling het typt.

// Een getal p/q: een heel getal, een echte breuk zoals 2/3, of een gemengd getal zoals 1 1/2.
function getal(p, q = 1) {
  const g = gcd(p, q) || 1;
  [p, q] = [p / g, q / g];
  if (q < 0) [p, q] = [-p, -q];
  if (q === 1) return `${p}`;
  const min = p < 0 ? '-' : '',
    a = Math.abs(p);
  return a > q ? `${min}${Math.floor(a / q)} ${a % q}/${q}` : `${min}${a}/${q}`;
}
// Het getal p/q keer √r: 6√3, √5, -√6, 2/3√5 of 1 1/2√2. Zonder wortel als r 1 is. De wortel wordt
// niet herleid, zodat ook een tussenstap als 6√12 kan.
function wt(p, r = 1, q = 1) {
  const g = getal(p, q);
  if (r === 1) return g;
  return `${g === '1' ? '' : g === '-1' ? '-' : g}√${r}`;
}
// Termen [c, r] (c√r, met c een heel getal) met hun teken: 4√5 - 2√3, zonder + - en zonder termen die
// 0 zijn.
function som(ts) {
  const lijst = ts.filter(([c]) => c !== 0);
  if (!lijst.length) return '0';
  return lijst
    .map(([c, r], i) => {
      const s = wt(Math.abs(c), r);
      return i ? `${c < 0 ? '-' : '+'} ${s}` : c < 0 ? `-${s}` : s;
    })
    .join(' ');
}
// Een rij met =, zonder twee keer hetzelfde deel achter elkaar.
const keten = (...delen) => delen.filter((d, i) => d !== delen[i - 1]).join(' = ');

// Een melding na een valkuil is gewone tekst: een min wordt een echt minteken.
const gewoon = (s) => String(s).replace(/-/g, '−');

// Een regel met tekst en wiskunde: zin('Deel de getallen: ', W('12 : 4 = 3'), '.'). De tekst gaat door T,
// de wiskunde door U, zoals in het veld.
const W = (s) => ({ w: s });
const zin = (...delen) => delen.map((d) => (typeof d === 'string' ? T(d) : U(d.w))).join('');
const uitleg = (...delen) => H(zin(...delen));
const rij = (s) => H(U(s));
const vraagTekst = (s) => `${T('{{herleiden|Herleid}}')} ${U(s)}.`;

// De valkuilen met een foute uitdrukking. Een fout antwoord dat gelijk is aan het goede antwoord of aan
// een eerdere valkuil, valt weg, net als een fout antwoord dat het veld niet kan lezen (zoals de wortel
// van een negatief getal). Zo is een valkuil nooit het goede antwoord, en heeft elk fout antwoord één
// melding.
function valkuilen(antwoord, lijst) {
  const gezien = [leesUitdrukking(antwoord).w];
  const uit = [];
  for (const { id, als, m } of lijst) {
    const fout = [].concat(als).filter((a) => {
      const r = leesUitdrukking(a);
      if (!r || gezien.some((g) => uitdrukkingGelijk(g, r.w))) return false;
      gezien.push(r.w);
      return true;
    });
    if (fout.length) uit.push({ id, als: fout, m: gewoon(m) });
  }
  return uit;
}

// v rekent de opgave uit met Math.sqrt, met de getallen waaruit de generator de opgave maakt (waarde).
// Dat moet gelijk zijn aan de opgave en aan het antwoord zoals het veld ze leest (invullen). Zo rekent v
// met kommagetallen, en de generator met hele getallen en kwadraten.
const dicht = (x, y) => Math.abs(x - y) < 1e-9 * Math.max(1, Math.abs(x));
const klopt = (opgave, antwoord, waarde) =>
  dicht(invullen(opgave, {}), waarde) && dicht(invullen(antwoord, {}), waarde);
// Of er geen kwadraat (groter dan 1) in n zit, anders bepaald dan in de lijst VRIJ.
const kwadraatvrij = (n) => {
  for (let k = 2; k * k <= n; k++) if (n % (k * k) === 0) return false;
  return true;
};

// Maakt de vraag: "Herleid …." met een veld voor de uitdrukking. ook controleert nog iets wat het
// uitrekenen niet ziet.
function vraag({
  opgave,
  antwoord,
  waarde,
  hint,
  steps,
  traps = [],
  opties = {},
  ook = () => true,
}) {
  return metUitdrukking({
    q: vraagTekst(opgave),
    fields: [UF('', antwoord, { letters: '', ...opties })],
    hint,
    steps,
    traps: valkuilen(antwoord, traps),
    v: () => klopt(opgave, antwoord, waarde) && ook(),
  });
}

const TEKEN = ['', 'plus keer min is min', 'min keer min is plus'];
const teken = (...cs) => ({
  id: 'teken',
  m: `Let op het teken: ${TEKEN[cs.filter((c) => c < 0).length]}.`,
});

// ---------------------------------------------------------------------------------------------------
// 255. Wortels vermenigvuldigen: de getallen ervoor keer elkaar en de getallen onder het wortelteken
// keer elkaar. Soms komt er onder het wortelteken een kwadraat, of is het twee keer dezelfde wortel; dan
// valt de wortel weg. Een negatief getal na · staat zonder haakjes.
function s255keer() {
  const soort = pick(['getallen', 'getallen', 'kwadraat', 'zelfde']);
  const hint = zin(
    'Vermenigvuldig de getallen vóór het wortelteken met elkaar, en de getallen onder het wortelteken met elkaar. Is het getal onder het wortelteken een {{kwadraat|kwadraat}}, reken de wortel dan uit.',
  );
  if (soort === 'getallen') {
    const [a, b, p, q] = until(
      () => [
        pick([1, 1, 2, 3, 4, 5, -2, -3]),
        pick([1, 2, 3, 4, 5, 6, -2, -3, -4, -5]),
        pick(VRIJ),
        pick(VRIJ),
      ],
      ([, , p, q]) => p !== q && gcd(p, q) === 1 && p * q <= 70,
    );
    const c = a * b,
      n = p * q,
      opgave = `${wt(a, p)} · ${wt(b, q)}`,
      antwoord = wt(c, n);
    const steps = [rij(`${opgave} = ${antwoord}`)];
    if (a !== 1 && b !== 1)
      steps.push(uitleg('Vermenigvuldig de getallen: ', W(`${a} · ${b} = ${c}`), '.'));
    steps.push(
      uitleg('Vermenigvuldig de getallen onder het wortelteken: ', W(`√${p} · √${q} = √${n}`), '.'),
    );
    return vraag({
      opgave,
      antwoord,
      waarde: a * Math.sqrt(p) * b * Math.sqrt(q),
      hint,
      steps,
      traps: [
        {
          id: 'getallen-opgeteld',
          als: Math.abs(a) > 1 && Math.abs(b) > 1 && a + b ? wt(a + b, n) : [],
          m: 'De getallen vóór de wortels vermenigvuldig je met elkaar. Je telt ze niet op.',
        },
        {
          id: 'wortels-opgeteld',
          als: wt(c, p + q),
          m: `Onder het wortelteken vermenigvuldig je ook: √${p} · √${q} is de wortel uit ${p} · ${q}, en niet √${p + q}.`,
        },
        { ...teken(a, b), als: c < 0 ? wt(-c, n) : [] },
      ],
    });
  }
  if (soort === 'kwadraat') {
    // √p · √(pk²) = √(p²k²) = pk, met misschien getallen ervoor.
    const [p, k, a, b, om] = until(
      () => [
        pick([2, 3, 5, 6, 7]),
        pick([2, 3, 4]),
        pick([1, 1, 2, 3]),
        pick([1, 1, 2, 3, -2]),
        coin(),
      ],
      ([p, k, a, b]) => p * k <= 14 && Math.abs(a * b * p * k) <= 60,
    );
    const [x, y] = om
      ? [
          [b, p * k * k],
          [a, p],
        ]
      : [
          [a, p],
          [b, p * k * k],
        ];
    const c = a * b,
      n = p * p * k * k,
      w = p * k,
      opgave = `${wt(...x)} · ${wt(...y)}`,
      antwoord = `${c * w}`;
    return vraag({
      opgave,
      antwoord,
      waarde: x[0] * Math.sqrt(x[1]) * y[0] * Math.sqrt(y[1]),
      hint,
      steps: [
        rij(keten(opgave, wt(c, n), c === 1 ? `${w}` : `${c} · ${w}`, antwoord)),
        uitleg(
          'Vermenigvuldig onder het wortelteken: ',
          W(`${x[1]} · ${y[1]} = ${n}`),
          '. Dat is een kwadraat: ',
          W(`√${n} = ${w}`),
          ', want ',
          W(`${w}^2 = ${n}`),
          '.',
        ),
      ],
      traps: [
        {
          id: 'wortels-opgeteld',
          als: wt(c, x[1] + y[1]),
          m: `Onder het wortelteken vermenigvuldig je: √${x[1]} · √${y[1]} = √${n}, en niet √${x[1] + y[1]}.`,
        },
        {
          id: 'getallen-opgeteld',
          als: Math.abs(a) > 1 && Math.abs(b) > 1 ? `${(a + b) * w}` : [],
          m: 'De getallen vóór de wortels vermenigvuldig je met elkaar. Je telt ze niet op.',
        },
        { ...teken(a, b), als: c < 0 ? `${-c * w}` : [] },
      ],
    });
  }
  // Twee keer dezelfde wortel: a√p · b√p = ab · p.
  const [a, b, p] = until(
    () => [pick([1, 2, 3, 4, 5]), pick([1, 2, 3, 4, 5, -2, -3]), pick([2, 3, 5, 6, 7, 10])],
    ([a, b, p]) => Math.abs(a * b * p) <= 100,
  );
  const c = a * b,
    opgave = `${wt(a, p)} · ${wt(b, p)}`,
    antwoord = `${c * p}`;
  const steps = [rij(keten(opgave, c === 1 ? `${p}` : `${c} · ${p}`, antwoord))];
  if (a !== 1 && b !== 1)
    steps.push(uitleg('Vermenigvuldig de getallen: ', W(`${a} · ${b} = ${c}`), '.'));
  steps.push(
    uitleg(
      W(`√${p} · √${p} = ${p}`),
      ': een wortel keer dezelfde wortel is het getal onder het wortelteken.',
    ),
  );
  return vraag({
    opgave,
    antwoord,
    waarde: a * Math.sqrt(p) * b * Math.sqrt(p),
    hint,
    steps,
    traps: [
      {
        id: 'wortel-blijft',
        als: wt(c, p),
        m: `√${p} · √${p} = ${p}. De wortel valt dus weg.`,
      },
      {
        id: 'getallen-opgeteld',
        als: a + b ? wt(a + b, p) : [],
        m: 'Dit is keer, geen plus. Vermenigvuldig de getallen vóór de wortels, en de wortels met elkaar.',
      },
      { ...teken(a, b), als: c < 0 ? `${-c * p}` : [] },
    ],
  });
}

// 256. Gelijksoortige wortels optellen en aftrekken, ook als het niet kan, met drie termen, en eerst de
// wortels van kwadraten uitrekenen.
function s256optellen() {
  const soort = pick(['gelijk', 'gelijk', 'kan-niet', 'drie', 'kwadraten']);
  const s = coin() ? 1 : -1,
    tk = s > 0 ? '+' : '-';
  if (soort === 'gelijk') {
    const [a, b, p] = until(
      () => [pick([1, 2, 3, 4, 5, 6, 7, 8, 9, -2, -3, -5]), ri(1, 9), pick(VRIJ)],
      ([a, b]) => a + s * b !== 0,
    );
    const c = a + s * b,
      opgave = `${wt(a, p)} ${tk} ${wt(b, p)}`,
      antwoord = wt(c, p);
    const steps = [
      rij(`${opgave} = ${antwoord}`),
      uitleg(
        `De wortels zijn gelijksoortig, want onder het wortelteken staat steeds ${p}. Neem de getallen ervoor samen: `,
        W(`${a} ${tk} ${b} = ${c}`),
        '.',
      ),
    ];
    if (a === 1 || b === 1) steps.push(uitleg('Voor ', W(`√${p}`), ' staat 1.'));
    return vraag({
      opgave,
      antwoord,
      waarde: a * Math.sqrt(p) + s * b * Math.sqrt(p),
      hint: zin(
        'De wortels zijn {{gelijksoortige-wortels|gelijksoortig}}: onder het wortelteken staat hetzelfde getal. Tel de getallen ervoor op of trek ze af. De wortel blijft hetzelfde.',
      ),
      steps,
      traps: [
        {
          id: 'wortels-opgeteld',
          als: s > 0 ? wt(c, 2 * p) : [],
          m: 'De wortel blijft hetzelfde. Je telt alleen de getallen ervoor op, net als bij 4x + 2x = 6x.',
        },
        {
          id: 'als-keer',
          als: `${a * s * b * p}`,
          m: 'Dit is plus of min, geen keer. Neem de getallen vóór de wortels samen, en laat de wortel staan.',
        },
      ],
    });
  }
  if (soort === 'kan-niet') {
    const [a, b, p, q] = until(
      () => [pick([1, 2, 3, 4, 5, 6, 7, -2, -3, -4]), ri(1, 8), pick(VRIJ), pick(VRIJ)],
      ([a, b, p, q]) => p !== q && a + s * b !== 0,
    );
    const c = a + s * b,
      opgave = `${wt(a, p)} ${tk} ${wt(b, q)}`;
    return vraag({
      opgave,
      antwoord: opgave,
      waarde: a * Math.sqrt(p) + s * b * Math.sqrt(q),
      // Het antwoord is de opgave zelf, dus uitrekenen geeft altijd hetzelfde. Controleer daarom ook dat
      // de twee wortels echt niet samen kunnen: geen kwadraat erin, en verschillend.
      ook: () => kwadraatvrij(p) && kwadraatvrij(q) && p !== q,
      hint: zin(
        'Kijk of de wortels {{gelijksoortige-wortels|gelijksoortig}} zijn: hetzelfde getal onder het wortelteken. Kun je niets samennemen, dan is de uitdrukking zelf het antwoord.',
      ),
      steps: [
        uitleg(
          W(wt(a, p)),
          ' en ',
          W(wt(b, q)),
          ` zijn niet gelijksoortig, want onder de worteltekens staan verschillende getallen: ${p} en ${q}. Je kunt ze niet samennemen.`,
        ),
        uitleg('Het antwoord is dus ', W(opgave), '.'),
      ],
      traps: [
        {
          id: 'wortels-opgeteld',
          als: p + s * q > 0 ? wt(c, p + s * q) : [],
          m: `Je kunt √${p} en √${q} niet samennemen tot één wortel. Onder het wortelteken optellen of aftrekken mag niet.`,
        },
        {
          id: 'niet-gelijksoortig',
          als: [wt(c, p), wt(c, q), wt(c, p * q)],
          m: `√${p} en √${q} zijn niet gelijksoortig, want onder het wortelteken staat een ander getal. Die kun je niet samennemen.`,
        },
      ],
    });
  }
  if (soort === 'drie') {
    // a√p ± b√q ± c√p: de eerste en de laatste zijn gelijksoortig.
    const [a, b, c, p, q, s2] = until(
      () => [ri(2, 9), ri(1, 8), ri(1, 8), pick(VRIJ), pick(VRIJ), coin() ? 1 : -1],
      ([a, , c, p, q, s2]) => p !== q && a + s2 * c !== 0,
    );
    const A = [a, p],
      B = [s * b, q],
      C = [s2 * c, p],
      opgave = som([A, B, C]),
      e = a + s2 * c,
      antwoord = som([[e, p], B]),
      alles = e + s * b;
    return vraag({
      opgave,
      antwoord,
      waarde: a * Math.sqrt(p) + s * b * Math.sqrt(q) + s2 * c * Math.sqrt(p),
      hint: zin(
        'Zoek de {{gelijksoortige-wortels|gelijksoortige wortels}}: hetzelfde getal onder het wortelteken. Neem alleen die samen.',
      ),
      steps: [
        rij(opgave),
        rij(`= ${som([A, C, B])}`),
        uitleg(
          `De wortels met ${p} onder het wortelteken zijn gelijksoortig. Neem de getallen ervoor samen: `,
          W(`${a} ${s2 > 0 ? '+' : '-'} ${c} = ${e}`),
          '.',
        ),
        rij(`= ${antwoord}`),
      ],
      traps: [
        {
          id: 'niet-gelijksoortig',
          als: alles ? [wt(alles, p), wt(alles, q)] : [],
          m: 'Alleen wortels met hetzelfde getal onder het wortelteken zijn gelijksoortig. Neem alleen die samen.',
        },
      ],
    });
  }
  // a√k² ± b√m²: reken eerst de wortels uit.
  const [a, k, b, m] = until(
    () => [ri(1, 6), ri(2, 7), ri(1, 5), ri(2, 7)],
    ([a, k, b, m]) => k !== m && a * k + s * b * m !== 0 && (a > 1 || b > 1),
  );
  const opgave = `${wt(a, k * k)} ${tk} ${wt(b, m * m)}`,
    antwoord = `${a * k + s * b * m}`,
    keer = (c, w) => (c === 1 ? `${w}` : `${c} · ${w}`),
    [cv, wv] = a > 1 ? [a, k] : [b, m];
  return vraag({
    opgave,
    antwoord,
    waarde: a * Math.sqrt(k * k) + s * b * Math.sqrt(m * m),
    hint: zin(
      'Onder het wortelteken staan {{kwadraat|kwadraten}}. Reken de wortels eerst uit. Een getal vóór het wortelteken betekent keer.',
    ),
    steps: [
      rij(keten(opgave, `${keer(a, k)} ${tk} ${keer(b, m)}`, `${a * k} ${tk} ${b * m}`, antwoord)),
      uitleg(
        'Reken eerst de wortels uit: ',
        W(`√${k * k} = ${k}`),
        ' en ',
        W(`√${m * m} = ${m}`),
        '.',
      ),
    ],
    traps: [
      {
        id: 'kwadraat-niet-wortel',
        als: `${a * k * k + s * b * m * m}`,
        m: `Neem de wortel: √${k * k} = ${k}, want ${k} · ${k} = ${k * k}.`,
      },
      {
        id: 'wortel-plus-getal',
        // Staat er geen getal vóór de wortel (1), dan rekent de leerling die term gewoon goed uit.
        als: `${(a > 1 ? a + k : k) + s * (b > 1 ? b + m : m)}`,
        m: `Een getal vóór het wortelteken betekent keer: ${cv}√${wv * wv} = ${cv} · ${wv}.`,
      },
      {
        id: 'wortels-opgeteld',
        als: a === b && k * k + s * m * m > 0 ? wt(a, k * k + s * m * m) : [],
        m: 'Onder het wortelteken optellen of aftrekken mag niet. Reken eerst elke wortel uit.',
      },
    ],
  });
}

// 257. Een zo groot mogelijke factor voor het wortelteken: één wortel, een product dat je daarna
// herleidt, en twee wortels die na het herleiden gelijksoortig zijn.
function s257factor() {
  const soort = pick(['een', 'een', 'product', 'samen']);
  const hint = zin(
    'Schrijf het getal onder het wortelteken als een zo groot mogelijk {{kwadraat|kwadraat}} keer een ander getal. De wortel van dat kwadraat komt vóór het wortelteken.',
  );
  if (soort === 'een') {
    const [a, k, r] = until(
      () => [pick([1, 1, 1, 2, 3]), pick([2, 3, 4, 5, 6, 10]), pick(VRIJ)],
      ([a, k, r]) => (k === 10 ? r <= 5 : k * k * r <= 150) && (a === 1 || k * k * r <= 75),
    );
    const n = k * k * r,
      opgave = wt(a, n),
      antwoord = wt(a * k, r),
      steps = [
        rij(
          a === 1
            ? `√${n} = √${k * k} · √${r} = ${antwoord}`
            : `${a}√${n} = ${a} · √${k * k} · √${r} = ${a} · ${k}√${r} = ${antwoord}`,
        ),
        uitleg(
          W(`${n} = ${k * k} · ${r}`),
          `, en ${k * k} is het grootste kwadraat dat in ${n} past. `,
          W(`√${k * k} = ${k}`),
          '.',
        ),
      ];
    return vraag({
      opgave,
      antwoord,
      waarde: a * Math.sqrt(n),
      hint,
      steps,
      traps: [
        {
          id: 'kwadraat-niet-wortel',
          als: wt(a * k * k, r),
          m: `Vóór het wortelteken komt de wortel van het kwadraat: √${k * k} = ${k}, en niet ${k * k}.`,
        },
        {
          id: 'factor-opgeteld',
          als: a > 1 ? wt(a + k, r) : [],
          m: `Haal eerst de factor uit √${n}. Vermenigvuldig die factor daarna met de ${a} ervoor; je telt ze niet op.`,
        },
        {
          id: 'getal-ervoor-vergeten',
          als: a > 1 ? wt(k, r) : [],
          m: `Vergeet de ${a} vóór het wortelteken niet. Vermenigvuldig die met het getal dat je uit de wortel haalt.`,
        },
      ],
    });
  }
  if (soort === 'product') {
    // a√p · b√q met een factor g gemeen: √(pq) = g√(pq/g²).
    const [a, b, p, q] = until(
      () => [pick([1, 1, 2, 3, 4]), pick([1, 2, 3, 5, -2, -3]), pick(VRIJ_MEER), pick(VRIJ_MEER)],
      ([a, b, p, q]) =>
        p !== q && gcd(p, q) > 1 && p * q <= 150 && Math.abs(a * b * gcd(p, q)) <= 40,
    );
    const g = gcd(p, q),
      r = (p * q) / (g * g),
      ab = a * b,
      c = ab * g,
      opgave = `${wt(a, p)} · ${wt(b, q)}`,
      antwoord = wt(c, r);
    return vraag({
      opgave,
      antwoord,
      waarde: a * Math.sqrt(p) * b * Math.sqrt(q),
      hint: zin(
        'Vermenigvuldig eerst. Schrijf daarna het getal onder het wortelteken als een zo groot mogelijk {{kwadraat|kwadraat}} keer een ander getal.',
      ),
      steps: [
        rij(keten(opgave, wt(ab, p * q), ab === 1 ? wt(g, r) : `${ab} · ${wt(g, r)}`, antwoord)),
        uitleg('Vermenigvuldig eerst: ', W(`√${p} · √${q} = √${p * q}`), '.'),
        uitleg(
          'Haal dan de factor eruit: ',
          W(`${p * q} = ${g * g} · ${r}`),
          ' en ',
          W(`√${g * g} = ${g}`),
          '.',
        ),
      ],
      traps: [
        {
          id: 'factor-vergeten',
          als: wt(ab, r),
          m: `√${p * q} = ${g}√${r}. Vermenigvuldig ook die ${g} met de getallen ervoor.`,
        },
        {
          id: 'getallen-opgeteld',
          als: Math.abs(a) > 1 && Math.abs(b) > 1 ? [wt(a + b, p * q), wt((a + b) * g, r)] : [],
          m: 'De getallen vóór de wortels vermenigvuldig je met elkaar. Je telt ze niet op.',
        },
        { ...teken(a, b), als: c < 0 ? wt(-c, r) : [] },
      ],
    });
  }
  // c1√(j²p) ± c2√(k²p): na het herleiden zijn de wortels gelijksoortig.
  const s = coin() ? 1 : -1,
    tk = s > 0 ? '+' : '-';
  const [p, a, j, b, k, om] = until(
    () => [
      pick([2, 3, 5, 6, 7]),
      pick([1, 1, 2, 3]),
      pick([1, 1, 2, 3]),
      pick([1, 1, 2]),
      pick([2, 3, 4, 5]),
      coin(),
    ],
    ([p, a, j, b, k, om]) => {
      const [c1, r1, c2, r2] = om ? [b, k, a, j] : [a, j, b, k];
      return (
        j !== k &&
        j * j * p <= 75 &&
        k * k * p <= 100 &&
        (a === 1 || j * j * p <= 50) &&
        c1 * r1 + s * c2 * r2 !== 0
      );
    },
  );
  const [c1, r1, c2, r2] = om ? [b, k, a, j] : [a, j, b, k];
  const opgave = `${wt(c1, r1 * r1 * p)} ${tk} ${wt(c2, r2 * r2 * p)}`,
    tussen = som([
      [c1 * r1, p],
      [s * c2 * r2, p],
    ]),
    c = c1 * r1 + s * c2 * r2,
    antwoord = wt(c, p);
  const eruit = [r1, r2]
    .filter((r) => r > 1)
    .map((r) =>
      uitleg(W(`${r * r * p} = ${r * r} · ${p}`), ', dus ', W(`√${r * r * p} = ${r}√${p}`), '.'),
    );
  return vraag({
    opgave,
    antwoord,
    waarde: c1 * Math.sqrt(r1 * r1 * p) + s * c2 * Math.sqrt(r2 * r2 * p),
    hint: zin(
      'Haal bij elke wortel een zo groot mogelijk {{kwadraat|kwadraat}} eruit. Dan zijn de wortels {{gelijksoortige-wortels|gelijksoortig}}, en neem je ze samen.',
    ),
    steps: [
      rij(`${opgave} = ${tussen} = ${antwoord}`),
      ...eruit,
      uitleg('Nu zijn de wortels gelijksoortig. Neem ze samen.'),
    ],
    traps: [
      {
        id: 'wortels-opgeteld',
        als:
          c1 + s * c2 && r1 * r1 * p + s * r2 * r2 * p > 0
            ? wt(c1 + s * c2, r1 * r1 * p + s * r2 * r2 * p)
            : [],
        m: 'Onder het wortelteken optellen of aftrekken mag niet. Haal eerst bij elke wortel de factor eruit.',
      },
      {
        id: 'kwadraat-niet-wortel',
        als: c1 * r1 * r1 + s * c2 * r2 * r2 ? wt(c1 * r1 * r1 + s * c2 * r2 * r2, p) : [],
        m: `Vóór het wortelteken komt de wortel van het kwadraat, zoals √${k * k} = ${k}.`,
      },
    ],
  });
}

// Een breuk p/q in een uitwerking, vereenvoudigd en als gemengd getal: 9/6 = 3/2 = 1 1/2, of 12 : 4 = 3.
function breukRij(p, q) {
  if (p % q === 0) return `${p} : ${q} = ${p / q}`;
  const g = gcd(p, q);
  return keten(`${p}/${q}`, `${p / g}/${q / g}`, getal(p, q));
}

// 258. Wortels delen en de wortel van een breuk: de getallen en de wortels apart delen, de wortel van een
// breuk met kwadraten, met een gemengd getal, en met een wortel die overblijft (breuk vóór de wortel).
function s258delen() {
  const soort = pick(['delen', 'delen', 'kwadraten', 'gemengd', 'rest']);
  const opties = { breuk: 'ervoor' };
  const tellerNoemer =
    'De wortel geldt voor de teller én voor de noemer. Neem van allebei de wortel.';
  if (soort === 'delen') {
    // a√(pq) / (b√q) = a/b · √p.
    const [a, b, p, q] = until(
      () => [ri(1, 15), pick([1, 2, 3, 4, 5, 6]), pick(VRIJ), pick(VRIJ)],
      ([a, b, p, q]) =>
        p !== q && gcd(p, q) === 1 && p * q <= 77 && (a % b !== 0 || a / b <= 5) && a !== b,
    );
    const opgave = `${wt(a, p * q)}/(${wt(b, q)})`,
      antwoord = wt(a, p, b),
      steps = [rij(`${opgave} = ${antwoord}`)];
    if (b > 1) steps.push(uitleg('Deel de getallen: ', W(breukRij(a, b)), '.'));
    steps.push(
      uitleg(
        'Deel de wortels: ',
        W(`√${p * q} : √${q} = √${p}`),
        ', want ',
        W(`${p * q} : ${q} = ${p}`),
        '.',
      ),
    );
    if (a % b) steps.push(uitleg('De getallen komen niet uit, dus de breuk staat vóór de wortel.'));
    return vraag({
      opgave,
      antwoord,
      waarde: (a * Math.sqrt(p * q)) / (b * Math.sqrt(q)),
      opties,
      hint: zin(
        'Deel de getallen vóór het wortelteken door elkaar, en de getallen onder het wortelteken door elkaar. Komt het niet uit, zet de breuk dan vóór de wortel.',
      ),
      steps,
      traps: [
        {
          id: 'getal-omgedraaid',
          als: wt(b, p, a),
          m: 'Deel het getal in de teller door het getal in de noemer, en niet andersom.',
        },
        {
          id: 'getallen-niet-gedeeld',
          als: b > 1 ? wt(a, p) : [],
          m: `Deel ook de getallen vóór de wortels: ${a} gedeeld door ${b}.`,
        },
      ],
    });
  }
  if (soort === 'kwadraten') {
    const [a, b] = until(
      () => [ri(2, 9), ri(3, 12)],
      ([a, b]) => a < b && gcd(a, b) === 1,
    );
    const opgave = `√(${a * a}/${b * b})`;
    return vraag({
      opgave,
      antwoord: `${a}/${b}`,
      waarde: Math.sqrt((a * a) / (b * b)),
      opties,
      hint: zin('Neem de wortel van de {{teller|teller}} en de wortel van de {{noemer|noemer}}.'),
      steps: [
        rij(`${opgave} = √${a * a}/√${b * b} = ${a}/${b}`),
        uitleg(
          'Neem de wortel van de teller en van de noemer: ',
          W(`√${a * a} = ${a}`),
          ' en ',
          W(`√${b * b} = ${b}`),
          '.',
        ),
      ],
      traps: [
        { id: 'alleen-teller', als: `${a}/${b * b}`, m: tellerNoemer },
        { id: 'alleen-noemer', als: `${a * a}/${b}`, m: tellerNoemer },
      ],
    });
  }
  if (soort === 'gemengd') {
    // √(h t/n) met h t/n = a²/b², een gemengd getal.
    const [a, b] = until(
      () => [ri(3, 10), ri(2, 5)],
      ([a, b]) => a > b && a < 3 * b && gcd(a, b) === 1 && a * a <= 100,
    );
    const n = b * b,
      h = Math.floor((a * a) / n),
      t = a * a - h * n,
      opgave = `√(${h} ${t}/${n})`,
      antwoord = getal(a, b);
    return vraag({
      opgave,
      antwoord,
      waarde: Math.sqrt(h + t / n),
      opties,
      hint: zin(
        'Schrijf het gemengde getal eerst als één breuk. Neem dan de wortel van de {{teller|teller}} en van de {{noemer|noemer}}.',
      ),
      steps: [
        rij(`${opgave} = √(${a * a}/${n}) = √${a * a}/√${n} = ${a}/${b} = ${antwoord}`),
        uitleg(
          'Schrijf het gemengde getal eerst als een breuk: ',
          W(`${h} ${t}/${n} = ${a * a}/${n}`),
          ', want ',
          W(`${h} · ${n} + ${t} = ${a * a}`),
          '.',
        ),
        uitleg(
          'Neem dan de wortel van de teller en van de noemer, en schrijf de uitkomst als gemengd getal.',
        ),
      ],
      traps: [
        {
          id: 'helen-apart',
          als: `√${h} + √${t}/${b}`,
          m: 'Schrijf het gemengde getal eerst als één breuk. Je mag de wortel van de helen en van de breuk niet apart nemen.',
        },
        { id: 'alleen-teller', als: `${a}/${n}`, m: tellerNoemer },
        { id: 'alleen-noemer', als: `${a * a}/${b}`, m: tellerNoemer },
      ],
    });
  }
  // √(k²r/b²) = k/b · √r: er blijft een wortel over, en de breuk staat ervoor.
  const [k, r, b] = until(
    () => [pick([1, 1, 2, 3]), pick(VRIJ), ri(2, 9)],
    ([k, r, b]) => gcd(k * r, b) === 1 && k * k * r <= 50,
  );
  const n = k * k * r,
    opgave = `√(${n}/${b * b})`,
    antwoord = wt(k, r, b),
    teller = wt(k, r),
    steps = [rij(keten(opgave, `√${n}/√${b * b}`, `${teller}/${b}`, antwoord))];
  steps.push(
    uitleg(
      'Neem de wortel van de teller en van de noemer: ',
      W(`√${b * b} = ${b}`),
      k > 1 ? ' en ' : ', maar ',
      ...(k > 1
        ? [W(`√${n} = √${k * k} · √${r} = ${teller}`), '.']
        : [W(`√${r}`), ' blijft staan.']),
    ),
    uitleg('Zet de breuk vóór de wortel.'),
  );
  return vraag({
    opgave,
    antwoord,
    waarde: Math.sqrt(n / (b * b)),
    opties,
    hint: zin(
      'Neem de wortel van de {{teller|teller}} en de wortel van de {{noemer|noemer}}. Er mag geen breuk onder het wortelteken blijven. Zet de breuk vóór de wortel.',
    ),
    steps,
    traps: [
      { id: 'alleen-teller', als: wt(k, r, b * b), m: tellerNoemer },
      { id: 'alleen-noemer', als: `${n}/${b}`, m: tellerNoemer },
    ],
  });
}

// 259. Uitdaging: de wortel uit de noemer wegwerken door de teller en de noemer met die wortel te
// vermenigvuldigen. a√q/(b√p) = a√(pq)/(bp). Geen verschil van wortels in de noemer.
function s259noemer() {
  const twee = ri(1, 4) === 1;
  const [a, b, p, q] = until(
    () => [
      ri(1, 10),
      pick([1, 1, 2, 3, 4, 5]),
      pick([2, 3, 5, 6, 7]),
      twee ? pick([2, 3, 5, 7]) : 1,
    ],
    ([a, b, p, q]) =>
      gcd(a, b) === 1 && b * p <= 21 && (q === 1 || (q !== p && gcd(p, q) === 1 && p * q <= 35)),
  );
  const teller = wt(a, q),
    opgave = `${teller}/(${wt(b, p)})`,
    nieuw = wt(a, p * q),
    noemer = b * p,
    antwoord = wt(a, p * q, noemer);
  const steps = [
    rij(
      keten(
        opgave,
        b === 1 ? `${nieuw}/${p}` : `${nieuw}/(${b} · ${p})`,
        `${nieuw}/${noemer}`,
        antwoord,
      ),
    ),
    uitleg(
      'Vermenigvuldig de teller en de noemer met ',
      W(`√${p}`),
      '. Dan verandert de waarde van de breuk niet, en in de noemer is ',
      W(`√${p} · √${p} = ${p}`),
      '.',
    ),
  ];
  if (a % noemer === 0) steps.push(uitleg('Deel: ', W(`${a} : ${noemer} = ${a / noemer}`), '.'));
  else
    steps.push(
      uitleg(
        gcd(a, noemer) > 1
          ? 'Vereenvoudig de breuk en zet hem vóór de wortel: '
          : 'Zet de breuk vóór de wortel: ',
        W(
          gcd(a, noemer) > 1
            ? `${a}/${noemer} = ${getal(a, noemer)}`
            : `${nieuw}/${noemer} = ${antwoord}`,
        ),
        '.',
      ),
    );
  return vraag({
    opgave,
    antwoord,
    waarde: (a * Math.sqrt(q)) / (b * Math.sqrt(p)),
    opties: { wortelUitNoemer: true, breuk: 'ervoor' },
    hint: zin(
      'Vermenigvuldig de teller en de noemer met de wortel uit de noemer. Een wortel keer dezelfde wortel is het getal onder het wortelteken.',
    ),
    steps,
    traps: [
      {
        id: 'alleen-teller',
        als: wt(a, p * q, b),
        m: `Vermenigvuldig de teller én de noemer met √${p}. Anders verandert de waarde van de breuk.`,
      },
      {
        id: 'wortel-vergeten',
        als: wt(a, q, noemer),
        m: `Vermenigvuldig ook de teller met √${p}. Dan komt er in de teller √${p} bij.`,
      },
    ],
  });
}

export default {
  slug: 'wortels-herleiden',
  title: 'Wortels herleiden',
  intro:
    'Een wortel als √50 kun je vaak korter schrijven, als 5√2. Hier leer je wortels herleiden: vermenigvuldigen, gelijksoortige wortels optellen en aftrekken, een zo groot mogelijk getal vóór het wortelteken zetten, en wortels delen, ook de wortel van een breuk.',
  description:
    'Wortels herleiden oefenen: vermenigvuldigen, optellen, een factor voor het wortelteken halen, delen en de wortel van een breuk. Havo 3, gratis.',
  videos: {},
  skills: [
    [255, 'Wortels vermenigvuldigen', s255keer],
    [256, 'Gelijksoortige wortels optellen en aftrekken', s256optellen],
    [257, 'Een zo groot mogelijke factor voor het wortelteken', s257factor],
    [258, 'Wortels delen en de wortel van een breuk', s258delen],
    [259, 'De wortel uit de noemer wegwerken', s259noemer, 'uitdaging'],
  ],
  learn: [
    {
      t: 'Wortels vermenigvuldigen',
      p: [
        zin(
          'Twee wortels vermenigvuldig je door de getallen onder het wortelteken te vermenigvuldigen: ',
          W('√2 · √11 = √22'),
          '.',
        ),
        T(
          'Staan er getallen vóór de wortels, vermenigvuldig dan de getallen met elkaar en de wortels met elkaar.',
        ),
        zin(
          'Komt er onder het wortelteken een {{kwadraat|kwadraat}}, reken de wortel dan uit: ',
          W('√2 · √32 = √64 = 8'),
          '. Een wortel keer dezelfde wortel is het getal onder het wortelteken: ',
          W('√6 · √6 = 6'),
          '.',
        ),
      ],
      how: [
        'Vermenigvuldig de getallen vóór het wortelteken.',
        'Vermenigvuldig de getallen onder het wortelteken.',
        'Is het getal onder het wortelteken een kwadraat, reken de wortel dan uit.',
      ],
      ex: {
        q: vraagTekst('3√5 · -2√7'),
        steps: [
          rij('3√5 · -2√7 = -6√35'),
          uitleg('Vermenigvuldig de getallen: ', W('3 · -2 = -6'), '.'),
          uitleg('Vermenigvuldig de wortels: ', W('√5 · √7 = √35'), '.'),
        ],
      },
      ex2: {
        q: vraagTekst('5√3 · 2√3'),
        steps: [
          rij('5√3 · 2√3 = 10 · 3 = 30'),
          uitleg('Vermenigvuldig de getallen: ', W('5 · 2 = 10'), '.'),
          uitleg(W('√3 · √3 = 3'), ', dus de wortel valt weg.'),
        ],
      },
      watch: zin(
        'Bij twee keer dezelfde wortel blijft de wortel niet staan: ',
        W('4√2 · 3√2 = 12 · 2 = 24'),
        ', en niet ',
        W('12√2'),
        '.',
      ),
    },
    {
      t: 'Wortels optellen en aftrekken',
      p: [
        T(
          'Optellen en aftrekken kan alleen bij {{=gelijksoortige-wortels|gelijksoortige wortels}}: wortels met hetzelfde getal onder het wortelteken. Je telt de getallen ervoor op, en de wortel blijft hetzelfde, net als bij 5x + 2x = 7x.',
        ),
        zin(
          'Staat er een ander getal onder het wortelteken, zoals bij ',
          W('3√2 + 4√5'),
          ', dan kun je niets samennemen. Dan is de uitdrukking zelf het antwoord.',
        ),
        zin(
          'Is het getal onder het wortelteken een kwadraat, reken de wortel dan eerst uit: ',
          W('2√25 + √16 = 10 + 4 = 14'),
          '.',
        ),
      ],
      ex: {
        q: vraagTekst('6√11 - 2√5 + √11'),
        steps: [
          rij('6√11 - 2√5 + √11'),
          rij('= 6√11 + √11 - 2√5'),
          rij('= 7√11 - 2√5'),
          uitleg(
            'Alleen ',
            W('6√11'),
            ' en ',
            W('√11'),
            ' zijn gelijksoortig. Voor ',
            W('√11'),
            ' staat 1.',
          ),
        ],
      },
      watch: zin(
        'Tel nooit onder het wortelteken op: ',
        W('√9 + √16 = 3 + 4 = 7'),
        ', en dat is niet ',
        W('√25 = 5'),
        '.',
      ),
    },
    {
      t: 'Een zo groot mogelijke factor voor het wortelteken',
      p: [
        zin(
          'Een wortel als ',
          W('√48'),
          ' kun je korter schrijven. Schrijf het getal onder het wortelteken als een kwadraat keer een ander getal: ',
          W('48 = 16 · 3'),
          '. De wortel van het kwadraat komt vóór het wortelteken: ',
          W('√48 = √16 · √3 = 4√3'),
          '. De 4 heet de {{=factor-voor-het-wortelteken|factor voor het wortelteken}}.',
        ),
        T(
          'Kies het grootste kwadraat dat erin past, dan is de factor zo groot mogelijk. De kwadraten zijn 4, 9, 16, 25, 36, 49, 64, 81 en 100.',
        ),
      ],
      how: [
        'Zoek het grootste kwadraat dat in het getal onder het wortelteken past.',
        'Schrijf de wortel als de wortel van dat kwadraat keer de wortel van wat overblijft.',
        'Reken de wortel van het kwadraat uit en zet die vóór het wortelteken. Staat er al een getal, vermenigvuldig dan.',
      ],
      ex: {
        q: vraagTekst('3√20'),
        steps: [
          rij('3√20 = 3 · √4 · √5 = 3 · 2√5 = 6√5'),
          uitleg(W('20 = 4 · 5'), ' en ', W('√4 = 2'), '.'),
        ],
      },
      ex2: {
        q: vraagTekst('√12 + √75'),
        steps: [
          rij('√12 + √75 = 2√3 + 5√3 = 7√3'),
          uitleg(W('√12 = √4 · √3 = 2√3'), ' en ', W('√75 = √25 · √3 = 5√3'), '.'),
          uitleg('Nu zijn de wortels gelijksoortig. Neem ze samen.'),
        ],
      },
      watch: zin(
        'Kies het grootste kwadraat: ',
        W('√72 = 3√8'),
        ' is nog niet af, want in 8 zit nog 4. Goed is ',
        W('√72 = 6√2'),
        '.',
      ),
    },
    {
      t: 'Wortels delen en de wortel van een breuk',
      p: [
        zin(
          'Bij delen deel je de getallen vóór het wortelteken door elkaar, en de getallen onder het wortelteken door elkaar: ',
          W('√30/√6 = √5'),
          ', want 30 : 6 = 5.',
        ),
        zin(
          'Andersom is de wortel van een breuk de wortel van de teller gedeeld door de wortel van de noemer: ',
          W('√(9/64) = √9/√64 = 3/8'),
          '.',
        ),
        zin(
          'Er mag geen breuk onder het wortelteken blijven. Blijft er een wortel over, zet de breuk dan vóór de wortel: ',
          W('√(5/36) = √5/6 = 1/6√5'),
          '. Een onechte breuk schrijf je als gemengd getal.',
        ),
      ],
      how: [
        'Deel de getallen vóór het wortelteken door elkaar.',
        'Deel de getallen onder het wortelteken door elkaar, of neem de wortel van de teller en van de noemer.',
        'Zet een breuk vóór de wortel, en schrijf een onechte breuk als gemengd getal.',
      ],
      ex: {
        q: vraagTekst('10√33/(4√3)'),
        steps: [
          rij('10√33/(4√3) = 2 1/2√11'),
          uitleg('Deel de getallen: ', W('10/4 = 5/2 = 2 1/2'), '.'),
          uitleg('Deel de wortels: ', W('√33 : √3 = √11'), '.'),
        ],
      },
      ex2: {
        q: vraagTekst('√(2 7/9)'),
        steps: [
          rij('√(2 7/9) = √(25/9) = 5/3 = 1 2/3'),
          uitleg('Schrijf het gemengde getal eerst als een breuk: ', W('2 7/9 = 25/9'), '.'),
          uitleg('Neem dan de wortel van de teller en van de noemer.'),
        ],
      },
      watch: zin(
        'Neem de wortel van de teller én van de noemer: ',
        W('√(4/81) = 2/9'),
        ', en niet ',
        W('2/81'),
        '.',
      ),
    },
    {
      t: 'De wortel uit de noemer wegwerken',
      p: [
        zin(
          'Als uitdaging werk je de {{=wortel-uit-de-noemer-wegwerken|wortel uit de noemer weg}}. Vermenigvuldig de teller en de noemer met de wortel uit de noemer. Dan verandert de waarde van de breuk niet, en in de noemer komt een heel getal, want ',
          W('√7 · √7 = 7'),
          '.',
        ),
      ],
      ex: {
        q: vraagTekst('3/(2√5)'),
        steps: [
          rij('3/(2√5) = 3√5/(2 · 5) = 3√5/10 = 3/10√5'),
          uitleg('Vermenigvuldig de teller en de noemer met ', W('√5'), '.'),
          uitleg('Zet de breuk vóór de wortel.'),
        ],
      },
    },
  ],
};
