---
id: WRK-TASK-036
type: spec
layer: work-task
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-008
activates: [FEAT-INTERFAZ-001, FEAT-SENSACION-001]
tags: [claridad, movil]
---

# WRK-TASK-036 — Daño de la ronda sobre cada castillo

## Objective

Que al terminar el impacto se vea sobre cada castillo cuántos bloques ha perdido en la ronda, sin tener que leer la lista de resultados.

## File Scope

- `client/src/game/match/ui.ts` (resultados de la ronda)
- `client/src/ui/hud.ts` y `style.css` (etiquetas proyectadas)

## Implementation Notes

Etiqueta HTML proyectada desde la posición del castillo a la pantalla, con «−N» en el color del jugador y «Sin daños» si no pierde nada. Aparece en la fase de resultados y se desvanece en 2,5 s. Tamaño legible en móvil vertical.

## Acceptance Criteria

- [ ] En la fase de resultados, cada castillo en juego muestra su etiqueta en escritorio y en móvil vertical (prueba E2E).
- [ ] Las etiquetas no se salen de la pantalla.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Escritorio 1280×720 y móvil vertical 390×844 |
| Capturas | Antes y después en los dos formatos |

## Evidence

Pendiente.
