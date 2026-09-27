---
id: WRK-TASK-046
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
activates: [FEAT-INTERFAZ-001]
tags: [interfaz, movil]
---

# WRK-TASK-046 — Nombres en el marcador compacto del móvil

## Objective

En el marcador compacto (móvil en vertical y en horizontal) solo se ven el estandarte y el porcentaje. Que se pueda identificar a cada rival sin ocupar mucho más espacio.

## File Scope

- `client/src/ui/hud.ts` (marcador)
- `client/src/ui/style.css` (bloques de pantallas pequeñas al final del archivo)
- `tests/e2e/hud-compact.spec.ts`
- `shared/players.ts` (`shortName`, lógica pura) y `tests/unit/players.test.ts`

## Implementation Notes

Opciones: iniciales o nombre abreviado (6-8 caracteres) junto al porcentaje, o el nombre completo al tocar la fila. Mantener el ancho actual en horizontal.

## Acceptance Criteria

- [x] En 390×844, 412×915 y los 3 tamaños horizontales se identifica a cada jugador.
- [x] `hud-compact.spec.ts` sin solapes y con nombres visibles.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `hud-compact` |

## Evidence

2026-09-27. Opción elegida: nombre corto junto a la barra, sin tocar para verlo.

- `shortName` en `shared/players.ts`: «Tú» en la fila propia; en los bots, la última palabra («Sir Bot» → «Bot», «Duquesa Tuerca» → «Tuerca»); en los humanos, la primera. El nombre completo, en el `title` de la fila.
- En el modo compacto (altura ≤ 500 px y vertical ≤ 600 px de ancho) el cuerpo de la fila pasa a dos líneas: nombre corto de 10 px arriba; barra y porcentaje de 9 px debajo. Mide 52 px (antes 40-44 px): con el nombre y el porcentaje en la misma línea no cabía en 360 px de ancho sin tocar el panel de la ronda.
- `hud-compact.spec.ts`: se añade 390×844; en los 6 tamaños comprueba que hay 4 nombres cortos distintos, visibles, sin recortar y sin solapes. En escritorio el nombre corto no se ve.
- `npm run verify` en verde (39 unitarios) y `npm run e2e -- hud-compact`: 7 de 7.
