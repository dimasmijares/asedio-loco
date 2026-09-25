import * as THREE from 'three';
import type { AmmoId } from '../../../../shared/ammo';
import { KING_HALF_HEIGHT, KING_RADIUS } from '../../../../shared/castle';
import { PLAYER_STYLES } from '../../../../shared/players';
import { mergeStatic, outline, toon } from './materials';
import { tex } from './textures';

const box = (w: number, h: number, d: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);

// Normales por cara para un aspecto facetado (low-poly).
function flat(g: THREE.BufferGeometry) {
  const n = g.index ? g.toNonIndexed() : g;
  n.computeVertexNormals();
  return n;
}

function shadows(o: THREE.Object3D) {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh && !c.userData.noOutline) c.castShadow = true;
  });
  return o;
}

// Catapulta con brazo que se tensa al apuntar y se suelta al disparar.
export class Catapult {
  root = new THREE.Group();
  yawPivot = new THREE.Group();
  arm = new THREE.Group();
  bucket = new THREE.Group();
  flag: THREE.Mesh;
  private pull = 0;
  private fireT = -1;
  private targetYaw = 0;
  private yaw = 0;
  loaded: THREE.Object3D | null = null;

  constructor(slot: number) {
    const st = PLAYER_STYLES[slot];
    const wood = toon('#a86b3c', { map: tex.wood() });
    const dark = toon('#6b3f1f');
    const metal = toon('#5b6470');
    const color = toon(st.color);
    this.root.add(this.yawPivot);
    // Las piezas fijas se construyen sueltas y luego se fusionan por material (menos llamadas de dibujo).
    const chassis = new THREE.Group();
    for (const x of [-0.55, 0.55]) {
      const rail = box(0.18, 0.2, 2.2, wood);
      rail.position.set(x, 0.35, 0);
      chassis.add(rail);
      for (const z of [-0.8, 0.8]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.14, 10), dark);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(x * 1.25, 0.32, z);
        chassis.add(wheel);
      }
    }
    const cross = box(1.3, 0.16, 0.2, wood);
    cross.position.set(0, 0.4, -0.7);
    chassis.add(cross);
    // Soportes en A.
    for (const x of [-0.5, 0.5]) {
      const post = box(0.16, 1.3, 0.16, wood);
      post.position.set(x, 1.0, 0.1);
      chassis.add(post);
    }
    const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8), metal);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, 1.55, 0.1);
    chassis.add(axle);
    this.yawPivot.add(mergeStatic(chassis));
    // Brazo con cazo y contrapeso de color del jugador.
    this.arm.position.set(0, 1.55, 0.1);
    const armParts = new THREE.Group();
    const beam = box(0.16, 0.16, 2.6, wood);
    beam.position.z = -0.6;
    armParts.add(beam);
    const weight = box(0.6, 0.6, 0.6, color);
    weight.position.set(0, -0.2, 0.75);
    armParts.add(weight);
    this.bucket.position.set(0, 0.12, -1.85);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.25, 8, 1, true), toon('#6b3f1f', { side: THREE.DoubleSide }));
    cup.position.copy(this.bucket.position);
    armParts.add(cup);
    this.arm.add(mergeStatic(armParts), this.bucket);
    this.yawPivot.add(this.arm);
    // Estandarte.
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 6), dark);
    pole.position.set(0.9, 1.6, 0.9);
    this.root.add(outline(pole, 0.03));
    this.flag = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8, 6, 1), toon('#ffffff', { map: tex.banner(st.color, st.glyph, st.ink), side: THREE.DoubleSide }));
    this.flag.position.set(0.9 + 0.55, 2.8, 0.9);
    this.flag.userData.noOutline = true;
    this.root.add(this.flag);
    shadows(this.root);
    this.setArm(0);
  }

  // El brazo apunta hacia atrás en reposo (-z local) y el tiro sale hacia +z.
  private setArm(a: number) {
    this.arm.rotation.x = a;
  }

  setYaw(yaw: number, instant = false) {
    this.targetYaw = yaw;
    if (instant) this.yaw = yaw;
  }

  setPull(p: number) {
    this.pull = p;
  }

  fire() {
    this.fireT = 0;
  }

  // Posición del cazo en el mundo (para colocar el proyectil cargado).
  bucketWorld(out = new THREE.Vector3()) {
    return this.bucket.getWorldPosition(out);
  }

  update(dt: number, t: number) {
    let d = this.targetYaw - this.yaw;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    this.yaw += d * Math.min(1, dt * 8);
    // El cazo reposa detrás (-z local) y el tiro sale por delante (+z local = rumbo).
    this.yawPivot.rotation.y = this.yaw;
    if (this.fireT >= 0) {
      this.fireT += dt;
      const k = this.fireT < 0.18 ? this.fireT / 0.18 : Math.max(0, 1 - (this.fireT - 0.18) / 0.9);
      this.setArm(-0.35 - this.pull * 0.25 + k * 2.1);
      if (this.fireT > 1.1) this.fireT = -1;
    } else {
      this.setArm(-0.35 - this.pull * 0.25);
    }
    // Ondea el estandarte.
    const pos = (this.flag.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + 0.55;
      pos.setZ(i, Math.sin(t * 5 + x * 5) * 0.08 * x);
    }
    pos.needsUpdate = true;
  }
}

// Rey: cuerpo con túnica del color del jugador, cabeza, barba y corona dorada.
export function makeKing(slot: number) {
  const st = PLAYER_STYLES[slot];
  const g = new THREE.Group();
  const h = KING_HALF_HEIGHT + KING_RADIUS; // mitad de la altura total
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 0.65, 10), toon(st.color));
  robe.position.y = -h + 0.33;
  g.add(robe);
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.07, 10), toon('#ffd23f'));
  belt.position.y = -h + 0.45;
  g.add(belt);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), toon('#ffcf9e'));
  head.position.y = -h + 0.82;
  g.add(head);
  const beard = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.25, 8), toon('#f5f5f5'));
  beard.rotation.x = Math.PI;
  beard.position.set(0, -h + 0.7, 0.13);
  g.add(beard);
  for (const x of [-0.08, 0.08]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), toon('#1d1626'));
    eye.position.set(x, -h + 0.86, 0.2);
    eye.userData.noOutline = true;
    g.add(eye);
  }
  const crown = new THREE.Group();
  const gold = toon('#ffc300', { emissive: '#553300' });
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 10, 1, true), toon('#ffc300', { emissive: '#553300', side: THREE.DoubleSide }));
  crown.add(band);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), gold);
    spike.position.set(Math.cos(a) * 0.18, 0.12, Math.sin(a) * 0.18);
    crown.add(spike);
  }
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.045), toon('#e63946'));
  gem.position.set(0, 0.02, 0.2);
  crown.add(gem);
  // Cuerpo y corona fusionados por separado (la corona se oculta cuando el rey cae).
  const king = new THREE.Group();
  king.add(mergeStatic(g, true, true, 0.022));
  const crownMerged = mergeStatic(crown, true, true, 0.022);
  crownMerged.position.y = -h + 1.05;
  crownMerged.name = 'crown';
  king.add(crownMerged);
  shadows(king);
  return king;
}

// Una malla distinta para cada munición.
// Plantillas por munición: cada proyectil nuevo es un clon (comparte geometría y materiales),
// así no se crean materiales ni se compilan shaders en mitad de un disparo.
const templates = new Map<string, THREE.Object3D>();

export function makeProjectile(ammo: AmmoId, scale = 1): THREE.Object3D {
  const key = `${ammo}:${scale}`;
  let t = templates.get(key);
  if (!t) templates.set(key, (t = buildProjectile(ammo, scale)));
  return t.clone(true);
}

export function projectileTemplates() {
  return [...templates.values()];
}

function buildProjectile(ammo: AmmoId, scale = 1): THREE.Object3D {
  const g = new THREE.Group();
  switch (ammo) {
    case 'rock': {
      const m = new THREE.Mesh(flat(new THREE.IcosahedronGeometry(0.45, 1)), toon('#8a8f98', { map: tex.stone() }));
      g.add(m);
      break;
    }
    case 'log': {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.9, 10), toon('#ffffff', { map: tex.wood() }));
      g.add(m);
      for (const y of [-0.96, 0.96]) {
        const cap = new THREE.Mesh(new THREE.CircleGeometry(0.34, 10), toon('#e0b27a'));
        cap.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2;
        cap.position.y = y;
        cap.userData.noOutline = true;
        g.add(cap);
      }
      break;
    }
    case 'coconuts': {
      const c = toon('#6b4226');
      const n = scale < 0.8 ? 1 : 4;
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(n === 1 ? 0.26 : 0.22, 8, 6), c);
        m.position.set(n === 1 ? 0 : Math.cos(i * 1.57) * 0.18, n === 1 ? 0 : (i % 2) * 0.12, n === 1 ? 0 : Math.sin(i * 1.57) * 0.18);
        g.add(m);
      }
      break;
    }
    case 'cow': {
      const body = box(1.2, 0.7, 0.7, toon('#ffffff', { map: tex.cow() }));
      g.add(body);
      const head = box(0.4, 0.4, 0.45, toon('#ffffff', { map: tex.cow() }));
      head.position.set(0.72, 0.18, 0);
      g.add(head);
      const snout = box(0.14, 0.22, 0.34, toon('#ffb3c1'));
      snout.position.set(0.95, 0.1, 0);
      g.add(snout);
      for (const z of [-0.14, 0.14]) {
        const horn = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 5), toon('#fff3b0'));
        horn.position.set(0.72, 0.46, z);
        g.add(horn);
      }
      for (const [x, z] of [
        [-0.4, -0.25],
        [-0.4, 0.25],
        [0.4, -0.25],
        [0.4, 0.25],
      ]) {
        const leg = box(0.14, 0.35, 0.14, toon('#f4f1de'));
        leg.position.set(x, -0.5, z);
        g.add(leg);
      }
      break;
    }
    case 'melon': {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), toon('#ffffff', { map: tex.melon() }));
      m.scale.set(1.15, 0.95, 0.95);
      g.add(m);
      break;
    }
    case 'chicken': {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), toon('#fffdf0'));
      g.add(body);
      const comb = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 5), toon('#e63946'));
      comb.position.set(0.18, 0.32, 0);
      g.add(comb);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 5), toon('#ffb703'));
      beak.rotation.z = -Math.PI / 2;
      beak.position.set(0.38, 0.1, 0);
      g.add(beak);
      for (const z of [-0.33, 0.33]) {
        const wing = box(0.3, 0.05, 0.22, toon('#f1faee'));
        wing.position.set(-0.05, 0.05, z);
        wing.name = 'wing';
        g.add(wing);
      }
      break;
    }
    case 'piano': {
      const body = box(1.7, 1.0, 0.8, toon('#1d1d24'));
      g.add(body);
      const keys = box(1.5, 0.08, 0.3, toon('#fafafa'));
      keys.position.set(0, 0.2, 0.52);
      g.add(keys);
      for (let i = 0; i < 7; i++) {
        const k = box(0.1, 0.1, 0.18, toon('#111'));
        k.position.set(-0.6 + i * 0.2, 0.27, 0.45);
        k.userData.noOutline = true;
        g.add(k);
      }
      break;
    }
    case 'blackhole': {
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), toon('#10002b', { emissive: '#240046' }));
      g.add(core);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 6, 20), toon('#c77dff', { emissive: '#7b2cbf' }));
      ring.rotation.x = Math.PI / 2.4;
      ring.userData.noOutline = true;
      g.add(ring);
      break;
    }
    case 'magnet': {
      const red = toon('#e63946');
      const tip = toon('#dfe7ef');
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.11, 6, 12, Math.PI), red);
      g.add(arc);
      for (const x of [-0.28, 0.28]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 8), red);
        leg.position.set(x, -0.15, 0);
        g.add(leg);
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.12, 8), tip);
        t.position.set(x, -0.36, 0);
        g.add(t);
      }
      break;
    }
    case 'snowball': {
      const m = new THREE.Mesh(flat(new THREE.IcosahedronGeometry(0.45, 1)), toon('#f1faff'));
      g.add(m);
      break;
    }
    default: {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), toon('#ffffff')));
    }
  }
  if (ammo === 'coconuts' && scale < 0.8) g.scale.setScalar(1);
  else g.scale.setScalar(scale);
  outline(g, 0.03);
  shadows(g);
  return g;
}
