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
  // Het paneel om een probleem te melden, en wat de leerling daar koos of typte: { path, open, soort, wat, tekst }. Gesloten blijft het bewaard tot een ander scherm. Zie ui/melden.js.
  melden: null,
  // De Rekenhulp (ui/rekenhulp.js): of het paneel open staat, bij welke vraag, en de som die de leerling intikt. Het staat
  // hier en niet in het paneel zelf, omdat de knop in het scherm de stand moet kennen (aria-expanded) en omdat het
  // scherm opnieuw wordt getekend terwijl het paneel blijft staan.
  rekenhulp: {
    open: false,
    vraag: null,
    niveau: null,
    som: '',
    vers: false,
    ans: 0,
    doel: 0,
    fout: null,
    tab: 'rekenen',
  },
  // Of de site nu donker is, door het apparaat of door de knop in de kop. Zie main.js.
  dark: false,
  test: null,
  // De onderwerpen van het scherm laden nog ('bezig'), of dat lukte niet ('fout'). Zie ui/laden.js.
  laden: null,
  result: null,
  len: 20,
  timer: null,
  confirmReset: false,
  // Zojuist een proeftoets gestopt: het scherm Proeftoets zegt dat dan.
  stopped: false,
};

export { state, app };
