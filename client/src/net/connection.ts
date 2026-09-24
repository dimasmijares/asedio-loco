import { PROTOCOL_VERSION, type ClientMsg, type RelayData, type Role, type RoomState, type ServerMsg } from '../../../shared/protocol';

export type ConnStatus = 'connecting' | 'open' | 'closed' | 'replaced' | 'error';

interface ConnEvents {
  room: RoomState;
  relay: { from: string; d: RelayData };
  status: ConnStatus;
  welcome: { id: string; role: Role };
  error: { code: string; msg: string };
}

// Simulación de red para pruebas: ?lag=150&jitter=50&loss=0.1
// La pérdida solo afecta a las instantáneas (k='s'), que son redundantes.
interface NetSim {
  lag: number;
  jitter: number;
  loss: number;
}

function readNetSim(): NetSim | null {
  const q = new URLSearchParams(location.search);
  const lag = Number(q.get('lag') ?? 0);
  const jitter = Number(q.get('jitter') ?? 0);
  const loss = Number(q.get('loss') ?? 0);
  return lag || jitter || loss ? { lag, jitter, loss } : null;
}

const tokenKey = (code: string) => `asedio.token.${code}`;

export class Connection {
  ws: WebSocket | null = null;
  status: ConnStatus = 'connecting';
  room: RoomState | null = null;
  you: { id: string; token: string; role: Role } | null = null;
  lastError = '';
  rtt = 0;

  private listeners: { [K in keyof ConnEvents]: Set<(v: ConnEvents[K]) => void> } = {
    room: new Set(),
    relay: new Set(),
    status: new Set(),
    welcome: new Set(),
    error: new Set(),
  };
  private retry = 0;
  private stopped = false;
  private sim = readNetSim();
  private pingTimer = 0;
  // Orden de entrega con latencia simulada: nunca se adelanta un mensaje a otro.
  private lastInAt = 0;
  private lastOutAt = 0;

  constructor(readonly code: string, public name: string) {
    this.open();
  }

  on<K extends keyof ConnEvents>(ev: K, fn: (v: ConnEvents[K]) => void) {
    this.listeners[ev].add(fn);
    return () => this.listeners[ev].delete(fn);
  }

  private emit<K extends keyof ConnEvents>(ev: K, v: ConnEvents[K]) {
    for (const fn of this.listeners[ev]) fn(v);
  }

  get isHost() {
    return !!this.you && this.room?.hostId === this.you.id;
  }

  private setStatus(s: ConnStatus) {
    this.status = s;
    this.emit('status', s);
  }

  private open() {
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws/${this.code}`);
    this.ws = ws;
    this.setStatus('connecting');
    ws.onopen = () => {
      this.retry = 0;
      const token = localStorage.getItem(tokenKey(this.code)) ?? undefined;
      this.rawSend({ t: 'hello', v: PROTOCOL_VERSION, name: this.name, token: token || undefined });
      clearInterval(this.pingTimer);
      this.pingTimer = window.setInterval(() => this.rawSend({ t: 'ping', n: performance.now() }), 5000);
    };
    ws.onmessage = (e) => this.deliverIn(typeof e.data === 'string' ? e.data : '');
    ws.onclose = (e) => {
      clearInterval(this.pingTimer);
      if (this.ws !== ws) return;
      if (e.code === 4000) {
        this.stopped = true;
        return this.setStatus('replaced');
      }
      this.setStatus('closed');
      if (!this.stopped) setTimeout(() => this.open(), Math.min(5000, 400 * 2 ** this.retry++));
    };
  }

  private deliverIn(raw: string) {
    let m: ServerMsg;
    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }
    if (this.sim && m.t === 'relay') {
      if (m.d.k === 's' && Math.random() < this.sim.loss) return;
      const at = Math.max(this.lastInAt, performance.now() + this.sim.lag + Math.random() * this.sim.jitter);
      this.lastInAt = at;
      setTimeout(() => this.handle(m), at - performance.now());
      return;
    }
    this.handle(m);
  }

  private handle(m: ServerMsg) {
    switch (m.t) {
      case 'welcome':
        this.you = m.you;
        if (m.you.token) localStorage.setItem(tokenKey(this.code), m.you.token);
        this.room = m.room;
        this.setStatus('open');
        this.emit('welcome', { id: m.you.id, role: m.you.role });
        this.emit('room', m.room);
        break;
      case 'room':
        this.room = m.room;
        this.emit('room', m.room);
        break;
      case 'relay':
        this.emit('relay', { from: m.from, d: m.d });
        break;
      case 'pong':
        this.rtt = performance.now() - m.n;
        break;
      case 'error':
        this.lastError = m.msg;
        this.emit('error', { code: m.code, msg: m.msg });
        if (m.code === 'version') this.stopped = true;
        break;
    }
  }

  private rawSend(m: ClientMsg) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(m));
  }

  send(m: ClientMsg) {
    if (this.sim && m.t === 'relay') {
      if (m.d.k === 's' && Math.random() < this.sim.loss) return;
      const at = Math.max(this.lastOutAt, performance.now() + this.sim.lag + Math.random() * this.sim.jitter);
      this.lastOutAt = at;
      setTimeout(() => this.rawSend(m), at - performance.now());
      return;
    }
    this.rawSend(m);
  }

  relay(to: string, d: RelayData) {
    this.send({ t: 'relay', to, d });
  }

  close() {
    this.stopped = true;
    this.ws?.close();
  }
}
