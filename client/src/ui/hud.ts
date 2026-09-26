import { AMMO, RARITY_COLOR, RARITY_LABEL, type AmmoId } from '../../../shared/ammo';
import { launchSpeed, type Aim } from '../../../shared/ballistics';
import { DEG, type Vec3 } from '../../../shared/math';
import { PLAYER_STYLES } from '../../../shared/players';
import type { AimInput } from '../game/aim';
import { sfx } from '../game/audio';
import { h } from './dom';
import { openSettings, settings } from './settings';

// Una fila de la ayuda de controles: teclas (cada una en su tecla dibujada) y qué hacen.
export type HelpRow = [keys: string[], what: string];

const HELP_KEY = 'asedio.help';
// Tecla de cada tarjeta de munición (el campo de pruebas tiene 12: 1-9, 0, − y =).
const AMMO_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '−', '='];

export interface HudPlayer {
  slot: number;
  name: string;
  alive: boolean;
  blocks: number;
  maxBlocks: number;
  locked?: boolean;
  bot?: boolean;
  you?: boolean;
  connected?: boolean;
}

export class Hud {
  root = h('div', { class: 'hud', id: 'hud' });
  private top = h('div', { class: 'hud-top' });
  private timer = h('div', { class: 'hud-timer', id: 'hud-timer' });
  private phase = h('div', { class: 'hud-phase', id: 'hud-phase' });
  private players = h('div', { class: 'hud-players', id: 'hud-players' });
  private wind = h('div', { class: 'hud-wind', id: 'hud-wind' });
  private ammo = h('div', { class: 'hud-ammo', id: 'hud-ammo' });
  private aimInfo = h('div', { class: 'hud-aim', id: 'hud-aim' });
  private help = h('div', { class: 'hud-help', id: 'hud-help' });
  private helpList = h('div', { class: 'help-list' });
  private helpOpen = true;
  // El modo de pruebas enseña siempre sus estadísticas; en partida, solo si se activan en Ajustes.
  alwaysStats = false;
  private banner = h('div', { class: 'hud-banner', id: 'hud-banner' });
  private corner = h('div', { class: 'hud-corner' });
  private stats = h('div', { class: 'hud-stats', id: 'hud-stats' });
  // Botón de disparo: se mantiene pulsado para cargar, igual que Espacio.
  confirmBtn = h('button', { class: 'primary hud-confirm', id: 'confirm' }, '');
  private bannerTimer = 0;
  // Cuenta atrás antes de disparar (3-2-1 y «¡FUEGO!»), en el centro de la pantalla.
  private countdown = h('div', { class: 'hud-countdown', id: 'hud-countdown', 'aria-live': 'assertive' });
  private countdownText = '';
  private ammoKey = '';
  private countdownTimer = 0;

  constructor(parent: HTMLElement) {
    this.top.append(this.phase, this.timer);
    const bottom = h('div', { class: 'hud-bottom' }, this.aimInfo, this.ammo, this.confirmBtn);
    const mute = h('button', { class: 'hud-mute', id: 'mute', title: 'Silenciar (M)', 'aria-label': 'Silenciar' }, sfx.muted ? '🔇' : '🔊');
    const toggle = () => {
      mute.textContent = sfx.toggleMute() ? '🔇' : '🔊';
    };
    mute.onclick = toggle;
    mute.onpointerdown = (e) => e.stopPropagation();
    try {
      this.helpOpen = localStorage.getItem(HELP_KEY) !== 'closed';
    } catch {
      /* sin almacenamiento */
    }
    const helpBtn = h('button', { class: 'help-toggle', id: 'help-toggle', title: 'Mostrar u ocultar los controles (H)' }, '⌨️ Controles ', h('kbd', null, 'H'));
    helpBtn.onclick = () => this.toggleHelp();
    helpBtn.onpointerdown = (e) => e.stopPropagation();
    this.help.append(helpBtn, this.helpList);
    this.help.classList.toggle('closed', !this.helpOpen);
    this.keyHandler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'KeyM') toggle();
      if (e.code === 'KeyH') this.toggleHelp();
    };
    window.addEventListener('keydown', this.keyHandler);
    const gear = h('button', { class: 'hud-mute', id: 'hud-settings', title: 'Ajustes', 'aria-label': 'Ajustes' }, '⚙️');
    gear.onclick = () => openSettings();
    gear.onpointerdown = (e) => e.stopPropagation();
    this.corner.append(h('div', { class: 'row', style: 'gap:6px' }, this.wind, mute, gear), this.stats);
    this.root.append(this.top, h('div', { class: 'hud-left' }, this.players, this.help), this.corner, bottom, this.banner, this.countdown);
    parent.append(this.root);
    this.confirmBtn.style.display = 'none';
  }

  private keyHandler: (e: KeyboardEvent) => void;

  setPhase(text: string, sub = '') {
    this.phase.replaceChildren(h('b', null, text), sub ? h('span', null, sub) : '');
  }

  setTimer(sec: number | null, urgent = false) {
    this.timer.textContent = sec === null ? '' : String(Math.max(0, Math.ceil(sec)));
    this.timer.classList.toggle('urgent', urgent);
    this.timer.style.display = sec === null ? 'none' : '';
  }

  // Tarjetas de munición. Se llama en cada fotograma, pero solo se rehacen si cambia algo: si
  // se rehicieran siempre, un clic que empieza en una tarjeta y acaba en su sustituta se perdía.
  setAmmo(list: AmmoId[], selected: number, onSelect: (i: number) => void, keys = true) {
    const key = `${list.join(',')}|${selected}|${keys}`;
    if (key === this.ammoKey) return;
    this.ammoKey = key;
    this.ammo.replaceChildren(
      ...list.map((id, i) => {
        const a = AMMO[id];
        const b = h(
          'button',
          { class: `ammo${i === selected ? ' sel' : ''}`, title: `${a.name} (${RARITY_LABEL[a.rarity]}): ${a.desc}`, 'data-ammo': id, style: `--rar:${RARITY_COLOR[a.rarity]}` },
          h('span', { class: 'ammo-icon' }, a.icon),
          h('span', { class: 'ammo-name' }, a.name),
          keys && list.length <= 12 ? h('span', { class: 'ammo-key' }, AMMO_KEYS[i]) : null,
        );
        // Se elige al pulsar, sin esperar a soltar encima; el clic queda para el teclado (Intro).
        b.onpointerdown = (e) => {
          e.stopPropagation();
          if (e.button === 0) onSelect(i);
        };
        b.onclick = (e) => {
          e.stopPropagation();
          if (e.detail === 0) onSelect(i);
        };
        return b;
      }),
    );
  }

  setAimInfo(aim: Aim | null, ammo?: AmmoId) {
    if (!aim) {
      this.aimInfo.textContent = '';
      return;
    }
    const pct = Math.round(aim.power * 100);
    this.aimInfo.replaceChildren(
      h('span', null, `Potencia `, h('b', null, `${pct}%`), ` (${launchSpeed(aim.power).toFixed(0)} m/s)`),
      h('span', null, `Elevación `, h('b', null, `${Math.round(aim.pitch / DEG)}°`)),
      ammo ? h('span', null, AMMO[ammo].icon, ' ', h('b', null, AMMO[ammo].name)) : '',
    );
  }

  setWind(w: Vec3 | null, cameraYaw = 0) {
    if (!w || Math.hypot(w[0], w[2]) < 0.05) {
      this.wind.replaceChildren(h('span', { class: 'muted' }, '🍃 Sin viento'));
      return;
    }
    const sp = Math.hypot(w[0], w[2]);
    // Ángulo de la flecha relativo a la cámara (arriba = hacia donde mira).
    const ang = Math.atan2(w[0], w[2]) - cameraYaw;
    const arrow = h('span', { class: 'wind-arrow', style: `transform: rotate(${(-ang * 180) / Math.PI}deg)` }, '⬆');
    this.wind.replaceChildren(h('span', null, '💨 Viento '), arrow, h('b', null, ` ${sp.toFixed(1)}`), h('span', { class: 'muted' }, ' m/s'));
  }

  setPlayers(list: HudPlayer[]) {
    this.players.replaceChildren(
      ...list.map((p) => {
        const st = PLAYER_STYLES[p.slot];
        const pct = Math.min(100, Math.round((p.blocks / Math.max(1, p.maxBlocks)) * 100));
        return h(
          'div',
          { class: `hp${p.alive ? '' : ' out'}${p.you ? ' you' : ''}`, 'data-slot': String(p.slot) },
          h('div', { class: 'banner', style: `background:${st.color};color:${st.ink};text-shadow:none` }, st.glyph),
          h(
            'div',
            { class: 'hp-body' },
            h('div', { class: 'hp-top' }, h('div', { class: 'hp-name' }, p.name, p.bot ? ' 🤖' : '', p.connected === false ? ' 📡' : '', p.you ? ' (tú)' : ''), p.alive ? h('span', { class: 'hp-pct' }, `${pct}%`) : ''),
            h('div', { class: 'hp-bar' }, h('div', { style: `width:${pct}%;background:${st.color}` })),
          ),
          h('div', { class: 'hp-state' }, p.alive ? (p.locked ? '✔' : '') : '💀'),
        );
      }),
    );
  }

  setHelp(rows: HelpRow[]) {
    this.helpList.replaceChildren(
      ...rows.map(([keys, what]) => h('div', { class: 'help-row' }, h('span', { class: 'help-keys' }, ...keys.map((k) => h('kbd', null, k))), h('span', null, what))),
    );
  }

  private toggleHelp() {
    this.helpOpen = !this.helpOpen;
    this.help.classList.toggle('closed', !this.helpOpen);
    try {
      localStorage.setItem(HELP_KEY, this.helpOpen ? 'open' : 'closed');
    } catch {
      /* sin almacenamiento */
    }
  }

  showHelp(show: boolean) {
    this.help.style.display = show ? '' : 'none';
  }

  setStats(text: string) {
    const show = this.alwaysStats || settings.showFps;
    this.stats.textContent = show ? text : '';
  }

  // Número de la cuenta atrás; cada cambio vuelve a lanzar la animación. Con `ms`, se oculta solo.
  setCountdown(text: string | null, ms = 0) {
    if ((text ?? '') === this.countdownText) return;
    this.countdownText = text ?? '';
    clearTimeout(this.countdownTimer);
    if (!text) {
      this.countdown.classList.remove('show');
      return;
    }
    this.countdown.replaceChildren(h('span', { class: text.length > 1 ? 'cd-go' : 'cd-num' }, text));
    this.countdown.classList.add('show');
    if (ms) this.countdownTimer = window.setTimeout(() => this.setCountdown(null), ms);
  }

  showBanner(text: string, sub = '', ms = 1800, cls = '') {
    this.banner.replaceChildren(h('div', { class: `banner-text ${cls}` }, text), sub ? h('div', { class: 'banner-sub' }, sub) : '');
    this.banner.classList.remove('show');
    void this.banner.offsetWidth;
    this.banner.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => this.banner.classList.remove('show'), ms);
  }

  bindCharge(input: AimInput) {
    const b = this.confirmBtn;
    b.onpointerdown = (e) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      b.setPointerCapture?.(e.pointerId);
      input.startCharge();
    };
    b.onpointerup = () => input.releaseCharge();
    b.onpointercancel = () => input.cancelCharge();
  }

  // Fuerza que se está cargando (0..1), o null si no se carga.
  setCharge(p: number | null) {
    const b = this.confirmBtn;
    b.classList.toggle('charging', p !== null);
    b.style.setProperty('--p', `${Math.round((p ?? 0) * 100)}%`);
    if (p !== null) b.textContent = `Fuerza ${Math.round(p * 100)} %`;
  }

  showConfirm(show: boolean, locked = false) {
    const b = this.confirmBtn;
    b.style.display = show ? '' : 'none';
    b.disabled = locked;
    if (b.classList.contains('charging')) return;
    b.textContent = locked ? '✔ Disparo listo · esperando a los demás' : 'Mantén Espacio para cargar';
  }

  dispose() {
    window.removeEventListener('keydown', this.keyHandler);
    this.root.remove();
  }
}
