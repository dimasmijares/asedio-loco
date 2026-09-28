import { expect, test } from '@playwright/test';

// Espectador activo (WRK-TASK-042): un jugador eliminado elige qué castillo sigue la cámara durante
// el apuntado, con Q/E o las flechas en PC y con ◀ ▶ en el móvil.
for (const [name, vp, mobile] of [
  ['PC', { width: 1280, height: 720 }, false],
  ['móvil vertical', { width: 390, height: 844 }, true],
] as const) {
  test.describe(name, () => {
    test.use({ viewport: vp, hasTouch: mobile, isMobile: mobile });
    test(`el eliminado cambia de castillo en ${name}`, async ({ page }, info) => {
      test.setTimeout(120_000);
      await page.goto(`/?bots=3&seed=5&fast=1${mobile ? '&mobile=1' : ''}#solo`);
      await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
      // Cae tu rey (sin el escudo real de la ronda 1).
      await page.evaluate(() => {
        const m = (window as any).__asedio.mode;
        m.host.sim.kingGuard = false;
        m.host.sim.killKing(m.ui.src.you, 'fell');
      });
      await page.waitForFunction(() => {
        const s = (window as any).__asedio.mode.host.state;
        const ok = s.round >= 2 && s.phase === 'aim';
        // Los bots fijan su disparo enseguida: se congela la partida en el apuntado para la prueba.
        if (ok) (window as any).__asedio.mode.host.update = () => {};
        return ok;
      }, null, { timeout: 60_000, polling: 'raf' });
      await expect(page.locator('#hud-watch')).toContainText('Plano general');
      if (mobile) await page.locator('#target-next').tap();
      else await page.keyboard.press('e');
      const slot = await page.evaluate(() => (window as any).__asedio.mode.ui.watchSlot);
      expect(slot).toBeGreaterThanOrEqual(0);
      await expect(page.locator('#hud-watch')).toContainText('Castillo de');
      await page.waitForTimeout(1200);
      // La cámara gira alrededor de ese castillo.
      const d = await page.evaluate((slot) => {
        const g = (window as any).__asedio.game;
        const o = g.view.kings.get(slot).position;
        return Math.hypot(g.rig.center.x - o.x, g.rig.center.z - o.z);
      }, slot);
      expect(d).toBeLessThan(3);
      await page.screenshot({ path: info.outputPath(`espectador-${mobile ? 'movil' : 'pc'}.png`) });
      // Y vuelve atrás hasta el plano general.
      if (mobile) await page.locator('#target-prev').tap();
      else await page.keyboard.press('q');
      expect(await page.evaluate(() => (window as any).__asedio.mode.ui.watchSlot)).toBe(-1);
    });
  });
}
