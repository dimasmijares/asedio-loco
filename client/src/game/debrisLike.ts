// Lo que la vista necesita de los fragmentos (`sim/debris.ts`), sin importar Rapier: así la
// portada puede dibujar la isla sin descargar el motor de física (WRK-TASK-016). El juego le
// pasa los fragmentos de verdad; el fondo de la portada, `NoDebris`.
import type * as THREE from 'three';
import type { MaterialId } from '../../../shared/materials';
import type { Quat, Vec3 } from '../../../shared/math';

// Tope de fragmentos por calidad (D-009, D-046).
export const DEBRIS_CAP = { low: 90, medium: 170, high: 260 } as const;

export interface DebrisLike {
  lavaY: number;
  maxPieces: number;
  readonly count: number;
  setMax(n: number): void;
  clear(): void;
  addProxy(id: number, size: Vec3, p: Vec3, q: Quat): void;
  moveProxy(id: number, p: Vec3, q: Quat): void;
  removeProxy(id: number): void;
  burst(mat: MaterialId, size: Vec3, p: Vec3, q: Quat, v: Vec3, seed: number): void;
  step(dt: number): void;
}

export type MakeDebris = (parent: THREE.Object3D, maxPieces: number, shadows: boolean) => DebrisLike;

// Sin fragmentos: para el fondo de la portada, que no rompe nada.
export class NoDebris implements DebrisLike {
  lavaY = -3.6;
  maxPieces = 0;
  readonly count = 0;
  setMax() {}
  clear() {}
  addProxy() {}
  moveProxy() {}
  removeProxy() {}
  burst() {}
  step() {}
}
