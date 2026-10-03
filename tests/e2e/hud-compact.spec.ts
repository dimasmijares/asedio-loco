import { expect, test, type Page } from '@playwright/test';
import { AMMO } from '../../shared/ammo';

// HUD compacto: en tres móviles en horizontal (menos de 500 px de alto) y tres en vertical ningún
// elemento del HUD se cruza con otro ni se sale de la pantalla. En un ordenador no cambia. En vertical,
// el botón de disparo, el pad y las cartas van dentro de la bandeja del pulgar (R-10 U1).
const PARTS = ['.hud-top', '#hud-players', '#help-toggle', '.hud-corner', '#hud-aim', '#hud-ammo', '#target-prev', '#target-next', '#confirm'];
// En vertical, arriba: píldora de la ronda, engranaje, fila de chips y viento y objetivo (R-10 U4, U5).
const PORTRAIT = ['#hud-round', '#hud-settings', '#hud-players', '#hud-flags', '#hud-aim', '#target-prev', '#target-next', '#tray'];
const IN_TRAY = ['#confirm', '#aim-pad', '#hud-ammo'];

type Box = { x: number; y: number; w: number; h: number };
const cross = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function noCross(r: Record<string, Box>) {
  const keys = Object.keys(r);
  for (let i = 0; i < keys.length; i++)
    for (let j = i + 1; j < keys.length; j++) expect(cross(r[keys[i]], r[keys[j]]), `${keys[i]} se cruza con ${keys[j]}`).toBe(false);
}

async function rects(page: Page, parts = PARTS) {
  return page.evaluate((sel) => {
    const out: Record<string, { x: number; y: number; w: number; h: number }> = {};
    for (const s of sel) {
      const el = document.querySelector(s) as HTMLElement | null;
      if (!el || el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.height) out[s] = { x: r.x, y: r.y, w: r.width, h: r.height };
    }
    return out;
  }, parts);
}

for (const [w, h] of [
  [863, 360],
  [740, 360],
  [915, 412],
  [360, 780],
  [390, 844],
  [412, 915],
]) {
  test.describe(`${w}×${h}`, () => {
    test.use({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    test(`HUD compacto sin solapes en ${w}×${h}`, async ({ page }, info) => {
      test.setTimeout(90_000);
      await page.goto('/?bots=3&seed=5#solo');
      await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
      await page.waitForTimeout(500);
      const portrait = h > w;
      // Sin viento (03-10-2026): no hay chip del viento.
      await expect(page.locator('#hud-wind-chip')).toHaveCount(0);
      // Tarjeta de descripción (R-10 U2) al mantener el dedo en una carta, con la descripción más
      // larga: dentro de la pantalla y en dos líneas como mucho.
      const longest = Object.values(AMMO).map((a) => a.desc).sort((a, b) => b.length - a.length)[0];
      const card = (await page.locator('#hud-ammo .ammo').first().boundingBox())!;
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: card.x + card.width / 2, y: card.y + card.height / 2, id: 0 }] });
      await expect(page.locator('#ammo-tip')).toBeVisible();
      const tip = await page.evaluate((t) => {
        document.querySelector('#ammo-tip .tip-text')!.textContent = t;
        const r = document.querySelector('#ammo-tip')!.getBoundingClientRect();
        return { x: r.x, y: r.y, r: r.right, b: r.bottom, text: document.querySelector('#ammo-tip .tip-text')!.getBoundingClientRect().height };
      }, longest);
      await page.screenshot({ path: info.outputPath(`tarjeta-${w}x${h}.png`) });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      expect(tip.x >= 0 && tip.y >= 0 && tip.r <= w + 0.5 && tip.b <= h + 0.5, 'tarjeta dentro de la pantalla').toBe(true);
      expect(tip.text, 'descripción en dos líneas como mucho').toBeLessThanOrEqual(2 * 17 + 1);
      expect(tip.b, 'por encima de las cartas').toBeLessThan(card.y);
      // En una sola evaluación: el marcador se rehace a menudo y un localizador puede quedarse con filas ya sueltas.
      const shorts = await page.evaluate(() =>
        [...document.querySelectorAll('.hp-short')].map((e) => ({ text: e.textContent, w: e.getBoundingClientRect().width, cut: e.scrollWidth > e.clientWidth + 1, mark: !!e.closest('.hp.mark') })),
      );
      await page.screenshot({ path: info.outputPath(`hud-${w}x${h}.png`) });
      const r = await rects(page, portrait ? PORTRAIT : PARTS);
      // Sin la línea de potencia ni las flechas del jugador (WRK-TASK-061): quedan 6 o 7.
      expect(Object.keys(r).length, `elementos visibles: ${Object.keys(r).join(', ')}`).toBeGreaterThanOrEqual(portrait ? 4 : 6);
      for (const [k, a] of Object.entries(r)) {
        expect(a.x >= 0 && a.y >= 0 && a.x + a.w <= w + 0.5 && a.y + a.h <= h + 0.5, `${k} dentro de la pantalla`).toBe(true);
      }
      noCross(r);
      if (portrait) {
        // Bandeja: ≤ 30 % del alto; botón, pad y cartas dentro de ella y sin cruzarse.
        const tray = r['#tray'];
        expect(tray, 'bandeja visible').toBeTruthy();
        expect(tray.h).toBeLessThanOrEqual(h * 0.3 + 0.5);
        const inner = await rects(page, IN_TRAY);
        expect(Object.keys(inner).length).toBe(3);
        for (const [k, a] of Object.entries(inner)) expect(a.x >= tray.x && a.x + a.w <= tray.x + tray.w + 0.5 && a.y >= tray.y && a.y + a.h <= tray.y + tray.h + 0.5, `${k} dentro de la bandeja`).toBe(true);
        noCross(inner);
      }
      // Marcador: chips con el nombre corto (WRK-TASK-046, componente Marcador), sin porcentaje y sin
      // «Fase de apuntado»; en vertical, en una fila de cuatro (U4).
      expect(await page.locator('.hp-name').first().isVisible()).toBe(false);
      await expect(page.locator('.hp-pct')).toHaveCount(0);
      await expect(page.locator('#hud-phase')).toHaveCount(0);
      await expect(page.locator('#mute')).toHaveCount(0);
      if (portrait) {
        const chips = await page.locator('#hud-players .hp').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
        expect(chips.length).toBe(4);
        for (const c of chips) {
          expect(Math.abs(c.y - chips[0].y), 'en una fila').toBeLessThan(1);
          expect(c.width).toBeLessThanOrEqual(86.5);
        }
        const gear = r['#hud-settings'];
        expect(Math.min(gear.w, gear.h), 'engranaje ≥ 44 px').toBeGreaterThanOrEqual(44);
        await expect(page.locator('#hud-round')).toContainText(/Ronda 1\s*\d+/);
      }
      expect(shorts.length).toBe(4);
      for (const s of shorts) {
        expect(s.w, `nombre corto «${s.text}» visible`).toBeGreaterThan(4);
        // Con la marca de listo a la derecha (R-10 fase 3), un nombre largo puede abreviarse.
        if (!s.mark) expect(s.cut, `nombre corto «${s.text}» sin recortar`).toBe(false);
      }
      expect(new Set(shorts.map((s) => s.text)).size, 'nombres cortos distintos').toBe(4);
      expect(shorts.some((s) => s.text === 'Tú')).toBe(true);
    });
  });
}

// HUD de PC (R-10 U11, maqueta «PC · Apuntando»): jugadores en columna arriba a la izquierda, la
// píldora de la ronda arriba al centro, viento, objetivo y engranaje arriba a la derecha; abajo, las
// cartas de 92×92, la barra de potencia de 300 px con su pista, el chip «Controles · H» y la elevación.
for (const [w, h] of [
  [1280, 720],
  [1024, 600],
]) {
  test(`HUD de PC en ${w}×${h}`, async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: w, height: h });
    await page.goto('/?bots=3&seed=5#solo');
    await page.waitForFunction(() => (window as any).__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
    const PC = ['#hud-round', '#hud-players', '.hud-corner', '#hud-ammo', '#hud-power', '#help-toggle', '#hud-elev'];
    const r = await rects(page, PC);
    expect(Object.keys(r).sort()).toEqual([...PC].sort());
    for (const [k, a] of Object.entries(r)) expect(a.x >= 0 && a.y >= 0 && a.x + a.w <= w + 0.5 && a.y + a.h <= h + 0.5, `${k} dentro de la pantalla`).toBe(true);
    noCross(r);
    // Arriba: la píldora al centro, sin «Fase de apuntado»; los jugadores en columna a la izquierda.
    expect(Math.abs(r['#hud-round'].x + r['#hud-round'].w / 2 - w / 2)).toBeLessThan(2);
    await expect(page.locator('#hud-round')).toContainText(/Ronda 1\s*\d+/);
    const chips = await page.locator('#hud-players .hp').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    expect(chips.length).toBe(4);
    for (const c of chips) expect(Math.abs(c.x - chips[0].x), 'en columna').toBeLessThan(1);
    await expect(page.locator('.hp-short').first()).toBeVisible();
    await expect(page.locator('#hud-goal-chip')).toBeVisible();
    // Abajo: cartas de 92×92, barra de 300 px y la pista; sin el botón largo de disparo.
    for (const c of await page.locator('#hud-ammo .ammo').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))) {
      expect(c.width).toBeCloseTo(92, 0);
      expect(c.height).toBeCloseTo(92, 0);
    }
    expect((await page.locator('.power-bar').boundingBox())!.width).toBeCloseTo(300, 0);
    await expect(page.locator('#power-hint')).toHaveText('Mantén Espacio o clic para cargar');
    await expect(page.locator('#confirm')).toBeHidden();
    await expect(page.locator('#hud-elev .elev-deg')).toHaveText(/^\d+°$/);
    // Controles plegados en el chip; H los abre y los cierra.
    await expect(page.locator('#help-list')).toBeHidden();
    await page.keyboard.press('KeyH');
    await expect(page.locator('#help-list')).toBeVisible();
    await expect(page.locator('#help-toggle')).toHaveAttribute('aria-expanded', 'true');
    const open = await rects(page, ['#help-list', '#hud-players', '#hud-ammo', '#hud-power']);
    noCross(open);
    await page.keyboard.press('KeyH');
    await expect(page.locator('#help-list')).toBeHidden();
    // Al cargar, la barra se llena; al soltar, el disparo queda listo y la pista dice a quién se espera.
    // Se suelta con la barra por encima de la mitad: con el renderizado por software (CI) los
    // fotogramas van lentos y una carga corta se descarta por demasiado corta.
    await page.keyboard.down('Space');
    await expect(page.locator('#power-hint')).toHaveText('Suelta para disparar');
    await expect.poll(() => page.locator('.power-fill').evaluate((e) => e.getBoundingClientRect().width), { timeout: 15_000 }).toBeGreaterThan(150);
    await page.keyboard.up('Space');
    await expect(page.locator('#power-hint')).toContainText(/Disparo listo/);
  });
}
