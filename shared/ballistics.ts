import { DEG, clamp, lerp, type Vec3 } from './math';

export const GRAVITY = 9.81;
export const POWER_MIN = 9;
export const POWER_MAX = 33;
export const PITCH_MIN = 12 * DEG;
export const PITCH_MAX = 75 * DEG;
export const PITCH_DEFAULT = 40 * DEG;
export const PREVIEW_TIME = 0.42; // segundos de trayectoria visibles al apuntar

export interface Aim {
  yaw: number; // rumbo en el mundo (0 = +z)
  pitch: number; // elevación
  power: number; // 0..1
}

export function clampAim(a: Aim): Aim {
  return { yaw: a.yaw, pitch: clamp(a.pitch, PITCH_MIN, PITCH_MAX), power: clamp(a.power, 0, 1) };
}

export function launchSpeed(power: number) {
  return lerp(POWER_MIN, POWER_MAX, clamp(power, 0, 1));
}

export function launchVelocity(a: Aim): Vec3 {
  const s = launchSpeed(a.power);
  const c = Math.cos(a.pitch);
  return [Math.sin(a.yaw) * c * s, Math.sin(a.pitch) * s, Math.cos(a.yaw) * c * s];
}

// Aceleración aerodinámica sobre un proyectil: arrastre cuadrático y viento.
// El motor de física aplica exactamente esta fórmula como fuerza (masa × aceleración).
export function aeroAccel(v: Vec3, wind: Vec3, drag: number, windFactor: number): Vec3 {
  const rel: Vec3 = [v[0] - wind[0] * windFactor, v[1], v[2] - wind[2] * windFactor];
  const sp = Math.hypot(rel[0], rel[1], rel[2]);
  return [-drag * sp * rel[0], -drag * sp * rel[1], -drag * sp * rel[2]];
}

export interface TrajOpts {
  drag: number;
  windFactor: number;
  wind: Vec3;
  dt?: number;
  maxT?: number;
  stopY?: number;
}

// Trayectoria de una masa puntual. Sirve para la línea de puntos y para que los bots apunten.
export function trajectory(p0: Vec3, v0: Vec3, o: TrajOpts): Vec3[] {
  const dt = o.dt ?? 1 / 60;
  const maxT = o.maxT ?? 8;
  const stopY = o.stopY ?? -5;
  const pts: Vec3[] = [[...p0]];
  const p: Vec3 = [...p0];
  const v: Vec3 = [...v0];
  for (let t = 0; t < maxT; t += dt) {
    const a = aeroAccel(v, o.wind, o.drag, o.windFactor);
    v[0] += a[0] * dt;
    v[1] += (a[1] - GRAVITY) * dt;
    v[2] += a[2] * dt;
    p[0] += v[0] * dt;
    p[1] += v[1] * dt;
    p[2] += v[2] * dt;
    pts.push([p[0], p[1], p[2]]);
    if (p[1] < stopY && v[1] < 0) break;
  }
  return pts;
}

// Punto en el que la trayectoria baja por primera vez de la altura `y`.
export function landingPoint(p0: Vec3, v0: Vec3, y: number, o: TrajOpts): Vec3 | null {
  const pts = trajectory(p0, v0, { ...o, stopY: y - 0.01, dt: o.dt ?? 1 / 30 });
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (a[1] >= y && b[1] < y && b[1] < a[1]) {
      const t = (a[1] - y) / (a[1] - b[1]);
      return [lerp(a[0], b[0], t), y, lerp(a[2], b[2], t)];
    }
  }
  return null;
}

// Busca el rumbo y la potencia para caer en `target` con una elevación dada (para los bots).
export function solveAim(p0: Vec3, target: Vec3, pitch: number, o: TrajOpts): Aim | null {
  let yaw = Math.atan2(target[0] - p0[0], target[2] - p0[2]);
  let best: Aim | null = null;
  for (let iter = 0; iter < 3; iter++) {
    let lo = 0;
    let hi = 1;
    let dist = Infinity;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      const aim = { yaw, pitch, power: mid };
      const land = landingPoint(p0, launchVelocity(aim), target[1], o);
      const want = Math.hypot(target[0] - p0[0], target[2] - p0[2]);
      const got = land ? Math.hypot(land[0] - p0[0], land[2] - p0[2]) : 0;
      dist = land ? Math.hypot(land[0] - target[0], land[2] - target[2]) : Infinity;
      if (got < want) lo = mid;
      else hi = mid;
      best = aim;
    }
    // Corrige el rumbo por el viento: compara hacia dónde cae con hacia dónde se quería.
    const land = best && landingPoint(p0, launchVelocity(best), target[1], o);
    if (!land) return best;
    const wantYaw = Math.atan2(target[0] - p0[0], target[2] - p0[2]);
    const gotYaw = Math.atan2(land[0] - p0[0], land[2] - p0[2]);
    yaw += wantYaw - gotYaw;
    if (dist < 0.2) break;
  }
  return best;
}
