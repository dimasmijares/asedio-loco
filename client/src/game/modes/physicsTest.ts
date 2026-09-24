import * as THREE from 'three';
import { AMMO } from '../../../../shared/ammo';
import type { BlockDef } from '../../../../shared/castle';
import type { MaterialId } from '../../../../shared/materials';
import type { Vec3 } from '../../../../shared/math';
import type { Game, Mode } from '../game';
import { RAPIER } from '../sim/rapier';
import type { Rec, SimEvent } from '../sim/sim';

export type SceneName = 'ccd' | 'tower' | 'glass' | 'fragments';

export interface PhysicsResult {
  ok: boolean;
  detail: Record<string, unknown>;
}

// Escenas de prueba de física (sección 5.7). Se cargan con #physics=<escena>.
// `ready` → la prueba hace una captura "antes" → run() → espera `done` → captura "después".
export class PhysicsTestMode implements Mode {
  phase: 'ready' | 'running' | 'done' = 'ready';
  result: PhysicsResult | null = null;
  private t0 = 0;
  private nextId = 1;
  private check: ((t: number) => PhysicsResult | null) | null = null;
  private events: SimEvent[] = [];

  constructor(readonly game: Game, readonly scene: SceneName) {
    game.startSim([]);
    game.mode = this;
    game.view.buildCastles();
    this.setup();
  }

  private block(mat: MaterialId, size: Vec3, p: Vec3, fixed = false): Rec {
    const def: BlockDef = { id: this.nextId++, slot: 0, mat, size, p, q: [0, 0, 0, 1], part: 'wall' };
    const sim = this.game.sim!;
    const r = sim.addBlock(def, true);
    if (fixed) r.body.setBodyType(RAPIER.RigidBodyType.Fixed, true);
    this.game.view.addBlock(def.id, mat, size, p, [0, 0, 0, 1]);
    return r;
  }

  private camera(target: Vec3, from: Vec3) {
    this.game.rig.watch(new THREE.Vector3(...target), new THREE.Vector3(...from));
    this.game.rig.snap();
  }

  private setup() {
    const sim = this.game.sim!;
    switch (this.scene) {
      case 'ccd': {
        // Muro de hierro fijo de 8 cm y un pedrusco a 140 m/s: sin CCD lo atravesaría (2,3 m por paso).
        // Sin roturas: se mide solo la detección continua de colisiones.
        const wall = this.block('iron', [0.08, 3, 4], [0, 1.5, 0], true);
        sim.breaking = false;
        this.camera([0, 1.5, 0], [-6, 5, 9]);
        this.run = () => {
          const id = sim.spawnProjectile(AMMO.rock, 0, [-12, 1.5, 0], [140, 0, 0], { behavior: {} });
          let maxX = -99;
          this.check = (t) => {
            const r = sim.recs.get(id);
            if (r) maxX = Math.max(maxX, r.body.translation().x);
            if (t < 1.5) return null;
            const wallAlive = sim.recs.has(wall.id);
            return { ok: wallAlive && maxX < 0.1, detail: { maxX, wallX: 0, wallAlive } };
          };
          this.start();
        };
        break;
      }
      case 'tower': {
        // Torre de 5 bloques sobre una base de piedra. Se quita la base y lo de arriba debe caer.
        const base = this.block('stone', [1.2, 1.5, 1.2], [0, 0.75, 0]);
        const tops: Rec[] = [];
        for (let i = 0; i < 5; i++) tops.push(this.block(i % 2 ? 'wood' : 'stone', [1, 1, 1], [0, 2 + i, 0]));
        sim.settle(0.6);
        this.game.syncAllFromSim();
        this.camera([0, 3, 0], [7, 5, 9]);
        this.run = () => {
          const y0 = tops[4].body.translation().y;
          sim.removeRec(base, 'frac');
          this.check = (t) => {
            if (t < 2.5) return null;
            const y1 = sim.recs.get(tops[4].id)?.body.translation().y ?? -99;
            return { ok: y1 < y0 - 0.8, detail: { y0, y1 } };
          };
          this.start();
        };
        break;
      }
      case 'glass': {
        // Mismo impacto sobre un bloque de cristal y otro de piedra: el cristal se rompe, la piedra no.
        const glass = this.block('glass', [1, 1, 1], [-2, 0.5, 0]);
        const stone = this.block('stone', [1, 1, 1], [2, 0.5, 0]);
        sim.settle(0.4);
        this.game.syncAllFromSim();
        this.camera([0, 0.8, 0], [5.5, 4, 7]);
        const ball = { ...AMMO.rock, radius: 0.28, density: 3 };
        this.run = () => {
          for (const x of [-2, 2]) sim.spawnProjectile(ball, 0, [x, 0.8, 3], [0, 1.2, -12], { behavior: {} });
          this.check = (t) => {
            if (t < 1.5) return null;
            const g = sim.recs.has(glass.id);
            const s = sim.recs.has(stone.id);
            return { ok: !g && s, detail: { glassAlive: g, stoneAlive: s } };
          };
          this.start();
        };
        break;
      }
      case 'fragments': {
        // Un bloque de madera roto genera fragmentos que al rato se retiran.
        const wood = this.block('wood', [1, 1, 1], [0, 0.5, 0]);
        sim.settle(0.4);
        this.game.syncAllFromSim();
        this.camera([0, 1, 0], [4, 4, 7]);
        this.run = () => {
          sim.spawnProjectile(AMMO.rock, 0, [0, 0.6, 6], [0, 0, -18], { behavior: {} });
          let maxFrag = 0;
          this.check = (t) => {
            maxFrag = Math.max(maxFrag, this.game.view.debris.count);
            if (t < 7) return null;
            return { ok: !sim.recs.has(wood.id) && maxFrag > 0 && this.game.view.debris.count === 0, detail: { maxFrag, fragmentsAtEnd: this.game.view.debris.count, woodAlive: sim.recs.has(wood.id) } };
          };
          this.start();
        };
        break;
      }
    }
  }

  run: () => void = () => {};

  private start() {
    this.t0 = this.game.sim!.time;
    this.phase = 'running';
  }

  // Para las capturas "después": el momento justo tras el impacto.
  snapshotMoment = 0.35;

  onSimEvents(events: SimEvent[]) {
    this.events.push(...events);
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
