// Een berekening die de leerling zelf typt (#262): lezen, nakijken en de valkuilen. Dit bestand laadt
// alleen met de onderwerpen die zo'n veld hebben, zodat het eerste bezoek niet groter wordt. Het vult
// BEREKENING uit math.js in, dat checkField in answers.js en het formulier gebruiken, net als TEKEN bij
// een tekening.
import { near, BEREKENING } from './math.js';
import { netjes, parseNum } from './answers.js';

// Een berekening die de leerling zelf typt (#262), zoals (3 + 5) · (6 - 2). Keer mag als ·, *, × of x,
// en delen als :, ÷ of /. Een min aan het begin, na een rekenteken of na ( hoort bij het getal erachter,
// zoals in 4 · -3. Geeft de getallen en de rekentekens in de volgorde waarin ze staan, en de uitkomst
// met de rekenvolgorde. Bij elk getal staat in voor het teken dat er direct voor staat. Is de tekst geen berekening, zoals bij een haakje dat niet dicht is, een min
// voor een haakje of twee getallen zonder rekenteken ertussen, dan geeft het null.
// Typt de leerling de uitkomst erachter, zoals 4 · -3 = -12, dan telt die mee: klopt hij niet met de
// berekening, dan is de uitkomst geen getal en dus fout.
function leesBerekening(raw) {
  const delen = netjes(raw).split('=');
  if (delen.length > 2) return null;
  const r = leesLos(delen[0]);
  if (!r || delen.length === 1) return r;
  const na = parseNum(delen[1]);
  if (Number.isNaN(na)) return null;
  return near(na, r.waarde) ? r : { ...r, waarde: NaN };
}
function leesLos(raw) {
  const s = netjes(raw)
      .replace(/[·×*xX]/g, '*')
      .replace(/[÷/]/g, ':'),
    re = /\s*(\d+|[-+*:()])\s*/y,
    ts = [];
  let m;
  while (re.lastIndex < s.length && (m = re.exec(s))) ts.push(m[1]);
  if (!ts.length || re.lastIndex < s.length) return null;
  const getallen = [],
    tekens = [],
    voor = [];
  let i = 0;
  const een = () => {
    if (ts[i] === '(') {
      i++;
      const x = som();
      if (ts[i++] !== ')') throw 0;
      return x;
    }
    const min = ts[i] === '-';
    voor.push(ts[i - 1]);
    if (min) i++;
    if (!/^\d+$/.test(ts[i] ?? '')) throw 0;
    const x = (min ? -1 : 1) * ts[i++];
    getallen.push(x);
    return x;
  };
  const reeks = (ops, deel, doe) => {
    let x = deel();
    while (ops.includes(ts[i])) {
      const op = ts[i++];
      tekens.push(op);
      x = doe(op, x, deel());
    }
    return x;
  };
  const product = () => reeks(['*', ':'], een, (op, x, y) => (op === '*' ? x * y : x / y));
  const som = () => reeks(['+', '-'], product, (op, x, y) => (op === '+' ? x + y : x - y));
  try {
    const waarde = som();
    return i === ts.length ? { getallen, tekens, voor, waarde } : null;
  } catch (e) {
    return null;
  }
}
const zelfde = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
// Of de leerling de gegeven getallen gebruikt, in dezelfde volgorde. Met tekens moeten ook de
// rekentekens hetzelfde zijn: dan zet de leerling alleen haakjes. Zonder tekens mag de min van een
// getal in de plus of min ervoor zitten, want dat is dezelfde berekening: - 5 voor + -5, en + 5 voor
// - -5. Bij het eerste getal en na keer, delen of een haakje mag dat niet.
function zelfdeDelen(r, b) {
  if (b.tekens) return zelfde(r.getallen, b.getallen) && zelfde(r.tekens, b.tekens);
  return (
    r.getallen.length === b.getallen.length &&
    r.getallen.every(
      (x, j) => x === b.getallen[j] || (x === -b.getallen[j] && ['+', '-'].includes(r.voor[j])),
    )
  );
}
// Een berekening is goed als ze de gegeven getallen gebruikt en de gegeven uitkomst heeft.
function berekeningKlopt(b, raw) {
  const r = leesBerekening(raw);
  return !!r && zelfdeDelen(r, b) && near(r.waarde, b.uitkomst);
}
// De valkuilen die elke vraag met een berekening krijgt. De vraagsoort zet ze zelf in traps.
function berekeningTraps(fields = []) {
  const i = fields.findIndex((f) => f.berekening);
  if (i < 0) return [];
  const b = fields[i].berekening,
    lees = (raw) => leesBerekening(raw[i] ?? '');
  return [
    {
      id: 'berekening-andere-getallen',
      f: (v, raw = []) => {
        const r = lees(raw);
        return !!r && !zelfdeDelen(r, b);
      },
      m: b.tekens
        ? 'Gebruik dezelfde getallen en rekentekens als in de vraag, in dezelfde volgorde. Zet er alleen haakjes bij.'
        : 'Gebruik de getallen uit de vraag, in dezelfde volgorde. Zet er alleen rekentekens tussen, en als je wilt haakjes.',
    },
    {
      id: 'berekening-andere-uitkomst',
      f: (v, raw = []) => {
        const r = lees(raw);
        return !!r && zelfdeDelen(r, b) && !near(r.waarde, b.uitkomst);
      },
      m: `Je berekening geeft niet ${String(b.uitkomst).replace('-', '−')}. Reken hem na met de rekenvolgorde: eerst wat tussen haakjes staat, dan keer en delen, dan plus en min.`,
    },
  ];
}

// Een vraag met een berekening, met de valkuilen erbij.
const metBerekening = (q) => ({ ...q, traps: [...(q.traps ?? []), ...berekeningTraps(q.fields)] });

BEREKENING.klopt = berekeningKlopt;
BEREKENING.lees = leesBerekening;

export { leesBerekening, berekeningKlopt, berekeningTraps, metBerekening };
