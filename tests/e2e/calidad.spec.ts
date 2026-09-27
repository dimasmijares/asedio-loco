import { expect, test } from '@playwright/test';

// Topes de fragmentos y partículas al cambiar la calidad en plena partida (WRK-TASK-013): al
// bajar a baja se retiran los que sobran y al volver a alta el tope sube sin recargar.
test('los topes de fragmentos y partículas siguen a la calidad en caliente', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/?quality=high#sandbox');
  await page.waitForFunction(() => (window as any).__asedio?.mode?.fire, null, { timeout: 60_000 });
  await page.waitForTimeout(1000);
  // Unas cuantas vacas contra el castillo diana para llenar fragmentos y partículas.
  for (let i = 0; i < 4; i++) {
    await page.evaluate((i) => {
      const m = (window as any).__asedio.mode;
      m.selectAmmo(3);
      m.fire(m.aimAt(i % 2 ? 'wall' : 'tower', 0.7));
    }, i);
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(1200);
  const before = await page.evaluate(() => {
    const v = (window as any).__asedio.game.view;
    return { debris: v.debris.count, fx: v.fx.count };
  });
  expect(before.debris, 'hay fragmentos antes de bajar la calidad').toBeGreaterThan(90);
  const low = await page.evaluate(() => {
    const g = (window as any).__asedio.game;
    g.applyQuality('low');
    return { debris: g.view.debris.count, max: g.view.debris.maxPieces, puffs: g.view.fx.puffs.items.length, puffCap: g.view.fx.puffs.cap, bits: g.view.fx.bits.items.length, bitCap: g.view.fx.bits.cap };
  });
  expect(low.max).toBe(90);
  expect(low.debris).toBeLessThanOrEqual(90);
  expect(low.puffCap).toBe(260);
  expect(low.puffs).toBeLessThanOrEqual(260);
  expect(low.bits).toBeLessThanOrEqual(low.bitCap);
  const high = await page.evaluate(() => {
    const g = (window as any).__asedio.game;
    g.applyQuality('high');
    return { max: g.view.debris.maxPieces, puffCap: g.view.fx.puffs.cap };
  });
  expect(high).toEqual({ max: 260, puffCap: 900 });
});
