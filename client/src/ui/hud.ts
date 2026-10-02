import { AMMO, RARITY_COLOR, RARITY_INK, RARITY_LABEL, type AmmoId } from '../../../shared/ammo';
import { launchSpeed, type Aim } from '../../../shared/ballistics';
import { DEG, clamp, type Vec3 } from '../../../shared/math';
import { PLAYER_STYLES, shortName } from '../../../shared/players';
import { TRAY_QUERY, isMobileDevice } from '../device';
import type { AimInput } from '../game/aim';
import { sfx } from '../game/audio';
import { ammoArt } from './ammoArt';
import { h } from './dom';
import { icon } from './icons';
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
  // Qué hace la munición elegida: en móvil no hay «title» que valga (WRK-TASK-032).
  private ammoDesc = h('div', { class: 'hud-ammo-desc', id: 'hud-ammo-desc' });
  private help = h('div', { class: 'hud-help', id: 'hud-help' });
  private helpList = h('div', { class: 'help-list' });
  private helpOpen = true;
  // El modo de pruebas enseña siempre sus estadísticas; en partida, solo si se activan en Ajustes.
  alwaysStats = false;
  private banner = h('div', { class: 'hud-banner', id: 'hud-banner' });
  private corner = h('div', { class: 'hud-corner' });
  // Objetivo secundario de la ronda (WRK-TASK-043).
  private goal = h('div', { class: 'hud-goal', id: 'hud-goal', hidden: true });
  private stats = h('div', { class: 'hud-stats', id: 'hud-stats' });
  // Botón de disparo: se mantiene pulsado para cargar, igual que Espacio.
  confirmBtn = h('button', { class: 'primary hud-confirm', id: 'confirm' }, '');
  // En táctil no hay Q/E: dos flechas a los lados de la munición cambian de castillo objetivo.
  readonly touchUi = isMobileDevice();
  onTarget: (dir: number) => void = () => {};
  private targetBtns = [-1, 1].map((dir) => {
    const b = h('button', { class: 'target-btn', id: dir < 0 ? 'target-prev' : 'target-next', 'aria-label': dir < 0 ? 'Castillo anterior' : 'Castillo siguiente', hidden: true }, dir < 0 ? '◀' : '▶');
    b.onpointerdown = (e) => {
      e.stopPropagation();
      this.onTarget(dir);
    };
    return b;
  });
  private bannerTimer = 0;
  // Cuenta atrás antes de disparar (3-2-1 y «¡FUEGO!»), en el centro de la pantalla.
  private countdown = h('div', { class: 'hud-countdown', id: 'hud-countdown', 'aria-live': 'assertive' });
  private countdownText = '';
  private ammoKey = '';
  private countdownTimer = 0;
  private row = h('div', { class: 'hud-row' });
  private bottom = h('div', { class: 'hud-bottom' });
  // Bandeja del pulgar (R-10 U1, componente BandejaMovil): en móvil vertical, disparo, pad de
  // puntería y cartas en el 30 % inferior. El botón y las cartas son los de siempre, cambiados de sitio.
  private fireWrap = h('div', { class: 'fire-wrap' });
  private padKnob = h('span', { class: 'pad-knob' });
  private padElev = h('span', { class: 'pad-elev', id: 'pad-elev' });
  private pad = h(
    'div',
    { class: 'aim-pad', id: 'aim-pad', role: 'group', 'aria-label': 'Pad de puntería: arrastra a los lados para girar y arriba o abajo para elevar' },
    h('span', { class: 'pad-line pad-v' }),
    h('span', { class: 'pad-line pad-h' }),
    this.padKnob,
    // U+FE0E: flechas como texto, nunca como emoji.
    h('span', { class: 'pad-hint' }, '↔\uFE0E gira · ↕\uFE0E eleva'),
    this.padElev,
  );
  private tray = h('div', { class: 'tray', id: 'tray' }, h('div', { class: 'tray-row' }, this.fireWrap, this.pad));
  trayMode = false;
  private trayH = 0;
  private trayMq = matchMedia(TRAY_QUERY);
  private onLayout = () => this.layout();
  private trayObs = new ResizeObserver(() => {
    this.trayH = this.tray.offsetHeight;
    this.root.style.setProperty('--tray-h', `${this.trayH}px`);
  });
  private confirmState = { show: false, locked: false };
  private confirmKey = '';
  private firePct: HTMLElement | null = null;

  constructor(parent: HTMLElement) {
    this.top.append(this.phase, this.timer);
    this.row.append(this.targetBtns[0], this.ammo, this.targetBtns[1]);
    this.bottom.append(this.aimInfo, this.ammoDesc, this.row, this.confirmBtn);
    const bottom = this.bottom;
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
    // En táctil o con poca altura la ayuda empieza plegada: el tutorial ya lo explica.
    if (this.touchUi || matchMedia('(max-height: 500px)').matches) this.helpOpen = false;
    const helpBtn = this.touchUi
      ? h('button', { class: 'help-toggle', id: 'help-toggle', title: 'Mostrar u ocultar los controles' }, '❔ Controles')
      : h('button', { class: 'help-toggle', id: 'help-toggle', title: 'Mostrar u ocultar los controles (H)' }, '⌨️ Controles ', h('kbd', null, 'H'));
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
    this.corner.append(h('div', { class: 'row', style: 'gap:6px' }, this.wind, mute, gear), this.goal, this.stats);
    this.root.append(this.top, h('div', { class: 'hud-left' }, this.players, this.help), this.corner, bottom, this.tray, this.banner, this.countdown);
    parent.append(this.root);
    this.confirmBtn.style.display = 'none';
    this.trayObs.observe(this.tray);
    this.trayMq.addEventListener('change', this.onLayout);
    window.addEventListener('resize', this.onLayout);
    this.layout();
  }

  // Coloca el botón de disparo y las cartas en la bandeja (móvil vertical) o donde siempre.
  private layout() {
    const on = this.trayMq.matches;
    this.trayMode = on;
    this.root.classList.toggle('tray-mode', on);
    if (on) {
      if (this.confirmBtn.parentElement !== this.fireWrap) this.fireWrap.append(this.confirmBtn);
      if (this.ammo.parentElement !== this.tray) this.tray.append(this.ammo);
    } else {
      if (this.confirmBtn.parentElement !== this.bottom) this.bottom.append(this.confirmBtn);
      if (this.ammo.parentElement !== this.row) this.row.insertBefore(this.ammo, this.targetBtns[1]);
    }
    // Escala de la bandeja: como mucho el 30 % del alto (252 px a 844: 7 fijos y 245 que escalan) y
    // que quepan a lo ancho el botón (118 px con su anillo) y el pad (222 px).
    const k = Math.floor(Math.min(1, (innerHeight * 0.3 - 7) / 245, (innerWidth - 40) / 340) * 1000) / 1000;
    this.root.style.setProperty('--k', String(k));
    this.refreshConfirm();
  }

  // Alto de pantalla que tapa la bandeja, para centrar la escena en lo que queda libre (0 sin ella).
  sceneInset() {
    return this.trayMode && this.root.classList.contains('tray-on') ? this.trayH : 0;
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
    this.ammo.classList.toggle('many', list.length > 3);
    const sel = list[selected];
    // Tarjeta de la munición elegida (R-03): icono, nombre, rareza y qué hace.
    if (sel) {
      const a = AMMO[sel];
      this.ammoDesc.style.setProperty('--rar', RARITY_COLOR[a.rarity]);
      this.ammoDesc.style.setProperty('--rar-ink', RARITY_INK[a.rarity]);
      this.ammoDesc.replaceChildren(
        h('span', { class: 'desc-icon' }, ammoArt(sel)),
        h('span', { class: 'desc-body' }, h('span', { class: 'desc-head' }, h('b', { class: 'desc-name' }, a.name), h('span', { class: 'desc-rar' }, RARITY_LABEL[a.rarity])), h('span', { class: 'desc-text' }, a.desc)),
      );
    } else this.ammoDesc.replaceChildren();
    this.ammo.replaceChildren(
      ...list.map((id, i) => {
        const a = AMMO[id];
        const b = h(
          'button',
          { class: `ammo${i === selected ? ' sel' : ''}`, title: `${a.name} (${RARITY_LABEL[a.rarity]}): ${a.desc}`, 'aria-label': a.name, 'data-ammo': id, style: `--rar:${RARITY_COLOR[a.rarity]};--rar-ink:${RARITY_INK[a.rarity]}` },
          h('span', { class: 'ammo-icon' }, ammoArt(id)),
          h('span', { class: 'ammo-rar' }, RARITY_LABEL[a.rarity]),
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
      // La línea del espectador (setWatch) se queda; la borra setWatch(null).
      if (!this.aimInfo.querySelector('#hud-watch')) this.aimInfo.textContent = '';
      return;
    }
    // Sin potencia ni elevación en texto (WRK-TASK-061): la parábola ya lo dice. En la bandeja del
    // móvil, la elevación va en una esquina del pad (R-10 U3).
    void ammo;
    const deg = `${Math.round(aim.pitch / DEG)}°`;
    if (this.padElev.textContent !== deg) this.padElev.textContent = deg;
    if (!this.aimInfo.querySelector('#hud-watch')) this.aimInfo.textContent = '';
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
          { class: `hp${p.alive ? '' : ' out'}${p.you ? ' you' : ''}`, 'data-slot': String(p.slot), title: p.name },
          h('div', { class: 'banner', style: `background:${st.color};color:${st.ink};text-shadow:none` }, st.glyph),
          h(
            'div',
            { class: 'hp-body' },
            h('div', { class: 'hp-top' }, h('div', { class: 'hp-name' }, p.name, p.bot ? ' 🤖' : '', p.you ? ' (tú)' : ''), h('div', { class: 'hp-short' }, shortName(p)), p.alive ? h('span', { class: 'hp-pct' }, `${pct}%`) : ''),
            h('div', { class: 'hp-bar' }, h('div', { style: `width:${pct}%;background:${st.color}` })),
          ),
          // 📡: desconectado (su catapulta dispara con la última puntería al acabar el tiempo).
          h('div', { class: 'hp-state', title: p.connected === false ? 'Desconectado' : '' }, !p.alive ? '💀' : p.connected === false ? '📡' : p.locked ? '✔' : ''),
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

  setGoal(text: string | null, title = '') {
    const t = text ?? '';
    if (this.goal.dataset.t === t) return;
    this.goal.dataset.t = t;
    this.goal.hidden = !t;
    this.goal.title = title;
    this.goal.replaceChildren(t ? h('span', null, '🎯 ', h('b', null, t)) : '');
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
    // La cuenta atrás manda: retira el rótulo que hubiera («RONDA N», «LA LAVA SUBE»), que si no
    // se superpone con los números (WRK-TASK-038).
    clearTimeout(this.bannerTimer);
    this.banner.classList.remove('show');
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
    this.bindPad(input);
  }

  // Pad de puntería: arrastre relativo (horizontal gira, vertical eleva). La bola sigue al dedo
  // dentro del pad y vuelve al centro al soltar; el dedo puede seguir por fuera sin perder el arrastre.
  private bindPad(input: AimInput) {
    const pad = this.pad;
    let id = -1;
    let lx = 0;
    let ly = 0;
    let ox = 0;
    let oy = 0;
    pad.onpointerdown = (e) => {
      e.stopPropagation();
      if (id !== -1 || !input.enabled) return;
      id = e.pointerId;
      lx = e.clientX;
      ly = e.clientY;
      ox = oy = 0;
      pad.setPointerCapture?.(e.pointerId);
      input.padActive = true;
      pad.classList.add('drag');
    };
    pad.onpointermove = (e) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      input.padMove(dx, dy);
      const r = pad.getBoundingClientRect();
      const kr = this.padKnob.offsetWidth / 2 + 4;
      ox = clamp(ox + dx, -r.width / 2 + kr, r.width / 2 - kr);
      oy = clamp(oy + dy, -r.height / 2 + kr, r.height / 2 - kr);
      this.padKnob.style.transform = `translate(${ox}px, ${oy}px)`;
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      input.padActive = false;
      pad.classList.remove('drag');
      this.padKnob.style.transform = '';
    };
    pad.onpointerup = end;
    pad.onpointercancel = end;
  }

  // Botón redondo (táctil o bandeja del móvil) en lugar del botón largo del PC.
  private get roundFire() {
    return this.touchUi || this.trayMode;
  }

  // Fuerza que se está cargando (0..1), o null si no se carga. En el botón redondo, el anillo se
  // llena de naranja y dentro van el porcentaje y «SUELTA» (R-10 U3).
  setCharge(p: number | null) {
    const b = this.confirmBtn;
    const was = b.classList.contains('charging');
    const on = p !== null;
    if (on !== was) {
      b.classList.toggle('charging', on);
      this.fireWrap.classList.toggle('charging', on);
      this.pad.classList.toggle('dim', on);
    }
    if (!on) {
      if (was) {
        this.confirmKey = '';
        this.refreshConfirm();
      }
      return;
    }
    const pct = `${Math.round(p * 100)}%`;
    b.style.setProperty('--p', pct);
    this.fireWrap.style.setProperty('--p', pct);
    if (!this.roundFire) {
      b.textContent = `Fuerza ${Math.round(p * 100)} %`;
      return;
    }
    if (!was || !this.firePct || !b.contains(this.firePct)) {
      this.firePct = h('b', { class: 'fire-pct' });
      b.replaceChildren(this.firePct, h('span', { class: 'fire-sub' }, 'SUELTA'));
      this.confirmKey = '';
    }
    if (this.firePct.textContent !== pct) this.firePct.textContent = pct;
  }

  showConfirm(show: boolean, locked = false) {
    const b = this.confirmBtn;
    this.confirmState = { show, locked };
    b.style.display = show ? '' : 'none';
    b.disabled = locked;
    // La bandeja solo está mientras se puede apuntar: tras disparar se recoge (U6).
    this.root.classList.toggle('tray-on', show && !locked);
    this.refreshConfirm();
  }

  // Contenido del botón de disparo; solo se rehace si cambia (se llama en cada fotograma).
  private refreshConfirm() {
    const b = this.confirmBtn;
    if (b.classList.contains('charging')) return;
    const { locked } = this.confirmState;
    const round = this.roundFire;
    const key = `${round}|${locked}`;
    if (key === this.confirmKey) return;
    this.confirmKey = key;
    // Redondo: la llama y «MANTÉN» (componente BandejaMovil); con el disparo listo, una marca.
    if (round) b.replaceChildren(icon(locked ? 'check' : 'flame', 'fire-ico'), locked ? '' : h('span', { class: 'fire-label' }, 'MANTÉN'));
    else b.textContent = locked ? '✔ Disparo listo · esperando al resto de jugadores' : 'Mantén Espacio o clic izquierdo';
    b.setAttribute('aria-label', locked ? 'Disparo listo' : 'Mantén pulsado para cargar y suelta para disparar');
  }

  // Flechas de castillo objetivo: solo en táctil y mientras se puede apuntar.
  // `always`: también con ratón (el espectador cambia de castillo con ellos, WRK-TASK-042).
  showTargetButtons(show: boolean, always = false) {
    for (const b of this.targetBtns) b.hidden = !(show && (this.touchUi || always));
  }

  // Qué castillo sigue la cámara del espectador, en la línea de la puntería (que entonces no se usa).
  // Se llama en cada fotograma: solo toca el DOM si cambia lo que hay que enseñar.
  setWatch(text: string | null) {
    const cur = (this.aimInfo.firstElementChild as HTMLElement | null)?.dataset.watch;
    if (!text) {
      if (cur) this.aimInfo.textContent = '';
      return;
    }
    if (cur === text) return;
    this.aimInfo.replaceChildren(h('span', { id: 'hud-watch', 'data-watch': text }, '👁 ', h('b', null, text), h('span', { class: 'muted' }, this.touchUi ? '  ·  ◀ ▶ para cambiar' : '  ·  Q/E o ◀ ▶ para cambiar')));
  }

  dispose() {
    window.removeEventListener('keydown', this.keyHandler);
    window.removeEventListener('resize', this.onLayout);
    this.trayMq.removeEventListener('change', this.onLayout);
    this.trayObs.disconnect();
    this.root.remove();
  }
}
