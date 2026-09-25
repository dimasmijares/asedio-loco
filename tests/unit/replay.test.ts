import { describe, expect, it } from 'vitest';
import { ReplayPlayer, ReplayRecorder } from '../../client/src/game/replay';
import type { SimEvent } from '../../client/src/game/sim/sim';

describe('repetición', () => {
  it('graba poses a 30 Hz como mucho y encuentra la caída del rey', () => {
    const r = new ReplayRecorder();
    for (let i = 0; i < 120; i++) r.pose(i / 60, 5, [i, 0, 0], [0, 0, 0, 1]);
    r.event(1.5, { e: 'king', slot: 2, cause: 'crushed', by: 0 });
    const poses = r.posesBetween(0, 2);
    expect(poses.length).toBeGreaterThan(55);
    expect(poses.length).toBeLessThanOrEqual(61);
    expect(r.deathTime(2)).toBe(1.5);
    expect(r.deathTime(1)).toBeNull();
  });

  it('reproduce poses y eventos en orden y a la velocidad pedida', () => {
    const r = new ReplayRecorder();
    for (let i = 0; i <= 60; i++) r.pose(i / 30, 7, [i, 0, 0], [0, 0, 0, 1]);
    r.event(1, { e: 'boom', p: [0, 0, 0], r: 3, kind: 'cow' });
    const player = new ReplayPlayer(r, 0.5, 1.5, 0.5);
    const seen: number[] = [];
    const evs: SimEvent[] = [];
    const target = { time: 0, applyPose: (_id: number, p: number[]) => seen.push(p[0]), applyEvent: (e: SimEvent) => evs.push(e) };
    player.step(1, target); // 1 s real = 0,5 s de repetición: llega a t = 1
    expect(evs).toHaveLength(1);
    // Los tiempos se guardan en Float32: la muestra justo en t = 1 puede quedar un pelo después.
    expect(Math.max(...seen)).toBeGreaterThanOrEqual(29);
    expect(Math.max(...seen)).toBeLessThanOrEqual(30);
    player.step(1, target);
    expect(player.done).toBe(true);
    expect(Math.max(...seen)).toBeGreaterThanOrEqual(44);
    expect(Math.max(...seen)).toBeLessThanOrEqual(45);
  });
});
