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
