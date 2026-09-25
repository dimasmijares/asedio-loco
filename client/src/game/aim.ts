import * as THREE from 'three';
import { AMMO, type AmmoId } from '../../../shared/ammo';
import { PITCH_DEFAULT, PREVIEW_TIME, clampAim, launchVelocity, trajectory, type Aim } from '../../../shared/ballistics';
import { DEG, clamp, type Vec3 } from '../../../shared/math';
import { settings } from '../ui/settings';
import { toon } from './render/materials';

// Control tipo tirachinas: pulsa y arrastra hacia atrás. La distancia del arrastre da la
// potencia y el ángulo del arrastre gira el tiro (tirar hacia la izquierda apunta a la
// derecha). Rueda o W/S: elevación. A/D: ajuste fino del rumbo. Mayúsculas: precisión.
export class AimInput {
  aim: Aim = { yaw: 0, pitch: PITCH_DEFAULT, power: 0.6 };
  baseYaw = 0;
  enabled = false;
  dragging = false;
  onChange: (a: Aim) => void = () => {};
  onRelease: (a: Aim) => void = () => {};
  onConfirm: () => void = () => {};
  onCycleTarget: (dir: number) => void = () => {};
  onSelectSlot: (i: number) => void = () => {};
  private sx = 0;
  private sy = 0;
  private vx = 0; // posición virtual del arrastre (con modo precisión)
  private vy = 0;
  private lx = 0;
  private ly = 0;
  private startYaw = 0;
  private keys = new Set<string>();

  constructor(readonly dom: HTMLElement) {
    dom.addEventListener('pointerdown', (e) => {
      if (!this.enabled || e.button !== 0) return;
      this.dragging = true;
      this.sx = this.lx = e.clientX;
      this.sy = this.ly = e.clientY;
      this.vx = this.vy = 0;
      this.startYaw = this.aim.yaw;
      dom.setPointerCapture?.(e.pointerId);
    });
    dom.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      const k = (e.shiftKey ? 0.25 : 1) * settings.sensitivity;
      this.vx += (e.clientX - this.lx) * k;
      this.vy += (e.clientY - this.ly) * k;
      this.lx = e.clientX;
      this.ly = e.clientY;
      this.fromDrag();
    });
    dom.addEventListener('pointerup', (e) => {
      if (!this.dragging || e.button !== 0) return;
      this.dragging = false;
      const moved = Math.hypot(this.vx, this.vy) > 6;
      if (moved) this.onRelease(this.aim);
    });
    dom.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.setPitch(this.aim.pitch - Math.sign(e.deltaY) * 2 * DEG);
      },
      { passive: false },
    );
    window.addEventListener('keydown', (e) => {
      if (!this.enabled || (e.target as HTMLElement)?.tagName === 'INPUT') return;
      this.keys.add(e.code);
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.onConfirm();
      }
      if (e.code === 'Tab' || e.code === 'KeyE') {
        e.preventDefault();
        this.onCycleTarget(e.shiftKey ? -1 : 1);
      }
      if (e.code === 'KeyQ') this.onCycleTarget(-1);
      if (e.code === 'Digit1' || e.code === 'Digit2') this.onSelectSlot(e.code === 'Digit1' ? 0 : 1);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }

  private fromDrag() {
    const w = this.dom.clientWidth || 800;
    const h = this.dom.clientHeight || 600;
    const len = Math.hypot(this.vx, this.vy);
    const power = clamp(len / (Math.min(w, h) * 0.42), 0, 1);
    const yawOff = len < 8 ? 0 : clamp(Math.atan2(this.vx, Math.max(this.vy, 10)) * 0.8, -1.3, 1.3);
    this.aim = clampAim({ yaw: this.startYaw + yawOff, pitch: this.aim.pitch, power });
    this.onChange(this.aim);
  }

  setPitch(p: number) {
    this.aim = clampAim({ ...this.aim, pitch: p });
    this.onChange(this.aim);
  }

  setAim(a: Aim) {
    this.aim = clampAim(a);
  }

  // Ajustes continuos con teclado (llamar cada fotograma).
  tick(dt: number) {
    if (!this.enabled) return;
    let changed = false;
    const fine = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 0.25 : 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) (this.aim.yaw += dt * 0.6 * fine), (changed = true);
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) (this.aim.yaw -= dt * 0.6 * fine), (changed = true);
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) (this.aim.pitch += dt * 0.5 * fine), (changed = true);
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) (this.aim.pitch -= dt * 0.5 * fine), (changed = true);
    if (this.keys.has('KeyR') || this.keys.has('PageUp')) (this.aim.power += dt * 0.4 * fine), (changed = true);
    if (this.keys.has('KeyF') || this.keys.has('PageDown')) (this.aim.power -= dt * 0.4 * fine), (changed = true);
    if (changed) {
      this.aim = clampAim(this.aim);
      this.onChange(this.aim);
    }
  }
}

// Línea de puntos con el primer tramo de la trayectoria (nunca el punto de impacto).
export class TrajectoryPreview {
  mesh: THREE.InstancedMesh;
  private n = 14;

  constructor(parent: THREE.Object3D) {
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 6, 4), toon('#ffffff', { emissive: '#777777' }), this.n);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    parent.add(this.mesh);
  }

  show(from: Vec3, aim: Aim, ammo: AmmoId, wind: Vec3, color = '#ffffff') {
    const a = AMMO[ammo];
    const pts = trajectory(from, launchVelocity(aim), { drag: a.drag || 0.004, windFactor: a.windFactor, wind, dt: PREVIEW_TIME / this.n, maxT: PREVIEW_TIME });
    const m = new THREE.Matrix4();
    let i = 0;
    for (let k = 1; k < pts.length && i < this.n; k++, i++) {
      const s = 1 - (k / pts.length) * 0.6;
      m.makeScale(s, s, s).setPosition(pts[k][0], pts[k][1], pts[k][2]);
      this.mesh.setMatrixAt(i, m);
    }
    this.mesh.count = i;
    this.mesh.instanceMatrix.needsUpdate = true;
    (this.mesh.material as THREE.MeshToonMaterial).color.set(color);
    this.mesh.visible = true;
  }

  hide() {
    this.mesh.visible = false;
  }
}
