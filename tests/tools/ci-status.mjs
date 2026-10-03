// Resumen de la ejecución de CI del commit actual (HEAD) o de la indicada: estado de cada trabajo y,
// de los que han terminado, las líneas ✓/✘ de las pruebas y los errores.
//   npm run ci:estado            → la del commit actual (si aún no existe, la última)
//   npm run ci:estado -- 123456  → una concreta
//   npm run ci:estado -- --wait  → espera a que aparezca la del commit actual y a que termine
// Antes tomaba siempre la última: justo después de un push, esa era la del commit anterior.
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const wait = args.includes('--wait');
const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const json = (...a) => JSON.parse(gh(...a));

let id = args.find((a) => /^\d+$/.test(a));
if (!id) {
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  const find = () => json('run', 'list', '--limit', '10', '--json', 'databaseId,headSha').find((r) => r.headSha === head);
  let r = find();
  // Tras un push, GitHub tarda unos segundos en dar de alta la ejecución.
  for (let t = 0; wait && !r && t < 180; t += 10) {
    process.stdout.write(`\resperando a que aparezca la ejecución de ${head.slice(0, 7)}…`);
    await new Promise((res) => setTimeout(res, 10_000));
    r = find();
  }
  if (wait) process.stdout.write('\n');
  if (r) id = String(r.databaseId);
  else {
    id = String(json('run', 'list', '--limit', '1', '--json', 'databaseId')[0].databaseId);
    console.log(`(no hay ejecución de ${head.slice(0, 7)}: ¿falta el push? Muestro la última)\n`);
  }
}

let run = json('run', 'view', id, '--json', 'status,conclusion,displayTitle,createdAt,jobs,url');
while (wait && run.status !== 'completed') {
  const done = run.jobs.filter((j) => j.status === 'completed').length;
  process.stdout.write(`\resperando… ${done}/${run.jobs.length} trabajos terminados`);
  await new Promise((r) => setTimeout(r, 30_000));
  run = json('run', 'view', id, '--json', 'status,conclusion,displayTitle,createdAt,jobs,url');
}
if (wait) process.stdout.write('\n');

console.log(`${run.displayTitle}\n${run.url}\nestado: ${run.status}${run.conclusion ? ` (${run.conclusion})` : ''}\n`);
const mins = (j) => (j.startedAt && j.completedAt ? ` ${((new Date(j.completedAt) - new Date(j.startedAt)) / 60000).toFixed(1)} min` : '');
for (const j of run.jobs) {
  const mark = j.conclusion === 'success' ? '✓' : j.conclusion === 'failure' ? '✘' : j.status === 'completed' ? '·' : '…';
  console.log(`${mark} ${j.name}${mins(j)}`);
  if (j.status !== 'completed' || j.conclusion === 'skipped') continue;
  let log = '';
  try {
    log = gh('run', 'view', id, '--log', '--job', String(j.databaseId));
  } catch {
    continue;
  }
  const lines = log
    .split('\n')
    .map((l) => l.replace(/^[^\t]*\t[^\t]*\t\S+ /, '').replace(/\x1b\[[0-9;]*m/g, ''))
    .filter((l) => / ✓ | ✘ |tiempo agotado|Error:|\d+ (passed|failed|flaky)/.test(l));
  for (const l of lines) console.log(`    ${l.trim().slice(0, 200)}`);
}
