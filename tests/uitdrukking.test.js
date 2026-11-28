// Een uitdrukking die de leerling zelf typt (#304): lezen, gelijk aan het goede antwoord (in elke volgorde),
// herleid of niet, de valkuilen en hoe hij eruitziet. Er is nog geen vraagsoort met zo'n veld; de vraag
// hieronder is alleen voor de test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAnswer, checkField, findTrap } from '../src/js/answers.js';
import {
  U,
  UF,
  invullen,
  leesUitdrukking as lees,
  metUitdrukking,
  NIET_HERLEID,
  uitdrukkingOordeel as oordeel,
} from '../src/js/uitdrukking.js';
import { UITDRUKKING } from '../src/js/math.js';
import { VALKUIL_ID } from '../src/js/tel.js';

const veld = (a, opties = {}) => UF('', a, opties);
// Geeft 'goed', 'fout', 'onleesbaar' of de reden waarom het niet herleid is.
function uitslag(a, raw, opties) {
  if (!lees(raw)) return 'onleesbaar';
  const o = oordeel(veld(a, opties), raw);
  return o.goed ? 'goed' : o.gelijk ? o.fout : 'fout';
}
const allemaal = (a, lijst, verwacht, opties) => {
  for (const raw of lijst) assert.equal(uitslag(a, raw, opties), verwacht, `${raw} bij ${a}`);
};

test('een uitdrukking lezen: getallen, letters, machten, wortels, breuken en minnen (#304)', () => {
  for (const s of [
    '12a^3b^6',
    '12a³b⁶',
    '2a/(3c)',
    '(3y + 4x)/(xy)',
    '6√3',
    '√(16/49)',
    '-x^8',
    '−x⁸',
    '–x^8',
    '2 1/3x',
    '7/3x',
    '2½x',
    '0,5x',
    '3x · -2x',
    '3x * -2x',
    '3x × -2x',
    '4 : -2',
    '4 ÷ 2',
    '2(x + 3)(x - 1)',
    'a - -b',
    'x^(2)',
    '  2a  +  3b ',
  ])
    assert.ok(lees(s), s);
  for (const s of [
    '',
    '   ',
    '12a^3b^6 +',
    '(x + 1',
    'x + 1)',
    'a2',
    '3 4',
    'x/0',
    '1/(x - x)',
    '√x',
    '√-4',
    'x^a',
    'x^2^3',
    'x^-2',
    'x^99',
    '2,',
    '2 + * 3',
    'x = 3',
    '99999999999^3',
  ])
    assert.equal(lees(s), null, s);
});

test('gelijk is gelijk als uitdrukking, in elke volgorde (#304)', () => {
  allemaal('12a^3b^6', ['12a^3b^6', '12b^6a^3', '12 b^6 a^3', '12a³b⁶'], 'goed');
  allemaal('12a^3b^6', ['12a^2b^5', '12a^3b^5', '7a^3b^6', '12a^3 + b^6', '-12a^3b^6'], 'fout');
  allemaal('3a^2 - 8a - 3', ['3a^2 - 8a - 3', '-8a + 3a^2 - 3', '-3 - 8a + 3a^2'], 'goed');
  allemaal('3a^2 - 8a - 3', ['3a^2 - 8a + 3', '3a^2 + 8a - 3', '3a^2 - 8a'], 'fout');
  allemaal('a^2 + 2ab + b^2', ['b^2 + 2ba + a^2', 'a^2 + b^2 + 2ab'], 'goed');
  allemaal('a^2 + 2ab + b^2', ['a^2 + b^2', 'a^2 + ab + b^2'], 'fout');
  // Een min vooraan, of een min na een rekenteken.
  allemaal('-x^8', ['-x^8', '−x⁸', '-1x^8'], 'goed');
  allemaal('-x^8', ['x^8', '(-x)^8'], 'fout');
  allemaal('4a^6', ['4a^6'], 'goed');
  assert.equal(uitslag('4a^6', '(-2a^3)^2'), 'nog-haakjes');
  assert.equal(uitslag('-32x^5', '(-2x)^5'), 'nog-haakjes');
  assert.equal(uitslag('32x^5', '(-2x)^5'), 'fout');
  assert.equal(uitslag('-6x^2', '3x · -2x'), 'min-niet-vooraan');
});

test('breuken als getal: een onechte breuk, een gemengd getal en een kommagetal zijn allemaal goed (#304)', () => {
  allemaal('7/3x', ['7/3x', '7/3 x', '2 1/3x', '2 1/3 x', '2⅓x', '2 1/3x'], 'goed');
  allemaal('2 1/3x', ['7/3x', '2 1/3x'], 'goed');
  allemaal('1/2x', ['1/2x', '½x', '0,5x', 'x/2', '0.5x'], 'goed');
  allemaal('1/2x', ['1/2', '2x', '1 1/2x'], 'fout');
  // 7/3x is 7/3 · x, en 1/3x is ⅓x. Voor 1/(3x) zijn haakjes nodig.
  assert.equal(uitslag('1/(3x)', '1/3x'), 'fout');
  allemaal('1/(3x)', ['1/(3x)'], 'goed');
  // Een breuk die nog eenvoudiger kan, of een gemengd getal met een te grote breuk, is niet herleid.
  allemaal('2/3x', ['4/6x', '8/12x'], 'breuk-niet-vereenvoudigd');
  allemaal('3x', ['6/2x', '3/1x'], 'breuk-niet-vereenvoudigd');
  allemaal('7/3x', ['1 4/3x', '2 2/6x'], 'breuk-niet-vereenvoudigd');
  allemaal('1/3x', ['0 1/3x'], 'breuk-niet-vereenvoudigd');
});

test('letterbreuken: gelijk door kruiselings te vergelijken, en vereenvoudigd (#304)', () => {
  allemaal('2a/(3c)', ['2a/(3c)', '2a/3c', '(2a)/(3c)', '2a/(3 c)'], 'goed');
  allemaal('-2a/(3c)', ['-2a/(3c)', '-(2a)/(3c)'], 'goed');
  assert.equal(uitslag('-2a/(3c)', '2a/(-3c)'), 'min-in-noemer');
  allemaal('2a/(3c)', ['10ab/(15bc)', '4a/(6c)', '2ac/(3c^2)'], 'breuk-niet-vereenvoudigd');
  allemaal('2a/(3c)', ['2a/(3c^2)', '3a/(2c)', '2c/(3a)'], 'fout');
  allemaal('3y', ['3y'], 'goed');
  assert.equal(uitslag('3y', '12xy/(4x)'), 'breuk-niet-vereenvoudigd');
  assert.equal(uitslag('3y', '3y/1'), 'breuk-niet-vereenvoudigd');
  allemaal('(3y + 4x)/(xy)', ['(3y + 4x)/(xy)', '(4x + 3y)/(yx)', '(4x+3y)/(xy)'], 'goed');
  allemaal('(3y + 4x)/(xy)', ['(3y + 4x)/(x + y)', '(3x + 4y)/(xy)', '7/(xy)'], 'fout');
  allemaal(
    '(3y + 4x)/(xy)',
    ['(6y + 8x)/(2xy)', '(3y^2 + 4xy)/(xy^2)'],
    'breuk-niet-vereenvoudigd',
  );
  allemaal('(x - 5)/10', ['(x - 5)/10', '(-5 + x)/10'], 'goed');
  assert.equal(uitslag('(x - 5)/10', '(2x - 10)/20'), 'breuk-niet-vereenvoudigd');
  // Teller en noemer met een gemeenschappelijke factor met een letter, zoals x + 1.
  assert.equal(uitslag('x + 2', '(x^2 + 3x + 2)/(x + 1)'), 'breuk-niet-vereenvoudigd');
  assert.equal(uitslag('x + 2', '(x + 2)/1'), 'breuk-niet-vereenvoudigd');
  // Een breuk in een breuk, en delen met :.
  allemaal('2a/(3c)', ['(2a/3)/c', '2a/3/c', '(2/3a)/c'], 'breuk-in-breuk');
  assert.equal(uitslag('2a/(3c)', '2a : 3c'), 'deelteken');
  // Een breuk met een som naast andere termen.
  assert.equal(uitslag('(3x + 1)/6', '(x + 1)/6 + x/3'), 'breuk-en-termen');
  // Gelijksoortige breuken.
  assert.equal(uitslag('3/x', '1/x + 2/x'), 'gelijksoortige-termen');
  assert.equal(uitslag('3/(2x)', '1/(2x) + 1/x'), 'gelijksoortige-termen');
});

test('opties voor een breuk: één breuk, of de letter uit de breuk (#304)', () => {
  // Standaard mag ⅒x − ½ net zo goed als (x − 5)/10.
  allemaal('(x - 5)/10', ['1/10x - 1/2', 'x/10 - 1/2'], 'goed');
  allemaal('(x - 5)/10', ['1/10x - 1/2', 'x/10 - 1/2'], 'niet-een-breuk', { breuk: 'een' });
  allemaal('(x - 5)/10', ['(x - 5)/10'], 'goed', { breuk: 'een' });
  allemaal('(3y + 4x)/(xy)', ['3/x + 4/y'], 'goed');
  allemaal('(3y + 4x)/(xy)', ['3/x + 4/y'], 'niet-een-breuk', { breuk: 'een' });
  // Met breuk: 'ervoor' moet de breuk vóór de letter.
  allemaal('1/8x', ['1/8x', '⅛x', '0,125x'], 'goed', { breuk: 'ervoor' });
  allemaal('1/8x', ['x/8'], 'letter-in-breuk', { breuk: 'ervoor' });
  allemaal('1/8x', ['x/8'], 'goed');
  allemaal('2/5p', ['2p/5'], 'letter-in-breuk', { breuk: 'ervoor' });
  // Uit de noemer kan niet: 1/(3x) blijft een breuk.
  allemaal('1/(3x)', ['1/(3x)'], 'goed', { breuk: 'ervoor' });
});

test('herleid: haakjes, gelijksoortige termen, één getal en elke letter één keer per term (#304)', () => {
  allemaal('2x + 6', ['2(x + 3)', '(2x + 6)', '(x + 3) · 2'], 'nog-haakjes');
  allemaal('-a + 3', ['5a - 3(2a - 1)', '-(a - 3)'], 'nog-haakjes');
  allemaal('-a + 3', ['3 - a', '-a + 3'], 'goed');
  allemaal('x + 2', ['x^2 - (x + 1)(x - 2)'], 'nog-haakjes');
  allemaal('8x', ['3x + 5x', '10x - 2x', 'x + 7x'], 'gelijksoortige-termen');
  assert.equal(uitslag('8x', '8x + 0'), 'term-nul');
  assert.equal(uitslag('8x', '8x + 0x'), 'term-nul');
  allemaal('5a^3 + 2a^2', ['5a^3 + 2a^2', '2a^2 + 5a^3'], 'goed');
  assert.equal(uitslag('12a^7', '2a^4 · 6a^3'), 'getallen-niet-samen');
  assert.equal(uitslag('12a^7', '12a^4a^3'), 'letters-niet-samen');
  assert.equal(uitslag('12a^7', '12a^4 · a^3'), 'letters-niet-samen');
  assert.equal(uitslag('6xy', 'x · 6y'), 'getal-niet-vooraan');
  assert.equal(uitslag('8x^12', '2^3x^12'), 'macht-niet-uitgerekend');
  assert.equal(uitslag('5', '5a^0'), 'macht-niet-uitgerekend');
  assert.equal(uitslag('x - 3', 'x + -3'), 'plus-en-min');
  assert.equal(uitslag('a + b', 'a - -b'), 'plus-en-min');
  // 1x en x^1 mogen, en de letters in een term in elke volgorde.
  allemaal('x', ['1x', 'x^1', 'x'], 'goed');
  allemaal('6xy', ['6yx', '6xy', '6 x y'], 'goed');
});

test('wortels: exact, gelijksoortig samen en zo groot mogelijke factor ervoor (#304)', () => {
  allemaal('8√2', ['8√2', '8 √2'], 'goed');
  assert.equal(uitslag('8√2', '3√2 + 5√2'), 'gelijksoortige-termen');
  allemaal('4√5 + 2√3', ['4√5 + 2√3', '2√3 + 4√5'], 'goed');
  allemaal('4√5 + 2√3', ['6√8', '6√15', '4√3 + 2√5'], 'fout');
  assert.equal(uitslag('8√21', '2√3 · 4√7'), 'getallen-niet-samen');
  assert.equal(uitslag('8√21', '8√3√7'), 'wortels-niet-samen');
  assert.equal(uitslag('√6', '√2 · √3'), 'wortels-niet-samen');
  allemaal('6', ['6', '+6'], 'goed');
  assert.equal(uitslag('6', '√3 · √12'), 'wortels-niet-samen');
  assert.equal(uitslag('6', '√36'), 'wortel-niet-uitgerekend');
  assert.equal(uitslag('56', '4√7 · 2√7'), 'getallen-niet-samen');
  assert.equal(uitslag('4', '5√4 - 2√9'), 'wortel-niet-uitgerekend');
  allemaal('3√5', ['√45', '1√45'], 'wortel-factor-te-klein');
  allemaal('10√2', ['2√50', '√200', '5√8'], 'wortel-factor-te-klein');
  allemaal('10√2', ['10√2'], 'goed');
  allemaal('10√2', ['2√5', '10√3'], 'fout');
  assert.equal(uitslag('2√3', '√(4 · 3)'), 'onder-wortel-niet-uitgerekend');
  assert.equal(uitslag('4/7', '√(16/49)'), 'wortel-niet-uitgerekend');
  assert.equal(uitslag('7/3', '√(5 4/9)'), 'wortel-niet-uitgerekend');
  assert.equal(uitslag('1/4√7', '√(7/16)'), 'breuk-onder-wortel');
  assert.equal(uitslag('1/4√7', '√7/√16'), 'wortel-niet-uitgerekend');
  assert.equal(uitslag('√5', '√35/√7'), 'wortels-niet-samen');
  allemaal('1/4√7', ['1/4√7', '¼√7', '√7/4', '0,25√7'], 'goed');
  allemaal('3√5', ['12√35/(4√7)'], 'breuk-niet-vereenvoudigd');
  allemaal('3√5', ['3√35/√7'], 'wortels-niet-samen');
  allemaal('1 1/2√2', ['1 1/2√2', '3/2√2', '3√2/2'], 'goed');
  // Een wortel in de noemer mag, tenzij de vraag zegt dat hij eruit moet.
  allemaal('5/6√2', ['5/(3√2)', '5√2/6', '5/6√2'], 'goed');
  allemaal('5/6√2', ['5/(3√2)'], 'wortel-in-noemer', { wortelUitNoemer: true });
  allemaal('5/6√2', ['5√2/6', '⅚√2'], 'goed', { wortelUitNoemer: true });
});

test('het goede antwoord moet te lezen en herleid zijn (#304)', () => {
  assert.throws(() => UF('', '2(x + 3)'), /niet herleid: nog-haakjes/);
  assert.throws(() => UF('', '2x +'), /niet te lezen/);
  assert.throws(() => UF('', 'x/8', { breuk: 'ervoor' }), /letter-in-breuk/);
  const f = UF('Herleid:', '(3y + 4x)/(xy)');
  assert.equal(f.uitdrukking.letters, 'xy');
  assert.equal(UF('', '6√3').uitdrukking.letters, '');
  assert.equal(UF('', '6√3', { letters: 'ab' }).uitdrukking.letters, 'ab');
  assert.match(
    f.toon,
    /<span class="f"><span>3<span class="v">y<\/span> \+ 4<span class="v">x<\/span><\/span>/,
  );
  // Een veld is gegevens, zodat een lopende proeftoets als JSON bewaard kan worden.
  const bewaard = JSON.parse(JSON.stringify(f));
  assert.ok(checkField(bewaard, '(4x + 3y)/(yx)'));
});

// Een kleine vraag zoals een generator hem maakt, alleen voor deze test.
const vraag = () =>
  metUitdrukking({
    q: 'Herleid 2a^4 · 6a^3 en 3a^2 + 4a^2.',
    fields: [UF('2a^4 · 6a^3 =', '12a^7'), UF('3a^2 + 4a^2 =', '7a^2')],
    traps: [
      { id: 'exponenten-keer', als: '12a^12', m: 'Bij keer tel je de exponenten op.' },
      { id: 'getallen-opgeteld', als: ['8a^7'], m: 'De getallen doe je keer.' },
      { id: 'exponenten-opgeteld', als: '7a^4', veld: 1, m: 'Bij optellen blijft de exponent.' },
    ],
    hint: 'Doe de getallen keer en tel de exponenten op.',
    steps: [],
  });

test('nakijken en valkuilen in een vraag met twee uitdrukkingen (#304)', () => {
  const q = vraag();
  assert.ok(checkAnswer(q, ['12a^7', '7a^2']).ok);
  assert.ok(checkAnswer(q, ['12a⁷', '7a²']).ok);
  assert.equal(findTrap(q, ['12a^7', '7a^2']), null);
  assert.deepEqual(checkAnswer(q, ['12a^12', '7a^2']).each, [false, true]);
  assert.equal(findTrap(q, ['12a^12', '7a^2'])?.id, 'exponenten-keer');
  assert.equal(findTrap(q, ['12a^(12)', '7a^2'])?.id, 'exponenten-keer');
  assert.equal(findTrap(q, ['8a^7', '7a^2'])?.id, 'getallen-opgeteld');
  assert.equal(findTrap(q, ['12a^7', '7a^4'])?.id, 'exponenten-opgeteld');
  // In het tweede veld valt de valkuil van het eerste veld niet.
  assert.equal(findTrap(q, ['12a^7', '12a^12']), null);
  // Gelijk maar niet herleid: fout, met een melding over wat er nog moet.
  const niet = ['2a^4 · 6a^3', '7a^2'];
  assert.ok(!checkAnswer(q, niet).ok);
  const t = findTrap(q, niet);
  assert.equal(t.id, 'getallen-niet-samen');
  assert.match(
    t.m,
    /^Je antwoord klopt, maar het is nog niet helemaal herleid\. Neem in elke term/,
  );
  assert.equal(findTrap(q, ['12a^7', '3a^2 + 4a^2'])?.id, 'gelijksoortige-termen');
  // De melding over herleiden valt alleen als elk veld klopt.
  assert.equal(findTrap(q, ['2a^4 · 6a^3', '8a^2']), null);
  // Onleesbaar is fout, zonder fout in het nakijken.
  assert.ok(!checkAnswer(q, ['12a^7 +', '7a^2']).ok);
  assert.equal(findTrap(q, ['12a^7 +', '7a^2']), null);
  for (const v of q.traps) assert.match(v.id, VALKUIL_ID);
  assert.equal(new Set(q.traps.map((v) => v.id)).size, q.traps.length);
  assert.ok(Object.keys(NIET_HERLEID).every((id) => q.traps.some((v) => v.id === id)));
  // Een valkuil die niet te lezen is, valt al op als de vraag gemaakt wordt.
  assert.throws(
    () => metUitdrukking({ fields: [UF('', 'x')], traps: [{ id: 'kapot', als: '2x +' }] }),
    /niet te lezen/,
  );
});

test('een uitdrukking als HTML en in woorden (#304)', () => {
  assert.equal(
    U('12a^3b^6'),
    '12<span class="v">a</span><sup>3</sup><span class="v">b</span><sup>6</sup>',
  );
  assert.equal(
    U('2a/(3c)'),
    '<span class="f"><span>2<span class="v">a</span></span><span>3<span class="v">c</span></span></span>',
  );
  // Een min staat vóór de breukstreep.
  assert.match(
    U('-2a/(3c)'),
    /^<span class="negatief"><span class="nmin">−<\/span><span class="f">/,
  );
  assert.equal(U('6√3'), '6√<span class="wortel">3</span>');
  assert.equal(
    U('√(16/49)'),
    '√<span class="wortel"><span class="f"><span>16</span><span>49</span></span></span>',
  );
  assert.equal(
    U('2 1/3x'),
    '2<span class="f"><span>1</span><span>3</span></span><span class="v">x</span>',
  );
  assert.equal(U('3a^2 - 8a'), '3<span class="v">a</span><sup>2</sup> − 8<span class="v">a</span>');
  assert.equal(U('3x · -2x = -6x^2').split(' = ').length, 2);
  assert.match(U('3x · -2x'), / · <span class="negatief">/);
  // Wat geen uitdrukking is, blijft gewone tekst. Let op: een woord is een product van letters, dus zet tekst
  // er met T omheen.
  assert.equal(U('2x + = 2x'), '2x + = 2<span class="v">x</span>');
  assert.equal(UITDRUKKING.zeg('12a^3b^2'), '12 a tot de macht 3 b kwadraat');
  assert.equal(UITDRUKKING.zeg('2a/(3c)'), 'breuk met teller 2 a en noemer 3 c, einde breuk');
  assert.equal(
    UITDRUKKING.zeg('-√12 + 1/2x'),
    'min wortel 12 plus breuk 1 gedeeld door 2, einde breuk, x',
  );
  // Je hoort waar een breuk ophoudt, en een getalbreuk klinkt anders dan een breuk met letters.
  assert.equal(UITDRUKKING.zeg('1/3x'), 'breuk 1 gedeeld door 3, einde breuk, x');
  assert.equal(UITDRUKKING.zeg('1/(3x)'), 'breuk met teller 1 en noemer 3 x, einde breuk');
  assert.equal(
    UITDRUKKING.zeg('3/x + 4/y'),
    'breuk met teller 3 en noemer x, einde breuk, plus breuk met teller 4 en noemer y, einde breuk',
  );
  assert.equal(
    UITDRUKKING.zeg('3/(x + 4/y)'),
    'breuk met teller 3 en noemer x plus breuk met teller 4 en noemer y, einde breuk, einde breuk',
  );
  assert.equal(UITDRUKKING.zeg('2 1/3x'), '2 en breuk 1 gedeeld door 3, einde breuk, x');
  assert.equal(UITDRUKKING.html('2x +'), '');
  assert.equal(UITDRUKKING.lees('2x +'), false);
});

test('wortel en sqrt worden √, en hoofdletters kleine letters (#304)', () => {
  allemaal(
    '6√3',
    ['6√3', '6wortel 3', '6 wortel(3)', '6sqrt3', '6 sqrt(3)', '6 Wortel 3', '6SQRT3'],
    'goed',
  );
  allemaal('√5', ['wortel 5', 'wortel(5)', 'sqrt5', 'sqrt(5)'], 'goed');
  allemaal('12a^3b^6', ['12A^3B^6', '12a^3B^6'], 'goed');
  allemaal('x^2', ['X^2', 'X²'], 'goed');
});

test('heel diepe haakjes zijn niet te lezen, zonder dat het nakijken breekt (#304)', () => {
  const diep = `${'('.repeat(5000)}1${')'.repeat(5000)}`;
  assert.equal(lees(diep), null);
  assert.equal(UITDRUKKING.lees(diep), false);
  assert.equal(oordeel(veld('1'), diep).goed, false);
});

test('1/3x is ⅓x, en de valkuil breuk-voor-letter zegt hoe je 1/(3x) typt (#304)', () => {
  const q = (a, opties) => metUitdrukking({ q: '', fields: [UF('', a, opties)], traps: [] });
  assert.equal(findTrap(q('1/(3x)'), ['1/3x'])?.id, 'breuk-voor-letter');
  assert.equal(findTrap(q('2/(3c)'), ['2/3c'])?.id, 'breuk-voor-letter');
  assert.equal(findTrap(q('2/(3c^2)'), ['2/3c^2'])?.id, 'breuk-voor-letter');
  assert.equal(findTrap(q('x + 1/(3x)'), ['x + 1/3x'])?.id, 'breuk-voor-letter');
  assert.equal(findTrap(q('-1/(3x)'), ['-1/3x'])?.id, 'breuk-voor-letter');
  assert.match(
    findTrap(q('1/(3x)'), ['1/3x']).m,
    /Bedoel je 1\/\(3x\)\? Zet dan haakjes om de noemer/,
  );
  // Niet als het antwoord goed is, of als het ook als 1/(3x) fout is.
  assert.equal(findTrap(q('1/3x'), ['1/3x']), null);
  assert.equal(findTrap(q('1/(3x)'), ['1/(3x)']), null);
  assert.equal(findTrap(q('1/(3x)'), ['1/4x']), null);
  // Andersom is het gewoon fout: 2/(3c) is niet ⅔c.
  assert.equal(findTrap(q('2/3c'), ['2/(3c)']), null);
  assert.ok(!checkAnswer(q('2/3c'), ['2/(3c)']).ok);
  // Niet bij een gemengd getal, een macht of een wortel.
  assert.equal(findTrap(q('1/(7x)'), ['2 1/3x']), null);
  assert.equal(findTrap(q('1/(3x)'), ['√4/3x']), null);
});

test('letter-in-breuk en wortel-in-breuk hebben elk een eigen melding (#304)', () => {
  allemaal('1/6√2', ['√2/6'], 'wortel-in-breuk', { breuk: 'ervoor' });
  allemaal('1/6√2', ['1/6√2', '⅙√2'], 'goed', { breuk: 'ervoor' });
  allemaal('1/8x√2', ['x√2/8'], 'letter-in-breuk', { breuk: 'ervoor' });
  assert.match(NIET_HERLEID['wortel-in-breuk'], /vóór de wortel, zoals √2\/6 = ⅙√2/);
});

test('invullen geeft een getal voor elke letter, voor de v van een generator (#304)', () => {
  assert.equal(invullen('2a^3', { a: 2 }), 16);
  assert.equal(invullen('3a^4 · 4a^3', { a: 2 }), invullen('12a^7', { a: 2 }));
  assert.notEqual(invullen('3a^4 · 4a^3', { a: 2 }), invullen('12a^12', { a: 2 }));
  assert.equal(invullen('2a/(3c)', { a: 3, c: 2 }), 1);
  assert.equal(invullen('(3y + 4x)/(xy)', { x: 2, y: 3 }), 17 / 6);
  assert.ok(Math.abs(invullen('2√3 · 4√7', {}) - 8 * Math.sqrt(21)) < 1e-9);
  assert.ok(Math.abs(invullen('x√2', { x: 3 }) - 3 * Math.sqrt(2)) < 1e-9);
  assert.throws(() => invullen('2a', { b: 2 }), /letter a/);
});

test('de Rekenhulp heeft bij een uitdrukking altijd de toets Leeg (#304)', async () => {
  const { uitdrukkingToetsen } = await import('../src/js/ui/rekenhulp.js');
  for (const letters of ['', 'a', 'ab', 'abc', 'abcdefghi', 'xy'])
    assert.match(
      uitdrukkingToetsen(letters),
      /grid-column: span [1-6]"[^>]*data-k="V:LEEG"/,
      letters,
    );
});
