---
id: WRK-TASK-090
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-10-05
updated: 2026-10-05
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-INTERFAZ-001, FEAT-CAMARA-001]
dependencies:
  - id: WRK-TASK-089
    relation: depends-on
tags: [interfaz, diseno, final, camara]
---

# WRK-TASK-090 — Pantalla final según R-15

## Objective

Corrección del usuario tras revisar el tablero «R-07, R-11, R-13 y R-14 · en el juego» (05-10-2026): la pantalla final pasa a las maquetas de R-15 (página «Nueva versión», sección «Final de partida»), aprobado. La hoja cambiaba de altura según quién fueras (al anfitrión le tapaba el marcador), la cámara no encuadraba nada y los nombres de las estadísticas salían cortados.

## File Scope

- `client/src/game/match/ui.ts` (`showOver`, `frameWinner`, `placeCrown`, `renderOverActions`), `client/src/ui/flujo.css`
- `tests/e2e/sala.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Pantalla final |
| FEAT-CAMARA-001 | Plano de la fase `over` |

- F1: la misma hoja para anfitrión, invitado y solitario; solo cambian los botones, en una zona del mismo alto (60 + 12 + 52 px en móvil, 58 px en PC).
- F2: en móvil vertical, hoja crema desde y = 300 (en 390×844) hasta abajo, sin velo y nunca por encima de los chips; la píldora dice «Fin de la partida» sin el círculo de segundos. En PC, panel de 560 px a la derecha, a 96 px de arriba, bajo la píldora.
- F3: la cámara orbita el castillo ganador a la distancia en que ocupa algo menos de la mitad del hueco libre (móvil: entre los chips y la hoja; PC: a la izquierda del panel) y el desplazamiento de la imagen lo lleva al centro de ese hueco. Encima, la corona (chapa noche con borde crema y la corona naranja), y confeti dos veces.
- F4: «¡Has ganado!» con «Tu rey es el último en pie · N rondas»; si no, «Gana <nombre>» con «Quedas N.º · tu rey cayó en la ronda R». Corona naranja si ganas y crema si no.
- F5: una fila por estadística: icono, título, valor y quién, con el nombre completo (en dos líneas si hace falta) y «(tú)», y su emblema.
- F6: anfitrión, REVANCHA y debajo VOLVER A LA SALA | SALIR; invitado, «Esperando a que <anfitrión> pida la revancha» (recuadro noche con tres puntos) y SALIR; solitario, OTRA PARTIDA y CAMBIAR RIVALES | SALIR. En PC, los tres en una fila.

## Acceptance Criteria

- [x] Anfitrión e invitado ven la hoja en el mismo sitio y del mismo tamaño, con la zona de botones del mismo alto (`sala.spec.ts`, en PC y en móvil vertical).
- [x] La hoja no tapa la píldora ni los chips; la píldora dice «Fin de la partida» sin segundos (`sala.spec.ts`).
- [x] Cada uno ve el titular desde su punto de vista (`sala.spec.ts`).
- [x] El castillo ganador, con la corona, se ve en el hueco libre (capturas del tablero «Correcciones de flujo · en el juego»).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `sala.spec.ts`: misma hoja para anfitrión e invitado, sin tapar el marcador, titular de cada uno; `solo.spec.ts` y `sala.spec.ts`: botones del solitario |
| Revisión | Capturas en móvil y PC: final del anfitrión, del invitado y en solitario |

## Evidence

2026-10-05. `sala.spec.ts` (revancha) y la pausa y el final en solitario en verde en local, en PC y en móvil vertical.
