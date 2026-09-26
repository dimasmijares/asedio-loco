---
id: RULE-004
type: rule
layer: governance
status: active
confidence: high
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies: []
tags:
  - rendimiento
  - red
---

# RULE-004 — El juego debe caber en su presupuesto de rendimiento

## Rule

Ningún cambio debe superar estos límites:

| Límite | Valor | Cifra actual (25-09-2026) |
|---|---|---|
| Paso de física en `/#bench` (4 castillos enteros, 12 proyectiles) | < 16 ms, también con SwiftShader | ~5 ms con GPU y con SwiftShader |
| fps en calidad media, portátil con gráfica integrada de gama media | 60 | 220 en una RTX 3080; integrada sin medir |
| Estado completo (`full`) y cualquier otro mensaje | < 64 KB (`MAX_MSG_BYTES`) | por debajo tras D-063, sin cifra exacta |
| Pasos de física por fotograma | como mucho 4 | 4 |

La calidad adaptativa (baja un nivel tras unos 5 s por debajo de 38 fps) debe seguir funcionando. Si un cambio no cabe, se recortan bloques, fragmentos o partículas, no la jugabilidad.

## Scope

Cambios en física, número de cuerpos o uniones, castillos, municiones, efectos, render y formato de red. No se aplica al sandbox ni a las escenas de prueba.

## Rationale

El objetivo es jugar en un portátil corriente (sección 2 del prompt original). El anfitrión simula para todos: si su paso de física no cabe en 16 ms, la partida va a cámara lenta para toda la sala. El servidor descarta los mensajes de más de 64 KB, así que un `full` mayor rompería sin avisar la reconexión, los espectadores y la migración.

## Enforcement

| Mechanism | Where | Blocking |
|-----------|-------|----------|
| `tests/e2e/perf.spec.ts`: paso de física medio < 16 ms | E2E local y CI (grupo `basicas`) | yes |
| Rechazo de mensajes de más de 64 KB | `server/index.ts`, `shared/protocol.ts` | yes, en producción (la partida falla) |
| Banco `node tests/tools/bench.mjs <base> high\|medium\|low gpu` y tabla de `CLAUDE.md` | local, a mano (RULE-001) | no |

Ninguna prueba mide el tamaño del `full` ni los fps en una gráfica integrada.

## Exceptions

No hay excepciones. Si un límite deja de tener sentido, se cambia esta regla con versión mayor y un ADR.

## Traceability

- Decisiones: D-036, D-038, D-039, D-041, D-042, D-046, D-051, D-063.
- `CLAUDE.md`, sección «Rendimiento (sección 5.8)».
- Código: `client/src/game/game.ts` (`adaptQuality`, tope de pasos), `shared/protocol.ts` (`MAX_MSG_BYTES`).
