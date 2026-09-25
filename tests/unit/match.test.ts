import { describe, expect, it } from 'vitest';
import { AMMO, AMMO_IDS, ammoWeights, drawAmmo } from '../../shared/ammo';
import { LAVA_LEVELS } from '../../shared/map';
import { rng } from '../../shared/math';
import { aimDuration, checkWinner, consumeAmmo, createMatch, eliminate, lavaLevelForRound, startRound, windForRound } from '../../shared/match';

const four = () =>
  createMatch(
    [0, 1, 2, 3].map((slot) => ({ slot, id: `p${slot}`, name: `J${slot}`, bot: slot > 0 })),
    1234,
  );

describe('rondas', () => {
  it('cada ronda reparte 3 municiones distintas y nuevas', () => {
    const s = four();
    for (let round = 1; round <= 12; round++) {
      startRound(s);
      expect(s.round).toBe(round);
      expect(s.phase).toBe('aim');
      for (const p of s.players) {
        expect(p.ammo).toHaveLength(3);
        expect(new Set(p.ammo).size).toBe(3);
        expect(p.selected).toBe(0);
      }
      consumeAmmo(s.players[0]);
      expect(s.players[0].ammo).toHaveLength(2);
    }
  });

  it('la lava sube cada 3 rondas', () => {
    expect([1, 2, 3, 4, 6, 7, 10].map((r) => lavaLevelForRound(r))).toEqual([0, 0, 0, 1, 1, 2, 3]);
    expect([1, 2, 3].map((r) => lavaLevelForRound(r, true))).toEqual([0, 1, 2]);
    const s = four();
    for (let i = 0; i < 4; i++) startRound(s);
    expect(s.lavaY).toBe(LAVA_LEVELS[1]);
  });

  it('el viento sopla desde la ronda 6', () => {
    expect(windForRound(1, 5)).toEqual([0, 0, 0]);
    const w = windForRound(1, 6);
    expect(Math.hypot(w[0], w[2])).toBeGreaterThan(1.5);
  });

  it('20 s para apuntar, también en el duelo', () => {
    const s = four();
    startRound(s);
    expect(aimDuration(s)).toBe(20);
    eliminate(s, 1, 'lava', 0);
    eliminate(s, 2, 'lava', 0);
    expect(aimDuration(s)).toBe(20);
  });
});

describe('reparto de munición con semilla', () => {
  it('misma semilla, misma munición', () => {
    const a = four();
    const b = four();
    for (let i = 0; i < 5; i++) {
      startRound(a);
      startRound(b);
      a.players.forEach((p) => consumeAmmo(p));
      b.players.forEach((p) => consumeAmmo(p));
    }
    expect(a.players.map((p) => p.ammo)).toEqual(b.players.map((p) => p.ammo));
  });

  it('respeta las rarezas aproximadamente', () => {
    const r = rng(99);
    const counts: Record<string, number> = {};
    const N = 20000;
    for (let i = 0; i < N; i++) {
      const a = drawAmmo(r);
      counts[AMMO[a].rarity] = (counts[AMMO[a].rarity] ?? 0) + 1;
    }
    expect(counts.comun / N).toBeGreaterThan(0.4);
    expect(counts.epica / N).toBeLessThan(0.15);
    expect(Object.keys(counts)).toHaveLength(4);
  });

  it('en el duelo sale munición más rara', () => {
    const w = (duel: boolean) => {
      const ws = ammoWeights(duel);
      const total = ws.reduce((s, [, x]) => s + x, 0);
      return ws.filter(([id]) => AMMO[id].rarity === 'epica').reduce((s, [, x]) => s + x, 0) / total;
    };
    expect(w(true)).toBeGreaterThan(w(false) * 1.5);
    expect(AMMO_IDS.length).toBeGreaterThanOrEqual(10);
  });
});

describe('eliminación y victoria', () => {
  it('gana el último rey en pie', () => {
    const s = four();
    startRound(s);
    eliminate(s, 1, 'lava', 0);
    eliminate(s, 2, 'crushed', 0);
    expect(checkWinner(s)).toBeNull();
    eliminate(s, 3, 'fell', 0);
    expect(checkWinner(s)).toBe(0);
    expect(s.players[0].stats.kills).toBe(3);
  });

  it('si caen todos, gana el que cayó el último', () => {
    const s = four();
    startRound(s);
    eliminate(s, 2, 'lava', -1);
    eliminate(s, 0, 'lava', -1);
    eliminate(s, 3, 'lava', -1);
    eliminate(s, 1, 'lava', -1);
    expect(checkWinner(s)).toBe(1);
  });

  it('eliminar dos veces no cuenta doble', () => {
    const s = four();
    eliminate(s, 1, 'lava', 0);
    eliminate(s, 1, 'lava', 0);
    expect(s.players[0].stats.kills).toBe(1);
  });
});
