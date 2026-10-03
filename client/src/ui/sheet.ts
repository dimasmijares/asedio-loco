import { h } from './dom';
import { icon, type IconName } from './icons';

// Hoja crema para confirmaciones y avisos (maquetas «Móvil · Sala, confirmar salida» y «Móvil · Te
// han eliminado»): sale de abajo en móvil vertical y es una tarjeta centrada en horizontal, sobre un
// velo noche. Tablones a todo el ancho: naranja el principal, crema los demás y grana solo para salir.
export interface SheetAction {
  id: string;
  label: string;
  kind?: 'primary' | 'danger';
  icon?: IconName;
  onClick: () => void;
}

export interface SheetOptions {
  id: string;
  title: string;
  text?: Node | string;
  badge?: IconName; // icono grande sobre el título (aviso de eliminado)
  center?: boolean;
  actions: SheetAction[];
  hint?: string;
  // Tocar fuera de la hoja la cierra como la última acción (la de quedarse), si se indica.
  dismiss?: () => void;
}

export function showSheet(o: SheetOptions) {
  document.getElementById(`${o.id}-wrap`)?.remove();
  const title = h('h2', { class: 'sheet-h', id: `${o.id}-title` }, o.title);
  const sheet = h(
    'div',
    { class: `al-sheet${o.center ? ' center' : ''}`, id: o.id, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': `${o.id}-title` },
    o.badge ? h('span', { class: 'sheet-badge' }, icon(o.badge)) : null,
    title,
    o.text ? h('p', { class: 'sheet-text' }, o.text) : null,
    h(
      'div',
      { class: 'sheet-actions' },
      ...o.actions.map((a) => {
        const b = h('button', { class: `big plank${a.kind ? ` ${a.kind}` : ''}`, id: a.id, type: 'button' }, a.icon ? icon(a.icon) : null, h('span', null, a.label));
        b.onclick = () => {
          close();
          a.onClick();
        };
        return b;
      }),
    ),
    o.hint ? h('p', { class: 'sheet-hint' }, o.hint) : null,
  );
  const wrap = h('div', { class: 'sheet-wrap', id: `${o.id}-wrap` }, sheet);
  const close = () => wrap.remove();
  wrap.onpointerdown = (e) => {
    e.stopPropagation();
    if (e.target === wrap && o.dismiss) {
      close();
      o.dismiss();
    }
  };
  document.body.append(wrap);
  // El foco va a la primera acción que no sea salir: Intro nunca saca a nadie sin querer.
  (sheet.querySelector('.sheet-actions button:not(.danger)') as HTMLButtonElement | null)?.focus({ preventScroll: true });
  return { el: sheet, close };
}
