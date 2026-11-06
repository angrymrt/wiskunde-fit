// Gedeelde toestand van de schermen.

const app = document.getElementById('app');
const state = { view: { name: 'home' }, prac: {}, test: null, timer: null, confirmReset: false };

export { state, app };
