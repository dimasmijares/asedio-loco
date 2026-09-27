---
id: WRK-TASK-008
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
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

- [x] Con `?mobile=1` (o `pointer: coarse`) y sin calidad guardada, la partida arranca en baja, con densidad 0,85 (la de la calidad baja).
- [x] Fuera de la cuenta atrás, el impacto y la repetición se dibuja a 30 fps como mucho; en esas fases, sin límite.
- [x] `/#bench` con la CPU frenada 4× en Chromium: paso de física y fps anotados en ARCH-005 (`CLAUDE.md` ya no lleva la tabla).
- [x] ~~Medida en un móvil real de gama media~~: se traslada a WRK-TASK-040, porque necesita el teléfono del usuario.
- [x] En un ordenador nada cambia (calidad media por defecto y sin límite de 30 fps).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | Elección del perfil según dispositivo y ajustes guardados, si se saca a una función pura |
| Integration | Banco de rendimiento con CPU frenada 4×; E2E de que `?mobile=1` arranca en baja |
| Manual | Sandbox y dos rondas de `/#solo` en un móvil real: fps en el derrumbe y temperatura |

## Evidence

- `savedQuality` (`game.ts`) y los valores por defecto de Ajustes (`settings.ts`): sin calidad guardada ni `?quality`, un móvil arranca en baja; un ordenador, en media.
- `Game.fullRate`: `MatchUI` lo activa en la cuenta atrás, el impacto y la repetición. En móvil, fuera de esas fases el dibujo se limita a 30 fps (`1/31` s entre fotogramas, uno de cada dos a 60 Hz).
- `tests/tools/bench.mjs` acepta `cpu=N` (frena la CPU con CDP) y `movil` (390×844 con `?mobile=1`). Mediciones en ARCH-005: PC en media, 285 fps y 5,3 ms por paso de física; móvil emulado en baja con la CPU 4× más lenta, 16 fps y 14,5 ms por paso.
- `touch.spec.ts` comprueba que un móvil sin calidad guardada arranca en baja con densidad de píxeles ≤ 1.
