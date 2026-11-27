// De puzzels (#262): een getallenpiramide en een magisch vierkant mogen maar één goede invulling
// hebben. puzzels.js kiest de lege vakken zo dat je ze een voor een kunt uitrekenen. Deze test
// rekent op een andere manier na dat de invulling dan vastligt: met de rang van het stelsel
// vergelijkingen. Is die rang zo groot als het aantal onbekenden, dan is er maar één oplossing.
// Een piramide met producten heeft geen 0, en daar legt elke stap van het oplossen het vak al precies
// vast: vermenigvuldigen, of delen door een getal dat niet 0 is.
import test from 'node:test';
import assert from 'node:assert/strict';
import { piramideOpen, vierkantOpen, LIJNEN, somTekst } from '../src/js/puzzels.js';
import { piramideFig, vierkantFig } from '../src/js/getalfiguren.js';
import { Q } from '../src/js/math.js';

// De rang van een matrix, met vegen en gewone getallen (de getallen zijn klein en heel).
function rang(m) {
  m = m.map((r) => [...r]);
  let r = 0;
  for (let c = 0; c < (m[0]?.length ?? 0) && r < m.length; c++) {
    const p = m.findIndex((rij, i) => i >= r && Math.abs(rij[c]) > 1e-9);
    if (p < 0) continue;
    [m[r], m[p]] = [m[p], m[r]];
    for (let i = 0; i < m.length; i++)
      if (i !== r) {
        const f = m[i][c] / m[r][c];
        m[i] = m[i].map((x, j) => x - f * m[r][j]);
      }
    r++;
  }
  return r;
}

test('een getallenpiramide met lege vakken heeft maar één invulling (#262)', () => {
  for (const [n, k] of [
    [3, 3],
    [4, 4],
  ]) {
    // Elk vak is een som van de onderste laag: vak [r, j] is de som van C(r, i) maal onderste vak j + i.
    const C = (a, b) => (b < 0 || b > a ? 0 : b === 0 ? 1 : (C(a - 1, b - 1) * a) / b);
    const rij = (r, j) => Array.from({ length: n }, (_, x) => C(r, x - j));
    const lijst = piramideOpen(n, k);
    assert.ok(lijst.length > 10, `genoeg keuzes voor ${n} lagen`);
    for (const open of lijst) {
      // De bekende vakken geven elk een vergelijking in de onderste laag.
      const bekend = [];
      for (let r = 0; r < n; r++)
        for (let j = 0; j < n - r; j++)
          if (!open.some(([a, b]) => a === r && b === j)) bekend.push(rij(r, j));
      assert.equal(rang(bekend), n, `lege vakken ${JSON.stringify(open)}`);
    }
  }
});

test('een magisch vierkant met vier lege vakken heeft maar één invulling (#262)', () => {
  const lijst = vierkantOpen(4);
  assert.ok(lijst.length > 10, 'genoeg keuzes');
  for (const open of lijst) {
    // Onbekenden: de negen vakken en de som. Elke lijn: de drie vakken min de som is 0. Elk bekend
    // vak ligt vast. De rang moet 10 zijn.
    const m = LIJNEN.map(({ vakken }) => {
      const r = Array(10).fill(0);
      vakken.forEach(([a, b]) => (r[3 * a + b] = 1));
      r[9] = -1;
      return r;
    });
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++)
        if (!open.some(([x, y]) => x === a && y === b)) {
          const r = Array(10).fill(0);
          r[3 * a + b] = 1;
          m.push(r);
        }
    assert.equal(rang(m), 10, `lege vakken ${JSON.stringify(open)}`);
  }
});

test('de figuur van een puzzel noemt elk getal en elke letter (#262)', () => {
  const p = piramideFig([[Q(-7, 4), 'B', Q(3)], [Q(1, 2), 'A'], [Q(5)]]),
    label = p.match(/aria-label="([^"]*)"/)[1];
  assert.match(label, /onderste laag staan van links naar rechts −1 3\/4, vak B en 3\./);
  assert.match(label, /In het bovenste vak staat 5\./);
  // Een breuk staat als teller boven noemer, met de helen ervoor.
  assert.match(p, />−1<\/text>/);
  assert.match(p, />3<\/text><path class="ax"[^>]*\/><text[^>]*>4<\/text>/);
  const v = vierkantFig([
    ['A', Q(1), Q(-1, 2)],
    [Q(2), Q(0), 'B'],
    [Q(3), Q(4), Q(5)],
  ]);
  assert.match(v, /In rij 1 van boven staan vak A, 1 en −1\/2\./);
});

test('een som van breuken in de uitwerking maakt eerst gelijknamig (#262)', () => {
  assert.equal(somTekst(Q(5, 4), '-', Q(3, 4)), '{1 1/4} - {3/4} = {5/4} - {3/4} = {2/4} = {1/2}');
  assert.equal(somTekst(Q(4), '-', Q(-3)), '4 - -3 = 7');
  // Is de uitkomst 0, dan staat er geen {0/12}.
  assert.equal(somTekst(Q(1, 4), '-', Q(1, 6)), '{1/4} - {1/6} = {3/12} - {2/12} = {1/12}');
  assert.equal(somTekst(Q(-1, 4), '+', Q(1, 4)), '-{1/4} + {1/4} = 0');
  assert.equal(somTekst(Q(0), '+', Q(-9, 4)), '0 + {-2 1/4} = {-2 1/4}');
});
