import * as THREE from 'three';
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
