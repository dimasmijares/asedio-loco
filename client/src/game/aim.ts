import * as THREE from 'three';
import { AMMO, type AmmoId } from '../../../shared/ammo';
import { PITCH_DEFAULT, clampAim, firstHit, launchVelocity, trajectory, type Aim, type HitBox } from '../../../shared/ballistics';
import { islandSdf } from '../../../shared/map';
import { clamp, type Vec3 } from '../../../shared/math';
import { settings } from '../ui/settings';
import { toon } from './render/materials';

// Segundos que tarda la fuerza en llenarse del todo manteniendo Espacio.
export const CHARGE_TIME = 1.5;
// ?nolock=1 desactiva el bloqueo del puntero. Las pruebas lo necesitan: en Chromium sin
// interfaz, con el puntero bloqueado, los movimientos sintéticos llegan como +x, −x y 0.
const NO_LOCK = new URLSearchParams(location.search).has('nolock');
// Una pulsación más corta que esto no dispara (evita un tiro al 5 % por un toque sin querer).
const MIN_CHARGE = 0.12;
// Con el dedo se recorre menos distancia que con el ratón (pantallas pequeñas): más ganancia.
const TOUCH_GAIN = 1.6;

// Control de la catapulta:
//  - Clic derecho mantenido + ratón: horizontal = rumbo, vertical = elevación (Mayús: precisión).
//  - Espacio o clic izquierdo mantenidos: la fuerza sube de 0 a 100 % en CHARGE_TIME y se queda.
//    Al soltar, dispara.
//  - Táctil: un dedo arrastrado sobre la escena apunta (como el clic derecho); dos dedos
//    acercan o alejan la cámara; la fuerza se carga manteniendo el botón de disparo.
//  - A/D y W/S: rumbo y elevación con el teclado. Q/E: castillo objetivo. 1/2/3 (o el teclado
//    numérico): munición.
export class AimInput {
  aim: Aim = { yaw: 0, pitch: PITCH_DEFAULT, power: 0 };
  enabled = false;
  aiming = false; // clic derecho mantenido
  charging = false; // Espacio, clic izquierdo o botón de disparo mantenidos
  chargeT = 0;
  // Qué empezó la carga: solo la suelta esa misma entrada (soltar un clic en una tarjeta
  // mientras se mantiene Espacio no dispara).
  private chargeBy = '';
  onChange: (a: Aim) => void = () => {};
  onFire: (a: Aim) => void = () => {};
  onTooShort: () => void = () => {};
  onCycleTarget: (dir: number) => void = () => {};
  onSelectSlot: (i: number) => void = () => {};
  onPinch: (factor: number) => void = () => {}; // >1 al separar los dedos (acercar)
  private lx = 0;
  private ly = 0;
  private skipMove = false; // el primer movimiento tras bloquear el puntero trae un salto falso
  private keys = new Set<string>();
  // Dedos sobre la escena: uno apunta (como el clic derecho), dos pellizcan (zoom).
  private touches = new Map<number, { x: number; y: number }>();
  private pinch = 0;

  constructor(readonly dom: HTMLElement) {
    dom.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return this.touchDown(e);
      if (!this.enabled) return;
      // Clic izquierdo mantenido sobre la escena: carga la fuerza, igual que Espacio. Los
      // botones y tarjetas del HUD no llegan aquí (cortan el evento).
      if (e.button === 0) {
        dom.setPointerCapture?.(e.pointerId);
        this.startCharge('mouse');
        return;
      }
      if (e.button !== 2) return;
      this.aiming = true;
      this.lx = e.clientX;
      this.ly = e.clientY;
      dom.setPointerCapture?.(e.pointerId);
      // Con el puntero bloqueado el ratón no choca con los bordes de la pantalla.
      if (!NO_LOCK) {
        try {
          const r = dom.requestPointerLock?.() as unknown;
          if (r instanceof Promise) r.catch(() => {});
        } catch {
          /* sin bloqueo de puntero: se usan las coordenadas del ratón */
        }
      }
    });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return this.touchMove(e);
      if (!this.aiming) return;
      // Con el puntero bloqueado el cursor no se mueve y el desplazamiento llega en movementX/Y.
      // Si llega a 0 pero el cursor sí se ha movido (eventos sintéticos), se usa el cursor.
      const locked = document.pointerLockElement === dom;
      const cdx = e.clientX - this.lx;
      const cdy = e.clientY - this.ly;
      const lim = (v: number) => Math.max(-200, Math.min(200, v));
      const dx = lim(locked ? e.movementX || cdx : cdx);
      const dy = lim(locked ? e.movementY || cdy : cdy);
      this.lx = e.clientX;
      this.ly = e.clientY;
      if (locked && this.skipMove) {
        this.skipMove = false;
        return;
      }
      if (!this.enabled) return;
      const k = (e.shiftKey ? 0.25 : 1) * settings.sensitivity;
      this.aim = clampAim({ ...this.aim, yaw: this.aim.yaw - dx * 0.0035 * k, pitch: this.aim.pitch - dy * 0.0028 * k });
      this.onChange(this.aim);
    });
    const endAim = () => {
      if (!this.aiming) return;
      this.aiming = false;
      if (document.pointerLockElement === dom) document.exitPointerLock?.();
    };
    const touchEnd = (e: PointerEvent) => {
      if (!this.touches.delete(e.pointerId)) return;
      this.pinch = 0;
      if (this.touches.size === 0) this.aiming = false;
    };
    window.addEventListener('pointercancel', (e) => e.pointerType === 'touch' && touchEnd(e));
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') return touchEnd(e);
      if (e.button === 2) endAim();
      if (e.button === 0) this.releaseCharge('mouse');
    });
    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === dom) this.skipMove = true;
      else endAim();
    });
    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Space') e.preventDefault();
      if (!this.enabled) return;
      this.keys.add(e.code);
      if (e.code === 'Space' && !e.repeat) this.startCharge('space');
      if (e.code === 'Tab' || e.code === 'KeyE') {
        e.preventDefault();
        this.onCycleTarget(e.shiftKey ? -1 : 1);
      }
      if (e.code === 'KeyQ') this.onCycleTarget(-1);
      // 1/2/3 de la fila de números o del teclado numérico.
      const digit = e.code.match(/^(?:Digit|Numpad)([1-3])$/)?.[1];
      if (digit) this.onSelectSlot(Number(digit) - 1);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'Space') this.releaseCharge('space');
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.touches.clear();
      this.cancelCharge();
      endAim();
    });
  }

  private touchDown(e: PointerEvent) {
    this.dom.setPointerCapture?.(e.pointerId);
    this.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    // Un dedo apunta; con el segundo se deja de apuntar y se pellizca.
    this.aiming = this.touches.size === 1 && this.enabled;
    this.pinch = 0;
  }

  private touchMove(e: PointerEvent) {
    const t = this.touches.get(e.pointerId);
    if (!t) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    t.x = e.clientX;
    t.y = e.clientY;
    if (this.touches.size >= 2) {
      const [a, b] = [...this.touches.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (this.pinch > 0 && d > 0) this.onPinch(d / this.pinch);
      this.pinch = d;
      return;
    }
    if (!this.aiming || !this.enabled) return;
    const k = settings.sensitivity * TOUCH_GAIN;
    this.aim = clampAim({ ...this.aim, yaw: this.aim.yaw - dx * 0.0035 * k, pitch: this.aim.pitch - dy * 0.0028 * k });
    this.onChange(this.aim);
  }

  // También lo usa el botón de disparo (mantener pulsado con el ratón o el dedo).
  startCharge(by = 'button') {
    if (!this.enabled || this.charging) return;
    this.charging = true;
    this.chargeBy = by;
    this.chargeT = 0;
    this.aim = { ...this.aim, power: 0 };
    this.onChange(this.aim);
  }

  releaseCharge(by = 'button') {
    if (!this.charging || by !== this.chargeBy) return;
    this.charging = false;
    if (!this.enabled) return;
    if (this.chargeT < MIN_CHARGE) {
      this.onTooShort();
      return;
    }
    this.onFire({ ...this.aim });
  }

  cancelCharge() {
    this.charging = false;
  }

  setAim(a: Aim) {
    this.aim = clampAim(a);
  }

  // Teclado y carga de fuerza (llamar cada fotograma).
  tick(dt: number) {
    if (!this.enabled) {
      this.charging = false;
      return;
    }
    let changed = false;
    const fine = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 0.25 : 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) (this.aim.yaw += dt * 0.6 * fine), (changed = true);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) (this.aim.yaw -= dt * 0.6 * fine), (changed = true);
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) (this.aim.pitch += dt * 0.5 * fine), (changed = true);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) (this.aim.pitch -= dt * 0.5 * fine), (changed = true);
    if (this.charging) {
      this.chargeT += dt;
      this.aim.power = clamp(this.chargeT / CHARGE_TIME, 0, 1);
      changed = true;
    }
    if (changed) {
      this.aim = clampAim(this.aim);
      this.onChange(this.aim);
    }
  }
}

// Vista previa de la trayectoria.
//  - 'guide': mientras apuntas sin cargar, un tramo corto y tenue con fuerza media, para ver
//    hacia dónde y con qué elevación sale.
//  - 'charge': mientras cargas, la parábola entera con la fuerza actual hasta el primer bloque o
//    suelo que toca, con un anillo en ese punto (WRK-TASK-054). Lo que ves es lo que pasa.
export interface PreviewWorld {
  boxes: Iterable<HitBox>;
  lavaY: number;
}

export class TrajectoryPreview {
  mesh: THREE.InstancedMesh;
  // Contorno noche de cada punto (R-10 D2): sobre el cielo crema del atardecer, el color del
  // jugador solo no basta. Esferas algo mayores dibujadas por dentro, con las mismas matrices.
  private outline: THREE.InstancedMesh;
  private outlineMat: THREE.MeshBasicMaterial;
  private n = 64;
  private mat: THREE.MeshToonMaterial;
  private ring = new THREE.Group();
  private ringMat: THREE.MeshBasicMaterial;

  constructor(parent: THREE.Object3D, private world: () => PreviewWorld = () => ({ boxes: [], lavaY: -3.6 })) {
    this.mat = toon('#ffffff', { emissive: '#555555', transparent: true });
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 8, 6), this.mat, this.n);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    parent.add(this.mesh);
    this.outlineMat = new THREE.MeshBasicMaterial({ color: '#200432', side: THREE.BackSide, transparent: true });
    this.outline = new THREE.InstancedMesh(new THREE.SphereGeometry(0.2, 8, 6), this.outlineMat, this.n);
    this.outline.count = 0;
    this.outline.frustumCulled = false;
    // Las dos son transparentes: el contorno se dibuja antes, si no tapa los puntos.
    this.outline.renderOrder = 1;
    this.mesh.renderOrder = 2;
    parent.add(this.outline);
    // Anillo del punto de impacto: color del jugador sobre un borde blanco (R-01), con contorno
    // noche para que se lea sobre la tierra clara del atardecer (R-10 D2).
    // Se dibuja siempre por encima: aunque caiga detrás de un muro, se ve dónde.
    this.ringMat = new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false, transparent: true });
    const edge = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.17, 8, 40), new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false, transparent: true }));
    const core = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.1, 8, 40), this.ringMat);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.24, 8, 40), new THREE.MeshBasicMaterial({ color: '#200432', depthTest: false, transparent: true }));
    rim.renderOrder = 19;
    edge.renderOrder = 20;
    core.renderOrder = 21;
    edge.position.z = 0.015;
    core.position.z = 0.03;
    this.ring.add(rim, edge, core);
    this.ring.visible = false;
    parent.add(this.ring);
  }

  show(from: Vec3, aim: Aim, ammo: AmmoId, wind: Vec3, color = '#ffffff', mode: 'guide' | 'charge' = 'charge') {
    const a = AMMO[ammo];
    const guide = mode === 'guide';
    const shot = guide ? { ...aim, power: 0.55 } : aim;
    const w = this.world();
    let pts = trajectory(from, launchVelocity(shot), { drag: a.drag || 0.004, windFactor: a.windFactor, wind, dt: 1 / 60, maxT: 10, stopY: w.lavaY - 1 });
    let hit: ReturnType<typeof firstHit> = null;
    if (guide) pts = pts.slice(0, Math.max(2, Math.floor(pts.length * 0.3)));
    else {
      const groundAt = (x: number, z: number) => (islandSdf(x, z) < 0 ? Math.max(0, w.lavaY) : w.lavaY);
      hit = firstHit(pts, w.boxes, groundAt, a.radius || 0.3);
      if (hit) pts = [...pts.slice(0, hit.i), hit.p];
    }
    // Puntos repartidos por la longitud del arco, no por tiempo: el tramo largo no queda a trozos.
    const len: number[] = [0];
    for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]));
    const total = len[len.length - 1];
    const count = Math.max(1, Math.min(this.n, Math.round(total / (guide ? 1.1 : 1.3))));
    const m = new THREE.Matrix4();
    let j = 1;
    for (let i = 0; i < count; i++) {
      const d = ((i + 1) / (count + (hit ? 0.6 : 0))) * total;
      while (j < pts.length - 1 && len[j] < d) j++;
      const t = len[j] > len[j - 1] ? (d - len[j - 1]) / (len[j] - len[j - 1]) : 0;
      const p0 = pts[j - 1];
      const p1 = pts[j];
      const s = (guide ? 0.75 : 1) * (1 - (i / count) * 0.45);
      m.makeScale(s, s, s).setPosition(p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t);
      this.mesh.setMatrixAt(i, m);
      this.outline.setMatrixAt(i, m);
    }
    this.mesh.count = this.outline.count = count;
    this.mesh.instanceMatrix.needsUpdate = this.outline.instanceMatrix.needsUpdate = true;
    this.mat.color.set(color);
    this.mat.opacity = guide ? 0.55 : 1;
    this.outlineMat.opacity = guide ? 0.45 : 1;
    this.mesh.visible = this.outline.visible = true;
    this.ring.visible = !!hit;
    if (hit) {
      this.ringMat.color.set(color);
      this.ring.position.set(hit.p[0], hit.p[1], hit.p[2]);
      if (hit.box) {
        // Contra un bloque: de cara a quien dispara, algo separado para no hundirse en la pared.
        const prev = pts[Math.max(0, pts.length - 2)];
        const dir = new THREE.Vector3(prev[0] - hit.p[0], 0, prev[2] - hit.p[2]).normalize();
        this.ring.position.addScaledVector(dir, 0.08);
        this.ring.lookAt(this.ring.position.clone().add(dir));
      } else {
        this.ring.position.y += 0.06;
        this.ring.rotation.set(-Math.PI / 2, 0, 0);
      }
    }
  }

  hide() {
    this.mesh.visible = this.outline.visible = false;
    this.ring.visible = false;
  }
}
