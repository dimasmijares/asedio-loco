// Capturas de las correcciones del flujo (R-15 y nombres, espectador) en móvil vertical (390×844) y PC
// (1280×720), con GPU, para el tablero «Correcciones de flujo · en el juego» del lienzo: la sala con
// «Marquesa Tortilla», la pantalla final del anfitrión, del invitado y en solitario, y el espectador
// en «Todos» y mirando un castillo.
// Uso: node tests/tools/correcciones-shots.mjs <base> <carpeta> [movil|pc]
import { chromium } from '@playwright/test';

const [base, out, only] = process.argv.slice(2);
if (!base || !out) {
  console.log('Uso: node tests/tools/correcciones-shots.mjs <base> <carpeta> [movil|pc]');
  process.exit(1);
}

const FORMATS = [
  ['movil', { width: 390, height: 844 }, true],
  ['pc', { width: 1280, height: 720 }, false],
].filter(([n]) => !only || n === only);

const b = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });

for (const [fmt, vp, mobile] of FORMATS) {
  const q = (extra = '') => `${base}/?quality=high&tutorial=0${mobile ? '&mobile=1' : ''}${extra}`;
  const device = async (name) => {
    const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
    await ctx.addInitScript((n) => localStorage.setItem('asedio.name', n), name);
    const p = await ctx.newPage();
    p.on('pageerror', (e) => console.log(fmt, name, 'pageerror', e.message));
    return p;
  };
  const shot = async (p, name, wait = 600) => {
    await p.waitForTimeout(wait);
    await p.screenshot({ path: `${out}/${fmt}-${name}.png` });
    console.log(fmt, name);
  };
  const phase = (p) => p.evaluate(() => window.__asedio?.mode?.state?.phase);
  const waitPhase = async (p, ph) => {
    for (let i = 0; i < 240 && (await phase(p)) !== ph; i++) await p.waitForTimeout(250);
  };
  // Estadísticas puestas a mano para que salgan todas, y una partida de 3 rondas en la que el
  // anfitrión (hueco 0) gana: el hueco 1 cayó en la 2 y el resto en la 3.
  const finish = (h) => {
    const s = h.state;
    s.round = 3;
    s.players[0].stats.dealt = 41;
    s.players[0].stats.bestShot = 19;
    s.players[1].stats.whiffs = 2;
    s.players[1].stats.worstMiss = 12;
    s.players[s.players.length - 1].stats.goals = 1;
    s.players.forEach((p, i) => {
      if (!i) return;
      p.alive = false;
      p.eliminatedRound = i === 1 ? 2 : 3;
      p.blocks = Math.min(p.blocks, 90 + i * 20);
    });
    h.endNow();
  };

  // ---------- Sala con «Marquesa Tortilla» y final en red ----------
  const a = await device('Duque Pepino');
  const g = await device('Marquesa Tortilla');
  await a.goto(q('&backdrop=1'));
  await a.click('#create');
  await a.waitForSelector('#room-code[data-code]');
  const code = await a.getAttribute('#room-code', 'data-code');
  await g.goto(`${q('&backdrop=1')}#${code}`);
  await g.click('#join');
  await a.waitForFunction(() => document.querySelectorAll('#player-list li[data-player]').length === 2);
  await a.click('#seat-add-3');
  await g.waitForSelector('#bot-difficulty-text');
  await shot(g, '01-sala-marquesa-tortilla', 2500);
  await a.click('#start');
  await waitPhase(a, 'aim');
  await waitPhase(g, 'aim');
  await a.evaluate(`(${finish})(window.__asedio.mode.netHost.host)`);
  await a.waitForSelector('#game-over');
  await g.waitForSelector('#game-over');
  await shot(a, '02-final-anfitrion', 3200);
  await shot(g, '03-final-invitado', 100);
  for (const p of [a, g]) await p.context().close();

  // ---------- Final en solitario ----------
  const s = await device('Duque Pepino');
  await s.goto(`${q('&bots=3&seed=21')}#solo`);
  await s.waitForFunction(() => window.__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 90_000 });
  await s.evaluate(`(${finish})(window.__asedio.mode.host)`);
  await s.waitForSelector('#game-over');
  await shot(s, '04-final-en-solitario', 3200);
  await s.context().close();

  // ---------- Espectador: «Todos» y mirando un castillo, con la chincheta del objetivo ----------
  const e = await device('Duque Pepino');
  await e.goto(`${q('&bots=3&seed=5&fast=1')}#solo`);
  await e.waitForFunction(() => window.__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 90_000 });
  await e.evaluate(() => {
    const m = window.__asedio.mode;
    m.host.sim.kingGuard = false;
    m.host.sim.killKing(m.ui.src.you, 'fell');
  });
  await e.waitForFunction(
    () => {
      const h = window.__asedio.mode.host;
      const ok = h.state.round >= 2 && h.state.phase === 'aim';
      if (ok) {
        h.update = () => {};
        h.state.remaining = 14;
        h.state.goal ||= 'tower';
      }
      return ok;
    },
    null,
    { timeout: 200_000, polling: 'raf' },
  );
  await e.waitForSelector('#fall-sheet');
  await e.click('#fall-watch');
  await shot(e, '05-espectador-todos', 2500);
  const slot = await e.evaluate(() => window.__asedio.mode.host.state.players.find((p) => p.alive && p.slot !== window.__asedio.mode.ui.src.you).slot);
  await e.click(`#spect-cards [data-slot="${slot}"]`);
  await shot(e, '06-espectador-castillo', 2500);
  await e.context().close();
}

await b.close();
