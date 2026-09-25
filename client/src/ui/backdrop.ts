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
    const { savedQuality } = await import('../game/game');
    const { loadRapier } = await import('../game/sim/rapier');
    await loadRapier();
    if (!current) return null; // se canceló mientras cargaba
    const stage = new Stage(canvas, savedQuality() === 'high' ? 'medium' : savedQuality());
    const view = new WorldView(stage, [0, 1, 2, 3]);
    let raf = 0;
    let last = performance.now();
    let a = 0.4;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      a += dt * 0.05;
      stage.camera.position.set(Math.cos(a) * 72, 34 + Math.sin(a * 0.7) * 4, Math.sin(a) * 72);
      stage.camera.lookAt(new THREE.Vector3(0, 0, 0));
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

export async function hideBackdrop() {
  const b = await current;
  b?.dispose();
  current = null;
}
