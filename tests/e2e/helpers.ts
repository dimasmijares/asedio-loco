import { expect, type Page } from '@playwright/test';

// Errores de consola y de página (se ignoran avisos de WebGL del renderizado por software).
export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/GPU stall|WebGL: INVALID|swiftshader|Automatic fallback to software/i.test(t)) return;
    errors.push(t);
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

// Comprueba que el canvas tiene contenido (no está negro ni vacío).
export async function canvasNotBlack(page: Page) {
  const stats = await page.evaluate(() => {
    const c = document.getElementById('game-canvas') as HTMLCanvasElement | null;
    if (!c) return null;
    const tmp = document.createElement('canvas');
    tmp.width = 64;
    tmp.height = 40;
    const g = tmp.getContext('2d')!;
    g.drawImage(c, 0, 0, 64, 40);
    const d = g.getImageData(0, 0, 64, 40).data;
    let sum = 0;
    let bright = 0;
    const seen = new Set<number>();
    for (let i = 0; i < d.length; i += 4) {
      const l = d[i] + d[i + 1] + d[i + 2];
      sum += l;
      if (l > 60) bright++;
      seen.add(((d[i] >> 5) << 6) | ((d[i + 1] >> 5) << 3) | (d[i + 2] >> 5));
    }
    return { avg: sum / (d.length / 4) / 3, bright, colors: seen.size };
  });
  expect(stats, 'hay canvas').not.toBeNull();
  expect(stats!.avg, 'el canvas no está negro').toBeGreaterThan(25);
  expect(stats!.colors, 'el canvas tiene variedad de colores').toBeGreaterThan(8);
  return stats!;
}
