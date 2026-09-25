# CLAUDE.md — guía para el agente

La especificación completa del proyecto está en `PROMPT_asedio_loco.md`. Las desviaciones respecto a ella se registran en `DECISIONES.md`.

## Estado actual

- **Fase 0 (preparación)** terminada.
- **Fase 1 (sandbox)** terminada: `/#sandbox` con las 12 municiones, física completa y escenas de física en verde.
- **Fase 2 (partida contra bots)** terminada: `/#solo` (en la portada, «Jugar solo»). Equilibrio medido con `tests/balance`.
- **Fase 4 (contenido y sensación)** terminada: 12 municiones, sonido procedural, cámara lenta y foco en el rey que cae, estadísticas divertidas.
- **Fase 5 (rendimiento y robustez)** terminada: benchmark, instancing y geometría fusionada, compresión de instantáneas, pruebas con red mala, migración de anfitrión.
- **Fase 6 (pulido)** terminada: portada animada, «Cómo se juega», tutorial de 3 pasos, ajustes (calidad, sonido, texto grande, sensibilidad) y colores accesibles.
- **Plan de móviles** (`docs/MOVILES.md`): M1 terminada (el anfitrión en segundo plano cede la partida; si el creador es un móvil, el anfitrión es un ordenador). Quedan M2-M5.
- **Plan de cambios tras la primera prueba del usuario** (`PLAN.md`): etapas 1-5 terminadas y en producción (20 s y 3 municiones por ronda, control con clic derecho y Espacio, plano panorámico, repetición al caer un rey, castillos de 140 bloques). Queda la etapa 6: estudio de viabilidad para móviles.
- **Fase 3 (multijugador)** terminada: salas, anfitrión autoritativo, interpolación, espectadores, reconexión, migración de anfitrión y revancha, con pruebas E2E de 4-5 clientes.
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
  castle.ts      Plano del castillo (140 bloques a escala 1,2, uniones, posición del rey), ids
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
                 scenes.ts (escenas de prueba de física, para el navegador y Vitest)
    view.ts      Todo lo visible; se alimenta de eventos SimEvent y poses de cuerpos
    render/      Three.js: stage (cielo, isla, lava), blocks (instancing), models, fx, toon
    camera.ts, director.ts, aim.ts   Cámara, plano panorámico en impactos, puntería (clic derecho + Espacio)
    replay.ts    Grabación de lo que ve cada cliente y repetición de la caída de un rey
    match/       host.ts (MatchHost, autoritativo), ui.ts (MatchUI, HUD y cámara), autoplay.ts
    net/         netHost.ts, netClient.ts, interp.ts, messages.ts (partida en red)
    modes/       sandbox, physicsTest, solo (contra bots), online (en red, con migración)
```

- La simulación emite `SimEvent` (rm, spawn, proj, boom, king, fx, dmg…) que la vista consume. En red serán los mismos eventos más instantáneas de poses.
- Ids: bloques `slot*200 + 1 + i`, reyes `1000 + slot`, proyectiles `2000+`.

## Protocolo de mensajes

Servidor (`shared/protocol.ts`, JSON sobre WebSocket en `/ws/ABCD`):

- Cliente → servidor: `hello {v, name, token?, mobile?}`, `name`, `config {bots, difficulty, fast}` (anfitrión, lobby), `start` (anfitrión), `lobby` (anfitrión, revancha), `yield` (anfitrión en partida: cede el papel), `relay {to: 'all'|'host'|id, d}`, `ping`.
- Elección de anfitrión: el creador de la sala. Al empezar, si es un móvil (`mobile`) y hay un ordenador, pasa al ordenador. Si el anfitrión se desconecta o manda `yield`, lo hereda otro jugador conectado, primero los ordenadores.
- Servidor → cliente: `welcome {you:{id, token, role}, room}`, `room {room}`, `relay {from, d}`, `pong`, `error {code, msg}`.
- El servidor valida el tamaño (64 KB) y los campos, limita la frecuencia (30/s, o 80/s el anfitrión), sanea nombres (16 caracteres) y rechaza `relay` de espectadores. Los que no son anfitrión solo pueden mandar a `all` o `host`.

Partida (`client/src/game/net/messages.ts`, dentro de `relay.d`):

| k | de → a | contenido |
|---|---|---|
| `st` | anfitrión → todos | `MatchState` cuando cambia |
| `tk` | anfitrión → todos | 15 Hz: `t` (hora del anfitrión), `b` poses cuantizadas (cm, 1e-4), `e` eventos, `a` punterías de bots |
| `full` | anfitrión → uno/todos | todo: bloques (con material y tamaño), reyes, proyectiles, escudos, lava y estado |
| `aim` | jugador → todos | puntería propia a ~10 Hz |
| `in` | jugador → anfitrión | puntería, munición elegida, objetivo, ¡listo! |
| `hi` | cliente → anfitrión | "acabo de llegar": el anfitrión responde con `full` |

Los clientes solo aceptan `st`/`tk`/`full` del `hostId` actual.

## Rendimiento (sección 5.8)

Escena más cargada: `/#bench`. Son los 4 castillos enteros (560 bloques) y 12 proyectiles cruzados a la vez (vacas, pianos, agujero negro, imán…); se miden 9 s de simulación (los fps, en tiempo real). Se ejecuta con `node tests/tools/bench.mjs <base> <high|medium|low> gpu`.

| Calidad | fps medios | peor 5 % | CPU/fotograma | física/paso | llamadas | triángulos | cuerpos despiertos | fragmentos | partículas |
|---|---|---|---|---|---|---|---|---|---|
| alta | 199 | 69 | 4,8 ms | 5,5 ms | 394 | 85 k | 562 | 260 | 1005 |
| media | 220 | 78 | 4,3 ms | 4,9 ms | 394 | 80 k | 562 | 170 | 833 |
| baja | 305 | 93 | 3,1 ms | 5,2 ms | 274 | 59 k | 562 | 90 | 416 |

Medido el 25-09-2026, con los castillos de 140 bloques, en Chromium sin interfaz con GPU (NVIDIA RTX 3080, D3D11, 1280×720, sin vsync). Con los castillos de 106 bloques el paso de física costaba 3,3 ms. No he podido medir en una gráfica integrada. Por la carga (menos de 400 llamadas, menos de 90 k triángulos, unos 5 ms de física en el peor momento), el objetivo de 60 fps en calidad media parece alcanzable en una integrada de gama media, y la calidad adaptativa baja a «baja» si no llega. Con SwiftShader (CPU, en CI) la misma escena va a unos 16 fps y cada paso de física cuesta unos 5 ms; `tests/e2e/perf.spec.ts` exige que cada paso quepa en su presupuesto de 16 ms.

## Pruebas

- `npm test`: tests unitarios (Vitest) de `tests/unit`, en menos de un segundo. Incluye las 4 escenas de física en Node (`physics.test.ts`), con la misma definición que `/#physics=` (`client/src/game/sim/scenes.ts`): para cambios de física, esto es lo primero que hay que pasar.
- Equilibrio: `GAMES=8 DIFF=normal npx vitest run --config tests/balance/vitest.config.ts balance` simula partidas de 4 bots en Node y deja el resumen en `tests/balance/ultimo-<dif>.txt`.
- Destrozo por munición: `npx vitest run --config tests/balance/vitest.config.ts destrozo` dispara cada munición contra un castillo entero y deja en `tests/balance/destrozo.txt` los bloques rotos y desplazados por disparo. Para cualquier cambio de física o de munición, medir antes y después.
- Parámetros de URL para pruebas: `?fast=1` (fases cortas), `?autoplay=1` (el humano juega solo), `?bots=N`, `?seed=N`, `?lag=ms&jitter=ms&loss=0..1` (red simulada), `?render=N` (dibuja como mucho N fotogramas por segundo; las pruebas de red lo usan en los clientes que no se capturan).
- `node tests/tools/net-watch.mjs <base> <humanos> <bots>` sigue en consola una partida en red de prueba.
- `npm run e2e`: Playwright en local (compila y levanta `wrangler dev` en el 8787).
- `npm run e2e:prod`: Playwright contra producción. CI lo ejecuta tras cada despliegue, repartido en 7 trabajos paralelos (uno por prueba larga), y guarda las capturas como artefactos `capturas-e2e-<grupo>`. Para lanzar solo una parte: `npm run e2e:prod -- multiplayer -g "revancha"`.
- `npm run ci:estado` resume la última ejecución de CI (trabajos, ✓/✘ y errores); `-- <id>` para otra y `-- --wait` para esperar a que termine.
- Las escenas de física se abren a mano con `/#physics=ccd|tower|glass|fragments`.
- Herramientas de captura: `node tests/tools/review.mjs <base> <carpeta>` (portada, apuntado, carga del disparo, impacto y resultados con GPU, para revisar la interfaz a ojo), `node tests/tools/impact-shots.mjs <base> <carpeta>` (la cámara panorámica), `node tests/tools/replay-shots.mjs <base> <carpeta>` (la repetición), `node tests/tools/shot.mjs <url> <png>` y `node tests/tools/sandbox-shot.mjs <url> <prefijo> <municion> king|wall|tower <elevación>`.
- Depuración de física en Node: los archivos `tests/unit/_*.test.ts` están en `.gitignore` y sirven para experimentar con `Sim` sin navegador.
- Playwright en Chromium sin interfaz necesita estos flags para WebGL: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.

## Limitaciones conocidas

- El rendimiento solo se ha medido con una RTX 3080 y con SwiftShader. En una gráfica integrada no se ha probado; la calidad adaptativa baja el nivel si no llega a 38 fps.
- Pensado para ratón y teclado: apuntar necesita el clic derecho y cargar, Espacio (o mantener el botón de disparo). En pantallas táctiles no se puede apuntar; es la etapa 6 del plan.
- Solo hay repetición de los reyes que caen durante la fase de impacto. Los que se lleva la lava al empezar la ronda no la tienen, y un espectador que entra tarde tampoco ve las anteriores a su llegada.
- Un jugador que se desconecta en plena partida no pasa a ser un bot: su catapulta dispara con la última puntería cuando se acaba el tiempo.
- Si el anfitrión se va en plena fase de impacto, las estadísticas de esa ronda quedan incompletas.
- En la isla, los bloques que caen sobre la superficie de lava no se funden (solo se come la hilera al subir el nivel), para que la lava no se lleve el castillo entero en cadena.
- Las partidas varían bastante de duración: con bots difíciles o buena puntería un rey puede caer en la ronda 1; con bots fáciles se llega a la inundación (ronda 10) y más allá.
- Al cambiar la calidad en plena partida, los topes de partículas y fragmentos no cambian hasta la siguiente partida.
- La portada carga Rapier (1,1 MB comprimido) para el fondo animado.
- El runner de CI es unas 4 veces más lento que un PC de sobremesa y dibuja por software. Por eso las pruebas de red limitan el dibujo (`?render=1`) y la batería va en paralelo.
- La escena de CCD pasa también con la CCD desactivada: Rapier 0.20 no deja atravesar el muro ni a 1000 m/s (D-047). La prueba confirma que no se atraviesa, no que sea gracias a la CCD.

## Notas del entorno

- Windows 11, la carpeta del proyecto está dentro de OneDrive. Si aparecen errores `EPERM`/`EBUSY` en `node_modules` o `dist`, la causa probable es la sincronización.
- Commits en español, pequeños y descriptivos. Nunca subir secretos ni `.env`.
