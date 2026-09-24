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
export const PEDESTAL_TOP = 2.3;

interface LocalBlock {
  mat: MaterialId;
  size: Vec3;
  p: Vec3;
  part: BlockDef['part'];
  rotY?: number;
}

// Plano local de un castillo (unos 106 bloques). El eje +z es la fachada, que mira al centro de la isla.
function localCastle(): { blocks: LocalBlock[]; joints: [number, number][] } {
  const blocks: LocalBlock[] = [];
  const joints: [number, number][] = [];
  const add = (b: LocalBlock) => blocks.push(b) - 1;

  // Torres en las esquinas: 4 bloques apilados unidos entre sí y 4 almenas arriba.
  const T = 3.25;
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    let prev = -1;
    for (let r = 0; r < 4; r++) {
      const i = add({ mat: r < 2 ? 'stone' : 'wood', size: [1.5, 1, 1.5], p: [sx * T, 0.5 + r, sz * T], part: 'tower' });
      if (prev >= 0) joints.push([prev, i]);
      prev = i;
    }
    for (const [cx, cz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      const i = add({ mat: 'stone', size: [0.45, 0.5, 0.45], p: [sx * T + cx * 0.52, 4.25, sz * T + cz * 0.52], part: 'cren' });
      joints.push([prev, i]);
    }
  }

  // Murallas entre torres: 3 hileras de 5 bloques de 1 m. Arriba, madera unida como una pasarela.
  const walls: { axis: 'x' | 'z'; fixed: number; side: 'front' | 'back' | 'left' | 'right' }[] = [
    { axis: 'x', fixed: T, side: 'front' },
    { axis: 'x', fixed: -T, side: 'back' },
    { axis: 'z', fixed: -T, side: 'left' },
    { axis: 'z', fixed: T, side: 'right' },
  ];
  for (const w of walls) {
    for (let r = 0; r < 3; r++) {
      let prev = -1;
      for (let k = 0; k < 5; k++) {
        const along = -2 + k;
        let mat: MaterialId = r === 2 ? 'wood' : 'stone';
        if (r === 1 && k === 2) mat = 'glass'; // ventana
        if (r === 0 && k === 2 && w.side === 'front') mat = 'iron'; // portón
        if (r === 1 && (k === 1 || k === 3) && w.side === 'back') mat = 'iron'; // refuerzo trasero
        const p: Vec3 = w.axis === 'x' ? [along, 0.5 + r, w.fixed] : [w.fixed, 0.5 + r, along];
        const size: Vec3 = w.axis === 'x' ? [0.98, 1, 1] : [1, 1, 0.98];
        const i = add({ mat, size, p, part: 'wall' });
        if (r === 2 && prev >= 0) joints.push([prev, i]);
        prev = i;
      }
    }
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
      ped.push(add({ mat: 'stone', size: [0.98, 1, 0.98], p: [x, 0.5 + r, z], part: 'keep' }));
  const plate = add({ mat: 'iron', size: [2.2, 0.3, 2.2], p: [0, 2.15, 0], part: 'keep' });
  for (const i of ped.slice(4)) joints.push([i, plate]);
  const paneH = 1.15;
  const py = 2.3 + paneH / 2;
  const panes = [
    add({ mat: 'glass', size: [2.2, paneH, 0.14], p: [0, py, 1.03], part: 'glass' }),
    add({ mat: 'glass', size: [2.2, paneH, 0.14], p: [0, py, -1.03], part: 'glass' }),
    add({ mat: 'glass', size: [0.14, paneH, 1.9], p: [1.03, py, 0], part: 'glass' }),
    add({ mat: 'glass', size: [0.14, paneH, 1.9], p: [-1.03, py, 0], part: 'glass' }),
  ];
  for (const i of panes) joints.push([plate, i]);
  const roof = add({ mat: 'wood', size: [2.5, 0.22, 2.5], p: [0, 2.3 + paneH + 0.11, 0], part: 'roof' });
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
