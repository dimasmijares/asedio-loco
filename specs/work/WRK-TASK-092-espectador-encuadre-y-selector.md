---
id: WRK-TASK-092
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
activates: [FEAT-CAMARA-001]
dependencies:
  - id: WRK-TASK-073
    relation: depends-on
tags: [espectador, camara, interfaz]
---

# WRK-TASK-092 — Espectador: titular, encuadre y tarjetas

## Objective

Corrección del usuario tras revisar el tablero «R-07, R-11, R-13 y R-14 · en el juego» (05-10-2026): el titular «Mirando: Todos los castillos» se cortaba; al mirar un castillo, este debe quedar en el hueco entre el marcador y el selector, con margen y sin que la chincheta llegue a los chips; las tarjetas del selector, juntas a la izquierda con 8 px de separación, no repartidas.

## File Scope

- `client/src/game/match/ui.ts` (`frameCastle`, `watchGap`), `client/src/ui/hud.ts` (`setSpectator`), `client/src/ui/flujo.css`
- `tests/e2e/espectador.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-CAMARA-001 | Espectador activo |

- Titular en móvil: «MIRANDO Todos» (como la tarjeta); con un nombre que no cabe junto a la pista, la pista «o desliza en la escena» se quita antes que recortar el nombre.
- Encuadre: el mismo cálculo que el castillo ganador de R-15 (`frameCastle`): distancia a la que el castillo ocupa un tercio del alto del hueco y desplazamiento de la imagen que lo centra algo por debajo del centro del hueco. En PC, el hueco va de la píldora de la ronda a la de «Mirando a …» y a la izquierda de las tarjetas.
- Volver a «Todos» devuelve la cámara al plano general (antes se quedaba orbitando el último castillo mirado).

## Acceptance Criteria

- [x] «MIRANDO Todos» sin recortar; tarjetas juntas a la izquierda a 8 px (`espectador.spec.ts`).
- [x] Al volver a «Todos», la cámara vuelve al plano general (`espectador.spec.ts`).
- [x] Mirando un castillo, se ve entero entre el marcador y el selector, con la chincheta lejos de los chips (capturas del tablero «Correcciones de flujo · en el juego»).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `espectador.spec.ts` en PC y en móvil vertical |
| Revisión | Capturas del espectador en «Todos» y mirando un castillo |

## Evidence

2026-10-05. `espectador.spec.ts` en verde en local; capturas en móvil y PC.
