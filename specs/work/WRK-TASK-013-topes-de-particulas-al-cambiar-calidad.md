---
id: WRK-TASK-013
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-005
activates:
  - ARCH-005
  - FEAT-INTERFAZ-001
  - RULE-004
tags:
  - rendimiento
  - calidad
---

# WRK-TASK-013 — Topes de partículas y fragmentos al cambiar la calidad

## Objective

Que al cambiar la calidad en plena partida (en Ajustes o por la calidad adaptativa) cambien también los topes de fragmentos y partículas, y no solo la resolución y las sombras.

## File Scope

Propuesto:

- `client/src/game/view.ts` (hoy fija el tope de `Debris` y crea `Fx` con la calidad del arranque)
- `client/src/game/sim/debris.ts`, `client/src/game/render/fx.ts` (aceptar un tope nuevo en caliente)
- `client/src/game/game.ts` (avisar a la vista al cambiar la calidad)

Fuera: `stage.ts`, que ya cambia resolución y sombras al momento.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| ARCH-005 | Topes: fragmentos 90/170/260 y partículas 260/550/900 según calidad (D-009, D-046) |
| FEAT-INTERFAZ-001 | El cambio de Ajustes se nota al momento |
| RULE-004 | Bajar el tope no puede dar tirones: retirar lo que sobra poco a poco o dejar que caduque |

- La calidad adaptativa (D-041) baja un nivel en plena partida; sin esta tarea, en un equipo lento los topes altos siguen activos. Ayuda a WRK-TASK-008.

## Acceptance Criteria

- [x] En `/#sandbox`, al pasar de alta a baja, el contador de trozos no supera 90 y el de partículas no supera el tope de baja.
- [x] Al subir de baja a alta, los topes suben sin recargar.
- [x] Se quita la limitación de ARCH-005, FEAT-INTERFAZ-001 y FEAT-SENSACION-001 (`CLAUDE.md` ya no la tenía); `DECISIONES.md` es histórico y no se actualiza.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | `Debris` con tope reducido retira los sobrantes |
| Integration | E2E en el sandbox: cambiar calidad y leer los contadores |
| Manual | — |

## Evidence

- `Game.applyQuality` sustituye a `Stage.setQuality` en Ajustes y en la calidad adaptativa, y llama también a `WorldView.setQuality`, que a su vez llama a `Debris.setMax` y `Fx.setQuality`.
- Las mallas instanciadas se crean con la capacidad de la calidad alta (260 fragmentos por material, 900 partículas y 540 astillas). El tope vigente es un límite aparte: al bajar, se retiran de golpe los más antiguos que sobran, algo que no cuesta nada en CPU.
- `tests/e2e/calidad.spec.ts` (grupo `basicas` de CI): en `/?quality=high#sandbox`, tras 4 vacas hay más de 90 fragmentos. Al pasar a baja, el tope es 90 y el recuento no lo supera (partículas: tope 260). Al volver a alta, los topes vuelven a 260 y 900 sin recargar.
