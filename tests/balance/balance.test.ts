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
    `rondas con el objetivo cumplido: ${reports.reduce((s, r) => s + r.goalRounds, 0)} de ${reports.reduce((s, r) => s + r.rounds, 0)}; por tipo [rondas, jugadores]: ${JSON.stringify(reports.reduce((acc, r) => { for (const [k, [a, b]] of Object.entries(r.goalBy)) acc[k] = [(acc[k]?.[0] ?? 0) + a, (acc[k]?.[1] ?? 0) + b]; return acc; }, {} as Record<string, [number, number]>))}`,
  ].join('\n');
  console.log(summary);
  writeFileSync(`tests/balance/ultimo-${DIFF}.txt`, summary + '\n');
}, 3_600_000);
