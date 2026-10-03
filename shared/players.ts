// Colores de la paleta Okabe-Ito, distinguibles con los tipos de daltonismo más
// comunes. Cada jugador lleva además un emblema propio en su estandarte, así que
// no depende solo del color.
export const PLAYER_STYLES = [
  { name: 'Rojo', color: '#D55E00', ink: '#ffffff', emblem: 'sol', glyph: '☀' },
  { name: 'Azul', color: '#0072B2', ink: '#ffffff', emblem: 'luna', glyph: '☾' },
  { name: 'Amarillo', color: '#F0E442', ink: '#1d1626', emblem: 'estrella', glyph: '★' },
  { name: 'Rosa', color: '#CC79A7', ink: '#1d1626', emblem: 'rayo', glyph: 'ϟ' },
] as const;

// Bots: una sola fuente para «Jugar solo», la partida en solitario y la sala (R-10, R-11). El bot de
// cada hueco se llama siempre igual, así los rivales que se anuncian son los que juegan.
export const BOT_NAMES = ['Lady Pixel', 'Conde Clic', 'Reina Rúter', 'Sir Bot'];
export const botName = (slot: number) => BOT_NAMES[slot % BOT_NAMES.length];

// Huecos de una partida en solitario con `bots` rivales (1-3): tú en el 0 y, con uno, el de enfrente.
export const soloSlots = (bots: number) => [0, 2, 1, 3].slice(0, 1 + bots).sort();

// Nombres al azar de la portada (R-10 U9): un título, como los de los bots, y algo corto y de andar
// por casa («Duque Pepino»). Lo que distingue a cada uno es la segunda palabra.
export const NAME_TITLES = ['Sir', 'Lady', 'Barón', 'Baronesa', 'Duque', 'Duquesa', 'Conde', 'Condesa', 'Rey', 'Reina', 'Capitán', 'Capitana', 'Marqués', 'Marquesa'];
const NAME_WORDS = ['Pepino', 'Churro', 'Fideo', 'Turrón', 'Bigote', 'Rábano', 'Pelusa', 'Tostada', 'Mostaza', 'Cebolla', 'Patata', 'Buñuelo', 'Boniato', 'Melón', 'Queso', 'Grillo'];

// Un nombre al azar de como mucho 16 letras (MAX_NAME_LEN), distinto de `not` y de los de los bots.
export function randomName(rand: () => number = Math.random, not = ''): string {
  for (;;) {
    const n = `${NAME_TITLES[Math.floor(rand() * NAME_TITLES.length)]} ${NAME_WORDS[Math.floor(rand() * NAME_WORDS.length)]}`;
    if (n.length <= 16 && n !== not && !BOT_NAMES.includes(n)) return n;
  }
}

// Nombre corto para el marcador compacto (WRK-TASK-046): «Tú» en la fila propia; en los bots y en los
// nombres con título («Duque Pepino»), la última palabra, que es la que los distingue («Lady Pixel» →
// «Pixel»); en los demás humanos, la primera.
export function shortName(p: { name: string; bot?: boolean; you?: boolean }) {
  if (p.you) return 'Tú';
  const words = p.name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return p.bot || (words.length > 1 && NAME_TITLES.includes(words[0])) ? words[words.length - 1] : words[0];
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
