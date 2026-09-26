import { AMMO, type AmmoId } from '../../../../shared/ammo';
import { clampAim, type Aim } from '../../../../shared/ballistics';
import { aimedAt, decideBots, type BotDecision } from '../../../../shared/bot';
import { kingId } from '../../../../shared/castle';
import { castleOrigin } from '../../../../shared/map';
import { lerp, type Vec3 } from '../../../../shared/math';
import { REPLAY_MAX, alivePlayers, buildResults, checkWinner, consumeAmmo, eliminate, impactMaxDuration, replayDuration, resultsDuration, startRound, type MatchState, type PlayerState } from '../../../../shared/match';
import type { Sim, SimEvent } from '../sim/sim';

// Lo que el anfitrión necesita del juego. Lo implementa Game y, en las pruebas de
// equilibrio, un entorno sin navegador.
export interface HostEnv {
  sim: Sim | null;
  timeScale: number;
  startSim(slots: number[]): Sim;
  setLavaVisual(y: number): void;
  simPaused?: boolean; // la física se para durante la repetición
}

export interface PlayerInput {
  aim?: Aim;
  selected?: number;
  target?: number;
  locked?: boolean;
}

interface BotPlan {
  d: BotDecision;
  from: Aim;
  t: number;
}

interface Shot {
  slot: number;
  ammo: AmmoId;
  aim: Aim;
  at: number;
  fired: boolean;
}

const STAGGER = 0.45; // segundos entre disparos para que se vean todos

// Anfitrión autoritativo de la partida: ejecuta la física y decide todo.
// En solitario es el propio jugador; en red, el creador de la sala.
export class MatchHost {
  onState: (s: MatchState) => void = () => {};
  onAim: (slot: number, p: PlayerState) => void = () => {};
  firstAimBonus = 0; // segundos extra en la primera ronda (tutorial en solitario)
  private bots = new Map<number, BotPlan>();
  // A quién apuntaba cada jugador en la ronda anterior (para que los bots devuelvan el golpe).
  private lastTargets = new Map<number, number>();
  private shots: Shot[] = [];
  private impactStart = 0;
  private before = { lost: [0, 0, 0, 0], destroyed: [0, 0, 0, 0], self: [0, 0, 0, 0] };
  private projOwner = new Map<number, number>();
  private closestMiss = new Map<number, number>();
  private roundElims: number[] = [];
  private realT = 0;
  private blocksT = 0;
  private lockGrace = -1;

  constructor(readonly game: HostEnv, public state: MatchState, fresh = true) {
    if (fresh) game.startSim(state.players.map((p) => p.slot));
    const sim = game.sim!;
    sim.setLava(state.lavaY);
    game.setLavaVisual(state.lavaY);
    sim.wind = state.wind;
  }

  get sim() {
    return this.game.sim!;
  }

  private emit() {
    this.state.v++;
    this.onState(this.state);
  }

  player(slot: number) {
    return this.state.players.find((p) => p.slot === slot);
  }

  // ---------- entradas de los jugadores ----------

  setInput(slot: number, input: PlayerInput) {
    const p = this.player(slot);
    const s = this.state;
    if (!p || !p.alive || s.phase !== 'aim' || p.locked) return;
    if (input.aim) p.aim = clampAim(input.aim);
    if (input.selected !== undefined && input.selected >= 0 && input.selected < p.ammo.length) p.selected = input.selected;
    if (input.target !== undefined && s.players.some((q) => q.slot === input.target && q.alive && q.slot !== slot)) p.target = input.target;
    this.onAim(slot, p);
    if (input.locked) {
      p.locked = true;
      this.emit();
    }
  }

  // ---------- fases ----------

  update(rawDt: number) {
    this.realT += rawDt;
    const s = this.state;
    this.blocksT += rawDt;
    if (this.blocksT > 0.5) {
      this.blocksT = 0;
      let changed = false;
      for (const p of s.players) {
        const n = this.sim.blocksAlive(p.slot);
        if (n !== p.blocks) (p.blocks = n), (changed = true);
      }
      if (changed) this.emit();
    }
    switch (s.phase) {
      case 'intro':
        s.remaining -= rawDt;
        if (s.remaining <= 0) this.beginRound();
        break;
      case 'aim':
        s.remaining -= rawDt;
        this.updateBots(rawDt);
        if (alivePlayers(s).every((p) => p.locked)) {
          // Todos listos: medio segundo de margen y a disparar.
          if (this.lockGrace < 0) this.lockGrace = 0.6;
          this.lockGrace -= rawDt;
        }
        if (s.remaining <= 0 || (this.lockGrace >= 0 && this.lockGrace <= 0)) this.beginImpact();
        break;
      case 'impact':
        this.updateImpact();
        break;
      case 'replay':
        s.remaining -= rawDt;
        if (s.remaining <= 0) this.beginResults();
        break;
      case 'results':
        s.remaining -= rawDt;
        if (s.remaining <= 0) this.endResults();
        break;
      case 'over':
        break;
    }
  }

  // Tras heredar la partida de otro anfitrión (migración): si se estaba resolviendo un
  // impacto se da por terminado; si se apuntaba, los bots vuelven a decidir.
  resume() {
    const s = this.state;
    this.sim.wind = s.wind;
    if (s.phase === 'impact') {
      this.shots = [];
      this.endImpact();
    } else if (s.phase === 'replay') {
      this.beginResults();
    } else if (s.phase === 'aim') {
      this.lockGrace = -1;
      this.planBots();
    }
    this.emit();
  }

  private beginRound() {
    const s = this.state;
    const prevLevel = s.lavaLevel;
    startRound(s);
    if (s.round === 1) s.remaining += this.firstAimBonus;
    this.lockGrace = -1;
    this.sim.setLava(s.lavaY);
    this.game.setLavaVisual(s.lavaY);
    this.sim.wind = s.wind;
    if (s.lavaLevel !== prevLevel) this.sim.events.push({ e: 'fx', kind: 'lavaRise', p: [0, s.lavaY, 0] });
    this.planBots();
    this.emit();
  }

  // Los bots deciden al empezar la ronda y "apuntan" poco a poco.
  private planBots() {
    const s = this.state;
    this.bots.clear();
    const kingPos: Record<number, Vec3> = {};
    for (const p of s.players) {
      const r = this.sim.recs.get(kingId(p.slot));
      if (r) {
        const t = r.body.translation();
        kingPos[p.slot] = [t.x, t.y, t.z];
      }
    }
    for (const [slot, d] of decideBots(s, kingPos, this.lastTargets)) {
      this.bots.set(slot, { d, from: { ...this.player(slot)!.aim }, t: 0 });
    }
  }

  private updateBots(dt: number) {
    for (const [slot, plan] of this.bots) {
      const p = this.player(slot);
      if (!p || !p.alive || p.locked) continue;
      plan.t += dt;
      const k = Math.min(1, plan.t / Math.max(0.3, plan.d.lockDelay * 0.8));
      const e = k * k * (3 - 2 * k);
      p.target = plan.d.target;
      p.selected = plan.d.selected;
      p.aim = { yaw: lerp(plan.from.yaw, plan.d.aim.yaw, e), pitch: lerp(plan.from.pitch, plan.d.aim.pitch, e), power: lerp(plan.from.power, plan.d.aim.power, e) };
      this.onAim(slot, p);
      if (plan.t >= plan.d.lockDelay) {
        p.aim = plan.d.aim;
        p.locked = true;
        this.emit();
      }
    }
  }

  private beginImpact() {
    const s = this.state;
    s.phase = 'impact';
    s.remaining = 0;
    this.shots = [];
    this.roundElims = [];
    const st = this.sim.stats;
    this.before = { lost: [...st.lost], destroyed: [...st.destroyed], self: [...st.self] };
    let i = 0;
    this.lastTargets.clear();
    for (const p of alivePlayers(s).sort((a, b) => a.slot - b.slot)) {
      p.locked = true;
      this.lastTargets.set(p.slot, aimedAt(s, p));
      const ammo = consumeAmmo(p);
      if (!ammo) continue;
      p.stats.shots++;
      this.shots.push({ slot: p.slot, ammo, aim: { ...p.aim }, at: i++ * STAGGER, fired: false });
    }
    this.impactStart = this.sim.time;
    this.emit();
  }

  private updateImpact() {
    const t = this.sim.time - this.impactStart;
    for (const sh of this.shots) {
      if (sh.fired || t < sh.at) continue;
      sh.fired = true;
      if (!this.player(sh.slot)?.alive) continue;
      this.sim.events.push({ e: 'fx', kind: 'fire', p: [0, 0, 0], slot: sh.slot });
      this.sim.launch(sh.slot, sh.ammo, sh.aim);
    }
    const allFired = this.shots.every((s) => s.fired);
    const calm = allFired && t > 2.2 && this.sim.projectilesActive() === 0 && this.sim.isSettled();
    if (calm || t > impactMaxDuration(this.state) + this.shots.length * STAGGER) this.endImpact();
  }

  private endImpact() {
    const s = this.state;
    const st = this.sim.stats;
    const lost: Record<number, number> = {};
    const dealt: Record<number, number> = {};
    for (const p of s.players) {
      lost[p.slot] = st.lost[p.slot] - this.before.lost[p.slot];
      dealt[p.slot] = st.destroyed[p.slot] - this.before.destroyed[p.slot];
      p.stats.lost += lost[p.slot];
      p.stats.dealt += dealt[p.slot];
      p.stats.bestShot = Math.max(p.stats.bestShot, dealt[p.slot]);
      const shot = this.shots.find((x) => x.slot === p.slot);
      if (shot && !AMMO[shot.ammo].defensive && dealt[p.slot] === 0) {
        p.stats.whiffs++;
        const miss = this.closestMiss.get(p.slot);
        if (miss !== undefined) p.stats.worstMiss = Math.max(p.stats.worstMiss, Math.round(miss));
      }
      p.stats.selfHits += st.self[p.slot] - this.before.self[p.slot];
      p.blocks = this.sim.blocksAlive(p.slot);
    }
    this.closestMiss.clear();
    s.results = buildResults(s, lost, dealt, this.roundElims);
    // Si ha caído algún rey, antes de los resultados se repite su caída en todos los clientes.
    if (this.roundElims.length) {
      s.phase = 'replay';
      s.replay = this.roundElims.slice(0, REPLAY_MAX);
      s.remaining = replayDuration(s) * s.replay.length;
      this.game.simPaused = true;
      this.emit();
      return;
    }
    this.beginResults();
  }

  private beginResults() {
    const s = this.state;
    s.phase = 'results';
    s.replay = null;
    s.remaining = resultsDuration(s);
    this.game.simPaused = false;
    this.emit();
  }

  private endResults() {
    const s = this.state;
    const w = checkWinner(s);
    if (w !== null) {
      s.winner = w;
      s.phase = 'over';
      this.emit();
      return;
    }
    this.beginRound();
  }

  // ---------- eventos de la simulación ----------

  onSimEvents(events: SimEvent[]) {
    for (const e of events) {
      if (e.e === 'proj') this.projOwner.set(e.id, e.owner);
      if (e.e === 'projEnd' && e.p) {
        // A qué distancia del castillo rival más cercano acabó (para el "disparo más ridículo").
        const owner = this.projOwner.get(e.id);
        if (owner === undefined) continue;
        let best = Infinity;
        for (const q of this.state.players) {
          if (q.slot === owner) continue;
          const o = castleOrigin(q.slot);
          best = Math.min(best, Math.max(0, Math.hypot(e.p[0] - o[0], e.p[2] - o[2]) - 6.5));
        }
        this.closestMiss.set(owner, Math.min(this.closestMiss.get(owner) ?? Infinity, best));
        continue;
      }
      if (e.e !== 'king') continue;
      const p = this.player(e.slot);
      if (!p?.alive) continue;
      eliminate(this.state, e.slot, e.cause, e.by);
      this.roundElims.push(e.slot);
      this.emit();
      // Si ya solo queda uno fuera de la fase de impacto (p. ej. por la lava), se cierra pronto.
      if (this.state.phase === 'aim' && alivePlayers(this.state).length <= 1) this.state.remaining = Math.min(this.state.remaining, 0.5);
    }
  }
}
