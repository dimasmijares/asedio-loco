import { expect, test, type Page } from '@playwright/test';

// HUD compacto: en tres móviles en horizontal (menos de 500 px de alto) y dos en vertical ningún
// elemento del HUD se cruza con otro ni se sale de la pantalla. En un ordenador no cambia.
const PARTS = ['.hud-top', '#hud-players', '#help-toggle', '.hud-corner', '#hud-aim', '#hud-ammo', '#target-prev', '#target-next', '#confirm'];

async function rects(page: Page) {
  return page.evaluate((sel) => {
    const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
    for (const s of sel) {
      const el = document.querySelector(s) as HTMLElement | null;
      if (!el || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.height) out[s] = { x: r.x, y: r.y, w: r.width, h: r.height };
    }
    return out;
  }, PARTS);
}

for (const [w, h] of [
  [863, 360],
  [740, 360],
  [915, 412],
  [360, 780],
  [412, 915],
]) {
  test.describe(`${w}×${h}`, () => {
    test.use({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    test(`HUD compacto sin solapes en ${w}×${h}`, async ({ page }, info) => {
      test.setTimeout(90_000);
      await page.goto('/?bots=3&seed=5#solo');
      await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
      await page.waitForTimeout(500);
      await page.screenshot({ path: info.outputPath(`hud-${w}x${h}.png`) });
      const r = await rects(page);
      expect(Object.keys(r).length, `elementos visibles: ${Object.keys(r).join(', ')}`).toBeGreaterThanOrEqual(8);
      for (const [k, a] of Object.entries(r)) {
        expect(a.x >= 0 && a.y >= 0 && a.x + a.w <= w + 0.5 && a.y + a.h <= h + 0.5, `${k} dentro de la pantalla`).toBe(true);
      }
      const keys = Object.keys(r);
      for (let i = 0; i < keys.length; i++)
        for (let j = i + 1; j < keys.length; j++) {
          const a = r[keys[i]];
          const b = r[keys[j]];
          const cross = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
          expect(cross, `${keys[i]} se cruza con ${keys[j]}`).toBe(false);
        }
      // Marcador compacto: sin nombres, con porcentaje.
      expect(await page.locator('.hp-name').first().isVisible()).toBe(false);
      await expect(page.locator('.hp-pct').first()).toBeVisible();
    });
  });
}

test('con más de 500 px de alto el marcador sigue enseñando los nombres', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/?bots=3&seed=5#solo');
  await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
  await expect(page.locator('.hp-name').first()).toBeVisible();
});
