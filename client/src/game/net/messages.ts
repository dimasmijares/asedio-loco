// Mensajes de la partida que viajan dentro de `relay` (el servidor no los interpreta).
//
//   anfitrión → todos   st    estado de la partida (MatchState) cuando cambia
//   anfitrión → todos   tk    tic a 15 Hz: poses de lo que se ha movido, eventos de la
//                             simulación y puntería de los bots, con la hora del anfitrión
//   anfitrión → uno     full  estado completo (al final de cada ronda y a quien entra)
//   todos → todos       aim   hacia dónde apunta cada catapulta (~10 Hz)
//   jugador → anfitrión in    entrada del jugador (munición, objetivo, ¡listo!)
//   cliente → anfitrión hi    "acabo de llegar": el anfitrión responde con full
import type { AmmoId } from '../../../../shared/ammo';
import type { Aim } from '../../../../shared/ballistics';
import type { MatchState } from '../../../../shared/match';
import { MATERIAL_IDS, type MaterialId } from '../../../../shared/materials';
import type { Quat, Vec3 } from '../../../../shared/math';
import type { SimEvent } from '../sim/sim';

export interface StMsg {
  k: 'st';
  s: MatchState;
}
export interface TickMsg {
  k: 'tk';
  t: number;
  b?: number[]; // poses [id, x, y, z, qx, qy, qz, qw] cuantizadas, una tras otra
  e?: SimEvent[];
  a?: number[]; // punterías [slot, yaw, pitch, power, sel, tgt] (bots y anfitrión)
}
// Un estado de la misma partida (misma semilla) con versión menor que el que ya se tiene es
// viejo: no debe deshacer nada, ni el `MatchState` ni los bloques de un `full` (D-064).
export function isStale(current: { seed: number; v: number }, incoming: { seed: number; v: number }) {
  return incoming.seed === current.seed && incoming.v < current.v;
}

export interface FullMsg {
  k: 'full';
  t: number;
  s: MatchState;
  blocks: number[]; // [id, mat, sx, sy, sz, x, y, z, qx, qy, qz, qw] …
  kings: number[]; // [slot, x, y, z, qx, qy, qz, qw] …
  projs: { id: number; ammo: AmmoId; owner: number; scale?: number }[];
  shields: number[];
  lava: number;
}
export interface AimMsg {
  k: 'aim';
  slot: number;
  a: [number, number, number];
  sel: number;
  tgt: number;
}
export interface InMsg {
  k: 'in';
  aim?: [number, number, number];
  sel?: number;
  tgt?: number;
  lk?: boolean;
}
export interface HiMsg {
  k: 'hi';
}

export type GameMsg = StMsg | TickMsg | FullMsg | AimMsg | InMsg | HiMsg;

// Cuantización: centímetros para posiciones y 1/10000 para cuaterniones.
const P = 100;
const Q = 10000;

export function packPose(out: number[], id: number, p: Vec3, q: Quat) {
  out.push(id, Math.round(p[0] * P), Math.round(p[1] * P), Math.round(p[2] * P), Math.round(q[0] * Q), Math.round(q[1] * Q), Math.round(q[2] * Q), Math.round(q[3] * Q));
}

export function unpackPoses(b: number[], fn: (id: number, p: Vec3, q: Quat) => void, stride = 8, offset = 0) {
  for (let i = 0; i + stride <= b.length; i += stride) {
    const j = i + offset;
    const q: Quat = [b[j + 4] / Q, b[j + 5] / Q, b[j + 6] / Q, b[j + 7] / Q];
    const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
    fn(b[i], [b[j + 1] / P, b[j + 2] / P, b[j + 3] / P], [q[0] / n, q[1] / n, q[2] / n, q[3] / n]);
  }
}

export function packBlock(out: number[], id: number, mat: MaterialId, size: Vec3, p: Vec3, q: Quat) {
  out.push(id, MATERIAL_IDS.indexOf(mat), Math.round(size[0] * P), Math.round(size[1] * P), Math.round(size[2] * P));
  out.push(Math.round(p[0] * P), Math.round(p[1] * P), Math.round(p[2] * P), Math.round(q[0] * Q), Math.round(q[1] * Q), Math.round(q[2] * Q), Math.round(q[3] * Q));
}

export function unpackBlocks(b: number[], fn: (id: number, mat: MaterialId, size: Vec3, p: Vec3, q: Quat) => void) {
  for (let i = 0; i + 12 <= b.length; i += 12) {
    const q: Quat = [b[i + 8] / Q, b[i + 9] / Q, b[i + 10] / Q, b[i + 11] / Q];
    const n = Math.hypot(...q) || 1;
    fn(b[i], MATERIAL_IDS[b[i + 1]], [b[i + 2] / P, b[i + 3] / P, b[i + 4] / P], [b[i + 5] / P, b[i + 6] / P, b[i + 7] / P], [q[0] / n, q[1] / n, q[2] / n, q[3] / n]);
  }
}

export const aimToArr = (a: Aim): [number, number, number] => [Math.round(a.yaw * 1e4) / 1e4, Math.round(a.pitch * 1e4) / 1e4, Math.round(a.power * 1e4) / 1e4];
export const arrToAim = (a: [number, number, number]): Aim => ({ yaw: a[0], pitch: a[1], power: a[2] });

// Reloj del anfitrión en segundos (tiempo real, no de simulación: así la cámara lenta se ve igual en todos).
export const hostNow = () => performance.now() / 1000;
