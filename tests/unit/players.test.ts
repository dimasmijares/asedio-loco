import { describe, expect, it } from 'vitest';
import { BOT_NAMES, NAME_TITLES, randomName, shortName } from '../../shared/players';
import { MAX_NAME_LEN, sanitizeName } from '../../shared/protocol';

describe('nombre corto del marcador compacto (WRK-TASK-046)', () => {
  it('«Tú» en la fila propia, la última palabra en los bots y la primera en los humanos', () => {
    expect(shortName({ name: 'Dimas Mijares', you: true })).toBe('Tú');
    expect(shortName({ name: 'Lady Pixel', bot: true })).toBe('Pixel');
    expect(shortName({ name: 'Dimas Mijares' })).toBe('Dimas');
    expect(shortName({ name: '   ' })).toBe('?');
  });

  it('en un nombre con título, la última palabra («Duque Pepino» → «Pepino»)', () => {
    expect(shortName({ name: 'Duque Pepino' })).toBe('Pepino');
    expect(shortName({ name: 'Duque' })).toBe('Duque');
  });

  it('los bots se distinguen y caben en 7 letras', () => {
    const shorts = BOT_NAMES.map((name) => shortName({ name, bot: true }));
    expect(new Set(shorts).size).toBe(BOT_NAMES.length);
    for (const s of shorts) expect(s.length).toBeLessThanOrEqual(7);
  });
});

describe('nombre al azar de la portada (R-10 U9)', () => {
  it('título y palabra, válido para el servidor, sin repetir el anterior ni los de los bots', () => {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    let prev = '';
    for (let i = 0; i < 300; i++) {
      const n = randomName(rand, prev);
      expect(n).not.toBe(prev);
      expect(BOT_NAMES).not.toContain(n);
      expect(n.length).toBeLessThanOrEqual(MAX_NAME_LEN);
      expect(sanitizeName(n)).toBe(n);
      expect(NAME_TITLES).toContain(n.split(' ')[0]);
      expect(shortName({ name: n }).length).toBeLessThanOrEqual(7);
      prev = n;
    }
  });
});
