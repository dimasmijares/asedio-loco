import { expect, test, type CDPSession, type Page } from '@playwright/test';
import { watchErrors } from './helpers';

// Móvil Android en vertical (la forma de jugar por defecto): pantalla táctil, sin ratón. Los gestos
// se mandan como eventos táctiles de verdad (CDP), que Chromium convierte en pointer events `touch`.
const W = 390;
const H = 844;
test.use({ viewport: { width: W, height: H }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });

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

const box = (page: Page, sel: string) => page.locator(sel).boundingBox().then((b) => b!);

test('táctil: apuntar arrastrando, tarjetas, pellizco, pad y botón de la bandeja', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = watchErrors(page);
  await page.goto('/?bots=2&seed=5#solo');
  await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
  const cdp = await page.context().newCDPSession(page);
  expect(await page.evaluate(() => document.body.classList.contains('touch')), 'se detecta el móvil').toBe(true);
  // Perfil móvil (WRK-TASK-008): sin calidad guardada arranca en baja, con densidad de píxeles ≤ 1.
  const prof = await page.evaluate(() => ({ q: (window as any).__asedio.game.stage.quality, pr: (window as any).__asedio.game.stage.renderer.getPixelRatio() }));
  expect(prof.q).toBe('low');
  expect(prof.pr).toBeLessThanOrEqual(1);

  // Arrastrar un dedo por la escena: a la derecha gira, hacia arriba sube la elevación.
  const s0 = await state(page);
  await drag(cdp, { x: 150, y: 420 }, { x: 230, y: 370 });
  const s1 = await state(page);
  expect(s1.yaw, 'gira').toBeLessThan(s0.yaw - 0.2);
  expect(s1.pitch, 'sube').toBeGreaterThan(s0.pitch + 0.1);
  expect(s1.locked, 'apuntar no dispara').toBe(false);

  // Jugando no hay flechas: el castillo objetivo sale de hacia dónde apuntas (WRK-TASK-061).
  await expect(page.locator('#target-next')).toBeHidden();
  const t0 = s1.target;
  for (let i = 0; i < 12 && (await state(page)).target === t0; i++) await drag(cdp, { x: 120, y: 420 }, { x: 250, y: 420 });
  expect((await state(page)).target, 'al girar hacia otro castillo cambia el objetivo').not.toBe(t0);
  // Tocar una tarjeta elige munición, sin tarjeta de descripción (R-10 U2).
  await page.locator('#hud-ammo .ammo').nth(2).tap();
  await expect.poll(async () => (await state(page)).selected).toBe(2);
  await expect(page.locator('#ammo-tip')).toBeHidden();
  await expect(page.locator('#hud-ammo-desc')).toHaveCount(0);
  // Mantener el dedo (≈ 350 ms) la enseña encima de la bandeja, con el castillo objetivo a la vista;
  // al soltar desaparece y la carta queda elegida.
  const hold = await box(page, '#hud-ammo .ammo:nth-child(2)');
  await touch(cdp, 'touchStart', [{ x: hold.x + hold.width / 2, y: hold.y + hold.height / 2 }]);
  await page.waitForTimeout(150);
  await expect(page.locator('#ammo-tip'), 'un toque corto no la enseña').toBeHidden();
  await page.waitForTimeout(400);
  await expect(page.locator('#ammo-tip')).toBeVisible();
  const tip = await box(page, '#ammo-tip');
  expect(tip.y + tip.height, 'encima de la bandeja').toBeLessThan((await box(page, '#tray')).y);
  const castle = await page.evaluate(() => {
    const g = (window as any).__asedio.game;
    const me = (window as any).__asedio.mode.host.state.players.find((q: any) => !q.bot);
    const k = g.view.kings.get(me.target);
    const v = k.getWorldPosition(k.position.clone()).project(g.stage.camera);
    return { x: ((v.x + 1) / 2) * innerWidth, y: ((1 - v.y) / 2) * innerHeight };
  });
  expect(castle.y, 'el castillo objetivo sigue a la vista').toBeLessThan(tip.y);
  expect(castle.y).toBeGreaterThan(0);
  await touch(cdp, 'touchEnd', []);
  await expect(page.locator('#ammo-tip')).toBeHidden();
  await expect.poll(async () => (await state(page)).selected).toBe(1);

  // Pellizcar: separar los dedos acerca la cámara.
  const z0 = (await state(page)).zoom;
  await touch(cdp, 'touchStart', [{ x: 165, y: 420 }, { x: 225, y: 420 }]);
  for (let i = 1; i <= 8; i++) await touch(cdp, 'touchMove', [{ x: 165 - i * 12, y: 420 }, { x: 225 + i * 12, y: 420 }]);
  await touch(cdp, 'touchEnd', []);
  expect((await state(page)).zoom, 'acerca').toBeLessThan(z0 - 0.1);

  // Bandeja del pulgar (R-10 U1): como mucho el 30 % del alto, disparo a la izquierda y pad a la
  // derecha (diestro), cartas debajo; todo lo que se toca, de 44 px o más.
  const tray = await box(page, '#tray');
  expect(tray.height, 'bandeja ≤ 30 % del alto').toBeLessThanOrEqual(H * 0.3 + 0.5);
  expect(tray.y + tray.height).toBeCloseTo(H, 0);
  const btn = await box(page, '#confirm');
  const pad = await box(page, '#aim-pad');
  expect(btn.x + btn.width / 2, 'disparo a la izquierda').toBeLessThan(W / 2);
  expect(pad.x + pad.width / 2, 'pad a la derecha').toBeGreaterThan(W / 2);
  expect(btn.y, 'botón dentro de la bandeja').toBeGreaterThan(tray.y);
  expect(Math.abs(btn.width - btn.height), 'redondo').toBeLessThan(4);
  for (const r of [btn, pad, ...(await page.locator('#hud-ammo .ammo').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON())))]) expect(Math.min(r.width, r.height), 'pulsable ≥ 44 px').toBeGreaterThanOrEqual(44);
  // La escena se centra en lo que queda libre por encima de la bandeja.
  expect(await page.evaluate(() => (window as any).__asedio.game.stage.viewShift)).toBeGreaterThan(tray.height / 2 - 2);

  // Pad de puntería: arrastre relativo; a la derecha gira y hacia arriba eleva (como en la escena).
  const p0 = await state(page);
  const pc = { x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 };
  await drag(cdp, pc, { x: pc.x + 60, y: pc.y - 30 });
  const p1 = await state(page);
  expect(p1.yaw, 'el pad gira').toBeLessThan(p0.yaw - 0.1);
  expect(p1.pitch, 'el pad eleva').toBeGreaterThan(p0.pitch + 0.03);
  expect(p1.locked, 'el pad no dispara').toBe(false);
  await expect(page.locator('#pad-elev')).toHaveText(/^\d+°$/);

  // Botón de disparo: mantenerlo carga (el anillo se llena; dentro, el porcentaje y «SUELTA») y al
  // soltar el disparo queda listo y la bandeja se recoge (R-10 U3).
  const c = { x: btn.x + btn.width / 2, y: btn.y + btn.height / 2 };
  await touch(cdp, 'touchStart', [c]);
  await page.waitForTimeout(900);
  const mid = await state(page);
  expect(mid.charging).toBe(true);
  await expect(page.locator('#confirm')).toContainText('SUELTA');
  await expect(page.locator('#confirm .fire-pct')).toHaveText(/^\d+%$/);
  await page.screenshot({ path: test.info().outputPath('cargando.png') });
  await touch(cdp, 'touchEnd', []);
  await page.waitForFunction(() => (window as any).__asedio.mode.host.state.players.find((q: any) => !q.bot).locked, null, { timeout: 5000 });
  expect((await state(page)).power).toBeGreaterThan(0.2);
  await expect(page.locator('#tray')).toBeHidden();
  expect(errors).toEqual([]);
});

// Modo zurdo (R-10 U8): guardado en el dispositivo, espeja el botón y el pad.
test('modo zurdo: pad a la izquierda y disparo a la derecha', async ({ page }) => {
  test.setTimeout(90_000);
  await page.addInitScript(() => localStorage.setItem('asedio.settings', JSON.stringify({ leftHanded: true })));
  await page.goto('/?bots=1&seed=5#solo');
  await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
  const btn = await box(page, '#confirm');
  const pad = await box(page, '#aim-pad');
  expect(btn.x + btn.width / 2, 'disparo a la derecha').toBeGreaterThan(W / 2);
  expect(pad.x + pad.width / 2, 'pad a la izquierda').toBeLessThan(W / 2);
  expect(pad.x, 'mismo margen que en diestro').toBeCloseTo(14, 0);
  // Se cambia desde Ajustes y se aplica al momento.
  await page.locator('#hud-settings').tap();
  await page.locator('#set-left').uncheck();
  await page.locator('#settings-close').tap();
  expect((await box(page, '#confirm')).x, 'otra vez a la izquierda').toBeLessThan(W / 2);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('asedio.settings')!).leftHanded)).toBe(false);
});
