---
id: WRK-TASK-022
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-006
activates: [DOM-JUEGO-001, FEAT-CAMARA-001, FEAT-INTERFAZ-001, RULE-002]
dependencies:
  - id: WRK-TASK-023
    relation: depends-on
tags: [camara, fases, hud]
---

# WRK-TASK-022 — Cuenta atrás 3, 2, 1, ¡FUEGO! con la cámara alejándose

## Objective

Entre el apuntado y el impacto, una fase `countdown` de 3 s en la que la cámara se aleja hasta la panorámica y la pantalla cuenta 3-2-1. Al llegar a 0 salen los disparos.

## File Scope

- `shared/match.ts` (`Phase` y `countdownDuration`) y `shared/protocol.ts` (`PROTOCOL_VERSION`).
- `client/src/game/match/host.ts`: el paso `aim` → `countdown` → `impact` sustituye a `lockGrace`, y cubre la migración.
- `client/src/game/match/ui.ts` y `client/src/game/director.ts`: la cámara.
- `client/src/ui/hud.ts` y los estilos: el efecto.
- `client/src/game/audio.ts`: el sonido.
- `tests/e2e/` (las pruebas que dependan del paso al impacto) y `tests/tools/` si lo necesitan las capturas.
- Consolidación: `DOM-JUEGO-001` y `FEAT-CAMARA-001`.

## Implementation Notes

- Al entrar en `countdown` quedan fijados todos los vivos. La munición se sigue consumiendo al empezar el impacto.
- **Cámara:** va de la vista de apuntado a un plano general que encuadra los puntos de lanzamiento y los castillos objetivo de todos los vivos. Se mueve suave y continua durante los 3 s. Al empezar el impacto, el director parte de ese encuadre y lo mantiene hasta que haya proyectiles, sin saltar a la órbita.
- **Migración en `countdown`:** el nuevo anfitrión sigue la cuenta con `remaining`.

## Acceptance Criteria

- [x] Todos listos → 3 s de cuenta atrás → impacto. Lo mismo al agotarse los 20 s, con los rezagados fijados.
- [x] 3, 2, 1 y ¡FUEGO! en pantalla, cuatro tiempos de 1 s con sonido; los disparos salen con ¡FUEGO! (segundo mensaje del usuario).
- [x] Al disparar, la cámara ya está en el plano general; capturas de antes y después.
- [x] `PROTOCOL_VERSION` pasa a 6.
- [x] E2E `solo`, `multiplayer` y `controls` en verde.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `solo` (se observa la fase `countdown`) y `multiplayer` (todos ven la misma fase) |
| Manual | Capturas con `tests/tools/impact-shots.mjs` |

## Evidence

- **Código:**
  - `shared/match.ts`: fase `countdown` y `countdownDuration` (3 s, o 1 s con `?fast=1`).
  - `MatchHost.beginCountdown`: sustituye a `lockGrace`, deja fijados a los rezagados y expone `aimLeft`.
  - `Director.startCountdown` y `countdown`: plano general continuo, que al empezar el impacto sigue 2,5 s con los castillos.
  - `Hud.setCountdown`, `sfx.fuego` y el paso a `PROTOCOL_VERSION` 6.
- **Pruebas unitarias:** `tests/unit/countdown.test.ts` usa el anfitrión real en Node. Comprueba `intro → aim → countdown → impact` con `aimLeft > 0` y 3 s de cuenta. Si un humano no dispara, la cuenta empieza al agotarse los 20 s y queda fijado.
- **E2E:** `controls.spec.ts` ahora exige `countdown` con `aimLeft > 0`.
- **Puertas en local (2026-09-26):** `npm run verify` y E2E `controls`, `solo` y `multiplayer` (6 pruebas: 4 jugadores, migración, segundo plano, móvil, revancha y red mala), 8 en verde.
- **Capturas** con `tests/tools/countdown-shots.mjs`: el 3 detrás del castillo propio, el 2 ya alejándose y ¡FUEGO! con los 4 castillos en el encuadre. Al impacto, el encuadre se cierra poco a poco, sin saltos.
- **Consolidación:** `DOM-JUEGO-001` 1.1.0, `FEAT-CAMARA-001` 1.1.0, `FEAT-INTERFAZ-001` 1.1.0, `ARCH-003` y `RULE-002` (v6).
- **Fallo antiguo arreglado de paso** (visto el 26-09-2026 al medir WRK-TASK-021): con `lockGrace`, el adelanto de 0,6 s solo saltaba si el contador llegaba exactamente a 0; como se pasaba a negativo, volvía a 0,6, y la ronda esperaba siempre los 20 s. En la simulación eran 18 s de apuntado por ronda con bots que deciden en 1-3 s, y ahora son 2,2 s. La cuenta atrás lo sustituyó.
