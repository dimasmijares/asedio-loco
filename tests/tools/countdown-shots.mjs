// Capturas de la cuenta atrás antes de disparar y del principio del impacto (para revisar
// cómo se aleja la cámara):
//   node tests/tools/countdown-shots.mjs <base> <carpeta> [ronda]
import { chromium } from '@playwright/test';
const [base, out, round = '1'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
p.on('pageerror', (e) => console.log('pageerror', e.message));
await p.goto(`${base}/?bots=3&autoplay=1&seed=21&quality=high#solo`);
const phase = (ph) => p.waitForFunction(([ph, r]) => { const s = window.__asedio?.mode?.host?.state; return s && s.phase === ph && s.round >= r; }, [ph, Number(round)], { timeout: 180000 });
await phase('aim');
await p.waitForTimeout(600);
await p.screenshot({ path: `${out}/0-apuntado.png` });
await phase('countdown');
for (const [name, ms] of [['1-cuenta-0,2s', 200], ['2-cuenta-1,5s', 1300], ['3-cuenta-2,8s', 1300]]) {
  await p.waitForTimeout(ms);
  await p.screenshot({ path: `${out}/${name}.png` });
}
await phase('impact');
for (const [name, ms] of [['4-fuego-0,3s', 300], ['5-impacto-1,5s', 1200], ['6-impacto-3s', 1500]]) {
  await p.waitForTimeout(ms);
  await p.screenshot({ path: `${out}/${name}.png` });
}
await b.close();
