import { DIFFICULTIES, MAX_PLAYERS, type Difficulty, type RoomState } from '../../../shared/protocol';
import { PLAYER_STYLES } from '../../../shared/players';
import type { Connection } from '../net/connection';
import { h, titleEl, toast } from './dom';

const NAME_KEY = 'asedio.name';
const DIFF_LABEL: Record<Difficulty, string> = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' };

export function savedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function showHome(root: HTMLElement, opts: { code?: string; onCreate: (name: string) => void; onJoin: (name: string) => void; onSolo: (name: string) => void }) {
  const input = h('input', { id: 'name', maxLength: 16, placeholder: 'Tu nombre', value: savedName(), autocomplete: 'nickname' });
  const err = h('div', { class: 'error', id: 'home-error' });
  const getName = () => {
    const n = input.value.trim();
    try {
      localStorage.setItem(NAME_KEY, n);
    } catch {
      /* sin almacenamiento */
    }
    return n;
  };
  const busy = (b: HTMLButtonElement, fn: () => void) => () => {
    b.disabled = true;
    fn();
  };
  const create = h('button', { class: opts.code ? '' : 'primary big', id: 'create' }, opts.code ? 'Crear otra sala' : 'Crear sala');
  create.onclick = busy(create, () => opts.onCreate(getName()));
  const solo = h('button', { class: 'big', id: 'solo' }, 'Jugar solo contra bots');
  solo.onclick = () => opts.onSolo(getName());
  const children: Node[] = [titleEl(), h('label', { htmlFor: 'name' }, '¿Cómo te llamas?'), input];
  if (opts.code) {
    const join = h('button', { class: 'primary big', id: 'join' }, `Entrar en la sala ${opts.code}`);
    join.onclick = busy(join, () => opts.onJoin(getName()));
    children.push(join, h('div', { class: 'row', style: 'margin-top:10px' }, create));
  } else {
    children.push(create, solo);
  }
  children.push(err);
  root.replaceChildren(h('div', { class: 'panel', id: 'home' }, ...children));
  input.focus();
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') (root.querySelector('#join') ?? create).dispatchEvent(new MouseEvent('click'));
  });
  return { error: (msg: string) => ((err.textContent = msg), root.querySelectorAll('button').forEach((b) => (b.disabled = false))) };
}

export class LobbyView {
  private el: HTMLElement;

  constructor(private root: HTMLElement, private conn: Connection) {
    this.el = h('div', { class: 'panel', id: 'lobby' });
    root.replaceChildren(this.el);
    conn.on('room', () => this.render());
    conn.on('status', () => this.render());
    conn.on('error', (e) => toast(e.msg));
    this.render();
  }

  render() {
    const room = this.conn.room;
    if (!this.root.contains(this.el)) return;
    if (!room || !this.conn.you) {
      this.el.replaceChildren(h('h2', null, 'Conectando…'), h('p', { class: 'muted' }, this.conn.status === 'closed' ? 'Reintentando la conexión…' : 'Entrando en la sala'));
      return;
    }
    const isHost = this.conn.isHost;
    const url = `${location.origin}/#${room.code}`;
    const linkInput = h('input', { readOnly: true, value: url, id: 'room-link', 'aria-label': 'Enlace de la sala' });
    const copy = h('button', { id: 'copy-link' }, 'Copiar enlace');
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(url);
      } catch {
        linkInput.select();
        document.execCommand('copy');
      }
      toast('¡Enlace copiado! Pásaselo a tus amigos');
    };

    const list = h('ul', { class: 'players', id: 'player-list' });
    const bySlot = new Map(room.players.map((p) => [p.slot, p]));
    let botsLeft = room.config.bots;
    for (let slot = 0; slot < MAX_PLAYERS; slot++) {
      const st = PLAYER_STYLES[slot];
      const p = bySlot.get(slot);
      const banner = h('div', { class: 'banner', style: `background:${st.color}` }, st.glyph);
      if (p) {
        list.append(
          h(
            'li',
            { 'data-player': p.id },
            banner,
            h('span', { class: 'name' }, p.name),
            p.id === room.hostId ? h('span', { class: 'tag' }, 'Anfitrión') : null,
            p.id === this.conn.you.id ? h('span', { class: 'tag', style: `background:${st.color};color:#000` }, 'Tú') : null,
            p.connected ? null : h('span', { class: 'tag off' }, 'Desconectado'),
          ),
        );
      } else if (botsLeft > 0) {
        botsLeft--;
        list.append(h('li', { 'data-bot': 'true' }, banner, h('span', { class: 'name' }, `Bot (${DIFF_LABEL[room.config.difficulty]})`), h('span', { class: 'tag bot' }, 'Bot')));
      } else {
        list.append(h('li', { class: 'empty' }, h('div', { class: 'banner', style: 'background:#bbb' }), 'Hueco libre'));
      }
    }

    const parts: Node[] = [
      h('h2', null, `Sala ${room.code}`),
      h('div', { class: 'muted' }, 'Comparte este enlace para que entren tus amigos:'),
      h('div', { class: 'link-box' }, linkInput, copy),
      list,
      h('div', { class: 'muted', id: 'spectators' }, room.spectators ? `👀 ${room.spectators} espectador${room.spectators > 1 ? 'es' : ''}` : ''),
    ];

    if (this.conn.you.role === 'spectator') {
      parts.push(h('p', { class: 'muted', id: 'spectator-note' }, 'La sala está llena: miras como espectador.'));
    } else if (isHost) {
      const free = MAX_PLAYERS - room.players.length;
      const bots = h('select', { id: 'bots', 'aria-label': 'Bots de relleno' });
      for (let i = 0; i <= free; i++) bots.append(h('option', { value: String(i), selected: i === room.config.bots }, i === 0 ? 'Sin bots' : `${i} bot${i > 1 ? 's' : ''}`));
      bots.onchange = () => this.conn.send({ t: 'config', config: { bots: Number(bots.value) } });
      const diff = h('select', { id: 'difficulty', 'aria-label': 'Dificultad de los bots' });
      for (const d of DIFFICULTIES) diff.append(h('option', { value: d, selected: d === room.config.difficulty }, DIFF_LABEL[d]));
      diff.onchange = () => this.conn.send({ t: 'config', config: { difficulty: diff.value as Difficulty } });
      const total = room.players.filter((p) => p.connected).length + room.config.bots;
      const start = h('button', { class: 'primary big', id: 'start', disabled: total < 2 }, total < 2 ? 'Faltan rivales (añade bots)' : '¡A la batalla!');
      start.onclick = () => this.conn.send({ t: 'start' });
      parts.push(h('div', { class: 'row' }, h('div', null, h('label', { htmlFor: 'bots' }, 'Bots'), bots), h('div', null, h('label', { htmlFor: 'difficulty' }, 'Dificultad'), diff)), start);
    } else {
      parts.push(h('p', { class: 'muted', id: 'waiting' }, 'Esperando a que el anfitrión empiece la partida…'));
    }
    this.el.replaceChildren(...parts);
  }
}
