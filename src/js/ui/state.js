// Gedeelde toestand van de schermen.

const app = document.getElementById('app');
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
