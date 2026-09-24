import * as THREE from 'three';
import { rng } from '../../../../shared/math';

// Texturas generadas en un canvas: nada de imágenes externas.
function canvas(size: number, draw: (g: CanvasRenderingContext2D, s: number) => void, repeat = 1): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

function noise(g: CanvasRenderingContext2D, s: number, seed: number, alpha: number, n = 900, light = true) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const v = light ? 255 : 0;
    g.fillStyle = `rgba(${v},${v},${v},${r.range(0, alpha)})`;
    g.fillRect(r.range(0, s), r.range(0, s), r.range(1, 3), r.range(1, 3));
  }
}

const cache = new Map<string, THREE.Texture>();
const once = (k: string, f: () => THREE.Texture) => cache.get(k) ?? (cache.set(k, f()), cache.get(k)!);

export const tex = {
  wood: () =>
    once('wood', () =>
      canvas(128, (g, s) => {
        g.fillStyle = '#c98a4b';
        g.fillRect(0, 0, s, s);
        const r = rng(3);
        // Tablones con vetas.
        for (let p = 0; p < 4; p++) {
          const y0 = (p * s) / 4;
          g.fillStyle = p % 2 ? '#bd7d3f' : '#c98a4b';
          g.fillRect(0, y0, s, s / 4);
          g.strokeStyle = 'rgba(90,45,15,0.35)';
          g.lineWidth = 1;
          for (let k = 0; k < 5; k++) {
            g.beginPath();
            const yy = y0 + r.range(3, s / 4 - 3);
            g.moveTo(0, yy);
            for (let x = 0; x <= s; x += 16) g.lineTo(x, yy + Math.sin(x * 0.08 + k) * 1.5);
            g.stroke();
          }
          g.fillStyle = '#6b3a17';
          g.fillRect(0, y0, s, 2);
        }
        g.fillStyle = '#6b3a17';
        for (const [x, y] of [
          [10, 10],
          [s - 12, 10],
          [10, s - 12],
          [s - 12, s - 12],
        ])
          g.fillRect(x, y, 3, 3);
        noise(g, s, 4, 0.06);
      }),
    ),
  stone: () =>
    once('stone', () =>
      canvas(128, (g, s) => {
        g.fillStyle = '#6f7780';
        g.fillRect(0, 0, s, s);
        const r = rng(9);
        const rows = 4;
        const h = s / rows;
        for (let y = 0; y < rows; y++) {
          const off = y % 2 ? s / 4 : 0;
          for (let x = -1; x < 2; x++) {
            const shade = 150 + r.int(-18, 18);
            g.fillStyle = `rgb(${shade},${shade + 6},${shade + 14})`;
            g.fillRect(x * (s / 2) + off + 3, y * h + 3, s / 2 - 6, h - 6);
            g.fillStyle = 'rgba(255,255,255,0.18)';
            g.fillRect(x * (s / 2) + off + 3, y * h + 3, s / 2 - 6, 3);
          }
        }
        noise(g, s, 10, 0.12, 1400, false);
      }),
    ),
  glass: () =>
    once('glass', () =>
      canvas(64, (g, s) => {
        g.fillStyle = '#bff0ff';
        g.fillRect(0, 0, s, s);
        g.strokeStyle = 'rgba(255,255,255,0.9)';
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(s * 0.15, s * 0.55);
        g.lineTo(s * 0.55, s * 0.15);
        g.moveTo(s * 0.3, s * 0.75);
        g.lineTo(s * 0.75, s * 0.3);
        g.stroke();
        g.strokeStyle = '#5fb8d6';
        g.lineWidth = 5;
        g.strokeRect(2, 2, s - 4, s - 4);
      }),
    ),
  iron: () =>
    once('iron', () =>
      canvas(64, (g, s) => {
        g.fillStyle = '#6b7582';
        g.fillRect(0, 0, s, s);
        for (let i = 0; i < s; i += 2) {
          g.fillStyle = `rgba(255,255,255,${0.03 + (i % 6) * 0.01})`;
          g.fillRect(0, i, s, 1);
        }
        g.strokeStyle = '#3d444d';
        g.lineWidth = 4;
        g.strokeRect(2, 2, s - 4, s - 4);
        g.fillStyle = '#c0c8d2';
        for (const [x, y] of [
          [8, 8],
          [s - 8, 8],
          [8, s - 8],
          [s - 8, s - 8],
        ]) {
          g.beginPath();
          g.arc(x, y, 3, 0, Math.PI * 2);
          g.fill();
        }
      }),
    ),
  grass: () =>
    once('grass', () =>
      canvas(
        128,
        (g, s) => {
          g.fillStyle = '#7cc84f';
          g.fillRect(0, 0, s, s);
          const r = rng(21);
          for (let i = 0; i < 500; i++) {
            const c = r.pick(['#6fbd45', '#8dd65c', '#63ad3c', '#9be36a']);
            g.fillStyle = c;
            const x = r.range(0, s);
            const y = r.range(0, s);
            g.fillRect(x, y, 2, r.range(3, 7));
          }
        },
        14,
      ),
    ),
  cliff: () =>
    once('cliff', () =>
      canvas(
        128,
        (g, s) => {
          const bands = ['#9b6b43', '#8a5c38', '#a87a52', '#7d5232', '#946645'];
          for (let i = 0; i < 8; i++) {
            g.fillStyle = bands[i % bands.length];
            g.fillRect(0, (i * s) / 8, s, s / 8 + 1);
          }
          noise(g, s, 31, 0.15, 900, false);
        },
        4,
      ),
    ),
  // Estandarte con el color y el emblema del jugador.
  banner: (color: string, glyph: string) =>
    once(`banner-${color}`, () =>
      canvas(128, (g, s) => {
        g.fillStyle = color;
        g.fillRect(0, 0, s, s);
        g.fillStyle = 'rgba(0,0,0,0.2)';
        g.fillRect(0, s - 14, s, 14);
        g.fillStyle = '#fff';
        g.font = 'bold 76px serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.lineWidth = 6;
        g.strokeStyle = 'rgba(0,0,0,0.6)';
        g.strokeText(glyph, s / 2, s / 2);
        g.fillText(glyph, s / 2, s / 2);
      }),
    ),
  cow: () =>
    once('cow', () =>
      canvas(64, (g, s) => {
        g.fillStyle = '#fbfbf6';
        g.fillRect(0, 0, s, s);
        g.fillStyle = '#222';
        const r = rng(5);
        for (let i = 0; i < 5; i++) {
          g.beginPath();
          g.ellipse(r.range(0, s), r.range(0, s), r.range(5, 12), r.range(4, 9), r.range(0, 3), 0, Math.PI * 2);
          g.fill();
        }
      }),
    ),
  melon: () =>
    once('melon', () =>
      canvas(64, (g, s) => {
        g.fillStyle = '#2f9e44';
        g.fillRect(0, 0, s, s);
        g.fillStyle = '#1b5e20';
        for (let i = 0; i < 8; i++) g.fillRect((i * s) / 8, 0, s / 20, s);
      }),
    ),
};

// Rampa de sombreado toon de 3 tonos.
let gradient: THREE.DataTexture | null = null;
export function toonGradient() {
  if (gradient) return gradient;
  const data = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}
