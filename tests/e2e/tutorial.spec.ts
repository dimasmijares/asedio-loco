import { expect, test, type Page } from '@playwright/test';

// Tutorial de la primera partida (WRK-TASK-048): en PC y en móvil vertical, los 3 pasos se leen
// sin tapar ningún control y cada uno resalta el que toca.
const CONTROLS = ['.hud-top', '#hud-players', '.hud-corner', '#hud-aim', '#hud-ammo', '#target-prev', '#target-next', '#confirm', '#tray'];

async function overlaps(page: Page) {
  return page.evaluate((sel) => {
    const box = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return r.width && r.height ? r : null;
    };
    const coach = box(document.querySelector('#tutorial'));
    if (!coach) return ['sin tutorial'];
    const out: string[] = [];
    if (coach.left < 0 || coach.top < 0 || coach.right > innerWidth + 0.5 || coach.bottom > innerHeight + 0.5) out.push('fuera de la pantalla');
    for (const s of sel) {
      const r = box(document.querySelector(s));
      if (r && coach.left < r.right && r.left < coach.right && coach.top < r.bottom && r.top < coach.bottom) out.push(s);
    }
    return out;
  }, CONTROLS);
}

const focused = (page: Page) => page.evaluate(() => [...document.querySelectorAll('.tut-focus')].map((e) => `#${e.id}`).sort());

for (const [name, vp, mobile] of [
  ['PC', { width: 1280, height: 720 }, false],
  ['móvil vertical', { width: 390, height: 844 }, true],
  ['móvil vertical estrecho', { width: 360, height: 780 }, true],
] as const) {
  test.describe(name, () => {
    test.use({ viewport: vp, hasTouch: mobile, isMobile: mobile });
    test(`tutorial en ${name}`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.goto(`/?bots=3&seed=5&tutorial=1${mobile ? '&mobile=1' : ''}#solo`);
      await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
      await expect(page.locator('#tutorial')).toBeVisible();

      // 1 · Apunta: la mano (o el ratón) sobre la escena; en móvil vertical, el pad de la bandeja (R-10 U1).
      await expect(page.locator('#tutorial')).toHaveAttribute('data-step', 'aim');
      if (mobile) {
        await expect(page.locator('.coach-swipe')).toBeHidden();
        expect(await focused(page)).toEqual(['#aim-pad']);
      } else {
        await expect(page.locator('.coach-swipe')).toBeVisible();
        expect(await focused(page)).toEqual([]);
      }
      expect(await overlaps(page), 'el paso 1 no tapa controles').toEqual([]);
      await page.evaluate(() => (window as any).__asedio.mode.ui.tutorial.event('aim'));

      // 2 · Munición: resalta las tarjetas (y las flechas, si se ven).
      await expect(page.locator('#tutorial')).toHaveAttribute('data-step', 'adjust');
      await expect(page.locator('.coach-swipe')).toBeHidden();
      expect(await focused(page)).toContain('#hud-ammo');
      expect(await overlaps(page), 'el paso 2 no tapa controles').toEqual([]);
      // Tocar una tarjeta avanza el paso.
      await page.locator('#hud-ammo .ammo').nth(1).click();

      // 3 · ¡Fuego!: resalta el botón de disparo.
      await expect(page.locator('#tutorial')).toHaveAttribute('data-step', 'fire');
      expect(await focused(page)).toEqual(['#confirm']);
      expect(await overlaps(page), 'el paso 3 no tapa controles').toEqual([]);
      await page.evaluate(() => (window as any).__asedio.mode.ui.tutorial.event('fire'));

      await expect(page.locator('#tutorial')).toHaveCount(0);
      await expect(page.locator('.coach-swipe')).toHaveCount(0);
      expect(await focused(page)).toEqual([]);
    });
  });
}
