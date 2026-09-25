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

type Step = 'drag' | 'adjust' | 'lock';

const STEPS: { id: Step; title: string; text: string }[] = [
  { id: 'drag', title: '1 · Tensa el tirachinas', text: 'Pulsa en cualquier punto y arrastra hacia atrás. Cuanto más lejos, más potencia; tira hacia un lado para girar. Suelta para fijar la puntería.' },
  { id: 'adjust', title: '2 · Afina el tiro', text: 'Rueda del ratón o W/S: elevación. Q/E: apuntar a otro castillo. 1/2: elegir munición. Los puntos blancos muestran el inicio del vuelo.' },
  { id: 'lock', title: '3 · ¡Fuego!', text: 'Pulsa «¡Listo!» o Espacio. Si se acaba el tiempo, dispararás con lo que tengas apuntado.' },
];

// Tutorial de 3 pasos en la primera partida: cada paso avanza al hacer lo que pide.
export class Tutorial {
  private i = 0;
  private el: HTMLElement;
  private t = 0;
  done = false;

  constructor(parent: HTMLElement) {
    this.el = h('div', { class: 'coach', id: 'tutorial', role: 'status' });
    parent.append(this.el);
    this.render();
  }

  private render() {
    const s = STEPS[this.i];
    const skip = h('button', { class: 'coach-skip' }, 'Saltar');
    skip.onclick = () => this.finish();
    skip.onpointerdown = (e) => e.stopPropagation();
    this.el.replaceChildren(h('b', null, s.title), h('div', null, s.text), h('div', { class: 'coach-dots' }, ...STEPS.map((_, k) => h('span', { class: k === this.i ? 'on' : '' }))), skip);
    this.el.classList.remove('pop');
    void this.el.offsetWidth;
    this.el.classList.add('pop');
    this.t = 0;
  }

  // Avisa de que el jugador ha hecho algo.
  event(e: Step) {
    if (this.done) return;
    if (STEPS[this.i].id !== e) return;
    this.next();
  }

  private next() {
    this.i++;
    if (this.i >= STEPS.length) this.finish();
    else this.render();
  }

  // El paso de afinar avanza solo si el jugador tarda (no todo el mundo toca la rueda).
  update(dt: number, aiming: boolean) {
    if (this.done) return;
    this.el.style.display = aiming ? '' : 'none';
    if (!aiming) return;
    this.t += dt;
    if (STEPS[this.i].id === 'adjust' && this.t > 7) this.next();
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
