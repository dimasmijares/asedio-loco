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
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  // La hoja de compartir del sistema no existe en el navegador de pruebas: se apunta lo que recibe.
  await ctx.addInitScript(() => {
    (window as any).__shared = [];
    navigator.share = async (d?: ShareData) => void (window as any).__shared.push(d);
  });
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

type Box = { x: number; y: number; w: number; h: number; sel: string };
const boxes = (p: Page, sel: string) =>
  p.locator(sel).evaluateAll((els) =>
    els
      .filter((e) => (e as HTMLElement).offsetParent !== null || getComputedStyle(e).position === 'fixed')
      .map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height, sel: e.id ? `#${e.id}` : e.className };
      }),
  ) as Promise<Box[]>;
const cross = (a: Box, b: Box) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;

// Todo dentro de la pantalla, sin cruces entre `sel` y lo táctil de `touch` de 44 px o más.
async function checkLayout(p: Page, vp: { width: number; height: number }, sel: string, touch: string) {
  const all = await boxes(p, sel);
  expect(all.length).toBeGreaterThan(1);
  for (const b of all) expect(b.x >= -0.5 && b.y >= -0.5 && b.x + b.w <= vp.width + 0.5 && b.y + b.h <= vp.height + 0.5, `${b.sel} dentro de la pantalla`).toBe(true);
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) expect(cross(all[i], all[j]), `${all[i].sel} se cruza con ${all[j].sel}`).toBe(false);
  for (const b of await boxes(p, touch)) expect(Math.min(b.w, b.h), `${b.sel} de 44 px o más`).toBeGreaterThanOrEqual(44);
}

for (const fmt of FORMATS) {
  const [name, vp, mobile] = fmt;
  test.describe(name, () => {
    // Las que juegan partidas, con dos o tres navegadores a la vez: en CI una ronda tarda bastante
    // más que en local (salieron como «flaky» por tiempo el 03-10-2026).
    test.describe.configure({ timeout: 300_000 });
    test(`código grande e invitar (${name})`, async ({ browser }) => {
      const a = await device(browser, fmt);
      const code = await createRoom(a, fmt, 'Ana');
      // Cuatro letras grandes (R-11 S1).
      await expect(a.locator('#room-code .code-tile')).toHaveText([...code]);
      const tile = await a.locator('#room-code .code-tile').first().boundingBox();
      expect(tile!.height).toBeGreaterThanOrEqual(56);
      if (mobile) {
        // COMPARTIR abre la hoja del sistema con el enlace; el redondo copia el código.
        await expect(a.locator('#copy-link')).toHaveCount(0);
        await a.click('#share');
        const shared = await a.evaluate(() => (window as any).__shared);
        expect(shared).toHaveLength(1);
        expect(shared[0].url).toMatch(new RegExp(`/#${code}$`));
        expect(shared[0].text).toContain(code);
      } else {
        await expect(a.locator('#share')).toHaveCount(0);
        await a.click('#copy-link');
        await expect(a.locator('.toast').last()).toContainText('Enlace copiado');
        expect(await a.evaluate(() => navigator.clipboard.readText())).toMatch(new RegExp(`/#${code}$`));
      }
      await a.click('#copy-code');
      await expect(a.locator('.toast').last()).toContainText(`Código ${code} copiado`);
      expect(await a.evaluate(() => navigator.clipboard.readText())).toBe(code);
      await checkLayout(a, vp, '#leave-room, #room-settings, .code-card, #lobby', '#leave-room, #room-settings, #room-help, #share, #copy-code, #copy-link');
      expect((a as Page & { errs?: string[] }).errs).toEqual([]);
    });

    test(`plazas, dificultad y nombre se ven en los dos dispositivos (${name})`, async ({ browser }) => {
      const a = await device(browser, fmt);
      const b = await device(browser, fmt);
      const code = await createRoom(a, fmt, 'Ana');
      // Solo, EMPEZAR está desactivado (S5).
      await expect(a.locator('#start')).toBeDisabled();
      await expect(a.locator('#start-hint')).toHaveText('Hace falta al menos otro jugador o un bot');
      await join(b, fmt, code, 'Beto');
      await expect(a.locator('#start')).toBeEnabled();
      // El invitado no ve EMPEZAR ni puede tocar las plazas; espera al anfitrión por su nombre.
      await expect(b.locator('#start')).toHaveCount(0);
      await expect(b.locator('#waiting')).toHaveText('Esperando a que Ana empiece');
      await expect(b.locator('#player-list button.seat-card')).toHaveCount(0);
      for (const p of [a, b]) await expect(p.locator('.room-count')).toHaveText('· 2 de 4');

      // Plaza libre → bot, con el nombre fijo de esa plaza (D2: plaza 4, Sir Bot).
      await a.click('#seat-add-3');
      for (const p of [a, b]) {
        await expect(p.locator('#player-list li[data-bot="3"]')).toContainText('Sir Bot');
        await expect(p.locator('.room-count')).toHaveText('· 3 de 4');
      }
      // La dificultad solo aparece con bots: Normal por defecto; el anfitrión la cambia y el invitado la lee.
      await expect(a.locator('#bot-difficulty [aria-checked="true"]')).toHaveText('Normal');
      await expect(b.locator('#bot-difficulty-text')).toHaveText('Bots en dificultad Normal');
      await a.click('#bot-difficulty [data-v="dificil"]');
      await expect(b.locator('#bot-difficulty-text')).toHaveText('Bots en dificultad Difícil');
      await a.click('#seat-add-2');
      await expect(b.locator('#player-list li[data-bot="2"]')).toContainText('Reina Rúter');
      // Tocar un bot lo quita.
      await a.click('#player-list li[data-bot="3"] button');
      await a.click('#player-list li[data-bot="2"] button');
      for (const p of [a, b]) {
        await expect(p.locator('#player-list li[data-bot]')).toHaveCount(0);
        await expect(p.locator('#bot-difficulty, #bot-difficulty-text')).toHaveCount(0);
      }

      // Nombre en tu fila (S3): lápiz, Intro; el dado; vacío, uno al azar.
      await b.click('#room-name-edit');
      await b.fill('#room-name', 'Bea');
      await b.press('#room-name', 'Enter');
      await expect(a.locator('#player-list')).toContainText('Bea');
      await b.click('#room-name-random');
      await expect(b.locator('#room-name-text')).not.toHaveText('Bea');
      const dice = (await b.locator('#room-name-text').textContent())!;
      await expect(a.locator('#player-list')).toContainText(dice);
      await b.click('#room-name-edit');
      await b.fill('#room-name', '');
      await b.click('#room-name-save');
      await expect(b.locator('#room-name-text')).not.toHaveText(dice);
      await expect(b.locator('#room-name-text')).toHaveText(/^\S+ \S+$/);
      const bName = (await b.locator('#room-name-text').textContent())!;
      await expect(a.locator('#player-list')).toContainText(bName);
      // Se guarda en el dispositivo, como el de la portada.
      expect(await b.evaluate(() => localStorage.getItem('asedio.name'))).toBe(bName);

      // Un jugador desconectado: el anfitrión lo quita tocando su plaza.
      const c = await device(browser, fmt);
      await join(c, fmt, code, 'Cata');
      await expect(humans(a)).toHaveCount(3);
      await c.context().close();
      const gone = a.locator('#player-list li[data-player] button[aria-label="Quitar Cata"]');
      await expect(gone).toBeVisible({ timeout: 15_000 });
      await expect(b.locator('#player-list .seat-chip.off')).toHaveText('DESCONECTADO');
      await gone.click();
      for (const p of [a, b]) await expect(humans(p)).toHaveCount(2);

      await a.click('#seat-add-3');
      // Medir cuando los dos ya han redibujado la sala (en CI, contra producción, una medida tomada
      // justo tras el clic salió vacía).
      await expect(a.locator('#bot-difficulty')).toBeVisible();
      await expect(b.locator('#bot-difficulty-text')).toBeVisible();
      await checkLayout(a, vp, '.seat-card, #bot-difficulty, #start', '#player-list button, #bot-difficulty button, #start, #leave-room');
      await checkLayout(b, vp, '.seat-card, #bot-difficulty-text, #waiting', '#player-list button, #leave-room');
      for (const p of [a, b]) expect((p as Page & { errs?: string[] }).errs).toEqual([]);
    });

    test(`revancha en un paso y volver a la sala (${name})`, async ({ browser }) => {
      const a = await device(browser, fmt);
      const b = await device(browser, fmt);
      const code = await createRoom(a, fmt, 'Ana', '&bots=1&render=4');
      await join(b, fmt, code, 'Beto', '&render=4');
      await a.click('#start');
      const phase = (p: Page) => p.evaluate(() => (window as any).__asedio.mode?.state?.phase);
      for (const p of [a, b]) await expect.poll(() => phase(p), { timeout: 150_000 }).toBe('aim');
      const game = (p: Page) => p.evaluate(() => (window as any).__asedio.conn.room.game);
      const first = await game(a);
      // Fin de partida al momento (gancho de pruebas): el anfitrión ve REVANCHA y VOLVER A LA SALA; el
      // invitado espera a que la pida, por su nombre.
      await a.evaluate(() => (window as any).__asedio.mode.netHost.host.endNow());
      await expect(a.locator('#rematch')).toBeVisible({ timeout: 30_000 });
      await expect(a.locator('#back-to-room')).toBeVisible();
      await expect(a.locator('#over-wait')).toHaveCount(0);
      await expect(b.locator('#over-wait')).toHaveText('Esperando a que Ana pida la revancha', { timeout: 30_000 });
      await expect(b.locator('#rematch, #back-to-room')).toHaveCount(0);
      // REVANCHA: otra partida al momento, sin pasar por la sala, con los mismos jugadores y el bot.
      await a.click('#rematch');
      for (const p of [a, b]) {
        await expect.poll(() => game(p)).toBe(first + 1);
        await expect.poll(() => phase(p), { timeout: 150_000 }).toBe('aim');
        await expect(p.locator('#lobby')).toHaveCount(0);
        expect(await p.evaluate(() => (window as any).__asedio.mode.state.players.map((q: any) => q.name).sort())).toEqual(['Ana', 'Beto', 'Sir Bot']);
      }
      // VOLVER A LA SALA: los dos vuelven a la sala con las mismas plazas.
      await a.evaluate(() => (window as any).__asedio.mode.netHost.host.endNow());
      await a.click('#back-to-room');
      for (const p of [a, b]) {
        await expect(p.locator('#lobby')).toBeVisible();
        await expect(humans(p)).toHaveCount(2);
        await expect(p.locator('#player-list li[data-bot="3"]')).toHaveCount(1);
      }
      for (const p of [a, b]) expect((p as Page & { errs?: string[] }).errs).toEqual([]);
    });

    test(`llegar tarde: se explica y juegas en la próxima (${name})`, async ({ browser }) => {
      const a = await device(browser, fmt);
      const code = await createRoom(a, fmt, 'Ana', '&bots=1&render=4');
      await a.click('#start');
      const phase = (p: Page) => p.evaluate(() => (window as any).__asedio.mode?.state?.phase);
      await expect.poll(() => phase(a), { timeout: 150_000 }).toBe('aim');
      // Cata entra con la partida empezada: la hoja lo explica, con el marcador a la vista detrás.
      const c = await device(browser, fmt);
      await c.goto(`${q(fmt, '&render=4')}#${code}`);
      await setName(c, 'Cata');
      await c.click('#join');
      // La hoja sale con la partida ya montada (carga la física y el 3D): con tres navegadores, tarda.
      await expect(c.locator('#late-sheet')).toContainText('Partida en curso', { timeout: 90_000 });
      await expect(c.locator('#late-sheet')).toContainText('Entrarás a jugar en la próxima partida');
      await c.click('#late-watch');
      await expect(c.locator('#late-sheet')).toHaveCount(0);
      await expect(c.locator('#hud-spect')).toHaveText('Partida en curso · juegas en la próxima');
      await expect(c.locator('#hud-players .hp')).toHaveCount(2);
      await expect(c.locator('#confirm')).toBeHidden();
      // En la revancha juega.
      await a.evaluate(() => (window as any).__asedio.mode.netHost.host.endNow());
      await a.click('#rematch');
      await expect.poll(() => c.evaluate(() => (window as any).__asedio.mode?.you), { timeout: 150_000 }).not.toBeNull();
      await expect(c.locator('#hud-spect')).toBeHidden();
      for (const p of [a, c]) expect((p as Page & { errs?: string[] }).errs).toEqual([]);
    });

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
        await expect(p.locator('#player-list .seat-chip.off')).toHaveCount(0);
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
      for (const p of [a, b]) await p.waitForFunction(() => (window as any).__asedio.mode?.state?.phase === 'aim', null, { timeout: 150_000 });

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
      }, null, { timeout: 150_000 });
      for (const p of [a, b]) expect((p as Page & { errs?: string[] }).errs).toEqual([]);
    });

    test.describe(() => {
      test.use({ viewport: fmt[1], hasTouch: fmt[2], isMobile: fmt[2] });
      test(`salir de una partida en solitario (${name})`, async ({ page }) => {
        const errors = watchErrors(page);
        await page.goto(`${q(fmt, '&bots=2&seed=5&tutorial=0')}#solo`);
        // La primera partida de la página carga Rapier y el 3D: en CI llega a pasar de 30 s.
        await page.waitForFunction(() => (window as any).__asedio.mode?.host?.state.phase === 'aim', null, { timeout: 150_000 });
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

      test(`pausa y final en solitario (${name})`, async ({ page }) => {
        const errors = watchErrors(page);
        await page.goto(`${q(fmt, '&bots=2&seed=5&tutorial=0&dif=dificil')}#solo`);
        const host = () =>
          page.evaluate(() => {
            const s = (window as any).__asedio.mode?.host?.state;
            return { phase: s?.phase, rem: s?.remaining ?? 0, round: s?.round ?? -1 };
          });
        await expect.poll(async () => (await host()).phase, { timeout: 150_000 }).toBe('aim');
        // Con el engranaje abierto, la partida se para (F9).
        await page.click('#hud-settings');
        await expect(page.locator('#settings-paused')).toHaveText('Partida en pausa');
        const t0 = (await host()).rem;
        await page.waitForTimeout(1500);
        expect((await host()).rem).toBe(t0);
        await page.click('#settings-close');
        await expect.poll(async () => (await host()).rem).toBeLessThan(t0);
        // Final (F8): OTRA PARTIDA, CAMBIAR RIVALES y SALIR.
        await page.evaluate(() => (window as any).__asedio.mode.host.endNow());
        await expect(page.locator('#rematch')).toHaveText('Otra partida', { timeout: 30_000 });
        await expect(page.locator('#change-rivals')).toBeVisible();
        await expect(page.locator('#exit')).toBeVisible();
        await expect(page.locator('#over-actions > *')).toHaveText(['Otra partida', 'Cambiar rivales', 'Salir']);
        await page.click('#rematch');
        await expect.poll(async () => (await host()).round, { timeout: 30_000 }).toBeLessThanOrEqual(1);
        await expect(page.locator('#game-over')).toHaveCount(0);
        // CAMBIAR RIVALES vuelve a «Jugar solo» con lo elegido (2 rivales, difícil).
        await page.evaluate(() => (window as any).__asedio.mode.host.endNow());
        await page.click('#change-rivals');
        await expect(page.locator('#solo-setup')).toBeVisible();
        await expect(page.locator('#solo-bots [aria-checked="true"]')).toHaveText('2');
        await expect(page.locator('#solo-difficulty [aria-checked="true"]')).toHaveText('Difícil');
        await page.click('#solo-bots [data-v="1"]');
        await page.click('#solo-start');
        await expect.poll(() => page.evaluate(() => (window as any).__asedio.mode?.host?.state.players.length), { timeout: 150_000 }).toBe(2);
        expect(errors).toEqual([]);
      });
    });
  });
}
