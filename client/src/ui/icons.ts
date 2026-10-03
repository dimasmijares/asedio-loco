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
  target: `<g ${STROKE}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></g>`,
  // Objetivo de la ronda (R-14): la misma bandera que la chincheta de la escena. La diana (`target`)
  // queda para la puntería.
  flag: `<g ${STROKE}><path d="M5 22V3"/><path d="M5 4h12l-2.5 4.5L17 13H5"/></g>`,
  cross: `<path d="M18 6 6 18M6 6l12 12" ${STROKE}/>`,
  offline: `<g ${STROKE}><path d="M12 20h.01"/><path d="M8.5 16.4a5 5 0 0 1 7 0"/><path d="M5 12.9a10 10 0 0 1 5.2-2.7"/><path d="M19 12.9a10 10 0 0 0-2-1.5"/><path d="M2 8.8a15 15 0 0 1 4.2-2.6"/><path d="M22 8.8a15 15 0 0 0-11.3-3.8"/><path d="m2 2 20 20"/></g>`,
  bot: `<g ${STROKE}><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></g>`,
  eye: `<g ${STROKE}><path d="M2.1 12.3a1 1 0 0 1 0-.7 10.8 10.8 0 0 1 19.8 0 1 1 0 0 1 0 .7 10.8 10.8 0 0 1-19.8 0"/><circle cx="12" cy="12" r="3"/></g>`,
  shield: `<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" ${STROKE}/>`,
  gift: `<g ${STROKE}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/></g>`,
  // Portada, menús y HUD de PC (R-10 U9-U11): los de las maquetas del lienzo.
  help: `<g ${STROKE}><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></g>`,
  dice: `<g ${STROKE}><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"/></g>`,
  pencil: `<g ${STROKE}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></g>`,
  back: `<g ${STROKE}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></g>`,
  // Sala (R-11): salir, compartir, copiar, enlace.
  plus: `<path d="M12 5v14M5 12h14" ${STROKE}/>`,
  logout: `<g ${STROKE}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></g>`,
  share: `<g ${STROKE}><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/></g>`,
  copy: `<g ${STROKE}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></g>`,
  link: `<g ${STROKE}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></g>`,
  keyboard: `<g ${STROKE}><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></g>`,
  // Espectador (R-13): deslizar a los lados.
  swipe: `<g ${STROKE}><path d="M5 12h14"/><path d="m15 8 4 4-4 4"/><path d="m9 8-4 4 4 4"/></g>`,
  hand: `<g ${STROKE}><path d="M22 14a8 8 0 0 1-8 8"/><path d="M18 11v-1a2 2 0 0 0-4 0"/><path d="M14 10V9a2 2 0 0 0-4 0v1"/><path d="M10 9.5V4a2 2 0 0 0-4 0v10"/><path d="M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-6-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></g>`,
  mouse: `<g ${STROKE}><rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 6v4"/></g>`,
  crown: `<g ${STROKE}><path d="M11.56 3.27a.5.5 0 0 1 .88 0l2.95 5.6a1 1 0 0 0 1.52.3l4.27-3.67a.5.5 0 0 1 .8.52l-2.83 10.25a1 1 0 0 1-.96.73H5.81a1 1 0 0 1-.96-.73L2.02 6.02a.5.5 0 0 1 .8-.52l4.27 3.67a1 1 0 0 0 1.52-.3z"/><path d="M5 21h14"/></g>`,
  castle: `<g ${STROKE}><path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M18 11V4H6v7"/><path d="M15 22v-4a3 3 0 0 0-6 0v4"/><path d="M22 11V9M2 11V9M6 4V2M18 4V2M10 4V2M14 4V2"/></g>`,
  // Pantalla final (sin emoji): mayor destrozo y disparo más desviado.
  burst: `<path d="M12 2.5l2.1 5.2 5.2-2.3-2.1 5.1 4.8 1.5-4.8 1.6 2.1 5.1-5.2-2.3L12 21.5l-2.1-5.1-5.2 2.3 2.1-5.1L2 12l4.8-1.5-2.1-5.1 5.2 2.3z" ${STROKE}/>`,
  miss: `<g ${STROKE}><path d="M3 18c3-7 8-11 16-10"/><path d="m15 4 4 4-4 4"/><path d="M14 20h.01M18 17h.01"/></g>`,
  bomb: `<g ${STROKE}><circle cx="11" cy="13" r="9"/><path d="M14.35 4.65 16.3 2.7a2.41 2.41 0 0 1 3.4 0l1.6 1.6a2.4 2.4 0 0 1 0 3.4l-1.95 1.95"/><path d="m22 2-1.5 1.5"/></g>`,
  alert: `<g ${STROKE}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></g>`,
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
