import { DEG, clamp, lerp, quatRotate, type Quat, type Vec3 } from './math';

export const GRAVITY = 9.81;
export const POWER_MIN = 9;
export const POWER_MAX = 33;
export const PITCH_MIN = 12 * DEG;
export const PITCH_MAX = 75 * DEG;
export const PITCH_DEFAULT = 40 * DEG;

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

// Primer choque de una trayectoria (WRK-TASK-054): contra cajas orientadas (los bloques tal como
// se ven) o contra el suelo. `radius` engorda las cajas con el radio del proyectil.
export interface HitBox {
  p: Vec3;
  q: Quat;
  size: Vec3;
}

export interface TrajHit {
  p: Vec3;
  i: number; // índice del punto de la trayectoria justo después del choque
  box: boolean; // true si es un bloque, false si es el suelo
}

export function firstHit(pts: Vec3[], boxes: Iterable<HitBox>, groundAt: (x: number, z: number) => number, radius = 0): TrajHit | null {
  // Cajas cerca de la trayectoria: descarte rápido por esfera contra la caja que envuelve el arco.
  const lo: Vec3 = [Infinity, Infinity, Infinity];
  const hi: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of pts)
    for (let k = 0; k < 3; k++) {
      lo[k] = Math.min(lo[k], p[k]);
      hi[k] = Math.max(hi[k], p[k]);
    }
  const near: { b: HitBox; inv: Quat; h: Vec3; r: number }[] = []; // r: radio de descarte
  for (const b of boxes) {
    const r = Math.hypot(b.size[0], b.size[1], b.size[2]) / 2 + radius;
    if (b.p[0] + r < lo[0] || b.p[0] - r > hi[0] || b.p[1] + r < lo[1] || b.p[1] - r > hi[1] || b.p[2] + r < lo[2] || b.p[2] - r > hi[2]) continue;
    near.push({ b, inv: [-b.q[0], -b.q[1], -b.q[2], b.q[3]], h: [b.size[0] / 2, b.size[1] / 2, b.size[2] / 2], r });
  }
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const c = pts[i];
    let best = Infinity;
    for (const n of near) {
      const t = segBoxT(a, c, n.b.p, n.inv, n.h, radius);
      if (t !== null && t < best) best = t;
    }
    const g = groundAt(c[0], c[2]);
    let tg = Infinity;
    if (c[1] - radius <= g) {
      const ga = groundAt(a[0], a[2]);
      const da = a[1] - radius - ga;
      const dc = c[1] - radius - g;
      tg = da <= 0 ? 0 : da / (da - dc);
    }
    if (best === Infinity && tg === Infinity) continue;
    const t = Math.min(best, tg);
    return { p: [lerp(a[0], c[0], t), lerp(a[1], c[1], t), lerp(a[2], c[2], t)], i, box: best <= tg };
  }
  return null;
}

// Parámetro (0..1) en que una bola de radio r que recorre a→c toca la caja (en su marco local), o
// null. Primero el cruce con la caja engordada (rápido y conservador) y, desde ahí, la distancia
// exacta de la bola a la caja real en 6 pasos: en las esquinas, una bola que roza no toca.
function segBoxT(a: Vec3, c: Vec3, center: Vec3, inv: Quat, h: Vec3, r: number): number | null {
  const la = quatRotate(inv, [a[0] - center[0], a[1] - center[1], a[2] - center[2]]);
  const lc = quatRotate(inv, [c[0] - center[0], c[1] - center[1], c[2] - center[2]]);
  let t0 = 0;
  let t1 = 1;
  for (let k = 0; k < 3; k++) {
    const d = lc[k] - la[k];
    if (Math.abs(d) < 1e-9) {
      if (la[k] < -h[k] - r || la[k] > h[k] + r) return null;
      continue;
    }
    let u = (-h[k] - r - la[k]) / d;
    let v = (h[k] + r - la[k]) / d;
    if (u > v) [u, v] = [v, u];
    t0 = Math.max(t0, u);
    t1 = Math.min(t1, v);
    if (t0 > t1) return null;
  }
  const N = 6;
  for (let s = 0; s <= N; s++) {
    const t = t0 + ((t1 - t0) * s) / N;
    let d2 = 0;
    for (let k = 0; k < 3; k++) {
      const x = la[k] + (lc[k] - la[k]) * t;
      const e = Math.abs(x) - h[k];
      if (e > 0) d2 += e * e;
    }
    if (d2 <= r * r) return t;
  }
  return null;
}
