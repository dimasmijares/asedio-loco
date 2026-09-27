---
id: WRK-TASK-051
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
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

- [ ] Reacciones visibles en PC y en móvil vertical (capturas o vídeo corto).
- [ ] Sin coste de rendimiento apreciable.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Capturas | Rey reaccionando en el campo de pruebas |

## Evidence

Pendiente.
