import type { MaterialId } from '../../../../shared/materials';
import { createMatch, matchPlayersFromRoom, type MatchState } from '../../../../shared/match';
import type { Quat, Vec3 } from '../../../../shared/math';
import type { RoomState } from '../../../../shared/protocol';
import type { Connection } from '../../net/connection';
import { toast } from '../../ui/dom';
import type { Game, Mode } from '../game';
import { AutoPlayer } from '../match/autoplay';
import type { PlayerInput } from '../match/host';
import { MatchUI, type MatchSource } from '../match/ui';
import { NetClient } from '../net/netClient';
import { NetHost } from '../net/netHost';
import { Sim, type SimEvent } from '../sim/sim';

// Partida en red. El creador de la sala es el anfitrión (ejecuta la física); el resto
// reproduce lo que manda. Si el anfitrión se va, otro jugador hereda la partida con lo
// que tiene en pantalla (migración de anfitrión).
export class OnlineMode implements Mode {
  role: 'host' | 'client' = 'client';
  netHost: NetHost | null = null;
  netClient: NetClient | null = null;
  ui: MatchUI;
  auto: AutoPlayer | null = null;
  migrations = 0;
  private off: (() => void)[] = [];

  constructor(readonly game: Game, readonly conn: Connection, readonly parent: HTMLElement, opts: { autoplay?: boolean } = {}) {
    const room = conn.room!;
    const self = this;
    const src: MatchSource = {
      get state() {
        return self.state;
      },
      get you() {
        return self.you;
      },
      send: (input: PlayerInput) => (this.netHost ? this.netHost.localInput(input) : this.netClient?.send(input)),
      remaining: () => (this.netHost ? this.netHost.state.remaining : (this.netClient?.remaining() ?? 0)),
    };
    if (conn.isHost) this.startHost(room);
    else this.startClient(room);
    this.ui = new MatchUI(game, src, parent, {
      onRematch: () => conn.send({ t: 'lobby' }),
      canRematch: () => conn.isHost,
      onExit: () => {
        conn.close();
        location.hash = '';
        location.reload();
      },
    });
    if (opts.autoplay) this.auto = new AutoPlayer(src, game.view);
    this.off.push(conn.on('room', (r) => this.onRoom(r)));
    game.mode = this;
  }

  get state(): MatchState {
    return this.netHost?.state ?? this.netClient!.state;
  }

  get you(): number | null {
    const id = this.conn.you?.id;
    return this.state.players.find((p) => p.id === id && !p.bot)?.slot ?? null;
  }

  private startHost(room: RoomState) {
    this.role = 'host';
    const seed = (Math.random() * 2 ** 31) >>> 0;
    const state = createMatch(matchPlayersFromRoom(room), seed, room.config.fast);
    const you = state.players.find((p) => p.id === this.conn.you?.id && !p.bot)?.slot ?? null;
    this.netHost = new NetHost(this.game, this.conn, state, you);
  }

  private startClient(room: RoomState) {
    this.role = 'client';
    // Estado provisional con los mismos huecos que calculará el anfitrión, hasta que llegue el suyo.
    const state = createMatch(matchPlayersFromRoom(room), 0, room.config.fast);
    const slots = state.players.map((p) => p.slot);
    this.game.view.slots.splice(0, this.game.view.slots.length, ...slots);
    this.game.view.buildCastles();
    const you = state.players.find((p) => p.id === this.conn.you?.id)?.slot ?? null;
    this.netClient = new NetClient(this.game, this.conn, state, you);
    this.netClient.onEvents = (e) => this.ui?.onSimEvents(e);
  }

  private onRoom(r: RoomState) {
    if (!r.inGame) return;
    // Nos toca ser anfitrión a mitad de partida: heredamos lo que vemos.
    if (this.role === 'client' && r.hostId === this.conn.you?.id) this.migrate();
    // Si hemos vuelto a conectar tras un corte, pedimos el estado completo.
    if (this.role === 'client' && this.conn.status === 'open' && this.netClient && this.netClient.age > 3) this.netClient.hello();
  }

  migrate() {
    const client = this.netClient!;
    const view = this.game.view;
    const state = structuredClone(client.state);
    const blocks: { id: number; mat: MaterialId; size: Vec3; p: Vec3; q: Quat }[] = [];
    for (const [id, it] of view.blocks.items) blocks.push({ id, mat: it.mat, size: it.size, p: it.p, q: it.q });
    const kings = state.players.map((p) => {
      const k = view.kings.get(p.slot);
      return { slot: p.slot, p: (k ? [k.position.x, k.position.y, k.position.z] : [0, -50, 0]) as Vec3, q: (k ? [k.quaternion.x, k.quaternion.y, k.quaternion.z, k.quaternion.w] : [0, 0, 0, 1]) as Quat, alive: p.alive };
    });
    for (const id of [...view.projs.keys()]) view.apply({ e: 'projEnd', id });
    const sim = Sim.restore(
      state.players.map((p) => p.slot),
      blocks,
      kings,
      state.lavaY,
    );
    this.game.adoptSim(sim);
    const you = this.you;
    // El reloj de fases se retoma donde iba.
    state.remaining = Math.max(state.phase === 'aim' ? 3 : 1, client.remaining());
    client.dispose();
    this.netHost = new NetHost(this.game, this.conn, state, you, false);
    this.netClient = null;
    this.role = 'host';
    this.migrations++;
    this.netHost.host.resume();
    toast('El anfitrión se ha ido: ahora la partida la llevas tú');
  }

  // Resumen para las pruebas: lo que este cliente ve ahora mismo.
  summary() {
    const s = this.state;
    const view = this.game.view;
    const kings: Record<number, [number, number, number]> = {};
    for (const p of s.players) {
      const k = view.kings.get(p.slot);
      if (p.alive && k) kings[p.slot] = [k.position.x, k.position.y, k.position.z];
    }
    const perSlot: Record<number, number> = {};
    for (const p of s.players) perSlot[p.slot] = view.blockCount(p.slot);
    return { role: this.role, you: this.you, spectator: this.conn.you?.role === 'spectator', round: s.round, phase: s.phase, winner: s.winner, blocks: view.blockCount(), perSlot, kings, alive: s.players.filter((p) => p.alive).map((p) => p.slot), migrations: this.migrations, fulls: this.netClient?.fullsReceived ?? 0 };
  }

  onSimEvents(events: SimEvent[]) {
    this.netHost?.onSimEvents(events);
    this.ui.onSimEvents(events);
  }

  update(dt: number) {
    this.netHost?.update(dt);
    this.netClient?.update();
    this.auto?.update(dt);
    this.ui.update(dt);
  }

  dispose() {
    for (const f of this.off) f();
    this.netHost?.dispose();
    this.netClient?.dispose();
    this.ui.dispose();
  }
}
