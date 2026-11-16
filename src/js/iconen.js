// De plaatjes die verschijnen als je 5 vragen achter elkaar goed hebt (zie #185), en hoe vaak elk
// komt. Geen DOM: de tests draaien dit in Node. Alle plaatjes zijn eigen tekeningen op een vlak van
// 24 bij 24, plat, met een donkere rand zodat ze in licht en donker goed te zien zijn. De kleuren
// staan er vast in, zoals bij een logo, en horen dus niet bij de tokens in styles.css.
//
// Een id mag nooit veranderen of opnieuw gebruikt worden, want de browser bewaart hoe vaak een leerling
// elk plaatje zag. `w` is het gewicht, `g` de groep: een groep heeft samen één gewicht (GROEPEN) en
// daarbinnen heeft elk plaatje evenveel kans. De kans van een plaatje is zijn gewicht gedeeld door
// het totaal van wat er is, dus een nieuw plaatje rekent zich vanzelf bij.
const LIJST = [
  {
    id: 'ster',
    naam: 'ster',
    w: 37,
    svg:
      '<path d="M12 2.4l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 17.4l-5.9 3.1 1.2-6.6L2.5 9.3l6.6-.9z" fill="#ffc21a" stroke="#a86d00" stroke-width="1.5"/>' +
      '<path d="M12 5.6l1.5 3.3" stroke="#fff3b0" stroke-width="1.3" fill="none"/>',
  },
  {
    id: 'hart',
    naam: 'hart',
    w: 7,
    svg:
      '<path d="M12 21s-7.6-4.7-9.6-9.4C.9 8 3.2 4.4 6.7 4.4c2.1 0 3.6 1.1 5.3 3 1.7-1.9 3.2-3 5.3-3 3.5 0 5.8 3.6 4.3 7.2C19.6 16.3 12 21 12 21z" fill="#ec3b52" stroke="#9a1d2f" stroke-width="1.5"/>' +
      '<ellipse cx="7.3" cy="8.4" rx="1.7" ry="1.1" transform="rotate(-35 7.3 8.4)" fill="#fff" opacity=".6"/>',
  },
  {
    id: 'paddestoel',
    naam: 'paddestoel',
    w: 6,
    svg:
      '<path d="M9.2 12.5h5.6v5.6c0 1.6-1.2 2.7-2.8 2.7s-2.8-1.1-2.8-2.7z" fill="#f7e8cf" stroke="#a88c63" stroke-width="1.4"/>' +
      '<path d="M2.6 12.8C2.6 7 6.8 3.2 12 3.2s9.4 3.8 9.4 9.6z" fill="#e63946" stroke="#97202b" stroke-width="1.5"/>' +
      '<circle cx="8" cy="9.4" r="1.8" fill="#fff"/><circle cx="13.6" cy="7.4" r="1.5" fill="#fff"/><circle cx="17.2" cy="10.6" r="1.3" fill="#fff"/><circle cx="11.2" cy="11.2" r="1" fill="#fff"/>',
  },
  {
    id: 'poep',
    naam: 'poep',
    w: 5,
    svg:
      '<path d="M12 2.6c2.4 1.2 2.2 3 1 4 2 .2 3.4 1.4 3.4 3 2 .4 3.6 1.9 3.6 3.9 1.7.5 2.8 1.9 2.8 3.4 0 2.4-2.5 3.6-5.2 3.6H6.4C3.7 20.5 2 19.3 2 17c0-1.6 1.2-3 2.9-3.4.1-2 1.6-3.5 3.6-3.9 0-1.7 1.5-2.9 3.3-3.1-1-1.1-.9-2.8.2-4z" fill="#8b5a2b" stroke="#51310f" stroke-width="1.4"/>' +
      '<circle cx="9.2" cy="14.2" r="1.9" fill="#fff"/><circle cx="14.8" cy="14.2" r="1.9" fill="#fff"/><circle cx="9.5" cy="14.5" r=".95" fill="#222"/><circle cx="14.5" cy="14.5" r=".95" fill="#222"/>' +
      '<path d="M9 17.4q3 2.4 6 0" fill="none" stroke="#fff" stroke-width="1.3"/>',
  },
  {
    id: 'hersenexplosie',
    naam: 'hersenexplosie',
    w: 3,
    svg:
      '<g stroke="#f59e0b" stroke-width="1.7" fill="none"><path d="M12 4V1.2"/><path d="M7.2 5.2 5.2 2.6"/><path d="M16.8 5.2 18.8 2.6"/><path d="M4.4 9.4 1.6 8.4"/><path d="M19.6 9.4l2.8-1"/></g>' +
      '<circle cx="12" cy="14.6" r="7.2" fill="#ffcf40" stroke="#a87a00" stroke-width="1.5"/>' +
      '<g fill="#ff8fab" stroke="#c4254f" stroke-width="1.2"><circle cx="8.2" cy="8.8" r="2.6"/><circle cx="12" cy="7.3" r="3"/><circle cx="15.8" cy="8.8" r="2.6"/></g>' +
      '<circle cx="8.9" cy="13.6" r="2.1" fill="#fff" stroke="#a87a00" stroke-width=".8"/><circle cx="15.1" cy="13.6" r="2.1" fill="#fff" stroke="#a87a00" stroke-width=".8"/><circle cx="8.9" cy="13.8" r=".9" fill="#222"/><circle cx="15.1" cy="13.8" r=".9" fill="#222"/>' +
      '<ellipse cx="12" cy="18.6" rx="2" ry="1.7" fill="#5b2a00"/>',
  },
  {
    id: 'raket',
    naam: 'raket',
    w: 3,
    svg:
      '<path d="M7 13.4l-3.4 4.2V20L7 18.4zM17 13.4l3.4 4.2V20L17 18.4z" fill="#e63946" stroke="#97202b" stroke-width="1.3"/>' +
      '<path d="M9.4 17.6h5.2L12 23.2z" fill="#ff9f1c" stroke="#b86a00" stroke-width="1.2"/>' +
      '<path d="M12 1.4c3.4 2.6 5 6.2 5 10.6v5.6H7V12c0-4.4 1.6-8 5-10.6z" fill="#f1f3f5" stroke="#5b6472" stroke-width="1.4"/>' +
      '<circle cx="12" cy="9.6" r="2.2" fill="#4cc9f0" stroke="#1d7fa3" stroke-width="1.2"/>',
  },
  {
    id: 'ballon',
    naam: 'ballon',
    w: 3,
    svg:
      '<ellipse cx="12" cy="9.4" rx="6.6" ry="7.8" fill="#4cc9f0" stroke="#1d7fa3" stroke-width="1.4"/>' +
      '<path d="M12 17.3l-1.7 2.3h3.4z" fill="#4cc9f0" stroke="#1d7fa3" stroke-width="1.2"/>' +
      '<path d="M12 19.6c-1.6 1.2 1.6 2 0 3.6" fill="none" stroke="#6b7280" stroke-width="1.1"/>' +
      '<ellipse cx="9" cy="6.2" rx="1.4" ry="2.3" transform="rotate(25 9 6.2)" fill="#fff" opacity=".55"/>',
  },
  {
    id: 'klavertje',
    naam: 'klavertje vier',
    w: 3,
    svg:
      '<path d="M12 13c0 4 1 6.4 3.4 8.6" fill="none" stroke="#1d6b2d" stroke-width="1.6"/>' +
      '<g fill="#34b350" stroke="#1d6b2d" stroke-width="1.3"><circle cx="8.6" cy="8.4" r="4.1"/><circle cx="15.4" cy="8.4" r="4.1"/><circle cx="8.6" cy="15.2" r="4.1"/><circle cx="15.4" cy="15.2" r="4.1"/></g>' +
      '<circle cx="12" cy="11.8" r="1.5" fill="#34b350"/>',
  },
  {
    id: 'kroon',
    naam: 'kroon',
    w: 2,
    svg:
      '<path d="M3 19V7.4l4.9 4.3L12 4.6l4.1 7.1L21 7.4V19z" fill="#ffc21a" stroke="#a86d00" stroke-width="1.5"/>' +
      '<g fill="#e63946" stroke="#97202b" stroke-width="1"><circle cx="3" cy="7" r="1.5"/><circle cx="12" cy="4.2" r="1.5"/><circle cx="21" cy="7" r="1.5"/></g>' +
      '<circle cx="12" cy="14" r="1.8" fill="#4cc9f0" stroke="#1d7fa3" stroke-width="1"/>',
  },
  {
    id: 'diamant',
    naam: 'diamant',
    w: 2,
    svg:
      '<path d="M6 3.2h12L22 9 12 21 2 9z" fill="#5ad1ff" stroke="#1b78a8" stroke-width="1.4"/>' +
      '<path d="M2 9h20M8.4 3.2 6.6 9 12 21M15.6 3.2l1.8 5.8L12 21" fill="none" stroke="#e8fbff" stroke-width="1" opacity=".85"/>',
  },
  {
    id: 'bliksem',
    naam: 'bliksem',
    w: 2,
    svg: '<path d="M14 1.6 5 13.6h5.8L9.4 22.4 19.4 9.8h-6.3z" fill="#ffd23f" stroke="#a87a00" stroke-width="1.5"/>',
  },

  {
    id: 'kat',
    naam: 'kat',
    g: 'dier',
    svg:
      '<path d="M4.6 10.4 4.9 2.6l5.6 3.8zM19.4 10.4l-.3-7.8-5.6 3.8z" fill="#f4a259" stroke="#a45a1c" stroke-width="1.4"/>' +
      '<circle cx="12" cy="13.4" r="8" fill="#f4a259" stroke="#a45a1c" stroke-width="1.5"/>' +
      '<circle cx="8.8" cy="12.4" r="1.2" fill="#222"/><circle cx="15.2" cy="12.4" r="1.2" fill="#222"/>' +
      '<path d="M10.8 15.2h2.4L12 16.5z" fill="#ff8fab" stroke="#c4254f" stroke-width=".8"/>' +
      '<path d="M12 16.5q-1.6 2-3.2.8M12 16.5q1.6 2 3.2.8M4.5 15.4l3.4.6M19.5 15.4l-3.4.6" fill="none" stroke="#a45a1c" stroke-width="1"/>',
  },
  {
    id: 'pinguin',
    naam: 'pinguïn',
    g: 'dier',
    svg:
      '<ellipse cx="9" cy="22" rx="2.8" ry="1.1" fill="#ff9f1c" stroke="#b86a00" stroke-width="1"/><ellipse cx="15" cy="22" rx="2.8" ry="1.1" fill="#ff9f1c" stroke="#b86a00" stroke-width="1"/>' +
      '<ellipse cx="12" cy="12.6" rx="7.4" ry="9.4" fill="#2c3d5c" stroke="#101a2e" stroke-width="1.4"/>' +
      '<ellipse cx="12" cy="14.6" rx="4.8" ry="6.8" fill="#fff"/>' +
      '<circle cx="9.8" cy="8.4" r="1.5" fill="#fff"/><circle cx="14.2" cy="8.4" r="1.5" fill="#fff"/><circle cx="10" cy="8.6" r=".7" fill="#111"/><circle cx="14" cy="8.6" r=".7" fill="#111"/>' +
      '<path d="M10.3 10.6h3.4L12 12.8z" fill="#ff9f1c" stroke="#b86a00" stroke-width="1"/>',
  },
  {
    id: 'eend',
    naam: 'eend',
    g: 'dier',
    svg:
      '<ellipse cx="10.6" cy="16.6" rx="8" ry="5" fill="#ffd23f" stroke="#a87a00" stroke-width="1.4"/>' +
      '<path d="M6.4 16.4c1.8 3 5.6 3 7.6 0" fill="none" stroke="#a87a00" stroke-width="1.2"/>' +
      '<circle cx="14" cy="8.2" r="5" fill="#ffd23f" stroke="#a87a00" stroke-width="1.4"/>' +
      '<path d="M18.3 8.4h4.2c-.4 1.9-2 2.6-4.2 2.2z" fill="#ff9f1c" stroke="#b86a00" stroke-width="1.1"/>' +
      '<circle cx="14.8" cy="7.2" r=".95" fill="#222"/>',
  },
];

const GROEPEN = { dier: 12 };
const ICONEN = LIJST.map((i) => ({ id: i.id, naam: i.naam, w: i.w, g: i.g, svg: i.svg }));
const lid = (g) => ICONEN.filter((i) => i.g === g);
const totaal = () =>
  ICONEN.reduce((t, i) => t + (i.g ? 0 : i.w), 0) +
  Object.keys(GROEPEN).reduce((t, g) => t + (lid(g).length ? GROEPEN[g] : 0), 0);
// De kans in procenten dat dit plaatje komt.
const kansVan = (i) =>
  i.g ? ((GROEPEN[i.g] / totaal()) * 100) / lid(i.g).length : (i.w / totaal()) * 100;
// r1 en r2 zijn getallen van 0 tot 1: r1 kiest het plaatje of de groep, r2 het plaatje in de groep.
function kiesIcoon(r1, r2) {
  let rest = r1 * totaal();
  const gedaan = new Set();
  for (const i of ICONEN) {
    if (i.g) {
      if (gedaan.has(i.g)) continue;
      gedaan.add(i.g);
      rest -= GROEPEN[i.g];
      if (rest < 0)
        return lid(i.g)[Math.min(Math.floor(r2 * lid(i.g).length), lid(i.g).length - 1)];
    } else {
      rest -= i.w;
      if (rest < 0) return i;
    }
  }
  return ICONEN[0];
}
export { ICONEN, GROEPEN, kansVan, kiesIcoon, totaal };
