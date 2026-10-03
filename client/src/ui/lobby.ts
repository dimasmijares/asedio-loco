import { DIFFICULTIES, MAX_NAME_LEN, MAX_PLAYERS, ROOM_CODE_RE, sanitizeName, type Difficulty } from '../../../shared/protocol';
import { BOT_NAMES, PLAYER_STYLES, randomName } from '../../../shared/players';
import { isMobileDevice, trayLayout } from '../device';
import type { Connection } from '../net/connection';
import { ammoArt } from './ammoArt';
import { h, toast } from './dom';
import { icon, type IconName } from './icons';
import { openSettings } from './settings';

const NAME_KEY = 'asedio.name';
const DIFF_LABEL: Record<Difficulty, string> = { facil: 'Fácil', normal: 'Normal', dificil: 'Difícil' };

// Nombre del jugador, guardado en el dispositivo. La primera vez, uno al azar (R-10 U9): ya no hace
// falta escribirlo para empezar.
export function savedName(): string {
  let n = '';
  try {
    n = sanitizeName(localStorage.getItem(NAME_KEY) ?? '');
  } catch {
    /* sin almacenamiento */
  }
  return n || storeName(randomName());
}

function storeName(n: string) {
  try {
    localStorage.setItem(NAME_KEY, n);
  } catch {
    /* sin almacenamiento */
  }
  return n;
}

// Píldora «Juegas como <nombre>» con el dado (otro al azar) y el lápiz (editarlo en el sitio).
function namePill() {
  const text = h('b', { class: 'name-text', id: 'name-text' }, savedName());
  const dice = h('button', { class: 'pill-btn dice', id: 'name-random', type: 'button', 'aria-label': 'Nombre al azar', title: 'Nombre al azar' }, icon('dice'));
  const edit = h('button', { class: 'pill-btn', id: 'name-edit', type: 'button', 'aria-label': 'Cambiar nombre', title: 'Cambiar nombre' }, icon('pencil'));
  const pill = h('div', { class: 'name-pill', id: 'name-pill' }, h('span', { class: 'name-as' }, 'Juegas como'), text, dice, edit);
  dice.onclick = () => (text.textContent = storeName(randomName(Math.random, savedName())));
  edit.onclick = () => {
    if (pill.classList.contains('editing')) return;
    const input = h('input', { id: 'name', class: 'name-input', maxLength: MAX_NAME_LEN, value: savedName(), autocomplete: 'nickname', 'aria-label': 'Tu nombre' });
    let done = false;
    // Al terminar (Intro o al salir del campo) se guarda; vacío, otro al azar. Escape lo deja como estaba.
    const finish = (keep: boolean) => {
      if (done) return;
      done = true;
      if (keep) text.textContent = storeName(sanitizeName(input.value) || randomName(Math.random, savedName()));
      input.replaceWith(text);
      pill.classList.remove('editing');
    };
    input.onkeydown = (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    };
    input.onblur = () => finish(true);
    text.replaceWith(input);
    pill.classList.add('editing');
    input.focus();
    input.select();
  };
  return pill;
}

// Tablón de menú (componente Botones): naranja el principal y crema los demás.
const plank = (id: string, label: string, primary = false) => h('button', { class: `big plank${primary ? ' primary' : ''}`, id, type: 'button' }, label);

// Botón redondo crema con un icono (ayuda, ajustes, volver).
const roundBtn = (id: string, name: IconName, label: string) => h('button', { class: 'round-btn', id, type: 'button', 'aria-label': label, title: label }, icon(name));

// Portada (R-10 U9, maquetas «Móvil · Portada» y «PC · Portada»): título en dos líneas, el nombre al
// azar, JUGAR SOLO, CREAR SALA y UNIRSE CON CÓDIGO, y abajo la ayuda y los ajustes. En móvil vertical,
// el título sobre el cielo y el menú abajo; en PC, una columna a la izquierda y la escena a la derecha.
// Con un enlace de invitación (#ABCD), ENTRAR es la acción principal (decisión del usuario, 03-10-2026).
export function showHome(root: HTMLElement, opts: { code?: string; onCreate: () => void; onJoin: (code: string) => void; onSolo: () => void }) {
  const err = h('div', { class: 'home-error', id: 'home-error', role: 'alert', hidden: true });
  const fail = (msg: string) => {
    err.textContent = msg;
    err.hidden = !msg;
  };
  const busy = (b: HTMLButtonElement, fn: () => void) => () => {
    fail('');
    b.disabled = true;
    fn();
  };
  const solo = plank('solo', 'Jugar solo', !opts.code);
  solo.onclick = () => opts.onSolo();
  const create = plank('create', 'Crear sala');
  create.onclick = busy(create, () => opts.onCreate());
  const planks: Node[] = [];
  const wrap = h('div', { class: `home${opts.code ? ' invited' : ''}`, id: 'home' });
  if (opts.code) {
    const enter = plank('join', 'Entrar', true);
    enter.onclick = busy(enter, () => opts.onJoin(opts.code!));
    planks.push(enter, solo, create);
  } else {
    // Unirse con código: en PC, el campo y UNIRSE en una fila; en móvil, el tablón se abre en esa
    // misma fila (decisión del usuario, 03-10-2026).
    const code = h('input', { id: 'code', class: 'code-input', maxLength: 4, placeholder: 'CÓDIGO', autocomplete: 'off', autocapitalize: 'characters', spellcheck: false, 'aria-label': 'Código de sala' });
    const go = plank('join-code', 'Unirse');
    const join = async () => {
      const c = code.value.trim().toUpperCase();
      if (!ROOM_CODE_RE.test(c)) return fail('El código de sala son 4 letras');
      fail('');
      go.disabled = true;
      try {
        const r = await fetch(`/api/rooms/${c}`);
        const info = (await r.json()) as { exists?: boolean };
        if (!info.exists) throw new Error(`No hay ninguna sala con el código ${c}`);
        opts.onJoin(c);
      } catch (e) {
        go.disabled = false;
        fail(e instanceof SyntaxError || e instanceof TypeError ? 'No se pudo comprobar la sala; prueba otra vez' : (e as Error).message);
      }
    };
    go.onclick = () => void join();
    code.oninput = () => (code.value = code.value.toUpperCase().replace(/[^A-Z]/g, ''));
    code.onkeydown = (e) => {
      if (e.key === 'Enter') void join();
    };
    const open = plank('join-open', 'Unirse con código');
    open.onclick = () => {
      wrap.classList.add('join-open');
      code.focus();
    };
    planks.push(solo, create, open, h('div', { class: 'join-row', id: 'join-row' }, code, go));
  }
  const how = roundBtn('how-to', 'help', 'Cómo se juega');
  how.onclick = () => showHowTo();
  const gear = roundBtn('open-settings', 'gear', 'Ajustes');
  gear.onclick = () => openSettings();
  wrap.append(
    h(
      'div',
      { class: 'home-head' },
      h('h1', { class: 'home-title', 'aria-label': 'Asedio Loco' }, h('span', { 'aria-hidden': 'true' }, 'ASEDIO'), h('span', { 'aria-hidden': 'true' }, 'LOCO')),
      h('p', { class: 'home-sub' }, 'Castillos, catapultas y vacas explosivas'),
    ),
    h(
      'div',
      { class: 'home-menu' },
      namePill(),
      opts.code ? h('p', { class: 'home-invite', id: 'home-invite' }, 'Te invitan a la sala ', h('b', null, opts.code)) : null,
      h('div', { class: 'home-planks' }, ...planks),
      err,
      h('div', { class: 'home-round' }, how, gear),
    ),
  );
  root.replaceChildren(wrap);
  return { error: (msg: string) => (fail(msg), root.querySelectorAll('button').forEach((b) => (b.disabled = false))) };
}

// Resumen de cómo se juega (también accesible desde la portada), con iconos en vez de emoji (R-10).
export function showHowTo() {
  document.getElementById('howto')?.remove();
  const close = h('button', { class: 'primary big', id: 'howto-close' }, 'Entendido');
  const touch = isMobileDevice();
  const item = (ico: Node, text: string) => h('p', { class: 'howto-item' }, h('span', { class: 'howto-ico' }, ico), h('span', null, text));
  const aim = trayLayout()
    ? 'Todos apuntan a la vez durante 20 s. Arrastra el dedo por el pad de la bandeja: a los lados giras la catapulta y arriba o abajo cambias la elevación (para girar mucho, arrastra por la escena). Mantén el botón rojo para cargar la fuerza y suéltalo para disparar; después ya no se puede cambiar.'
    : touch
      ? 'Todos apuntan a la vez durante 20 s. Arrastra el dedo por la pantalla para girar la catapulta y cambiar la elevación. Mantén el botón rojo para cargar la fuerza y suéltalo para disparar; después ya no se puede cambiar. Las flechas cambian de castillo objetivo.'
      : 'Todos apuntan a la vez durante 20 s. Mantén el clic derecho y mueve el ratón para girar la catapulta y cambiar la elevación. Mantén Espacio o el clic izquierdo para cargar la fuerza y suelta para disparar; después ya no se puede cambiar. Q y E cambian de castillo objetivo y H enseña los controles.';
  const modal = h(
    'div',
    { class: 'overlay modal', id: 'howto', role: 'dialog', 'aria-label': 'Cómo se juega' },
    h(
      'div',
      { class: 'panel' },
      h('h2', null, 'Cómo se juega'),
      item(icon('crown'), 'Cada castillo protege a su rey. Gana el último rey en pie: cae si sale despedido fuera de su castillo, si lo aplastan o si toca la lava.'),
      item(icon(touch ? 'hand' : 'mouse'), aim),
      item(
        ammoArt('cow'),
        touch
          ? 'En cada ronda recibes 3 municiones distintas al azar: toca una carta para elegirla y mantén el dedo encima para ver qué hace.'
          : 'En cada ronda recibes 3 municiones distintas al azar: elige una con 1, 2 o 3 o con un clic en su carta; al pasar el ratón ves qué hace.',
      ),
      item(icon('target'), 'Cada ronda hay un objetivo secundario (una jaula de cristal, una pieza de hierro o bloques de torre de un rival). Quien lo cumple empieza la ronda siguiente con una carta rara o épica.'),
      item(icon('shield'), 'Escudo real: en las rondas 1 y 2 ningún rey puede caer. Si al final de la ronda un rey está fuera de su castillo, vuelve a su pedestal.'),
      item(icon('wind'), 'La lava sube un poco en cada ronda y, desde la ronda 6, sopla el viento: su chip, arriba, dice hacia dónde y con qué fuerza.'),
      close,
    ),
  );
  close.onclick = () => modal.remove();
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  document.body.append(modal);
}

// Selector segmentado de 48 px (R-10 U10): la opción elegida en naranja sobre una pista crema oscuro.
function segmented<T extends string | number>(id: string, label: string, options: [T, string][], value: T, onChange: (v: T) => void) {
  const row = h('div', { class: 'segm', id, role: 'radiogroup', 'aria-label': label });
  const render = (v: T) =>
    row.replaceChildren(
      ...options.map(([val, text]) => {
        const b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(val === v), 'data-v': String(val), class: val === v ? 'on' : '' }, text);
        b.onclick = () => {
          render(val);
          onChange(val);
        };
        return b;
      }),
    );
  render(value);
  return h('div', { class: 'segm-field' }, h('span', { class: 'segm-label' }, label), row);
}

// Jugar solo (R-10 U10, maqueta «Móvil · Jugar solo»): hoja crema abajo en móvil y tarjeta centrada
// en PC, con volver, rivales y dificultad en selectores segmentados, los rivales que tocan con su
// emblema y su nombre, EMPEZAR y el campo de pruebas como enlace.
export function showSoloSetup(root: HTMLElement, opts: { onStart: (bots: number, d: Difficulty, names: string[]) => void; onSandbox: () => void; onBack: () => void }) {
  let bots = 3;
  let diff: Difficulty = 'normal';
  // Los rivales salen de la lista de bots a partir de un punto al azar; la partida usa estos mismos.
  const from = Math.floor(Math.random() * BOT_NAMES.length);
  const names = () => Array.from({ length: bots }, (_, i) => BOT_NAMES[(from + i) % BOT_NAMES.length]);
  const rivals = h('div', { class: 'solo-rivals', id: 'solo-rivals' });
  const renderRivals = () => {
    // Los huecos de los bots, como en la partida (SoloMode): con uno, el de enfrente.
    const slots = [0, 2, 1, 3].slice(0, 1 + bots).sort().slice(1);
    const n = names();
    rivals.replaceChildren(
      h('span', { class: 'solo-embs', 'aria-hidden': 'true' }, ...slots.map((s) => h('span', { class: 'emb', style: `background:${PLAYER_STYLES[s].color};color:${PLAYER_STYLES[s].ink}` }, `${PLAYER_STYLES[s].glyph}︎`))),
      h('span', { class: 'solo-names' }, n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}` : n[0]),
    );
  };
  renderRivals();
  const back = roundBtn('solo-back', 'back', 'Volver');
  back.onclick = () => opts.onBack();
  const start = plank('solo-start', 'Empezar', true);
  start.onclick = () => opts.onStart(bots, diff, names());
  const sandbox = h('button', { class: 'link-btn', id: 'sandbox', type: 'button' }, 'Campo de pruebas · munición sin límite');
  sandbox.onclick = () => opts.onSandbox();
  root.replaceChildren(
    h(
      'div',
      { class: 'solo-wrap' },
      h(
        'div',
        { class: 'solo-card', id: 'solo-setup', role: 'dialog', 'aria-label': 'Jugar solo' },
        h('div', { class: 'solo-head' }, back, h('h2', null, 'Jugar solo')),
        segmented('solo-bots', 'Rivales', [[1, '1'], [2, '2'], [3, '3']], bots, (v) => {
          bots = v;
          renderRivals();
        }),
        rivals,
        segmented(
          'solo-difficulty',
          'Dificultad',
          DIFFICULTIES.map((d) => [d, DIFF_LABEL[d]] as [Difficulty, string]),
          diff,
          (v) => (diff = v),
        ),
        h('div', { class: 'solo-actions' }, start, sandbox),
      ),
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
            p.id === this.conn.you.id ? h('span', { class: 'tag', style: `background:${st.color};color:var(--al-noche)` }, 'Tú') : null,
            p.connected ? null : h('span', { class: 'tag off' }, 'Desconectado'),
          ),
        );
      } else if (botsLeft > 0) {
        botsLeft--;
        list.append(h('li', { 'data-bot': 'true' }, banner, h('span', { class: 'name' }, `Bot (${DIFF_LABEL[room.config.difficulty]})`), h('span', { class: 'tag bot' }, 'Bot')));
      } else {
        list.append(h('li', { class: 'empty' }, h('div', { class: 'banner', style: 'background:var(--al-crema-oscuro)' }), 'Plaza libre'));
      }
    }

    const parts: Node[] = [
      h('h2', null, `Sala ${room.code}`),
      h('div', { class: 'muted' }, 'Comparte este enlace para invitar a otros jugadores:'),
      h('div', { class: 'link-box' }, linkInput, copy),
      list,
      h('div', { class: 'muted', id: 'spectators' }, room.spectators ? h('span', null, icon('eye'), ` ${room.spectators} espectador${room.spectators > 1 ? 'es' : ''}`) : ''),
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
