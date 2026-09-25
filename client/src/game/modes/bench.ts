import * as THREE from 'three';
import { AMMO, type AmmoId } from '../../../../shared/ammo';
import { solveAim } from '../../../../shared/ballistics';
import { buildCastle } from '../../../../shared/castle';
import { launchPoint } from '../../../../shared/map';
import type { Game, Mode } from '../game';

// Escena de rendimiento (sección 5.8): los 4 castillos enteros y una lluvia de proyectiles
// cruzados a la vez. Mide fps medios, el peor 5 % y el coste de la física por fotograma.
export class BenchMode implements Mode {
  phase: 'warmup' | 'running' | 'done' = 'warmup';
  result: Record<string, number | string> | null = null;
  private t = 0;
  private t0 = 0;
  private last = performance.now();
  private frames: number[] = [];
  private simMs: number[] = [];
  private maxBodies = 0;
  private maxDebris = 0;
  private maxFx = 0;
  private cpuMs: number[] = [];
  private stepMs: number[] = [];
  private maxCalls = 0;
  private maxTris = 0;

  constructor(readonly game: Game) {
    game.startSim([0, 1, 2, 3]);
    this.t0 = game.sim!.time;
    game.mode = this;
    game.rig.orbit(new THREE.Vector3(0, 2, 0), 55, 30, 0.1);
    game.rig.snap();
  }

  private barrage() {
    const sim = this.game.sim!;
    const ammo: AmmoId[] = ['cow', 'rock', 'blackhole', 'piano', 'melon', 'log', 'magnet', 'coconuts', 'cow', 'snowball', 'rock', 'chicken'];
    let i = 0;
    for (const from of [0, 1, 2, 3]) {
      for (const to of [0, 1, 2, 3]) {
        if (to === from) continue;
        const a = ammo[i++ % ammo.length];
        const k = buildCastle(to).kingPos;
        const aim = solveAim(launchPoint(from), [k[0], k[1] - 0.8, k[2]], 0.75, { drag: AMMO[a].drag || 0.004, windFactor: AMMO[a].windFactor, wind: [0, 0, 0] });
        if (aim) sim.later(i * 0.12, () => sim.launch(from, a, aim));
      }
    }
  }

  update() {
    const g = this.game;
    // La duración se cuenta en tiempo de simulación (la lluvia de proyectiles tiene que caer
    // aunque el equipo vaya a 4 fps) y los fotogramas en tiempo real, sin el tope de 0,1 s
    // del bucle.
    const now = performance.now();
    const dt = (now - this.last) / 1000;
    this.last = now;
    this.t = g.sim!.time - this.t0;
    if (this.phase === 'warmup' && this.t > 1.5) {
      this.phase = 'running';
      this.t0 = g.sim!.time;
      this.t = 0;
      this.barrage();
    }
    if (this.phase !== 'running') return;
    this.frames.push(dt);
    this.simMs.push(g.simMs);
    if (g.lastSteps > 0) this.stepMs.push(g.simMs / g.lastSteps);
    this.cpuMs.push(g.frameMs);
    const info = g.stage.renderer.info.render;
    this.maxCalls = Math.max(this.maxCalls, info.calls);
    this.maxTris = Math.max(this.maxTris, info.triangles);
    let awake = 0;
    for (const r of g.sim!.recs.values()) if (!r.body.isSleeping()) awake++;
    this.maxBodies = Math.max(this.maxBodies, awake);
    this.maxDebris = Math.max(this.maxDebris, g.view.debris.count);
    this.maxFx = Math.max(this.maxFx, g.view.fx.count);
    if (this.t > 9) {
      const sorted = [...this.frames].sort((a, b) => b - a);
      const avg = this.frames.reduce((s, x) => s + x, 0) / this.frames.length;
      const p95 = sorted[Math.floor(sorted.length * 0.05)] ?? avg;
      const simAvg = this.simMs.reduce((s, x) => s + x, 0) / this.simMs.length;
      const gl = g.stage.renderer.getContext();
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      this.result = {
        fpsAvg: Math.round(1 / avg),
        fpsWorst5: Math.round(1 / p95),
        simMsAvg: Math.round(simAvg * 100) / 100,
        simMsMax: Math.round(Math.max(...this.simMs) * 100) / 100,
        stepMsAvg: Math.round((this.stepMs.reduce((a, x) => a + x, 0) / Math.max(1, this.stepMs.length)) * 100) / 100,
        maxAwakeBodies: this.maxBodies,
        maxDebris: this.maxDebris,
        maxParticles: this.maxFx,
        cpuMsAvg: Math.round((this.cpuMs.reduce((s, x) => s + x, 0) / this.cpuMs.length) * 100) / 100,
        drawCallsMax: this.maxCalls,
        trianglesMax: this.maxTris,
        blocksLeft: g.view.blockCount(),
        quality: g.stage.quality,
        renderer: dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '?',
        size: `${innerWidth}x${innerHeight}@${devicePixelRatio}`,
      };
      this.phase = 'done';
    }
  }
}
