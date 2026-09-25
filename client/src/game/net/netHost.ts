import type { MatchState } from '../../../../shared/match';
import type { Quat, Vec3 } from '../../../../shared/math';
import type { RelayData } from '../../../../shared/protocol';
import type { Connection } from '../../net/connection';
import type { Game } from '../game';
import { MatchHost, type PlayerInput } from '../match/host';
import type { SimEvent } from '../sim/sim';
import { aimToArr, arrToAim, hostNow, packBlock, packPose, type FullMsg, type GameMsg, type TickMsg } from './messages';

const TICK_HZ = 15;
const MAX_JSON = 56 * 1024;

// El anfitrión en red: ejecuta la partida y la retransmite al resto. Todo lo continuo
// (poses, eventos, punterías de bots) va agrupado en un tic a 15 Hz para gastar pocos
// mensajes: el servidor limita la frecuencia y cada mensaje entrante cuenta en la cuota.
export class NetHost {
  host: MatchHost;
  private moved = new Map<number, { p: Vec3; q: Quat }>();
  private lastSent = new Map<number, { p: Vec3; q: Quat }>();
  private resend = new Map<number, number>();
  private evBuf: SimEvent[] = [];
  private aims = new Map<number, number[]>();
  private tickT = 0;
  private off: (() => void)[] = [];
  private lastPhase = '';
  stats = { ticks: 0, bytes: 0, events: 0, fulls: 0 };

  constructor(readonly game: Game, readonly conn: Connection, state: MatchState, readonly localSlot: number | null, fresh = true) {
    this.host = new MatchHost(game, state, fresh);
    this.host.onState = (s) => this.send('all', { k: 'st', s });
    this.host.onAim = (slot, p) => {
      // Los humanos remotos ya mandan su puntería a todos; aquí van la de los bots y la propia.
      if (!p.bot && slot !== this.localSlot) return;
      this.aims.set(slot, [slot, ...aimToArr(p.aim), p.selected, p.target]);
    };
    game.onBodyMoved = (id, p, q) => this.moved.set(id, { p, q });
    this.off.push(conn.on('relay', ({ from, d }) => this.onRelay(from, d as unknown as GameMsg)));
    this.sendFull('all');
    this.host.onState(this.host.state);
  }

  get state() {
    return this.host.state;
  }

  private send(to: string, msg: GameMsg) {
    this.conn.relay(to, msg as unknown as RelayData);
  }

  private slotOf(id: string) {
    return this.host.state.players.find((p) => p.id === id && !p.bot)?.slot;
  }

  private onRelay(from: string, d: GameMsg) {
    switch (d.k) {
      case 'hi':
        this.sendFull(from);
        break;
      case 'in': {
        const slot = this.slotOf(from);
        if (slot === undefined) return;
        const input: PlayerInput = {};
        if (Array.isArray(d.aim)) input.aim = arrToAim(d.aim);
        if (typeof d.sel === 'number') input.selected = d.sel;
        if (typeof d.tgt === 'number') input.target = d.tgt;
        if (d.lk) input.locked = true;
        this.host.setInput(slot, input);
        break;
      }
      case 'aim': {
        const slot = this.slotOf(from);
        if (slot === undefined || slot !== d.slot || !Array.isArray(d.a)) return;
        this.host.setInput(slot, { aim: arrToAim(d.a) });
        break;
      }
    }
  }

  // Entrada del jugador local (el anfitrión también juega).
  localInput(input: PlayerInput) {
    if (this.localSlot === null) return;
    this.host.setInput(this.localSlot, input);
  }

  onSimEvents(events: SimEvent[]) {
    this.host.onSimEvents(events);
    this.evBuf.push(...events);
  }

  update(dt: number) {
    this.host.update(dt);
    this.tickT += dt;
    if (this.tickT >= 1 / TICK_HZ) {
      this.tickT = 0;
      this.flushTick();
    }
    // Al final de cada ronda, estado completo: así todos coinciden exactamente.
    const ph = this.host.state.phase;
    if (ph !== this.lastPhase) {
      if (ph === 'results' || ph === 'over') {
        this.flushTick();
        this.sendFull('all');
      }
      this.lastPhase = ph;
    }
  }

  private flushTick() {
    const t = hostNow();
    const b: number[] = [];
    // Compresión: solo lo que ha cambiado de verdad (más de medio centímetro o algo de giro).
    for (const [id, m] of this.moved) {
      const last = this.lastSent.get(id);
      if (last && Math.abs(last.p[0] - m.p[0]) + Math.abs(last.p[1] - m.p[1]) + Math.abs(last.p[2] - m.p[2]) < 0.005 && Math.abs(last.q[0] * m.q[0] + last.q[1] * m.q[1] + last.q[2] * m.q[2] + last.q[3] * m.q[3]) > 0.99999) continue;
      packPose(b, id, m.p, m.q);
      this.lastSent.set(id, m);
      this.resend.set(id, 3);
    }
    // Lo que se ha parado se repite unos tics más: si se perdiera un paquete, el cliente
    // no se quedaría con una pose a medio camino.
    for (const [id, n] of this.resend) {
      if (this.moved.has(id)) continue;
      const last = this.lastSent.get(id);
      if (last) packPose(b, id, last.p, last.q);
      if (n <= 1) this.resend.delete(id);
      else this.resend.set(id, n - 1);
    }
    this.moved.clear();
    const a: number[] = [];
    for (const arr of this.aims.values()) a.push(...arr);
    this.aims.clear();
    const e = this.evBuf;
    this.evBuf = [];
    if (!b.length && !a.length && !e.length) return;
    this.sendTick({ k: 'tk', t, b: b.length ? b : undefined, e: e.length ? e : undefined, a: a.length ? a : undefined });
  }

  // Si el tic es muy grande (cientos de bloques volando a la vez) se trocea.
  private sendTick(m: TickMsg) {
    const json = JSON.stringify(m);
    if (json.length > MAX_JSON) {
      const bodies = m.b ?? [];
      const events = m.e ?? [];
      if (bodies.length > 8) {
        const half = Math.floor(bodies.length / 16) * 8;
        this.sendTick({ ...m, b: bodies.slice(0, half) });
        this.sendTick({ k: 'tk', t: m.t, b: bodies.slice(half) });
        return;
      }
      if (events.length > 1) {
        const half = events.length >> 1;
        this.sendTick({ ...m, e: events.slice(0, half) });
        this.sendTick({ k: 'tk', t: m.t, e: events.slice(half) });
        return;
      }
    }
    this.send('all', m);
    this.stats.ticks++;
    this.stats.bytes += json.length;
    this.stats.events += m.e?.length ?? 0;
  }

  buildFull(): FullMsg {
    const sim = this.game.sim!;
    const blocks: number[] = [];
    const kings: number[] = [];
    for (const r of sim.recs.values()) {
      const tr = r.body.translation();
      const ro = r.body.rotation();
      const p: Vec3 = [tr.x, tr.y, tr.z];
      const q: Quat = [ro.x, ro.y, ro.z, ro.w];
      if (r.kind === 'block') packBlock(blocks, r.id, r.mat!.id, r.size, p, q);
      else if (r.kind === 'king') packPose(kings, r.slot, p, q);
    }
    const projs = [...this.game.view.projs.values()].map((pr) => ({ id: pr.id, ammo: pr.ammo, owner: pr.owner, scale: pr.scale !== 1 ? pr.scale : undefined }));
    return { k: 'full', t: hostNow(), s: this.host.state, blocks, kings, projs, shields: [...sim.shields.keys()], lava: sim.lavaY };
  }

  sendFull(to: string) {
    this.send(to, this.buildFull());
    this.stats.fulls++;
  }

  dispose() {
    for (const f of this.off) f();
    this.game.onBodyMoved = undefined;
  }
}
