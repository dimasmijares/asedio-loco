---
id: DOC-OPS-001
type: spec
layer: documentation
status: active
confidence: medium
version: 1.1.1
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: ARCH-001
    relation: uses-data-from
  - id: DOM-JUEGO-001
    relation: uses-data-from
  - id: DOM-JUEGO-003
    relation: uses-data-from
supersedes: null
tags:
  - pruebas
  - herramientas
  - ci
---

# DOC-OPS-001 — Pruebas y herramientas

## Intent

Reúne en un sitio cómo se prueba el juego y qué herramienta usar para cada duda: si la física sigue bien, si la partida está equilibrada, si la red aguanta o si algo se ve mal.

## Definition

### Purpose

Guía práctica con los comandos reales. Qué ejecutar antes de un commit, cómo reproducir un fallo de CI y cómo capturar lo que se ve.

### Audience

El agente que trabaja en el repo y el propio dimas. Se supone Node 22, npm y el repo instalado (`npm ci`).

### Content outline

**0. Puerta local y especificaciones**

- `npm run verify`: `kdd:check`, `typecheck` y `npm test`, en este orden. Es lo mínimo antes de subir.
- `npm run kdd:check`: grafo de especificaciones, huérfanas y ciclo de vida de las tareas. CI lo ejecuta antes de desplegar. `npm run kdd:pendientes` lista lo que queda por hacer (ver `DOC-OPS-002`).

**1. Pruebas unitarias (Vitest)**

- `npm test`: todo `tests/unit/**/*.test.ts` en menos de un segundo. Incluye las 4 escenas de física en Node (`physics.test.ts`), con la misma definición que `/#physics=` (`client/src/game/sim/scenes.ts`). Para cambios de física, es lo primero que hay que pasar.
- Depuración de física sin navegador: los archivos `tests/unit/_*.test.ts` están en `.gitignore`. Sirven para experimentar con `Sim`.

**2. Equilibrio y destrozo (Node, sin navegador)**

- `GAMES=8 DIFF=normal npx vitest run --config tests/balance/vitest.config.ts balance`: partidas de 4 bots. `DIFF` es `facil`, `normal` o `dificil` (6 partidas por defecto). El resumen queda en `tests/balance/ultimo-<dif>.txt`.
- `npx vitest run --config tests/balance/vitest.config.ts destrozo`: dispara cada munición contra un castillo entero (`SHOTS`, 6 por defecto). Deja en `tests/balance/destrozo.txt` los bloques rotos y desplazados por disparo.
- Para cualquier cambio de física o de munición: medir antes y después y comparar.

**3. Parámetros de URL**

| Parámetro | Efecto |
|---|---|
| `?fast=1` | Fases cortas |
| `?autoplay=1` | Un bot juega por el humano |
| `?bots=N`, `?dif=facil\|normal\|dificil`, `?seed=N` | Partida en solitario (`#solo`) |
| `?lag=ms&jitter=ms&loss=0..1` | Red simulada; la pérdida solo quita poses de los tics |
| `?render=N` | Dibuja como mucho N fotogramas por segundo |
| `?quality=low\|medium\|high` | Calidad fija; desactiva la calidad adaptativa |

Rutas: `#solo`, `#sandbox`, `#bench`, `#physics=ccd|tower|glass|fragments`, `#ABCD` (sala).

**4. E2E (Playwright)**

- `npm run e2e`: en local. Compila y levanta `wrangler dev` en el puerto 8787.
- `npm run e2e:prod`: contra `https://asedio-loco.dimasmijares.workers.dev`. Solo una parte: `npm run e2e:prod -- multiplayer -g "revancha"`.
- CI la ejecuta tras cada despliegue en 7 trabajos: `basicas` (`lobby smoke perf controls`), `fisica`, `solitario`, `cuatro-jugadores`, `migracion` (`-g "anfitrión"`), `revancha` y `red-mala`. Las capturas quedan como artefactos `capturas-e2e-<grupo>` durante 7 días.
- `npm run ci:estado` resume la última ejecución (trabajos, ✓/✘ y errores). `-- <id>` para otra y `-- --wait` para esperar a que termine. Necesita `gh` con sesión.
- Chromium sin interfaz necesita estos flags para WebGL: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist` (ya están en `playwright.config.ts`).

**5. Herramientas de captura y seguimiento** (`tests/tools/`, `<base>` es la URL del sitio)

- `node tests/tools/review.mjs <base> <carpeta>`: portada, apuntado, carga, impacto y resultados, con GPU.
- `node tests/tools/impact-shots.mjs <base> <carpeta> [ronda]`: la cámara panorámica.
- `node tests/tools/countdown-shots.mjs <base> <carpeta> [ronda]`: la cuenta atrás (3, 2, 1, ¡FUEGO!) y cómo se aleja la cámara hasta el plano general.
- `node tests/tools/replay-shots.mjs <base> <carpeta>`: la repetición.
- `node tests/tools/highlights.mjs <base> <carpeta>`: capturas destacadas de una partida contra bots.
- `node tests/tools/shot.mjs <url> <png> [espera_ms] [js]`: una captura rápida.
- `node tests/tools/sandbox-shot.mjs <url> <prefijo> <municion> <king|wall|tower|yawOffset> [elevación] [potencia]`: un disparo en el campo de pruebas.
- `node tests/tools/net-watch.mjs <base> <humanos> <bots> [segundos]`: sigue en consola una partida en red.
- `node tests/tools/solo-watch.mjs <url> <carpeta> [segundos]`: sigue una partida en solitario.
- `node tests/tools/bench.mjs <base> <high|medium|low> gpu`: rendimiento (ARCH-005).

**6. Notas del entorno**

- Windows 11 y el proyecto dentro de OneDrive. Errores `EPERM` o `EBUSY` en `node_modules` o `dist`: probablemente la sincronización.
- Con el panel del navegador oculto, `requestAnimationFrame` se congela. Para medir el 3D, Chromium sin interfaz con GPU.
- El runner de CI es unas 4 veces más lento que un sobremesa y dibuja por software.

## Acceptance Criteria

- [x] Cada comando de esta guía existe en `package.json` o en `tests/tools/` con esos argumentos.
- [x] `npm test` pasa en CI antes de cada despliegue (`deploy.yml`).
- [ ] Hay una prueba que avise si esta guía y `package.json` dejan de coincidir.

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Expert review | Comandos comprobados contra `package.json`, `playwright.config.ts`, `.github/workflows/deploy.yml` y las cabeceras de `tests/tools/` | 2026-09-26 | low → medium |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `package.json` | Scripts `test`, `e2e`, `e2e:prod`, `ci:estado`, `typecheck`, `build` |
| Implemented in | `vitest.config.ts`, `tests/balance/vitest.config.ts`, `playwright.config.ts` | Configuración de pruebas |
| Implemented in | `tests/tools/` | Herramientas de captura, seguimiento y medición |
| Implemented in | `client/src/main.ts`, `client/src/net/connection.ts` | Rutas y parámetros de URL |
| Tested by | `tests/unit/`, `tests/balance/`, `tests/e2e/` | Las propias baterías |
| Decided in | D-001, D-022, D-026, D-040, D-048, D-049, D-050, D-052 | OneDrive, equilibrio en Node, modo rápido, red mala, escenas en Node, dibujo limitado, E2E en paralelo, destrozo |
