// Captura rápida para revisar a ojo: node tests/tools/shot.mjs <url> <salida.png> [espera_ms] [js a evaluar]
import { chromium } from '@playwright/test';
const [url, out, wait = '3000', js] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 1100, height: 680 } })).newPage();
const logs = [];
p.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && logs.push(`[${m.type()}] ${m.text()}`));
p.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await p.goto(url);
await p.waitForTimeout(Number(wait));
if (js) console.log('eval:', JSON.stringify(await p.evaluate(js)));
await p.screenshot({ path: out });
console.log(logs.slice(0, 20).join('\n') || 'sin errores');
await b.close();
