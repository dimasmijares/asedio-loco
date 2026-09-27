import * as THREE from 'three';
import { beforeAll, describe, expect, test, vi } from 'vitest';
import { castleOrigin } from '../../shared/map';
import { kingGuarded } from '../../shared/match';
import { kingId } from '../../shared/castle';
import { loadRapier } from '../../client/src/game/sim/rapier';
import { Sim } from '../../client/src/game/sim/sim';

vi.mock('../../client/src/game/render/blocks', () => ({ blockMaterial: () => new THREE.MeshBasicMaterial() }));

// Escudo real (WRK-TASK-041): en las rondas 1 y 2 ningún rey cae y, al acabar la ronda, el que se
// ha salido de su castillo vuelve a su pedestal.
describe('escudo real', () => {
  beforeAll(() => loadRapier());

  test('solo en las rondas 1 y 2, mientras se juega', () => {
    expect(kingGuarded({ round: 0, phase: 'intro' })).toBe(false);
    expect(kingGuarded({ round: 1, phase: 'aim' })).toBe(true);
    expect(kingGuarded({ round: 2, phase: 'results' })).toBe(true);
    expect(kingGuarded({ round: 3, phase: 'aim' })).toBe(false);
    expect(kingGuarded({ round: 2, phase: 'over' })).toBe(false);
  });

  // Saca al rey del castillo, al suelo de la isla, y deja correr 1 s.
  function kickOut(sim: Sim) {
    const r = sim.recs.get(kingId(0))!;
    const o = castleOrigin(0);
    const out = new THREE.Vector3(-o[0], 0, -o[2]).normalize().multiplyScalar(9).add(new THREE.Vector3(o[0], 0.6, o[2]));
    r.body.setTranslation({ x: out.x, y: out.y, z: out.z }, true);
    const events = [];
    for (let i = 0; i < 60; i++) {
      sim.step();
      events.push(...sim.drainEvents());
    }
    return events;
  }

  test('con escudo el rey no cae, se avisa una vez y vuelve al pedestal', () => {
    const sim = new Sim([0, 1]);
    sim.settle();
    sim.drainEvents();
    const home = sim.recs.get(kingId(0))!.body.translation();
    sim.kingGuard = true;
    const events = kickOut(sim);
    expect(sim.kings.get(0)!.alive).toBe(true);
    expect(events.filter((e) => e.e === 'king')).toEqual([]);
    expect(events.filter((e) => e.e === 'fx' && e.kind === 'kingGuard')).toHaveLength(1);
    sim.restoreKings();
    const p = sim.recs.get(kingId(0))!.body.translation();
    expect(Math.hypot(p.x - home.x, p.z - home.z)).toBeLessThan(0.1);
    expect(sim.drainEvents().some((e) => e.e === 'fx' && e.kind === 'kingHome')).toBe(true);
  });

  test('sin escudo el mismo rey cae fuera del castillo', () => {
    const sim = new Sim([0, 1]);
    sim.settle();
    sim.drainEvents();
    const events = kickOut(sim);
    expect(sim.kings.get(0)!.alive).toBe(false);
    expect(events.find((e) => e.e === 'king')).toMatchObject({ slot: 0, cause: 'outside' });
  });
});
