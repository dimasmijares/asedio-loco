import * as THREE from 'three';
import { AMMO } from '../../../../shared/ammo';
import type { Aim } from '../../../../shared/ballistics';
import { BLOCKS_PER_CASTLE } from '../../../../shared/castle';
import { castleOrigin, launchPoint } from '../../../../shared/map';
import type { MatchState, PlayerState } from '../../../../shared/match';
import { PLAYER_STYLES } from '../../../../shared/players';
import { h } from '../../ui/dom';
import { Hud } from '../../ui/hud';
import { Tutorial, tutorialPending } from '../../ui/tutorial';
import { sfx } from '../audio';
import { Director } from '../director';
import type { Game } from '../game';
import { causeText } from '../modes/sandbox';
import type { SimEvent } from '../sim/sim';
import type { PlayerInput } from './host';

// Lo que la interfaz necesita de la partida, venga del anfitrión local o de la red.
export interface MatchSource {
  readonly state: MatchState;
  readonly you: number | null; // hueco propio, o null si eres espectador
  send(input: PlayerInput): void;
  remaining(): number;
}

export interface MatchUIOptions {
  onRematch?: () => void;
  onExit?: () => void;
  canRematch?: () => boolean;
}

const nameOf = (s: MatchState, slot: number) => s.players.find((p) => p.slot === slot)?.name ?? '¿?';

export class MatchUI {
  hud: Hud;
  director: Director;
  private last = { round: 0, phase: '', alive: new Map<number, boolean>(), lava: 0, wind: false };
  private overPanel: HTMLElement | null = null;
  private resultsBox: HTMLElement;
  private aimSent = 0;
  private lastTick = -1;
  tutorial: Tutorial | null = null;
  private pendingAim: Aim | null = null;

  constructor(readonly game: Game, readonly src: MatchSource, readonly parent: HTMLElement, readonly opts: MatchUIOptions = {}) {
    this.hud = new Hud(parent);
    this.director = new Director(game.view, game.rig);
    this.resultsBox = h('div', { class: 'results-box', id: 'results-box' });
    this.hud.root.append(this.resultsBox);
    const input = game.input;
    input.onChange = (a) => this.onAim(a);
    input.onRelease = (a) => this.onAim(a, true);
    input.onConfirm = () => this.lock();
    input.onCycleTarget = (d) => this.cycleTarget(d);
    input.onSelectSlot = (i) => this.selectAmmo(i);
    this.hud.confirmBtn.onclick = () => this.lock();
    this.hud.setHelp('Arrastra hacia atrás para tensar y apuntar\nRueda / W-S: elevación · A-D: girar\nQ / E: cambiar de castillo objetivo · 1 / 2: munición\nEspacio: ¡listo! · Botón derecho: mirar');
    const me = this.me();
    if (me) input.setAim(me.aim);
    for (const p of src.state.players) this.last.alive.set(p.slot, p.alive);
    if (src.you !== null && tutorialPending()) this.tutorial = new Tutorial(this.hud.root);
    game.rig.orbit(new THREE.Vector3(0, 2, 0), 58, 32, 0.08);
  }

  me(): PlayerState | undefined {
    const you = this.src.you;
    return you === null ? undefined : this.src.state.players.find((p) => p.slot === you);
  }

  private canAim() {
    const me = this.me();
    return !!me && me.alive && !me.locked && this.src.state.phase === 'aim';
  }

  private onAim(a: Aim, release = false) {
    if (!this.canAim()) return;
    if (release) this.tutorial?.event('drag');
    else if (!this.game.input.dragging) this.tutorial?.event('adjust');
    this.pendingAim = a;
    // Se manda a ~10 Hz (y siempre al soltar).
    if (release || performance.now() - this.aimSent > 100) this.flushAim();
  }

  private flushAim() {
    if (!this.pendingAim) return;
    this.src.send({ aim: this.pendingAim });
    this.aimSent = performance.now();
    this.pendingAim = null;
  }

  lock() {
    if (!this.canAim()) return;
    this.tutorial?.event('lock');
    this.src.send({ aim: this.game.input.aim, locked: true });
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
      if (e.e === 'fx' && e.kind === 'lavaRise') this.hud.showBanner('¡LA LAVA SUBE!', 'Se come las bases de los castillos', 2200, 'bad');
      // La cámara se va al rey que cae (el anfitrión pone además cámara lenta).
      if (e.e === 'king') this.director.spotlight(() => this.game.view.kingPos(e.slot), 2.6);
    }
  }

  update(dt: number) {
    const g = this.game;
    const s = this.src.state;
    const me = this.me();
    const input = g.input;
    if (this.pendingAim && performance.now() - this.aimSent > 100) this.flushAim();

    // Cambios de fase: avisos y cámara.
    if (s.phase !== this.last.phase || s.round !== this.last.round) this.onPhase(s);
    for (const p of s.players) {
      const was = this.last.alive.get(p.slot);
      if (was && !p.alive) this.hud.showBanner(p.slot === this.src.you ? '¡TU REY HA CAÍDO!' : '¡REY ELIMINADO!', `${p.name}: ${causeText(p.cause ?? '')}`, 2600, 'bad');
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
    this.tutorial?.update(dt, this.canAim());
    if (this.tutorial?.done) this.tutorial = null;
    if (this.canAim() && me) {
      g.preview.show(launchPoint(me.slot), input.aim, me.ammo[me.selected] ?? 'rock', s.wind, PLAYER_STYLES[me.slot].color);
      this.hud.setAimInfo(input.aim, me.ammo[me.selected]);
    } else {
      g.preview.hide();
      this.hud.setAimInfo(null);
    }

    // Cámara.
    const directing = s.phase === 'impact' || s.phase === 'results' || this.director.spotActive ? this.director.update(dt) : false;
    if (!directing) {
      if (s.phase === 'aim' && me?.alive) g.rig.aim(new THREE.Vector3(...launchPoint(me.slot)), input.aim.yaw);
      else if (s.phase === 'over' && s.winner !== null && s.winner >= 0) {
        const o = castleOrigin(s.winner);
        if (g.rig.mode !== 'orbit' || g.rig.radius !== 18) g.rig.orbit(new THREE.Vector3(o[0], 2, o[2]), 18, 11, 0.25);
      } else if (g.rig.mode !== 'orbit') g.rig.orbit(new THREE.Vector3(0, 2, 0), 50, 30, 0.06);
    }

    // HUD.
    const rem = this.src.remaining();
    // Cuenta atrás sonora en los últimos segundos del apuntado.
    const sec = Math.ceil(rem);
    if (s.phase === 'aim' && sec <= 3 && sec >= 1 && sec !== this.lastTick) sfx.tick(sec === 1);
    this.lastTick = s.phase === 'aim' ? sec : -1;
    this.hud.setTimer(s.phase === 'aim' ? rem : null, s.phase === 'aim' && rem < 4);
    this.hud.setWind(s.wind, Math.atan2(g.rig.target.x - g.rig.pos.x, g.rig.target.z - g.rig.pos.z));
    this.hud.setPlayers(
      s.players.map((p) => ({ slot: p.slot, name: p.name, alive: p.alive, blocks: p.blocks, maxBlocks: BLOCKS_PER_CASTLE, locked: s.phase === 'aim' && p.locked, bot: p.bot, you: p.slot === this.src.you })),
    );
    if (me && me.alive && s.phase === 'aim') this.hud.setAmmo(me.ammo, me.selected, (i) => this.selectAmmo(i));
    else this.hud.setAmmo([], 0, () => {});
    this.hud.showConfirm(!!me?.alive && s.phase === 'aim', !!me?.locked);
    this.hud.setStats(`${g.fps} fps`);
  }

  private onPhase(s: MatchState) {
    const prev = this.last.phase;
    this.last.phase = s.phase;
    if (s.phase === 'aim' && s.round !== this.last.round) {
      this.last.round = s.round;
      const windNow = Math.hypot(s.wind[0], s.wind[2]) > 0.1;
      const sub = windNow && !this.last.wind ? '¡Empieza a soplar el viento!' : this.me()?.alive ? 'Apunta y pulsa ¡Listo!' : 'Eres espectador';
      this.last.wind = windNow;
      this.hud.showBanner(`RONDA ${s.round}`, sub, 1700);
      sfx.fanfare();
      this.director.reset();
      this.resultsBox.replaceChildren();
      const me = this.me();
      if (me) this.game.input.setAim(me.aim);
    }
    if (s.phase === 'impact') this.hud.setPhase(`Ronda ${s.round}`, '¡Fuego!');
    else if (s.phase === 'aim') this.hud.setPhase(`Ronda ${s.round}`, 'Fase de apuntado');
    else if (s.phase === 'intro') this.hud.setPhase('¡Preparados!', 'La partida va a empezar');
    else if (s.phase === 'results') {
      this.hud.setPhase(`Ronda ${s.round}`, 'Resultados');
      this.showResults(s);
    } else if (s.phase === 'over') {
      this.hud.setPhase('Fin de la partida', '');
      if (prev !== 'over') this.showOver(s);
    }
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
          h('span', null, `−${r.lost[p.slot] ?? 0} bloques`),
          (r.dealt[p.slot] ?? 0) > 0 ? h('span', { class: 'muted' }, ` · rompió ${r.dealt[p.slot]}`) : '',
        ),
      );
    this.resultsBox.replaceChildren(h('div', { class: 'res-phrase' }, r.phrase), ...rows);
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
    const stat = (icon: string, label: string, p: PlayerState | undefined, value: string) =>
      p ? h('div', { class: 'stat' }, h('span', { class: 'stat-icon' }, icon), h('div', null, h('div', { class: 'muted' }, label), h('b', null, p.name), ` · ${value}`)) : '';
    const buttons: Node[] = [];
    if (this.opts.onRematch && (this.opts.canRematch?.() ?? true)) {
      const b = h('button', { class: 'primary big', id: 'rematch' }, '¡Revancha!');
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
        h('h2', { class: 'over-title' }, winner ? (youWin ? '¡HAS GANADO!' : `¡Gana ${winner.name}!`) : '¡Empate!'),
        h('p', { class: 'muted' }, `${s.round} rondas · ${winner ? `El rey de ${winner.name} es el último en pie` : 'No queda nadie en pie'}`),
        h(
          'div',
          { class: 'stats' },
          stat('💥', 'Mayor destrozo', destroyer, `${destroyer?.stats.dealt ?? 0} bloques`),
          stat('🎯', 'Mejor disparo', sniper, `${sniper?.stats.bestShot ?? 0} bloques de golpe`),
          clown && clown.stats.whiffs > 0
            ? stat('🤡', 'Disparo más ridículo', clown, clown.stats.worstMiss > 0 ? `falló por ${clown.stats.worstMiss} m (${clown.stats.whiffs} al aire)` : `${clown.stats.whiffs} disparos al aire`)
            : '',
          selfie && selfie.stats.selfHits > 0 ? stat('🙈', 'Autogol', selfie, `se cargó ${selfie.stats.selfHits} bloques propios`) : '',
          stat('🏰', 'Castillo más entero', tank, `${tank?.blocks ?? 0} bloques en pie`),
        ),
        ...buttons,
      ),
    );
    this.parent.append(this.overPanel);
    sfx.fanfare(true);
    if (winner) this.game.view.fx.confetti([...castleOrigin(winner.slot).slice(0, 1), 8, castleOrigin(winner.slot)[2]] as [number, number, number], ['#ffd23f', PLAYER_STYLES[winner.slot].color, '#ffffff']);
  }

  dispose() {
    this.hud.dispose();
    this.overPanel?.remove();
  }
}

export { nameOf, AMMO };
