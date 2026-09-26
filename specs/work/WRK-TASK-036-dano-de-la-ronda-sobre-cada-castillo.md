---
id: WRK-TASK-036
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

- [x] En la fase de resultados, cada castillo en juego muestra su etiqueta en escritorio y en móvil vertical (prueba E2E).
- [x] Las etiquetas no se salen de la pantalla ni tapan la lista de resultados.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Escritorio 1280×720 y móvil vertical 390×844 |
| Capturas | Antes y después en los dos formatos |

## Evidence

- `MatchUI.showDamage` y `placeDamage`: en la fase de resultados, cada castillo que seguía en juego muestra «−N» en el color del jugador, o «Sin daños», 6,5 m por encima de su centro. La posición se proyecta en cada fotograma porque la cámara se mueve. Se desvanecen en 2,8 s (sin animación con `prefers-reduced-motion`).
- Al principio se ocultaban las que caían fuera de pantalla, y en escritorio no se veía ninguna: durante los resultados, la cámara se acerca a la acción. Ahora se anclan al borde, en la dirección del castillo, y, si caen sobre la lista de resultados, bajan justo por debajo de ella.
- `tests/e2e/encuadre.spec.ts` comprueba, en 1280×720 y 390×844, que hay 4 etiquetas, que están dentro de la pantalla y que no se cruzan con la lista de resultados. Pasa 2 de 2.
