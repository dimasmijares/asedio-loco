---
id: WRK-TASK-016
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-005
activates:
  - FEAT-INTERFAZ-001
  - ARCH-005
tags:
  - portada
  - carga
---

# WRK-TASK-016 — La portada no descarga Rapier para el fondo

## Objective

Que la portada muestre su fondo animado sin descargar Rapier (1,1 MB comprimido), que solo hace falta para jugar.

## File Scope

Propuesto:

- `client/src/ui/backdrop.ts` (hoy llama a `loadRapier()` antes de crear `WorldView`)
- `client/src/game/view.ts` o `client/src/game/sim/debris.ts` (que la vista pueda crearse sin el mundo de fragmentos)
- `tests/e2e/smoke.spec.ts` (comprobar las peticiones de la portada)

Fuera: la carga de Rapier al empezar una partida.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | La portada animada (D-043) se ve igual |
| ARCH-005 | Menos peso inicial, importante con datos móviles |

- `WorldView` crea los fragmentos (`Debris`), que usan un mundo de Rapier propio (D-009). El fondo no rompe nada, así que puede ir sin ellos.
- Alternativa si separarlo cuesta: diferir el fondo hasta que Rapier esté en caché, y precargar Rapier en segundo plano al pulsar «Jugar».

## Acceptance Criteria

- [ ] Abrir la portada con `?backdrop=1` no pide el `.wasm` de Rapier.
- [ ] El fondo sigue girando con la isla y los 4 castillos.
- [ ] Empezar una partida carga Rapier y funciona como antes.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | — |
| Integration | E2E de humo que revisa las peticiones de red de la portada |
| Manual | Captura de la portada para comprobar que el fondo no cambia |

## Evidence

Pendiente.
