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
