// Alle paragrafen op volgorde. Een nieuwe paragraaf voeg je hier toe.
import p0 from './1.1.js';
import p1 from './1.2.js';
import p2 from './1.3.js';
import p3 from './1.4.js';
import p4 from './1.5.js';
import p5 from './1.6.js';
import p6 from './voorkennis.js';
import p7 from './2.1.js';
import p8 from './2.2.js';
import p9 from './2.3.js';
import p10 from './2.4.js';

const SECTIONS = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10];
const SEC = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
SECTIONS.forEach((s) => {
  s.skills = s.skills.map(([name, gen], i) => ({ id: s.id + '#' + i, name, gen }));
});

export { SECTIONS, SEC };
