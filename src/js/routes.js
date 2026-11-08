// De adressen van de site: bij elk scherm hoort één adres en andersom. Bevat geen DOM-code.
import { FILTERS, MAPPING, MAPPINGS } from './mappings/index.js';
import { DOMAIN, TOPIC } from './topics/index.js';

const SCREENS = {
  home: { path: '/', title: 'Wiskundefit: oefenen voor je wiskundetoets' },
  kies: { path: '/methode-indeling', title: 'Kies uit je boek' },
  stof: { path: '/mijn-stof', title: 'Mijn stof' },
  stofoefen: { path: '/mijn-stof/oefenen', title: 'Mijn stof oefenen', slug: 'mijn-stof' },
  toets: { path: '/proeftoets', title: 'Proeftoets' },
  toetsres: { path: '/proeftoets/uitslag', title: 'Resultaat proeftoets' },
  over: { path: '/over', title: 'Over Wiskundefit' },
  privacy: { path: '/privacy', title: 'Privacy' },
  contact: { path: '/contact', title: 'Contact' },
};

function pathFor(v) {
  if (v.name === 'missing') return v.path;
  if (v.name === 'mapping') return `/methode-indeling/${MAPPING[v.id].slug}`;
  if (v.name === 'domain') return `/${v.slug}`;
  if (v.name === 'kies' && v.filters) {
    const query = Object.entries(v.filters).map(([key, values]) => `${key}=${values.join(',')}`);
    return `${SCREENS.kies.path}?${query.join('&')}`;
  }
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
// De filters op Kies uit je boek, zoals ?niveau=havo,vwo&leerjaar=3. Wat niet bestaat, negeren
// we, en de volgorde in het adres ligt vast.
function kiesView(search) {
  const params = new URLSearchParams(search);
  const filters = {};
  for (const { key, options } of FILTERS) {
    const asked = (params.get(key) || '').split(',');
    const values = options.filter((o) => asked.includes(o));
    if (values.length) filters[key] = values;
  }
  return Object.keys(filters).length ? { name: 'kies', filters } : { name: 'kies' };
}
function viewFor(pathname, search = '') {
  const path = pathname.replace(/\/+$/, '') || '/';
  // Azure toont Home ook op /index, en stuurt /index.html daarheen.
  if (path === '/index' || path === '/index.html') return { name: 'home' };
  for (const [name, { path: screen, slug }] of Object.entries(SCREENS)) {
    if (path === screen && name === 'kies') return kiesView(search);
    if (path === screen) return slug ? { name, slug } : { name };
  }
  const [, first, second, ...rest] = path.split('/');
  if (!rest.length) {
    const mapping = first === 'methode-indeling' && MAPPINGS.find((m) => m.slug === second);
    if (mapping) return { name: 'mapping', id: mapping.id };
    // Object.hasOwn, want /constructor is ook een eigenschap van een gewoon object.
    if (Object.hasOwn(DOMAIN, first) && !second) return { name: 'domain', slug: first };
    if (Object.hasOwn(TOPIC, first)) {
      if (!second) return { name: 'topic', slug: first };
      if (second === 'oefenen') return practiceView(first, search);
    }
  }
  return { name: 'missing', path: pathname + search };
}

// Staat Wiskundefit al in de titel, zoals bij Home en Over, dan niet nog een keer erachter.
function titleFor(v) {
  const title = `${SCREENS[v.name]?.title ?? nameOf(v)}${v.oefen ? ' oefenen' : ''}`;
  return title.includes('Wiskundefit') ? title : `${title} | Wiskundefit`;
}
// De naam van een scherm, zoals in het kruimelpad.
function nameOf(v) {
  if (v.name === 'missing') return 'Pagina niet gevonden';
  if (v.name === 'mapping') {
    const m = MAPPING[v.id];
    return `${m.method}, ${m.edition}e editie, ${m.level} ${m.year}`;
  }
  if (v.name === 'domain') return DOMAIN[v.slug].name;
  if (v.name === 'topic') return TOPIC[v.slug].title;
  if (v.name === 'toetsres') return 'Je resultaat';
  if (v.name === 'stofoefen') return 'Oefenen';
  return SCREENS[v.name].title;
}

// Het onderdeel van het hoofdmenu waar een scherm bij hoort. Mijn stof is alles wat de site van
// de leerling onthoudt: de stofkeuze en het boek.
const SECTIONS = {
  home: 'home',
  domain: 'home',
  topic: 'home',
  stof: 'stof',
  stofoefen: 'stof',
  kies: 'stof',
  mapping: 'stof',
  toets: 'toets',
  toetsres: 'toets',
};
const sectionFor = (v) => SECTIONS[v.name] || null;

// Het kruimelpad boven de kop: Home, de schermen erboven en als laatste het scherm zelf, zonder
// link. Elk scherm behalve Home heeft er een.
function crumbsFor(v) {
  if (v.name === 'home') return [];
  const link = (view) => ({ text: nameOf(view), path: pathFor(view) });
  const up = [{ text: 'Home', path: to('home') }];
  if (v.name === 'topic') {
    const t = TOPIC[v.slug];
    up.push(link({ name: 'domain', slug: t.domain.slug }));
    if (v.oefen) return [...up, link({ name: 'topic', slug: t.slug }), { text: 'Oefenen' }];
  }
  if (v.name === 'kies' || v.name === 'stofoefen') up.push(link({ name: 'stof' }));
  if (v.name === 'mapping') up.push(link({ name: 'stof' }), link({ name: 'kies' }));
  if (v.name === 'toetsres') up.push(link({ name: 'toets' }));
  return [...up, { text: nameOf(v) }];
}

export { pathFor, to, viewFor, titleFor, sectionFor, crumbsFor };
