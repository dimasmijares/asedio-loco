---
id: WRK-TASK-042
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
- `shared/protocol.ts` si hay mensajes nuevos

## Implementation Notes

**Decisión del usuario al empezar:**

- a) **Solo cámara** (recomendada para empezar): el eliminado cambia de castillo con Q/E o con las flechas ◀ ▶ y la cámara lo encuadra durante el apuntado.
- b) **Cámara y viento**: además, los eliminados votan la dirección del viento de la ronda siguiente.
- c) **Cámara y fantasma**: cada eliminado lanza un proyectil débil cada 2 rondas.

La opción b o c cambia el equilibrio (RULE-001) y el protocolo (RULE-002).

**Decisión del usuario (2026-09-27):** a) solo cámara.

## Acceptance Criteria

- [x] Decisión del usuario anotada.
- [ ] Un jugador eliminado puede elegir qué castillo ve, en PC y en móvil vertical.
- [ ] Los espectadores que entran con la partida empezada tienen los mismos controles.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | Eliminado que cambia de castillo en escritorio y móvil |
| Medición | Equilibrio si hay intervención |

## Evidence

Pendiente.
