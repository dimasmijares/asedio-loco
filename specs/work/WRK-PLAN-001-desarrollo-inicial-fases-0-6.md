---
id: WRK-PLAN-001
type: spec
layer: work-plan
scope: ephemeral
status: archived
confidence: high
version: 1.0.0
created: 2026-09-24
updated: 2026-09-26
owner: dimas
parent: WRK-SPEC-001
activates:
  - ARCH-001
  - ARCH-003
  - ARCH-004
  - ARCH-005
  - DOC-OPS-001
tags:
  - historico
  - fases-0-6
---

# WRK-PLAN-001 — Desarrollo inicial (fases 0-6)

## Approach

Siete fases en el orden de `PROMPT_asedio_loco.md`. Cada fase se cerraba con commit, push, despliegue, sus pruebas y `CLAUDE.md` y `DECISIONES.md` al día. La fase 0 fue la única con preguntas al usuario (cuentas, tokens, elección de proveedor). Desde la fase 1, las desviaciones se apuntaron en `DECISIONES.md` (D-007 a D-046) y se siguió sin preguntar.

El orden importa: la física (fase 1) tenía que ser divertida antes de montar la partida (fase 2), y la partida tenía que funcionar en local antes de repartirla por red (fase 3). `MatchHost` depende de una interfaz mínima (`HostEnv`, D-022) para que la misma lógica sirva al modo solitario, a la red y a las simulaciones de equilibrio en Node.

No hubo WRK-TASK: este trabajo es anterior a la adopción de KDD y se reconstruye a partir de git y de los documentos.

## Estado final

| Orden | Tarea | Estado | Dependencias | Entrega |
|---|---|---|---|---|
| 0 | Preparación | Hecha | — | Node 22, Playwright, repo público, Worker + Durable Objects (D-003), estáticos en el mismo Worker (D-004), CI con `wrangler deploy` (D-006), esqueleto de salas probado en producción. `da31d06`…`6b5c361`, 24-09-2026 |
| 1 | Sandbox | Hecha | 0 | Motor de física, castillo de 106 bloques, catapulta en bastión (D-008), rotura por golpes (D-010), uniones sin contacto (D-014), fragmentos locales (D-009), escenas de física. `7f51c3f`, `f431d44`, 24-09 |
| 2 | Partida contra bots | Hecha | 1 | 4 castillos, rondas, lava rediseñada (D-020, D-021), viento, bots en 3 dificultades (D-023), herramienta de equilibrio (D-022). `72c84f4`, 25-09 |
| 3 | Multijugador | Hecha | 2 | Tic de 15 Hz (D-027), `full` por ronda (D-028), interpolación a 120 ms (D-029), migración real (D-031), espectadores y reconexión (D-033), revancha. `363f3fe`, 25-09 |
| 4 | Contenido y sensación | Hecha | 2 | 12 municiones, sonido sintetizado (D-034), estadísticas divertidas (D-035), cámara lenta al caer un rey (D-025, luego sustituida por D-060). `27da128`, 25-09 |
| 5 | Rendimiento y robustez | Hecha | 3, 4 | Plantillas y shaders precompilados (D-036), geometría fusionada (D-038), compresión de instantáneas (D-039), red mala simulada (D-040), calidad adaptativa (D-041). `91ad594`, 25-09 |
| 6 | Pulido | Hecha | 5 | Portada animada (D-043), tutorial de 3 pasos (D-044), accesibilidad Okabe-Ito (D-045), ajustes de calidad (D-046). `62b134f`, 25-09 |

Después de la entrega hubo un tramo de consolidación el 25-09: pruebas más rápidas y en paralelo (D-047 a D-051, `c01ecf1`, `d491073`), municiones flojas reforzadas (D-052, `fa58027`), interfaz y lava (D-054 a D-056, `c3436d0`, `221173f`) y pruebas de red por convergencia (D-057, `d2b21cf`, `d3d64ba`).

## Architecture Impact

| Area | Impact | Spec affected |
|------|--------|---------------|
| Plataforma | Worker único: estáticos, `/api/rooms` y `/ws/:code` hacia una Durable Object por sala | ARCH-001 |
| Red | Servidor que solo retransmite; anfitrión autoritativo; sin física determinista en clientes (D-030) | ARCH-003 |
| Física | Rapier 0.20 con eventos de fuerza de contacto; fragmentos en un mundo local aparte | ARCH-004 |
| Rendimiento | Instancing, geometría fusionada, 4 pasos de física como mucho por fotograma (D-042) | ARCH-005 |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| El plan gratuito de Cloudflare cambia o se queda corto | low | high | Un mensaje por tic de red (D-027) y límites de frecuencia en el servidor |
| Física inestable (castillos que se caen solos) | high | high | Se materializó: resuelto con D-010, D-011, D-012 y D-014 |
| Pruebas de red lentas o frágiles en CI | high | medium | Se materializó: dibujo limitado (D-049), paralelo (D-050) y convergencia (D-057) |
| No llegar a 60 fps en gráfica integrada | medium | high | Calidad adaptativa (D-041). Sigue sin medirse en una integrada (ver WRK-TASK-014) |

## Dependencies

- Cuenta de Cloudflare y token `Workers Scripts:Edit` — usuario — fase 0 (hecho).
- Repo `dimasmijares/asedio-loco` y `gh` con sesión — usuario — fase 0 (hecho).

## Evidence

- Fechas y commits de la tabla sacados de `git log` (24 y 25-09-2026).
- Pruebas de la sección 5: `tests/e2e/smoke.spec.ts`, `lobby.spec.ts`, `solo.spec.ts`, `multiplayer.spec.ts` (4 clientes, consistencia, espectador, reconexión, anfitrión caído, red mala, revancha), `physics.spec.ts` (CCD, torre, cristal, fragmentos) y `perf.spec.ts`, en verde contra producción en CI.
- Unitarios en `tests/unit/` (`match`, `protocol`, `physics`) con `npm test`.
- Rendimiento: tabla de `CLAUDE.md` medida con `node tests/tools/bench.mjs` en RTX 3080 y en SwiftShader.
