import { expect, test } from '@playwright/test';
import { BLOCKS_PER_CASTLE } from '../../shared/castle';
import { canvasNotBlack, watchErrors } from './helpers';

// Sección 5.1: la página carga sin errores y la isla con los castillos se ve bien.
test('humo: portada y campo de pruebas sin errores', async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.locator('.home-wrap .title')).toBeVisible();
  await expect(page.locator('#home')).toBeVisible();
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
  expect(state.blocks).toBe(2 * BLOCKS_PER_CASTLE);
  expect(state.kings).toBe(2);
  await page.screenshot({ path: info.outputPath('isla.png') });

  // Los 4 castillos enteros en una partida recién empezada, vistos desde arriba.
  await page.goto('/?bots=3&seed=5#solo');
  await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state.phase === 'intro', null, { timeout: 30_000 });
  await page.waitForTimeout(1200);
  await canvasNotBlack(page);
  const four = await page.evaluate(() => {
    const g = (window as any).__asedio.game;
    return { blocks: g.view.blockCount(), kings: g.view.kings.size };
  });
  expect(four).toEqual({ blocks: 4 * BLOCKS_PER_CASTLE, kings: 4 });
  await page.screenshot({ path: info.outputPath('cuatro-castillos.png') });
  expect(errors).toEqual([]);
});

// La portada dibuja su fondo animado sin descargar Rapier, que solo hace falta para jugar
// (WRK-TASK-016): son 1,1 MB comprimidos menos al abrir el enlace, importante con datos móviles.
test('la portada no descarga Rapier para el fondo', async ({ page }) => {
  test.setTimeout(60_000);
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/?backdrop=1');
  await page.waitForSelector('#backdrop-canvas', { timeout: 30_000 });
  await page.waitForTimeout(3000);
  expect(requests.filter((u) => /rapier/i.test(u)), 'peticiones de Rapier en la portada').toEqual([]);
  expect(requests.some((u) => /\/assets\/view-/.test(u)), 'la vista del fondo se ha cargado').toBe(true);
});
