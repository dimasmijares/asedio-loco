import * as THREE from 'three';
import { islandSdf } from '../../../shared/map';
import type { CameraRig } from './camera';
import type { WorldView } from './view';

const HALF_FOV = (55 / 2) * THREE.MathUtils.DEG2RAD;
// Radio del plano general (cuenta atrás y primeros segundos del impacto): caben los 4 castillos.
const MAX_WIDE = 34;

// Dirección de cámara durante los impactos: un plano panorámico que encuadra a la vez todos
// los proyectiles en vuelo y los sitios donde acaban de caer. No persigue a ninguno: el
// encuadre cambia despacio y se acerca solo si la acción está concentrada (p. ej. un disparo).
export class Director {
  private t = 0;
  // Dónde cayó cada proyectil (se mantiene un rato para ver el destrozo).
  private impacts: { p: THREE.Vector3; until: number }[] = [];
  private lastSeen = new Map<number, THREE.Vector3>();
  private dir = new THREE.Vector3(); // dirección horizontal desde la que se mira (fija en la ronda)
  private holdUntil = 0;
  private center = new THREE.Vector3();
  private radius = 0;
  // Castillos en juego durante la cuenta atrás y los primeros segundos del impacto: mantienen
  // el plano general para que se vean a la vez los ataques de todos.
  private anchors: THREE.Vector3[] = [];
  private anchorsUntil = 0;
  // Cuenta atrás: la cámara va de la vista de apuntado al plano general.
  private pull: { at0: THREE.Vector3; from0: THREE.Vector3; at1: THREE.Vector3; from1: THREE.Vector3; t: number; dur: number } | null = null;
  private last = { at: new THREE.Vector3(), from: new THREE.Vector3() };

  constructor(readonly view: WorldView, readonly rig: CameraRig) {}

  reset() {
    this.impacts = [];
    this.lastSeen.clear();
    this.dir.set(0, 0, 0);
    this.holdUntil = 0;
    this.radius = 0;
    this.anchors = [];
    this.anchorsUntil = 0;
    this.pull = null;
  }

  // Empieza la cuenta atrás: calcula el plano general que encuadra los castillos en juego,
  // visto desde detrás del tuyo (donde está ahora la cámara), y se aleja hasta él en `dur` s.
  startCountdown(castles: THREE.Vector3[], dur: number) {
    if (!castles.length) return;
    this.anchors = castles.map((c) => c.clone().setY(2));
    this.anchorsUntil = this.t + dur + 2.5;
    const c = new THREE.Vector3();
    for (const p of this.anchors) c.add(p);
    c.divideScalar(this.anchors.length);
    let r = 0;
    for (const p of this.anchors) r = Math.max(r, Math.hypot(p.x - c.x, p.z - c.z));
    this.center.copy(c);
    this.radius = THREE.MathUtils.clamp(r + 6, 9, MAX_WIDE);
    this.dir.copy(this.rig.pos).sub(c).setY(0);
    if (this.dir.lengthSq() < 1) this.dir.set(0, 0, 1);
    this.dir.normalize();
    const end = this.frame();
    this.pull = { at0: this.rig.target.clone(), from0: this.rig.pos.clone(), at1: end.at, from1: end.from, t: 0, dur: Math.max(0.3, dur) };
  }

  // Durante la cuenta atrás: movimiento continuo y suave (sale despacio, frena al llegar).
  countdown(dt: number): boolean {
    const p = this.pull;
    if (!p) return false;
    this.t += dt;
    p.t += dt;
    const k = Math.min(1, p.t / p.dur);
    const e = k * k * (3 - 2 * k);
    this.last.at.lerpVectors(p.at0, p.at1, e);
    this.last.from.lerpVectors(p.from0, p.from1, e);
    this.rig.watch(this.last.at, this.last.from);
    this.rig.sharpness = 30;
    return true;
  }

  // Punto de mira y posición de la cámara para el centro y el radio actuales.
  private frame() {
    // La pantalla es más ancha que alta: con 0,8 veces la distancia justa aún cabe todo.
    const dist = (this.radius / Math.tan(HALF_FOV)) * 0.8 + 4;
    const at = this.center.clone().setY(Math.max(1.5, this.center.y * 0.6));
    const from = at.clone().addScaledVector(this.dir, dist * 0.82).add(new THREE.Vector3(0, Math.max(9, dist * 0.55), 0));
    return { at, from };
  }

  get busy() {
    return this.view.projs.size > 0 || this.t < this.holdUntil;
  }

  // Devuelve true si ha tomado el control de la cámara.
  update(dt: number): boolean {
    this.t += dt;
    // Proyectiles que han desaparecido: ahí ha habido un impacto.
    for (const [id, p] of this.lastSeen) if (!this.view.projs.has(id)) this.addImpact(p), this.lastSeen.delete(id);
    const pts: THREE.Vector3[] = [];
    for (const pr of this.view.projs.values()) {
      // Lo que sale volando fuera de la isla no merece alejar la cámara.
      if (pr.p.y > -2 && islandSdf(pr.p.x, pr.p.z) < 6) pts.push(pr.p);
      const seen = this.lastSeen.get(pr.id);
      if (seen) seen.copy(pr.p);
      else this.lastSeen.set(pr.id, pr.p.clone());
    }
    this.impacts = this.impacts.filter((i) => i.until > this.t);
    for (const i of this.impacts) pts.push(i.p);
    const wide = this.t < this.anchorsUntil;
    if (wide) pts.push(...this.anchors);
    if (!pts.length) return this.t < this.holdUntil;

    // Centro y radio de lo que hay que ver, con suavizado para que el plano no dé tirones.
    const c = new THREE.Vector3();
    for (const p of pts) c.add(p);
    c.divideScalar(pts.length);
    let r = 0;
    for (const p of pts) r = Math.max(r, Math.hypot(p.x - c.x, p.z - c.z), p.y - c.y);
    r = THREE.MathUtils.clamp(r + 4, 9, wide ? MAX_WIDE : 24);
    const k = 1 - Math.exp(-dt * 1.4);
    if (this.radius === 0) {
      this.center.copy(c);
      this.radius = r;
    } else {
      this.center.lerp(c, k);
      // Se abre deprisa (para no perder nada) y se cierra despacio.
      this.radius += (r - this.radius) * (r > this.radius ? Math.min(1, dt * 3) : k * 0.6);
    }
    // Se mira desde donde estaba la cámara al empezar la ronda (detrás de tu castillo).
    if (this.dir.lengthSq() === 0) {
      this.dir.copy(this.rig.pos).sub(this.center).setY(0);
      if (this.dir.lengthSq() < 1) this.dir.set(0, 0, 1);
      this.dir.normalize();
    }
    const { at, from } = this.frame();
    this.rig.watch(at, from);
    this.rig.sharpness = 1.6;
    this.holdUntil = this.t + 1.2;
    return true;
  }

  private addImpact(p: THREE.Vector3) {
    this.impacts.push({ p: p.clone().setY(Math.max(1, p.y)), until: this.t + 2.2 });
  }
}
