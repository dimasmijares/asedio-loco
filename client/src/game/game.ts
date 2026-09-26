import * as THREE from 'three';
import type { Quat, Vec3 } from '../../../shared/math';
import { TrajectoryPreview, AimInput } from './aim';
import { AMMO, AMMO_IDS } from '../../../shared/ammo';
import { sfx } from './audio';
import { makeProjectile } from './render/models';
import { setQualityTarget, settings } from '../ui/settings';
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
  simPaused = false;
  fps = 0;
  frameMs = 0;
  simMs = 0; // coste de la física (pasos + sincronización) en el último fotograma
  lastSteps = 0; // pasos de física del último fotograma
  worstSim = { total: 0, steps: 0, events: 0, sync: 0, n: 0, kinds: '' };
  private acc = 0;
  private last = performance.now();
  private frames = 0;
  private fpsT = 0;
  private raf = 0;
  private awake = new Set<number>();
  private stopped = false;
  // ?render=N: dibuja como mucho N fotogramas por segundo. Sirve para las pruebas con varios
  // clientes en un mismo equipo sin GPU, para que el dibujo no le robe CPU a la física.
  private renderEvery = 1 / Math.max(0.1, Number(new URLSearchParams(location.search).get('render')) || Infinity);
  private renderT = Infinity;

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
    sfx.camera = this.stage.camera;
    this.view.onEvent((e) => sfx.onSimEvent(e));
    this.prewarm();
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        this.rig.zoom(Math.sign(e.deltaY) * 0.08);
      },
      { passive: false },
    );
    document.body.classList.add('in-game');
    // Pellizcar: separar los dedos acerca (como la rueda hacia delante).
    this.input.onPinch = (f) => this.rig.zoom(1 / f - 1);
    window.addEventListener('resize', () => this.stage.resize());
    setQualityTarget((q) => this.stage.setQuality(q));
    this.rig.orbit(new THREE.Vector3(0, 2, 0), 70, 38, 0.06);
    this.rig.snap();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  // Crea una simulación nueva (el anfitrión o el modo solitario).
  // Calidad adaptativa: si va lento de forma sostenida (5 s por debajo de 38 fps), baja un
  // nivel y avisa. No actúa si la calidad se fijó en la URL ni en navegadores automatizados.
  private slowSamples = 0;
  autoQuality = !new URLSearchParams(location.search).has('quality') && !navigator.webdriver;
  onQualityChange: (q: Quality) => void = () => {};
  private adaptQuality() {
    if (!this.autoQuality || document.visibilityState !== 'visible') return;
    this.slowSamples = this.fps < 38 ? this.slowSamples + 1 : Math.max(0, this.slowSamples - 2);
    if (this.slowSamples < 10) return;
    this.slowSamples = 0;
    const q = this.stage.quality;
    const next: Quality | null = q === 'high' ? 'medium' : q === 'medium' ? 'low' : null;
    if (!next) {
      this.autoQuality = false;
      return;
    }
    this.stage.setQuality(next);
    settings.quality = next;
    saveQuality(next);
    this.onQualityChange(next);
  }

  // Crea todas las plantillas de proyectiles y compila sus shaders al arrancar, para que el
  // primer disparo de cada munición no dé un tirón.
  private prewarm() {
    const g = new THREE.Group();
    for (const id of AMMO_IDS) if (AMMO[id].shape !== 'none') g.add(makeProjectile(id));
    g.add(makeProjectile('coconuts', 0.62));
    g.position.set(0, -400, 0);
    this.stage.scene.add(g);
    this.stage.renderer.compile(this.stage.scene, this.stage.camera);
    this.stage.scene.remove(g);
  }

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
    const dt = rawDt;
    this.frames++;
    this.fpsT += rawDt;
    if (this.fpsT >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsT);
      this.frames = 0;
      this.fpsT = 0;
      this.adaptQuality();
    }
    this.input.tick(rawDt);
    const s0 = performance.now();
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
      this.lastSteps = steps;
      const s1 = performance.now();
      const events = this.sim.drainEvents();
      for (const e of events) this.view.apply(e);
      if (events.length) this.mode?.onSimEvents?.(events);
      const s2 = performance.now();
      this.syncFromSim(this.onBodyMoved);
      this.simMs = performance.now() - s0;
      // Registro de tirones para el perfilado (pasos, eventos, sincronización).
      if (this.simMs > this.worstSim.total) this.worstSim = { total: this.simMs, steps: s1 - s0, events: s2 - s1, sync: performance.now() - s2, n: steps, kinds: [...new Set(events.map((e) => (e.e === 'fx' ? `fx:${e.kind}` : e.e)))].join(',') };
      this.view.lavaY = this.sim.lavaY;
    }
    this.mode?.update(rawDt);
    this.view.update(dt);
    this.rig.shake = settings.shake ? Math.max(this.rig.shake, this.view.shake) : 0;
    this.view.shake = 0;
    this.rig.update(rawDt);
    this.stage.update(rawDt);
    this.renderT += rawDt;
    if (this.renderT >= this.renderEvery) {
      this.renderT = 0;
      this.stage.render();
    }
    this.frameMs = performance.now() - t0;
  }

  dispose() {
    this.stopped = true;
    document.body.classList.remove('in-game');
    setQualityTarget(null);
    cancelAnimationFrame(this.raf);
    this.mode?.dispose?.();
    this.mode = null;
    // Los escuchadores de teclado y ratón siguen vivos: se desactivan para que no actúen.
    this.input.enabled = false;
    this.input.onChange = this.input.onFire = () => {};
    this.input.cancelCharge();
    this.sim?.free();
    this.sim = null;
    this.stage.renderer.dispose();
  }
}
