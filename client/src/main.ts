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

function boot() {
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
    onSolo: () => home.error('El modo solitario llega en la Fase 2'),
  });
}

window.addEventListener('hashchange', () => location.reload());
boot();
