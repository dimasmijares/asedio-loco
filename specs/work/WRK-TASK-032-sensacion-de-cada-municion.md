---
id: WRK-TASK-032
type: spec
layer: work-task
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-007
activates: [DOM-JUEGO-003, RULE-001, FEAT-SENSACION-001, FEAT-INTERFAZ-001]
tags: [municion, equilibrio]
---

# WRK-TASK-032 — Sensación propia de cada munición

## Objective

Que cada disparo se note: temblor de cámara proporcional al destrozo, efecto y sonido característicos por munición y la tarjeta explicando su identidad en pocas palabras.

## File Scope

- `client/src/game/camera.ts` o `director.ts` (temblor)
- `client/src/game/render/` (efectos) y `client/src/game/audio.ts` (sonidos)
- `shared/ammo.ts` (`desc` de cada tarjeta)

## Implementation Notes

Temblor corto según los bloques rotos en el último medio segundo, que se puede quitar en ajustes (y se quita solo con `prefers-reduced-motion`). Descripciones cortas para que quepan en la tarjeta en vertical.

## Acceptance Criteria

- [ ] Temblor según el destrozo, que se puede desactivar.
- [ ] Cada munición con su efecto y su sonido.
- [ ] Descripciones nuevas legibles en móvil en vertical.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

Pendiente.
