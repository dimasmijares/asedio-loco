import { DurableObject } from 'cloudflare:workers';
import {
  DEFAULT_CONFIG,
  MAX_MSG_BYTES,
  MAX_PLAYERS,
  PROTOCOL_VERSION,
  ROOM_CODE_RE,
  TokenBucket,
  parseClientMsg,
  randomRoomCode,
  sanitizeName,
  type ClientMsg,
  type PlayerInfo,
  type Role,
  type RoomConfig,
  type RoomState,
  type ServerMsg,
} from '../shared/protocol';

export interface Env {
  ROOMS: DurableObjectNamespace<Room>;
  ASSETS: Fetcher;
}

interface StoredPlayer {
  id: string;
  name: string;
  slot: number;
  token: string;
}

interface Stored {
  code: string;
  players: StoredPlayer[];
  hostId: string | null;
  config: RoomConfig;
  inGame: boolean;
}

interface Attach {
  pid: string | null;
  role: Role | null;
  name?: string;
}

const EMPTY_ROOM_TTL_MS = 60_000;
const HOST_GRACE_MS = 8_000;
const MAX_DROPS = 300;

const hex = (bytes: number) => {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
};

// Una Durable Object por sala. Guarda el lobby y retransmite los mensajes de la
// partida. La física la ejecuta el cliente anfitrión, no este servidor.
export class Room extends DurableObject<Env> {
  private s: Stored | null = null;
  private limits = new WeakMap<WebSocket, { bucket: TokenBucket; drops: number; host: boolean }>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.s = (await ctx.storage.get<Stored>('s')) ?? null;
    });
  }

  private fresh(code: string): Stored {
    return { code, players: [], hostId: null, config: { ...DEFAULT_CONFIG }, inGame: false };
  }

  private save() {
    if (this.s) this.ctx.storage.put('s', this.s);
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const code = req.headers.get('X-Room-Code') ?? '';
    if (url.pathname === '/claim') {
      if (this.s && (this.s.players.length > 0 || this.ctx.getWebSockets().length > 0)) return new Response('ocupada', { status: 409 });
      this.s = this.fresh(code);
      this.save();
      await this.ctx.storage.setAlarm(Date.now() + EMPTY_ROOM_TTL_MS * 5);
      return new Response('ok');
    }
    if (url.pathname === '/info') {
      return Response.json({
        exists: !!this.s,
        players: this.s?.players.length ?? 0,
        inGame: this.s?.inGame ?? false,
      });
    }
    if (req.headers.get('Upgrade') !== 'websocket') return new Response('Se esperaba WebSocket', { status: 426 });
    if (!this.s) {
      this.s = this.fresh(code);
      this.save();
    }
    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ pid: null, role: null } satisfies Attach);
    return new Response(null, { status: 101, webSocket: client });
  }

  // ---------- utilidades ----------

  private attach(ws: WebSocket): Attach {
    return (ws.deserializeAttachment() as Attach | null) ?? { pid: null, role: null };
  }

  private sockets(except?: WebSocket): WebSocket[] {
    return this.ctx.getWebSockets().filter((w) => w !== except && w.readyState === WebSocket.OPEN);
  }

  private isConnected(pid: string, except?: WebSocket) {
    return this.sockets(except).some((w) => this.attach(w).pid === pid);
  }

  private send(ws: WebSocket, msg: ServerMsg) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* socket cerrándose */
    }
  }

  private view(except?: WebSocket): RoomState {
    const s = this.s!;
    const players: PlayerInfo[] = s.players
      .map((p) => ({ id: p.id, name: p.name, slot: p.slot, connected: this.isConnected(p.id, except) }))
      .sort((a, b) => a.slot - b.slot);
    const spectators = this.sockets(except).filter((w) => this.attach(w).role === 'spectator').length;
    const bots = Math.min(s.config.bots, MAX_PLAYERS - players.length);
    return { code: s.code, hostId: s.hostId, players, spectators, config: { ...s.config, bots }, inGame: s.inGame };
  }

  // `skip`: no se le envía (ya recibió su welcome). `gone`: conexión que se está cerrando.
  private broadcastRoom(skip?: WebSocket, gone?: WebSocket) {
    const room = this.view(gone);
    for (const w of this.sockets(gone)) if (w !== skip && this.attach(w).pid) this.send(w, { t: 'room', room });
  }

  private limitFor(ws: WebSocket, pid: string | null) {
    const host = !!pid && pid === this.s?.hostId;
    let l = this.limits.get(ws);
    if (!l || l.host !== host) {
      l = { bucket: host ? new TokenBucket(80, 160, Date.now()) : new TokenBucket(30, 60, Date.now()), drops: l?.drops ?? 0, host };
      this.limits.set(ws, l);
    }
    return l;
  }

  private pickNewHost(except?: WebSocket) {
    const s = this.s!;
    const candidates = s.players.filter((p) => this.isConnected(p.id, except)).sort((a, b) => a.slot - b.slot);
    if (candidates.length) s.hostId = candidates[0].id;
  }

  // ---------- eventos del WebSocket ----------

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    if (!this.s) return ws.close(1011, 'sala inexistente');
    const a = this.attach(ws);
    const lim = this.limitFor(ws, a.pid);
    if (!lim.bucket.take(Date.now())) {
      if (++lim.drops > MAX_DROPS) ws.close(1008, 'demasiados mensajes');
      return;
    }
    if (typeof raw !== 'string' || raw.length > MAX_MSG_BYTES) return this.send(ws, { t: 'error', code: 'formato', msg: 'Mensaje no válido' });
    const m = parseClientMsg(raw);
    if (!m) return this.send(ws, { t: 'error', code: 'formato', msg: 'Mensaje no válido' });
    if (m.t === 'hello') return this.onHello(ws, a, m);
    if (m.t === 'ping') return this.send(ws, { t: 'pong', n: m.n });
    if (!a.pid) return this.send(ws, { t: 'error', code: 'sin-hello', msg: 'Primero identifícate' });
    this.onMessage(ws, a, m);
  }

  private onHello(ws: WebSocket, a: Attach, m: Extract<ClientMsg, { t: 'hello' }>) {
    const s = this.s!;
    if (a.pid) return;
    if (m.v !== PROTOCOL_VERSION) return this.send(ws, { t: 'error', code: 'version', msg: 'Versión antigua: recarga la página' });
    const name = sanitizeName(m.name) || `Jugador ${s.players.length + 1}`;
    let player = m.token ? s.players.find((p) => p.token === m.token) : undefined;
    let role: Role = 'player';

    if (player) {
      // Reconexión: cierra la conexión anterior de ese jugador (otra pestaña).
      for (const w of this.sockets(ws)) if (this.attach(w).pid === player.id) w.close(4000, 'reemplazado');
    } else if (!s.inGame) {
      if (s.players.length >= MAX_PLAYERS) {
        // En el lobby, un jugador desconectado cede su hueco a uno nuevo.
        const gone = s.players.find((p) => p.id !== s.hostId && !this.isConnected(p.id, ws));
        if (gone) s.players = s.players.filter((p) => p !== gone);
      }
      if (s.players.length < MAX_PLAYERS) {
        const used = new Set(s.players.map((p) => p.slot));
        const slot = [0, 1, 2, 3].find((i) => !used.has(i))!;
        player = { id: hex(4), name, slot, token: hex(16) };
        s.players.push(player);
      }
    }
    if (!player) role = 'spectator';

    const pid = player ? player.id : `s${hex(4)}`;
    ws.serializeAttachment({ pid, role, name } satisfies Attach);
    if (role === 'player' && (!s.hostId || !this.isConnected(s.hostId, ws) || !s.players.some((p) => p.id === s.hostId))) s.hostId = pid;
    this.save();
    this.send(ws, { t: 'welcome', you: { id: pid, token: player?.token ?? '', role }, room: this.view() });
    this.broadcastRoom(ws);
  }

  private onMessage(ws: WebSocket, a: Attach, m: ClientMsg) {
    const s = this.s!;
    const isHost = a.pid === s.hostId;
    switch (m.t) {
      case 'name': {
        const p = s.players.find((p) => p.id === a.pid);
        const name = sanitizeName(m.name);
        if (p && name && !s.inGame) {
          p.name = name;
          this.save();
          this.broadcastRoom();
        }
        return;
      }
      case 'config':
        if (!isHost || s.inGame) return this.send(ws, { t: 'error', code: 'permiso', msg: 'Solo el anfitrión puede cambiar la sala' });
        s.config = { ...s.config, ...m.config };
        this.save();
        return this.broadcastRoom();
      case 'start':
        if (!isHost || s.inGame) return this.send(ws, { t: 'error', code: 'permiso', msg: 'Solo el anfitrión puede empezar' });
        s.players = s.players.filter((p) => this.isConnected(p.id));
        s.config.bots = Math.min(s.config.bots, MAX_PLAYERS - s.players.length);
        if (s.players.length + s.config.bots < 2) return this.send(ws, { t: 'error', code: 'pocos', msg: 'Hacen falta al menos 2 castillos (añade bots)' });
        s.inGame = true;
        this.save();
        return this.broadcastRoom();
      case 'lobby': {
        if (!isHost || !s.inGame) return;
        s.inGame = false;
        s.players = s.players.filter((p) => this.isConnected(p.id));
        // Los espectadores pasan a jugar si hay hueco.
        for (const w of this.sockets()) {
          const wa = this.attach(w);
          if (wa.role !== 'spectator' || s.players.length >= MAX_PLAYERS) continue;
          const used = new Set(s.players.map((p) => p.slot));
          const slot = [0, 1, 2, 3].find((i) => !used.has(i))!;
          const player = { id: hex(4), name: wa.name || `Jugador ${slot + 1}`, slot, token: hex(16) };
          s.players.push(player);
          w.serializeAttachment({ pid: player.id, role: 'player', name: player.name } satisfies Attach);
          this.send(w, { t: 'welcome', you: { id: player.id, token: player.token, role: 'player' }, room: this.view() });
        }
        this.save();
        return this.broadcastRoom();
      }
      case 'relay': {
        if (a.role === 'spectator') return this.send(ws, { t: 'error', code: 'espectador', msg: 'Los espectadores no pueden jugar' });
        if (!isHost && m.to !== 'all' && m.to !== 'host') return;
        const out = JSON.stringify({ t: 'relay', from: a.pid!, d: m.d } satisfies ServerMsg);
        for (const w of this.sockets(ws)) {
          const pid = this.attach(w).pid;
          if (!pid) continue;
          if (m.to === 'all' || (m.to === 'host' && pid === s.hostId) || m.to === pid) {
            try {
              w.send(out);
            } catch {
              /* ignorar */
            }
          }
        }
        return;
      }
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string) {
    this.onGone(ws);
    try {
      ws.close(code === 1005 ? 1000 : code, reason);
    } catch {
      /* ya cerrado */
    }
  }

  async webSocketError(ws: WebSocket) {
    this.onGone(ws);
  }

  private onGone(ws: WebSocket) {
    if (!this.s) return;
    const a = this.attach(ws);
    if (a.pid && a.pid === this.s.hostId && !this.isConnected(a.pid, ws)) {
      if (this.s.inGame) {
        // En partida, otro jugador toma el relevo en el acto (migración de anfitrión).
        this.pickNewHost(ws);
        this.save();
      } else {
        // En el lobby se le da margen para recargar sin perder el rol.
        this.scheduleAlarm(Date.now() + HOST_GRACE_MS);
      }
    }
    this.broadcastRoom(undefined, ws);
    if (this.sockets(ws).length === 0) this.scheduleAlarm(Date.now() + EMPTY_ROOM_TTL_MS);
  }

  private async scheduleAlarm(at: number) {
    const cur = await this.ctx.storage.getAlarm();
    if (!cur || cur > at || cur < Date.now()) await this.ctx.storage.setAlarm(at);
  }

  // Revisa el anfitrión ausente del lobby y destruye la sala si queda vacía.
  async alarm() {
    if (!this.s) return;
    const open = this.sockets();
    if (open.length === 0) {
      await this.ctx.storage.deleteAll();
      this.s = null;
      return;
    }
    if (this.s.hostId && !this.isConnected(this.s.hostId)) {
      this.pickNewHost();
      this.save();
      this.broadcastRoom();
    }
  }
}

function roomStub(env: Env, code: string) {
  return env.ROOMS.get(env.ROOMS.idFromName(code));
}

function originAllowed(req: Request, url: URL) {
  const origin = req.headers.get('Origin');
  if (!origin) return true; // clientes que no son navegador (pruebas)
  try {
    const o = new URL(origin);
    return o.host === url.host || o.hostname === 'localhost' || o.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    const ws = url.pathname.match(/^\/ws\/([A-Z]{4})$/);
    if (ws) {
      if (!originAllowed(req, url)) return new Response('Origen no permitido', { status: 403 });
      const headers = new Headers(req.headers);
      headers.set('X-Room-Code', ws[1]);
      return roomStub(env, ws[1]).fetch(new Request('https://room/ws', { headers }));
    }
    if (url.pathname === '/api/rooms' && req.method === 'POST') {
      for (let i = 0; i < 8; i++) {
        const code = randomRoomCode();
        const r = await roomStub(env, code).fetch('https://room/claim', { method: 'POST', headers: { 'X-Room-Code': code } });
        if (r.ok) return Response.json({ code });
      }
      return Response.json({ error: 'No hay salas libres, prueba otra vez' }, { status: 503 });
    }
    const info = url.pathname.match(/^\/api\/rooms\/([A-Z]{4})$/);
    if (info && ROOM_CODE_RE.test(info[1])) return roomStub(env, info[1]).fetch('https://room/info');
    if (url.pathname === '/api/health') return Response.json({ ok: true, v: PROTOCOL_VERSION });
    if (url.pathname.startsWith('/api/')) return new Response('No encontrado', { status: 404 });
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
