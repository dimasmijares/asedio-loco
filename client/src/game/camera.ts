import * as THREE from 'three';

type Mode = 'orbit' | 'aim' | 'watch';

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
  shake = 0;
  // Mirar alrededor con el clic derecho. Se desactiva mientras se apunta, porque entonces el
  // clic derecho mueve la catapulta.
  lookEnabled = true;
  sharpness = 3;

  constructor(readonly camera: THREE.PerspectiveCamera, readonly dom: HTMLElement) {
    let dragging = false;
    let lx = 0;
    let ly = 0;
    // En táctil, un dedo mira alrededor (si no se está apuntando); con dos se pellizca.
    const fingers = new Set<number>();
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    dom.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') {
        fingers.add(e.pointerId);
        dragging = fingers.size === 1 && this.lookEnabled;
        lx = e.clientX;
        ly = e.clientY;
        return;
      }
      if (e.button !== 2 || !this.lookEnabled) return;
      dragging = true;
      lx = e.clientX;
      ly = e.clientY;
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragging || !this.lookEnabled || (e.pointerType === 'touch' && fingers.size !== 1)) return;
      this.userYaw -= (e.clientX - lx) * 0.006;
      this.userPitch = THREE.MathUtils.clamp(this.userPitch + (e.clientY - ly) * 0.004, -0.5, 0.9);
      lx = e.clientX;
      ly = e.clientY;
    });
    const up = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        fingers.delete(e.pointerId);
        if (fingers.size === 0) dragging = false;
      } else if (e.button === 2) dragging = false;
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
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
          .add(new THREE.Vector3(0, 8 * this.userZoom + this.userPitch * 6, 0));
        this.wantTarget.copy(this.aimFrom).addScaledVector(d, 22).add(new THREE.Vector3(0, 3.5, 0));
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
