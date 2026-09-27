// Mide el rendimiento de la escena más cargada:
//   node tests/tools/bench.mjs <base> [calidad] [gpu|swiftshader] [cpu=N] [movil]
// cpu=N frena la CPU N veces (CDP), para aproximar un móvil. `movil` usa un viewport vertical de
// 390×844 con ?mobile=1 (perfil móvil de WRK-TASK-008).
import { chromium } from '@playwright/test';
const [base, quality = 'medium', mode = 'gpu', ...rest] = process.argv.slice(2);
const cpu = Number(rest.find((a) => a.startsWith('cpu='))?.slice(4) ?? 1);
const mobile = rest.includes('movil');
const args = mode === 'gpu' ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const b = await chromium.launch({ args });
const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1280, height: 720 } });
const p = await ctx.newPage();
if (cpu > 1) await (await ctx.newCDPSession(p)).send('Emulation.setCPUThrottlingRate', { rate: cpu });
await p.goto(`${base}/?quality=${quality}${mobile ? '&mobile=1' : ''}#bench`);
await p.waitForFunction(() => window.__asedio?.bench?.phase === 'done', null, { timeout: 600000 });
console.log(JSON.stringify(await p.evaluate(() => ({ ...window.__asedio.bench.result, worst: window.__asedio.game.worstSim, pixelRatio: window.__asedio.game.stage.renderer.getPixelRatio() }))));
await b.close();
