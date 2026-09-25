import * as THREE from 'three';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { Debris } from '../../client/src/game/sim/debris';
import { RAPIER, loadRapier } from '../../client/src/game/sim/rapier';
import { buildScene, SCENE_NAMES } from '../../client/src/game/sim/scenes';
import { DT, Sim } from '../../client/src/game/sim/sim';

// Los materiales de los fragmentos usan texturas dibujadas en un <canvas>; en Node basta uno plano.
vi.mock('../../client/src/game/render/blocks', () => ({ blockMaterial: () => new THREE.MeshBasicMaterial() }));

// Las escenas de física de la sección 5.7 sin navegador: la misma definición que /#physics=<escena>
// (y que tests/e2e/physics.spec.ts, que además guarda las capturas), pero en segundos.
describe('escenas de física', () => {
  beforeAll(() => loadRapier());

  for (const name of SCENE_NAMES) {
    test(name, () => {
      const sim = new Sim([]);
      sim.settle();
      const debris = new Debris(new THREE.Group(), 170, false);
      let nextId = 1;
      const scene = buildScene(name, {
        sim,
        block(mat, size, p, fixed = false) {
          const r = sim.addBlock({ id: nextId++, slot: 0, mat, size, p, q: [0, 0, 0, 1], part: 'wall' }, true);
          if (fixed) r.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
          debris.addProxy(r.id, size, p, [0, 0, 0, 1]);
          return r;
        },
        settled() {},
        debrisCount: () => debris.count,
      });
      sim.drainEvents();
      const check = scene.run();
      const t0 = sim.time;
      let result = null;
      // Como mucho 15 s de simulación.
      for (let i = 0; i < 15 / DT && !result; i++) {
        sim.step();
        for (const e of sim.drainEvents()) {
          if (e.e === 'rm') {
            debris.removeProxy(e.id);
            if (e.why === 'frac') debris.burst(e.mat, e.size, e.p, e.q, e.v, e.seed);
          }
        }
        debris.step(DT);
        result = check(sim.time - t0);
      }
      sim.free();
      expect(result, 'la escena termina').not.toBeNull();
      expect(result!.ok, JSON.stringify(result!.detail)).toBe(true);
    });
  }
});
