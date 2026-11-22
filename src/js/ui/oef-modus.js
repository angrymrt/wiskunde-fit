// Het volledig-schermmodus van het oefenscherm (#222): alleen op een telefoon, dus aanraken, een smal scherm en rechtop.
// Een telefoon in landschap heeft het paneel van de Rekenhulp aan de zijkant (zie styles.css) en blijft bij het gewone
// scherm. Wat dit bepaalt is alleen het uiterlijk: de pagina zelf is voor iedereen dezelfde HTML.
const VRAAG = '(pointer: coarse) and (max-width: 640px) and (orientation: portrait)';

export const oefModus = () => typeof matchMedia === 'function' && matchMedia(VRAAG).matches;

// Roept `f` aan als het apparaat in of uit het modus gaat, bijvoorbeeld door te draaien.
export function bijWissel(f) {
  const mq = matchMedia(VRAAG);
  if (mq.addEventListener) mq.addEventListener('change', f);
  else mq.addListener?.(f);
}
