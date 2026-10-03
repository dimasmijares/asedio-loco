import { expect, test, type Page } from '@playwright/test';
import { watchErrors } from './helpers';

// Portada y «Jugar solo» de R-10 (U9, U10): en PC y en móvil vertical, todo dentro de la pantalla,
// sin cruces y con lo táctil de 44 px o más; el nombre al azar se guarda en el dispositivo.
type Box = { x: number; y: number; w: number; h: number; sel: string };

async function boxes(page: Page, sel: string) {
  return page.locator(sel).evaluateAll((els) =>
    els
      .filter((e) => (e as HTMLElement).offsetParent !== null)
      .map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height, sel: e.id ? `#${e.id}` : e.className };
      }),
  ) as Promise<Box[]>;
}

const cross = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

async function checkLayout(page: Page, sel: string, vp: { width: number; height: number }) {
  const all = await boxes(page, sel);
  expect(all.length).toBeGreaterThan(2);
  for (const b of all) {
    expect(b.x >= -0.5 && b.y >= -0.5 && b.x + b.w <= vp.width + 0.5 && b.y + b.h <= vp.height + 0.5, `${b.sel} dentro de la pantalla`).toBe(true);
    if (!['home-title', '#name-text', '#solo-rivals'].includes(b.sel)) expect(Math.min(b.w, b.h), `${b.sel} de 44 px o más`).toBeGreaterThanOrEqual(44);
  }
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(cross(all[i], all[j]), `${all[i].sel} se cruza con ${all[j].sel}`).toBe(false);
}

// Sin emoji en el texto de la interfaz (los emblemas ☀ ☾ ★ ϟ van como texto, no cuentan).
const emoji = (page: Page, sel: string) =>
  page.locator(sel).evaluate((el) => [...(el as HTMLElement).innerText.matchAll(/\p{Extended_Pictographic}/gu)].map((m) => m[0]).filter((c) => !'☀☾★'.includes(c)));

for (const [name, vp, mobile] of [
  ['PC', { width: 1280, height: 720 }, false],
  ['móvil vertical', { width: 390, height: 844 }, true],
  ['móvil vertical estrecho', { width: 360, height: 740 }, true],
] as const) {
  test.describe(name, () => {
    test.use({ viewport: vp, hasTouch: mobile, isMobile: mobile });

    test(`portada en ${name}`, async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto('/');
      // Nombre al azar desde la primera vez, guardado al recargar.
      const first = (await page.locator('#name-text').textContent())!;
      expect(first).toMatch(/^\S+ \S+$/);
      await page.reload();
      await expect(page.locator('#name-text')).toHaveText(first);
      // El dado da otro, que también se guarda; el lápiz lo edita en el sitio.
      await page.click('#name-random');
      const second = (await page.locator('#name-text').textContent())!;
      expect(second).not.toBe(first);
      await page.reload();
      await expect(page.locator('#name-text')).toHaveText(second);
      await page.click('#name-edit');
      await page.fill('#name', 'Ana');
      await page.press('#name', 'Enter');
      await expect(page.locator('#name-text')).toHaveText('Ana');
      await page.reload();
      await expect(page.locator('#name-text')).toHaveText('Ana');

      // Título en dos líneas, tablones y botones redondos: dentro, sin cruces y de 44 px o más.
      const title = await page.locator('.home-title span').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().y));
      expect(title[1] - title[0], 'ASEDIO / LOCO en dos líneas').toBeGreaterThan(30);
      const parts = '.home-title, #name-text, #name-random, #name-edit, .home-planks > *, #how-to, #open-settings';
      await checkLayout(page, parts, vp);
      await expect(page.locator('#solo')).toHaveText(/jugar solo/i);
      expect(await page.locator('#solo').evaluate((e) => getComputedStyle(e).backgroundColor)).toBe('rgb(254, 137, 50)');
      expect(await emoji(page, '#home')).toEqual([]);

      // Unirse con código: en móvil, el tablón se abre en el campo y UNIRSE; en PC ya está a la vista.
      if (mobile) {
        await expect(page.locator('#code')).toBeHidden();
        await page.click('#join-open');
      } else await expect(page.locator('#join-open')).toBeHidden();
      await expect(page.locator('#code')).toBeVisible();
      await checkLayout(page, parts, vp);
      await page.fill('#code', 'ab');
      await page.click('#join-code');
      await expect(page.locator('#home-error')).toHaveText('El código de sala son 4 letras');
      await page.fill('#code', 'zzzz');
      await expect(page.locator('#code')).toHaveValue('ZZZZ');
      await page.press('#code', 'Enter');
      await expect(page.locator('#home-error')).toHaveText('No hay ninguna sala con el código ZZZZ');

      // Cómo se juega: con iconos, sin emoji.
      await page.click('#how-to');
      await expect(page.locator('#howto')).toBeVisible();
      expect(await page.locator('#howto .howto-ico svg').count()).toBe(6);
      expect(await emoji(page, '#howto')).toEqual([]);
      await page.click('#howto-close');

      // Con un enlace de invitación, ENTRAR es la acción principal.
      await page.goto('/#ABCD');
      await expect(page.locator('#home-invite')).toContainText('ABCD');
      await expect(page.locator('#join')).toHaveText(/entrar/i);
      await expect(page.locator('#join-open')).toHaveCount(0);
      await checkLayout(page, '.home-title, #name-random, #name-edit, .home-planks > *, #how-to, #open-settings', vp);
      expect(errors).toEqual([]);
    });

    test(`jugar solo en ${name}`, async ({ page }) => {
      test.setTimeout(90_000);
      const errors = watchErrors(page);
      await page.goto('/');
      await page.click('#solo');
      await expect(page.locator('#solo-setup')).toBeVisible();
      // Selectores segmentados de 48 px; la opción elegida, en naranja.
      for (const b of await boxes(page, '#solo-bots button, #solo-difficulty button')) expect(b.h).toBeGreaterThanOrEqual(47.5);
      await expect(page.locator('#solo-bots button.on')).toHaveText('3');
      await expect(page.locator('#solo-difficulty button.on')).toHaveText('Normal');
      await expect(page.locator('#solo-rivals .emb')).toHaveCount(3);
      await page.click('#solo-bots button[data-v="1"]');
      await expect(page.locator('#solo-rivals .emb')).toHaveCount(1);
      await page.click('#solo-bots button[data-v="2"]');
      await expect(page.locator('#solo-rivals .emb')).toHaveCount(2);
      await page.click('#solo-difficulty button[data-v="facil"]');
      await checkLayout(page, '#solo-back, #solo-bots, #solo-difficulty, #solo-rivals, #solo-start, #sandbox', vp);
      expect(await emoji(page, '#solo-setup')).toEqual([]);
      // Volver lleva a la portada.
      await page.click('#solo-back');
      await expect(page.locator('#home')).toBeVisible();
      await page.click('#solo');
      await page.click('#solo-bots button[data-v="2"]');
      // Los rivales que se anuncian son los de la partida.
      const rivals = (await page.locator('#solo-rivals .solo-names').textContent())!;
      await page.click('#solo-start');
      await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase, null, { timeout: 60_000 });
      const bots = await page.evaluate(() => (window as any).__asedio.mode.host.state.players.filter((p: { bot: boolean }) => p.bot).map((p: { name: string }) => p.name));
      expect(bots.length).toBe(2);
      expect(rivals).toBe(`${bots[0]} y ${bots[1]}`);
      expect(errors).toEqual([]);
    });
  });
}
