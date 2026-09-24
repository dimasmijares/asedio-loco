import { AMMO, RARITY_COLOR, RARITY_LABEL, type AmmoId } from '../../../shared/ammo';
import { launchSpeed, type Aim } from '../../../shared/ballistics';
import { DEG, type Vec3 } from '../../../shared/math';
import { PLAYER_STYLES } from '../../../shared/players';
import { h } from './dom';

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
  private banner = h('div', { class: 'hud-banner', id: 'hud-banner' });
  private corner = h('div', { class: 'hud-corner' });
  private stats = h('div', { class: 'hud-stats', id: 'hud-stats' });
  confirmBtn = h('button', { class: 'primary hud-confirm', id: 'confirm' }, '¡Listo! (Espacio)');
  private bannerTimer = 0;

  constructor(parent: HTMLElement) {
    this.top.append(this.phase, this.timer);
    const bottom = h('div', { class: 'hud-bottom' }, this.aimInfo, this.ammo, this.confirmBtn);
    this.corner.append(this.wind, this.stats);
    this.root.append(this.top, this.players, this.corner, bottom, this.help, this.banner);
    parent.append(this.root);
    this.confirmBtn.style.display = 'none';
  }

  setPhase(text: string, sub = '') {
    this.phase.replaceChildren(h('b', null, text), sub ? h('span', null, sub) : '');
  }

  setTimer(sec: number | null, urgent = false) {
    this.timer.textContent = sec === null ? '' : String(Math.max(0, Math.ceil(sec)));
    this.timer.classList.toggle('urgent', urgent);
    this.timer.style.display = sec === null ? 'none' : '';
  }

  setAmmo(list: AmmoId[], selected: number, onSelect: (i: number) => void, keys = true) {
    this.ammo.replaceChildren(
      ...list.map((id, i) => {
        const a = AMMO[id];
        const b = h(
          'button',
          { class: `ammo${i === selected ? ' sel' : ''}`, title: `${a.name} (${RARITY_LABEL[a.rarity]}): ${a.desc}`, 'data-ammo': id, style: `--rar:${RARITY_COLOR[a.rarity]}` },
          h('span', { class: 'ammo-icon' }, a.icon),
          h('span', { class: 'ammo-name' }, a.name),
          keys && list.length <= 12 ? h('span', { class: 'ammo-key' }, String(i + 1 === 10 ? 0 : i + 1)) : null,
        );
        b.onclick = (e) => {
          e.stopPropagation();
          onSelect(i);
        };
        b.onpointerdown = (e) => e.stopPropagation();
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
        const pct = Math.round((p.blocks / Math.max(1, p.maxBlocks)) * 100);
        return h(
          'div',
          { class: `hp${p.alive ? '' : ' out'}${p.you ? ' you' : ''}`, 'data-slot': String(p.slot) },
          h('div', { class: 'banner', style: `background:${st.color}` }, st.glyph),
          h(
            'div',
            { class: 'hp-body' },
            h('div', { class: 'hp-name' }, p.name, p.bot ? ' 🤖' : '', p.connected === false ? ' 📡' : '', p.you ? ' (tú)' : ''),
            h('div', { class: 'hp-bar' }, h('div', { style: `width:${pct}%;background:${st.color}` })),
          ),
          h('div', { class: 'hp-state' }, p.alive ? (p.locked ? '✔' : '') : '💀'),
        );
      }),
    );
  }

  setHelp(text: string) {
    this.help.textContent = text;
  }

  setStats(text: string) {
    this.stats.textContent = text;
  }

  showBanner(text: string, sub = '', ms = 1800, cls = '') {
    this.banner.replaceChildren(h('div', { class: `banner-text ${cls}` }, text), sub ? h('div', { class: 'banner-sub' }, sub) : '');
    this.banner.classList.remove('show');
    void this.banner.offsetWidth;
    this.banner.classList.add('show');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = window.setTimeout(() => this.banner.classList.remove('show'), ms);
  }

  showConfirm(show: boolean, locked = false) {
    this.confirmBtn.style.display = show ? '' : 'none';
    this.confirmBtn.disabled = locked;
    this.confirmBtn.textContent = locked ? '¡Listo! Esperando a los demás…' : '¡Listo! (Espacio)';
  }

  dispose() {
    this.root.remove();
  }
}
