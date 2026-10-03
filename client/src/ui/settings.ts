import { sfx } from '../game/audio';
import { isMobileDevice } from '../device';
import type { Quality } from '../game/render/stage';
import { h } from './dom';

// Ajustes guardados en el navegador: calidad gráfica, sonido, sensibilidad y texto grande.
export interface Settings {
  quality: Quality;
  sensitivity: number; // multiplica el movimiento del ratón o del dedo al apuntar
  bigText: boolean;
  showFps: boolean;
  shake: boolean; // temblor de cámara con los golpes (se quita solo con «reducir movimiento»)
  leftHanded: boolean; // modo zurdo (R-10 U8): en la bandeja del móvil, pad a la izquierda y disparo a la derecha
}

const KEY = 'asedio.settings';
const QUALITY_KEY = 'asedio.quality';

function load(): Settings {
  const def: Settings = { quality: isMobileDevice() ? 'low' : 'medium', sensitivity: 1, bigText: false, showFps: false, shake: !matchMedia('(prefers-reduced-motion: reduce)').matches, leftHanded: false };
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings>;
    const q = localStorage.getItem(QUALITY_KEY) as Quality | null;
    return { ...def, ...s, quality: q === 'low' || q === 'medium' || q === 'high' ? q : def.quality };
  } catch {
    return def;
  }
}

export const settings: Settings = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ sensitivity: settings.sensitivity, bigText: settings.bigText, showFps: settings.showFps, shake: settings.shake, leftHanded: settings.leftHanded }));
    localStorage.setItem(QUALITY_KEY, settings.quality);
  } catch {
    /* sin almacenamiento */
  }
}

export function applyTextSize() {
  document.documentElement.classList.toggle('big-text', settings.bigText);
}

export function applyHand() {
  document.documentElement.classList.toggle('zurdo', settings.leftHanded);
}

// El juego en marcha (si hay) para aplicar la calidad al momento.
let onQuality: ((q: Quality) => void) | null = null;
export function setQualityTarget(fn: ((q: Quality) => void) | null) {
  onQuality = fn;
}

// En partida, el engranaje añade «Salir de la partida» (R-07 F1) y avisa al abrirse y al cerrarse
// (en solitario, la partida se pausa mientras tanto, F9).
export interface SettingsExtra {
  exit?: { label: string; onClick: () => void };
  onOpen?: () => void;
  onClose?: () => void;
}

export function openSettings(extra: SettingsExtra = {}) {
  document.getElementById('settings')?.remove();
  const qualities: [Quality, string, string][] = [
    ['low', 'Baja', 'Sin sombras y con menos partículas: para equipos con menos potencia'],
    ['medium', 'Media', 'Sombras y efectos equilibrados'],
    ['high', 'Alta', 'Sombras finas y más partículas y fragmentos'],
  ];
  const qRow = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': 'Calidad gráfica' });
  const renderQ = () =>
    qRow.replaceChildren(
      ...qualities.map(([q, label, title]) => {
        const b = h('button', { class: settings.quality === q ? 'primary' : '', role: 'radio', 'aria-checked': String(settings.quality === q), title, 'data-quality': q }, label);
        b.onclick = () => {
          settings.quality = q;
          save();
          onQuality?.(q);
          renderQ();
        };
        return b;
      }),
    );
  renderQ();
  const sound = h('input', { type: 'checkbox', id: 'set-sound', checked: !sfx.muted });
  sound.onchange = () => sfx.setMuted(!sound.checked);
  const big = h('input', { type: 'checkbox', id: 'set-big', checked: settings.bigText });
  big.onchange = () => {
    settings.bigText = big.checked;
    save();
    applyTextSize();
applyHand();
  };
  const fps = h('input', { type: 'checkbox', id: 'set-fps', checked: settings.showFps });
  fps.onchange = () => {
    settings.showFps = fps.checked;
    save();
  };
  const shake = h('input', { type: 'checkbox', id: 'set-shake', checked: settings.shake });
  shake.onchange = () => {
    settings.shake = shake.checked;
    save();
  };
  const left = h('input', { type: 'checkbox', id: 'set-left', checked: settings.leftHanded });
  left.onchange = () => {
    settings.leftHanded = left.checked;
    save();
    applyHand();
  };
  const sens = h('input', { type: 'range', id: 'set-sens', min: '0.4', max: '1.8', step: '0.1', value: String(settings.sensitivity) });
  const sensVal = h('span', { class: 'muted' }, `×${settings.sensitivity.toFixed(1)}`);
  sens.oninput = () => {
    settings.sensitivity = Number(sens.value);
    sensVal.textContent = `×${settings.sensitivity.toFixed(1)}`;
    save();
  };
  const close = h('button', { class: 'primary big', id: 'settings-close' }, 'Listo');
  const exit = extra.exit ? h('button', { class: 'big danger', id: 'settings-exit', type: 'button' }, extra.exit.label) : null;
  const modal = h(
    'div',
    { class: 'overlay modal', id: 'settings', role: 'dialog', 'aria-label': 'Ajustes' },
    h(
      'div',
      { class: 'panel' },
      h('h2', null, 'Ajustes'),
      h('label', null, 'Calidad gráfica'),
      qRow,
      h('label', { class: 'check' }, sound, ' Sonido (tecla M)'),
      h('label', { class: 'check' }, big, ' Texto grande'),
      h('label', { class: 'check' }, shake, ' Temblor de cámara'),
      h('label', { class: 'check' }, left, ' Modo zurdo', h('span', { class: 'check-hint' }, 'disparo a la derecha en el móvil')),
      h('label', { class: 'check' }, fps, ' Mostrar fps'),
      h('label', { htmlFor: 'set-sens' }, 'Sensibilidad al apuntar ', sensVal),
      sens,
      close,
      exit,
    ),
  );
  const shut = () => {
    if (!modal.isConnected) return;
    modal.remove();
    extra.onClose?.();
  };
  close.onclick = shut;
  if (exit)
    exit.onclick = () => {
      // La confirmación se encarga de volver a pausar o reanudar.
      modal.remove();
      extra.exit!.onClick();
    };
  // Con llaves: un manejador «onclick» que devuelve false cancela el clic, y las casillas no cambiaban.
  modal.onclick = (e) => {
    if (e.target === modal) shut();
  };
  modal.onpointerdown = (e) => e.stopPropagation();
  document.body.append(modal);
  extra.onOpen?.();
  close.focus();
}

applyTextSize();
applyHand();
