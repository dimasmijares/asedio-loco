import { expect, test } from '@playwright/test';
import { canvasNotBlack, watchErrors } from './helpers';

// Sección 5.1: la página carga sin errores y la isla con los castillos se ve bien.
test('humo: portada y campo de pruebas sin errores', async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.locator('#home .title')).toBeVisible();
  await page.screenshot({ path: info.outputPath('portada.png') });

  await page.goto('/#sandbox');
  await page.waitForFunction(() => (window as any).__asedio?.game?.sim, null, { timeout: 30_000 });
  await page.waitForTimeout(2500);
  const stats = await canvasNotBlack(page);
  console.log('canvas', JSON.stringify(stats));
  const state = await page.evaluate(() => {
    const g = (window as any).__asedio.game;
    return { blocks: g.view.blockCount(), kings: g.view.kings.size };
  });
  expect(state.blocks).toBe(212);
  expect(state.kings).toBe(2);
  await page.screenshot({ path: info.outputPath('isla.png') });
  expect(errors).toEqual([]);
});
