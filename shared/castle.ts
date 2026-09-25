import { castleQuat, toWorld } from './map';
import type { MaterialId } from './materials';
import { quatMul, type Quat, type Vec3 } from './math';

export interface BlockDef {
  id: number;
  slot: number;
  mat: MaterialId;
  size: Vec3; // dimensiones completas (no semiejes)
  p: Vec3; // centro en coordenadas de mundo
  q: Quat;
  part: 'wall' | 'tower' | 'cren' | 'keep' | 'glass' | 'roof';
}

export interface CastleDef {
  slot: number;
  blocks: BlockDef[];
  joints: [number, number][]; // uniones rompibles entre bloques
  kingPos: Vec3;
}

export const BLOCK_ID_STRIDE = 200;
export const KING_ID_BASE = 1000;
export const kingId = (slot: number) => KING_ID_BASE + slot;
export const slotOfBlock = (id: number) => Math.floor((id - 1) / BLOCK_ID_STRIDE);

export const KING_RADIUS = 0.3;
export const KING_HALF_HEIGHT = 0.25; // del cilindro de la cápsula
// Escala del castillo respecto al diseño original (bloques un 20 % mayores).
export const CASTLE_SCALE = 1.2;
const S = CASTLE_SCALE;
export const PEDESTAL_TOP = 2.3 * S;

interface LocalBlock {
  mat: MaterialId;
  size: Vec3;
  p: Vec3;
  part: BlockDef['part'];
  rotY?: number;
}

// Plano local de un castillo (140 bloques). El eje +z es la fachada, que mira al centro de la isla.
function localCastle(): { blocks: LocalBlock[]; joints: [number, number][] } {
  const blocks: LocalBlock[] = [];
  const joints: [number, number][] = [];
  const add = (b: LocalBlock) => blocks.push(b) - 1;
  const CORNERS = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ];

  // Torres en las esquinas: 5 bloques apilados unidos entre sí y 4 almenas arriba.
  const T = 3.25 * S;
  const TOWER_ROWS = 5;
  for (const [sx, sz] of CORNERS) {
    let prev = -1;
    for (let r = 0; r < TOWER_ROWS; r++) {
      const i = add({ mat: r < 3 ? 'stone' : 'wood', size: [1.5 * S, S, 1.5 * S], p: [sx * T, (0.5 + r) * S, sz * T], part: 'tower' });
      if (prev >= 0) joints.push([prev, i]);
      prev = i;
    }
    for (const [cx, cz] of CORNERS) {
      const i = add({ mat: 'stone', size: [0.45 * S, 0.5 * S, 0.45 * S], p: [sx * T + cx * 0.52 * S, (TOWER_ROWS + 0.25) * S, sz * T + cz * 0.52 * S], part: 'cren' });
      joints.push([prev, i]);
    }
  }

  // Murallas entre torres: 4 hileras de 5 bloques. Arriba, madera unida como una pasarela.
  const WALL_ROWS = 4;
  const walls: { axis: 'x' | 'z'; fixed: number; side: 'front' | 'back' | 'left' | 'right' }[] = [
    { axis: 'x', fixed: T, side: 'front' },
    { axis: 'x', fixed: -T, side: 'back' },
    { axis: 'z', fixed: -T, side: 'left' },
    { axis: 'z', fixed: T, side: 'right' },
  ];
  for (const w of walls) {
    for (let r = 0; r < WALL_ROWS; r++) {
      let prev = -1;
      for (let k = 0; k < 5; k++) {
        const along = (-2 + k) * S;
        let mat: MaterialId = r === WALL_ROWS - 1 ? 'wood' : 'stone';
        if (r === 2 && k === 2) mat = 'glass'; // ventana
        if (r === 0 && k === 2 && w.side === 'front') mat = 'iron'; // portón
        if (r === 1 && (k === 1 || k === 3) && w.side === 'back') mat = 'iron'; // refuerzo trasero
        const p: Vec3 = w.axis === 'x' ? [along, (0.5 + r) * S, w.fixed] : [w.fixed, (0.5 + r) * S, along];
        const size: Vec3 = w.axis === 'x' ? [0.98 * S, S, S] : [S, S, 0.98 * S];
        const i = add({ mat, size, p, part: 'wall' });
        if (r === WALL_ROWS - 1 && prev >= 0) joints.push([prev, i]);
        prev = i;
      }
    }
  }

  // Contrafuertes en el centro de las murallas laterales, por fuera: 4 bloques y una almena.
  for (const sx of [-1, 1]) {
    let prev = -1;
    for (let r = 0; r < 4; r++) {
      const i = add({ mat: r < 2 ? 'stone' : 'wood', size: [S, S, 1.2 * S], p: [sx * (T + S), (0.5 + r) * S, 0], part: 'tower' });
      if (prev >= 0) joints.push([prev, i]);
      prev = i;
    }
    const c = add({ mat: 'stone', size: [0.5 * S, 0.5 * S, 0.5 * S], p: [sx * (T + S), 4.25 * S, 0], part: 'cren' });
    joints.push([prev, c]);
  }

  // Torreón del rey: pedestal de piedra 2x2x2, placa de hierro, jaula de cristal y tejado de madera.
  const ped: number[] = [];
  for (let r = 0; r < 2; r++)
    for (const [x, z] of [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ])
      ped.push(add({ mat: 'stone', size: [0.98 * S, S, 0.98 * S], p: [x * S, (0.5 + r) * S, z * S], part: 'keep' }));
  const plate = add({ mat: 'iron', size: [2.2 * S, 0.3 * S, 2.2 * S], p: [0, 2.15 * S, 0], part: 'keep' });
  for (const i of ped.slice(4)) joints.push([i, plate]);
  const paneH = 1.15 * S;
  const py = PEDESTAL_TOP + paneH / 2;
  const panes = [
    add({ mat: 'glass', size: [2.2 * S, paneH, 0.14 * S], p: [0, py, 1.03 * S], part: 'glass' }),
    add({ mat: 'glass', size: [2.2 * S, paneH, 0.14 * S], p: [0, py, -1.03 * S], part: 'glass' }),
    add({ mat: 'glass', size: [0.14 * S, paneH, 1.9 * S], p: [1.03 * S, py, 0], part: 'glass' }),
    add({ mat: 'glass', size: [0.14 * S, paneH, 1.9 * S], p: [-1.03 * S, py, 0], part: 'glass' }),
  ];
  for (const i of panes) joints.push([plate, i]);
  const roof = add({ mat: 'wood', size: [2.5 * S, 0.22 * S, 2.5 * S], p: [0, PEDESTAL_TOP + paneH + 0.11 * S, 0], part: 'roof' });
  for (const i of panes) joints.push([i, roof]);

  return { blocks, joints };
}

const LOCAL = localCastle();
export const BLOCKS_PER_CASTLE = LOCAL.blocks.length;

export function buildCastle(slot: number): CastleDef {
  const q0 = castleQuat(slot);
  const base = slot * BLOCK_ID_STRIDE + 1;
  const blocks = LOCAL.blocks.map<BlockDef>((b, i) => ({
    id: base + i,
    slot,
    mat: b.mat,
    size: b.size,
    p: toWorld(slot, b.p),
    q: b.rotY ? quatMul(q0, [0, Math.sin(b.rotY / 2), 0, Math.cos(b.rotY / 2)]) : q0,
    part: b.part,
  }));
  return {
    slot,
    blocks,
    joints: LOCAL.joints.map(([a, b]) => [base + a, base + b]),
    kingPos: toWorld(slot, [0, PEDESTAL_TOP + KING_HALF_HEIGHT + KING_RADIUS + 0.02, 0]),
  };
}

// Bloques del plano original que ya no están: los que puede reconstruir el andamio.
export function missingBlocks(slot: number, alive: Set<number>): BlockDef[] {
  return buildCastle(slot).blocks.filter((b) => !alive.has(b.id));
}
