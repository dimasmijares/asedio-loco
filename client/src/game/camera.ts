import * as THREE from 'three';

type Mode = 'orbit' | 'aim' | 'follow' | 'watch';

// Cámara con transiciones suaves entre modos y sacudida por explosiones.
export class CameraRig {
  mode: Mode = 'orbit';
  pos = new THREE.Vector3(0, 45, 70);
  target = new THREE.Vector3(0, 0, 0);
  private wantPos = new THREE.Vector3();
  private wantTarget = new THREE.Vector3();
  // Órbita
  center = new THREE.Vector3();
  radius = 70;
  height = 38;
  angle = 0.6;
  autoSpeed = 0.05;
  // Ajustes del usuario (botón derecho y rueda)
  userYaw = 0;
  userPitch = 0;
  userZoom = 1;
  // Apuntado
  aimFrom = new THREE.Vector3();
  aimYaw = 0;
  // Seguimiento
  followGetter: (() => THREE.Vector3 | null) | null = null;
  followVel = new THREE.Vector3();
  private followDir = new THREE.Vector3(0, 0, 1);
  private lastFollow = new THREE.Vector3();
  shake = 0;
  slowmo = 1;
  // Mirar alrededor con el clic derecho. Se desactiva mientras se apunta, porque entonces el
  // clic derecho mueve la catapulta.
  lookEnabled = true;
  sharpness = 3;

  constructor(readonly camera: THREE.PerspectiveCamera, readonly dom: HTMLElement) {
    let dragging = false;
    let lx = 0;
    let ly = 0;
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    dom.addEventListener('pointerdown', (e) => {
      if (e.button !== 2 || !this.lookEnabled) return;
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      this.userYaw -= (e.clientX - lx) * 0.006;
      this.userPitch = THREE.MathUtils.clamp(this.userPitch + (e.clientY - ly) * 0.004, -0.5, 0.9);
      lx = e.clientX;
      ly = e.clientY;
    });
    window.addEventListener('pointerup', (e) => {
      if (e.button === 2) dragging = false;
    });
  }

  zoom(delta: number) {
    this.userZoom = THREE.MathUtils.clamp(this.userZoom * (1 + delta), 0.45, 1.8);
  }

  orbit(center: THREE.Vector3, radius: number, height: number, autoSpeed = 0.05) {
    this.mode = 'orbit';
    this.center.copy(center);
    this.radius = radius;
    this.height = height;
    this.autoSpeed = autoSpeed;
    this.sharpness = 2;
  }

  aim(from: THREE.Vector3, yaw: number) {
    if (this.mode !== 'aim') {
      this.userYaw = 0;
      this.userPitch = 0;
    }
    this.mode = 'aim';
    this.aimFrom.copy(from);
    this.aimYaw = yaw;
    this.sharpness = 4;
  }

  follow(getter: () => THREE.Vector3 | null, dir?: THREE.Vector3) {
    if (this.mode !== 'follow' && dir) this.followDir.copy(dir).setY(0).normalize();
    this.mode = 'follow';
    this.followGetter = getter;
    this.sharpness = 6;
    const p = getter();
    if (p) this.lastFollow.copy(p);
  }

  watch(target: THREE.Vector3, from: THREE.Vector3) {
    this.mode = 'watch';
    this.wantTarget.copy(target);
    this.wantPos.copy(from);
    this.sharpness = 2;
  }

  addShake(k: number) {
    this.shake = Math.min(1.5, this.shake + k);
  }

  update(dt: number) {
    switch (this.mode) {
      case 'orbit': {
        this.angle += dt * this.autoSpeed;
        const a = this.angle + this.userYaw;
        const r = this.radius * this.userZoom;
        const h = this.height * this.userZoom * (1 + this.userPitch);
        this.wantPos.set(this.center.x + Math.cos(a) * r, this.center.y + h, this.center.z + Math.sin(a) * r);
        this.wantTarget.copy(this.center);
        break;
      }
      case 'aim': {
        // Detrás y encima de la catapulta, mirando en la dirección del tiro.
        // Algo desplazada a la derecha para que el arco del tiro se vea con perspectiva.
        const yaw = this.aimYaw + this.userYaw * 0.6;
        const d = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
        const right = new THREE.Vector3(-d.z, 0, d.x).negate();
        // Más atrás y mirando más alto que antes: la parábola que crece al cargar cabe entera.
        const back = 12 * this.userZoom;
        this.wantPos
          .copy(this.aimFrom)
          .addScaledVector(d, -back)
          .addScaledVector(right, 3)
          .add(new THREE.Vector3(0, 6 * this.userZoom + this.userPitch * 6, 0));
        this.wantTarget.copy(this.aimFrom).addScaledVector(d, 22).add(new THREE.Vector3(0, 3.5, 0));
        break;
      }
      case 'follow': {
        const p = this.followGetter?.();
        if (p) {
          this.followVel.lerp(p.clone().sub(this.lastFollow).divideScalar(Math.max(dt, 1e-3)), Math.min(1, dt * 4));
          this.lastFollow.copy(p);
        }
        // Detrás y por encima del proyectil, mirando un poco por delante de él.
        const v = this.followVel.clone();
        v.y = 0;
        if (v.lengthSq() > 0.5) this.followDir.lerp(v.normalize(), Math.min(1, dt * 3)).normalize();
        this.wantTarget.copy(this.lastFollow).addScaledVector(this.followVel, 0.25);
        this.wantPos.copy(this.lastFollow).addScaledVector(this.followDir, -12).add(new THREE.Vector3(0, 5.5, 0));
        break;
      }
      case 'watch':
        break;
    }
    const k = 1 - Math.exp(-dt * this.sharpness);
    this.pos.lerp(this.wantPos, k);
    this.target.lerp(this.wantTarget, k);
    this.camera.position.copy(this.pos);
    if (this.shake > 0) {
      const s = this.shake * this.shake * 0.6;
      this.camera.position.add(new THREE.Vector3((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, (Math.random() - 0.5) * s));
      this.shake = Math.max(0, this.shake - dt * 2.2);
    }
    if (this.camera.position.y < 0.8) this.camera.position.y = 0.8;
    this.camera.lookAt(this.target);
  }

  snap() {
    this.update(0.016);
    this.pos.copy(this.wantPos);
    this.target.copy(this.wantTarget);
    this.camera.position.copy(this.pos);
    this.camera.lookAt(this.target);
  }
}
