import * as THREE from 'three';
import { AMMO, type AmmoId } from '../../../shared/ammo';
import { PITCH_DEFAULT, clampAim, launchVelocity, trajectory, type Aim } from '../../../shared/ballistics';
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

// Vista previa de la trayectoria: solo el primer tramo, nunca el punto de caída.
//  - 'guide': mientras apuntas sin cargar, un tramo corto y tenue con fuerza media, para ver
//    hacia dónde y con qué elevación sale.
//  - 'charge': mientras cargas, la parábola con la fuerza actual hasta el 60 % del vuelo, así
//    que crece a medida que mantienes Espacio.
export class TrajectoryPreview {
  mesh: THREE.InstancedMesh;
  private n = 26;
  private mat: THREE.MeshToonMaterial;

  constructor(parent: THREE.Object3D) {
    this.mat = toon('#ffffff', { emissive: '#777777', transparent: true });
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 8, 6), this.mat, this.n);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    parent.add(this.mesh);
  }

  show(from: Vec3, aim: Aim, ammo: AmmoId, wind: Vec3, color = '#ffffff', mode: 'guide' | 'charge' = 'charge') {
    const a = AMMO[ammo];
    const guide = mode === 'guide';
    const shot = guide ? { ...aim, power: 0.55 } : aim;
    const pts = trajectory(from, launchVelocity(shot), { drag: a.drag || 0.004, windFactor: a.windFactor, wind, dt: 1 / 30, maxT: 8, stopY: 0 });
    const upTo = Math.max(2, Math.floor(pts.length * (guide ? 0.3 : 0.6)));
    const count = Math.min(this.n, upTo - 1);
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const k = 1 + Math.floor(((i + 1) / count) * (upTo - 2));
      const s = (guide ? 0.75 : 1) * (1 - (i / count) * 0.5);
      m.makeScale(s, s, s).setPosition(pts[k][0], pts[k][1], pts[k][2]);
      this.mesh.setMatrixAt(i, m);
    }
    this.mesh.count = count;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mat.color.set(color);
    this.mat.opacity = guide ? 0.55 : 1;
    this.mesh.visible = true;
  }

  hide() {
    this.mesh.visible = false;
  }
}
