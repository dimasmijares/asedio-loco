import { writeFileSync } from 'node:fs';
import { test } from 'vitest';
import type { Difficulty } from '../../shared/protocol';
import { simulateGame, type GameReport } from './balance';

const N = Number(process.env.GAMES ?? 6);
const DIFF = (process.env.DIFF ?? 'normal') as Difficulty;

test(`equilibrio: ${N} partidas de 4 bots (${DIFF})`, async () => {
  const reports: GameReport[] = [];
  for (let i = 0; i < N; i++) {
    const r = await simulateGame(1000 + i * 17, DIFF);
    reports.push(r);
    process.stdout.write(`partida ${i}: ${r.rounds} rondas, ${r.seconds} s, gana ${r.winner}; caídas ${r.eliminations.map((e) => `r${e.round}:${e.cause}`).join(' ')}
`);
  }
  const avg = (f: (r: GameReport) => number) => (reports.reduce((s, r) => s + f(r), 0) / reports.length).toFixed(1);
  const causes: Record<string, number> = {};
  for (const r of reports) for (const e of r.eliminations) causes[e.cause] = (causes[e.cause] ?? 0) + 1;
  const firstElim = reports.map((r) => r.eliminations[0]?.round ?? 99);
  const summary = [
    `dificultad ${DIFF}, ${N} partidas`,
    `media: ${avg((r) => r.rounds)} rondas, ${avg((r) => r.seconds)} s`,
    `primera eliminación en la ronda: ${firstElim.join(', ')}`,
    `causas: ${JSON.stringify(causes)}`,
  ].join('\n');
  console.log(summary);
  writeFileSync(`tests/balance/ultimo-${DIFF}.txt`, summary + '\n');
}, 3_600_000);
