---
id: WRK-TASK-051
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-010
activates: [FEAT-SENSACION-001, FEAT-REPLAY-001]
tags: [graficos, sensacion]
---

# WRK-TASK-051 — Animación del rey

## Objective

Que el rey reaccione: gesto de susto cuando un proyectil le pasa cerca o su castillo recibe daño, y una caída o desmayo visible al ser eliminado.

## File Scope

- `client/src/game/render/models.ts` (`makeKing`: piezas articuladas)
- `client/src/game/view.ts` (animación según eventos `hit`, `dmg` y `king`)

## Implementation Notes

Solo visual: la cápsula física del rey no cambia. Animaciones por código (sin esqueleto), baratas, y que funcionen también en la repetición.

## Acceptance Criteria

- [x] Reacciones visibles en PC y en móvil vertical (capturas o vídeo corto).
- [x] Sin coste de rendimiento apreciable.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Capturas | Rey reaccionando en el campo de pruebas |

## Evidence

2026-09-28. Detalle en FEAT-SENSACION-001 (punto 4).

- Modelo articulado en `makeKing`: `rig` con pivote en los pies, cabeza (con la corona) y brazos. La animación va por código en `WorldView.animateKings` y los sustos se disparan en `startle`, desde `hit`, `boom`, `rm` y los proyectiles cercanos. La cápsula física no cambia.
- Capturas de cerca en el campo de pruebas (1280×720 y 390×844, con los bloques ocultos para ver al rey dentro de su jaula de cristal): en reposo, asustado (brazos arriba) y desmayado (tumbado de espaldas). En reposo, los brazos quedaban dentro de la túnica: se abrieron a 0,35 rad. El desmayo se reduce según lo inclinada que esté la cápsula, para no tumbar dos veces a un rey que la física ya ha tumbado.
- Rendimiento: banco `low gpu cpu=4 movil`, 2 pasadas: 14-15 fps (antes 12), dibujo de 6,8-7,6 ms por fotograma y 242 llamadas de dibujo (antes 238). `perf.spec.ts` en verde, con 410 llamadas de dibujo como máximo (antes 394, por la sombra de los brazos).
- `npm run verify` (43 unitarios) y `npm run e2e -- smoke solo` en verde.

