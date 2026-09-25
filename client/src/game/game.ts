import * as THREE from 'three';
import type { Quat, Vec3 } from '../../../shared/math';
import { TrajectoryPreview, AimInput } from './aim';
import { CameraRig } from './camera';
import { Stage, type Quality } from './render/stage';
import { loadRapier } from './sim/rapier';
import { DT, Sim, type SimEvent } from './sim/sim';
import { WorldView } from './view';

export interface Mode {
  update(dt: number): void;
  onSimEvents?(events: SimEvent[]): void;
  dispose?(): void;
}

const QUALITY_KEY = 'asedio.quality';

export function savedQuality(): Quality {
  try {
    const q = localStorage.getItem(QUALITY_KEY) as Quality | null;
    if (q === 'low' || q === 'medium' || q === 'high') return q;
  } catch {
    /* sin almacenamiento */
  }
  const url = new URLSearchParams(location.search).get('quality') as Quality | null;
  return url ?? 'medium';
}

export function saveQuality(q: Quality) {
  try {
    localStorage.setItem(QUALITY_KEY, q);
  } catch {
    /* sin almacenamiento */
  }
}

// Núcleo común: escenario, vista, cámara, entrada y (si somos autoridad) la simulación.
export class Game {
  stage: Stage;
  view: WorldView;
  rig: CameraRig;
  input: AimInput;
  preview: TrajectoryPreview;
  sim: Sim | null = null;
  mode: Mode | null = null;
  timeScale = 1;
  simPaused = false;
  fps = 0;
  frameMs = 0;
  private acc = 0;
  private last = performance.now();
  private frames = 0;
  private fpsT = 0;
  private raf = 0;
  private awake = new Set<number>();
  private stopped = false;

  static async create(canvas: HTMLCanvasElement, slots: number[], quality = savedQuality()) {
    await loadRapier();
    return new Game(canvas, slots, quality);
  }

  private constructor(readonly canvas: HTMLCanvasElement, public slots: number[], quality: Quality) {
    this.stage = new Stage(canvas, quality);
    this.view = new WorldView(this.stage, slots);
    this.rig = new CameraRig(this.stage.camera, canvas);
    this.input = new AimInput(canvas);
    this.preview = new TrajectoryPreview(this.stage.scene);
    this.preview.hide();
    canvas.addEventListener(
      'wheel',
      (e) => {
        if (!this.input.enabled) this.rig.zoom(Math.sign(e.deltaY) * 0.08);
      },
      { passive: true },
    );
    window.addEventListener('resize', () => this.stage.resize());
    this.rig.orbit(new THREE.Vector3(0, 2, 0), 62, 34, 0.06);
    this.rig.snap();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // Crea una simulación nueva (el anfitrión o el modo solitario).
  // Adopta una simulación ya construida (migración de anfitrión).
  adoptSim(sim: Sim) {
    this.sim?.free();
    this.sim = sim;
    this.awake.clear();
    this.acc = 0;
  }

  setLavaVisual(y: number) {
    this.stage.lavaTarget = y;
    this.view.lavaY = y;
  }

  startSim(slots = this.slots) {
    this.sim?.free();
    this.slots = slots;
    this.sim = new Sim(slots);
    this.sim.settle();
    this.view.slots.splice(0, this.view.slots.length, ...slots);
    this.view.buildCastles();
    this.syncAllFromSim();
    this.sim.drainEvents();
    return this.sim;
  }

  syncAllFromSim() {
    if (!this.sim) return;
    for (const r of this.sim.recs.values()) {
      const t = r.body.translation();
      const q = r.body.rotation();
      this.view.setBody(r.id, [t.x, t.y, t.z], [q.x, q.y, q.z, q.w]);
    }
  }

  // Cuerpos que se han movido este fotograma (los dormidos no cambian).
  private syncFromSim(onBody?: (id: number, p: Vec3, q: Quat) => void) {
    const sim = this.sim!;
    const now = new Set<number>();
    for (const r of sim.recs.values()) {
      const sleeping = r.body.isSleeping();
      if (sleeping && !this.awake.has(r.id)) continue;
      if (!sleeping) now.add(r.id);
      const t = r.body.translation();
      const q = r.body.rotation();
      const p: Vec3 = [t.x, t.y, t.z];
      const qq: Quat = [q.x, q.y, q.z, q.w];
      this.view.setBody(r.id, p, qq);
      onBody?.(r.id, p, qq);
    }
    this.awake = now;
  }

  onBodyMoved: ((id: number, p: Vec3, q: Quat) => void) | undefined;

  private loop(now: number) {
    if (this.stopped) return;
    this.raf = requestAnimationFrame(this.loop);
    const t0 = performance.now();
    const rawDt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const dt = rawDt * this.timeScale;
    this.frames++;
    this.fpsT += rawDt;
    if (this.fpsT >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsT);
      this.frames = 0;
      this.fpsT = 0;
    }
    this.input.tick(rawDt);
    if (this.sim && !this.simPaused) {
      this.acc += dt;
      let steps = 0;
      // Paso fijo; como mucho 4 por fotograma para no entrar en espiral en equipos lentos.
      while (this.acc >= DT && steps < 4) {
        this.sim.step();
        this.acc -= DT;
        steps++;
      }
      if (steps === 4) this.acc = 0;
      const events = this.sim.drainEvents();
      for (const e of events) this.view.apply(e);
      if (events.length) this.mode?.onSimEvents?.(events);
      this.syncFromSim(this.onBodyMoved);
      this.view.lavaY = this.sim.lavaY;
    }
    this.mode?.update(rawDt);
    this.view.update(dt);
    this.rig.shake = Math.max(this.rig.shake, this.view.shake);
    this.view.shake = 0;
    this.rig.update(rawDt);
    this.stage.update(rawDt);
    this.stage.render();
    this.frameMs = performance.now() - t0;
  }

  dispose() {
    this.stopped = true;
    cancelAnimationFrame(this.raf);
    this.mode?.dispose?.();
    this.mode = null;
    // Los escuchadores de teclado y ratón siguen vivos: se desactivan para que no actúen.
    this.input.enabled = false;
    this.input.onChange = this.input.onRelease = () => {};
    this.input.onConfirm = () => {};
    this.sim?.free();
    this.sim = null;
    this.stage.renderer.dispose();
  }
}
