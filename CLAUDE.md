# CLAUDE.md — guía para el agente

Las instrucciones de trabajo están en @AGENTS.md: `specs/` es la fuente de verdad y el protocolo de iteración es `DOC-OPS-002`. Léelas antes de elegir trabajo.

## Dónde está cada cosa

| Pregunta | Dónde |
|---|---|
| ¿Qué queda pendiente? | `npm run kdd:pendientes` |
| Reglas del juego (rondas, lava, munición, castillos) | `specs/domain/DOM-JUEGO-00*` |
| Recorrido del jugador | `specs/product/PROD-JUGAR-001` |
| Plataforma, capas, red y protocolo, física, rendimiento | `specs/architecture/ARCH-001` a `ARCH-005` |
| Cada funcionalidad y sus limitaciones conocidas | `specs/feature/FEAT-*` |
| Pruebas, herramientas y parámetros de URL | `specs/documentation/DOC-OPS-001` |
| Decisiones vigentes y reglas de trabajo | `specs/governance/ADR-*`, `RULE-001` a `RULE-004` |
| Qué se hizo y cuándo | `specs/work/` (y `git log`) |

`PROMPT_asedio_loco.md`, `PLAN.md`, `DECISIONES.md` y `docs/MOVILES.md` son histórico: no se actualizan.

## Estado

El juego está en producción: https://asedio-loco.dimasmijares.workers.dev. Cada push a `main` despliega y ejecuta las E2E contra producción.

- **Terminado:** fases 0-6 (`WRK-PLAN-001`), cambios tras la primera prueba (`WRK-PLAN-002`) y adopción de KDD (`WRK-PLAN-003`).
- **Entrega activa:** juego en móviles (`WRK-PLAN-004`): M1 hecha, M2-M5 pendientes.
- **Pendientes sueltos:** `WRK-PLAN-005`.
- **Siguiente:** munición con identidad destructiva (`WRK-PLAN-007`, en borrador a la espera de decisiones del usuario).
- **Móvil:** se juega en vertical por defecto; se diseña y se prueba primero en vertical.

## Comandos

```bash
npm run verify               # puerta local: KDD, tipos y unitarios
npm run kdd:check            # grafo, huérfanos y ciclo de vida (CI lo exige antes de desplegar)
npm run kdd:pendientes       # tareas sin terminar y cuáles están listas
npm run kdd -- context WRK-TASK-006   # lo que activa una tarea
npm run budget               # ¿hay presupuesto para otra tarea? (acepta los datos de /status)
npm test                     # unitarios (Vitest), menos de un segundo
npm run e2e                  # Playwright en local (wrangler dev en el 8787)
npm run e2e:prod -- multiplayer -g "revancha"   # una parte contra producción
npm run ci:estado -- --wait  # espera a que acabe CI y resume el resultado
```

El resto (equilibrio, destrozo, banco de rendimiento, herramientas de captura, parámetros de URL) está en `DOC-OPS-001`.

## Mapa del código

```
shared/          Lógica pura, sin DOM ni Rapier: protocolo, mapa, castillo, materiales, munición, balística, partida
server/index.ts  Worker: estáticos + /api/rooms + /ws/:code → Durable Object Room
client/src/
  main.ts        Arranque y rutas (#ABCD sala, #solo, #sandbox, #bench, #physics=<escena>)
  net/  ui/      Conexión WebSocket; DOM (lobby, HUD, ajustes, tutorial), sin frameworks
  game/          game.ts (bucle), view.ts, camera.ts, director.ts, aim.ts, replay.ts, audio.ts
    sim/         Solo en el anfitrión (salvo debris): Rapier, proyectiles, isla, escenas de física
    render/      Three.js: escenario, bloques con instancing, modelos, efectos
    match/       MatchHost (autoritativo), MatchUI, autoplay
    net/         netHost, netClient, interpolación, mensajes de partida
    modes/       sandbox, physicsTest, bench, solo, online
tests/           unit (Vitest), balance (equilibrio y destrozo), e2e (Playwright), tools
specs/           Especificaciones KDD      tools/spec-graph/  CLI del grafo
```

## Notas del entorno

- Windows 11 y la carpeta está dentro de OneDrive. Los errores `EPERM`/`EBUSY` en `node_modules` o `dist` suelen venir de la sincronización.
- Chromium sin interfaz necesita `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` para WebGL. Para medir el 3D con GPU, Chromium sin interfaz con GPU (el panel oculto congela `requestAnimationFrame`).
- Los archivos `tests/unit/_*.test.ts` están en `.gitignore`: sirven para experimentar con `Sim` en Node.
- Commits en español, pequeños y descriptivos. Nunca subir secretos ni `.env`.
