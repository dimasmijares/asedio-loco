import { expect, test } from '@playwright/test';
import { writeFileSync } from 'node:fs';

// Sección 5.8: rendimiento en la escena más cargada (4 castillos enteros + 12 proyectiles
// cruzados). En CI se renderiza por software (SwiftShader), así que los fps no son
// representativos; lo que se exige aquí es que la física quepa en el presupuesto.
// Las cifras con GPU real están en CLAUDE.md (node tests/tools/bench.mjs).
test('rendimiento: escena más cargada', async ({ page }, info) => {
  test.setTimeout(180_000);
  await page.goto('/?quality=medium#bench');
  await page.waitForFunction(() => (window as any).__asedio?.bench?.phase === 'done', null, { timeout: 150_000 });
  const r = await page.evaluate(() => (window as any).__asedio.bench.result);
  console.log('rendimiento', JSON.stringify(r));
  writeFileSync(info.outputPath('rendimiento.json'), JSON.stringify(r, null, 2));
  await page.screenshot({ path: info.outputPath('bench.png') });
  expect(r.maxAwakeBodies).toBeGreaterThan(200);
  // Un paso de física (1/60 s) tiene que costar bastante menos de 16 ms incluso sin GPU.
  expect(r.stepMsAvg).toBeLessThan(10);
});
