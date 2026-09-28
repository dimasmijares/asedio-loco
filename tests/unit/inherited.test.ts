import { describe, expect, it } from 'vitest';
import { inheritedCounts } from '../../client/src/game/match/host';
import { createMatch } from '../../shared/match';

// WRK-TASK-012: si el anfitrión se va en pleno impacto, el heredero saca las cuentas de la ronda de
// los bloques en pie al empezar el impacto (en el estado) y de los que siguen en pie.
describe('cuentas de un impacto heredado', () => {
  it('perdidos por diferencia y rotos repartidos entre quienes apuntaban', () => {
    const s = createMatch([0, 1, 2, 3].map((slot) => ({ slot, id: `p${slot}`, name: `J${slot}`, bot: false })), 3);
    s.impact = { blocks: { 0: 176, 1: 176, 2: 170, 3: 160 }, targets: { 0: 1, 1: 3, 2: 1, 3: 0 } };
    const now: Record<number, number> = { 0: 170, 1: 149, 2: 170, 3: 160 };
    const { lost, dealt } = inheritedCounts(s, (slot) => now[slot]);
    expect(lost).toEqual({ 0: 6, 1: 27, 2: 0, 3: 0 });
    // Al castillo 1 le apuntaban 0 y 2: 27 bloques, 14 y 13. Al 0 le apuntaba el 3: 6.
    expect(dealt).toEqual({ 0: 14, 1: 0, 2: 13, 3: 6 });
    expect(Object.values(dealt).reduce((a, b) => a + b, 0)).toBe(lost[0] + lost[1]);
  });
});
