import { expect, test } from '@playwright/test';
import { watchErrors, canvasNotBlack } from './helpers';

// Sección 5.7: escenas de física con capturas antes y después del impacto.
const SCENES = [
  { name: 'ccd', what: 'un pedrusco a 140 m/s no atraviesa un muro de 8 cm (CCD)' },
  { name: 'tower', what: 'una torre sin base se derrumba' },
  { name: 'glass', what: 'con el mismo impacto, el cristal se rompe y la piedra no' },
  { name: 'fragments', what: 'un bloque roto genera fragmentos que luego se retiran' },
];

for (const sc of SCENES) {
  test(`física: ${sc.what}`, async ({ page }, info) => {
    test.setTimeout(90_000);
    const errors = watchErrors(page);
    await page.goto(`/#physics=${sc.name}`);
    await page.waitForFunction(() => (window as any).__asedio?.physics?.phase === 'ready', null, { timeout: 30_000 });
    await page.waitForTimeout(800);
    await canvasNotBlack(page);
    await page.screenshot({ path: info.outputPath(`${sc.name}-1-antes.png`) });
    await page.evaluate(() => (window as any).__asedio.physics.run());
    await page.waitForTimeout(sc.name === 'tower' ? 1200 : 450);
    await page.screenshot({ path: info.outputPath(`${sc.name}-2-impacto.png`) });
    await page.waitForFunction(() => (window as any).__asedio.physics.phase === 'done', null, { timeout: 60_000 });
    await page.screenshot({ path: info.outputPath(`${sc.name}-3-despues.png`) });
    const result = await page.evaluate(() => (window as any).__asedio.physics.result);
    console.log(sc.name, JSON.stringify(result));
    expect(result.ok, JSON.stringify(result.detail)).toBe(true);
    expect(errors).toEqual([]);
  });
}
