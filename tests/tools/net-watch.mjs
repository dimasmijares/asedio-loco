// Partida en red de prueba: node tests/tools/net-watch.mjs <base> <n humanos> <bots> [segundos]
import { chromium } from '@playwright/test';
const [base, nH = '2', nB = '2', maxS = '300'] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pages = [];
const errs = [];
for (let i = 0; i < Number(nH); i++) {
  const p = await (await b.newContext({ viewport: { width: 480, height: 300 } })).newPage();
  p.on('pageerror', (e) => errs.push(`[${i}] ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && errs.push(`[${i}] ${m.text()}`));
  pages.push(p);
}
const [host, ...guests] = pages;
await host.goto(`${base}/?fast=1&bots=${nB}&autoplay=1`);
await host.fill('#name', 'Anfitrión');
await host.click('#create');
await host.waitForSelector('#room-link');
const link = await host.inputValue('#room-link');
const url = new URL(link);
for (const [i, g] of guests.entries()) {
  await g.goto(`${base}/?autoplay=1${url.hash}`);
  await g.fill('#name', `Invitado${i + 1}`);
  await g.click('#join');
}
await host.waitForFunction((n) => document.querySelectorAll('#player-list li[data-player]').length === n, pages.length);
await host.waitForTimeout(500);
await host.click('#start');
const t0 = Date.now();
const snap = (p) => p.evaluate(() => { const m = window.__asedio?.mode; if (!m) return null; const s = m.state; const v = window.__asedio.game.view; return { role: m.role, r: s.round, ph: s.phase, alive: s.players.map((q) => (q.alive ? 'V' : 'X')).join(''), blocks: v.blockCount(), w: s.winner }; });
let last = '';
while (Date.now() - t0 < Number(maxS) * 1000) {
  await host.waitForTimeout(2000);
  const all = await Promise.all(pages.map(snap));
  const line = all.map((s) => (s ? `${s.role[0]} r${s.r} ${s.ph} ${s.alive} b${s.blocks}` : '-')).join(' | ');
  if (line !== last) console.log(((Date.now() - t0) / 1000).toFixed(0).padStart(3) + 's ' + line);
  last = line;
  if (all.every((s) => s?.ph === 'over')) break;
}
console.log(errs.slice(0, 15).join('\n') || 'sin errores');
await b.close();
