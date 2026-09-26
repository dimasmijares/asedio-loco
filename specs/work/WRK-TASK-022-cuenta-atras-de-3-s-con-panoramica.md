---
id: WRK-TASK-022
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: medium
version: 0.1.0
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

# WRK-TASK-022 — Cuenta atrás de 3 s con la cámara alejándose

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

- [ ] Todos listos → 3 s de cuenta atrás → impacto. Lo mismo al agotarse los 20 s, con los rezagados fijados.
- [ ] Número 3-2-1 en pantalla con sonido, y «¡Fuego!» al disparar.
- [ ] Al disparar, la cámara ya está en el plano general; capturas de antes y después.
- [ ] `PROTOCOL_VERSION` pasa a 6.
- [ ] E2E `solo`, `multiplayer` y `controls` en verde.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `solo` (se observa la fase `countdown`) y `multiplayer` (todos ven la misma fase) |
| Manual | Capturas con `tests/tools/impact-shots.mjs` |

## Evidence

Pendiente.
