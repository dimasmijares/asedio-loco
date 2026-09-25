// Lógica pura de la partida: rondas, reparto de munición, lava, viento, eliminación y victoria.
// Se ejecuta en el anfitrión; el estado es serializable y viaja por la red tal cual.
import { drawAmmo, type AmmoId } from './ammo';
import { BLOCKS_PER_CASTLE } from './castle';
import { PITCH_DEFAULT, type Aim } from './ballistics';
import { LAVA_LEVELS, LAVA_RISE_EVERY, WIND_FROM_ROUND, castleOrigin, launchPoint } from './map';
import { hashString, rng, type Vec3 } from './math';
import { BOT_NAMES } from './players';
import type { Difficulty, RoomState } from './protocol';

export type Phase = 'intro' | 'aim' | 'impact' | 'replay' | 'results' | 'over';

export interface PlayerStats {
  dealt: number; // bloques rivales destruidos
  lost: number; // bloques propios perdidos
  kills: number;
  bestShot: number; // más bloques destruidos en una ronda
  whiffs: number; // disparos que no rompieron nada
  selfHits: number; // bloques propios rotos por su culpa
  shots: number;
  worstMiss: number; // metros por los que falló su peor disparo (sin romper nada)
}

export interface PlayerState {
  slot: number;
  id: string; // id de red ('bot0'… para bots)
  name: string;
  bot: boolean;
  difficulty?: Difficulty;
  alive: boolean;
  ammo: AmmoId[]; // en la mano (máx. 2)
  selected: number;
  locked: boolean;
  aim: Aim;
  target: number; // castillo al que apunta
  blocks: number; // bloques en pie
  stats: PlayerStats;
  eliminatedRound?: number;
  eliminatedOrder?: number;
  cause?: string;
}

export interface RoundResult {
  lost: Record<number, number>;
  dealt: Record<number, number>;
  eliminated: number[];
  mostDamaged: number | null;
  phrase: string;
}

export interface MatchState {
  v: number;
  round: number;
  phase: Phase;
  remaining: number; // segundos que quedan de la fase (aim/results/intro)
  players: PlayerState[];
  lavaLevel: number;
  lavaY: number;
  wind: Vec3;
  winner: number | null; // hueco ganador, -1 empate
  results: RoundResult | null;
  seed: number;
  fast: boolean;
  elimCount: number;
  replay: number[] | null; // reyes caídos en la ronda cuya caída se repite (fase 'replay')
}

export const MAX_ROUNDS = 24;
export const HAND = 3; // municiones distintas para elegir en cada ronda

// Jugadores de una partida en red: los humanos de la sala en sus huecos y los bots de
// relleno en los huecos libres más bajos. Anfitrión y clientes lo calculan igual.
export function matchPlayersFromRoom(room: RoomState) {
  const humans = room.players.map((p) => ({ slot: p.slot, id: p.id, name: p.name, bot: false as boolean, difficulty: undefined as Difficulty | undefined }));
  const used = new Set(humans.map((p) => p.slot));
  const bots: typeof humans = [];
  for (let slot = 0; slot < 4 && bots.length < room.config.bots; slot++) {
    if (used.has(slot)) continue;
    bots.push({ slot, id: `bot${slot}`, name: BOT_NAMES[slot % BOT_NAMES.length], bot: true, difficulty: room.config.difficulty });
  }
  return [...humans, ...bots].sort((a, b) => a.slot - b.slot);
}

export function newStats(): PlayerStats {
  return { dealt: 0, lost: 0, kills: 0, bestShot: 0, whiffs: 0, selfHits: 0, shots: 0, worstMiss: 0 };
}

export function defaultAim(slot: number, target: number): Aim {
  const p = launchPoint(slot);
  const t = castleOrigin(target);
  return { yaw: Math.atan2(t[0] - p[0], t[2] - p[2]), pitch: PITCH_DEFAULT, power: 0.55 };
}

export function createMatch(players: { slot: number; id: string; name: string; bot: boolean; difficulty?: Difficulty }[], seed: number, fast = false): MatchState {
  const slots = players.map((p) => p.slot);
  return {
    v: 0,
    round: 0,
    phase: 'intro',
    remaining: fast ? 1 : 3,
    players: players.map((p) => {
      const target = nearestRival(p.slot, slots);
      return { ...p, alive: true, ammo: [], selected: 0, locked: false, aim: defaultAim(p.slot, target), target, blocks: BLOCKS_PER_CASTLE, stats: newStats() };
    }),
    lavaLevel: 0,
    lavaY: LAVA_LEVELS[0],
    wind: [0, 0, 0],
    winner: null,
    results: null,
    seed,
    fast,
    elimCount: 0,
    replay: null,
  };
}

export function alivePlayers(s: MatchState) {
  return s.players.filter((p) => p.alive);
}

export function isDuel(s: MatchState) {
  return alivePlayers(s).length === 2;
}

// 20 s para apuntar en todas las rondas (el usuario lo prefiere al acortarlas en el duelo).
// Si todos confirman antes, la ronda arranca en cuanto están listos.
export function aimDuration(s: MatchState) {
  return s.fast ? 3 : 20;
}

// Repetición a cámara lenta de cada rey caído en la ronda (como mucho dos seguidas).
export const REPLAY_MAX = 2;
export function replayDuration(s: MatchState) {
  return s.fast ? 1.5 : 5;
}

export function resultsDuration(s: MatchState) {
  return s.fast ? 1 : 3.5;
}

// Máximo de la fase de impacto: el tope de ~6 s de asentamiento más el vuelo.
export function impactMaxDuration(s: MatchState) {
  return s.fast ? 7 : 9;
}

// En modo rápido (pruebas) la lava sube cada ronda para que las partidas sean cortas.
export function lavaLevelForRound(round: number, fast = false) {
  return Math.min(LAVA_LEVELS.length - 1, Math.floor((round - 1) / (fast ? 1 : LAVA_RISE_EVERY)));
}

export function windForRound(seed: number, round: number, fast = false): Vec3 {
  if (round < (fast ? 3 : WIND_FROM_ROUND)) return [0, 0, 0];
  const r = rng(seed ^ Math.imul(round, 2654435761));
  const ang = r.range(0, Math.PI * 2);
  const sp = r.range(2, 3.5 + Math.min(4, (round - WIND_FROM_ROUND) * 0.5));
  return [Math.sin(ang) * sp, 0, Math.cos(ang) * sp];
}

export function ammoRng(seed: number, round: number, slot: number) {
  return rng((seed ^ hashString(`ammo:${round}:${slot}`)) >>> 0);
}

// Empieza una ronda: lava, viento y 3 municiones distintas nuevas (las de la ronda anterior se pierden).
export function startRound(s: MatchState): MatchState {
  s.round++;
  s.phase = 'aim';
  s.remaining = aimDuration(s);
  s.lavaLevel = lavaLevelForRound(s.round, s.fast);
  s.lavaY = LAVA_LEVELS[s.lavaLevel];
  s.wind = windForRound(s.seed, s.round, s.fast);
  s.results = null;
  const duel = isDuel(s);
  for (const p of s.players) {
    p.locked = false;
    if (!p.alive) continue;
    const r = ammoRng(s.seed, s.round, p.slot);
    p.ammo = [];
    for (let tries = 0; p.ammo.length < HAND && tries < 50; tries++) {
      const a = drawAmmo(r, duel);
      if (!p.ammo.includes(a)) p.ammo.push(a);
    }
    p.selected = 0;
    if (!s.players.some((q) => q.alive && q.slot === p.target && q.slot !== p.slot)) p.target = nearestRival(p.slot, alivePlayers(s).map((q) => q.slot));
  }
  s.v++;
  return s;
}

// Consume la munición disparada.
export function consumeAmmo(p: PlayerState) {
  if (!p.ammo.length) return null;
  const i = Math.min(p.selected, p.ammo.length - 1);
  const [used] = p.ammo.splice(i, 1);
  p.selected = 0;
  return used;
}

export function nearestRival(slot: number, slots: number[]) {
  const o = castleOrigin(slot);
  let best = -1;
  let bd = Infinity;
  for (const s of slots) {
    if (s === slot) continue;
    const q = castleOrigin(s);
    const d = Math.hypot(o[0] - q[0], o[2] - q[2]);
    if (d < bd) (bd = d), (best = s);
  }
  return best;
}

// Marca eliminados (en orden) y comprueba si hay ganador.
export function eliminate(s: MatchState, slot: number, cause: string, by: number) {
  const p = s.players.find((x) => x.slot === slot);
  if (!p || !p.alive) return;
  p.alive = false;
  p.eliminatedRound = s.round;
  p.eliminatedOrder = ++s.elimCount;
  p.cause = cause;
  const killer = s.players.find((x) => x.slot === by);
  if (killer && by !== slot) killer.stats.kills++;
  s.v++;
}

// Gana el último rey en pie. Si caen todos en la misma ronda, desempata quien tenga más
// bloques en pie y, si aún hay empate, el que cayó el último.
export function checkWinner(s: MatchState): number | null {
  const alive = alivePlayers(s);
  if (alive.length === 1) return alive[0].slot;
  if (alive.length === 0) {
    const lastRound = Math.max(...s.players.map((p) => p.eliminatedRound ?? 0));
    const last = s.players.filter((p) => p.eliminatedRound === lastRound).sort((a, b) => b.blocks - a.blocks || (b.eliminatedOrder ?? 0) - (a.eliminatedOrder ?? 0));
    return last[0]?.slot ?? -1;
  }
  if (s.round >= MAX_ROUNDS) return [...alive].sort((a, b) => b.blocks - a.blocks)[0].slot;
  return null;
}

const PHRASES_HIT = [
  '{n} se ha quedado sin muebles',
  'El castillo de {n} ahora es un solar',
  '{n}: «¡Eso lo pagaba el seguro!»',
  'A {n} le han hecho una reforma sin pedirla',
  '{n} ya tiene castillo con terraza',
  'Los albañiles de {n} echan horas extra',
];
const PHRASES_CALM = ['Ronda tranquila… demasiado tranquila', 'Mucho ruido y pocas piedras', 'Los castillos respiran aliviados', 'Hoy nadie gana el premio a la puntería'];
const PHRASES_ELIM = ['¡{n} pierde la corona!', '¡Adiós, majestad {n}!', '{n} abdica a lo bestia', 'Dios salve al rey… {n} no'];

export function roundPhrase(s: MatchState, res: Omit<RoundResult, 'phrase'>) {
  const r = rng((s.seed ^ hashString(`fr${s.round}`)) >>> 0);
  const nameOf = (slot: number) => s.players.find((p) => p.slot === slot)?.name ?? '¿?';
  if (res.eliminated.length) return r.pick(PHRASES_ELIM).replace('{n}', nameOf(res.eliminated[0]));
  if (res.mostDamaged !== null && (res.lost[res.mostDamaged] ?? 0) >= 4) return r.pick(PHRASES_HIT).replace('{n}', nameOf(res.mostDamaged));
  return r.pick(PHRASES_CALM);
}

export function buildResults(s: MatchState, lost: Record<number, number>, dealt: Record<number, number>, eliminated: number[]): RoundResult {
  let most: number | null = null;
  for (const p of s.players) if ((lost[p.slot] ?? 0) > 0 && (most === null || lost[p.slot] > (lost[most] ?? 0))) most = p.slot;
  const base = { lost, dealt, eliminated, mostDamaged: most };
  return { ...base, phrase: roundPhrase(s, base) };
}
