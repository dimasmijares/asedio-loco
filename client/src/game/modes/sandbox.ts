import * as THREE from 'three';
import { AMMO_IDS, type AmmoId } from '../../../../shared/ammo';
import { AMMO } from '../../../../shared/ammo';
import { solveAim, type Aim } from '../../../../shared/ballistics';
import { BLOCKS_PER_CASTLE, CASTLE_SCALE, buildCastle } from '../../../../shared/castle';
import { castleOrigin, launchPoint, toWorld } from '../../../../shared/map';
import type { Vec3 } from '../../../../shared/math';
import { Hud } from '../../ui/hud';
import type { Game, Mode } from '../game';
import { Director } from '../director';
import type { SimEvent } from '../sim/sim';

// Campo de pruebas (Fase 1): tu catapulta contra un castillo, munición ilimitada.
export class SandboxMode implements Mode {
  slot = 2;
  target = 1;
  ammoIdx = 0;
  hud: Hud;
  private t = 0;
  private director: Director;
  private freeCam = false;
  private keyHandler: (e: KeyboardEvent) => void;

  constructor(readonly game: Game, parent: HTMLElement) {
    this.hud = new Hud(parent);
    this.director = new Director(game.view, game.rig);
    game.startSim([this.target, this.slot]);
    game.mode = this;
    const input = game.input;
    input.enabled = true;
    const lp = launchPoint(this.slot);
    const to = castleOrigin(this.target);
    input.setAim({ yaw: Math.atan2(to[0] - lp[0], to[2] - lp[2]), pitch: 0.7, power: 0.72 });
    input.onChange = (a) => this.onAim(a);
    input.onFire = (a) => this.fire(a);
    input.onTooShort = () => this.hud.showBanner('Mantén Espacio', 'cuanto más tiempo, más fuerza', 1300);
    this.hud.bindCharge(input);
    this.hud.showConfirm(true);
    game.rig.lookEnabled = false;
    this.onAim(input.aim);
    this.hud.setPhase('Campo de pruebas', 'Derriba el castillo como más te guste');
    this.hud.setTimer(null);
    this.hud.setWind(null);
    this.renderAmmo();
    this.hud.alwaysStats = true;
    this.hud.setHelp([
      [['Clic dcho.', 'ratón'], 'apuntar'],
      [['Espacio'], 'mantener: fuerza · soltar: ¡fuego!'],
      [['A', 'D', 'W', 'S'], 'afinar el tiro'],
      [['Mayús'], 'precisión'],
      [['1', '…', '0'], 'munición'],
      [['Rueda'], 'acercar la cámara'],
      [['T'], 'reconstruir'],
      [['C'], 'cámara libre'],
    ]);
    this.keyHandler = (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const n = e.code.match(/^Digit(\d)$/)?.[1];
      if (n !== undefined) {
        const i = n === '0' ? 9 : Number(n) - 1;
        if (i < AMMO_IDS.length) this.selectAmmo(i);
      }
      if (e.code === 'Minus') this.selectAmmo(10);
      if (e.code === 'Equal') this.selectAmmo(11);
      if (e.code === 'KeyT') this.reset();
      if (e.code === 'KeyC') this.freeCam = !this.freeCam;
    };
    window.addEventListener('keydown', this.keyHandler);
  }

  get ammo(): AmmoId {
    return AMMO_IDS[this.ammoIdx];
  }

  selectAmmo(i: number) {
    this.ammoIdx = i;
    this.renderAmmo();
    this.onAim(this.game.input.aim);
  }

  private renderAmmo() {
    this.hud.setAmmo(AMMO_IDS, this.ammoIdx, (i) => this.selectAmmo(i));
  }

  private onAim(a: Aim) {
    const cat = this.game.view.catapults.get(this.slot)!;
    cat.setYaw(a.yaw);
    cat.setPull(a.power);
    const input = this.game.input;
    this.game.preview.show(launchPoint(this.slot), a, this.ammo, this.game.sim?.wind ?? [0, 0, 0], '#ffffff', input.charging ? 'charge' : 'guide');
    this.hud.setCharge(input.charging ? a.power : null);
    if (!input.charging) this.hud.showConfirm(true);
    this.hud.setAimInfo(a, this.ammo);
  }

  fire(a: Aim) {
    const sim = this.game.sim;
    if (!sim) return;
    this.game.view.catapults.get(this.slot)!.fire();
    sim.launch(this.slot, this.ammo, a);
    this.onAim(a);
  }

  // Apunta con precisión a una parte del castillo diana (para pruebas y depuración).
  aimAt(what: 'king' | 'wall' | 'tower', pitch = 0.7) {
    const k = buildCastle(this.target).kingPos;
    const s = CASTLE_SCALE;
    const local: Record<string, Vec3> = { king: [0, 0.3, 0], wall: [0, -1.4 * s, 3.3 * s], tower: [3.25 * s, -0.9 * s, 3.25 * s] };
    const l = local[what];
    const p = toWorld(this.target, [l[0], k[1] + l[1], l[2]]);
    const a = AMMO[this.ammo];
    const aim = solveAim(launchPoint(this.slot), p, pitch, { drag: a.drag || 0.004, windFactor: a.windFactor, wind: this.game.sim?.wind ?? [0, 0, 0] });
    if (aim) {
      this.game.input.setAim(aim);
      this.onAim(aim);
    }
    return aim;
  }

  reset() {
    this.game.startSim([this.target, this.slot]);
    this.director.reset();
  }

  onSimEvents(events: SimEvent[]) {
    for (const e of events) {
      if (e.e === 'king') this.hud.showBanner('¡REY ELIMINADO!', causeText(e.cause), 2200);
    }
  }

  update(dt: number) {
    this.t += dt;
    const g = this.game;
    const view = g.view;
    const directing = this.director.update(dt);
    if (this.freeCam) {
      if (g.rig.mode !== 'orbit') g.rig.orbit(new THREE.Vector3(...castleOrigin(this.target)), 22, 14, 0.15);
    } else if (!directing) {
      g.rig.aim(new THREE.Vector3(...launchPoint(this.slot)), g.input.aim.yaw);
    }
    const alive = g.sim ? g.sim.blocksAlive(this.target) : 0;
    this.hud.setPlayers([
      { slot: this.target, name: 'Castillo diana', alive: g.sim?.kings.get(this.target)?.alive ?? true, blocks: alive, maxBlocks: BLOCKS_PER_CASTLE },
      { slot: this.slot, name: 'Tu castillo', alive: true, blocks: g.sim?.blocksAlive(this.slot) ?? 0, maxBlocks: BLOCKS_PER_CASTLE, you: true },
    ]);
    this.hud.setStats(`${g.fps} fps · ${g.frameMs.toFixed(1)} ms · bloques ${view.blockCount()} · trozos ${view.debris.count} · partículas ${view.fx.count}`);
  }

  dispose() {
    window.removeEventListener('keydown', this.keyHandler);
    this.hud.dispose();
  }
}

export function causeText(c: string) {
  switch (c) {
    case 'crushed':
      return 'Aplastado como una tortilla';
    case 'fell':
      return 'Se cayó de la isla';
    case 'lava':
      return 'Se dio un bañito en la lava';
    case 'outside':
      return 'Tocó el suelo fuera de su castillo';
    default:
      return '';
  }
}
