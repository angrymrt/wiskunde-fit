// Puzzels bij hoofdstuk 2 van havo/vwo 1 (#262): de getallenpiramide en het magisch vierkant. Hier
// staan het oplossen met stappen, voor de uitwerking, en het narekenen, voor de v van een vraag. De
// figuren staan in getalfiguren.js. Geen DOM, dus de tests draaien dit in Node.
//
// Een getal is hier altijd een breuk { n, d } uit Q in math.js, ook een heel getal. Een vak dat de
// leerling moet invullen krijgt een hoofdletter.
//
// Een puzzel is alleen goed als er precies één invulling is. Daarom lost oplossen hem op zoals een
// leerling dat doet: telkens een vak dat je direct kunt uitrekenen, omdat de andere vakken van een
// rekensom al bekend zijn. Lukt dat voor alle vakken, dan is elk vak vastgelegd en is de invulling
// dus de enige.
import { Q, qAdd, qSub, qMul, qDiv, near, fr, lcm } from './math.js';
import { F } from './topics/shared.js';
import { piramideFig } from './getalfiguren.js';

const qv = (q) => q.n / q.d;
// Een getal als tekst voor T. Een negatief getal achter een rekenteken krijgt de korte min: 8 - -3.
const t = (q) => fr(Q(q));

// Een som of verschil van twee breuken als tekst voor T, met de breuken eerst gelijknamig, zoals
// een leerling dat doet: {1 1/4} - {3/4} = {5/4} - {3/4} = {2/4} = {1/2}. Bij hele getallen staat
// alleen de som: 4 - -3 = 7.
function somTekst(a, op, b) {
  const uit = op === '+' ? qAdd(a, b) : qSub(a, b);
  // Met 0 of twee hele getallen hoeft er niets gelijknamig.
  if ((a.d === 1 && b.d === 1) || !a.n || !b.n) return `${t(a)} ${op} ${t(b)} = ${t(uit)}`;
  const L = lcm(a.d, b.d),
    teller = (q) => (q.n * L) / q.d,
    gn = (k) => `${k < 0 ? '-' : ''}{${Math.abs(k)}/${L}}`,
    k = op === '+' ? teller(a) + teller(b) : teller(a) - teller(b);
  const s = [`${t(a)} ${op} ${t(b)}`];
  const midden = `${gn(teller(a))} ${op} ${gn(teller(b))}`;
  if (midden !== s[0]) s.push(midden);
  // Bij 0 zou dat {0/12} geven: dan staat er meteen 0.
  if (k !== 0 && gn(k) !== t(uit)) s.push(gn(k));
  s.push(t(uit));
  return s.join(' = ');
}

// De bewerking van een piramide: elk vak is de som of het product van de twee vakken eronder.
const OP = {
  som: {
    doe: qAdd,
    // Het vak eronder: het vak erboven min het andere vak eronder.
    terug: qSub,
    boven: (a, b) => somTekst(a, '+', b),
    onder: (c, b) => somTekst(c, '-', b),
  },
  product: {
    doe: qMul,
    terug: qDiv,
    boven: (a, b) => `${t(a)} * ${t(b)} = ${t(qMul(a, b))}`,
    onder: (c, b) => `${t(c)} : ${t(b)} = ${t(qDiv(c, b))}`,
  },
};

// Een piramide uit de onderste laag: rijen[0] is de onderste laag, de laatste rij het bovenste vak.
function bouwPiramide(onder, soort) {
  const rijen = [onder.map((x) => Q(x))];
  while (rijen[rijen.length - 1].length > 1) {
    const r = rijen[rijen.length - 1];
    rijen.push(r.slice(1).map((x, k) => OP[soort].doe(r[k], x)));
  }
  return rijen;
}

// De rekensommen van een piramide: vak [r, k] is de som of het product van [r-1, k] en [r-1, k+1].
const piramideSommen = (n) =>
  Array.from({ length: n - 1 }, (_, i) => i + 1).flatMap((r) =>
    Array.from({ length: n - r }, (_, k) => [
      [r, k],
      [r - 1, k],
      [r - 1, k + 1],
    ]),
  );

// Lost een piramide op met de vakken in open ([[r, k], ...]) leeg. Geeft de stappen, in de volgorde
// waarin een leerling ze kan doen, of null als dat niet voor alle vakken lukt. Een stap is
// { vak, boven }: boven is true als het vak de som of het product is van de twee vakken eronder, en
// false als je terugrekent vanuit het vak erboven.
function losPiramideOp(rijen, open) {
  const key = ([r, k]) => `${r},${k}`,
    leeg = new Set(open.map(key)),
    stappen = [];
  let verder = true;
  while (leeg.size && verder) {
    verder = false;
    for (const [c, a, b] of piramideSommen(rijen[0].length)) {
      const weg = [c, a, b].filter((v) => leeg.has(key(v)));
      if (weg.length !== 1) continue;
      const [vak] = weg;
      stappen.push({ vak, boven: vak === c, c, a, b });
      leeg.delete(key(vak));
      verder = true;
    }
  }
  return leeg.size ? null : stappen;
}

// De letters van de lege vakken, van boven naar beneden en van links naar rechts.
function piramideLetters(rijen, open) {
  const sorted = [...open].sort(([r1, k1], [r2, k2]) => r2 - r1 || k1 - k2),
    letters = {};
  sorted.forEach(([r, k], i) => (letters[`${r},${k}`] = String.fromCharCode(65 + i)));
  return letters;
}

// De uitwerking van een piramide: per stap de rekensom, met de letter van het vak ervoor.
function piramideStappen(rijen, stappen, letters, soort) {
  const v = ([r, k]) => rijen[r][k];
  return stappen.map(({ vak, boven, c, a, b }) => {
    const L = letters[`${vak[0]},${vak[1]}`];
    if (boven) return `${L} = ${OP[soort].boven(v(a), v(b))}`;
    const ander = vak === a ? b : a;
    return `${L} = ${OP[soort].onder(v(c), v(ander))}`;
  });
}

// Klopt de piramide met de ingevulde getallen? Kijkt elke rekensom na, met gewone getallen en niet
// met de breuken waarmee de piramide is gemaakt: zo rekent v anders dan het antwoord.
function piramideKlopt(rijen, open, getallen, soort) {
  const w = rijen.map((r) => r.map(qv)),
    letters = piramideLetters(rijen, open);
  Object.entries(letters).forEach(([pos, L]) => {
    const [r, k] = pos.split(',').map(Number);
    w[r][k] = getallen[L.charCodeAt(0) - 65];
  });
  const doe = soort === 'som' ? (a, b) => a + b : (a, b) => a * b;
  return piramideSommen(rijen[0].length).every(([[r, k], [r1, k1], [r2, k2]]) =>
    near(w[r][k], doe(w[r1][k1], w[r2][k2])),
  );
}

// Een magisch vierkant van 3 bij 3: elke rij, kolom en diagonaal heeft dezelfde som. Met het midden
// m en twee getallen p en q is dit elk magisch vierkant van 3 bij 3; de som is 3m.
const magisch = (m, p, q) => [
  [m - q, m + p + q, m - p],
  [m - p + q, m, m + p - q],
  [m + p, m - p - q, m + q],
];
// De acht lijnen van het vierkant, met de naam voor de uitwerking.
const LIJNEN = [
  ...[0, 1, 2].map((r) => ({
    naam: `rij ${r + 1}`,
    vakken: [0, 1, 2].map((k) => [r, k]),
  })),
  ...[0, 1, 2].map((k) => ({
    naam: `kolom ${k + 1}`,
    vakken: [0, 1, 2].map((r) => [r, k]),
  })),
  {
    naam: 'de diagonaal van linksboven naar rechtsonder',
    vakken: [0, 1, 2].map((i) => [i, i]),
  },
  {
    naam: 'de diagonaal van rechtsboven naar linksonder',
    vakken: [0, 1, 2].map((i) => [i, 2 - i]),
  },
];

// De letters van de lege vakken van het vierkant, rij voor rij van links naar rechts.
function vierkantLetters(open) {
  const letters = {};
  [...open]
    .sort(([r1, k1], [r2, k2]) => r1 - r2 || k1 - k2)
    .forEach(([r, k], i) => (letters[`${r},${k}`] = String.fromCharCode(65 + i)));
  return letters;
}

// Lost het vierkant op met de vakken in open leeg. Eerst de som uit een lijn die helemaal bekend is,
// dan telkens een vak in een lijn waarin alleen dat vak nog leeg is. Geeft null als dat niet lukt,
// of de stappen: { som: lijn } voor de som, en { vak, lijn } voor een vak.
function losVierkantOp(open) {
  const key = ([r, k]) => `${r},${k}`,
    leeg = new Set(open.map(key)),
    vol = LIJNEN.find((l) => l.vakken.every((v) => !leeg.has(key(v))));
  if (!vol) return null;
  const stappen = [{ som: vol }];
  let verder = true;
  while (leeg.size && verder) {
    verder = false;
    for (const lijn of LIJNEN) {
      const weg = lijn.vakken.filter((v) => leeg.has(key(v)));
      if (weg.length !== 1) continue;
      stappen.push({ vak: weg[0], lijn });
      leeg.delete(key(weg[0]));
      verder = true;
    }
  }
  return leeg.size ? null : stappen;
}

// De uitwerking van het vierkant: eerst de som, dan per vak de som min de twee andere vakken.
function vierkantStappen(vk, stappen, letters) {
  const v = ([r, k]) => vk[r][k],
    som = qAdd(qAdd(vk[0][0], vk[1][1]), vk[2][2]);
  return stappen.map((s) => {
    if (s.som) {
      const [a, b, c] = s.som.vakken.map(v),
        ab = qAdd(a, b);
      return `De som van ${s.som.naam}: ${somTekst(a, '+', b)}, en ${somTekst(ab, '+', c)}. Elke rij, kolom en diagonaal heeft dus som ${t(som)}.`;
    }
    const L = letters[key2(s.vak)],
      [x, y] = s.lijn.vakken.filter((w) => key2(w) !== key2(s.vak)).map(v),
      xy = qAdd(x, y);
    return `In ${s.lijn.naam}: ${somTekst(x, '+', y)}, dus ${L} = ${somTekst(som, '-', xy)}`;
  });
}
const key2 = ([r, k]) => `${r},${k}`;

// Klopt het vierkant met de ingevulde getallen? Elke lijn moet dezelfde som hebben, met gewone
// getallen nagerekend.
function vierkantKlopt(vk, open, getallen) {
  const w = vk.map((r) => r.map(qv)),
    letters = vierkantLetters(open);
  Object.entries(letters).forEach(([pos, L]) => {
    const [r, k] = pos.split(',').map(Number);
    w[r][k] = getallen[L.charCodeAt(0) - 65];
  });
  const sommen = LIJNEN.map((l) => l.vakken.reduce((s, [r, k]) => s + w[r][k], 0));
  return sommen.every((s) => near(s, sommen[0]));
}

// De valkuilen per lege vak, als [veld, fout getal]. Bij terugrekenen is de fout om de bewerking van
// de piramide te doen in plaats van terug te rekenen. Bij breuken is de fout om de tellers en de
// noemers op te tellen. Met teken ook de goede waarde met het andere teken. Een fout getal dat
// gelijk is aan het goede telt niet, en een veld krijgt alleen de eerste valkuil met dat getal.
const VALKUILEN = {
  som: {
    terug: {
      id: 'opgeteld-bij-terugrekenen',
      m: 'Het vak erboven is de som van de twee vakken eronder. Een vak eronder vind je dus door het andere vak eronder van het vak erboven af te trekken.',
    },
    breuk: {
      id: 'tellers-en-noemers-opgeteld',
      m: 'Tel bij breuken niet de tellers en de noemers bij elkaar op. Maak de breuken eerst gelijknamig en tel dan de tellers op.',
    },
  },
  product: {
    terug: {
      id: 'vermenigvuldigd-bij-terugrekenen',
      m: 'Het vak erboven is het product van de twee vakken eronder. Een vak eronder vind je dus door het vak erboven te delen door het andere vak eronder.',
    },
  },
  teken: {
    id: 'minteken-fout',
    m: 'Op het minteken na klopt je antwoord. Kijk nog eens of de uitkomst positief of negatief is.',
  },
};

// Alles voor een vraag over een getallenpiramide, behalve de tekst van de vraag en de hint: de
// figuur, de velden, de uitwerking, de valkuilen en v. De velden staan in de volgorde van de letters.
// vorm geeft de velden een vorm, zie F in topics/shared.js. Met teken is er een valkuil voor een
// antwoord met het verkeerde teken.
function piramideVraag({ onder, soort, open, vorm, teken = false }) {
  const rijen = bouwPiramide(onder, soort),
    stappen = losPiramideOp(rijen, open),
    letters = piramideLetters(rijen, open),
    toon = rijen.map((rij, r) => rij.map((g, k) => letters[`${r},${k}`] ?? g)),
    pos = Object.fromEntries(
      Object.entries(letters).map(([p, L]) => [L, p.split(',').map(Number)]),
    ),
    namen = Object.keys(pos).sort(),
    goed = namen.map((L) => rijen[pos[L][0]][pos[L][1]]),
    fields = namen.map((L, i) => ({ ...F(`${L} =`, goed[i]), ...(vorm ? { vorm } : {}) }));
  const fout = { terug: [], breuk: [], teken: [] },
    v = ([r, k]) => rijen[r][k];
  for (const { vak, boven, c, a, b } of stappen) {
    const i = namen.indexOf(letters[`${vak[0]},${vak[1]}`]);
    if (!boven) fout.terug.push([i, OP[soort].doe(v(c), v(vak === a ? b : a))]);
    if (boven && soort === 'som' && (v(a).d > 1 || v(b).d > 1))
      fout.breuk.push([i, Q(v(a).n + v(b).n, v(a).d + v(b).d)]);
    if (teken) fout.teken.push([i, Q(-goed[i].n, goed[i].d)]);
  }
  const bezet = [],
    traps = [
      ['terug', VALKUILEN[soort].terug],
      ['breuk', VALKUILEN[soort].breuk],
      ['teken', VALKUILEN.teken],
    ]
      .map(([k, val]) => {
        const w = fout[k]
          .map(([i, x]) => [i, qv(x)])
          .filter(
            ([i, x]) => !near(x, qv(goed[i])) && !bezet.some(([j, y]) => i === j && near(x, y)),
          );
        bezet.push(...w);
        return w.length && { ...val, w, f: (vs) => w.some(([i, x]) => near(vs[i], x)) };
      })
      .filter(Boolean);
  return {
    fig: piramideFig(toon),
    fields,
    steps: piramideStappen(rijen, stappen, letters, soort),
    traps,
    v: () =>
      piramideKlopt(
        rijen,
        open,
        fields.map((f) => f.a),
        soort,
      ),
    rijen,
    namen,
  };
}

// Alle deelverzamelingen van k elementen uit xs, in een vaste volgorde.
const kiesK = (xs, k) =>
  k === 0 ? [[]] : xs.flatMap((x, i) => kiesK(xs.slice(i + 1), k - 1).map((rest) => [x, ...rest]));

// Welke k vakken van een piramide met n lagen leeg kunnen zijn: de puzzel is dan op te lossen, en
// minstens één vak vind je door terug te rekenen. Of dat lukt hangt alleen af van welke vakken leeg
// zijn, niet van de getallen. Een generator kiest er één met pick, zodat het tellen van de
// verschillende vragen elke keuze één keer telt.
function piramideOpen(n, k) {
  const vakken = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n - r }, (_, j) => [r, j]),
    ).flat(),
    rijen = bouwPiramide(Array(n).fill(1), 'som');
  return kiesK(vakken, k).filter((open) => {
    const s = losPiramideOp(rijen, open);
    return s && s.some((x) => !x.boven);
  });
}
// Welke k vakken van een magisch vierkant leeg kunnen zijn.
const vierkantOpen = (k) =>
  kiesK(
    [0, 1, 2].flatMap((r) => [0, 1, 2].map((j) => [r, j])),
    k,
  ).filter((open) => losVierkantOp(open));

// De letters van de lege vakken voor de tekst van de vraag: A, B en C.
const letterLijst = (xs) =>
  xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} en ${xs[xs.length - 1]}`;
// De valkuil voor een antwoord met het verkeerde teken, met als w de foute getallen per veld.
const mintekenFout = (w) => ({
  ...VALKUILEN.teken,
  w,
  f: (vs) => w.some(([i, x]) => near(vs[i], x)),
});

export {
  letterLijst,
  mintekenFout,
  piramideOpen,
  vierkantOpen,
  piramideVraag,
  somTekst,
  bouwPiramide,
  losPiramideOp,
  piramideLetters,
  piramideStappen,
  piramideKlopt,
  magisch,
  LIJNEN,
  vierkantLetters,
  losVierkantOp,
  vierkantStappen,
  vierkantKlopt,
};
