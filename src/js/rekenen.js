// Het rekenen van de Rekenhulp (#18): een som als tekst, zoals de leerling die intikt, naar een getal. Zonder DOM, zodat de
// tests het in Node draaien. De Rekenhulp zelf (ui/rekenhulp.js) gebruikt dit. Er is geen `eval`: een eigen, kleine parser.
//
// Wat de leerling intikt: cijfers met een komma, + − × ÷ ^ ( ) √ π en ANS (de vorige uitkomst). Het gewone
// toetsenbord geeft - * / en een punt, en die lezen we ook. Een som mag onvolledig zijn, zoals `(2+3`: de haakjes sluiten
// we zelf. Dat is voor de uitkomst die je al ziet terwijl je typt.
//
// Wat dit bewust niet doet: afronden en breuken maken. Een uitkomst heeft alle cijfers (op 12 na, tegen
// afrondingsruis als 0,1 + 0,2), en de leerling rondt zelf af of maakt zelf een breuk.

// Een som die niet lukt, met een melding voor de leerling. Een lege melding is een som zonder tekens.
export class RekenFout extends Error {}

const TEKEN = /\s*(\d+(?:\.\d*)?|\.\d+|ANS|π|√|[-+*/^()])/y;

// De som in stukken: getallen, tekens en haakjes. Haakjes die nog open staan, sluiten we.
function stukken(som) {
  const s = som.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
  const lijst = [];
  TEKEN.lastIndex = 0;
  let m,
    tot = 0;
  // Een mislukte poging zet lastIndex weer op 0, dus tot waar het lukte houden we zelf bij.
  while ((m = TEKEN.exec(s))) {
    lijst.push(m[1]);
    tot = TEKEN.lastIndex;
  }
  // Er blijft iets over dat geen teken is, zoals een letter. Alleen spaties aan het eind mogen.
  if (s.slice(tot).trim()) throw new RekenFout('Dat begrijp ik niet.');
  const open = lijst.filter((t) => t === '(').length - lijst.filter((t) => t === ')').length;
  for (let i = 0; i < open; i++) lijst.push(')');
  return lijst;
}

// Rekent een som uit. `ans` is de vorige uitkomst. Gooit een RekenFout met een melding voor de leerling.
export function rekenUit(som, ans = 0) {
  const tok = stukken(som);
  if (!tok.length) throw new RekenFout('');
  // Een heel lange som laat de parser te diep gaan, en niemand tikt dit in.
  if (tok.length > 500) throw new RekenFout('Die som is te lang.');
  let i = 0;
  const getal = (t) => t !== undefined && /^[\d.]/.test(t);
  const mislukt = () => new RekenFout('Dat begrijp ik niet.');

  function optelling() {
    let v = product();
    while (tok[i] === '+' || tok[i] === '-') {
      const op = tok[i++];
      const w = product();
      v = op === '+' ? v + w : v - w;
    }
    return v;
  }
  function product() {
    let v = teken();
    for (;;) {
      const t = tok[i];
      if (t === '*' || t === '/') {
        i++;
        const w = teken();
        if (t === '/' && w === 0) throw new RekenFout('Delen door 0 kan niet.');
        v = t === '*' ? v * w : v / w;
        continue;
      }
      // Zonder teken ertussen mag het bij haakjes, √, π en ANS: 2(3+4), 3π. Twee getallen achter
      // elkaar, zoals 2 3, mag niet.
      const vorige = tok[i - 1];
      const maalZonderTeken =
        t === '(' ||
        t === '√' ||
        t === 'π' ||
        t === 'ANS' ||
        (getal(t) && [')', 'π', 'ANS'].includes(vorige));
      if (maalZonderTeken) {
        v *= macht();
        continue;
      }
      return v;
    }
  }
  function teken() {
    if (tok[i] === '-') {
      i++;
      return -teken();
    }
    if (tok[i] === '+') {
      i++;
      return teken();
    }
    return macht();
  }
  function macht() {
    const grondtal = enkel();
    if (tok[i] === '^') {
      i++;
      return Math.pow(grondtal, teken());
    }
    return grondtal;
  }
  function enkel() {
    const t = tok[i++];
    if (t === undefined) throw mislukt();
    if (getal(t)) return Number(t);
    if (t === 'π') return Math.PI;
    if (t === 'ANS') return ans;
    if (t === '(') {
      const v = optelling();
      if (tok[i++] !== ')') throw mislukt();
      return v;
    }
    // Een wortel pakt alleen het getal of de haakjes erachter: √9 + 16 is 3 + 16, en √(9 + 16) is 5.
    if (t === '√') {
      // √−4 mag ook zonder haakjes, zodat de melding klopt.
      const v = tok[i] === '-' ? (i++, -enkel()) : enkel();
      if (v < 0) throw new RekenFout('Een wortel van een negatief getal kan niet.');
      return Math.sqrt(v);
    }
    throw mislukt();
  }

  const v = optelling();
  if (i < tok.length) throw mislukt();
  if (Number.isNaN(v)) throw new RekenFout('Dat kan niet.');
  if (!Number.isFinite(v) || Math.abs(v) >= 1e15) throw new RekenFout('Dat getal is te groot.');
  return v;
}

// Een uitkomst zoals de leerling die leest en overneemt: met een komma, een echt minteken, en op 12
// cijfers, of 15 bij een getal vanaf 10^11, want een geheel getal met veel cijfers mag niet worden afgekapt. Dat haalt
// afrondingsruis weg (0,1 + 0,2 is 0,3), maar rondt verder niets af.
export function toon(x) {
  const g = Number(x.toPrecision(Math.abs(x) >= 1e11 ? 15 : 12));
  let s = String(g);
  // Heel kleine getallen schrijft JavaScript met een e, en dat kan de leerling niet overnemen. Zo klein dat het
  // niet meer te schrijven is, tonen we als 0.
  if (/e/.test(s))
    s =
      Math.abs(g) < 1e-80
        ? '0'
        : g.toFixed(11 - Math.floor(Math.log10(Math.abs(g)))).replace(/0+$/, '');
  return s.replace('.', ',').replace('-', '−');
}

// Een getal dat in een som wordt geplakt. Een negatief getal gaat tussen haakjes, anders wordt `7` en
// `−2` stilletjes `7−2`.
export const plakbaar = (tekst) => (tekst.startsWith('−') ? `(${tekst})` : tekst);

// De uitkomst van een som voor in de Rekenhulp: het getal in tekst, of een melding. Een lege som geeft null.
export function uitkomst(som, ans = 0) {
  try {
    const v = rekenUit(som, ans);
    return { v, tekst: toon(v) };
  } catch (e) {
    if (!(e instanceof RekenFout)) throw e;
    return e.message ? { fout: e.message } : null;
  }
}
