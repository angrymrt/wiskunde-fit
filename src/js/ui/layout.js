// Onderdelen die op elk scherm terugkomen.

const topbar = () =>
  `<header class="top"><button class="brand" data-act="home" type="button">Wiskunde<span class="brand-fit">fit</span></button><nav class="topnav" aria-label="Hoofdmenu"><button class="btn quiet" data-act="home" type="button">Overzicht</button><button class="btn quiet" data-act="stof" type="button">Jouw stof</button><button class="btn quiet" data-act="toets" type="button">Proeftoets</button></nav></header>`;
const footer = () =>
  `<footer class="foot"><button class="linkbtn" data-act="over" type="button">Over Wiskundefit, privacy en contact</button></footer>`;

export { topbar, footer };
