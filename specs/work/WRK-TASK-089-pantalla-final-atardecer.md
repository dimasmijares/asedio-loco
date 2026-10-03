---
id: WRK-TASK-089
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-10-03
updated: 2026-10-03
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-072
    relation: depends-on
tags: [interfaz, diseno, final]
---

# WRK-TASK-089 — Pantalla final en estilo «Atardecer»

## Objective

Petición del usuario (03-10-2026): la pantalla final de partida pasa al estilo «Atardecer» (hoja crema, tablones, chips de jugador) y las estadísticas cambian los emoji (💥 🎯 🏰…) por iconos SVG de trazo 2,5 px, como dice la sección «Iconos» del design system. No había maqueta: se sigue el design system y la hoja de resultados del móvil (R-10 U7).

## File Scope

- `client/src/game/match/ui.ts` (`showOver`), `client/src/ui/icons.ts` (`burst`, `miss`), `client/src/ui/flujo.css`, `client/src/ui/style.css` (fuera los estilos viejos)
- `tests/e2e/solo.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Pantalla final |

- Hoja crema abajo y a todo el ancho en vertical; tarjeta de 760 px centrada en horizontal. Arriba, una chapa con la corona (naranja si ganas), «¡Has ganado!» / «Gana <nombre>» / «Empate» en Lilita, «N rondas · …» y el chip del ganador.
- Estadísticas en tarjetas hueso con el icono sobre noche: mayor destrozo (`burst`), mejor disparo (`target`), disparo más desviado (`miss`), daño propio (`alert`), castillo más entero (`castle`) y objetivos cumplidos (`flag`). Cada una con el chip del jugador (emblema y nombre; el tuyo, «Tú» con borde crema) y la cifra. Dos columnas en móvil y tres en PC, para que los tablones queden a la vista sin desplazar.
- Tablones: el principal en naranja (REVANCHA u OTRA PARTIDA), el resto en crema (VOLVER A LA SALA, CAMBIAR RIVALES, SALIR). SALIR va en crema: aquí no es peligroso, la partida ya ha acabado.

## Acceptance Criteria

- [x] Sin emoji en la pantalla final; los iconos son SVG.
- [x] En 390×844 y 1280×720 los tablones se ven sin desplazar (capturas del tablero «R-07, R-11, R-13 y R-14 · en el juego»).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/solo.spec.ts`: iconos SVG y ningún emoji en `#game-over` |
| Revisión | Capturas en móvil y PC |

## Evidence

2026-10-03. Capturas en móvil y PC; `solo.spec.ts` en verde.
