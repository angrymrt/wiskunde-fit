// Gedeelde toestand van de schermen.

// Bij het bouwen draaien de schermen in Node, zonder document. Dan is er geen app.
const app = globalThis.document?.getElementById('app') ?? null;
const state = {
  view: { name: 'home' },
  prac: {},
  pick: {},
  test: null,
  result: null,
  len: 20,
  timer: null,
  confirmReset: false,
  // Zojuist een proeftoets gestopt: het scherm Proeftoets zegt dat dan.
  stopped: false,
};

export { state, app };
