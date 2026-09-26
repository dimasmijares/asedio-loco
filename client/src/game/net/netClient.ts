import { KING_ID_BASE } from '../../../../shared/castle';
import type { MatchState } from '../../../../shared/match';
import type { RelayData } from '../../../../shared/protocol';
import type { Connection } from '../../net/connection';
import type { Game } from '../game';
import type { PlayerInput } from '../match/host';
import type { MatchSource } from '../match/ui';
import type { SimEvent } from '../sim/sim';
import { Interpolator } from './interp';
import { aimToArr, arrToAim, isStale, unpackBlocks, unpackPoses, type FullMsg, type GameMsg, type TickMsg } from './messages';

// Cliente que no es anfitrión: no simula nada (salvo los fragmentos decorativos),
// solo reproduce lo que manda el anfitrión, interpolando poses con un poco de retraso.
export class NetClient implements MatchSource {
  state: MatchState;
  interp = new Interpolator();
  ready = false; // true tras recibir el primer estado completo
  private deadline = 0;
  private evQueue: { t: number; e: SimEvent[] }[] = [];
  private liveAims = new Map<number, { a: [number, number, number]; sel: number; tgt: number; at: number }>();
  private off: (() => void)[] = [];
  private lastAimSent = 0;
  onEvents: (e: SimEvent[]) => void = () => {};
  fullsReceived = 0;

  constructor(readonly game: Game, readonly conn: Connection, initial: MatchState, public you: number | null) {
    this.state = initial;
    this.off.push(conn.on('relay', ({ from, d }) => this.onRelay(from, d as unknown as GameMsg)));
    this.hello();
  }

  hello() {
    this.relay('host', { k: 'hi' });
  }

  private relay(to: string, msg: GameMsg) {
    this.conn.relay(to, msg as unknown as RelayData);
  }

  private fromHost(from: string) {
    return from === this.conn.room?.hostId;
  }

  private onRelay(from: string, d: GameMsg) {
    switch (d.k) {
      case 'st':
        if (this.fromHost(from)) this.setState(d.s);
        break;
      case 'tk':
        if (this.fromHost(from)) this.onTick(d);
        break;
      case 'full':
        if (this.fromHost(from)) this.applyFull(d);
        break;
      case 'aim': {
        // Puntería de otro jugador humano, directa y sin pasar por el anfitrión.
        const p = this.state.players.find((x) => x.slot === d.slot && x.id === from);
        if (p && d.slot !== this.you && Array.isArray(d.a)) this.liveAims.set(d.slot, { a: d.a, sel: d.sel, tgt: d.tgt, at: performance.now() });
        break;
      }
    }
  }

  private setState(s: MatchState) {
    // Un estado más viejo que el que ya tenemos (misma partida) no puede deshacer nada.
    if (isStale(this.state, s)) return;
    this.state = s;
    this.deadline = performance.now() / 1000 + s.remaining;
    this.applyLiveAims();
    this.game.setLavaVisual(s.lavaY);
  }

  private applyLiveAims() {
    const now = performance.now();
    for (const [slot, la] of this.liveAims) {
      const p = this.state.players.find((x) => x.slot === slot);
      if (!p || now - la.at > 1500 || p.locked) continue;
      p.aim = arrToAim(la.a);
    }
  }

  private onTick(m: TickMsg) {
    this.interp.observeClock(m.t);
    if (m.b) unpackPoses(m.b, (id, p, q) => this.interp.push(m.t, id, p, q));
    if (m.e?.length) this.evQueue.push({ t: m.t, e: m.e });
    if (m.a) {
      for (let i = 0; i + 6 <= m.a.length; i += 6) {
        const slot = m.a[i];
        if (slot === this.you) continue;
        this.liveAims.set(slot, { a: [m.a[i + 1], m.a[i + 2], m.a[i + 3]], sel: m.a[i + 4], tgt: m.a[i + 5], at: performance.now() });
      }
      this.applyLiveAims();
    }
  }

  // Estado completo: se ajusta la vista para que coincida exactamente con el anfitrión.
  private applyFull(m: FullMsg) {
    // Un estado completo viejo tampoco: ni su estado ni sus bloques, reyes o proyectiles.
    if (isStale(this.state, m.s)) return;
    const view = this.game.view;
    // El estado completo manda sobre lo que se vea: si había una repetición, se corta.
    view.endReplay();
    this.interp.observeClock(m.t);
    // Los eventos pendientes ya están incluidos en el estado completo.
    const pending = this.evQueue.flatMap((q) => q.e).filter((e) => e.e !== 'rm' && e.e !== 'spawn' && e.e !== 'proj' && e.e !== 'projEnd');
    this.evQueue = [];
    for (const e of pending) if (e.e === 'king' || e.e === 'shield') view.apply(e);
    const seen = new Set<number>();
    unpackBlocks(m.blocks, (id, mat, size, p, q) => {
      seen.add(id);
      if (!view.blocks.has(id)) view.addBlock(id, mat, size, p, q);
      this.interp.set(id, m.t, p, q);
      view.setBody(id, p, q);
    });
    for (const id of [...view.blocks.items.keys()]) if (!seen.has(id)) (view.removeBlock(id), this.interp.remove(id));
    unpackPoses(m.kings, (slot, p, q) => {
      this.interp.set(KING_ID_BASE + slot, m.t, p, q);
      view.setBody(KING_ID_BASE + slot, p, q);
    });
    const projIds = new Set(m.projs.map((p) => p.id));
    for (const id of [...view.projs.keys()]) if (!projIds.has(id)) view.apply({ e: 'projEnd', id });
    for (const pr of m.projs) if (!view.projs.has(pr.id)) view.apply({ e: 'proj', id: pr.id, ammo: pr.ammo, owner: pr.owner, p: [0, -50, 0], scale: pr.scale });
    for (const slot of [0, 1, 2, 3]) view.setShield(slot, m.shields.includes(slot));
    for (const p of m.s.players) {
      const was = view.kingAlive.get(p.slot);
      if (was && !p.alive) view.apply({ e: 'king', slot: p.slot, cause: (p.cause as never) ?? 'fell', by: -1 });
    }
    this.game.setLavaVisual(m.lava);
    this.setState(m.s);
    this.ready = true;
    this.fullsReceived++;
  }

  // ---------- MatchSource ----------

  send(input: PlayerInput) {
    if (this.you === null) return;
    const msg: GameMsg = { k: 'in' };
    if (input.aim) msg.aim = aimToArr(input.aim);
    if (input.selected !== undefined) msg.sel = input.selected;
    if (input.target !== undefined) msg.tgt = input.target;
    if (input.locked) msg.lk = true;
    this.relay('host', msg);
    // La puntería también va directa a todos para que vean girar la catapulta.
    const me = this.state.players.find((p) => p.slot === this.you);
    if (input.aim && me && performance.now() - this.lastAimSent > 90) {
      this.lastAimSent = performance.now();
      this.relay('all', { k: 'aim', slot: this.you, a: aimToArr(input.aim), sel: input.selected ?? me.selected, tgt: input.target ?? me.target });
    }
    // Respuesta inmediata en la propia interfaz mientras llega el estado del anfitrión.
    if (me) {
      if (input.aim) me.aim = input.aim;
      if (input.selected !== undefined) me.selected = input.selected;
      if (input.target !== undefined) me.target = input.target;
      if (input.locked) me.locked = true;
    }
  }

  // Segundos desde el último mensaje del anfitrión.
  get age() {
    return this.interp.age;
  }

  remaining() {
    return Math.max(0, this.deadline - performance.now() / 1000);
  }

  // Reproduce poses y eventos en la línea temporal del anfitrión (con el retraso de interpolación).
  update() {
    const view = this.game.view;
    const rt = this.interp.renderTime();
    const due: SimEvent[] = [];
    while (this.evQueue.length && this.evQueue[0].t <= rt) due.push(...this.evQueue.shift()!.e);
    // Si el reloj aún no está calibrado o la cola crece mucho, no se retrasan los eventos.
    if (this.evQueue.length > 60) while (this.evQueue.length) due.push(...this.evQueue.shift()!.e);
    for (const e of due) {
      if (e.e === 'rm' || e.e === 'projEnd') this.interp.remove(e.id);
      view.apply(e);
    }
    if (due.length) this.onEvents(due);
    this.interp.sample((id, p, q) => view.setBody(id, p, q));
    view.lavaY = this.state.lavaY;
  }

  dispose() {
    for (const f of this.off) f();
  }
}
