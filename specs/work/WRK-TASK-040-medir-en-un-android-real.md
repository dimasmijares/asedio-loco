---
id: WRK-TASK-040
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-004
activates: [ARCH-005, RULE-004]
tags: [movil, rendimiento]
---

# WRK-TASK-040 — Medir el rendimiento en un Android real

## Objective

Confirmar en un teléfono Android real de gama media que la partida en solitario y en red es jugable con el perfil móvil (WRK-TASK-008), como anfitrión y como invitado.

## File Scope

- `specs/architecture/ARCH-005-rendimiento-y-calidad-adaptativa.md` (tabla de mediciones)

Fuera: código del juego. Si la medida no llega, el arreglo es otra tarea.

## Implementation Notes

Necesita el teléfono del usuario. Pasos:

1. Abrir `https://asedio-loco.dimasmijares.workers.dev/?bots=3#solo` con el móvil en vertical.
2. Activar «Mostrar fps» en Ajustes.
3. Anotar los fps al apuntar y durante el impacto de las primeras rondas, y el modelo del teléfono.
4. Repetir con `#bench` para la escena de referencia.

## Acceptance Criteria

- [ ] Modelo del teléfono, fps al apuntar, fps en el impacto y resultado de `#bench` anotados en ARCH-005.
- [ ] Si el impacto baja de 20 fps, se abre una tarea con la causa (física como anfitrión, dibujo o partículas).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Manual | Teléfono real del usuario |

## Evidence

Pendiente.
