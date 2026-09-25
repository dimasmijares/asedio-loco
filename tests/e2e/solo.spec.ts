import { expect, test } from '@playwright/test';
import { canvasNotBlack, watchErrors } from './helpers';

// Fase 2: una partida local contra 3 bots llega hasta el final con un ganador.
test('partida local contra bots hasta que hay ganador', async ({ page }, info) => {
  test.setTimeout(900_000);
  const errors = watchErrors(page);
  await page.goto('/?bots=3&fast=1&autoplay=1&seed=11#solo');
  await page.waitForFunction(() => (window as any).__asedio?.mode?.host, null, { timeout: 30_000 });
  await page.waitForFunction(() => (window as any).__asedio.mode.host.state.phase === 'aim', null, { timeout: 30_000 });
  await canvasNotBlack(page);
  await page.screenshot({ path: info.outputPath('apuntado.png') });
  // La fase de impacto (o cualquier momento posterior si ha ido muy deprisa).
  await page.waitForFunction(
    () => {
      const s = (window as any).__asedio.mode.host.state;
      return s.phase === 'impact' || s.phase === 'results' || s.phase === 'over' || s.round >= 2;
    },
    null,
    { timeout: 120_000 },
  );
  await page.waitForTimeout(1500);
  await page.screenshot({ path: info.outputPath('impacto.png') });
  await expect(page.locator('#game-over')).toBeVisible({ timeout: 800_000 });
  const st = await page.evaluate(() => {
    const s = (window as any).__asedio.mode.host.state;
    return { winner: s.winner, rounds: s.round, alive: s.players.filter((p: any) => p.alive).length };
  });
  console.log('fin', JSON.stringify(st));
  expect(st.winner).not.toBeNull();
  expect(st.alive).toBeLessThanOrEqual(1);
  await expect(page.locator('#game-over')).toHaveAttribute('data-rounds', String(st.rounds));
  await page.screenshot({ path: info.outputPath('final.png') });
  expect(errors).toEqual([]);
});
