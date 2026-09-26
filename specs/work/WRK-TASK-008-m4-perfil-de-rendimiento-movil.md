---
id: WRK-TASK-008
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-004
activates:
  - ARCH-005
  - RULE-004
  - DOC-OPS-001
dependencies:
  - id: WRK-TASK-005
    relation: depends-on
tags:
  - moviles
  - rendimiento
---

# WRK-TASK-008 — M4: perfil de rendimiento móvil

## Objective

Que un móvil arranque con un perfil de rendimiento propio (calidad baja, densidad de píxeles 1, 30 fps fuera del impacto) y comprobar en un teléfono real de gama media que la partida en solitario es jugable.

## File Scope

Propuesto:

- `client/src/game/game.ts` (perfil por defecto con `pointer: coarse`, límite de 30 fps fuera del impacto)
- `client/src/game/render/stage.ts` (densidad de píxeles como mucho 1 en el perfil móvil)
- `client/src/game/view.ts` (topes de fragmentos y partículas al mínimo)
- `client/src/ui/settings.ts` (que Ajustes refleje el perfil)
- `tests/tools/bench.mjs` (opción de CPU frenada 4×), `tests/e2e/perf.spec.ts` si cambia el presupuesto
- `CLAUDE.md` (tabla de rendimiento con la medida en móvil)

Fuera: física, número de castillos y control.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| ARCH-005 | Reutilizar la calidad adaptativa (baja un nivel por debajo de 38 fps) y el tope de 4 pasos por fotograma |
| RULE-004 | Cada paso de física cabe en 16 ms; medir antes y después con `/#bench` |
| DOC-OPS-001 | Registrar la medida en `CLAUDE.md` con equipo, calidad y fecha |

- La detección de móvil ya existe en `client/src/net/connection.ts` (M1): reutilizarla.
- El límite de 30 fps puede aprovechar el mecanismo de `?render=N` de `game.ts`, que ya limita el dibujo.
- Si el jugador ha elegido calidad en Ajustes, se respeta su elección.
- Los topes de partículas no cambian hasta la siguiente partida (WRK-TASK-013): conviene hacer esa tarea antes para que la calidad adaptativa sirva de verdad en el móvil.

## Acceptance Criteria

- [ ] Con `?mobile=1` (o `pointer: coarse`) y sin calidad guardada, la partida arranca en baja, con densidad 1.
- [ ] Fuera de la fase de impacto se dibuja a 30 fps como mucho; en el impacto, sin límite.
- [ ] `/#bench` con la CPU frenada 4× en Chromium: cada paso de física y los fps medidos, anotados en `CLAUDE.md`.
- [ ] Medida en un móvil real de gama media con los pasos de `docs/MOVILES.md` («Cómo comprobarlo»), anotada en `CLAUDE.md`.
- [ ] En un ordenador nada cambia.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Elección del perfil según dispositivo y ajustes guardados, si se saca a una función pura |
| Integration | Banco de rendimiento con CPU frenada 4×; E2E de que `?mobile=1` arranca en baja |
| Manual | Sandbox y dos rondas de `/#solo` en un móvil real: fps en el derrumbe y temperatura |

## Evidence

Pendiente.
