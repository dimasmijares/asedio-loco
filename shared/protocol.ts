// Protocolo entre cliente y servidor de salas. El servidor solo entiende los
// mensajes de control (hello, config, start…). Todo lo relativo a la partida
// viaja dentro de `relay` y el servidor lo retransmite sin interpretarlo.

export const PROTOCOL_VERSION = 5;
export const MAX_PLAYERS = 4;
export const MAX_NAME_LEN = 16;
export const MAX_MSG_BYTES = 64 * 1024;
export const ROOM_CODE_RE = /^[A-Z]{4}$/;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I ni O

export type Difficulty = 'facil' | 'normal' | 'dificil';
export const DIFFICULTIES: readonly Difficulty[] = ['facil', 'normal', 'dificil'];

export interface RoomConfig {
  bots: number; // bots de relleno (0-3), limitados por los huecos libres
  difficulty: Difficulty;
  fast: boolean; // modo rápido para pruebas: fases más cortas
}

export interface PlayerInfo {
  id: string;
  name: string;
  slot: number; // 0-3: esquina y color
  connected: boolean;
}

export interface RoomState {
  code: string;
  hostId: string | null;
  players: PlayerInfo[];
  spectators: number;
  config: RoomConfig;
  inGame: boolean;
}

export type Role = 'player' | 'spectator';

export type ClientMsg =
  | { t: 'hello'; v: number; name: string; token?: string; mobile?: boolean }
  | { t: 'name'; name: string }
  | { t: 'config'; config: Partial<RoomConfig> }
  | { t: 'start' }
  | { t: 'lobby' } // revancha: vuelve al lobby con los mismos jugadores
  | { t: 'yield' } // el anfitrión cede el papel (p. ej. al pasar a segundo plano)
  | { t: 'relay'; to: string; d: RelayData }
  | { t: 'ping'; n: number };

export type ServerMsg =
  | { t: 'welcome'; you: { id: string; token: string; role: Role }; room: RoomState }
  | { t: 'room'; room: RoomState }
  | { t: 'relay'; from: string; d: RelayData }
  | { t: 'pong'; n: number }
  | { t: 'error'; code: string; msg: string };

// Carga útil de la partida: un objeto con un campo `k` que indica el tipo.
export interface RelayData {
  k: string;
  [key: string]: unknown;
}

export const DEFAULT_CONFIG: RoomConfig = { bots: 0, difficulty: 'normal', fast: false };

// Deja solo letras, números, espacios y algo de puntuación inofensiva.
export function sanitizeName(input: unknown): string {
  if (typeof input !== 'string') return '';
  const clean = input
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} _.\-!¡?¿]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  return Array.from(clean).slice(0, MAX_NAME_LEN).join('').trim();
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);

export function sanitizeConfig(input: unknown): Partial<RoomConfig> | null {
  if (!isObj(input)) return null;
  const out: Partial<RoomConfig> = {};
  if ('bots' in input) {
    if (typeof input.bots !== 'number' || !Number.isInteger(input.bots) || input.bots < 0 || input.bots > MAX_PLAYERS - 1) return null;
    out.bots = input.bots;
  }
  if ('difficulty' in input) {
    if (!DIFFICULTIES.includes(input.difficulty as Difficulty)) return null;
    out.difficulty = input.difficulty as Difficulty;
  }
  if ('fast' in input) {
    if (typeof input.fast !== 'boolean') return null;
    out.fast = input.fast;
  }
  return out;
}

// Valida un mensaje de cliente. Devuelve null si el tamaño, el tipo o los campos no son válidos.
export function parseClientMsg(raw: unknown): ClientMsg | null {
  if (typeof raw !== 'string' || raw.length > MAX_MSG_BYTES) return null;
  let m: unknown;
  try {
    m = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObj(m) || typeof m.t !== 'string') return null;
  switch (m.t) {
    case 'hello':
      if (typeof m.v !== 'number' || typeof m.name !== 'string' || m.name.length > 200) return null;
      if (m.token !== undefined && (typeof m.token !== 'string' || !/^[a-f0-9]{32}$/.test(m.token))) return null;
      if (m.mobile !== undefined && typeof m.mobile !== 'boolean') return null;
      return { t: 'hello', v: m.v, name: m.name, token: m.token as string | undefined, mobile: m.mobile as boolean | undefined };
    case 'name':
      if (typeof m.name !== 'string' || m.name.length > 200) return null;
      return { t: 'name', name: m.name };
    case 'config': {
      const config = sanitizeConfig(m.config);
      return config ? { t: 'config', config } : null;
    }
    case 'start':
    case 'lobby':
    case 'yield':
      return { t: m.t };
    case 'relay':
      if (typeof m.to !== 'string' || m.to.length > 40) return null;
      if (!isObj(m.d) || typeof m.d.k !== 'string' || m.d.k.length > 20) return null;
      return { t: 'relay', to: m.to, d: m.d as RelayData };
    case 'ping':
      if (typeof m.n !== 'number') return null;
      return { t: 'ping', n: m.n };
    default:
      return null;
  }
}

export function randomRoomCode(rand: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < 4; i++) s += ROOM_CODE_ALPHABET[Math.floor(rand() * ROOM_CODE_ALPHABET.length)];
  return s;
}

// Cubo de fichas para limitar la frecuencia de mensajes.
export class TokenBucket {
  private tokens: number;
  private last: number;
  constructor(private rate: number, private burst: number, now: number) {
    this.tokens = burst;
    this.last = now;
  }
  take(now: number): boolean {
    this.tokens = Math.min(this.burst, this.tokens + ((now - this.last) / 1000) * this.rate);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}
