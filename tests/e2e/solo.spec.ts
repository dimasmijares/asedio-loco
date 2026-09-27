import { expect, test } from '@playwright/test';
import { canvasNotBlack, watchErrors } from './helpers';

// Fase 2: una partida local contra 3 bots llega hasta el final con un ganador.
test('partida local contra bots hasta que hay ganador', async ({ page }, info) => {
  test.setTimeout(900_000);
  const errors = watchErrors(page);
  await page.goto('/?bots=3&fast=1&autoplay=1&seed=11&render=4#solo');
  await page.waitForFunction(() => (window as any).__asedio?.mode?.host, null, { timeout: 30_000 });
  await page.waitForFunction(() => (window as any).__asedio.mode.host.state.phase === 'aim', null, { timeout: 30_000 });
  await canvasNotBlack(page);
  // Escudo real en la ronda 1 (WRK-TASK-041): los 4 reyes lo llevan a la vista.
  expect(await page.evaluate(() => (window as any).__asedio.game.view.guardedKings)).toBe(4);
  await page.screenshot({ path: info.outputPath('apuntado.png') });
  // La fase de impacto (o cualquier momento posterior si ha ido muy deprisa).
  await page.waitForFunction(
    () => {
      const s = (window as any).__asedio.mode.host.state;
      return s.phase === 'impact' || s.phase === 'replay' || s.phase === 'results' || s.phase === 'over' || s.round >= 2;
    },
    null,
    { timeout: 120_000 },
  );
  // En la cuenta atrás se han mostrado los arcos de quién ataca a quién (WRK-TASK-045).
  const arcs = await page.evaluate(() => (window as any).__asedio.mode.ui.arcsShown);
  expect(arcs.round).toBeGreaterThanOrEqual(1);
  expect(arcs.pairs.split(',').length, `arcos: ${arcs.pairs}`).toBeGreaterThanOrEqual(2);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: info.outputPath('impacto.png') });
  // Antes de la pantalla final, el mejor disparo (WRK-TASK-047): se ve con su rótulo y se salta.
  await expect(page.locator('#skip-replay')).toBeVisible({ timeout: 800_000 });
  await expect(page.locator('#hud-banner')).toContainText('MEJOR DISPARO');
  const clip = await page.evaluate(() => {
    const b = (window as any).__asedio.mode.ui.best;
    return { dealt: b.dealt, kb: Math.round(b.clip.bytes / 1024) };
  });
  console.log('mejor disparo', JSON.stringify(clip));
  expect(clip.dealt).toBeGreaterThan(0);
  expect(clip.kb, 'tramo acotado').toBeLessThanOrEqual(2200);
  await page.waitForTimeout(800);
  await page.keyboard.press('x');
  await expect(page.locator('#game-over')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('#skip-replay')).toHaveCount(0);
  const st = await page.evaluate(() => {
    const s = (window as any).__asedio.mode.host.state;
    return { winner: s.winner, rounds: s.round, alive: s.players.filter((p: any) => p.alive).length };
  });
  console.log('fin', JSON.stringify(st));
  expect(st.winner).not.toBeNull();
  expect(st.rounds, 'con el escudo real nadie cae antes de la ronda 3').toBeGreaterThanOrEqual(3);
  expect(st.alive).toBeLessThanOrEqual(1);
  await expect(page.locator('#game-over')).toHaveAttribute('data-rounds', String(st.rounds));
  await page.screenshot({ path: info.outputPath('final.png') });
  expect(errors).toEqual([]);
});
