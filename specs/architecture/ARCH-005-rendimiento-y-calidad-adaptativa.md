---
id: ARCH-005
type: spec
layer: architecture
status: active
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: RULE-004
    relation: constrained-by
  - id: ARCH-004
    relation: extends
  - id: ARCH-003
    relation: extends
supersedes: null
tags:
  - rendimiento
  - calidad
---

# ARCH-005 — Rendimiento y calidad adaptativa

## Intent

El juego tiene que ir fluido en un portátil normal, también en el peor momento: los 4 castillos cayendo a la vez. Esta especificación fija cómo se mide, qué presupuesto hay y qué hace el juego cuando el equipo no llega.

## Definition

### Context

- Hay 560 bloques con física, fragmentos, partículas y sombras. El anfitrión, además, simula para todos.
- Solo se ha podido medir con una RTX 3080 y con SwiftShader (CPU, en CI). No hay datos de gráficas integradas ni de móviles.

### Decision

**Escena de referencia `/#bench`** (`modes/bench.ts`): los 4 castillos enteros y 12 proyectiles cruzados (vacas, pianos, agujero negro, imán…). Dura 9 s de **tiempo de simulación** (D-051), así la lluvia cae entera aunque el equipo vaya lento. Los fps se miden con el reloj real. Se lanza con `node tests/tools/bench.mjs <base> <high|medium|low> gpu`.

**Mediciones** (25-09-2026, castillos de 140 bloques, Chromium sin interfaz con RTX 3080, D3D11, 1280×720, sin vsync):

| Calidad | fps medios | peor 5 % | CPU/fotograma | física/paso | llamadas | triángulos | despiertos | fragmentos | partículas |
|---|---|---|---|---|---|---|---|---|---|
| alta | 199 | 69 | 4,8 ms | 5,5 ms | 394 | 85 k | 562 | 260 | 1005 |
| media | 220 | 78 | 4,3 ms | 4,9 ms | 394 | 80 k | 562 | 170 | 833 |
| baja | 305 | 93 | 3,1 ms | 5,2 ms | 274 | 59 k | 562 | 90 | 416 |

Con SwiftShader la misma escena va a unos 16 fps y cada paso de física cuesta unos 5 ms.

**Presupuestos:**

- Un paso de física (1/60 s) cuesta menos de 16 ms de media en la escena de referencia, incluso sin GPU (`tests/e2e/perf.spec.ts`, en CI).
- Objetivo: 60 fps en calidad media en una gráfica integrada de gama media. Sin medir; se estima por la carga (menos de 400 llamadas, menos de 90 k triángulos, unos 5 ms de física).
- Como mucho 4 pasos de física por fotograma (ARCH-004).

**Niveles de calidad** (`render/stage.ts`, `render/fx.ts`, `view.ts`). Por defecto, media.

| | alta | media | baja |
|---|---|---|---|
| Resolución interna (tope del `devicePixelRatio`) | 2 | 1,25 | 0,85 |
| Sombras | 2048 | 1024 | no |
| Antialias | sí | sí | no |
| Tope de partículas | 900 | 550 | 260 |
| Tope de fragmentos | 260 | 170 | 90 |

**Calidad adaptativa** (`game.ts`, D-041): si los fps están por debajo de 38 de forma sostenida (unos 5 s), baja un nivel y lo guarda. No actúa con `?quality=` en la URL, en navegadores automatizados ni con la pestaña oculta. Resolución y sombras cambian al momento; los topes, en la partida siguiente (D-046).

**Técnicas:**

- Bloques de un mismo material en un `InstancedMesh`: una llamada de dibujo por material, más su contorno.
- Geometría estática fusionada por material: de 751 a 392 llamadas (D-038).
- Plantillas de proyectiles y shaders compilados al arrancar: sin tirón en el primer disparo (D-036).
- Instantáneas de red comprimidas (ARCH-003, D-039): poses cuantizadas (cm y 1e-4) y sin reenviar lo que se ha movido menos de medio centímetro; lo que se detiene se repite 3 tics más.
- Pruebas de red con `?render=N`: los clientes que no se capturan dibujan como mucho N fotogramas por segundo (D-049).

### Rationale

- La escena de referencia es el peor caso realista. Si cabe ahí, cabe en la partida.
- Presupuesto de física en CI y no de fps: con SwiftShader los fps no dicen nada, el paso de física sí.
- Bajar calidad automáticamente es mejor que pedir al jugador que la busque en Ajustes.

### Consequences

- Las cifras de la tabla solo valen para una gráfica de gama alta. El objetivo en integradas es una estimación.
- En móviles no hay datos; la calidad adaptativa es la única red de seguridad.
- La adaptación no sube de nivel: si un pico baja la calidad, se queda así hasta que el jugador la cambie.
- Tras cambiar la calidad en plena partida, los topes de partículas y fragmentos no cambian hasta la siguiente.

## Acceptance Criteria

- [x] En la escena `/#bench`, cada paso de física cuesta menos de 16 ms de media con SwiftShader.
- [x] En la escena `/#bench` llegan a estar despiertos más de 200 cuerpos (la prueba es realmente exigente).
- [ ] La calidad baja un nivel tras unos 5 s por debajo de 38 fps (sin prueba automática: no actúa en navegadores automatizados).
- [ ] 60 fps en calidad media en una gráfica integrada de gama media (sin medir).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `node tests/tools/bench.mjs` con RTX 3080 (tabla de arriba) | 2026-09-25 | low → medium |
| Testing | `tests/e2e/perf.spec.ts` en CI | 2026-09-26 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/game/modes/bench.ts` | Escena de referencia y resultado en `window.__asedio.bench` |
| Implemented in | `client/src/game/game.ts` | Calidad adaptativa, fps, `?render=` |
| Implemented in | `client/src/game/render/stage.ts` | Resolución, sombras, antialias, brasas por calidad |
| Implemented in | `client/src/game/render/fx.ts`, `client/src/game/view.ts` | Topes de partículas y fragmentos |
| Implemented in | `client/src/game/render/blocks.ts`, `client/src/game/render/materials.ts` | Instancing y geometría fusionada |
| Implemented in | `client/src/game/net/netHost.ts` | Compresión de instantáneas |
| Implemented in | `client/src/ui/settings.ts` | Calidad elegida y guardada |
| Tested by | `tests/e2e/perf.spec.ts` | Presupuesto de física sin GPU |
| Tested by | `tests/tools/bench.mjs` | Medición manual con GPU |
| Decided in | D-036, D-038, D-039, D-041, D-042, D-046, D-049, D-051 | Precompilación, fusión, compresión, calidad adaptativa, tope de pasos, cambio en caliente, dibujo limitado, duración del banco |

## Open Questions

- ¿Qué fps da `/#bench` en una gráfica integrada y en un móvil de gama media? — dimas, con un equipo de prueba
- ¿Debería la calidad adaptativa volver a subir si el equipo se recupera? — dimas
