import { expect, test } from '@playwright/test';

// Plano general (WRK-TASK-035): al empezar el impacto, los 4 castillos en juego caen dentro de la
// pantalla, en escritorio y en un móvil en vertical.
for (const [name, vp, mobile] of [
  ['escritorio', { width: 1280, height: 720 }, false],
  ['móvil vertical', { width: 390, height: 844 }, true],
] as const) {
  test.describe(name, () => {
    test.use({ viewport: vp, hasTouch: mobile, isMobile: mobile });
    test(`plano general con los 4 castillos (${name})`, async ({ page }, info) => {
      test.setTimeout(90_000);
      await page.goto('/?bots=3&seed=7&autoplay=1#solo');
      await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'impact', null, { timeout: 75_000 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: info.outputPath('plano-general.png') });
      const ndc = await page.evaluate(() => {
        const g = (window as any).__asedio.game;
        const cam = g.stage.camera;
        return [...g.view.kings.values()].map((k: any) => {
          const p = k.getWorldPosition(k.position.clone()).project(cam);
          return [p.x, p.y];
        });
      });
      expect(ndc.length).toBe(4);
      for (const [x, y] of ndc) expect(Math.abs(x) <= 1 && Math.abs(y) <= 1, `castillo en pantalla (${x.toFixed(2)}, ${y.toFixed(2)})`).toBe(true);
    });
  });
}
