// Cuánto y dónde destroza cada munición de un disparo contra un castillo entero, sin navegador.
//   npx vitest run --config tests/balance/vitest.config.ts destrozo      (SHOTS=12, AMMO=magnet,log)
// Deja el resumen en tests/balance/destrozo.txt. Por munición, de media por disparo:
//   rotos     bloques rotos (la cifra de la que salen los objetivos de DOM-JUEGO-003)
//   movidos   bloques desplazados más de medio metro
//   reyes     disparos que matan al rey (la mitad apunta al rey)
//   disp      dispersión: distancia horizontal media (m) de los bloques rotos a su centro
//   alt       altura media (m) de los bloques rotos sobre la base del castillo
//   base      bloques de la fila baja rotos o movidos (lo que descalza el castillo)
//   piedra    bloques de piedra o hierro rotos
// La firma de cada munición (WRK-SPEC-007) se lee en estas columnas; si los rotos quedan fuera de
// su franja se marca con «!».
import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import { AMMO, type AmmoId } from '../../shared/ammo';
import { solveAim } from '../../shared/ballistics';
import { CASTLE_SCALE, buildCastle, kingId } from '../../shared/castle';
import { launchPoint, toWorld } from '../../shared/map';
import { rng } from '../../shared/math';
import { loadRapier } from '../../client/src/game/sim/rapier';
import { DT, Sim } from '../../client/src/game/sim/sim';

const OFFENSIVE: AmmoId[] = ['rock', 'log', 'coconuts', 'cow', 'melon', 'chicken', 'piano', 'blackhole', 'magnet', 'snowball'];
// Franja de bloques rotos por disparo que busca WRK-SPEC-007.
const TARGET: Partial<Record<AmmoId, [number, number]>> = {
  rock: [9, 11],
  log: [10, 13],
  coconuts: [10, 13],
  cow: [14, 18],
  melon: [14, 18],
  chicken: [12, 16],
  piano: [15, 20],
  blackhole: [20, 26],
  magnet: [18, 24],
  snowball: [18, 24],
};
// Los mismos puntos de la estructura a los que apuntan los bots.
const STRUCTURE = ([[0, 2.5, 3.3], [3.25, 3.5, 3.25], [-3.25, 3.5, 3.25], [0, 3.4, 0]] as [number, number, number][]).map(([x, y, z]) => [x * CASTLE_SCALE, y * CASTLE_SCALE, z * CASTLE_SCALE] as [number, number, number]);
const SHOTS = Number(process.env.SHOTS ?? 6);
// AMMO=magnet,log mide solo esas (para iterar) y lo deja en destrozo-parcial.txt.
const ONLY = process.env.AMMO?.split(',') as AmmoId[] | undefined;
const LIST = ONLY?.length ? OFFENSIVE.filter((a) => ONLY.includes(a)) : OFFENSIVE;

test('destrozo por munición', async () => {
  await loadRapier();
  const castle = buildCastle(1);
  const def = new Map(castle.blocks.map((b) => [b.id, b]));
  const baseY = Math.min(...castle.blocks.map((b) => b.p[1] - b.size[1] / 2));
  const bottom = (id: number) => {
    const b = def.get(id)!;
    return b.p[1] - b.size[1] / 2 < baseY + 0.1;
  };
  const f = (x: number, w = 5) => x.toFixed(1).padStart(w);
  const lines: string[] = [];
  const tot = { broken: 0, moved: 0, kings: 0 };
  for (const ammo of LIST) {
    let broken = 0;
    let moved = 0;
    let kings = 0;
    let spread = 0;
    let height = 0;
    let base = 0;
    let hard = 0;
    let spreadShots = 0;
    for (let s = 0; s < SHOTS; s++) {
      const r = rng(1000 + s * 7919);
      const sim = new Sim([0, 1]);
      sim.settle();
      const start = new Map<number, [number, number, number]>();
      for (const rec of sim.recs.values()) if (rec.kind === 'block' && rec.slot === 1) start.set(rec.id, sim.pos(rec));
      // La mitad de los disparos al rey y la otra mitad a la muralla, con el error de un bot normal.
      const k = castle.kingPos;
      const target: [number, number, number] = s % 2 === 0 ? [k[0], k[1] + 0.2, k[2]] : toWorld(1, STRUCTURE[s % STRUCTURE.length]);
      const a = AMMO[ammo];
      const pitch = ammo === 'log' || ammo === 'snowball' ? 0.45 : 0.75;
      const aim = solveAim(launchPoint(0), target, pitch, { drag: a.drag, windFactor: a.windFactor, wind: [0, 0, 0] });
      if (!aim) continue;
      aim.yaw += r.range(-1, 1) * 0.02;
      aim.power *= 1 + r.range(-1, 1) * 0.02;
      sim.launch(0, ammo, aim);
      for (let i = 0; i < 8 / DT; i++) sim.step();
      const gone: [number, number, number][] = [];
      for (const [id, p0] of start) {
        const rec = sim.recs.get(id);
        let hit = false;
        if (!rec) {
          broken++;
          gone.push(p0);
          const m = def.get(id)!.mat;
          if (m === 'stone' || m === 'iron') hard++;
          hit = true;
        } else {
          const p = sim.pos(rec);
          if (Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]) > 0.5) {
            moved++;
            hit = true;
          }
        }
        if (hit && bottom(id)) base++;
      }
      if (gone.length) {
        const cx = gone.reduce((t, p) => t + p[0], 0) / gone.length;
        const cz = gone.reduce((t, p) => t + p[2], 0) / gone.length;
        spread += gone.reduce((t, p) => t + Math.hypot(p[0] - cx, p[2] - cz), 0) / gone.length;
        height += gone.reduce((t, p) => t + p[1] - baseY, 0) / gone.length;
        spreadShots++;
      }
      if (!sim.kings.get(1)?.alive || !sim.recs.has(kingId(1))) kings++;
      sim.free();
    }
    tot.broken += broken;
    tot.moved += moved;
    tot.kings += kings;
    const b = broken / SHOTS;
    const t = TARGET[ammo];
    const mark = t && (b < t[0] || b > t[1]) ? ` ! (${t[0]}-${t[1]})` : '';
    const n = Math.max(1, spreadShots);
    lines.push(
      `${ammo.padEnd(10)} rotos ${f(b)}  movidos ${f(moved / SHOTS)}  reyes ${`${kings}/${SHOTS}`.padStart(5)}  disp ${f(spread / n, 4)}  alt ${f(height / n, 4)}  base ${f(base / SHOTS, 4)}  piedra ${f(hard / SHOTS, 4)}${mark}`,
    );
  }
  const n = LIST.length * SHOTS;
  lines.push(`${'media'.padEnd(10)} rotos ${f(tot.broken / n)}  movidos ${f(tot.moved / n)}  reyes ${`${tot.kings}/${n}`.padStart(5)}`);
  writeFileSync(ONLY?.length ? 'tests/balance/destrozo-parcial.txt' : 'tests/balance/destrozo.txt', lines.join('\n') + '\n');
  console.log(lines.join('\n'));
});
