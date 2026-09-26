---
id: WRK-TASK-015
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
  - FEAT-SENSACION-001
  - FEAT-REPLAY-001
tags:
  - documentacion
---

# WRK-TASK-015 — README sin la cámara lenta en directo

## Objective

Que el README describa lo que pasa hoy al caer un rey: desde D-060 no hay cámara lenta en directo; la cámara lenta solo existe en la repetición (D-061).

## File Scope

- `README.md` (la línea de «Eliminación»: «Se ve al momento: cámara lenta, confeti y la calavera en el marcador»)
- `CLAUDE.md` (el estado de la fase 4 dice «cámara lenta y foco en el rey que cae»)

Fuera: código del juego.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-SENSACION-001 | En directo: confeti y calavera en el marcador; la cámara sigue en plano general (D-060) |
| FEAT-REPLAY-001 | La cámara lenta y el plano cercano del rey van en la fase `replay`, al acabar el impacto |

- Antes de escribir, comprobar en el código qué efectos quedan en directo al caer un rey (`client/src/game/view.ts`, `render/fx.ts`), para no cambiar un error por otro.

## Acceptance Criteria

- [x] El README no dice que haya cámara lenta en directo y menciona la repetición al acabar la ronda.
- [x] `CLAUDE.md` describe la fase 4 sin «foco en el rey que cae» en directo.
- [x] Ninguna otra frase del README contradice D-060 o D-061 (búsqueda de «cámara lenta» y «lenta»).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | — |
| Integration | — |
| Manual | Leer el README contra una partida en `/#solo` con `?fast=1` |

## Evidence

- `README.md`: la eliminación se ve al momento con confeti, un rótulo y la calavera, y al acabar la ronda hay repetición a cámara lenta. Ya no dice que haya cámara lenta en directo.
- `CLAUDE.md` ya no hablaba de la fase 4: se reescribió al adoptar KDD.
- Búsqueda de «lenta» en README y «Cómo se juega»: no queda ninguna contradicción con D-060 ni con D-061.
