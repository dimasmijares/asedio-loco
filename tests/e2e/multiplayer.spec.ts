import { expect, test, type Browser, type Page } from '@playwright/test';
import { canvasNotBlack, watchErrors } from './helpers';

// Secciones 5.2-5.6: partida completa con 4 clientes, consistencia entre clientes,
// espectador, reconexión y anfitrión caído.

type Summary = {
  role: string;
  you: number | null;
  spectator: boolean;
  round: number;
  phase: string;
  winner: number | null;
  blocks: number;
  perSlot: Record<string, number>;
  kings: Record<string, [number, number, number]>;
  alive: number[];
  migrations: number;
  replays: number;
  fulls: number;
};

const VIEW = { width: 420, height: 270 };
// Los clientes que no hace falta ver dibujan 1 fotograma por segundo: con 4 navegadores
// renderizando por software en el runner de CI, el dibujo dejaba sin CPU a la física.
const SLOW = '&render=1';

async function newPlayer(browser: Browser, errors: string[], tag: string) {
  const ctx = await browser.newContext({ viewport: VIEW });
  const page = await ctx.newPage();
  const errs = watchErrors(page);
  page.on('close', () => errors.push(...errs.map((e) => `[${tag}] ${e}`)));
  (page as Page & { errs?: string[] }).errs = errs;
  return page;
}

const summary = (p: Page) => p.evaluate(() => (window as any).__asedio?.mode?.summary?.() ?? null) as Promise<Summary | null>;

async function createRoom(host: Page, extra = '') {
  await host.goto(`/?fast=1&autoplay=1${SLOW}${extra}`);
  await host.fill('#name', 'Anfitrión');
  await host.click('#create');
  await expect(host.locator('#room-link')).toBeVisible();
  return new URL(await host.inputValue('#room-link')).hash;
}

async function join(p: Page, hash: string, name: string, extra = '') {
  await p.goto(`/?autoplay=1${extra}${hash}`);
  await p.fill('#name', name);
  await p.click('#join');
}

async function waitAll(pages: Page[], pred: (s: Summary) => boolean, timeout = 120_000) {
  const t0 = Date.now();
  let lastLog = t0;
  let all: (Summary | null)[] = [];
  while (Date.now() - t0 < timeout) {
    all = await Promise.all(pages.map(summary));
    if (all.every((s) => s && pred(s))) return all as Summary[];
    // Rastro para diagnosticar en CI dónde se queda cada cliente.
    if (Date.now() - lastLog > 20_000) {
      lastLog = Date.now();
      console.log(`  esperando (${Math.round((Date.now() - t0) / 1000)} s): ` + all.map((s) => (s ? `${s.role} r${s.round} ${s.phase} vivos[${s.alive}]` : '-')).join(' | '));
    }
    await pages[0].waitForTimeout(400);
  }
  throw new Error(`tiempo agotado esperando a los clientes: ${JSON.stringify(all.map((s) => s && { role: s.role, round: s.round, phase: s.phase, alive: s.alive }))}`);
}

// ¿Coincide la vista de un cliente con la del anfitrión? (sin fallar, para ir sondeando)
function agrees(host: Summary, other: Summary) {
  if (other.round !== host.round || Math.abs(other.blocks - host.blocks) > 2) return false;
  return Object.entries(host.kings).every(([slot, k]) => {
    const o = other.kings[slot];
    return !!o && Math.hypot(o[0] - k[0], o[1] - k[1], o[2] - k[2]) < 0.3;
  });
}

// Resultados de una ronda vistos por todos. Algo puede seguir moviéndose al empezar la fase
// (un rey que aún rueda) y un cliente con retraso lo ve más tarde, así que se exige que las
// vistas converjan: se sondea hasta `ms` y se devuelve la primera instantánea en la que
// todos coinciden (o la última, para que compare() diga qué falla). null si la fase acaba antes.
async function settledResults(pages: Page[], ms: number) {
  let last: Summary[] | null = null;
  for (const t1 = Date.now(); Date.now() - t1 < ms; await pages[0].waitForTimeout(250)) {
    const all = (await Promise.all(pages.map(summary))) as Summary[];
    if (!all.every((s) => s?.phase === 'results' && s.round === all[0].round)) {
      if (last) break;
      continue;
    }
    last = all;
    if (all.slice(1).every((o) => agrees(all[0], o))) break;
  }
  return last;
}

// Compara la vista de cada cliente con la del anfitrión en la fase de resultados.
function compare(host: Summary, other: Summary, label: string) {
  expect(other.round, `${label}: ronda`).toBe(host.round);
  expect(Math.abs(other.blocks - host.blocks), `${label}: bloques en pie (${other.blocks} vs ${host.blocks})`).toBeLessThanOrEqual(2);
  for (const [slot, k] of Object.entries(host.kings)) {
    const o = other.kings[slot];
    expect(o, `${label}: rey ${slot} vivo en ambos`).toBeTruthy();
    const d = Math.hypot(o[0] - k[0], o[1] - k[1], o[2] - k[2]);
    expect(d, `${label}: posición del rey ${slot}`).toBeLessThan(0.3);
  }
}

test('4 jugadores hasta el final: consistencia, espectador y reconexión', async ({ browser }, info) => {
  test.setTimeout(600_000);
  const errors: string[] = [];
  const host = await newPlayer(browser, errors, 'anfitrión');
  const guests = [await newPlayer(browser, errors, 'j2'), await newPlayer(browser, errors, 'j3'), await newPlayer(browser, errors, 'j4')];
  const hash = await createRoom(host);
  // Solo el primer invitado dibuja a ritmo normal: es el que se captura y se revisa.
  for (const [i, g] of guests.entries()) await join(g, hash, `Jugador${i + 2}`, i === 0 ? '' : SLOW);
  await expect(host.locator('#player-list li[data-player]')).toHaveCount(4);
  await host.click('#start');
  const players = [host, ...guests];
  // La fase de apuntado de la ronda 1 puede durar menos de un segundo (los bots confirman
  // enseguida), así que basta con que la partida haya empezado en todos.
  let all = await waitAll(players, (s) => s.round >= 1);
  expect(all[0].role).toBe('host');
  expect(all.slice(1).every((s) => s.role === 'client')).toBe(true);
  expect(new Set(all.map((s) => s.you)).size).toBe(4);
  await canvasNotBlack(guests[0]);
  await guests[0].screenshot({ path: info.outputPath('cliente-apuntando.png') });

  // Consistencia al final de cada ronda.
  const checked = new Set<number>();
  let spectator: Page | null = null;
  let reconnected = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 480_000) {
    all = (await Promise.all(players.map(summary))) as Summary[];
    const h = all[0];
    if (h.phase === 'over') break;
    if (h.phase === 'results' && !checked.has(h.round)) {
      const again = await settledResults(players, 4000);
      if (again) {
        for (let i = 1; i < again.length; i++) compare(again[0], again[i], `ronda ${again[0].round}, jugador ${i + 1}`);
        checked.add(again[0].round);
        console.log(`ronda ${again[0].round}: consistente (${again[0].blocks} bloques, reyes ${again[0].alive.join(',')})`);
      }
    }
    // Espectador a mitad de partida (ronda 2).
    if (!spectator && h.round >= 2 && h.phase === 'aim') {
      spectator = await newPlayer(browser, errors, 'espectador');
      await spectator.goto(`/?render=1${hash}`);
      await spectator.fill('#name', 'Mirón');
      await spectator.click('#join');
      const [sv] = await waitAll([spectator], (s) => s.fulls > 0);
      expect(sv.spectator).toBe(true);
      expect(sv.you).toBeNull();
      const hv = (await summary(host))!;
      expect(Math.abs(sv.round - hv.round)).toBeLessThanOrEqual(1);
      expect(Math.abs(sv.blocks - hv.blocks)).toBeLessThanOrEqual(10);
      await expect(spectator.locator('#confirm')).toBeHidden();
      // Si intenta disparar, el servidor lo rechaza.
      await spectator.evaluate(() => (window as any).__asedio.conn.relay('host', { k: 'in', lk: true }));
      await expect.poll(() => spectator!.evaluate(() => (window as any).__asedio.conn.lastError)).toContain('espectadores');
      await spectator.screenshot({ path: info.outputPath('espectador.png') });
      console.log('espectador: ve la ronda', sv.round, 'y no puede disparar');
    }
    // Reconexión: un jugador recarga la página y recupera su castillo.
    if (spectator && !reconnected && h.round >= 2 && h.phase === 'aim') {
      const g = guests[1];
      const before = (await summary(g))!;
      await g.reload();
      const [after] = await waitAll([g], (s) => s.fulls > 0);
      expect(after.you).toBe(before.you);
      expect(after.spectator).toBe(false);
      // Se compara con el anfitrión en un momento quieto (apuntado o resultados de la misma
      // ronda): en plena fase de impacto los bloques siguen cayendo y las cuentas bailan.
      const slot = String(after.you);
      const still = (s: Summary) => s.phase === 'aim' || s.phase === 'results' || s.phase === 'over';
      let pair: Summary[] = [];
      for (const t1 = Date.now(); Date.now() - t1 < 120_000; await host.waitForTimeout(300)) {
        pair = (await Promise.all([host, g].map(summary))) as Summary[];
        if (pair.every(still) && pair[0].round === pair[1].round && pair[0].phase === pair[1].phase) break;
      }
      expect(Math.abs(pair[1].perSlot[slot] - pair[0].perSlot[slot]), `bloques del hueco ${slot} (fase ${pair[0].phase})`).toBeLessThanOrEqual(3);
      reconnected = true;
      console.log('reconexión: recupera el hueco', after.you);
    }
    await host.waitForTimeout(300);
  }
  const finals = await waitAll([...players, ...(spectator ? [spectator] : [])], (s) => s.phase === 'over', 120_000);
  const w = finals[0].winner;
  expect(w).not.toBeNull();
  for (const f of finals) {
    expect(f.winner, 'mismo ganador en todos').toBe(w);
    expect(f.round, 'mismo número de rondas en todos').toBe(finals[0].round);
  }
  expect(checked.size).toBeGreaterThanOrEqual(1);
  expect(spectator, 'hubo espectador').not.toBeNull();
  expect(reconnected, 'hubo reconexión').toBe(true);
  // Todos los jugadores ven las mismas repeticiones de reyes caídos que el anfitrión.
  // (El que recargó la página se pierde las anteriores a la recarga.)
  for (let i = 1; i < players.length; i++) if (players[i] !== guests[1]) expect(finals[i].replays, `repeticiones del jugador ${i + 1}`).toBe(finals[0].replays);
  await expect(guests[0].locator('#game-over')).toBeVisible();
  await guests[0].screenshot({ path: info.outputPath('final.png') });
  console.log(`fin: gana ${w} en ${finals[0].round} rondas; rondas comprobadas ${[...checked].join(',')}; repeticiones ${finals[0].replays}`);
  for (const p of [...players, ...(spectator ? [spectator] : [])]) errors.push(...((p as Page & { errs?: string[] }).errs ?? []));
  expect(errors).toEqual([]);
});

test('el anfitrión se va a mitad de partida y otro hereda la partida', async ({ browser }) => {
  test.setTimeout(600_000);
  const errors: string[] = [];
  const host = await newPlayer(browser, errors, 'anfitrión');
  const g1 = await newPlayer(browser, errors, 'j2');
  const g2 = await newPlayer(browser, errors, 'j3');
  const hash = await createRoom(host, '&bots=1');
  await join(g1, hash, 'Jugador2', SLOW);
  await join(g2, hash, 'Jugador3', SLOW);
  await expect(host.locator('#player-list li[data-player]')).toHaveCount(3);
  await host.click('#start');
  await waitAll([host, g1, g2], (s) => s.round >= 2 && s.phase !== 'over', 240_000);
  const before = (await summary(g1))!;
  await host.context().close();
  const [a, b] = await waitAll([g1, g2], (s) => s.role === 'host' || s.fulls > before.fulls, 30_000);
  const newHost = a.role === 'host' ? a : b;
  expect(newHost.role, 'alguien toma el relevo').toBe('host');
  expect(newHost.migrations).toBe(1);
  console.log('migración: nuevo anfitrión en la ronda', newHost.round);
  const finals = await waitAll([g1, g2], (s) => s.phase === 'over', 480_000);
  expect(finals[0].winner).not.toBeNull();
  expect(finals[1].winner).toBe(finals[0].winner);
  expect(finals[1].round).toBe(finals[0].round);
  for (const p of [g1, g2]) errors.push(...((p as Page & { errs?: string[] }).errs ?? []));
  expect(errors).toEqual([]);
});

test('revancha: vuelve al lobby con la misma sala y los mismos jugadores', async ({ browser }) => {
  test.setTimeout(900_000);
  const errors: string[] = [];
  const host = await newPlayer(browser, errors, 'anfitrión');
  const g1 = await newPlayer(browser, errors, 'j2');
  const hash = await createRoom(host, '&bots=2');
  await join(g1, hash, 'Jugador2', SLOW);
  await expect(host.locator('#player-list li[data-player]')).toHaveCount(2);
  await host.click('#start');
  await waitAll([host, g1], (s) => s.phase === 'over', 720_000);
  await expect(g1.locator('#rematch')).toHaveCount(0);
  await host.click('#rematch');
  for (const p of [host, g1]) {
    await expect(p.locator('#lobby')).toBeVisible();
    await expect(p.locator('#player-list li[data-player]')).toHaveCount(2);
    await expect(p.locator('#lobby h2')).toHaveText(`Sala ${hash.slice(1)}`);
  }
  await host.click('#start');
  const again = await waitAll([host, g1], (s) => s.round === 1 && s.phase === 'aim');
  expect(again[0].role).toBe('host');
  for (const p of [host, g1]) errors.push(...((p as Page & { errs?: string[] }).errs ?? []));
  expect(errors).toEqual([]);
});

test('red mala: latencia, variación y pérdida de paquetes', async ({ browser }) => {
  test.setTimeout(720_000);
  const errors: string[] = [];
  const host = await newPlayer(browser, errors, 'anfitrión');
  const g1 = await newPlayer(browser, errors, 'j2');
  const g2 = await newPlayer(browser, errors, 'j3');
  const hash = await createRoom(host, '&bots=1');
  // 150 ms de retraso en cada sentido, ±80 ms de variación y 20 % de instantáneas perdidas.
  await join(g1, hash, 'Lento', `${SLOW}&lag=150&jitter=80&loss=0.2`);
  await join(g2, hash, 'Lentísimo', `${SLOW}&lag=250&jitter=120&loss=0.3`);
  await expect(host.locator('#player-list li[data-player]')).toHaveCount(3);
  await host.click('#start');
  const players = [host, g1, g2];
  const checked = new Set<number>();
  const t0 = Date.now();
  while (Date.now() - t0 < 600_000) {
    const all = (await Promise.all(players.map(summary))) as Summary[];
    if (all[0]?.phase === 'over') break;
    if (all[0]?.phase === 'results' && !checked.has(all[0].round)) {
      // Más margen: con 250 ms ±120 de retraso, el estado completo tarda en llegar.
      const again = await settledResults(players, 6000);
      if (again) {
        for (let i = 1; i < again.length; i++) compare(again[0], again[i], `red mala, ronda ${again[0].round}, jugador ${i + 1}`);
        checked.add(again[0].round);
        console.log(`red mala, ronda ${again[0].round}: consistente`);
      }
    }
    await host.waitForTimeout(300);
  }
  const finals = await waitAll(players, (s) => s.phase === 'over', 60_000);
  const seen = JSON.stringify(finals.map((f) => ({ role: f.role, round: f.round, winner: f.winner, alive: f.alive, v: (f as Summary & { v?: number }).v })));
  for (const f of finals) {
    expect(f.winner, seen).toBe(finals[0].winner);
    expect(f.round, seen).toBe(finals[0].round);
  }
  expect(checked.size).toBeGreaterThanOrEqual(1);
  for (const p of players) errors.push(...((p as Page & { errs?: string[] }).errs ?? []));
  expect(errors).toEqual([]);
});
