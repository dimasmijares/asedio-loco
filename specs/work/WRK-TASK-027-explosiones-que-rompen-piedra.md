---
id: WRK-TASK-027
type: spec
layer: work-task
scope: ephemeral
status: active
confidence: low
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-007
activates: [DOM-JUEGO-003, RULE-001]
tags: [municion, equilibrio]
---

# WRK-TASK-027 — Explosiones que rompen piedra: vaca y sandía

## Objective

Que la vaca deje un cráter redondo (14-18 bloques) y la sandía un hueco profundo en el punto exacto donde se pega (14-18 bloques, mejor contra torres).

## File Scope

- `client/src/game/sim/sim.ts` (`explode`: caída, oclusión y fractura)
- `client/src/game/sim/projectiles.ts` (vaca y sandía)

## Implementation Notes

- Vaca: radio de 3,6 a ~4,5 m y fuerza que fracture piedra hasta ~1,5 m del centro (hoy 28; la piedra pide 36). Más impulso para que los trozos vuelen.
- Sandía: la explosión nace **dentro** del bloque al que se pega y la oclusión no la frena ni en ese bloque ni en sus vecinos (carga dirigida hacia el castillo). Pepitas como metralla ligera.
- Ajustar la caída (`^1.4`) si hace falta para que el cráter tenga borde nítido.
- La burbuja sigue parando la onda de fuera.

## Acceptance Criteria

- [ ] Vaca y sandía en 14-18 bloques y con piedra rota en el centro.
- [ ] Como mucho 3 de 12 reyes con cada una.
- [ ] Las demás municiones con explosión (gallina, agujero negro) medidas y anotadas.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

Pendiente.
