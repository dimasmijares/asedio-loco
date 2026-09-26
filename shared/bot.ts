import { AMMO, type AmmoId } from './ammo';
import { clampAim, solveAim, type Aim } from './ballistics';
import { BLOCKS_PER_CASTLE, CASTLE_SCALE } from './castle';
import { castleOrigin, launchPoint, toWorld } from './map';
import { DEG, hashString, rng, type Rng, type Vec3 } from './math';
import type { MatchState, PlayerState } from './match';
import type { Difficulty } from './protocol';

export interface BotSkill {
  yawSigma: number; // desviación del rumbo (rad)
  powerSigma: number; // desviación relativa de la potencia
  pKing: number; // probabilidad de apuntar al rey (si no, a la estructura)
  pWeakest: number; // cuánto pesa ir a por el más débil (frente al más cercano) al elegir objetivo
  lockDelay: [number, number]; // segundos que tarda en confirmar
}

export const BOT_SKILL: Record<Difficulty, BotSkill> = {
  facil: { yawSigma: 5.5 * DEG, powerSigma: 0.1, pKing: 0.25, pWeakest: 0.3, lockDelay: [2, 3] },
  normal: { yawSigma: 3.3 * DEG, powerSigma: 0.055, pKing: 0.4, pWeakest: 0.5, lockDelay: [1.5, 2.5] },
  dificil: { yawSigma: 1.7 * DEG, powerSigma: 0.03, pKing: 0.6, pWeakest: 0.7, lockDelay: [1, 2] },
};

// Lo que el anfitrión sabe de la ronda para repartir los objetivos entre bots.
export interface TargetContext {
  taken?: Record<number, number>; // cuántos bots han elegido ya cada hueco en esta ronda
  attackers?: number[]; // huecos que atacaron a este bot en la ronda anterior
}

// A qué castillo va de verdad un disparo: el rival vivo más alineado con el rumbo. El
// `target` de un humano no sirve, porque puede apuntar con el ratón sin cambiarlo.
export function aimedAt(s: MatchState, p: PlayerState): number {
  const lp = launchPoint(p.slot);
  let best = p.target;
  let bestDiff = Infinity;
  for (const o of s.players) {
    if (!o.alive || o.slot === p.slot) continue;
    const c = castleOrigin(o.slot);
    const delta = Math.atan2(c[0] - lp[0], c[2] - lp[2]) - p.aim.yaw;
    const d = Math.abs(Math.atan2(Math.sin(delta), Math.cos(delta)));
    if (d < bestDiff) (bestDiff = d), (best = o.slot);
  }
  return best;
}

export const REVENGE_WEIGHT = 2.5;
export const TAKEN_WEIGHT = 0.4;

// Objetivo por sorteo ponderado: más peso al más débil y al más cercano (según la
// dificultad), a quien le atacó en la ronda anterior y menos a quien ya tiene otros bots
// encima. Los empates se resuelven al azar, no por el número de hueco.
export function pickTarget(me: PlayerState, rivals: PlayerState[], skill: BotSkill, kingPos: Record<number, Vec3>, r: Rng, ctx: TargetContext = {}): number {
  if (!rivals.length) return me.target;
  const lp = launchPoint(me.slot);
  const dist = (p: PlayerState) => {
    const k = kingPos[p.slot] ?? toWorld(p.slot, [0, 0, 0]);
    return Math.hypot(k[0] - lp[0], k[2] - lp[2]);
  };
  const minBlocks = Math.min(...rivals.map((p) => p.blocks));
  const minDist = Math.min(...rivals.map(dist));
  const weights = rivals.map((p) => {
    let w = 1;
    if (p.blocks <= minBlocks + 2) w *= 1 + 2 * skill.pWeakest;
    if (dist(p) <= minDist + 1) w *= 2 - skill.pWeakest;
    if (ctx.attackers?.includes(p.slot)) w *= REVENGE_WEIGHT;
    w *= TAKEN_WEIGHT ** (ctx.taken?.[p.slot] ?? 0);
    return w;
  });
  let x = r.next() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < rivals.length; i++) if ((x -= weights[i]) < 0) return rivals[i].slot;
  return rivals[rivals.length - 1].slot;
}

export interface BotDecision {
  target: number;
  selected: number;
  aim: Aim;
  lockDelay: number;
}

// Puntos de la estructura a los que apunta cuando no va a por el rey (coordenadas locales).
const STRUCTURE: Vec3[] = (
  [
    [0, 2.5, 3.3],
    [3.25, 3.5, 3.25],
    [-3.25, 3.5, 3.25],
    [3.3, 2.5, 0],
    [-3.3, 2.5, 0],
    [0, 3.4, 0],
  ] as Vec3[]
).map(([x, y, z]) => [x * CASTLE_SCALE, y * CASTLE_SCALE, z * CASTLE_SCALE]);

// Cada munición a su manera (WRK-TASK-033): las de demolición precisa van más a por el rey; las
// que ruedan, a la base de la muralla de delante; las de área, al centro o a las torres.
const L = (x: number, y: number, z: number): Vec3 => [x * CASTLE_SCALE, y * CASTLE_SCALE, z * CASTLE_SCALE];
const KING_BONUS: Partial<Record<AmmoId, number>> = { melon: 0.3, piano: 0.3, rock: 0.1 };
const AIM_POINTS: Partial<Record<AmmoId, Vec3[]>> = {
  log: [L(0, 2.5, 3.3)],
  snowball: [L(0, 2.5, 3.3)],
  magnet: [L(0, 2.5, 3.3)], // el portón de hierro
  cow: [L(0, 3.4, 0), L(0, 2.5, 3.3)],
  coconuts: [L(0, 3.4, 0)],
  chicken: [L(0, 3.4, 0), L(3.25, 3.5, 3.25), L(-3.25, 3.5, 3.25)],
};

export function botDecide(s: MatchState, me: PlayerState, kingPos: Record<number, Vec3>, r: Rng, ctx: TargetContext = {}): BotDecision {
  const skill = BOT_SKILL[me.difficulty ?? 'normal'];
  const rivals = s.players.filter((p) => p.alive && p.slot !== me.slot);
  const lp = launchPoint(me.slot);
  const target = pickTarget(me, rivals, skill, kingPos, r, ctx);

  // Munición: defensiva si el castillo está tocado; si no, la ofensiva más rara.
  const rank: Record<string, number> = { comun: 0, rara: 1, epica: 2, defensiva: -1 };
  let selected = 0;
  const hand = me.ammo;
  const defIdx = hand.findIndex((a) => AMMO[a].defensive);
  const hurt = me.blocks < BLOCKS_PER_CASTLE * 0.8;
  if (defIdx >= 0 && ((hurt && r.next() < 0.75) || hand.every((a) => AMMO[a].defensive))) selected = defIdx;
  else {
    let best = -2;
    hand.forEach((a, i) => {
      const k = rank[AMMO[a].rarity];
      if (k > best) (best = k), (selected = i);
    });
  }
  const ammo: AmmoId = hand[selected] ?? 'rock';

  // Punto de mira.
  let point: Vec3;
  if (r.next() < skill.pKing + (KING_BONUS[ammo] ?? 0) && kingPos[target]) {
    const k = kingPos[target];
    point = [k[0], k[1] + 0.2, k[2]];
  } else {
    point = toWorld(target, r.pick(AIM_POINTS[ammo] ?? STRUCTURE));
  }
  const a = AMMO[ammo];
  const pitch = ammo === 'log' || ammo === 'snowball' ? r.range(0.35, 0.55) : r.range(0.55, 0.95);
  let aim: Aim;
  if (a.defensive) aim = me.aim;
  else {
    const sol = solveAim(lp, point, pitch, { drag: a.drag || 0.004, windFactor: a.windFactor, wind: s.wind }) ?? me.aim;
    aim = clampAim({ yaw: sol.yaw + r.gauss() * skill.yawSigma, pitch: sol.pitch, power: sol.power * (1 + r.gauss() * skill.powerSigma) });
  }
  const [lo, hi] = skill.lockDelay;
  const delay = r.range(lo, hi) * (s.fast ? 0.25 : 1);
  return { target, selected, aim, lockDelay: delay };
}

// Decisiones de todos los bots de la ronda. Eligen en un orden al azar y cada uno sabe cuántos
// han ido ya a por cada rival, para que no acaben todos encima del mismo. `lastTargets` dice a
// quién apuntó cada jugador en la ronda anterior (venganza).
export function decideBots(s: MatchState, kingPos: Record<number, Vec3>, lastTargets: ReadonlyMap<number, number>): Map<number, BotDecision> {
  const taken: Record<number, number> = {};
  const order = s.players.filter((p) => p.alive && p.bot);
  const shuffle = rng((s.seed ^ hashString(`bots:${s.round}`)) >>> 0);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(shuffle.next() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const out = new Map<number, BotDecision>();
  for (const p of order) {
    const r = rng((s.seed ^ hashString(`bot:${s.round}:${p.slot}`)) >>> 0);
    const attackers = [...lastTargets].filter(([from, to]) => to === p.slot && from !== p.slot).map(([from]) => from);
    const d = botDecide(s, p, kingPos, r, { taken, attackers });
    taken[d.target] = (taken[d.target] ?? 0) + 1;
    out.set(p.slot, d);
  }
  return out;
}
