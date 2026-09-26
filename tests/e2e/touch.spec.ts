import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { watchErrors } from './helpers';

// Móvil Android en horizontal: pantalla táctil, sin ratón. Los gestos se mandan como eventos
// táctiles de verdad (CDP), que Chromium convierte en pointer events de tipo `touch`.
test.use({ viewport: { width: 863, height: 360 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

type Pt = { x: number; y: number };
const touch = (cdp: CDPSession, type: 'touchStart' | 'touchMove' | 'touchEnd', pts: Pt[]) =>
  cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, id) => ({ x: p.x, y: p.y, id })) });

async function drag(cdp: CDPSession, from: Pt, to: Pt, steps = 10) {
  await touch(cdp, 'touchStart', [from]);
  for (let i = 1; i <= steps; i++) await touch(cdp, 'touchMove', [{ x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps }]);
  await touch(cdp, 'touchEnd', []);
}

const state = (page: Page) =>
  page.evaluate(() => {
    const a = (window as any).__asedio;
    const p = a.mode.host.state.players.find((q: any) => !q.bot);
    return { yaw: a.game.input.aim.yaw, pitch: a.game.input.aim.pitch, selected: p.selected, target: p.target, locked: p.locked, power: p.aim.power, charging: a.game.input.charging, zoom: a.game.rig.userZoom };
  });

test('táctil: apuntar arrastrando, flechas, tarjetas, pellizco y botón redondo', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watchErrors(page);
  await page.goto('/?bots=2&seed=5#solo');
  await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
  const cdp = await page.context().newCDPSession(page);
  expect(await page.evaluate(() => document.body.classList.contains('touch')), 'se detecta el móvil').toBe(true);

  // Arrastrar un dedo por la escena: a la derecha gira, hacia arriba sube la elevación.
  const s0 = await state(page);
  await drag(cdp, { x: 380, y: 200 }, { x: 460, y: 150 });
  const s1 = await state(page);
  expect(s1.yaw, 'gira').toBeLessThan(s0.yaw - 0.2);
  expect(s1.pitch, 'sube').toBeGreaterThan(s0.pitch + 0.1);
  expect(s1.locked, 'apuntar no dispara').toBe(false);

  // Flecha ▶: otro castillo objetivo. Tocar una tarjeta elige munición.
  await page.locator('#target-next').tap();
  await expect.poll(async () => (await state(page)).target).not.toBe(s1.target);
  await page.locator('#hud-ammo .ammo').nth(2).tap();
  await expect.poll(async () => (await state(page)).selected).toBe(2);

  // Pellizcar: separar los dedos acerca la cámara.
  const z0 = (await state(page)).zoom;
  await touch(cdp, 'touchStart', [{ x: 400, y: 200 }, { x: 460, y: 200 }]);
  for (let i = 1; i <= 8; i++) await touch(cdp, 'touchMove', [{ x: 400 - i * 12, y: 200 }, { x: 460 + i * 12, y: 200 }]);
  await touch(cdp, 'touchEnd', []);
  expect((await state(page)).zoom, 'acerca').toBeLessThan(z0 - 0.1);

  // Botón redondo abajo a la derecha: mantenerlo carga y al soltar el disparo queda listo.
  const btn = (await page.locator('#confirm').boundingBox())!;
  expect(btn.x + btn.width, 'a la derecha').toBeGreaterThan(863 - 140);
  expect(btn.y + btn.height, 'abajo').toBeGreaterThan(360 - 140);
  expect(Math.abs(btn.width - btn.height), 'redondo').toBeLessThan(4);
  const c = { x: btn.x + btn.width / 2, y: btn.y + btn.height / 2 };
  await touch(cdp, 'touchStart', [c]);
  await page.waitForTimeout(900);
  const mid = await state(page);
  expect(mid.charging).toBe(true);
  await page.screenshot({ path: test.info().outputPath('cargando.png') });
  await touch(cdp, 'touchEnd', []);
  await page.waitForFunction(() => (window as any).__asedio.mode.host.state.players.find((q: any) => !q.bot).locked, null, { timeout: 5000 });
  expect((await state(page)).power).toBeGreaterThan(0.2);
  expect(errors).toEqual([]);
});
