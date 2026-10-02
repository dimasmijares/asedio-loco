// Iconos de la interfaz (R-10, sección «Iconos» del design system): SVG en una retícula de 24×24,
// trazo de 2,5 px con extremos redondos y en currentColor, así toman el color del texto. Sustituyen
// a los emoji, que cambian de un sistema a otro.
const STROKE = 'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  // Llama del botón de disparo (componente BandejaMovil): rellena de crema con contorno noche.
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="#FEE7B5" stroke="#200432" stroke-width="1.8" stroke-linejoin="round"/>',
  check: `<path d="M20 6 9 17l-5-5" ${STROKE}/>`,
} as const;

export type IconName = keyof typeof ICONS;

// Icono listo para meter en un botón o un chip; mide 1 em salvo que el CSS diga otra cosa.
export function icon(name: IconName, cls = ''): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = `ico ico-${name}${cls ? ` ${cls}` : ''}`;
  el.setAttribute('aria-hidden', 'true');
  // Texto fijo de este archivo, sin datos de usuario.
  el.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24">${ICONS[name]}</svg>`;
  return el;
}
