---
id: WRK-TASK-035
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
activates: [FEAT-CAMARA-001]
tags: [claridad, movil]
---

# WRK-TASK-035 — Plano general que encuadra todos los castillos en cualquier pantalla

## Objective

Que en la cuenta atrás y durante el impacto se vean todos los castillos en juego, también en móvil vertical.

## File Scope

- `client/src/game/director.ts` (`frame`)
- `tests/e2e/` (comprobación de encuadre)

## Implementation Notes

`frame` calcula la distancia necesaria con el semiángulo vertical y con el horizontal (`atan(tan(vfov/2) · aspecto)`) y usa la mayor. En vertical la cámara sube para aprovechar la altura de la pantalla.

## Acceptance Criteria

- [x] En 1280×720 y en 390×844, al final de la cuenta atrás los 4 castillos proyectan dentro de la pantalla (prueba E2E).
- [x] En escritorio el encuadre no se aleja más que antes.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Escritorio 1280×720 y móvil vertical 390×844 |
| Capturas | Antes y después en los dos formatos |

## Evidence

- `Director.frame` calcula la distancia con los dos semiángulos, `max(r / tan(v) · 0,8, r / tan(h) · 1,1) + 4`, a partir del campo de visión real de la cámara. En pantallas apaisadas manda el vertical, como antes. En vertical manda el horizontal y la cámara se coloca más alta (0,78 de la distancia frente a 0,55) y menos retrasada (0,62 frente a 0,82). Con un factor horizontal de 0,9, el castillo lateral quedaba en x = 1,09 (fuera de pantalla), porque la perspectiva abre hacia fuera los castillos más cercanos.
- `tests/e2e/encuadre.spec.ts` (grupo `basicas` de CI): al empezar el impacto proyecta los 4 reyes y comprueba que caen dentro de la pantalla, en 1280×720 y en 390×844. Pasa 2 de 2.
- Capturas: en escritorio el plano no cambia. En vertical se ven los 4 castillos, más pequeños, porque la anchura de la pantalla es el límite.
