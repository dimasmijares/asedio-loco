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
  return stdout
    .split('\n')
    .filter((l) => l.includes('›'))
    .map((l) => l.trim());
};

const [all, ...per] = await Promise.all([list([]), ...groups.map((g) => list(split(g.args)))]);
const covered = new Set(per.flat());
const missing = all.filter((t) => !covered.has(t));
for (const [i, g] of groups.entries()) console.log(`${g.name}: ${per[i].length} pruebas`);
if (missing.length) {
  console.error(`\n${missing.length} de ${all.length} pruebas E2E no están en ningún grupo del CI:`);
  for (const t of missing) console.error(`  ${t}`);
  console.error('Añádelas a un grupo de .github/workflows/deploy.yml.');
  process.exit(1);
}
console.log(`\nLas ${all.length} pruebas E2E están en algún grupo del CI.`);
