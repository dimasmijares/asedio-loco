import * as THREE from 'three';
import { AMMO } from '../../../../shared/ammo';
import type { Aim } from '../../../../shared/ballistics';
import { BLOCKS_PER_CASTLE } from '../../../../shared/castle';
import { castleOrigin, launchPoint } from '../../../../shared/map';
import { GOALS, KING_GUARD_ROUNDS, kingGuarded, replayDuration, type MatchState, type PlayerState } from '../../../../shared/match';
import { goalPoint } from '../../../../shared/bot';
import { rng } from '../../../../shared/math';
import type { Vec3 } from '../../../../shared/math';
import { PLAYER_STYLES } from '../../../../shared/players';
import { h } from '../../ui/dom';
import { Hud, type HelpRow } from '../../ui/hud';
import { Tutorial, tutorialPending } from '../../ui/tutorial';
import { sfx } from '../audio';
import { Director } from '../director';
import { replayCamera, shotCamera, type ReplayClip } from '../replay';
import { AttackArcs } from '../render/arcs';
import type { Game } from '../game';
import type { ViewSnapshot } from '../view';
import { causeText } from '../modes/sandbox';
import type { SimEvent } from '../sim/sim';
import type { PlayerInput } from './host';

// Lo que la interfaz necesita de la partida, venga del anfitrión local o de la red.
export interface MatchSource {
  readonly state: MatchState;
  readonly you: number | null; // hueco propio, o null si eres espectador
  send(input: PlayerInput): void;
  remaining(): number;
  // Si un jugador humano sigue conectado (en red; en solitario no hace falta).
  connected?(playerId: string): boolean;
}

export interface MatchUIOptions {
  onRematch?: () => void;
  onExit?: () => void;
  canRematch?: () => boolean;
}

export const AIM_HELP: HelpRow[] = [
  [['Clic dcho.', 'ratón'], 'apuntar'],
  [['Espacio', 'clic izdo.'], 'mantener: cargar · soltar: disparar'],
  [['A', 'D', 'W', 'S'], 'ajuste fino'],
  [['Q', 'E'], 'castillo objetivo'],
  [['1', '2', '3'], 'munición'],
  [['Rueda'], 'acercar la cámara'],
];

export const TOUCH_HELP: HelpRow[] = [
  [['arrastrar'], 'apuntar'],
  [['🔥'], 'mantener: cargar · soltar: disparar'],
  [['◀', '▶'], 'castillo objetivo'],
  [['tarjeta'], 'munición'],
  [['pellizcar'], 'acercar la cámara'],
];

const nameOf = (s: MatchState, slot: number) => s.players.find((p) => p.slot === slot)?.name ?? '¿?';

export class MatchUI {
  hud: Hud;
  director: Director;
  private last = { round: 0, phase: '', alive: new Map<number, boolean>(), lava: 0, wind: false };
  private overPanel: HTMLElement | null = null;
  private resultsBox: HTMLElement;
  // Daño de la ronda sobre cada castillo (WRK-TASK-036): etiquetas proyectadas a la pantalla.
  private dmgLayer = h('div', { class: 'dmg-labels', id: 'dmg-labels' });
  private dmgLabels: { el: HTMLElement; p: THREE.Vector3 }[] = [];
  private dmgUntil = 0;
  // Quién ataca a quién durante la cuenta atrás (WRK-TASK-045).
  arcs: AttackArcs;
  arcsShown = { round: 0, pairs: '' }; // últimos arcos mostrados, «atacante>objetivo» (para las pruebas)
  private aimSent = 0;
  private lastTick = -1;
  tutorial: Tutorial | null = null;
  private pendingAim: Aim | null = null;
  // Repetición de reyes caídos (fase 'replay').
  private replayQueue: number[] = [];
  replaysSeen = 0; // fases de repetición vistas (para las pruebas)
  private replaySlot = -1;
  private replayT = 0;
  private replayCam = { from: new THREE.Vector3(), at: new THREE.Vector3() };
  // Mejor disparo de la partida (WRK-TASK-047): foto del escenario al empezar su impacto y tramo
  // grabado, para repetirlo antes de la pantalla final. Cada cliente usa lo que él mismo vio.
  private impactSnap: ViewSnapshot | null = null;
  private impactT0 = 0;
  best: { slot: number; dealt: number; round: number; lavaY: number; snap: ViewSnapshot; clip: ReplayClip; focus: THREE.Vector3 } | null = null;
  private final: { end: ViewSnapshot; skip: HTMLElement; off: () => void } | null = null;
  bestShown = 0; // repeticiones del mejor disparo empezadas (para las pruebas)
  // Espectador activo (WRK-TASK-042): el eliminado o el espectador elige qué castillo sigue la
  // cámara durante el apuntado; -1 es el plano general.
  watchSlot = -1;
  private watchKeys = (e: KeyboardEvent) => {
    if (!this.watching() || (e.target as HTMLElement)?.tagName === 'INPUT') return;
    const d = e.code === 'KeyE' || e.code === 'ArrowRight' || (e.code === 'Tab' && !e.shiftKey) ? 1 : e.code === 'KeyQ' || e.code === 'ArrowLeft' || (e.code === 'Tab' && e.shiftKey) ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    this.cycleWatch(d);
  };

  constructor(readonly game: Game, readonly src: MatchSource, readonly parent: HTMLElement, readonly opts: MatchUIOptions = {}) {
    this.hud = new Hud(parent);
    this.director = new Director(game.view, game.rig);
    this.resultsBox = h('div', { class: 'results-box', id: 'results-box' });
    this.hud.root.append(this.resultsBox, this.dmgLayer);
    this.arcs = new AttackArcs(game.stage.scene);
    const input = game.input;
    input.onChange = (a) => this.onAim(a);
    input.onFire = (a) => this.fire(a);
    input.onTooShort = () => this.hud.showBanner('Mantén pulsado', this.hud.touchUi ? 'el botón 🔥: la fuerza aumenta mientras lo mantienes' : 'Espacio o el clic izquierdo: la fuerza aumenta mientras lo mantienes', 1300);
    input.onCycleTarget = (d) => this.cycleTarget(d);
    this.hud.onTarget = (d) => (this.watching() ? this.cycleWatch(d) : this.cycleTarget(d));
    addEventListener('keydown', this.watchKeys);
    input.onSelectSlot = (i) => this.selectAmmo(i);
    this.hud.bindCharge(input);
    this.hud.setHelp(this.hud.touchUi ? TOUCH_HELP : AIM_HELP);
    const me = this.me();
    if (me) input.setAim(me.aim);
    for (const p of src.state.players) this.last.alive.set(p.slot, p.alive);
    if (src.you !== null && tutorialPending()) this.tutorial = new Tutorial(this.hud.root);
    game.rig.orbit(new THREE.Vector3(0, 2, 0), 66, 36, 0.08);
  }

  me(): PlayerState | undefined {
    const you = this.src.you;
    return you === null ? undefined : this.src.state.players.find((p) => p.slot === you);
  }

  // Sin rey vivo (eliminado o espectador) mientras sigue la partida.
  watching() {
    const me = this.me();
    return (!me || !me.alive) && this.src.state.phase !== 'over';
  }

  // Plano general y castillos en pie, en orden.
  cycleWatch(dir: number) {
    const order = [-1, ...this.src.state.players.filter((p) => p.alive).map((p) => p.slot)];
    const i = Math.max(0, order.indexOf(this.watchSlot));
    this.watchSlot = order[(i + dir + order.length) % order.length];
  }

  private canAim() {
    const me = this.me();
    return !!me && me.alive && !me.locked && this.src.state.phase === 'aim';
  }

  private onAim(a: Aim) {
    if (!this.canAim()) return;
    if (this.game.input.aiming) this.tutorial?.event('aim');
    this.pendingAim = a;
    // Se manda a ~10 Hz: los demás ven tu catapulta girar y tensarse mientras cargas.
    if (performance.now() - this.aimSent > 100) this.flushAim();
  }

  private flushAim() {
    if (!this.pendingAim) return;
    this.src.send({ aim: this.pendingAim });
    this.aimSent = performance.now();
    this.pendingAim = null;
  }

  // Al soltar Espacio o el clic izquierdo: el disparo queda preparado y ya no se puede cambiar en esta ronda.
  fire(a: Aim) {
    if (!this.canAim()) return;
    this.tutorial?.event('fire');
    this.pendingAim = null;
    this.src.send({ aim: a, locked: true });
  }

  selectAmmo(i: number) {
    const me = this.me();
    if (!me || !this.canAim() || i >= me.ammo.length) return;
    this.tutorial?.event('adjust');
    this.src.send({ selected: i });
  }

  cycleTarget(dir: number) {
    const me = this.me();
    if (!me || !this.canAim()) return;
    const rivals = this.src.state.players.filter((p) => p.alive && p.slot !== me.slot).map((p) => p.slot);
    if (!rivals.length) return;
    const i = rivals.indexOf(me.target);
    const next = rivals[(i + dir + rivals.length) % rivals.length];
    this.tutorial?.event('adjust');
    const lp = launchPoint(me.slot);
    const o = castleOrigin(next);
    const aim = { ...this.game.input.aim, yaw: Math.atan2(o[0] - lp[0], o[2] - lp[2]) };
    this.game.input.setAim(aim);
    this.src.send({ target: next, aim });
  }

  onSimEvents(events: SimEvent[]) {
    for (const e of events) {
      if (e.e === 'fx' && e.kind === 'lavaRise' && e.p[1] > -0.3) this.hud.showBanner('LA LAVA SUBE', 'Destruye los bloques que alcanza', 2200, 'bad');
      if (e.e === 'fx' && e.kind === 'kingGuard' && e.slot !== undefined)
        this.hud.showBanner('ESCUDO REAL', `🛡️ ${e.slot === this.src.you ? 'Tu rey se salva' : `El rey de ${nameOf(this.src.state, e.slot)} se salva`}: nadie cae hasta la ronda ${KING_GUARD_ROUNDS + 1}`, 2200, 'guard');
    }
  }

  update(dt: number) {
    this.placeDamage();
    this.arcs.update(dt);
    const g = this.game;
    const s = this.src.state;
    g.view.setKingGuard(kingGuarded(s));
    g.fullRate = s.phase === 'countdown' || s.phase === 'impact' || s.phase === 'replay';
    const me = this.me();
    const input = g.input;
    if (this.pendingAim && performance.now() - this.aimSent > 100) this.flushAim();

    // Cambios de fase: avisos y cámara.
    if (s.phase !== this.last.phase || s.round !== this.last.round) this.onPhase(s);
    for (const p of s.players) {
      const was = this.last.alive.get(p.slot);
      if (was && !p.alive) this.hud.showBanner(p.slot === this.src.you ? 'TU REY HA CAÍDO' : 'REY ELIMINADO', `${p.name}: ${causeText(p.cause ?? '')}`, 2600, 'bad');
      this.last.alive.set(p.slot, p.alive);
    }

    // Catapultas: la tuya sigue a tu ratón; las demás, a lo que apuntan sus dueños.
    for (const p of s.players) {
      const cat = g.view.catapults.get(p.slot);
      if (!cat) continue;
      const a = p.slot === this.src.you && this.canAim() ? input.aim : p.aim;
      cat.setYaw(a.yaw);
      cat.setPull(p.alive ? a.power : 0);
    }

    input.enabled = this.canAim();
    g.rig.lookEnabled = !this.canAim();
    this.hud.setCharge(input.charging ? input.aim.power : null);
    this.hud.showHelp(this.canAim());
    this.tutorial?.update(dt, this.canAim());
    if (this.tutorial?.done) this.tutorial = null;
    if (this.canAim() && me) {
      g.preview.show(launchPoint(me.slot), input.aim, me.ammo[me.selected] ?? 'rock', s.wind, PLAYER_STYLES[me.slot].color, input.charging ? 'charge' : 'guide');
      this.hud.setAimInfo(input.aim, me.ammo[me.selected]);
    } else {
      g.preview.hide();
      this.hud.setAimInfo(null);
    }

    // Cámara.
    // Repetición: la vista reproduce lo grabado y la cámara gira despacio alrededor del rey.
    if (g.view.replaying) {
      this.replayT += dt;
      g.view.stepReplay(dt);
      const k = this.final ? this.best?.focus : g.view.kingPos(this.replaySlot);
      if (k) {
        (this.final ? shotCamera : replayCamera)(k, this.replayT, this.replayCam);
        g.rig.watch(this.replayCam.at, this.replayCam.from);
        g.rig.sharpness = this.replayT < 0.05 ? 50 : 5;
      }
      if (g.view.replaying.done && this.replayT > 0.3) {
        if (this.final) this.endFinal();
        else this.nextReplay(s);
      }
    }
    // Cuenta atrás: la cámara se aleja hasta el plano general. Durante los disparos, panorámica.
    const directing = s.phase === 'countdown' ? this.director.countdown(dt) : s.phase === 'impact' || s.phase === 'results' ? this.director.update(dt) : false;
    if (!directing && !g.view.replaying) {
      if (s.phase === 'aim' && me?.alive) g.rig.aim(new THREE.Vector3(...launchPoint(me.slot)), input.aim.yaw);
      else if (s.phase === 'aim' && this.watchSlot >= 0) {
        const o = castleOrigin(this.watchSlot);
        if (g.rig.mode !== 'orbit' || g.rig.radius !== 21 || Math.hypot(g.rig.center.x - o[0], g.rig.center.z - o[2]) > 0.1) g.rig.orbit(new THREE.Vector3(o[0], 2, o[2]), 21, 13, 0.05);
      } else if (s.phase === 'over' && s.winner !== null && s.winner >= 0) {
        const o = castleOrigin(s.winner);
        if (g.rig.mode !== 'orbit' || g.rig.radius !== 18) g.rig.orbit(new THREE.Vector3(o[0], 2, o[2]), 18, 11, 0.25);
      } else if (g.rig.mode !== 'orbit') g.rig.orbit(new THREE.Vector3(0, 2, 0), 57, 34, 0.06);
    }

    // HUD.
    const rem = this.src.remaining();
    // Cuenta atrás antes de disparar: número grande y un pitido por segundo.
    if (s.phase === 'countdown') {
      const n = Math.max(1, Math.ceil(rem));
      this.hud.setCountdown(String(n));
      if (n !== this.lastTick) sfx.tick(n === 1);
      this.lastTick = n;
    } else this.lastTick = -1;
    this.hud.setTimer(s.phase === 'aim' ? rem : null, s.phase === 'aim' && rem < 4);
    this.hud.setWind(s.wind, Math.atan2(g.rig.target.x - g.rig.pos.x, g.rig.target.z - g.rig.pos.z));
    this.hud.setPlayers(
      s.players.map((p) => ({ slot: p.slot, name: p.name, alive: p.alive, blocks: p.blocks, maxBlocks: BLOCKS_PER_CASTLE, locked: s.phase === 'aim' && p.locked, bot: p.bot || p.auto, you: p.slot === this.src.you, connected: p.bot ? true : (this.src.connected?.(p.id) ?? true) })),
    );
    if (me && me.alive && s.phase === 'aim') this.hud.setAmmo(me.ammo, me.selected, (i) => this.selectAmmo(i));
    else this.hud.setAmmo([], 0, () => {});
    this.hud.showConfirm(!!me?.alive && s.phase === 'aim', !!me?.locked);
    const watch = this.watching() && s.phase === 'aim';
    this.hud.showTargetButtons(this.canAim() || watch, watch);
    this.hud.setWatch(watch ? (this.watchSlot < 0 ? 'Plano general' : `Castillo de ${nameOf(s, this.watchSlot)}`) : null);
    this.hud.setStats(`${g.fps} fps`);
    // Objetivo secundario (WRK-TASK-043): chapa en la esquina y dianas en los rivales al apuntar.
    const goal = s.goal && s.phase === 'aim' ? GOALS[s.goal] : null;
    this.hud.setGoal(goal ? goal.short : null, goal ? `${goal.text}: premio, una carta rara o épica en la ronda siguiente` : '');
    g.view.setGoalMarks(goal && s.goal ? s.players.filter((p) => p.alive && p.slot !== this.src.you).map((p) => goalPoint(s.goal!, p.slot, rng(p.slot + 1))).filter((p): p is Vec3 => !!p) : []);
  }

  // Siguiente rey de la cola de repeticiones (si no hay nada grabado de él, se salta).
  private nextReplay(s: MatchState) {
    const view = this.game.view;
    while (this.replayQueue.length) {
      const slot = this.replayQueue.shift()!;
      const t = view.recorder.deathTime(slot);
      if (t === null) continue;
      // 2,6 s antes de la caída y 0,8 s después, estirados para llenar su parte de la fase.
      const t0 = t - 2.6;
      const t1 = t + 0.8;
      const speed = (t1 - t0) / Math.max(0.5, replayDuration(s) - 0.4);
      if (!view.startReplay(t0, t1, speed, [slot])) continue;
      this.replaySlot = slot;
      this.replayT = 0;
      const cause = s.players.find((p) => p.slot === slot)?.cause;
      this.hud.showBanner('REPETICIÓN', cause === 'lava' ? `La lava se lleva al rey de ${nameOf(s, slot)}` : `Caída del rey de ${nameOf(s, slot)}`, 1800);
      return;
    }
  }

  private onPhase(s: MatchState) {
    const prev = this.last.phase;
    this.last.phase = s.phase;
    if (s.phase === 'replay' && prev !== 'replay') {
      this.replaysSeen++;
      this.replayQueue = [...(s.replay ?? [])];
      this.hud.root.classList.add('replaying');
      this.nextReplay(s);
    } else if (s.phase !== 'replay' && prev === 'replay') {
      this.game.view.endReplay();
      this.hud.root.classList.remove('replaying');
    }
    if (s.phase === 'countdown' && prev !== 'countdown') {
      const castles = s.players.filter((p) => p.alive).map((p) => new THREE.Vector3(...castleOrigin(p.slot)));
      // Si juegas, el plano va de tu castillo al que apuntas (WRK-TASK-063).
      const me = this.me();
      const mine = me?.alive && me.target !== undefined && me.target !== me.slot ? { slot: me.slot, home: new THREE.Vector3(...castleOrigin(me.slot)), target: new THREE.Vector3(...castleOrigin(me.target)) } : undefined;
      this.director.startCountdown(castles, this.src.remaining(), mine);
      this.showArcs(s);
    } else if (s.phase !== 'countdown' && prev === 'countdown') this.arcs.hide();
    // 3, 2, 1 y ¡FUEGO!: el cuarto tiempo dura lo mismo que los otros y coincide con los disparos.
    if (s.phase === 'impact' && prev === 'countdown') {
      this.hud.setCountdown('¡FUEGO!', 1000);
      sfx.fuego();
      this.impactSnap = this.game.view.snapshot();
      this.impactT0 = this.game.view.time;
    }
    if (prev === 'impact' && s.phase !== 'impact') this.keepBest(s);
    else if (s.phase !== 'countdown') this.hud.setCountdown(null);
    if (s.phase === 'aim' && s.round !== this.last.round) {
      this.last.round = s.round;
      const windNow = Math.hypot(s.wind[0], s.wind[2]) > 0.1;
      let sub = windNow && !this.last.wind ? 'Empieza a soplar el viento' : this.me()?.alive ? this.hud.touchUi ? 'Arrastra para apuntar · mantén 🔥 para disparar' : 'Clic derecho para apuntar · mantén Espacio o el clic izquierdo para disparar' : this.hud.touchUi ? 'Eres espectador · ◀ ▶ para elegir qué castillo ves' : 'Eres espectador · Q/E o ◀ ▶ para elegir qué castillo ves';
      // Escudo real (WRK-TASK-041): se anuncia al empezar, en la última ronda con él y al acabarse.
      if (s.round === 1) sub += `\n🛡️ Escudo real: ningún rey cae en las rondas 1 y ${KING_GUARD_ROUNDS}`;
      else if (s.round === KING_GUARD_ROUNDS) sub += '\n🛡️ Última ronda con escudo real';
      else if (s.round === KING_GUARD_ROUNDS + 1) sub += '\nSe acaba el escudo real: los reyes ya pueden caer';
      if (s.goal) sub += `\n🎯 Objetivo: ${GOALS[s.goal].text}`;
      if (this.src.you !== null && (s.bonus ?? []).includes(this.src.you)) sub += '\n🎁 Premio por el objetivo: tu primera carta es rara o épica';
      this.last.wind = windNow;
      this.hud.showBanner(`RONDA ${s.round}`, sub, s.round <= KING_GUARD_ROUNDS + 1 ? 2600 : 1700);
      sfx.fanfare();
      this.director.reset();
      this.game.view.recorder.rebase(this.game.view.time);
      this.resultsBox.replaceChildren();
      this.clearDamage();
      const me = this.me();
      if (me) this.game.input.setAim(me.aim);
    }
    if (s.phase === 'impact') this.hud.setPhase(`Ronda ${s.round}`, 'Impacto');
    else if (s.phase === 'replay') this.hud.setPhase(`Ronda ${s.round}`, 'Repetición');
    else if (s.phase === 'aim') this.hud.setPhase(`Ronda ${s.round}`, 'Fase de apuntado');
    else if (s.phase === 'countdown') this.hud.setPhase(`Ronda ${s.round}`, 'Cuenta atrás');
    else if (s.phase === 'intro') this.hud.setPhase('Preparados', 'La partida está a punto de empezar');
    else if (s.phase === 'results') {
      this.hud.setPhase(`Ronda ${s.round}`, 'Resultados');
      this.showResults(s);
    } else if (s.phase === 'over') {
      this.hud.setPhase('Fin de la partida', '');
      if (prev !== 'over') {
        if (!this.startFinal(s)) this.showOver(s);
      }
    }
  }

  // Un arco por jugador vivo, de su catapulta al castillo al que apunta (si sigue en pie).
  private showArcs(s: MatchState) {
    const alive = new Set(s.players.filter((p) => p.alive).map((p) => p.slot));
    const attackers = s.players.filter((p) => p.alive && p.target !== p.slot && alive.has(p.target));
    this.arcsShown = { round: s.round, pairs: attackers.map((p) => `${p.slot}>${p.target}`).join(',') };
    this.arcs.show(
      attackers
        .map((p) => {
          const o = castleOrigin(p.target);
          return { from: launchPoint(p.slot), to: [o[0], o[1] + 5.5, o[2]], color: PLAYER_STYLES[p.slot].color };
        }),
    );
  }

  // Al acabar un impacto: si alguien ha superado el mejor disparo de la partida, se guarda su tramo.
  private keepBest(s: MatchState) {
    const r = s.results;
    const snap = this.impactSnap;
    this.impactSnap = null;
    if (!r || !snap) return;
    let slot = -1;
    let dealt = this.best?.dealt ?? 0;
    for (const p of s.players) if ((r.dealt[p.slot] ?? 0) > dealt) (slot = p.slot), (dealt = r.dealt[p.slot]);
    if (slot < 0) return;
    const view = this.game.view;
    const evs = view.recorder.eventsBetween(this.impactT0 - 0.5, view.time);
    const fire = evs.find((x) => x.e.e === 'fx' && x.e.kind === 'fire' && x.e.slot === slot)?.t ?? this.impactT0;
    // Dónde acabó su proyectil (o, si no se sabe, el castillo que más perdió en la ronda).
    const mine = new Set(evs.flatMap((x) => (x.e.e === 'proj' && x.e.owner === slot ? [x.e.id] : [])));
    const end = evs.find((x) => x.e.e === 'projEnd' && mine.has(x.e.id) && x.e.p)?.e as { p?: Vec3 } | undefined;
    const hurt = s.players.reduce((a, b) => ((r.lost[b.slot] ?? 0) > (r.lost[a.slot] ?? 0) ? b : a), s.players[0]);
    const focus = new THREE.Vector3(...(end?.p ?? castleOrigin(hurt.slot)));
    focus.y = Math.max(1, Math.min(focus.y, 4));
    const t0 = fire - 0.2;
    const t1 = Math.min(view.time, fire + (s.fast ? 4 : 7));
    this.best = { slot, dealt, round: s.round, lavaY: s.lavaY, snap, clip: view.recorder.clip(t0, t1), focus };
  }

  // Fin de la partida: antes de la pantalla final, el mejor disparo a cámara lenta.
  private startFinal(s: MatchState) {
    const b = this.best;
    if (!b || !b.clip.count) return false;
    const view = this.game.view;
    const end = view.snapshot();
    // Sin los resultados, las cifras ni el humo de la última ronda, y con la lava de entonces.
    this.resultsBox.replaceChildren();
    this.clearDamage();
    view.fx.clearSmoke();
    view.restoreSnapshot(b.snap);
    this.game.setLavaVisual(b.lavaY);
    const span = b.clip.t1 - b.clip.t0;
    view.startClip(b.clip, Math.max(s.fast ? 1 : 0.6, span / (s.fast ? 3 : 9)));
    this.replayT = 0;
    this.bestShown++;
    this.hud.root.classList.add('replaying');
    this.hud.showBanner('MEJOR DISPARO', `${nameOf(s, b.slot)} · ${b.dealt} bloques en la ronda ${b.round}`, 2600);
    const skip = h('button', { class: 'skip-replay', id: 'skip-replay' }, this.hud.touchUi ? 'Toca para saltar' : 'Saltar (cualquier tecla)');
    const go = () => this.endFinal();
    skip.onclick = go;
    // Cualquier tecla o toque la salta; se escucha un instante después para no coger el último clic.
    const t = setTimeout(() => {
      addEventListener('keydown', go);
      addEventListener('pointerdown', go);
    }, 300);
    this.parent.append(skip);
    this.final = {
      end,
      skip,
      off: () => {
        clearTimeout(t);
        removeEventListener('keydown', go);
        removeEventListener('pointerdown', go);
      },
    };
    return true;
  }

  private endFinal() {
    const f = this.final;
    if (!f) return;
    this.final = null;
    f.off();
    f.skip.remove();
    const view = this.game.view;
    view.endReplay();
    view.restoreSnapshot(f.end);
    this.game.setLavaVisual(this.src.state.lavaY);
    this.hud.root.classList.remove('replaying');
    this.showOver(this.src.state);
  }

  private showResults(s: MatchState) {
    const r = s.results;
    if (!r) return;
    const rows = s.players
      .filter((p) => (r.lost[p.slot] ?? 0) > 0 || (r.dealt[p.slot] ?? 0) > 0)
      .sort((a, b) => (r.lost[b.slot] ?? 0) - (r.lost[a.slot] ?? 0))
      .map((p) =>
        h(
          'div',
          { class: 'res-row' },
          h('span', { class: 'banner', style: `background:${PLAYER_STYLES[p.slot].color};color:${PLAYER_STYLES[p.slot].ink};text-shadow:none` }, PLAYER_STYLES[p.slot].glyph),
          h('b', null, p.name),
          h('span', null, (r.lost[p.slot] ?? 0) > 0 ? `−${r.lost[p.slot]} bloques` : 'sin daños'),
          (r.dealt[p.slot] ?? 0) > 0 ? h('span', { class: 'muted' }, ` · destruyó ${r.dealt[p.slot]}`) : '',
        ),
      );
    const done = s.goalDone ?? [];
    const goal = s.goal && done.length ? h('div', { class: 'res-goal', id: 'res-goal' }, `🎯 ${done.map((slot) => nameOf(s, slot)).join(', ')} ${done.length > 1 ? 'cumplen' : 'cumple'} el objetivo: carta rara o épica en la ronda siguiente`) : '';
    this.resultsBox.replaceChildren(h('div', { class: 'res-phrase' }, r.phrase), ...rows, goal);
    this.showDamage(s);
  }

  // Sobre cada castillo que seguía en juego, los bloques que ha perdido en la ronda.
  private showDamage(s: MatchState) {
    const r = s.results;
    if (!r) return;
    this.clearDamage();
    for (const p of s.players) {
      const lost = r.lost[p.slot] ?? 0;
      if (!p.alive && lost === 0) continue;
      const st = PLAYER_STYLES[p.slot];
      const el = h('div', { class: `dmg-label${lost ? '' : ' none'}`, 'data-slot': String(p.slot), style: `--c:${st.color}` }, lost ? `−${lost}` : 'Sin daños');
      const o = castleOrigin(p.slot);
      this.dmgLabels.push({ el, p: new THREE.Vector3(o[0], o[1] + 6.5, o[2]) });
      this.dmgLayer.append(el);
    }
    this.dmgUntil = performance.now() + 2800;
    this.placeDamage();
  }

  private placeDamage() {
    if (!this.dmgLabels.length) return;
    if (performance.now() > this.dmgUntil) return this.clearDamage();
    const cam = this.game.stage.camera;
    const w = innerWidth;
    const hgt = innerHeight;
    const v = new THREE.Vector3();
    const rb = this.resultsBox.getBoundingClientRect();
    for (const { el, p } of this.dmgLabels) {
      v.copy(p).project(cam);
      // Detrás de la cámara la proyección sale invertida: se da la vuelta para anclarla al borde
      // del lado correcto. Si el castillo queda fuera de pantalla, la etiqueta se queda en el borde.
      if (v.z > 1) v.multiplyScalar(-1);
      const mx = Math.min(w / 2 - 8, el.offsetWidth / 2 + 8);
      const my = Math.min(hgt / 2 - 8, el.offsetHeight / 2 + 26); // + lo que sube y baja la animación
      const x = Math.min(w - mx, Math.max(mx, ((v.x + 1) / 2) * w));
      let y = Math.min(hgt - my, Math.max(my, ((1 - v.y) / 2) * hgt));
      let xx = x;
      // Si cae sobre la lista de resultados, baja justo por debajo de ella y, si ahí no cabe (poca
      // altura, móvil en horizontal), se pone al lado de la lista, en el lado que le toca.
      if (x > rb.left - mx && x < rb.right + mx && y > rb.top - my && y < rb.bottom + my) {
        if (rb.bottom + my * 2 <= hgt) y = rb.bottom + my;
        else xx = x < (rb.left + rb.right) / 2 ? Math.max(mx, rb.left - mx) : Math.min(w - mx, rb.right + mx);
      }
      el.style.transform = `translate(${xx}px, ${y}px) translate(-50%, -50%)`;
    }
  }

  private clearDamage() {
    this.dmgLabels = [];
    this.dmgLayer.replaceChildren();
  }

  private showOver(s: MatchState) {
    this.overPanel?.remove();
    const w = s.winner ?? -1;
    const winner = s.players.find((p) => p.slot === w);
    const youWin = w === this.src.you;
    const best = (f: (p: PlayerState) => number) => [...s.players].sort((a, b) => f(b) - f(a))[0];
    const destroyer = best((p) => p.stats.dealt);
    const sniper = best((p) => p.stats.bestShot);
    const clown = best((p) => p.stats.worstMiss * 10 + p.stats.whiffs);
    const tank = best((p) => p.blocks);
    const selfie = best((p) => p.stats.selfHits);
    const goaler = best((p) => p.stats.goals ?? 0);
    const stat = (icon: string, label: string, p: PlayerState | undefined, value: string) =>
      p ? h('div', { class: 'stat' }, h('span', { class: 'stat-icon' }, icon), h('div', null, h('div', { class: 'muted' }, label), h('b', null, p.name), ` · ${value}`)) : '';
    const buttons: Node[] = [];
    if (this.opts.onRematch && (this.opts.canRematch?.() ?? true)) {
      const b = h('button', { class: 'primary big', id: 'rematch' }, 'Revancha');
      b.onclick = () => this.opts.onRematch!();
      buttons.push(b);
    } else if (this.opts.onRematch) buttons.push(h('p', { class: 'muted' }, 'Esperando a que el anfitrión pida la revancha…'));
    if (this.opts.onExit) {
      const b = h('button', { class: 'big', id: 'exit' }, 'Salir');
      b.onclick = () => this.opts.onExit!();
      buttons.push(b);
    }
    this.overPanel = h(
      'div',
      { class: 'overlay over-overlay' },
      h(
        'div',
        { class: 'panel over-panel', id: 'game-over', 'data-winner': String(w), 'data-rounds': String(s.round) },
        h('h2', { class: 'over-title' }, winner ? (youWin ? 'HAS GANADO' : `Gana ${winner.name}`) : 'Empate'),
        h('p', { class: 'muted' }, `${s.round} rondas · ${winner ? `El rey de ${winner.name} es el último en pie` : 'No queda nadie en pie'}`),
        h(
          'div',
          { class: 'stats' },
          stat('💥', 'Mayor destrozo', destroyer, `${destroyer?.stats.dealt ?? 0} bloques`),
          stat('🎯', 'Mejor disparo', sniper, `${sniper?.stats.bestShot ?? 0} bloques en un disparo`),
          clown && clown.stats.whiffs > 0
            ? stat('💨', 'Disparo más desviado', clown, clown.stats.worstMiss > 0 ? `a ${clown.stats.worstMiss} m del objetivo (${clown.stats.whiffs} sin impacto)` : `${clown.stats.whiffs} ${clown.stats.whiffs === 1 ? 'disparo' : 'disparos'} sin impacto`)
            : '',
          selfie && selfie.stats.selfHits > 0 ? stat('⚠️', 'Daño propio', selfie, `${selfie.stats.selfHits} bloques propios destruidos`) : '',
          stat('🏰', 'Castillo más entero', tank, `${tank?.blocks ?? 0} bloques en pie`),
          goaler && (goaler.stats.goals ?? 0) > 0 ? stat('🎯', 'Objetivos cumplidos', goaler, `${goaler.stats.goals} ${goaler.stats.goals === 1 ? 'objetivo' : 'objetivos'}`) : '',
        ),
        ...buttons,
      ),
    );
    this.parent.append(this.overPanel);
    sfx.fanfare(true);
    if (winner) this.game.view.fx.confetti([...castleOrigin(winner.slot).slice(0, 1), 8, castleOrigin(winner.slot)[2]] as [number, number, number], ['#ffd23f', PLAYER_STYLES[winner.slot].color, '#ffffff']);
  }

  dispose() {
    removeEventListener('keydown', this.watchKeys);
    if (this.final) {
      this.final.off();
      this.final.skip.remove();
      this.final = null;
    }
    this.hud.dispose();
    this.arcs.dispose();
    this.overPanel?.remove();
  }
}

export { nameOf, AMMO };
