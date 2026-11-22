// Het rekenen van de Rekenhulp (src/js/rekenen.js): volgorde van bewerkingen, tekens, haakjes, meldingen en hoe een
// uitkomst eruitziet.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rekenUit, toon, plakbaar, uitkomst, RekenFout } from '../src/js/rekenen.js';

const is = (som, verwacht, ans) => assert.equal(rekenUit(som, ans), verwacht, som);
const fout = (som, melding) =>
  assert.throws(
    () => rekenUit(som),
    (e) => e instanceof RekenFout && (melding === undefined || e.message === melding),
    som,
  );

test('de volgorde van bewerkingen', () => {
  is('2+3×4', 14);
  is('(2+3)×4', 20);
  is('10−4−3', 3);
  is('24÷4÷2', 3);
  is('2^3^2', 512);
  is('2×3^2', 18);
  is('−2^2', -4);
});

test('de tekens van het toetsenbord en van de Rekenhulp geven hetzelfde', () => {
  is('3×4−1', 11);
  is('3*4-1', 11);
  is('8/2', 4);
  is('2,5+1,5', 4);
  is('2.5+1.5', 4);
});

test('een min voor een getal, ook na een teken en in haakjes', () => {
  is('−3+5', 2);
  is('5−−3', 8);
  is('3×−2', -6);
  is('(−2)×(−3)', 6);
  is('3×2+−1', 5);
  is('+4', 4);
});

test('keer zonder teken bij haakjes, wortel, π en ANS', () => {
  is('2(3+4)', 14);
  is('3(−2)', -6);
  is('(1+1)(2+2)', 8);
  is('2π', 2 * Math.PI);
  is('3ANS', 12, 4);
  is('(2)3', 6);
  // Twee getallen achter elkaar is geen keer: dat is een tikfout.
  fout('2 3', 'Dat begrijp ik niet.');
});

test('wortel en macht', () => {
  is('√49', 7);
  is('√(9+16)', 5);
  // Een wortel pakt alleen het getal of de haakjes erachter.
  is('√9+16', 19);
  is('√9^2', 9);
  is('2×√9', 6);
  is('5^2', 25);
  is('2^−1', 0.5);
  is('4^0,5', 2);
  assert.ok(Math.abs(rekenUit('√2×√2') - 2) < 1e-12);
});

test('ANS is de uitkomst zoals de leerling die ziet', () => {
  // 0,1 + 0,2 toont 0,3, dus ANS − 0,3 is 0 en geen 5,5e-17.
  const eerst = uitkomst('0,1+0,2');
  assert.equal(eerst.tekst, '0,3');
  assert.equal(eerst.v, 0.3);
  assert.equal(rekenUit('ANS−0,3', eerst.v), 0);
  assert.equal(uitkomst('2÷3').v, 0.666666666667);
  assert.equal(uitkomst('−2×1,5').v, -3);
});

test('ANS en π', () => {
  is('ANS+1', 8, 7);
  is('ANS', 0);
  assert.equal(rekenUit('π'), Math.PI);
});

test('haakjes die nog open staan, sluiten we zelf', () => {
  is('(2+3', 5);
  is('2×(3+(4', 14);
  fout('2+3)');
});

test('meldingen bij een som die niet kan', () => {
  fout('5÷0', 'Delen door 0 kan niet.');
  fout('5÷(3−3)', 'Delen door 0 kan niet.');
  fout('√−4', 'Een wortel van een negatief getal kan niet.');
  fout('√(2−5)', 'Een wortel van een negatief getal kan niet.');
  fout('9^99', 'Dat getal is te groot.');
  // Een som die geen getal geeft, is niet te groot.
  fout('10^400*0', 'Dat kan niet.');
  fout('10^400/10^400', 'Dat kan niet.');
  // Een heel diepe som geeft een melding en geen crash.
  fout('('.repeat(20000) + '1', 'Die som is te lang.');
  fout('-'.repeat(20000) + '1', 'Die som is te lang.');
  fout('√'.repeat(20000) + '1', 'Die som is te lang.');
  fout('2+', 'Dat begrijp ik niet.');
  fout('×3', 'Dat begrijp ik niet.');
  fout('()', 'Dat begrijp ik niet.');
  fout('2a', 'Dat begrijp ik niet.');
  fout('2^', 'Dat begrijp ik niet.');
  // Een lege som is geen fout, maar er valt niets te melden.
  fout('', '');
  fout('   ', '');
});

test('een uitkomst heeft een komma, een echt minteken en op 12 cijfers na alles', () => {
  assert.equal(toon(9.43), '9,43');
  assert.equal(toon(-13), '−13');
  assert.equal(toon(0), '0');
  // De afrondingsruis van drijvende komma verdwijnt.
  assert.equal(toon(0.1 + 0.2), '0,3');
  assert.equal(toon(3 * 2.35 + 2 * 1.19), '9,43');
  // Verder rondt het niets af: een leerling rondt zelf af en maakt zelf een breuk.
  assert.equal(toon(Math.sqrt(50)), '7,07106781187');
  assert.equal(toon(19 / 12), '1,58333333333');
  assert.equal(toon(2 / 3), '0,666666666667');
  // Een heel klein getal komt niet met een e te staan, ook niet als het kleiner is dan 1e-20.
  assert.equal(toon(0.00000000012), '0,00000000012');
  assert.equal(toon(1e-21), '0,000000000000000000001');
  assert.equal(toon(-1e-21), '−0,000000000000000000001');
  assert.equal(toon(rekenUit('0,00000000001×0,00000000001')), '0,000000000000000000000' + '1');
  assert.equal(toon(1e-200), '0');
  // toFixed kan hoogstens 100 cijfers aan. Net boven de grens kan het nog, net eronder wordt het 0.
  assert.equal(toon(rekenUit('10^−79')), '0,' + '0'.repeat(78) + '1');
  assert.equal(toon(rekenUit('10^−90')), '0');
  assert.equal(toon(5e-90), '0');
  // Een geheel getal van meer dan 12 cijfers wordt niet afgekapt.
  assert.equal(toon(123456789012345), '123456789012345');
  assert.equal(toon(999999999999.5), '999999999999,5');
  assert.equal(toon(rekenUit('123456789012×1000')), '123456789012000');
});

test('plakken: een negatief getal gaat tussen haakjes', () => {
  assert.equal(plakbaar('7,5'), '7,5');
  assert.equal(plakbaar('−2'), '(−2)');
  is(`7${plakbaar('−2')}`, -14);
  is(`7×${plakbaar('−2')}`, -14);
  is(`7+${plakbaar('−2')}`, 5);
});

test('uitkomst geeft het getal en de tekst, of een melding, of niets', () => {
  assert.deepEqual(uitkomst('3×−2'), { v: -6, tekst: '−6' });
  assert.deepEqual(uitkomst('5÷0'), { fout: 'Delen door 0 kan niet.' });
  assert.equal(uitkomst(''), null);
  assert.equal(uitkomst('3ANS', 4).tekst, '12');
});

test('de voorbeelden van het prototype geven de goede antwoorden', () => {
  assert.equal(toon(rekenUit('3×2,35+2×1,19')), '9,43');
  assert.equal(toon(rekenUit('3×−2−7')), '−13');
  assert.equal(toon(rekenUit('(5+9)÷2')), '7');
  assert.equal(toon(rekenUit('(5−9)÷2')), '−2');
  assert.equal(toon(rekenUit('3÷4+5÷6')), '1,58333333333');
});
