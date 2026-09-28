// Genera los iconos de la PWA (WRK-TASK-009) dibujándolos en un canvas, como el resto de gráficos
// del juego: un castillo con corona sobre un atardecer de lava. Uso: node tests/tools/make-icons.mjs
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const SIZES = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-maskable-512.png', 512, true],
  ['apple-touch-icon.png', 180, false],
];

const b = await chromium.launch();
const p = await b.newPage();
for (const [name, size, maskable] of SIZES) {
  const data = await p.evaluate(
    ([size, maskable]) => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const g = c.getContext('2d');
      const u = size / 100;
      // Fondo: cielo de atardecer arriba y lava abajo.
      const sky = g.createLinearGradient(0, 0, 0, size);
      sky.addColorStop(0, '#3b2a5c');
      sky.addColorStop(0.55, '#ff8a3d');
      sky.addColorStop(0.56, '#e8461e');
      sky.addColorStop(1, '#9c1f0e');
      g.fillStyle = sky;
      if (maskable) g.fillRect(0, 0, size, size);
      else {
        g.beginPath();
        g.roundRect(0, 0, size, size, 22 * u);
        g.fill();
      }
      // En el icono enmascarable todo va en la zona segura (80 % central).
      const k = maskable ? 0.72 : 0.86;
      g.translate(size / 2, size / 2);
      g.scale(k, k);
      g.translate(-size / 2, -size / 2);
      const ink = '#1d1626';
      g.lineWidth = 3 * u;
      g.strokeStyle = ink;
      g.lineJoin = 'round';
      const block = (x, y, w, h, col) => {
        g.fillStyle = col;
        g.fillRect(x * u, y * u, w * u, h * u);
        g.strokeRect(x * u, y * u, w * u, h * u);
      };
      // Isla.
      g.fillStyle = '#5cc93b';
      g.beginPath();
      g.ellipse(50 * u, 80 * u, 44 * u, 9 * u, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      // Castillo: muralla de piedra, torres con almenas y portón de hierro.
      block(22, 48, 56, 30, '#9aa3ad');
      block(14, 34, 18, 44, '#b9c1c9');
      block(68, 34, 18, 44, '#b9c1c9');
      for (const x of [14, 26, 68, 80]) block(x, 28, 6, 7, '#b9c1c9');
      block(42, 60, 16, 18, '#5a6270');
      block(38, 36, 24, 14, '#c98a4b');
      // Corona del rey.
      g.fillStyle = '#ffd23f';
      g.beginPath();
      g.moveTo(33 * u, 30 * u);
      g.lineTo(33 * u, 12 * u);
      g.lineTo(41.5 * u, 21 * u);
      g.lineTo(50 * u, 8 * u);
      g.lineTo(58.5 * u, 21 * u);
      g.lineTo(67 * u, 12 * u);
      g.lineTo(67 * u, 30 * u);
      g.closePath();
      g.fill();
      g.stroke();
      g.fillStyle = '#e63946';
      g.beginPath();
      g.arc(50 * u, 24 * u, 3.2 * u, 0, Math.PI * 2);
      g.fill();
      return c.toDataURL('image/png');
    },
    [size, maskable],
  );
  writeFileSync(`client/public/icons/${name}`, Buffer.from(data.split(',')[1], 'base64'));
  console.log('icono', name, size);
}
await b.close();
