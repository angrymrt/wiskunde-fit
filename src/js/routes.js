// De adressen van de site: bij elk scherm hoort één adres en andersom. Bevat geen DOM-code.
import { MAPPING, MAPPINGS } from './mappings/index.js';
import { TOPIC } from './topics/index.js';

const SCREENS = {
  home: { path: '/', title: 'Wiskundefit: oefenen voor je wiskundetoets' },
  kies: { path: '/methode-indeling', title: 'Kies uit je boek' },
  stof: { path: '/jouw-stof', title: 'Jouw stof' },
  stofoefen: { path: '/jouw-stof/oefenen', title: 'Jouw stof oefenen', slug: 'jouw-stof' },
  toets: { path: '/proeftoets', title: 'Proeftoets' },
  toetsres: { path: '/proeftoets/uitslag', title: 'Resultaat proeftoets' },
  over: { path: '/over', title: 'Over Wiskundefit' },
};

function pathFor(v) {
  if (v.name === 'missing') return v.path;
  if (v.name === 'mapping') return `/methode-indeling/${MAPPING[v.id].slug}`;
  if (v.name !== 'topic') return SCREENS[v.name].path;
  if (!v.oefen) return `/${v.slug}`;
  return `/${v.slug}/oefenen${v.soort ? `?soort=${v.soort}` : ''}`;
}
const to = (name) => SCREENS[name].path;

function practiceView(slug, search) {
  const soort = Number(new URLSearchParams(search).get('soort'));
  // Een onbekende of andere vraagsoort negeren we, zodat een oude link toch iets laat zien.
  return TOPIC[slug].skills.some((k) => k.id === soort)
    ? { name: 'topic', slug, oefen: true, soort }
    : { name: 'topic', slug, oefen: true };
}
function viewFor(pathname, search = '') {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/index.html') return { name: 'home' };
  for (const [name, { path: screen, slug }] of Object.entries(SCREENS)) {
    if (path === screen) return slug ? { name, slug } : { name };
  }
  const [, first, second, ...rest] = path.split('/');
  if (!rest.length) {
    const mapping = first === 'methode-indeling' && MAPPINGS.find((m) => m.slug === second);
    if (mapping) return { name: 'mapping', id: mapping.id };
    // Object.hasOwn, want /constructor is ook een eigenschap van een gewoon object.
    if (Object.hasOwn(TOPIC, first)) {
      if (!second) return { name: 'topic', slug: first };
      if (second === 'oefenen') return practiceView(first, search);
    }
  }
  return { name: 'missing', path: pathname + search };
}

function titleFor(v) {
  if (v.name === 'home') return SCREENS.home.title;
  const name = () => {
    if (v.name === 'missing') return 'Pagina niet gevonden';
    if (v.name === 'mapping') {
      const m = MAPPING[v.id];
      return `${m.method}, ${m.edition}e editie, ${m.level} ${m.year}`;
    }
    if (v.name !== 'topic') return SCREENS[v.name].title;
    return v.oefen ? `${TOPIC[v.slug].title} oefenen` : TOPIC[v.slug].title;
  };
  return `${name()} | Wiskundefit`;
}

export { pathFor, to, viewFor, titleFor };
