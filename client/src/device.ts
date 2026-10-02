// Qué dispositivo es y cosas que solo se hacen en móvil.

// Móvil o tableta: pantalla táctil sin ratón. ?mobile=1 o ?mobile=0 lo fuerzan (pruebas).
export function isMobileDevice() {
  const q = new URLSearchParams(location.search).get('mobile');
  if (q === '1' || q === '0') return q === '1';
  return matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches;
}

// Partida en móvil vertical (R-10 U1-U8): la bandeja del pulgar abajo y el marcador en fila arriba.
// Depende de la forma de la pantalla, no del dispositivo: un móvil girado vuelve al HUD de siempre.
export const TRAY_QUERY = '(orientation: portrait) and (max-width: 600px)';
export const trayLayout = () => matchMedia(TRAY_QUERY).matches;

// En móvil, pantalla completa, sin bloquear la orientación: se juega en vertical o en horizontal.
// Necesita un gesto del usuario (llamar desde un clic). En iPhone no hay pantalla completa fuera
// de una app instalada: se queda como está.
export function enterFullscreen() {
  if (!isMobileDevice() || document.fullscreenElement) return;
  const el = document.documentElement;
  try {
    void el.requestFullscreen?.({ navigationUI: 'hide' }).catch(() => {});
  } catch {
    /* sin pantalla completa */
  }
}
