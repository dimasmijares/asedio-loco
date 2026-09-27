import { describe, expect, it } from 'vitest';
import { BOT_NAMES, shortName } from '../../shared/players';

describe('nombre corto del marcador compacto (WRK-TASK-046)', () => {
  it('«Tú» en la fila propia, la última palabra en los bots y la primera en los humanos', () => {
    expect(shortName({ name: 'Dimas Mijares', you: true })).toBe('Tú');
    expect(shortName({ name: 'Lady Pixel', bot: true })).toBe('Pixel');
    expect(shortName({ name: 'Dimas Mijares' })).toBe('Dimas');
    expect(shortName({ name: '   ' })).toBe('?');
  });

  it('los bots se distinguen y caben en 7 letras', () => {
    const shorts = BOT_NAMES.map((name) => shortName({ name, bot: true }));
    expect(new Set(shorts).size).toBe(BOT_NAMES.length);
    for (const s of shorts) expect(s.length).toBeLessThanOrEqual(7);
  });
});
