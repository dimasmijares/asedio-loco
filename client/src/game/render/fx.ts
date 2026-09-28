import * as THREE from 'three';
import type { Vec3 } from '../../../../shared/math';
import { toonGradient } from './textures';

interface P {
  p: THREE.Vector3;
  v: THREE.Vector3;
  life: number;
  max: number;
  size: number;
  grow: number;
  gravity: number;
  drag: number;
  color: THREE.Color;
  spin: THREE.Vector3;
  rot: THREE.Euler;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

// Grupo de partículas instanciadas (bolas para humo/polvo/fuego, cubitos para chispas y astillas).
class Pool {
  mesh: THREE.InstancedMesh;
  items: P[] = [];
  // `cap` es el tope vigente (según la calidad); la malla se crea con la capacidad máxima para
  // poder subirlo en plena partida sin recrearla (WRK-TASK-013).
  cap: number;
  constructor(geo: THREE.BufferGeometry, readonly capacity: number, parent: THREE.Object3D, opacity = 1) {
    this.cap = capacity;
    const cap = capacity;
    const see = opacity < 1;
    const mat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonGradient(), transparent: see, opacity, depthWrite: !see });
    this.mesh = new THREE.InstancedMesh(geo, mat, cap);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(cap * 3), 3);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    parent.add(this.mesh);
  }
  add(p: P) {
    if (this.items.length >= this.cap) this.items.shift();
    this.items.push(p);
  }
  // Nuevo tope: si baja, se retiran las partículas más antiguas que sobran.
  setCap(n: number) {
    this.cap = Math.min(n, this.capacity);
    if (this.items.length > this.cap) this.items.splice(0, this.items.length - this.cap);
  }
  update(dt: number) {
    let n = 0;
    const keep: P[] = [];
    for (const it of this.items) {
      it.life += dt;
      if (it.life >= it.max) continue;
      it.v.y -= it.gravity * dt;
      it.v.multiplyScalar(Math.max(0, 1 - it.drag * dt));
      it.p.addScaledVector(it.v, dt);
      it.rot.x += it.spin.x * dt;
      it.rot.y += it.spin.y * dt;
      it.rot.z += it.spin.z * dt;
      const t = it.life / it.max;
      // Crece al principio y se encoge al final: así se "desvanece" sin transparencia.
      const s = it.size * (1 + it.grow * t) * (t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1);
      _q.setFromEuler(it.rot);
      _m.compose(it.p, _q, _s.set(s, s, s));
      this.mesh.setMatrixAt(n, _m);
      this.mesh.setColorAt(n, it.color);
      keep.push(it);
      n++;
    }
    this.items = keep;
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const randDir = () => new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize();

// Tope de partículas por calidad (D-046).
export const FX_CAP = { low: 260, medium: 550, high: 900 } as const;

// Polvo y humo que quedan tras un derrumbe (WRK-TASK-049): pocas bocanadas grandes y translúcidas
// que salen de unos focos durante SMOKE_LIFE segundos y suben despacio. Un foco nace donde se
// rompen SMOKE_BLOCKS bloques en una celda de SMOKE_CELL m en menos de SMOKE_WINDOW s.
export const SMOKE_CAP = { low: 50, medium: 110, high: 180 } as const; // bocanadas
const SMOKE_FOCI = { low: 3, medium: 6, high: 9 } as const;
const SMOKE_EVERY = { low: 0.75, medium: 0.5, high: 0.35 } as const; // s entre bocanadas de un foco
const SMOKE_CELL = 5;
const SMOKE_BLOCKS = 3;
const SMOKE_WINDOW = 3;
const SMOKE_LIFE = 10; // s que suelta humo un foco; la última bocanada tarda ~5 s más en irse
const SMOKE_COLORS = ['#a89f90', '#8f877c', '#6e6873', '#5d5866'];

interface Focus {
  p: THREE.Vector3;
  r: number;
  t: number;
  next: number;
}

export class Fx {
  puffs: Pool;
  bits: Pool;
  smoke: Pool;
  scale: number;
  foci: Focus[] = [];
  private quality: 'low' | 'medium' | 'high' = 'medium';
  private cells = new Map<string, { n: number; at: number; p: THREE.Vector3 }>();
  private time = 0;

  constructor(parent: THREE.Object3D, quality: 'low' | 'medium' | 'high') {
    this.puffs = new Pool(new THREE.IcosahedronGeometry(1, 0), FX_CAP.high, parent);
    this.bits = new Pool(new THREE.BoxGeometry(1, 1, 1), Math.floor(FX_CAP.high * 0.6), parent);
    this.smoke = new Pool(new THREE.IcosahedronGeometry(1, 1), SMOKE_CAP.high, parent, 0.7);
    this.smoke.mesh.renderOrder = 2;
    this.smoke.mesh.name = 'smoke';
    this.scale = 1;
    this.setQuality(quality);
  }

  // Topes y densidad de partículas según la calidad; se puede cambiar en plena partida.
  setQuality(quality: 'low' | 'medium' | 'high') {
    const cap = FX_CAP[quality];
    this.scale = quality === 'high' ? 1 : quality === 'medium' ? 0.7 : 0.4;
    this.puffs.setCap(cap);
    this.bits.setCap(Math.floor(cap * 0.6));
    this.quality = quality;
    this.smoke.setCap(SMOKE_CAP[quality]);
    if (this.foci.length > SMOKE_FOCI[quality]) this.foci.splice(0, this.foci.length - SMOKE_FOCI[quality]);
  }

  // Un bloque roto en p. Si en su celda se rompen varios seguidos, es un derrumbe: nace un foco de
  // humo (o se aviva el que ya hay cerca).
  rubble(p: Vec3) {
    const key = `${Math.floor(p[0] / SMOKE_CELL)},${Math.floor(p[2] / SMOKE_CELL)}`;
    let c = this.cells.get(key);
    if (!c || this.time - c.at > SMOKE_WINDOW) {
      c = { n: 0, at: this.time, p: new THREE.Vector3() };
      this.cells.set(key, c);
    }
    c.n++;
    c.p.add(new THREE.Vector3(p[0], Math.max(0.3, p[1]), p[2]));
    if (c.n !== SMOKE_BLOCKS) return;
    this.collapse(c.p.clone().divideScalar(c.n));
  }

  collapse(p: THREE.Vector3) {
    const near = this.foci.find((f) => Math.hypot(f.p.x - p.x, f.p.z - p.z) < SMOKE_CELL * 1.2);
    if (near) {
      near.t = Math.min(near.t, 1);
      near.r = Math.min(3, near.r + 0.4);
      return;
    }
    if (this.foci.length >= SMOKE_FOCI[this.quality]) this.foci.shift();
    this.foci.push({ p, r: 2.2, t: 0, next: 0 });
  }

  private stepSmoke(dt: number) {
    const every = SMOKE_EVERY[this.quality];
    for (const f of this.foci) {
      f.t += dt;
      while (f.next <= f.t && f.t < SMOKE_LIFE) {
        // Al principio sale más denso; luego se va apagando.
        f.next += every * (1 + f.t / SMOKE_LIFE);
        const a = rnd(0, Math.PI * 2);
        const d = rnd(0, f.r);
        this.smoke.add({
          p: new THREE.Vector3(f.p.x + Math.cos(a) * d, f.p.y + rnd(-0.2, 0.6), f.p.z + Math.sin(a) * d),
          v: new THREE.Vector3(rnd(-0.3, 0.3), rnd(0.8, 1.3), rnd(-0.3, 0.3)),
          life: 0,
          max: rnd(5, 7),
          size: rnd(1.4, 2.2) * (1.2 - (0.4 * f.t) / SMOKE_LIFE),
          grow: 1.6,
          gravity: -0.03,
          drag: 0.25,
          color: new THREE.Color(SMOKE_COLORS[Math.floor(rnd(0, SMOKE_COLORS.length))]),
          spin: new THREE.Vector3(rnd(-0.3, 0.3), rnd(-0.3, 0.3), rnd(-0.3, 0.3)),
          rot: new THREE.Euler(rnd(0, 3), rnd(0, 3), rnd(0, 3)),
        });
      }
    }
    this.foci = this.foci.filter((f) => f.t < SMOKE_LIFE);
    if (this.cells.size > 64) for (const [k, c] of this.cells) if (this.time - c.at > SMOKE_WINDOW) this.cells.delete(k);
  }

  // Quita el humo al instante (al reconstruir los castillos).
  clearSmoke() {
    this.foci = [];
    this.cells.clear();
    this.smoke.items = [];
    this.smoke.update(0);
  }

  private n(k: number) {
    return Math.max(1, Math.round(k * this.scale));
  }

  private puff(p: Vec3 | THREE.Vector3, v: THREE.Vector3, o: Partial<Omit<P, "color">> & { color: THREE.ColorRepresentation }) {
    this.puffs.add({
      p: Array.isArray(p) ? new THREE.Vector3(...p) : p.clone(),
      v,
      life: 0,
      max: o.max ?? 1,
      size: o.size ?? 0.4,
      grow: o.grow ?? 1,
      gravity: o.gravity ?? -0.5,
      drag: o.drag ?? 1.5,
      color: new THREE.Color(o.color),
      spin: new THREE.Vector3(rnd(-2, 2), rnd(-2, 2), rnd(-2, 2)),
      rot: new THREE.Euler(rnd(0, 3), rnd(0, 3), rnd(0, 3)),
    });
  }

  private bit(p: Vec3 | THREE.Vector3, v: THREE.Vector3, o: Partial<Omit<P, "color">> & { color: THREE.ColorRepresentation }) {
    this.bits.add({
      p: Array.isArray(p) ? new THREE.Vector3(...p) : p.clone(),
      v,
      life: 0,
      max: o.max ?? 1.2,
      size: o.size ?? 0.1,
      grow: 0,
      gravity: o.gravity ?? 9.8,
      drag: o.drag ?? 0.3,
      color: new THREE.Color(o.color),
      spin: new THREE.Vector3(rnd(-12, 12), rnd(-12, 12), rnd(-12, 12)),
      rot: new THREE.Euler(rnd(0, 3), rnd(0, 3), rnd(0, 3)),
    });
  }

  dust(p: Vec3, amount = 6, color: THREE.ColorRepresentation = '#d9c7a8', size = 0.45) {
    for (let i = 0; i < this.n(amount); i++) {
      const d = randDir();
      d.y = Math.abs(d.y) * 0.6;
      this.puff(p, d.multiplyScalar(rnd(0.8, 2.5)), { color, size: size * rnd(0.6, 1.3), max: rnd(0.7, 1.4), grow: 1.2, gravity: -0.4 });
    }
  }

  // Onda de polvo a ras de suelo, hacia fuera.
  ring(p: Vec3, radius: number, color: THREE.ColorRepresentation = '#e0cfae') {
    const n = this.n(18);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const d = new THREE.Vector3(Math.cos(a), 0.05, Math.sin(a));
      this.puff([p[0] + d.x * 0.5, Math.max(p[1] - 0.5, 0.2), p[2] + d.z * 0.5], d.multiplyScalar(radius * 2.4), { color, size: 0.5, max: 0.9, grow: 1.5, drag: 2.5, gravity: 0 });
    }
  }

  boom(p: Vec3, radius: number, kind = 'boom') {
    if (kind === 'peck') {
      // Picotazo de la gallina: plumas y un poco de polvo, sin fuego.
      for (let i = 0; i < this.n(10); i++) this.bit(p, randDir().multiplyScalar(rnd(2, 5)).add(new THREE.Vector3(0, 2, 0)), { color: i % 3 ? '#fffdf0' : '#ffd43b', size: 0.12, max: 1.4 });
      this.ring(p, radius * 0.5);
      return;
    }
    if (kind === 'recoil') {
      // Retroceso del imán: anillo rojo y chispas.
      this.ring(p, radius, '#e63946');
      for (let i = 0; i < this.n(14); i++) this.bit(p, randDir().multiplyScalar(rnd(4, 9)), { color: i % 2 ? '#e63946' : '#dee2e6', size: 0.1, max: 0.8 });
      return;
    }
    if (kind === 'chord') {
      // Acorde final del piano: onda de polvo a ras de suelo y teclas saltando.
      this.ring(p, radius);
      this.dust(p, 14, '#d9c7a8', 0.7);
      for (let i = 0; i < this.n(10); i++) this.bit(p, randDir().multiplyScalar(rnd(3, 7)).add(new THREE.Vector3(0, 3, 0)), { color: i % 2 ? '#ffffff' : '#222222', size: 0.14, max: 1.4 });
      return;
    }
    if (kind === 'coco') {
      // Coco explosivo: fogonazo naranja, astillas de cáscara y pulpa blanca.
      for (let i = 0; i < this.n(14); i++) this.puff(p, randDir().multiplyScalar(rnd(2, 5) * radius * 0.35), { color: i % 3 ? '#ff9f1c' : '#ffd23f', size: rnd(0.35, 0.7), max: rnd(0.3, 0.55), grow: 1.8, drag: 4, gravity: -1 });
      for (let i = 0; i < this.n(10); i++) this.bit(p, randDir().multiplyScalar(rnd(3, 7)).add(new THREE.Vector3(0, 2, 0)), { color: i % 2 ? '#6b4226' : '#fff8e7', size: 0.12, max: 1.3 });
      this.ring(p, radius * 0.7);
      return;
    }
    if (kind === 'egg') {
      // Huevo bomba: yema, cáscara y un fogonazo pequeño.
      for (let i = 0; i < this.n(10); i++) this.puff(p, randDir().multiplyScalar(rnd(2, 5) * radius * 0.35), { color: i % 3 ? '#ffd23f' : '#ff9f1c', size: rnd(0.3, 0.6), max: rnd(0.3, 0.5), grow: 1.8, drag: 4, gravity: -1 });
      for (let i = 0; i < this.n(8); i++) this.bit(p, randDir().multiplyScalar(rnd(3, 6)).add(new THREE.Vector3(0, 2, 0)), { color: '#fff4d6', size: 0.1, max: 1.2 });
      this.ring(p, radius * 0.6);
      return;
    }
    const fire = kind === 'melon' ? ['#ff4d6d', '#ff8fa3', '#40c057'] : kind === 'implode' ? ['#c77dff', '#7b2cbf', '#e0aaff'] : ['#ffd23f', '#ff9f1c', '#ff5400'];
    for (let i = 0; i < this.n(22); i++) {
      this.puff(p, randDir().multiplyScalar(rnd(2, 6) * radius * 0.35), { color: fire[i % fire.length], size: rnd(0.4, 0.9), max: rnd(0.35, 0.7), grow: 1.8, drag: 4, gravity: -1 });
    }
    for (let i = 0; i < this.n(12); i++) {
      this.puff(p, randDir().multiplyScalar(rnd(1, 3)).add(new THREE.Vector3(0, 1.5, 0)), { color: i % 2 ? '#5c5470' : '#8d8699', size: rnd(0.5, 0.9), max: rnd(1.2, 2), grow: 1.5, drag: 1.5, gravity: -1.2 });
    }
    for (let i = 0; i < this.n(14); i++) this.bit(p, randDir().multiplyScalar(rnd(5, 11)), { color: '#ffe066', size: 0.09, max: 0.8 });
    if (kind === 'melon') for (let i = 0; i < this.n(16); i++) this.bit(p, randDir().multiplyScalar(rnd(3, 8)), { color: i % 3 ? '#e03131' : '#2b8a3e', size: 0.14, max: 1.3 });
    if (kind === 'cow') for (let i = 0; i < this.n(10); i++) this.bit(p, randDir().multiplyScalar(rnd(3, 7)), { color: i % 2 ? '#ffffff' : '#222222', size: 0.16, max: 1.4 });
    this.ring(p, radius);
  }

  shatter(p: Vec3, mat: string) {
    const c = mat === 'glass' ? ['#bff0ff', '#e7fbff', '#7fd8f5'] : mat === 'wood' ? ['#c98a4b', '#8b5a2b', '#e0b27a'] : mat === 'iron' ? ['#9aa3ad', '#ffe066'] : ['#9aa3ad', '#6f7780', '#c3c9cf'];
    const n = mat === 'glass' ? 14 : 8;
    for (let i = 0; i < this.n(n); i++) this.bit(p, randDir().multiplyScalar(rnd(2, mat === 'glass' ? 7 : 4)).add(new THREE.Vector3(0, 2, 0)), { color: c[i % c.length], size: mat === 'glass' ? rnd(0.05, 0.12) : rnd(0.08, 0.16), max: rnd(0.8, 1.5) });
    this.dust(p, mat === 'glass' ? 2 : 5, mat === 'wood' ? '#d9b98c' : '#c9c3b8', 0.4);
  }

  fire(p: Vec3, amount = 5) {
    for (let i = 0; i < this.n(amount); i++) {
      this.puff([p[0] + rnd(-0.4, 0.4), p[1], p[2] + rnd(-0.4, 0.4)], new THREE.Vector3(rnd(-0.3, 0.3), rnd(1.5, 3), rnd(-0.3, 0.3)), { color: i % 2 ? '#ff9f1c' : '#ff5400', size: rnd(0.25, 0.5), max: rnd(0.5, 0.9), grow: 0.5, gravity: -1, drag: 1 });
    }
    this.puff([p[0], p[1] + 0.5, p[2]], new THREE.Vector3(0, 2, 0), { color: '#4a4458', size: 0.5, max: 1.5, grow: 1.5, gravity: -0.8 });
  }

  sparks(p: Vec3, color: THREE.ColorRepresentation = '#ffe066', amount = 8) {
    for (let i = 0; i < this.n(amount); i++) this.bit(p, randDir().multiplyScalar(rnd(3, 7)), { color, size: 0.07, max: 0.6 });
  }

  confetti(p: Vec3, colors: string[]) {
    for (let i = 0; i < this.n(60); i++) {
      const d = randDir();
      d.y = Math.abs(d.y) + 0.8;
      this.bit(p, d.multiplyScalar(rnd(6, 13)), { color: colors[i % colors.length], size: rnd(0.12, 0.22), max: rnd(2.5, 4), gravity: 5, drag: 1.4 });
    }
  }

  feathers(p: Vec3) {
    for (let i = 0; i < this.n(8); i++) this.bit(p, randDir().multiplyScalar(rnd(1, 3)), { color: '#fffdf0', size: 0.12, max: 1.6, gravity: 1.5, drag: 2 });
  }

  snow(p: Vec3, amount = 3) {
    for (let i = 0; i < this.n(amount); i++) this.puff(p, randDir().multiplyScalar(rnd(0.5, 1.5)), { color: '#ffffff', size: 0.2, max: 0.6, grow: 0.5 });
  }

  trail(p: Vec3, color: THREE.ColorRepresentation) {
    this.puff(p, new THREE.Vector3(rnd(-0.2, 0.2), rnd(-0.2, 0.2), rnd(-0.2, 0.2)), { color, size: 0.16, max: 0.45, grow: 0.3, gravity: 0, drag: 0 });
  }

  update(dt: number) {
    this.time += dt;
    this.stepSmoke(dt);
    this.puffs.update(dt);
    this.bits.update(dt);
    this.smoke.update(dt);
  }

  get count() {
    return this.puffs.items.length + this.bits.items.length + this.smoke.items.length;
  }
}
