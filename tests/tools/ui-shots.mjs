// Capturas de la interfaz en PC (1280×720) y en móvil vertical (390×844), con GPU: portada,
// «Jugar solo», apuntando y resultados de la ronda. Para revisar el estilo en el lienzo (R-10).
// Con «fase2», la partida en móvil vertical (R-10 fase 2): apuntando, manteniendo una carta,
// cargando, disparo listo y resultados, y apuntando en modo zurdo. La partida se congela en el
// apuntado de la ronda 1.
// Con «fase3», menús y PC (R-10 fase 3): portada y «Jugar solo» en móvil y PC, PC apuntando con la
// descripción de una carta al pasar el ratón y con los controles abiertos, y resultados en móvil.
// Uso: node tests/tools/ui-shots.mjs <base> <carpeta> [pc|movil|fase2|fase3]
import { chromium } from '@playwright/test';

const [base, out, only] = process.argv.slice(2);
if (!base || !out) {
  console.log('Uso: node tests/tools/ui-shots.mjs <base> <carpeta> [pc|movil|fase2|fase3]');
  process.exit(1);
}

if (only === 'fase2') {
  const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const hand of ['diestro', 'zurdo']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    if (hand === 'zurdo') await ctx.addInitScript(() => localStorage.setItem('asedio.settings', JSON.stringify({ leftHanded: true })));
    const p = await ctx.newPage();
    p.on('pageerror', (e) => console.log(hand, 'pageerror', e.message));
    const cdp = await ctx.newCDPSession(p);
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((q, id) => ({ x: q.x, y: q.y, id })) });
    const center = async (sel) => {
      const r = await p.locator(sel).boundingBox();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    };
    // Ronda 1, congelada en el apuntado para las capturas: nadie ha disparado.
    await p.goto(`${base}/?bots=3&seed=21&quality=high&tutorial=0&mobile=1#solo`);
    await p.waitForFunction(() => {
      const h = window.__asedio?.mode?.host;
      if (h?.state?.phase !== 'aim') return false;
      h._update = h.update;
      h.update = () => {};
      h.state.players.forEach((q) => (q.locked = false));
      h.state.remaining = 17;
      return true;
    }, null, { timeout: 60_000, polling: 'raf' });
    // Después del rótulo «RONDA 1» (2,6 s).
    await p.waitForTimeout(3300);
    await p.screenshot({ path: `${out}/${hand}-1-apuntando.png` });
    if (hand === 'zurdo') {
      await ctx.close();
      continue;
    }
    // Manteniendo la segunda carta: la tarjeta de descripción encima de la bandeja.
    const card = await center('#hud-ammo .ammo:nth-child(2)');
    await touch('touchStart', [card]);
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/${hand}-2-manteniendo-carta.png` });
    await touch('touchEnd', []);
    await p.waitForTimeout(300);
    // Cargando la fuerza.
    const fire = await center('#confirm');
    await touch('touchStart', [fire]);
    await p.waitForTimeout(950);
    await p.screenshot({ path: `${out}/${hand}-3-cargando.png` });
    await touch('touchEnd', []);
    await p.waitForTimeout(300);
    // Disparo listo, con un bot que aún no ha disparado.
    await p.evaluate(() => window.__asedio.mode.host.state.players.filter((q) => q.bot).forEach((q, i) => (q.locked = i !== 2)));
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${out}/${hand}-4-disparo-listo.png` });
    // Resultados: la partida sigue hasta la hoja de la ronda.
    await p.evaluate(() => {
      const h = window.__asedio.mode.host;
      h.update = h._update;
    });
    await p.waitForFunction(() => window.__asedio.mode.host.state.phase === 'results', null, { timeout: 90_000 });
    await p.evaluate(() => (window.__asedio.mode.host.update = () => {}));
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/${hand}-5-resultados.png` });
    await ctx.close();
  }
  await b.close();
  process.exit(0);
}

// Ronda 1 congelada en el apuntado. Con `wind`, un viento puesto a mano en la parábola y la física (el
// juego ya no tiene viento; sirve para ver que la marca y la parábola siguen coincidiendo).
const freezeAim = (p, wind = [0, 0, 0]) =>
  p.waitForFunction((wind) => {
    const h = window.__asedio?.mode?.host;
    if (h?.state?.phase !== 'aim') return false;
    h._update = h.update;
    h.update = () => {};
    h.state.players.forEach((q) => (q.locked = false));
    h.state.remaining = 17;
    h.state.wind = wind;
    if (window.__asedio.game.sim) window.__asedio.game.sim.wind = wind;
    return true;
  }, wind, { timeout: 60_000, polling: 'raf' });

if (only === 'fase3') {
  const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
  for (const [name, ctxOpts] of [
    ['movil', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
    ['pc', { viewport: { width: 1280, height: 720 } }],
  ]) {
    const ctx = await b.newContext(ctxOpts);
    // Un nombre fijo, para que las capturas no cambien de una vez a otra.
    await ctx.addInitScript(() => localStorage.setItem('asedio.name', 'Duque Pepino'));
    const p = await ctx.newPage();
    p.on('pageerror', (e) => console.log(name, 'pageerror', e.message));
    await p.goto(`${base}/?backdrop=1`);
    await p.waitForTimeout(3500);
    await p.screenshot({ path: `${out}/${name}-1-portada.png` });
    await p.click('#solo');
    await p.waitForSelector('#solo-setup');
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${out}/${name}-2-jugar-solo.png` });
    await p.goto(`${base}/?bots=3&seed=21&quality=high&tutorial=0${name === 'movil' ? '&mobile=1' : ''}#solo`);
    await freezeAim(p);
    await p.waitForTimeout(3300);
    if (name === 'pc') {
      // El ratón sobre la primera carta: su descripción encima.
      const c = await p.locator('#hud-ammo .ammo').first().boundingBox();
      await p.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${out}/pc-3-apuntando-descripcion.png` });
      await p.mouse.move(900, 300);
      await p.keyboard.press('KeyH');
      await p.waitForTimeout(400);
      await p.screenshot({ path: `${out}/pc-4-apuntando-controles.png` });
    } else {
      // Resultados de la ronda: la partida sigue hasta la hoja.
      await p.evaluate(() => {
        const h = window.__asedio.mode.host;
        h.update = h._update;
      });
      await p.waitForFunction(() => window.__asedio.mode.host.state.phase === 'results', null, { timeout: 90_000 });
      await p.evaluate(() => (window.__asedio.mode.host.update = () => {}));
      await p.waitForTimeout(900);
      await p.screenshot({ path: `${out}/movil-3-resultados.png` });
    }
    await ctx.close();
  }
  await b.close();
  process.exit(0);
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
