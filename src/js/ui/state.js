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
};

export { state, app };
