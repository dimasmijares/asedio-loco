import type { Material } from './materials';
import { rng, type Vec3 } from './math';

export interface Piece {
  offset: Vec3; // centro del trozo en coordenadas locales del bloque
  size: Vec3;
}

// Trocea un bloque en cajas más pequeñas según el material, con cortes irregulares.
// La madera se astilla en tiras largas, la piedra en pedruscos, el cristal en muchas
// esquirlas y el hierro en un par de planchas.
export function fracture(size: Vec3, pieces: Material['pieces'], seed: number): Piece[] {
  const r = rng(seed);
  const axes = [0, 1, 2].sort((a, b) => size[b] - size[a]); // de mayor a menor
  const cuts: [number, number, number] = [1, 1, 1];
  switch (pieces) {
    case 'splinters':
      cuts[axes[0]] = 3;
      cuts[axes[1]] = 2;
      break;
    case 'chunks':
      cuts[0] = cuts[1] = cuts[2] = 2;
      if (size[axes[0]] > 1.3) cuts[axes[0]] = 3;
      break;
    case 'shards':
      cuts[axes[0]] = 4;
      cuts[axes[1]] = 3;
      break;
    case 'plates':
      cuts[axes[0]] = 2;
      break;
  }
  // Posiciones de corte con algo de desorden para que no parezca una rejilla.
  const splits = cuts.map((n, ax) => {
    const pts = [0];
    for (let i = 1; i < n; i++) pts.push(i / n + r.range(-0.3, 0.3) / n);
    pts.push(1);
    return pts.map((t) => (t - 0.5) * size[ax]);
  });
  const out: Piece[] = [];
  const shrink = pieces === 'shards' ? 0.8 : 0.9;
  for (let i = 0; i < cuts[0]; i++)
    for (let j = 0; j < cuts[1]; j++)
      for (let k = 0; k < cuts[2]; k++) {
        const lo: Vec3 = [splits[0][i], splits[1][j], splits[2][k]];
        const hi: Vec3 = [splits[0][i + 1], splits[1][j + 1], splits[2][k + 1]];
        const s: Vec3 = [(hi[0] - lo[0]) * shrink, (hi[1] - lo[1]) * shrink, (hi[2] - lo[2]) * shrink];
        // Las esquirlas de cristal se afinan en un eje al azar.
        if (pieces === 'shards') s[axes[2]] *= r.range(0.5, 1);
        out.push({ offset: [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2], size: s });
      }
  return out;
}
