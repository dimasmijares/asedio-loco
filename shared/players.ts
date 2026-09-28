// Colores de la paleta Okabe-Ito, distinguibles con los tipos de daltonismo más
// comunes. Cada jugador lleva además un emblema propio en su estandarte, así que
// no depende solo del color.
export const PLAYER_STYLES = [
  { name: 'Rojo', color: '#D55E00', ink: '#ffffff', emblem: 'sol', glyph: '☀' },
  { name: 'Azul', color: '#0072B2', ink: '#ffffff', emblem: 'luna', glyph: '☾' },
  { name: 'Amarillo', color: '#F0E442', ink: '#1d1626', emblem: 'estrella', glyph: '★' },
  { name: 'Rosa', color: '#CC79A7', ink: '#1d1626', emblem: 'rayo', glyph: 'ϟ' },
] as const;

export const BOT_NAMES = ['Sir Bot', 'Lady Pixel', 'Barón Byte', 'Duquesa Tuerca', 'Conde Clic', 'Reina Rúter'];

// Nombre corto para el marcador compacto (WRK-TASK-046): «Tú» en la fila propia; en los bots, la
// última palabra, que es la que los distingue («Lady Pixel» → «Pixel»); en los humanos, la primera.
export function shortName(p: { name: string; bot?: boolean; you?: boolean }) {
  if (p.you) return 'Tú';
  const words = p.name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return p.bot ? words[words.length - 1] : words[0];
}

// Tonos del castillo de cada jugador (WRK-TASK-059, aprobados en R-02): la piedra en un tono
// oscuro y la madera en uno claro del color del jugador; cristal y hierro, neutros. El rojo va
// desplazado a 6° para no confundirse con la lava.
export const CASTLE_HUES = [6, 202, 54, 327];
export const STONE_TONE = { s: 0.3, l: 0.4 };
export const WOOD_TONE = { s: 0.52, l: 0.6 };

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0), f(8), f(4)];
}

// Color de la piedra o la madera del castillo `slot`, o null para cristal, hierro o un hueco raro.
export function castleTone(slot: number, mat: string): [number, number, number] | null {
  const h = CASTLE_HUES[slot];
  if (h === undefined) return null;
  if (mat === 'stone') return hslToRgb(h, STONE_TONE.s, STONE_TONE.l);
  if (mat === 'wood') return hslToRgb(h, WOOD_TONE.s, WOOD_TONE.l);
  return null;
}
