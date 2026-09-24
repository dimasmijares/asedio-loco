// Materiales de los bloques. Las unidades son arbitrarias pero coherentes:
// densidad en t/m³ con gravedad 9,81 m/s², así que un bloque de piedra de 1 m³ tiene masa 2,4.
// `breakForce` es la fuerza de contacto (N en esas unidades) a partir de la cual el bloque se fractura
// de golpe. Por encima de `breakForce * CHIP_RATIO` acumula daño.

export type MaterialId = 'wood' | 'stone' | 'glass' | 'iron';

export interface Material {
  id: MaterialId;
  name: string;
  density: number;
  friction: number;
  restitution: number;
  breakForce: number;
  blastResist: number; // resistencia a la onda expansiva
  meltTime: number; // segundos en la lava hasta fundirse
  buoyancy: number; // factor de flotación en la lava (madera flota más)
  color: string;
  pieces: 'splinters' | 'chunks' | 'shards' | 'plates';
}

export const CHIP_RATIO = 0.45;

export const MATERIALS: Record<MaterialId, Material> = {
  wood: {
    id: 'wood',
    name: 'Madera',
    density: 0.6,
    friction: 0.7,
    restitution: 0.15,
    breakForce: 420,
    blastResist: 14,
    meltTime: 1.2,
    buoyancy: 1.6,
    color: '#b5763c',
    pieces: 'splinters',
  },
  stone: {
    id: 'stone',
    name: 'Piedra',
    density: 2.4,
    friction: 0.85,
    restitution: 0.05,
    breakForce: 850,
    blastResist: 36,
    meltTime: 2.6,
    buoyancy: 0.9,
    color: '#9aa3ad',
    pieces: 'chunks',
  },
  glass: {
    id: 'glass',
    name: 'Cristal',
    density: 2.5,
    friction: 0.35,
    restitution: 0.1,
    breakForce: 150,
    blastResist: 4,
    meltTime: 0.8,
    buoyancy: 0.8,
    color: '#9fe3ff',
    pieces: 'shards',
  },
  iron: {
    id: 'iron',
    name: 'Hierro',
    density: 7.8,
    friction: 0.55,
    restitution: 0.02,
    breakForce: 4200,
    blastResist: 120,
    meltTime: 4,
    buoyancy: 0.4,
    color: '#5b6470',
    pieces: 'plates',
  },
};

export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialId[];
