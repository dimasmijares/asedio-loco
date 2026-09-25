import { AMMO } from '../../../../shared/ammo';
import type { MaterialId } from '../../../../shared/materials';
import type { Vec3 } from '../../../../shared/math';
import type { Rec, Sim } from './sim';

export type SceneName = 'ccd' | 'tower' | 'glass' | 'fragments';
export const SCENE_NAMES: SceneName[] = ['ccd', 'tower', 'glass', 'fragments'];

export interface PhysicsResult {
  ok: boolean;
  detail: Record<string, unknown>;
}

// Lo que una escena necesita de quien la ejecuta: el navegador (#physics=<escena>) o Vitest.
export interface SceneHost {
  sim: Sim;
  block(mat: MaterialId, size: Vec3, p: Vec3, fixed?: boolean): Rec;
  // Tras un settle(): el navegador copia las poses a la vista.
  settled(): void;
  debrisCount(): number;
}

export interface Scene {
  camera: { target: Vec3; from: Vec3 };
  // Lanza el impacto y devuelve la comprobación, que se llama con el tiempo de simulación
  // transcurrido hasta que da un resultado.
  run(): (t: number) => PhysicsResult | null;
}

// Escenas de prueba de física (sección 5.7).
export function buildScene(name: SceneName, h: SceneHost): Scene {
  const sim = h.sim;
  switch (name) {
    case 'ccd': {
      // Muro de hierro fijo de 8 cm y un pedrusco a 140 m/s: sin CCD lo atravesaría (2,3 m por paso).
      // Sin roturas: se mide solo la detección continua de colisiones.
      const wall = h.block('iron', [0.08, 3, 4], [0, 1.5, 0], true);
      sim.breaking = false;
      return {
        camera: { target: [0, 1.5, 0], from: [-6, 5, 9] },
        run() {
          const id = sim.spawnProjectile(AMMO.rock, 0, [-12, 1.5, 0], [140, 0, 0], { behavior: {} });
          let maxX = -99;
          return (t) => {
            const r = sim.recs.get(id);
            if (r) maxX = Math.max(maxX, r.body.translation().x);
            if (t < 1.5) return null;
            const wallAlive = sim.recs.has(wall.id);
            return { ok: wallAlive && maxX < 0.1, detail: { maxX, wallX: 0, wallAlive } };
          };
        },
      };
    }
    case 'tower': {
      // Torre de 5 bloques sobre una base de piedra. Se quita la base y lo de arriba debe caer.
      const base = h.block('stone', [1.2, 1.5, 1.2], [0, 0.75, 0]);
      const tops: Rec[] = [];
      for (let i = 0; i < 5; i++) tops.push(h.block(i % 2 ? 'wood' : 'stone', [1, 1, 1], [0, 2 + i, 0]));
      sim.settle(0.6);
      h.settled();
      return {
        camera: { target: [0, 3, 0], from: [7, 5, 9] },
        run() {
          const y0 = tops[4].body.translation().y;
          sim.removeRec(base, 'frac');
          return (t) => {
            if (t < 2.5) return null;
            const y1 = sim.recs.get(tops[4].id)?.body.translation().y ?? -99;
            return { ok: y1 < y0 - 0.8, detail: { y0, y1 } };
          };
        },
      };
    }
    case 'glass': {
      // Mismo impacto sobre un bloque de cristal y otro de piedra: el cristal se rompe, la piedra no.
      const glass = h.block('glass', [1, 1, 1], [-2, 0.5, 0]);
      const stone = h.block('stone', [1, 1, 1], [2, 0.5, 0]);
      sim.settle(0.4);
      h.settled();
      const ball = { ...AMMO.rock, radius: 0.28, density: 3 };
      return {
        camera: { target: [0, 0.8, 0], from: [5.5, 4, 7] },
        run() {
          for (const x of [-2, 2]) sim.spawnProjectile(ball, 0, [x, 0.8, 3], [0, 1.2, -12], { behavior: {} });
          return (t) => {
            if (t < 1.5) return null;
            const g = sim.recs.has(glass.id);
            const s = sim.recs.has(stone.id);
            return { ok: !g && s, detail: { glassAlive: g, stoneAlive: s } };
          };
        },
      };
    }
    case 'fragments': {
      // Un bloque de madera roto genera fragmentos que al rato se retiran.
      const wood = h.block('wood', [1, 1, 1], [0, 0.5, 0]);
      sim.settle(0.4);
      h.settled();
      return {
        camera: { target: [0, 1, 0], from: [4, 4, 7] },
        run() {
          sim.spawnProjectile(AMMO.rock, 0, [0, 0.6, 6], [0, 0, -18], { behavior: {} });
          let maxFrag = 0;
          return (t) => {
            maxFrag = Math.max(maxFrag, h.debrisCount());
            if (t < 7) return null;
            const left = h.debrisCount();
            return { ok: !sim.recs.has(wood.id) && maxFrag > 0 && left === 0, detail: { maxFrag, fragmentsAtEnd: left, woodAlive: sim.recs.has(wood.id) } };
          };
        },
      };
    }
  }
}
