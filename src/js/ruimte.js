// Ruimtefiguren: uitslagen van een kubus en van een balk. Alleen rekenwerk, geen DOM, zodat de tests
// het in Node draaien. Een figuur van zo'n uitslag van een kubus of balk tekent net() in ruimtefiguren.js.
//
// Een uitslag van een kubus is een lijst hokjes [x, y] op een rooster, met x naar rechts en y naar beneden. Elk
// hokje is een vlak. Twee hokjes met een gemeenschappelijke zijde zitten aan elkaar vast.
//
// Kubus: alles hieronder werkt voor een kubus. Balk: een uitslag van een balk heeft dezelfde vorm
// als een uitslag van een kubus, alleen zijn de vlakken rechthoeken. boxFaces rekent bij een vorm en
// de maten van de balk uit hoe groot elk vlak is en waar het ligt. Niet ondersteund: een
// vorm die bijna een uitslag van een kubus is, met vlakken die niet passen (de vorm klopt, maar de maten niet), en een
// uitslag van een balk met een vorm die geen uitslag van een kubus is. Zo'n uitslag bestaat niet,
// want vouwen hangt alleen van de vorm af, niet van de maten.
import { pick } from './math.js';

const key = ([x, y]) => `${x},${y}`;
// De vier buren van een hokje, met de richting waarin de kubus dan rolt.
const DIRS = [
  ['N', 0, -1],
  ['O', 1, 0],
  ['Z', 0, 1],
  ['W', -1, 0],
];

// Rol een kubus over de hokjes. De stand van de kubus is [boven, onder, noord, zuid, oost, west],
// met in elke plek het nummer van het zijvlak dat daar nu is. De kubus begint met de zijvlakken
// 0 tot en met 5, dus zijvlak f ligt steeds tegenover zijvlak f ^ 1. Rolt de kubus naar het
// noorden, dan komt het noordvlak onder, het bovenvlak naar het noorden, enzovoort. Het vlak dat
// onder ligt, is het zijvlak dat bij het hokje hoort.
// De assen [x, y, z] zeggen bij een balk welke maat (0, 1 of 2) nu in de richting van x (naar
// rechts), y (naar beneden in het rooster) en z (omhoog) ligt. Rollen naar het noorden of zuiden
// verwisselt y en z, rollen naar het oosten of westen verwisselt x en z.
function roll([t, b, n, s, e, w], [ax, ay, az], dir) {
  if (dir === 'N')
    return [
      [s, n, t, b, e, w],
      [ax, az, ay],
    ];
  if (dir === 'Z')
    return [
      [n, s, b, t, e, w],
      [ax, az, ay],
    ];
  if (dir === 'O')
    return [
      [w, e, n, s, t, b],
      [az, ay, ax],
    ];
  return [
    [e, w, n, s, b, t],
    [az, ay, ax],
  ];
}

// Vouwt de hokjes: geeft per hokje het zijvlak, de assen en het hokje waar het aan vastzit (het
// eerste hokje zit nergens aan vast), in de volgorde waarin het vouwen ze bereikt. Geeft null als een
// hokje dubbel staat, de hokjes niet één stuk zijn of twee hokjes op hetzelfde zijvlak komen.
function fold(cells) {
  if (!cells.length) return null;
  const at = new Map(cells.map((c, i) => [key(c), i]));
  if (at.size !== cells.length) return null;
  const info = Array(cells.length),
    used = new Set([1]),
    order = [0];
  info[0] = { face: 1, state: [0, 1, 2, 3, 4, 5], axes: [0, 1, 2], from: -1, dir: null };
  // Breedte eerst: elk hokje komt na het hokje waar het aan vastzit.
  for (let k = 0; k < order.length; k++) {
    const i = order[k],
      [x, y] = cells[i];
    for (const [dir, dx, dy] of DIRS) {
      const j = at.get(key([x + dx, y + dy]));
      if (j === undefined || info[j]) continue;
      const [state, axes] = roll(info[i].state, info[i].axes, dir);
      if (used.has(state[1])) return null;
      used.add(state[1]);
      info[j] = { face: state[1], state, axes, from: i, dir };
      order.push(j);
    }
  }
  if (order.length !== cells.length) return null;
  return { info, order };
}

// Is dit een uitslag van een kubus? Zes hokjes, één stuk, en elk hokje een eigen zijvlak.
const isCubeNet = (cells) => cells.length === 6 && fold(cells) !== null;

// Het zijvlak (0 tot en met 5) van elk hokje als je de uitslag van een kubus vouwt, of null als het geen uitslag van een kubus
// is. Zijvlak f ligt tegenover zijvlak f ^ 1: 0 en 1, 2 en 3, 4 en 5.
function cubeFaces(cells) {
  if (!isCubeNet(cells)) return null;
  return fold(cells).info.map((v) => v.face);
}

// Het hokje (de plek in cells) dat tegenover hokje i komt als je de uitslag van een kubus vouwt, of -1 als het
// geen uitslag van een kubus is.
function opposite(cells, i) {
  const faces = cubeFaces(cells);
  return faces ? faces.indexOf(faces[i] ^ 1) : -1;
}

// De acht standen van een vorm: vier keer een kwartslag draaien, en dat ook gespiegeld. Een stand is
// een functie die een hokje [x, y] verplaatst.
const TURNS = [
  ([x, y]) => [x, y],
  ([x, y]) => [-y, x],
  ([x, y]) => [-x, -y],
  ([x, y]) => [y, -x],
  ([x, y]) => [-x, y],
  ([x, y]) => [y, x],
  ([x, y]) => [x, -y],
  ([x, y]) => [-y, -x],
];
// Schuift de hokjes zo dat de kleinste x en y 0 zijn, en zet ze op volgorde: per rij van links
// naar rechts, van boven naar beneden.
function normalize(cells) {
  const x0 = Math.min(...cells.map((c) => c[0])),
    y0 = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - x0, y - y0]).sort((p, q) => p[1] - q[1] || p[0] - q[0]);
}
const text = (cells) => cells.map(key).join(' ');
// Een uitslag in een willekeurige van de acht standen, gekozen met het toeval van de vraag.
const turned = (cells) => {
  const t = pick(TURNS);
  return cells.map(t);
};

// Een vaste stand van een vorm, hetzelfde na draaien, spiegelen of schuiven. Zo zie je of twee
// uitslagen van een kubus dezelfde vorm hebben, en welke van de elf het is.
function canonicalNet(cells) {
  let best = null;
  for (const s of TURNS) {
    const c = normalize(cells.map(s));
    if (!best || text(c) < text(best)) best = c;
  }
  return best;
}

// Alle elf uitslagen van een kubus, met de hand opgeschreven, zodat een test isCubeNet ertegen kan
// controleren. In een rooster, met # voor een vlak:
//  - Zes met een rij van vier, één vlak erboven en één eronder (1-4-1).
//  - Drie met twee vlakken, dan een rij van drie, dan één vlak (2-3-1).
//  - De trap: twee, twee en twee vlakken, steeds één opgeschoven (2-2-2).
//  - Twee rijen van drie, twee opgeschoven (3-3).
const row4 = [
  [0, 1],
  [1, 1],
  [2, 1],
  [3, 1],
];
const CUBE_NETS = [
  ...[
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 1],
    [1, 2],
  ].map(([a, b]) => canonicalNet([[a, 0], ...row4, [b, 2]])),
  ...[1, 2, 3].map((b) =>
    canonicalNet([
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
      [3, 1],
      [b, 2],
    ]),
  ),
  canonicalNet([
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
    [2, 2],
    [3, 2],
  ]),
  canonicalNet([
    [0, 0],
    [1, 0],
    [2, 0],
    [2, 1],
    [3, 1],
    [4, 1],
  ]),
];

// Zitten de hokjes aan elkaar vast, als één stuk?
function connected(cells) {
  const at = new Set(cells.map(key)),
    seen = new Set([key(cells[0])]),
    todo = [cells[0]];
  while (todo.length) {
    const [x, y] = todo.pop();
    for (const [, dx, dy] of DIRS) {
      const k = key([x + dx, y + dy]);
      if (at.has(k) && !seen.has(k)) {
        seen.add(k);
        todo.push([x + dx, y + dy]);
      }
    }
  }
  return seen.size === cells.length;
}
// Vier hokjes in een vierkant van 2 bij 2: dat is meteen te zien als geen uitslag van een kubus.
const hasBlock = (cells) => {
  const at = new Set(cells.map(key));
  return cells.some(([x, y]) =>
    [
      [x + 1, y],
      [x, y + 1],
      [x + 1, y + 1],
    ].every((c) => at.has(key(c))),
  );
};

// Alle vormen die bijna een uitslag van een kubus zijn: verschuif één hokje naar een andere plek naast de rest, zodat
// de vorm één stuk blijft maar geen uitslag van een kubus meer is. Als je hem vouwt, komen twee
// hokjes op hetzelfde zijvlak, en blijft er een zijvlak open. Een vorm met een vierkant van 2 bij 2
// telt niet mee, want die is te makkelijk. Elke vorm staat er één keer in, ook na draaien of
// spiegelen, zodat je er verschillende keuzes van kunt maken. Altijd in dezelfde volgorde.
function notCubeNets(cells) {
  const out = [],
    seen = new Set();
  cells.forEach((c, i) => {
    const rest = cells.filter((_, j) => j !== i);
    if (!connected(rest)) return;
    const taken = new Set(cells.map(key)),
      spots = new Map();
    for (const [x, y] of rest)
      for (const [, dx, dy] of DIRS) {
        const p = [x + dx, y + dy];
        if (!taken.has(key(p))) spots.set(key(p), p);
      }
    [...spots.values()]
      .sort((p, q) => p[1] - q[1] || p[0] - q[0])
      .forEach((p) => {
        const shape = [...rest, p];
        if (isCubeNet(shape) || hasBlock(shape)) return;
        const k = text(canonicalNet(shape));
        if (seen.has(k)) return;
        seen.add(k);
        out.push(normalize(shape));
      });
  });
  return out;
}
// Eén vorm die bijna een uitslag van een kubus is, gekozen met het toeval van de vraag.
const notCubeNet = (cells) => pick(notCubeNets(cells));

// De vlakken van een uitslag van een balk met maten [l, b, h]: per hokje { x, y, w, h }, de plek
// van de linkerbovenhoek en de breedte en hoogte, in hokjes van het rooster. Het eerste hokje wordt
// een vlak van l breed en b hoog; de rest volgt uit het vouwen. Geeft null als de vorm geen uitslag
// van een kubus is, of als vlakken met deze maten over elkaar heen zouden vallen.
function boxFaces(cells, dims) {
  if (!isCubeNet(cells)) return null;
  const { info, order } = fold(cells),
    out = Array(cells.length);
  for (const i of order) {
    const { axes, from, dir } = info[i],
      w = dims[axes[0]],
      h = dims[axes[1]];
    if (from < 0) {
      out[i] = { x: 0, y: 0, w, h };
      continue;
    }
    const p = out[from];
    out[i] = {
      x: dir === 'O' ? p.x + p.w : dir === 'W' ? p.x - w : p.x,
      y: dir === 'Z' ? p.y + p.h : dir === 'N' ? p.y - h : p.y,
      w,
      h,
    };
  }
  const x0 = Math.min(...out.map((r) => r.x)),
    y0 = Math.min(...out.map((r) => r.y));
  for (const r of out) {
    r.x -= x0;
    r.y -= y0;
  }
  const overlap = (a, b) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  for (let i = 0; i < out.length; i++)
    for (let j = i + 1; j < out.length; j++) if (overlap(out[i], out[j])) return null;
  return out;
}

export {
  isCubeNet,
  cubeFaces,
  opposite,
  canonicalNet,
  CUBE_NETS,
  notCubeNets,
  notCubeNet,
  boxFaces,
  TURNS,
  turned,
};
