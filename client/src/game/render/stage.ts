import * as THREE from 'three';
import { CATAPULT_LOCAL, ISLAND_CORNER_R, ISLAND_HALF, castleOrigin, toWorld } from '../../../../shared/map';
import { rng } from '../../../../shared/math';
import { mergeStatic, outline, toon } from './materials';
import { tex } from './textures';

export type Quality = 'low' | 'medium' | 'high';

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
    this.scene.fog = new THREE.Fog('#ffd9b0', 110, 420);

    // Luz: cielo azul arriba, resplandor de lava abajo, sol cálido con sombras.
    this.scene.add(new THREE.HemisphereLight('#cfeaff', '#ff9a5a', 1.35));
    this.sun = new THREE.DirectionalLight('#fff1d6', 2.4);
    this.sun.position.set(-35, 60, 25);
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
    this.scene.add(this.makeIsland());
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
    this.camera.updateProjectionMatrix();
    if (this.vignette) this.vignette.uniforms.uAspect.value = w / h;
  }

  private makeSky() {
    const geo = new THREE.SphereGeometry(600, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: { top: { value: new THREE.Color('#3aa7ff') }, mid: { value: new THREE.Color('#9bd8ff') }, bottom: { value: new THREE.Color('#ffd3a1') }, sunDir: { value: new THREE.Vector3(-35, 60, 25).normalize() } },
      vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; uniform vec3 sunDir; varying vec3 vDir;
        void main(){
          float h = vDir.y;
          vec3 c = h > 0.15 ? mix(mid, top, smoothstep(0.15, 0.7, h)) : mix(bottom, mid, smoothstep(-0.1, 0.15, h));
          float s = max(dot(vDir, sunDir), 0.0);
          c += vec3(1.0, 0.9, 0.6) * (smoothstep(0.995, 0.998, s) * 0.8 + pow(s, 24.0) * 0.25);
          gl_FragColor = vec4(c, 1.0);
        }`,
    });
    const m = new THREE.Mesh(geo, mat);
    m.renderOrder = -10;
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
    const top = new THREE.Mesh(topGeo, toon('#ffffff', { map: tex.grass() }));
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
    const bands = ['#7ab648', '#9b6b43', '#a87a52', '#8a5c38', '#7d5232', '#6b4630', '#5a3a28'].map((c) => new THREE.Color(c));
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
      for (let k = 0; k < 3; k++) colors.push(0.3, 0.2, 0.15);
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
          w.y += sin(w.x * 0.15 + uTime * 0.8) * 0.12 + cos(w.z * 0.12 + uTime * 0.6) * 0.12;
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
          float warp = fbm(p * 1.6 - uTime * 0.03);
          float n = fbm(p + vec2(uTime * 0.04, uTime * 0.025) + warp * 0.9);
          // Placas de costra oscura con grietas incandescentes entre ellas; lo líquido late.
          float crust = smoothstep(0.5, 0.56, n);
          // Junto al acantilado la lava está más caliente: sin costra y casi blanca.
          float rim = 0.0;
          if (uIsle > 0.0) {
            float d = sdIsle(vW.xz, uIsle);
            rim = clamp(exp(-max(d, 0.0) * 0.55) * (0.75 + 0.25 * sin(uTime * 2.2 + vW.x * 0.3 + vW.z * 0.2)), 0.0, 1.0);
            crust *= 1.0 - rim;
          }
          float crack = 1.0 - smoothstep(0.0, 0.03, abs(n - 0.52));
          float pulse = 0.86 + 0.14 * sin(uTime * 1.7 + warp * 9.0);
          vec3 hot = mix(vec3(1.0, 0.9, 0.3), vec3(1.0, 0.36, 0.05), smoothstep(0.22, 0.5, n)) * pulse;
          vec3 rock = mix(vec3(0.2, 0.05, 0.05), vec3(0.36, 0.1, 0.06), fbm(p * 5.0));
          vec3 c = mix(hot, rock, crust);
          c = mix(c, vec3(1.0, 0.72, 0.22), crack * crust);
          c = mix(c, vec3(1.0, 0.96, 0.62), rim * 0.9);
          c = floor(c * 7.0 + 0.5) / 7.0; // toon
          gl_FragColor = vec4(c, 1.0);
          #include <fog_fragment>
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
          gl_FragColor = vec4(0.16, 0.06, 0.1, v * 0.45);
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
    const mat = toon('#ffffff');
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
    const trunk = toon('#8b5a2b');
    const leaves = [toon('#3fae4a'), toon('#57c35a'), toon('#2e8b3d')];
    const rockMat = toon('#9aa1a8');
    const flowerCols = ['#ff5d8f', '#ffd23f', '#ffffff', '#b388ff'].map((c) => toon(c));
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
      const isle = new THREE.Mesh(new THREE.ConeGeometry(r.range(4, 8), r.range(6, 10), 7), toon('#8a5c38'));
      isle.rotation.x = Math.PI;
      isle.position.set(Math.cos(a) * d, r.range(-2, 12), Math.sin(a) * d);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry((isle.geometry as THREE.ConeGeometry).parameters.radius, (isle.geometry as THREE.ConeGeometry).parameters.radius, 0.8, 7), toon('#6fbd45'));
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
