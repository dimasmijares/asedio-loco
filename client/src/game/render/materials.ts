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

// Desvanecido por tramado de lo que está muy cerca de la cámara (WRK-TASK-034): al apuntar, los
// muros propios que quedan entre la cámara y la catapulta no tapan la vista. `NEAR_FADE.value`
// es la distancia (m) a partir de la cual empieza; 0 lo desactiva. Patrón ordenado de 4×4: no
// hace falta ordenar transparencias y sirve con el instancing.
export const NEAR_FADE = { value: 0 };
const FADE_FRAG = /* glsl */ `
  uniform float uFadeNear;
  varying vec3 vFadeW;
  const float BAYER4[16] = float[16](0., 8., 2., 10., 12., 4., 14., 6., 3., 11., 1., 9., 15., 7., 13., 5.);
  void nearFade() {
    if (uFadeNear <= 0.0) return;
    float k = clamp((uFadeNear - distance(vFadeW, cameraPosition)) / 4.0, 0.0, 1.0) * 0.9;
    ivec2 c = ivec2(mod(gl_FragCoord.xy, 4.0));
    if (k > (BAYER4[c.x + c.y * 4] + 0.5) / 16.0) discard;
  }
`;
const FADE_WORLD = /* glsl */ `
  #ifdef USE_INSTANCING
    vFadeW = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
  #else
    vFadeW = (modelMatrix * vec4(transformed, 1.0)).xyz;
  #endif
`;

// Grietas de los bloques dañados (WRK-TASK-039): un patrón de Voronoi en las coordenadas locales
// de cada cara, que se ensancha con el daño. El daño se lee del color de la instancia, que
// `Blocks.setDamage` oscurece (k = 1 - 0,55 · daño). Sin texturas ni geometría nueva.
const CRACK_VERT = /* glsl */ `
  vCrackP = position;
  vCrackN = normal;
  #ifdef USE_INSTANCING
    vCrackSeed = float(gl_InstanceID);
  #else
    vCrackSeed = 0.0;
  #endif
`;
const CRACK_FRAG = /* glsl */ `
  varying vec3 vCrackP;
  varying vec3 vCrackN;
  varying float vCrackSeed;
  vec2 crackHash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }
  // Distancia al borde entre celdas de Voronoi: 0 sobre la grieta.
  float crackEdge(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    float d1 = 8.0;
    float d2 = 8.0;
    for (int y = -1; y <= 1; y++)
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        float d = length(g + crackHash(i + g) - f);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
    return d2 - d1;
  }
`;
const CRACK_APPLY = /* glsl */ `
  #if defined(USE_INSTANCING_COLOR) || defined(USE_COLOR)
  {
    float dmg = clamp((1.0 - vColor.r) / 0.55, 0.0, 1.0);
    if (dmg > 0.1) {
      vec3 an = abs(vCrackN);
      vec2 uv = an.x > 0.5 ? vCrackP.yz : an.y > 0.5 ? vCrackP.xz : vCrackP.xy;
      float e = crackEdge(uv * 2.6 + vCrackSeed * 1.37);
      float w = 0.035 + 0.15 * dmg;
      float c = 1.0 - smoothstep(w * 0.5, w, e);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.07, 0.05, 0.06), c * min(1.0, dmg * 1.4));
    }
  }
  #endif
`;

// Oclusión aproximada (WRK-TASK-050), sin coste de texturas ni pasadas: la parte baja de cada bloque
// (coordenada local, cubo unidad) y lo que está a ras de suelo (altura en el mundo) se oscurecen un
// poco, así que las juntas entre hileras y la base del castillo ganan volumen. Todas las calidades.
const AO_APPLY = /* glsl */ `
  {
    float aoBlock = mix(0.8, 1.0, smoothstep(-0.5, -0.12, vCrackP.y));
    float aoGround = mix(0.78, 1.0, smoothstep(0.0, 1.6, vFadeW.y));
    diffuseColor.rgb *= aoBlock * aoGround;
  }
`;

// Material de los bloques: desvanecido cercano (WRK-TASK-034), grietas según el daño (WRK-TASK-039)
// y oclusión aproximada (WRK-TASK-050).
export function withNearFade<T extends THREE.Material>(m: T): T {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uFadeNear = NEAR_FADE;
    sh.vertexShader = sh.vertexShader
      .replace('void main() {', 'varying vec3 vFadeW;\nvarying vec3 vCrackP;\nvarying vec3 vCrackN;\nvarying float vCrackSeed;\nvoid main() {')
      .replace('#include <project_vertex>', `#include <project_vertex>\n${FADE_WORLD}\n${CRACK_VERT}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('void main() {', `${FADE_FRAG}\n${CRACK_FRAG}\nvoid main() {\n  nearFade();`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${CRACK_APPLY}\n${AO_APPLY}`);
  };
  m.customProgramCacheKey = () => 'nearFade+cracks+ao';
  return m;
}

// Contorno noche, como el de la interfaz (R-10).
const OUTLINE_COLOR = new THREE.Color('#200432');

// Contorno de cajas instanciadas: una caja agrandada un grosor constante en el mundo,
// dibujada por dentro (BackSide). Así las esquinas quedan cerradas y el grosor no
// depende del tamaño del bloque.
export function boxOutlineMaterial(width = 0.04) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uWidth: { value: width }, uColor: { value: OUTLINE_COLOR } }]), uFadeNear: NEAR_FADE },
    side: THREE.BackSide,
    fog: true,
    vertexShader: /* glsl */ `
      uniform float uWidth;
      varying vec3 vFadeW;
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
        vFadeW = (m * vec4(p, 1.0)).xyz;
        vec4 mvPosition = viewMatrix * m * vec4(p, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      #include <fog_pars_fragment>
      ${FADE_FRAG}
      void main() {
        nearFade();
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
