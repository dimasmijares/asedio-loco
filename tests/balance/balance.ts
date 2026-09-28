// Simula partidas completas de bots sin navegador para medir el equilibrio:
// duración, número de rondas y cómo caen los reyes.
//   npx vitest run --config tests/balance/vitest.config.ts
import { MatchHost, type HostEnv } from '../../client/src/game/match/host';
import { loadRapier } from '../../client/src/game/sim/rapier';
import { DT, Sim } from '../../client/src/game/sim/sim';
import { createMatch } from '../../shared/match';
import type { Difficulty } from '../../shared/protocol';

export interface GameReport {
  seed: number;
  rounds: number;
  seconds: number;
  winner: number | null;
  eliminations: { slot: number; round: number; cause: string   goalRounds: number; // rondas en las que alguien cumple el objetivo secundario
  goalBy: Record<string, [number, number]>;
}[];
}

export async function simulateGame(seed: number, difficulty: Difficulty, slots = [0, 1, 2, 3], fast = false): Promise<GameReport> {
  await loadRapier();
  const env: HostEnv = {
    sim: null,
    startSim(s) {
      this.sim?.free();
      this.sim = new Sim(s);
      this.sim.settle();
      return this.sim;
    },
    setLavaVisual() {},
  };
  const players = slots.map((slot) => ({ slot, id: `b${slot}`, name: `Bot${slot}`, bot: true, difficulty }));
  const host = new MatchHost(env, createMatch(players, seed, fast));
  let t = 0;
  // Objetivos secundarios cumplidos (WRK-TASK-043): rondas en las que alguien lo cumple.
  let goalRounds = 0;
  const goalBy: Record<string, [number, number]> = {}; // por tipo: [rondas, jugadores que lo cumplen]
  let lastPhase = '';
  while (host.state.phase !== 'over' && t < 900) {
    host.update(DT);
    if (host.state.phase !== lastPhase && (host.state.phase === 'results' || host.state.phase === 'replay') && lastPhase === 'impact' && host.state.goalDone.length) {
      goalRounds++;
      const k = host.state.goal!;
      goalBy[k] = [(goalBy[k]?.[0] ?? 0) + 1, (goalBy[k]?.[1] ?? 0) + host.state.goalDone.length];
    }
    lastPhase = host.state.phase;
    env.sim!.step();
    host.onSimEvents(env.sim!.drainEvents());
    t += DT;
  }
  const s = host.state;
  const report = {
    seed,
    rounds: s.round,
    seconds: Math.round(t),
    winner: s.winner,
    goalRounds,
    goalBy,
    eliminations: s.players.filter((p) => !p.alive).map((p) => ({ slot: p.slot, round: p.eliminatedRound!, cause: p.cause! })).sort((a, b) => a.round - b.round),
  };
  env.sim!.free();
  return report;
}
