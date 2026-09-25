// Capturas de la repetición de un rey caído en una partida contra bots:
//   node tests/tools/replay-shots.mjs <base> <carpeta>
import { chromium } from '@playwright/test';
const [base, out] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
p.on('pageerror', (e) => console.log('pageerror', e.message));
p.on('console', (m) => m.type() === 'error' && console.log('error', m.text()));
await p.goto(`${base}/?bots=3&autoplay=1&seed=21&quality=high&fast=1#solo`);
await p.waitForFunction(() => window.__asedio?.mode?.host?.state?.phase === 'replay', null, { timeout: 240000 });
const info = await p.evaluate(() => ({ round: window.__asedio.mode.host.state.round, replay: window.__asedio.mode.host.state.replay, replaying: !!window.__asedio.game.view.replaying }));
console.log('repetición', JSON.stringify(info));
for (const [i, ms] of [[1, 250], [2, 500], [3, 500]]) {
  await p.waitForTimeout(ms);
  await p.screenshot({ path: `${out}/repeticion-${i}.png` });
}
await p.waitForFunction(() => window.__asedio.mode.host.state.phase !== 'replay', null, { timeout: 30000 });
await p.waitForTimeout(400);
console.log('después', JSON.stringify(await p.evaluate(() => ({ phase: window.__asedio.mode.host.state.phase, replaying: !!window.__asedio.game.view.replaying, blocks: window.__asedio.game.view.blockCount(), sim: window.__asedio.game.sim.recs.size }))));
await p.screenshot({ path: `${out}/repeticion-despues.png` });
await b.close();
