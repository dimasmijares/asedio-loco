import * as THREE from 'three';
import { CASTLE_HALF, CATAPULT_LOCAL, ISLAND_CORNER_R, ISLAND_HALF, castleOrigin, castleYaw, toWorld } from '../../../../shared/map';
import { rng } from '../../../../shared/math';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mergeStatic, outline, toon } from './materials';
import { tex } from './textures';

export type Quality = 'low' | 'medium' | 'high';

// Escena al atardecer (R-10 D2, sección «Escena 3D» del design system): colores de la paleta.
const SUNSET = {
  hueso: '#fff6e2',
  crema: '#fee7b5',
  melocoton: '#fdbe7a',
  naranja: '#fe8932',
  grana: '#cd1a30',
  vino: '#7a0c31',
  ciruela: '#4a0730',
  terracota: '#c7663a',
};
// Sol bajo: la luz entra rasante (unos 26° sobre el horizonte). En el cielo se dibuja más bajo
// todavía, para que se vea sobre las montañas.
const SUN_LIGHT = new THREE.Vector3(-40, 26, 28);
const SUN_SKY = new THREE.Vector3(-40, 8, 28).normalize();
// Mitad del lado de la sombra de contacto de cada castillo (m): algo más que su contorno.
const SHADOW_HALF = CASTLE_HALF + 1.8;

export function islandOutline(n = 12): [number, number][] {
  const pts: [number, number][] = [];
  const inner = ISLAND_HALF - ISLAND_CORNER_R;
  for (const [cx, cz, a0] of [
    [inner, inner, 0],
    [-inner, inner, Math.PI / 2],
    [-inner, -inner, Math.PI],
    [inner, -inner, (3 * Math.PI) / 2],
  ]) {
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * ISLAND_CORNER_R, cz + Math.sin(a) * ISLAND_CORNER_R]);
    }
  }
  return pts;
}

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  sun: THREE.DirectionalLight;
  lava: THREE.Mesh;
  lavaMat: THREE.ShaderMaterial;
  private embers: THREE.ShaderMaterial;
  clouds = new THREE.Group();
  private t0 = performance.now();
  lavaTarget = -3.6;

  constructor(readonly canvas: HTMLCanvasElement, public quality: Quality) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'low', powerPreference: 'high-performance', preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality === 'high' ? 2 : quality === 'medium' ? 1.25 : 0.85));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = quality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.3, 700);
    this.camera.position.set(0, 45, 70);
    this.camera.lookAt(0, 0, 0);
    this.scene.fog = new THREE.Fog(SUNSET.melocoton, 110, 420);

    // Luz de atardecer (R-10 D2): sol cálido y rasante con sombras; la luz de ambiente, rosada por
    // arriba y ciruela por abajo, hace que las sombras tiren a ciruela y nunca a negro. El contraste
    // entre caras sigue siendo el de WRK-TASK-050.
    this.scene.add(new THREE.HemisphereLight('#f4c9c0', '#5e1a46', 1.25));
    this.sun = new THREE.DirectionalLight('#ffd6a0', 2.9);
    this.sun.position.copy(SUN_LIGHT);
    this.sun.castShadow = quality !== 'low';
    const sc = this.sun.shadow.camera;
    sc.left = sc.bottom = -38;
    sc.right = sc.top = 38;
    sc.near = 10;
    sc.far = 150;
    this.sun.shadow.mapSize.set(quality === 'high' ? 2048 : 1024, quality === 'high' ? 2048 : 1024);
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.sun);

    this.scene.add(this.makeSky());
    this.scene.add(this.makeMountains());
    this.scene.add(this.makeIsland());
    this.scene.add(this.makeContactShadows());
    const { mesh, mat } = this.makeLava();
    this.lava = mesh;
    this.lavaMat = mat;
    this.scene.add(mesh);
    const embers = this.makeEmbers(quality === 'high' ? 520 : quality === 'medium' ? 320 : 140);
    this.embers = embers.material as THREE.ShaderMaterial;
    this.scene.add(embers);
    this.scene.add(this.makeVignette());
    this.makeClouds();
    this.scene.add(this.clouds);
    // Decoración fusionada por material: cientos de mallas pasan a ser una docena de llamadas.
    this.scene.add(mergeStatic(this.makeDecor(), true, quality !== 'low'));
    for (const slot of [0, 1, 2, 3]) this.scene.add(this.makeBastion(slot));
    this.resize();
  }

  setQuality(q: Quality) {
    this.quality = q;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, q === 'high' ? 2 : q === 'medium' ? 1.25 : 0.85));
    this.renderer.shadowMap.enabled = q !== 'low';
    this.sun.castShadow = q !== 'low';
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m) m.needsUpdate = true;
    });
    this.resize();
  }

  resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // En vertical (móvil) se abre el campo vertical para no bajar de 40° en horizontal: si no,
    // con 55° en vertical el ancho se queda en ~25° y los castillos se salen por los lados.
    const minH = Math.tan((40 * Math.PI) / 360);
    const v = Math.max(Math.tan((55 * Math.PI) / 360), minH / this.camera.aspect);
    this.camera.fov = (Math.atan(v) * 360) / Math.PI;
    this.camera.updateProjectionMatrix();
    if (this.vignette) this.vignette.uniforms.uAspect.value = w / h;
  }

  private makeSky() {
    const geo = new THREE.SphereGeometry(600, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      // Hueso arriba, crema en medio y melocotón en el horizonte; sol grande, bajo y pálido.
      uniforms: { top: { value: new THREE.Color(SUNSET.hueso) }, mid: { value: new THREE.Color(SUNSET.crema) }, bottom: { value: new THREE.Color(SUNSET.melocoton) }, sun: { value: new THREE.Color(SUNSET.hueso) }, sunDir: { value: SUN_SKY.clone() } },
      vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 sun; uniform vec3 sunDir; varying vec3 vDir;
        void main(){
          float h = vDir.y;
          vec3 c = h > 0.16 ? mix(mid, top, smoothstep(0.16, 0.6, h)) : mix(bottom, mid, smoothstep(0.0, 0.16, h));
          float s = max(dot(vDir, sunDir), 0.0);
          c = mix(c, sun, smoothstep(0.9952, 0.9962, s) * 0.85 + pow(s, 40.0) * 0.18);
          gl_FragColor = vec4(c, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    const m = new THREE.Mesh(geo, mat);
    m.renderOrder = -10;
    return m;
  }

  // Tres capas de montañas alrededor del mar de lava (R-10 D2): naranja a lo lejos, grana en medio
  // y vino cerca. Siluetas planas sin luz ni niebla, como en las maquetas: una sola malla con
  // colores por vértice, una llamada de dibujo y unos 350 triángulos.
  private makeMountains() {
    const r = rng(44);
    const layers: [radius: number, hMin: number, hMax: number, segs: number, color: string][] = [
      [340, 22, 44, 15, SUNSET.naranja],
      [280, 12, 26, 19, SUNSET.grana],
      [225, 5, 13, 24, SUNSET.vino],
    ];
    const verts: number[] = [];
    const colors: number[] = [];
    for (const [rad, hMin, hMax, segs, color] of layers) {
      const c = new THREE.Color(color);
      const a0 = r.range(0, Math.PI * 2);
      // Picos y valles alternos: montañas anchas e irregulares.
      const pts = Array.from({ length: segs * 2 }, (_, i) => {
        const a = a0 + ((i + r.range(-0.25, 0.25)) / (segs * 2)) * Math.PI * 2;
        const h = i % 2 ? r.range(hMin * 0.35, hMin * 0.7) : r.range(hMin, hMax);
        const d = rad + r.range(-12, 12);
        return [Math.cos(a) * d, h, Math.sin(a) * d];
      });
      const base = -24;
      for (let i = 0; i < pts.length; i++) {
        const [x0, y0, z0] = pts[i];
        const [x1, y1, z1] = pts[(i + 1) % pts.length];
        verts.push(x0, base, z0, x0, y0, z0, x1, y1, z1, x0, base, z0, x1, y1, z1, x1, base, z1);
        for (let k = 0; k < 6; k++) colors.push(c.r, c.g, c.b);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }));
    m.renderOrder = -5;
    return m;
  }

  // Sombra de contacto en la base de cada castillo (ajuste de R-10): una orla ciruela que se
  // desvanece fuera del contorno del castillo y lo separa del suelo terracota, sobre todo al rojo.
  // Las cuatro en una malla: una llamada de dibujo.
  private makeContactShadows() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!;
    const img = g.createImageData(size, size);
    const inner = CASTLE_HALF / SHADOW_HALF;
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        // Distancia de «caja» al centro, de 0 a 1 en el borde de la sombra.
        const d = Math.max(Math.abs((x + 0.5) / size - 0.5), Math.abs((y + 0.5) / size - 0.5)) * 2;
        const a = d <= inner ? 1 : Math.max(0, 1 - (d - inner) / (1 - inner)) ** 1.6;
        img.data.set([74, 7, 48, Math.round(a * 255)], (y * size + x) * 4);
      }
    g.putImageData(img, 0, 0);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    const geos = [0, 1, 2, 3].map((slot) => {
      const geo = new THREE.PlaneGeometry(SHADOW_HALF * 2, SHADOW_HALF * 2);
      geo.rotateX(-Math.PI / 2);
      geo.rotateY(castleYaw(slot));
      const o = castleOrigin(slot);
      geo.translate(o[0], 0.03, o[2]);
      return geo;
    });
    const mat = new THREE.MeshBasicMaterial({ map, transparent: true, opacity: 0.7, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
    const m = new THREE.Mesh(mergeGeometries(geos), mat);
    m.renderOrder = 1;
    return m;
  }

  private makeIsland() {
    const g = new THREE.Group();
    const ring = islandOutline(12);
    // Tapa de hierba.
    const shape = new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z)));
    const topGeo = new THREE.ShapeGeometry(shape, 4);
    topGeo.rotateX(-Math.PI / 2);
    const uv = topGeo.attributes.uv as THREE.BufferAttribute;
    const pos = topGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 60 + 0.5, pos.getZ(i) / 60 + 0.5);
    const top = new THREE.Mesh(topGeo, toon('#ffffff', { map: tex.earth() }));
    top.receiveShadow = true;
    g.add(top);

    // Acantilados low-poly: anillos que se estrechan hacia abajo con algo de ruido.
    const r = rng(77);
    const levels = [
      [0, 1.0],
      [-0.5, 1.012],
      [-1.8, 0.985],
      [-3.5, 0.94],
      [-6, 0.86],
      [-9.5, 0.7],
      [-14, 0.4],
    ];
    const rings = levels.map(([y, s], li) =>
      ring.map(([x, z]) => {
        const j = li === 0 ? 0 : r.range(-0.9, 0.9);
        return new THREE.Vector3(x * s + j, y + (li ? r.range(-0.4, 0.4) : 0), z * s + j);
      }),
    );
    const verts: number[] = [];
    const colors: number[] = [];
    // Borde de tierra terracota y laterales vino que se oscurecen hacia ciruela (R-10 D2).
    const bands = ['#b26d50', '#9a2f33', '#8a1d33', '#7a0c31', '#6a0a31', '#5a0830', '#4a0730'].map((c) => new THREE.Color(c));
    for (let l = 0; l < rings.length - 1; l++) {
      const a = rings[l];
      const b = rings[l + 1];
      for (let i = 0; i < a.length; i++) {
        const i2 = (i + 1) % a.length;
        for (const v of [a[i], b[i], a[i2], a[i2], b[i], b[i2]]) verts.push(v.x, v.y, v.z);
        const c = bands[l].clone().offsetHSL(0, 0, r.range(-0.04, 0.04));
        for (let k = 0; k < 6; k++) colors.push(c.r, c.g, c.b);
      }
    }
    // Punta inferior.
    const last = rings[rings.length - 1];
    for (let i = 0; i < last.length; i++) {
      const i2 = (i + 1) % last.length;
      for (const v of [last[i], new THREE.Vector3(0, -24, 0), last[i2]]) verts.push(v.x, v.y, v.z);
      const tip = new THREE.Color(SUNSET.ciruela);
      for (let k = 0; k < 3; k++) colors.push(tip.r, tip.g, tip.b);
    }
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    cg.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    cg.computeVertexNormals();
    const cm = toon('#ffffff');
    cm.vertexColors = true;
    const cliff = new THREE.Mesh(cg, cm);
    cliff.receiveShadow = true;
    g.add(cliff);
    return g;
  }

  private makeLava() {
    const mat = new THREE.ShaderMaterial({
      fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uIsle: { value: 0 } }]),
      vertexShader: /* glsl */ `
        uniform float uTime; varying vec2 vUv; varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){
          vec4 w = modelMatrix * vec4(position, 1.0);
          w.y += sin(w.x * 0.15 + uTime * 0.4) * 0.12 + cos(w.z * 0.12 + uTime * 0.3) * 0.12;
          vW = w.xyz;
          vec4 mvPosition = viewMatrix * w;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uIsle; varying vec3 vW;
        #include <fog_pars_fragment>
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
          return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
        float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
        // Distancia al contorno de la isla (cuadrado redondeado) a la altura de la lava.
        float sdIsle(vec2 p, float halfSide){ float r = ${ISLAND_CORNER_R.toFixed(1)}; vec2 q = abs(p) - vec2(halfSide - r); return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
        void main(){
          vec2 p = vW.xz * 0.07;
          // Lava tranquila (R-10, tras revisar la fase 1): es fondo, no compite con la interfaz. Base
          // grana oscurecida hacia vino en placas grandes y lentas; brillos naranja finos y escasos.
          float t = uTime * 0.5;
          float warp = fbm(p * 1.6 - t * 0.03);
          float n = fbm(p + vec2(t * 0.04, t * 0.025) + warp * 0.9);
          // Colores en sRGB: grana, vino y naranja de la paleta.
          vec3 grana = vec3(0.804, 0.102, 0.188), vino = vec3(0.478, 0.047, 0.192), naranja = vec3(0.996, 0.537, 0.196);
          vec3 granaOscura = mix(grana, vino, 0.3);
          vec3 c = mix(granaOscura, mix(grana, vino, 0.62), smoothstep(0.5, 0.53, n));
          // Vetas: líneas finas en el borde de las placas, y solo en una parte del mar.
          float vein = 1.0 - smoothstep(0.0, 0.009, abs(n - 0.515));
          float few = smoothstep(0.52, 0.6, fbm(p * 0.45 + 7.3 + t * 0.01));
          float pulse = 0.75 + 0.25 * sin(uTime * 0.8 + warp * 6.0);
          c = mix(c, naranja, vein * few * pulse);
          // Junto al acantilado, una franja estrecha más caliente, en naranja y sin llegar al amarillo.
          if (uIsle > 0.0) {
            float d = sdIsle(vW.xz, uIsle);
            float rim = clamp(exp(-max(d, 0.0) * 1.1) * (0.8 + 0.2 * sin(uTime * 1.1 + vW.x * 0.3 + vW.z * 0.2)), 0.0, 1.0);
            c = mix(c, naranja, rim * 0.7);
          }
          // A lineal para mezclar con la niebla, y vuelta a la salida.
          gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0);
          #include <fog_fragment>
          #include <colorspace_fragment>
        }`,
    });
    const geo = new THREE.PlaneGeometry(900, 900, 90, 90);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = this.lavaTarget;
    return { mesh, mat };
  }

  // Chispas que suben del mar de lava. Todo se calcula en el shader a partir de una semilla por
  // chispa, así que no cuestan nada de CPU.
  private makeEmbers(n: number) {
    const r = rng(31);
    const pos = new Float32Array(n * 3);
    const seed = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const a = r.range(0, Math.PI * 2);
      // Más chispas cerca de la isla, que es donde mira la cámara.
      const d = ISLAND_HALF + 1 + r.next() ** 2 * 75;
      pos.set([Math.cos(a) * d, 0, Math.sin(a) * d], i * 3);
      seed.set([r.next(), r.range(0.6, 1.6)], i * 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 2));
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uLava: { value: this.lavaTarget }, uViewH: { value: 720 } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform float uLava; uniform float uViewH; attribute vec2 aSeed; varying float vLife;
        void main(){
          float H = 12.0;
          float t = mod(uTime * aSeed.y + aSeed.x * H, H);
          vLife = t / H;
          vec3 w = position;
          w.y = uLava + t;
          w.x += sin(uTime * 0.9 + aSeed.x * 40.0) * vLife * 1.6;
          w.z += cos(uTime * 0.7 + aSeed.x * 23.0) * vLife * 1.6;
          vec4 mv = viewMatrix * vec4(w, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = 0.34 * projectionMatrix[1][1] * uViewH * 0.5 / max(0.5, -mv.z);
        }`,
      fragmentShader: /* glsl */ `
        varying float vLife;
        void main(){
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          float a = (1.0 - d * 2.0) * (1.0 - vLife) * smoothstep(0.0, 0.1, vLife);
          gl_FragColor = vec4(vec3(1.0, 0.55 + 0.35 * (1.0 - vLife), 0.15) * a, a);
        }`,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    return pts;
  }

  // Viñeta suave y cálida en los bordes de la pantalla: centra la mirada en la acción.
  private makeVignette() {
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uAspect: { value: 1.6 } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uAspect; varying vec2 vUv;
        void main(){
          vec2 q = (vUv - 0.5) * vec2(uAspect, 1.0);
          float v = smoothstep(0.55, 1.15, length(q) / sqrt(uAspect * uAspect + 1.0) * 2.0);
          gl_FragColor = vec4(0.29, 0.027, 0.19, v * 0.4);
        }`,
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    m.frustumCulled = false;
    m.renderOrder = 1000;
    this.vignette = mat;
    return m;
  }

  private vignette!: THREE.ShaderMaterial;

  private makeClouds() {
    const r = rng(12);
    // Nubes hueso; la cara en sombra se aclara para que no se vea parda contra el cielo crema.
    const mat = toon(SUNSET.hueso, { emissive: '#7a5a52' });
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const tmp = new THREE.Group();
    for (let i = 0; i < 16; i++) {
      const c = new THREE.Group();
      const n = r.int(3, 6);
      for (let k = 0; k < n; k++) {
        const m = new THREE.Mesh(geo, mat);
        const s = r.range(2.5, 5);
        m.scale.set(s * 1.3, s * 0.8, s);
        m.position.set(k * 3 - n * 1.5, r.range(-0.8, 0.8), r.range(-1.5, 1.5));
        c.add(m);
      }
      const a = r.range(0, Math.PI * 2);
      const d = r.range(70, 200);
      c.position.set(Math.cos(a) * d, r.range(18, 55), Math.sin(a) * d);
      tmp.add(c);
    }
    // Todas las nubes en una sola malla; giran juntas alrededor de la isla.
    this.clouds.add(mergeStatic(tmp, false, false));
  }

  private makeDecor() {
    const g = new THREE.Group();
    const r = rng(5);
    // Pinos ciruela sobre la tierra terracota (R-10 D2).
    const trunk = toon('#5a2a26');
    const leaves = [toon(SUNSET.ciruela), toon('#5c1442'), toon('#3d0629')];
    const rockMat = toon('#a8949c');
    const flowerCols = [SUNSET.naranja, SUNSET.crema, SUNSET.hueso, SUNSET.grana].map((c) => toon(c));
    let placed = 0;
    // Solo en zonas que no tapan las líneas de tiro: franjas del borde entre castillos
    // y bosquecillos cerca del centro, lejos de las diagonales.
    const zones: [number, number, number, number][] = [
      [-11, 11, 23.5, 27.5],
      [-11, 11, -27.5, -23.5],
      [23.5, 27.5, -11, 11],
      [-27.5, -23.5, -11, 11],
      [-3, 3, 7, 12],
      [-3, 3, -12, -7],
      [7, 12, -3, 3],
      [-12, -7, -3, 3],
    ];
    for (let tries = 0; tries < 400 && placed < 30; tries++) {
      const zn = zones[tries % zones.length];
      const x = r.range(zn[0], zn[1]);
      const z = r.range(zn[2], zn[3]);
      if (Math.abs(Math.abs(x) - Math.abs(z)) < 4) continue;
      const kind = r.next();
      if (kind < 0.4) {
        const t = new THREE.Group();
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.4, 6), trunk);
        tr.position.y = 0.7;
        t.add(tr);
        const lm = r.pick(leaves);
        for (let k = 0; k < 3; k++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(1.3 - k * 0.3, 1.5, 7), lm);
          cone.position.y = 1.6 + k * 0.8;
          t.add(cone);
        }
        t.scale.setScalar(r.range(0.8, 1.3));
        t.position.set(x, 0, z);
        t.traverse((o) => (o.castShadow = true));
        g.add(outline(t, 0.03));
      } else if (kind < 0.65) {
        const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r.range(0.4, 0.9), 0), rockMat);
        rock.position.set(x, 0.2, z);
        rock.rotation.set(r.range(0, 3), r.range(0, 3), 0);
        rock.castShadow = true;
        g.add(outline(rock, 0.03));
      } else {
        const f = new THREE.Group();
        for (let k = 0; k < 5; k++) {
          const fl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 4), r.pick(flowerCols));
          fl.position.set(r.range(-0.5, 0.5), 0.12, r.range(-0.5, 0.5));
          f.add(fl);
        }
        f.position.set(x, 0, z);
        g.add(f);
      }
      placed++;
    }
    // Islotes flotando a lo lejos.
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      const d = r.range(85, 140);
      const isle = new THREE.Mesh(new THREE.ConeGeometry(r.range(4, 8), r.range(6, 10), 7), toon(SUNSET.vino));
      isle.rotation.x = Math.PI;
      isle.position.set(Math.cos(a) * d, r.range(-2, 12), Math.sin(a) * d);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry((isle.geometry as THREE.ConeGeometry).parameters.radius, (isle.geometry as THREE.ConeGeometry).parameters.radius, 0.8, 7), toon(SUNSET.terracota));
      cap.position.y = -(isle.geometry as THREE.ConeGeometry).parameters.height / 2;
      isle.add(cap);
      isle.userData.bob = r.range(0, 6);
      g.add(isle);
    }
    return g;
  }

  // Bastión de piedra con el estandarte, donde va la catapulta.
  private makeBastion(slot: number) {
    const g = new THREE.Group();
    const p = toWorld(slot, [CATAPULT_LOCAL[0], 0, CATAPULT_LOCAL[2]]);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.45, CATAPULT_LOCAL[1], 10), toon('#ffffff', { map: tex.stone() }));
    base.position.set(p[0], CATAPULT_LOCAL[1] / 2, p[2]);
    base.castShadow = base.receiveShadow = true;
    g.add(outline(base, 0.035));
    g.userData.slot = slot;
    return g;
  }

  update(dt: number) {
    const t = (performance.now() - this.t0) / 1000;
    this.lavaMat.uniforms.uTime.value = t;
    // La lava sube despacio hasta su nivel.
    this.lava.position.y += (this.lavaTarget - this.lava.position.y) * Math.min(1, dt * 1.5);
    // El acantilado se estrecha hacia abajo; con la isla inundada ya no hay borde.
    const ly = this.lava.position.y;
    this.lavaMat.uniforms.uIsle.value = ly < 0 ? ISLAND_HALF * (1 + Math.max(-0.07, ly * 0.017)) : 0;
    this.embers.uniforms.uTime.value = t;
    this.embers.uniforms.uLava.value = ly;
    const buf = this.renderer.getDrawingBufferSize(_size);
    this.embers.uniforms.uViewH.value = buf.y;
    this.clouds.rotation.y += dt * 0.004;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

const _size = new THREE.Vector2();

export { castleOrigin };
