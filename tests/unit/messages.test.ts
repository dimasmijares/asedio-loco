import { describe, expect, it } from 'vitest';
import { isStale } from '../../client/src/game/net/messages';

describe('estado del anfitrión con versión (D-064)', () => {
  it('uno más viejo de la misma partida se descarta; el mismo o uno nuevo, no', () => {
    const now = { seed: 7, v: 10 };
    expect(isStale(now, { seed: 7, v: 9 })).toBe(true);
    expect(isStale(now, { seed: 7, v: 10 })).toBe(false);
    expect(isStale(now, { seed: 7, v: 11 })).toBe(false);
  });

  it('uno de otra partida (revancha, otra semilla) siempre vale', () => {
    expect(isStale({ seed: 7, v: 50 }, { seed: 8, v: 0 })).toBe(false);
  });
});
