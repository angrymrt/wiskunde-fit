// Termen met uitleg (#39). In de tekst staat een term als <span class="term" data-term="id">, zie
// `T`. `termen` laat die staan voor de eerste keer dat de term voorkomt in de tekst die je
// meegeeft, en maakt de rest gewone tekst. Zonder `aan` (de proeftoets) is alles gewone tekst, want
// op een echte toets krijg je ook geen uitleg over de termen. De knop met de popup maakt
// ui/termpopup.js in de browser; zonder JavaScript blijft het gewone tekst.
function termen(html, aan = true) {
  const gezien = new Set();
  return html.replace(
    /<span class="term" data-term="([a-z-]+)">([^<]*)<\/span>/g,
    (heel, id, tekst) => {
      if (!aan || gezien.has(id)) return tekst;
      gezien.add(id);
      return heel;
    },
  );
}

export { termen };
