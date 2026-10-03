// Comprueba que cada prueba E2E está en algún grupo del CI (`.github/workflows/deploy.yml`). Los
// grupos filtran por archivo y por título (`-g`), así que un archivo nuevo o un título cambiado podía
// quedarse fuera sin que nadie lo notara (pasó con portada.spec y marca.spec, 03-10-2026). CI lo
// ejecuta antes de desplegar.
//   npm run e2e:grupos
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { promisify } from 'node:util';

const run = promisify(execFile);
const yml = readFileSync(new URL('../.github/workflows/deploy.yml', import.meta.url), 'utf8');
const groups = [...yml.matchAll(/- grupo: (\S+)\s+args: (.+)/g)].map(([, name, args]) => ({ name, args: args.trim() }));
if (!groups.length) {
  console.error('No encuentro los grupos de E2E en deploy.yml');
  process.exit(1);
}

// Argumentos de la línea `args`, respetando las comillas de `-g "…"`.
const split = (s) => [...s.matchAll(/"([^"]*)"|(\S+)/g)].map((m) => m[1] ?? m[2]);

// `--list` no abre el navegador; con BASE_URL tampoco levanta el servidor local.
const list = async (args) => {
  const { stdout } = await run(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', '--list', ...args], {
    env: { ...process.env, BASE_URL: 'https://example.invalid' },
    maxBuffer: 16 * 1024 * 1024,
  });
  // Sin «:línea:columna»: se compara por archivo y título.
  return stdout
    .split('\n')
    .filter((l) => l.includes('›'))
    .map((l) => l.trim().replace(/^(\S+?\.spec\.ts):\d+:\d+/, '$1'));
};

// Una tras otra: en CI, lanzadas todas a la vez, una lista salió distinta (03-10-2026).
const all = await list([]);
const per = [];
for (const g of groups) per.push(await list(split(g.args)));
const covered = new Set(per.flat());
const missing = all.filter((t) => !covered.has(t));
for (const [i, g] of groups.entries()) console.log(`${g.name}: ${per[i].length} pruebas`);
if (missing.length) {
  console.error(`\n${missing.length} de ${all.length} pruebas E2E no están en ningún grupo del CI:`);
  for (const t of missing) console.error(`  ${t}`);
  for (const [i, g] of groups.entries()) console.error(`\n${g.name} (${g.args}):\n${per[i].map((t) => `  ${t}`).join('\n')}`);
  console.error('Añádelas a un grupo de .github/workflows/deploy.yml.');
  process.exit(1);
}
console.log(`\nLas ${all.length} pruebas E2E están en algún grupo del CI.`);
