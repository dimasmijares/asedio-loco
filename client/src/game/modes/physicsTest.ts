import * as THREE from 'three';
import type { BlockDef } from '../../../../shared/castle';
import type { Game, Mode } from '../game';
import { RAPIER } from '../sim/rapier';
import { buildScene, type PhysicsResult, type Scene, type SceneName } from '../sim/scenes';

export type { PhysicsResult, SceneName };

// Escenas de prueba de física (sección 5.7) en el navegador. Se cargan con #physics=<escena>.
// `ready` → la prueba hace una captura "antes" → run() → espera `done` → captura "después".
// Las mismas escenas se ejecutan sin navegador en tests/unit/physics.test.ts.
export class PhysicsTestMode implements Mode {
  phase: 'ready' | 'running' | 'done' = 'ready';
  result: PhysicsResult | null = null;
  private t0 = 0;
  private nextId = 1;
  private check: ((t: number) => PhysicsResult | null) | null = null;
  private sceneDef: Scene;

  constructor(readonly game: Game, readonly scene: SceneName) {
    game.startSim([]);
    game.mode = this;
    game.view.buildCastles();
    const sim = game.sim!;
    this.sceneDef = buildScene(scene, {
      sim,
      block: (mat, size, p, fixed = false) => {
        const def: BlockDef = { id: this.nextId++, slot: 0, mat, size, p, q: [0, 0, 0, 1], part: 'wall' };
        const r = sim.addBlock(def, true);
        if (fixed) r.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
        game.view.addBlock(def.id, mat, size, p, [0, 0, 0, 1]);
        return r;
      },
      settled: () => game.syncAllFromSim(),
      debrisCount: () => game.view.debris.count,
    });
    const { target, from } = this.sceneDef.camera;
    game.rig.watch(new THREE.Vector3(...target), new THREE.Vector3(...from));
    game.rig.snap();
  }

  run() {
    this.check = this.sceneDef.run();
    this.t0 = this.game.sim!.time;
    this.phase = 'running';
  }

  update() {
    if (this.phase !== 'running' || !this.check) return;
    // Tiempo de simulación (en equipos lentos la física va más despacio que el reloj).
    const r = this.check(this.game.sim!.time - this.t0);
    if (r) {
      this.result = r;
      this.phase = 'done';
    }
  }
}
