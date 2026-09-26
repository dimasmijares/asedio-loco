import type { Rng } from './math';

export type AmmoId = 'rock' | 'log' | 'coconuts' | 'cow' | 'melon' | 'chicken' | 'piano' | 'blackhole' | 'magnet' | 'snowball' | 'scaffold' | 'bubble';
export type Rarity = 'comun' | 'rara' | 'epica' | 'defensiva';

export interface AmmoDef {
  id: AmmoId;
  name: string;
  rarity: Rarity;
  icon: string;
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
}

export const RARITY_LABEL: Record<Rarity, string> = { comun: 'Común', rara: 'Rara', epica: 'Épica', defensiva: 'Defensiva' };
export const RARITY_COLOR: Record<Rarity, string> = { comun: '#8d99ae', rara: '#3a86ff', epica: '#b5179e', defensiva: '#2a9d8f' };

export const AMMO: Record<AmmoId, AmmoDef> = {
  rock: { id: 'rock', name: 'Pedrusco', rarity: 'comun', icon: '🪨', color: '#8a8f98', desc: 'Una bola de piedra: rompe justo donde apuntas.', weight: 22, shape: 'ball', radius: 0.45, density: 6, restitution: 0.1, friction: 0.8, drag: 0.004, windFactor: 0.25 },
  log: { id: 'log', name: 'Tronco rodante', rarity: 'comun', icon: '🪵', color: '#a0522d', desc: 'Al tocar algo rueda en línea recta y arrasa lo que pilla.', weight: 14, shape: 'log', radius: 0.36, length: 1.9, density: 3, restitution: 0.1, friction: 0.9, drag: 0.005, windFactor: 0.3 },
  coconuts: { id: 'coconuts', name: 'Racimo de cocos', rarity: 'comun', icon: '🥥', color: '#6b4226', desc: 'Se abre en 6 cocos que caen por todo el castillo.', weight: 14, shape: 'ball', radius: 0.42, density: 10, restitution: 0.3, friction: 0.6, drag: 0.004, windFactor: 0.3 },
  cow: { id: 'cow', name: 'Vaca explosiva', rarity: 'rara', icon: '🐄', color: '#f4f1de', desc: 'Muge al volar y explota al tocar algo: deja un cráter.', weight: 8, shape: 'box', radius: 0.45, length: 1.2, density: 1.4, restitution: 0.1, friction: 0.6, drag: 0.006, windFactor: 0.45 },
  melon: { id: 'melon', name: 'Sandía pegajosa', rarity: 'rara', icon: '🍉', color: '#2a9d3f', desc: 'Se pega y a los 2 s revienta desde dentro.', weight: 7, shape: 'ball', radius: 0.42, density: 1.2, restitution: 0, friction: 1, drag: 0.004, windFactor: 0.35 },
  chicken: { id: 'chicken', name: 'Gallina saltarina', rarity: 'rara', icon: '🐔', color: '#fff3b0', desc: 'Bota sobre el castillo soltando racimos de huevos bomba.', weight: 7, shape: 'ball', radius: 0.34, density: 6, restitution: 0.75, friction: 0.4, drag: 0.005, windFactor: 0.5 },
  piano: { id: 'piano', name: 'Piano', rarity: 'rara', icon: '🎹', color: '#222222', desc: 'Cae en vertical, atraviesa pisos y remata con un acorde.', weight: 6, shape: 'box', radius: 0.5, length: 1.7, density: 6, restitution: 0.05, friction: 0.7, drag: 0.003, windFactor: 0.2 },
  blackhole: { id: 'blackhole', name: 'Agujero negro', rarity: 'epica', icon: '🕳️', color: '#3c096c', desc: 'Se traga lo cercano 2 s y escupe lo que sobra.', weight: 3, shape: 'ball', radius: 0.35, density: 3, restitution: 0, friction: 1, drag: 0.004, windFactor: 0.2 },
  magnet: { id: 'magnet', name: 'Imán', rarity: 'epica', icon: '🧲', color: '#e63946', desc: 'Arranca el hierro y lo lanza de vuelta al castillo.', weight: 3, shape: 'ball', radius: 0.4, density: 3.5, restitution: 0, friction: 1, drag: 0.004, windFactor: 0.2 },
  snowball: { id: 'snowball', name: 'Bola de nieve', rarity: 'epica', icon: '❄️', color: '#e0fbfc', desc: 'Rueda en línea recta y crece. Y crece. Y crece.', weight: 3, shape: 'ball', radius: 0.45, density: 2.2, restitution: 0.05, friction: 1, drag: 0.004, windFactor: 0.3 },
  scaffold: { id: 'scaffold', name: 'Andamio', rarity: 'defensiva', icon: '🏗️', color: '#f4a261', desc: 'Reconstruye hasta 15 bloques de tu castillo.', weight: 7, shape: 'none', radius: 0, density: 0, restitution: 0, friction: 0, drag: 0, windFactor: 0, defensive: true },
  bubble: { id: 'bubble', name: 'Burbuja', rarity: 'defensiva', icon: '🫧', color: '#72ddf7', desc: 'Un escudo que absorbe el próximo impacto.', weight: 6, shape: 'none', radius: 0, density: 0, restitution: 0, friction: 0, drag: 0, windFactor: 0, defensive: true },
};

export const AMMO_IDS = Object.keys(AMMO) as AmmoId[];

// Con solo 2 jugadores vivos sale munición más rara.
const DUEL_BOOST: Record<Rarity, number> = { comun: 0.55, rara: 1.5, epica: 2.6, defensiva: 0.9 };

export function ammoWeights(duel: boolean): [AmmoId, number][] {
  return AMMO_IDS.map((id) => [id, AMMO[id].weight * (duel ? DUEL_BOOST[AMMO[id].rarity] : 1)]);
}

export function drawAmmo(r: Rng, duel = false): AmmoId {
  const w = ammoWeights(duel);
  const total = w.reduce((s, [, x]) => s + x, 0);
  let t = r.next() * total;
  for (const [id, x] of w) {
    t -= x;
    if (t <= 0) return id;
  }
  return 'rock';
}
