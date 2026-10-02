import { isMobileDevice, trayLayout } from '../device';
import { h } from './dom';

const KEY = 'asedio.tutorial';

export function tutorialPending() {
  if (new URLSearchParams(location.search).get('tutorial') === '1') return true;
  if (navigator.webdriver) return false; // no molesta en las pruebas automáticas
  try {
    return localStorage.getItem(KEY) !== 'done';
  } catch {
    return false;
  }
}

type Step = 'aim' | 'adjust' | 'fire';

// Qué control resalta cada paso (WRK-TASK-048): en el primero, una mano que arrastra sobre la escena
// o, con la bandeja del móvil vertical (R-10 U1), el pad de puntería.
const FOCUS: Record<Step, string[]> = {
  aim: [],
  adjust: ['#hud-ammo', '#target-prev', '#target-next'],
  fire: ['#confirm'],
};
const TRAY_FOCUS: Record<Step, string[]> = { ...FOCUS, aim: ['#aim-pad'] };

const STEPS: { id: Step; title: string; text: string }[] = [
  { id: 'aim', title: '1 · Apunta', text: 'Mantén el clic derecho y mueve el ratón: a los lados giras la catapulta, arriba y abajo cambias la elevación.' },
  { id: 'adjust', title: '2 · Elige munición', text: '1, 2 o 3 (o un clic en la tarjeta). Q/E apuntan a otro castillo.' },
  { id: 'fire', title: '3 · ¡Fuego!', text: 'Mantén Espacio o el clic izquierdo: la fuerza aumenta mientras lo mantienes y la parábola se alarga. Al soltar, el disparo queda listo. Si se agota el tiempo, se dispara con la puntería actual.' },
];

// En táctil se apunta arrastrando el dedo y se dispara con el botón redondo.
const TOUCH_STEPS: typeof STEPS = [
  { id: 'aim', title: '1 · Apunta', text: 'Arrastra el dedo por la pantalla: a los lados giras la catapulta, arriba y abajo cambias la elevación.' },
  { id: 'adjust', title: '2 · Elige munición', text: 'Toca una tarjeta.' },
  { id: 'fire', title: '3 · ¡Fuego!', text: 'Mantén el botón redondo rojo: la fuerza aumenta mientras lo mantienes y la parábola se alarga. Al soltar, el disparo queda listo.' },
];

// Con la bandeja del pulgar (móvil vertical): el pad afina y la escena sirve para los giros grandes.
const TRAY_STEPS: typeof STEPS = [
  { id: 'aim', title: '1 · Apunta', text: 'Arrastra el dedo por el pad: a los lados giras la catapulta, arriba y abajo cambias la elevación. Para girar mucho, arrastra por la escena.' },
  { id: 'adjust', title: '2 · Elige munición', text: 'Toca una carta.' },
  { id: 'fire', title: '3 · ¡Fuego!', text: 'Mantén el botón rojo: el anillo se llena con la fuerza y la parábola se alarga. Al soltar, el disparo queda listo.' },
];

// Tutorial de 3 pasos en la primera partida: cada paso avanza al hacer lo que pide.
export class Tutorial {
  private i = 0;
  private tray = trayLayout();
  private steps = this.tray ? TRAY_STEPS : isMobileDevice() ? TOUCH_STEPS : STEPS;
  private focusOf = this.tray ? TRAY_FOCUS : FOCUS;
  private el: HTMLElement;
  // Mano (táctil) o ratón que se desliza sobre la escena en el paso de apuntar.
  private swipe = h('div', { class: 'coach-swipe', 'aria-hidden': 'true' }, isMobileDevice() ? '👆' : '🖱️');
  private t = 0;
  done = false;

  constructor(parent: HTMLElement) {
    this.el = h('div', { class: 'coach', id: 'tutorial', role: 'status' });
    parent.append(this.el, this.swipe);
    this.render();
  }

  // Paso en curso (para las pruebas).
  get step() {
    return this.done ? null : this.steps[this.i].id;
  }

  private focus(on: boolean) {
    const id = on && !this.done ? this.steps[this.i].id : null;
    const want = id ? this.focusOf[id].map((sel) => document.querySelector(sel)).filter((el): el is Element => !!el) : [];
    for (const el of document.querySelectorAll('.tut-focus')) if (!want.includes(el)) el.classList.remove('tut-focus');
    for (const el of want) if (!el.classList.contains('tut-focus')) el.classList.add('tut-focus');
    const swipe = id === 'aim' && !this.tray ? '' : 'none';
    if (this.swipe.style.display !== swipe) this.swipe.style.display = swipe;
  }

  private render() {
    const s = this.steps[this.i];
    const skip = h('button', { class: 'coach-skip' }, 'Saltar');
    skip.onclick = () => this.finish();
    skip.onpointerdown = (e) => e.stopPropagation();
    this.el.replaceChildren(h('b', null, s.title), h('div', null, s.text), h('div', { class: 'coach-dots' }, ...this.steps.map((_, k) => h('span', { class: k === this.i ? 'on' : '' }))), skip);
    this.el.classList.remove('pop');
    void this.el.offsetWidth;
    this.el.classList.add('pop');
    this.el.dataset.step = s.id;
    this.t = 0;
    this.focus(true);
  }

  // Avisa de que el jugador ha hecho algo.
  event(e: Step) {
    if (this.done) return;
    if (this.steps[this.i].id !== e) return;
    this.next();
  }

  private next() {
    this.i++;
    if (this.i >= this.steps.length) this.finish();
    else this.render();
  }

  // El paso de afinar avanza solo si el jugador tarda (no todo el mundo toca la rueda).
  update(dt: number, aiming: boolean) {
    if (this.done) return;
    this.el.style.display = aiming ? '' : 'none';
    // Los controles se muestran y ocultan con la fase: el resaltado se repone en cada fotograma.
    this.focus(aiming);
    if (!aiming) return;
    this.t += dt;
    if (this.steps[this.i].id === 'adjust' && this.t > 7) this.next();
  }

  finish() {
    this.done = true;
    this.focus(false);
    this.el.remove();
    this.swipe.remove();
    try {
      localStorage.setItem(KEY, 'done');
    } catch {
      /* sin almacenamiento */
    }
  }
}
