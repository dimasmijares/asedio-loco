// Dispara en el sandbox y hace capturas: node tests/tools/sandbox-shot.mjs <url> <prefijo> <municion> [yawOffset] [pitch] [power]
import { chromium } from '@playwright/test';
const [url, prefix, ammo = 'rock', yawOff = '0', pitch = '0.7', power = ''] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1100, height: 680 } })).newPage();
const logs = [];
p.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
p.on('console', (m) => m.type() === 'error' && logs.push(`[error] ${m.text()}`));
await p.goto(url);
await p.waitForFunction(() => window.__asedio?.mode, null, { timeout: 30000 });
await p.waitForTimeout(1500);
const info = await p.evaluate(([ammo, yawOff, pitch, power]) => {
  const m = window.__asedio.mode;
  const g = window.__asedio.game;
  const ids = ['rock','log','coconuts','cow','melon','chicken','piano','blackhole','magnet','snowball','scaffold','bubble'];
  m.selectAmmo(ids.indexOf(ammo));
  let a;
  if (['king', 'wall', 'tower'].includes(yawOff)) a = m.aimAt(yawOff, Number(pitch));
  else {
    a = { ...g.input.aim, yaw: g.input.aim.yaw + Number(yawOff), pitch: Number(pitch) };
    if (power) a.power = Number(power);
    g.input.setAim(a);
  }
  m.fire(a);
  return a;
}, [ammo, yawOff, pitch, power]);
for (const [i, t] of [[1, 1200], [2, 2200], [3, 4000], [4, 6000]]) {
  await p.waitForTimeout(t - (i > 1 ? [0, 1200, 2200, 4000][i - 1] : 0));
  await p.screenshot({ path: `${prefix}-${i}.png` });
}
const after = await p.evaluate(() => ({ blocks: window.__asedio.game.sim.blocksAlive(1), king: window.__asedio.game.sim.kings.get(1).alive }));
console.log(JSON.stringify({ aim: info, after }), logs.join('\n') || 'sin errores');
await b.close();
