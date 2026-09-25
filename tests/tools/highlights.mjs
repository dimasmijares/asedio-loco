// Capturas destacadas de una partida real contra bots: node tests/tools/highlights.mjs <base> <carpeta>
import { chromium } from '@playwright/test';
const [base, out] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })).newPage();
await p.goto(`${base}/?backdrop=1`);
await p.waitForTimeout(3500);
await p.screenshot({ path: `${out}/portada.png` });
await p.goto(`${base}/?bots=3&autoplay=1&seed=21&quality=high#solo`);
await p.waitForFunction(() => window.__asedio?.mode?.host);
let bestFx = 0;
let kingShot = false;
const t0 = Date.now();
let lastAlive = 4;
while (Date.now() - t0 < 240000) {
  await p.waitForTimeout(350);
  const s = await p.evaluate(() => { const m = window.__asedio.mode; const g = window.__asedio.game; return { ph: m.host.state.phase, r: m.host.state.round, fx: g.view.fx.count + g.view.debris.count * 2, alive: m.host.state.players.filter((q) => q.alive).length }; });
  if (s.ph === 'impact' && s.fx > bestFx) {
    bestFx = s.fx;
    await p.screenshot({ path: `${out}/impacto.png` });
  }
  if (s.alive < lastAlive && !kingShot) {
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${out}/rey-eliminado.png` });
    kingShot = true;
  }
  lastAlive = s.alive;
  if (s.ph === 'over') {
    await p.waitForTimeout(2000);
    await p.screenshot({ path: `${out}/final.png` });
    break;
  }
}
console.log('mejor impacto', bestFx, 'rey', kingShot);
await b.close();
