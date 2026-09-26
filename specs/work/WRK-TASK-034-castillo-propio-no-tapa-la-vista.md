---
id: WRK-TASK-034
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-008
activates: [FEAT-CAMARA-001, ARCH-005, RULE-004]
tags: [claridad, movil]
---

# WRK-TASK-034 — El castillo propio no tapa la vista al apuntar

## Objective

Que al apuntar, en PC y en móvil, los muros propios más cercanos a la cámara no oculten la catapulta, la parábola ni el castillo objetivo.

## File Scope

- `client/src/game/render/blocks.ts` y `materials.ts` (material de los bloques)
- `client/src/game/game.ts` (distancia de desvanecido según el modo de cámara)

## Implementation Notes

Desvanecido por tramado (*screen-door*) en el sombreador de los bloques y de sus contornos: los fragmentos a menos de `uFadeNear` metros de la cámara se descartan con un patrón ordenado de 4×4, con una transición de 3 m. Solo en el modo de apuntado; en el resto de modos, `uFadeNear = 0`. Sirve con el *instancing* y no necesita ordenar transparencias.

## Acceptance Criteria

- [x] En escritorio y en móvil vertical, la catapulta propia y la parábola se ven enteras al apuntar (capturas antes y después).
- [x] Fuera del apuntado no cambia nada.
- [x] `perf.spec.ts` sigue por debajo del presupuesto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Escritorio 1280×720 y móvil vertical 390×844 |
| Capturas | Antes y después en los dos formatos |

## Evidence

- `NEAR_FADE` y `withNearFade` en `render/materials.ts`: tramado Bayer de 4×4 en el sombreador de los bloques (vía `onBeforeCompile`) y en el de sus contornos. Descarta hasta el 90 % de los fragmentos, con una transición de 4 m.
- `game.ts`: al apuntar, la distancia de desvanecido es la de la cámara a la catapulta menos 1,5 m. Con 11 m fijos apenas se notaba, porque los muros que tapan están detrás del castillo, entre 10 y 14 m. Fuera del apuntado vuelve a 0 con suavizado.
- Capturas antes y después en 1280×720 y 390×844 (partida con semilla 7): la franja central e inferior queda despejada en los dos formatos. Siguen visibles los muros laterales, más lejanos que la catapulta, que no tapan la parábola ni el objetivo.
- `perf.spec.ts`: paso de física de 5,3 ms y 394 llamadas de dibujo, igual que antes (5,2 ms y 394).
- E2E `perf`, `physics`, `touch` y `hud-compact` en local: 12 de 12.
