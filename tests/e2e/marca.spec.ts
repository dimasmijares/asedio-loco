import { expect, test, type Page } from '@playwright/test';
import { watchErrors } from './helpers';

// Marca de puntería, parábola e impacto real (fallo del 03-10-2026): el anillo que sale al apuntar,
// el de la parábola al cargar con la misma fuerza y el primer choque del proyectil en la física
// caen en el mismo sitio, sin viento y con viento (el juego ya no tiene, pero la física y la
// parábola lo siguen admitiendo y el campo de pruebas lo puede poner a mano).
type Probe = { guide: number[] | null; charge: number[] | null; ringOnAim: boolean; impact: number[] | null };

async function probe(page: Page, what: 'wall' | 'tower', wind: number[]): Promise<Probe> {
  return page.evaluate(
    async ({ what, wind }) => {
      const A = (window as any).__asedio;
      const m = A.mode;
      m.reset();
      const g = A.game;
      const sim = g.sim;
      sim.wind = wind;
      // Pedrusco: una bola que no explota ni se pega.
      for (let i = 0; m.ammo !== 'rock' && i < 20; i++) m.selectAmmo(i);
      // Tiro tenso, de frente: un tiro bombeado puede rozar el borde de una almena y unos centímetros
      // de diferencia entre la física y la parábola deciden si toca (no es lo que se comprueba aquí).
      const aim = { ...m.aimAt(what, 0.45), power: 0.55 };
      const input = g.input;
      // Apuntando: el anillo sale ya con la fuerza de la guía (55 %).
      input.charging = false;
      input.setAim(aim);
      m.onAim(input.aim);
      const guide = g.preview.hit && [...g.preview.hit];
      const ringOnAim = g.preview.ring.visible;
      // Cargando con esa misma fuerza: la parábola entera y su anillo.
      input.charging = true;
      m.onAim({ ...aim });
      const charge = g.preview.hit && [...g.preview.hit];
      input.charging = false;
      // El disparo de verdad: se sigue el proyectil paso a paso hasta su primer choque (un cambio
      // brusco de velocidad, que en vuelo solo cambia por la gravedad y el aire).
      let prev: number[] | null = null;
      let impact: number[] | null = null;
      const step = sim.step.bind(sim);
      sim.step = () => {
        step();
        if (impact) return;
        const r = [...sim.recs.values()].find((q: any) => q.kind === 'proj');
        if (!r) return;
        const p = r.body.translation();
        const v = r.body.linvel();
        if (prev && Math.hypot(v.x - prev[3], v.y - prev[4], v.z - prev[5]) > 1.5) impact = [p.x, p.y, p.z];
        prev = [p.x, p.y, p.z, v.x, v.y, v.z];
      };
      m.fire({ ...aim });
      const t0 = performance.now();
      while (!impact && performance.now() - t0 < 15000) await new Promise((r) => setTimeout(r, 50));
      sim.step = step;
      return { guide, charge, ringOnAim, impact };
    },
    { what, wind },
  );
}

const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

for (const [name, vp, mobile] of [
  ['móvil vertical', { width: 390, height: 844 }, true],
  ['PC', { width: 1280, height: 720 }, false],
] as const) {
  test(`marca, parábola e impacto en el mismo sitio (${name})`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(vp);
    const errors = watchErrors(page);
    await page.goto(`/?quality=low${mobile ? '&mobile=1' : ''}#sandbox`);
    await page.waitForFunction(() => (window as any).__asedio?.mode?.aimAt && (window as any).__asedio?.game?.sim, null, { timeout: 60_000 });
    for (const what of ['wall', 'tower'] as const) {
      for (const wind of [
        [0, 0, 0],
        [3, 0, -3.5],
      ]) {
        const r = await probe(page, what, wind);
        const tag = `${what}, viento ${Math.hypot(wind[0], wind[2]).toFixed(1)}`;
        console.log(tag, JSON.stringify(r));
        expect(r.ringOnAim, `${tag}: anillo al apuntar`).toBe(true);
        expect(r.guide && r.charge && r.impact, `${tag}: hay marca, parábola e impacto`).toBeTruthy();
        expect(dist(r.guide!, r.charge!), `${tag}: marca = parábola`).toBeLessThan(0.05);
        // El proyectil (0,45 m de radio) toca a la vez que el anillo; un paso de física son ~0,4 m.
        expect(dist(r.charge!, r.impact!), `${tag}: parábola = impacto`).toBeLessThan(1.2);
      }
    }
    expect(errors).toEqual([]);
  });
}
