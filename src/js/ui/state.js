// Gedeelde toestand van de schermen.

// Bij het bouwen draaien de schermen in Node, zonder document. Dan is er geen app.
const app = globalThis.document?.getElementById('app') ?? null;
const state = {
  view: { name: 'home' },
  prac: {},
  // Op een telefoon staan de filters op Kies uit je boek open.
  filtersOpen: false,
  // De vraag die je net deelde: { path, url, copied }. Daar staat dan de melding bij.
  shared: null,
  // Of de site nu donker is, door het apparaat of door de knop in de kop. Zie main.js.
  dark: false,
  test: null,
  result: null,
  len: 20,
  timer: null,
  confirmReset: false,
  // Zojuist een proeftoets gestopt: het scherm Proeftoets zegt dat dan.
  stopped: false,
};

export { state, app };
