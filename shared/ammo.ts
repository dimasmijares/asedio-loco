import type { Rng } from './math';

export type AmmoId = 'rock' | 'log' | 'coconuts' | 'cow' | 'melon' | 'chicken' | 'piano' | 'blackhole' | 'magnet' | 'snowball' | 'scaffold' | 'bubble';
export type Rarity = 'comun' | 'rara' | 'epica' | 'defensiva';

export interface AmmoDef {
  id: AmmoId;
  name: string;
  rarity: Rarity;
  color: string;
  desc: string;
  weight: number; // probabilidad relativa dentro del reparto
  shape: 'ball' | 'log' | 'box' | 'none';
  radius: number; // bola / tronco
  length?: number; // tronco o caja
  density: number;
  restitution: number;
  friction: number;
  drag: number; // coeficiente de arrastre (aceleración = drag·|v|·v)
  windFactor: number;
  defensive?: boolean;
  // Fuera del reparto (WRK-TASK-055): por ahora solo se dispara munición que vuela en parábola
  // desde la catapulta. El código sigue ahí y el campo de pruebas las ofrece.
  retired?: boolean;
}

export const RARITY_LABEL: Record<Rarity, string> = { comun: 'Común', rara: 'Rara', epica: 'Épica', defensiva: 'Defensiva' };
// Colores de rareza del design system «Atardecer» (R-10) y el texto que va encima. Defensiva usa
// `listo` (decisión del usuario, 02-10-2026): no tiene token propio.
export const RARITY_COLOR: Record<Rarity, string> = { comun: '#A8949C', rara: '#4FA8E8', epica: '#9E2E8A', defensiva: '#9ED36A' };
export const RARITY_INK: Record<Rarity, string> = { comun: '#200432', rara: '#200432', epica: '#FEE7B5', defensiva: '#200432' };

export const AMMO: Record<AmmoId, AmmoDef> = {
  rock: { id: 'rock', name: 'Pedrusco', rarity: 'comun', color: '#8a8f98', desc: 'Bola de piedra maciza. Rompe los bloques en el punto de impacto.', weight: 22, shape: 'ball', radius: 0.45, density: 6, restitution: 0.1, friction: 0.8, drag: 0.004, windFactor: 0.25 },
  log: { id: 'log', name: 'Tronco rodante', rarity: 'comun', color: '#a0522d', desc: 'Al impactar, rueda en línea recta y derriba lo que encuentra.', weight: 14, shape: 'log', radius: 0.36, length: 1.9, density: 3, restitution: 0.1, friction: 0.9, drag: 0.005, windFactor: 0.3 },
  coconuts: { id: 'coconuts', name: 'Racimo de cocos', rarity: 'comun', color: '#6b4226', desc: 'Se abre en el aire en 6 cocos que explotan al tocar algo.', weight: 14, shape: 'ball', radius: 0.42, density: 9, restitution: 0.3, friction: 0.6, drag: 0.004, windFactor: 0.3 },
  cow: { id: 'cow', name: 'Vaca explosiva', rarity: 'rara', color: '#f4f1de', desc: 'Explota al primer contacto y abre un cráter en el castillo.', weight: 8, shape: 'box', radius: 0.45, length: 1.2, density: 1.4, restitution: 0.1, friction: 0.6, drag: 0.006, windFactor: 0.45 },
  melon: { id: 'melon', name: 'Sandía pegajosa', rarity: 'rara', color: '#2a9d3f', desc: 'Se adhiere al impactar y explota a los 2 s desde el interior.', weight: 7, shape: 'ball', radius: 0.42, density: 1.2, restitution: 0, friction: 1, drag: 0.004, windFactor: 0.35 },
  chicken: { id: 'chicken', name: 'Gallina saltarina', rarity: 'rara', color: '#fff3b0', desc: 'Rebota sobre el castillo y en cada bote suelta huevos explosivos.', weight: 7, shape: 'ball', radius: 0.34, density: 6, restitution: 0.75, friction: 0.4, drag: 0.005, windFactor: 0.5, retired: true },
  piano: { id: 'piano', name: 'Piano', rarity: 'rara', color: '#222222', desc: 'Cae en vertical, atraviesa pisos y genera una onda en el suelo.', weight: 6, shape: 'box', radius: 0.5, length: 1.7, density: 6, restitution: 0.05, friction: 0.7, drag: 0.003, windFactor: 0.2, retired: true },
  blackhole: { id: 'blackhole', name: 'Agujero negro', rarity: 'epica', color: '#3c096c', desc: 'Absorbe los bloques cercanos 2 s y después expulsa el resto.', weight: 3, shape: 'ball', radius: 0.35, density: 3, restitution: 0, friction: 1, drag: 0.004, windFactor: 0.2 },
  magnet: { id: 'magnet', name: 'Imán', rarity: 'epica', color: '#e63946', desc: 'Arranca los bloques de hierro y los proyecta contra el castillo.', weight: 3, shape: 'ball', radius: 0.4, density: 3.5, restitution: 0, friction: 1, drag: 0.004, windFactor: 0.2 },
  snowball: { id: 'snowball', name: 'Bola de nieve', rarity: 'epica', color: '#e0fbfc', desc: 'Rueda en línea recta y aumenta de tamaño mientras avanza.', weight: 3, shape: 'ball', radius: 0.45, density: 2.2, restitution: 0.05, friction: 1, drag: 0.004, windFactor: 0.3 },
  scaffold: { id: 'scaffold', name: 'Andamio', rarity: 'defensiva', color: '#f4a261', desc: 'Reconstruye hasta 15 bloques de tu castillo.', weight: 7, shape: 'none', radius: 0, density: 0, restitution: 0, friction: 0, drag: 0, windFactor: 0, defensive: true, retired: true },
  bubble: { id: 'bubble', name: 'Burbuja', rarity: 'defensiva', color: '#72ddf7', desc: 'Escudo que absorbe el siguiente impacto rival.', weight: 6, shape: 'none', radius: 0, density: 0, restitution: 0, friction: 0, drag: 0, windFactor: 0, defensive: true, retired: true },
};

export const AMMO_IDS = Object.keys(AMMO) as AmmoId[];
// Las que se reparten en una partida.
export const DEALT_IDS = AMMO_IDS.filter((id) => !AMMO[id].retired);

// Con solo 2 jugadores vivos sale munición más rara.
const DUEL_BOOST: Record<Rarity, number> = { comun: 0.55, rara: 1.5, epica: 2.6, defensiva: 0.9 };

export function ammoWeights(duel: boolean): [AmmoId, number][] {
  return DEALT_IDS.map((id) => [id, AMMO[id].weight * (duel ? DUEL_BOOST[AMMO[id].rarity] : 1)]);
}

export function drawAmmo(r: Rng, duel = false, only?: Rarity[]): AmmoId {
  const w = ammoWeights(duel).filter(([id]) => !only || only.includes(AMMO[id].rarity));
  const total = w.reduce((s, [, x]) => s + x, 0);
  let t = r.next() * total;
  for (const [id, x] of w) {
    t -= x;
    if (t <= 0) return id;
  }
  return 'rock';
}
