import { describe, expect, it } from 'vitest';
import { BOT_SKILL, aimedAt, decideBots } from '../../shared/bot';
import { createMatch, defaultAim, startRound } from '../../shared/match';
import type { Difficulty } from '../../shared/protocol';

// Un humano en el hueco 0 y tres bots, como en la partida en solitario.
const solo = (seed: number, difficulty: Difficulty = 'normal') => {
  const s = createMatch(
    [0, 1, 2, 3].map((slot) => ({ slot, id: `p${slot}`, name: `J${slot}`, bot: slot > 0, difficulty: slot > 0 ? difficulty : undefined })),
    seed,
  );
  startRound(s);
  return s;
};

const SEEDS = Array.from({ length: 200 }, (_, i) => 1000 + i * 7919);

describe('bots: objetivos', () => {
  for (const dif of ['facil', 'normal', 'dificil'] as Difficulty[]) {
    it(`${dif}: los tres bots rara vez van a por el mismo y el humano no es el blanco fijo`, () => {
      let allSame = 0;
      let onHuman = 0;
      let picks = 0;
      for (const seed of SEEDS) {
        const targets = [...decideBots(solo(seed, dif), {}, new Map()).values()].map((d) => d.target);
        if (new Set(targets).size === 1) allSame++;
        onHuman += targets.filter((t) => t === 0).length;
        picks += targets.length;
      }
      expect(allSame / SEEDS.length).toBeLessThan(0.25);
      // Cada bot tiene 3 rivales: al humano le toca en torno a un tercio de los ataques.
      expect(onHuman / picks).toBeLessThan(0.45);
    });
  }

  it('con el humano muy tocado, los bots van más a por él, pero no siempre todos', () => {
    let allOnHuman = 0;
    for (const seed of SEEDS) {
      const s = solo(seed, 'dificil');
      s.players[0].blocks = 60;
      const targets = [...decideBots(s, {}, new Map()).values()].map((d) => d.target);
      if (targets.every((t) => t === 0)) allOnHuman++;
    }
    expect(allOnHuman / SEEDS.length).toBeLessThan(0.3);
  });

  it('un bot devuelve el golpe a quien le atacó en la ronda anterior', () => {
    let without = 0;
    let withRevenge = 0;
    for (const seed of SEEDS) {
      if (decideBots(solo(seed), {}, new Map()).get(1)!.target === 3) without++;
      if (decideBots(solo(seed), {}, new Map([[3, 1]])).get(1)!.target === 3) withRevenge++;
    }
    expect(withRevenge).toBeGreaterThan(without * 1.5);
  });

  it('el blanco de un disparo sale del rumbo, no del objetivo elegido', () => {
    const s = solo(1);
    const me = s.players[0];
    for (const other of [1, 2, 3]) {
      me.target = other === 1 ? 2 : 1;
      me.aim = defaultAim(0, other);
      expect(aimedAt(s, me)).toBe(other);
    }
  });
});

describe('bots: rapidez', () => {
  it('fijan su ataque entre 1 y 3 s en todas las dificultades', () => {
    for (const dif of Object.keys(BOT_SKILL) as Difficulty[]) {
      for (const seed of SEEDS.slice(0, 40)) {
        for (const d of decideBots(solo(seed, dif), {}, new Map()).values()) {
          expect(d.lockDelay).toBeGreaterThanOrEqual(1);
          expect(d.lockDelay).toBeLessThanOrEqual(3);
        }
      }
    }
  });
});
