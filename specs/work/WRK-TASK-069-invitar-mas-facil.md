---
id: WRK-TASK-069
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-28
updated: 2026-10-03
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-SALAS-001, FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-064
    relation: depends-on
tags: [flujo, salas]
---

# WRK-TASK-069 — Invitar más fácil

## Objective

F4: código de sala grande y legible, «Compartir» del sistema en móvil (Web Share) y campo «Unirse con código» en la portada. Aprobado por el usuario en R-07 (28-09-2026); detalle en WRK-TASK-064.

## File Scope

- `client/src/ui/`, `client/src/main.ts`, `client/src/game/match/ui.ts`, `client/src/game/modes/`, `server/index.ts` y `shared/protocol.ts` según la mejora
- `tests/e2e/`

## Implementation Notes

- Sala nueva (R-11): `LobbyView` monta `#room` con la columna o la parte de arriba (`.room-side`: salir, título, tarjeta del código, ayuda y ajustes) y la hoja de las plazas (`#lobby`). El CSS (`client/src/ui/flujo.css`) los coloca según la orientación.
- R-11 S1: tarjeta noche con las cuatro letras (`#room-code`, `data-code`), COMPARTIR (`navigator.share`) y copiar código en móvil (`isMobileDevice`); COPIAR ENLACE y CÓDIGO en PC. Sin campo con el enlace: las pruebas leen el código de `#room-code`.
- El campo «Unirse con código» de la portada ya estaba (WRK-TASK-081).

## Acceptance Criteria

- [x] La mejora funciona en PC (1280×720) y en móvil vertical (390×844), con una E2E que la recorre (`tests/e2e/sala.spec.ts`, «código grande e invitar»).
- [x] Si cambia el protocolo, sube `PROTOCOL_VERSION` (RULE-002): no cambia.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/sala.spec.ts`: letras del código, COMPARTIR con la hoja del sistema (simulada) en móvil, copiar enlace y código, todo dentro de la pantalla, sin cruces y de 44 px o más |

## Evidence

2026-10-03. El campo «Unirse con código» de la portada ya está hecho con la portada de R-10 (WRK-TASK-081); faltan el código grande en la sala y «Compartir».

2026-10-03. Código grande y COMPARTIR hechos; `sala.spec.ts` y `lobby.spec.ts` en verde en local.
