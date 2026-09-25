import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toonGradient } from './textures';

export function toon(color: THREE.ColorRepresentation, o: { map?: THREE.Texture; transparent?: boolean; opacity?: number; emissive?: THREE.ColorRepresentation; side?: THREE.Side } = {}) {
  const m = new THREE.MeshToonMaterial({ color, gradientMap: toonGradient(), emissive: o.emissive ?? 0x000000, side: o.side ?? THREE.FrontSide });
  if (o.map) m.map = o.map;
  if (o.transparent) {
    m.transparent = true;
    m.opacity = o.opacity ?? 1;
    m.depthWrite = false;
  }
  return m;
}

const OUTLINE_COLOR = new THREE.Color('#1d1626');

// Contorno de cajas instanciadas: una caja agrandada un grosor constante en el mundo,
// dibujada por dentro (BackSide). Así las esquinas quedan cerradas y el grosor no
// depende del tamaño del bloque.
export function boxOutlineMaterial(width = 0.04) {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uWidth: { value: width }, uColor: { value: OUTLINE_COLOR } }]),
    side: THREE.BackSide,
    fog: true,
    vertexShader: /* glsl */ `
      uniform float uWidth;
      #include <fog_pars_vertex>
      void main() {
        mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
          m = m * instanceMatrix;
        #endif
        vec3 s = vec3(length(m[0].xyz), length(m[1].xyz), length(m[2].xyz));
        vec4 wc = m * vec4(0.0, 0.0, 0.0, 1.0);
        float d = distance(wc.xyz, cameraPosition);
        float w = uWidth * (1.0 + d * 0.012);
        vec3 p = position + sign(position) * w / max(s, vec3(0.001));
        vec4 mvPosition = viewMatrix * m * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      #include <fog_pars_fragment>
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// Contorno de mallas suaves (esferas, cilindros): empuja los vértices por la normal.
export function hullOutlineMaterial(width = 0.035) {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uWidth: { value: width }, uColor: { value: OUTLINE_COLOR } }]),
    side: THREE.BackSide,
    fog: true,
    vertexShader: /* glsl */ `
      uniform float uWidth;
      #include <fog_pars_vertex>
      void main() {
        mat4 m = modelMatrix;
        #ifdef USE_INSTANCING
          m = m * instanceMatrix;
        #endif
        vec4 wp = m * vec4(position, 1.0);
        vec3 n = normalize(mat3(m) * normal);
        float d = distance(wp.xyz, cameraPosition);
        wp.xyz += n * uWidth * (1.0 + d * 0.012);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      #include <fog_pars_fragment>
      void main() {
        gl_FragColor = vec4(uColor, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// Fusiona todas las mallas estáticas de un grupo en una por material (menos llamadas de
// dibujo). Si `withOutline`, añade un contorno por cada malla fusionada.
// La geometría queda en el espacio local del grupo.
export function mergeStatic(group: THREE.Object3D, withOutline = true, castShadow = true, outlineWidth = 0.03): THREE.Group {
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert();
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    // Se saltan los contornos que ya tuviera (se añaden de nuevo sobre lo fusionado).
    if (!m.isMesh || m.material instanceof THREE.ShaderMaterial) return;
    const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(inv.clone().multiply(m.matrixWorld));
    // Mismos atributos en todas para poder fusionar.
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    const mat = m.material as THREE.Material;
    const list = byMat.get(mat) ?? [];
    list.push(g);
    byMat.set(mat, list);
  });
  const out = new THREE.Group();
  const hull = withOutline ? hullOutlineMaterial(outlineWidth) : null;
  for (const [mat, geos] of byMat) {
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = true;
    out.add(mesh);
    if (hull) {
      const ol = new THREE.Mesh(merged, hull);
      ol.userData.noOutline = true;
      out.add(ol);
    }
  }
  return out;
}

// Añade un contorno a todas las mallas de un grupo.
export function outline(obj: THREE.Object3D, width = 0.035) {
  const hull = hullOutlineMaterial(width);
  const box = boxOutlineMaterial(width);
  const meshes: THREE.Mesh[] = [];
  obj.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && !o.userData.noOutline) meshes.push(o as THREE.Mesh);
  });
  for (const m of meshes) {
    const o = new THREE.Mesh(m.geometry, m.geometry.type === 'BoxGeometry' ? box : hull);
    o.userData.noOutline = true;
    o.castShadow = false;
    m.add(o);
  }
  return obj;
}
