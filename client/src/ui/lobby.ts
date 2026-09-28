import { DIFFICULTIES, MAX_PLAYERS, type Difficulty, type RoomState } from '../../../shared/protocol';
import { PLAYER_STYLES } from '../../../shared/players';
import { isMobileDevice } from '../device';
import type { Connection } from '../net/connection';
import { h, titleEl, toast } from './dom';
import { openSettings } from './settings';

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
  const children: Node[] = [h('label', { htmlFor: 'name' }, 'Nombre'), input];
  if (opts.code) {
    const join = h('button', { class: 'primary big', id: 'join' }, `Entrar en la sala ${opts.code}`);
    join.onclick = busy(join, () => opts.onJoin(getName()));
    children.push(join, h('div', { class: 'row', style: 'margin-top:10px' }, create));
  } else {
    children.push(create, solo);
  }
  const settingsBtn = h('button', { id: 'open-settings' }, '⚙️ Ajustes');
  settingsBtn.onclick = () => openSettings();
  const howBtn = h('button', { id: 'how-to' }, '❓ Cómo se juega');
  howBtn.onclick = () => showHowTo();
  children.push(err, h('div', { class: 'home-links' }, howBtn, settingsBtn));
  root.replaceChildren(
    h('div', { class: 'home-wrap' }, titleEl(), h('div', { class: 'subtitle' }, 'Castillos, catapultas y vacas explosivas · hasta 4 jugadores'), h('div', { class: 'panel', id: 'home' }, ...children)),
  );
  input.focus();
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') (root.querySelector('#join') ?? create).dispatchEvent(new MouseEvent('click'));
  });
  return { error: (msg: string) => ((err.textContent = msg), root.querySelectorAll('button').forEach((b) => (b.disabled = false))) };
}

// Resumen de cómo se juega (también accesible desde la portada).
export function showHowTo() {
  document.getElementById('howto')?.remove();
  const close = h('button', { class: 'primary big' }, 'Entendido');
  const modal = h(
    'div',
    { class: 'overlay modal', id: 'howto', role: 'dialog', 'aria-label': 'Cómo se juega' },
    h(
      'div',
      { class: 'panel' },
      h('h2', null, 'Cómo se juega'),
      h('p', null, '👑 Cada castillo protege a su rey. Gana el último rey en pie: cae si sale despedido fuera de su castillo, si lo aplastan o si toca la lava.'),
      h('p', null, '🎯 Cada ronda hay un objetivo secundario (una jaula de cristal, una pieza de hierro o bloques de torre de un rival). Quien lo cumple con su disparo empieza la ronda siguiente con una carta rara o épica.'),
      h('p', null, '🛡️ Escudo real: en las rondas 1 y 2 ningún rey puede caer. Si al final de la ronda un rey está fuera de su castillo, vuelve a su pedestal.'),
      isMobileDevice()
        ? h('p', null, '🎯 Todos los jugadores apuntan a la vez durante 20 s. Arrastra el dedo por la pantalla para girar la catapulta y ajustar la elevación. Mantén el botón redondo 🔥 para cargar la fuerza (la parábola se alarga) y suéltalo para disparar; después ya no se puede cambiar. Cuando todos están listos empieza la cuenta atrás: 3, 2, 1, ¡fuego! Las flechas ◀ ▶ cambian de castillo objetivo y el gesto de pellizcar acerca la cámara.')
        : h('p', null, '🎯 Todos los jugadores apuntan a la vez durante 20 s. Mantén el clic derecho y mueve el ratón para girar la catapulta y ajustar la elevación. Mantén Espacio o el clic izquierdo para cargar la fuerza (la parábola se alarga) y suelta para disparar; después ya no se puede cambiar. Cuando todos están listos empieza la cuenta atrás: 3, 2, 1, ¡fuego! Q/E cambian de castillo objetivo.'),
      h('p', null, isMobileDevice() ? '🐄 En cada ronda recibes 3 municiones distintas al azar: toca la tarjeta de la que quieras usar. Las defensivas (andamio y burbuja) protegen tu castillo.' : '🐄 En cada ronda recibes 3 municiones distintas al azar: elige una con 1, 2 o 3, o con un clic en su tarjeta. Las defensivas (andamio y burbuja) protegen tu castillo.'),
      h('p', null, '🌋 La lava sube cada 3 rondas y, desde la ronda 6, sopla el viento; la flecha de la esquina indica su dirección.'),
      close,
    ),
  );
  close.onclick = () => modal.remove();
  modal.onclick = (e) => e.target === modal && modal.remove();
  document.body.append(modal);
}

// Configuración de la partida en solitario: cuántos bots y de qué dificultad.
export function showSoloSetup(root: HTMLElement, opts: { onStart: (bots: number, d: Difficulty) => void; onSandbox: () => void; onBack: () => void }) {
  const bots = h('select', { id: 'solo-bots', 'aria-label': 'Número de bots' });
  for (let i = 1; i <= 3; i++) bots.append(h('option', { value: String(i), selected: i === 3 }, `${i} bot${i > 1 ? 's' : ''}`));
  const diff = h('select', { id: 'solo-difficulty', 'aria-label': 'Dificultad' });
  for (const d of DIFFICULTIES) diff.append(h('option', { value: d, selected: d === 'normal' }, DIFF_LABEL[d]));
  const start = h('button', { class: 'primary big', id: 'solo-start' }, 'Empezar partida');
  start.onclick = () => opts.onStart(Number(bots.value), diff.value as Difficulty);
  const sandbox = h('button', { class: 'big', id: 'sandbox' }, 'Campo de pruebas (munición ilimitada)');
  sandbox.onclick = () => opts.onSandbox();
  const back = h('button', { style: 'margin-top:12px' }, '← Volver');
  back.onclick = () => opts.onBack();
  root.replaceChildren(
    h(
      'div',
      { class: 'panel', id: 'solo-setup' },
      h('h2', null, 'Jugar solo'),
      h('p', { class: 'muted' }, 'Partida contra bots. Gana el último rey en pie.'),
      h('div', { class: 'row' }, h('div', null, h('label', { htmlFor: 'solo-bots' }, 'Rivales'), bots), h('div', null, h('label', { htmlFor: 'solo-difficulty' }, 'Dificultad'), diff)),
      start,
      sandbox,
      back,
    ),
  );
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
      toast('Enlace copiado. Compártelo con los demás jugadores.');
    };

    const list = h('ul', { class: 'players', id: 'player-list' });
    const bySlot = new Map(room.players.map((p) => [p.slot, p]));
    let botsLeft = room.config.bots;
    for (let slot = 0; slot < MAX_PLAYERS; slot++) {
      const st = PLAYER_STYLES[slot];
      const p = bySlot.get(slot);
      const banner = h('div', { class: 'banner', style: `background:${st.color};color:${st.ink};text-shadow:none` }, st.glyph);
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
        list.append(h('li', { class: 'empty' }, h('div', { class: 'banner', style: 'background:#bbb' }), 'Plaza libre'));
      }
    }

    const parts: Node[] = [
      h('h2', null, `Sala ${room.code}`),
      h('div', { class: 'muted' }, 'Comparte este enlace para invitar a otros jugadores:'),
      h('div', { class: 'link-box' }, linkInput, copy),
      list,
      h('div', { class: 'muted', id: 'spectators' }, room.spectators ? `👀 ${room.spectators} espectador${room.spectators > 1 ? 'es' : ''}` : ''),
    ];

    if (this.conn.you.role === 'spectator') {
      parts.push(h('p', { class: 'muted', id: 'spectator-note' }, 'La sala está completa: participas como espectador.'));
    } else if (isHost) {
      const free = MAX_PLAYERS - room.players.length;
      const bots = h('select', { id: 'bots', 'aria-label': 'Bots de relleno' });
      for (let i = 0; i <= free; i++) bots.append(h('option', { value: String(i), selected: i === room.config.bots }, i === 0 ? 'Sin bots' : `${i} bot${i > 1 ? 's' : ''}`));
      bots.onchange = () => this.conn.send({ t: 'config', config: { bots: Number(bots.value) } });
      const diff = h('select', { id: 'difficulty', 'aria-label': 'Dificultad de los bots' });
      for (const d of DIFFICULTIES) diff.append(h('option', { value: d, selected: d === room.config.difficulty }, DIFF_LABEL[d]));
      diff.onchange = () => this.conn.send({ t: 'config', config: { difficulty: diff.value as Difficulty } });
      const total = room.players.filter((p) => p.connected).length + room.config.bots;
      const start = h('button', { class: 'primary big', id: 'start', disabled: total < 2 }, total < 2 ? 'Se necesitan al menos 2 jugadores (añade bots)' : 'Empezar partida');
      start.onclick = () => this.conn.send({ t: 'start' });
      parts.push(h('div', { class: 'row' }, h('div', null, h('label', { htmlFor: 'bots' }, 'Bots'), bots), h('div', null, h('label', { htmlFor: 'difficulty' }, 'Dificultad'), diff)), start);
    } else {
      parts.push(h('p', { class: 'muted', id: 'waiting' }, 'Esperando a que el anfitrión empiece la partida…'));
    }
    this.el.replaceChildren(...parts);
  }
}
