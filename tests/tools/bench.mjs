// Mide el rendimiento de la escena más cargada: node tests/tools/bench.mjs <base> [calidad] [gpu|swiftshader]
import { chromium } from '@playwright/test';
const [base, quality = 'medium', mode = 'gpu'] = process.argv.slice(2);
const args = mode === 'gpu' ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const b = await chromium.launch({ args });
const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
await p.goto(`${base}/?quality=${quality}#bench`);
await p.waitForFunction(() => window.__asedio?.bench?.phase === 'done', null, { timeout: 180000 });
console.log(JSON.stringify(await p.evaluate(() => ({ ...window.__asedio.bench.result, worst: window.__asedio.game.worstSim }))));
await b.close();
