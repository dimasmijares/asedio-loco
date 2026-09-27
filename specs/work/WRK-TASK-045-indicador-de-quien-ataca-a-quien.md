---
id: WRK-TASK-045
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-010
activates: [FEAT-INTERFAZ-001, FEAT-CAMARA-001, ARCH-003]
tags: [interfaz, claridad]
---

# WRK-TASK-045 — Indicador de quién ataca a quién

## Objective

Que durante la cuenta atrás se vea a qué castillo apunta cada jugador, para entender lo que va a pasar y reconocer las venganzas.

## File Scope

- `client/src/game/match/ui.ts` (datos de objetivo de cada jugador)
- `client/src/game/view.ts` o `render/fx.ts` (arcos o flechas en 3D)
- `client/src/game/net/netClient.ts` si falta el objetivo de los demás en los clientes

## Implementation Notes

Durante la fase `countdown`, un arco discontinuo del color de cada jugador desde su catapulta hasta el castillo objetivo, visible desde el plano general. Se desvanece al empezar el impacto. El objetivo de cada jugador ya viaja en los mensajes de puntería (`tgt`).

## Acceptance Criteria

- [ ] En la cuenta atrás se ven los arcos de todos los jugadores vivos, en PC y en móvil vertical (capturas).
- [ ] En red, un invitado ve los mismos arcos que el anfitrión.
- [ ] `perf.spec.ts` dentro del presupuesto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Arcos presentes en la cuenta atrás (solitario y red) |

## Evidence

Pendiente.
