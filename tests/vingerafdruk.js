// Een vingerafdruk per vraagsoort: een korte hash van de antwoorden bij een paar vaste seeds. Die
// verandert als dezelfde seed een andere vraag geeft, en dan toont een gedeelde link ineens een
// andere vraag dan de leerling zag. Zie #60, tests/vingerafdrukken.test.js en
// scripts/vingerafdrukken.js.
import { createHash } from 'node:crypto';
import { TOPICS, makeQuestion } from '../src/js/topics/index.js';

// Genoeg seeds om elke tak van een generator te raken, en snel genoeg voor npm test.
const SEEDS = Array.from({ length: 25 }, (_, i) => 1000 + i * 7919);

// Wat de vraag bepaalt: de getallen in de vraag, de antwoorden, de keuzes en de lijn of parabool. Andere
// woorden, een hint of een uitwerking veranderen de vraag niet, en mogen dus zonder nieuwe versie.
// De figuur telt niet mee, want daarin staat ook de opmaak. Wat erin gegeven is, staat meestal ook
// in de vraag of het antwoord.
// Met het teken ervoor, zodat ook `4s − 29` tegenover `4s + 29` opvalt.
const numbers = (html) =>
  (html.replace(/<[^>]*>/g, ' ').match(/(?:[−+-]\s?)?\d+(?:[.,]\d+)?/g) ?? []).map((n) =>
    n.replace(/\s/g, ''),
  );
// De negatieve min (#244) is alleen opmaak: zet hem terug naar een gewone −, zodat de vingerafdrukken
// van vóór die opmaak blijven kloppen. Het sluitende </span> van .negatief hoort bij de span die
// opengaat, ook als er een breuk met eigen spans in staat.
function zonderNegatief(html) {
  const open = '<span class="negatief"><span class="nmin">−</span>';
  let i;
  while ((i = html.indexOf(open)) >= 0) {
    let j = i + open.length,
      diepte = 1;
    const re = /<span\b[^>]*>|<\/span>/g;
    re.lastIndex = j;
    let m;
    while (diepte && (m = re.exec(html))) {
      diepte += m[0] === '</span>' ? -1 : 1;
      j = m.index;
    }
    // Staat er een breuk achter, zet de min dan in de teller. Anders komen er tussen de min en het
    // getal twee spaties als numbers de tags weghaalt, en valt het teken weg (#256).
    const binnen = html.slice(i + open.length, j),
      teller = '<span class="f"><span>',
      zonder = binnen.startsWith(teller)
        ? `${teller}−${binnen.slice(teller.length)}`
        : `−${binnen}`;
    html = `${html.slice(0, i)}${zonder}${html.slice(j + '</span>'.length)}`;
  }
  return html;
}
const answers = (q) => ({
  numbers: numbers(zonderNegatief(q.q)),
  fields: (q.fields ?? []).map((f) => f.a),
  // Een keuze die een figuur is, zoals een schets, telt net als de figuur van de vraag niet mee.
  mc: q.mc
    ? { opts: q.mc.opts.map((o) => (/^<svg/.test(o) ? 'figuur' : zonderNegatief(o))), a: q.mc.a }
    : null,
  line: q.line ?? null,
  // Alleen bij een parabool tekenen, zodat de vingerafdruk van de andere vraagsoorten gelijk blijft.
  ...(q.parabola ? { parabola: q.parabola } : {}),
});
// Afgerond op 10 cijfers, zodat een verschil in de laatste bit tussen Node-versies, bijvoorbeeld
// bij Math.sin, geen vals alarm geeft.
const steady = (key, x) => (typeof x === 'number' ? Number(x.toPrecision(10)) : x);

function fingerprints() {
  const out = {};
  for (const skill of TOPICS.flatMap((t) => t.skills)) {
    const data = JSON.stringify(
      SEEDS.map((seed) => answers(makeQuestion(skill, seed))),
      steady,
    );
    out[skill.id] = createHash('sha256').update(data).digest('hex').slice(0, 12);
  }
  return out;
}

export { fingerprints };
