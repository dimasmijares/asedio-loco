// Fondo animado de la portada y el lobby: la isla con los 4 castillos y la cámara girando.
// Solo dibuja (sin física) y se desmonta al empezar la partida.
import { h } from './dom';

export interface Backdrop {
  dispose(): void;
}

let current: Promise<Backdrop | null> | null = null;

export function showBackdrop(parent: HTMLElement): Promise<Backdrop | null> {
  if (current) return current;
  current = (async () => {
    // En pruebas automáticas no hace falta el fondo (ahorra CPU con el renderizado por software).
    if (navigator.webdriver && !new URLSearchParams(location.search).has('backdrop')) return null;
    const canvas = h('canvas', { id: 'backdrop-canvas', class: 'backdrop', 'aria-hidden': 'true' });
    parent.prepend(canvas);
    const THREE = await import('three');
    const { Stage } = await import('../game/render/stage');
    const { WorldView } = await import('../game/view');
    // Sin Rapier (WRK-TASK-016): la vista va sin fragmentos y la calidad sale de `quality.ts`.
    const { savedQuality } = await import('../game/quality');
    if (!current) return null; // se canceló mientras cargaba
    const stage = new Stage(canvas, savedQuality() === 'high' ? 'medium' : savedQuality());
    const view = new WorldView(stage, [0, 1, 2, 3]);
    let raf = 0;
    let last = performance.now();
    let a = 0.4;
    const target = new THREE.Vector3(0, 2, 0);
    let frameT = 1;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      a += dt * 0.05;
      frameT += dt;
      if (frameT > 0.25) {
        frameT = 0;
        frame(stage);
      }
      // Cámara baja, con el horizonte cerca de la isla y el cielo detrás del título (maquetas de la
      // portada); en vertical, más baja y algo más cerca.
      const tall = innerHeight > innerWidth;
      const r = tall ? 64 : 72;
      stage.camera.position.set(Math.cos(a) * r, (tall ? 13 : 20) + Math.sin(a * 0.7) * 2, Math.sin(a) * r);
      stage.camera.lookAt(target);
      view.update(dt);
      stage.update(dt);
      stage.render();
    };
    const onResize = () => stage.resize();
    window.addEventListener('resize', onResize);
    raf = requestAnimationFrame(loop);
    return {
      dispose() {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', onResize);
        stage.renderer.dispose();
        stage.renderer.forceContextLoss();
        canvas.remove();
        current = null;
      },
    };
  })();
  return current;
}

// Encuadre de la isla según el menú que la tapa (R-10 U9 y U10): en PC, en el centro de lo que deja
// libre la columna de la portada; en móvil vertical, justo encima del menú o de la hoja de abajo.
function frame(stage: { setViewShift(y: number, x?: number): void }) {
  const col = document.querySelector('.home');
  const landscape = innerWidth > innerHeight;
  if (col && landscape) return stage.setViewShift(0, col.getBoundingClientRect().right / 2);
  const low = !landscape && document.querySelector('.home-menu, .solo-card');
  if (low) return stage.setViewShift(Math.max(0, innerHeight / 2 - (low.getBoundingClientRect().top - 24)), 0);
  stage.setViewShift(0, 0);
}

export async function hideBackdrop() {
  const b = await current;
  b?.dispose();
  current = null;
}
