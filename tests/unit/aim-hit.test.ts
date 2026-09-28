import * as THREE from 'three';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { AMMO } from '../../shared/ammo';
import { firstHit, launchVelocity, solveAim, trajectory, type HitBox } from '../../shared/ballistics';
import { buildCastle } from '../../shared/castle';
import { launchPoint, toWorld } from '../../shared/map';
import type { Vec3 } from '../../shared/math';
import { loadRapier } from '../../client/src/game/sim/rapier';
import { DT, Sim } from '../../client/src/game/sim/sim';

vi.mock('../../client/src/game/render/blocks', () => ({ blockMaterial: () => new THREE.MeshBasicMaterial() }));

// WRK-TASK-054: la marca de impacto de la vista previa cae donde el proyectil toca de verdad.
describe('parábola hasta el choque', () => {
  beforeAll(() => loadRapier());

  const castle = buildCastle(1);
  const targets: [string, Vec3][] = [
    ['rey', castle.kingPos],
    ['muralla', toWorld(1, [0, 2.5 * 1.2, 3.25 * 1.2 + 0.6])],
    ['torre', toWorld(1, [3.25 * 1.2, 4 * 1.2, 3.25 * 1.2])],
    ['suelo', toWorld(1, [0, 0, 9])],
  ];
  for (const pitch of [0.45, 0.75, 1.05])
    for (const [name, target] of targets)
      test(`${name}, elevación ${pitch}`, () => {
        const sim = new Sim([0, 1]);
        sim.settle();
        const a = AMMO.rock;
        const from = launchPoint(0);
        const aim = solveAim(from, target, pitch, { drag: a.drag, windFactor: a.windFactor, wind: [0, 0, 0] });
        expect(aim).not.toBeNull();
        const boxes: HitBox[] = [];
        for (const r of sim.recs.values()) {
          if (r.kind !== 'block') continue;
          const q = r.body.rotation();
          boxes.push({ p: sim.pos(r), q: [q.x, q.y, q.z, q.w], size: r.size });
        }
        const pts = trajectory(from, launchVelocity(aim!), { drag: a.drag, windFactor: a.windFactor, wind: [0, 0, 0], dt: 1 / 60, stopY: -1 });
        const hit = firstHit(pts, boxes, () => 0, a.radius);
        expect(hit).not.toBeNull();
        let real: Vec3 | null = null;
        sim.spawnProjectile(a, 0, from, launchVelocity(aim!), {
          behavior: {
            maxLife: 8,
            onContact(r) {
              real ??= sim.pos(r);
            },
            onStep(r) {
              // El suelo de la isla no avisa como contacto de bloque: se toma al bajar a ras.
              if (!real && sim.pos(r)[1] <= a.radius + 0.05) real = sim.pos(r);
            },
          },
        });
        for (let i = 0; i < 6 / DT && !real; i++) sim.step();
        expect(real).not.toBeNull();
        const d = Math.hypot(real![0] - hit!.p[0], real![1] - hit!.p[1], real![2] - hit!.p[2]);
        expect(d).toBeLessThan(1);
      });
});
