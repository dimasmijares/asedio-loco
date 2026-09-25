import * as THREE from 'three';
import type { CameraRig } from './camera';
import type { ProjView, WorldView } from './view';

interface Track {
  id: number;
  maxSpeed: number;
  last: THREE.Vector3;
  impacted: boolean;
  impactAt: THREE.Vector3 | null;
  from: THREE.Vector3; // punto de lanzamiento
  born: number;
  acc: number; // tiempo desde la última vez que se movió
  ema: number; // velocidad suavizada
  slow: number; // lecturas lentas seguidas
}

// Dirección de cámara durante los impactos: sigue el proyectil más interesante y,
// cuando pega, enseña el destrozo desde un ángulo elevado.
export class Director {
  tracks = new Map<number, Track>();
  private t = 0;
  private watchUntil = 0;
  private watchAt = new THREE.Vector3();
  private watchFrom = new THREE.Vector3();
  focus: number | null = null;

  constructor(readonly view: WorldView, readonly rig: CameraRig) {}

  reset() {
    this.tracks.clear();
    this.focus = null;
    this.watchUntil = 0;
  }

  get busy() {
    return this.t < this.watchUntil || [...this.tracks.values()].some((t) => !t.impacted && this.view.projs.has(t.id));
  }

  // Foco prioritario (p. ej. un rey cayendo): se mira eso durante `dur` segundos.
  private spotUntil = 0;
  private spotGetter: (() => THREE.Vector3 | null) | null = null;
  spotlight(getter: () => THREE.Vector3 | null, dur = 2.5) {
    this.spotGetter = getter;
    this.spotUntil = this.t + dur;
    const p = getter();
    if (p) {
      const from = this.rig.pos.clone().sub(p).setY(0).normalize().multiplyScalar(9).add(p).add(new THREE.Vector3(0, 5, 0));
      this.rig.watch(p.clone(), from);
      this.rig.sharpness = 3.5;
    }
  }

  get spotActive() {
    return this.t < this.spotUntil;
  }

  // Devuelve true si ha tomado el control de la cámara.
  update(dt: number): boolean {
    this.t += dt;
    if (this.t < this.spotUntil && this.spotGetter) {
      const p = this.spotGetter();
      if (p) {
        const from = this.rig.pos.clone().sub(p).setY(0).normalize().multiplyScalar(9).add(p).add(new THREE.Vector3(0, 5, 0));
        this.rig.watch(p.clone().add(new THREE.Vector3(0, 0.5, 0)), from);
        this.rig.sharpness = 3.5;
        for (const pr of this.view.projs.values()) this.observe(pr, dt);
        return true;
      }
    }
    for (const pr of this.view.projs.values()) this.observe(pr, dt);
    for (const [id, tr] of this.tracks) if (!this.view.projs.has(id) && !tr.impacted) this.impact(tr, tr.last);

    // Proyectil en vuelo más antiguo (salen escalonados, así se ven todos).
    const flying = [...this.tracks.values()].filter((t) => !t.impacted && this.view.projs.has(t.id)).sort((a, b) => a.born - b.born);
    if (flying.length) {
      const tr = flying[0];
      const pr = this.view.projs.get(tr.id)!;
      if (this.focus !== tr.id) {
        this.focus = tr.id;
        const dir = pr.p.clone().sub(tr.from).setY(0);
        this.rig.follow(() => pr.p, dir.lengthSq() > 0.01 ? dir : undefined);
      }
      return true;
    }
    this.focus = null;
    if (this.t < this.watchUntil) {
      this.rig.watch(this.watchAt, this.watchFrom);
      return true;
    }
    return false;
  }

  private observe(pr: ProjView, dt: number) {
    let tr = this.tracks.get(pr.id);
    if (!tr) {
      tr = { id: pr.id, maxSpeed: 0, last: pr.p.clone(), impacted: false, impactAt: null, from: pr.p.clone(), born: this.t, acc: 0, slow: 0, ema: -1 };
      this.tracks.set(pr.id, tr);
      return;
    }
    // Solo se mide cuando se ha movido (hay fotogramas sin paso de física).
    tr.acc += dt;
    const d = pr.p.distanceTo(tr.last);
    if (d < 1e-4 && tr.acc < 0.25) return;
    const speed = d / tr.acc;
    tr.acc = 0;
    tr.last.copy(pr.p);
    if (tr.impacted) return;
    tr.ema = tr.ema < 0 ? speed : tr.ema + (speed - tr.ema) * 0.35;
    tr.maxSpeed = Math.max(tr.maxSpeed, tr.ema);
    // Impacto: frena de golpe tras haber volado un rato.
    tr.slow = tr.ema < tr.maxSpeed * 0.45 ? tr.slow + 1 : 0;
    if (this.t - tr.born > 0.35 && tr.maxSpeed > 5 && tr.slow >= 3) this.impact(tr, pr.p);
  }

  private impact(tr: Track, at: THREE.Vector3) {
    tr.impacted = true;
    tr.impactAt = at.clone();
    // Se mira el golpe desde el lado del tirador, elevado.
    const back = tr.from.clone().sub(at).setY(0).normalize();
    this.watchAt.copy(at).setY(Math.max(1.5, at.y));
    this.watchFrom.copy(at).addScaledVector(back, 13).add(new THREE.Vector3(back.z * 4, 9, -back.x * 4));
    this.watchUntil = this.t + 2.4;
  }
}
