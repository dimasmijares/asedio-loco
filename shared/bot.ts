import { AMMO, type AmmoId } from './ammo';
import { clampAim, solveAim, type Aim } from './ballistics';
import { BLOCKS_PER_CASTLE, CASTLE_SCALE } from './castle';
import { launchPoint, toWorld } from './map';
import { DEG, type Rng, type Vec3 } from './math';
import type { MatchState, PlayerState } from './match';
import type { Difficulty } from './protocol';

export interface BotSkill {
  yawSigma: number; // desviación del rumbo (rad)
  powerSigma: number; // desviación relativa de la potencia
  pKing: number; // probabilidad de apuntar al rey (si no, a la estructura)
  pWeakest: number; // probabilidad de ir a por el más débil (si no, el más cercano)
  lockDelay: [number, number]; // segundos que tarda en confirmar
}

export const BOT_SKILL: Record<Difficulty, BotSkill> = {
  facil: { yawSigma: 5.5 * DEG, powerSigma: 0.1, pKing: 0.25, pWeakest: 0.3, lockDelay: [4, 8] },
  normal: { yawSigma: 3.3 * DEG, powerSigma: 0.055, pKing: 0.4, pWeakest: 0.5, lockDelay: [2.5, 6] },
  dificil: { yawSigma: 1.7 * DEG, powerSigma: 0.03, pKing: 0.6, pWeakest: 0.7, lockDelay: [1.5, 4] },
};

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

export function botDecide(s: MatchState, me: PlayerState, kingPos: Record<number, Vec3>, r: Rng): BotDecision {
  const skill = BOT_SKILL[me.difficulty ?? 'normal'];
  const rivals = s.players.filter((p) => p.alive && p.slot !== me.slot);
  const lp = launchPoint(me.slot);
  let target = rivals[0]?.slot ?? me.target;
  if (rivals.length) {
    if (r.next() < skill.pWeakest) target = [...rivals].sort((a, b) => a.blocks - b.blocks)[0].slot;
    else
      target = [...rivals].sort((a, b) => {
        const pa = kingPos[a.slot] ?? toWorld(a.slot, [0, 0, 0]);
        const pb = kingPos[b.slot] ?? toWorld(b.slot, [0, 0, 0]);
        return Math.hypot(pa[0] - lp[0], pa[2] - lp[2]) - Math.hypot(pb[0] - lp[0], pb[2] - lp[2]);
      })[0].slot;
  }

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
  if (r.next() < skill.pKing && kingPos[target]) {
    const k = kingPos[target];
    point = [k[0], k[1] + 0.2, k[2]];
  } else {
    point = toWorld(target, r.pick(STRUCTURE));
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
