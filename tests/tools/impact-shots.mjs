// Capturas de la fase de impacto de una partida contra bots (para revisar la cámara):
//   node tests/tools/impact-shots.mjs <base> <carpeta> [ronda]
import { chromium } from '@playwright/test';
const [base, out, round = '1'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
p.on('pageerror', (e) => console.log('pageerror', e.message));
await p.goto(`${base}/?bots=3&autoplay=1&seed=21&quality=high#solo`);
await p.waitForFunction((r) => { const s = window.__asedio?.mode?.host?.state; return s && s.phase === 'impact' && s.round >= r; }, Number(round), { timeout: 180000 });
for (const [i, ms] of [[1, 800], [2, 1200], [3, 1500], [4, 2500]]) {
  await p.waitForTimeout(ms);
  await p.screenshot({ path: `${out}/impacto-${i}.png` });
}
await b.close();
