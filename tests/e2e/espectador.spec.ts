import { expect, test } from '@playwright/test';

// Espectador (WRK-TASK-042, R-13): al caer tu rey, la hoja «¡Tu rey ha caído!» y, durante el
// apuntado, el selector con «Todos» y una tarjeta por castillo en pie (abajo en el móvil vertical, a
// la derecha en PC). Tocar una tarjeta, Q/E o deslizar sobre la escena cambian el castillo que se mira.
// Sin flechas ◀ ▶.
for (const [name, vp, mobile] of [
  ['PC', { width: 1280, height: 720 }, false],
  ['móvil vertical', { width: 390, height: 844 }, true],
] as const) {
  test.describe(name, () => {
    test.use({ viewport: vp, hasTouch: mobile, isMobile: mobile });
    test(`el eliminado cambia de castillo en ${name}`, async ({ page }, info) => {
      test.setTimeout(300_000);
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
      }, null, { timeout: 200_000, polling: 'raf' });
      // Aviso al caer: causa, ronda y puesto; MIRAR LA PARTIDA.
      await expect(page.locator('#fall-sheet')).toContainText('¡Tu rey ha caído!');
      await expect(page.locator('#fall-sheet')).toContainText('Tu rey cayó fuera de la isla en la ronda 1');
      await expect(page.locator('#fall-sheet')).toContainText(/Quedas en [234]\.º lugar/);
      await page.click('#fall-watch');
      await expect(page.locator('#target-prev, #target-next, #hud-watch')).toHaveCount(0);
      // Solo castillos en pie, más «Todos» (D1).
      const standing = await page.evaluate(() => (window as any).__asedio.mode.host.state.players.filter((p: any) => p.alive).map((p: any) => String(p.slot)));
      await expect(page.locator('#spect-cards .spect-card')).toHaveCount(standing.length + 1);
      await expect(page.locator('#spect-cards .spect-card[aria-pressed="true"]')).toHaveAttribute('data-slot', '-1');
      if (mobile) {
        await expect(page.locator('#spect-watching')).toHaveText('Todos los castillos');
        await expect(page.locator('#hud-spect')).toHaveText('Eliminado · estás mirando');
        // El selector ocupa la franja de la bandeja: abajo, unos 190 px.
        const box = (await page.locator('#spect').boundingBox())!;
        expect(Math.abs(box.y + box.height - vp.height)).toBeLessThan(1);
        expect(box.height).toBeGreaterThan(170);
        expect(box.height).toBeLessThan(210);
        for (const c of await page.locator('#spect-cards .spect-card').all()) expect(Math.min(...Object.values((await c.boundingBox())!).slice(2))).toBeGreaterThanOrEqual(44);
        await page.locator(`#spect-cards .spect-card[data-slot="${standing[0]}"]`).tap();
      } else {
        await expect(page.locator('#spect-pill')).toContainText('Mirando todos los castillos');
        await page.keyboard.press('e');
      }
      const slot = await page.evaluate(() => (window as any).__asedio.mode.ui.watchSlot);
      expect(slot).toBeGreaterThanOrEqual(0);
      await expect(page.locator('#spect-cards .spect-card[aria-pressed="true"]')).toHaveAttribute('data-slot', String(slot));
      const name = await page.evaluate((slot) => (window as any).__asedio.mode.host.state.players.find((p: any) => p.slot === slot).name, slot);
      await expect(page.locator(mobile ? '#spect-watching' : '#spect-pill')).toContainText(name);
      await page.waitForTimeout(1200);
      // La cámara gira alrededor de ese castillo.
      const d = await page.evaluate((slot) => {
        const g = (window as any).__asedio.game;
        const o = g.view.kings.get(slot).position;
        return Math.hypot(g.rig.center.x - o.x, g.rig.center.z - o.z);
      }, slot);
      expect(d).toBeLessThan(3);
      await page.screenshot({ path: info.outputPath(`espectador-${mobile ? 'movil' : 'pc'}.png`) });
      // Y vuelve atrás hasta el plano general: en el móvil, deslizando sobre la escena hacia la derecha.
      if (mobile) {
        const cdp = await page.context().newCDPSession(page);
        const touch = (type: string, x: number) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: 380 }] });
        await touch('touchStart', 100);
        await touch('touchMove', 280);
        await touch('touchEnd', 280);
      } else await page.keyboard.press('q');
      await expect.poll(() => page.evaluate(() => (window as any).__asedio.mode.ui.watchSlot)).toBe(-1);
      // Si la partida acaba con el aviso de la caída abierto, el aviso se cierra: no tapa los botones.
      await page.evaluate(() => {
        const m = (window as any).__asedio.mode;
        m.ui.fallShown = false;
        m.ui.showFall(m.host.state);
      });
      await expect(page.locator('#fall-sheet')).toBeVisible();
      await page.evaluate(() => {
        const h = (window as any).__asedio.mode.host;
        h.update = Object.getPrototypeOf(h).update;
        h.endNow();
      });
      await expect(page.locator('#game-over')).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('.sheet-wrap')).toHaveCount(0);
      await page.locator('#rematch').click();
    });
  });
}
