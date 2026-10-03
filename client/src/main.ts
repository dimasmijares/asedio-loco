import { enterFullscreen, isMobileDevice } from './device';
import './ui/style.css';
import './ui/flujo.css';
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
  let online: { game: { dispose(): void }; mode: { dispose(): void }; canvas: HTMLElement; id: number } | null = null;
  let starting = false;
  // La sala manda: en partida se monta el juego; de vuelta a la sala se desmonta, y con una revancha
  // (otra partida, `room.game`) se monta de nuevo sin pasar por la sala (R-07 F2).
  const sync = async () => {
    const room = conn.room;
    if (!room || !conn.you) return;
    if (online && room.inGame && online.id !== room.game) {
      online.game.dispose();
      online.canvas.remove();
      online = null;
    }
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
      online = { game, mode, canvas, id: room.game };
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
  // Para pruebas: ?fast=1&bots=N configuran la sala si eres el anfitrión. Los N bots van en las
  // plazas libres empezando por la última, así los invitados que entren después ocupan las primeras.
  const q = new URLSearchParams(location.search);
  conn.on('welcome', () => {
    const room = conn.room;
    if (!conn.isHost || !room || room.inGame) return;
    if (q.get('fast') === '1') conn.send({ t: 'config', config: { fast: true } });
    const used = new Set([...room.players.map((p) => p.slot), ...room.config.botSlots]);
    const n = Math.min(3, Math.max(0, Number(q.get('bots')) || 0));
    for (const slot of [3, 2, 1, 0].filter((i) => !used.has(i)).slice(0, n)) conn.send({ t: 'seat', slot, bot: true });
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

// «Jugar solo»: rivales y dificultad (por defecto, los últimos elegidos), y a jugar.
function openSoloSetup(last?: { bots: number; difficulty: Difficulty }) {
  history.replaceState(null, '', location.pathname + location.search);
  void showBackdrop(document.getElementById('app')!);
  showSoloSetup(ui, {
    ...last,
    onStart: (bots, difficulty) => {
      enterFullscreen();
      history.replaceState(null, '', '#solo');
      void startSolo({ name: savedName(), bots, difficulty });
    },
    onSandbox: () => {
      enterFullscreen();
      history.replaceState(null, '', '#sandbox');
      void startSandbox();
    },
    onBack: () => boot(),
  });
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
    // «Cambiar rivales» (R-07 F8): de vuelta a «Jugar solo» con lo elegido, sin pasar por la portada.
    onChangeRivals: () => {
      game.dispose();
      canvas.remove();
      debug.game = debug.mode = undefined;
      openSoloSetup({ bots: opts.bots, difficulty: opts.difficulty });
    },
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
    // En móvil, pantalla completa al entrar (hace falta el gesto del usuario).
    onJoin: (c) => {
      enterFullscreen();
      enterRoom(c, savedName());
    },
    onCreate: async () => {
      enterFullscreen();
      try {
        enterRoom(await createRoom(), savedName());
      } catch (e) {
        home.error((e as Error).message);
      }
    },
    onSolo: () => openSoloSetup(),
  });
}

// Móvil: clase para los estilos táctiles.
if (isMobileDevice()) document.body.classList.add('touch');

window.addEventListener('hashchange', () => location.reload());
boot();
