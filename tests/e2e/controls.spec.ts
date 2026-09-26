import { expect, test } from '@playwright/test';
import { canvasNotBlack, watchErrors } from './helpers';

// Control de la catapulta: clic derecho + ratón para apuntar, Espacio mantenido para cargar la
// fuerza (la parábola crece) y al soltar el disparo queda listo y ya no cambia.
test('control: apuntar con clic derecho y cargar con Espacio', async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  // Sin bloqueo de puntero: en Chromium sin interfaz los movimientos sintéticos bloqueados no son fiables.
  await page.goto('/?bots=1&seed=5&nolock=1#solo');
  await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
  const me = () =>
    page.evaluate(() => {
      const m = (window as any).__asedio.mode;
      const p = m.host.state.players.find((q: any) => !q.bot);
      const input = (window as any).__asedio.game.input;
      return { locked: p.locked, power: p.aim.power, ammo: p.ammo.length, yaw: input.aim.yaw, pitch: input.aim.pitch, charging: input.charging, inputPower: input.aim.power, dots: (window as any).__asedio.game.preview.mesh.count };
    });
  const start = await me();
  expect(start.ammo).toBe(3);
  await canvasNotBlack(page);

  // Munición: clic en la tarjeta (aunque el ratón se mueva un poco entre pulsar y soltar),
  // 1/2/3 de la fila de números y del teclado numérico.
  const selected = () => page.evaluate(() => (window as any).__asedio.mode.host.state.players.find((q: any) => !q.bot).selected as number);
  const card = page.locator('#hud-ammo .ammo').nth(1);
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.move(box.x + box.width / 2 + 4, box.y + box.height / 2 + 2);
  await page.mouse.up();
  await expect.poll(selected, { message: 'clic en la segunda tarjeta' }).toBe(1);
  await page.keyboard.press('Digit3');
  await expect.poll(selected, { message: 'tecla 3' }).toBe(2);
  await page.keyboard.press('Numpad1');
  await expect.poll(selected, { message: 'tecla 1 del teclado numérico' }).toBe(0);
  await page.keyboard.press('Numpad2');
  await expect.poll(selected, { message: 'tecla 2 del teclado numérico' }).toBe(1);
  expect((await me()).locked, 'elegir munición no dispara').toBe(false);

  // Clic derecho mantenido: el ratón a la derecha gira, hacia arriba sube la elevación.
  await page.mouse.move(480, 300);
  await page.mouse.down({ button: 'right' });
  await page.mouse.move(600, 240, { steps: 12 });
  await page.mouse.up({ button: 'right' });
  const aimed = await me();
  expect(aimed.yaw, 'gira hacia la derecha').toBeLessThan(start.yaw - 0.2);
  expect(aimed.pitch, 'sube la elevación').toBeGreaterThan(start.pitch + 0.1);

  // Un toque de Espacio no dispara.
  await page.keyboard.press('Space');
  await page.waitForTimeout(300);
  expect((await me()).locked).toBe(false);

  // Mantener Espacio carga la fuerza y alarga la parábola.
  await page.keyboard.down('Space');
  await page.waitForTimeout(300);
  const early = await me();
  await page.waitForTimeout(500);
  const mid = await me();
  expect(mid.charging).toBe(true);
  expect(mid.inputPower).toBeGreaterThan(early.inputPower);
  expect(mid.dots, 'la parábola crece').toBeGreaterThanOrEqual(early.dots);
  await page.screenshot({ path: info.outputPath('cargando.png') });
  await page.keyboard.up('Space');

  // Al soltar, el disparo queda listo con esa fuerza y ya no se puede cambiar.
  await page.waitForFunction(() => (window as any).__asedio.mode.host.state.players.find((q: any) => !q.bot).locked, null, { timeout: 5000 });
  const fired = await me();
  // La captura tarda en SwiftShader, así que la carga puede haber llegado al máximo.
  expect(fired.power).toBeGreaterThanOrEqual(mid.inputPower);
  expect(fired.power).toBeGreaterThan(0.3);
  await page.keyboard.down('Space');
  await page.waitForTimeout(400);
  await page.keyboard.up('Space');
  expect((await me()).power, 'el disparo es definitivo').toBeCloseTo(fired.power, 5);

  // Con todos listos, empieza la cuenta atrás sin agotar el tiempo de apuntado (el reloj del
  // anfitrión va con los fotogramas, así que en CI, a pocos fps, se le da margen de sobra).
  await page.waitForFunction(() => (window as any).__asedio.mode.host.state.phase !== 'aim', null, { timeout: 90_000 });
  const leave = await page.evaluate(() => {
    const host = (window as any).__asedio.mode.host;
    return { phase: host.state.phase as string, aimLeft: host.aimLeft as number };
  });
  expect(leave.phase, 'tras el apuntado viene la cuenta atrás').toBe('countdown');
  expect(leave.aimLeft, 'la cuenta atrás empieza antes de agotar el apuntado').toBeGreaterThan(0);
  await page.waitForFunction(() => (window as any).__asedio.mode.host.state.phase === 'impact', null, { timeout: 30_000 });
  expect(errors).toEqual([]);
});
