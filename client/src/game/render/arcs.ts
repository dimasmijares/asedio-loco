import * as THREE from 'three';
import type { Vec3 } from '../../../../shared/math';

// Arcos de quién ataca a quién (WRK-TASK-045): durante la cuenta atrás, un arco de guiones del
// color de cada jugador va de su catapulta al castillo al que apunta. Los guiones avanzan hacia el
// objetivo y acaban en una punta. El arco se curva hacia su derecha, así que dos jugadores que se
// atacan entre sí no se tapan. Todo cabe en dos InstancedMesh: dos llamadas de dibujo.

export interface AttackArc {
  from: Vec3;
  to: Vec3;
  color: string;
}

const MAX_ARCS = 4;
const DASHES = 22; // guiones por arco
const DASH_FILL = 0.55; // parte de cada tramo que ocupa el guion
const RADIUS = 0.2;
const FLOW = 0.6; // tramos por segundo que avanzan los guiones
const FADE_IN = 0.35; // s
const FADE_OUT = 0.3; // s

interface Curve {
  p0: THREE.Vector3;
  p1: THREE.Vector3;
  p2: THREE.Vector3;
  color: THREE.Color;
}

export class AttackArcs {
  readonly root = new THREE.Group();
  private dashes: THREE.InstancedMesh;
  private heads: THREE.InstancedMesh;
  private mat: THREE.MeshBasicMaterial;
  private curves: Curve[] = [];
  private t = 0;
  private alpha = 0;
  private target = 0; // opacidad hacia la que va (1 al mostrar, 0 al ocultar)
  private m = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private a = new THREE.Vector3();
  private b = new THREE.Vector3();
  private up = new THREE.Vector3(0, 1, 0);

  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    // Cilindros a lo largo de +Y, de altura 1: se escalan al largo de cada guion.
    this.dashes = new THREE.InstancedMesh(new THREE.CylinderGeometry(RADIUS, RADIUS, 1, 6), this.mat, MAX_ARCS * DASHES);
    this.heads = new THREE.InstancedMesh(new THREE.ConeGeometry(RADIUS * 4, RADIUS * 9, 10), this.mat, MAX_ARCS);
    for (const im of [this.dashes, this.heads]) {
      im.count = 0;
      im.frustumCulled = false;
      im.renderOrder = 5;
      this.root.add(im);
    }
    this.root.visible = false;
    this.root.name = 'attack-arcs';
    parent.add(this.root);
  }

  // Número de arcos que se están mostrando (para las pruebas).
  get shown() {
    return this.root.visible && this.target > 0 ? this.curves.length : 0;
  }

  show(arcs: AttackArc[]) {
    this.curves = arcs.slice(0, MAX_ARCS).map(({ from, to, color }) => {
      const p0 = new THREE.Vector3(...from);
      const p2 = new THREE.Vector3(...to);
      const d = p2.clone().sub(p0);
      const len = Math.hypot(d.x, d.z);
      // Punto de control: por encima del centro y desplazado a la derecha de la marcha.
      const right = new THREE.Vector3(-d.z, 0, d.x).normalize();
      const p1 = p0.clone().add(p2).multiplyScalar(0.5).addScaledVector(right, len * 0.12);
      p1.y = Math.max(p0.y, p2.y) + 4 + len * 0.22;
      return { p0, p1, p2, color: new THREE.Color(color) };
    });
    const c = new THREE.Color();
    this.curves.forEach((cv, i) => {
      for (let k = 0; k < DASHES; k++) this.dashes.setColorAt(i * DASHES + k, c.copy(cv.color));
      this.heads.setColorAt(i, cv.color);
    });
    if (this.dashes.instanceColor) this.dashes.instanceColor.needsUpdate = true;
    if (this.heads.instanceColor) this.heads.instanceColor.needsUpdate = true;
    this.dashes.count = this.curves.length * DASHES;
    this.heads.count = this.curves.length;
    this.target = this.curves.length ? 1 : 0;
    this.root.visible = this.curves.length > 0;
    this.layout();
  }

  hide() {
    this.target = 0;
  }

  update(dt: number) {
    if (!this.root.visible) return;
    this.t += dt;
    const rate = dt / (this.target > this.alpha ? FADE_IN : FADE_OUT);
    this.alpha = this.target > this.alpha ? Math.min(this.target, this.alpha + rate) : Math.max(this.target, this.alpha - rate);
    this.mat.opacity = this.alpha * 0.9;
    if (this.alpha <= 0 && this.target === 0) {
      this.root.visible = false;
      return;
    }
    this.layout();
  }

  private point(cv: Curve, u: number, out: THREE.Vector3) {
    const v = 1 - u;
    return out.set(0, 0, 0).addScaledVector(cv.p0, v * v).addScaledVector(cv.p1, 2 * v * u).addScaledVector(cv.p2, u * u);
  }

  // Coloca cada guion como un cilindro entre dos puntos de la curva. Los guiones avanzan con el
  // tiempo; el último tramo se deja libre para la punta.
  private layout() {
    const shift = (this.t * FLOW) % 1;
    const span = 0.92; // la punta ocupa el final del arco
    this.curves.forEach((cv, i) => {
      for (let k = 0; k < DASHES; k++) {
        const u0 = ((k + shift) / DASHES) * span;
        const u1 = Math.min(span, u0 + (DASH_FILL / DASHES) * span);
        this.point(cv, u0, this.a);
        this.point(cv, u1, this.b);
        this.place(this.dashes, i * DASHES + k, this.a, this.b, 1);
      }
      this.point(cv, span, this.a);
      this.point(cv, 1, this.b);
      this.place(this.heads, i, this.a, this.b, 0);
    });
    this.dashes.instanceMatrix.needsUpdate = true;
    this.heads.instanceMatrix.needsUpdate = true;
  }

  // stretch 1: se escala en Y al largo entre a y b (guion); 0: tamaño propio, en el punto medio (punta).
  private place(im: THREE.InstancedMesh, idx: number, a: THREE.Vector3, b: THREE.Vector3, stretch: number) {
    const dir = b.clone().sub(a);
    const len = dir.length();
    this.q.setFromUnitVectors(this.up, dir.normalize());
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const sy = stretch ? Math.max(0.01, len) : 1;
    this.m.compose(mid, this.q, new THREE.Vector3(1, sy, 1));
    im.setMatrixAt(idx, this.m);
  }

  dispose() {
    this.root.removeFromParent();
    this.dashes.geometry.dispose();
    this.heads.geometry.dispose();
    this.mat.dispose();
  }
}
