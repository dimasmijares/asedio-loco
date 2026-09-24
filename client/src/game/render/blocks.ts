import * as THREE from 'three';
import { MATERIAL_IDS, type MaterialId } from '../../../../shared/materials';
import type { Quat, Vec3 } from '../../../../shared/math';
import { boxOutlineMaterial, toon } from './materials';
import { tex } from './textures';

const BOX = new THREE.BoxGeometry(1, 1, 1);

export function blockMaterial(mat: MaterialId): THREE.Material {
  switch (mat) {
    case 'wood':
      return toon('#ffffff', { map: tex.wood() });
    case 'stone':
      return toon('#ffffff', { map: tex.stone() });
    case 'glass':
      return toon('#ffffff', { map: tex.glass(), transparent: true, opacity: 0.55 });
    case 'iron':
      return toon('#ffffff', { map: tex.iron() });
  }
}

interface Item {
  mat: MaterialId;
  index: number;
  size: Vec3;
  p: Vec3;
  q: Quat;
}

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _c = new THREE.Color();

// Todos los bloques de un material en un InstancedMesh (una llamada de dibujo),
// con su contorno compartiendo las mismas matrices.
export class BlockMeshes {
  meshes = {} as Record<MaterialId, THREE.InstancedMesh>;
  outlines = {} as Record<MaterialId, THREE.InstancedMesh>;
  items = new Map<number, Item>();
  private order = {} as Record<MaterialId, number[]>;
  private dirty = new Set<MaterialId>();

  constructor(parent: THREE.Object3D, capacity = 520, outlineWidth = 0.035, shadows = true) {
    for (const mat of MATERIAL_IDS) {
      const mesh = new THREE.InstancedMesh(BOX, blockMaterial(mat), capacity);
      mesh.count = 0;
      mesh.castShadow = shadows && mat !== 'glass';
      mesh.receiveShadow = shadows;
      mesh.frustumCulled = false;
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(capacity * 3).fill(1), 3);
      if (mat === 'glass') mesh.renderOrder = 2;
      const ol = new THREE.InstancedMesh(BOX, boxOutlineMaterial(outlineWidth), capacity);
      ol.instanceMatrix = mesh.instanceMatrix;
      ol.count = 0;
      ol.frustumCulled = false;
      parent.add(mesh, ol);
      this.meshes[mat] = mesh;
      this.outlines[mat] = ol;
      this.order[mat] = [];
    }
  }

  has(id: number) {
    return this.items.has(id);
  }

  add(id: number, mat: MaterialId, size: Vec3, p: Vec3, q: Quat) {
    if (this.items.has(id)) this.remove(id);
    const list = this.order[mat];
    const mesh = this.meshes[mat];
    if (list.length >= mesh.instanceMatrix.count) return;
    const index = list.length;
    list.push(id);
    this.items.set(id, { mat, index, size, p, q });
    mesh.count = this.outlines[mat].count = list.length;
    mesh.setColorAt(index, _c.setRGB(1, 1, 1));
    this.write(this.items.get(id)!);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  set(id: number, p: Vec3, q: Quat) {
    const it = this.items.get(id);
    if (!it) return;
    it.p = p;
    it.q = q;
    this.write(it);
  }

  private write(it: Item) {
    _p.set(it.p[0], it.p[1], it.p[2]);
    _q.set(it.q[0], it.q[1], it.q[2], it.q[3]);
    _s.set(it.size[0], it.size[1], it.size[2]);
    _m.compose(_p, _q, _s);
    this.meshes[it.mat].setMatrixAt(it.index, _m);
    this.dirty.add(it.mat);
  }

  // Oscurece los bloques dañados para que se vea que están a punto de romperse.
  setDamage(id: number, d: number) {
    const it = this.items.get(id);
    if (!it) return;
    const k = 1 - Math.min(0.55, d * 0.55);
    this.meshes[it.mat].setColorAt(it.index, _c.setRGB(k, k * 0.95, k * 0.9));
    this.meshes[it.mat].instanceColor!.needsUpdate = true;
  }

  remove(id: number) {
    const it = this.items.get(id);
    if (!it) return;
    const list = this.order[it.mat];
    const mesh = this.meshes[it.mat];
    const last = list.length - 1;
    if (it.index !== last) {
      // El último ocupa el hueco del eliminado.
      const lastId = list[last];
      const li = this.items.get(lastId)!;
      mesh.getMatrixAt(last, _m);
      mesh.setMatrixAt(it.index, _m);
      const col = new THREE.Color();
      mesh.getColorAt(last, col);
      mesh.setColorAt(it.index, col);
      li.index = it.index;
      list[it.index] = lastId;
    }
    list.pop();
    this.items.delete(id);
    mesh.count = this.outlines[it.mat].count = list.length;
    this.dirty.add(it.mat);
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  clear() {
    for (const id of [...this.items.keys()]) this.remove(id);
  }

  flush() {
    for (const mat of this.dirty) this.meshes[mat].instanceMatrix.needsUpdate = true;
    this.dirty.clear();
  }

  count(slotOf?: (id: number) => number, slot?: number) {
    if (slotOf === undefined) return this.items.size;
    let n = 0;
    for (const id of this.items.keys()) if (slotOf(id) === slot) n++;
    return n;
  }
}
