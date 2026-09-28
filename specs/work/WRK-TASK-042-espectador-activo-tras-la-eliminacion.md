---
id: WRK-TASK-042
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
activates: [FEAT-CAMARA-001, FEAT-INTERFAZ-001, FEAT-SALAS-001, RULE-002]
dependencies:
  - id: WRK-TASK-041
    relation: depends-on
tags: [jugabilidad, espectador]
---

# WRK-TASK-042 — Espectador activo tras la eliminación

## Objective

Que el jugador eliminado siga participando: elegir qué castillo sigue la cámara y, según decida el usuario, influir de forma limitada en la partida.

## File Scope

- `client/src/game/match/ui.ts` (controles del eliminado)
- `client/src/game/director.ts` y `camera.ts` (seguir un castillo)
- `shared/match.ts` y `client/src/game/match/host.ts` si hay intervención
- `shared/protocol.ts` si hay mensajes nuevos (no hizo falta)
- `client/src/ui/hud.ts` (botones ◀ ▶ también con ratón y línea «Viendo»)
- `tests/e2e/espectador.spec.ts` (nueva, en el grupo `basicas` de CI), `tests/e2e/multiplayer.spec.ts`

## Implementation Notes

**Decisión del usuario al empezar:**

- a) **Solo cámara** (recomendada para empezar): el eliminado cambia de castillo con Q/E o con las flechas ◀ ▶ y la cámara lo encuadra durante el apuntado.
- b) **Cámara y viento**: además, los eliminados votan la dirección del viento de la ronda siguiente.
- c) **Cámara y fantasma**: cada eliminado lanza un proyectil débil cada 2 rondas.

La opción b o c cambia el equilibrio (RULE-001) y el protocolo (RULE-002).

**Decisión del usuario (2026-09-27):** a) solo cámara.

## Acceptance Criteria

- [x] Decisión del usuario anotada.
- [x] Un jugador eliminado puede elegir qué castillo ve, en PC y en móvil vertical.
- [x] Los espectadores que entran con la partida empezada tienen los mismos controles.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Eliminado que cambia de castillo en escritorio y móvil |
| Medición | Equilibrio si hay intervención |

## Evidence

2026-09-28. Decisión del usuario: a) solo cámara. Sin cambios de equilibrio ni de protocolo. Detalle en FEAT-CAMARA-001 (punto 5).

- `MatchUI.watching()` es cierto sin rey vivo mientras sigue la partida, sea eliminado o espectador (`you === null`): los dos usan el mismo camino. Teclas propias (Q/E, Tab, flechas), porque la entrada de puntería está apagada. Los botones ◀ ▶ también se ven con ratón. La línea «👁 Castillo de …» va en la de la puntería (`Hud.setWatch`), que solo toca el DOM si cambia.
- `tests/e2e/espectador.spec.ts` (1280×720 y 390×844) elimina a tu rey en la ronda 1, congela el apuntado de la ronda 2 (los bots fijan su disparo enseguida), cambia de castillo con E o con ▶, comprueba la línea y que la cámara gira alrededor de ese castillo, y vuelve al plano general. 4 de 4 con `--repeat-each 2`. En la prueba de 4 jugadores, el espectador que entra en la ronda 2 tiene los mismos controles.
- Hallazgo durante la prueba: `setAimInfo(null)` vaciaba cada fotograma la línea del espectador y, en el móvil, no volvía a salir; ahora se respetan.
- `npm run verify` (44 unitarios) y `npm run e2e -- hud-compact touch controls tutorial` (13 de 13) en verde.
- CI: la primera vez, `espectador.spec.ts` agotó los 60 s de espera hasta el apuntado de la ronda 2 (SwiftShader). Se amplió a 200 s y pasó.

