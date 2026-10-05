import { DIFFICULTIES, MAX_NAME_LEN, MAX_PLAYERS, ROOM_CODE_RE, sanitizeName, type Difficulty } from '../../../shared/protocol';
import { PLAYER_STYLES, botName, randomName, soloSlots } from '../../../shared/players';
import { isMobileDevice, trayLayout } from '../device';
import type { Connection } from '../net/connection';
import { ammoArt } from './ammoArt';
import { h, toast } from './dom';
import { icon, type IconName } from './icons';
import { openSettings } from './settings';
import { showSheet } from './sheet';

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
      item(icon('flag'), 'Cada ronda hay un objetivo secundario (una jaula de cristal, una pieza de hierro o bloques de torre de un rival). Quien lo cumple empieza la ronda siguiente con una carta rara o épica.'),
      item(icon('shield'), 'Escudo real: en las rondas 1 y 2 ningún rey puede caer. Si al final de la ronda un rey está fuera de su castillo, vuelve a su pedestal.'),
      item(icon('flame'), 'La lava sube un poco en cada ronda y destruye los bloques que alcanza.'),
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
// `bots` y `difficulty`: lo elegido la última vez («Cambiar rivales» al final de una partida, R-07 F8).
export function showSoloSetup(root: HTMLElement, opts: { onStart: (bots: number, d: Difficulty) => void; onSandbox: () => void; onBack: () => void; bots?: number; difficulty?: Difficulty }) {
  let bots = opts.bots ?? 3;
  let diff: Difficulty = opts.difficulty ?? 'normal';
  const rivals = h('div', { class: 'solo-rivals', id: 'solo-rivals' });
  const renderRivals = () => {
    // Huecos y nombres de shared/players (soloSlots, botName): los mismos que usa la partida.
    const slots = soloSlots(bots).slice(1);
    const n = slots.map(botName);
    rivals.replaceChildren(
      h('span', { class: 'solo-embs', 'aria-hidden': 'true' }, ...slots.map((s) => h('span', { class: 'emb', style: `background:${PLAYER_STYLES[s].color};color:${PLAYER_STYLES[s].ink}` }, `${PLAYER_STYLES[s].glyph}︎`))),
      h('span', { class: 'solo-names' }, n.length > 1 ? `${n.slice(0, -1).join(', ')} y ${n[n.length - 1]}` : n[0]),
    );
  };
  renderRivals();
  const back = roundBtn('solo-back', 'back', 'Volver');
  back.onclick = () => opts.onBack();
  const start = plank('solo-start', 'Empezar', true);
  start.onclick = () => opts.onStart(bots, diff);
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

// Píldora «Salir de la sala» (R-11 S4): noche con borde crema oscuro, arriba a la izquierda.
const leavePill = (id: string) => h('button', { class: 'leave-pill', id, type: 'button' }, icon('logout'), h('span', null, 'Salir de la sala'));

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Sin permiso o sin contexto seguro: el viejo `execCommand` con un campo temporal.
    const t = h('textarea', { value: text, readOnly: true, style: 'position:fixed;left:-9999px' });
    document.body.append(t);
    t.select();
    const ok = document.execCommand('copy');
    t.remove();
    return ok;
  }
}

// Sala (R-11, maquetas «Móvil · Sala» y «PC · Sala»). En vertical: «Salir de la sala» y el engranaje
// arriba, la tarjeta del código y, debajo, la hoja crema con las plazas. En horizontal: una columna
// noche a la izquierda (salir, «Sala de <anfitrión>», el código, ayuda y ajustes) y la tarjeta de las
// plazas a la derecha. Es el mismo DOM: lo coloca el CSS.
export class LobbyView {
  private el: HTMLElement;
  private title = h('h1', { class: 'room-title', id: 'room-title' });
  private code = h('div', { class: 'code-tiles', id: 'room-code' });
  private codeKey = '';

  constructor(private root: HTMLElement, private conn: Connection) {
    this.el = h('div', { class: 'room-sheet', id: 'lobby' });
    const leave = leavePill('leave-room');
    leave.onclick = () => this.confirmLeave();
    const help = roundBtn('room-help', 'help', 'Cómo se juega');
    help.onclick = () => showHowTo();
    const gear = roundBtn('room-settings', 'gear', 'Ajustes');
    gear.onclick = () => openSettings();
    root.replaceChildren(
      h(
        'div',
        { class: 'room', id: 'room' },
        h('div', { class: 'room-side' }, leave, this.title, this.codeCard(), h('div', { class: 'room-round' }, help, gear)),
        this.el,
      ),
    );
    conn.on('room', () => this.render());
    conn.on('status', () => this.render());
    conn.on('error', (e) => toast(e.msg));
    this.render();
  }

  // Código grande y cómo invitar (R-11 S1): en móvil, COMPARTIR abre la hoja del sistema con el
  // enlace (Web Share; sin ella, copia el enlace) y el botón redondo copia el código; en PC, COPIAR
  // ENLACE y CÓDIGO.
  private codeCard() {
    const url = () => `${location.origin}/#${this.conn.code}`;
    const copyCode = async () => toast((await copyText(this.conn.code)) ? `Código ${this.conn.code} copiado` : `El código es ${this.conn.code}`);
    const copyLink = async () => toast((await copyText(url())) ? 'Enlace copiado. Compártelo con los demás jugadores.' : url());
    let actions: HTMLElement[];
    if (isMobileDevice()) {
      const share = h('button', { class: 'big plank primary', id: 'share', type: 'button' }, icon('share'), h('span', null, 'Compartir'));
      share.onclick = async () => {
        const data = { title: 'Asedio Loco', text: `Únete a mi sala de Asedio Loco con el código ${this.conn.code}`, url: url() };
        if (!navigator.share) return void copyLink();
        try {
          await navigator.share(data);
        } catch (e) {
          // Cerrar la hoja del sistema no es un error; si no se pudo abrir, se copia el enlace.
          if ((e as Error).name !== 'AbortError') void copyLink();
        }
      };
      const copy = roundBtn('copy-code', 'copy', 'Copiar código');
      copy.onclick = () => void copyCode();
      actions = [share, copy];
    } else {
      const link = h('button', { class: 'big plank primary', id: 'copy-link', type: 'button' }, icon('link'), h('span', null, 'Copiar enlace'));
      link.onclick = () => void copyLink();
      const copy = h('button', { class: 'big plank', id: 'copy-code', type: 'button' }, icon('copy'), h('span', null, 'Código'));
      copy.onclick = () => void copyCode();
      actions = [link, copy];
    }
    return h(
      'div',
      { class: 'code-card' },
      h('span', { class: 'code-label' }, 'CÓDIGO DE LA SALA'),
      this.code,
      h('span', { class: 'code-hint' }, 'Tus amigos lo escriben en «Unirse con código»'),
      h('div', { class: 'code-actions' }, ...actions),
    );
  }

  // «¿Salir de la sala?» (R-11 S4): la plaza queda libre al momento; si eres el anfitrión, dice
  // quién hereda (el siguiente jugador conectado por orden de plaza, como hace el servidor).
  confirmLeave() {
    const room = this.conn.room;
    const you = this.conn.you;
    let text: Node | string = 'Tu plaza quedará libre al momento.';
    if (!room || !you || you.role === 'spectator') text = 'Dejarás de mirar esta sala.';
    else if (this.conn.isHost) {
      const heir = room.players.filter((p) => p.id !== you.id && p.connected).sort((a, b) => a.slot - b.slot)[0];
      text = heir
        ? h('span', null, 'Tu plaza quedará libre al momento. Como eres el anfitrión, ', h('b', null, heir.name), ' pasará a serlo y podrá empezar la partida.')
        : 'Tu plaza quedará libre al momento. No queda nadie más: la sala se cerrará.';
    }
    showSheet({
      id: 'leave-room-sheet',
      title: '¿Salir de la sala?',
      text,
      actions: [
        {
          id: 'leave-room-ok',
          label: 'Salir',
          kind: 'danger',
          onClick: () => {
            this.conn.leave();
            location.hash = '';
            location.reload();
          },
        },
        { id: 'leave-room-stay', label: 'Quedarme', onClick: () => {} },
      ],
      dismiss: () => {},
    });
  }

  // Tu nombre en tu fila (R-11 S3): el dado pone otro al azar; el lápiz lo abre en un campo que ocupa
  // la fila (la tarjeta del código se recoge para que la hoja quede por encima del teclado). Intro o
  // el ✓ lo guardan; vacío, otro al azar. Escape lo deja como estaba.
  private editing: HTMLInputElement | null = null;

  private saveName(raw: string) {
    const cur = this.conn.room?.players.find((p) => p.id === this.conn.you?.id)?.name ?? savedName();
    const name = storeName(sanitizeName(raw) || randomName(Math.random, cur));
    this.conn.name = name;
    this.conn.send({ t: 'name', name });
    this.stopEditing();
  }

  private startEditing(name: string) {
    const input = h('input', { id: 'room-name', class: 'seat-input', maxLength: MAX_NAME_LEN, value: name, autocomplete: 'nickname', enterKeyHint: 'done', 'aria-label': 'Tu nombre' });
    input.onkeydown = (e) => {
      if (e.key === 'Enter') this.saveName(input.value);
      if (e.key === 'Escape') this.stopEditing();
    };
    this.editing = input;
    this.render();
    input.focus();
    input.select();
  }

  private stopEditing() {
    this.editing = null;
    this.render();
  }

  // Una plaza (R-11 S2, S3, S6): color y emblema de la plaza; tu fila con el dado y el lápiz. El
  // anfitrión toca una plaza libre para añadir un bot y un bot o un jugador desconectado para quitarlo.
  private seat(slot: number) {
    const room = this.conn.room!;
    const you = this.conn.you!;
    const host = this.conn.isHost;
    const st = PLAYER_STYLES[slot];
    const p = room.players.find((x) => x.slot === slot);
    const bot = !p && room.config.botSlots.includes(slot);
    const emb = h('span', { class: 'seat-emb', style: `background:${st.color};color:${st.ink}` }, `${st.glyph}︎`);
    const chip = (cls: string, text: string, ico?: IconName) => h('span', { class: `seat-chip ${cls}` }, ico ? icon(ico) : null, text);
    const body = (name: Node | string, ...chips: (Node | string)[]) => h('span', { class: 'seat-body' }, h('span', { class: 'seat-name' }, name), h('span', { class: 'seat-chips' }, ...chips));
    const quit = () => h('span', { class: 'seat-quit' }, icon('cross'), 'Quitar');
    const tap = (bot: boolean) => () => this.conn.send({ t: 'seat', slot, bot });
    const li = h('li', { class: 'seat', 'data-slot': String(slot) });
    if (p) {
      li.dataset.player = p.id;
      const isHost = p.id === room.hostId;
      if (p.id === you.id) {
        li.classList.add('me');
        const dice = h('button', { class: 'seat-btn dice', id: 'room-name-random', type: 'button', 'aria-label': 'Nombre al azar', title: 'Nombre al azar' }, icon('dice'));
        // Sin quitar el foco al campo (si se está editando, el dado escribe en él).
        dice.onpointerdown = (e) => e.preventDefault();
        dice.onclick = () => {
          if (this.editing) this.editing.value = randomName(Math.random, this.editing.value);
          else this.saveName(randomName(Math.random, p.name));
        };
        if (this.editing) {
          const ok = h('button', { class: 'seat-btn ok', id: 'room-name-save', type: 'button', 'aria-label': 'Guardar nombre', title: 'Guardar nombre' }, icon('check'));
          ok.onpointerdown = (e) => e.preventDefault();
          ok.onclick = () => this.saveName(this.editing!.value);
          li.append(h('div', { class: 'seat-card' }, emb, h('span', { class: 'seat-body' }, this.editing), dice, ok));
        } else {
          const edit = h('button', { class: 'seat-btn', id: 'room-name-edit', type: 'button', 'aria-label': 'Cambiar nombre', title: 'Cambiar nombre' }, icon('pencil'));
          edit.onclick = () => this.startEditing(p.name);
          li.append(h('div', { class: 'seat-card' }, emb, body(h('span', { id: 'room-name-text' }, p.name), chip('you', 'TÚ'), isHost ? chip('host', 'ANFITRIÓN', 'crown') : ''), dice, edit));
        }
      } else if (!p.connected && host) {
        const b = h('button', { class: 'seat-card off', type: 'button', 'aria-label': `Quitar ${p.name}` }, emb, body(p.name, chip('off', 'DESCONECTADO', 'offline')), quit());
        b.onclick = tap(false);
        li.append(b);
      } else li.append(h('div', { class: `seat-card${p.connected ? '' : ' off'}` }, emb, body(p.name, isHost ? chip('host', 'ANFITRIÓN', 'crown') : '', p.connected ? chip('on', 'CONECTADO') : chip('off', 'DESCONECTADO', 'offline'))));
    } else if (bot) {
      li.dataset.bot = String(slot);
      const name = botName(slot);
      if (host) {
        const b = h('button', { class: 'seat-card bot', type: 'button', 'aria-label': `Quitar ${name}` }, emb, body(name, chip('bot', 'BOT', 'bot')), quit());
        b.onclick = tap(false);
        li.append(b);
      } else li.append(h('div', { class: 'seat-card bot' }, emb, body(name, chip('bot', 'BOT', 'bot'))));
    } else {
      li.classList.add('empty');
      const free = h('span', { class: 'seat-emb free', style: `border-color:${st.color}` }, icon('plus'));
      if (host) {
        const b = h('button', { class: 'seat-card free host', id: `seat-add-${slot}`, type: 'button', 'aria-label': `Añadir un bot en la plaza ${slot + 1}` }, free, h('span', { class: 'seat-body' }, h('span', { class: 'seat-name' }, 'Añadir bot'), h('span', { class: 'seat-sub' }, 'o espera a que entre alguien')));
        b.onclick = tap(true);
        li.append(b);
      } else li.append(h('div', { class: 'seat-card free' }, free, h('span', { class: 'seat-free' }, 'Plaza libre')));
    }
    return li;
  }

  render() {
    const room = this.conn.room;
    if (!this.root.contains(this.el)) return;
    if (this.codeKey !== this.conn.code) {
      this.codeKey = this.conn.code;
      this.code.dataset.code = this.conn.code;
      this.code.setAttribute('aria-label', `Código ${this.conn.code}`);
      this.code.replaceChildren(...[...this.conn.code].map((c) => h('span', { class: 'code-tile' }, c)));
    }
    if (!room || !this.conn.you) {
      this.title.textContent = `Sala ${this.conn.code}`;
      this.el.replaceChildren(h('h2', null, 'Conectando…'), h('p', { class: 'muted' }, this.conn.status === 'closed' ? 'Reintentando la conexión…' : 'Entrando en la sala'));
      return;
    }
    const you = this.conn.you;
    const hostP = room.players.find((p) => p.id === room.hostId);
    // El nombre, en una línea; si no cabe, se recorta con «…» (el completo, en el `title`).
    this.title.replaceChildren(...(hostP ? ['Sala de', h('span', { class: 'room-title-name', title: hostP.name }, hostP.name)] : [`Sala ${room.code}`]));
    const isHost = this.conn.isHost;
    // Si se está editando el nombre y ya no estás en la sala (has pasado a espectador), se deja.
    if (this.editing && !room.players.some((p) => p.id === you.id)) this.editing = null;
    document.getElementById('room')?.classList.toggle('editing-name', !!this.editing);
    // Rehacer la lista mueve el campo del nombre: se le devuelve el foco y la selección.
    const input = this.editing;
    const focused = !!input && document.activeElement === input;
    const sel = input ? [input.selectionStart, input.selectionEnd] : null;

    const list = h('ul', { class: 'players seats', id: 'player-list' }, ...[0, 1, 2, 3].map((slot) => this.seat(slot)));
    const bots = room.config.botSlots.length;
    const n = room.players.length + bots;
    const hint = this.editing ? 'El nombre lo ven todos en la sala' : isHost ? (isMobileDevice() ? 'Toca una plaza para cambiarla' : 'Haz clic en una plaza para cambiarla') : '';
    const parts: Node[] = [h('div', { class: 'room-head' }, h('h2', null, 'Jugadores ', h('span', { class: 'room-count' }, `· ${n} de ${MAX_PLAYERS}`)), h('span', { class: 'room-hint' }, hint)), list];

    // Dificultad de los bots (D1): solo si hay alguno; el anfitrión la cambia y los demás la leen.
    if (bots && isHost) {
      const row = h('div', { class: 'segm', id: 'bot-difficulty', role: 'radiogroup', 'aria-label': 'Dificultad de los bots' });
      for (const d of DIFFICULTIES) {
        const on = d === room.config.difficulty;
        const b = h('button', { type: 'button', role: 'radio', 'aria-checked': String(on), 'data-v': d, class: on ? 'on' : '' }, DIFF_LABEL[d]);
        b.onclick = () => this.conn.send({ t: 'config', config: { difficulty: d } });
        row.append(b);
      }
      parts.push(h('div', { class: 'room-diff' }, h('span', { class: 'room-diff-label' }, icon('bot'), 'Bots'), row));
    } else if (bots) parts.push(h('p', { class: 'room-diff-text', id: 'bot-difficulty-text' }, icon('bot'), h('span', null, 'Bots en dificultad ', h('b', null, DIFF_LABEL[room.config.difficulty]))));
    if (room.spectators) parts.push(h('p', { class: 'room-spect', id: 'spectators' }, icon('eye'), ` ${room.spectators} espectador${room.spectators > 1 ? 'es' : ''}`));

    // EMPEZAR solo para el anfitrión, desactivado con menos de 2 castillos (S5); los demás esperan.
    const foot = h('div', { class: 'room-foot' });
    if (you.role === 'spectator') foot.append(h('p', { class: 'room-note', id: 'spectator-note' }, 'La sala está completa: participas como espectador.'));
    else if (isHost) {
      const start = h('button', { class: 'big plank primary', id: 'start', type: 'button', disabled: n < 2 }, 'Empezar');
      start.onclick = () => this.conn.send({ t: 'start' });
      foot.append(start, h('p', { class: 'room-note', id: 'start-hint' }, n < 2 ? 'Hace falta al menos otro jugador o un bot' : 'Empieza cuando quieras: las plazas libres no juegan'));
    } else
      foot.append(
        h('div', { class: 'room-wait', id: 'waiting', role: 'status' }, h('span', { class: 'wait-dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')), h('span', null, `Esperando a que ${hostP?.name ?? 'el anfitrión'} empiece`)),
        h('p', { class: 'room-note' }, 'Solo el anfitrión cambia las plazas y empieza la partida'),
      );
    parts.push(foot);
    this.el.replaceChildren(...parts);
    if (input && focused) {
      input.focus({ preventScroll: true });
      if (sel) input.setSelectionRange(sel[0], sel[1]);
    }
  }
}
