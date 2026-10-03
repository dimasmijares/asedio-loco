import { expect, test, type Browser, type Page } from '@playwright/test';
import { setName, watchErrors } from './helpers';

// Sala y salidas (R-07 F1 y F3, R-11): con dos dispositivos, en PC (1280×720) y en móvil vertical
// (390×844). Lo que hace uno se ve en el otro.
const FORMATS = [
  ['PC', { width: 1280, height: 720 }, false],
  ['móvil vertical', { width: 390, height: 844 }, true],
] as const;

type Fmt = (typeof FORMATS)[number];

async function device(browser: Browser, [, vp, mobile]: Fmt) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: mobile, isMobile: mobile });
  const page = await ctx.newPage();
  (page as Page & { errs?: string[] }).errs = watchErrors(page);
  return page;
}

const q = (fmt: Fmt, extra = '') => `/?${fmt[2] ? 'mobile=1&' : ''}fast=1${extra}`;

// Código de la sala: las cuatro letras grandes de la sala (R-11 S1).
export const roomCode = (p: Page) => p.locator('#room-code').getAttribute('data-code') as Promise<string>;

async function createRoom(host: Page, fmt: Fmt, name: string, extra = '') {
  await host.goto(q(fmt, extra));
  await setName(host, name);
  await host.click('#create');
  await expect(host.locator('#room-code')).toHaveAttribute('data-code', /^[A-Z]{4}$/);
  return roomCode(host);
}

async function join(p: Page, fmt: Fmt, code: string, name: string, extra = '') {
  await p.goto(`${q(fmt, extra)}#${code}`);
  await setName(p, name);
  await p.click('#join');
  await expect(p.locator('#player-list')).toContainText(name);
}

const humans = (p: Page) => p.locator('#player-list li[data-player]');

for (const fmt of FORMATS) {
  const [name] = fmt;
  test.describe(name, () => {
    test(`salir de la sala libera la plaza y el anfitrión se hereda (${name})`, async ({ browser }) => {
      const a = await device(browser, fmt);
      const b = await device(browser, fmt);
      const c = await device(browser, fmt);
      const code = await createRoom(a, fmt, 'Ana');
      await join(b, fmt, code, 'Beto');
      await join(c, fmt, code, 'Cata');
      for (const p of [a, b, c]) await expect(humans(p)).toHaveCount(3);

      // Un invitado sale: su plaza queda libre al momento en los demás, sin «Desconectado».
      await c.click('#leave-room');
      await expect(c.locator('#leave-room-sheet')).toContainText('Tu plaza quedará libre al momento.');
      await c.click('#leave-room-ok');
      await expect(c.locator('#home')).toBeVisible();
      for (const p of [a, b]) {
        await expect(humans(p)).toHaveCount(2);
        await expect(p.locator('#player-list .tag.off')).toHaveCount(0);
      }
      // Recargar la portada ya no vuelve a meterle en la sala.
      await c.reload();
      await expect(c.locator('#home')).toBeVisible();

      // Sale el anfitrión: la confirmación dice quién hereda y Beto pasa a poder empezar.
      await a.click('#leave-room');
      await expect(a.locator('#leave-room-sheet')).toContainText('Beto pasará a serlo');
      // «Quedarme» no hace nada.
      await a.click('#leave-room-stay');
      await expect(a.locator('#leave-room-sheet')).toHaveCount(0);
      await expect(humans(b)).toHaveCount(2);
      await a.click('#leave-room');
      await a.click('#leave-room-ok');
      await expect(a.locator('#home')).toBeVisible();
      await expect(humans(b)).toHaveCount(1);
      await expect(b.locator('#start')).toBeVisible();
      await expect(b.locator('#waiting')).toHaveCount(0);

      for (const p of [a, b, c]) expect((p as Page & { errs?: string[] }).errs).toEqual([]);
    });

    test(`salir de una partida en red desde el engranaje (${name})`, async ({ browser }) => {
      const a = await device(browser, fmt);
      const b = await device(browser, fmt);
      const code = await createRoom(a, fmt, 'Ana', '&bots=1&render=4');
      await join(b, fmt, code, 'Beto', '&render=4');
      await expect(humans(a)).toHaveCount(2);
      await a.click('#start');
      for (const p of [a, b]) await p.waitForFunction(() => (window as any).__asedio.mode?.state?.phase === 'aim', null, { timeout: 30_000 });

      await b.click('#hud-settings');
      await b.click('#settings-exit');
      await expect(b.locator('#leave-game')).toContainText('lo jugará un bot desde la ronda siguiente');
      await b.click('#leave-game-ok');
      await expect(b.locator('#home')).toBeVisible();
      // En el anfitrión, Beto ya no está en la sala: su castillo pasa a un bot en la ronda siguiente.
      await a.waitForFunction(() => (window as any).__asedio.conn.room.players.length === 1);
      await a.waitForFunction(() => {
        const s = (window as any).__asedio.mode.state;
        return s.round >= 2 && s.players.some((p: any) => p.name === 'Beto' && (p.auto || !p.alive));
      }, null, { timeout: 60_000 });
      for (const p of [a, b]) expect((p as Page & { errs?: string[] }).errs).toEqual([]);
    });

    test.describe(() => {
      test.use({ viewport: fmt[1], hasTouch: fmt[2], isMobile: fmt[2] });
      test(`salir de una partida en solitario (${name})`, async ({ page }) => {
        const errors = watchErrors(page);
        await page.goto(`${q(fmt, '&bots=2&seed=5&tutorial=0')}#solo`);
        await page.waitForFunction(() => (window as any).__asedio.mode?.host?.state.phase === 'aim', null, { timeout: 30_000 });
        await page.click('#hud-settings');
        await page.click('#settings-exit');
        await expect(page.locator('#leave-game')).toContainText('vuelves a la portada');
        // Tocar fuera es quedarse.
        await page.mouse.click(fmt[1].width / 2, 30);
        await expect(page.locator('#leave-game')).toHaveCount(0);
        await page.click('#hud-settings');
        await page.click('#settings-exit');
        await page.click('#leave-game-ok');
        await expect(page.locator('#home')).toBeVisible();
        expect(errors).toEqual([]);
      });
    });
  });
}
