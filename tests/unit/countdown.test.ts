import { describe, expect, it } from 'vitest';
import { MatchHost, type HostEnv } from '../../client/src/game/match/host';
import { loadRapier } from '../../client/src/game/sim/rapier';
import { DT, Sim } from '../../client/src/game/sim/sim';
import { aimDuration, countdownDuration, createMatch, type Phase } from '../../shared/match';

// Anfitrión real en Node (como tests/balance) y el registro de cada cambio de fase.
async function run(humanSlot: number | null, until: (phases: { phase: Phase; t: number }[]) => boolean) {
  await loadRapier();
  const env: HostEnv = {
    sim: null,
    timeScale: 1,
    startSim(s) {
      this.sim?.free();
      this.sim = new Sim(s);
      this.sim.settle();
      return this.sim;
    },
    setLavaVisual() {},
  };
  const players = [0, 1, 2, 3].map((slot) => ({ slot, id: `p${slot}`, name: `J${slot}`, bot: slot !== humanSlot, difficulty: 'normal' as const }));
  const host = new MatchHost(env, createMatch(players, 42));
  const phases: { phase: Phase; t: number; aimLeft: number; locked: boolean[] }[] = [];
  let t = 0;
  while (t < 60 && !until(phases)) {
    host.update(DT);
    env.sim!.step();
    host.onSimEvents(env.sim!.drainEvents());
    t += DT;
    const s = host.state;
    if (phases.at(-1)?.phase !== s.phase) phases.push({ phase: s.phase, t, aimLeft: host.aimLeft, locked: s.players.map((p) => p.locked) });
  }
  env.sim!.free();
  return phases;
}

const reached = (p: Phase) => (phases: { phase: Phase }[]) => phases.some((x) => x.phase === p);

describe('cuenta atrás antes de disparar', () => {
  it('con todos listos: apuntado → cuenta atrás de 3 s → impacto, sin agotar el apuntado', async () => {
    const phases = await run(null, reached('impact'));
    const aim = phases.find((x) => x.phase === 'aim')!;
    const cd = phases.find((x) => x.phase === 'countdown')!;
    const impact = phases.find((x) => x.phase === 'impact')!;
    expect(phases.map((x) => x.phase)).toEqual(['intro', 'aim', 'countdown', 'impact']);
    expect(cd.aimLeft).toBeGreaterThan(0);
    // Los bots fijan su ataque en 1-3 s (normal: 1,5-2,5 s).
    expect(cd.t - aim.t).toBeLessThan(3.2);
    expect(impact.t - cd.t).toBeCloseTo(countdownDuration({ fast: false } as never), 1);
  });

  it('si alguien no dispara, al agotarse el apuntado hay cuenta atrás igualmente y queda fijado', async () => {
    const phases = await run(0, reached('impact'));
    const aim = phases.find((x) => x.phase === 'aim')!;
    const cd = phases.find((x) => x.phase === 'countdown')!;
    expect(cd.aimLeft).toBe(0);
    // Ronda 1 en solitario no lleva el tiempo extra del tutorial en este arnés.
    expect(cd.t - aim.t).toBeGreaterThanOrEqual(aimDuration({ fast: false } as never) - 0.1);
    expect(cd.locked.every(Boolean)).toBe(true);
    expect(phases.map((x) => x.phase)).toContain('impact');
  });
});
