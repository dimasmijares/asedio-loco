import * as THREE from 'three';
import { fracture } from '../../../../shared/fracture';
import { MATERIALS, MATERIAL_IDS, type MaterialId } from '../../../../shared/materials';
import { rng, type Quat, type Vec3 } from '../../../../shared/math';
import { blockMaterial } from '../render/blocks';
import { addIslandColliders } from './island';
import { RAPIER, type RigidBody, type World } from './rapier';

interface Piece {
  body: RigidBody;
  mat: MaterialId;
  size: Vec3;
  born: number;
  life: number;
}

const BURST: Record<MaterialId, number> = { glass: 4.5, wood: 2.6, stone: 1.8, iron: 1.2 };
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();

// Fragmentos decorativos: un mundo físico aparte que cada cliente simula por su cuenta
// (no se sincronizan por red). Los bloques de verdad aparecen aquí como cuerpos
// cinemáticos para que los trozos reboten en ellos sin empujarlos.
export class Debris {
  world: World;
  pieces: Piece[] = [];
  proxies = new Map<number, RigidBody>();
  meshes = {} as Record<MaterialId, THREE.InstancedMesh>;
  time = 0;
  lavaY = -3.6;

  constructor(parent: THREE.Object3D, readonly maxPieces = 220, shadows = true) {
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.integrationParameters.numSolverIterations = 2;
    addIslandColliders(this.world);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    for (const mat of MATERIAL_IDS) {
      const m = new THREE.InstancedMesh(geo, blockMaterial(mat), maxPieces);
      m.count = 0;
      m.castShadow = shadows && mat !== 'glass';
      m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      parent.add(m);
      this.meshes[mat] = m;
    }
  }

  addProxy(id: number, size: Vec3, p: Vec3, q: Quat) {
    this.removeProxy(id);
    const b = this.world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(p[0], p[1], p[2]).setRotation({ x: q[0], y: q[1], z: q[2], w: q[3] }));
    this.world.createCollider(RAPIER.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2).setFriction(0.8), b);
    this.proxies.set(id, b);
  }

  moveProxy(id: number, p: Vec3, q: Quat) {
    const b = this.proxies.get(id);
    if (!b) return;
    b.setNextKinematicTranslation({ x: p[0], y: p[1], z: p[2] });
    b.setNextKinematicRotation({ x: q[0], y: q[1], z: q[2], w: q[3] });
  }

  removeProxy(id: number) {
    const b = this.proxies.get(id);
    if (!b) return;
    this.world.removeRigidBody(b);
    this.proxies.delete(id);
  }

  // Trocea un bloque roto en fragmentos con la velocidad que llevaba más un estallido.
  burst(mat: MaterialId, size: Vec3, p: Vec3, q: Quat, v: Vec3, seed: number) {
    const pieces = fracture(size, MATERIALS[mat].pieces, seed);
    const r = rng(seed ^ 0x9e37);
    const qq = new THREE.Quaternion(q[0], q[1], q[2], q[3]);
    const speed = BURST[mat];
    for (const pc of pieces) {
      while (this.pieces.length >= this.maxPieces) this.kill(0);
      const off = new THREE.Vector3(...pc.offset).applyQuaternion(qq);
      const dir = off.clone().normalize();
      const body = this.world.createRigidBody(
        RAPIER.RigidBodyDesc.dynamic()
          .setTranslation(p[0] + off.x, p[1] + off.y, p[2] + off.z)
          .setRotation({ x: q[0], y: q[1], z: q[2], w: q[3] })
          .setLinvel(v[0] + dir.x * speed + r.range(-1, 1), v[1] + dir.y * speed + r.range(0.5, 2), v[2] + dir.z * speed + r.range(-1, 1))
          .setAngvel({ x: r.range(-6, 6), y: r.range(-6, 6), z: r.range(-6, 6) })
          .setLinearDamping(0.1)
          .setAngularDamping(0.4),
      );
      this.world.createCollider(
        RAPIER.ColliderDesc.cuboid(pc.size[0] / 2, pc.size[1] / 2, pc.size[2] / 2)
          .setDensity(MATERIALS[mat].density)
          .setFriction(0.8)
          .setRestitution(mat === 'glass' ? 0.3 : 0.1),
        body,
      );
      this.pieces.push({ body, mat, size: pc.size, born: this.time, life: r.range(3.2, 4.8) });
    }
  }

  private kill(i: number) {
    this.world.removeRigidBody(this.pieces[i].body);
    this.pieces.splice(i, 1);
  }

  step(dt: number) {
    this.time += dt;
    this.world.timestep = Math.min(dt, 1 / 30);
    this.world.step();
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const pc = this.pieces[i];
      const y = pc.body.translation().y;
      if (y < this.lavaY) {
        // Se hunde en la lava.
        pc.body.setLinearDamping(6);
        pc.life = Math.min(pc.life, this.time - pc.born + 0.6);
      }
      if (this.time - pc.born > pc.life || y < -20) this.kill(i);
    }
    this.sync();
  }

  private sync() {
    const counts: Record<MaterialId, number> = { wood: 0, stone: 0, glass: 0, iron: 0 };
    for (const pc of this.pieces) {
      const t = this.time - pc.born;
      const shrink = Math.min(1, (pc.life - t) / 0.5);
      const tr = pc.body.translation();
      const ro = pc.body.rotation();
      _m.compose(_p.set(tr.x, tr.y, tr.z), _q.set(ro.x, ro.y, ro.z, ro.w), _s.set(pc.size[0] * shrink, pc.size[1] * shrink, pc.size[2] * shrink));
      const mesh = this.meshes[pc.mat];
      mesh.setMatrixAt(counts[pc.mat]++, _m);
    }
    for (const mat of MATERIAL_IDS) {
      this.meshes[mat].count = counts[mat];
      this.meshes[mat].instanceMatrix.needsUpdate = true;
    }
  }

  clear() {
    while (this.pieces.length) this.kill(0);
    for (const id of [...this.proxies.keys()]) this.removeProxy(id);
    this.sync();
  }

  get count() {
    return this.pieces.length;
  }
}
