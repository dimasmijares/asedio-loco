import type { AmmoId } from '../../../shared/ammo';

// Ilustraciones de la munición (R-10 E4): SVG propios en una retícula de 48×48 con contorno noche
// de 2,5 px, iguales en todos los dispositivos (los emoji cambiaban de un sistema a otro). Sandía,
// vaca, pedrusco y agujero negro son los del componente CartaMunicion del design system; el resto
// sigue su estilo: relleno plano, un brillo hueso y los detalles en noche.
const N = '#200432';
const LINE = `stroke="${N}" stroke-width="2.5" stroke-linejoin="round"`;
const SHINE = 'fill="none" stroke="#FFF6E2" stroke-width="2.2" stroke-linecap="round"';
// Palo con contorno: un trazo noche ancho y, encima, el color más estrecho.
const pole = (d: string, color: string) => `<path d="${d}" fill="none" stroke="${N}" stroke-width="7" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linecap="round"/>`;

const ART: Record<AmmoId, string> = {
  rock: `<path d="M8 32 12 16l10-6 12 3 7 12-4 11H13z" fill="#8E8296" ${LINE}/><path d="M14 18l8-3 9 2" ${SHINE} opacity="0.6"/><path d="M20 30l5-6 6 4" fill="none" stroke="${N}" stroke-width="2" stroke-linecap="round" opacity="0.5"/>`,
  log: `<rect x="7" y="15" width="31" height="18" rx="4" fill="#A0622D" ${LINE}/><ellipse cx="38" cy="24" rx="6" ry="9" fill="#E9C27E" ${LINE}/><ellipse cx="38" cy="24" rx="2.6" ry="4.2" fill="none" stroke="#A0622D" stroke-width="1.8"/><path d="M12 19h14" ${SHINE} opacity="0.55"/><path d="M13 25h9M18 29h12" fill="none" stroke="${N}" stroke-width="2" stroke-linecap="round" opacity="0.45"/>`,
  coconuts: `<path d="M24 14c-2-5-7-8-12-7 3 2 5 4 6 7zM24 14c2-5 7-8 12-7-3 2-5 4-6 7z" fill="#3E8E3A" ${LINE}/><circle cx="15" cy="32" r="9" fill="#8A5530" ${LINE}/><circle cx="33" cy="32" r="9" fill="#8A5530" ${LINE}/><circle cx="24" cy="23" r="9" fill="#9C6338" ${LINE}/><circle cx="21" cy="22" r="1.5" fill="${N}"/><circle cx="27" cy="22" r="1.5" fill="${N}"/><circle cx="24" cy="26.5" r="1.5" fill="${N}"/><path d="M18 19a7 7 0 0 1 4-3" ${SHINE} opacity="0.6"/>`,
  cow: `<path d="M12 14c-4-1-7-4-7-6 3 0 6 2 8 4z" fill="#E9C27E" ${LINE}/><path d="M36 14c4-1 7-4 7-6-3 0-6 2-8 4z" fill="#E9C27E" ${LINE}/><ellipse cx="24" cy="22" rx="13" ry="13" fill="#FFF6E2" ${LINE}/><path d="M14 16c3-2 6-1 6 2s-4 4-6 2z" fill="${N}"/><path d="M31 24c3 0 5 2 3 4s-5 0-5-2z" fill="${N}"/><ellipse cx="24" cy="33" rx="10" ry="7" fill="#F2A7A0" ${LINE}/><circle cx="20.5" cy="33" r="1.6" fill="${N}"/><circle cx="27.5" cy="33" r="1.6" fill="${N}"/><circle cx="19" cy="22" r="1.8" fill="${N}"/><circle cx="29" cy="22" r="1.8" fill="${N}"/>`,
  melon: `<path d="M5 18a19 19 0 0 0 38 0z" fill="#3E8E3A" ${LINE}/><path d="M9.5 18a14.5 14.5 0 0 0 29 0z" fill="#CD1A30"/><ellipse cx="18" cy="24" rx="1.6" ry="2.4" fill="${N}"/><ellipse cx="24" cy="27" rx="1.6" ry="2.4" fill="${N}"/><ellipse cx="30" cy="24" rx="1.6" ry="2.4" fill="${N}"/>`,
  chicken: `<path d="M17 13c-1-4 2-6 4-4 1-3 5-3 6 0 2-1 4 1 3 4z" fill="#CD1A30" ${LINE}/><path d="M20 40v4M28 40v4" fill="none" stroke="#C4581A" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="24" cy="27" rx="14" ry="13" fill="#FFF6E2" ${LINE}/><path d="M37 23l7 2.5-7 3z" fill="#FE8932" ${LINE}/><circle cx="31" cy="21" r="1.9" fill="${N}"/><path d="M15 27c3 5 9 5 11 0" fill="none" stroke="${N}" stroke-width="2" stroke-linecap="round"/>`,
  piano: `<path d="M12 36v6M36 36v6" fill="none" stroke="${N}" stroke-width="3" stroke-linecap="round"/><rect x="7" y="10" width="34" height="27" rx="3" fill="#4A3A4E" ${LINE}/><rect x="10.5" y="24" width="27" height="10" fill="#FFF6E2" stroke="${N}" stroke-width="2"/><path d="M15.5 24v5.5M20.5 24v5.5M27.5 24v5.5M32.5 24v5.5" fill="none" stroke="${N}" stroke-width="2.6"/><path d="M12 15h18" ${SHINE} opacity="0.5"/>`,
  blackhole: `<circle cx="24" cy="24" r="17" fill="#9E2E8A" ${LINE}/><circle cx="24" cy="24" r="11" fill="${N}"/><path d="M24 7a17 17 0 0 1 15 9" ${SHINE} opacity="0.7"/>`,
  magnet: `<path d="M10 8v16a14 14 0 0 0 28 0V8h-9v16a5 5 0 0 1-10 0V8z" fill="#CD1A30" ${LINE}/><path d="M10 8h9v7h-9zM29 8h9v7h-9z" fill="#E6E1EA" ${LINE}/><path d="M14 27a10 10 0 0 0 6 8" ${SHINE} opacity="0.6"/>`,
  snowball: `<circle cx="24" cy="25" r="16" fill="#F4FAFF" ${LINE}/><path d="M13 31a12 12 0 0 0 19 6" fill="none" stroke="#9FD0EA" stroke-width="3" stroke-linecap="round"/><circle cx="29" cy="21" r="1.6" fill="#9FD0EA"/><circle cx="20" cy="28" r="1.4" fill="#9FD0EA"/><circle cx="31" cy="30" r="1.2" fill="#9FD0EA"/><path d="M15 19a11 11 0 0 1 7-6" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round"/>`,
  scaffold: `${pole('M13 42V7M35 42V7', '#E9C27E')}${pole('M13 15h22M13 29h22M13 29l22-14', '#E9C27E')}<rect x="17" y="34" width="14" height="8" rx="1" fill="#A8949C" ${LINE}/>`,
  bubble: `<circle cx="22" cy="26" r="16" fill="#BFE6F7" ${LINE}/><path d="M13 21a10 10 0 0 1 8-7" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><circle cx="29" cy="33" r="2.4" fill="#FFF6E2" opacity="0.85"/><circle cx="40" cy="9" r="4" fill="#BFE6F7" stroke="${N}" stroke-width="2"/>`,
};

// Ilustración lista para meter en una carta o en la tarjeta de descripción. Mide 1,2 em: crece
// con el tamaño de letra del contenedor, como hacían los emoji.
export function ammoArt(id: AmmoId): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = 'ammo-art';
  el.setAttribute('aria-hidden', 'true');
  // Texto fijo de este archivo, sin datos de usuario.
  el.innerHTML = `<svg viewBox="0 0 48 48" width="48" height="48">${ART[id]}</svg>`;
  return el;
}
