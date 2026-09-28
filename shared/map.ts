import { quatFromYaw, v3, type Quat, type Vec3 } from './math';

// Isla: cuadrado redondeado de lado 2*ISLAND_HALF, con la superficie en y = 0.
export const ISLAND_HALF = 34;
export const ISLAND_CORNER_R = 10;
export const CASTLE_OFFSET = 22; // distancia del centro de la isla a cada castillo, por eje
export const CASTLE_HALF = 5.6; // mitad del lado de la zona "dentro del castillo" (con los contrafuertes)
export const CATAPULT_LOCAL: Vec3 = [0, 1.5, 7.4]; // bastión con la catapulta, delante del castillo
export const LAUNCH_HEIGHT = 1.9; // altura del cazo sobre el bastión

// Esquinas: 0 = (-x,-z), 1 = (+x,-z), 2 = (+x,+z), 3 = (-x,+z).
const CORNERS: [number, number][] = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
];

export function castleOrigin(slot: number): Vec3 {
  const [sx, sz] = CORNERS[slot];
  return [sx * CASTLE_OFFSET, 0, sz * CASTLE_OFFSET];
}

// El eje +z local del castillo apunta al centro de la isla.
export function castleYaw(slot: number): number {
  const o = castleOrigin(slot);
  return Math.atan2(-o[0], -o[2]);
}

export function castleQuat(slot: number): Quat {
  return quatFromYaw(castleYaw(slot));
}

export function toWorld(slot: number, local: Vec3): Vec3 {
  return v3.add(castleOrigin(slot), v3.rotY(local, castleYaw(slot)));
}

export function toLocal(slot: number, world: Vec3): Vec3 {
  return v3.rotY(v3.sub(world, castleOrigin(slot)), -castleYaw(slot));
}

export function insideCastle(slot: number, world: Vec3, margin = 0): boolean {
  const l = toLocal(slot, world);
  return Math.abs(l[0]) < CASTLE_HALF + margin && Math.abs(l[2]) < CASTLE_HALF + margin;
}

export function launchPoint(slot: number): Vec3 {
  const c = toWorld(slot, CATAPULT_LOCAL);
  return [c[0], c[1] + LAUNCH_HEIGHT, c[2]];
}

// Distancia con signo al borde de la isla (negativa dentro).
export function islandSdf(x: number, z: number): number {
  const r = ISLAND_CORNER_R;
  const qx = Math.abs(x) - (ISLAND_HALF - r);
  const qz = Math.abs(z) - (ISLAND_HALF - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - r;
}

// Alturas del mar de lava por ronda (WRK-TASK-057): sube un poco al empezar cada ronda y se queda
// quieta el resto. Mismo ritmo medio que cuando subía 1,3 m cada 3 rondas: toca la isla en la
// ronda 10 (0,4 m) y se come una hilera (1,2 m) cada 3 rondas, hasta el tope de 5,2 m.
export const LAVA_START = -3.6;
export const LAVA_STEP = 0.444; // m por ronda
export const LAVA_TOP = 5.2;
export const LAVA_LEVELS = Array.from({ length: Math.ceil((LAVA_TOP - LAVA_START) / LAVA_STEP) + 1 }, (_, i) => Math.min(LAVA_TOP, +(LAVA_START + i * LAVA_STEP).toFixed(3)));
export const LAVA_FAST_STEPS = 3; // con ?fast=1 sube el triple por ronda
export const WIND_FROM_ROUND = 6;
