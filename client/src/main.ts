import './ui/style.css';
import { DIFFICULTIES, ROOM_CODE_RE, type Difficulty } from '../../shared/protocol';
import { Connection } from './net/connection';
import { h } from './ui/dom';
import { hideBackdrop, showBackdrop } from './ui/backdrop';
import { LobbyView, savedName, showHome, showSoloSetup } from './ui/lobby';

const ui = h('div', { class: 'overlay', id: 'ui' });
document.getElementById('app')!.append(ui);

// Ganchos para las pruebas automáticas.
const debug: Record<string, unknown> = {};
(window as unknown as { __asedio: unknown }).__asedio = debug;

function codeFromHash() {
  const c = location.hash.slice(1).toUpperCase();
  return ROOM_CODE_RE.test(c) ? c : undefined;
}

async function createRoom(): Promise<string> {
  const r = await fetch('/api/rooms', { method: 'POST' });
  if (!r.ok) throw new Error('No se pudo crear la sala');
  return ((await r.json()) as { code: string }).code;
}

function enterRoom(code: string, name: string) {
  if (location.hash !== `#${code}`) history.replaceState(null, '', `#${code}`);
  const conn = new Connection(code, name);
  debug.conn = conn;
  new LobbyView(ui, conn);
  const app = document.getElementById('app')!;
  let online: { game: { dispose(): void }; mode: { dispose(): void }; canvas: HTMLElement } | null = null;
  let starting = false;
  // La sala manda: en partida se monta el juego; de vuelta al lobby (revancha) se desmonta.
  const sync = async () => {
    const room = conn.room;
    if (!room || !conn.you) return;
    if (room.inGame && !online && !starting) {
      starting = true;
      ui.replaceChildren();
      void hideBackdrop();
      const canvas = h('canvas', { id: 'game-canvas', tabIndex: 0 });
      app.prepend(canvas);
      const { Game } = await import('./game/game');
      const { OnlineMode } = await import('./game/modes/online');
      const game = await Game.create(canvas, []);
      const mode = new OnlineMode(game, conn, app, { autoplay: new URLSearchParams(location.search).get('autoplay') === '1' });
      online = { game, mode, canvas };
      debug.game = game;
      debug.mode = mode;
      starting = false;
      canvas.focus();
      void sync();
    } else if (!room.inGame && online) {
      online.game.dispose();
      online.canvas.remove();
      online = null;
      debug.game = debug.mode = undefined;
      new LobbyView(ui, conn);
      void showBackdrop(app);
    }
  };
  conn.on('room', () => void sync());
  // Para pruebas: ?fast=1&bots=N configuran la sala si eres el anfitrión.
  const q = new URLSearchParams(location.search);
  conn.on('welcome', () => {
    if (!conn.isHost || conn.room?.inGame) return;
    const config: { fast?: boolean; bots?: number } = {};
    if (q.get('fast') === '1') config.fast = true;
    if (q.get('bots')) config.bots = Math.min(3, Math.max(0, Number(q.get('bots')) || 0));
    if (Object.keys(config).length) conn.send({ t: 'config', config });
  });
}

async function startSandbox() {
  ui.replaceChildren();
  void hideBackdrop();
  const canvas = h('canvas', { id: 'game-canvas', tabIndex: 0 });
  document.getElementById('app')!.prepend(canvas);
  const { Game } = await import('./game/game');
  const { SandboxMode } = await import('./game/modes/sandbox');
  const game = await Game.create(canvas, [1, 2]);
  const mode = new SandboxMode(game, document.getElementById('app')!);
  debug.game = game;
  debug.mode = mode;
  canvas.focus();
}

// Partida contra bots. Parámetros opcionales en la URL (útiles para las pruebas):
// ?bots=3&dif=normal&fast=1&autoplay=1&seed=42#solo
async function startSolo(opts: { name: string; bots: number; difficulty: Difficulty }) {
  ui.replaceChildren();
  void hideBackdrop();
  const q = new URLSearchParams(location.search);
  const canvas = h('canvas', { id: 'game-canvas', tabIndex: 0 });
  document.getElementById('app')!.prepend(canvas);
  const { Game } = await import('./game/game');
  const { SoloMode } = await import('./game/modes/solo');
  const game = await Game.create(canvas, []);
  const mode = new SoloMode(game, document.getElementById('app')!, {
    ...opts,
    fast: q.get('fast') === '1',
    autoplay: q.get('autoplay') === '1',
    seed: q.get('seed') ? Number(q.get('seed')) : undefined,
  });
  debug.game = game;
  debug.mode = mode;
  canvas.focus();
}

function soloFromUrl() {
  const q = new URLSearchParams(location.search);
  const dif = q.get('dif');
  return {
    name: savedName(),
    bots: Math.min(3, Math.max(1, Number(q.get('bots') ?? 3) || 3)),
    difficulty: (DIFFICULTIES as readonly string[]).includes(dif ?? '') ? (dif as Difficulty) : 'normal',
  };
}

async function startPhysicsTest(scene: string) {
  ui.replaceChildren();
  void hideBackdrop();
  const canvas = h('canvas', { id: 'game-canvas', tabIndex: 0 });
  document.getElementById('app')!.prepend(canvas);
  const { Game } = await import('./game/game');
  const { PhysicsTestMode } = await import('./game/modes/physicsTest');
  const game = await Game.create(canvas, []);
  debug.game = game;
  debug.physics = new PhysicsTestMode(game, scene as never);
}

async function startBench() {
  ui.replaceChildren();
  void hideBackdrop();
  const canvas = h('canvas', { id: 'game-canvas', tabIndex: 0 });
  document.getElementById('app')!.prepend(canvas);
  const { Game } = await import('./game/game');
  const { BenchMode } = await import('./game/modes/bench');
  const game = await Game.create(canvas, []);
  debug.game = game;
  debug.bench = new BenchMode(game);
}

function boot() {
  if (location.hash === '#sandbox') return void startSandbox();
  if (location.hash === '#bench') return void startBench();
  if (location.hash === '#solo') return void startSolo(soloFromUrl());
  const phys = location.hash.match(/^#physics=(\w+)$/);
  if (phys) return void startPhysicsTest(phys[1]);
  const code = codeFromHash();
  void showBackdrop(document.getElementById('app')!);
  let hasToken = false;
  try {
    hasToken = !!code && !!localStorage.getItem(`asedio.token.${code}`);
  } catch {
    /* sin almacenamiento */
  }
  // Si recargas dentro de una sala en la que ya estabas, entras directamente.
  if (code && hasToken) return enterRoom(code, savedName());
  const home = showHome(ui, {
    code,
    onJoin: (name) => enterRoom(code!, name),
    onCreate: async (name) => {
      try {
        enterRoom(await createRoom(), name);
      } catch (e) {
        home.error((e as Error).message);
      }
    },
    onSolo: (name) =>
      showSoloSetup(ui, {
        onStart: (bots, difficulty) => {
          history.replaceState(null, '', '#solo');
          void startSolo({ name, bots, difficulty });
        },
        onSandbox: () => {
          history.replaceState(null, '', '#sandbox');
          void startSandbox();
        },
        onBack: () => boot(),
      }),
  });
}

window.addEventListener('hashchange', () => location.reload());
boot();
