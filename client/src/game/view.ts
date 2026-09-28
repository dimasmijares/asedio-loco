import * as THREE from 'three';
import { AMMO, type AmmoId } from '../../../shared/ammo';
import { buildCastle, kingId, slotOfBlock, KING_HALF_HEIGHT, KING_ID_BASE, KING_RADIUS } from '../../../shared/castle';
import { CATAPULT_LOCAL, castleOrigin, toWorld } from '../../../shared/map';
import type { MaterialId } from '../../../shared/materials';
import type { Quat, Vec3 } from '../../../shared/math';
import { PLAYER_STYLES } from '../../../shared/players';
import { BlockMeshes, blockTint } from './render/blocks';
import { Fx } from './render/fx';
import { toon } from './render/materials';
import { Catapult, KING_NECK, makeKing, makeProjectile } from './render/models';
import type { Stage } from './render/stage';
import { DEBRIS_CAP, NoDebris, type DebrisLike, type MakeDebris } from './debrisLike';
import { ReplayPlayer, ReplayRecorder, type ReplayClip } from './replay';
import { SHIELD_RADIUS } from './shield';
import type { SimEvent } from './sim/sim';

export interface ProjView {
  id: number;
  ammo: AmmoId;
  owner: number;
  obj: THREE.Object3D;
  p: THREE.Vector3;
  born: number;
  scale: number;
}

// Todo lo que se ve del mundo. Se alimenta igual desde la simulación local (anfitrión)
// que desde la red (resto de clientes).
const SCARE_TIME = 1.3; // s que dura el susto del rey

export interface ViewSnapshot {
  blocks: { id: number; mat: MaterialId; size: Vec3; p: Vec3; q: Quat }[];
  kings: { slot: number; p: Vec3; q: Quat; alive: boolean; visible: boolean; crown: boolean }[];
}

export class WorldView {
  root = new THREE.Group();
  blocks: BlockMeshes;
  debris: DebrisLike;
  fx: Fx;
  catapults = new Map<number, Catapult>();
  kings = new Map<number, THREE.Object3D>();
  kingAlive = new Map<number, boolean>();
  // Animación del rey (WRK-TASK-051): susto (s que quedan) y desmayo (0 de pie, 1 en el suelo).
  private kingAnim = new Map<number, { scare: number; faint: number }>();
  // Escudo real (WRK-TASK-041): halo sobre la cabeza y columna de luz dorada sobre cada rey.
  private guard: { on: boolean; objs: Map<number, THREE.Object3D>; beam: THREE.MeshBasicMaterial | null } = { on: false, objs: new Map(), beam: null };
  projs = new Map<number, ProjView>();
  shields = new Map<number, THREE.Mesh>();
  markers: { obj: THREE.Object3D; until: number }[] = [];
  listeners: ((e: SimEvent) => void)[] = [];
  shake = 0;
  time = 0;
  lavaY = -3.6;
  // Repetición: se graba todo lo que llega en directo. Mientras se reproduce, lo que sigue
  // llegando se aparta (live) y se aplica al terminar.
  recorder = new ReplayRecorder();
  replaying: ReplayPlayer | null = null;
  private live = new Map<number, [Vec3, Quat]>();
  private liveDuring = new Map<number, [Vec3, Quat]>();
  private pendingLive: SimEvent[] = [];
  private replayUndo: (() => void)[] = [];

  // Cambia en plena partida los topes de fragmentos y partículas (WRK-TASK-013); la resolución y
  // las sombras las cambia `Stage.setQuality`.
  setQuality(q: 'low' | 'medium' | 'high') {
    this.debris.setMax(DEBRIS_CAP[q]);
    this.fx.setQuality(q);
  }

  constructor(readonly stage: Stage, readonly slots: number[], makeDebris: MakeDebris = () => new NoDebris()) {
    stage.scene.add(this.root);
    const shadows = stage.quality !== 'low';
    this.blocks = new BlockMeshes(this.root, 640, 0.035, shadows);
    this.debris = makeDebris(this.root, DEBRIS_CAP[stage.quality], shadows);
    this.fx = new Fx(this.root, stage.quality);
    for (const slot of [0, 1, 2, 3]) {
      const c = new Catapult(slot);
      const p = toWorld(slot, CATAPULT_LOCAL);
      c.root.position.set(p[0], p[1], p[2]);
      const o = castleOrigin(slot);
      c.setYaw(Math.atan2(-o[0], -o[2]), true);
      c.root.visible = slots.includes(slot);
      this.root.add(c.root);
      this.catapults.set(slot, c);
    }
    this.buildCastles();
  }

  buildCastles() {
    for (const [s, c] of this.catapults) c.root.visible = this.slots.includes(s);
    this.blocks.clear();
    this.debris.clear();
    this.fx?.clearSmoke();
    for (const k of this.kings.values()) this.root.remove(k);
    this.kings.clear();
    this.kingAnim.clear();
    for (const slot of this.slots) {
      const c = buildCastle(slot);
      for (const b of c.blocks) {
        this.blocks.add(b.id, b.mat, b.size, b.p, b.q);
        this.debris.addProxy(b.id, b.size, b.p, b.q);
      }
      const k = makeKing(slot);
      k.position.set(...c.kingPos);
      this.root.add(k);
      this.kings.set(slot, k);
      this.kingAlive.set(slot, true);
    }
  }

  // Estado de un cuerpo (bloque, rey o proyectil), en directo.
  setBody(id: number, p: Vec3, q: Quat) {
    if (this.replaying) {
      this.liveDuring.set(id, [p, q]);
      return;
    }
    this.live.set(id, [p, q]);
    this.recorder.pose(this.time, id, p, q);
    this.poseDirect(id, p, q);
  }

  private poseDirect(id: number, p: Vec3, q: Quat) {
    if (id < KING_ID_BASE) {
      this.blocks.set(id, p, q);
      this.debris.moveProxy(id, p, q);
    } else if (id < 2000) {
      const k = this.kings.get(id - KING_ID_BASE);
      if (k) {
        k.position.set(p[0], p[1], p[2]);
        k.quaternion.set(q[0], q[1], q[2], q[3]);
      }
    } else {
      const pr = this.projs.get(id);
      if (pr) {
        pr.p.set(p[0], p[1], p[2]);
        pr.obj.position.copy(pr.p);
        pr.obj.quaternion.set(q[0], q[1], q[2], q[3]);
      }
    }
  }

  addBlock(id: number, mat: MaterialId, size: Vec3, p: Vec3, q: Quat) {
    this.blocks.add(id, mat, size, p, q);
    this.debris.addProxy(id, size, p, q);
  }

  removeBlock(id: number) {
    this.blocks.remove(id);
    this.debris.removeProxy(id);
  }

  onEvent(fn: (e: SimEvent) => void) {
    this.listeners.push(fn);
  }

  // Evento en directo.
  apply(e: SimEvent) {
    if (this.replaying) {
      this.pendingLive.push(e);
      return;
    }
    this.recorder.event(this.time, e);
    if (e.e === 'rm' || e.e === 'projEnd') this.live.delete(e.id);
    this.applyDirect(e);
  }

  private applyDirect(e: SimEvent) {
    for (const fn of this.listeners) fn(e);
    if (e.e === 'hit' && e.f > 300) this.startle(e.p, 4);
    else if (e.e === 'boom') this.startle(e.p, e.r + 3);
    else if (e.e === 'rm' && e.why === 'frac') this.startle(e.p, 3);
    switch (e.e) {
      case 'rm':
        this.removeBlock(e.id);
        if (e.why === 'frac') {
          // Cada bloque roto suma temblor: cuanto más destrozo, más tiembla (WRK-TASK-032).
          this.shake = Math.min(1.3, this.shake + 0.035);
          this.debris.burst(e.mat, e.size, e.p, e.q, e.v, e.seed, blockTint(e.id, e.mat));
          this.fx.shatter(e.p, e.mat);
          this.fx.rubble(e.p);
        } else if (e.why === 'melt') this.fx.fire(e.p, 6);
        break;
      case 'spawn':
        this.addBlock(e.id, e.mat, e.size, e.p, e.q);
        this.fx.dust(e.p, 3, '#f4a261', 0.3);
        break;
      case 'hit':
        if (e.f > 600) this.fx.dust(e.p, 2, e.mat === 'wood' ? '#d9b98c' : '#cfc6b8', 0.3);
        break;
      case 'boom':
        this.fx.boom(e.p, e.r, e.kind);
        this.shake = Math.min(1.2, this.shake + e.r * (e.kind === 'peck' || e.kind === 'egg' || e.kind === 'coco' ? 0.05 : 0.18));
        break;
      case 'proj': {
        const obj = makeProjectile(e.ammo, e.scale ?? 1);
        obj.position.set(...e.p);
        this.root.add(obj);
        this.projs.set(e.id, { id: e.id, ammo: e.ammo, owner: e.owner, obj, p: new THREE.Vector3(...e.p), born: this.time, scale: e.scale ?? 1 });
        break;
      }
      case 'projEnd': {
        const pr = this.projs.get(e.id);
        if (pr) {
          this.root.remove(pr.obj);
          this.projs.delete(e.id);
          if (pr.ammo === 'snowball') this.fx.snow([pr.p.x, pr.p.y, pr.p.z], 10);
        }
        break;
      }
      case 'grow': {
        const pr = this.projs.get(e.id);
        if (pr) pr.obj.scale.setScalar(e.r);
        break;
      }
      case 'king': {
        this.kingAlive.set(e.slot, false);
        const k = this.kings.get(e.slot);
        const p = k ? k.position : new THREE.Vector3(...castleOrigin(e.slot));
        this.fx.confetti([p.x, p.y + 0.5, p.z], [PLAYER_STYLES[e.slot].color, '#ffd23f', '#ffffff']);
        this.fx.dust([p.x, p.y, p.z], 10, '#ffffff', 0.5);
        const crown = k?.getObjectByName('crown');
        if (crown) crown.visible = false;
        this.shake = Math.min(1.5, this.shake + 0.5);
        break;
      }
      case 'fx':
        this.fxEvent(e.kind, e.p, e.slot);
        break;
      case 'shield':
        this.setShield(e.slot, e.on);
        break;
      case 'joint':
        this.fx.dust(e.p, 1, '#cbbfa8', 0.22);
        break;
      case 'dmg':
        this.blocks.setDamage(e.id, e.d);
        break;
    }
  }

  private fxEvent(kind: string, p: Vec3, slot?: number) {
    switch (kind) {
      case 'split':
        this.fx.dust(p, 4, '#8b5a2b', 0.3);
        break;
      case 'fire':
        if (slot !== undefined) this.catapults.get(slot)?.fire();
        break;
      case 'stick':
        this.fx.dust(p, 4, '#e03131', 0.25);
        break;
      case 'cluck':
        this.fx.feathers(p);
        break;
      case 'pianoMark': {
        const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.3, 24), toon('#e63946', { emissive: '#e63946', side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(p[0], Math.max(p[1] - 1.4, 0.06), p[2]);
        this.root.add(ring);
        this.markers.push({ obj: ring, until: this.time + 2.8 });
        break;
      }
      case 'blackhole':
      case 'magnet': {
        const col = kind === 'blackhole' ? '#7b2cbf' : '#e63946';
        const m = new THREE.Mesh(kind === 'blackhole' ? new THREE.SphereGeometry(0.8, 16, 12) : new THREE.TorusGeometry(1, 0.15, 8, 24), toon(kind === 'blackhole' ? '#10002b' : col, { emissive: col }));
        m.position.set(...p);
        m.userData.spin = kind;
        this.root.add(m);
        this.markers.push({ obj: m, until: this.time + (kind === 'blackhole' ? 2.2 : 2.6) });
        break;
      }
      case 'build':
        if (slot !== undefined) this.fx.dust(castleOrigin(slot), 14, '#f4a261', 0.6);
        break;
      case 'kingGuard':
        // El escudo real acaba de salvar a este rey.
        this.fx.sparks(p, '#ffd23f', 24);
        this.fx.ring([p[0], p[1] + 0.3, p[2]], 1.2, '#ffe8a3');
        break;
      case 'kingHome':
        this.fx.dust(p, 8, '#fff4d6', 0.45);
        this.fx.sparks([p[0], p[1] + 0.5, p[2]], '#ffd23f', 16);
        break;
      case 'pop':
        this.fx.sparks(p, '#72ddf7', 20);
        break;
      case 'kingGone':
        if (slot !== undefined) {
          const k = this.kings.get(slot);
          if (k) k.visible = false;
        }
        break;
    }
  }

  // Enciende o apaga el escudo real. Se puede llamar en cada fotograma: solo actúa si cambia.
  setKingGuard(on: boolean) {
    if (on === this.guard.on) return;
    this.guard.on = on;
    if (on && !this.guard.objs.size) {
      const halo = new THREE.MeshBasicMaterial({ color: '#ffd23f', toneMapped: false });
      this.guard.beam = new THREE.MeshBasicMaterial({ color: '#fff4c4', transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
      const ringGeo = new THREE.TorusGeometry(0.3, 0.045, 8, 28);
      const beamGeo = new THREE.CylinderGeometry(0.45, 0.8, 8, 18, 1, true);
      for (const slot of this.kings.keys()) {
        const g = new THREE.Group();
        const ring = new THREE.Mesh(ringGeo, halo);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.95;
        ring.name = 'halo';
        const beam = new THREE.Mesh(beamGeo, this.guard.beam);
        beam.position.y = 4.1;
        beam.renderOrder = 3;
        g.add(ring, beam);
        g.name = 'king-guard';
        this.root.add(g);
        this.guard.objs.set(slot, g);
      }
    }
    for (const g of this.guard.objs.values()) g.visible = on;
  }

  // Número de reyes con el escudo a la vista (para las pruebas).
  get guardedKings() {
    let n = 0;
    for (const g of this.guard.objs.values()) if (g.visible) n++;
    return n;
  }

  // Asusta a los reyes vivos que están a menos de `r` metros de p.
  private startle(p: Vec3, r: number) {
    for (const [slot, k] of this.kings) {
      if (!this.kingAlive.get(slot)) continue;
      const dx = k.position.x - p[0];
      const dy = k.position.y - p[1];
      const dz = k.position.z - p[2];
      if (dx * dx + dy * dy + dz * dz > r * r) continue;
      const a = this.kingAnim.get(slot) ?? { scare: 0, faint: 0 };
      if (a.scare < 0.3) a.scare = SCARE_TIME;
      this.kingAnim.set(slot, a);
    }
  }

  // Brazos arriba y cabeza que tiembla al asustarse; de espaldas al suelo al caer. Solo mueve las
  // piezas del modelo, nunca el rey entero (su posición es la de la física).
  private animateKings(dt: number, t: number) {
    for (const [slot, k] of this.kings) {
      if (!k.visible) continue;
      const a = this.kingAnim.get(slot) ?? { scare: 0, faint: 0 };
      this.kingAnim.set(slot, a);
      const alive = this.kingAlive.get(slot) ?? false;
      // Un proyectil que pasa cerca también asusta.
      if (alive && a.scare < 0.3) for (const pr of this.projs.values()) if (pr.p.distanceToSquared(k.position) < 3.5 * 3.5) a.scare = SCARE_TIME;
      a.scare = Math.max(0, a.scare - dt);
      a.faint += ((alive ? 0 : 1) - a.faint) * Math.min(1, dt * 5);
      const u = k.userData as { rig?: THREE.Object3D; head?: THREE.Object3D; armL?: THREE.Object3D; armR?: THREE.Object3D };
      if (!u.rig) {
        u.rig = k.getObjectByName('rig');
        u.head = k.getObjectByName('head');
        u.armL = k.getObjectByName('armL');
        u.armR = k.getObjectByName('armR');
      }
      if (!u.rig || !u.head || !u.armL || !u.armR) continue;
      // Susto: sube rápido y baja despacio.
      const s = a.scare > 0 ? Math.min(1, (SCARE_TIME - a.scare) * 10) * Math.min(1, a.scare / 0.45) : 0;
      // El desmayo solo tumba al rey en la medida en que la cápsula sigue de pie: si la física ya
      // lo ha tumbado, no se tumba dos veces.
      const up = 1 - 2 * (k.quaternion.x * k.quaternion.x + k.quaternion.z * k.quaternion.z);
      const f = a.faint * Math.max(0, up);
      const arm = 0.35 + s * 2.2 + a.faint * 0.9;
      u.armL.rotation.z = -arm;
      u.armR.rotation.z = arm;
      u.armL.rotation.x = u.armR.rotation.x = -s * 0.3 + Math.sin(t * 2 + slot) * 0.05 * (1 - s);
      u.head.rotation.y = Math.sin(t * 32) * 0.28 * s;
      u.head.rotation.z = f * 0.5;
      u.head.position.y = KING_NECK + Math.sin(t * 2.2 + slot) * 0.012;
      u.rig.position.y = -(KING_HALF_HEIGHT + KING_RADIUS) + Math.abs(Math.sin(t * 16)) * 0.07 * s;
      u.rig.rotation.x = -f * 1.35;
    }
  }

  private updateGuard(t: number) {
    if (!this.guard.on) return;
    const cam = this.stage.camera.position;
    if (this.guard.beam) this.guard.beam.opacity = 0.32 + Math.sin(t * 2.4) * 0.08;
    for (const [slot, g] of this.guard.objs) {
      const k = this.kings.get(slot);
      g.visible = !!k && k.visible && (this.kingAlive.get(slot) ?? false);
      if (!k || !g.visible) continue;
      // Sigue al rey sin girar con él (el rey rueda al caer; el halo, no).
      g.position.copy(k.position);
      g.children[0].rotation.z = t * 1.5;
      // La columna de tu propio rey, junto a la cámara al apuntar, taparía media pantalla.
      g.children[1].visible = k.position.distanceTo(cam) > 16;
    }
  }

  // Dianas del objetivo secundario sobre los castillos rivales (WRK-TASK-043): se ven a través de
  // los muros y miran siempre a la cámara. Se puede llamar en cada fotograma.
  private goalMarks: THREE.Object3D[] = [];
  private goalKey = '';
  setGoalMarks(points: Vec3[]) {
    const key = points.map((p) => p.map((x) => x.toFixed(1)).join(',')).join(';');
    if (key === this.goalKey) return;
    this.goalKey = key;
    for (const m of this.goalMarks) this.root.remove(m);
    this.goalMarks = points.map((p) => {
      const g = new THREE.Group();
      const mat = (c: string) => new THREE.MeshBasicMaterial({ color: c, depthTest: false, transparent: true, opacity: 0.9, side: THREE.DoubleSide, toneMapped: false });
      g.add(new THREE.Mesh(new THREE.RingGeometry(0.75, 0.95, 32), mat('#ffffff')));
      g.add(new THREE.Mesh(new THREE.RingGeometry(0.4, 0.58, 32), mat('#e63946')));
      g.add(new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), mat('#e63946')));
      g.position.set(...p);
      g.renderOrder = 6;
      for (const c of g.children) c.renderOrder = 6;
      g.name = 'goal-mark';
      this.root.add(g);
      return g;
    });
  }

  get goalMarkCount() {
    return this.goalMarks.length;
  }

  private updateGoalMarks(t: number) {
    const cam = this.stage.camera.position;
    for (const g of this.goalMarks) {
      g.lookAt(cam);
      g.scale.setScalar(1 + Math.sin(t * 4) * 0.08);
    }
  }

  setShield(slot: number, on: boolean) {
    const cur = this.shields.get(slot);
    if (!on) {
      if (cur) this.root.remove(cur);
      this.shields.delete(slot);
      return;
    }
    if (cur) return;
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(SHIELD_RADIUS, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshToonMaterial({ color: '#72ddf7', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, emissive: '#1a7fa0' }),
    );
    const o = castleOrigin(slot);
    m.position.set(o[0], 0, o[2]);
    m.renderOrder = 3;
    this.root.add(m);
    this.shields.set(slot, m);
  }

  update(dt: number) {
    this.time += dt;
    this.debris.lavaY = this.lavaY;
    this.debris.step(dt);
    this.blocks.flush();
    this.fx.update(dt);
    const t = this.time;
    for (const c of this.catapults.values()) c.update(dt, t);
    for (const pr of this.projs.values()) {
      // Estelas y detalles por munición.
      const col = AMMO[pr.ammo].color;
      if (Math.random() < 0.5) this.fx.trail([pr.p.x, pr.p.y, pr.p.z], pr.ammo === 'blackhole' ? '#7b2cbf' : col);
      if (pr.ammo === 'chicken') pr.obj.children.forEach((c) => c.name === 'wing' && (c.rotation.x = Math.sin(t * 30) * 0.8));
      if (pr.ammo === 'snowball' && Math.random() < 0.3) this.fx.snow([pr.p.x, pr.p.y, pr.p.z]);
    }
    this.markers = this.markers.filter((m) => {
      if (m.obj.userData.spin) m.obj.rotation.y += dt * 6;
      if (this.time > m.until) {
        this.root.remove(m.obj);
        return false;
      }
      return true;
    });
    for (const s of this.shields.values()) (s.material as THREE.MeshToonMaterial).opacity = 0.18 + Math.sin(t * 3) * 0.05;
    this.updateGuard(t);
    this.animateKings(dt, t);
    this.updateGoalMarks(t);
    this.shake = Math.max(0, this.shake - dt * 1.8);
  }

  // ---------- repetición ----------

  // Empieza a reproducir [t0, t1] de lo grabado. Devuelve false si no hay nada grabado.
  startReplay(t0: number, t1: number, speed: number, slots: number[]) {
    this.endReplay();
    const player = new ReplayPlayer(this.recorder, t0, t1, speed);
    const since = this.recorder.eventsBetween(t0, this.time);
    if (!player.initialPoses().size && !since.length) return false;
    const undo: (() => void)[] = [];
    const first = player.initialPoses();
    // Bloques que se rompieron desde t0: vuelven a su sitio (la repetición los romperá otra
    // vez en su momento). Los que se rompan después de t1 se quitan al terminar.
    for (const x of since) {
      const e = x.e;
      if (e.e === 'rm') {
        const f = first.get(e.id);
        this.addBlock(e.id, e.mat, e.size, f?.p ?? e.p, f?.q ?? e.q);
        if (x.t > t1) undo.push(() => this.removeBlock(e.id));
      } else if (e.e === 'spawn') {
        this.removeBlock(e.id);
        if (x.t > t1) undo.push(() => this.addBlock(e.id, e.mat, e.size, e.p, e.q));
      }
    }
    // Proyectiles: fuera los de ahora y dentro los que volaban en t0.
    for (const pr of [...this.projs.values()]) this.applyDirect({ e: 'projEnd', id: pr.id });
    const ended = new Set(this.recorder.eventsBetween(t0 - 15, t0).flatMap((x) => (x.e.e === 'projEnd' ? [x.e.id] : [])));
    for (const x of this.recorder.eventsBetween(t0 - 15, t0)) if (x.e.e === 'proj' && !ended.has(x.e.id)) this.applyDirect(x.e);
    // Reyes que van a caer: otra vez vivos, con corona.
    for (const slot of slots) {
      const k = this.kings.get(slot);
      if (!k) continue;
      const crown = k.getObjectByName('crown');
      const was = { alive: this.kingAlive.get(slot) ?? false, visible: k.visible, crown: crown?.visible ?? true };
      this.kingAlive.set(slot, true);
      k.visible = true;
      if (crown) crown.visible = true;
      undo.push(() => {
        this.kingAlive.set(slot, was.alive);
        k.visible = was.visible;
        if (crown) crown.visible = was.crown;
      });
    }
    for (const [id, f] of first) this.poseDirect(id, f.p, f.q);
    this.replayUndo = undo;
    this.replaying = player;
    return true;
  }

  // Avanza la repetición en curso (llamar cada fotograma).
  stepReplay(dt: number) {
    const r = this.replaying;
    if (!r) return;
    r.step(dt, {
      time: this.time,
      applyPose: (id, p, q) => this.poseDirect(id, p, q),
      // El daño y los escudos son estado, no espectáculo: se quedan como están ahora.
      applyEvent: (e) => e.e !== 'dmg' && e.e !== 'shield' && this.applyDirect(e),
    });
  }

  // Vuelve al directo: poses, bloques, reyes y lo que haya llegado mientras tanto.
  endReplay() {
    if (!this.replaying) return;
    this.replaying = null;
    for (const pr of [...this.projs.values()]) this.applyDirect({ e: 'projEnd', id: pr.id });
    for (const fn of this.replayUndo) fn();
    this.replayUndo = [];
    for (const [id, pq] of this.liveDuring) this.live.set(id, pq);
    this.liveDuring.clear();
    for (const [id, [p, q]] of this.live) this.poseDirect(id, p, q);
    const pending = this.pendingLive;
    this.pendingLive = [];
    for (const e of pending) this.apply(e);
  }

  // ---------- foto del escenario (mejor disparo, WRK-TASK-047) ----------

  // Bloques y reyes tal como están ahora, para volver a ponerlos más tarde.
  snapshot(): ViewSnapshot {
    const blocks: ViewSnapshot['blocks'] = [];
    for (const [id, it] of this.blocks.items) blocks.push({ id, mat: it.mat, size: it.size, p: it.p, q: it.q });
    const kings: ViewSnapshot['kings'] = [];
    for (const [slot, k] of this.kings) {
      kings.push({ slot, p: [k.position.x, k.position.y, k.position.z], q: [k.quaternion.x, k.quaternion.y, k.quaternion.z, k.quaternion.w], alive: this.kingAlive.get(slot) ?? false, visible: k.visible, crown: k.getObjectByName('crown')?.visible ?? true });
    }
    return { blocks, kings };
  }

  restoreSnapshot(s: ViewSnapshot) {
    for (const pr of [...this.projs.values()]) this.applyDirect({ e: 'projEnd', id: pr.id });
    this.blocks.clear();
    this.debris.clear();
    for (const b of s.blocks) this.addBlock(b.id, b.mat, b.size, b.p, b.q);
    for (const k of s.kings) {
      const obj = this.kings.get(k.slot);
      if (!obj) continue;
      obj.position.set(...k.p);
      obj.quaternion.set(...k.q);
      obj.visible = k.visible;
      const crown = obj.getObjectByName('crown');
      if (crown) crown.visible = k.crown;
      this.kingAlive.set(k.slot, k.alive);
    }
  }

  // Reproduce un tramo guardado sobre la foto que ya se ha puesto (restoreSnapshot). Al terminar,
  // `endReplay` vuelve al directo y quien la pidió pone la foto del final.
  startClip(clip: ReplayClip, speed: number) {
    this.endReplay();
    const player = new ReplayPlayer(clip, clip.t0, clip.t1, speed);
    for (const [id, f] of player.initialPoses()) this.poseDirect(id, f.p, f.q);
    this.replayUndo = [];
    this.replaying = player;
  }

  blockCount(slot?: number) {
    return slot === undefined ? this.blocks.count() : this.blocks.count(slotOfBlock, slot);
  }

  kingPos(slot: number): THREE.Vector3 | null {
    return this.kings.get(slot)?.position ?? null;
  }
}

export { kingId };
