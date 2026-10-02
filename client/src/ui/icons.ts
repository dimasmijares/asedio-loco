// Iconos de la interfaz (R-10, sección «Iconos» del design system): SVG en una retícula de 24×24,
// trazo de 2,5 px con extremos redondos y en currentColor, así toman el color del texto. Sustituyen
// a los emoji, que cambian de un sistema a otro.
const STROKE = 'fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  // Llama del botón de disparo (componente BandejaMovil): rellena de crema con contorno noche.
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" fill="#FEE7B5" stroke="#200432" stroke-width="1.8" stroke-linejoin="round"/>',
  check: `<path d="M20 6 9 17l-5-5" ${STROKE}/>`,
  // Trazos de Lucide (ISC), los mismos que usan las maquetas del lienzo.
  gear: `<g ${STROKE}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></g>`,
  sound: `<g ${STROKE}><path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6a1.4 1.4 0 0 1-1 .4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"/><path d="M16 9a5 5 0 0 1 0 6"/><path d="M19.4 18.4a9 9 0 0 0 0-12.8"/></g>`,
  mute: `<g ${STROKE}><path d="M11 4.7a.7.7 0 0 0-1.2-.5L6.4 7.6a1.4 1.4 0 0 1-1 .4H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.4a1.4 1.4 0 0 1 1 .4l3.4 3.4a.7.7 0 0 0 1.2-.5z"/><path d="m22 9-6 6M16 9l6 6"/></g>`,
  wind: `<g ${STROKE}><path d="M3 8h11a3 3 0 1 0-3-3"/><path d="M3 12h16a3 3 0 1 1-3 3"/><path d="M3 16h7"/></g>`,
  // Flecha hacia arriba: el viento la gira según hacia dónde sopla respecto a la cámara.
  arrow: `<g ${STROKE}><path d="m5 11 7-7 7 7"/><path d="M12 20V4"/></g>`,
  target: `<g ${STROKE}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></g>`,
  cross: `<path d="M18 6 6 18M6 6l12 12" ${STROKE}/>`,
  offline: `<g ${STROKE}><path d="M12 20h.01"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 5.2-2.7"/><path d="M19 12.9a10 10 0 0 0-2-1.5"/><path d="M2 8.8a15 15 0 0 1 4.2-2.6"/><path d="M22 8.8a15 15 0 0 0-11.3-3.8"/><path d="m2 2 20 20"/></g>`,
  bot: `<g ${STROKE}><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></g>`,
  eye: `<g ${STROKE}><path d="M2.1 12.3a1 1 0 0 1 0-.7 10.8 10.8 0 0 1 19.8 0 1 1 0 0 1 0 .7 10.8 10.8 0 0 1-19.8 0"/><circle cx="12" cy="12" r="3"/></g>`,
  shield: `<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" ${STROKE}/>`,
  gift: `<g ${STROKE}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></g>`,
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
