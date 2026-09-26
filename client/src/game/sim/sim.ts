import { AMMO, type AmmoDef, type AmmoId } from '../../../../shared/ammo';
import { launchVelocity, aeroAccel, type Aim } from '../../../../shared/ballistics';
import { KING_HALF_HEIGHT, KING_RADIUS, buildCastle, kingId, slotOfBlock, type BlockDef } from '../../../../shared/castle';
import { CASTLE_HALF, castleOrigin, insideCastle, islandSdf, launchPoint } from '../../../../shared/map';
import { addIslandColliders } from './island';
import { CHIP_RATIO, MATERIALS, type Material, type MaterialId } from '../../../../shared/materials';
import { type Quat, type Vec3, v3 } from '../../../../shared/math';
import { RAPIER, type Collider, type ImpulseJoint, type RigidBody, type World } from './rapier';
import { behaviorFor, type ProjectileBehavior } from './projectiles';

export const DT = 1 / 60;
const LAVA_FLOOR_HALF = 2;
const LAVA_SINK_SPEED = 0.6; // m/s a los que se hunde lo que se come la lava
// Grupos de colisión de Rapier: 16 bits de pertenencia << 16 | 16 bits de filtro.
// El suelo de lava pertenece al grupo 2; los bloques que se está comiendo lo excluyen.
const FLOOR_GROUPS = (0x0002 << 16) | 0xffff;
const DOOMED_GROUPS = (0x0001 << 16) | 0xfffd;
const KING_CRUSH_FORCE = 600;
const JOINT_STRAIN = 0.07; // m de separación entre anclajes que rompe una unión
export const SHIELD_RADIUS = 7.2;

export type RemoveWhy = 'frac' | 'melt' | 'void' | 'eat';
export type KingCause = 'crushed' | 'fell' | 'lava' | 'outside';

export type SimEvent =
  | { e: 'rm'; id: number; why: RemoveWhy; p: Vec3; q: Quat; v: Vec3; mat: MaterialId; size: Vec3; seed: number }
  | { e: 'spawn'; id: number; mat: MaterialId; size: Vec3; p: Vec3; q: Quat; slot: number }
  | { e: 'hit'; p: Vec3; f: number; mat: MaterialId | 'king' | 'ground' }
  | { e: 'boom'; p: Vec3; r: number; kind: string }
  | { e: 'proj'; id: number; ammo: AmmoId; owner: number; p: Vec3; scale?: number }
  | { e: 'projEnd'; id: number; p?: Vec3 }
  | { e: 'king'; slot: number; cause: KingCause; by: number }
  | { e: 'joint'; p: Vec3 }
  | { e: 'fx'; kind: string; p: Vec3; id?: number; slot?: number }
  | { e: 'shield'; slot: number; on: boolean }
  | { e: 'grow'; id: number; r: number }
  | { e: 'dmg'; id: number; d: number };

export interface Joint {
  a: Rec;
  b: Rec;
  j: ImpulseJoint;
  la: Vec3; // anclaje en coordenadas locales de a
  lb: Vec3;
  strength: number;
  broken: boolean;
}

export interface Rec {
  id: number;
  kind: 'block' | 'king' | 'proj';
  body: RigidBody;
  col: Collider;
  slot: number;
  size: Vec3;
  mat?: Material;
  damage: number;
  joints: Joint[];
  lavaT: number;
  lastHitBy: number; // jugador responsable del último golpe (-1 si nadie)
  dead?: boolean;
  doomed?: boolean; // la lava se lo está comiendo
  // Proyectiles
  ammo?: AmmoDef;
  behavior?: ProjectileBehavior;
  born?: number;
}

export interface Field {
  kind: 'blackhole' | 'magnet';
  p: Vec3;
  until: number;
  radius: number;
  strength: number;
  owner: number;
}

export interface KingInfo {
  slot: number;
  alive: boolean;
  cause?: KingCause;
  by?: number;
}

export interface Stats {
  destroyed: number[]; // bloques destruidos por cada jugador
  lost: number[]; // bloques perdidos por cada castillo
  self: number[]; // bloques propios rotos por el propio jugador (autogoles)
}

const rotYExtent = (q: Quat, h: Vec3) => {
  const [x, y, z, w] = q;
  return Math.abs(2 * (x * y + w * z)) * h[0] + Math.abs(1 - 2 * (x * x + z * z)) * h[1] + Math.abs(2 * (y * z - w * x)) * h[2];
};

const tv = (v: { x: number; y: number; z: number }): Vec3 => [v.x, v.y, v.z];
const tq = (q: { x: number; y: number; z: number; w: number }): Quat => [q.x, q.y, q.z, q.w];
const rv = (v: Vec3) => ({ x: v[0], y: v[1], z: v[2] });
const rq = (q: Quat) => ({ x: q[0], y: q[1], z: q[2], w: q[3] });

function rotate(q: Quat, v: Vec3): Vec3 {
  const [x, y, z, w] = q;
  const ix = w * v[0] + y * v[2] - z * v[1];
  const iy = w * v[1] + z * v[0] - x * v[2];
  const iz = w * v[2] + x * v[1] - y * v[0];
  const iw = -x * v[0] - y * v[1] - z * v[2];
  return [ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x];
}

function invRotate(q: Quat, v: Vec3): Vec3 {
  return rotate([-q[0], -q[1], -q[2], q[3]], v);
}

// Simulación autoritativa. Solo la ejecuta el anfitrión (o el jugador en solitario).
export class Sim {
  world: World;
  eq: InstanceType<typeof RAPIER.EventQueue>;
  recs = new Map<number, Rec>();
  byHandle = new Map<number, Rec>();
  staticHandles = new Set<number>();
  kings = new Map<number, KingInfo>();
  fields: Field[] = [];
  shields = new Map<number, number>(); // slot → impactos que aún absorbe
  events: SimEvent[] = [];
  time = 0;
  lavaY = -3.6;
  wind: Vec3 = [0, 0, 0];
  breaking = true;
  stats: Stats = { destroyed: [0, 0, 0, 0], lost: [0, 0, 0, 0], self: [0, 0, 0, 0] };
  private nextProj = 2000;
  private fracSeed = 1;
  private pendingFrac = new Map<Rec, Vec3 | null>();
  private pendingJointBreak = new Set<Joint>();
  private forced = new Set<Rec>();
  private stepN = 0;
  private timers: { at: number; fn: () => void }[] = [];
  private hitCooldown = new Map<number, number>();
  private preVel = new Map<number, Vec3>(); // velocidad antes del paso (para distinguir golpes de cargas)
  private plow = new Set<Rec>(); // proyectiles que han roto algo este paso y lo atraviesan
  private lavaFloor!: RigidBody;

  constructor(readonly slots: number[]) {
    const R = RAPIER;
    this.world = new R.World({ x: 0, y: -9.81, z: 0 });
    this.world.integrationParameters.numSolverIterations = 6;
    this.eq = new R.EventQueue(true);
    this.buildIsland();
    for (const slot of slots) {
      const c = buildCastle(slot);
      for (const b of c.blocks) this.addBlock(b);
      for (const [a, b] of c.joints) this.addJoint(this.recs.get(a)!, this.recs.get(b)!);
      this.addKing(slot, c.kingPos);
    }
  }

  // ---------- construcción ----------

  private buildIsland() {
    for (const h of addIslandColliders(this.world)) this.staticHandles.add(h);
    // Superficie de la lava como suelo físico (sube con cada nivel).
    const R = RAPIER;
    this.lavaFloor = this.world.createRigidBody(R.RigidBodyDesc.fixed().setTranslation(0, this.lavaY - LAVA_FLOOR_HALF, 0));
    const c = this.world.createCollider(R.ColliderDesc.cuboid(160, LAVA_FLOOR_HALF, 160).setFriction(1).setCollisionGroups(FLOOR_GROUPS), this.lavaFloor);
    this.staticHandles.add(c.handle);
  }

  addBlock(b: BlockDef, wake = false): Rec {
    const R = RAPIER;
    const m = MATERIALS[b.mat];
    const body = this.world.createRigidBody(
      R.RigidBodyDesc.dynamic()
        .setTranslation(b.p[0], b.p[1], b.p[2])
        .setRotation(rq(b.q))
        .setLinearDamping(0.05)
        .setAngularDamping(0.25)
        .setCanSleep(true)
        .setSleeping(!wake),
    );
    const col = this.world.createCollider(
      R.ColliderDesc.cuboid(b.size[0] / 2, b.size[1] / 2, b.size[2] / 2)
        .setDensity(m.density)
        .setFriction(m.friction)
        .setRestitution(m.restitution)
        .setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS)
        .setContactForceEventThreshold(m.breakForce * CHIP_RATIO * 0.5),
      body,
    );
    const rec: Rec = { id: b.id, kind: 'block', body, col, slot: b.slot, size: b.size, mat: m, damage: 0, joints: [], lavaT: 0, lastHitBy: -1 };
    this.recs.set(b.id, rec);
    this.byHandle.set(col.handle, rec);
    return rec;
  }

  addJoint(a: Rec, b: Rec) {
    const R = RAPIER;
    const pa = tv(a.body.translation());
    const pb = tv(b.body.translation());
    const qa = tq(a.body.rotation());
    const qb = tq(b.body.rotation());
    const mid: Vec3 = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2, (pa[2] + pb[2]) / 2];
    const la = invRotate(qa, v3.sub(mid, pa));
    const lb = invRotate(qb, v3.sub(mid, pb));
    // Mismo marco relativo: la unión conserva la orientación actual entre ambos bloques.
    const j = this.world.createImpulseJoint(R.JointData.fixed(rv(la), rq([0, 0, 0, 1]), rv(lb), rq(this.relRot(qa, qb))), a.body, b.body, false);
    // Sin contacto entre piezas unidas: si no, unión y contacto se pelean y generan fuerzas enormes.
    j.setContactsEnabled(false);
    const strength = Math.min(a.mat!.breakForce, b.mat!.breakForce) * 0.9;
    const joint: Joint = { a, b, j, la, lb, strength, broken: false };
    a.joints.push(joint);
    b.joints.push(joint);
    for (const r of [a, b]) r.col.setContactForceEventThreshold(Math.min(r.mat!.breakForce * CHIP_RATIO * 0.5, strength * 0.8));
  }

  // Rotación de b expresada en el marco de a: frame2 tal que qa·I = qb·frame2 ⇒ frame2 = qb⁻¹·qa.
  private relRot(qa: Quat, qb: Quat): Quat {
    const [x, y, z, w] = [-qb[0], -qb[1], -qb[2], qb[3]];
    const [bx, by, bz, bw] = qa;
    return [w * bx + x * bw + y * bz - z * by, w * by - x * bz + y * bw + z * bx, w * bz + x * by - y * bx + z * bw, w * bw - x * bx - y * by - z * bz];
  }

  // Reconstruye una simulación a partir de lo que ve un cliente (migración de anfitrión):
  // bloques donde están ahora, uniones del plano que sigan intactas y reyes vivos.
  static restore(slots: number[], blocks: { id: number; mat: MaterialId; size: Vec3; p: Vec3; q: Quat }[], kings: { slot: number; p: Vec3; q: Quat; alive: boolean }[], lavaY: number) {
    const sim = new Sim([]);
    for (const b of blocks) sim.addBlock({ ...b, slot: slotOfBlock(b.id), part: 'wall' });
    for (const slot of slots) {
      for (const [a, b] of buildCastle(slot).joints) {
        const ra = sim.recs.get(a);
        const rb = sim.recs.get(b);
        if (!ra || !rb) continue;
        // Solo si siguen casi como en el plano relativo (no se habían separado).
        const def = buildCastle(slot).blocks;
        const da = def.find((x) => x.id === a)!;
        const db = def.find((x) => x.id === b)!;
        const d0 = v3.dist(da.p, db.p);
        if (Math.abs(v3.dist(sim.pos(ra), sim.pos(rb)) - d0) < 0.05) sim.addJoint(ra, rb);
      }
    }
    for (const k of kings) {
      if (!k.alive) continue;
      sim.addKing(k.slot, k.p, k.q);
    }
    for (const slot of slots) if (!sim.kings.has(slot)) sim.kings.set(slot, { slot, alive: false });
    sim.lavaY = lavaY;
    sim.lavaFloor.setTranslation({ x: 0, y: lavaY - LAVA_FLOOR_HALF, z: 0 }, true);
    sim.settle(0.3);
    return sim;
  }

  private addKing(slot: number, p: Vec3, q: Quat = [0, 0, 0, 1]) {
    const R = RAPIER;
    const body = this.world.createRigidBody(
      R.RigidBodyDesc.dynamic().setTranslation(p[0], p[1], p[2]).setRotation(rq(q)).setLinearDamping(0.1).setAngularDamping(0.6).setSleeping(true),
    );
    const col = this.world.createCollider(
      R.ColliderDesc.capsule(KING_HALF_HEIGHT, KING_RADIUS)
        .setDensity(1.4)
        .setFriction(0.8)
        .setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS)
        .setContactForceEventThreshold(KING_CRUSH_FORCE * 0.4),
      body,
    );
    const rec: Rec = { id: kingId(slot), kind: 'king', body, col, slot, size: [KING_RADIUS * 2, KING_HALF_HEIGHT * 2 + KING_RADIUS * 2, KING_RADIUS * 2], damage: 0, joints: [], lavaT: 0, lastHitBy: -1 };
    this.recs.set(rec.id, rec);
    this.byHandle.set(col.handle, rec);
    this.kings.set(slot, { slot, alive: true });
  }

  // Deja que los castillos se asienten sin romper nada. No se duermen a mano: si se
  // fuerza el sueño cuerpo a cuerpo y luego solo se despierta una parte, Rapier los trata
  // de forma incoherente y el castillo se derrumba solo. Se dejan quietos y Rapier los duerme.
  settle(seconds = 1.2) {
    const was = this.breaking;
    this.breaking = false;
    for (const r of this.recs.values()) r.body.wakeUp();
    for (let t = 0; t < seconds; t += DT) this.step();
    for (const r of this.recs.values()) {
      r.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      r.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      r.damage = 0;
    }
    for (let t = 0; t < 4; t += DT) {
      this.step();
      let awake = false;
      for (const r of this.recs.values()) if (!r.body.isSleeping()) (awake = true);
      if (!awake) break;
    }
    this.events = [];
    this.breaking = was;
  }

  // ---------- consultas ----------

  pos(r: Rec): Vec3 {
    return tv(r.body.translation());
  }

  blocksAlive(slot: number) {
    let n = 0;
    for (const r of this.recs.values()) if (r.kind === 'block' && r.slot === slot) n++;
    return n;
  }

  aliveBlockIds(slot: number): Set<number> {
    const s = new Set<number>();
    for (const r of this.recs.values()) if (r.kind === 'block' && r.slot === slot) s.add(r.id);
    return s;
  }

  projectilesActive() {
    let n = 0;
    for (const r of this.recs.values()) if (r.kind === 'proj') n++;
    return n + this.fields.length;
  }

  // ¿Está todo quieto? (para terminar la fase de impacto)
  isSettled(): boolean {
    if (this.fields.length || this.timers.length) return false;
    for (const r of this.recs.values()) {
      if (r.kind === 'proj') return false;
      if (r.body.isSleeping()) continue;
      const v = r.body.linvel();
      if (v.x * v.x + v.y * v.y + v.z * v.z > 0.09) return false;
    }
    return true;
  }

  // ---------- disparos ----------

  launch(slot: number, ammoId: AmmoId, aim: Aim): number {
    const ammo = AMMO[ammoId];
    const p = launchPoint(slot);
    const v = launchVelocity(aim);
    return this.spawnProjectile(ammo, slot, p, v, { aim });
  }

  spawnProjectile(ammo: AmmoDef, owner: number, p: Vec3, v: Vec3, opts: { aim?: Aim; scale?: number; behavior?: ProjectileBehavior } = {}): number {
    const R = RAPIER;
    const id = this.nextProj++;
    const scale = opts.scale ?? 1;
    const beh = opts.behavior ?? behaviorFor(ammo.id, this, opts.aim);
    if (beh.onLaunch) {
      // Munición sin vuelo físico (defensiva, piano): actúa directamente.
      beh.onLaunch(owner);
      return id;
    }
    const desc = R.RigidBodyDesc.dynamic().setTranslation(p[0], p[1], p[2]).setLinvel(v[0], v[1], v[2]).setCcdEnabled(true).setCanSleep(false);
    const body = this.world.createRigidBody(desc);
    let cd: InstanceType<typeof R.ColliderDesc>;
    const r = ammo.radius * scale;
    if (ammo.shape === 'ball') cd = R.ColliderDesc.ball(r);
    else if (ammo.shape === 'log') {
      cd = R.ColliderDesc.cylinder(ammo.length! / 2, r);
      // El tronco vuela tumbado, perpendicular a la dirección de tiro, y girando.
      const yaw = Math.atan2(v[0], v[2]);
      const half = Math.PI / 4;
      const qz: Quat = [0, 0, Math.sin(half), Math.cos(half)];
      const qy: Quat = [0, Math.sin(yaw / 2), 0, Math.cos(yaw / 2)];
      body.setRotation(rq(mulQ(qy, qz)), false);
      const axis = v3.norm([Math.cos(yaw), 0, -Math.sin(yaw)]);
      body.setAngvel(rv(v3.scale(axis, 8)), false);
    } else cd = R.ColliderDesc.cuboid(ammo.length! / 2, r, r * 0.8);
    const col = this.world.createCollider(
      cd
        .setDensity(ammo.density)
        .setRestitution(ammo.restitution)
        .setFriction(ammo.friction)
        .setActiveEvents(R.ActiveEvents.COLLISION_EVENTS | R.ActiveEvents.CONTACT_FORCE_EVENTS)
        .setContactForceEventThreshold(40),
      body,
    );
    const size: Vec3 = ammo.shape === 'ball' ? [r * 2, r * 2, r * 2] : ammo.shape === 'log' ? [r * 2, ammo.length!, r * 2] : [ammo.length!, r * 2, r * 1.6];
    const rec: Rec = { id, kind: 'proj', body, col, slot: owner, size, damage: 0, joints: [], lavaT: 0, lastHitBy: owner, ammo, behavior: beh, born: this.time };
    this.recs.set(id, rec);
    this.byHandle.set(col.handle, rec);
    this.events.push({ e: 'proj', id, ammo: ammo.id, owner, p, scale: scale !== 1 ? scale : undefined });
    beh.onSpawn?.(rec);
    return id;
  }

  removeRec(r: Rec, why: RemoveWhy | 'proj') {
    if (!this.recs.has(r.id)) return;
    for (const j of r.joints) this.breakJoint(j, false);
    const p = tv(r.body.translation());
    const q = tq(r.body.rotation());
    const v = tv(r.body.linvel());
    this.recs.delete(r.id);
    this.byHandle.delete(r.col.handle);
    this.world.removeRigidBody(r.body);
    if (r.kind === 'proj') {
      this.events.push({ e: 'projEnd', id: r.id, p });
    } else if (r.kind === 'block' && why !== 'proj') {
      this.events.push({ e: 'rm', id: r.id, why, p, q, v, mat: r.mat!.id, size: r.size, seed: r.id * 7919 + this.fracSeed++ });
      this.stats.lost[r.slot]++;
      if (r.lastHitBy === r.slot) this.stats.self[r.slot]++;
      if (r.lastHitBy >= 0 && r.lastHitBy !== r.slot) this.stats.destroyed[r.lastHitBy]++;
    }
    this.wakeAround(p, Math.max(r.size[0], r.size[1], r.size[2]) * 0.75 + 0.4);
  }

  // Recoge los registros que tocan una bola. No se modifica el mundo dentro del callback
  // de la consulta: Rapier ignora en silencio los cambios hechos ahí.
  private recsInBall(p: Vec3, radius: number): Rec[] {
    const found: Rec[] = [];
    this.world.intersectionsWithShape(rv(p), rq([0, 0, 0, 1]), new RAPIER.Ball(radius), (c) => {
      const r = this.byHandle.get(c.handle);
      if (r) found.push(r);
      return true;
    });
    return found;
  }

  private wakeAround(p: Vec3, radius: number) {
    for (const r of this.recsInBall(p, radius)) r.body.wakeUp();
  }

  breakJoint(j: Joint, emit = true) {
    if (j.broken) return;
    j.broken = true;
    this.world.removeImpulseJoint(j.j, true);
    j.a.joints = j.a.joints.filter((x) => x !== j);
    j.b.joints = j.b.joints.filter((x) => x !== j);
    if (emit) this.events.push({ e: 'joint', p: v3.add(this.pos(j.a), rotate(tq(j.a.body.rotation()), j.la)) });
  }

  fractureBlock(r: Rec) {
    if (r.kind !== 'block' || !this.breaking) return;
    this.pendingFrac.set(r, null);
  }

  // Suma daño a un bloque y avisa a la vista (para oscurecerlo) cuando cambia de escalón.
  private addDamage(r: Rec, amount: number) {
    const before = Math.floor(r.damage * 5);
    r.damage += amount;
    if (r.damage >= 1) this.pendingFrac.set(r, null);
    else if (Math.floor(r.damage * 5) !== before) this.events.push({ e: 'dmg', id: r.id, d: Math.round(r.damage * 10) / 10 });
  }

  // ---------- explosiones y campos de fuerza ----------

  // Opciones:
  //   pierce  la carga está pegada o metida en el castillo; para los bloques, los que están a menos
  //           de esa distancia del centro no hacen de escudo (la sandía revienta desde dentro). Al
  //           rey lo siguen protegiendo.
  //   king    cuánto daño y empuje le da al rey (1 por defecto; los huevos de la gallina, menos).
  explode(p: Vec3, radius: number, strength: number, owner: number, kind = 'boom', { pierce = 0, king = 1 } = {}) {
    const R = RAPIER;
    this.events.push({ e: 'boom', p, r: radius, kind });
    const hits: Rec[] = [];
    this.world.intersectionsWithShape(rv(p), rq([0, 0, 0, 1]), new R.Ball(radius), (c) => {
      const r = this.byHandle.get(c.handle);
      if (r) hits.push(r);
      return true;
    });
    for (const r of hits) {
      if (!this.recs.has(r.id)) continue;
      if (r.kind !== 'proj' && this.shields.has(r.slot) && !insideShield(r.slot, p)) continue;
      const c = this.pos(r);
      const d = v3.sub(c, p);
      const dist = Math.max(0.3, v3.len(d));
      const falloff = Math.pow(Math.max(0, 1 - dist / radius), 1.4);
      if (falloff <= 0) continue;
      // Oclusión: si hay un bloque grueso entre la explosión y el objetivo, lo protege.
      const dir = v3.norm(d);
      let occl = 1;
      const hit = this.world.castRay(new R.Ray(rv(p), rv(dir)), dist - 0.3, true, undefined, undefined, undefined, r.body);
      if (hit) {
        const blocker = this.byHandle.get(hit.collider.handle);
        if (blocker && blocker.kind === 'block' && blocker !== r && (r.kind !== 'block' || v3.len(v3.sub(this.pos(blocker), p)) >= pierce)) occl = blocker.mat!.id === 'glass' ? 0.8 : 0.35;
      }
      const mass = r.body.mass();
      const j = strength * falloff * occl * (r.kind === 'king' ? king : 1);
      const push = v3.scale(v3.norm([dir[0], dir[1] + 0.35, dir[2]]), j * Math.min(1, 0.4 + mass * 0.3));
      r.body.applyImpulse(rv(push), true);
      r.body.applyTorqueImpulse(rv([(Math.random() - 0.5) * j * 0.2, (Math.random() - 0.5) * j * 0.2, (Math.random() - 0.5) * j * 0.2]), true);
      if (owner >= 0 && r.slot !== owner) r.lastHitBy = owner;
      if (r.kind === 'block') {
        const dmg = j / r.mat!.blastResist;
        if (dmg >= 1) this.fractureBlock(r);
        else if (this.breaking) this.addDamage(r, dmg * 0.6);
        for (const jt of r.joints) if (j * 25 > jt.strength) this.pendingJointBreak.add(jt);
      } else if (r.kind === 'king') {
        // Una explosión que no le da de lleno (a más de 1,2 m) le quita como mucho un 60 %: hacen
        // falta dos o un impacto directo (WRK-TASK-027).
        r.damage += dist < 1.2 ? j / 40 : Math.min(j / 40, 0.6);
        if (r.damage >= 1) this.killKing(r.slot, 'crushed', owner);
      }
    }
  }

  later(delay: number, fn: () => void) {
    this.timers.push({ at: this.time + delay, fn });
  }

  addField(f: Field) {
    this.fields.push(f);
  }

  private applyFields() {
    this.fields = this.fields.filter((f) => this.time < f.until);
    for (const f of this.fields) {
      for (const r of this.recsInBall(f.p, f.radius)) {
        if (r.kind === 'proj' || !this.recs.has(r.id)) continue;
        if (this.shields.has(r.slot) && !insideShield(r.slot, f.p)) continue;
        const c0 = this.pos(r);
        const d = v3.sub(f.p, c0);
        const dist = Math.max(0.4, v3.len(d));
        const dir = v3.norm(d);
        const m = r.body.mass();
        if (f.kind === 'blackhole') {
          // Atracción con remolino: cae hacia el centro girando.
          const swirl = v3.norm([dir[2], 0, -dir[0]]);
          const a = f.strength / (dist * dist * 0.35 + 1);
          r.body.addForce(rv(v3.add(v3.scale(dir, a * m), v3.scale(swirl, a * m * 0.45))), true);
          this.forced.add(r);
          if (r.kind === 'block') {
            if (r.slot !== f.owner) r.lastHitBy = f.owner;
            // Lo que llega al núcleo desaparece; lo cercano se despega.
            if (dist < 1.1) this.pendingFrac.set(r, null);
            else if (dist < 3.5) for (const j of r.joints) this.pendingJointBreak.add(j);
          }
        } else {
          // Imán: solo el hierro nota la fuerza de verdad; lo demás, apenas.
          const iron = r.mat?.id === 'iron';
          const a = (iron ? f.strength : f.strength * 0.03) / (dist * 0.25 + 1);
          r.body.addForce(rv(v3.scale(dir, a * m)), true);
          this.forced.add(r);
          if (iron) {
            for (const j of r.joints) this.pendingJointBreak.add(j);
            if (r.slot !== f.owner) r.lastHitBy = f.owner;
          }
        }
      }
    }
  }

  // ---------- rey ----------

  killKing(slot: number, cause: KingCause, by = -1) {
    const k = this.kings.get(slot);
    if (!k || !k.alive) return;
    k.alive = false;
    k.cause = cause;
    k.by = by;
    this.events.push({ e: 'king', slot, cause, by });
  }

  private checkKings() {
    for (const k of this.kings.values()) {
      if (!k.alive) continue;
      const r = this.recs.get(kingId(k.slot));
      if (!r) {
        this.killKing(k.slot, 'fell');
        continue;
      }
      const p = this.pos(r);
      if (p[1] < -1.2 || (islandSdf(p[0], p[2]) > 0.2 && p[1] < 0.5)) this.killKing(k.slot, 'fell', r.lastHitBy);
      else if (p[1] - KING_HALF_HEIGHT - KING_RADIUS < this.lavaY + 0.06) this.killKing(k.slot, 'lava', r.lastHitBy);
      else if (p[1] < 0.95 && !insideCastle(k.slot, p, 0.2)) this.killKing(k.slot, 'outside', r.lastHitBy);
    }
  }

  // ---------- paso de simulación ----------

  step() {
    this.stepN++;
    for (const r of this.forced) if (this.recs.get(r.id) === r) r.body.resetForces(false);
    this.forced.clear();

    // Proyectiles: arrastre del aire, viento y comportamiento propio.
    for (const r of this.recs.values()) {
      if (r.kind !== 'proj') continue;
      const v = tv(r.body.linvel());
      const a = aeroAccel(v, this.wind, r.ammo!.drag, r.ammo!.windFactor);
      const m = r.body.mass();
      r.body.addForce(rv(v3.scale(a, m)), true);
      this.forced.add(r);
      r.behavior?.onStep?.(r, DT);
      // onStep puede haberlo eliminado (los cocos se dividen).
      if (this.recs.get(r.id) === r) this.checkShield(r);
    }
    this.applyFields();
    if (this.stepN % 3 === 0) this.applyLava(DT * 3);
    this.sinkDoomed();

    this.preVel.clear();
    for (const r of this.recs.values()) if (!r.body.isSleeping()) this.preVel.set(r.id, tv(r.body.linvel()));
    this.world.step(this.eq);
    this.time += DT;
    if (this.timers.length) {
      const due = this.timers.filter((t) => t.at <= this.time);
      this.timers = this.timers.filter((t) => t.at > this.time);
      for (const t of due) t.fn();
    }

    this.eq.drainCollisionEvents((h1, h2, started) => {
      if (!started) return;
      const a = this.byHandle.get(h1);
      const b = this.byHandle.get(h2);
      if (a?.kind === 'proj') a.behavior?.onContact?.(a, b ?? null);
      if (b?.kind === 'proj') b.behavior?.onContact?.(b, a ?? null);
    });
    this.eq.drainContactForceEvents((ev) => {
      const f = ev.totalForceMagnitude();
      const a = this.byHandle.get(ev.collider1());
      const b = this.byHandle.get(ev.collider2());
      if (a) this.onForce(a, f, b ?? null);
      if (b) this.onForce(b, f, a ?? null);
      if (f > 250 && (a || b)) this.emitHit(a ?? b!, b ?? a!, f);
    });

    // Aplicar roturas pendientes fuera del bucle de eventos.
    for (const j of this.pendingJointBreak) this.breakJoint(j);
    this.pendingJointBreak.clear();
    for (const r of this.pendingFrac.keys()) this.removeRec(r, 'frac');
    this.pendingFrac.clear();
    // El proyectil atraviesa lo que rompe: conserva parte de la velocidad que traía.
    for (const r of this.plow) {
      const v = this.preVel.get(r.id);
      if (!v || !this.recs.has(r.id) || r.body.bodyType() !== RAPIER.RigidBodyType.Dynamic) continue;
      const cur = r.body.linvel();
      const k = 0.6;
      if (Math.hypot(cur.x, cur.y, cur.z) < v3.len(v) * k) r.body.setLinvel(rv(v3.scale(v, k)), true);
    }
    this.plow.clear();

    if (this.stepN % 2 === 0) this.checkJointStrain();
    if (this.stepN % 3 === 0) this.checkKings();
    if (this.stepN % 10 === 0) this.cleanupVoid();
  }

  private relSpeed(a: Rec | null, b: Rec | null) {
    const va = (a && this.preVel.get(a.id)) || [0, 0, 0];
    const vb = (b && this.preVel.get(b.id)) || [0, 0, 0];
    return Math.hypot(va[0] - vb[0], va[1] - vb[1], va[2] - vb[2]);
  }

  private emitHit(a: Rec, b: Rec, f: number) {
    if (this.relSpeed(a, b === a ? null : b) < 1.5) return;
    const key = Math.min(a.id, b.id);
    const last = this.hitCooldown.get(key) ?? -1;
    if (this.time - last < 0.25) return;
    this.hitCooldown.set(key, this.time);
    const src = a.kind === 'block' ? a : b.kind === 'block' ? b : a;
    this.events.push({ e: 'hit', p: this.pos(src), f, mat: src.kind === 'king' ? 'king' : src.mat?.id ?? 'ground' });
  }

  private onForce(r: Rec, f: number, other: Rec | null) {
    if (other && other.lastHitBy >= 0 && other.lastHitBy !== r.slot) r.lastHitBy = other.lastHitBy;
    if (!this.breaking) return;
    // Una carga en reposo no es un golpe: solo cuenta si chocaban con cierta velocidad relativa,
    // salvo aplastamientos enormes (3 veces el umbral).
    const rel = this.relSpeed(r, other);
    const crushLimit = r.kind === 'king' ? KING_CRUSH_FORCE * 3 : r.mat ? r.mat.breakForce * 3 : Infinity;
    if (rel < 0.7 && f < crushLimit) return;
    if (r.kind === 'king') {
      if (f > KING_CRUSH_FORCE) this.killKing(r.slot, 'crushed', r.lastHitBy);
      else if (f > KING_CRUSH_FORCE * 0.45) {
        r.damage += (f / KING_CRUSH_FORCE) ** 2 * 0.35;
        if (r.damage >= 1) this.killKing(r.slot, 'crushed', r.lastHitBy);
      }
      return;
    }
    if (r.kind !== 'block') return;
    for (const j of r.joints) if (f > j.strength) this.pendingJointBreak.add(j);
    const m = r.mat!;
    if (f > m.breakForce) {
      this.pendingFrac.set(r, null);
      if (other?.kind === 'proj') this.plow.add(other);
    }
    else if (f > m.breakForce * CHIP_RATIO) this.addDamage(r, (f / m.breakForce) ** 2 * 0.4);
  }

  // Integridad estructural: si los anclajes de una unión se separan, la unión cede.
  private checkJointStrain() {
    for (const r of this.recs.values()) {
      if (r.kind !== 'block' || !r.joints.length || r.body.isSleeping()) continue;
      for (const j of r.joints) {
        if (j.a !== r) continue;
        const wa = v3.add(this.pos(j.a), rotate(tq(j.a.body.rotation()), j.la));
        const wb = v3.add(this.pos(j.b), rotate(tq(j.b.body.rotation()), j.lb));
        if (v3.dist(wa, wb) > JOINT_STRAIN) this.pendingJointBreak.add(j);
      }
    }
    for (const j of this.pendingJointBreak) this.breakJoint(j);
    this.pendingJointBreak.clear();
  }

  private bottomOf(r: Rec) {
    const p = r.body.translation();
    const hy = r.kind === 'block' ? rotYExtent(tq(r.body.rotation()), [r.size[0] / 2, r.size[1] / 2, r.size[2] / 2]) : r.size[1] / 2;
    return p.y - hy;
  }

  // Lava. Sobre la isla, la superficie es un suelo físico: lo que cae encima se queda
  // "flotando" y no se funde en cadena. Fuera de la isla (el mar de lava) y para los
  // proyectiles, lo que toca la lava se hunde despacio y se funde.
  private applyLava(dt: number) {
    const ly = this.lavaY;
    for (const r of this.recs.values()) {
      if (r.kind === 'king' || r.doomed) continue;
      const p = r.body.translation();
      if (p.y - 3 > ly) continue;
      const bottom = this.bottomOf(r);
      const onIsland = islandSdf(p.x, p.z) < -0.5;
      if (bottom > ly + 0.08 || (onIsland && r.kind === 'block')) {
        r.lavaT = Math.max(0, r.lavaT - dt);
        continue;
      }
      r.body.wakeUp();
      const v = r.body.linvel();
      const m = r.body.mass();
      r.body.addForce({ x: -v.x * m * 2.5, y: -v.y * m * 2, z: -v.z * m * 2.5 }, true);
      this.forced.add(r);
      r.lavaT += dt;
      const melt = r.kind === 'proj' ? 0.6 : r.mat!.meltTime;
      if (r.lavaT > melt) this.removeRec(r, r.kind === 'proj' ? 'proj' : 'melt');
    }
  }

  // Sube la lava: se come (escalonadamente) los bloques cuya base queda por debajo y la
  // superficie pasa a ser el nuevo suelo. Los bloques condenados no chocan con ese suelo.
  setLava(y: number) {
    const rising = y > this.lavaY + 0.01;
    this.lavaY = y;
    this.lavaFloor.setTranslation({ x: 0, y: y - LAVA_FLOOR_HALF, z: 0 }, true);
    if (!rising) return;
    const doomed: Rec[] = [];
    for (const r of this.recs.values()) {
      if (r.kind !== 'block') continue;
      if (this.bottomOf(r) < y - 0.03) doomed.push(r);
    }
    // Se hunden despacio (cinemáticos) y lo de encima baja con ellos sin golpes; al quedar
    // sumergidos se funden. Si desaparecieran de golpe, el castillo caería 1 m y se rompería entero.
    for (const r of doomed) {
      for (const j of [...r.joints]) this.breakJoint(j, false);
      r.doomed = true;
      r.col.setCollisionGroups(DOOMED_GROUPS);
      r.body.setBodyType(RAPIER.RigidBodyType.KinematicVelocityBased, true);
      r.body.setLinvel({ x: 0, y: -LAVA_SINK_SPEED, z: 0 }, true);
      r.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
      this.events.push({ e: 'fx', kind: 'lavaEat', p: this.pos(r) });
    }
    for (const r of this.recs.values()) if (r.body.translation().y - 2 < y) r.body.wakeUp();
  }

  // Los bloques que se hunden en la lava se funden cuando su cara de arriba queda a ras.
  private sinkDoomed() {
    for (const r of this.recs.values()) {
      if (!r.doomed) continue;
      const top = 2 * r.body.translation().y - this.bottomOf(r);
      if (top < this.lavaY + 0.02) this.removeRec(r, 'melt');
    }
  }

  private cleanupVoid() {
    for (const r of [...this.recs.values()]) {
      const p = r.body.translation();
      if (p.y < -14 || Math.abs(p.x) > 90 || Math.abs(p.z) > 90) {
        if (r.kind === 'king') {
          this.killKing(r.slot, 'fell', r.lastHitBy);
          this.recs.delete(r.id);
          this.byHandle.delete(r.col.handle);
          this.world.removeRigidBody(r.body);
          this.events.push({ e: 'fx', kind: 'kingGone', p: tv(p), slot: r.slot });
        } else this.removeRec(r, r.kind === 'proj' ? 'proj' : 'void');
      }
      // Proyectiles que llevan demasiado tiempo vivos (rodando por ahí).
      if (r.kind === 'proj' && this.recs.has(r.id) && this.time - r.born! > (r.behavior?.maxLife ?? 7)) this.removeRec(r, 'proj');
    }
  }

  // ---------- escudos ----------

  private checkShield(r: Rec) {
    for (const [slot] of this.shields) {
      if (slot === r.slot) continue;
      const c = castleOrigin(slot);
      const p = this.pos(r);
      if (v3.dist(p, [c[0], 0, c[2]]) < SHIELD_RADIUS) {
        this.shields.delete(slot);
        this.events.push({ e: 'shield', slot, on: false });
        this.events.push({ e: 'fx', kind: 'pop', p, slot });
        this.removeRec(r, 'proj');
        return;
      }
    }
  }

  drainEvents(): SimEvent[] {
    const e = this.events;
    this.events = [];
    return e;
  }

  // Contexto para las municiones.
  get castleHalf() {
    return CASTLE_HALF;
  }

  free() {
    this.world.free();
    this.eq.free();
  }
}

export function insideShield(slot: number, p: Vec3) {
  const c = castleOrigin(slot);
  return Math.hypot(p[0] - c[0], p[2] - c[2]) < SHIELD_RADIUS;
}

function mulQ(a: Quat, b: Quat): Quat {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [aw * bx + ax * bw + ay * bz - az * by, aw * by - ax * bz + ay * bw + az * bx, aw * bz + ax * by - ay * bx + az * bw, aw * bw - ax * bx - ay * by - az * bz];
}

export { tv, tq, rv, rq };
