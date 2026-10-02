// Capturas de la interfaz en PC (1280×720) y en móvil vertical (390×844), con GPU: portada,
// «Jugar solo», apuntando y resultados de la ronda. Para revisar el estilo en el lienzo (R-10).
// Uso: node tests/tools/ui-shots.mjs <base> <carpeta> [pc|movil]
import { chromium } from '@playwright/test';

const [base, out, only] = process.argv.slice(2);
if (!base || !out) {
  console.log('Uso: node tests/tools/ui-shots.mjs <base> <carpeta> [pc|movil]');
  process.exit(1);
}

const FORMATS = {
  pc: { viewport: { width: 1280, height: 720 }, query: '' },
  movil: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, query: '&mobile=1' },
};

const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const [name, f] of Object.entries(FORMATS)) {
  if (only && only !== name) continue;
  const { query, ...ctx } = f;
  const p = await (await b.newContext(ctx)).newPage();
  p.on('pageerror', (e) => console.log(name, 'pageerror', e.message));
  const phase = (ph, timeout = 60_000) => p.waitForFunction((x) => window.__asedio?.mode?.host?.state?.phase === x, ph, { timeout });

  await p.goto(`${base}/?backdrop=1${query}`);
  await p.waitForTimeout(3500);
  await p.screenshot({ path: `${out}/${name}-1-portada.png` });

  await p.click('#solo');
  await p.waitForSelector('#solo-setup');
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/${name}-2-jugar-solo.png` });

  await p.goto(`${base}/?bots=3&seed=21&quality=high&tutorial=0${query}#solo`);
  await phase('aim');
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/${name}-3-apuntando.png` });

  // Carga y dispara con el botón de disparo (mantener y soltar).
  const r = await p.locator('#confirm').boundingBox();
  if (r) {
    await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await p.mouse.down();
    await p.waitForTimeout(900);
    await p.mouse.up();
  }
  await phase('results', 60_000);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${out}/${name}-4-resultados.png` });
  await p.close();
}
await b.close();
