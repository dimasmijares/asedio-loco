import * as THREE from 'three';
import { beforeAll, expect, test, vi } from 'vitest';
import { loadRapier } from '../../client/src/game/sim/rapier';
import { CONTACT_PREDICTION, DT, SOLVER_ITERATIONS, Sim } from '../../client/src/game/sim/sim';

vi.mock('../../client/src/game/render/blocks', () => ({ blockMaterial: () => new THREE.MeshBasicMaterial() }));

beforeAll(() => loadRapier());

// Con la física más barata de WRK-TASK-052 (4 subpasos y 1 cm de predicción), un castillo con
// todos sus bloques despiertos se queda quieto y se vuelve a dormir sin romperse. Con las torres de
// 7 filas (WRK-TASK-058) las pilas altas tiemblan unos milímetros y Rapier tarda más en dormirlas:
// a los 18 s queda despierto menos del 10 %, y nada se ha movido ni roto.
test('los castillos aguantan en reposo con todos los bloques despiertos', () => {
  const sim = new Sim([0, 1, 2, 3]);
  expect(sim.world.integrationParameters.numSolverIterations).toBe(SOLVER_ITERATIONS);
  expect(sim.world.integrationParameters.normalizedPredictionDistance).toBeCloseTo(CONTACT_PREDICTION, 5);
  sim.settle();
  sim.drainEvents();
  const start = new Map<number, THREE.Vector3>();
  for (const r of sim.recs.values()) {
    if (r.kind !== 'block') continue;
    const t = r.body.translation();
    start.set(r.id, new THREE.Vector3(t.x, t.y, t.z));
    r.body.wakeUp();
  }
  for (let i = 0; i < 18 / DT; i++) sim.step();
  let maxMove = 0;
  let awake = 0;
  for (const r of sim.recs.values()) {
    if (r.kind !== 'block') continue;
    const t = r.body.translation();
    maxMove = Math.max(maxMove, start.get(r.id)!.distanceTo(new THREE.Vector3(t.x, t.y, t.z)));
    if (!r.body.isSleeping()) awake++;
  }
  expect(sim.drainEvents().filter((e) => e.e === 'rm')).toEqual([]);
  expect(maxMove).toBeLessThan(0.02);
  let total = 0;
  for (const r of sim.recs.values()) if (r.kind === 'block') total++;
  expect(awake).toBeLessThan(total * 0.1);
  sim.free();
}, 60_000);
