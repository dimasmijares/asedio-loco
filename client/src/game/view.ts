import * as THREE from 'three';
import { AMMO, type AmmoId } from '../../../shared/ammo';
import { buildCastle, kingId, slotOfBlock, KING_ID_BASE } from '../../../shared/castle';
import { CATAPULT_LOCAL, castleOrigin, toWorld } from '../../../shared/map';
import type { MaterialId } from '../../../shared/materials';
import type { Quat, Vec3 } from '../../../shared/math';
import { PLAYER_STYLES } from '../../../shared/players';
import { BlockMeshes } from './render/blocks';
import { Fx } from './render/fx';
import { toon } from './render/materials';
import { Catapult, makeKing, makeProjectile } from './render/models';
import type { Stage } from './render/stage';
import { Debris } from './sim/debris';
import { ReplayPlayer, ReplayRecorder } from './replay';
import { SHIELD_RADIUS, type SimEvent } from './sim/sim';

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
export class WorldView {
  root = new THREE.Group();
  blocks: BlockMeshes;
  debris: Debris;
  fx: Fx;
  catapults = new Map<number, Catapult>();
  kings = new Map<number, THREE.Object3D>();
  kingAlive = new Map<number, boolean>();
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

  constructor(readonly stage: Stage, readonly slots: number[]) {
    stage.scene.add(this.root);
    const shadows = stage.quality !== 'low';
    this.blocks = new BlockMeshes(this.root, 520, 0.035, shadows);
    this.debris = new Debris(this.root, stage.quality === 'high' ? 260 : stage.quality === 'medium' ? 170 : 90, shadows);
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
    for (const k of this.kings.values()) this.root.remove(k);
    this.kings.clear();
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
    switch (e.e) {
      case 'rm':
        this.removeBlock(e.id);
        if (e.why === 'frac') {
          this.debris.burst(e.mat, e.size, e.p, e.q, e.v, e.seed);
          this.fx.shatter(e.p, e.mat);
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
        this.shake = Math.min(1.2, this.shake + e.r * (e.kind === 'peck' ? 0.05 : 0.18));
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

  blockCount(slot?: number) {
    return slot === undefined ? this.blocks.count() : this.blocks.count(slotOfBlock, slot);
  }

  kingPos(slot: number): THREE.Vector3 | null {
    return this.kings.get(slot)?.position ?? null;
  }
}

export { kingId };
