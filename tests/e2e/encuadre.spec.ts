import { expect, test } from '@playwright/test';

// Encuadre del impacto: desde WRK-TASK-063 (aprobado en R-08) el plano va de tu castillo al que
// apuntas, así que al empezar el impacto esos dos caen dentro de la pantalla, en escritorio y en un
// móvil en vertical (antes, WRK-TASK-035, los 4 castillos). Después, en los resultados, cada castillo en
// juego enseña encima el daño de la ronda (WRK-TASK-036).
for (const [name, vp, mobile] of [
  ['escritorio', { width: 1280, height: 720 }, false],
  ['móvil vertical', { width: 390, height: 844 }, true],
] as const) {
  test.describe(name, () => {
    test.use({ viewport: vp, hasTouch: mobile, isMobile: mobile });
    test(`plano general con los 4 castillos (${name})`, async ({ page }, info) => {
      test.setTimeout(180_000);
      await page.goto('/?bots=3&seed=7&autoplay=1#solo');
      await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'impact', null, { timeout: 75_000 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: info.outputPath('plano-general.png') });
      const ndc = await page.evaluate(() => {
        const g = (window as any).__asedio.game;
        const cam = g.stage.camera;
        const me = (window as any).__asedio.mode.host.state.players.find((q: any) => q.id === 'you');
        return [me.slot, me.target].map((slot: number) => {
          const k = g.view.kings.get(slot);
          const p = k.getWorldPosition(k.position.clone()).project(cam);
          return [p.x, p.y];
        });
      });
      expect(ndc.length).toBe(2);
      for (const [x, y] of ndc) expect(Math.abs(x) <= 1 && Math.abs(y) <= 1, `castillo en pantalla (${x.toFixed(2)}, ${y.toFixed(2)})`).toBe(true);

      // Se espera a las etiquetas y no a la fase: en CI (SwiftShader) los resultados tardan más y
      // las etiquetas solo duran 2,8 s, así que se miden en cuanto aparecen.
      await page.waitForFunction(() => document.querySelectorAll('#dmg-labels .dmg-label').length >= 4, null, { timeout: 90_000 });
      const labels = await page.locator('#dmg-labels .dmg-label').evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return { text: e.textContent, x: r.x, y: r.y, r: r.right, b: r.bottom };
        }),
      );
      expect(labels.length, 'etiquetas de daño').toBe(4);
      await page.screenshot({ path: info.outputPath('dano.png') });
      const box = (await page.locator('#results-box').boundingBox())!;
      for (const l of labels) expect(l.x < box.x + box.width && box.x < l.r && l.y < box.y + box.height && box.y < l.b, `«${l.text}» no tapa la lista de resultados`).toBe(false);
      for (const l of labels) expect(l.x >= 0 && l.y >= 0 && l.r <= vp.width + 0.5 && l.b <= vp.height + 0.5, `«${l.text}» dentro de la pantalla`).toBe(true);
    });
  });
}
