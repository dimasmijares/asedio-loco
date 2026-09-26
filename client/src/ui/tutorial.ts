import { isMobileDevice } from '../device';
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

const STEPS: { id: Step; title: string; text: string }[] = [
  { id: 'aim', title: '1 · Apunta', text: 'Mantén el clic derecho y mueve el ratón: a los lados giras la catapulta, arriba y abajo cambias la elevación.' },
  { id: 'adjust', title: '2 · Elige munición', text: '1, 2 o 3 (o un clic en la tarjeta). Q/E apuntan a otro castillo.' },
  { id: 'fire', title: '3 · ¡Fuego!', text: 'Mantén Espacio o el clic izquierdo: cuanto más tiempo, más fuerza, y la parábola crece. Al soltar, el disparo queda listo. Si se acaba el tiempo, sale con lo que tengas.' },
];

// En táctil se apunta arrastrando el dedo y se dispara con el botón redondo.
const TOUCH_STEPS: typeof STEPS = [
  { id: 'aim', title: '1 · Apunta', text: 'Arrastra el dedo por la pantalla: a los lados giras la catapulta, arriba y abajo cambias la elevación.' },
  { id: 'adjust', title: '2 · Elige munición', text: 'Toca una tarjeta. Las flechas ◀ ▶ apuntan a otro castillo.' },
  { id: 'fire', title: '3 · ¡Fuego!', text: 'Mantén el botón redondo 🔥: cuanto más tiempo, más fuerza, y la parábola crece. Al soltar, el disparo queda listo.' },
];

// Tutorial de 3 pasos en la primera partida: cada paso avanza al hacer lo que pide.
export class Tutorial {
  private i = 0;
  private steps = isMobileDevice() ? TOUCH_STEPS : STEPS;
  private el: HTMLElement;
  private t = 0;
  done = false;

  constructor(parent: HTMLElement) {
    this.el = h('div', { class: 'coach', id: 'tutorial', role: 'status' });
    parent.append(this.el);
    this.render();
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
    this.t = 0;
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
    if (!aiming) return;
    this.t += dt;
    if (this.steps[this.i].id === 'adjust' && this.t > 7) this.next();
  }

  finish() {
    this.done = true;
    this.el.remove();
    try {
      localStorage.setItem(KEY, 'done');
    } catch {
      /* sin almacenamiento */
    }
  }
}
