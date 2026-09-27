import { expect, test } from '@playwright/test';

// Topes de fragmentos y partículas al cambiar la calidad en plena partida (WRK-TASK-013): al
// bajar a baja se retiran los que sobran y al volver a alta el tope sube sin recargar.
test('los topes de fragmentos y partículas siguen a la calidad en caliente', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?quality=high#sandbox');
  await page.waitForFunction(() => (window as any).__asedio?.mode?.fire, null, { timeout: 60_000 });
  await page.waitForTimeout(1000);
  // Se llenan fragmentos y partículas directamente (sin depender de la física ni de los tiempos
  // de CI): 60 bloques de piedra troceados y 20 explosiones.
  const before = await page.evaluate(() => {
    const v = (window as any).__asedio.game.view;
    for (let i = 0; i < 60; i++) v.debris.burst('stone', [1.2, 1.2, 1.2], [i % 10, 4 + Math.floor(i / 10), 0], [0, 0, 0, 1], [0, 0, 0], 1000 + i);
    for (let i = 0; i < 20; i++) v.fx.boom([i, 3, 0], 3, 'boom');
    const fx = v.fx.count;
    // Humo de derrumbe (WRK-TASK-049): 3 bloques rotos seguidos en cada una de 10 celdas. Se hace
    // crecer con el paso de la propia reserva de humo, sin gastar las demás partículas.
    for (let i = 0; i < 10; i++) for (let k = 0; k < 3; k++) v.fx.rubble([i * 12, 2, 0]);
    for (let i = 0; i < 6; i++) v.fx.stepSmoke(0.5);
    return { debris: v.debris.count, fx, foci: v.fx.foci.length, smoke: v.fx.smoke.items.length };
  });
  expect(before.debris, 'hay fragmentos antes de bajar la calidad').toBeGreaterThan(90);
  expect(before.fx, 'hay partículas antes de bajar la calidad').toBeGreaterThan(260);
  expect(before.foci, 'focos de humo en alta').toBe(9);
  expect(before.smoke, 'humo antes de bajar la calidad').toBeGreaterThan(50);
  const low = await page.evaluate(() => {
    const g = (window as any).__asedio.game;
    g.applyQuality('low');
    return { debris: g.view.debris.count, max: g.view.debris.maxPieces, puffs: g.view.fx.puffs.items.length, puffCap: g.view.fx.puffs.cap, bits: g.view.fx.bits.items.length, bitCap: g.view.fx.bits.cap, smoke: g.view.fx.smoke.items.length, smokeCap: g.view.fx.smoke.cap, foci: g.view.fx.foci.length };
  });
  expect(low.smokeCap).toBe(50);
  expect(low.smoke).toBeLessThanOrEqual(50);
  expect(low.foci).toBeLessThanOrEqual(3);
  expect(low.max).toBe(90);
  expect(low.debris).toBeLessThanOrEqual(90);
  expect(low.puffCap).toBe(260);
  expect(low.puffs).toBeLessThanOrEqual(260);
  expect(low.bits).toBeLessThanOrEqual(low.bitCap);
  const high = await page.evaluate(() => {
    const g = (window as any).__asedio.game;
    g.applyQuality('high');
    return { max: g.view.debris.maxPieces, puffCap: g.view.fx.puffs.cap, smokeCap: g.view.fx.smoke.cap };
  });
  expect(high).toEqual({ max: 260, puffCap: 900, smokeCap: 180 });
});
