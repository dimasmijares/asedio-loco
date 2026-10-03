// Capturas del flujo de partidas, la sala y el espectador (R-07, R-11, R-13 y R-14) en móvil vertical
// (390×844) y PC (1280×720), con GPU, para el tablero «R-07, R-11, R-13 y R-14 · en el juego» del
// lienzo: la sala del anfitrión y del invitado con y sin bots, el nombre en la sala, las
// confirmaciones de salida, la pantalla final en red (revancha) y en solitario, llegar tarde, el aviso
// de eliminado, el espectador y apuntando con la chincheta del objetivo.
// Uso: node tests/tools/flujo-shots.mjs <base> <carpeta> [movil|pc]
import { chromium } from '@playwright/test';

const [base, out, only] = process.argv.slice(2);
if (!base || !out) {
  console.log('Uso: node tests/tools/flujo-shots.mjs <base> <carpeta> [movil|pc]');
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
    await ctx.addInitScript((n) => {
      localStorage.setItem('asedio.name', n);
    }, name);
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

  // ---------- Sala (R-11) ----------
  const a = await device('Duque Pepino');
  const g = await device('Marquesa Tortilla');
  await a.goto(q('&backdrop=1'));
  await a.click('#create');
  await a.waitForSelector('#room-code[data-code]');
  const code = await a.getAttribute('#room-code', 'data-code');
  await g.goto(`${q('&backdrop=1')}#${code}`);
  await g.click('#join');
  await a.waitForFunction(() => document.querySelectorAll('#player-list li[data-player]').length === 2);
  await shot(a, '01-sala-anfitrion-sin-bots', 2500);
  await shot(g, '02-sala-invitado-sin-bots', 300);
  await a.click('#seat-add-3');
  await g.waitForSelector('#bot-difficulty-text');
  await shot(a, '03-sala-anfitrion-con-bots');
  await shot(g, '04-sala-invitado-con-bots', 200);
  await g.click('#room-name-edit');
  await shot(g, '05-sala-cambiando-el-nombre', 300);
  await g.press('#room-name', 'Escape');
  await a.click('#leave-room');
  await shot(a, '06-salir-de-la-sala', 400);
  await a.click('#leave-room-stay');

  // ---------- Partida en red: salir, llegar tarde y revancha (R-07) ----------
  await a.click('#start');
  await waitPhase(a, 'aim');
  await waitPhase(g, 'aim');
  // Sin congelar al anfitrión (quien llega tarde tiene que recibir la partida): un apuntado largo.
  await a.evaluate(() => (window.__asedio.mode.netHost.host.state.remaining = 90));
  await g.click('#hud-settings');
  await g.click('#settings-exit');
  await shot(g, '07-salir-de-la-partida', 400);
  await g.click('#leave-game-stay');
  const late = await device('Barón Croqueta');
  await late.goto(`${q()}#${code}`);
  await late.click('#join');
  await late.waitForSelector('#late-sheet');
  await shot(late, '08-llegar-tarde', 2500);
  await late.click('#late-watch');
  await shot(late, '09-llegar-tarde-mirando', 800);
  await a.evaluate(() => {
    const h = window.__asedio.mode.netHost.host;
    const s = h.state;
    s.players[0].stats.dealt = 41;
    s.players[0].stats.bestShot = 19;
    s.players[1].stats.whiffs = 2;
    s.players[1].stats.worstMiss = 12;
    s.players[2].stats.goals = 1;
    h.endNow();
  });
  await a.waitForSelector('#game-over');
  await g.waitForSelector('#game-over');
  await shot(a, '10-final-en-red-anfitrion', 1800);
  await shot(g, '11-final-en-red-invitado', 100);
  for (const p of [a, g, late]) await p.context().close();

  // ---------- Solitario: apuntando con la chincheta (R-14) y final ----------
  const s = await device('Duque Pepino');
  await s.goto(`${q('&bots=3&seed=21')}#solo`);
  await s.waitForFunction(() => {
    const h = window.__asedio?.mode?.host;
    if (h?.state?.phase !== 'aim') return false;
    h._update = h.update;
    h.update = () => {};
    h.state.players.forEach((p) => (p.locked = false));
    h.state.remaining = 17;
    h.state.goal ||= 'tower';
    return true;
  }, null, { timeout: 60_000, polling: 'raf' });
  await shot(s, '12-apuntando-chincheta', 3300);
  await s.evaluate(() => {
    const h = window.__asedio.mode.host;
    h.update = h._update;
    const st = h.state;
    st.players[1].stats.dealt = 37;
    st.players[1].stats.bestShot = 21;
    st.players[2].stats.whiffs = 2;
    st.players[2].stats.worstMiss = 14;
    st.players[0].stats.selfHits = 3;
    st.players[3].stats.goals = 1;
    h.endNow();
  });
  await s.waitForSelector('#game-over');
  await shot(s, '13-final-en-solitario', 1800);
  await s.context().close();

  // ---------- Eliminado y espectador (R-13) ----------
  const e = await device('Duque Pepino');
  await e.goto(`${q('&bots=3&seed=5&fast=1')}#solo`);
  await e.waitForFunction(() => window.__asedio?.mode?.host?.state?.phase === 'aim', null, { timeout: 60_000 });
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
      }
      return ok;
    },
    null,
    { timeout: 200_000, polling: 'raf' },
  );
  await e.waitForSelector('#fall-sheet');
  await shot(e, '14-tu-rey-ha-caido', 2800);
  await e.click('#fall-watch');
  const slot = await e.evaluate(() => window.__asedio.mode.host.state.players.find((p) => p.alive && p.slot !== window.__asedio.mode.ui.src.you).slot);
  await e.click(`#spect-cards [data-slot="${slot}"]`);
  await shot(e, '15-espectador', 2200);
  await e.context().close();
}

await b.close();
