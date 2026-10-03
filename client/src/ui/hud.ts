import { AMMO, RARITY_COLOR, RARITY_INK, RARITY_LABEL, type AmmoId } from '../../../shared/ammo';
import { launchSpeed, type Aim } from '../../../shared/ballistics';
import { DEG, clamp } from '../../../shared/math';
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

// Panel de controles (R-10 U11): plegado por defecto en el chip «Controles · H»; recuerda si se abrió.
const HELP_KEY = 'asedio.controles';
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

// Barra «Disparo listo» (R-10 U6): munición disparada, quién falta y cuántos están listos.
export interface HudWait {
  ammo: AmmoId | null;
  ready: number[]; // huecos ya listos (con su emblema)
  pending: { slot: number; name: string }[]; // los que faltan, con su nombre corto
}

export class Hud {
  root = h('div', { class: 'hud', id: 'hud' });
  private top = h('div', { class: 'hud-top' });
  private players = h('div', { class: 'hud-players', id: 'hud-players' });
  private ammo = h('div', { class: 'hud-ammo', id: 'hud-ammo' });
  private aimInfo = h('div', { class: 'hud-aim', id: 'hud-aim' });
  // Tarjeta de descripción de una carta (R-10 U2, componente CartaMunicion): sin etiqueta fija; sale
  // al mantener el dedo sobre la carta (≈ 350 ms) o al pasar el ratón, con una flecha hacia ella.
  private tip = h('div', { class: 'ammo-tip', id: 'ammo-tip', role: 'tooltip', hidden: true });
  private tipFor = -1;
  private tipTimer = 0;
  private ammoList: AmmoId[] = [];
  private onAmmoSelect: (i: number) => void = () => {};
  private endHold = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    clearTimeout(this.tipTimer);
    this.hideTip();
  };
  private help = h('div', { class: 'hud-help', id: 'hud-help' });
  private helpList = h('div', { class: 'help-list', id: 'help-list' });
  private helpBtn: HTMLButtonElement;
  private helpOpen = false;
  // El modo de pruebas enseña siempre sus estadísticas; en partida, solo si se activan en Ajustes.
  alwaysStats = false;
  private banner = h('div', { class: 'hud-banner', id: 'hud-banner' });
  private corner = h('div', { class: 'hud-corner' });
  private stats = h('div', { class: 'hud-stats', id: 'hud-stats' });
  // HUD de PC (R-10 U11, maqueta «PC · Apuntando»): bajo las cartas, la barra de potencia de 300 px
  // y la pista para cargar (con el disparo listo, a quién se espera); abajo a la derecha, la elevación.
  private powerFill = h('span', { class: 'power-fill' });
  private powerHint = h('span', { class: 'power-hint', id: 'power-hint' });
  private power = h('div', { class: 'hud-power', id: 'hud-power', hidden: true }, h('span', { class: 'power-bar' }, this.powerFill), this.powerHint);
  private powerKey = '';
  private waitText = '';
  private elevDeg = h('b', { class: 'elev-deg' });
  private elev = h('div', { class: 'hud-elev', id: 'hud-elev', hidden: true }, this.elevDeg, h('span', { class: 'elev-label' }, 'elevación'));
  // Botón de disparo: se mantiene pulsado para cargar, igual que Espacio.
  confirmBtn = h('button', { class: 'primary hud-confirm', id: 'confirm' }, '');
  // En táctil no hay Q/E: dos flechas a los lados de la munición cambian de castillo objetivo.
  readonly touchUi = isMobileDevice();
  onTarget: (dir: number) => void = () => {};
  private targetBtns = [-1, 1].map((dir) => {
    const b = h('button', { class: 'target-btn', id: dir < 0 ? 'target-prev' : 'target-next', 'aria-label': dir < 0 ? 'Castillo anterior' : 'Castillo siguiente', hidden: true }, icon(dir < 0 ? 'prev' : 'next'));
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
    this.root.style.setProperty('--top-h', `${this.mTop.offsetHeight}px`);
  });
  private confirmState = { show: false, locked: false };
  private confirmKey = '';
  private firePct: HTMLElement | null = null;
  // Parte superior (componente Marcador): ronda y segundos en una píldora, los jugadores en chips (en
  // fila en móvil vertical, R-10 U4; en columna en PC, U11) y los chips de viento y objetivo. En
  // móvil vertical, lo único que se toca arriba es el engranaje. Son los mismos elementos en los dos
  // formatos, cambiados de sitio.
  private roundText = h('span', { class: 'm-round-text' });
  private roundSecs = h('span', { class: 'm-round-secs', id: 'hud-round-secs' }, '–');
  private roundPill = h('div', { class: 'm-round', id: 'hud-round' }, this.roundText, this.roundSecs);
  private mRow = h('div', { class: 'm-row' });
  private goalText = h('span');
  private goalChip = h('span', { class: 'm-chip m-goal', id: 'hud-goal-chip', hidden: true }, icon('flag'), this.goalText);
  // Sin viento desde el 03-10-2026: arriba solo queda el chip del objetivo.
  private flags = h('div', { class: 'm-flags', id: 'hud-flags', hidden: true }, this.goalChip);
  private mTop = h('div', { class: 'm-top', id: 'm-top' }, this.mRow);
  private left = h('div', { class: 'hud-left' });
  private cornerRow = h('div', { class: 'hud-corner-row' });
  private gear = h('button', { class: 'hud-gear', id: 'hud-settings', title: 'Ajustes', 'aria-label': 'Ajustes' }, icon('gear'));
  private playersKey = '';
  // Tras disparar en móvil vertical, la bandeja se recoge en esta barra fina (R-10 U6).
  private wait = h('div', { class: 'm-wait', id: 'hud-wait', role: 'status', hidden: true });
  private waitKey = '';

  constructor(parent: HTMLElement) {
    this.row.append(this.targetBtns[0], this.ammo, this.targetBtns[1]);
    this.bottom.append(this.aimInfo, this.row, this.power, this.confirmBtn);
    const bottom = this.bottom;
    // Sin botón de silencio: el sonido está en Ajustes y la tecla M sigue valiendo.
    try {
      this.helpOpen = localStorage.getItem(HELP_KEY) === 'open';
    } catch {
      /* sin almacenamiento */
    }
    // En táctil la ayuda empieza siempre plegada: el tutorial ya lo explica.
    if (this.touchUi) this.helpOpen = false;
    this.helpBtn = h(
      'button',
      { class: 'hud-chip help-toggle', id: 'help-toggle', 'aria-controls': 'help-list', title: this.touchUi ? 'Mostrar u ocultar los controles' : 'Mostrar u ocultar los controles (H)' },
      icon('keyboard'),
      this.touchUi ? 'Controles' : 'Controles · H',
    );
    this.helpBtn.onclick = () => this.toggleHelp();
    this.helpBtn.onpointerdown = (e) => e.stopPropagation();
    this.help.append(this.helpList, this.helpBtn);
    this.setHelpOpen(this.helpOpen);
    this.keyHandler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'KeyM') sfx.toggleMute();
      if (e.code === 'KeyH') this.toggleHelp();
    };
    window.addEventListener('keydown', this.keyHandler);
    this.gear.onclick = () => openSettings();
    this.gear.onpointerdown = (e) => e.stopPropagation();
    this.corner.append(this.cornerRow, this.stats);
    this.mTop.append(this.mRow);
    this.root.append(this.top, this.left, this.corner, this.mTop, bottom, this.help, this.elev, this.tray, this.wait, this.tip, this.banner, this.countdown);
    // Al levantar el dedo, en cualquier sitio, la tarjeta desaparece (la carta ya quedó elegida).
    window.addEventListener('pointerup', this.endHold);
    window.addEventListener('pointercancel', this.endHold);
    this.ammo.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && this.hideTip());
    parent.append(this.root);
    this.confirmBtn.style.display = 'none';
    this.trayObs.observe(this.tray);
    this.trayObs.observe(this.mTop);
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
      if (this.roundPill.parentElement !== this.mRow) {
        this.mRow.append(this.roundPill, this.gear);
        this.mTop.append(this.players, this.flags, this.stats);
      }
    } else {
      if (this.confirmBtn.parentElement !== this.bottom) this.bottom.append(this.confirmBtn);
      if (this.ammo.parentElement !== this.row) this.row.insertBefore(this.ammo, this.targetBtns[1]);
      // En PC (U11): jugadores en columna arriba a la izquierda, la píldora arriba al centro, y el
      // viento, el objetivo y el engranaje arriba a la derecha.
      if (this.roundPill.parentElement !== this.top) {
        this.top.append(this.roundPill);
        this.cornerRow.append(this.flags, this.gear);
        this.left.append(this.players);
        this.corner.append(this.stats);
      }
    }
    // Escala de la bandeja (R-12): como mucho el 30 % del alto (253 px a 844: 7 fijos y 246 que
    // escalan) y que quepan a lo ancho, con 14 px a cada lado y entre ellos, el botón (96 px con su
    // anillo) y el pad (252 px).
    const k = Math.floor(Math.min(1, (innerHeight * 0.3 - 7) / 246, (innerWidth - 42) / 348) * 1000) / 1000;
    this.root.style.setProperty('--k', String(k));
    this.refreshConfirm();
  }

  // Barra «Disparo listo · esperando a … · N de M listos» con la carta disparada y los emblemas
  // (los que faltan, como un hueco). Solo en móvil vertical; null la quita. Se rehace si cambia.
  setWait(w: HudWait | null) {
    const key = w ? `${w.ammo}|${w.ready.join(',')}|${w.pending.map((p) => `${p.slot}:${p.name}`).join(',')}` : '';
    if (key === this.waitKey) return;
    this.waitKey = key;
    this.wait.hidden = !w;
    this.waitText = '';
    if (!w) return this.refreshPower();
    const total = w.ready.length + w.pending.length;
    const names = w.pending.map((p) => p.name);
    const who = names.length ? `Esperando a ${names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}` : names[0]}` : 'Todos listos';
    // En PC, la misma información en la pista bajo la barra de potencia.
    this.waitText = `${who} · ${w.ready.length} de ${total} listos`;
    this.refreshPower();
    const emblem = (slot: number) => {
      const st = PLAYER_STYLES[slot];
      return h('span', { class: 'wait-emb', style: `background:${st.color};color:${st.ink}` }, `${st.glyph}\uFE0E`);
    };
    this.wait.replaceChildren(
      h('span', { class: 'wait-card' }, w.ammo ? ammoArt(w.ammo) : icon('check')),
      h('span', { class: 'wait-body' }, h('b', { class: 'wait-title' }, 'Disparo listo'), h('span', { class: 'wait-sub' }, `${who} · ${w.ready.length} de ${total} listos`)),
      h('span', { class: 'wait-embs', 'aria-hidden': 'true' }, ...w.ready.map(emblem), ...w.pending.map(() => h('span', { class: 'wait-emb wait-gap' }))),
    );
  }

  // Alto de pantalla que tapa la bandeja, para centrar la escena en lo que queda libre (0 sin ella).
  sceneInset() {
    return this.trayMode && this.root.classList.contains('tray-on') ? this.trayH : 0;
  }

  private keyHandler: (e: KeyboardEvent) => void;

  // La píldora de la ronda (componente Marcador): «Ronda N» y los segundos, sin «Fase de apuntado»
  // (U4, U11). `sub` queda como descripción. Con `pill`, la píldora dice eso y va sin segundos.
  setPhase(text: string, sub = '', pill = '') {
    const t = pill || text;
    if (this.roundText.textContent !== t) this.roundText.textContent = t;
    this.roundPill.classList.toggle('no-secs', !!pill);
    this.roundPill.title = sub;
  }

  setTimer(sec: number | null, urgent = false) {
    const t = sec === null ? '' : String(Math.max(0, Math.ceil(sec)));
    const m = t || '–';
    if (this.roundSecs.textContent !== m) this.roundSecs.textContent = m;
    this.roundSecs.classList.toggle('urgent', urgent);
  }

  // Tarjetas de munición. Se llama en cada fotograma: las cartas solo se rehacen si cambia la mano;
  // al cambiar la elegida, solo se mueve la marca. Rehacerlas al elegir perdía el clic (empezaba en
  // una carta y acababa en su sustituta) y el dedo que la mantenía.
  setAmmo(list: AmmoId[], selected: number, onSelect: (i: number) => void, keys = true) {
    this.onAmmoSelect = onSelect;
    const key = `${list.join(',')}|${keys}`;
    if (key !== this.ammoKey) {
      this.ammoKey = key;
      this.ammoList = list;
      this.ammo.classList.toggle('many', list.length > 3);
      this.hideTip();
      this.ammo.replaceChildren(...list.map((id, i) => this.ammoCard(id, i, keys && list.length <= 12)));
    }
    const cards = this.ammo.children;
    for (let i = 0; i < cards.length; i++) if (cards[i].classList.contains('sel') !== (i === selected)) cards[i].classList.toggle('sel', i === selected);
  }

  private ammoCard(id: AmmoId, i: number, key: boolean) {
    const a = AMMO[id];
    const b = h(
      'button',
      { class: 'ammo', 'aria-label': `${a.name} (${RARITY_LABEL[a.rarity]}): ${a.desc}`, 'data-ammo': id, style: `--rar:${RARITY_COLOR[a.rarity]};--rar-ink:${RARITY_INK[a.rarity]}` },
      h('span', { class: 'ammo-icon' }, ammoArt(id)),
      h('span', { class: 'ammo-rar' }, RARITY_LABEL[a.rarity]),
      key ? h('span', { class: 'ammo-key' }, AMMO_KEYS[i]) : null,
    );
    // Se elige al pulsar, sin esperar a soltar encima; el clic queda para el teclado (Intro). Con el
    // dedo, mantenerla enseña su descripción; con el ratón, basta pasar por encima.
    b.onpointerdown = (e) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      this.onAmmoSelect(i);
      if (e.pointerType === 'mouse') return;
      clearTimeout(this.tipTimer);
      this.tipTimer = window.setTimeout(() => this.showTip(i), 350);
    };
    b.onpointerenter = (e) => e.pointerType === 'mouse' && this.showTip(i);
    b.onclick = (e) => {
      e.stopPropagation();
      if (e.detail === 0) this.onAmmoSelect(i);
    };
    // Sin el menú del sistema al mantener el dedo.
    b.oncontextmenu = (e) => e.preventDefault();
    return b;
  }

  // Tarjeta de descripción encima de la carta: nombre, rareza y qué hace. En la bandeja del móvil,
  // a todo el ancho y pegada a la bandeja; en PC, centrada sobre la carta. Nunca tapa el centro.
  private showTip(i: number) {
    const id = this.ammoList[i];
    const card = this.ammo.children[i] as HTMLElement | undefined;
    if (!id || !card) return;
    const a = AMMO[id];
    this.tipFor = i;
    const arrow = h('span', { class: 'tip-arrow' });
    this.tip.replaceChildren(
      h('span', { class: 'tip-head' }, h('b', { class: 'tip-name' }, a.name), h('span', { class: 'tip-rar', style: `--rar:${RARITY_COLOR[a.rarity]};--rar-ink:${RARITY_INK[a.rarity]}` }, RARITY_LABEL[a.rarity])),
      h('span', { class: 'tip-text' }, a.desc),
      arrow,
    );
    this.tip.hidden = false;
    const c = card.getBoundingClientRect();
    const cx = c.left + c.width / 2;
    if (this.trayMode) {
      this.tip.style.left = '';
      this.tip.style.bottom = `${innerHeight - this.tray.getBoundingClientRect().top + 10}px`;
    } else {
      const w = this.tip.offsetWidth;
      this.tip.style.left = `${clamp(cx - w / 2, 8, innerWidth - w - 8)}px`;
      // Por encima de la fila (la carta más alta), del anillo y de lo que sube la elegida (13 px) y
      // con sitio para la flecha.
      this.tip.style.bottom = `${innerHeight - this.ammo.getBoundingClientRect().top + 27}px`;
    }
    const t = this.tip.getBoundingClientRect();
    arrow.style.left = `${clamp(cx - t.left - 3 - 9, 12, t.width - 36)}px`;
  }

  private hideTip() {
    if (this.tipFor < 0 && this.tip.hidden) return;
    this.tipFor = -1;
    this.tip.hidden = true;
  }

  setAimInfo(aim: Aim | null, ammo?: AmmoId) {
    if (!aim) {
      // La línea del espectador (setWatch) se queda; la borra setWatch(null).
      if (!this.aimInfo.querySelector('#hud-watch')) this.aimInfo.textContent = '';
      if (!this.elev.hidden) this.elev.hidden = true;
      return;
    }
    // La elevación va en una esquina del pad en la bandeja del móvil (R-10 U3) y en grande abajo a la
    // derecha en PC (U11); la potencia, en el anillo del botón o en la barra bajo las cartas.
    void ammo;
    const deg = `${Math.round(aim.pitch / DEG)}°`;
    if (this.padElev.textContent !== deg) this.padElev.textContent = deg;
    if (this.elevDeg.textContent !== deg) this.elevDeg.textContent = deg;
    if (this.elev.hidden) this.elev.hidden = false;
    if (!this.aimInfo.querySelector('#hud-watch')) this.aimInfo.textContent = '';
  }

  // La fila de viento y objetivo solo ocupa sitio si tiene algo.
  private refreshFlags() {
    const empty = this.goalChip.hidden;
    if (this.flags.hidden !== empty) this.flags.hidden = empty;
  }

  // Marcador (componente Marcador): un chip por jugador con emblema, nombre corto y barra de lo que le
  // queda; el tuyo con borde crema. En PC, en columna; en móvil vertical, en fila. Estado con iconos:
  // listo, eliminado o desconectado. El nombre completo, en `title` y `aria-label`. Se rehace solo si
  // cambia algo (se llama en cada fotograma).
  setPlayers(list: HudPlayer[]) {
    const key = list.map((p) => `${p.slot}|${p.name}|${p.alive}|${p.blocks}|${p.maxBlocks}|${p.locked}|${p.bot}|${p.you}|${p.connected}`).join(';');
    if (key === this.playersKey) return;
    this.playersKey = key;
    this.players.replaceChildren(
      ...list.map((p) => {
        const st = PLAYER_STYLES[p.slot];
        const pct = Math.min(100, Math.round((p.blocks / Math.max(1, p.maxBlocks)) * 100));
        // Desconectado: su catapulta dispara con la última puntería al acabar el tiempo.
        const state = !p.alive ? icon('cross') : p.connected === false ? icon('offline') : p.locked ? icon('check') : '';
        const said = !p.alive ? 'Eliminado' : p.connected === false ? 'Desconectado' : p.locked ? 'Listo' : '';
        return h(
          'div',
          {
            class: `hp${p.alive ? '' : ' out'}${p.you ? ' you' : ''}${state ? ' mark' : ''}`,
            'data-slot': String(p.slot),
            title: p.name,
            'aria-label': `${p.name}${p.you ? ' (tú)' : ''}${p.bot ? ', bot' : ''}: ${pct} % en pie${said ? `, ${said.toLowerCase()}` : ''}`,
          },
          // U+FE0E: el emblema como texto, nunca como emoji.
          h('span', { class: 'hp-emb', style: `background:${st.color};color:${st.ink}` }, `${st.glyph}\uFE0E`),
          h(
            'div',
            { class: 'hp-body' },
            h(
              'div',
              { class: 'hp-top' },
              h('div', { class: 'hp-name' }, p.name, p.bot ? icon('bot', 'hp-bot') : '', p.you ? ' (tú)' : ''),
              h('div', { class: 'hp-short' }, shortName(p)),
              h('span', { class: 'hp-state', title: p.connected === false ? 'Desconectado' : '' }, state),
            ),
            h('div', { class: 'hp-bar' }, h('div', { style: `width:${pct}%;background:${st.color}` })),
          ),
        );
      }),
    );
  }

  setHelp(rows: HelpRow[]) {
    this.helpList.replaceChildren(
      ...rows.map(([keys, what]) => h('div', { class: 'help-row' }, h('span', { class: 'help-keys' }, ...keys.map((k) => h('kbd', null, k))), h('span', null, what))),
    );
  }

  private setHelpOpen(open: boolean) {
    this.helpOpen = open;
    this.help.classList.toggle('closed', !open);
    this.helpBtn.setAttribute('aria-expanded', String(open));
  }

  private toggleHelp() {
    this.setHelpOpen(!this.helpOpen);
    try {
      localStorage.setItem(HELP_KEY, this.helpOpen ? 'open' : 'closed');
    } catch {
      /* sin almacenamiento */
    }
  }

  showHelp(show: boolean) {
    this.help.style.display = show ? '' : 'none';
  }

  // Objetivo de la ronda: chip con borde naranja (U5, U11), con el texto completo en el `title`.
  setGoal(text: string | null, title = '') {
    const t = text ?? '';
    if (this.goalChip.dataset.t === t) return;
    this.goalChip.dataset.t = t;
    this.goalText.textContent = t;
    this.goalChip.hidden = !t;
    this.goalChip.title = title;
    this.refreshFlags();
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

  // El subtítulo puede llevar nodos (líneas con iconos, sin emoji).
  showBanner(text: string, sub: string | Node = '', ms = 1800, cls = '') {
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
      const r = pad.getBoundingClientRect();
      input.padMove(dx, dy, r.width, r.height);
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
        this.powerFill.style.width = '0%';
        this.refreshPower();
      }
      return;
    }
    const pct = `${Math.round(p * 100)}%`;
    b.style.setProperty('--p', pct);
    this.fireWrap.style.setProperty('--p', pct);
    this.powerFill.style.width = pct;
    if (!was) this.refreshPower();
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
    if (this.power.hidden !== !show) this.power.hidden = !show;
    this.refreshConfirm();
    this.refreshPower();
  }

  // Pista bajo la barra de potencia (PC, U11): cómo cargar; cargando, que se suelte; con el disparo
  // listo, a quién se espera. Solo se rehace si cambia.
  private refreshPower() {
    const charging = this.confirmBtn.classList.contains('charging');
    const { locked } = this.confirmState;
    const key = `${charging}|${locked}|${this.waitText}`;
    if (key === this.powerKey) return;
    this.powerKey = key;
    this.power.classList.toggle('locked', locked);
    if (locked) this.powerHint.replaceChildren(icon('check'), h('span', null, this.waitText ? `Disparo listo · ${this.waitText}` : 'Disparo listo'));
    else if (charging) this.powerHint.replaceChildren('Suelta para disparar');
    else this.powerHint.replaceChildren('Mantén ', h('kbd', null, 'Espacio'), ' o clic para cargar');
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
    else b.textContent = locked ? 'Disparo listo' : 'Mantén Espacio o clic izquierdo';
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
    this.aimInfo.replaceChildren(h('span', { id: 'hud-watch', 'data-watch': text }, icon('eye'), ' ', h('b', null, text), h('span', { class: 'muted' }, this.touchUi ? '  ·  ◀ ▶ para cambiar' : '  ·  Q/E o ◀ ▶ para cambiar')));
  }

  dispose() {
    window.removeEventListener('keydown', this.keyHandler);
    window.removeEventListener('resize', this.onLayout);
    window.removeEventListener('pointerup', this.endHold);
    window.removeEventListener('pointercancel', this.endHold);
    clearTimeout(this.tipTimer);
    this.trayMq.removeEventListener('change', this.onLayout);
    this.trayObs.disconnect();
    this.root.remove();
  }
}
