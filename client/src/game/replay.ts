import * as THREE from 'three';
import type { Quat, Vec3 } from '../../../shared/math';
import type { SimEvent } from './sim/sim';

// Repetición de la caída de un rey. Cada cliente graba lo que ve (poses y eventos que llegan a
// la vista, vengan de la simulación local o de la red) y, cuando toca, lo vuelve a reproducir
// a cámara lenta sin simular nada. Así todos ven lo mismo que vieron en directo.

const MAX_POSES = 120_000; // entradas del búfer circular (t, id, p, q): ~4 MB
const KEEP_EVENTS = 15; // segundos de eventos que se guardan
const POSE_STEP = 1 / 30; // cada cuerpo se graba como mucho a 30 Hz

export interface ReplayTarget {
  time: number;
  applyPose(id: number, p: Vec3, q: Quat): void;
  applyEvent(e: SimEvent): void;
}

export class ReplayRecorder {
  private buf = new Float32Array(MAX_POSES * 9);
  private head = 0; // siguiente entrada a escribir
  private size = 0;
  private lastT = new Map<number, number>();
  events: { t: number; e: SimEvent }[] = [];
  base = 0; // origen de tiempos (el Float32 pierde precisión con tiempos grandes)

  pose(t: number, id: number, p: Vec3, q: Quat) {
    const last = this.lastT.get(id);
    // Con un 10 % de margen: a 60 fps, dos fotogramas quedan a una pizca menos de 1/30 s.
    if (last !== undefined && t - last < POSE_STEP * 0.9) return;
    this.lastT.set(id, t);
    const o = this.head * 9;
    this.buf[o] = t - this.base;
    this.buf[o + 1] = id;
    this.buf.set(p, o + 2);
    this.buf.set(q, o + 5);
    this.head = (this.head + 1) % MAX_POSES;
    this.size = Math.min(MAX_POSES, this.size + 1);
  }

  event(t: number, e: SimEvent) {
    this.events.push({ t, e });
    if (this.events.length > 4000 || (this.events.length && this.events[0].t < t - KEEP_EVENTS)) {
      const cut = this.events.findIndex((x) => x.t >= t - KEEP_EVENTS);
      this.events.splice(0, cut < 0 ? this.events.length : cut);
    }
  }

  // Momento en que cayó cada rey (el último, si hay varios).
  deathTime(slot: number): number | null {
    for (let i = this.events.length - 1; i >= 0; i--) {
      const x = this.events[i];
      if (x.e.e === 'king' && x.e.slot === slot) return x.t;
    }
    return null;
  }

  // Poses grabadas entre t0 y t1, en orden.
  posesBetween(t0: number, t1: number) {
    const out: { t: number; id: number; p: Vec3; q: Quat }[] = [];
    const start = (this.head - this.size + MAX_POSES) % MAX_POSES;
    for (let k = 0; k < this.size; k++) {
      const o = ((start + k) % MAX_POSES) * 9;
      const t = this.buf[o] + this.base;
      if (t < t0 || t > t1) continue;
      const b = this.buf;
      out.push({ t, id: b[o + 1], p: [b[o + 2], b[o + 3], b[o + 4]], q: [b[o + 5], b[o + 6], b[o + 7], b[o + 8]] });
    }
    return out;
  }

  eventsBetween(t0: number, t1: number) {
    return this.events.filter((x) => x.t >= t0 && x.t <= t1);
  }

  // Las entradas del búfer guardan tiempos relativos a `base` para no perder precisión.
  rebase(t: number) {
    if (t - this.base < 600) return;
    // Al cambiar el origen se pierde lo grabado (pasa como mucho cada 10 minutos, entre rondas).
    this.base = t;
    this.size = 0;
    this.head = 0;
    this.lastT.clear();
  }
}

// Una reproducción en curso: pone las poses grabadas y reemite los eventos al ritmo `speed`.
export class ReplayPlayer {
  private poses: { t: number; id: number; p: Vec3; q: Quat }[];
  private events: { t: number; e: SimEvent }[];
  private pi = 0;
  private ei = 0;
  t: number;
  done = false;

  constructor(
    rec: ReplayRecorder,
    readonly t0: number,
    readonly t1: number,
    readonly speed = 0.5,
  ) {
    this.poses = rec.posesBetween(t0, t1);
    this.events = rec.eventsBetween(t0, t1);
    this.t = t0;
  }

  // Poses de partida: la primera que se grabó de cada cuerpo dentro de la ventana
  // (lo que estaba quieto al principio se grabó justo al empezar a moverse).
  initialPoses() {
    const first = new Map<number, { p: Vec3; q: Quat }>();
    for (const x of this.poses) if (!first.has(x.id)) first.set(x.id, x);
    return first;
  }

  // Eventos de la ventana (para saber qué bloques hay que volver a poner, qué proyectiles…).
  get windowEvents() {
    return this.events;
  }

  step(dt: number, target: ReplayTarget) {
    if (this.done) return;
    this.t = Math.min(this.t1, this.t + dt * this.speed);
    while (this.pi < this.poses.length && this.poses[this.pi].t <= this.t) {
      const x = this.poses[this.pi++];
      target.applyPose(x.id, x.p, x.q);
    }
    while (this.ei < this.events.length && this.events[this.ei].t <= this.t) target.applyEvent(this.events[this.ei++].e);
    if (this.t >= this.t1) this.done = true;
  }
}

// Cámara de la repetición: cerca del rey, girando despacio a su alrededor.
export function replayCamera(king: THREE.Vector3, t: number, out: { from: THREE.Vector3; at: THREE.Vector3 }) {
  const a = 0.6 + t * 0.35;
  out.at.copy(king).add(new THREE.Vector3(0, 0.6, 0));
  out.from.copy(king).add(new THREE.Vector3(Math.cos(a) * 11, 6.5, Math.sin(a) * 11));
  return out;
}
