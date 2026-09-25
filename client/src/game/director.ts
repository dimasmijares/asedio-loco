import * as THREE from 'three';
import { islandSdf } from '../../../shared/map';
import type { CameraRig } from './camera';
import type { WorldView } from './view';

const HALF_FOV = (55 / 2) * THREE.MathUtils.DEG2RAD;

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

  constructor(readonly view: WorldView, readonly rig: CameraRig) {}

  reset() {
    this.impacts = [];
    this.lastSeen.clear();
    this.dir.set(0, 0, 0);
    this.holdUntil = 0;
    this.radius = 0;
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
    if (!pts.length) return this.t < this.holdUntil;

    // Centro y radio de lo que hay que ver, con suavizado para que el plano no dé tirones.
    const c = new THREE.Vector3();
    for (const p of pts) c.add(p);
    c.divideScalar(pts.length);
    let r = 0;
    for (const p of pts) r = Math.max(r, Math.hypot(p.x - c.x, p.z - c.z), p.y - c.y);
    r = THREE.MathUtils.clamp(r + 4, 9, 24);
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
    // La pantalla es más ancha que alta: con 0,8 veces la distancia justa aún cabe todo.
    const dist = (this.radius / Math.tan(HALF_FOV)) * 0.8 + 4;
    const target = this.center.clone().setY(Math.max(1.5, this.center.y * 0.6));
    const from = target.clone().addScaledVector(this.dir, dist * 0.82).add(new THREE.Vector3(0, Math.max(9, dist * 0.55), 0));
    this.rig.watch(target, from);
    this.rig.sharpness = 1.6;
    this.holdUntil = this.t + 1.2;
    return true;
  }

  private addImpact(p: THREE.Vector3) {
    this.impacts.push({ p: p.clone().setY(Math.max(1, p.y)), until: this.t + 2.2 });
  }
}
