import './ui/style.css';
import { ROOM_CODE_RE } from '../../shared/protocol';
import { Connection } from './net/connection';
import { h } from './ui/dom';
import { LobbyView, savedName, showHome } from './ui/lobby';

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
}

async function startSandbox() {
  ui.replaceChildren();
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

async function startPhysicsTest(scene: string) {
  ui.replaceChildren();
  const canvas = h('canvas', { id: 'game-canvas', tabIndex: 0 });
  document.getElementById('app')!.prepend(canvas);
  const { Game } = await import('./game/game');
  const { PhysicsTestMode } = await import('./game/modes/physicsTest');
  const game = await Game.create(canvas, []);
  debug.game = game;
  debug.physics = new PhysicsTestMode(game, scene as never);
}

function boot() {
  if (location.hash === '#sandbox') return void startSandbox();
  const phys = location.hash.match(/^#physics=(\w+)$/);
  if (phys) return void startPhysicsTest(phys[1]);
  const code = codeFromHash();
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
    onSolo: () => {
      history.replaceState(null, '', '#sandbox');
      void startSandbox();
    },
  });
}

window.addEventListener('hashchange', () => location.reload());
boot();
