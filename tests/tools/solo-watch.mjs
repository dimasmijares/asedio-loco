import { chromium } from '@playwright/test';
const [url, outDir, maxS = '240'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 960, height: 600 } })).newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto(url);
await p.waitForFunction(() => window.__asedio?.mode?.host);
const t0 = Date.now();
let last = '';
let shot = 0;
while (Date.now() - t0 < Number(maxS) * 1000) {
  await p.waitForTimeout(1500);
  const s = await p.evaluate(() => { const st = window.__asedio.mode.host.state; return { r: st.round, ph: st.phase, alive: st.players.map(q => q.alive ? q.blocks : 'X').join(','), w: st.winner, lava: st.lavaY, fps: window.__asedio.game.fps }; });
  const line = JSON.stringify(s);
  if (line !== last) console.log(((Date.now() - t0) / 1000).toFixed(0) + 's', line);
  last = line;
  if (s.ph !== 'intro' && shot < 6 && Math.random() < 0.3) await p.screenshot({ path: `${outDir}/solo-${shot++}.png` });
  if (s.ph === 'over') { await p.waitForTimeout(1500); await p.screenshot({ path: `${outDir}/solo-over.png` }); break; }
}
console.log(errs.slice(0, 10).join('\n') || 'sin errores');
await b.close();
