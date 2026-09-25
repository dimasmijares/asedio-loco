// Cuánto destroza cada munición de un disparo contra un castillo entero, sin navegador.
//   npx vitest run --config tests/balance/vitest.config.ts destrozo
// Deja el resumen en tests/balance/destrozo.txt (bloques rotos, bloques desplazados más de
// medio metro y reyes caídos, de media por disparo).
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
// Los mismos puntos de la estructura a los que apuntan los bots.
const STRUCTURE = ([[0, 2.5, 3.3], [3.25, 3.5, 3.25], [-3.25, 3.5, 3.25], [0, 3.4, 0]] as [number, number, number][]).map(([x, y, z]) => [x * CASTLE_SCALE, y * CASTLE_SCALE, z * CASTLE_SCALE] as [number, number, number]);
const SHOTS = Number(process.env.SHOTS ?? 6);

test('destrozo por munición', async () => {
  await loadRapier();
  const lines: string[] = [];
  let totalBroken = 0;
  let totalMoved = 0;
  let totalKings = 0;
  for (const ammo of OFFENSIVE) {
    let broken = 0;
    let moved = 0;
    let kings = 0;
    for (let s = 0; s < SHOTS; s++) {
      const r = rng(1000 + s * 7919);
      const sim = new Sim([0, 1]);
      sim.settle();
      const start = new Map<number, [number, number, number]>();
      for (const rec of sim.recs.values()) if (rec.kind === 'block' && rec.slot === 1) start.set(rec.id, sim.pos(rec));
      // La mitad de los disparos al rey y la otra mitad a la muralla, con el error de un bot normal.
      const k = buildCastle(1).kingPos;
      const target: [number, number, number] = s % 2 === 0 ? [k[0], k[1] + 0.2, k[2]] : toWorld(1, STRUCTURE[s % STRUCTURE.length]);
      const a = AMMO[ammo];
      const pitch = ammo === 'log' || ammo === 'snowball' ? 0.45 : 0.75;
      const aim = solveAim(launchPoint(0), target, pitch, { drag: a.drag, windFactor: a.windFactor, wind: [0, 0, 0] });
      if (!aim) continue;
      aim.yaw += r.range(-1, 1) * 0.02;
      aim.power *= 1 + r.range(-1, 1) * 0.02;
      sim.launch(0, ammo, aim);
      for (let i = 0; i < 8 / DT; i++) sim.step();
      for (const [id, p0] of start) {
        const rec = sim.recs.get(id);
        if (!rec) broken++;
        else {
          const p = sim.pos(rec);
          if (Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]) > 0.5) moved++;
        }
      }
      if (!sim.kings.get(1)?.alive || !sim.recs.has(kingId(1))) kings++;
      sim.free();
    }
    totalBroken += broken;
    totalMoved += moved;
    totalKings += kings;
    lines.push(`${ammo.padEnd(10)} rotos ${(broken / SHOTS).toFixed(1).padStart(5)}  movidos ${(moved / SHOTS).toFixed(1).padStart(5)}  reyes ${kings}/${SHOTS}`);
  }
  const n = OFFENSIVE.length * SHOTS;
  lines.push(`${'media'.padEnd(10)} rotos ${(totalBroken / n).toFixed(1).padStart(5)}  movidos ${(totalMoved / n).toFixed(1).padStart(5)}  reyes ${totalKings}/${n}`);
  writeFileSync('tests/balance/destrozo.txt', lines.join('\n') + '\n');
  console.log(lines.join('\n'));
});
