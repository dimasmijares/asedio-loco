import { describe, expect, it } from 'vitest';
import { AMMO } from '../../shared/ammo';
import { goalPoint } from '../../shared/bot';
import { buildCastle } from '../../shared/castle';
import { GOALS, GOAL_KINDS, createMatch, goalCounts, goalFor, startRound } from '../../shared/match';
import { rng } from '../../shared/math';

// Objetivos secundarios (WRK-TASK-043).
describe('objetivos secundarios', () => {
  const players = [0, 1, 2, 3].map((slot) => ({ slot, id: `p${slot}`, name: `J${slot}`, bot: true }));

  it('uno por ronda, el mismo para la misma semilla, y de los tres tipos', () => {
    const seen = new Set<string>();
    for (let round = 1; round <= 30; round++) {
      expect(goalFor(7, round)).toBe(goalFor(7, round));
      seen.add(goalFor(7, round));
    }
    expect([...seen].sort()).toEqual([...GOAL_KINDS].sort());
  });

  it('cada objetivo se puede cumplir en un castillo rival y tiene punto de mira', () => {
    const blocks = buildCastle(2).blocks;
    for (const k of GOAL_KINDS) {
      expect(blocks.filter((b) => goalCounts(k, b)).length, k).toBeGreaterThanOrEqual(GOALS[k].need);
      expect(goalPoint(k, 2, rng(1)), k).not.toBeNull();
    }
  });

  it('quien lo cumple abre la ronda siguiente con una carta rara o épica', () => {
    const s = createMatch(players, 11);
    startRound(s);
    expect(s.goal).toBe(goalFor(11, 1));
    expect(s.bonus).toEqual([]);
    s.goalDone = [2];
    startRound(s);
    expect(s.bonus).toEqual([2]);
    expect(s.goalDone).toEqual([]);
    const hand = s.players.find((p) => p.slot === 2)!.ammo;
    expect(['rara', 'epica']).toContain(AMMO[hand[0]].rarity);
    expect(new Set(hand).size).toBe(3);
  });
});
