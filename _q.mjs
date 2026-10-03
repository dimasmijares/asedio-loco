import { chromium } from '@playwright/test';
const out = process.argv[2];
const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
for (const [n, vp, m] of [['movil', { width: 390, height: 844 }, true], ['pc', { width: 1280, height: 720 }, false]]) {
  const ctx = await b.newContext({ viewport: vp, hasTouch: m, isMobile: m });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:8787/?backdrop=1${m ? '&mobile=1' : ''}`);
  await p.click('#create');
  await p.waitForSelector('#room-code[data-code]');
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/sala-${n}.png` });
  await ctx.close();
}
await b.close();
