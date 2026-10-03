import { existsSync, readFileSync } from 'node:fs';

// En local, el servidor del 8787 tiene que servir la compilación de `dist/client`. Un `wrangler dev`
// huérfano (o uno arrancado antes de recompilar) sirve otra y las pruebas fallan sin motivo aparente
// (pasó el 03-10-2026: once fallos por tiempo agotado). Aquí se compara el paquete que se sirve con
// el compilado y, si no coinciden, se para con un mensaje claro.
export default async function globalSetup() {
  if (process.env.BASE_URL) return;
  const local = 'dist/client/index.html';
  if (!existsSync(local)) return;
  const want = readFileSync(local, 'utf8').match(/assets\/index-[\w-]+\.js/)?.[0];
  const html = await fetch('http://localhost:8787/').then(
    (r) => r.text(),
    () => '',
  );
  const got = html.match(/assets\/index-[\w-]+\.js/)?.[0];
  if (want && got && want !== got)
    throw new Error(
      `El servidor de http://localhost:8787 sirve otra compilación (${got}; la de dist/client es ${want}). ` +
        'Para los procesos wrangler/workerd que queden en el puerto 8787 y vuelve a lanzar las pruebas.',
    );
  if (want && got) {
    const js = await fetch(`http://localhost:8787/${want}`).then((r) => r.headers.get('content-type') ?? '');
    if (!js.includes('javascript'))
      throw new Error(`El servidor de http://localhost:8787 no sirve ${want} (responde ${js}): hay un servidor desfasado en el puerto 8787.`);
  }
}
