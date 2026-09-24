# CLAUDE.md — guía para el agente

La especificación completa del proyecto está en `PROMPT_asedio_loco.md`. Las desviaciones respecto a ella se registran en `DECISIONES.md`.

## Estado actual

- **Fase 0 (preparación)** terminada.
- **Fase 1 (sandbox)** terminada: `/#sandbox` con las 12 municiones, física completa y escenas de física en verde.
  - [x] 0.1 Entorno: Node 22 LTS, npm 10, git, gh, Playwright 1.63 + Chromium. WebGL2 sin interfaz verificado con SwiftShader.
  - [x] 0.2 Repo de GitHub `dimasmijares/asedio-loco` (público).
  - [x] 0.3 Servidor de salas: Cloudflare Workers + Durable Objects (cuenta con subdominio `dimasmijares.workers.dev`, wrangler con sesión)
  - [x] 0.4 Cliente: archivos estáticos del mismo Worker. Página, `/api/health` y WebSocket de eco verificados en producción
  - [x] 0.5 Despliegue continuo: `.github/workflows/deploy.yml` (push a `main` → typecheck, build, `wrangler deploy`). Secret `CLOUDFLARE_API_TOKEN` (solo Workers Scripts:Edit) y variable `CLOUDFLARE_ACCOUNT_ID`
  - [x] 0.6 Esqueleto desplegado: lobby con enlace, lista de conectados y reconexión, probado con Playwright contra producción
  - [x] 0.7 Confirmación: el usuario autorizó seguir sin más preguntas

## Arquitectura

```
shared/          Lógica pura, sin DOM ni Rapier (la usan cliente, servidor y tests)
  protocol.ts    Mensajes cliente↔servidor, validación, saneado de nombres, TokenBucket
  map.ts         Isla, posiciones de castillos por hueco (0-3), lava, toWorld/toLocal
  castle.ts      Plano del castillo (106 bloques, uniones, posición del rey), ids
  materials.ts   Madera, piedra, cristal, hierro (densidad, fricción, umbral de rotura…)
  ammo.ts        12 municiones (rareza, forma, masa, arrastre) y reparto con semilla
  ballistics.ts  Trayectoria con arrastre y viento, solveAim (bots), vista previa
  fracture.ts    Troceo procedural de un bloque según su material
  math.ts        Vectores, cuaterniones, rng con semilla (mulberry32)
server/index.ts  Worker: estáticos + /api/rooms + /ws/:code → Durable Object Room
client/src/
  main.ts        Arranque y rutas (#ABCD sala, #sandbox, #physics=<escena>)
  net/           Conexión WebSocket con reconexión y simulación de red (?lag=&jitter=&loss=)
  ui/            DOM: lobby, HUD, estilos (sin frameworks)
  game/
    game.ts      Bucle: física a paso fijo de 60 Hz (máx. 4 pasos/fotograma), vista, cámara
    sim/         Solo en el anfitrión: sim.ts (Rapier), projectiles.ts (municiones),
                 island.ts (suelo), debris.ts (fragmentos locales, en todos los clientes)
    view.ts      Todo lo visible; se alimenta de eventos SimEvent y poses de cuerpos
    render/      Three.js: stage (cielo, isla, lava), blocks (instancing), models, fx, toon
    camera.ts, director.ts, aim.ts   Cámara, dirección de cámara en impactos, tirachinas
    modes/       sandbox.ts (campo de pruebas), physicsTest.ts (escenas de la sección 5.7)
```

- La simulación emite `SimEvent` (rm, spawn, proj, boom, king, fx, dmg…) que la vista consume. En red serán los mismos eventos más instantáneas de poses.
- Ids: bloques `slot*200 + 1 + i`, reyes `1000 + slot`, proyectiles `2000+`.

## Protocolo de mensajes

_Pendiente._

## Pruebas

- `npm test`: tests unitarios (Vitest) de `tests/unit`.
- `npm run e2e`: Playwright en local (compila y levanta `wrangler dev` en el 8787).
- `npm run e2e:prod`: Playwright contra producción. CI lo ejecuta tras cada despliegue y guarda las capturas como artefacto.
- Las escenas de física se abren a mano con `/#physics=ccd|tower|glass|fragments`.
- Herramientas de captura: `node tests/tools/shot.mjs <url> <png>` y `node tests/tools/sandbox-shot.mjs <url> <prefijo> <municion> king|wall|tower <elevación>`.
- Depuración de física en Node: los archivos `tests/unit/_*.test.ts` están en `.gitignore` y sirven para experimentar con `Sim` sin navegador.
- Playwright en Chromium sin interfaz necesita estos flags para WebGL: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.

## Notas del entorno

- Windows 11, la carpeta del proyecto está dentro de OneDrive. Si aparecen errores `EPERM`/`EBUSY` en `node_modules` o `dist`, la causa probable es la sincronización.
- Commits en español, pequeños y descriptivos. Nunca subir secretos ni `.env`.
