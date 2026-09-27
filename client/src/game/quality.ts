// Calidad con la que arranca el juego, sin importar la física (la usa también la portada).
import { isMobileDevice } from '../device';
import type { Quality } from './render/stage';

const QUALITY_KEY = 'asedio.quality';

export function savedQuality(): Quality {
  try {
    const q = localStorage.getItem(QUALITY_KEY) as Quality | null;
    if (q === 'low' || q === 'medium' || q === 'high') return q;
  } catch {
    /* sin almacenamiento */
  }
  const url = new URLSearchParams(location.search).get('quality') as Quality | null;
  // Perfil móvil (WRK-TASK-008): sin calidad elegida, un móvil arranca en baja.
  return url ?? (isMobileDevice() ? 'low' : 'medium');
}
